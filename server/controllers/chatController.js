const { firmDb } = require('../db/db')
const Channel = require('../models/Channel')(firmDb)
const Message = require('../models/Message')(firmDb)
const User = require('../models/user')(firmDb)
const Department = require('../models/Department')(firmDb)
const Team = require('../models/Team')(firmDb)
const { sendChatNotification } = require('../services/pushNotificationService')
const { sendChatEmailNotification } = require('../services/emailService')
const fs = require('fs').promises
const path = require('path')
const mongoose = require('mongoose')
const { userHasAccessToChannel } = require('../utils/chatChannelAccess')
const { isSameTeam } = require('../utils/vacationAccessPolicy')

function assertChannelInUserTeam(channel, userTeamId) {
	return channel && isSameTeam(channel.teamId, userTeamId)
}

const noAccessUsernamePattern = /@no-access\.planopia\.local$/i

function chatEligibleUserQuery(extra = {}) {
	return {
		...extra,
		appAccessEnabled: { $ne: false },
		managedOnly: { $ne: true },
		username: { $not: noAccessUsernamePattern },
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
	}
}

async function resolveChatEligibleMemberIds(teamId, memberIds = []) {
	const uniqueIds = [...new Set(memberIds.map(id => id?.toString()).filter(Boolean))]

	if (uniqueIds.some(id => !mongoose.Types.ObjectId.isValid(id))) {
		return null
	}

	if (uniqueIds.length === 0) {
		return []
	}

	const users = await User.find(chatEligibleUserQuery({
		teamId,
		_id: { $in: uniqueIds }
	})).select('_id')

	if (users.length !== uniqueIds.length) {
		return null
	}

	return users.map(user => user._id)
}

async function filterChatEligibleUserIds(teamId, userIds = []) {
	const uniqueIds = [...new Set(userIds.map(id => id?.toString()).filter(Boolean))]
	const validIds = uniqueIds.filter(id => mongoose.Types.ObjectId.isValid(id))

	if (validIds.length === 0) {
		return []
	}

	const users = await User.find(chatEligibleUserQuery({
		teamId,
		_id: { $in: validIds }
	})).select('_id')

	return users.map(user => user._id.toString())
}

const cleanupUploadedFiles = async (files = []) => {
	if (!Array.isArray(files) || files.length === 0) return

	await Promise.allSettled(
		files.map(async (file) => {
			if (!file?.filename) return
			const filePath = path.join(__dirname, '..', 'uploads', file.filename)
			await fs.unlink(filePath)
		})
	)
}

const cleanupStoredAttachments = async (attachments = []) => {
	if (!Array.isArray(attachments) || attachments.length === 0) return

	await Promise.allSettled(
		attachments.map(async (attachment) => {
			if (!attachment?.path) return
			const filePath = path.join(__dirname, '..', 'uploads', attachment.path)
			await fs.unlink(filePath)
		})
	)
}

const messagePopulateConfig = {
	path: 'userId',
	select: 'firstName lastName username',
	match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
}

const getPopulatedMessageById = async (messageId) => {
	if (!mongoose.Types.ObjectId.isValid(messageId)) return null
	return Message.findById(messageId).populate(messagePopulateConfig)
}

// Helper function to create channels automatically
exports.createChannelForDepartment = async (teamId, departmentName) => {
	try {
		const channelName = `#${departmentName}`
		const existingChannel = await Channel.findOne({ 
			teamId, 
			name: channelName,
			type: 'department'
		})
		
		if (!existingChannel) {
			const newChannel = new Channel({
				name: channelName,
				teamId,
				type: 'department',
				departmentName,
				description: `Kanał dla działu ${departmentName}`
			})
			await newChannel.save()
			return newChannel
		}
		return existingChannel
	} catch (error) {
		console.error('Error creating channel for department:', error)
		throw error
	}
}

// Helper function to create general channel for team
exports.createGeneralChannel = async (teamId) => {
	try {
		// Get team name
		const team = await Team.findById(teamId)
		if (!team) {
			throw new Error('Team not found')
		}
		
		const channelName = `#${team.name}`
		const existingChannel = await Channel.findOne({ 
			teamId, 
			type: 'general',
			isActive: true
		})
		
		// Get active team users who can access the app
		const allUsers = await User.find(chatEligibleUserQuery({ teamId })).select('_id')
		const memberIds = allUsers.map(user => user._id)
		
		if (!existingChannel) {
			const newChannel = new Channel({
				name: channelName,
				teamId,
				type: 'general',
				description: `Kanał ogólny dla całego zespołu ${team.name}`,
				members: memberIds,
				isActive: true,
				isTeamChannel: true
			})
			await newChannel.save()
			return newChannel
		} else {
			// Update existing channel: update name and sync members
			existingChannel.name = channelName
			existingChannel.description = `Kanał ogólny dla całego zespołu ${team.name}`
			existingChannel.isTeamChannel = true // Ensure it's marked as team channel
			// Sync members - add all team users
			const existingMemberIds = existingChannel.members.map(m => m.toString())
			const newMembers = memberIds.filter(id => !existingMemberIds.includes(id.toString()))
			if (newMembers.length > 0) {
				existingChannel.members.push(...newMembers)
			}
			// Remove users who are no longer in the team
			existingChannel.members = existingChannel.members.filter(m => 
				memberIds.some(id => id.toString() === m.toString())
			)
			await existingChannel.save()
			return existingChannel
		}
	} catch (error) {
		console.error('Error creating general channel:', error)
		throw error
	}
}

// Helper function to sync general channel members with team users
// Only syncs the automatic team channel (named #teamName), not custom general channels
exports.syncGeneralChannelMembers = async (teamId) => {
	try {
		// Get team name to identify the automatic team channel
		const team = await Team.findById(teamId)
		if (!team) {
			throw new Error('Team not found')
		}
		
		const teamGeneralChannelName = `#${team.name}`
		
		const generalChannel = await Channel.findOne({ 
			teamId, 
			type: 'general',
			isTeamChannel: true,
			isActive: true
		})
		
		if (!generalChannel) {
			// If no automatic team channel exists, create it
			return await exports.createGeneralChannel(teamId)
		}
		
		// Get active team users who can access the app
		const allUsers = await User.find(chatEligibleUserQuery({ teamId })).select('_id')
		const memberIds = allUsers.map(user => user._id)
		
		// Update members list
		const existingMemberIds = generalChannel.members.map(m => m.toString())
		const newMembers = memberIds.filter(id => !existingMemberIds.includes(id.toString()))
		const removedMembers = existingMemberIds.filter(id => 
			!memberIds.some(mid => mid.toString() === id)
		)
		
		if (newMembers.length > 0 || removedMembers.length > 0) {
			generalChannel.members = memberIds
			await generalChannel.save()
		}
		
		return generalChannel
	} catch (error) {
		console.error('Error syncing general channel members:', error)
		throw error
	}
}

// Get all channels user has access to
exports.getUserChannels = async (req, res) => {
	try {
		const { teamId } = req.user
		const user = await User.findById(req.user.userId)
		
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Get team name to identify the automatic team channel
		const team = await Team.findById(teamId)
		const teamGeneralChannelName = team ? `#${team.name}` : null
		
		// Check if user is Admin
		const isAdmin = req.user.roles && Array.isArray(req.user.roles) && req.user.roles.includes('Admin')
		
		// Get all general channels
		const allGeneralChannels = await Channel.find({ 
			teamId, 
			type: 'general',
			isActive: true
		})
		
		// Filter general channels:
		// - Automatic team channel (isTeamChannel: true) is visible to all team members
		// - Custom general channels (created via form) are visible to members, Admin, or creator
		const generalChannels = allGeneralChannels.filter(channel => {
			// Automatic team channel - visible to all
			if (channel.isTeamChannel) {
				return true
			}
			// Admin always sees custom general channels
			if (isAdmin) {
				return true
			}
			// Creator always sees their channels
			if (channel.createdBy && channel.createdBy.toString() === req.user.userId) {
				return true
			}
			// Custom general channels - visible to members
			if (!channel.members || channel.members.length === 0) {
				return false // No members = not visible
			}
			return channel.members.some(m => m.toString() === req.user.userId)
		})

		// Get department channels (user's departments)
		const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
		
		let departmentChannels = []
		if (userDepartments.length > 0) {
			departmentChannels = await Channel.find({
				teamId,
				type: 'department',
				departmentName: { $in: userDepartments },
				isActive: true
			})
		}

		// Get private channels (user is a member)
		const privateChannels = await Channel.find({
			teamId,
			type: 'private',
			members: req.user.userId,
			isActive: true
		})

		// Combine channels
		const channels = []
		channels.push(...generalChannels)
		channels.push(...departmentChannels)
		channels.push(...privateChannels)

		// Get unread counts for each channel
		const channelsWithUnread = await Promise.all(
			channels.map(async (channel) => {
				const unreadCount = await Message.countDocuments({
					channelId: channel._id,
					'readBy.userId': { $ne: req.user.userId },
					userId: { $ne: req.user.userId } // Don't count own messages
				})
				return {
					...channel.toObject(),
					unreadCount
				}
			})
		)

		res.json(channelsWithUnread)
	} catch (error) {
		console.error('Error getting user channels:', error)
		res.status(500).json({ message: 'Failed to get channels' })
	}
}

// Get messages for a channel
exports.getChannelMessages = async (req, res) => {
	try {
		const { channelId } = req.params
		const { page = 1, limit = 50 } = req.query
		const skip = (page - 1) * limit

		// Verify user has access to this channel
		const channel = await Channel.findById(channelId)
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		const user = await User.findById(req.user.userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Check access
		if (!userHasAccessToChannel(channel, user)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Get messages
		const messages = await Message.find({ channelId })
			.populate({
				path: 'userId',
				select: 'firstName lastName username',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.sort({ createdAt: -1 })
			.limit(parseInt(limit))
			.skip(skip)

		// Mark messages as read
		await Message.updateMany(
			{
				channelId,
				'readBy.userId': { $ne: req.user.userId },
				userId: { $ne: req.user.userId }
			},
			{
				$push: {
					readBy: {
						userId: req.user.userId,
						readAt: new Date()
					}
				}
			}
		)

		res.json(messages.reverse()) // Reverse to show oldest first
	} catch (error) {
		console.error('Error getting channel messages:', error)
		res.status(500).json({ message: 'Failed to get messages' })
	}
}

// Send a message
exports.sendMessage = async (req, res) => {
	try {
		const { channelId } = req.body
		const rawContent = typeof req.body?.content === 'string' ? req.body.content : ''
		const trimmedContent = rawContent.trim()
		const uploadedFiles = Array.isArray(req.files) ? req.files : []

		if (!channelId) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'Channel ID is required' })
		}

		if (!trimmedContent && uploadedFiles.length === 0) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'Message content or attachment is required' })
		}

		// Verify user has access to this channel
		const channel = await Channel.findById(channelId)
		if (!channel) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(404).json({ message: 'Channel not found' })
		}

		const user = await User.findById(req.user.userId)
		if (!user) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(404).json({ message: 'User not found' })
		}

		// Check access
		if (!userHasAccessToChannel(channel, user)) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(403).json({ message: 'Access denied' })
		}

		const attachments = uploadedFiles.map(file => ({
			filename: file.originalname,
			path: file.filename,
			mimeType: file.mimetype,
			size: file.size
		}))

		// Create message
		const message = new Message({
			channelId,
			userId: req.user.userId,
			content: trimmedContent,
			attachments,
			readBy: [{
				userId: req.user.userId,
				readAt: new Date()
			}]
		})

		await message.save()
		await message.populate(messagePopulateConfig)

		// Emit socket event for real-time update
		if (req.app && req.app.io) {
			req.app.io.to(`channel:${channelId}`).emit('message-received', message.toObject())
			req.app.io.to(`team:${req.user.teamId}`).emit('new-message-notification', {
				channelId,
				message: message.toObject()
			})
		}

		// Send push notifications to channel members (except sender)
		try {
			let recipientUserIds = []
			
			if (channel.type === 'department') {
				// Get all users in the department
				const departmentUsers = await User.find({
					teamId: channel.teamId,
					appAccessEnabled: { $ne: false },
					managedOnly: { $ne: true },
					username: { $not: noAccessUsernamePattern },
					$and: [
						{
							$or: [
								{ department: channel.departmentName },
								{ department: { $in: [channel.departmentName] } }
							]
						},
						{
							$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
						}
					]
				}).select('_id')
				recipientUserIds = departmentUsers.map(u => u._id.toString())
			} else if (channel.type === 'private') {
				// Get channel members
				recipientUserIds = channel.members.map(m => m.toString())
			} else if (channel.type === 'general') {
				if (channel.isTeamChannel) {
					// Get all team members
					const teamUsers = await User.find(chatEligibleUserQuery({ teamId: channel.teamId })).select('_id')
					recipientUserIds = teamUsers.map(u => u._id.toString())
				} else {
					// Custom general channel - get members
					recipientUserIds = channel.members.map(m => m.toString())
				}
			}

			recipientUserIds = await filterChatEligibleUserIds(channel.teamId, recipientUserIds)

			// Remove sender from recipients
			recipientUserIds = recipientUserIds.filter(id => id !== req.user.userId.toString())
			
			if (recipientUserIds.length > 0) {
				// Send push notifications (non-blocking)
				sendChatNotification(channelId, message.toObject(), recipientUserIds)
					.catch(error => {
						console.error('Error sending chat push notifications:', error)
						// Don't fail the request if push fails
					})

				const senderName = message?.userId?.firstName && message?.userId?.lastName
					? `${message.userId.firstName} ${message.userId.lastName}`
					: (message?.userId?.username || 'User')
				sendChatEmailNotification({
					channel,
					message: message.toObject(),
					senderName,
					recipientUserIds,
					t: req.t,
				}).catch((error) => {
					console.error('Error sending chat email notifications:', error)
				})
			}
		} catch (error) {
			console.error('Error preparing chat push notifications:', error)
			// Don't fail the request if push preparation fails
		}

		res.status(201).json(message)
	} catch (error) {
		await cleanupUploadedFiles(req.files)
		console.error('Error sending message:', error)
		res.status(500).json({ message: 'Failed to send message' })
	}
}

// Edit own message
exports.updateMessage = async (req, res) => {
	try {
		const { messageId } = req.params
		const rawContent = typeof req.body?.content === 'string' ? req.body.content : ''
		const trimmedContent = rawContent.trim()

		const message = await Message.findById(messageId)
		if (!message) {
			return res.status(404).json({ message: 'Message not found' })
		}

		if (message.userId.toString() !== req.user.userId.toString()) {
			return res.status(403).json({ message: 'You can only edit your own messages' })
		}

		if (message.isDeleted) {
			return res.status(400).json({ message: 'Deleted message cannot be edited' })
		}

		const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0
		if (!trimmedContent && !hasAttachments) {
			return res.status(400).json({ message: 'Message content is required' })
		}

		message.content = trimmedContent
		message.isEdited = true
		message.editedAt = new Date()
		await message.save()

		const populatedMessage = await getPopulatedMessageById(message._id)
		if (!populatedMessage) {
			return res.status(500).json({ message: 'Failed to load updated message' })
		}

		if (req.app?.io) {
			req.app.io.to(`channel:${message.channelId}`).emit('message-updated', populatedMessage.toObject())
		}

		res.json(populatedMessage)
	} catch (error) {
		console.error('Error updating message:', error)
		res.status(500).json({ message: 'Failed to update message' })
	}
}

// Delete own message (soft delete)
exports.deleteMessage = async (req, res) => {
	try {
		const { messageId } = req.params
		const message = await Message.findById(messageId)

		if (!message) {
			return res.status(404).json({ message: 'Message not found' })
		}

		if (message.userId.toString() !== req.user.userId.toString()) {
			return res.status(403).json({ message: 'You can only delete your own messages' })
		}

		if (message.isDeleted) {
			return res.status(400).json({ message: 'Message already deleted' })
		}

		await cleanupStoredAttachments(message.attachments || [])
		message.attachments = []
		message.content = ''
		message.isDeleted = true
		message.deletedAt = new Date()
		message.isEdited = false
		message.editedAt = null
		await message.save()

		const populatedMessage = await getPopulatedMessageById(message._id)
		if (!populatedMessage) {
			return res.status(500).json({ message: 'Failed to load deleted message' })
		}

		if (req.app?.io) {
			req.app.io.to(`channel:${message.channelId}`).emit('message-deleted', populatedMessage.toObject())
		}

		res.json({ message: 'Message deleted successfully', data: populatedMessage })
	} catch (error) {
		console.error('Error deleting message:', error)
		res.status(500).json({ message: 'Failed to delete message' })
	}
}

// Get unread message count for all channels
exports.getUnreadCount = async (req, res) => {
	try {
		const { teamId } = req.user
		const user = await User.findById(req.user.userId)
		
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		// Get team name to identify the automatic team channel
		const team = await Team.findById(teamId)
		const teamGeneralChannelName = team ? `#${team.name}` : null
		
		// Get all general channels
		const allGeneralChannels = await Channel.find({ 
			teamId, 
			type: 'general',
			isActive: true
		})
		
		// Filter general channels:
		// - Automatic team channel (isTeamChannel: true) is visible to all team members
		// - Custom general channels (created via form) are visible only to their members
		const generalChannels = allGeneralChannels.filter(channel => {
			// Automatic team channel - visible to all
			if (channel.isTeamChannel) {
				return true
			}
			// Custom general channels - only visible to members
			if (!channel.members || channel.members.length === 0) {
				return false // No members = not visible
			}
			return channel.members.some(m => m.toString() === req.user.userId)
		})

		const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
		
		let departmentChannels = []
		if (userDepartments.length > 0) {
			departmentChannels = await Channel.find({
				teamId,
				type: 'department',
				departmentName: { $in: userDepartments },
				isActive: true
			})
		}

		// Get private channels user is member of
		const privateChannels = await Channel.find({
			teamId,
			type: 'private',
			members: req.user.userId,
			isActive: true
		})

		const channels = []
		channels.push(...generalChannels)
		channels.push(...departmentChannels)
		channels.push(...privateChannels)

		// Count unread messages
		const totalUnread = await Message.countDocuments({
			channelId: { $in: channels.map(c => c._id) },
			'readBy.userId': { $ne: req.user.userId },
			userId: { $ne: req.user.userId }
		})

		res.json({ unreadCount: totalUnread })
	} catch (error) {
		console.error('Error getting unread count:', error)
		res.status(500).json({ message: 'Failed to get unread count' })
	}
}

// Create a new channel
exports.createChannel = async (req, res) => {
	try {
		const { name, type, description, memberIds } = req.body
		const { teamId } = req.user

		if (!name || !type) {
			return res.status(400).json({ message: 'Channel name and type are required' })
		}

		if (type === 'private' && (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0)) {
			return res.status(400).json({ message: 'Private channels require at least one member' })
		}

		// Check if channel name already exists in team
		const existingChannel = await Channel.findOne({ teamId, name: name.trim(), isActive: true })
		if (existingChannel) {
			return res.status(400).json({ message: 'Channel with this name already exists' })
		}

		const requestedMemberIds = Array.isArray(memberIds) ? memberIds : []
		const eligibleMemberIds = await resolveChatEligibleMemberIds(teamId, [req.user.userId, ...requestedMemberIds])

		if (!eligibleMemberIds) {
			return res.status(400).json({ message: 'Channels can include only active users with application access' })
		}

		// For private channels, members are required
		// For general channels, always include creator, and add selected members if provided
		const channelMembers = eligibleMemberIds
		
		const newChannel = new Channel({
			name: name.trim(),
			teamId,
			type,
			description: description?.trim() || '',
			members: channelMembers,
			isActive: true,
			createdBy: req.user.userId
		})

		await newChannel.save()

		res.status(201).json(newChannel)
	} catch (error) {
		console.error('Error creating channel:', error)
		res.status(500).json({ message: 'Failed to create channel' })
	}
}

// Add members to a channel
exports.addMembersToChannel = async (req, res) => {
	try {
		const { channelId } = req.params
		const { memberIds } = req.body

		if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
			return res.status(400).json({ message: 'Member IDs are required' })
		}

		const channel = await Channel.findById(channelId)
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		if (!assertChannelInUserTeam(channel, req.user.teamId)) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		// Block modification of automatic team channel (isTeamChannel: true)
		// Allow modification of custom general channels created via form
		if (channel.type === 'general' && channel.isTeamChannel) {
			return res.status(400).json({ message: 'Cannot modify members of automatic team channel. It is automatically synced with all team members.' })
		}

		// Block adding members to private channels - they are created between specific users only
		if (channel.type === 'private') {
			return res.status(400).json({ message: 'Cannot add members to private channels. Private channels are created between specific users only.' })
		}

		// Verify user has permission (must be admin or channel creator)
		const isAdmin = req.user.roles && Array.isArray(req.user.roles) && req.user.roles.includes('Admin')
		const isCreator = channel.createdBy && channel.createdBy.toString() === req.user.userId
		
		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or channel creator can add members to this channel' })
		}

		const eligibleMemberIds = await resolveChatEligibleMemberIds(channel.teamId, memberIds)
		if (!eligibleMemberIds) {
			return res.status(400).json({ message: 'Channels can include only active users with application access' })
		}

		// Add new members (avoid duplicates)
		const existingMembers = new Set(channel.members.map(m => m.toString()))
		const newMembers = eligibleMemberIds.filter(id => !existingMembers.has(id.toString()))

		if (newMembers.length === 0) {
			return res.status(400).json({ message: 'All users are already members of this channel' })
		}

		channel.members.push(...newMembers)
		await channel.save()

		res.json({ message: 'Members added successfully', channel })
	} catch (error) {
		console.error('Error adding members to channel:', error)
		res.status(500).json({ message: 'Failed to add members' })
	}
}

// Remove members from a channel
exports.removeMembersFromChannel = async (req, res) => {
	try {
		const { channelId } = req.params
		const { memberIds } = req.body

		if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
			return res.status(400).json({ message: 'Member IDs are required' })
		}

		const channel = await Channel.findById(channelId)
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		if (!assertChannelInUserTeam(channel, req.user.teamId)) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		// Block modification of automatic team channel (isTeamChannel: true)
		// Allow modification of custom general channels created via form
		if (channel.type === 'general' && channel.isTeamChannel) {
			return res.status(400).json({ message: 'Cannot modify members of automatic team channel. It is automatically synced with all team members.' })
		}

		// Block removing members from private channels - they are created between specific users only
		if (channel.type === 'private') {
			return res.status(400).json({ message: 'Cannot remove members from private channels. Private channels are created between specific users only.' })
		}

		// Verify user has permission (must be admin or channel creator)
		const isAdmin = req.user.roles && Array.isArray(req.user.roles) && req.user.roles.includes('Admin')
		const isCreator = channel.createdBy && channel.createdBy.toString() === req.user.userId
		
		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or channel creator can remove members from this channel' })
		}

		// Remove members (don't remove the current user or creator)
		// Note: Other admins CAN be removed by admin or creator
		const creatorId = channel.createdBy ? channel.createdBy.toString() : null
		
		const filteredMembers = channel.members.filter(m => {
			const memberId = m.toString()
			// Don't remove current user (can't remove yourself)
			if (memberId === req.user.userId) {
				return true
			}
			// Don't remove creator (only if trying to remove creator)
			// But if current user is admin, they can remove creator
			if (channel.createdBy && channel.createdBy.toString() === memberId) {
				// Only allow removing creator if current user is admin (not the creator themselves)
				if (isAdmin && creatorId !== req.user.userId) {
					// Admin can remove creator
					return memberIds.includes(memberId)
				}
				// Creator cannot be removed by non-admin
				return true
			}
			// Remove if in the list to remove
			return !memberIds.includes(memberId)
		})
		
		// Ensure at least current user is in members (and creator if exists and wasn't removed)
		const finalMembers = new Set(filteredMembers.map(m => m.toString()))
		
		// Always include current user
		if (req.user.userId) {
			finalMembers.add(req.user.userId.toString())
		}
		
		// Always include creator if exists and wasn't explicitly removed by admin
		if (creatorId && (!memberIds.includes(creatorId) || !isAdmin)) {
			finalMembers.add(creatorId)
		}
		
		// Convert Set back to array of ObjectIds
		const mongoose = require('mongoose')
		channel.members = Array.from(finalMembers).map(id => new mongoose.Types.ObjectId(id))
		
		await channel.save()

		res.json({ message: 'Members removed successfully', channel })
	} catch (error) {
		console.error('Error removing members from channel:', error)
		res.status(500).json({ message: 'Failed to remove members' })
	}
}

// Delete a channel
exports.deleteChannel = async (req, res) => {
	try {
		const { channelId } = req.params
		const { teamId } = req.user

		const channel = await Channel.findById(channelId)
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		// Verify channel belongs to user's team
		if (channel.teamId.toString() !== teamId.toString()) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// Don't allow deleting department channels (they are automatically created)
		if (channel.type === 'department') {
			return res.status(400).json({ message: 'Department channels cannot be deleted' })
		}

		// Don't allow deleting automatic team channel (isTeamChannel: true)
		// Allow deleting custom general channels created via form
		if (channel.type === 'general' && channel.isTeamChannel) {
			return res.status(400).json({ message: 'Automatic team channel cannot be deleted' })
		}

		// Verify user has permission (must be admin or channel creator)
		const isAdmin = req.user.roles && Array.isArray(req.user.roles) && req.user.roles.includes('Admin')
		const isCreator = channel.createdBy && channel.createdBy.toString() === req.user.userId
		
		// Only admin or creator can delete custom channels
		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or channel creator can delete this channel' })
		}

		// Soft delete: set isActive to false
		channel.isActive = false
		await channel.save()

		res.json({ message: 'Channel deleted successfully' })
	} catch (error) {
		console.error('Error deleting channel:', error)
		res.status(500).json({ message: 'Failed to delete channel' })
	}
}

// Get team members for adding to channels
exports.getTeamMembers = async (req, res) => {
	try {
		const { teamId } = req.user
		const users = await User.find(chatEligibleUserQuery({ teamId }))
			.select('firstName lastName username')
			.sort({ firstName: 1, lastName: 1 })

		res.json(users)
	} catch (error) {
		console.error('Error getting team members:', error)
		res.status(500).json({ message: 'Failed to get team members' })
	}
}

// Get channel members/users
exports.getChannelUsers = async (req, res) => {
	try {
		const { channelId } = req.params
		const userId = req.user.userId

		const channel = await Channel.findById(channelId)
		if (!channel) {
			return res.status(404).json({ message: 'Channel not found' })
		}

		const requestingUser = await User.findById(userId)
		if (!requestingUser || !userHasAccessToChannel(channel, requestingUser)) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// For team channels, all active team members have access
		if (channel.isTeamChannel && channel.type === 'general') {
			const users = await User.find(chatEligibleUserQuery({ teamId: channel.teamId }))
				.select('firstName lastName username position')
				.sort({ firstName: 1, lastName: 1 })
			return res.json(users)
		}

		// For department channels, get active users from that department
		if (channel.type === 'department' && channel.departmentName) {
			const users = await User.find({
				teamId: channel.teamId,
				appAccessEnabled: { $ne: false },
				managedOnly: { $ne: true },
				username: { $not: noAccessUsernamePattern },
				$and: [
					{
						$or: [
							{ department: channel.departmentName },
							{ department: { $in: [channel.departmentName] } }
						]
					},
					{
						$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
					}
				]
			}).select('firstName lastName username position').sort({ firstName: 1, lastName: 1 })
			return res.json(users)
		}

		// For private channels, don't show users list (privacy)
		if (channel.type === 'private') {
			return res.status(403).json({ message: 'Cannot view members of private channels' })
		}

		// For custom general channels, get active members
		if (channel.members && channel.members.length > 0) {
			const users = await User.find({ 
				_id: { $in: channel.members },
				...chatEligibleUserQuery()
			})
				.select('firstName lastName username position')
				.sort({ firstName: 1, lastName: 1 })
			return res.json(users)
		}

		// If no members, return empty array
		res.json([])
	} catch (error) {
		console.error('Error getting channel users:', error)
		res.status(500).json({ message: 'Failed to get channel users' })
	}
}

// Create private chat between two users
exports.createPrivateChat = async (req, res) => {
	try {
		const { userId } = req.body
		const { teamId } = req.user

		if (!userId) {
			return res.status(400).json({ message: 'User ID is required' })
		}

		// Check if other user exists, is in same team and can access the app
		const otherUser = await User.findOne(chatEligibleUserQuery({ _id: userId, teamId }))
		if (!otherUser) {
			return res.status(404).json({ message: 'User not found or not in same team' })
		}

		// Check if private chat already exists between these two users
		const existingChat = await Channel.findOne({
			teamId,
			type: 'private',
			members: { $all: [req.user.userId, userId], $size: 2 },
			isActive: true
		})

		if (existingChat) {
			return res.json(existingChat)
		}

		// Create new private chat
		const currentUser = await User.findById(req.user.userId)
		const channelName = `${currentUser.firstName} ${currentUser.lastName} & ${otherUser.firstName} ${otherUser.lastName}`

		const newChannel = new Channel({
			name: channelName,
			teamId,
			type: 'private',
			members: [req.user.userId, userId],
			isActive: true
		})

		await newChannel.save()

		res.status(201).json(newChannel)
	} catch (error) {
		console.error('Error creating private chat:', error)
		res.status(500).json({ message: 'Failed to create private chat' })
	}
}
