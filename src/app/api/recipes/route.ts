import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { Ingredient, Tag } from 'types/types'

export async function POST(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId)
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const form = await req.formData()
		const json = form.get('data')?.toString()
		const values = JSON.parse(json || '{}')

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
					name: (ing.product) ?? '',
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
			const tagPromises = (values.tags as Tag[]).map((tagName) =>
				prisma.tag.upsert({
					where: { name: tagName },
					update: {
						recipe: {
							connect: { id: recipe.id },
						},
					},
					create: {
						name: tagName,
						recipe: {
							connect: { id: recipe.id },
						},
					},
				}),
			)
			await Promise.all(tagPromises)
		}

		return NextResponse.json({ recipe }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
