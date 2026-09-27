const test = require('node:test')
const assert = require('node:assert/strict')
const {
	haversineMeters,
	parseGeoReading,
	evaluateGeo,
	toStoredGeo,
	clampRadius,
	normalizeGeoPolicy,
} = require('../utils/qrGeoCheck')

// Pałac Kultury w Warszawie jako „miejsce”; punkty kontrolne policzone niezależnie
const SITE = { lat: 52.231667, lng: 21.006389, radiusM: 150 }
const at = (dLatM, accuracy = 20) => ({ lat: SITE.lat + dLatM / 111320, lng: SITE.lng, accuracy })

test('haversine: ~1 km na północ', () => {
	const d = haversineMeters(SITE, { lat: SITE.lat + 1000 / 111320, lng: SITE.lng })
	assert.ok(Math.abs(d - 1000) < 5, `d=${d}`)
	// Warszawa → Kraków ok. 252 km
	const krakow = haversineMeters(SITE, { lat: 50.061389, lng: 19.938333 })
	assert.ok(krakow > 245000 && krakow < 260000, `krakow=${krakow}`)
})

test('parseGeoReading: pozycja, odmowa, brak sygnału, śmieci', () => {
	assert.deepEqual(parseGeoReading({ error: 'denied' }), { kind: 'denied' })
	assert.deepEqual(parseGeoReading({ error: 'unavailable' }), { kind: 'unavailable' })
	assert.equal(parseGeoReading(null), null)
	assert.equal(parseGeoReading({ lat: 'x', lng: 1 }), null)
	assert.equal(parseGeoReading({ lat: 91, lng: 1 }), null)
	const r = parseGeoReading({ lat: '52.1', lng: '21.0', accuracy: 12 })
	assert.equal(r.kind, 'position')
	assert.equal(r.accuracyM, 12)
	// Brak dokładności nie może udawać idealnej
	assert.equal(parseGeoReading({ lat: 52, lng: 21 }).accuracyM, 1000)
})

test('polityka off: nic nie sprawdzamy', () => {
	const r = evaluateGeo({ policy: 'off', site: SITE, reading: null })
	assert.equal(r.check, false)
	assert.equal(r.allowed, true)
	assert.equal(toStoredGeo(r, 'off'), null)
	assert.equal(normalizeGeoPolicy('cokolwiek'), 'off')
})

test('brak pozycji miejsca: nie blokujemy (not_configured)', () => {
	const r = evaluateGeo({ policy: 'block', site: { radiusM: 150 }, reading: parseGeoReading(at(5000)) })
	assert.equal(r.allowed, true)
	assert.equal(r.status, 'not_configured')
})

test('block: w zasięgu przechodzi, poza/odmowa/brak odczytu blokują', () => {
	const inside = evaluateGeo({ policy: 'block', site: SITE, reading: parseGeoReading(at(100)) })
	assert.equal(inside.status, 'inside')
	assert.equal(inside.allowed, true)
	assert.equal(inside.flagged, false)

	const outside = evaluateGeo({ policy: 'block', site: SITE, reading: parseGeoReading(at(1200)) })
	assert.equal(outside.status, 'outside')
	assert.equal(outside.allowed, false)
	assert.equal(outside.reason, 'GEO_OUTSIDE')
	assert.ok(Math.abs(outside.distanceM - 1200) < 5)

	assert.equal(evaluateGeo({ policy: 'block', site: SITE, reading: { kind: 'denied' } }).reason, 'GEO_DENIED')
	assert.equal(evaluateGeo({ policy: 'block', site: SITE, reading: { kind: 'unavailable' } }).reason, 'GEO_UNAVAILABLE')
	// Stary klient / obejście: brak odczytu w ogóle
	assert.equal(evaluateGeo({ policy: 'block', site: SITE, reading: null }).reason, 'GEO_MISSING')
})

test('tolerancja dokładności: najwyżej o jeden promień', () => {
	// 250 m od miejsca, promień 150, dokładność 120 → 250 ≤ 150+120 → w zasięgu
	assert.equal(evaluateGeo({ policy: 'block', site: SITE, reading: parseGeoReading(at(250, 120)) }).status, 'inside')
	// 400 m, dokładność 3 km → tolerancja przycięta do 150 → 400 > 300 → poza
	assert.equal(evaluateGeo({ policy: 'block', site: SITE, reading: parseGeoReading(at(400, 3000)) }).status, 'outside')
})

test('flag i record: nigdy nie blokują; flag oznacza nietypowe', () => {
	const flagOut = evaluateGeo({ policy: 'flag', site: SITE, reading: parseGeoReading(at(2000)) })
	assert.equal(flagOut.allowed, true)
	assert.equal(flagOut.flagged, true)
	const recOut = evaluateGeo({ policy: 'record', site: SITE, reading: { kind: 'denied' } })
	assert.equal(recOut.allowed, true)
	assert.equal(recOut.flagged, false)
	assert.equal(recOut.status, 'denied')
	const stored = toStoredGeo(flagOut, 'flag')
	assert.deepEqual(Object.keys(stored).sort(), ['accuracyM', 'distanceM', 'flagged', 'policy', 'status'])
	assert.ok(!('lat' in stored) && !('lng' in stored))
})

test('clampRadius', () => {
	assert.equal(clampRadius(5), 30)
	assert.equal(clampRadius(99999), 2000)
	assert.equal(clampRadius('abc'), 150)
	assert.equal(clampRadius(200.4), 200)
})
