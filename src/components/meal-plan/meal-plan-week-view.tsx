import {
	CalendarDays,
	ChevronLeft,
	ChevronRight,
	ShoppingCart,
} from "lucide-react"
import Link from "next/link"
import {
	MealPlanCopyWeekButton,
	MealPlanWeekInteractive,
} from "@/components/meal-plan/meal-plan-week-interactive"
import type { MealPlanEntryView } from "@/components/meal-plan/types"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { getRecipesForPicker } from "@/lib/get-recipes-for-picker"
import { addDays, formatWeekLabel, toDateString } from "@/lib/meal-plan-week"

export async function MealPlanWeekView({
	weekStart,
	weekEnd,
	dayStrings,
	entries,
}: {
	weekStart: string
	weekEnd: string
	dayStrings: string[]
	entries: MealPlanEntryView[]
}) {
	const initialRecipes = await getRecipesForPicker()
	const mealCount = entries.length
	const prevWeek = toDateString(
		addDays(new Date(`${weekStart}T00:00:00.000Z`), -7),
	)
	const nextWeek = toDateString(
		addDays(new Date(`${weekStart}T00:00:00.000Z`), 7),
	)
	const weekLabel = formatWeekLabel(
		new Date(`${weekStart}T00:00:00.000Z`),
		new Date(`${weekEnd}T00:00:00.000Z`),
	)
	const shoppingHref = `/dashboard/shopping?from=${weekStart}&to=${weekEnd}`

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon-sm" asChild>
						<Link
							href={`/dashboard/calendar?week=${prevWeek}`}
							aria-label="Previous week"
						>
							<ChevronLeft className="size-4" />
						</Link>
					</Button>
					<p className="min-w-[9rem] text-center font-medium text-sm tabular-nums">
						{weekLabel}
					</p>
					<Button variant="ghost" size="icon-sm" asChild>
						<Link
							href={`/dashboard/calendar?week=${nextWeek}`}
							aria-label="Next week"
						>
							<ChevronRight className="size-4" />
						</Link>
					</Button>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<MealPlanCopyWeekButton prevWeek={prevWeek} weekStart={weekStart} />
					<Button variant="outline" size="sm" asChild>
						<Link href={shoppingHref}>
							<ShoppingCart className="size-4" />
							Shopping list
						</Link>
					</Button>
				</div>
			</div>

			<p className="text-muted-foreground text-sm">
				{mealCount === 0
					? "No meals planned this week"
					: `${mealCount} meal${mealCount === 1 ? "" : "s"} planned`}
			</p>

			{mealCount === 0 ? (
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<CalendarDays />
						</EmptyMedia>
						<EmptyTitle>No meals planned yet</EmptyTitle>
						<EmptyDescription>
							Add recipes to any day below — or copy last week to get started.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : null}

			<MealPlanWeekInteractive
				dayStrings={dayStrings}
				entries={entries}
				initialRecipes={initialRecipes}
			/>
		</div>
	)
}
