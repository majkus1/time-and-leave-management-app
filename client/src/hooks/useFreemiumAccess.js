import { useBillingEntitlements } from './useBilling'

/**
 * Stan freemium z /api/billing/entitlements (trial wygasł / plan nieprzedłużony / koniec legacy).
 */
export function useFreemiumAccess(options = {}) {
	const q = useBillingEntitlements(options)
	const ent = q.data
	return {
		...q,
		freemiumTier: ent?.freemiumTier === true,
		freemiumSeatBlocked: ent?.freemiumSeatBlocked === true,
		freemiumMaxSeats: typeof ent?.freemiumMaxSeats === 'number' ? ent.freemiumMaxSeats : 5,
		freemiumAppRestricted: ent?.freemiumTier === true && ent?.freemiumSeatBlocked !== true,
	}
}
