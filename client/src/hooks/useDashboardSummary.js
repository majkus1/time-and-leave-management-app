import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useSocket } from '../context/SocketContext'

export const DASHBOARD_SUMMARY_QUERY_KEY = ['dashboard-summary']

export function invalidateDashboardSummary(queryClient) {
	return queryClient.invalidateQueries({ queryKey: DASHBOARD_SUMMARY_QUERY_KEY })
}

export function useDashboardSummary({ enabled = true } = {}) {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket || !enabled) return

		const refresh = () => invalidateDashboardSummary(queryClient)

		socket.on('workdays-updated', refresh)
		socket.on('leave-requests-updated', refresh)
		socket.on('schedule-updated', refresh)
		socket.on('task-notification-updated', refresh)

		return () => {
			socket.off('workdays-updated', refresh)
			socket.off('leave-requests-updated', refresh)
			socket.off('schedule-updated', refresh)
			socket.off('task-notification-updated', refresh)
		}
	}, [socket, enabled, queryClient])

	return useQuery({
		queryKey: DASHBOARD_SUMMARY_QUERY_KEY,
		enabled,
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/dashboard/summary`, { withCredentials: true })
			return data.summary
		},
		staleTime: 0,
		refetchOnMount: 'always',
		refetchOnWindowFocus: true,
	})
}
