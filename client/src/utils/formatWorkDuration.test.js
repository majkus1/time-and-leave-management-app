import { describe, expect, it } from 'vitest'
import {
	formatHoursClock,
	formatHoursDecimal,
	formatWorkDuration,
	roundHours,
	roundToHalfHour,
} from './formatWorkDuration'

describe('formatWorkDuration', () => {
	it('roundHours keeps two decimal places', () => {
		expect(roundHours(0.1167)).toBe(0.12)
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
