const { firmDb } = require('../db/db')
const TimeEntry = require('../models/TimeEntry')(firmDb)
const QRCode = require('../models/QRCode')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { isHoliday } = require('../utils/holidays')

// Helper function to check if day is weekend
function isWeekend(date) {
	const day = new Date(date).getDay()
	return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
}

// Helper function to check if timer can be started on a given date
async function canStartTimerOnDate(userId, date) {
	try {
		const user = await User.findById(userId)
		if (!user || !user.teamId) {
			return { canStart: false, reason: 'Użytkownik nie znaleziony lub brak zespołu' }
		}

		// Get team settings
		const settings = await Settings.getSettings(user.teamId)
		if (!settings) {
			return { canStart: false, reason: 'Brak ustawień zespołu' }
		}

		const dateStr = date.toISOString().split('T')[0]
		const checkDate = new Date(date)
		checkDate.setHours(0, 0, 0, 0)

		// Check if it's a weekend and team doesn't work on weekends
		const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
		const isWeekendDay = isWeekend(checkDate)
		
		if (!workOnWeekends && isWeekendDay) {
			return { canStart: false, reason: 'Nie można uruchomić timera w weekend (zespół nie pracuje w weekendy)' }
		}

		// Check if it's a holiday
		const holidayInfo = isHoliday(checkDate, settings)
		if (holidayInfo) {
			return { canStart: false, reason: `Nie można uruchomić timera w święto: ${holidayInfo.name}` }
		}

		// Check if user has accepted leave request for this date
		const acceptedLeaveRequests = await LeaveRequest.find({
			userId: userId,
			status: { $in: ['status.accepted', 'status.sent'] }
		})

		for (const request of acceptedLeaveRequests) {
			if (request.startDate && request.endDate) {
				const startDate = new Date(request.startDate)
				startDate.setHours(0, 0, 0, 0)
				const endDate = new Date(request.endDate)
				endDate.setHours(23, 59, 59, 999)

				if (checkDate >= startDate && checkDate <= endDate) {
					return { canStart: false, reason: 'Nie można uruchomić timera w dniu z zaakceptowanym wnioskiem urlopowym/nieobecnością' }
				}
			}
		}

		return { canStart: true }
	} catch (error) {
		console.error('Error checking if timer can start:', error)
		return { canStart: false, reason: 'Błąd podczas sprawdzania możliwości uruchomienia timera' }
	}
}

// Register time entry (entry or exit)
exports.registerTimeEntry = async (req, res) => {
	try {
		const { code } = req.body
		const userId = req.user.userId

		if (!code) {
			return res.status(400).json({ message: 'Kod QR jest wymagany' })
		}

		// Verify QR code
		const qrCode = await QRCode.findOne({ code, isActive: true })
		if (!qrCode) {
			return res.status(404).json({ message: 'Nieprawidłowy kod QR' })
		}

		// Check if user belongs to the same team
		const user = await User.findById(userId)
		if (!user || user.teamId.toString() !== qrCode.teamId.toString()) {
			return res.status(403).json({ message: 'Kod QR nie należy do Twojego zespołu' })
		}

		// Get today's date (start of day)
		const today = new Date()
		today.setHours(0, 0, 0, 0)

		// Find last entry for today
		const lastEntry = await TimeEntry.findOne({
			userId,
			date: { $gte: today },
			qrCodeId: qrCode._id
		}).sort({ entryTime: -1 })

		const now = new Date()

		// Check if there's an active timer with this QR code (check today and yesterday for overnight shifts)
		const workdayController = require('./workdayController')
		const workday = await workdayController.findActiveTimerWorkday(userId)
		const hasActiveTimer = workday && workday.activeTimer && workday.activeTimer.startTime && 
			workday.activeTimer.qrCodeId && workday.activeTimer.qrCodeId.toString() === qrCode._id.toString()

		if (lastEntry && !lastEntry.exitTime) {
			// Last entry was an entry, so this is an exit
			lastEntry.exitTime = now
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
				const timerStartDate = new Date(startTime)
				timerStartDate.setHours(0, 0, 0, 0)
				
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
					qrCodeId: workday.activeTimer.qrCodeId
				}

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
			} else {
				// Update workday from TimeEntry (old method)
				await updateWorkdayFromTimeEntry(userId, lastEntry)
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

			const newEntry = new TimeEntry({
				userId,
				qrCodeId: qrCode._id,
				entryTime: now,
				date: today,
				exitTime: null
			})

			await newEntry.save()

			// Check if timer is already running (today or yesterday for overnight shifts)
			const existingActiveTimer = await workdayController.findActiveTimerWorkday(userId)
			if (existingActiveTimer && existingActiveTimer.activeTimer && existingActiveTimer.activeTimer.startTime) {
				return res.status(400).json({ message: 'Timer już działa' })
			}

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

		const today = new Date()
		today.setHours(0, 0, 0, 0)
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

// Helper function to update Workday from TimeEntry
async function updateWorkdayFromTimeEntry(userId, timeEntry) {
	try {
		const entryDate = new Date(timeEntry.entryTime)
		entryDate.setHours(0, 0, 0, 0)

		// Calculate hours worked
		const entryTime = new Date(timeEntry.entryTime)
		const exitTime = new Date(timeEntry.exitTime)
		const hoursWorked = (exitTime - entryTime) / (1000 * 60 * 60) // Convert to hours

		// Format time range
		const formatTime = (date) => {
			// Convert UTC date to local time string (Europe/Warsaw timezone)
			// This ensures the time displayed matches the user's local time
			const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }))
			const hours = localDate.getHours().toString().padStart(2, '0')
			const minutes = localDate.getMinutes().toString().padStart(2, '0')
			return `${hours}:${minutes}`
		}
		const timeRange = `${formatTime(entryTime)}-${formatTime(exitTime)}`

		// Find or create workday
		let workday = await Workday.findOne({ userId, date: entryDate })

		if (!workday) {
			workday = new Workday({
				userId,
				date: entryDate,
				hoursWorked: 0,
				realTimeDayWorked: ''
			})
		}

		// Update hours
		if (!workday.hoursWorked) workday.hoursWorked = 0
		workday.hoursWorked += hoursWorked

		// Update time range (append or replace)
		if (workday.realTimeDayWorked) {
			workday.realTimeDayWorked += `, ${timeRange}`
		} else {
			workday.realTimeDayWorked = timeRange
		}

		// Handle overtime if needed
		if (timeEntry.isOvertime) {
			if (!workday.additionalWorked) workday.additionalWorked = 0
			workday.additionalWorked += hoursWorked
		}

		await workday.save()
	} catch (error) {
		console.error('Error updating workday from time entry:', error)
	}
}
