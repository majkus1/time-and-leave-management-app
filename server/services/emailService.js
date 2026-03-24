const nodemailer = require('nodemailer')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { appUrl } = require('../config')
const { getLeaveRequestTypeName } = require('../utils/leaveRequestTypes')
const { getLeaveStatusText } = require('../utils/leaveStatusText')

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
				<table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
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

const sendEmail = async (to, link, subject, html) => {
	const transporter = nodemailer.createTransport({
		host: 'smtp.gmail.com',
		port: 465,
		secure: true,
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	})

	await transporter.sendMail({
		from: '"Planopia" <michalipka1@gmail.com>',
		to,
		subject,
		html,
	})
}


const sendEmailToHR = async (leaveRequest, user, updatedByUser, t, updatedByInfo, teamId) => {
	try {
		const hrUsers = await User.find({
			teamId, 
			roles: { $in: ['HR'] },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})

		// Nigdy nie wysyłaj "HR notification" do autora wniosku.
		let usersToNotify = hrUsers.filter(hr => hr.username !== user.username)

		// Jeśli nie znaleziono HR (lub po wykluczeniu autora nie ma odbiorców), wyślij do Adminów jako fallback
		if (hrUsers.length === 0) {
			const adminUsers = await User.find({
				teamId,
				roles: { $in: ['Admin'] },
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('username')

			// Usuń użytkownika który złożył wniosek jeśli jest adminem (nie powinien dostawać powiadomienia o swojej własnej zmianie statusu)
			usersToNotify = adminUsers.filter(admin => admin.username !== user.username)

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
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${settings.leaveCalculationMode === 'hours' ? (t('email.leaveRequest.hours') || 'Godziny') : (t('email.leaveRequest.days') || 'Dni')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${settings.leaveCalculationMode === 'hours' ? (leaveRequest.daysRequested * (settings.leaveHoursPerDay || 8)).toFixed(1) : leaveRequest.daysRequested}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveRequest.updatedBy')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(updatedByUser.firstName)} ${escapeHtml(updatedByUser.lastName)}</td>
					</tr>
				</table>
			</div>
		`
		
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
				)
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
		const members = await User.find({ 
			_id: { $in: filteredRecipientIds },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('username firstName lastName')
		
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
		
		// Build email content
		let title, content, subject
		
		if (isStatusChange) {
			title = t('email.task.statusChangedTitle')
			subject = t('email.task.statusChangedSubject', { taskTitle, status: statusText, priority: priorityText })
			content = `
				<p style="margin: 0 0 16px 0;">${t('email.task.statusChangedMessage', { creatorName, taskTitle, status: statusText, boardName, priority: priorityText })}</p>
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
				<p style="margin: 0 0 16px 0;">${t('email.task.newTaskMessage', { creatorName, taskTitle, boardName, priority: priorityText })}</p>
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
				)
			).catch(error => {
				console.error(`Error sending task notification email to ${member.username}:`, error)
			})
		)
		
		await Promise.all(emailPromises)
	} catch (error) {
		console.error('Error sending task notification emails:', error)
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

module.exports = {
	sendEmail,
	sendEmailToHR,
	sendTaskNotification,
	notifyTicketReporter,
	escapeHtml,
	getEmailTemplate,
}
