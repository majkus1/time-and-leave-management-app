/**
 * Prosty rate limit in-process (jedna instancja Node).
 * Na Vercel wieloinstancyjnie limit jest „miękki” — przy dużym ruchu rozważ Upstash Redis / Cloudflare.
 */

const WINDOW_MS = 15 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
/** Czat: brak limitu wiadomości dla odwiedzającego, ale dwa okna anty-nadużyciowe per IP. */
const MAX_CHAT_REQUESTS = 40
const MAX_CHAT_REQUESTS_PER_DAY = 200
const MAX_MAIL_REQUESTS = 12
/** Formularz kontaktowy — niżej niż czat, bo każde wysłanie ląduje w skrzynce biura. */
const MAX_CONTACT_REQUESTS = 8

const chatBuckets = new Map<string, number[]>()
const chatDayBuckets = new Map<string, number[]>()
const mailBuckets = new Map<string, number[]>()
const contactBuckets = new Map<string, number[]>()

function prune(map: Map<string, number[]>, now: number, windowMs: number) {
	if (map.size < 5000) return
	for (const [k, times] of map) {
		const kept = times.filter(t => now - t < windowMs)
		if (kept.length === 0) map.delete(k)
		else map.set(k, kept)
	}
}

type RateResult = { ok: true } | { ok: false; retryAfterSec: number }

function hit(map: Map<string, number[]>, ip: string, max: number, windowMs = WINDOW_MS): RateResult {
	const now = Date.now()
	prune(map, now, windowMs)
	const key = ip || 'unknown'
	const prev = map.get(key) ?? []
	const windowStart = now - windowMs
	const recent = prev.filter(t => t > windowStart)
	if (recent.length >= max) {
		const oldest = Math.min(...recent)
		const retryAfterSec = Math.ceil((oldest + windowMs - now) / 1000)
		return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) }
	}
	recent.push(now)
	map.set(key, recent)
	return { ok: true }
}

/** Dwa okna: 40 / 15 min i 200 / dobę. Odrzucenie w krótkim oknie nie zużywa dziennego. */
export function landingChatRateLimit(ip: string): RateResult {
	const short = hit(chatBuckets, ip, MAX_CHAT_REQUESTS)
	if (!short.ok) return short
	return hit(chatDayBuckets, ip, MAX_CHAT_REQUESTS_PER_DAY, DAY_MS)
}

export function landingChatMailRateLimit(ip: string): RateResult {
	return hit(mailBuckets, ip, MAX_MAIL_REQUESTS)
}

export function landingContactRateLimit(ip: string): RateResult {
	return hit(contactBuckets, ip, MAX_CONTACT_REQUESTS)
}
