import { FileXCorner } from "lucide-react"
import Link from "next/link"
import ButtonCreateRound from "@/components/button-create-round"
import { PerPageDropdown } from "@/components/per-page-dropdown"
import RecipeCard from "@/components/recipe-card"
import { RecipeFilters } from "@/components/recipe-filters"
import { RecipeSort } from "@/components/recipe-sort"
import { SearchInput } from "@/components/search-input"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import {
	getUserIngredients,
	getUserRecipes,
	getUserTags,
} from "@/lib/get-user-info"
import { searchParamsCache } from "@/lib/search-params"
import type { Recipe } from "@/prisma"

type PageProps = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
	const {
		q,
		page,
		perPage,
		category,
		prepTime,
		calories,
		tags,
		ingredients,
		sort,
	} = await searchParamsCache.parse(searchParams)

	const { recipes, total } = await getUserRecipes(
		[
			"id",
			"slug",
			"name",
			"prepTime",
			"calories",
			"tags",
			"createdBy",
			"category",
		],
		{
			search: q,
			page,
			limit: perPage,
			category,
			prepTime: prepTime,
			calories: calories,
			tags,
			ingredients,
			sort,
		},
	)

	const availableTags = await getUserTags()
	const availableIngredients = await getUserIngredients()

	const hasActiveFilters =
		q.length > 0 ||
		!!category ||
		!!prepTime ||
		!!calories ||
		tags.length > 0 ||
		ingredients.length > 0

	const totalPages = Math.ceil(total / perPage)

	const buildLink = (newPage: number) => {
		const params = new URLSearchParams()
		if (q) params.set("q", q)
		params.set("page", newPage.toString())
		params.set("perPage", perPage.toString())
		if (category) params.set("category", category)
		if (prepTime) params.set("prepTime", prepTime.toString())
		if (calories) params.set("calories", calories.toString())
		if (sort) params.set("sort", sort)

		if (tags.length > 0) {
			for (const tag of tags) {
				params.append("tags", tag)
			}
		}

		if (ingredients.length > 0) {
			for (const ing of ingredients) {
				params.append("ingredients", ing)
			}
		}

		return `/dashboard?${params.toString()}`
	}

	const allPages = getPageNumbers(page, totalPages)

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="font-bold text-2xl tracking-tight">Recipes</h1>

				{(total > 0 || hasActiveFilters) && (
					<div className="flex items-center gap-2">
						<SearchInput />
						<RecipeFilters
							availableTags={availableTags}
							availableIngredients={availableIngredients}
						/>
						<RecipeSort />
						<PerPageDropdown />
					</div>
				)}
			</div>

			{!recipes || recipes.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileXCorner />
						</EmptyMedia>
						<EmptyTitle>
							{hasActiveFilters ? "No matches found" : "No Recipes Yet"}
						</EmptyTitle>
						<EmptyDescription>
							{hasActiveFilters
								? "No recipes found matching your filters. Try adjusting them."
								: "You haven't created any recipes yet. Get started by creating your first recipe."}
						</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						{hasActiveFilters ? (
							<Button variant="secondary">
								<Link href="/dashboard">Clear Search</Link>
							</Button>
						) : (
							<div className="flex gap-2">
								<Button>
									<Link href="/dashboard/create">Create recipe</Link>
								</Button>
								<Button variant="outline">
									<Link href="/dashboard/import">Import recipe</Link>
								</Button>
							</div>
						)}
					</EmptyContent>
				</Empty>
			) : (
				<>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{recipes.map((recipe: Recipe) => (
							<RecipeCard key={recipe.id} recipe={recipe} />
						))}
					</div>

					{total > perPage && (
						<Pagination className="mt-4">
							<PaginationContent>
								<PaginationItem>
									{page <= 1 ? (
										<span className="pointer-events-none opacity-50">
											<PaginationPrevious href="#" />
										</span>
									) : (
										<PaginationPrevious href={buildLink(page - 1)} />
									)}
								</PaginationItem>

								{allPages.map((p, index) => (
									<PaginationItem key={p === "..." ? `ellipsis-${index}` : p}>
										{p === "..." ? (
											<PaginationEllipsis />
										) : (
											<PaginationLink
												href={buildLink(Number(p))}
												isActive={page === p}
											>
												{p}
											</PaginationLink>
										)}
									</PaginationItem>
								))}

								<PaginationItem>
									{page >= totalPages ? (
										<span className="pointer-events-none opacity-50">
											<PaginationNext href="#" />
										</span>
									) : (
										<PaginationNext href={buildLink(page + 1)} />
									)}
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					)}
				</>
			)}
			<ButtonCreateRound />
		</div>
	)
}

function getPageNumbers(
	currentPage: number,
	totalPages: number,
): (number | string)[] {
	if (totalPages <= 0) return []
	const pages = new Set([
		1,
		totalPages,
		currentPage,
		currentPage - 1,
		currentPage + 1,
	])
	const sortedPages = Array.from(pages)
		.filter((p) => p >= 1 && p <= totalPages)
		.sort((a, b) => a - b)
	const result = []
	let previous = 0
	for (const p of sortedPages) {
		if (previous > 0) {
			if (p - previous === 2) {
				result.push(previous + 1)
			} else if (p - previous > 2) {
				result.push("...")
			}
		}
		result.push(p)
		previous = p
	}
	return result
}
