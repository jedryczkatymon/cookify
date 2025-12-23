import "dotenv/config"
import { PrismaClient } from "@/prisma"
import { withAccelerate } from "@prisma/extension-accelerate"
import { env } from "prisma/config"

export const prisma = new PrismaClient({
	accelerateUrl: env("DATABASE_URL"),
}).$extends(withAccelerate())
