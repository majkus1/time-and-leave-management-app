import { describe, it, expect } from 'vitest'
import { summarizeQrVerify } from './qrSessionVerify'

const geo = (status, extra = {}) => ({ policy: 'flag', status, distanceM: null, accuracyM: 15, flagged: status !== 'inside', ...extra })

describe('summarizeQrVerify', () => {
	it('brak danych → null', () => {
		expect(summarizeQrVerify(null)).toBe(null)
		expect(summarizeQrVerify({ entryMethod: null, exitMethod: null, entryGeo: null, exitGeo: null })).toBe(null)
		expect(summarizeQrVerify({ entryGeo: geo('not_configured') })).toBe(null)
	})

	it('w miejscu przy wejściu i wyjściu → ok, nie nietypowe', () => {
		const s = summarizeQrVerify({ entryGeo: geo('inside'), exitGeo: geo('inside') })
		expect(s.geo).toMatchObject({ status: 'inside', tone: 'ok', side: null })
		expect(s.unusual).toBe(false)
	})

	it('najgorszy wynik wygrywa i wskazuje stronę', () => {
		const s = summarizeQrVerify({ entryGeo: geo('inside'), exitGeo: geo('outside', { distanceM: 1200 }) })
		expect(s.geo).toMatchObject({ status: 'outside', side: 'exit', distanceM: 1200, tone: 'warn' })
		expect(s.unusual).toBe(true)
		const both = summarizeQrVerify({ entryGeo: geo('denied'), exitGeo: geo('denied') })
		expect(both.geo.side).toBe('both')
	})

	it('polityka „tylko zapisuj” → ton informacyjny, ale nadal nietypowe dla filtra', () => {
		const s = summarizeQrVerify({ entryGeo: geo('outside', { policy: 'record', distanceM: 800 }) })
		expect(s.geo.tone).toBe('info')
		expect(s.unusual).toBe(true)
	})

	it('metoda skanu: ekran ok, wydruk ostrzeżenie ze stroną', () => {
		expect(summarizeQrVerify({ entryMethod: 'screen', exitMethod: 'screen' }).method).toMatchObject({ value: 'screen', tone: 'ok' })
		const p = summarizeQrVerify({ entryMethod: 'screen', exitMethod: 'print' })
		expect(p.method).toMatchObject({ value: 'print', side: 'exit', tone: 'warn' })
		expect(p.unusual).toBe(true)
	})
})
