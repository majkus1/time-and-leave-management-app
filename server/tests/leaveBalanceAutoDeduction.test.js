const test = require('node:test')
const assert = require('node:assert')

const {
	isBalanceConsumingStatus,
	isAutoDeductibleType,
	resolveAutoDeductionPlan,
	resolveNextBalance,
} = require('../utils/leaveBalanceAutoDeduction')

const settings = (overrides = {}) => ({
	autoDeductLeaveLimits: true,
	leaveCalculationMode: 'days',
	leaveHoursPerDay: 8,
	leaveRequestTypes: [
		{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy', isEnabled: true, allowDaysLimit: true },
		{ id: 'leaveform.option6', name: 'Zwolnienie lekarskie', isEnabled: true, allowDaysLimit: true },
		{ id: 'leaveform.option4', name: 'Urlop bezpłatny', isEnabled: true, allowDaysLimit: false },
		{
			id: 'custom-opieka',
			name: 'Opieka nad dzieckiem',
			isEnabled: true,
			allowDaysLimit: true,
			settlementUnit: 'hours',
		},
	],
	...overrides,
})

const wniosek = (overrides = {}) => ({
	type: 'leaveform.option1',
	daysRequested: 4,
	autoDeductedAmount: null,
	autoDeductedUnit: null,
	...overrides,
})

const plan = (overrides = {}) =>
	resolveAutoDeductionPlan({
		settings: settings(),
		leaveRequest: wniosek(),
		previousStatus: 'status.pending',
		nextStatus: 'status.accepted',
		...overrides,
	})

// ── rozpoznanie statusów ─────────────────────────────────────────────────────

test('pulę zajmują tylko statusy zaakceptowany i wysłany', () => {
	assert.strictEqual(isBalanceConsumingStatus('status.accepted'), true)
	assert.strictEqual(isBalanceConsumingStatus('status.sent'), true)
	assert.strictEqual(isBalanceConsumingStatus('status.pending'), false)
	assert.strictEqual(isBalanceConsumingStatus('status.rejected'), false)
	assert.strictEqual(isBalanceConsumingStatus(null), false)
})

// ── kwalifikacja typu ────────────────────────────────────────────────────────

test('typ z włączoną pulą dni podlega automatowi', () => {
	assert.strictEqual(isAutoDeductibleType(settings(), 'leaveform.option1'), true)
})

test('zwolnienie lekarskie jest wykluczone, nawet z włączoną pulą dni', () => {
	assert.strictEqual(isAutoDeductibleType(settings(), 'leaveform.option6'), false)
})

test('typ bez puli dni nie podlega automatowi', () => {
	assert.strictEqual(isAutoDeductibleType(settings(), 'leaveform.option4'), false)
})

test('przy wyłączonej opcji żaden typ nie podlega automatowi', () => {
	const off = settings({ autoDeductLeaveLimits: false })
	assert.strictEqual(isAutoDeductibleType(off, 'leaveform.option1'), false)
})

test('nieznany typ nie podlega automatowi', () => {
	assert.strictEqual(isAutoDeductibleType(settings(), 'nie-ma-takiego'), false)
})

// ── pobranie ─────────────────────────────────────────────────────────────────

test('zatwierdzenie pobiera z puli liczbę dni wniosku', () => {
	assert.deepStrictEqual(plan(), { action: 'deduct', amount: 4, unit: 'days' })
})

test('wniosek godzinowy pobiera godziny, nie dni', () => {
	const wynik = plan({
		leaveRequest: wniosek({ type: 'custom-opieka', daysRequested: 1, hoursRequested: 6 }),
	})
	assert.deepStrictEqual(wynik, { action: 'deduct', amount: 6, unit: 'hours' })
})

test('typ bez zatwierdzania trafia od razu na status wysłany i też pobiera', () => {
	const wynik = plan({ previousStatus: undefined, nextStatus: 'status.sent' })
	assert.strictEqual(wynik.action, 'deduct')
	assert.strictEqual(wynik.amount, 4)
})

test('zwolnienie lekarskie nie rusza puli przy zatwierdzeniu', () => {
	assert.deepStrictEqual(plan({ leaveRequest: wniosek({ type: 'leaveform.option6' }) }).action, 'none')
})

test('przy wyłączonej opcji zatwierdzenie nie rusza puli', () => {
	assert.strictEqual(plan({ settings: settings({ autoDeductLeaveLimits: false }) }).action, 'none')
})

test('ponowne zatwierdzenie nie pobiera drugi raz', () => {
	const wynik = plan({
		leaveRequest: wniosek({ autoDeductedAmount: 4, autoDeductedUnit: 'days' }),
	})
	assert.strictEqual(wynik.action, 'none')
})

test('wniosek na zero dni nie rusza puli', () => {
	assert.strictEqual(plan({ leaveRequest: wniosek({ daysRequested: 0 }) }).action, 'none')
})

test('zmiana między dwoma statusami zajmującymi pulę nic nie zmienia', () => {
	const wynik = plan({
		leaveRequest: wniosek({ autoDeductedAmount: 4, autoDeductedUnit: 'days' }),
		previousStatus: 'status.sent',
		nextStatus: 'status.accepted',
	})
	assert.strictEqual(wynik.action, 'none')
})

// ── zwrot ────────────────────────────────────────────────────────────────────

test('odrzucenie zatwierdzonego wniosku oddaje dokładnie tyle, ile pobrano', () => {
	const wynik = plan({
		leaveRequest: wniosek({ autoDeductedAmount: 4, autoDeductedUnit: 'days' }),
		previousStatus: 'status.accepted',
		nextStatus: 'status.rejected',
	})
	assert.deepStrictEqual(wynik, { action: 'refund', amount: 4, unit: 'days' })
})

test('usunięcie wniosku (brak nowego statusu) też oddaje pulę', () => {
	const wynik = plan({
		leaveRequest: wniosek({ autoDeductedAmount: 4, autoDeductedUnit: 'days' }),
		previousStatus: 'status.accepted',
		nextStatus: null,
	})
	assert.strictEqual(wynik.action, 'refund')
	assert.strictEqual(wynik.amount, 4)
})

test('zwrot działa po wyłączeniu opcji — pracownik nie traci pobranych dni', () => {
	const wynik = plan({
		settings: settings({ autoDeductLeaveLimits: false }),
		leaveRequest: wniosek({ autoDeductedAmount: 4, autoDeductedUnit: 'days' }),
		previousStatus: 'status.accepted',
		nextStatus: null,
	})
	assert.deepStrictEqual(wynik, { action: 'refund', amount: 4, unit: 'days' })
})

test('zwrot oddaje kwotę ze śladu, nawet gdy wniosek zmieniono w międzyczasie', () => {
	const wynik = plan({
		leaveRequest: wniosek({ daysRequested: 9, autoDeductedAmount: 4, autoDeductedUnit: 'days' }),
		previousStatus: 'status.accepted',
		nextStatus: 'status.pending',
	})
	assert.strictEqual(wynik.amount, 4)
})

test('wniosek bez śladu pobrania nic nie oddaje', () => {
	const wynik = plan({ previousStatus: 'status.accepted', nextStatus: 'status.rejected' })
	assert.strictEqual(wynik.action, 'none')
})

// ── przeliczenie salda ───────────────────────────────────────────────────────

test('pobranie pomniejsza saldo', () => {
	assert.strictEqual(resolveNextBalance(15, { action: 'deduct', amount: 4 }), 11)
})

test('zwrot powiększa saldo', () => {
	assert.strictEqual(resolveNextBalance(11, { action: 'refund', amount: 4 }), 15)
})

test('saldo może zejść poniżej zera, żeby przekroczenie puli było widoczne', () => {
	assert.strictEqual(resolveNextBalance(2, { action: 'deduct', amount: 5 }), -3)
})

test('połówki dni nie gubią się na zaokrągleniu', () => {
	assert.strictEqual(resolveNextBalance(15, { action: 'deduct', amount: 0.5 }), 14.5)
	assert.strictEqual(resolveNextBalance(7.5, { action: 'refund', amount: 6.25 }), 13.8)
})

test('brak przypisanej puli oznacza brak zmiany', () => {
	assert.strictEqual(resolveNextBalance(undefined, { action: 'deduct', amount: 4 }), null)
	assert.strictEqual(resolveNextBalance(null, { action: 'deduct', amount: 4 }), null)
	assert.strictEqual(resolveNextBalance('', { action: 'deduct', amount: 4 }), null)
})

test('nieliczbowa pula nie jest nadpisywana', () => {
	assert.strictEqual(resolveNextBalance('nie-liczba', { action: 'deduct', amount: 4 }), null)
})

test('pusty plan nie zmienia salda', () => {
	assert.strictEqual(resolveNextBalance(15, { action: 'none', amount: 0 }), null)
	assert.strictEqual(resolveNextBalance(15, null), null)
})
