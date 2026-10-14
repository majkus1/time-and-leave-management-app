import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

const opts = { withCredentials: true }

// ——— firma: powiązania z biurem rachunkowym (Admin) ———

export function useCompanyOfficeLinks({ enabled = true } = {}) {
	return useQuery({
		queryKey: ['office-links'],
		queryFn: async () => (await axios.get(`${API_URL}/api/office-links`, opts)).data,
		enabled,
		retry: false,
	})
}

export function useCompanyOfficeAction() {
	const queryClient = useQueryClient()
	return useMutation({
		/** action: connect ({ code, consent }) | accept ({ id, consent }) | end ({ id }) */
		mutationFn: async ({ action, id, ...body }) => {
			const url = action === 'connect' ? `${API_URL}/api/office-links/connect` : `${API_URL}/api/office-links/${id}/${action}`
			return (await axios.post(url, body, opts)).data
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['office-links'] }),
	})
}

// ——— biuro: panel (Admin/HR zespołu-biura) ———

export function useOfficeMe({ enabled = true } = {}) {
	return useQuery({
		queryKey: ['biuro', 'me'],
		queryFn: async () => (await axios.get(`${API_URL}/api/biuro/me`, opts)).data,
		enabled,
		staleTime: 10 * 60 * 1000,
		retry: false,
	})
}

export function useOfficeClients() {
	return useQuery({
		queryKey: ['biuro', 'clients'],
		queryFn: async () => (await axios.get(`${API_URL}/api/biuro/clients`, opts)).data,
		retry: false,
	})
}

/** month: 0–11 jak w kalendarzach aplikacji */
export function useOfficeClientMonth(clientTeamId, year, month) {
	return useQuery({
		queryKey: ['biuro', 'month', clientTeamId, year, month],
		queryFn: async () =>
			(await axios.get(`${API_URL}/api/biuro/clients/${clientTeamId}/month`, { params: { year: String(year), month: String(month) }, ...opts })).data,
		enabled: Boolean(clientTeamId),
		staleTime: 60 * 1000,
		retry: false,
	})
}

export function useOfficeAction() {
	const queryClient = useQueryClient()
	return useMutation({
		/** action: invite ({ email }) | end ({ id }) */
		mutationFn: async ({ action, id, ...body }) => {
			const url = action === 'invite' ? `${API_URL}/api/biuro/invites` : `${API_URL}/api/biuro/links/${id}/end`
			return (await axios.post(url, body, opts)).data
		},
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ['biuro'] }),
	})
}
