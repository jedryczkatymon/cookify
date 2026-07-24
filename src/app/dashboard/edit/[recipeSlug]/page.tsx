import { notFound } from "next/navigation"
import { Suspense } from "react"
import RecipeForm from "@/components/recipe-form"
import { getUserRecipeBySlug } from "@/lib/get-user-info"

type PageProps = {
	params: Promise<{ recipeSlug: string }>
}

export default function EditPage({ params }: PageProps) {
	return (
		<Suspense fallback={<EditFallback />}>
			<EditPageContent params={params} />
		</Suspense>
	)
}

function EditFallback() {
	return (
		<div className="mx-auto max-w-3xl space-y-8 py-10" aria-hidden>
			<div className="h-9 w-48 animate-pulse rounded-md bg-muted" />

			<div className="space-y-2">
				<div className="h-6 w-32 animate-pulse rounded bg-muted" />
				<div className="aspect-video w-full animate-pulse rounded-lg bg-muted" />
			</div>

			{(["field-1", "field-2", "field-3", "field-4"] as const).map((id) => (
				<div key={id} className="space-y-2">
					<div className="h-4 w-24 animate-pulse rounded bg-muted" />
					<div className="h-10 w-full animate-pulse rounded-md bg-muted" />
				</div>
			))}

			<div className="space-y-3">
				<div className="h-6 w-28 animate-pulse rounded bg-muted" />
				{["ing-1", "ing-2", "ing-3", "ing-4"].map((id) => (
					<div key={id} className="flex gap-2">
						<div className="h-10 w-20 animate-pulse rounded-md bg-muted" />
						<div className="h-10 w-16 animate-pulse rounded-md bg-muted" />
						<div className="h-10 flex-1 animate-pulse rounded-md bg-muted" />
					</div>
				))}
			</div>

			<div className="space-y-3">
				<div className="h-6 w-20 animate-pulse rounded bg-muted" />
				{["step-1", "step-2", "step-3"].map((id) => (
					<div
						key={id}
						className="h-20 w-full animate-pulse rounded-md bg-muted"
					/>
				))}
			</div>

			<div className="h-10 w-28 animate-pulse rounded-md bg-muted" />
		</div>
	)
}

async function EditPageContent({ params }: PageProps) {
	const { recipeSlug } = await params
	const recipe = await getUserRecipeBySlug(recipeSlug)
	if (!recipe) return notFound()

	return <RecipeForm recipe={recipe} />
}
