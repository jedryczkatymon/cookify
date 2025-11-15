import {
	SignInButton,
	SignUpButton,
	SignedIn,
	SignedOut,
	UserButton,
} from '@clerk/nextjs'
import { CookingPot } from 'lucide-react'
import Link from 'next/link'

export function Navbar() {
	return (
		<nav className="flex max-w-full justify-around px-4 pt-6 lg:justify-center lg:gap-20 lg:px-20">
			<Link href="/" className="flex items-center gap-3 whitespace-nowrap">
				<CookingPot className="size-10" />
				<h2 className="hidden font-bold text-2xl md:block">Cookify</h2>
			</Link>
			<header className="flex h-16 items-center justify-end gap-4 p-4">
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
			</header>
		</nav>
	)
}
