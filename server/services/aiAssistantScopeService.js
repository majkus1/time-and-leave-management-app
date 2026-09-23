/**
 * Determines which user IDs the requester may see in AI context for workdays, timer aggregates, and tasks.
 * Mirrors workday team visibility: Admin/HR → full team; Supervisor → supervised scope; Worker → self only.
 * (Leave requests in the assistant are loaded separately for **all active team members** — see aiContextBuilderService.)
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const { canSupervisorViewTimesheets, canSupervisorApproveLeaves } = require('./roleService')
const { splitSupervisorAiScopes } = require('../utils/aiDataScope')

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
 * detailedUserIds = zakres EWIDENCJI (godziny, licznik, zadania, lista osób w kontekście);
 * leaveUserIds = zakres URLOPÓW (eksport wniosków). Dla przełożonego to różne zbiory (utils/aiDataScope).
 * @param {import('mongoose').Document} requestingUser - full User document
 * @returns {Promise<{ scope: 'team'|'supervised'|'self', detailedUserIds: import('mongoose').Types.ObjectId[], leaveUserIds: import('mongoose').Types.ObjectId[] }>}
 */
exports.resolveDetailedDataScope = async function resolveDetailedDataScope(requestingUser) {
	const teamId = requestingUser.teamId
	const selfId = requestingUser._id

	const isAdmin = requestingUser.roles.includes('Admin')
	const isHR = requestingUser.roles.includes('HR')
	const isSupervisor = requestingUser.roles.includes('Przełożony (Supervisor)')

	if (isAdmin || isHR) {
		const ids = await getActiveTeamUserIds(teamId)
		return { scope: 'team', detailedUserIds: ids, leaveUserIds: ids }
	}

	if (isSupervisor) {
		const teamUsers = await User.find({
			teamId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id firstName lastName department')

		const entries = []
		for (const u of teamUsers) {
			// eslint-disable-next-line no-await-in-loop
			const timesheet = await canSupervisorViewTimesheets(requestingUser, u)
			// eslint-disable-next-line no-await-in-loop
			const leave = await canSupervisorApproveLeaves(requestingUser, u)
			entries.push({ id: u._id, timesheet, leave })
		}
		// Dwa osobne zbiory (nie suma); własne konto zawsze w obu („ja + podlegli”).
		const { timesheetUserIds, leaveUserIds } = splitSupervisorAiScopes(entries, selfId)
		return { scope: 'supervised', detailedUserIds: timesheetUserIds, leaveUserIds }
	}

	// Worker (or any other role): only own detailed records
	return { scope: 'self', detailedUserIds: [selfId], leaveUserIds: [selfId] }
}

/**
 * All active team user IDs (for anonymized aggregates e.g. leave occupancy for workers).
 */
exports.getTeamUserIdsForAggregates = getActiveTeamUserIds
