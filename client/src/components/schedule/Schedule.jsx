import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from 'react-modal'
import { useSchedule, useScheduleEntries, useUpsertScheduleEntry, useDeleteScheduleEntry } from '../../hooks/useSchedule'
import { useUsers } from '../../hooks/useUsers'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import { useAllAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'

function Schedule() {
	const { scheduleId } = useParams()
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { userId, role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const { data: schedule, isLoading: loadingSchedule } = useSchedule(scheduleId)
	
	// Dla grafiku zawsze pobieramy wszystkich użytkowników z zespołu, niezależnie od listy podwładnych
	// Używamy endpointu alluserplans, który zwraca wszystkich użytkowników z zespołu
	const { data: allTeamUsers = [] } = useQuery({
		queryKey: ['users', 'all-team-for-schedule'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/users/alluserplans`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled: !!schedule,
		staleTime: 5 * 60 * 1000,
		cacheTime: 10 * 60 * 1000,
	})
	
	// Filter users based on schedule type
	// Dla grafiku zawsze pokazujemy wszystkich użytkowników z działu/zespołu, niezależnie od listy podwładnych
	const users = React.useMemo(() => {
		if (!schedule || !allTeamUsers.length) return []
		
		const scheduleTeamId = schedule.teamId?.toString()
		
		if (schedule.type === 'team') {
			// For team schedule - show only users from the same team
			return allTeamUsers.filter(user => {
				const userTeamId = user.teamId?.toString() || user.teamId?.toString()
				return userTeamId === scheduleTeamId
			})
		} else if (schedule.type === 'department') {
			// For department schedule - show ALL users from that department and same team
			// Niezależnie od listy podwładnych przełożonego
			return allTeamUsers.filter(user => {
				const userTeamId = user.teamId?.toString()
				const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
				return userTeamId === scheduleTeamId && userDepartments.includes(schedule.departmentName)
			})
		} else if (schedule.type === 'custom') {
			// For custom schedule - show only members of the schedule
			const memberIds = schedule.members ? schedule.members.map(m => m._id || m) : []
			return allTeamUsers.filter(user => {
				const userTeamId = user.teamId?.toString()
				return userTeamId === scheduleTeamId && memberIds.includes(user._id)
			})
		}
		return []
	}, [schedule, allTeamUsers])
	
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [showOnlyMyEvents, setShowOnlyMyEvents] = useState(false)
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState(null)
	const [selectedEntries, setSelectedEntries] = useState([])
	const [timeFrom, setTimeFrom] = useState('08:00')
	const [timeTo, setTimeTo] = useState('16:00')
	const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
	const [selectedEmployeeName, setSelectedEmployeeName] = useState('')
	const [notes, setNotes] = useState('')
	const [selectedWorkHoursIndex, setSelectedWorkHoursIndex] = useState(null)
	const calendarRef = useRef(null)
	const upsertEntryMutation = useUpsertScheduleEntry()
	const deleteEntryMutation = useDeleteScheduleEntry()
	
	// Color management for employees - generate stable colors based on name
	const colorsRef = useRef({})
	
	// Generate stable color based on employee name (deterministic)
	const getColorForEmployee = React.useCallback((employeeName) => {
		if (!employeeName) return '#3498db'
		if (!colorsRef.current[employeeName]) {
			// Generate stable color from string hash
			let hash = 0
			for (let i = 0; i < employeeName.length; i++) {
				hash = employeeName.charCodeAt(i) + ((hash << 5) - hash)
			}
			const hue = Math.abs(hash) % 360
			const saturation = 70
			const lightness = 50
			colorsRef.current[employeeName] = `hsl(${hue}, ${saturation}%, ${lightness}%)`
		}
		return colorsRef.current[employeeName]
	}, [])
	
	const { data: scheduleEntries = [], isLoading: loadingEntries, refetch: refetchEntries } = useScheduleEntries(
		scheduleId,
		currentMonth,
		currentYear
	)
	const { data: allAcceptedLeaveRequests = [], isLoading: loadingLeaveRequests } = useAllAcceptedLeaveRequests()
	const { data: settings } = useSettings()

	// Check if user can edit - uwzględnij konfigurację przełożonego i twórcę niestandardowego grafiku
	const isSupervisorRole = isSupervisor(role)
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const { data: supervisorConfig } = useSupervisorConfig(userId, isSupervisorRole && !isAdminRole && !isHRRole)
	
	// Sprawdź czy użytkownik jest twórcą niestandardowego grafiku
	const isCreator = React.useMemo(() => {
		if (!schedule || schedule.type !== 'custom') return false
		if (!schedule.createdBy) return false
		const createdById = typeof schedule.createdBy === 'object' ? schedule.createdBy._id : schedule.createdBy
		return createdById && createdById.toString() === userId.toString()
	}, [schedule, userId])
	
	const canEdit = React.useMemo(() => {
		if (!role || (Array.isArray(role) && role.length === 0)) {
			// Jeśli nie ma roli, sprawdź czy jest twórcą niestandardowego grafiku
			return isCreator
		}
		const roles = Array.isArray(role) ? role : [role]
		
		// HIERARCHIA RÓL: Admin > HR > Przełożony > Twórca niestandardowego grafiku
		// Admin i HR mają zawsze pełny dostęp
		if (isAdmin(roles) || isHR(roles)) {
			return true
		}
		
		// Twórca niestandardowego grafiku ma zawsze dostęp do swojego grafiku
		if (isCreator) {
			return true
		}
		
		// Przełożony - sprawdź konfigurację
		if (isSupervisor(roles)) {
			return supervisorConfig?.permissions?.canManageSchedule !== false
		}
		
		return false
	}, [role, supervisorConfig, isCreator])

	// Update calendar size when sidebar changes
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

	// Update calendar date when month/year changes via select
	useEffect(() => {
		if (calendarRef.current) {
			const calendarApi = calendarRef.current.getApi()
			const currentViewDate = calendarApi.getDate()
			const viewMonth = currentViewDate.getMonth()
			const viewYear = currentViewDate.getFullYear()
			
			// Only update if the calendar view doesn't match the selected month/year
			if (viewMonth !== currentMonth || viewYear !== currentYear) {
				calendarApi.gotoDate(new Date(currentYear, currentMonth, 1))
			}
		}
	}, [currentMonth, currentYear])

	// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
	const isWeekend = (date) => {
		const day = new Date(date).getDay()
		return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
	}

	// Funkcja pomocnicza do generowania dat w zakresie (z pominięciem weekendów i świąt)
	const generateDateRangeForCalendar = React.useCallback((startDate, endDate) => {
		if (!settings) return []
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
	}, [settings])

	// Convert schedule entries to FullCalendar events
	const calendarEvents = React.useMemo(() => {
		// Helper function to convert time string (HH:mm) to minutes for sorting
		const timeToMinutes = (timeStr) => {
			if (!timeStr) return 0
			const [hours, minutes] = timeStr.split(':').map(Number)
			return (hours || 0) * 60 + (minutes || 0)
		}
		
		const currentUserIdStr = userId?.toString()
		
		// Get user IDs from the schedule users
		const scheduleUserIds = users.map(u => u._id?.toString() || u.toString()).filter(Boolean)
		
		// Filter leave requests for users in this schedule
		const scheduleLeaveRequests = allAcceptedLeaveRequests.filter(request => {
			if (!request.userId || !request.startDate || !request.endDate) return false
			const requestUserId = request.userId._id?.toString() || request.userId?.toString()
			return scheduleUserIds.includes(requestUserId)
		})
		
		// Filter leave requests by userId if showOnlyMyEvents is enabled
		const filteredLeaveRequests = showOnlyMyEvents
			? scheduleLeaveRequests.filter(request => {
				const requestUserId = request.userId._id?.toString() || request.userId?.toString()
				return requestUserId === currentUserIdStr
			})
			: scheduleLeaveRequests
		
		// Add leave request events
		const leaveRequestEvents = filteredLeaveRequests
			.filter(request => request.startDate && request.endDate)
			.flatMap(request => {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				const userName = request.userId?.firstName && request.userId?.lastName
					? `${request.userId.firstName} ${request.userId.lastName}`
					: request.userId?.username || 'Unknown'
				return dates.map(date => ({
					title: `${userName}: ${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}`,
					start: date,
					allDay: true,
					textColor: 'white',
					backgroundColor: 'green',
					borderColor: 'green',
					classNames: 'event-absence',
					extendedProps: { 
						type: 'leaveRequest', 
						requestId: request._id,
						isAbsence: true,
						userId: request.userId._id?.toString() || request.userId?.toString()
					}
				}))
			})
		
		// Jeśli nie ma wpisów grafiku, zwróć tylko eventy z wniosków urlopowych
		if (!scheduleEntries || scheduleEntries.length === 0) {
			return leaveRequestEvents.sort((a, b) => a.start.localeCompare(b.start))
		}
		
		// Create all events first
		const allEvents = scheduleEntries.flatMap(day => {
			// Filter entries by userId if showOnlyMyEvents is enabled
			let entriesToProcess = day.entries
			if (showOnlyMyEvents) {
				entriesToProcess = day.entries.filter(entry => {
					const entryEmployeeId = entry.employeeId?.toString()
					return entryEmployeeId === currentUserIdStr
				})
			}
			
			return entriesToProcess.map((entry) => {
				const employeeColor = getColorForEmployee(entry.employeeName)
				return {
					title: `${entry.employeeName} (${entry.timeFrom} - ${entry.timeTo})${entry.notes ? ` | ${entry.notes}` : ''}`,
					start: day.date,
					allDay: true,
					backgroundColor: employeeColor,
					borderColor: employeeColor,
					textColor: '#ffffff',
					id: entry._id,
					extendedProps: {
						entryId: entry._id,
						employeeName: entry.employeeName,
						employeeId: entry.employeeId,
						timeFrom: entry.timeFrom,
						timeTo: entry.timeTo,
						notes: entry.notes
					}
				}
			})
		})
		
		// Combine all events
		const combinedEvents = [...allEvents, ...leaveRequestEvents]
		
		// Sort all events: first by date, then by timeFrom within the same date (for schedule entries)
		return combinedEvents.sort((a, b) => {
			// First compare dates
			const dateCompare = a.start.localeCompare(b.start)
			if (dateCompare !== 0) {
				return dateCompare
			}
			// If same date, sort by timeFrom (if available, otherwise leave requests go after schedule entries)
			const timeA = a.extendedProps?.timeFrom ? timeToMinutes(a.extendedProps.timeFrom) : 9999
			const timeB = b.extendedProps?.timeFrom ? timeToMinutes(b.extendedProps.timeFrom) : 9999
			return timeA - timeB
		})
	}, [scheduleEntries, getColorForEmployee, showOnlyMyEvents, userId, users, allAcceptedLeaveRequests, generateDateRangeForCalendar, settings, t, i18n.resolvedLanguage])

	// Sort selected entries by timeFrom for display in modal
	const sortedSelectedEntries = React.useMemo(() => {
		if (!selectedEntries || selectedEntries.length === 0) return []
		
		// Helper function to convert time string (HH:mm) to minutes for sorting
		const timeToMinutes = (timeStr) => {
			if (!timeStr) return 0
			const [hours, minutes] = timeStr.split(':').map(Number)
			return (hours || 0) * 60 + (minutes || 0)
		}
		
		return [...selectedEntries].sort((a, b) => {
			const timeA = timeToMinutes(a.timeFrom)
			const timeB = timeToMinutes(b.timeFrom)
			return timeA - timeB
		})
	}, [selectedEntries])

	if (!schedule) {
		return (
			<>
				<Sidebar />
				{loadingSchedule ? (
					<div className="content-with-loader">
						<Loader />
					</div>
				) : (
					<div style={{ padding: '15px' }}>
						<p>{t('schedule.notFound') || 'Grafik nie został znaleziony'}</p>
						<button onClick={() => navigate('/schedule')}>
							{t('schedule.backToList') || 'Wróć do listy grafików'}
						</button>
					</div>
				)}
			</>
		)
	}

	const handleDateClick = async (info) => {
		// Determine clicked date from event or date click
		let clickedDate
		if (info.date) {
			// Clicked on empty date
			clickedDate = info.dateStr
		} else if (info.event) {
			// Clicked on existing event
			if (info.event.startStr) {
				clickedDate = info.event.startStr
			} else if (info.event.start) {
				// Handle both Date object and string
				const startDate = info.event.start instanceof Date 
					? info.event.start 
					: new Date(info.event.start)
				clickedDate = startDate.toISOString().split('T')[0]
			} else {
				clickedDate = info.dateStr
			}
		} else {
			clickedDate = info.dateStr
		}
		
		setSelectedDate(clickedDate)
		
		// Helper function to normalize date to YYYY-MM-DD format
		// Use local timezone since dates are stored as calendar dates (midnight local time)
		const normalizeDate = (dateValue) => {
			if (!dateValue) return null
			
			// If it's already a string in YYYY-MM-DD format
			if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
				return dateValue
			}
			
			// If it's a Date object or ISO string
			let date
			if (dateValue instanceof Date) {
				date = dateValue
			} else if (typeof dateValue === 'string') {
				// Handle ISO string or date string
				// If it's just a date string (YYYY-MM-DD), parse it as local date
				if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
					const [year, month, day] = dateValue.split('-').map(Number)
					date = new Date(year, month - 1, day)
				} else {
					date = new Date(dateValue)
				}
			} else {
				return null
			}
			
			// Check if date is valid
			if (isNaN(date.getTime())) {
				return null
			}
			
			// Use local timezone since dates are stored as calendar dates
			const year = date.getFullYear()
			const month = String(date.getMonth() + 1).padStart(2, '0')
			const day = String(date.getDate()).padStart(2, '0')
			return `${year}-${month}-${day}`
		}
		
		// Normalize clickedDate to YYYY-MM-DD format for comparison
		let clickedDateNormalized = clickedDate
		if (clickedDate.includes('T')) {
			clickedDateNormalized = clickedDate.split('T')[0]
		} else if (!/^\d{4}-\d{2}-\d{2}$/.test(clickedDate)) {
			// If it's not in YYYY-MM-DD format, normalize it
			clickedDateNormalized = normalizeDate(clickedDate)
		}
		
		// Find entries for this date - normalize both dates for comparison
		// Make sure scheduleEntries is an array
		const entriesArray = Array.isArray(scheduleEntries) ? scheduleEntries : []
		
		const dayEntries = entriesArray.find(day => {
			if (!day || !day.date) return false
			
			const dayDateNormalized = normalizeDate(day.date)
			if (!dayDateNormalized || !clickedDateNormalized) return false
			
			return dayDateNormalized === clickedDateNormalized
		})
		
		const entries = dayEntries && Array.isArray(dayEntries.entries) ? dayEntries.entries : []
		setSelectedEntries(entries)
		setSelectedEmployeeId('')
		setSelectedEmployeeName('')
		
		// Auto-fill work hours from settings if available
		if (settings && settings.workHours) {
			let workHoursToUse = null
			if (Array.isArray(settings.workHours) && settings.workHours.length > 0) {
				// Nowy format - użyj pierwszej konfiguracji
				workHoursToUse = settings.workHours[0]
				setSelectedWorkHoursIndex(0)
			} else if (settings.workHours && !Array.isArray(settings.workHours) && settings.workHours.timeFrom && settings.workHours.timeTo) {
				// Stary format - kompatybilność wsteczna
				workHoursToUse = settings.workHours
				setSelectedWorkHoursIndex(null)
			}
			
			if (workHoursToUse && workHoursToUse.timeFrom && workHoursToUse.timeTo) {
				setTimeFrom(workHoursToUse.timeFrom)
				setTimeTo(workHoursToUse.timeTo)
			} else {
				setTimeFrom('08:00')
				setTimeTo('16:00')
			}
		} else {
			setTimeFrom('08:00')
			setTimeTo('16:00')
			setSelectedWorkHoursIndex(null)
		}
		
		setNotes('')
		setIsModalOpen(true)
	}

	const handleMonthChange = (info) => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		// Update state only if different to avoid unnecessary re-renders
		if (newMonth !== currentMonth || newYear !== currentYear) {
			setCurrentMonth(newMonth)
			setCurrentYear(newYear)
		}
	}

	const handleMonthSelect = (event) => {
		const newMonth = parseInt(event.target.value, 10)
		if (newMonth !== currentMonth) {
			setCurrentMonth(newMonth)
		}
	}

	const handleYearSelect = (event) => {
		const newYear = parseInt(event.target.value, 10)
		if (newYear !== currentYear) {
			setCurrentYear(newYear)
		}
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

	const handleEmployeeSelect = (event) => {
		const employeeId = event.target.value
		const selectedUser = users.find(u => u._id === employeeId)
		if (selectedUser) {
			setSelectedEmployeeId(employeeId)
			setSelectedEmployeeName(`${selectedUser.firstName} ${selectedUser.lastName}`)
		}
	}

	const handleAddEntry = async (e) => {
		e.preventDefault()

		if (!selectedEmployeeId || !selectedEmployeeName) {
			await showAlert(t('schedule.selectEmployee') || 'Wybierz pracownika')
			return
		}

		if (!timeFrom || !timeTo) {
			await showAlert(t('schedule.fillTimes') || 'Wypełnij godziny pracy')
			return
		}

		// Validate time format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
		if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
			await showAlert(t('schedule.invalidTimeFormat') || 'Nieprawidłowy format czasu. Użyj formatu HH:mm (np. 08:00)')
			return
		}

		try {
			const response = await upsertEntryMutation.mutateAsync({
				scheduleId,
				data: {
					date: selectedDate,
					timeFrom,
					timeTo,
					employeeId: selectedEmployeeId,
					employeeName: selectedEmployeeName,
					notes: notes || null
				}
			})
			
			// Helper function to normalize date to YYYY-MM-DD format
			const normalizeDate = (dateValue) => {
				if (!dateValue) return null
				
				// If it's already a string in YYYY-MM-DD format
				if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
					return dateValue
				}
				
				// If it's a Date object or ISO string
				let date
				if (dateValue instanceof Date) {
					date = dateValue
				} else if (typeof dateValue === 'string') {
					// Handle ISO string or date string
					if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
						const [year, month, day] = dateValue.split('-').map(Number)
						date = new Date(year, month - 1, day)
					} else {
						date = new Date(dateValue)
					}
				} else {
					return null
				}
				
				// Use local timezone since dates are stored as calendar dates
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}
			
			// Normalize selectedDate to YYYY-MM-DD format
			const selectedDateNormalized = selectedDate.includes('T') 
				? selectedDate.split('T')[0] 
				: selectedDate
			
			// Tworzymy nowy wpis do dodania do lokalnego stanu
			const newEntry = {
				_id: `temp-${Date.now()}`, // Tymczasowe ID, zostanie zastąpione przez prawdziwe po refetch
				employeeId: selectedEmployeeId,
				employeeName: selectedEmployeeName,
				timeFrom: timeFrom,
				timeTo: timeTo,
				notes: notes || null,
				createdBy: userId,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString()
			}
			
			// Aktualizuj lokalny stan selectedEntries od razu (optimistic update)
			setSelectedEntries(prevEntries => {
				// Sprawdź czy wpis już istnieje (na wypadek duplikatu)
				const entryExists = prevEntries.some(entry => 
					entry.employeeId === selectedEmployeeId &&
					entry.timeFrom === timeFrom &&
					entry.timeTo === timeTo
				)
				if (entryExists) {
					return prevEntries
				}
				return [...prevEntries, newEntry]
			})
			
			// Reset form
			setSelectedEmployeeId('')
			setSelectedEmployeeName('')
			
			// Auto-fill work hours from settings if available
			if (settings && settings.workHours) {
				let workHoursToUse = null
				if (Array.isArray(settings.workHours) && settings.workHours.length > 0) {
					workHoursToUse = settings.workHours[0]
					setSelectedWorkHoursIndex(0)
				} else if (settings.workHours && !Array.isArray(settings.workHours) && settings.workHours.timeFrom && settings.workHours.timeTo) {
					workHoursToUse = settings.workHours
					setSelectedWorkHoursIndex(null)
				}
				
				if (workHoursToUse && workHoursToUse.timeFrom && workHoursToUse.timeTo) {
					setTimeFrom(workHoursToUse.timeFrom)
					setTimeTo(workHoursToUse.timeTo)
				} else {
					setTimeFrom('08:00')
					setTimeTo('16:00')
				}
			} else {
				setTimeFrom('08:00')
				setTimeTo('16:00')
				setSelectedWorkHoursIndex(null)
			}
			
			setNotes('')
			
			// Refetch entries w tle, aby zaktualizować kalendarz i uzyskać prawdziwe ID wpisu
			refetchEntries().then(({ data: updatedEntries }) => {
				if (updatedEntries && selectedDate) {
					const dayEntries = updatedEntries.find(day => {
						if (!day || !day.date) return false
						const dayDateNormalized = normalizeDate(day.date)
						return dayDateNormalized === selectedDateNormalized
					})
					if (dayEntries) {
						setSelectedEntries(dayEntries.entries || [])
					}
				}
			}).catch(err => {
				console.error('Error refetching entries:', err)
			})
			
			await showAlert(t('schedule.entryAdded') || 'Wpis został dodany pomyślnie')
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.addError') || 'Błąd podczas dodawania wpisu')
		}
	}

	const handleDeleteEntry = async (entryId) => {
		const confirmed = await showConfirm(
			t('schedule.deleteConfirm') || 'Czy na pewno chcesz usunąć ten wpis?'
		)
		if (!confirmed) return

		try {
			await deleteEntryMutation.mutateAsync({
				scheduleId,
				entryId
			})
			// Refetch entries to update the calendar and modal
			await refetchEntries()
			
			// Update selected entries in modal after refetch if modal is open
			if (selectedDate) {
				const { data: updatedEntries } = await refetchEntries()
				if (updatedEntries) {
					// Normalize selectedDate to YYYY-MM-DD format
					const selectedDateNormalized = selectedDate.includes('T') 
						? selectedDate.split('T')[0] 
						: selectedDate
					
					// Helper function to normalize date to YYYY-MM-DD format
					// Use local timezone since dates are stored as calendar dates (midnight local time)
					const normalizeDate = (dateValue) => {
						if (!dateValue) return null
						
						// If it's already a string in YYYY-MM-DD format
						if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
							return dateValue
						}
						
						// If it's a Date object or ISO string
						let date
						if (dateValue instanceof Date) {
							date = dateValue
						} else if (typeof dateValue === 'string') {
							// Handle ISO string or date string
							// If it's just a date string (YYYY-MM-DD), parse it as local date
							if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
								const [year, month, day] = dateValue.split('-').map(Number)
								date = new Date(year, month - 1, day)
							} else {
								date = new Date(dateValue)
							}
						} else {
							return null
						}
						
						// Check if date is valid
						if (isNaN(date.getTime())) {
							return null
						}
						
						// Use local timezone since dates are stored as calendar dates
						const year = date.getFullYear()
						const month = String(date.getMonth() + 1).padStart(2, '0')
						const day = String(date.getDate()).padStart(2, '0')
						return `${year}-${month}-${day}`
					}
					
					const dayEntries = updatedEntries.find(day => {
						if (!day || !day.date) return false
						
						const dayDateNormalized = normalizeDate(day.date)
						return dayDateNormalized === selectedDateNormalized
					})
					setSelectedEntries(dayEntries ? dayEntries.entries : [])
				} else {
					// Fallback: remove entry from local state
					setSelectedEntries(prev => prev.filter(entry => entry._id !== entryId))
				}
			}
			
			await showAlert(t('schedule.entryDeleted') || 'Wpis został usunięty pomyślnie')
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.deleteError') || 'Błąd podczas usuwania wpisu')
		}
	}

	const renderEventContent = (eventInfo) => {
		return (
			<div className="event-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
				<span style={{ flex: 1, whiteSpace: 'normal', wordBreak: 'break-word' }}>{eventInfo.event.title}</span>
			</div>
		)
	}

	return (
		<>
			<Sidebar />
			{loadingSchedule ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div style={{ padding: '15px', maxWidth: '100%', overflowX: 'auto' }} className='schedule-container'>
				<h2 style={{
					display: 'flex',
					alignItems: 'center',
					marginBottom: '20px',
					color: '#2c3e50',
					fontSize: '28px',
					fontWeight: '600'
				}}>
					<img src="/img/project.png" alt="Schedule icon" />
					{schedule.name}
				</h2>
				<hr />

				<div style={{
					display: 'flex',
					gap: '5px',
					marginBottom: '20px',
					alignItems: 'center',
					flexWrap: 'wrap'
				}} className='calendar-controls notbottomargin'>
					<select
						value={currentMonth}
						onChange={handleMonthSelect}
						style={{
							padding: '8px 12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}>
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
						style={{
							padding: '8px 12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}>
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
						style={{
							padding: '8px 12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							backgroundColor: 'white',
							cursor: 'pointer',
							fontSize: '18px',
							fontWeight: '600',
							color: '#495057',
							transition: 'all 0.2s ease'
						}}
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
						style={{
							padding: '8px 12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							backgroundColor: 'white',
							cursor: 'pointer',
							fontSize: '18px',
							fontWeight: '600',
							color: '#495057',
							transition: 'all 0.2s ease'
						}}
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

					<label style={{
						display: 'flex',
						alignItems: 'center',
						gap: '8px',
						cursor: 'pointer',
						marginLeft: '0px',
						padding: '8px 12px',
						borderRadius: '6px',
						userSelect: 'none',
						marginBottom: '0px'
					}} className='onlymyevent'>
						<input
							type="checkbox"
							checked={showOnlyMyEvents}
							onChange={(e) => setShowOnlyMyEvents(e.target.checked)}
							style={{
								width: '18px',
								height: '18px',
								cursor: 'pointer'
							}}
						/>
						<span style={{ fontSize: '16px', color: '#2c3e50' }}>
							{t('schedule.showOnlyMyEvents') || 'Pokaż tylko moje wpisy'}
						</span>
					</label>
				</div>

				{loadingEntries || loadingLeaveRequests ? (
					<Loader />
				) : (
					<div style={{
						backgroundColor: 'white'
					}}>
						<FullCalendar
							plugins={[dayGridPlugin, interactionPlugin]}
							initialView="dayGridMonth"
							initialDate={new Date(currentYear, currentMonth, 1)}
							locale={i18n.resolvedLanguage}
							firstDay={1}
							showNonCurrentDates={false}
							events={calendarEvents}
							ref={calendarRef}
							dateClick={handleDateClick}
							eventClick={handleDateClick}
							displayEventTime={false}
							datesSet={handleMonthChange}
							height="auto"
							key={`${currentMonth}-${currentYear}`}
							eventContent={renderEventContent}
						/>
					</div>
				)}

				{!canEdit && (
					<div style={{
						marginTop: '20px',
						padding: '15px',
						backgroundColor: '#fff3cd',
						border: '1px solid #ffc107',
						borderRadius: '8px',
						color: '#856404'
					}}>
						{t('schedule.readOnlyMessage') || 'Masz uprawnienia tylko do przeglądania grafiku. Nie możesz dodawać ani edytować wpisów.'}
					</div>
				)}
				<Modal
					isOpen={isModalOpen}
					onRequestClose={() => {
						setIsModalOpen(false)
						setSelectedDate(null)
						setSelectedEntries([])
						setNotes('')
					}}
					style={{
						overlay: {
							display: 'flex',
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: 'rgba(0, 0, 0, 0.5)',
							backdropFilter: 'blur(2px)'
						},
						content: {
							position: 'relative',
							inset: 'unset',
							margin: '0',
							maxWidth: '600px',
							width: '90%',
							maxHeight: '80vh',
							overflowY: 'auto',
							borderRadius: '12px',
							padding: '30px',
							backgroundColor: 'white',
							boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
						}
					}}
					contentLabel={t('schedule.addEntry') || 'Dodaj wpis do grafiku'}>
				<>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
						{selectedDate && (
							<h2 className="text-xl font-semibold mb-4 text-gray-800" style={{ margin: 0 }}>
								{t('schedule.entriesForDate') || 'Wpisy dla daty'}: {new Date(selectedDate).toLocaleDateString(i18n.resolvedLanguage, { day: 'numeric', month: 'numeric', year: 'numeric' })}
							</h2>
						)}
						<button
							onClick={() => {
								setIsModalOpen(false)
								setSelectedDate(null)
								setSelectedEntries([])
								setNotes('')
								setSelectedEmployeeId('')
								setSelectedEmployeeName('')
								setTimeFrom('08:00')
								setTimeTo('16:00')
								setSelectedWorkHoursIndex(null)
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
								justifyContent: 'center',
								flexShrink: 0
							}}
							onMouseEnter={(e) => e.target.style.color = '#2c3e50'}
							onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}
							aria-label={t('schedule.closeModal') || 'Zamknij'}
						>
							×
						</button>
					</div>
					{sortedSelectedEntries.length > 0 ? (
					<div style={{ marginBottom: '30px' }}>
						<h3 style={{
							marginBottom: '15px',
							color: '#2c3e50',
							fontSize: '18px',
							fontWeight: '600'
						}}>
							{t('schedule.existingEntries') || 'Istniejące wpisy'}
						</h3>
						<div style={{
							display: 'flex',
							flexDirection: 'column',
							gap: '10px'
						}}>
						{sortedSelectedEntries.map((entry) => {
							return (
									<div key={entry._id || Math.random()} style={{
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
												{entry.employeeName || 'Brak nazwy'}
											</div>
											<div style={{
												color: '#7f8c8d',
												fontSize: '16px'
											}}>
												{entry.timeFrom} - {entry.timeTo}
											</div>
											{entry.notes && (
												<div style={{
													fontSize: '14px',
													color: '#7f8c8d',
													marginTop: '5px',
													fontStyle: 'italic'
												}}>
													{t('schedule.notes') || 'Uwagi'}: {entry.notes}
												</div>
											)}
										</div>
										{canEdit ? (
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													console.log('Delete button clicked for entry:', entry._id, 'canEdit:', canEdit)
													if (handleDeleteEntry) {
														handleDeleteEntry(entry._id)
													} else {
														console.error('handleDeleteEntry is not defined!')
													}
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
												{t('schedule.delete') || 'Usuń'}
											</button>
										) : (
											<div style={{ 
												padding: '8px 16px', 
												fontSize: '12px', 
												color: '#999',
												marginLeft: '10px'
											}}>
												Brak uprawnień
											</div>
										)}
									</div>
								)
							})}
						</div>
					</div>
				) : null}

				{canEdit && (
					<form onSubmit={handleAddEntry}>
					<h3 style={{
						marginBottom: '15px',
						color: '#2c3e50',
						fontSize: '18px',
						fontWeight: '600'
					}}>
						{t('schedule.addNewEntry') || 'Dodaj nowy wpis'}
					</h3>

					<div style={{ marginBottom: '20px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#2c3e50'
						}}>
							{t('schedule.employee') || 'Pracownik'}
						</label>
						<select
							value={selectedEmployeeId}
							onChange={handleEmployeeSelect}
							required
							style={{
								width: '100%',
								padding: '12px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px'
							}}>
							<option value="">
								{t('schedule.selectEmployee') || 'Wybierz pracownika'}
							</option>
							{users.map((user) => (
								<option key={user._id} value={user._id}>
									{user.firstName} {user.lastName}
									{user.position ? ` - ${user.position}` : ''}
								</option>
							))}
						</select>
					</div>

					{/* Checkboxy dla wielu konfiguracji godzin pracy */}
					{settings && settings.workHours && Array.isArray(settings.workHours) && settings.workHours.length > 1 && (
						<div style={{
							marginBottom: '20px',
							padding: '12px',
							backgroundColor: '#e3f2fd',
							border: '1px solid #90caf9',
							borderRadius: '6px'
						}}>
							<label style={{
								display: 'block',
								marginBottom: '10px',
								fontWeight: '600',
								color: '#2c3e50',
								fontSize: '14px'
							}}>
								{t('schedule.selectWorkHours') || 'Wybierz godziny pracy:'}
							</label>
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '8px'
							}}>
								{settings.workHours.map((workHours, index) => (
									<label
										key={index}
										style={{
											display: 'flex',
											alignItems: 'center',
											cursor: 'pointer',
											padding: '8px',
											borderRadius: '4px',
											backgroundColor: selectedWorkHoursIndex === index ? '#bbdefb' : 'white',
											border: `1px solid ${selectedWorkHoursIndex === index ? '#2196f3' : '#dee2e6'}`,
											transition: 'all 0.2s'
										}}
									>
										<input
											type="radio"
											name="scheduleWorkHours"
											checked={selectedWorkHoursIndex === index}
											onChange={() => {
												setSelectedWorkHoursIndex(index)
												setTimeFrom(workHours.timeFrom)
												setTimeTo(workHours.timeTo)
											}}
											style={{
												marginRight: '10px',
												cursor: 'pointer'
											}}
										/>
										<span style={{
											fontSize: '14px',
											color: '#2c3e50',
											flex: 1
										}}>
											{workHours.timeFrom} - {workHours.timeTo} ({workHours.hours} {t('settings.hours') || 'godzin'})
										</span>
									</label>
								))}
							</div>
						</div>
					)}

					<div style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '15px',
						marginBottom: '20px'
					}}>
						<div>
							<label style={{
								display: 'block',
								marginBottom: '8px',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{t('schedule.timeFrom') || 'Od'}
							</label>
							<input
								type="text"
								value={timeFrom}
								onChange={(e) => {
									setTimeFrom(e.target.value)
									// Jeśli użytkownik ręcznie edytuje, odznacz wybór z checkboxów
									if (selectedWorkHoursIndex !== null) {
										setSelectedWorkHoursIndex(null)
									}
								}}
								placeholder="08:00"
								required
								pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							/>
						</div>
						<div>
							<label style={{
								display: 'block',
								marginBottom: '8px',
								fontWeight: '600',
								color: '#2c3e50'
							}}>
								{t('schedule.timeTo') || 'Do'}
							</label>
							<input
								type="text"
								value={timeTo}
								onChange={(e) => {
									setTimeTo(e.target.value)
									// Jeśli użytkownik ręcznie edytuje, odznacz wybór z checkboxów
									if (selectedWorkHoursIndex !== null) {
										setSelectedWorkHoursIndex(null)
									}
								}}
								placeholder="16:00"
								required
								pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							/>
						</div>
					</div>

					<div style={{ marginBottom: '20px' }}>
						<label style={{
							display: 'block',
							marginBottom: '8px',
							fontWeight: '600',
							color: '#2c3e50'
						}}>
							{t('schedule.notes') || 'Uwagi'}
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t('schedule.notesPlaceholder') || 'Dodaj uwagi...'}
							rows="3"
							style={{
								width: '100%',
								padding: '12px',
								border: '1px solid #bdc3c7',
								borderRadius: '6px',
								fontSize: '16px',
								resize: 'vertical'
							}}
						/>
					</div>

					<div style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '10px',
						marginTop: '30px'
					}}>
						<button
							type="button"
						onClick={() => {
							setIsModalOpen(false)
							setSelectedDate(null)
							setSelectedEntries([])
							setNotes('')
						}}
							style={{
								padding: '12px 24px',
								backgroundColor: '#95a5a6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '500',
								cursor: 'pointer'
							}}>
							{t('schedule.cancel') || 'Anuluj'}
						</button>
						<button
							type="submit"
							style={{
								padding: '12px 24px',
								backgroundColor: '#27ae60',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '500',
								cursor: 'pointer'
							}}>
							{t('schedule.add') || 'Dodaj'}
						</button>
					</div>
				</form>
				)}
				{!canEdit && selectedEntries.length > 0 && (
					<div style={{
						marginTop: '20px',
						padding: '15px',
						backgroundColor: '#fff3cd',
						border: '1px solid #ffc107',
						borderRadius: '8px',
						color: '#856404',
						textAlign: 'center'
					}}>
						{t('schedule.readOnlyMessage') || 'Masz uprawnienia tylko do przeglądania grafiku. Nie możesz dodawać ani edytować wpisów.'}
					</div>
				)}
				</>
			</Modal>
			</div>
			)}
		</>
	)
}

export default Schedule

