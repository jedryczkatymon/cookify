/** Split recipe step text on blank lines and numbered lists (1. 2. 3.). */
export function splitStepsText(text: string): string[] {
	const trimmed = text.trim()
	if (!trimmed) return []

	let parts = trimmed
		.split(/\n\s*\n/)
		.map((s) => s.trim())
		.filter(Boolean)

	if (parts.length === 1) {
		const single = parts[0] ?? ""
		if (/\b\d+\.\s/.test(single)) {
			parts = single
				.split(/(?=\b\d+\.\s)/)
				.map((s) => s.trim())
				.filter(Boolean)
		}
	}

	return parts.map((s) => s.replace(/^\d+\.\s*/, "").trim()).filter(Boolean)
}

/** Normalize form/API steps input into a clean string array. */
export function normalizeStepsInput(steps: unknown): string[] {
	if (Array.isArray(steps)) {
		return steps
			.flatMap((item) => {
				if (typeof item === "string") return splitStepsText(item)
				if (item && typeof item === "object" && "content" in item) {
					const content = (item as { content?: unknown }).content
					return splitStepsText(String(content ?? ""))
				}
				return []
			})
			.filter(Boolean)
	}

	if (typeof steps === "string") {
		return splitStepsText(steps)
	}

	return []
}
