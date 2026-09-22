const founderCallService = require('../services/founderCallService')

function sendError(res, error, label) {
	if (error.code === 'FORBIDDEN') return res.status(403).json({ success: false, message: 'Forbidden', code: 'FORBIDDEN' })
	if (error.code === 'SLOT_TAKEN' || error.code === 'ALREADY_BOOKED') {
		return res.status(409).json({ success: false, message: error.message, code: error.code })
	}
	console.error(`[founderCall] ${label}:`, error)
	return res.status(500).json({ success: false, message: 'Server error' })
}

exports.getAvailability = async (req, res) => {
	try {
		return res.json(await founderCallService.getAvailability({ teamId: req.user.teamId }))
	} catch (error) {
		return sendError(res, error, 'getAvailability')
	}
}

/** Publiczne (landing, bez logowania): wolne terminy — same daty, żadnych danych rezerwujących. */
exports.getPublicSlots = async (req, res) => {
	try {
		res.set('Cache-Control', 'public, max-age=60')
		return res.json(await founderCallService.getPublicSlots())
	} catch (error) {
		return sendError(res, error, 'getPublicSlots')
	}
}

exports.book = async (req, res) => {
	try {
		const { slotStart, phone, note } = req.body || {}
		if (!slotStart) return res.status(400).json({ success: false, message: 'slotStart is required', code: 'VALIDATION' })
		const result = await founderCallService.bookSlot({
			teamId: req.user.teamId,
			userId: req.user.userId,
			slotStart,
			phone,
			note,
		})
		return res.json({ success: true, booking: result })
	} catch (error) {
		return sendError(res, error, 'book')
	}
}

exports.cancel = async (req, res) => {
	try {
		return res.json(await founderCallService.cancelMyBooking({ teamId: req.user.teamId }))
	} catch (error) {
		return sendError(res, error, 'cancel')
	}
}
