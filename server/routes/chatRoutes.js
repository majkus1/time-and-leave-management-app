const express = require('express')
const router = express.Router()
const chatController = require('../controllers/chatController')
const { authenticateToken } = require('../middleware/authMiddleware')

// Get all channels user has access to
router.get('/channels', authenticateToken, chatController.getUserChannels)

// Get messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, chatController.getChannelMessages)

// Get channel users
router.get('/channels/:channelId/users', authenticateToken, chatController.getChannelUsers)

// Send a message
router.post('/messages', authenticateToken, chatController.sendMessage)

// Get unread message count
router.get('/unread-count', authenticateToken, chatController.getUnreadCount)

// Create a new channel
router.post('/channels', authenticateToken, chatController.createChannel)

// Delete a channel
router.delete('/channels/:channelId', authenticateToken, chatController.deleteChannel)

// Add members to a channel
router.post('/channels/:channelId/members', authenticateToken, chatController.addMembersToChannel)

// Remove members from a channel
router.delete('/channels/:channelId/members', authenticateToken, chatController.removeMembersFromChannel)

// Get team members
router.get('/team-members', authenticateToken, chatController.getTeamMembers)

// Create private chat
router.post('/private-chat', authenticateToken, chatController.createPrivateChat)

module.exports = router

