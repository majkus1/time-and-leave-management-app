import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'
import { useUsers } from '../../hooks/useUsers'
import { useAllLeavePlans } from '../../hooks/useLeavePlans'
import { useAllAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'

function AdminAllLeaveCalendar() {
	const colorsRef = useRef({})
	const usedColors = useRef(new Set())
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
	const { data: users = [], isLoading: loadingUsers, error: usersError } = useUsers()
	const { data: allLeavePlans = [], isLoading: loadingPlans, error: plansError } = useAllLeavePlans()
	const { data: allAcceptedRequests = [], isLoading: loadingRequests, error: requestsError } = useAllAcceptedLeaveRequests()

	const loading = loadingUsers || loadingPlans || loadingRequests
	const error = usersError || plansError || requestsError

	// Filtrowanie danych na podstawie uprawnień
	const leavePlans = useMemo(() => {
		if (isSuperAdmin) {
			return allLeavePlans
		} else {
			return allLeavePlans.filter(plan => {
				const hasUser = users.some(user => user._id === plan.userId)
				return hasUser
			})
		}
	}, [allLeavePlans, users, isSuperAdmin])

	const acceptedLeaveRequests = useMemo(() => {
		if (isSuperAdmin) {
			return allAcceptedRequests.filter(request => {
				if (!request.userId || !request.userId._id) {
					return false
				}
				return true
			})
		} else {
			return allAcceptedRequests.filter(request => {
				if (!request.userId || !request.userId._id) {
					return false
				}
				const hasUser = users.some(user => user._id === request.userId._id)
				return hasUser
			})
		}
	}, [allAcceptedRequests, users, isSuperAdmin])

	const generateUniqueColor = () => {
		let color
		do {
			const randomHue = Math.random() * 360
			color = `hsl(${randomHue}, 70%, 80%)`
		} while (usedColors.current.has(color))
		usedColors.current.add(color)
		return color
	}
	
	const getColorForUser = username => {
		if (!colorsRef.current[username]) {
			colorsRef.current[username] = generateUniqueColor()
		}
		return colorsRef.current[username]
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
				<div className="calendar-controls flex flex-wrap gap-4 items-center" style={{ marginTop: '40px' }}>
					<label className="flex items-center space-x-2">
					{t('workcalendar.monthlabel')}
						<select value={currentMonth} onChange={handleMonthSelect} style={{ marginLeft: '5px' }} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
						<select value={currentYear} onChange={handleYearSelect} style={{ marginLeft: '5px' }} className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
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
						plugins={[dayGridPlugin]}
						initialView='dayGridMonth'
						initialDate={new Date()}
						locale={i18n.resolvedLanguage}
						height='auto'
						firstDay={1}
						showNonCurrentDates={false}
						events={[
							// Plany urlopów
							...leavePlans.map(plan => ({
								title: `${plan.firstName} ${plan.lastName} (Plan)`,
								start: plan.date,
								allDay: true,
								backgroundColor: getColorForUser(plan.username),
								borderColor: getColorForUser(plan.username),
								extendedProps: { type: 'plan', userId: plan.userId }
							})),
							// Zaakceptowane wnioski urlopowe
							...acceptedLeaveRequests
								.filter(request => request.userId && request.userId.username) // Dodatkowe zabezpieczenie
								.map(request => {
									// FullCalendar traktuje end jako exclusive, więc dodajemy 1 dzień aby pokazać ostatni dzień
									const endDate = new Date(request.endDate)
									endDate.setDate(endDate.getDate() + 1)
									const endDateStr = endDate.toISOString().split('T')[0]
									
									return {
										title: `${request.userId.firstName} ${request.userId.lastName} (${t(request.type)})`,
										start: request.startDate,
										end: endDateStr,
										allDay: true,
										backgroundColor: getColorForUser(request.userId.username),
										borderColor: getColorForUser(request.userId.username),
										extendedProps: { type: 'request', userId: request.userId._id, requestId: request._id }
									}
								})
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
