const express = require('express')
const router = express.Router()
const ticketController = require('../controllers/ticketController')
const { authenticateToken } = require('../middleware/authMiddleware') // Twój middleware JWT
const { arrayAttachmentUpload } = require('../utils/attachmentUpload')

const uploadTicketAttachments = arrayAttachmentUpload('attachments', 5)

router.post('/create', authenticateToken, uploadTicketAttachments, ticketController.createTicket)


router.get('/my-tickets', authenticateToken, ticketController.getMyTickets)


router.get('/all', authenticateToken, ticketController.getAllTickets)


router.get('/:id', authenticateToken, ticketController.getTicketById)


router.post('/:id/reply', authenticateToken, uploadTicketAttachments, ticketController.replyToTicket)


router.patch('/:id/status', authenticateToken, ticketController.updateTicketStatus)

module.exports = router
