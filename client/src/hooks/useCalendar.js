import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - status potwierdzenia miesiąca
export const useCalendarConfirmation = (month, year, userId = null) => {
	return useQuery({
		queryKey: ['calendar', 'confirmation', month, year, userId],
		queryFn: async () => {
			const url = userId
				? `${API_URL}/api/calendar/confirmation-status/${userId}`
				: `${API_URL}/api/calendar/confirmation-status`
			const response = await axios.get(url, {
				params: { month, year },
				withCredentials: true,
			})
			return response.data.isConfirmed || false
		},
		staleTime: 1 * 60 * 1000, // 1 minuta
		cacheTime: 5 * 60 * 1000,
		placeholderData: (previousData) => previousData, // Keep previous data while fetching new to prevent calendar reset
		refetchOnMount: false, // Don't refetch on mount if data is fresh
		refetchOnWindowFocus: false, // Don't refetch on window focus
	})
}

// Mutation - przełączanie statusu potwierdzenia
export const useToggleCalendarConfirmation = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ month, year, isConfirmed }) => {
			const response = await axios.post(
				`${API_URL}/api/calendar/confirm`,
				{ month, year, isConfirmed },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({
				queryKey: ['calendar', 'confirmation', variables.month, variables.year],
			})
		},
	})
}

