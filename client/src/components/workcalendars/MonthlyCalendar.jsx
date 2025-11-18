import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import axios from 'axios'
import Modal from 'react-modal'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'

Modal.setAppElement('#root')

function MonthlyCalendar() {
	const [workdays, setWorkdays] = useState([])
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
	const [isConfirmed, setIsConfirmed] = useState(false)
	const [realTimeDayWorked, setRealTimeDayWorked] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)
	const { showAlert } = useAlert()

	const fetchWorkdays = async cancelToken => {
		try {
			const response = await axios.get(`${API_URL}/api/workdays`, {
				cancelToken,
			})
			setWorkdays(response.data)
		} catch (error) {
			if (axios.isCancel(error)) {
				// console.log('Fetch workdays canceled:', error.message);
			} else {
				console.error('Failed to fetch workdays:', error)
			}
		} finally {
			setLoading(false)
		}
	}

	const checkConfirmationStatus = async cancelToken => {
		try {
			const response = await axios.get(`${API_URL}/api/calendar/confirmation-status`, {
				params: {
					month: currentMonth,
					year: currentYear,
				},
				cancelToken,
			})
			setIsConfirmed(response.data.isConfirmed || false)
		} catch (error) {
			if (axios.isCancel(error)) {
				// console.log('Check confirmation status canceled:', error.message);
			} else {
				console.error('Failed to check confirmation status:', error)
			}
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		const source = axios.CancelToken.source()
		fetchWorkdays(source.token)
		checkConfirmationStatus(source.token)
		return () => {
			source.cancel('Operation cancelled: component unmounted or dependencies changed.')
		}
	}, [currentMonth, currentYear])

	useEffect(() => {
		calculateTotals(workdays, currentMonth, currentYear)
	}, [workdays, currentMonth, currentYear])

	const toggleConfirmationStatus = async () => {
		try {
			await axios.post(`${API_URL}/api/calendar/confirm`, {
				month: currentMonth,
				year: currentYear,
				isConfirmed: !isConfirmed,
			})
			setIsConfirmed(!isConfirmed)
		} catch (error) {
			console.error('Failed to toggle confirmation status:', error)
		}
	}

	const calculateTotals = (workdays, month, year) => {
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
				if (day.absenceType.toLowerCase().includes('urlop') || 'vacation') {
					leaveDays += 1
				} else {
					otherAbsences += 1
				}
			}
		})

		setTotalHours(hours)
		setAdditionalHours(overtime)
		setTotalWorkDays(workDaysSet.size)
		setTotalLeaveDays(leaveDays)
		setTotalLeaveHours(leaveDays * 8)
		setTotalOtherAbsences(otherAbsences)
	}

	const handleDateClick = async info => {
		const eventsOnDate = workdays.filter(
			day => new Date(day.date).toDateString() === new Date(info.dateStr).toDateString()
		)

		if (eventsOnDate.length >= 1) {
			await showAlert(t('workcalendar.oneactionforday'))
			return
		}

		setSelectedDate(info.dateStr)
		setModalIsOpen(true)
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
		calculateTotals(workdays, newMonth, newYear)
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

	const goToSelectedDate = (month, year) => {
		const calendarApi = calendarRef.current.getApi()
		calendarApi.gotoDate(new Date(year, month, 1))
	}

	const handleSubmit = async e => {
		e.preventDefault()

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
		}

		// console.log('Data to be submitted:', data)

		try {
			await axios.post(`${API_URL}/api/workdays`, data)
			setModalIsOpen(false)
			setHoursWorked('')
			setAdditionalWorked('')
			setRealTimeDayWorked('')
			setAbsenceType('')
			setErrorMessage('')
			fetchWorkdays()
		} catch (error) {
			console.error('Failed to add workday:', error)
		}
	}

	const handleDelete = async id => {
		try {
			await axios.delete(`${API_URL}/api/workdays/${id}`)
			fetchWorkdays()
		} catch (error) {
			console.error('Failed to delete workday:', error)
		}
	}

	const renderEventContent = eventInfo => {
		return (
			<div className={`event-content ${eventInfo.event.extendedProps.isWorkday ? 'event-workday' : 'event-absence'}`}>
				<span>{eventInfo.event.title}</span>
				<span className="event-delete" onClick={() => handleDelete(eventInfo.event.id)}>
					×
				</span>
			</div>
		)
	}

	const resetFormFields = () => {
		setHoursWorked('')
		setAdditionalWorked('')
		setRealTimeDayWorked('')
		setAbsenceType('')
		setErrorMessage('')
	}

	if (loading) return <Loader />

	return (
		<div className="row calendar-my-work">
			<div className="col-xl-9">
				<h3><img src="img/clock.png" alt="ikonka w sidebar" />{t('workcalendar.h3')}</h3>
				<hr />

				<div className="calendar-controls flex flex-wrap gap-4 items-center">
					<label className="flex items-center space-x-2">
						<span className="text-gray-700">{t('workcalendar.monthlabel')}</span>
						<select
							value={currentMonth}
							onChange={handleMonthSelect}
							className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{new Date(0, i)
										.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
										.replace(/^./, str => str.toUpperCase())}
								</option>
							))}
						</select>
					</label>

					<label className="flex items-center space-x-2">
						<span className="text-gray-700">{t('workcalendar.yearlabel')}</span>
						<select
							value={currentYear}
							onChange={handleYearSelect}
							className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
							{Array.from({ length: 20 }, (_, i) => {
								const year = new Date().getFullYear() - 10 + i
								return (
									<option key={year} value={year}>
										{year}
									</option>
								)
							})}
						</select>
					</label>
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
											? ` ${t('workcalendar.include')} ${day.additionalWorked} ${t('workcalendar.overtime')}`
											: ''
								  }`
								: day.absenceType,
							start: day.date,
							backgroundColor: day.hoursWorked ? 'blue' : 'green',
							textColor: 'white',
							id: day._id,
							classNames: day.hoursWorked ? 'event-workday' : 'event-absence',
							extendedProps: {
								isWorkday: !!day.hoursWorked,
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
					]}
					ref={calendarRef}
					dateClick={handleDateClick}
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
    await showAlert(
      isConfirmed
        ? t('workcalendar.cancelconfirm')
        : t('workcalendar.successconfirm')
    )
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
      style={{ width: '38px', marginRight: '8px' }}
    />
    {t('workcalendar.confirmed')}
  </span>
) : (
  <span style={{ display: 'flex', alignItems: 'center', padding: '15px' }} className='confirm-border'>
    <img
      src="/img/check.png"
      alt=""
      style={{
        width: '38px',
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
				<img src="/img/clock mono.png" /> {t('workcalendar.allfrommonth3')} {additionalHours} {t('workcalendar.allfrommonthhours')}
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
					},
					content: {
						position: 'relative',
						inset: 'unset',
						margin: '0',
						maxWidth: '100%',
						width: '360px',
						borderRadius: '1rem',
						padding: '2rem',
					},
				}}
				contentLabel="Dodaj godziny pracy lub nieobecność">
				<h2 className="text-xl font-semibold mb-2 text-gray-800">{t('workcalendar.h2modal')}</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
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

					{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}

					<div className="flex justify-end gap-3 pt-4">
						<button
							type="submit"
							className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
							Zapisz
						</button>
						<button
							type="button"
							onClick={() => {
								setModalIsOpen(false)
								resetFormFields()
							}}
							className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
							Anuluj
						</button>
					</div>
				</form>
			</Modal>
		</div>
	)
}

export default MonthlyCalendar
