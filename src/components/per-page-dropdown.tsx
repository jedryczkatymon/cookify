"use client"

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { parseAsInteger, useQueryState } from "nuqs"

export function PerPageSelector() {
	const [perPage, setPerPage] = useQueryState(
		"perPage",
		parseAsInteger.withDefault(10).withOptions({
			shallow: false,
			history: "push",
		}),
	)

	return (
		<Select
			value={perPage.toString()}
			onValueChange={(value) => setPerPage(Number(value))}
		>
			<SelectTrigger className="w-18">
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
