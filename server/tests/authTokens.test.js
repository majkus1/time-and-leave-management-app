'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const { buildSessionTokenPayload } = require('../utils/authTokens')

describe('authTokens.buildSessionTokenPayload', () => {
	it('buduje payload z pól usera', () => {
		const userId = new mongoose.Types.ObjectId()
		const teamId = new mongoose.Types.ObjectId()
		const payload = buildSessionTokenPayload({
			_id: userId,
			teamId,
			roles: ['Admin', 'HR'],
			username: 'a@b.c',
			isTeamAdmin: true,
		})
		assert.equal(String(payload.userId), String(userId))
		assert.equal(String(payload.teamId), String(teamId))
		assert.deepEqual(payload.roles, ['Admin', 'HR'])
		assert.equal(payload.username, 'a@b.c')
		assert.equal(payload.isTeamAdmin, true)
	})

	it('zwraca null gdy brak teamId', () => {
		assert.equal(buildSessionTokenPayload({ _id: new mongoose.Types.ObjectId() }), null)
	})
})
