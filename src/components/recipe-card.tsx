"use client"
import DialogDelete from "@/components/dialog-delete"
import EditButton from "@/components/edit-button"
import type { Recipe } from "@/prisma"
import Link from "next/link"

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
	return (
		<div className="">
			<Link key={recipe.id} href={`/dashboard/recipe/${recipe.slug}`}>
				<div className="rounded-md border bg-white p-4 shadow-sm">
					{recipe.name}
				</div>
			</Link>
			<DialogDelete slug={recipe.slug} />
			<EditButton slug={recipe.slug} />
		</div>
	)
}
