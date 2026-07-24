export type MarkdownIngredientGroup = {
	section: string
	lines: string[]
}

type ParsedTableIngredient = {
	product: string
	amount?: number
	unit?: string
	section: string
}

function normalizeForMatch(value: string): string {
	return value
		.toLowerCase()
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.replace(/[^a-z0-9ąćęłńóśźż\s]/gi, " ")
		.replace(/\s+/g, " ")
		.trim()
}

function cleanCell(value: string): string {
	return value
		.replace(/<br\s*\/?>[\s\S]*/gi, " ")
		.replace(/!\[.*?\]\(.*?\)/g, "")
		.replace(/\[.*?\]\(.*?\)/g, "")
		.replace(/\s+/g, " ")
		.trim()
}

function parseAmountUnitCell(cell: string): {
	amount?: number
	unit?: string
} {
	const cleaned = cleanCell(cell)
	if (!cleaned) return {}

	const withAmount = cleaned.match(/^([\d.,]+)\s*(.*)$/)
	if (withAmount?.[1]) {
		const amount = parseFloat(withAmount[1].replace(",", "."))
		const unit = withAmount[2]?.trim() || undefined
		return {
			amount: Number.isFinite(amount) ? amount : undefined,
			unit: unit || undefined,
		}
	}

	return { unit: cleaned }
}

function parseTableIngredientRow(
	line: string,
): { product: string; amount?: number; unit?: string } | null {
	const match = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|?\s*$/)
	if (!match?.[1] || !match[2]) return null

	const product = cleanCell(match[1])
	const amountCell = match[2]
	if (!product) return null
	if (/^[-:|\s]+$/.test(product) || product === "---") return null
	if (/^[-:|\s]+$/.test(cleanCell(amountCell))) return null

	return {
		product,
		...parseAmountUnitCell(amountCell),
	}
}

/**
 * Walk Firecrawl markdown and collect ingredient table rows under section
 * headers (e.g. "Naleśniki:", "Nadzienie"), preserving source order.
 */
export function groupMarkdownIngredientsBySection(
	markdown: string,
): MarkdownIngredientGroup[] {
	const groups: MarkdownIngredientGroup[] = []
	let current: MarkdownIngredientGroup | null = null

	for (const raw of markdown.split(/\r?\n/)) {
		const line = raw.trim()
		if (!line) continue

		const headerLine = line
			.replace(/^[-*•]\s+/, "")
			.replace(/^\*{1,2}|\*{1,2}$/g, "")
			.trim()

		const headerMatch = headerLine.match(
			/^(?:#{1,6}\s*)?([A-Za-zÀ-ÿĄĆĘŁŃÓŚŹŻąćęłńóśźż][^:\d]{0,48}?)\s*:?\s*$/u,
		)
		if (
			headerMatch?.[1] &&
			!/\d/.test(headerMatch[1]) &&
			headerMatch[1].trim().length >= 2 &&
			headerMatch[1].trim().length <= 40 &&
			!/składniki|ingredients|przepis|przygotow/i.test(headerMatch[1])
		) {
			const title = headerMatch[1].trim().replace(/\.+$/, "")
			current = { section: title, lines: [] }
			groups.push(current)
			continue
		}

		if (!current) continue

		const tableRow = parseTableIngredientRow(line)
		if (tableRow) {
			current.lines.push(line)
		}
	}

	return groups.filter((g) => g.lines.length > 0)
}

/** Build ordered ingredients directly from markdown ingredient tables. */
export function ingredientsFromMarkdownTables(
	markdown: string,
): ParsedTableIngredient[] {
	const out: ParsedTableIngredient[] = []

	for (const group of groupMarkdownIngredientsBySection(markdown)) {
		for (const line of group.lines) {
			const row = parseTableIngredientRow(line)
			if (!row) continue
			out.push({
				product: row.product,
				amount: row.amount,
				unit: row.unit,
				section: group.section,
			})
		}
	}

	return out
}

type IngredientWithSection = {
	product: string
	amount?: number | null
	unit?: string | null
	section?: string | null
	[key: string]: unknown
}

/**
 * Prefer markdown table order+sections when available; otherwise assign
 * sections onto existing ingredients and sort by markdown line order.
 */
export function enrichIngredientsWithSections<T extends IngredientWithSection>(
	ingredients: T[],
	markdown: string,
): Array<T | ParsedTableIngredient> {
	const fromTables = ingredientsFromMarkdownTables(markdown)
	if (fromTables.length > 0) {
		return fromTables
	}

	const groups = groupMarkdownIngredientsBySection(markdown)
	if (groups.length === 0) return ingredients

	const used = new Set<string>()
	const withMeta = ingredients.map((ing) => {
		if (ing.section?.trim()) {
			return {
				ing,
				section: ing.section.trim(),
				order: Number.MAX_SAFE_INTEGER,
			}
		}
		const product = normalizeForMatch(ing.product)
		if (!product)
			return {
				ing,
				section: null as string | null,
				order: Number.MAX_SAFE_INTEGER,
			}

		let best: {
			key: string
			section: string
			order: number
			score: number
		} | null = null

		let orderBase = 0
		for (let gi = 0; gi < groups.length; gi++) {
			const group = groups[gi]
			if (!group) continue
			for (let li = 0; li < group.lines.length; li++) {
				const key = `${gi}:${li}`
				if (used.has(key)) continue
				const row = parseTableIngredientRow(group.lines[li] ?? "")
				const normalizedLine = normalizeForMatch(
					row?.product ?? group.lines[li] ?? "",
				)
				if (!normalizedLine) continue

				let score = 0
				if (normalizedLine.includes(product)) score = product.length + 10
				else if (
					product
						.split(" ")
						.filter(Boolean)
						.every((part) => normalizedLine.includes(part))
				) {
					score = product.length
				}
				if (score > 0 && (!best || score > best.score)) {
					best = {
						key,
						section: group.section,
						order: orderBase + li,
						score,
					}
				}
			}
			orderBase += group.lines.length + 10
		}

		if (!best) {
			return {
				ing,
				section: null as string | null,
				order: Number.MAX_SAFE_INTEGER,
			}
		}
		used.add(best.key)
		return {
			ing: { ...ing, section: best.section },
			section: best.section,
			order: best.order,
		}
	})

	return withMeta.sort((a, b) => a.order - b.order).map(({ ing }) => ing)
}

// Backwards-compatible exports used by older call sites / tests
export function assignIngredientSections<T extends IngredientWithSection>(
	ingredients: T[],
	markdown: string,
): T[] {
	return enrichIngredientsWithSections(ingredients, markdown) as T[]
}

export function reorderIngredientsBySection<T extends IngredientWithSection>(
	ingredients: T[],
	_markdown: string,
): T[] {
	return ingredients
}
