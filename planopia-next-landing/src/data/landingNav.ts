import { industryNavForLocale } from './industryNav'

/** Po ilu linkach wstawić „Branże”: O Aplikacji → Asystent AI → Cennik → Branże → Blog → Kontakt */
export const MOBILE_INDUSTRY_INSERT_INDEX = 3

/** Kolejność: O Aplikacji → AI → Cennik → Blog → Kontakt (Branże wstawiane po indeksie 3) */
export function landingMobileNavItemsPl(opts?: { blogHref?: string }) {
	const blog = opts?.blogHref ?? '/blog'
	return [
		{ href: '/#oaplikacji', label: 'O Aplikacji' },
		{ href: '/#asystent-ai', label: 'Asystent AI' },
		{ href: '/#cennik', label: 'Cennik' },
		{ href: blog, label: 'Blog' },
		{ href: '/#kontakt', label: 'Kontakt' },
	]
}

export function landingMobileNavItemsEn(opts?: { blogHref?: string }) {
	const blog = opts?.blogHref ?? '/en/blog'
	return [
		{ href: '/en#aboutapp', label: 'About the App' },
		{ href: '/en#ai-assistant', label: 'AI Assistant' },
		{ href: '/en#prices', label: 'Pricing' },
		{ href: blog, label: 'Blog' },
		{ href: '/en#contact', label: 'Contact' },
	]
}

export function industryMobileConfig(locale: 'pl' | 'en') {
	return {
		industrySectionTitle: locale === 'pl' ? 'Branże' : 'Industries',
		industryLinks: industryNavForLocale(locale).map((i) => ({ href: i.href, label: i.title })),
	}
}
