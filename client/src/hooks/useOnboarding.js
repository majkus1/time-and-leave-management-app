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

/** Wczytanie / usunięcie danych demo — po zmianie odświeżamy wszystko, bo dotyka wielu modułów. */
export function useCreateDemoData() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async () => {
			const { data } = await axios.post(`${API_URL}/api/onboarding/demo-data`, {}, { withCredentials: true })
			return data
		},
		onSuccess: () => {
			qc.invalidateQueries()
		},
	})
}

export function useRemoveDemoData() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async () => {
			const { data } = await axios.delete(`${API_URL}/api/onboarding/demo-data`, { withCredentials: true })
			return data
		},
		onSuccess: () => {
			qc.invalidateQueries()
		},
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
			// visible:false, ale info o danych demo zostaje — pasek „usuń dane demo” ma działać po ukryciu listy
			qc.setQueryData(ONBOARDING_STATUS_QUERY_KEY, prev => ({ visible: false, demo: prev?.demo }))
		},
	})
}
