import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useUsers } from '../../hooks/useUsers'
import { useAllTeamWorkdays } from '../../hooks/useWorkdays'
import { useAllAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import Modal from 'react-modal'
import { useDepartments } from '../../hooks/useDepartments'
import { useAuth } from '../../context/AuthContext'

if (typeof window !== 'undefined') {
	Modal.setAppElement('#root')
}

function AdminUserList() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, teamId } = useAuth()
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	
	// Filtrowanie
	const [filterModalOpen, setFilterModalOpen] = useState(false)
	const [showAllTeam, setShowAllTeam] = useState(true)
	const [selectedDepartments, setSelectedDepartments] = useState([])
	const [selectedUserIds, setSelectedUserIds] = useState([])
	const [expandedDepartments, setExpandedDepartments] = useState({})
	
	// Sprawdź czy użytkownik ma uprawnienia (Admin lub HR)
	const isAdmin = role && role.includes('Admin')
	const isHR = role && role.includes('HR')
	const canFilter = isAdmin || isHR

	// TanStack Query hooks
	const { data: users = [], isLoading: loadingUsers, error: usersError } = useUsers()
	const { data: allTeamWorkdays = [], isLoading: loadingWorkdays, error: workdaysError } = useAllTeamWorkdays()
	const { data: allAcceptedRequests = [], isLoading: loadingRequests, error: requestsError } = useAllAcceptedLeaveRequests()
	const { data: settings } = useSettings()
	const { data: departments = [] } = useDepartments(teamId)

	const loading = loadingUsers || loadingWorkdays || loadingRequests
	const error = usersError || workdaysError || requestsError

	// Funkcja pomocnicza do formatowania godzin
	const formatHours = (hours) => {
		if (hours === null || hours === undefined) return ''
		const numHours = typeof hours === 'number' ? hours : parseFloat(hours)
		if (isNaN(numHours)) return ''
		if (numHours % 1 === 0) return numHours.toString()
		return numHours.toFixed(1).replace(/\.0$/, '')
	}

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

	// Filtruj workdays na podstawie wybranych użytkowników
	const filteredWorkdays = useMemo(() => {
		const filteredUserIds = new Set(filteredUsers.map(u => u._id))
		return allTeamWorkdays.filter(workday => {
			return workday.userId && (typeof workday.userId === 'object' ? filteredUserIds.has(workday.userId._id?.toString()) : filteredUserIds.has(workday.userId.toString()))
		})
	}, [allTeamWorkdays, filteredUsers])

	// Formatuj wpisy ewidencji - grupowanie po dacie i użytkowniku
	const formattedWorkdayEvents = useMemo(() => {
		if (!filteredWorkdays || filteredWorkdays.length === 0) return []

		// Grupuj workdays po dacie i użytkowniku
		const workdaysByDateAndUser = {}
		
		filteredWorkdays.forEach(workday => {
			if (!workday.userId || !workday.userId.firstName) return
			
			const dateKey = new Date(workday.date).toISOString().split('T')[0]
			const userKey = workday.userId._id.toString()
			const key = `${dateKey}-${userKey}`
			
			if (!workdaysByDateAndUser[key]) {
				workdaysByDateAndUser[key] = {
					date: dateKey,
					userId: userKey,
					userName: `${workday.userId.firstName} ${workday.userId.lastName}`,
					allParts: []
				}
			}
			
			// Zbierz wszystkie części wpisu dla tego workday - dodaj bezpośrednio do allParts
			if (workday.hoursWorked && workday.hoursWorked > 0) {
				workdaysByDateAndUser[key].allParts.push(`${formatHours(workday.hoursWorked)}h`)
			}
			
			if (workday.additionalWorked && workday.additionalWorked > 0) {
				workdaysByDateAndUser[key].allParts.push(`+${formatHours(workday.additionalWorked)}h`)
			}
			
			if (workday.realTimeDayWorked) {
				workdaysByDateAndUser[key].allParts.push(workday.realTimeDayWorked)
			}
			
			if (workday.absenceType) {
				workdaysByDateAndUser[key].allParts.push(workday.absenceType)
			}
			
			if (workday.notes) {
				workdaysByDateAndUser[key].allParts.push(workday.notes)
			}
		})

		// Utwórz eventy z połączonych części - wszystkie części oddzielone "|"
		return Object.values(workdaysByDateAndUser).map(item => {
			// Połącz wszystkie części znakiem "|" (zachowaj wszystkie, nawet duplikaty)
			const fullTitle = `${item.userName}: ${item.allParts.join(' | ')}`
			
			// Określ kolor na podstawie zawartości
			const hasHours = item.allParts.some(p => p.includes('h'))
			const hasAbsence = item.allParts.some(p => !p.includes('h') && !p.includes(':') && !p.match(/^\d{2}:\d{2}-\d{2}:\d{2}$/))
			
			let backgroundColor = 'blue'
			let classNames = 'event-workday'
			
			if (hasAbsence && !hasHours) {
				backgroundColor = 'green'
				classNames = 'event-absence'
			} else if (!hasHours && !hasAbsence) {
				backgroundColor = '#8B0000'
				classNames = 'event-notes'
			}
			
			return {
				title: fullTitle,
				start: item.date,
				allDay: true,
				backgroundColor,
				textColor: 'white',
				classNames,
				extendedProps: {
					userId: item.userId,
					type: 'workday'
				}
			}
		})
	}, [filteredWorkdays])

	// Filtruj zaakceptowane wnioski urlopowe dla aktualnego miesiąca (tylko wybrani użytkownicy)
	const acceptedLeaveRequestsForMonth = useMemo(() => {
		const filteredUserIds = new Set(filteredUsers.map(u => u._id))
		return allAcceptedRequests
			.filter(request => {
				if (!request.userId || !request.userId.firstName || !request.userId.lastName || !request.startDate || !request.endDate) return false
				const userId = typeof request.userId === 'object' ? request.userId._id : request.userId
				return filteredUserIds.has(userId?.toString())
			})
			.flatMap(request => {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				const employeeName = `${request.userId.firstName} ${request.userId.lastName}`
				return dates
					.filter(date => {
						const dateObj = new Date(date)
						return dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear
					})
					.map(date => ({
						title: `${employeeName}: ${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}`,
						start: date,
						allDay: true,
						backgroundColor: 'green',
						borderColor: 'darkgreen',
						textColor: 'white',
						classNames: 'event-absence',
						extendedProps: {
							type: 'request',
							userId: request.userId._id,
							requestId: request._id
						}
					}))
			})
	}, [allAcceptedRequests, filteredUsers, currentMonth, currentYear, settings, t, i18n.resolvedLanguage])

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
		navigate(`/work-calendars/${userId}`)
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
					<h3><img src="img/schedule time works.png" alt="ikonka w sidebar" /> {t('evidencework.h3')}</h3>
					<hr />
					{error && <p style={{ color: 'red' }}>{t('list.error')}</p>}
					<p>{t('planslist.emplo')}</p>
					<ul style={{ listStyle: 'none', marginLeft: '20px', padding: 0 }}>
						{users.map(user => (
							<li 
								key={user._id} 
								onClick={() => handleUserClick(user._id)} 
								className="clickable-user-item"
								style={{ marginBottom: '8px' }}
								title={t('evidencework.clickToView')}
							>
								<span className="user-icon">→</span>
								<span className="user-text">
									{user.firstName} {user.lastName} – {user.position || t('newuser.noPosition')}
								</span>
								<span className="user-hint">{t('evidencework.clickToView')}</span>
							</li>
						))}
					</ul>

					{/* Kalendarz z ewidencjami */}
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
								// Ewidencje wszystkich pracowników
								...formattedWorkdayEvents,
								// Zaakceptowane wnioski urlopowe
								...acceptedLeaveRequestsForMonth,
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
					)}
				</div>
			)}
		</>
	)
}

export default AdminUserList
