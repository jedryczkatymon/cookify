import DialogDelete from "@/components/dialog-delete"
import { H1, H2 } from "@/components/ui/typography"
import { getUserRecipeBySlug } from "@/lib/prisma/getUserRecipes"
import Image from "next/image" // 1. Import Image component
import { notFound } from "next/navigation"
import type { Ingredient, Step } from "types/types"

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

	// 2. Safely grab the first image URL
	// We assume recipe includes 'uploads' (see "Crucial Step" below)
	const heroImage = recipe.uploads?.[0]?.url

	return (
		<div className="mx-auto max-w-3xl py-10">
			{" "}
			{/* Added container constraint for better look */}
			<>
				<header>
					<H1>{recipe.name}</H1>

					{/* 3. Display the Image */}
					{heroImage && (
						<div className="relative mt-6 aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
							<Image
								src={heroImage}
								alt={recipe.name}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
								priority // loads this image immediately as it's above the fold
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
						{/* Added some basic list styling */}
						{recipe.ingredients?.length ? (
							recipe.ingredients.map((ing: Ingredient) => (
								<li key={ing.id} className="mb-2">
									{ing.amount} {ing.unit} {ing.name}
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
						<H2>Notes</H2> {/* Changed h3 to H2 for consistency */}
						<p className="mt-2">{recipe.notes}</p>
					</section>
				) : null}
			</>
			<div className="mt-10">
				<DialogDelete slug={recipeSlug} />
			</div>
			{/* Debugging: Remove this in production */}
			{/* <pre style={{ whiteSpace: "pre-wrap", marginTop: 16 }}>
        {JSON.stringify(recipe, null, 2)}
      </pre> */}
		</div>
	)
}
