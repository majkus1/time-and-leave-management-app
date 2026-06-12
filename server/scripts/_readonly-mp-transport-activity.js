require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const {
	isFreemiumTierTeam,
	isPaidSubscriptionActive,
	isTrialActive,
} = require('../services/entitlementsService')
const { isTeamInvoiceComplete } = require('../services/billingInvoiceValidation')

const SINCE = new Date('2026-06-02T00:00:00.000Z')
const UNTIL = new Date('2026-06-12T00:00:00.000Z') // exclusive end of 11.06

function dayKey(d) {
	return d.toISOString().slice(0, 10)
}

function summarizeByDay(items, dateField) {
	const map = {}
	for (const item of items) {
		const raw = item[dateField]
		if (!raw) continue
		const k = dayKey(new Date(raw))
		map[k] = (map[k] || 0) + 1
	}
	return Object.entries(map)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, count]) => ({ date, count }))
}

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db

	const team = await db.collection('teams').findOne({
		name: { $regex: /^MP\s*TRANSPORT$/i },
	})
	if (!team) {
		const fuzzy = await db
			.collection('teams')
			.find({ name: { $regex: /MP.*TRANSPORT|TRANSPORT.*MP/i } })
			.project({ name: 1, createdAt: 1 })
			.toArray()
		console.log(JSON.stringify({ error: 'Exact team not found', fuzzy }, null, 2))
		await mongoose.disconnect()
		return
	}

	const teamId = team._id
	const now = new Date()
	const users = await db
		.collection('users')
		.find({ teamId })
		.project({
			username: 1,
			firstName: 1,
			lastName: 1,
			roles: 1,
			department: 1,
			isActive: 1,
			appAccessEnabled: 1,
			createdAt: 1,
			lastLoginAt: 1,
		})
		.sort({ createdAt: 1 })
		.toArray()
	const userIds = users.map(u => u._id)
	const activeUserIds = users.filter(u => u.isActive !== false).map(u => u._id)

	const settings = await db.collection('settings').findOne({ teamId })

	const sinceFilter = { $gte: SINCE, $lt: UNTIL }
	const userFilter = { userId: { $in: userIds } }
	const userIdFilter = { userId: { $in: userIds } }
	const logUserFilter = { user: { $in: userIds }, timestamp: sinceFilter }

	const [
		leaveRequests,
		calendarConfirmations,
		timeEntries,
		logs,
		appSessions,
		boards,
		schedules,
		channels,
		announcements,
		legalAcceptances,
		qrCodes,
		departments,
		billingSessions,
	] = await Promise.all([
		db.collection('leaverequests').find({ ...userIdFilter, createdAt: sinceFilter }).toArray(),
		db.collection('calendarconfirmations').find({ ...userIdFilter, updatedAt: sinceFilter }).toArray(),
		db.collection('timeentries').find({ userId: { $in: userIds }, date: sinceFilter }).toArray(),
		db
			.collection('logs')
			.find(logUserFilter)
			.sort({ timestamp: -1 })
			.limit(200)
			.toArray(),
		db.collection('appsessions').find({ teamId, lastSeenAt: sinceFilter }).toArray(),
		db.collection('boards').find({ teamId }).toArray(),
		db.collection('schedules').find({ teamId }).toArray(),
		db.collection('channels').find({ teamId }).toArray(),
		db.collection('announcements').find({ teamId, createdAt: sinceFilter }).toArray(),
		db.collection('legalacceptances').find({ teamId, acceptedAt: sinceFilter }).toArray(),
		db.collection('qrcodes').find({ teamId }).toArray(),
		db.collection('departments').find({ teamId }).toArray(),
		db.collection('billingpaymentsessions').find({ teamId }).sort({ createdAt: -1 }).toArray(),
	])

	const boardIds = boards.map(b => b._id)
	const tasksInPeriod = boardIds.length
		? await db.collection('tasks').find({ boardId: { $in: boardIds }, createdAt: sinceFilter }).toArray()
		: []

	const workdaysInPeriod = await db.collection('workdays').find({
		userId: { $in: userIds },
		$or: [{ updatedAt: sinceFilter }, { createdAt: sinceFilter }, { date: sinceFilter }],
	}).toArray()

	const channelIds = channels.map(c => c._id)
	const messagesInPeriod = channelIds.length
		? await db
				.collection('messages')
				.find({ channelId: { $in: channelIds }, createdAt: sinceFilter })
				.toArray()
		: []

	const logActionCounts = {}
	for (const l of logs) {
		logActionCounts[l.action] = (logActionCounts[l.action] || 0) + 1
	}

	const workdaysWithHours = workdaysInPeriod.filter(w => (w.hoursWorked || 0) > 0 || (w.additionalWorked || 0) > 0)
	const workdaysWithAbsence = workdaysInPeriod.filter(w => w.absenceType)
	const workdaysWithTimer = workdaysInPeriod.filter(w => Array.isArray(w.timerSessions) && w.timerSessions.length > 0)
	const workdaysWithActivities = workdaysInPeriod.filter(
		w => Array.isArray(w.manualActivityBlocks) && w.manualActivityBlocks.length > 0
	)
	const workdaysWithTasks = workdaysInPeriod.filter(
		w => Array.isArray(w.manualTaskBlocks) && w.manualTaskBlocks.length > 0
	)

	const uniqueUsersWorkdays = new Set(workdaysInPeriod.map(w => String(w.userId)))
	const uniqueUsersSessions = new Set(appSessions.map(s => String(s.userId)))
	const uniqueUsersLogs = new Set(logs.map(l => String(l.user)))

	const settingsFeatures = settings
		? {
				timerEnabled: settings.timerEnabled,
				workActivitiesCount: Array.isArray(settings.workActivities)
					? settings.workActivities.filter(a => a.isEnabled !== false).length
					: 0,
				workActivities: (settings.workActivities || [])
					.filter(a => a.isEnabled !== false)
					.map(a => ({ id: a.id, name: a.name, group: a.group })),
				leaveRequestTypesCount: Array.isArray(settings.leaveRequestTypes)
					? settings.leaveRequestTypes.filter(t => t.isEnabled !== false).length
					: 0,
				workOnWeekends: settings.workOnWeekends,
			}
		: null

	const report = {
		team: {
			id: String(teamId),
			name: team.name,
			createdAt: team.createdAt,
			billingPlanKey: team.billingPlanKey,
			billingStatus: team.billingStatus,
			billingCycle: team.billingCycle,
			billingPeriodEnd: team.billingPeriodEnd,
			trialEndsAt: team.trialEndsAt,
			maxUsers: team.maxUsers,
			billingModuleKeys: team.billingModuleKeys,
			paidSubscriptionActive: isPaidSubscriptionActive(team, now),
			trialActive: isTrialActive(team, now),
			freemiumTier: isFreemiumTierTeam(team, now),
			invoiceComplete: isTeamInvoiceComplete(team),
		},
		period: { from: SINCE.toISOString(), to: '2026-06-11 end of day (exclusive 12.06)' },
		users: {
			total: users.length,
			active: users.filter(u => u.isActive !== false).length,
			list: users.map(u => ({
				id: String(u._id),
				name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
				username: u.username,
				roles: u.roles,
				department: u.department,
				isActive: u.isActive !== false,
				appAccessEnabled: u.appAccessEnabled !== false,
				createdAt: u.createdAt,
				lastLoginAt: u.lastLoginAt || null,
			})),
		},
		featuresConfigured: settingsFeatures,
		structure: {
			departments: departments.map(d => d.name),
			boards: boards.map(b => ({ name: b.name, type: b.type, departmentName: b.departmentName })),
			schedules: schedules.map(s => ({ name: s.name, type: s.type, departmentName: s.departmentName })),
			channels: channels.map(c => ({ name: c.name, type: c.type, departmentName: c.departmentName })),
			qrCodes: qrCodes.length,
		},
		activitySinceTeamCreation: {
			appSessions: {
				total: appSessions.length,
				uniqueUsers: uniqueUsersSessions.size,
				byDay: summarizeByDay(appSessions, 'lastSeenAt'),
				lastSeen: appSessions
					.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
					.slice(0, 10)
					.map(s => ({
						userId: String(s.userId),
						lastSeenAt: s.lastSeenAt,
						userAgent: s.userAgent ? String(s.userAgent).slice(0, 80) : null,
					})),
			},
			workdays: {
				totalTouched: workdaysInPeriod.length,
				withHours: workdaysWithHours.length,
				withAbsence: workdaysWithAbsence.length,
				withTimerSessions: workdaysWithTimer.length,
				withManualActivities: workdaysWithActivities.length,
				withManualTasks: workdaysWithTasks.length,
				uniqueUsers: uniqueUsersWorkdays.size,
				byDay: summarizeByDay(workdaysInPeriod, 'updatedAt'),
				sampleRecent: workdaysInPeriod
					.sort((a, b) => new Date(b.updatedAt || b.date) - new Date(a.updatedAt || a.date))
					.slice(0, 8)
					.map(w => ({
						userId: String(w.userId),
						date: w.date,
						hoursWorked: w.hoursWorked,
						absenceType: w.absenceType || null,
						hasTimer: !!(w.timerSessions && w.timerSessions.length),
						hasActivities: !!(w.manualActivityBlocks && w.manualActivityBlocks.length),
						updatedAt: w.updatedAt,
					})),
			},
			leaveRequests: {
				total: leaveRequests.length,
				byStatus: leaveRequests.reduce((acc, r) => {
					acc[r.status] = (acc[r.status] || 0) + 1
					return acc
				}, {}),
				items: leaveRequests.map(r => ({
					userId: String(r.userId),
					type: r.type,
					startDate: r.startDate,
					endDate: r.endDate,
					daysRequested: r.daysRequested,
					status: r.status,
					createdAt: r.createdAt,
				})),
			},
			calendarConfirmations: {
				total: calendarConfirmations.length,
				items: calendarConfirmations.map(c => ({
					userId: String(c.userId),
					month: c.month,
					year: c.year,
					isConfirmed: c.isConfirmed,
					confirmedAt: c.confirmedAt,
				})),
			},
			timerQrTimeEntries: {
				total: timeEntries.length,
				uniqueUsers: new Set(timeEntries.map(t => String(t.userId))).size,
			},
			tasks: {
				createdInPeriod: tasksInPeriod.length,
				items: tasksInPeriod.map(t => ({
					title: t.title,
					status: t.status,
					createdAt: t.createdAt,
					boardId: String(t.boardId),
				})),
			},
			chat: {
				messagesInPeriod: messagesInPeriod.length,
				byDay: summarizeByDay(messagesInPeriod, 'createdAt'),
			},
			announcements: { total: announcements.length },
			logs: {
				totalSampled: logs.length,
				uniqueUsers: uniqueUsersLogs.size,
				byAction: logActionCounts,
				recent: logs.slice(0, 25).map(l => ({
					action: l.action,
					details: String(l.details).slice(0, 120),
					timestamp: l.timestamp,
					userId: String(l.user),
				})),
			},
			legalAcceptances: legalAcceptances.length,
			billing: {
				paymentSessions: billingSessions.map(s => ({
					status: s.status,
					planKey: s.planKey,
					createdAt: s.createdAt,
				})),
			},
		},
		summaryPlain: [],
	}

	const s = []
	if (report.activitySinceTeamCreation.appSessions.total > 0)
		s.push(`Logowania/sesje: ${report.activitySinceTeamCreation.appSessions.total} (${report.activitySinceTeamCreation.appSessions.uniqueUsers} użytk.)`)
	if (report.activitySinceTeamCreation.workdays.totalTouched > 0)
		s.push(
			`Ewidencja (workdays): ${report.activitySinceTeamCreation.workdays.totalTouched} wpisów, godziny: ${report.activitySinceTeamCreation.workdays.withHours}, nieobecności: ${report.activitySinceTeamCreation.workdays.withAbsence}, timer: ${report.activitySinceTeamCreation.workdays.withTimerSessions}, czynności: ${report.activitySinceTeamCreation.workdays.withManualActivities}`
		)
	if (report.activitySinceTeamCreation.leaveRequests.total > 0)
		s.push(`Urlopy/wnioski: ${report.activitySinceTeamCreation.leaveRequests.total}`)
	if (report.activitySinceTeamCreation.calendarConfirmations.total > 0)
		s.push(`Potwierdzenia miesiąca: ${report.activitySinceTeamCreation.calendarConfirmations.total}`)
	if (report.activitySinceTeamCreation.timerQrTimeEntries.total > 0)
		s.push(`Wpisy QR/timer: ${report.activitySinceTeamCreation.timerQrTimeEntries.total}`)
	if (report.activitySinceTeamCreation.tasks.createdInPeriod > 0)
		s.push(`Nowe zadania: ${report.activitySinceTeamCreation.tasks.createdInPeriod}`)
	if (report.activitySinceTeamCreation.chat.messagesInPeriod > 0)
		s.push(`Wiadomości czat: ${report.activitySinceTeamCreation.chat.messagesInPeriod}`)
	if (report.activitySinceTeamCreation.announcements.total > 0)
		s.push(`Ogłoszenia: ${report.activitySinceTeamCreation.announcements.total}`)
	if (s.length === 0) s.push('Brak istotnej aktywności operacyjnej w okresie 2–11.06 (poza ewentualnym setupem zespołu).')
	report.summaryPlain = s

	console.log(JSON.stringify(report, null, 2))
	await mongoose.disconnect()
}

main().catch(e => {
	console.error(e)
	process.exit(1)
})
