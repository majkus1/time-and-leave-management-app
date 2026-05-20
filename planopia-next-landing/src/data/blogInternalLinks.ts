/** Wewnętrzne linkowanie bloga — pillar, klastry tematyczne, powiązane artykuły (PL). */

export type BlogInternalLink = {
	href: string
	label: string
}

export const BLOG_PILLAR_PL: BlogInternalLink = {
	href: '/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
	label: 'Darmowa aplikacja do ewidencji czasu pracy i urlopów',
}

export const BLOG_PILLAR_EN: BlogInternalLink = {
	href: '/en/blog/free-time-tracking-app',
	label: 'Free time tracking and leave app',
}

/** Sekcje na stronie /blog — pomaga crawlowi i użytkownikowi. */
export const BLOG_TOPICS_PL = [
	{
		id: 'ewidencja',
		title: 'Ewidencja czasu pracy',
		description: 'Program online, przewodnik elektroniczny, darmowy plan po próbie.',
		links: [
			{ href: BLOG_PILLAR_PL.href, label: '★ Główny przewodnik (pillar)' },
			{ href: '/blog/ewidencja-czasu-pracy-online', label: 'Ewidencja online — aplikacja web' },
			{ href: '/blog/elektroniczna-ewidencja-czasu-pracy', label: 'Elektroniczna ewidencja — Excel vs program' },
		],
	},
	{
		id: 'urlopy',
		title: 'Urlopy i planowanie',
		description: 'Kalendarz, wnioski, Excel/PDF i święta w Polsce.',
		links: [
			{ href: '/blog/planowanie-urlopow', label: 'Aplikacja do urlopów — planowanie' },
			{ href: '/blog/zarzadzanie-urlopami', label: 'Zarządzanie urlopami w firmie' },
			{ href: '/blog/roczny-plan-urlopow-excel-pdf-aplikacja', label: 'Plan urlopów 2026: Excel, PDF, aplikacja' },
			{ href: '/blog/dni-wolne-2026', label: 'Dni wolne 2026 — kalendarz świąt' },
		],
	},
	{
		id: 'branze',
		title: 'Branże i zastosowania',
		description: 'Rozwiązania dopasowane do specyfiki pracy zespołu.',
		links: [
			{ href: '/dla-branzy-budowlanej', label: 'Firmy budowlane — landing' },
			{ href: '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie', label: 'Ewidencja czasu pracy na budowie' },
		],
	},
	{
		id: 'produkt',
		title: 'Planopia — produkt i pomoc',
		description: 'Moduły, AI, instalacja PWA i instrukcje wideo.',
		links: [
			{ href: '/blog/kompleksowa-aplikacja-do-zarzadzania-firma', label: 'Ewidencja, urlopy i grafik w jednej aplikacji' },
			{ href: '/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik', label: 'Asystent AI w Planopii' },
			{ href: '/blog/jak-zainstalowac-planopie-jako-pwa', label: 'Instalacja Planopii jako PWA' },
			{ href: '/blog/instrukcja-wideo-planopia', label: 'Instrukcja wideo z aplikacji' },
		],
	},
] as const

export type BlogArticleLinkConfig = {
	/** Baner u góry: „Zacznij od głównego przewodnika” (supporting w klastrze ewidencji). */
	showPillarBanner?: boolean
	/** Etykieta sekcji na dole artykułu */
	relatedTitle?: string
	related: BlogInternalLink[]
}

const L = {
	pillar: BLOG_PILLAR_PL,
	online: { href: '/blog/ewidencja-czasu-pracy-online', label: 'Ewidencja czasu pracy online' },
	elektroniczna: {
		href: '/blog/elektroniczna-ewidencja-czasu-pracy',
		label: 'Elektroniczna ewidencja — przewodnik',
	},
	planowanie: { href: '/blog/planowanie-urlopow', label: 'Aplikacja do urlopów — planowanie' },
	zarzadzanie: { href: '/blog/zarzadzanie-urlopami', label: 'Zarządzanie urlopami w firmie' },
	rocznyPlan: {
		href: '/blog/roczny-plan-urlopow-excel-pdf-aplikacja',
		label: 'Roczny plan urlopów: Excel, PDF, aplikacja',
	},
	dniWolne: { href: '/blog/dni-wolne-2026', label: 'Dni wolne 2026' },
	kompleksowa: {
		href: '/blog/kompleksowa-aplikacja-do-zarzadzania-firma',
		label: 'Ewidencja, urlopy i grafik — jedna aplikacja',
	},
	budowa: {
		href: '/blog/jak-prowadzic-ewidencje-czasu-pracy-na-budowie',
		label: 'Ewidencja czasu pracy na budowie',
	},
	budowaLanding: { href: '/dla-branzy-budowlanej', label: 'Planopia dla firm budowlanych' },
	ai: {
		href: '/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik',
		label: 'Asystent AI — ewidencja, urlopy, grafik',
	},
	pwa: { href: '/blog/jak-zainstalowac-planopie-jako-pwa', label: 'Instalacja Planopii jako PWA' },
	wideo: { href: '/blog/instrukcja-wideo-planopia', label: 'Instrukcja wideo Planopia' },
	cennik: { href: '/#cennik', label: 'Cennik Planopii' },
} as const

/** Konfiguracja powiązań per slug (ścieżka bez /blog/). */
export const BLOG_ARTICLE_LINKS_PL: Record<string, BlogArticleLinkConfig> = {
	'darmowa-aplikacja-do-ewidencji-czasu-pracy': {
		relatedTitle: 'Więcej o ewidencji i urlopach',
		related: [L.online, L.elektroniczna, L.budowa, L.planowanie, L.rocznyPlan],
	},
	'ewidencja-czasu-pracy-online': {
		showPillarBanner: true,
		related: [L.pillar, L.elektroniczna, L.budowa, L.kompleksowa],
	},
	'elektroniczna-ewidencja-czasu-pracy': {
		showPillarBanner: true,
		related: [L.pillar, L.online, L.budowa, L.planowanie],
	},
	'planowanie-urlopow': {
		related: [L.pillar, L.zarzadzanie, L.rocznyPlan, L.dniWolne, L.online],
	},
	'zarzadzanie-urlopami': {
		related: [L.pillar, L.planowanie, L.rocznyPlan, L.kompleksowa],
	},
	'roczny-plan-urlopow-excel-pdf-aplikacja': {
		related: [L.pillar, L.dniWolne, L.planowanie, L.zarzadzanie],
	},
	'dni-wolne-2026': {
		related: [L.rocznyPlan, L.planowanie, L.pillar, L.zarzadzanie],
	},
	'kompleksowa-aplikacja-do-zarzadzania-firma': {
		related: [L.pillar, L.online, L.planowanie, L.ai],
	},
	'jak-prowadzic-ewidencje-czasu-pracy-na-budowie': {
		related: [L.budowaLanding, L.pillar, L.online, L.elektroniczna],
	},
	'asystent-ai-planopia-ewidencja-urlopy-zadania-grafik': {
		related: [L.pillar, L.kompleksowa, L.online, L.planowanie],
	},
	'jak-zainstalowac-planopie-jako-pwa': {
		related: [L.pillar, L.online, L.wideo, L.kompleksowa],
	},
	'instrukcja-wideo-planopia': {
		related: [L.pillar, L.online, L.pwa, L.planowanie],
	},
}

const L_EN = {
	pillar: BLOG_PILLAR_EN,
	online: { href: '/en/blog/time-tracking-online', label: 'Online time tracking' },
	freeApp: { href: BLOG_PILLAR_EN.href, label: 'Free time tracking app' },
	leave: { href: '/en/blog/leave-planning', label: 'Leave planning' },
	construction: {
		href: '/en/blog/time-tracking-on-construction-sites',
		label: 'Time tracking on construction sites',
	},
	constructionLanding: { href: '/en/for-construction-industry', label: 'Planopia for construction' },
	pwa: { href: '/en/blog/how-to-install-planopia-as-pwa', label: 'Install Planopia as PWA' },
} as const

export const BLOG_ARTICLE_LINKS_EN: Record<string, BlogArticleLinkConfig> = {
	'time-tracking-on-construction-sites': {
		related: [L_EN.constructionLanding, L_EN.pillar, L_EN.online],
	},
	'video-tutorials': {
		related: [L_EN.pillar, L_EN.online, L_EN.pwa, L_EN.leave],
	},
}

export function getBlogArticleLinkConfig(
	slug: string,
	locale: 'pl' | 'en' = 'pl'
): BlogArticleLinkConfig | null {
	if (locale === 'pl') {
		return BLOG_ARTICLE_LINKS_PL[slug] ?? null
	}
	return BLOG_ARTICLE_LINKS_EN[slug] ?? null
}
