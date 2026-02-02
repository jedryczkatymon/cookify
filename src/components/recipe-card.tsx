"use client"
import Link from "next/link"
import EditButton from "@/components/button-edit"
import DialogDelete from "@/components/dialog-delete"
import type { Recipe } from "@/prisma"

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
	return (
		<div className="flex items-center justify-between rounded-md border bg-white p-4 shadow-sm">
			<Link key={recipe.id} href={`/dashboard/recipe/${recipe.slug}`}>
				<div className="">{recipe.name}</div>
			</Link>
			<div className="flex gap-2">
				<DialogDelete slug={recipe.slug} />
				<EditButton slug={recipe.slug} />
			</div>
		</div>
	)
}
