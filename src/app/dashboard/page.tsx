import { FileXCorner } from "lucide-react"
import Link from "next/link"
import { Suspense } from "react"
import ButtonCreateRound from "@/components/button-create-round"
import { PerPageDropdown } from "@/components/per-page-dropdown"
import { RecipeFilters } from "@/components/recipe-filters"
import RecipeGrid from "@/components/recipe-grid"
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
import { getUserRecipes } from "@/lib/get-user-info"
import { searchParamsCache } from "@/lib/search-params"

type PageProps = {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function DashboardPage({ searchParams }: PageProps) {
	return (
		<Suspense fallback={<DashboardFallback />}>
			<DashboardContent searchParams={searchParams} />
		</Suspense>
	)
}

function DashboardFallback() {
	return (
		<div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-4/5 flex-col gap-6">
			<h1 className="font-bold text-2xl tracking-tight">Recipes</h1>
			<div className="flex flex-1 flex-col justify-start gap-4 pt-[min(12vh,6rem)]">
				<div
					className="flex flex-wrap items-center justify-end gap-2"
					aria-hidden
				>
					<div className="h-9 w-full basis-full animate-pulse rounded-md bg-muted sm:w-56 sm:basis-auto" />
					<div className="size-9 animate-pulse rounded-md bg-muted" />
					<div className="size-9 animate-pulse rounded-md bg-muted" />
					<div className="h-9 w-14 animate-pulse rounded-md bg-muted" />
				</div>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
					{[
						"skeleton-1",
						"skeleton-2",
						"skeleton-3",
						"skeleton-4",
						"skeleton-5",
						"skeleton-6",
						"skeleton-7",
						"skeleton-8",
						"skeleton-9",
						"skeleton-10",
					].map((id) => (
						<div
							key={id}
							className="overflow-hidden rounded-md border bg-white shadow-sm"
						>
							<div className="aspect-[4/3] animate-pulse bg-muted" />
							<div className="space-y-2 p-3">
								<div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
								<div className="h-6 w-full animate-pulse rounded bg-muted" />
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

async function DashboardContent({ searchParams }: PageProps) {
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
		["id", "slug", "name", "uploads", "prepTime", "calories", "servings"],
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
		<div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-4/5 flex-col gap-6">
			<h1 className="font-bold text-2xl tracking-tight">Recipes</h1>

			<div className="flex flex-1 flex-col gap-4">
				{(total > 0 || hasActiveFilters) && (
					<div className="flex flex-wrap items-center justify-end gap-2">
						<SearchInput />
						<RecipeFilters />
						<RecipeSort />
						<PerPageDropdown />
					</div>
				)}

				{!recipes || recipes.length === 0 ? (
					<div className="flex flex-1 items-center justify-center">
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
					</div>
				) : (
					<>
						<RecipeGrid
							key={`${page}-${perPage}-${q}-${sort}-${category ?? ""}-${prepTime ?? ""}-${calories ?? ""}-${tags.join(",")}-${ingredients.join(",")}`}
							initialRecipes={recipes}
							page={page}
							perPage={perPage}
							initialTotal={total}
						/>

						{total > perPage && (
							<Pagination className="mt-8 mb-24 md:mb-12">
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
			</div>
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
