import { auth } from "@clerk/nextjs/server"
import { ShoppingList } from "@/components/meal-plan/shopping-list"
import { aggregateShoppingIngredientsByDay } from "@/lib/aggregate-shopping-ingredients"
import { getUserMealPlanWithIngredients } from "@/lib/get-meal-plan"
import {
	formatWeekLabel,
	getWeekRange,
	parseDateString,
	toDateString,
} from "@/lib/meal-plan-week"
import { mealPlanRangeSchema } from "@/lib/schemas"
import { getShoppingChecksMap } from "@/lib/shopping-check-mutations"

type PageProps = {
	searchParams: Promise<{ from?: string; to?: string; week?: string }>
}

export default async function ShoppingPage({ searchParams }: PageProps) {
	const params = await searchParams

	let from = params.from
	let to = params.to

	if (!from || !to) {
		const week = getWeekRange(params.week ?? from ?? to)
		from = week.startStr
		to = week.endStr
	} else {
		const parsed = mealPlanRangeSchema.safeParse({ from, to })
		if (!parsed.success) {
			const week = getWeekRange()
			from = week.startStr
			to = week.endStr
		}
	}

	const entries = await getUserMealPlanWithIngredients(from, to)
	const days = aggregateShoppingIngredientsByDay(
		entries.map((entry) => ({
			date: toDateString(entry.date),
			servings: entry.servings,
			recipe: {
				servings: entry.recipe.servings,
				ingredients: entry.recipe.ingredients,
			},
		})),
	)

	const { userId } = await auth()
	const initialChecked = userId
		? await getShoppingChecksMap(userId, from, to)
		: {}

	const weekLabel = formatWeekLabel(parseDateString(from), parseDateString(to))

	return (
		<div className="mx-auto w-4/5 space-y-6">
			<h1 className="font-bold text-2xl tracking-tight">Shopping</h1>
			<ShoppingList
				key={`${from}-${to}`}
				from={from}
				to={to}
				weekLabel={weekLabel}
				days={days}
				initialChecked={initialChecked}
			/>
		</div>
	)
}
