import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useVerifyQRCode, useRegisterTimeEntry } from '../../hooks/useQRCode'
import { useSettings } from '../../hooks/useSettings'
import './QRScan.css'

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
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { loggedIn, isCheckingAuth } = useAuth()
	const { showAlert } = useAlert()
	const { data: qrData, isLoading: verifying } = useVerifyQRCode(code)
	const registerTimeEntry = useRegisterTimeEntry()
	const { data: settings } = useSettings()
	const [registering, setRegistering] = useState(false)
	const [registered, setRegistered] = useState(false)
	const [entryType, setEntryType] = useState(null)

	useEffect(() => {
		if (!code) {
			navigate('/dashboard')
			return
		}

		if (isCheckingAuth) {
			return
		}

		if (settings && settings.timerEnabled === false) {
			showAlert(t('qrScan.timerDisabled') || 'Funkcja QR i licznika czasu pracy jest wyłączona')
			navigate('/dashboard')
			return
		}

		if (!loggedIn && qrData && qrData.valid) {
			navigate(`/login?redirect=/qr-scan/${code}`)
			return
		}

		if (loggedIn && qrData && qrData.valid && !registered && !registering) {
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
			navigate(`/login?redirect=/qr-scan/${code}`)
			return
		}

		setRegistering(true)
		try {
			const result = await registerTimeEntry.mutateAsync(code)
			setRegistered(true)
			setEntryType(result.type)

			await showAlert(
				result.type === 'entry'
					? (t('qrScan.entryRegistered') || 'Wejście zarejestrowane!')
					: (t('qrScan.exitRegistered') || 'Wyjście zarejestrowane!')
			)

			setTimeout(() => {
				navigate('/dashboard')
				window.location.reload()
			}, 2000)
		} catch (error) {
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
