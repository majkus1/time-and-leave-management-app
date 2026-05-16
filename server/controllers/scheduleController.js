const { firmDb } = require('../db/db')
const Schedule = require('../models/Schedule')(firmDb)
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { emitScheduleUpdated } = require('../utils/scheduleRealtime')
const { canSupervisorManageSchedule } = require('../services/roleService')
const { autoGenerateScheduleMonth } = require('../services/scheduleAutoPlannerService')
const { runScheduleAutoDraftTurn } = require('../services/aiScheduleAutoDraftService')
const entitlementsService = require('../services/entitlementsService')
const { createLog } = require('../services/logService')
const { isHoliday } = require('../utils/holidays')
const { sendSchedulePublishedPushNotification } = require('../services/pushNotificationService')
const { sendSchedulePublishedEmailNotification } = require('../services/emailService')
const { getClientSafeMessage } = require('../utils/clientSafeErrors')

const normalizeDepartments = (departmentValue) =>
	Array.isArray(departmentValue) ? departmentValue : (departmentValue ? [departmentValue] : [])

const canAccessSchedule = (schedule, user) => {
	if (!schedule || !user || !user.teamId) return false
	if (user.teamId.toString() !== schedule.teamId.toString()) return false

	const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : [])
	const isAdmin = roles.includes('Admin')
	const isHR = roles.includes('HR')
	if (isAdmin || isHR) return true

	if (schedule.type === 'team') return true
	if (schedule.type === 'department') {
		const userDepartments = normalizeDepartments(user.department)
		return userDepartments.includes(schedule.departmentName)
	}
	if (schedule.type === 'custom') {
		return schedule.members && schedule.members.some(memberId => memberId.toString() === user._id.toString())
	}

	return false
}

const parseDateInput = (value) => {
	if (!value) return null
	if (value instanceof Date) return value
	if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
		const [year, month, day] = value.split('-').map(Number)
		return new Date(year, month - 1, day)
	}
	return new Date(value)
}

const isWeekendDate = (dateValue) => {
	const date = parseDateInput(dateValue)
	if (!date || Number.isNaN(date.getTime())) return false
	const day = date.getDay()
	return day === 0 || day === 6
}

const normalizeTime = (timeValue) => {
	if (!timeValue || typeof timeValue !== 'string') return null
	const trimmed = timeValue.trim()
	const match = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)
	if (!match) return null
	return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`
}

const timeToMinutes = (timeValue) => {
	const normalized = normalizeTime(timeValue)
	if (!normalized) return null
	const [hours, minutes] = normalized.split(':').map(Number)
	return hours * 60 + minutes
}

const normalizeAvailabilityWindows = (timeWindows) => {
	if (!timeWindows) return []
	if (!Array.isArray(timeWindows)) return null

	const normalized = []
	for (const window of timeWindows) {
		const timeFrom = normalizeTime(window?.timeFrom)
		const timeTo = normalizeTime(window?.timeTo)
		if (!timeFrom || !timeTo) return null
		const fromMinutes = timeToMinutes(timeFrom)
		const toMinutes = timeToMinutes(timeTo)
		if (fromMinutes === null || toMinutes === null || fromMinutes >= toMinutes) return null
		normalized.push({ timeFrom, timeTo })
	}

	// Remove duplicates
	const uniqueMap = new Map()
	for (const window of normalized) {
		uniqueMap.set(`${window.timeFrom}-${window.timeTo}`, window)
	}
	return Array.from(uniqueMap.values())
}

const canManageScheduleEntries = async (user, schedule) => {
	if (!user || !schedule) return false
	const isAdmin = user.roles && user.roles.includes('Admin')
	const isHR = user.roles && user.roles.includes('HR')
	if (isAdmin || isHR) {
		return user.teamId.toString() === schedule.teamId.toString()
	}

	const isCreator =
		schedule.type === 'custom' &&
		schedule.createdBy &&
		schedule.createdBy.toString() === user._id.toString()
	if (isCreator) {
		return user.teamId.toString() === schedule.teamId.toString()
	}

	return canSupervisorManageSchedule(user, schedule)
}

// Helper function to create schedule for department
exports.createScheduleForDepartment = async (teamId, departmentName) => {
	try {
		const scheduleName = `${departmentName} - Grafik`
		// Find schedule regardless of isActive status - we'll reactivate if needed
		const existingSchedule = await Schedule.findOne({ 
			teamId, 
			name: scheduleName,
			type: 'department'
		})
		
		if (!existingSchedule) {
			const newSchedule = new Schedule({
				name: scheduleName,
				teamId,
				type: 'department',
				departmentName,
				days: []
			})
			await newSchedule.save()
			return newSchedule
		}
		
		// If schedule exists but is inactive, reactivate it
		if (!existingSchedule.isActive) {
			existingSchedule.isActive = true
			await existingSchedule.save()
		}
		
		return existingSchedule
	} catch (error) {
		console.error('Error creating schedule for department:', error)
		throw error
	}
}

// Helper function to create team schedule
exports.createTeamSchedule = async (teamId) => {
	try {
		const team = await Team.findById(teamId)
		if (!team) {
			throw new Error('Team not found')
		}
		
		const scheduleName = `${team.name} - Grafik`
		const existingSchedule = await Schedule.findOne({ 
			teamId, 
			type: 'team',
			isActive: true
		})
		
		if (!existingSchedule) {
			const newSchedule = new Schedule({
				name: scheduleName,
				teamId,
				type: 'team',
				days: []
			})
			await newSchedule.save()
			return newSchedule
		}
		
		// Update name if team name changed
		if (existingSchedule.name !== scheduleName) {
			existingSchedule.name = scheduleName
			await existingSchedule.save()
		}
		
		return existingSchedule
	} catch (error) {
		console.error('Error creating team schedule:', error)
		throw error
	}
}

// Get user's schedules
exports.getUserSchedules = async (req, res) => {
	try {
		const userId = req.user.userId
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const teamId = user.teamId
		if (!teamId) {
			return res.json([])
		}

		// Check if user is Admin or HR
		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')

		// If Admin or HR, return all schedules from the team
		if (isAdmin || isHR) {
			const allSchedules = await Schedule.find({
				teamId,
				isActive: true
			}).sort({ type: 1, name: 1 })
			return res.json(allSchedules)
		}

		// Get user's departments to filter department schedules
		const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
		
		// Build query - always include team schedule
		const query = {
			teamId,
			isActive: true,
			$or: [
				{ type: 'team' }
			]
		}
		
		// Only include department schedules where user belongs to that department
		if (userDepartments.length > 0) {
			query.$or.push({
				type: 'department',
				departmentName: { $in: userDepartments }
			})
		}
		
		// Include custom schedules where user is a member
		query.$or.push({
			type: 'custom',
			members: userId
		})
		
		const schedules = await Schedule.find(query).sort({ type: 1, name: 1 })
		
		// Filter schedules to ensure proper access
		const filteredSchedules = schedules.filter(schedule => {
			if (schedule.type === 'team') {
				return true
			}
			if (schedule.type === 'department') {
				return userDepartments.includes(schedule.departmentName)
			}
			if (schedule.type === 'custom') {
				// Check if user is in members array
				return schedule.members && schedule.members.some(memberId => memberId.toString() === userId.toString())
			}
			return false
		})
		
		res.json(filteredSchedules)
	} catch (error) {
		console.error('Error getting user schedules:', error)
		res.status(500).json({ message: 'Error getting schedules' })
	}
}

// Get schedule by ID
exports.getSchedule = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const userId = req.user.userId

		const schedule = await Schedule.findById(scheduleId)
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// HIERARCHIA RÓL: Admin > HR > Przełożony > Pracownik
		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')
		
		// Admin i HR mają dostęp do wszystkich grafików w zespole
		if (isAdmin || isHR) {
			// Sprawdź tylko czy grafik jest z tego samego zespołu
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else {
			// Dla pozostałych użytkowników sprawdź dostęp zgodnie z typem grafiku
			if (schedule.type === 'team') {
				// All team members have access to team schedule
				if (user.teamId.toString() !== schedule.teamId.toString()) {
					return res.status(403).json({ message: 'Access denied' })
				}
			} else if (schedule.type === 'department') {
				// Only users from that department have access
				const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
				if (!userDepartments.includes(schedule.departmentName)) {
					return res.status(403).json({ message: 'Access denied' })
				}
			} else if (schedule.type === 'custom') {
				// Only members of custom schedule have access
				const isMember = schedule.members && schedule.members.some(memberId => memberId.toString() === userId.toString())
				if (!isMember) {
					return res.status(403).json({ message: 'Access denied' })
				}
			}
		}

		res.json(schedule)
	} catch (error) {
		console.error('Error getting schedule:', error)
		res.status(500).json({ message: 'Error getting schedule' })
	}
}

// Get schedule entries for a specific month
exports.getScheduleEntries = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { month, year } = req.query
		
		const schedule = await Schedule.findById(scheduleId)
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const userId = req.user.userId
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		if (!canAccessSchedule(schedule, user)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Filter days for the specified month and year
		const targetMonth = parseInt(month)
		const targetYear = parseInt(year)
		
		let filteredDays = schedule.days.filter(day => {
			const dayDate = new Date(day.date)
			return dayDate.getMonth() === targetMonth && dayDate.getFullYear() === targetYear
		})

		const canViewDraftEntries = await canManageScheduleEntries(user, schedule)
		if (!canViewDraftEntries) {
			filteredDays = filteredDays.map((day) => ({
				...day.toObject(),
				entries: (day.entries || []).filter((entry) => entry.isPublished !== false)
			}))
		}

		res.json(filteredDays)
	} catch (error) {
		console.error('Error getting schedule entries:', error)
		res.status(500).json({ message: 'Error getting schedule entries' })
	}
}

// Declare employee availability for one or multiple days
exports.upsertAvailability = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { dates, notes, timeWindows } = req.body
		const userId = req.user.userId

		if (!Array.isArray(dates) || dates.length === 0) {
			return res.status(400).json({ message: 'At least one date is required' })
		}

		const validDates = dates
			.filter(Boolean)
			.map(dateValue => {
				const date = parseDateInput(dateValue)
				if (Number.isNaN(date.getTime())) return null
				date.setHours(0, 0, 0, 0)
				return date
			})
			.filter(Boolean)

		if (validDates.length === 0) {
			return res.status(400).json({ message: 'No valid dates provided' })
		}

		const normalizedTimeWindows = normalizeAvailabilityWindows(timeWindows)
		if (normalizedTimeWindows === null) {
			return res.status(400).json({ message: 'Invalid availability time windows' })
		}

		const [schedule, user] = await Promise.all([
			Schedule.findById(scheduleId),
			User.findById(userId).select('_id teamId firstName lastName username roles department')
		])

		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		if (!canAccessSchedule(schedule, user)) {
			return res.status(403).json({ message: 'Access denied' })
		}
		if (!schedule.availabilityEnabled) {
			return res.status(400).json({ message: 'Availability is disabled for this schedule' })
		}

		const settings = await Settings.getSettings(schedule.teamId)
		const workOnWeekends = settings?.workOnWeekends !== false
		if (!workOnWeekends && validDates.some((entryDate) => isWeekendDate(entryDate))) {
			return res.status(400).json({ message: 'Cannot declare availability on weekends because team does not work on weekends.' })
		}
		const trackHolidays = settings?.includePolishHolidays === true || settings?.includeCustomHolidays === true
		if (trackHolidays && validDates.some((entryDate) => isHoliday(entryDate, settings))) {
			return res.status(400).json({ message: 'Cannot declare availability on team holidays.' })
		}

		const employeeName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Pracownik'
		const cleanNotes = typeof notes === 'string' ? notes.trim().slice(0, 500) : ''
		const now = new Date()

		validDates.forEach((entryDate) => {
			const dayIndex = schedule.days.findIndex((day) => {
				const dayDate = new Date(day.date)
				dayDate.setHours(0, 0, 0, 0)
				return dayDate.getTime() === entryDate.getTime()
			})

			if (dayIndex === -1) {
				schedule.days.push({
					date: entryDate,
					availabilities: [{
						employeeId: user._id,
						employeeName,
						notes: cleanNotes,
						timeWindows: normalizedTimeWindows,
						declaredAt: now,
						updatedAt: now
					}],
					entries: []
				})
				return
			}

			if (!Array.isArray(schedule.days[dayIndex].availabilities)) {
				schedule.days[dayIndex].availabilities = []
			}

			const availabilityIndex = schedule.days[dayIndex].availabilities.findIndex(
				(availability) => availability.employeeId.toString() === user._id.toString()
			)

			if (availabilityIndex === -1) {
				schedule.days[dayIndex].availabilities.push({
					employeeId: user._id,
					employeeName,
					notes: cleanNotes,
					timeWindows: normalizedTimeWindows,
					declaredAt: now,
					updatedAt: now
				})
			} else {
				schedule.days[dayIndex].availabilities[availabilityIndex].employeeName = employeeName
				schedule.days[dayIndex].availabilities[availabilityIndex].notes = cleanNotes
				schedule.days[dayIndex].availabilities[availabilityIndex].timeWindows = normalizedTimeWindows
				schedule.days[dayIndex].availabilities[availabilityIndex].updatedAt = now
			}
		})

		await schedule.save()
		emitScheduleUpdated(req, {
			teamId: schedule.teamId,
			scheduleId: schedule._id,
			action: 'availability-updated'
		})

		res.json({ message: 'Availability saved successfully' })
	} catch (error) {
		console.error('Error upserting availability:', error)
		res.status(500).json({ message: 'Error saving availability' })
	}
}

exports.deleteAvailability = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { date } = req.query
		const userId = req.user.userId

		if (!date) {
			return res.status(400).json({ message: 'Date is required' })
		}

		const targetDate = parseDateInput(date)
		if (Number.isNaN(targetDate.getTime())) {
			return res.status(400).json({ message: 'Invalid date' })
		}
		targetDate.setHours(0, 0, 0, 0)

		const [schedule, user] = await Promise.all([
			Schedule.findById(scheduleId),
			User.findById(userId).select('_id teamId roles department')
		])

		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		if (!canAccessSchedule(schedule, user)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		const dayIndex = schedule.days.findIndex((day) => {
			const dayDate = new Date(day.date)
			dayDate.setHours(0, 0, 0, 0)
			return dayDate.getTime() === targetDate.getTime()
		})

		if (dayIndex === -1 || !Array.isArray(schedule.days[dayIndex].availabilities)) {
			return res.status(404).json({ message: 'Availability not found' })
		}

		const beforeCount = schedule.days[dayIndex].availabilities.length
		schedule.days[dayIndex].availabilities = schedule.days[dayIndex].availabilities.filter(
			(availability) => availability.employeeId.toString() !== user._id.toString()
		)

		if (beforeCount === schedule.days[dayIndex].availabilities.length) {
			return res.status(404).json({ message: 'Availability not found' })
		}

		if (
			schedule.days[dayIndex].entries.length === 0 &&
			schedule.days[dayIndex].availabilities.length === 0
		) {
			schedule.days.splice(dayIndex, 1)
		}

		await schedule.save()
		emitScheduleUpdated(req, {
			teamId: schedule.teamId,
			scheduleId: schedule._id,
			action: 'availability-removed'
		})
		res.json({ message: 'Availability removed successfully' })
	} catch (error) {
		console.error('Error deleting availability:', error)
		res.status(500).json({ message: 'Error removing availability' })
	}
}

// Add or update schedule entry for a specific date
exports.upsertScheduleEntry = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { date, timeFrom, timeTo, employeeId, employeeName, notes } = req.body

		if (!date || !timeFrom || !timeTo || !employeeId || !employeeName) {
			return res.status(400).json({ message: 'Missing required fields' })
		}

		// Validate time format
		const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
		if (!timeRegex.test(timeFrom) || !timeRegex.test(timeTo)) {
			return res.status(400).json({ message: 'Invalid time format. Use HH:mm format' })
		}

		const userId = req.user.userId
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Check permissions
		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')
		const schedule = await Schedule.findById(scheduleId)
		
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const settings = await Settings.getSettings(schedule.teamId)
		const workOnWeekends = settings?.workOnWeekends !== false
		if (!workOnWeekends && isWeekendDate(date)) {
			return res.status(400).json({ message: 'Cannot add schedule entries on weekends because team does not work on weekends.' })
		}
		const trackHolidays = settings?.includePolishHolidays === true || settings?.includeCustomHolidays === true
		if (trackHolidays && isHoliday(date, settings)) {
			return res.status(400).json({ message: 'Cannot add schedule entries on team holidays.' })
		}

		// Sprawdź czy użytkownik jest twórcą niestandardowego grafiku
		const isCreator = schedule.type === 'custom' && schedule.createdBy && schedule.createdBy.toString() === userId.toString()
		
		// HIERARCHIA RÓL: Admin > HR > Przełożony > Twórca niestandardowego grafiku
		// Admin i HR mają dostęp do wszystkich grafików w zespole
		if (isAdmin || isHR) {
			// Sprawdź tylko czy grafik jest z tego samego zespołu
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (isCreator) {
			// Twórca niestandardowego grafiku ma zawsze dostęp do swojego grafiku
			// Sprawdź tylko czy grafik jest z tego samego zespołu
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else {
			// Dla przełożonego sprawdź uprawnienia przez canSupervisorManageSchedule
			const canManage = await canSupervisorManageSchedule(user, schedule)
			if (!canManage) {
				return res.status(403).json({ message: 'Access denied. Only Admin, HR, supervisor with proper permissions, or schedule creator can edit schedule.' })
			}
			
			// Dodatkowe sprawdzenie dostępu zgodnie z typem grafiku
			if (schedule.type === 'department') {
				const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
				if (!userDepartments.includes(schedule.departmentName)) {
					return res.status(403).json({ message: 'Access denied' })
				}
			} else if (schedule.type === 'custom') {
				const isMember = schedule.members && schedule.members.some(memberId => memberId.toString() === userId.toString())
				if (!isMember) {
					return res.status(403).json({ message: 'Access denied' })
				}
			}
		}

		// Validate that employee exists and is in the same team/department
		const employee = await User.findById(employeeId)
		if (!employee) {
			return res.status(404).json({ message: 'Employee not found' })
		}

		if (employee.teamId.toString() !== schedule.teamId.toString()) {
			return res.status(400).json({ message: 'Employee must be in the same team' })
		}

		if (schedule.type === 'department') {
			const employeeDepartments = Array.isArray(employee.department) ? employee.department : (employee.department ? [employee.department] : [])
			if (!employeeDepartments.includes(schedule.departmentName)) {
				return res.status(400).json({ message: 'Employee must be in the same department' })
			}
		} else if (schedule.type === 'custom') {
			// For custom schedules, employee must be a member
			const isMember = schedule.members && schedule.members.some(memberId => memberId.toString() === employeeId.toString())
			if (!isMember) {
				return res.status(400).json({ message: 'Employee must be a member of this schedule' })
			}
		}

		// Find or create day entry
		const entryDate = new Date(date)
		entryDate.setHours(0, 0, 0, 0)
		
		let dayIndex = schedule.days.findIndex(day => {
			const dayDate = new Date(day.date)
			dayDate.setHours(0, 0, 0, 0)
			return dayDate.getTime() === entryDate.getTime()
		})

		const newEntry = {
			employeeId: employeeId,
			employeeName: employeeName,
			timeFrom: timeFrom,
			timeTo: timeTo,
			createdBy: userId,
			notes: notes || null,
			isPublished: true,
			autoGenerated: false
		}

		if (dayIndex === -1) {
			// Create new day entry
			schedule.days.push({
				date: entryDate,
				availabilities: [],
				entries: [newEntry]
			})
		} else {
			// Add entry to existing day
			schedule.days[dayIndex].entries.push(newEntry)
		}

		await schedule.save()

		// Manual entries are saved as already published, so notify the affected user immediately.
		if (employeeId) {
			const entryDateObj = new Date(date)
			const notifyYear = Number.isNaN(entryDateObj.getTime()) ? new Date().getFullYear() : entryDateObj.getFullYear()
			const notifyMonth = Number.isNaN(entryDateObj.getTime()) ? new Date().getMonth() + 1 : entryDateObj.getMonth() + 1
			const recipientUserIds = [String(employeeId)]

			sendSchedulePublishedPushNotification({
				schedule,
				recipientUserIds,
				year: notifyYear,
				month: notifyMonth,
				t: req.t,
			}).catch((error) => {
				console.error('Error sending manual schedule entry push notification:', error)
			})

			sendSchedulePublishedEmailNotification({
				schedule,
				recipientUserIds,
				year: notifyYear,
				month: notifyMonth,
				t: req.t,
			}).catch((error) => {
				console.error('Error sending manual schedule entry email notification:', error)
			})
		}
		
		res.json({ message: 'Schedule entry added successfully', schedule })
	} catch (error) {
		console.error('Error upserting schedule entry:', error)
		res.status(500).json({ message: 'Error adding schedule entry' })
	}
}

exports.autoGenerateMonthEntries = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const {
			year,
			month,
			timeFrom,
			timeTo,
			minEmployeesPerDay,
			shifts = [],
			dayOverrides = [],
			manualExclusions = [],
			allowMultipleShiftsPerDay = false,
			notes,
			preferAvailability = true,
			strictAvailability = false,
		} = req.body

		const hasStructuredShifts = Array.isArray(shifts) && shifts.length > 0
		if (!year || !month || (!hasStructuredShifts && (!timeFrom || !timeTo || !minEmployeesPerDay))) {
			return res.status(400).json({ message: 'Missing required fields for auto-generation' })
		}

		const parsedYear = Number(year)
		const parsedMonth = Number(month)
		const parsedMinEmployees = hasStructuredShifts ? 1 : Number(minEmployeesPerDay)
		if (
			Number.isNaN(parsedYear) ||
			Number.isNaN(parsedMonth) ||
			(!hasStructuredShifts && Number.isNaN(parsedMinEmployees)) ||
			parsedMonth < 1 ||
			parsedMonth > 12 ||
			parsedMinEmployees < 1
		) {
			return res.status(400).json({ message: 'Invalid auto-generation parameters' })
		}

		const userId = req.user.userId
		const [user, schedule] = await Promise.all([
			User.findById(userId),
			Schedule.findById(scheduleId)
		])

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')
		const isCreator = schedule.type === 'custom' && schedule.createdBy && schedule.createdBy.toString() === userId.toString()

		if (isAdmin || isHR) {
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (isCreator) {
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else {
			const canManage = await canSupervisorManageSchedule(user, schedule)
			if (!canManage) {
				return res.status(403).json({ message: 'Access denied. You do not have permission to auto-generate this schedule.' })
			}
		}

		const settings = await Settings.getSettings(schedule.teamId)
		const workOnWeekends = settings?.workOnWeekends !== false
		const summary = await autoGenerateScheduleMonth({
			schedule,
			currentUserId: userId,
			year: parsedYear,
			month: parsedMonth,
			timeFrom,
			timeTo,
			minEmployeesPerDay: parsedMinEmployees,
			shifts,
			dayOverrides,
			manualExclusions,
			allowMultipleShiftsPerDay: Boolean(allowMultipleShiftsPerDay),
			notes: typeof notes === 'string' ? notes.trim().slice(0, 500) : '',
			preferAvailability: Boolean(preferAvailability),
			strictAvailability: Boolean(strictAvailability),
			workOnWeekends,
			teamSettings: settings
		})

		await schedule.save()
		emitScheduleUpdated(req, {
			teamId: schedule.teamId,
			scheduleId: schedule._id,
			action: 'auto-generated'
		})

		return res.json({
			message: 'Schedule auto-generation completed. Generated entries are saved as draft until published.',
			summary
		})
	} catch (error) {
		console.error('Error auto-generating schedule month:', error)
		return res.status(500).json({ message: 'Error auto-generating schedule month' })
	}
}

exports.publishMonthDraftEntries = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { year, month } = req.body
		const parsedYear = Number(year)
		const parsedMonth = Number(month)
		if (
			Number.isNaN(parsedYear) ||
			Number.isNaN(parsedMonth) ||
			parsedMonth < 1 ||
			parsedMonth > 12
		) {
			return res.status(400).json({ message: 'Invalid month or year' })
		}

		const userId = req.user.userId
		const [user, schedule] = await Promise.all([
			User.findById(userId),
			Schedule.findById(scheduleId)
		])

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const canManage = await canManageScheduleEntries(user, schedule)
		if (!canManage) {
			return res.status(403).json({ message: 'Access denied. You do not have permission to publish draft entries.' })
		}

		const monthPrefix = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}`
		let publishedEntries = 0
		let touchedDays = 0
		const affectedEmployeeIds = new Set()

		for (const day of schedule.days) {
			const dayDate = new Date(day.date)
			const dayKey = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`
			if (!dayKey.startsWith(monthPrefix)) continue
			let dayUpdated = false
			for (const entry of day.entries || []) {
				if (entry.isPublished === false) {
					entry.isPublished = true
					publishedEntries += 1
					dayUpdated = true
					if (entry.employeeId) {
						affectedEmployeeIds.add(entry.employeeId.toString())
					}
				}
			}
			if (dayUpdated) touchedDays += 1
		}

		await schedule.save()

		const recipientUserIds = Array.from(affectedEmployeeIds)
		if (recipientUserIds.length > 0) {
			sendSchedulePublishedPushNotification({
				schedule,
				recipientUserIds,
				year: parsedYear,
				month: parsedMonth,
				t: req.t,
			}).catch((error) => {
				console.error('Error sending schedule published push notifications:', error)
			})
			sendSchedulePublishedEmailNotification({
				schedule,
				recipientUserIds,
				year: parsedYear,
				month: parsedMonth,
				t: req.t,
			}).catch((error) => {
				console.error('Error sending schedule published email notifications:', error)
			})
		}

		emitScheduleUpdated(req, {
			teamId: schedule.teamId,
			scheduleId: schedule._id,
			action: 'month-published'
		})

		return res.json({
			message: 'Draft schedule entries published successfully',
			summary: {
				publishedEntries,
				touchedDays,
				year: parsedYear,
				month: parsedMonth
			}
		})
	} catch (error) {
		console.error('Error publishing schedule month draft entries:', error)
		return res.status(500).json({ message: 'Error publishing schedule month draft entries' })
	}
}

exports.clearMonthEntries = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { year, month } = req.body
		const parsedYear = Number(year)
		const parsedMonth = Number(month)
		if (
			Number.isNaN(parsedYear) ||
			Number.isNaN(parsedMonth) ||
			parsedMonth < 1 ||
			parsedMonth > 12
		) {
			return res.status(400).json({ message: 'Invalid month or year' })
		}

		const userId = req.user.userId
		const [user, schedule] = await Promise.all([
			User.findById(userId),
			Schedule.findById(scheduleId)
		])

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')
		const isCreator = schedule.type === 'custom' && schedule.createdBy && schedule.createdBy.toString() === userId.toString()

		if (isAdmin || isHR) {
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (isCreator) {
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else {
			const canManage = await canSupervisorManageSchedule(user, schedule)
			if (!canManage) {
				return res.status(403).json({ message: 'Access denied. You do not have permission to clear this schedule month.' })
			}
		}

		const monthPrefix = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}`
		let removedEntries = 0
		let touchedDays = 0

		schedule.days = schedule.days
			.map((day) => {
				const dayKey = (() => {
					const dayDate = new Date(day.date)
					const y = dayDate.getFullYear()
					const m = String(dayDate.getMonth() + 1).padStart(2, '0')
					const d = String(dayDate.getDate()).padStart(2, '0')
					return `${y}-${m}-${d}`
				})()

				if (!dayKey.startsWith(monthPrefix)) return day

				const before = Array.isArray(day.entries) ? day.entries.length : 0
				removedEntries += before
				if (before > 0) touchedDays += 1
				return {
					...day.toObject(),
					entries: []
				}
			})
			.filter((day) => {
				const hasEntries = Array.isArray(day.entries) && day.entries.length > 0
				const hasAvailabilities = Array.isArray(day.availabilities) && day.availabilities.length > 0
				return hasEntries || hasAvailabilities
			})

		await schedule.save()
		emitScheduleUpdated(req, {
			teamId: schedule.teamId,
			scheduleId: schedule._id,
			action: 'month-cleared'
		})

		return res.json({
			message: 'Schedule month entries cleared successfully',
			summary: {
				removedEntries,
				touchedDays,
				year: parsedYear,
				month: parsedMonth
			}
		})
	} catch (error) {
		console.error('Error clearing schedule month entries:', error)
		return res.status(500).json({ message: 'Error clearing schedule month entries' })
	}
}

// Delete schedule entry
exports.deleteScheduleEntry = async (req, res) => {
	try {
		const { scheduleId, entryId } = req.params

		const userId = req.user.userId
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Check permissions
		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')
		const schedule = await Schedule.findById(scheduleId)
		
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		// Sprawdź czy użytkownik jest twórcą niestandardowego grafiku
		const isCreator = schedule.type === 'custom' && schedule.createdBy && schedule.createdBy.toString() === userId.toString()
		
		// HIERARCHIA RÓL: Admin > HR > Przełożony > Twórca niestandardowego grafiku
		// Admin i HR mają dostęp do wszystkich grafików w zespole
		if (isAdmin || isHR) {
			// Sprawdź tylko czy grafik jest z tego samego zespołu
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (isCreator) {
			// Twórca niestandardowego grafiku ma zawsze dostęp do swojego grafiku
			// Sprawdź tylko czy grafik jest z tego samego zespołu
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else {
			// Dla przełożonego sprawdź uprawnienia przez canSupervisorManageSchedule
			const canManage = await canSupervisorManageSchedule(user, schedule)
			if (!canManage) {
				return res.status(403).json({ message: 'Access denied. Only Admin, HR, supervisor with proper permissions, or schedule creator can delete schedule entries.' })
			}
			
			// Dodatkowe sprawdzenie dostępu zgodnie z typem grafiku
			if (schedule.type === 'department') {
				const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
				if (!userDepartments.includes(schedule.departmentName)) {
					return res.status(403).json({ message: 'Access denied' })
				}
			} else if (schedule.type === 'custom') {
				const isMember = schedule.members && schedule.members.some(memberId => memberId.toString() === userId.toString())
				if (!isMember) {
					return res.status(403).json({ message: 'Access denied' })
				}
			}
		}

		// Find and remove the entry
		let entryFound = false
		for (let i = 0; i < schedule.days.length; i++) {
			const day = schedule.days[i]
			const entryIndex = day.entries.findIndex(entry => entry._id.toString() === entryId)
			if (entryIndex !== -1) {
				day.entries.splice(entryIndex, 1)
				entryFound = true
				
				// Remove day only when both entries and availabilities are empty
				if (day.entries.length === 0 && (!Array.isArray(day.availabilities) || day.availabilities.length === 0)) {
					schedule.days.splice(i, 1)
				}
				break
			}
		}

		if (!entryFound) {
			return res.status(404).json({ message: 'Entry not found' })
		}

		await schedule.save()
		
		res.json({ message: 'Schedule entry deleted successfully', schedule })
	} catch (error) {
		console.error('Error deleting schedule entry:', error)
		res.status(500).json({ message: 'Error deleting schedule entry' })
	}
}

// Get users for a schedule
exports.getScheduleUsers = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const userId = req.user.userId

		const schedule = await Schedule.findById(scheduleId)
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// HIERARCHIA RÓL: Admin > HR > Przełożony
		const isAdmin = user.roles && user.roles.includes('Admin')
		const isHR = user.roles && user.roles.includes('HR')
		
		// Check access
		if (schedule.type === 'team') {
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
			// For team schedules, get all team users
			const users = await User.find({ 
				teamId: schedule.teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			})
				.select('firstName lastName username position')
				.sort({ firstName: 1, lastName: 1 })
			return res.json(users)
		} else if (schedule.type === 'department') {
			const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
			if (!userDepartments.includes(schedule.departmentName)) {
				// Admin i HR mają dostęp do wszystkich grafików w zespole
				if (!isAdmin && !isHR) {
					return res.status(403).json({ message: 'Access denied' })
				}
			}
			// For department schedules, get users from that department
			// Get all team users first, then filter by department (handles both array and string department fields)
			const allTeamUsers = await User.find({ 
				teamId: schedule.teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			})
				.select('firstName lastName username position department')
				.lean()
			
			// Filter users to ensure they actually belong to the department
			const filteredUsers = allTeamUsers
				.filter(user => {
					const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
					return userDepartments.includes(schedule.departmentName)
				})
				.map(user => ({
					_id: user._id,
					firstName: user.firstName,
					lastName: user.lastName,
					username: user.username,
					position: user.position
				}))
				.sort((a, b) => {
					const nameA = `${a.firstName} ${a.lastName}`.toLowerCase()
					const nameB = `${b.firstName} ${b.lastName}`.toLowerCase()
					return nameA.localeCompare(nameB)
				})
			
			return res.json(filteredUsers)
		} else if (schedule.type === 'custom') {
			// For custom schedules, get users from members array
			const memberUsers = await User.find({
				_id: { $in: schedule.members || [] },
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			})
				.select('firstName lastName username position')
				.sort({ firstName: 1, lastName: 1 })
			return res.json(memberUsers)
		}

		return res.status(400).json({ message: 'Invalid schedule type' })
	} catch (error) {
		console.error('Error getting schedule users:', error)
		res.status(500).json({ message: 'Error getting schedule users' })
	}
}

// Create custom schedule
exports.createSchedule = async (req, res) => {
	try {
		const { name, memberIds, availabilityEnabled } = req.body
		const userId = req.user.userId
		const user = await User.findById(userId)
		
		if (!user || !user.teamId) {
			return res.status(400).json({ message: 'User team not found' })
		}

		if (!name || !name.trim()) {
			return res.status(400).json({ message: 'Schedule name is required' })
		}

		const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? [user.roles] : [])
		const isAdmin = roles.includes('Admin')
		const isHR = roles.includes('HR')
		let canCreateCustomSchedule = isAdmin || isHR

		if (!canCreateCustomSchedule && roles.includes('Przełożony (Supervisor)')) {
			canCreateCustomSchedule = await canSupervisorManageSchedule(user)
		}

		if (!canCreateCustomSchedule) {
			return res.status(403).json({ message: 'Access denied. Only Admin, HR or authorized supervisor can create schedule.' })
		}

		// Ensure creator is included in members
		const members = memberIds && Array.isArray(memberIds) ? [...memberIds] : []
		if (!members.includes(userId)) {
			members.push(userId)
		}

		// Verify all members are from the same team (only active users)
		const membersUsers = await User.find({ 
			_id: { $in: members },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
			teamId: user.teamId 
		})
		
		if (membersUsers.length !== members.length) {
			return res.status(400).json({ message: 'All members must be from the same team' })
		}

		const newSchedule = new Schedule({
			name: name.trim(),
			teamId: user.teamId,
			type: 'custom',
			availabilityEnabled: !!availabilityEnabled,
			members: members,
			createdBy: userId,
			days: []
		})
		
		await newSchedule.save()
		res.json(newSchedule)
	} catch (error) {
		console.error('Error creating schedule:', error)
		res.status(500).json({ message: 'Error creating schedule' })
	}
}

// Update custom schedule
exports.updateSchedule = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { name, memberIds } = req.body
		const userId = req.user.userId

		const schedule = await Schedule.findById(scheduleId)
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		// Check permissions: only Admin or creator can update
		const isAdmin = req.user.roles && req.user.roles.includes('Admin')
		const isCreator = schedule.createdBy && schedule.createdBy.toString() === userId

		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or schedule creator can update schedule' })
		}

		// Don't allow updating team or department schedules
		if (schedule.type !== 'custom') {
			return res.status(403).json({ message: 'Only custom schedules can be modified' })
		}

		if (name && name.trim()) {
			schedule.name = name.trim()
		}

		if (memberIds && Array.isArray(memberIds)) {
			// Ensure creator is included in members
			const members = [...memberIds]
			if (!members.includes(userId)) {
				members.push(userId)
			}

			// Verify all members are from the same team
			const user = await User.findById(userId)
			const membersUsers = await User.find({ 
				_id: { $in: members },
				teamId: user.teamId 
			})
			
			if (membersUsers.length !== members.length) {
				return res.status(400).json({ message: 'All members must be from the same team' })
			}

			schedule.members = members
		}

		await schedule.save()
		res.json(schedule)
	} catch (error) {
		console.error('Error updating schedule:', error)
		res.status(500).json({ message: 'Error updating schedule' })
	}
}

// Delete custom schedule
exports.deleteSchedule = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const userId = req.user.userId

		const schedule = await Schedule.findById(scheduleId)
		if (!schedule) {
			return res.status(404).json({ message: 'Schedule not found' })
		}

		// Check permissions: only Admin or creator can delete
		const isAdmin = req.user.roles && req.user.roles.includes('Admin')
		const isCreator = schedule.createdBy && schedule.createdBy.toString() === userId

		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or schedule creator can delete schedule' })
		}

		// Don't allow deleting team or department schedules
		if (schedule.type !== 'custom') {
			return res.status(403).json({ message: 'Only custom schedules can be deleted' })
		}

		// Soft delete: mark as inactive
		schedule.isActive = false
		await schedule.save()

		res.json({ message: 'Schedule deleted successfully' })
	} catch (error) {
		console.error('Error deleting schedule:', error)
		res.status(500).json({ message: 'Error deleting schedule' })
	}
}

/**
 * POST body: { messages, year, month, locale } — conversational draft for auto-fill month (preview; confirm → POST .../auto-generate).
 */
exports.aiScheduleAutoDraft = async (req, res) => {
	try {
		const { scheduleId } = req.params
		const { messages, year, month, locale } = req.body || {}
		await entitlementsService.assertAiMessageAllowedForUser(req.user.userId)
		const result = await runScheduleAutoDraftTurn({
			userId: req.user.userId,
			scheduleId,
			year: Number(year),
			month: Number(month),
			messages,
			locale,
		})
		await entitlementsService.consumeAiMessageForUser(req.user.userId)
		const schedDoc = await Schedule.findById(scheduleId).select('name').lean()
		const schedLabel = schedDoc?.name || String(scheduleId)
		const who = req.user?.username || '—'
		await createLog(
			req.user.userId,
			'AI_SCHEDULE_AUTO_DRAFT',
			`Asystent AI — szkic grafiku „${schedLabel}” · ${who}`,
			req.user.userId
		)
		res.json({
			reply: result.reply,
			draft: result.draft,
			draftError: result.draftError,
			model: result.model,
			usage: result.usage,
		})
	} catch (err) {
		if (err.code === 'AI_QUOTA_EXCEEDED' || err.code === 'AI_DISABLED_NO_SUBSCRIPTION') {
			return res.status(403).json({ message: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_NOT_CONFIGURED') {
			console.error('scheduleController.aiScheduleAutoDraft OPENAI_NOT_CONFIGURED:', err.message)
			return res.status(503).json({ message: getClientSafeMessage(err), code: err.code })
		}
		if (err.code === 'VALIDATION' || err.code === 'USER_INVALID' || err.code === 'NOT_FOUND') {
			return res.status(400).json({ message: err.message, code: err.code })
		}
		if (err.code === 'FORBIDDEN') {
			return res.status(403).json({ message: err.message, code: err.code })
		}
		if (err.code === 'OPENAI_HTTP_ERROR') {
			return res.status(502).json({
				message: getClientSafeMessage(err),
				code: err.code,
				status: err.status,
			})
		}
		console.error('scheduleController.aiScheduleAutoDraft:', err)
		res.status(500).json({ message: 'AI schedule draft failed' })
	}
}


