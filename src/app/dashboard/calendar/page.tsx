import { MealPlanWeekView } from "@/components/meal-plan/meal-plan-week-view"
import type { MealPlanEntryView } from "@/components/meal-plan/types"
import { getUserMealPlan } from "@/lib/get-meal-plan"
import { getWeekRange, toDateString } from "@/lib/meal-plan-week"

type PageProps = {
	searchParams: Promise<{ week?: string }>
}

export default async function CalendarPage({ searchParams }: PageProps) {
	const params = await searchParams
	const week = getWeekRange(params.week)
	const rawEntries = await getUserMealPlan(week.startStr, week.endStr)

	const entries: MealPlanEntryView[] = rawEntries.map((entry) => ({
		id: entry.id,
		date: toDateString(entry.date),
		order: entry.order,
		servings: entry.servings,
		recipeId: entry.recipeId,
		recipe: {
			id: entry.recipe.id,
			slug: entry.recipe.slug,
			name: entry.recipe.name,
			prepTime: entry.recipe.prepTime,
			calories: entry.recipe.calories,
			servings: entry.recipe.servings,
			category: entry.recipe.category,
			uploads: entry.recipe.uploads,
		},
	}))

	return (
		<div className="mx-auto w-4/5 space-y-6">
			<h1 className="font-bold text-2xl tracking-tight">Calendar</h1>
			<MealPlanWeekView
				weekStart={week.startStr}
				weekEnd={week.endStr}
				dayStrings={week.days.map(toDateString)}
				entries={entries}
			/>
		</div>
	)
}
