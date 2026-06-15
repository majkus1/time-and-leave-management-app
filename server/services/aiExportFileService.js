/**
 * Excel / PDF built only from MongoDB using validated export context (aiExportIntentService).
 */
const path = require('path')
const ExcelJS = require('exceljs')
const pdfMake = require('pdfmake')

const { firmDb } = require('../db/db')
const User = require('../models/user')(firmDb)
const Workday = require('../models/Workday')(firmDb)
const LeaveRequest = require('../models/LeaveRequest')(firmDb)
const Task = require('../models/Task')(firmDb)
const Board = require('../models/Board')(firmDb)
const Settings = require('../models/Settings')(firmDb)
const { resolveExportExecutionContext } = require('./aiExportIntentService')
const { roundWorkHoursForDisplay } = require('../utils/workHoursDisplay')
const { getLeaveRequestTypeName } = require('../utils/leaveRequestTypes')
const { PDF_REPORT_THEME } = require('../constants/pdfReportTheme')

/** Gdy brak wpisu w Settings — te same nazwy co domyślne w models/Settings.js */
const SYSTEM_LEAVE_TYPE_FALLBACK = {
	pl: {
		'leaveform.option1': 'Urlop wypoczynkowy',
		'leaveform.option2': 'Urlop okolicznościowy',
		'leaveform.option3': 'Urlop na żądanie',
		'leaveform.option4': 'Urlop bezpłatny',
		'leaveform.option5': 'Inna nieobecność',
		'leaveform.option6': 'Zwolnienie Lekarskie (L4)',
	},
	en: {
		'leaveform.option1': 'Paid Vacation',
		'leaveform.option2': 'Special Leave',
		'leaveform.option3': 'On-Demand Leave',
		'leaveform.option4': 'Unpaid Leave',
		'leaveform.option5': 'Other Absence',
		'leaveform.option6': 'Sick Leave (L4)',
	},
}

const fontRoot = path.join(__dirname, '../../node_modules/open-sans-fonts/open-sans')
pdfMake.setFonts({
	OpenSans: {
		normal: path.join(fontRoot, 'Regular/OpenSans-Regular.ttf'),
		bold: path.join(fontRoot, 'Bold/OpenSans-Bold.ttf'),
		italics: path.join(fontRoot, 'Italic/OpenSans-Italic.ttf'),
		bolditalics: path.join(fontRoot, 'BoldItalic/OpenSans-BoldItalic.ttf'),
	},
})
pdfMake.setUrlAccessPolicy(() => false)

function formatDate(d) {
	if (!d) return ''
	try {
		const x = new Date(d)
		if (Number.isNaN(x.getTime())) return ''
		return x.toISOString().slice(0, 10)
	} catch {
		return ''
	}
}

function safeUserId(doc) {
	if (!doc || doc.userId == null) return ''
	try {
		return doc.userId.toString()
	} catch {
		return ''
	}
}

/**
 * Zaokrągla godziny / dni w eksporcie — unikamy długich floatów z JS (np. 4.670935277777778).
 * @param {unknown} v
 * @param {number} [decimals=2]
 * @returns {number|''}
 */
function roundDecimal(v, decimals = 2) {
	if (v === null || v === undefined || v === '') return ''
	const n = Number(v)
	if (Number.isNaN(n)) return ''
	const f = 10 ** decimals
	return Math.round(n * f) / f
}

const MAX_NOTES_EXPORT_LEN = 4000

/**
 * Uwagi dnia + opisy sesji timera (jak w kontekście AI) — spójność z tabelą w czacie.
 * @param {object} wd — dokument Workday (lean)
 */
function buildWorkdayNotesForExport(wd) {
	const note = (wd.notes && String(wd.notes).trim()) || ''
	const fromSessions = (wd.timeEntries || [])
		.filter(te => !te.isBreak)
		.map(te => (te.workDescription || '').trim())
		.filter(Boolean)
	const sessionText = fromSessions.join(' | ')
	let out = ''
	if (note && sessionText) {
		out = `${note} — ${sessionText}`
	} else if (note) {
		out = note
	} else if (sessionText) {
		out = sessionText
	}
	return out.slice(0, MAX_NOTES_EXPORT_LEN)
}

function userNameMap(users) {
	const m = new Map()
	for (const u of users) {
		m.set(u._id.toString(), `${u.firstName || ''} ${u.lastName || ''}`.trim())
	}
	return m
}

/** Jak w aiVerifiedStatsService — dni z godzinami > 0, sumy godzin i nadgodzin. */
function computeWorkdaySummaryFromRows(rows) {
	const byUser = new Map()
	for (const wd of rows) {
		const uid = safeUserId(wd)
		if (!uid) continue
		if (!byUser.has(uid)) {
			byUser.set(uid, { dayKeys: new Set(), hours: 0, ot: 0 })
		}
		const b = byUser.get(uid)
		const dk = formatDate(wd.date)
		if (wd.hoursWorked && Number(wd.hoursWorked) > 0) {
			if (dk) b.dayKeys.add(dk)
			b.hours += Number(wd.hoursWorked) || 0
		}
		if (wd.additionalWorked) {
			b.ot += Number(wd.additionalWorked) || 0
		}
	}
	let totalDays = 0
	let totalHours = 0
	let totalOt = 0
	const perUser = []
	for (const [uid, v] of byUser) {
		const d = v.dayKeys.size
		const h = v.hours
		const o = v.ot
		totalDays += d
		totalHours += h
		totalOt += o
		perUser.push({ userId: uid, days: d, hours: h, ot: o })
	}
	return { perUser, totalDays, totalHours, totalOt }
}

function formatTaskStatusLabel(status, locale) {
	const en = locale === 'en'
	const s = String(status || '')
	const map = en
		? { todo: 'To do', 'in-progress': 'In progress', review: 'Review', done: 'Done' }
		: { todo: 'Do zrobienia', 'in-progress': 'W trakcie', review: 'Do przeglądu', done: 'Zrobione' }
	return map[s] || s
}

function formatOptionalDate(d) {
	if (!d) return ''
	return formatDate(d)
}

function formatTaskWorkPeriod(t) {
	const a = formatOptionalDate(t.workPeriodStart)
	const b = formatOptionalDate(t.workPeriodEnd)
	if (a && b) return `${a} → ${b}`
	if (b) return b
	if (a) return a
	return ''
}

/**
 * Status wniosku (klucze status.*) → etykieta PL/EN jak w UI.
 * @param {string} status
 * @param {string} locale 'pl' | 'en'
 */
function formatLeaveStatusForExport(status, locale) {
	const en = locale === 'en'
	const map = en
		? {
				'status.pending': 'Pending approval',
				'status.accepted': 'Accepted',
				'status.rejected': 'Rejected',
				'status.sent': 'Sent',
			}
		: {
				'status.pending': 'Oczekuje na akceptację',
				'status.accepted': 'Zaakceptowany',
				'status.rejected': 'Odrzucony',
				'status.sent': 'Wysłany',
			}
	const key = String(status || '')
	return map[key] || key
}

/**
 * Typ urlopu (leaveform.* / custom-*) — nazwa z Settings zespołu lub fallback systemowy.
 * @param {object|null|undefined} settingsLean — dokument Settings (lean) lub null
 * @param {string} typeId
 * @param {string} locale
 */
function formatLeaveTypeForExport(settingsLean, typeId, locale) {
	const lang = locale === 'en' ? 'en' : 'pl'
	const fromSettings = getLeaveRequestTypeName(settingsLean || {}, typeId, null, lang)
	if (fromSettings && fromSettings !== typeId) return fromSettings
	const fb = SYSTEM_LEAVE_TYPE_FALLBACK[lang][typeId]
	return fb || String(typeId || '')
}

function labels(locale) {
	const en = locale === 'en'
	return {
		title: en ? 'Planopia export' : 'Eksport Planopia',
		periodSummary: en ? 'Period summary' : 'Podsumowanie okresu',
		fullReport: en ? 'Full period report' : 'Raport okresu (pełny)',
		leaves: en ? 'Leave requests' : 'Wnioski urlopowe',
		workdays: en ? 'Workdays' : 'Ewidencja czasu',
		tasks: en ? 'Tasks' : 'Zadania',
		workedDays: en ? 'Worked days (distinct)' : 'Przepracowane dni (różne)',
		totalHours: en ? 'Total hours' : 'Łącznie godzin pracy',
		overtime: en ? 'Overtime' : 'Nadgodziny',
		none: en ? 'None' : 'Brak',
		name: en ? 'Name' : 'Nazwa',
		from: en ? 'From' : 'Od',
		to: en ? 'To' : 'Do',
		type: en ? 'Type' : 'Typ',
		days: en ? 'Days' : 'Dni',
		status: en ? 'Status' : 'Status',
		date: en ? 'Date' : 'Data',
		hours: en ? 'Hours' : 'Godziny',
		notes: en ? 'Notes' : 'Notatki',
		board: en ? 'Board' : 'Tablica',
		taskTitle: en ? 'Title' : 'Tytuł',
		taskStatus: en ? 'Status' : 'Status',
		dueDate: en ? 'Due date' : 'Termin',
		workPeriod: en ? 'Work period' : 'Okres pracy',
		period: en ? 'Period' : 'Okres',
	}
}

async function fetchLeaves(ctx) {
	const { range, allowedUserIds, leaveStatuses, requestingUser } = ctx
	let settings = null
	if (requestingUser?.teamId) {
		settings = await Settings.findOne({ teamId: requestingUser.teamId }).select('leaveRequestTypes').lean()
	}
	if (allowedUserIds.length === 0) return { rows: [], users: [], settings }
	const rows = await LeaveRequest.find({
		userId: { $in: allowedUserIds },
		startDate: { $lte: range.end },
		endDate: { $gte: range.start },
		status: { $in: leaveStatuses },
	})
		.sort({ startDate: -1 })
		.limit(5000)
		.lean()
	const uids = [...new Set(rows.map(r => safeUserId(r)).filter(Boolean))]
	const users = uids.length
		? await User.find({ _id: { $in: uids } })
				.select('firstName lastName')
				.lean()
		: []
	return { rows, users, settings }
}

async function fetchWorkdays(ctx) {
	const { range, allowedUserIds } = ctx
	if (allowedUserIds.length === 0) return { rows: [], users: [] }
	const rows = await Workday.find({
		userId: { $in: allowedUserIds },
		date: { $gte: range.start, $lte: range.end },
	})
		.sort({ date: 1 })
		.limit(8000)
		.lean()
	const uids = [...new Set(rows.map(r => safeUserId(r)).filter(Boolean))]
	const users = uids.length
		? await User.find({ _id: { $in: uids } })
				.select('firstName lastName')
				.lean()
		: []
	return { rows, users }
}

async function fetchTasks(ctx) {
	const { range, allowedUserIds, requestingUser } = ctx
	const teamId = requestingUser.teamId
	const boards = await Board.find({ teamId, isActive: true }).select('_id name').lean()
	const boardIds = boards.map(b => b._id)
	const boardMap = Object.fromEntries(boards.map(b => [b._id.toString(), b.name || '']))

	// MongoDB / Mongoose: $in: [] może powodować błąd lub nieprzewidywalne zachowanie — nie wykonuj zapytania.
	if (boardIds.length === 0) {
		return { rows: [], users: [], boardMap: {} }
	}

	const allowedSet = new Set(allowedUserIds.map(id => id.toString()))
	let tasks = await Task.find({
		boardId: { $in: boardIds },
		isActive: { $ne: false },
		$or: [{ createdAt: { $gte: range.start, $lte: range.end } }, { updatedAt: { $gte: range.start, $lte: range.end } }],
	})
		.sort({ updatedAt: -1 })
		.limit(2000)
		.lean()

	tasks = tasks.filter(t => {
		const createdBy = t.createdBy?.toString()
		const assigned = (t.assignedTo || []).map(a => a.toString())
		const touches = createdBy && allowedSet.has(createdBy)
		const assignedOk = assigned.some(a => allowedSet.has(a))
		return touches || assignedOk
	})

	const uidSet = new Set()
	for (const t of tasks) {
		if (t.createdBy) uidSet.add(t.createdBy)
		for (const a of t.assignedTo || []) uidSet.add(a)
	}
	const uidArr = [...uidSet]
	const users = uidArr.length ? await User.find({ _id: { $in: uidArr } }).select('firstName lastName').lean() : []
	return { rows: tasks, users, boardMap }
}

exports.buildAiIntentExportBuffer = async function buildAiIntentExportBuffer(input) {
	const format = input.format === 'pdf' ? 'pdf' : 'xlsx'
	const ctx = await resolveExportExecutionContext(input.userId, input)

	if (ctx.reportType === 'leaves') {
		const data = await fetchLeaves(ctx)
		return format === 'pdf' ? await buildPdfLeaves(ctx, data) : await buildExcelLeaves(ctx, data)
	}
	if (ctx.reportType === 'workdays') {
		const data = await fetchWorkdays(ctx)
		return format === 'pdf' ? await buildPdfWorkdays(ctx, data) : await buildExcelWorkdays(ctx, data)
	}
	if (ctx.reportType === 'tasks') {
		const data = await fetchTasks(ctx)
		return format === 'pdf' ? await buildPdfTasks(ctx, data) : await buildExcelTasks(ctx, data)
	}
	if (ctx.reportType === 'combined') {
		const [leavesData, workdaysData, tasksData] = await Promise.all([
			fetchLeaves(ctx),
			fetchWorkdays(ctx),
			fetchTasks(ctx),
		])
		return format === 'pdf'
			? await buildPdfCombined(ctx, leavesData, workdaysData, tasksData)
			: await buildExcelCombined(ctx, leavesData, workdaysData, tasksData)
	}

	const err = new Error('Invalid report type')
	err.code = 'VALIDATION'
	throw err
}

async function buildExcelLeaves(ctx, data) {
	const L = labels(ctx.locale)
	const names = userNameMap(data.users)
	const wb = new ExcelJS.Workbook()
	wb.created = new Date()
	const ws = wb.addWorksheet(L.leaves)
	ws.columns = [
		{ header: L.name, key: 'n', width: 28 },
		{ header: L.from, key: 'f', width: 12 },
		{ header: L.to, key: 't', width: 12 },
		{ header: L.type, key: 'ty', width: 22 },
		{ header: L.days, key: 'd', width: 8 },
		{ header: L.status, key: 's', width: 22 },
	]
	for (const r of data.rows) {
		ws.addRow({
			n: names.get(safeUserId(r)) || safeUserId(r) || '',
			f: formatDate(r.startDate),
			t: formatDate(r.endDate),
			ty: formatLeaveTypeForExport(data.settings, r.type, ctx.locale),
			d: roundDecimal(r.daysRequested, 2),
			s: formatLeaveStatusForExport(r.status, ctx.locale),
		})
	}
	const buf = await wb.xlsx.writeBuffer()
	return Buffer.from(buf)
}

async function buildExcelWorkdays(ctx, data) {
	const L = labels(ctx.locale)
	const names = userNameMap(data.users)
	const wb = new ExcelJS.Workbook()
	const ws = wb.addWorksheet(L.workdays)
	ws.columns = [
		{ header: L.name, key: 'n', width: 26 },
		{ header: L.date, key: 'd', width: 12 },
		{ header: L.hours, key: 'h', width: 10 },
		{ header: L.notes, key: 'no', width: 44 },
	]
	for (const r of data.rows) {
		ws.addRow({
			n: names.get(safeUserId(r)) || safeUserId(r) || '',
			d: formatDate(r.date),
			h: roundDecimal(r.hoursWorked, 2),
			no: buildWorkdayNotesForExport(r).slice(0, 2000),
		})
	}
	const buf = await wb.xlsx.writeBuffer()
	return Buffer.from(buf)
}

async function buildExcelTasks(ctx, data) {
	const L = labels(ctx.locale)
	const names = userNameMap(data.users)
	const wb = new ExcelJS.Workbook()
	const ws = wb.addWorksheet(L.tasks)
	ws.columns = [
		{ header: L.taskTitle, key: 'ti', width: 36 },
		{ header: L.board, key: 'b', width: 24 },
		{ header: L.taskStatus, key: 's', width: 14 },
	]
	for (const t of data.rows) {
		ws.addRow({
			ti: (t.title || '').slice(0, 500),
			b: data.boardMap[t.boardId?.toString()] || '',
			s: t.status,
		})
	}
	const buf = await wb.xlsx.writeBuffer()
	return Buffer.from(buf)
}

function pdfTable(headers, rows, widths) {
	// pdfmake: tabela musi mieć co najmniej jeden wiersz danych (nie sam nagłówek).
	const bodyRows = rows.length > 0 ? rows : [headers.map(() => '—')]
	return {
		table: {
			headerRows: 1,
			widths: widths || headers.map(() => '*'),
			body: [headers, ...bodyRows],
		},
		layout: {
			fillColor: (i) => (i === 0 ? PDF_REPORT_THEME.headerFill : i % 2 === 0 ? PDF_REPORT_THEME.softRow : null),
			hLineWidth: () => 0.5,
			vLineWidth: () => 0.5,
			hLineColor: () => PDF_REPORT_THEME.line,
			vLineColor: () => PDF_REPORT_THEME.line,
		},
		margin: [0, 0, 0, 10],
	}
}

async function buildPdfLeaves(ctx, data) {
	const L = labels(ctx.locale)
	const names = userNameMap(data.users)
	const slice = data.rows.slice(0, 120)
	const rows = slice.map(r => [
		names.get(safeUserId(r)) || safeUserId(r) || '',
		formatDate(r.startDate),
		formatDate(r.endDate),
		formatLeaveTypeForExport(data.settings, r.type, ctx.locale),
		String(roundDecimal(r.daysRequested, 2) ?? ''),
		formatLeaveStatusForExport(r.status, ctx.locale),
	])
	const content = [
		{ text: `${L.leaves} — ${formatDate(ctx.range.start)}–${formatDate(ctx.range.end)}`, style: 'h', margin: [0, 0, 0, 10] },
		pdfTable([L.name, L.from, L.to, L.type, L.days, L.status], rows, ['*', 50, 50, 55, 35, 60]),
	]
	if (data.rows.length > 120) {
		content.push({ text: `+${data.rows.length - 120}…`, italics: true, fontSize: 8 })
	}
	return pdfBuffer(content)
}

async function buildPdfWorkdays(ctx, data) {
	const L = labels(ctx.locale)
	const names = userNameMap(data.users)
	const slice = data.rows.slice(0, 150)
	const rows = slice.map(r => {
		const h = roundWorkHoursForDisplay(r.hoursWorked)
		return [
			names.get(safeUserId(r)) || safeUserId(r) || '',
			formatDate(r.date),
			h === null ? '' : String(h),
			buildWorkdayNotesForExport(r).slice(0, 220),
		]
	})
	const content = [
		{ text: `${L.workdays} — ${formatDate(ctx.range.start)}–${formatDate(ctx.range.end)}`, style: 'h', margin: [0, 0, 0, 10] },
		pdfTable([L.name, L.date, L.hours, L.notes], rows, ['*', 55, 40, '*']),
	]
	if (data.rows.length > 150) {
		content.push({ text: `+${data.rows.length - 150}…`, italics: true, fontSize: 8 })
	}
	return pdfBuffer(content)
}

async function buildPdfTasks(ctx, data) {
	const L = labels(ctx.locale)
	const slice = data.rows.slice(0, 100)
	const rows = slice.map(t => [(t.title || '').slice(0, 80), data.boardMap[t.boardId?.toString()] || '', t.status])
	const content = [
		{ text: `${L.tasks} — ${formatDate(ctx.range.start)}–${formatDate(ctx.range.end)}`, style: 'h', margin: [0, 0, 0, 10] },
		pdfTable([L.taskTitle, L.board, L.taskStatus], rows, ['*', 70, 45]),
	]
	return pdfBuffer(content)
}

async function buildPdfCombined(ctx, leavesData, workdaysData, tasksData) {
	const L = labels(ctx.locale)
	const names = userNameMap([...leavesData.users, ...workdaysData.users, ...tasksData.users])
	const summary = computeWorkdaySummaryFromRows(workdaysData.rows)

	const content = [
		{ text: `${L.fullReport} — ${formatDate(ctx.range.start)}–${formatDate(ctx.range.end)}`, style: 'h', margin: [0, 0, 0, 10] },
		{ text: L.periodSummary, style: 'h', margin: [0, 0, 0, 10] },
	]

	if (summary.perUser.length === 0) {
		content.push({
			text: `${L.workedDays}: 0  |  ${L.totalHours}: 0  |  ${L.overtime}: 0`,
			margin: [0, 0, 0, 10],
		})
	} else if (summary.perUser.length === 1) {
		const p = summary.perUser[0]
		const nm = names.get(p.userId) || ''
		const lines = [
			nm ? `${L.name}: ${nm}` : null,
			`${L.workedDays}: ${p.days}`,
			`${L.totalHours}: ${roundDecimal(p.hours, 2)}`,
			`${L.overtime}: ${roundDecimal(p.ot, 2)}`,
		].filter(Boolean)
		content.push({ text: lines.join('\n'), margin: [0, 0, 0, 10] })
	} else {
		const sumRows = summary.perUser.map(p => [
			names.get(p.userId) || '',
			String(p.days),
			String(roundDecimal(p.hours, 2) ?? ''),
			String(roundDecimal(p.ot, 2) ?? ''),
		])
		content.push(pdfTable([L.name, L.days, L.hours, L.overtime], sumRows, ['*', 40, 45, 45]))
	}

	content.push({ text: L.workdays, style: 'h', margin: [0, 12, 0, 10] })
	const wdSlice = workdaysData.rows.slice(0, 120)
	if (wdSlice.length === 0) {
		content.push({ text: L.none, italics: true, margin: [0, 0, 0, 10] })
	} else {
		const wdRows = wdSlice.map(r => {
			const h = roundWorkHoursForDisplay(r.hoursWorked)
			return [
				names.get(safeUserId(r)) || safeUserId(r) || '',
				formatDate(r.date),
				h === null ? '' : String(h),
				buildWorkdayNotesForExport(r).slice(0, 200),
			]
		})
		content.push(pdfTable([L.name, L.date, L.hours, L.notes], wdRows, ['*', 45, 36, '*']))
		if (workdaysData.rows.length > 120) {
			content.push({ text: `+${workdaysData.rows.length - 120}…`, italics: true, fontSize: 8 })
		}
	}

	content.push({ text: L.leaves, style: 'h', pageBreak: 'before', margin: [0, 0, 0, 10] })
	const lvSlice = leavesData.rows.slice(0, 80)
	if (lvSlice.length === 0) {
		content.push({ text: L.none, italics: true, margin: [0, 0, 0, 10] })
	} else {
		const lvRows = lvSlice.map(r => [
			names.get(safeUserId(r)) || safeUserId(r) || '',
			formatDate(r.startDate),
			formatDate(r.endDate),
			formatLeaveTypeForExport(leavesData.settings, r.type, ctx.locale),
			String(roundDecimal(r.daysRequested, 2) ?? ''),
			formatLeaveStatusForExport(r.status, ctx.locale),
		])
		content.push(pdfTable([L.name, L.from, L.to, L.type, L.days, L.status], lvRows, ['*', 45, 45, 50, 32, 55]))
		if (leavesData.rows.length > 80) {
			content.push({ text: `+${leavesData.rows.length - 80}…`, italics: true, fontSize: 8 })
		}
	}

	content.push({ text: L.tasks, style: 'h', pageBreak: 'before', margin: [0, 0, 0, 10] })
	const tkSlice = tasksData.rows.slice(0, 60)
	if (tkSlice.length === 0) {
		content.push({ text: L.none, italics: true, margin: [0, 0, 0, 10] })
	} else {
		const tkRows = tkSlice.map(t => [
			(t.title || '').slice(0, 70),
			tasksData.boardMap[t.boardId?.toString()] || '',
			formatTaskStatusLabel(t.status, ctx.locale),
			formatOptionalDate(t.dueDate),
			formatTaskWorkPeriod(t).slice(0, 90),
		])
		content.push(
			pdfTable([L.taskTitle, L.board, L.taskStatus, L.dueDate, L.workPeriod], tkRows, ['*', 58, 48, 48, 52])
		)
		if (tasksData.rows.length > 60) {
			content.push({ text: `+${tasksData.rows.length - 60}…`, italics: true, fontSize: 8 })
		}
	}

	return pdfBuffer(content)
}

async function buildExcelCombined(ctx, leavesData, workdaysData, tasksData) {
	const L = labels(ctx.locale)
	const names = userNameMap([...leavesData.users, ...workdaysData.users, ...tasksData.users])
	const summary = computeWorkdaySummaryFromRows(workdaysData.rows)

	const wb = new ExcelJS.Workbook()
	wb.created = new Date()

	const wsSum = wb.addWorksheet(L.periodSummary.slice(0, 31))
	wsSum.addRow([L.period, `${formatDate(ctx.range.start)} – ${formatDate(ctx.range.end)}`])
	wsSum.addRow([])
	if (summary.perUser.length === 0) {
		wsSum.addRow([L.workedDays, 0])
		wsSum.addRow([L.totalHours, 0])
		wsSum.addRow([L.overtime, 0])
	} else if (summary.perUser.length === 1) {
		const p = summary.perUser[0]
		wsSum.addRow([L.name, names.get(p.userId) || ''])
		wsSum.addRow([L.workedDays, p.days])
		wsSum.addRow([L.totalHours, roundDecimal(p.hours, 2)])
		wsSum.addRow([L.overtime, roundDecimal(p.ot, 2)])
	} else {
		wsSum.addRow([L.name, L.days, L.hours, L.overtime])
		for (const p of summary.perUser) {
			wsSum.addRow([names.get(p.userId), p.days, roundDecimal(p.hours, 2), roundDecimal(p.ot, 2)])
		}
	}

	const wsWd = wb.addWorksheet(L.workdays.slice(0, 31))
	wsWd.columns = [
		{ header: L.name, key: 'n', width: 26 },
		{ header: L.date, key: 'd', width: 12 },
		{ header: L.hours, key: 'h', width: 10 },
		{ header: L.notes, key: 'no', width: 44 },
	]
	for (const r of workdaysData.rows) {
		wsWd.addRow({
			n: names.get(safeUserId(r)) || safeUserId(r) || '',
			d: formatDate(r.date),
			h: roundDecimal(r.hoursWorked, 2),
			no: buildWorkdayNotesForExport(r).slice(0, 2000),
		})
	}

	const wsLv = wb.addWorksheet(L.leaves.slice(0, 31))
	wsLv.columns = [
		{ header: L.name, key: 'n', width: 28 },
		{ header: L.from, key: 'f', width: 12 },
		{ header: L.to, key: 't', width: 12 },
		{ header: L.type, key: 'ty', width: 22 },
		{ header: L.days, key: 'd', width: 8 },
		{ header: L.status, key: 's', width: 22 },
	]
	for (const r of leavesData.rows) {
		wsLv.addRow({
			n: names.get(safeUserId(r)) || safeUserId(r) || '',
			f: formatDate(r.startDate),
			t: formatDate(r.endDate),
			ty: formatLeaveTypeForExport(leavesData.settings, r.type, ctx.locale),
			d: roundDecimal(r.daysRequested, 2),
			s: formatLeaveStatusForExport(r.status, ctx.locale),
		})
	}

	const wsTk = wb.addWorksheet(L.tasks.slice(0, 31))
	wsTk.columns = [
		{ header: L.taskTitle, key: 'ti', width: 36 },
		{ header: L.board, key: 'b', width: 24 },
		{ header: L.taskStatus, key: 's', width: 16 },
		{ header: L.dueDate, key: 'du', width: 12 },
		{ header: L.workPeriod, key: 'wp', width: 28 },
	]
	for (const t of tasksData.rows) {
		wsTk.addRow({
			ti: (t.title || '').slice(0, 500),
			b: tasksData.boardMap[t.boardId?.toString()] || '',
			s: formatTaskStatusLabel(t.status, ctx.locale),
			du: formatOptionalDate(t.dueDate),
			wp: formatTaskWorkPeriod(t).slice(0, 120),
		})
	}

	const buf = await wb.xlsx.writeBuffer()
	return Buffer.from(buf)
}

async function pdfBuffer(content) {
	const docDefinition = {
		pageSize: 'A4',
		pageMargins: [36, 44, 36, 44],
		defaultStyle: { font: 'OpenSans', fontSize: 8 },
		styles: {
			h: { fontSize: 12, bold: true, color: PDF_REPORT_THEME.navy },
		},
		content,
	}
	const pdfDoc = pdfMake.createPdf(docDefinition)
	return pdfDoc.getBuffer()
}
