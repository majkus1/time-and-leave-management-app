const partnerService = require('../services/partnerService')

// Panel admina programu partnerskiego (tylko właściciel platformy — requireSuperAdmin w index.js)
function handle(fn) {
	return async (req, res) => {
		try {
			res.json({ success: true, ...(await fn(req)) })
		} catch (error) {
			if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code || null })
			console.error('[superPartner]', error)
			res.status(500).json({ success: false, message: 'Błąd serwera' })
		}
	}
}

exports.list = handle(async () => ({ partners: await partnerService.listPartners() }))
exports.create = handle(async req => ({ partner: await partnerService.createPartner(req.body) }))
exports.update = handle(async req => ({ partner: await partnerService.updatePartner(req.params.id, req.body) }))
exports.referredTeams = handle(async req => ({ teams: await partnerService.listReferredTeams(req.params.id) }))
exports.searchTeams = handle(async req => ({ teams: await partnerService.searchTeams(req.query.q) }))
exports.assignTeam = handle(async req => partnerService.assignTeamToPartner(req.params.teamId, req.body?.partnerId ?? null))
