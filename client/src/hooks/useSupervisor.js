import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'

/**
 * Hook do pobierania konfiguracji przełożonego
 */
export const useSupervisorConfig = (supervisorId, enabled = true) => {
	return useQuery({
		queryKey: ['supervisorConfig', supervisorId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/supervisors/${supervisorId}/config`, { withCredentials: true })
			return response.data
		},
		enabled: enabled && !!supervisorId
	})
}

/**
 * Hook do aktualizacji konfiguracji przełożonego
 */
export const useUpdateSupervisorConfig = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ supervisorId, permissions, selectedEmployees }) => {
			const response = await axios.put(
				`${API_URL}/api/supervisors/${supervisorId}/config`,
				{ permissions, selectedEmployees },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['supervisorConfig', variables.supervisorId] })
			queryClient.invalidateQueries({ queryKey: ['users'] }) // Odśwież listę użytkowników
			queryClient.invalidateQueries({ queryKey: ['supervisorSubordinates', variables.supervisorId] })
		}
	})
}

/**
 * Hook do pobierania listy podwładnych przełożonego
 */
export const useSupervisorSubordinates = (supervisorId, enabled = true) => {
	return useQuery({
		queryKey: ['supervisorSubordinates', supervisorId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/supervisors/${supervisorId}/subordinates`, { withCredentials: true })
			return response.data
		},
		enabled: enabled && !!supervisorId
	})
}

/**
 * Hook do aktualizacji listy podwładnych przełożonego
 */
export const useUpdateSupervisorSubordinates = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ supervisorId, subordinateIds }) => {
			const response = await axios.put(
				`${API_URL}/api/supervisors/${supervisorId}/subordinates`,
				{ subordinateIds },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['supervisorSubordinates', variables.supervisorId] })
			queryClient.invalidateQueries({ queryKey: ['supervisorConfig', variables.supervisorId] })
			queryClient.invalidateQueries({ queryKey: ['users'] }) // Odśwież listę użytkowników
		}
	})
}

