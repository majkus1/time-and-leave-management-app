import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

export const ONBOARDING_STATUS_QUERY_KEY = ['onboarding', 'status']

/** Stan listy „pierwsze kroki” (tylko Admin / HR; dla reszty serwer zwraca visible:false). */
export function useOnboardingStatus(options = {}) {
	const { enabled = true } = options
	return useQuery({
		queryKey: ONBOARDING_STATUS_QUERY_KEY,
		enabled,
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/onboarding/status`, {
				withCredentials: true,
				skipErrorLog: true,
			})
			return data
		},
		staleTime: 30 * 1000,
		refetchOnWindowFocus: true,
		retry: false,
	})
}

export function useDismissOnboarding() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async () => {
			const { data } = await axios.post(`${API_URL}/api/onboarding/dismiss`, {}, { withCredentials: true })
			return data
		},
		onSuccess: () => {
			qc.setQueryData(ONBOARDING_STATUS_QUERY_KEY, { visible: false })
		},
	})
}
