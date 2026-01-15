import React, { useState, useEffect } from 'react'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useOwnLeaveRequests, useCreateLeaveRequest, useCancelLeaveRequest, useUpdateLeaveRequest } from '../../hooks/useLeaveRequests'
import { useOwnVacationDays } from '../../hooks/useVacation'
import { useSettings } from '../../hooks/useSettings'
import { isHolidayDate as checkHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'

	function LeaveRequestForm() {
	const [type, setType] = useState('')
	const [startDate, setStartDate] = useState('')
	const [endDate, setEndDate] = useState('')
	const [daysRequested, setDaysRequested] = useState(0)
	const [replacement, setReplacement] = useState('')
	const [additionalInfo, setAdditionalInfo] = useState('')
	const { t, i18n } = useTranslation()
	const { showAlert } = useAlert()

	// TanStack Query hooks
	const { data: leaveRequests = [], isLoading: loadingRequests } = useOwnLeaveRequests()
	const { data: vacationData, isLoading: loadingVacation } = useOwnVacationDays()
	const { data: settings } = useSettings()
	
	const availableLeaveDays = vacationData?.vacationDays || 0
	const leaveTypeDays = vacationData?.leaveTypeDays || {}
	
	// Pobierz włączone typy wniosków
	const enabledLeaveTypes = React.useMemo(() => {
		if (!settings || !settings.leaveRequestTypes || !Array.isArray(settings.leaveRequestTypes)) {
			return []
		}
		return settings.leaveRequestTypes.filter(lt => lt.isEnabled)
	}, [settings])
	
	// Pobierz typy z allowDaysLimit: true, które mają ustawione dni urlopu
	const leaveTypesWithDays = React.useMemo(() => {
		if (!enabledLeaveTypes || !settings) return []
		return enabledLeaveTypes
			.filter(type => type.allowDaysLimit && leaveTypeDays[type.id] !== undefined && leaveTypeDays[type.id] !== null)
			.map(type => ({
				...type,
				days: leaveTypeDays[type.id] || 0
			}))
	}, [enabledLeaveTypes, leaveTypeDays, settings])
	
	// Ustaw domyślny typ po załadowaniu settings
	React.useEffect(() => {
		if (enabledLeaveTypes.length > 0 && !type) {
			setType(enabledLeaveTypes[0].id)
		}
	}, [enabledLeaveTypes, type])
	const createLeaveRequestMutation = useCreateLeaveRequest()
	const cancelLeaveRequestMutation = useCancelLeaveRequest()
	const updateLeaveRequestMutation = useUpdateLeaveRequest()
	
	// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
	const isWeekend = (date) => {
		const day = new Date(date).getDay()
		return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
	}

	// Funkcja do sprawdzania czy data powinna być zablokowana (tylko dla pojedynczych dat, nie dla zakresów)
	const isDateDisabled = (dateString) => {
		if (!dateString || !settings) return false
		const workOnWeekends = settings?.workOnWeekends !== false // Domyślnie true
		if (workOnWeekends) return false // Jeśli pracuje w weekendy, nie blokuj
		return isWeekend(dateString) // Jeśli nie pracuje w weekendy, blokuj weekendy
	}

	// Funkcja do obsługi wyboru daty "od" z weryfikacją weekendów i minDaysBefore
	const handleStartDateChange = (e) => {
		const selectedDate = e.target.value
		if (!selectedDate) {
			setStartDate('')
			return
		}

		const workOnWeekends = settings?.workOnWeekends !== false
		
		// Jeśli zespół nie pracuje w weekendy i wybrano weekend jako datę "od", zablokuj
		if (!workOnWeekends && isWeekend(selectedDate)) {
			showAlert(t('leaveform.weekendStartDateError') || 'Nie można wybrać weekendu jako daty początkowej gdy zespół nie pracuje w weekendy.')
			return
		}

		// Sprawdź minDaysBefore jeśli typ jest wybrany
		if (type && settings && settings.leaveRequestTypes) {
			const selectedType = settings.leaveRequestTypes.find(lt => lt.id === type)
			if (selectedType && selectedType.minDaysBefore !== null && selectedType.minDaysBefore !== undefined) {
				const today = new Date()
				today.setHours(0, 0, 0, 0)
				const startDateObj = new Date(selectedDate)
				startDateObj.setHours(0, 0, 0, 0)
				
				const daysDifference = Math.ceil((startDateObj - today) / (1000 * 60 * 60 * 24))
				
				if (daysDifference < selectedType.minDaysBefore) {
					const typeName = getLeaveRequestTypeName(settings, type, t, i18n.resolvedLanguage)
					const daysText = selectedType.minDaysBefore === 1 ? 'dzień' : 'dni'
					showAlert(
						t('leaveform.minDaysBeforeError', { 
							type: typeName, 
							days: selectedType.minDaysBefore,
							daysText: daysText
						}) || 
						`Wniosek typu "${typeName}" trzeba złożyć minimum ${selectedType.minDaysBefore} ${daysText} przed planowanym urlopem.`
					)
					return
				}
			}
		}

		setStartDate(selectedDate)
		// Jeśli data "do" jest wcześniejsza niż nowa data "od", zresetuj datę "do"
		if (endDate && selectedDate && new Date(selectedDate) > new Date(endDate)) {
			setEndDate('')
		}
	}

	// Funkcja do obsługi wyboru daty "do" - pozwala na weekendy jeśli jest wybrany zakres
	const handleEndDateChange = (e, isRangeSelection = true) => {
		const selectedDate = e.target.value
		if (!selectedDate) {
			setEndDate('')
			return
		}

		// Jeśli wybrana data jest wcześniejsza niż data "od", nie akceptuj
		if (startDate && selectedDate && new Date(selectedDate) < new Date(startDate)) {
			showAlert(t('leaveform.dateValidationError'))
			return
		}

		const workOnWeekends = settings?.workOnWeekends !== false
		
		// Jeśli zespół nie pracuje w weekendy i NIE ma wybranej daty "od" (pojedyncza data "do"), zablokuj weekendy
		// Ale jeśli jest wybrany zakres (od-do), pozwól na weekendy - będą pomijane w obliczeniach
		if (!workOnWeekends && !startDate && isWeekend(selectedDate)) {
			showAlert(t('leaveform.weekendEndDateError') || 'Nie można wybrać weekendu jako daty końcowej gdy zespół nie pracuje w weekendy. Wybierz najpierw datę początkową, aby utworzyć zakres.')
			return
		}

		setEndDate(selectedDate)
	}
	
	// Funkcja pomocnicza do sprawdzania czy dzień jest świętem
	const isHolidayDate = React.useCallback((date) => {
		if (!settings) return false
		const holidayInfo = checkHolidayDate(date, settings)
		return holidayInfo !== null
	}, [settings])

	// Funkcja pomocnicza do liczenia dni (z pominięciem weekendów i świąt)
	const calculateDays = React.useCallback((start, end) => {
		if (!start || !end) return 0
		const startDate = new Date(start)
		const endDate = new Date(end)
		const workOnWeekends = settings?.workOnWeekends !== false // Domyślnie true
		
		let days = 0
		const current = new Date(startDate)
		
		while (current <= endDate) {
			const isWeekendDay = isWeekend(current)
			const holidayInfo = checkHolidayDate(current, settings)
			const isHolidayDay = holidayInfo !== null
			
			// Jeśli pracuje w weekendy, pomijamy tylko święta
			if (workOnWeekends) {
				if (!isHolidayDay) {
					days++
				}
			} else {
				// Jeśli nie pracuje w weekendy, pomijamy weekendy i święta
				if (!isWeekendDay && !isHolidayDay) {
					days++
				}
			}
			current.setDate(current.getDate() + 1)
		}
		
		return days
	}, [settings, isWeekend, isHolidayDate])

	const [editingRequest, setEditingRequest] = useState(null)
	const [editType, setEditType] = useState('')
	const [editStartDate, setEditStartDate] = useState('')
	const [editEndDate, setEditEndDate] = useState('')
	const [editDaysRequested, setEditDaysRequested] = useState(0)
	const [editReplacement, setEditReplacement] = useState('')
	const [editAdditionalInfo, setEditAdditionalInfo] = useState('')
	const [showCancelModal, setShowCancelModal] = useState(null)

	const loading = loadingRequests || loadingVacation
	const isSubmitting = createLeaveRequestMutation.isPending || createLeaveRequestMutation.isLoading
	const isUpdating = updateLeaveRequestMutation.isPending || updateLeaveRequestMutation.isLoading

	useEffect(() => {
		if (startDate && endDate && settings) {
			const daysDiff = calculateDays(startDate, endDate)
			setDaysRequested(daysDiff)
		}
	}, [startDate, endDate, settings, calculateDays])

	useEffect(() => {
		if (editStartDate && editEndDate && settings) {
			const daysDiff = calculateDays(editStartDate, editEndDate)
			setEditDaysRequested(daysDiff)
		}
	}, [editStartDate, editEndDate, settings, calculateDays])

	// Funkcja sprawdzająca kolizję dat z istniejącymi wnioskami
	const hasDateConflict = (newStartDate, newEndDate, excludeRequestId = null) => {
		if (!newStartDate || !newEndDate) return false
		
		const newStart = new Date(newStartDate)
		const newEnd = new Date(newEndDate)
		
		return leaveRequests.some(request => {
			// Pomiń odrzucone wnioski (anulowane są usuwane z bazy)
			if (request.status === 'status.rejected') {
				return false
			}
			// Pomiń aktualnie edytowany wniosek
			if (excludeRequestId && request._id === excludeRequestId) {
				return false
			}
			
			const existingStart = new Date(request.startDate)
			const existingEnd = new Date(request.endDate)
			
			// Sprawdź czy zakresy dat się nakładają
			// Kolizja występuje gdy: (newStart <= existingEnd && newEnd >= existingStart)
			return newStart <= existingEnd && newEnd >= existingStart
		})
	}

	const submitLeaveRequest = async e => {
		e.preventDefault()
		
		// Walidacja dat
		if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
			await showAlert(t('leaveform.dateValidationError'))
			return
		}
		
		// Walidacja minDaysBefore - sprawdź czy startDate nie jest za późno
		if (startDate && type && settings && settings.leaveRequestTypes) {
			const selectedType = settings.leaveRequestTypes.find(lt => lt.id === type)
			if (selectedType && selectedType.minDaysBefore !== null && selectedType.minDaysBefore !== undefined) {
				const today = new Date()
				today.setHours(0, 0, 0, 0) // Ustaw na początek dnia
				const startDateObj = new Date(startDate)
				startDateObj.setHours(0, 0, 0, 0)
				
				const daysDifference = Math.ceil((startDateObj - today) / (1000 * 60 * 60 * 24))
				
				if (daysDifference < selectedType.minDaysBefore) {
					const typeName = getLeaveRequestTypeName(settings, type, t, i18n.resolvedLanguage)
					const daysText = selectedType.minDaysBefore === 1 ? 'dzień' : 'dni'
					await showAlert(
						t('leaveform.minDaysBeforeError', { 
							type: typeName, 
							days: selectedType.minDaysBefore,
							daysText: daysText
						}) || 
						`Wniosek typu "${typeName}" trzeba złożyć minimum ${selectedType.minDaysBefore} ${daysText} przed planowanym urlopem.`
					)
					return
				}
			}
		}
		
		// Sprawdź czy wszystkie dni w zakresie to weekendy lub święta (gdy zespół nie pracuje w weekendy/święta)
		if (startDate && endDate && settings) {
			const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
			// Sprawdź czy są jakiekolwiek święta włączone (polskie lub niestandardowe)
			const hasAnyHolidays = settings.includePolishHolidays === true || settings.includeCustomHolidays === true
			
			// UWAGA: Nie blokujemy wniosków zawierających święta - święta są po prostu pomijane w liczbie dni
			
			if (!workOnWeekends || hasAnyHolidays) {
				const startCheck = new Date(startDate)
				const endCheck = new Date(endDate)
				const currentCheck = new Date(startCheck)
				let allInvalid = true
				
				while (currentCheck <= endCheck) {
					const isWeekendDay = isWeekend(currentCheck)
					const holidayInfo = checkHolidayDate(currentCheck, settings)
					const isHolidayDay = holidayInfo !== null
					
					// Sprawdź czy dzień jest dozwolony
					if (workOnWeekends) {
						// Jeśli pracuje w weekendy, sprawdź tylko święta
						if (!isHolidayDay) {
							allInvalid = false
							break
						}
					} else {
						// Jeśli nie pracuje w weekendy, sprawdź weekendy i święta
						if (!isWeekendDay && !isHolidayDay) {
							allInvalid = false
							break
						}
					}
					currentCheck.setDate(currentCheck.getDate() + 1)
				}
				
				if (allInvalid) {
					if (!workOnWeekends && hasAnyHolidays) {
						await showAlert(t('leaveform.weekendHolidayOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni weekendowe lub świąteczne.')
					} else if (!workOnWeekends) {
						await showAlert(t('leaveform.weekendOnlyError'))
					} else if (hasAnyHolidays) {
						await showAlert(t('leaveform.holidayOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni świąteczne.')
					}
					return
				}
			}
		}
		
		// Sprawdź kolizję z istniejącymi wnioskami
		if (hasDateConflict(startDate, endDate)) {
			await showAlert(t('leaveform.dateConflictError'))
			return
		}
		
		try {
			const data = { type, startDate, endDate, daysRequested, replacement, additionalInfo }
			await createLeaveRequestMutation.mutateAsync(data)
			await showAlert(t('leaveform.alertsucces'))
			setType(enabledLeaveTypes.length > 0 ? enabledLeaveTypes[0].id : '')
			setStartDate('')
			setEndDate('')
			setDaysRequested(0)
			setReplacement('')
			setAdditionalInfo('')
		} catch (error) {
			console.error('Błąd podczas wysyłania wniosku:', error)
			await showAlert(t('leaveform.alertfail'))
		}
	}

	const handleCancelRequest = async (requestId) => {
		try {
			await cancelLeaveRequestMutation.mutateAsync(requestId)
			await showAlert(t('leaveform.cancelSuccess'))
			setShowCancelModal(null)
		} catch (error) {
			console.error('Błąd podczas anulowania wniosku:', error)
			await showAlert(t('leaveform.cancelError'))
		}
	}

	const handleEditRequest = (request) => {
		setEditingRequest(request)
		setEditType(request.type)
		setEditStartDate(new Date(request.startDate).toISOString().split('T')[0])
		setEditEndDate(new Date(request.endDate).toISOString().split('T')[0])
		setEditDaysRequested(request.daysRequested)
		setEditReplacement(request.replacement || '')
		setEditAdditionalInfo(request.additionalInfo || '')
	}

	const handleUpdateRequest = async (e) => {
		e.preventDefault()
		
		// Walidacja dat
		if (editStartDate && editEndDate && new Date(editEndDate) < new Date(editStartDate)) {
			await showAlert(t('leaveform.dateValidationError'))
			return
		}
		
		// Walidacja minDaysBefore - sprawdź czy editStartDate nie jest za wcześnie
		if (editStartDate && editType && settings && settings.leaveRequestTypes) {
			const selectedType = settings.leaveRequestTypes.find(lt => lt.id === editType)
			if (selectedType && selectedType.minDaysBefore !== null && selectedType.minDaysBefore !== undefined) {
				const today = new Date()
				today.setHours(0, 0, 0, 0) // Ustaw na początek dnia
				const startDateObj = new Date(editStartDate)
				startDateObj.setHours(0, 0, 0, 0)
				
				const daysDifference = Math.ceil((startDateObj - today) / (1000 * 60 * 60 * 24))
				
				if (daysDifference < selectedType.minDaysBefore) {
					const typeName = getLeaveRequestTypeName(settings, editType, t, i18n.resolvedLanguage)
					const daysText = selectedType.minDaysBefore === 1 ? 'dzień' : 'dni'
					await showAlert(
						t('leaveform.minDaysBeforeError', { 
							type: typeName, 
							days: selectedType.minDaysBefore,
							daysText: daysText
						}) || 
						`Wniosek typu "${typeName}" trzeba złożyć minimum ${selectedType.minDaysBefore} ${daysText} przed planowanym urlopem.`
					)
					return
				}
			}
		}
		
		// Sprawdź czy wszystkie dni w zakresie to weekendy lub święta (gdy zespół nie pracuje w weekendy/święta)
		if (editStartDate && editEndDate && settings) {
			const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
			// Sprawdź czy są jakiekolwiek święta włączone (polskie lub niestandardowe)
			const hasAnyHolidays = settings.includePolishHolidays === true || settings.includeCustomHolidays === true
			
			// UWAGA: Nie blokujemy wniosków zawierających święta - święta są po prostu pomijane w liczbie dni
			
			if (!workOnWeekends || hasAnyHolidays) {
				const startCheck = new Date(editStartDate)
				const endCheck = new Date(editEndDate)
				const currentCheck = new Date(startCheck)
				let allInvalid = true
				
				while (currentCheck <= endCheck) {
					const isWeekendDay = isWeekend(currentCheck)
					const holidayInfo = checkHolidayDate(currentCheck, settings)
					const isHolidayDay = holidayInfo !== null
					
					// Sprawdź czy dzień jest dozwolony
					if (workOnWeekends) {
						// Jeśli pracuje w weekendy, sprawdź tylko święta
						if (!isHolidayDay) {
							allInvalid = false
							break
						}
					} else {
						// Jeśli nie pracuje w weekendy, sprawdź weekendy i święta
						if (!isWeekendDay && !isHolidayDay) {
							allInvalid = false
							break
						}
					}
					currentCheck.setDate(currentCheck.getDate() + 1)
				}
				
				if (allInvalid) {
					if (!workOnWeekends && hasAnyHolidays) {
						await showAlert(t('leaveform.weekendHolidayOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni weekendowe lub świąteczne.')
					} else if (!workOnWeekends) {
						await showAlert(t('leaveform.weekendOnlyError'))
					} else if (hasAnyHolidays) {
						await showAlert(t('leaveform.holidayOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni świąteczne.')
					}
					return
				}
			}
		}
		
		// Sprawdź kolizję z istniejącymi wnioskami (wykluczając aktualnie edytowany)
		if (editingRequest && hasDateConflict(editStartDate, editEndDate, editingRequest._id)) {
			await showAlert(t('leaveform.dateConflictError'))
			return
		}
		
		try {
			const data = {
				type: editType,
				startDate: editStartDate,
				endDate: editEndDate,
				daysRequested: editDaysRequested,
				replacement: editReplacement,
				additionalInfo: editAdditionalInfo
			}
			await updateLeaveRequestMutation.mutateAsync({ id: editingRequest._id, data })
			await showAlert(t('leaveform.editSuccess'))
			setEditingRequest(null)
			setEditType('')
			setEditStartDate('')
			setEditEndDate('')
			setEditDaysRequested(0)
			setEditReplacement('')
			setEditAdditionalInfo('')
		} catch (error) {
			console.error('Błąd podczas edycji wniosku:', error)
			await showAlert(t('leaveform.editError'))
		}
	}

	const formatDate = date => {
		const options = { day: '2-digit', month: 'long', year: 'numeric' }
		return new Date(date).toLocaleDateString(i18n.resolvedLanguage, options)
	}

	const statusMap = {
		'status.accepted': 'accepted',
		'status.pending': 'pending',
		'status.rejected': 'rejected',
		'status.sent': 'sent',
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div id="leave-request-form">
					<h2 style={{ marginTop: '0px' }}><img src="img/sunbed.png" alt="ikonka w sidebar" />{t('leaveform.header')}</h2>
					<hr />
					<div className="card-body editformbox" style={{ 
						backgroundColor: 'white',
						borderRadius: '12px',
						boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
						padding: '15px',
						marginBottom: '30px',
						marginTop: '20px'
					}}>
						{leaveTypesWithDays.length > 0 ? (
							<div style={{ marginBottom: '20px' }}>
								<p style={{ marginBottom: '10px', fontWeight: '500', fontSize: '16px' }}>
									{t('leaveform.availableday') || 'Dostępne dni urlopu'}:
								</p>
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '400px' }}>
									{leaveTypesWithDays.map(type => {
										const displayName = i18n.resolvedLanguage === 'en' && type.nameEn ? type.nameEn : type.name
										return (
											<div key={type.id} style={{ 
												display: 'flex', 
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: '8px 12px',
												backgroundColor: '#e8f4f8',
												borderRadius: '6px',
												border: '1px solid #3498db'
											}}>
												<span style={{ fontSize: '14px', color: '#2c3e50' }}>{displayName}:</span>
												<span style={{ 
													fontSize: '14px', 
													fontWeight: '600',
													color: type.days > 0 ? '#28a745' : '#dc3545'
												}}>
													{type.days > 0 ? type.days : t('leaveform.nodata') || 'Brak danych'}
												</span>
											</div>
										)
									})}
								</div>
							</div>
						) : (
							<p style={{ marginBottom: '20px' }}>
								{t('leaveform.availableday')}{' '}
								{availableLeaveDays === 0 ? (
									<span style={{ color: 'red' }}>{t('leaveform.nodata')}</span>
								) : (
									availableLeaveDays
								)}
							</p>
						)}

						<form onSubmit={submitLeaveRequest} id="formleave" className="space-y-6 max-w-xl">
						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.type')}</label>
							<select
								value={type}
								onChange={e => setType(e.target.value)}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
								required>
								{enabledLeaveTypes.length === 0 ? (
									<option value="">{t('leaveform.loadingTypes') || 'Ładowanie typów...'}</option>
								) : (
									enabledLeaveTypes.map(leaveType => (
										<option key={leaveType.id} value={leaveType.id}>
											{i18n.resolvedLanguage === 'en' && leaveType.nameEn ? leaveType.nameEn : leaveType.name}
										</option>
									))
								)}
							</select>
						</div>

						
						<div style={{ maxWidth: '400px', marginRight: '2px' }}>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.datefrom')}</label>
							<input
								type="date"
								value={startDate}
								onChange={handleStartDateChange}
								required
								className="w-full border border-gray-300 rounded-md px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
							<br></br>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.dateto')}</label>
							<input
								type="date"
								value={endDate}
								min={startDate || undefined}
								onChange={(e) => handleEndDateChange(e, true)}
								required
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.numberdayreq')}</label>
							<input
								type="number"
								value={daysRequested}
								readOnly
								className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
							/>
						</div>

						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.substitute')}</label>
							<input
								type="text"
								value={replacement}
								onChange={e => setReplacement(e.target.value)}
								placeholder={t('leaveform.optional')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

						
						<div>
							<label className="block text-gray-700 font-medium mb-1">{t('leaveform.addinfo')}</label>
							<textarea
								value={additionalInfo}
								onChange={e => setAdditionalInfo(e.target.value)}
								placeholder={t('leaveform.optional')}
								className="w-full border border-gray-300 rounded-md px-4 py-2 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
							/>
						</div>

					
						<div className="flex justify-end">
							<button
								type="submit"
								disabled={isSubmitting}
								className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
								{isSubmitting ? (
									<span className="flex items-center">
										<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
											<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
											<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										{t('leaveform.submitting')}
									</span>
								) : (
									t('leaveform.submit')
								)}
							</button>
						</div>
					</form>

					<h3>{t('leaveform.listsofreq')}</h3>
					<ul>
						{leaveRequests.map((request, index) => {
							const translatedType = getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)
							const canEdit = request.status === 'status.pending'

							return (
								<li key={index} style={{ marginTop: '25px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
									<p>
										{t('leaveform.typeLabel')}: {translatedType}
									</p>
									<p>
										{t('leaveform.date')}: {formatDate(request.startDate)} - {formatDate(request.endDate)}
									</p>
									<p>
										{t('leaveform.daysRequested')}: {request.daysRequested}
									</p>
									<p>
										{t('leaveform.substitute')} {request.replacement || t('leaveform.empty')}
									</p>
									<p>
										{t('leaveform.additionalInfo')}: {request.additionalInfo || t('leaveform.empty')}
									</p>
									<p>
										{t('leaveform.status')}:
										<span
											className={`autocol ${
												request.status === 'status.accepted'
													? 'status-accepted'
													: request.status === 'status.pending'
													? 'status-pending'
													: request.status === 'status.sent'
													? 'status-sent'
													: 'status-rejected'
											}`}
											style={{ marginLeft: '5px' }}>
											{t(`leaveform.statuses.${statusMap[request.status]}`) || t(request.status)}
										</span>
										{request.updatedBy && (
											<span>
												{' '}
												( {t('leaveform.updatedBy')}: {request.updatedBy.firstName} {request.updatedBy.lastName} )
											</span>
										)}
									</p>
									<div style={{ marginTop: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
										{canEdit && (
											<button
												onClick={() => handleEditRequest(request)}
												className="btn btn-primary"
												style={{ marginRight: '5px' }}>
												{t('leaveform.editButton')}
											</button>
										)}
										<button
											onClick={() => setShowCancelModal(request._id)}
											disabled={cancelLeaveRequestMutation.isPending}
											className="btn btn-danger"
											style={{ marginRight: '5px' }}>
											{t('leaveform.cancelButton')}
										</button>
									</div>
								</li>
							)
						})}
					</ul>
					</div>

					{/* Modal anulowania */}
					{showCancelModal && (
						<div
							className="fixed inset-0 flex items-center justify-center backdrop-blur-[1px]"
							style={{
								zIndex: 100000000,
								padding: '20px'
							}}
							onClick={() => setShowCancelModal(null)}>
							<div
								style={{
									backgroundColor: 'white',
									borderRadius: '8px',
									padding: '30px',
									maxWidth: '500px',
									width: '100%',
									boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
									position: 'relative'
								}}
								onClick={(e) => e.stopPropagation()}>
								<h3 style={{
									margin: '0 0 20px 0',
									color: '#1f2937',
									fontSize: '24px',
									fontWeight: '600'
								}}>
									{t('leaveform.cancelModalTitle')}
								</h3>
								<p style={{
									margin: '0 0 30px 0',
									color: '#4b5563',
									fontSize: '16px',
									lineHeight: '1.6'
								}}>
									{t('leaveform.cancelModalMessage')}
								</p>
								<div style={{
									display: 'flex',
									gap: '12px',
									justifyContent: 'flex-end'
								}}>
									<button
										onClick={() => setShowCancelModal(null)}
										disabled={cancelLeaveRequestMutation.isPending}
										style={{
											padding: '10px 20px',
											borderRadius: '6px',
											border: '1px solid #d1d5db',
											backgroundColor: 'white',
											color: '#374151',
											cursor: cancelLeaveRequestMutation.isPending ? 'not-allowed' : 'pointer',
											fontSize: '14px',
											fontWeight: '500',
											transition: 'all 0.2s',
											opacity: cancelLeaveRequestMutation.isPending ? 0.5 : 1
										}}
										onMouseEnter={(e) => !cancelLeaveRequestMutation.isPending && (e.target.style.backgroundColor = '#f9fafb')}
										onMouseLeave={(e) => !cancelLeaveRequestMutation.isPending && (e.target.style.backgroundColor = 'white')}>
										{t('leaveform.cancel')}
									</button>
									<button
										onClick={() => handleCancelRequest(showCancelModal)}
										disabled={cancelLeaveRequestMutation.isPending}
										style={{
											padding: '10px 20px',
											borderRadius: '6px',
											border: 'none',
											backgroundColor: '#dc3545',
											color: 'white',
											cursor: cancelLeaveRequestMutation.isPending ? 'not-allowed' : 'pointer',
											fontSize: '14px',
											fontWeight: '500',
											transition: 'all 0.2s',
											opacity: cancelLeaveRequestMutation.isPending ? 0.5 : 1
										}}
										onMouseEnter={(e) => !cancelLeaveRequestMutation.isPending && (e.target.style.backgroundColor = '#c82333')}
										onMouseLeave={(e) => !cancelLeaveRequestMutation.isPending && (e.target.style.backgroundColor = '#dc3545')}>
										{cancelLeaveRequestMutation.isPending ? (
											<span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
												<svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												{t('leaveform.cancelling')}
											</span>
										) : (
											t('leaveform.confirmCancel')
										)}
									</button>
								</div>
							</div>
						</div>
					)}

					{/* Modal edycji */}
					{editingRequest && (
						<div
							className="fixed inset-0 flex items-center justify-center"
							style={{
								zIndex: 100000000,
								padding: '20px',
								overflowY: 'auto',
								backgroundColor: '#2155373d'
							}}
							onClick={() => setEditingRequest(null)}>
							<div
								style={{
									backgroundColor: 'white',
									borderRadius: '8px',
									maxWidth: '600px',
									width: '100%',
									boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
									position: 'relative',
									margin: '20px 0',
									maxHeight: '500px',
									overflow: 'overlay'
								}}
								onClick={(e) => e.stopPropagation()}>
								{/* Header z zielonym gradientem */}
								<div style={{
									padding: '30px 30px 0px 30px',
									borderRadius: '8px 8px 0 0'
								}}>
									<h3 style={{
										margin: '0',
										color: '#ffffff',
										fontSize: '24px',
										fontWeight: '600'
									}}>
										{t('leaveform.editModalTitle')}
									</h3>
								</div>
								{/* Zawartość formularza */}
								<div style={{
									padding: '30px'
								}}>
								<form onSubmit={handleUpdateRequest} className="space-y-6">
									<div>
										<label className="block text-gray-700 font-medium mb-1">{t('leaveform.type')}</label>
										<select
											value={editType}
											onChange={e => setEditType(e.target.value)}
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											required>
											{enabledLeaveTypes.map(leaveType => (
												<option key={leaveType.id} value={leaveType.id}>
													{i18n.resolvedLanguage === 'en' && leaveType.nameEn ? leaveType.nameEn : leaveType.name}
												</option>
											))}
										</select>
									</div>

									<div style={{ maxWidth: '400px', marginRight: '2px' }}>
										<label className="block text-gray-700 font-medium mb-1">{t('leaveform.datefrom')}</label>
										<input
											type="date"
											value={editStartDate}
											onChange={e => {
												const selectedDate = e.target.value
												if (!selectedDate) {
													setEditStartDate('')
													return
												}

												const workOnWeekends = settings?.workOnWeekends !== false
												
												// Jeśli zespół nie pracuje w weekendy i wybrano weekend jako datę "od", zablokuj
												if (!workOnWeekends && isWeekend(selectedDate)) {
													showAlert(t('leaveform.weekendStartDateError') || 'Nie można wybrać weekendu jako daty początkowej gdy zespół nie pracuje w weekendy.')
													return
												}

												setEditStartDate(selectedDate)
												// Jeśli data "do" jest wcześniejsza niż nowa data "od", zresetuj datę "do"
												if (editEndDate && selectedDate && new Date(selectedDate) > new Date(editEndDate)) {
													setEditEndDate('')
												}
											}}
											required
											className="w-full border border-gray-300 rounded-md px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
										<br></br>
										<label className="block text-gray-700 font-medium mb-1">{t('leaveform.dateto')}</label>
										<input
											type="date"
											value={editEndDate}
											min={editStartDate || undefined}
											onChange={e => {
												const selectedDate = e.target.value
												if (!selectedDate) {
													setEditEndDate('')
													return
												}

												// Jeśli wybrana data jest wcześniejsza niż data "od", nie akceptuj
												if (editStartDate && selectedDate && new Date(selectedDate) < new Date(editStartDate)) {
													showAlert(t('leaveform.dateValidationError'))
													return
												}

												const workOnWeekends = settings?.workOnWeekends !== false
												
												// Jeśli zespół nie pracuje w weekendy i NIE ma wybranej daty "od" (pojedyncza data "do"), zablokuj weekendy
												// Ale jeśli jest wybrany zakres (od-do), pozwól na weekendy - będą pomijane w obliczeniach
												if (!workOnWeekends && !editStartDate && isWeekend(selectedDate)) {
													showAlert(t('leaveform.weekendEndDateError') || 'Nie można wybrać weekendu jako daty końcowej gdy zespół nie pracuje w weekendy. Wybierz najpierw datę początkową, aby utworzyć zakres.')
													return
												}

												setEditEndDate(selectedDate)
											}}
											required
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-gray-700 font-medium mb-1">{t('leaveform.numberdayreq')}</label>
										<input
											type="number"
											value={editDaysRequested}
											readOnly
											className="w-full border border-gray-300 rounded-md px-4 py-2 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-not-allowed"
										/>
									</div>

									<div>
										<label className="block text-gray-700 font-medium mb-1">{t('leaveform.substitute')}</label>
										<input
											type="text"
											value={editReplacement}
											onChange={e => setEditReplacement(e.target.value)}
											placeholder={t('leaveform.optional')}
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div>
										<label className="block text-gray-700 font-medium mb-1">{t('leaveform.addinfo')}</label>
										<textarea
											value={editAdditionalInfo}
											onChange={e => setEditAdditionalInfo(e.target.value)}
											placeholder={t('leaveform.optional')}
											className="w-full border border-gray-300 rounded-md px-4 py-2 resize-none h-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
										/>
									</div>

									<div className="flex justify-end gap-3">
										<button
											type="button"
											onClick={() => setEditingRequest(null)}
											disabled={isUpdating}
											style={{
												padding: '10px 20px',
												borderRadius: '6px',
												border: '1px solid #d1d5db',
												backgroundColor: 'white',
												color: '#374151',
												cursor: isUpdating ? 'not-allowed' : 'pointer',
												fontSize: '14px',
												fontWeight: '500',
												transition: 'all 0.2s',
												opacity: isUpdating ? 0.5 : 1
											}}>
											{t('leaveform.cancelEdit')}
										</button>
										<button
											type="submit"
											disabled={isUpdating}
											className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{isUpdating ? (
												<span className="flex items-center">
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													{t('leaveform.updating')}
												</span>
											) : (
												t('leaveform.updateButton')
											)}
										</button>
									</div>
								</form>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</>
	)
}

export default LeaveRequestForm
