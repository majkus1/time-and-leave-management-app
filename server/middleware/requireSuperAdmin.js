const { isSuperAdminUser } = require('../utils/logAccessPolicy')

/** Tylko właściciel platformy (michalipka1@gmail.com). Wymaga wcześniejszego authenticateToken. */
function requireSuperAdmin(req, res, next) {
	if (!isSuperAdminUser(req.user)) {
		return res.status(403).json({ success: false, message: 'Forbidden' })
	}
	next()
}

module.exports = requireSuperAdmin
