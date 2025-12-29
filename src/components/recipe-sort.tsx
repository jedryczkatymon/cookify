"use client"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ArrowUpDown, Check } from "lucide-react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"

const sortOptions = [
	{ label: "Date Created (Newest)", value: "createdAt.desc" },
	{ label: "Date Created (Oldest)", value: "createdAt.asc" },
	{ label: "Name (A-Z)", value: "name.asc" },
	{ label: "Name (Z-A)", value: "name.desc" },
	{ label: "Prep Time (Shortest)", value: "prepTime.asc" },
	{ label: "Prep Time (Longest)", value: "prepTime.desc" },
	{ label: "Ingredients (Least)", value: "ingredientCount.asc" },
	{ label: "Ingredients (Most)", value: "ingredientCount.desc" },
]

export function RecipeSort() {
	const [params, setParams] = useQueryStates(
		{
			sort: parseAsString.withDefault("createdAt.desc"),
			page: parseAsInteger.withDefault(1),
		},
		{
			shallow: false,
			history: "push",
		},
	)

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline" size="icon" className="shrink-0">
					<ArrowUpDown className="h-4 w-4" />
					<span className="sr-only">Sort</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				{sortOptions.map((option) => (
					<DropdownMenuItem
						key={option.value}
						onClick={() => {
							setParams({ sort: option.value, page: 1 })
						}}
					>
						{option.label}
						<Check
							className={cn(
								"ml-auto h-4 w-4",
								params.sort === option.value ? "opacity-100" : "opacity-0",
							)}
						/>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
