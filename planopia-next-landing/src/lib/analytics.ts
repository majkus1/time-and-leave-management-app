'use client'

export type ConsentChoice = {
	analytics: boolean
	marketing: boolean
}

declare global {
	interface Window {
		dataLayer: unknown[]
		gtag?: (...args: unknown[]) => void
	}
}

export const CONSENT_COOKIE_NAME = 'planopia_consent_v1'
export const CONSENT_EVENT_NAME = 'planopia:consent-updated'
export const CONSENT_SETTINGS_EVENT_NAME = 'planopia:open-cookie-settings'

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-DVKVCS2CQK'
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ''

let googleTagPromise: Promise<void> | null = null

function getCookieDomain() {
	if (typeof window === 'undefined') return ''
	return window.location.hostname === 'planopia.pl' || window.location.hostname.endsWith('.planopia.pl')
		? '; Domain=.planopia.pl'
		: ''
}

export function readConsent(): ConsentChoice | null {
	if (typeof document === 'undefined') return null
	const raw = document.cookie
		.split('; ')
		.find(item => item.startsWith(`${CONSENT_COOKIE_NAME}=`))
		?.split('=')
		.slice(1)
		.join('=')

	if (!raw) return null

	try {
		const value = JSON.parse(decodeURIComponent(raw)) as Partial<ConsentChoice>
		if (typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean') return null
		return { analytics: value.analytics, marketing: value.marketing }
	} catch {
		return null
	}
}

export function writeConsent(choice: ConsentChoice) {
	const maxAge = 180 * 24 * 60 * 60
	const secure = window.location.protocol === 'https:' ? '; Secure' : ''
	document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(choice))}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${getCookieDomain()}`
	window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: choice }))
}

export function initializeConsentMode() {
	window.dataLayer = window.dataLayer || []
	window.gtag = window.gtag || function gtag(...args: unknown[]) {
		window.dataLayer.push(args)
	}

	const consent = readConsent()
	window.gtag('consent', 'default', {
		analytics_storage: consent?.analytics ? 'granted' : 'denied',
		ad_storage: consent?.marketing ? 'granted' : 'denied',
		ad_user_data: consent?.marketing ? 'granted' : 'denied',
		ad_personalization: consent?.marketing ? 'granted' : 'denied',
		wait_for_update: 500,
	})
	window.gtag('set', 'ads_data_redaction', true)
	window.gtag('set', 'url_passthrough', true)
}

export function updateGoogleConsent(choice: ConsentChoice) {
	initializeConsentMode()
	window.gtag?.('consent', 'update', {
		analytics_storage: choice.analytics ? 'granted' : 'denied',
		ad_storage: choice.marketing ? 'granted' : 'denied',
		ad_user_data: choice.marketing ? 'granted' : 'denied',
		ad_personalization: choice.marketing ? 'granted' : 'denied',
	})
}

export function loadGoogleTag(choice: ConsentChoice): Promise<void> {
	if (!choice.analytics && !choice.marketing) return Promise.resolve()
	if (googleTagPromise) return googleTagPromise

	initializeConsentMode()
	updateGoogleConsent(choice)

	googleTagPromise = new Promise(resolve => {
		const existing = document.querySelector<HTMLScriptElement>('script[data-planopia-google-tag]')
		if (existing) {
			resolve()
			return
		}

		const script = document.createElement('script')
		script.async = true
		script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
		script.dataset.planopiaGoogleTag = 'true'
		script.onload = () => resolve()
		script.onerror = () => resolve()
		document.head.appendChild(script)

		window.gtag?.('js', new Date())
		window.gtag?.('config', GA_MEASUREMENT_ID, {
			cookie_domain: 'auto',
			linker: { domains: ['planopia.pl', 'app.planopia.pl'] },
			send_page_view: false,
		})
		if (GOOGLE_ADS_ID) {
			window.gtag?.('config', GOOGLE_ADS_ID)
		}
	})

	return googleTagPromise
}

export function trackEvent(name: string, params: Record<string, string | number | boolean | undefined> = {}) {
	const consent = readConsent()
	if (!consent?.analytics && !consent?.marketing) return
	void loadGoogleTag(consent).then(() => window.gtag?.('event', name, params))
}

export function openCookieSettings() {
	window.dispatchEvent(new Event(CONSENT_SETTINGS_EVENT_NAME))
}
