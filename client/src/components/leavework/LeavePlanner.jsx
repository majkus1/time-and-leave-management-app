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

function LeavePlanner() {
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	
	// Odśwież kalendarz gdy sidebar się zmienia lub okno się zmienia
	useEffect(() => {
		const updateCalendarSize = () => {
			if (calendarRef.current) {
				const calendarApi = calendarRef.current.getApi()
				// Użyj setTimeout aby dać czas na zakończenie animacji CSS
				setTimeout(() => {
					calendarApi.updateSize()
				}, 350) // 350ms to czas animacji sidebaru (0.3s + mały buffer)
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
	}, [])

	// TanStack Query hooks
	const { data: selectedDates = [], isLoading: loadingPlans } = useLeavePlans()
	const { data: acceptedLeaveRequests = [], isLoading: loadingRequests } = useAcceptedLeaveRequests()
	const { data: vacationData, isLoading: loadingVacation } = useOwnVacationDays()
	const availableLeaveDays = vacationData?.vacationDays || 0
	const { data: settings } = useSettings()
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
						<p style={{ marginBottom: '20px' }}>
							{t('leaveform.availableday')}{' '}
							{availableLeaveDays === 0 ? (
								<span style={{ color: 'red' }}>{t('leaveform.nodata')}</span>
							) : (
								availableLeaveDays
							)}
						</p>
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

					<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '40px', gap: '5px' }}>
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
					</div>

					<div>
						<FullCalendar
							plugins={[dayGridPlugin, interactionPlugin]}
							initialView="dayGridMonth"
							initialDate={new Date()}
							// locale="pl"
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
				</div>
			)}
		</>
	)
}

export default LeavePlanner
