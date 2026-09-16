import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import { devLog } from '../../utils/devLog.js'
import AuthPageTopBar from '../shared/AuthPageTopBar'
import AuthLogo from '../shared/AuthLogo'
import './AuthForms.css'
import { trackRegistrationConversion } from '../../utils/marketingAnalytics.js'

const TeamRegistration = () => {
	const [formData, setFormData] = useState({
		teamName: '',
		adminEmail: '',
		adminPassword: '',
		adminFirstName: '',
		adminLastName: '',
		position: ''
	})
	const [acceptTermsPrivacy, setAcceptTermsPrivacy] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showRetentionModal, setShowRetentionModal] = useState(false)
	const [retentionInfo, setRetentionInfo] = useState(null)
	const [showPassword, setShowPassword] = useState(false)
	const navigate = useNavigate()
	const { setLoggedIn, setRole, setUsername, setTeamId, refreshUserData, loggedIn, isCheckingAuth } = useAuth()
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()

	// Password validation function (same as in SetPassword.jsx)
	const isPasswordValid = (password) => {
		const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/
		return regex.test(password)
	}

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData({
			...formData,
			[name]: value
		})
		
		// Password validation is handled by showPasswordRequirements
	}

	// Check if password requirements should be shown
	// Show only if password is entered but doesn't meet requirements
	const showPasswordRequirements = formData.adminPassword && !isPasswordValid(formData.adminPassword)

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		
		// Validate password before submission
		if (!isPasswordValid(formData.adminPassword)) {
			setError(t('newpass.invalidPassword') || 'Hasło nie spełnia wymagań bezpieczeństwa')
			setLoading(false)
			return
		}
		if (!acceptTermsPrivacy) {
			setError(t('newteam.mustAcceptTerms'))
			setLoading(false)
			return
		}
		devLog('[TeamRegistration] Form submitted')
		// Nie loguj hasła ze względów bezpieczeństwa
		const { adminPassword, ...formDataWithoutPassword } = formData
		devLog('[TeamRegistration] Form data (password hidden):', formDataWithoutPassword)

		try {
			// Accept TERMS and PRIVACY during registration
			// DPA will be automatically accepted when first employee is added
			const acceptedDocuments = ['TERMS', 'PRIVACY'];
			devLog('[TeamRegistration] POST', `${API_URL}/api/teams/register`)
			const response = await axios.post(`${API_URL}/api/teams/register`, {
				...formData,
				acceptedDocuments
			}, {
				withCredentials: true
			})

			devLog('[TeamRegistration] Response', response.data)

			if (response.data && response.data.success) {
				sessionStorage.setItem('showTeamSuccessModal', 'true')
				await refreshUserData()
				await trackRegistrationConversion()
				navigate('/', { replace: true })
			} else {
				devLog('[TeamRegistration] Unexpected response', response.data)
			}
		} catch (error) {
			console.error('Team registration error:', error)
			
			// Sprawdź czy to błąd związany z soft-deleted zespołem (karencja)
			if (error.response?.data?.code === 'TEAM_SOFT_DELETED') {
				setRetentionInfo(error.response.data.retentionInfo)
				setShowRetentionModal(true)
				setError('')
				setLoading(false)
				return
			}
			
			let errorMessage = t('newteam.errorGeneric')
			
			if (error.response?.data?.message) {
				const serverMessage = error.response.data.message
				
				if (serverMessage.includes('nazwie już istnieje') || serverMessage.includes('name already exists')) {
					errorMessage = t('newteam.errorTeamExists')
				} else if (serverMessage.includes('emailu już istnieje') || serverMessage.includes('email already exists')) {
					errorMessage = t('newteam.errorEmailExists')
				} else if (serverMessage.includes('Wszystkie pola są wymagane') || serverMessage.includes('All fields are required')) {
					errorMessage = t('newteam.errorValidation')
				} else if (serverMessage.includes('został usunięty')) {
					// Fallback - jeśli kod nie jest ustawiony, ale jest komunikat o usunięciu
					errorMessage = serverMessage
				} else {
					errorMessage = serverMessage
				}
			}
			
			setError(errorMessage)
		} finally {
			setLoading(false)
		}
	}

	// Jeśli sprawdzamy autoryzację, pokaż loader
	if (isCheckingAuth) {
		return (
			<div className="auth-page team-registration-page min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
				<Loader />
			</div>
		)
	}

	return (
		<div className="auth-page team-registration-page min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<AuthPageTopBar />
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<AuthLogo maxWidth="250px" style={{ margin: '0 auto', marginBottom: '40px', display: 'block' }} />
			<p className="mt-6 text-center text-3xl font-extrabold text-gray-900 mt-4">
  {t('newteam.h2')}
</p>
<p className="mt-2 text-center text-sm text-gray-600 px-2">
  {t('newteam.subtitle')}
</p>
</div>

<div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 sm:px-10 auth-form-team-shell">
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="auth-form-error-banner">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="teamName" className="block text-sm font-medium text-gray-700">
          {t('newteam.teamName')}
        </label>
        <div className="mt-1">
          <input
            id="teamName"
            name="teamName"
            type="text"
            required
            value={formData.teamName}
            onChange={handleChange}
            className="auth-input"
            placeholder={t('newteam.teamNamePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-700">
          {t('newteam.adminEmail')}
        </label>
        <div className="mt-1">
          <input
            id="adminEmail"
            name="adminEmail"
            type="email"
            required
            value={formData.adminEmail}
            onChange={handleChange}
            className="auth-input"
            placeholder={t('newteam.adminEmailPlaceholder')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
          {t('newteam.adminPassword')}
        </label>
        <div className="mt-1">
          <div className="auth-field-relative">
            <input
              id="adminPassword"
              name="adminPassword"
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.adminPassword}
              onChange={handleChange}
              className={`auth-input auth-input--with-toggle${showPasswordRequirements ? ' auth-input--invalid' : ''}`}
              placeholder={t('newteam.adminPasswordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-toggle-vis"
              tabIndex={-1}
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
          {showPasswordRequirements && (
            <p className="mt-1 text-sm text-red-600">
              {t('newpass.passwordRequirements') || 'Hasło musi zawierać co najmniej 8 znaków, w tym małą literę, wielką literę, cyfrę i znak specjalny.'}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="adminFirstName" className="block text-sm font-medium text-gray-700">
          {t('newteam.adminFirstName')}
        </label>
        <div className="mt-1">
          <input
            id="adminFirstName"
            name="adminFirstName"
            type="text"
            required
            value={formData.adminFirstName}
            onChange={handleChange}
            className="auth-input"
            placeholder={t('newteam.adminFirstNamePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="adminLastName" className="block text-sm font-medium text-gray-700">
          {t('newteam.adminLastName')}
        </label>
        <div className="mt-1">
          <input
            id="adminLastName"
            name="adminLastName"
            type="text"
            required
            value={formData.adminLastName}
            onChange={handleChange}
            className="auth-input"
            placeholder={t('newteam.adminLastNamePlaceholder')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="position" className="block text-sm font-medium text-gray-700">
          {t('newteam.position')} <span className="text-gray-500 text-xs">({t('newteam.optional')})</span>
        </label>
        <div className="mt-1">
          <input
            id="position"
            name="position"
            type="text"
            value={formData.position}
            onChange={handleChange}
            className="auth-input"
            placeholder={t('newteam.positionPlaceholder')}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <label htmlFor="accept-terms-newteam" className="auth-team-accept-row text-sm text-gray-700">
          <input
            id="accept-terms-newteam"
            name="acceptTermsPrivacy"
            type="checkbox"
            checked={acceptTermsPrivacy}
            onChange={e => setAcceptTermsPrivacy(e.target.checked)}
            className="auth-checkbox-newteam h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            required
          />
          <span>
            {t('newteam.acceptCheckboxPrefix')}{' '}
            <a
              href={`https://planopia.pl${i18n.resolvedLanguage === 'en' ? '/en' : ''}/terms`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={e => e.stopPropagation()}
            >
              {t('newteam.termsLink')}
            </a>
            {' '}
            {t('newteam.acceptTermsAnd')}{' '}
            <a
              href={`https://planopia.pl${i18n.resolvedLanguage === 'en' ? '/en' : ''}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={e => e.stopPropagation()}
            >
              {t('newteam.privacyLink')}
            </a>
            .
          </span>
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="auth-submit-btn"
        >
          {loading ? t('newteam.creating') : t('newteam.submit')}
        </button>
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          {t('newteam.afterCreate')}
        </p>
      </div>
    </form>
    
    {/* Przycisk powrotu do logowania */}
    <div className="auth-back-row">
      <Link to="/login" className="auth-back-link">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {t('newteam.backToLogin')}
      </Link>
    </div>
  </div>
</div>

			{showRetentionModal && retentionInfo && (
				<div
					className="auth-retention-overlay fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
					style={{
						zIndex: 100000000,
						padding: '20px',
					}}
					onClick={() => setShowRetentionModal(false)}>
					<div
						className="auth-retention-panel"
						onClick={e => e.stopPropagation()}>
						<h3 className="auth-retention-panel__title">
							{t('newteam.retentionModalTitle') || 'Zespół został wcześniej usunięty'}
						</h3>

						<div className="auth-retention-panel__notice">
							<p style={{ margin: '0 0 10px 0' }}>
								<strong>{t('newteam.retentionModalInfo') || 'Okres karencji:'}</strong>
							</p>
							<p style={{ margin: 0 }}>
								{retentionInfo.remainingDays > 0
									? t('newteam.retentionModalRemaining', {
											days: retentionInfo.remainingDays,
											total: retentionInfo.totalDays,
										}) ||
										`Zespół z tym adresem email został usunięty. Dane są przechowywane przez okres karencji (${retentionInfo.remainingDays} z ${retentionInfo.totalDays} dni pozostało). Po upływie karencji dane zostaną trwale usunięte i będzie możliwa rejestracja nowego zespołu.`
									: t('newteam.retentionModalExpired') ||
										'Okres karencji minął. Dane powinny zostać wkrótce trwale usunięte. Spróbuj ponownie za kilka dni.'}
							</p>
						</div>

						<div className="auth-retention-panel__actions">
							<button type="button" className="auth-retention-panel__btn" onClick={() => setShowRetentionModal(false)}>
								{t('newteam.retentionModalClose') || 'Rozumiem'}
							</button>
						</div>
					</div>
				</div>
			)}

		</div>
	)
}

export default TeamRegistration
