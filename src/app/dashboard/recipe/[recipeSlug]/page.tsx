import { getUserRecipeBySlug } from '@/lib/prisma/getUserRecipes'
import { notFound } from 'next/navigation'

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
			<h1>{recipe.name}</h1>
			<p>Description: {recipe.description ?? '—'}</p>
			<p>Cuisine: {recipe.cuisine ?? '—'}</p>
			<p>Category: {recipe.category ?? '—'}</p>
			<p>Servings: {recipe.servings ?? '—'}</p>
			<p>Prep time: {recipe.prepTime ?? '—'}</p>
			<p>Notes: {recipe.notes ?? '—'}</p>

			<h2>Ingredients</h2>
			{recipe.ingredients && recipe.ingredients.length > 0 ? (
				<ul>
					{recipe.ingredients.map((ing) => (
						<li key={ing.id}>
							{ing.amount ?? ''}
							{ing.unit ? ` ${ing.unit}` : ''} — {ing.name}
							{ing.section ? ` (${ing.section})` : ''}
						</li>
					))}
				</ul>
			) : (
				<p>No ingredients</p>
			)}

			<h2>Steps</h2>
			{recipe.steps && recipe.steps.length > 0 ? (
				<ol>
					{[...recipe.steps]
						.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
						.map((step) => (
							<li key={step.id}>{step.content}</li>
						))}
				</ol>
			) : (
				<p>No steps</p>
			)}

			{/* Raw JSON for debugging */}
			<pre style={{ whiteSpace: 'pre-wrap', marginTop: 16 }}>
				{JSON.stringify(recipe, null, 2)}
			</pre>
		</div>
	)
}
