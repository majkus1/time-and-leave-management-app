'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const {
	resolveScopedTeamId,
	assertCanMutateTeamResource,
} = require('../utils/teamScopeAccess')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()

describe('teamScopeAccess.resolveScopedTeamId', () => {
	it('bez requested zwraca zespół widzącego', () => {
		const r = resolveScopedTeamId({
			viewer: { teamId: teamA, username: 'a@x.pl' },
		})
		assert.equal(r.ok, true)
		assert.equal(String(r.teamId), String(teamA))
	})

	it('obcy teamId → 404 (nie 403)', () => {
		const r = resolveScopedTeamId({
			viewer: { teamId: teamA, username: 'a@x.pl' },
			requestedTeamId: teamB,
		})
		assert.equal(r.ok, false)
		assert.equal(r.status, 404)
	})

	it('super admin może wybrać obcy teamId', () => {
		const r = resolveScopedTeamId({
			viewer: { teamId: teamA, username: 'michalipka1@gmail.com' },
			requestedTeamId: teamB,
		})
		assert.equal(r.ok, true)
		assert.equal(String(r.teamId), String(teamB))
	})

	it('ten sam teamId w query jest dozwolony', () => {
		const r = resolveScopedTeamId({
			viewer: { teamId: teamA, username: 'a@x.pl' },
			requestedTeamId: teamA,
		})
		assert.equal(r.ok, true)
		assert.equal(String(r.teamId), String(teamA))
	})
})

describe('teamScopeAccess.assertCanMutateTeamResource', () => {
	it('Worker nie może mutować', () => {
		const r = assertCanMutateTeamResource({
			teamId: teamA,
			roles: ['Pracownik (Worker)'],
			username: 'w@x.pl',
		})
		assert.equal(r.ok, false)
		assert.equal(r.status, 403)
	})

	it('Admin może mutować', () => {
		const r = assertCanMutateTeamResource({
			teamId: teamA,
			roles: ['Admin'],
			username: 'a@x.pl',
		})
		assert.equal(r.ok, true)
	})

	it('super admin bez roli Admin może mutować', () => {
		const r = assertCanMutateTeamResource({
			teamId: teamA,
			roles: ['HR'],
			username: 'michalipka1@gmail.com',
		})
		assert.equal(r.ok, true)
	})
})
