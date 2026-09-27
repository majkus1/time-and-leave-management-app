/**
 * Lokalizacja przy skanie QR — czyste funkcje (bez bazy, reguła 9). Jeden odczyt przy wejściu/wyjściu, bez śledzenia.
 * Zapisujemy wynik (status, odległość, dokładność), nie współrzędne pracownika — tyle wystarcza do oceny, a mniej danych
 * osobowych do przechowywania.
 *
 * Polityka kodu: 'off' (domyślnie) | 'record' (tylko zapis) | 'flag' (wpis przechodzi, nietypowy jest oznaczony)
 * | 'block' (przechodzi tylko skan w zasięgu).
 */

const GEO_POLICIES = ['off', 'record', 'flag', 'block']
const RADIUS_MIN_M = 30
const RADIUS_MAX_M = 2000
const RADIUS_DEFAULT_M = 150
/** Dokładność przy ustawianiu pozycji miejsca, powyżej której ostrzegamy Admina (np. telefon w budynku) */
const SITE_ACCURACY_WARN_M = 100

const EARTH_RADIUS_M = 6371000

function normalizeGeoPolicy(value) {
	return GEO_POLICIES.includes(value) ? value : 'off'
}

function clampRadius(value) {
	const n = Number(value)
	if (!Number.isFinite(n)) return RADIUS_DEFAULT_M
	return Math.round(Math.min(RADIUS_MAX_M, Math.max(RADIUS_MIN_M, n)))
}

function isValidLatLng(lat, lng) {
	return (
		typeof lat === 'number' && typeof lng === 'number' &&
		Number.isFinite(lat) && Number.isFinite(lng) &&
		lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
	)
}

function haversineMeters(a, b) {
	const toRad = d => (d * Math.PI) / 180
	const dLat = toRad(b.lat - a.lat)
	const dLng = toRad(b.lng - a.lng)
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
	return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Czy kod ma ustawioną pozycję miejsca */
function hasSite(geo) {
	return Boolean(geo && isValidLatLng(geo.lat, geo.lng))
}

/**
 * Odczyt z przeglądarki → postać znormalizowana. Wejście z żądania: { lat, lng, accuracy } albo { error: 'denied'|'unavailable' }.
 * @returns {{ kind: 'position', lat: number, lng: number, accuracyM: number } | { kind: 'denied' } | { kind: 'unavailable' } | null}
 */
function parseGeoReading(input) {
	if (!input || typeof input !== 'object') return null
	if (input.error === 'denied') return { kind: 'denied' }
	if (input.error === 'unavailable') return { kind: 'unavailable' }
	const lat = Number(input.lat)
	const lng = Number(input.lng)
	if (!isValidLatLng(lat, lng)) return null
	const acc = Number(input.accuracy)
	// Brak/nonsensowna dokładność = traktuj jak słabą (nie jak idealną)
	const accuracyM = Number.isFinite(acc) && acc > 0 ? Math.min(acc, 100000) : 1000
	return { kind: 'position', lat, lng, accuracyM }
}

/**
 * Ocena skanu względem polityki kodu.
 * Tolerancja: odczyt jest „w zasięgu”, gdy odległość ≤ promień + min(dokładność, promień) — słaby sygnał w budynku
 * nie blokuje, a bardzo niedokładny odczyt nie „przyciąga” kogoś z drugiego końca miasta.
 * @returns {{ check: boolean, allowed: boolean, flagged: boolean, status: string|null, distanceM: number|null, accuracyM: number|null, reason?: string }}
 */
function evaluateGeo({ policy, site, reading }) {
	const p = normalizeGeoPolicy(policy)
	if (p === 'off') return { check: false, allowed: true, flagged: false, status: null, distanceM: null, accuracyM: null }
	// Admin nie ustawił pozycji — nie blokujemy pracowników przez brak konfiguracji
	if (!hasSite(site)) return { check: true, allowed: true, flagged: false, status: 'not_configured', distanceM: null, accuracyM: null }

	let status
	let distanceM = null
	let accuracyM = null
	if (!reading) status = 'missing'
	else if (reading.kind === 'denied') status = 'denied'
	else if (reading.kind === 'unavailable') status = 'unavailable'
	else {
		const radius = clampRadius(site.radiusM)
		const d = haversineMeters({ lat: site.lat, lng: site.lng }, reading)
		distanceM = Math.round(d)
		accuracyM = Math.round(reading.accuracyM)
		status = d <= radius + Math.min(reading.accuracyM, radius) ? 'inside' : 'outside'
	}

	const inside = status === 'inside'
	const allowed = p !== 'block' || inside
	return {
		check: true,
		allowed,
		flagged: (p === 'flag' || p === 'block') && !inside,
		status,
		distanceM,
		accuracyM,
		...(allowed ? {} : { reason: `GEO_${status.toUpperCase()}` }),
	}
}

/**
 * Czy licznik uruchomiony tym kodem wolno zakończyć tylko skanem (nie przyciskiem „Stop”).
 * Dotyczy kodów chronionych: ekran albo lokalizacja; zwykły wydruk zachowuje dotychczasowe zachowanie.
 */
function requiresQrExitScan(qr) {
	if (!qr) return false
	const mode = qr.mode === 'screen' || qr.mode === 'screen_or_print' ? qr.mode : 'print'
	return mode !== 'print' || normalizeGeoPolicy(qr.geo?.policy) !== 'off'
}

/** Wpis do TimeEntry (entryGeo/exitGeo) — bez współrzędnych pracownika */
function toStoredGeo(result, policy) {
	if (!result?.check) return null
	return {
		policy: normalizeGeoPolicy(policy),
		status: result.status,
		distanceM: result.distanceM,
		accuracyM: result.accuracyM,
		flagged: Boolean(result.flagged),
	}
}

module.exports = {
	GEO_POLICIES,
	RADIUS_MIN_M,
	RADIUS_MAX_M,
	RADIUS_DEFAULT_M,
	SITE_ACCURACY_WARN_M,
	normalizeGeoPolicy,
	clampRadius,
	isValidLatLng,
	haversineMeters,
	hasSite,
	parseGeoReading,
	evaluateGeo,
	toStoredGeo,
	requiresQrExitScan,
}
