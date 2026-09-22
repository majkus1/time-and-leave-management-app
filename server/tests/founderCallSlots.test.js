const test = require('node:test')
const assert = require('node:assert/strict')
const moment = require('moment-timezone')
const { generateSlots, isValidSlotStart, buildIcs } = require('../utils/founderCallSlots')

const TZ = 'Europe/Warsaw'
// środa 10.06.2026 10:00 czasu polskiego
const NOW = moment.tz('2026-06-10 10:00', 'YYYY-MM-DD HH:mm', TZ).toDate()

test('sloty: dni robocze 16:00–21:00 co 30 min w strefie Warszawy, bez weekendów', () => {
	const days = generateSlots({ now: NOW, daysAhead: 6 })
	assert.deepEqual(
		days.map(d => d.date),
		['2026-06-10', '2026-06-11', '2026-06-12', '2026-06-15', '2026-06-16']
	)
	const first = days[0]
	assert.equal(first.slots.length, 10) // 16:00 … 20:30
	assert.equal(moment(first.slots[0].start).tz(TZ).format('HH:mm'), '16:00')
	assert.equal(moment(first.slots.at(-1).start).tz(TZ).format('HH:mm'), '20:30')
	assert.equal(moment(first.slots.at(-1).end).tz(TZ).format('HH:mm'), '21:00')
})

test('sloty: margines czasowy i zajęte terminy są pomijane', () => {
	const lateNow = moment.tz('2026-06-10 15:00', 'YYYY-MM-DD HH:mm', TZ).toDate()
	const today = generateSlots({ now: lateNow, daysAhead: 0 })[0]
	// 15:00 + 180 min = 18:00 → pierwszy dostępny 18:00
	assert.equal(moment(today.slots[0].start).tz(TZ).format('HH:mm'), '18:00')

	const taken = moment.tz('2026-06-10 18:30', 'YYYY-MM-DD HH:mm', TZ).toDate().toISOString()
	const withBooked = generateSlots({ now: lateNow, daysAhead: 0, booked: new Set([taken]) })[0]
	assert.ok(!withBooked.slots.some(s => s.start === taken))
	assert.equal(withBooked.slots.length, today.slots.length - 1)
})

test('isValidSlotStart: tylko sloty z siatki, wolne i w przyszłości', () => {
	const ok = moment.tz('2026-06-11 17:00', 'YYYY-MM-DD HH:mm', TZ).toDate().toISOString()
	const offGrid = moment.tz('2026-06-11 17:10', 'YYYY-MM-DD HH:mm', TZ).toDate().toISOString()
	const weekend = moment.tz('2026-06-13 17:00', 'YYYY-MM-DD HH:mm', TZ).toDate().toISOString()
	const past = moment.tz('2026-06-09 17:00', 'YYYY-MM-DD HH:mm', TZ).toDate().toISOString()
	assert.equal(isValidSlotStart(ok, { now: NOW }), true)
	assert.equal(isValidSlotStart(offGrid, { now: NOW }), false)
	assert.equal(isValidSlotStart(weekend, { now: NOW }), false)
	assert.equal(isValidSlotStart(past, { now: NOW }), false)
	assert.equal(isValidSlotStart(ok, { now: NOW, booked: new Set([ok]) }), false)
	assert.equal(isValidSlotStart('nie-data', { now: NOW }), false)
})

test('buildIcs: poprawne daty UTC i escapowanie', () => {
	const ics = buildIcs({
		start: '2026-06-11T15:00:00.000Z',
		end: '2026-06-11T15:30:00.000Z',
		summary: 'Rozmowa, test; x',
		description: 'linia1\nlinia2',
		uid: 'u1@planopia.pl',
		organizerEmail: 'a@b.pl',
	})
	assert.match(ics, /DTSTART:20260611T150000Z/)
	assert.match(ics, /DTEND:20260611T153000Z/)
	assert.match(ics, /SUMMARY:Rozmowa\\, test\\; x/)
	assert.match(ics, /DESCRIPTION:linia1\\nlinia2/)
	assert.match(ics, /ORGANIZER:mailto:a@b.pl/)
})
