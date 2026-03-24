/** Future checkout in the app - landing CTAs point here with ?plan=... */

/** In-app pricing & mail-order flow (replaces placeholder /payment query route). */
export const PAYMENT_BASE_URL = 'https://app.planopia.pl/packages'

export function paymentHref(
	plan: string,
	query?: { addon?: string; billing?: 'monthly' | 'annual' },
) {
	const u = new URL(PAYMENT_BASE_URL)
	u.searchParams.set('plan', plan)
	if (query?.addon) u.searchParams.set('addon', query.addon)
	if (query?.billing) u.searchParams.set('billing', query.billing)
	return u.toString()
}
