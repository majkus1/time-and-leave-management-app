/**
 * Jednorazowy odczyt pozycji (skan QR, ustawienie pozycji miejsca). Bez śledzenia — jeden odczyt, maximumAge 0,
 * żeby nie wziąć pozycji z pamięci podręcznej przeglądarki (np. sprzed godziny z domu).
 * Zwraca { lat, lng, accuracy } albo { error: 'denied' | 'unavailable' } — kształt, który przyjmuje serwer.
 */
export function getScanPosition({ timeoutMs = 15000 } = {}) {
	return new Promise(resolve => {
		if (typeof navigator === 'undefined' || !navigator.geolocation) {
			resolve({ error: 'unavailable' })
			return
		}
		navigator.geolocation.getCurrentPosition(
			pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
			err => resolve({ error: err?.code === 1 ? 'denied' : 'unavailable' }),
			{ enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
		)
	})
}

/** Odległość do wyświetlenia: 850 m / 1,2 km */
export function formatDistance(meters, locale = 'pl') {
	if (typeof meters !== 'number' || !Number.isFinite(meters)) return ''
	if (meters < 1000) return `${Math.round(meters)} m`
	return `${(meters / 1000).toLocaleString(locale === 'pl' ? 'pl-PL' : 'en-GB', { maximumFractionDigits: 1 })} km`
}
