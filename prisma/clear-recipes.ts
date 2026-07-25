import "dotenv/config"
import { UTApi } from "uploadthing/server"
import { prisma } from "@/lib/prisma"

const utapi = new UTApi()

async function main() {
	if (!process.argv.includes("--yes")) {
		console.error(
			"This will permanently delete ALL recipes (and related data/uploads).",
		)
		console.error("Re-run with --yes to confirm:")
		console.error("  pnpm db:clear-recipes -- --yes")
		process.exit(1)
	}

	const [recipeCount, uploads] = await Promise.all([
		prisma.recipe.count(),
		prisma.upload.findMany({
			where: { recipeId: { not: null } },
			select: { key: true },
		}),
	])

	console.log(
		`Found ${recipeCount} recipe(s) and ${uploads.length} linked upload(s).`,
	)

	if (uploads.length > 0) {
		const keys = uploads.map((u) => u.key)
		try {
			await utapi.deleteFiles(keys)
			console.log(`Deleted ${keys.length} file(s) from UploadThing.`)
		} catch (error) {
			console.error("UploadThing deletion error (continuing):", error)
		}

		const { count: deletedUploads } = await prisma.upload.deleteMany({
			where: { recipeId: { not: null } },
		})
		console.log(`Deleted ${deletedUploads} upload record(s).`)
	}

	const { count: deletedRecipes } = await prisma.recipe.deleteMany({})
	console.log(
		`Deleted ${deletedRecipes} recipe(s) (tags, steps, ingredients, meal plan entries cascaded).`,
	)
	console.log("Done.")
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
