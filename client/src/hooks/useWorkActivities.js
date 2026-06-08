import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

export const useWorkActivities = (options = {}) => {
	const { enabled = true } = options
	return useQuery({
		queryKey: ['workActivities'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/work-activities`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled,
		staleTime: 5 * 60 * 1000,
	})
}

export const useUpdateWorkActivities = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (workActivities) => {
			const response = await axios.put(`${API_URL}/api/work-activities`, { workActivities }, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workActivities'] })
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}

export const useAddWorkActivity = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/work-activities`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workActivities'] })
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}

export const useDeleteWorkActivity = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (id) => {
			await axios.delete(`${API_URL}/api/work-activities/${id}`, {
				withCredentials: true,
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['workActivities'] })
			queryClient.invalidateQueries({ queryKey: ['settings'] })
		},
	})
}
