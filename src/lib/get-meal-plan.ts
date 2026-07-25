import { cacheLife, cacheTag } from "next/cache"
import { getCurrentUser } from "@/lib/get-user-info"
import { parseDateString } from "@/lib/meal-plan-week"
import { prisma } from "@/lib/prisma"

const mealPlanRecipeSelect = {
	id: true,
	slug: true,
	name: true,
	prepTime: true,
	calories: true,
	servings: true,
	category: true,
	uploads: { select: { url: true } },
} as const

async function getUserMealPlanCached(
	clerkId: string,
	from: string,
	to: string,
) {
	"use cache"
	cacheLife("minutes")
	cacheTag(`meals:user:${clerkId}`)

	const fromDate = parseDateString(from)
	const toDate = parseDateString(to)

	return prisma.mealPlanEntry.findMany({
		where: {
			userId: clerkId,
			date: {
				gte: fromDate,
				lte: toDate,
			},
		},
		include: {
			recipe: {
				select: mealPlanRecipeSelect,
			},
		},
		orderBy: [{ date: "asc" }, { order: "asc" }],
	})
}

async function getUserMealPlanWithIngredientsCached(
	clerkId: string,
	from: string,
	to: string,
) {
	"use cache"
	cacheLife("minutes")
	cacheTag(`meals:user:${clerkId}`)

	const fromDate = parseDateString(from)
	const toDate = parseDateString(to)

	return prisma.mealPlanEntry.findMany({
		where: {
			userId: clerkId,
			date: {
				gte: fromDate,
				lte: toDate,
			},
		},
		include: {
			recipe: {
				select: {
					...mealPlanRecipeSelect,
					ingredients: {
						select: {
							product: true,
							amount: true,
							unit: true,
							order: true,
						},
						orderBy: { order: "asc" },
					},
				},
			},
		},
		orderBy: [{ date: "asc" }, { order: "asc" }],
	})
}

export async function getUserMealPlan(from: string, to: string) {
	const user = await getCurrentUser()
	if (!user) return []

	return getUserMealPlanCached(user.clerkId, from, to)
}

export async function getUserMealPlanWithIngredients(from: string, to: string) {
	const user = await getCurrentUser()
	if (!user) return []

	return getUserMealPlanWithIngredientsCached(user.clerkId, from, to)
}

export type MealPlanEntryWithRecipe = Awaited<
	ReturnType<typeof getUserMealPlan>
>[number]
