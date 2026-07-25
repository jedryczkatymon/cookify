"use client"

import { type ChangeEvent, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { H2 } from "@/components/ui/typography"
import type { Ingredient } from "@/prisma"

interface RecipeScalerProps {
	recipeSlug: string
	initialServings: number
	ingredients: Ingredient[]
	prepTime?: number | string | null
	calories?: number | string | null
	category?: string | null
	tags?: { name: string }[]
}

function storageKey(recipeSlug: string) {
	return `cookify:checked-ingredients:${recipeSlug}`
}

export default function RecipeScaler({
	recipeSlug,
	initialServings,
	ingredients,
	prepTime,
	calories,
	category,
	tags,
}: RecipeScalerProps) {
	const [servings, setServings] = useState<number | "">(1)
	const [checked, setChecked] = useState<Set<number>>(() => new Set())
	const base = initialServings && initialServings > 0 ? initialServings : 1

	const currentServings = servings === "" ? 0 : servings
	const ratio = currentServings / base

	useEffect(() => {
		try {
			const raw = localStorage.getItem(storageKey(recipeSlug))
			if (!raw) {
				setChecked(new Set())
				return
			}
			const ids = JSON.parse(raw) as unknown
			if (
				Array.isArray(ids) &&
				ids.every((id): id is number => typeof id === "number")
			) {
				setChecked(new Set(ids))
			} else {
				setChecked(new Set())
			}
		} catch {
			setChecked(new Set())
		}
	}, [recipeSlug])

	const persistChecked = (next: Set<number>) => {
		setChecked(next)
		try {
			localStorage.setItem(storageKey(recipeSlug), JSON.stringify([...next]))
		} catch {
			// ignore quota / private mode errors
		}
	}

	const toggleIngredient = (id: number) => {
		const next = new Set(checked)
		if (next.has(id)) {
			next.delete(id)
		} else {
			next.add(id)
		}
		persistChecked(next)
	}

	const clearChecked = () => {
		persistChecked(new Set())
	}

	const handleServingsChange = (e: ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value

		if (value === "") {
			setServings("")
		} else {
			setServings(Number.parseInt(value, 10))
		}
	}

	const handleServingsBlur = () => {
		if (servings === "") {
			setServings(1)
		}
	}

	const formatAmount = (amount: number | null) => {
		if (!amount) return ""
		const newAmount = amount * ratio
		return Number.parseFloat(newAmount.toFixed(2))
	}

	const scaledCalories = calories ? Math.round(Number(calories) * ratio) : null

	const ingredientGroups = (() => {
		const sorted = (ingredients ?? [])
			.slice()
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

		const groups: { section: string | null; items: Ingredient[] }[] = []
		for (const ing of sorted) {
			const section = ing.section?.trim() || null
			const last = groups[groups.length - 1]
			if (last && last.section === section) {
				last.items.push(ing)
			} else {
				groups.push({ section, items: [ing] })
			}
		}
		return groups
	})()

	return (
		<>
			<div className="mt-4 flex flex-col gap-2 text-muted-foreground text-sm sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2 sm:text-base">
				{category ? <span>{category}</span> : null}

				<div className="flex items-center gap-2">
					<span>Servings:</span>
					<Input
						type="number"
						min="1"
						value={servings}
						onChange={handleServingsChange}
						onBlur={handleServingsBlur}
						className="h-8 w-20 px-2 py-1 text-center"
					/>
				</div>

				<span>Prep: {prepTime ?? "—"} min</span>

				<span>Calories: {scaledCalories ?? "—"} kcal</span>
			</div>

			{tags && tags.length > 0 && (
				<div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-6">
					{tags.map((t) => (
						<span
							key={t.name}
							className="rounded-full bg-neutral-500 px-3 py-1 font-medium text-white text-xs"
						>
							{t.name}
						</span>
					))}
				</div>
			)}

			<section className="mt-6">
				<div className="flex items-center justify-between gap-4">
					<H2>Ingredients</H2>
					{checked.size > 0 ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							onClick={clearChecked}
						>
							Clear
						</Button>
					) : null}
				</div>
				{ingredientGroups.length > 0 ? (
					<div className="mt-4 space-y-4">
						{ingredientGroups.map((group, groupIndex) => (
							<div key={`${group.section ?? "ungrouped"}-${groupIndex}`}>
								{group.section ? (
									<h3 className="mb-2 border-b pb-1 font-semibold text-sm sm:text-base">
										{group.section}
									</h3>
								) : null}
								<ul className="list-none space-y-0">
									{group.items.map((ing) => {
										const isChecked = checked.has(ing.id)
										return (
											<li key={ing.id}>
												<label className="mb-2 flex cursor-pointer items-start gap-3 text-sm sm:text-base">
													<input
														type="checkbox"
														checked={isChecked}
														onChange={() => toggleIngredient(ing.id)}
														className="mt-1"
													/>
													<span
														className={
															isChecked
																? "break-words line-through opacity-60"
																: "break-words"
														}
													>
														<span className="font-semibold">
															{formatAmount(Number(ing.amount))}
														</span>{" "}
														{ing.unit} {ing.product}
													</span>
												</label>
											</li>
										)
									})}
								</ul>
							</div>
						))}
					</div>
				) : null}
			</section>
		</>
	)
}
