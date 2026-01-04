import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'
import { useAllLeavePlans } from '../../hooks/useLeavePlans'
import { useAllAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../../config.js'

function AdminAllLeaveCalendar() {
	const colorsRef = useRef({})
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
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
	const [selectedUser, setSelectedUser] = useState(null)
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, logout, username, teamId } = useAuth()
	const isSuperAdmin = username === 'michalipka1@gmail.com'

	// TanStack Query hooks
	// Dla /all-leave-plans zawsze pobieramy wszystkich użytkowników z zespołu, niezależnie od roli
	const { data: users = [], isLoading: loadingUsers, error: usersError } = useQuery({
		queryKey: ['users', 'all-team'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/users/alluserplans`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000,
		cacheTime: 10 * 60 * 1000,
	})
	
	const { data: allLeavePlans = [], isLoading: loadingPlans, error: plansError } = useAllLeavePlans()
	const { data: allAcceptedRequests = [], isLoading: loadingRequests, error: requestsError } = useAllAcceptedLeaveRequests()
	const { data: settings } = useSettings()

	const loading = loadingUsers || loadingPlans || loadingRequests
	const error = usersError || plansError || requestsError

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

	// Dla /all-leave-plans zawsze pokazujemy wszystkie plany i wnioski z zespołu
	// Backend już filtruje na podstawie teamId, więc nie trzeba dodatkowo filtrować
	const leavePlans = useMemo(() => {
		return allLeavePlans.filter(plan => {
			// Filtruj tylko aby upewnić się, że plan ma użytkownika
			return plan.userId && users.some(user => user._id === plan.userId)
		})
	}, [allLeavePlans, users])

	const acceptedLeaveRequests = useMemo(() => {
		return allAcceptedRequests.filter(request => {
			// Filtruj tylko aby upewnić się, że request ma użytkownika
			if (!request.userId || !request.userId._id) {
				return false
			}
			return users.some(user => user._id === request.userId._id)
		})
	}, [allAcceptedRequests, users])

	// Generate stable color based on user name (deterministic) - same as in Schedule
	const getColorForUser = useCallback((userIdentifier) => {
		if (!userIdentifier) return '#3498db'
		
		// Use username or full name as identifier for consistency
		const key = userIdentifier
		
		if (!colorsRef.current[key]) {
			// Generate stable color from string hash - same algorithm as in Schedule.jsx
			let hash = 0
			for (let i = 0; i < key.length; i++) {
				hash = key.charCodeAt(i) + ((hash << 5) - hash)
			}
			const hue = Math.abs(hash) % 360
			const saturation = 70
			const lightness = 50
			colorsRef.current[key] = `hsl(${hue}, ${saturation}%, ${lightness}%)`
		}
		return colorsRef.current[key]
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

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
	}

	const handleUserClick = userId => {
		navigate(`/leave-plans/${userId}`)
	}

	return (
		<>
			<Sidebar handleLogout={logout} role={role} username={username} />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div id='all-leaveplans'>
				<h3><img src="img/schedule.png" alt="ikonka w sidebar" /> {t('planslist.h3')}</h3>
				<hr />
				{error && <p style={{ color: 'red' }}>{error.message || t('planslist.error')}</p>}
                <p>{t('planslist.emplo')}</p>
				<ul style={{ listStyle: 'inherit', marginLeft: '20px' }}>
					{users.map(user => (
						<li key={user._id} onClick={() => handleUserClick(user._id)} style={{ cursor: "pointer", marginBottom: '5px' }}>
							{user.firstName} {user.lastName} - {user.position || t('newuser.noPosition')}
						</li>
					))}
				</ul>
				<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '40px', gap: '5px' }}>
					<select value={currentMonth} onChange={handleMonthSelect} style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
						{Array.from({ length: 12 }, (_, i) => (
							<option key={i} value={i}>
								{new Date(0, i)
									.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
									.replace(/^./, str => str.toUpperCase())}
							</option>
						))}
					</select>
					<select value={currentYear} onChange={handleYearSelect} style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
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
						plugins={[dayGridPlugin]}
						initialView='dayGridMonth'
						initialDate={new Date()}
						locale={i18n.resolvedLanguage}
						height='auto'
						firstDay={1}
						showNonCurrentDates={false}
						events={[
							// Plany urlopów
							...leavePlans.map(plan => {
								const employeeName = `${plan.firstName} ${plan.lastName}`
								return {
									title: `${employeeName} (Plan)`,
									start: plan.date,
									allDay: true,
									backgroundColor: getColorForUser(employeeName),
									borderColor: getColorForUser(employeeName),
									extendedProps: { type: 'plan', userId: plan.userId }
								}
							}),
							// Zaakceptowane wnioski urlopowe - generuj osobne eventy dla każdego dnia (z pominięciem weekendów i świąt)
							...acceptedLeaveRequests
								.filter(request => request.userId && request.userId.firstName && request.userId.lastName && request.startDate && request.endDate) // Sprawdź czy mamy pełną nazwę i daty
								.flatMap(request => {
									const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
									const employeeName = `${request.userId.firstName} ${request.userId.lastName}`
									return dates.map(date => ({
										title: `${employeeName} (${t(request.type)})`,
										start: date,
										allDay: true,
										backgroundColor: getColorForUser(employeeName),
										borderColor: getColorForUser(employeeName),
										extendedProps: { type: 'request', userId: request.userId._id, requestId: request._id }
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
								extendedProps: {
									type: 'holiday',
									holidayName: holiday.name
								}
							}))
						]}
						ref={calendarRef}
						datesSet={handleMonthChange}
					/>
				</div>
			</div>
			)}
		</>
	)
}

export default AdminAllLeaveCalendar
