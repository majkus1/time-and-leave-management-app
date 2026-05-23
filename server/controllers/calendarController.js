const { firmDb } = require('../db/db')
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const User = require('../models/user')(firmDb)
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

exports.getCalendarConfirmationDetails = async (req, res) => {
	const month = Number(req.query.month)
	const year = Number(req.query.year)
	const targetUserId = req.params.userId || req.user.userId

	if (!Number.isInteger(month) || month < 0 || month > 11 || !Number.isInteger(year) || year < 2000 || year > 2100) {
		return res.status(400).json({ message: 'Invalid month or year.' })
	}

	try {
		if (req.params.userId) {
			const access = await resolveTeamScopedTimesheetViewAccess(req.user.userId, targetUserId)
			if (access.error) {
				return sendTeamScopedTimesheetViewAccessError(res, access.error)
			}
		}

		const confirmation = await CalendarConfirmation.findOne({
			userId: targetUserId,
			month,
			year,
		}).lean()

		let confirmedBy = null
		if (confirmation?.confirmedBy) {
			const confirmedByUser = await User.findById(confirmation.confirmedBy).select('firstName lastName').lean()
			if (confirmedByUser) {
				confirmedBy = {
					firstName: confirmedByUser.firstName || '',
					lastName: confirmedByUser.lastName || '',
				}
			}
		}

		const monthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
		const monthEnd = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))
		const latestChangedWorkday = await Workday.findOne({
			userId: targetUserId,
			date: { $gte: monthStart, $lte: monthEnd },
		})
			.sort({ updatedAt: -1, createdAt: -1, _id: -1 })
			.select('updatedAt createdAt lastChangedBy')
			.lean()

		let lastWorkdayChangedBy = null
		if (latestChangedWorkday?.lastChangedBy) {
			const lastChangedByUser = await User.findById(latestChangedWorkday.lastChangedBy).select('firstName lastName').lean()
			if (lastChangedByUser) {
				lastWorkdayChangedBy = {
					firstName: lastChangedByUser.firstName || '',
					lastName: lastChangedByUser.lastName || '',
				}
			}
		}

		return res.status(200).json({
			isConfirmed: confirmation ? !!confirmation.isConfirmed : false,
			confirmedAt: confirmation?.confirmedAt || null,
			confirmedBy,
			lastWorkdayChangeAt: latestChangedWorkday?.updatedAt || latestChangedWorkday?.createdAt || null,
			lastWorkdayChangedBy,
		})
	} catch (error) {
		console.error('Error checking calendar confirmation details:', error)
		return res.status(500).send('Failed to check calendar confirmation details.')
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
			if (isConfirmed) {
				confirmation.confirmedAt = new Date()
				confirmation.confirmedBy = req.user.userId
			} else {
				confirmation.confirmedAt = null
				confirmation.confirmedBy = null
			}
		} else {
			confirmation = new CalendarConfirmation({
				userId,
				month,
				year,
				isConfirmed,
				confirmedAt: isConfirmed ? new Date() : null,
				confirmedBy: isConfirmed ? req.user.userId : null,
			})
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
