import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Sidebar from '../dashboard/Sidebar'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'

function LeavePlanner() {
	const [selectedDates, setSelectedDates] = useState([])
	const [acceptedLeaveRequests, setAcceptedLeaveRequests] = useState([])
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchLeavePlans()
		fetchAcceptedLeaveRequests()
	}, [])

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

	const fetchLeavePlans = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/planlea/leave-plans`)
			setSelectedDates(response.data)
		} catch (error) {
			console.error('Error fetching leave plans:', error)
		} finally {
			setLoading(false)
		}
	}

	const fetchAcceptedLeaveRequests = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/leaveworks/user-accepted-leave-requests`, {
				withCredentials: true
			})
			
			// Filtruj tylko wnioski z poprawnymi datami
			const validRequests = response.data.filter(request => 
				request.startDate && request.endDate && request.userId
			)
			
			setAcceptedLeaveRequests(validRequests)
		} catch (error) {
			console.error('Error fetching accepted leave requests:', error)
		}
	}

	const toggleDate = async date => {
		const formattedDate = new Date(date).toISOString().split('T')[0]

		try {
			const isSelected = selectedDates.includes(formattedDate)

			if (isSelected) {
				await axios.delete(`${API_URL}/api/planlea/leave-plans`, {
					data: { date: formattedDate },
				})
				setSelectedDates(selectedDates.filter(d => d !== formattedDate))
			} else {
				await axios.post(`${API_URL}/api/planlea/leave-plans`, { date: formattedDate })
				setSelectedDates([...selectedDates, formattedDate])
			}
		} catch (error) {
			console.error('Error toggling date:', error)
		}
	}

	const removeDate = async date => {
		try {
			await axios.delete(`${API_URL}/api/planlea/leave-plans`, {
				data: { date },
			})
			setSelectedDates(selectedDates.filter(d => d !== date))
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
				<div style={{ padding: '20px' }} id="leave-planner">
					<h3><img src="img/calendar.png" alt="ikonka w sidebar" /> {t('leaveplanner.mainheader')}</h3>
					<hr />
					<div style={{ marginBottom: '20px' }}>
						<h4>{t('leaveplanner.header')}</h4>
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
									{/* {date} */}
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
											{t(request.type)}
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

					<div className="calendar-controls flex flex-wrap gap-4 items-center" style={{ marginTop: '40px' }}>
						<label className="flex items-center space-x-2">
							{t('workcalendar.monthlabel')}
							<select
								value={currentMonth}
								onChange={handleMonthSelect}
								style={{ marginLeft: '5px' }}
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
						<label style={{ marginLeft: '10px' }} className="flex items-center space-x-2">
							{t('workcalendar.yearlabel')}
							<select
								value={currentYear}
								onChange={handleYearSelect}
								style={{ marginLeft: '5px' }}
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
								// Plany urlopów (klikalne)
								...selectedDates.map(date => ({
									title: t('leaveplanner.vactiontitle'),
									start: date,
									allDay: true,
									backgroundColor: 'blue',
									extendedProps: { type: 'plan', date: date }
								})),
								// Zaakceptowane wnioski urlopowe (tylko do wyświetlania)
								...acceptedLeaveRequests
									.filter(request => request.startDate && request.endDate) // Sprawdź czy daty istnieją
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
											backgroundColor: 'green',
											borderColor: 'darkgreen',
											extendedProps: { type: 'request', requestId: request._id }
										}
									})
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
