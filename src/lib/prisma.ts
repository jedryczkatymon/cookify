import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import { PrismaClient } from "@/prisma"

const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined
	pgPool: Pool | undefined
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
const adapter = new PrismaPg(pool)

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma
	globalForPrisma.pgPool = pool
}
