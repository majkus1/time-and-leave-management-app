'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const { canViewUserTimesheet } = require('../utils/timesheetAccessPolicy')
const { canWriteUserTimesheet } = require('../utils/timesheetWriteAccessPolicy')

describe('timesheetAccess.canViewUserTimesheet', () => {
	it('pracownik widzi tylko siebie', () => {
		assert.equal(
			canViewUserTimesheet({
				isSelf: true,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorView: false,
			}),
			true
		)
		assert.equal(
			canViewUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorView: false,
			}),
			false
		)
	})

	it('admin/HR w zespole widzi innych', () => {
		assert.equal(
			canViewUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: true,
				canSupervisorView: false,
			}),
			true
		)
	})

	it('przełożony z uprawnieniem widzi podwładnego', () => {
		assert.equal(
			canViewUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorView: true,
			}),
			true
		)
	})

	it('obcy zespół — brak dostępu', () => {
		assert.equal(
			canViewUserTimesheet({
				isSelf: false,
				isSameTeam: false,
				isAdminOrHr: true,
				canSupervisorView: true,
			}),
			false
		)
	})
})

describe('timesheetAccess.canWriteUserTimesheet', () => {
	it('pracownik może edytować tylko własną ewidencję', () => {
		assert.equal(
			canWriteUserTimesheet({
				isSelf: true,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorWrite: false,
				managedWorkdayEntriesEnabled: false,
				targetHasAppAccess: true,
			}),
			true
		)
	})

	it('admin/HR może dopisać czas tylko pracownikowi bez dostępu i tylko po włączeniu opcji', () => {
		assert.equal(
			canWriteUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: true,
				canSupervisorWrite: false,
				managedWorkdayEntriesEnabled: true,
				targetHasAppAccess: false,
			}),
			true
		)
		assert.equal(
			canWriteUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: true,
				canSupervisorWrite: false,
				managedWorkdayEntriesEnabled: false,
				targetHasAppAccess: false,
			}),
			false
		)
		assert.equal(
			canWriteUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: true,
				canSupervisorWrite: false,
				managedWorkdayEntriesEnabled: true,
				targetHasAppAccess: true,
			}),
			false
		)
	})

	it('przełożony z zakresem może dopisać czas pracownikowi bez dostępu ze swojego zespołu', () => {
		assert.equal(
			canWriteUserTimesheet({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorWrite: true,
				managedWorkdayEntriesEnabled: true,
				targetHasAppAccess: false,
			}),
			true
		)
		assert.equal(
			canWriteUserTimesheet({
				isSelf: false,
				isSameTeam: false,
				isAdminOrHr: true,
				canSupervisorWrite: true,
				managedWorkdayEntriesEnabled: true,
				targetHasAppAccess: false,
			}),
			false
		)
	})
})
