"use server"

import { auth } from "@clerk/nextjs/server"
import {
	copyMealPlanWeek,
	createMealPlanEntry,
	deleteMealPlanEntry,
	MealPlanMutationError,
} from "@/lib/meal-plan-mutations"
import { toDateString } from "@/lib/meal-plan-week"
import {
	mealPlanCopyWeekSchema,
	mealPlanCreateSchema,
	mealPlanDeleteSchema,
} from "@/lib/schemas"

type ActionOk<T = object> = { ok: true } & T
type ActionErr = { ok: false; error: string }
type ActionResult<T = object> = ActionOk<T> | ActionErr

function toEntryView(entry: {
	id: number
	date: Date
	order: number
	servings: number | null
	recipeId: number
	recipe: {
		id: number
		slug: string
		name: string
		prepTime: number | null
		calories: number | null
		servings: number | null
		category: string | null
		uploads: { url: string } | null
	}
}) {
	return {
		id: entry.id,
		date: toDateString(entry.date),
		order: entry.order,
		servings: entry.servings,
		recipeId: entry.recipeId,
		recipe: entry.recipe,
	}
}

function mutationError(err: unknown, fallback: string): ActionErr {
	if (err instanceof MealPlanMutationError) {
		return { ok: false, error: err.message }
	}
	console.error(err)
	return { ok: false, error: fallback }
}

export async function addMealPlanEntryAction(input: {
	date: string
	recipeId: number
	servings?: number | null
}): Promise<ActionResult<{ entry: ReturnType<typeof toEntryView> }>> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	const parsed = mealPlanCreateSchema.safeParse(input)
	if (!parsed.success) return { ok: false, error: "Invalid input" }

	try {
		const entry = await createMealPlanEntry(userId, parsed.data)
		return { ok: true, entry: toEntryView(entry) }
	} catch (err) {
		return mutationError(err, "Could not save meal")
	}
}

export async function replaceMealPlanEntryAction(input: {
	entryId: number
	date: string
	recipeId: number
	servings?: number | null
}): Promise<ActionResult<{ entry: ReturnType<typeof toEntryView> }>> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	const deleteParsed = mealPlanDeleteSchema.safeParse({ id: input.entryId })
	const createParsed = mealPlanCreateSchema.safeParse({
		date: input.date,
		recipeId: input.recipeId,
		servings: input.servings,
	})
	if (!deleteParsed.success || !createParsed.success) {
		return { ok: false, error: "Invalid input" }
	}

	try {
		await deleteMealPlanEntry(userId, deleteParsed.data.id)
		const entry = await createMealPlanEntry(userId, createParsed.data)
		return { ok: true, entry: toEntryView(entry) }
	} catch (err) {
		return mutationError(err, "Could not change meal")
	}
}

export async function removeMealPlanEntryAction(input: {
	id: number
}): Promise<ActionResult> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	const parsed = mealPlanDeleteSchema.safeParse(input)
	if (!parsed.success) return { ok: false, error: "Invalid input" }

	try {
		await deleteMealPlanEntry(userId, parsed.data.id)
		return { ok: true }
	} catch (err) {
		return mutationError(err, "Could not remove meal")
	}
}

export async function copyMealPlanWeekAction(input: {
	fromStart: string
	toStart: string
}): Promise<ActionResult<{ copied: number }>> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	const parsed = mealPlanCopyWeekSchema.safeParse(input)
	if (!parsed.success) return { ok: false, error: "Invalid input" }

	try {
		const result = await copyMealPlanWeek(userId, parsed.data)
		return { ok: true, copied: result.copied }
	} catch (err) {
		return mutationError(err, "Could not copy previous week")
	}
}
