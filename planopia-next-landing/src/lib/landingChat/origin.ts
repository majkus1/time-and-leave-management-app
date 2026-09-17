/**
 * Publiczne API czatu bez sprawdzania pochodzenia to darmowe proxy do OpenAI dla każdego, kto zna adres.
 * Przeglądarka zawsze dokleja Origin do fetch POST z innej strony, a przy tej samej stronie Origin/Referer;
 * żądania bez obu nagłówków (curl, skrypty) odrzucamy. Skrypty własne (złote pytania) podają Origin jawnie.
 */
const DEFAULT_SITE = 'https://planopia.pl'

function hostOf(value: string | null): string | null {
	if (!value) return null
	try {
		return new URL(value).host.toLowerCase()
	} catch {
		return null
	}
}

export function allowedLandingHosts(env: NodeJS.ProcessEnv = process.env): Set<string> {
	const hosts = new Set<string>()
	const site = hostOf(env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE)
	if (site) {
		hosts.add(site)
		hosts.add(site.replace(/^www\./, ''))
		hosts.add(`www.${site.replace(/^www\./, '')}`)
	}
	// Podglądy Vercela i dev lokalny — bez tego nie da się testować przed wdrożeniem.
	if (env.VERCEL_URL) {
		const v = hostOf(`https://${env.VERCEL_URL}`)
		if (v) hosts.add(v)
	}
	if (env.NODE_ENV !== 'production') {
		hosts.add('localhost:3000')
		hosts.add('localhost:3002')
		hosts.add('127.0.0.1:3000')
		hosts.add('127.0.0.1:3002')
	}
	return hosts
}

export function isAllowedLandingOrigin(
	headers: { get(name: string): string | null },
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	const allowed = allowedLandingHosts(env)
	const origin = hostOf(headers.get('origin'))
	if (origin) return allowed.has(origin)
	const referer = hostOf(headers.get('referer'))
	if (referer) return allowed.has(referer)
	return false
}
