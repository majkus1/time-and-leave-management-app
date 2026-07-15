const CONSENT_COOKIE_NAME = 'planopia_consent_v1'
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-DVKVCS2CQK'
const GOOGLE_ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID || ''
const GOOGLE_ADS_SIGNUP_LABEL = import.meta.env.VITE_GOOGLE_ADS_SIGNUP_LABEL || ''

let initialized = false

function readConsent() {
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
		return value
	} catch {
		return null
	}
}

function ensureGtag() {
	window.dataLayer = window.dataLayer || []
	window.gtag = window.gtag || function gtag() {
		window.dataLayer.push(arguments)
	}
}

export function initializeMarketingAnalytics() {
	if (initialized || typeof window === 'undefined') return
	const consent = readConsent()
	if (!consent?.analytics && !consent?.marketing) return

	initialized = true
	ensureGtag()
	window.gtag('consent', 'default', {
		analytics_storage: consent.analytics ? 'granted' : 'denied',
		ad_storage: consent.marketing ? 'granted' : 'denied',
		ad_user_data: consent.marketing ? 'granted' : 'denied',
		ad_personalization: consent.marketing ? 'granted' : 'denied',
	})

	const script = document.createElement('script')
	script.async = true
	script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`
	script.dataset.planopiaGoogleTag = 'true'
	document.head.appendChild(script)

	window.gtag('js', new Date())
	window.gtag('config', GA_MEASUREMENT_ID, {
		cookie_domain: 'auto',
		linker: { domains: ['planopia.pl', 'app.planopia.pl'] },
	})
	if (GOOGLE_ADS_ID && consent.marketing) {
		window.gtag('config', GOOGLE_ADS_ID)
	}
}

export function trackRegistrationConversion() {
	const consent = readConsent()
	if (!consent?.analytics && !consent?.marketing) return Promise.resolve()

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

		if (consent.marketing && GOOGLE_ADS_ID && GOOGLE_ADS_SIGNUP_LABEL) {
			window.gtag('event', 'conversion', {
				send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_SIGNUP_LABEL}`,
				transport_type: 'beacon',
			})
		}

		window.setTimeout(finish, 600)
	})
}
