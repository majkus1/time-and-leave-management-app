'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const { canViewUserTimesheet } = require('../utils/timesheetAccessPolicy')

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
