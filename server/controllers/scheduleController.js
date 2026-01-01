const { firmDb } = require('../db/db')
const Schedule = require('../models/Schedule')(firmDb)
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)

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

		// Check access (same as getSchedule)
		if (schedule.type === 'team') {
			if (user.teamId.toString() !== schedule.teamId.toString()) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (schedule.type === 'department') {
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

		// Filter days for the specified month and year
		const targetMonth = parseInt(month)
		const targetYear = parseInt(year)
		
		const filteredDays = schedule.days.filter(day => {
			const dayDate = new Date(day.date)
			return dayDate.getMonth() === targetMonth && dayDate.getFullYear() === targetYear
		})

		res.json(filteredDays)
	} catch (error) {
		console.error('Error getting schedule entries:', error)
		res.status(500).json({ message: 'Error getting schedule entries' })
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
		const { canSupervisorManageSchedule } = require('../services/roleService')
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
			notes: notes || null
		}

		if (dayIndex === -1) {
			// Create new day entry
			schedule.days.push({
				date: entryDate,
				entries: [newEntry]
			})
		} else {
			// Add entry to existing day
			schedule.days[dayIndex].entries.push(newEntry)
		}

		await schedule.save()
		
		res.json({ message: 'Schedule entry added successfully', schedule })
	} catch (error) {
		console.error('Error upserting schedule entry:', error)
		res.status(500).json({ message: 'Error adding schedule entry' })
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
			const { canSupervisorManageSchedule } = require('../services/roleService')
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
				
				// Remove day if no entries left
				if (day.entries.length === 0) {
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
			const users = await User.find({ teamId: schedule.teamId })
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
			const allTeamUsers = await User.find({ teamId: schedule.teamId })
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
				_id: { $in: schedule.members || [] }
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
		const { name, memberIds } = req.body
		const userId = req.user.userId
		const user = await User.findById(userId)
		
		if (!user || !user.teamId) {
			return res.status(400).json({ message: 'User team not found' })
		}

		if (!name || !name.trim()) {
			return res.status(400).json({ message: 'Schedule name is required' })
		}

		// Ensure creator is included in members
		const members = memberIds && Array.isArray(memberIds) ? [...memberIds] : []
		if (!members.includes(userId)) {
			members.push(userId)
		}

		// Verify all members are from the same team
		const membersUsers = await User.find({ 
			_id: { $in: members },
			teamId: user.teamId 
		})
		
		if (membersUsers.length !== members.length) {
			return res.status(400).json({ message: 'All members must be from the same team' })
		}

		const newSchedule = new Schedule({
			name: name.trim(),
			teamId: user.teamId,
			type: 'custom',
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



