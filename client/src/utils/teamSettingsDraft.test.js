import { describe, expect, it } from 'vitest'
import {
	buildTeamSettingsPayload,
	buildTeamSettingsShape,
	diffTeamSettings,
} from './teamSettingsDraft'

const serverSettings = {
	workOnWeekends: false,
	includePolishHolidays: true,
	includeCustomHolidays: true,
	customHolidays: [{ _id: 'abc123', date: '2026-12-24', name: 'Wigilia' }],
	workHours: [{ _id: 'def456', timeFrom: '08:00', timeTo: '16:00', hours: 8 }],
	leaveCalculationMode: 'days',
	leaveHoursPerDay: 8,
	timerEnabled: true,
	dashboardEnabled: true,
	allowManagedNoAccessUsers: false,
	allowManagedWorkdayEntries: false,
	allowManagedLeaveRequests: false,
	workdayEntriesOnlyToday: false,
	leaveRequestTypes: [
		{ id: 'leaveform.option1', name: 'Urlop wypoczynkowy', isSystem: true, isEnabled: true, requireApproval: true, allowDaysLimit: true, minDaysBefore: null, settlementUnit: 'inherit' },
		{ id: 'custom-1', name: 'Opieka', isSystem: false, isEnabled: true, requireApproval: true, allowDaysLimit: true, minDaysBefore: null, settlementUnit: 'hours' },
	],
}

const ALL_KEYS = Object.keys(buildTeamSettingsShape(serverSettings))

describe('buildTeamSettingsShape', () => {
	it('pomija techniczne pola z bazy, zeby zapis nie zostawial strony „brudnej"', () => {
		const shape = buildTeamSettingsShape(serverSettings)
		expect(shape.customHolidays).toEqual([{ date: '2026-12-24', name: 'Wigilia' }])
		expect(shape.workHours).toEqual([{ timeFrom: '08:00', timeTo: '16:00', hours: 8 }])
		// Ten sam obiekt z innym _id (Mongoose nadaje nowe przy kazdym zapisie) jest rowny.
		const afterSave = buildTeamSettingsShape({
			...serverSettings,
			customHolidays: [{ _id: 'INNE', date: '2026-12-24', name: 'Wigilia' }],
		})
		expect(diffTeamSettings(shape, afterSave)).toEqual([])
	})

	it('normalizuje typy wnioskow, w tym brakujace settlementUnit ze starych zespolow', () => {
		const shape = buildTeamSettingsShape({
			leaveRequestTypes: [{ id: 'x', name: 'X', isSystem: false, isEnabled: true, requireApproval: true }],
		})
		expect(shape.leaveRequestTypes[0]).toEqual({
			id: 'x',
			name: 'X',
			nameEn: null,
			isSystem: false,
			isEnabled: true,
			requireApproval: true,
			allowDaysLimit: false,
			minDaysBefore: null,
			settlementUnit: 'inherit',
		})
	})

	it('rozstrzyga zaleznosci przelacznikow tak samo po obu stronach porownania', () => {
		// Wylaczone konta bez dostepu => zalezne przelaczniki sa efektywnie wylaczone,
		// nawet jesli w bazie zostaly na true. Bez tego strona wygladalaby na „brudna".
		const saved = buildTeamSettingsShape({ allowManagedNoAccessUsers: false, allowManagedWorkdayEntries: true })
		const current = buildTeamSettingsShape({ allowManagedNoAccessUsers: false, allowManagedWorkdayEntries: false })
		expect(diffTeamSettings(current, saved)).toEqual([])
	})

	it('freemium nigdy nie ma wlaczonych wnioskow dla kont bez dostepu', () => {
		const shape = buildTeamSettingsShape(
			{ allowManagedNoAccessUsers: true, allowManagedLeaveRequests: true },
			{ freemiumTier: true }
		)
		expect(shape.allowManagedLeaveRequests).toBe(false)
	})
})

describe('diffTeamSettings', () => {
	const saved = buildTeamSettingsShape(serverSettings)

	it('bez zmian zwraca pusta liste', () => {
		expect(diffTeamSettings(buildTeamSettingsShape(serverSettings), saved)).toEqual([])
	})

	it('wskazuje dokladnie zmienione pola', () => {
		const current = buildTeamSettingsShape({ ...serverSettings, workOnWeekends: true })
		expect(diffTeamSettings(current, saved)).toEqual(['workOnWeekends'])
	})

	it('REGRESJA: dopoki formularz nie wczytal danych, nie zglasza zmian', () => {
		// Stan poczatkowy komponentu to wartosci domyslne, a nie dane zespolu. Gdyby
		// porownanie dzialalo juz wtedy, wczytanie danych zostaloby zablokowane przez
		// wlasna flage „sa niezapisane zmiany" — i panel typow zostalby pusty.
		const defaults = buildTeamSettingsShape({ workOnWeekends: true, leaveRequestTypes: [] })
		expect(diffTeamSettings(defaults, saved, false)).toEqual([])
		expect(diffTeamSettings(defaults, saved, true).length).toBeGreaterThan(0)
	})

	it('REGRESJA: pusta lista typow rozni sie od listy z serwera', () => {
		// To wlasnie ta roznica doprowadzilaby do wyslania leaveRequestTypes: []
		// i skasowania wszystkich typow niestandardowych zespolu.
		const emptyDraft = buildTeamSettingsShape({ ...serverSettings, leaveRequestTypes: [] })
		expect(diffTeamSettings(emptyDraft, saved)).toContain('leaveRequestTypes')
	})

	it('brak snapshotu serwera oznacza brak zmian', () => {
		expect(diffTeamSettings(buildTeamSettingsShape(serverSettings), null)).toEqual([])
	})
})

describe('buildTeamSettingsPayload', () => {
	const current = buildTeamSettingsShape({ ...serverSettings, workOnWeekends: true, dashboardEnabled: false })
	const saved = buildTeamSettingsShape(serverSettings)
	const changed = diffTeamSettings(current, saved)

	it('wysyla wylacznie zmienione pola', () => {
		const payload = buildTeamSettingsPayload(current, changed, ALL_KEYS)
		expect(Object.keys(payload).sort()).toEqual(['dashboardEnabled', 'workOnWeekends'])
		expect(payload.workOnWeekends).toBe(true)
		expect(payload.dashboardEnabled).toBe(false)
	})

	it('nie wysyla pol, ktorych uzytkownik nie mogl zmienic', () => {
		const payload = buildTeamSettingsPayload(current, changed, ['workOnWeekends'])
		expect(Object.keys(payload)).toEqual(['workOnWeekends'])
	})

	it('pusta lista godzin pracy idzie jako null', () => {
		const noHours = buildTeamSettingsShape({ ...serverSettings, workHours: [] })
		const payload = buildTeamSettingsPayload(noHours, diffTeamSettings(noHours, saved), ALL_KEYS)
		expect(payload.workHours).toBeNull()
	})

	it('wylaczenie kont bez dostepu kasuje oba zalezne przelaczniki', () => {
		const withManaged = buildTeamSettingsShape({
			...serverSettings,
			allowManagedNoAccessUsers: true,
			allowManagedWorkdayEntries: true,
		})
		const off = buildTeamSettingsShape({ ...serverSettings, allowManagedNoAccessUsers: false })
		const payload = buildTeamSettingsPayload(off, diffTeamSettings(off, withManaged), ALL_KEYS)
		expect(payload.allowManagedNoAccessUsers).toBe(false)
		expect(payload.allowManagedWorkdayEntries).toBe(false)
		expect(payload.allowManagedLeaveRequests).toBe(false)
	})
})
