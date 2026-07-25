"use client"

import {
	SignedIn,
	SignedOut,
	SignInButton,
	SignUpButton,
	UserButton,
} from "@clerk/nextjs"
import { CookingPot } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { APP_NAV_ITEMS, isDashboardPath, isNavItemActive } from "@/lib/app-nav"
import { cn } from "@/lib/utils"

function AuthControls() {
	return (
		<>
			<SignedOut>
				<SignInButton />
				<SignUpButton>
					<button
						type="button"
						className="h-10 cursor-pointer rounded-full bg-[#6c47ff] px-4 font-medium text-sm text-white sm:h-12 sm:px-5 sm:text-base"
					>
						Sign Up
					</button>
				</SignUpButton>
			</SignedOut>
			<SignedIn>
				<UserButton />
			</SignedIn>
		</>
	)
}

function DesktopNavLinks({ pathname }: { pathname: string }) {
	return (
		<div className="hidden items-center gap-8 md:flex">
			{APP_NAV_ITEMS.map(({ href, label }) => {
				const active = isNavItemActive(pathname, href)
				return (
					<Link
						key={href}
						href={href}
						className={cn(
							"text-sm transition-colors hover:text-foreground",
							active
								? "font-medium text-foreground underline underline-offset-4"
								: "text-muted-foreground",
						)}
					>
						{label}
					</Link>
				)
			})}
		</div>
	)
}

export function Navbar() {
	const pathname = usePathname()
	const showAppNav = isDashboardPath(pathname)

	return (
		<nav className="relative flex max-w-full items-center justify-between px-4 pt-6 lg:px-20">
			<Link
				href={showAppNav ? "/dashboard" : "/"}
				className="flex items-center gap-3 whitespace-nowrap"
			>
				<CookingPot className="size-10" />
				<h2 className="hidden font-bold text-2xl md:block">Cookify</h2>
			</Link>

			{showAppNav ? (
				<SignedIn>
					<div className="absolute left-1/2 -translate-x-1/2">
						<DesktopNavLinks pathname={pathname} />
					</div>
				</SignedIn>
			) : null}

			<header className="flex h-16 items-center justify-end gap-4 p-4">
				<Suspense fallback={null}>
					<AuthControls />
				</Suspense>
			</header>
		</nav>
	)
}
