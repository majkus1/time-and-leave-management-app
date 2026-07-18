import { beforeEach, describe, expect, it, vi } from 'vitest'

function queuedCommands() {
	return (window.dataLayer || []).map(entry => Array.from(entry))
}

describe('marketingAnalytics', () => {
	beforeEach(() => {
		vi.resetModules()
		document.head.querySelectorAll('script[data-planopia-google-tag]').forEach(script => script.remove())
		document.cookie = 'planopia_consent_v1=; Path=/; Max-Age=0'
		delete window.gtag
		window.dataLayer = []
	})

	it('initializes Consent Mode v2 as denied before configuring GA4', async () => {
		const { initializeMarketingAnalytics } = await import('./marketingAnalytics.js')

		initializeMarketingAnalytics()

		const commands = queuedCommands()
		const consent = commands.find(command => command[0] === 'consent' && command[1] === 'default')
		const config = commands.find(command => command[0] === 'config' && command[1] === 'G-DVKVCS2CQK')

		expect(consent?.[2]).toMatchObject({
			analytics_storage: 'denied',
			ad_storage: 'denied',
			ad_user_data: 'denied',
			ad_personalization: 'denied',
		})
		expect(config).toBeTruthy()
		expect(document.querySelector('script[data-planopia-google-tag]')?.src).toContain('G-DVKVCS2CQK')
	})

	it('queues sign_up after a successful direct registration without a consent cookie', async () => {
		const { trackRegistrationConversion } = await import('./marketingAnalytics.js')

		const conversion = trackRegistrationConversion()
		const signUp = queuedCommands().find(command => command[0] === 'event' && command[1] === 'sign_up')

		expect(signUp?.[2]).toMatchObject({
			method: 'team_registration',
			transport_type: 'beacon',
		})
		signUp[2].event_callback()
		await conversion
	})

	it('updates all consent signals after the user accepts', async () => {
		const { updateMarketingConsent } = await import('./marketingAnalytics.js')

		updateMarketingConsent({ analytics: true, marketing: true })

		const update = queuedCommands().find(command => command[0] === 'consent' && command[1] === 'update')
		expect(update?.[2]).toMatchObject({
			analytics_storage: 'granted',
			ad_storage: 'granted',
			ad_user_data: 'granted',
			ad_personalization: 'granted',
		})
	})
})
