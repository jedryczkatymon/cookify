import "dotenv/config"
import { withAccelerate } from "@prisma/extension-accelerate"
import { env } from "prisma/config"
import { PrismaClient } from "@/prisma"

export const prisma = new PrismaClient({
	accelerateUrl: env("DATABASE_URL"),
}).$extends(withAccelerate())
