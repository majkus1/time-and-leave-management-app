const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const Board = require('../models/Board')(firmDb)
const Schedule = require('../models/Schedule')(firmDb)
const Department = require('../models/Department')(firmDb)
const Channel = require('../models/Channel')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const LeavePlan = require('../models/LeavePlan')(firmDb)
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
const Log = require('../models/log')(firmDb)
const Message = require('../models/Message')(firmDb)

/**
 * Soft delete a team and all related resources
 * Data will be stored for 30 days retention period before permanent deletion
 * @param {string} teamId - Team ID to delete
 * @returns {Promise<{success: boolean, message: string}>}
 * @throws {Error} If team not found or deletion fails
 */
exports.softDeleteTeam = async (teamId) => {
	const team = await Team.findById(teamId)
	if (!team) {
		throw new Error('Zespół nie został znaleziony')
	}

	const deletedAt = new Date()

	// Soft delete all users in the team
	await User.updateMany(
		{ teamId, $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
		{ isActive: false, deletedAt }
	)

	// Soft delete team resources (boards, schedules, departments, channels, supervisor configs)
	// Note: Workday, LeaveRequest, LeavePlan, CalendarConfirmation, Log, Message are historical
	// and will remain in database - they will be deleted by cleanup job after 30 days
	await Promise.all([
		Board.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
		Schedule.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
		Department.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
		Channel.updateMany({ teamId, isActive: { $ne: false } }, { isActive: false, deletedAt }),
		SupervisorConfig.updateMany({ teamId }, { isActive: false, deletedAt })
	])

	// Soft delete the team
	await Team.findByIdAndUpdate(teamId, {
		isActive: false,
		deletedAt
	})

	return {
		success: true,
		message: 'Zespół i wszyscy użytkownicy zostali oznaczeni jako usunięci. Dane zostaną trwale usunięte po 30 dniach zgodnie z Regulaminem.'
	}
}

/**
 * Permanently delete a team and all related data immediately (hard delete)
 * This action cannot be undone - all data is deleted immediately without retention period
 * @param {string} teamId - Team ID to permanently delete
 * @returns {Promise<{success: boolean, message: string}>}
 * @throws {Error} If team not found or deletion fails
 */
exports.permanentlyDeleteTeam = async (teamId) => {
	const team = await Team.findById(teamId)
	if (!team) {
		throw new Error('Zespół nie został znaleziony')
	}

	// Get all users in this team (including soft-deleted)
	const teamUsers = await User.find({ teamId }).select('_id')
	const userIds = teamUsers.map(u => u._id)

	// Delete historical records for all users in this team
	if (userIds.length > 0) {
		await Promise.all([
			Workday.deleteMany({ userId: { $in: userIds } }),
			LeaveRequest.deleteMany({ userId: { $in: userIds } }),
			LeavePlan.deleteMany({ userId: { $in: userIds } }),
			CalendarConfirmation.deleteMany({ userId: { $in: userIds } }),
			Log.deleteMany({ user: { $in: userIds } }),
			Message.deleteMany({ userId: { $in: userIds } })
		])
	}

	// Get all channels for this team and delete messages
	const teamChannels = await Channel.find({ teamId }).select('_id')
	const channelIds = teamChannels.map(c => c._id)
	if (channelIds.length > 0) {
		await Message.deleteMany({ channelId: { $in: channelIds } })
	}

	// Delete team resources
	await Promise.all([
		Channel.deleteMany({ teamId }),
		Board.deleteMany({ teamId }),
		Schedule.deleteMany({ teamId }),
		Department.deleteMany({ teamId }),
		SupervisorConfig.deleteMany({ teamId }),
		User.deleteMany({ teamId })
	])

	// Finally delete the team
	await Team.deleteOne({ _id: teamId })

	return {
		success: true,
		message: 'Zespół i wszystkie powiązane dane zostały trwale usunięte.'
	}
}

/**
 * Check if user has permission to delete a team
 * @param {Object} user - User object
 * @param {string} teamId - Team ID to check
 * @returns {Promise<{hasPermission: boolean, error?: string}>}
 */
exports.checkDeleteTeamPermission = async (user, teamId) => {
	if (!user || !user.roles.includes('Admin')) {
		return {
			hasPermission: false,
			error: 'Brak uprawnień do usunięcia zespołu'
		}
	}

	if (user.teamId.toString() !== teamId) {
		return {
			hasPermission: false,
			error: 'Brak uprawnień do usunięcia tego zespołu'
		}
	}

	return { hasPermission: true }
}
