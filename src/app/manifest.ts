import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Cookify",
		short_name: "Cookify",
		description: "A recipe management app for the modern home cook",
		start_url: "/dashboard",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#000000",
		icons: [
			{
				src: "/cooking-pot.svg",
				sizes: "192x192",
				type: "image/png",
			},
			{
				src: "/cooking-pot.svg",
				sizes: "512x512",
				type: "image/png",
			},
		],
	}
}
