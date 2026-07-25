export type ShoppingIngredientLine = {
	key: string
	product: string
	amount: number | null
	unit: string | null
	label: string
}

export type ShoppingDayGroup = {
	date: string
	lines: ShoppingIngredientLine[]
}

type IngredientInput = {
	product: string | null
	amount: number | null
	unit: string | null
}

type MealPlanIngredientSource = {
	date: string
	servings: number | null
	recipe: {
		servings: number | null
		ingredients: IngredientInput[]
	}
}

function formatAmount(amount: number): string {
	if (Number.isInteger(amount)) return String(amount)
	return String(Math.round(amount * 100) / 100)
}

function lineLabel(
	product: string,
	amount: number | null,
	unit: string | null,
): string {
	if (amount == null && !unit) return product
	if (amount == null) return `${product} (${unit})`
	if (!unit) return `${formatAmount(amount)} ${product}`
	return `${formatAmount(amount)} ${unit} ${product}`
}

function aggregateDayLines(
	date: string,
	entries: MealPlanIngredientSource[],
): ShoppingIngredientLine[] {
	type Acc = {
		product: string
		amount: number | null
		unit: string | null
		hasAmount: boolean
	}
	const map = new Map<string, Acc>()

	for (const entry of entries) {
		const recipeServings =
			entry.recipe.servings && entry.recipe.servings > 0
				? entry.recipe.servings
				: 1
		const plannedServings =
			entry.servings && entry.servings > 0 ? entry.servings : recipeServings
		const scale = plannedServings / recipeServings

		for (const ing of entry.recipe.ingredients) {
			const product = ing.product?.trim()
			if (!product) continue

			const unit = ing.unit?.trim() || null
			const scaledAmount =
				ing.amount != null && Number.isFinite(ing.amount)
					? ing.amount * scale
					: null

			const mergeKey = `${product.toLowerCase()}::${(unit ?? "").toLowerCase()}`
			const existing = map.get(mergeKey)

			if (!existing) {
				map.set(mergeKey, {
					product,
					amount: scaledAmount,
					unit,
					hasAmount: scaledAmount != null,
				})
				continue
			}

			if (
				scaledAmount != null &&
				existing.hasAmount &&
				existing.amount != null
			) {
				existing.amount += scaledAmount
			} else if (scaledAmount != null && !existing.hasAmount) {
				existing.amount = scaledAmount
				existing.hasAmount = true
			}
		}
	}

	const lines: ShoppingIngredientLine[] = [...map.entries()].map(
		([mergeKey, value]) => ({
			key: `${date}::${mergeKey}`,
			product: value.product,
			amount: value.amount,
			unit: value.unit,
			label: lineLabel(value.product, value.amount, value.unit),
		}),
	)

	lines.sort((a, b) =>
		a.product.localeCompare(b.product, undefined, { sensitivity: "base" }),
	)
	return lines
}

/** Aggregate ingredients per planned day (no cross-day merging). */
export function aggregateShoppingIngredientsByDay(
	entries: MealPlanIngredientSource[],
): ShoppingDayGroup[] {
	const byDate = new Map<string, MealPlanIngredientSource[]>()

	for (const entry of entries) {
		const list = byDate.get(entry.date) ?? []
		list.push(entry)
		byDate.set(entry.date, list)
	}

	const days = [...byDate.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, dayEntries]) => ({
			date,
			lines: aggregateDayLines(date, dayEntries),
		}))
		.filter((day) => day.lines.length > 0)

	return days
}
