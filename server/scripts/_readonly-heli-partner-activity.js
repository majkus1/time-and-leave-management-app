require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const {
	isFreemiumTierTeam,
	isPaidSubscriptionActive,
	isTrialActive,
} = require('../services/entitlementsService')
const { isTeamInvoiceComplete } = require('../services/billingInvoiceValidation')

const SINCE = new Date('2026-05-22T00:00:00.000Z')
const UNTIL = new Date('2026-06-14T00:00:00.000Z') // exclusive end of 13.06

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

	let team = await db.collection('teams').findOne({ name: { $regex: /^HeliPartner$/i } })
	if (!team) {
		team = await db.collection('teams').findOne({ name: { $regex: /HeliPartner|Heli Partner/i } })
	}
	if (!team) {
		const fuzzy = await db
			.collection('teams')
			.find({ name: { $regex: /Heli/i } })
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
			createdAt: 1,
			lastLoginAt: 1,
		})
		.sort({ createdAt: 1 })
		.toArray()
	const userIds = users.map(u => u._id)
	const nameById = Object.fromEntries(users.map(u => [String(u._id), userLabel(u)]))

	const settings = await db.collection('settings').findOne({ teamId })
	const sinceFilter = { $gte: SINCE, $lt: UNTIL }
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
		ledger,
	] = await Promise.all([
		db.collection('leaverequests').find({ ...userIdFilter, createdAt: sinceFilter }).toArray(),
		db.collection('calendarconfirmations').find({ ...userIdFilter, updatedAt: sinceFilter }).toArray(),
		db.collection('timeentries').find({ userId: { $in: userIds }, date: sinceFilter }).toArray(),
		db.collection('logs').find(logUserFilter).sort({ timestamp: -1 }).limit(300).toArray(),
		db.collection('appsessions').find({ teamId, lastSeenAt: sinceFilter }).toArray(),
		db.collection('boards').find({ teamId }).toArray(),
		db.collection('schedules').find({ teamId }).toArray(),
		db.collection('channels').find({ teamId }).toArray(),
		db.collection('announcements').find({ teamId, createdAt: sinceFilter }).toArray(),
		db.collection('legalacceptances').find({ teamId, acceptedAt: sinceFilter }).toArray(),
		db.collection('qrcodes').find({ teamId }).toArray(),
		db.collection('departments').find({ teamId }).toArray(),
		db.collection('billingpaymentsessions').find({ teamId }).sort({ createdAt: -1 }).toArray(),
		db.collection('billingledgerentries').find({ teamId }).sort({ createdAt: -1 }).toArray(),
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
	const allMessages = channelIds.length
		? await db.collection('messages').find({ channelId: { $in: channelIds } }).count()
		: 0

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

	const workdaysByUser = {}
	for (const w of allWorkdays) {
		const uid = String(w.userId)
		if (!workdaysByUser[uid]) workdaysByUser[uid] = { days: 0, totalHours: 0, withTimer: 0, withActivities: 0, withTasks: 0, dates: [] }
		workdaysByUser[uid].days++
		workdaysByUser[uid].totalHours += (w.hoursWorked || 0) + (w.additionalWorked || 0)
		if (w.timerSessions?.length) workdaysByUser[uid].withTimer++
		if (w.manualActivityBlocks?.length) workdaysByUser[uid].withActivities++
		if (w.manualTaskBlocks?.length) workdaysByUser[uid].withTasks++
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

	let scheduleShiftCount = 0
	const scheduleDetails = schedules.map(sch => {
		const days = sch.days || []
		let shifts = 0
		for (const d of days) {
			if (Array.isArray(d.shifts)) shifts += d.shifts.length
			if (Array.isArray(d.entries)) shifts += d.entries.length
		}
		scheduleShiftCount += shifts
		return { name: sch.name, type: sch.type, daysInSchedule: days.length, shifts, members: (sch.members || []).length }
	})

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
		period: { from: SINCE.toISOString(), to: '2026-06-13 end of day' },
		users: {
			total: users.length,
			active: users.filter(u => u.isActive !== false).length,
			deleted: users.filter(u => u.isActive === false).length,
			list: users.map(u => ({
				id: String(u._id),
				name: userLabel(u),
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
				lastSeen: appSessions
					.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt))
					.slice(0, 15)
					.map(s => ({
						user: nameById[String(s.userId)] || String(s.userId),
						lastSeenAt: s.lastSeenAt,
					})),
			},
			workdays: {
				totalTouchedInPeriod: workdaysInPeriod.length,
				totalAllTime: allWorkdays.length,
				withHours: workdaysWithHours.length,
				withAbsence: workdaysWithAbsence.length,
				withTimerSessions: workdaysWithTimer.length,
				withManualActivities: workdaysWithActivities.length,
				withManualTasks: workdaysWithTasks.length,
				uniqueUsersInPeriod: new Set(workdaysInPeriod.map(w => String(w.userId))).size,
				byDay: summarizeByDay(workdaysInPeriod, 'updatedAt'),
				byUser: Object.fromEntries(
					Object.entries(workdaysByUser).map(([id, v]) => [
						(nameById[id] || id) + (users.find(u => String(u._id) === id)?.isActive === false ? ' [deleted]' : ''),
						{
							days: v.days,
							totalHours: v.totalHours,
							withTimerDays: v.withTimer,
							withActivityDays: v.withActivities,
							withTaskDays: v.withTasks,
							firstDate: v.dates.sort()[0],
							lastDate: v.dates.sort().slice(-1)[0],
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
					daysRequested: r.daysRequested,
					status: r.status,
					createdAt: r.createdAt,
				})),
			},
			calendarConfirmations: {
				total: calendarConfirmations.length,
				items: calendarConfirmations.map(c => ({
					user: nameById[String(c.userId)] || String(c.userId),
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
				totalAllTime: allTasks.length,
				byStatus: allTasks.reduce((acc, t) => {
					acc[t.status] = (acc[t.status] || 0) + 1
					return acc
				}, {}),
				recent: allTasks
					.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
					.slice(0, 10)
					.map(t => ({ title: t.title, status: t.status, createdAt: t.createdAt })),
			},
			chat: {
				messagesInPeriod: messagesInPeriod.length,
				totalAllTime: allMessages,
				byDay: summarizeByDay(messagesInPeriod, 'createdAt'),
			},
			announcements: { total: announcements.length },
			schedules: { totalShifts: scheduleShiftCount, details: scheduleDetails },
			logs: {
				totalSampled: logs.length,
				byAction: logActionCounts,
				recent: logs.slice(0, 30).map(l => ({
					action: l.action,
					details: String(l.details).slice(0, 140),
					timestamp: l.timestamp,
					user: nameById[String(l.user)] || String(l.user),
				})),
			},
			billing: {
				paymentSessions: billingSessions.map(s => ({
					status: s.status,
					planKey: s.planKey,
					billingCycle: s.billingCycle,
					createdAt: s.createdAt,
				})),
				ledger: ledger.map(l => ({
					action: l.action,
					payload: l.payload,
					createdAt: l.createdAt,
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
