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
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../../config.js'
import Modal from 'react-modal'
import { useDepartments } from '../../hooks/useDepartments'

if (typeof window !== 'undefined') {
	Modal.setAppElement('#root')
}

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
	const { data: departments = [] } = useDepartments(teamId)

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

	const acceptedLeaveRequests = useMemo(() => {
		const filteredUserIds = new Set(filteredUsers.map(u => u._id))
		return allAcceptedRequests.filter(request => {
			if (!request.userId || !request.userId._id) {
				return false
			}
			return filteredUserIds.has(request.userId._id)
		})
	}, [allAcceptedRequests, filteredUsers])

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
			<div key={`${currentYear}-${month}`} className="month-calendar allleaveplans all-leaveplans-all-months" style={{ margin: '10px', border: '1px solid #ddd' }}>
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
							.filter(request => request.userId && request.userId.firstName && request.userId.lastName && request.startDate && request.endDate)
							.flatMap(request => {
								const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
								const employeeName = `${request.userId.firstName} ${request.userId.lastName}`
								return dates
									.filter(date => {
										const dateObj = new Date(date)
										return dateObj.getFullYear() === currentYear && dateObj.getMonth() === month
									})
									.map(date => ({
										title: `${employeeName} (${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)})`,
										start: date,
										allDay: true,
										backgroundColor: getColorForUser(employeeName),
										borderColor: getColorForUser(employeeName),
										extendedProps: { type: 'request', userId: request.userId._id, requestId: request._id }
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
				<h3><img src="img/schedule.png" alt="ikonka w sidebar" /> {t('planslist.h3')}</h3>
				<hr />
				{error && <p style={{ color: 'red' }}>{error.message || t('planslist.error')}</p>}
                <p>{t('planslist.emplo')}</p>
				<ul style={{ listStyle: 'none', marginLeft: '20px', padding: 0 }}>
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
				<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '40px', gap: '5px', alignItems: 'center' }}>
					{calendarView === 'single' && (
						<>
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
						</>
					)}
					{calendarView === 'all-months' && (
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
					)}
					<button
						type="button"
						onClick={() => setFilterModalOpen(true)}
						className='filter-button'
						style={{ 
							padding: '8px 12px', 
							border: '1px solid #3498db', 
							borderRadius: '6px', 
							backgroundColor: '#3498db', 
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
							button.style.backgroundColor = '#3498db'
							button.style.borderColor = '#3498db'
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
									.filter(request => request.userId && request.userId.firstName && request.userId.lastName && request.startDate && request.endDate) // Sprawdź czy mamy pełną nazwę i daty
									.flatMap(request => {
										const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
										const employeeName = `${request.userId.firstName} ${request.userId.lastName}`
										return dates.map(date => ({
											title: `${employeeName} (${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)})`,
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
				) : (
					<div className="all-months-calendar-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
						{renderAllMonths()}
					</div>
				)}
				
				{/* Modal filtrowania */}
				<Modal
					isOpen={filterModalOpen}
					onRequestClose={() => setFilterModalOpen(false)}
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
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
						<h2 style={{ 
							margin: 0,
							color: '#2c3e50',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{t('planslist.filter') || 'Filtrowanie'}
						</h2>
						<button
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

					{/* Filtrowanie użytkowników */}
					<div style={{ marginBottom: '30px' }}>
						<h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
							{t('planslist.filterUsers') || 'Filtrowanie użytkowników'}
						</h3>
						
						{/* Opcja: Wszyscy z zespołu */}
						<label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', padding: '10px', borderRadius: '6px', backgroundColor: showAllTeam ? '#e8f4f8' : 'transparent', border: '1px solid', borderColor: showAllTeam ? '#3498db' : '#e9ecef' }}>
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
							<h4 style={{ marginBottom: '10px', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
								{t('planslist.filterByDepartments') || 'Filtrowanie po działach'}
							</h4>
							{departments.length > 0 ? (
								<div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
									{departments.map(dept => {
										// Obsługa zarówno stringów jak i obiektów (dla kompatybilności)
										const deptName = typeof dept === 'object' ? dept.name : dept
										const deptKey = typeof dept === 'object' ? (dept._id || dept.name) : dept
										
										return (
											<div key={deptKey} style={{ marginBottom: '10px' }}>
												<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
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
													<div style={{ marginLeft: '25px', marginTop: '8px', paddingLeft: '15px', borderLeft: '2px solid #3498db' }}>
														{usersFromSelectedDepartments
															.filter(user => user.department && user.department.includes(deptName))
															.map(user => (
																<label key={user._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px', cursor: 'pointer' }}>
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
								<p style={{ color: '#7f8c8d', fontSize: '14px' }}>
									{t('planslist.noDepartments') || 'Brak działów'}
								</p>
							)}
						</div>
					</div>

					{/* Przyciski akcji */}
					<div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '10px' }}>
						<button
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
							onClick={() => setFilterModalOpen(false)}
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
