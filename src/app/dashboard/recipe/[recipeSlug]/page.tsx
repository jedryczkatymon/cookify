import Image from "next/image"
import { notFound } from "next/navigation"
import EditButton from "@/components/button-edit"
import DialogDelete from "@/components/dialog-delete"
import RecipeScaler from "@/components/recipe-scaler"
import { H1, H2 } from "@/components/ui/typography"
import { getUserRecipeBySlug } from "@/lib/get-user-info"
import type { Step } from "@/prisma"

export default async function Recipe({
	params,
}: {
	params: Promise<{ recipeSlug: string }>
}) {
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
					<p className="mt-4">{recipe.description}</p>
				) : null}

				<RecipeScaler
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

			<div className="mt-10">
				<DialogDelete slug={recipeSlug} />
				<EditButton slug={recipeSlug} />
			</div>
		</div>
	)
}
