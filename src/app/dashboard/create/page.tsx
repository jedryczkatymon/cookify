import { Suspense } from "react"
import RecipeForm from "@/components/recipe-form"

export default function RecipeFormPage() {
	return (
		<Suspense fallback={null}>
			<RecipeForm />
		</Suspense>
	)
}
