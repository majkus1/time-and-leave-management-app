import { describe, it, expect } from 'vitest'
import {
	restrictWorkdayToQrPlaces,
	restrictWorkdaysToQrPlaces,
	collectQrPlacesFromGrouped,
	workdayQrPlaceLabel,
} from './workQrPlaceFilter'

// Godzina czasu polskiego 15.09.2026 (CEST, UTC+2) — test nie zależy od strefy maszyny
const at = (h, m = 0) => new Date(Date.UTC(2026, 8, 15, h - 2, m)).toISOString()
const day = {
	_id: 'd1',
	date: '2026-09-15T00:00:00.000Z',
	hoursWorked: 9,
	additionalWorked: 1,
	realTimeDayWorked: '07:00-10:00, 11:00-16:00, 16:00-17:00',
	notes: 'Uwaga pracownika',
	absenceType: null,
	manualActivityBlocks: [{ activityId: 'a1', hours: 1 }],
	manualTaskBlocks: [],
	timeEntries: [
		{ startTime: at(7), endTime: at(10), qrCodeId: 'budowaA', overtimeTime: 0 },
		{ startTime: at(11), endTime: at(16), qrCodeId: { _id: 'budowaB' }, overtimeTime: 3600, qrVerify: { exitGeo: { policy: 'flag', status: 'outside', distanceM: 900 } } },
		{ startTime: at(16), endTime: at(17), qrCodeId: null },
	],
}

describe('restrictWorkdayToQrPlaces', () => {
	it('bez filtra zwraca dzień bez zmian', () => {
		expect(restrictWorkdayToQrPlaces(day, [])).toBe(day)
		expect(restrictWorkdaysToQrPlaces([day], [])).toEqual([day])
	})

	it('godziny „od–do” w czasie polskim, także zimą (CET)', () => {
		const winter = {
			...day,
			timeEntries: [{ startTime: '2026-01-15T06:00:00.000Z', endTime: '2026-01-15T14:30:00.000Z', qrCodeId: 'budowaA', overtimeTime: 0 }],
		}
		expect(restrictWorkdayToQrPlaces(winter, ['budowaA']).realTimeDayWorked).toBe('07:00-15:30')
	})

	it('liczy tylko sesje z wybranego miejsca, bez wpisów ręcznych i uwag', () => {
		const a = restrictWorkdayToQrPlaces(day, ['budowaA'])
		expect(a.hoursWorked).toBe(3)
		expect(a.additionalWorked).toBe(0)
		expect(a.realTimeDayWorked).toBe('07:00-10:00')
		expect(a.notes).toBe('')
		expect(a.manualActivityBlocks).toEqual([])
		expect(a.timeEntries).toHaveLength(1)

		const b = restrictWorkdayToQrPlaces(day, ['budowaB'])
		expect(b.hoursWorked).toBe(5)
		expect(b.additionalWorked).toBe(1)

		expect(restrictWorkdayToQrPlaces(day, ['budowaA', 'budowaB']).hoursWorked).toBe(8)
	})

	it('dzień bez sesji z miejsca znika z widoku', () => {
		expect(restrictWorkdayToQrPlaces(day, ['inne'])).toBe(null)
		expect(restrictWorkdaysToQrPlaces([day, { ...day, _id: 'd2', timeEntries: [] }], ['budowaA'])).toHaveLength(1)
	})
})

describe('miejsca i etykieta dnia', () => {
	it('zbiera miejsca z sesji, posortowane', () => {
		const grouped = [{ sessions: [{ qrCodeId: 'budowaB', qrCode: { name: 'Budowa B' } }, { qrCodeId: 'budowaA', qrCode: { name: 'Budowa A' } }, { qrCodeId: null }] }]
		expect(collectQrPlacesFromGrouped(grouped)).toEqual([['budowaA', 'Budowa A'], ['budowaB', 'Budowa B']])
	})

	it('etykieta z nazwami i ostrzeżeniem przy nietypowym skanie', () => {
		const names = new Map([['budowaA', 'Budowa A'], ['budowaB', 'Budowa B']])
		expect(workdayQrPlaceLabel(day, names)).toBe('⚠ Budowa A, Budowa B')
		expect(workdayQrPlaceLabel(restrictWorkdayToQrPlaces(day, ['budowaA']), names)).toBe('Budowa A')
		expect(workdayQrPlaceLabel({ timeEntries: [] }, names)).toBe('')
	})
})
