import { z } from "zod"
import { normalizeStepsInput, splitStepsText } from "@/lib/split-steps"

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

const UNIT_ONLY =
	/^(.*?)\s+(szczypta|szczypty|łyżeczki|łyżeczka|łyżki|łyżka|ząbki|ząbek|szt\.?|opak\.?|dag|kg|g|ml|l)$/iu

// Helper: Parse ingredient strings (amount-first OR product-first Polish style)
function parseIngredientString(str: string) {
	const trimmed = str.trim()
	if (!trimmed) {
		return { amount: undefined, unit: undefined, product: str }
	}

	// Amount-first: "1 kg potatoes", "2 eggs", "600 g spinach"
	if (/^[\d.,]/.test(trimmed)) {
		const withUnit = trimmed.match(
			/^([\d.,]+)\s*([a-zA-Ząćęłńóśźż]{1,15}\.?)\s+(.+)$/u,
		)
		if (withUnit?.[1] && withUnit[3]) {
			return {
				amount: safeParseNumber(withUnit[1]),
				unit: withUnit[2]?.trim() || undefined,
				product: withUnit[3].trim(),
			}
		}
		const amountOnly = trimmed.match(/^([\d.,]+)\s+(.+)$/u)
		if (amountOnly?.[1] && amountOnly[2]) {
			return {
				amount: safeParseNumber(amountOnly[1]),
				unit: undefined,
				product: amountOnly[2].trim(),
			}
		}
	}

	// Product-first with amount+unit: "szpinak 600 g", "masło 1 łyżka", "jaja 2 szt."
	const productFirst = trimmed.match(
		/^(.+?)\s+([\d.,]+)\s*([a-zA-Ząćęłńóśźż]{1,15}\.?)$/u,
	)
	if (productFirst?.[1] && productFirst[2]) {
		return {
			amount: safeParseNumber(productFirst[2]),
			unit: productFirst[3]?.trim() || undefined,
			product: productFirst[1].trim(),
		}
	}

	// Product + unit without numeric amount: "sól szczypta"
	const unitOnly = trimmed.match(UNIT_ONLY)
	if (unitOnly?.[1] && unitOnly[2]) {
		return {
			amount: undefined,
			unit: unitOnly[2].trim(),
			product: unitOnly[1].trim(),
		}
	}

	return {
		amount: undefined,
		unit: undefined,
		product: trimmed,
	}
}

/** Flat schema for LLM structured output — keep simple for speed/reliability. */
export const recipeLlmSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	prepTime: z.number().nullish(),
	cookTime: z.number().nullish(),
	calories: z.number().nullish(),
	servings: z.number().nullish(),
	notes: z.string().nullish(),
	ingredients: z
		.array(
			z.object({
				product: z.string(),
				amount: z.number().nullish(),
				unit: z.string().nullish(),
				section: z.string().nullish(),
			}),
		)
		.default([]),
	steps: z.array(z.string()).default([]),
	tags: z.array(z.object({ name: z.string() })).optional(),
})

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
				section: z.string().nullish(),
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
			if (!val) return [] as string[]

			if (Array.isArray(val)) {
				if (val.length > 0 && typeof val[0] === "string") {
					return (val as string[])
						.flatMap((s) => splitStepsText(s))
						.filter(Boolean)
				}
				return val
					.map(
						(v: {
							text?: string | null
							description?: string | null
							name?: string | null
						}) => v.text || v.description || v.name || "",
					)
					.flatMap((t) => splitStepsText(t))
					.filter(Boolean)
			}

			return normalizeStepsInput(String(val))
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
				const sectionRaw = ingObj.section ?? ingObj.group
				const fromSectionField =
					typeof sectionRaw === "string" && sectionRaw.trim()
						? sectionRaw.trim()
						: undefined
				const hasProduct =
					typeof ingObj.product === "string" && ingObj.product.trim().length > 0
				const nameAsSection =
					hasProduct &&
					typeof ingObj.name === "string" &&
					ingObj.name.trim().length > 0
						? ingObj.name.trim()
						: undefined
				const product = hasProduct
					? String(ingObj.product).trim()
					: typeof ingObj.name === "string" &&
							ingObj.name.trim() &&
							!fromSectionField
						? ingObj.name.trim()
						: "Unknown Ingredient"
				return {
					amount: safeParseNumber(ingObj.amount),
					unit:
						typeof ingObj.unit === "string" ? ingObj.unit.trim() : undefined,
					product,
					section: fromSectionField ?? nameAsSection,
				}
			}
			return {
				product: "Unknown Ingredient",
				amount: undefined,
				unit: undefined,
				section: undefined,
			}
		})
	}

	return normalized
}, baseRecipeSchema)

const isoDateString = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")

export const mealPlanCreateSchema = z.object({
	date: isoDateString,
	recipeId: z.coerce.number().int().positive(),
	servings: z.coerce.number().int().positive().nullish(),
})

export const mealPlanDeleteSchema = z.object({
	id: z.coerce.number().int().positive(),
})

export const mealPlanCopyWeekSchema = z.object({
	fromStart: isoDateString,
	toStart: isoDateString,
})

export const mealPlanRangeSchema = z.object({
	from: isoDateString,
	to: isoDateString,
})
