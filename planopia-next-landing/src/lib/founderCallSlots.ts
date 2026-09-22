/**
 * Terminy rozmowy wdrożeniowej na landingu — bliźniak server/utils/founderCallSlots.js (świadomie, jak inne pary
 * server/landing). Normalnie sloty przychodzą z backendu (zajęte ukryte); ta wersja to zapas, gdy backend nie odpowie.
 * Siatka: dni robocze, 16:00–21:00 czasu polskiego co 30 min, 14 dni do przodu, minimum 3 h wyprzedzenia.
 */
export type Slot = { start: string; end: string }
export type SlotDay = { date: string; slots: Slot[] }
export type SlotsPayload = { tz: string; stepMin: number; days: SlotDay[] }

export const SLOT_DEFAULTS = { tz: 'Europe/Warsaw', hoursFrom: 16, hoursTo: 21, stepMin: 30, daysAhead: 14, leadMinutes: 180 }

/** Przesunięcie strefy (min) dla danej chwili — bez zewnętrznych bibliotek. */
function tzOffsetMinutes(date: Date, tz: string): number {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hourCycle: 'h23',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	}).formatToParts(date)
	const get = (t: string) => Number(parts.find(p => p.type === t)?.value)
	const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
	return Math.round((asUtc - date.getTime()) / 60000)
}

/** Chwila „YYYY-MM-DD HH:mm” w strefie tz → Date (UTC). */
function zonedToDate(ymd: string, hour: number, minute: number, tz: string): Date {
	const [y, m, d] = ymd.split('-').map(Number)
	const guess = new Date(Date.UTC(y, m - 1, d, hour, minute))
	const offset = tzOffsetMinutes(guess, tz)
	const first = new Date(guess.getTime() - offset * 60000)
	// druga iteracja łapie zmianę czasu w okolicy przejścia
	const offset2 = tzOffsetMinutes(first, tz)
	return offset2 === offset ? first : new Date(guess.getTime() - offset2 * 60000)
}

function ymdInTz(date: Date, tz: string): string {
	const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date)
	const get = (t: string) => parts.find(p => p.type === t)?.value
	return `${get('year')}-${get('month')}-${get('day')}`
}

function weekdayInTz(date: Date, tz: string): number {
	const wd = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' }).format(date)
	return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(wd)
}

export function generateFallbackSlots(now = new Date()): SlotsPayload {
	const o = SLOT_DEFAULTS
	const earliest = now.getTime() + o.leadMinutes * 60000
	const days: SlotDay[] = []
	for (let i = 0; i <= o.daysAhead; i += 1) {
		const probe = new Date(now.getTime() + i * 86400000)
		const wd = weekdayInTz(probe, o.tz)
		if (wd === 0 || wd === 6) continue
		const ymd = ymdInTz(probe, o.tz)
		const slots: Slot[] = []
		for (let m = o.hoursFrom * 60; m + o.stepMin <= o.hoursTo * 60; m += o.stepMin) {
			const start = zonedToDate(ymd, Math.floor(m / 60), m % 60, o.tz)
			if (start.getTime() < earliest) continue
			slots.push({ start: start.toISOString(), end: new Date(start.getTime() + o.stepMin * 60000).toISOString() })
		}
		if (slots.length) days.push({ date: ymd, slots })
	}
	return { tz: o.tz, stepMin: o.stepMin, days }
}
