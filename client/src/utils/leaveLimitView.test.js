import { describe, expect, it } from 'vitest'
import { resolveLeaveLimitView, sumAutoDeductedAmount } from './leaveLimitView'

// Bliźniaczy zestaw do server/tests/leaveLimitView.test.js — oba widoki muszą liczyć tak samo.

describe('resolveLeaveLimitView — tryb ręczny (opcja wyłączona)', () => {
	it('pozostało to pula minus zużycie, jak przed dodaniem opcji', () => {
		const view = resolveLeaveLimitView({ storedValue: 15, used: 4 })
		expect(view.limit).toBe(15)
		expect(view.remaining).toBe(11)
	})

	it('liczy procent zużycia od puli', () => {
		expect(resolveLeaveLimitView({ storedValue: 20, used: 5 }).usagePercent).toBe(25)
	})

	it('wykrywa przekroczenie puli', () => {
		const view = resolveLeaveLimitView({ storedValue: 10, used: 12 })
		expect(view.isExceeded).toBe(true)
		expect(view.remaining).toBe(-2)
	})

	it('ostrzega, gdy oczekujące wnioski przekroczą pulę', () => {
		const view = resolveLeaveLimitView({ storedValue: 10, used: 8, pending: 5 })
		expect(view.isExceeded).toBe(false)
		expect(view.isAtRisk).toBe(true)
	})

	it('nie dzieli przez zero przy pustej puli', () => {
		expect(resolveLeaveLimitView({ storedValue: 0, used: 3 }).usagePercent).toBe(0)
	})
})

describe('resolveLeaveLimitView — tryb automatyczny', () => {
	it('bierze zapisane saldo wprost, bez odejmowania drugi raz', () => {
		const view = resolveLeaveLimitView({ storedValue: 11, used: 4, autoDeducted: 4, autoMode: true })
		expect(view.remaining).toBe(11)
	})

	it('odtwarza pulę ze śladu pobrań', () => {
		const view = resolveLeaveLimitView({ storedValue: 11, used: 4, autoDeducted: 4, autoMode: true })
		expect(view.limit).toBe(15)
		expect(view.usagePercent).toBeCloseTo((4 / 15) * 100, 3)
	})

	it('bez pobrań pula równa się saldu', () => {
		const view = resolveLeaveLimitView({ storedValue: 26, autoDeducted: 0, autoMode: true })
		expect(view.limit).toBe(26)
		expect(view.remaining).toBe(26)
	})

	it('wnioski sprzed włączenia opcji nie zawyżają puli', () => {
		const view = resolveLeaveLimitView({ storedValue: 12, used: 7, autoDeducted: 3, autoMode: true })
		expect(view.limit).toBe(15)
		expect(view.remaining).toBe(12)
	})

	it('ujemne saldo oznacza przekroczenie', () => {
		const view = resolveLeaveLimitView({ storedValue: -2, used: 12, autoDeducted: 12, autoMode: true })
		expect(view.isExceeded).toBe(true)
	})

	it('ręczna korekta salda przesuwa odtworzoną pulę', () => {
		const view = resolveLeaveLimitView({ storedValue: 12, used: 4, autoDeducted: 4, autoMode: true })
		expect(view.limit).toBe(16)
		expect(view.remaining).toBe(12)
	})
})

describe('sumAutoDeductedAmount', () => {
	const wniosek = (overrides = {}) => ({
		type: 'leaveform.option1',
		autoDeductedAmount: 2,
		autoDeductedUnit: 'days',
		...overrides,
	})

	it('sumuje tylko wskazany typ', () => {
		const suma = sumAutoDeductedAmount(
			[wniosek(), wniosek({ type: 'inny', autoDeductedAmount: 9 }), wniosek({ autoDeductedAmount: 3 })],
			'leaveform.option1',
			'days',
			8
		)
		expect(suma).toBe(5)
	})

	it('pomija wnioski bez śladu pobrania', () => {
		const suma = sumAutoDeductedAmount(
			[wniosek({ autoDeductedAmount: null }), wniosek({ autoDeductedAmount: 0 }), wniosek()],
			'leaveform.option1',
			'days',
			8
		)
		expect(suma).toBe(2)
	})

	it('przelicza godziny na dni, gdy typ zmienił jednostkę', () => {
		const suma = sumAutoDeductedAmount(
			[wniosek({ autoDeductedAmount: 8, autoDeductedUnit: 'hours' })],
			'leaveform.option1',
			'days',
			8
		)
		expect(suma).toBe(1)
	})

	it('sumuje godziny dla typu godzinowego', () => {
		const suma = sumAutoDeductedAmount(
			[
				wniosek({ type: 'opieka', autoDeductedAmount: 6, autoDeductedUnit: 'hours' }),
				wniosek({ type: 'opieka', autoDeductedAmount: 4, autoDeductedUnit: 'hours' }),
			],
			'opieka',
			'hours',
			8
		)
		expect(suma).toBe(10)
	})

	it('radzi sobie z brakiem listy', () => {
		expect(sumAutoDeductedAmount(undefined, 'leaveform.option1', 'days', 8)).toBe(0)
		expect(sumAutoDeductedAmount([null], 'leaveform.option1', 'days', 8)).toBe(0)
	})
})
