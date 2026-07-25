"use client"

import { MoreHorizontal, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { MealPlanEntryView } from "@/components/meal-plan/types"
import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function MealAddTile({ onAdd }: { onAdd: () => void }) {
	return (
		<button
			type="button"
			onClick={onAdd}
			className="flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-2 py-3 text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/40 hover:text-foreground"
		>
			<span className="flex size-8 shrink-0 items-center justify-center rounded bg-muted">
				<Plus className="size-4" />
			</span>
			<span className="font-medium text-foreground text-xs">Add</span>
		</button>
	)
}

export function MealSlot({
	entry,
	onChange,
	onRemove,
	removing,
}: {
	entry: MealPlanEntryView
	onChange: () => void
	onRemove: () => void
	removing?: boolean
}) {
	const recipe = entry.recipe
	const servings =
		(entry.servings ?? recipe.servings ?? 1) > 0
			? (entry.servings ?? recipe.servings ?? 1)
			: 1
	const kcal =
		recipe.calories != null ? Math.round(recipe.calories / servings) : null
	const category = recipe.category?.trim() || "Uncategorized"

	return (
		<div className="relative w-full overflow-hidden rounded-md border bg-white shadow-sm">
			<div className="absolute top-1 right-1 z-10">
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="secondary"
							size="icon-sm"
							disabled={removing}
							aria-label={`Options for ${recipe.name}`}
							className="size-7 bg-white/90 shadow-sm backdrop-blur-sm"
						>
							<MoreHorizontal className="size-4" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onSelect={onChange}>
							Change recipe
						</DropdownMenuItem>
						<DropdownMenuItem
							variant="destructive"
							onSelect={onRemove}
							disabled={removing}
						>
							<Trash2 className="size-4" />
							Remove
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<Link
				href={`/dashboard/recipe/${recipe.slug}`}
				className="relative block aspect-[4/3] w-full bg-muted"
			>
				{recipe.uploads?.url ? (
					<Image
						src={recipe.uploads.url}
						alt=""
						fill
						className="object-cover"
						sizes="(max-width: 768px) 80vw, 12vw"
					/>
				) : null}
			</Link>
			<div className="space-y-0.5 p-2">
				<p className="truncate text-muted-foreground text-xs">{category}</p>
				<Link
					href={`/dashboard/recipe/${recipe.slug}`}
					className="block truncate font-medium text-sm hover:underline"
				>
					{recipe.name}
				</Link>
				<p className="truncate text-muted-foreground text-xs">
					{recipe.prepTime ?? "—"} min · {kcal ?? "—"} kcal
				</p>
			</div>
		</div>
	)
}
