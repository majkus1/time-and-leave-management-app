import { describe, expect, it } from 'vitest'
import { freemiumSeatRecoveryPath, isFreemiumSeatEscapePath } from './freemiumSeatEscape'

describe('freemiumSeatEscape', () => {
	it('admin escape paths include team management', () => {
		expect(isFreemiumSeatEscapePath('/team-management', ['Admin'])).toBe(true)
		expect(isFreemiumSeatEscapePath('/dashboard', ['Admin'])).toBe(false)
		expect(isFreemiumSeatEscapePath('/work-time', ['Admin'])).toBe(true)
		expect(isFreemiumSeatEscapePath('/work-time', ['Pracownik (Worker)'])).toBe(true)
	})

	it('recovery path sends admin and HR to packages', () => {
		expect(freemiumSeatRecoveryPath(['Admin'])).toBe('/packages')
		expect(freemiumSeatRecoveryPath(['HR'])).toBe('/packages')
		expect(freemiumSeatRecoveryPath(['Pracownik (Worker)'])).toContain('team-access-notice')
	})
})
