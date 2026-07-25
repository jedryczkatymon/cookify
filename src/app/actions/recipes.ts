"use server"

import { auth } from "@clerk/nextjs/server"
import {
	getRecipesForPicker,
	type PickerRecipeResult,
} from "@/lib/get-recipes-for-picker"

type ActionOk<T = object> = { ok: true } & T
type ActionErr = { ok: false; error: string }
type ActionResult<T = object> = ActionOk<T> | ActionErr

export async function searchRecipesForPickerAction(input: {
	q?: string
	category?: string | null
}): Promise<ActionResult<{ recipes: PickerRecipeResult[] }>> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	try {
		const recipes = await getRecipesForPicker({
			search: input.q?.trim() ?? "",
			category: input.category ?? null,
		})
		return { ok: true, recipes }
	} catch (err) {
		console.error(err)
		return { ok: false, error: "Could not load recipes" }
	}
}
