const multer = require('multer')
const path = require('path')
const crypto = require('crypto')

const MAX_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024 // 10MB

/** Wspólna whitelist — zgodna z czatem i ogłoszeniami. */
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
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

const INVALID_ATTACHMENT_MESSAGE =
	'Invalid attachment file. Allowed: images, PDF, Office docs, TXT, ZIP'

const attachmentStorage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, 'uploads/')
	},
	filename(req, file, cb) {
		const ext = path.extname(file.originalname || '')
		cb(null, crypto.randomBytes(16).toString('hex') + ext)
	},
})

function isAllowedAttachmentMimeType(mimetype) {
	return ALLOWED_ATTACHMENT_MIME_TYPES.has(mimetype)
}

function attachmentFileFilter(req, file, cb) {
	if (!isAllowedAttachmentMimeType(file.mimetype)) {
		return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', file.fieldname))
	}
	cb(null, true)
}

function createAttachmentMulter({ maxFiles = 1 } = {}) {
	return multer({
		storage: attachmentStorage,
		limits: {
			fileSize: MAX_ATTACHMENT_FILE_SIZE,
			files: maxFiles,
		},
		fileFilter: attachmentFileFilter,
	})
}

function handleMulterAttachmentError(res, err) {
	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({ message: 'Attachment exceeds 10MB limit' })
		}
		if (
			err.code === 'LIMIT_UNEXPECTED_FILE' ||
			err.code === 'LIMIT_FILE_COUNT' ||
			err.code === 'LIMIT_PART_COUNT'
		) {
			return res.status(400).json({ message: INVALID_ATTACHMENT_MESSAGE })
		}
	}
	return res.status(400).json({ message: 'Failed to process attachments' })
}

function singleAttachmentUpload(fieldName = 'file') {
	const uploader = createAttachmentMulter({ maxFiles: 1 })
	return (req, res, next) => {
		uploader.single(fieldName)(req, res, err => {
			if (!err) return next()
			return handleMulterAttachmentError(res, err)
		})
	}
}

function arrayAttachmentUpload(fieldName = 'attachments', maxCount = 5) {
	const uploader = createAttachmentMulter({ maxFiles: maxCount })
	return (req, res, next) => {
		uploader.array(fieldName, maxCount)(req, res, err => {
			if (!err) return next()
			return handleMulterAttachmentError(res, err)
		})
	}
}

module.exports = {
	ALLOWED_ATTACHMENT_MIME_TYPES,
	MAX_ATTACHMENT_FILE_SIZE,
	INVALID_ATTACHMENT_MESSAGE,
	isAllowedAttachmentMimeType,
	createAttachmentMulter,
	handleMulterAttachmentError,
	singleAttachmentUpload,
	arrayAttachmentUpload,
}
