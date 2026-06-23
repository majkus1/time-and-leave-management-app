import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'
import { useAllLeavePlans } from '../../hooks/useLeavePlans'
import { useAllLeaveRequests, useAllAcceptedLeaveRequests, useOwnLeaveRequests } from '../../hooks/useLeaveRequests'
import { mergeCalendarLeaveRequests, isPendingLeaveStatus } from '../../utils/leaveRequestCalendarVisibility'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../../config.js'
import Modal from 'react-modal'
import { useDepartments } from '../../hooks/useDepartments'
import LeaveAvailabilityChecker from './LeaveAvailabilityChecker'

function AdminAllLeaveCalendar() {
	const colorsRef = useRef({})
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	
	// Filtrowanie i widok
	const [filterModalOpen, setFilterModalOpen] = useState(false)
	const [showAllTeam, setShowAllTeam] = useState(true)
	const [selectedDepartments, setSelectedDepartments] = useState([])
	const [selectedUserIds, setSelectedUserIds] = useState([])
	const [calendarView, setCalendarView] = useState('single') // 'single' lub 'all-months'
	const [expandedDepartments, setExpandedDepartments] = useState({})
	const [availabilityAssistantOpen, setAvailabilityAssistantOpen] = useState(false)
	
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
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, logout, username, teamId, userId } = useAuth()

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
	const { data: allTeamLeaveRequests = [], isLoading: loadingAllRequests, error: allRequestsError } = useAllLeaveRequests()
	const { data: acceptedSentTeamRequests = [], isLoading: loadingAcceptedRequests, error: acceptedRequestsError } = useAllAcceptedLeaveRequests()
	const { data: ownLeaveRequests = [], isLoading: loadingOwnRequests } = useOwnLeaveRequests()
	const { data: settings } = useSettings()
	const { data: departments = [] } = useDepartments(teamId)
	
	const loading = loadingUsers || loadingPlans || loadingAllRequests || loadingAcceptedRequests || loadingOwnRequests
	const error = usersError || plansError || allRequestsError || acceptedRequestsError

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

	// Filtrowanie użytkowników na podstawie wybranych opcji
	const filteredUsers = useMemo(() => {
		if (showAllTeam) {
			return users
		}
		
		if (selectedUserIds.length > 0) {
			return users.filter(user => selectedUserIds.includes(user._id))
		}
		
		if (selectedDepartments.length > 0) {
			return users.filter(user => {
				if (!user.department || !Array.isArray(user.department)) return false
				return user.department.some(dept => selectedDepartments.includes(dept))
			})
		}
		
		return users
	}, [users, showAllTeam, selectedDepartments, selectedUserIds])

	// Filtrowanie planów i wniosków na podstawie wybranych użytkowników
	const leavePlans = useMemo(() => {
		const filteredUserIds = new Set(filteredUsers.map(u => u._id))
		return allLeavePlans.filter(plan => {
			return plan.userId && filteredUserIds.has(plan.userId)
		})
	}, [allLeavePlans, filteredUsers])

	const ownPendingLeaveRequests = useMemo(
		() => (Array.isArray(ownLeaveRequests) ? ownLeaveRequests : []).filter((r) => isPendingLeaveStatus(r?.status)),
		[ownLeaveRequests]
	)

	const acceptedLeaveRequests = useMemo(() => {
		const filteredUserIds = new Set(
			filteredUsers
				.map((u) => {
					if (!u || !u._id) return null
					return u._id.toString()
				})
				.filter(Boolean)
		)

		return mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedSentTeamRequests,
			allStatusRequests: allTeamLeaveRequests,
			role,
			currentUserId: userId,
			scopeUserIds: filteredUserIds,
			includeSupervisorOwnPending: true,
			ownPendingRequests: ownPendingLeaveRequests,
		})
	}, [acceptedSentTeamRequests, allTeamLeaveRequests, filteredUsers, role, userId, ownPendingLeaveRequests])

	const singleFilteredUser = useMemo(() => {
		if (!Array.isArray(filteredUsers) || filteredUsers.length !== 1) return null
		return filteredUsers[0]
	}, [filteredUsers])

	const availabilityScopeHint = showAllTeam
		? (t('leaveplanner.availabilityChecker.scopeTeam') || 'Zakres: cały zespół')
		: (singleFilteredUser
			? `${t('leaveplanner.availabilityChecker.scopeUser') || 'Zakres'}: ${singleFilteredUser.firstName} ${singleFilteredUser.lastName}`
			: (t('leaveplanner.availabilityChecker.scopeCurrentFilter') || 'Zakres: aktualny filtr'))

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
		if (event.target.value === 'all-months') {
			setCalendarView('all-months')
			return
		}
		const newMonth = parseInt(event.target.value, 10)
		setCalendarView('single')
		setCurrentMonth(newMonth)
		goToSelectedDate(newMonth, currentYear)
	}

	const handleYearSelect = event => {
		const newYear = parseInt(event.target.value, 10)
		setCurrentYear(newYear)
		if (calendarView === 'single') goToSelectedDate(currentMonth, newYear)
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

	// Funkcje do obsługi filtrowania
	const handleToggleDepartment = (departmentName) => {
		setSelectedDepartments(prev => 
			prev.includes(departmentName)
				? prev.filter(d => d !== departmentName)
				: [...prev, departmentName]
		)
		// Gdy wybieramy dział, automatycznie wyłączamy "wszyscy z zespołu"
		if (!selectedDepartments.includes(departmentName)) {
			setShowAllTeam(false)
		}
	}

	const handleToggleUser = (userId) => {
		setSelectedUserIds(prev => {
			const isSelected = prev.includes(userId)
			const newIds = isSelected
				? prev.filter(id => id !== userId)
				: [...prev, userId]
			// Gdy wybieramy użytkownika, automatycznie wyłączamy "wszyscy z zespołu"
			if (!isSelected) {
				setShowAllTeam(false)
			}
			return newIds
		})
	}

	const handleShowAllTeam = () => {
		setShowAllTeam(true)
		setSelectedDepartments([])
		setSelectedUserIds([])
	}

	const handleResetFilters = () => {
		setShowAllTeam(true)
		setSelectedDepartments([])
		setSelectedUserIds([])
	}

	// Pobierz użytkowników z wybranych działów
	const usersFromSelectedDepartments = useMemo(() => {
		if (selectedDepartments.length === 0) return []
		return users.filter(user => {
			if (!user.department || !Array.isArray(user.department)) return false
			return user.department.some(dept => selectedDepartments.includes(dept))
		})
	}, [users, selectedDepartments])

	// Renderowanie widoku wszystkich miesięcy
	const renderAllMonths = () => {
		return Array.from({ length: 12 }, (_, month) => (
			<div key={`${currentYear}-${month}`} className="month-calendar allleaveplans all-leaveplans-all-months all-leaveplans__month-wrap" style={{ margin: '10px', border: '1px solid #ddd' }}>
				<FullCalendar
					plugins={[dayGridPlugin]}
					initialView="dayGridMonth"
					initialDate={new Date(currentYear, month)}
					locale={i18n.resolvedLanguage}
					height="auto"
					showNonCurrentDates={false}
					firstDay={1}
					key={`calendar-${currentYear}-${month}`}
					events={[
						// Plany urlopów
						...leavePlans.map(plan => {
							const employeeName = `${plan.firstName} ${plan.lastName}`
							const planDate = new Date(plan.date)
							if (planDate.getFullYear() === currentYear && planDate.getMonth() === month) {
								return {
									title: `${employeeName} (Plan)`,
									start: plan.date,
									allDay: true,
									backgroundColor: getColorForUser(employeeName),
									borderColor: getColorForUser(employeeName),
									extendedProps: { type: 'plan', userId: plan.userId }
								}
							}
							return null
						}).filter(Boolean),
						// Zaakceptowane wnioski urlopowe
						...acceptedLeaveRequests
							.filter(request => {
								// Sprawdź czy mamy wszystkie wymagane dane
								if (!request.startDate || !request.endDate) return false
								
								// Sprawdź userId - może być obiektem lub stringiem
								if (!request.userId) return false
								
								// Jeśli userId jest obiektem, sprawdź czy ma firstName i lastName
								if (typeof request.userId === 'object' && request.userId._id) {
									return request.userId.firstName && request.userId.lastName
								}
								
								// Jeśli userId jest stringiem, znajdź użytkownika w filteredUsers
								if (typeof request.userId === 'string') {
									const user = filteredUsers.find(u => u._id?.toString() === request.userId)
									return user && user.firstName && user.lastName
								}
								
								return false
							})
							.flatMap(request => {
								const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
								
								// Pobierz imię i nazwisko - z obiektu userId lub z filteredUsers
								let employeeName
								if (typeof request.userId === 'object' && request.userId.firstName && request.userId.lastName) {
									employeeName = `${request.userId.firstName} ${request.userId.lastName}`
								} else if (typeof request.userId === 'string') {
									const user = filteredUsers.find(u => u._id?.toString() === request.userId)
									employeeName = user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'
								} else {
									employeeName = 'Nieznany użytkownik'
								}
								
								return dates
									.filter(date => {
										const dateObj = new Date(date)
										return dateObj.getFullYear() === currentYear && dateObj.getMonth() === month
									})
									.map(date => ({
										title: `${employeeName} (${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)})${
											(request.status === 'status.pending' || request.status === 'pending')
												? (i18n.resolvedLanguage === 'pl' ? ' - oczekuje na akceptację' : ' - pending approval')
												: ''
										}`,
										start: date,
										allDay: true,
										backgroundColor: getColorForUser(employeeName),
										borderColor: getColorForUser(employeeName),
										extendedProps: { 
											type: 'request', 
											userId: typeof request.userId === 'object' ? request.userId._id : request.userId, 
											requestId: request._id 
										}
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
								extendedProps: {
									type: 'holiday',
									holidayName: holiday.name
								}
							}))
					]}
				/>
			</div>
		))
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
				<div className="leave-page-heading-with-action">
					<h3><img src="img/schedule.png" alt="ikonka w sidebar" /> {t('planslist.h3')}</h3>
					<button
						type="button"
						className="leave-request-date-assistant-button"
						onClick={() => setAvailabilityAssistantOpen(true)}
					>
						<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
							<path d="M8 2v3M16 2v3M4 9h16M7 13h4M7 17h7M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
						</svg>
						{t('leaveform.dateAssistantButton') || 'Asystent terminu'}
					</button>
				</div>
				<hr />
				{error && <p className="all-leaveplans__error" style={{ color: 'red' }}>{error.message || t('planslist.error')}</p>}
                <p className="all-leaveplans__employee-label">{t('planslist.emplo')}</p>
				<ul className="all-leaveplans__employee-list" style={{ listStyle: 'none', marginLeft: '20px', padding: 0 }}>
					{filteredUsers.map(user => (
						<li 
							key={user._id} 
							onClick={() => handleUserClick(user._id)} 
							className="clickable-user-item"
							style={{ marginBottom: '8px' }}
							title={t('planslist.clickToView')}
						>
							<span className="user-icon">→</span>
							<span className="user-text">
								{user.firstName} {user.lastName} - {user.position || t('newuser.noPosition')}
							</span>
							<span className="user-hint">{t('planslist.clickToView')}</span>
						</li>
					))}
				</ul>
				<div className="leave-availability-checker-mobile-only">
					<LeaveAvailabilityChecker
						requests={acceptedLeaveRequests}
						settings={settings}
						showUserName={true}
						scopeHint={availabilityScopeHint}
					/>
				</div>
				<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '20px', gap: '5px', alignItems: 'center' }}>
						<>
							<select value={calendarView === 'all-months' ? 'all-months' : currentMonth} onChange={handleMonthSelect} style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }} className="calendar-month-select focus:outline-none focus:ring-2 focus:ring-blue-500">
								<option value="all-months">{t('planslist.allMonths') || 'Wszystkie miesiące'}</option>
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
							{calendarView === 'single' && (
								<>
							<button
								type="button"
								className="all-leaveplans__nav-btn"
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
								className="all-leaveplans__nav-btn"
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
						</>
					<button
						type="button"
						onClick={() => setFilterModalOpen(true)}
						className='filter-button'
						style={{ 
							padding: '8px 12px', 
							border: '1px solid #00a846', 
							borderRadius: '6px', 
							backgroundColor: '#00a846', 
							cursor: 'pointer', 
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							transition: 'all 0.2s ease',
						}}
						onMouseOver={(e) => {
							const button = e.currentTarget
							button.style.backgroundColor = '#2980b9'
							button.style.borderColor = '#2980b9'
						}}
						onMouseOut={(e) => {
							const button = e.currentTarget
							button.style.backgroundColor = '#00a846'
							button.style.borderColor = '#00a846'
						}}
						title={t('planslist.filter') || 'Filtrowanie'}
					>
						<img src="/img/filter.png" alt="Filtrowanie" style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)', pointerEvents: 'none' }} />
					</button>
				</div>
				{calendarView === 'single' ? (
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
									.filter(request => {
										// Sprawdź czy mamy wszystkie wymagane dane
										if (!request.startDate || !request.endDate) return false
										
										// Sprawdź userId - może być obiektem lub stringiem
										if (!request.userId) return false
										
										// Jeśli userId jest obiektem, sprawdź czy ma firstName i lastName
										if (typeof request.userId === 'object' && request.userId._id) {
											return request.userId.firstName && request.userId.lastName
										}
										
										// Jeśli userId jest stringiem, znajdź użytkownika w filteredUsers
										if (typeof request.userId === 'string') {
											const user = filteredUsers.find(u => u._id?.toString() === request.userId)
											return user && user.firstName && user.lastName
										}
										
										return false
									})
									.flatMap(request => {
										const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
										
										// Pobierz imię i nazwisko - z obiektu userId lub z filteredUsers
										let employeeName
										if (typeof request.userId === 'object' && request.userId.firstName && request.userId.lastName) {
											employeeName = `${request.userId.firstName} ${request.userId.lastName}`
										} else if (typeof request.userId === 'string') {
											const user = filteredUsers.find(u => u._id?.toString() === request.userId)
											employeeName = user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'
										} else {
											employeeName = 'Nieznany użytkownik'
										}
										
										return dates.map(date => ({
											title: `${employeeName} (${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)})${
												(request.status === 'status.pending' || request.status === 'pending')
													? (i18n.resolvedLanguage === 'pl' ? ' - oczekuje na akceptację' : ' - pending approval')
													: ''
											}`,
											start: date,
											allDay: true,
											backgroundColor: getColorForUser(employeeName),
											borderColor: getColorForUser(employeeName),
											extendedProps: { 
												type: 'request', 
												userId: typeof request.userId === 'object' ? request.userId._id : request.userId, 
												requestId: request._id 
											}
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
				) : (
					<div className="all-months-calendar-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
						{renderAllMonths()}
					</div>
				)}
				
				<Modal
					isOpen={availabilityAssistantOpen}
					onRequestClose={() => setAvailabilityAssistantOpen(false)}
					overlayClassName="leave-insights-modal-overlay"
					className="leave-date-assistant-modal"
					contentLabel={t('leaveplanner.availabilityChecker.title')}
				>
					<div className="leave-insights-modal__header">
						<div>
							<h2>{t('leaveplanner.availabilityChecker.title')}</h2>
							<p>{t('leaveplanner.availabilityChecker.description')}</p>
						</div>
						<button
							type="button"
							onClick={() => setAvailabilityAssistantOpen(false)}
							aria-label={t('leaveform.closeDateAssistant') || 'Zamknij asystenta terminu'}
						>
							×
						</button>
					</div>
					<LeaveAvailabilityChecker
						requests={acceptedLeaveRequests}
						settings={settings}
						showUserName={true}
						scopeHint={availabilityScopeHint}
						initialCollapsed={false}
						variant="modal"
					/>
				</Modal>

				{/* Modal filtrowania */}
				<Modal
					isOpen={filterModalOpen}
					onRequestClose={() => setFilterModalOpen(false)}
					overlayClassName="all-leaveplans-filter-modal-overlay"
					className="all-leaveplans-filter-modal"
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
							maxWidth: '600px',
							maxHeight: '80vh',
							width: '90%',
							borderRadius: '12px',
							padding: '30px',
							backgroundColor: 'white',
							overflow: 'auto',
						},
					}}
					contentLabel={t('planslist.filter') || 'Filtrowanie'}>
					<div className="all-leaveplans-filter-modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
						<h2 className="all-leaveplans-filter-modal__title" style={{ 
							margin: 0,
							color: '#2c3e50',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('planslist.filter') || 'Filtrowanie'}
						</h2>
						<button
							type="button"
							className="all-leaveplans-filter-modal__close"
							onClick={() => setFilterModalOpen(false)}
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
					<div className="all-leaveplans-filter-modal__section" style={{ marginBottom: '30px' }}>
						<h3 className="all-leaveplans-filter-modal__section-title" style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
							{t('planslist.calendarView') || 'Widok kalendarza'}
						</h3>
						<div style={{ display: 'flex', gap: '15px' }}>
							<label className="all-leaveplans-filter-modal__radio-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
							<label className="all-leaveplans-filter-modal__radio-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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

					{/* Filtrowanie użytkowników */}
					<div className="all-leaveplans-filter-modal__section" style={{ marginBottom: '20px' }}>
						<h3 className="all-leaveplans-filter-modal__section-title" style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
							{t('planslist.filterUsers') || 'Filtrowanie użytkowników'}
						</h3>
						
						<label className={`all-leaveplans-filter-modal__team-option ${showAllTeam ? 'is-active' : ''}`} style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', padding: '10px', borderRadius: '6px', backgroundColor: showAllTeam ? '#ecfdf5' : 'transparent', border: '1px solid', borderColor: showAllTeam ? '#00a846' : '#e9ecef' }}>
							<input
								type="radio"
								name="userFilter"
								checked={showAllTeam}
								onChange={handleShowAllTeam}
								style={{ marginRight: '10px', cursor: 'pointer' }}
							/>
							<span style={{ fontWeight: showAllTeam ? '600' : '400' }}>
								{t('planslist.allTeamMembers') || 'Wszyscy z zespołu'}
							</span>
						</label>

						{/* Filtrowanie po działach */}
						<div style={{ marginTop: '20px' }}>
							<h4 className="all-leaveplans-filter-modal__subsection-title" style={{ marginBottom: '10px', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
								{t('planslist.filterByDepartments') || 'Filtrowanie po działach'}
							</h4>
							{departments.length > 0 ? (
								<div className="all-leaveplans-filter-modal__scroll-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
									{departments.map(dept => {
										// Obsługa zarówno stringów jak i obiektów (dla kompatybilności)
										const deptName = typeof dept === 'object' ? dept.name : dept
										const deptKey = typeof dept === 'object' ? (dept._id || dept.name) : dept
										
										return (
											<div key={deptKey} style={{ marginBottom: '10px' }}>
												<label className="all-leaveplans-filter-modal__check-label" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
													<input
														type="checkbox"
														checked={selectedDepartments.includes(deptName)}
														onChange={() => handleToggleDepartment(deptName)}
														style={{ marginRight: '8px', cursor: 'pointer' }}
													/>
													<span style={{ fontWeight: selectedDepartments.includes(deptName) ? '600' : '400' }}>
														{deptName}
													</span>
													{selectedDepartments.includes(deptName) && (
														<button
															type="button"
															className="all-leaveplans-filter-modal__expand-btn"
															onClick={(e) => {
																e.stopPropagation()
																setExpandedDepartments(prev => ({
																	...prev,
																	[deptName]: !prev[deptName]
																}))
															}}
															style={{
																marginLeft: '10px',
																padding: '2px 8px',
																fontSize: '12px',
																border: '1px solid #bdc3c7',
																borderRadius: '4px',
																backgroundColor: 'white',
																cursor: 'pointer'
															}}
														>
															{expandedDepartments[deptName] ? '▼' : '▶'} {t('planslist.selectUsers') || 'Wybierz użytkowników'}
														</button>
													)}
												</label>
												{expandedDepartments[deptName] && selectedDepartments.includes(deptName) && (
													<div className="all-leaveplans-filter-modal__nested-users" style={{ marginLeft: '25px', marginTop: '8px', paddingLeft: '15px', borderLeft: '2px solid #00a846' }}>
														{usersFromSelectedDepartments
															.filter(user => user.department && user.department.includes(deptName))
															.map(user => (
																<label key={user._id} className="all-leaveplans-filter-modal__check-label" style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }}>
																	<input
																		type="checkbox"
																		checked={selectedUserIds.includes(user._id)}
																		onChange={() => handleToggleUser(user._id)}
																		style={{ marginRight: '8px', cursor: 'pointer' }}
																	/>
																	<span style={{ fontSize: '14px' }}>
																		{user.firstName} {user.lastName} {user.position ? `- ${user.position}` : ''}
																	</span>
																</label>
															))}
													</div>
												)}
											</div>
										)
									})}
								</div>
							) : (
								<p className="all-leaveplans-filter-modal__empty" style={{ color: '#7f8c8d', fontSize: '14px' }}>
									{t('planslist.noDepartments') || 'Brak działów'}
								</p>
							)}
						</div>
					</div>

					{/* Filtrowanie po użytkownikach */}
					<div className="all-leaveplans-filter-modal__section" style={{ marginBottom: '10px' }}>
						<h4 className="all-leaveplans-filter-modal__subsection-title" style={{ marginBottom: '10px', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
							{t('planslist.filterByUsers') || 'Filtrowanie po użytkownikach'}
						</h4>
						<div className="all-leaveplans-filter-modal__scroll-list" style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
							{users.length > 0 ? (
								users.map(user => (
									<label key={user._id} className="all-leaveplans-filter-modal__check-label" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
										<input
											type="checkbox"
											checked={selectedUserIds.includes(user._id)}
											onChange={() => handleToggleUser(user._id)}
											style={{ marginRight: '8px', cursor: 'pointer' }}
										/>
										<span style={{ fontSize: '14px', fontWeight: selectedUserIds.includes(user._id) ? '600' : '400' }}>
											{user.firstName} {user.lastName} {user.position ? `- ${user.position}` : ''}
										</span>
									</label>
								))
							) : (
								<p className="all-leaveplans-filter-modal__empty" style={{ color: '#7f8c8d', fontSize: '14px' }}>
									{t('planslist.noUsers') || 'Brak użytkowników'}
								</p>
							)}
						</div>
					</div>

					{/* Przyciski akcji */}
					<div className="all-leaveplans-filter-modal__footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '10px' }}>
						<button
							type="button"
							className="all-leaveplans-filter-modal__btn-reset"
							onClick={handleResetFilters}
							style={{
								padding: '10px 20px',
								backgroundColor: '#95a5a6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								transition: 'background-color 0.2s'
							}}
							onMouseEnter={(e) => e.target.style.backgroundColor = '#7f8c8d'}
							onMouseLeave={(e) => e.target.style.backgroundColor = '#95a5a6'}>
							{t('planslist.resetFilters') || 'Resetuj filtry'}
						</button>
						<button
							type="button"
							className="all-leaveplans-filter-modal__btn-apply"
							onClick={() => setFilterModalOpen(false)}
							style={{
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								fontSize: '14px',
								fontWeight: '500',
								transition: 'background-color 0.2s'
							}}
							onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
							onMouseLeave={(e) => e.target.style.backgroundColor = '#00a846'}>
							{t('planslist.apply') || t('boards.cancel') || 'Zastosuj'}
						</button>
					</div>
				</Modal>
			</div>
			)}
		</>
	)
}

export default AdminAllLeaveCalendar
