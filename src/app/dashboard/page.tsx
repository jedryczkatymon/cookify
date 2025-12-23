import RecipeCard from "@/components/recipe-card"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import { getUserRecipes } from "@/lib/prisma/getUserRecipes"
import type { Recipe } from "@/prisma"
import { FileXCorner } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
	const recipes = await getUserRecipes([
		"id",
		"slug",
		"name",
		"prepTime",
		"tags",
		"createdBy",
	])

	return (
		<>
			{!recipes || recipes.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileXCorner />
						</EmptyMedia>
						<EmptyTitle>No Recipes Yet</EmptyTitle>
						<EmptyDescription>
							You haven&apos;t created any recipes yet. Get started by creating
							your first recipe.
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<div className="flex gap-2">
							<Button>
								<Link href="/dashboard/create">Create recipe</Link>
							</Button>
							<Button variant="outline">
								<Link href="/dashboard/import">Import recipe</Link>
							</Button>
						</div>
					</EmptyContent>
				</Empty>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{recipes.map((recipe: Recipe) => (
							<RecipeCard key={recipe.id} recipe={recipe} />
						))}
					</div>
				</>
			)}
		</>
	)
}
