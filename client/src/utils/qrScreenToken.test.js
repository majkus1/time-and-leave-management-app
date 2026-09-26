import { describe, it, expect } from 'vitest'
import { generateScreenToken, secondsLeftInWindow, WINDOW_SEC } from './qrScreenToken'

// Ten sam wektor co server/tests/qrScreenToken.test.js — bliźniaki muszą liczyć identycznie
const SECRET = 'a'.repeat(64)
const CODE = 'abc123-00ff00ff00ff00ff'
const T0 = Date.UTC(2026, 8, 27, 10, 0, 5)

describe('qrScreenToken (WebCrypto)', () => {
	it('daje ten sam token co serwer', async () => {
		expect(await generateScreenToken(SECRET, CODE, T0)).toBe('237a6c44d2')
	})

	it('zmienia się między oknami i jest stały w obrębie okna', async () => {
		const a = await generateScreenToken(SECRET, CODE, T0)
		const b = await generateScreenToken(SECRET, CODE, T0 + 10_000)
		const c = await generateScreenToken(SECRET, CODE, T0 + WINDOW_SEC * 1000)
		expect(a).toBe(b)
		expect(a).not.toBe(c)
	})

	it('odlicza sekundy do zmiany kodu', () => {
		expect(secondsLeftInWindow(T0)).toBe(25)
	})
})
