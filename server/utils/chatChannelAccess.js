const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Channel = require('../models/Channel')(firmDb)
const { isSameTeam } = require('./vacationAccessPolicy')

const hasUserInMembers = (members, userId) =>
	Array.isArray(members) && members.some((member) => member?.toString() === userId?.toString())

/**
 * Czy user może korzystać z kanału (odczyt, socket, wiadomości).
 * Wymaga zgodności channel.teamId z user.teamId — izolacja tenantów.
 * Logika typów zgodna z getUserChannels.
 */
function userHasAccessToChannel(channel, user) {
	if (!channel || !user) return false
	if (channel.isActive === false) return false

	const userId = user._id?.toString()
	if (!userId) return false

	if (!isSameTeam(channel.teamId, user.teamId)) {
		return false
	}

	if (channel.type === 'department') {
		const userDepartments = Array.isArray(user.department)
			? user.department
			: user.department
				? [user.department]
				: []
		return userDepartments.includes(channel.departmentName)
	}

	if (channel.type === 'private') {
		return hasUserInMembers(channel.members, userId)
	}

	if (channel.type === 'general') {
		if (channel.isTeamChannel) return true

		const roles = Array.isArray(user.roles) ? user.roles : []
		if (roles.includes('Admin')) return true

		if (channel.createdBy && channel.createdBy.toString() === userId) {
			return true
		}

		return hasUserInMembers(channel.members, userId)
	}

	return false
}

async function loadActiveUserForChat(userId) {
	if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
		return null
	}
	return User.findOne({
		_id: userId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	})
}

async function loadActiveChannel(channelId) {
	if (!channelId || !mongoose.Types.ObjectId.isValid(String(channelId))) {
		return null
	}
	return Channel.findOne({
		_id: channelId,
		isActive: { $ne: false },
	})
}

/** Weryfikacja dostępu (REST, Socket join, socket relay). */
async function userCanAccessChannelById(userId, channelId) {
	const user = await loadActiveUserForChat(userId)
	if (!user) return false

	const channel = await loadActiveChannel(channelId)
	if (!channel) return false

	return userHasAccessToChannel(channel, user)
}

module.exports = {
	hasUserInMembers,
	userHasAccessToChannel,
	userCanAccessChannelById,
	loadActiveUserForChat,
	loadActiveChannel,
}
