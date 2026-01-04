const { firmDb } = require('../db/db')
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const User = require('../models/user')(firmDb)
const SupervisorConfig = require('../models/SupervisorConfig')(firmDb)
const LeavePlan = require('../models/LeavePlan')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const { findSupervisorsForDepartment } = require('../services/roleService')
const { appUrl } = require('../config')
const { isHoliday } = require('../utils/holidays')

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
		roles: { $in: ['Przełożony (Supervisor)'] }
	})
	
	// Połącz przełożonych z działów i z konfiguracji
	const allPotentialSupervisors = [...allSupervisors, ...supervisorsFromConfig]
	const uniqueSupervisors = Array.from(new Map(allPotentialSupervisors.map(sup => [sup._id.toString(), sup])).values())
	const potentialSupervisors = uniqueSupervisors.filter(sup => sup.username !== user.username)
	
	// 3. Sprawdź uprawnienia każdego przełożonego
	const supervisors = []
	for (const supervisor of potentialSupervisors) {
		const supervisorObj = await User.findById(supervisor._id)
		if (!supervisorObj) continue
		const canApprove = await canSupervisorApproveLeaves(supervisorObj, user)
		if (canApprove) {
			supervisors.push(supervisorObj)
		}
	}

	// 4. Zbierz HR
	const hrUsers = await User.find({
		teamId,
		roles: { $in: ['HR'] },
	}).select('username firstName lastName')

	// 5. Zbierz Adminów (jeśli nie ma przełożonych ani HR)
	let adminUsers = []
	if (supervisors.length === 0 && hrUsers.length === 0) {
		adminUsers = await User.find({
			teamId,
			roles: { $in: ['Admin'] },
		}).select('username firstName lastName')
	}

	// 6. Połącz wszystkie listy i usuń duplikaty na podstawie username
	const allRecipients = [...supervisors, ...hrUsers, ...adminUsers]
	const uniqueRecipientsMap = new Map()
	
	for (const recipient of allRecipients) {
		// Użyj username jako klucza do deduplikacji
		if (recipient.username && recipient.username !== user.username) {
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

	// Zwróć unikalną listę odbiorców
	return Array.from(uniqueRecipientsMap.values())
}

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

exports.submitLeaveRequest = async (req, res) => {
	const { type, startDate, endDate, daysRequested, replacement, additionalInfo } = req.body
	const userId = req.user.userId
	const teamId = req.user.teamId
	const t = req.t

	try {
		const isL4 = type === 'leaveform.option6'
		
		// Dla L4 ustaw status na "sent", dla innych pozostaw "pending"
		const status = isL4 ? 'status.sent' : 'status.pending'
		
		const leaveRequest = new LeaveRequest({
			userId,
			type,
			startDate,
			endDate,
			daysRequested,
			replacement,
			additionalInfo,
			status,
		})
		await leaveRequest.save()

		const user = await User.findById(userId).select('firstName lastName roles department username')
		if (!user) return res.status(404).send('Użytkownik nie znaleziony.')

		// Dla L4: zbierz przełożonych + HR/Admin
		// Dla innych: użyj standardowej logiki
		let recipients = []
		if (isL4) {
			// Zbierz przełożonych (standardowa logika)
			const supervisors = await getUniqueEmailRecipients(user, teamId, t)
			
			// Zbierz HR
			const hrUsers = await User.find({
				teamId,
				roles: { $in: ['HR'] },
			}).select('username firstName lastName')
			
			// Jeśli nie ma HR, zbierz Adminów
			let adminUsers = []
			if (hrUsers.length === 0) {
				adminUsers = await User.find({
					teamId,
					roles: { $in: ['Admin'] },
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

		// Dla L4: automatycznie dodaj do LeavePlan
		if (isL4) {
			const dates = await generateDateRange(startDate, endDate, teamId)
			const leavePlanPromises = dates.map(date => {
				// Sprawdź czy już istnieje plan na ten dzień
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
		}

		if (recipients.length === 0) {
			// Jeśli nie ma odbiorców, zakończ (nie wysyłaj emaili)
			res.status(201).json({ message: 'Wniosek został wysłany.', leaveRequest })
			return
		}

		const typeText = t(type)
		const content = `
			<p style="margin: 0 0 16px 0;">${isL4 ? t('email.leaveform.newL4Request') : t('email.leaveform.newRequestSupervisor')}</p>
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
			${isL4 ? `<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.l4Info')}</p>` : `<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.clickButtonToReview')}</p>`}
		`
		
		// Wyślij email do wszystkich unikalnych odbiorców
		const emailPromises = recipients.map(recipient =>
			sendEmail(
				recipient.username,
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

		res.status(201).json({ message: 'Wniosek został wysłany i powiadomienie zostało dostarczone.', leaveRequest })
	} catch (error) {
		console.error('Błąd podczas zgłaszania nieobecności:', error)
		res.status(500).json({ message: 'Błąd podczas zgłaszania nieobecności' })
	}
}
