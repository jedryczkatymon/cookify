"use client"

import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function DialogDelete({
	slug,
	onDeleted,
	onAfterDelete,
}: {
	slug: string
	onDeleted?: () => void
	onAfterDelete?: () => void | Promise<void>
}) {
	const router = useRouter()
	const handleDelete = async () => {
		onDeleted?.()

		await fetch(`/api/recipes/${slug}`, {
			method: "DELETE",
		})

		await onAfterDelete?.()

		if (window.location.pathname.startsWith("/dashboard/recipe/")) {
			router.push("/dashboard")
		} else if (!onDeleted) {
			router.refresh()
		}
	}
	return (
		<AlertDialog>
			<AlertDialogTrigger className="inline-flex cursor-pointer items-center justify-center">
				<Trash2 className="size-5" />
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This recipe will be permanently
						deleted.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction
						className="bg-red-500 text-white"
						onClick={handleDelete}
					>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
