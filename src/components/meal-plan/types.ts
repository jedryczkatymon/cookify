export type MealPlanRecipe = {
	id: number
	slug: string
	name: string
	prepTime: number | null
	calories: number | null
	servings: number | null
	category: string | null
	uploads: { url: string } | null
}

export type MealPlanEntryView = {
	id: number
	date: string
	order: number
	servings: number | null
	recipeId: number
	recipe: MealPlanRecipe
}
