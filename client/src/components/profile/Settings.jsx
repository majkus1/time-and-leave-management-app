import React, { useState } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useSettings, useUpdateSettings } from '../../hooks/useSettings'
import { useLeaveRequestTypes, useUpdateLeaveRequestTypes, useAddCustomLeaveRequestType, useDeleteCustomLeaveRequestType } from '../../hooks/useLeaveRequestTypes'
import { usePushNotifications } from '../../hooks/usePushNotifications'
import Modal from 'react-modal'
import { getPolishHolidaysForYear } from '../../utils/holidays'
import { calculateHours } from '../../utils/timeHelpers'

function Settings() {
	const { t, i18n } = useTranslation()
	const { role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const { data: settings, isLoading: loadingSettings } = useSettings()
	const updateSettingsMutation = useUpdateSettings()
	const [workOnWeekends, setWorkOnWeekends] = useState(true)
	const [includePolishHolidays, setIncludePolishHolidays] = useState(false)
	const [includeCustomHolidays, setIncludeCustomHolidays] = useState(false)
	const [customHolidays, setCustomHolidays] = useState([])
	const [newHolidayDate, setNewHolidayDate] = useState('')
	const [newHolidayName, setNewHolidayName] = useState('')
	
	// State for work hours (tablica konfiguracji)
	const [workHoursList, setWorkHoursList] = useState([])
	const [editingWorkHoursIndex, setEditingWorkHoursIndex] = useState(null)
	const [newWorkHours, setNewWorkHours] = useState({ timeFrom: '', timeTo: '', hours: 0 })

	const isAdmin = role && role.includes('Admin')
	const isHR = role && role.includes('HR')
	const canEditSettings = isAdmin || isHR
	const [isInfoExpanded, setIsInfoExpanded] = useState(false)
	const [isHolidayInfoExpanded, setIsHolidayInfoExpanded] = useState(false)
	const [isPolishHolidaysModalOpen, setIsPolishHolidaysModalOpen] = useState(false)
	
	// Leave Request Types
	const { data: leaveRequestTypes = [], isLoading: loadingLeaveTypes } = useLeaveRequestTypes()
	
	// Push Notifications
	const {
		isSupported: pushSupported,
		isSubscribed: pushSubscribed,
		preferences: pushPreferences,
		subscribe: subscribePush,
		unsubscribe: unsubscribePush,
		updatePreferences: updatePushPreferences
	} = usePushNotifications()
	const [pushLoading, setPushLoading] = useState(false)
	const updateLeaveRequestTypesMutation = useUpdateLeaveRequestTypes()
	const addCustomLeaveRequestTypeMutation = useAddCustomLeaveRequestType()
	const deleteCustomLeaveRequestTypeMutation = useDeleteCustomLeaveRequestType()
	const [showAddCustomTypeForm, setShowAddCustomTypeForm] = useState(false)
	const [newCustomType, setNewCustomType] = useState({
		name: '',
		nameEn: '',
		requireApproval: true,
		allowDaysLimit: false,
		minDaysBefore: null
	})

	// Helper function to calculate hours from time range
	const calculateHours = (timeFrom, timeTo) => {
		if (!timeFrom || !timeTo) return 0
		const parseTime = (timeStr) => {
			const [hours, minutes] = timeStr.split(':').map(Number)
			return hours + minutes / 60
		}
		const from = parseTime(timeFrom)
		const to = parseTime(timeTo)
		let hours = to - from
		if (hours < 0) hours += 24
		return Math.round(hours * 100) / 100
	}

	// Ustaw wartość początkową gdy settings się załadują
	React.useEffect(() => {
		if (settings) {
			setWorkOnWeekends(settings.workOnWeekends !== undefined ? settings.workOnWeekends : true)
			setIncludePolishHolidays(settings.includePolishHolidays === true)
			setIncludeCustomHolidays(settings.includeCustomHolidays === true)
			setCustomHolidays(Array.isArray(settings.customHolidays) ? settings.customHolidays : [])
			
			// Initialize work hours (obsługa starego formatu dla kompatybilności wstecznej)
			if (settings.workHours) {
				if (Array.isArray(settings.workHours)) {
					setWorkHoursList(settings.workHours)
				} else if (settings.workHours.timeFrom && settings.workHours.timeTo) {
					// Stary format - zamień na tablicę
					setWorkHoursList([{
						timeFrom: settings.workHours.timeFrom,
						timeTo: settings.workHours.timeTo,
						hours: settings.workHours.hours || 0
					}])
			} else {
					setWorkHoursList([])
			}
			} else {
				setWorkHoursList([])
			}
			setEditingWorkHoursIndex(null)
			setNewWorkHours({ timeFrom: '', timeTo: '', hours: 0 })
		}
	}, [settings])

	const handleAddWorkHours = () => {
		if (!newWorkHours.timeFrom || !newWorkHours.timeTo) {
			showAlert(t('settings.workHoursTimeRequired') || 'Wypełnij pola "Od" i "Do"')
			return
		}
		const calculatedHours = calculateHours(newWorkHours.timeFrom, newWorkHours.timeTo)
		const newEntry = {
			timeFrom: newWorkHours.timeFrom,
			timeTo: newWorkHours.timeTo,
			hours: calculatedHours
		}
		setWorkHoursList([...workHoursList, newEntry])
		setNewWorkHours({ timeFrom: '', timeTo: '', hours: 0 })
		showAlert(t('settings.workHoursSaveReminder') || 'Pamiętaj o zapisaniu zmian przyciskiem "Zapisz ustawienia" na dole strony.')
	}

	const handleUpdateWorkHours = (index) => {
		if (!newWorkHours.timeFrom || !newWorkHours.timeTo) {
			showAlert(t('settings.workHoursTimeRequired') || 'Wypełnij pola "Od" i "Do"')
			return
		}
		const calculatedHours = calculateHours(newWorkHours.timeFrom, newWorkHours.timeTo)
		const updatedList = [...workHoursList]
		updatedList[index] = {
			timeFrom: newWorkHours.timeFrom,
			timeTo: newWorkHours.timeTo,
			hours: calculatedHours
		}
		setWorkHoursList(updatedList)
		setEditingWorkHoursIndex(null)
		setNewWorkHours({ timeFrom: '', timeTo: '', hours: 0 })
		showAlert(t('settings.workHoursSaveReminder') || 'Pamiętaj o zapisaniu zmian przyciskiem "Zapisz ustawienia" na dole strony.')
	}

	const handleEditWorkHours = (index) => {
		const workHours = workHoursList[index]
		setNewWorkHours({
			timeFrom: workHours.timeFrom,
			timeTo: workHours.timeTo,
			hours: workHours.hours
		})
		setEditingWorkHoursIndex(index)
	}

	const handleCancelEditWorkHours = () => {
		setEditingWorkHoursIndex(null)
		setNewWorkHours({ timeFrom: '', timeTo: '', hours: 0 })
	}

	const handleDeleteWorkHours = (index) => {
		const updatedList = workHoursList.filter((_, i) => i !== index)
		setWorkHoursList(updatedList)
		if (editingWorkHoursIndex === index) {
			setEditingWorkHoursIndex(null)
			setNewWorkHours({ timeFrom: '', timeTo: '', hours: 0 })
		}
		showAlert(t('settings.workHoursSaveReminder') || 'Pamiętaj o zapisaniu zmian przyciskiem "Zapisz ustawienia" na dole strony.')
	}

	const handleSave = async () => {
		try {
			// Zapisz workHours jako tablicę (lub null jeśli pusta)
			const workHoursData = workHoursList.length > 0 ? workHoursList : null
			
			await updateSettingsMutation.mutateAsync({ 
				workOnWeekends,
				includePolishHolidays,
				includeCustomHolidays,
				customHolidays,
				workHours: workHoursData
			})
			await showAlert(t('settings.saveSuccess'))
		} catch (error) {
			console.error('Error updating settings:', error)
			const errorMessage = error.response?.data?.message || t('settings.saveError')
			await showAlert(errorMessage)
		}
	}

	const handleAddCustomHoliday = async () => {
		if (!newHolidayDate || !newHolidayName.trim()) {
			await showAlert(t('settings.holidayDateNameRequired') || 'Data i nazwa święta są wymagane')
			return
		}
		
		// Sprawdź czy data już istnieje
		if (customHolidays.some(h => h.date === newHolidayDate)) {
			await showAlert(t('settings.holidayDateExists') || 'Święto dla tej daty już istnieje')
			return
		}
		
		const newHoliday = { date: newHolidayDate, name: newHolidayName.trim() }
		const updatedHolidays = [...customHolidays, newHoliday]
		setCustomHolidays(updatedHolidays)
		
		// Zapisz od razu do bazy danych
		try {
			await updateSettingsMutation.mutateAsync({ 
				workOnWeekends,
				includePolishHolidays,
				includeCustomHolidays,
				customHolidays: updatedHolidays
			})
			setNewHolidayDate('')
			setNewHolidayName('')
			await showAlert(t('settings.holidayAddSuccess') || 'Święto zostało dodane pomyślnie')
		} catch (error) {
			console.error('Error adding custom holiday:', error)
			// Cofnij zmianę w stanie jeśli zapis się nie powiódł
			setCustomHolidays(customHolidays)
			await showAlert(error.response?.data?.message || t('settings.holidayAddError') || 'Błąd podczas dodawania święta')
		}
	}

	const handleRemoveCustomHoliday = async (date) => {
		const updatedHolidays = customHolidays.filter(h => h.date !== date)
		setCustomHolidays(updatedHolidays)
		
		// Zapisz od razu do bazy danych
		try {
			await updateSettingsMutation.mutateAsync({ 
				workOnWeekends,
				includePolishHolidays,
				includeCustomHolidays,
				customHolidays: updatedHolidays
			})
			await showAlert(t('settings.holidayDeleteSuccess') || 'Święto zostało usunięte pomyślnie')
		} catch (error) {
			console.error('Error removing custom holiday:', error)
			// Cofnij zmianę w stanie jeśli zapis się nie powiódł
			setCustomHolidays(customHolidays)
			await showAlert(error.response?.data?.message || t('settings.holidayDeleteError') || 'Błąd podczas usuwania święta')
		}
	}

	// Funkcje do zarządzania typami wniosków urlopowych
	const handleToggleTypeEnabled = async (typeId) => {
		try {
			const updatedTypes = leaveRequestTypes.map(type => 
				type.id === typeId ? { ...type, isEnabled: !type.isEnabled } : type
			)
			await updateLeaveRequestTypesMutation.mutateAsync(updatedTypes)
			await showAlert(t('settings.leaveTypesUpdateSuccess') || 'Typ wniosku został zaktualizowany')
		} catch (error) {
			console.error('Error toggling type enabled:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesUpdateError') || 'Błąd podczas aktualizacji typu')
		}
	}

	const handleToggleTypeAllowDaysLimit = async (typeId) => {
		try {
			const updatedTypes = leaveRequestTypes.map(type => 
				type.id === typeId ? { ...type, allowDaysLimit: !type.allowDaysLimit } : type
			)
			await updateLeaveRequestTypesMutation.mutateAsync(updatedTypes)
			await showAlert(t('settings.leaveTypesUpdateSuccess') || 'Typ wniosku został zaktualizowany')
		} catch (error) {
			console.error('Error toggling allowDaysLimit:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesUpdateError') || 'Błąd podczas aktualizacji typu')
		}
	}

	const handleToggleTypeMinDaysBefore = async (typeId) => {
		try {
			const type = leaveRequestTypes.find(t => t.id === typeId)
			const newMinDaysBefore = type.minDaysBefore === null ? 5 : null // Domyślnie 5 dni jeśli włączamy (minimum z wyprzedzeniem)
			const updatedTypes = leaveRequestTypes.map(t => 
				t.id === typeId ? { ...t, minDaysBefore: newMinDaysBefore } : t
			)
			await updateLeaveRequestTypesMutation.mutateAsync(updatedTypes)
			await showAlert(t('settings.leaveTypesUpdateSuccess') || 'Typ wniosku został zaktualizowany')
		} catch (error) {
			console.error('Error toggling minDaysBefore:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesUpdateError') || 'Błąd podczas aktualizacji typu')
		}
	}

	const handleUpdateTypeMinDaysBefore = async (typeId, value) => {
		try {
			const numValue = value === '' || value === null ? null : parseInt(value, 10)
			if (numValue !== null && (isNaN(numValue) || numValue < 1)) {
				await showAlert(t('settings.minDaysBeforeInvalid') || 'Liczba dni musi być większa niż 0')
				return
			}
			const updatedTypes = leaveRequestTypes.map(type => 
				type.id === typeId ? { ...type, minDaysBefore: numValue } : type
			)
			await updateLeaveRequestTypesMutation.mutateAsync(updatedTypes)
			await showAlert(t('settings.leaveTypesUpdateSuccess') || 'Typ wniosku został zaktualizowany')
		} catch (error) {
			console.error('Error updating minDaysBefore:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesUpdateError') || 'Błąd podczas aktualizacji typu')
		}
	}

	const handleToggleTypeRequireApproval = async (typeId) => {
		try {
			const updatedTypes = leaveRequestTypes.map(type => 
				type.id === typeId ? { ...type, requireApproval: !type.requireApproval } : type
			)
			await updateLeaveRequestTypesMutation.mutateAsync(updatedTypes)
			await showAlert(t('settings.leaveTypesUpdateSuccess') || 'Typ wniosku został zaktualizowany')
		} catch (error) {
			console.error('Error toggling requireApproval:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesUpdateError') || 'Błąd podczas aktualizacji typu')
		}
	}

	const handleAddCustomType = async () => {
		if (!newCustomType.name.trim()) {
			await showAlert(t('settings.leaveTypesNameRequired') || 'Nazwa typu jest wymagana')
			return
		}

		try {
			await addCustomLeaveRequestTypeMutation.mutateAsync({
				name: newCustomType.name.trim(),
				nameEn: newCustomType.nameEn.trim() || undefined,
				requireApproval: newCustomType.requireApproval,
				allowDaysLimit: newCustomType.allowDaysLimit,
				minDaysBefore: newCustomType.minDaysBefore || null
			})
			setNewCustomType({ name: '', nameEn: '', requireApproval: true, allowDaysLimit: false, minDaysBefore: null })
			setShowAddCustomTypeForm(false)
			await showAlert(t('settings.leaveTypesAddSuccess') || 'Niestandardowy typ został dodany')
		} catch (error) {
			console.error('Error adding custom type:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesAddError') || 'Błąd podczas dodawania typu')
		}
	}

	const handleDeleteCustomType = async (typeId) => {
		const confirmed = await showConfirm(t('settings.leaveTypesDeleteConfirm') || 'Czy na pewno chcesz usunąć ten typ wniosku?')
		if (!confirmed) return

		try {
			await deleteCustomLeaveRequestTypeMutation.mutateAsync(typeId)
			await showAlert(t('settings.leaveTypesDeleteSuccess') || 'Typ został usunięty')
		} catch (error) {
			console.error('Error deleting custom type:', error)
			await showAlert(error.response?.data?.message || t('settings.leaveTypesDeleteError') || 'Błąd podczas usuwania typu')
		}
	}

	// Push notification handlers
	const handleSubscribePush = async () => {
		setPushLoading(true)
		try {
			const result = await subscribePush()
			if (result.success) {
				await showAlert(t('settings.pushNotificationsEnableSuccess'))
			} else {
				await showAlert(result.error || t('settings.pushNotificationsEnableError'))
			}
		} catch (error) {
			console.error('Error subscribing to push:', error)
			await showAlert(t('settings.pushNotificationsEnableError'))
		} finally {
			setPushLoading(false)
		}
	}

	const handleUnsubscribePush = async () => {
		setPushLoading(true)
		try {
			const result = await unsubscribePush()
			if (result.success) {
				await showAlert(t('settings.pushNotificationsDisableSuccess'))
			} else {
				await showAlert(result.error || t('settings.pushNotificationsDisableError'))
			}
		} catch (error) {
			console.error('Error unsubscribing from push:', error)
			await showAlert(t('settings.pushNotificationsDisableError'))
		} finally {
			setPushLoading(false)
		}
	}

	const handleUpdatePushPreferences = async (key, value) => {
		const newPreferences = { ...pushPreferences, [key]: value }
		setPushLoading(true)
		try {
			const result = await updatePushPreferences(newPreferences)
			if (result.success) {
				await showAlert(t('settings.pushNotificationsUpdateSuccess'))
			} else {
				await showAlert(result.error || t('settings.pushNotificationsUpdateError'))
			}
		} catch (error) {
			console.error('Error updating push preferences:', error)
			await showAlert(t('settings.pushNotificationsUpdateError'))
		} finally {
			setPushLoading(false)
		}
	}

	if (loadingSettings || loadingLeaveTypes) return <Loader />

	return (
		<>
			<Sidebar />
			<div className="logs-container" style={{ 
				maxWidth: '1200px', 
				margin: '0 auto'
			}}>
				{/* Nagłówek */}
				<div className="logs-header" style={{ marginBottom: '30px', textAlign: 'center' }}>
					<h2 style={{ 
						color: '#2c3e50', 
						marginBottom: '20px',
						fontSize: '28px',
						fontWeight: '600',
						textAlign: 'center'
					}}>
						<img src="/img/settings.png" alt="" /> {t('settings.title')}
					</h2>
					<hr></hr>
				</div>

				{/* Sekcja konfiguracji pracy w weekendy - tylko dla Admin i HR */}
				{canEditSettings && (
					<div style={{ 
						backgroundColor: 'white',
						borderRadius: '12px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '15px',
						marginBottom: '30px'
					}}>
						<h3 style={{ 
							color: '#2c3e50',
							marginBottom: '20px',
							fontSize: '20px',
							fontWeight: '600',
							paddingBottom: '10px',
							borderBottom: '2px solid #3498db'
						}}>
							{t('settings.workWeekendsTitle')}
						</h3>

						{/* Informacje o ustawieniu */}
						<div style={{
							backgroundColor: '#e3f2fd',
							border: '1px solid #90caf9',
							borderRadius: '8px',
							padding: '15px',
							marginBottom: '20px',
							color: '#1565c0'
						}}>
							<button
								type="button"
								onClick={() => setIsInfoExpanded(!isInfoExpanded)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									width: '100%',
									backgroundColor: 'transparent',
									border: 'none',
									cursor: 'pointer',
									padding: 0,
									margin: 0,
									textAlign: 'left',
									color: '#1565c0'
								}}
							>
								<h4 style={{ 
									margin: 0,
									fontSize: '16px',
									fontWeight: '600'
								}}>
									{t('settings.howItWorks')}
								</h4>
								<svg
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									style={{
										transform: isInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
										transition: 'transform 0.3s ease',
										marginLeft: '10px',
										flexShrink: 0
									}}
								>
									<path
										d="M5 7.5L10 12.5L15 7.5"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>
							{isInfoExpanded && (
								<ul style={{ 
									margin: '15px 0 0 0',
									paddingLeft: '20px',
									lineHeight: '1.8'
								}}>
									<li>{t('settings.info1')}</li>
									<ul style={{ marginTop: '8px', marginBottom: '8px' }}>
										<li>{t('settings.info2')}</li>
										<li>{t('settings.info3')}</li>
										<li>{t('settings.info4')}</li>
									</ul>
									<li>{t('settings.info5')}</li>
									<ul style={{ marginTop: '8px' }}>
										<li>{t('settings.info6')}</li>
										<li>{t('settings.info7')}</li>
									</ul>
								</ul>
							)}
						</div>

						{/* Przełącznik */}
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '20px',
							backgroundColor: '#f8f9fa',
							borderRadius: '8px',
							border: '1px solid #dee2e6',
							marginBottom: '20px'
						}}>
							<div style={{ flex: 1 }}>
								<label style={{
									display: 'flex',
									alignItems: 'center',
									cursor: 'pointer',
									fontSize: '16px',
									fontWeight: '500',
									color: '#2c3e50'
								}}>
									<input
										type="checkbox"
										checked={workOnWeekends}
										onChange={(e) => setWorkOnWeekends(e.target.checked)}
										style={{
											width: '24px',
											height: '24px',
											marginRight: '12px',
											cursor: 'pointer',
											accentColor: '#3498db'
										}}
									/>
									<span>{t('settings.workOnWeekendsLabel')}</span>
								</label>
								<div style={{
									marginTop: '8px',
									fontSize: '14px',
									color: '#7f8c8d',
									marginLeft: '36px'
								}}>
									{workOnWeekends 
										? t('settings.workOnWeekendsEnabled')
										: t('settings.workOnWeekendsDisabled')
									}
								</div>
							</div>
						</div>

						{/* Sekcja konfiguracji dni świątecznych */}
						<h3 style={{ 
							color: '#2c3e50',
							marginTop: '40px',
							marginBottom: '20px',
							fontSize: '20px',
							fontWeight: '600',
							paddingBottom: '10px',
							borderBottom: '2px solid #3498db'
						}}>
							{t('settings.holidaysTitle') || 'Konfiguracja dni świątecznych'}
						</h3>

						{/* Informacje o ustawieniu świąt */}
						<div style={{
							backgroundColor: '#e3f2fd',
							border: '1px solid #90caf9',
							borderRadius: '8px',
							padding: '15px',
							marginBottom: '20px',
							color: '#1565c0'
						}}>
							<button
								type="button"
								onClick={() => setIsHolidayInfoExpanded(!isHolidayInfoExpanded)}
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									width: '100%',
									backgroundColor: 'transparent',
									border: 'none',
									cursor: 'pointer',
									padding: 0,
									margin: 0,
									textAlign: 'left',
									color: '#1565c0'
								}}
							>
								<h4 style={{ 
									margin: 0,
									fontSize: '16px',
									fontWeight: '600'
								}}>
									{t('settings.howItWorks')}
								</h4>
								<svg
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									style={{
										transform: isHolidayInfoExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
										transition: 'transform 0.3s ease',
										marginLeft: '10px',
										flexShrink: 0
									}}
								>
									<path
										d="M5 7.5L10 12.5L15 7.5"
										stroke="currentColor"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>
							{isHolidayInfoExpanded && (
								<ul style={{ 
									margin: '15px 0 0 0',
									paddingLeft: '20px',
									lineHeight: '1.8'
								}}>
									<li>{t('settings.holidayInfo1') || 'Jeśli włączone dni świąteczne:'}</li>
									<ul style={{ marginTop: '8px', marginBottom: '8px' }}>
										<li>{t('settings.holidayInfo2') || 'Dni świąteczne (ustawowo wolne w Polsce) nie są wliczane w liczbę dni wniosku urlopowego'}</li>
										<li>{t('settings.holidayInfo3') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni świąteczne'}</li>
										<li>{t('settings.holidayInfo4') || 'Dni świąteczne są zaznaczane w kalendarzach (Monthly Calendar, User Calendar, Leave Planner, All Leave Plans)'}</li>
										<li>{t('settings.holidayInfo5') || 'Możesz dodać niestandardowe dni świąteczne (np. dla innych krajów)'}</li>
									</ul>
								</ul>
							)}
						</div>

						{/* Przełącznik polskich dni świątecznych */}
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '20px',
							backgroundColor: '#f8f9fa',
							borderRadius: '8px',
							border: '1px solid #dee2e6',
							marginBottom: '20px'
						}}>
							<div style={{ flex: 1 }}>
								<label style={{
									display: 'flex',
									alignItems: 'center',
									cursor: 'pointer',
									fontSize: '16px',
									fontWeight: '500',
									color: '#2c3e50'
								}}>
									<input
										type="checkbox"
										checked={includePolishHolidays}
										onChange={(e) => setIncludePolishHolidays(e.target.checked)}
										style={{
											width: '24px',
											height: '24px',
											marginRight: '12px',
											cursor: 'pointer',
											accentColor: '#3498db'
										}}
									/>
									<span>{t('settings.includePolishHolidaysLabel') || 'Uwzględnij polskie dni świąteczne (ustawowo wolne w Polsce)'}</span>
									<button
										type="button"
										onClick={(e) => {
											e.preventDefault()
											e.stopPropagation()
											setIsPolishHolidaysModalOpen(true)
										}}
										style={{
											marginLeft: '8px',
											background: 'transparent',
											border: 'none',
											cursor: 'pointer',
											padding: '4px',
											display: 'inline-flex',
											alignItems: 'center',
											justifyContent: 'center',
											color: '#3498db',
											transition: 'color 0.2s'
										}}
										onMouseEnter={(e) => e.target.style.color = '#2980b9'}
										onMouseLeave={(e) => e.target.style.color = '#3498db'}
										title={t('settings.viewPolishHolidays') || 'Zobacz listę polskich dni świątecznych'}
									>
										<svg
											width="18"
											height="18"
											viewBox="0 0 24 24"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
											<path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
											<circle cx="12" cy="8" r="1" fill="currentColor"/>
										</svg>
									</button>
								</label>
								<div style={{
									marginTop: '8px',
									fontSize: '14px',
									color: '#7f8c8d',
									marginLeft: '36px'
								}}>
									{includePolishHolidays 
										? (t('settings.includePolishHolidaysEnabled') || 'Polskie dni świąteczne są wliczane w logikę wniosków urlopowych i zaznaczane w kalendarzach')
										: (t('settings.includePolishHolidaysDisabled') || 'Polskie dni świąteczne NIE są uwzględniane')
									}
								</div>
							</div>
						</div>

						{/* Przełącznik niestandardowych dni świątecznych */}
						<div style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							padding: '20px',
							backgroundColor: '#f8f9fa',
							borderRadius: '8px',
							border: '1px solid #dee2e6',
							marginBottom: '20px'
						}}>
							<div style={{ flex: 1 }}>
								<label style={{
									display: 'flex',
									alignItems: 'center',
									cursor: 'pointer',
									fontSize: '16px',
									fontWeight: '500',
									color: '#2c3e50'
								}}>
									<input
										type="checkbox"
										checked={includeCustomHolidays}
										onChange={(e) => setIncludeCustomHolidays(e.target.checked)}
										style={{
											width: '24px',
											height: '24px',
											marginRight: '12px',
											cursor: 'pointer',
											accentColor: '#3498db'
										}}
									/>
									<span>{t('settings.includeCustomHolidaysLabel') || 'Uwzględnij niestandardowe dni świąteczne'}</span>
								</label>
								<div style={{
									marginTop: '8px',
									fontSize: '14px',
									color: '#7f8c8d',
									marginLeft: '36px'
								}}>
									{includeCustomHolidays 
										? (t('settings.includeCustomHolidaysEnabled') || 'Niestandardowe dni świąteczne są wliczane w logikę wniosków urlopowych i zaznaczane w kalendarzach')
										: (t('settings.includeCustomHolidaysDisabled') || 'Niestandardowe dni świąteczne NIE są uwzględniane')
									}
								</div>
							</div>
						</div>

						{/* Niestandardowe dni świąteczne - tylko gdy includeCustomHolidays jest włączone */}
						{includeCustomHolidays && (
							<div style={{
								backgroundColor: '#fff9e6',
								border: '1px solid #ffd700',
								borderRadius: '8px',
								padding: '20px',
								marginBottom: '20px'
							}}>
							<h4 style={{
								marginBottom: '15px',
								fontSize: '18px',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{t('settings.customHolidaysTitle') || 'Niestandardowe dni świąteczne'}
							</h4>
							<p style={{
								marginBottom: '15px',
								fontSize: '14px',
								color: '#7f8c8d'
							}}>
								{t('settings.customHolidaysDescription') || 'Dodaj niestandardowe dni świąteczne (np. dla innych krajów). Te dni będą działać tak samo jak święta polskie.'}
							</p>
							
							{/* Formularz dodawania */}
							<div style={{
								display: 'flex',
								gap: '10px',
								marginBottom: '20px',
								flexWrap: 'wrap'
							}}>
								<input
									type="date"
									value={newHolidayDate}
									onChange={(e) => setNewHolidayDate(e.target.value)}
									style={{
										flex: 1,
										minWidth: '150px',
										padding: '10px',
										border: '1px solid #dee2e6',
										borderRadius: '6px',
										fontSize: '14px'
									}}
									placeholder={t('settings.holidayDatePlaceholder') || 'Data'}
								/>
								<input
									type="text"
									value={newHolidayName}
									onChange={(e) => setNewHolidayName(e.target.value)}
									style={{
										flex: 2,
										minWidth: '200px',
										padding: '10px',
										border: '1px solid #dee2e6',
										borderRadius: '6px',
										fontSize: '14px'
									}}
									placeholder={t('settings.holidayNamePlaceholder') || 'Nazwa święta'}
								/>
								<button
									type="button"
									onClick={handleAddCustomHoliday}
									style={{
										padding: '10px 20px',
										backgroundColor: '#28a745',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										fontSize: '14px',
										fontWeight: '500',
										cursor: 'pointer',
										transition: 'all 0.2s'
									}}
									onMouseEnter={(e) => {
										e.target.style.backgroundColor = '#218838'
									}}
									onMouseLeave={(e) => {
										e.target.style.backgroundColor = '#28a745'
									}}
								>
									{t('settings.addHoliday') || 'Dodaj'}
								</button>
							</div>

							{/* Lista niestandardowych świąt */}
							{customHolidays.length > 0 && (
								<div>
									<h5 style={{
										marginBottom: '10px',
										fontSize: '16px',
										fontWeight: '600',
										color: '#2c3e50'
									}}>
										{t('settings.customHolidaysList') || 'Dodane niestandardowe święta:'}
									</h5>
									<div style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '8px'
									}}>
										{customHolidays.map((holiday, index) => (
											<div
												key={index}
												style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'center',
													padding: '10px',
													backgroundColor: 'white',
													border: '1px solid #dee2e6',
													borderRadius: '6px'
												}}
											>
												<div>
													<div style={{ fontWeight: '600', color: '#2c3e50' }}>
														{new Date(holiday.date).toLocaleDateString('pl-PL', { 
															year: 'numeric', 
															month: 'long', 
															day: 'numeric' 
														})}
													</div>
													<div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '4px' }}>
														{holiday.name}
													</div>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveCustomHoliday(holiday.date)}
													style={{
														padding: '6px 12px',
														backgroundColor: '#dc3545',
														color: 'white',
														border: 'none',
														borderRadius: '4px',
														fontSize: '14px',
														cursor: 'pointer',
														transition: 'all 0.2s'
													}}
													onMouseEnter={(e) => {
														e.target.style.backgroundColor = '#c82333'
													}}
													onMouseLeave={(e) => {
														e.target.style.backgroundColor = '#dc3545'
													}}
												>
													{t('settings.removeHoliday') || 'Usuń'}
												</button>
											</div>
										))}
									</div>
								</div>
							)}
						</div>
						)}

						{/* Sekcja konfiguracji godzin pracy */}
						{canEditSettings && (
							<>
								<h3 style={{ 
									color: '#2c3e50',
									marginTop: '40px',
									marginBottom: '20px',
									fontSize: '20px',
									fontWeight: '600',
									paddingBottom: '10px',
									borderBottom: '2px solid #3498db'
								}}>
									{t('settings.workHoursTitle') || 'Konfiguracja godzin pracy'}
								</h3>

								<div style={{
									backgroundColor: '#e3f2fd',
									border: '1px solid #90caf9',
									borderRadius: '8px',
									padding: '15px',
									marginBottom: '20px',
									color: '#1565c0'
								}}>
									<p style={{ margin: 0, lineHeight: '1.6' }}>
										{t('settings.workHoursDescription') || 'Skonfiguruj standardowe godziny pracy dla Twojego zespołu. Te godziny będą automatycznie wypełniane w formularzu kalendarza w ewidencji czasu pracy, co znacznie przyspieszy wprowadzanie danych.'}
									</p>
								</div>

								<div style={{
									backgroundColor: '#f8f9fa',
									border: '1px solid #dee2e6',
									borderRadius: '8px',
									padding: '20px',
									marginBottom: '20px'
								}}>
									<h4 style={{
										marginBottom: '15px',
										fontSize: '18px',
										fontWeight: '600',
										color: '#2c3e50'
									}}>
										{t('settings.workHoursCommonTitle') || 'Wspólne godziny pracy dla wszystkich dni'}
									</h4>

									{/* Lista istniejących konfiguracji */}
									{workHoursList.length > 0 && (
										<div style={{ marginBottom: '20px' }}>
											{workHoursList.map((workHours, index) => (
												<div
													key={index}
													style={{
														display: 'flex',
														justifyContent: 'space-between',
														alignItems: 'center',
														padding: '12px',
														backgroundColor: 'white',
														border: '1px solid #dee2e6',
														borderRadius: '6px',
														marginBottom: '10px'
													}}
												>
													<div style={{ flex: 1 }}>
														<div style={{
															fontWeight: '600',
															color: '#2c3e50',
															marginBottom: '4px'
														}}>
															{workHours.timeFrom} - {workHours.timeTo}
														</div>
														<div style={{ fontSize: '14px', color: '#6c757d' }}>
															{workHours.hours} {t('settings.hours') || 'godzin'}
														</div>
													</div>
													<div style={{ display: 'flex', gap: '8px' }}>
														<button
															type="button"
															onClick={() => handleEditWorkHours(index)}
															style={{
																backgroundColor: '#3498db',
																color: 'white',
																border: 'none',
																padding: '6px 12px',
																borderRadius: '4px',
																fontSize: '14px',
																cursor: 'pointer',
																transition: 'all 0.2s'
															}}
															onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
															onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
														>
															{t('settings.edit') || 'Edytuj'}
														</button>
														<button
															type="button"
															onClick={() => handleDeleteWorkHours(index)}
															style={{
																backgroundColor: '#dc3545',
																color: 'white',
																border: 'none',
																padding: '6px 12px',
																borderRadius: '4px',
																fontSize: '14px',
																cursor: 'pointer',
																transition: 'all 0.2s'
															}}
															onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
															onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
														>
															{t('settings.delete') || 'Usuń'}
														</button>
													</div>
												</div>
											))}
										</div>
									)}

									{/* Formularz dodawania/edycji */}
									<div style={{
										backgroundColor: editingWorkHoursIndex !== null ? '#fff3cd' : 'white',
										border: `2px solid ${editingWorkHoursIndex !== null ? '#ffc107' : '#dee2e6'}`,
										borderRadius: '6px',
										padding: '15px',
										marginBottom: '15px'
									}}>
									<div style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
										gap: '15px',
										alignItems: 'end'
									}}>
										<div>
											<label style={{
												display: 'block',
												marginBottom: '10px',
												fontWeight: '600',
												color: '#2c3e50',
												fontSize: '16px'
											}}>
												{t('settings.workHoursFrom') || 'Od'}
											</label>
											<input
												type="text"
												inputMode="numeric"
												value={newWorkHours.timeFrom}
												onChange={(e) => {
													const timeFrom = e.target.value
													setNewWorkHours({
														...newWorkHours,
														timeFrom,
														hours: newWorkHours.timeTo ? calculateHours(timeFrom, newWorkHours.timeTo) : 0
													})
												}}
												placeholder="09:00"
												style={{
													width: '100%',
													padding: '16px',
													border: '2px solid #dee2e6',
													borderRadius: '8px',
													fontSize: '18px',
													backgroundColor: 'white',
													minHeight: '48px',
													boxSizing: 'border-box',
													WebkitAppearance: 'none',
													MozAppearance: 'textfield'
												}}
											/>
										</div>
										<div>
											<label style={{
												display: 'block',
												marginBottom: '10px',
												fontWeight: '600',
												color: '#2c3e50',
												fontSize: '16px'
											}}>
												{t('settings.workHoursTo') || 'Do'}
											</label>
											<input
												type="text"
												inputMode="numeric"
												value={newWorkHours.timeTo}
												onChange={(e) => {
													const timeTo = e.target.value
													setNewWorkHours({
														...newWorkHours,
														timeTo,
														hours: newWorkHours.timeFrom ? calculateHours(newWorkHours.timeFrom, timeTo) : 0
													})
												}}
												placeholder="17:00"
												style={{
													width: '100%',
													padding: '16px',
													border: '2px solid #dee2e6',
													borderRadius: '8px',
													fontSize: '18px',
													backgroundColor: 'white',
													minHeight: '48px',
													boxSizing: 'border-box',
													WebkitAppearance: 'none',
													MozAppearance: 'textfield'
												}}
											/>
										</div>
										<div>
											<label style={{
												display: 'block',
												marginBottom: '10px',
												fontWeight: '600',
												color: '#2c3e50',
												fontSize: '16px'
											}}>
												{t('settings.workHoursHours') || 'Godziny'}
											</label>
											<input
												type="number"
												value={newWorkHours.hours}
												readOnly
												style={{
													width: '100%',
													padding: '16px',
													border: '2px solid #dee2e6',
													borderRadius: '8px',
													fontSize: '18px',
													backgroundColor: '#e9ecef',
													cursor: 'not-allowed',
													minHeight: '48px',
													boxSizing: 'border-box',
													WebkitAppearance: 'none',
													MozAppearance: 'textfield'
												}}
											/>
										</div>
										<div style={{ 
											display: 'flex', 
											gap: '10px',
											alignItems: 'flex-end',
											gridColumn: '1 / -1'
										}}>
											{editingWorkHoursIndex !== null ? (
												<>
													<button
														type="button"
														onClick={() => handleUpdateWorkHours(editingWorkHoursIndex)}
														style={{
															backgroundColor: '#28a745',
															color: 'white',
															border: 'none',
															padding: '14px 20px',
															borderRadius: '8px',
															fontSize: '16px',
															fontWeight: '600',
															cursor: 'pointer',
															transition: 'all 0.2s',
															minHeight: '48px',
															flex: 1
														}}
														onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
														onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
													>
														{t('settings.save') || 'Zapisz'}
													</button>
													<button
														type="button"
														onClick={handleCancelEditWorkHours}
														style={{
															backgroundColor: '#6c757d',
															color: 'white',
															border: 'none',
															padding: '14px 20px',
															borderRadius: '8px',
															fontSize: '16px',
															fontWeight: '600',
															cursor: 'pointer',
															transition: 'all 0.2s',
															minHeight: '48px',
															flex: 1
														}}
														onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
														onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
													>
														{t('settings.cancel') || 'Anuluj'}
													</button>
												</>
											) : (
												<button
													type="button"
													onClick={handleAddWorkHours}
													style={{
														backgroundColor: '#28a745',
														color: 'white',
														border: 'none',
														padding: '14px 24px',
														borderRadius: '8px',
														fontSize: '18px',
														fontWeight: '600',
														cursor: 'pointer',
														transition: 'all 0.2s',
														minHeight: '48px',
														width: '100%'
													}}
													onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
													onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
												>
													+ {t('settings.add') || 'Dodaj'}
												</button>
											)}
										</div>
									</div>
									</div>
								</div>
							</>
						)}

						{/* Sekcja zarządzania typami wniosków urlopowych */}
				{canEditSettings && (
					<div style={{ 
						backgroundColor: 'white',
						marginBottom: '30px'
					}}>
						<h3 style={{ 
							color: '#2c3e50',
							marginTop: '40px',
							marginBottom: '20px',
							fontSize: '20px',
							fontWeight: '600',
							paddingBottom: '10px',
							borderBottom: '2px solid #3498db'
						}}>
							{t('settings.leaveRequestTypesTitle') || 'Typy wniosków urlopowych'}
						</h3>

						<div style={{
							backgroundColor: '#e3f2fd',
							border: '1px solid #90caf9',
							borderRadius: '8px',
							padding: '15px',
							marginBottom: '20px',
							color: '#1565c0'
						}}>
							<p style={{ margin: 0, lineHeight: '1.6' }}>
								{t('settings.leaveRequestTypesDescription') || 'Skonfiguruj dostępne typy wniosków urlopowych dla Twojego zespołu. Możesz włączać/wyłączać typy systemowe oraz dodawać własne niestandardowe typy.'}
							</p>
						</div>

						{/* Lista typów systemowych */}
						<div style={{ marginBottom: '30px' }}>
							<h4 style={{
								marginBottom: '15px',
								fontSize: '18px',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{t('settings.systemTypes') || 'Typy systemowe'}
							</h4>
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '15px'
							}}>
								{leaveRequestTypes.filter(type => type.isSystem).map(type => {
									const displayName = i18n.resolvedLanguage === 'en' && type.nameEn ? type.nameEn : type.name
									return (
										<div key={type.id} style={{
											backgroundColor: '#f8f9fa',
											border: '1px solid #dee2e6',
											borderRadius: '8px',
											padding: '15px'
										}}>
											<div style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												marginBottom: '12px'
											}}>
												<div style={{ flex: 1 }}>
													<div style={{
														fontWeight: '600',
														fontSize: '16px',
														color: '#2c3e50',
														marginBottom: '4px'
													}}>
														{displayName}
													</div>
													{type.nameEn && i18n.resolvedLanguage === 'pl' && (
														<div style={{ fontSize: '14px', color: '#6c757d' }}>
															{type.nameEn}
														</div>
													)}
												</div>
												<label style={{
													display: 'flex',
													alignItems: 'center',
													cursor: 'pointer',
													marginLeft: '15px'
												}}>
													<input
														type="checkbox"
														checked={type.isEnabled}
														onChange={() => handleToggleTypeEnabled(type.id)}
														style={{
															width: '18px',
															height: '18px',
															cursor: 'pointer',
															marginRight: '8px'
														}}
													/>
													<span style={{ fontSize: '14px', color: '#2c3e50' }}>
														{t('settings.enabled') || 'Włączony'}
													</span>
												</label>
											</div>
											{type.isEnabled && (
												<div style={{
													display: 'grid',
													gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
													gap: '15px',
													marginTop: '12px',
													paddingTop: '12px',
													borderTop: '1px solid #dee2e6'
												}}>
													<label style={{
														display: 'flex',
														alignItems: 'center',
														cursor: 'pointer'
													}}>
														<input
															type="checkbox"
															checked={type.requireApproval}
															onChange={() => handleToggleTypeRequireApproval(type.id)}
															style={{
																width: '18px',
																height: '18px',
																cursor: 'pointer',
																marginRight: '8px'
															}}
														/>
														<span style={{ fontSize: '14px', color: '#2c3e50' }}>
															{t('settings.requireApproval') || 'Wymaga zatwierdzenia'}
														</span>
													</label>
													<label style={{
														display: 'flex',
														alignItems: 'center',
														cursor: 'pointer'
													}}>
														<input
															type="checkbox"
															checked={type.allowDaysLimit}
															onChange={() => handleToggleTypeAllowDaysLimit(type.id)}
															style={{
																width: '18px',
																height: '18px',
																cursor: 'pointer',
																marginRight: '8px'
															}}
														/>
														<span style={{ fontSize: '14px', color: '#2c3e50' }}>
															{t('settings.allowDaysLimit') || 'Możliwość ustawienia liczby dni'}
														</span>
													</label>
													<div style={{
														display: 'flex',
														flexDirection: 'column',
														gap: '8px',
														gridColumn: '1 / -1'
													}}>
														<label style={{
															display: 'flex',
															alignItems: 'center',
															cursor: 'pointer'
														}}>
															<input
																type="checkbox"
																checked={type.minDaysBefore !== null && type.minDaysBefore !== undefined}
																onChange={() => handleToggleTypeMinDaysBefore(type.id)}
																style={{
																	width: '18px',
																	height: '18px',
																	cursor: 'pointer',
																	marginRight: '8px'
																}}
															/>
															<span style={{ fontSize: '14px', color: '#2c3e50' }}>
																{t('settings.minDaysBeforeEnabled') || 'Ograniczenie dni przed urlopem'}
															</span>
														</label>
														{type.minDaysBefore !== null && type.minDaysBefore !== undefined && (
															<div style={{
																display: 'flex',
																alignItems: 'center',
																gap: '10px',
																marginLeft: '26px'
															}}>
																<label style={{
																	fontSize: '14px',
																	color: '#2c3e50',
																	fontWeight: '500'
																}}>
																	{t('settings.minDaysBeforeLabel') || 'Maksymalnie dni przed:'}
																</label>
																<input
																	type="number"
																	min="1"
																	value={type.minDaysBefore || ''}
																	onChange={(e) => {
																		const value = e.target.value
																		if (value === '' || value === null) {
																			handleUpdateTypeMinDaysBefore(type.id, null)
																		} else {
																			const numValue = parseInt(value, 10)
																			if (!isNaN(numValue) && numValue > 0) {
																				handleUpdateTypeMinDaysBefore(type.id, numValue)
																			}
																		}
																	}}
																	onBlur={(e) => {
																		const value = e.target.value
																		if (value === '' || parseInt(value, 10) < 1) {
																			handleUpdateTypeMinDaysBefore(type.id, 5) // Domyślnie 5 jeśli puste
																		}
																	}}
																	style={{
																		width: '80px',
																		padding: '6px 10px',
																		border: '1px solid #dee2e6',
																		borderRadius: '4px',
																		fontSize: '14px'
																	}}
																	placeholder="30"
																/>
															</div>
														)}
													</div>
												</div>
											)}
										</div>
									)
								})}
							</div>
						</div>

						{/* Lista typów niestandardowych */}
						<div style={{ marginBottom: '30px' }}>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: '15px'
							}}>
								<h4 style={{
									margin: 0,
									fontSize: '18px',
									fontWeight: '600',
									color: '#2c3e50'
								}}>
									{t('settings.customTypes') || 'Typy niestandardowe'}
								</h4>
								{!showAddCustomTypeForm && (
									<button
										type="button"
										onClick={() => setShowAddCustomTypeForm(true)}
										style={{
											backgroundColor: '#28a745',
											color: 'white',
											border: 'none',
											padding: '8px 16px',
											borderRadius: '6px',
											fontSize: '14px',
											fontWeight: '500',
											cursor: 'pointer',
											transition: 'all 0.2s'
										}}
										onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
										onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
									>
										+ {t('settings.addCustomType') || 'Dodaj typ'}
										</button>
								)}
									</div>

							{showAddCustomTypeForm && (
								<div style={{
									backgroundColor: '#fff3cd',
									border: '2px solid #ffc107',
									borderRadius: '8px',
									padding: '20px',
									marginBottom: '20px'
								}}>
									<h5 style={{
										marginTop: 0,
										marginBottom: '15px',
										fontSize: '16px',
										fontWeight: '600',
										color: '#856404'
									}}>
										{t('settings.newCustomType') || 'Nowy typ niestandardowy'}
									</h5>
									<div style={{
										display: 'flex',
										flexDirection: 'column',
										gap: '15px'
									}}>
										<div>
											<label style={{
												display: 'block',
												marginBottom: '8px',
												fontWeight: '600',
												color: '#2c3e50',
												fontSize: '14px'
											}}>
												{t('settings.typeName') || 'Nazwa (PL)'} *
											</label>
											<input
												type="text"
												value={newCustomType.name}
												onChange={(e) => setNewCustomType({ ...newCustomType, name: e.target.value })}
												placeholder={t('settings.typeNamePlaceholder') || 'np. Urlop okolicznościowy'}
												style={{
													width: '100%',
													padding: '10px',
													border: '1px solid #dee2e6',
													borderRadius: '6px',
													fontSize: '14px'
												}}
											/>
								</div>
										<div>
											<label style={{
												display: 'block',
												marginBottom: '8px',
												fontWeight: '600',
												color: '#2c3e50',
												fontSize: '14px'
											}}>
												{t('settings.typeNameEn') || 'Nazwa (EN) (opcjonalnie)'}
											</label>
											<input
												type="text"
												value={newCustomType.nameEn}
												onChange={(e) => setNewCustomType({ ...newCustomType, nameEn: e.target.value })}
												placeholder={t('settings.typeNameEnPlaceholder') || 'e.g. Special Leave'}
												style={{
													width: '100%',
													padding: '10px',
													border: '1px solid #dee2e6',
													borderRadius: '6px',
													fontSize: '14px'
												}}
											/>
										</div>
										<div style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '15px'
										}}>
											<div style={{
												display: 'grid',
												gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
												gap: '15px'
											}}>
												<label style={{
													display: 'flex',
													alignItems: 'center',
													cursor: 'pointer'
												}}>
													<input
														type="checkbox"
														checked={newCustomType.requireApproval}
														onChange={(e) => setNewCustomType({ ...newCustomType, requireApproval: e.target.checked })}
														style={{
															width: '18px',
															height: '18px',
															cursor: 'pointer',
															marginRight: '8px'
														}}
													/>
													<span style={{ fontSize: '14px', color: '#2c3e50' }}>
														{t('settings.requireApproval') || 'Wymaga zatwierdzenia'}
													</span>
												</label>
												<label style={{
													display: 'flex',
													alignItems: 'center',
													cursor: 'pointer'
												}}>
													<input
														type="checkbox"
														checked={newCustomType.allowDaysLimit}
														onChange={(e) => setNewCustomType({ ...newCustomType, allowDaysLimit: e.target.checked })}
														style={{
															width: '18px',
															height: '18px',
															cursor: 'pointer',
															marginRight: '8px'
														}}
													/>
													<span style={{ fontSize: '14px', color: '#2c3e50' }}>
														{t('settings.allowDaysLimit') || 'Możliwość ustawienia liczby dni'}
													</span>
												</label>
											</div>
											<div style={{
												display: 'flex',
												flexDirection: 'column',
												gap: '8px'
											}}>
												<label style={{
													display: 'flex',
													alignItems: 'center',
													cursor: 'pointer'
												}}>
													<input
														type="checkbox"
														checked={newCustomType.minDaysBefore !== null && newCustomType.minDaysBefore !== undefined}
														onChange={(e) => {
															if (e.target.checked) {
																setNewCustomType({ ...newCustomType, minDaysBefore: 30 })
															} else {
																setNewCustomType({ ...newCustomType, minDaysBefore: null })
															}
														}}
														style={{
															width: '18px',
															height: '18px',
															cursor: 'pointer',
															marginRight: '8px'
														}}
													/>
													<span style={{ fontSize: '14px', color: '#2c3e50' }}>
														{t('settings.minDaysBeforeEnabled') || 'Ograniczenie dni przed urlopem'}
													</span>
												</label>
												{newCustomType.minDaysBefore !== null && newCustomType.minDaysBefore !== undefined && (
													<div style={{
														display: 'flex',
														alignItems: 'center',
														gap: '10px',
														marginLeft: '26px'
													}}>
														<label style={{
															fontSize: '14px',
															color: '#2c3e50',
															fontWeight: '500'
														}}>
															{t('settings.minDaysBeforeLabel') || 'Maksymalnie dni przed:'}
														</label>
														<input
															type="number"
															min="1"
															value={newCustomType.minDaysBefore || ''}
															onChange={(e) => {
																const value = e.target.value
																if (value === '' || value === null) {
																	setNewCustomType({ ...newCustomType, minDaysBefore: null })
																} else {
																	const numValue = parseInt(value, 10)
																	if (!isNaN(numValue) && numValue > 0) {
																		setNewCustomType({ ...newCustomType, minDaysBefore: numValue })
																	}
																}
															}}
															style={{
																width: '80px',
																padding: '6px 10px',
																border: '1px solid #dee2e6',
																borderRadius: '4px',
																fontSize: '14px'
															}}
															placeholder="30"
														/>
													</div>
												)}
											</div>
										</div>
										<div style={{
											display: 'flex',
											gap: '10px',
											justifyContent: 'flex-end'
										}}>
											<button
												type="button"
												onClick={() => {
													setShowAddCustomTypeForm(false)
													setNewCustomType({ name: '', nameEn: '', requireApproval: true, allowDaysLimit: false, minDaysBefore: null })
												}}
												style={{
													backgroundColor: '#6c757d',
													color: 'white',
													border: 'none',
													padding: '8px 16px',
													borderRadius: '6px',
													fontSize: '14px',
													fontWeight: '500',
													cursor: 'pointer'
												}}
											>
												{t('settings.cancel') || 'Anuluj'}
											</button>
											<button
												type="button"
												onClick={handleAddCustomType}
												disabled={addCustomLeaveRequestTypeMutation.isPending}
												style={{
													backgroundColor: addCustomLeaveRequestTypeMutation.isPending ? '#95a5a6' : '#28a745',
													color: 'white',
													border: 'none',
													padding: '8px 16px',
													borderRadius: '6px',
													fontSize: '14px',
													fontWeight: '500',
													cursor: addCustomLeaveRequestTypeMutation.isPending ? 'not-allowed' : 'pointer'
												}}
											>
												{t('settings.add') || 'Dodaj'}
											</button>
										</div>
									</div>
								</div>
							)}

							{leaveRequestTypes.filter(type => !type.isSystem).length > 0 ? (
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '15px'
								}}>
									{leaveRequestTypes.filter(type => !type.isSystem).map(type => {
										const displayName = i18n.resolvedLanguage === 'en' && type.nameEn ? type.nameEn : type.name
										return (
											<div key={type.id} style={{
												backgroundColor: '#f8f9fa',
												border: '1px solid #dee2e6',
												borderRadius: '8px',
												padding: '15px',
												position: 'relative'
											}}>
												<div style={{
													display: 'flex',
													justifyContent: 'space-between',
													alignItems: 'flex-start',
													marginBottom: '12px'
												}}>
													<div style={{ flex: 1 }}>
														<div style={{
															fontWeight: '600',
															fontSize: '16px',
															color: '#2c3e50',
															marginBottom: '4px'
														}}>
															{displayName}
														</div>
														{type.nameEn && i18n.resolvedLanguage === 'pl' && (
															<div style={{ fontSize: '14px', color: '#6c757d' }}>
																{type.nameEn}
															</div>
														)}
													</div>
													<button
														type="button"
														onClick={() => handleDeleteCustomType(type.id)}
														disabled={deleteCustomLeaveRequestTypeMutation.isPending}
														style={{
															backgroundColor: 'transparent',
															border: 'none',
															color: '#dc3545',
															cursor: deleteCustomLeaveRequestTypeMutation.isPending ? 'not-allowed' : 'pointer',
															fontSize: '20px',
															padding: '4px 8px',
															marginLeft: '15px'
														}}
														title={t('settings.delete') || 'Usuń'}
													>
														×
													</button>
												</div>
												<div style={{
													display: 'grid',
													gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
													gap: '15px',
													marginTop: '12px',
													paddingTop: '12px',
													borderTop: '1px solid #dee2e6'
												}}>
													<label style={{
														display: 'flex',
														alignItems: 'center',
														cursor: 'pointer'
													}}>
														<input
															type="checkbox"
															checked={type.requireApproval}
															onChange={() => handleToggleTypeRequireApproval(type.id)}
															style={{
																width: '18px',
																height: '18px',
																cursor: 'pointer',
																marginRight: '8px'
															}}
														/>
														<span style={{ fontSize: '14px', color: '#2c3e50' }}>
															{t('settings.requireApproval') || 'Wymaga zatwierdzenia'}
														</span>
													</label>
													<label style={{
														display: 'flex',
														alignItems: 'center',
														cursor: 'pointer'
													}}>
														<input
															type="checkbox"
															checked={type.allowDaysLimit}
															onChange={() => handleToggleTypeAllowDaysLimit(type.id)}
															style={{
																width: '18px',
																height: '18px',
																cursor: 'pointer',
																marginRight: '8px'
															}}
														/>
														<span style={{ fontSize: '14px', color: '#2c3e50' }}>
															{t('settings.allowDaysLimit') || 'Możliwość ustawienia liczby dni'}
														</span>
													</label>
													<div style={{
														display: 'flex',
														flexDirection: 'column',
														gap: '8px',
														gridColumn: '1 / -1'
													}}>
														<label style={{
															display: 'flex',
															alignItems: 'center',
															cursor: 'pointer'
														}}>
															<input
																type="checkbox"
																checked={type.minDaysBefore !== null && type.minDaysBefore !== undefined}
																onChange={() => handleToggleTypeMinDaysBefore(type.id)}
																style={{
																	width: '18px',
																	height: '18px',
																	cursor: 'pointer',
																	marginRight: '8px'
																}}
															/>
															<span style={{ fontSize: '14px', color: '#2c3e50' }}>
																{t('settings.minDaysBeforeEnabled') || 'Ograniczenie dni przed urlopem'}
															</span>
														</label>
														{type.minDaysBefore !== null && type.minDaysBefore !== undefined && (
															<div style={{
																display: 'flex',
																alignItems: 'center',
																gap: '10px',
																marginLeft: '26px'
															}}>
																<label style={{
																	fontSize: '14px',
																	color: '#2c3e50',
																	fontWeight: '500'
																}}>
																	{t('settings.minDaysBeforeLabel') || 'Maksymalnie dni przed:'}
																</label>
																<input
																	type="number"
																	min="1"
																	value={type.minDaysBefore || ''}
																	onChange={(e) => {
																		const value = e.target.value
																		if (value === '' || value === null) {
																			handleUpdateTypeMinDaysBefore(type.id, null)
																		} else {
																			const numValue = parseInt(value, 10)
																			if (!isNaN(numValue) && numValue > 0) {
																				handleUpdateTypeMinDaysBefore(type.id, numValue)
																			}
																		}
																	}}
																	onBlur={(e) => {
																		const value = e.target.value
																		if (value === '' || parseInt(value, 10) < 1) {
																			handleUpdateTypeMinDaysBefore(type.id, 5) // Domyślnie 5 jeśli puste
																		}
																	}}
																	style={{
																		width: '80px',
																		padding: '6px 10px',
																		border: '1px solid #dee2e6',
																		borderRadius: '4px',
																		fontSize: '14px'
																	}}
																	placeholder="30"
																/>
															</div>
														)}
													</div>
												</div>
											</div>
										)
									})}
								</div>
							) : (
								!showAddCustomTypeForm && (
									<p style={{
										color: '#6c757d',
										fontStyle: 'italic',
										margin: 0
									}}>
										{t('settings.noCustomTypes') || 'Brak niestandardowych typów. Kliknij "Dodaj typ" aby dodać nowy.'}
									</p>
								)
							)}
						</div>
					</div>
						)}

						{/* Przycisk zapisu */}
						<div style={{ textAlign: 'left' }}>
							<button
								onClick={handleSave}
								disabled={updateSettingsMutation.isPending}
								style={{
									backgroundColor: updateSettingsMutation.isPending ? '#95a5a6' : '#3498db',
									color: 'white',
									border: 'none',
									padding: '12px 24px',
									borderRadius: '6px',
									fontSize: '16px',
									fontWeight: '500',
									cursor: updateSettingsMutation.isPending ? 'not-allowed' : 'pointer',
									transition: 'all 0.2s',
									boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
								}}
								onMouseEnter={(e) => {
									if (!updateSettingsMutation.isPending) {
										e.target.style.backgroundColor = '#2980b9'
										e.target.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.15)'
									}
								}}
								onMouseLeave={(e) => {
									if (!updateSettingsMutation.isPending) {
										e.target.style.backgroundColor = '#3498db'
										e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)'
									}
								}}
							>
								{updateSettingsMutation.isPending ? (
									<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
										<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('settings.saving')}
									</span>
								) : (
									t('settings.save')
								)}
							</button>
						</div>
					</div>
				)}

				

				{/* Informacja dla użytkowników bez uprawnień - tylko jeśli nie ma żadnych dostępnych sekcji */}
				{!canEditSettings && !pushSupported && (
					<div style={{ 
						backgroundColor: 'white',
						borderRadius: '12px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '15px',
						textAlign: 'center'
					}}>
						<p style={{ 
							color: '#7f8c8d',
							fontSize: '16px'
						}}>
							{t('settings.noAccess')}
						</p>
					</div>
				)}

				{/* Modal z listą polskich dni świątecznych */}
				<Modal
					isOpen={isPolishHolidaysModalOpen}
					onRequestClose={() => setIsPolishHolidaysModalOpen(false)}
					style={{
						overlay: {
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							backdropFilter: 'blur(2px)',
							WebkitBackdropFilter: 'blur(2px)',
						},
						content: {
							position: 'relative',
							inset: 'unset',
							margin: '0',
							maxWidth: '600px',
							width: '90%',
							maxHeight: '90vh',
							overflowY: 'auto',
							borderRadius: '1rem',
							padding: '2rem',
							backgroundColor: '#fff',
							border: 'none',
							boxShadow: '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
						},
					}}
					contentLabel={t('settings.polishHolidaysModalTitle') || 'Polskie dni świąteczne'}
				>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
						<h2 style={{ 
							margin: 0,
							color: '#2c3e50',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('settings.polishHolidaysModalTitle') || 'Polskie dni świąteczne'}
						</h2>
					
						<button
							onClick={() => setIsPolishHolidaysModalOpen(false)}
							style={{
								background: 'transparent',
								border: 'none',
								fontSize: '28px',
								cursor: 'pointer',
								color: '#7f8c8d',
								lineHeight: '1',
								padding: '0',
								width: '30px',
								height: '30px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center'
							}}
							onMouseEnter={(e) => e.target.style.color = '#2c3e50'}
							onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}
						>
							×
						</button>
					</div>
					<div style={{
						backgroundColor: '#f8f9fa',
						borderRadius: '8px',
						padding: '20px',
						marginBottom: '20px'
					}}>
						<p style={{
							marginBottom: '15px',
							color: '#2c3e50',
							fontSize: '16px',
							fontWeight: '500'
						}}>
							{t('settings.polishHolidaysDescription') || 'Lista polskich dni świątecznych (ustawowo wolne w Polsce):'}
						</p>
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '10px'
						}}>
							{(() => {
								const currentYear = new Date().getFullYear()
								const polishHolidays = getPolishHolidaysForYear(currentYear)
								return polishHolidays.map((holiday, index) => {
									const dateObj = new Date(holiday.date)
									const formattedDate = dateObj.toLocaleDateString(i18n.resolvedLanguage, {
										day: 'numeric',
										month: 'long',
										year: 'numeric'
									})
									const weekday = dateObj.toLocaleDateString(i18n.resolvedLanguage, {
										weekday: 'long'
									})
									return (
										<div
											key={index}
											style={{
												padding: '12px',
												backgroundColor: 'white',
												borderRadius: '6px',
												border: '1px solid #dee2e6',
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center'
											}}
										>
											<div>
												<div style={{
													fontWeight: '600',
													color: '#2c3e50',
													marginBottom: '4px'
												}}>
													{formattedDate} ({weekday})
												</div>
												<div style={{
													fontSize: '14px',
													color: '#7f8c8d'
												}}>
													{holiday.name}
												</div>
											</div>
										</div>
									)
								})
							})()}
						</div>
					</div>
					<div style={{ textAlign: 'right' }}>
						<button
							onClick={() => setIsPolishHolidaysModalOpen(false)}
							style={{
								backgroundColor: '#3498db',
								color: 'white',
								border: 'none',
								padding: '10px 20px',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '500',
								cursor: 'pointer',
								transition: 'all 0.2s'
							}}
							onMouseEnter={(e) => {
								e.target.style.backgroundColor = '#2980b9'
							}}
							onMouseLeave={(e) => {
								e.target.style.backgroundColor = '#3498db'
							}}
						>
							{t('settings.close') || 'Zamknij'}
						</button>
					</div>
				</Modal>

				{/* Push Notifications Section - Available for all users */}
				{pushSupported && (
					<div style={{ 
						backgroundColor: 'white',
						borderRadius: '12px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '20px',
						marginBottom: '20px'
					}}>
						<h3 style={{ 
							color: '#2c3e50', 
							marginBottom: '20px',
							fontSize: '20px',
							fontWeight: '600'
						}}>
							🔔 {t('settings.pushNotificationsTitle')}
						</h3>
						
						{!pushSubscribed ? (
							<div style={{ marginBottom: '20px' }}>
								<p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
									{t('settings.pushNotificationsDescription')}
								</p>
								<button
									onClick={handleSubscribePush}
									disabled={pushLoading}
									style={{
										backgroundColor: '#27ae60',
										color: 'white',
										border: 'none',
										padding: '12px 24px',
										borderRadius: '6px',
										fontSize: '16px',
										fontWeight: '500',
										cursor: pushLoading ? 'not-allowed' : 'pointer',
										opacity: pushLoading ? 0.6 : 1,
										transition: 'all 0.2s'
									}}
									onMouseEnter={(e) => {
										if (!pushLoading) {
											e.target.style.backgroundColor = '#229954'
										}
									}}
									onMouseLeave={(e) => {
										if (!pushLoading) {
											e.target.style.backgroundColor = '#27ae60'
										}
									}}
								>
									{pushLoading ? t('settings.pushNotificationsProcessing') : t('settings.pushNotificationsEnable')}
								</button>
							</div>
						) : (
							<>
								<div style={{ marginBottom: '20px' }}>
									<p style={{ color: '#27ae60', marginBottom: '15px', fontWeight: '500' }}>
										✓ {t('settings.pushNotificationsEnabled')}
									</p>
									<button
										onClick={handleUnsubscribePush}
										disabled={pushLoading}
										style={{
											backgroundColor: '#e74c3c',
											color: 'white',
											border: 'none',
											padding: '10px 20px',
											borderRadius: '6px',
											fontSize: '14px',
											fontWeight: '500',
											cursor: pushLoading ? 'not-allowed' : 'pointer',
											opacity: pushLoading ? 0.6 : 1,
											transition: 'all 0.2s'
										}}
										onMouseEnter={(e) => {
											if (!pushLoading) {
												e.target.style.backgroundColor = '#c0392b'
											}
										}}
										onMouseLeave={(e) => {
											if (!pushLoading) {
												e.target.style.backgroundColor = '#e74c3c'
											}
										}}
									>
										{pushLoading ? t('settings.pushNotificationsProcessing') : t('settings.pushNotificationsDisable')}
									</button>
								</div>

								<div style={{ 
									borderTop: '1px solid #ecf0f1',
									paddingTop: '20px',
									marginTop: '20px'
								}}>
									<h4 style={{ 
										color: '#2c3e50', 
										marginBottom: '15px',
										fontSize: '16px',
										fontWeight: '600'
									}}>
										{t('settings.pushNotificationsPreferences')}
									</h4>
									
									<div style={{ marginBottom: '15px' }}>
										<label style={{ 
											display: 'flex',
											alignItems: 'center',
											cursor: 'pointer',
											color: '#2c3e50'
										}}>
											<input
												type="checkbox"
												checked={pushPreferences.chat || false}
												onChange={(e) => handleUpdatePushPreferences('chat', e.target.checked)}
												disabled={pushLoading}
												style={{
													marginRight: '10px',
													width: '18px',
													height: '18px',
													cursor: pushLoading ? 'not-allowed' : 'pointer'
												}}
											/>
											<span>{t('settings.pushNotificationsChat')}</span>
										</label>
									</div>

									<div style={{ marginBottom: '15px' }}>
										<label style={{ 
											display: 'flex',
											alignItems: 'center',
											cursor: 'pointer',
											color: '#2c3e50'
										}}>
											<input
												type="checkbox"
												checked={pushPreferences.tasks || false}
												onChange={(e) => handleUpdatePushPreferences('tasks', e.target.checked)}
												disabled={pushLoading}
												style={{
													marginRight: '10px',
													width: '18px',
													height: '18px',
													cursor: pushLoading ? 'not-allowed' : 'pointer'
												}}
											/>
											<span>{t('settings.pushNotificationsTasks')}</span>
										</label>
									</div>

									<div style={{ marginBottom: '15px' }}>
										<label style={{ 
											display: 'flex',
											alignItems: 'center',
											cursor: 'pointer',
											color: '#2c3e50'
										}}>
											<input
												type="checkbox"
												checked={pushPreferences.taskStatusChanges || false}
												onChange={(e) => handleUpdatePushPreferences('taskStatusChanges', e.target.checked)}
												disabled={pushLoading}
												style={{
													marginRight: '10px',
													width: '18px',
													height: '18px',
													cursor: pushLoading ? 'not-allowed' : 'pointer'
												}}
											/>
											<span>{t('settings.pushNotificationsTaskStatus')}</span>
										</label>
									</div>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</>
	)
}

export default Settings

