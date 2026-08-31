import { industryNavForLocale } from './industryNav'
import { solutionNavForLocale } from './solutionsNav'

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
		// Osobna strona zamiast kotwicy — z podstron kotwica przerzucala na home.
		{ href: '/kontakt', label: 'Kontakt' },
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

/**
 * Sekcje rozwijane w menu mobilnym. Nazwa została przy „industry", bo funkcja jest
 * rozpakowywana przez `{...}` w 19 nagłówkach — dołożenie rozwiązań tutaj nie wymaga
 * dotykania żadnego z nich.
 */
export function industryMobileConfig(locale: 'pl' | 'en') {
	return {
		solutionsSectionTitle: locale === 'pl' ? 'Rozwiązania' : 'Solutions',
		solutionsLinks: solutionNavForLocale(locale).map((item) => ({
			href: item.href,
			label: item.title,
		})),
		industrySectionTitle: locale === 'pl' ? 'Branże' : 'Industries',
		industryLinks: industryNavForLocale(locale).map((item) => ({
			href: item.href,
			label: item.title,
			iconSrc: item.iconSrc,
		})),
	}
}
