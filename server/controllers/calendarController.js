const { firmDb } = require('../db/db')
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const {
	resolveTeamScopedTimesheetViewAccess,
	sendTeamScopedTimesheetViewAccessError,
} = require('../utils/timesheetAccess')
const {
	resolveTeamScopedTimesheetWriteAccess,
	sendTeamScopedTimesheetWriteAccessError,
} = require('../utils/timesheetWriteAccess')

exports.getCalendarConfirmationStatus = async (req, res) => {
	const { month, year } = req.query
	const targetUserId = req.params.userId || req.user.userId

	try {
		if (req.params.userId) {
			const access = await resolveTeamScopedTimesheetViewAccess(
				req.user.userId,
				targetUserId
			)
			if (access.error) {
				return sendTeamScopedTimesheetViewAccessError(res, access.error)
			}
		}

		const confirmation = await CalendarConfirmation.findOne({
			userId: targetUserId,
			month,
			year,
		})
		res.status(200).json({ isConfirmed: confirmation ? confirmation.isConfirmed : false })
	} catch (error) {
		console.error('Error checking calendar confirmation status:', error)
		res.status(500).send('Failed to check calendar confirmation status.')
	}
}

exports.confirmCalendar = async (req, res) => {
	const { month, year, isConfirmed, userId: targetUserId } = req.body
	let userId = req.user.userId
	let writeAccess = null

	try {
		if (targetUserId && String(targetUserId) !== String(req.user.userId)) {
			writeAccess = await resolveTeamScopedTimesheetWriteAccess(req.user.userId, targetUserId)
			if (writeAccess.error) {
				return sendTeamScopedTimesheetWriteAccessError(res, writeAccess.error, { asJson: true })
			}
			userId = writeAccess.targetUser._id
		}

		let confirmation = await CalendarConfirmation.findOne({ userId, month, year })

		if (confirmation) {
			confirmation.isConfirmed = isConfirmed
		} else {
			confirmation = new CalendarConfirmation({ userId, month, year, isConfirmed })
		}

		await confirmation.save()

		if (writeAccess && isConfirmed === true) {
			const monthNumber = Number(month)
			const yearNumber = Number(year)
			const monthStart = new Date(yearNumber, monthNumber, 1)
			const monthEnd = new Date(yearNumber, monthNumber + 1, 1)

			await Workday.updateMany(
				{
					userId,
					date: { $gte: monthStart, $lt: monthEnd },
					$or: [
						{ hoursWorked: { $ne: null } },
						{ additionalWorked: { $ne: null } },
						{ realTimeDayWorked: { $nin: [null, ''] } },
						{ absenceType: { $nin: [null, ''] } },
						{ notes: { $nin: [null, ''] } },
					],
				},
				{
					$set: {
						reviewStatus: 'approved',
						reviewedBy: writeAccess.requestingUser._id,
						reviewedAt: new Date(),
					},
				}
			)
		}

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
