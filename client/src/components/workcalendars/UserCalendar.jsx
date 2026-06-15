import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from 'react-modal'
import Sidebar from '../dashboard/Sidebar'
import { downloadExcelWorkbook } from '../../utils/export/excelDownload'
import { buildPdfDocument, downloadPdf } from '../../utils/export/pdfDownload'
import { buildReportFilename } from '../../utils/export/reportFilename'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useUser } from '../../hooks/useUsers'
import { useBulkFillWorkdays, useClearWorkdaysForMonth, useCreateWorkdayForUser, useDeleteWorkdayForUser, useReviewWorkdayForUser, useUpdateWorkdayForUser, useUserWorkdays } from '../../hooks/useWorkdays'
import { useCalendarConfirmation, useCalendarConfirmationDetails, useToggleCalendarConfirmation } from '../../hooks/useCalendar'
import { useUserAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { useActiveTimer } from '../../hooks/useTimer'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import WorkSessionList from './WorkSessionList'
import { useFreemiumAccess } from '../../hooks/useFreemiumAccess'
import { useAlert } from '../../context/AlertContext'
import BulkFillWorkdaysModal from './BulkFillWorkdaysModal'
import ActivityFilterBar from './ActivityFilterBar'
import TaskFilterBar from './TaskFilterBar'
import WorkdayHoursWithActivities from './WorkdayHoursWithActivities'
import { useWorkActivities } from '../../hooks/useWorkActivities'
import { teamHasWorkActivities, getEnabledWorkActivities } from '../../utils/workActivities'
import {
	blocksFromWorkday,
	createDefaultActivityBlock,
	serializeActivityBlocks,
	sumBlockHours,
	validateActivityBlocksClient,
	buildRealTimeFromBlocks,
} from '../../utils/manualActivityBlocks'
import {
	createDefaultTaskBlock,
	blocksFromWorkdayTasks,
	serializeTaskBlocks,
	sumTaskBlockHours,
	validateTaskBlocksClient,
	buildRealTimeFromTaskBlocks,
} from '../../utils/manualTaskBlocks'
import {
	isCalendarFilterActive,
	workdayMatchesCalendarFilters,
	getFilteredCalendarHours,
	buildFilteredRealTimeForCalendar,
	formatCalendarBreakdown,
} from '../../utils/workCalendarFilters'
import {
	formatHoursDecimal,
	formatWorkDuration,
	roundToHalfHour,
} from '../../utils/formatWorkDuration'
import {
	collectTasksFromWorkdays,
	getTaskFilterLabel,
	buildTaskTitlesMap,
	flattenWorkdayTaskRows,
	aggregateTaskHours,
	workdayMatchesTaskFilter,
} from '../../utils/workTaskAggregation'
import { useBillingEntitlements } from '../../hooks/useBilling'
import { canShowBillingModuleNav } from '../../utils/moduleNavAccess'
import { useTimesheetTasks } from '../../hooks/useTimesheetTasks'
import {
	filterWorkdaysByActivities,
	flattenWorkdayActivityRows,
	aggregateActivityHours,
	formatActivityBreakdown,
	getFilteredActivityHours,
	getFilteredManualActivityHours,
	workdayMatchesActivityFilter,
	buildFilteredRealTimeFromEntries,
	getActivityFilterLabel,
} from '../../utils/workActivityAggregation'

const halfHourOptions = Array.from({ length: 48 }, (_, index) => {
	const totalMinutes = index * 30
	const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
	const minutes = String(totalMinutes % 60).padStart(2, '0')
	return `${hours}:${minutes}`
})

const parseWorkTimeRange = (value) => {
	const normalizeTime = (time) => {
		const match = String(time || '').trim().match(/^(\d{1,2}):([0-5]\d)$/)
		if (!match) return ''
		return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
	}
	const match = String(value || '').trim().match(/^(\d{1,2}:[0-5]\d)\s*-\s*(\d{1,2}:[0-5]\d)$/)
	return {
		timeFrom: match ? normalizeTime(match[1]) : '',
		timeTo: match ? normalizeTime(match[2]) : '',
	}
}

const calculateHoursFromRange = (timeFrom, timeTo) => {
	if (!timeFrom || !timeTo) return ''
	const [fromH, fromM] = timeFrom.split(':').map(Number)
	const [toH, toM] = timeTo.split(':').map(Number)
	if ([fromH, fromM, toH, toM].some(Number.isNaN)) return ''
	let minutes = (toH * 60 + toM) - (fromH * 60 + fromM)
	if (minutes < 0) minutes += 24 * 60
	if (minutes === 0) return ''
	const hours = Math.round((minutes / 60) * 2) / 2
	return Number.isInteger(hours) ? String(hours) : String(hours)
}

function UserCalendar() {
	const { userId } = useParams()
	const [totalHours, setTotalHours] = useState(0)
	const [totalLeaveDays, setTotalLeaveDays] = useState(0)
	const [totalLeaveHours, setTotalLeaveHours] = useState(0)
	const [totalWorkDays, setTotalWorkDays] = useState(0)
	const [totalOtherAbsences, setTotalOtherAbsences] = useState(0)
	const [totalHolidays, setTotalHolidays] = useState(0)
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [additionalHours, setAdditionalHours] = useState(0)
	const [isExportingExcel, setIsExportingExcel] = useState(false)
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState('')
	const [editingWorkday, setEditingWorkday] = useState(null)
	const [hoursWorked, setHoursWorked] = useState('')
	const [additionalWorked, setAdditionalWorked] = useState('')
	const [realTimeDayWorked, setRealTimeDayWorked] = useState('')
	const [workTimeFrom, setWorkTimeFrom] = useState('')
	const [workTimeTo, setWorkTimeTo] = useState('')
	const [absenceType, setAbsenceType] = useState('')
	const [notes, setNotes] = useState('')
	const [formError, setFormError] = useState('')
	const [selectedWorkHoursIndex, setSelectedWorkHoursIndex] = useState(0)
	const [bulkFillModalOpen, setBulkFillModalOpen] = useState(false)
	const [splitByActivity, setSplitByActivity] = useState(false)
	const [activityBlocks, setActivityBlocks] = useState([createDefaultActivityBlock()])
	const [selectedActivityIds, setSelectedActivityIds] = useState([])
	const [splitByTask, setSplitByTask] = useState(false)
	const [taskBlocks, setTaskBlocks] = useState([createDefaultTaskBlock()])
	const [selectedTaskIds, setSelectedTaskIds] = useState([])
	const pdfRef = useRef()
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	const { isLoading: freemiumEntLoading, freemiumTier } = useFreemiumAccess({ enabled: true })
	const allowTimerLeaveApis = !freemiumEntLoading && !freemiumTier
	const { data: entitlements, isPending: entitlementsLoading } = useBillingEntitlements()
	const tasksModuleEnabled = canShowBillingModuleNav(entitlements, 'tasks', entitlementsLoading)
	const { data: timesheetTasks = [] } = useTimesheetTasks(userId, { enabled: tasksModuleEnabled && !!userId })

	// Funkcja do poprawnej odmiany słowa "nadgodziny" w języku polskim
	const getOvertimeWord = (count) => {
		if (i18n.language !== 'pl') {
			// Dla innych języków użyj standardowego tłumaczenia
			return count === 1 ? t('workcalendar.overtime1') : t('workcalendar.overtime5plus')
		}
		
		// Konwertuj na liczbę jeśli jest stringiem
		const numCount = typeof count === 'number' ? count : parseFloat(count)
		if (isNaN(numCount)) return t('workcalendar.overtime5plus')
		
		// Polska odmiana:
		// 1 → "nadgodzina" (tylko dla dokładnie 1.0)
		// 2-4, 22-24, 32-34... → "nadgodziny" (z wyjątkiem 12-14)
		// 0, 5-21, 25-31... → "nadgodzin"
		// Liczby niecałkowite (0.5, 1.5, 2.5...) → zawsze "nadgodziny" (liczba mnoga)
		
		// Jeśli liczba jest niecałkowita, zawsze użyj dopełniacza liczby mnogiej "nadgodzin"
		// (np. "0.5 nadgodzin", "1.5 nadgodzin", "2.5 nadgodzin")
		if (numCount % 1 !== 0) {
			return t('workcalendar.overtime5plus')
		}
		
		// Dla liczb całkowitych
		if (numCount === 1) {
			return t('workcalendar.overtime1')
		}
		
		const lastDigit = numCount % 10
		const lastTwoDigits = numCount % 100
		
		// Wyjątek: 12-14 zawsze używa "nadgodzin"
		if (lastTwoDigits >= 12 && lastTwoDigits <= 14) {
			return t('workcalendar.overtime5plus')
		}
		
		// 2-4 używa "nadgodziny"
		if (lastDigit >= 2 && lastDigit <= 4) {
			return t('workcalendar.overtime2_4')
		}
		
		// Wszystkie inne (0, 5-21, 25-31...) używa "nadgodzin"
		return t('workcalendar.overtime5plus')
	}

	// Eksport PDF/Excel — dziesiętny format jak dotychczas
	const formatHours = formatHoursDecimal

	/** Godziny w eksporcie Excel — jak w kalendarzu: do 0,5 h, bez szumu z timera. */
	const excelHoursValue = (value) => {
		if (value === '' || value == null) return ''
		const rounded = roundToHalfHour(value)
		return rounded === null ? '' : rounded
	}
	
	// Odśwież kalendarz gdy sidebar się zmienia lub okno się zmienia
	useEffect(() => {
		const updateCalendarSize = () => {
			if (calendarRef.current) {
				const calendarApi = calendarRef.current.getApi()
				// Użyj setTimeout aby dać czas na zakończenie animacji CSS
				setTimeout(() => {
					calendarApi.updateSize()
				}, 350) // 350ms to czas animacji sidebaru (0.3s + mały buffer)
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
	}, [])

	// TanStack Query hooks
	const { data: user, isPending: userPending } = useUser(userId)
	const { data: workdays = [], isPending: workdaysPending } = useUserWorkdays(userId)
	const { data: isConfirmed = false, isPending: confirmationPending } = useCalendarConfirmation(
		currentMonth,
		currentYear,
		userId
	)
	const { data: confirmationDetails } = useCalendarConfirmationDetails(currentMonth, currentYear, userId)
	const { data: acceptedLeaveRequests = [], isPending: leaveRequestsPending } = useUserAcceptedLeaveRequests(
		userId,
		{ enabled: allowTimerLeaveApis }
	)
	const { data: settings } = useSettings()
	const { data: workActivities = [] } = useWorkActivities()
	const enabledWorkActivities = React.useMemo(
		() => getEnabledWorkActivities(workActivities),
		[workActivities]
	)
	const taskTitleLookup = React.useMemo(
		() => buildTaskTitlesMap(timesheetTasks),
		[timesheetTasks]
	)
	const filterableTasks = React.useMemo(
		() => collectTasksFromWorkdays(workdays, currentMonth, currentYear, taskTitleLookup),
		[workdays, currentMonth, currentYear, taskTitleLookup]
	)
	const taskTitlesById = React.useMemo(
		() => ({
			...taskTitleLookup,
			...buildTaskTitlesMap(filterableTasks.map(task => ({ _id: task.id, title: task.title }))),
		}),
		[taskTitleLookup, filterableTasks]
	)
	const { data: activeTimer } = useActiveTimer({ enabled: allowTimerLeaveApis })
	const bulkFillWorkdaysMutation = useBulkFillWorkdays(userId)
	const clearWorkdaysForMonthMutation = useClearWorkdaysForMonth(userId)
	const createWorkdayForUserMutation = useCreateWorkdayForUser(userId)
	const updateWorkdayForUserMutation = useUpdateWorkdayForUser(userId)
	const deleteWorkdayForUserMutation = useDeleteWorkdayForUser(userId)
	const reviewWorkdayForUserMutation = useReviewWorkdayForUser(userId)
	const toggleConfirmationMutation = useToggleCalendarConfirmation()
	const canEditManagedWorkdays = settings?.allowManagedWorkdayEntries === true && user?.appAccessEnabled === false

	const isCalendarInitialLoading =
		userPending ||
		workdaysPending ||
		confirmationPending ||
		(allowTimerLeaveApis && leaveRequestsPending)
	const hasManagedHoursEntryInput =
		(splitByActivity && teamHasWorkActivities({ workActivities }))
		|| (splitByTask && tasksModuleEnabled)
		|| String(hoursWorked || '').trim() !== '' ||
		String(additionalWorked || '').trim() !== '' ||
		String(realTimeDayWorked || '').trim() !== ''
	const hasManagedAbsenceEntryInput = String(absenceType || '').trim() !== ''

	const formatMetadataDateTime = (value) => {
		if (!value) return t('workcalendar.metadata.notAvailable')
		const date = new Date(value)
		if (Number.isNaN(date.getTime())) return t('workcalendar.metadata.notAvailable')
		return date.toLocaleString(i18n.resolvedLanguage, {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		})
	}

	const renderCalendarMetadata = () => (
		<div
			className="user-calendar-metadata"
			style={{
				marginTop: '10px',
				padding: '10px 14px',
				border: '1px solid #e5e7eb',
				borderRadius: '8px',
				backgroundColor: '#f8fafc',
				color: '#334155',
				fontSize: '14px',
				lineHeight: 1.4,
			}}
		>
			<div>
				<strong>{t('workcalendar.metadata.confirmedAtLabel')}</strong>{' '}
				{confirmationDetails?.isConfirmed
					? formatMetadataDateTime(confirmationDetails?.confirmedAt)
					: t('workcalendar.metadata.notConfirmed')}
			</div>
			{user?.appAccessEnabled === false && confirmationDetails?.isConfirmed && (
				<div style={{ marginTop: '4px' }}>
					<strong>{t('workcalendar.metadata.confirmedByLabel')}</strong>{' '}
					{confirmationDetails?.confirmedBy?.firstName || confirmationDetails?.confirmedBy?.lastName
						? `${confirmationDetails.confirmedBy.firstName || ''} ${confirmationDetails.confirmedBy.lastName || ''}`.trim()
						: t('workcalendar.metadata.notAvailable')}
				</div>
			)}
			<div style={{ marginTop: '4px' }}>
				<strong>{t('workcalendar.metadata.lastChangeLabel')}</strong>{' '}
				{formatMetadataDateTime(confirmationDetails?.lastWorkdayChangeAt)}
				{user?.appAccessEnabled === false &&
					confirmationDetails?.lastWorkdayChangedBy &&
					(confirmationDetails?.lastWorkdayChangedBy?.firstName || confirmationDetails?.lastWorkdayChangedBy?.lastName) && (
						<>
							{', '}
							{t('workcalendar.metadata.byLabel')}{' '}
							{`${confirmationDetails.lastWorkdayChangedBy.firstName || ''} ${confirmationDetails.lastWorkdayChangedBy.lastName || ''}`.trim()}
						</>
					)}
			</div>
		</div>
	)

	useEffect(() => {
		const parsed = parseWorkTimeRange(realTimeDayWorked)
		if (parsed.timeFrom || parsed.timeTo) {
			setWorkTimeFrom(parsed.timeFrom)
			setWorkTimeTo(parsed.timeTo)
		} else if (!realTimeDayWorked) {
			setWorkTimeFrom('')
			setWorkTimeTo('')
		}
	}, [realTimeDayWorked])

	const updateWorkTimeRange = (field, value) => {
		const nextFrom = field === 'from' ? value : workTimeFrom
		const nextTo = field === 'to' ? value : workTimeTo
		const findMatchingWorkHoursIndex = () => {
			if (!nextFrom || !nextTo) return -1
			if (Array.isArray(settings?.workHours) && settings.workHours.length > 0) {
				return settings.workHours.findIndex(
					(workHours) => workHours?.timeFrom === nextFrom && workHours?.timeTo === nextTo
				)
			}
			if (settings?.workHours?.timeFrom && settings?.workHours?.timeTo) {
				return settings.workHours.timeFrom === nextFrom && settings.workHours.timeTo === nextTo ? 0 : -1
			}
			return -1
		}
		setWorkTimeFrom(nextFrom)
		setWorkTimeTo(nextTo)
		setAbsenceType('')
		setSelectedWorkHoursIndex(findMatchingWorkHoursIndex())
		if (!nextFrom || !nextTo) return
		setRealTimeDayWorked(`${nextFrom}-${nextTo}`)
		const calculatedHours = calculateHoursFromRange(nextFrom, nextTo)
		setHoursWorked(calculatedHours || '')
	}

	const handleAbsenceChange = (value) => {
		setAbsenceType(value)
		if (value.trim()) {
			setHoursWorked('')
			setAdditionalWorked('')
			setRealTimeDayWorked('')
			setWorkTimeFrom('')
			setWorkTimeTo('')
			setSelectedWorkHoursIndex(-1)
		}
	}

	const renderWorkTimeRangeSelects = () => (
		<div>
			<label style={{ display: 'block', marginBottom: '6px', fontSize: '15px', fontWeight: 600, color: '#334155' }}>
				Zakres godzin
			</label>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
				<label>
					<select
						value={workTimeFrom}
						onChange={e => updateWorkTimeRange('from', e.target.value)}
						className="w-full border border-gray-300 rounded-md px-4 py-2"
					>
						<option value="">--:--</option>
						{halfHourOptions.map(option => (
							<option key={`from-${option}`} value={option}>{option}</option>
						))}
					</select>
				</label>
				<label>
					<select
						value={workTimeTo}
						onChange={e => updateWorkTimeRange('to', e.target.value)}
						className="w-full border border-gray-300 rounded-md px-4 py-2"
					>
						<option value="">--:--</option>
						{halfHourOptions.map(option => (
							<option key={`to-${option}`} value={option}>{option}</option>
						))}
					</select>
				</label>
			</div>
		</div>
	)

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
		const includeHolidays = settings?.includeHolidays === true
		
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

	const activityFilterIds = selectedActivityIds
	const filteredWorkdaysForView = React.useMemo(
		() => filterWorkdaysByActivities(workdays, activityFilterIds),
		[workdays, selectedActivityIds]
	)

	useEffect(() => {
		calculateTotals(workdays, acceptedLeaveRequests, currentMonth, currentYear, selectedActivityIds, selectedTaskIds)
	}, [workdays, acceptedLeaveRequests, currentMonth, currentYear, settings, selectedActivityIds, selectedTaskIds])

	const calculateTotals = (workdaysSource, acceptedLeaveRequests, month, year, activityFilterIds = [], taskFilterIds = []) => {
		if (!settings) return // Czekaj na załadowanie ustawień
		let hours = 0
		let leaveDays = 0
		let overtime = 0
		let workDaysSet = new Set()
		let otherAbsences = 0
		const filterActive = isCalendarFilterActive(activityFilterIds, taskFilterIds)

		const filteredWorkdays = workdaysSource.filter(day => {
			const eventDate = new Date(day.date)
			return eventDate.getMonth() === month && eventDate.getFullYear() === year
		})

		filteredWorkdays.forEach(day => {
			const dayHours = getFilteredCalendarHours(day, activityFilterIds, taskFilterIds)
			if (dayHours > 0) {
				hours += dayHours
				workDaysSet.add(new Date(day.date).toDateString())
			}
			if (!filterActive && day.additionalWorked) {
				overtime += day.additionalWorked
			}
			if (!filterActive && day.absenceType) {
				const absenceTypeLower = day.absenceType.toLowerCase()
				if (absenceTypeLower.includes('urlop') || absenceTypeLower.includes('vacation') || absenceTypeLower.includes('leave')) {
					leaveDays += 1
				} else {
					otherAbsences += 1
				}
			}
		})

		// Licz zaakceptowane wnioski urlopowe w danym miesiącu/roku
		if (Array.isArray(acceptedLeaveRequests)) {
			acceptedLeaveRequests.forEach(request => {
			if (!request.startDate || !request.endDate) return

			const startDate = new Date(request.startDate)
			const endDate = new Date(request.endDate)
			
			// Sprawdź czy wniosek ma daty w danym miesiącu/roku
			const requestStartMonth = startDate.getMonth()
			const requestStartYear = startDate.getFullYear()
			const requestEndMonth = endDate.getMonth()
			const requestEndYear = endDate.getFullYear()

			// Jeśli wniosek ma daty w danym miesiącu/roku
			if (
				(requestStartYear === year && requestStartMonth === month) ||
				(requestEndYear === year && requestEndMonth === month) ||
				(requestStartYear < year && requestEndYear > year) ||
				(requestStartYear === year && requestEndYear === year && requestStartMonth <= month && requestEndMonth >= month)
			) {
				// Sprawdź typ urlopu - użyj przetłumaczonego tekstu
				const translatedType = t(request.type).toLowerCase()
				const isVacation = translatedType.includes('urlop') || translatedType.includes('vacation') || translatedType.includes('leave')
				
				if (isVacation) {
					// Policz dni urlopu w danym miesiącu - używając generateDateRangeForCalendar aby pominąć weekendy i święta
					const monthStart = new Date(year, month, 1)
					const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
					const overlapStart = startDate > monthStart ? startDate : monthStart
					const overlapEnd = endDate < monthEnd ? endDate : monthEnd
					
					if (overlapStart <= overlapEnd) {
						// Użyj generateDateRangeForCalendar aby pominąć weekendy i święta
						const formatDateLocal = (date) => {
							const year = date.getFullYear()
							const month = String(date.getMonth() + 1).padStart(2, '0')
							const day = String(date.getDate()).padStart(2, '0')
							return `${year}-${month}-${day}`
						}
						const dateRange = generateDateRangeForCalendar(
							formatDateLocal(overlapStart),
							formatDateLocal(overlapEnd)
						)
						// Policz tylko dni w danym miesiącu
						const daysInMonth = dateRange.filter(dateStr => {
							const date = new Date(dateStr)
							return date.getMonth() === month && date.getFullYear() === year
						})
						leaveDays += daysInMonth.length
					}
				} else {
					// Inna nieobecność - policz dni w danym miesiącu - używając generateDateRangeForCalendar aby pominąć weekendy i święta
					const monthStart = new Date(year, month, 1)
					const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999)
					const overlapStart = startDate > monthStart ? startDate : monthStart
					const overlapEnd = endDate < monthEnd ? endDate : monthEnd
					
					if (overlapStart <= overlapEnd) {
						// Użyj generateDateRangeForCalendar aby pominąć weekendy i święta
						const formatDateLocal = (date) => {
							const year = date.getFullYear()
							const month = String(date.getMonth() + 1).padStart(2, '0')
							const day = String(date.getDate()).padStart(2, '0')
							return `${year}-${month}-${day}`
						}
						const dateRange = generateDateRangeForCalendar(
							formatDateLocal(overlapStart),
							formatDateLocal(overlapEnd)
						)
						// Policz tylko dni w danym miesiącu
						const daysInMonth = dateRange.filter(dateStr => {
							const date = new Date(dateStr)
							return date.getMonth() === month && date.getFullYear() === year
						})
						otherAbsences += daysInMonth.length
					}
				}
			}
		})
		}

		// Policz dni świąteczne w danym miesiącu
		let holidaysCount = 0
		if (settings && (settings.includePolishHolidays || settings.includeCustomHolidays)) {
			const monthStart = new Date(year, month, 1)
			const monthEnd = new Date(year, month + 1, 0)
			const formatDateLocal = (date) => {
				const year = date.getFullYear()
				const month = String(date.getMonth() + 1).padStart(2, '0')
				const day = String(date.getDate()).padStart(2, '0')
				return `${year}-${month}-${day}`
			}
			const holidaysInMonth = getHolidaysInRange(
				formatDateLocal(monthStart),
				formatDateLocal(monthEnd),
				settings
			)
			holidaysCount = holidaysInMonth.length
		}

		setTotalHours(hours)
		setAdditionalHours(overtime)
		setTotalWorkDays(workDaysSet.size)
		setTotalLeaveDays(leaveDays)
		// Oblicz godziny urlopu na podstawie konfiguracji
		const leaveHoursPerDay = settings?.leaveHoursPerDay || 8
		setTotalLeaveHours(leaveDays * leaveHoursPerDay)
		setTotalOtherAbsences(otherAbsences)
		setTotalHolidays(holidaysCount)
	}

	const handleMonthChange = info => {
		const newMonth = info.view.currentStart.getMonth()
		const newYear = info.view.currentStart.getFullYear()
		setCurrentMonth(newMonth)
		setCurrentYear(newYear)
		calculateTotals(workdays, acceptedLeaveRequests, newMonth, newYear)
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

	const formatDateLocal = (date) => {
		const d = new Date(date)
		if (isNaN(d.getTime())) return ''
		const year = d.getFullYear()
		const month = String(d.getMonth() + 1).padStart(2, '0')
		const day = String(d.getDate()).padStart(2, '0')
		return `${year}-${month}-${day}`
	}

	const findWorkdayForDate = (dateStr) => {
		return workdays.find(day => formatDateLocal(day.date) === dateStr) || null
	}

	const reviewedWorkdayBackgroundEvents = React.useMemo(() => {
		if (!canEditManagedWorkdays) return []
		return workdays
			.filter(day => day.reviewStatus === 'approved' || day.reviewStatus === 'rejected')
			.map(day => ({
				start: day.date,
				allDay: true,
				display: 'background',
				backgroundColor: day.reviewStatus === 'approved' ? 'rgba(34, 197, 94, 0.34)' : 'rgba(239, 68, 68, 0.32)',
				classNames: day.reviewStatus === 'approved' ? 'workday-review-bg-approved' : 'workday-review-bg-rejected',
				extendedProps: {
					type: 'workdayReviewBackground',
				},
			}))
	}, [canEditManagedWorkdays, workdays])

	const calendarEvents = React.useMemo(() => {
		const filterActive = isCalendarFilterActive(selectedActivityIds, selectedTaskIds)
		const workdayEvents = workdays
			.map(day => {
				let title = ''
				const hasAbsenceType = day.absenceType && typeof day.absenceType === 'string' && day.absenceType.trim() !== '' && day.absenceType !== 'null' && day.absenceType.toLowerCase() !== 'null'
				const filteredHours = getFilteredCalendarHours(day, selectedActivityIds, selectedTaskIds)
				const hasHoursWorked = filteredHours > 0
				const hasOnlyNotes = !hasHoursWorked && !hasAbsenceType && day.notes && day.notes.trim() !== ''

				if (filterActive) {
					if (!hasHoursWorked && !hasAbsenceType && !hasOnlyNotes) return null
					if (hasHoursWorked && !workdayMatchesCalendarFilters(day, selectedActivityIds, selectedTaskIds)) return null
				}

				if (hasHoursWorked) {
					const displayHours = filterActive
						? formatWorkDuration(filteredHours, { preferClockUnderHour: true })
						: formatHoursDecimal(roundToHalfHour(filteredHours) ?? filteredHours)
					title = `${displayHours} ${t('workcalendar.allfrommonthhours')}`
					const breakdown = formatCalendarBreakdown(day, {
						workActivities,
						taskTitlesById,
						locale: i18n.language,
						selectedActivityIds,
						selectedTaskIds,
					})
					if (breakdown) title += ` · ${breakdown}`
					if (!filterActive && day.additionalWorked) {
						const roundedAdditional = roundToHalfHour(day.additionalWorked)
						title += ` ${t('workcalendar.include')} ${formatHours(roundedAdditional)} ${getOvertimeWord(roundedAdditional)}`
					}
					if (day.notes) {
						title += ` | ${day.notes}`
					}
				} else if (hasAbsenceType) {
					title = day.absenceType
					if (day.notes) {
						title += ` | ${day.notes}`
					}
				} else if (day.notes) {
					title = day.notes
				}

				if (!title || title.trim() === '') {
					return null
				}

				let backgroundColor = 'green'
				let classNames = 'event-absence'

				if (hasHoursWorked) {
					backgroundColor = 'blue'
					classNames = 'event-workday'
				} else if (hasAbsenceType) {
					backgroundColor = 'green'
					classNames = 'event-absence'
				} else if (hasOnlyNotes) {
					backgroundColor = '#8B0000'
					classNames = 'event-notes'
				}

				return {
					title,
					start: day.date,
					backgroundColor,
					textColor: 'white',
					id: day._id,
					classNames,
					extendedProps: {
						isWorkday: !!hasHoursWorked,
						isAbsence: hasAbsenceType,
						isNotes: hasOnlyNotes,
						notes: day.notes,
					},
				}
			})
			.filter(event => event !== null)

		const realTimeEvents = workdays
			.map(day => {
				const timeLabel = filterActive
					? buildFilteredRealTimeForCalendar(day, selectedActivityIds, selectedTaskIds)
					: day.realTimeDayWorked
				if (!timeLabel) return null
				return {
					title: `${t('workcalendar.worktime')} ${timeLabel}`,
					start: day.date,
					backgroundColor: 'yellow',
					textColor: 'black',
					id: `${day._id}-realTime`,
					classNames: 'event-real-time',
				}
			})
			.filter(Boolean)

		const leaveEvents = acceptedLeaveRequests
			.filter(request => request.startDate && request.endDate)
			.flatMap(request => {
				const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
				return dates.map(date => ({
					title: `${getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage)}`,
					start: date,
					allDay: true,
					textColor: 'white',
					classNames: 'event-absence',
					extendedProps: {
						type: 'leaveRequest',
						requestId: request._id,
						isAbsence: true,
					},
				}))
			})

		const holidayEvents = holidaysForMonth.map(holiday => ({
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
		}))

		return [...reviewedWorkdayBackgroundEvents, ...workdayEvents, ...realTimeEvents, ...leaveEvents, ...holidayEvents]
	}, [
		reviewedWorkdayBackgroundEvents,
		workdays,
		selectedActivityIds,
		selectedTaskIds,
		taskTitlesById,
		workActivities,
		acceptedLeaveRequests,
		holidaysForMonth,
		settings,
		t,
		i18n.resolvedLanguage,
		i18n.language,
	])

	const monthActivityRows = React.useMemo(() => {
		const monthWorkdays = workdays.filter(day => {
			const eventDate = new Date(day.date)
			return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
		})
		const usersById = new Map([[String(userId), user]])
		return flattenWorkdayActivityRows(
			monthWorkdays.filter(day => workdayMatchesActivityFilter(day, activityFilterIds)),
			workActivities,
			usersById,
			i18n.language,
			activityFilterIds,
			{ deletedActivityLabel: t('workcalendar.activities.deletedLabel') }
		)
	}, [workdays, currentMonth, currentYear, activityFilterIds, workActivities, userId, user, i18n.language, t])

	const activitySummaryRows = React.useMemo(
		() => aggregateActivityHours(monthActivityRows, { groupByUser: false }),
		[monthActivityRows]
	)

	const monthTaskRows = React.useMemo(() => {
		if (!tasksModuleEnabled) return []
		const monthWorkdays = workdays.filter(day => {
			const eventDate = new Date(day.date)
			return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
		})
		const usersById = new Map([[String(userId), user]])
		return flattenWorkdayTaskRows(
			monthWorkdays.filter(day => workdayMatchesTaskFilter(day, selectedTaskIds)),
			taskTitleLookup,
			usersById,
			selectedTaskIds,
			{ deletedTaskLabel: t('workcalendar.tasks.deletedLabel') }
		)
	}, [workdays, currentMonth, currentYear, selectedTaskIds, taskTitleLookup, tasksModuleEnabled, userId, user, t])

	const taskSummaryRows = React.useMemo(
		() => aggregateTaskHours(monthTaskRows, { groupByUser: false }),
		[monthTaskRows]
	)

	const showActivitySummary = selectedTaskIds.length === 0 && activitySummaryRows.length > 0
	const showTaskSummary = selectedActivityIds.length === 0 && tasksModuleEnabled && taskSummaryRows.length > 0
	const calendarFilterActive = isCalendarFilterActive(selectedActivityIds, selectedTaskIds)
	const breakdownUsesClockFormat =
		selectedActivityIds.length > 0 || selectedTaskIds.length > 0
	const formatSidebarTotal = (hours) => {
		if (calendarFilterActive) {
			return formatWorkDuration(hours, { preferClockUnderHour: true })
		}
		const rounded = roundToHalfHour(hours)
		return formatHoursDecimal(rounded !== null ? rounded : hours)
	}
	const formatBreakdownRow = (hours) =>
		formatWorkDuration(hours, { preferClockUnderHour: breakdownUsesClockFormat })
	const formatTaskBreakdownRow = (hours) =>
		formatWorkDuration(hours, { preferClockUnderHour: true })

	const currentMonthWorkdaysForReview = React.useMemo(() => {
		if (!canEditManagedWorkdays) return []
		return workdays
			.filter(day => {
				const eventDate = new Date(day.date)
				const hasEntry =
					(day.hoursWorked != null && day.hoursWorked !== '') ||
					(day.additionalWorked != null && day.additionalWorked !== '') ||
					!!day.realTimeDayWorked ||
					!!day.absenceType ||
					!!day.notes

				return hasEntry && eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
			})
			.sort((a, b) => new Date(a.date) - new Date(b.date))
	}, [canEditManagedWorkdays, currentMonth, currentYear, workdays])

	const formatReviewerName = (reviewedBy) => {
		if (!reviewedBy) return ''
		const name = `${reviewedBy.firstName || ''} ${reviewedBy.lastName || ''}`.trim()
		return name || reviewedBy.email || ''
	}

	const resetManagedForm = () => {
		setEditingWorkday(null)
		setHoursWorked('')
		setAdditionalWorked('')
		setRealTimeDayWorked('')
		setWorkTimeFrom('')
		setWorkTimeTo('')
		setAbsenceType('')
		setNotes('')
		setFormError('')
		setSelectedWorkHoursIndex(0)
		setSplitByActivity(false)
		setActivityBlocks([createDefaultActivityBlock(enabledWorkActivities[0]?.id || '')])
		setSplitByTask(false)
		setTaskBlocks([createDefaultTaskBlock(timesheetTasks[0]?._id ? String(timesheetTasks[0]._id) : '')])
	}

	const workdayHoursFieldProps = {
		settings,
		workActivities,
		splitByActivity,
		onSplitByActivityChange: setSplitByActivity,
		activityBlocks,
		onActivityBlocksChange: setActivityBlocks,
		tasksModuleEnabled,
		timesheetTasks,
		splitByTask,
		onSplitByTaskChange: setSplitByTask,
		taskBlocks,
		onTaskBlocksChange: setTaskBlocks,
		hoursWorked,
		onHoursWorkedChange: setHoursWorked,
		additionalWorked,
		onAdditionalWorkedChange: setAdditionalWorked,
		realTimeDayWorked,
		workTimeFrom,
		workTimeTo,
		onWorkTimeFromChange: (value) => updateWorkTimeRange('from', value),
		onWorkTimeToChange: (value) => updateWorkTimeRange('to', value),
		onRealTimeDayWorkedChange: setRealTimeDayWorked,
		selectedWorkHoursIndex,
		onSelectedWorkHoursIndexChange: setSelectedWorkHoursIndex,
		hasAbsenceEntryInput: hasManagedAbsenceEntryInput,
	}

	const openManagedWorkdayModal = (dateStr) => {
		if (!canEditManagedWorkdays) return
		if (settings?.workdayEntriesOnlyToday === true && dateStr !== formatDateLocal(new Date())) {
			showAlert(t('workcalendar.bulkFill.errors.onlyToday'))
			return
		}
		const existing = findWorkdayForDate(dateStr)
		setSelectedDate(dateStr)
		setEditingWorkday(existing)
		const existingBlocks = blocksFromWorkday(existing)
		const existingTaskBlocks = blocksFromWorkdayTasks(existing)
		setSplitByActivity(existingBlocks.length > 0)
		setSplitByTask(existingTaskBlocks.length > 0)
		setActivityBlocks(existingBlocks.length > 0 ? existingBlocks : [createDefaultActivityBlock(enabledWorkActivities[0]?.id || '')])
		setTaskBlocks(existingTaskBlocks.length > 0 ? existingTaskBlocks : [createDefaultTaskBlock(timesheetTasks[0]?._id ? String(timesheetTasks[0]._id) : '')])
		setHoursWorked(existing?.hoursWorked != null ? String(existing.hoursWorked) : '')
		setAdditionalWorked(existing?.additionalWorked != null ? String(existing.additionalWorked) : '')
		setRealTimeDayWorked(existing?.realTimeDayWorked || '')
		setAbsenceType(existing?.absenceType || '')
		setNotes(existing?.notes || '')
		setFormError('')

		if (!existing && settings?.workHours) {
			let workHoursToUse = null
			if (Array.isArray(settings.workHours) && settings.workHours.length > 0) {
				workHoursToUse = settings.workHours[0]
				setSelectedWorkHoursIndex(0)
			} else if (settings.workHours.timeFrom && settings.workHours.timeTo) {
				workHoursToUse = settings.workHours
			}
			if (workHoursToUse?.timeFrom && workHoursToUse?.timeTo) {
				setRealTimeDayWorked(`${workHoursToUse.timeFrom}-${workHoursToUse.timeTo}`)
				if (workHoursToUse.hours) setHoursWorked(String(workHoursToUse.hours))
			}
		}

		setModalIsOpen(true)
	}

	const handleManagedDateClick = (info) => {
		if (
			info.event?.extendedProps?.type === 'leaveRequest' ||
			info.event?.extendedProps?.type === 'holiday' ||
			info.event?.extendedProps?.type === 'workdayReviewBackground'
		) {
			return
		}
		const clickedDate = info.dateStr || info.event?.startStr
		if (clickedDate) openManagedWorkdayModal(clickedDate.slice(0, 10))
	}

	const handleManagedSubmit = async (e) => {
		e.preventDefault()
		if (isConfirmed) {
			setFormError(t('workcalendar.bulkFill.errors.monthConfirmed'))
			return
		}
		const useActivitySplit = teamHasWorkActivities({ workActivities }) && splitByActivity && !absenceType.trim()
		const useTaskSplit = tasksModuleEnabled && splitByTask && !absenceType.trim()
		if (useActivitySplit) {
			const blockError = validateActivityBlocksClient(activityBlocks, t)
			if (blockError) {
				setFormError(blockError)
				return
			}
		}
		if (useTaskSplit) {
			const taskError = validateTaskBlocksClient(taskBlocks, t)
			if (taskError) {
				setFormError(taskError)
				return
			}
		}
		const activityTotal = useActivitySplit ? sumBlockHours(activityBlocks) : 0
		const taskTotal = useTaskSplit ? sumTaskBlockHours(taskBlocks) : 0
		const splitTotal = Math.round((activityTotal + taskTotal) * 2) / 2
		const payload = {
			date: selectedDate,
			hoursWorked: (useActivitySplit || useTaskSplit) ? String(splitTotal) : hoursWorked.trim(),
			additionalWorked: additionalWorked.trim(),
			realTimeDayWorked: (useActivitySplit || useTaskSplit)
				? [useActivitySplit ? buildRealTimeFromBlocks(activityBlocks) : '', useTaskSplit ? buildRealTimeFromTaskBlocks(taskBlocks) : ''].filter(Boolean).join(', ')
				: realTimeDayWorked.trim(),
			absenceType: absenceType.trim(),
			notes: notes.trim(),
			manualActivityBlocks: useActivitySplit ? serializeActivityBlocks(activityBlocks) : [],
			manualTaskBlocks: useTaskSplit ? serializeTaskBlocks(taskBlocks) : [],
		}
		if (payload.hoursWorked && payload.absenceType) {
			setFormError(t('workcalendar.formalerttwo'))
			return
		}
		if (!payload.hoursWorked && payload.additionalWorked && !payload.absenceType && !payload.notes) {
			setFormError(t('workcalendar.overtimeNeedsHours'))
			return
		}
		if (!payload.hoursWorked && !payload.additionalWorked && !payload.realTimeDayWorked && !payload.absenceType && !payload.notes) {
			setFormError(t('workcalendar.formalertone'))
			return
		}
		try {
			if (editingWorkday?._id) {
				await updateWorkdayForUserMutation.mutateAsync({ id: editingWorkday._id, updatedWorkday: payload })
			} else {
				await createWorkdayForUserMutation.mutateAsync(payload)
			}
			setModalIsOpen(false)
			resetManagedForm()
			await showAlert(t('workcalendar.managedMessages.entrySaved'))
		} catch (error) {
			setFormError(error.response?.data?.message || t('workcalendar.managedMessages.entrySaveError'))
		}
	}

	const handleManagedDelete = async () => {
		if (!editingWorkday?._id) return
		const confirmed = await showConfirm(t('workcalendar.managedMessages.deleteConfirm'))
		if (!confirmed) return
		try {
			await deleteWorkdayForUserMutation.mutateAsync(editingWorkday._id)
			setModalIsOpen(false)
			resetManagedForm()
			await showAlert(t('workcalendar.managedMessages.entryDeleted'))
		} catch (error) {
			setFormError(error.response?.data?.message || t('workcalendar.managedMessages.entryDeleteError'))
		}
	}

	const formatBulkFillSummary = (result) => {
		const skipped = result?.skipped || {}
		const skippedTotal = Object.values(skipped).reduce((sum, value) => sum + (Number(value) || 0), 0)
		const skippedParts = [
			skipped.weekend ? `${t('workcalendar.bulkFill.summary.weekends')}: ${skipped.weekend}` : null,
			skipped.holiday ? `${t('workcalendar.bulkFill.summary.holidays')}: ${skipped.holiday}` : null,
			skipped.leave ? `${t('workcalendar.bulkFill.summary.leaves')}: ${skipped.leave}` : null,
			skipped.existing ? `${t('workcalendar.bulkFill.summary.existing')}: ${skipped.existing}` : null,
			skipped.confirmed ? `${t('workcalendar.bulkFill.summary.confirmedMonths')}: ${skipped.confirmed}` : null,
		].filter(Boolean)
		return t('workcalendar.bulkFill.summary.message', {
			created: result?.createdCount || 0,
			skipped: skippedTotal,
			details: skippedParts.length ? ` (${skippedParts.join(', ')})` : '',
		})
	}

	const handleBulkFillSubmit = async (payload) => {
		if (!canEditManagedWorkdays) return
		try {
			const result = await bulkFillWorkdaysMutation.mutateAsync(payload)
			setBulkFillModalOpen(false)
			await showAlert(formatBulkFillSummary(result))
		} catch (error) {
			await showAlert(error.response?.data?.message || t('workcalendar.bulkFill.errors.submitError'))
		}
	}

	const handleClearManagedCurrentMonthEntries = async () => {
		if (!canEditManagedWorkdays) return
		const tSafe = (key, fallback) => {
			const value = t(key)
			return value === key ? fallback : value
		}

		const monthEntries = workdays.filter((day) => {
			const date = new Date(day.date)
			return date.getMonth() === currentMonth && date.getFullYear() === currentYear
		})
		if (monthEntries.length === 0) {
			await showAlert(tSafe('workcalendar.noEntriesThisMonth', 'Brak wpisów do usunięcia w tym miesiącu.'))
			return
		}

		const confirmed = await showConfirm(
			tSafe(
				'workcalendar.clearMonthConfirm',
				'Czy na pewno chcesz usunąć wszystkie wpisy z widocznego miesiąca? Tej operacji nie da się cofnąć. Jeśli chcesz usunąć pojedynczy wpis, kliknij dzień w kalendarzu.'
			)
		)
		if (!confirmed) return

		try {
			const result = await clearWorkdaysForMonthMutation.mutateAsync({
				month: currentMonth,
				year: currentYear,
			})
			const deletedCount = Number(result?.deletedCount || 0)
			await showAlert(tSafe('workcalendar.clearMonthSuccess', 'Usunięto wpisy: {{count}}.').replace('{{count}}', String(deletedCount)))
		} catch (error) {
			await showAlert(error.response?.data?.message || tSafe('workcalendar.clearMonthError', 'Nie udało się wyczyścić wpisów z miesiąca.'))
		}
	}

	const handleManagedMonthConfirmationToggle = async () => {
		if (!canEditManagedWorkdays) return

		try {
			await toggleConfirmationMutation.mutateAsync({
				month: currentMonth,
				year: currentYear,
				isConfirmed: !isConfirmed,
				userId,
			})
			await showAlert(!isConfirmed ? t('workcalendar.managedMessages.monthConfirmed') : t('workcalendar.managedMessages.monthReverted'))
		} catch (error) {
			await showAlert(error.response?.data?.message || t('workcalendar.managedMessages.monthToggleError'))
		}
	}

	const handleReviewWorkday = async (workdayId, status) => {
		if (!canEditManagedWorkdays) return

		try {
			await reviewWorkdayForUserMutation.mutateAsync({ id: workdayId, status })
		} catch (error) {
			await showAlert(error.response?.data?.message || t('workcalendar.managedMessages.reviewSaveError'))
		}
	}

	const renderEventContent = eventInfo => {
		// Określ klasę CSS na podstawie extendedProps (najbardziej niezawodne)
		let eventClass = 'event-workday'
		const props = eventInfo.event.extendedProps || {}
		
		// Sprawdź czy to wniosek urlopowy (nieobecność)
		if (props.type === 'leaveRequest' || props.isAbsence) {
			eventClass = 'event-absence'
		} else if (props.isNotes) {
			eventClass = 'event-notes'
		} else if (props.isWorkday) {
			eventClass = 'event-workday'
		} else if (eventInfo.event.classNames) {
			// Fallback do classNames jeśli extendedProps nie są dostępne
			const classNamesStr = Array.isArray(eventInfo.event.classNames) 
				? eventInfo.event.classNames.join(' ') 
				: String(eventInfo.event.classNames)
			
			if (classNamesStr.includes('event-notes')) {
				eventClass = 'event-notes'
			} else if (classNamesStr.includes('event-absence')) {
				eventClass = 'event-absence'
			} else if (classNamesStr.includes('event-workday')) {
				eventClass = 'event-workday'
			}
		}
		
		return (
			<div className={`event-content ${eventClass}`}>
				<span>{eventInfo.event.title}</span>
			</div>
		)
	}

	const pdfTheme = {
		navy: '#0b2442',
		blue: '#2563eb',
		green: '#16a34a',
		amber: '#d97706',
		purple: '#7c3aed',
		red: '#dc2626',
		ink: '#0f2746',
		muted: '#64748b',
		line: '#dbe7f2',
		soft: '#f5f9fd',
	}

	const pdfSafeNumber = value => {
		const number = Number(value || 0)
		return Number.isFinite(number) ? number : 0
	}

	const getReportMonthLabel = () => {
		const raw = new Date(currentYear, currentMonth, 1).toLocaleDateString(i18n.resolvedLanguage, {
			month: 'long',
			year: 'numeric',
		})
		return raw.charAt(0).toUpperCase() + raw.slice(1)
	}

	const getFilterText = () => {
		const activityLabel = selectedActivityIds.length > 0
			? getActivityFilterLabel(selectedActivityIds, enabledWorkActivities, i18n.language, t)
			: 'Wszystkie czynności'
		const taskLabel = selectedTaskIds.length > 0
			? getTaskFilterLabel(selectedTaskIds, filterableTasks, t)
			: 'Wszystkie zadania'
		return `${activityLabel} · ${taskLabel}`
	}

	const pdfKpiCards = () => {
		const cards = [
			{ label: 'Dni pracy', value: String(totalWorkDays), color: pdfTheme.blue },
			{ label: 'Godziny pracy', value: `${formatHours(roundToHalfHour(totalHours))} h`, color: pdfTheme.green },
			{ label: 'Nadgodziny', value: `${formatHours(roundToHalfHour(additionalHours))} h`, color: pdfTheme.amber },
			{
				label: settings?.leaveCalculationMode === 'hours' ? 'Urlop' : 'Dni urlopu',
				value: settings?.leaveCalculationMode === 'hours'
					? `${totalLeaveHours.toFixed(1)} h`
					: `${totalLeaveDays} (${totalLeaveHours.toFixed(1)} h)`,
				color: pdfTheme.purple,
			},
			{ label: 'Inne nieobecności', value: String(totalOtherAbsences), color: pdfTheme.red },
		]
		return {
			table: {
				widths: cards.map(() => '*'),
				body: [[
					...cards.map(card => ({
						stack: [
							{ text: card.label, fontSize: 7.2, bold: true, color: pdfTheme.muted },
							{ text: card.value, fontSize: 12, bold: true, color: pdfTheme.ink, margin: [0, 3, 0, 0] },
							{ canvas: [{ type: 'rect', x: 0, y: 0, w: 48, h: 2.4, r: 1.2, color: card.color }], margin: [0, 4, 0, 0] },
						],
						border: [false, false, false, false],
						margin: [7, 6, 7, 6],
					})),
				]],
			},
			layout: {
				hLineWidth: () => 1,
				vLineWidth: () => 1,
				hLineColor: () => pdfTheme.line,
				vLineColor: () => pdfTheme.line,
			},
			margin: [0, 0, 0, 6],
		}
	}

	const pdfSectionTitle = (title, subtitle = '') => ({
		stack: [
			{ text: title, style: 'sectionTitle' },
			subtitle ? { text: subtitle, style: 'sectionSubtitle', margin: [0, 2, 0, 0] } : null,
		].filter(Boolean),
		margin: [0, 10, 0, 5],
	})

	const getCalendarEventsByDate = () => {
		const map = new Map()
		calendarEvents.forEach(event => {
			if (!event?.start || event.display === 'background' || !event.title) return
			const dateKey = formatDateLocal(event.start)
			const eventDate = new Date(dateKey)
			if (eventDate.getMonth() !== currentMonth || eventDate.getFullYear() !== currentYear) return
			if (!map.has(dateKey)) map.set(dateKey, [])
			const type = event.classNames?.includes?.('event-real-time')
				? 'time'
				: event.extendedProps?.type === 'holiday' || event.extendedProps?.type === 'leaveRequest' || event.extendedProps?.isAbsence || event.classNames?.includes?.('event-absence')
					? 'absence'
					: event.extendedProps?.isNotes || event.classNames?.includes?.('event-notes')
						? 'note'
						: 'work'
			map.get(dateKey).push({ title: String(event.title), type })
		})
		return map
	}

	const buildPdfCalendarTable = () => {
		const monthStart = new Date(currentYear, currentMonth, 1)
		const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
		const firstWeekday = (monthStart.getDay() + 6) % 7
		const totalCells = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
		const eventsByDate = getCalendarEventsByDate()
		const dayHeaders = ['pon.', 'wt.', 'śr.', 'czw.', 'pt.', 'sob.', 'niedz.']
		const body = [
			dayHeaders.map(label => ({
				text: label,
				bold: true,
				alignment: 'center',
				color: '#ffffff',
				fillColor: pdfTheme.navy,
				margin: [0, 5, 0, 5],
			})),
		]
		for (let cellIndex = 0; cellIndex < totalCells; cellIndex += 7) {
			const row = []
			for (let offset = 0; offset < 7; offset += 1) {
				const dayNumber = cellIndex + offset - firstWeekday + 1
				if (dayNumber < 1 || dayNumber > daysInMonth) {
					row.push({ text: '', fillColor: '#f1f5f9', margin: [3, 3, 3, 3] })
					continue
				}
				const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
				const items = eventsByDate.get(dateKey) || []
				row.push({
					stack: [
						{ text: String(dayNumber), alignment: 'right', bold: true, color: pdfTheme.ink, fontSize: 8, margin: [0, 0, 0, 3] },
						...items.slice(0, 4).map(item => ({
							text: item.title,
							fontSize: 6.7,
							color: item.type === 'work' ? pdfTheme.blue : item.type === 'time' ? '#92400e' : item.type === 'note' ? pdfTheme.red : pdfTheme.green,
							margin: [0, 1, 0, 0],
						})),
						items.length > 4 ? { text: `+${items.length - 4} wpisów`, fontSize: 6.5, color: pdfTheme.muted, margin: [0, 2, 0, 0] } : null,
					].filter(Boolean),
					fillColor: offset >= 5 ? '#fbfdff' : '#ffffff',
					margin: [4, 4, 4, 4],
				})
			}
			body.push(row)
		}
		return {
			unbreakable: true,
			table: {
				widths: Array(7).fill('*'),
				body,
				heights: rowIndex => rowIndex === 0 ? 15 : 43,
				dontBreakRows: true,
				keepWithHeaderRows: body.length - 1,
			},
			layout: {
				hLineWidth: () => 0.7,
				vLineWidth: () => 0.7,
				hLineColor: () => pdfTheme.line,
				vLineColor: () => pdfTheme.line,
			},
			fontSize: 7,
		}
	}

	const pdfSummaryTables = () => {
		const sections = []
		if (showActivitySummary) {
			sections.push(
				pdfSectionTitle('Godziny wg czynności', selectedActivityIds.length > 0 ? getActivityFilterLabel(selectedActivityIds, enabledWorkActivities, i18n.language, t) : ''),
				{
					table: {
						headerRows: 1,
						widths: ['*', 45, 54, 58],
						body: [
							[
								{ text: 'Czynność', bold: true, color: '#ffffff' },
								{ text: 'Godz.', bold: true, color: '#ffffff', alignment: 'right' },
								{ text: 'Ilość', bold: true, color: '#ffffff', alignment: 'right' },
								{ text: 'Wydajność', bold: true, color: '#ffffff', alignment: 'right' },
							],
							...activitySummaryRows.map(row => [
								row.activityName,
								{ text: `${formatHours(row.hours)} h`, alignment: 'right' },
								{ text: row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '-', alignment: 'right' },
								{ text: row.efficiency ? `${row.efficiency} ${row.unit}/h` : '-', alignment: 'right' },
							]),
						],
					},
					layout: {
						fillColor: rowIndex => rowIndex === 0 ? pdfTheme.navy : (rowIndex % 2 === 0 ? '#f8fbff' : null),
						hLineColor: () => pdfTheme.line,
						vLineColor: () => pdfTheme.line,
					},
					fontSize: 8,
				}
			)
		}
		if (showTaskSummary) {
			sections.push(
				pdfSectionTitle('Godziny wg zadań', selectedTaskIds.length > 0 ? getTaskFilterLabel(selectedTaskIds, filterableTasks, t) : ''),
				{
					table: {
						headerRows: 1,
						widths: ['*', 55],
						body: [
							[
								{ text: 'Zadanie', bold: true, color: '#ffffff' },
								{ text: 'Godziny', bold: true, color: '#ffffff', alignment: 'right' },
							],
							...taskSummaryRows.map(row => [
								row.taskName,
								{ text: `${formatHours(row.hours)} h`, alignment: 'right' },
							]),
						],
					},
					layout: {
						fillColor: rowIndex => rowIndex === 0 ? pdfTheme.navy : (rowIndex % 2 === 0 ? '#f8fbff' : null),
						hLineColor: () => pdfTheme.line,
						vLineColor: () => pdfTheme.line,
					},
					fontSize: 8,
				}
			)
		}
		return sections
	}

	const generatePDF = async () => {
		if (!user) return
		setIsExportingExcel(true)
		try {
			const userName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
			const summarySections = pdfSummaryTables()
			const content = [
				{
					table: {
						widths: ['*', 160],
						body: [[
							{
								stack: [
									{ text: 'EWIDENCJA CZASU PRACY', fontSize: 8, bold: true, color: '#bfdbfe', characterSpacing: 1 },
									{ text: userName || 'Pracownik', fontSize: 17, bold: true, color: '#ffffff', margin: [0, 4, 0, 0] },
									user?.position ? { text: user.position, fontSize: 8, color: '#bfdbfe', margin: [0, 2, 0, 0] } : null,
								].filter(Boolean),
								border: [false, false, false, false],
								margin: [14, 9, 10, 9],
							},
							{
								stack: [
									{ text: `Okres: ${getReportMonthLabel()}`, fontSize: 9, color: '#dbeafe', alignment: 'right' },
									{
										text: isConfirmed ? 'Miesiąc potwierdzony' : 'Miesiąc niepotwierdzony',
										fontSize: 10,
										color: '#ffffff',
										bold: true,
										alignment: 'right',
										margin: [0, 5, 0, 0],
									},
								],
								border: [false, false, false, false],
								margin: [10, 12, 14, 8],
							},
						]],
					},
					layout: {
						hLineWidth: () => 0,
						vLineWidth: () => 0,
						fillColor: () => pdfTheme.navy,
					},
					margin: [0, 0, 0, 7],
				},
				pdfKpiCards(),
				pdfSectionTitle('Kalendarz miesiąca'),
				buildPdfCalendarTable(),
				...(summarySections.length > 0 ? [{ text: '', pageBreak: 'after', margin: [0, 0, 0, 0] }, ...summarySections] : []),
			]
			await downloadPdf(
				buildPdfDocument({
					content,
					pageOrientation: 'landscape',
					pageMargins: [18, 18, 18, 24],
					styles: {
						sectionTitle: { fontSize: 13, bold: true, color: pdfTheme.ink },
						sectionSubtitle: { fontSize: 8, color: pdfTheme.muted },
					},
					footer: (currentPage, pageCount) => ({
						columns: [
							{ text: 'Planopia', color: pdfTheme.muted, fontSize: 8 },
							{ text: `${currentPage}/${pageCount}`, alignment: 'right', color: pdfTheme.muted, fontSize: 8 },
						],
						margin: [24, 0, 24, 0],
					}),
					info: {
						title: `Ewidencja czasu pracy - ${userName}`,
						author: 'Planopia',
						subject: getReportMonthLabel(),
					},
				}),
				buildReportFilename({
					locale: i18n.resolvedLanguage,
					pl: 'raport-ewidencja-pracownika',
					en: 'employee-timesheet-report',
					parts: [userName, getReportMonthLabel()],
					extension: 'pdf',
				})
			)
		} catch (error) {
			console.error('generatePDF:', error)
			await showAlert(t('workcalendar.exportError') || 'Nie udało się wygenerować PDF.')
		} finally {
			setIsExportingExcel(false)
		}
	}

	const generateExcel = async () => {
		if (!user) return

		setIsExportingExcel(true)

		try {
			// Helper function to format date
			const formatDate = (date) => {
				return new Date(date).toLocaleDateString(i18n.resolvedLanguage, {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit'
				})
			}

			// Get all days in the current month
			const monthStart = new Date(currentYear, currentMonth, 1)
			const monthEnd = new Date(currentYear, currentMonth + 1, 0)
			const daysInMonth = monthEnd.getDate()

			// Filter workdays for current month
			const filteredWorkdays = workdays.filter(day => {
				const eventDate = new Date(day.date)
				return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear
			})

			// Create a map of workdays by date for quick lookup (może być wiele wpisów na dzień)
			const workdaysMap = new Map()
			filteredWorkdays.forEach(day => {
				const dateKey = new Date(day.date).toDateString()
				if (!workdaysMap.has(dateKey)) {
					workdaysMap.set(dateKey, [])
				}
				workdaysMap.get(dateKey).push(day)
			})

			// Filter accepted leave requests for current month
			const filteredLeaveRequests = Array.isArray(acceptedLeaveRequests) ? acceptedLeaveRequests.filter(request => {
				if (!request.startDate || !request.endDate) return false
				const startDate = new Date(request.startDate)
				const endDate = new Date(request.endDate)
				const requestStartMonth = startDate.getMonth()
				const requestStartYear = startDate.getFullYear()
				const requestEndMonth = endDate.getMonth()
				const requestEndYear = endDate.getFullYear()

				return (
					(requestStartYear === currentYear && requestStartMonth === currentMonth) ||
					(requestEndYear === currentYear && requestEndMonth === currentMonth) ||
					(requestStartYear < currentYear && requestEndYear > currentYear) ||
					(requestStartYear === currentYear && requestEndYear === currentYear && requestStartMonth <= currentMonth && requestEndMonth >= currentMonth)
				)
			}) : []

			// Create a map of leave requests by date
			const leaveRequestsMap = new Map()
			filteredLeaveRequests.forEach(request => {
				const startDate = new Date(request.startDate)
				const endDate = new Date(request.endDate)
				const currentDate = new Date(startDate)
				
				while (currentDate <= endDate) {
					const dateKey = currentDate.toDateString()
					if (!leaveRequestsMap.has(dateKey)) {
						leaveRequestsMap.set(dateKey, [])
					}
					leaveRequestsMap.get(dateKey).push(request)
					currentDate.setDate(currentDate.getDate() + 1)
				}
			})

			// Prepare detailed data for all days in month
			const detailedData = []
			
			// Add user name at the top
			detailedData.push([
				`${user.firstName} ${user.lastName}${user.position ? ` (${user.position})` : ''}`
			])
			detailedData.push([]) // Empty row for spacing
			
			// Add header row
			detailedData.push([
				t('workcalendar.excel.date'),
				t('workcalendar.excel.hoursWorked'),
				t('workcalendar.excel.overtime'),
				t('workcalendar.excel.worktime'),
				t('workcalendar.excel.absenceType'),
				t('workcalendar.excel.leaveType'),
				t('workcalendar.excel.notes')
			])

			// Add data for each day of the month
			for (let day = 1; day <= daysInMonth; day++) {
				const currentDate = new Date(currentYear, currentMonth, day)
				const dateKey = currentDate.toDateString()
				const workdaysForDate = workdaysMap.get(dateKey) || []
				const leaveRequests = leaveRequestsMap.get(dateKey) || []

				// Agreguj dane z wszystkich wpisów dla tego dnia
				let hoursWorked = ''
				let additionalWorked = ''
				let realTimeDayWorked = ''
				let absenceType = ''
				const allNotes = []

				workdaysForDate.forEach(workday => {
					// Godziny pracy - weź pierwszy wpis z godzinami (zaokr. do 0,5 h jak w UI)
					if (workday.hoursWorked != null && workday.hoursWorked !== '' && hoursWorked === '') {
						hoursWorked = excelHoursValue(workday.hoursWorked)
					}
					// Nadgodziny - weź pierwszy wpis z nadgodzinami
					if (workday.additionalWorked != null && workday.additionalWorked !== '' && additionalWorked === '') {
						additionalWorked = excelHoursValue(workday.additionalWorked)
					}
					// Czas pracy - weź pierwszy wpis z czasem pracy
					if (workday.realTimeDayWorked && !realTimeDayWorked) {
						realTimeDayWorked = workday.realTimeDayWorked
					}
					// Typ nieobecności - weź pierwszy wpis z nieobecnością
					if (workday.absenceType && !absenceType) {
						absenceType = t(workday.absenceType)
					}
					// Uwagi - zbierz wszystkie uwagi z wszystkich wpisów
					if (workday.notes && workday.notes.trim() !== '') {
						allNotes.push(workday.notes.trim())
					}
				})

				// Sprawdź czy dzień jest świętem i dodaj nazwę święta po dacie
				let dateWithHoliday = formatDate(currentDate)
				if (settings) {
					const holidayInfo = isHolidayDate(currentDate, settings)
					if (holidayInfo && holidayInfo.name) {
						dateWithHoliday = `${formatDate(currentDate)} (${holidayInfo.name})`
					}
				}

				const row = [
					dateWithHoliday,
					hoursWorked,
					additionalWorked,
					realTimeDayWorked,
					absenceType,
					leaveRequests.length > 0 ? leaveRequests.map(r => t(r.type)).join(', ') : '',
					allNotes.length > 0 ? allNotes.join(' | ') : ''
				]

				detailedData.push(row)
			}

			// Prepare summary data
			const summaryData = [
				[t('workcalendar.excel.summary'), ''],
				['', ''],
				[t('workcalendar.allfrommonth1'), totalWorkDays],
				[t('workcalendar.allfrommonth2'), `${formatHours(roundToHalfHour(totalHours))} ${t('workcalendar.allfrommonthhours')}`],
				[t('workcalendar.allfrommonth3'), `${formatHours(roundToHalfHour(additionalHours))} ${t('workcalendar.allfrommonthhours')}`],
				[t('workcalendar.allfrommonth4'), totalLeaveDays],
				[t('workcalendar.allfrommonth5'), totalOtherAbsences],
				['', ''],
				[t('workcalendar.excel.employee'), `${user.firstName} ${user.lastName}${user.position ? ` (${user.position})` : ''}`],
				[t('workcalendar.excel.period'), `${new Date(currentYear, currentMonth).toLocaleDateString(i18n.resolvedLanguage, { month: 'long', year: 'numeric' })}`],
				[t('workcalendar.excel.exportDate'), new Date().toLocaleDateString(i18n.resolvedLanguage, { 
					year: 'numeric', 
					month: 'long', 
					day: 'numeric',
					hour: '2-digit',
					minute: '2-digit'
				})]
			]

			const activitySheetRows = [
				[
					t('workcalendar.activities.excel.date'),
					t('workcalendar.activities.excel.activity'),
					t('workcalendar.activities.excel.hours'),
					t('workcalendar.activities.excel.quantity'),
					t('workcalendar.activities.excel.efficiency'),
					t('workcalendar.activities.excel.timeRange'),
				],
				...monthActivityRows.map(row => [
					row.date ? new Date(row.date).toLocaleDateString(i18n.resolvedLanguage) : '',
					row.activityName,
					excelHoursValue(row.hours),
					row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '',
					row.quantity > 0 && row.unit && row.hours > 0 ? `${Math.round((row.quantity / row.hours) * 100) / 100} ${row.unit}/h` : '',
					row.timeFrom && row.timeTo ? `${row.timeFrom}-${row.timeTo}` : '',
				]),
			]

			const activitySummarySheetRows = [
				[t('workcalendar.activities.excel.activity'), t('workcalendar.activities.excel.hours'), t('workcalendar.activities.excel.quantity'), t('workcalendar.activities.excel.efficiency')],
				...activitySummaryRows.map(row => [
					row.activityName,
					excelHoursValue(row.hours),
					row.quantity > 0 && row.unit ? `${row.quantity} ${row.unit}` : '',
					row.efficiency ? `${row.efficiency} ${row.unit}/h` : '',
				]),
			]

			const sheets = [
				{
					name: t('workcalendar.excel.sheetDetails'),
					rows: detailedData,
					colWidths: [30, 12, 15, 12, 15, 25, 25, 20],
					columnNumFmt: { 2: '0.0', 3: '0.0' },
					dataStartRow: 4,
				},
				{
					name: t('workcalendar.excel.sheetSummary'),
					rows: summaryData,
					colWidths: [30, 20],
				},
			]

			if (monthActivityRows.length > 0) {
				sheets.push({
					name: t('workcalendar.activities.excel.sheetActivities'),
					rows: activitySheetRows,
					colWidths: [14, 28, 10, 14, 14, 16],
					columnNumFmt: { 3: '0.0' },
					dataStartRow: 2,
				})
				sheets.push({
					name: t('workcalendar.activities.excel.summarySheet'),
					rows: activitySummarySheetRows,
					colWidths: [28, 12, 14, 14],
					columnNumFmt: { 2: '0.0' },
					dataStartRow: 2,
				})
			}

			const monthName = new Date(currentYear, currentMonth).toLocaleDateString(i18n.resolvedLanguage, {
				month: 'long',
			})
			const filename = buildReportFilename({
				locale: i18n.resolvedLanguage,
				pl: 'raport-ewidencja-pracownika',
				en: 'employee-timesheet-report',
				parts: [`${user.firstName} ${user.lastName}`, `${monthName} ${currentYear}`],
				extension: 'xlsx',
			})

			await downloadExcelWorkbook(sheets, filename)

			setIsExportingExcel(false)
		} catch (error) {
			console.error('Error generating Excel:', error)
			setIsExportingExcel(false)
			// Note: If useAlert is available, you can add it here
			// For now, error is logged to console
		}
	}

	const renderMonthToolbar = () => (
		<div className="calendar-controls monthly-calendar-toolbar user-calendar-month-toolbar flex flex-wrap items-center" style={{ columnGap: '10px', rowGap: '8px' }}>
			<div className="monthly-calendar-toolbar__nav">
				<select value={currentMonth} onChange={handleMonthSelect} style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px' }} className="calendar-month-select focus:outline-none focus:ring-2 focus:ring-blue-500">
					{Array.from({ length: 12 }, (_, i) => {
						const monthName = new Date(0, i).toLocaleString(i18n.resolvedLanguage, { month: 'long' })
						const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)
						return (
							<option key={i} value={i}>
								{capitalizedMonth}
							</option>
						)
					})}
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
					style={{ marginLeft: 0, padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: '600', color: '#495057', transition: 'all 0.2s ease' }}
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
			</div>
			{canEditManagedWorkdays && (
				<div className="workday-toolbar-actions monthly-calendar-toolbar__actions">
					<button
						type="button"
						onClick={() => setBulkFillModalOpen(true)}
						className="workday-bulk-fill-button"
					>
						{t('workcalendar.bulkFill.fill')}
					</button>
					<button
						type="button"
						onClick={handleClearManagedCurrentMonthEntries}
						disabled={clearWorkdaysForMonthMutation.isPending}
						title={t('workcalendar.clearMonthTooltip') || 'Wyczyść wpisy z miesiąca'}
						aria-label={t('workcalendar.clearMonthTooltip') || 'Wyczyść wpisy z miesiąca'}
						className="workday-clear-month-button"
					>
						{clearWorkdaysForMonthMutation.isPending
							? (t('workcalendar.clearingShort') || '...')
							: <img src="/img/trash.png" alt={t('workcalendar.clearMonthTooltip') || 'Wyczyść wpisy z miesiąca'} className="workday-clear-month-icon" />}
					</button>
				</div>
			)}
		</div>
	)

	const renderManagedMonthConfirmation = () => (
		canEditManagedWorkdays ? (
			<div className="managed-month-confirmation-summary">
				<button
					type="button"
					className={`newbutton-confirmmonth ${isConfirmed ? 'is-confirmed' : 'is-open'}`}
					onClick={handleManagedMonthConfirmationToggle}
					disabled={toggleConfirmationMutation.isPending}
				>
					{toggleConfirmationMutation.isPending
						? t('workcalendar.processing')
						: (isConfirmed
							? t('workcalendar.cancelconfirmation')
							: t('workcalendar.confirmmonthbutton'))}
				</button>
				<span className={`confirm-border ${isConfirmed ? 'is-confirmed' : 'is-open'}`}>
					<img
						src="/img/check.png"
						alt=""
						style={{
							width: '30px',
							marginRight: '8px',
							filter: isConfirmed ? 'none' : 'grayscale(100%)',
							opacity: isConfirmed ? 1 : 0.6,
						}}
					/>
					{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
				</span>
			</div>
		) : null
	)

	return (
		<>
			<Sidebar />
			{isCalendarInitialLoading ? (
				<div className="content-with-loader">
					<Loader />
				</div>
			) : (
			<div id="calendars-works-review" className='custom-flex'>
				<div style={{ display: 'flex', gap: '15px', flexDirection: 'column' }}><div className='pdfexcelbtns' style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start', marginBottom: '15px', marginLeft: '15px' }}>
					<button 
						onClick={generatePDF} 
						className="btn-pdf btn btn-primary"
						disabled={isExportingExcel}
					>
						{t('workcalendar.genepdf')}
					</button>
					<button 
						onClick={generateExcel} 
						className="btn-excel btn btn-success"
						disabled={isExportingExcel}
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '8px',
							opacity: isExportingExcel ? 0.6 : 1,
							cursor: isExportingExcel ? 'not-allowed' : 'pointer'
						}}
					>
						{isExportingExcel ? (
							<>
								<span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
								{t('workcalendar.exportingExcel')}
							</>
						) : (
							<>
								
								{t('workcalendar.exportExcel')}
							</>
						)}
					</button>
				</div>
				</div>
				<div ref={pdfRef} style={{ 
					marginTop: '15px',
					backgroundColor: '#ffffff',
					borderRadius: '8px'
				}}>
					{user && (
						<div style={{ 
							marginBottom: '20px',
							padding: '15px',
							backgroundColor: '#f8fafc',
							borderRadius: '6px',
							borderLeft: '4px solid #3b82f6',
							marginLeft: '10px',
							maxWidth: '700px'
						}}>
							<h3 style={{ 
								margin: '0',
								color: '#1e40af',
								fontSize: '18px',
								fontWeight: '600'
							}}>
								{t('workcalendar.h3admin')} {' '} 
								<span style={{ 
									fontWeight: 'bold',
									color: '#1f2937',
									marginLeft: '7px'
								}}>
									 {user.firstName} {user.lastName} {user.position && `(${user.position})`}
								</span>
							</h3>
							{user?.appAccessEnabled !== false && user?.appAccessEnabled != null && (
								<div
									style={{
										marginTop: '14px',
										color: isConfirmed ? '#166534' : '#92400e',
										fontWeight: 500,
									}}
								>
									{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
								</div>
							)}
						</div>
					)}

					<div className="row">
						<div className="col-xl-9 user-calendar-main-col">
							<div className="user-calendar-main-calendar">
								{renderMonthToolbar()}
								<FullCalendar
									plugins={[dayGridPlugin, interactionPlugin]}
									initialView="dayGridMonth"
									locale={i18n.resolvedLanguage}
									firstDay={1}
									showNonCurrentDates={false}
									events={calendarEvents}
									ref={calendarRef}
									eventContent={renderEventContent}
									dateClick={handleManagedDateClick}
									eventClick={handleManagedDateClick}
									displayEventTime={false}
									datesSet={handleMonthChange}
									headerToolbar={false}
									height="auto"
								/>
							</div>
							<div className="user-calendar-under-calendar">
								{(user?.appAccessEnabled === false || user?.appAccessEnabled == null) && (
									renderCalendarMetadata()
								)}
								{user?.appAccessEnabled !== false && user?.appAccessEnabled != null && (
									<div>
										{renderCalendarMetadata()}
									</div>
								)}

								{canEditManagedWorkdays && (
									<div className="managed-workday-review-panel">
										<div className="managed-workday-review-panel__header">
											<div>
												<h3>{t('workcalendar.dayReview.title')}</h3>
												<p>{t('workcalendar.dayReview.description')}</p>
											</div>
											<span>{currentMonthWorkdaysForReview.length}</span>
										</div>
										{currentMonthWorkdaysForReview.length === 0 ? (
											<div className="managed-workday-review-empty">{t('workcalendar.dayReview.empty')}</div>
										) : (
											<div className="managed-workday-review-list">
												{currentMonthWorkdaysForReview.map(day => {
													const reviewerName = formatReviewerName(day.reviewedBy)
													const addedByName = formatReviewerName(day.lastChangedBy)
													const reviewLabel = day.reviewStatus === 'approved'
															? t('workcalendar.dayReview.statusApproved')
															: day.reviewStatus === 'rejected'
																? t('workcalendar.dayReview.statusRejected')
																: t('workcalendar.dayReview.statusNone')
													return (
														<div key={day._id} className={`managed-workday-review-item ${day.reviewStatus ? `is-${day.reviewStatus}` : ''}`}>
															<div className="managed-workday-review-item__main">
																<div className="managed-workday-review-item__date">
																	{new Date(day.date).toLocaleDateString(i18n.resolvedLanguage, {
																		day: '2-digit',
																		month: 'long',
																		year: 'numeric',
																	})}
																</div>
																<div className="managed-workday-review-item__details">
																	{day.hoursWorked != null && day.hoursWorked !== '' && (
																		<span>{formatHours(roundToHalfHour(day.hoursWorked))} {t('workcalendar.allfrommonthhours')}</span>
																	)}
																	{day.additionalWorked != null && day.additionalWorked !== '' && (
																		<span>{t('workcalendar.bulkFill.overtime')}: {formatHours(roundToHalfHour(day.additionalWorked))}</span>
																	)}
																	{day.realTimeDayWorked && <span>{t('workcalendar.worktime')} {day.realTimeDayWorked}</span>}
																	{day.absenceType && <span>{t('workcalendar.h2modalabsence')} {day.absenceType}</span>}
																	{day.notes && <span>{t('workcalendar.notes')}: {day.notes}</span>}
																</div>
																<div className="managed-workday-review-item__meta">
																	<span>
																		{reviewerName
																			? `${reviewLabel} ${t('workcalendar.dayReview.by')}: ${reviewerName}`
																			: reviewLabel}
																	</span>
																	{addedByName && <span>{t('workcalendar.dayReview.addedBy')}: {addedByName}</span>}
																</div>
															</div>
															<div className="managed-workday-review-actions">
																<button
																	type="button"
																	className={`managed-review-action approve ${day.reviewStatus === 'approved' ? 'is-active' : ''}`}
																	onClick={() => handleReviewWorkday(day._id, 'approved')}
																	disabled={reviewWorkdayForUserMutation.isPending}
																>
																	{t('workcalendar.dayReview.approve')}
																</button>
																<button
																	type="button"
																	className={`managed-review-action reject ${day.reviewStatus === 'rejected' ? 'is-active' : ''}`}
																	onClick={() => handleReviewWorkday(day._id, 'rejected')}
																	disabled={reviewWorkdayForUserMutation.isPending}
																>
																	{t('workcalendar.dayReview.reject')}
																</button>
																{day.reviewStatus && (
																	<button
																		type="button"
																		className="managed-review-action clear"
																		onClick={() => handleReviewWorkday(day._id, null)}
																		disabled={reviewWorkdayForUserMutation.isPending}
																	>
																		{t('workcalendar.dayReview.clear')}
																	</button>
																)}
															</div>
														</div>
													)
												})}
											</div>
										)}
									</div>
								)}
							</div>
							<div className="work-session-list-mobile user-calendar-sessions-mobile">
								{settings?.timerEnabled !== false && allowTimerLeaveApis && (
									<WorkSessionList
										month={currentMonth}
										year={currentYear}
										userId={userId}
										timerQueriesEnabled={allowTimerLeaveApis}
										selectedActivityIds={selectedActivityIds}
										selectedTaskIds={selectedTaskIds}
									/>
								)}
							</div>
						</div>
						<div
							className={`col-xl-3 resume-month-work small-mt ${settings?.timerEnabled !== false && allowTimerLeaveApis ? 'resume-month-work--with-timer' : ''} ${allowTimerLeaveApis && activeTimer?.active && activeTimer.startTime ? 'resume-month-work--timer-active' : ''}`}
						>
				<h3 className="resumecales h3resume">{t('workcalendar.allfrommonth')}</h3>
				{teamHasWorkActivities({ workActivities }) && (
					<ActivityFilterBar
						activities={enabledWorkActivities}
						selectedIds={selectedActivityIds}
						onChange={setSelectedActivityIds}
						compact
					/>
				)}
				{tasksModuleEnabled && filterableTasks.length > 0 && (
					<TaskFilterBar
						tasks={filterableTasks}
						selectedIds={selectedTaskIds}
						onChange={setSelectedTaskIds}
						compact
					/>
				)}
				{renderManagedMonthConfirmation()}
				<p>
					{t('workcalendar.allfrommonth1')} {totalWorkDays}
				</p>
				<p>
					{t('workcalendar.allfrommonth2')} {formatSidebarTotal(totalHours)} {t('workcalendar.allfrommonthhours')}
				</p>
				<p>
					{t('workcalendar.allfrommonth3')} {formatHours(roundToHalfHour(additionalHours))} {getOvertimeWord(additionalHours)}
				</p>

				<p>
					{settings?.leaveCalculationMode === 'hours' 
						? `${t('workcalendar.allfrommonth4hours') || 'Łączna liczba godzin urlopu'}: ${totalLeaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
						: `${t('workcalendar.allfrommonth4')} ${totalLeaveDays} (${totalLeaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`
					}
				</p>
				{totalHolidays > 0 && (
					<p>
						{t('workcalendar.allfrommonth6') || 'Dni świąteczne:'} {totalHolidays}
					</p>
				)}
				<p>
					{t('workcalendar.allfrommonth5')} {totalOtherAbsences}
				</p>
				{showActivitySummary && (
					<div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
						<h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
							{t('workcalendar.activities.summaryTitle')}
							{selectedActivityIds.length > 0
								? ` · ${getActivityFilterLabel(selectedActivityIds, enabledWorkActivities, i18n.language, t)}`
								: ''}
						</h4>
						{activitySummaryRows.map(row => (
							<p key={row.activityId} style={{ margin: '0 0 6px', fontSize: '13px' }}>
								{row.activityName}: <strong>{formatBreakdownRow(row.hours)} h</strong>
								{row.quantity > 0 && row.unit ? (
									<span> · {row.quantity} {row.unit}{row.efficiency ? ` · ${row.efficiency} ${row.unit}/h` : ''}</span>
								) : null}
							</p>
						))}
					</div>
				)}
				{showTaskSummary && (
					<div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
						<h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
							{t('workcalendar.tasks.summaryTitle')}
							{selectedTaskIds.length > 0
								? ` · ${getTaskFilterLabel(selectedTaskIds, filterableTasks, t)}`
								: ''}
						</h4>
						{taskSummaryRows.map(row => (
							<p key={row.taskId} style={{ margin: '0 0 6px', fontSize: '13px' }}>
								{row.taskName}: <strong>{formatTaskBreakdownRow(row.hours)} h</strong>
							</p>
						))}
					</div>
				)}
			</div>
					</div>
				</div>

			</div>
					)}
			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => {
					setModalIsOpen(false)
					resetManagedForm()
				}}
				className="monthly-calendar-modal managed-workday-modal"
				overlayClassName="managed-workday-modal-overlay"
				style={{
					overlay: {
						position: 'fixed',
						inset: 0,
						zIndex: 100000,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						padding: '24px',
						backgroundColor: 'rgba(15, 23, 42, 0.38)',
						overflowY: 'auto',
					},
					content: {
						position: 'relative',
						inset: 'auto',
						width: 'min(820px, calc(100vw - 32px))',
						maxWidth: '820px',
						maxHeight: 'calc(100vh - 48px)',
						margin: 0,
						marginLeft: 0,
						padding: 0,
						border: 0,
						borderRadius: '12px',
						background: '#fff',
						boxShadow: '0 24px 70px rgba(15, 23, 42, 0.24)',
						overflow: 'auto',
					},
				}}
				contentLabel="Wpis czasu pracy za pracownika"
			>
				<form onSubmit={handleManagedSubmit} style={{ display: 'grid', gap: '14px' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
						<div>
							<h2 style={{ margin: 0, fontSize: '20px', color: '#2c3e50' }}>
								{editingWorkday ? 'Edytuj wpis' : 'Dodaj wpis'}
							</h2>
							<p style={{ margin: '4px 0 0', color: '#6c757d', fontSize: '14px' }}>
								{user?.firstName} {user?.lastName} · {selectedDate}
							</p>
							<p style={{ margin: '8px 0 0', color: '#64748b', fontSize: '13px' }}>
								{t('workcalendar.entryHint') || 'Wpisz godziny pracy albo nieobecność.'}
							</p>
						</div>
						<button
							type="button"
							onClick={() => {
								setModalIsOpen(false)
								resetManagedForm()
							}}
							className="monthly-calendar-modal__close"
						>
							×
						</button>
					</div>

					{formError && (
						<div style={{ backgroundColor: '#fff5f5', color: '#c0392b', border: '1px solid #f5c6cb', borderRadius: '6px', padding: '10px 12px', fontSize: '14px' }}>
							{formError}
						</div>
					)}
					{isConfirmed && (
						<div style={{ backgroundColor: '#fff7ed', color: '#9a3412', border: '1px solid #fed7aa', borderRadius: '6px', padding: '10px 12px', fontSize: '14px' }}>
							{t('workcalendar.bulkFill.errors.monthConfirmed')}
						</div>
					)}

					<div style={{ opacity: hasManagedAbsenceEntryInput ? 0.55 : 1, transition: 'opacity 0.2s ease' }}>
						<WorkdayHoursWithActivities {...workdayHoursFieldProps} />
					</div>

					<div
						className="bulk-fill-absence-card"
						style={{ opacity: hasManagedHoursEntryInput ? 0.55 : 1, transition: 'opacity 0.2s ease' }}
					>
						<label>
							<span style={{ display: 'block', fontWeight: 700, marginBottom: '4px', color: '#13294b' }}>{t('workcalendar.bulkFill.absence')}</span>
							<span style={{ display: 'block', marginBottom: '8px', color: '#64748b', fontSize: '13px' }}>
								{t('workcalendar.bulkFill.absenceHint')}
							</span>
						<input
							type="text"
							placeholder={t('workcalendar.bulkFill.absencePlaceholder')}
							value={absenceType}
							onChange={(e) => handleAbsenceChange(e.target.value)}
							className="w-full border border-gray-300 rounded-md px-4 py-2"
						/>
						</label>
					</div>

					<label>
						<span style={{ display: 'block', fontWeight: 600, marginBottom: '6px' }}>Uwagi</span>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							rows={3}
							className="w-full border border-gray-300 rounded-md px-4 py-2"
						/>
					</label>

					<div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
						{editingWorkday && (
							<button type="button" className="btn btn-danger" onClick={handleManagedDelete} disabled={deleteWorkdayForUserMutation.isPending}>
								{t('workcalendar.delete')}
							</button>
						)}
						<div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
							<button
								type="button"
								className="btn btn-secondary"
								onClick={() => {
									setModalIsOpen(false)
									resetManagedForm()
								}}
							>
								{t('workcalendar.cancel')}
							</button>
							<button
								type="submit"
								className="btn btn-primary"
								disabled={isConfirmed || createWorkdayForUserMutation.isPending || updateWorkdayForUserMutation.isPending}
							>
								{t('workcalendar.save')}
							</button>
						</div>
					</div>
				</form>
			</Modal>
			<BulkFillWorkdaysModal
				isOpen={bulkFillModalOpen}
				onClose={() => setBulkFillModalOpen(false)}
				onSubmit={handleBulkFillSubmit}
				settings={settings}
				workActivities={workActivities}
				timesheetTasks={timesheetTasks}
				tasksModuleEnabled={tasksModuleEnabled}
				currentMonth={currentMonth}
				currentYear={currentYear}
				isPending={bulkFillWorkdaysMutation.isPending}
				disabledReason={isConfirmed ? t('workcalendar.bulkFill.errors.monthConfirmed') : ''}
			/>
		</>
	)
}

export default UserCalendar
