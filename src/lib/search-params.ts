import {
	createSearchParamsCache,
	parseAsArrayOf,
	parseAsInteger,
	parseAsString,
} from "nuqs/server"

export const searchParamsCache = createSearchParamsCache({
	q: parseAsString.withDefault(""),
	page: parseAsInteger.withDefault(1),
	perPage: parseAsInteger.withDefault(10),
	category: parseAsString,
	prepTime: parseAsInteger,
	tags: parseAsArrayOf(parseAsString).withDefault([]),
	ingredients: parseAsArrayOf(parseAsString).withDefault([]),
})
