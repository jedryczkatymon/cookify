import 'dotenv/config'
import { env } from 'prisma/config'
import { withAccelerate } from '@prisma/extension-accelerate'
import { PrismaClient } from '../../prisma/generated/client'

export const prisma = new PrismaClient({
	accelerateUrl: env("DATABASE_URL"),
}).$extends(withAccelerate())
