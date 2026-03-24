import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'
import { useSocket } from '../context/SocketContext'

/**
 * Conversational draft for schedule auto-fill (separate from global AI assistant).
 * @param {{ scheduleId: string, year: number, month: number, messages: Array<{role:string,content:string}>, locale?: string }} body
 */
export async function postScheduleAiAutoDraft(body) {
	const { data } = await axios.post(
		`${API_URL}/api/schedules/${body.scheduleId}/entries/ai-auto-draft`,
		{
			year: body.year,
			month: body.month,
			messages: body.messages,
			locale: body.locale || 'pl',
		},
		{ withCredentials: true, timeout: 120000 }
	)
	return data
}

const SCHEDULE_UPDATED_EVENT = 'schedule-updated'

// Get all schedules for current user
export const useSchedules = () => {
	return useQuery({
		queryKey: ['schedules'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/schedules`, {
				withCredentials: true
			})
			return response.data
		}
	})
}

// Get schedule by ID
export const useSchedule = (scheduleId) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket || !scheduleId) return

		const handleScheduleUpdated = (payload) => {
			if (payload?.scheduleId && payload.scheduleId !== String(scheduleId)) return
			queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', scheduleId] })
		}

		socket.on(SCHEDULE_UPDATED_EVENT, handleScheduleUpdated)
		return () => {
			socket.off(SCHEDULE_UPDATED_EVENT, handleScheduleUpdated)
		}
	}, [socket, queryClient, scheduleId])

	return useQuery({
		queryKey: ['schedule', scheduleId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/schedules/${scheduleId}`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!scheduleId
	})
}

// Get schedule entries for a specific month
export const useScheduleEntries = (scheduleId, month, year) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket || !scheduleId) return

		const handleScheduleUpdated = (payload) => {
			if (payload?.scheduleId && payload.scheduleId !== String(scheduleId)) return
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['schedule', scheduleId] })
		}

		socket.on(SCHEDULE_UPDATED_EVENT, handleScheduleUpdated)
		return () => {
			socket.off(SCHEDULE_UPDATED_EVENT, handleScheduleUpdated)
		}
	}, [socket, queryClient, scheduleId])

	return useQuery({
		queryKey: ['scheduleEntries', scheduleId, month, year],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/schedules/${scheduleId}/entries`, {
				params: { month, year },
				withCredentials: true
			})
			return response.data
		},
		enabled: !!scheduleId && month !== undefined && year !== undefined
	})
}

// Add or update schedule entry
export const useUpsertScheduleEntry = () => {
	const queryClient = useQueryClient()
	
	return useMutation({
		mutationFn: async ({ scheduleId, data }) => {
			const response = await axios.post(`${API_URL}/api/schedules/${scheduleId}/entries`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

export const useUpsertScheduleAvailability = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ scheduleId, data }) => {
			const response = await axios.post(`${API_URL}/api/schedules/${scheduleId}/availability`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

export const useDeleteScheduleAvailability = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ scheduleId, date }) => {
			const response = await axios.delete(`${API_URL}/api/schedules/${scheduleId}/availability`, {
				params: { date },
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

// Delete schedule entry
export const useDeleteScheduleEntry = () => {
	const queryClient = useQueryClient()
	
	return useMutation({
		mutationFn: async ({ scheduleId, entryId }) => {
			const response = await axios.delete(`${API_URL}/api/schedules/${scheduleId}/entries/${entryId}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

export const useAutoGenerateScheduleMonth = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ scheduleId, data }) => {
			const response = await axios.post(`${API_URL}/api/schedules/${scheduleId}/entries/auto-generate`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

export const useClearScheduleMonth = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ scheduleId, data }) => {
			const response = await axios.post(`${API_URL}/api/schedules/${scheduleId}/entries/clear-month`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

export const usePublishScheduleMonth = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ scheduleId, data }) => {
			const response = await axios.post(`${API_URL}/api/schedules/${scheduleId}/entries/publish-month`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
			queryClient.invalidateQueries({ queryKey: ['scheduleEntries', variables.scheduleId] })
		}
	})
}

// Get users for a schedule
export const useScheduleUsers = (scheduleId, enabled = true) => {
	return useQuery({
		queryKey: ['scheduleUsers', scheduleId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/schedules/${scheduleId}/users`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!scheduleId && enabled,
		refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
		staleTime: 0 // Always refetch
	})
}

// Create schedule
export const useCreateSchedule = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/schedules`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['schedules'] })
		}
	})
}

// Update schedule
export const useUpdateSchedule = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ scheduleId, data }) => {
			const response = await axios.put(`${API_URL}/api/schedules/${scheduleId}`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['schedules'] })
			queryClient.invalidateQueries({ queryKey: ['schedule', variables.scheduleId] })
		}
	})
}

// Delete schedule
export const useDeleteSchedule = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (scheduleId) => {
			const response = await axios.delete(`${API_URL}/api/schedules/${scheduleId}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['schedules'] })
		}
	})
}

