"use server"

import { generateText, Output } from "ai"
import { gateway } from "@/lib/ai-gateway"
import { enrichIngredientsWithSections } from "@/lib/parse-ingredient-sections"
import { parseRecipeJsonLd } from "@/lib/parse-recipe-jsonld"
import { recipeLlmSchema, recipeSchema } from "@/lib/schemas"
import { truncateMarkdown } from "@/lib/truncate-markdown"
import { scrapeRecipeUrl } from "@/utils/firecrawl"

export async function importRecipeAction(url: string) {
	try {
		const { markdown, rawHtml } = await scrapeRecipeUrl(url)

		const fromJsonLd = parseRecipeJsonLd(rawHtml)
		if (fromJsonLd) {
			const parsed = recipeSchema.parse(fromJsonLd)
			const data = {
				...parsed,
				ingredients: enrichIngredientsWithSections(
					parsed.ingredients,
					markdown,
				),
			}
			return { success: true, data }
		}

		const { output } = await generateText({
			model: gateway("google/gemini-2.5-flash"),
			maxRetries: 2,
			providerOptions: {
				gateway: {
					models: ["openai/gpt-4.1-mini", "openai/gpt-4o-mini"],
				},
			},
			prompt: `
        You are an expert recipe parser. 
        Extract the recipe information from the following markdown content.
        
        IMPORTANT RULES:
        1. For 'prepTime', 'cookTime', 'calories', 'servings', and ingredient 'amount', return ONLY numbers (e.g., 20, not "20 min").
        2. Flatten any complex instruction objects into plain step strings.
        3. Prefer the main recipe; ignore ads, navigation, and related recipes.
        4. If ingredients are grouped under headings (e.g. Naleśniki, Nadzienie), set each ingredient's 'section' to that heading.
        
        Markdown Content:
        ${truncateMarkdown(markdown)}
      `,

			output: Output.object({
				schema: recipeLlmSchema,
			}),
		})

		const parsed = recipeSchema.parse(output)
		const data = {
			...parsed,
			ingredients: enrichIngredientsWithSections(parsed.ingredients, markdown),
		}
		return { success: true, data }
	} catch (error) {
		console.error("Import failed:", error)
		return { success: false, error: "Failed to import recipe" }
	}
}
