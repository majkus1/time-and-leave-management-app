const test = require('node:test')
const assert = require('node:assert/strict')
const {
	evaluateLeaveApproval,
	evaluateTimesheetView,
	evaluateScheduleManage,
	supervisorHasNoScope,
	buildDefaultSupervisorConfig,
	DEFAULT_SUPERVISOR_PERMISSIONS,
} = require('../utils/supervisorScope')

const SUP = { _id: 'sup', teamId: 't', roles: ['Przełożony (Supervisor)'], department: ['Magazyn'] }
const inDept = { _id: 'e1', department: ['Magazyn'] }
const inDept2 = { _id: 'e2', department: ['Magazyn', 'Biuro'] }
const outside = { _id: 'e3', department: ['Biuro'] }
const noDept = { _id: 'e4', department: [] }

const cfg = (permissions = {}, selectedEmployees = []) => ({ permissions: { ...DEFAULT_SUPERVISOR_PERMISSIONS, ...permissions }, selectedEmployees })

test('brak konfiguracji = domyślna: tylko własny dział (nie cały zespół)', () => {
	for (const evaluate of [evaluateLeaveApproval, evaluateTimesheetView]) {
		assert.equal(evaluate(null, SUP, inDept), true)
		assert.equal(evaluate(null, SUP, inDept2), true)
		assert.equal(evaluate(null, SUP, outside), false)
		assert.equal(evaluate(null, SUP, noDept), false)
	}
})

test('przełożony bez działu i bez konfiguracji nie ma nikogo', () => {
	const sup = { ...SUP, department: [] }
	assert.equal(evaluateTimesheetView(null, sup, inDept), false)
	assert.equal(evaluateLeaveApproval(null, sup, outside), false)
	assert.equal(supervisorHasNoScope(null, sup), true)
	assert.equal(supervisorHasNoScope(cfg({}, ['e3']), sup), false)
	assert.equal(supervisorHasNoScope(null, SUP), false)
})

test('wybrani pracownicy spoza działu: dostęp; lista niepusta działa jako odznaczenia w dziale', () => {
	const c = cfg({}, ['e3', 'e1'])
	assert.equal(evaluateTimesheetView(c, SUP, outside), true) // wybrany spoza działu
	assert.equal(evaluateTimesheetView(c, SUP, inDept), true) // z działu i zaznaczony
	assert.equal(evaluateTimesheetView(c, SUP, inDept2), false) // z działu, ale odznaczony
})

test('wybrani bez uprawnienia do działu: tylko wybrani', () => {
	const c = cfg({ canViewTimesheetsDepartment: false }, ['e3'])
	assert.equal(evaluateTimesheetView(c, SUP, outside), true)
	assert.equal(evaluateTimesheetView(c, SUP, inDept), false)
})

test('wyłączony przełącznik główny odbiera cały zakres danego uprawnienia, pozostałe działają osobno', () => {
	const c = cfg({ canViewTimesheets: false }, ['e3'])
	assert.equal(evaluateTimesheetView(c, SUP, inDept), false)
	assert.equal(evaluateTimesheetView(c, SUP, outside), false)
	assert.equal(evaluateLeaveApproval(c, SUP, outside), true) // urlopy niezależne od ewidencji (wybrany e3)
	assert.equal(evaluateLeaveApproval(cfg({ canViewTimesheets: false }), SUP, inDept), true)
})

test('Admin i HR — zawsze; rola bez przełożonego — nigdy', () => {
	for (const roles of [['Admin'], ['HR'], ['HR', 'Przełożony (Supervisor)']]) {
		assert.equal(evaluateTimesheetView(cfg({ canViewTimesheets: false }), { ...SUP, roles }, outside), true)
	}
	assert.equal(evaluateLeaveApproval(null, { ...SUP, roles: ['Pracownik (Worker)'] }, inDept), false)
})

test('stare dokumenty bez części kluczy: brakujące uprawnienia = domyślne (włączone)', () => {
	const partial = { permissions: { canApproveLeaves: false }, selectedEmployees: [] }
	assert.equal(evaluateLeaveApproval(partial, SUP, inDept), false)
	assert.equal(evaluateTimesheetView(partial, SUP, inDept), true)
})

test('grafik: działowy tylko własnego działu, niestandardowy tylko jako członek, zespołowy nigdy', () => {
	assert.equal(evaluateScheduleManage(null, SUP, { type: 'department', departmentName: 'Magazyn' }), true)
	assert.equal(evaluateScheduleManage(null, SUP, { type: 'department', departmentName: 'Biuro' }), false)
	assert.equal(evaluateScheduleManage(null, SUP, { type: 'custom', members: ['sup', 'e1'] }), true)
	assert.equal(evaluateScheduleManage(null, SUP, { type: 'custom', members: ['e1'] }), false)
	assert.equal(evaluateScheduleManage(null, SUP, { type: 'team' }), false)
	assert.equal(evaluateScheduleManage(cfg({ canManageSchedule: false }), SUP, { type: 'department', departmentName: 'Magazyn' }), false)
	assert.equal(evaluateScheduleManage(null, SUP), true)
	assert.equal(evaluateScheduleManage(null, { ...SUP, roles: ['Admin'] }, { type: 'team' }), true)
})

test('buildDefaultSupervisorConfig: wszystkie uprawnienia, pusta lista wybranych', () => {
	const d = buildDefaultSupervisorConfig({ _id: 'sup', teamId: 't' })
	assert.deepEqual(d.permissions, { ...DEFAULT_SUPERVISOR_PERMISSIONS })
	assert.deepEqual(d.selectedEmployees, [])
	assert.equal(d.teamId, 't')
})
