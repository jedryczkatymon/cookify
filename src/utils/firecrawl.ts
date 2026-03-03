import FirecrawlApp from "@mendable/firecrawl-js"

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY })

export async function scrapeRecipeUrl(url: string) {
	const scrapeResult = await app.scrape(url, {
		formats: ["markdown"],
	})

	if (!scrapeResult.markdown) {
		throw new Error(`Failed to scrape: ${scrapeResult}`)
	}

	return scrapeResult.markdown
}
