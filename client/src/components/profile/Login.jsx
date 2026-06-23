import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

import 'bootstrap/dist/css/bootstrap.min.css'
// import 'admin-lte/dist/css/adminlte.min.css'

// import 'admin-lte/plugins/jquery/jquery.min.js'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
// import 'admin-lte/dist/js/adminlte.min.js'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import AuthPageTopBar from '../shared/AuthPageTopBar'
import AuthLogo from '../shared/AuthLogo'
import './AuthForms.css'

function Login() {
	// const [username, setUsername] = useState('')
	const [usernameInput, setUsernameInput] = useState('') // 👈 lokalny input
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	// const [rememberMe, setRememberMe] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()
	const redirectAfterLogin = (() => {
		const loc = location.state?.from
		if (!loc?.pathname) return '/dashboard'
		return `${loc.pathname}${loc.search || ''}${loc.hash || ''}`
	})()
	const { t } = useTranslation()
	const { refreshUserData, loggedIn, isCheckingAuth } = useAuth()
	const { showAlert } = useAlert()

	useEffect(() => {
		if (loggedIn) {
			navigate(redirectAfterLogin, { replace: true })
		}
	}, [loggedIn, navigate, redirectAfterLogin])

	const handleLogin = async e => {
		e.preventDefault()
		setIsLoading(true)
		setErrorMessage('')
		try {
			await axios.post(
				`${API_URL}/api/users/login`,
				{ username: usernameInput, password },
				{
					withCredentials: true,
				}
			)
			await refreshUserData()
			navigate(redirectAfterLogin)
		} catch (error) {
			console.error('Login error:', error)
			setErrorMessage(t('login.failed'))

			if (error.response?.status === 429) {
				await showAlert('Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleUsernameChange = e => {
		setUsername(e.target.value.toLowerCase())
	}

	// Jeśli sprawdzamy autoryzację, pokaż loader
	if (isCheckingAuth) {
		return (
			<div className="alllogin auth-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
				<Loader />
			</div>
		)
	}

	return (
		<div className="alllogin auth-page">
			<AuthPageTopBar />
			<div className="login-box">
				<div className="login-logo">
					<div>
						<AuthLogo maxWidth="180px" />
					</div>
				</div>
				<div className="card boxlog auth-form-shell">
					<div className="card-body login-card-body padr auth-form-card-inner">
						<form onSubmit={handleLogin} className="w-full max-w-md auth-form-stack">
							<div className="auth-field-wrap">
								<div className="auth-field-relative">
									<span className="auth-input-icon" aria-hidden>
										<i className="fas fa-envelope" />
									</span>
									<input
										type="email"
										id="email"
										placeholder="Email"
										value={usernameInput}
										onChange={e => setUsernameInput(e.target.value.toLowerCase())}
										required
										className="auth-input"
									/>
								</div>
							</div>

							<div className="auth-field-wrap">
								<div className="auth-field-relative">
									<span className="auth-input-icon" aria-hidden>
										<i className="fas fa-lock" />
									</span>
									<input
										type={showPassword ? 'text' : 'password'}
										id="password"
										placeholder={t('login.password')}
										value={password}
										onChange={e => setPassword(e.target.value)}
										required
										className="auth-input auth-input--with-toggle"
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="auth-toggle-vis"
										aria-label={showPassword ? 'Ukryj hasło' : 'Pokaż hasło'}
									>
										{showPassword ? (
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 015.12 5.12m3.46 3.46L12 12m-3.42-3.42l3.42 3.42M12 12l3.42 3.42M12 12l-3.42-3.42m0 0L5.12 5.12m3.46 3.46L12 12" />
											</svg>
										) : (
											<svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
												<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
											</svg>
										)}
									</button>
								</div>
							</div>

							<div className="auth-field-wrap auth-field-wrap--tight">
								<button
									type="submit"
									disabled={isLoading}
									className="auth-submit-btn"
								>
									{isLoading ? (
										<span className="flex items-center">
											<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
												<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
												<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
											</svg>
											{t('login.loggingIn')}
										</span>
									) : (
										t('login.loginto')
									)}
								</button>
							</div>

							
							<div className="text-center">
								<Link to="/reset-password" className="auth-link-subtle">
									{t('login.forgotpass')}
								</Link>
							</div>

							<div className="auth-divider-label">
								<span>{t('login.orDivider')}</span>
							</div>

							<div>
								<Link to="/team-registration" className="login-create-team-cta">
									<span className="login-create-team-cta__icon" aria-hidden>
										<svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path
												d="M12 5v14M5 12h14"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
											/>
										</svg>
									</span>
									<span className="login-create-team-cta__text">
										<span className="login-create-team-cta__title">{t('login.createTeam')}</span>
										<span className="login-create-team-cta__sub">{t('login.trialCtaSub')}</span>
									</span>
									<span className="login-create-team-cta__arrow" aria-hidden>
										→
									</span>
								</Link>
							</div>
						</form>

						{errorMessage && (
							<p className="auth-form-error mt-3" style={{ textAlign: 'center' }}>
								{errorMessage}
							</p>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Login
