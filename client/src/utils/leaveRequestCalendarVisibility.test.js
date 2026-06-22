import { describe, expect, it } from 'vitest'
import { mergeCalendarLeaveRequests } from './leaveRequestCalendarVisibility'

const req = (id, userId, status) => ({
	_id: id,
	userId,
	startDate: '2026-06-01',
	endDate: '2026-06-03',
	status,
})

describe('mergeCalendarLeaveRequests', () => {
	const acceptedTeam = [
		req('a1', 'u1', 'status.accepted'),
		req('a2', 'u2', 'status.sent'),
		req('a3', 'u3', 'status.accepted'),
	]
	const allStatuses = [
		...acceptedTeam,
		req('p1', 'u1', 'status.pending'),
		req('p2', 'u2', 'status.pending'),
		req('p3', 'u3', 'status.pending'),
	]

	it('supervisor sees full team accepted/sent and pending only from allStatus (subordinates)', () => {
		const subordinatePending = [req('p2', 'u2', 'status.pending')]
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: subordinatePending,
			role: 'Przełożony (Supervisor)',
			currentUserId: 'sup1',
		})
		expect(merged.map((r) => r._id).sort()).toEqual(['a1', 'a2', 'a3', 'p2'].sort())
	})

	it('admin sees full team accepted/sent and all pending', () => {
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: allStatuses,
			role: 'Admin',
			currentUserId: 'admin1',
		})
		expect(merged.map((r) => r._id).sort()).toEqual(['a1', 'a2', 'a3', 'p1', 'p2', 'p3'].sort())
	})

	it('worker sees full team accepted/sent and only own pending', () => {
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: allStatuses,
			role: 'Pracownik (Worker)',
			currentUserId: 'u1',
		})
		expect(merged.map((r) => r._id).sort()).toEqual(['a1', 'a2', 'a3', 'p1'].sort())
	})

	it('scopeUserIds limits pending for admin to schedule members', () => {
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: allStatuses,
			role: 'Admin',
			currentUserId: 'admin1',
			scopeUserIds: new Set(['u1', 'u2']),
		})
		expect(merged.map((r) => r._id).sort()).toEqual(['a1', 'a2', 'p1', 'p2'].sort())
	})

	it('supervisor on all-leave-plans can include own pending when flag is set', () => {
		const subordinatePending = [req('p2', 'u2', 'status.pending')]
		const ownPending = [req('pSup', 'sup1', 'status.pending')]
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: subordinatePending,
			role: 'Przełożony (Supervisor)',
			currentUserId: 'sup1',
			includeSupervisorOwnPending: true,
			ownPendingRequests: ownPending,
		})
		expect(merged.map((r) => r._id).sort()).toEqual(['a1', 'a2', 'a3', 'p2', 'pSup'].sort())
	})

	it('supervisor on schedule does not include own pending without flag', () => {
		const ownPending = [req('pSup', 'sup1', 'status.pending')]
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: [req('p2', 'u2', 'status.pending')],
			role: 'Przełożony (Supervisor)',
			currentUserId: 'sup1',
			ownPendingRequests: ownPending,
		})
		expect(merged.map((r) => r._id).sort()).toEqual(['a1', 'a2', 'a3', 'p2'].sort())
	})

	it('empty scopeUserIds shows no requests (active filter with no people)', () => {
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: allStatuses,
			role: 'Admin',
			currentUserId: 'admin1',
			scopeUserIds: new Set(),
		})
		expect(merged).toEqual([])
	})

	it('supervisor own pending respects scope when flag is set', () => {
		const ownPending = [req('pSup', 'sup1', 'status.pending')]
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: acceptedTeam,
			allStatusRequests: [],
			role: 'Przełożony (Supervisor)',
			currentUserId: 'sup1',
			scopeUserIds: new Set(['u2']),
			includeSupervisorOwnPending: true,
			ownPendingRequests: ownPending,
		})
		expect(merged.map((r) => r._id)).toEqual(['a2'])
	})

	it('deduplicates when same id appears in both sources', () => {
		const duplicate = req('a1', 'u1', 'status.accepted')
		const merged = mergeCalendarLeaveRequests({
			acceptedSentRequests: [duplicate],
			allStatusRequests: [duplicate],
			role: 'Admin',
			currentUserId: 'admin1',
		})
		expect(merged).toHaveLength(1)
	})
})
