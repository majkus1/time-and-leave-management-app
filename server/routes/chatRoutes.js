const express = require('express')
const router = express.Router()
const chatController = require('../controllers/chatController')
const { authenticateToken } = require('../middleware/authMiddleware')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

const MAX_CHAT_ATTACHMENTS = 5
const MAX_CHAT_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_CHAT_MIME_TYPES = new Set([
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/gif',
	'application/pdf',
	'text/plain',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/zip',
	'application/x-zip-compressed'
])

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname || '')
		const filename = crypto.randomBytes(16).toString('hex') + ext
		cb(null, filename)
	}
})

const chatUpload = multer({
	storage,
	limits: {
		fileSize: MAX_CHAT_FILE_SIZE,
		files: MAX_CHAT_ATTACHMENTS
	},
	fileFilter: function (req, file, cb) {
		if (!ALLOWED_CHAT_MIME_TYPES.has(file.mimetype)) {
			return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
		}
		cb(null, true)
	}
})

// Get all channels user has access to
router.get('/channels', authenticateToken, chatController.getUserChannels)

// Get messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, chatController.getChannelMessages)

// Get channel users
router.get('/channels/:channelId/users', authenticateToken, chatController.getChannelUsers)

// Send a message
router.post('/messages', authenticateToken, (req, res, next) => {
	chatUpload.array('attachments', MAX_CHAT_ATTACHMENTS)(req, res, (err) => {
		if (!err) return next()
		if (err instanceof multer.MulterError) {
			if (err.code === 'LIMIT_FILE_SIZE') {
				return res.status(400).json({ message: 'Attachment exceeds 10MB limit' })
			}
			return res.status(400).json({ message: 'Invalid attachment file. Allowed: images, PDF, Office docs, TXT, ZIP' })
		}
		return res.status(400).json({ message: 'Failed to process attachments' })
	})
}, chatController.sendMessage)
router.put('/messages/:messageId', authenticateToken, chatController.updateMessage)
router.delete('/messages/:messageId', authenticateToken, chatController.deleteMessage)

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

