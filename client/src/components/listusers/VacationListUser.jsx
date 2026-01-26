import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useUsers } from '../../hooks/useUsers'
import { useAllAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import Modal from 'react-modal'
import { useDepartments } from '../../hooks/useDepartments'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { useSupervisorConfig } from '../../hooks/useSupervisor'

function VacationListUser() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, teamId, userId } = useAuth()
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const colorsRef = useRef({})
	
	// Filtrowanie
	const [filterModalOpen, setFilterModalOpen] = useState(false)
	const [showAllTeam, setShowAllTeam] = useState(true)
	const [selectedDepartments, setSelectedDepartments] = useState([])
	const [selectedUserIds, setSelectedUserIds] = useState([])
	const [expandedDepartments, setExpandedDepartments] = useState({})
	
	// Sprawdź uprawnienia - Admin i HR mogą filtrować
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const isSupervisorRole = isSupervisor(role)
	const canFilter = isAdminRole || isHRRole
	
	// Sprawdź konfigurację przełożonego
	const { data: supervisorConfig } = useSupervisorConfig(userId, isSupervisorRole && !isAdminRole && !isHRRole)
	const canApproveLeaves = isAdminRole || isHRRole 
		? true 
		: (isSupervisorRole && (supervisorConfig?.permissions?.canApproveLeaves !== false))
	const canViewTimesheets = isAdminRole || isHRRole 
		? true 
		: (isSupervisorRole && (supervisorConfig?.permissions?.canViewTimesheets !== false))

	// TanStack Query hooks
	const { data: users = [], isLoading: loadingUsers, error: usersError } = useUsers()
	const { data: allAcceptedRequests = [], isLoading: loadingRequests, error: requestsError } = useAllAcceptedLeaveRequests()
	const { data: settings } = useSettings()
	const { data: departments = [] } = useDepartments(teamId)

	const loading = loadingUsers || loadingRequests
	const error = usersError || requestsError

	// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
	const isWeekend = (date) => {
		const day = new Date(date).getDay()
		return day === 0 || day === 6
	}

	// Funkcja pomocnicza do generowania dat w zakresie (z pominięciem weekendów i świąt)
	const generateDateRangeForCalendar = (startDate, endDate) => {
		const dates = []
		const start = new Date(startDate)
		const end = new Date(endDate)
		const current = new Date(start)
		const workOnWeekends = settings?.workOnWeekends !== false
		
		while (current <= end) {
			const currentDateStr = new Date(current).toISOString().split('T')[0]
			const isWeekendDay = isWeekend(current)
			const holidayInfo = isHolidayDate(current, settings)
			const isHolidayDay = holidayInfo !== null
			
			if (workOnWeekends) {
				if (!isHolidayDay) {
					dates.push(currentDateStr)
				}
			} else {
				if (!isWeekendDay && !isHolidayDay) {
					dates.push(currentDateStr)
				}
			}
			current.setDate(current.getDate() + 1)
		}
		
		return dates
	}

	// Pobierz święta dla aktualnego miesiąca
	const holidaysForMonth = useMemo(() => {
		if (!settings) return []
		const monthStart = new Date(currentYear, currentMonth, 1)
		const monthEnd = new Date(currentYear, currentMonth + 1, 0)
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

	// Filtrowanie użytkowników na podstawie wybranych opcji i uprawnień
	// Admin/HR widzą wszystkich z zespołu, przełożony widzi swoich pracowników (filtrowanie po stronie serwera)
	const filteredUsers = useMemo(() => {
		let availableUsers = users
		
		// Admin i HR widzą wszystkich z zespołu
		// Przełożony widzi swoich pracowników - filtrowanie jest po stronie serwera w getAllAcceptedLeaveRequests
		// Tutaj tylko filtrujemy na podstawie wybranych opcji (działy, konkretni użytkownicy)
		
		if (showAllTeam) {
			return availableUsers
		}
		
		if (selectedUserIds.length > 0) {
			return availableUsers.filter(user => selectedUserIds.includes(user._id))
		}
		
		if (selectedDepartments.length > 0) {
			return availableUsers.filter(user => {
				if (!user.department || !Array.isArray(user.department)) return false
				return user.department.some(dept => selectedDepartments.includes(dept))
			})
		}
		
		return availableUsers
	}, [users, showAllTeam, selectedDepartments, selectedUserIds])

	// Generate stable color based on user name (deterministic) - same as in AdminAllLeaveCalendar
	const getColorForUser = useCallback((userIdentifier) => {
		if (!userIdentifier) return '#3498db'
		
		// Use username or full name as identifier for consistency
		const key = userIdentifier
		
		if (!colorsRef.current[key]) {
			// Generate stable color from string hash - same algorithm as in AdminAllLeaveCalendar
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

	// Funkcja do mapowania statusu na czytelny tekst i kolor
	const getStatusInfo = (status) => {
		const statusMap = {
			'status.pending': { 
				text: t('leaveRequest.status.pending') || 'Oczekuje', 
				color: '#f39c12', // Pomarańczowy
				bgColor: '#fff3cd',
				borderColor: '#ffc107'
			},
			'status.accepted': { 
				text: t('leaveRequest.status.accepted') || 'Zaakceptowany', 
				color: '#27ae60', // Zielony
				bgColor: '#d4edda',
				borderColor: '#28a745'
			},
			'status.rejected': { 
				text: t('leaveRequest.status.rejected') || 'Odrzucony', 
				color: '#e74c3c', // Czerwony
				bgColor: '#f8d7da',
				borderColor: '#dc3545'
			},
			'status.sent': { 
				text: t('leaveRequest.status.sent') || 'Wysłany (L4)', 
				color: '#3498db', // Niebieski
				bgColor: '#d1ecf1',
				borderColor: '#17a2b8'
			},
			'status.cancelled': { 
				text: t('leaveRequest.status.cancelled') || 'Anulowany', 
				color: '#95a5a6', // Szary
				bgColor: '#e2e3e5',
				borderColor: '#6c757d'
			}
		}
		return statusMap[status] || { 
			text: status || 'Nieznany', 
			color: '#95a5a6',
			bgColor: '#e2e3e5',
			borderColor: '#6c757d'
		}
	}

	// Formatuj zaakceptowane wnioski urlopowe dla kalendarza (tylko status.accepted i status.sent)
	const allLeaveRequestsForMonth = useMemo(() => {
		if (!allAcceptedRequests || allAcceptedRequests.length === 0) {
			return []
		}
		
		const filteredUserIds = new Set(filteredUsers.map(u => {
			if (!u || !u._id) return null
			return u._id.toString()
		}).filter(Boolean))
		
		return allAcceptedRequests
			.filter(request => {
				// Sprawdź czy request ma wszystkie wymagane dane
				if (!request || !request.startDate || !request.endDate) return false
				
				// Sprawdź userId - może być obiektem lub stringiem
				if (!request.userId) return false
				
				// Pobierz userId jako string
				let userIdStr
				if (typeof request.userId === 'object' && request.userId !== null) {
					if (request.userId._id) {
						userIdStr = request.userId._id.toString()
					} else if (request.userId.toString) {
						userIdStr = request.userId.toString()
					} else {
						return false
					}
				} else if (typeof request.userId === 'string') {
					userIdStr = request.userId
				} else {
					return false
				}
				
				// Sprawdź czy użytkownik jest w filtrowanych użytkownikach
				return filteredUserIds.has(userIdStr)
			})
			.flatMap(request => {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				
				// Pobierz imię i nazwisko - z obiektu userId lub z filteredUsers
				let employeeName
				if (typeof request.userId === 'object' && request.userId !== null && request.userId.firstName && request.userId.lastName) {
					employeeName = `${request.userId.firstName} ${request.userId.lastName}`
				} else if (typeof request.userId === 'string') {
					const user = filteredUsers.find(u => u._id?.toString() === request.userId)
					employeeName = user ? `${user.firstName} ${user.lastName}` : 'Nieznany użytkownik'
				} else {
					employeeName = 'Nieznany użytkownik'
				}
				
				const leaveTypeName = getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)
				
				// Użyj koloru przypisanego do pracownika (tak jak w /all-leave-plans)
				const userColor = getColorForUser(employeeName)
				
				return dates
					.filter(date => {
						const dateObj = new Date(date)
						return dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear
					})
					.map(date => ({
						title: `${employeeName} (${leaveTypeName})`,
						start: date,
						allDay: true,
						backgroundColor: userColor,
						borderColor: userColor,
						textColor: '#ffffff',
						classNames: 'event-leave-request',
						extendedProps: {
							type: 'leaveRequest',
							userId: typeof request.userId === 'object' ? request.userId._id : request.userId,
							requestId: request._id,
							status: request.status,
							leaveType: request.type,
							employeeName,
							leaveTypeName
						}
					}))
			})
	}, [allAcceptedRequests, filteredUsers, currentMonth, currentYear, settings, t, i18n.resolvedLanguage, getColorForUser])

	// Funkcje do obsługi filtrowania
	const handleToggleDepartment = (departmentName) => {
		setSelectedDepartments(prev => 
			prev.includes(departmentName)
				? prev.filter(d => d !== departmentName)
				: [...prev, departmentName]
		)
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

	// Odśwież kalendarz gdy sidebar się zmienia
	useEffect(() => {
		const updateCalendarSize = () => {
			if (calendarRef.current) {
				const calendarApi = calendarRef.current.getApi()
				setTimeout(() => {
					calendarApi.updateSize()
				}, 350)
			}
		}

		const observer = new MutationObserver(() => {
			updateCalendarSize()
		})

		if (document.body) {
			observer.observe(document.body, {
				attributes: true,
				attributeFilter: ['class']
			})
		}

		const handleResize = () => {
			updateCalendarSize()
		}
		window.addEventListener('resize', handleResize)

		updateCalendarSize()

		return () => {
			observer.disconnect()
			window.removeEventListener('resize', handleResize)
		}
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
		navigate(`/leave-requests/${userId}`)
	}

	return (
		<>
			<Sidebar />
			{loading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
				<div id="list-employee">
					<h3><img src="img/trip.png" alt="ikonka w sidebar" /> {t('vacationlisteq.h3')}</h3>
					<hr />
					{error && <p style={{ color: 'red' }}>{t('list.error')}</p>}
					<h3 style={{ marginTop: '35px' }}>{t('vacationlisteq.request')}</h3>
					<p>{t('planslist.emplo')}</p>
					<ul style={{ listStyle: 'none', marginLeft: '20px', padding: 0 }}>
						{filteredUsers.map(user => (
							<li 
								key={user._id} 
								onClick={() => handleUserClick(user._id)} 
								className="clickable-user-item"
								style={{ marginBottom: '8px' }}
								title={t('vacationlisteq.clickToView')}
							>
								<span className="user-icon">→</span>
								<span className="user-text">
									{user.firstName} {user.lastName} - {user.position || t('newuser.noPosition')}
								</span>
								<span className="user-hint">{t('vacationlisteq.clickToView')}</span>
							</li>
						))}
					</ul>

					{/* Kalendarz z wnioskami urlopowymi */}
					<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '40px', gap: '5px', alignItems: 'center' }}>
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
						{canFilter && (
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
						)}
					</div>

					<div>
						<FullCalendar
							plugins={[dayGridPlugin]}
							initialView="dayGridMonth"
							initialDate={new Date()}
							locale={i18n.resolvedLanguage}
							height="auto"
							firstDay={1}
							showNonCurrentDates={false}
							events={[
								// Wszystkie wnioski urlopowe (wszystkie statusy)
								...allLeaveRequestsForMonth,
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

					{/* Modal filtrowania - tylko dla Admin i HR */}
					{canFilter && (
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
									width: '90%',
									maxWidth: '600px',
									maxHeight: '80vh',
									overflow: 'auto',
									borderRadius: '12px',
									padding: '24px',
									backgroundColor: 'white',
									boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
								},
							}}
							contentLabel={t('planslist.filter') || 'Filtrowanie'}
						>
							<h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
								{t('planslist.filter') || 'Filtrowanie'}
							</h2>
							
							<div style={{ marginBottom: '20px' }}>
								<label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
									<input
										type="checkbox"
										checked={showAllTeam}
										onChange={handleShowAllTeam}
										style={{ marginRight: '8px', width: '18px', height: '18px' }}
									/>
									<span style={{ fontSize: '16px' }}>{t('planslist.showAllTeam') || 'Pokaż wszystkich z zespołu'}</span>
								</label>
							</div>

							{departments.length > 0 && (
								<div style={{ marginBottom: '20px' }}>
									<h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
										{t('planslist.departments') || 'Działy'}
									</h3>
									{departments.map(dept => (
										<label key={dept} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
											<input
												type="checkbox"
												checked={selectedDepartments.includes(dept)}
												onChange={() => handleToggleDepartment(dept)}
												style={{ marginRight: '8px', width: '18px', height: '18px' }}
											/>
											<span style={{ fontSize: '16px' }}>{dept}</span>
										</label>
									))}
								</div>
							)}

							<div style={{ marginBottom: '20px' }}>
								<h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600' }}>
									{t('planslist.employees') || 'Pracownicy'}
								</h3>
								<div style={{ maxHeight: '300px', overflowY: 'auto' }}>
									{users.map(user => (
										<label key={user._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
											<input
												type="checkbox"
												checked={selectedUserIds.includes(user._id)}
												onChange={() => handleToggleUser(user._id)}
												style={{ marginRight: '8px', width: '18px', height: '18px' }}
											/>
											<span style={{ fontSize: '16px' }}>
												{user.firstName} {user.lastName} {user.position ? `- ${user.position}` : ''}
											</span>
										</label>
									))}
								</div>
							</div>

							<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
					)}
				</div>
			)}
		</>
	)
}

export default VacationListUser
