"use client"

import { Input } from "@/components/ui/input"
import { H2 } from "@/components/ui/typography"
import type { Ingredient } from "@/prisma"
import { useState } from "react"

interface RecipeScalerProps {
	initialServings: number
	ingredients: Ingredient[]
	prepTime?: number | string | null
	category?: string | null
	tags?: { name: string }[]
}

export default function RecipeScaler({
	initialServings,
	ingredients,
	prepTime,
	category,
	tags,
}: RecipeScalerProps) {
	const [servings, setServings] = useState<number>(initialServings || 1)
	const base = initialServings && initialServings > 0 ? initialServings : 1
	const ratio = servings / base

	const handleServingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = Number.parseFloat(e.target.value)
		setServings(Number.isNaN(val) || val < 1 ? 1 : val)
	}

	const formatAmount = (amount: number | null) => {
		if (!amount) return ""
		const newAmount = amount * ratio
		return Number.parseFloat(newAmount.toFixed(2))
	}

	return (
		<>
			<div className="mt-2 flex flex-wrap items-center gap-2 text-gray-500">
				{category && <span>{category} · </span>}

				<div className="flex items-center gap-2">
					<span>Servings:</span>
					<Input
						type="number"
						min={1}
						value={servings}
						onChange={handleServingsChange}
						className="h-8 w-20 px-2 py-1 text-center"
					/>
				</div>

				<span> · Prep: {prepTime ?? "—"} min</span>
			</div>

			{tags && tags.length > 0 && (
				<p style={{ marginTop: 8 }}>
					Tags: {tags.map((t) => t.name).join(", ")}
				</p>
			)}

			<section style={{ marginTop: 24 }}>
				<H2>Ingredients</H2>
				<ul className="mt-4 list-inside list-disc">
					{ingredients?.length
						? ingredients.map((ing) => (
								<li key={ing.id} className="mb-2">
									<span className="font-semibold">
										{formatAmount(Number(ing.amount))}
									</span>{" "}
									{ing.unit} {ing.product}
								</li>
							))
						: null}
				</ul>
			</section>
		</>
	)
}
