import { revalidatePath, revalidateTag } from "next/cache"
import { addDays, parseDateString, toDateString } from "@/lib/meal-plan-week"
import { prisma } from "@/lib/prisma"

export const mealPlanRecipeSelect = {
	id: true,
	slug: true,
	name: true,
	prepTime: true,
	calories: true,
	servings: true,
	category: true,
	uploads: { select: { url: true } },
} as const

function revalidateMealPlan(userId: string) {
	revalidateTag(`meals:user:${userId}`, { expire: 0 })
	revalidatePath("/dashboard/calendar")
}

export class MealPlanMutationError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
		this.name = "MealPlanMutationError"
	}
}

export async function createMealPlanEntry(
	userId: string,
	input: { date: string; recipeId: number; servings?: number | null },
) {
	const dateValue = parseDateString(input.date)

	const recipe = await prisma.recipe.findFirst({
		where: { id: input.recipeId, createdById: userId },
		select: { id: true, servings: true },
	})
	if (!recipe) {
		throw new MealPlanMutationError("Recipe not found", 404)
	}

	const aggregate = await prisma.mealPlanEntry.aggregate({
		where: { userId, date: dateValue },
		_max: { order: true },
	})
	const nextOrder = (aggregate._max.order ?? -1) + 1

	const entry = await prisma.mealPlanEntry.create({
		data: {
			userId,
			date: dateValue,
			order: nextOrder,
			recipeId: input.recipeId,
			servings: input.servings ?? recipe.servings ?? null,
		},
		include: {
			recipe: { select: mealPlanRecipeSelect },
		},
	})

	revalidateMealPlan(userId)
	return entry
}

export async function deleteMealPlanEntry(userId: string, id: number) {
	const result = await prisma.mealPlanEntry.deleteMany({
		where: { id, userId },
	})

	if (result.count === 0) {
		throw new MealPlanMutationError("Not found", 404)
	}

	revalidateMealPlan(userId)
}

export async function copyMealPlanWeek(
	userId: string,
	input: { fromStart: string; toStart: string },
) {
	const { fromStart, toStart } = input
	if (fromStart === toStart) {
		throw new MealPlanMutationError("Source and target weeks must differ", 400)
	}

	const fromDate = parseDateString(fromStart)
	const toDate = parseDateString(toStart)
	const fromEnd = addDays(fromDate, 6)
	const toEnd = addDays(toDate, 6)

	const sourceEntries = await prisma.mealPlanEntry.findMany({
		where: {
			userId,
			date: {
				gte: fromDate,
				lte: fromEnd,
			},
		},
		orderBy: [{ date: "asc" }, { order: "asc" }],
	})

	if (sourceEntries.length === 0) {
		return { copied: 0, toStart: toDateString(toDate) }
	}

	await prisma.$transaction([
		prisma.mealPlanEntry.deleteMany({
			where: {
				userId,
				date: {
					gte: toDate,
					lte: toEnd,
				},
			},
		}),
		prisma.mealPlanEntry.createMany({
			data: sourceEntries.map((entry) => {
				const dayOffset = Math.round(
					(parseDateString(toDateString(entry.date)).getTime() -
						fromDate.getTime()) /
						(1000 * 60 * 60 * 24),
				)
				return {
					userId,
					date: addDays(toDate, dayOffset),
					order: entry.order,
					recipeId: entry.recipeId,
					servings: entry.servings,
				}
			}),
		}),
	])

	revalidateMealPlan(userId)
	return {
		copied: sourceEntries.length,
		toStart: toDateString(toDate),
	}
}
