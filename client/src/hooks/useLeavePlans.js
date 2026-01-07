import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie planów urlopowych użytkownika
export const useLeavePlans = () => {
	return useQuery({
		queryKey: ['leavePlans'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/planlea/leave-plans`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 2 * 60 * 1000, // 2 minuty
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie planów urlopowych konkretnego użytkownika (admin)
export const useUserLeavePlans = (userId) => {
	return useQuery({
		queryKey: ['leavePlans', 'user', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/planlea/admin/leave-plans/${userId}`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled: !!userId,
		staleTime: 2 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie wszystkich planów (admin)
export const useAllLeavePlans = () => {
	return useQuery({
		queryKey: ['leavePlans', 'all'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/planlea/admin/all-leave-plans`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 2 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Mutation - dodawanie/usuwanie daty z planu
export const useToggleLeavePlan = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ date, isSelected }) => {
			if (isSelected) {
				const response = await axios.delete(`${API_URL}/api/planlea/leave-plans`, {
					data: { date },
					withCredentials: true,
				})
				return response.data
			} else {
				const response = await axios.post(
					`${API_URL}/api/planlea/leave-plans`,
					{ date },
					{ withCredentials: true }
				)
				return response.data
			}
		},
		onMutate: async ({ date, isSelected }) => {
			// Anuluj wszystkie outgoing queries
			await queryClient.cancelQueries({ queryKey: ['leavePlans'] })

			// Zapisz snapshot poprzedniej wartości
			const previousLeavePlans = queryClient.getQueryData(['leavePlans'])

			// Optimistic update - dodaj lub usuń datę z cache
			queryClient.setQueryData(['leavePlans'], (old) => {
				if (!old) return old
				
				if (isSelected) {
					// Usuń datę (jest zaznaczona, więc chcemy ją odznaczyć)
					return old.filter((d) => d !== date)
				} else {
					// Dodaj datę (nie jest zaznaczona, więc chcemy ją zaznaczyć)
					// Sprawdź czy już nie istnieje (dla bezpieczeństwa)
					if (!old.includes(date)) {
						return [...old, date]
					}
					return old
				}
			})

			// Zwróć context z poprzednimi danymi dla rollback
			return { previousLeavePlans, date, isSelected }
		},
		onError: (err, variables, context) => {
			// Rollback w przypadku błędu (np. jeśli próbowano zaznaczyć święto/weekend)
			if (context?.previousLeavePlans !== undefined) {
				queryClient.setQueryData(['leavePlans'], context.previousLeavePlans)
			}
		},
		onSuccess: () => {
			// Invalidate query, żeby pobrać prawdziwe dane z serwera
			queryClient.invalidateQueries({ queryKey: ['leavePlans'] })
		},
	})
}

// Mutation - usuwanie daty z planu
export const useDeleteLeavePlan = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (date) => {
			const response = await axios.delete(`${API_URL}/api/planlea/leave-plans`, {
				data: { date },
				withCredentials: true,
			})
			return response.data
		},
		onMutate: async (date) => {
			// Anuluj wszystkie outgoing queries
			await queryClient.cancelQueries({ queryKey: ['leavePlans'] })

			// Zapisz snapshot poprzedniej wartości
			const previousLeavePlans = queryClient.getQueryData(['leavePlans'])

			// Optimistic update - usuń datę z cache
			queryClient.setQueryData(['leavePlans'], (old) => {
				if (!old) return old
				return old.filter((d) => d !== date)
			})

			// Zwróć context z poprzednimi danymi dla rollback
			return { previousLeavePlans }
		},
		onError: (err, date, context) => {
			// Rollback w przypadku błędu
			if (context?.previousLeavePlans !== undefined) {
				queryClient.setQueryData(['leavePlans'], context.previousLeavePlans)
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['leavePlans'] })
		},
	})
}

