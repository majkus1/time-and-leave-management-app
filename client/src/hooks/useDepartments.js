import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie działów
export const useDepartments = () => {
	return useQuery({
		queryKey: ['departments'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/departments`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 10 * 60 * 1000, // 10 minut - działy rzadko się zmieniają
		cacheTime: 30 * 60 * 1000, // 30 minut
	})
}

// Mutation - tworzenie działu
export const useCreateDepartment = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ name, teamId }) => {
			const response = await axios.post(
				`${API_URL}/api/departments`,
				{ name, teamId },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['departments'] })
		},
	})
}

// Mutation - usuwanie działu
export const useDeleteDepartment = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (name) => {
			const response = await axios.delete(
				`${API_URL}/api/departments/${encodeURIComponent(name)}`,
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})
}

