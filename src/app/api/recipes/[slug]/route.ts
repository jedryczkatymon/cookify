import { auth } from "@clerk/nextjs/server"
import { revalidateTag } from "next/cache"
import { after, NextResponse } from "next/server"
import { UTApi } from "uploadthing/server"
import { prisma } from "@/lib/prisma"
import { normalizeStepsInput } from "@/lib/split-steps"
import type { Ingredient, Tag } from "@/prisma"

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { userId } = await auth()
		const { slug } = await params

		const existing = await prisma.recipe.findUnique({
			where: { slug, createdById: userId ?? undefined },
			include: { ingredients: true, tags: true, steps: true },
		})

		if (!existing) {
			return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
		}

		const form = await req.formData()
		const json = form.get("data")?.toString()
		const values = JSON.parse(json || "{}")

		await prisma.recipe.update({
			where: { id: existing.id },
			data: {
				name: values.name,
				description: values.description,
				category: values.category,
				servings: values.servings,
				prepTime: values.prepTime,
				calories: values.calories,
				notes: values.notes,
			},
		})

		if (values.imageUrl) {
			const newUpload = await prisma.upload.findFirst({
				where: { url: values.imageUrl },
			})

			if (newUpload) {
				const currentUpload = await prisma.upload.findUnique({
					where: { recipeId: existing.id },
				})

				if (currentUpload && currentUpload.id !== newUpload.id) {
					await prisma.upload.update({
						where: { id: currentUpload.id },
						data: { recipeId: null },
					})

					const keyToDelete = currentUpload.key
					after(() => {
						utapi.deleteFiles(keyToDelete).catch((uploadError) => {
							console.error("UploadThing deletion error:", uploadError)
						})
					})
				}

				await prisma.upload.update({
					where: { id: newUpload.id },
					data: { recipeId: existing.id },
				})
			}
		}

		const stepsArr = normalizeStepsInput(values.steps)
		const ingredientsInput = Array.isArray(values.ingredients)
			? (values.ingredients as Ingredient[])
			: []

		await Promise.all([
			(async () => {
				await prisma.step.deleteMany({ where: { recipeId: existing.id } })
				if (stepsArr.length > 0) {
					await prisma.step.createMany({
						data: stepsArr.map((content, idx) => ({
							order: idx + 1,
							content,
							recipeId: existing.id,
						})),
					})
				}
			})(),
			(async () => {
				await prisma.ingredient.deleteMany({
					where: { recipeId: existing.id },
				})
				if (ingredientsInput.length > 0) {
					await prisma.ingredient.createMany({
						data: ingredientsInput.map((ing, idx) => ({
							product: ing.product ?? "",
							amount: ing.amount ?? null,
							unit: ing.unit ?? null,
							section: ing.section || null,
							order: idx + 1,
							recipeId: existing.id,
						})),
					})
				}
			})(),
		])

		const newTags = Array.isArray(values.tags) ? (values.tags as string[]) : []
		const currentTagNames = (existing.tags ?? [])
			.map((t: Tag) => t.name)
			.filter(Boolean) as string[]

		const toAdd = newTags.filter((t) => !currentTagNames.includes(t))
		const toRemove = currentTagNames.filter((t) => !newTags.includes(t))

		const addPromises = toAdd.map((tagName) =>
			prisma.tag.upsert({
				where: {
					name_recipeId: {
						name: tagName,
						recipeId: existing.id,
					},
				},
				update: {
					recipe: {
						connect: { id: existing.id },
					},
				},
				create: {
					name: tagName,
					recipe: {
						connect: { id: existing.id },
					},
				},
			}),
		)

		const removePromises = toRemove.map((tagName) =>
			prisma.tag.delete({
				where: {
					name_recipeId: {
						name: tagName,
						recipeId: existing.id,
					},
				},
			}),
		)

		await Promise.all([...addPromises, ...removePromises])

		if (userId) {
			revalidateTag(`recipes:user:${userId}`, "max")
			revalidateTag(`meals:user:${userId}`, { expire: 0 })
		}

		return NextResponse.json({ ok: true }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}

const utapi = new UTApi()

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { userId } = await auth()
		const { slug } = await params

		const recipe = await prisma.recipe.findUnique({
			where: { slug, createdById: userId ?? undefined },
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

		if (userId) {
			revalidateTag(`recipes:user:${userId}`, "max")
			revalidateTag(`meals:user:${userId}`, { expire: 0 })
		}

		return NextResponse.json({ message: "Deleted" }, { status: 200 })
	} catch (err) {
		console.error("Delete error:", err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
