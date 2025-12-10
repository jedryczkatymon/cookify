import RecipeForm from "@/components/recipe-form"
import { getUserRecipeBySlug } from "@/lib/prisma/getUserRecipes"
import { notFound } from "next/navigation"
import type { Recipe } from "types/types"

export default async function Page({
	params,
}: { params: { recipeSlug: string } | Promise<{ recipeSlug: string }> }) {
	const { recipeSlug } = (await params) as { recipeSlug: string }
	const recipe = await getUserRecipeBySlug(recipeSlug)
	if (!recipe) return notFound()

	return <RecipeForm recipe={recipe as Recipe} />
}
