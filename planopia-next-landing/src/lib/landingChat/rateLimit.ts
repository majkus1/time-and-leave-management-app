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

/**
 * Globalny bezpiecznik kosztów: limity per IP obchodzi rotacja adresów i podrobiony Origin, a liczniki żyją
 * per instancja funkcji. Ten sufit (na instancję, na dobę UTC) zamienia ręczny kill-switch LANDING_CHAT_ENABLED
 * w automat — po przekroczeniu czat odpowiada 503 do północy. Wartość z LANDING_CHAT_DAILY_GLOBAL_MAX.
 */
const DEFAULT_GLOBAL_DAILY_MAX = 1500
let globalDay = ''
let globalCount = 0

export function landingChatGlobalBudget(env: NodeJS.ProcessEnv = process.env, now = new Date()): { ok: true } | { ok: false; retryAfterSec: number } {
	const max = parseInt(String(env.LANDING_CHAT_DAILY_GLOBAL_MAX || ''), 10) || DEFAULT_GLOBAL_DAILY_MAX
	const day = now.toISOString().slice(0, 10)
	if (day !== globalDay) {
		globalDay = day
		globalCount = 0
	}
	if (globalCount >= max) {
		const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
		return { ok: false, retryAfterSec: Math.max(60, Math.ceil((midnight - now.getTime()) / 1000)) }
	}
	globalCount += 1
	return { ok: true }
}

/** Tylko do testów. */
export function _resetLandingChatGlobalBudget() {
	globalDay = ''
	globalCount = 0
}

export function landingChatMailRateLimit(ip: string): RateResult {
	return hit(mailBuckets, ip, MAX_MAIL_REQUESTS)
}

export function landingContactRateLimit(ip: string): RateResult {
	return hit(contactBuckets, ip, MAX_CONTACT_REQUESTS)
}
