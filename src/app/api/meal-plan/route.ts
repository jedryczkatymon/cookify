import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getUserMealPlan } from "@/lib/get-meal-plan"
import {
	createMealPlanEntry,
	deleteMealPlanEntry,
	MealPlanMutationError,
} from "@/lib/meal-plan-mutations"
import {
	mealPlanCreateSchema,
	mealPlanDeleteSchema,
	mealPlanRangeSchema,
} from "@/lib/schemas"

export async function GET(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const parsed = mealPlanRangeSchema.safeParse({
			from: searchParams.get("from"),
			to: searchParams.get("to"),
		})
		if (!parsed.success) {
			return NextResponse.json(
				{
					error: "Invalid from/to dates",
					details: z.flattenError(parsed.error),
				},
				{ status: 400 },
			)
		}

		const entries = await getUserMealPlan(parsed.data.from, parsed.data.to)
		return NextResponse.json({ entries })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}

export async function POST(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await req.json()
		const parsed = mealPlanCreateSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid body", details: z.flattenError(parsed.error) },
				{ status: 400 },
			)
		}

		const entry = await createMealPlanEntry(userId, parsed.data)
		return NextResponse.json({ entry }, { status: 201 })
	} catch (err) {
		if (err instanceof MealPlanMutationError) {
			return NextResponse.json({ error: err.message }, { status: err.status })
		}
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}

export async function DELETE(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const parsed = mealPlanDeleteSchema.safeParse({
			id: searchParams.get("id"),
		})
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid id", details: z.flattenError(parsed.error) },
				{ status: 400 },
			)
		}

		await deleteMealPlanEntry(userId, parsed.data.id)
		return NextResponse.json({ ok: true })
	} catch (err) {
		if (err instanceof MealPlanMutationError) {
			return NextResponse.json({ error: err.message }, { status: err.status })
		}
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
