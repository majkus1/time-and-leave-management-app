const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticketController')
const { authenticateToken } = require('../middleware/authMiddleware')
const requireAppAdminRole = require('../middleware/requireAppAdminRole')
const { arrayAttachmentUpload } = require('../utils/attachmentUpload')

const uploadTicketAttachments = arrayAttachmentUpload('attachments', 5)

router.post(
	'/create',
	authenticateToken,
	requireAppAdminRole,
	uploadTicketAttachments,
	ticketController.createTicket
)

router.get('/my-tickets', authenticateToken, requireAppAdminRole, ticketController.getMyTickets)

router.get('/all', authenticateToken, requireAppAdminRole, ticketController.getAllTickets)

router.get('/:id', authenticateToken, requireAppAdminRole, ticketController.getTicketById)

router.post(
	'/:id/reply',
	authenticateToken,
	requireAppAdminRole,
	uploadTicketAttachments,
	ticketController.replyToTicket
)

router.patch('/:id/status', authenticateToken, requireAppAdminRole, ticketController.updateTicketStatus)

module.exports = router
