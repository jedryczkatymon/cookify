import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { Prisma, PrismaClient } from "@/prisma"

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
	pgPool: Pool | undefined
	schemaMarker: string | undefined
}

const connectionString = process.env.DIRECT_DB_URL
if (!connectionString) {
	throw new Error("DIRECT_DB_URL is not set")
}

const pool =
	globalForPrisma.pgPool ??
	new Pool({
		connectionString,
	})

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.pgPool = pool
}

function currentSchemaMarker() {
	return Object.keys(Prisma.IngredientScalarFieldEnum).sort().join(",")
}

function createPrismaClient() {
	const adapter = new PrismaPg(pool)
	return new PrismaClient({ adapter })
}

function getPrismaClient(): PrismaClient {
	const marker = currentSchemaMarker()
	if (!globalForPrisma.prisma || globalForPrisma.schemaMarker !== marker) {
		const previous = globalForPrisma.prisma
		globalForPrisma.prisma = createPrismaClient()
		globalForPrisma.schemaMarker = marker
		if (previous) {
			void previous.$disconnect().catch(() => {})
		}
	}
	return globalForPrisma.prisma
}

/** Proxy so schema changes after `prisma generate` don't keep a stale singleton. */
export const prisma = new Proxy({} as PrismaClient, {
	get(_target, prop, receiver) {
		const client = getPrismaClient()
		const value = Reflect.get(client, prop, receiver)
		return typeof value === "function" ? value.bind(client) : value
	},
})
