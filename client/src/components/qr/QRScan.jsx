import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useVerifyQRCode, useRegisterTimeEntry } from '../../hooks/useQRCode'
import { useSettings } from '../../hooks/useSettings'
import { getScanPosition, formatDistance } from '../../utils/scanGeolocation'
import './QRScan.css'

// Kody odmowy z serwera (timeEntryController.registerTimeEntry), dla których jest własny widok i tłumaczenie
const KNOWN_SCAN_ERRORS = ['SCREEN_REQUIRED', 'SCREEN_EXPIRED', 'GEO_OUTSIDE', 'GEO_DENIED', 'GEO_UNAVAILABLE', 'GEO_MISSING', 'TIMER_RUNNING']

const ClockIcon = ({ className = '' }) => (
	<svg className={className} width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<circle cx="12" cy="12" r="9" strokeWidth={2} />
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 7v5l3 2" />
	</svg>
)

const ScreenIcon = ({ className = '' }) => (
	<svg className={className} width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<rect x="5" y="3" width="14" height="18" rx="2" strokeWidth={2} />
		<path strokeLinecap="round" strokeWidth={2} d="M10 17.5h4" />
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h2v2H9zM13 8h2v2h-2zM9 12h2" />
	</svg>
)

const PinIcon = ({ className = '' }) => (
	<svg className={className} width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
		<circle cx="12" cy="9.5" r="2.5" strokeWidth={2} />
	</svg>
)

/** Tytuł i treść widoku odmowy per kod (klucze i18n qrScan.*) */
function scanErrorCopy(t, i18n, { code, distanceM }) {
	switch (code) {
		case 'SCREEN_EXPIRED':
			return { title: t('qrScan.screenExpiredTitle'), body: t('qrScan.screenExpiredBody') }
		case 'SCREEN_REQUIRED':
			return { title: t('qrScan.screenRequiredTitle'), body: t('qrScan.screenRequiredBody') }
		case 'TIMER_RUNNING':
			return { title: t('qrScan.timerRunningTitle'), body: t('qrScan.timerRunningBody'), timer: true }
		case 'GEO_OUTSIDE':
			return {
				title: t('qrScan.geoOutsideTitle'),
				body: t('qrScan.geoOutsideBody', { distance: formatDistance(distanceM, i18n.resolvedLanguage) }),
				retry: true,
				geo: true,
			}
		case 'GEO_DENIED':
			return { title: t('qrScan.geoDeniedTitle'), body: t('qrScan.geoDeniedBody'), retry: true, geo: true }
		default:
			return { title: t('qrScan.geoUnavailableTitle'), body: t('qrScan.geoUnavailableBody'), retry: true, geo: true }
	}
}

const QRIcon = ({ className = '' }) => (
	<svg className={className} width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
		<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2.01M8 8h.01M5 16h2.01M8 16h.01M12 8h.01M12 16h.01M16 8h.01M16 16h.01M20 8h.01M20 16h.01" />
	</svg>
)

const SpinnerIcon = ({ className = '' }) => (
	<svg className={className} width="40" height="40" fill="none" viewBox="0 0 24 24" aria-hidden="true">
		<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
		<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
	</svg>
)

function QRScanShell({ panelClassName = '', children }) {
	return (
		<div className="po-qr-scan">
			<div className={`po-qr-scan__panel ${panelClassName}`.trim()}>
				{children}
			</div>
		</div>
	)
}

function QRScan() {
	const { code } = useParams()
	const [searchParams] = useSearchParams()
	// Tryb ekranu: t = token z tabletu (ważny ~minutę), p = przepustka wydana przy skanie (przetrwa logowanie)
	const screenToken = searchParams.get('t') || ''
	const passFromUrl = searchParams.get('p') || ''
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { loggedIn, isCheckingAuth } = useAuth()
	const { showAlert } = useAlert()
	const { data: qrData, isLoading: verifying } = useVerifyQRCode(code, { t: screenToken, p: passFromUrl })
	const scanPass = qrData?.pass || passFromUrl
	// Logowanie wraca tutaj (Login czyta location.state.from) — z przepustką zamiast wygasającego tokenu
	const goToLogin = () =>
		navigate('/login', {
			state: { from: { pathname: `/qr-scan/${code}`, search: scanPass ? `?p=${encodeURIComponent(scanPass)}` : '' } },
		})
	const registerTimeEntry = useRegisterTimeEntry()
	const { data: settings } = useSettings()
	const [registering, setRegistering] = useState(false)
	const [registered, setRegistered] = useState(false)
	const [entryType, setEntryType] = useState(null)
	const [registeredAt, setRegisteredAt] = useState(null)
	const [locating, setLocating] = useState(false)
	// Odmowa z serwera z rozpoznanym kodem (ekran/lokalizacja) — własny widok zamiast alertu
	const [scanError, setScanError] = useState(null)
	// Automatyczna rejestracja tylko raz; po błędzie ponowienie wyłącznie przyciskiem (bez pętli żądań)
	const autoTriedRef = useRef(false)
	const needsGeo = Boolean(qrData?.geoPolicy && qrData.geoPolicy !== 'off')

	useEffect(() => {
		if (!code) {
			navigate('/dashboard')
			return
		}

		// loggedIn === null: stan sesji jeszcze nieznany (np. przerwane sprawdzenie) — nie odsyłaj do logowania
		if (isCheckingAuth || loggedIn === null) {
			return
		}

		if (settings && settings.timerEnabled === false) {
			showAlert(t('qrScan.timerDisabled') || 'Funkcja QR i licznika czasu pracy jest wyłączona')
			navigate('/dashboard')
			return
		}

		if (qrData && qrData.valid && qrData.scanAllowed === false) {
			return
		}

		if (!loggedIn && qrData && qrData.valid) {
			goToLogin()
			return
		}

		if (loggedIn && qrData && qrData.valid && !registered && !registering && !autoTriedRef.current) {
			autoTriedRef.current = true
			handleRegister()
		}
	}, [code, loggedIn, isCheckingAuth, qrData, registered, registering, settings, showAlert, t, navigate])

	const handleRegister = async () => {
		if (isCheckingAuth) {
			return
		}

		if (settings && settings.timerEnabled === false) {
			await showAlert(t('qrScan.timerDisabled') || 'Funkcja QR i licznika czasu pracy jest wyłączona')
			navigate('/dashboard')
			return
		}

		if (!loggedIn) {
			goToLogin()
			return
		}

		setRegistering(true)
		setScanError(null)
		try {
			let geo
			if (needsGeo) {
				setLocating(true)
				geo = await getScanPosition()
				setLocating(false)
			}
			const result = await registerTimeEntry.mutateAsync({ code, t: screenToken || undefined, p: scanPass || undefined, geo })
			setRegisteredAt(new Date())
			setRegistered(true)
			setEntryType(result.type)

			setTimeout(() => {
				navigate('/dashboard')
				window.location.reload()
			}, 3000)
		} catch (error) {
			setLocating(false)
			const errorCode = error.response?.data?.code
			if (KNOWN_SCAN_ERRORS.includes(errorCode)) {
				setScanError({ code: errorCode, distanceM: error.response?.data?.distanceM ?? null })
				setRegistering(false)
				return
			}
			console.error('Error registering time entry:', error)
			await showAlert(
				error.response?.data?.message ||
				t('qrScan.registrationError') ||
				'Błąd podczas rejestracji czasu'
			)
			setRegistering(false)
		}
	}

	const loadingView = (
		<QRScanShell>
			<div className="po-qr-scan__icon po-qr-scan__icon--info is-pulse">
				<QRIcon />
			</div>
			<h2 className="po-qr-scan__title">
				{t('qrScan.verifying') || 'Weryfikowanie kodu QR...'}
			</h2>
			<p className="po-qr-scan__text">
				{t('qrScan.pleaseWait') || 'Proszę czekać'}
			</p>
		</QRScanShell>
	)

	if (isCheckingAuth || verifying) {
		return loadingView
	}

	if (!qrData || !qrData.valid) {
		return (
			<QRScanShell>
				<div className="po-qr-scan__icon po-qr-scan__icon--error">
					<svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
					</svg>
				</div>
				<h2 className="po-qr-scan__title">
					{t('qrScan.invalidCode') || 'Nieprawidłowy kod QR'}
				</h2>
				<p className="po-qr-scan__text po-qr-scan__text--spaced">
					{t('qrScan.invalidCodeDescription') || 'Kod QR jest nieprawidłowy lub został usunięty.'}
				</p>
				<button type="button" onClick={() => navigate('/dashboard')} className="po-qr-scan__btn">
					{t('qrScan.backToDashboard') || 'Powrót do panelu'}
				</button>
			</QRScanShell>
		)
	}

	// Odmowa: kod tylko z ekranu (wydruk / wygasły token) albo lokalizacja poza miejscem / bez zgody
	const blocked = qrData.scanAllowed === false
		? { code: qrData.scanReason === 'SCREEN_EXPIRED' ? 'SCREEN_EXPIRED' : 'SCREEN_REQUIRED' }
		: scanError
	if (blocked && !registering) {
		const copy = scanErrorCopy(t, i18n, blocked)
		return (
			<QRScanShell>
				<div className="po-qr-scan__icon po-qr-scan__icon--error">
					{copy.geo ? <PinIcon /> : copy.timer ? <ClockIcon /> : <ScreenIcon />}
				</div>
				<h2 className="po-qr-scan__title">{copy.title}</h2>
				<p className="po-qr-scan__text po-qr-scan__text--spaced">{copy.body}</p>
				<p className="po-qr-scan__text">
					{t('qrScan.location')} <span className="po-qr-scan__location-highlight">{qrData.name}</span>
				</p>
				{copy.retry && (
					<button type="button" onClick={handleRegister} className="po-qr-scan__btn po-qr-scan__btn--spaced">
						{t('qrScan.geoRetry')}
					</button>
				)}
				<button
					type="button"
					onClick={() => navigate('/dashboard')}
					className={copy.retry ? 'po-qr-scan__btn po-qr-scan__btn--secondary' : 'po-qr-scan__btn po-qr-scan__btn--spaced'}
				>
					{t('qrScan.backToDashboard')}
				</button>
			</QRScanShell>
		)
	}

	// Pytanie przeglądarki o lokalizację — krótko, po co i że bez śledzenia
	if (locating) {
		return (
			<QRScanShell>
				<div className="po-qr-scan__icon po-qr-scan__icon--info is-pulse">
					<PinIcon />
				</div>
				<h2 className="po-qr-scan__title">{t('qrScan.geoLocatingTitle')}</h2>
				<p className="po-qr-scan__text po-qr-scan__text--spaced">{t('qrScan.geoNotice')}</p>
				<p className="po-qr-scan__text">
					{t('qrScan.location')} <span className="po-qr-scan__location-highlight">{qrData.name}</span>
				</p>
			</QRScanShell>
		)
	}

	if (registering && !registered) {
		return (
			<QRScanShell>
				<div className="po-qr-scan__icon po-qr-scan__icon--info po-qr-scan__icon--spin">
					<SpinnerIcon />
				</div>
				<h2 className="po-qr-scan__title">
					{t('qrScan.registering') || 'Rejestrowanie czasu...'}
				</h2>
				<p className="po-qr-scan__text">
					{t('qrScan.pleaseWait') || 'Proszę czekać'}
				</p>
			</QRScanShell>
		)
	}

	if (registered) {
		const isEntry = entryType === 'entry'
		return (
			<QRScanShell panelClassName="is-success">
				<div className={`po-qr-scan__icon is-success-pop ${isEntry ? 'po-qr-scan__icon--success-entry' : 'po-qr-scan__icon--success-exit'}`}>
					{isEntry ? (
						<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					) : (
						<svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
						</svg>
					)}
				</div>
				<h2 className={`po-qr-scan__title ${isEntry ? 'po-qr-scan__title--success-entry' : 'po-qr-scan__title--success-exit'}`}>
					{isEntry
						? (t('qrScan.entrySuccess') || 'Wejście zarejestrowane!')
						: (t('qrScan.exitSuccess') || 'Wyjście zarejestrowane!')}
				</h2>
				<p className="po-qr-scan__text">
					{t('qrScan.location') || 'Miejsce:'}{' '}
					<span className="po-qr-scan__location-highlight">{qrData.name}</span>
				</p>
				{registeredAt && (
					<p className="po-qr-scan__time">
						{registeredAt.toLocaleTimeString(i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pl-PL', { hour: '2-digit', minute: '2-digit' })}
					</p>
				)}
				<div className="po-qr-scan__footer">
					<div className="po-qr-scan__redirect">
						<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<span>{t('qrScan.redirecting') || 'Przekierowywanie do panelu...'}</span>
					</div>
				</div>
			</QRScanShell>
		)
	}

	return (
		<QRScanShell>
			<div className="po-qr-scan__icon po-qr-scan__icon--info">
				<QRIcon />
			</div>
			<h2 className="po-qr-scan__title">
				{t('qrScan.scanning') || 'Skanowanie kodu QR'}
			</h2>
			<div className="po-qr-scan__location-box">
				<p className="po-qr-scan__location-label">
					{t('qrScan.location') || 'Miejsce:'}
				</p>
				<p className="po-qr-scan__location-name">
					{qrData.name}
				</p>
			</div>
			<button
				type="button"
				onClick={handleRegister}
				disabled={registering}
				className="po-qr-scan__btn po-qr-scan__btn--spaced"
			>
				{registering ? (
					<span className="po-qr-scan__btn-inner">
						<SpinnerIcon className="po-qr-scan__btn-spinner" />
						{t('qrScan.registering') || 'Rejestrowanie...'}
					</span>
				) : (
					t('qrScan.registerNow') || 'Zarejestruj teraz'
				)}
			</button>
		</QRScanShell>
	)
}

export default QRScan
