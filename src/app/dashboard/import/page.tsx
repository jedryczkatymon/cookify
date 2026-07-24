"use client"

import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { importRecipeAction } from "@/app/actions/import-recipe"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { H1 } from "@/components/ui/typography"

const SUBWAY_SURFERS_VIDEO_ID = "zZ7AimPACzc"
const SUBWAY_SURFERS_EMBED_SRC = `https://www.youtube-nocookie.com/embed/${SUBWAY_SURFERS_VIDEO_ID}?autoplay=1&mute=1&controls=0&loop=1&playlist=${SUBWAY_SURFERS_VIDEO_ID}&start=634&playsinline=1&modestbranding=1&rel=0`

export default function RecipeImporter() {
	const [url, setUrl] = useState("")
	const [loading, setLoading] = useState(false)
	const router = useRouter()

	const handleImport = async () => {
		if (!url || loading) return
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
		<div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
			<div className="space-y-2">
				<H1>Import a recipe</H1>
				<p className="text-muted-foreground">
					Paste a link from a recipe site. We&apos;ll pull the details so you
					can review and save.
				</p>
			</div>

			<div className="flex flex-col gap-3 sm:flex-row">
				<Input
					type="url"
					placeholder="Paste recipe URL..."
					value={url}
					onChange={(e) => setUrl(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault()
							void handleImport()
						}
					}}
					disabled={loading}
					className="flex-1"
				/>
				<Button
					type="button"
					onClick={() => void handleImport()}
					disabled={loading || !url}
					className="sm:shrink-0"
				>
					{loading ? (
						<>
							<Loader2 className="size-4 animate-spin" />
							Importing…
						</>
					) : (
						"Import"
					)}
				</Button>
			</div>

			{loading ? (
				<div className="space-y-3 pt-2">
					<p className="text-center text-muted-foreground text-sm">
						Importing… here&apos;s something to watch
					</p>
					<div className="relative mx-auto aspect-[9/16] w-full max-w-xs overflow-hidden rounded-xl border bg-black shadow-lg">
						<iframe
							src={SUBWAY_SURFERS_EMBED_SRC}
							title="Subway Surfers"
							allow="autoplay; encrypted-media"
							allowFullScreen
							className="absolute inset-0 size-full border-0"
						/>
					</div>
				</div>
			) : null}
		</div>
	)
}
