/**
 * Prosty rate limit in-process (jedna instancja Node).
 * Na Vercel wieloinstancyjnie limit jest „miękki” — przy dużym ruchu rozważ Upstash Redis / Cloudflare.
 */

const WINDOW_MS = 15 * 60 * 1000
const MAX_CHAT_REQUESTS = 24
const MAX_MAIL_REQUESTS = 12

const chatBuckets = new Map<string, number[]>()
const mailBuckets = new Map<string, number[]>()

function prune(map: Map<string, number[]>, now: number) {
	if (map.size < 5000) return
	for (const [k, times] of map) {
		const kept = times.filter(t => now - t < WINDOW_MS)
		if (kept.length === 0) map.delete(k)
		else map.set(k, kept)
	}
}

function hit(
	map: Map<string, number[]>,
	ip: string,
	max: number,
): { ok: true } | { ok: false; retryAfterSec: number } {
	const now = Date.now()
	prune(map, now)
	const key = ip || 'unknown'
	const prev = map.get(key) ?? []
	const windowStart = now - WINDOW_MS
	const recent = prev.filter(t => t > windowStart)
	if (recent.length >= max) {
		const oldest = Math.min(...recent)
		const retryAfterSec = Math.ceil((oldest + WINDOW_MS - now) / 1000)
		return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) }
	}
	recent.push(now)
	map.set(key, recent)
	return { ok: true }
}

export function landingChatRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
	return hit(chatBuckets, ip, MAX_CHAT_REQUESTS)
}

export function landingChatMailRateLimit(ip: string): { ok: true } | { ok: false; retryAfterSec: number } {
	return hit(mailBuckets, ip, MAX_MAIL_REQUESTS)
}
