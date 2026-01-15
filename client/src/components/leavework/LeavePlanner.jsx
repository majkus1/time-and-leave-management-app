import React, { useState, useRef, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useLeavePlans, useToggleLeavePlan, useDeleteLeavePlan } from '../../hooks/useLeavePlans'
import { useAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useOwnVacationDays } from '../../hooks/useVacation'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import Modal from 'react-modal'

if (typeof window !== 'undefined') {
	Modal.setAppElement('#root')
}

function LeavePlanner() {
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const [viewModalOpen, setViewModalOpen] = useState(false)
	const [calendarView, setCalendarView] = useState('single') // 'single' lub 'all-months'
	
	// Odśwież kalendarz gdy sidebar się zmienia lub okno się zmienia
	useEffect(() => {
		const updateCalendarSize = () => {
			if (calendarView === 'single' && calendarRef.current) {
				const calendarApi = calendarRef.current.getApi()
				// Użyj setTimeout aby dać czas na zakończenie animacji CSS
				setTimeout(() => {
					calendarApi.updateSize()
				}, 350) // 350ms to czas animacji sidebaru (0.3s + mały buffer)
			} else if (calendarView === 'all-months') {
				// Dla widoku wszystkich miesięcy - wywołaj resize event, który FullCalendar automatycznie obsłuży
				setTimeout(() => {
					window.dispatchEvent(new Event('resize'))
				}, 350)
			}
		}

		// Obserwuj zmiany klasy body (sidebar-collapsed)
		const observer = new MutationObserver(() => {
			updateCalendarSize()
		})

		// Obserwuj zmiany klasy body
		if (document.body) {
			observer.observe(document.body, {
				attributes: true,
				attributeFilter: ['class']
			})
		}

		// Obserwuj zmiany widoku kalendarza
		updateCalendarSize()

		// Obserwuj zmiany rozmiaru okna
		const handleResize = () => {
			updateCalendarSize()
		}
		window.addEventListener('resize', handleResize)

		// Odśwież po załadowaniu
		updateCalendarSize()

		return () => {
			observer.disconnect()
			window.removeEventListener('resize', handleResize)
		}
	}, [calendarView])

	// TanStack Query hooks
	const { data: selectedDates = [], isLoading: loadingPlans } = useLeavePlans()
	const { data: acceptedLeaveRequests = [], isLoading: loadingRequests } = useAcceptedLeaveRequests()
	const { data: vacationData, isLoading: loadingVacation } = useOwnVacationDays()
	const availableLeaveDays = vacationData?.vacationDays || 0
	const leaveTypeDays = vacationData?.leaveTypeDays || {}
	const { data: settings } = useSettings()

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
	const toggleLeavePlanMutation = useToggleLeavePlan()
	const deleteLeavePlanMutation = useDeleteLeavePlan()

	const loading = loadingPlans || loadingRequests || loadingVacation

	// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
	const isWeekend = (date) => {
		const day = new Date(date).getDay()
		return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
	}

	// Funkcja pomocnicza do generowania dat w zakresie (z pominięciem weekendów i świąt)
	const generateDateRangeForCalendar = (startDate, endDate) => {
		const dates = []
		const start = new Date(startDate)
		const end = new Date(endDate)
		const current = new Date(start)
		const workOnWeekends = settings?.workOnWeekends !== false // Domyślnie true
		
		while (current <= end) {
			const currentDateStr = new Date(current).toISOString().split('T')[0]
			const isWeekendDay = isWeekend(current)
			// Sprawdź święta (niestandardowe zawsze, polskie tylko gdy includeHolidays jest włączone)
			const holidayInfo = isHolidayDate(current, settings)
			const isHolidayDay = holidayInfo !== null
			
			// Jeśli pracuje w weekendy, pomijamy tylko święta
			if (workOnWeekends) {
				if (!isHolidayDay) {
					dates.push(currentDateStr)
				}
			} else {
				// Jeśli nie pracuje w weekendy, pomijamy weekendy i święta
				if (!isWeekendDay && !isHolidayDay) {
					dates.push(currentDateStr)
				}
			}
			current.setDate(current.getDate() + 1)
		}
		
		return dates
	}

	// Filtruj selectedDates, aby wykluczyć daty pokryte przez wnioski urlopowe (akceptowane lub sent)
	const filteredSelectedDates = React.useMemo(() => {
		if (!acceptedLeaveRequests || acceptedLeaveRequests.length === 0) {
			return selectedDates
		}

		// Utwórz Set z dat pokrytych przez wnioski urlopowe
		const requestDatesSet = new Set()
		acceptedLeaveRequests.forEach(request => {
			if (request.startDate && request.endDate) {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				dates.forEach(date => requestDatesSet.add(date))
			}
		})

		// Filtruj selectedDates, wykluczając daty pokryte przez wnioski
		return selectedDates.filter(date => !requestDatesSet.has(date))
	}, [selectedDates, acceptedLeaveRequests, settings])

	// Pobierz święta dla aktualnego miesiąca (uwzględnia niestandardowe święta nawet gdy includeHolidays jest wyłączone)
	const holidaysForMonth = React.useMemo(() => {
		if (!settings) return []
		const monthStart = new Date(currentYear, currentMonth, 1)
		const monthEnd = new Date(currentYear, currentMonth + 1, 0)
		// Formatuj daty jako YYYY-MM-DD w lokalnej strefie czasowej (nie UTC)
		const formatDateLocal = (date) => {
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
		return getHolidaysInRange(
			formatDateLocal(monthStart),
			formatDateLocal(monthEnd),
			settings
		)
	}, [settings, currentMonth, currentYear])

	// Pobierz święta dla całego roku (dla widoku wszystkich miesięcy)
	const holidaysForYear = React.useMemo(() => {
		if (!settings) return []
		const yearStart = new Date(currentYear, 0, 1)
		const yearEnd = new Date(currentYear, 11, 31)
		const formatDateLocal = (date) => {
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
		return getHolidaysInRange(
			formatDateLocal(yearStart),
			formatDateLocal(yearEnd),
			settings
		)
	}, [settings, currentYear])

	const handleMonthSelect = event => {
		const newMonth = parseInt(event.target.value, 10)
		setCurrentMonth(newMonth)
		goToSelectedDate(newMonth, currentYear)
	}

	const handleYearSelect = event => {
		const newYear = parseInt(event.target.value, 10)
		setCurrentYear(newYear)
		goToSelectedDate(currentMonth, newYear)
	}

	const handlePrevMonth = () => {
		const newDate = new Date(currentYear, currentMonth - 1, 1)
		const newMonth = newDate.getMonth()
		const newYear = newDate.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
		goToSelectedDate(newMonth, newYear)
	}

	const handleNextMonth = () => {
		const newDate = new Date(currentYear, currentMonth + 1, 1)
		const newMonth = newDate.getMonth()
		const newYear = newDate.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
		goToSelectedDate(newMonth, newYear)
	}

	const goToSelectedDate = (month, year) => {
		const calendarApi = calendarRef.current.getApi()
		calendarApi.gotoDate(new Date(year, month, 1))
	}

	const toggleDate = async date => {
		const formattedDate = new Date(date).toISOString().split('T')[0]
		const isSelected = selectedDates.includes(formattedDate)

		// Sprawdź czy dzień jest weekendem i zespół nie pracuje w weekendy
		const workOnWeekends = settings?.workOnWeekends !== false // Domyślnie true
		const dateObj = new Date(date)
		const isWeekendDate = isWeekend(dateObj)
		
		// Sprawdź czy dzień jest świętem (używam innej nazwy zmiennej aby uniknąć konfliktu z importowaną funkcją)
		const isHolidayDateValue = settings ? isHolidayDate(dateObj, settings) !== null : false
		
		// Jeśli zespół nie pracuje w weekendy i to weekend, zablokuj zaznaczanie
		if (!workOnWeekends && isWeekendDate) {
			// Można pokazać alert, ale na razie tylko blokujemy
			return
		}
		
		// Jeśli to święto, zablokuj zaznaczanie
		if (isHolidayDateValue) {
			// Można pokazać alert, ale na razie tylko blokujemy
			return
		}

		try {
			await toggleLeavePlanMutation.mutateAsync({
				date: formattedDate,
				isSelected,
			})
		} catch (error) {
			console.error('Error toggling date:', error)
		}
	}

	const removeDate = async date => {
		try {
			await deleteLeavePlanMutation.mutateAsync(date)
		} catch (error) {
			console.error('Error removing date:', error)
		}
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
	}

	const handleEventClick = (clickInfo) => {
		const { type } = clickInfo.event.extendedProps
		if (type === 'plan') {
			// Dla planów - usuń datę (klikalne)
			const date = clickInfo.event.startStr
			toggleDate(date)
		} else if (type === 'request') {
			// Dla zaakceptowanych wniosków - tylko informacja
		}
	}

	// Renderowanie widoku wszystkich miesięcy
	const renderAllMonths = () => {
		return Array.from({ length: 12 }, (_, month) => (
			<div key={`${currentYear}-${month}`} className="month-calendar allleaveplans all-leaveplans-all-months" style={{ margin: '10px', border: '1px solid #ddd' }}>
				<FullCalendar
					plugins={[dayGridPlugin, interactionPlugin]}
					initialView="dayGridMonth"
					initialDate={new Date(currentYear, month)}
					locale={i18n.resolvedLanguage}
					height="auto"
					showNonCurrentDates={false}
					firstDay={1}
					key={`calendar-${currentYear}-${month}`}
					eventClick={handleEventClick}
					dateClick={info => toggleDate(info.dateStr)}
					events={[
						// Plany urlopów (klikalne) - wykluczamy daty pokryte przez wnioski urlopowe
						...filteredSelectedDates
							.filter(date => {
								const dateObj = new Date(date)
								return dateObj.getFullYear() === currentYear && dateObj.getMonth() === month
							})
							.map(date => ({
								title: t('leaveplanner.vactiontitle'),
								start: date,
								allDay: true,
								backgroundColor: 'blue',
								extendedProps: { type: 'plan', date: date }
							})),
						// Zaakceptowane wnioski urlopowe
						...acceptedLeaveRequests
							.filter(request => request.startDate && request.endDate)
							.flatMap(request => {
								const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
								return dates
									.filter(date => {
										const dateObj = new Date(date)
										return dateObj.getFullYear() === currentYear && dateObj.getMonth() === month
									})
									.map(date => ({
										title: `${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}`,
										start: date,
										allDay: true,
										backgroundColor: 'green',
										borderColor: 'darkgreen',
										extendedProps: { type: 'request', requestId: request._id }
									}))
							}),
						// Dni świąteczne
						...holidaysForYear
							.filter(holiday => {
								const holidayDate = new Date(holiday.date)
								return holidayDate.getFullYear() === currentYear && holidayDate.getMonth() === month
							})
							.map(holiday => ({
								title: holiday.name,
								start: holiday.date,
								allDay: true,
								backgroundColor: 'green',
								borderColor: 'darkgreen',
								textColor: 'white',
								classNames: 'event-absence',
								extendedProps: { type: 'holiday', name: holiday.name }
							}))
					]}
				/>
			</div>
		))
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div id="leave-planner">
					<h3><img src="img/calendar.png" alt="ikonka w sidebar" /> {t('leaveplanner.mainheader')}</h3>
					<hr />
					<div style={{ marginBottom: '20px' }}>
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
					</div>

					{/* Sekcja zaznaczonych dat */}
					<div style={{ marginBottom: '20px' }}>
						<p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '10px' }}>
							{t('leaveplanner.header')}
						</p>
						{selectedDates.length > 0 ? (
							<ul style={{ listStyle: 'none', padding: 0 }}>
								{selectedDates.map(date => (
									<li
										key={date}
										style={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											padding: '5px 10px',
											border: '1px solid #ddd',
											marginBottom: '5px',
											backgroundColor: '#f0f0f0',
											maxWidth: '300px',
										}}>
										{(() => {
											const d = new Date(date)
											return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1)
												.toString()
												.padStart(2, '0')}-${d.getFullYear()}`
										})()}

										<button
											style={{
												background: 'red',
												color: 'white',
												border: 'none',
												borderRadius: '5px',
												cursor: 'pointer',
												padding: '5px 10px',
											}}
											onClick={() => removeDate(date)}>
											X
										</button>
									</li>
								))}
							</ul>
						) : (
							<p style={{ color: '#666', fontStyle: 'italic', fontSize: '14px' }}>
								{t('leaveplanner.noSelectedDates')}
							</p>
						)}
					</div>

					{/* Sekcja zaakceptowanych wniosków */}
					{acceptedLeaveRequests.length > 0 && (
						<div style={{ marginBottom: '20px' }}>
							<h4 style={{ color: 'green', marginBottom: '10px' }}>{t('leaveplanner.acceptedRequests')}</h4>
							<ul style={{ listStyle: 'none', padding: 0 }}>
								{acceptedLeaveRequests.map(request => (
									<li
										key={request._id}
										style={{
											padding: '8px 12px',
											border: '1px solid #4ade80',
											marginBottom: '5px',
											backgroundColor: '#f0fdf4',
											borderRadius: '6px',
											maxWidth: '400px',
										}}>
										<div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
											{getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}
										</div>
										<div style={{ fontSize: '14px', color: '#666' }}>
											{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
											<span style={{ marginLeft: '10px', color: '#059669' }}>
												({request.daysRequested} {t('leaveplanner.days')})
											</span>
										</div>
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '40px', gap: '5px', alignItems: 'center' }}>
						{calendarView === 'single' && (
							<>
								<select
									value={currentMonth}
									onChange={handleMonthSelect}
									style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
									className="focus:outline-none focus:ring-2 focus:ring-blue-500">
									{Array.from({ length: 12 }, (_, i) => (
										<option key={i} value={i}>
											{new Date(0, i)
												.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
												.replace(/^./, str => str.toUpperCase())}
										</option>
									))}
								</select>
								<select
									value={currentYear}
									onChange={handleYearSelect}
									style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
									className="focus:outline-none focus:ring-2 focus:ring-blue-500">
									{Array.from({ length: 20 }, (_, i) => {
										const year = new Date().getFullYear() - 10 + i
										return (
											<option key={year} value={year}>
												{year}
											</option>
										)
									})}
								</select>
								<button
									type="button"
									onClick={handlePrevMonth}
									style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '600', color: '#495057', transition: 'all 0.2s ease' }}
									onMouseOver={(e) => {
										e.target.style.backgroundColor = '#f8f9fa'
										e.target.style.borderColor = '#adb5bd'
									}}
									onMouseOut={(e) => {
										e.target.style.backgroundColor = 'white'
										e.target.style.borderColor = '#bdc3c7'
									}}
								>
									&lt;
								</button>
								<button
									type="button"
									onClick={handleNextMonth}
									style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '600', color: '#495057', transition: 'all 0.2s ease' }}
									onMouseOver={(e) => {
										e.target.style.backgroundColor = '#f8f9fa'
										e.target.style.borderColor = '#adb5bd'
									}}
									onMouseOut={(e) => {
										e.target.style.backgroundColor = 'white'
										e.target.style.borderColor = '#bdc3c7'
									}}
								>
									&gt;
								</button>
							</>
						)}
						{calendarView === 'all-months' && (
							<select
								value={currentYear}
								onChange={handleYearSelect}
								style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
								className="focus:outline-none focus:ring-2 focus:ring-blue-500">
								{Array.from({ length: 20 }, (_, i) => {
									const year = new Date().getFullYear() - 10 + i
									return (
										<option key={year} value={year}>
											{year}
										</option>
									)
								})}
							</select>
						)}
						<button
							type="button"
							onClick={() => setViewModalOpen(true)}
							className='filter-button'
							style={{ 
								padding: '8px 16px', 
								border: '1px solid #3498db', 
								borderRadius: '6px', 
								backgroundColor: '#3498db', 
								color: 'white',
								cursor: 'pointer', 
								fontSize: '16px', 
								fontWeight: '500', 
								transition: 'all 0.2s ease',
							}}
							onMouseOver={(e) => {
								e.target.style.backgroundColor = '#2980b9'
								e.target.style.borderColor = '#2980b9'
							}}
							onMouseOut={(e) => {
								e.target.style.backgroundColor = '#3498db'
								e.target.style.borderColor = '#3498db'
							}}
						>
							{t('leaveplanner.viewOptions') || 'Opcje widoku'}
						</button>
					</div>

					{calendarView === 'single' ? (
						<div>
							<FullCalendar
								plugins={[dayGridPlugin, interactionPlugin]}
								initialView="dayGridMonth"
								initialDate={new Date()}
								locale={i18n.resolvedLanguage}
								height="auto"
								firstDay={1}
								showNonCurrentDates={false}
								eventClick={handleEventClick}
								events={[
									// Plany urlopów (klikalne) - wykluczamy daty pokryte przez wnioski urlopowe
									...filteredSelectedDates.map(date => ({
										title: t('leaveplanner.vactiontitle'),
										start: date,
										allDay: true,
										backgroundColor: 'blue',
										extendedProps: { type: 'plan', date: date }
									})),
									// Zaakceptowane wnioski urlopowe - generuj osobne eventy dla każdego dnia (z pominięciem weekendów)
									...acceptedLeaveRequests
										.filter(request => request.startDate && request.endDate) // Sprawdź czy daty istnieją
										.flatMap(request => {
											const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
											return dates.map(date => ({
												title: `${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}`,
												start: date,
												allDay: true,
												backgroundColor: 'green',
												borderColor: 'darkgreen',
												extendedProps: { type: 'request', requestId: request._id }
											}))
										}),
									// Dni świąteczne
									...holidaysForMonth.map(holiday => ({
										title: holiday.name,
										start: holiday.date,
										allDay: true,
										backgroundColor: 'green',
										borderColor: 'darkgreen',
										textColor: 'white',
										classNames: 'event-absence',
										extendedProps: { type: 'holiday', name: holiday.name }
									}))
								]}
								dateClick={info => toggleDate(info.dateStr)}
								ref={calendarRef}
								datesSet={handleMonthChange}
							/>
						</div>
					) : (
						<div className="all-months-calendar-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
							{renderAllMonths()}
						</div>
					)}

					{/* Modal opcji widoku */}
					<Modal
						isOpen={viewModalOpen}
						onRequestClose={() => setViewModalOpen(false)}
						style={{
							overlay: {
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								backgroundColor: 'rgba(0, 0, 0, 0.5)',
								backdropFilter: 'blur(2px)',
							},
							content: {
								position: 'relative',
								inset: 'unset',
								margin: '0',
								maxWidth: '500px',
								maxHeight: '80vh',
								width: '90%',
								borderRadius: '12px',
								padding: '30px',
								backgroundColor: 'white',
								overflow: 'auto',
							},
						}}
						contentLabel={t('leaveplanner.viewOptions') || 'Opcje widoku'}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
							<h2 style={{ 
								margin: 0,
								color: '#2c3e50',
								fontSize: '24px',
								fontWeight: '600'
							}}>
								{t('leaveplanner.viewOptions') || 'Opcje widoku'}
							</h2>
							<button
								onClick={() => setViewModalOpen(false)}
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
								onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}>
								×
							</button>
						</div>

						{/* Widok kalendarza */}
						<div style={{ marginBottom: '30px' }}>
							<h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
								{t('planslist.calendarView') || 'Widok kalendarza'}
							</h3>
							<div style={{ display: 'flex', gap: '15px' }}>
								<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
									<input
										type="radio"
										name="calendarView"
										value="single"
										checked={calendarView === 'single'}
										onChange={(e) => setCalendarView(e.target.value)}
										style={{ marginRight: '8px', cursor: 'pointer' }}
									/>
									<span>{t('planslist.singleMonth') || 'Jeden miesiąc'}</span>
								</label>
								<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
									<input
										type="radio"
										name="calendarView"
										value="all-months"
										checked={calendarView === 'all-months'}
										onChange={(e) => setCalendarView(e.target.value)}
										style={{ marginRight: '8px', cursor: 'pointer' }}
									/>
									<span>{t('planslist.allMonths') || 'Wszystkie miesiące'}</span>
								</label>
							</div>
						</div>

						{/* Przycisk zamknięcia */}
						<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px' }}>
							<button
								onClick={() => setViewModalOpen(false)}
								style={{
									padding: '10px 20px',
									backgroundColor: '#3498db',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontSize: '14px',
									fontWeight: '500',
									transition: 'background-color 0.2s'
								}}
								onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
								onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}>
								{t('planslist.apply') || t('boards.cancel') || 'Zamknij'}
							</button>
						</div>
					</Modal>
				</div>
			)}
		</>
	)
}

export default LeavePlanner
