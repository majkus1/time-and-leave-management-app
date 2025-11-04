import React, { useState } from 'react'
import axios from 'axios'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'

function NewPassword() {
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const { token } = useParams()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()

	const isPasswordValid = password => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(password)
	}

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const handleSubmit = async e => {
		e.preventDefault()
		if (password !== confirmPassword) {
			alert(t('newpass.messone'))
			return
		}
		if (!isPasswordValid(password)) {
			alert(t('newpass.invalidPassword'))
			return
		}
		setIsLoading(true)
		try {
			const response = await axios.post(`${API_URL}/api/public/new-password`, {
				newPassword: password,
				token,
			})
			alert(t('newpass.messtwo'))
			navigate('/')
		} catch (error) {
			alert(t('newpass.messthree'))
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
				<div className="card boxlog">
					<div className="card-body login-card-body padr">
						<div className="set-pass">
							<h2 style={{ marginBottom: '20px' }}>{t('newpass.h2')}</h2>
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
									className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
								/>

								
								<small className="text-gray-500 block">{t('newpass.requirements')}</small>

								
								<button
									type="submit"
									disabled={isLoading}
									className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
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
			</div>
			<Link
				to="/login"
				style={{ margin: '20px', fontSize: '14px', textDecoration: 'none', color: 'blue', opacity: '0.6' }}>
				{t('resetpass.backto')}
			</Link>
		</div>
	)
}

export default NewPassword
