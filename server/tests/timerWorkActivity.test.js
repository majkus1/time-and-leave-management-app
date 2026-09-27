const test = require('node:test')
const assert = require('node:assert/strict')
const { groupTimerSessions, getTimerActivitySnapshot } = require('../utils/timerWorkActivity')

const minutes = (start, end) => Math.round((new Date(end) - new Date(start)) / 60000)
const settings = { workActivities: [{ id: 'mont', name: 'Montaż', trackQuantity: true, unit: 'szt', isEnabled: true }] }

test('wydajność grupy tylko z godzin sesji z podaną ilością', () => {
	const sessions = [
		{ activityId: 'mont', activityName: 'Montaż', unit: 'szt', quantity: 20, startTime: '2026-09-15T06:00:00Z', endTime: '2026-09-15T08:00:00Z' },
		// Sesja z QR bez podanej ilości — liczy się do czasu, nie do wydajności
		{ activityId: 'mont', activityName: '', unit: '', quantity: null, startTime: '2026-09-15T09:00:00Z', endTime: '2026-09-15T10:00:00Z' },
	]
	const group = Object.values(groupTimerSessions(sessions, settings, minutes))[0]
	assert.equal(group.totalMinutes, 180)
	assert.equal(group.quantity, 20)
	assert.equal(group.measuredHours, 2)
	assert.equal(group.efficiency, 10)
	assert.equal(group.activityName, 'Montaż')
})

test('ilość 0 to pomiar (0 szt/h), brak ilości — brak wydajności', () => {
	const zero = Object.values(groupTimerSessions([
		{ activityId: 'mont', quantity: 0, startTime: '2026-09-15T06:00:00Z', endTime: '2026-09-15T07:00:00Z' },
	], settings, minutes))[0]
	assert.equal(zero.measuredHours, 1)
	assert.equal(zero.efficiency, null)
	const none = Object.values(groupTimerSessions([
		{ activityId: 'mont', quantity: null, startTime: '2026-09-15T06:00:00Z', endTime: '2026-09-15T07:00:00Z' },
	], settings, minutes))[0]
	assert.equal(none.measuredHours, 0)
	assert.equal(none.efficiency, null)
})

test('snapshot czynności: nazwa, jednostka i ilość (używany też przy wyjściu skanem QR)', async () => {
	const Settings = { getSettings: async () => settings }
	const snap = await getTimerActivitySnapshot(Settings, 'team', 'mont', 12)
	assert.deepEqual(snap, { activityName: 'Montaż', activityNameEn: '', activityGroup: '', quantity: 12, unit: 'szt' })
	const noQty = await getTimerActivitySnapshot(Settings, 'team', 'mont', null)
	assert.equal(noQty.quantity, null)
	assert.equal(noQty.unit, 'szt')
	assert.equal((await getTimerActivitySnapshot(Settings, 'team', 'mont', -1)).error, 'INVALID_QUANTITY')
})
