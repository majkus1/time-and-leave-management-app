/**
 * Custom package pricing logic
 * Single Responsibility: Only handles custom package pricing calculations
 */

export type PackageType = 'monthly' | 'yearly'
export type Language = 'pl' | 'en'

export interface Feature {
	id: string
	name: {
		pl: string
		en: string
	}
	priceWeight: number // Weight for price calculation (0-1)
}

export const AVAILABLE_FEATURES: Feature[] = [
	{
		id: 'timeTracking',
		name: {
			pl: 'Ewidencja czasu pracy',
			en: 'Time tracking',
		},
		priceWeight: 0.3, // Base feature
	},
	{
		id: 'automaticTimeRegistration',
		name: {
			pl: 'Automatyczna rejestracja czasu',
			en: 'Automatic time registration',
		},
		priceWeight: 0.1,
	},
	{
		id: 'leaveManagement',
		name: {
			pl: 'Urlopy',
			en: 'Leave management',
		},
		priceWeight: 0.3, // Base feature
	},
	{
		id: 'schedules',
		name: {
			pl: 'Grafiki',
			en: 'Schedules',
		},
		priceWeight: 0.2,
	},
	{
		id: 'chat',
		name: {
			pl: 'Komunikacja i czaty',
			en: 'Communication & chat',
		},
		priceWeight: 0.1,
	},
	{
		id: 'taskBoards',
		name: {
			pl: 'Tablice zadań',
			en: 'Task boards',
		},
		priceWeight: 0.1,
	},
]

const MIN_PRICE_PER_USER_MONTHLY_PL = 11 // Minimum price - PLN
const MAX_PRICE_PER_USER_MONTHLY_PL = 18 // Maximum price (all features) - PLN
const MIN_PRICE_PER_USER_MONTHLY_EN = 3 // Minimum price - USD (11 PLN / 3.54 ≈ 3 USD)
const MAX_PRICE_PER_USER_MONTHLY_EN = 5 // Maximum price - USD (18 PLN / 3.54 ≈ 5 USD)

/**
 * Calculate price per user based on selected features
 * Minimum price is always 11 zł (or $3), even for single feature
 */
export function calculateCustomPricePerUser(
	selectedFeatures: string[],
	packageType: PackageType,
	lang: Language = 'pl'
): number {
	if (selectedFeatures.length === 0) {
		return 0
	}

	// Get min/max prices based on language
	const minPrice = lang === 'pl' ? MIN_PRICE_PER_USER_MONTHLY_PL : MIN_PRICE_PER_USER_MONTHLY_EN
	const maxPrice = lang === 'pl' ? MAX_PRICE_PER_USER_MONTHLY_PL : MAX_PRICE_PER_USER_MONTHLY_EN

	// Calculate based on number of features selected
	// Minimum: 1 feature = minPrice (11 zł)
	// Maximum: all features = maxPrice (18 zł)
	const maxFeatureCount = AVAILABLE_FEATURES.length
	const selectedCount = selectedFeatures.length

	// Linear interpolation between min and max based on feature count
	// 1 feature = minPrice, all features = maxPrice
	const priceRange = maxPrice - minPrice
	const featureRange = maxFeatureCount - 1 // 1 to max features
	const additionalFeatures = selectedCount - 1 // 0 to (max-1) additional features
	const basePrice = minPrice + (additionalFeatures / featureRange) * priceRange

	// Ensure minimum price (shouldn't be needed, but safety check)
	const finalPrice = Math.max(minPrice, basePrice)

	// Round to full amount (no decimals)
	const roundedPrice = Math.round(finalPrice)

	// Convert to yearly if needed (multiply by 10, as yearly is 10 months)
	if (packageType === 'yearly') {
		return roundedPrice * 10
	}

	return roundedPrice
}

/**
 * Calculate total price for all users
 */
export function calculateCustomTotalPrice(
	usersCount: number,
	selectedFeatures: string[],
	packageType: PackageType,
	lang: Language = 'pl'
): number {
	const pricePerUser = calculateCustomPricePerUser(selectedFeatures, packageType, lang)
	return usersCount * pricePerUser
}

/**
 * Format price for display
 */
export function formatCustomPrice(amount: number, lang: Language = 'pl'): string {
	if (lang === 'pl') {
		return `${Math.round(amount)} zł netto`
	}
	return `$${Math.round(amount)}`
}

/**
 * Get minimum required features (time tracking + leave management)
 */
export function getMinimumFeatures(): string[] {
	return ['timeTracking', 'leaveManagement']
}
