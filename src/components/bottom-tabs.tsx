"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { APP_NAV_ITEMS, isNavItemActive, isPrimaryNavPath } from "@/lib/app-nav"
import { cn } from "@/lib/utils"

export function BottomTabs() {
	const pathname = usePathname()

	if (!isPrimaryNavPath(pathname)) {
		return null
	}

	return (
		<nav
			aria-label="Primary"
			className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden"
		>
			<ul className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
				{APP_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
					const active = isNavItemActive(pathname, href)
					return (
						<li key={href} className="flex flex-1">
							<Link
								href={href}
								className={cn(
									"flex flex-1 flex-col items-center justify-center gap-1 text-xs transition-colors",
									active
										? "font-medium text-foreground"
										: "text-muted-foreground hover:text-foreground",
								)}
							>
								<Icon
									className={cn("size-5", active && "stroke-[2.25]")}
									aria-hidden
								/>
								<span>{label}</span>
							</Link>
						</li>
					)
				})}
			</ul>
		</nav>
	)
}
