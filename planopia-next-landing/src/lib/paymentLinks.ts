/** Logged-in admins: opens /packages with ?plan=… — starts Przelewy24 checkout when configured, else mail request. */

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
