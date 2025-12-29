import EditButton from "@/components/button-edit"
import DialogDelete from "@/components/dialog-delete"
import { H1, H2 } from "@/components/ui/typography"
import { getUserRecipeBySlug } from "@/lib/get-user-info"
import type { Ingredient, Step } from "@/prisma"
import Image from "next/image"
import { notFound } from "next/navigation"

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
			{" "}
			<>
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
						<p style={{ marginTop: 16 }}>{recipe.description}</p>
					) : null}

					<p style={{ color: "#6b7280", marginTop: 8 }}>
						{recipe.category && <span>{recipe.category} · </span>}
						<span>Servings: {recipe.servings ?? "—"}</span>
						<span> · Prep: {recipe.prepTime ?? "—"} min</span>
					</p>
					{recipe.tags?.length ? (
						<p style={{ marginTop: 8 }}>
							Tags:{" "}
							{(recipe.tags as { name: string }[])
								.map((t) => t.name)
								.join(", ")}
						</p>
					) : null}
				</header>

				<section style={{ marginTop: 24 }}>
					<H2>Ingredients</H2>
					<ul className="mt-4 list-inside list-disc">
						{" "}
						{recipe.ingredients?.length ? (
							recipe.ingredients.map((ing: Ingredient) => (
								<li key={ing.id} className="mb-2">
									{ing.amount} {ing.unit} {ing.product}
								</li>
							))
						) : (
							<li>No ingredients</li>
						)}
					</ul>
				</section>

				<section style={{ marginTop: 24 }}>
					<H2>Steps</H2>
					<ol className="mt-4 list-inside list-decimal">
						{(recipe.steps ?? [])
							.slice()
							.sort((a: Step, b: Step) => (a.order ?? 0) - (b.order ?? 0))
							.map((s: Step) => (
								<li
									key={s.id}
									style={{ whiteSpace: "pre-wrap", marginBottom: 12 }}
								>
									{s.content}
								</li>
							))}
					</ol>
				</section>

				{recipe.notes ? (
					<section style={{ marginTop: 24 }}>
						<H2>Notes</H2>
						<p className="mt-2">{recipe.notes}</p>
					</section>
				) : null}
			</>
			<div className="mt-10">
				<DialogDelete slug={recipeSlug} />
				<EditButton slug={recipeSlug} />
			</div>
			{/* Debugging: Remove this in production */}
			{/* <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
        {JSON.stringify(recipe, null, 2)}
      </pre> */}
		</div>
	)
}
