import { Loader2 } from "lucide-react"
import Image from "next/image"
import type { MealPlanRecipe } from "@/components/meal-plan/types"

export function RecipePickerItem({
	recipe,
	busy,
}: {
	recipe: MealPlanRecipe
	busy?: boolean
}) {
	const servings = recipe.servings && recipe.servings > 0 ? recipe.servings : 1
	const kcal =
		recipe.calories != null ? Math.round(recipe.calories / servings) : null

	return (
		<>
			<div className="relative size-14 shrink-0 overflow-hidden rounded bg-muted">
				{recipe.uploads?.url ? (
					<Image
						src={recipe.uploads.url}
						alt=""
						fill
						className="object-cover"
						sizes="56px"
					/>
				) : null}
			</div>
			<div className="min-w-0 flex-1">
				{recipe.category ? (
					<p className="truncate text-muted-foreground text-xs">
						{recipe.category}
					</p>
				) : null}
				<p className="truncate font-medium text-sm">{recipe.name}</p>
				<p className="text-muted-foreground text-xs">
					{recipe.prepTime ?? "—"} min · {kcal ?? "—"} kcal
				</p>
			</div>
			{busy ? <Loader2 className="size-4 shrink-0 animate-spin" /> : null}
		</>
	)
}
