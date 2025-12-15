import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie własnych dni urlopowych (current user)
export const useOwnVacationDays = () => {
	return useQuery({
		queryKey: ['vacation', 'days', 'own'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/vacations/vacation-days`, {
				withCredentials: true,
			})
			return response.data.vacationDays
		},
		staleTime: 2 * 60 * 1000, // 2 minuty
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie dni urlopowych użytkownika
export const useVacationDays = (userId) => {
	return useQuery({
		queryKey: ['vacation', 'days', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/vacations/${userId}/vacation-days`, {
				withCredentials: true,
			})
			return response.data.vacationDays
		},
		enabled: !!userId,
		staleTime: 2 * 60 * 1000, // 2 minuty
		cacheTime: 5 * 60 * 1000,
	})
}

// Mutation - aktualizacja dni urlopowych
export const useUpdateVacationDays = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ userId, vacationDays }) => {
			const response = await axios.patch(
				`${API_URL}/api/vacations/${userId}/vacation-days`,
				{ vacationDays },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (data, variables) => {
			// Invaliduj dni urlopowe użytkownika, jego dane w liście użytkowników i całą listę
			queryClient.invalidateQueries({ queryKey: ['vacation', 'days', variables.userId] })
			// Invaliduj również 'own' vacation days (używane przez LeaveRequestForm)
			queryClient.invalidateQueries({ queryKey: ['vacation', 'days', 'own'] })
			// Invaliduj wszystkie query vacation days jako fallback
			queryClient.invalidateQueries({ queryKey: ['vacation', 'days'] })
			queryClient.invalidateQueries({ queryKey: ['users', variables.userId] })
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})
}

