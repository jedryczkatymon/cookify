import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import type { Ingredient, Tag } from "types/types"

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
				data: { recipeId: recipe.id }, // Connect the photo to the new recipe
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
					name: ing.name ?? "",
					amount: ing.amount ?? null,
					unit: ing.unit ?? null,
					recipeId: recipe.id,
				}),
			)

			await prisma.ingredient.createMany({
				data: ingredientsData,
			})
		}

		// ----- TAGS -----
		if (values.tags && values.tags.length > 0) {
			const tagPromises = (values.tags as Tag[]).map(async (tagName) => {
				const existingTag = await prisma.tag.findFirst({
					where: { name: tagName },
				})
	
				if (existingTag) {
					await prisma.tag.update({
						where: { id: existingTag.id },
						data: {
							recipe: {
								connect: { id: recipe.id },
							},
						},
					})
				} else {
					await prisma.tag.create({
						data: {
							name: tagName,
							recipe: {
								connect: { id: recipe.id },
							},
						},
					})
				}
			})
			await Promise.all(tagPromises)
		}

		return NextResponse.json({ recipe }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
