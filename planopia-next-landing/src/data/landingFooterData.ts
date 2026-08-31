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
	// Do tej pory stopka nie zawierala zadnego sposobu kontaktu — ani maila, ani telefonu.
	email: 'biuro@planopia.pl',
	phoneLabel: '+48 516 598 792',
	phoneHref: 'tel:+48516598792',
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
	contactHeading: string
	contactCta: string
	contactCtaHref: string
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
		contactHeading: 'Kontakt',
		contactCta: 'Umów rozmowę',
		contactCtaHref: '/kontakt',
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
		contactHeading: 'Contact',
		contactCta: 'Book a call',
		// Wersja EN nie ma osobnej strony kontaktu — kotwica na stronie glownej.
		contactCtaHref: '/en#contact',
	},
}

export type FooterLegalLink = { href: string; label: string }
export type FooterBlogLink = { href: string; label: string }

/** Strony produktowe (intencja komercyjna) — linkowane sitewide w stopce. */
export const FOOTER_SOLUTIONS_HEADING: Record<LandingLocale, string> = {
	pl: 'Rozwiązania',
	en: 'Solutions',
}

export const FOOTER_SOLUTIONS: Record<LandingLocale, FooterLegalLink[]> = {
	pl: [
		{ href: '/program-do-ewidencji-czasu-pracy', label: 'Program do ewidencji czasu pracy' },
		{ href: '/program-do-urlopow', label: 'Program do urlopów' },
		{ href: '/program-do-grafikow-pracy', label: 'Program do grafików pracy' },
		{ href: '/rejestracja-czasu-pracy-qr', label: 'Rejestracja czasu pracy przez QR' },
		{ href: '/ewidencja-nadgodzin', label: 'Ewidencja nadgodzin' },
		{ href: '/dla-firm-sprzatajacych', label: 'Dla firm sprzątających' },
		{ href: '/dla-gastronomii', label: 'Dla gastronomii' },
		{ href: '/dla-branzy-budowlanej', label: 'Dla firm budowlanych' },
	],
	en: [
		{ href: '/en/time-tracking-software', label: 'Time tracking software' },
		{ href: '/en/leave-management-software', label: 'Leave management software' },
		{ href: '/en/work-schedule-software', label: 'Work schedule software' },
		{ href: '/en/qr-time-clocking', label: 'QR time clocking' },
		{ href: '/en/overtime-tracking', label: 'Overtime tracking' },
		{ href: '/en/for-construction-industry', label: 'For construction' },
	],
}

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
