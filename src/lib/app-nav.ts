import {
	CalendarDays,
	CookingPot,
	type LucideIcon,
	ShoppingCart,
} from "lucide-react"

export type AppNavItem = {
	href: string
	label: string
	icon: LucideIcon
}

export const APP_NAV_ITEMS: AppNavItem[] = [
	{
		href: "/dashboard",
		label: "Recipes",
		icon: CookingPot,
	},
	{
		href: "/dashboard/calendar",
		label: "Calendar",
		icon: CalendarDays,
	},
	{
		href: "/dashboard/shopping",
		label: "Shopping",
		icon: ShoppingCart,
	},
]

export function isDashboardPath(pathname: string): boolean {
	return pathname === "/dashboard" || pathname.startsWith("/dashboard/")
}

export function isPrimaryNavPath(pathname: string): boolean {
	if (pathname === "/dashboard") return true
	if (pathname === "/dashboard/calendar") return true
	if (pathname.startsWith("/dashboard/calendar/")) return true
	if (pathname === "/dashboard/shopping") return true
	if (pathname.startsWith("/dashboard/shopping/")) return true
	return false
}

export function isNavItemActive(pathname: string, href: string): boolean {
	if (href === "/dashboard") {
		return pathname === "/dashboard"
	}
	return pathname === href || pathname.startsWith(`${href}/`)
}
