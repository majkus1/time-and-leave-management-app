const test = require('node:test')
const assert = require('node:assert/strict')
const { isQrExit, staleEntryExitTime } = require('../utils/qrTimeEntry')

test('wyjście tylko przy działającym liczniku z tego kodu', () => {
	const openEntry = { entryTime: new Date() }
	assert.equal(isQrExit({ openEntry, hasActiveTimerFromThisCode: true }), true)
	// Licznik zatrzymany przyciskiem albo wejście przy ręcznym liczniku — to nowe wejście, nie wyjście
	assert.equal(isQrExit({ openEntry, hasActiveTimerFromThisCode: false }), false)
	assert.equal(isQrExit({ openEntry: null, hasActiveTimerFromThisCode: true }), false)
})

test('pozostawione wejście zamykane końcem jego sesji albo zerowo', () => {
	const entry = new Date('2026-09-27T08:00:00Z')
	const sessions = [
		{ startTime: new Date('2026-09-27T06:00:00Z'), endTime: new Date('2026-09-27T07:00:00Z') },
		{ startTime: new Date('2026-09-27T08:00:00Z'), endTime: new Date('2026-09-27T09:00:00Z') },
	]
	assert.equal(staleEntryExitTime(entry, sessions).toISOString(), '2026-09-27T09:00:00.000Z')
	// Wejście, które nie uruchomiło licznika (skan przy ręcznym liczniku)
	assert.equal(staleEntryExitTime(entry, [sessions[0]]).toISOString(), '2026-09-27T08:00:00.000Z')
	assert.equal(staleEntryExitTime(entry).toISOString(), '2026-09-27T08:00:00.000Z')
})
