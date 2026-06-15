import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
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
import { useSupervisorConfig } from '../../hooks/useSupervisor'
import { useAuth } from '../../context/AuthContext'
import { isAdmin, isHR, isSupervisor } from '../../utils/roleHelpers'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'
import {
	buildPdfDocument,
	downloadPdf,
	pdfDataTable,
} from '../../utils/export/pdfDownload'
import { computeTeamTotalsForMonth, aggregateYearTeamTotals } from '../../utils/teamWorkCalendarSummary'
import { PDF_REPORT_THEME } from '../../utils/export/pdfReportTheme'
import { exportExcelButtonStyle, exportPdfButtonStyle } from '../../utils/export/exportButtonStyles'
import { buildReportFilename } from '../../utils/export/reportFilename'
import { useWorkActivities } from '../../hooks/useWorkActivities'
import { getEnabledWorkActivities, teamHasWorkActivities } from '../../utils/workActivities'
import {
	filterWorkdaysByActivities,
	flattenWorkdayActivityRows,
	aggregateActivityHours,
	formatActivityBreakdown,
	getFilteredActivityHours,
	workdayMatchesActivityFilter,
	getActivityFilterLabel,
} from '../../utils/workActivityAggregation'
import {
	getFilteredCalendarHours,
	formatCalendarBreakdown,
	isCalendarFilterActive,
} from '../../utils/workCalendarFilters'
import {
	collectTasksFromWorkdays,
	buildTaskTitlesMap,
	flattenWorkdayTaskRows,
	aggregateTaskHours,
	workdayMatchesTaskFilter,
	getTaskFilterLabel,
} from '../../utils/workTaskAggregation'
import ActivityFilterBar from '../workcalendars/ActivityFilterBar'
import TaskFilterBar from '../workcalendars/TaskFilterBar'
import { useBillingEntitlements } from '../../hooks/useBilling'
import { canShowBillingModuleNav } from '../../utils/moduleNavAccess'

function workdayUserIdString(day) {
	if (!day?.userId) return ''
	if (typeof day.userId === 'object' && day.userId !== null && day.userId._id) {
		return day.userId._id.toString()
	}
	return String(day.userId)
}

function userIdString(id) {
	if (!id) return ''
	if (typeof id === 'object' && id._id) return id._id.toString()
	return String(id)
}

function AdminUserList() {
	const navigate = useNavigate()
	const { t, i18n } = useTranslation()
	const { role, teamId, userId } = useAuth()
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const calendarRef = useRef(null)
	
	// Filtrowanie
	const [filterModalOpen, setFilterModalOpen] = useState(false)
	const [showAllTeam, setShowAllTeam] = useState(true)
	const [selectedDepartments, setSelectedDepartments] = useState([])
	const [selectedUserIds, setSelectedUserIds] = useState([])
	const [expandedDepartments, setExpandedDepartments] = useState({})
	const [calendarView, setCalendarView] = useState('single') // 'single' | 'all-months'
	const [selectedActivityIds, setSelectedActivityIds] = useState([])
	const [selectedTaskIds, setSelectedTaskIds] = useState([])
	const { data: entitlements, isPending: entitlementsLoading } = useBillingEntitlements()
	const tasksModuleEnabled = canShowBillingModuleNav(entitlements, 'tasks', entitlementsLoading)
	
	const isAdminRole = isAdmin(role)
	const isHRRole = isHR(role)
	const isSupervisorRole = isSupervisor(role)
	const isSupervisorOnly = isSupervisorRole && !isAdminRole && !isHRRole
	const canFilter = isAdminRole || isHRRole || isSupervisorOnly

	const { data: supervisorConfig } = useSupervisorConfig(userId, isSupervisorOnly)

	// TanStack Query hooks
	const { data: users = [], isLoading: loadingUsers, error: usersError } = useUsers()
	const { data: allTeamWorkdays = [], isLoading: loadingWorkdays, error: workdaysError } = useAllTeamWorkdays()
	const { data: allAcceptedRequests = [], isLoading: loadingRequests, error: requestsError } = useAllAcceptedLeaveRequests()
	const { data: settings } = useSettings()
	const { data: workActivities = [] } = useWorkActivities()
	const enabledWorkActivities = useMemo(() => getEnabledWorkActivities(workActivities), [workActivities])
	const { data: departments = [] } = useDepartments(teamId)

	const priorityEmployeeIds = useMemo(() => {
		const raw = supervisorConfig?.selectedEmployees || []
		return new Set(raw.map((id) => userIdString(id)))
	}, [supervisorConfig])

	/** Dla przełożonego: tylko działy widocznych podwładnych (nie cały zespół). */
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

	const getOvertimeWord = (count) => {
		if (i18n.language !== 'pl') {
			return count === 1 ? t('workcalendar.overtime1') : t('workcalendar.overtime5plus')
		}
		const numCount = typeof count === 'number' ? count : parseFloat(count)
		if (isNaN(numCount)) return t('workcalendar.overtime5plus')
		if (numCount % 1 !== 0) return t('workcalendar.overtime5plus')
		if (numCount === 1) return t('workcalendar.overtime1')
		const lastDigit = numCount % 10
		const lastTwoDigits = numCount % 100
		if (lastTwoDigits >= 12 && lastTwoDigits <= 14) return t('workcalendar.overtime5plus')
		if (lastDigit >= 2 && lastDigit <= 4) return t('workcalendar.overtime2_4')
		return t('workcalendar.overtime5plus')
	}

	// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
	const isWeekend = (date) => {
		const day = new Date(date).getDay()
		return day === 0 || day === 6
	}

	// Funkcja pomocnicza do generowania dat w zakresie (z pominięciem weekendów i świąt)
	const generateDateRangeForCalendar = useCallback(
		(startDate, endDate) => {
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
		},
		[settings]
	)

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

	// Święta w całym roku (widok roczny)
	const holidaysForYear = useMemo(() => {
		if (!settings) return []
		const yearStart = new Date(currentYear, 0, 1)
		const yearEnd = new Date(currentYear, 11, 31)
		const formatDateLocal = (date) => {
			const y = date.getFullYear()
			const m = String(date.getMonth() + 1).padStart(2, '0')
			const d = String(date.getDate()).padStart(2, '0')
			return `${y}-${m}-${d}`
		}
		return getHolidaysInRange(formatDateLocal(yearStart), formatDateLocal(yearEnd), settings)
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
			return users.filter((user) => {
				if (isSupervisorOnly && priorityEmployeeIds.has(userIdString(user._id))) {
					return true
				}
				if (!user.department || !Array.isArray(user.department)) return false
				return user.department.some((dept) => selectedDepartments.includes(dept))
			})
		}

		return users
	}, [users, showAllTeam, selectedDepartments, selectedUserIds, isSupervisorOnly, priorityEmployeeIds])

	// Filtruj workdays na podstawie wybranych użytkowników
	const filteredWorkdays = useMemo(() => {
		const filteredUserIds = new Set(filteredUsers.map(u => u._id))
		return allTeamWorkdays.filter(workday => {
			return workday.userId && (typeof workday.userId === 'object' ? filteredUserIds.has(workday.userId._id?.toString()) : filteredUserIds.has(workday.userId.toString()))
		})
	}, [allTeamWorkdays, filteredUsers])

	const filterableTasks = useMemo(
		() => collectTasksFromWorkdays(filteredWorkdays, currentMonth, currentYear),
		[filteredWorkdays, currentMonth, currentYear]
	)
	const taskTitlesById = useMemo(
		() => buildTaskTitlesMap(filterableTasks.map(task => ({ _id: task.id, title: task.title }))),
		[filterableTasks]
	)

	const activityFilterIds = selectedActivityIds
	const scopedWorkdays = useMemo(
		() => filterWorkdaysByActivities(filteredWorkdays, activityFilterIds),
		[filteredWorkdays, selectedActivityIds]
	)

	/** Zaakceptowane wnioski urlopowe tylko dla wyfiltrowanych użytkowników (do podsumowań). */
	const filteredAcceptedRequests = useMemo(() => {
		const filteredUserIds = new Set(filteredUsers.map((u) => u._id))
		return allAcceptedRequests.filter((request) => {
			if (!request.userId || !request.userId.firstName || !request.userId.lastName || !request.startDate || !request.endDate) {
				return false
			}
			const uid = typeof request.userId === 'object' ? request.userId._id : request.userId
			return filteredUserIds.has(uid?.toString())
		})
	}, [allAcceptedRequests, filteredUsers])

	// Helper function to normalize date to YYYY-MM-DD format without timezone issues
	const normalizeDate = (dateInput) => {
		if (!dateInput) return null
		// If it's already a string in YYYY-MM-DD format, return it
		if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
			return dateInput
		}
		// Otherwise, parse it and extract date components
		const date = new Date(dateInput)
		if (isNaN(date.getTime())) return null
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	// Formatuj wpisy ewidencji - grupowanie po dacie i użytkowniku
	const formattedWorkdayEvents = useMemo(() => {
		if (!scopedWorkdays || scopedWorkdays.length === 0) return []

		// Grupuj workdays po dacie i użytkowniku
		const workdaysByDateAndUser = {}
		
		scopedWorkdays.forEach(workday => {
			if (!workday.userId || !workday.userId.firstName) return
			
			const dateKey = normalizeDate(workday.date)
			if (!dateKey) return // Skip if date is invalid
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
			const displayHours = getFilteredCalendarHours(workday, selectedActivityIds, selectedTaskIds)
			if (displayHours > 0) {
				workdaysByDateAndUser[key].allParts.push(`${formatHours(displayHours)}h`)
			}
			const breakdown = formatCalendarBreakdown(workday, {
				workActivities,
				taskTitlesById,
				locale: i18n.language,
				selectedActivityIds,
				selectedTaskIds,
			})
			if (breakdown) {
				workdaysByDateAndUser[key].allParts.push(breakdown)
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
	}, [scopedWorkdays, selectedActivityIds, selectedTaskIds, workActivities, taskTitlesById, i18n.language])

	const workdaysForTotals = useMemo(() => {
		if (!isCalendarFilterActive(selectedActivityIds, selectedTaskIds)) return scopedWorkdays
		return scopedWorkdays
			.map(workday => {
				const hours = getFilteredCalendarHours(workday, selectedActivityIds, selectedTaskIds)
				if (!hours) return null
				return { ...workday, hoursWorked: hours, additionalWorked: 0 }
			})
			.filter(Boolean)
	}, [scopedWorkdays, selectedActivityIds, selectedTaskIds])

	const usersById = useMemo(
		() => new Map(filteredUsers.map(user => [userIdString(user._id), user])),
		[filteredUsers]
	)

	const teamActivityRows = useMemo(() => {
		const monthWorkdays = scopedWorkdays.filter(workday => {
			const eventDate = new Date(workday.date)
			if (calendarView === 'single') {
				return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
			}
			return eventDate.getFullYear() === currentYear
		})
		return flattenWorkdayActivityRows(
			monthWorkdays.filter(workday => workdayMatchesActivityFilter(workday, activityFilterIds)),
			workActivities,
			usersById,
			i18n.language,
			activityFilterIds,
			{ deletedActivityLabel: t('workcalendar.activities.deletedLabel') }
		)
	}, [scopedWorkdays, workActivities, usersById, i18n.language, calendarView, currentMonth, currentYear, activityFilterIds, t])

	const teamActivitySummary = useMemo(
		() => aggregateActivityHours(teamActivityRows, { groupByUser: true }),
		[teamActivityRows]
	)

	const teamTaskRows = useMemo(() => {
		if (!tasksModuleEnabled) return []
		const monthWorkdays = scopedWorkdays.filter(workday => {
			const eventDate = new Date(workday.date)
			if (calendarView === 'single') {
				return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
			}
			return eventDate.getFullYear() === currentYear
		})
		return flattenWorkdayTaskRows(
			monthWorkdays.filter(workday => workdayMatchesTaskFilter(workday, selectedTaskIds)),
			taskTitlesById,
			usersById,
			selectedTaskIds,
			{ deletedTaskLabel: t('workcalendar.tasks.deletedLabel') }
		)
	}, [scopedWorkdays, taskTitlesById, usersById, selectedTaskIds, tasksModuleEnabled, calendarView, currentMonth, currentYear, t])

	const teamTaskSummary = useMemo(
		() => aggregateTaskHours(teamTaskRows, { groupByUser: true }),
		[teamTaskRows]
	)

	const hasActivityFilter = selectedActivityIds.length > 0
	const hasTaskFilter = selectedTaskIds.length > 0
	const showOperationalActivities = !hasTaskFilter || hasActivityFilter
	const showOperationalTasks = tasksModuleEnabled && (!hasActivityFilter || hasTaskFilter)
	const visibleActivitySummary = showOperationalActivities ? teamActivitySummary : []
	const visibleTaskSummary = showOperationalTasks ? teamTaskSummary : []

	const buildLeaveEventsForMonth = useCallback(
		(month, year) => {
			return filteredAcceptedRequests.flatMap((request) => {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				const employeeName = `${request.userId.firstName} ${request.userId.lastName}`
				return dates
					.filter((date) => {
						const dateObj = new Date(date)
						return dateObj.getMonth() === month && dateObj.getFullYear() === year
					})
					.map((date) => ({
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
							requestId: request._id,
						},
					}))
			})
		},
		[filteredAcceptedRequests, generateDateRangeForCalendar, settings, t, i18n.resolvedLanguage]
	)

	const acceptedLeaveRequestsForMonth = useMemo(
		() => buildLeaveEventsForMonth(currentMonth, currentYear),
		[buildLeaveEventsForMonth, currentMonth, currentYear]
	)

	/** Podsumowanie dla jednego miesiąca (zsynchronizowane z logiką kalendarza osoby). */
	const teamSummaryCurrentMonth = useMemo(() => {
		if (!settings) return null
		return computeTeamTotalsForMonth({
			workdays: workdaysForTotals,
			acceptedLeaveRequests: filteredAcceptedRequests,
			month: currentMonth,
			year: currentYear,
			settings,
			t,
			i18n,
			generateDateRangeForCalendar,
		})
	}, [
		settings,
		workdaysForTotals,
		filteredAcceptedRequests,
		currentMonth,
		currentYear,
		t,
		i18n,
		generateDateRangeForCalendar,
	])

	/** 12 miesięcy + suma (widok roczny). */
	const teamYearBreakdown = useMemo(() => {
		if (!settings) return { months: [], yearTotals: null }
		const months = Array.from({ length: 12 }, (_, month) =>
			computeTeamTotalsForMonth({
				workdays: workdaysForTotals,
				acceptedLeaveRequests: filteredAcceptedRequests,
				month,
				year: currentYear,
				settings,
				t,
				i18n,
				generateDateRangeForCalendar,
			})
		)
		return { months, yearTotals: aggregateYearTeamTotals(months) }
	}, [settings, workdaysForTotals, filteredAcceptedRequests, currentYear, t, i18n, generateDateRangeForCalendar])

	/** Podsumowanie skrócone per pracownik (te same filtry i okres co powyżej). */
	const perUserSummaryRows = useMemo(() => {
		if (!settings) return []
		return filteredUsers.map((user) => {
			const uid = user._id.toString()
			const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || uid
			const userWds = workdaysForTotals.filter((w) => workdayUserIdString(w) === uid)
			const userLeaves = filteredAcceptedRequests.filter((r) => {
				const rid =
					typeof r.userId === 'object' && r.userId?._id ? r.userId._id.toString() : String(r.userId)
				return rid === uid
			})
			let totals
			if (calendarView === 'single') {
				totals = computeTeamTotalsForMonth({
					workdays: userWds,
					acceptedLeaveRequests: userLeaves,
					month: currentMonth,
					year: currentYear,
					settings,
					t,
					i18n,
					generateDateRangeForCalendar,
				})
			} else {
				const months = Array.from({ length: 12 }, (_, month) =>
					computeTeamTotalsForMonth({
						workdays: userWds,
						acceptedLeaveRequests: userLeaves,
						month,
						year: currentYear,
						settings,
						t,
						i18n,
						generateDateRangeForCalendar,
					})
				)
				totals = aggregateYearTeamTotals(months)
			}
			return { userId: uid, name, totals }
		})
	}, [
		settings,
		filteredUsers,
		workdaysForTotals,
		filteredAcceptedRequests,
		calendarView,
		currentMonth,
		currentYear,
		t,
		i18n,
		generateDateRangeForCalendar,
	])

	/** Suma kolumn tabeli „Według osób” (suma wierszy per pracownik). */
	const perUserTableTotals = useMemo(() => {
		if (!perUserSummaryRows.length) return null
		return aggregateYearTeamTotals(perUserSummaryRows.map((r) => r.totals))
	}, [perUserSummaryRows])

	const formatPerUserLeaveCell = (totals) =>
		settings?.leaveCalculationMode === 'hours'
			? `${totals.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
			: `${totals.leaveDays} (${totals.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`

	const buildPerUserTotalsRow = (totals, { compact = false } = {}) => {
		if (!totals) return null
		const leaveCell =
			settings?.leaveCalculationMode === 'hours'
				? compact
					? totals.leaveHours.toFixed(1)
					: formatPerUserLeaveCell(totals)
				: compact
					? String(totals.leaveDays)
					: formatPerUserLeaveCell(totals)
		return [
			t('planslist.teamTableTotal'),
			totals.totalWorkDays,
			compact
				? formatHours(totals.totalHours)
				: `${formatHours(totals.totalHours)} ${t('workcalendar.allfrommonthhours')}`,
			compact
				? formatHours(totals.overtime)
				: `${formatHours(totals.overtime)} ${getOvertimeWord(totals.overtime)}`,
			leaveCell,
			totals.otherAbsences,
		]
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

	const exportFileNameBase = () => {
		return buildReportFilename({
			locale: i18n.resolvedLanguage,
			pl: 'raport-ewidencja-zespolu',
			en: 'team-timesheet-report',
			parts: [exportPeriodLabel],
		})
	}

	const exportFileNameBasePerUser = () => buildReportFilename({
		locale: i18n.resolvedLanguage,
		pl: 'raport-ewidencja-wedlug-osob',
		en: 'timesheet-report-by-person',
		parts: [exportPeriodLabel],
	})

	const exportFileNameBaseOperational = () => buildReportFilename({
		locale: i18n.resolvedLanguage,
		pl: 'raport-zadania-i-czynnosci',
		en: 'tasks-and-activities-report',
		parts: [exportPeriodLabel],
	})

	const getCurrentSummaryTotals = () => {
		if (calendarView === 'single') return teamSummaryCurrentMonth
		return teamYearBreakdown.yearTotals
	}

	const getLeaveDisplay = (summary, compact = false) => {
		if (!summary) return ''
		if (settings?.leaveCalculationMode === 'hours') {
			return `${Number(summary.leaveHours || 0).toFixed(1)} ${compact ? 'h' : t('workcalendar.allfrommonthhours')}`
		}
		return compact
			? `${summary.leaveDays} dni / ${Number(summary.leaveHours || 0).toFixed(1)} h`
			: `${summary.leaveDays} (${Number(summary.leaveHours || 0).toFixed(1)} ${t('workcalendar.allfrommonthhours')})`
	}

	const reportTheme = PDF_REPORT_THEME

	const safeNumber = (value) => {
		const number = Number(value || 0)
		return Number.isFinite(number) ? number : 0
	}

	const formatPercent = (value) => `${safeNumber(value).toFixed(1)}%`

	const getReportInsights = (summary) => {
		if (!summary) return []
		const totalHours = safeNumber(summary.totalHours)
		const totalWorkDays = safeNumber(summary.totalWorkDays)
		const overtime = safeNumber(summary.overtime)
		const leaveHours = safeNumber(summary.leaveHours)
		const avgHoursPerWorkDay = totalWorkDays > 0 ? totalHours / totalWorkDays : 0
		const overtimeShare = totalHours > 0 ? (overtime / totalHours) * 100 : 0
		const absenceLoad = totalHours + leaveHours > 0 ? (leaveHours / (totalHours + leaveHours)) * 100 : 0
		return [
			{
				label: 'Średnio na dzień pracy',
				value: `${formatHours(avgHoursPerWorkDay)} h`,
				note: avgHoursPerWorkDay >= 8 ? 'Wysokie obciążenie operacyjne' : 'Stabilny poziom wykorzystania czasu',
			},
			{
				label: 'Udział nadgodzin',
				value: formatPercent(overtimeShare),
				note: overtimeShare > 8 ? 'Warto sprawdzić obszary przeciążenia' : 'Nadgodziny pod kontrolą',
			},
			{
				label: 'Udział urlopów',
				value: formatPercent(absenceLoad),
				note: absenceLoad > 15 ? 'Istotny wpływ nieobecności na dostępność' : 'Dostępność zespołu stabilna',
			},
		]
	}

	const pdfSectionTitle = (text, subtitle = '') => ({
		stack: [
			{ text, style: 'sectionTitle' },
			subtitle ? { text: subtitle, style: 'sectionSubtitle', margin: [0, 2, 0, 0] } : null,
		].filter(Boolean),
		margin: [0, 15, 0, 8],
	})

	const pdfExecutiveHeader = (summary, generatedAt) => ({
		table: {
			widths: ['*', 175],
			body: [[
				{
					stack: [
						{ text: 'PLANOPIA · RAPORT EWIDENCJI', fontSize: 8, bold: true, color: reportTheme.headerEyebrow, characterSpacing: 1.2 },
						{ text: 'Podsumowanie ewidencji', fontSize: 22, bold: true, color: '#ffffff', margin: [0, 7, 0, 0] },
						{ text: `Okres: ${exportPeriodLabel}`, fontSize: 11, color: reportTheme.headerSubtitle, margin: [0, 5, 0, 0] },
					],
					border: [false, false, false, false],
					margin: [18, 16, 12, 16],
				},
				{
					stack: [
						{ text: 'Szybki obraz', fontSize: 8, color: reportTheme.headerEyebrow, bold: true },
						{ text: `${formatHours(summary.totalHours)} h`, fontSize: 24, bold: true, color: '#ffffff', margin: [0, 5, 0, 0] },
						{ text: `${summary.totalWorkDays} dni pracy · ${formatHours(summary.overtime)} h nadgodzin`, fontSize: 8, color: reportTheme.headerSubtitle, margin: [0, 4, 0, 0] },
						{ text: `Wygenerowano: ${generatedAt}`, fontSize: 7, color: '#93c5fd', margin: [0, 9, 0, 0] },
					],
					border: [false, false, false, false],
					margin: [12, 14, 16, 14],
				},
			]],
		},
		layout: {
			hLineWidth: () => 0,
			vLineWidth: () => 0,
			fillColor: () => reportTheme.navy,
		},
		margin: [0, 0, 0, 12],
	})

	const pdfReportHeader = ({ title, subtitle, eyebrow = 'PLANOPIA · RAPORT EWIDENCJI', side = [] }) => ({
		table: {
			widths: ['*', 190],
			body: [[
				{
					stack: [
						{ text: eyebrow, fontSize: 8, bold: true, color: reportTheme.headerEyebrow, characterSpacing: 1.2 },
						{ text: title, fontSize: 22, bold: true, color: '#ffffff', margin: [0, 7, 0, 0] },
						{ text: subtitle, fontSize: 11, color: reportTheme.headerSubtitle, margin: [0, 5, 0, 0] },
					],
					border: [false, false, false, false],
					margin: [18, 16, 12, 16],
				},
				{
					stack: side,
					border: [false, false, false, false],
					margin: [12, 14, 16, 14],
				},
			]],
		},
		layout: {
			hLineWidth: () => 0,
			vLineWidth: () => 0,
			fillColor: () => reportTheme.navy,
		},
		margin: [0, 0, 0, 12],
	})

	const pdfMiniProgress = (value, max, color = reportTheme.blue, width = 74) => ({
		canvas: [
			{ type: 'rect', x: 0, y: 0, w: width, h: 4, r: 2, color: '#e6eef7' },
			{ type: 'rect', x: 0, y: 0, w: Math.max(2, Math.min(width, Math.round((safeNumber(value) / Math.max(safeNumber(max), 1)) * width))), h: 4, r: 2, color },
		],
		margin: [0, 7, 0, 0],
	})

	const pdfKpiCards = (summary) => {
		if (!summary) return []
		const maxForBars = Math.max(safeNumber(summary.totalHours), safeNumber(summary.overtime), safeNumber(summary.leaveHours), safeNumber(summary.totalWorkDays), 1)
		const cards = [
			{ label: 'Dni pracy', value: String(summary.totalWorkDays), detail: 'aktywnych dni w okresie', color: reportTheme.blue, raw: summary.totalWorkDays },
			{ label: 'Godziny pracy', value: `${formatHours(summary.totalHours)} h`, detail: 'łączny czas operacyjny', color: reportTheme.green, raw: summary.totalHours },
			{ label: 'Nadgodziny', value: `${formatHours(summary.overtime)} h`, detail: `${formatPercent(safeNumber(summary.totalHours) ? (safeNumber(summary.overtime) / safeNumber(summary.totalHours)) * 100 : 0)} czasu pracy`, color: reportTheme.amber, raw: summary.overtime },
			{ label: 'Urlopy', value: getLeaveDisplay(summary, true), detail: 'zaakceptowane nieobecności', color: reportTheme.purple, raw: summary.leaveHours },
			{ label: 'Inne absencje', value: String(summary.otherAbsences || 0), detail: 'poza urlopami', color: reportTheme.red, raw: summary.otherAbsences },
		]
		return [{
			table: {
				widths: cards.map(() => '*'),
				body: [[
					...cards.map(card => ({
						stack: [
							{ text: card.label, fontSize: 8, bold: true, color: reportTheme.muted },
							{ text: card.value, fontSize: 16, bold: true, color: reportTheme.ink, margin: [0, 5, 0, 0] },
							{ text: card.detail, fontSize: 7, color: reportTheme.muted, margin: [0, 3, 0, 0] },
							pdfMiniProgress(card.raw, maxForBars, card.color),
						],
						fillColor: '#ffffff',
						border: [false, false, false, false],
						margin: [9, 9, 9, 9],
					})),
				]],
			},
			layout: {
				hLineWidth: () => 1,
				vLineWidth: () => 1,
				hLineColor: () => reportTheme.line,
				vLineColor: () => reportTheme.line,
			},
			margin: [0, 0, 0, 10],
		}]
	}

	const pdfInsightStrip = (summary) => {
		const insights = getReportInsights(summary)
		if (!insights.length) return []
		return [{
			table: {
				widths: insights.map(() => '*'),
				body: [[
					...insights.map(item => ({
						stack: [
							{ text: item.label, fontSize: 8, bold: true, color: reportTheme.muted },
							{ text: item.value, fontSize: 14, bold: true, color: reportTheme.ink, margin: [0, 4, 0, 0] },
							{ text: item.note, fontSize: 7, color: reportTheme.muted, margin: [0, 4, 0, 0] },
						],
						margin: [10, 8, 10, 8],
						border: [false, false, false, false],
					})),
				]],
			},
			layout: {
				hLineWidth: () => 0,
				vLineWidth: () => 0,
				fillColor: () => reportTheme.soft,
			},
			margin: [0, 0, 0, 8],
		}]
	}

	const aggregateRowsBy = (rows, keyName, valueName = 'hours') => {
		const map = new Map()
		rows.forEach(row => {
			const key = row[keyName] || '-'
			const current = map.get(key) || { name: key, hours: 0, quantity: 0, unit: row.unit || '' }
			current.hours += safeNumber(row[valueName])
			current.quantity += safeNumber(row.quantity)
			if (!current.unit && row.unit) current.unit = row.unit
			map.set(key, current)
		})
		return [...map.values()].sort((a, b) => b.hours - a.hours)
	}

	const pdfHorizontalBars = (title, rows, { subtitle = '', color = reportTheme.blue, valueSuffix = 'h', limit = 7 } = {}) => {
		const topRows = rows.slice(0, limit)
		if (!topRows.length) return []
		const max = Math.max(...topRows.map(row => safeNumber(row.hours)), 1)
		return [
			pdfSectionTitle(title, subtitle),
			{
				table: {
					widths: [125, '*', 55],
					body: topRows.map((row, index) => [
						{ text: row.name, bold: index < 3, color: reportTheme.ink, fontSize: 8, margin: [0, 3, 0, 3] },
						{
							canvas: [
								{ type: 'rect', x: 0, y: 5, w: 220, h: 8, r: 4, color: '#e8f1f8' },
								{ type: 'rect', x: 0, y: 5, w: Math.max(4, Math.round((safeNumber(row.hours) / max) * 220)), h: 8, r: 4, color },
							],
							margin: [0, 1, 0, 0],
						},
						{ text: `${formatHours(row.hours)} ${valueSuffix}`, alignment: 'right', bold: index < 3, color: reportTheme.ink, fontSize: 8, margin: [0, 3, 0, 3] },
					]),
				},
				layout: {
					hLineWidth: () => 0.5,
					vLineWidth: () => 0,
					hLineColor: () => '#edf2f7',
				},
				margin: [0, 0, 0, 4],
			},
		]
	}

	const pdfTimeStructure = (summary) => {
		if (!summary) return []
		const work = Math.max(safeNumber(summary.totalHours) - safeNumber(summary.overtime), 0)
		const overtime = safeNumber(summary.overtime)
		const leave = safeNumber(summary.leaveHours)
		const total = Math.max(work + overtime + leave, 1)
		const width = 520
		const workW = Math.round((work / total) * width)
		const overtimeW = Math.round((overtime / total) * width)
		const leaveW = Math.max(0, width - workW - overtimeW)
		return [
			pdfSectionTitle('Struktura czasu', 'Szybkie rozbicie czasu pracy, nadgodzin i urlopów w wybranym okresie.'),
			{
				canvas: [
					{ type: 'rect', x: 0, y: 0, w: width, h: 15, r: 7, color: '#e8f1f8' },
					{ type: 'rect', x: 0, y: 0, w: workW, h: 15, r: 7, color: reportTheme.green },
					{ type: 'rect', x: workW, y: 0, w: overtimeW, h: 15, color: reportTheme.amber },
					{ type: 'rect', x: workW + overtimeW, y: 0, w: leaveW, h: 15, r: 7, color: reportTheme.purple },
				],
				margin: [0, 0, 0, 7],
			},
			{
				columns: [
					{ text: `Praca: ${formatHours(work)} h`, color: reportTheme.green, bold: true, fontSize: 8 },
					{ text: `Nadgodziny: ${formatHours(overtime)} h`, color: '#b45309', bold: true, fontSize: 8 },
					{ text: `Urlopy: ${formatHours(leave)} h`, color: reportTheme.purple, bold: true, fontSize: 8 },
				],
				margin: [0, 0, 0, 6],
			},
		]
	}

	const pdfMonthlyBars = () => {
		if (calendarView !== 'all-months' || !teamYearBreakdown.months.length) return []
		const rows = teamYearBreakdown.months.map((m, idx) => ({
			name: new Date(currentYear, idx).toLocaleString(i18n.resolvedLanguage, { month: 'short' }),
			hours: safeNumber(m.totalHours),
		}))
		return pdfHorizontalBars(
			'Trend roczny',
			rows,
			{ subtitle: 'Miesięczny rozkład godzin pracy. Pomaga szybko zobaczyć sezonowość i piki obciążenia.', color: reportTheme.cyan, limit: 12 }
		)
	}

	const pdfTopPerUserTable = () => {
		if (!perUserSummaryRows.length) return []
		const chartRows = [...perUserSummaryRows]
			.sort((a, b) => safeNumber(b.totals.totalHours) - safeNumber(a.totals.totalHours))
			.slice(0, 8)
			.map(row => ({ name: row.name, hours: safeNumber(row.totals.totalHours) }))
		return [
			...pdfHorizontalBars('Największe wykorzystanie czasu', chartRows, {
				subtitle: 'Top pracowników według łącznej liczby godzin w okresie.',
				color: reportTheme.blue,
				limit: 8,
			}),
		]
	}

	const pdfActivitySummaryTable = () => {
		const sections = []
		const activitiesByName = aggregateRowsBy(teamActivityRows, 'activityName')
		const tasksByName = aggregateRowsBy(teamTaskRows, 'taskName')
		sections.push(...pdfHorizontalBars('Godziny według czynności', activitiesByName, {
			subtitle: 'Największe obszary operacyjne i czynności konsumujące czas zespołu.',
			color: reportTheme.green,
			limit: 8,
		}))
		sections.push(...pdfHorizontalBars('Godziny według zadań', tasksByName, {
			subtitle: 'Widok pracy przypisanej do zadań z tablic.',
			color: reportTheme.purple,
			limit: 8,
		}))
		if (teamActivitySummary.length) {
			const rows = [...teamActivitySummary]
				.sort((a, b) => safeNumber(b.hours) - safeNumber(a.hours))
				.slice(0, 12)
				.map(row => [
					row.userName,
					row.activityName,
					`${formatHours(row.hours)} h`,
					row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '-',
					row.efficiency ? `${row.efficiency} ${row.unit}/h` : '-',
				])
			sections.push(
				pdfSectionTitle('Wydajność czynności', 'Szczegóły ilości i wydajności tam, gdzie pomiar wykonania jest włączony.'),
				pdfDataTableStyled(
					[
						t('workcalendar.activities.excel.employee'),
						t('workcalendar.activities.excel.activity'),
						t('workcalendar.activities.excel.hours'),
						t('workcalendar.activities.excel.quantity'),
						t('workcalendar.activities.excel.efficiency'),
					],
					rows,
					[64, 60, 30, 38, 40]
				)
			)
		}
		return sections
	}

	const pdfExecutiveConclusion = (summary) => {
		if (!summary) return []
		const overtimeShare = safeNumber(summary.totalHours) ? (safeNumber(summary.overtime) / safeNumber(summary.totalHours)) * 100 : 0
		const dominantActivity = aggregateRowsBy(teamActivityRows, 'activityName')[0]
		const dominantTask = aggregateRowsBy(teamTaskRows, 'taskName')[0]
		const bullets = [
			`Łączne obciążenie zespołu: ${formatHours(summary.totalHours)} h przy ${summary.totalWorkDays} dniach pracy.`,
			`Nadgodziny stanowią ${formatPercent(overtimeShare)} czasu pracy${overtimeShare > 8 ? ' - warto sprawdzić przyczynę piku.' : ' - poziom wygląda stabilnie.'}`,
			dominantActivity ? `Największa czynność: ${dominantActivity.name} (${formatHours(dominantActivity.hours)} h).` : null,
			dominantTask ? `Największe zadanie: ${dominantTask.name} (${formatHours(dominantTask.hours)} h).` : null,
		].filter(Boolean)
		return [{
			table: {
				widths: ['*'],
				body: [[{
					stack: [
						{ text: 'Najważniejsze wnioski', fontSize: 12, bold: true, color: reportTheme.ink, margin: [0, 0, 0, 6] },
						...bullets.map(text => ({ text: `• ${text}`, fontSize: 8, color: '#334155', margin: [0, 2, 0, 0] })),
					],
					margin: [12, 10, 12, 10],
					border: [false, false, false, false],
				}]],
			},
			layout: {
				hLineWidth: () => 0,
				vLineWidth: () => 0,
				fillColor: () => reportTheme.softRow,
			},
			margin: [0, 0, 0, 8],
		}]
	}

	const pdfTableLayout = {
		hLineColor: () => '#e5edf5',
		vLineColor: () => '#e5edf5',
		fillColor: (rowIndex) => rowIndex === 0 ? reportTheme.navy : (rowIndex % 2 === 0 ? reportTheme.softRow : null),
	}

	const pdfDataTableStyled = (headers, rows, widths, footerRow) => {
		const table = pdfDataTable(headers, rows, widths, footerRow)
		if (Array.isArray(table.table?.body?.[0])) {
			table.table.body[0] = table.table.body[0].map(cell => ({
				...(typeof cell === 'object' ? cell : { text: String(cell ?? '') }),
				color: '#ffffff',
				bold: true,
			}))
		}
		return {
			...table,
			layout: pdfTableLayout,
			fontSize: 8,
		}
	}

	const buildExecutiveExcelRows = (summary, generatedAt) => {
		const insights = getReportInsights(summary)
		const topEmployees = [...perUserSummaryRows]
			.sort((a, b) => safeNumber(b.totals.totalHours) - safeNumber(a.totals.totalHours))
			.slice(0, 5)
		const topActivities = aggregateRowsBy(teamActivityRows, 'activityName').slice(0, 5)
		return [
			['Obszar', 'Wskaźnik', 'Wartość', 'Komentarz'],
			['KPI', 'Dni pracy', summary.totalWorkDays, 'Aktywne dni pracy w wybranym okresie'],
			['KPI', 'Godziny pracy', `${formatHours(summary.totalHours)} h`, 'Łączny czas operacyjny'],
			['KPI', 'Nadgodziny', `${formatHours(summary.overtime)} h`, 'Kontrola przeciążenia i pików obciążenia'],
			['KPI', 'Urlopy', getLeaveDisplay(summary, true), 'Wpływ absencji na dostępność zespołu'],
			...insights.map(item => ['Wniosek', item.label, item.value, item.note]),
			['', '', '', ''],
			['Top pracownicy', 'Pracownik', 'Godziny', 'Komentarz'],
			...topEmployees.map((row, index) => ['Top pracownicy', row.name, `${formatHours(row.totals.totalHours)} h`, index === 0 ? 'Największy udział czasu w okresie' : '']),
			['', '', '', ''],
			['Top czynności', 'Czynność', 'Godziny', 'Komentarz'],
			...topActivities.map((row, index) => ['Top czynności', row.name, `${formatHours(row.hours)} h`, index === 0 ? 'Główne źródło obciążenia operacyjnego' : '']),
			['Metadane', 'Wygenerowano', generatedAt, 'Planopia'],
		]
	}

	const getTopPerUserMetrics = () => {
		const rows = [...perUserSummaryRows]
		const byHours = [...rows].sort((a, b) => safeNumber(b.totals.totalHours) - safeNumber(a.totals.totalHours))[0]
		const byOvertime = [...rows].sort((a, b) => safeNumber(b.totals.overtime) - safeNumber(a.totals.overtime))[0]
		const byLeave = [...rows].sort((a, b) => safeNumber(b.totals.leaveHours) - safeNumber(a.totals.leaveHours))[0]
		const activePeople = rows.filter(row => safeNumber(row.totals.totalHours) > 0 || safeNumber(row.totals.totalWorkDays) > 0).length
		return { byHours, byOvertime, byLeave, activePeople }
	}

	const pdfPeopleKpiCards = () => {
		const { byHours, byOvertime, byLeave, activePeople } = getTopPerUserMetrics()
		const cards = [
			{ label: 'Osoby w raporcie', value: String(perUserSummaryRows.length), detail: `${activePeople} aktywnych w okresie`, color: reportTheme.blue },
			{ label: 'Najwięcej godzin', value: byHours?.name || '-', detail: byHours ? `${formatHours(byHours.totals.totalHours)} h` : '-', color: reportTheme.green },
			{ label: 'Najwięcej nadgodzin', value: byOvertime?.name || '-', detail: byOvertime ? `${formatHours(byOvertime.totals.overtime)} h` : '-', color: reportTheme.amber },
			{ label: 'Najwięcej urlopu', value: byLeave?.name || '-', detail: byLeave ? getLeaveDisplay(byLeave.totals, true) : '-', color: reportTheme.purple },
		]
		return [{
			table: {
				widths: cards.map(() => '*'),
				body: [[
					...cards.map(card => ({
						stack: [
							{ text: card.label, fontSize: 8, bold: true, color: reportTheme.muted },
							{ text: card.value, fontSize: 12, bold: true, color: reportTheme.ink, margin: [0, 5, 0, 0] },
							{ text: card.detail, fontSize: 8, color: reportTheme.muted, margin: [0, 4, 0, 0] },
							pdfMiniProgress(1, 1, card.color, 72),
						],
						border: [false, false, false, false],
						margin: [9, 9, 9, 9],
					})),
				]],
			},
			layout: {
				hLineWidth: () => 1,
				vLineWidth: () => 1,
				hLineColor: () => reportTheme.line,
				vLineColor: () => reportTheme.line,
			},
			margin: [0, 0, 0, 10],
		}]
	}

	const getActivityQuantitySummary = (rows = visibleActivitySummary) => {
		const quantitiesByUnit = new Map()
		let measuredHours = 0
		rows.forEach(row => {
			const quantity = safeNumber(row.quantity)
			if (quantity <= 0 || !row.unit) return
			const current = quantitiesByUnit.get(row.unit) || 0
			quantitiesByUnit.set(row.unit, current + quantity)
			measuredHours += safeNumber(row.hours)
		})
		const parts = [...quantitiesByUnit.entries()].map(([unit, quantity]) => `${formatHours(quantity)} ${unit}`)
		const single = quantitiesByUnit.size === 1 ? [...quantitiesByUnit.entries()][0] : null
		const efficiency = single && measuredHours > 0
			? `${formatHours(single[1] / measuredHours)} ${single[0]}/h`
			: ''
		return {
			text: parts.length ? parts.join(', ') : '-',
			efficiency: efficiency || '-',
			measuredHours,
		}
	}

	const getOperationalTotals = () => {
		const taskHours = visibleTaskSummary.reduce((sum, row) => sum + safeNumber(row.hours), 0)
		const activityHours = visibleActivitySummary.reduce((sum, row) => sum + safeNumber(row.hours), 0)
		const quantity = getActivityQuantitySummary()
		return {
			taskRows: visibleTaskSummary.length,
			activityRows: visibleActivitySummary.length,
			taskHours,
			activityHours,
			quantityText: quantity.text,
			efficiencyText: quantity.efficiency,
		}
	}

	const pdfOperationalKpiCards = () => {
		const totals = getOperationalTotals()
		const cards = [
			...(showOperationalTasks ? [{ label: 'Zadania', value: `${formatHours(totals.taskHours)} h`, detail: `${totals.taskRows} pozycji`, color: reportTheme.purple }] : []),
			...(showOperationalActivities ? [
				{ label: 'Czynności', value: `${formatHours(totals.activityHours)} h`, detail: `${totals.activityRows} pozycji`, color: reportTheme.green },
				{ label: 'Wykonanie', value: totals.quantityText, detail: 'suma zmierzonej pracy', color: reportTheme.blue },
				{ label: 'Wydajność', value: totals.efficiencyText, detail: 'dla jednej jednostki wykonania', color: reportTheme.amber },
			] : []),
		]
		return [{
			table: {
				widths: cards.map(() => '*'),
				body: [[
					...cards.map(card => ({
						stack: [
							{ text: card.label, fontSize: 8, bold: true, color: reportTheme.muted },
							{ text: card.value, fontSize: 13, bold: true, color: reportTheme.ink, margin: [0, 5, 0, 0] },
							{ text: card.detail, fontSize: 7, color: reportTheme.muted, margin: [0, 4, 0, 0] },
							pdfMiniProgress(1, 1, card.color, 72),
						],
						border: [false, false, false, false],
						margin: [9, 9, 9, 9],
					})),
				]],
			},
			layout: {
				hLineWidth: () => 1,
				vLineWidth: () => 1,
				hLineColor: () => reportTheme.line,
				vLineColor: () => reportTheme.line,
			},
			margin: [0, 0, 0, 10],
		}]
	}

	const pdfOperationalTables = () => {
		const sections = []
		if (visibleTaskSummary.length > 0) {
			const taskRows = [...visibleTaskSummary]
				.sort((a, b) => safeNumber(b.hours) - safeNumber(a.hours))
				.map(row => [
					row.userName,
					row.taskName,
					`${formatHours(row.hours)} h`,
				])
			sections.push(
				pdfSectionTitle('Zadania', 'Godziny według zadań z tablic dla wybranego okresu.'),
				pdfDataTableStyled(
					[
						t('workcalendar.activities.excel.employee'),
						t('workcalendar.tasks.taskLabel'),
						t('workcalendar.activities.excel.hours'),
					],
					taskRows,
					['*', '*', 70]
				)
			)
		}
		if (visibleActivitySummary.length > 0) {
			const activityRows = [...visibleActivitySummary]
				.sort((a, b) => safeNumber(b.hours) - safeNumber(a.hours))
				.map(row => [
					row.userName,
					row.activityName,
					`${formatHours(row.hours)} h`,
					row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '-',
					row.efficiency ? `${row.efficiency} ${row.unit}/h` : '-',
				])
			sections.push(
				pdfSectionTitle('Czynności', 'Godziny, ilości i wydajność według czynności dla wybranego okresu.'),
				pdfDataTableStyled(
					[
						t('workcalendar.activities.excel.employee'),
						t('workcalendar.activities.excel.activity'),
						t('workcalendar.activities.excel.hours'),
						t('workcalendar.activities.excel.quantity'),
						t('workcalendar.activities.excel.efficiency'),
					],
					activityRows,
					['*', '*', 62, 75, 78]
				)
			)
		}
		return sections
	}

	const handleExportSummaryExcel = async () => {
		try {
			const header = [
				t('planslist.teamExportColMetric'),
				t('planslist.teamExportColValue'),
			]
			let rows = []

			if (calendarView === 'single' && teamSummaryCurrentMonth) {
				const s = teamSummaryCurrentMonth
				rows = [
					[t('workcalendar.allfrommonth1'), s.totalWorkDays],
					[t('workcalendar.allfrommonth2'), `${formatHours(s.totalHours)} ${t('workcalendar.allfrommonthhours')}`],
					[t('workcalendar.allfrommonth3'), `${formatHours(s.overtime)} ${getOvertimeWord(s.overtime)}`],
					[
						settings?.leaveCalculationMode === 'hours'
							? t('workcalendar.allfrommonth4hours')
							: t('workcalendar.allfrommonth4'),
						settings?.leaveCalculationMode === 'hours'
							? `${s.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
							: `${s.leaveDays} (${s.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`,
					],
					[t('workcalendar.allfrommonth5'), s.otherAbsences],
				]
				if (s.holidaysCount > 0) {
					rows.push([t('workcalendar.allfrommonth6'), s.holidaysCount])
				}
			} else if (calendarView === 'all-months' && teamYearBreakdown.yearTotals) {
				const y = teamYearBreakdown.yearTotals
				rows = [
					[t('workcalendar.allfrommonth1'), y.totalWorkDays],
					[t('workcalendar.allfrommonth2'), `${formatHours(y.totalHours)} ${t('workcalendar.allfrommonthhours')}`],
					[t('workcalendar.allfrommonth3'), `${formatHours(y.overtime)} ${getOvertimeWord(y.overtime)}`],
					[
						settings?.leaveCalculationMode === 'hours'
							? t('workcalendar.allfrommonth4hours')
							: t('workcalendar.allfrommonth4'),
						settings?.leaveCalculationMode === 'hours'
							? `${y.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
							: `${y.leaveDays} (${y.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`,
					],
					[t('workcalendar.allfrommonth5'), y.otherAbsences],
				]
				if (y.holidaysCount > 0) {
					rows.push([t('workcalendar.allfrommonth6'), y.holidaysCount])
				}
			}

			const summary = getCurrentSummaryTotals()
			const generatedAt = new Date().toLocaleString(i18n.resolvedLanguage)
			const sheets = summary
				? [
					{
						name: 'Najważniejsze',
						rows: buildExecutiveExcelRows(summary, generatedAt),
						colWidths: [18, 28, 18, 46],
						title: 'Planopia · raport ewidencji',
						subtitle: `Okres: ${exportPeriodLabel} · ${generatedAt}`,
						executive: true,
					},
					{
						name: t('planslist.teamSummarySheetSummary') || 'Podsumowanie',
						rows: [header, ...rows],
						colWidths: [40, 28],
						title: 'Podsumowanie ewidencji',
						subtitle: `Okres: ${exportPeriodLabel}`,
					},
				]
				: [
					{
						name: t('planslist.teamSummarySheetSummary') || 'Podsumowanie',
						rows: [header, ...rows],
						colWidths: [40, 28],
						title: 'Podsumowanie ewidencji',
						subtitle: `Okres: ${exportPeriodLabel}`,
					},
				]

			if (calendarView === 'all-months' && teamYearBreakdown.months.length) {
				const th = [
					t('workcalendar.monthlabel'),
					t('workcalendar.allfrommonth1'),
					t('workcalendar.allfrommonth2'),
					t('workcalendar.allfrommonth3'),
					settings?.leaveCalculationMode === 'hours' ? t('workcalendar.allfrommonth4hours') : t('workcalendar.allfrommonth4'),
					t('workcalendar.allfrommonth5'),
				]
				const monthRows = teamYearBreakdown.months.map((m, idx) => {
					const monthName = new Date(currentYear, idx)
						.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
						.replace(/^./, (c) => c.toUpperCase())
					return [
						monthName,
						m.totalWorkDays,
						formatHours(m.totalHours),
						formatHours(m.overtime),
						settings?.leaveCalculationMode === 'hours'
							? m.leaveHours.toFixed(1)
							: `${m.leaveDays} (${m.leaveHours.toFixed(1)})`,
						m.otherAbsences,
					]
				})
				const yt = teamYearBreakdown.yearTotals
				if (yt) {
					monthRows.push([
						t('planslist.teamTableTotal'),
						yt.totalWorkDays,
						formatHours(yt.totalHours),
						formatHours(yt.overtime),
						settings?.leaveCalculationMode === 'hours'
							? yt.leaveHours.toFixed(1)
							: `${yt.leaveDays} (${yt.leaveHours.toFixed(1)})`,
						yt.otherAbsences,
					])
				}
				sheets.push({
					name: t('planslist.teamSummarySheetMonths') || 'Miesiące',
					rows: [th, ...monthRows],
					colWidths: [14, 12, 12, 12, 22, 14],
					title: t('planslist.teamMonthlyTableTitle'),
					subtitle: `Okres: ${exportPeriodLabel}`,
				})
			}

			if (teamActivityRows.length > 0) {
				sheets.push({
					name: t('workcalendar.activities.excel.sheetActivities'),
					rows: [
						[
							t('workcalendar.activities.excel.date'),
							t('workcalendar.activities.excel.employee'),
							t('workcalendar.activities.excel.activity'),
							t('workcalendar.activities.excel.hours'),
							t('workcalendar.activities.excel.quantity'),
							t('workcalendar.activities.excel.efficiency'),
							t('workcalendar.activities.excel.timeRange'),
						],
						...teamActivityRows.map(row => [
							row.date ? new Date(row.date).toLocaleDateString(i18n.resolvedLanguage) : '',
							row.userName,
							row.activityName,
							formatHours(row.hours),
							row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '',
							row.quantity > 0 && row.unit && row.hours > 0 ? `${Math.round((row.quantity / row.hours) * 100) / 100} ${row.unit}/h` : '',
							row.timeFrom && row.timeTo ? `${row.timeFrom}-${row.timeTo}` : '',
						]),
					],
					colWidths: [14, 22, 24, 10, 14, 14, 14],
					title: t('workcalendar.activities.excel.sheetActivities'),
					subtitle: `Okres: ${exportPeriodLabel}`,
				})
				sheets.push({
					name: t('workcalendar.activities.excel.summarySheet'),
					rows: [
						[t('workcalendar.activities.excel.employee'), t('workcalendar.activities.excel.activity'), t('workcalendar.activities.excel.hours'), t('workcalendar.activities.excel.quantity'), t('workcalendar.activities.excel.efficiency')],
						...teamActivitySummary.map(row => [
							row.userName,
							row.activityName,
							formatHours(row.hours),
							row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '',
							row.efficiency ? `${row.efficiency} ${row.unit}/h` : '',
						]),
					],
					colWidths: [22, 24, 10, 14, 14],
					title: t('workcalendar.activities.summaryTitle'),
					subtitle: `Okres: ${exportPeriodLabel}`,
				})
			}

			await downloadExcelWorkbook(sheets, `${exportFileNameBase()}.xlsx`)
		} catch (e) {
			console.error('handleExportSummaryExcel:', e)
		}
	}

	const handleExportSummaryPdf = async () => {
		try {
			const summary = getCurrentSummaryTotals()
			if (!summary) {
				window.alert(t('planslist.exportEmpty') || 'Brak danych.')
				return
			}

			const generatedAt = new Date().toLocaleString(i18n.resolvedLanguage)
			const content = [
				pdfExecutiveHeader(summary, generatedAt),
				...pdfKpiCards(summary),
				...pdfExecutiveConclusion(summary),
				...pdfInsightStrip(summary),
				...pdfTimeStructure(summary),
				...pdfMonthlyBars(),
				...pdfTopPerUserTable(),
				...pdfActivitySummaryTable(),
			]

			await downloadPdf(
				buildPdfDocument({
					content,
					pageOrientation: 'landscape',
					pageMargins: [28, 28, 28, 34],
					styles: {
						sectionTitle: { fontSize: 13, bold: true, color: reportTheme.ink },
						sectionSubtitle: { fontSize: 8, color: reportTheme.muted },
					},
					footer: (currentPage, pageCount) => ({
						columns: [
							{ text: 'Planopia', color: '#5d7186', fontSize: 8 },
							{ text: `${currentPage}/${pageCount}`, alignment: 'right', color: '#5d7186', fontSize: 8 },
						],
						margin: [28, 0, 28, 0],
					}),
					info: {
						title: 'Podsumowanie ewidencji',
						author: 'Planopia',
						subject: exportPeriodLabel,
					},
				}),
				`${exportFileNameBase()}.pdf`
			)
		} catch (e) {
			console.error('handleExportSummaryPdf:', e)
		}
	}

	const handleExportPerUserExcel = async () => {
		if (perUserSummaryRows.length === 0) {
			window.alert(t('planslist.exportEmpty') || 'Brak danych.')
			return
		}
		try {
			const leaveHeader =
				settings?.leaveCalculationMode === 'hours'
					? t('workcalendar.allfrommonth4hours')
					: t('workcalendar.allfrommonth4')
			const th = [
				t('planslist.columnEmployee'),
				t('workcalendar.allfrommonth1'),
				t('workcalendar.allfrommonth2'),
				t('workcalendar.allfrommonth3'),
				leaveHeader,
				t('workcalendar.allfrommonth5'),
			]
			const rows = perUserSummaryRows.map(({ name, totals: s }) => [
				name,
				s.totalWorkDays,
				formatHours(s.totalHours),
				formatHours(s.overtime),
				settings?.leaveCalculationMode === 'hours'
					? s.leaveHours.toFixed(1)
					: `${s.leaveDays} (${s.leaveHours.toFixed(1)})`,
				s.otherAbsences,
			])
			const footerRow = buildPerUserTotalsRow(perUserTableTotals, { compact: true })
			await downloadExcelWorkbook(
				[
					{
						name: t('planslist.teamPerUserSheetName') || 'Wg osób',
						rows: [
							th,
							...rows,
							...(footerRow ? [footerRow] : []),
						],
						colWidths: [28, 12, 12, 12, 22, 14],
						title: 'Według osób',
						subtitle: `Okres: ${exportPeriodLabel}`,
					},
				],
				`${exportFileNameBasePerUser()}.xlsx`
			)
		} catch (e) {
			console.error('handleExportPerUserExcel:', e)
		}
	}

	const handleExportPerUserPdf = async () => {
		if (perUserSummaryRows.length === 0) {
			window.alert(t('planslist.exportEmpty') || 'Brak danych.')
			return
		}
		try {
			const generatedAt = new Date().toLocaleString(i18n.resolvedLanguage)
			const { byHours } = getTopPerUserMetrics()
			const headers = [
				t('planslist.columnEmployee'),
				t('planslist.teamColShortWorkDays'),
				t('planslist.teamColShortHours'),
				t('planslist.teamColShortOt'),
				settings?.leaveCalculationMode === 'hours'
					? t('planslist.teamColShortLeave')
					: t('workcalendar.allfrommonth4'),
				t('planslist.teamColShortOther'),
			]
			const tableRows = perUserSummaryRows.map(({ name, totals: s }) => [
				name,
				String(s.totalWorkDays),
				`${formatHours(s.totalHours)} h`,
				`${formatHours(s.overtime)} h`,
				settings?.leaveCalculationMode === 'hours'
					? `${s.leaveHours.toFixed(1)} h`
					: `${s.leaveDays} (${s.leaveHours.toFixed(1)} h)`,
				String(s.otherAbsences),
			])
			const footerRow = buildPerUserTotalsRow(perUserTableTotals, { compact: false })
			const content = [
				pdfReportHeader({
					title: 'Według osób',
					subtitle: `Okres: ${exportPeriodLabel}`,
					side: [
						{ text: 'Największy udział czasu', fontSize: 8, color: reportTheme.headerEyebrow, bold: true },
						{ text: byHours?.name || '-', fontSize: 15, color: '#ffffff', bold: true, margin: [0, 5, 0, 0] },
						{ text: byHours ? `${formatHours(byHours.totals.totalHours)} h pracy` : 'Brak godzin w okresie', fontSize: 8, color: reportTheme.headerSubtitle, margin: [0, 4, 0, 0] },
						{ text: `Wygenerowano: ${generatedAt}`, fontSize: 7, color: '#93c5fd', margin: [0, 9, 0, 0] },
					],
				}),
				...pdfPeopleKpiCards(),
				...pdfHorizontalBars(
					'Największe wykorzystanie czasu',
					[...perUserSummaryRows]
						.sort((a, b) => safeNumber(b.totals.totalHours) - safeNumber(a.totals.totalHours))
						.slice(0, 8)
						.map(row => ({ name: row.name, hours: safeNumber(row.totals.totalHours) })),
					{ subtitle: 'Ranking osób według liczby godzin w wybranym okresie.', color: reportTheme.blue, limit: 8 }
				),
				pdfSectionTitle('Tabela osób', 'Pełne zestawienie osób dla wybranego okresu.'),
				pdfDataTableStyled(headers, tableRows, ['*', 48, 62, 62, 88, 54], footerRow),
			]
			await downloadPdf(
				buildPdfDocument({
					content,
					pageOrientation: 'landscape',
					pageMargins: [28, 28, 28, 34],
					styles: {
						sectionTitle: { fontSize: 13, bold: true, color: reportTheme.ink },
						sectionSubtitle: { fontSize: 8, color: reportTheme.muted },
					},
					footer: (currentPage, pageCount) => ({
						columns: [
							{ text: 'Planopia', color: '#5d7186', fontSize: 8 },
							{ text: `${currentPage}/${pageCount}`, alignment: 'right', color: '#5d7186', fontSize: 8 },
						],
						margin: [28, 0, 28, 0],
					}),
					info: {
						title: 'Według osób',
						author: 'Planopia',
						subject: exportPeriodLabel,
					},
				}),
				`${exportFileNameBasePerUser()}.pdf`
			)
		} catch (e) {
			console.error('handleExportPerUserPdf:', e)
		}
	}

	const handleExportOperationalExcel = async () => {
		if (visibleTaskSummary.length === 0 && visibleActivitySummary.length === 0) {
			window.alert(t('planslist.exportEmpty') || 'Brak danych.')
			return
		}
		try {
			const summary = getCurrentSummaryTotals()
			const generatedAt = new Date().toLocaleString(i18n.resolvedLanguage)
			const operationalTotals = getOperationalTotals()
			const sheets = []
			if (summary) {
				sheets.push({
					name: 'Najważniejsze',
					rows: buildExecutiveExcelRows(summary, generatedAt),
					colWidths: [18, 28, 18, 46],
					title: 'Planopia · raport operacyjny',
					subtitle: `Okres: ${exportPeriodLabel} · ${generatedAt}`,
					executive: true,
				})
			}
			sheets.push({
				name: 'Podsumowanie',
				rows: [
					['Wskaźnik', 'Wartość', 'Komentarz'],
					...(showOperationalTasks ? [['Godziny zadań', `${formatHours(operationalTotals.taskHours)} h`, `${operationalTotals.taskRows} pozycji według filtrów`]] : []),
					...(showOperationalActivities ? [
						['Godziny czynności', `${formatHours(operationalTotals.activityHours)} h`, `${operationalTotals.activityRows} pozycji według filtrów`],
						['Wykonanie', operationalTotals.quantityText, 'Suma zmierzonej pracy w czynnościach'],
						['Wydajność', operationalTotals.efficiencyText, 'Liczona, gdy występuje jedna jednostka wykonania'],
					] : []),
				],
				colWidths: [24, 24, 46],
				title: 'Podsumowanie zadań i czynności',
				subtitle: `Okres: ${exportPeriodLabel}`,
			})
			if (visibleTaskSummary.length > 0) {
				sheets.push({
					name: 'Zadania',
					rows: [
						[
							t('workcalendar.activities.excel.employee'),
							t('workcalendar.tasks.taskLabel'),
							t('workcalendar.activities.excel.hours'),
						],
						...[...visibleTaskSummary]
							.sort((a, b) => safeNumber(b.hours) - safeNumber(a.hours))
							.map(row => [
								row.userName,
								row.taskName,
								formatHours(row.hours),
							]),
					],
					colWidths: [26, 36, 12],
					title: 'Godziny według zadań',
					subtitle: `Okres: ${exportPeriodLabel}`,
				})
			}
			if (visibleActivitySummary.length > 0) {
				sheets.push({
					name: 'Czynności',
					rows: [
						[
							t('workcalendar.activities.excel.employee'),
							t('workcalendar.activities.excel.activity'),
							t('workcalendar.activities.excel.hours'),
							t('workcalendar.activities.excel.quantity'),
							t('workcalendar.activities.excel.efficiency'),
						],
						...[...visibleActivitySummary]
							.sort((a, b) => safeNumber(b.hours) - safeNumber(a.hours))
							.map(row => [
								row.userName,
								row.activityName,
								formatHours(row.hours),
								row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '',
								row.efficiency ? `${row.efficiency} ${row.unit}/h` : '',
							]),
					],
					colWidths: [26, 32, 12, 16, 16],
					title: 'Godziny według czynności',
					subtitle: `Okres: ${exportPeriodLabel}`,
				})
			}
			await downloadExcelWorkbook(sheets, `${exportFileNameBaseOperational()}.xlsx`)
		} catch (e) {
			console.error('handleExportOperationalExcel:', e)
		}
	}

	const handleExportOperationalPdf = async () => {
		if (visibleTaskSummary.length === 0 && visibleActivitySummary.length === 0) {
			window.alert(t('planslist.exportEmpty') || 'Brak danych.')
			return
		}
		try {
			const summary = getCurrentSummaryTotals()
			const generatedAt = new Date().toLocaleString(i18n.resolvedLanguage)
			const operationalTotals = getOperationalTotals()
			const content = [
				pdfReportHeader({
					title: 'Raport operacyjny',
					subtitle: `Okres: ${exportPeriodLabel}`,
					side: [
						{ text: 'Zakres danych', fontSize: 8, color: reportTheme.headerEyebrow, bold: true },
						{ text: `${formatHours(operationalTotals.taskHours)} h zadań`, fontSize: 12, color: '#ffffff', bold: true, margin: [0, 6, 0, 0] },
						{ text: `${formatHours(operationalTotals.activityHours)} h czynności`, fontSize: 12, color: '#ffffff', bold: true, margin: [0, 3, 0, 0] },
						{ text: `Wygenerowano: ${generatedAt}`, fontSize: 7, color: '#93c5fd', margin: [0, 9, 0, 0] },
					],
				}),
				...(summary ? pdfKpiCards(summary) : []),
				...pdfOperationalKpiCards(),
				...(summary ? pdfInsightStrip(summary) : []),
				...(summary ? pdfTimeStructure(summary) : []),
				...pdfHorizontalBars('Godziny według czynności', visibleActivitySummary.map(row => ({ name: row.activityName, hours: row.hours })), {
					subtitle: 'Największe obszary operacyjne i czynności konsumujące czas zespołu.',
					color: reportTheme.green,
					limit: 8,
				}),
				...pdfHorizontalBars('Godziny według zadań', visibleTaskSummary.map(row => ({ name: row.taskName, hours: row.hours })), {
					subtitle: 'Widok pracy przypisanej do zadań z tablic.',
					color: reportTheme.purple,
					limit: 8,
				}),
				...pdfOperationalTables(),
			]
			await downloadPdf(
				buildPdfDocument({
					content,
					pageOrientation: 'landscape',
					pageMargins: [28, 28, 28, 34],
					styles: {
						sectionTitle: { fontSize: 13, bold: true, color: reportTheme.ink },
						sectionSubtitle: { fontSize: 8, color: reportTheme.muted },
					},
					footer: (currentPage, pageCount) => ({
						columns: [
							{ text: 'Planopia', color: '#5d7186', fontSize: 8 },
							{ text: `${currentPage}/${pageCount}`, alignment: 'right', color: '#5d7186', fontSize: 8 },
						],
						margin: [28, 0, 28, 0],
					}),
					info: {
						title: 'Raport operacyjny',
						author: 'Planopia',
						subject: exportPeriodLabel,
					},
				}),
				`${exportFileNameBaseOperational()}.pdf`
			)
		} catch (e) {
			console.error('handleExportOperationalPdf:', e)
		}
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
		if (!calendarRef.current) return
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

	const renderAllMonthsCalendars = () => {
		return Array.from({ length: 12 }, (__, month) => (
			<div
				key={`${currentYear}-${month}`}
				className="month-calendar allleaveplans all-leaveplans-all-months"
				style={{
					margin: '10px',
					border: '1px solid #ddd',
					borderRadius: '8px',
					background: '#fff',
				}}
			>
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
						...formattedWorkdayEvents.filter((ev) => {
							const d = new Date(ev.start)
							return d.getMonth() === month && d.getFullYear() === currentYear
						}),
						...buildLeaveEventsForMonth(month, currentYear),
						...holidaysForYear
							.filter((holiday) => {
								const holidayDate = new Date(holiday.date)
								return holidayDate.getMonth() === month && holidayDate.getFullYear() === currentYear
							})
							.map((holiday) => ({
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

	const renderSummaryBlock = (totals, { showHolidayLine = true } = {}) => {
		if (!totals) return null
		return (
			<div
				style={{
					marginTop: '4px',
					padding: '14px 16px',
					backgroundColor: '#f8fafb',
					border: '1px solid #e1e8ed',
					borderRadius: '8px',
					fontSize: '14px',
					color: '#2c3e50',
					lineHeight: 1.55,
				}}
			>
				<p style={{ margin: '0 0 6px 0' }}>
					{t('workcalendar.allfrommonth1')} <strong>{totals.totalWorkDays}</strong>
				</p>
				<p style={{ margin: '0 0 6px 0' }}>
					{t('workcalendar.allfrommonth2')}{' '}
					<strong>
						{formatHours(totals.totalHours)} {t('workcalendar.allfrommonthhours')}
					</strong>
				</p>
				<p style={{ margin: '0 0 6px 0' }}>
					{t('workcalendar.allfrommonth3')}{' '}
					<strong>
						{formatHours(totals.overtime)} {getOvertimeWord(totals.overtime)}
					</strong>
				</p>
				<p style={{ margin: '0 0 6px 0' }}>
					{settings?.leaveCalculationMode === 'hours' ? (
						<>
							{t('workcalendar.allfrommonth4hours')}:{' '}
							<strong>
								{totals.leaveHours.toFixed(1)} {t('workcalendar.allfrommonthhours')}
							</strong>
						</>
					) : (
						<>
							{t('workcalendar.allfrommonth4')}{' '}
							<strong>
								{totals.leaveDays} ({totals.leaveHours.toFixed(1)} {t('workcalendar.allfrommonthhours')})
							</strong>
						</>
					)}
				</p>
				{showHolidayLine && totals.holidaysCount > 0 && (
					<p style={{ margin: '0 0 6px 0' }}>
						{t('workcalendar.allfrommonth6')} <strong>{totals.holidaysCount}</strong>
					</p>
				)}
				<p style={{ margin: 0 }}>
					{t('workcalendar.allfrommonth5')} <strong>{totals.otherAbsences}</strong>
				</p>
			</div>
		)
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
							value={calendarView === 'all-months' ? 'all-months' : currentMonth}
							onChange={handleMonthSelect}
							style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
								className="calendar-month-select focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
							<option value="all-months">{t('planslist.allMonths') || 'Wszystkie miesiące'}</option>
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{new Date(0, i)
										.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
											.replace(/^./, (str) => str.toUpperCase())}
								</option>
							))}
						</select>
						<select
							value={currentYear}
							onChange={handleYearSelect}
							style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
							className="focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
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
									style={{
										padding: '8px 12px',
										border: '1px solid #bdc3c7',
										borderRadius: '6px',
										backgroundColor: 'white',
										cursor: 'pointer',
										fontSize: '18px',
										fontWeight: '600',
										color: '#495057',
										transition: 'all 0.2s ease',
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
										transition: 'all 0.2s ease',
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
							</>
						)}
						{canFilter && (
							<button
								type="button"
								onClick={() => setFilterModalOpen(true)}
								className="filter-button"
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
								<img
									src="/img/filter.png"
									alt="Filtrowanie"
									style={{ width: '20px', height: '20px', filter: 'brightness(0) invert(1)', pointerEvents: 'none' }}
								/>
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
								...formattedWorkdayEvents,
								...acceptedLeaveRequestsForMonth,
									...holidaysForMonth.map((holiday) => ({
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
							ref={calendarRef}
							datesSet={handleMonthChange}
						/>
						</div>
					) : (
						<div
							className="all-months-calendar-container"
							style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'flex-start' }}
						>
							{renderAllMonthsCalendars()}
						</div>
					)}

					<div style={{ marginTop: '28px', padding: '0 4px' }}>
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
								{t('planslist.teamSummaryTitle')}
							</h4>
							<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
								<button type="button" onClick={handleExportSummaryExcel} style={exportExcelButtonStyle}>
									{t('planslist.exportExcel')}
								</button>
								<button type="button" onClick={handleExportSummaryPdf} style={exportPdfButtonStyle}>
									{t('planslist.exportPdf')}
								</button>
							</div>
						</div>
						<p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#6c757d' }}>
							{t('planslist.exportPeriod')}: <strong>{exportPeriodLabel}</strong>
						</p>
						{calendarView === 'single' && teamSummaryCurrentMonth && renderSummaryBlock(teamSummaryCurrentMonth)}
						{calendarView === 'all-months' && teamYearBreakdown.yearTotals && (
							<>
								<p style={{ margin: '24px 0 10px 0', fontSize: '15px', fontWeight: 600, color: '#2c3e50' }}>
									{t('planslist.teamYearTotalsIntro', { year: currentYear })}
								</p>
								{renderSummaryBlock(teamYearBreakdown.yearTotals)}
								<h5 style={{ margin: '20px 0 10px 0', color: '#2c3e50', fontSize: '15px', fontWeight: 600 }}>
									{t('planslist.teamMonthlyTableTitle')}
								</h5>
								<div style={{ overflowX: 'auto', border: '1px solid #e1e8ed', borderRadius: '8px', backgroundColor: '#fff' }}>
									<table
										style={{
											width: '100%',
											borderCollapse: 'collapse',
											fontSize: '13px',
											minWidth: '640px',
										}}
									>
										<thead>
											<tr style={{ backgroundColor: '#f4f6f8', borderBottom: '2px solid #dee2e6' }}>
												<th style={{ textAlign: 'left', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.monthlabel')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth1')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth2')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth3')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{settings?.leaveCalculationMode === 'hours'
														? t('workcalendar.allfrommonth4hours')
														: t('workcalendar.allfrommonth4')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth5')}
												</th>
											</tr>
										</thead>
										<tbody>
											{teamYearBreakdown.months.map((m, idx) => (
												<tr key={idx} style={{ borderBottom: '1px solid #eef2f5' }}>
													<td style={{ padding: '8px 10px' }}>
														{new Date(currentYear, idx)
															.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
															.replace(/^./, (c) => c.toUpperCase())}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>{m.totalWorkDays}</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>
														{formatHours(m.totalHours)} {t('workcalendar.allfrommonthhours')}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>
														{formatHours(m.overtime)} {getOvertimeWord(m.overtime)}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>
														{settings?.leaveCalculationMode === 'hours'
															? `${m.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
															: `${m.leaveDays} (${m.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>{m.otherAbsences}</td>
												</tr>
											))}
											{teamYearBreakdown.yearTotals && (
												<tr style={{ backgroundColor: '#f0f4f8', fontWeight: 700, borderTop: '2px solid #dee2e6' }}>
													<td style={{ padding: '10px' }}>{t('planslist.teamTableTotal')}</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{teamYearBreakdown.yearTotals.totalWorkDays}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{formatHours(teamYearBreakdown.yearTotals.totalHours)} {t('workcalendar.allfrommonthhours')}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{formatHours(teamYearBreakdown.yearTotals.overtime)}{' '}
														{getOvertimeWord(teamYearBreakdown.yearTotals.overtime)}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{settings?.leaveCalculationMode === 'hours'
															? `${teamYearBreakdown.yearTotals.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
															: `${teamYearBreakdown.yearTotals.leaveDays} (${teamYearBreakdown.yearTotals.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{teamYearBreakdown.yearTotals.otherAbsences}
													</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</>
						)}

						{perUserSummaryRows.length > 0 && (
							<>
								<div
									style={{
										display: 'flex',
										flexWrap: 'wrap',
										alignItems: 'center',
										justifyContent: 'space-between',
										gap: '10px',
										marginTop: '28px',
										marginBottom: '12px',
										paddingTop: '20px',
										borderTop: '1px solid #e1e8ed',
									}}
								>
									<div>
										<h5 style={{ margin: 0, color: '#2c3e50', fontSize: '16px', fontWeight: 600 }}>
											{t('planslist.teamPerUserTitle')}
										</h5>
										<p style={{ margin: '6px 0 0 0', fontSize: '13px', color: '#6c757d' }}>
											{t('planslist.teamPerUserSubtitle')}
										</p>
									</div>
									<div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
										<button type="button" onClick={handleExportPerUserExcel} style={exportExcelButtonStyle}>
											{t('planslist.exportExcelPerUser')}
										</button>
										<button type="button" onClick={handleExportPerUserPdf} style={exportPdfButtonStyle}>
											{t('planslist.exportPdfPerUser')}
										</button>
									</div>
								</div>
								<div
									style={{
										overflowX: 'auto',
										border: '1px solid #e1e8ed',
										borderRadius: '8px',
										backgroundColor: '#fff',
									}}
								>
									<table
										style={{
											width: '100%',
											borderCollapse: 'collapse',
											fontSize: '13px',
											minWidth: '720px',
										}}
									>
										<thead>
											<tr style={{ backgroundColor: '#f4f6f8', borderBottom: '2px solid #dee2e6' }}>
												<th style={{ textAlign: 'left', padding: '8px 10px', color: '#2c3e50' }}>
													{t('planslist.columnEmployee')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth1')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth2')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth3')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{settings?.leaveCalculationMode === 'hours'
														? t('workcalendar.allfrommonth4hours')
														: t('workcalendar.allfrommonth4')}
												</th>
												<th style={{ textAlign: 'right', padding: '8px 10px', color: '#2c3e50' }}>
													{t('workcalendar.allfrommonth5')}
												</th>
											</tr>
										</thead>
										<tbody>
											{perUserSummaryRows.map((row) => (
												<tr key={row.userId} style={{ borderBottom: '1px solid #eef2f5' }}>
													<td style={{ padding: '8px 10px' }}>{row.name}</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.totals.totalWorkDays}</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>
														{formatHours(row.totals.totalHours)} {t('workcalendar.allfrommonthhours')}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>
														{formatHours(row.totals.overtime)} {getOvertimeWord(row.totals.overtime)}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>
														{formatPerUserLeaveCell(row.totals)}
													</td>
													<td style={{ padding: '8px 10px', textAlign: 'right' }}>{row.totals.otherAbsences}</td>
												</tr>
											))}
										</tbody>
										{perUserTableTotals && (
											<tfoot>
												<tr
													style={{
														backgroundColor: '#f0f4f8',
														fontWeight: 700,
														borderTop: '2px solid #dee2e6',
													}}
												>
													<td style={{ padding: '10px' }}>{t('planslist.teamTableTotal')}</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{perUserTableTotals.totalWorkDays}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{formatHours(perUserTableTotals.totalHours)}{' '}
														{t('workcalendar.allfrommonthhours')}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{formatHours(perUserTableTotals.overtime)}{' '}
														{getOvertimeWord(perUserTableTotals.overtime)}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{formatPerUserLeaveCell(perUserTableTotals)}
													</td>
													<td style={{ padding: '10px', textAlign: 'right' }}>
														{perUserTableTotals.otherAbsences}
													</td>
												</tr>
											</tfoot>
										)}
									</table>
								</div>
							</>
						)}
						{(visibleTaskSummary.length > 0 || visibleActivitySummary.length > 0) && (
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									gap: '12px',
									marginTop: '28px',
									paddingTop: '18px',
									borderTop: '1px solid #e5e7eb',
									flexWrap: 'wrap',
								}}>
								<div>
									<h4 style={{ margin: 0, color: '#0f2746', fontSize: '18px', fontWeight: 700 }}>
										Raport zadań i czynności
									</h4>
									<p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '13px' }}>
										Eksportuje poniższe dane dla okresu: <strong>{exportPeriodLabel}</strong>.
									</p>
								</div>
								<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
									<button type="button" onClick={handleExportOperationalExcel} style={exportExcelButtonStyle}>
										Eksport do Excel
									</button>
									<button type="button" onClick={handleExportOperationalPdf} style={exportPdfButtonStyle}>
										Eksport do PDF
									</button>
								</div>
							</div>
						)}
						{(teamHasWorkActivities({ workActivities }) || (tasksModuleEnabled && filterableTasks.length > 0)) && (
							<div
								style={{
									marginTop: '14px',
									padding: '14px',
									border: '1px solid #e5edf5',
									borderRadius: '10px',
									background: '#fbfdff',
								}}>
								<h5 style={{ margin: '0 0 10px', color: '#0f2746', fontSize: '15px', fontWeight: 700 }}>
									Filtry zadań i czynności
								</h5>
								{teamHasWorkActivities({ workActivities }) && (
									<ActivityFilterBar
										activities={enabledWorkActivities}
										selectedIds={selectedActivityIds}
										onChange={setSelectedActivityIds}
									/>
								)}
								{tasksModuleEnabled && filterableTasks.length > 0 && (
									<TaskFilterBar
										tasks={filterableTasks}
										selectedIds={selectedTaskIds}
										onChange={setSelectedTaskIds}
									/>
								)}
							</div>
						)}
						{(visibleTaskSummary.length > 0 || visibleActivitySummary.length > 0) && (() => {
							const totals = getOperationalTotals()
							const cards = [
								...(showOperationalTasks ? [{ label: 'Godziny zadań', value: `${formatHours(totals.taskHours)} h`, hint: `${totals.taskRows} pozycji` }] : []),
								...(showOperationalActivities ? [
									{ label: 'Godziny czynności', value: `${formatHours(totals.activityHours)} h`, hint: `${totals.activityRows} pozycji` },
									{ label: 'Wykonanie', value: totals.quantityText, hint: 'zmierzona praca' },
									{ label: 'Wydajność', value: totals.efficiencyText, hint: 'łączna dla jednostki' },
								] : []),
							]
							return (
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
										gap: '10px',
										marginTop: '14px',
									}}>
									{cards.map(card => (
										<div
											key={card.label}
											style={{
												padding: '12px',
												border: '1px solid #dbe7f2',
												borderRadius: '10px',
												background: '#fff',
												boxShadow: '0 4px 14px rgba(15, 42, 74, 0.04)',
											}}>
											<div style={{ color: '#64748b', fontSize: '12px', fontWeight: 700 }}>{card.label}</div>
											<div style={{ marginTop: '5px', color: '#0f2746', fontSize: '18px', fontWeight: 800 }}>{card.value}</div>
											<div style={{ marginTop: '3px', color: '#64748b', fontSize: '12px' }}>{card.hint}</div>
										</div>
									))}
								</div>
							)
						})()}
						{visibleTaskSummary.length > 0 && (
							<div style={{ marginTop: '24px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
								<h5 style={{ margin: '0 0 10px', color: '#2c3e50', fontSize: '15px', fontWeight: 600 }}>
									{t('workcalendar.tasks.summaryTitle')}
									{selectedTaskIds.length > 0
										? ` · ${getTaskFilterLabel(selectedTaskIds, filterableTasks, t)}`
										: ''}
								</h5>
								<div style={{ overflowX: 'auto' }}>
									<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
										<thead>
											<tr style={{ borderBottom: '1px solid #dee2e6' }}>
												<th style={{ textAlign: 'left', padding: '6px 8px' }}>{t('workcalendar.activities.excel.employee')}</th>
												<th style={{ textAlign: 'left', padding: '6px 8px' }}>{t('workcalendar.tasks.taskLabel')}</th>
												<th style={{ textAlign: 'right', padding: '6px 8px' }}>{t('workcalendar.activities.excel.hours')}</th>
											</tr>
										</thead>
										<tbody>
											{visibleTaskSummary.map(row => (
												<tr key={`${row.userId}-${row.taskId}`}>
													<td style={{ padding: '6px 8px' }}>{row.userName}</td>
													<td style={{ padding: '6px 8px' }}>{row.taskName}</td>
													<td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatHours(row.hours)}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
						{visibleActivitySummary.length > 0 && (
							<div style={{ marginTop: '24px', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
								<h5 style={{ margin: '0 0 10px', color: '#2c3e50', fontSize: '15px', fontWeight: 600 }}>
									{t('workcalendar.activities.summaryTitle')}
									{selectedActivityIds.length > 0
										? ` · ${getActivityFilterLabel(selectedActivityIds, enabledWorkActivities, i18n.language, t)}`
										: ''}
								</h5>
								<div style={{ overflowX: 'auto' }}>
									<table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
										<thead>
											<tr style={{ borderBottom: '1px solid #dee2e6' }}>
												<th style={{ textAlign: 'left', padding: '6px 8px' }}>{t('workcalendar.activities.excel.employee')}</th>
												<th style={{ textAlign: 'left', padding: '6px 8px' }}>{t('workcalendar.activities.excel.activity')}</th>
												<th style={{ textAlign: 'right', padding: '6px 8px' }}>{t('workcalendar.activities.excel.hours')}</th>
												<th style={{ textAlign: 'right', padding: '6px 8px' }}>{t('workcalendar.activities.excel.quantity')}</th>
												<th style={{ textAlign: 'right', padding: '6px 8px' }}>{t('workcalendar.activities.excel.efficiency')}</th>
											</tr>
										</thead>
										<tbody>
											{visibleActivitySummary.map(row => (
												<tr key={`${row.userId}-${row.activityId}`}>
													<td style={{ padding: '6px 8px' }}>{row.userName}</td>
													<td style={{ padding: '6px 8px' }}>{row.activityName}</td>
													<td style={{ padding: '6px 8px', textAlign: 'right' }}>{formatHours(row.hours)}</td>
													<td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '—'}</td>
													<td style={{ padding: '6px 8px', textAlign: 'right' }}>{row.efficiency ? `${row.efficiency} ${row.unit}/h` : '—'}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						)}
					</div>

					{/* Modal filtrowania — Admin, HR, Przełożony (lista z API) */}
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

							<div style={{ marginBottom: '20px' }}>
								<h3 style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '18px', fontWeight: '600' }}>
									{t('planslist.calendarView') || 'Widok kalendarza'}
								</h3>
								<div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											cursor: 'pointer',
											padding: '8px 12px',
											borderRadius: '6px',
											backgroundColor: calendarView === 'single' ? '#ecfdf5' : '#f8f9fa',
											border: '1px solid',
											borderColor: calendarView === 'single' ? '#00a846' : '#e9ecef',
										}}
									>
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
									<label
										style={{
											display: 'flex',
											alignItems: 'center',
											cursor: 'pointer',
											padding: '8px 12px',
											borderRadius: '6px',
											backgroundColor: calendarView === 'all-months' ? '#ecfdf5' : '#f8f9fa',
											border: '1px solid',
											borderColor: calendarView === 'all-months' ? '#00a846' : '#e9ecef',
										}}
									>
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

							{teamHasWorkActivities({ workActivities }) && (
								<ActivityFilterBar
									activities={enabledWorkActivities}
									selectedIds={selectedActivityIds}
									onChange={setSelectedActivityIds}
								/>
							)}
							{tasksModuleEnabled && filterableTasks.length > 0 && (
								<TaskFilterBar
									tasks={filterableTasks}
									selectedIds={selectedTaskIds}
									onChange={setSelectedTaskIds}
								/>
							)}

							{/* Filtrowanie użytkowników */}
							<div style={{ marginBottom: '20px' }}>
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

export default AdminUserList
