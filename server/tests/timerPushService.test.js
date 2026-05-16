const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const { buildTimerPushPayload } = require('../utils/timerPushPayload')

describe('timerPushPayload', () => {
	it('builds live timer payload on start', () => {
		const startTime = new Date('2026-05-16T08:00:00.000Z')
		const payload = buildTimerPushPayload('started', {
			startTime,
			isBreak: false,
			totalBreakTime: 0,
			isOvertime: false,
			totalOvertimeTime: 0,
			workDescription: 'Projekt A',
		}, 'pl')

		assert.equal(payload.type, 'timer')
		assert.equal(payload.event, 'started')
		assert.equal(payload.timerState.active, true)
		assert.ok(payload.body.includes('Projekt A'))
	})

	it('builds stopped payload without timer state', () => {
		const payload = buildTimerPushPayload('stopped', null, 'en')
		assert.equal(payload.event, 'stopped')
		assert.equal(payload.timerState, null)
		assert.ok(payload.body.includes('ended'))
	})
})
