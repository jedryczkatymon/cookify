import { revalidatePath } from "next/cache"
import { parseDateString, toDateString } from "@/lib/meal-plan-week"
import { prisma } from "@/lib/prisma"

export class ShoppingCheckMutationError extends Error {
	constructor(
		message: string,
		readonly status: number,
	) {
		super(message)
		this.name = "ShoppingCheckMutationError"
	}
}

export type ParsedShoppingLineKey = {
	date: Date
	dateStr: string
	product: string
	unit: string
}

export function parseShoppingLineKey(lineKey: string): ParsedShoppingLineKey {
	const parts = lineKey.split("::")
	if (parts.length < 3) {
		throw new ShoppingCheckMutationError("Invalid shopping line key", 400)
	}

	const [dateStr, ...rest] = parts
	const unit = rest.pop() ?? ""
	const product = rest.join("::")

	if (!dateStr || !product) {
		throw new ShoppingCheckMutationError("Invalid shopping line key", 400)
	}

	try {
		const date = parseDateString(dateStr)
		return {
			date,
			dateStr,
			product: product.toLowerCase(),
			unit: unit.toLowerCase(),
		}
	} catch {
		throw new ShoppingCheckMutationError("Invalid shopping line key", 400)
	}
}

function toLineKey(date: Date, product: string, unit: string): string {
	return `${toDateString(date)}::${product}::${unit}`
}

function revalidateShopping() {
	revalidatePath("/dashboard/shopping")
}

export async function getShoppingChecksMap(
	userId: string,
	from: string,
	to: string,
): Promise<Record<string, boolean>> {
	const rows = await prisma.shoppingCheck.findMany({
		where: {
			userId,
			date: {
				gte: parseDateString(from),
				lte: parseDateString(to),
			},
		},
		select: { date: true, product: true, unit: true },
	})

	const map: Record<string, boolean> = {}
	for (const row of rows) {
		map[toLineKey(row.date, row.product, row.unit)] = true
	}
	return map
}

export async function setShoppingCheck(
	userId: string,
	lineKey: string,
	checked: boolean,
) {
	const { date, product, unit } = parseShoppingLineKey(lineKey)

	if (checked) {
		await prisma.shoppingCheck.upsert({
			where: {
				userId_date_product_unit: { userId, date, product, unit },
			},
			create: { userId, date, product, unit },
			update: {},
		})
	} else {
		await prisma.shoppingCheck.deleteMany({
			where: { userId, date, product, unit },
		})
	}

	revalidateShopping()
}

export async function clearShoppingChecks(
	userId: string,
	from: string,
	to: string,
) {
	await prisma.shoppingCheck.deleteMany({
		where: {
			userId,
			date: {
				gte: parseDateString(from),
				lte: parseDateString(to),
			},
		},
	})

	revalidateShopping()
}
