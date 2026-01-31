import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useVerifyQRCode, useRegisterTimeEntry } from '../../hooks/useQRCode'
import { useSettings } from '../../hooks/useSettings'

function QRScan() {
	const { code } = useParams()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { loggedIn, userId, isCheckingAuth } = useAuth()
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

		// Wait for auth check to complete before proceeding
		if (isCheckingAuth) {
			return
		}

		// Check if timer is enabled
		if (settings && settings.timerEnabled === false) {
			showAlert(t('qrScan.timerDisabled') || 'Funkcja QR i licznika czasu pracy jest wyłączona')
			navigate('/dashboard')
			return
		}

		// If not logged in, redirect to login with return URL
		if (!loggedIn && qrData && qrData.valid) {
			navigate(`/login?redirect=/qr-scan/${code}`)
			return
		}

		// If logged in and QR is valid, auto-register
		if (loggedIn && qrData && qrData.valid && !registered && !registering) {
			handleRegister()
		}
	}, [code, loggedIn, isCheckingAuth, qrData, registered, registering, settings, showAlert, t, navigate])

	const handleRegister = async () => {
		// Wait for auth check to complete before proceeding
		if (isCheckingAuth) {
			return
		}

		// Check if timer is enabled
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

			// Redirect to dashboard after 2 seconds
			setTimeout(() => {
				navigate('/dashboard')
				// Force refresh of timer data
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

	// Checking authentication state - wait for auth check to complete
	if (isCheckingAuth) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="mb-6">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 animate-pulse">
							<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2.01M8 8h.01M5 16h2.01M8 16h.01M12 8h.01M12 16h.01M16 8h.01M16 16h.01M20 8h.01M20 16h.01" />
							</svg>
						</div>
					</div>
					<h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center flex justify-center items-center">
						{t('qrScan.verifying') || 'Weryfikowanie kodu QR...'}
					</h2>
					<p className="text-gray-500">
						{t('qrScan.pleaseWait') || 'Proszę czekać'}
					</p>
				</div>
			</div>
		)
	}

	// Verifying state - professional loading without Loader component
	if (verifying) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="mb-6">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 animate-pulse">
							<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2.01M8 8h.01M5 16h2.01M8 16h.01M12 8h.01M12 16h.01M16 8h.01M16 16h.01M20 8h.01M20 16h.01" />
							</svg>
						</div>
					</div>
					<h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center flex justify-center items-center">
						{t('qrScan.verifying') || 'Weryfikowanie kodu QR...'}
					</h2>
					<p className="text-gray-500">
						{t('qrScan.pleaseWait') || 'Proszę czekać'}
					</p>
				</div>
			</div>
		)
	}

	// Invalid QR code state
	if (!qrData || !qrData.valid) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="mb-6">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100">
							<svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</div>
					</div>
					<h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center flex justify-center items-center">
						{t('qrScan.invalidCode') || 'Nieprawidłowy kod QR'}
					</h2>
					<p className="text-gray-500 mb-6">
						{t('qrScan.invalidCodeDescription') || 'Kod QR jest nieprawidłowy lub został usunięty.'}
					</p>
					<button
						onClick={() => navigate('/dashboard')}
						className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						{t('qrScan.backToDashboard') || 'Powrót do panelu'}
					</button>
				</div>
			</div>
		)
	}

	// Registering state - professional loading without Loader component
	if (registering && !registered) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
					<div className="mb-6">
						<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100">
							<svg className="w-10 h-10 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
						</div>
					</div>
					<h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center flex justify-center items-center">
						{t('qrScan.registering') || 'Rejestrowanie czasu...'}
					</h2>
					<p className="text-gray-500">
						{t('qrScan.pleaseWait') || 'Proszę czekać'}
					</p>
				</div>
			</div>
		)
	}

	// Success state - registered
	if (registered) {
		const isEntry = entryType === 'entry'
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
				<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center animate-fade-in">
					<div className="mb-6">
						<div className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${
							isEntry ? 'bg-green-100' : 'bg-blue-100'
						} animate-scale-in`}>
							{isEntry ? (
								<svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
							) : (
								<svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
							)}
						</div>
					</div>
					<h2 className={`text-2xl font-semibold mb-2 text-center flex justify-center items-center ${
						isEntry ? 'text-green-600' : 'text-blue-600'
					}`}>
						{isEntry 
							? (t('qrScan.entrySuccess') || 'Wejście zarejestrowane!')
							: (t('qrScan.exitSuccess') || 'Wyjście zarejestrowane!')
						}
					</h2>
					<p className="text-gray-500 mb-4 text-center">
						{t('qrScan.location') || 'Miejsce:'} <span className="font-semibold text-gray-700">{qrData.name}</span>
					</p>
					<div className="mt-6 pt-6 border-t border-gray-200">
						<div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
							<svg className="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<span>{t('qrScan.redirecting') || 'Przekierowywanie do panelu...'}</span>
						</div>
					</div>
				</div>
			</div>
		)
	}

	// Main scanning state - ready to register
	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4">
			<div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
				<div className="mb-6">
					<div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
						<svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2.01M8 8h.01M5 16h2.01M8 16h.01M12 8h.01M12 16h.01M16 8h.01M16 16h.01M20 8h.01M20 16h.01" />
						</svg>
					</div>
					<h2 className="text-2xl font-semibold text-gray-800 mb-2 text-center flex justify-center items-center">
						{t('qrScan.scanning') || 'Skanowanie kodu QR'}
					</h2>
					<div className="mt-4 p-4 bg-gray-50 rounded-lg text-center">
						<p className="text-sm text-gray-600 mb-1">
							{t('qrScan.location') || 'Miejsce:'}
						</p>
						<p className="text-lg font-semibold text-gray-800">
							{qrData.name}
						</p>
					</div>
				</div>
				
				<button
					onClick={handleRegister}
					disabled={registering}
					className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:scale-105 active:scale-95"
				>
					{registering ? (
						<span className="flex items-center justify-center">
							<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
								<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
								<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							{t('qrScan.registering') || 'Rejestrowanie...'}
						</span>
					) : (
						t('qrScan.registerNow') || 'Zarejestruj teraz'
					)}
				</button>
			</div>
		</div>
	)
}

export default QRScan
