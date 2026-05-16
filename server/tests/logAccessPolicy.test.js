'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const {
	buildTeamScopedLogFilter,
	canAdminViewTargetUserLogs,
	canViewLogsAsAdmin,
	isSuperAdminUser,
} = require('../utils/logAccessPolicy')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()
const user1 = new mongoose.Types.ObjectId()
const user2 = new mongoose.Types.ObjectId()

describe('logAccessPolicy', () => {
	it('super admin ma pusty filtr (wszystkie logi)', () => {
		assert.deepEqual(buildTeamScopedLogFilter({ isSuperAdmin: true, teamUserIds: [user1] }), {})
	})

	it('admin zespołu filtruje po userach z teamu', () => {
		const filter = buildTeamScopedLogFilter({ isSuperAdmin: false, teamUserIds: [user1, user2] })
		assert.deepEqual(filter, { user: { $in: [user1, user2] } })
	})

	it('admin bez userów w zespole dostaje pusty wynik', () => {
		const filter = buildTeamScopedLogFilter({ isSuperAdmin: false, teamUserIds: [] })
		assert.deepEqual(filter, { user: { $in: [] } })
	})

	it('admin nie widzi logów usera z innego zespołu', () => {
		assert.equal(
			canAdminViewTargetUserLogs({
				isSuperAdmin: false,
				viewerTeamId: teamA,
				targetTeamId: teamB,
			}),
			false
		)
	})

	it('admin widzi logi usera ze swojego zespołu', () => {
		assert.equal(
			canAdminViewTargetUserLogs({
				isSuperAdmin: false,
				viewerTeamId: teamA,
				targetTeamId: teamA,
			}),
			true
		)
	})

	it('super admin widzi dowolnego usera', () => {
		assert.equal(
			canAdminViewTargetUserLogs({
				isSuperAdmin: true,
				viewerTeamId: teamA,
				targetTeamId: teamB,
			}),
			true
		)
	})

	it('tylko Admin lub super admin może przeglądać logi', () => {
		assert.equal(canViewLogsAsAdmin({ roles: ['Admin'] }), true)
		assert.equal(canViewLogsAsAdmin({ roles: ['HR'] }), false)
		assert.equal(isSuperAdminUser({ username: 'michalipka1@gmail.com' }), true)
	})
})
