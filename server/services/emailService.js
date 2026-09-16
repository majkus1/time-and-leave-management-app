const nodemailer = require('nodemailer')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const EmailNotificationPreference = require('../models/EmailNotificationPreference')(firmDb)
const { appUrl } = require('../config')
const { getLeaveRequestTypeName } = require('../utils/leaveRequestTypes')
const { formatLeaveQuantityValue, getLeaveRequestQuantityLabel } = require('../utils/leaveSettlement')
const { getLeaveStatusText } = require('../utils/leaveStatusText')
const { formatTaskScheduleForNotification } = require('../utils/taskScheduleTime')

/** Powiadomienia wewnętrzne: nowe zgłoszenia / aktywność w dyskusji Help Center */
const HELP_CENTER_STAFF_EMAILS = ['planopiaapp@gmail.com', 'michalipka1@gmail.com']
const DEFAULT_EMAIL_NOTIFICATION_PREFERENCES = {
	chat: true,
	tasks: true,
	taskStatusChanges: true,
	taskComments: true,
	leaves: true,
	announcements: true,
	schedulePublished: true,
}

const formatYmd = (value) => {
	const d = new Date(value)
	if (Number.isNaN(d.getTime())) return ''
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

async function filterUsersByEmailPreference(users, teamId, preferenceKey) {
	if (!Array.isArray(users) || users.length === 0) return []
	if (!preferenceKey) return users

	const userIds = users
		.map((user) => (user?._id && user._id.toString ? user._id.toString() : null))
		.filter(Boolean)

	if (userIds.length === 0) return []

	const prefs = await EmailNotificationPreference.find({
		teamId,
		userId: { $in: userIds },
	}).select('userId preferences')
	const prefMap = new Map(
		prefs.map((doc) => [doc.userId?.toString?.() || String(doc.userId), doc.preferences || {}])
	)

	return users.filter((user) => {
		const userId = user?._id && user._id.toString ? user._id.toString() : null
		if (!userId) return false
		const pref = prefMap.get(userId) || DEFAULT_EMAIL_NOTIFICATION_PREFERENCES
		return pref[preferenceKey] !== false
	})
}

function normalizeEmailRecipients(to) {
	if (to == null || to === '') return []
	const raw = Array.isArray(to) ? to : String(to).split(/[,;]/).map((s) => s.trim()).filter(Boolean)
	const seen = new Set()
	const out = []
	for (const e of raw) {
		const k = e.toLowerCase()
		if (seen.has(k)) continue
		seen.add(k)
		out.push(e)
	}
	return out
}

// Funkcja escapująca HTML dla bezpieczeństwa (ochrona przed XSS)
const escapeHtml = (text) => {
	if (!text) return ''
	return String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

// Funkcja generująca profesjonalny szablon email HTML
const getEmailTemplate = (title, content, buttonText = null, buttonLink = null, t = null) => {
	// Jeśli funkcja tłumaczeń jest dostępna, użyj jej, w przeciwnym razie użyj domyślnych tekstów polskich
	const footerNotification = t ? t('email.leaveRequest.footerNotification') : 'To powiadomienie zostało wysłane automatycznie z systemu Planopia.'
	const footerCopyright = t ? t('email.leaveRequest.footerCopyright').replace('{{year}}', new Date().getFullYear()) : `© ${new Date().getFullYear()} Planopia. Wszelkie prawa zastrzeżone.`
	const lang = t ? (t('email.leaveRequest.footerNotification').includes('automatycznie') ? 'pl' : 'en') : 'pl'
	
	return `
<!DOCTYPE html>
<html lang="${lang}">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
	<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
					<!-- Header -->
					<tr>
						<td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">Planopia</h1>
						</td>
					</tr>
					<!-- Content -->
					<tr>
						<td style="padding: 40px 40px 30px 40px;">
							<h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600; line-height: 1.3;">${escapeHtml(title)}</h2>
							<div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
								${content}
							</div>
							${buttonText && buttonLink ? `
							<table role="presentation" style="width: 100%; margin-top: 30px;">
								<tr>
									<td align="center" style="padding: 20px 0;">
										<a href="${buttonLink}" style="display: inline-block; padding: 14px 32px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; text-align: center;">${escapeHtml(buttonText)}</a>
									</td>
								</tr>
							</table>
							` : ''}
						</td>
					</tr>
					<!-- Footer -->
					<tr>
						<td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
								${footerNotification}<br>
								<span style="color: #9ca3af;">${footerCopyright}</span>
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`
}

const sendEmail = async (to, link, subject, html, meta = {}) => {
	const recipients = normalizeEmailRecipients(to)
	if (recipients.length === 0) return

	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	})

	const fromEmail = (process.env.EMAIL_USER || 'michalipka1@gmail.com').trim()
	await transporter.sendMail({
		from: `"Planopia" <${fromEmail}>`,
		to: recipients.length === 1 ? recipients[0] : recipients,
		subject,
		html,
	})

	const teamId = meta && meta.teamId
	if (teamId) {
		const { recordEmailNotificationsForTeam } = require('./userNotificationService')
		void recordEmailNotificationsForTeam(teamId, recipients, {
			subject,
			link: link || null,
			preview: meta.preview != null && meta.preview !== '' ? String(meta.preview) : null,
		})
	}
}


const sendEmailToHR = async (leaveRequest, user, updatedByUser, t, updatedByInfo, teamId) => {
	try {
		const hrUsers = await User.find({
			teamId, 
			roles: { $in: ['HR'] },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('_id username firstName lastName')

		// Nigdy nie wysyłaj "HR notification" do autora wniosku.
		let usersToNotify = hrUsers.filter(hr => hr.username !== user.username)

		// Jeśli nie znaleziono HR (lub po wykluczeniu autora nie ma odbiorców), wyślij do Adminów jako fallback
		if (hrUsers.length === 0) {
			const adminUsers = await User.find({
				teamId,
				roles: { $in: ['Admin'] },
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('_id username firstName lastName')

			// Usuń użytkownika który złożył wniosek jeśli jest adminem (nie powinien dostawać powiadomienia o swojej własnej zmianie statusu)
			usersToNotify = adminUsers.filter(admin => admin.username !== user.username)

			if (usersToNotify.length === 0) {
				return
			}
		usersToNotify = await filterUsersByEmailPreference(usersToNotify, teamId, 'leaves')
		if (usersToNotify.length === 0) {
			return
		}
		}

		const startDate = leaveRequest.startDate.toISOString().split('T')[0]
		const endDate = leaveRequest.endDate.toISOString().split('T')[0]
		const statusText = getLeaveStatusText(leaveRequest.status, t, 'requestFeminine')
		const requestWord = t('email.leaveRequest.requestWord') || 'wniosek'
		const statusWithRequestWord = `${requestWord} ${statusText}`
		
		// Pobierz Settings dla zespołu i nazwę typu
		const settings = await Settings.getSettings(teamId)
		const language = t('email.leaveRequest.footerNotification').includes('automatycznie') ? 'pl' : 'en'
		const typeText = getLeaveRequestTypeName(settings, leaveRequest.type, t, language)
		
		const content = `
			<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
				<p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">${t('email.leaveRequest.requestDetails')}</p>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${t('email.leaveRequest.employee')}:</td>
						<td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveRequest.type')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${typeText}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveRequest.dates')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${startDate} - ${endDate}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${getLeaveRequestQuantityLabel(leaveRequest, settings, { days: t('email.leaveRequest.days') || 'Dni', hours: t('email.leaveRequest.hours') || 'Godziny' })}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${formatLeaveQuantityValue(leaveRequest, settings)}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveRequest.updatedBy')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(updatedByUser.firstName)} ${escapeHtml(updatedByUser.lastName)}</td>
					</tr>
				</table>
			</div>
		`
		
		const employee = `${user.firstName || ''} ${user.lastName || ''}`.trim()
		const by = `${updatedByUser.firstName || ''} ${updatedByUser.lastName || ''}`.trim()
		const inboxPreview = `${employee} · ${typeText} · ${startDate}–${endDate} · ${statusWithRequestWord} · ${t('email.leaveRequest.updatedBy')}: ${by}`

		const emailPromises = usersToNotify.map(notifyUser =>
			sendEmail(
				notifyUser.username,
				`${appUrl}/leave-requests/${user._id}`,
				`${typeText} - ${statusWithRequestWord}`,
				getEmailTemplate(
					`${typeText} - ${statusWithRequestWord}`,
					content,
					t('email.leaveRequest.goToRequest'),
					`${appUrl}/leave-requests/${user._id}`,
					t
				),
				{ teamId, preview: inboxPreview }
			)
		)

		await Promise.all(emailPromises)
	} catch (error) {
		console.error('Błąd podczas wysyłania maila do HR:', error)
	}
}

// Send task notification to board members
const sendTaskNotification = async (task, board, recipientUserIds, createdByUser, t, isStatusChange = false) => {
	try {
		const uniqueRecipientIds = Array.isArray(recipientUserIds)
			? Array.from(new Set(recipientUserIds.map(id => (id && id.toString ? id.toString() : String(id)))))
			: []
		const filteredRecipientIds = uniqueRecipientIds.filter(id => id !== createdByUser._id.toString())

		if (filteredRecipientIds.length === 0) {
			return
		}
		
		// Get member users (only active)
		let members = await User.find({ 
			_id: { $in: filteredRecipientIds },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('_id username firstName lastName')
		
		if (members.length === 0) {
			return
		}
		const preferenceKey = isStatusChange ? 'taskStatusChanges' : 'tasks'
		members = await filterUsersByEmailPreference(members, board.teamId, preferenceKey)
		if (members.length === 0) {
			return
		}
		
		// Get status text - handle different status formats
		let statusText = task.status
		try {
			const statusKey = `boards.status.${task.status}`
			const translatedStatus = t(statusKey)
			// Check if translation exists (i18next returns key if translation not found)
			if (translatedStatus && translatedStatus !== statusKey) {
				statusText = translatedStatus
			}
		} catch (error) {
			// If translation fails, use original status
			console.error('Error translating task status:', error)
		}
		const boardName = escapeHtml(board.name)
		const taskTitle = escapeHtml(task.title)
		const creatorName = `${escapeHtml(createdByUser.firstName)} ${escapeHtml(createdByUser.lastName)}`
		const priorityKey = `boards.priority.${task.priority || 'medium'}`
		const translatedPriority = t(priorityKey)
		const priorityText = translatedPriority && translatedPriority !== priorityKey
			? translatedPriority
			: (task.priority || 'medium')
		let assigneesText = t('email.task.unassigned')
		if (task.assignedScope === 'all-members') {
			assigneesText = t('email.task.assignedToAllMembers')
		} else if (Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
			const assignedUsers = await User.find({
				_id: { $in: task.assignedTo },
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('firstName lastName username')
			if (assignedUsers.length > 0) {
				assigneesText = assignedUsers
					.map(user => `${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}`.trim() || escapeHtml(user.username))
					.join(', ')
			}
		}
		
		const scheduleText = formatTaskScheduleForNotification(task, t)
		const schedulePart = scheduleText
			? t('email.task.schedulePartSuffix', { schedule: scheduleText })
			: ''
		const scheduleRow = scheduleText
			? `
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.scheduleLabel')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(scheduleText)}</td>
						</tr>`
			: ''
		
		// Build email content
		let title, content, subject
		
		if (isStatusChange) {
			title = t('email.task.statusChangedTitle')
			subject = t('email.task.statusChangedSubject', { taskTitle, status: statusText, priority: priorityText })
			content = `
				<p style="margin: 0 0 16px 0;">${t('email.task.statusChangedMessage', { creatorName, taskTitle, status: statusText, boardName, priority: priorityText, schedulePart })}</p>
				<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
					<p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">${t('email.task.taskDetails')}</p>
					<table style="width: 100%; border-collapse: collapse;">
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${t('email.task.taskTitle')}:</td>
							<td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${taskTitle}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.status')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${statusText}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.board')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${boardName}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.priority')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(priorityText)}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">${t('email.task.assignedTo')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${assigneesText}</td>
						</tr>
						${scheduleRow}
						${task.description ? `
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">${t('email.task.description')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(task.description)}</td>
						</tr>
						` : ''}
					</table>
				</div>
			`
		} else {
			title = t('email.task.newTaskTitle')
			subject = t('email.task.newTaskSubject', { taskTitle, priority: priorityText })
			content = `
				<p style="margin: 0 0 16px 0;">${t('email.task.newTaskMessage', { creatorName, taskTitle, boardName, priority: priorityText, schedulePart })}</p>
				<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
					<p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">${t('email.task.taskDetails')}</p>
					<table style="width: 100%; border-collapse: collapse;">
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${t('email.task.taskTitle')}:</td>
							<td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${taskTitle}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.status')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${statusText}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.board')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${boardName}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.task.priority')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(priorityText)}</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">${t('email.task.assignedTo')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${assigneesText}</td>
						</tr>
						${scheduleRow}
						${task.description ? `
						<tr>
							<td style="padding: 8px 0; color: #6b7280; font-size: 14px; vertical-align: top;">${t('email.task.description')}:</td>
							<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(task.description)}</td>
						</tr>
						` : ''}
					</table>
				</div>
			`
		}
		
		const boardLink = `${appUrl}/boards/${board._id}`

		const plainTask = String(task.title || '').trim().slice(0, 160)
		const plainBoard = String(board.name || '').trim().slice(0, 120)
		const plainCreator = `${createdByUser.firstName || ''} ${createdByUser.lastName || ''}`.trim()
		const inboxPreview = [plainCreator, plainTask, plainBoard, statusText, priorityText, scheduleText]
			.filter(Boolean)
			.join(' · ')
		
		// Send emails to all members
		const emailPromises = members.map(member =>
			sendEmail(
				member.username,
				boardLink,
				subject,
				getEmailTemplate(
					title,
					content,
					t('email.task.viewBoard'),
					boardLink,
					t
				),
				{ teamId: board.teamId, preview: inboxPreview }
			).catch(error => {
				console.error(`Error sending task notification email to ${member.username}:`, error)
			})
		)
		
		await Promise.all(emailPromises)
	} catch (error) {
		console.error('Error sending task notification emails:', error)
	}
}

const sendTaskCommentEmailNotification = async ({
	task,
	board,
	commenterName,
	commentContent = '',
	recipientUserIds,
	t = null,
}) => {
	try {
		if (!task || !board || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) return

		let recipients = await User.find({
			_id: { $in: recipientUserIds },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id username firstName lastName')
		recipients = await filterUsersByEmailPreference(recipients, board.teamId, 'taskComments')
		if (recipients.length === 0) return

		const taskTitle = escapeHtml(task.title || (t ? t('email.task.taskTitle') : 'Zadanie'))
		const boardName = escapeHtml(board.name || 'Board')
		const author = escapeHtml(commenterName || 'Someone')
		const subject = t
			? t('email.task.commentSubject', { taskTitle })
			: `Nowy komentarz w zadaniu: ${taskTitle}`
		const body = t
			? t('email.task.commentMessage', { commenterName: author, taskTitle, boardName })
			: `${author} dodał komentarz do zadania "${taskTitle}" na tablicy "${boardName}".`
		const safeCommentContent = escapeHtml(String(commentContent || '').trim())
		const commentBlock = safeCommentContent
			? `<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;"><p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${t ? (t('email.task.commentContentLabel') || 'Treść komentarza') : 'Treść komentarza'}</p><p style="margin: 0; color: #374151; white-space: pre-wrap;">${safeCommentContent}</p></div>`
			: ''
		const boardLink = `${appUrl}/boards/${board._id}`
		const html = getEmailTemplate(
			t ? t('email.task.commentTitle') : 'Nowy komentarz w zadaniu',
			`<p style="margin: 0 0 16px 0;">${body}</p>${commentBlock}`,
			t ? t('email.task.viewBoard') : 'Zobacz tablicę',
			boardLink,
			t
		)

		await Promise.all(
			recipients.map((recipient) =>
				sendEmail(recipient.username, boardLink, subject, html, {
					teamId: board.teamId,
					preview: `${commenterName || ''} · ${task.title || ''}`.trim(),
				})
			)
		)
	} catch (error) {
		console.error('Error sending task comment email notifications:', error)
	}
}

const sendChatEmailNotification = async ({
	channel,
	message,
	senderName,
	recipientUserIds,
	t = null,
}) => {
	try {
		if (!channel || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) return

		let recipients = await User.find({
			_id: { $in: recipientUserIds },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id username firstName lastName')
		recipients = await filterUsersByEmailPreference(recipients, channel.teamId, 'chat')
		if (recipients.length === 0) return

		const channelNameRaw = String(channel.name || '').trim() || (t ? t('email.chat.defaultChannel') : 'Kanał')
		const channelName = escapeHtml(channelNameRaw)
		const safeSenderName = escapeHtml(senderName || (t ? t('email.chat.defaultSender') : 'Użytkownik'))
		const contentRaw = String(message?.content || '').trim()
		const safeMessageContent = escapeHtml(contentRaw)
		const hasAttachments = Array.isArray(message?.attachments) && message.attachments.length > 0

		const subject = t
			? t('email.chat.newMessageSubject', { channelName: channelNameRaw })
			: `Nowa wiadomość na czacie: ${channelNameRaw}`
		const headerText = t
			? t('email.chat.newMessageHeader', { senderName: safeSenderName, channelName })
			: `${safeSenderName} wysłał(a) nową wiadomość na kanale ${channelName}.`
		const messageTitle = t ? t('email.chat.messageContentLabel') : 'Treść wiadomości'
		const noContentText = t ? t('email.chat.noMessageContent') : '(wiadomość bez tekstu)'
		const attachmentText = hasAttachments
			? `<p style="margin: 12px 0 0 0; color: #6b7280; font-size: 14px;">${t ? (t('email.chat.attachmentsInfo') || 'Wiadomość zawiera załączniki.') : 'Wiadomość zawiera załączniki.'}</p>`
			: ''
		const messageBlock = `
			<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
				<p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">${messageTitle}</p>
				<p style="margin: 0; color: #374151; white-space: pre-wrap;">${safeMessageContent || noContentText}</p>
				${attachmentText}
			</div>
		`
		const channelLink = `${appUrl}/chat`
		const html = getEmailTemplate(
			t ? t('email.chat.newMessageTitle') : 'Nowa wiadomość na czacie',
			`<p style="margin: 0 0 16px 0;">${headerText}</p>${messageBlock}`,
			t ? t('email.chat.openChat') : 'Otwórz czat',
			channelLink,
			t
		)

		await Promise.all(
			recipients.map((recipient) =>
				sendEmail(recipient.username, channelLink, subject, html, {
					teamId: channel.teamId,
					preview: `${senderName || ''} · ${channelNameRaw} · ${(contentRaw || '').slice(0, 120)}`.trim(),
				})
			)
		)
	} catch (error) {
		console.error('Error sending chat email notifications:', error)
	}
}

const sendSchedulePublishedEmailNotification = async ({
	schedule,
	recipientUserIds,
	year,
	month,
	t = null,
}) => {
	try {
		if (!schedule || !Array.isArray(recipientUserIds) || recipientUserIds.length === 0) return
		let recipients = await User.find({
			_id: { $in: recipientUserIds },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
		}).select('_id username firstName lastName')
		recipients = await filterUsersByEmailPreference(recipients, schedule.teamId, 'schedulePublished')
		if (recipients.length === 0) return

		const scheduleNameRaw = schedule.name || (t ? t('email.schedule.defaultName') : 'Grafik')
		const scheduleName = escapeHtml(scheduleNameRaw)
		const monthLabel = `${String(month).padStart(2, '0')}.${year}`
		const title = t ? t('email.schedule.publishedTitle') : 'Opublikowano grafik'
		const scheduleLink = `${appUrl}/schedule/${schedule._id}`
		const monthPrefix = `${year}-${String(month).padStart(2, '0')}`

		await Promise.all(
			recipients.map(async (recipient) => {
				const recipientId = recipient._id.toString()
				const recipientEntries = []
				for (const day of schedule.days || []) {
					const dayKey = formatYmd(day?.date)
					if (!dayKey.startsWith(monthPrefix)) continue
					for (const entry of day.entries || []) {
						if (entry?.employeeId?.toString() !== recipientId) continue
						if (entry?.isPublished === false) continue
						recipientEntries.push({
							date: dayKey,
							timeFrom: entry?.timeFrom || '',
							timeTo: entry?.timeTo || '',
							notes: entry?.notes || '',
						})
					}
				}

				const entriesPreviewLimit = 8
				const visibleEntries = recipientEntries.slice(0, entriesPreviewLimit)
				const detailsRows = visibleEntries
					.map((item) => {
						const dateLabel = escapeHtml(item.date)
						const timeLabel = `${escapeHtml(item.timeFrom)}-${escapeHtml(item.timeTo)}`
						const notesLabel = item.notes ? escapeHtml(item.notes) : (t ? (t('email.schedule.entryNotesEmpty') || '—') : '—')
						return `<tr><td style="padding: 8px 0; color: #1f2937;">${dateLabel}</td><td style="padding: 8px 0; color: #1f2937;">${timeLabel}</td><td style="padding: 8px 0; color: #4b5563;">${notesLabel}</td></tr>`
					})
					.join('')
				const remainingCount = Math.max(recipientEntries.length - visibleEntries.length, 0)
				const detailsBlock = recipientEntries.length
					? `<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
							<p style="margin: 0 0 10px 0; font-weight: 600; color: #1f2937;">${t ? (t('email.schedule.entryDetailsTitle') || 'Twoje opublikowane wpisy') : 'Twoje opublikowane wpisy'} (${recipientEntries.length})</p>
							<table style="width: 100%; border-collapse: collapse;">
								<thead>
									<tr>
										<th align="left" style="padding: 4px 0; color: #6b7280; font-size: 13px;">${t ? (t('email.schedule.entryDate') || 'Data') : 'Data'}</th>
										<th align="left" style="padding: 4px 0; color: #6b7280; font-size: 13px;">${t ? (t('email.schedule.entryTime') || 'Godziny') : 'Godziny'}</th>
										<th align="left" style="padding: 4px 0; color: #6b7280; font-size: 13px;">${t ? (t('email.schedule.entryNotes') || 'Notatka') : 'Notatka'}</th>
									</tr>
								</thead>
								<tbody>${detailsRows}</tbody>
							</table>
							${remainingCount > 0 ? `<p style="margin: 12px 0 0 0; color: #6b7280; font-size: 13px;">${t ? (t('email.schedule.entryMore', { count: remainingCount }) || `+ ${remainingCount} kolejnych wpisów`) : `+ ${remainingCount} kolejnych wpisów`}</p>` : ''}
						</div>`
					: ''

				const subject = t
					? t('email.schedule.publishedSubject', { scheduleName: scheduleNameRaw, month: monthLabel })
					: `Opublikowano grafik: ${scheduleNameRaw} (${monthLabel})`
				const content = t
					? t('email.schedule.publishedMessage', { scheduleName: scheduleNameRaw, month: monthLabel })
					: `Twój grafik "${scheduleNameRaw}" na ${monthLabel} został opublikowany.`
				const html = getEmailTemplate(
					title,
					`<p style="margin: 0 0 16px 0;">${escapeHtml(content)}</p>${detailsBlock}`,
					t ? t('email.schedule.openSchedule') : 'Otwórz grafik',
					scheduleLink,
					t
				)

				return sendEmail(recipient.username, scheduleLink, subject, html, {
					teamId: schedule.teamId,
					preview: `${scheduleNameRaw} · ${monthLabel}${recipientEntries.length ? ` · ${recipientEntries.length}` : ''}`,
				})
			})
		)
	} catch (error) {
		console.error('Error sending schedule published email notifications:', error)
	}
}

/**
 * Powiadomienie e-mail do autora zgłoszenia (odpowiedź obsługi / zmiana statusu).
 * Wymaga EMAIL_USER i EMAIL_PASS; błędy są logowane, nie rzucane na zewnątrz.
 */
async function notifyTicketReporter({ recipientEmail, kind, topic, extra }) {
	try {
		if (!recipientEmail || typeof recipientEmail !== 'string') return
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			console.warn('[notifyTicketReporter] Brak EMAIL_USER / EMAIL_PASS — pomijam powiadomienie e-mail')
			return
		}
		const helpUrl = `${appUrl}/helpcenter`
		const safeTopic = escapeHtml(String(topic || 'Zgłoszenie').slice(0, 140))

		if (kind === 'reply') {
			const preview = escapeHtml(String(extra?.messagePreview || '').slice(0, 500))
			const subject = `Planopia — odpowiedź w zgłoszeniu: ${String(topic || '').slice(0, 72)}`
			const title = 'Nowa odpowiedź w zgłoszeniu'
			const content = `
				<p style="margin:0 0 12px 0;">W zgłoszeniu <strong>${safeTopic}</strong> pojawiła się nowa wiadomość od zespołu Planopia.</p>
				<div style="margin:16px 0;padding:14px 16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981;">
					<p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${preview || '(załączniki — zobacz w aplikacji)'}</p>
				</div>
				<p style="margin:16px 0 0 0;color:#6b7280;font-size:14px;">Otwórz Centrum pomocy w aplikacji, aby przeczytać całość i ewentualnie odpowiedzieć.</p>`
			const html = getEmailTemplate(title, content, 'Otwórz Centrum pomocy', helpUrl, null)
			await sendEmail(recipientEmail, helpUrl, subject, html)
			return
		}

		if (kind === 'status') {
			const newStatus = escapeHtml(String(extra?.newStatus || ''))
			const subject = `Planopia — status zgłoszenia: ${String(topic || '').slice(0, 72)}`
			const title = 'Zaktualizowano status zgłoszenia'
			const content = `
				<p style="margin:0 0 12px 0;">Zgłoszenie <strong>${safeTopic}</strong> ma teraz status: <strong>${newStatus}</strong>.</p>
				<p style="margin:0;color:#6b7280;font-size:14px;">Szczegóły znajdziesz w Centrum pomocy w aplikacji Planopia.</p>`
			const html = getEmailTemplate(title, content, 'Otwórz Centrum pomocy', helpUrl, null)
			await sendEmail(recipientEmail, helpUrl, subject, html)
		}
	} catch (err) {
		console.error('[notifyTicketReporter]', err.message || err)
	}
}

/**
 * Powiadomienie na skrzynki zespołu Planopia: nowe zgłoszenie lub każda nowa wiadomość w dyskusji (Help Center).
 */
async function notifyHelpCenterStaff({ kind, ticket, messagePreview, authorEmail, isStaffMessage }) {
	try {
		if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
			console.warn('[notifyHelpCenterStaff] Brak EMAIL_USER / EMAIL_PASS — pomijam')
			return
		}
		if (!ticket) return

		const helpUrl = `${appUrl}/helpcenter`
		const safeTopic = escapeHtml(String(ticket.topic || 'Zgłoszenie').slice(0, 140))
		const company = escapeHtml(String(ticket.company || '—'))
		const reporter = escapeHtml(String(ticket.userEmail || '—'))
		const preview = escapeHtml(String(messagePreview || '').slice(0, 800))
		const author = escapeHtml(String(authorEmail || '—'))
		const ticketId = ticket._id ? String(ticket._id) : '—'

		let subject
		let title
		let content

		if (kind === 'new_ticket') {
			subject = `[Planopia] Nowe zgłoszenie: ${String(ticket.topic || '').slice(0, 72)}`
			title = 'Nowe zgłoszenie w Centrum pomocy'
			content = `
				<p style="margin:0 0 12px 0;">Pojawiło się nowe zgłoszenie: <strong>${safeTopic}</strong></p>
				<p style="margin:0 0 8px 0;"><strong>Firma / instancja:</strong> ${company}</p>
				<p style="margin:0 0 8px 0;"><strong>Autor zgłoszenia:</strong> ${reporter}</p>
				<p style="margin:0 0 8px 0;"><strong>ID zgłoszenia:</strong> ${escapeHtml(ticketId)}</p>
				<div style="margin:16px 0;padding:14px 16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #0ea5e9;">
					<p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${preview || '(brak treści — sprawdź załączniki w aplikacji)'}</p>
				</div>`
		} else {
			subject = `[Planopia] Nowa wiadomość w zgłoszeniu: ${String(ticket.topic || '').slice(0, 64)}`
			title = 'Nowa wiadomość w dyskusji (Help Center)'
			const who = isStaffMessage ? 'Obsługa / staff' : 'Użytkownik (klient)'
			content = `
				<p style="margin:0 0 12px 0;">W zgłoszeniu <strong>${safeTopic}</strong> pojawiła się nowa wiadomość.</p>
				<p style="margin:0 0 8px 0;"><strong>Nadawca:</strong> ${who} (${author})</p>
				<p style="margin:0 0 8px 0;"><strong>Firma / instancja:</strong> ${company} · <strong>Autor zgłoszenia:</strong> ${reporter}</p>
				<p style="margin:0 0 8px 0;"><strong>ID zgłoszenia:</strong> ${escapeHtml(ticketId)}</p>
				<div style="margin:16px 0;padding:14px 16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #10b981;">
					<p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${preview || '(załączniki — zobacz w aplikacji)'}</p>
				</div>`
		}

		const html = getEmailTemplate(title, content, 'Otwórz Help Center', helpUrl, null)
		await sendEmail(HELP_CENTER_STAFF_EMAILS, helpUrl, subject, html)
	} catch (err) {
		console.error('[notifyHelpCenterStaff]', err.message || err)
	}
}

const BILLING_PLAN_LABEL_PL = {
	starter: 'Starter',
	pro: 'Pro',
	business: 'Business',
	enterprise: 'Enterprise',
}

/** Po odnowieniu subskrypcji — zespół ma więcej kont niż limit pakietu (mail throttle po stronie wywołującego). */
async function sendBillingSeatOverLimitEmail(toEmail, teamName, { used, maxUsers, planKey }) {
	const safeTeam = escapeHtml(teamName || 'Państwa zespół')
	const planLabel = escapeHtml(BILLING_PLAN_LABEL_PL[planKey] || planKey || '—')
	const subject = 'Planopia — liczba kont przekracza limit pakietu'
	const title = 'Liczba kont w zespole przekracza limit pakietu'
	const content = `
		<p style="margin:0 0 14px 0;">Dzień dobry,</p>
		<p style="margin:0 0 14px 0;">Po zaksięgowaniu kolejnej opłaty za subskrypcję zauważyliśmy, że zespół <strong>${safeTeam}</strong> ma obecnie <strong>${Number(used)}</strong> aktywnych kont użytkowników, a wybrany pakiet <strong>${planLabel}</strong> obejmuje do <strong>${Number(maxUsers)}</strong> kont.</p>
		<p style="margin:0 0 14px 0;">Dostęp do aplikacji został przedłużony zgodnie z opłatą. Prosimy o dopasowanie liczby kont do limitu pakietu <strong>(dezaktywacja lub usunięcie nadmiarowych kont w zarządzaniu zespołem)</strong> albo o kontakt w sprawie wyższego pakietu — odpowiedź na tego maila lub Help Center w aplikacji.</p>
		<p style="margin:0;">Pozdrawiamy,<br>Zespół Planopia</p>
	`
	const html = getEmailTemplate(title, content, null, null, null)
	await sendEmail(toEmail, null, subject, html)
}

/** Podziękowanie po zakupie pakietu. */
async function sendBillingPurchaseThankYouEmail(toEmail, teamName) {
	const safeTeam = escapeHtml(teamName || 'Państwa zespół')
	const subject = 'Dziękujemy za wybór Planopia'
	const title = 'Dziękujemy za wybór Planopia'
	const content = `
		<p style="margin:0 0 12px 0;">Dzień dobry,</p>
		<p style="margin:0 0 12px 0;">Dziękujemy za wybór <strong>Planopii</strong> dla zespołu <strong>${safeTeam}</strong>. Cieszymy się, że są Państwo z nami.</p>
		<p style="margin:0 0 12px 0;">Fakturę wystawimy w <strong>KSeF</strong> (Krajowym Systemie e-Faktur) i prześlemy na ten adres e-mail w ciągu kilku dni.</p>
		<p style="margin:0 0 12px 0;">W razie pytań prosimy o kontakt na tego maila lub w aplikacji w <strong>Centrum pomocy</strong> — chętnie pomożemy.</p>
		<p style="margin:0;">Pozdrawiamy,<br>Zespół Planopia</p>
	`
	const html = getEmailTemplate(title, content, null, null, null)
	await sendEmail(toEmail, null, subject, html)
}

module.exports = {
	sendEmail,
	sendEmailToHR,
	sendTaskNotification,
	sendTaskCommentEmailNotification,
	sendChatEmailNotification,
	sendSchedulePublishedEmailNotification,
	notifyTicketReporter,
	notifyHelpCenterStaff,
	sendBillingPurchaseThankYouEmail,
	sendBillingSeatOverLimitEmail,
	escapeHtml,
	getEmailTemplate,
}
