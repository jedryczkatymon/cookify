import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/prisma/getCurrentUser"
import type { Prisma } from "prisma/generated/browser"

/**
 * Fetch recipes for the current user, with optional field selection.
 * Example: getUserRecipes(['id', 'name'])
 */
export async function getUserRecipes<K extends keyof Prisma.RecipeSelect>(
	fields?: K[],
) {
	const user = await getCurrentUser()
	if (!user) return []

	const select = fields?.reduce(
		(acc, key) => {
			acc[key] = true
			return acc
		},
		{} as Record<K, true>,
	)

	return prisma.recipe.findMany({
		where: { createdById: user.clerkId },
		select: select as Prisma.RecipeSelect,
	})
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

	// If specific fields requested, build a select and always include relations
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

		// Create a new object without the excluded keys to avoid mutating the original
		const filtered = Object.fromEntries(
			Object.entries(recipe).filter(([k]) => !excludeFields.includes(k as K)),
		) as typeof recipe

		return filtered
	}

	// Default: return full recipe including relations
	return prisma.recipe.findFirst({
		where: { slug, createdById: user.clerkId },
		include: { ingredients: true, steps: true, tags: true },
	})
}
