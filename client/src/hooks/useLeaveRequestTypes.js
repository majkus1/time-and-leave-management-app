import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie typów wniosków
export const useLeaveRequestTypes = () => {
	return useQuery({
		queryKey: ['leaveRequestTypes'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/leave-request-types`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // 5 minut
		cacheTime: 10 * 60 * 1000, // 10 minut
	})
}

// Mutation - aktualizacja typów wniosków
export const useUpdateLeaveRequestTypes = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (leaveRequestTypes) => {
			const response = await axios.put(`${API_URL}/api/leave-request-types`, {
				leaveRequestTypes
			}, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequestTypes'] })
			queryClient.invalidateQueries({ queryKey: ['settings'] }) // Też odśwież settings
		},
	})
}

// Mutation - dodanie niestandardowego typu
export const useAddCustomLeaveRequestType = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/leave-request-types`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequestTypes'] })
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}

// Mutation - usunięcie niestandardowego typu
export const useDeleteCustomLeaveRequestType = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id) => {
			const response = await axios.delete(`${API_URL}/api/leave-request-types/${id}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leaveRequestTypes'] })
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}
