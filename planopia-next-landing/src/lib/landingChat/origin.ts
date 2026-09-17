/**
 * Publiczne API czatu bez sprawdzania pochodzenia to darmowe proxy do OpenAI dla każdego, kto zna adres.
 * Przeglądarka zawsze dokleja Origin do fetch POST (także same-origin), więc żądania bez Origin/Referer
 * (curl, skrypty) odrzucamy. To zatrzymuje osadzenie w cudzej stronie i przypadkowe boty — nie skrypt,
 * który podrobi nagłówek; przed tym chroni rate limit i globalny budżet dobowy (rateLimit.ts).
 * Skrypty własne (złote pytania) podają Origin jawnie.
 */
const DEFAULT_SITE = 'https://planopia.pl'

/** Pełny origin (schemat + host) — samo porównanie hosta przepuszczałoby http://planopia.pl na produkcji. */
function originOf(value: string | null): string | null {
	if (!value) return null
	try {
		return new URL(value).origin.toLowerCase()
	} catch {
		return null
	}
}

export function allowedLandingOrigins(env: NodeJS.ProcessEnv = process.env): Set<string> {
	const origins = new Set<string>()
	const site = originOf(env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE)
	if (site) {
		origins.add(site)
		const bare = site.replace('://www.', '://')
		origins.add(bare)
		origins.add(bare.replace('://', '://www.'))
	}
	// Podglądy Vercela i dev lokalny — bez tego nie da się testować przed wdrożeniem.
	if (env.VERCEL_URL) {
		const v = originOf(`https://${env.VERCEL_URL}`)
		if (v) origins.add(v)
	}
	if (env.NODE_ENV !== 'production') {
		for (const port of ['3000', '3002']) {
			origins.add(`http://localhost:${port}`)
			origins.add(`http://127.0.0.1:${port}`)
		}
	}
	return origins
}

export function isAllowedLandingOrigin(
	headers: { get(name: string): string | null },
	env: NodeJS.ProcessEnv = process.env,
): boolean {
	const allowed = allowedLandingOrigins(env)
	const origin = originOf(headers.get('origin'))
	if (origin) return allowed.has(origin)
	const referer = originOf(headers.get('referer'))
	if (referer) return allowed.has(referer)
	return false
}
