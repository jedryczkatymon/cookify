// uploadthing.ts
import {
	generateReactHelpers,
	generateUploadButton,
	generateUploadDropzone,
} from "@uploadthing/react"

import type { OurFileRouter } from "@/app/api/uploadthing/core"

export const UploadButton = generateUploadButton<OurFileRouter>()
export const UploadDropzone = generateUploadDropzone<OurFileRouter>()

// Export the hook for manual control
export const { useUploadThing, uploadFiles } =
	generateReactHelpers<OurFileRouter>()
