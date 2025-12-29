import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie działów
export const useDepartments = (teamId = null) => {
	return useQuery({
		queryKey: ['departments', teamId],
		queryFn: async () => {
			const params = teamId ? { teamId } : {}
			const response = await axios.get(`${API_URL}/api/departments`, {
				params,
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
			// Invalidate all department queries (dla różnych teamId)
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			// Invaliduj tablice zadań i grafiki - mogą zostać utworzone dla działu
			queryClient.invalidateQueries({ queryKey: ['boards'] })
			queryClient.invalidateQueries({ queryKey: ['schedules'] })
		},
	})
}

// Mutation - usuwanie działu
export const useDeleteDepartment = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ name, teamId }) => {
			const params = teamId ? { teamId } : {}
			const response = await axios.delete(
				`${API_URL}/api/departments/${encodeURIComponent(name)}`,
				{ params, withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['departments'] })
			queryClient.invalidateQueries({ queryKey: ['users'] })
			// Invaliduj tablice zadań i grafiki - mogą zostać deaktywowane
			queryClient.invalidateQueries({ queryKey: ['boards'] })
			queryClient.invalidateQueries({ queryKey: ['schedules'] })
		},
	})
}

// Get department users
export const useDepartmentUsers = (departmentName, teamId, enabled = true) => {
	return useQuery({
		queryKey: ['departmentUsers', departmentName, teamId],
		queryFn: async () => {
			const params = teamId ? { teamId } : {}
			const response = await axios.get(
				`${API_URL}/api/departments/${encodeURIComponent(departmentName)}/users`,
				{ params, withCredentials: true }
			)
			return response.data
		},
		enabled: enabled && !!departmentName && !!teamId,
		staleTime: 5 * 1000, // 5 seconds - users can change frequently
		refetchInterval: 30 * 1000 // Refetch every 30 seconds for real-time updates
	})
}

