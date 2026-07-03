import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { mergeCalendarLeaveRequests } from '../utils/leaveRequestCalendarVisibility'

const ALL_LEAVE_REQUESTS_QUERY_KEY = ['leaveRequests', 'all']
const PENDING_STATUSES = new Set(['status.pending', 'pending'])
const LEAVE_REQUESTS_UPDATED_EVENT = 'leave-requests-updated'
const SCHEDULE_UPDATED_EVENT = 'schedule-updated'

const normalizeUserId = (value) => {
	if (!value) return null
	if (typeof value === 'string') return value
	if (value?._id) return value._id.toString()
	if (typeof value?.toString === 'function') return value.toString()
	return null
}

const fetchAllLeaveRequests = async () => {
	const response = await axios.get(`${API_URL}/api/leaveworks/all-leave-requests`, {
		withCredentials: true,
	})
	return response.data
}

const extractRequestUserId = (request) => {
	if (!request?.userId) return null
	if (typeof request.userId === 'string') return request.userId
	if (request.userId?._id) return request.userId._id.toString()
	if (typeof request.userId?.toString === 'function') return request.userId.toString()
	return null
}

// Query hook - pobieranie własnych wniosków urlopowych (current user)
export const useOwnLeaveRequests = () => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket) return

		const handleLeaveRequestsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'own'] })
			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'accepted'] })
			queryClient.invalidateQueries({ queryKey: ['vacation', 'days', 'own'] })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		}
	}, [socket, queryClient])

	return useQuery({
		queryKey: ['leaveRequests', 'own'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/requlea/ownrequestleave`, {
				withCredentials: true,
			})
			return response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
		},
		staleTime: 1 * 60 * 1000, // 1 minuta
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie wniosków urlopowych użytkownika
export const useUserLeaveRequests = (userId) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket || !userId) return

		const normalizedUserId = String(userId)
		const handleLeaveRequestsUpdated = (payload) => {
			const eventUserId = normalizeUserId(payload?.userId)
			if (eventUserId && eventUserId !== normalizedUserId) return

			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'user', userId] })
			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'accepted', 'user', userId] })
			queryClient.invalidateQueries({ queryKey: ['vacation', 'days', userId] })
		}

		const handleScheduleUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'user', userId] })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		socket.on(SCHEDULE_UPDATED_EVENT, handleScheduleUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
			socket.off(SCHEDULE_UPDATED_EVENT, handleScheduleUpdated)
		}
	}, [socket, queryClient, userId])

	return useQuery({
		queryKey: ['leaveRequests', 'user', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leaveworks/leave-requests/${userId}`, {
				withCredentials: true,
			})
			return response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
		},
		enabled: !!userId,
		staleTime: 1 * 60 * 1000, // 1 minuta
		cacheTime: 5 * 60 * 1000,
	})
}

export const useVisibleLeaveUsers = ({ enabled = true } = {}) => {
	return useQuery({
		queryKey: ['leaveRequests', 'visibleUsers'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leaveworks/visible-users`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled,
		staleTime: 2 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie zaakceptowanych wniosków
export const useAcceptedLeaveRequests = ({ enabled = true } = {}) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!enabled || !socket) return

		const handleLeaveRequestsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'accepted'] })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		}
	}, [enabled, socket, queryClient])

	return useQuery({
		queryKey: ['leaveRequests', 'accepted'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leaveworks/user-accepted-leave-requests`, {
				withCredentials: true,
			})
			return response.data.filter(
				(request) => request.startDate && request.endDate && request.userId
			)
		},
		enabled,
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
		placeholderData: (previousData) => previousData,
	})
}

// Query hook - pobieranie zaakceptowanych/wysłanych wniosków całego zespołu (kalendarze: /all-leave-plans, grafik)
export const useAllAcceptedLeaveRequests = () => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket) return

		const handleLeaveRequestsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'accepted', 'all'] })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		}
	}, [socket, queryClient])

	return useQuery({
		queryKey: ['leaveRequests', 'accepted', 'all'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leaveworks/accepted-leave-requests`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - wszystkie statusy; workflow /leave-list, badge pending, warstwa pending na kalendarzach
export const useAllLeaveRequests = () => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket) return

		const handleLeaveRequestsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ALL_LEAVE_REQUESTS_QUERY_KEY })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		}
	}, [socket, queryClient])

	return useQuery({
		queryKey: ALL_LEAVE_REQUESTS_QUERY_KEY,
		queryFn: fetchAllLeaveRequests,
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

/** Asystent dostępności i kalendarze — accepted/sent całego zespołu + pending wg roli. */
export const useAvailabilityCheckerLeaveRequests = (scopeUserIds = null) => {
	const { role, userId } = useAuth()
	const { data: acceptedSentRequests = [] } = useAllAcceptedLeaveRequests()
	const { data: allStatusRequests = [] } = useAllLeaveRequests()

	return useMemo(
		() =>
			mergeCalendarLeaveRequests({
				acceptedSentRequests,
				allStatusRequests,
				role,
				currentUserId: userId,
				scopeUserIds,
			}),
		[acceptedSentRequests, allStatusRequests, role, userId, scopeUserIds]
	)
}

// Query hook - podsumowanie oczekujących wniosków (łącznie + per użytkownik)
export const usePendingLeaveRequestsSummary = ({ enabled = true } = {}) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()
	const query = useQuery({
		queryKey: ALL_LEAVE_REQUESTS_QUERY_KEY,
		queryFn: fetchAllLeaveRequests,
		enabled,
		staleTime: 30 * 1000,
		cacheTime: 5 * 60 * 1000,
		refetchOnMount: 'always',
		select: (requests = []) => {
			const pendingByUser = {}
			let totalPending = 0

			for (const request of requests) {
				if (!PENDING_STATUSES.has(request?.status)) continue

				totalPending += 1
				const requestUserId = extractRequestUserId(request)
				if (!requestUserId) continue

				pendingByUser[requestUserId] = (pendingByUser[requestUserId] || 0) + 1
			}

			return {
				totalPending,
				pendingByUser,
			}
		},
	})

	useEffect(() => {
		if (!enabled || !socket) return

		const handleLeaveRequestsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ALL_LEAVE_REQUESTS_QUERY_KEY })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		}
	}, [enabled, socket, queryClient])

	return query
}

// Query hook - pobieranie zaakceptowanych wniosków konkretnego użytkownika
export const useUserAcceptedLeaveRequests = (userId, { enabled: queryEnabled = true } = {}) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()
	const enabled = queryEnabled && !!userId

	useEffect(() => {
		if (!enabled || !socket || !userId) return

		const normalizedUserId = String(userId)
		const handleLeaveRequestsUpdated = (payload) => {
			const eventUserId = normalizeUserId(payload?.userId)
			if (eventUserId && eventUserId !== normalizedUserId) return

			queryClient.invalidateQueries({ queryKey: ['leaveRequests', 'accepted', 'user', userId] })
		}

		socket.on(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		return () => {
			socket.off(LEAVE_REQUESTS_UPDATED_EVENT, handleLeaveRequestsUpdated)
		}
	}, [enabled, socket, queryClient, userId])

	return useQuery({
		queryKey: ['leaveRequests', 'accepted', 'user', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leaveworks/accepted-leave-requests/${userId}`, {
				withCredentials: true,
			})
			return response.data.filter(
				(request) => request.startDate && request.endDate && request.userId
			)
		},
		enabled,
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
		placeholderData: (previousData) => previousData,
	})
}

// Mutation - tworzenie wniosku urlopowego
export const useCreateLeaveRequest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/leaveworks/leave-request`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
		},
	})
}

export const checkLeaveScheduleConflicts = async ({ startDate, endDate, targetUserId }) => {
	const response = await axios.post(
		`${API_URL}/api/leaveworks/leave-requests/schedule-conflicts`,
		{
			startDate,
			endDate,
			...(targetUserId ? { targetUserId } : {}),
		},
		{ withCredentials: true }
	)
	return response.data
}

// Mutation - aktualizacja statusu wniosku
export const useUpdateLeaveRequestStatus = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, status, userId }) => {
			const response = await axios.patch(
				`${API_URL}/api/leaveworks/leave-requests/${id}`,
				{ status },
				{ withCredentials: true }
			)
			return { ...response.data, userId }
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
			if (variables.userId) {
				queryClient.setQueryData(['leaveRequests', 'user', variables.userId], (old) => {
					if (!old) return old
					return old.map((request) =>
						request._id === variables.id ? { ...request, status: variables.status } : request
					)
				})
			}
		},
	})
}

// Mutation - anulowanie wniosku urlopowego
export const useCancelLeaveRequest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id) => {
			const response = await axios.delete(
				`${API_URL}/api/leaveworks/leave-requests/${id}`,
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
		},
	})
}

// Mutation - edycja wniosku urlopowego
export const useUpdateLeaveRequest = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, data }) => {
			const response = await axios.put(
				`${API_URL}/api/leaveworks/leave-requests/${id}`,
				data,
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequests'] })
		},
	})
}

