import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Sidebar from '../dashboard/Sidebar'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import * as XLSX from 'xlsx'
import { API_URL } from '../../config.js'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useUser } from '../../hooks/useUsers'
import { useUserWorkdays } from '../../hooks/useWorkdays'
import { useCalendarConfirmation } from '../../hooks/useCalendar'
import { useUserAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'

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
	const pdfRef = useRef()
	const calendarRef = useRef(null)
	const { t, i18n } = useTranslation()
	
	// Funkcja do poprawnej odmiany słowa "nadgodziny" w języku polskim
	const getOvertimeWord = (count) => {
		if (i18n.language !== 'pl') {
			// Dla innych języków użyj standardowego tłumaczenia
			return count === 1 ? t('workcalendar.overtime1') : t('workcalendar.overtime5plus')
		}
		
		// Polska odmiana:
		// 1 → "nadgodzina"
		// 2-4, 22-24, 32-34... → "nadgodziny" (z wyjątkiem 12-14)
		// 0, 5-21, 25-31... → "nadgodzin"
		
		if (count === 1) {
			return t('workcalendar.overtime1')
		}
		
		const lastDigit = count % 10
		const lastTwoDigits = count % 100
		
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

	// Funkcja do formatowania godzin - usuwa niepotrzebne zera dziesiętne (np. 8.5 zamiast 8.50, 8 zamiast 8.0)
	const formatHours = (hours) => {
		if (hours === null || hours === undefined) return ''
		const numHours = typeof hours === 'number' ? hours : parseFloat(hours)
		if (isNaN(numHours)) return ''
		// Jeśli liczba jest całkowita, wyświetl bez miejsc dziesiętnych
		if (numHours % 1 === 0) return numHours.toString()
		// W przeciwnym razie wyświetl z jedną cyfrą po przecinku, ale usuń końcowe zera
		return numHours.toFixed(1).replace(/\.0$/, '')
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
	const { data: user, isLoading: loadingUser } = useUser(userId)
	const { data: workdays = [], isLoading: loadingWorkdays } = useUserWorkdays(userId)
	const { data: isConfirmed = false, isLoading: loadingConfirmation } = useCalendarConfirmation(
		currentMonth,
		currentYear,
		userId
	)
	const { data: acceptedLeaveRequests = [], isLoading: loadingLeaveRequests } = useUserAcceptedLeaveRequests(userId)
	const { data: settings } = useSettings()

	const loading = loadingUser || loadingWorkdays || loadingConfirmation || loadingLeaveRequests

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

	useEffect(() => {
		calculateTotals(workdays, acceptedLeaveRequests, currentMonth, currentYear)
	}, [workdays, acceptedLeaveRequests, currentMonth, currentYear, settings])

	const calculateTotals = (workdays, acceptedLeaveRequests, month, year) => {
		if (!settings) return // Czekaj na załadowanie ustawień
		let hours = 0
		let leaveDays = 0
		let overtime = 0
		let workDaysSet = new Set()
		let otherAbsences = 0

		const filteredWorkdays = workdays.filter(day => {
			const eventDate = new Date(day.date)
			return eventDate.getMonth() === month && eventDate.getFullYear() === year
		})

		filteredWorkdays.forEach(day => {
			if (day.hoursWorked) {
				hours += day.hoursWorked
				workDaysSet.add(new Date(day.date).toDateString())
			}
			if (day.additionalWorked) {
				overtime += day.additionalWorked
			}
			if (day.absenceType) {
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
		setTotalLeaveHours(leaveDays * 8)
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

	const generatePDF = () => {
		const input = pdfRef.current
		
		// Lepsze opcje dla html2canvas
		html2canvas(input, { 
			scale: 1.5,
			useCORS: true,
			allowTaint: true,
			backgroundColor: '#ffffff'
		}).then(canvas => {
			const imgData = canvas.toDataURL('image/png')
			const pdf = new jsPDF('l', 'mm', 'a4') // Orientacja pozioma (landscape)
			
			const imgProps = pdf.getImageProperties(imgData)
			const pdfWidth = pdf.internal.pageSize.getWidth()
			const pdfHeight = pdf.internal.pageSize.getHeight()
			
			// Oblicz optymalne wymiary żeby kalendarz zajmował całą stronę
			const imgWidth = pdfWidth - 20 // Margines 10mm z każdej strony
			const imgHeight = (imgProps.height * imgWidth) / imgProps.width
			
			// Jeśli obraz jest za wysoki, zmniejsz proporcjonalnie
			let finalWidth = imgWidth
			let finalHeight = imgHeight
			
			if (imgHeight > pdfHeight - 20) {
				finalHeight = pdfHeight - 20
				finalWidth = (imgProps.width * finalHeight) / imgProps.height
			}
			
			// Wycentruj obraz na stronie
			const x = (pdfWidth - finalWidth) / 2
			const y = (pdfHeight - finalHeight) / 2
			
			pdf.addImage(imgData, 'PNG', x, y, finalWidth, finalHeight)
			
			
			
			pdf.save(`${t('pdf.filename')}_${user?.firstName}_${user?.lastName}_${currentMonth + 1}_${currentYear}.pdf`)
		})
	}

	const generateExcel = () => {
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
					// Godziny pracy - weź pierwszy wpis z godzinami
					if (workday.hoursWorked && !hoursWorked) {
						hoursWorked = workday.hoursWorked
					}
					// Nadgodziny - weź pierwszy wpis z nadgodzinami
					if (workday.additionalWorked && !additionalWorked) {
						additionalWorked = workday.additionalWorked
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
				[t('workcalendar.allfrommonth2'), `${formatHours(totalHours)} ${t('workcalendar.allfrommonthhours')}`],
				[t('workcalendar.allfrommonth3'), `${formatHours(additionalHours)} ${t('workcalendar.allfrommonthhours')}`],
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

			// Create workbook
			const wb = XLSX.utils.book_new()

			// Create detailed sheet
			const wsDetails = XLSX.utils.aoa_to_sheet(detailedData)
			
			// Set column widths for detailed sheet
			wsDetails['!cols'] = [
				{ wch: 30 }, // User name (first row)
				{ wch: 12 }, // Date
				{ wch: 15 }, // Hours worked
				{ wch: 12 }, // Overtime
				{ wch: 15 }, // Working hours (worktime)
				{ wch: 25 }, // Absence type
				{ wch: 25 }, // Leave type
				{ wch: 20 }  // Notes
			]

			// Create summary sheet
			const wsSummary = XLSX.utils.aoa_to_sheet(summaryData)
			
			// Set column widths for summary sheet
			wsSummary['!cols'] = [
				{ wch: 30 }, // Label
				{ wch: 20 }  // Value
			]

			// Add sheets to workbook
			XLSX.utils.book_append_sheet(wb, wsDetails, t('workcalendar.excel.sheetDetails'))
			XLSX.utils.book_append_sheet(wb, wsSummary, t('workcalendar.excel.sheetSummary'))

			// Generate filename
			const monthName = new Date(currentYear, currentMonth).toLocaleDateString(i18n.resolvedLanguage, { month: 'long' })
			const filename = `${t('workcalendar.excel.filename')}_${user.firstName}_${user.lastName}_${monthName}_${currentYear}.xlsx`

			// Write and download
			XLSX.writeFile(wb, filename)

			setIsExportingExcel(false)
		} catch (error) {
			console.error('Error generating Excel:', error)
			setIsExportingExcel(false)
			// Note: If useAlert is available, you can add it here
			// For now, error is logged to console
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
				<div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
					<select value={currentMonth} onChange={handleMonthSelect} style={{ padding: '8px 12px', border: '1px solid #bdc3c7', borderRadius: '6px', fontSize: '16px', marginLeft: '10px' }} className="focus:outline-none focus:ring-2 focus:ring-blue-500">
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
							marginLeft: '5px',
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
						</div>
					)}

					<div className="calendar-controls" style={{ 
						padding: '10px 15px',
						// backgroundColor: isConfirmed ? '#dcfce7' : '#fef3c7',
						borderRadius: '6px',
						// border: `1px solid ${isConfirmed ? '#22c55e' : '#f59e0b'}`
					}}>
						<label style={{ 
							display: 'flex', 
							alignItems: 'center',
							margin: '0',
							color: isConfirmed ? '#166534' : '#92400e',
							fontWeight: '500',
							padding: '0'
						}}>
							{/* <input 
								type="checkbox" 
								checked={isConfirmed} 
								readOnly 
								style={{ 
									marginRight: '8px',
									transform: 'scale(1.2)'
								}} 
							/> */}
							{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
						</label>
					</div>

					<div className="row">
						<div className="col-xl-9">
							<FullCalendar
								plugins={[dayGridPlugin, interactionPlugin]}
								initialView="dayGridMonth"
								locale={i18n.resolvedLanguage}
								firstDay={1}
								showNonCurrentDates={false}
								events={[
									...workdays.map(day => {
										// Określ tytuł w zależności od typu wpisu
										let title = ''
										const hasAbsenceType = day.absenceType && typeof day.absenceType === 'string' && day.absenceType.trim() !== '' && day.absenceType !== 'null' && day.absenceType.toLowerCase() !== 'null'
										const hasHoursWorked = day.hoursWorked && day.hoursWorked > 0
										const hasOnlyNotes = !hasHoursWorked && !hasAbsenceType && day.notes && day.notes.trim() !== ''
										
										if (hasHoursWorked) {
											// Wpis z godzinami pracy
											title = `${formatHours(day.hoursWorked)} ${t('workcalendar.allfrommonthhours')}`
											if (day.additionalWorked) {
												title += ` ${t('workcalendar.include')} ${formatHours(day.additionalWorked)} ${getOvertimeWord(day.additionalWorked)}`
											}
											if (day.notes) {
												title += ` | ${day.notes}`
											}
										} else if (hasAbsenceType) {
											// Wpis z typem nieobecności
											title = day.absenceType
											if (day.notes) {
												title += ` | ${day.notes}`
											}
										} else if (day.notes) {
											// Tylko uwagi (bez hoursWorked i bez absenceType)
											title = day.notes
										}
										
										// Określ kolor tła - uwagi zawsze mają swój kolor
										let backgroundColor = 'green' // Domyślnie zielony dla nieobecności
										let classNames = 'event-absence' // Domyślnie event-absence
										
										if (hasHoursWorked) {
											// Godziny pracy - niebieski (priorytet najwyższy)
											backgroundColor = 'blue'
											classNames = 'event-workday'
										} else if (hasAbsenceType) {
											// Nieobecność - zielony
											backgroundColor = 'green'
											classNames = 'event-absence'
										} else if (hasOnlyNotes) {
											// Tylko uwagi - ciemno czerwony (tylko gdy nie ma hoursWorked i absenceType)
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
									}),
									...workdays
										.filter(day => day.realTimeDayWorked)
										.map(day => ({
											title: `${t('workcalendar.worktime')} ${day.realTimeDayWorked}`,
											start: day.date,
											backgroundColor: 'yellow',
											textColor: 'black',
											id: `${day._id}-realTime`,
											classNames: 'event-real-time',
										})),
									// Zaakceptowane wnioski urlopowe
									...acceptedLeaveRequests
										.filter(request => request.startDate && request.endDate)
										.flatMap(request => {
											const dates = generateDateRangeForCalendar(request.startDate, request.endDate)
											return dates.map(date => ({
												title: `${t(request.type)}`,
												start: date,
												allDay: true,
												textColor: 'white',
												classNames: 'event-absence',
												extendedProps: { 
													type: 'leaveRequest', 
													requestId: request._id,
													isAbsence: true
												}
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
									})),
								]}
								ref={calendarRef}
								eventContent={renderEventContent}
								displayEventTime={false}
								datesSet={handleMonthChange}
								height="auto"
							/>
						</div>
						<div className="col-xl-3 resume-month-work small-mt">
				<h3 className="resumecales h3resume">{t('workcalendar.allfrommonth')}</h3>
				<p>
					{t('workcalendar.allfrommonth1')} {totalWorkDays}
				</p>
				<p>
					{t('workcalendar.allfrommonth2')} {formatHours(totalHours)} {t('workcalendar.allfrommonthhours')}
				</p>
				<p>
					{t('workcalendar.allfrommonth3')} {formatHours(additionalHours)} {getOvertimeWord(Math.round(additionalHours))}
				</p>

				<p>
					{t('workcalendar.allfrommonth4')} {totalLeaveDays} ({totalLeaveHours} {t('workcalendar.allfrommonthhours')})
				</p>
				{totalHolidays > 0 && (
					<p>
						{t('workcalendar.allfrommonth6') || 'Dni świąteczne:'} {totalHolidays}
					</p>
				)}
				<p>
					{t('workcalendar.allfrommonth5')} {totalOtherAbsences}
				</p>
			</div>
					</div>
				</div>
			</div>
			)}
		</>
	)
}

export default UserCalendar
