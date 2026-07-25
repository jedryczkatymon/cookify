import { getUserRecipes } from "@/lib/get-user-info"

const PICKER_FIELDS = [
	"id",
	"slug",
	"name",
	"uploads",
	"prepTime",
	"calories",
	"servings",
	"category",
] as const

export type PickerRecipeResult = {
	id: number
	slug: string
	name: string
	prepTime: number | null
	calories: number | null
	servings: number | null
	category: string | null
	uploads: { url: string } | null
}

export async function getRecipesForPicker(options?: {
	search?: string
	category?: string | null
}): Promise<PickerRecipeResult[]> {
	const { recipes } = await getUserRecipes([...PICKER_FIELDS], {
		search: options?.search ?? "",
		page: 1,
		limit: 20,
		category: options?.category ?? null,
		sort: "name.asc",
	})

	return recipes.map((r) => ({
		id: r.id,
		slug: r.slug,
		name: r.name,
		prepTime: r.prepTime ?? null,
		calories: r.calories ?? null,
		servings: r.servings ?? null,
		category: r.category ?? null,
		uploads: r.uploads ?? null,
	}))
}
