import { auth } from "@clerk/nextjs/server"
import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { prisma } from "@/lib/prisma"

const utapi = new UTApi()

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { userId } = await auth()
		const { slug } = await params

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const recipe = await prisma.recipe.findUnique({
			where: { slug, createdById: userId },
			include: { uploads: true },
		})

		if (!recipe) {
			return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
		}

		if (recipe.uploads) {
			try {
				await utapi.deleteFiles(recipe.uploads.key)
			} catch (uploadError) {
				console.error("UploadThing deletion error:", uploadError)
			}

			await prisma.upload.delete({
				where: { id: recipe.uploads.id },
			})
		}

		await prisma.recipe.delete({
			where: { id: recipe.id },
		})

		revalidateTag(`recipes:user:${userId}`, { expire: 0 })
		revalidateTag(`meals:user:${userId}`, { expire: 0 })

		return NextResponse.json({ message: "Deleted" }, { status: 200 })
	} catch (err) {
		console.error("Delete error:", err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
