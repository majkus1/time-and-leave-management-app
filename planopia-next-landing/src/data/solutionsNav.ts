/**
 * Strony produktowe w menu „Rozwiązania" / „Solutions".
 *
 * Do tej pory żyły wyłącznie w stopce — audyt SEO wskazał to jako stratę, bo są to
 * najważniejsze strony transakcyjne serwisu. Rozszerzaj wraz z nowymi wariantami
 * CommercialSoftwareLanding.
 */
export type SolutionNavItem = {
	hrefPl: string
	hrefEn?: string
	/** Nazwa ikony — mapowana na inline SVG w LandingSolutionsDropdown. */
	icon: 'clock' | 'calendar' | 'grid' | 'qr' | 'plus'
	titlePl: string
	titleEn: string
	descPl: string
	descEn: string
}

export const SOLUTION_NAV_ITEMS: SolutionNavItem[] = [
	{
		hrefPl: '/program-do-ewidencji-czasu-pracy',
		hrefEn: '/en/time-tracking-software',
		icon: 'clock',
		titlePl: 'Ewidencja czasu pracy',
		titleEn: 'Time tracking',
		descPl: 'Godziny, nadgodziny i raporty PDF/Excel',
		descEn: 'Hours, overtime, and PDF/Excel reports',
	},
	{
		hrefPl: '/program-do-urlopow',
		hrefEn: '/en/leave-management-software',
		icon: 'calendar',
		titlePl: 'Urlopy i nieobecności',
		titleEn: 'Leave management',
		descPl: 'Wnioski, akceptacje i kalendarz zespołu',
		descEn: 'Requests, approvals, and a team calendar',
	},
	{
		hrefPl: '/program-do-grafikow-pracy',
		hrefEn: '/en/work-schedule-software',
		icon: 'grid',
		titlePl: 'Grafiki pracy',
		titleEn: 'Work schedules',
		descPl: 'Zmiany, obsada i automatyczne układanie',
		descEn: 'Shifts, staffing, and automatic rostering',
	},
	{
		hrefPl: '/rejestracja-czasu-pracy-qr',
		hrefEn: '/en/qr-time-clocking',
		icon: 'qr',
		titlePl: 'Rejestracja przez QR',
		titleEn: 'QR time clocking',
		descPl: 'Wejścia i wyjścia skanem z telefonu',
		descEn: 'Clock in and out with a phone scan',
	},
	{
		hrefPl: '/ewidencja-nadgodzin',
		hrefEn: '/en/overtime-tracking',
		icon: 'plus',
		titlePl: 'Ewidencja nadgodzin',
		titleEn: 'Overtime tracking',
		descPl: 'Godziny nadliczbowe przy konkretnym dniu',
		descEn: 'Overtime recorded against the day',
	},
]

export function solutionNavForLocale(locale: 'pl' | 'en') {
	return SOLUTION_NAV_ITEMS.filter(item => (locale === 'en' ? Boolean(item.hrefEn) : true)).map(item => ({
		href: locale === 'en' ? (item.hrefEn as string) : item.hrefPl,
		title: locale === 'en' ? item.titleEn : item.titlePl,
		description: locale === 'en' ? item.descEn : item.descPl,
		icon: item.icon,
	}))
}
