const { firmDb } = require('../db/db')
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const User = require('../models/user')(firmDb)
const { sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const { findSupervisorsForDepartment } = require('../services/roleService')
const { appUrl } = require('../config')

exports.submitLeaveRequest = async (req, res) => {
	const { type, startDate, endDate, daysRequested, replacement, additionalInfo } = req.body
	const userId = req.user.userId
	const teamId = req.user.teamId
	const t = req.t

	try {
		const leaveRequest = new LeaveRequest({
			userId,
			type,
			startDate,
			endDate,
			daysRequested,
			replacement,
			additionalInfo,
		})
		await leaveRequest.save()

		const user = await User.findById(userId).select('firstName lastName roles department username')
		if (!user) return res.status(404).send('Użytkownik nie znaleziony.')

		const supervisors = (await findSupervisorsForDepartment(user.department, teamId)).filter(
			sup => sup.username !== user.username
		)

		const typeText = t(type)
		const content = `
			<p style="margin: 0 0 16px 0;">${t('email.leaveform.newRequestSupervisor')}</p>
			<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
				<p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">${t('email.leaveform.requestDetails')}</p>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${t('email.leaveform.employee')}:</td>
						<td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.type')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${typeText}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.dates')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${startDate} - ${endDate}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.days')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${daysRequested}</td>
					</tr>
				</table>
			</div>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.clickButtonToReview')}</p>
		`
		
		const emailPromises = supervisors.map(supervisor =>
			sendEmail(
				supervisor.username,
				`${appUrl}/leave-requests/${userId}`,
				t('email.leaveform.title'),
				getEmailTemplate(
					t('email.leaveform.title'),
					content,
					t('email.leaveform.goToRequest'),
					`${appUrl}/leave-requests/${userId}`,
					t
				)
			)
		)

		await Promise.all(emailPromises)

		
		const hrUsers = await User.find({
			teamId,
			roles: { $in: ['Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)'] },
		})

		
		const hrContent = `
			<p style="margin: 0 0 16px 0;">${t('email.leaveform.newRequestHR')}</p>
			<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
				<p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">${t('email.leaveform.requestDetails')}</p>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${t('email.leaveform.employee')}:</td>
						<td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.type')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${typeText}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.dates')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${startDate} - ${endDate}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.days')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${daysRequested}</td>
					</tr>
				</table>
			</div>
			<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.clickButtonToView')}</p>
		`
		
		const hrEmailPromises = hrUsers.map(hr =>
			sendEmail(
				hr.username,
				`${appUrl}/leave-requests/${userId}`,
				t('email.leaveform.title'),
				getEmailTemplate(
					t('email.leaveform.title'),
					hrContent,
					t('email.leaveform.goToRequest'),
					`${appUrl}/leave-requests/${userId}`,
					t
				)
			)
		)

		await Promise.all(hrEmailPromises)

		console.log('Wysłano wszystkie maile do przełożonych i HR w obrębie zespołu')

		res.status(201).json({ message: 'Wniosek został wysłany i powiadomienie zostało dostarczone.', leaveRequest })
	} catch (error) {
		console.error('Błąd podczas zgłaszania nieobecności:', error)
		res.status(500).json({ message: 'Błąd podczas zgłaszania nieobecności' })
	}
}
