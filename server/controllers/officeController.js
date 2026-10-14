const officeAccessService = require('../services/officeAccessService')

// Biuro rachunkowe: strona firmy (/api/office-links) i strona biura (/api/biuro); logika w officeAccessService
function handle(fn) {
	return async (req, res) => {
		try {
			res.json({ success: true, ...(await fn(req)) })
		} catch (error) {
			if (error.status) return res.status(error.status).json({ success: false, message: error.message, code: error.code || null })
			console.error('[office]', error)
			res.status(500).json({ success: false, message: 'Błąd serwera' })
		}
	}
}

const meta = req => ({ ip: req.ip, userAgent: req.get('user-agent') })

// Firma (Admin)
exports.companyLinks = handle(req => officeAccessService.companyLinks(req.user))
exports.connect = handle(req => officeAccessService.connectByCode(req.user, { code: req.body?.code, consent: req.body?.consent }, meta(req)))
exports.accept = handle(req => officeAccessService.acceptInvite(req.user, req.params.id, { consent: req.body?.consent }, meta(req)))
exports.companyEnd = handle(req => officeAccessService.companyEndLink(req.user, req.params.id))

// Biuro (Admin/HR biura)
exports.officeMe = handle(req => officeAccessService.officeMe(req.user))
exports.clients = handle(req => officeAccessService.officeClients(req.user))
exports.invite = handle(req => officeAccessService.inviteCompany(req.user, { email: req.body?.email }))
exports.officeEnd = handle(req => officeAccessService.officeEndLink(req.user, req.params.id))
exports.clientMonth = handle(req => officeAccessService.clientMonth(req.user, req.params.clientTeamId, req.query, req.ip))
