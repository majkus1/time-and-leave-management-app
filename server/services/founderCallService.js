const { firmDb } = require('../db/db')
const FounderCallBooking = require('../models/FounderCallBooking')(firmDb)
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const founderOutreach = require('./founderOutreachService')
const { generateSlots, isValidSlotStart, formatSlotPl, buildIcs, DEFAULTS } = require('../utils/founderCallSlots')
const { publicAppUrl } = require('../config')

/** Konfiguracja z .env (opcjonalna): FOUNDER_CALL_HOURS_FROM/TO, FOUNDER_CALL_STEP_MIN, FOUNDER_CALL_DAYS_AHEAD, FOUNDER_CALL_LEAD_MIN */
function slotOptions() {
	const n = (k, d) => {
		const v = Number(process.env[k])
		return Number.isFinite(v) && v > 0 ? v : d
	}
	return {
		hoursFrom: n('FOUNDER_CALL_HOURS_FROM', DEFAULTS.hoursFrom),
		hoursTo: n('FOUNDER_CALL_HOURS_TO', DEFAULTS.hoursTo),
		stepMin: n('FOUNDER_CALL_STEP_MIN', DEFAULTS.stepMin),
		daysAhead: n('FOUNDER_CALL_DAYS_AHEAD', DEFAULTS.daysAhead),
		leadMinutes: n('FOUNDER_CALL_LEAD_MIN', DEFAULTS.leadMinutes),
	}
}

async function bookedStartsSet(now = new Date()) {
	const rows = await FounderCallBooking.find({ status: 'booked', slotStart: { $gte: now } })
		.select('slotStart')
		.lean()
	return new Set(rows.map(r => new Date(r.slotStart).toISOString()))
}

/** Wolne terminy + ewentualna aktualna rezerwacja pytającego zespołu (żeby strona pokazała „masz już termin”). */
async function getAvailability({ teamId, now = new Date() }) {
	const booked = await bookedStartsSet(now)
	const days = generateSlots({ now, booked, ...slotOptions() })
	const mine = await FounderCallBooking.findOne({ teamId, status: 'booked', slotStart: { $gte: now } })
		.sort({ slotStart: 1 })
		.lean()
	return {
		tz: DEFAULTS.tz,
		stepMin: slotOptions().stepMin,
		days,
		myBooking: mine ? { id: String(mine._id), start: mine.slotStart, end: mine.slotEnd, phone: mine.phone, note: mine.note } : null,
	}
}

/** Dla landingu (formularz kontaktowy): tylko wolne terminy, bez rezerwacji pytającego. */
async function getPublicSlots({ now = new Date() } = {}) {
	const booked = await bookedStartsSet(now)
	return { tz: DEFAULTS.tz, stepMin: slotOptions().stepMin, days: generateSlots({ now, booked, ...slotOptions() }) }
}

function err(code, message) {
	const e = new Error(message)
	e.code = code
	return e
}

/**
 * Rezerwacja: jeden aktywny termin na zespół; slot musi być z siatki i wolny. Wyścig o ten sam slot łapie
 * unikalny indeks (E11000 → SLOT_TAKEN). Maile: do założyciela i potwierdzenie do rezerwującego (z .ics).
 */
async function bookSlot({ teamId, userId, slotStart, phone, note, now = new Date() }) {
	const team = await Team.findById(teamId).select('name adminPhone').lean()
	const user = await User.findById(userId).select('firstName lastName username teamId').lean()
	if (!team || !user || String(user.teamId) !== String(teamId)) throw err('FORBIDDEN', 'Forbidden')

	const existing = await FounderCallBooking.findOne({ teamId, status: 'booked', slotStart: { $gte: now } }).lean()
	if (existing) throw err('ALREADY_BOOKED', 'Team already has an upcoming call')

	const booked = await bookedStartsSet(now)
	if (!isValidSlotStart(slotStart, { now, booked, ...slotOptions() })) throw err('SLOT_TAKEN', 'Slot unavailable')

	const start = new Date(slotStart)
	const end = new Date(start.getTime() + slotOptions().stepMin * 60000)
	const cleanPhone = founderOutreach.normalizePhone(phone) || String(team.adminPhone || '')
	const cleanNote = String(note || '').trim().slice(0, 600)
	const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
	const email = String(user.username || '').trim().toLowerCase()

	let booking
	try {
		booking = await FounderCallBooking.create({
			teamId,
			userId,
			slotStart: start,
			slotEnd: end,
			name,
			email,
			phone: cleanPhone,
			note: cleanNote,
		})
	} catch (e) {
		if (e.code === 11000) throw err('SLOT_TAKEN', 'Slot unavailable')
		throw e
	}

	// Maile nie mogą cofnąć rezerwacji — błędy tylko logujemy.
	sendBookingEmails({ booking, team, name, email }).catch(e => console.error('[founderCall] emails:', e.message))
	return { id: String(booking._id), start, end }
}

async function sendBookingEmails({ booking, team, name, email }) {
	const when = formatSlotPl(booking.slotStart)
	const founderTo = founderOutreach.founderEmail()
	const summary = `Planopia — rozmowa wdrożeniowa: ${team.name}`
	const ics = buildIcs({
		start: booking.slotStart,
		end: booking.slotEnd,
		summary,
		description: `${name} <${email}>${booking.phone ? `, tel. ${booking.phone}` : ''}${booking.note ? `\n${booking.note}` : ''}`,
		uid: `founder-call-${booking._id}@planopia.pl`,
		organizerEmail: founderTo,
	})
	const attachments = [{ filename: 'rozmowa-planopia.ics', content: ics, contentType: 'text/calendar; charset=utf-8; method=PUBLISH' }]

	await founderOutreach.sendFounderMail({
		to: founderTo,
		subject: `[Planopia] Rozmowa ${when} — ${team.name}${booking.phone ? '' : ' (bez numeru)'}`,
		text: [
			`Termin: ${when} (czas polski)`,
			`Zespół: ${team.name}`,
			`Kto: ${name} <${email}>`,
			`Telefon: ${booking.phone || '—'}`,
			booking.note ? `Uwagi: ${booking.note}` : null,
			'',
			`Rezerwacje: ${publicAppUrl}/umow-rozmowe`,
		]
			.filter(Boolean)
			.join('\n'),
		attachments,
	})

	await founderOutreach.sendFounderMail({
		to: email,
		subject: `Termin rozmowy potwierdzony — ${when}`,
		text: [
			name ? `Dzień dobry, ${name.split(' ')[0]}!` : 'Dzień dobry!',
			'',
			`Potwierdzam termin naszej rozmowy: ${when} (czas polski), ok. ${slotOptions().stepMin} minut.`,
			booking.phone ? `Zadzwonię pod numer ${booking.phone}.` : 'Proszę o odpowiedź z numerem telefonu, pod który mam zadzwonić — albo napisać, jeśli wolą Państwo rozmowę wideo.',
			'',
			'Jeśli termin przestanie pasować, wystarczy odpisać na tę wiadomość.',
			'',
			'Pozdrawiam serdecznie,',
			process.env.FOUNDER_NAME || 'Michał Lipka',
			'założyciel Planopii',
		].join('\n'),
		attachments,
		personal: true,
	})
}

async function cancelMyBooking({ teamId, now = new Date() }) {
	const booking = await FounderCallBooking.findOne({ teamId, status: 'booked', slotStart: { $gte: now } })
	if (!booking) return { cancelled: false }
	booking.status = 'cancelled'
	await booking.save()
	founderOutreach
		.sendFounderMail({
			to: founderOutreach.founderEmail(),
			subject: `[Planopia] Odwołana rozmowa ${formatSlotPl(booking.slotStart)} — ${booking.name}`,
			text: `Zespół ${teamId}: ${booking.name} <${booking.email}> odwołał rozmowę ${formatSlotPl(booking.slotStart)}.`,
		})
		.catch(e => console.error('[founderCall] cancel mail:', e.message))
	return { cancelled: true }
}

module.exports = { getAvailability, getPublicSlots, bookSlot, cancelMyBooking, slotOptions }
