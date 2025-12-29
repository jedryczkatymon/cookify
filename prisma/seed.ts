import { prisma } from "@/lib/prisma"
import { faker } from "@faker-js/faker"
import "dotenv/config"

async function main() {
	const CLERK_ID = process.env.CLERK_ID

	console.log("Clearing existing recipe data...")
	// Optional: Clear existing data to avoid unique constraint errors on tags/slugs
	// await prisma.tag.deleteMany({})
	// await prisma.step.deleteMany({})
	// await prisma.ingredient.deleteMany({})
	// await prisma.recipe.deleteMany({})

	console.log("Generating 100 recipes...")

	const recipesData = Array.from({ length: 100 }).map(() => ({
		name: faker.food.dish(),
		description: faker.food.description(),
		cuisine: faker.food.ethnicCategory(),
		category: faker.helpers.arrayElement([
			"Breakfast",
			"Lunch",
			"Dinner",
			"Dessert",
			"Snack",
		]),
		servings: faker.number.int({ min: 1, max: 8 }),
		prepTime: faker.number.int({ min: 10, max: 120 }),
		notes: faker.lorem.sentence(),
		createdById: CLERK_ID,
	}))

	await prisma.recipe.createMany({
		data: recipesData,
	})

	const createdRecipes = await prisma.recipe.findMany({
		select: { id: true },
	})

	const stepsData: Array<{ order: number; content: string; recipeId: string }> =
		[]
	const ingredientsData: Array<{
		name: string
		amount: number
		unit: string
		recipeId: string
	}> = []
	const tagsData: Array<{ name: string; recipeId: string }> = []

	for (const recipe of createdRecipes) {
		const stepCount = faker.number.int({ min: 3, max: 5 })
		for (let i = 1; i <= stepCount; i++) {
			stepsData.push({
				order: i,
				content: faker.lorem.sentence(),
				recipeId: recipe.id,
			})
		}

		const ingredientCount = faker.number.int({ min: 4, max: 8 })
		for (let i = 0; i < ingredientCount; i++) {
			ingredientsData.push({
				name: faker.food.ingredient(),
				amount: faker.number.float({ min: 1, max: 500, fractionDigits: 2 }),
				unit: faker.helpers.arrayElement([
					"g",
					"kg",
					"ml",
					"tbsp",
					"tsp",
					"cups",
				]),
				recipeId: recipe.id,
			})
		}

		tagsData.push({
			name: `${faker.word.adjective()}-${recipe.id}`,
			recipeId: recipe.id,
		})
	}

	console.log("Inserting relations...")
	await Promise.all([
		prisma.step.createMany({ data: stepsData }),
		prisma.ingredient.createMany({ data: ingredientsData }),
		prisma.tag.createMany({ data: tagsData }),
	])

	console.log("Seeding successful!")
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
