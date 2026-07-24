import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { getUserIngredients, getUserTags } from "@/lib/get-user-info"

export async function GET(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const type = searchParams.get("type")
		const q = searchParams.get("q") ?? ""
		const limitParam = Number(searchParams.get("limit") ?? "50")
		const limit = Number.isFinite(limitParam)
			? Math.min(Math.max(limitParam, 1), 100)
			: 50

		if (type !== "tags" && type !== "ingredients") {
			return NextResponse.json(
				{ error: "Invalid type. Use tags or ingredients." },
				{ status: 400 },
			)
		}

		const items =
			type === "tags"
				? await getUserTags({ q, limit })
				: await getUserIngredients({ q, limit })

		return NextResponse.json({ items })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
