"use client"

import { Check, ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty"
import type { ShoppingDayGroup } from "@/lib/aggregate-shopping-ingredients"
import {
	addDays,
	formatDayHeading,
	parseDateString,
	toDateString,
} from "@/lib/meal-plan-week"
import { cn } from "@/lib/utils"

function storageKey(from: string, to: string) {
	return `cookify:shopping:${from}:${to}`
}

function shoppingHref(from: string, to: string) {
	return `/dashboard/shopping?from=${from}&to=${to}`
}

export function ShoppingList({
	from,
	to,
	weekLabel,
	days,
}: {
	from: string
	to: string
	weekLabel: string
	days: ShoppingDayGroup[]
}) {
	const [checked, setChecked] = useState<Record<string, boolean>>({})
	const [hydrated, setHydrated] = useState(false)

	const allLines = useMemo(() => days.flatMap((day) => day.lines), [days])
	const isEmpty = days.length === 0

	const prevFrom = toDateString(addDays(parseDateString(from), -7))
	const prevTo = toDateString(addDays(parseDateString(to), -7))
	const nextFrom = toDateString(addDays(parseDateString(from), 7))
	const nextTo = toDateString(addDays(parseDateString(to), 7))

	useEffect(() => {
		try {
			const raw = localStorage.getItem(storageKey(from, to))
			if (raw) {
				const parsed = JSON.parse(raw) as Record<string, boolean>
				setChecked(parsed)
			} else {
				setChecked({})
			}
		} catch {
			setChecked({})
		}
		setHydrated(true)
	}, [from, to])

	useEffect(() => {
		if (!hydrated) return
		localStorage.setItem(storageKey(from, to), JSON.stringify(checked))
	}, [checked, from, to, hydrated])

	const remaining = useMemo(
		() => allLines.filter((line) => !checked[line.key]).length,
		[allLines, checked],
	)

	function toggle(key: string) {
		setChecked((prev) => ({ ...prev, [key]: !prev[key] }))
	}

	function clearChecked() {
		setChecked({})
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-1">
					<Button variant="ghost" size="icon-sm" asChild>
						<Link
							href={shoppingHref(prevFrom, prevTo)}
							aria-label="Previous week"
						>
							<ChevronLeft className="size-4" />
						</Link>
					</Button>
					<p className="min-w-[9rem] text-center font-medium text-sm tabular-nums">
						{weekLabel}
					</p>
					<Button variant="ghost" size="icon-sm" asChild>
						<Link href={shoppingHref(nextFrom, nextTo)} aria-label="Next week">
							<ChevronRight className="size-4" />
						</Link>
					</Button>
				</div>
				<div className="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={clearChecked}
						disabled={isEmpty || remaining === 0}
					>
						Clear checks
					</Button>
					<Button variant="outline" size="sm" asChild>
						<Link href={`/dashboard/calendar?week=${from}`}>Calendar</Link>
					</Button>
				</div>
			</div>

			<p className="text-muted-foreground text-sm">{remaining} remaining</p>

			{isEmpty ? (
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<ShoppingCart />
						</EmptyMedia>
						<EmptyTitle>Your shopping list is empty</EmptyTitle>
						<EmptyDescription>
							Plan meals on the calendar for {weekLabel}, then come back to see
							ingredients gathered here.
						</EmptyDescription>
					</EmptyHeader>
					<div className="mt-4">
						<Button variant="outline" size="sm" asChild>
							<Link href={`/dashboard/calendar?week=${from}`}>
								Open calendar
							</Link>
						</Button>
					</div>
				</Empty>
			) : (
				<div className="space-y-6">
					{days.map((day) => (
						<section key={day.date} className="space-y-2">
							<h2 className="font-semibold text-sm tracking-tight">
								{formatDayHeading(new Date(`${day.date}T00:00:00.000Z`))}
							</h2>
							<ul className="divide-y rounded-md border">
								{day.lines.map((line) => {
									const isChecked = Boolean(checked[line.key])
									return (
										<li key={line.key}>
											<button
												type="button"
												onClick={() => toggle(line.key)}
												className={cn(
													"flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40",
													isChecked && "bg-muted/20",
												)}
											>
												<span
													className={cn(
														"flex size-5 shrink-0 items-center justify-center rounded border",
														isChecked
															? "border-foreground bg-foreground text-background"
															: "border-muted-foreground/40",
													)}
												>
													{isChecked ? <Check className="size-3" /> : null}
												</span>
												<span
													className={cn(
														"text-sm",
														isChecked && "text-muted-foreground line-through",
													)}
												>
													{line.label}
												</span>
											</button>
										</li>
									)
								})}
							</ul>
						</section>
					))}
				</div>
			)}
		</div>
	)
}
