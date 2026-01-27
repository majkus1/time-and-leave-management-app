import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useVerifyQRCode, useRegisterTimeEntry } from '../../hooks/useQRCode'
import { useSettings } from '../../hooks/useSettings'
import Loader from '../Loader'
import axios from 'axios'
import { API_URL } from '../../config'

function QRScan() {
	const { code } = useParams()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { loggedIn, userId } = useAuth()
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
	}, [code, loggedIn, qrData, registered, registering, settings, showAlert, t, navigate])

	const handleRegister = async () => {
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

	if (verifying) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				flexDirection: 'column',
				gap: '20px'
			}}>
				<Loader />
				<p style={{ color: '#7f8c8d' }}>
					{t('qrScan.verifying') || 'Weryfikowanie kodu QR...'}
				</p>
			</div>
		)
	}

	if (!qrData || !qrData.valid) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				flexDirection: 'column',
				gap: '20px',
				padding: '20px',
				textAlign: 'center'
			}}>
				<div style={{
					fontSize: '48px',
					marginBottom: '20px'
				}}>
					❌
				</div>
				<h2 style={{
					color: '#e74c3c',
					marginBottom: '10px'
				}}>
					{t('qrScan.invalidCode') || 'Nieprawidłowy kod QR'}
				</h2>
				<p style={{ color: '#7f8c8d' }}>
					{t('qrScan.invalidCodeDescription') || 'Kod QR jest nieprawidłowy lub został usunięty.'}
				</p>
				<button
					onClick={() => navigate('/dashboard')}
					style={{
						backgroundColor: '#3498db',
						color: 'white',
						border: 'none',
						padding: '12px 24px',
						borderRadius: '6px',
						fontSize: '16px',
						cursor: 'pointer',
						marginTop: '20px'
					}}
				>
					{t('qrScan.backToDashboard') || 'Powrót do panelu'}
				</button>
			</div>
		)
	}

	if (registering || registered) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				flexDirection: 'column',
				gap: '20px',
				padding: '20px',
				textAlign: 'center'
			}}>
				{registered ? (
					<>
						<div style={{
							fontSize: '64px',
							marginBottom: '20px'
						}}>
							{entryType === 'entry' ? '✅' : '👋'}
						</div>
						<h2 style={{
							color: '#27ae60',
							marginBottom: '10px'
						}}>
							{entryType === 'entry' 
								? (t('qrScan.entrySuccess') || 'Wejście zarejestrowane!')
								: (t('qrScan.exitSuccess') || 'Wyjście zarejestrowane!')
							}
						</h2>
						<p style={{ color: '#7f8c8d' }}>
							{t('qrScan.redirecting') || 'Przekierowywanie do panelu...'}
						</p>
					</>
				) : (
					<>
						<Loader />
						<p style={{ color: '#7f8c8d' }}>
							{t('qrScan.registering') || 'Rejestrowanie czasu...'}
						</p>
					</>
				)}
			</div>
		)
	}

	return (
		<div style={{
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			minHeight: '100vh',
			flexDirection: 'column',
			gap: '20px',
			padding: '20px',
			textAlign: 'center'
		}}>
			<div style={{
				fontSize: '48px',
				marginBottom: '20px'
			}}>
				📱
			</div>
			<h2 style={{
				color: '#2c3e50',
				marginBottom: '10px'
			}}>
				{t('qrScan.scanning') || 'Skanowanie kodu QR'}
			</h2>
			<p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
				{t('qrScan.location') || 'Miejsce:'} <strong>{qrData.name}</strong>
			</p>
			<button
				onClick={handleRegister}
				disabled={registering}
				style={{
					backgroundColor: '#3498db',
					color: 'white',
					border: 'none',
					padding: '12px 24px',
					borderRadius: '6px',
					fontSize: '16px',
					cursor: registering ? 'not-allowed' : 'pointer',
					opacity: registering ? 0.6 : 1
				}}
			>
				{t('qrScan.registerNow') || 'Zarejestruj teraz'}
			</button>
		</div>
	)
}

export default QRScan
