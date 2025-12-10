"use client"
import DialogDelete from "@/components/dialog-delete"
import Link from "next/link"
import type { Recipe } from "types/types"

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
	return (
		<div className="">
			<Link key={recipe.id} href={`/dashboard/recipe/${recipe.slug}`}>
				<div className="rounded-md border bg-white p-4 shadow-sm">
					{recipe.name}
				</div>
			</Link>
			<DialogDelete slug={recipe.slug} />
		</div>
	)
}
