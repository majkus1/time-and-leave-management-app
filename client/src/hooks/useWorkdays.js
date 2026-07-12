import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useSocket } from '../context/SocketContext'
import { invalidateDashboardSummary } from './useDashboardSummary'

/** Podczas refetch zachowaj poprzednie dane — kalendarz nie traci stanu UI. */
const keepPreviousQueryData = (previousData) => previousData

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
		placeholderData: keepPreviousQueryData,
	})
}

// Query hook - pobieranie workdays dla konkretnego użytkownika
export const useUserWorkdays = (userId) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()
	const query = useQuery({
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
		placeholderData: keepPreviousQueryData,
	})

	useEffect(() => {
		if (!socket || !userId) return
		const handleRealtimeWorkdaysUpdate = (payload) => {
			if (!payload?.userId) return
			if (String(payload.userId) !== String(userId)) return
			queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
		}
		socket.on('workdays-updated', handleRealtimeWorkdaysUpdate)
		return () => socket.off('workdays-updated', handleRealtimeWorkdaysUpdate)
	}, [socket, userId, queryClient])

	return query
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
			// Also invalidate timer sessions queries in case workday contains sessions
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			invalidateDashboardSummary(queryClient)
		},
	})
}

export const useCreateWorkdayForUser = (userId) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/workdays/user/${userId}`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'team'] })
			invalidateDashboardSummary(queryClient)
		},
	})
}

export const useBulkFillWorkdays = (userId = null) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const url = userId
				? `${API_URL}/api/workdays/user/${userId}/bulk-fill`
				: `${API_URL}/api/workdays/bulk-fill`
			const response = await axios.post(url, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
			if (userId) {
				queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
				queryClient.invalidateQueries({ queryKey: ['workdays', 'team'] })
			}
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			invalidateDashboardSummary(queryClient)
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
			// Also invalidate timer sessions queries in case workday contains sessions
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			invalidateDashboardSummary(queryClient)
		},
	})
}

export const useUpdateWorkdayForUser = (userId) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, updatedWorkday }) => {
			const response = await axios.put(`${API_URL}/api/workdays/user/${userId}/${id}`, updatedWorkday, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'team'] })
			invalidateDashboardSummary(queryClient)
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
			// Also invalidate timer sessions queries to update the session list immediately
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			invalidateDashboardSummary(queryClient)
		},
	})
}

export const useClearWorkdaysForMonth = (userId = null) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ month, year }) => {
			const url = userId
				? `${API_URL}/api/workdays/user/${userId}/month/clear`
				: `${API_URL}/api/workdays/month/clear`
			const response = await axios.delete(url, {
				data: { month, year },
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
			if (userId) {
				queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
				queryClient.invalidateQueries({ queryKey: ['workdays', 'team'] })
			}
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			invalidateDashboardSummary(queryClient)
		},
	})
}

export const useDeleteWorkdayForUser = (userId) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id) => {
			const response = await axios.delete(`${API_URL}/api/workdays/user/${userId}/${id}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'team'] })
			invalidateDashboardSummary(queryClient)
		},
	})
}

export const useReviewWorkdayForUser = (userId) => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ id, status }) => {
			const response = await axios.patch(`${API_URL}/api/workdays/user/${userId}/${id}/review`, { status }, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'user', userId] })
			queryClient.invalidateQueries({ queryKey: ['workdays', 'team'] })
			invalidateDashboardSummary(queryClient)
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

