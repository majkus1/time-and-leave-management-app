import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Get active timer status
export const useActiveTimer = () => {
	return useQuery({
		queryKey: ['timer', 'active'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/workdays/timer/active`, {
				withCredentials: true,
			})
			return response.data
		},
		refetchInterval: 1000, // Refetch every second for real-time updates
		staleTime: 0,
	})
}

// Start timer
export const useStartTimer = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ workDescription, taskId, isOvertime }) => {
			const response = await axios.post(
				`${API_URL}/api/workdays/timer/start`,
				{ workDescription, taskId, isOvertime },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timer', 'active'] })
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
		},
	})
}

// Pause/Resume timer
export const usePauseTimer = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const response = await axios.post(
				`${API_URL}/api/workdays/timer/pause`,
				{},
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timer', 'active'] })
		},
	})
}

// Stop timer
export const useStopTimer = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const response = await axios.post(
				`${API_URL}/api/workdays/timer/stop`,
				{},
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timer', 'active'] })
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}

// Update active timer description
export const useUpdateActiveTimer = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ workDescription, taskId, isOvertime }) => {
			const response = await axios.put(
				`${API_URL}/api/workdays/timer/update`,
				{ workDescription, taskId, isOvertime },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timer', 'active'] })
		},
	})
}

// Get sessions for a specific month (or today if no month/year provided)
export const useTodaySessions = (month, year) => {
	return useQuery({
		queryKey: ['timer', 'sessions', month, year],
		queryFn: async () => {
			const params = {}
			if (month !== undefined && month !== null) {
				params.month = month
			}
			if (year !== undefined && year !== null) {
				params.year = year
			}
			const response = await axios.get(`${API_URL}/api/workdays/timer/sessions`, {
				params,
				withCredentials: true,
			})
			return response.data
		},
		enabled: month !== undefined && year !== undefined,
		staleTime: 30 * 1000, // 30 seconds
	})
}

// Delete a session
export const useDeleteSession = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ workdayId, sessionId }) => {
			const response = await axios.delete(
				`${API_URL}/api/workdays/timer/sessions/${workdayId}/${sessionId}`,
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timer', 'sessions'] })
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}
