import DialogDelete from '@/components/dialog-delete'
import { H1, H2 } from '@/components/ui/typography'
import { getUserRecipeBySlug } from '@/lib/prisma/getUserRecipes'
import { notFound } from 'next/navigation'
import type { Ingredient, Step } from 'types/types'

export default async function Recipe({
	params,
}: {
	params: Promise<{ recipeSlug: string }>
}) {
	const { recipeSlug } = await params
	const recipe = await getUserRecipeBySlug(recipeSlug)
	console.log('recipe', recipe)

	if (!recipe) {
		return notFound()
	}

	return (
		<div>
			<>
				<header>
					<H1>{recipe.name}</H1>
					{recipe.description ? (
						<p style={{ marginTop: 6 }}>{recipe.description}</p>
					) : null}
					<p style={{ color: '#6b7280', marginTop: 8 }}>
						{recipe.category && <span>{recipe.category} · </span>}
						<span>Servings: {recipe.servings ?? '—'}</span>
						<span> · Prep: {recipe.prepTime ?? '—'} min</span>
					</p>
					{recipe.tags?.length ? (
						<p style={{ marginTop: 8 }}>
							Tags:{' '}
							{(recipe.tags as { name: string }[])
								.map((t) => t.name)
								.join(', ')}
						</p>
					) : null}
				</header>

				<section style={{ marginTop: 16 }}>
					<H2>Ingredients</H2>
					<ul>
						{recipe.ingredients?.length ? (
							recipe.ingredients.map((ing: Ingredient) => (
								<li key={ing.id}>
									{ing.amount} {ing.unit} {ing.name}
								</li>
							))
						) : (
							<li>No ingredients</li>
						)}
					</ul>
				</section>

				<section style={{ marginTop: 16 }}>
					<H2>Steps</H2>
					<ol>
						{(recipe.steps ?? [])
							.slice()
							.sort((a: Step, b: Step) => (a.order ?? 0) - (b.order ?? 0))
							.map((s: Step) => (
								<li
									key={s.id}
									style={{ whiteSpace: 'pre-wrap', marginBottom: 8 }}
								>
									{s.content}
								</li>
							))}
					</ol>
				</section>

				{recipe.notes ? (
					<section style={{ marginTop: 16 }}>
						<h3>Notes</h3>
						<p>{recipe.notes}</p>
					</section>
				) : null}
			</>

			<DialogDelete slug={recipeSlug} />
			{/* Raw JSON for debugging */}
			<pre style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>
				{JSON.stringify(recipe, null, 2)}
			</pre>
		</div>
	)
}
