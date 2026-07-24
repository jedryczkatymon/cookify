"use client"

import Image from "next/image"
import Link from "next/link"
import EditButton from "@/components/button-edit"
import DialogDelete from "@/components/dialog-delete"

type RecipeCardRecipe = {
	id: number
	slug: string
	name: string
	prepTime?: number | null
	calories?: number | null
	servings?: number | null
	uploads?: { url: string } | null
}

export default function RecipeCard({
	recipe,
	onDeleted,
	onAfterDelete,
}: {
	recipe: RecipeCardRecipe
	onDeleted?: () => void
	onAfterDelete?: () => void | Promise<void>
}) {
	const imageUrl = recipe.uploads?.url
	const servings = recipe.servings && recipe.servings > 0 ? recipe.servings : 1
	const caloriesPerServing =
		recipe.calories != null ? Math.round(recipe.calories / servings) : null

	return (
		<div className="overflow-hidden rounded-md border bg-white shadow-sm">
			<Link href={`/dashboard/recipe/${recipe.slug}`} className="block">
				<div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={recipe.name}
							fill
							className="object-cover"
							sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1280px) 25vw, 20vw"
						/>
					) : null}
				</div>
			</Link>
			<div className="space-y-2 p-3">
				<Link
					href={`/dashboard/recipe/${recipe.slug}`}
					className="block truncate font-medium"
				>
					{recipe.name}
				</Link>
				<div className="flex items-center justify-between gap-1">
					<DialogDelete
						slug={recipe.slug}
						onDeleted={onDeleted}
						onAfterDelete={onAfterDelete}
					/>
					<span className="truncate text-muted-foreground text-xs">
						{recipe.prepTime ?? "—"} min · {caloriesPerServing ?? "—"} kcal
					</span>
					<EditButton slug={recipe.slug} />
				</div>
			</div>
		</div>
	)
}
