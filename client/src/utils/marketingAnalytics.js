const CONSENT_COOKIE_NAME = 'planopia_consent_v1'
export const CONSENT_EVENT_NAME = 'planopia:consent-updated'
export const DEFAULT_CONSENT = Object.freeze({ analytics: false, marketing: false })

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-DVKVCS2CQK'
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || ''
const GOOGLE_ADS_SIGNUP_LABEL = import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL || ''

let initialized = false

function getCookieDomain() {
	return window.location.hostname === 'planopia.pl' || window.location.hostname.endsWith('.planopia.pl')
		? '; Domain=.planopia.pl'
		: ''
}

export function readMarketingConsent() {
	const raw = document.cookie
		.split('; ')
		.find(item => item.startsWith(`${CONSENT_COOKIE_NAME}=`))
		?.split('=')
		.slice(1)
		.join('=')

	if (!raw) return null
	try {
		const value = JSON.parse(decodeURIComponent(raw))
		if (typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean') return null
		return { analytics: value.analytics, marketing: value.marketing }
	} catch {
		return null
	}
}

export function writeMarketingConsent(choice) {
	const maxAge = 180 * 24 * 60 * 60
	const secure = window.location.protocol === 'https:' ? '; Secure' : ''
	document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(choice))}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}${getCookieDomain()}`
	window.dispatchEvent(new CustomEvent(CONSENT_EVENT_NAME, { detail: choice }))
}

function ensureGtag() {
	window.dataLayer = window.dataLayer || []
	window.gtag = window.gtag || function gtag() {
		window.dataLayer.push(arguments)
	}
}

function setConsent(command, choice) {
	window.gtag('consent', command, {
		analytics_storage: choice.analytics ? 'granted' : 'denied',
		ad_storage: choice.marketing ? 'granted' : 'denied',
		ad_user_data: choice.marketing ? 'granted' : 'denied',
		ad_personalization: choice.marketing ? 'granted' : 'denied',
		...(command === 'default' ? { wait_for_update: 500 } : {}),
	})
}

export function initializeMarketingAnalytics() {
	if (initialized || typeof window === 'undefined') return
	const consent = readMarketingConsent() || DEFAULT_CONSENT

	initialized = true
	ensureGtag()
	setConsent('default', consent)
	window.gtag('set', 'ads_data_redaction', true)
	window.gtag('set', 'url_passthrough', true)

	if (!document.querySelector('script[data-planopia-google-tag]')) {
		const script = document.createElement('script')
		script.async = true
		script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
		script.dataset.planopiaGoogleTag = 'true'
		document.head.appendChild(script)
	}

	window.gtag('js', new Date())
	window.gtag('config', GA_MEASUREMENT_ID, {
		cookie_domain: 'auto',
		linker: { domains: ['planopia.pl', 'app.planopia.pl'] },
	})
	if (GOOGLE_ADS_ID) window.gtag('config', GOOGLE_ADS_ID)
}

export function updateMarketingConsent(choice) {
	initializeMarketingAnalytics()
	ensureGtag()
	setConsent('update', choice)
}

export function trackRegistrationConversion() {
	initializeMarketingAnalytics()
	ensureGtag()

	return new Promise(resolve => {
		let completed = false
		const finish = () => {
			if (completed) return
			completed = true
			resolve()
		}

		window.gtag('event', 'sign_up', {
			method: 'team_registration',
			event_callback: finish,
			transport_type: 'beacon',
		})

		if (GOOGLE_ADS_ID && GOOGLE_ADS_SIGNUP_LABEL) {
			window.gtag('event', 'conversion', {
				send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_SIGNUP_LABEL}`,
				transport_type: 'beacon',
			})
		}

		window.setTimeout(finish, 600)
	})
}
