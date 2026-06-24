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
import {
	useSchedule,
	useScheduleEntries,
	useUpsertScheduleEntry,
	useDeleteScheduleEntry,
	useUpsertScheduleAvailability,
	useDeleteScheduleAvailability,
	useAutoGenerateScheduleMonth,
	useClearScheduleMonth,
	usePublishScheduleMonth
} from '../../hooks/useSchedule'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import { useAllLeaveRequests, useAllAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { mergeCalendarLeaveRequests } from '../../utils/leaveRequestCalendarVisibility'
import { useSettings } from '../../hooks/useSettings'
import { isHolidayDate, getHolidaysInRange, toYmdLocal } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import ScheduleAutoAiPanel from './ScheduleAutoAiPanel'

/** Polish (and some locales) return month names lowercase — capitalize for UI labels */
function capitalizeMonthName(locale, monthIndexZeroBased) {
	const raw = new Date(0, monthIndexZeroBased).toLocaleString(locale, { month: 'long' })
	if (!raw || typeof raw !== 'string') return raw
	return raw.charAt(0).toUpperCase() + raw.slice(1)
}

const halfHourOptions = Array.from({ length: 48 }, (_, index) => {
	const totalMinutes = index * 30
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
	const minutes = String(totalMinutes % 60).padStart(2, '0')
	return `${hours}:${minutes}`
})

const normalizeHalfHourTime = (time) => {
	const match = String(time || '').trim().match(/^(\d{1,2}):([0-5]\d)$/)
	if (!match) return ''
	return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

/** Ustawienia zespołu: workHours jako tablica lub pojedynczy obiekt (kompatybilność). */
function normalizedTeamWorkHoursList(workHours) {
	if (!workHours) return []
	if (Array.isArray(workHours)) return workHours.filter((w) => w?.timeFrom && w?.timeTo)
	if (workHours.timeFrom && workHours.timeTo) return [workHours]
	return []
}

/** Jedna karta zmiany na każdy przedział z ustawień — do auto-uzupełnienia miesiąca. */
function buildAutoShiftRowsFromTeamSettings(workHours) {
	const list = normalizedTeamWorkHoursList(workHours)
	if (list.length === 0) return null
	return list.map((wh, idx) => ({
		id: `shift-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
		timeFrom: normalizeHalfHourTime(wh.timeFrom),
		timeTo: normalizeHalfHourTime(wh.timeTo),
		minEmployees: 2,
		weekdays: [1, 2, 3, 4, 5]
	}))
}

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
	const [showOnlyAvailableEmployees, setShowOnlyAvailableEmployees] = useState(true)
	const [availabilityFromDate, setAvailabilityFromDate] = useState('')
	const [availabilityToDate, setAvailabilityToDate] = useState('')
	const [availabilityNotes, setAvailabilityNotes] = useState('')
	const [availabilityTimeWindows, setAvailabilityTimeWindows] = useState([])
	const [isAutoGenerateModalOpen, setIsAutoGenerateModalOpen] = useState(false)
	const [autoGenerateMonth, setAutoGenerateMonth] = useState(new Date().getMonth() + 1)
	const [autoGenerateYear, setAutoGenerateYear] = useState(new Date().getFullYear())
	const [autoShiftRows, setAutoShiftRows] = useState([
		{ id: `shift-${Date.now()}`, timeFrom: '08:00', timeTo: '16:00', minEmployees: 2, weekdays: [1, 2, 3, 4, 5] }
	])
	const [autoDayOverrideRows, setAutoDayOverrideRows] = useState([])
	const [autoManualExclusionRows, setAutoManualExclusionRows] = useState([])
	const [autoAllowMultipleShiftsPerDay, setAutoAllowMultipleShiftsPerDay] = useState(false)
	const [autoGenerateNotes, setAutoGenerateNotes] = useState('')
	const [autoPreferAvailability, setAutoPreferAvailability] = useState(true)
	const [autoStrictAvailability, setAutoStrictAvailability] = useState(false)
	const [autoFillUiMode, setAutoFillUiMode] = useState('form')
	const [selectedWorkHoursIndex, setSelectedWorkHoursIndex] = useState(null)
	const calendarRef = useRef(null)
	const upsertEntryMutation = useUpsertScheduleEntry()
	const deleteEntryMutation = useDeleteScheduleEntry()
	const upsertAvailabilityMutation = useUpsertScheduleAvailability()
	const deleteAvailabilityMutation = useDeleteScheduleAvailability()
	const autoGenerateMutation = useAutoGenerateScheduleMonth()
	const clearScheduleMonthMutation = useClearScheduleMonth()
	const publishScheduleMonthMutation = usePublishScheduleMonth()
	
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
	const { data: allTeamLeaveRequests = [], isLoading: loadingAllLeaveRequests } = useAllLeaveRequests()
	const { data: acceptedSentTeamRequests = [], isLoading: loadingAcceptedLeaveRequests } = useAllAcceptedLeaveRequests()
	const { data: settings } = useSettings()
	const isAvailabilityEnabled = schedule?.availabilityEnabled === true
	const draftEntriesCountCurrentMonth = React.useMemo(
		() =>
			(Array.isArray(scheduleEntries) ? scheduleEntries : []).reduce((sum, day) => {
				const dayEntries = Array.isArray(day?.entries) ? day.entries : []
				return sum + dayEntries.filter((entry) => entry?.isPublished === false).length
			}, 0),
		[scheduleEntries]
	)

	// Check if user can edit - uwzględnij konfigurację przełożonego i twórcę niestandardowego grafiku
	const isSupervisorRole = isSupervisor(role)
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const isManagerLikeRole = isAdminRole || isHRRole || isSupervisorRole
	const { data: supervisorConfig } = useSupervisorConfig(userId, isSupervisorRole && !isAdminRole && !isHRRole)
	const [showAvailabilityForm, setShowAvailabilityForm] = useState(!isManagerLikeRole)

	useEffect(() => {
		setShowAvailabilityForm(!isManagerLikeRole)
	}, [isManagerLikeRole, scheduleId])

	useEffect(() => {
		if (!isAutoGenerateModalOpen) setAutoFillUiMode('form')
	}, [isAutoGenerateModalOpen])
	
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
			const currentDateStr = toYmdLocal(current)
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
		const scheduleUserIdSet = new Set(scheduleUserIds)

		const scheduleLeaveRequests = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedSentTeamRequests,
			allStatusRequests: allTeamLeaveRequests,
			role,
			currentUserId: userId,
			scopeUserIds: scheduleUserIdSet,
		}).filter((request) => request.userId && request.startDate && request.endDate)
		
		// Filter leave requests by userId if showOnlyMyEvents is enabled
		const filteredLeaveRequests = showOnlyMyEvents
			? scheduleLeaveRequests.filter(request => {
				const requestUserId = request.userId._id?.toString() || request.userId?.toString()
				return requestUserId === currentUserIdStr
			})
			: scheduleLeaveRequests

		// Święta ustawowe / własne zespołu — jak w MonthlyCalendar: zwykłe wydarzenia całodniowe
		// (display: 'background' nie pokazuje nazwy w widoku miesiąca)
		const pad2 = (n) => String(n).padStart(2, '0')
		const monthStartStr = `${currentYear}-${pad2(currentMonth + 1)}-01`
		const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
		const monthEndStr = `${currentYear}-${pad2(currentMonth + 1)}-${pad2(lastDayOfMonth)}`
		const holidayEvents =
			settings && (settings.includePolishHolidays || settings.includeCustomHolidays)
				? getHolidaysInRange(monthStartStr, monthEndStr, settings).map((h) => ({
						title: h.name,
						start: h.date,
						allDay: true,
						backgroundColor: 'green',
						borderColor: 'darkgreen',
						textColor: 'white',
						classNames: ['schedule-calendar-holiday-event'],
						extendedProps: { type: 'holiday', holidayName: h.name },
					}))
				: []

		const sortEventsSameDay = (a, b) => {
			const pa = a.extendedProps?.type === 'holiday' ? -1 : a.extendedProps?.timeFrom ? timeToMinutes(a.extendedProps.timeFrom) : 5000
			const pb = b.extendedProps?.type === 'holiday' ? -1 : b.extendedProps?.timeFrom ? timeToMinutes(b.extendedProps.timeFrom) : 5000
			return pa - pb
		}
		
		// Add leave request events
		const leaveRequestEvents = filteredLeaveRequests
			.filter(request => request.startDate && request.endDate)
			.flatMap(request => {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				const userName = request.userId?.firstName && request.userId?.lastName
					? `${request.userId.firstName} ${request.userId.lastName}`
					: request.userId?.username || 'Unknown'
				const isPendingRequest = request.status === 'status.pending' || request.status === 'pending'
				const pendingLabel = isPendingRequest
					? (i18n.resolvedLanguage === 'pl' ? ' - oczekuje na akceptację' : ' - pending approval')
					: ''
				return dates.map(date => ({
					title: `${userName}: ${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}${pendingLabel}`,
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
		
		// Jeśli nie ma wpisów grafiku — święta + wnioski (sort: data, potem święta na początku dnia)
		if (!scheduleEntries || scheduleEntries.length === 0) {
			return [...holidayEvents, ...leaveRequestEvents].sort((a, b) => {
				const dateCompare = a.start.localeCompare(b.start)
				if (dateCompare !== 0) return dateCompare
				return sortEventsSameDay(a, b)
			})
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
				const isDraftEntry = entry?.isPublished === false
				return {
					title: `${entry.employeeName} (${entry.timeFrom} - ${entry.timeTo})${entry.notes ? ` | ${entry.notes}` : ''}${isDraftEntry ? ` • ${t('schedule.auto.draftBadge') || 'ROBOCZY'}` : ''}`,
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
						notes: entry.notes,
						isPublished: entry.isPublished
					}
				}
			})
		})
		
		// Święta + wpisy grafiku + wnioski (święta pierwsze w obrębie dnia — widać nazwę jak w MonthlyCalendar)
		const combinedEvents = [...holidayEvents, ...allEvents, ...leaveRequestEvents]
		
		return combinedEvents.sort((a, b) => {
			const dateCompare = a.start.localeCompare(b.start)
			if (dateCompare !== 0) return dateCompare
			return sortEventsSameDay(a, b)
		})
	}, [scheduleEntries, getColorForEmployee, showOnlyMyEvents, userId, users, allTeamLeaveRequests, acceptedSentTeamRequests, role, generateDateRangeForCalendar, settings, t, i18n.resolvedLanguage, currentMonth, currentYear])

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

	const selectedDayAvailabilities = React.useMemo(() => {
		if (!isAvailabilityEnabled) return []
		if (!selectedDate || !Array.isArray(scheduleEntries)) return []
		const normalizedSelectedDate = selectedDate.includes('T') ? selectedDate.split('T')[0] : selectedDate

		const targetDay = scheduleEntries.find((day) => {
			if (!day?.date) return false
			const dayDate = new Date(day.date)
			const year = dayDate.getFullYear()
			const month = String(dayDate.getMonth() + 1).padStart(2, '0')
			const date = String(dayDate.getDate()).padStart(2, '0')
			return `${year}-${month}-${date}` === normalizedSelectedDate
		})

		return Array.isArray(targetDay?.availabilities) ? targetDay.availabilities : []
	}, [selectedDate, scheduleEntries, isAvailabilityEnabled])

	const availableEmployeeIds = React.useMemo(
		() => selectedDayAvailabilities.map((availability) => availability.employeeId?.toString()).filter(Boolean),
		[selectedDayAvailabilities]
	)

	const filteredUsersForEntry = React.useMemo(() => {
		if (!isAvailabilityEnabled) return users
		if (!showOnlyAvailableEmployees || availableEmployeeIds.length === 0) {
			return users
		}
		return users.filter((user) => availableEmployeeIds.includes(user._id?.toString()))
	}, [users, showOnlyAvailableEmployees, availableEmployeeIds, isAvailabilityEnabled])

	const myAvailabilityForSelectedDate = React.useMemo(() => {
		const currentUserId = userId?.toString()
		if (!currentUserId) return null
		return selectedDayAvailabilities.find((availability) => availability.employeeId?.toString() === currentUserId) || null
	}, [selectedDayAvailabilities, userId])

	const isSelectedDateWeekendBlocked = React.useMemo(() => {
		if (!selectedDate) return false
		return settings?.workOnWeekends === false && isWeekend(selectedDate)
	}, [selectedDate, settings])

	const selectedDateHolidayInfo = React.useMemo(() => {
		if (!selectedDate || !settings) return null
		if (!settings.includePolishHolidays && !settings.includeCustomHolidays) return null
		const raw = selectedDate.includes('T') ? selectedDate.split('T')[0] : selectedDate
		return isHolidayDate(raw, settings)
	}, [selectedDate, settings])

	const isSelectedDateHolidayBlocked = selectedDateHolidayInfo !== null

	const isNonWorkingScheduleDayBlocked = isSelectedDateWeekendBlocked || isSelectedDateHolidayBlocked

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
				setTimeFrom(normalizeHalfHourTime(workHoursToUse.timeFrom))
				setTimeTo(normalizeHalfHourTime(workHoursToUse.timeTo))
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
		setShowOnlyAvailableEmployees(true)
		setAvailabilityFromDate(clickedDateNormalized || '')
		setAvailabilityToDate(clickedDateNormalized || '')
		const currentUserId = userId?.toString()
		const existingAvailability = entriesArray
			.find((day) => normalizeDate(day?.date) === clickedDateNormalized)
			?.availabilities
			?.find((availability) => availability.employeeId?.toString() === currentUserId)
		setAvailabilityNotes(existingAvailability?.notes || '')
		const existingWindows = Array.isArray(existingAvailability?.timeWindows)
			? existingAvailability.timeWindows
			: []
		setAvailabilityTimeWindows(
			existingWindows.length > 0
				? existingWindows.map((window, index) => ({
					id: `availability-existing-${index}-${Date.now()}`,
					timeFrom: window.timeFrom || '',
					timeTo: window.timeTo || ''
				}))
				: []
		)
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

	const weekdayOptions = [
		{ value: 1, label: t('schedule.auto.weekdays.mon') || 'Pn' },
		{ value: 2, label: t('schedule.auto.weekdays.tue') || 'Wt' },
		{ value: 3, label: t('schedule.auto.weekdays.wed') || 'Śr' },
		{ value: 4, label: t('schedule.auto.weekdays.thu') || 'Cz' },
		{ value: 5, label: t('schedule.auto.weekdays.fri') || 'Pt' },
		{ value: 6, label: t('schedule.auto.weekdays.sat') || 'Sb' },
		{ value: 0, label: t('schedule.auto.weekdays.sun') || 'Nd' }
	]

	const createDefaultShiftRow = () => ({
		id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		timeFrom: '08:00',
		timeTo: '16:00',
		minEmployees: 2,
		weekdays: [1, 2, 3, 4, 5]
	})

	const createDefaultOverrideRow = () => ({
		id: `override-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		date: '',
		timeFrom: '08:00',
		timeTo: '16:00',
		minEmployees: 2
	})

	const createDefaultManualExclusionRow = () => ({
		id: `manual-exclusion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		userId: '',
		date: '',
		timeFrom: '',
		timeTo: ''
	})

	const createDefaultAvailabilityWindow = () => ({
		id: `availability-window-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
		timeFrom: '08:00',
		timeTo: '16:00'
	})

	const openAutoGenerateModal = () => {
		setAutoGenerateMonth(currentMonth + 1)
		setAutoGenerateYear(currentYear)
		const fromTeam = buildAutoShiftRowsFromTeamSettings(settings?.workHours)
		setAutoShiftRows(fromTeam && fromTeam.length > 0 ? fromTeam : [createDefaultShiftRow()])
		setAutoDayOverrideRows([])
		setAutoManualExclusionRows([])
		setAutoAllowMultipleShiftsPerDay(false)
		setAutoGenerateNotes(t('schedule.auto.defaultNote') || 'Auto-plan')
		setAutoPreferAvailability(true)
		setAutoStrictAvailability(false)
		setIsAutoGenerateModalOpen(true)
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

	const buildDateRange = (from, to) => {
		if (!from || !to) return []
		const start = new Date(from)
		const end = new Date(to)
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return []
		if (start > end) return []

		const dates = []
		const cursor = new Date(start)
		while (cursor <= end) {
			const year = cursor.getFullYear()
			const month = String(cursor.getMonth() + 1).padStart(2, '0')
			const day = String(cursor.getDate()).padStart(2, '0')
			dates.push(`${year}-${month}-${day}`)
			cursor.setDate(cursor.getDate() + 1)
		}
		return dates
	}

	const normalizeTimeInput = (timeValue) => {
		if (!timeValue || typeof timeValue !== 'string') return null
		const trimmed = timeValue.trim()
		const match = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)
		if (!match) return null
		return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
	}

	const timeToMinutes = (timeValue) => {
		const normalized = normalizeTimeInput(timeValue)
		if (!normalized) return null
		const [hours, minutes] = normalized.split(':').map(Number)
		return hours * 60 + minutes
	}

	const formatAvailabilityWindows = (timeWindows) => {
		if (!Array.isArray(timeWindows) || timeWindows.length === 0) {
			return t('schedule.availability.fullDay') || 'cały dzień'
		}
		return timeWindows
			.map((window) => `${window.timeFrom} - ${window.timeTo}`)
			.join(', ')
	}

	const handleSaveAvailability = async (e) => {
		e.preventDefault()
		const dates = buildDateRange(availabilityFromDate, availabilityToDate)
		if (dates.length === 0) {
			await showAlert(t('schedule.availability.invalidDateRange') || 'Wybierz poprawny zakres dat dyspozycyjności.')
			return
		}
		if (settings?.workOnWeekends === false && dates.some((dateValue) => isWeekend(dateValue))) {
			await showAlert(t('schedule.availability.weekendBlocked') || 'Nie można zgłaszać dyspozycyjności na weekendy, gdy zespół nie pracuje w weekendy.')
			return
		}
		if (
			(settings?.includePolishHolidays || settings?.includeCustomHolidays) &&
			dates.some((dateValue) => isHolidayDate(dateValue, settings))
		) {
			await showAlert(
				t('schedule.availability.holidayBlocked') ||
					'Nie można zgłaszać dyspozycyjności w dni świąteczne wolne od pracy (ustawienia zespołu).'
			)
			return
		}

		const normalizedTimeWindows = availabilityTimeWindows
			.map((window) => ({
				timeFrom: normalizeTimeInput(window.timeFrom),
				timeTo: normalizeTimeInput(window.timeTo)
			}))
			.filter((window) => window.timeFrom || window.timeTo)

		const hasInvalidWindow = normalizedTimeWindows.some((window) => {
			if (!window.timeFrom || !window.timeTo) return true
			const fromMinutes = timeToMinutes(window.timeFrom)
			const toMinutes = timeToMinutes(window.timeTo)
			return fromMinutes === null || toMinutes === null || fromMinutes >= toMinutes
		})
		if (hasInvalidWindow) {
			await showAlert(t('schedule.availability.invalidTimeWindows') || 'Uzupełnij poprawnie okna godzinowe dyspozycyjności (od/do).')
			return
		}

		try {
			await upsertAvailabilityMutation.mutateAsync({
				scheduleId,
				data: {
					dates,
					notes: availabilityNotes || '',
					timeWindows: normalizedTimeWindows
				}
			})
			await refetchEntries()
			await showAlert(t('schedule.availability.saved') || 'Dyspozycyjność została zapisana.')
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.availability.saveError') || 'Nie udało się zapisać dyspozycyjności.')
		}
	}

	const handleAutoGenerateMonth = async (e) => {
		e.preventDefault()

		const normalizedShifts = autoShiftRows
			.map((shift) => ({
				timeFrom: shift.timeFrom,
				timeTo: shift.timeTo,
				minEmployees: Number(shift.minEmployees),
				weekdays: Array.isArray(shift.weekdays) ? shift.weekdays : []
			}))
			.filter((shift) => shift.timeFrom && shift.timeTo && shift.minEmployees > 0)

		if (normalizedShifts.length === 0) {
			await showAlert(t('schedule.auto.atLeastOneShift') || 'Dodaj przynajmniej jedną poprawną zmianę.')
			return
		}

		const normalizedOverrides = autoDayOverrideRows
			.map((override) => ({
				date: override.date,
				timeFrom: override.timeFrom,
				timeTo: override.timeTo,
				minEmployees: Number(override.minEmployees)
			}))
			.filter((override) => override.date && override.timeFrom && override.timeTo && override.minEmployees > 0)

		const normalizedManualExclusions = autoManualExclusionRows
			.map((row) => ({
				userId: row.userId,
				date: row.date,
				timeFrom: row.timeFrom || null,
				timeTo: row.timeTo || null
			}))
			.filter((row) => row.userId && row.date)

		const hasInvalidManualTime = normalizedManualExclusions.some((row) =>
			(row.timeFrom && !row.timeTo) || (!row.timeFrom && row.timeTo)
		)
		if (hasInvalidManualTime) {
			await showAlert(t('schedule.auto.manualExclusionsTimeValidation') || 'W ręcznych wykluczeniach podaj oba pola czasu (od i do) albo zostaw oba puste.')
			return
		}

		try {
			const response = await autoGenerateMutation.mutateAsync({
				scheduleId,
				data: {
					year: Number(autoGenerateYear),
					month: Number(autoGenerateMonth),
					shifts: normalizedShifts,
					dayOverrides: normalizedOverrides,
					manualExclusions: normalizedManualExclusions,
					allowMultipleShiftsPerDay: autoAllowMultipleShiftsPerDay,
					notes: autoGenerateNotes,
					preferAvailability: autoPreferAvailability,
					strictAvailability: autoStrictAvailability
				}
			})

			const summary = response?.summary || {}
			await refetchEntries()
			setIsAutoGenerateModalOpen(false)
			await showAlert(
				`${t('schedule.auto.completed') || 'Auto-plan zakończony.'}\n` +
				`${t('schedule.auto.summary.generatedAsDraft') || 'Wpisy robocze do publikacji'}: ${summary.generatedEntries || 0}\n` +
				`${t('schedule.auto.summary.generatedEntries') || 'Dodane wpisy'}: ${summary.generatedEntries || 0}\n` +
				`${t('schedule.auto.summary.processedDays') || 'Przetworzone dni'}: ${summary.processedDays || 0}\n` +
				`${t('schedule.auto.summary.processedShifts') || 'Przetworzone zmiany'}: ${summary.processedShifts || 0}\n` +
				`${t('schedule.auto.summary.skippedWeekends') || 'Pominięte weekendy'}: ${summary.skippedWeekendDays || 0}\n` +
				`${t('schedule.auto.summary.skippedHolidays') || 'Pominięte święta'}: ${summary.skippedHolidayDays || 0}\n` +
				`${t('schedule.auto.summary.daysWithoutCoverage') || 'Dni bez pełnej obsady'}: ${summary.skippedNoCandidates || 0}`
			)
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.auto.generateError') || 'Nie udało się automatycznie wygenerować grafiku.')
		}
	}

	const handleAiDraftApply = async (draft) => {
		const normalizedShifts = (draft?.shifts || [])
			.map((shift) => ({
				timeFrom: shift.timeFrom,
				timeTo: shift.timeTo,
				minEmployees: Number(shift.minEmployees),
				weekdays: Array.isArray(shift.weekdays) ? shift.weekdays : []
			}))
			.filter((shift) => shift.timeFrom && shift.timeTo && shift.minEmployees > 0)

		if (normalizedShifts.length === 0) {
			await showAlert(t('schedule.auto.atLeastOneShift') || 'Dodaj przynajmniej jedną poprawną zmianę.')
			throw new Error('VALIDATION')
		}

		const normalizedOverrides = (draft?.dayOverrides || [])
			.map((override) => ({
				date: override.date,
				timeFrom: override.timeFrom,
				timeTo: override.timeTo,
				minEmployees: Number(override.minEmployees)
			}))
			.filter((override) => override.date && override.timeFrom && override.timeTo && override.minEmployees > 0)

		const normalizedManualExclusions = (draft?.manualExclusions || [])
			.map((row) => ({
				userId: row.userId,
				date: row.date,
				timeFrom: row.timeFrom || null,
				timeTo: row.timeTo || null
			}))
			.filter((row) => row.userId && row.date)

		const hasInvalidManualTime = normalizedManualExclusions.some((row) =>
			(row.timeFrom && !row.timeTo) || (!row.timeFrom && row.timeTo)
		)
		if (hasInvalidManualTime) {
			await showAlert(t('schedule.auto.manualExclusionsTimeValidation') || 'W ręcznych wykluczeniach podaj oba pola czasu (od i do) albo zostaw oba puste.')
			throw new Error('VALIDATION')
		}

		try {
			const response = await autoGenerateMutation.mutateAsync({
				scheduleId,
				data: {
					year: Number(autoGenerateYear),
					month: Number(autoGenerateMonth),
					shifts: normalizedShifts,
					dayOverrides: normalizedOverrides,
					manualExclusions: normalizedManualExclusions,
					allowMultipleShiftsPerDay: Boolean(draft.allowMultipleShiftsPerDay),
					notes: typeof draft.notes === 'string' ? draft.notes : '',
					preferAvailability: draft.preferAvailability !== false,
					strictAvailability: Boolean(draft.strictAvailability)
				}
			})

			const summary = response?.summary || {}
			await refetchEntries()
			setIsAutoGenerateModalOpen(false)
			setAutoFillUiMode('form')
			await showAlert(
				`${t('schedule.auto.completed') || 'Auto-plan zakończony.'}\n` +
				`${t('schedule.auto.summary.generatedAsDraft') || 'Wpisy robocze do publikacji'}: ${summary.generatedEntries || 0}\n` +
				`${t('schedule.auto.summary.generatedEntries') || 'Dodane wpisy'}: ${summary.generatedEntries || 0}\n` +
				`${t('schedule.auto.summary.processedDays') || 'Przetworzone dni'}: ${summary.processedDays || 0}\n` +
				`${t('schedule.auto.summary.processedShifts') || 'Przetworzone zmiany'}: ${summary.processedShifts || 0}\n` +
				`${t('schedule.auto.summary.skippedWeekends') || 'Pominięte weekendy'}: ${summary.skippedWeekendDays || 0}\n` +
				`${t('schedule.auto.summary.skippedHolidays') || 'Pominięte święta'}: ${summary.skippedHolidayDays || 0}\n` +
				`${t('schedule.auto.summary.daysWithoutCoverage') || 'Dni bez pełnej obsady'}: ${summary.skippedNoCandidates || 0}`
			)
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.auto.generateError') || 'Nie udało się automatycznie wygenerować grafiku.')
			throw error
		}
	}

	const handleAddShiftRow = () => {
		setAutoShiftRows((prev) => [...prev, createDefaultShiftRow()])
	}

	const handleRemoveShiftRow = (rowId) => {
		setAutoShiftRows((prev) => prev.filter((row) => row.id !== rowId))
	}

	const handleUpdateShiftRow = (rowId, field, value) => {
		setAutoShiftRows((prev) =>
			prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
		)
	}

	const handleToggleShiftWeekday = (rowId, weekdayValue) => {
		setAutoShiftRows((prev) =>
			prev.map((row) => {
				if (row.id !== rowId) return row
				const exists = row.weekdays.includes(weekdayValue)
				const nextWeekdays = exists
					? row.weekdays.filter((day) => day !== weekdayValue)
					: [...row.weekdays, weekdayValue]
				return { ...row, weekdays: nextWeekdays }
			})
		)
	}

	const handleAddOverrideRow = () => {
		setAutoDayOverrideRows((prev) => [...prev, createDefaultOverrideRow()])
	}

	const handleRemoveOverrideRow = (rowId) => {
		setAutoDayOverrideRows((prev) => prev.filter((row) => row.id !== rowId))
	}

	const handleUpdateOverrideRow = (rowId, field, value) => {
		setAutoDayOverrideRows((prev) =>
			prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
		)
	}

	const handleAddManualExclusionRow = () => {
		setAutoManualExclusionRows((prev) => [...prev, createDefaultManualExclusionRow()])
	}

	const handleRemoveManualExclusionRow = (rowId) => {
		setAutoManualExclusionRows((prev) => prev.filter((row) => row.id !== rowId))
	}

	const handleUpdateManualExclusionRow = (rowId, field, value) => {
		setAutoManualExclusionRows((prev) =>
			prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row))
		)
	}

	const handleAddAvailabilityWindow = () => {
		setAvailabilityTimeWindows((prev) => [...prev, createDefaultAvailabilityWindow()])
	}

	const handleRemoveAvailabilityWindow = (windowId) => {
		setAvailabilityTimeWindows((prev) => prev.filter((window) => window.id !== windowId))
	}

	const handleUpdateAvailabilityWindow = (windowId, field, value) => {
		setAvailabilityTimeWindows((prev) =>
			prev.map((window) => (window.id === windowId ? { ...window, [field]: value } : window))
		)
	}

	const handleClearMonthEntries = async () => {
		const confirmed = await showConfirm(
			`${t('schedule.auto.clearConfirm') || 'Wyczyścić wszystkie wpisy z'} ${capitalizeMonthName(i18n.resolvedLanguage, currentMonth)} ${currentYear}?`
		)
		if (!confirmed) return

		try {
			const response = await clearScheduleMonthMutation.mutateAsync({
				scheduleId,
				data: {
					year: currentYear,
					month: currentMonth + 1
				}
			})
			const summary = response?.summary || {}
			await refetchEntries()
			await showAlert(
				`${t('schedule.auto.clearDone') || 'Wyczyszczono miesiąc.'}\n` +
				`${t('schedule.auto.summary.removedEntries') || 'Usunięte wpisy'}: ${summary.removedEntries || 0}\n` +
				`${t('schedule.auto.summary.daysTouched') || 'Dni z usunięciami'}: ${summary.touchedDays || 0}`
			)
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.auto.clearError') || 'Nie udało się wyczyścić miesiąca.')
		}
	}

	const handlePublishMonthEntries = async () => {
		if (draftEntriesCountCurrentMonth <= 0) {
			await showAlert(t('schedule.auto.noDrafts') || 'Brak roboczych wpisów do publikacji.')
			return
		}

		const confirmed = await showConfirm(
			`${t('schedule.auto.publishConfirm') || 'Opublikować roboczy grafik z'} ${capitalizeMonthName(i18n.resolvedLanguage, currentMonth)} ${currentYear}?`
		)
		if (!confirmed) return

		try {
			const response = await publishScheduleMonthMutation.mutateAsync({
				scheduleId,
				data: {
					year: currentYear,
					month: currentMonth + 1
				}
			})
			const summary = response?.summary || {}
			await refetchEntries()
			await showAlert(
				`${t('schedule.auto.publishDone') || 'Opublikowano roboczy grafik.'}\n` +
				`${t('schedule.auto.summary.publishedEntries') || 'Opublikowane wpisy'}: ${summary.publishedEntries || 0}\n` +
				`${t('schedule.auto.summary.daysTouched') || 'Dni ze zmianami'}: ${summary.touchedDays || 0}`
			)
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.auto.publishError') || 'Nie udało się opublikować roboczego grafiku.')
		}
	}

	const handleRemoveAvailabilityForSelectedDate = async () => {
		if (!selectedDate) return
		const date = selectedDate.includes('T') ? selectedDate.split('T')[0] : selectedDate

		try {
			await deleteAvailabilityMutation.mutateAsync({ scheduleId, date })
			setAvailabilityNotes('')
			setAvailabilityTimeWindows([])
			await refetchEntries()
			await showAlert(t('schedule.availability.removed') || 'Dyspozycyjność dla tego dnia została usunięta.')
		} catch (error) {
			await showAlert(error.response?.data?.message || t('schedule.availability.removeError') || 'Nie udało się usunąć dyspozycyjności.')
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
		if (settings?.workOnWeekends === false && isWeekend(selectedDate)) {
			await showAlert(t('schedule.weekendEntryBlocked') || 'Nie można dodać wpisu w weekend, gdy zespół nie pracuje w weekendy.')
			return
		}
		const selectedDayKey = selectedDate.includes('T') ? selectedDate.split('T')[0] : selectedDate
		if (
			(settings?.includePolishHolidays || settings?.includeCustomHolidays) &&
			isHolidayDate(selectedDayKey, settings)
		) {
			await showAlert(t('schedule.holidayEntryBlocked') || 'Nie można dodać wpisu w dzień świąteczny wolny od pracy.')
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
					setTimeFrom(normalizeHalfHourTime(workHoursToUse.timeFrom))
					setTimeTo(normalizeHalfHourTime(workHoursToUse.timeTo))
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
		const props = eventInfo.event.extendedProps || {}
		if (props.type === 'holiday') {
			const holidayLabel = props.holidayName || eventInfo.event.title
			const holidayTextStyle = {
				flex: 1,
				whiteSpace: 'normal',
				wordBreak: 'break-word',
				fontWeight: 600,
				color: '#ffffff'
			}
			return (
				<div className="event-content schedule-calendar-holiday-event-content" title={holidayLabel}>
					<span style={holidayTextStyle}>{holidayLabel}</span>
				</div>
			)
		}
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
						className="calendar-month-select"
						style={{
							padding: '8px 12px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px'
						}}>
						{Array.from({ length: 12 }, (_, i) => (
							<option key={i} value={i}>
								{capitalizeMonthName(i18n.resolvedLanguage, i)}
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
					{canEdit && (
						<button
							type="button"
							onClick={openAutoGenerateModal}
							style={{
								padding: '8px 12px',
								border: '1px solid #0ea5e9',
								borderRadius: '6px',
								backgroundColor: '#f0f9ff',
								cursor: 'pointer',
								fontSize: '15px',
								fontWeight: '600',
								color: '#0369a1',
								transition: 'all 0.2s ease'
							}}
							onMouseOver={(e) => {
								e.target.style.backgroundColor = '#e0f2fe'
								e.target.style.borderColor = '#0284c7'
							}}
							onMouseOut={(e) => {
								e.target.style.backgroundColor = '#f0f9ff'
								e.target.style.borderColor = '#0ea5e9'
							}}
						>
							{t('schedule.auto.openButton') || 'Auto-uzupełnij miesiąc'}
						</button>
					)}
					{canEdit && (
						<button
							type="button"
							onClick={handlePublishMonthEntries}
							disabled={publishScheduleMonthMutation.isPending || draftEntriesCountCurrentMonth <= 0}
							style={{
								padding: '8px 12px',
								border: '1px solid #16a34a',
								borderRadius: '6px',
								backgroundColor: '#f0fdf4',
								cursor: publishScheduleMonthMutation.isPending || draftEntriesCountCurrentMonth <= 0 ? 'not-allowed' : 'pointer',
								fontSize: '15px',
								fontWeight: '600',
								color: '#15803d',
								transition: 'all 0.2s ease',
								opacity: publishScheduleMonthMutation.isPending || draftEntriesCountCurrentMonth <= 0 ? 0.7 : 1
							}}
						>
							{publishScheduleMonthMutation.isPending
								? (t('schedule.auto.publishing') || 'Publikowanie...')
								: `${t('schedule.auto.publishButton') || 'Opublikuj miesiąc'} (${draftEntriesCountCurrentMonth})`}
						</button>
					)}
					{canEdit && (
						<button
							type="button"
							onClick={handleClearMonthEntries}
							disabled={clearScheduleMonthMutation.isPending}
							style={{
								padding: '8px 12px',
								border: '1px solid #dc2626',
								borderRadius: '6px',
								backgroundColor: '#fff1f2',
								cursor: clearScheduleMonthMutation.isPending ? 'not-allowed' : 'pointer',
								fontSize: '15px',
								fontWeight: '600',
								color: '#b91c1c',
								transition: 'all 0.2s ease',
								opacity: clearScheduleMonthMutation.isPending ? 0.7 : 1
							}}
						>
							{clearScheduleMonthMutation.isPending
								? (t('schedule.auto.clearing') || 'Czyszczenie...')
								: (t('schedule.auto.clearButton') || 'Wyczyść miesiąc')}
						</button>
					)}

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
				{canEdit && draftEntriesCountCurrentMonth > 0 && (
					<div style={{
						marginTop: '10px',
						marginBottom: '10px',
						padding: '10px 12px',
						backgroundColor: '#fffbeb',
						border: '1px solid #fde68a',
						borderRadius: '8px',
						color: '#92400e',
						fontSize: '14px',
						fontWeight: '500'
					}}>
						{t('schedule.auto.draftInfo') || 'W tym miesiącu są robocze wpisy po auto-uzupełnieniu. Możesz je poprawić i opublikować przyciskiem "Opublikuj miesiąc".'}
					</div>
				)}

				{loadingEntries || loadingAllLeaveRequests || loadingAcceptedLeaveRequests ? (
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
							dayCellClassNames={(arg) => {
								if (!settings || (!settings.includePolishHolidays && !settings.includeCustomHolidays)) return []
								return isHolidayDate(arg.date, settings) ? ['schedule-calendar-holiday-cell'] : []
							}}
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
					isOpen={isAutoGenerateModalOpen}
					onRequestClose={() => setIsAutoGenerateModalOpen(false)}
					className="schedule-auto-modal"
					overlayClassName="schedule-auto-modal-overlay"
					contentLabel={t('schedule.auto.modalAriaLabel') || 'Auto-uzupełnij grafik'}
				>
					<div className="schedule-auto-modal__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
						<h3 className="schedule-auto-modal__title" style={{ margin: 0, color: '#0f172a', fontSize: '22px' }}>
							{t('schedule.auto.modalTitle') || 'Auto-uzupełnij miesiąc'}
						</h3>
						<button
							type="button"
							className="schedule-auto-modal__close"
							onClick={() => setIsAutoGenerateModalOpen(false)}
							style={{
								background: 'transparent',
								border: 'none',
								fontSize: '28px',
								cursor: 'pointer',
								color: '#64748b',
								lineHeight: '1'
							}}
						>
							×
						</button>
					</div>
					<p className="schedule-auto-modal__desc" style={{ marginTop: 0, marginBottom: '16px', color: '#64748b', fontSize: '14px' }}>
						{t('schedule.auto.modalDescription') || 'System uzupełni brakujące wpisy do minimum obsady na dzień, uwzględniając nieobecności i istniejące wpisy.'}
					</p>
					<div>
						<style>
							{`
								@keyframes scheduleAutoAiBorderFlow {
									0% { background-position: 0% 50%; }
									50% { background-position: 100% 50%; }
									100% { background-position: 0% 50%; }
								}
							`}
						</style>
						<div
							className="schedule-auto-modal__mode-tabs"
							style={{
								display: 'flex',
								gap: '8px',
								padding: '5px',
								marginBottom: '16px',
								background: 'linear-gradient(145deg, #f8fafc 0%, #eef2f7 100%)',
								borderRadius: '14px',
								border: '1px solid #e2e8f0',
								boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.75)',
							}}
						>
							<button
								type="button"
								className={`schedule-auto-modal__mode-btn${autoFillUiMode === 'form' ? ' is-active' : ''}`}
								onClick={() => setAutoFillUiMode('form')}
								style={{
									flex: 1,
									padding: '11px 14px',
									borderRadius: '11px',
									border: 'none',
									fontWeight: 700,
									fontSize: '14px',
									cursor: 'pointer',
									transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
									background: autoFillUiMode === 'form' ? '#ffffff' : 'transparent',
									color: autoFillUiMode === 'form' ? '#0f172a' : '#64748b',
									boxShadow: autoFillUiMode === 'form' ? '0 2px 10px rgba(15, 23, 42, 0.08)' : 'none',
								}}
							>
								{t('schedule.auto.ai.modeForm')}
							</button>
							{/* Asystent AI — animowany gradient na obwódce */}
							<div
								style={{
									flex: 1,
									borderRadius: '12px',
									padding: '2px',
									background:
										'linear-gradient(120deg, #6366f1, #22d3ee, #a855f7, #ec4899, #6366f1, #22d3ee)',
									backgroundSize: '320% 100%',
									boxShadow:
										autoFillUiMode === 'ai'
											? '0 4px 22px rgba(99, 102, 241, 0.45), 0 0 28px rgba(34, 211, 238, 0.2)'
											: '0 2px 14px rgba(99, 102, 241, 0.35)',
									animation: 'scheduleAutoAiBorderFlow 5s ease-in-out infinite',
								}}
							>
								<button
									type="button"
									className={`schedule-auto-modal__mode-ai-btn${autoFillUiMode === 'ai' ? ' is-active' : ''}`}
									onClick={() => setAutoFillUiMode('ai')}
									style={{
										width: '100%',
										padding: '9px 12px',
										borderRadius: '10px',
										border: 'none',
										fontWeight: 800,
										fontSize: '14px',
										cursor: 'pointer',
										transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
										background:
											autoFillUiMode === 'ai'
												? 'linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%)'
												: 'rgba(248, 250, 252, 0.96)',
										color: autoFillUiMode === 'ai' ? '#4338ca' : '#475569',
										boxShadow:
											autoFillUiMode === 'ai'
												? 'inset 0 1px 0 rgba(255,255,255,1), 0 1px 2px rgba(15,23,42,0.06)'
												: 'none',
										letterSpacing: '0.02em',
									}}
								>
									{t('schedule.auto.ai.modeAi')}
								</button>
							</div>
						</div>

						<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
							<div>
								<label className="schedule-auto-modal__field-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>
									{t('schedule.month') || 'Miesiąc'}
								</label>
								<select
									value={autoGenerateMonth}
									onChange={(e) => setAutoGenerateMonth(Number(e.target.value))}
									style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
								>
									{Array.from({ length: 12 }, (_, i) => i + 1).map((monthNumber) => (
										<option key={monthNumber} value={monthNumber}>
											{capitalizeMonthName(i18n.resolvedLanguage, monthNumber - 1)}
										</option>
									))}
								</select>
							</div>
							<div>
								<label className="schedule-auto-modal__field-label" style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>
									{t('schedule.year') || 'Rok'}
								</label>
								<input
									type="number"
									min={new Date().getFullYear() - 1}
									max={new Date().getFullYear() + 3}
									value={autoGenerateYear}
									onChange={(e) => setAutoGenerateYear(Number(e.target.value))}
									style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
								/>
							</div>
						</div>

						{autoFillUiMode === 'ai' && (
							<>
								<ScheduleAutoAiPanel
									key={`${autoGenerateYear}-${autoGenerateMonth}`}
									scheduleId={scheduleId}
									year={autoGenerateYear}
									month={autoGenerateMonth}
									onApply={handleAiDraftApply}
									busy={autoGenerateMutation.isPending}
									isAvailabilityEnabled={isAvailabilityEnabled}
									users={users}
								/>
								<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
									<button
										type="button"
										className="schedule-auto-modal__btn schedule-auto-modal__btn--secondary"
										onClick={() => setIsAutoGenerateModalOpen(false)}
										style={{
											padding: '10px 16px',
											border: '1px solid #cbd5e1',
											backgroundColor: '#fff',
											borderRadius: '6px',
											cursor: 'pointer',
											color: '#334155'
										}}
									>
										{t('schedule.cancel') || 'Anuluj'}
									</button>
								</div>
							</>
						)}

						{autoFillUiMode === 'form' && (
					<form onSubmit={handleAutoGenerateMonth}>
						<div className="schedule-auto-modal__section schedule-auto-modal__section--shifts" style={{ marginBottom: '12px', border: '1px solid #dbeafe', borderRadius: '10px', padding: '12px', backgroundColor: '#f8fbff' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
								<label className="schedule-auto-modal__section-title" style={{ marginBottom: 0, fontWeight: 600, color: '#334155' }}>
									{t('schedule.auto.shifts.title') || 'Zmiany (przedziały czasowe)'}
								</label>
								<button
									type="button"
									className="schedule-auto-modal__btn schedule-auto-modal__btn--add-info"
									onClick={handleAddShiftRow}
									style={{
										padding: '6px 10px',
										border: '1px solid #0284c7',
										backgroundColor: '#e0f2fe',
										borderRadius: '6px',
										color: '#0369a1',
										fontWeight: 600,
										cursor: 'pointer',
										maxWidth: '100%'
									}}
								>
									{t('schedule.auto.shifts.add') || '+ Dodaj zmianę'}
								</button>
							</div>
							{normalizedTeamWorkHoursList(settings?.workHours).length > 0 && (
								<div
									className="schedule-auto-modal__callout"
									style={{
										fontSize: '12px',
										color: '#0369a1',
										marginBottom: '10px',
										padding: '8px 10px',
										background: '#eff6ff',
										borderRadius: '8px',
										border: '1px solid #bae6fd',
										lineHeight: 1.45
									}}
								>
									{t('schedule.auto.shifts.fromTeamSettings')}
								</div>
							)}
							<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
								{autoShiftRows.map((shiftRow, index) => (
									<div key={shiftRow.id} className="schedule-auto-modal__card" style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px', backgroundColor: '#fff' }}>
										<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', alignItems: 'end' }}>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>Od</label>
												<input
													type="text"
													value={shiftRow.timeFrom}
													onChange={(e) => handleUpdateShiftRow(shiftRow.id, 'timeFrom', e.target.value)}
													placeholder="08:00"
													pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
													required
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>Do</label>
												<input
													type="text"
													value={shiftRow.timeTo}
													onChange={(e) => handleUpdateShiftRow(shiftRow.id, 'timeTo', e.target.value)}
													placeholder="16:00"
													pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
													required
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.auto.shifts.minPeople') || 'Min. osób'}
												</label>
												<input
													type="number"
													min={1}
													value={shiftRow.minEmployees}
													onChange={(e) => handleUpdateShiftRow(shiftRow.id, 'minEmployees', Number(e.target.value))}
													required
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<button
												type="button"
												className="schedule-auto-modal__btn schedule-auto-modal__btn--remove"
												onClick={() => handleRemoveShiftRow(shiftRow.id)}
												disabled={autoShiftRows.length <= 1}
												style={{
													padding: '8px 10px',
													border: '1px solid #fecaca',
													backgroundColor: '#fff1f2',
													borderRadius: '6px',
													color: '#b91c1c',
													cursor: autoShiftRows.length <= 1 ? 'not-allowed' : 'pointer',
													opacity: autoShiftRows.length <= 1 ? 0.6 : 1,
													minHeight: '36px',
													width: '100%'
												}}
											>
												{t('schedule.auto.remove') || 'Usuń'}
											</button>
										</div>
										<div style={{ marginTop: '8px' }}>
											<div className="schedule-auto-modal__hint" style={{ fontSize: '12px', color: '#64748b', marginBottom: '6px' }}>Dni tygodnia</div>
											<div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
												{weekdayOptions.map((weekday) => (
													<label key={`${shiftRow.id}-${weekday.value}`} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#334155' }}>
														<input
															type="checkbox"
															checked={shiftRow.weekdays.includes(weekday.value)}
															onChange={() => handleToggleShiftWeekday(shiftRow.id, weekday.value)}
														/>
														{weekday.label}
													</label>
												))}
											</div>
										</div>
										{index === 0 && (
											<div className="schedule-auto-modal__hint" style={{ marginTop: '6px', fontSize: '12px', color: '#64748b' }}>
												{t('schedule.auto.shifts.tip') || 'Wskazówka: możesz dodać np. zmianę poranną i popołudniową.'}
											</div>
										)}
									</div>
								))}
							</div>
						</div>

						<div className="schedule-auto-modal__section schedule-auto-modal__section--overrides" style={{ marginBottom: '12px', border: '1px solid #fde68a', borderRadius: '10px', padding: '12px', backgroundColor: '#fffbeb' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
								<label className="schedule-auto-modal__section-title" style={{ marginBottom: 0, fontWeight: 600, color: '#334155' }}>
									{t('schedule.auto.overrides.title') || 'Nadpisania konkretnych dni (opcjonalnie)'}
								</label>
								<button
									type="button"
									className="schedule-auto-modal__btn schedule-auto-modal__btn--add-warn"
									onClick={handleAddOverrideRow}
									style={{
										padding: '6px 10px',
										border: '1px solid #ca8a04',
										backgroundColor: '#fef3c7',
										borderRadius: '6px',
										color: '#92400e',
										fontWeight: 600,
										cursor: 'pointer',
										maxWidth: '100%'
									}}
								>
									{t('schedule.auto.overrides.add') || '+ Dodaj nadpisanie dnia'}
								</button>
							</div>
							{autoDayOverrideRows.length === 0 ? (
								<div className="schedule-auto-modal__empty" style={{ fontSize: '13px', color: '#78716c' }}>
									{t('schedule.auto.overrides.empty') || 'Brak nadpisań. Domyślnie zadziałają zmiany i dni tygodnia z sekcji wyżej.'}
								</div>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{autoDayOverrideRows.map((overrideRow) => (
										<div key={overrideRow.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', alignItems: 'end' }}>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.date') || 'Data'}
												</label>
												<input
													type="date"
													value={overrideRow.date}
													onChange={(e) => handleUpdateOverrideRow(overrideRow.id, 'date', e.target.value)}
													style={{ width: '80%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>Od</label>
												<input
													type="text"
													value={overrideRow.timeFrom}
													onChange={(e) => handleUpdateOverrideRow(overrideRow.id, 'timeFrom', e.target.value)}
													placeholder="08:00"
													pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>Do</label>
												<input
													type="text"
													value={overrideRow.timeTo}
													onChange={(e) => handleUpdateOverrideRow(overrideRow.id, 'timeTo', e.target.value)}
													placeholder="16:00"
													pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.minShort') || 'Min.'}
												</label>
												<input
													type="number"
													min={1}
													value={overrideRow.minEmployees}
													onChange={(e) => handleUpdateOverrideRow(overrideRow.id, 'minEmployees', Number(e.target.value))}
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<button
												type="button"
												className="schedule-auto-modal__btn schedule-auto-modal__btn--remove"
												onClick={() => handleRemoveOverrideRow(overrideRow.id)}
												style={{
													padding: '8px 10px',
													border: '1px solid #fecaca',
													backgroundColor: '#fff1f2',
													borderRadius: '6px',
													color: '#b91c1c',
													cursor: 'pointer',
													minHeight: '36px',
													width: '100%'
												}}
											>
												{t('schedule.auto.remove') || 'Usuń'}
											</button>
										</div>
									))}
								</div>
							)}
						</div>

						<div className="schedule-auto-modal__section schedule-auto-modal__section--exclusions" style={{ marginBottom: '12px', border: '1px solid #fecdd3', borderRadius: '10px', padding: '12px', backgroundColor: '#fff7f8' }}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
								<label className="schedule-auto-modal__section-title" style={{ marginBottom: 0, fontWeight: 600, color: '#334155' }}>
									{t('schedule.auto.manualExclusions.title') || 'Ręczne wykluczenia użytkowników (opcjonalnie)'}
								</label>
								<button
									type="button"
									className="schedule-auto-modal__btn schedule-auto-modal__btn--add-danger"
									onClick={handleAddManualExclusionRow}
									style={{
										padding: '6px 10px',
										border: '1px solid #be123c',
										backgroundColor: '#ffe4e6',
										borderRadius: '6px',
										color: '#9f1239',
										fontWeight: 600,
										cursor: 'pointer',
										maxWidth: '100%'
									}}
								>
									{t('schedule.auto.manualExclusions.add') || '+ Dodaj wykluczenie'}
								</button>
							</div>
							{autoManualExclusionRows.length === 0 ? (
								<div className="schedule-auto-modal__danger-text">
									{t('schedule.auto.manualExclusions.empty') || 'Brak wykluczeń. Planner uwzględni tylko standardowe reguły (urlopy, dyspozycyjność, zmiany).'}
								</div>
							) : (
								<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
									{autoManualExclusionRows.map((row) => (
										<div key={row.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', alignItems: 'end' }}>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.auto.manualExclusions.user') || 'Użytkownik'}
												</label>
												<select
													value={row.userId}
													onChange={(e) => handleUpdateManualExclusionRow(row.id, 'userId', e.target.value)}
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												>
													<option value="">{t('schedule.auto.manualExclusions.selectUser') || 'Wybierz użytkownika'}</option>
													{users.map((userOption) => (
														<option key={userOption._id} value={userOption._id}>
															{userOption.firstName} {userOption.lastName}
														</option>
													))}
												</select>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.date') || 'Data'}
												</label>
												<input
													type="date"
													value={row.date}
													onChange={(e) => handleUpdateManualExclusionRow(row.id, 'date', e.target.value)}
													style={{ width: '80%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.auto.manualExclusions.timeFromOptional') || 'Od (opc.)'}
												</label>
												<input
													type="text"
													value={row.timeFrom}
													onChange={(e) => handleUpdateManualExclusionRow(row.id, 'timeFrom', e.target.value)}
													placeholder="08:00"
													pattern="^$|^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<div>
												<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
													{t('schedule.auto.manualExclusions.timeToOptional') || 'Do (opc.)'}
												</label>
												<input
													type="text"
													value={row.timeTo}
													onChange={(e) => handleUpdateManualExclusionRow(row.id, 'timeTo', e.target.value)}
													placeholder="12:00"
													pattern="^$|^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
													style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
												/>
											</div>
											<button
												type="button"
												className="schedule-auto-modal__btn schedule-auto-modal__btn--remove"
												onClick={() => handleRemoveManualExclusionRow(row.id)}
												style={{
													padding: '8px 10px',
													border: '1px solid #fecaca',
													backgroundColor: '#fff1f2',
													borderRadius: '6px',
													color: '#b91c1c',
													cursor: 'pointer',
													minHeight: '36px',
													width: '100%'
												}}
											>
												{t('schedule.auto.remove') || 'Usuń'}
											</button>
										</div>
									))}
								</div>
							)}
							<div className="schedule-auto-modal__danger-text schedule-auto-modal__danger-text--hint">
								{t('schedule.auto.manualExclusions.emptyTimeHint') || 'Puste godziny oznaczają wykluczenie użytkownika przez cały dzień.'}
							</div>
						</div>

						<div style={{ marginBottom: '12px' }}>
							<label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, color: '#334155' }}>
								{t('schedule.auto.notesLabel') || 'Uwagi (dla wpisów auto)'}
							</label>
							<input
								type="text"
								value={autoGenerateNotes}
								onChange={(e) => setAutoGenerateNotes(e.target.value)}
								placeholder={t('schedule.auto.defaultNote') || 'Auto-plan'}
								style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
							/>
						</div>

						<div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
								<input
									type="checkbox"
									checked={autoAllowMultipleShiftsPerDay}
									onChange={(e) => setAutoAllowMultipleShiftsPerDay(e.target.checked)}
								/>
								<span style={{ fontSize: '14px', color: '#334155' }}>
									{t('schedule.auto.allowMultipleShiftsPerDay') || 'Pozwól tej samej osobie mieć więcej niż jedną zmianę dziennie'}
								</span>
							</label>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
								<input
									type="checkbox"
									checked={autoPreferAvailability}
									onChange={(e) => setAutoPreferAvailability(e.target.checked)}
									disabled={!isAvailabilityEnabled}
								/>
								<span style={{ fontSize: '14px', color: '#334155' }}>
									{t('schedule.auto.preferAvailability') || 'Priorytetowo uwzględnij zgłoszoną dyspozycyjność'}
								</span>
							</label>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: isAvailabilityEnabled ? 'pointer' : 'not-allowed' }}>
								<input
									type="checkbox"
									checked={autoStrictAvailability}
									onChange={(e) => setAutoStrictAvailability(e.target.checked)}
									disabled={!isAvailabilityEnabled || !autoPreferAvailability}
								/>
								<span style={{ fontSize: '14px', color: '#334155' }}>
									{t('schedule.auto.strictAvailability') || 'Tylko osoby dyspozycyjne (bez fallbacku)'}
								</span>
							</label>
						</div>

						<div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
							<button
								type="button"
								className="schedule-auto-modal__btn schedule-auto-modal__btn--secondary"
								onClick={() => setIsAutoGenerateModalOpen(false)}
								style={{
									padding: '10px 16px',
									border: '1px solid #cbd5e1',
									backgroundColor: '#fff',
									borderRadius: '6px',
									cursor: 'pointer',
									color: '#334155'
								}}
							>
								{t('schedule.cancel') || 'Anuluj'}
							</button>
							<button
								type="submit"
								className="schedule-auto-modal__btn schedule-auto-modal__btn--primary"
								disabled={autoGenerateMutation.isPending}
								style={{
									padding: '10px 16px',
									border: 'none',
									backgroundColor: '#0284c7',
									borderRadius: '6px',
									cursor: autoGenerateMutation.isPending ? 'not-allowed' : 'pointer',
									color: '#fff',
									fontWeight: 600,
									opacity: autoGenerateMutation.isPending ? 0.7 : 1
								}}
							>
								{autoGenerateMutation.isPending
									? (t('schedule.auto.generating') || 'Generowanie...')
									: (t('schedule.auto.generate') || 'Generuj')}
							</button>
						</div>
					</form>
						)}
					</div>
				</Modal>
				<Modal
					isOpen={isModalOpen}
					onRequestClose={() => {
						setIsModalOpen(false)
						setSelectedDate(null)
						setSelectedEntries([])
						setNotes('')
						setAvailabilityFromDate('')
						setAvailabilityToDate('')
						setAvailabilityNotes('')
						setAvailabilityTimeWindows([])
					}}
					className="schedule-entry-modal"
					overlayClassName="schedule-entry-modal-overlay"
					contentLabel={t('schedule.addEntry') || 'Dodaj wpis do grafiku'}>
				<>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
						{selectedDate && (
						<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
							<h2 className="text-xl font-semibold mb-4 text-gray-800" style={{ margin: 0 }}>
								{t('schedule.entriesForDate') || 'Wpisy dla daty'}: {new Date(selectedDate).toLocaleDateString(i18n.resolvedLanguage, { day: 'numeric', month: 'numeric', year: 'numeric' })}
							</h2>
							{isSelectedDateWeekendBlocked && (
								<div style={{
									display: 'inline-flex',
									alignItems: 'center',
									gap: '8px',
									padding: '6px 10px',
									borderRadius: '999px',
									backgroundColor: '#f1f5f9',
									border: '1px solid #cbd5e1',
									color: '#475569',
									fontSize: '13px',
									fontWeight: '600',
									width: 'fit-content'
								}}>
									<span style={{ fontSize: '14px' }}>⛔</span>
									{t('schedule.weekendBlockedBadge') || 'Weekend zablokowany (zespół nie pracuje w weekendy)'}
								</div>
							)}
							{isSelectedDateHolidayBlocked && (
								<div style={{
									display: 'inline-flex',
									alignItems: 'flex-start',
									gap: '8px',
									padding: '8px 12px',
									borderRadius: '10px',
									backgroundColor: '#ecfdf5',
									border: '1px solid rgba(0, 128, 0, 0.35)',
									color: '#006b32',
									fontSize: '13px',
									fontWeight: '600',
									width: '100%',
									maxWidth: '100%',
									boxSizing: 'border-box'
								}}>
									<span style={{ fontSize: '16px', lineHeight: 1.2, flexShrink: 0 }} aria-hidden>📅</span>
									<span style={{ minWidth: 0, wordBreak: 'break-word', lineHeight: 1.35 }}>
										{selectedDateHolidayInfo?.name || (t('schedule.holidayBlockedBadge') || 'Święto')}
										<span style={{ display: 'block', fontSize: '12px', fontWeight: '500', marginTop: '4px', color: '#a16207' }}>
											{t('schedule.holidayBlockedBadgeSub') || 'Dzień wolny od pracy (ustawienia zespołu)'}
										</span>
									</span>
								</div>
							)}
						</div>
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
								setAvailabilityFromDate('')
								setAvailabilityToDate('')
								setAvailabilityNotes('')
								setAvailabilityTimeWindows([])
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
					{isAvailabilityEnabled && (
					<div
						style={{
							marginBottom: '24px',
							padding: '16px',
							borderRadius: '10px',
							backgroundColor: '#f7fafc',
							border: '1px solid #e2e8f0'
						}}
					>
						<h3 style={{ margin: '0 0 10px 0', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
							{t('schedule.availability.title') || 'Moja dyspozycyjność'}
						</h3>
						<p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '14px' }}>
							{t('schedule.availability.description') || 'Zgłoś dni, w których możesz pracować. Osoba układająca grafik zobaczy to przy przypisaniu.'}
						</p>
						{isNonWorkingScheduleDayBlocked ? (
							<div style={{
								padding: '10px 12px',
								borderRadius: '8px',
								backgroundColor: '#f8fafc',
								border: '1px solid #e2e8f0',
								color: '#64748b',
								fontSize: '14px'
							}}>
								{t('schedule.availability.dayBlockedInfo') || 'Dla tego dnia nie można zgłosić dyspozycyjności ani dodać wpisu.'}
							</div>
						) : isManagerLikeRole && !showAvailabilityForm ? (
							<button
								type="button"
								onClick={() => setShowAvailabilityForm(true)}
								style={{
									padding: '10px 14px',
									backgroundColor: '#2563eb',
									color: '#fff',
									border: 'none',
									borderRadius: '6px',
									cursor: 'pointer',
									fontWeight: '500'
								}}
							>
								{t('schedule.availability.openForm') || 'Określ dyspozycyjność'}
							</button>
						) : (
						<form onSubmit={handleSaveAvailability} className="schedule-availability-form">
							<div className="schedule-availability-date-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
								<div>
									<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>
										{t('schedule.availability.dateFrom') || 'Od'}
									</label>
									<input
										type="date"
										value={availabilityFromDate}
										onChange={(e) => setAvailabilityFromDate(e.target.value)}
										required
										style={{ width: '80%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
									/>
								</div>
								<div>
									<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#334155' }}>
										{t('schedule.availability.dateTo') || 'Do'}
									</label>
									<input
										type="date"
										value={availabilityToDate}
										onChange={(e) => setAvailabilityToDate(e.target.value)}
										required
										style={{ width: '80%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
									/>
								</div>
							</div>
							<div style={{ marginBottom: '10px', border: '1px solid #dbeafe', borderRadius: '8px', padding: '10px', backgroundColor: '#f8fbff' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
									<label style={{ marginBottom: 0, fontWeight: '600', color: '#334155' }}>
										{t('schedule.availability.timeWindowsTitle') || 'Godziny dyspozycyjności (opcjonalnie)'}
									</label>
									<button
										type="button"
										onClick={handleAddAvailabilityWindow}
										className="schedule-availability-add-btn"
										style={{
											padding: '6px 10px',
											border: '1px solid #0284c7',
											backgroundColor: '#e0f2fe',
											borderRadius: '6px',
											color: '#0369a1',
											fontWeight: 600,
											cursor: 'pointer',
										}}
									>
										{t('schedule.availability.addTimeWindow') || '+ Dodaj przedział'}
									</button>
								</div>
								{availabilityTimeWindows.length === 0 ? (
									<div style={{ fontSize: '13px', color: '#64748b' }}>
										{t('schedule.availability.timeWindowsEmptyHint') || 'Brak przedziałów oznacza dyspozycyjność na cały dzień.'}
									</div>
								) : (
									<div className="schedule-availability-window-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
										{availabilityTimeWindows.map((window) => (
											<div key={window.id} className="schedule-availability-window-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'end' }}>
												<div className="schedule-availability-window-field">
													<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
														{t('schedule.timeFrom') || 'Od'}
													</label>
													<input
														type="text"
														value={window.timeFrom}
														onChange={(e) => handleUpdateAvailabilityWindow(window.id, 'timeFrom', e.target.value)}
														placeholder="08:00"
														pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
														style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
													/>
												</div>
												<div className="schedule-availability-window-field">
													<label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#334155' }}>
														{t('schedule.timeTo') || 'Do'}
													</label>
													<input
														type="text"
														value={window.timeTo}
														onChange={(e) => handleUpdateAvailabilityWindow(window.id, 'timeTo', e.target.value)}
														placeholder="16:00"
														pattern="^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
														style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
													/>
												</div>
												<button
													type="button"
													onClick={() => handleRemoveAvailabilityWindow(window.id)}
													className="schedule-availability-window-remove-btn"
													style={{
														padding: '8px 10px',
														border: '1px solid #fecaca',
														backgroundColor: '#fff1f2',
														borderRadius: '6px',
														color: '#b91c1c',
														cursor: 'pointer',
														minHeight: '36px'
													}}
												>
													{t('schedule.auto.remove') || 'Usuń'}
												</button>
											</div>
										))}
									</div>
								)}
							</div>
							<textarea
								value={availabilityNotes}
								onChange={(e) => setAvailabilityNotes(e.target.value)}
								placeholder={t('schedule.availability.notesPlaceholder') || 'Opcjonalna uwaga do dyspozycyjności...'}
								rows={2}
								style={{
									width: '100%',
									padding: '10px',
									border: '1px solid #cbd5e1',
									borderRadius: '6px',
									fontSize: '14px',
									marginBottom: '10px',
									resize: 'vertical'
								}}
							/>
							<div className="schedule-availability-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
								<button
									type="submit"
									disabled={upsertAvailabilityMutation.isPending}
									style={{
										padding: '10px 14px',
										backgroundColor: '#2563eb',
										color: '#fff',
										border: 'none',
										borderRadius: '6px',
										cursor: upsertAvailabilityMutation.isPending ? 'not-allowed' : 'pointer',
										opacity: upsertAvailabilityMutation.isPending ? 0.7 : 1
									}}
								>
									{t('schedule.availability.save') || 'Zapisz dyspozycyjność'}
								</button>
								{myAvailabilityForSelectedDate && (
									<button
										type="button"
										onClick={handleRemoveAvailabilityForSelectedDate}
										disabled={deleteAvailabilityMutation.isPending}
										style={{
											padding: '10px 14px',
											backgroundColor: '#fff',
											color: '#b91c1c',
											border: '1px solid #ef4444',
											borderRadius: '6px',
											cursor: deleteAvailabilityMutation.isPending ? 'not-allowed' : 'pointer',
											opacity: deleteAvailabilityMutation.isPending ? 0.7 : 1
										}}
									>
										{t('schedule.availability.removeForDay') || 'Usuń dyspozycyjność na ten dzień'}
									</button>
								)}
								{isManagerLikeRole && (
									<button
										type="button"
										onClick={() => setShowAvailabilityForm(false)}
										style={{
											padding: '10px 14px',
											backgroundColor: '#fff',
											color: '#334155',
											border: '1px solid #cbd5e1',
											borderRadius: '6px',
											cursor: 'pointer'
										}}
									>
										{t('schedule.availability.hideForm') || 'Ukryj formularz'}
									</button>
								)}
							</div>
						</form>
						)}
					</div>
					)}
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
												{entry.employeeName || (t('schedule.noName') || 'Brak nazwy')}
											</div>
											{entry?.isPublished === false && (
												<div style={{
													display: 'inline-block',
													fontSize: '12px',
													fontWeight: '700',
													color: '#92400e',
													backgroundColor: '#fef3c7',
													border: '1px solid #fcd34d',
													borderRadius: '9999px',
													padding: '2px 8px',
													marginBottom: '6px'
												}}>
													{t('schedule.auto.draftBadge') || 'ROBOCZY'}
												</div>
											)}
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
												{t('schedule.noPermissions') || 'Brak uprawnień'}
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

					{isNonWorkingScheduleDayBlocked && (
						<div style={{
							marginBottom: '16px',
							padding: '10px 12px',
							borderRadius: '8px',
							backgroundColor: isSelectedDateHolidayBlocked ? '#ecfdf5' : '#fff7ed',
							border: isSelectedDateHolidayBlocked ? '1px solid rgba(0, 128, 0, 0.35)' : '1px solid #fdba74',
							color: isSelectedDateHolidayBlocked ? '#006b32' : '#9a3412',
							fontSize: '14px'
						}}>
							{isSelectedDateWeekendBlocked
								? (t('schedule.weekendEntryBlocked') || 'Nie można dodać wpisu na weekend, gdy zespół nie pracuje w weekendy.')
								: (t('schedule.holidayEntryBlocked') || 'Nie można dodać wpisu w święto wolnym od pracy (ustawienia zespołu).')}
						</div>
					)}
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
								disabled={isNonWorkingScheduleDayBlocked}
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
							{filteredUsersForEntry.map((user) => (
								<option key={user._id} value={user._id}>
									{user.firstName} {user.lastName}
									{user.position ? ` - ${user.position}` : ''}
								</option>
							))}
						</select>
						{isAvailabilityEnabled && (
							<>
								<div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
									<label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
										<input
											type="checkbox"
											checked={showOnlyAvailableEmployees}
											onChange={(e) => setShowOnlyAvailableEmployees(e.target.checked)}
										/>
										<span style={{ fontSize: '14px', color: '#334155' }}>
											{t('schedule.availability.showOnlyAvailable') || 'Pokaż tylko osoby dyspozycyjne na ten dzień'}
										</span>
									</label>
								</div>
								{selectedDayAvailabilities.length > 0 ? (
									<div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#ecfeff', border: '1px solid #a5f3fc', borderRadius: '6px' }}>
										<div style={{ fontSize: '14px', color: '#0f172a', fontWeight: '600', marginBottom: '6px' }}>
											{(t('schedule.availability.availableCount') || 'Dyspozycyjni')} ({selectedDayAvailabilities.length})
										</div>
										<div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
											{selectedDayAvailabilities.map((availability, index) => (
												<div key={`${availability.employeeId}-${index}`} style={{ fontSize: '14px', color: '#334155' }}>
													<strong>{availability.employeeName}</strong>
													{` (${formatAvailabilityWindows(availability.timeWindows)})`}
													{availability.notes ? ` - ${availability.notes}` : ''}
												</div>
											))}
										</div>
									</div>
								) : (
									<div style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
										{t('schedule.availability.noneForDay') || 'Brak deklaracji dyspozycyjności na ten dzień.'}
									</div>
								)}
							</>
						)}
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
												setTimeFrom(normalizeHalfHourTime(workHours.timeFrom))
												setTimeTo(normalizeHalfHourTime(workHours.timeTo))
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
							<select
								value={timeFrom}
								onChange={(e) => {
									setTimeFrom(e.target.value)
									// Jeśli użytkownik ręcznie edytuje, odznacz wybór z checkboxów
									if (selectedWorkHoursIndex !== null) {
										setSelectedWorkHoursIndex(null)
									}
								}}
								required
								disabled={isNonWorkingScheduleDayBlocked}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							>
								<option value="">{t('schedule.selectOption') || t('settings.selectOption')}</option>
								{halfHourOptions.map(option => (
									<option key={`schedule-from-${option}`} value={option}>{option}</option>
								))}
							</select>
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
							<select
								value={timeTo}
								onChange={(e) => {
									setTimeTo(e.target.value)
									// Jeśli użytkownik ręcznie edytuje, odznacz wybór z checkboxów
									if (selectedWorkHoursIndex !== null) {
										setSelectedWorkHoursIndex(null)
									}
								}}
								required
								disabled={isNonWorkingScheduleDayBlocked}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							>
								<option value="">{t('schedule.selectOption') || t('settings.selectOption')}</option>
								{halfHourOptions.map(option => (
									<option key={`schedule-to-${option}`} value={option}>{option}</option>
								))}
							</select>
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
							disabled={isNonWorkingScheduleDayBlocked}
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
							className="schedule-entry-modal__btn-cancel"
						onClick={() => {
							setIsModalOpen(false)
							setSelectedDate(null)
							setSelectedEntries([])
							setNotes('')
							setAvailabilityFromDate('')
							setAvailabilityToDate('')
							setAvailabilityNotes('')
							setAvailabilityTimeWindows([])
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
							className="schedule-entry-modal__btn-submit"
							disabled={isNonWorkingScheduleDayBlocked}
							style={{
								padding: '12px 24px',
								backgroundColor: '#27ae60',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								fontSize: '16px',
								fontWeight: '500',
								cursor: isNonWorkingScheduleDayBlocked ? 'not-allowed' : 'pointer',
								opacity: isNonWorkingScheduleDayBlocked ? 0.6 : 1
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

