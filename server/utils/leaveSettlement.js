/**
 * Jednostka rozliczenia urlopu (dni / godziny) — wspólna logika dla całego backendu.
 *
 * Lustrzana kopia: client/src/utils/leaveSettlement.js (to samo API, ta sama semantyka).
 * Przed rozjechaniem się chroni ta sama tablica fixture'ów w obu plikach testowych
 * (server/tests/leaveSettlement.test.js i client/src/utils/leaveSettlement.test.js).
 *
 * DWA POJĘCIA, KTÓRYCH NIE WOLNO SKLEJAĆ:
 *
 *   unit        — w czym WYŚWIETLAMY ilość ('days' | 'hours')
 *   captureMode — jak wniosek jest WPISYWANY I ZAPISYWANY ('dayRange' | 'hourly')
 *
 * Typ z settlementUnit === 'inherit' w zespole z globalnym leaveCalculationMode === 'hours'
 * ma unit === 'hours', ale captureMode === 'dayRange' — czyli zakres dat, zapis w dniach
 * i wyświetlanie dni × hoursPerDay, dokładnie tak jak przed wprowadzeniem tej funkcji.
 * Tryb godzinowy włącza WYŁĄCZNIE jawne settlementUnit === 'hours'. To jest cała gwarancja
 * braku regresji dla istniejących zespołów.
 *
 * DYSKRYMINATOR W RUNTIME to hoursRequested > 0, nigdy wartość domyślna ze schematu:
 * wnioski są czytane przez .lean() w kilkunastu miejscach, a .lean() omija defaulty
 * Mongoose, więc stare rekordy wracają całkiem bez tych pól.
 */

const DEFAULT_HOURS_PER_DAY = 8
const HOURLY_STEP = 0.5

/** Fragment zapytania Mongo: tylko wnioski, które blokują cały dzień pracy. */
const NON_HOURLY_LEAVE_QUERY = {
	$or: [
		{ hoursRequested: { $exists: false } },
		{ hoursRequested: null },
		{ hoursRequested: { $lte: 0 } },
	],
}

function normalizeHoursPerDay(value) {
	const parsed = Number(value)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_HOURS_PER_DAY
}

/** Zaokrąglenie do 2 miejsc — chroni przed śmieciem zmiennoprzecinkowym (np. 0.5 * 7.5). */
function roundQuantity(value) {
	const parsed = Number(value)
	if (!Number.isFinite(parsed)) return 0
	return Math.round(parsed * 100) / 100
}

function findLeaveTypeConfig(settings, typeId) {
	const types = Array.isArray(settings?.leaveRequestTypes) ? settings.leaveRequestTypes : []
	return types.find(type => type?.id === typeId) || null
}

/**
 * @returns {{unit: 'days'|'hours', hoursPerDay: Number, captureMode: 'dayRange'|'hourly', typeConfig: Object|null}}
 */
function resolveLeaveTypeSettlement(settings, typeId) {
	const typeConfig = findLeaveTypeConfig(settings, typeId)
	const hoursPerDay = normalizeHoursPerDay(settings?.leaveHoursPerDay)
	const configured = typeConfig?.settlementUnit

	if (configured === 'hours') {
		return { unit: 'hours', hoursPerDay, captureMode: 'hourly', typeConfig }
	}
	if (configured === 'days') {
		return { unit: 'days', hoursPerDay, captureMode: 'dayRange', typeConfig }
	}

	// 'inherit', brak pola, wartość spoza enuma — dziedziczymy ustawienie zespołu.
	// captureMode zostaje 'dayRange': dziedziczenie nigdy nie zmienia sposobu wpisu.
	const inheritedUnit = settings?.leaveCalculationMode === 'hours' ? 'hours' : 'days'
	return { unit: inheritedUnit, hoursPerDay, captureMode: 'dayRange', typeConfig }
}

/** Czy ten typ wniosku jest składany jako „jeden dzień + liczba godzin". */
function isHourlyCaptureType(settings, typeId) {
	return resolveLeaveTypeSettlement(settings, typeId).captureMode === 'hourly'
}

/** Czy ten konkretny (już zapisany) wniosek jest wnioskiem godzinowym. */
function isHourlyLeaveRequest(request) {
	const hours = Number(request?.hoursRequested)
	if (Number.isFinite(hours) && hours > 0) return true
	return request?.settlementUnit === 'hours'
}

/** Czy wniosek blokuje cały dzień pracy (timer, wpis godzin, grafik). */
function isBlockingLeaveRequest(request) {
	return !isHourlyLeaveRequest(request)
}

function requestDays(request) {
	const parsed = Number(request?.daysRequested)
	return Number.isFinite(parsed) ? parsed : 0
}

function requestHours(request) {
	const parsed = Number(request?.hoursRequested)
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

/** Liczba godzin w dniu, wg której wniosek został zapisany (snapshot ma pierwszeństwo). */
function requestHoursPerDay(request, fallbackHoursPerDay) {
	const snapshot = Number(request?.hoursPerDaySnapshot)
	if (Number.isFinite(snapshot) && snapshot > 0) return snapshot
	return normalizeHoursPerDay(fallbackHoursPerDay)
}

/**
 * Ilość wniosku w jednostce, w której należy go POKAZAĆ.
 * @returns {{unit: 'days'|'hours', value: Number, isHourly: Boolean}}
 */
function getLeaveRequestQuantity(request, settings) {
	const settlement = resolveLeaveTypeSettlement(settings, request?.type)

	if (isHourlyLeaveRequest(request)) {
		return { unit: 'hours', value: roundQuantity(requestHours(request)), isHourly: true }
	}
	if (settlement.unit === 'hours') {
		return {
			unit: 'hours',
			value: roundQuantity(requestDays(request) * settlement.hoursPerDay),
			isHourly: false,
		}
	}
	return { unit: 'days', value: requestDays(request), isHourly: false }
}

/**
 * Ilość wniosku przeliczona na wskazaną jednostkę — używane przez agregaty i limity,
 * żeby historyczne rekordy w innej jednostce nigdy nie mieszały się z aktualnymi.
 *
 * @param {Number|null} dayCountInPeriod - liczba dni roboczych wniosku mieszczących się
 *   w rozpatrywanym okresie; null/undefined = bez filtrowania po okresie.
 */
function getLeaveRequestAmountInUnit(request, targetUnit, hoursPerDay, dayCountInPeriod = null) {
	const hasPeriodFilter = dayCountInPeriod !== null && dayCountInPeriod !== undefined
	const daysInPeriod = hasPeriodFilter ? Number(dayCountInPeriod) || 0 : requestDays(request)

	if (isHourlyLeaveRequest(request)) {
		// Wniosek godzinowy dotyczy jednego dnia — albo mieści się w okresie, albo nie.
		if (hasPeriodFilter && daysInPeriod <= 0) return 0
		const hours = requestHours(request)
		if (targetUnit === 'hours') return roundQuantity(hours)
		return roundQuantity(hours / requestHoursPerDay(request, hoursPerDay))
	}

	if (targetUnit === 'hours') {
		return roundQuantity(daysInPeriod * normalizeHoursPerDay(hoursPerDay))
	}
	return roundQuantity(daysInPeriod)
}

function convertLeaveAmount(amount, fromUnit, toUnit, hoursPerDay) {
	const value = Number(amount)
	if (!Number.isFinite(value)) return 0
	if (fromUnit === toUnit) return roundQuantity(value)
	const perDay = normalizeHoursPerDay(hoursPerDay)
	return roundQuantity(toUnit === 'hours' ? value * perDay : value / perDay)
}

/**
 * Sformatowana liczba — zachowuje dotychczasowy sposób zapisu:
 * godziny z jednym miejscem po przecinku, dni surowo.
 */
function formatLeaveQuantityValue(request, settings) {
	const quantity = getLeaveRequestQuantity(request, settings)
	return quantity.unit === 'hours' ? quantity.value.toFixed(1) : String(quantity.value)
}

function pickUnitLabel(unit, labels = {}) {
	if (unit === 'hours') return labels.hours || 'Godziny'
	return labels.days || 'Dni'
}

/** Etykieta jednostki dla typu wniosku (nagłówek kolumny / pola formularza). */
function getLeaveQuantityLabel(settings, typeId, labels = {}) {
	return pickUnitLabel(resolveLeaveTypeSettlement(settings, typeId).unit, labels)
}

/** Etykieta jednostki dla konkretnego wniosku (uwzględnia snapshot rekordu). */
function getLeaveRequestQuantityLabel(request, settings, labels = {}) {
	return pickUnitLabel(getLeaveRequestQuantity(request, settings).unit, labels)
}

/** '4.0 Godziny' | '3 Dni' */
function formatLeaveQuantity(request, settings, labels = {}) {
	const quantity = getLeaveRequestQuantity(request, settings)
	const value = quantity.unit === 'hours' ? quantity.value.toFixed(1) : String(quantity.value)
	return `${value} ${pickUnitLabel(quantity.unit, labels)}`
}

/**
 * Walidacja wniosku godzinowego — funkcja czysta, bez dostępu do bazy.
 *
 * @param {String} startYmd - data początkowa jako 'YYYY-MM-DD' (nigdy obiekt Date)
 * @param {String} endYmd   - data końcowa jako 'YYYY-MM-DD'
 * @param {Number} alreadyBookedHoursOnDay - suma godzin już zarezerwowanych tego dnia
 * @returns {{ok: true, hours: Number, hoursPerDay: Number}|{ok: false, code: String}}
 */
function validateHourlyLeaveSubmission({
	settings,
	typeId,
	startYmd,
	endYmd,
	hoursRequested,
	alreadyBookedHoursOnDay = 0,
}) {
	const { hoursPerDay } = resolveLeaveTypeSettlement(settings, typeId)

	if (!startYmd || !endYmd || String(startYmd) !== String(endYmd)) {
		return { ok: false, code: 'HOURLY_SINGLE_DAY_ONLY' }
	}

	const hours = Number(hoursRequested)
	if (!Number.isFinite(hours) || hours <= 0) {
		return { ok: false, code: 'HOURLY_HOURS_REQUIRED' }
	}
	if (hours > hoursPerDay) {
		return { ok: false, code: 'HOURLY_HOURS_RANGE' }
	}
	if (Math.abs(hours / HOURLY_STEP - Math.round(hours / HOURLY_STEP)) > 1e-9) {
		return { ok: false, code: 'HOURLY_HOURS_STEP' }
	}

	const booked = Number(alreadyBookedHoursOnDay)
	const alreadyBooked = Number.isFinite(booked) && booked > 0 ? booked : 0
	if (roundQuantity(alreadyBooked + hours) > hoursPerDay) {
		return { ok: false, code: 'HOURLY_DAY_CAP_EXCEEDED' }
	}

	return { ok: true, hours: roundQuantity(hours), hoursPerDay }
}

module.exports = {
	DEFAULT_HOURS_PER_DAY,
	HOURLY_STEP,
	NON_HOURLY_LEAVE_QUERY,
	normalizeHoursPerDay,
	roundQuantity,
	resolveLeaveTypeSettlement,
	isHourlyCaptureType,
	isHourlyLeaveRequest,
	isBlockingLeaveRequest,
	getLeaveRequestQuantity,
	getLeaveRequestAmountInUnit,
	convertLeaveAmount,
	formatLeaveQuantityValue,
	getLeaveQuantityLabel,
	getLeaveRequestQuantityLabel,
	formatLeaveQuantity,
	validateHourlyLeaveSubmission,
}
