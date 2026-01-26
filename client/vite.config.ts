// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'
// import tailwindcss from '@tailwindcss/vite'

// export default defineConfig({
// 	plugins: [react(), tailwindcss()],
// 	server: {
// 		port: 3001,
// 		proxy: {
// 			'/api': 'http://localhost:3000',
// 		},
// 	},
// })
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	plugins: [
		react(),
		tailwindcss(),
		VitePWA({
			registerType: 'autoUpdate',
			devOptions: {
				enabled: false, // Wyłącz PWA w trybie deweloperskim
				type: 'module',
			},
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'sw.js',
			injectManifest: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,jpg,jpeg,woff,woff2,ttf,eot}'],
				maximumFileSizeToCacheInBytes: 5242880, // 5 MB
			},
			includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-16x16.png', 'favicon-32x32.png'],
			manifest: {
				name: 'Planopia - Zarządzanie zespołem',
				short_name: 'Planopia',
				description: 'Aplikacja do zarządzania czasem pracy, urlopami i zespołem',
				start_url: '/dashboard',
				scope: '/',
				display: 'standalone',
				orientation: 'portrait-primary',
				background_color: '#ffffff',
				theme_color: '#0d6efd',
				lang: 'pl',
				dir: 'ltr',
				categories: ['business', 'productivity'],
				icons: [
					{
						src: '/icon-48x48.png',
						sizes: '48x48',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-72x72.png',
						sizes: '72x72',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-96x96.png',
						sizes: '96x96',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-128x128.png',
						sizes: '128x128',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-144x144.png',
						sizes: '144x144',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-152x152.png',
						sizes: '152x152',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any maskable',
					},
					{
						src: '/icon-256x256.png',
						sizes: '256x256',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-384x384.png',
						sizes: '384x384',
						type: 'image/png',
						purpose: 'any',
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable',
					},
				],
			},
		}),
	],
	server: {
		port: 3001,
		proxy: {
			'/api': 'http://localhost:3000',
		},
	},
})
