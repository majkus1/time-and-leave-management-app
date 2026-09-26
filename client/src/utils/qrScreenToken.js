/**
 * Token rotującego kodu QR liczony w przeglądarce wyświetlacza (tablet) — WebCrypto.
 * BLIŹNIAK: server/utils/qrScreenToken.js (Node crypto). Algorytm musi być identyczny:
 * HMAC-SHA256(sekret, "<kod>:<okno>"), hex, pierwsze 10 znaków; okno = floor(czas_s / 30).
 */
export const WINDOW_SEC = 30
export const TOKEN_LEN = 10

const encoder = new TextEncoder()
const keyCache = new Map()

async function importKey(secret) {
	if (keyCache.has(secret)) return keyCache.get(secret)
	const key = await crypto.subtle.importKey('raw', encoder.encode(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
	keyCache.set(secret, key)
	return key
}

function toHex(buffer) {
	return Array.from(new Uint8Array(buffer), b => b.toString(16).padStart(2, '0')).join('')
}

export function windowAt(nowMs, windowSec = WINDOW_SEC) {
	return Math.floor(nowMs / 1000 / windowSec)
}

export async function generateScreenToken(secret, code, nowMs = Date.now(), windowSec = WINDOW_SEC) {
	const key = await importKey(secret)
	const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${code}:${windowAt(nowMs, windowSec)}`))
	return toHex(sig).slice(0, TOKEN_LEN)
}

/** Sekundy do zmiany kodu (do paska odliczania na wyświetlaczu). */
export function secondsLeftInWindow(nowMs = Date.now(), windowSec = WINDOW_SEC) {
	return windowSec - (Math.floor(nowMs / 1000) % windowSec)
}
