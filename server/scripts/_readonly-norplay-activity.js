require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const {
	isFreemiumTierTeam,
	isPaidSubscriptionActive,
	isTrialActive,
} = require('../services/entitlementsService')
const { isTeamInvoiceComplete } = require('../services/billingInvoiceValidation')

const SINCE = new Date('2026-06-02T00:00:00.000Z')

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

function userLabel(u) {
	return `${u.firstName || ''} ${u.lastName || ''}`.trim() + ` (${u.username})`
}

async function main() {
	await mongoose.connect(process.env.DB_URI)
	const db = mongoose.connection.db

	let team = await db.collection('teams').findOne({ name: { $regex: /^NorPlay$/i } })
	if (!team) {
		team = await db.collection('teams').findOne({ name: { $regex: /Nor\s*Play/i } })
	}
	if (!team) {
		const fuzzy = await db
			.collection('teams')
			.find({ name: { $regex: /Nor.*Play|Play.*Nor/i } })
			.project({ name: 1, createdAt: 1 })
			.toArray()
		console.log(JSON.stringify({ error: 'Team not found', fuzzy }, null, 2))
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
			managedOnly: 1,
			createdAt: 1,
			firstLoginAt: 1,
			deletedAt: 1,
		})
		.sort({ createdAt: 1 })
		.toArray()
	const userIds = users.map(u => u._id)
	const nameById = Object.fromEntries(users.map(u => [String(u._id), userLabel(u)]))

	const settings = await db.collection('settings').findOne({ teamId })
	const sinceFilter = { $gte: SINCE }
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
		qrCodes,
		departments,
		leavePlans,
		aiUsage,
	] = await Promise.all([
		db.collection('leaverequests').find({ ...userIdFilter, createdAt: sinceFilter }).toArray(),
		db.collection('calendarconfirmations').find({ ...userIdFilter, updatedAt: sinceFilter }).toArray(),
		db.collection('timeentries').find({ userId: { $in: userIds }, date: sinceFilter }).toArray(),
		db.collection('logs').find(logUserFilter).sort({ timestamp: -1 }).limit(400).toArray(),
		db.collection('appsessions').find({ teamId, lastSeenAt: sinceFilter }).toArray(),
		db.collection('boards').find({ teamId }).toArray(),
		db.collection('schedules').find({ teamId }).toArray(),
		db.collection('channels').find({ teamId }).toArray(),
		db.collection('announcements').find({ teamId, createdAt: sinceFilter }).toArray(),
		db.collection('qrcodes').find({ teamId }).toArray(),
		db.collection('departments').find({ teamId }).toArray(),
		db.collection('leaveplans').find({ userId: { $in: userIds }, updatedAt: sinceFilter }).toArray(),
		db.collection('aichatusages').find({ teamId, createdAt: sinceFilter }).toArray().catch(() => []),
	])

	const boardIds = boards.map(b => b._id)
	const tasksInPeriod = boardIds.length
		? await db.collection('tasks').find({ boardId: { $in: boardIds }, createdAt: sinceFilter }).toArray()
		: []
	const allTasks = boardIds.length
		? await db.collection('tasks').find({ boardId: { $in: boardIds } }).toArray()
		: []

	const workdaysInPeriod = await db.collection('workdays').find({
		userId: { $in: userIds },
		$or: [{ updatedAt: sinceFilter }, { createdAt: sinceFilter }, { date: sinceFilter }],
	}).toArray()
	const allWorkdays = await db.collection('workdays').find({ userId: { $in: userIds } }).toArray()

	const channelIds = channels.map(c => c._id)
	const messagesInPeriod = channelIds.length
		? await db.collection('messages').find({ channelId: { $in: channelIds }, createdAt: sinceFilter }).toArray()
		: []
	const allMessagesCount = channelIds.length
		? await db.collection('messages').countDocuments({ channelId: { $in: channelIds } })
		: 0

	const logActionCounts = {}
	for (const l of logs) {
		logActionCounts[l.action] = (logActionCounts[l.action] || 0) + 1
	}

	const workdaysWithHours = workdaysInPeriod.filter(w => (w.hoursWorked || 0) > 0 || (w.additionalWorked || 0) > 0)
	const workdaysWithAbsence = workdaysInPeriod.filter(w => w.absenceType)
	const workdaysWithTimer = workdaysInPeriod.filter(
		w => (Array.isArray(w.timerSessions) && w.timerSessions.length > 0) || (Array.isArray(w.timeEntries) && w.timeEntries.length > 0)
	)
	const workdaysWithActivities = workdaysInPeriod.filter(
		w => Array.isArray(w.manualActivityBlocks) && w.manualActivityBlocks.length > 0
	)
	const workdaysWithTasks = workdaysInPeriod.filter(
		w => Array.isArray(w.manualTaskBlocks) && w.manualTaskBlocks.length > 0
	)

	const workdaysByUser = {}
	for (const w of workdaysInPeriod) {
		const uid = String(w.userId)
		if (!workdaysByUser[uid]) {
			workdaysByUser[uid] = { days: 0, totalHours: 0, withTimer: 0, withActivities: 0, withTasks: 0, withAbsence: 0, dates: [] }
		}
		workdaysByUser[uid].days++
		workdaysByUser[uid].totalHours += (w.hoursWorked || 0) + (w.additionalWorked || 0)
		if (w.timerSessions?.length || w.timeEntries?.length) workdaysByUser[uid].withTimer++
		if (w.manualActivityBlocks?.length) workdaysByUser[uid].withActivities++
		if (w.manualTaskBlocks?.length) workdaysByUser[uid].withTasks++
		if (w.absenceType) workdaysByUser[uid].withAbsence++
		workdaysByUser[uid].dates.push(w.date)
	}

	const sessionsByUser = {}
	for (const s of appSessions) {
		const uid = String(s.userId)
		sessionsByUser[uid] = (sessionsByUser[uid] || 0) + 1
	}

	const leavesByUser = {}
	for (const r of leaveRequests) {
		const uid = String(r.userId)
		leavesByUser[uid] = (leavesByUser[uid] || 0) + 1
	}

	let scheduleEntriesInPeriod = 0
	let scheduleAvailabilitiesInPeriod = 0
	const scheduleDetails = schedules.map(sch => {
		const days = sch.days || []
		let entries = 0
		let availabilities = 0
		for (const d of days) {
			const dayDate = d.date ? new Date(d.date) : null
			if (!dayDate || dayDate < SINCE) continue
			if (Array.isArray(d.entries)) {
				entries += d.entries.length
				scheduleEntriesInPeriod += d.entries.length
			}
			if (Array.isArray(d.availabilities)) {
				availabilities += d.availabilities.length
				scheduleAvailabilitiesInPeriod += d.availabilities.length
			}
		}
		return {
			name: sch.name,
			type: sch.type,
			departmentName: sch.departmentName || null,
			totalDays: days.length,
			entriesSinceJun2: entries,
			availabilitiesSinceJun2: availabilities,
			members: (sch.members || []).length,
			updatedAt: sch.updatedAt,
		}
	})

	const settingsFeatures = settings
		? {
				timerEnabled: settings.timerEnabled,
				qrEnabled: settings.qrEnabled,
				workActivitiesCount: Array.isArray(settings.workActivities)
					? settings.workActivities.filter(a => a.isEnabled !== false).length
					: 0,
				leaveRequestTypesCount: Array.isArray(settings.leaveRequestTypes)
					? settings.leaveRequestTypes.filter(t => t.isEnabled !== false).length
					: 0,
				workOnWeekends: settings.workOnWeekends,
			}
		: null

	const modulesUsed = {
		ewidencjaCzasuPracy: workdaysInPeriod.length > 0 || timeEntries.length > 0,
		urlopyWnioski: leaveRequests.length > 0,
		urlopyPlany: leavePlans.length > 0,
		grafik: scheduleEntriesInPeriod > 0 || scheduleAvailabilitiesInPeriod > 0,
		zadaniaTablice: tasksInPeriod.length > 0 || allTasks.length > 0,
		czat: messagesInPeriod.length > 0,
		ogloszenia: announcements.length > 0,
		timerLubQR: workdaysWithTimer.length > 0 || timeEntries.length > 0 || qrCodes.length > 0,
		czynnosciWewidencji: workdaysWithActivities.length > 0,
		zadaniaWEwidencji: workdaysWithTasks.length > 0,
		asystentAI: Array.isArray(aiUsage) && aiUsage.length > 0,
	}

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
			currentUserCount: team.currentUserCount,
			billingModuleKeys: team.billingModuleKeys,
			paidSubscriptionActive: isPaidSubscriptionActive(team, now),
			trialActive: isTrialActive(team, now),
			freemiumTier: isFreemiumTierTeam(team, now),
			invoiceComplete: isTeamInvoiceComplete(team),
		},
		period: { from: SINCE.toISOString(), to: now.toISOString(), label: 'od 2 czerwca 2026' },
		users: {
			total: users.length,
			activeWithAppAccess: users.filter(u => u.isActive !== false && u.appAccessEnabled !== false).length,
			managedOnlyNoApp: users.filter(u => u.managedOnly === true).length,
			inactiveOrDeleted: users.filter(u => u.isActive === false).length,
			list: users.map(u => ({
				id: String(u._id),
				name: userLabel(u),
				roles: u.roles,
				department: u.department,
				isActive: u.isActive !== false,
				appAccessEnabled: u.appAccessEnabled !== false,
				managedOnly: u.managedOnly === true,
				createdAt: u.createdAt,
				firstLoginAt: u.firstLoginAt || null,
				deletedAt: u.deletedAt || null,
			})),
		},
		modulesSummary: {
			onlyEwidencja:
				modulesUsed.ewidencjaCzasuPracy &&
				!modulesUsed.urlopyWnioski &&
				!modulesUsed.grafik &&
				!modulesUsed.zadaniaTablice &&
				!modulesUsed.czat &&
				!modulesUsed.asystentAI,
			modulesUsed,
		},
		featuresConfigured: settingsFeatures,
		structure: {
			departments: departments.map(d => d.name),
			boards: boards.map(b => ({ name: b.name, type: b.type, departmentName: b.departmentName, createdAt: b.createdAt })),
			schedules: scheduleDetails,
			channels: channels.map(c => ({ name: c.name, type: c.type, departmentName: c.departmentName })),
			qrCodes: qrCodes.length,
		},
		activity: {
			appSessions: {
				total: appSessions.length,
				uniqueUsers: new Set(appSessions.map(s => String(s.userId))).size,
				byDay: summarizeByDay(appSessions, 'lastSeenAt'),
				byUser: Object.fromEntries(
					Object.entries(sessionsByUser).map(([id, n]) => [nameById[id] || id, n])
				),
			},
			workdays: {
				recordsTouchedInPeriod: workdaysInPeriod.length,
				totalAllTime: allWorkdays.length,
				withHours: workdaysWithHours.length,
				withAbsence: workdaysWithAbsence.length,
				withTimerOrTimeEntries: workdaysWithTimer.length,
				withManualActivities: workdaysWithActivities.length,
				withManualTasks: workdaysWithTasks.length,
				uniqueUsersInPeriod: new Set(workdaysInPeriod.map(w => String(w.userId))).size,
				byDay: summarizeByDay(workdaysInPeriod, 'updatedAt'),
				byUser: Object.fromEntries(
					Object.entries(workdaysByUser).map(([id, v]) => [
						nameById[id] || id,
						{
							daysTouched: v.days,
							totalHours: Math.round(v.totalHours * 10) / 10,
							withTimerDays: v.withTimer,
							withActivityDays: v.withActivities,
							withTaskDays: v.withTasks,
							withAbsenceDays: v.withAbsence,
							firstDate: v.dates.map(d => dayKey(new Date(d))).sort()[0],
							lastDate: v.dates.map(d => dayKey(new Date(d))).sort().slice(-1)[0],
						},
					])
				),
			},
			leaveRequests: {
				total: leaveRequests.length,
				byStatus: leaveRequests.reduce((acc, r) => {
					acc[r.status] = (acc[r.status] || 0) + 1
					return acc
				}, {}),
				byUser: Object.fromEntries(
					Object.entries(leavesByUser).map(([id, n]) => [nameById[id] || id, n])
				),
				items: leaveRequests.map(r => ({
					user: nameById[String(r.userId)] || String(r.userId),
					type: r.type,
					startDate: r.startDate,
					endDate: r.endDate,
					status: r.status,
					createdAt: r.createdAt,
				})),
			},
			leavePlans: { updatedInPeriod: leavePlans.length },
			calendarConfirmations: { total: calendarConfirmations.length },
			timerQrTimeEntries: {
				total: timeEntries.length,
				uniqueUsers: new Set(timeEntries.map(t => String(t.userId))).size,
			},
			tasks: {
				createdInPeriod: tasksInPeriod.length,
				totalAllTime: allTasks.length,
				byStatus: allTasks.reduce((acc, t) => {
					acc[t.status] = (acc[t.status] || 0) + 1
					return acc
				}, {}),
			},
			chat: {
				messagesInPeriod: messagesInPeriod.length,
				totalAllTime: allMessagesCount,
				byDay: summarizeByDay(messagesInPeriod, 'createdAt'),
			},
			announcements: { total: announcements.length },
			schedules: {
				entriesSinceJun2: scheduleEntriesInPeriod,
				availabilitiesSinceJun2: scheduleAvailabilitiesInPeriod,
				details: scheduleDetails,
			},
			aiAssistant: { usageEventsInPeriod: Array.isArray(aiUsage) ? aiUsage.length : 0 },
			logs: {
				totalSampled: logs.length,
				byAction: logActionCounts,
				recent: logs.slice(0, 25).map(l => ({
					action: l.action,
					details: String(l.details || '').slice(0, 120),
					timestamp: l.timestamp,
					user: nameById[String(l.user)] || String(l.user),
				})),
			},
		},
	}

	console.log(JSON.stringify(report, null, 2))
	await mongoose.disconnect()
}

main().catch(e => {
	console.error(e)
	process.exit(1)
})
