const { firmDb } = require('../db/db')
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { sendEmailToHR, sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const User = require('../models/user')(firmDb)
const { appUrl } = require('../config')

exports.markLeaveRequestAsProcessed = async (req, res) => {
	try {
		const leaveRequest = await LeaveRequest.findById(req.params.id)
		if (!leaveRequest) {
			return res.status(404).send('Wniosek nie znaleziony')
		}

		leaveRequest.isProcessed = true
		await leaveRequest.save()

		res.status(200).json({ message: 'Wniosek oznaczony jako przetworzony' })
	} catch (error) {
		console.error('Błąd podczas oznaczania wniosku jako przetworzony:', error)
		res.status(500).send('Błąd serwera')
	}
}

// exports.getUserLeaveRequests = async (req, res) => {
// 	try {
// 		const leaveRequests = await LeaveRequest.find({ userId: req.user.userId }).populate(
// 			'updatedBy',
// 			'firstName lastName'
// 		)
// 		res.status(200).json(leaveRequests)
// 	} catch (error) {
// 		console.error('Błąd podczas pobierania zgłoszeń:', error)
// 		res.status(500).json({ message: 'Błąd podczas pobierania zgłoszeń' })
// 	}
// }

// exports.getUserLeaveRequests = async (req, res) => {
// 	const { userId } = req.params

// 	const allowedRoles = [
// 		'Admin',
// 		'Zarząd',
// 		'Kierownik IT',
// 		'Kierownik BOK',
// 		'Kierownik Bukmacher',
// 		'Kierownik Marketing',
// 		'Urlopy czas pracy',
// 	]
// 	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
// 		return res.status(403).send('Access denied')
// 	}

// 	try {
// 		const leaveRequests = await LeaveRequest.find({ userId })
// 			.populate('userId', 'username firstName lastName position')
// 			.populate('updatedBy', 'firstName lastName')
// 		res.status(200).json(leaveRequests)
// 	} catch (error) {
// 		console.error('Error fetching leave requests:', error)
// 		res.status(500).send('Failed to fetch leave requests.')
// 	}
// }

exports.getOwnLeaveRequests = async (req, res) => {
	try {
		const leaveRequests = await LeaveRequest.find({ userId: req.user.userId }).populate(
			'updatedBy',
			'firstName lastName'
		)
		res.status(200).json(leaveRequests)
	} catch (error) {
		console.error('Błąd podczas pobierania zgłoszeń:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania zgłoszeń' })
	}
}

// controllers/leaveRequestController.js

exports.getUserLeaveRequests = async (req, res) => {
	const { userId } = req.params
	const requestingUser = await User.findById(req.user.userId)
	if (!requestingUser) return res.status(404).send('Brak użytkownika')

	// Admin lub HR – widzi wszystko
	if (
		requestingUser.roles.includes('Admin') ||
		requestingUser.roles.includes('Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)')
	) {
		// widzi każdego
	} else if (
		// Przełożony działu lub ewidencja widzi tylko w swoim dziale
		requestingUser.roles.includes('Może zatwierdzać urlopy swojego działu (Approve Leaves Department)') ||
			requestingUser.roles.includes('Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)')
	) {
		const userToView = await User.findById(userId)
		if (!userToView) return res.status(404).send('Nie znaleziono użytkownika')
		
		// Sprawdź czy użytkownicy mają wspólny dział (dla wielu działów)
		const requestingDepts = Array.isArray(requestingUser.department) ? requestingUser.department : (requestingUser.department ? [requestingUser.department] : [])
		const userToViewDepts = Array.isArray(userToView.department) ? userToView.department : (userToView.department ? [userToView.department] : [])
		const hasCommonDepartment = requestingDepts.some(dept => userToViewDepts.includes(dept))
		
		if (!hasCommonDepartment) return res.status(403).send('Brak uprawnień')
		// OK
	} else if (
		// Pracownik widzi tylko swoje
		requestingUser._id.toString() !== userId
	) {
		return res.status(403).send('Brak uprawnień')
	}

	try {
		const leaveRequests = await LeaveRequest.find({ userId })
			.populate('userId', 'username firstName lastName position')
			.populate('updatedBy', 'firstName lastName')
		res.status(200).json(leaveRequests)
	} catch (error) {
		console.error('Error fetching leave requests:', error)
		res.status(500).send('Failed to fetch leave requests.')
	}
}

// exports.updateLeaveRequestStatus = async (req, res) => {
// 	const { id } = req.params
// 	const { status } = req.body
// 	const { t } = req

// 	const allowedRoles = [
// 		'Admin',
// 		'Zarząd',
// 		'Kierownik IT',
// 		'Kierownik BOK',
// 		'Kierownik Bukmacher',
// 		'Kierownik Marketing',
// 		'Urlopy czas pracy',
// 	]
// 	if (!allowedRoles.some(role => req.user.roles.includes(role))) {
// 		return res.status(403).send('Access denied')
// 	}

// 	try {
// 		const leaveRequest = await LeaveRequest.findById(id)
// 		if (!leaveRequest) {
// 			return res.status(404).send('Leave request not found.')
// 		}

// 		const user = await User.findById(leaveRequest.userId).select('firstName lastName username')
// 		const updatedByUser = await User.findById(req.user.userId).select('firstName lastName')

// 		leaveRequest.status = status
// 		leaveRequest.updatedBy = req.user.userId
// 		await leaveRequest.save()

// 		const updatedByInfo = `<p><b>${t('email.leaveRequest.updatedBy')}:</b> ${updatedByUser.firstName} ${updatedByUser.lastName}</p>`

// 		await sendEmailToLeaveTeam(leaveRequest, user, updatedByUser, t, updatedByInfo)

// 		const mailContent = `
// 		  <p><b>${t('email.leaveRequest.employee')}:</b> ${user.firstName} ${user.lastName}</p>
// 		  <p><b>${t('email.leaveRequest.type')}:</b> ${t(leaveRequest.type)}</p>
// 		  <p><b>${t('email.leaveRequest.dates')}:</b> ${leaveRequest.startDate.toISOString().split('T')[0]} - ${leaveRequest.endDate.toISOString().split('T')[0]}</p>
// 		  <p><b>${t('email.leaveRequest.days')}:</b> ${leaveRequest.daysRequested}</p>
// 		  ${updatedByInfo}
// 		  <p><a href="${appUrl}/leave-requests/${user._id}">${t('email.leaveRequest.goToRequest')}</a></p>
// 		`

// 		await sendEmail(
// 			user.username,
// 			null,
// 			`${t('email.leaveRequest.titlemail')} ${t(leaveRequest.type)} ${t(status)}`,
// 			mailContent
// 		)

// 		if (status === 'status.accepted') {
// 			await sendEmailToLeaveTeam(leaveRequest, user, updatedByUser, t, updatedByInfo)
// 		}

// 		res.status(200).json({ message: 'Status updated successfully.', leaveRequest })
// 	} catch (error) {
// 		console.error('Error updating leave request status:', error)
// 		res.status(500).send('Failed to update leave request status.')
// 	}
// }
exports.updateLeaveRequestStatus = async (req, res) => {
	const { id } = req.params
	const { status } = req.body
	const { t } = req

	try {
		const leaveRequest = await LeaveRequest.findById(id)
		if (!leaveRequest) {
			return res.status(404).send('Leave request not found.')
		}

		const requestingUser = await User.findById(req.user.userId)
		const user = await User.findById(leaveRequest.userId).select('firstName lastName username department')
		const updatedByUser = await User.findById(req.user.userId).select('firstName lastName department roles')

		
		const isAdmin = requestingUser.roles.includes('Admin')
		// Sprawdź czy użytkownicy mają wspólny dział (dla wielu działów)
		const requestingDepts = Array.isArray(requestingUser.department) ? requestingUser.department : (requestingUser.department ? [requestingUser.department] : [])
		const userDepts = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
		const hasCommonDepartment = requestingDepts.some(dept => userDepts.includes(dept))
		
		const isSupervisorOfDepartment =
			requestingUser.roles.includes('Może zatwierdzać urlopy swojego działu (Approve Leaves Department)') &&
			hasCommonDepartment

		const isHR = requestingUser.roles.includes(
			'Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)'
		)

		if (!isAdmin && !isHR && !isSupervisorOfDepartment) {
			return res.status(403).send('Access denied')
		}

		leaveRequest.status = status
		leaveRequest.updatedBy = req.user.userId
		await leaveRequest.save()

		const startDate = leaveRequest.startDate.toISOString().split('T')[0]
		const endDate = leaveRequest.endDate.toISOString().split('T')[0]
		const statusText = t(leaveRequest.status)
		const typeText = t(leaveRequest.type)
		
		// Utworz updatedByInfo dla sendEmailToHR
		const updatedByInfo = `<p><b>${t('email.leaveRequest.updatedBy')}:</b> ${escapeHtml(updatedByUser.firstName)} ${escapeHtml(updatedByUser.lastName)}</p>`
		
		const content = `
			<p style="margin: 0 0 16px 0;">${t('email.leaveRequest.requestUpdated')} <strong>${statusText}</strong>.</p>
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
		const mailContent = getEmailTemplate(
			`${typeText} - ${statusText}`,
			content,
			t('email.leaveRequest.goToRequest'),
			`${appUrl}/leave-requests/${user._id}`,
			t
		)

		try {
			await sendEmail(
				user.username,
				null,
				`${t('email.leaveRequest.titlemail')} ${t(leaveRequest.type)} ${t(status)}`,
				mailContent
			)
		} catch (emailError) {
			console.error('Error sending email to user:', emailError)
			// Nie przerywaj procesu jeśli email nie zadziała
		}

		try {
			await sendEmailToHR(leaveRequest, user, updatedByUser, t, updatedByInfo, req.user.teamId)
		} catch (hrEmailError) {
			console.error('Error sending email to HR:', hrEmailError)
			// Nie przerywaj procesu jeśli email do HR nie zadziała
		}

		// Pobierz zaktualizowany leaveRequest z populate
		const updatedLeaveRequest = await LeaveRequest.findById(id)
			.populate('updatedBy', 'firstName lastName')
			.lean()

		res.status(200).json({ message: 'Status updated successfully.', leaveRequest: updatedLeaveRequest })
	} catch (error) {
		console.error('Error updating leave request status:', error)
		res.status(500).send('Failed to update leave request status.')
	}
}

exports.getAcceptedLeaveRequestsForUser = async (req, res) => {
	try {
		const { userId } = req.params
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) return res.status(404).send('Brak użytkownika')

		// Sprawdź czy to super admin
		const isSuperAdmin = requestingUser.username === 'michalipka1@gmail.com'

		// Sprawdź uprawnienia - użytkownik może widzieć swoje wnioski lub admin/HR/kierownik może widzieć wnioski innych
		const isOwnRequest = requestingUser._id.toString() === userId
		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('Może widzieć wszystkie wnioski i ewidencje (HR) (View All Leaves And Timesheets)')
		
		// Sprawdź czy przełożony działu ma dostęp do użytkownika z tego samego działu
		const userToView = await User.findById(userId)
		if (!userToView) return res.status(404).send('Nie znaleziono użytkownika')
		
		// Sprawdź czy użytkownicy są w tym samym zespole
		const isSameTeam = requestingUser.teamId.toString() === userToView.teamId.toString()
		
		// Sprawdź czy użytkownicy mają wspólny dział (dla wielu działów)
		const requestingDepts = Array.isArray(requestingUser.department) ? requestingUser.department : (requestingUser.department ? [requestingUser.department] : [])
		const userToViewDepts = Array.isArray(userToView.department) ? userToView.department : (userToView.department ? [userToView.department] : [])
		const hasCommonDepartment = requestingDepts.some(dept => userToViewDepts.includes(dept))
		
		const isSupervisorOfDepartment =
			requestingUser.roles.includes('Może zatwierdzać urlopy swojego działu (Approve Leaves Department)') &&
			requestingUser.roles.includes('Może widzieć ewidencję czasu pracy i ustalać grafik swojego działu (View Timesheets Department)') &&
			hasCommonDepartment

		// Każdy użytkownik w zespole może widzieć zaakceptowane wnioski innych użytkowników z tego samego zespołu
		// Super admin widzi wszystkich, admin/HR widzi wszystkich ze swojego zespołu
		if (!isOwnRequest && !isSuperAdmin && !isSameTeam && !isHR && !isSupervisorOfDepartment) {
			return res.status(403).send('Brak uprawnień')
		}

		// Pobierz zaakceptowane wnioski dla konkretnego użytkownika
		const acceptedLeaveRequests = await LeaveRequest.find({ 
			status: 'status.accepted',
			userId: userId
		})
			.populate('userId', 'firstName lastName username department')
			.populate('updatedBy', 'firstName lastName')
			.sort({ startDate: 1 })

		res.status(200).json(acceptedLeaveRequests)
	} catch (error) {
		console.error('Error fetching accepted leave requests for user:', error)
		res.status(500).send('Failed to fetch accepted leave requests for user.')
	}
}

exports.getUserAcceptedLeaveRequests = async (req, res) => {
	try {
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) return res.status(404).send('Brak użytkownika')

		// Pobierz zaakceptowane wnioski tylko dla bieżącego użytkownika
		const acceptedLeaveRequests = await LeaveRequest.find({ 
			status: 'status.accepted',
			userId: requestingUser._id
		})
			.populate('userId', 'firstName lastName username department')
			.populate('updatedBy', 'firstName lastName')
			.sort({ startDate: 1 })

		res.status(200).json(acceptedLeaveRequests)
	} catch (error) {
		console.error('Error fetching user accepted leave requests:', error)
		res.status(500).send('Failed to fetch user accepted leave requests.')
	}
}

exports.getAllAcceptedLeaveRequests = async (req, res) => {
	try {
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) return res.status(404).send('Brak użytkownika')

		// Sprawdź czy to super admin
		const isSuperAdmin = requestingUser.username === 'michalipka1@gmail.com'

		let acceptedLeaveRequests
		
		if (isSuperAdmin) {
			// Super admin widzi wszystkie zaakceptowane wnioski ze wszystkich zespołów
			acceptedLeaveRequests = await LeaveRequest.find({ 
				status: 'status.accepted'
			})
				.populate('userId', 'firstName lastName username department')
				.populate('updatedBy', 'firstName lastName')
				.sort({ startDate: 1 })
		} else {
			// Każda rola w zespole może widzieć zaakceptowane wnioski ze swojego zespołu
			// Najpierw pobierz wszystkich użytkowników z tego samego zespołu
			const teamUsers = await User.find({ teamId: requestingUser.teamId }).select('_id')
			const teamUserIds = teamUsers.map(user => user._id)

			// Pobierz zaakceptowane wnioski tylko dla użytkowników z tego samego zespołu
			acceptedLeaveRequests = await LeaveRequest.find({ 
				status: 'status.accepted',
				userId: { $in: teamUserIds }
			})
				.populate('userId', 'firstName lastName username department')
				.populate('updatedBy', 'firstName lastName')
				.sort({ startDate: 1 })
		}

		res.status(200).json(acceptedLeaveRequests)
	} catch (error) {
		console.error('Error fetching accepted leave requests:', error)
		res.status(500).send('Failed to fetch accepted leave requests.')
	}
}
