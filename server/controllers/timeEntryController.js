const { firmDb } = require('../db/db')
const TimeEntry = require('../models/TimeEntry')(firmDb)
const QRCode = require('../models/QRCode')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { getTimerActivitySnapshot } = require('../utils/timerWorkActivity')
const { warsawDayStart } = require('../utils/workdayEntryValidation')
const qrService = require('../services/qrService')
const { scanPassIssuedAtMs } = require('../utils/qrScreenToken')
const { toStoredGeo, buildSessionQrVerify } = require('../utils/qrGeoCheck')
const { isQrExit, staleEntryExitTime } = require('../utils/qrTimeEntry')

// Register time entry (entry or exit)
function screenErrorMessage(reason) {
	return reason === 'SCREEN_EXPIRED'
		? 'Kod wygasł. Zeskanuj go jeszcze raz z tabletu.'
		: 'Tu działa tylko kod z tabletu przy wejściu.'
}

function geoErrorMessage({ reason, distanceM }) {
	if (reason === 'GEO_OUTSIDE') {
		const km = distanceM >= 1000 ? `${(distanceM / 1000).toFixed(1)} km` : `${distanceM} m`
		return `Jesteś poza miejscem pracy (ok. ${km}). Zeskanuj kod na miejscu.`
	}
	if (reason === 'GEO_DENIED') return 'Zezwól na lokalizację w przeglądarce i spróbuj ponownie.'
	return 'Nie udało się ustalić lokalizacji. Włącz lokalizację w telefonie i spróbuj ponownie.'
}

exports.registerTimeEntry = async (req, res) => {
	try {
		const { code, t, p, geo } = req.body
		const userId = req.user.userId

		if (!code) {
			return res.status(400).json({ message: 'Kod QR jest wymagany' })
		}

		// Verify QR code
		const qrCode = await QRCode.findOne({ code, isActive: true }).select('+screenSecret')
		if (!qrCode) {
			return res.status(404).json({ message: 'Nieprawidłowy kod QR' })
		}

		// Najpierw zespół — obcy kod nie zdradza trybu ani ustawień lokalizacji
		const user = await User.findById(userId)
		if (!user || user.teamId.toString() !== qrCode.teamId.toString()) {
			return res.status(403).json({ message: 'Kod QR nie należy do Twojego zespołu' })
		}

		// Tryb ekranu: token z ekranu albo przepustka wydana przy skanie (utils/qrScreenToken)
		const scan = qrService.evaluateScan(qrCode, { t, p })
		if (!scan.allowed) {
			return res.status(403).json({ message: screenErrorMessage(scan.reason), code: scan.reason })
		}

		// Get today's date (start of day)
		const today = warsawDayStart()

		// Ostatni wpis od wczoraj — nocna zmiana: wejście przed północą musi dać się zamknąć skanem po północy
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)
		const lastEntry = await TimeEntry.findOne({
			userId,
			date: { $gte: yesterday },
			qrCodeId: qrCode._id
		}).sort({ entryTime: -1 })

		const now = new Date()

		// Przepustka działa na jedno zdarzenie: po wejściu nią nie da się nią samą (np. z domu) zarejestrować wyjścia
		if (scan.via === 'pass' && lastEntry) {
			const issuedAt = scanPassIssuedAtMs(p)
			const lastEventAt = Math.max(lastEntry.entryTime?.getTime() || 0, lastEntry.exitTime?.getTime() || 0)
			if (issuedAt === null || lastEventAt >= issuedAt) {
				return res.status(403).json({ message: screenErrorMessage('SCREEN_EXPIRED'), code: 'SCREEN_EXPIRED' })
			}
		}

		// Lokalizacja przy skanie (utils/qrGeoCheck) — jeden odczyt, zapisujemy wynik bez współrzędnych
		const geoResult = qrService.evaluateScanGeo(qrCode, geo)
		if (!geoResult.allowed) {
			return res.status(403).json({
				message: geoErrorMessage(geoResult),
				code: geoResult.reason,
				distanceM: geoResult.distanceM,
			})
		}
		const storedGeo = toStoredGeo(geoResult, qrCode.geo?.policy)

		// Check if there's an active timer with this QR code (check today and yesterday for overnight shifts)
		const workdayController = require('./workdayController')
		const workday = await workdayController.findActiveTimerWorkday(userId)
		const hasActiveTimer = workday && workday.activeTimer && workday.activeTimer.startTime && 
			workday.activeTimer.qrCodeId && workday.activeTimer.qrCodeId.toString() === qrCode._id.toString()

		// Otwarte wejście tym kodem (od wczoraj — nocna zmiana). Przy działającym liczniku z tego kodu szukamy bez
		// okna dat: „Zapisz sesję i kontynuuj” po północy przenosi licznik na nowy dzień, a wejście zostaje starsze —
		// bez tego skan wyjścia dawał „Licznik już działa”, a Stop jest dla kodu chronionego zablokowany.
		const openEntry = lastEntry && !lastEntry.exitTime
			? lastEntry
			: await TimeEntry.findOne({ userId, qrCodeId: qrCode._id, date: { $gte: yesterday }, exitTime: null }).sort({ entryTime: -1 })
				|| (hasActiveTimer ? await TimeEntry.findOne({ userId, qrCodeId: qrCode._id, exitTime: null }).sort({ entryTime: -1 }) : null)
		// Godziny liczy tylko sesja licznika: wyjście wyłącznie przy działającym liczniku z tego kodu (utils/qrTimeEntry).
		// Otwarte wejście bez niego (Stop przyciskiem, skan przy ręcznym liczniku) zamykamy bez godzin — skan to nowe wejście.
		const isExit = isQrExit({ openEntry, hasActiveTimerFromThisCode: Boolean(hasActiveTimer) })
		if (openEntry && !isExit) {
			const entryDay = await Workday.findOne({ userId, date: warsawDayStart(openEntry.entryTime) }).select('timeEntries.startTime timeEntries.endTime')
			openEntry.exitTime = staleEntryExitTime(openEntry.entryTime, entryDay?.timeEntries || [])
			await openEntry.save()
		}

		if (isExit) {
			// Last entry was an entry, so this is an exit
			const lastEntry = openEntry
			lastEntry.exitTime = now
			lastEntry.exitScanMethod = scan.method
			lastEntry.exitGeo = storedGeo
			await lastEntry.save()

			// If there's an active timer with this QR code, stop it
			if (hasActiveTimer) {
				const endTime = new Date()
				const startTime = new Date(workday.activeTimer.startTime)

				// Calculate final break time (include current break if timer is stopped during break)
				let finalBreakTime = workday.activeTimer.totalBreakTime || 0
				if (workday.activeTimer.isBreak && workday.activeTimer.breakStartTime) {
					const currentBreakDuration = (endTime - new Date(workday.activeTimer.breakStartTime)) / 1000 // seconds
					finalBreakTime += currentBreakDuration
				}

				// Calculate final overtime time (include current overtime if timer is stopped during overtime)
				let finalOvertimeTime = workday.activeTimer.totalOvertimeTime || 0
				if (workday.activeTimer.isOvertime && workday.activeTimer.overtimeStartTime) {
					const currentOvertimeDuration = (endTime - new Date(workday.activeTimer.overtimeStartTime)) / 1000 // seconds
					finalOvertimeTime += currentOvertimeDuration
				}

				// Calculate hours worked: total time (work continues during breaks, break time is informational only)
				// Always calculate total time from start to end, regardless of break or overtime status
				const totalTime = (endTime - startTime) / (1000 * 60 * 60) // hours
				const hoursWorked = totalTime
				
				// Calculate overtime hours (only time spent in overtime mode)
				const overtimeHours = finalOvertimeTime / 3600 // convert seconds to hours

				// Determine which workday to save the session to (day timer started)
				const timerStartDate = warsawDayStart(startTime)
				
				const sessionWorkday = workday.date.getTime() === timerStartDate.getTime() 
					? workday 
					: await Workday.findOne({ userId, date: timerStartDate }) || workday

				// Add to timeEntries
				const timeEntry = {
					startTime,
					endTime,
					isBreak: false, // Always false for work sessions, break time is tracked in breakTime field
					breakTime: finalBreakTime,
					isOvertime: overtimeHours > 0, // True if any overtime time was recorded
					overtimeTime: finalOvertimeTime, // Time in seconds spent in overtime mode
					workDescription: workday.activeTimer.workDescription,
					taskId: workday.activeTimer.taskId,
					activityId: workday.activeTimer.activityId || null,
					qrCodeId: workday.activeTimer.qrCodeId,
					// Widoczne w sesjach i raporcie: ekran/wydruk i lokalizacja wejścia i wyjścia
					qrVerify: buildSessionQrVerify({
						mode: qrCode.mode,
						entryMethod: lastEntry.entryScanMethod,
						exitMethod: lastEntry.exitScanMethod,
						entryGeo: lastEntry.entryGeo?.toObject?.() || lastEntry.entryGeo || null,
						exitGeo: lastEntry.exitGeo?.toObject?.() || lastEntry.exitGeo || null,
					}),
				}

				// Nazwa i jednostka czynności oraz ilość wpisana w trakcie (pendingQuantity) — wcześniej wyjście skanem
				// zapisywało sesję bez nich i wydajność pracy rozpoczętej skanem nie była mierzona
				const activitySnapshot = await getTimerActivitySnapshot(Settings, qrCode.teamId, timeEntry.activityId, workday.activeTimer.pendingQuantity)
				if (!activitySnapshot.error) Object.assign(timeEntry, activitySnapshot)

				if (!sessionWorkday.timeEntries) {
					sessionWorkday.timeEntries = []
				}
				sessionWorkday.timeEntries.push(timeEntry)

				// Update total hours (always, regardless of break or overtime status)
				// Total time always goes to hoursWorked
				if (!sessionWorkday.hoursWorked) sessionWorkday.hoursWorked = 0
				sessionWorkday.hoursWorked += hoursWorked

				// Update overtime hours separately (only time spent in overtime mode)
				if (overtimeHours > 0) {
					if (!sessionWorkday.additionalWorked) sessionWorkday.additionalWorked = 0
					sessionWorkday.additionalWorked += overtimeHours
				}

				// Update time range string
				if (!workday.activeTimer.isBreak) {
					const formatTime = (date) => {
						// Convert UTC date to local time string (Europe/Warsaw timezone)
						// This ensures the time displayed matches the user's local time
						const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }))
						const hours = localDate.getHours().toString().padStart(2, '0')
						const minutes = localDate.getMinutes().toString().padStart(2, '0')
						return `${hours}:${minutes}`
					}
					const timeRange = `${formatTime(startTime)}-${formatTime(endTime)}`
					
					if (sessionWorkday.realTimeDayWorked) {
						sessionWorkday.realTimeDayWorked += `, ${timeRange}`
					} else {
						sessionWorkday.realTimeDayWorked = timeRange
					}
				}

				// Clear active timer from the workday where it was running
				workday.activeTimer = null
				await workday.save()

				// Save session workday if different
				if (sessionWorkday._id.toString() !== workday._id.toString()) {
					await sessionWorkday.save()
				}

			}

			res.json({
				type: 'exit',
				entryTime: lastEntry.entryTime,
				exitTime: lastEntry.exitTime,
				message: 'Wyjście zarejestrowane'
			})
		} else {
			// No entry or last was exit, so this is an entry
			
			// Validate if timer can be started on this date
			const workdayController = require('./workdayController')
			const { canStart, reason } = await workdayController.canStartTimerOnDate(userId, today)
			if (!canStart) {
				return res.status(400).json({ message: reason })
			}

			// Działający licznik (ręczny albo z innego kodu) — odmowa, zanim cokolwiek zapiszemy
			const existingActiveTimer = await workdayController.findActiveTimerWorkday(userId)
			if (existingActiveTimer && existingActiveTimer.activeTimer && existingActiveTimer.activeTimer.startTime) {
				return res.status(400).json({ message: 'Licznik już działa. Zakończ go, zanim zeskanujesz wejście.', code: 'TIMER_RUNNING' })
			}

			const newEntry = new TimeEntry({
				userId,
				qrCodeId: qrCode._id,
				entryTime: now,
				entryScanMethod: scan.method,
				entryGeo: storedGeo,
				date: today,
				exitTime: null
			})

			await newEntry.save()

			// Start timer with QR code
			let workday = await Workday.findOne({ userId, date: today })
			if (!workday) {
				workday = new Workday({
					userId,
					date: today,
					hoursWorked: 0,
					realTimeDayWorked: '',
					timeEntries: [],
					activeTimer: null
				})
			}

			// Start timer
			workday.activeTimer = {
				startTime: now,
				isBreak: false,
				breakStartTime: null,
				totalBreakTime: 0,
				isOvertime: false,
				overtimeStartTime: null,
				totalOvertimeTime: 0,
				workDescription: '',
				taskId: null,
				activityId: null,
				qrCodeId: qrCode._id
			}
			await workday.save()

			res.json({
				type: 'entry',
				entryTime: newEntry.entryTime,
				message: 'Wejście zarejestrowane'
			})
		}
	} catch (error) {
		console.error('Error registering time entry:', error)
		res.status(500).json({ message: 'Błąd podczas rejestracji czasu' })
	}
}

// Get today's time entries for user
exports.getTodayTimeEntries = async (req, res) => {
	try {
		const userId = req.user.userId

		const today = warsawDayStart()
		const tomorrow = new Date(today)
		tomorrow.setDate(tomorrow.getDate() + 1)

		const entries = await TimeEntry.find({
			userId,
			date: { $gte: today, $lt: tomorrow }
		})
			.populate('qrCodeId', 'name code')
			.populate('taskId', 'title')
			.sort({ entryTime: -1 })

		res.json(entries)
	} catch (error) {
		console.error('Error getting today time entries:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania wpisów czasu' })
	}
}

