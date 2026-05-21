const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { canSupervisorViewTimesheets } = require('../services/roleService')
const {
	isSameTeam,
	isSelfUser,
	hasAdminOrHrRole,
} = require('./vacationAccessPolicy')
const { canWriteUserTimesheet } = require('./timesheetWriteAccessPolicy')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

async function loadActiveUser(userId) {
	return User.findOne({
		_id: userId,
		...ACTIVE_USER_FILTER,
	})
}

async function resolveTeamScopedTimesheetWriteAccess(requestingUserId, targetUserId) {
	const requestingUser = await loadActiveUser(requestingUserId)
	if (!requestingUser || requestingUser.appAccessEnabled === false) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const targetUser = await loadActiveUser(targetUserId)
	if (!targetUser) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const self = isSelfUser(requestingUser._id, targetUser._id)
	const sameTeam = isSameTeam(requestingUser.teamId, targetUser.teamId)

	if (!self && !sameTeam) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const settings = await Settings.getSettings(requestingUser.teamId)
	const isAdminOrHr = hasAdminOrHrRole(requestingUser)
	let canSupervisorWrite = false
	if (!self && !isAdminOrHr) {
		canSupervisorWrite = await canSupervisorViewTimesheets(requestingUser, targetUser)
	}

	const allowed = canWriteUserTimesheet({
		isSelf: self,
		isSameTeam: sameTeam,
		isAdminOrHr,
		canSupervisorWrite,
		managedWorkdayEntriesEnabled: settings.allowManagedWorkdayEntries === true,
		targetHasAppAccess: targetUser.appAccessEnabled !== false,
	})

	if (!allowed) {
		return { error: { status: 403, message: 'Access denied' } }
	}

	return { requestingUser, targetUser, settings }
}

function sendTeamScopedTimesheetWriteAccessError(res, error, { asJson = false } = {}) {
	if (error.status === 403) {
		const message = 'Access denied'
		return asJson ? res.status(403).json({ message }) : res.status(403).send(message)
	}
	const message = error.message || 'Użytkownik nie znaleziony'
	return asJson ? res.status(404).json({ message }) : res.status(404).send(message)
}

module.exports = {
	canWriteUserTimesheet,
	resolveTeamScopedTimesheetWriteAccess,
	sendTeamScopedTimesheetWriteAccessError,
}
