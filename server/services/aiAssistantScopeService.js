/**
 * Determines which user IDs the requester may see in AI context for workdays, timer aggregates, and tasks.
 * Mirrors workday team visibility: Admin/HR → full team; Supervisor → supervised scope; Worker → self only.
 * (Leave requests in the assistant are loaded separately for **all active team members** — see aiContextBuilderService.)
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const { canSupervisorViewTimesheets, canSupervisorApproveLeaves } = require('./roleService')

/**
 * @param {import('mongoose').Types.ObjectId} teamId
 * @returns {Promise<import('mongoose').Types.ObjectId[]>}
 */
async function getActiveTeamUserIds(teamId) {
	const users = await User.find({
		teamId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}).select('_id')
	return users.map(u => u._id)
}

/**
 * @param {import('mongoose').Document} requestingUser - full User document
 * @returns {Promise<{ scope: 'team'|'supervised'|'self', detailedUserIds: import('mongoose').Types.ObjectId[] }>}
 */
exports.resolveDetailedDataScope = async function resolveDetailedDataScope(requestingUser) {
	const teamId = requestingUser.teamId
	const selfId = requestingUser._id

	const isAdmin = requestingUser.roles.includes('Admin')
	const isHR = requestingUser.roles.includes('HR')
	const isSupervisor = requestingUser.roles.includes('Przełożony (Supervisor)')

	if (isAdmin || isHR) {
		const ids = await getActiveTeamUserIds(teamId)
		return { scope: 'team', detailedUserIds: ids }
	}

	if (isSupervisor) {
		const teamUsers = await User.find({
			teamId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id firstName lastName department')

		const allowed = []
		for (const u of teamUsers) {
			// eslint-disable-next-line no-await-in-loop
			const okTs = await canSupervisorViewTimesheets(requestingUser, u)
			// eslint-disable-next-line no-await-in-loop
			const okLeave = await canSupervisorApproveLeaves(requestingUser, u)
			if (okTs || okLeave) allowed.push(u._id)
		}
		// Zawsze uwzględnij własne konto przełożonego w AI (raport „ja + podlegli”).
		const selfStr = selfId.toString()
		if (!allowed.some(id => id.toString() === selfStr)) {
			allowed.push(selfId)
		}
		return { scope: 'supervised', detailedUserIds: allowed }
	}

	// Worker (or any other role): only own detailed records
	return { scope: 'self', detailedUserIds: [selfId] }
}

/**
 * All active team user IDs (for anonymized aggregates e.g. leave occupancy for workers).
 */
exports.getTeamUserIdsForAggregates = getActiveTeamUserIds
