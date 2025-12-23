import { prisma } from "@/lib/prisma"
import type { Ingredient } from "@/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
	try {
		const { userId } = await auth()

		const form = await req.formData()
		const json = form.get("data")?.toString()
		const values = JSON.parse(json || "{}")

		// ----- CREATE RECIPE -----
		const recipe = await prisma.recipe.create({
			data: {
				name: values.name,
				description: values.description,
				category: values.category,
				servings: values.servings,
				prepTime: values.prepTime,
				notes: values.notes,
				createdById: userId,
			},
		})

		if (values.imageUrl) {
			await prisma.upload.updateMany({
				where: { url: values.imageUrl },
				data: { recipeId: recipe.id },
			})
		}

		// ----- STEP -----
		await prisma.step.create({
			data: {
				order: 1,
				content: values.steps,
				recipeId: recipe.id,
			},
		})

		// ----- INGREDIENTS (multiple) -----
		if (Array.isArray(values.ingredients) && values.ingredients.length > 0) {
			const ingredientsData = (values.ingredients as Ingredient[]).map(
				(ing) => ({
					product: ing.product,
					amount: ing.amount,
					unit: ing.unit,
					recipeId: recipe.id,
				}),
			)

			await prisma.ingredient.createMany({
				data: ingredientsData,
			})
		}

		// ----- TAGS -----
		if (values.tags && values.tags.length > 0) {
			const tagsData = values.tags.map((tag: string | { name: string }) => ({
				name: typeof tag === "string" ? tag : tag.name,
				recipeId: recipe.id,
			}))

			await prisma.tag.createMany({
				data: tagsData,
			})
		}

		return NextResponse.json({ recipe }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
