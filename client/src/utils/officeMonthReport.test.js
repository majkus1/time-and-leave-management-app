import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buildOfficeMonthRows, leavesInMonth, workdaysInMonth } from './officeMonthReport'

const t = key => key
const i18n = { resolvedLanguage: 'pl' }

describe('raport miesiąca biura rachunkowego', () => {
	let tz
	beforeAll(() => {
		tz = process.env.TZ
		process.env.TZ = 'Europe/Warsaw'
	})
	afterAll(() => {
		process.env.TZ = tz
	})

	const data = {
		year: 2026,
		month: 9,
		settings: { workOnWeekends: false, includePolishHolidays: true, leaveHoursPerDay: 8, leaveRequestTypes: [{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy' }] },
		users: [
			{ id: 'u1', firstName: 'Anna', lastName: 'Nowak', confirmed: true, leaveLimits: [{ typeId: 'leaveform.option1', limit: 26, used: 3, remaining: 23 }] },
			{ id: 'u2', firstName: 'Jan', lastName: 'Kowal', confirmed: false, leaveLimits: [] },
		],
		workdays: [
			{ userId: 'u1', date: '2026-10-05T00:00:00Z', hoursWorked: 8, additionalWorked: 0 },
			{ userId: 'u1', date: '2026-10-07T00:00:00Z', hoursWorked: 8, additionalWorked: 2 },
			{ userId: 'u2', date: '2026-10-05T00:00:00Z', hoursWorked: 6 },
			{ userId: 'u2', date: '2026-09-29T22:00:00Z', hoursWorked: 4 }, // 30.09 w Polsce — inny miesiąc
		],
		leaves: [
			{ userId: 'u1', type: 'leaveform.option1', startDate: '2026-10-12T00:00:00Z', endDate: '2026-10-14T00:00:00Z' },
			{ userId: 'u2', type: 'leaveform.option1', startDate: '2026-09-28T00:00:00Z', endDate: '2026-09-30T00:00:00Z' },
			{ userId: 'u2', type: 'leaveform.option1', startDate: '2026-11-01T00:00:00Z', endDate: '2026-11-05T00:00:00Z' },
		],
	}

	it('wiersze per pracownik, suma i potwierdzenia z jednego źródła', () => {
		const { rows, sum, confirmedCount } = buildOfficeMonthRows(data, { t, i18n })
		const anna = rows.find(r => r.user.id === 'u1')
		expect(anna.totals.totalWorkDays).toBe(2)
		expect(anna.totals.totalHours).toBe(16)
		expect(anna.totals.overtime).toBe(2)
		expect(anna.totals.leaveDays).toBe(3)
		expect(anna.mainLeave.remaining).toBe(23)
		expect(rows.find(r => r.user.id === 'u2').totals.totalHours).toBe(6)
		expect(sum.totalHours).toBe(22)
		expect(confirmedCount).toBe(1)
	})

	it('eksport: nieobecności i dni pracy tylko z wybranego miesiąca', () => {
		expect(leavesInMonth(data.leaves, 2026, 9).map(l => l.startDate)).toEqual(['2026-10-12T00:00:00Z'])
		expect(workdaysInMonth(data.workdays, 2026, 9)).toHaveLength(3)
		// Urlop przez granicę miesięcy jest w obu miesiącach
		const cross = [{ startDate: '2026-10-28T00:00:00Z', endDate: '2026-11-05T00:00:00Z' }]
		expect(leavesInMonth(cross, 2026, 9)).toHaveLength(1)
		expect(leavesInMonth(cross, 2026, 10)).toHaveLength(1)
	})

	it('brak danych → pusty raport', () => {
		expect(buildOfficeMonthRows(null, { t, i18n })).toEqual({ rows: [], sum: null, confirmedCount: 0 })
	})
})
