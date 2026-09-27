// utils/planPriceFormat.js
//
// Kwoty cennika w Pakietach: po polsku w złotych, po angielsku orientacyjnie w USD (rozliczamy w PLN).
// Kurs zgodny z landingiem (planopia-next-landing/src/components/LandingPricing.tsx).

export const PLN_PER_USD = 3.69

/** Rozliczenie roczne: płaci się za tyle miesięcy (planCatalog.ANNUAL_NET_MONTHS_CHARGED) */
export const ANNUAL_MONTHS_CHARGED = 10

export function isEnglishLang(lang) {
	return typeof lang === 'string' && lang.toLowerCase().startsWith('en')
}

/** 119 → „119 zł”, 199.1667 → „199,17 zł”; po angielsku „$32.25” */
export function formatPlanMoney(pln, lang) {
	const n = Number(pln)
	if (pln == null || !Number.isFinite(n)) return '—'
	if (isEnglishLang(lang)) {
		return `$${(n / PLN_PER_USD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
	}
	const rounded = Math.round(n * 100) / 100
	const whole = Number.isInteger(rounded)
	return `${rounded.toLocaleString('pl-PL', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })} zł`
}
