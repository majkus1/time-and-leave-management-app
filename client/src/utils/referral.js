// Program partnerski: kod polecający z linku ?ref=KOD.
//
// Bliźniaczy plik: planopia-next-landing/src/lib/referral.ts (landing) — to samo cookie na .planopia.pl, ten sam
// format i te same zasady, inaczej rejestracja nie odczyta kodu zapisanego na landingu (reguła 7).
// First-touch: zapisujemy tylko, gdy cookie jeszcze nie ma. Cookie funkcjonalne (sam kod partnera, bez danych osobowych).

export const REFERRAL_COOKIE = 'planopia_ref'
const MAX_AGE_SEC = 90 * 24 * 60 * 60
const CODE_RE = /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/

export function normalizeReferralCode(raw) {
	const code = String(raw ?? '').trim().toLowerCase()
	return CODE_RE.test(code) ? code : null
}

/** Wartość cookie: „kod.znacznikCzasu” (kod nie zawiera kropki) */
export function parseReferralCookieValue(value) {
	// Uszkodzone cookie (np. ręcznie zmienione) nie może wywrócić rejestracji — traktujemy jak brak kodu
	let raw
	try {
		raw = decodeURIComponent(String(value ?? ''))
	} catch {
		return null
	}
	const dot = raw.lastIndexOf('.')
	return normalizeReferralCode(dot > 0 ? raw.slice(0, dot) : raw)
}

function cookieDomain(hostname) {
	const host = String(hostname || '').toLowerCase()
	return host === 'planopia.pl' || host.endsWith('.planopia.pl') ? '.planopia.pl' : null
}

export function readReferralCode(cookieString = typeof document !== 'undefined' ? document.cookie : '') {
	for (const part of String(cookieString).split(';')) {
		const [name, ...rest] = part.trim().split('=')
		if (name === REFERRAL_COOKIE) return parseReferralCookieValue(rest.join('='))
	}
	return null
}

/** Zapis kodu z ?ref (first-touch, 90 dni). Zwraca zapisany kod albo null. */
export function captureReferralFromUrl(search = typeof window !== 'undefined' ? window.location.search : '') {
	if (typeof document === 'undefined') return null
	const code = normalizeReferralCode(new URLSearchParams(search).get('ref'))
	if (!code || readReferralCode()) return null
	const domain = cookieDomain(window.location.hostname)
	const secure = window.location.protocol === 'https:' ? '; Secure' : ''
	document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(`${code}.${Date.now()}`)}; Max-Age=${MAX_AGE_SEC}; Path=/; SameSite=Lax${domain ? `; Domain=${domain}` : ''}${secure}`
	return code
}
