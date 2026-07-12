import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useSocket } from '../context/SocketContext'

export const DASHBOARD_TEAM_INSIGHTS_QUERY_KEY = ['dashboard-team-insights']

export function invalidateDashboardTeamInsights(queryClient) {
	return queryClient.invalidateQueries({ queryKey: DASHBOARD_TEAM_INSIGHTS_QUERY_KEY })
}

export function useDashboardTeamInsights({
	period = 'month',
	startDate = '',
	endDate = '',
	userId = '',
	department = '',
	enabled = true,
} = {}) {
	const queryClient = useQueryClient()
	const { socket } = useSocket()
	const customRangeReady = period !== 'custom' || (Boolean(startDate) && Boolean(endDate) && startDate <= endDate)

	useEffect(() => {
		if (!socket || !enabled) return

		const refresh = () => invalidateDashboardTeamInsights(queryClient)

		socket.on('workdays-updated', refresh)
		socket.on('leave-requests-updated', refresh)
		socket.on('task-notification-updated', refresh)

		return () => {
			socket.off('workdays-updated', refresh)
			socket.off('leave-requests-updated', refresh)
			socket.off('task-notification-updated', refresh)
		}
	}, [socket, enabled, queryClient])

	return useQuery({
		queryKey: [
			...DASHBOARD_TEAM_INSIGHTS_QUERY_KEY,
			period,
			period === 'custom' ? startDate : '',
			period === 'custom' ? endDate : '',
			department || 'all-departments',
			userId || 'all',
		],
		enabled: enabled && customRangeReady,
		queryFn: async () => {
			const params = { period }
			if (period === 'custom') {
				params.startDate = startDate
				params.endDate = endDate
			}
			if (department) params.department = department
			if (userId) params.userId = userId
			const { data } = await axios.get(`${API_URL}/api/dashboard/team-insights`, {
				params,
				withCredentials: true,
			})
			return data.insights
		},
		staleTime: 0,
		refetchOnMount: 'always',
	})
}
