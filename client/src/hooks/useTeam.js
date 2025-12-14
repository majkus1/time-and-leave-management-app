import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie informacji o zespole
export const useTeamInfo = (teamId) => {
	return useQuery({
		queryKey: ['team', teamId, 'info'],
		queryFn: async () => {
			const response = await axios.post(`${API_URL}/api/teams/${teamId}/check-limit`, {}, {
				withCredentials: true,
			})
			return response.data
		},
		enabled: !!teamId,
		staleTime: 5 * 60 * 1000, // 5 minut
		cacheTime: 10 * 60 * 1000,
	})
}

