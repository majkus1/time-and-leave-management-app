const express = require('express')
const router = express.Router()
const path = require('path')
const crypto = require('crypto')
const multer = require('multer')
const { authenticateToken } = require('../middleware/authMiddleware')
const requireAnnouncementManagerRole = require('../middleware/requireAnnouncementManagerRole')
const announcementController = require('../controllers/announcementController')

const MAX_ANNOUNCEMENT_ATTACHMENTS = 5
const MAX_ANNOUNCEMENT_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ALLOWED_ANNOUNCEMENT_MIME_TYPES = new Set([
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
	'application/x-zip-compressed',
])

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/')
	},
	filename: function (req, file, cb) {
		const ext = path.extname(file.originalname || '')
		const filename = crypto.randomBytes(16).toString('hex') + ext
		cb(null, filename)
	},
})

const announcementUpload = multer({
	storage,
	limits: {
		fileSize: MAX_ANNOUNCEMENT_FILE_SIZE,
		files: MAX_ANNOUNCEMENT_ATTACHMENTS,
	},
	fileFilter: function (req, file, cb) {
		if (!ALLOWED_ANNOUNCEMENT_MIME_TYPES.has(file.mimetype)) {
			return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
		}
		cb(null, true)
	},
})

router.get('/', authenticateToken, announcementController.getAnnouncements)
router.get('/unread-count', authenticateToken, announcementController.getUnreadAnnouncementsCount)
router.post('/mark-seen', authenticateToken, announcementController.markAnnouncementsSeen)

router.post(
	'/',
	authenticateToken,
	requireAnnouncementManagerRole,
	(req, res, next) => {
		announcementUpload.array('attachments', MAX_ANNOUNCEMENT_ATTACHMENTS)(req, res, (err) => {
			if (!err) return next()
			if (err instanceof multer.MulterError) {
				if (err.code === 'LIMIT_FILE_SIZE') {
					return res.status(400).json({ message: 'Attachment exceeds 10MB limit' })
				}
				return res
					.status(400)
					.json({ message: 'Invalid attachment file. Allowed: images, PDF, Office docs, TXT, ZIP' })
			}
			return res.status(400).json({ message: 'Failed to process attachments' })
		})
	},
	announcementController.createAnnouncement
)

router.delete('/:announcementId', authenticateToken, announcementController.deleteAnnouncement)

module.exports = router
