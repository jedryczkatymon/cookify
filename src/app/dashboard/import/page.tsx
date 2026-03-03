"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { importRecipeAction } from "@/app/actions/import-recipe"

export default function RecipeImporter() {
	const [url, setUrl] = useState("")
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleImport = async () => {
		if (!url) return
		setLoading(true)

		try {
			const extractionResult = await importRecipeAction(url)

			if (!extractionResult.success || !extractionResult.data) {
				throw new Error(extractionResult.error || "Failed to parse recipe")
			}

			const formData = new FormData()
			formData.append("data", JSON.stringify(extractionResult.data))

			const response = await fetch("/api/recipes", {
				method: "POST",
				body: formData,
			})

			if (!response.ok) {
				throw new Error("Failed to save recipe to database")
			}

			const { recipe } = await response.json()

			toast.success("Recipe imported successfully!")
			router.push(`/dashboard/edit/${recipe.slug}`)
		} catch (error) {
			console.error(error)
			toast.error(
				error instanceof Error ? error.message : "Something went wrong",
			)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="mb-6 flex gap-2">
			<input
				type="url"
				placeholder="Paste recipe URL..."
				value={url}
				onChange={(e) => setUrl(e.target.value)}
				className="w-full rounded border p-2"
				disabled={loading}
			/>
			<button
				type="button"
				onClick={handleImport}
				disabled={loading}
				className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
			>
				{loading ? "Scanning..." : "Import"}
			</button>
		</div>
	)
}
