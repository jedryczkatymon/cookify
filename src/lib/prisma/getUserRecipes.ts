import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/prisma/getCurrentUser"
import type { Prisma } from "@/prisma"

interface GetUserRecipesOptions {
	search?: string
	page?: number
	limit?: number
}

export async function getUserRecipes<K extends keyof Prisma.RecipeSelect>(
	fields?: K[],
	options: GetUserRecipesOptions = {},
) {
	const user = await getCurrentUser()
	if (!user) return { recipes: [], total: 0 }

	const { search, page = 1, limit = 10 } = options
	const validPage = Math.max(1, page)
	const skip = (validPage - 1) * limit

	const select = fields?.reduce(
		(acc, key) => {
			acc[key] = true
			return acc
		},
		{} as Record<K, true>,
	)

	const where: Prisma.RecipeWhereInput = {
		createdById: user.clerkId,
		...(search && {
			OR: [
				{ name: { contains: search, mode: "insensitive" } },
				{ description: { contains: search, mode: "insensitive" } },
			],
		}),
	}

	const [recipes, total] = await Promise.all([
		prisma.recipe.findMany({
			where,
			select: select as Prisma.RecipeSelect,
			skip,
			take: limit,
			orderBy: { updatedAt: "desc" },
		}),
		prisma.recipe.count({ where }),
	])

	return { recipes, total }
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
		} as Prisma.RecipeSelect

		return prisma.recipe.findFirst({
			where: { slug, createdById: user.clerkId },
			select,
		})
	}

	// If excludeFields provided, fetch the full recipe (including relations)
	// then remove the excluded keys from the returned object.
	if (excludeFields && excludeFields.length > 0) {
		const recipe = await prisma.recipe.findFirst({
			where: { slug, createdById: user.clerkId },
			include: { ingredients: true, steps: true, tags: true },
		})
		if (!recipe) return null

		const filtered = Object.fromEntries(
			Object.entries(recipe).filter(([k]) => !excludeFields.includes(k as K)),
		) as typeof recipe

		return filtered
	}

	// Default: return full recipe including relations
	return prisma.recipe.findFirst({
		where: { slug, createdById: user.clerkId },
		include: { ingredients: true, steps: true, tags: true, uploads: true },
	})
}
