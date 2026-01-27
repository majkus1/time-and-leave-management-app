import React, { useState, useEffect, useRef } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import Loader from '../Loader'
import { useAlert } from '../../context/AlertContext'
import { useWorkdays, useCreateWorkday, useDeleteWorkday, useUpdateWorkday } from '../../hooks/useWorkdays'
import { useCalendarConfirmation, useToggleCalendarConfirmation } from '../../hooks/useCalendar'
import { useAcceptedLeaveRequests } from '../../hooks/useLeaveRequests'
import { useSettings } from '../../hooks/useSettings'
import { getHolidaysInRange, isHolidayDate } from '../../utils/holidays'
import { getLeaveRequestTypeName } from '../../utils/leaveRequestTypes'
import TimerPanel from './TimerPanel'
import WorkSessionList from './WorkSessionList'

function MonthlyCalendar() {
	const [modalIsOpen, setModalIsOpen] = useState(false)
	const [selectedDate, setSelectedDate] = useState(null)
	const [hoursWorked, setHoursWorked] = useState('')
	const [additionalWorked, setAdditionalWorked] = useState('')
	const [absenceType, setAbsenceType] = useState('')
	const [totalHours, setTotalHours] = useState(0)
	const [additionalHours, setAdditionalHours] = useState(0)
	const [totalLeaveDays, setTotalLeaveDays] = useState(0)
	const [totalLeaveHours, setTotalLeaveHours] = useState(0)
	const [totalWorkDays, setTotalWorkDays] = useState(0)
	const [totalOtherAbsences, setTotalOtherAbsences] = useState(0)
	const [totalHolidays, setTotalHolidays] = useState(0)
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [realTimeDayWorked, setRealTimeDayWorked] = useState('')
	const [notes, setNotes] = useState('')
	const [errorMessage, setErrorMessage] = useState('')
	const [isHolidayDay, setIsHolidayDay] = useState(false)
	const [isWeekendDay, setIsWeekendDay] = useState(false)
	const [selectedWorkHoursIndex, setSelectedWorkHoursIndex] = useState(0)
	const calendarRef = useRef(null)
	
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
	const { t, i18n } = useTranslation()
	const { showAlert, showConfirm } = useAlert()
	
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

	// TanStack Query hooks
	const { data: workdays = [], isLoading: loadingWorkdays, refetch: refetchWorkdays } = useWorkdays()
	const { data: isConfirmed = false, isLoading: loadingConfirmation } = useCalendarConfirmation(
		currentMonth,
		currentYear
	)
	const { data: acceptedLeaveRequests = [], isLoading: loadingLeaveRequests } = useAcceptedLeaveRequests()
	const { data: settings } = useSettings()
	const createWorkdayMutation = useCreateWorkday()
	const deleteWorkdayMutation = useDeleteWorkday()
	const updateWorkdayMutation = useUpdateWorkday()
	const toggleConfirmationMutation = useToggleCalendarConfirmation()

	const loading = loadingWorkdays || loadingConfirmation || loadingLeaveRequests

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

	useEffect(() => {
		calculateTotals(workdays, acceptedLeaveRequests, currentMonth, currentYear)
	}, [workdays, acceptedLeaveRequests, currentMonth, currentYear, settings])

	const toggleConfirmationStatus = async () => {
		try {
			await toggleConfirmationMutation.mutateAsync({
				month: currentMonth,
				year: currentYear,
				isConfirmed: !isConfirmed,
			})
			await showAlert(
				isConfirmed ? t('workcalendar.cancelconfirm') : t('workcalendar.successconfirm')
			)
		} catch (error) {
			console.error('Failed to toggle confirmation status:', error)
		}
	}

	const calculateTotals = (workdays, acceptedLeaveRequests, month, year) => {
		if (!settings) return // Czekaj na załadowanie ustawień
		let hours = 0
		let leaveDays = 0
		let workDaysSet = new Set()
		let otherAbsences = 0
		let overtime = 0

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
				const translatedType = getLeaveRequestTypeName(settings, request.type, t, i18n.resolvedLanguage).toLowerCase()
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

	const handleDateClick = async info => {
		// Determine clicked date from event or date click
		const clickedDate = info.date ? info.dateStr : (info.event ? info.event.startStr : info.dateStr)
		
		// Skip if it's a leave request event (we don't want to edit those)
		if (info.event && info.event.extendedProps?.type === 'leaveRequest') {
			return
		}

		setSelectedDate(clickedDate)
		
		// Sprawdź czy kliknięty dzień jest świętem
		const clickedDateObj = new Date(clickedDate)
		const isHoliday = settings ? isHolidayDate(clickedDateObj, settings) !== null : false
		setIsHolidayDay(isHoliday)
		
		// Sprawdź czy kliknięty dzień jest weekendem i zespół nie pracuje w weekendy
		const workOnWeekends = settings?.workOnWeekends !== false // Domyślnie true
		const isWeekendDate = isWeekend(clickedDateObj)
		const isWeekendDayLocal = !workOnWeekends && isWeekendDate // Weekend dzień tylko gdy zespół nie pracuje w weekendy
		setIsWeekendDay(isWeekendDayLocal)
		
		// Find existing workdays for this date (excluding realTime entries)
		const clickedDateStr = clickedDateObj.toDateString()
		const existingWorkdays = workdays.filter(day => {
			const dayDate = new Date(day.date)
			return dayDate.toDateString() === clickedDateStr
		})
		
		// Auto-fill work hours from settings if no existing entries and not a holiday and not a weekend (when workOnWeekends = false)
		// Używamy lokalnej zmiennej isWeekendDayLocal zamiast state, bo state jest asynchroniczny
		if (existingWorkdays.length === 0 && !isHoliday && !isWeekendDayLocal && settings && settings.workHours) {
			// Obsługa nowego formatu (tablica) i starego (obiekt) dla kompatybilności wstecznej
			let workHoursToUse = null
			if (Array.isArray(settings.workHours) && settings.workHours.length > 0) {
				// Nowy format - użyj pierwszej konfiguracji (lub wybranej jeśli jest więcej)
				workHoursToUse = settings.workHours[selectedWorkHoursIndex] || settings.workHours[0]
				setSelectedWorkHoursIndex(0) // Reset do pierwszej przy otwieraniu modala
			} else if (settings.workHours && !Array.isArray(settings.workHours) && settings.workHours.timeFrom && settings.workHours.timeTo) {
				// Stary format - kompatybilność wsteczna
				workHoursToUse = settings.workHours
			}
			
			if (workHoursToUse && workHoursToUse.timeFrom && workHoursToUse.timeTo) {
				const timeRange = `${workHoursToUse.timeFrom}-${workHoursToUse.timeTo}`
				setRealTimeDayWorked(timeRange)
				if (workHoursToUse.hours) {
					setHoursWorked(workHoursToUse.hours.toString())
				}
			}
		} else if (isWeekendDayLocal || isHoliday) {
			// Jeśli to weekend lub święto, wyczyść pola godzin pracy i nieobecności
			setHoursWorked('')
			setAdditionalWorked('')
			setRealTimeDayWorked('')
			setAbsenceType('')
		}
		
		setModalIsOpen(true)
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

	const handleSubmit = async e => {
		e.preventDefault()

		// Normalizuj wartości - usuń białe znaki i sprawdź czy są puste
		const hoursWorkedValue = hoursWorked && hoursWorked.trim() !== '' ? hoursWorked.trim() : ''
		const additionalWorkedValue = additionalWorked && additionalWorked.trim() !== '' ? additionalWorked.trim() : ''
		const absenceTypeValue = absenceType && absenceType.trim() !== '' ? absenceType.trim() : ''
		const notesValue = notes && notes.trim() !== '' ? notes.trim() : ''

		// Walidacja godzin - sprawdź czy wartości są prawidłowe (wielokrotności 0.5, zakres 0-24)
		const validateHours = (value, maxHours = 24) => {
			if (!value || value.trim() === '') return true // Pusty jest OK
			const numValue = parseFloat(value)
			if (isNaN(numValue) || numValue < 0 || numValue > maxHours) return false
			// Sprawdź czy wartość jest wielokrotnością 0.5 (z tolerancją dla błędów zmiennoprzecinkowych)
			const remainder = (numValue * 2) % 1
			return Math.abs(remainder) < 0.01 || Math.abs(remainder - 1) < 0.01
		}

		if (hoursWorkedValue && !validateHours(hoursWorkedValue, 24)) {
			setErrorMessage(t('workcalendar.invalidHours') || 'Godziny muszą być liczbą od 0 do 24, możesz wpisać pół godziny (np. 8.5).')
			return
		}

		if (additionalWorkedValue && !validateHours(additionalWorkedValue, 100)) {
			setErrorMessage(t('workcalendar.invalidOvertime') || 'Nadgodziny muszą być liczbą większą lub równą 0, możesz wpisać pół godziny (np. 1.5).')
			return
		}

		// Sprawdź czy próbujemy dodać tylko uwagi
		const isNotesOnly = !hoursWorkedValue && !absenceTypeValue && notesValue

		// Jeśli dzień jest świętem, pozwól tylko na dodanie uwag
		if (isHolidayDay && (hoursWorkedValue || absenceTypeValue)) {
			setErrorMessage(t('workcalendar.holidayOnlyNotes') || 'W dniu świątecznym można dodać tylko uwagi.')
			return
		}

		// Jeśli dzień jest weekendem i zespół nie pracuje w weekendy, pozwól tylko na dodanie uwag
		if (isWeekendDay && (hoursWorkedValue || absenceTypeValue)) {
			setErrorMessage(t('workcalendar.weekendOnlyNotes') || 'W weekendzie (gdy zespół nie pracuje w weekendy) można dodać tylko uwagi.')
			return
		}

		// Sprawdź czy dla tej daty nie ma już wpisu
		if (selectedDate) {
			const clickedDateObj = new Date(selectedDate)
			const clickedDateStr = clickedDateObj.toDateString()
			const existingWorkdays = workdays.filter(day => {
				const dayDate = new Date(day.date)
				return dayDate.toDateString() === clickedDateStr
			})

			// Jeśli istnieje wpis, sprawdź czy ma tylko uwagi
			if (existingWorkdays.length > 0) {
				// Sprawdź czy istniejący wpis ma tylko uwagi (bez hoursWorked i bez absenceType)
				const hasOnlyNotes = existingWorkdays.every(day => 
					!day.hoursWorked && !day.additionalWorked && !day.realTimeDayWorked && !day.absenceType && day.notes
				)
				
				// Jeśli istniejący wpis ma tylko uwagi i próbujemy dodać godziny/nieobecność, sprawdź czy to nie weekend/święto
				if (hasOnlyNotes && (hoursWorkedValue || absenceTypeValue)) {
					// Jeśli to weekend lub święto, zablokuj dodawanie godzin/nieobecności
					if (isWeekendDay || isHolidayDay) {
						setErrorMessage(isHolidayDay 
							? (t('workcalendar.holidayOnlyNotes') || 'W dniu świątecznym można dodać tylko uwagi.')
							: (t('workcalendar.weekendOnlyNotes') || 'W weekendzie (gdy zespół nie pracuje w weekendy) można dodać tylko uwagi.')
						)
						return
					}
					// Pozwól na aktualizację - logika będzie obsłużona dalej
				} else if (!hasOnlyNotes && !isNotesOnly) {
					// Jeśli istniejący wpis ma już godziny/nieobecność i próbujemy dodać coś innego, zablokuj
				setErrorMessage(t('workcalendar.oneactionforday'))
				return
				} else if (!hasOnlyNotes && isNotesOnly) {
					// Jeśli istniejący wpis ma już godziny/nieobecność i próbujemy dodać tylko uwagi, pozwól na to
					// (logika będzie obsłużona dalej)
				}
			}

			// Sprawdź czy ten dzień jest w zakresie zaakceptowanego wniosku urlopowego/nieobecności
			// Jeśli próbujemy dodać tylko uwagi, pozwól na to nawet gdy jest zaakceptowany wniosek
			if (Array.isArray(acceptedLeaveRequests) && !isNotesOnly) {
				const hasAcceptedRequest = acceptedLeaveRequests.some(request => {
					if (!request.startDate || !request.endDate) return false
					
					const startDate = new Date(request.startDate)
					const endDate = new Date(request.endDate)
					
					// Sprawdź czy kliknięta data jest w zakresie wniosku (włącznie z datą końcową)
					const clickedDateOnly = new Date(clickedDateObj.getFullYear(), clickedDateObj.getMonth(), clickedDateObj.getDate())
					const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
					const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
					
					return clickedDateOnly >= startDateOnly && clickedDateOnly <= endDateOnly
				})
				
				if (hasAcceptedRequest) {
					setErrorMessage(t('workcalendar.cannotAddToAcceptedLeave') || 'Nie można dodawać wydarzeń do dnia z zaakceptowanym wnioskiem urlopowym/nieobecnością')
					return
				}
			}
		}

		if (hoursWorkedValue && absenceTypeValue) {
			setErrorMessage(t('workcalendar.formalerttwo'))
			return
		}

		// Jeśli istnieje wpis, pozwól tylko na dodanie uwag
		const clickedDateObj = new Date(selectedDate)
		const clickedDateStr = clickedDateObj.toDateString()
		const existingWorkdays = workdays.filter(day => {
			const dayDate = new Date(day.date)
			return dayDate.toDateString() === clickedDateStr
		})

		// Sprawdź czy jest zaakceptowany wniosek urlopowy dla tej daty
		const hasAcceptedRequest = Array.isArray(acceptedLeaveRequests) && acceptedLeaveRequests.some(request => {
			if (!request.startDate || !request.endDate) return false
			const startDate = new Date(request.startDate)
			const endDate = new Date(request.endDate)
			const clickedDateOnly = new Date(clickedDateObj.getFullYear(), clickedDateObj.getMonth(), clickedDateObj.getDate())
			const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
			const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
			return clickedDateOnly >= startDateOnly && clickedDateOnly <= endDateOnly
		})

		if (existingWorkdays.length > 0) {
			// Sprawdź czy istniejący wpis ma tylko uwagi
			const hasOnlyNotes = existingWorkdays.every(day => 
				!day.hoursWorked && !day.additionalWorked && !day.realTimeDayWorked && !day.absenceType && day.notes
			)
			
			if (hasOnlyNotes) {
				// Jeśli istniejący wpis ma tylko uwagi, sprawdź czy jest zaakceptowany wniosek, weekend lub święto
				if (hasAcceptedRequest || isWeekendDay || isHolidayDay) {
					// Jeśli jest zaakceptowany wniosek i są tylko uwagi, pozwól tylko na dodanie uwag
					if (hoursWorkedValue || absenceTypeValue) {
						setErrorMessage(t('workcalendar.notesOnlyForLeave') || 'W tym dniu jest zaakceptowany wniosek urlopowy/nieobecność lub święto. Możesz dodać tylko uwagi.')
						return
					}
					if (!notesValue) {
						setErrorMessage(t('workcalendar.notesRequired') || 'Uwagi są wymagane')
						return
					}
				} else {
					// Jeśli nie ma zaakceptowanego wniosku, pozwól na dodanie godzin/nieobecności
					// Uwagi z istniejącego wpisu zostaną zachowane (połączone z nowymi jeśli są)
					if (!hoursWorkedValue && !absenceTypeValue && !notesValue) {
			setErrorMessage(t('workcalendar.formalertone'))
			return
					}
				}
			} else {
				// Jeśli istniejący wpis ma już godziny/nieobecność, pozwól tylko na dodanie uwag
				if (hoursWorkedValue || absenceTypeValue) {
					setErrorMessage(t('workcalendar.oneactionforday'))
					return
				}
				if (!notesValue) {
					setErrorMessage(t('workcalendar.notesRequired') || 'Uwagi są wymagane')
					return
				}
			}
		} else if (hasAcceptedRequest) {
			// Jeśli jest zaakceptowany wniosek, pozwól tylko na dodanie uwag
			if (hoursWorkedValue || absenceTypeValue) {
				setErrorMessage(t('workcalendar.cannotAddToAcceptedLeave') || 'Nie można dodawać wydarzeń do dnia z zaakceptowanym wnioskiem urlopowym/nieobecnością')
				return
			}
			if (!notesValue) {
				setErrorMessage(t('workcalendar.notesRequired') || 'Uwagi są wymagane')
				return
			}
		} else if (isWeekendDay || isHolidayDay) {
			// Jeśli to weekend (gdy zespół nie pracuje w weekendy) lub święto, pozwól tylko na dodanie uwag
			if (hoursWorkedValue || absenceTypeValue) {
				setErrorMessage(isHolidayDay 
					? (t('workcalendar.holidayOnlyNotes') || 'W dniu świątecznym można dodać tylko uwagi.')
					: (t('workcalendar.weekendOnlyNotes') || 'W weekendzie (gdy zespół nie pracuje w weekendy) można dodać tylko uwagi.')
				)
				return
			}
			if (!notesValue) {
				setErrorMessage(t('workcalendar.notesRequired') || 'Uwagi są wymagane')
				return
			}
		} else {
			// Jeśli nie ma istniejącego wpisu i nie ma zaakceptowanego wniosku, pozwól na zapisanie samej uwagi lub hoursWorked/absenceType
			if (!hoursWorkedValue && !absenceTypeValue && !notesValue) {
				setErrorMessage(t('workcalendar.formalertone'))
				return
			}
		}

		if (absenceTypeValue) {
			setAdditionalWorked('')
			setRealTimeDayWorked('')
		}

		if (hoursWorkedValue && !additionalWorked && !realTimeDayWorked) {
			setAdditionalWorked('')
			setRealTimeDayWorked('')
		}

		// Sprawdź czy istnieje wpis z tylko uwagami
		const hasOnlyNotesInExisting = existingWorkdays.length > 0 && 
			existingWorkdays.every(day => 
				!day.hoursWorked && !day.additionalWorked && !day.realTimeDayWorked && !day.absenceType && day.notes
			)
		
		// Każda uwaga jest osobnym wpisem - nie łączymy ich po "|"
		let finalNotes = notesValue || null

		// Jeśli to weekend lub święto, upewnij się że tylko uwagi są zapisane (reszta null)
		// Parsuj wartości godzin jako float aby obsługiwać pół godziny (np. 8.5)
		const parseHoursValue = (value) => {
			if (!value || value.trim() === '') return null
			const parsed = parseFloat(value)
			return isNaN(parsed) ? null : parsed
		}

		const data = {
			date: selectedDate,
			hoursWorked: (isWeekendDay || isHolidayDay) ? null : parseHoursValue(hoursWorkedValue),
			additionalWorked: (isWeekendDay || isHolidayDay) ? null : (hoursWorkedValue && additionalWorked && additionalWorked.trim() !== '' ? parseHoursValue(additionalWorked) : null),
			realTimeDayWorked: (isWeekendDay || isHolidayDay) ? null : (hoursWorkedValue && realTimeDayWorked && realTimeDayWorked.trim() !== '' ? realTimeDayWorked : null),
			absenceType: (isWeekendDay || isHolidayDay) ? null : (absenceTypeValue ? absenceTypeValue : null),
			notes: finalNotes,
		}

		try {
			// Jeśli istnieje wpis z tylko uwagami i dodajemy godziny/nieobecność (i nie ma zaakceptowanego wniosku, weekendu ani święta), zaktualizuj istniejący wpis
			if (hasOnlyNotesInExisting && (hoursWorkedValue || absenceTypeValue) && !hasAcceptedRequest && !isWeekendDay && !isHolidayDay && existingWorkdays.length > 0) {
				// Użyj pierwszego istniejącego wpisu do aktualizacji (dodajemy godziny/nieobecność do istniejącego wpisu z uwagami)
				const existingWorkday = existingWorkdays[0]
				await updateWorkdayMutation.mutateAsync({
					id: existingWorkday._id,
					updatedWorkday: data,
				})
			} else {
				// W przeciwnym razie zawsze utwórz nowy wpis (każda uwaga jest osobnym wpisem)
				// Jeśli to weekend lub święto, upewnij się że zapisujemy tylko uwagi
				if (isWeekendDay || isHolidayDay) {
					await createWorkdayMutation.mutateAsync({
						date: selectedDate,
						hoursWorked: null,
						additionalWorked: null,
						realTimeDayWorked: null,
						absenceType: null,
						notes: finalNotes,
					})
				} else {
					await createWorkdayMutation.mutateAsync(data)
				}
			}
			
			// Zamknij modal natychmiast po zakończeniu zapisu (optimistic update już zaktualizował UI)
			setModalIsOpen(false)
			setHoursWorked('')
			setAdditionalWorked('')
			setRealTimeDayWorked('')
			setAbsenceType('')
			setNotes('')
			setErrorMessage('')
			
			// Optimistic update już zaktualizował UI, invalidateQueries w onSuccess zadba o synchronizację z serwerem
		} catch (error) {
			console.error('Failed to add/update workday:', error)
			setErrorMessage(error.response?.data?.message || t('workcalendar.saveError') || 'Błąd podczas zapisywania')
		}
	}

	const handleDelete = async id => {
		const confirmed = await showConfirm(
			t('workcalendar.deleteConfirm') || 'Czy na pewno chcesz usunąć ten wpis?'
		)
		if (!confirmed) return

		try {
			await deleteWorkdayMutation.mutateAsync(id)
			// Optimistic update już zaktualizował UI, invalidateQueries w onSuccess zadba o synchronizację z serwerem
		} catch (error) {
			console.error('Failed to delete workday:', error)
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

	const resetFormFields = () => {
		setHoursWorked('')
		setAdditionalWorked('')
		setRealTimeDayWorked('')
		setAbsenceType('')
		setNotes('')
		setErrorMessage('')
		setIsHolidayDay(false)
		setIsWeekendDay(false)
		setSelectedWorkHoursIndex(0)
	}

	if (loading) return <Loader />

	return (
		<div className="row calendar-my-work">
			<div className="col-xl-9">
				<h3><img src="img/clock.png" alt="ikonka w sidebar" />{t('workcalendar.h3')}</h3>
				<hr />
				
				{/* Timer Panel */}
				<TimerPanel />

				<div className="calendar-controls flex flex-wrap items-center" style={{ gap: '5px' }}>
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
				</div>

				<div className="rounded-2xl overflow-hidden shadow-md">
				<FullCalendar
					plugins={[dayGridPlugin, interactionPlugin]}
					initialView="dayGridMonth"
					// locale="pl"
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
						// Zaakceptowane wnioski urlopowe - generuj osobne eventy dla każdego dnia (z pominięciem weekendów i świąt)
						...acceptedLeaveRequests
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
					dateClick={handleDateClick}
					eventClick={handleDateClick}
					eventContent={renderEventContent}
					displayEventTime={false}
					datesSet={handleMonthChange}
					height="auto"
				/>
				</div>
				
				
			</div>
			<div className="col-xl-3 resume-month-work">
				<h3 className="resumecales h3resume" style={{ marginTop: '20px' }}>
					{t('workcalendar.allfrommonth')} {new Date(currentYear, currentMonth)
						.toLocaleString(i18n.resolvedLanguage, { month: 'long', year: 'numeric' })
						.replace(/^./, str => str.toUpperCase())}:
				</h3>
				{/* <h3 className="h3resume" style={{ marginBottom: '0px' }}>
					{t('workcalendar.confirmmonth')}
				</h3>
				<label style={{ marginLeft: '10px', marginTop: '15px', marginBottom: '35px' }}>
					<img src="/img/arrow-right.png" alt="" style={{ width: '40px', marginRight: '10px', marginTop: '-10px' }} />
					<input
						type="checkbox"
						checked={isConfirmed}
						onChange={async () => {
							await toggleConfirmationStatus()
							await showAlert(isConfirmed ? t('workcalendar.cancelconfirm') : t('workcalendar.successconfirm'))
						}}
						style={{ marginRight: '10px', transform: 'scale(2)', cursor: 'pointer' }}
					/>
					{isConfirmed ? t('workcalendar.confirmed') : t('workcalendar.notConfirmed')}
				</label> */}
				{/* <h3 className="h3resume" style={{ marginBottom: '0px' }}>
  {t('workcalendar.confirmmonth')}
</h3> */}

<button
  onClick={async () => {
    await toggleConfirmationStatus()
  }}
  disabled={toggleConfirmationMutation.isPending}
  style={{
    marginTop: '20px',
    marginBottom: '35px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: toggleConfirmationMutation.isPending ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    backgroundColor: toggleConfirmationMutation.isPending 
      ? '#95a5a6' 
      : (isConfirmed ? '#9ca3af' : '#22c55e'), // szary lub zielony
    opacity: toggleConfirmationMutation.isPending ? 0.7 : 1,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minWidth: '200px'
  }}
  className='newbutton-confirmmonth'
>
  {toggleConfirmationMutation.isPending ? (
    <>
      <svg className="animate-spin" style={{ width: '16px', height: '16px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>{t('workcalendar.processing')}</span>
    </>
  ) : (
    <>
      {isConfirmed
        ? t('workcalendar.cancelconfirmation') 
        : t('workcalendar.confirmmonthbutton')}
    </>
  )}
</button>

{isConfirmed ? (
  <span style={{ display: 'flex', alignItems: 'center', padding: '15px' }} className='confirm-border'>
    <img
      src="/img/check.png"
      alt=""
      style={{ width: '30px', marginRight: '8px' }}
    />
    {t('workcalendar.confirmed')}
  </span>
) : (
  <span style={{ display: 'flex', alignItems: 'center', padding: '15px' }} className='confirm-border'>
    <img
      src="/img/check.png"
      alt=""
      style={{
        width: '30px',
        marginRight: '8px',
        filter: 'grayscale(100%)', // 🔥 wyszarzenie
        opacity: 0.6,              // opcjonalnie przyciemnienie
      }}
    />
    {t('workcalendar.notConfirmed')}
  </span>
)}

				<p className='allfrommonth-p'>
					<img src="/img/calendar mono.png" /> {t('workcalendar.allfrommonth1')} {totalWorkDays}
				</p>
				<p className='allfrommonth-p'>
				<img src="/img/time.png" /> {t('workcalendar.allfrommonth2')} {formatHours(totalHours)} {t('workcalendar.allfrommonthhours')}
				</p>
				<p className='allfrommonth-p'>
				<img src="/img/clock mono.png" /> {t('workcalendar.allfrommonth3')} {formatHours(additionalHours)} {getOvertimeWord(additionalHours)}
				</p>

				<p className='allfrommonth-p'>
				<img src="/img/weekend mono.png" /> {settings?.leaveCalculationMode === 'hours' 
					? `${t('workcalendar.allfrommonth4hours') || 'Łączna liczba godzin urlopu'}: ${totalLeaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')}`
					: `${t('workcalendar.allfrommonth4')} ${totalLeaveDays} (${totalLeaveHours.toFixed(1)} ${t('workcalendar.allfrommonthhours')})`
				}
				</p>
				{totalHolidays > 0 && (
					<p className='allfrommonth-p'>
						<img src="/img/party.png" /> {t('workcalendar.allfrommonth6') || 'Dni świąteczne:'} {totalHolidays}
					</p>
				)}
				<p className='allfrommonth-p'>
				<img src="/img/dismiss.png" /> {t('workcalendar.allfrommonth5')} {totalOtherAbsences}
				</p>
			</div>

			{/* Work Session List */}
			<div className="work-session-list-mobile col-xl-9">
					<WorkSessionList month={currentMonth} year={currentYear} />
				</div>

			<Modal
				isOpen={modalIsOpen}
				onRequestClose={() => {
					setModalIsOpen(false)
					resetFormFields()
				}}
				style={{
					overlay: {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						backdropFilter: 'blur(2px)',
						WebkitBackdropFilter: 'blur(2px)',
					},
					content: {
						position: 'relative',
						inset: 'unset',
						margin: '0',
						maxWidth: '600px',
						width: '90%',
						maxHeight: '90vh',
						overflowY: 'auto',
						borderRadius: '1rem',
						padding: '2rem',
						backgroundColor: 'white',
						boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
					},
				}}
				contentLabel={t('workcalendar.modalContentLabel')}>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
					{selectedDate && (
						<h2 className="text-xl font-semibold mb-4 text-gray-800" style={{ margin: 0 }}>
							{t('workcalendar.entriesForDate') || 'Wpisy dla daty'}: {new Date(selectedDate).toLocaleDateString(i18n.resolvedLanguage, { day: 'numeric', month: 'numeric', year: 'numeric' })}
						</h2>
					)}
					<button
						onClick={() => {
							setModalIsOpen(false)
							resetFormFields()
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
							justifyContent: 'center'
						}}
						onMouseEnter={(e) => e.target.style.color = '#2c3e50'}
						onMouseLeave={(e) => e.target.style.color = '#7f8c8d'}>
						×
					</button>
				</div>

				{selectedDate && (() => {
					const clickedDateObj = new Date(selectedDate)
					const clickedDateStr = clickedDateObj.toDateString()
					const existingWorkdays = workdays.filter(day => {
						const dayDate = new Date(day.date)
						return dayDate.toDateString() === clickedDateStr
					})

					// Check if there's an accepted leave request for this date
					const hasAcceptedRequest = Array.isArray(acceptedLeaveRequests) && acceptedLeaveRequests.some(request => {
						if (!request.startDate || !request.endDate) return false
						
						const startDate = new Date(request.startDate)
						const endDate = new Date(request.endDate)
						
						// Check if clicked date is within the request range (inclusive)
						const clickedDateOnly = new Date(clickedDateObj.getFullYear(), clickedDateObj.getMonth(), clickedDateObj.getDate())
						const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
						const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
						
						return clickedDateOnly >= startDateOnly && clickedDateOnly <= endDateOnly
					})

					// Sprawdź czy istniejący wpis ma tylko uwagi
					const hasOnlyNotesInExisting = existingWorkdays.length > 0 && 
						existingWorkdays.every(day => 
							!day.hoursWorked && !day.additionalWorked && !day.realTimeDayWorked && !day.absenceType && day.notes
						)

					// Jeśli dzień jest świętem lub weekendem (gdy zespół nie pracuje w weekendy) i istnieją wpisy, pokaż je z możliwością usunięcia
					if ((isHolidayDay || isWeekendDay) && existingWorkdays.length > 0) {
						return (
							<div style={{ marginBottom: '30px' }}>
								<h3 style={{
									marginBottom: '15px',
									color: '#2c3e50',
									fontSize: '18px',
									fontWeight: '600'
								}}>
									{t('workcalendar.existingEntries') || 'Istniejące wpisy'}
								</h3>
								<div style={{
									marginBottom: '15px',
									padding: '10px',
									backgroundColor: '#d4edda',
									border: '1px solid #28a745',
									borderRadius: '6px',
									color: '#155724',
									fontSize: '14px'
								}}>
									{isHolidayDay 
										? (t('workcalendar.holidayOnlyNotes') || 'W dniu świątecznym można dodać tylko uwagi.')
										: (t('workcalendar.weekendOnlyNotes') || 'W weekendzie (gdy zespół nie pracuje w weekendy) można dodać tylko uwagi.')
									}
								</div>
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '10px'
								}}>
									{existingWorkdays.map((workday) => (
										<div key={workday._id} style={{
											padding: '15px',
											backgroundColor: '#f8f9fa',
											borderRadius: '8px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											minHeight: '60px'
										}}>
											<div style={{ flex: 1 }}>
												{workday.notes && (
													<div style={{
														fontSize: '14px',
														color: '#7f8c8d',
														fontStyle: 'italic'
													}}>
														{t('workcalendar.notes') || 'Uwagi'}: {workday.notes}
													</div>
												)}
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleDelete(workday._id)
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
												{t('workcalendar.delete') || 'Usuń'}
											</button>
										</div>
									))}
								</div>
								<div style={{
									marginTop: '30px',
									padding: '20px',
									backgroundColor: '#f8f9fa',
									borderRadius: '8px',
									border: '1px solid #dee2e6'
								}}>
									<h3 style={{
										marginBottom: '15px',
										color: '#2c3e50',
										fontSize: '18px',
										fontWeight: '600'
									}}>
										{t('workcalendar.addNotes') || 'Dodaj uwagi'}
									</h3>
									<form onSubmit={handleSubmit} className="space-y-4">
										<div>
											<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
											<textarea
												placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
												value={notes}
												onChange={e => setNotes(e.target.value)}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												rows="3"
											/>
										</div>
										{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}
										<div className="flex justify-end gap-3 pt-4">
											<button
												type="submit"
												disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
												className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
												{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
													<span className="flex items-center">
														<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
														{t('workcalendar.saving') || 'Zapisywanie...'}
													</span>
												) : (
													t('workcalendar.save')
												)}
											</button>
											<button
												type="button"
												onClick={() => {
													setModalIsOpen(false)
													resetFormFields()
												}}
												className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
												{t('workcalendar.cancel')}
											</button>
										</div>
									</form>
								</div>
							</div>
						)
					}

					// Jeśli dzień jest świętem lub weekendem (gdy zespół nie pracuje w weekendy) i nie ma wpisów, pokaż tylko formularz uwag
					if (isHolidayDay || isWeekendDay) {
						return (
							<div style={{
								padding: '20px',
								backgroundColor: '#f8f9fa',
								borderRadius: '8px',
								border: '1px solid #dee2e6'
							}}>
								<div style={{
									marginBottom: '15px',
									padding: '10px',
									backgroundColor: '#d4edda',
									border: '1px solid #28a745',
									borderRadius: '6px',
									color: '#155724',
									fontSize: '14px'
								}}>
									{isHolidayDay 
										? (t('workcalendar.holidayOnlyNotes') || 'W dniu świątecznym można dodać tylko uwagi.')
										: (t('workcalendar.weekendOnlyNotes') || 'W weekendzie (gdy zespół nie pracuje w weekendy) można dodać tylko uwagi.')
									}
								</div>
								<form onSubmit={handleSubmit} className="space-y-4">
									<div>
										<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
										<textarea
											placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
											value={notes}
											onChange={e => setNotes(e.target.value)}
											className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
											rows="3"
										/>
									</div>
									{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}
									<div className="flex justify-end gap-3 pt-4">
										<button
											type="submit"
											disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
											className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
											{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
												<span className="flex items-center">
													<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
														<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
														<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
													</svg>
													{t('workcalendar.saving') || 'Zapisywanie...'}
												</span>
											) : (
												t('workcalendar.save')
											)}
										</button>
										<button
											type="button"
											onClick={() => {
												setModalIsOpen(false)
												resetFormFields()
											}}
											className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
											{t('workcalendar.cancel')}
										</button>
									</div>
								</form>
							</div>
						)
					}

					return existingWorkdays.length > 0 ? (
						<div style={{ marginBottom: '30px' }}>
							<h3 style={{
								marginBottom: '15px',
								color: '#2c3e50',
								fontSize: '18px',
								fontWeight: '600'
							}}>
								{t('workcalendar.existingEntries') || 'Istniejące wpisy'}
							</h3>
							<div style={{
								display: 'flex',
								flexDirection: 'column',
								gap: '10px'
							}}>
								{existingWorkdays.map((workday) => {
									const displayText = workday.hoursWorked
										? `${formatHours(workday.hoursWorked)} ${t('workcalendar.allfrommonthhours')}${workday.additionalWorked ? ` ${t('workcalendar.include')} ${formatHours(workday.additionalWorked)} ${getOvertimeWord(workday.additionalWorked)}` : ''}${workday.realTimeDayWorked ? ` | ${t('workcalendar.worktime')} ${workday.realTimeDayWorked}` : ''}`
										: workday.absenceType
										? workday.absenceType
										: workday.notes
									
									return (
										<div key={workday._id} style={{
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
													{displayText}
												</div>
												{workday.notes && (
													<div style={{
														fontSize: '14px',
														color: '#7f8c8d',
														marginTop: '5px',
														fontStyle: 'italic'
													}}>
														{t('workcalendar.notes') || 'Uwagi'}: {workday.notes}
													</div>
												)}
											</div>
											<button
												type="button"
												onClick={(e) => {
													e.preventDefault()
													e.stopPropagation()
													handleDelete(workday._id)
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
												{t('workcalendar.delete') || 'Usuń'}
											</button>
										</div>
									)
								})}
							</div>
							{/* Jeśli istniejący wpis ma tylko uwagi, pokaż standardowy formularz z informacją na górze */}
							{/* Jeśli jest zaakceptowany wniosek i są tylko uwagi, pokaż tylko formularz uwag (podobnie jak dla świąt) */}
							{hasOnlyNotesInExisting && hasAcceptedRequest ? (
							<div style={{
									marginTop: '30px',
									padding: '20px',
									backgroundColor: '#f8f9fa',
									borderRadius: '8px',
									border: '1px solid #dee2e6'
								}}>
									<div style={{
										marginBottom: '15px',
										padding: '10px',
								backgroundColor: '#fff3cd',
								border: '1px solid #ffc107',
										borderRadius: '6px',
										color: '#856404',
										fontSize: '14px'
							}}>
										{t('workcalendar.notesOnlyForLeave') || 'W tym dniu jest zaakceptowany wniosek urlopowy/nieobecność lub święto. Możesz dodać tylko uwagi.'}
							</div>
									<form onSubmit={handleSubmit} className="space-y-4">
										<div>
											<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
											<textarea
												placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
												value={notes}
												onChange={e => setNotes(e.target.value)}
												className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
												rows="3"
											/>
										</div>
										{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}
										<div className="flex justify-end gap-3 pt-4">
											<button
												type="submit"
												disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
												className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
												{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
													<span className="flex items-center">
														<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
															<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
															<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
														</svg>
														{t('workcalendar.saving') || 'Zapisywanie...'}
													</span>
												) : (
													t('workcalendar.save')
												)}
											</button>
											<button
												type="button"
												onClick={() => {
													setModalIsOpen(false)
													resetFormFields()
												}}
												className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
												{t('workcalendar.cancel')}
											</button>
										</div>
									</form>
								</div>
							) : (
								<div style={{
									marginTop: '30px',
									padding: '20px',
									backgroundColor: '#f8f9fa',
									borderRadius: '8px',
									border: '1px solid #dee2e6'
								}}>
									{hasOnlyNotesInExisting && !hasAcceptedRequest && (
										<div style={{
											marginBottom: '15px',
											padding: '10px',
											backgroundColor: '#d1ecf1',
											border: '1px solid #0dcaf0',
											borderRadius: '6px',
											color: '#055160',
											fontSize: '14px'
										}}>
											{t('workcalendar.canAddHoursOrAbsence') || 'W tym dniu są tylko uwagi. Możesz dodać godziny pracy lub nieobecność.'}
										</div>
									)}
									{!hasOnlyNotesInExisting && (
										<h3 style={{
											marginBottom: '15px',
											color: '#2c3e50',
											fontSize: '18px',
											fontWeight: '600'
										}}>
											{t('workcalendar.addNotes') || 'Dodaj uwagi'}
										</h3>
									)}
									{!hasOnlyNotesInExisting && hasAcceptedRequest && (
										<div style={{
											marginBottom: '15px',
											padding: '10px',
											backgroundColor: '#fff3cd',
											border: '1px solid #ffc107',
											borderRadius: '6px',
											color: '#856404',
											fontSize: '14px'
										}}>
											{t('workcalendar.notesAllowedForLeave') || 'Możesz dodać uwagi nawet gdy jest zaakceptowany wniosek urlopowy/nieobecność.'}
										</div>
									)}
									{hasOnlyNotesInExisting && !hasAcceptedRequest ? (
										<form onSubmit={handleSubmit} className="space-y-4">
											<div>
												<h2 className="text-lg font-semibold mb-2 text-gray-800">{t('workcalendar.h2modal')}</h2>
												<input
													type="number"
													min="0"
													max="24"
													step="0.5"
													placeholder={t('workcalendar.placeholder1') || 'np. 8 lub 8.5'}
													value={hoursWorked}
													onChange={e => setHoursWorked(e.target.value)}
													disabled={isHolidayDay || isWeekendDay}
													className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
												/>
											</div>

											<div>
												<input
													type="number"
													min="0"
													step="0.5"
													placeholder={t('workcalendar.placeholder2') || 'np. 1 lub 1.5'}
													value={additionalWorked}
													onChange={e => setAdditionalWorked(e.target.value)}
													disabled={isHolidayDay || isWeekendDay}
													className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
												/>
											</div>

											<div>
												{/* Checkboxy dla wielu konfiguracji godzin pracy */}
												{settings && settings.workHours && Array.isArray(settings.workHours) && settings.workHours.length > 1 && (
													<div style={{
														marginBottom: '15px',
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
															{t('workcalendar.selectWorkHours') || 'Wybierz godziny pracy:'}
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
																		name="workHours"
																		checked={selectedWorkHoursIndex === index}
																		onChange={() => {
																			setSelectedWorkHoursIndex(index)
																			const timeRange = `${workHours.timeFrom}-${workHours.timeTo}`
																			setRealTimeDayWorked(timeRange)
																			if (workHours.hours) {
																				setHoursWorked(workHours.hours.toString())
																			}
																		}}
																		disabled={isHolidayDay || isWeekendDay}
																		style={{
																			marginRight: '10px',
																			cursor: isHolidayDay || isWeekendDay ? 'not-allowed' : 'pointer'
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
												<input
													type="text"
													placeholder={t('workcalendar.placeholder3')}
													value={realTimeDayWorked}
													onChange={e => setRealTimeDayWorked(e.target.value)}
													disabled={isHolidayDay || isWeekendDay}
													className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
												/>
											</div>

											<div>
												<h2 className="text-lg font-semibold mb-2 text-gray-800">{t('workcalendar.h2modalabsence')}</h2>
												<input
													type="text"
													placeholder={t('workcalendar.placeholder4')}
													value={absenceType}
													onChange={e => setAbsenceType(e.target.value)}
													disabled={isHolidayDay || isWeekendDay}
													className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
												/>
											</div>

											<div>
												<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
												<textarea
													placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
													value={notes}
													onChange={e => setNotes(e.target.value)}
													className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows="3"
												/>
											</div>

											{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}

											<div className="flex justify-end gap-3 pt-4">
												<button
													type="submit"
													disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
													className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
													{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
														<span className="flex items-center">
															<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															{t('workcalendar.saving') || 'Zapisywanie...'}
														</span>
													) : (
														t('workcalendar.save')
													)}
												</button>
												<button
													type="button"
													onClick={() => {
														setModalIsOpen(false)
														resetFormFields()
													}}
													className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
													{t('workcalendar.cancel')}
												</button>
											</div>
										</form>
									) : (
										<form onSubmit={handleSubmit} className="space-y-4">
											<div>
												<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
												<textarea
													placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
													value={notes}
													onChange={e => setNotes(e.target.value)}
													className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
													rows="3"
												/>
											</div>
											{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}
											<div className="flex justify-end gap-3 pt-4">
												<button
													type="submit"
													disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
													className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
													{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
														<span className="flex items-center">
															<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
																<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
																<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
															</svg>
															{t('workcalendar.saving') || 'Zapisywanie...'}
														</span>
													) : (
														t('workcalendar.save')
													)}
												</button>
												<button
													type="button"
													onClick={() => {
														setModalIsOpen(false)
														resetFormFields()
													}}
													className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
													{t('workcalendar.cancel')}
												</button>
											</div>
										</form>
									)}
								</div>
							)}
						</div>
					) : hasAcceptedRequest ? (
						<div style={{
							padding: '20px',
							backgroundColor: '#f8f9fa',
							borderRadius: '8px',
							border: '1px solid #dee2e6'
						}}>
							<div style={{
								marginBottom: '15px',
								padding: '10px',
								backgroundColor: '#fff3cd',
								border: '1px solid #ffc107',
								borderRadius: '6px',
								color: '#856404',
								fontSize: '14px'
							}}>
								{t('workcalendar.notesOnlyForLeave') || 'W tym dniu jest zaakceptowany wniosek urlopowy/nieobecność. Możesz dodać tylko uwagi.'}
							</div>
							<form onSubmit={handleSubmit} className="space-y-4">
								<div>
									<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
									<textarea
										placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
										value={notes}
										onChange={e => setNotes(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="3"
									/>
								</div>
								{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}
								<div className="flex justify-end gap-3 pt-4">
									<button
										type="submit"
										disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
										className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
										{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
											<span className="flex items-center">
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												{t('workcalendar.saving') || 'Zapisywanie...'}
											</span>
										) : (
											t('workcalendar.save')
										)}
									</button>
									<button
										type="button"
										onClick={() => {
											setModalIsOpen(false)
											resetFormFields()
										}}
										className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
										{t('workcalendar.cancel')}
									</button>
								</div>
							</form>
						</div>
					) : (
						<>
							<form onSubmit={handleSubmit} className="space-y-4 firstformcalendar">
								<div>
									<h2 className="text-lg font-semibold mb-2 text-gray-800">{t('workcalendar.h2modal')}</h2>
									<input
										type="number"
										min="0"
										max="24"
										step="0.5"
										placeholder={t('workcalendar.placeholder1') || 'np. 8 lub 8.5'}
										value={hoursWorked}
										onChange={e => setHoursWorked(e.target.value)}
										disabled={isHolidayDay || isWeekendDay}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									/>
								</div>

								<div>
									<input
										type="number"
										min="0"
										step="0.5"
										placeholder={t('workcalendar.placeholder2') || 'np. 1 lub 1.5'}
										value={additionalWorked}
										onChange={e => setAdditionalWorked(e.target.value)}
										disabled={isHolidayDay || isWeekendDay}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									/>
								</div>

								<div>
									{/* Checkboxy dla wielu konfiguracji godzin pracy */}
									{settings && settings.workHours && Array.isArray(settings.workHours) && settings.workHours.length > 1 && (
										<div style={{
											marginBottom: '15px',
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
												{t('workcalendar.selectWorkHours') || 'Wybierz godziny pracy:'}
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
															name="workHours"
															checked={selectedWorkHoursIndex === index}
															onChange={() => {
																setSelectedWorkHoursIndex(index)
																const timeRange = `${workHours.timeFrom}-${workHours.timeTo}`
																setRealTimeDayWorked(timeRange)
																if (workHours.hours) {
																	setHoursWorked(workHours.hours.toString())
																}
															}}
															disabled={isHolidayDay || isWeekendDay}
															style={{
																marginRight: '10px',
																cursor: isHolidayDay || isWeekendDay ? 'not-allowed' : 'pointer'
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
									<input
										type="text"
										placeholder={t('workcalendar.placeholder3')}
										value={realTimeDayWorked}
										onChange={e => setRealTimeDayWorked(e.target.value)}
										disabled={isHolidayDay || isWeekendDay}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									/>
								</div>

								<div>
									<h2 className="text-lg font-semibold mb-2 text-gray-800">{t('workcalendar.h2modalabsence')}</h2>
									<input
										type="text"
										placeholder={t('workcalendar.placeholder4')}
										value={absenceType}
										onChange={e => setAbsenceType(e.target.value)}
										disabled={isHolidayDay || isWeekendDay}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
									/>
								</div>

								<div>
									<label className="text-lg font-semibold mb-2 text-gray-800 block">{t('workcalendar.notes') || 'Uwagi'}</label>
									<textarea
										placeholder={t('workcalendar.notesPlaceholder') || 'Dodaj uwagi...'}
										value={notes}
										onChange={e => setNotes(e.target.value)}
										className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
										rows="3"
									/>
								</div>

								{errorMessage && <div className="text-red-600 text-sm mt-2">{errorMessage}</div>}

								<div className="flex justify-end gap-3 pt-4">
									<button
										type="submit"
										disabled={createWorkdayMutation.isPending || updateWorkdayMutation.isPending}
										className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600">
										{createWorkdayMutation.isPending || updateWorkdayMutation.isPending ? (
											<span className="flex items-center">
												<svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
													<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
													<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
												</svg>
												{t('workcalendar.saving') || 'Zapisywanie...'}
											</span>
										) : (
											t('workcalendar.save')
										)}
									</button>
									<button
										type="button"
										onClick={() => {
											setModalIsOpen(false)
											resetFormFields()
										}}
										className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition">
										{t('workcalendar.cancel')}
									</button>
								</div>
							</form>
						</>
					)
				})()}
			</Modal>
		</div>
	)
}

export default MonthlyCalendar
