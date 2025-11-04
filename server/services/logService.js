const { firmDb } = require('../db/db')

exports.createLog = async (userId, action, details, createdBy) => {
	try {
		const Log = require('../models/log')(firmDb)
		const log = new Log({ user: userId, action, details, createdBy })
		await log.save()
	} catch (error) {
		console.error('Error creating log:', error)
	}
}
