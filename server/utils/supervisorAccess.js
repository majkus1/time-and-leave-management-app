const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { isSuperAdminUser } = require('./userProfileAccessPolicy')
const { isSameTeam } = require('./vacationAccessPolicy')
const {
	canViewSupervisorSettings,
	canManageSupervisorSettings,
} = require('./supervisorAccessPolicy')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

async function loadActiveUser(userId) {
	return User.findOne({
		_id: userId,
		...ACTIVE_USER_FILTER,
	})
}

async function loadSupervisor(supervisorId) {
	return User.findOne({
		_id: supervisorId,
		...ACTIVE_USER_FILTER,
	})
}

function sendSupervisorAccessError(res, result) {
	return res.status(result.status).json({ message: result.message })
}

async function assertCanViewSupervisor({ viewerId, supervisorId }) {
	const viewer = await loadActiveUser(viewerId)
	if (!viewer) {
		return { ok: false, status: 404, message: 'Użytkownik nie znaleziony' }
	}

	const supervisor = await loadSupervisor(supervisorId)
	if (!supervisor) {
		return { ok: false, status: 404, message: 'Supervisor not found' }
	}

	if (isSuperAdminUser(viewer) || canViewSupervisorSettings({ viewer, supervisor })) {
		return { ok: true, viewer, supervisor }
	}

	if (!isSameTeam(viewer.teamId, supervisor.teamId)) {
		return { ok: false, status: 404, message: 'Supervisor not found' }
	}

	return { ok: false, status: 403, message: 'Access denied' }
}

async function assertCanManageSupervisor({ viewerId, supervisorId }) {
	const viewer = await loadActiveUser(viewerId)
	if (!viewer) {
		return { ok: false, status: 404, message: 'Użytkownik nie znaleziony' }
	}

	const supervisor = await loadSupervisor(supervisorId)
	if (!supervisor) {
		return { ok: false, status: 404, message: 'Supervisor not found' }
	}

	if (isSuperAdminUser(viewer) || canManageSupervisorSettings({ viewer, supervisor })) {
		return { ok: true, viewer, supervisor }
	}

	if (!isSameTeam(viewer.teamId, supervisor.teamId)) {
		return { ok: false, status: 404, message: 'Supervisor not found' }
	}

	return { ok: false, status: 403, message: 'Access denied' }
}

module.exports = {
	assertCanViewSupervisor,
	assertCanManageSupervisor,
	sendSupervisorAccessError,
	loadActiveUser,
	loadSupervisor,
}
