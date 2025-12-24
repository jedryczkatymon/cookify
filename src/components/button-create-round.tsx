import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function ButtonCreateRound() {
	return (
		<Link href="/dashboard/create" className="fixed right-6 bottom-6">
			<Button className="flex size-14 cursor-pointer items-center justify-center rounded-full p-0">
				<Plus className="size-7" />
			</Button>
		</Link>
	)
}
