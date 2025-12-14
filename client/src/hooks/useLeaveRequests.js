import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

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

// Query hook - pobieranie wszystkich zaakceptowanych wniosków (admin)
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

