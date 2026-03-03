import { z } from "zod"

// Helper: Safely parse a number from various formats
// Handles: 20, "20", "20 mins", "about 20", "", null, undefined
const safeParseNumber = (val: unknown): number | undefined => {
	if (val === null || val === undefined || val === "") return undefined
	if (typeof val === "number") return Number.isNaN(val) ? undefined : val

	if (typeof val === "string") {
		// Extract first number found in string (e.g., "approx 20 mins" -> 20)
		const match = val.match(/[\d]+([.,][\d]+)?/)
		if (match) {
			const num = parseFloat(match[0].replace(",", "."))
			return Number.isNaN(num) ? undefined : num
		}
	}
	return undefined
}

// Helper: Parse ingredient strings
function parseIngredientString(str: string) {
	// Regex: Start with Number + (Optional Unit) + Product
	// e.g. "1 kg potatoes", "2 eggs", "salt"
	const match = str.match(/^([\d.,]+)\s*([a-zA-Ząćęłńóśźż]{1,10}\.?\s+)?(.*)$/)

	if (match?.[1]) {
		return {
			amount: safeParseNumber(match[1]),
			unit: match[2]?.trim() || undefined,
			product: match[3] || match[2] || str,
		}
	}

	// Fallback: The whole string is the product
	return {
		amount: undefined,
		unit: undefined,
		product: str,
	}
}

// 1. BASE SCHEMA: Strict structure for the frontend form
export const baseRecipeSchema = z.object({
	name: z.string().default("Untitled Recipe"),
	description: z.string().optional().default(""),

	// Use z.coerce.number() to safely cast valid string numbers that bypass preprocessing
	prepTime: z.coerce.number().nullish(),
	cookTime: z.coerce.number().nullish(),
	calories: z.coerce.number().nullish(),
	servings: z.coerce.number().nullish(),

	notes: z
		.union([z.string(), z.array(z.string()), z.null()])
		.nullish()
		.transform((val) => {
			if (Array.isArray(val)) return val.join("\n")
			return val || ""
		}),

	ingredients: z
		.array(
			z.object({
				product: z.string(),
				amount: z.coerce.number().nullish(), // Coerce nested numbers too
				unit: z.string().nullish(),
			}),
		)
		.default([]),

	tags: z.array(z.object({ name: z.string() })).optional(),

	steps: z
		.union([
			z.string(),
			z.array(z.string()),
			// Handle verbose objects: { text: "...", name: "Step 1" }
			z.array(
				z
					.object({
						text: z.string().nullish(),
						name: z.string().nullish(),
						description: z.string().nullish(),
					})
					.passthrough(),
			),
		])
		.nullish()
		.transform((val) => {
			if (!val) return ""

			if (Array.isArray(val)) {
				if (val.length > 0 && typeof val[0] === "string") {
					return (val as string[]).join("\n\n")
				}
				return val
					.map(
						(v: {
							text?: string | null
							description?: string | null
							name?: string | null
						}) => v.text || v.description || v.name || "",
					)
					.filter((t) => t.trim().length > 0)
					.join("\n\n")
			}

			return String(val)
		}),
})

// 2. PREPROCESSED SCHEMA: For API/Backend parsing of messy data
export const recipeSchema = z.preprocess((val) => {
	if (typeof val !== "object" || val === null) return val

	const data = val as Record<string, unknown>
	const normalized = { ...data }

	// --- 1. KEY NORMALIZATION (Handle Synonyms) ---
	if (!normalized.steps) {
		normalized.steps =
			data.instructions ||
			data.recipeInstructions ||
			data.method ||
			data.preparation ||
			data.directions
	}

	if (!normalized.ingredients) {
		normalized.ingredients =
			data.recipeIngredient || data.components || data.recipeIngredients
	}

	if (!normalized.servings) {
		normalized.servings = data.recipeYield || data.yield || data.portionSize
	}

	if (!normalized.notes) {
		normalized.notes = data.recipeNotes || data.description
	}

	// --- 2. VALUE SANITIZATION ---
	normalized.prepTime = safeParseNumber(data.prepTime)
	normalized.cookTime = safeParseNumber(data.cookTime)
	// Removed totalTime assignment if it isn't in base schema, or add it to base schema if needed
	normalized.calories = safeParseNumber(data.calories)
	normalized.servings = safeParseNumber(normalized.servings)

	if (Array.isArray(normalized.ingredients)) {
		normalized.ingredients = normalized.ingredients.map((ing: unknown) => {
			if (typeof ing === "string") {
				return parseIngredientString(ing)
			}
			if (typeof ing === "object" && ing !== null) {
				const ingObj = ing as Record<string, unknown>
				return {
					amount: safeParseNumber(ingObj.amount),
					unit:
						typeof ingObj.unit === "string" ? ingObj.unit.trim() : undefined,
					product: String(
						ingObj.product || ingObj.name || "Unknown Ingredient",
					).trim(),
				}
			}
			return {
				product: "Unknown Ingredient",
				amount: undefined,
				unit: undefined,
			}
		})
	}

	return normalized
}, baseRecipeSchema)
