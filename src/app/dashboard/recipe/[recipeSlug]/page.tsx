import Image from "next/image"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import EditButton from "@/components/button-edit"
import DialogDelete from "@/components/dialog-delete"
import RecipeScaler from "@/components/recipe-scaler"
import { H1, H2 } from "@/components/ui/typography"
import { getUserRecipeBySlug } from "@/lib/get-user-info"
import type { Step } from "@/prisma"

type PageProps = {
	params: Promise<{ recipeSlug: string }>
}

export default function RecipePage({ params }: PageProps) {
	return (
		<Suspense fallback={<RecipeFallback />}>
			<RecipeContent params={params} />
		</Suspense>
	)
}

function RecipeFallback() {
	return (
		<div className="mx-auto max-w-3xl py-10" aria-hidden>
			<div className="h-9 w-2/3 animate-pulse rounded-md bg-muted" />
			<div className="mt-6 aspect-video w-full animate-pulse rounded-lg bg-muted" />
			<div className="mt-6 space-y-2">
				<div className="h-4 w-full animate-pulse rounded bg-muted" />
				<div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
				<div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
			</div>

			<div className="mt-8 space-y-4">
				<div className="flex flex-wrap gap-2">
					<div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
					<div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
					<div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
				</div>
				<div className="space-y-3">
					{["ing-1", "ing-2", "ing-3", "ing-4", "ing-5", "ing-6"].map((id) => (
						<div key={id} className="flex items-center gap-3">
							<div className="size-4 shrink-0 animate-pulse rounded bg-muted" />
							<div className="h-4 flex-1 animate-pulse rounded bg-muted" />
						</div>
					))}
				</div>
			</div>

			<div className="mt-6 space-y-3">
				<div className="h-7 w-24 animate-pulse rounded bg-muted" />
				{["step-1", "step-2", "step-3", "step-4"].map((id) => (
					<div key={id} className="h-4 w-full animate-pulse rounded bg-muted" />
				))}
			</div>

			<div className="mt-10 flex gap-5">
				<div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
				<div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
			</div>
		</div>
	)
}

async function RecipeContent({ params }: PageProps) {
	const { recipeSlug } = await params

	const recipe = await getUserRecipeBySlug(recipeSlug)

	if (!recipe) {
		return notFound()
	}

	const heroImage = recipe.uploads?.url

	return (
		<div className="mx-auto max-w-3xl py-10">
			<header>
				<H1>{recipe.name}</H1>

				{heroImage && (
					<div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
						<Image
							src={heroImage}
							alt={recipe.name}
							fill
							className="object-cover"
							sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
							priority
						/>
					</div>
				)}

				{recipe.description ? (
					<p className="mt-6">{recipe.description}</p>
				) : null}

				<RecipeScaler
					recipeSlug={recipeSlug}
					initialServings={recipe.servings ?? 1}
					ingredients={recipe.ingredients ?? []}
					prepTime={recipe.prepTime}
					calories={recipe.calories}
					category={recipe.category}
					tags={recipe.tags}
				/>
			</header>

			<section className="mt-6">
				<H2>Steps</H2>
				<ol className="mt-4 list-inside list-decimal">
					{(recipe.steps ?? [])
						.slice()
						.sort((a: Step, b: Step) => (a.order ?? 0) - (b.order ?? 0))
						.map((s: Step) => (
							<li key={s.id} className="mb-3 whitespace-pre-wrap">
								{s.content}
							</li>
						))}
				</ol>
			</section>

			{recipe.notes ? (
				<section className="mt-6">
					<H2>Notes</H2>
					<p className="mt-2">{recipe.notes}</p>
				</section>
			) : null}

			<div className="mt-10 flex gap-5">
				<DialogDelete slug={recipeSlug} />
				<EditButton slug={recipeSlug} />
			</div>
		</div>
	)
}
