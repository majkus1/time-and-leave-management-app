const test = require('node:test')
const assert = require('node:assert')

const { validateHourlyLeaveSubmission } = require('../utils/leaveSettlement')

const settings = {
	leaveCalculationMode: 'days',
	leaveHoursPerDay: 8,
	leaveRequestTypes: [
		{ id: 'custom-childcare', name: 'Opieka nad dzieckiem', isEnabled: true, settlementUnit: 'hours' },
	],
}

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

test('poprawny wniosek godzinowy przechodzi', () => {
	const result = validate({})
	assert.strictEqual(result.ok, true)
	assert.strictEqual(result.hours, 4)
	assert.strictEqual(result.hoursPerDay, 8)
})

test('zakres dat jest odrzucany', () => {
	assert.strictEqual(validate({ endYmd: '2026-08-12' }).code, 'HOURLY_SINGLE_DAY_ONLY')
	assert.strictEqual(validate({ startYmd: null }).code, 'HOURLY_SINGLE_DAY_ONLY')
	assert.strictEqual(validate({ endYmd: undefined }).code, 'HOURLY_SINGLE_DAY_ONLY')
})

test('brak, zero i wartosci ujemne sa odrzucane', () => {
	assert.strictEqual(validate({ hoursRequested: undefined }).code, 'HOURLY_HOURS_REQUIRED')
	assert.strictEqual(validate({ hoursRequested: null }).code, 'HOURLY_HOURS_REQUIRED')
	assert.strictEqual(validate({ hoursRequested: 0 }).code, 'HOURLY_HOURS_REQUIRED')
	assert.strictEqual(validate({ hoursRequested: -2 }).code, 'HOURLY_HOURS_REQUIRED')
	assert.strictEqual(validate({ hoursRequested: 'cztery' }).code, 'HOURLY_HOURS_REQUIRED')
})

test('liczba godzin ponad dlugosc dnia jest odrzucana', () => {
	assert.strictEqual(validate({ hoursRequested: 9 }).code, 'HOURLY_HOURS_RANGE')
	// dokladna granica przechodzi
	assert.strictEqual(validate({ hoursRequested: 8 }).ok, true)
})

test('krok inny niz 0.5 jest odrzucany', () => {
	assert.strictEqual(validate({ hoursRequested: 3.7 }).code, 'HOURLY_HOURS_STEP')
	assert.strictEqual(validate({ hoursRequested: 0.25 }).code, 'HOURLY_HOURS_STEP')
	assert.strictEqual(validate({ hoursRequested: 3.5 }).ok, true)
	assert.strictEqual(validate({ hoursRequested: 0.5 }).ok, true)
})

test('limit dzienny uwzglednia godziny juz zarezerwowane', () => {
	assert.strictEqual(validate({ hoursRequested: 4, alreadyBookedHoursOnDay: 4 }).ok, true)
	assert.strictEqual(validate({ hoursRequested: 4.5, alreadyBookedHoursOnDay: 4 }).code, 'HOURLY_DAY_CAP_EXCEEDED')
	assert.strictEqual(validate({ hoursRequested: 1, alreadyBookedHoursOnDay: 8 }).code, 'HOURLY_DAY_CAP_EXCEEDED')
	// smieciowa wartosc traktowana jak zero
	assert.strictEqual(validate({ hoursRequested: 8, alreadyBookedHoursOnDay: null }).ok, true)
})

test('dlugosc dnia bierze sie z ustawien zespolu', () => {
	const shortDaySettings = { ...settings, leaveHoursPerDay: 6 }
	const result = validateHourlyLeaveSubmission({
		settings: shortDaySettings,
		typeId: 'custom-childcare',
		startYmd: '2026-08-11',
		endYmd: '2026-08-11',
		hoursRequested: 7,
	})
	assert.strictEqual(result.code, 'HOURLY_HOURS_RANGE')
})
