const test = require('node:test')
const assert = require('node:assert/strict')
const { formatTaskScheduleForNotification } = require('../utils/taskScheduleTime')

const tPl = (key, opts = {}) => {
	const map = {
		'email.task.scheduleDeadline': '{{date}}',
		'email.task.scheduleDeadlineWithTime': '{{date}}, {{time}}',
		'email.task.schedulePeriod': '{{start}} – {{end}}',
		'email.task.schedulePeriodWithTime': '{{start}} – {{end}} ({{startTime}} – {{endTime}})',
	}
	let out = map[key] || key
	for (const [k, v] of Object.entries(opts)) {
		out = out.replaceAll(`{{${k}}}`, String(v))
	}
	return out
}
tPl.language = 'pl'

test('formatTaskScheduleForNotification includes due time', () => {
	const text = formatTaskScheduleForNotification(
		{ dueDate: new Date('2026-07-13T12:00:00'), dueTime: '14:00' },
		tPl,
		'pl-PL',
	)
	assert.match(text, /13/)
	assert.match(text, /14/)
})

test('formatTaskScheduleForNotification returns null without schedule', () => {
	assert.equal(formatTaskScheduleForNotification({}, tPl, 'pl-PL'), null)
})
