import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useWorkdays, useCreateWorkday, useDeleteWorkday } from '../../hooks/useWorkdays'
import { useCalendarConfirmation, useToggleCalendarConfirmation } from '../../hooks/useCalendar'
import { useAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'

Modal.setAppElement('#root')

function MonthlyCalendar() {
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState(null)
	const [hoursWorked, setHoursWorked] = useState('')
	const [additionalWorked, setAdditionalWorked] = useState('')
	const [absenceType, setAbsenceType] = useState('')
	const [totalHours, setTotalHours] = useState(0)
	const [additionalHours, setAdditionalHours] = useState(0)
	const [totalLeaveDays, setTotalLeaveDays] = useState(0)
	const [totalLeaveHours, setTotalLeaveHours] = useState(0)
	const [totalWorkDays, setTotalWorkDays] = useState(0)
	const [totalOtherAbsences, setTotalOtherAbsences] = useState(0)
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [realTimeDayWorked, setRealTimeDayWorked] = useState('')
	const [notes, setNotes] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const calendarRef = useRef(null)
	
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
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	
	// Funkcja do poprawnej odmiany słowa "nadgodziny" w języku polskim
	const getOvertimeWord = (count) => {
		if (i18n.language !== 'pl') {
			// Dla innych języków użyj standardowego tłumaczenia
			return count === 1 ? t('workcalendar.overtime1') : t('workcalendar.overtime5plus')
		}
		
		// Polska odmiana:
		// 1 → "nadgodzina"
		// 2-4, 22-24, 32-34... → "nadgodziny" (z wyjątkiem 12-14)
		// 0, 5-21, 25-31... → "nadgodzin"
		
		if (count === 1) {
			return t('workcalendar.overtime1')
		}
		
		const lastDigit = count % 10
		const lastTwoDigits = count % 100
		
		// Wyjątek: 12-14 zawsze używa "nadgodzin"
		if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
			return t('workcalendar.overtime5plus')
		}
		
		// 2-4 używa "nadgodziny"
		if (lastDigit >= 2 && lastDigit <= 4) {
			return t('workcalendar.overtime2_4')
		}
		
		// Wszystkie inne (0, 5-21, 25-31...) używa "nadgodzin"
		return t('workcalendar.overtime5plus')
	}

	// TanStack Query hooks
	const { data: workdays = [], isLoading: loadingWorkdays, refetch: refetchWorkdays } = useWorkdays()
	const { data: isConfirmed = false, isLoading: loadingConfirmation } = useCalendarConfirmation(
		currentMonth,
		currentYear
	)
	const { data: acceptedLeaveRequests = [], isLoading: loadingLeaveRequests } = useAcceptedLeaveRequests()
	const createWorkdayMutation = useCreateWorkday()
	const deleteWorkdayMutation = useDeleteWorkday()
	const toggleConfirmationMutation = useToggleCalendarConfirmation()

	const loading = loadingWorkdays || loadingConfirmation || loadingLeaveRequests

	useEffect(() => {
		calculateTotals(workdays, acceptedLeaveRequests, currentMonth, currentYear)
	}, [workdays, acceptedLeaveRequests, currentMonth, currentYear])

	const toggleConfirmationStatus = async () => {
		try {
			await toggleConfirmationMutation.mutateAsync({
				month: currentMonth,
				year: currentYear,
				isConfirmed: !isConfirmed,
			})
			await showAlert(
				isConfirmed ? t('workcalendar.cancelconfirm') : t('workcalendar.successconfirm')
			)
		} catch (error) {
			console.error('Failed to toggle confirmation status:', error)
		}
	}

	const calculateTotals = (workdays, acceptedLeaveRequests, month, year) => {
		let hours = 0
		let leaveDays = 0
		let workDaysSet = new Set()
		let otherAbsences = 0
		let overtime = 0

		const filteredWorkdays = workdays.filter(day => {
			const eventDate = new Date(day.date)
			return eventDate.getMonth() === month && eventDate.getFullYear() === year
		})

		filteredWorkdays.forEach(day => {
			if (day.hoursWorked) {
				hours += day.hoursWorked
				workDaysSet.add(new Date(day.date).toDateString())
			}
			if (day.additionalWorked) {
				overtime += day.additionalWorked
			}
			if (day.absenceType) {
				const absenceTypeLower = day.absenceType.toLowerCase()
				if (absenceTypeLower.includes('urlop') || absenceTypeLower.includes('vacation') || absenceTypeLower.includes('leave')) {
					leaveDays += 1
				} else {
					otherAbsences += 1
				}
			}
		})

		// Licz zaakceptowane wnioski urlopowe w danym miesiącu/roku
		if (Array.isArray(acceptedLeaveRequests)) {
			acceptedLeaveRequests.forEach(request => {
			if (!request.startDate || !request.endDate) return

			const startDate = new Date(request.startDate)
			const endDate = new Date(request.endDate)
			
			// Sprawdź czy wniosek ma daty w danym miesiącu/roku
			const requestStartMonth = startDate.getMonth()
			const requestStartYear = startDate.getFullYear()
			const requestEndMonth = endDate.getMonth()
			const requestEndYear = endDate.getFullYear()

			// Jeśli wniosek ma daty w danym miesiącu/roku
			if (
				(requestStartYear === year && requestStartMonth === month) ||
				(requestEndYear === year && requestEndMonth === month) ||
				(requestStartYear < year && requestEndYear > year) ||
				(requestStartYear === year && requestEndYear === year && requestStartMonth <= month && requestEndMonth >= month)
			) {
				// Sprawdź typ urlopu - użyj przetłumaczonego tekstu
				const translatedType = t(request.type).toLowerCase()
				const isVacation = translatedType.includes('urlop') || translatedType.includes('vacation') || translatedType.includes('leave')
				
				if (isVacation) {
					// Policz dni urlopu w danym miesiącu
					const monthStart = new Date(year, month, 1)
					const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
					const overlapStart = startDate > monthStart ? startDate : monthStart
					const overlapEnd = endDate < monthEnd ? endDate : monthEnd
					
					if (overlapStart <= overlapEnd) {
						// Ustaw godziny na 0:00:00 dla dokładnego liczenia dni
						const start = new Date(overlapStart.getFullYear(), overlapStart.getMonth(), overlapStart.getDate())
						const end = new Date(overlapEnd.getFullYear(), overlapEnd.getMonth(), overlapEnd.getDate())
						const diffTime = end - start
						const daysInMonth = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
						leaveDays += daysInMonth
					}
				} else {
					// Inna nieobecność - policz dni w danym miesiącu
					const monthStart = new Date(year, month, 1)
					const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
					const overlapStart = startDate > monthStart ? startDate : monthStart
					const overlapEnd = endDate < monthEnd ? endDate : monthEnd
					
					if (overlapStart <= overlapEnd) {
						// Ustaw godziny na 0:00:00 dla dokładnego liczenia dni
						const start = new Date(overlapStart.getFullYear(), overlapStart.getMonth(), overlapStart.getDate())
						const end = new Date(overlapEnd.getFullYear(), overlapEnd.getMonth(), overlapEnd.getDate())
						const diffTime = end - start
						const daysInMonth = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
						otherAbsences += daysInMonth
					}
				}
			}
		})
		}

		setTotalHours(hours)
		setAdditionalHours(overtime)
		setTotalWorkDays(workDaysSet.size)
		setTotalLeaveDays(leaveDays)
		setTotalLeaveHours(leaveDays * 8)
		setTotalOtherAbsences(otherAbsences)
	}

	const handleDateClick = async info => {
		// Determine clicked date from event or date click
		const clickedDate = info.date ? info.dateStr : (info.event ? info.event.startStr : info.dateStr)
		
		// Skip if it's a leave request event (we don't want to edit those)
		if (info.event && info.event.extendedProps?.type === 'leaveRequest') {
			return
		}

		setSelectedDate(clickedDate)
		
		// Find existing workdays for this date (excluding realTime entries)
		const clickedDateObj = new Date(clickedDate)
		const clickedDateStr = clickedDateObj.toDateString()
		const existingWorkdays = workdays.filter(day => {
			const dayDate = new Date(day.date)
			return dayDate.toDateString() === clickedDateStr
		})
		
		setModalIsOpen(true)
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
		calculateTotals(workdays, acceptedLeaveRequests, newMonth, newYear)
	}

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

	const handleSubmit = async e => {
		e.preventDefault()

		// Sprawdź czy dla tej daty nie ma już wpisu
		if (selectedDate) {
			const clickedDateObj = new Date(selectedDate)
			const clickedDateStr = clickedDateObj.toDateString()
			const existingWorkdays = workdays.filter(day => {
				const dayDate = new Date(day.date)
				return dayDate.toDateString() === clickedDateStr
			})

			if (existingWorkdays.length > 0) {
				setErrorMessage(t('workcalendar.oneactionforday'))
				return
			}

			// Sprawdź czy ten dzień jest w zakresie zaakceptowanego wniosku urlopowego/nieobecności
			if (Array.isArray(acceptedLeaveRequests)) {
				const hasAcceptedRequest = acceptedLeaveRequests.some(request => {
					if (!request.startDate || !request.endDate) return false
					
					const startDate = new Date(request.startDate)
					const endDate = new Date(request.endDate)
					
					// Sprawdź czy kliknięta data jest w zakresie wniosku (włącznie z datą końcową)
					const clickedDateOnly = new Date(clickedDateObj.getFullYear(), clickedDateObj.getMonth(), clickedDateObj.getDate())
					const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
					const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
					
					return clickedDateOnly >= startDateOnly && clickedDateOnly <= endDateOnly
				})
				
				if (hasAcceptedRequest) {
					setErrorMessage(t('workcalendar.cannotAddToAcceptedLeave') || 'Nie można dodawać wydarzeń do dnia z zaakceptowanym wnioskiem urlopowym/nieobecnością')
					return
				}
			}
		}

		if (hoursWorked && absenceType) {
			setErrorMessage(t('workcalendar.formalerttwo'))
			return
		}

		if (!hoursWorked && !absenceType) {
			setErrorMessage(t('workcalendar.formalertone'))
			return
		}

		if (absenceType) {
			setAdditionalWorked('')
			setRealTimeDayWorked('')
		}

		if (hoursWorked && !additionalWorked && !realTimeDayWorked) {
			setAdditionalWorked('')
			setRealTimeDayWorked('')
		}

		const data = {
			date: selectedDate,
			hoursWorked: hoursWorked ? parseInt(hoursWorked) : null,
			additionalWorked: hoursWorked ? (additionalWorked ? parseInt(additionalWorked) : null) : null,
			realTimeDayWorked: hoursWorked ? realTimeDayWorked || null : null,
			absenceType: absenceType || null,
			notes: notes || null,
		}

		try {
			await createWorkdayMutation.mutateAsync(data)
			// Refresh workdays after creation
			await refetchWorkdays()
			setModalIsOpen(false)
			setHoursWorked('')
			setAdditionalWorked('')
			setRealTimeDayWorked('')
			setAbsenceType('')
			setNotes('')
			setErrorMessage('')
		} catch (error) {
			console.error('Failed to add workday:', error)
		}
	}

	const handleDelete = async id => {
		const confirmed = await showConfirm(
			t('workcalendar.deleteConfirm') || 'Czy na pewno chcesz usunąć ten wpis?'
		)
		if (!confirmed) return

		try {
			await deleteWorkdayMutation.mutateAsync(id)
			// Refresh workdays after deletion
			await refetchWorkdays()
		} catch (error) {
			console.error('Failed to delete workday:', error)
		}
	}

	const renderEventContent = eventInfo => {
		return (
			<div className={`event-content ${eventInfo.event.extendedProps?.isWorkday ? 'event-workday' : 'event-absence'}`}>
				<span>{eventInfo.event.title}</span>
			</div>
		)
	}

	const resetFormFields = () => {
		setHoursWorked('')
		setAdditionalWorked('')
		setRealTimeDayWorked('')
		setAbsenceType('')
		setNotes('')
		setErrorMessage('')
	}

	if (loading) return <Loader />

	return (
		<div className="row calendar-my-work">
			<div className="col-xl-9">
				<h3><img src="img/clock.png" alt="ikonka w sidebar" />{t('workcalendar.h3')}</h3>
				<hr />

				<div className="calendar-controls flex flex-wrap items-center" style={{ gap: '5px' }}>
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

				<FullCalendar
					plugins={[dayGridPlugin, interactionPlugin]}
					initialView="dayGridMonth"
					// locale="pl"
					locale={i18n.resolvedLanguage}
					firstDay={1}
					showNonCurrentDates={false}
					events={[
						...workdays.map(day => ({
							title: day.hoursWorked
								? `${day.hoursWorked} ${t('workcalendar.allfrommonthhours')} ${
										day.additionalWorked
											? ` ${t('workcalendar.include')} ${day.additionalWorked} ${getOvertimeWord(day.additionalWorked)}`
											: ''
								  }${day.notes ? ` | ${day.notes}` : ''}`
								: `${day.absenceType}${day.notes ? ` | ${day.notes}` : ''}`,
							start: day.date,
							backgroundColor: day.hoursWorked ? 'blue' : 'green',
							textColor: 'white',
							id: day._id,
							classNames: day.hoursWorked ? 'event-workday' : 'event-absence',
							extendedProps: {
								isWorkday: !!day.hoursWorked,
								notes: day.notes,
							},
						})),
						...workdays
							.filter(day => day.realTimeDayWorked)
							.map(day => ({
								title: `${t('workcalendar.worktime')} ${day.realTimeDayWorked}`,
								start: day.date,
								backgroundColor: 'yellow',
								textColor: 'black',
								id: `${day._id}-realTime`,
								classNames: 'event-real-time',
							})),
						// Zaakceptowane wnioski urlopowe
						...acceptedLeaveRequests
							.filter(request => request.startDate && request.endDate)
							.map(request => {
								// FullCalendar traktuje end jako exclusive, więc dodajemy 1 dzień aby pokazać ostatni dzień
								const endDate = new Date(request.endDate)
								endDate.setDate(endDate.getDate() + 1)
								const endDateStr = endDate.toISOString().split('T')[0]
								
								return {
									title: `${t(request.type)}`,
									start: request.startDate,
									end: endDateStr,
									allDay: true,
									backgroundColor: '#10b981',
									borderColor: '#059669',
									textColor: 'white',
									extendedProps: { type: 'leaveRequest', requestId: request._id }
								}
							}),
					]}
					ref={calendarRef}
					dateClick={handleDateClick}
					eventClick={handleDateClick}
					eventContent={renderEventContent}
					displayEventTime={false}
					datesSet={handleMonthChange}
					height="auto"
					className="rounded-2xl overflow-hidden shadow-md"
				/>
			</div>
			<div className="col-xl-3 resume-month-work">
				{/* <h3 className="h3resume" style={{ marginBottom: '0px' }}>
					{t('workcalendar.confirmmonth')}
				</h3>
				<label style={{ marginLeft: '10px', marginTop: '15px', marginBottom: '35px' }}>
					<img src="/img/arrow-right.png" alt="" style={{ width: '40px', marginRight: '10px', marginTop: '-10px' }} />
					<input
						type="checkbox"
						checked={isConfirmed}
						onChange={async () => {
							await toggleConfirmationStatus()
							await showAlert(isConfirmed ? t('workcalendar.cancelconfirm') : t('workcalendar.successconfirm'))
						}}
						style={{ marginRight: '10px', transform: 'scale(2)', cursor: 'pointer' }}
					/>
					{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
				</label> */}
				{/* <h3 className="h3resume" style={{ marginBottom: '0px' }}>
  {t('workcalendar.confirmmonth')}
</h3> */}

<button
  onClick={async () => {
    await toggleConfirmationStatus()
  }}
  style={{
    marginLeft: '10px',
    marginTop: '20px',
    marginBottom: '35px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    backgroundColor: isConfirmed ? '#9ca3af' : '#22c55e', // szary lub zielony
  }}
  className='newbutton-confirmmonth'
>
  {isConfirmed
    ? t('workcalendar.cancelconfirmation') 
    : t('workcalendar.confirmmonthbutton')} 
</button>
<br></br>
{isConfirmed ? (
  <span style={{ display: 'flex', alignItems: 'center', padding: '15px' }} className='confirm-border'>
    <img
      src="/img/check.png"
      alt=""
      style={{ width: '30px', marginRight: '8px' }}
    />
    {t('workcalendar.confirmed')}
  </span>
) : (
  <span style={{ display: 'flex', alignItems: 'center', padding: '15px' }} className='confirm-border'>
    <img
      src="/img/check.png"
      alt=""
      style={{
        width: '30px',
        marginRight: '8px',
        filter: 'grayscale(100%)', // 🔥 wyszarzenie
        opacity: 0.6,              // opcjonalnie przyciemnienie
      }}
    />
    {t('workcalendar.notConfirmed')}
  </span>
)}


				{/* <h3 className="resumecales h3resume">{t('workcalendar.allfrommonth')}</h3> */}
				<p className='allfrommonth-p'>
					<img src="/img/calendar mono.png" /> {t('workcalendar.allfrommonth1')} {totalWorkDays}
				</p>
				<p className='allfrommonth-p'>
				<img src="/img/time.png" /> {t('workcalendar.allfrommonth2')} {totalHours} {t('workcalendar.allfrommonthhours')}
				</p>
				<p className='allfrommonth-p'>
				<img src="/img/clock mono.png" /> {t('workcalendar.allfrommonth3')} {additionalHours} {getOvertimeWord(additionalHours)}
				</p>

				<p className='allfrommonth-p'>
				<img src="/img/weekend mono.png" /> {t('workcalendar.allfrommonth4')} {totalLeaveDays} ({totalLeaveHours} {t('workcalendar.allfrommonthhours')})
				</p>
				<p className='allfrommonth-p'>
				<img src="/img/dismiss.png" /> {t('workcalendar.allfrommonth5')} {totalOtherAbsences}
				</p>
			</div>

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => {
					setModalIsOpen(false)
					resetFormFields()
				}}
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
						backgroundColor: 'white',
						boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
					},
				}}
				contentLabel={t('workcalendar.modalContentLabel')}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
					{selectedDate && (
						<h2 className="text-xl font-semibold mb-4 text-gray-800" style={{ margin: 0 }}>
							{t('workcalendar.entriesForDate') || 'Wpisy dla daty'}: {new Date(selectedDate).toLocaleDateString(i18n.resolvedLanguage, { day: 'numeric', month: 'numeric', year: 'numeric' })}
						</h2>
					)}
					<button
						onClick={() => {
							setModalIsOpen(false)
							resetFormFields()
						}}
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

				{selectedDate && (() => {
					const clickedDateObj = new Date(selectedDate)
					const clickedDateStr = clickedDateObj.toDateString()
					const existingWorkdays = workdays.filter(day => {
						const dayDate = new Date(day.date)
						return dayDate.toDateString() === clickedDateStr
					})

					// Check if there's an accepted leave request for this date
					const hasAcceptedRequest = Array.isArray(acceptedLeaveRequests) && acceptedLeaveRequests.some(request => {
						if (!request.startDate || !request.endDate) return false
						
						const startDate = new Date(request.startDate)
						const endDate = new Date(request.endDate)
						
						// Check if clicked date is within the request range (inclusive)
						const clickedDateOnly = new Date(clickedDateObj.getFullYear(), clickedDateObj.getMonth(), clickedDateObj.getDate())
						const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
						const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
						
						return clickedDateOnly >= startDateOnly && clickedDateOnly <= endDateOnly
					})

					return existingWorkdays.length > 0 ? (
						<div style={{ marginBottom: '30px' }}>
							<h3 style={{
								marginBottom: '15px',
								color: '#2c3e50',
								fontSize: '18px',
								fontWeight: '600'
							}}>
								{t('workcalendar.existingEntries') || 'Istniejące wpisy'}
							</h3>
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '10px'
							}}>
								{existingWorkdays.map((workday) => {
									const displayText = workday.hoursWorked
										? `${workday.hoursWorked} ${t('workcalendar.allfrommonthhours')}${workday.additionalWorked ? ` ${t('workcalendar.include')} ${workday.additionalWorked} ${getOvertimeWord(workday.additionalWorked)}` : ''}${workday.realTimeDayWorked ? ` | ${t('workcalendar.worktime')} ${workday.realTimeDayWorked}` : ''}`
										: workday.absenceType
									
									return (
										<div key={workday._id} style={{
											padding: '15px',
											backgroundColor: '#f8f9fa',
											borderRadius: '8px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											minHeight: '60px'
										}}>
											<div style={{ flex: 1 }}>
												<div style={{
													fontWeight: '600',
													color: '#2c3e50',
													marginBottom: '5px'
												}}>
													{displayText}
												</div>
												{workday.notes && (
													<div style={{
														fontSize: '14px',
														color: '#7f8c8d',
														marginTop: '5px',
														fontStyle: 'italic'
													}}>
														{t('workcalendar.notes') || 'Uwagi'}: {workday.notes}
													</div>
												)}
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleDelete(workday._id)
												}}
												style={{
													background: '#e74c3c',
													color: 'white',
													border: 'none',
													borderRadius: '6px',
													padding: '8px 16px',
													cursor: 'pointer',
													fontSize: '16px',
													fontWeight: '500',
													flexShrink: 0,
													marginLeft: '10px'
												}}
											>
												{t('workcalendar.delete') || 'Usuń'}
											</button>
										</div>
									)
								})}
							</div>
							<div style={{
								marginTop: '20px',
								padding: '15px',
								backgroundColor: '#fff3cd',
								border: '1px solid #ffc107',
								borderRadius: '8px',
								color: '#856404'
							}}>
								{t('workcalendar.oneactionforday')}
							</div>
							{hasAcceptedRequest && (
								<div style={{
									marginTop: '20px',
									padding: '15px',
									backgroundColor: '#f8d7da',
									border: '1px solid #f5c6cb',
									borderRadius: '8px',
									color: '#721c24'
								}}>
									{t('workcalendar.cannotAddToAcceptedLeave') || 'Nie można dodawać wydarzeń do dnia z zaakceptowanym wnioskiem urlopowym/nieobecnością'}
								</div>
							)}
						</div>
					) : hasAcceptedRequest ? (
						<div style={{
							padding: '15px',
							backgroundColor: '#f8d7da',
							border: '1px solid #f5c6cb',
							borderRadius: '8px',
							color: '#721c24'
						}}>
							{t('workcalendar.cannotAddToAcceptedLeave') || 'Nie można dodawać wydarzeń do dnia z zaakceptowanym wnioskiem urlopowym/nieobecnością'}
						</div>
					) : (
						<>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<h2 className="text-lg font-semibold mt-4 mb-2 text-gray-800">{t('workcalendar.h2modal')}</h2>
									<input
										type="number"
										min="1"
										max="24"
										placeholder={t('workcalendar.placeholder1')}
										value={hoursWorked}
										onChange={e => setHoursWorked(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<input
										type="number"
										min="0"
										placeholder={t('workcalendar.placeholder2')}
										value={additionalWorked}
										onChange={e => setAdditionalWorked(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<input
										type="text"
										placeholder={t('workcalendar.placeholder3')}
										value={realTimeDayWorked}
										onChange={e => setRealTimeDayWorked(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<h2 className="text-lg font-semibold mt-4 mb-2 text-gray-800">{t('workcalendar.h2modalabsence')}</h2>
									<input
										type="text"
										placeholder={t('workcalendar.placeholder4')}
										value={absenceType}
										onChange={e => setAbsenceType(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>

								<div>
									<label className="text-lg font-semibold mt-4 mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
									<textarea
										placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
										value={notes}
										onChange={e => setNotes(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="3"
									/>
								</div>

								{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}

								<div className="flex justify-end gap-3 pt-4">
									<button
										type="submit"
										className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
										{t('workcalendar.save')}
									</button>
									<button
										type="button"
										onClick={() => {
											setModalIsOpen(false)
											resetFormFields()
										}}
										className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
										{t('workcalendar.cancel')}
									</button>
								</div>
							</form>
						</>
					)
				})()}
			</Modal>
		</div>
	)
}

export default MonthlyCalendar
