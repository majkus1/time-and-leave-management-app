import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useQuery } from '@tanstack/react-query'
import { useAllLeaveRequests } from '../../hooks/useLeaveRequests'
import { usePendingLeaveRequestsSummary } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import Modal from 'react-modal'
import { useDepartments } from '../../hooks/useDepartments'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import axios from 'axios'
import { API_URL } from '../../config.js'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'
import { buildPdfDocument, downloadPdf } from '../../utils/export/pdfDownload'
import { PDF_REPORT_THEME } from '../../utils/export/pdfReportTheme'
import { exportExcelButtonStyle, exportPdfButtonStyle } from '../../utils/export/exportButtonStyles'
import {
	LEAVE_REQUEST_STATUS_KEYS,
	countLeaveRequestDaysInPeriod,
	getLeaveRequestDurationStats,
	getLeaveRequestStatusStats,
	getLeaveRequestTypeStats,
} from '../../utils/leaveRequestPeriod'
import { buildReportFilename } from '../../utils/export/reportFilename'

/** Domyślne filtry statusów (jak wcześniej: oczekujące, zaakceptowane, wysłane/L4). */
const DEFAULT_STATUS_FILTERS = {
	pending: true,
	accepted: true,
	sent: true,
	rejected: false,
}

/** Mapuje status z API na klucz filtra. */
function normalizeLeaveStatus(status) {
	if (status == null || status === '') return null
	const s = String(status).toLowerCase().trim()
	if (s === 'pending' || s.endsWith('.pending')) return 'pending'
	if (s === 'accepted' || s.endsWith('.accepted')) return 'accepted'
	if (s === 'sent' || s.endsWith('.sent')) return 'sent'
	if (s === 'rejected' || s.endsWith('.rejected')) return 'rejected'
	if (s === 'cancelled' || s.endsWith('.cancelled')) return 'cancelled'
	return null
}

const STATUS_FILTER_KEYS = ['pending', 'accepted', 'sent', 'rejected']
const REPORT_STATUS_KEYS = LEAVE_REQUEST_STATUS_KEYS

const LEGACY_LEAVE_FORM_OPTION_IDS = [
	'leaveform.option1',
	'leaveform.option2',
	'leaveform.option3',
	'leaveform.option4',
	'leaveform.option5',
	'leaveform.option6',
]

function getRequestUserIdString(request) {
	if (!request?.userId) return null
	if (typeof request.userId === 'object' && request.userId !== null) {
		if (request.userId._id) return request.userId._id.toString()
		if (request.userId.toString) return request.userId.toString()
		return null
	}
	if (typeof request.userId === 'string') return request.userId
	return null
}

function userIdString(id) {
	if (!id) return ''
	if (typeof id === 'object' && id._id) return id._id.toString()
	return String(id)
}

function requestOverlapsVisiblePeriod(request, calendarView, currentYear, currentMonth) {
	if (!request?.startDate || !request.endDate) return false
	const s = new Date(request.startDate)
	const e = new Date(request.endDate)
	const rangeStart =
		calendarView === 'single' ? new Date(currentYear, currentMonth, 1) : new Date(currentYear, 0, 1)
	const rangeEnd =
		calendarView === 'single'
			? new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999)
			: new Date(currentYear, 11, 31, 23, 59, 59, 999)
	return s <= rangeEnd && e >= rangeStart
}

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
	const [calendarView, setCalendarView] = useState('single') // 'single' lub 'all-months'
	const [statusFilters, setStatusFilters] = useState(() => ({ ...DEFAULT_STATUS_FILTERS }))
	const [typeFilters, setTypeFilters] = useState({})

	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const isSupervisorRole = isSupervisor(role)
	const isSupervisorOnly = isSupervisorRole && !isAdminRole && !isHRRole
	const canFilter = isAdminRole || isHRRole || isSupervisorOnly

	const { data: supervisorConfig } = useSupervisorConfig(userId, isSupervisorOnly)
	const canApproveLeaves = isAdminRole || isHRRole 
		? true 
		: (isSupervisorRole && (supervisorConfig?.permissions?.canApproveLeaves !== false))

	// TanStack Query hooks
	const { data: users = [], isLoading: loadingUsers, error: usersError } = useQuery({
		queryKey: ['leave', 'visible-users'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leaveworks/visible-users`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
	const { data: allLeaveRequests = [], isLoading: loadingRequests, error: requestsError } = useAllLeaveRequests()
	const { data: pendingSummary } = usePendingLeaveRequestsSummary({
		enabled: isAdminRole || isHRRole || (isSupervisorRole && canApproveLeaves),
	})
	const { data: settings } = useSettings()
	const { data: departments = [] } = useDepartments(teamId)
	const pendingByUser = pendingSummary?.pendingByUser || {}

	const priorityEmployeeIds = useMemo(() => {
		const raw = supervisorConfig?.selectedEmployees || []
		return new Set(raw.map((id) => userIdString(id)))
	}, [supervisorConfig])

	const filterableDepartments = useMemo(() => {
		if (!isSupervisorOnly) return departments
		const namesFromUsers = new Set()
		for (const user of users) {
			if (!Array.isArray(user.department)) continue
			for (const dept of user.department) {
				if (dept) namesFromUsers.add(dept)
			}
		}
		return departments.filter((dept) => {
			const deptName = typeof dept === 'object' ? dept.name : dept
			return namesFromUsers.has(deptName)
		})
	}, [departments, users, isSupervisorOnly])

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

	// Pobierz święta dla całego roku (dla widoku wszystkich miesięcy)
	const holidaysForYear = useMemo(() => {
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
			return availableUsers.filter((user) => {
				if (isSupervisorOnly && priorityEmployeeIds.has(userIdString(user._id))) {
					return true
				}
				if (!user.department || !Array.isArray(user.department)) return false
				return user.department.some((dept) => selectedDepartments.includes(dept))
			})
		}

		return availableUsers
	}, [users, showAllTeam, selectedDepartments, selectedUserIds, isSupervisorOnly, priorityEmployeeIds])

	const filteredUserIdSet = useMemo(
		() => new Set(filteredUsers.map((u) => (u?._id ? u._id.toString() : null)).filter(Boolean)),
		[filteredUsers]
	)

	// Typy wniosków: ustawienia zespołu + legacy + występujące w danych
	const allLeaveTypeIds = useMemo(() => {
		const ids = new Set()
		LEGACY_LEAVE_FORM_OPTION_IDS.forEach((id) => ids.add(id))
		if (settings?.leaveRequestTypes?.length) {
			settings.leaveRequestTypes
				.filter((x) => x && x.enabled !== false && x.id)
				.forEach((x) => ids.add(x.id))
		}
		allLeaveRequests.forEach((r) => {
			if (r?.type) ids.add(r.type)
		})
		return Array.from(ids).sort((a, b) => a.localeCompare(b))
	}, [settings, allLeaveRequests])

	useEffect(() => {
		setTypeFilters((prev) => {
			const next = { ...prev }
			allLeaveTypeIds.forEach((id) => {
				if (next[id] === undefined) next[id] = true
			})
			Object.keys(next).forEach((k) => {
				if (!allLeaveTypeIds.includes(k)) delete next[k]
			})
			return next
		})
	}, [allLeaveTypeIds])

	const requestMatchesLeaveListFilters = useCallback(
		(request) => {
			if (!request?.startDate || !request.endDate) return false
			const norm = normalizeLeaveStatus(request.status)
			if (norm === 'cancelled') return false
			if (!norm || !statusFilters[norm]) return false
			const typeId = request.type
			if (typeId && typeFilters[typeId] === false) return false
			const uid = getRequestUserIdString(request)
			if (!uid) return false
			return filteredUserIdSet.has(uid)
		},
		[filteredUserIdSet, statusFilters, typeFilters]
	)

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

	// Wnioski urlopowe dla kalendarza (status, typ, użytkownicy — zgodnie z filtrami)
	const leaveRequestEventsForYear = useMemo(() => {
		if (!allLeaveRequests || allLeaveRequests.length === 0) {
			return []
		}

		return allLeaveRequests
			.filter(requestMatchesLeaveListFilters)
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
				const isPendingRequest = request.status === 'status.pending' || request.status === 'pending'
				const pendingTitleSuffix = isPendingRequest
					? (i18n.resolvedLanguage === 'pl' ? ' - oczekuje na akceptację' : ' - pending approval')
					: ''
				
				// Użyj koloru przypisanego do pracownika (tak jak w /all-leave-plans)
				const userColor = getColorForUser(employeeName)
				
				return dates
					.filter(date => {
						const dateObj = new Date(date)
						return dateObj.getFullYear() === currentYear
					})
					.map(date => ({
						title: `${employeeName} (${leaveTypeName})${pendingTitleSuffix}`,
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
	}, [
		allLeaveRequests,
		filteredUsers,
		currentYear,
		settings,
		t,
		i18n.resolvedLanguage,
		getColorForUser,
		requestMatchesLeaveListFilters,
	])

	const allLeaveRequestsForMonth = useMemo(() => {
		return leaveRequestEventsForYear.filter(event => {
			const eventDate = new Date(event.start)
			return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
		})
	}, [leaveRequestEventsForYear, currentMonth, currentYear])

	const resolveEmployeeNameForRequest = useCallback(
		(request) => {
			if (
				typeof request.userId === 'object' &&
				request.userId !== null &&
				request.userId.firstName &&
				request.userId.lastName
			) {
				return `${request.userId.firstName} ${request.userId.lastName}`
			}
			const uid = getRequestUserIdString(request)
			const user = filteredUsers.find((u) => u._id?.toString() === uid)
			return user ? `${user.firstName} ${user.lastName}` : '—'
		},
		[filteredUsers]
	)

	const filteredRequestsForTable = useMemo(() => {
		if (!allLeaveRequests?.length) return []
		return allLeaveRequests
			.filter((request) => {
				if (!requestMatchesLeaveListFilters(request)) return false
				return requestOverlapsVisiblePeriod(request, calendarView, currentYear, currentMonth)
			})
			.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
	}, [allLeaveRequests, requestMatchesLeaveListFilters, calendarView, currentYear, currentMonth])

	const formatRequestDateRange = (request) => {
		const a = new Date(request.startDate)
		const b = new Date(request.endDate)
		const opts = { day: '2-digit', month: '2-digit', year: 'numeric' }
		return `${a.toLocaleDateString(i18n.resolvedLanguage, opts)} – ${b.toLocaleDateString(i18n.resolvedLanguage, opts)}`
	}

	const renderAllMonthsCalendars = () => {
		return Array.from({ length: 12 }, (_, month) => (
			<div key={`${currentYear}-${month}`} className="month-calendar allleaveplans all-leaveplans-all-months" style={{ margin: '10px', border: '1px solid #ddd' }}>
				<FullCalendar
					plugins={[dayGridPlugin]}
					initialView="dayGridMonth"
					initialDate={new Date(currentYear, month, 1)}
					locale={i18n.resolvedLanguage}
					height="auto"
					firstDay={1}
					showNonCurrentDates={false}
					headerToolbar={{
						left: '',
						center: 'title',
						right: '',
					}}
					events={[
						...leaveRequestEventsForYear.filter(event => {
							const eventDate = new Date(event.start)
							return eventDate.getMonth() === month && eventDate.getFullYear() === currentYear
						}),
						...holidaysForYear
							.filter(holiday => {
								const holidayDate = new Date(holiday.date)
								return holidayDate.getMonth() === month && holidayDate.getFullYear() === currentYear
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
									holidayName: holiday.name,
								},
							})),
					]}
				/>
			</div>
		))
	}

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
		setStatusFilters({ ...DEFAULT_STATUS_FILTERS })
		setTypeFilters(() => Object.fromEntries(allLeaveTypeIds.map((id) => [id, true])))
	}

	const handleToggleStatusFilter = (key) => {
		setStatusFilters((prev) => ({
			...prev,
			[key]: !prev[key],
		}))
	}

	const handleToggleTypeFilter = (typeId) => {
		setTypeFilters((prev) => ({
			...prev,
			[typeId]: !prev[typeId],
		}))
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
		navigate(`/leave-requests/${userId}`)
	}

	const exportPeriodLabel = useMemo(() => {
		if (calendarView === 'single') {
			const raw = new Date(currentYear, currentMonth).toLocaleDateString(i18n.resolvedLanguage, {
				month: 'long',
				year: 'numeric',
			})
			return raw.charAt(0).toUpperCase() + raw.slice(1)
		}
		return String(currentYear)
	}, [calendarView, currentYear, currentMonth, i18n.resolvedLanguage])

	const exportSelectedMonth = calendarView === 'single' ? currentMonth : 'all'
	const exportDurationUnit = settings?.leaveCalculationMode === 'hours' ? 'godz.' : 'dni'
	const exportDurationMultiplier = settings?.leaveCalculationMode === 'hours'
		? Number(settings?.leaveHoursPerDay) || 8
		: 1
	const formatReportNumber = (value, digits = 1) => (
		new Intl.NumberFormat(i18n.resolvedLanguage, { maximumFractionDigits: digits }).format(Number(value) || 0)
	)
	const formatReportDate = (value) => {
		const date = new Date(value)
		if (Number.isNaN(date.getTime())) return '-'
		return date.toLocaleDateString(i18n.resolvedLanguage, { day: '2-digit', month: '2-digit', year: 'numeric' })
	}
	const formatReportMonthName = (month) => {
		const name = new Date(Date.UTC(2020, month, 1)).toLocaleString(i18n.resolvedLanguage, {
			month: 'long',
			timeZone: 'UTC',
		})
		return name.charAt(0).toUpperCase() + name.slice(1)
	}
	const getActiveStatusKeysForReport = () => (
		REPORT_STATUS_KEYS.filter(status => statusFilters[status] !== false)
	)
	const getReportStatusLabel = (status) => {
		const info = getStatusInfo(`status.${status}`)
		return info.text || status
	}
	const getRequestDurationForReport = (request, month = exportSelectedMonth) => (
		countLeaveRequestDaysInPeriod(request, currentYear, month, settings) * exportDurationMultiplier
	)
	const getReportRequestRows = () => {
		return filteredRequestsForTable.map((request) => {
			const norm = normalizeLeaveStatus(request.status)
			const statusLabel = norm
				? getStatusInfo(`status.${norm}`).text
				: getStatusInfo(request.status).text
			return {
				employee: resolveEmployeeNameForRequest(request),
				dateRange: formatRequestDateRange(request),
				startDate: request.startDate,
				endDate: request.endDate,
				type: getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage),
				statusKey: norm,
				status: statusLabel,
				duration: getRequestDurationForReport(request),
				replacement: request.replacement || request.substitute || 'Brak',
				additionalInfo: request.additionalInfo || request.note || request.comment || 'Brak',
			}
		})
	}

	const getLeaveReportData = () => {
		const activeStatusKeys = getActiveStatusKeysForReport()
		const requestRows = getReportRequestRows()
		const statusStats = getLeaveRequestStatusStats(filteredRequestsForTable)
		const durationStats = getLeaveRequestDurationStats(filteredRequestsForTable, currentYear, exportSelectedMonth, settings)
		const typeStats = getLeaveRequestTypeStats(filteredRequestsForTable, currentYear, exportSelectedMonth, settings)
		const employeeMap = new Map()

		for (const request of filteredRequestsForTable) {
			const employee = resolveEmployeeNameForRequest(request)
			const status = normalizeLeaveStatus(request.status)
			const duration = getRequestDurationForReport(request)
			const current = employeeMap.get(employee) || {
				employee,
				requests: 0,
				total: 0,
				accepted: 0,
				pending: 0,
				rejected: 0,
				sent: 0,
			}
			current.requests += 1
			current.total += duration
			if (status) current[status] += duration
			employeeMap.set(employee, current)
		}

		const employeeStats = [...employeeMap.values()].sort((a, b) => b.total - a.total || b.requests - a.requests)
		const monthlySummaryRows = calendarView === 'all-months'
			? Array.from({ length: 12 }, (_, month) => {
				const totals = {
					month,
					requests: 0,
					total: 0,
					accepted: 0,
					pending: 0,
					rejected: 0,
					sent: 0,
				}
				for (const request of filteredRequestsForTable) {
					const duration = getRequestDurationForReport(request, month)
					if (!duration) continue
					const status = normalizeLeaveStatus(request.status)
					totals.requests += 1
					totals.total += duration
					if (status) totals[status] += duration
				}
				return totals
			})
			: []
		const topEmployee = employeeStats.find(row => row.total > 0) || employeeStats[0]
		const topType = typeStats.find(row => row.duration > 0) || typeStats[0]
		const topMonth = monthlySummaryRows.length
			? monthlySummaryRows.reduce((best, row) => row.total > best.total ? row : best, monthlySummaryRows[0])
			: null
		const statusLabel = activeStatusKeys.length === REPORT_STATUS_KEYS.length
			? 'Wszystkie statusy'
			: activeStatusKeys.map(getReportStatusLabel).join(', ')

		return {
			activeStatusKeys,
			requestRows,
			statusStats,
			durationStats,
			typeStats,
			employeeStats,
			monthlySummaryRows,
			topEmployee,
			topType,
			topMonth,
			statusLabel,
		}
	}

	const exportFileNameBase = () => {
		return buildReportFilename({
			locale: i18n.resolvedLanguage,
			pl: 'raport-urlopy-zespolu',
			en: 'team-leave-report',
			parts: [exportPeriodLabel],
		})
	}

	const handleExportExcel = async () => {
		if (filteredRequestsForTable.length === 0) {
			window.alert(t('planslist.exportEmpty') || 'Brak danych do eksportu.')
			return
		}
		try {
			const report = getLeaveReportData()
			const typeRows = report.typeStats.map(row => [
				getLeaveRequestTypeName(settings, row.type, t, i18n.resolvedLanguage),
				row.requests,
				row.duration,
				row.accepted,
				row.pending,
				row.rejected,
				row.sent,
			])
			const employeeRows = report.employeeStats.map(row => [
				row.employee,
				row.requests,
				row.total,
				row.accepted,
				row.pending,
				row.rejected,
				row.sent,
			])
			const requestRows = report.requestRows.map(row => [
				row.employee,
				formatReportDate(row.startDate),
				formatReportDate(row.endDate),
				row.type,
				row.status,
				row.duration,
				row.replacement,
				row.additionalInfo,
			])
			await downloadExcelWorkbook(
				[
					{
						name: 'Podsumowanie',
						title: 'Raport urlopów i nieobecności',
						subtitle: `Okres: ${exportPeriodLabel}`,
						executive: true,
						colWidths: [24, 26, 18, 18],
						rows: [
							['Obszar', 'Wskaźnik', 'Wartość', 'Jednostka'],
							['Metadane', 'Okres', exportPeriodLabel, ''],
							['Metadane', 'Statusy', report.statusLabel, ''],
							['KPI', 'Wnioski łącznie', report.statusStats.total, 'wnioski'],
							...report.activeStatusKeys.map(status => ['KPI', getReportStatusLabel(status), report.statusStats[status], 'wnioski']),
							['Czas', 'Łącznie', report.durationStats.total, exportDurationUnit],
							...report.activeStatusKeys.map(status => ['Czas', getReportStatusLabel(status), report.durationStats[status], exportDurationUnit]),
							...(report.topEmployee ? [['Pracownicy', 'Największa liczba dni/godzin', report.topEmployee.employee, `${formatReportNumber(report.topEmployee.total)} ${exportDurationUnit}`]] : []),
							...(report.topType ? [['Typy urlopów', 'Najczęstszy typ wg czasu', getLeaveRequestTypeName(settings, report.topType.type, t, i18n.resolvedLanguage), `${formatReportNumber(report.topType.duration)} ${exportDurationUnit}`]] : []),
							...(report.topMonth?.total > 0 ? [['Miesiące', 'Największe obciążenie', formatReportMonthName(report.topMonth.month), `${formatReportNumber(report.topMonth.total)} ${exportDurationUnit}`]] : []),
						],
					},
					...(calendarView === 'all-months' ? [{
						name: 'Miesiące',
						title: `Podsumowanie miesięczne - ${exportPeriodLabel}`,
						subtitle: `Statusy: ${report.statusLabel}`,
						colWidths: [18, 12, 18, ...report.activeStatusKeys.map(() => 18)],
						rows: [
							[
								'Miesiąc',
								'Wnioski',
								`Łącznie (${exportDurationUnit})`,
								...report.activeStatusKeys.map(status => `${getReportStatusLabel(status)} (${exportDurationUnit})`),
							],
							...report.monthlySummaryRows.map(row => [
								formatReportMonthName(row.month),
								row.requests,
								row.total,
								...report.activeStatusKeys.map(status => row[status] || 0),
							]),
						],
					}] : []),
					{
						name: 'Pracownicy',
						title: `Urlopy według pracowników - ${exportPeriodLabel}`,
						subtitle: 'Kto i w jakim wymiarze ma nieobecności w wybranym okresie.',
						colWidths: [30, 12, 18, 18, 18, 18, 18],
						rows: [
							['Pracownik', 'Wnioski', `Łącznie (${exportDurationUnit})`, `Zaakceptowane (${exportDurationUnit})`, `Oczekujące (${exportDurationUnit})`, `Odrzucone (${exportDurationUnit})`, `Wysłane (${exportDurationUnit})`],
							...employeeRows,
						],
					},
					{
						name: 'Typy urlopów',
						title: `Urlopy według typu - ${exportPeriodLabel}`,
						subtitle: 'Struktura typów nieobecności i ich wpływ na dostępność zespołu.',
						colWidths: [34, 12, 18, 18, 18, 18, 18],
						rows: [
							['Typ', 'Wnioski', `Łącznie (${exportDurationUnit})`, `Zaakceptowane (${exportDurationUnit})`, `Oczekujące (${exportDurationUnit})`, `Odrzucone (${exportDurationUnit})`, `Wysłane (${exportDurationUnit})`],
							...typeRows,
						],
					},
					{
						name: 'Wnioski',
						title: `Lista wniosków - ${exportPeriodLabel}`,
						subtitle: 'Konkretne terminy i statusy zgodne z aktualnym widokiem.',
						colWidths: [28, 13, 13, 30, 18, 14, 22, 32],
						rows: [
							['Pracownik', 'Data od', 'Data do', 'Typ', 'Status', exportDurationUnit, 'Zastępstwo', 'Uwagi'],
							...requestRows,
						],
					},
				],
				buildReportFilename({
					locale: i18n.resolvedLanguage,
					pl: 'raport-urlopy-zespolu',
					en: 'team-leave-report',
					parts: [exportPeriodLabel],
					extension: 'xlsx',
				})
			)
		} catch (e) {
			console.error('handleExportExcel:', e)
		}
	}

	const handleExportPdf = async () => {
		if (filteredRequestsForTable.length === 0) {
			window.alert(t('planslist.exportEmpty') || 'Brak danych do eksportu.')
			return
		}
		try {
			const report = getLeaveReportData()
			const theme = PDF_REPORT_THEME
			const statusColors = {
				accepted: theme.green,
				pending: theme.amber,
				rejected: theme.red,
				sent: theme.purple,
			}
			const tableLayout = {
				hLineColor: () => theme.line,
				vLineColor: () => theme.line,
				fillColor: rowIndex => rowIndex === 0 ? theme.navy : (rowIndex % 2 === 0 ? theme.softRow : null),
			}
			const kpiCards = [
				{ label: 'Wnioski łącznie', value: report.statusStats.total, sub: `${formatReportNumber(report.durationStats.total)} ${exportDurationUnit}`, color: theme.navy },
				...report.activeStatusKeys.map(status => ({
					label: getReportStatusLabel(status),
					value: report.statusStats[status],
					sub: `${formatReportNumber(report.durationStats[status])} ${exportDurationUnit}`,
					color: statusColors[status] || theme.blue,
				})),
			]
			const maxTypeDuration = Math.max(...report.typeStats.map(row => row.duration), 0)
			const maxEmployeeDuration = Math.max(...report.employeeStats.map(row => row.total), 0)
			const maxMonthDuration = Math.max(...report.monthlySummaryRows.map(row => row.total), 0)
			const insightLines = [
				`Łącznie w wybranym okresie: ${report.statusStats.total} wniosków na ${formatReportNumber(report.durationStats.total)} ${exportDurationUnit}.`,
			]
			if (report.durationStats.accepted > 0) {
				insightLines.push(`Zaakceptowane nieobecności obejmują ${formatReportNumber(report.durationStats.accepted)} ${exportDurationUnit}.`)
			}
			if (report.statusStats.pending > 0) {
				insightLines.push(`Do decyzji pozostaje ${report.statusStats.pending} wniosków na ${formatReportNumber(report.durationStats.pending)} ${exportDurationUnit}.`)
			}
			if (report.topEmployee?.total > 0) {
				insightLines.push(`Największe obciążenie po stronie pracownika: ${report.topEmployee.employee} (${formatReportNumber(report.topEmployee.total)} ${exportDurationUnit}).`)
			}
			if (report.topType?.duration > 0) {
				insightLines.push(`Największy udział typu: ${getLeaveRequestTypeName(settings, report.topType.type, t, i18n.resolvedLanguage)} (${formatReportNumber(report.topType.duration)} ${exportDurationUnit}).`)
			}
			if (report.topMonth?.total > 0) {
				insightLines.push(`Najbardziej obciążony miesiąc: ${formatReportMonthName(report.topMonth.month)} (${formatReportNumber(report.topMonth.total)} ${exportDurationUnit}).`)
			}
			const content = [
				{
					table: {
						widths: ['*', 190],
						body: [[
							{
								stack: [
									{ text: 'PLANOPIA · RAPORT URLOPÓW I NIEOBECNOŚCI', fontSize: 8, bold: true, color: theme.headerEyebrow, characterSpacing: 1 },
									{ text: 'Urlopy zespołu', fontSize: 22, bold: true, color: theme.white, margin: [0, 6, 0, 0] },
									{ text: `Okres: ${exportPeriodLabel}`, fontSize: 11, color: theme.headerSubtitle, margin: [0, 5, 0, 0] },
								],
								border: [false, false, false, false],
								margin: [16, 14, 12, 14],
							},
							{
								stack: [
									{ text: `Wygenerowano: ${new Date().toLocaleString(i18n.resolvedLanguage)}`, fontSize: 8, color: theme.headerSubtitle },
									{ text: `Jednostka: ${exportDurationUnit}`, fontSize: 8, color: theme.headerSubtitle, margin: [0, 5, 0, 0] },
									{ text: `Statusy: ${report.statusLabel}`, fontSize: 8, color: theme.headerSubtitle, margin: [0, 5, 0, 0] },
								],
								border: [false, false, false, false],
								alignment: 'right',
								margin: [10, 18, 16, 10],
							},
						]],
					},
					layout: { fillColor: () => theme.navy, hLineWidth: () => 0, vLineWidth: () => 0 },
					margin: [0, 0, 0, 18],
				},
				{
					table: {
						widths: kpiCards.map(() => '*'),
						body: [[
							...kpiCards.map(card => ({
								stack: [
									{ text: card.label, fontSize: 8, bold: true, color: theme.muted },
									{ text: String(card.value), fontSize: 17, bold: true, color: theme.navy, margin: [0, 3, 0, 0] },
									{ text: card.sub, fontSize: 8, bold: true, color: theme.navy, margin: [0, 2, 0, 0] },
									{ canvas: [{ type: 'rect', x: 0, y: 0, w: 58, h: 3, r: 1.5, color: card.color }], margin: [0, 5, 0, 0] },
								],
								border: [false, false, false, false],
								margin: [8, 7, 8, 7],
							})),
						]],
					},
					layout: { hLineColor: () => theme.line, vLineColor: () => theme.line },
					margin: [0, 0, 0, 14],
				},
				{
					stack: [
						{ text: 'Najważniejsze informacje', style: 'sectionTitle' },
						...insightLines.map(line => ({ text: `• ${line}`, margin: [0, 2, 0, 0] })),
					],
					fillColor: theme.soft,
					margin: [0, 0, 0, 16],
				},
			]
			if (calendarView === 'all-months') {
				content.push(
					{ text: 'Podsumowanie miesięczne', style: 'sectionTitle' },
					{
						table: {
							headerRows: 1,
							widths: ['*', 42, 58, '*'],
							body: [
								['Miesiąc', 'Wnioski', `Łącznie (${exportDurationUnit})`, 'Skala'].map(text => ({ text, bold: true, color: theme.white })),
								...report.monthlySummaryRows.map(row => {
									const barWidth = maxMonthDuration > 0 ? Math.max(8, (row.total / maxMonthDuration) * 130) : 0
									return [
										formatReportMonthName(row.month),
										row.requests,
										formatReportNumber(row.total),
										{ canvas: [
											{ type: 'rect', x: 0, y: 3, w: 130, h: 6, r: 3, color: theme.barTrack },
											{ type: 'rect', x: 0, y: 3, w: barWidth, h: 6, r: 3, color: theme.blue },
										] },
									]
								}),
							],
						},
						layout: tableLayout,
						fontSize: 8,
						margin: [0, 4, 0, 14],
					}
				)
			}
			if (report.typeStats.length > 0) {
				content.push(
					{ text: 'Urlopy według typu', style: 'sectionTitle' },
					{
						table: {
							headerRows: 1,
							widths: ['*', 48, 62, 58, 58, '*'],
							body: [
								['Typ', 'Wnioski', `Łącznie (${exportDurationUnit})`, 'Zaakcept.', 'Oczek.', 'Udział'].map(text => ({ text, bold: true, color: theme.white })),
								...report.typeStats.map(row => {
									const barWidth = maxTypeDuration > 0 ? Math.max(8, (row.duration / maxTypeDuration) * 100) : 0
									return [
										getLeaveRequestTypeName(settings, row.type, t, i18n.resolvedLanguage),
										row.requests,
										formatReportNumber(row.duration),
										formatReportNumber(row.accepted),
										formatReportNumber(row.pending),
										{ canvas: [
											{ type: 'rect', x: 0, y: 3, w: 100, h: 6, r: 3, color: theme.barTrack },
											{ type: 'rect', x: 0, y: 3, w: barWidth, h: 6, r: 3, color: theme.purple },
										] },
									]
								}),
							],
						},
						layout: tableLayout,
						fontSize: 8,
						margin: [0, 4, 0, 14],
					}
				)
			}
			if (report.employeeStats.length > 0) {
				content.push(
					{ text: 'Urlopy według pracowników', style: 'sectionTitle' },
					{
						table: {
							headerRows: 1,
							widths: ['*', 48, 62, 58, 58, '*'],
							body: [
								['Pracownik', 'Wnioski', `Łącznie (${exportDurationUnit})`, 'Zaakcept.', 'Oczek.', 'Skala'].map(text => ({ text, bold: true, color: theme.white })),
								...report.employeeStats.map(row => {
									const barWidth = maxEmployeeDuration > 0 ? Math.max(8, (row.total / maxEmployeeDuration) * 100) : 0
									return [
										row.employee,
										row.requests,
										formatReportNumber(row.total),
										formatReportNumber(row.accepted),
										formatReportNumber(row.pending),
										{ canvas: [
											{ type: 'rect', x: 0, y: 3, w: 100, h: 6, r: 3, color: theme.barTrack },
											{ type: 'rect', x: 0, y: 3, w: barWidth, h: 6, r: 3, color: theme.green },
										] },
									]
								}),
							],
						},
						layout: tableLayout,
						fontSize: 8,
						margin: [0, 4, 0, 14],
					}
				)
			}
			content.push(
				{ text: 'Konkretne terminy wniosków', style: 'sectionTitle' },
				{
					table: {
						headerRows: 1,
						widths: [88, 48, 48, 82, 58, 42, '*'],
						body: [
							['Pracownik', 'Od', 'Do', 'Typ', 'Status', exportDurationUnit, 'Uwagi'].map(text => ({ text, bold: true, color: theme.white })),
							...report.requestRows.map(row => [
								row.employee,
								formatReportDate(row.startDate),
								formatReportDate(row.endDate),
								row.type,
								{ text: row.status, color: statusColors[row.statusKey] || theme.navy, bold: true },
								formatReportNumber(row.duration),
								row.additionalInfo,
							]),
						],
					},
					layout: tableLayout,
					fontSize: 7.5,
					margin: [0, 4, 0, 0],
				}
			)
			await downloadPdf(
				buildPdfDocument({
					content,
					pageOrientation: 'landscape',
					pageMargins: [28, 28, 28, 34],
					info: { title: `Raport urlopów - ${exportPeriodLabel}` },
					styles: {
						sectionTitle: { fontSize: 13, bold: true, color: theme.navy, margin: [0, 0, 0, 5] },
					},
					footer: (currentPage, pageCount) => ({
						columns: [
							{ text: 'Planopia', color: theme.muted, fontSize: 8 },
							{ text: `${currentPage}/${pageCount}`, alignment: 'right', color: theme.muted, fontSize: 8 },
						],
						margin: [28, 0, 28, 0],
					}),
				}),
				buildReportFilename({
					locale: i18n.resolvedLanguage,
					pl: 'raport-urlopy-zespolu',
					en: 'team-leave-report',
					parts: [exportPeriodLabel],
					extension: 'pdf',
				})
			)
		} catch (e) {
			console.error('handleExportPdf:', e)
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
							{(pendingByUser[user._id] || 0) > 0 && (
								<span
									className="leave-pending-badge"
									title={`${t('sidebar.pendingLeaveRequests') || 'Pending leave requests'}: ${pendingByUser[user._id]}`}
								>
									<span className="leave-pending-badge-count">
										{pendingByUser[user._id] > 99 ? '99+' : pendingByUser[user._id]}
									</span>
								</span>
							)}
							<span className="user-hint">{t('vacationlisteq.clickToView')}</span>
						</li>
					))}
				</ul>

					{/* Kalendarz z wnioskami urlopowymi */}
					<div className="calendar-controls flex flex-wrap items-center" style={{ marginTop: '40px', gap: '5px', alignItems: 'center' }}>
							<select
								value={calendarView === 'all-months' ? 'all-months' : currentMonth}
								onChange={handleMonthSelect}
								style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
								className="calendar-month-select focus:outline-none focus:ring-2 focus:ring-blue-500">
								<option value="all-months">{t('planslist.allMonths') || 'Wszystkie miesiące'}</option>
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
						{calendarView === 'single' && (
							<>
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
						{canFilter && (
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
						)}
					</div>

					{calendarView === 'single' ? (
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
									// Wszystkie wnioski urlopowe (status.accepted i status.sent)
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
					) : (
						<div className="all-months-calendar-container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
							{renderAllMonthsCalendars()}
						</div>
					)}

					<div style={{ marginTop: '28px', padding: '0 4px', marginRight: '5px' }}>
						<div
							style={{
								display: 'flex',
								flexWrap: 'wrap',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: '10px',
								marginBottom: '12px',
							}}
						>
							<h4 style={{ color: '#2c3e50', fontSize: '18px', fontWeight: 600, margin: 0 }}>
								{t('planslist.requestsListTitle') || 'Wnioski w wybranym okresie (zgodnie z filtrami)'}
							</h4>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
								<button type="button" onClick={handleExportExcel} style={exportExcelButtonStyle}>
									{t('planslist.exportExcel')}
								</button>
								<button type="button" onClick={handleExportPdf} style={exportPdfButtonStyle}>
									{t('planslist.exportPdf')}
								</button>
							</div>
						</div>
						<div style={{ overflowX: 'auto', border: '1px solid #e1e8ed', borderRadius: '8px', backgroundColor: '#fff' }}>
							<table
								style={{
									width: '100%',
									borderCollapse: 'collapse',
									fontSize: '14px',
									minWidth: '520px',
								}}
							>
								<thead>
									<tr style={{ backgroundColor: '#f4f6f8', borderBottom: '2px solid #dee2e6' }}>
										<th style={{ textAlign: 'left', padding: '10px 12px', color: '#2c3e50' }}>
											{t('planslist.columnEmployee') || 'Pracownik'}
										</th>
										<th style={{ textAlign: 'left', padding: '10px 12px', color: '#2c3e50' }}>
											{t('planslist.columnDates') || 'Termin (od – do)'}
										</th>
										<th style={{ textAlign: 'left', padding: '10px 12px', color: '#2c3e50' }}>
											{t('planslist.columnType') || 'Typ'}
										</th>
										<th style={{ textAlign: 'left', padding: '10px 12px', color: '#2c3e50' }}>
											{t('planslist.columnStatus') || 'Status'}
										</th>
									</tr>
								</thead>
								<tbody>
									{filteredRequestsForTable.length === 0 ? (
										<tr>
											<td colSpan={4} style={{ padding: '16px 12px', color: '#7f8c8d', fontStyle: 'italic' }}>
												{t('planslist.noRequestsInPeriod') || 'Brak wniosków dla wybranego okresu i filtrów.'}
											</td>
										</tr>
									) : (
										filteredRequestsForTable.map((request) => {
											const norm = normalizeLeaveStatus(request.status)
											const statusLabel = norm
												? getStatusInfo(`status.${norm}`).text
												: getStatusInfo(request.status).text
											return (
												<tr
													key={request._id}
													style={{ borderBottom: '1px solid #eef2f5' }}
												>
													<td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
														{resolveEmployeeNameForRequest(request)}
													</td>
													<td style={{ padding: '10px 12px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
														{formatRequestDateRange(request)}
													</td>
													<td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
														{getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}
													</td>
													<td style={{ padding: '10px 12px', verticalAlign: 'top' }}>{statusLabel}</td>
												</tr>
											)
										})
									)}
								</tbody>
							</table>
						</div>
					</div>

					{/* Modal filtrowania — Admin, HR, Przełożony (lista z visible-users) */}
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
							<div style={{ marginBottom: '20px' }}>
								<h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
									{t('planslist.calendarView') || 'Widok kalendarza'}
								</h3>
								<div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
									<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', backgroundColor: calendarView === 'single' ? '#ecfdf5' : '#f8f9fa', border: '1px solid', borderColor: calendarView === 'single' ? '#00a846' : '#e9ecef' }}>
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
									<label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '8px 12px', borderRadius: '6px', backgroundColor: calendarView === 'all-months' ? '#ecfdf5' : '#f8f9fa', border: '1px solid', borderColor: calendarView === 'all-months' ? '#00a846' : '#e9ecef' }}>
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

								<h3 style={{ marginBottom: '12px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
									{t('planslist.filterByStatus') || 'Filtrowanie po statusie wniosku'}
								</h3>
								<div
									style={{
										marginBottom: '20px',
										display: 'flex',
										flexDirection: 'column',
										gap: '10px',
										padding: '12px',
										border: '1px solid #e9ecef',
										borderRadius: '8px',
										backgroundColor: '#fafbfc',
									}}
								>
									{STATUS_FILTER_KEYS.map((key) => (
										<label
											key={key}
											style={{
												display: 'flex',
												alignItems: 'center',
												cursor: 'pointer',
												gap: '10px',
											}}
										>
											<input
												type="checkbox"
												checked={!!statusFilters[key]}
												onChange={() => handleToggleStatusFilter(key)}
												style={{ cursor: 'pointer', width: '18px', height: '18px' }}
											/>
											<span style={{ fontWeight: statusFilters[key] ? 600 : 400 }}>
												{getStatusInfo(`status.${key}`).text}
											</span>
										</label>
									))}
								</div>

								<h3 style={{ marginBottom: '12px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
									{t('planslist.filterByLeaveType') || 'Filtrowanie po typie urlopu / nieobecności'}
								</h3>
								<div
									style={{
										marginBottom: '20px',
										maxHeight: '240px',
										overflowY: 'auto',
										padding: '12px',
										border: '1px solid #e9ecef',
										borderRadius: '8px',
										backgroundColor: '#fafbfc',
										display: 'flex',
										flexDirection: 'column',
										gap: '10px',
									}}
								>
									{allLeaveTypeIds.length === 0 ? (
										<p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
											{t('planslist.noLeaveTypes') || 'Brak zdefiniowanych typów — typy pojawią się po wczytaniu danych.'}
										</p>
									) : (
										allLeaveTypeIds.map((typeId) => (
											<label
												key={typeId}
												style={{
													display: 'flex',
													alignItems: 'flex-start',
													cursor: 'pointer',
													gap: '10px',
												}}
											>
												<input
													type="checkbox"
													checked={typeFilters[typeId] !== false}
													onChange={() => handleToggleTypeFilter(typeId)}
													style={{ cursor: 'pointer', width: '18px', height: '18px', marginTop: '2px', flexShrink: 0 }}
												/>
												<span style={{ fontWeight: typeFilters[typeId] !== false ? 600 : 400, lineHeight: 1.35 }}>
													{getLeaveRequestTypeName(settings, typeId, t, i18n.resolvedLanguage)}
												</span>
											</label>
										))
									)}
								</div>

								<h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
									{t('planslist.filterUsers') || 'Filtrowanie użytkowników'}
								</h3>
								
								{/* Opcja: Wszyscy z zespołu */}
								<label style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', cursor: 'pointer', padding: '10px', borderRadius: '6px', backgroundColor: showAllTeam ? '#ecfdf5' : 'transparent', border: '1px solid', borderColor: showAllTeam ? '#00a846' : '#e9ecef' }}>
									<input
										type="radio"
										name="userFilter"
										checked={showAllTeam}
										onChange={handleShowAllTeam}
										style={{ marginRight: '10px', cursor: 'pointer' }}
									/>
									<span style={{ fontWeight: showAllTeam ? '600' : '400' }}>
										{isSupervisorOnly
											? t('planslist.allVisibleSubordinates') || 'Wszyscy widoczni pracownicy'
											: t('planslist.allTeamMembers') || 'Wszyscy z zespołu'}
									</span>
								</label>

								{/* Filtrowanie po działach */}
								<div style={{ marginTop: '20px' }}>
									<h4 style={{ marginBottom: '10px', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
										{t('planslist.filterByDepartments') || 'Filtrowanie po działach'}
									</h4>
									{filterableDepartments.length > 0 ? (
										<div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
											{filterableDepartments.map(dept => {
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
															<div style={{ marginLeft: '25px', marginTop: '8px', paddingLeft: '15px', borderLeft: '2px solid #00a846' }}>
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

							{/* Filtrowanie po użytkownikach */}
							<div style={{ marginBottom: '30px' }}>
								<h4 style={{ marginBottom: '10px', color: '#34495e', fontSize: '16px', fontWeight: '500' }}>
									{t('planslist.filterByUsers') || 'Filtrowanie po użytkownikach'}
								</h4>
								<div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '6px', padding: '10px' }}>
									{users.length > 0 ? (
										users.map(user => (
											<label key={user._id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer' }}>
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
										<p style={{ color: '#7f8c8d', fontSize: '14px' }}>
											{t('planslist.noUsers') || 'Brak użytkowników'}
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
										backgroundColor: '#00a846',
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
					)}
			</div>
			)}
		</>
	)
}

export default VacationListUser
