"use client"

import { Loader2, Search } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { searchRecipesForPickerAction } from "@/app/actions/recipes"
import { RecipePickerItem } from "@/components/meal-plan/recipe-picker-item"
import type { MealPlanRecipe } from "@/components/meal-plan/types"
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { MEALS } from "@/lib/enums"

const ALL_CATEGORIES = "__all__"

export function RecipePickerDrawer({
	open,
	onOpenChange,
	dateLabel,
	initialRecipes,
	onSelect,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	dateLabel: string
	initialRecipes: MealPlanRecipe[]
	onSelect: (recipe: MealPlanRecipe) => Promise<void>
}) {
	const [query, setQuery] = useState("")
	const [debouncedQuery, setDebouncedQuery] = useState("")
	const [category, setCategory] = useState(ALL_CATEGORIES)
	const [recipes, setRecipes] = useState<MealPlanRecipe[]>(initialRecipes)
	const [loading, setLoading] = useState(false)
	const [selectingId, setSelectingId] = useState<number | null>(null)

	useEffect(() => {
		if (!open) {
			setQuery("")
			setDebouncedQuery("")
			setCategory(ALL_CATEGORIES)
			setRecipes(initialRecipes)
			setSelectingId(null)
		}
	}, [open, initialRecipes])

	useEffect(() => {
		const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 250)
		return () => window.clearTimeout(id)
	}, [query])

	const loadRecipes = useCallback(async () => {
		if (!open) return

		const hasFilters = debouncedQuery !== "" || category !== ALL_CATEGORIES

		if (!hasFilters) {
			setRecipes(initialRecipes)
			setLoading(false)
			return
		}

		setLoading(true)
		try {
			const result = await searchRecipesForPickerAction({
				q: debouncedQuery,
				category: category === ALL_CATEGORIES ? null : category,
			})
			if (!result.ok) {
				setRecipes([])
				return
			}
			setRecipes(result.recipes)
		} catch {
			setRecipes([])
		} finally {
			setLoading(false)
		}
	}, [open, debouncedQuery, category, initialRecipes])

	useEffect(() => {
		void loadRecipes()
	}, [loadRecipes])

	async function handleSelect(recipe: MealPlanRecipe) {
		setSelectingId(recipe.id)
		try {
			await onSelect(recipe)
			onOpenChange(false)
		} finally {
			setSelectingId(null)
		}
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="mx-auto max-w-lg">
				<DrawerHeader>
					<DrawerTitle>Add recipe</DrawerTitle>
					<DrawerDescription>{dateLabel}</DrawerDescription>
				</DrawerHeader>
				<div className="space-y-3 px-4 pb-6">
					<div className="flex gap-2">
						<div className="relative min-w-0 flex-1">
							<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search recipes..."
								className="pl-9"
								autoFocus
							/>
						</div>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger className="w-[9.5rem] shrink-0">
								<SelectValue placeholder="Category" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
								{MEALS.map((meal) => (
									<SelectItem key={meal} value={meal}>
										{meal}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="max-h-[50vh] space-y-2 overflow-y-auto">
						{loading ? (
							<div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
								<Loader2 className="size-4 animate-spin" />
								Loading…
							</div>
						) : recipes.length === 0 ? (
							<p className="py-10 text-center text-muted-foreground text-sm">
								No recipes found.
							</p>
						) : (
							recipes.map((recipe) => (
								<button
									key={recipe.id}
									type="button"
									disabled={selectingId !== null}
									onClick={() => void handleSelect(recipe)}
									className="flex w-full items-center gap-3 rounded-md border p-2 text-left transition-colors hover:bg-accent disabled:opacity-60"
								>
									<RecipePickerItem
										recipe={recipe}
										busy={selectingId === recipe.id}
									/>
								</button>
							))
						)}
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	)
}
