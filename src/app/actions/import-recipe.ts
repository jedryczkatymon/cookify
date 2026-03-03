"use server"

import { generateText, Output } from "ai"
import { recipeSchema } from "@/lib/schemas"
import { scrapeRecipeUrl } from "@/utils/firecrawl"

export async function importRecipeAction(url: string) {
	try {
		const markdown = await scrapeRecipeUrl(url)

		const { output } = await generateText({
			model: "deepseek/deepseek-v3.1",
			prompt: `
        You are an expert recipe parser. 
        Extract the recipe information from the following markdown content.
        
        IMPORTANT RULES:
        1. For 'prepTime', 'calories', and 'amount', return ONLY numbers (e.g., 20, not "20 min").
        2. Flatten any complex instruction objects into a single text block.
        
        Markdown Content:
        ${markdown}
      `,

			output: Output.object({
				schema: recipeSchema,
			}),
		})

		return { success: true, data: output }
	} catch (error) {
		console.error("Import failed:", error)
		return { success: false, error: "Failed to import recipe" }
	}
}
