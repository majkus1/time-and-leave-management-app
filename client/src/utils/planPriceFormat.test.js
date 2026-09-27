import { describe, expect, it } from 'vitest'
import { formatPlanMoney, isEnglishLang } from './planPriceFormat'

describe('formatPlanMoney', () => {
	it('po polsku pełne złote bez groszy', () => {
		expect(formatPlanMoney(119, 'pl')).toBe('119 zł')
	})

	it('po polsku grosze z przecinkiem', () => {
		expect(formatPlanMoney(2390 / 12, 'pl')).toBe('199,17 zł')
	})

	it('po angielsku orientacyjnie w USD', () => {
		expect(formatPlanMoney(119, 'en')).toBe('$32.25')
		expect(formatPlanMoney(69, 'en-GB')).toBe('$18.70')
	})

	it('brak kwoty daje kreskę zamiast NaN', () => {
		expect(formatPlanMoney(null, 'pl')).toBe('—')
		expect(formatPlanMoney(undefined, 'en')).toBe('—')
	})

	it('rozpoznaje język angielski', () => {
		expect(isEnglishLang('en')).toBe(true)
		expect(isEnglishLang('pl')).toBe(false)
		expect(isEnglishLang(undefined)).toBe(false)
	})
})
