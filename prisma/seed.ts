import { prisma } from "@/lib/prisma"
import { faker } from "@faker-js/faker"
import "dotenv/config"

async function main() {
	const CLERK_ID = process.env.CLERK_ID

	if (!CLERK_ID) {
		console.error(
			"Environment variable CLERK_ID is not set. Aborting seed operation.",
		)
		process.exit(1)
	}

	console.log("Clearing existing recipe data...")
	await prisma.tag.deleteMany({})
	await prisma.step.deleteMany({})
	await prisma.ingredient.deleteMany({})
	await prisma.recipe.deleteMany({})

	console.log("Generating 100 recipes...")

	const recipesData = Array.from({ length: 100 }).map(() => ({
		slug: faker.string.nanoid(10),
		name: faker.food.dish(),
		description: faker.food.description(),
		cuisine: faker.food.ethnicCategory(),
		category: faker.helpers.arrayElement(["Breakfast", "Lunch", "Dinner"]),
		servings: faker.number.int({ min: 1, max: 8 }),
		prepTime: faker.number.int({ min: 10, max: 120 }),
		calories: faker.number.int({ min: 10, max: 2000 }),
		notes: faker.lorem.sentence(),
		createdById: CLERK_ID,
	}))

	await prisma.recipe.createMany({
		data: recipesData,
	})

	const createdRecipes = await prisma.recipe.findMany({
		select: { id: true },
	})

	const stepsData: Array<{ order: number; content: string; recipeId: number }> =
		[]
	const ingredientsData: Array<{
		product: string
		amount: number
		unit: string
		section: string
		recipeId: number
	}> = []
	const tagsData: Array<{ name: string; recipeId: number }> = []

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
				product: faker.food.ingredient(),
				amount: faker.number.float({ min: 1, max: 1000, fractionDigits: 2 }),
				unit: faker.helpers.arrayElement([
					"g",
					"kg",
					"ml",
					"tbsp",
					"tsp",
					"cups",
				]),
				section: faker.helpers.arrayElement([
					"Main",
					"Sauce",
					"Garnish",
					"Marinade",
				]),
				recipeId: recipe.id,
			})
		}

		const tagCount = faker.number.int({ min: 2, max: 4 })
		for (let i = 0; i < tagCount; i++) {
			tagsData.push({
				name: `${faker.word.adjective()}-${recipe.id}-${i}`,
				recipeId: recipe.id,
			})
		}
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
