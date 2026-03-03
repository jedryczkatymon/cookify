import { Plus } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

export default function ButtonCreateRound() {
	return (
		<div className="fixed right-6 bottom-6">
			<Popover>
				<PopoverTrigger asChild>
					<Button className="flex size-14 cursor-pointer items-center justify-center rounded-full p-0">
						<Plus className="size-7" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="flex w-100 gap-4 p-4">
					<Link href="/dashboard/create">Create a recipe</Link>
					<Link href="/dashboard/import">Import a recipe</Link>
					<Link href="/dashboard/scan">Scan a recipe</Link>
				</PopoverContent>
			</Popover>
		</div>
	)
}
