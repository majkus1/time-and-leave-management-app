import { Titillium_Web } from 'next/font/google'

/** Jedyna rodzina na landing — mniejszy payload niż 5× next/font w layout. */
export const titilliumWeb = Titillium_Web({
	variable: '--font-titillium-web',
	subsets: ['latin', 'latin-ext'],
	weight: ['400', '600', '700'],
	display: 'swap',
	preload: true,
})
