import { describe, it, expect } from 'vitest'
import { computeTimerMetrics, formatTimerClock, buildTimerChromeText } from './timerDisplay'

describe('timerDisplay', () => {
	it('formats clock as HH:MM:SS', () => {
		expect(formatTimerClock(3661)).toBe('01:01:01')
	})

	it('computes elapsed seconds from startTime', () => {
		const start = new Date('2026-05-16T10:00:00.000Z')
		const now = start.getTime() + 125000
		const metrics = computeTimerMetrics(
			{ active: true, startTime: start.toISOString(), isBreak: false, totalBreakTime: 0 },
			now
		)
		expect(metrics?.elapsedSeconds).toBe(125)
	})

	it('builds document title with clock when active', () => {
		const chrome = buildTimerChromeText(
			{
				elapsedSeconds: 90,
				totalBreakTime: 0,
				totalOvertimeTime: 0,
				isBreak: false,
				isOvertime: false,
				workDescription: '',
			},
			{ locale: 'pl' }
		)
		expect(chrome.documentTitle).toBe('00:01:30 · Planopia')
	})

	it('prefixes pause in document title', () => {
		const chrome = buildTimerChromeText(
			{
				elapsedSeconds: 90,
				totalBreakTime: 0,
				totalOvertimeTime: 0,
				isBreak: true,
				isOvertime: false,
				workDescription: '',
			},
			{ locale: 'pl' }
		)
		expect(chrome.documentTitle).toBe('⏸ 00:01:30 · Planopia')
	})
})
