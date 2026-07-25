"use client"

import { MealAddTile, MealSlot } from "@/components/meal-plan/meal-slot"
import type { MealPlanEntryView } from "@/components/meal-plan/types"
import {
	formatDayColumnHeading,
	formatDayHeading,
} from "@/lib/meal-plan-week"

export function DaySection({
	date,
	entries,
	onAdd,
	onChange,
	onRemove,
	removingId,
}: {
	date: string
	entries: MealPlanEntryView[]
	onAdd: (date: string) => void
	onChange: (entry: MealPlanEntryView) => void
	onRemove: (entryId: number) => void
	removingId: number | null
}) {
	const headingDate = new Date(`${date}T00:00:00.000Z`)

	return (
		<section className="min-w-0 space-y-2">
			<h2
				className="truncate font-semibold text-sm tracking-tight"
				title={formatDayHeading(headingDate)}
			>
				{formatDayColumnHeading(headingDate)}
			</h2>
			<div className="space-y-2">
				{entries.map((entry) => (
					<MealSlot
						key={entry.id}
						entry={entry}
						onChange={() => onChange(entry)}
						onRemove={() => onRemove(entry.id)}
						removing={removingId === entry.id}
					/>
				))}
				<MealAddTile onAdd={() => onAdd(date)} />
			</div>
		</section>
	)
}
