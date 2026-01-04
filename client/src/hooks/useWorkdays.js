import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie workdays (wszystkie, filtrowanie po stronie klienta)
export const useWorkdays = () => {
	return useQuery({
		queryKey: ['workdays'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/workdays`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 2 * 60 * 1000, // 2 minuty
		cacheTime: 5 * 60 * 1000, // 5 minut
	})
}

// Query hook - pobieranie workdays dla konkretnego użytkownika
export const useUserWorkdays = (userId) => {
	return useQuery({
		queryKey: ['workdays', 'user', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/workdays/user/${userId}`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled: !!userId,
		staleTime: 2 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Mutation - dodawanie workday
export const useCreateWorkday = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/workdays`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			// Invalidate wszystkie workdays queries
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}

// Mutation - aktualizacja workday
export const useUpdateWorkday = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, updatedWorkday }) => {
			const response = await axios.put(`${API_URL}/api/workdays/${id}`, updatedWorkday, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}

// Mutation - usuwanie workday
export const useDeleteWorkday = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id) => {
			const response = await axios.delete(`${API_URL}/api/workdays/${id}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}

