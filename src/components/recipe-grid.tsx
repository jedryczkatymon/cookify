"use client"

import { useSearchParams } from "next/navigation"
import { useRef, useState } from "react"
import RecipeCard from "@/components/recipe-card"

export type RecipeGridItem = {
	id: number
	slug: string
	name: string
	prepTime?: number | null
	calories?: number | null
	servings?: number | null
	uploads?: { url: string } | null
}

type RecipeGridProps = {
	initialRecipes: RecipeGridItem[]
	page: number
	perPage: number
	initialTotal: number
}

export default function RecipeGrid({
	initialRecipes,
	page,
	perPage,
	initialTotal,
}: RecipeGridProps) {
	const searchParams = useSearchParams()
	const [recipes, setRecipes] = useState(initialRecipes)
	const recipesRef = useRef(recipes)
	recipesRef.current = recipes
	const totalRef = useRef(initialTotal)

	const handleDeleted = (slug: string) => {
		setRecipes((prev) => {
			const next = prev.filter((recipe) => recipe.slug !== slug)
			recipesRef.current = next
			return next
		})
		totalRef.current = Math.max(0, totalRef.current - 1)
	}

	const fillGap = async () => {
		const remaining = recipesRef.current
		if (remaining.length >= perPage) return

		const skip = (page - 1) * perPage + remaining.length
		if (skip >= totalRef.current) return

		const params = new URLSearchParams(searchParams.toString())
		params.set("page", String(skip + 1))
		params.set("perPage", "1")

		const res = await fetch(`/api/recipes?${params.toString()}`)
		if (!res.ok) return

		const data = (await res.json()) as { recipes: RecipeGridItem[] }
		const filler = data.recipes?.[0]
		if (!filler) return
		if (remaining.some((recipe) => recipe.id === filler.id)) return

		setRecipes((prev) => {
			if (prev.some((recipe) => recipe.id === filler.id)) return prev
			const next = [...prev, filler]
			recipesRef.current = next
			return next
		})
	}

	return (
		<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
			{recipes.map((recipe) => (
				<RecipeCard
					key={recipe.id}
					recipe={recipe}
					onDeleted={() => handleDeleted(recipe.slug)}
					onAfterDelete={fillGap}
				/>
			))}
		</div>
	)
}
