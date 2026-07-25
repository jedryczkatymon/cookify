"use client"

import { Copy } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"
import { toast } from "sonner"
import {
	addMealPlanEntryAction,
	copyMealPlanWeekAction,
	removeMealPlanEntryAction,
	replaceMealPlanEntryAction,
} from "@/app/actions/meal-plan"
import { DaySection } from "@/components/meal-plan/day-section"
import { RecipePickerDrawer } from "@/components/meal-plan/recipe-picker-drawer"
import type {
	MealPlanEntryView,
	MealPlanRecipe,
} from "@/components/meal-plan/types"
import { Button } from "@/components/ui/button"
import { formatDayHeading } from "@/lib/meal-plan-week"

type PickerState =
	| { mode: "add"; date: string }
	| { mode: "change"; date: string; entryId: number }

export function MealPlanCopyWeekButton({
	prevWeek,
	weekStart,
}: {
	prevWeek: string
	weekStart: string
}) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [copying, setCopying] = useState(false)

	async function handleCopyPreviousWeek() {
		setCopying(true)
		try {
			const result = await copyMealPlanWeekAction({
				fromStart: prevWeek,
				toStart: weekStart,
			})
			if (!result.ok) {
				toast.error(result.error)
				return
			}
			if (result.copied === 0) {
				toast.message("Previous week has no meals to copy")
			} else {
				toast.success(`Copied ${result.copied} meals`)
				startTransition(() => {
					router.refresh()
				})
			}
		} finally {
			setCopying(false)
		}
	}

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={() => void handleCopyPreviousWeek()}
			disabled={copying || isPending}
		>
			<Copy className="size-4" />
			Copy previous week
		</Button>
	)
}

export function MealPlanWeekInteractive({
	dayStrings,
	entries: initialEntries,
	initialRecipes,
}: {
	dayStrings: string[]
	entries: MealPlanEntryView[]
	initialRecipes: MealPlanRecipe[]
}) {
	const router = useRouter()
	const [, startTransition] = useTransition()
	const [entries, setEntries] = useState(initialEntries)
	const [picker, setPicker] = useState<PickerState | null>(null)
	const [removingId, setRemovingId] = useState<number | null>(null)

	useEffect(() => {
		setEntries(initialEntries)
	}, [initialEntries])

	const entriesByDate = useMemo(() => {
		const map = new Map<string, MealPlanEntryView[]>()
		for (const day of dayStrings) {
			map.set(day, [])
		}
		for (const entry of entries) {
			const list = map.get(entry.date) ?? []
			list.push(entry)
			map.set(entry.date, list)
		}
		for (const [day, list] of map) {
			list.sort((a, b) => a.order - b.order || a.id - b.id)
			map.set(day, list)
		}
		return map
	}, [entries, dayStrings])

	function refresh() {
		startTransition(() => {
			router.refresh()
		})
	}

	async function handleSelect(recipe: MealPlanRecipe) {
		if (!picker) return

		if (picker.mode === "change") {
			const result = await replaceMealPlanEntryAction({
				entryId: picker.entryId,
				date: picker.date,
				recipeId: recipe.id,
				servings: recipe.servings,
			})
			if (!result.ok) {
				toast.error(result.error)
				throw new Error("change failed")
			}
			setEntries((prev) => [
				...prev.filter((e) => e.id !== picker.entryId),
				result.entry,
			])
			toast.success("Meal updated")
			refresh()
			return
		}

		const result = await addMealPlanEntryAction({
			date: picker.date,
			recipeId: recipe.id,
			servings: recipe.servings,
		})
		if (!result.ok) {
			toast.error(result.error)
			throw new Error("save failed")
		}
		setEntries((prev) => [...prev, result.entry])
		toast.success("Meal planned")
		refresh()
	}

	async function handleRemove(entryId: number) {
		setRemovingId(entryId)
		try {
			const result = await removeMealPlanEntryAction({ id: entryId })
			if (!result.ok) {
				toast.error(result.error)
				return
			}
			setEntries((prev) => prev.filter((e) => e.id !== entryId))
			toast.success("Meal removed")
			refresh()
		} finally {
			setRemovingId(null)
		}
	}

	return (
		<>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-7 md:gap-3">
				{dayStrings.map((date) => (
					<DaySection
						key={date}
						date={date}
						entries={entriesByDate.get(date) ?? []}
						onAdd={(d) => setPicker({ mode: "add", date: d })}
						onChange={(entry) =>
							setPicker({
								mode: "change",
								date: entry.date,
								entryId: entry.id,
							})
						}
						onRemove={(id) => void handleRemove(id)}
						removingId={removingId}
					/>
				))}
			</div>

			<RecipePickerDrawer
				open={picker !== null}
				onOpenChange={(open) => {
					if (!open) setPicker(null)
				}}
				dateLabel={
					picker
						? formatDayHeading(new Date(`${picker.date}T00:00:00.000Z`))
						: ""
				}
				initialRecipes={initialRecipes}
				onSelect={handleSelect}
			/>
		</>
	)
}
