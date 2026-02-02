"use client"

import { Search } from "lucide-react"
import { parseAsInteger, useQueryState } from "nuqs"
import { Input } from "@/components/ui/input"

export function SearchInput() {
	const [search, setSearch] = useQueryState("q", {
		defaultValue: "",
		parse: (value) => value || "",
		shallow: false,
		throttleMs: 300,
	})

	const [, setPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1).withOptions({
			shallow: false,
			history: "push",
		}),
	)

	return (
		<div className="relative w-full sm:w-64">
			<Search className="absolute top-2.5 left-2.5 h-4 w-4 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search recipes..."
				className="pl-8"
				value={search}
				onChange={(e) => {
					setSearch(e.target.value)
					setPage(1)
				}}
			/>
		</div>
	)
}
