/**
 * Kalkulator zarobku partnera na /program-partnerski. Czysta funkcja — stawki i ceny przychodzą z zewnątrz
 * (warunki z partnerProgramCopy, ceny z generatu planCatalog). Reguła liczenia jak w server/utils/commissionCalc.js:
 * stawka początkowa przez N miesięcy od pierwszej płatności firmy, potem stawka późniejsza bez limitu.
 */

export type EarningsInput = {
	companies: number
	monthlyNetPln: number
	initialRate: number
	initialMonths: number
	laterRate: number
	years?: number
}

export type EarningsResult = {
	monthlyInitial: number
	monthlyLater: number
	years: number[]
	total: number
}

const grosze = (value: number) => Math.round(value * 100) / 100

export function partnerEarnings({ companies, monthlyNetPln, initialRate, initialMonths, laterRate, years = 3 }: EarningsInput): EarningsResult {
	const base = Math.max(0, companies) * Math.max(0, monthlyNetPln)
	const monthlyInitial = grosze(base * initialRate)
	const monthlyLater = grosze(base * laterRate)
	const perYear: number[] = []
	for (let y = 0; y < years; y++) {
		let sum = 0
		for (let m = y * 12; m < (y + 1) * 12; m++) sum += m < initialMonths ? monthlyInitial : monthlyLater
		perYear.push(grosze(sum))
	}
	return { monthlyInitial, monthlyLater, years: perYear, total: grosze(perYear.reduce((a, b) => a + b, 0)) }
}

/** „5 670 zł”, „472,50 zł” — twarda spacja jako separator tysięcy, identycznie na serwerze i w przeglądarce */
export function formatPln(value: number, decimals: 0 | 2 = 0): string {
	const [int, frac] = Math.abs(value).toFixed(decimals).split('.')
	const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
	return `${value < 0 ? '−' : ''}${grouped}${frac ? `,${frac}` : ''} zł`
}

/** Kwota z groszami tylko wtedy, gdy nie jest pełna */
export function formatPlnSmart(value: number): string {
	const rounded = grosze(value)
	return formatPln(rounded, Number.isInteger(rounded) ? 0 : 2)
}

/** 1 firma, 2–4 firmy (poza 12–14), 5+ firm */
export function firmsLabel(n: number): string {
	if (n === 1) return 'firma'
	const d = n % 10
	const h = n % 100
	return d >= 2 && d <= 4 && !(h >= 12 && h <= 14) ? 'firmy' : 'firm'
}
