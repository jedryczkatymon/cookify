import { Pencil } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ButtonEdit({
	slug,
	variant = "icon",
}: {
	slug: string
	variant?: "icon" | "button"
}) {
	if (variant === "button") {
		return (
			<Button asChild className="w-full sm:w-auto">
				<Link href={`/dashboard/edit/${slug}`}>
					<Pencil className="size-4" />
					Edit
				</Link>
			</Button>
		)
	}

	return (
		<Link href={`/dashboard/edit/${slug}`}>
			<Pencil className="size-5 cursor-pointer" />
		</Link>
	)
}
