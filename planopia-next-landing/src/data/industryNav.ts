/** Linki do landingów branżowych — menu „Branże” / „Industries”. Rozszerzaj wraz z nowymi stronami. */
export type IndustryNavItem = {
	hrefPl: string
	hrefEn?: string
	iconSrc: string
	titlePl: string
	titleEn: string
	descPl: string
	descEn: string
}

export const INDUSTRY_NAV_ITEMS: IndustryNavItem[] = [
	{
		hrefPl: '/dla-branzy-budowlanej',
		hrefEn: '/en/for-construction-industry',
		iconSrc: '/img/crane.webp',
		titlePl: 'Firmy budowlane',
		titleEn: 'Construction',
		descPl: 'Ewidencja czasu, grafiki brygad, urlopy, QR z telefonu',
		descEn: 'Time tracking, crew schedules, leave, QR from phone',
	},
	{
		hrefPl: '/dla-gastronomii',
		iconSrc: '/img/dish.webp',
		titlePl: 'Gastronomia',
		titleEn: 'Hospitality',
		descPl: 'Grafiki zmian, ewidencja godzin, urlopy i zadania',
		descEn: 'Shift schedules, hours, leave, and tasks',
	},
	{
		hrefPl: '/dla-firm-sprzatajacych',
		iconSrc: '/img/basket.webp',
		titlePl: 'Firmy sprzątające',
		titleEn: 'Cleaning companies',
		descPl: 'Grafik ekip, ewidencja godzin, zastępstwa i zadania',
		descEn: 'Crew schedules, hours, cover, and tasks',
	},
]

export function industryNavForLocale(locale: 'pl' | 'en') {
	return INDUSTRY_NAV_ITEMS.filter(item => locale === 'pl' || Boolean(item.hrefEn)).map((item) => ({
		href: locale === 'pl' ? item.hrefPl : item.hrefEn!,
		title: locale === 'pl' ? item.titlePl : item.titleEn,
		description: locale === 'pl' ? item.descPl : item.descEn,
		label: locale === 'pl' ? item.titlePl : item.titleEn,
		iconSrc: item.iconSrc,
	}))
}
