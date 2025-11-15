/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import type { NextConfig } from 'next'
import './src/env.js'

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.ufs.sh',
			},
			{
				protocol: 'https',
				hostname: 'utfs.io',
			},
		],
	},
}

export default nextConfig
