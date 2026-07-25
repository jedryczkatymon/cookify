import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function H1({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<h1
			className={cn(
				"scroll-m-20 text-balance text-center font-extrabold text-2xl tracking-tight sm:text-4xl",
				className,
			)}
		>
			{children}
		</h1>
	)
}

export function H2({
	children,
	className,
}: {
	children: ReactNode
	className?: string
}) {
	return (
		<h2
			className={cn(
				"scroll-m-20 border-b pb-2 font-semibold text-xl tracking-tight first:mt-0 sm:text-3xl",
				className,
			)}
		>
			{children}
		</h2>
	)
}
