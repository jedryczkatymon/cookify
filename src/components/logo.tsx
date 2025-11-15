import { CookingPot } from 'lucide-react'
import Link from 'next/link'

export default function Logo() {
	return (
		<Link href="/" className="flex items-center gap-3 whitespace-nowrap">
			<CookingPot className="size-10" />
			<h2 className="hidden font-bold text-2xl md:block">Cookify</h2>
		</Link>
	)
}
