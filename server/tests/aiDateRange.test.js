const test = require('node:test')
const assert = require('node:assert/strict')
const { resolveAssistantPresetRange } = require('../utils/aiDateRange')

// Produkcja działa w UTC, dev w Europe/Warsaw — zakres musi wskazywać ten sam dzień/miesiąc kalendarza PL
const withTZ = (tz, fn) => {
	const prev = process.env.TZ
	process.env.TZ = tz
	try {
		fn()
	} finally {
		if (prev === undefined) delete process.env.TZ
		else process.env.TZ = prev
	}
}

// 1.10.2026 o 00:30 czasu PL (lato, UTC+2) = 30.09 22:30Z
const OCT1_0030_PL = new Date('2026-09-30T22:30:00Z')

test('serwer w UTC: 1.10 o 00:30 PL — „miesiąc” to październik, „dziś” to 1.10', () => {
	withTZ('UTC', () => {
		const month = resolveAssistantPresetRange('month', null, null, OCT1_0030_PL)
		assert.equal(month.start.toISOString(), '2026-10-01T00:00:00.000Z')
		assert.equal(month.end.toISOString(), '2026-10-31T23:59:59.999Z')

		// Domyślne 30 dni kończą się dziś (1.10), więc obejmują dokument licznika z 1.10 (00:00Z)
		const def = resolveAssistantPresetRange(undefined, null, null, OCT1_0030_PL)
		assert.equal(def.end.toISOString(), '2026-10-01T23:59:59.999Z')
		assert.equal(def.start.toISOString(), '2026-09-01T00:00:00.000Z')

		const week = resolveAssistantPresetRange('week', null, null, OCT1_0030_PL)
		assert.equal(week.start.toISOString(), '2026-09-24T00:00:00.000Z')

		// 1.01.2027 o 00:30 PL (zima, UTC+1) = 31.12 23:30Z — rok 2027, nie 2026
		const year = resolveAssistantPresetRange('year', null, null, new Date('2026-12-31T23:30:00Z'))
		assert.equal(year.start.toISOString(), '2027-01-01T00:00:00.000Z')
	})
})

test('serwer w Warszawie: te same dni kalendarzowe', () => {
	withTZ('Europe/Warsaw', () => {
		const month = resolveAssistantPresetRange('month', null, null, OCT1_0030_PL)
		assert.deepEqual([month.start.getFullYear(), month.start.getMonth(), month.start.getDate(), month.start.getHours()], [2026, 9, 1, 0])
		assert.deepEqual([month.end.getMonth(), month.end.getDate()], [9, 31])
		const def = resolveAssistantPresetRange('all', null, null, OCT1_0030_PL)
		assert.deepEqual([def.end.getMonth(), def.end.getDate(), def.end.getHours()], [9, 1, 23])
	})
})

test('zwykła pora dnia i zakres własny bez zmian', () => {
	withTZ('UTC', () => {
		const month = resolveAssistantPresetRange('month', null, null, new Date('2026-09-15T10:00:00Z'))
		assert.equal(month.start.toISOString(), '2026-09-01T00:00:00.000Z')
		assert.equal(month.end.toISOString(), '2026-09-30T23:59:59.999Z')
		const custom = resolveAssistantPresetRange('custom', '2026-03-01', '2026-03-31', OCT1_0030_PL)
		assert.equal(custom.start.toISOString(), '2026-03-01T00:00:00.000Z')
		assert.equal(custom.end.toISOString(), '2026-03-31T23:59:59.999Z')
		// 'custom' bez dat — jak domyślne 30 dni
		const customEmpty = resolveAssistantPresetRange('custom', null, null, OCT1_0030_PL)
		assert.equal(customEmpty.start.toISOString(), '2026-09-01T00:00:00.000Z')
		assert.equal(resolveAssistantPresetRange('all', null, null, OCT1_0030_PL).start.getFullYear(), 2000)
	})
})
