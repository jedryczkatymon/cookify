/** Format a Date as YYYY-MM-DD using UTC calendar parts (for Prisma `@db.Date`). */
export function toDateString(date: Date): string {
	const y = date.getUTCFullYear()
	const m = String(date.getUTCMonth() + 1).padStart(2, "0")
	const d = String(date.getUTCDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

/** Today's calendar date as YYYY-MM-DD in the local timezone. */
export function localTodayString(): string {
	const now = new Date()
	const y = now.getFullYear()
	const m = String(now.getMonth() + 1).padStart(2, "0")
	const d = String(now.getDate()).padStart(2, "0")
	return `${y}-${m}-${d}`
}

/** Parse YYYY-MM-DD as a UTC Date at midnight (safe for Prisma `@db.Date`). */
export function parseDateString(value: string): Date {
	const [y, m, d] = value.split("-").map(Number)
	if (!y || !m || !d) {
		throw new Error(`Invalid date string: ${value}`)
	}
	return new Date(Date.UTC(y, m - 1, d))
}

/** Monday of the week containing `date` (UTC calendar). */
export function startOfWeek(date: Date): Date {
	const result = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	)
	const day = result.getUTCDay()
	const diff = day === 0 ? -6 : 1 - day
	result.setUTCDate(result.getUTCDate() + diff)
	return result
}

/** Sunday of the week containing `date` (UTC calendar). */
export function endOfWeek(date: Date): Date {
	const start = startOfWeek(date)
	return addDays(start, 6)
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	)
	result.setUTCDate(result.getUTCDate() + days)
	return result
}

export type WeekRange = {
	start: Date
	end: Date
	startStr: string
	endStr: string
	days: Date[]
}

/** Resolve a week range from an optional `week` query (any day in that week). */
export function getWeekRange(weekParam?: string | null): WeekRange {
	const anchor = parseDateString(weekParam?.trim() || localTodayString())
	const start = startOfWeek(anchor)
	const end = endOfWeek(anchor)
	const days = Array.from({ length: 7 }, (_, i) => addDays(start, i))
	return {
		start,
		end,
		startStr: toDateString(start),
		endStr: toDateString(end),
		days,
	}
}

export function formatWeekLabel(start: Date, end: Date): string {
	const sameMonth = start.getUTCMonth() === end.getUTCMonth()
	const startFmt = start.toLocaleDateString(undefined, {
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	})
	const endFmt = end.toLocaleDateString(undefined, {
		month: sameMonth ? undefined : "short",
		day: "numeric",
		timeZone: "UTC",
	})
	return `${startFmt} – ${endFmt}`
}

export function formatDayHeading(date: Date): string {
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		month: "short",
		day: "numeric",
		timeZone: "UTC",
	})
}

export function formatDayColumnHeading(date: Date): string {
	return date.toLocaleDateString(undefined, {
		weekday: "short",
		day: "numeric",
		timeZone: "UTC",
	})
}
