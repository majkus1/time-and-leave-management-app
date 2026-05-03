/** Logged-in admins: opens /packages with ?plan=… — checkout when configured, else mail request in app. */

export const PAYMENT_BASE_URL = 'https://app.planopia.pl/packages'

function packagesUrlForQuery(): URL {
	const fromEnv =
		typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_PLANOPIA_APP_PACKAGES_URL?.trim() : ''
	const base = fromEnv && /^https?:\/\//i.test(fromEnv) ? fromEnv : PAYMENT_BASE_URL
	return new URL(base.replace(/\/$/, ''))
}

export function paymentHref(
	plan: string,
	query?: {
		addon?: string
		billing?: 'monthly' | 'annual'
		modules?: string[]
		checkout?: boolean
	},
) {
	const u = packagesUrlForQuery()
	u.searchParams.set('plan', plan)
	if (query?.addon) u.searchParams.set('addon', query.addon)
	if (query?.billing) u.searchParams.set('billing', query.billing)
	if (query?.modules?.length) u.searchParams.set('modules', query.modules.join(','))
	if (query?.checkout) u.searchParams.set('checkout', '1')
	return u.toString()
}
