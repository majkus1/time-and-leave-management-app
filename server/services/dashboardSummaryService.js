const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)
const Schedule = require('../models/Schedule')(firmDb)
const Announcement = require('../models/Announcement')(firmDb)
const Channel = require('../models/Channel')(firmDb)
const Message = require('../models/Message')(firmDb)
const UserNotification = require('../models/UserNotification')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const entitlementsService = require('./entitlementsService')
const { isHoliday, getHolidaysInRange } = require('../utils/holidays')
const { canSupervisorApproveLeaves, canSupervisorViewTimesheets } = require('./roleService')
const {
	buildDashboardModules,
	loadPendingLeaveRequests,
} = require('./dashboardSummaryHelpers')

function startOfDay(date) {
	const d = new Date(date)
	d.setHours(0, 0, 0, 0)
	return d
}

function endOfDay(date) {
	const d = new Date(date)
	d.setHours(23, 59, 59, 999)
	return d
}

function startOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}

function addDays(date, days) {
	const d = new Date(date)
	d.setDate(d.getDate() + days)
	return d
}

function toIsoDate(date) {
	if (!date) return null
	const d = new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function resolveTodayContext(date, settings) {
	const workOnWeekends = settings?.workOnWeekends !== false
	const dayOfWeek = date.getDay()
	const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6

	if (!workOnWeekends && isWeekendDay) {
		return {
			isWorkingDay: false,
			kind: 'weekend',
			holidayName: null,
		}
	}

	const holiday = isHoliday(date, settings)
	if (holiday) {
		return {
			isWorkingDay: false,
			kind: 'holiday',
			holidayName: holiday.name || null,
		}
	}

	return {
		isWorkingDay: true,
		kind: 'weekday',
		holidayName: null,
	}
}

function sameId(a, b) {
	return String(a || '') === String(b || '')
}

function personName(user) {
	const full = `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
	return full || user?.username || ''
}

function activeUserQuery(teamId) {
	return {
		teamId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}
}

async function resolveViewerAndTeam(userId) {
	const viewer = await User.findOne({
		_id: userId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}).lean()
	if (!viewer?.teamId) {
		const err = new Error('User not found')
		err.status = 404
		throw err
	}

	const team = await Team.findOne({
		_id: viewer.teamId,
		$or: [{ isActive: { $ne: false } }, { isActive: { $exists: false } }],
	}).lean()
	if (!team) {
		const err = new Error('Team not found')
		err.status = 404
		throw err
	}

	return { viewer, team }
}

async function resolveRoleScope(viewer, teamUsers) {
	const roles = Array.isArray(viewer.roles) ? viewer.roles : []
	const isAdmin = roles.includes('Admin')
	const isHR = roles.includes('HR')
	const isSupervisor = roles.includes('Przełożony (Supervisor)')
	const viewerId = String(viewer._id)

	const timesheetUsers = []
	const leaveApprovalUsers = []

	for (const user of teamUsers) {
		if (isAdmin || isHR || sameId(user._id, viewerId)) {
			timesheetUsers.push(user)
		} else if (isSupervisor && await canSupervisorViewTimesheets(viewer, user)) {
			timesheetUsers.push(user)
		}

		if (isAdmin || isHR) {
			leaveApprovalUsers.push(user)
		} else if (isSupervisor && await canSupervisorApproveLeaves(viewer, user)) {
			leaveApprovalUsers.push(user)
		}
	}

	const roleView = isAdmin ? 'admin' : isHR ? 'hr' : isSupervisor ? 'supervisor' : 'worker'

	return {
		roleView,
		isAdmin,
		isHR,
		isSupervisor,
		canApproveLeaves: isAdmin || isHR || leaveApprovalUsers.length > 0,
		canViewTimesheets: isAdmin || isHR || (isSupervisor && timesheetUsers.some(u => !sameId(u._id, viewerId))),
		timesheetUsers,
		leaveApprovalUsers,
	}
}

function summarizeWorkdays(workdays) {
	return workdays.reduce(
		(acc, day) => {
			const hours = Number(day.hoursWorked || 0)
			const overtime = Number(day.additionalWorked || 0)
			acc.hours += hours
			acc.overtime += overtime
			if (hours > 0 || overtime > 0 || day.absenceType) acc.recordedDays += 1
			if (day.reviewStatus === 'approved') acc.approvedDays += 1
			if (day.reviewStatus === 'rejected') acc.rejectedDays += 1
			if (day.activeTimer?.startTime) acc.activeTimers += 1
			return acc
		},
		{ hours: 0, overtime: 0, recordedDays: 0, approvedDays: 0, rejectedDays: 0, activeTimers: 0 }
	)
}

async function buildWorkSummary({ viewer, scope, todayStart, todayEnd, monthStart, monthEnd, todayContext }) {
	const timesheetUserIds = scope.timesheetUsers.map(u => u._id)
	const ownWorkdays = await Workday.find({
		userId: viewer._id,
		date: { $gte: monthStart, $lte: monthEnd },
	}).lean()
	const myToday = ownWorkdays.find(day => {
		const d = new Date(day.date)
		return d >= todayStart && d <= todayEnd
	})

	let teamWorkdays = []
	if (timesheetUserIds.length > 0) {
		teamWorkdays = await Workday.find({
			userId: { $in: timesheetUserIds },
			date: { $gte: monthStart, $lte: monthEnd },
		}).lean()
	}

	const todayEntriesByUser = new Set(
		teamWorkdays
			.filter(day => {
				const d = new Date(day.date)
				return d >= todayStart && d <= todayEnd && (day.hoursWorked > 0 || day.additionalWorked > 0 || day.absenceType || day.activeTimer?.startTime)
			})
			.map(day => String(day.userId))
	)

	return {
		myToday: myToday
			? {
				id: myToday._id,
				hours: Number(myToday.hoursWorked || 0),
				overtime: Number(myToday.additionalWorked || 0),
				absenceType: myToday.absenceType || null,
				notes: myToday.notes || '',
				reviewStatus: myToday.reviewStatus || null,
				activeTimer: myToday.activeTimer?.startTime
					? {
						startTime: myToday.activeTimer.startTime,
						isBreak: myToday.activeTimer.isBreak === true,
						isOvertime: myToday.activeTimer.isOvertime === true,
						workDescription: myToday.activeTimer.workDescription || '',
					}
					: null,
			}
			: null,
		myMonth: summarizeWorkdays(ownWorkdays),
		teamMonth: {
			...summarizeWorkdays(teamWorkdays),
			scopeUserCount: scope.timesheetUsers.length,
			todayMissingCount: todayContext?.isWorkingDay === false
				? 0
				: Math.max(scope.timesheetUsers.length - todayEntriesByUser.size, 0),
		},
	}
}

async function buildLeaveSummary({ viewer, scope, teamUsers, todayStart, todayEnd }) {
	const approvableIds = scope.leaveApprovalUsers.map(u => u._id)
	const teamMemberIds = teamUsers.map(u => u._id)
	const selfId = viewer._id
	const nextHorizon = addDays(todayEnd, 45)

	const todayAbsences = await LeaveRequest.find({
		userId: { $in: teamMemberIds },
		status: { $in: ['status.accepted', 'status.sent'] },
		startDate: { $lte: todayEnd },
		endDate: { $gte: todayStart },
	})
		.populate('userId', 'firstName lastName username department')
		.sort({ startDate: 1 })
		.lean()

	const pendingQueryIds = approvableIds.length > 0 ? approvableIds : [selfId]
	const pendingQuery = {
		userId: { $in: pendingQueryIds },
		status: 'status.pending',
	}
	const { pendingCount, pending } = await loadPendingLeaveRequests(
		LeaveRequest,
		pendingQuery
	)

	const upcoming = await LeaveRequest.find({
		userId: { $in: teamMemberIds },
		status: { $in: ['status.accepted', 'status.sent'] },
		startDate: { $gte: todayStart, $lte: nextHorizon },
	})
		.populate('userId', 'firstName lastName username department')
		.sort({ startDate: 1 })
		.limit(8)
		.lean()

	const ownLeave = await LeaveRequest.findOne({
		userId: selfId,
		status: { $in: ['status.accepted', 'status.sent'] },
		endDate: { $gte: todayStart },
	})
		.sort({ startDate: 1 })
		.lean()

	return {
		pendingCount,
		pendingPreview: pending.map(req => ({
			id: req._id,
			userName: personName(req.userId),
			type: req.type,
			startDate: toIsoDate(req.startDate),
			endDate: toIsoDate(req.endDate),
			daysRequested: req.daysRequested,
		})),
		todayAbsentCount: todayAbsences.length,
		todayAbsentPreview: todayAbsences.slice(0, 6).map(req => ({
			id: req._id,
			userName: personName(req.userId),
			type: req.type,
			startDate: toIsoDate(req.startDate),
			endDate: toIsoDate(req.endDate),
		})),
		upcoming: upcoming.slice(0, 6).map(req => ({
			id: req._id,
			userName: personName(req.userId),
			type: req.type,
			startDate: toIsoDate(req.startDate),
			endDate: toIsoDate(req.endDate),
		})),
		ownNextLeave: ownLeave
			? {
				id: ownLeave._id,
				type: ownLeave.type,
				startDate: toIsoDate(ownLeave.startDate),
				endDate: toIsoDate(ownLeave.endDate),
			}
			: null,
	}
}

function accessibleBoardQuery(viewer) {
	const roles = Array.isArray(viewer.roles) ? viewer.roles : []
	const userDepartments = Array.isArray(viewer.department)
		? viewer.department
		: viewer.department
			? [viewer.department]
			: []
	const query = {
		teamId: viewer.teamId,
		isActive: true,
	}

	if (roles.includes('Admin')) return query

	const orConditions = [
		{ members: viewer._id },
		{ isTeamBoard: true },
	]
	if (userDepartments.length > 0) {
		orConditions.push({ type: 'department', departmentName: { $in: userDepartments } })
	}
	query.$or = orConditions
	return query
}

async function buildTaskSummary({ viewer, enabled }) {
	if (!enabled) {
		return { enabled: false, totalOpenCount: 0, urgentOpenCount: 0, dueSoon: [] }
	}

	const boards = await Board.find(accessibleBoardQuery(viewer)).select('_id name').lean()
	const boardIds = boards.map(board => board._id)
	if (boardIds.length === 0) {
		return { enabled: true, totalOpenCount: 0, urgentOpenCount: 0, dueSoon: [] }
	}

	const boardNameById = Object.fromEntries(boards.map(board => [String(board._id), board.name || '']))
	const roles = Array.isArray(viewer.roles) ? viewer.roles : []
	const isAdmin = roles.includes('Admin')
	const visibility = isAdmin
		? {}
		: { $or: [{ assignedScope: 'all-members' }, { assignedTo: viewer._id }] }
	const dueSoonEnd = addDays(new Date(), 14)
	const openQuery = {
		boardId: { $in: boardIds },
		isActive: true,
		status: { $ne: 'done' },
		...visibility,
	}
	const dueDateFilter = {
		$or: [
			{ dueDate: { $lte: dueSoonEnd } },
			{ workPeriodEnd: { $lte: dueSoonEnd } },
		],
	}
	const dueSoonQuery = { ...openQuery }
	if (dueSoonQuery.$or) {
		const visibilityOr = dueSoonQuery.$or
		delete dueSoonQuery.$or
		dueSoonQuery.$and = [{ $or: visibilityOr }, dueDateFilter]
	} else {
		dueSoonQuery.$and = [dueDateFilter]
	}
	const [totalOpenCount, urgentOpenCount, dueSoon] = await Promise.all([
		Task.countDocuments(openQuery),
		Task.countDocuments({ ...openQuery, priority: { $in: ['high', 'urgent'] } }),
		Task.find(dueSoonQuery)
			.select('title boardId status priority dueDate workPeriodStart workPeriodEnd calendarOnly')
			.sort({ dueDate: 1, workPeriodEnd: 1, priority: -1 })
			.limit(6)
			.lean(),
	])

	return {
		enabled: true,
		totalOpenCount,
		urgentOpenCount,
		dueSoon: dueSoon.map(task => ({
			id: task._id,
			title: task.title,
			boardId: task.boardId,
			boardName: boardNameById[String(task.boardId)] || '',
			status: task.status,
			priority: task.priority,
			dueDate: toIsoDate(task.dueDate),
			workPeriodStart: toIsoDate(task.workPeriodStart),
			workPeriodEnd: toIsoDate(task.workPeriodEnd),
			calendarOnly: task.calendarOnly === true,
		})),
	}
}

async function buildScheduleSummary({ viewer, scope, enabled, todayStart, todayEnd }) {
	if (!enabled) {
		return { enabled: false, todayEntriesCount: 0, draftEntriesCount: 0, todayEntries: [] }
	}

	const roles = Array.isArray(viewer.roles) ? viewer.roles : []
	const broadScope = roles.includes('Admin') || roles.includes('HR') || scope.isSupervisor
	const visibleIds = broadScope ? scope.timesheetUsers.map(u => String(u._id)) : [String(viewer._id)]
	const schedules = await Schedule.find({ teamId: viewer.teamId, isActive: true })
		.select('name days')
		.lean()

	const todayEntries = []
	let draftEntriesCount = 0
	for (const schedule of schedules) {
		for (const day of schedule.days || []) {
			const d = new Date(day.date)
			if (d < todayStart || d > todayEnd) continue
			for (const entry of day.entries || []) {
				if (!visibleIds.includes(String(entry.employeeId))) continue
				if (entry.isPublished === false) draftEntriesCount += 1
				todayEntries.push({
					id: entry._id,
					scheduleId: schedule._id,
					scheduleName: schedule.name,
					employeeName: entry.employeeName,
					timeFrom: entry.timeFrom,
					timeTo: entry.timeTo,
					isPublished: entry.isPublished !== false,
					autoGenerated: entry.autoGenerated === true,
				})
			}
		}
	}

	todayEntries.sort((a, b) => String(a.timeFrom || '').localeCompare(String(b.timeFrom || '')))

	return {
		enabled: true,
		todayEntriesCount: todayEntries.length,
		draftEntriesCount,
		todayEntries: todayEntries.slice(0, 6),
	}
}

async function buildCommunicationSummary({ viewer, modules }) {
	const notificationsUnread = await UserNotification.countDocuments({
		userId: viewer._id,
		teamId: viewer.teamId,
		readAt: null,
	})

	let announcementsUnread = 0
	let latestAnnouncements = []
	if (modules.announcements) {
		const departments = Array.isArray(viewer.department) ? viewer.department : []
		const announcementQuery = {
			teamId: viewer.teamId,
			$or: [
				{ targetScope: 'all' },
				{ targetScope: 'users', targetUsers: viewer._id },
			],
		}
		if (departments.length > 0) {
			announcementQuery.$or.push({ targetScope: 'department', targetDepartment: { $in: departments } })
		}
		if (viewer.announcementsLastSeenAt) {
			announcementsUnread = await Announcement.countDocuments({
				...announcementQuery,
				createdAt: { $gt: viewer.announcementsLastSeenAt },
			})
		} else {
			announcementsUnread = await Announcement.countDocuments(announcementQuery)
		}
		latestAnnouncements = await Announcement.find(announcementQuery)
			.select('title createdAt')
			.sort({ createdAt: -1 })
			.limit(3)
			.lean()
	}

	let chatUnread = 0
	if (modules.chat) {
		const departments = Array.isArray(viewer.department) ? viewer.department : []
		const channelQuery = {
			teamId: viewer.teamId,
			isActive: true,
			$or: [
				{ members: viewer._id },
				{ isTeamChannel: true },
				{ type: 'general' },
			],
		}
		if (departments.length > 0) {
			channelQuery.$or.push({ type: 'department', departmentName: { $in: departments } })
		}
		const channels = await Channel.find(channelQuery).select('_id').lean()
		const channelIds = channels.map(channel => channel._id)
		if (channelIds.length > 0) {
			chatUnread = await Message.countDocuments({
				channelId: { $in: channelIds },
				userId: { $ne: viewer._id },
				isDeleted: { $ne: true },
				readBy: { $not: { $elemMatch: { userId: new mongoose.Types.ObjectId(String(viewer._id)) } } },
			})
		}
	}

	return {
		notificationsUnread,
		announcementsUnread,
		chatUnread,
		latestAnnouncements: latestAnnouncements.map(item => ({
			id: item._id,
			title: item.title,
			createdAt: item.createdAt,
		})),
	}
}

function buildQuickActions({ scope, modules, entitlements }) {
	const actions = [
		{ id: 'work-time', label: 'Uzupełnij czas pracy', labelEn: 'Fill work time', path: '/work-time', priority: 'primary' },
	]

	if (scope.canApproveLeaves && !entitlements.freemiumTier) {
		actions.push({ id: 'leave-list', label: 'Sprawdź wnioski', labelEn: 'Review leave requests', path: '/leave-list' })
	}
	if (!entitlements.freemiumTier && !entitlements.freemiumSeatBlocked) {
		actions.push({ id: 'leave-request', label: 'Zgłoś urlop', labelEn: 'Request leave', path: '/leave-request' })
	}
	if (modules.tasks) actions.push({ id: 'boards', label: 'Przejdź do zadań', labelEn: 'Open tasks', path: '/boards' })
	if (modules.schedules) actions.push({ id: 'schedule', label: 'Otwórz grafiki', labelEn: 'Open schedules', path: '/schedule' })
	if (modules.ai) actions.push({ id: 'ai', label: 'Zapytaj Planio', labelEn: 'Ask Planio', path: '/ai-assistant' })
	if (entitlements.freemiumTier || entitlements.freemiumSeatBlocked) {
		const billingPath = scope.isAdmin || scope.isHR ? '/packages' : '/team-access-notice?reason=seats'
		actions.push({ id: 'packages', label: 'Pakiety i rozliczenia', labelEn: 'Packages & billing', path: billingPath })
	}

	return actions
}

function canAccessTeamInsights(scope) {
	if (scope.isAdmin || scope.isHR) return true
	if (scope.isSupervisor && (scope.canViewTimesheets || scope.canApproveLeaves)) return true
	return false
}

function getScopedEmployees(scope) {
	const map = new Map()
	for (const user of scope.timesheetUsers) {
		map.set(String(user._id), user)
	}
	for (const user of scope.leaveApprovalUsers) {
		if (!map.has(String(user._id))) map.set(String(user._id), user)
	}
	return Array.from(map.values()).sort((a, b) => personName(a).localeCompare(personName(b), 'pl'))
}

const UNASSIGNED_DEPARTMENT_KEY = '__unassigned__'

function normalizeUserDepartments(user) {
	if (Array.isArray(user?.department)) return user.department.filter(Boolean)
	if (user?.department) return [user.department]
	return []
}

function userBelongsToDepartment(user, departmentKey) {
	if (!departmentKey) return true
	if (departmentKey === UNASSIGNED_DEPARTMENT_KEY) return normalizeUserDepartments(user).length === 0
	return normalizeUserDepartments(user).includes(departmentKey)
}

function buildScopedDepartments(scopedEmployees) {
	const counts = new Map()
	for (const user of scopedEmployees) {
		const departments = normalizeUserDepartments(user)
		if (departments.length === 0) {
			counts.set(UNASSIGNED_DEPARTMENT_KEY, (counts.get(UNASSIGNED_DEPARTMENT_KEY) || 0) + 1)
			continue
		}
		for (const department of departments) {
			counts.set(department, (counts.get(department) || 0) + 1)
		}
	}

	return Array.from(counts.entries())
		.map(([key, employeeCount]) => ({
			key,
			name: key === UNASSIGNED_DEPARTMENT_KEY ? null : key,
			employeeCount,
		}))
		.sort((a, b) => {
			if (a.key === UNASSIGNED_DEPARTMENT_KEY) return 1
			if (b.key === UNASSIGNED_DEPARTMENT_KEY) return -1
			return String(a.name).localeCompare(String(b.name), 'pl')
		})
}

function resolveScopedDepartmentFilter(scopedEmployees, departments, departmentKey) {
	if (!departmentKey) return scopedEmployees
	const allowed = departments.some(department => department.key === departmentKey)
	if (!allowed) {
		const err = new Error('Department not in scope')
		err.status = 403
		throw err
	}
	return scopedEmployees.filter(user => userBelongsToDepartment(user, departmentKey))
}

function parseIsoDateInput(value) {
	if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return null
	const [year, month, day] = String(value).split('-').map(Number)
	const date = new Date(year, month - 1, day)
	if (Number.isNaN(date.getTime())) return null
	return date
}

function startOfQuarter(date) {
	const quarter = Math.floor(date.getMonth() / 3)
	return new Date(date.getFullYear(), quarter * 3, 1, 0, 0, 0, 0)
}

function endOfQuarter(date) {
	const quarter = Math.floor(date.getMonth() / 3)
	return new Date(date.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999)
}

function startOfYear(date) {
	return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0)
}

function endOfYear(date) {
	return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999)
}

function resolvePeriodRange(periodKey, now = new Date(), options = {}) {
	const today = startOfDay(now)

	if (periodKey === 'custom') {
		const start = parseIsoDateInput(options.startDate)
		const end = parseIsoDateInput(options.endDate)
		if (!start || !end || startOfDay(start) > startOfDay(end)) {
			const err = new Error('Invalid custom date range')
			err.status = 400
			throw err
		}
		const dayCount = Math.round((startOfDay(end) - startOfDay(start)) / 86400000) + 1
		if (dayCount > 366) {
			const err = new Error('Date range too long')
			err.status = 400
			throw err
		}
		return {
			key: 'custom',
			start: startOfDay(start),
			end: endOfDay(end),
			startDate: toIsoDate(start),
			endDate: toIsoDate(end),
		}
	}

	if (periodKey === 'prev_month') {
		const anchor = new Date(now.getFullYear(), now.getMonth() - 1, 1)
		return {
			key: 'prev_month',
			start: startOfMonth(anchor),
			end: endOfMonth(anchor),
			startDate: toIsoDate(startOfMonth(anchor)),
			endDate: toIsoDate(endOfMonth(anchor)),
		}
	}
	if (periodKey === 'last_7_days') {
		const start = startOfDay(addDays(today, -6))
		return {
			key: 'last_7_days',
			start,
			end: endOfDay(now),
			startDate: toIsoDate(start),
			endDate: toIsoDate(now),
		}
	}
	if (periodKey === 'last_30_days') {
		const start = startOfDay(addDays(today, -29))
		return {
			key: 'last_30_days',
			start,
			end: endOfDay(now),
			startDate: toIsoDate(start),
			endDate: toIsoDate(now),
		}
	}
	if (periodKey === 'last_90_days') {
		const start = startOfDay(addDays(today, -89))
		return {
			key: 'last_90_days',
			start,
			end: endOfDay(now),
			startDate: toIsoDate(start),
			endDate: toIsoDate(now),
		}
	}
	if (periodKey === 'this_quarter') {
		return {
			key: 'this_quarter',
			start: startOfQuarter(now),
			end: endOfQuarter(now),
			startDate: toIsoDate(startOfQuarter(now)),
			endDate: toIsoDate(endOfQuarter(now)),
		}
	}
	if (periodKey === 'this_year') {
		return {
			key: 'this_year',
			start: startOfYear(now),
			end: endOfYear(now),
			startDate: toIsoDate(startOfYear(now)),
			endDate: toIsoDate(endOfYear(now)),
		}
	}
	if (periodKey === 'prev_year') {
		const anchor = new Date(now.getFullYear() - 1, 0, 1)
		return {
			key: 'prev_year',
			start: startOfYear(anchor),
			end: endOfYear(anchor),
			startDate: toIsoDate(startOfYear(anchor)),
			endDate: toIsoDate(endOfYear(anchor)),
		}
	}
	return {
		key: 'month',
		start: startOfMonth(now),
		end: endOfMonth(now),
		startDate: toIsoDate(startOfMonth(now)),
		endDate: toIsoDate(endOfMonth(now)),
	}
}

async function buildTaskInsights({ viewer, enabled, range, assigneeId = null }) {
	if (!enabled) {
		return { enabled: false, openCount: 0, urgentCount: 0, overdueCount: 0, completedCount: 0 }
	}

	const boards = await Board.find(accessibleBoardQuery(viewer)).select('_id').lean()
	const boardIds = boards.map(board => board._id)
	if (boardIds.length === 0) {
		return { enabled: true, openCount: 0, urgentCount: 0, overdueCount: 0, completedCount: 0 }
	}

	const roles = Array.isArray(viewer.roles) ? viewer.roles : []
	const isAdmin = roles.includes('Admin')
	const visibility = isAdmin
		? {}
		: { $or: [{ assignedScope: 'all-members' }, { assignedTo: viewer._id }] }
	const assigneeFilter = assigneeId ? { assignedTo: assigneeId } : {}
	const openQuery = {
		boardId: { $in: boardIds },
		isActive: true,
		status: { $ne: 'done' },
		...visibility,
		...assigneeFilter,
	}
	const overdueCutoff = startOfDay(new Date())
	const [openCount, urgentCount, overdueCount, completedCount] = await Promise.all([
		Task.countDocuments(openQuery),
		Task.countDocuments({ ...openQuery, priority: { $in: ['high', 'urgent'] } }),
		Task.countDocuments({
			...openQuery,
			$or: [
				{ dueDate: { $lt: overdueCutoff, $ne: null } },
				{ workPeriodEnd: { $lt: overdueCutoff, $ne: null } },
			],
		}),
		Task.countDocuments({
			boardId: { $in: boardIds },
			isActive: true,
			status: 'done',
			updatedAt: { $gte: range.start, $lte: range.end },
			...assigneeFilter,
		}),
	])

	return {
		enabled: true,
		openCount,
		urgentCount,
		overdueCount,
		completedCount,
	}
}

async function buildTeamInsights(userId, options = {}) {
	const allowedPeriods = new Set(['month', 'prev_month', 'custom'])
	const periodKey = allowedPeriods.has(options.period) ? options.period : 'month'
	const filterUserId = options.userId || null
	const filterDepartment = options.department ? String(options.department) : null

	const { viewer, team } = await resolveViewerAndTeam(userId)
	const teamUsers = await User.find(activeUserQuery(viewer.teamId))
		.select('_id username firstName lastName roles department managedOnly appAccessEnabled')
		.lean()
	const scope = await resolveRoleScope(viewer, teamUsers)

	if (!canAccessTeamInsights(scope)) {
		return { enabled: false }
	}

	const scopedEmployees = getScopedEmployees(scope)
	const departments = buildScopedDepartments(scopedEmployees)
	let targetUsers = filterUserId
		? scopedEmployees
		: resolveScopedDepartmentFilter(scopedEmployees, departments, filterDepartment)

	if (filterUserId) {
		const match = scopedEmployees.find(user => sameId(user._id, filterUserId))
		if (!match) {
			const err = new Error('Employee not in scope')
			err.status = 403
			throw err
		}
		if (filterDepartment && !userBelongsToDepartment(match, filterDepartment)) {
			const err = new Error('Employee not in selected department')
			err.status = 403
			throw err
		}
		targetUsers = [match]
	}

	const activeSeatCount = await User.countDocuments(activeUserQuery(viewer.teamId))
	const entitlements = entitlementsService.buildClientEntitlements(team, { activeSeatCount })
	const modules = buildDashboardModules(entitlements, true)

	const range = resolvePeriodRange(periodKey, new Date(), {
		startDate: options.startDate,
		endDate: options.endDate,
	})
	const workTargetUsers = targetUsers.filter(user =>
		scope.timesheetUsers.some(scopeUser => sameId(scopeUser._id, user._id))
	)
	const workTargetIds = workTargetUsers.map(user => user._id)
	const workNameById = Object.fromEntries(workTargetUsers.map(user => [String(user._id), personName(user)]))

	const workdays = workTargetIds.length
		? await Workday.find({
			userId: { $in: workTargetIds },
			date: { $gte: range.start, $lte: range.end },
		}).lean()
		: []

	const workTotals = summarizeWorkdays(workdays)
	const hoursByUser = new Map()
	for (const day of workdays) {
		const uid = String(day.userId)
		const prev = hoursByUser.get(uid) || { hours: 0, overtime: 0, days: 0 }
		const hours = Number(day.hoursWorked || 0)
		const overtime = Number(day.additionalWorked || 0)
		hoursByUser.set(uid, {
			hours: prev.hours + hours,
			overtime: prev.overtime + overtime,
			days: prev.days + (hours > 0 || overtime > 0 || day.absenceType ? 1 : 0),
		})
	}

	const topByHours = Array.from(hoursByUser.entries())
		.map(([id, stats]) => ({
			userId: id,
			userName: workNameById[id] || id,
			hours: Math.round(stats.hours * 100) / 100,
			overtime: Math.round(stats.overtime * 100) / 100,
			recordedDays: stats.days,
		}))
		.sort((a, b) => b.hours - a.hours)
		.slice(0, 5)

	const maxLeaderHours = topByHours[0]?.hours || 0
	const targetIds = targetUsers.map(user => user._id)

	let leave = { enabled: false }
	if (modules.leaves) {
		const approvableInScope = scope.leaveApprovalUsers.filter(user =>
			targetUsers.some(targetUser => sameId(targetUser._id, user._id))
		)
		const approvableIds = filterUserId
			? targetIds
			: approvableInScope.map(user => user._id)
		const pendingCount = approvableIds.length && scope.canApproveLeaves
			? await LeaveRequest.countDocuments({
				userId: { $in: approvableIds },
				status: 'status.pending',
			})
			: 0

		const approvedInPeriod = targetIds.length
			? await LeaveRequest.find({
				userId: { $in: targetIds },
				status: { $in: ['status.accepted', 'status.sent'] },
				startDate: { $lte: range.end },
				endDate: { $gte: range.start },
			}).lean()
			: []

		const totalLeaveDays = approvedInPeriod.reduce(
			(sum, request) => sum + Number(request.daysRequested || 0),
			0
		)
		const upcomingCount = targetIds.length
			? await LeaveRequest.countDocuments({
				userId: { $in: targetIds },
				status: { $in: ['status.accepted', 'status.sent'] },
				startDate: { $gte: startOfDay(new Date()), $lte: addDays(endOfDay(new Date()), 45) },
			})
			: 0

		leave = {
			enabled: true,
			pendingCount,
			approvedRequestsCount: approvedInPeriod.length,
			totalLeaveDays: Math.round(totalLeaveDays * 10) / 10,
			upcomingCount,
			canApprove: scope.canApproveLeaves,
		}
	}

	const tasks = await buildTaskInsights({
		viewer,
		enabled: modules.tasks,
		range,
		assigneeId: filterUserId || null,
	})

	return {
		enabled: true,
		period: range,
		scope: {
			employeeCount: targetUsers.length,
			totalScopedEmployees: scopedEmployees.length,
			filterUserId: filterUserId ? String(filterUserId) : null,
			filterDepartment: filterDepartment || null,
		},
		departments,
		employees: scopedEmployees.map(user => ({
			id: user._id,
			name: personName(user),
			departments: normalizeUserDepartments(user),
		})),
		work: {
			enabled: scope.canViewTimesheets && workTargetUsers.length > 0,
			totalHours: Math.round(workTotals.hours * 100) / 100,
			totalOvertime: Math.round(workTotals.overtime * 100) / 100,
			recordedDays: workTotals.recordedDays,
			activeTimers: workTotals.activeTimers,
			rejectedDays: workTotals.rejectedDays,
			avgHoursPerEmployee: workTargetUsers.length
				? Math.round((workTotals.hours / workTargetUsers.length) * 100) / 100
				: 0,
			topByHours,
			maxLeaderHours,
		},
		leave,
		tasks,
	}
}

function normalizeLeaveRequestStatus(status) {
	const normalized = String(status || '').replace('status.', '')
	return ['accepted', 'pending', 'rejected', 'sent'].includes(normalized) ? normalized : null
}

function countLeaveRequestDaysInYear(request, year, settings) {
	const yearStart = new Date(year, 0, 1, 0, 0, 0, 0)
	const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)
	const requestStart = new Date(request.startDate)
	const requestEnd = new Date(request.endDate)
	if (Number.isNaN(requestStart.getTime()) || Number.isNaN(requestEnd.getTime())) return 0

	const start = new Date(Math.max(requestStart.getTime(), yearStart.getTime()))
	const end = new Date(Math.min(requestEnd.getTime(), yearEnd.getTime()))
	if (start > end) return 0

	let days = 0
	const current = startOfDay(start)
	const lastDay = startOfDay(end)
	const workOnWeekends = settings?.workOnWeekends !== false

	while (current <= lastDay) {
		const dayOfWeek = current.getDay()
		const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6
		const holiday = isHoliday(current, settings)
		if ((workOnWeekends || !isWeekendDay) && !holiday) days += 1
		current.setDate(current.getDate() + 1)
	}

	return days
}

function resolveViewerLeaveTypeDays(viewerDoc) {
	const leaveTypeDays = { ...(viewerDoc?.leaveTypeDays || {}) }
	if (
		(leaveTypeDays['leaveform.option1'] === undefined || leaveTypeDays['leaveform.option1'] === null) &&
		viewerDoc?.vacationDays !== undefined &&
		viewerDoc?.vacationDays !== null
	) {
		leaveTypeDays['leaveform.option1'] = viewerDoc.vacationDays
	}
	return leaveTypeDays
}

function buildPersonalLeaveLimits({ viewerDoc, ownRequests, settings, year }) {
	const leaveTypes = Array.isArray(settings?.leaveRequestTypes) ? settings.leaveRequestTypes : []
	const leaveTypeDays = resolveViewerLeaveTypeDays(viewerDoc)

	return leaveTypes
		.filter(type => {
			if (type?.isEnabled === false) return false
			const assigned = leaveTypeDays[type.id]
			if (assigned === undefined || assigned === null) return false
			// Typ z limitem albo przypisana pula dni (np. urlop wypoczynkowy).
			return type.allowDaysLimit === true || Number(assigned) > 0
		})
		.map(type => {
			const limit = Number(leaveTypeDays[type.id]) || 0
			let used = 0
			let pending = 0

			for (const request of ownRequests) {
				if (request.type !== type.id) continue
				const status = normalizeLeaveRequestStatus(request.status)
				const days = countLeaveRequestDaysInYear(request, year, settings)
				if (status === 'accepted' || status === 'sent') used += days
				if (status === 'pending') pending += days
			}

			const remaining = Math.round((limit - used) * 10) / 10
			return {
				typeId: type.id,
				typeName: type.name,
				typeNameEn: type.nameEn || type.name,
				limit,
				used: Math.round(used * 10) / 10,
				pending: Math.round(pending * 10) / 10,
				remaining,
				usagePercent: limit > 0 ? Math.min(100, Math.max(0, Math.round((used / limit) * 1000) / 10)) : 0,
				isAtRisk: limit > 0 && used <= limit && used + pending > limit,
			}
		})
		.sort((a, b) => b.limit - a.limit)
}

function buildNextHoliday(settings, fromDate = new Date()) {
	const holidaysEnabled =
		settings?.includePolishHolidays !== false ||
		(settings?.includeCustomHolidays !== false &&
			Array.isArray(settings?.customHolidays) &&
			settings.customHolidays.length > 0)

	if (!holidaysEnabled) {
		return { enabled: false, next: null }
	}

	const holidaySettings = {
		...settings,
		includePolishHolidays: settings?.includePolishHolidays !== false,
		includeCustomHolidays: settings?.includeCustomHolidays !== false,
		customHolidays: settings?.customHolidays || [],
	}

	const todayStr = toIsoDate(startOfDay(fromDate))
	const endStr = toIsoDate(addDays(fromDate, 420))
	const holidays = getHolidaysInRange(todayStr, endStr, holidaySettings)
	const next = holidays.find(holiday => holiday.date >= todayStr) || null

	if (!next) {
		return { enabled: true, next: null }
	}

	const nextDate = new Date(`${next.date}T00:00:00`)
	const daysUntil = Math.max(0, Math.round((startOfDay(nextDate) - startOfDay(fromDate)) / 86400000))

	return {
		enabled: true,
		next: {
			date: next.date,
			name: next.name,
			daysUntil,
			isToday: daysUntil === 0,
		},
	}
}

async function buildOwnNextLeave(userId, settings, todayStart) {
	const leave = await LeaveRequest.findOne({
		userId,
		status: { $in: ['status.accepted', 'status.sent'] },
		endDate: { $gte: todayStart },
	})
		.sort({ startDate: 1 })
		.lean()

	if (!leave) return null

	const leaveTypes = Array.isArray(settings?.leaveRequestTypes) ? settings.leaveRequestTypes : []
	const typeConfig = leaveTypes.find(type => type.id === leave.type)
	const start = startOfDay(leave.startDate)
	const today = startOfDay(todayStart)
	const isOngoing = start.getTime() <= today.getTime()
	const daysUntil = isOngoing
		? 0
		: Math.max(0, Math.round((start - today) / 86400000))
	const daysRemaining = isOngoing
		? Math.max(0, Math.round((startOfDay(leave.endDate) - today) / 86400000))
		: null

	return {
		id: leave._id,
		type: leave.type,
		typeName: typeConfig?.name || leave.type,
		typeNameEn: typeConfig?.nameEn || typeConfig?.name || leave.type,
		startDate: toIsoDate(leave.startDate),
		endDate: toIsoDate(leave.endDate),
		daysRequested: Number(leave.daysRequested || 0),
		isOngoing,
		daysUntil,
		daysRemaining,
	}
}

async function buildPersonalInsights({ viewer, teamSettings, settingsDoc, leavesEnabled }) {
	if (!leavesEnabled) {
		return { enabled: false, leaveLimits: [], nextLeave: null, holidays: { enabled: false, next: null } }
	}

	const fullSettings = {
		...teamSettings,
		leaveRequestTypes: settingsDoc?.leaveRequestTypes || [],
		leaveCalculationMode: settingsDoc?.leaveCalculationMode || 'days',
		leaveHoursPerDay: settingsDoc?.leaveHoursPerDay || 8,
	}

	const todayStart = startOfDay(new Date())
	const year = new Date().getFullYear()
	const [viewerDoc, ownRequests, nextLeave] = await Promise.all([
		User.findById(viewer._id).select('leaveTypeDays vacationDays').lean(),
		LeaveRequest.find({
			userId: viewer._id,
			startDate: { $lte: new Date(year, 11, 31, 23, 59, 59, 999) },
			endDate: { $gte: new Date(year, 0, 1, 0, 0, 0, 0) },
		}).lean(),
		buildOwnNextLeave(viewer._id, fullSettings, todayStart),
	])

	return {
		enabled: true,
		year,
		leaveLimits: buildPersonalLeaveLimits({
			viewerDoc,
			ownRequests,
			settings: fullSettings,
			year,
		}),
		nextLeave,
		holidays: buildNextHoliday(fullSettings),
	}
}

async function buildDashboardSummary(userId) {
	const { viewer, team } = await resolveViewerAndTeam(userId)
	const activeSeatCount = await User.countDocuments(activeUserQuery(viewer.teamId))
	const entitlements = entitlementsService.buildClientEntitlements(team, { activeSeatCount })
	const teamUsers = await User.find(activeUserQuery(viewer.teamId))
		.select('_id username firstName lastName roles department managedOnly appAccessEnabled')
		.lean()
	const scope = await resolveRoleScope(viewer, teamUsers)
	const settingsDoc = await Settings.findOne({ teamId: viewer.teamId })
		.select('timerEnabled workOnWeekends includePolishHolidays includeCustomHolidays customHolidays leaveRequestTypes leaveCalculationMode leaveHoursPerDay')
		.lean()
	const teamSettings = {
		workOnWeekends: settingsDoc ? settingsDoc.workOnWeekends !== false : true,
		includePolishHolidays: settingsDoc ? settingsDoc.includePolishHolidays !== false : true,
		includeCustomHolidays: settingsDoc ? settingsDoc.includeCustomHolidays !== false : true,
		customHolidays: settingsDoc?.customHolidays || [],
	}
	// Spójnie z TimerChrome / kalendarzami: licznik i QR aktywne, chyba że zespół wyłączył je jawnie.
	const timerEnabledSetting = settingsDoc ? settingsDoc.timerEnabled !== false : true
	const now = new Date()
	const todayStart = startOfDay(now)
	const todayEnd = endOfDay(now)
	const monthStart = startOfMonth(now)
	const monthEnd = endOfMonth(now)
	const todayContext = resolveTodayContext(todayStart, teamSettings)
	const modules = buildDashboardModules(entitlements, timerEnabledSetting)

	const [work, leaves, tasks, schedule, communication, personal] = await Promise.all([
		buildWorkSummary({ viewer, scope, todayStart, todayEnd, monthStart, monthEnd, todayContext }),
		modules.leaves
			? buildLeaveSummary({ viewer, scope, teamUsers, todayStart, todayEnd })
			: Promise.resolve({ pendingCount: 0, pendingPreview: [], todayAbsentCount: 0, todayAbsentPreview: [], upcoming: [], ownNextLeave: null }),
		buildTaskSummary({ viewer, enabled: modules.tasks }),
		buildScheduleSummary({ viewer, scope, enabled: modules.schedules, todayStart, todayEnd }),
		buildCommunicationSummary({ viewer, modules }),
		buildPersonalInsights({ viewer, teamSettings, settingsDoc, leavesEnabled: modules.leaves }),
	])

	return {
		period: {
			today: toIsoDate(todayStart),
			monthStart: toIsoDate(monthStart),
			monthEnd: toIsoDate(monthEnd),
			todayContext,
		},
		viewer: {
			id: viewer._id,
			name: personName(viewer),
			roleView: scope.roleView,
			roles: viewer.roles || [],
			canApproveLeaves: scope.canApproveLeaves,
			canViewTimesheets: scope.canViewTimesheets,
			canViewTeamInsights: canAccessTeamInsights(scope),
			modules,
		},
		team: {
			id: team._id,
			name: team.name,
			activeSeatCount,
			maxUsers: entitlements.maxUsers,
		},
		entitlements: {
			planKey: entitlements.planKey,
			freemiumTier: entitlements.freemiumTier,
			freemiumSeatBlocked: entitlements.freemiumSeatBlocked,
			paidPlanSeatLimitExceeded: entitlements.paidPlanSeatLimitExceeded,
			ai: entitlements.ai,
		},
		settings: {
			timerEnabled: modules.timeTracking,
			workOnWeekends: teamSettings.workOnWeekends,
			includePolishHolidays: teamSettings.includePolishHolidays,
			includeCustomHolidays: teamSettings.includeCustomHolidays,
		},
		work,
		leaves,
		tasks,
		schedule,
		communication,
		personal,
		quickActions: buildQuickActions({ scope, modules, entitlements }),
	}
}

module.exports = {
	buildDashboardSummary,
	buildTeamInsights,
}
