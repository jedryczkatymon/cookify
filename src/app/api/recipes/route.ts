import { auth } from "@clerk/nextjs/server"
import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { getUserRecipes } from "@/lib/get-user-info"
import { prisma } from "@/lib/prisma"
import { normalizeStepsInput } from "@/lib/split-steps"
import type { Ingredient } from "@/prisma"

export async function GET(req: Request) {
	try {
		const { userId } = await auth()
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

		const { searchParams } = new URL(req.url)
		const q = searchParams.get("q") ?? ""
		const page = Number(searchParams.get("page") ?? "1")
		const perPage = Number(searchParams.get("perPage") ?? "10")
		const category = searchParams.get("category")
		const prepTimeParam = searchParams.get("prepTime")
		const caloriesParam = searchParams.get("calories")
		const sort = searchParams.get("sort") ?? "createdAt.desc"
		const tags = searchParams.getAll("tags")
		const ingredients = searchParams.getAll("ingredients")

		const result = await getUserRecipes(
			["id", "slug", "name", "uploads", "prepTime", "calories", "servings"],
			{
				search: q,
				page: Number.isFinite(page) ? page : 1,
				limit: Number.isFinite(perPage) ? perPage : 10,
				category,
				prepTime: prepTimeParam ? Number(prepTimeParam) : null,
				calories: caloriesParam ? Number(caloriesParam) : null,
				tags,
				ingredients,
				sort,
			},
		)

		return NextResponse.json(result)
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}

export async function POST(req: Request) {
	try {
		const { userId } = await auth()

		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
		}

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
				calories: values.calories,
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

		// ----- STEPS -----
		const stepsArr = normalizeStepsInput(values.steps)
		if (stepsArr.length > 0) {
			await prisma.step.createMany({
				data: stepsArr.map((content, idx) => ({
					order: idx + 1,
					content,
					recipeId: recipe.id,
				})),
			})
		}

		// ----- INGREDIENTS (multiple) -----
		if (Array.isArray(values.ingredients) && values.ingredients.length > 0) {
			const ingredientsData = (values.ingredients as Ingredient[]).map(
				(ing, idx) => ({
					product: ing.product,
					amount: ing.amount,
					unit: ing.unit,
					section: ing.section || null,
					order: idx + 1,
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

		if (userId) {
			revalidateTag(`recipes:user:${userId}`, { expire: 0 })
			revalidateTag(`meals:user:${userId}`, { expire: 0 })
		}

		return NextResponse.json({ recipe }, { status: 200 })
	} catch (err) {
		console.error(err)
		return NextResponse.json({ error: "Server error" }, { status: 500 })
	}
}
