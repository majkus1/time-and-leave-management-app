const { firmDb } = require('../db/db')
const Announcement = require('../models/Announcement')(firmDb)
const User = require('../models/user')(firmDb)
const EmailNotificationPreference = require('../models/EmailNotificationPreference')(firmDb)
const { sendEmail, getEmailTemplate, escapeHtml } = require('../services/emailService')
const { sendAnnouncementPushNotification } = require('../services/pushNotificationService')
const { appUrl } = require('../config')
const fs = require('fs').promises
const path = require('path')
const mongoose = require('mongoose')

const parseTargetUsers = (value) => {
	if (!value) return []
	if (Array.isArray(value)) return value
	if (typeof value === 'string') {
		try {
			const parsed = JSON.parse(value)
			if (Array.isArray(parsed)) return parsed
		} catch (error) {
			// Ignore parse error and fallback below
		}
		return value
			.split(',')
			.map((item) => item.trim())
			.filter(Boolean)
	}
	return []
}

const cleanupUploadedFiles = async (files = []) => {
	if (!Array.isArray(files) || files.length === 0) return
	await Promise.allSettled(
		files.map(async (file) => {
			if (!file?.filename) return
			const filePath = path.join(__dirname, '..', 'uploads', file.filename)
			await fs.unlink(filePath)
		})
	)
}

const toObjectIdStrings = (values = []) => values.map((v) => (v?.toString ? v.toString() : String(v)))

const getRecipientsForScope = async ({ teamId, targetScope, targetDepartment, targetUsers }) => {
	const baseActiveQuery = {
		teamId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}

	if (targetScope === 'all') {
		return User.find(baseActiveQuery).select('_id username firstName lastName')
	}

	if (targetScope === 'department') {
		if (!targetDepartment) return []
		return User.find({
			...baseActiveQuery,
			$and: [
				{
					$or: [
						{ department: targetDepartment },
						{ department: { $in: [targetDepartment] } },
					],
				},
			],
		}).select('_id username firstName lastName')
	}

	if (targetScope === 'users') {
		if (!Array.isArray(targetUsers) || targetUsers.length === 0) return []
		return User.find({
			...baseActiveQuery,
			_id: { $in: targetUsers },
		}).select('_id username firstName lastName')
	}

	return []
}

const emitAnnouncementsUpdated = (req) => {
	if (req.app?.io && req.user?.teamId) {
		req.app.io.to(`team:${req.user.teamId}`).emit('announcements-updated')
	}
}

const getUserDepartments = (user) =>
	Array.isArray(user?.department) ? user.department : user?.department ? [user.department] : []

const buildAnnouncementsVisibilityQuery = ({ teamId, userId, isAdmin, userDepartments }) => {
	if (isAdmin) {
		return { teamId }
	}

	return {
		teamId,
		$or: [
			{ createdBy: userId },
			{ targetScope: 'all' },
			{
				targetScope: 'department',
				targetDepartment: { $in: userDepartments },
			},
			{
				targetScope: 'users',
				targetUsers: userId,
			},
		],
	}
}

exports.getAnnouncements = async (req, res) => {
	try {
		const { userId, teamId, roles = [] } = req.user
		const isAdmin = Array.isArray(roles) && roles.includes('Admin')
		const user = await User.findById(userId).select('department')
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const userDepartments = getUserDepartments(user)
		const query = buildAnnouncementsVisibilityQuery({ teamId, userId, isAdmin, userDepartments })

		const announcements = await Announcement.find(query)
			.sort({ createdAt: -1 })
			.populate({
				path: 'createdBy',
				select: 'firstName lastName username',
			})
			.populate({
				path: 'targetUsers',
				select: 'firstName lastName username',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] },
			})

		return res.json(announcements)
	} catch (error) {
		console.error('Error getting announcements:', error)
		return res.status(500).json({ message: 'Failed to get announcements' })
	}
}

exports.getUnreadAnnouncementsCount = async (req, res) => {
	try {
		const { userId, teamId, roles = [] } = req.user
		const isAdmin = Array.isArray(roles) && roles.includes('Admin')
		const user = await User.findById(userId).select('department announcementsLastSeenAt')

		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const userDepartments = getUserDepartments(user)
		const visibilityQuery = buildAnnouncementsVisibilityQuery({ teamId, userId, isAdmin, userDepartments })
		const unreadQuery = {
			...visibilityQuery,
			createdBy: { $ne: userId },
		}

		if (user.announcementsLastSeenAt) {
			unreadQuery.createdAt = { $gt: user.announcementsLastSeenAt }
		}

		const unreadCount = await Announcement.countDocuments(unreadQuery)
		return res.json({ unreadCount })
	} catch (error) {
		console.error('Error getting unread announcements count:', error)
		return res.status(500).json({ message: 'Failed to get unread announcements count' })
	}
}

exports.markAnnouncementsSeen = async (req, res) => {
	try {
		const { userId } = req.user
		await User.findByIdAndUpdate(userId, { announcementsLastSeenAt: new Date() })
		return res.json({ message: 'Announcements marked as seen' })
	} catch (error) {
		console.error('Error marking announcements as seen:', error)
		return res.status(500).json({ message: 'Failed to mark announcements as seen' })
	}
}

exports.createAnnouncement = async (req, res) => {
	const uploadedFiles = Array.isArray(req.files) ? req.files : []
	try {
		const { teamId, userId } = req.user
		const rawTitle = typeof req.body?.title === 'string' ? req.body.title.trim() : ''
		const rawContent = typeof req.body?.content === 'string' ? req.body.content.trim() : ''
		const targetScope = typeof req.body?.targetScope === 'string' ? req.body.targetScope.trim() : 'all'
		const targetDepartment =
			typeof req.body?.targetDepartment === 'string' ? req.body.targetDepartment.trim() : ''
		const targetUsersRaw = parseTargetUsers(req.body?.targetUsers)

		if (!rawTitle) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'Title is required' })
		}
		if (!rawContent) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'Content is required' })
		}
		if (!['all', 'department', 'users'].includes(targetScope)) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'Invalid target scope' })
		}
		if (targetScope === 'department' && !targetDepartment) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'Department is required for department target scope' })
		}

		const validTargetUsers = targetUsersRaw
			.filter((id) => mongoose.Types.ObjectId.isValid(id))
			.map((id) => new mongoose.Types.ObjectId(id))

		if (targetScope === 'users' && validTargetUsers.length === 0) {
			await cleanupUploadedFiles(uploadedFiles)
			return res.status(400).json({ message: 'At least one user is required for user target scope' })
		}

		if (targetScope === 'users') {
			const usersCount = await User.countDocuments({
				_id: { $in: validTargetUsers },
				teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
			})
			if (usersCount !== validTargetUsers.length) {
				await cleanupUploadedFiles(uploadedFiles)
				return res.status(400).json({ message: 'One or more selected users are invalid' })
			}
		}

		const attachments = uploadedFiles.map((file) => ({
			filename: file.originalname,
			path: file.filename,
			mimeType: file.mimetype,
			size: file.size,
		}))

		const announcement = await Announcement.create({
			teamId,
			createdBy: userId,
			title: rawTitle,
			content: rawContent,
			attachments,
			targetScope,
			targetDepartment: targetScope === 'department' ? targetDepartment : null,
			targetUsers: targetScope === 'users' ? validTargetUsers : [],
		})

		const populatedAnnouncement = await Announcement.findById(announcement._id)
			.populate({ path: 'createdBy', select: 'firstName lastName username' })
			.populate({ path: 'targetUsers', select: 'firstName lastName username' })

		emitAnnouncementsUpdated(req)

		// Notifications (non-blocking for API response correctness)
		const creator = await User.findById(userId).select('firstName lastName username')
		const recipients = await getRecipientsForScope({
			teamId,
			targetScope,
			targetDepartment: targetScope === 'department' ? targetDepartment : null,
			targetUsers: targetScope === 'users' ? validTargetUsers : [],
		})
		const recipientIds = toObjectIdStrings(recipients.map((recipient) => recipient._id)).filter(
			(id) => id !== userId.toString()
		)

		if (recipientIds.length > 0) {
			const t = req.t
			const creatorName =
				creator?.firstName && creator?.lastName
					? `${creator.firstName} ${creator.lastName}`
					: creator?.username || 'User'
			const targetLabel =
				targetScope === 'all'
					? t('announcements.targetAll') || 'All team members'
					: targetScope === 'department'
						? `${t('announcements.targetDepartment') || 'Department'}: ${escapeHtml(targetDepartment)}`
						: t('announcements.targetUsers') || 'Selected users'

			const emailSubject = `${t('announcements.emailSubjectPrefix') || 'Nowy komunikat'}: ${rawTitle}`
			const contentWithBreaks = escapeHtml(rawContent).replace(/\n/g, '<br/>')
			const attachmentsHtml =
				attachments.length > 0
					? `
						<p style="margin: 16px 0 8px 0; font-weight: 600;">${t('announcements.attachments') || 'Załączniki'}:</p>
						<ul style="margin: 0 0 0 18px; padding: 0;">
							${attachments
								.map(
									(file) =>
										`<li style="margin: 6px 0;"><a href="${appUrl}/uploads/${encodeURIComponent(file.path)}" target="_blank" rel="noopener noreferrer">${escapeHtml(file.filename)}</a></li>`
								)
								.join('')}
						</ul>
					`
					: ''

			const emailHtml = getEmailTemplate(
				escapeHtml(rawTitle),
				`
					<p style="margin: 0 0 12px 0;"><strong>${t('announcements.createdBy') || 'Autor'}:</strong> ${escapeHtml(creatorName)}</p>
					<p style="margin: 0 0 12px 0;"><strong>${t('announcements.recipients') || 'Odbiorcy'}:</strong> ${targetLabel}</p>
					<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; border-radius: 6px; margin: 16px 0;">
						${contentWithBreaks}
					</div>
					${attachmentsHtml}
				`,
				t('announcements.openInApp') || 'Przejdź do komunikatów',
				`${appUrl}/announcements`,
				t
			)

			const snippet = String(rawContent || '')
				.replace(/\s+/g, ' ')
				.trim()
				.slice(0, 220)
			const announcementPreview = `${creatorName} · ${rawTitle}${snippet ? ` — ${snippet}` : ''}`
			const emailRecipientIds = recipients
				.filter((recipient) => recipient._id.toString() !== userId.toString())
				.map((recipient) => recipient._id.toString())
			const preferenceDocs = await EmailNotificationPreference.find({
				teamId,
				userId: { $in: emailRecipientIds },
			}).select('userId preferences')
			const preferenceMap = new Map(
				preferenceDocs.map((doc) => [doc.userId.toString(), doc.preferences || {}])
			)
			const emailRecipients = recipients.filter((recipient) => {
				if (recipient._id.toString() === userId.toString()) return false
				const prefs = preferenceMap.get(recipient._id.toString())
				return !prefs || prefs.announcements !== false
			})

			Promise.allSettled(
				emailRecipients
					.map((recipient) =>
						sendEmail(recipient.username, `${appUrl}/announcements`, emailSubject, emailHtml, {
							teamId,
							preview: announcementPreview,
						})
					)
			).catch((error) => {
				console.error('Error sending announcement emails:', error)
			})

			sendAnnouncementPushNotification(
				{
					announcement: {
						_id: announcement._id,
						title: rawTitle,
						content: rawContent,
					},
					createdByName: creatorName,
					recipientUserIds: recipientIds,
					t,
				}
			).catch((error) => {
				console.error('Error sending announcement push notifications:', error)
			})
		}

		return res.status(201).json(populatedAnnouncement)
	} catch (error) {
		await cleanupUploadedFiles(uploadedFiles)
		console.error('Error creating announcement:', error)
		return res.status(500).json({ message: 'Failed to create announcement' })
	}
}

exports.deleteAnnouncement = async (req, res) => {
	try {
		const { announcementId } = req.params
		const { userId, teamId } = req.user

		if (!mongoose.Types.ObjectId.isValid(announcementId)) {
			return res.status(400).json({ message: 'Invalid announcement ID' })
		}

		const announcement = await Announcement.findById(announcementId)
		if (!announcement) {
			return res.status(404).json({ message: 'Announcement not found' })
		}

		if (announcement.teamId.toString() !== teamId.toString()) {
			return res.status(403).json({ message: 'Access denied' })
		}

		if (announcement.createdBy.toString() !== userId.toString()) {
			return res.status(403).json({ message: 'Only the author can delete this announcement' })
		}

		const attachments = Array.isArray(announcement.attachments) ? announcement.attachments : []
		await Promise.allSettled(
			attachments.map(async (file) => {
				if (!file?.path) return
				const filePath = path.join(__dirname, '..', 'uploads', file.path)
				await fs.unlink(filePath)
			})
		)

		await Announcement.findByIdAndDelete(announcementId)
		emitAnnouncementsUpdated(req)

		return res.json({ message: 'Announcement deleted successfully' })
	} catch (error) {
		console.error('Error deleting announcement:', error)
		return res.status(500).json({ message: 'Failed to delete announcement' })
	}
}
