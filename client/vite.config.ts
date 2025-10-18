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
			workbox: {
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
				cleanupOutdatedCaches: true,
				sourcemap: true,
				skipWaiting: true,
				clientsClaim: true,
			},
			includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
			manifest: {
				name: 'Planopia',
				short_name: 'Planopia',
				start_url: '/dashboard',
				scope: '/',
				display: 'standalone',
				background_color: '#ffffff',
				theme_color: '#0d6efd',
				icons: [
					{
						src: '/icon-192x192.png',
						sizes: '192x192',
						type: 'image/png',
					},
					{
						src: '/icon-512x512.png',
						sizes: '512x512',
						type: 'image/png',
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
