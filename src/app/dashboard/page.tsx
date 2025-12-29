import ButtonCreateRound from "@/components/button-create-round"
import { PerPageSelector } from "@/components/per-page-dropdown"
import RecipeCard from "@/components/recipe-card"
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
import { getUserRecipes } from "@/lib/prisma/getUserRecipes"
import { searchParamsCache } from "@/lib/search-params"
import type { Recipe } from "@/prisma"
import { FileXCorner } from "lucide-react"
import Link from "next/link"

type PageProps = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
	const { q, page, perPage } = await searchParamsCache.parse(searchParams)

	const { recipes, total } = await getUserRecipes(
		["id", "slug", "name", "prepTime", "tags", "createdBy"],
		{ search: q, page, limit: perPage },
	)

	const hasActiveFilters = q.length > 0
	const totalPages = Math.ceil(total / perPage)

	const buildLink = (newPage: number) =>
		`/dashboard?q=${q}&page=${newPage}&perPage=${perPage}`

	const allPages = getPageNumbers(page, totalPages)

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="font-bold text-2xl tracking-tight">Recipes</h1>

				{(total > 0 || hasActiveFilters) && (
					<div className="flex items-center gap-2">
						<SearchInput />
						<PerPageSelector />
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
								? `No recipes found matching "${q}". Try a different search term.`
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
									<PaginationPrevious
										href={page > 1 ? buildLink(page - 1) : "#"}
										aria-disabled={page <= 1}
										className={
											page <= 1 ? "pointer-events-none opacity-50" : ""
										}
									/>
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
									<PaginationNext
										href={page < totalPages ? buildLink(page + 1) : "#"}
										aria-disabled={page >= totalPages}
										className={
											page >= totalPages ? "pointer-events-none opacity-50" : ""
										}
									/>
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

function getPageNumbers(currentPage: number, totalPages: number) {
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
