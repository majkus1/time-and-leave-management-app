'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const {
	canViewUserVacationDays,
	canManageTeamLeaveRequest,
	isSameTeam,
	isSelfUser,
	hasAdminOrHrRole,
	formatVacationDaysPayload,
} = require('../utils/vacationAccessPolicy')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()
const userA = new mongoose.Types.ObjectId()
const userB = new mongoose.Types.ObjectId()

describe('vacationAccessPolicy', () => {
	it('pracownik widzi tylko siebie', () => {
		assert.equal(
			canViewUserVacationDays({
				isSelf: true,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorApprove: false,
			}),
			true
		)
		assert.equal(
			canViewUserVacationDays({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorApprove: false,
			}),
			false
		)
	})

	it('admin/HR w zespole widzi innych', () => {
		assert.equal(
			canViewUserVacationDays({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: true,
				canSupervisorApprove: false,
			}),
			true
		)
	})

	it('przełożony z uprawnieniem widzi podwładnego', () => {
		assert.equal(
			canViewUserVacationDays({
				isSelf: false,
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorApprove: true,
			}),
			true
		)
	})

	it('obcy zespół — brak dostępu (warstwa wyżej zwraca 404)', () => {
		assert.equal(isSameTeam(teamA, teamB), false)
		assert.equal(
			canViewUserVacationDays({
				isSelf: false,
				isSameTeam: false,
				isAdminOrHr: true,
				canSupervisorApprove: true,
			}),
			false
		)
	})

	it('isSelfUser i hasAdminOrHrRole', () => {
		assert.equal(isSelfUser(userA, userA), true)
		assert.equal(isSelfUser(userA, userB), false)
		assert.equal(hasAdminOrHrRole({ roles: ['Admin'] }), true)
		assert.equal(hasAdminOrHrRole({ roles: ['HR'] }), true)
		assert.equal(hasAdminOrHrRole({ roles: ['Pracownik (Worker)'] }), false)
	})

	it('canManageTeamLeaveRequest — worker nie zarządza wnioskami innych', () => {
		assert.equal(
			canManageTeamLeaveRequest({
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorApprove: false,
			}),
			false
		)
	})

	it('canManageTeamLeaveRequest — admin/HR/przełożony w zespole', () => {
		assert.equal(
			canManageTeamLeaveRequest({
				isSameTeam: true,
				isAdminOrHr: true,
				canSupervisorApprove: false,
			}),
			true
		)
		assert.equal(
			canManageTeamLeaveRequest({
				isSameTeam: true,
				isAdminOrHr: false,
				canSupervisorApprove: true,
			}),
			true
		)
	})

	it('canManageTeamLeaveRequest — obcy zespół', () => {
		assert.equal(
			canManageTeamLeaveRequest({
				isSameTeam: false,
				isAdminOrHr: true,
				canSupervisorApprove: true,
			}),
			false
		)
	})

	it('formatVacationDaysPayload — leaveform.option1 fallback', () => {
		const payload = formatVacationDaysPayload({
			vacationDays: null,
			leaveTypeDays: { 'leaveform.option1': 20 },
		})
		assert.equal(payload.vacationDays, 20)
	})
})
