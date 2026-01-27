const { firmDb } = require('../db/db')
const Workday = require('../models/Workday')(firmDb)
const User = require('../models/user')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { isHoliday } = require('../utils/holidays')

// Helper function to check if day is weekend
function isWeekend(date) {
	const day = new Date(date).getDay()
	return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
}

// Helper function to check if timer can be started on a given date
exports.canStartTimerOnDate = async function canStartTimerOnDate(userId, date) {
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

		// Check if there's already a workday entry with hours worked for this date
		const existingWorkday = await Workday.findOne({ 
			userId: userId, 
			date: checkDate 
		})

		if (existingWorkday && existingWorkday.hoursWorked && existingWorkday.hoursWorked > 0) {
			return { canStart: false, reason: 'Nie można uruchomić timera w dniu, w którym jest już wpisana łączna liczba godzin pracy' }
		}

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

exports.addWorkday = async (req, res) => {
	const { date, hoursWorked, additionalWorked, realTimeDayWorked, absenceType, notes } = req.body
	try {
		// Funkcja pomocnicza do parsowania godzin z obsługą liczb dziesiętnych (np. 8.5)
		const parseHoursValue = (value) => {
			if (value === null || value === undefined || value === '') return null
			const parsed = parseFloat(value)
			return isNaN(parsed) ? null : parsed
		}

		const workday = new Workday({
			userId: req.user.userId,
			date,
			hoursWorked: parseHoursValue(hoursWorked),
			additionalWorked: parseHoursValue(additionalWorked),
			realTimeDayWorked,
			absenceType,
			notes,
		})
		await workday.save()
		res.status(201).send('Workday added successfully.')
	} catch (error) {
		console.error('Error adding workday:', error)
		res.status(500).send('Failed to add workday.')
	}
}

exports.getWorkdays = async (req, res) => {
	try {
		const workdays = await Workday.find({ userId: req.user.userId })
		res.json(workdays)
	} catch (error) {
		console.error('Error retrieving workdays:', error)
		res.status(500).send('Failed to retrieve workdays.')
	}
}

exports.updateWorkday = async (req, res) => {
	try {
		const { hoursWorked, additionalWorked, realTimeDayWorked, absenceType, notes } = req.body
		const workday = await Workday.findOne({ _id: req.params.id, userId: req.user.userId })
		if (!workday) return res.status(404).send('Workday not found or unauthorized')
		
		// Funkcja pomocnicza do parsowania godzin z obsługą liczb dziesiętnych (np. 8.5)
		const parseHoursValue = (value) => {
			if (value === null || value === undefined || value === '') return null
			const parsed = parseFloat(value)
			return isNaN(parsed) ? null : parsed
		}
		
		// Aktualizuj wszystkie pola, jeśli są przekazane
		if (hoursWorked !== undefined) workday.hoursWorked = parseHoursValue(hoursWorked)
		if (additionalWorked !== undefined) workday.additionalWorked = parseHoursValue(additionalWorked)
		if (realTimeDayWorked !== undefined) workday.realTimeDayWorked = realTimeDayWorked || null
		if (absenceType !== undefined) workday.absenceType = absenceType || null
		if (notes !== undefined) workday.notes = notes || null
		
		await workday.save()
		res.send('Workday updated successfully.')
	} catch (error) {
		console.error('Error updating workday:', error)
		res.status(500).send('Failed to update workday.')
	}
}

exports.deleteWorkday = async (req, res) => {
	try {
		const result = await Workday.deleteOne({ _id: req.params.id, userId: req.user.userId })
		if (result.deletedCount === 0) return res.status(404).send('Workday not found or unauthorized')
		res.send('Workday deleted successfully.')
	} catch (error) {
		console.error('Error deleting workday:', error)
		res.status(500).send('Failed to delete workday.')
	}
}

// exports.getUserWorkdays = async (req, res) => {
// 	console.log("req.user in workdays:", req.user);
// 	try {
// 		const { userId } = req.params

// 		const allowedRoles = [
// 			'Admin',
// 			'Zarząd',
// 			'Kierownik IT',
// 			'Kierownik BOK',
// 			'Kierownik Bukmacher',
// 			'Kierownik Marketing',
// 			'Urlopy czas pracy',
// 		]
// 		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
// 			return res.status(403).send('Access denied')
// 		}

// 		const workdays = await Workday.find({ userId })
// 		res.json(workdays)
// 	} catch (error) {
// 		console.error('Error fetching workdays for user:', error)
// 		res.status(500).send('Failed to fetch workdays.')
// 	}
// }
exports.getUserWorkdays = async (req, res) => {
	try {
		const { userId } = req.params;
		const requestingUser = await User.findById(req.user.userId);

		if (!requestingUser) {
			return res.status(403).send('Brak uprawnień');
		}

		
		const isAdmin = requestingUser.roles.includes('Admin');
		const isHR = requestingUser.roles.includes('HR');
		const isSelf = requestingUser._id.toString() === userId;
		
		const userToView = await User.findById(userId);
		
		// Sprawdź uprawnienia przełożonego
		const { canSupervisorViewTimesheets } = require('../services/roleService')
		const canView = userToView ? await canSupervisorViewTimesheets(requestingUser, userToView) : false;

		if (!(isAdmin || isHR || isSelf || canView)) {
			return res.status(403).send('Access denied');
		}

		const workdays = await Workday.find({ userId });
		res.json(workdays);
	} catch (error) {
		console.error('Error fetching workdays for user:', error);
		res.status(500).send('Failed to fetch workdays.');
	}
}

// Pobierz wszystkie workdays z zespołu (z informacją o użytkowniku)
exports.getAllTeamWorkdays = async (req, res) => {
	try {
		const requestingUser = await User.findById(req.user.userId);

		if (!requestingUser) {
			return res.status(403).send('Brak uprawnień');
		}

		const isAdmin = requestingUser.roles.includes('Admin');
		const isHR = requestingUser.roles.includes('HR');
		const isSupervisor = requestingUser.roles.includes('Przełożony (Supervisor)');
		
		// Sprawdź uprawnienia przełożonego
		const { canSupervisorViewTimesheets } = require('../services/roleService')
		const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
		
		let allowedUserIds = []
		
		if (isAdmin || isHR) {
			// Admin i HR widzą wszystkich z zespołu
			const teamUsers = await User.find({ 
				teamId: requestingUser.teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('_id');
			allowedUserIds = teamUsers.map(u => u._id);
		} else if (isSupervisor) {
			// Przełożony widzi tylko swoich podwładnych
			// Pobierz konfigurację przełożonego
			const config = await SupervisorConfig.findOne({ supervisorId: requestingUser._id });
			
			// Pobierz wszystkich użytkowników z zespołu
			const teamUsers = await User.find({ 
				teamId: requestingUser.teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('_id firstName lastName department');
			
			// Filtruj użytkowników na podstawie uprawnień przełożonego
			for (const user of teamUsers) {
				const canView = await canSupervisorViewTimesheets(requestingUser, user);
				if (canView) {
					allowedUserIds.push(user._id);
				}
			}
		} else {
			// Inne role nie mają dostępu
			return res.status(403).send('Brak uprawnień do przeglądania ewidencji zespołu');
		}

		// Jeśli nie ma dozwolonych użytkowników, zwróć pustą tablicę
		if (allowedUserIds.length === 0) {
			return res.json([]);
		}

		// Pobierz workdays dla dozwolonych użytkowników
		const workdays = await Workday.find({ 
			userId: { $in: allowedUserIds }
		}).populate('userId', 'firstName lastName').sort({ date: 1 });

		res.json(workdays);
	} catch (error) {
		console.error('Error fetching team workdays:', error);
		res.status(500).send('Failed to fetch team workdays.');
	}
}

// Start timer
exports.startTimer = async (req, res) => {
	try {
		const { workDescription, taskId, isOvertime, qrCodeId } = req.body
		const userId = req.user.userId

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		// Check if timer can be started on this date
		const canStart = await exports.canStartTimerOnDate(userId, today)
		if (!canStart.canStart) {
			return res.status(400).json({ message: canStart.reason })
		}

		// Find or create workday for today
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

		// Check if timer is already running
		if (workday.activeTimer && workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Timer już działa' })
		}

		// Start timer
		workday.activeTimer = {
			startTime: new Date(),
			isBreak: false,
			isOvertime: isOvertime || false,
			workDescription: workDescription || '',
			taskId: taskId || null,
			qrCodeId: qrCodeId || null
		}

		await workday.save()

		res.json({
			message: 'Timer rozpoczęty',
			startTime: workday.activeTimer.startTime
		})
	} catch (error) {
		console.error('Error starting timer:', error)
		res.status(500).json({ message: 'Błąd podczas uruchamiania timera' })
	}
}

// Pause/Resume timer
exports.pauseTimer = async (req, res) => {
	try {
		const userId = req.user.userId

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const workday = await Workday.findOne({ userId, date: today })

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		// Toggle break status
		workday.activeTimer.isBreak = !workday.activeTimer.isBreak

		await workday.save()

		res.json({
			message: workday.activeTimer.isBreak ? 'Przerwa rozpoczęta' : 'Przerwa zakończona',
			isBreak: workday.activeTimer.isBreak
		})
	} catch (error) {
		console.error('Error pausing timer:', error)
		res.status(500).json({ message: 'Błąd podczas pauzowania timera' })
	}
}

// Stop timer and save to timeEntries
exports.stopTimer = async (req, res) => {
	try {
		const userId = req.user.userId

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const workday = await Workday.findOne({ userId, date: today })

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		const endTime = new Date()
		const startTime = new Date(workday.activeTimer.startTime)

		// Calculate hours (only if not on break)
		let hoursWorked = 0
		if (!workday.activeTimer.isBreak) {
			hoursWorked = (endTime - startTime) / (1000 * 60 * 60)
		}

		// Add to timeEntries
		const timeEntry = {
			startTime,
			endTime,
			isBreak: workday.activeTimer.isBreak,
			isOvertime: workday.activeTimer.isOvertime,
			workDescription: workday.activeTimer.workDescription,
			taskId: workday.activeTimer.taskId,
			qrCodeId: workday.activeTimer.qrCodeId || null
		}

		if (!workday.timeEntries) {
			workday.timeEntries = []
		}
		workday.timeEntries.push(timeEntry)

		// Update total hours
		if (!workday.hoursWorked) workday.hoursWorked = 0
		if (!workday.activeTimer.isBreak) {
			workday.hoursWorked += hoursWorked
		}

		// Update overtime if applicable
		if (workday.activeTimer.isOvertime && !workday.activeTimer.isBreak) {
			if (!workday.additionalWorked) workday.additionalWorked = 0
			workday.additionalWorked += hoursWorked
		}

		// Update time range string
		if (!workday.activeTimer.isBreak) {
			const formatTime = (date) => {
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				return `${hours}:${minutes}`
			}
			const timeRange = `${formatTime(startTime)}-${formatTime(endTime)}`
			
			if (workday.realTimeDayWorked) {
				workday.realTimeDayWorked += `, ${timeRange}`
			} else {
				workday.realTimeDayWorked = timeRange
			}
		}

		// Clear active timer
		workday.activeTimer = null

		await workday.save()

		res.json({
			message: 'Timer zatrzymany',
			hoursWorked,
			timeEntry
		})
	} catch (error) {
		console.error('Error stopping timer:', error)
		res.status(500).json({ message: 'Błąd podczas zatrzymywania timera' })
	}
}

// Get active timer status
exports.getActiveTimer = async (req, res) => {
	try {
		const userId = req.user.userId

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const workday = await Workday.findOne({ userId, date: today })

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.json({ active: false })
		}

		res.json({
			active: true,
			startTime: workday.activeTimer.startTime,
			isBreak: workday.activeTimer.isBreak,
			isOvertime: workday.activeTimer.isOvertime,
			workDescription: workday.activeTimer.workDescription,
			taskId: workday.activeTimer.taskId,
			qrCodeId: workday.activeTimer.qrCodeId || null
		})
	} catch (error) {
		console.error('Error getting active timer:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania statusu timera' })
	}
}

// Update active timer description
exports.updateActiveTimer = async (req, res) => {
	try {
		const { workDescription, taskId, isOvertime } = req.body
		const userId = req.user.userId

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const workday = await Workday.findOne({ userId, date: today })

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		// Update work description and/or taskId
		if (workDescription !== undefined) {
			workday.activeTimer.workDescription = workDescription || ''
		}
		if (taskId !== undefined) {
			workday.activeTimer.taskId = taskId || null
		}
		if (isOvertime !== undefined) {
			workday.activeTimer.isOvertime = isOvertime
		}

		await workday.save()

		res.json({
			message: 'Timer zaktualizowany',
			workDescription: workday.activeTimer.workDescription,
			taskId: workday.activeTimer.taskId,
			isOvertime: workday.activeTimer.isOvertime
		})
	} catch (error) {
		console.error('Error updating active timer:', error)
		res.status(500).json({ message: 'Błąd podczas aktualizacji timera' })
	}
}

// Split session - save current session and continue with new description
exports.splitSession = async (req, res) => {
	try {
		const { workDescription, taskId, isOvertime } = req.body
		const userId = req.user.userId

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		const workday = await Workday.findOne({ userId, date: today })

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		const endTime = new Date()
		const startTime = new Date(workday.activeTimer.startTime)

		// Calculate hours (only if not on break)
		let hoursWorked = 0
		if (!workday.activeTimer.isBreak) {
			hoursWorked = (endTime - startTime) / (1000 * 60 * 60)
		}

		// Add current session to timeEntries
		const timeEntry = {
			startTime,
			endTime,
			isBreak: workday.activeTimer.isBreak,
			isOvertime: workday.activeTimer.isOvertime,
			workDescription: workday.activeTimer.workDescription,
			taskId: workday.activeTimer.taskId,
			qrCodeId: workday.activeTimer.qrCodeId || null
		}

		if (!workday.timeEntries) {
			workday.timeEntries = []
		}
		workday.timeEntries.push(timeEntry)

		// Update total hours
		if (!workday.hoursWorked) workday.hoursWorked = 0
		if (!workday.activeTimer.isBreak) {
			workday.hoursWorked += hoursWorked
		}

		// Update overtime if applicable
		if (workday.activeTimer.isOvertime && !workday.activeTimer.isBreak) {
			if (!workday.additionalWorked) workday.additionalWorked = 0
			workday.additionalWorked += hoursWorked
		}

		// Update time range string
		if (!workday.activeTimer.isBreak) {
			const formatTime = (date) => {
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				return `${hours}:${minutes}`
			}
			const timeRange = `${formatTime(startTime)}-${formatTime(endTime)}`
			
			if (workday.realTimeDayWorked) {
				workday.realTimeDayWorked += `, ${timeRange}`
			} else {
				workday.realTimeDayWorked = timeRange
			}
		}

		// Start new session with new description (continue from where we left off)
		workday.activeTimer = {
			startTime: endTime, // Continue from where we left off
			isBreak: workday.activeTimer.isBreak, // Keep break status
			isOvertime: isOvertime !== undefined ? isOvertime : workday.activeTimer.isOvertime,
			workDescription: workDescription || '',
			taskId: taskId || null,
			qrCodeId: workday.activeTimer.qrCodeId || null // Keep QR code ID if it was from QR
		}

		await workday.save()

		res.json({
			message: 'Sesja zapisana, kontynuacja z nowym opisem',
			savedSession: timeEntry,
			activeTimer: workday.activeTimer
		})
	} catch (error) {
		console.error('Error splitting session:', error)
		res.status(500).json({ message: 'Błąd podczas zapisywania sesji' })
	}
}

// Delete a single session from workday
exports.deleteSession = async (req, res) => {
	try {
		const { workdayId, sessionId } = req.params
		const userId = req.user.userId

		// Find the workday
		const workday = await Workday.findOne({ _id: workdayId, userId })
		if (!workday) {
			return res.status(404).json({ message: 'Workday nie znaleziony' })
		}

		// Find the session
		const session = workday.timeEntries.id(sessionId)
		if (!session) {
			return res.status(404).json({ message: 'Sesja nie znaleziona' })
		}

		// Calculate hours to subtract
		let hoursToSubtract = 0
		if (session.startTime && session.endTime && !session.isBreak) {
			hoursToSubtract = (new Date(session.endTime) - new Date(session.startTime)) / (1000 * 60 * 60)
		}

		// Remove from hoursWorked or additionalWorked
		if (!session.isBreak) {
			if (session.isOvertime) {
				workday.additionalWorked = Math.max(0, (workday.additionalWorked || 0) - hoursToSubtract)
			} else {
				workday.hoursWorked = Math.max(0, (workday.hoursWorked || 0) - hoursToSubtract)
			}
		}

		// Remove time range from realTimeDayWorked if exists
		if (session.startTime && session.endTime && !session.isBreak) {
			const formatTime = (date) => {
				const hours = date.getHours().toString().padStart(2, '0')
				const minutes = date.getMinutes().toString().padStart(2, '0')
				return `${hours}:${minutes}`
			}
			const timeRange = `${formatTime(new Date(session.startTime))}-${formatTime(new Date(session.endTime))}`
			
			if (workday.realTimeDayWorked) {
				// Remove the time range from the string
				workday.realTimeDayWorked = workday.realTimeDayWorked
					.split(', ')
					.filter(range => range !== timeRange)
					.join(', ')
				
				// If empty, set to empty string
				if (!workday.realTimeDayWorked.trim()) {
					workday.realTimeDayWorked = ''
				}
			}
		}

		// Remove the session using pull
		workday.timeEntries.pull(sessionId)
		await workday.save()

		res.json({ message: 'Sesja usunięta pomyślnie' })
	} catch (error) {
		console.error('Error deleting session:', error)
		res.status(500).json({ message: 'Błąd podczas usuwania sesji' })
	}
}

// Get time entries (sessions) for a specific month
exports.getTodaySessions = async (req, res) => {
	try {
		const userId = req.user.userId
		const { month, year } = req.query

		let startDate, endDate

		if (month !== undefined && year !== undefined) {
			// Get sessions for specific month
			const monthNum = parseInt(month, 10)
			const yearNum = parseInt(year, 10)
			startDate = new Date(yearNum, monthNum, 1)
			startDate.setHours(0, 0, 0, 0)
			endDate = new Date(yearNum, monthNum + 1, 0)
			endDate.setHours(23, 59, 59, 999)
		} else {
			// Default to today if no month/year provided
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			startDate = today
			endDate = new Date(today)
			endDate.setHours(23, 59, 59, 999)
		}

		// Get all workdays in the date range
		const workdays = await Workday.find({
			userId,
			date: {
				$gte: startDate,
				$lte: endDate
			}
		})

		if (!workdays || workdays.length === 0) {
			return res.json({
				grouped: [],
				totalMinutes: 0,
				totalHours: '0.00',
				dateRange: {
					start: startDate,
					end: endDate
				}
			})
		}

		// Collect all time entries from all workdays in the month
		const Task = require('../models/Task')(firmDb)
		const allSessions = []
		let totalMinutes = 0

		// Helper function to calculate minutes between two dates
		const calculateMinutes = (start, end) => {
			if (!start || !end) return 0
			return Math.round((new Date(end) - new Date(start)) / (1000 * 60))
		}

		for (const workday of workdays) {
			if (workday.timeEntries && workday.timeEntries.length > 0) {
				for (const entry of workday.timeEntries) {
					// Skip break sessions for total time calculation
					if (!entry.isBreak && entry.startTime && entry.endTime) {
						totalMinutes += calculateMinutes(entry.startTime, entry.endTime)
					}

					let task = null
					if (entry.taskId) {
						task = await Task.findById(entry.taskId).select('title')
					}
					
					let qrCode = null
					if (entry.qrCodeId) {
						const QRCode = require('../models/QRCode')(firmDb)
						qrCode = await QRCode.findById(entry.qrCodeId).select('name code')
					}
					
					allSessions.push({
						...entry.toObject(),
						task: task ? { _id: task._id, title: task.title } : null,
						qrCode: qrCode ? { _id: qrCode._id, name: qrCode.name, code: qrCode.code } : null,
						date: workday.date, // Include the date from workday
						workdayId: workday._id.toString() // Include workday ID for deletion
					})
				}
			}
		}

		// Group sessions by workDescription (and taskId if exists)
		const groupedSessions = {}
		
		for (const session of allSessions) {
			// Skip break sessions in grouping
			if (session.isBreak) continue

			// Create a unique key for grouping: workDescription + taskId (if exists)
			const groupKey = session.taskId 
				? `task_${session.taskId.toString()}` 
				: `desc_${(session.workDescription || '').trim().toLowerCase()}`

			if (!groupedSessions[groupKey]) {
				groupedSessions[groupKey] = {
					workDescription: session.workDescription || '',
					task: session.task,
					taskId: session.taskId,
					sessions: [],
					totalMinutes: 0,
					totalHours: 0,
					percentage: 0
				}
			}

			if (session.startTime && session.endTime) {
				const minutes = calculateMinutes(session.startTime, session.endTime)
				groupedSessions[groupKey].sessions.push(session)
				groupedSessions[groupKey].totalMinutes += minutes
			}
		}

		// Convert to array and calculate percentages
		const result = Object.values(groupedSessions).map(group => {
			group.totalHours = (group.totalMinutes / 60).toFixed(2)
			group.percentage = totalMinutes > 0 ? ((group.totalMinutes / totalMinutes) * 100).toFixed(1) : 0
			return group
		})

		// Sort by totalMinutes (descending - most time first)
		result.sort((a, b) => b.totalMinutes - a.totalMinutes)

		res.json({
			grouped: result,
			totalMinutes,
			totalHours: (totalMinutes / 60).toFixed(2),
			dateRange: {
				start: startDate,
				end: endDate
			}
		})
	} catch (error) {
		console.error('Error getting sessions:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania sesji' })
	}
}

// Get sessions for a specific user (with permission check)
exports.getUserSessions = async (req, res) => {
	try {
		const { userId } = req.params
		const { month, year } = req.query
		const requestingUser = await User.findById(req.user.userId)

		if (!requestingUser) {
			return res.status(403).json({ message: 'Brak uprawnień' })
		}

		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		const isSelf = requestingUser._id.toString() === userId

		const userToView = await User.findById(userId)

		// Sprawdź uprawnienia przełożonego
		const { canSupervisorViewTimesheets } = require('../services/roleService')
		const canView = userToView ? await canSupervisorViewTimesheets(requestingUser, userToView) : false

		if (!(isAdmin || isHR || isSelf || canView)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		let startDate, endDate

		if (month !== undefined && year !== undefined) {
			const monthNum = parseInt(month, 10)
			const yearNum = parseInt(year, 10)
			startDate = new Date(yearNum, monthNum, 1)
			startDate.setHours(0, 0, 0, 0)
			endDate = new Date(yearNum, monthNum + 1, 0)
			endDate.setHours(23, 59, 59, 999)
		} else {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			startDate = today
			endDate = new Date(today)
			endDate.setHours(23, 59, 59, 999)
		}

		const workdays = await Workday.find({
			userId,
			date: {
				$gte: startDate,
				$lte: endDate
			}
		})

		if (!workdays || workdays.length === 0) {
			return res.json({
				grouped: [],
				totalMinutes: 0,
				totalHours: '0.00',
				availableDates: [],
				dateRange: {
					start: startDate,
					end: endDate
				}
			})
		}

		const Task = require('../models/Task')(firmDb)
		const allSessions = []
		let totalMinutes = 0
		const availableDatesSet = new Set()

		const calculateMinutes = (start, end) => {
			if (!start || !end) return 0
			return Math.round((new Date(end) - new Date(start)) / (1000 * 60))
		}

		for (const workday of workdays) {
			const workdayDate = new Date(workday.date).toISOString().split('T')[0]
			availableDatesSet.add(workdayDate)

			if (workday.timeEntries && workday.timeEntries.length > 0) {
				for (const entry of workday.timeEntries) {
					if (!entry.isBreak && entry.startTime && entry.endTime) {
						totalMinutes += calculateMinutes(entry.startTime, entry.endTime)
					}

					let task = null
					if (entry.taskId) {
						task = await Task.findById(entry.taskId).select('title')
					}

					let qrCode = null
					if (entry.qrCodeId) {
						const QRCode = require('../models/QRCode')(firmDb)
						qrCode = await QRCode.findById(entry.qrCodeId).select('name code')
					}

					allSessions.push({
						...entry.toObject(),
						workdayId: workday._id,
						task: task ? { _id: task._id, title: task.title } : null,
						qrCode: qrCode ? { _id: qrCode._id, name: qrCode.name, code: qrCode.code } : null,
						date: workdayDate
					})
				}
			}
		}

		const groupedSessions = {}

		for (const session of allSessions) {
			if (session.isBreak) continue

			const groupKey = session.taskId
				? `task_${session.taskId.toString()}`
				: `desc_${(session.workDescription || '').trim().toLowerCase()}`

			if (!groupedSessions[groupKey]) {
				groupedSessions[groupKey] = {
					workDescription: session.workDescription || '',
					task: session.task,
					taskId: session.taskId,
					sessions: [],
					totalMinutes: 0,
					totalHours: 0,
					percentage: 0
				}
			}

			if (session.startTime && session.endTime) {
				const minutes = calculateMinutes(session.startTime, session.endTime)
				groupedSessions[groupKey].sessions.push(session)
				groupedSessions[groupKey].totalMinutes += minutes
			}
		}

		const result = Object.values(groupedSessions).map(group => {
			group.totalHours = (group.totalMinutes / 60).toFixed(2)
			group.percentage = totalMinutes > 0 ? ((group.totalMinutes / totalMinutes) * 100).toFixed(1) : 0
			return group
		})

		result.sort((a, b) => b.totalMinutes - a.totalMinutes)

		res.json({
			grouped: result,
			totalMinutes,
			totalHours: (totalMinutes / 60).toFixed(2),
			availableDates: Array.from(availableDatesSet).sort().reverse(),
			dateRange: {
				start: startDate,
				end: endDate
			}
		})
	} catch (error) {
		console.error('Error getting user sessions:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania sesji użytkownika' })
	}
}
