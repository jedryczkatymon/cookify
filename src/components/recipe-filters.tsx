"use client"

import { Check, Filter, Loader2 } from "lucide-react"
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
	useQueryState,
} from "nuqs"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { MEALS } from "@/lib/enums"
import { cn } from "@/lib/utils"

type FilterOptionType = "tags" | "ingredients"

const FILTER_OPTIONS_LIMIT = "10"

function useFilterOptions(type: FilterOptionType, enabled: boolean) {
	const [items, setItems] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [search, setSearch] = useState("")
	const requestId = useRef(0)

	useEffect(() => {
		if (!enabled) return

		const controller = new AbortController()
		const id = ++requestId.current
		setLoading(true)
		const delay = search.trim() ? 200 : 0
		const timer = setTimeout(async () => {
			try {
				const params = new URLSearchParams({
					type,
					limit: FILTER_OPTIONS_LIMIT,
				})
				if (search.trim()) params.set("q", search.trim())

				const res = await fetch(
					`/api/recipes/filter-options?${params.toString()}`,
					{ signal: controller.signal },
				)
				if (!res.ok) return
				const data = (await res.json()) as { items: string[] }
				if (id !== requestId.current) return
				setItems(data.items ?? [])
			} catch (err) {
				if (err instanceof DOMException && err.name === "AbortError") return
			} finally {
				if (id === requestId.current) setLoading(false)
			}
		}, delay)

		return () => {
			clearTimeout(timer)
			controller.abort()
		}
	}, [enabled, search, type])

	useEffect(() => {
		if (!enabled) {
			setSearch("")
			setItems([])
			setLoading(false)
		}
	}, [enabled])

	return {
		items,
		loading,
		search,
		setSearch,
	}
}

export function RecipeFilters() {
	const [open, setOpen] = useState(false)

	const [, setPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1).withOptions({
			shallow: false,
			history: "push",
		}),
	)

	const [category, setCategory] = useQueryState(
		"category",
		parseAsString.withOptions({ shallow: false }),
	)

	const [maxPrepTime, setMaxPrepTime] = useQueryState(
		"prepTime",
		parseAsInteger.withOptions({ shallow: false }),
	)

	const [maxCalories, setMaxCalories] = useQueryState(
		"calories",
		parseAsInteger.withOptions({ shallow: false }),
	)

	const [tags, setTags] = useQueryState(
		"tags",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: false }),
	)

	const [ingredients, setIngredients] = useQueryState(
		"ingredients",
		parseAsArrayOf(parseAsString)
			.withDefault([])
			.withOptions({ shallow: false }),
	)

	const tagOptions = useFilterOptions("tags", open)
	const ingredientOptions = useFilterOptions("ingredients", open)

	const activeFilterCount =
		(category ? 1 : 0) +
		(maxPrepTime ? 1 : 0) +
		(maxCalories ? 1 : 0) +
		tags.length +
		ingredients.length

	const clearFilters = () => {
		setCategory(null)
		setMaxPrepTime(null)
		setMaxCalories(null)
		setTags(null)
		setIngredients(null)
	}

	const toggleTag = (currentTag: string) => {
		setTags((prev) => {
			if (prev.includes(currentTag)) {
				return prev.filter((t) => t !== currentTag)
			}
			return [...prev, currentTag]
		})
	}

	const toggleIngredient = (currentValue: string) => {
		setIngredients((old) => {
			if (old.includes(currentValue)) {
				return old.filter((i) => i !== currentValue)
			}
			return [...old, currentValue]
		})
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button variant="outline" className="gap-2 border-dashed">
					<Filter className="h-4 w-4" />
					{activeFilterCount > 0 && (
						<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
							{activeFilterCount}
						</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-80 p-4" align="start">
				<div className="grid gap-4">
					<div className="flex items-center justify-between">
						<h4 className="font-medium leading-none">Filter Recipes</h4>
						{activeFilterCount > 0 && (
							<Button
								variant="ghost"
								className="h-auto p-0 text-muted-foreground text-xs hover:text-primary"
								onClick={clearFilters}
							>
								Reset
							</Button>
						)}
					</div>

					<div className="grid gap-2">
						<div className="grid gap-2">
							<Label htmlFor="category">Category</Label>
							<Select
								value={category || "all"}
								onValueChange={(val) => {
									setCategory(val === "all" ? null : val)
									setPage(1)
								}}
							>
								<SelectTrigger id="category">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{MEALS.map((meal) => (
										<SelectItem key={meal} value={meal}>
											{meal}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="prepTime">Max Prep Time (minutes)</Label>
							<Input
								id="prepTime"
								type="number"
								placeholder="e.g. 30"
								value={maxPrepTime || ""}
								onChange={(e) => {
									const val = e.target.value
										? Number.parseInt(e.target.value, 10)
										: null
									setMaxPrepTime(val)
									setPage(1)
								}}
							/>
						</div>

						<div className="grid gap-2">
							<Label htmlFor="calories">Max Calories</Label>
							<Input
								id="calories"
								type="number"
								placeholder="e.g. 500"
								value={maxCalories || ""}
								onChange={(e) => {
									const val = e.target.value
										? Number.parseInt(e.target.value, 10)
										: null
									setMaxCalories(val)
									setPage(1)
								}}
							/>
						</div>

						<div className="grid gap-2">
							<Label>Tags</Label>
							<div className="rounded-md border p-1">
								<Command shouldFilter={false}>
									<CommandInput
										placeholder="Search tags..."
										className="h-9"
										value={tagOptions.search}
										onValueChange={tagOptions.setSearch}
									/>
									<CommandList>
										{tagOptions.loading ? (
											<div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
												<Loader2 className="h-4 w-4 animate-spin" />
												Loading…
											</div>
										) : (
											<>
												<CommandEmpty>No tag found.</CommandEmpty>
												<CommandGroup className="max-h-40 overflow-y-auto">
													{tagOptions.items.map((t) => {
														const isSelected = tags.includes(t)
														return (
															<CommandItem
																key={t}
																value={t}
																onSelect={() => {
																	toggleTag(t)
																	setPage(1)
																}}
															>
																<div
																	className={cn(
																		"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
																		isSelected
																			? "bg-primary text-primary-foreground"
																			: "opacity-50 [&_svg]:invisible",
																	)}
																>
																	<Check className={cn("h-4 w-4")} />
																</div>
																{t}
															</CommandItem>
														)
													})}
												</CommandGroup>
											</>
										)}
									</CommandList>
								</Command>
							</div>
						</div>

						<div className="grid gap-2">
							<Label>Ingredients</Label>
							<div className="rounded-md border p-1">
								<Command shouldFilter={false}>
									<CommandInput
										placeholder="Search ingredients..."
										className="h-9"
										value={ingredientOptions.search}
										onValueChange={ingredientOptions.setSearch}
									/>
									<CommandList>
										{ingredientOptions.loading ? (
											<div className="flex items-center justify-center gap-2 py-4 text-muted-foreground text-sm">
												<Loader2 className="h-4 w-4 animate-spin" />
												Loading…
											</div>
										) : (
											<>
												<CommandEmpty>No ingredient found.</CommandEmpty>
												<CommandGroup className="max-h-40 overflow-y-auto">
													{ingredientOptions.items.map((item) => {
														const isSelected = ingredients.includes(item)
														return (
															<CommandItem
																key={item}
																value={item}
																onSelect={() => {
																	toggleIngredient(item)
																	setPage(1)
																}}
															>
																<div
																	className={cn(
																		"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
																		isSelected
																			? "bg-primary text-primary-foreground"
																			: "opacity-50 [&_svg]:invisible",
																	)}
																>
																	<Check className={cn("h-4 w-4")} />
																</div>
																{item}
															</CommandItem>
														)
													})}
												</CommandGroup>
											</>
										)}
									</CommandList>
								</Command>
							</div>
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	)
}
