import { describe, expect, it } from 'vitest'
import {
	convertLeaveAmount,
	formatLeaveQuantity,
	formatLeaveQuantityValue,
	getLeaveQuantityLabel,
	getLeaveRequestAmountInUnit,
	getLeaveRequestQuantity,
	isBlockingLeaveRequest,
	isHourlyCaptureType,
	isHourlyLeaveRequest,
	resolveLeaveTypeSettlement,
	validateHourlyLeaveSubmission,
} from './leaveSettlement'

/* ------------------------------------------------------------------ *
 * FIXTURE'Y WSPÓŁDZIELONE Z server/tests/leaveSettlement.test.js
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

describe('resolveLeaveTypeSettlement', () => {
	it('rozstrzyga macierz settlementUnit x leaveCalculationMode', () => {
		for (const row of SETTLEMENT_MATRIX) {
			const settings = makeSettings(row.settlementUnit, row.leaveCalculationMode)
			const resolved = resolveLeaveTypeSettlement(settings, 'leaveform.option1')
			expect({ unit: resolved.unit, captureMode: resolved.captureMode }).toEqual({
				unit: row.unit,
				captureMode: row.captureMode,
			})
		}
	})

	it('GWARANCJA BRAKU REGRESJI: inherit + globalny tryb godzinowy nie zmienia sposobu wpisu', () => {
		const settings = makeSettings('inherit', 'hours')
		const resolved = resolveLeaveTypeSettlement(settings, 'leaveform.option1')
		expect(resolved.unit).toBe('hours')
		expect(resolved.captureMode).toBe('dayRange')
		expect(isHourlyCaptureType(settings, 'leaveform.option1')).toBe(false)
	})

	it('nieznany typ i smieciowa wartosc dziedzicza ustawienie zespolu', () => {
		expect(resolveLeaveTypeSettlement(makeSettings('days', 'hours'), 'nie-ma-takiego').unit).toBe('hours')
		expect(resolveLeaveTypeSettlement(makeSettings('WAT', 'days'), 'leaveform.option1').unit).toBe('days')
		expect(resolveLeaveTypeSettlement(makeSettings('WAT', 'days'), 'leaveform.option1').captureMode).toBe('dayRange')
		expect(resolveLeaveTypeSettlement(null, 'leaveform.option1').unit).toBe('days')
		expect(resolveLeaveTypeSettlement(undefined, undefined).hoursPerDay).toBe(8)
	})

	it('hoursPerDay ma fallback na 8', () => {
		expect(resolveLeaveTypeSettlement(makeSettings('hours', 'days', 7.5), 'leaveform.option1').hoursPerDay).toBe(7.5)
		expect(resolveLeaveTypeSettlement(makeSettings('hours', 'days', 0), 'leaveform.option1').hoursPerDay).toBe(8)
		expect(resolveLeaveTypeSettlement(makeSettings('hours', 'days', null), 'leaveform.option1').hoursPerDay).toBe(8)
	})
})

describe('getLeaveRequestQuantity', () => {
	it('obsluguje przypadki brzegowe rekordow', () => {
		for (const testCase of QUANTITY_CASES) {
			const settings = makeSettings(testCase.settlementUnit, testCase.leaveCalculationMode)
			const quantity = getLeaveRequestQuantity(testCase.request, settings)
			expect({ unit: quantity.unit, value: quantity.value, isHourly: quantity.isHourly }).toEqual(
				testCase.expected
			)
		}
	})
})

describe('isHourlyLeaveRequest', () => {
	it('dyskryminatorem jest hoursRequested, nie default schematu', () => {
		expect(isHourlyLeaveRequest({ daysRequested: 3 })).toBe(false)
		expect(isHourlyLeaveRequest({ daysRequested: 1, hoursRequested: null })).toBe(false)
		expect(isHourlyLeaveRequest({ daysRequested: 1, hoursRequested: 0 })).toBe(false)
		expect(isHourlyLeaveRequest({ daysRequested: 1, hoursRequested: 4 })).toBe(true)
		expect(isHourlyLeaveRequest({ daysRequested: 1, settlementUnit: 'hours' })).toBe(true)
		expect(isHourlyLeaveRequest({ daysRequested: 1, settlementUnit: 'days' })).toBe(false)
		expect(isBlockingLeaveRequest({ daysRequested: 3 })).toBe(true)
		expect(isBlockingLeaveRequest({ daysRequested: 1, hoursRequested: 4 })).toBe(false)
	})
})

describe('getLeaveRequestAmountInUnit', () => {
	it('konwertuje w obie strony', () => {
		const dayRequest = { type: 'leaveform.option1', daysRequested: 3 }
		expect(getLeaveRequestAmountInUnit(dayRequest, 'days', 8, 3)).toBe(3)
		expect(getLeaveRequestAmountInUnit(dayRequest, 'hours', 8, 3)).toBe(24)
		expect(getLeaveRequestAmountInUnit(dayRequest, 'hours', 7.5, 2)).toBe(15)
		expect(getLeaveRequestAmountInUnit(dayRequest, 'days', 8)).toBe(3)

		const hourRequest = { type: 'custom-childcare', daysRequested: 1, hoursRequested: 4, hoursPerDaySnapshot: 8 }
		expect(getLeaveRequestAmountInUnit(hourRequest, 'hours', 8, 1)).toBe(4)
		expect(getLeaveRequestAmountInUnit(hourRequest, 'days', 8, 1)).toBe(0.5)
		expect(getLeaveRequestAmountInUnit(hourRequest, 'hours', 8, 0)).toBe(0)
		expect(getLeaveRequestAmountInUnit(hourRequest, 'days', 8, 0)).toBe(0)
	})

	it('hoursPerDaySnapshot ma pierwszenstwo nad biezacym ustawieniem', () => {
		const request = { type: 'custom-childcare', daysRequested: 1, hoursRequested: 6, hoursPerDaySnapshot: 6 }
		expect(getLeaveRequestAmountInUnit(request, 'days', 8, 1)).toBe(1)
		const withoutSnapshot = { type: 'custom-childcare', daysRequested: 1, hoursRequested: 6 }
		expect(getLeaveRequestAmountInUnit(withoutSnapshot, 'days', 8, 1)).toBe(0.75)
	})
})

describe('convertLeaveAmount', () => {
	it('przelicza dni i godziny', () => {
		expect(convertLeaveAmount(2, 'days', 'hours', 8)).toBe(16)
		expect(convertLeaveAmount(16, 'hours', 'days', 8)).toBe(2)
		expect(convertLeaveAmount(3, 'days', 'days', 8)).toBe(3)
		expect(convertLeaveAmount('nie liczba', 'days', 'hours', 8)).toBe(0)
	})
})

describe('formatowanie', () => {
	it('zachowuje dotychczasowy zapis: godziny z jednym miejscem, dni surowo', () => {
		const daySettings = makeSettings('inherit', 'days')
		const hourGlobalSettings = makeSettings('inherit', 'hours')
		const request = { type: 'leaveform.option1', daysRequested: 3 }

		expect(formatLeaveQuantityValue(request, daySettings)).toBe('3')
		expect(formatLeaveQuantityValue(request, hourGlobalSettings)).toBe('24.0')

		expect(formatLeaveQuantity(request, daySettings, { days: 'Dni', hours: 'Godziny' })).toBe('3 Dni')
		expect(formatLeaveQuantity(request, hourGlobalSettings, { days: 'Dni', hours: 'Godziny' })).toBe('24.0 Godziny')

		expect(getLeaveQuantityLabel(daySettings, 'leaveform.option1', { days: 'Dni', hours: 'Godziny' })).toBe('Dni')
		expect(getLeaveQuantityLabel(hourGlobalSettings, 'leaveform.option1', { days: 'Dni', hours: 'Godziny' })).toBe(
			'Godziny'
		)
	})
})

describe('validateHourlyLeaveSubmission', () => {
	const settings = makeSettings('hours', 'days')
	const validate = overrides =>
		validateHourlyLeaveSubmission({
			settings,
			typeId: 'custom-childcare',
			startYmd: '2026-08-11',
			endYmd: '2026-08-11',
			hoursRequested: 4,
			alreadyBookedHoursOnDay: 0,
			...overrides,
		})

	it('przepuszcza poprawny wniosek', () => {
		expect(validate({})).toEqual({ ok: true, hours: 4, hoursPerDay: 8 })
	})

	it('odrzuca zakres dat, zle godziny i przekroczony limit dnia', () => {
		expect(validate({ endYmd: '2026-08-12' }).code).toBe('HOURLY_SINGLE_DAY_ONLY')
		expect(validate({ hoursRequested: 0 }).code).toBe('HOURLY_HOURS_REQUIRED')
		expect(validate({ hoursRequested: 9 }).code).toBe('HOURLY_HOURS_RANGE')
		expect(validate({ hoursRequested: 3.7 }).code).toBe('HOURLY_HOURS_STEP')
		expect(validate({ hoursRequested: 4.5, alreadyBookedHoursOnDay: 4 }).code).toBe('HOURLY_DAY_CAP_EXCEEDED')
		expect(validate({ hoursRequested: 8 }).ok).toBe(true)
		expect(validate({ hoursRequested: 4, alreadyBookedHoursOnDay: 4 }).ok).toBe(true)
	})
})
