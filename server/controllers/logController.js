const { firmDb } = require('../db/db')
const Log = require('../models/log')(firmDb)

exports.getLogs = async (req, res) => {
	try {
		const allowedRoles = ['Admin']
		if (!allowedRoles.some(role => req.user.roles.includes(role))) {
			return res.status(403).send('Access denied')
		}

		const logs = await Log.find().populate({
			path: 'user',
			select: 'username',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		}).sort({ timestamp: -1 })
		res.json(logs)
	} catch (error) {
		console.error('Error retrieving logs:', error)
		res.status(500).send('Failed to retrieve logs.')
	}
}

exports.getLogsByUser = async (req, res) => {
	try {
		const User = require('../models/user')(require('../db/db').firmDb)
		const currentUser = await User.findById(req.user.userId)
		
		if (!currentUser) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}

		// Sprawdź czy to super admin lub Admin
		const isSuperAdmin = currentUser.username === 'michalipka1@gmail.com'
		const allowedRoles = ['Admin']
		const isAdmin = allowedRoles.some(role => req.user.roles.includes(role))
		
		if (!isSuperAdmin && !isAdmin) {
			return res.status(403).send('Access denied')
		}

		const logs = await Log.find({ user: req.params.userId })
			.populate({
				path: 'user',
				select: 'username',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'createdBy',
				select: 'username',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.sort({ timestamp: -1 })

		res.json(logs)
	} catch (error) {
		console.error('Error retrieving user logs:', error)
		res.status(500).send('Failed to retrieve user logs.')
	}
}
