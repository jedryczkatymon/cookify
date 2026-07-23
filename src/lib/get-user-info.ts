import { currentUser } from "@clerk/nextjs/server"
import { cacheLife, cacheTag } from "next/cache"
import { cache } from "react"
import { prisma } from "@/lib/prisma"
import type { Prisma } from "@/prisma"

interface GetUserRecipesOptions {
	search?: string
	page?: number
	limit?: number
	category?: string | null
	prepTime?: number | null
	calories?: number | null
	tags?: string[]
	ingredients?: string[]
	sort?: string
}

interface CachedRecipesOptions {
	search: string
	page: number
	limit: number
	category: string | null
	prepTime: number | null
	calories: number | null
	tags: string[]
	ingredients: string[]
	sort: string
	fields: string[]
}

export const getCurrentUser = cache(async () => {
	const user = await currentUser()

	if (!user) return null

	const dbUser = await prisma.user.findUnique({
		where: { clerkId: user.id },
	})

	return dbUser
})

async function getUserRecipesCached(
	clerkId: string,
	options: CachedRecipesOptions,
) {
	"use cache"
	cacheLife("minutes")
	cacheTag(`recipes:user:${clerkId}`)

	const {
		search,
		page,
		limit,
		category,
		prepTime,
		calories,
		tags,
		ingredients,
		sort,
		fields,
	} = options

	const [field, direction] = sort.split(".")
	const dir = direction === "asc" ? "asc" : "desc"

	let orderBy:
		| Prisma.RecipeOrderByWithRelationInput
		| Prisma.RecipeOrderByWithRelationInput[] = { createdAt: "desc" }

	switch (field) {
		case "name":
			orderBy = [{ name: dir }, { id: "desc" }]
			break
		case "prepTime":
			orderBy = [{ prepTime: dir }, { id: "desc" }]
			break
		case "createdAt":
			orderBy = [{ createdAt: dir }, { id: "desc" }]
			break
		case "ingredientCount":
			orderBy = [{ ingredients: { _count: dir } }, { id: "desc" }]
			break
		case "calories":
			orderBy = [{ calories: dir }, { id: "desc" }]
			break
		default:
			orderBy = [{ createdAt: "desc" }, { id: "desc" }]
	}

	const validPage = Math.max(1, page)
	const validLimit = Math.max(1, limit)
	const skip = (validPage - 1) * validLimit

	const select = fields.reduce(
		(acc, key) => {
			acc[key as keyof Prisma.RecipeSelect] = true
			return acc
		},
		{} as Record<string, true>,
	)

	const where: Prisma.RecipeWhereInput = {
		createdById: clerkId,
		AND: [
			search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" } },
							{ description: { contains: search, mode: "insensitive" } },
						],
					}
				: {},

			category ? { category } : {},

			prepTime ? { prepTime: { lte: prepTime } } : {},

			calories ? { calories: { lte: calories } } : {},

			tags.length > 0 ? { tags: { some: { name: { in: tags } } } } : {},

			ingredients.length > 0
				? { ingredients: { some: { product: { in: ingredients } } } }
				: {},
		],
	}

	const [recipes, total] = await Promise.all([
		prisma.recipe.findMany({
			where,
			select: select as Prisma.RecipeSelect,
			skip,
			take: limit,
			orderBy: orderBy,
		}),
		prisma.recipe.count({ where }),
	])

	return { recipes, total }
}

async function getUserTagsCached(clerkId: string) {
	"use cache"
	cacheLife("minutes")
	cacheTag(`recipes:user:${clerkId}`)

	const tags = await prisma.tag.findMany({
		where: { recipe: { createdById: clerkId } },
		select: { name: true },
		distinct: ["name"],
		orderBy: { name: "asc" },
	})

	return tags.map((t: { name: string }) => t.name)
}

async function getUserIngredientsCached(clerkId: string) {
	"use cache"
	cacheLife("minutes")
	cacheTag(`recipes:user:${clerkId}`)

	const ingredients = await prisma.ingredient.findMany({
		where: { recipe: { createdById: clerkId } },
		select: { product: true },
		distinct: ["product"],
		orderBy: { product: "asc" },
	})

	return ingredients.map((i: { product: string | null }) => i.product ?? "")
}

export async function getUserRecipes<K extends keyof Prisma.RecipeSelect>(
	fields?: K[],
	options: GetUserRecipesOptions = {},
) {
	const user = await getCurrentUser()
	if (!user) return { recipes: [], total: 0 }

	return getUserRecipesCached(user.clerkId, {
		search: options.search ?? "",
		page: options.page ?? 1,
		limit: options.limit ?? 10,
		category: options.category ?? null,
		prepTime: options.prepTime ?? null,
		calories: options.calories ?? null,
		tags: options.tags ?? [],
		ingredients: options.ingredients ?? [],
		sort: options.sort ?? "createdAt.desc",
		fields: (fields ?? []) as string[],
	})
}

export async function getUserTags() {
	const user = await getCurrentUser()
	if (!user) return []

	return getUserTagsCached(user.clerkId)
}

export async function getUserIngredients() {
	const user = await getCurrentUser()
	if (!user) return []

	return getUserIngredientsCached(user.clerkId)
}

/**
 * Fetch a single recipe for the current user by slug, with optional field selection.
 * Example: getUserRecipeBySlug('chocolate-cake', ['id', 'name'])
 */
export async function getUserRecipeBySlug<K extends keyof Prisma.RecipeSelect>(
	slug: string,
	fields?: K[],
	excludeFields?: K[],
) {
	const user = await getCurrentUser()
	if (!user) return null

	if (fields && fields.length > 0) {
		const partialSelect = fields.reduce(
			(acc, key) => {
				acc[key] = true
				return acc
			},
			{} as Record<K, true>,
		)

		const select = {
			...partialSelect,
			ingredients: true,
			steps: true,
			tags: true,
			uploads: true,
		} as Prisma.RecipeSelect

		return prisma.recipe.findFirst({
			where: { slug, createdById: user.clerkId },
			select,
		})
	}

	if (excludeFields && excludeFields.length > 0) {
		const recipe = await prisma.recipe.findFirst({
			where: { slug, createdById: user.clerkId },
			include: { ingredients: true, steps: true, tags: true, uploads: true },
		})
		if (!recipe) return null

		const filtered = Object.fromEntries(
			Object.entries(recipe).filter(([k]) => !excludeFields.includes(k as K)),
		) as typeof recipe

		return filtered
	}

	return prisma.recipe.findFirst({
		where: { slug, createdById: user.clerkId },
		include: { ingredients: true, steps: true, tags: true, uploads: true },
	})
}
