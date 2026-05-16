'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const {
	canViewSupervisorSettings,
	canManageSupervisorSettings,
} = require('../utils/supervisorAccessPolicy')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()
const supervisorA = new mongoose.Types.ObjectId()
const adminA = new mongoose.Types.ObjectId()

describe('supervisorAccessPolicy', () => {
	it('przełożony widzi własną konfigurację', () => {
		assert.equal(
			canViewSupervisorSettings({
				viewer: { _id: supervisorA, teamId: teamA, roles: ['Przełożony (Supervisor)'] },
				supervisor: { _id: supervisorA, teamId: teamA },
			}),
			true
		)
	})

	it('admin w zespole widzi config przełożonego', () => {
		assert.equal(
			canViewSupervisorSettings({
				viewer: { _id: adminA, teamId: teamA, roles: ['Admin'] },
				supervisor: { _id: supervisorA, teamId: teamA },
			}),
			true
		)
		assert.equal(
			canManageSupervisorSettings({
				viewer: { _id: adminA, teamId: teamA, roles: ['Admin'] },
				supervisor: { _id: supervisorA, teamId: teamA },
			}),
			true
		)
	})

	it('admin z innego zespołu nie widzi ani nie zmienia', () => {
		assert.equal(
			canViewSupervisorSettings({
				viewer: { _id: adminA, teamId: teamA, roles: ['Admin'] },
				supervisor: { _id: supervisorA, teamId: teamB },
			}),
			false
		)
		assert.equal(
			canManageSupervisorSettings({
				viewer: { _id: adminA, teamId: teamA, roles: ['Admin'] },
				supervisor: { _id: supervisorA, teamId: teamB },
			}),
			false
		)
	})

	it('worker nie zarządza configiem', () => {
		assert.equal(
			canManageSupervisorSettings({
				viewer: { _id: adminA, teamId: teamA, roles: ['Pracownik (Worker)'] },
				supervisor: { _id: supervisorA, teamId: teamA },
			}),
			false
		)
	})
})
