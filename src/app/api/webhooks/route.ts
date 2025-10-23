import { prisma } from '@/lib/prisma'
import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
	try {
		const evt = await verifyWebhook(req)

		if (evt.type === 'user.created') {
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
				await prisma.user.create({
					data: {
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
			} catch (dbError) {
				console.error('Error creating user in database:', dbError)
			}
		}
		return new Response('Webhook received', { status: 200 })
	} catch (err) {
		console.error('Error verifying webhook:', err)
		return new Response('Error verifying webhook', { status: 400 })
	}
}
