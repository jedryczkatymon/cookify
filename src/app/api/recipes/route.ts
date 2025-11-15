import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

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
				tags: values.tags ?? [],
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

		// ----- INGREDIENT -----
		if (values.product || values.amount || values.unit) {
			await prisma.ingredient.create({
				data: {
					name: values.product ?? '',
					amount: values.amount ?? null,
					unit: values.unit ?? null,
					recipeId: recipe.id,
				},
			})
		}

		return NextResponse.json({ recipe }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: 'Server error' }, { status: 500 })
	}
}
