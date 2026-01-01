import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'

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

