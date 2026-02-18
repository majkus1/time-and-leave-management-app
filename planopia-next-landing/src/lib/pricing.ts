/**
 * Pricing calculation logic
 * Single Responsibility: Only handles pricing calculations
 */

export type PackageType = 'monthly' | 'yearly'
export type Language = 'pl' | 'en'

export interface PricingConfig {
	monthly: {
		pl: number
		en: number
	}
	yearly: {
		pl: number
		en: number
	}
}

const PRICING_CONFIG: PricingConfig = {
	monthly: {
		pl: 18,
		en: 5, // 18 PLN / 3.54 ≈ 5 USD
	},
	yearly: {
		pl: 180,
		en: 51, // 180 PLN / 3.54 ≈ 51 USD
	},
}

export function getPricePerUser(packageType: PackageType, lang: Language = 'pl'): number {
	return PRICING_CONFIG[packageType][lang]
}

export function calculateTotalPrice(
	usersCount: number,
	packageType: PackageType,
	lang: Language = 'pl'
): number {
	const pricePerUser = getPricePerUser(packageType, lang)
	return usersCount * pricePerUser
}

export function formatPrice(amount: number, lang: Language = 'pl'): string {
	if (lang === 'pl') {
		return `${amount} zł netto`
	}
	return `$${Math.round(amount)}`
}
