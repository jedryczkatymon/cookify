"use client"

import { parseAsInteger, useQueryState } from "nuqs"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"

export function PerPageDropdown() {
	const [perPage, setPerPage] = useQueryState(
		"perPage",
		parseAsInteger.withDefault(10).withOptions({
			shallow: false,
			history: "push",
		}),
	)

	const [, setPage] = useQueryState(
		"page",
		parseAsInteger.withDefault(1).withOptions({
			shallow: false,
			history: "push",
		}),
	)

	return (
		<Select
			value={perPage.toString()}
			onValueChange={(value) => {
				setPerPage(Number(value))
				setPage(1)
			}}
		>
			<SelectTrigger className="w-20">
				<SelectValue placeholder="Limit" />
			</SelectTrigger>
			<SelectContent>
				{[10, 25, 50].map((limit) => (
					<SelectItem key={limit} value={limit.toString()}>
						{limit}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
