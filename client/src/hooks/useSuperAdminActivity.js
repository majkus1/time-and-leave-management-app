import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'

export function useSuperAdminActivity({ onlineMinutes = 30, historyDays = 7, enabled = false } = {}) {
	return useQuery({
		queryKey: ['superAdminActivity', onlineMinutes, historyDays],
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/super/activity/overview`, {
				params: { onlineMinutes, historyDays },
				withCredentials: true,
			})
			return data
		},
		enabled,
		refetchInterval: enabled ? 60 * 1000 : false,
		staleTime: 30 * 1000,
	})
}
