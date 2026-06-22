import { isAdmin, isHR, isSupervisor } from './roleHelpers'

export const ACCEPTED_SENT_STATUSES = new Set([
	'status.accepted',
	'accepted',
	'status.sent',
	'sent',
])

export const PENDING_STATUSES = new Set(['status.pending', 'pending'])

export function extractLeaveRequestUserId(request) {
	if (!request?.userId) return null
	if (typeof request.userId === 'string') return request.userId
	if (request.userId._id) return request.userId._id.toString()
	if (typeof request.userId.toString === 'function') return request.userId.toString()
	return null
}

export function isAcceptedOrSentLeaveStatus(status) {
	return ACCEPTED_SENT_STATUSES.has(status)
}

export function isPendingLeaveStatus(status) {
	return PENDING_STATUSES.has(status)
}

function normalizeRoles(role) {
	if (!role) return []
	return Array.isArray(role) ? role : [role]
}

function toScopeSet(scopeUserIds) {
	if (!scopeUserIds) return null
	if (scopeUserIds instanceof Set) return scopeUserIds
	return new Set(scopeUserIds)
}

function isInScope(userId, scope) {
	if (!userId) return false
	if (!scope) return true
	if (scope.size === 0) return false
	return scope.has(userId)
}

/**
 * Łączy wnioski na kalendarze zespołowy (/all-leave-plans, grafik):
 * - accepted + sent z pełnego zespołu (accepted-leave-requests)
 * - pending wg roli z all-leave-requests (Admin/HR: wszyscy w zakresie; przełożony: podwładni z API; pracownik: tylko własne)
 * - opcjonalnie includeSupervisorOwnPending + ownPendingRequests (tylko /all-leave-plans; API nie zwraca własnych wniosków przełożonego)
 */
export function mergeCalendarLeaveRequests({
	acceptedSentRequests = [],
	allStatusRequests = [],
	role,
	currentUserId,
	scopeUserIds = null,
	includeSupervisorOwnPending = false,
	ownPendingRequests = [],
}) {
	const scope = toScopeSet(scopeUserIds)
	const roles = normalizeRoles(role)
	const currentUserIdStr = currentUserId?.toString() || null
	const isManagerLike =
		isAdmin(roles) || isHR(roles) || isSupervisor(roles)
	const isSupervisorOnly =
		isSupervisor(roles) && !isAdmin(roles) && !isHR(roles)

	const result = []
	const seen = new Set()

	const addRequest = (request) => {
		if (!request?._id) return
		const id = request._id.toString()
		if (seen.has(id)) return
		const uid = extractLeaveRequestUserId(request)
		if (!isInScope(uid, scope)) return
		seen.add(id)
		result.push(request)
	}

	for (const request of acceptedSentRequests) {
		if (!isAcceptedOrSentLeaveStatus(request?.status)) continue
		addRequest(request)
	}

	const pendingCandidates = (allStatusRequests || []).filter((request) =>
		isPendingLeaveStatus(request?.status)
	)

	if (isManagerLike) {
		for (const request of pendingCandidates) {
			addRequest(request)
		}
	} else if (currentUserIdStr) {
		for (const request of pendingCandidates) {
			if (extractLeaveRequestUserId(request) === currentUserIdStr) {
				addRequest(request)
			}
		}
	}

	if (includeSupervisorOwnPending && isSupervisorOnly && currentUserIdStr) {
		for (const request of ownPendingRequests || []) {
			if (!isPendingLeaveStatus(request?.status)) continue
			const requestUserId = extractLeaveRequestUserId(request)
			if (requestUserId && requestUserId !== currentUserIdStr) continue
			if (!requestUserId && !currentUserIdStr) continue
			addRequest(request)
		}
	}

	return result
}
