import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

/** Wspólny klucz — invaliduj po zużyciu limitu AI (czat, grafik, eksport). */
export const BILLING_ENTITLEMENTS_QUERY_KEY = ['billing-entitlements']

export function useBillingCatalog() {
	return useQuery({
		queryKey: ['billing-catalog'],
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/billing/catalog`, { withCredentials: true })
			return data.catalog
		},
		staleTime: 30 * 60 * 1000,
	})
}

export function useBillingEntitlements() {
	return useQuery({
		queryKey: BILLING_ENTITLEMENTS_QUERY_KEY,
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/billing/entitlements`, { withCredentials: true })
			return data.entitlements
		},
		staleTime: 15 * 1000,
		refetchInterval: 30 * 1000,
		refetchOnWindowFocus: true,
	})
}

export function useBillingPurchaseRequest() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async body => {
			const { data } = await axios.post(`${API_URL}/api/billing/purchase-request`, body, {
				withCredentials: true,
			})
			return data
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		},
	})
}
