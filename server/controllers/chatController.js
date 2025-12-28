const { firmDb } = require('../db/db')
const Channel = require('../models/Channel')(firmDb)
const Message = require('../models/Message')(firmDb)
const User = require('../models/user')(firmDb)
const Department = require('../models/Department')(firmDb)
const Team = require('../models/Team')(firmDb)

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
		
		// Get all users in the team
		const allUsers = await User.find({ teamId }).select('_id')
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
		
		// Get all users in the team
		const allUsers = await User.find({ teamId }).select('_id')
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
		if (channel.type === 'department') {
			const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
			if (!userDepartments.includes(channel.departmentName)) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (channel.type === 'private') {
			if (!channel.members || !channel.members.includes(req.user.userId)) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (channel.type === 'general') {
			// Check if this is the automatic team channel or a custom general channel
			// Automatic team channel (isTeamChannel: true) - accessible to all team members
			if (channel.isTeamChannel) {
				// Allow access
			} else {
				// Custom general channel - only accessible to members
				if (!channel.members || !channel.members.some(m => m.toString() === req.user.userId)) {
					return res.status(403).json({ message: 'Access denied' })
				}
			}
		}

		// Get messages
		const messages = await Message.find({ channelId })
			.populate('userId', 'firstName lastName username')
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
		const { channelId, content } = req.body

		if (!content || !content.trim()) {
			return res.status(400).json({ message: 'Message content is required' })
		}

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
		if (channel.type === 'department') {
			const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
			if (!userDepartments.includes(channel.departmentName)) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (channel.type === 'private') {
			if (!channel.members || !channel.members.includes(req.user.userId)) {
				return res.status(403).json({ message: 'Access denied' })
			}
		} else if (channel.type === 'general') {
			// Check if this is the automatic team channel or a custom general channel
			// Automatic team channel (isTeamChannel: true) - accessible to all team members
			if (channel.isTeamChannel) {
				// Allow access
			} else {
				// Custom general channel - only accessible to members
				if (!channel.members || !channel.members.some(m => m.toString() === req.user.userId)) {
					return res.status(403).json({ message: 'Access denied' })
				}
			}
		}

		// Create message
		const message = new Message({
			channelId,
			userId: req.user.userId,
			content: content.trim(),
			readBy: [{
				userId: req.user.userId,
				readAt: new Date()
			}]
		})

		await message.save()
		await message.populate('userId', 'firstName lastName username')

		// Emit socket event for real-time update
		if (req.app && req.app.io) {
			req.app.io.to(`channel:${channelId}`).emit('message-received', message.toObject())
			req.app.io.to(`team:${req.user.teamId}`).emit('new-message-notification', {
				channelId,
				message: message.toObject()
			})
		}

		res.status(201).json(message)
	} catch (error) {
		console.error('Error sending message:', error)
		res.status(500).json({ message: 'Failed to send message' })
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

		// For private channels, members are required
		// For general channels, always include creator, and add selected members if provided
		const channelMembers = type === 'private' 
			? [req.user.userId, ...(memberIds || [])]
			: [req.user.userId, ...(memberIds || [])] // Always include creator for general channels
		
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

		// Add new members (avoid duplicates)
		const existingMembers = new Set(channel.members.map(m => m.toString()))
		const newMembers = memberIds.filter(id => !existingMembers.has(id.toString()))

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
		const users = await User.find({ teamId })
			.select('firstName lastName username')
			.sort({ firstName: 1, lastName: 1 })

		res.json(users)
	} catch (error) {
		console.error('Error getting team members:', error)
		res.status(500).json({ message: 'Failed to get team members' })
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

		// Check if other user exists and is in same team
		const otherUser = await User.findById(userId)
		if (!otherUser || otherUser.teamId.toString() !== teamId.toString()) {
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

