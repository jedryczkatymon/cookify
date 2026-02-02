import type { WebhookEvent } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { Webhook } from "svix"
import { prisma } from "@/lib/prisma"
import type { WebhookEvent } from "@clerk/nextjs/server"
import { headers } from "next/headers"
import { Webhook } from "svix"

export async function POST(req: Request) {
	const SIGNING_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET

	if (!SIGNING_SECRET) {
		throw new Error(
			"Error: Please add CLERK_WEBHOOK_SIGNING_SECRET from Clerk Dashboard to .env or .env.local",
		)
	}

	const wh = new Webhook(SIGNING_SECRET)
	const headerPayload = await headers()
	const svix_id = headerPayload.get("svix-id")
	const svix_timestamp = headerPayload.get("svix-timestamp")
	const svix_signature = headerPayload.get("svix-signature")

	if (!svix_id || !svix_timestamp || !svix_signature) {
		return new Response("Error: Missing Svix headers", {
			status: 400,
		})
	}

	const payload = await req.json()
	const body = JSON.stringify(payload)

	let evt: WebhookEvent

	try {
		evt = wh.verify(body, {
			"svix-id": svix_id,
			"svix-timestamp": svix_timestamp,
			"svix-signature": svix_signature,
		}) as WebhookEvent
	} catch (err) {
		console.error("Error: Could not verify webhook:", err)
		return new Response("Error: Verification error", {
			status: 400,
		})
	}

	const eventType = evt.type

	if (eventType === "user.created" || eventType === "user.updated") {
		const {
			id,
			email_addresses,
			phone_numbers,
			username,
			first_name,
			last_name,
			image_url,
			created_at,
			updated_at,
			last_sign_in_at,
			last_active_at,
			legal_accepted_at,
			banned,
		} = evt.data

		try {
			await prisma.user.upsert({
				where: { clerkId: id },
				update: {
					firstName: first_name,
					lastName: last_name,
					username: username,
					email: email_addresses?.[0]?.email_address ?? null,
					phoneNumber: phone_numbers?.[0]?.phone_number ?? null,
					imageUrl: image_url ?? null,
					updatedAt: updated_at ? new Date(updated_at) : new Date(),
					lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
					lastActivedAt: last_active_at ? new Date(last_active_at) : null,
					legalAcceptedAt: legal_accepted_at
						? new Date(legal_accepted_at)
						: null,
					banned: Boolean(banned),
				},
				create: {
					clerkId: id,
					firstName: first_name,
					lastName: last_name,
					username: username,
					email: email_addresses?.[0]?.email_address ?? null,
					phoneNumber: phone_numbers?.[0]?.phone_number ?? null,
					imageUrl: image_url ?? null,
					createdAt: created_at ? new Date(created_at) : new Date(),
					updatedAt: updated_at ? new Date(updated_at) : new Date(),
					lastSignInAt: last_sign_in_at ? new Date(last_sign_in_at) : null,
					lastActivedAt: last_active_at ? new Date(last_active_at) : null,
					legalAcceptedAt: legal_accepted_at
						? new Date(legal_accepted_at)
						: null,
					banned: Boolean(banned),
				},
			})
		} catch (error) {
			console.error("Error saving user to DB:", error)
			return new Response("Error processing user data", { status: 500 })
		}
	}

	if (eventType === "user.deleted") {
		try {
			const { id } = evt.data
			await prisma.user.delete({
				where: { clerkId: id },
			})
		} catch (error) {
			console.error("Error deleting user from DB:", error)
			return new Response("Error deleting user", { status: 500 })
		}
	}

	return new Response("Webhook received", { status: 200 })
}
