import { describe, it, expect } from 'vitest'
import {
	ACTIVE_TIMER_REFETCH_MS,
	INACTIVE_TIMER_STALE_MS,
	resolveActiveTimerRefetchInterval,
	resolveActiveTimerStaleTime,
} from './activeTimerQueryPolicy.js'

describe('activeTimerQueryPolicy', () => {
	it('does not poll when query is disabled', () => {
		expect(resolveActiveTimerRefetchInterval({ active: true }, false)).toBe(false)
	})

	it('does not poll when timer is inactive or unknown', () => {
		expect(resolveActiveTimerRefetchInterval({ active: false })).toBe(false)
		expect(resolveActiveTimerRefetchInterval(undefined)).toBe(false)
		expect(resolveActiveTimerRefetchInterval({})).toBe(false)
	})

	it('polls every 5s only when timer is active', () => {
		expect(resolveActiveTimerRefetchInterval({ active: true })).toBe(ACTIVE_TIMER_REFETCH_MS)
	})

	it('uses zero stale time while active, long stale time when idle', () => {
		expect(resolveActiveTimerStaleTime({ active: true })).toBe(0)
		expect(resolveActiveTimerStaleTime({ active: false })).toBe(INACTIVE_TIMER_STALE_MS)
		expect(resolveActiveTimerStaleTime(undefined)).toBe(INACTIVE_TIMER_STALE_MS)
	})
})
