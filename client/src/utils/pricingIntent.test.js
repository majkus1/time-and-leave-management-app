import { afterEach, describe, expect, it } from 'vitest'
import { clearPricingIntent, parsePricingIntent, readPricingIntent, savePricingIntent } from './pricingIntent'

const params = query => new URLSearchParams(query)

afterEach(() => clearPricingIntent())

describe('parsePricingIntent', () => {
	it('czyta wybór z linku kalkulatora na landingu', () => {
		expect(parsePricingIntent(params('plan=base_s&modules=timer_qr,schedules_ai&users=8&billing=annual'))).toEqual({
			plan: 'base_s',
			modules: ['timer_qr', 'schedules_ai'],
			users: 8,
			billing: 'annual',
		})
	})

	it('odrzuca śmieci z adresu', () => {
		expect(parsePricingIntent(params('plan=<script>&modules=a b,ok_mod&users=-3&billing=weekly'))).toEqual({
			plan: null,
			modules: ['ok_mod'],
			users: null,
			billing: null,
		})
	})

	it('bez parametrów nie ma czego zapamiętać', () => {
		expect(parsePricingIntent(params(''))).toBeNull()
		expect(parsePricingIntent(params('billing=monthly'))).toBeNull()
		expect(parsePricingIntent(null)).toBeNull()
	})
})

describe('zapis i odczyt', () => {
	it('zapisany wybór wraca przy wejściu w Pakiety', () => {
		savePricingIntent({ plan: 'pro', modules: [], users: 20, billing: 'monthly' }, 1000)
		expect(readPricingIntent(2000)).toEqual({ plan: 'pro', modules: [], users: 20, billing: 'monthly' })
	})

	it('po 60 dniach podpowiedź wygasa i znika', () => {
		savePricingIntent({ plan: 'pro', modules: [], users: 20, billing: null }, 0)
		expect(readPricingIntent(61 * 24 * 60 * 60 * 1000)).toBeNull()
		expect(localStorage.getItem('planopia:pricingIntent')).toBeNull()
	})

	it('uszkodzony wpis nie wywraca strony', () => {
		localStorage.setItem('planopia:pricingIntent', '{nie-json')
		expect(readPricingIntent()).toBeNull()
	})
})
