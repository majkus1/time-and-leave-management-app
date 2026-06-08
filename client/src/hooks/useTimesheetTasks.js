import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'

export function useTimesheetTasks(forUserId, { enabled = true } = {}) {
	return useQuery({
		queryKey: ['timesheet', 'tasks', forUserId || 'self'],
		queryFn: async () => {
			const params = forUserId ? { forUserId } : undefined
			const response = await axios.get(`${API_URL}/api/users/timesheet-tasks`, {
				params,
				withCredentials: true,
			})
			return response.data || []
		},
		enabled,
		staleTime: 60 * 1000,
	})
}
