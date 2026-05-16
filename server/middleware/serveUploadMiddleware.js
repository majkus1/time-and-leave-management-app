const path = require('path')
const fs = require('fs')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { normalizeStoredFilename } = require('../utils/uploadAccessPolicy')
const { canUserAccessStoredUpload } = require('../utils/uploadAccess')

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

async function serveUploadMiddleware(req, res) {
	try {
		const filename = normalizeStoredFilename(req.path.replace(/^\//, ''))
		if (!filename) {
			return res.status(400).send('Invalid file path')
		}

		const viewer = await User.findOne({
			_id: req.user.userId,
			...ACTIVE_USER_FILTER,
		})
		if (!viewer) {
			return res.status(401).send('Unauthorized')
		}

		const allowed = await canUserAccessStoredUpload(viewer, filename)
		if (!allowed) {
			return res.status(404).send('File not found')
		}

		const absolutePath = path.join(UPLOADS_DIR, filename)
		const resolvedUploads = path.resolve(UPLOADS_DIR)
		const resolvedFile = path.resolve(absolutePath)
		if (!resolvedFile.startsWith(resolvedUploads + path.sep) && resolvedFile !== resolvedUploads) {
			return res.status(400).send('Invalid file path')
		}

		if (!fs.existsSync(resolvedFile)) {
			return res.status(404).send('File not found')
		}

		return res.sendFile(resolvedFile)
	} catch (error) {
		console.error('serveUploadMiddleware:', error)
		return res.status(500).send('Error serving file')
	}
}

module.exports = { serveUploadMiddleware }
