import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'

// Query hook - status potwierdzenia miesiąca
export const useCalendarConfirmation = (month, year, userId = null) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()
	const { userId: currentUserId } = useAuth()
	const query = useQuery({
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
		// Always refetch on mount so cross-device updates are visible immediately
		// when navigating to calendar views (even if cache is still "fresh").
		refetchOnMount: 'always',
		refetchOnWindowFocus: false, // Don't refetch on window focus
	})

	useEffect(() => {
		if (!socket) return

		const requestedUserId = userId || currentUserId
		if (!requestedUserId) return

		const handleRealtimeUpdate = (payload) => {
			if (!payload) return
			if (String(payload.userId) !== String(requestedUserId)) return
			if (String(payload.month) !== String(month) || String(payload.year) !== String(year)) return

			queryClient.setQueryData(['calendar', 'confirmation', month, year, userId], !!payload.isConfirmed)
		}

		socket.on('calendar-confirmation-updated', handleRealtimeUpdate)
		return () => {
			socket.off('calendar-confirmation-updated', handleRealtimeUpdate)
		}
	}, [socket, queryClient, month, year, userId, currentUserId])

	return query
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

