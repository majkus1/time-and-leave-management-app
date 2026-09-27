const test = require('node:test')
const assert = require('node:assert/strict')
const { warsawDayStart } = require('../utils/workdayEntryValidation')

// Produkcja działa w UTC, dev w Europe/Warsaw — ten sam kod musi dać właściwy dzień w obu strefach
const withTZ = (tz, fn) => {
	const prev = process.env.TZ
	process.env.TZ = tz
	try {
		fn()
	} finally {
		// Brak TZ ≠ napis "undefined" (Node potraktowałby go jak UTC)
		if (prev === undefined) delete process.env.TZ
		else process.env.TZ = prev
	}
}

test('serwer w UTC: skan 00:30 czasu PL trafia do nowego dnia (00:00Z tej daty)', () => {
	withTZ('UTC', () => {
		// 11.11.2026 00:30 w Warszawie (zima, UTC+1) = 10.11 23:30Z
		const d = warsawDayStart(new Date('2026-11-10T23:30:00Z'))
		assert.equal(d.toISOString(), '2026-11-11T00:00:00.000Z')
		// Lato (UTC+2): 1.10.2026 01:30 PL = 30.09 23:30Z
		assert.equal(warsawDayStart(new Date('2026-09-30T23:30:00Z')).toISOString(), '2026-10-01T00:00:00.000Z')
		// Zwykła pora dnia — bez zmian względem setHours w UTC
		assert.equal(warsawDayStart(new Date('2026-09-15T10:00:00Z')).toISOString(), '2026-09-15T00:00:00.000Z')
	})
})

test('serwer w Warszawie: północ lokalna jak dotąd, także przy zmianie czasu', () => {
	withTZ('Europe/Warsaw', () => {
		const d = warsawDayStart(new Date('2026-11-10T23:30:00Z'))
		assert.equal(d.getFullYear(), 2026)
		assert.equal(d.getMonth(), 10)
		assert.equal(d.getDate(), 11)
		assert.equal(d.getHours(), 0)
		// 25.10.2026 — koniec czasu letniego
		const dst = warsawDayStart(new Date('2026-10-25T12:00:00Z'))
		assert.equal(dst.getDate(), 25)
		assert.equal(dst.getHours(), 0)
	})
})

test('idempotentna dla początku dnia i odporna na zły wejściowy', () => {
	withTZ('UTC', () => {
		const start = warsawDayStart(new Date('2026-09-15T10:00:00Z'))
		assert.equal(warsawDayStart(start).getTime(), start.getTime())
		assert.ok(Number.isNaN(warsawDayStart('bzdura').getTime()))
	})
})
