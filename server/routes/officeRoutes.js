const express = require('express')
const router = express.Router()
const controller = require('../controllers/officeController')
const { officeInviteLimiter } = require('../utils/rateLimiters')

// Montowane pod /api/biuro z authenticateToken (server/index.js). Odczyt danych firmy zapisuje wpis w historii jej
// dostępu, więc żądania wysłane z obcych stron (np. obrazek z linkiem) odrzucamy — wpisy muszą być prawdziwe.
// Eksport idzie POST-em (ochrona CSRF); pozostałe zapisy dotyczą tylko zaproszeń i powiązań samego biura.
router.use((req, res, next) => {
	if (req.get('sec-fetch-site') === 'cross-site') return res.status(403).json({ success: false, message: 'Forbidden' })
	next()
})
router.get('/me', controller.officeMe)
router.get('/clients', controller.clients)
router.get('/clients/:clientTeamId/month', controller.clientMonth)
router.post('/clients/:clientTeamId/export', controller.clientMonthExport)
router.post('/invites', officeInviteLimiter, controller.invite)
router.post('/links/:id/end', controller.officeEnd)

module.exports = router
