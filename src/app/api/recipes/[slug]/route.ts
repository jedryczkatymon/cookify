import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { Ingredient, Tag } from "types/types"

export async function PUT(
	req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { userId } = await auth()

		const { slug } = await params

		const existing = await prisma.recipe.findUnique({
			where: { slug },
			include: { ingredients: true, tags: true, steps: true },
		})

		const form = await req.formData()
		const json = form.get("data")?.toString()
		const values = JSON.parse(json || "{}")

		// ----- UPDATE RECIPE FIELDS -----
		await prisma.recipe.update({
			where: { id: existing.id },
			data: {
				name: values.name,
				description: values.description,
				category: values.category,
				servings: values.servings,
				prepTime: values.prepTime,
				notes: values.notes,
			},
		})

		// ----- STEPS (replace) -----
		// Expecting steps separated by blank line (same format as form)
		const stepsArr: string[] = (values.steps ?? "")
			.toString()
			.split(/\n\s*\n/)
			.map((s: string) => s.trim())
			.filter(Boolean)

		// remove existing steps then create new ones with order
		await prisma.step.deleteMany({ where: { recipeId: existing.id } })
		if (stepsArr.length > 0) {
			const stepsData = stepsArr.map((content, idx) => ({
				order: idx + 1,
				content,
				recipeId: existing.id,
			}))
			await prisma.step.createMany({ data: stepsData })
		}

		// ----- INGREDIENTS (replace) -----
		await prisma.ingredient.deleteMany({ where: { recipeId: existing.id } })
		if (Array.isArray(values.ingredients) && values.ingredients.length > 0) {
			const ingredientsData = (values.ingredients as Ingredient[]).map(
				(ing) => ({
					name: ing.name ?? "",
					amount: ing.amount ?? null,
					unit: ing.unit ?? null,
					recipeId: existing.id,
				}),
			)
			await prisma.ingredient.createMany({ data: ingredientsData })
		}

		// ----- TAGS (sync: add new, disconnect removed) -----
		const newTags = Array.isArray(values.tags) ? (values.tags as string[]) : []
		const currentTagNames = (existing.tags ?? [])
			.map((t: Tag) => t.name)
			.filter(Boolean) as string[]

		const toAdd = newTags.filter((t) => !currentTagNames.includes(t))
		const toRemove = currentTagNames.filter((t) => !newTags.includes(t))

		// add/connect new tags
		const addPromises = toAdd.map((tagName) =>
			prisma.tag.upsert({
				where: { name: tagName },
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
		// disconnect removed tags
		const removePromises = toRemove.map((tagName) =>
			prisma.tag.update({
				where: { name: tagName },
				data: {
					recipe: {
						disconnect: { id: existing.id },
					},
				},
			}),
		)

		await Promise.all([...addPromises, ...removePromises])

		const updated = await prisma.recipe.findUnique({
			where: { id: existing.id },
			include: { ingredients: true, tags: true, steps: true },
		})

		return NextResponse.json({ recipe: updated }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}

export async function DELETE(
	_req: Request,
	{ params }: { params: Promise<{ slug: string }> },
) {
	try {
		const { slug } = await params

		const recipe = await prisma.recipe.findUnique({
			where: { slug },
		})

		if (!recipe) {
			return NextResponse.json({ error: "Recipe not found" }, { status: 404 })
		}

		await prisma.step.deleteMany({ where: { recipeId: recipe.id } })
		await prisma.ingredient.deleteMany({ where: { recipeId: recipe.id } })

		await prisma.tag.deleteMany({ where: { recipeId: recipe.id } })

		await prisma.recipe.delete({
			where: { slug: slug },
		})

		return NextResponse.json({ message: "Deleted" }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
