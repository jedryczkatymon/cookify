// lib/env.js or src/env.js
import { z } from "zod"

// Schema for validation
const envSchema = z.object({
	// Server-side env vars
	CLERK_SECRET_KEY: z.string().min(1),
	CLERK_WEBHOOK_SIGNING_SECRET: z.string().min(1),
	CLERK_ID: z.string().optional(),
	DATABASE_URL: z.url(),
	DIRECT_DB_URL: z.url(),
	UPLOADTHING_TOKEN: z.string().min(1),
	NGROK_COMMAND: z.string().optional(),
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),

	// Client-side env vars
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
})

// Parse and validate
export const env = envSchema.parse({
	CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
	CLERK_WEBHOOK_SIGNING_SECRET: process.env.CLERK_WEBHOOK_SIGNING_SECRET,
	CLERK_ID: process.env.CLERK_ID,
	DATABASE_URL: process.env.DATABASE_URL,
	DIRECT_DB_URL: process.env.DIRECT_DB_URL,
	UPLOADTHING_TOKEN: process.env.UPLOADTHING_TOKEN,
	NGROK_COMMAND: process.env.NGROK_COMMAND,
	NODE_ENV: process.env.NODE_ENV,
	NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
		process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
})
