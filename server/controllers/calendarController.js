const { firmDb } = require('../db/db')
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)

exports.getCalendarConfirmationStatus = async (req, res) => {
	const { month, year } = req.query
	const userId = req.params.userId || req.user.userId

	try {
		const confirmation = await CalendarConfirmation.findOne({ userId, month, year })
		res.status(200).json({ isConfirmed: confirmation ? confirmation.isConfirmed : false })
	} catch (error) {
		console.error('Error checking calendar confirmation status:', error)
		res.status(500).send('Failed to check calendar confirmation status.')
	}
}

exports.confirmCalendar = async (req, res) => {
	const { month, year, isConfirmed } = req.body
	const userId = req.user.userId

	try {
		let confirmation = await CalendarConfirmation.findOne({ userId, month, year })

		if (confirmation) {
			confirmation.isConfirmed = isConfirmed
		} else {
			confirmation = new CalendarConfirmation({ userId, month, year, isConfirmed })
		}

		await confirmation.save()

		// Real-time sync:
		// 1) notify this user on all their active sessions/devices
		// 2) notify whole team so Admin/HR viewing another user's calendar gets instant update
		const io = req.app?.io
		if (io) {
			const payload = {
				userId: userId.toString(),
				month: Number(month),
				year: Number(year),
				isConfirmed: !!isConfirmed,
			}
			io.to(`user:${userId}`).emit('calendar-confirmation-updated', payload)
			if (req.user?.teamId) {
				io.to(`team:${req.user.teamId}`).emit('calendar-confirmation-updated', payload)
			}
		}

		res.status(200).json({ message: 'Calendar confirmation status updated successfully.' })
	} catch (error) {
		console.error('Error updating calendar confirmation status:', error)
		res.status(500).send('Failed to update calendar confirmation status.')
	}
}
