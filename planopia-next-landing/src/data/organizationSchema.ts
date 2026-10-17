/**
 * Jedno źródło danych o firmie dla JSON-LD (strona główna, kontakt). Dane prawne jak w regulaminie (legal-documents/TERMS.md).
 * Pełny węzeł ze stałym @id — pozostałe strony mają skrócony „publisher”, wyszukiwarki łączą je po nazwie i adresie.
 */

export const ORGANIZATION_ID = 'https://planopia.pl/#organization'

/**
 * Profile firmy poza stroną (LinkedIn, Google Firma, Capterra, Wikidata…). Dopisuj, gdy powstaną — to główna „kotwica”,
 * po której wyszukiwarki i AI odróżniają Planopię od innych marek o tej nazwie (planopia.app, planopia.fr).
 */
export const ORGANIZATION_SAME_AS: string[] = []

const ALTERNATE_NAME = {
	pl: 'Planopia – ewidencja czasu pracy i urlopy',
	en: 'Planopia – time tracking and leave management',
} as const

const DESCRIPTION = {
	pl: 'Polska aplikacja webowa do ewidencji czasu pracy, urlopów i grafików pracy dla małych i średnich firm.',
	en: 'Polish web app for time tracking, leave management and work schedules for small and medium-sized companies.',
} as const

export function organizationSchema(locale: 'pl' | 'en' = 'pl') {
	return {
		'@type': 'Organization',
		'@id': ORGANIZATION_ID,
		name: 'Planopia',
		alternateName: ALTERNATE_NAME[locale],
		url: 'https://planopia.pl',
		logo: { '@type': 'ImageObject', url: 'https://planopia.pl/img/new-logoplanopia.webp' },
		description: DESCRIPTION[locale],
		legalName: 'ML Devworks Michał Lipka',
		taxID: '6762707876',
		founder: { '@type': 'Person', name: 'Michał Lipka', url: 'https://planopia.pl/o-autorze' },
		address: {
			'@type': 'PostalAddress',
			streetAddress: 'Rynek Główny 34 lok. 15',
			postalCode: '31-010',
			addressLocality: 'Kraków',
			addressCountry: 'PL',
		},
		email: 'biuro@planopia.pl',
		telephone: '+48 516 598 792',
		areaServed: 'PL',
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'customer support',
			email: 'biuro@planopia.pl',
			telephone: '+48 516 598 792',
			availableLanguage: ['pl', 'en'],
		},
		...(ORGANIZATION_SAME_AS.length > 0 ? { sameAs: ORGANIZATION_SAME_AS } : {}),
	}
}
