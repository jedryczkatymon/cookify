import FirecrawlApp from "@mendable/firecrawl-js"

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

export type ScrapeRecipeResult = {
	markdown: string
	rawHtml?: string
}

export async function scrapeRecipeUrl(
	url: string,
): Promise<ScrapeRecipeResult> {
	const scrapeResult = await app.scrape(url, {
		formats: ["markdown", "rawHtml"],
	})

	if (!scrapeResult.markdown) {
		throw new Error(`Failed to scrape: ${scrapeResult}`)
	}

	return {
		markdown: scrapeResult.markdown,
		rawHtml: scrapeResult.rawHtml ?? undefined,
	}
}
