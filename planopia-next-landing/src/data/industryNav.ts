/** Linki do landingów branżowych — menu „Branże” / „Industries”. Rozszerzaj wraz z nowymi stronami. */
export type IndustryNavItem = {
	hrefPl: string
	hrefEn: string
	titlePl: string
	titleEn: string
	descPl: string
	descEn: string
}

export const INDUSTRY_NAV_ITEMS: IndustryNavItem[] = [
	{
		hrefPl: '/dla-branzy-budowlanej',
		hrefEn: '/en/for-construction-industry',
		titlePl: 'Firmy budowlane',
		titleEn: 'Construction',
		descPl: 'Ewidencja czasu, grafiki brygad, urlopy, QR z telefonu',
		descEn: 'Time tracking, crew schedules, leave, QR from phone',
	},
]

export function industryNavForLocale(locale: 'pl' | 'en') {
	return INDUSTRY_NAV_ITEMS.map((item) => ({
		href: locale === 'pl' ? item.hrefPl : item.hrefEn,
		title: locale === 'pl' ? item.titlePl : item.titleEn,
		description: locale === 'pl' ? item.descPl : item.descEn,
		label: locale === 'pl' ? item.titlePl : item.titleEn,
	}))
}
