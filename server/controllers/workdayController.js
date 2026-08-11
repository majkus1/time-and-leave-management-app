const { firmDb } = require('../db/db')
const Workday = require('../models/Workday')(firmDb)
const User = require('../models/user')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
const { isHoliday } = require('../utils/holidays')
const { NON_HOURLY_LEAVE_QUERY } = require('../utils/leaveSettlement')
const { normalizeWorkdayPayload, validateNewWorkdayEntry, toWarsawYmd } = require('../utils/workdayEntryValidation')
const {
	resolveTeamScopedTimesheetWriteAccess,
	sendTeamScopedTimesheetWriteAccessError,
} = require('../utils/timesheetWriteAccess')

const emitWorkdaysUpdated = (req, userId, dateValue) => {
	const io = req.app?.io
	if (!io || !userId) return
	const date = dateValue ? new Date(dateValue) : null
	const payload = {
		userId: String(userId),
		teamId: req.user?.teamId ? String(req.user.teamId) : null,
		month: date && !Number.isNaN(date.getTime()) ? date.getMonth() : null,
		year: date && !Number.isNaN(date.getTime()) ? date.getFullYear() : null,
		at: new Date().toISOString(),
	}
	io.to(`user:${userId}`).emit('workdays-updated', payload)
	if (req.user?.teamId) {
		io.to(`team:${req.user.teamId}`).emit('workdays-updated', payload)
	}
}
const { bulkFillWorkdays } = require('../services/workdayBulkFillService')
const { validateAndSanitizeWorkdayCreate, applyWorkdayUpdateFields } = require('../services/workdayPayloadService')
const { fetchTimesheetTasksForUser, tasksToAllowedMap } = require('../utils/timesheetTaskAccess')
const { resolveTimerActivityId, getTimerActivitySnapshot, groupTimerSessions } = require('../utils/timerWorkActivity')

const CONFIRMED_MONTH_TIMER_MESSAGE = 'Miesiąc jest potwierdzony. Cofnij potwierdzenie, aby uzupełnić wpisy.'

async function loadAllowedTasksMapForUser(targetUser) {
	if (!targetUser?._id || !targetUser?.teamId) return new Map()
	const tasks = await fetchTimesheetTasksForUser(targetUser._id, targetUser.teamId, targetUser)
	return tasksToAllowedMap(tasks)
}

// Helper function to check if day is weekend
function isWeekend(date) {
	const day = new Date(date).getDay()
	return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
}

async function isCalendarMonthConfirmed(userId, date) {
	const checkDate = new Date(date)
	if (!userId || Number.isNaN(checkDate.getTime())) return false

	const confirmation = await CalendarConfirmation.findOne({
		userId,
		month: checkDate.getMonth(),
		year: checkDate.getFullYear(),
		isConfirmed: true,
	}).lean()

	return !!confirmation
}

async function ensureTimerMonthCanBeChanged(userId, date) {
	if (await isCalendarMonthConfirmed(userId, date)) {
		return {
			ok: false,
			status: 400,
			message: CONFIRMED_MONTH_TIMER_MESSAGE,
			code: 'MONTH_CONFIRMED',
		}
	}

	return { ok: true }
}

/**
 * Finds workday with active timer for a user
 * Checks both today and yesterday to support overnight shifts
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Workday with active timer or null
 */
exports.findActiveTimerWorkday = async function findActiveTimerWorkday(userId) {
	const today = new Date()
	today.setHours(0, 0, 0, 0)
	
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)
	
	// Check today first
	let workday = await Workday.findOne({ 
		userId, 
		date: today,
		'activeTimer.startTime': { $exists: true, $ne: null }
	})
	
	if (workday && workday.activeTimer && workday.activeTimer.startTime) {
		return workday
	}
	
	// Check yesterday (for overnight shifts)
	workday = await Workday.findOne({ 
		userId, 
		date: yesterday,
		'activeTimer.startTime': { $exists: true, $ne: null }
	})
	
	if (workday && workday.activeTimer && workday.activeTimer.startTime) {
		return workday
	}
	
	return null
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

		if (await isCalendarMonthConfirmed(userId, checkDate)) {
			return { canStart: false, reason: CONFIRMED_MONTH_TIMER_MESSAGE }
		}

		// No limit on timer sessions - timer hours will be added to existing hoursWorked

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

		// Check if user has accepted leave request for this date.
		// Wnioski godzinowe pomijamy — zajmują tylko część dnia, więc pracownik może
		// normalnie pracować w pozostałych godzinach.
		const acceptedLeaveRequests = await LeaveRequest.find({
			userId: userId,
			status: { $in: ['status.accepted', 'status.sent'] },
			...NON_HOURLY_LEAVE_QUERY
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

function isTodayInWarsaw(dateYmd) {
	return dateYmd === toWarsawYmd(new Date())
}

async function createWorkdayForTarget({ req, res, targetUser, settings }) {
	const { date, hoursWorked, additionalWorked, realTimeDayWorked, absenceType, notes, manualActivityBlocks, manualTaskBlocks } = req.body
	try {
		if (!targetUser || !targetUser.teamId) {
			return res.status(403).json({ message: 'Użytkownik nie znaleziony lub brak zespołu', code: 'USER_INVALID' })
		}

		let dateYmd = null
		if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
			dateYmd = date.trim().slice(0, 10)
		} else if (date != null) {
			dateYmd = toWarsawYmd(date)
		}
		if (!dateYmd) {
			return res.status(400).json({ message: 'Nieprawidłowa data', code: 'INVALID_DATE' })
		}

		const teamSettings = settings || await Settings.getSettings(targetUser.teamId)
		if (teamSettings.workdayEntriesOnlyToday === true && !isTodayInWarsaw(dateYmd)) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono dodawanie wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}

		const allowedTasksById = await loadAllowedTasksMapForUser(targetUser)

		const v = await validateAndSanitizeWorkdayCreate({
			WorkdayModel: Workday,
			LeaveRequestModel: LeaveRequest,
			getSettings: tid => Settings.getSettings(tid),
			userId: targetUser._id,
			teamId: targetUser.teamId,
			dateYmd,
			settings: teamSettings,
			body: { hoursWorked, additionalWorked, realTimeDayWorked, absenceType, notes, manualActivityBlocks, manualTaskBlocks },
			allowedTasksById,
			locale: 'pl',
		})

		if (!v.ok) {
			return res.status(400).json({ message: v.message, code: v.code })
		}

		const workday = new Workday({
			userId: targetUser._id,
			date: date != null ? date : new Date(`${dateYmd}T12:00:00.000Z`),
			...v.sanitized,
			lastChangedBy: req.user.userId,
		})
		await workday.save()
		emitWorkdaysUpdated(req, targetUser._id, workday.date)
		return res.status(201).json(workday)
	} catch (error) {
		console.error('Error adding workday:', error)
		return res.status(500).send('Failed to add workday.')
	}
}

exports.addWorkday = async (req, res) => {
	try {
		const user = await User.findById(req.user.userId)
		return createWorkdayForTarget({ req, res, targetUser: user })
	} catch (error) {
		console.error('Error adding workday:', error)
		res.status(500).send('Failed to add workday.')
	}
}

exports.addWorkdayForUser = async (req, res) => {
	try {
		const access = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, req.params.userId)
		if (access.error) {
			return sendTeamScopedTimesheetWriteAccessError(res, access.error, { asJson: true })
		}
		return createWorkdayForTarget({
			req,
			res,
			targetUser: access.targetUser,
			settings: access.settings,
		})
	} catch (error) {
		console.error('Error adding workday for user:', error)
		res.status(500).send('Failed to add workday.')
	}
}

exports.bulkFillWorkdays = async (req, res) => {
	try {
		const targetUser = await User.findById(req.user.userId)
		if (!targetUser || !targetUser.teamId) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony.' })
		}
		const settings = await Settings.getSettings(targetUser.teamId)
		const result = await bulkFillWorkdays({
			WorkdayModel: Workday,
			LeaveRequestModel: LeaveRequest,
			CalendarConfirmationModel: CalendarConfirmation,
			targetUser,
			settings,
			body: req.body,
			actorUserId: req.user.userId,
		})
		if (result.error) {
			return res.status(result.error.status).json({
				message: result.error.message,
				code: result.error.code,
			})
		}
		emitWorkdaysUpdated(req, targetUser._id, `${req.body.startDate}T12:00:00.000Z`)
		return res.status(201).json(result)
	} catch (error) {
		console.error('Error bulk filling workdays:', error)
		return res.status(500).json({ message: 'Nie udało się uzupełnić ewidencji.' })
	}
}

exports.bulkFillWorkdaysForUser = async (req, res) => {
	try {
		const access = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, req.params.userId)
		if (access.error) {
			return sendTeamScopedTimesheetWriteAccessError(res, access.error, { asJson: true })
		}
		const result = await bulkFillWorkdays({
			WorkdayModel: Workday,
			LeaveRequestModel: LeaveRequest,
			CalendarConfirmationModel: CalendarConfirmation,
			targetUser: access.targetUser,
			settings: access.settings,
			body: req.body,
			actorUserId: req.user.userId,
		})
		if (result.error) {
			return res.status(result.error.status).json({
				message: result.error.message,
				code: result.error.code,
			})
		}
		emitWorkdaysUpdated(req, access.targetUser._id, `${req.body.startDate}T12:00:00.000Z`)
		return res.status(201).json(result)
	} catch (error) {
		console.error('Error bulk filling workdays for user:', error)
		return res.status(500).json({ message: 'Nie udało się uzupełnić ewidencji.' })
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
		const workday = await Workday.findOne({ _id: req.params.id, userId: req.user.userId })
		if (!workday) return res.status(404).send('Workday not found or unauthorized')
		const user = await User.findById(req.user.userId)
		const settings = user?.teamId ? await Settings.getSettings(user.teamId) : null
		if (settings?.workdayEntriesOnlyToday === true && !isTodayInWarsaw(toWarsawYmd(workday.date))) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono edycję wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}

		const allowedTasksById = await loadAllowedTasksMapForUser(user)
		const result = applyWorkdayUpdateFields(workday, req.body, settings, allowedTasksById, { locale: 'pl' })
		if (!result.ok) {
			return res.status(400).json({ message: result.message, code: result.code })
		}
		workday.lastChangedBy = req.user.userId

		await workday.save()
		emitWorkdaysUpdated(req, req.user.userId, workday.date)
		res.send('Workday updated successfully.')
	} catch (error) {
		console.error('Error updating workday:', error)
		res.status(500).send('Failed to update workday.')
	}
}

exports.updateWorkdayForUser = async (req, res) => {
	try {
		const access = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, req.params.userId)
		if (access.error) {
			return sendTeamScopedTimesheetWriteAccessError(res, access.error, { asJson: true })
		}

		const workday = await Workday.findOne({ _id: req.params.id, userId: access.targetUser._id })
		if (!workday) return res.status(404).json({ message: 'Workday not found or unauthorized' })
		if (access.settings?.workdayEntriesOnlyToday === true && !isTodayInWarsaw(toWarsawYmd(workday.date))) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono edycję wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}

		const allowedTasksById = await loadAllowedTasksMapForUser(access.targetUser)
		const result = applyWorkdayUpdateFields(workday, req.body, access.settings, allowedTasksById, { locale: 'pl' })
		if (!result.ok) {
			return res.status(400).json({ message: result.message, code: result.code })
		}
		workday.lastChangedBy = req.user.userId
		workday.reviewStatus = null
		workday.reviewedBy = null
		workday.reviewedAt = null

		await workday.save()
		emitWorkdaysUpdated(req, access.targetUser._id, workday.date)
		res.json(workday)
	} catch (error) {
		console.error('Error updating workday for user:', error)
		res.status(500).json({ message: 'Failed to update workday.' })
	}
}

exports.deleteWorkday = async (req, res) => {
	try {
		const workday = await Workday.findOne({ _id: req.params.id, userId: req.user.userId })
		if (!workday) return res.status(404).send('Workday not found or unauthorized')
		const user = await User.findById(req.user.userId)
		const settings = user?.teamId ? await Settings.getSettings(user.teamId) : null
		if (settings?.workdayEntriesOnlyToday === true && !isTodayInWarsaw(toWarsawYmd(workday.date))) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono usuwanie wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}
		const result = await Workday.deleteOne({ _id: req.params.id, userId: req.user.userId })
		if (result.deletedCount === 0) return res.status(404).send('Workday not found or unauthorized')
		emitWorkdaysUpdated(req, req.user.userId, workday.date)
		res.send('Workday deleted successfully.')
	} catch (error) {
		console.error('Error deleting workday:', error)
		res.status(500).send('Failed to delete workday.')
	}
}

exports.clearWorkdaysForMonth = async (req, res) => {
	try {
		const month = Number.parseInt(req.body?.month, 10)
		const year = Number.parseInt(req.body?.year, 10)
		if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year) || year < 2000 || year > 2100) {
			return res.status(400).json({ message: 'Nieprawidłowy miesiąc lub rok.', code: 'INVALID_MONTH_RANGE' })
		}

		const user = await User.findById(req.user.userId)
		if (!user || !user.teamId) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony.' })
		}

		const settings = await Settings.getSettings(user.teamId)
		if (settings?.workdayEntriesOnlyToday === true) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono edycję wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}

		const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
		const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))

		const result = await Workday.deleteMany({
			userId: req.user.userId,
			date: { $gte: startDate, $lte: endDate },
		})

		emitWorkdaysUpdated(req, req.user.userId, new Date(Date.UTC(year, month, 1, 12, 0, 0, 0)))
		return res.json({
			deletedCount: result.deletedCount || 0,
			month,
			year,
		})
	} catch (error) {
		console.error('Error clearing workdays for month:', error)
		return res.status(500).json({ message: 'Nie udało się wyczyścić wpisów z miesiąca.' })
	}
}

exports.clearWorkdaysForUserMonth = async (req, res) => {
	try {
		const access = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, req.params.userId)
		if (access.error) {
			return sendTeamScopedTimesheetWriteAccessError(res, access.error, { asJson: true })
		}

		const month = Number.parseInt(req.body?.month, 10)
		const year = Number.parseInt(req.body?.year, 10)
		if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year) || year < 2000 || year > 2100) {
			return res.status(400).json({ message: 'Nieprawidłowy miesiąc lub rok.', code: 'INVALID_MONTH_RANGE' })
		}

		if (access.settings?.workdayEntriesOnlyToday === true) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono edycję wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}

		const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
		const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))

		const result = await Workday.deleteMany({
			userId: access.targetUser._id,
			date: { $gte: startDate, $lte: endDate },
		})

		emitWorkdaysUpdated(req, access.targetUser._id, new Date(Date.UTC(year, month, 1, 12, 0, 0, 0)))
		return res.json({
			deletedCount: result.deletedCount || 0,
			month,
			year,
		})
	} catch (error) {
		console.error('Error clearing workdays for user month:', error)
		return res.status(500).json({ message: 'Nie udało się wyczyścić wpisów z miesiąca.' })
	}
}

exports.deleteWorkdayForUser = async (req, res) => {
	try {
		const access = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, req.params.userId)
		if (access.error) {
			return sendTeamScopedTimesheetWriteAccessError(res, access.error, { asJson: true })
		}
		const workday = await Workday.findOne({ _id: req.params.id, userId: access.targetUser._id })
		if (!workday) return res.status(404).json({ message: 'Workday not found or unauthorized' })
		if (access.settings?.workdayEntriesOnlyToday === true && !isTodayInWarsaw(toWarsawYmd(workday.date))) {
			return res.status(400).json({
				message: 'W ustawieniach zespołu włączono usuwanie wpisów tylko dla dzisiejszego dnia.',
				code: 'ONLY_TODAY_ALLOWED',
			})
		}
		await Workday.deleteOne({ _id: req.params.id, userId: access.targetUser._id })
		emitWorkdaysUpdated(req, access.targetUser._id, workday.date)
		res.json({ message: 'Workday deleted successfully.' })
	} catch (error) {
		console.error('Error deleting workday for user:', error)
		res.status(500).json({ message: 'Failed to delete workday.' })
	}
}

exports.reviewWorkdayForUser = async (req, res) => {
	try {
		const { status } = req.body
		if (!['approved', 'rejected', null, ''].includes(status)) {
			return res.status(400).json({ message: 'Nieprawidłowy status zatwierdzenia.' })
		}

		const access = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, req.params.userId)
		if (access.error) {
			return sendTeamScopedTimesheetWriteAccessError(res, access.error, { asJson: true })
		}

		const workday = await Workday.findOne({ _id: req.params.id, userId: access.targetUser._id })
		if (!workday) return res.status(404).json({ message: 'Workday not found or unauthorized' })

		if (status === 'approved' || status === 'rejected') {
			workday.reviewStatus = status
			workday.reviewedBy = access.requestingUser._id
			workday.reviewedAt = new Date()
		} else {
			workday.reviewStatus = null
			workday.reviewedBy = null
			workday.reviewedAt = null
		}

		await workday.save()
		const populated = await Workday.findById(workday._id).populate('reviewedBy', 'firstName lastName')
		emitWorkdaysUpdated(req, access.targetUser._id, workday.date)
		res.json(populated)
	} catch (error) {
		console.error('Error reviewing workday for user:', error)
		res.status(500).json({ message: 'Failed to update workday review.' })
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
		const { userId } = req.params
		const {
			resolveTeamScopedTimesheetViewAccess,
			sendTeamScopedTimesheetViewAccessError,
		} = require('../utils/timesheetAccess')

		const access = await resolveTeamScopedTimesheetViewAccess(req.user.userId, userId)
		if (access.error) {
			return sendTeamScopedTimesheetViewAccessError(res, access.error)
		}

		const workdays = await Workday.find({ userId })
			.populate('reviewedBy', 'firstName lastName')
			.populate('lastChangedBy', 'firstName lastName');
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
		}).populate('userId', 'firstName lastName').populate('reviewedBy', 'firstName lastName').sort({ date: 1 });

		res.json(workdays);
	} catch (error) {
		console.error('Error fetching team workdays:', error);
		res.status(500).send('Failed to fetch team workdays.');
	}
}

// Start timer
exports.startTimer = async (req, res) => {
	try {
		const { workDescription, taskId, activityId, isOvertime, qrCodeId } = req.body
		const userId = req.user.userId
		const resolvedActivityId = await resolveTimerActivityId(Settings, req.user.teamId, activityId ?? null)

		const today = new Date()
		today.setHours(0, 0, 0, 0)

		// Check if timer can be started on this date
		const canStart = await exports.canStartTimerOnDate(userId, today)
		if (!canStart.canStart) {
			return res.status(400).json({ message: canStart.reason })
		}

		// Check if timer is already running (today or yesterday for overnight shifts)
		const existingActiveTimer = await exports.findActiveTimerWorkday(userId)
		if (existingActiveTimer && existingActiveTimer.activeTimer && existingActiveTimer.activeTimer.startTime) {
			return res.status(400).json({ message: 'Timer już działa' })
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

		// Start timer
		const now = new Date()
		workday.activeTimer = {
			startTime: now,
			isBreak: false,
			breakStartTime: null,
			totalBreakTime: 0,
			isOvertime: isOvertime || false,
			overtimeStartTime: isOvertime ? now : null, // Start tracking overtime if enabled
			totalOvertimeTime: 0,
			workDescription: workDescription || '',
			taskId: taskId || null,
			activityId: resolvedActivityId,
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

		const workday = await exports.findActiveTimerWorkday(userId)

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		const monthLock = await ensureTimerMonthCanBeChanged(userId, workday.activeTimer.startTime)
		if (!monthLock.ok) {
			return res.status(monthLock.status).json({ message: monthLock.message, code: monthLock.code })
		}

		const now = new Date()
		
		// Initialize break tracking if not exists
		if (workday.activeTimer.totalBreakTime === undefined) {
			workday.activeTimer.totalBreakTime = 0
		}
		if (workday.activeTimer.breakStartTime === undefined) {
			workday.activeTimer.breakStartTime = null
		}

		// Toggle break status
		if (workday.activeTimer.isBreak) {
			// Ending break - calculate and add break time
			if (workday.activeTimer.breakStartTime) {
				const breakDuration = (now - new Date(workday.activeTimer.breakStartTime)) / 1000 // seconds
				workday.activeTimer.totalBreakTime = (workday.activeTimer.totalBreakTime || 0) + breakDuration
				workday.activeTimer.breakStartTime = null
			}
			workday.activeTimer.isBreak = false
		} else {
			// Starting break - record start time
			workday.activeTimer.breakStartTime = now
			workday.activeTimer.isBreak = true
		}

		await workday.save()

		res.json({
			message: workday.activeTimer.isBreak ? 'Przerwa rozpoczęta' : 'Przerwa zakończona',
			isBreak: workday.activeTimer.isBreak,
			totalBreakTime: workday.activeTimer.totalBreakTime || 0
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
		const { quantity } = req.body || {}

		const workday = await exports.findActiveTimerWorkday(userId)

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		const monthLock = await ensureTimerMonthCanBeChanged(userId, workday.activeTimer.startTime)
		if (!monthLock.ok) {
			return res.status(monthLock.status).json({ message: monthLock.message, code: monthLock.code })
		}

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

		// Determine which workday to save the session to (today or the day timer started)
		const timerStartDate = new Date(startTime)
		timerStartDate.setHours(0, 0, 0, 0)
		
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		
		// If timer started yesterday, we need to handle hours distribution
		// For simplicity, save session to the day timer started
		const sessionWorkday = workday.date.getTime() === timerStartDate.getTime() 
			? workday 
			: await Workday.findOne({ userId, date: timerStartDate }) || workday

		// Add to timeEntries
		// Note: isBreak should always be false for work sessions
		// isBreak in timeEntry is meant for dedicated break sessions (not used currently)
		// The break time is tracked separately in breakTime field
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
			qrCodeId: workday.activeTimer.qrCodeId || null
		}
		const activitySnapshot = await getTimerActivitySnapshot(Settings, req.user.teamId, timeEntry.activityId, quantity)
		if (activitySnapshot.error === 'INVALID_QUANTITY') {
			return res.status(400).json({ message: 'Ilość wykonania musi być równa 0 lub większa.' })
		}
		Object.assign(timeEntry, activitySnapshot)

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

		// Update time range string (always, regardless of break status)
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

		// Clear active timer from the workday where it was running
		workday.activeTimer = null
		await workday.save()

		// Save session workday if different
		if (sessionWorkday._id.toString() !== workday._id.toString()) {
			await sessionWorkday.save()
		}

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

		const workday = await exports.findActiveTimerWorkday(userId)

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.json({ active: false })
		}

		// Return base totalBreakTime (without current break) - frontend will calculate current break in real-time
		// Return base totalOvertimeTime (without current overtime) - frontend will calculate current overtime in real-time
		res.json({
			active: true,
			startTime: workday.activeTimer.startTime,
			isBreak: workday.activeTimer.isBreak,
			breakStartTime: workday.activeTimer.breakStartTime || null,
			totalBreakTime: workday.activeTimer.totalBreakTime || 0, // Base break time (completed breaks only)
			isOvertime: workday.activeTimer.isOvertime,
			overtimeStartTime: workday.activeTimer.overtimeStartTime || null,
			totalOvertimeTime: workday.activeTimer.totalOvertimeTime || 0, // Base overtime time (completed overtime periods only)
			workDescription: workday.activeTimer.workDescription,
			taskId: workday.activeTimer.taskId,
			qrCodeId: workday.activeTimer.qrCodeId || null,
			activityId: workday.activeTimer.activityId || null
		})
	} catch (error) {
		console.error('Error getting active timer:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania statusu timera' })
	}
}

// Update active timer description
exports.updateActiveTimer = async (req, res) => {
	try {
		const { workDescription, taskId, activityId, isOvertime } = req.body
		const userId = req.user.userId

		const workday = await exports.findActiveTimerWorkday(userId)

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		const monthLock = await ensureTimerMonthCanBeChanged(userId, workday.activeTimer.startTime)
		if (!monthLock.ok) {
			return res.status(monthLock.status).json({ message: monthLock.message, code: monthLock.code })
		}

		// Update work description and/or taskId
		if (workDescription !== undefined) {
			workday.activeTimer.workDescription = workDescription || ''
		}
		if (taskId !== undefined) {
			workday.activeTimer.taskId = taskId || null
		}
		if (activityId !== undefined) {
			workday.activeTimer.activityId = await resolveTimerActivityId(Settings, req.user.teamId, activityId)
		}
		
		// Handle overtime toggle - track overtime time separately
		if (isOvertime !== undefined) {
			const now = new Date()
			
			// Initialize overtime tracking if not exists
			if (workday.activeTimer.totalOvertimeTime === undefined) {
				workday.activeTimer.totalOvertimeTime = 0
			}
			if (workday.activeTimer.overtimeStartTime === undefined) {
				workday.activeTimer.overtimeStartTime = null
			}
			
			const wasOvertime = workday.activeTimer.isOvertime
			const willBeOvertime = isOvertime
			
			if (wasOvertime && !willBeOvertime) {
				// Ending overtime - calculate and add overtime time
				if (workday.activeTimer.overtimeStartTime) {
					const overtimeDuration = (now - new Date(workday.activeTimer.overtimeStartTime)) / 1000 // seconds
					workday.activeTimer.totalOvertimeTime = (workday.activeTimer.totalOvertimeTime || 0) + overtimeDuration
					workday.activeTimer.overtimeStartTime = null
				}
			} else if (!wasOvertime && willBeOvertime) {
				// Starting overtime - record start time
				workday.activeTimer.overtimeStartTime = now
			}
			
			workday.activeTimer.isOvertime = isOvertime
		}

		await workday.save()

		res.json({
			message: 'Timer zaktualizowany',
			workDescription: workday.activeTimer.workDescription,
			taskId: workday.activeTimer.taskId,
			activityId: workday.activeTimer.activityId || null,
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
		const { workDescription, taskId, activityId, isOvertime, quantity } = req.body
		const userId = req.user.userId
		const resolvedActivityId = activityId !== undefined
			? await resolveTimerActivityId(Settings, req.user.teamId, activityId)
			: undefined

		const workday = await exports.findActiveTimerWorkday(userId)

		if (!workday || !workday.activeTimer || !workday.activeTimer.startTime) {
			return res.status(400).json({ message: 'Brak aktywnego timera' })
		}

		const monthLock = await ensureTimerMonthCanBeChanged(userId, workday.activeTimer.startTime)
		if (!monthLock.ok) {
			return res.status(monthLock.status).json({ message: monthLock.message, code: monthLock.code })
		}

		const endTime = new Date()
		const startTime = new Date(workday.activeTimer.startTime)

		// Calculate final break time (include current break if splitting during break)
		let finalBreakTime = workday.activeTimer.totalBreakTime || 0
		if (workday.activeTimer.isBreak && workday.activeTimer.breakStartTime) {
			const currentBreakDuration = (endTime - new Date(workday.activeTimer.breakStartTime)) / 1000 // seconds
			finalBreakTime += currentBreakDuration
		}

		// Calculate final overtime time (include current overtime if splitting during overtime)
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

		// Add current session to timeEntries
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
			qrCodeId: workday.activeTimer.qrCodeId || null
		}
		const activitySnapshot = await getTimerActivitySnapshot(Settings, req.user.teamId, timeEntry.activityId, quantity)
		if (activitySnapshot.error === 'INVALID_QUANTITY') {
			return res.status(400).json({ message: 'Ilość wykonania musi być równa 0 lub większa.' })
		}
		Object.assign(timeEntry, activitySnapshot)

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

		// Start new session with new description (continue from where we left off)
		// If timer was from yesterday, we need to move it to today's workday
		const today = new Date()
		today.setHours(0, 0, 0, 0)
		
		let activeTimerWorkday = workday
		if (workday.date.getTime() !== today.getTime()) {
			// Timer was from yesterday, move to today
			let todayWorkday = await Workday.findOne({ userId, date: today })
			if (!todayWorkday) {
				todayWorkday = new Workday({
					userId,
					date: today,
					hoursWorked: 0,
					realTimeDayWorked: '',
					timeEntries: [],
					activeTimer: null
				})
			}
			activeTimerWorkday = todayWorkday
		}

		// Preserve break tracking when continuing session
		const preservedBreakTime = workday.activeTimer.totalBreakTime || 0
		const preservedBreakStart = workday.activeTimer.isBreak && workday.activeTimer.breakStartTime 
			? workday.activeTimer.breakStartTime 
			: null
		
		// Preserve overtime tracking when continuing session
		// If ending overtime period, add it to totalOvertimeTime
		const now = new Date()
		let preservedOvertimeTime = workday.activeTimer.totalOvertimeTime || 0
		let preservedOvertimeStart = workday.activeTimer.overtimeStartTime || null
		
		const newIsOvertime = isOvertime !== undefined ? isOvertime : workday.activeTimer.isOvertime
		const wasOvertime = workday.activeTimer.isOvertime
		
		if (wasOvertime && !newIsOvertime && workday.activeTimer.overtimeStartTime) {
			// Ending overtime - add current period to total
			const overtimeDuration = (now - new Date(workday.activeTimer.overtimeStartTime)) / 1000 // seconds
			preservedOvertimeTime = (preservedOvertimeTime || 0) + overtimeDuration
			preservedOvertimeStart = null
		} else if (!wasOvertime && newIsOvertime) {
			// Starting overtime - record start time
			preservedOvertimeStart = now
		} else if (wasOvertime && newIsOvertime) {
			// Continuing overtime - keep start time
			preservedOvertimeStart = workday.activeTimer.overtimeStartTime
		}

		activeTimerWorkday.activeTimer = {
			startTime: endTime, // Continue from where we left off
			isBreak: workday.activeTimer.isBreak, // Keep break status
			breakStartTime: preservedBreakStart,
			totalBreakTime: preservedBreakTime,
			isOvertime: newIsOvertime,
			overtimeStartTime: preservedOvertimeStart,
			totalOvertimeTime: preservedOvertimeTime,
			workDescription: workDescription || '',
			taskId: taskId || null,
			activityId: resolvedActivityId !== undefined ? resolvedActivityId : (workday.activeTimer.activityId || null),
			qrCodeId: workday.activeTimer.qrCodeId || null // Keep QR code ID if it was from QR
		}

		// Clear timer from old workday if moved
		if (activeTimerWorkday._id.toString() !== workday._id.toString()) {
			workday.activeTimer = null
			await workday.save()
		}

		await activeTimerWorkday.save()
		
		// Save session workday if different
		if (sessionWorkday._id.toString() !== activeTimerWorkday._id.toString()) {
			await sessionWorkday.save()
		}

		res.json({
			message: 'Sesja zapisana, kontynuacja z nowym opisem',
			savedSession: timeEntry,
			activeTimer: activeTimerWorkday.activeTimer
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
				// Convert UTC date to local time string (Europe/Warsaw timezone)
				// This ensures the time displayed matches the user's local time
				const localDate = new Date(date.toLocaleString('en-US', { timeZone: 'Europe/Warsaw' }))
				const hours = localDate.getHours().toString().padStart(2, '0')
				const minutes = localDate.getMinutes().toString().padStart(2, '0')
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
		
		// Check if workday has no data left - if so, delete it
		const hasNoData = 
			(!workday.hoursWorked || workday.hoursWorked === 0) &&
			(!workday.additionalWorked || workday.additionalWorked === 0) &&
			(!workday.realTimeDayWorked || workday.realTimeDayWorked.trim() === '') &&
			(!workday.absenceType || workday.absenceType.trim() === '') &&
			(!workday.notes || workday.notes.trim() === '') &&
			(!workday.timeEntries || workday.timeEntries.length === 0) &&
			(!workday.activeTimer || !workday.activeTimer.startTime)
		
		if (hasNoData) {
			// Delete the workday if it has no data
			await Workday.findByIdAndDelete(workdayId)
			return res.json({ message: 'Sesja usunięta pomyślnie. Workday został usunięty, ponieważ nie zawierał już żadnych danych.' })
		}
		
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
		const teamSettings = await Settings.getSettings(req.user.teamId)
		const allSessions = []
		let totalMinutes = 0

		// Helper function to calculate minutes between two dates (work continues during breaks)
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

		// Group sessions by activity, task or description
		const groupedSessions = groupTimerSessions(allSessions, teamSettings, calculateMinutes)

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
		const {
			resolveTeamScopedTimesheetViewAccess,
			sendTeamScopedTimesheetViewAccessError,
		} = require('../utils/timesheetAccess')

		const access = await resolveTeamScopedTimesheetViewAccess(req.user.userId, userId)
		if (access.error) {
			return sendTeamScopedTimesheetViewAccessError(res, access.error, { asJson: true })
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
		const teamSettings = await Settings.getSettings(req.user.teamId)
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

		const groupedSessions = groupTimerSessions(allSessions, teamSettings, calculateMinutes)

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
