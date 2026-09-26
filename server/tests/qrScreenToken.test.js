const test = require('node:test')
const assert = require('node:assert/strict')
const {
	WINDOW_SEC,
	generateScreenToken,
	verifyScreenToken,
	issueScanPass,
	verifyScanPass,
	resolveScanDecision,
	normalizeQrMode,
} = require('../utils/qrScreenToken')

const SECRET = 'a'.repeat(64)
const CODE = 'abc123-00ff00ff00ff00ff'
const T0 = Date.UTC(2026, 8, 27, 10, 0, 5) // okno w środku

// Wspólny wektor z client/src/utils/qrScreenToken.test.js — bliźniak (WebCrypto) musi dać to samo
const SHARED_VECTOR = { secret: SECRET, code: CODE, nowMs: T0, token: '237a6c44d2' }

test('wektor wspólny z klientem', () => {
	assert.equal(generateScreenToken(SHARED_VECTOR.secret, SHARED_VECTOR.code, SHARED_VECTOR.nowMs), SHARED_VECTOR.token)
})

test('token ważny w bieżącym i sąsiednim oknie, nieważny po ~minucie', () => {
	const t = generateScreenToken(SECRET, CODE, T0)
	assert.equal(t.length, 10)
	assert.equal(verifyScreenToken(SECRET, CODE, t, T0), true)
	assert.equal(verifyScreenToken(SECRET, CODE, t, T0 + WINDOW_SEC * 1000), true) // następne okno
	assert.equal(verifyScreenToken(SECRET, CODE, t, T0 - WINDOW_SEC * 1000), true) // zegar tabletu do przodu
	assert.equal(verifyScreenToken(SECRET, CODE, t, T0 + 2 * WINDOW_SEC * 1000), false) // zdjęcie sprzed minuty
})

test('token innego kodu, innego sekretu albo śmieci — nieważny', () => {
	const t = generateScreenToken(SECRET, CODE, T0)
	assert.equal(verifyScreenToken(SECRET, 'inny-kod', t, T0), false)
	assert.equal(verifyScreenToken('b'.repeat(64), CODE, t, T0), false)
	assert.equal(verifyScreenToken(SECRET, CODE, '', T0), false)
	assert.equal(verifyScreenToken(SECRET, CODE, undefined, T0), false)
	assert.equal(verifyScreenToken(null, CODE, t, T0), false)
})

test('przepustka: ważna 10 min dla tego kodu, potem wygasa; nie da się jej podrobić', () => {
	const pass = issueScanPass(SECRET, CODE, T0)
	assert.equal(verifyScanPass(SECRET, CODE, pass, T0 + 9 * 60 * 1000), true)
	assert.equal(verifyScanPass(SECRET, CODE, pass, T0 + 11 * 60 * 1000), false)
	assert.equal(verifyScanPass(SECRET, 'inny-kod', pass, T0), false)
	const [exp, sig] = pass.split('.')
	assert.equal(verifyScanPass(SECRET, CODE, `${Number(exp) + 3600}.${sig}`, T0), false) // przedłużenie ręczne
	assert.equal(verifyScanPass(SECRET, CODE, 'bzdura', T0), false)
})

test('decyzja skanu per tryb', () => {
	assert.deepEqual(resolveScanDecision({ mode: 'print', hasToken: false }), { allowed: true, method: 'print' })
	assert.deepEqual(resolveScanDecision({ mode: undefined, hasToken: false }), { allowed: true, method: 'print' })
	assert.deepEqual(resolveScanDecision({ mode: 'screen', hasToken: true, tokenOk: true }), { allowed: true, method: 'screen' })
	assert.deepEqual(resolveScanDecision({ mode: 'screen', hasToken: false, passOk: true }), { allowed: true, method: 'screen' })
	assert.deepEqual(resolveScanDecision({ mode: 'screen', hasToken: false }), { allowed: false, method: null, reason: 'SCREEN_REQUIRED' })
	assert.deepEqual(resolveScanDecision({ mode: 'screen', hasToken: true, tokenOk: false }), { allowed: false, method: null, reason: 'SCREEN_EXPIRED' })
	assert.deepEqual(resolveScanDecision({ mode: 'screen_or_print', hasToken: false }), { allowed: true, method: 'print' })
	assert.deepEqual(resolveScanDecision({ mode: 'screen_or_print', hasToken: true, tokenOk: true }), { allowed: true, method: 'screen' })
	assert.equal(normalizeQrMode('hack'), 'print')
})
