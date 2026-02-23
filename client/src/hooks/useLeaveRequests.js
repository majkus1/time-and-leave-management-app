import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useSocket } from '../context/SocketContext'

const ALL_LEAVE_REQUESTS_QUERY_KEY = ['leaveRequests', 'all']
const PENDING_STATUSES = new Set(['status.pending', 'pending'])

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

// Query hook - pobieranie zaakceptowanych wniosków
export const useAcceptedLeaveRequests = () => {
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
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie wszystkich zaakceptowanych wniosków (dla wszystkich użytkowników z zespołu)
export const useAllAcceptedLeaveRequests = () => {
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

// Query hook - pobieranie wszystkich wniosków urlopowych (wszystkie statusy) dla zespołu
export const useAllLeaveRequests = () => {
	return useQuery({
		queryKey: ALL_LEAVE_REQUESTS_QUERY_KEY,
		queryFn: fetchAllLeaveRequests,
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
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

		socket.on('leave-requests-updated', handleLeaveRequestsUpdated)
		return () => {
			socket.off('leave-requests-updated', handleLeaveRequestsUpdated)
		}
	}, [enabled, socket, queryClient])

	return query
}

// Query hook - pobieranie zaakceptowanych wniosków konkretnego użytkownika
export const useUserAcceptedLeaveRequests = (userId) => {
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
		enabled: !!userId,
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
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
			// Optymistyczna aktualizacja jeśli mamy userId
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

