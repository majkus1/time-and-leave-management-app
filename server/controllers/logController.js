const { firmDb } = require('../db/db')
const Log = require('../models/log')(firmDb)
const User = require('../models/user')(firmDb)
const {
	isSuperAdminUser,
	canViewLogsAsAdmin,
	buildTeamScopedLogFilter,
	canAdminViewTargetUserLogs,
} = require('../utils/logAccessPolicy')

async function loadLogViewer(req) {
	const currentUser = await User.findById(req.user.userId).select('username roles teamId')
	if (!currentUser) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}
	if (!canViewLogsAsAdmin(currentUser)) {
		return { error: { status: 403, message: 'Access denied' } }
	}
	const isSuperAdmin = isSuperAdminUser(currentUser)
	return { currentUser, isSuperAdmin }
}

async function getActiveTeamUserIds(teamId) {
	if (!teamId) return []
	return User.find({
		teamId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}).distinct('_id')
}

const logPopulate = [
	{
		path: 'user',
		select: 'username teamId',
		populate: {
			path: 'teamId',
			select: 'name',
		},
	},
]

const logPopulateByUser = [
	{
		path: 'user',
		select: 'username',
		match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
	},
	{
		path: 'createdBy',
		select: 'username',
		match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
	},
]

exports.getLogs = async (req, res) => {
	try {
		const viewer = await loadLogViewer(req)
		if (viewer.error) {
			return res.status(viewer.error.status).send(viewer.error.message)
		}

		const { currentUser, isSuperAdmin } = viewer
		const teamUserIds = isSuperAdmin ? null : await getActiveTeamUserIds(currentUser.teamId)
		const filter = buildTeamScopedLogFilter({ isSuperAdmin, teamUserIds })

		const logs = await Log.find(filter).populate(logPopulate).sort({ timestamp: -1 })
		res.json(logs)
	} catch (error) {
		console.error('Error retrieving logs:', error)
		res.status(500).send('Failed to retrieve logs.')
	}
}

exports.getLogsByUser = async (req, res) => {
	try {
		const viewer = await loadLogViewer(req)
		if (viewer.error) {
			return res.status(viewer.error.status).send(viewer.error.message)
		}

		const { currentUser, isSuperAdmin } = viewer
		const { userId } = req.params

		const targetUser = await User.findById(userId).select('teamId isActive')
		if (!targetUser || targetUser.isActive === false) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		if (
			!canAdminViewTargetUserLogs({
				isSuperAdmin,
				viewerTeamId: currentUser.teamId,
				targetTeamId: targetUser.teamId,
			})
		) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		const logs = await Log.find({ user: userId })
			.populate(logPopulateByUser)
			.sort({ timestamp: -1 })

		res.json(logs)
	} catch (error) {
		console.error('Error retrieving user logs:', error)
		res.status(500).send('Failed to retrieve user logs.')
	}
}
