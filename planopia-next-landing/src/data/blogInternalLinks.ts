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
			{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
			{ href: '/blog/ewidencja-czasu-pracy-online', label: 'Ewidencja online — aplikacja web' },
			{ href: '/blog/elektroniczna-ewidencja-czasu-pracy', label: 'Elektroniczna ewidencja — Excel vs program' },
		],
	},
	{
		id: 'urlopy',
		title: 'Urlopy i planowanie',
		description: 'Kalendarz, wnioski, Excel/PDF i święta w Polsce.',
		links: [
			{ href: '/program-do-urlopow', label: 'Program do urlopów — wnioski i kalendarz' },
			{ href: '/blog/program-do-urlopow-dla-malej-firmy', label: 'Program do urlopów dla małej firmy' },
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
			{ href: '/dla-firm-sprzatajacych', label: 'Firmy sprzątające — landing' },
			{ href: '/blog/jak-zarzadzac-firma-sprzatajaca', label: 'Jak zarządzać firmą sprzątającą' },
			{ href: '/dla-gastronomii', label: 'Gastronomia — landing' },
			{ href: '/blog/jak-ulozyc-grafik-pracy-w-restauracji', label: 'Jak ułożyć grafik pracy w restauracji' },
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
	gastronomia: {
		href: '/blog/jak-ulozyc-grafik-pracy-w-restauracji',
		label: 'Jak ułożyć grafik pracy w restauracji',
	},
	gastronomiaLanding: { href: '/dla-gastronomii', label: 'Planopia dla gastronomii' },
	sprzatanie: {
		href: '/blog/jak-zarzadzac-firma-sprzatajaca',
		label: 'Jak zarządzać firmą sprzątającą',
	},
	sprzatanieLanding: { href: '/dla-firm-sprzatajacych', label: 'Planopia dla firm sprzątających' },
	ai: {
		href: '/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik',
		label: 'Asystent AI — ewidencja, urlopy, grafik',
	},
	pwa: { href: '/blog/jak-zainstalowac-planopie-jako-pwa', label: 'Instalacja Planopii jako PWA' },
	wideo: { href: '/blog/instrukcja-wideo-planopia', label: 'Instrukcja wideo Planopia' },
	cennik: { href: '/#cennik', label: 'Cennik Planopii' },
	programUrlopow: { href: '/program-do-urlopow', label: 'Program do urlopów' },
	programEwidencja: { href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
	programUrlopowMalaFirma: {
		href: '/blog/program-do-urlopow-dla-malej-firmy',
		label: 'Program do urlopów dla małej firmy',
	},
} as const

/** Konfiguracja powiązań per slug (ścieżka bez /blog/). */
export const BLOG_ARTICLE_LINKS_PL: Record<string, BlogArticleLinkConfig> = {
	'darmowa-aplikacja-do-ewidencji-czasu-pracy': {
		relatedTitle: 'Więcej o ewidencji i urlopach',
		related: [L.programEwidencja, L.online, L.elektroniczna, L.programUrlopow, L.budowa, L.rocznyPlan],
	},
	'ewidencja-czasu-pracy-online': {
		showPillarBanner: true,
		related: [L.programEwidencja, L.pillar, L.elektroniczna, L.budowa, L.kompleksowa],
	},
	'elektroniczna-ewidencja-czasu-pracy': {
		showPillarBanner: true,
		related: [L.programEwidencja, L.pillar, L.online, L.budowa, L.planowanie],
	},
	'program-do-urlopow-dla-malej-firmy': {
		relatedTitle: 'Więcej o urlopach',
		related: [L.programUrlopow, L.rocznyPlan, L.planowanie, L.zarzadzanie, L.dniWolne, L.pillar],
	},
	'planowanie-urlopow': {
		related: [L.programUrlopow, L.programUrlopowMalaFirma, L.zarzadzanie, L.rocznyPlan, L.dniWolne],
	},
	'zarzadzanie-urlopami': {
		related: [L.programUrlopow, L.programUrlopowMalaFirma, L.planowanie, L.rocznyPlan, L.kompleksowa],
	},
	'roczny-plan-urlopow-excel-pdf-aplikacja': {
		related: [L.programUrlopow, L.programUrlopowMalaFirma, L.dniWolne, L.planowanie, L.zarzadzanie],
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
	'jak-ulozyc-grafik-pracy-w-restauracji': {
		relatedTitle: 'Więcej o grafiku i organizacji zespołu',
		related: [L.gastronomiaLanding, L.kompleksowa, L.planowanie, L.online],
	},
	'jak-zarzadzac-firma-sprzatajaca': {
		relatedTitle: 'Więcej o organizacji pracy zespołu',
		related: [L.sprzatanieLanding, L.kompleksowa, L.online, L.programEwidencja],
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
	electronic: {
		href: '/en/blog/electronic-time-tracking',
		label: 'Electronic time tracking — guide',
	},
	leave: { href: '/en/blog/leave-planning', label: 'Leave planning' },
	leaveManagement: {
		href: '/en/blog/leave-management',
		label: 'Leave management in a company',
	},
	annualLeave: {
		href: '/en/blog/annual-leave-plan-excel-pdf-app',
		label: 'Annual leave plan: Excel, PDF, app',
	},
	construction: {
		href: '/en/blog/time-tracking-on-construction-sites',
		label: 'Time tracking on construction sites',
	},
	constructionLanding: { href: '/en/for-construction-industry', label: 'Planopia for construction' },
	comprehensive: {
		href: '/en/blog/comprehensive-company-management-app',
		label: 'Comprehensive company management app',
	},
	aiAssistant: {
		href: '/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules',
		label: 'Planopia AI Assistant',
	},
	pwa: { href: '/en/blog/how-to-install-planopia-as-pwa', label: 'Install Planopia as PWA' },
	videoTutorials: { href: '/en/blog/video-tutorials', label: 'Video tutorials' },
	leaveSoftware: { href: '/en/leave-management-software', label: 'Leave management software' },
	timeSoftware: { href: '/en/time-tracking-software', label: 'Time tracking software' },
} as const

export const BLOG_ARTICLE_LINKS_EN: Record<string, BlogArticleLinkConfig> = {
	'free-time-tracking-app': {
		relatedTitle: 'More on time tracking and leave',
		related: [
			L_EN.timeSoftware,
			L_EN.online,
			L_EN.electronic,
			L_EN.leaveSoftware,
			L_EN.construction,
			L_EN.annualLeave,
		],
	},
	'time-tracking-online': {
		relatedTitle: 'Related articles',
		related: [L_EN.timeSoftware, L_EN.pillar, L_EN.electronic, L_EN.construction, L_EN.comprehensive],
	},
	'electronic-time-tracking': {
		relatedTitle: 'Related articles',
		related: [L_EN.timeSoftware, L_EN.pillar, L_EN.online, L_EN.construction, L_EN.leave],
	},
	'leave-planning': {
		relatedTitle: 'More on leave',
		related: [L_EN.leaveSoftware, L_EN.leaveManagement, L_EN.annualLeave, L_EN.comprehensive],
	},
	'leave-management': {
		relatedTitle: 'More on leave',
		related: [L_EN.leaveSoftware, L_EN.leave, L_EN.annualLeave, L_EN.comprehensive],
	},
	'annual-leave-plan-excel-pdf-app': {
		relatedTitle: 'More on leave',
		related: [L_EN.leaveSoftware, L_EN.leaveManagement, L_EN.leave, L_EN.comprehensive],
	},
	'comprehensive-company-management-app': {
		relatedTitle: 'Related articles',
		related: [L_EN.pillar, L_EN.online, L_EN.leave, L_EN.aiAssistant],
	},
	'planopia-ai-assistant-time-tracking-leave-tasks-schedules': {
		relatedTitle: 'Related articles',
		related: [L_EN.pillar, L_EN.comprehensive, L_EN.online, L_EN.leave],
	},
	'how-to-install-planopia-as-pwa': {
		relatedTitle: 'Related articles',
		related: [L_EN.pillar, L_EN.online, L_EN.videoTutorials, L_EN.comprehensive],
	},
	'time-tracking-on-construction-sites': {
		relatedTitle: 'Related articles',
		related: [L_EN.constructionLanding, L_EN.timeSoftware, L_EN.pillar, L_EN.online],
	},
	'video-tutorials': {
		relatedTitle: 'Related articles',
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
