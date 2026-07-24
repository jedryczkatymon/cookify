type JsonLdNode = Record<string, unknown>

export type ParsedJsonLdRecipe = {
	name: string
	description?: string
	prepTime?: number
	cookTime?: number
	calories?: number
	servings?: number
	notes?: string
	ingredients: string[]
	steps: string[]
	tags?: { name: string }[]
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
	if (value == null) return []
	return Array.isArray(value) ? value : [value]
}

function isRecipeType(type: unknown): boolean {
	return asArray(type).some(
		(t) => typeof t === "string" && /(^|\/)Recipe$/i.test(t),
	)
}

function collectNodes(value: unknown, out: JsonLdNode[] = []): JsonLdNode[] {
	if (value == null) return out
	if (Array.isArray(value)) {
		for (const item of value) collectNodes(item, out)
		return out
	}
	if (typeof value !== "object") return out

	const node = value as JsonLdNode
	out.push(node)

	if (node["@graph"] != null) collectNodes(node["@graph"], out)
	if (node.mainEntity != null) collectNodes(node.mainEntity, out)
	if (node.mainEntityOfPage != null) collectNodes(node.mainEntityOfPage, out)

	return out
}

/** Parse ISO-8601 durations like PT1H30M into total minutes. */
function parseIsoDurationToMinutes(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value
	if (typeof value !== "string") return undefined

	const trimmed = value.trim()
	if (!trimmed) return undefined

	const asNumber = Number(trimmed)
	if (Number.isFinite(asNumber)) return asNumber

	const match = trimmed.match(
		/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i,
	)
	if (!match) return undefined

	const days = Number(match[1] ?? 0)
	const hours = Number(match[2] ?? 0)
	const minutes = Number(match[3] ?? 0)
	const seconds = Number(match[4] ?? 0)
	const total = days * 24 * 60 + hours * 60 + minutes + Math.round(seconds / 60)
	return total > 0 ? total : undefined
}

function textFromNode(value: unknown): string {
	if (value == null) return ""
	if (typeof value === "string") return value.trim()
	if (typeof value === "number") return String(value)
	if (Array.isArray(value)) {
		return value.map(textFromNode).filter(Boolean).join("\n")
	}
	if (typeof value === "object") {
		const obj = value as JsonLdNode
		return (
			textFromNode(obj.text) ||
			textFromNode(obj.name) ||
			textFromNode(obj.description) ||
			""
		)
	}
	return ""
}

function extractIngredients(recipe: JsonLdNode): string[] {
	return asArray(recipe.recipeIngredient)
		.map((ing) => textFromNode(ing))
		.filter(Boolean)
}

function extractSteps(recipe: JsonLdNode): string[] {
	const instructions = recipe.recipeInstructions
	if (!instructions) return []

	const steps: string[] = []

	for (const item of asArray(instructions)) {
		if (typeof item === "string") {
			const text = item.trim()
			if (text) steps.push(text)
			continue
		}
		if (typeof item !== "object" || item == null) continue

		const node = item as JsonLdNode
		const type = asArray(node["@type"]).join(" ")

		if (/HowToSection/i.test(type) && Array.isArray(node.itemListElement)) {
			for (const el of node.itemListElement) {
				const text = textFromNode(el)
				if (text) steps.push(text)
			}
			continue
		}

		if (/HowToStep|HowToTip/i.test(type) || node.text || node.name) {
			const text = textFromNode(node)
			if (text) steps.push(text)
		}
	}

	return steps
}

function extractServings(recipe: JsonLdNode): number | undefined {
	const yieldValue = recipe.recipeYield ?? recipe.yield
	if (typeof yieldValue === "number") return yieldValue
	if (typeof yieldValue === "string") {
		const match = yieldValue.match(/[\d]+([.,][\d]+)?/)
		if (match) return parseFloat(match[0].replace(",", "."))
	}
	if (Array.isArray(yieldValue) && yieldValue.length > 0) {
		return extractServings({ recipeYield: yieldValue[0] })
	}
	return undefined
}

function extractCalories(recipe: JsonLdNode): number | undefined {
	const nutrition = recipe.nutrition
	if (typeof nutrition !== "object" || nutrition == null) return undefined
	const calories = (nutrition as JsonLdNode).calories
	if (typeof calories === "number") return calories
	if (typeof calories === "string") {
		const match = calories.match(/[\d]+([.,][\d]+)?/)
		if (match) return parseFloat(match[0].replace(",", "."))
	}
	return undefined
}

function extractTags(recipe: JsonLdNode): { name: string }[] | undefined {
	const tags = new Set<string>()

	for (const value of [
		...asArray(recipe.recipeCategory),
		...asArray(recipe.recipeCuisine),
		...asArray(recipe.keywords),
	]) {
		if (typeof value !== "string") continue
		for (const part of value.split(/[,;]/)) {
			const name = part.trim()
			if (name) tags.add(name)
		}
	}

	if (tags.size === 0) return undefined
	return [...tags].map((name) => ({ name }))
}

function mapRecipeNode(recipe: JsonLdNode): ParsedJsonLdRecipe | null {
	const name = textFromNode(recipe.name)
	const ingredients = extractIngredients(recipe)
	const steps = extractSteps(recipe)

	if (!name || ingredients.length === 0 || steps.length === 0) return null

	const description = textFromNode(recipe.description) || undefined

	return {
		name,
		description,
		prepTime:
			parseIsoDurationToMinutes(recipe.prepTime) ??
			parseIsoDurationToMinutes(recipe.totalTime),
		cookTime: parseIsoDurationToMinutes(recipe.cookTime),
		calories: extractCalories(recipe),
		servings: extractServings(recipe),
		notes: description,
		ingredients,
		steps,
		tags: extractTags(recipe),
	}
}

function extractJsonLdScripts(html: string): string[] {
	const scripts: string[] = []
	const re =
		/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
	for (const match of html.matchAll(re)) {
		const body = match[1]?.trim()
		if (body) scripts.push(body)
	}
	return scripts
}

/**
 * Extract a schema.org Recipe from page HTML JSON-LD, if complete enough
 * (name + ingredients + steps).
 */
export function parseRecipeJsonLd(
	html: string | null | undefined,
): ParsedJsonLdRecipe | null {
	if (!html) return null

	for (const script of extractJsonLdScripts(html)) {
		try {
			const parsed: unknown = JSON.parse(script)
			for (const node of collectNodes(parsed)) {
				if (!isRecipeType(node["@type"])) continue
				const recipe = mapRecipeNode(node)
				if (recipe) return recipe
			}
		} catch {
			// Ignore malformed JSON-LD blocks
		}
	}

	return null
}
