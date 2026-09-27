import { describe, it, expect } from 'vitest'
import { qrVerifyReportRows, qrVerifyBadges } from './qrVerifyLabels'
import { summarizeQrVerify } from './qrSessionVerify'

// Atrapa t: klucz + parametry, żeby test nie zależał od tłumaczeń
const t = (key, params) => (params ? `${key}${JSON.stringify(params)}` : key)
const i18n = { resolvedLanguage: 'pl' }
const geo = (status, distanceM = null) => ({ policy: 'flag', status, distanceM, accuracyM: 10, flagged: status !== 'inside' })

describe('qrVerifyReportRows', () => {
	it('pomija sesje bez weryfikacji, sortuje od najstarszej, bierze dzień pracy z serwera', () => {
		const grouped = [
			{
				sessions: [
					{ date: '2026-09-15', startTime: '2026-09-15T14:00:00', endTime: '2026-09-15T18:00:00', qrCode: { name: 'B' }, qrVerify: { entryMethod: 'screen', exitMethod: 'print' } },
					{ date: '2026-09-14', startTime: '2026-09-14T08:00:00', endTime: '2026-09-14T16:00:00', qrCode: { name: 'A' }, qrVerify: null },
				],
			},
			{
				sessions: [
					// Start po północy, ale dzień pracy 14.09 — raport jak lista sesji
					{ date: '2026-09-14', startTime: '2026-09-15T00:30:00', endTime: '2026-09-15T06:00:00', qrCode: { name: 'A' }, qrVerify: { entryGeo: geo('inside', 20), exitGeo: geo('inside', 30) } },
				],
			},
		]
		const rows = qrVerifyReportRows(t, i18n, grouped)
		expect(rows).toHaveLength(2)
		expect(rows[0][0]).toBe('14.09.2026')
		expect(rows[0][1]).toBe('00:30–06:00')
		expect(rows[0][5]).toBe('')
		expect(rows[1][2]).toBe('B')
		expect(rows[1][4]).toBe('sessions.qrVerify.methodPrintShort')
		expect(rows[1][5]).toBe('sessions.qrVerify.reportYes')
	})
})

describe('qrVerifyBadges', () => {
	it('poza miejscem z odległością i stroną', () => {
		const badges = qrVerifyBadges(t, i18n, summarizeQrVerify({ entryGeo: geo('inside'), exitGeo: geo('outside', 1500) }))
		expect(badges).toHaveLength(1)
		expect(badges[0].tone).toBe('warn')
		expect(badges[0].text).toContain('1,5 km')
		expect(badges[0].text).toContain('sessions.qrVerify.sideExit')
	})
})
