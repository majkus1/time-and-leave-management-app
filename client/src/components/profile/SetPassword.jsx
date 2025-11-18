import React, { useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAlert } from '../../context/AlertContext'

function SetPassword() {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [position, setPosition] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { token } = useParams()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const isPasswordValid = password => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(password)
	}

	const handleSubmit = async e => {
		e.preventDefault()
		if (password !== confirmPassword) {
			await showAlert(t('newpass.messone'))
			return
		}
		if (!isPasswordValid(password)) {
			await showAlert(t('newpass.invalidPassword'))
			return
		}
		setIsLoading(true)
		try {
			const response = await axios.post(`${API_URL}/api/public/set-password/${token}`, {
				password,
				position,
			})
			await showAlert(t('newpass.messtwo'))
			navigate('/login')
		} catch (error) {
			console.error('Error setting password:', error)
			await showAlert(t('newpass.messthree'))
		} finally {
			setIsLoading(false)
		}
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
				<div className="card">
					<div className="set-pass">
						<h2 style={{ marginTop: '20px', marginBottom: '20px' }}>{t('newpass.h2n')}</h2>
						<form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
							
							<input
								type="password"
								id="password"
								value={password}
								onChange={e => setPassword(e.target.value)}
								required
								placeholder={t('newpass.newpassone')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
							/>

							
							<input
								type="password"
								id="confirmPassword"
								value={confirmPassword}
								onChange={e => setConfirmPassword(e.target.value)}
								required
								placeholder={t('newpass.newpassrepeat')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
							/>

							
							<small className="text-gray-500 block">{t('newpass.requirements')}</small>

							
							<input
								type="text"
								id="position"
								value={position}
								onChange={e => setPosition(e.target.value)}
								required
								placeholder={t('newpass.position')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1 mt-3"
							/>
							<small className="text-gray-500 block mb-4" style={{ fontSize: '14px', marginTop: '4px' }}>
								{t('newpass.positionInfo') || 'Stanowisko można później edytować w panelu użytkownika.'}
							</small>

							
							<button
								type="submit"
								disabled={isLoading}
								className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
								{isLoading ? (
									<span className="flex items-center justify-center">
										<svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('newpass.saving')}
									</span>
								) : (
									t('newpass.btnsuccess')
								)}
							</button>
						</form>
					</div>
				</div>
			</div>
			<Link
				to="/login"
				style={{ 
					display: 'inline-block',
					margin: '20px auto',
					padding: '10px 20px',
					fontSize: '14px',
					textDecoration: 'none',
					color: '#6b7280',
					backgroundColor: '#f3f4f6',
					borderRadius: '6px',
					border: '1px solid #e5e7eb',
					transition: 'all 0.2s',
					textAlign: 'center'
				}}
				onMouseEnter={(e) => {
					e.target.style.backgroundColor = '#e5e7eb'
					e.target.style.color = '#374151'
					e.target.style.borderColor = '#d1d5db'
				}}
				onMouseLeave={(e) => {
					e.target.style.backgroundColor = '#f3f4f6'
					e.target.style.color = '#6b7280'
					e.target.style.borderColor = '#e5e7eb'
				}}>
				{t('resetpass.backto')}
			</Link>
		</div>
	)
}

export default SetPassword
