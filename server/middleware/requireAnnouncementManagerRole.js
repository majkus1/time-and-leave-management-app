const { hasAnnouncementManagerRole } = require('../utils/announcementAccess')

/** Komunikaty — dodawanie: Administrator, HR lub Przełożony. */
module.exports = function requireAnnouncementManagerRole(req, res, next) {
	const roles = req.user?.roles || []
	if (!hasAnnouncementManagerRole(roles)) {
		return res.status(403).json({
			success: false,
			message: 'Wymagana rola Administrator, HR lub Przełożony.',
			code: 'ANNOUNCEMENT_ROLE_REQUIRED',
		})
	}
	next()
}
