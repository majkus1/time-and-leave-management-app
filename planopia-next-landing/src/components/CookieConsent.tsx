'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
	CONSENT_SETTINGS_EVENT_NAME,
	DEFAULT_CONSENT,
	loadGoogleTag,
	readConsent,
	updateGoogleConsent,
	writeConsent,
	type ConsentChoice,
} from '@/lib/analytics'

const copy = {
	pl: {
		title: 'Twoja prywatność w Planopii',
		description: 'Używamy opcjonalnych plików cookies, aby mierzyć skuteczność strony i reklam. Niezbędne cookies zapewniają działanie serwisu i są zawsze aktywne.',
		privacy: 'Polityka prywatności',
		accept: 'Akceptuj wszystkie',
		reject: 'Tylko niezbędne',
		settings: 'Dostosuj',
		save: 'Zapisz wybór',
		back: 'Wróć',
		necessary: 'Niezbędne',
		necessaryDescription: 'Zapamiętują wybór prywatności i umożliwiają podstawowe działanie strony.',
		analytics: 'Analityczne',
		analyticsDescription: 'Google Analytics 4 pomaga nam zrozumieć, które treści i funkcje są przydatne.',
		marketing: 'Marketingowe',
		marketingDescription: 'Google Ads pozwala ocenić skuteczność reklam i przypisać rejestrację do kampanii.',
		alwaysOn: 'Zawsze aktywne',
	},
	en: {
		title: 'Your privacy at Planopia',
		description: 'We use optional cookies to measure website and advertising performance. Essential cookies keep the service working and are always active.',
		privacy: 'Privacy policy',
		accept: 'Accept all',
		reject: 'Essential only',
		settings: 'Customise',
		save: 'Save selection',
		back: 'Back',
		necessary: 'Essential',
		necessaryDescription: 'Remember your privacy choice and enable the website’s basic operation.',
		analytics: 'Analytics',
		analyticsDescription: 'Google Analytics 4 helps us understand which content and features are useful.',
		marketing: 'Marketing',
		marketingDescription: 'Google Ads lets us measure advertising performance and attribute sign-ups to campaigns.',
		alwaysOn: 'Always active',
	},
} as const

export default function CookieConsent() {
	const pathname = usePathname()
	const locale = pathname.startsWith('/en') ? 'en' : 'pl'
	const t = copy[locale]
	const [visible, setVisible] = useState(false)
	const [details, setDetails] = useState(false)
	const [choice, setChoice] = useState<ConsentChoice>(DEFAULT_CONSENT)

	useEffect(() => {
		const saved = readConsent()
		if (saved) {
			setChoice(saved)
			updateGoogleConsent(saved)
			void loadGoogleTag(saved)
		} else {
			updateGoogleConsent(DEFAULT_CONSENT)
			void loadGoogleTag(DEFAULT_CONSENT)
			setVisible(true)
		}

		const openSettings = () => {
			setChoice(readConsent() || DEFAULT_CONSENT)
			setDetails(true)
			setVisible(true)
		}
		window.addEventListener(CONSENT_SETTINGS_EVENT_NAME, openSettings)
		return () => window.removeEventListener(CONSENT_SETTINGS_EVENT_NAME, openSettings)
	}, [])

	const save = (next: ConsentChoice) => {
		setChoice(next)
		writeConsent(next)
		updateGoogleConsent(next)
		void loadGoogleTag(next)
		setVisible(false)
		setDetails(false)
	}

	if (!visible) return null

	return (
		<div className="cookie-consent-layer" role="presentation">
			<section className="cookie-consent" role="dialog" aria-modal="true" aria-labelledby="cookie-consent-title" lang={locale}>
				<div className="cookie-consent__heading">
					<span className="cookie-consent__icon" aria-hidden="true">✓</span>
					<div>
						<h2 id="cookie-consent-title">{t.title}</h2>
						<p>{t.description} <a href={locale === 'pl' ? '/privacy' : '/en/privacy'}>{t.privacy}</a>.</p>
					</div>
				</div>

				{details && (
					<div className="cookie-consent__options">
						<ConsentRow title={t.necessary} description={t.necessaryDescription} lockedLabel={t.alwaysOn} checked />
						<ConsentRow title={t.analytics} description={t.analyticsDescription} checked={choice.analytics} onChange={analytics => setChoice(current => ({ ...current, analytics }))} />
						<ConsentRow title={t.marketing} description={t.marketingDescription} checked={choice.marketing} onChange={marketing => setChoice(current => ({ ...current, marketing }))} />
					</div>
				)}

				<div className="cookie-consent__actions">
					{details ? (
						<>
							<button type="button" className="cookie-button cookie-button--quiet" onClick={() => setDetails(false)}>{t.back}</button>
							<button type="button" className="cookie-button cookie-button--primary" onClick={() => save(choice)}>{t.save}</button>
						</>
					) : (
						<>
							<button type="button" className="cookie-button cookie-button--quiet" onClick={() => save({ analytics: false, marketing: false })}>{t.reject}</button>
							<button type="button" className="cookie-button cookie-button--secondary" onClick={() => setDetails(true)}>{t.settings}</button>
							<button type="button" className="cookie-button cookie-button--primary" onClick={() => save({ analytics: true, marketing: true })}>{t.accept}</button>
						</>
					)}
				</div>
			</section>
		</div>
	)
}

function ConsentRow({ title, description, checked, onChange, lockedLabel }: {
	title: string
	description: string
	checked: boolean
	onChange?: (checked: boolean) => void
	lockedLabel?: string
}) {
	return (
		<label className="cookie-consent__option">
			<span><strong>{title}</strong><small>{description}</small></span>
			{lockedLabel ? <em>{lockedLabel}</em> : (
				<input type="checkbox" checked={checked} onChange={event => onChange?.(event.target.checked)} />
			)}
		</label>
	)
}
