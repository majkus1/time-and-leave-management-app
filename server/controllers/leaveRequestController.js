const { firmDb } = require('../db/db')
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const { sendEmailToHR, sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const LeavePlan = require('../models/LeavePlan')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { appUrl } = require('../config')
const { findSupervisorsForDepartment } = require('../services/roleService')
const { isHoliday } = require('../utils/holidays')
const { getLeaveRequestTypeName } = require('../utils/leaveRequestTypes')

// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
function isWeekend(date) {
	const day = new Date(date).getDay()
	return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
}

// Funkcja pomocnicza do generowania wszystkich dat w zakresie (z pominięciem weekendów i świąt)
async function generateDateRange(startDate, endDate, teamId) {
	const dates = []
	const start = new Date(startDate)
	const end = new Date(endDate)
	const current = new Date(start)
	
	// Pobierz ustawienia dla zespołu
	const settings = await Settings.getSettings(teamId)
	const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
	
	while (current <= end) {
		const currentDateStr = new Date(current).toISOString().split('T')[0]
		const isWeekendDay = isWeekend(current)
		// Sprawdź święta (niestandardowe zawsze, polskie tylko gdy includeHolidays jest włączone)
		const holidayInfo = isHoliday(current, settings)
		const isHolidayDay = holidayInfo !== null
		
		// Jeśli pracuje w weekendy, pomijamy tylko święta
		if (workOnWeekends) {
			if (!isHolidayDay) {
				dates.push(currentDateStr)
			}
		} else {
			// Jeśli nie pracuje w weekendy, pomijamy weekendy i święta
			if (!isWeekendDay && !isHolidayDay) {
				dates.push(currentDateStr)
			}
		}
		current.setDate(current.getDate() + 1)
	}
	
	return dates
}

// Funkcja pomocnicza do przycinania dat do dni roboczych (usuwanie weekendów z początku i końca)
async function trimWeekendsFromDateRange(startDate, endDate, teamId) {
	const settings = await Settings.getSettings(teamId)
	const workOnWeekends = settings.workOnWeekends !== false // Domyślnie true
	
	// Jeśli pracuje w weekendy, nie trzeba przycinać
	if (workOnWeekends) {
		return { trimmedStartDate: startDate, trimmedEndDate: endDate }
	}
	
	const start = new Date(startDate)
	const end = new Date(endDate)
	
	// Znajdź pierwszą datę roboczą od początku zakresu
	let trimmedStart = new Date(start)
	while (trimmedStart <= end && (isWeekend(trimmedStart) || isHoliday(trimmedStart, settings))) {
		trimmedStart.setDate(trimmedStart.getDate() + 1)
	}
	
	// Znajdź ostatnią datę roboczą do końca zakresu
	let trimmedEnd = new Date(end)
	while (trimmedEnd >= start && (isWeekend(trimmedEnd) || isHoliday(trimmedEnd, settings))) {
		trimmedEnd.setDate(trimmedEnd.getDate() - 1)
	}
	
	// Jeśli nie ma żadnych dni roboczych w zakresie, zwróć null
	if (trimmedStart > trimmedEnd) {
		return { trimmedStartDate: null, trimmedEndDate: null }
	}
	
	const trimmedStartDate = trimmedStart.toISOString().split('T')[0]
	const trimmedEndDate = trimmedEnd.toISOString().split('T')[0]
	
	return { trimmedStartDate, trimmedEndDate }
}

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
		const leaveRequests = await LeaveRequest.find({ userId: req.user.userId }).populate({
			path: 'updatedBy',
			select: 'firstName lastName',
			match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
		})
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
		requestingUser.roles.includes('HR')
	) {
		// widzi każdego
	} else if (
		// Przełożony widzi w zależności od konfiguracji
		requestingUser.roles.includes('Przełożony (Supervisor)')
	) {
		const userToView = await User.findById(userId)
		if (!userToView) return res.status(404).send('Nie znaleziono użytkownika')
		
		const { canSupervisorViewTimesheets } = require('../services/roleService')
		const canView = await canSupervisorViewTimesheets(requestingUser, userToView)
		
		if (!canView) return res.status(403).send('Brak uprawnień')
		// OK
	} else if (
		// Pracownik widzi tylko swoje
		requestingUser._id.toString() !== userId
	) {
		return res.status(403).send('Brak uprawnień')
	}

	try {
		const leaveRequests = await LeaveRequest.find({ userId })
			.populate({
				path: 'userId',
				select: 'username firstName lastName position',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'updatedBy',
				select: 'firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
		// Filtruj wnioski, gdzie userId nie został znaleziony (soft-deleted)
		const filteredRequests = leaveRequests.filter(req => req.userId !== null)
		res.status(200).json(filteredRequests)
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

		const requestingUser = await User.findOne({
			_id: req.user.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (!requestingUser) return res.status(404).send('User not found')

		const user = await User.findOne({
			_id: leaveRequest.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('firstName lastName username department teamId')
		if (!user) return res.status(404).send('Employee not found or inactive')

		const updatedByUser = await User.findOne({
			_id: req.user.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('firstName lastName department roles')
		if (!updatedByUser) return res.status(404).send('Updated by user not found or inactive')

		
		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		
		// Sprawdź uprawnienia przełożonego
		const { canSupervisorApproveLeaves } = require('../services/roleService')
		const canApprove = await canSupervisorApproveLeaves(requestingUser, user)

		if (!isAdmin && !isHR && !canApprove) {
			return res.status(403).send('Access denied')
		}

		leaveRequest.status = status
		leaveRequest.updatedBy = req.user.userId
		await leaveRequest.save()

		const startDate = leaveRequest.startDate.toISOString().split('T')[0]
		const endDate = leaveRequest.endDate.toISOString().split('T')[0]
		const statusText = t(leaveRequest.status)
		
		// Pobierz Settings dla zespołu i nazwę typu
		const settings = await Settings.getSettings(user.teamId)
		const language = t('email.leaveRequest.footerNotification').includes('automatycznie') ? 'pl' : 'en'
		const typeText = getLeaveRequestTypeName(settings, leaveRequest.type, t, language)
		
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

		// Wyślij email tylko jeśli użytkownik jest aktywny
		if (user.isActive !== false) {
			try {
				await sendEmail(
					user.username,
					null,
					`${t('email.leaveRequest.titlemail')} ${typeText} ${t(status)}`,
					mailContent
				)
			} catch (emailError) {
				console.error('Error sending email to user:', emailError)
				// Nie przerywaj procesu jeśli email nie zadziała
			}
		}

		try {
			await sendEmailToHR(leaveRequest, user, updatedByUser, t, updatedByInfo, user.teamId)
		} catch (hrEmailError) {
			console.error('Error sending email to HR:', hrEmailError)
			// Nie przerywaj procesu jeśli email do HR nie zadziała
		}

		// Pobierz zaktualizowany leaveRequest z populate
		const updatedLeaveRequest = await LeaveRequest.findById(id)
			.populate({
				path: 'updatedBy',
				select: 'firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.lean()

		res.status(200).json({ message: 'Status updated successfully.', leaveRequest: updatedLeaveRequest })
	} catch (error) {
		console.error('Error updating leave request status:', error)
		console.error('Error stack:', error.stack)
		res.status(500).json({ message: 'Failed to update leave request status.', error: error.message })
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
		const isHR = requestingUser.roles.includes('HR')
		
		// Sprawdź czy przełożony ma dostęp do użytkownika
		const userToView = await User.findById(userId)
		if (!userToView) return res.status(404).send('Nie znaleziono użytkownika')
		
		// Sprawdź czy użytkownicy są w tym samym zespole
		const isSameTeam = requestingUser.teamId.toString() === userToView.teamId.toString()
		
		// Sprawdź uprawnienia przełożonego używając nowych helperów
		let canSupervisorView = false
		if (requestingUser.roles.includes('Przełożony (Supervisor)')) {
			const { canSupervisorViewTimesheets } = require('../services/roleService')
			canSupervisorView = await canSupervisorViewTimesheets(requestingUser, userToView)
		}

		// HIERARCHIA RÓL: Admin > HR > Przełożony
		// Super admin widzi wszystkich, admin/HR widzi wszystkich ze swojego zespołu
		// Przełożony widzi zgodnie z konfiguracją (sprawdzane w canSupervisorViewTimesheets)
		if (!isOwnRequest && !isSuperAdmin && !isSameTeam && !isAdmin && !isHR && !canSupervisorView) {
			return res.status(403).send('Brak uprawnień')
		}

		// Pobierz zaakceptowane wnioski i L4 (status.sent) dla konkretnego użytkownika
		const acceptedLeaveRequests = await LeaveRequest.find({ 
			status: { $in: ['status.accepted', 'status.sent'] },
			userId: userId
		})
			.populate({
				path: 'userId',
				select: 'firstName lastName username department',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'updatedBy',
				select: 'firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.sort({ startDate: 1 })
		// Filtruj wnioski, gdzie userId nie został znaleziony (soft-deleted)
		const filteredRequests = acceptedLeaveRequests.filter(req => req.userId !== null)

		res.status(200).json(filteredRequests)
	} catch (error) {
		console.error('Error fetching accepted leave requests for user:', error)
		res.status(500).send('Failed to fetch accepted leave requests for user.')
	}
}

exports.getUserAcceptedLeaveRequests = async (req, res) => {
	try {
		const requestingUser = await User.findById(req.user.userId)
		if (!requestingUser) return res.status(404).send('Brak użytkownika')

		// Pobierz zaakceptowane wnioski i L4 (status.sent) tylko dla bieżącego użytkownika
		const acceptedLeaveRequests = await LeaveRequest.find({ 
			status: { $in: ['status.accepted', 'status.sent'] },
			userId: requestingUser._id
		})
			.populate({
				path: 'userId',
				select: 'firstName lastName username department',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.populate({
				path: 'updatedBy',
				select: 'firstName lastName',
				match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
			})
			.sort({ startDate: 1 })
		// Filtruj wnioski, gdzie userId nie został znaleziony (soft-deleted)
		const filteredRequests = acceptedLeaveRequests.filter(req => req.userId !== null)

		res.status(200).json(filteredRequests)
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
		const isAdmin = requestingUser.roles.includes('Admin')
		const isHR = requestingUser.roles.includes('HR')
		const isSupervisor = requestingUser.roles.includes('Przełożony (Supervisor)')

		let acceptedLeaveRequests
		let allowedUserIds = []
		
		if (isSuperAdmin) {
			// Super admin widzi wszystkie zaakceptowane wnioski i L4 (status.sent) ze wszystkich zespołów
			acceptedLeaveRequests = await LeaveRequest.find({ 
				status: { $in: ['status.accepted', 'status.sent'] }
			})
				.populate({
					path: 'userId',
					select: 'firstName lastName username department',
					match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
				})
				.populate({
					path: 'updatedBy',
					select: 'firstName lastName',
					match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
				})
				.sort({ startDate: 1 })
		} else if (isAdmin || isHR) {
			// Admin i HR widzą wszystkich z zespołu
			const teamUsers = await User.find({ 
				teamId: requestingUser.teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('_id')
			allowedUserIds = teamUsers.map(user => user._id)

			acceptedLeaveRequests = await LeaveRequest.find({ 
				status: { $in: ['status.accepted', 'status.sent'] },
				userId: { $in: allowedUserIds }
			})
				.populate({
					path: 'userId',
					select: 'firstName lastName username department',
					match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
				})
				.populate({
					path: 'updatedBy',
					select: 'firstName lastName',
					match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
				})
				.sort({ startDate: 1 })
		} else if (isSupervisor) {
			// Przełożony widzi tylko swoich podwładnych
			const { canSupervisorViewTimesheets } = require('../services/roleService')
			
			// Pobierz wszystkich użytkowników z zespołu
			const teamUsers = await User.find({ 
				teamId: requestingUser.teamId,
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('_id firstName lastName department')

			// Filtruj użytkowników na podstawie uprawnień przełożonego
			for (const user of teamUsers) {
				const canView = await canSupervisorViewTimesheets(requestingUser, user)
				if (canView) {
					allowedUserIds.push(user._id)
				}
			}

			if (allowedUserIds.length > 0) {
				acceptedLeaveRequests = await LeaveRequest.find({ 
					status: { $in: ['status.accepted', 'status.sent'] },
					userId: { $in: allowedUserIds }
				})
					.populate({
						path: 'userId',
						select: 'firstName lastName username department',
						match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
					})
					.populate({
						path: 'updatedBy',
						select: 'firstName lastName',
						match: { $or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }] }
					})
					.sort({ startDate: 1 })
			} else {
				acceptedLeaveRequests = []
			}
		} else {
			// Inne role nie mają dostępu
			return res.status(403).send('Brak uprawnień do przeglądania wniosków urlopowych')
		}
		
		// Filtruj wnioski, gdzie userId nie został znaleziony (soft-deleted)
		const filteredRequests = acceptedLeaveRequests.filter(req => req.userId !== null)
		res.status(200).json(filteredRequests)
	} catch (error) {
		console.error('Error fetching accepted leave requests:', error)
		res.status(500).send('Failed to fetch accepted leave requests.')
	}
}

// Funkcja pomocnicza do zbierania unikalnych odbiorców emaili (bez duplikatów)
async function getUniqueEmailRecipients(user, teamId, t) {
	const { canSupervisorApproveLeaves } = require('../services/roleService')
	
	// 1. Zbierz przełożonych z działów
	const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
	const allSupervisors = []
	for (const dept of userDepartments) {
		const deptSupervisors = await findSupervisorsForDepartment(dept, teamId)
		allSupervisors.push(...deptSupervisors)
	}
	
	// 2. Zbierz przełożonych z SupervisorConfig (selectedEmployees) - nawet jeśli nie są w tym samym dziale
	const supervisorConfigs = await SupervisorConfig.find({
		teamId,
		selectedEmployees: user._id,
		'permissions.canApproveLeaves': true,
		'permissions.canApproveLeavesSelectedEmployees': true
	}).select('supervisorId')
	
	const supervisorIdsFromConfig = supervisorConfigs.map(config => config.supervisorId)
	const supervisorsFromConfig = await User.find({
		_id: { $in: supervisorIdsFromConfig },
		teamId,
		roles: { $in: ['Przełożony (Supervisor)'] },
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
	})
	
	// Połącz przełożonych z działów i z konfiguracji
	const allPotentialSupervisors = [...allSupervisors, ...supervisorsFromConfig]
	const uniqueSupervisors = Array.from(new Map(allPotentialSupervisors.map(sup => [sup._id.toString(), sup])).values())
	const potentialSupervisors = uniqueSupervisors.filter(sup => sup.username !== user.username)
	
	// 3. Sprawdź uprawnienia każdego przełożonego
	const supervisors = []
	for (const supervisor of potentialSupervisors) {
		const supervisorObj = await User.findOne({
			_id: supervisor._id,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (!supervisorObj) continue
		const canApprove = await canSupervisorApproveLeaves(supervisorObj, user)
		if (canApprove) {
			supervisors.push(supervisorObj)
		}
	}

	// 4. Zbierz HR (tylko aktywnych)
	const hrUsers = await User.find({
		teamId,
		roles: { $in: ['HR'] },
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
	}).select('username firstName lastName')

	// 5. Zbierz Adminów (jeśli nie ma przełożonych ani HR) - tylko aktywnych
	let adminUsers = []
	if (supervisors.length === 0 && hrUsers.length === 0) {
		adminUsers = await User.find({
			teamId,
			roles: { $in: ['Admin'] },
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('username firstName lastName')
	}

	// 6. Połącz wszystkie listy i usuń duplikaty na podstawie username
	const allRecipients = [...supervisors, ...hrUsers, ...adminUsers]
	const uniqueRecipientsMap = new Map()
	
	for (const recipient of allRecipients) {
		// Użyj username jako klucza do deduplikacji
		// Upewnij się, że odbiorca jest aktywny i nie jest to ten sam użytkownik
		if (recipient.username && 
			recipient.username !== user.username && 
			recipient.isActive !== false) {
			// Jeśli użytkownik już nie jest w mapie, dodaj go
			// Jeśli jest, preferuj pełny obiekt (z firstName, lastName) zamiast tylko username
			if (!uniqueRecipientsMap.has(recipient.username)) {
				uniqueRecipientsMap.set(recipient.username, recipient)
			} else {
				// Jeśli już jest, ale obecny ma więcej danych, zamień
				const existing = uniqueRecipientsMap.get(recipient.username)
				if (recipient.firstName && recipient.lastName && (!existing.firstName || !existing.lastName)) {
					uniqueRecipientsMap.set(recipient.username, recipient)
				}
			}
		}
	}

	// Zwróć unikalną listę odbiorców - dodatkowo przefiltruj na wypadek gdyby ktoś miał isActive: false
	const finalRecipients = Array.from(uniqueRecipientsMap.values()).filter(recipient => 
		recipient.isActive !== false && recipient.username !== user.username
	)
	return finalRecipients
}

// Anulowanie wniosku urlopowego
exports.cancelLeaveRequest = async (req, res) => {
	const { id } = req.params
	const { t } = req

	try {
		const leaveRequest = await LeaveRequest.findById(id)
		if (!leaveRequest) {
			return res.status(404).send('Leave request not found.')
		}

		const requestingUser = await User.findOne({
			_id: req.user.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (!requestingUser) {
			return res.status(404).send('User not found.')
		}

		// Sprawdź uprawnienia - tylko właściciel wniosku lub admin może anulować
		const isOwner = leaveRequest.userId.toString() === req.user.userId
		const isAdmin = requestingUser.roles.includes('Admin')

		if (!isOwner && !isAdmin) {
			return res.status(403).send('Access denied. Only the request owner or admin can cancel the request.')
		}

		const user = await User.findOne({
			_id: leaveRequest.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('firstName lastName username department roles')
		if (!user) {
			return res.status(404).send('User not found or inactive.')
		}

		const teamId = user.teamId || requestingUser.teamId

		// Pobierz dane przed usunięciem dla emaili
		const startDate = leaveRequest.startDate.toISOString().split('T')[0]
		const endDate = leaveRequest.endDate.toISOString().split('T')[0]
		
		// Pobierz Settings dla zespołu i nazwę typu
		const settings = await Settings.getSettings(teamId)
		const language = t('email.leaveRequest.footerNotification').includes('automatycznie') ? 'pl' : 'en'
		const typeText = getLeaveRequestTypeName(settings, leaveRequest.type, t, language)

		// Usuń wniosek
		await LeaveRequest.findByIdAndDelete(id)

		// Zbierz unikalnych odbiorców (bez duplikatów) - uwzględnia przełożonych z SupervisorConfig
		const recipients = await getUniqueEmailRecipients(user, teamId, t)

		if (recipients.length > 0) {
			const cancelContent = `
				<p style="margin: 0 0 16px 0;">${t('email.leaveform.requestCancelledSupervisor')}</p>
				<div style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
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
							<td style="padding: 8px 0; color: #1f2937;">${leaveRequest.daysRequested}</td>
						</tr>
					</table>
				</div>
			`

			// Wyślij email do wszystkich unikalnych odbiorców
			const emailPromises = recipients.map(recipient =>
				sendEmail(
					recipient.username,
					`${appUrl}/leave-requests/${user._id}`,
					t('email.leaveform.requestCancelledTitle'),
					getEmailTemplate(
						t('email.leaveform.requestCancelledTitle'),
						cancelContent,
						t('email.leaveform.goToRequest'),
						`${appUrl}/leave-requests/${user._id}`,
						t
					)
				)
			)

			await Promise.all(emailPromises)
		}

		res.status(200).json({ message: 'Leave request cancelled successfully.' })
	} catch (error) {
		console.error('Error cancelling leave request:', error)
		res.status(500).send('Failed to cancel leave request.')
	}
}

// Edycja wniosku urlopowego
exports.updateLeaveRequest = async (req, res) => {
	const { id } = req.params
	const { type, startDate, endDate, daysRequested, replacement, additionalInfo } = req.body
	const { t } = req

	try {
		const leaveRequest = await LeaveRequest.findById(id)
		if (!leaveRequest) {
			return res.status(404).send('Leave request not found.')
		}

		const requestingUser = await User.findOne({
			_id: req.user.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		})
		if (!requestingUser) {
			return res.status(404).send('User not found.')
		}

		// Sprawdź uprawnienia - tylko właściciel wniosku może edytować
		const isOwner = leaveRequest.userId.toString() === req.user.userId
		if (!isOwner) {
			return res.status(403).send('Access denied. Only the request owner can edit the request.')
		}

		// Sprawdź czy wniosek może być edytowany (tylko jeśli status to pending)
		if (leaveRequest.status !== 'status.pending') {
			return res.status(400).send('Only pending requests can be edited.')
		}

		const user = await User.findOne({
			_id: leaveRequest.userId,
			$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
		}).select('firstName lastName username department roles')
		if (!user) {
			return res.status(404).send('User not found or inactive.')
		}

		const teamId = user.teamId || requestingUser.teamId

		// Pobierz ustawienia zespołu
		const settings = await Settings.getSettings(teamId)
		
		// Walidacja typu wniosku
		if (!isLeaveRequestTypeValid(settings, type)) {
			return res.status(400).json({ 
				message: t('leaveform.invalidType') || 'Nieprawidłowy typ wniosku urlopowego lub typ nie jest włączony dla zespołu.' 
			})
		}
		
		// Sprawdź czy typ wymaga zatwierdzenia
		const typeRequiresApproval = requiresApproval(settings, type)
		const oldTypeRequiresApproval = requiresApproval(settings, leaveRequest.type)

		// Przycinij daty do dni roboczych (usuń weekendy z początku i końca zakresu)
		const { trimmedStartDate, trimmedEndDate } = await trimWeekendsFromDateRange(startDate, endDate, teamId)
		
		// Jeśli nie ma żadnych dni roboczych w zakresie, zwróć błąd
		if (!trimmedStartDate || !trimmedEndDate) {
			return res.status(400).json({ message: t('leaveform.weekendOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni weekendowe lub świąteczne, gdy zespół nie pracuje w weekendy.' })
		}
		
		// Jeśli daty zostały zmienione, przelicz liczbę dni
		let finalDaysRequested = daysRequested
		if (trimmedStartDate !== startDate || trimmedEndDate !== endDate) {
			const dates = await generateDateRange(trimmedStartDate, trimmedEndDate, teamId)
			finalDaysRequested = dates.length
		}

		const oldStartDate = leaveRequest.startDate
		const oldEndDate = leaveRequest.endDate

		// Aktualizuj wniosek
		leaveRequest.type = type
		leaveRequest.startDate = trimmedStartDate // Użyj przyciętych dat
		leaveRequest.endDate = trimmedEndDate // Użyj przyciętych dat
		leaveRequest.daysRequested = finalDaysRequested // Użyj przeliczonych dni
		leaveRequest.replacement = replacement
		leaveRequest.additionalInfo = additionalInfo
		
		// Ustaw status: jeśli nie wymaga zatwierdzenia -> "sent", w przeciwnym razie -> "pending"
		if (!typeRequiresApproval) {
			leaveRequest.status = 'status.sent'
		}
		
		await leaveRequest.save()

		// Dla typów bez wymagania zatwierdzenia: zaktualizuj LeavePlan (jak L4)
		if (!typeRequiresApproval) {
			const LeavePlan = require('../models/LeavePlan')(firmDb)
			const userIdForPlan = leaveRequest.userId._id || leaveRequest.userId
			
			// Usuń stare daty z LeavePlan (jeśli stary typ też nie wymagał zatwierdzenia)
			if (!oldTypeRequiresApproval && (oldStartDate.toString() !== trimmedStartDate || oldEndDate.toString() !== trimmedEndDate)) {
				const oldDates = await generateDateRange(oldStartDate, oldEndDate, teamId)
				await LeavePlan.deleteMany({ userId: userIdForPlan, date: { $in: oldDates } })
			}
			
			// Dodaj nowe daty do LeavePlan
			const newDates = await generateDateRange(trimmedStartDate, trimmedEndDate, teamId)
			const leavePlanPromises = newDates.map(date => {
				const userId = userIdForPlan // Lokalna zmienna w scope map
				return LeavePlan.findOne({ userId, date }).then(existing => {
					if (!existing) {
						const leavePlan = new LeavePlan({
							userId,
							date,
							firstName: user.firstName,
							lastName: user.lastName
						})
						return leavePlan.save()
					}
					return Promise.resolve()
				})
			})
			await Promise.all(leavePlanPromises)
		} else if (!oldTypeRequiresApproval) {
			// Jeśli zmieniono z typu bez wymagania zatwierdzenia na typ z wymaganiem, usuń z LeavePlan
			const LeavePlan = require('../models/LeavePlan')(firmDb)
			const userIdForPlan = leaveRequest.userId._id || leaveRequest.userId
			const oldDates = await generateDateRange(oldStartDate, oldEndDate, teamId)
			await LeavePlan.deleteMany({ userId: userIdForPlan, date: { $in: oldDates } })
		}

		// Zbierz odbiorców emaili:
		// - Jeśli nie wymaga zatwierdzenia: przełożeni + HR/Admin (tylko powiadomienie)
		// - Jeśli wymaga zatwierdzenia: przełożeni (do zatwierdzenia)
		let recipients = []
		if (!typeRequiresApproval) {
			// Zbierz przełożonych (standardowa logika)
			const supervisors = await getUniqueEmailRecipients(user, teamId, t)
			
			// Zbierz HR (tylko aktywnych)
			const hrUsers = await User.find({
				teamId,
				roles: { $in: ['HR'] },
				$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
			}).select('username firstName lastName')
			
			// Jeśli nie ma HR, zbierz Adminów (tylko aktywnych)
			let adminUsers = []
			if (hrUsers.length === 0) {
				adminUsers = await User.find({
					teamId,
					roles: { $in: ['Admin'] },
					$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }]
				}).select('username firstName lastName')
			}
			
			// Połącz wszystkie listy i usuń duplikaty
			const allRecipients = [...supervisors, ...hrUsers, ...adminUsers]
			const uniqueRecipientsMap = new Map()
			
			for (const recipient of allRecipients) {
				if (recipient.username && recipient.username !== user.username) {
					if (!uniqueRecipientsMap.has(recipient.username)) {
						uniqueRecipientsMap.set(recipient.username, recipient)
					} else {
						const existing = uniqueRecipientsMap.get(recipient.username)
						if (recipient.firstName && recipient.lastName && (!existing.firstName || !existing.lastName)) {
							uniqueRecipientsMap.set(recipient.username, recipient)
						}
					}
				}
			}
			
			recipients = Array.from(uniqueRecipientsMap.values())
		} else {
			// Standardowa logika dla innych typów wniosków
			recipients = await getUniqueEmailRecipients(user, teamId, t)
		}

		if (recipients.length > 0) {
			const typeText = t(type)
			const content = `
				<p style="margin: 0 0 16px 0;">${!typeRequiresApproval ? t('email.leaveform.newL4Request') : t('email.leaveform.requestUpdatedSupervisor')}</p>
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
				${!typeRequiresApproval ? `<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.l4Info')}</p>` : `<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.clickButtonToReview')}</p>`}
			`

			// Wyślij email do wszystkich unikalnych odbiorców
			const emailPromises = recipients.map(recipient =>
				sendEmail(
					recipient.username,
					`${appUrl}/leave-requests/${user._id}`,
					t('email.leaveform.title'),
					getEmailTemplate(
						t('email.leaveform.title'),
						content,
						t('email.leaveform.goToRequest'),
						`${appUrl}/leave-requests/${user._id}`,
						t
					)
				)
			)

			await Promise.all(emailPromises)
		}

		res.status(200).json({ message: 'Leave request updated successfully.', leaveRequest })
	} catch (error) {
		console.error('Error updating leave request:', error)
		res.status(500).send('Failed to update leave request.')
	}
}
