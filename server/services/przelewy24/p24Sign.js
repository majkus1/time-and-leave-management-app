const crypto = require('crypto')

/**
 * P24: JSON jak php json_encode(JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), potem sha384.
 * Node JSON.stringify nie escapuje slashy i zwykle emituje znaki Unicode dla literałów UTF-8.
 */
function sha384HexOfJsonString(utf8String) {
	return crypto.createHash('sha384').update(utf8String, 'utf8').digest('hex')
}

function signRegister({ sessionId, merchantId, amount, currency, crc }) {
	const payload = { sessionId, merchantId, amount, currency, crc }
	return sha384HexOfJsonString(JSON.stringify(payload))
}

function signVerify({ sessionId, orderId, amount, currency, crc }) {
	const payload = { sessionId, orderId, amount, currency, crc }
	return sha384HexOfJsonString(JSON.stringify(payload))
}

/**
 * Notyfikacja „Wynik transakcji” (dok. P24 REST).
 */
function signNotification({
	merchantId,
	posId,
	sessionId,
	amount,
	originAmount,
	currency,
	orderId,
	methodId,
	statement,
	crc,
}) {
	const payload = {
		merchantId,
		posId,
		sessionId,
		amount,
		originAmount,
		currency,
		orderId,
		methodId,
		statement,
		crc,
	}
	return sha384HexOfJsonString(JSON.stringify(payload))
}

function timingSafeEqualHex(receivedSign, computedSign) {
	if (typeof receivedSign !== 'string' || typeof computedSign !== 'string') return false
	const a = Buffer.from(receivedSign, 'utf8')
	const b = Buffer.from(computedSign, 'utf8')
	if (a.length !== b.length) return false
	return crypto.timingSafeEqual(a, b)
}

module.exports = {
	signRegister,
	signVerify,
	signNotification,
	timingSafeEqualHex,
}
