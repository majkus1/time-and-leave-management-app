const mongoose = require('mongoose')
const moment = require('moment-timezone')
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

const WARSAW = 'Europe/Warsaw'

/** Godzina w strefie Warszawy dla danego dnia — jak skan QR w Polsce, niezależnie od strefy serwera. */
function atWarsaw(d, h, m = 0) {
	return moment.tz(`${ymd(d)} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`, 'YYYY-MM-DD HH:mm', WARSAW).toDate()
}

/** „HH:MM-HH:MM” jak przy stopie licznika (workdayController: czas lokalny Warszawy). */
function warsawRange(start, end) {
	return `${moment(start).tz(WARSAW).format('HH:mm')}-${moment(end).tz(WARSAW).format('HH:mm')}`
}

/** Sesja licznika jak po zeskanowaniu QR (wejście/wyjście) — bez przerw i nadgodzin. */
function timerSession(d, from, to, qrCodeId, workDescription) {
	const startTime = atWarsaw(d, from[0], from[1])
	const endTime = atWarsaw(d, to[0], to[1])
	return {
		entry: { startTime, endTime, isBreak: false, breakTime: 0, isOvertime: false, overtimeTime: 0, workDescription, qrCodeId },
		hours: (endTime - startTime) / 3600000,
		range: warsawRange(startTime, endTime),
	}
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

	// 3. Wnioski urlopowe — najpierw, bo w dniu zaakceptowanej nieobecności nie może być wpisu pracy
	const nextMonday = addDays(mondayOf(today), 7)
	const leaveSpecs = [
		users[0] && { user: users[0], type: 'leaveform.option1', start: nextMonday, days: 3, status: 'status.accepted', info: 'Wyjazd rodzinny' },
		users[1] && { user: users[1], type: 'leaveform.option1', start: addDays(nextMonday, 9), days: 2, status: 'status.pending', info: '' },
		// L4 nie wymaga zatwierdzenia — w aplikacji zapisuje się jako „wysłany” (status.sent), bez zatwierdzającego
		users[2] && { user: users[2], type: 'leaveform.option6', start: addDays(mondayOf(today), -7), days: 1, status: 'status.sent', info: '' },
	].filter(Boolean)
	const leaveEnd = s => {
		// koniec = start + dni robocze - 1 (weekend w środku nie liczy się do wniosku)
		let end = new Date(s.start)
		let left = s.days - 1
		while (left > 0) {
			end = addDays(end, 1)
			if (!isWeekend(end)) left -= 1
		}
		return end
	}
	const absentDays = new Map() // userId → Set(ymd) dla zaakceptowanych nieobecności
	for (const s of leaveSpecs) {
		if (s.status !== 'status.accepted' && s.status !== 'status.sent') continue
		const set = absentDays.get(String(s.user._id)) || new Set()
		for (let d = new Date(s.start), end = leaveEnd(s); d <= end; d = addDays(d, 1)) set.add(ymd(d))
		absentDays.set(String(s.user._id), set)
	}

	// 4. Ewidencja za bieżący miesiąc do dziś (dni robocze); jeden dzień nadgodzin, jedna osoba z sesjami QR
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
	for (let ui = 0; ui < users.length; ui += 1) {
		const u = users[ui]
		for (let d = new Date(monthStart); d < today; d = addDays(d, 1)) {
			if (isWeekend(d)) continue
			if (absentDays.get(String(u._id))?.has(ymd(d))) continue
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
				// Dzień z licznika: jak po dwóch skanach QR (wejście/wyjście) — godziny dnia i zakres wynikają z sesji,
				// dokładnie tak, jak zapisuje je stop licznika w workdayController (nie ma osobnego wpisu ręcznego).
				const sessions = [
					timerSession(d, [8, 2], [12, 0], qrCodeId, 'Zmiana poranna'),
					timerSession(d, [12, 30], [16, 32], qrCodeId, 'Zmiana poranna'),
				]
				doc.timeEntries = sessions.map(s => s.entry)
				doc.hoursWorked = sessions.reduce((sum, s) => sum + s.hours, 0)
				doc.additionalWorked = 0
				doc.realTimeDayWorked = sessions.map(s => s.range).join(', ')
				doc.notes = ''
				// Rejestr skanów QR (wejście / wyjście) — to samo, co zapisuje strona /qr-scan
				for (const s of sessions) {
					await TimeEntry.create({
						userId: u._id,
						qrCodeId,
						entryTime: s.entry.startTime,
						exitTime: s.entry.endTime,
						date: atWarsaw(d, 0, 0),
						isOvertime: false,
					})
				}
			}
			const w = await Workday.create(doc)
			ids.workdays.push(w._id)
		}
	}

	// 5. Zapis wniosków urlopowych: zaakceptowany (przyszły tydzień), oczekujący, L4 (auto-akceptacja)
	for (const s of leaveSpecs) {
		const end = leaveEnd(s)
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
			isProcessed: s.status === 'status.accepted',
		})
		ids.leaveRequests.push(lr._id)
	}

	// 6. Grafik na bieżący i następny tydzień (opublikowany)
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
			// bez zmiany w dniu zaakceptowanej nieobecności — inaczej aplikacja zgłosi konflikt urlop/grafik
			entries: users.filter(u => !absentDays.get(String(u._id))?.has(ymd(d))).map((u, ui) => ({
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

	// 7. Tablica zadań z zadaniami w każdej kolumnie
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
		{ title: 'Sprawdzić grafik na przyszły tydzień', status: 'review', priority: 'low', assignee: 2, due: 5, allMembers: true },
		{ title: 'Inwentaryzacja magazynu', status: 'in-progress', priority: 'medium', assignee: 1, period: [2, 6] },
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
			// Kalendarz zadań pokazuje tylko zadania przypisane do oglądającego (lub „wszyscy”) — dopisujemy admina,
			// inaczej dane demo nie pojawiłyby się w kalendarzu tablicy ani w „moich zadaniach”.
			assignedTo: assignee ? [assignee._id, admin._id] : [admin._id],
			assignedScope: s.allMembers ? 'all-members' : 'specific',
			createdBy: admin._id,
			order: i,
			isActive: true,
			dueDate: s.period ? null : addDays(today, s.due),
			dueTime: s.period ? null : '15:00',
			workPeriodStart: s.period ? addDays(today, s.period[0]) : null,
			workPeriodEnd: s.period ? addDays(today, s.period[1]) : null,
		})
		ids.tasks.push(t._id)
	}

	// 8. Komunikat
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
