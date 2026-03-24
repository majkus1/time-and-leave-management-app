import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAlert } from '../../context/AlertContext'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'
import './AuthForms.css'

function ResetPassword() {
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()
	const { isCheckingAuth, loggedIn } = useAuth()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const handleSubmit = async e => {
		e.preventDefault()
		setIsLoading(true)
		try {
			const response = await axios.post(`${API_URL}/api/public/reset-password-request`, { email })
			await showAlert(t('resetpass.messok'))
			setTimeout(() => {
				navigate('/login')
			}, 5000)
		} catch (error) {
			await showAlert(t('resetpass.messfail'))
			if (error.response?.status === 429) {
				await showAlert(t('resetpass.toomany'))
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleEmailChange = e => {
		setEmail(e.target.value.toLowerCase())
	}

	// Jeśli sprawdzamy autoryzację, pokaż loader
	if (isCheckingAuth) {
		return (
			<div className="alllogin" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<Loader />
			</div>
		)
	}

	// Jeśli użytkownik jest już zalogowany, przekieruj
	if (loggedIn) {
		navigate('/dashboard', { replace: true })
		return null
	}

	return (
		<div className="alllogin">
			<div className="language-box">
				{Object.keys(lngs).map(lng => (
					<button
						key={lng}
						type="button"
						style={{
							fontWeight: i18n.resolvedLanguage === lng ? 'bold' : 'normal',
							marginRight: '5px',
						}}
						className="flag-language"
						onClick={() => i18n.changeLanguage(lng)}>
						<img
							src={lngs[lng].flag}
							alt={`${lngs[lng].nativeName} flag`}
							style={{ width: '23px', marginRight: '5px' }}
						/>
						{lngs[lng].nativeName}
					</button>
				))}
			</div>
			<div className="login-box">
				<div className="login-logo">
					<div>
						<img src="/img/new-logoplanopia.png" alt="logo oficjalne planopia" style={{ maxWidth: '180px' }}/>
					</div>
				</div>
				<div className="card auth-form-shell">
					<div className="reset-password-container auth-form-body-centered">
						<h2 className="auth-form-title">{t('resetpass.txt1')}</h2>
						<form onSubmit={handleSubmit} className="auth-form-stack">
							<div className="auth-field-wrap">
								<input
									type="email"
									id="email"
									value={email}
									onChange={handleEmailChange}
									placeholder="Email"
									required
									className="auth-input"
								/>
							</div>

							<button
								type="submit"
								disabled={isLoading}
								className="auth-submit-btn"
							>
								{isLoading ? (
									<span className="flex items-center justify-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('resetpass.sending')}
									</span>
								) : (
									t('resetpass.txt3')
								)}
							</button>

							
							{message && <p className="text-sm text-gray-700 max-w-xs">{message}</p>}
						</form>
					</div>
				</div>
			</div>
			<div className="auth-back-row">
				<Link to="/login" className="auth-back-link">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M19 12H5M12 19l-7-7 7-7"/>
					</svg>
					{t('newteam.backToLogin')}
				</Link>
			</div>
		</div>
	)
}

export default ResetPassword
