import { Pencil } from "lucide-react"
import Link from "next/link"

export default function ButtonEdit({ slug }: { slug: string }) {
	return (
		<Link href={`/dashboard/edit/${slug}`}>
			<Pencil className="size-5 cursor-pointer" />
		</Link>
	)
}
