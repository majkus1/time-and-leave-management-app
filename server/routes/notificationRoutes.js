const express = require('express')
const router = express.Router()
const { authenticateToken } = require('../middleware/authMiddleware')
const {
	listForUser,
	unreadCountForUser,
	markRead,
	markAllRead,
} = require('../services/userNotificationService')

router.get('/', authenticateToken, async (req, res) => {
	try {
		const limit = Math.min(parseInt(req.query.limit, 10) || 40, 80)
		const [items, unread] = await Promise.all([
			listForUser(req.user.userId, req.user.teamId, { limit }),
			unreadCountForUser(req.user.userId, req.user.teamId),
		])
		res.json({ items, unread })
	} catch (error) {
		console.error('[notifications] GET /', error)
		res.status(500).json({ message: 'Failed to load notifications' })
	}
})

router.patch('/:id/read', authenticateToken, async (req, res) => {
	try {
		const ok = await markRead(req.user.userId, req.user.teamId, req.params.id)
		if (!ok) return res.status(404).json({ message: 'Not found' })
		const unread = await unreadCountForUser(req.user.userId, req.user.teamId)
		res.json({ ok: true, unread })
	} catch (error) {
		console.error('[notifications] PATCH read', error)
		res.status(500).json({ message: 'Failed to update notification' })
	}
})

router.post('/read-all', authenticateToken, async (req, res) => {
	try {
		await markAllRead(req.user.userId, req.user.teamId)
		res.json({ ok: true, unread: 0 })
	} catch (error) {
		console.error('[notifications] POST read-all', error)
		res.status(500).json({ message: 'Failed to mark all read' })
	}
})

module.exports = router
