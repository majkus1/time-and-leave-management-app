'use strict'

const { describe, it } = require('node:test')
const assert = require('node:assert/strict')
const mongoose = require('mongoose')

const {
	canUserAccessBoard,
	getUserDepartments,
} = require('../utils/boardAccessPolicy')

const teamA = new mongoose.Types.ObjectId()
const teamB = new mongoose.Types.ObjectId()
const userA = new mongoose.Types.ObjectId()
const userB = new mongoose.Types.ObjectId()

const baseUserA = {
	_id: userA,
	teamId: teamA,
	department: ['Sales'],
	roles: ['Pracownik (Worker)'],
}

const adminUserA = {
	...baseUserA,
	roles: ['Admin'],
}

function board(overrides = {}) {
	return {
		teamId: teamA,
		isActive: true,
		isTeamBoard: false,
		type: 'custom',
		members: [userA],
		departmentName: undefined,
		...overrides,
	}
}

describe('boardAccess.canUserAccessBoard', () => {
	it('odrzuca tablicę innego zespołu (tenant)', () => {
		const b = board({ teamId: teamB, isTeamBoard: true })
		assert.equal(canUserAccessBoard(b, baseUserA), false)
	})

	it('zezwala na tablicę zespołową w tym samym teamId', () => {
		const b = board({ isTeamBoard: true, type: 'team', members: [] })
		assert.equal(canUserAccessBoard(b, baseUserA), true)
	})

	it('zezwala na tablicę działową gdy user jest w dziale', () => {
		const b = board({
			type: 'department',
			departmentName: 'Sales',
			members: [],
			isTeamBoard: false,
		})
		assert.equal(canUserAccessBoard(b, baseUserA), true)
	})

	it('odrzuca tablicę działową gdy user nie jest w dziale', () => {
		const b = board({
			type: 'department',
			departmentName: 'IT',
			members: [],
			isTeamBoard: false,
		})
		assert.equal(canUserAccessBoard(b, baseUserA), false)
	})

	it('zezwala na tablicę custom gdy user jest w members', () => {
		const b = board({ type: 'custom', members: [userA], isTeamBoard: false })
		assert.equal(canUserAccessBoard(b, baseUserA), true)
	})

	it('odrzuca tablicę custom gdy user nie jest w members', () => {
		const b = board({ type: 'custom', members: [userB], isTeamBoard: false })
		assert.equal(canUserAccessBoard(b, baseUserA), false)
	})

	it('admin ma dostęp do każdej tablicy w swoim zespole', () => {
		const b = board({ type: 'custom', members: [userB], isTeamBoard: false })
		assert.equal(canUserAccessBoard(b, adminUserA, { isAdmin: true }), true)
	})

	it('odrzuca nieaktywną tablicę', () => {
		const b = board({ isActive: false, isTeamBoard: true })
		assert.equal(canUserAccessBoard(b, baseUserA), false)
	})

	it('getUserDepartments normalizuje pojedynczy string', () => {
		assert.deepEqual(getUserDepartments({ department: 'HR' }), ['HR'])
	})
})
