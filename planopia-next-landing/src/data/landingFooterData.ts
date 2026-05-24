export type LandingLocale = 'pl' | 'en'

/** Wspólne dane podmiotu — spójne z legalDocumentsContext / treściami prawnymi */
export const LANDING_SELLER = {
	legalName: 'ML Devworks Michał Lipka',
	addressLines: {
		pl: ['Rynek Główny 34 lok. 15', '31-010 Kraków'],
		en: ['Rynek Główny 34 lok. 15', '31-010 Kraków', 'Poland'],
	},
	nip: '6762707876',
	regon: '543372505',
	websiteHref: 'https://ml-devworks.com/',
	websiteLabel: 'ml-devworks.com',
} as const

export type FooterCopy = {
	legalHeading: string
	blogHeading: string
	blogAll: string
	companyHeading: string
	nipLabel: string
	regonLabel: string
	websiteLabel: string
	complaintsIntro: string
	complaintsLink: string
	brandLine: string
}

export const FOOTER_UI: Record<LandingLocale, FooterCopy> = {
	pl: {
		legalHeading: 'Dokumenty prawne',
		blogHeading: 'Na blogu',
		blogAll: 'Wszystkie artykuły',
		companyHeading: 'Sprzedawca',
		nipLabel: 'NIP',
		regonLabel: 'REGON',
		websiteLabel: 'Strona',
		complaintsIntro: 'Reklamacje:',
		complaintsLink: 'procedura reklamacji',
		brandLine: 'Czas pracy, urlopy i zadania — w jednym systemie.',
	},
	en: {
		legalHeading: 'Legal',
		blogHeading: 'From the blog',
		blogAll: 'All articles',
		companyHeading: 'Seller',
		nipLabel: 'Tax ID (NIP)',
		regonLabel: 'REGON',
		websiteLabel: 'Website',
		complaintsIntro: 'Complaints:',
		complaintsLink: 'complaints procedure',
		brandLine: 'Time tracking, leave, and tasks — in one system.',
	},
}

export type FooterLegalLink = { href: string; label: string }
export type FooterBlogLink = { href: string; label: string }

export const FOOTER_LEGAL: Record<LandingLocale, FooterLegalLink[]> = {
	pl: [
		{ href: '/terms', label: 'Regulamin' },
		{ href: '/privacy', label: 'Polityka prywatności' },
		{ href: '/dpa', label: 'Umowa powierzenia (DPA)' },
		{ href: '/reklamacje', label: 'Reklamacje' },
	],
	en: [
		{ href: '/en/terms', label: 'Terms of Service' },
		{ href: '/en/privacy', label: 'Privacy Policy' },
		{ href: '/en/dpa', label: 'Data Processing Agreement' },
		{ href: '/en/complaints', label: 'Complaints' },
	],
}

/** Wybrane wpisy pod SEO — spójne pary PL/EN */
export const FOOTER_BLOG_HIGHLIGHTS: { pl: FooterBlogLink; en: FooterBlogLink }[] = [
	{
		pl: {
			href: '/blog/darmowa-aplikacja-do-ewidencji-czasu-pracy',
			label: 'Darmowa aplikacja do ewidencji czasu pracy',
		},
		en: {
			href: '/en/blog/free-time-tracking-app',
			label: 'Free time tracking app',
		},
	},
	{
		pl: {
			href: '/blog/asystent-ai-planopia-ewidencja-urlopy-zadania-grafik',
			label: 'Asystent AI — ewidencja, urlopy, zadania',
		},
		en: {
			href: '/en/blog/planopia-ai-assistant-time-tracking-leave-tasks-schedules',
			label: 'AI assistant: time tracking, leave, tasks',
		},
	},
	{
		pl: { href: '/blog/elektroniczna-ewidencja-czasu-pracy', label: 'Elektroniczna ewidencja czasu pracy' },
		en: { href: '/en/blog/electronic-time-tracking', label: 'Electronic time tracking' },
	},
	{
		pl: { href: '/blog/zarzadzanie-urlopami', label: 'Zarządzanie urlopami' },
		en: { href: '/en/blog/leave-management', label: 'Leave management' },
	},
	{
		pl: { href: '/blog/jak-zainstalowac-planopie-jako-pwa', label: 'Planopia jako aplikacja (PWA)' },
		en: { href: '/en/blog/how-to-install-planopia-as-pwa', label: 'Install Planopia as a PWA' },
	},
]
