"use client"

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
import { Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function DialogDelete({ slug }: { slug: string }) {
	const router = useRouter()
	const handleDelete = async () => {
		await fetch(`/api/recipes/${slug}`, {
			method: "DELETE",
		})
		if (window.location.pathname.startsWith("/dashboard/recipe/")) {
			router.push("/dashboard")
		} else {
			router.refresh()
		}
	}
	return (
		<AlertDialog>
			<AlertDialogTrigger className="cursor-pointer">
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
