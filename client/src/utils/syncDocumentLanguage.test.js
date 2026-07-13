import { describe, expect, it } from 'vitest'
import { resolveAppHtmlLang } from './syncDocumentLanguage.js'

describe('resolveAppHtmlLang', () => {
	it('maps Polish variants to pl', () => {
		expect(resolveAppHtmlLang('pl')).toBe('pl')
		expect(resolveAppHtmlLang('pl-PL')).toBe('pl')
	})

	it('maps English variants to en', () => {
		expect(resolveAppHtmlLang('en')).toBe('en')
		expect(resolveAppHtmlLang('en-GB')).toBe('en')
	})

	it('defaults to pl', () => {
		expect(resolveAppHtmlLang()).toBe('pl')
		expect(resolveAppHtmlLang('')).toBe('pl')
	})
})
