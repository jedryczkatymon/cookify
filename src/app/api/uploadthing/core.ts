import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { type FileRouter, createUploadthing } from "uploadthing/next"

const f = createUploadthing()

export const ourFileRouter = {
	imageUploader: f({
		image: {
			maxFileSize: "4MB",
			maxFileCount: 1,
		},
	})
		.middleware(async () => {
			const { userId } = await auth()
			if (!userId) throw new Error("Unauthorized")
			return { userId }
		})
		.onUploadComplete(async ({ metadata, file }) => {
			await prisma.upload.create({
				data: {
					key: file.key,
					url: file.ufsUrl,
					fileName: file.name,
					fileType: file.type,
					fileSize: file.size,
					uploadedById: metadata.userId,
				},
			})
		}),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
