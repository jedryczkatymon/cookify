import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import {
	copyMealPlanWeek,
	MealPlanMutationError,
} from "@/lib/meal-plan-mutations"
import { mealPlanCopyWeekSchema } from "@/lib/schemas"

export async function POST(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const body = await req.json()
		const parsed = mealPlanCopyWeekSchema.safeParse(body)
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "Invalid body", details: z.flattenError(parsed.error) },
				{ status: 400 },
			)
		}

		const result = await copyMealPlanWeek(userId, parsed.data)
		return NextResponse.json(result)
	} catch (err) {
		if (err instanceof MealPlanMutationError) {
			return NextResponse.json({ error: err.message }, { status: err.status })
		}
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
