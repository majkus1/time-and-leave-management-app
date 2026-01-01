const nodemailer = require('nodemailer')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const { appUrl } = require('../config')

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
		})

		// Jeśli nie znaleziono HR, wyślij do Adminów jako fallback
		let usersToNotify = hrUsers
		if (hrUsers.length === 0) {
			const adminUsers = await User.find({
				teamId,
				roles: { $in: ['Admin'] },
			}).select('username')

			// Usuń użytkownika który złożył wniosek jeśli jest adminem (nie powinien dostawać powiadomienia o swojej własnej zmianie statusu)
			usersToNotify = adminUsers.filter(admin => admin.username !== user.username)

			if (usersToNotify.length === 0) {
				return
			}
		}

		const startDate = leaveRequest.startDate.toISOString().split('T')[0]
		const endDate = leaveRequest.endDate.toISOString().split('T')[0]
		const statusText = t(leaveRequest.status)
		const typeText = t(leaveRequest.type)
		
		const content = `
			<p style="margin: 0 0 16px 0;">${t('email.leaveRequest.requestUpdatedHR')} <strong>${statusText}</strong>.</p>
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
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveRequest.days')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${leaveRequest.daysRequested}</td>
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
				`${typeText} - ${statusText}`,
				getEmailTemplate(
					`${typeText} - ${statusText}`,
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
const sendTaskNotification = async (task, board, createdByUser, t, isStatusChange = false) => {
	try {
		// Get board members - for department boards, get users from department
		let memberIds = []
		
		if (board.type === 'department' && board.departmentName) {
			// For department boards, get all users in that department
			const departmentUsers = await User.find({
				teamId: board.teamId,
				$or: [
					{ department: board.departmentName },
					{ department: { $in: [board.departmentName] } }
				]
			}).select('_id username')
			memberIds = departmentUsers.map(u => u._id.toString())
		} else {
			// For regular boards, use board.members
			memberIds = board.members.map(m => m.toString())
		}
		
		// Remove the creator from recipients (they don't need to be notified)
		memberIds = memberIds.filter(id => id !== createdByUser._id.toString())
		
		if (memberIds.length === 0) {
			return
		}
		
		// Get member users
		const members = await User.find({ _id: { $in: memberIds } }).select('username firstName lastName')
		
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
		
		// Build email content
		let title, content, subject
		
		if (isStatusChange) {
			title = t('email.task.statusChangedTitle')
			subject = t('email.task.statusChangedSubject', { taskTitle, status: statusText })
			content = `
				<p style="margin: 0 0 16px 0;">${t('email.task.statusChangedMessage', { creatorName, taskTitle, status: statusText, boardName })}</p>
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
			subject = t('email.task.newTaskSubject', { taskTitle })
			content = `
				<p style="margin: 0 0 16px 0;">${t('email.task.newTaskMessage', { creatorName, taskTitle, boardName })}</p>
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

module.exports = {
	sendEmail,
	sendEmailToHR,
	sendTaskNotification,
	escapeHtml,
	getEmailTemplate,
}
