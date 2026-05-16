'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const {
	canViewTeamUserProfile,
	canManageTeamUser,
	isSuperAdminUser,
} = require('../utils/userProfileAccessPolicy')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()
const userA = new mongoose.Types.ObjectId()
const userB = new mongoose.Types.ObjectId()

describe('userProfileAccessPolicy', () => {
	it('admin z innego zespołu nie widzi profilu', () => {
		assert.equal(
			canViewTeamUserProfile({
				viewer: { _id: userA, teamId: teamA, roles: ['Admin'], username: 'a@x.pl' },
				targetUserId: userB,
				targetUser: { _id: userB, teamId: teamB },
			}),
			false
		)
	})

	it('HR w tym samym zespole widzi profil', () => {
		assert.equal(
			canViewTeamUserProfile({
				viewer: { _id: userA, teamId: teamA, roles: ['HR'], username: 'hr@x.pl' },
				targetUserId: userB,
				targetUser: { _id: userB, teamId: teamA },
			}),
			true
		)
	})

	it('super admin może widzieć profil z innego zespołu', () => {
		assert.equal(
			canViewTeamUserProfile({
				viewer: { _id: userA, teamId: teamA, roles: ['Admin'], username: 'michalipka1@gmail.com' },
				targetUserId: userB,
				targetUser: { _id: userB, teamId: teamB },
			}),
			true
		)
		assert.equal(isSuperAdminUser({ username: 'michalipka1@gmail.com' }), true)
	})

	it('canManageTeamUser wymaga tego samego teamId', () => {
		assert.equal(
			canManageTeamUser({
				viewer: { teamId: teamA },
				targetUser: { teamId: teamB },
			}),
			false
		)
		assert.equal(
			canManageTeamUser({
				viewer: { teamId: teamA },
				targetUser: { teamId: teamA },
			}),
			true
		)
	})
})
