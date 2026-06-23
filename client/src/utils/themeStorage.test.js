import { describe, it, expect, beforeEach } from 'vitest'
import {
	THEME_STORAGE_KEY,
	THEME_SWITCHER_ENABLED,
	resolveTheme,
	readThemePreference,
	setThemePreference,
} from './themeStorage'

describe('themeStorage', () => {
	beforeEach(() => {
		localStorage.clear()
	})

	it('resolveTheme returns explicit light/dark when switcher enabled', () => {
		expect(resolveTheme('light')).toBe('light')
		if (!THEME_SWITCHER_ENABLED) {
			expect(resolveTheme('dark')).toBe('light')
			return
		}
		expect(resolveTheme('dark')).toBe('dark')
	})

	it('readThemePreference defaults to light when switcher enabled', () => {
		if (!THEME_SWITCHER_ENABLED) {
			expect(readThemePreference()).toBe('light')
			return
		}
		expect(readThemePreference()).toBe('light')
	})

	it('readThemePreference treats legacy system value as light', () => {
		if (!THEME_SWITCHER_ENABLED) return
		localStorage.setItem(THEME_STORAGE_KEY, 'system')
		expect(readThemePreference()).toBe('light')
	})

	it('setThemePreference persists and returns effective theme when switcher enabled', () => {
		if (!THEME_SWITCHER_ENABLED) {
			expect(setThemePreference('dark')).toBe('light')
			expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
			return
		}
		expect(setThemePreference('dark')).toBe('dark')
		expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
		expect(setThemePreference('light')).toBe('light')
	})
})
