import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import {
	CONSENT_SETTINGS_EVENT_NAME,
	DEFAULT_CONSENT,
	readMarketingConsent,
	updateMarketingConsent,
	writeMarketingConsent,
} from '../utils/marketingAnalytics.js'
import './MarketingCookieConsent.css'

const PUBLIC_PATHS = new Set(['/', '/login', '/team-registration', '/reset-password'])
const PUBLIC_PATH_PREFIXES = ['/set-password/', '/new-password/']

const copy = {
	pl: {
		title: 'Twoja prywatność w Planopii',
		description: 'Używamy opcjonalnych plików cookies, aby mierzyć skuteczność aplikacji i reklam. Niezbędne cookies zapewniają bezpieczne działanie serwisu.',
		privacy: 'Polityka prywatności',
		accept: 'Akceptuj wszystkie',
		reject: 'Tylko niezbędne',
		settings: 'Dostosuj',
		save: 'Zapisz wybór',
		back: 'Wróć',
		necessary: 'Niezbędne',
		necessaryDescription: 'Zapamiętują wybór prywatności i umożliwiają podstawowe działanie aplikacji.',
		analytics: 'Analityczne',
		analyticsDescription: 'Google Analytics 4 pomaga mierzyć użyteczność aplikacji i ukończone rejestracje.',
		marketing: 'Marketingowe',
		marketingDescription: 'Pomagają ocenić skuteczność kampanii i przypisać rejestrację do reklamy.',
		alwaysOn: 'Zawsze aktywne',
	},
	en: {
		title: 'Your privacy at Planopia',
		description: 'We use optional cookies to measure application and advertising performance. Essential cookies keep the service secure and operational.',
		privacy: 'Privacy policy',
		accept: 'Accept all',
		reject: 'Essential only',
		settings: 'Customise',
		save: 'Save selection',
		back: 'Back',
		necessary: 'Essential',
		necessaryDescription: 'Remember your privacy choice and enable the application’s basic operation.',
		analytics: 'Analytics',
		analyticsDescription: 'Google Analytics 4 helps measure application usefulness and completed registrations.',
		marketing: 'Marketing',
		marketingDescription: 'Help measure campaign performance and attribute registrations to advertising.',
		alwaysOn: 'Always active',
	},
}

function isPublicPath(pathname) {
	return PUBLIC_PATHS.has(pathname) || PUBLIC_PATH_PREFIXES.some(prefix => pathname.startsWith(prefix))
}

export default function MarketingCookieConsent() {
	const { i18n } = useTranslation()
	const { pathname } = useLocation()
	const locale = i18n.language?.startsWith('en') ? 'en' : 'pl'
	const t = copy[locale]
	const [visible, setVisible] = useState(false)
	const [details, setDetails] = useState(false)
	const [choice, setChoice] = useState(DEFAULT_CONSENT)
	const publicPath = isPublicPath(pathname)

	useEffect(() => {
		if (!publicPath) return
		const saved = readMarketingConsent()
		if (saved) {
			setChoice(saved)
			updateMarketingConsent(saved)
			setVisible(false)
		} else {
			updateMarketingConsent(DEFAULT_CONSENT)
			setVisible(true)
		}
	}, [publicPath])

	useEffect(() => {
		const openSettings = () => {
			if (!publicPath) return
			setChoice(readMarketingConsent() || DEFAULT_CONSENT)
			setDetails(true)
			setVisible(true)
		}
		window.addEventListener(CONSENT_SETTINGS_EVENT_NAME, openSettings)
		return () => window.removeEventListener(CONSENT_SETTINGS_EVENT_NAME, openSettings)
	}, [publicPath])

	if (!publicPath) return null

	const save = next => {
		setChoice(next)
		writeMarketingConsent(next)
		updateMarketingConsent(next)
		setVisible(false)
		setDetails(false)
	}

	if (!visible) {
		return (
			<button type="button" className="app-cookie-settings" onClick={() => window.dispatchEvent(new Event(CONSENT_SETTINGS_EVENT_NAME))}>
				{t.settings} cookies
			</button>
		)
	}

	return (
		<div className="app-cookie-layer" role="presentation">
			<section className="app-cookie-consent" role="dialog" aria-modal="true" aria-labelledby="app-cookie-title" lang={locale}>
				<div className="app-cookie-heading">
					<span className="app-cookie-icon" aria-hidden="true">✓</span>
					<div>
						<h2 id="app-cookie-title">{t.title}</h2>
						<p>{t.description} <a href={locale === 'pl' ? 'https://planopia.pl/privacy' : 'https://planopia.pl/en/privacy'}>{t.privacy}</a>.</p>
					</div>
				</div>

				{details && (
					<div className="app-cookie-options">
						<ConsentRow title={t.necessary} description={t.necessaryDescription} lockedLabel={t.alwaysOn} checked />
						<ConsentRow title={t.analytics} description={t.analyticsDescription} checked={choice.analytics} onChange={analytics => setChoice(current => ({ ...current, analytics }))} />
						<ConsentRow title={t.marketing} description={t.marketingDescription} checked={choice.marketing} onChange={marketing => setChoice(current => ({ ...current, marketing }))} />
					</div>
				)}

				<div className="app-cookie-actions">
					{details ? (
						<>
							<button type="button" className="app-cookie-button app-cookie-button--quiet" onClick={() => setDetails(false)}>{t.back}</button>
							<button type="button" className="app-cookie-button app-cookie-button--primary" onClick={() => save(choice)}>{t.save}</button>
						</>
					) : (
						<>
							<button type="button" className="app-cookie-button app-cookie-button--quiet" onClick={() => save(DEFAULT_CONSENT)}>{t.reject}</button>
							<button type="button" className="app-cookie-button app-cookie-button--secondary" onClick={() => setDetails(true)}>{t.settings}</button>
							<button type="button" className="app-cookie-button app-cookie-button--primary" onClick={() => save({ analytics: true, marketing: true })}>{t.accept}</button>
						</>
					)}
				</div>
			</section>
		</div>
	)
}

function ConsentRow({ title, description, checked, onChange, lockedLabel }) {
	return (
		<label className="app-cookie-option">
			<span><strong>{title}</strong><small>{description}</small></span>
			{lockedLabel ? <em>{lockedLabel}</em> : (
				<input type="checkbox" checked={checked} onChange={event => onChange?.(event.target.checked)} />
			)}
		</label>
	)
}
