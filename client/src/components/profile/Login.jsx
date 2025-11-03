import React, { useState } from 'react'
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

function Login() {
	// const [username, setUsername] = useState('')
	const [usernameInput, setUsernameInput] = useState('') // 👈 lokalny input
	const [password, setPassword] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	// const [rememberMe, setRememberMe] = useState(false)
	const navigate = useNavigate()
	const location = useLocation()
	const from = location.state?.from?.pathname || '/dashboard'
	const { t, i18n } = useTranslation()
	const { setLoggedIn, setRole, setUsername, setTeamId, setIsTeamAdmin } = useAuth()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const handleLogin = async e => {
		e.preventDefault()
		setIsLoading(true)
		setErrorMessage('')
		try {
			const response = await axios.post(
				`${API_URL}/api/users/login`,
				{ username: usernameInput, password },
				{
					withCredentials: true,
				}
			)
			// localStorage.setItem('roles', JSON.stringify(response.data.roles))
			// localStorage.setItem('username', response.data.username)
			setRole(response.data.roles)
			setLoggedIn(true)
			setUsername(response.data.username)
			setTeamId(response.data.teamId)
			setIsTeamAdmin(response.data.isTeamAdmin)
			navigate(from)
		} catch (error) {
			console.error('Login error:', error)
			setErrorMessage(t('login.failed'))

			if (error.response?.status === 429) {
				alert('Zbyt wiele prób logowania. Spróbuj ponownie za 15 minut.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleUsernameChange = e => {
		setUsername(e.target.value.toLowerCase())
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
				<div className="card boxlog">
					<div className="card-body login-card-body padr">
						<form onSubmit={handleLogin} className="w-full max-w-md space-y-6">
							
							<div style={{ marginBottom: '15px' }}>
								<div className="relative">
									<input
										type="email"
										id="email"
										placeholder="Email"
										value={usernameInput}
										onChange={e => setUsernameInput(e.target.value.toLowerCase())}
										required
										className="w-full border border-gray-300 rounded-md px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
										<i className="fas fa-envelope" />
									</div>
								</div>
							</div>

							
							<div>
								
								<div className="relative">
									<input
										type="password"
										id="password"
										placeholder={t('login.password')}
										value={password}
										onChange={e => setPassword(e.target.value)}
										required
										className="w-full border border-gray-300 rounded-md px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
									<div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
										<i className="fas fa-lock" />
									</div>
								</div>
							</div>

							
							<div>
								<button
									type="submit"
									disabled={isLoading}
									className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 btn-success disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600">
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
								<Link to="/reset-password" className="text-sm text-blue-600 hover:underline">
									{t('login.forgotpass')}
								</Link>
							</div>

							
							<div className="relative">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300" />
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-2 bg-white text-gray-500">lub</span>
								</div>
							</div>

							
							<div>
								<Link
									to="/team-registration"
									className="w-full bg-blue-600 text-white py-2 px-4 rounded-md transition block text-center btn-primary"
									style={{ textDecoration: 'none' }}>
									{t('login.createTeam')}
								</Link>
								<p className="text-xs text-gray-500 text-center mt-2">
									{t('login.teamDescription')}
								</p>
							</div>
						</form>

						{errorMessage && (
							<p className="mt-3 text-danger" style={{ textAlign: 'center' }}>
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
