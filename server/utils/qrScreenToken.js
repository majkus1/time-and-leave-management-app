const crypto = require('crypto')

/**
 * Rotujący kod QR na ekranie (tablet przy wejściu) — czysta logika, bez bazy.
 *
 * Wyświetlacz pokazuje link /qr-scan/<kod>?t=<token>, gdzie token = HMAC-SHA256(sekret kodu, "<kod>:<okno>")
 * obcięty do 10 znaków hex; okno = floor(czas / 30 s). Serwer przyjmuje okno bieżące i sąsiednie (±1) — tablet
 * i serwer mogą się minimalnie rozjechać, a skan trwa kilka sekund. Zdjęcie ekranu po ~minucie jest bezwartościowe.
 *
 * Przepustka skanu: po poprawnym tokenie serwer wydaje „<exp>.<hmac>” ważne 10 min — pracownik zdąży się
 * zalogować, a token z ekranu w tym czasie wygasa. Przepustka niczego nie ujawnia i działa tylko dla tego kodu.
 *
 * BLIŹNIAK: client/src/utils/qrScreenToken.js (WebCrypto) — ten sam algorytm, wspólny wektor testowy.
 */
const WINDOW_SEC = 30
const TOKEN_LEN = 10
const PASS_TTL_SEC = 600
const QR_MODES = ['print', 'screen', 'screen_or_print']

function hmacHex(secret, message) {
	return crypto.createHmac('sha256', String(secret)).update(String(message)).digest('hex')
}

function windowAt(nowMs) {
	return Math.floor(nowMs / 1000 / WINDOW_SEC)
}

function tokenForWindow(secret, code, window) {
	return hmacHex(secret, `${code}:${window}`).slice(0, TOKEN_LEN)
}

function generateScreenToken(secret, code, nowMs = Date.now()) {
	return tokenForWindow(secret, code, windowAt(nowMs))
}

function safeEqual(a, b) {
	const x = Buffer.from(String(a || ''))
	const y = Buffer.from(String(b || ''))
	return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y)
}

function verifyScreenToken(secret, code, token, nowMs = Date.now(), skewWindows = 1) {
	if (!secret || !code || typeof token !== 'string' || token.length !== TOKEN_LEN) return false
	const w = windowAt(nowMs)
	for (let d = -skewWindows; d <= skewWindows; d += 1) {
		if (safeEqual(tokenForWindow(secret, code, w + d), token.toLowerCase())) return true
	}
	return false
}

function issueScanPass(secret, code, nowMs = Date.now(), ttlSec = PASS_TTL_SEC) {
	const exp = Math.floor(nowMs / 1000) + ttlSec
	return `${exp}.${hmacHex(secret, `pass:${code}:${exp}`).slice(0, 24)}`
}

function verifyScanPass(secret, code, pass, nowMs = Date.now()) {
	if (!secret || !code || typeof pass !== 'string') return false
	const [expStr, sig] = pass.split('.')
	const exp = Number(expStr)
	if (!Number.isFinite(exp) || exp * 1000 < nowMs) return false
	return safeEqual(hmacHex(secret, `pass:${code}:${exp}`).slice(0, 24), sig)
}

function normalizeQrMode(mode) {
	return QR_MODES.includes(mode) ? mode : 'print'
}

/**
 * Czy skan jest dozwolony i jak go oznaczyć.
 * - print: jak dotąd — zawsze, metoda 'print' (token ignorowany)
 * - screen: tylko z ekranu (ważny token albo przepustka)
 * - screen_or_print: ekran preferowany; wydruk przyjęty, ale oznaczony jako 'print'
 * @returns {{ allowed: boolean, method: 'screen'|'print'|null, reason?: 'SCREEN_REQUIRED'|'SCREEN_EXPIRED' }}
 */
function resolveScanDecision({ mode, hasToken, tokenOk, passOk }) {
	const m = normalizeQrMode(mode)
	if (m === 'print') return { allowed: true, method: 'print' }
	if (tokenOk || passOk) return { allowed: true, method: 'screen' }
	if (m === 'screen_or_print') return { allowed: true, method: 'print' }
	return { allowed: false, method: null, reason: hasToken ? 'SCREEN_EXPIRED' : 'SCREEN_REQUIRED' }
}

function generateSecret() {
	return crypto.randomBytes(32).toString('hex')
}

function generateDisplayToken() {
	return crypto.randomBytes(24).toString('base64url')
}

module.exports = {
	WINDOW_SEC,
	TOKEN_LEN,
	PASS_TTL_SEC,
	QR_MODES,
	generateScreenToken,
	verifyScreenToken,
	issueScanPass,
	verifyScanPass,
	normalizeQrMode,
	resolveScanDecision,
	generateSecret,
	generateDisplayToken,
}
