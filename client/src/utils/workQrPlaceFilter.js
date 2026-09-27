import { roundHours, getDurationMinutes, hoursFromDurationMinutes } from './formatWorkDuration'
import { summarizeQrVerify } from './qrSessionVerify'

/**
 * Filtr ewidencji po miejscu QR (np. „Budowa A”) — raport z jednej budowy.
 * Dzień pracy zawężamy do sesji licznika z wybranych kodów QR: godziny, nadgodziny i zakres „od–do” liczą się tylko
 * z tych sesji. Wpisy ręczne, nieobecność i uwagi nie mają miejsca, więc przy filtrze ich nie pokazujemy.
 * Kalendarz, podsumowanie i eksport czytają zawężone dni tak samo jak zwykłe — jedna reguła dla wszystkich widoków.
 */

const idOf = value => {
	if (!value) return ''
	if (typeof value === 'object') return String(value._id ?? value)
	return String(value)
}

function isWorkSession(entry) {
	if (!entry || entry.isBreak || !entry.startTime || !entry.endTime) return false
	return new Date(entry.endTime) > new Date(entry.startTime)
}

const hhmm = value => {
	const d = new Date(value)
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function sessionMatchesQrPlaces(entry, placeIds = []) {
	return placeIds.includes(idOf(entry?.qrCodeId))
}

/** Dzień zawężony do sesji z wybranych miejsc; null, gdy nie ma w nim takich sesji. Bez filtra — dzień bez zmian. */
export function restrictWorkdayToQrPlaces(workday, placeIds = []) {
	if (!placeIds.length) return workday
	const sessions = (Array.isArray(workday?.timeEntries) ? workday.timeEntries : [])
		.filter(entry => isWorkSession(entry) && sessionMatchesQrPlaces(entry, placeIds))
	if (!sessions.length) return null
	const hours = sessions.reduce((sum, entry) => sum + hoursFromDurationMinutes(getDurationMinutes(entry.startTime, entry.endTime)), 0)
	const overtimeHours = sessions.reduce((sum, entry) => sum + (Number(entry.overtimeTime) || 0), 0) / 3600
	return {
		...workday,
		hoursWorked: roundHours(hours),
		additionalWorked: overtimeHours > 0 ? roundHours(overtimeHours) : 0,
		realTimeDayWorked: [...new Set(sessions.map(entry => `${hhmm(entry.startTime)}-${hhmm(entry.endTime)}`))].join(', '),
		absenceType: null,
		notes: '',
		manualActivityBlocks: [],
		manualTaskBlocks: [],
		timeEntries: sessions,
	}
}

export function restrictWorkdaysToQrPlaces(workdays = [], placeIds = []) {
	if (!placeIds.length) return workdays
	return workdays.map(day => restrictWorkdayToQrPlaces(day, placeIds)).filter(Boolean)
}

/** Miejsca QR występujące w sesjach (odpowiedź /timer/sessions: grouped[].sessions[].qrCode.name) → [[id, nazwa]] */
export function collectQrPlacesFromGrouped(grouped = [], locale = 'pl') {
	const places = new Map()
	for (const group of grouped || []) {
		for (const session of group?.sessions || []) {
			const id = idOf(session?.qrCodeId)
			if (id && session?.qrCode?.name) places.set(id, session.qrCode.name)
		}
	}
	return [...places.entries()].sort((a, b) => a[1].localeCompare(b[1], locale))
}

/** Miejsca dnia do wpisu kalendarza, np. „Budowa A, Biuro”; ⚠ gdy któryś skan był nietypowy (poza miejscem, z wydruku) */
export function workdayQrPlaceLabel(workday, namesById) {
	const names = []
	let unusual = false
	for (const entry of Array.isArray(workday?.timeEntries) ? workday.timeEntries : []) {
		const id = idOf(entry?.qrCodeId)
		if (!id) continue
		const name = namesById?.get?.(id)
		if (name && !names.includes(name)) names.push(name)
		if (summarizeQrVerify(entry.qrVerify)?.unusual) unusual = true
	}
	if (!names.length) return ''
	return `${unusual ? '⚠ ' : ''}${names.join(', ')}`
}
