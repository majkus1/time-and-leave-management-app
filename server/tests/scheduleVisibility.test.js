const test = require('node:test')
const assert = require('node:assert')

const { isScheduleEntryVisible, collectVisibleScheduleEntries } = require('../utils/scheduleVisibility')

const wpis = (overrides = {}) => ({
	_id: 'e1',
	employeeId: 'u1',
	employeeName: 'Jan Kowalski',
	timeFrom: '08:00',
	timeTo: '16:00',
	isPublished: true,
	...overrides,
})

const grafik = (overrides = {}) => ({
	_id: 's1',
	name: 'Grafik IT',
	days: [{ date: '2026-08-20T00:00:00.000Z', entries: [wpis()] }],
	...overrides,
})

const ZAKRES = { fromDate: new Date('2026-08-01'), toDate: new Date('2026-08-31T23:59:59.999Z') }

const zbierz = (schedules, options = {}) =>
	collectVisibleScheduleEntries(schedules, {
		...ZAKRES,
		employeeIds: new Set(['u1']),
		...options,
	})

// ── bramka publikacji ───────────────────────────────────────────────────────

test('opublikowany wpis widzi pracownik', () => {
	assert.strictEqual(isScheduleEntryVisible(wpis(), { employeeIds: new Set(['u1']) }), true)
})

test('szkicu nie widzi ktoś, kto nie zarządza grafikiem', () => {
	const entry = wpis({ isPublished: false })
	assert.strictEqual(isScheduleEntryVisible(entry, { employeeIds: new Set(['u1']) }), false)
})

test('szkic widzi zarządzający grafikiem', () => {
	const entry = wpis({ isPublished: false })
	assert.strictEqual(
		isScheduleEntryVisible(entry, { employeeIds: new Set(['u1']), canManageDrafts: true }),
		true
	)
})

test('brak pola isPublished traktujemy jak wpis opublikowany', () => {
	const { isPublished, ...bezPola } = wpis()
	assert.strictEqual(isScheduleEntryVisible(bezPola, { employeeIds: new Set(['u1']) }), true)
})

test('cudzego wpisu nie widać, nawet opublikowanego', () => {
	assert.strictEqual(isScheduleEntryVisible(wpis({ employeeId: 'u2' }), { employeeIds: new Set(['u1']) }), false)
})

// ── zbieranie z grafików ────────────────────────────────────────────────────

test('pracownik dostaje swój opublikowany wpis', () => {
	const wynik = zbierz([grafik()])
	assert.strictEqual(wynik.length, 1)
	assert.strictEqual(wynik[0].date, '2026-08-20')
	assert.strictEqual(wynik[0].timeFrom, '08:00')
})

test('szkic nie trafia do pracownika, który nie zarządza grafikiem', () => {
	const wynik = zbierz([grafik({ days: [{ date: '2026-08-20', entries: [wpis({ isPublished: false })] }] })])
	assert.deepStrictEqual(wynik, [])
})

test('szkic trafia do zarządzającego tym grafikiem', () => {
	const wynik = zbierz([grafik({ days: [{ date: '2026-08-20', entries: [wpis({ isPublished: false })] }] })], {
		manageableScheduleIds: new Set(['s1']),
	})
	assert.strictEqual(wynik.length, 1)
	assert.strictEqual(wynik[0].isPublished, false)
})

test('uprawnienie do jednego grafiku nie odsłania szkiców w innym', () => {
	const wynik = zbierz(
		[
			grafik({ _id: 's1', days: [{ date: '2026-08-20', entries: [wpis({ isPublished: false })] }] }),
			grafik({ _id: 's2', name: 'Grafik HR', days: [{ date: '2026-08-21', entries: [wpis({ _id: 'e2', isPublished: false })] }] }),
		],
		{ manageableScheduleIds: new Set(['s1']) }
	)
	assert.deepStrictEqual(wynik.map(e => e.scheduleId), ['s1'])
})

test('wpisy spoza zakresu dat są pomijane', () => {
	const wynik = zbierz([grafik({ days: [{ date: '2026-09-05', entries: [wpis()] }] })])
	assert.deepStrictEqual(wynik, [])
})

test('wynik jest posortowany po dacie, a w dniu po godzinie', () => {
	const wynik = zbierz([
		grafik({
			days: [
				{ date: '2026-08-22', entries: [wpis({ _id: 'c', timeFrom: '07:00' })] },
				{ date: '2026-08-20', entries: [wpis({ _id: 'b', timeFrom: '14:00' }), wpis({ _id: 'a', timeFrom: '06:00' })] },
			],
		}),
	])
	assert.deepStrictEqual(wynik.map(e => e.id), ['a', 'b', 'c'])
})

test('pusty zbiór pracowników nie zwraca niczego', () => {
	assert.deepStrictEqual(zbierz([grafik()], { employeeIds: new Set() }), [])
})

test('radzi sobie z brakiem grafików i uszkodzonymi danymi', () => {
	assert.deepStrictEqual(collectVisibleScheduleEntries(null, ZAKRES), [])
	assert.deepStrictEqual(zbierz([null, { _id: 's9' }]), [])
	assert.deepStrictEqual(zbierz([grafik({ days: [{ date: 'nie-data', entries: [wpis()] }] })]), [])
})

test('lista employeeIds może być zwykłą tablicą', () => {
	const wynik = zbierz([grafik()], { employeeIds: ['u1'] })
	assert.strictEqual(wynik.length, 1)
})
