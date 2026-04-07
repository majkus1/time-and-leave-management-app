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

export function useBillingEntitlements(options = {}) {
	const { enabled = true } = options
	return useQuery({
		queryKey: BILLING_ENTITLEMENTS_QUERY_KEY,
		enabled,
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/billing/entitlements`, { withCredentials: true })
			return data.entitlements
		},
		staleTime: 15 * 1000,
		refetchInterval: enabled ? 30 * 1000 : false,
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

export function useBillingP24Status() {
	return useQuery({
		queryKey: ['billing-p24-status'],
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/billing/p24/status`, { withCredentials: true })
			return data.p24
		},
		staleTime: 60 * 1000,
	})
}

export function useBillingP24Checkout() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async body => {
			const { data } = await axios.post(`${API_URL}/api/billing/p24/checkout`, body, {
				withCredentials: true,
			})
			return data
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		},
	})
}

export function useBillingPatchTeamInvoice() {
	const qc = useQueryClient()
	return useMutation({
		mutationFn: async body => {
			const { data } = await axios.patch(`${API_URL}/api/billing/team-invoice`, body, {
				withCredentials: true,
			})
			return data
		},
		onSuccess: data => {
			if (data?.entitlements) {
				qc.setQueryData(BILLING_ENTITLEMENTS_QUERY_KEY, data.entitlements)
			}
			qc.invalidateQueries({ queryKey: BILLING_ENTITLEMENTS_QUERY_KEY })
		},
	})
}

export function useBillingSuperPaidPlanTeams(enabled) {
	return useQuery({
		queryKey: ['billing-super-paid-plan-teams'],
		enabled: Boolean(enabled),
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/billing/super/paid-plan-teams`, {
				withCredentials: true,
			})
			return data.rows || []
		},
		staleTime: 30 * 1000,
	})
}

export function useBillingSuperThankPurchaseEmail() {
	return useMutation({
		mutationFn: async body => {
			const { data } = await axios.post(`${API_URL}/api/billing/super/thank-purchase-email`, body, {
				withCredentials: true,
			})
			return data
		},
	})
}

/** mode: 'test' → tylko michalipka1@gmail.com; 'broadcast' → wszyscy adminEmail (bez Halo Rental System) */
export function useBillingSuperLegacyAnnouncement() {
	return useMutation({
		mutationFn: async ({ mode }) => {
			const { data } = await axios.post(
				`${API_URL}/api/billing/super/legacy-announcement`,
				{ mode },
				{ withCredentials: true }
			)
			return data
		},
	})
}
