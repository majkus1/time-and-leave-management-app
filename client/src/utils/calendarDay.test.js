import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { stepToNextUtcDay } from './calendarDay'

// Ta sama pętla co generateDateRangeForCalendar w kalendarzach (bez weekendów, bez świąt)
function workdays(startDate, endDate) {
	const out = []
	const end = new Date(endDate)
	const current = new Date(startDate)
	while (current <= end) {
		const day = current.getDay()
		if (day !== 0 && day !== 6) out.push(new Date(current).toISOString().split('T')[0])
		stepToNextUtcDay(current)
	}
	return out
}

describe('stepToNextUtcDay — zakresy dat przez zmianę czasu (Europe/Warsaw)', () => {
	let tz
	beforeAll(() => {
		tz = process.env.TZ
		process.env.TZ = 'Europe/Warsaw'
	})
	afterAll(() => {
		process.env.TZ = tz
	})

	it('jesień: urlop 19–30.10.2026 ma 10 dni roboczych, ostatni 30.10', () => {
		const days = workdays('2026-10-19T00:00:00.000Z', '2026-10-30T00:00:00.000Z')
		expect(days).toHaveLength(10)
		expect(days.at(-1)).toBe('2026-10-30')
	})

	it('wiosna: 22.03–2.04.2027 bez przesunięcia dni (poniedziałek 29.03, nie niedziela 28.03)', () => {
		const days = workdays('2027-03-22T00:00:00.000Z', '2027-04-02T00:00:00.000Z')
		expect(days).toEqual([
			'2027-03-22', '2027-03-23', '2027-03-24', '2027-03-25', '2027-03-26',
			'2027-03-29', '2027-03-30', '2027-03-31', '2027-04-01', '2027-04-02',
		])
	})

	it('bez zmiany czasu wynik jak dotąd', () => {
		expect(workdays('2026-09-01T00:00:00.000Z', '2026-09-04T00:00:00.000Z')).toEqual([
			'2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04',
		])
		expect(workdays('2026-10-19', '2026-10-19')).toEqual(['2026-10-19'])
	})
})
