const { firmDb } = require('../db/db')
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const User = require('../models/user')(firmDb)
const LeavePlan = require('../models/LeavePlan')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const Team = require('../models/Team')(firmDb)
const entitlementsService = require('../services/entitlementsService')
const { sendEmail, escapeHtml, getEmailTemplate } = require('../services/emailService')
const { sendLeaveRequestPushNotification } = require('../services/pushNotificationService')
const {
	resolveLeaveRequestRecipients,
	formatLeaveRecipientsForDisplay,
} = require('../services/leaveRecipientsService')
const { applyLeaveBalanceAutoDeduction } = require('../services/leaveBalanceService')
const { emitLeaveRequestsUpdated } = require('../utils/leaveRealtime')
const {
	findConflictingApprovedLeaveRequest,
	findBlockingLeaveRequestOnDate,
	sumHourlyLeaveHoursOnDate,
	findDuplicateOpenLeaveRequest,
} = require('../utils/leaveRequestConflicts')
const { toDateKey: toLeaveDateKey } = require('../services/leaveScheduleConflictService')
const { appUrl } = require('../config')
const { isHoliday } = require('../utils/holidays')
const { isLeaveRequestTypeValid, requiresApproval, getLeaveRequestTypeName } = require('../utils/leaveRequestTypes')
const {
	formatLeaveQuantityValue,
	getLeaveRequestQuantity,
	getLeaveRequestQuantityLabel,
	hourlyValidationMessage,
	resolveLeaveTypeSettlement,
	validateHourlyLeaveSubmission,
} = require('../utils/leaveSettlement')
const {
	isSameTeam,
	isSelfUser,
	hasAdminOrHrRole,
} = require('../utils/vacationAccessPolicy')

const ACTIVE_USER_FILTER = {
	$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
}

// Funkcja pomocnicza do sprawdzania czy dzień jest weekendem
function isWeekend(date) {
	const day = new Date(date).getDay()
	return day === 0 || day === 6 // 0 = niedziela, 6 = sobota
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

async function resolveLeaveRequestSubmitTarget({ requestingUserId, targetUserId, settings }) {
	const requestingUser = await User.findOne({
		_id: requestingUserId,
		...ACTIVE_USER_FILTER,
	})
	if (!requestingUser || requestingUser.appAccessEnabled === false) {
		return { error: { status: 404, message: 'Użytkownik nie znaleziony' } }
	}

	const effectiveTargetUserId = targetUserId || requestingUserId
	const targetUser = await User.findOne({
		_id: effectiveTargetUserId,
		...ACTIVE_USER_FILTER,
	})
	if (!targetUser) {
		return { error: { status: 404, message: 'Pracownik nie został znaleziony' } }
	}

	const self = isSelfUser(requestingUser._id, targetUser._id)
	if (self) return { requestingUser, targetUser }

	if (targetUser.appAccessEnabled === false) {
		const team = await Team.findById(requestingUser.teamId).select(
			'name billingPlanKey billingStatus billingPeriodEnd billingModuleKeys trialEndsAt billingHadPaidPlan maxUsers isActive'
		)
		if (entitlementsService.isFreemiumTierTeam(team)) {
			return {
				error: {
					status: 403,
					message:
						'W planie darmowym nie można składać wniosków urlopowych za pracownika bez dostępu do aplikacji.',
				},
			}
		}
	}

	if (!isSameTeam(requestingUser.teamId, targetUser.teamId)) {
		return { error: { status: 404, message: 'Pracownik nie został znaleziony' } }
	}
	if (settings.allowManagedLeaveRequests !== true) {
		return { error: { status: 403, message: 'Zgłaszanie urlopu za pracownika jest wyłączone w ustawieniach zespołu.' } }
	}
	if (targetUser.appAccessEnabled !== false) {
		return { error: { status: 403, message: 'Wniosek za pracownika można złożyć tylko dla pracownika bez dostępu do aplikacji.' } }
	}
	if (hasAdminOrHrRole(requestingUser)) {
		return { requestingUser, targetUser }
	}

	const { canSupervisorApproveLeaves } = require('../services/roleService')
	const canApprove = await canSupervisorApproveLeaves(requestingUser, targetUser)
	if (canApprove) {
		return { requestingUser, targetUser }
	}

	return { error: { status: 403, message: 'Brak uprawnień do zgłoszenia urlopu za tego pracownika.' } }
}

exports.submitLeaveRequest = async (req, res) => {
	const { type, startDate, endDate, daysRequested, hoursRequested, replacement, additionalInfo, targetUserId } = req.body
	const t = req.t

	try {
		const requestingUser = await User.findOne({
			_id: req.user.userId,
			...ACTIVE_USER_FILTER,
		})
		if (!requestingUser) {
			return res.status(404).send('Użytkownik nie znaleziony')
		}
		const teamId = requestingUser.teamId

		// Pobierz ustawienia zespołu
		const settings = await Settings.getSettings(teamId)
		const targetAccess = await resolveLeaveRequestSubmitTarget({
			requestingUserId: req.user.userId,
			targetUserId,
			settings,
		})
		if (targetAccess.error) {
			return res.status(targetAccess.error.status).json({ message: targetAccess.error.message })
		}
		const user = targetAccess.targetUser
		const userId = user._id
		const submittedByUser =
			targetAccess.requestingUser && targetAccess.requestingUser._id.toString() !== user._id.toString()
				? targetAccess.requestingUser
				: null
		
		// Walidacja typu wniosku
		if (!isLeaveRequestTypeValid(settings, type)) {
			return res.status(400).json({ 
				message: t('leaveform.invalidType') || 'Nieprawidłowy typ wniosku urlopowego lub typ nie jest włączony dla zespołu.' 
			})
		}
		
		// Sprawdź czy typ wymaga zatwierdzenia
		const typeRequiresApproval = requiresApproval(settings, type)

		const settlement = resolveLeaveTypeSettlement(settings, type)
		const isHourlyRequest = settlement.captureMode === 'hourly'

		let trimmedStartDate
		let trimmedEndDate
		let finalDaysRequested
		let finalHoursRequested = null

		if (isHourlyRequest) {
			// ── Typ rozliczany godzinowo: jeden dzień + liczba godzin ──────────────────
			const startYmd = toLeaveDateKey(startDate)
			const endYmd = toLeaveDateKey(endDate || startDate)

			// Dzień musi być roboczy. generateDateRange odsiewa i weekendy, i święta —
			// w przeciwieństwie do trimWeekendsFromDateRange, które przy workOnWeekends
			// wychodzi wcześniej i świąt w ogóle nie sprawdza.
			const workingDates = startYmd ? await generateDateRange(startYmd, startYmd, teamId) : []
			if (!workingDates.length) {
				return res.status(400).json({
					message: t('leaveform.weekendOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni weekendowe lub świąteczne, gdy zespół nie pracuje w weekendy.',
				})
			}

			const alreadyBookedHoursOnDay = await sumHourlyLeaveHoursOnDate({
				LeaveRequest,
				userId,
				dateYmd: startYmd,
			})
			const validation = validateHourlyLeaveSubmission({
				settings,
				typeId: type,
				startYmd,
				endYmd,
				hoursRequested,
				alreadyBookedHoursOnDay,
			})
			if (!validation.ok) {
				return res.status(400).json({
					code: validation.code,
					message: hourlyValidationMessage(validation.code, t, settlement.hoursPerDay),
				})
			}

			// Wniosek godzinowy nie koliduje z innymi godzinowymi, ale nie ma sensu na dniu,
			// w którym pracownik ma już zatwierdzony urlop na cały dzień.
			const blockingRequest = await findBlockingLeaveRequestOnDate({
				LeaveRequest,
				userId,
				dateYmd: startYmd,
			})
			if (blockingRequest) {
				return res.status(409).json({
					message:
						'Ten dzień koliduje z już zatwierdzonym wnioskiem na cały dzień. Zmień datę albo zaktualizuj istniejący wniosek.',
				})
			}

			trimmedStartDate = startYmd
			trimmedEndDate = startYmd
			finalDaysRequested = 1 // wymagane przez schemat; pracownik jest tego dnia częściowo nieobecny
			finalHoursRequested = validation.hours
		} else {
			// Przycinij daty do dni roboczych (usuń weekendy z początku i końca zakresu)
			const trimmed = await trimWeekendsFromDateRange(startDate, endDate, teamId)
			trimmedStartDate = trimmed.trimmedStartDate
			trimmedEndDate = trimmed.trimmedEndDate

			// Jeśli nie ma żadnych dni roboczych w zakresie, zwróć błąd
			if (!trimmedStartDate || !trimmedEndDate) {
				return res.status(400).json({ message: t('leaveform.weekendOnlyError') || 'Nie można złożyć wniosku urlopowego wyłącznie na dni weekendowe lub świąteczne, gdy zespół nie pracuje w weekendy.' })
			}

			// Jeśli daty zostały zmienione, przelicz liczbę dni
			finalDaysRequested = daysRequested
			if (trimmedStartDate !== startDate || trimmedEndDate !== endDate) {
				const dates = await generateDateRange(trimmedStartDate, trimmedEndDate, teamId)
				finalDaysRequested = dates.length
			}

			// Blokuj nakładające się okresy z już zaakceptowanymi/auto-zatwierdzonymi wnioskami.
			// ignoreHourly: istniejący wniosek godzinowy zajmuje tylko część dnia i nie może
			// blokować zwykłego urlopu.
			const conflictingRequest = await findConflictingApprovedLeaveRequest({
				LeaveRequest,
				userId,
				startDate: trimmedStartDate,
				endDate: trimmedEndDate,
				ignoreHourly: true,
			})
			if (conflictingRequest) {
				return res.status(409).json({
					message:
						'Ten zakres dat koliduje z już zatwierdzonym wnioskiem. Zmień daty albo zaktualizuj istniejący wniosek.',
				})
			}
		}

		// Ochrona przed podwojnym wyslaniem tego samego formularza. Blokada w kliencie
		// moze zawiesc (odswiezenie strony, ponowione zadanie), wiec ostatnie slowo ma serwer.
		const duplicateRequest = await findDuplicateOpenLeaveRequest({
			LeaveRequest,
			userId,
			type,
			startDate: trimmedStartDate,
			endDate: trimmedEndDate,
			hoursRequested: finalHoursRequested,
		})
		if (duplicateRequest) {
			return res.status(409).json({
				code: 'DUPLICATE_LEAVE_REQUEST',
				message:
					'Taki wniosek już istnieje i czeka na rozpatrzenie. Sprawdź listę swoich wniosków.',
			})
		}

		// Ustaw status: jeśli nie wymaga zatwierdzenia -> "sent", w przeciwnym razie -> "pending"
		const status = typeRequiresApproval ? 'status.pending' : 'status.sent'

		const leaveRequest = new LeaveRequest({
			userId,
			...(submittedByUser ? { submittedBy: submittedByUser._id } : {}),
			type,
			startDate: trimmedStartDate, // Użyj przyciętych dat
			endDate: trimmedEndDate, // Użyj przyciętych dat
			daysRequested: finalDaysRequested, // Zawsze przechowujemy dni w bazie
			...(isHourlyRequest
				? {
						hoursRequested: finalHoursRequested,
						settlementUnit: 'hours',
						hoursPerDaySnapshot: settlement.hoursPerDay,
					}
				: {}),
			replacement,
			additionalInfo,
			status,
		})
		await leaveRequest.save()

		// Typ bez zatwierdzania trafia od razu na status „wysłany", czyli od razu zajmuje pulę.
		// Przy typach wymagających zatwierdzenia plan wyjdzie pusty — pula ruszy się dopiero
		// przy akceptacji przełożonego.
		await applyLeaveBalanceAutoDeduction({
			settings,
			leaveRequest,
			previousStatus: undefined,
			nextStatus: leaveRequest.status,
		})

		// Zbierz odbiorców emaili:
		// - Jeśli nie wymaga zatwierdzenia (jak L4): przełożeni + HR/Admin (tylko powiadomienie)
		// - Jeśli wymaga zatwierdzenia: przełożeni (do zatwierdzenia)
		const { recipients } = await resolveLeaveRequestRecipients({ user, teamId, typeRequiresApproval })

		// Dla typów bez wymagania zatwierdzenia: automatycznie dodaj do LeavePlan (jak L4).
		// Wniosek godzinowy pomijamy — LeavePlan oznacza CAŁY zaplanowany dzień urlopu,
		// a kilkugodzinna nieobecność nim nie jest (i nie blokuje dnia pracy).
		if (!typeRequiresApproval && !isHourlyRequest) {
			const dates = await generateDateRange(trimmedStartDate, trimmedEndDate, teamId)
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
			emitLeaveRequestsUpdated(req, {
				teamId,
				userId,
				leaveRequestId: leaveRequest._id,
				status: leaveRequest.status,
				action: 'created',
			})
			res.status(201).json({ message: 'Wniosek został wysłany.', leaveRequest })
			return
		}

		// Określ język na podstawie tłumaczeń
		const language = t('email.leaveRequest.footerNotification')?.includes('automatycznie') ? 'pl' : 'en'
		const typeText = getLeaveRequestTypeName(settings, type, t, language)
		const quantityLabels = {
			days: t('email.leaveform.days') || 'Dni',
			hours: t('email.leaveform.hours') || 'Godziny',
		}
		const content = `
			<p style="margin: 0 0 16px 0;">${!typeRequiresApproval ? t('email.leaveform.newAutoApprovedRequest') : t('email.leaveform.newRequestSupervisor')}</p>
			<div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px;">
				<p style="margin: 0 0 12px 0; font-weight: 600; color: #1f2937;">${t('email.leaveform.requestDetails')}</p>
				<table style="width: 100%; border-collapse: collapse;">
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 140px;">${t('email.leaveform.employee')}:</td>
						<td style="padding: 8px 0; color: #1f2937; font-weight: 600;">${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</td>
					</tr>
					${submittedByUser ? `
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Zgłoszono przez:</td>
						<td style="padding: 8px 0; color: #1f2937;">${escapeHtml(submittedByUser.firstName || '')} ${escapeHtml(submittedByUser.lastName || '')}</td>
					</tr>
					` : ''}
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.type')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${typeText}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.dates')}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${trimmedStartDate} - ${trimmedEndDate}</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${getLeaveRequestQuantityLabel(leaveRequest, settings, quantityLabels)}:</td>
						<td style="padding: 8px 0; color: #1f2937;">${formatLeaveQuantityValue(leaveRequest, settings)}</td>
					</tr>
				</table>
			</div>
			${!typeRequiresApproval ? `<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.autoApprovedInfo')}</p>` : `<p style="margin: 0 0 24px 0; color: #6b7280; font-size: 14px;">${t('email.leaveform.clickButtonToReview')}</p>`}
		`
		
		const employee = `${user.firstName || ''} ${user.lastName || ''}`.trim()
		const previewQuantity = getLeaveRequestQuantity(leaveRequest, settings)
		const qtyLabel =
			previewQuantity.unit === 'hours'
				? `${previewQuantity.value.toFixed(1)} h`
				: `${previewQuantity.value} ${t('email.leaveform.days') || 'dni'}`
		const newLeavePreview = `${employee} · ${typeText} · ${trimmedStartDate}–${trimmedEndDate} · ${qtyLabel}`

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
				),
				{ teamId, preview: newLeavePreview }
			)
		)

		await Promise.all(emailPromises)

		// Send push notifications to recipients (non-blocking)
		if (recipients.length > 0) {
			const recipientUserIds = recipients
				.filter(r => r._id)
				.map(r => r._id.toString())
			
			if (recipientUserIds.length > 0) {
				sendLeaveRequestPushNotification(leaveRequest, user, recipientUserIds, 'new', null, t, {
					submittedByUser,
				})
					.catch(error => {
						console.error('Error sending leave request push notifications:', error)
					})
			}
		}

		emitLeaveRequestsUpdated(req, {
			teamId,
			userId,
			leaveRequestId: leaveRequest._id,
			status: leaveRequest.status,
			action: 'created',
		})
		res.status(201).json({ message: 'Wniosek został wysłany i powiadomienie zostało dostarczone.', leaveRequest })
	} catch (error) {
		console.error('Błąd podczas zgłaszania nieobecności:', error)
		res.status(500).json({ message: 'Błąd podczas zgłaszania nieobecności' })
	}
}

// Podgląd dla formularza: kto zobaczy ten wniosek i będzie mógł go zatwierdzić.
// Liczone tą samą funkcją co przy zapisie, więc podgląd nie może się rozjechać.
// Tylko odczyt — nic nie zapisuje i nie wysyła.
exports.getLeaveRequestRecipients = async (req, res) => {
	const { type, targetUserId } = req.query

	try {
		// teamId bierzemy z bazy, tak samo jak w submitLeaveRequest, a nie z tokenu.
		const requestingUser = await User.findOne({
			_id: req.user.userId,
			...ACTIVE_USER_FILTER,
		})
		if (!requestingUser) {
			return res.status(404).json({ message: 'Użytkownik nie znaleziony' })
		}
		const settings = await Settings.getSettings(requestingUser.teamId)

		// Te same reguły dostępu co przy składaniu wniosku za pracownika.
		const targetAccess = await resolveLeaveRequestSubmitTarget({
			requestingUserId: req.user.userId,
			targetUserId,
			settings,
		})
		if (targetAccess.error) {
			return res.status(targetAccess.error.status).json({ message: targetAccess.error.message })
		}
		const user = targetAccess.targetUser

		if (!isLeaveRequestTypeValid(settings, type)) {
			return res.status(400).json({ message: 'Nieprawidłowy typ wniosku urlopowego.' })
		}

		const { mode, recipients } = await resolveLeaveRequestRecipients({
			user,
			teamId: user.teamId,
			typeRequiresApproval: requiresApproval(settings, type),
		})

		res.json({
			mode,
			recipients: formatLeaveRecipientsForDisplay(recipients, { requesterId: user._id }),
		})
	} catch (error) {
		console.error('Błąd podczas pobierania odbiorców wniosku:', error)
		res.status(500).json({ message: 'Błąd podczas pobierania odbiorców wniosku' })
	}
}
