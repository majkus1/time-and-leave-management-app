import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// Mutation hook - usuwanie zespołu
export const useDeleteTeam = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (teamId) => {
			const response = await axios.delete(`${API_URL}/api/teams/${teamId}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] })
			queryClient.invalidateQueries({ queryKey: ['team'] })
		},
	})
}

