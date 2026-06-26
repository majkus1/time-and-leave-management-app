/** LCP hero — lekki WebP (~41 KB). Używany w hero, preload i JSON-LD. */
export const LANDING_HERO_LCP = {
	src: '/img/headerimage4.webp',
	width: 800,
	height: 533,
	sizes: '(max-width: 1023px) 100vw, 50vw',
	absoluteUrl: 'https://planopia.pl/img/headerimage4.webp',
} as const

/** OG/Twitter — PNG 1200×630 dla podglądów w SERP i social (nie blokuje LCP strony). */
export const LANDING_OG_IMAGE = {
	url: 'https://planopia.pl/img/headerimage.png',
	width: 1200,
	height: 630,
	alt: {
		pl: 'Planopia — ewidencja czasu pracy, urlopy i Asystent AI',
		en: 'Planopia — time tracking, leave management and AI assistant',
	},
} as const
