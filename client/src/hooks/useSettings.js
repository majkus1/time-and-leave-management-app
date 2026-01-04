import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie ustawień
export const useSettings = () => {
	return useQuery({
		queryKey: ['settings'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/settings`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // 5 minut
		cacheTime: 10 * 60 * 1000, // 10 minut
	})
}

// Mutation - aktualizacja ustawień
export const useUpdateSettings = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.put(`${API_URL}/api/settings`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}

