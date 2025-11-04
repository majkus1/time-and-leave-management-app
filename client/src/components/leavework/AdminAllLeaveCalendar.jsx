import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'

function AdminAllLeaveCalendar() {
	const [leavePlans, setLeavePlans] = useState([])
	const [acceptedLeaveRequests, setAcceptedLeaveRequests] = useState([])
	const colorsRef = useRef({})
	const usedColors = useRef(new Set())
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	const [users, setUsers] = useState([])
	const [selectedUser, setSelectedUser] = useState(null)
	const [error, setError] = useState('')
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, logout, username, teamId } = useAuth()
	const [loading, setLoading] = useState(true)
	const isSuperAdmin = username === 'michalipka1@gmail.com'

	// Sprawdź czy teamId jest dostępny (tylko dla zwykłych użytkowników)
	useEffect(() => {
		if (!isSuperAdmin && !teamId) {
			setLoading(false)
			setError('Team ID is not available')
		}
	}, [teamId, isSuperAdmin])

	useEffect(() => {
		if (isSuperAdmin || teamId) {
			fetchUsers()
		}
	}, [teamId, isSuperAdmin])

	useEffect(() => {
		if (users.length > 0 && (isSuperAdmin || teamId)) {
			fetchAllLeavePlans()
			fetchAcceptedLeaveRequests()
		}
	}, [users, teamId, isSuperAdmin])

	const fetchUsers = async () => {
		try {
			setLoading(true)
			setError('') 
			
			const response = await axios.get(`${API_URL}/api/users/all-users`, {
				withCredentials: true
			})
			
			setUsers(response.data)
		} catch (error) {
			console.error('Error fetching users:', error)
			console.error('Error response:', error.response?.data)
			setError(t('list.error'))
		} finally {
			setLoading(false)
		}
	}

	const fetchAllLeavePlans = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/planlea/admin/all-leave-plans`, {
				withCredentials: true
			})
			
			// Jeśli super admin - pokaż wszystkie plany, jeśli nie - filtruj tylko dla użytkowników z zespołu
			let filteredPlans
			if (isSuperAdmin) {
				filteredPlans = response.data
			} else {
				filteredPlans = response.data.filter(plan => {
					const hasUser = users.some(user => user._id === plan.userId)
					return hasUser
				})
			}
			
			setLeavePlans(filteredPlans)
		} catch (error) {
			console.error('Failed to fetch leave plans:', error)
			setError(t('list.error'))
		}
	}

	const fetchAcceptedLeaveRequests = async () => {
		try {
			const response = await axios.get(`${API_URL}/api/leaveworks/accepted-leave-requests`, {
				withCredentials: true
			})
			
			// Jeśli super admin - pokaż wszystkie wnioski, jeśli nie - filtruj tylko dla użytkowników z zespołu
			let filteredRequests
			if (isSuperAdmin) {
				filteredRequests = response.data.filter(request => {
					if (!request.userId || !request.userId._id) {
						return false
					}
					return true
				})
			} else {
				// Filtruj tylko wnioski użytkowników z tego samego teamu i sprawdź czy userId istnieje
				filteredRequests = response.data.filter(request => {
					if (!request.userId || !request.userId._id) {
						return false
					}
					const hasUser = users.some(user => user._id === request.userId._id)
					return hasUser
				})
			}
			
			setAcceptedLeaveRequests(filteredRequests)
		} catch (error) {
			console.error('Failed to fetch accepted leave requests:', error)
			setError(t('list.error'))
		}
	}

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
			<div id='all-leaveplans' style={{ padding: "20px" }}>
				<h3><img src="img/schedule.png" alt="ikonka w sidebar" /> {t('planslist.h3')}</h3>
				<hr />
				{error && <p style={{ color: 'red' }}>{error}</p>}
                <p>{t('planslist.emplo')}</p>
				<ul style={{ listStyle: 'inherit', marginLeft: '20px' }}>
					{users.map(user => (
						<li key={user._id} onClick={() => handleUserClick(user._id)} style={{ cursor: "pointer", marginBottom: '5px' }}>
							{user.firstName} {user.lastName} - {user.position || 'Brak stanowiska'}
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
