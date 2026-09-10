import { describe, expect, it } from 'vitest'
import { freemiumSeatRecoveryPath, isFreemiumSeatEscapePath } from './freemiumSeatEscape'

describe('freemiumSeatEscape', () => {
	it('admin: zarządzanie zespołem, pakiety, centrum pomocy — bez ewidencji', () => {
		expect(isFreemiumSeatEscapePath('/team-management', ['Admin'])).toBe(true)
		expect(isFreemiumSeatEscapePath('/packages', ['Admin'])).toBe(true)
		expect(isFreemiumSeatEscapePath('/helpcenter', ['Admin'])).toBe(true)
		expect(isFreemiumSeatEscapePath('/work-time', ['Admin'])).toBe(false)
		expect(isFreemiumSeatEscapePath('/calendars-list', ['Admin'])).toBe(false)
		expect(isFreemiumSeatEscapePath('/dashboard', ['Admin'])).toBe(false)
	})

	it('HR: tylko pakiety', () => {
		expect(isFreemiumSeatEscapePath('/packages', ['HR'])).toBe(true)
		expect(isFreemiumSeatEscapePath('/team-management', ['HR'])).toBe(false)
		expect(isFreemiumSeatEscapePath('/work-time', ['HR'])).toBe(false)
	})

	it('pracownik i przełożony: wyłącznie komunikat', () => {
		for (const role of [['Pracownik (Worker)'], ['Przełożony (Supervisor)']]) {
			expect(isFreemiumSeatEscapePath('/team-access-notice', role)).toBe(true)
			expect(isFreemiumSeatEscapePath('/team-access-notice?reason=seats', role)).toBe(true)
			expect(isFreemiumSeatEscapePath('/work-time', role)).toBe(false)
			expect(isFreemiumSeatEscapePath('/edit-profile', role)).toBe(false)
			expect(isFreemiumSeatEscapePath('/packages', role)).toBe(false)
		}
	})

	it('ścieżka odzyskania: Admin i HR do pakietów, reszta do komunikatu', () => {
		expect(freemiumSeatRecoveryPath(['Admin'])).toBe('/packages')
		expect(freemiumSeatRecoveryPath(['HR'])).toBe('/packages')
		expect(freemiumSeatRecoveryPath(['Pracownik (Worker)'])).toContain('team-access-notice')
	})
})
