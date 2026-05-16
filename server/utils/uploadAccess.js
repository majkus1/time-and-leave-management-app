const { firmDb, centralTicketConnection } = require('../db/db')
const { normalizeStoredFilename } = require('./uploadAccessPolicy')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const Announcement = require('../models/Announcement')(firmDb)
const Message = require('../models/Message')(firmDb)
const Channel = require('../models/Channel')(firmDb)
const Task = require('../models/Task')(firmDb)
const TaskComment = require('../models/TaskComment')(firmDb)
const Ticket = centralTicketConnection ? require('../models/Ticket')(centralTicketConnection) : null
const { isSameTeam } = require('./vacationAccessPolicy')
const { isSuperAdminUser } = require('./userProfileAccessPolicy')
const { userHasAccessToChannel } = require('./chatChannelAccess')
const { loadBoardForUser, canUserAccessBoard } = require('./boardAccess')
const { isAdminUser } = require('./taskAccess')

const PLATFORM_SUPPORT_TEAM_NAME = 'OficjalnyAdminowy'
const PLATFORM_SUPPORT_EMAIL = 'michalipka1@gmail.com'

function normalizedEmail(email) {
	return (email || '').trim().toLowerCase()
}

function emailsEqual(a, b) {
	return normalizedEmail(a) === normalizedEmail(b)
}

function isPlatformSupportUser(team, userEmail) {
	if (!team || (team.name || '').trim() !== PLATFORM_SUPPORT_TEAM_NAME) return false
	return normalizedEmail(userEmail) === normalizedEmail(PLATFORM_SUPPORT_EMAIL)
}

function canAccessTicketUpload(viewer, ticket, team) {
	if (!viewer || !ticket) return false
	if (isPlatformSupportUser(team, viewer.username)) return true
	if (!emailsEqual(ticket.userEmail, viewer.username)) return false
	if (team && (ticket.company || '').trim() !== (team.name || '').trim()) {
		return false
	}
	return true
}

async function canUserAccessBoardById(boardId, viewer) {
	const board = await loadBoardForUser(boardId, viewer)
	if (!board) return false
	return canUserAccessBoard(board, viewer, { isAdmin: isAdminUser(viewer) })
}

/**
 * Czy zalogowany user może pobrać plik z /uploads/:filename (powiązanie w Mongo).
 */
async function canUserAccessStoredUpload(viewer, rawFilename) {
	if (!viewer) return false

	const filename = normalizeStoredFilename(rawFilename)
	if (!filename) return false

	if (isSuperAdminUser(viewer)) return true

	const team =
		viewer.teamId ? await Team.findById(viewer.teamId).select('name').lean() : null

	const announcement = await Announcement.findOne({ 'attachments.path': filename })
		.select('teamId')
		.lean()
	if (announcement) {
		return isSameTeam(viewer.teamId, announcement.teamId)
	}

	const message = await Message.findOne({ 'attachments.path': filename })
		.select('channelId')
		.lean()
	if (message?.channelId) {
		const channel = await Channel.findById(message.channelId).lean()
		return userHasAccessToChannel(channel, viewer)
	}

	const task = await Task.findOne({ 'attachments.path': filename }).select('boardId').lean()
	if (task?.boardId) {
		return canUserAccessBoardById(task.boardId, viewer)
	}

	const comment = await TaskComment.findOne({ 'attachments.path': filename })
		.select('taskId')
		.lean()
	if (comment?.taskId) {
		const parentTask = await Task.findById(comment.taskId).select('boardId').lean()
		if (parentTask?.boardId) {
			return canUserAccessBoardById(parentTask.boardId, viewer)
		}
	}

	if (Ticket) {
		const ticket = await Ticket.findOne({ 'messages.files': filename }).lean()
		if (ticket) {
			return canAccessTicketUpload(viewer, ticket, team)
		}
	}

	return false
}

module.exports = {
	canUserAccessStoredUpload,
}
