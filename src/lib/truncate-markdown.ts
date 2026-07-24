const DEFAULT_MAX_CHARS = 8000

/** Truncate scraped markdown to keep LLM prompts small and fast. */
export function truncateMarkdown(
	markdown: string,
	maxChars = DEFAULT_MAX_CHARS,
): string {
	if (markdown.length <= maxChars) return markdown
	return `${markdown.slice(0, maxChars)}\n\n[Content truncated]`
}
