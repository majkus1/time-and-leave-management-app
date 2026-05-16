'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const { userHasAccessToChannel } = require('../utils/chatChannelAccess')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()
const userA = new mongoose.Types.ObjectId()
const userB = new mongoose.Types.ObjectId()

describe('chatChannelAccess.userHasAccessToChannel', () => {
	it('odrzuca kanał innego zespołu', () => {
		const channel = {
			_id: new mongoose.Types.ObjectId(),
			teamId: teamB,
			type: 'general',
			isTeamChannel: true,
			isActive: true,
		}
		const user = { _id: userA, teamId: teamA, department: [], roles: ['Admin'] }
		assert.equal(userHasAccessToChannel(channel, user), false)
	})

	it('zezwala na kanał zespołowy w tym samym teamId', () => {
		const channel = {
			teamId: teamA,
			type: 'general',
			isTeamChannel: true,
			isActive: true,
		}
		const user = { _id: userA, teamId: teamA, roles: ['Pracownik (Worker)'] }
		assert.equal(userHasAccessToChannel(channel, user), true)
	})

	it('kanał działowy tylko dla członków działu', () => {
		const channel = {
			teamId: teamA,
			type: 'department',
			departmentName: 'Sales',
			isActive: true,
		}
		assert.equal(
			userHasAccessToChannel(channel, {
				_id: userA,
				teamId: teamA,
				department: ['Sales'],
				roles: ['Pracownik (Worker)'],
			}),
			true
		)
		assert.equal(
			userHasAccessToChannel(channel, {
				_id: userB,
				teamId: teamA,
				department: ['IT'],
				roles: ['Admin'],
			}),
			false
		)
	})

	it('admin widzi custom general bez członkostwa (jak lista kanałów)', () => {
		const channel = {
			teamId: teamA,
			type: 'general',
			isTeamChannel: false,
			members: [userB],
			isActive: true,
		}
		const admin = { _id: userA, teamId: teamA, roles: ['Admin'], department: [] }
		assert.equal(userHasAccessToChannel(channel, admin), true)
	})

	it('private tylko dla members', () => {
		const channel = {
			teamId: teamA,
			type: 'private',
			members: [userB],
			isActive: true,
		}
		assert.equal(
			userHasAccessToChannel(channel, { _id: userA, teamId: teamA, roles: [] }),
			false
		)
		assert.equal(
			userHasAccessToChannel(channel, { _id: userB, teamId: teamA, roles: [] }),
			true
		)
	})
})
