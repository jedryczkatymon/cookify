"use client"

import { Search, X } from "lucide-react"
import {
	debounce,
	defaultRateLimit,
	parseAsInteger,
	throttle,
	useQueryState,
} from "nuqs"
import { Input } from "@/components/ui/input"

export function SearchInput() {
	const [search, setSearch] = useQueryState("q", {
		defaultValue: "",
		shallow: false,
	})

	const [, setPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1).withOptions({
			shallow: false,
			history: "push",
		}),
	)

	const clearSearch = () => {
		setSearch("", { limitUrlUpdates: defaultRateLimit })
		setPage(1, { limitUrlUpdates: defaultRateLimit })
	}

	return (
		<div className="relative w-full sm:w-64">
			<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search recipes..."
				className="pr-8 pl-8 [&::-webkit-search-cancel-button]:appearance-none"
				value={search}
				onChange={(e) => {
					const value = e.target.value

					setSearch(value, {
						limitUrlUpdates: value === "" ? defaultRateLimit : debounce(500),
					})

					setPage(1, {
						limitUrlUpdates: throttle(1000),
					})
				}}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						setSearch(search, { limitUrlUpdates: defaultRateLimit })
					}
				}}
			/>
			{search ? (
				<button
					type="button"
					aria-label="Clear search"
					onClick={clearSearch}
					className="absolute top-2.5 right-2.5 cursor-pointer text-foreground"
				>
					<X className="h-4 w-4" />
				</button>
			) : null}
		</div>
	)
}
