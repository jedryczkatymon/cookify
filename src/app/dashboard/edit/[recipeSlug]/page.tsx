import { notFound } from "next/navigation"
import { Suspense } from "react"
import RecipeForm from "@/components/recipe-form"
import { getUserRecipeBySlug } from "@/lib/get-user-info"

type PageProps = {
	params: Promise<{ recipeSlug: string }>
}

export default function EditPage({ params }: PageProps) {
	return (
		<Suspense fallback={null}>
			<EditPageContent params={params} />
		</Suspense>
	)
}

async function EditPageContent({ params }: PageProps) {
	const { recipeSlug } = await params
	const recipe = await getUserRecipeBySlug(recipeSlug)
	if (!recipe) return notFound()

	return <RecipeForm recipe={recipe} />
}
