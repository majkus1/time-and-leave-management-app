import { describe, expect, it } from 'vitest'
import {
	formatHoursClock,
	formatHoursDecimal,
	formatMinutesAsClock,
	formatBreakdownHours,
	formatWorkDuration,
	getDurationMinutes,
	hoursFromDurationMinutes,
	roundHours,
	roundToHalfHour,
} from './formatWorkDuration'

describe('formatWorkDuration', () => {
	it('roundHours keeps two decimal places', () => {
		expect(roundHours(0.1167)).toBe(0.12)
	})

	it('getDurationMinutes matches server Math.round rule', () => {
		const start = '2026-06-08T19:40:00.000Z'
		const end = '2026-06-08T19:47:30.000Z'
		expect(getDurationMinutes(start, end)).toBe(8)
	})

	it('formatMinutesAsClock avoids float drift', () => {
		expect(formatMinutesAsClock(8)).toBe('0:08')
		expect(formatMinutesAsClock(7)).toBe('0:07')
	})

	it('formatBreakdownHours uses clock under 1h', () => {
		expect(formatBreakdownHours(0.12)).toBe('0:07')
		expect(formatBreakdownHours(8)).toBe('8 h')
	})

	it('roundToHalfHour keeps manual ewidencja steps', () => {
		expect(roundToHalfHour(8)).toBe(8)
		expect(roundToHalfHour(8.3)).toBe(8.5)
		expect(roundToHalfHour(0.12)).toBe(0)
	})

	it('formatHoursDecimal matches legacy display', () => {
		expect(formatHoursDecimal(8)).toBe('8')
		expect(formatHoursDecimal(8.5)).toBe('8.5')
		expect(formatHoursDecimal(0.1)).toBe('0.1')
	})

	it('formatHoursClock matches session list style', () => {
		expect(formatHoursClock(8 / 60)).toBe('0:08')
		expect(formatHoursClock(1.5)).toBe('1:30')
	})

	it('uses clock format under 1h when filter/timer mode is on', () => {
		expect(formatWorkDuration(8 / 60, { preferClockUnderHour: true })).toBe('0:08')
		expect(formatWorkDuration(8, { preferClockUnderHour: true })).toBe('8')
		expect(formatWorkDuration(0.12, { preferClockUnderHour: false })).toBe('0.1')
	})
})
