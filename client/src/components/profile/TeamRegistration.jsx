import React, { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import { API_URL } from '../../config'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'

const TeamRegistration = () => {
	const [formData, setFormData] = useState({
		teamName: '',
		adminEmail: '',
		adminPassword: '',
		adminFirstName: '',
		adminLastName: '',
		position: ''
	})
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [showRetentionModal, setShowRetentionModal] = useState(false)
	const [retentionInfo, setRetentionInfo] = useState(null)
	const [showPassword, setShowPassword] = useState(false)
	const navigate = useNavigate()
	const { setLoggedIn, setRole, setUsername, setTeamId, refreshUserData, loggedIn, isCheckingAuth } = useAuth()
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()

	const lngs = {
		en: { nativeName: '', flag: '/img/united-kingdom.png' },
		pl: { nativeName: '', flag: '/img/poland.png' },
	}

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		})
	}

	const handleSubmit = async (e) => {
		e.preventDefault()
		setLoading(true)
		setError('')
		console.log('[TeamRegistration] ===== FORM SUBMITTED =====')
		// Nie loguj hasła ze względów bezpieczeństwa
		const { adminPassword, ...formDataWithoutPassword } = formData
		console.log('[TeamRegistration] Form data (password hidden):', formDataWithoutPassword)

		try {
			// Accept TERMS and PRIVACY during registration
			// DPA will be automatically accepted when first employee is added
			const acceptedDocuments = ['TERMS', 'PRIVACY'];
			console.log('[TeamRegistration] Sending POST request to:', `${API_URL}/api/teams/register`)
			const response = await axios.post(`${API_URL}/api/teams/register`, {
				...formData,
				acceptedDocuments
			}, {
				withCredentials: true
			})

			console.log('[TeamRegistration] ===== RESPONSE RECEIVED =====')
			console.log('[TeamRegistration] Full response:', response)
			console.log('[TeamRegistration] response.data:', response.data)
			console.log('[TeamRegistration] response.data.success:', response.data?.success)

			if (response.data && response.data.success) {
				console.log('[TeamRegistration] ===== SUCCESS BLOCK ENTERED =====')
				console.log('[TeamRegistration] Team created successfully, starting success flow...')
				
				// Odśwież wszystkie dane użytkownika z serwera
				console.log('[TeamRegistration] Calling refreshUserData()...')
				await refreshUserData()
				console.log('[TeamRegistration] User data refreshed')

				// Zapisz flagę w sessionStorage (location.state może być tracone podczas przekierowań)
				console.log('[TeamRegistration] Setting showTeamSuccessModal flag in sessionStorage...')
				sessionStorage.setItem('showTeamSuccessModal', 'true')
				console.log('[TeamRegistration] Flag set in sessionStorage')

				// Przekieruj na dashboard
				console.log('[TeamRegistration] Navigating to dashboard...')
				navigate('/dashboard')
			} else {
				console.log('[TeamRegistration] ===== SUCCESS IS FALSE OR MISSING =====')
				console.log('[TeamRegistration] response.data:', response.data)
				console.log('[TeamRegistration] response.data?.success:', response.data?.success)
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

	// Debug: loguj stan komponentu przy każdym renderze
	console.log('[TeamRegistration] Render - loggedIn:', loggedIn, 'isCheckingAuth:', isCheckingAuth)

	// Jeśli sprawdzamy autoryzację, pokaż loader
	if (isCheckingAuth) {
		return (
			<div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
				<Loader />
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
        <img src="img/new-logoplanopia.png" style={{ width: '250px', margin: '0 auto', marginBottom: '40px' }} />
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
			<p className="mt-6 text-center text-3xl font-extrabold text-gray-900 mt-4">
  {t('newteam.h2')}
</p>
<p className="mt-2 text-center text-sm text-gray-600 px-2">
  {t('newteam.subtitle')}
</p>
</div>

<div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
  <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
    <form className="space-y-6" onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('newteam.adminEmailPlaceholder')}
          />
        </div>
      </div>

      <div>
        <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700">
          {t('newteam.adminPassword')}
        </label>
        <div className="mt-1 relative">
          <input
            id="adminPassword"
            name="adminPassword"
            type={showPassword ? 'text' : 'password'}
            required
            value={formData.adminPassword}
            onChange={handleChange}
            className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('newteam.adminPasswordPlaceholder')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            style={{ cursor: 'pointer' }}
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
            className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder={t('newteam.positionPlaceholder')}
          />
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {t('newteam.acceptTermsPrefix')}{' '}
          <a
            href={`https://planopia.pl${i18n.resolvedLanguage === 'en' ? '/en' : ''}/terms`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {t('newteam.termsLink')}
          </a>{' '}
          {t('newteam.acceptTermsConjunction')}{' '}
          <a
            href={`https://planopia.pl${i18n.resolvedLanguage === 'en' ? '/en' : ''}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {t('newteam.privacyLink')}
          </a>
          .
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      marginTop: '30px',
      marginBottom: '20px'
    }}>
      <Link 
        to="/login" 
        style={{ 
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '500',
          textDecoration: 'none',
          color: '#6b7280',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#f3f4f6'
          e.target.style.borderColor = '#d1d5db'
          e.target.style.color = '#374151'
          e.target.style.transform = 'translateY(-1px)'
          e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#f9fafb'
          e.target.style.borderColor = '#e5e7eb'
          e.target.style.color = '#6b7280'
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        {t('newteam.backToLogin')}
      </Link>
    </div>
  </div>
</div>

			{/* Modal z informacją o karencji */}
			{showRetentionModal && retentionInfo && (
				<div 
					className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
					style={{
						zIndex: 100000000,
						padding: '20px'
					}} 
					onClick={() => setShowRetentionModal(false)}>
					<div style={{
						backgroundColor: 'white',
						borderRadius: '8px',
						padding: '30px',
						maxWidth: '500px',
						width: '100%',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						position: 'relative'
					}} onClick={(e) => e.stopPropagation()}>
						<h3 style={{
							margin: '0 0 20px 0',
							color: '#1f2937',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('newteam.retentionModalTitle') || 'Zespół został wcześniej usunięty'}
						</h3>
						
						<div style={{
							backgroundColor: '#fff3cd',
							padding: '15px',
							borderRadius: '6px',
							marginBottom: '20px',
							border: '1px solid #ffc107',
							color: '#856404',
							fontSize: '14px',
							lineHeight: '1.6'
						}}>
							<p style={{ margin: '0 0 10px 0' }}>
								<strong>{t('newteam.retentionModalInfo') || 'Okres karencji:'}</strong>
							</p>
							<p style={{ margin: 0 }}>
								{retentionInfo.remainingDays > 0 
									? t('newteam.retentionModalRemaining', { days: retentionInfo.remainingDays, total: retentionInfo.totalDays }) 
										|| `Zespół z tym adresem email został usunięty. Dane są przechowywane przez okres karencji (${retentionInfo.remainingDays} z ${retentionInfo.totalDays} dni pozostało). Po upływie karencji dane zostaną trwale usunięte i będzie możliwa rejestracja nowego zespołu.`
									: t('newteam.retentionModalExpired') 
										|| 'Okres karencji minął. Dane powinny zostać wkrótce trwale usunięte. Spróbuj ponownie za kilka dni.'
								}
							</p>
						</div>

						<div style={{
							display: 'flex',
							gap: '12px',
							justifyContent: 'flex-end'
						}}>
							<button
								onClick={() => setShowRetentionModal(false)}
								style={{
									padding: '10px 20px',
									borderRadius: '6px',
									border: '1px solid #d1d5db',
									backgroundColor: 'white',
									color: '#374151',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'all 0.2s'
								}}
								onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
								onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}>
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
