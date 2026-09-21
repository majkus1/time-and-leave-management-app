const mongoose = require('mongoose')
const { firmDb } = require('../db/db')
const Team = require('../models/Team')(firmDb)
const User = require('../models/user')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Schedule = require('../models/Schedule')(firmDb)
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)
const TaskComment = require('../models/TaskComment')(firmDb)
const Announcement = require('../models/Announcement')(firmDb)
const QRCode = require('../models/QRCode')(firmDb)
const TimeEntry = require('../models/TimeEntry')(firmDb)
const CalendarConfirmation = require('../models/CalendarConfirmation')(firmDb)
const entitlementsService = require('./entitlementsService')
const { countTeamSeats } = require('./teamSeatCountService')
const qrService = require('./qrService')

/**
 * Dane demonstracyjne dla nowego zespołu: kilku pracowników bez dostępu (nie zużywają maili ani haseł) z ewidencją
 * za bieżący miesiąc, sesjami z QR, wnioskami urlopowymi, grafikiem na ten tydzień, tablicą zadań i komunikatem.
 * Identyfikatory wszystkiego, co powstało, trzymamy w team.demoData — usunięcie kasuje dokładnie to (i nic więcej).
 * Pracownicy demo liczą się do limitu miejsc jak każdy inny — dlatego tworzymy ich tylu, ile zmieści plan.
 */
const DEMO_LAST_NAME = 'Demo'
const DEMO_EMPLOYEES = [
	{ firstName: 'Anna', position: 'Specjalistka ds. produkcji' },
	{ firstName: 'Piotr', position: 'Operator maszyn' },
	{ firstName: 'Marta', position: 'Koordynatorka zmiany' },
]
const WORKER_ROLE = 'Pracownik (Worker)'
const MAX_DEMO_EMPLOYEES = DEMO_EMPLOYEES.length

function ymd(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Data dnia ewidencji jak w workdayController: południe UTC danego dnia (bez przesunięć o dobę). */
function workdayDate(d) {
	return new Date(`${ymd(d)}T12:00:00.000Z`)
}

function addDays(d, n) {
	const x = new Date(d)
	x.setDate(x.getDate() + n)
	return x
}

function atTime(d, h, m = 0) {
	const x = new Date(d)
	x.setHours(h, m, 0, 0)
	return x
}

function isWeekend(d) {
	const day = d.getDay()
	return day === 0 || day === 6
}

/** Poniedziałek bieżącego tygodnia (lokalnie). */
function mondayOf(d) {
	const x = new Date(d)
	x.setHours(0, 0, 0, 0)
	const day = x.getDay()
	x.setDate(x.getDate() - ((day + 6) % 7))
	return x
}

function isAdminOrHr(roles) {
	return Array.isArray(roles) && (roles.includes('Admin') || roles.includes('HR'))
}

function forbidden() {
	const err = new Error('Forbidden')
	err.code = 'FORBIDDEN'
	return err
}

function demoUsername(teamId, index) {
	return `demo-${String(teamId)}-${index}-${Date.now()}@no-access.planopia.local`
}

/** Stan dla UI: present = są dane do usunięcia; available = można wczytać (trial i jeszcze nie wczytano). */
function describeDemoState(team) {
	const demo = team?.demoData
	const present = Boolean(demo?.createdAt)
	return {
		present,
		available: !present && Boolean(team) && entitlementsService.isTrialActive(team),
		createdAt: demo?.createdAt || null,
		employees: Array.isArray(demo?.users) ? demo.users.length : 0,
	}
}

async function getDemoState(teamId) {
	const team = await Team.findById(teamId).select('demoData billingPlanKey trialEndsAt').lean()
	return describeDemoState(team)
}

/**
 * Tworzy komplet danych demo. Rzuca DEMO_EXISTS (już są), DEMO_NO_SEATS (brak wolnych miejsc w planie), FORBIDDEN.
 */
async function createDemoData({ teamId, userId, roles }) {
	if (!isAdminOrHr(roles)) throw forbidden()
	const team = await Team.findById(teamId)
	if (!team) throw forbidden()
	if (team.demoData?.createdAt) {
		const err = new Error('Demo data already present')
		err.code = 'DEMO_EXISTS'
		throw err
	}
	// Dane demo służą do obejrzenia pełnej aplikacji — sens mają tylko w okresie próbnym (potem plan darmowy lub płatny z własnymi danymi)
	if (!entitlementsService.isTrialActive(team)) {
		const err = new Error('Demo data is available only during the trial')
		err.code = 'DEMO_NOT_TRIAL'
		throw err
	}
	const admin = await User.findById(userId).select('_id firstName lastName teamId').lean()
	if (!admin || String(admin.teamId) !== String(teamId)) throw forbidden()

	const seatsUsed = await countTeamSeats(teamId)
	const seatsFree = Math.max(0, entitlementsService.effectiveMaxUsers(team) - seatsUsed)
	const employeesToCreate = Math.min(MAX_DEMO_EMPLOYEES, seatsFree)
	if (employeesToCreate < 1) {
		const err = new Error('No free seats for demo employees')
		err.code = 'DEMO_NO_SEATS'
		throw err
	}

	const ids = { users: [], workdays: [], leaveRequests: [], schedules: [], boards: [], tasks: [], announcements: [], qrCodes: [] }
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

	// 1. Pracownicy bez dostępu (jak „pracownik bez dostępu” w Zarządzaniu zespołem)
	const users = []
	for (let i = 0; i < employeesToCreate; i += 1) {
		const spec = DEMO_EMPLOYEES[i]
		const u = await User.create({
			username: demoUsername(teamId, i),
			firstName: spec.firstName,
			lastName: DEMO_LAST_NAME,
			teamId,
			roles: [WORKER_ROLE],
			department: [],
			position: spec.position,
			appAccessEnabled: false,
			managedOnly: true,
			createdBy: admin._id,
			leaveTypeDays: { 'leaveform.option1': 20 },
		})
		users.push(u)
		ids.users.push(u._id)
	}
	const fullName = u => `${u.firstName} ${u.lastName}`

	// 2. Kod QR (miejsce pracy) — sesje z licznika pokażą „Miejsce QR”
	let qrCodeId = null
	try {
		const qr = await qrService.generateQRCode(teamId, 'Demo — wejście do biura', admin._id)
		qrCodeId = qr._id
		ids.qrCodes.push(qr._id)
	} catch (e) {
		console.warn('[demoData] QR skipped:', e?.message || e)
	}

	// 3. Ewidencja za bieżący miesiąc do dziś (dni robocze); jeden dzień nadgodzin, jedna osoba z sesjami QR
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
	for (let ui = 0; ui < users.length; ui += 1) {
		const u = users[ui]
		for (let d = new Date(monthStart); d < today; d = addDays(d, 1)) {
			if (isWeekend(d)) continue
			const dayNo = d.getDate()
			const overtime = dayNo % 9 === 0 && ui === 0
			const doc = {
				userId: u._id,
				date: workdayDate(d),
				hoursWorked: 8,
				additionalWorked: overtime ? 2 : 0,
				realTimeDayWorked: overtime ? '08:00-18:00' : ui === 2 ? '10:00-18:00' : '08:00-16:00',
				notes: overtime ? 'Pilne zamówienie — nadgodziny' : '',
				lastChangedBy: admin._id,
			}
			if (ui === 1 && qrCodeId && dayNo % 5 === 0) {
				// sesje z licznika uruchamiane kodem QR (wejście/wyjście)
				doc.timeEntries = [
					{ startTime: atTime(d, 8, 2), endTime: atTime(d, 12, 0), isBreak: false, workDescription: 'Zmiana poranna', qrCodeId },
					{ startTime: atTime(d, 12, 30), endTime: atTime(d, 16, 32), isBreak: false, workDescription: 'Zmiana poranna', qrCodeId },
				]
			}
			const w = await Workday.create(doc)
			ids.workdays.push(w._id)
		}
	}

	// 4. Wnioski urlopowe: zaakceptowany (przyszły tydzień), oczekujący, L4 (auto-akceptacja)
	const nextMonday = addDays(mondayOf(today), 7)
	const leaveSpecs = [
		users[0] && { user: users[0], type: 'leaveform.option1', start: nextMonday, days: 3, status: 'status.accepted', info: 'Wyjazd rodzinny' },
		users[1] && { user: users[1], type: 'leaveform.option1', start: addDays(nextMonday, 9), days: 2, status: 'status.pending', info: '' },
		users[2] && { user: users[2], type: 'leaveform.option6', start: addDays(mondayOf(today), -7), days: 1, status: 'status.accepted', info: '' },
	].filter(Boolean)
	for (const s of leaveSpecs) {
		// koniec = start + dni robocze - 1 (bez weekendu w środku dla krótkich wniosków)
		let end = new Date(s.start)
		let left = s.days - 1
		while (left > 0) {
			end = addDays(end, 1)
			if (!isWeekend(end)) left -= 1
		}
		const lr = await LeaveRequest.create({
			userId: s.user._id,
			type: s.type,
			startDate: new Date(`${ymd(s.start)}T00:00:00.000Z`),
			endDate: new Date(`${ymd(end)}T00:00:00.000Z`),
			daysRequested: s.days,
			settlementUnit: 'days',
			replacement: users.find(x => String(x._id) !== String(s.user._id)) ? fullName(users.find(x => String(x._id) !== String(s.user._id))) : '',
			additionalInfo: s.info,
			status: s.status,
			submittedBy: admin._id,
			updatedBy: s.status === 'status.accepted' ? admin._id : undefined,
			isProcessed: s.status !== 'status.pending',
		})
		ids.leaveRequests.push(lr._id)
	}

	// 5. Grafik na bieżący i następny tydzień (opublikowany)
	const shifts = [
		['08:00', '16:00'],
		['12:00', '20:00'],
		['06:00', '14:00'],
	]
	const days = []
	const weekStart = mondayOf(today)
	for (let i = 0; i < 12; i += 1) {
		const d = addDays(weekStart, i)
		if (isWeekend(d)) continue
		days.push({
			date: d,
			availabilities: [],
			entries: users.map((u, ui) => ({
				employeeId: u._id,
				employeeName: fullName(u),
				timeFrom: shifts[(ui + i) % shifts.length][0],
				timeTo: shifts[(ui + i) % shifts.length][1],
				createdBy: admin._id,
				isPublished: true,
			})),
		})
	}
	const schedule = await Schedule.create({
		name: 'Demo — grafik zmianowy',
		teamId,
		type: 'custom',
		members: users.map(u => u._id),
		createdBy: admin._id,
		days,
	})
	ids.schedules.push(schedule._id)

	// 6. Tablica zadań z zadaniami w każdej kolumnie
	const board = await Board.create({
		name: 'Demo — wdrożenie Planopii',
		teamId,
		type: 'custom',
		description: 'Przykładowa tablica: zadania na każdym etapie, przypisane do pracowników demo.',
		members: [admin._id, ...users.map(u => u._id)],
		isActive: true,
		createdBy: admin._id,
	})
	ids.boards.push(board._id)
	const taskSpecs = [
		{ title: 'Przygotować listę pracowników do importu', status: 'todo', priority: 'medium', assignee: 0, due: 3 },
		{ title: 'Wydrukować kod QR i powiesić przy wejściu', status: 'in-progress', priority: 'high', assignee: 1, due: 1 },
		{ title: 'Sprawdzić grafik na przyszły tydzień', status: 'review', priority: 'low', assignee: 2, due: 5 },
		{ title: 'Ustawić święta i godziny pracy zespołu', status: 'done', priority: 'urgent', assignee: 0, due: -2 },
	]
	for (let i = 0; i < taskSpecs.length; i += 1) {
		const s = taskSpecs[i]
		const assignee = users[s.assignee % users.length]
		const t = await Task.create({
			title: s.title,
			description: 'Zadanie demonstracyjne — można je edytować, przesuwać między kolumnami lub usunąć.',
			boardId: board._id,
			status: s.status,
			priority: s.priority,
			assignedTo: assignee ? [assignee._id] : [],
			assignedScope: 'specific',
			createdBy: admin._id,
			order: i,
			isActive: true,
			dueDate: addDays(today, s.due),
		})
		ids.tasks.push(t._id)
	}

	// 7. Komunikat
	const ann = await Announcement.create({
		teamId,
		createdBy: admin._id,
		title: 'Dane demonstracyjne w zespole',
		content:
			'Ten zespół ma wczytane dane demonstracyjne: pracowników „Demo”, ich ewidencję za bieżący miesiąc, wnioski urlopowe, grafik zmianowy, tablicę zadań i kod QR. Wszystko można usunąć jednym przyciskiem na stronie Start (lista „Pierwsze kroki”).',
		targetScope: 'all',
	})
	ids.announcements.push(ann._id)

	team.demoData = { createdAt: now, ...ids }
	team.markModified('demoData')
	await team.save()

	return { ok: true, employees: users.length, seatsFree: seatsFree - users.length }
}

/** Usuwa wyłącznie to, co powstało w createDemoData (po id) oraz wszystko, co należy do pracowników demo. */
async function removeDemoData({ teamId, roles }) {
	if (!isAdminOrHr(roles)) throw forbidden()
	const team = await Team.findById(teamId)
	if (!team) throw forbidden()
	const demo = team.demoData
	if (!demo?.createdAt) return { ok: true, removed: false }

	const oid = v => new mongoose.Types.ObjectId(String(v))
	const userIds = (demo.users || []).map(oid)
	const tid = oid(teamId)

	// Dane pracowników demo — także to, co ktoś dopisał im ręcznie po wczytaniu
	if (userIds.length) {
		await Workday.deleteMany({ userId: { $in: userIds } })
		await LeaveRequest.deleteMany({ userId: { $in: userIds } })
		await TimeEntry.deleteMany({ userId: { $in: userIds } })
		await CalendarConfirmation.deleteMany({ userId: { $in: userIds } }).catch(() => {})
		await Board.updateMany({ teamId: tid }, { $pull: { members: { $in: userIds } } })
		await Schedule.updateMany({ teamId: tid }, { $pull: { members: { $in: userIds } } })
		await Schedule.updateMany({ teamId: tid }, { $pull: { 'days.$[].entries': { employeeId: { $in: userIds } } } })
		await Task.updateMany({ assignedTo: { $in: userIds } }, { $pull: { assignedTo: { $in: userIds } } })
	}
	// Zadania z seeda + wszystko, co ktoś dopisał na tablicy demo (bez tablicy byłyby niedostępne). Inne tablice nietknięte.
	const demoBoardIds = (demo.boards || []).map(oid)
	const boardTasks = demoBoardIds.length ? await Task.find({ boardId: { $in: demoBoardIds } }).select('_id').lean() : []
	const taskIds = [...new Set([...(demo.tasks || []).map(String), ...boardTasks.map(t => String(t._id))])].map(oid)
	if (taskIds.length) {
		await TaskComment.deleteMany({ taskId: { $in: taskIds } }).catch(() => {})
		await Task.deleteMany({ _id: { $in: taskIds } })
	}
	if (demo.boards?.length) await Board.deleteMany({ _id: { $in: demo.boards.map(oid) }, teamId: tid })
	if (demo.schedules?.length) await Schedule.deleteMany({ _id: { $in: demo.schedules.map(oid) }, teamId: tid })
	if (demo.announcements?.length) await Announcement.deleteMany({ _id: { $in: demo.announcements.map(oid) }, teamId: tid })
	if (demo.qrCodes?.length) await QRCode.deleteMany({ _id: { $in: demo.qrCodes.map(oid) }, teamId: tid })
	if (demo.workdays?.length) await Workday.deleteMany({ _id: { $in: demo.workdays.map(oid) } })
	if (demo.leaveRequests?.length) await LeaveRequest.deleteMany({ _id: { $in: demo.leaveRequests.map(oid) } })
	if (userIds.length) await User.deleteMany({ _id: { $in: userIds }, teamId: tid, managedOnly: true })

	team.demoData = null
	team.markModified('demoData')
	await team.save()
	return { ok: true, removed: true }
}

module.exports = { getDemoState, describeDemoState, createDemoData, removeDemoData, MAX_DEMO_EMPLOYEES }
