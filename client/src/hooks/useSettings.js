import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

import { BILLING_ENTITLEMENTS_QUERY_KEY } from './useBilling'
import { ONBOARDING_STATUS_QUERY_KEY } from './useOnboarding'

// Query hook - pobieranie ustawień
export const useSettings = () => {
	return useQuery({
		queryKey: ['settings'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/settings`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // 5 minut
		cacheTime: 10 * 60 * 1000, // 10 minut
	})
}

// Mutation - aktualizacja ustawień
export const useUpdateSettings = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.put(`${API_URL}/api/settings`, data, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['settings'] })
			queryClient.invalidateQueries({ queryKey: ONBOARDING_STATUS_QUERY_KEY })
			// Typy wniosków zapisują się razem z resztą ustawień, więc ich osobny cache
			// też musi zostać odświeżony — inaczej ekran ustawień dalej porównywałby
			// się ze starymi danymi i pokazywał niezapisane zmiany mimo udanego zapisu.
			if (variables && Object.prototype.hasOwnProperty.call(variables, 'leaveRequestTypes')) {
				queryClient.invalidateQueries({ queryKey: ['leaveRequestTypes'] })
			}
			if (variables && Object.prototype.hasOwnProperty.call(variables, 'dashboardEnabled')) {
				queryClient.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
			}
		},
	})
}

