"use client"

import { FilePlus2, Plus, ScanLine, Upload } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const actions = [
	{
		href: "/dashboard/create",
		label: "Create a recipe",
		icon: FilePlus2,
	},
	{
		href: "/dashboard/import",
		label: "Import a recipe",
		icon: Upload,
	},
	{
		href: "/dashboard/scan",
		label: "Scan a recipe",
		icon: ScanLine,
	},
] as const

export default function ButtonCreateRound() {
	const [open, setOpen] = useState(false)

	return (
		<div className="fixed right-6 bottom-24 z-50 md:bottom-6">
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						aria-label={open ? "Close create menu" : "Open create menu"}
						className="size-14 rounded-full p-0 shadow-lg"
					>
						<Plus
							className={cn(
								"size-7 transition-transform duration-200",
								open && "rotate-45",
							)}
						/>
					</Button>
				</PopoverTrigger>
				<PopoverContent
					side="top"
					align="end"
					sideOffset={12}
					className="w-56 border-border/60 bg-background/95 p-1.5 shadow-xl backdrop-blur-sm"
				>
					<nav className="flex flex-col gap-0.5">
						{actions.map(({ href, label, icon: Icon }) => (
							<Link
								key={href}
								href={href}
								onClick={() => setOpen(false)}
								className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
							>
								<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
									<Icon className="size-4" />
								</span>
								{label}
							</Link>
						))}
					</nav>
				</PopoverContent>
			</Popover>
		</div>
	)
}
