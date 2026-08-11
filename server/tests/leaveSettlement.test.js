const test = require('node:test')
const assert = require('node:assert')

const {
	resolveLeaveTypeSettlement,
	isHourlyCaptureType,
	isHourlyLeaveRequest,
	isBlockingLeaveRequest,
	getLeaveRequestQuantity,
	getLeaveRequestAmountInUnit,
	convertLeaveAmount,
	formatLeaveQuantityValue,
	getLeaveQuantityLabel,
	formatLeaveQuantity,
	NON_HOURLY_LEAVE_QUERY,
} = require('../utils/leaveSettlement')

/* ------------------------------------------------------------------ *
 * FIXTURE'Y WSPÓŁDZIELONE Z client/src/utils/leaveSettlement.test.js
 * Obie tablice muszą pozostać identyczne — to jedyne zabezpieczenie
 * przed rozjechaniem się lustrzanych helperów klient/serwer.
 * ------------------------------------------------------------------ */

const SETTLEMENT_MATRIX = [
	{ settlementUnit: undefined, leaveCalculationMode: 'days', unit: 'days', captureMode: 'dayRange' },
	{ settlementUnit: undefined, leaveCalculationMode: 'hours', unit: 'hours', captureMode: 'dayRange' },
	{ settlementUnit: 'inherit', leaveCalculationMode: 'days', unit: 'days', captureMode: 'dayRange' },
	{ settlementUnit: 'inherit', leaveCalculationMode: 'hours', unit: 'hours', captureMode: 'dayRange' },
	{ settlementUnit: 'days', leaveCalculationMode: 'days', unit: 'days', captureMode: 'dayRange' },
	{ settlementUnit: 'days', leaveCalculationMode: 'hours', unit: 'days', captureMode: 'dayRange' },
	{ settlementUnit: 'hours', leaveCalculationMode: 'days', unit: 'hours', captureMode: 'hourly' },
	{ settlementUnit: 'hours', leaveCalculationMode: 'hours', unit: 'hours', captureMode: 'hourly' },
]

const QUANTITY_CASES = [
	{
		name: 'stary rekord bez pol godzinowych, zespol w dniach',
		settlementUnit: undefined,
		leaveCalculationMode: 'days',
		request: { type: 'leaveform.option1', daysRequested: 3 },
		expected: { unit: 'days', value: 3, isHourly: false },
	},
	{
		name: 'stary rekord bez pol godzinowych, zespol globalnie w godzinach',
		settlementUnit: undefined,
		leaveCalculationMode: 'hours',
		request: { type: 'leaveform.option1', daysRequested: 3 },
		expected: { unit: 'hours', value: 24, isHourly: false },
	},
	{
		name: 'typ jawnie dzienny mimo globalnego trybu godzinowego',
		settlementUnit: 'days',
		leaveCalculationMode: 'hours',
		request: { type: 'leaveform.option1', daysRequested: 3 },
		expected: { unit: 'days', value: 3, isHourly: false },
	},
	{
		name: 'wniosek godzinowy',
		settlementUnit: 'hours',
		leaveCalculationMode: 'days',
		request: {
			type: 'custom-childcare',
			daysRequested: 1,
			hoursRequested: 4,
			settlementUnit: 'hours',
			hoursPerDaySnapshot: 8,
		},
		expected: { unit: 'hours', value: 4, isHourly: true },
	},
	{
		name: 'wniosek godzinowy po przelaczeniu typu z powrotem na dni',
		settlementUnit: 'days',
		leaveCalculationMode: 'days',
		request: {
			type: 'custom-childcare',
			daysRequested: 1,
			hoursRequested: 4,
			settlementUnit: 'hours',
			hoursPerDaySnapshot: 8,
		},
		expected: { unit: 'hours', value: 4, isHourly: true },
	},
]

const makeSettings = (settlementUnit, leaveCalculationMode, hoursPerDay = 8) => ({
	leaveCalculationMode,
	leaveHoursPerDay: hoursPerDay,
	leaveRequestTypes: [
		{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy', isEnabled: true, settlementUnit },
		{ id: 'custom-childcare', name: 'Opieka nad dzieckiem', isEnabled: true, settlementUnit },
	],
})

/* ------------------------------------------------------------------ */

test('resolveLeaveTypeSettlement: macierz settlementUnit x leaveCalculationMode', () => {
	for (const row of SETTLEMENT_MATRIX) {
		const settings = makeSettings(row.settlementUnit, row.leaveCalculationMode)
		const resolved = resolveLeaveTypeSettlement(settings, 'leaveform.option1')
		const label = `settlementUnit=${row.settlementUnit} mode=${row.leaveCalculationMode}`
		assert.strictEqual(resolved.unit, row.unit, `unit dla ${label}`)
		assert.strictEqual(resolved.captureMode, row.captureMode, `captureMode dla ${label}`)
	}
})

test('GWARANCJA BRAKU REGRESJI: inherit + globalny tryb godzinowy nie zmienia sposobu wpisu', () => {
	const settings = makeSettings('inherit', 'hours')
	const resolved = resolveLeaveTypeSettlement(settings, 'leaveform.option1')
	// Zespol widzi godziny, ale wniosek nadal sklada sie zakresem dat i zapisuje w dniach.
	assert.strictEqual(resolved.unit, 'hours')
	assert.strictEqual(resolved.captureMode, 'dayRange')
	assert.strictEqual(isHourlyCaptureType(settings, 'leaveform.option1'), false)
})

test('resolveLeaveTypeSettlement: nieznany typ i smieciowa wartosc dziedzicza ustawienie zespolu', () => {
	assert.strictEqual(resolveLeaveTypeSettlement(makeSettings('days', 'hours'), 'nie-ma-takiego').unit, 'hours')
	assert.strictEqual(resolveLeaveTypeSettlement(makeSettings('WAT', 'days'), 'leaveform.option1').unit, 'days')
	assert.strictEqual(resolveLeaveTypeSettlement(makeSettings('WAT', 'days'), 'leaveform.option1').captureMode, 'dayRange')
	assert.strictEqual(resolveLeaveTypeSettlement(null, 'leaveform.option1').unit, 'days')
	assert.strictEqual(resolveLeaveTypeSettlement(undefined, undefined).hoursPerDay, 8)
})

test('resolveLeaveTypeSettlement: hoursPerDay z fallbackiem na 8', () => {
	assert.strictEqual(resolveLeaveTypeSettlement(makeSettings('hours', 'days', 7.5), 'leaveform.option1').hoursPerDay, 7.5)
	assert.strictEqual(resolveLeaveTypeSettlement(makeSettings('hours', 'days', 0), 'leaveform.option1').hoursPerDay, 8)
	assert.strictEqual(resolveLeaveTypeSettlement(makeSettings('hours', 'days', null), 'leaveform.option1').hoursPerDay, 8)
})

test('getLeaveRequestQuantity: przypadki brzegowe rekordow', () => {
	for (const testCase of QUANTITY_CASES) {
		const settings = makeSettings(testCase.settlementUnit, testCase.leaveCalculationMode)
		const quantity = getLeaveRequestQuantity(testCase.request, settings)
		assert.deepStrictEqual(
			{ unit: quantity.unit, value: quantity.value, isHourly: quantity.isHourly },
			testCase.expected,
			testCase.name
		)
	}
})

test('isHourlyLeaveRequest: dyskryminatorem jest hoursRequested, nie default schematu', () => {
	assert.strictEqual(isHourlyLeaveRequest({ daysRequested: 3 }), false)
	assert.strictEqual(isHourlyLeaveRequest({ daysRequested: 1, hoursRequested: null }), false)
	assert.strictEqual(isHourlyLeaveRequest({ daysRequested: 1, hoursRequested: 0 }), false)
	assert.strictEqual(isHourlyLeaveRequest({ daysRequested: 1, hoursRequested: 4 }), true)
	// settlementUnit jako zabezpieczenie wtorne
	assert.strictEqual(isHourlyLeaveRequest({ daysRequested: 1, settlementUnit: 'hours' }), true)
	assert.strictEqual(isHourlyLeaveRequest({ daysRequested: 1, settlementUnit: 'days' }), false)
	assert.strictEqual(isBlockingLeaveRequest({ daysRequested: 3 }), true)
	assert.strictEqual(isBlockingLeaveRequest({ daysRequested: 1, hoursRequested: 4 }), false)
})

test('getLeaveRequestAmountInUnit: konwersja w obie strony', () => {
	const dayRequest = { type: 'leaveform.option1', daysRequested: 3 }
	assert.strictEqual(getLeaveRequestAmountInUnit(dayRequest, 'days', 8, 3), 3)
	assert.strictEqual(getLeaveRequestAmountInUnit(dayRequest, 'hours', 8, 3), 24)
	assert.strictEqual(getLeaveRequestAmountInUnit(dayRequest, 'hours', 7.5, 2), 15)
	// bez filtra okresu bierzemy daysRequested z rekordu
	assert.strictEqual(getLeaveRequestAmountInUnit(dayRequest, 'days', 8), 3)

	const hourRequest = { type: 'custom-childcare', daysRequested: 1, hoursRequested: 4, hoursPerDaySnapshot: 8 }
	assert.strictEqual(getLeaveRequestAmountInUnit(hourRequest, 'hours', 8, 1), 4)
	assert.strictEqual(getLeaveRequestAmountInUnit(hourRequest, 'days', 8, 1), 0.5)
	// poza okresem -> zero
	assert.strictEqual(getLeaveRequestAmountInUnit(hourRequest, 'hours', 8, 0), 0)
	assert.strictEqual(getLeaveRequestAmountInUnit(hourRequest, 'days', 8, 0), 0)
})

test('getLeaveRequestAmountInUnit: hoursPerDaySnapshot ma pierwszenstwo nad biezacym ustawieniem', () => {
	const request = { type: 'custom-childcare', daysRequested: 1, hoursRequested: 6, hoursPerDaySnapshot: 6 }
	// snapshot 6h/dzien -> 6 godzin to caly dzien, mimo ze zespol ma teraz 8h
	assert.strictEqual(getLeaveRequestAmountInUnit(request, 'days', 8, 1), 1)
	const withoutSnapshot = { type: 'custom-childcare', daysRequested: 1, hoursRequested: 6 }
	assert.strictEqual(getLeaveRequestAmountInUnit(withoutSnapshot, 'days', 8, 1), 0.75)
})

test('convertLeaveAmount', () => {
	assert.strictEqual(convertLeaveAmount(2, 'days', 'hours', 8), 16)
	assert.strictEqual(convertLeaveAmount(16, 'hours', 'days', 8), 2)
	assert.strictEqual(convertLeaveAmount(3, 'days', 'days', 8), 3)
	assert.strictEqual(convertLeaveAmount('nie liczba', 'days', 'hours', 8), 0)
})

test('formatowanie zachowuje dotychczasowy zapis: godziny z jednym miejscem, dni surowo', () => {
	const daySettings = makeSettings('inherit', 'days')
	const hourGlobalSettings = makeSettings('inherit', 'hours')
	const request = { type: 'leaveform.option1', daysRequested: 3 }

	assert.strictEqual(formatLeaveQuantityValue(request, daySettings), '3')
	assert.strictEqual(formatLeaveQuantityValue(request, hourGlobalSettings), '24.0')

	assert.strictEqual(formatLeaveQuantity(request, daySettings, { days: 'Dni', hours: 'Godziny' }), '3 Dni')
	assert.strictEqual(formatLeaveQuantity(request, hourGlobalSettings, { days: 'Dni', hours: 'Godziny' }), '24.0 Godziny')

	assert.strictEqual(getLeaveQuantityLabel(daySettings, 'leaveform.option1', { days: 'Dni', hours: 'Godziny' }), 'Dni')
	assert.strictEqual(getLeaveQuantityLabel(hourGlobalSettings, 'leaveform.option1', { days: 'Dni', hours: 'Godziny' }), 'Godziny')
})

test('NON_HOURLY_LEAVE_QUERY obejmuje brak pola, null i zero', () => {
	const branches = NON_HOURLY_LEAVE_QUERY.$or
	assert.strictEqual(branches.length, 3)
	assert.deepStrictEqual(branches[0], { hoursRequested: { $exists: false } })
	assert.deepStrictEqual(branches[1], { hoursRequested: null })
	assert.deepStrictEqual(branches[2], { hoursRequested: { $lte: 0 } })
})
