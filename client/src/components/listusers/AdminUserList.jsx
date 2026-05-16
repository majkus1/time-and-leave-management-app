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
	pdfLabelValueLines,
	pdfTitleBlock,
} from '../../utils/export/pdfDownload'
import { computeTeamTotalsForMonth, aggregateYearTeamTotals } from '../../utils/teamWorkCalendarSummary'
import { exportExcelButtonStyle, exportPdfButtonStyle } from '../../utils/export/exportButtonStyles'

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
		if (!filteredWorkdays || filteredWorkdays.length === 0) return []

		// Grupuj workdays po dacie i użytkowniku
		const workdaysByDateAndUser = {}
		
		filteredWorkdays.forEach(workday => {
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
			workdays: filteredWorkdays,
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
		filteredWorkdays,
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
				workdays: filteredWorkdays,
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
	}, [settings, filteredWorkdays, filteredAcceptedRequests, currentYear, t, i18n, generateDateRangeForCalendar])

	/** Podsumowanie skrócone per pracownik (te same filtry i okres co powyżej). */
	const perUserSummaryRows = useMemo(() => {
		if (!settings) return []
		return filteredUsers.map((user) => {
			const uid = user._id.toString()
			const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || uid
			const userWds = filteredWorkdays.filter((w) => workdayUserIdString(w) === uid)
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
		filteredWorkdays,
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
		if (calendarView === 'single') {
			return `team_timesheet_${currentYear}_${String(currentMonth + 1).padStart(2, '0')}`
		}
		return `team_timesheet_year_${currentYear}`
	}

	const exportFileNameBasePerUser = () => `${exportFileNameBase()}_per_user`

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

			const sheets = [
				{
					name: t('planslist.teamSummarySheetSummary') || 'Podsumowanie',
					rows: [header, ...rows],
					colWidths: [40, 28],
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
				})
			}

			await downloadExcelWorkbook(sheets, `${exportFileNameBase()}.xlsx`)
		} catch (e) {
			console.error('handleExportSummaryExcel:', e)
		}
	}

	const handleExportSummaryPdf = async () => {
		try {
			const content = [
				...pdfTitleBlock(
					t('planslist.teamSummaryTitle'),
					`${t('planslist.exportPeriod')}: ${exportPeriodLabel}`
				),
			]

			if (calendarView === 'single' && teamSummaryCurrentMonth) {
				const s = teamSummaryCurrentMonth
				const lines = [
					{ label: t('workcalendar.allfrommonth1'), value: s.totalWorkDays },
					{
						label: t('workcalendar.allfrommonth2'),
						value: `${formatHours(s.totalHours)} ${t('workcalendar.allfrommonthhours')}`,
					},
					{
						label: t('workcalendar.allfrommonth3'),
						value: `${formatHours(s.overtime)} ${getOvertimeWord(s.overtime)}`,
					},
					{
						label:
							settings?.leaveCalculationMode === 'hours'
								? t('workcalendar.allfrommonth4hours')
								: t('workcalendar.allfrommonth4'),
						value:
							settings?.leaveCalculationMode === 'hours'
								? `${s.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
								: `${s.leaveDays} (${s.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`,
					},
					{ label: t('workcalendar.allfrommonth5'), value: s.otherAbsences },
				]
				if (s.holidaysCount > 0) {
					lines.push({ label: t('workcalendar.allfrommonth6'), value: s.holidaysCount })
				}
				content.push(...pdfLabelValueLines(lines))
			} else if (calendarView === 'all-months' && teamYearBreakdown.yearTotals) {
				const ytot = teamYearBreakdown.yearTotals
				const lines = [
					{ label: t('workcalendar.allfrommonth1'), value: ytot.totalWorkDays },
					{
						label: t('workcalendar.allfrommonth2'),
						value: `${formatHours(ytot.totalHours)} ${t('workcalendar.allfrommonthhours')}`,
					},
					{
						label: t('workcalendar.allfrommonth3'),
						value: `${formatHours(ytot.overtime)} ${getOvertimeWord(ytot.overtime)}`,
					},
					{
						label:
							settings?.leaveCalculationMode === 'hours'
								? t('workcalendar.allfrommonth4hours')
								: t('workcalendar.allfrommonth4'),
						value:
							settings?.leaveCalculationMode === 'hours'
								? `${ytot.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
								: `${ytot.leaveDays} (${ytot.leaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`,
					},
					{ label: t('workcalendar.allfrommonth5'), value: ytot.otherAbsences },
				]
				if (ytot.holidaysCount > 0) {
					lines.push({ label: t('workcalendar.allfrommonth6'), value: ytot.holidaysCount })
				}
				content.push(...pdfLabelValueLines(lines))
				content.push({ text: t('planslist.teamMonthlyTableTitle'), fontSize: 11, bold: true, margin: [0, 10, 0, 4] })
				const headers = [
					t('workcalendar.monthlabel'),
					t('planslist.teamColShortWorkDays'),
					t('planslist.teamColShortHours'),
					t('planslist.teamColShortOt'),
					t('planslist.teamColShortLeave'),
					t('planslist.teamColShortOther'),
				]
				const tableRows = teamYearBreakdown.months.map((m, idx) => {
					const monthName = new Date(currentYear, idx).toLocaleString(i18n.resolvedLanguage, {
						month: 'short',
					})
					return [
						monthName,
						String(m.totalWorkDays),
						formatHours(m.totalHours),
						formatHours(m.overtime),
						settings?.leaveCalculationMode === 'hours' ? m.leaveHours.toFixed(1) : String(m.leaveDays),
						String(m.otherAbsences),
					]
				})
				content.push(pdfDataTable(headers, tableRows, [22, 14, 14, 14, 24, 16]))
			}

			await downloadPdf(buildPdfDocument({ content }), `${exportFileNameBase()}.pdf`)
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
							[t('planslist.teamPerUserTitle')],
							[`${t('planslist.exportPeriod')}: ${exportPeriodLabel}`],
							[],
							th,
							...rows,
							...(footerRow ? [footerRow] : []),
						],
						colWidths: [28, 12, 12, 12, 22, 14],
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
				formatHours(s.totalHours),
				formatHours(s.overtime),
				settings?.leaveCalculationMode === 'hours'
					? s.leaveHours.toFixed(1)
					: String(s.leaveDays),
				String(s.otherAbsences),
			])
			const footerRow = buildPerUserTotalsRow(perUserTableTotals, { compact: true })
			const content = [
				...pdfTitleBlock(
					t('planslist.teamPerUserTitle'),
					`${t('planslist.exportPeriod')}: ${exportPeriodLabel}`
				),
				pdfDataTable(headers, tableRows, [52, 22, 28, 28, 40, 24], footerRow),
			]
			await downloadPdf(
				buildPdfDocument({ content, pageOrientation: 'landscape' }),
				`${exportFileNameBasePerUser()}.pdf`
			)
		} catch (e) {
			console.error('handleExportPerUserPdf:', e)
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
						{calendarView === 'single' && (
						<select
							value={currentMonth}
							onChange={handleMonthSelect}
							style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }}
								className="focus:outline-none focus:ring-2 focus:ring-blue-500"
							>
							{Array.from({ length: 12 }, (_, i) => (
								<option key={i} value={i}>
									{new Date(0, i)
										.toLocaleString(i18n.resolvedLanguage, { month: 'long' })
											.replace(/^./, (str) => str.toUpperCase())}
								</option>
							))}
						</select>
						)}
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
								<p style={{ margin: '0 0 10px 0', fontSize: '15px', fontWeight: 600, color: '#2c3e50' }}>
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
											backgroundColor: calendarView === 'single' ? '#e8f4f8' : '#f8f9fa',
											border: '1px solid',
											borderColor: calendarView === 'single' ? '#3498db' : '#e9ecef',
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
											backgroundColor: calendarView === 'all-months' ? '#e8f4f8' : '#f8f9fa',
											border: '1px solid',
											borderColor: calendarView === 'all-months' ? '#3498db' : '#e9ecef',
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

							{/* Filtrowanie użytkowników */}
							<div style={{ marginBottom: '20px' }}>
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
