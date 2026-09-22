const moment = require('moment-timezone')

/**
 * Wolne terminy rozmowy wdrożeniowej — czysta logika (bez bazy). Sloty w strefie Warszawy: dni robocze,
 * od hoursFrom do hoursTo co stepMin; pomijamy przeszłość + margines (leadMinutes) i zajęte (ISO startów).
 * Zwracamy ISO w UTC — klient formatuje w swojej strefie, a serwer porównuje bez niejasności.
 */
const DEFAULTS = {
	tz: 'Europe/Warsaw',
	hoursFrom: 16,
	hoursTo: 21,
	stepMin: 30,
	daysAhead: 14,
	leadMinutes: 180,
	weekdays: [1, 2, 3, 4, 5],
}

function generateSlots({ now = new Date(), booked = new Set(), ...opts } = {}) {
	const o = { ...DEFAULTS, ...opts }
	const earliest = moment(now).add(o.leadMinutes, 'minutes')
	const days = []
	const start = moment.tz(now, o.tz).startOf('day')
	for (let i = 0; i <= o.daysAhead; i += 1) {
		const day = start.clone().add(i, 'days')
		if (!o.weekdays.includes(day.isoWeekday())) continue
		const slots = []
		for (let m = o.hoursFrom * 60; m + o.stepMin <= o.hoursTo * 60; m += o.stepMin) {
			const s = day.clone().add(m, 'minutes')
			if (s.isBefore(earliest)) continue
			const iso = s.toDate().toISOString()
			if (booked.has(iso)) continue
			slots.push({ start: iso, end: s.clone().add(o.stepMin, 'minutes').toDate().toISOString() })
		}
		if (slots.length) days.push({ date: day.format('YYYY-MM-DD'), slots })
	}
	return days
}

/** Czy podany start to prawidłowy, wolny slot (ta sama siatka, nie przeszłość). */
function isValidSlotStart(iso, { now = new Date(), booked = new Set(), ...opts } = {}) {
	const d = new Date(iso)
	if (Number.isNaN(d.getTime())) return false
	const target = d.toISOString()
	return generateSlots({ now, booked, ...opts }).some(day => day.slots.some(s => s.start === target))
}

function formatSlotPl(iso, tz = DEFAULTS.tz) {
	return moment(iso).tz(tz).locale('pl').format('dddd, D MMMM YYYY, HH:mm')
}

/** Minimalny plik .ics (jedno wydarzenie) — do załącznika w mailu. */
function buildIcs({ start, end, summary, description, uid, organizerEmail }) {
	const fmt = d => moment(d).utc().format('YYYYMMDD[T]HHmmss[Z]')
	const esc = s => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')
	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Planopia//Founder call//PL',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${uid}`,
		`DTSTAMP:${fmt(new Date())}`,
		`DTSTART:${fmt(start)}`,
		`DTEND:${fmt(end)}`,
		`SUMMARY:${esc(summary)}`,
		`DESCRIPTION:${esc(description)}`,
		organizerEmail ? `ORGANIZER:mailto:${organizerEmail}` : null,
		'END:VEVENT',
		'END:VCALENDAR',
	]
		.filter(Boolean)
		.join('\r\n')
}

module.exports = { DEFAULTS, generateSlots, isValidSlotStart, formatSlotPl, buildIcs }
