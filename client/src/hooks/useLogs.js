import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie logów użytkownika
export const useUserLogs = (userId) => {
	return useQuery({
		queryKey: ['logs', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/userlogs/${userId}`, {
				withCredentials: true,
			})
			return response.data.filter((log) => log.action !== 'LOGOUT')
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000, // 5 minut - logi nie zmieniają się często
		cacheTime: 10 * 60 * 1000,
	})
}

// Query hook - pobieranie wszystkich logów (dla super admina)
export const useAllLogs = (enabled = false) => {
	return useQuery({
		queryKey: ['logs', 'all'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/userlogs/logs`, {
				withCredentials: true,
			})
			return response.data.filter((log) => log.action !== 'LOGOUT')
		},
		enabled,
		staleTime: 2 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}
