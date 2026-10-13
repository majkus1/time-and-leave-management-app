import { beforeEach, describe, expect, it } from 'vitest'
import { captureReferralFromUrl, normalizeReferralCode, parseReferralCookieValue, readReferralCode } from './referral'

function clearCookie() {
	document.cookie = 'planopia_ref=; Max-Age=0; Path=/'
}

describe('kod polecający (?ref)', () => {
	beforeEach(clearCookie)

	it('normalizacja jak na serwerze', () => {
		expect(normalizeReferralCode('Biuro123')).toBe('biuro123')
		expect(normalizeReferralCode('biuro_123')).toBeNull()
		expect(normalizeReferralCode('ab')).toBeNull()
	})

	it('wartość cookie „kod.czas” i sam kod', () => {
		expect(parseReferralCookieValue(encodeURIComponent('biuro123.1760000000000'))).toBe('biuro123')
		expect(parseReferralCookieValue('biuro-kadry')).toBe('biuro-kadry')
		expect(parseReferralCookieValue('zly kod.1')).toBeNull()
	})

	it('first-touch: pierwszy kod zostaje, kolejny link go nie nadpisuje', () => {
		expect(captureReferralFromUrl('?ref=Biuro123')).toBe('biuro123')
		expect(readReferralCode()).toBe('biuro123')
		expect(captureReferralFromUrl('?ref=inne-biuro')).toBeNull()
		expect(readReferralCode()).toBe('biuro123')
	})

	it('bez ?ref albo z niepoprawnym kodem nic nie zapisuje', () => {
		expect(captureReferralFromUrl('?plan=pro')).toBeNull()
		expect(captureReferralFromUrl('?ref=<x>')).toBeNull()
		expect(readReferralCode()).toBeNull()
	})
})
