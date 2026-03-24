/**
 * Builds structured text context for the AI assistant (role-scoped).
 * Supports compact aggregates for long / "all-time" ranges.
 */
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)
const Announcement = require('../models/Announcement')(firmDb)
const Team = require('../models/Team')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const Schedule = require('../models/Schedule')(firmDb)
const Department = require('../models/Department')(firmDb)
const {
	resolveDetailedDataScope,
	getTeamUserIdsForAggregates,
} = require('./aiAssistantScopeService')
const { buildVerifiedStatsForAi } = require('./aiVerifiedStatsService')
const { roundWorkHoursForDisplay } = require('../utils/workHoursDisplay')

const MS_PER_DAY = 86400000
const MAX_RANGE_DAYS = 366
const MAX_RANGE_ALL_TIME_DAYS = 5475 // ~15 years
const MAX_WORKDAY_DOCS = 400
const MAX_WORKDAY_DOCS_COMPACT = 120
const MAX_TASKS = 200
const MAX_TASKS_ALL = 400
const MAX_ANNOUNCEMENTS = 40
const MAX_ANNOUNCEMENTS_ALL = 80
const MAX_LEAVE_LINES = 220
const MAX_LEAVE_LINES_COMPACT = 90

function formatDate(d) {
	if (!d) return null
	const x = new Date(d)
	return x.toISOString().slice(0, 10)
}

function daysBetween(start, end) {
	return Math.ceil((end - start) / MS_PER_DAY) + 1
}

/**
 * @param {{ start: Date, end: Date }} range
 * @param {{ isAllTime?: boolean }} opts
 */
function validateAndClampRange(range, opts = {}) {
	const start = new Date(range.start)
	const end = new Date(range.end)
	start.setHours(0, 0, 0, 0)
	end.setHours(23, 59, 59, 999)
	if (start > end) return { start: end, end: start, clamped: false }
	const maxDays = opts.isAllTime ? MAX_RANGE_ALL_TIME_DAYS : MAX_RANGE_DAYS
	const span = daysBetween(start.getTime(), end.getTime())
	if (span > maxDays) {
		const clampedStart = new Date(end)
		clampedStart.setDate(clampedStart.getDate() - (maxDays - 1))
		clampedStart.setHours(0, 0, 0, 0)
		return { start: clampedStart, end, clamped: true, isAllTime: !!opts.isAllTime }
	}
	return { start, end, clamped: false, isAllTime: !!opts.isAllTime }
}

function leaveStatusBucket(status) {
	if (status === 'status.pending') return 'pending'
	if (status === 'status.rejected') return 'rejected'
	return 'acceptedOrSent'
}

function incrementDayMap(map, date, bucket) {
	const key = formatDate(date)
	if (!key) return
	if (!map[key]) map[key] = { pending: 0, acceptedOrSent: 0, rejected: 0 }
	map[key][bucket] = (map[key][bucket] || 0) + 1
}

function expandLeaveToDayMap(leave, map) {
	const s = new Date(leave.startDate)
	const e = new Date(leave.endDate)
	s.setHours(0, 0, 0, 0)
	e.setHours(0, 0, 0, 0)
	for (let t = s.getTime(); t <= e.getTime(); t += MS_PER_DAY) {
		incrementDayMap(map, new Date(t), leaveStatusBucket(leave.status))
	}
}

function announcementVisibleToUser(ann, userId, userDepartments) {
	if (ann.targetScope === 'all') return true
	if (ann.targetScope === 'department' && ann.targetDepartment) {
		const depts = Array.isArray(userDepartments) ? userDepartments : []
		return depts.includes(ann.targetDepartment)
	}
	if (ann.targetScope === 'users' && Array.isArray(ann.targetUsers)) {
		return ann.targetUsers.some(id => id.toString() === userId.toString())
	}
	return false
}

/**
 * Team settings, boards, schedules, departments — safe snapshot (no secrets).
 */
async function buildStaticTeamSnapshot(teamId, locale) {
	const team = await Team.findById(teamId).select('name maxUsers createdAt isActive').lean()
	const settingsDoc = await Settings.getSettings(teamId)
	const settingsLean = settingsDoc.toObject ? settingsDoc.toObject() : { ...settingsDoc }

	const leaveTypes = (settingsLean.leaveRequestTypes || []).map(t => ({
		id: t.id,
		name: t.name,
		nameEn: t.nameEn || null,
		isEnabled: t.isEnabled !== false,
		requireApproval: t.requireApproval !== false,
		allowDaysLimit: !!t.allowDaysLimit,
		minDaysBefore: t.minDaysBefore ?? null,
	}))

	const settingsForAi = {
		workOnWeekends: settingsLean.workOnWeekends !== false,
		includePolishHolidays: !!settingsLean.includePolishHolidays,
		includeCustomHolidays: !!settingsLean.includeCustomHolidays,
		customHolidays: (settingsLean.customHolidays || []).slice(0, 80),
		workHours: settingsLean.workHours || [],
		leaveRequestTypes: leaveTypes,
		leaveCalculationMode: settingsLean.leaveCalculationMode || 'days',
		leaveHoursPerDay: settingsLean.leaveHoursPerDay,
		timerEnabled: settingsLean.timerEnabled !== false,
	}

	const boards = await Board.find({ teamId, isActive: true })
		.select('name type departmentName isTeamBoard members')
		.lean()

	const boardLines = boards.map(b => {
		const m = Array.isArray(b.members) ? b.members.length : 0
		return `- "${b.name}" | type:${b.type}${b.departmentName ? ` | dept:${b.departmentName}` : ''} | members:${m}${b.isTeamBoard ? ' | teamBoard' : ''}`
	})

	const schedules = await Schedule.find({ teamId, isActive: true })
		.select('name type departmentName members availabilityEnabled')
		.lean()

	const scheduleLines = schedules.map(s => {
		const m = Array.isArray(s.members) ? s.members.length : 0
		return `- "${s.name}" | type:${s.type}${s.departmentName ? ` | dept:${s.departmentName}` : ''} | members:${m} | availability:${!!s.availabilityEnabled}`
	})

	const departments = await Department.find({ teamId, isActive: true }).select('name').lean()
	const deptNames = departments.map(d => d.name).filter(Boolean)

	const leaveLegend = leaveTypes
		.filter(t => t.isEnabled)
		.map(t => `  - ${t.id} → "${t.name}"${t.nameEn ? ` (EN: "${t.nameEn}")` : ''}`)
		.join('\n')

	const roleHelp =
		locale === 'en'
			? 'Roles: Admin (full team), HR (full team leave/timesheets), Przełożony (Supervisor) (scoped by config), Pracownik (Worker) (own data + anonymized team leave load).'
			: 'Role: Admin (cały zespół), HR (cały zespół), Przełożony (Supervisor) (według konfiguracji), Pracownik (Worker) (własne dane + anonimowe obłożenie urlopami).'

	const parts = []
	parts.push('--- Team & app configuration (current) ---')
	parts.push(`Team: ${team?.name || '?'} | active:${team?.isActive !== false} | maxUsers:${team?.maxUsers ?? '?'} | created:${team?.createdAt ? formatDate(team.createdAt) : '?'}`)
	parts.push(roleHelp)
	parts.push('')
	parts.push('SETTINGS (affects behaviour):')
	parts.push(`workOnWeekends=${settingsForAi.workOnWeekends} (if false, team policy treats weekends as non-working for timer / some checks)`)
	parts.push(`includePolishHolidays=${settingsForAi.includePolishHolidays} | includeCustomHolidays=${settingsForAi.includeCustomHolidays}`)
	parts.push(`timerEnabled=${settingsForAi.timerEnabled} | leaveCalculationMode=${settingsForAi.leaveCalculationMode} | leaveHoursPerDay=${settingsForAi.leaveHoursPerDay}`)
	parts.push(`standardWorkHoursSlots: ${JSON.stringify(settingsForAi.workHours)}`)
	if (settingsForAi.customHolidays.length) {
		parts.push(`customHolidays: ${JSON.stringify(settingsForAi.customHolidays)}`)
	}
	parts.push('')
	parts.push('LEAVE TYPE IDS → LABELS (use human names in answers, not only raw ids):')
	parts.push(leaveLegend || '(none)')
	parts.push('')
	parts.push(`Departments (model): ${deptNames.length ? deptNames.join(', ') : '(none or only on users)'}`)
	parts.push('')
	parts.push('Task boards (Kanban):')
	parts.push(boardLines.length ? boardLines.join('\n') : '(none)')
	parts.push('')
	parts.push('Schedules (shifts / planning):')
	parts.push(scheduleLines.length ? scheduleLines.join('\n') : '(none)')
	parts.push('--- End team snapshot ---')
	return parts.join('\n')
}

/**
 * @param {object} params
 * @param {import('mongoose').Document} params.requestingUser
 * @param {{ start: Date, end: Date }} params.range
 * @param {string} [params.locale]
 * @param {boolean} [params.isAllTime]
 * @param {number|null} [params.yearMessageOverride] - calendar year if message forced range (e.g. 2025)
 */
exports.buildTeamDataContext = async function buildTeamDataContext({
	requestingUser,
	range,
	locale = 'pl',
	isAllTime = false,
	yearMessageOverride = null,
}) {
	const { start, end, clamped } = validateAndClampRange(range, { isAllTime })
	const spanDays = daysBetween(start.getTime(), end.getTime())
	const useCompact = isAllTime || spanDays > 200

	const teamId = requestingUser.teamId
	const requesterId = requestingUser._id

	const { scope, detailedUserIds } = await resolveDetailedDataScope(requestingUser)
	const teamUserIds = await getTeamUserIdsForAggregates(teamId)

	const verifiedStats = await buildVerifiedStatsForAi({
		requestingUser,
		range,
		detailedUserIds,
		scope,
		yearMessageOverride,
	})

	const staticSnapshot = await buildStaticTeamSnapshot(teamId, locale)

	const users = await User.find({ _id: { $in: detailedUserIds } })
		.select('firstName lastName department roles')
		.lean()

	const userLines = users.map(u => {
		const depts = Array.isArray(u.department) ? u.department.join(', ') : u.department || ''
		return `- id:${u._id} | ${u.firstName} ${u.lastName} | departments:[${depts}] | roles:${(u.roles || []).join(',')}`
	})

	let workdaysTruncated = false
	let workdayJson = '[]'

	if (useCompact) {
		const agg = await Workday.aggregate([
			{
				$match: {
					userId: { $in: detailedUserIds },
					date: { $gte: start, $lte: end },
				},
			},
			{
				$group: {
					_id: '$userId',
					daysWithRecords: { $sum: 1 },
					totalHoursWorked: { $sum: { $ifNull: ['$hoursWorked', 0] } },
					totalAdditional: { $sum: { $ifNull: ['$additionalWorked', 0] } },
				},
			},
		])
		const recent = await Workday.find({
			userId: { $in: detailedUserIds },
			date: { $gte: start, $lte: end },
		})
			.sort({ date: -1 })
			.limit(MAX_WORKDAY_DOCS_COMPACT)
			.lean()

		const samples = recent.map(wd => {
			const uid = wd.userId?.toString?.() || String(wd.userId)
			const notes = (wd.notes || '').slice(0, 200)
			const descs = (wd.timeEntries || [])
				.map(te => (te.workDescription || '').slice(0, 120))
				.filter(Boolean)
				.slice(0, 2)
			const hw = wd.hoursWorked != null ? roundWorkHoursForDisplay(wd.hoursWorked) : null
			return { userId: uid, date: formatDate(wd.date), hoursWorked: hw, notes, sessionDescHints: descs }
		})

		workdayJson = JSON.stringify({
			mode: 'compact',
			perUserTotals: agg.map(a => ({
				userId: String(a._id),
				daysWithRecords: a.daysWithRecords,
				totalHoursWorked: roundWorkHoursForDisplay(a.totalHoursWorked),
				totalAdditional: roundWorkHoursForDisplay(a.totalAdditional),
			})),
			recentDaySamples: samples,
		})
	} else {
		let workdays = await Workday.find({
			userId: { $in: detailedUserIds },
			date: { $gte: start, $lte: end },
		})
			.sort({ date: 1 })
			.lean()

		if (workdays.length > MAX_WORKDAY_DOCS) {
			workdaysTruncated = true
			workdays = workdays.slice(-MAX_WORKDAY_DOCS)
		}

		const workdaySummaries = workdays.map(wd => {
			const uid = wd.userId?.toString?.() || String(wd.userId)
			const sessions = (wd.timeEntries || []).map(te => ({
				start: te.startTime,
				end: te.endTime,
				break: te.isBreak,
				desc: (te.workDescription || '').slice(0, 400),
			}))
			return {
				userId: uid,
				date: formatDate(wd.date),
				hoursWorked: wd.hoursWorked != null ? roundWorkHoursForDisplay(wd.hoursWorked) : null,
				additionalWorked: wd.additionalWorked != null ? roundWorkHoursForDisplay(wd.additionalWorked) : null,
				notes: (wd.notes || '').slice(0, 600),
				absenceType: wd.absenceType || null,
				sessions,
			}
		})

		let workdaySummariesLocal = workdaySummaries
		workdayJson = JSON.stringify(workdaySummariesLocal)
		if (workdayJson.length > 95000) {
			const byUser = {}
			for (const w of workdaySummariesLocal) {
				if (!byUser[w.userId]) {
					byUser[w.userId] = { days: 0, totalHours: 0, notesSample: [], sessionDescSample: [] }
				}
				const b = byUser[w.userId]
				b.days += 1
				b.totalHours += Number(w.hoursWorked) || 0
				if (w.notes && b.notesSample.length < 3) b.notesSample.push(`${w.date}: ${w.notes.slice(0, 200)}`)
				for (const s of w.sessions || []) {
					if (s.desc && b.sessionDescSample.length < 8) b.sessionDescSample.push(`${w.date}: ${s.desc.slice(0, 200)}`)
				}
			}
			for (const uid of Object.keys(byUser)) {
				const th = roundWorkHoursForDisplay(byUser[uid].totalHours)
				byUser[uid].totalHours = th === null ? 0 : th
			}
			workdaySummariesLocal = [{ aggregated: true, byUserId: byUser }]
			workdayJson = JSON.stringify(workdaySummariesLocal)
		}
	}

	const leavesDetailed = await LeaveRequest.find({
		userId: { $in: detailedUserIds },
		startDate: { $lte: end },
		endDate: { $gte: start },
	})
		.sort({ startDate: -1 })
		.lean()

	let leaveLines = leavesDetailed.map(lr => {
		const uid = lr.userId?.toString?.() || String(lr.userId)
		return `- userId:${uid} | ${formatDate(lr.startDate)}→${formatDate(lr.endDate)} | type:${lr.type} | days:${lr.daysRequested} | status:${lr.status}`
	})

	let leaveExtra = ''
	const maxLeaves = useCompact ? MAX_LEAVE_LINES_COMPACT : MAX_LEAVE_LINES
	if (leaveLines.length > maxLeaves) {
		const byStatus = {}
		const byType = {}
		for (const lr of leavesDetailed) {
			byStatus[lr.status] = (byStatus[lr.status] || 0) + 1
			byType[lr.type] = (byType[lr.type] || 0) + 1
		}
		leaveExtra = `\nLeave summary in range: byStatus=${JSON.stringify(byStatus)} byTypeId=${JSON.stringify(byType)}`
		leaveLines = leaveLines.slice(0, maxLeaves)
		leaveExtra += `\n(showing last ${maxLeaves} leave rows; totals above are for full range)`
	}

	const teamLeaveDayMap = {}
	if (scope === 'self') {
		const teamLeaves = await LeaveRequest.find({
			userId: { $in: teamUserIds },
			startDate: { $lte: end },
			endDate: { $gte: start },
		}).lean()

		for (const lr of teamLeaves) {
			expandLeaveToDayMap(lr, teamLeaveDayMap)
		}
	}

	const boards = await Board.find({ teamId, isActive: true }).select('_id name type departmentName').lean()
	const boardIds = boards.map(b => b._id)
	const boardMap = Object.fromEntries(boards.map(b => [b._id.toString(), b]))

	const taskLimit = useCompact || isAllTime ? MAX_TASKS_ALL : MAX_TASKS
	const taskBase = { boardId: { $in: boardIds }, isActive: { $ne: false } }
	let tasks
	if (isAllTime) {
		tasks = await Task.find(taskBase).sort({ updatedAt: -1 }).limit(taskLimit * 2).lean()
	} else {
		// Uwzględnij też zadania wg terminu / okresu realizacji (nie tylko data utworzenia/edycji),
		// żeby asystent widział np. „co wypada w tym tygodniu” przy starszych kartach.
		tasks = await Task.find({
			...taskBase,
			$or: [
				{ createdAt: { $gte: start, $lte: end } },
				{ updatedAt: { $gte: start, $lte: end } },
				{ dueDate: { $gte: start, $lte: end } },
				{
					$and: [
						{ workPeriodStart: { $ne: null } },
						{ workPeriodEnd: { $ne: null } },
						{ workPeriodStart: { $lte: end } },
						{ workPeriodEnd: { $gte: start } },
					],
				},
			],
		})
			.sort({ updatedAt: -1 })
			.limit(taskLimit * 2)
			.lean()
	}

	const detailedSet = new Set(detailedUserIds.map(id => id.toString()))
	tasks = tasks.filter(t => {
		const createdBy = t.createdBy?.toString?.()
		const assigned = (t.assignedTo || []).map(a => a.toString())
		const touches = createdBy && detailedSet.has(createdBy)
		const assignedToVisible = assigned.some(a => detailedSet.has(a))
		if (scope === 'team') return true
		return touches || assignedToVisible
	}).slice(0, taskLimit)

	const taskLines = tasks.map(t => {
		const b = boardMap[t.boardId?.toString()] || {}
		const assigned = (t.assignedTo || []).map(a => a.toString()).join(',')
		const due = t.dueDate ? formatDate(t.dueDate) : ''
		const wp0 = t.workPeriodStart ? formatDate(t.workPeriodStart) : ''
		const wp1 = t.workPeriodEnd ? formatDate(t.workPeriodEnd) : ''
		const workPeriod =
			wp0 || wp1 ? `${wp0 || '?'}→${wp1 || '?'}` : ''
		const placement = t.calendarOnly ? 'calendar-only' : 'kanban'
		const descHint = (t.description || '').replace(/\s+/g, ' ').trim().slice(0, 100)
		return `- taskId:${t._id} | board:"${b.name || ''}" (${b.type || ''}) | title:${(t.title || '').slice(0, 120)} | status:${t.status} | priority:${t.priority} | dueDate:${due || '-'} | workPeriod:${workPeriod || '-'} | placement:${placement}${descHint ? ` | desc:${descHint}` : ''} | assignedTo:[${assigned}] | createdBy:${t.createdBy}`
	})

	const annLimit = useCompact || isAllTime ? MAX_ANNOUNCEMENTS_ALL : MAX_ANNOUNCEMENTS
	const allAnnouncements = await Announcement.find({
		teamId,
		createdAt: { $gte: start, $lte: end },
	})
		.sort({ createdAt: -1 })
		.limit(annLimit * 2)
		.lean()

	const userDepts = Array.isArray(requestingUser.department)
		? requestingUser.department
		: requestingUser.department
			? [requestingUser.department]
			: []

	const announcements = allAnnouncements.filter(a =>
		announcementVisibleToUser(a, requesterId, userDepts)
	).slice(0, annLimit)

	const annLines = announcements.map(a =>
		`- ${formatDate(a.createdAt)} | ${(a.title || '').slice(0, 160)} | scope:${a.targetScope}`
	)

	const occupancyLines =
		scope === 'self'
			? Object.entries(teamLeaveDayMap)
				.sort(([a], [b]) => a.localeCompare(b))
				.map(([day, c]) => `${day}: acceptedOrSent=${c.acceptedOrSent}, pending=${c.pending}, rejected=${c.rejected} (headcount on leave that day, anonymized)`)
			: []

	const meta = {
		locale,
		scope,
		periodFrom: formatDate(start),
		periodTo: formatDate(end),
		rangeClampedToMaxDays: !!clamped,
		allTime: !!isAllTime,
		dataMode: useCompact ? 'compact' : 'detailed',
		workdaysTruncated,
		generatedAt: new Date().toISOString(),
		yearMessageOverride: yearMessageOverride || null,
	}

	const parts = []
	parts.push('=== PLANOPIA DATA CONTEXT (authorized for this user only) ===')
	parts.push(`Meta: ${JSON.stringify(meta)}`)
	parts.push('')
	parts.push('--- VERIFIED STATS (authoritative numbers; read before other JSON) ---')
	parts.push(JSON.stringify(verifiedStats))
	parts.push('')
	parts.push(staticSnapshot)
	parts.push('')
	parts.push('--- Users in scope (detailed) ---')
	parts.push(userLines.length ? userLines.join('\n') : '(none)')
	parts.push('')
	parts.push('--- Workdays & timer sessions ---')
	parts.push(workdayJson.slice(0, 120000))
	parts.push('')
	parts.push('--- Leave requests (in period) ---')
	parts.push((leaveLines.length ? leaveLines.join('\n') : '(none)') + leaveExtra)
	parts.push('')
	if (scope === 'self') {
		parts.push('--- Team leave occupancy by day (anonymized) ---')
		parts.push(
			occupancyLines.length
				? occupancyLines.join('\n')
				: '(no overlapping leaves in range)'
		)
		parts.push('')
	}
	parts.push('--- Tasks (boards / kanban, in period) ---')
	parts.push(taskLines.length ? taskLines.join('\n') : '(none)')
	parts.push('')
	parts.push('--- Announcements visible to this user (titles) ---')
	parts.push(annLines.length ? annLines.join('\n') : '(none)')
	parts.push('=== END CONTEXT ===')

	return {
		contextText: parts.join('\n'),
		meta,
	}
}
