const test = require('node:test')
const assert = require('node:assert')

const { resolveLeaveLimitView, sumAutoDeductedAmount } = require('../utils/leaveLimitView')

// ── tryb ręczny: zachowanie dokładnie jak przed dodaniem opcji ───────────────

test('bez automatu pozostało to pula minus zużycie', () => {
	const view = resolveLeaveLimitView({ storedValue: 15, used: 4, pending: 0 })
	assert.strictEqual(view.limit, 15)
	assert.strictEqual(view.remaining, 11)
})

test('bez automatu procent zużycia liczy się od puli', () => {
	const view = resolveLeaveLimitView({ storedValue: 20, used: 5 })
	assert.strictEqual(view.usagePercent, 25)
})

test('bez automatu przekroczenie puli jest wykrywane', () => {
	const view = resolveLeaveLimitView({ storedValue: 10, used: 12 })
	assert.strictEqual(view.isExceeded, true)
	assert.strictEqual(view.remaining, -2)
})

test('bez automatu oczekujące wnioski dają ostrzeżenie o ryzyku', () => {
	const view = resolveLeaveLimitView({ storedValue: 10, used: 8, pending: 5 })
	assert.strictEqual(view.isExceeded, false)
	assert.strictEqual(view.isAtRisk, true)
})

test('bez automatu zerowa pula nie dzieli przez zero', () => {
	const view = resolveLeaveLimitView({ storedValue: 0, used: 3 })
	assert.strictEqual(view.usagePercent, 0)
	assert.strictEqual(view.isExceeded, false)
})

// ── tryb automatyczny: zapisana liczba JEST saldem ──────────────────────────

test('z automatem pozostało to zapisane saldo, bez odejmowania drugi raz', () => {
	// Pula 15, zatwierdzone 4 dni: automat zapisał saldo 11.
	const view = resolveLeaveLimitView({ storedValue: 11, used: 4, autoDeducted: 4, autoMode: true })
	assert.strictEqual(view.remaining, 11)
})

test('z automatem pula jest odtwarzana ze śladu pobrań', () => {
	const view = resolveLeaveLimitView({ storedValue: 11, used: 4, autoDeducted: 4, autoMode: true })
	assert.strictEqual(view.limit, 15)
	// 4 z 15 wykorzystane — procent liczony od odtworzonej puli, nie od salda.
	assert.ok(Math.abs(view.usagePercent - (4 / 15) * 100) < 0.001)
})

test('z automatem bez żadnego pobrania pula równa się saldu', () => {
	const view = resolveLeaveLimitView({ storedValue: 26, used: 0, autoDeducted: 0, autoMode: true })
	assert.strictEqual(view.limit, 26)
	assert.strictEqual(view.remaining, 26)
	assert.strictEqual(view.usagePercent, 0)
})

test('z automatem wnioski sprzed włączenia opcji nie zawyżają puli', () => {
	// 4 dni zaakceptowane przed włączeniem (bez śladu), potem 3 dni przez automat.
	const view = resolveLeaveLimitView({ storedValue: 12, used: 7, autoDeducted: 3, autoMode: true })
	assert.strictEqual(view.limit, 15)
	assert.strictEqual(view.remaining, 12)
})

test('z automatem ujemne saldo oznacza przekroczenie puli', () => {
	const view = resolveLeaveLimitView({ storedValue: -2, used: 12, autoDeducted: 12, autoMode: true })
	assert.strictEqual(view.isExceeded, true)
	assert.strictEqual(view.remaining, -2)
})

test('z automatem oczekujące wnioski ponad saldo dają ostrzeżenie', () => {
	const view = resolveLeaveLimitView({ storedValue: 2, pending: 5, autoDeducted: 13, autoMode: true })
	assert.strictEqual(view.isExceeded, false)
	assert.strictEqual(view.isAtRisk, true)
})

test('z automatem ręczna korekta salda przesuwa odtworzoną pulę', () => {
	// Admin dołożył pracownikowi dzień: saldo 12 zamiast 11.
	const view = resolveLeaveLimitView({ storedValue: 12, used: 4, autoDeducted: 4, autoMode: true })
	assert.strictEqual(view.limit, 16)
	assert.strictEqual(view.remaining, 12)
})

// ── sumowanie śladu ─────────────────────────────────────────────────────────

const wniosek = (overrides = {}) => ({
	type: 'leaveform.option1',
	autoDeductedAmount: 2,
	autoDeductedUnit: 'days',
	...overrides,
})

test('sumuje pobrania tylko dla wskazanego typu', () => {
	const suma = sumAutoDeductedAmount(
		[wniosek(), wniosek({ type: 'inny', autoDeductedAmount: 9 }), wniosek({ autoDeductedAmount: 3 })],
		'leaveform.option1',
		'days',
		8
	)
	assert.strictEqual(suma, 5)
})

test('pomija wnioski bez śladu pobrania', () => {
	const suma = sumAutoDeductedAmount(
		[wniosek({ autoDeductedAmount: null }), wniosek({ autoDeductedAmount: 0 }), wniosek()],
		'leaveform.option1',
		'days',
		8
	)
	assert.strictEqual(suma, 2)
})

test('przelicza godziny na dni, gdy typ zmienił jednostkę', () => {
	const suma = sumAutoDeductedAmount(
		[wniosek({ autoDeductedAmount: 8, autoDeductedUnit: 'hours' })],
		'leaveform.option1',
		'days',
		8
	)
	assert.strictEqual(suma, 1)
})

test('sumuje godziny dla typu godzinowego', () => {
	const suma = sumAutoDeductedAmount(
		[
			wniosek({ type: 'custom-opieka', autoDeductedAmount: 6, autoDeductedUnit: 'hours' }),
			wniosek({ type: 'custom-opieka', autoDeductedAmount: 4, autoDeductedUnit: 'hours' }),
		],
		'custom-opieka',
		'hours',
		8
	)
	assert.strictEqual(suma, 10)
})

test('brak listy wniosków daje zero', () => {
	assert.strictEqual(sumAutoDeductedAmount(undefined, 'leaveform.option1', 'days', 8), 0)
	assert.strictEqual(sumAutoDeductedAmount(null, 'leaveform.option1', 'days', 8), 0)
	assert.strictEqual(sumAutoDeductedAmount([null, undefined], 'leaveform.option1', 'days', 8), 0)
})
