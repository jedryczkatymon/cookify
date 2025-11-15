// 'use client'

// import { UploadDropzone } from '@/utils/uploadthing'
// import Image from 'next/image'
// import { useCallback, useEffect, useState } from 'react'

// type Upload = {
// 	id: string
// 	name: string
// 	url: string
// 	fileType: string
// }

// export default function UploadFile() {
// 	const [progress, setProgress] = useState(0)
// 	const [uploads, setUploads] = useState<Upload[]>([])

// 	const fetchUploads = useCallback(async () => {
// 		const res = await fetch('/api/uploads')
// 		const data = await res.json()
// 		// Normalize response to an array in case the API returns an object like { uploads: [...] }
// 		const list = Array.isArray(data) ? data : (data?.uploads ?? [])
// 		setUploads(list)
// 	}, [])

// 	useEffect(() => {
// 		fetchUploads()
// 	}, [fetchUploads])

// 	return (
// 		<div className="flex justify-center">
// 			<UploadDropzone
// 				className="h-50 w-96 text-black"
// 				endpoint="imageUploader"
// 				onClientUploadComplete={() => {
// 					setProgress(0)
// 					fetchUploads()
// 				}}
// 				onUploadProgress={(p) => setProgress(p)}
// 			/>

// 			{progress > 0 && progress < 100 && (
// 				<div className="space-y-2">
// 					<div className="h-3 rounded-full bg-gray-200">
// 						<div
// 							className="h-3 rounded-full bg-blue-600"
// 							style={{ width: `${progress}%` }}
// 						/>
// 					</div>
// 					<p className="text-center text-sm">{progress}%</p>
// 				</div>
// 			)}

// 			<div className="grid grid-cols-2 gap-4">
// 				{(Array.isArray(uploads) ? uploads : []).map((u) => (
// 					<div key={u.id} className="rounded-lg bg-white p-3">
// 						<Image
// 							src={u.url}
// 							alt={u.name || 'Uploaded image'}
// 							width={400}
// 							height={200}
// 							className="h-32 w-full rounded object-cover"
// 						/>
// 						<p className="mt-2 truncate text-xs">{u.name}</p>
// 					</div>
// 				))}
// 			</div>
// 		</div>
// 	)
// }
