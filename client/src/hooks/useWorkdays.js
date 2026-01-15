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
		onMutate: async (newWorkday) => {
			// Anuluj wszystkie outgoing queries, żeby nie nadpisały optimistic update
			await queryClient.cancelQueries({ queryKey: ['workdays'] })

			// Zapisz snapshot poprzedniej wartości
			const previousWorkdays = queryClient.getQueryData(['workdays'])

			// Optimistic update - dodaj nowy workday do cache
			queryClient.setQueryData(['workdays'], (old) => {
				const newWorkdayWithId = {
					...newWorkday,
					_id: `temp-${Date.now()}`,
					__temp: true, // Flaga że to temporary
				}
				return old ? [...old, newWorkdayWithId] : [newWorkdayWithId]
			})

			// Zwróć context z poprzednimi danymi dla rollback
			return { previousWorkdays }
		},
		onError: (err, newWorkday, context) => {
			// Rollback w przypadku błędu
			if (context?.previousWorkdays) {
				queryClient.setQueryData(['workdays'], context.previousWorkdays)
			}
		},
		onSuccess: () => {
			// Invalidate wszystkie workdays queries, żeby pobrać prawdziwe dane z serwera
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
		onMutate: async ({ id, updatedWorkday }) => {
			// Anuluj wszystkie outgoing queries
			await queryClient.cancelQueries({ queryKey: ['workdays'] })

			// Zapisz snapshot poprzedniej wartości
			const previousWorkdays = queryClient.getQueryData(['workdays'])

			// Optimistic update - zaktualizuj workday w cache
			queryClient.setQueryData(['workdays'], (old) => {
				if (!old) return old
				return old.map((workday) =>
					workday._id === id ? { ...workday, ...updatedWorkday, __temp: true } : workday
				)
			})

			// Zwróć context z poprzednimi danymi dla rollback
			return { previousWorkdays }
		},
		onError: (err, variables, context) => {
			// Rollback w przypadku błędu
			if (context?.previousWorkdays) {
				queryClient.setQueryData(['workdays'], context.previousWorkdays)
			}
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
		onMutate: async (id) => {
			// Anuluj wszystkie outgoing queries
			await queryClient.cancelQueries({ queryKey: ['workdays'] })

			// Zapisz snapshot poprzedniej wartości
			const previousWorkdays = queryClient.getQueryData(['workdays'])

			// Optimistic update - usuń workday z cache
			queryClient.setQueryData(['workdays'], (old) => {
				if (!old) return old
				return old.filter((workday) => workday._id !== id)
			})

			// Zwróć context z poprzednimi danymi dla rollback
			return { previousWorkdays }
		},
		onError: (err, id, context) => {
			// Rollback w przypadku błędu
			if (context?.previousWorkdays) {
				queryClient.setQueryData(['workdays'], context.previousWorkdays)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}

// Query hook - pobieranie wszystkich workdays z zespołu
export const useAllTeamWorkdays = () => {
	return useQuery({
		queryKey: ['workdays', 'team'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/workdays/team`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 2 * 60 * 1000, // 2 minuty
		cacheTime: 5 * 60 * 1000, // 5 minut
	})
}

