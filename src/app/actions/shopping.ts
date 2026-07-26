"use server"

import { auth } from "@clerk/nextjs/server"
import {
	shoppingClearChecksSchema,
	shoppingToggleCheckSchema,
} from "@/lib/schemas"
import {
	clearShoppingChecks,
	ShoppingCheckMutationError,
	setShoppingCheck,
} from "@/lib/shopping-check-mutations"

type ActionOk = { ok: true }
type ActionErr = { ok: false; error: string }
type ActionResult = ActionOk | ActionErr

function mutationError(err: unknown, fallback: string): ActionErr {
	if (err instanceof ShoppingCheckMutationError) {
		return { ok: false, error: err.message }
	}
	console.error(err)
	return { ok: false, error: fallback }
}

export async function toggleShoppingCheckAction(input: {
	lineKey: string
	checked: boolean
}): Promise<ActionResult> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	const parsed = shoppingToggleCheckSchema.safeParse(input)
	if (!parsed.success) return { ok: false, error: "Invalid input" }

	try {
		await setShoppingCheck(userId, parsed.data.lineKey, parsed.data.checked)
		return { ok: true }
	} catch (err) {
		return mutationError(err, "Could not update shopping check")
	}
}

export async function clearShoppingChecksAction(input: {
	from: string
	to: string
}): Promise<ActionResult> {
	const { userId } = await auth()
	if (!userId) return { ok: false, error: "Unauthorized" }

	const parsed = shoppingClearChecksSchema.safeParse(input)
	if (!parsed.success) return { ok: false, error: "Invalid input" }

	try {
		await clearShoppingChecks(userId, parsed.data.from, parsed.data.to)
		return { ok: true }
	} catch (err) {
		return mutationError(err, "Could not clear shopping checks")
	}
}
