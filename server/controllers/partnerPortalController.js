const partnerPortalService = require('../services/partnerPortalService')

// Panel partnera (Admin/HR zespołu partnera) — tylko odczyt; zakres ustala serwis z req.user.teamId
function handle(fn) {
	return async (req, res) => {
		try {
			res.json({ success: true, ...(await fn(req)) })
		} catch (error) {
			if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code || null })
			console.error('[partnerPortal]', error)
			res.status(500).json({ success: false, message: 'Błąd serwera' })
		}
	}
}

exports.me = handle(req => partnerPortalService.me(req.user))
exports.overview = handle(req => partnerPortalService.overview(req.user))
exports.entries = handle(req => partnerPortalService.entries(req.user, req.query.month))
