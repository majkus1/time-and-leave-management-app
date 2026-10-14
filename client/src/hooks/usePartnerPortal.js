import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

const opts = { withCredentials: true }

/** Czy zespół zalogowanego Admina/HR jest zespołem partnera — steruje linkiem „Program partnerski” w menu */
export function usePartnerMe({ enabled = true } = {}) {
	return useQuery({
		queryKey: ['partner', 'me'],
		queryFn: async () => (await axios.get(`${API_URL}/api/partner/me`, opts)).data,
		enabled,
		staleTime: 10 * 60 * 1000,
		retry: false,
	})
}

export function usePartnerOverview() {
	return useQuery({
		queryKey: ['partner', 'overview'],
		queryFn: async () => (await axios.get(`${API_URL}/api/partner/overview`, opts)).data,
		staleTime: 60 * 1000,
		retry: false,
	})
}

/** Pozycje prowizji z wybranego miesiąca ('' = wszystkie) */
export function usePartnerEntries(month) {
	return useQuery({
		queryKey: ['partner', 'entries', month || 'all'],
		queryFn: async () => (await axios.get(`${API_URL}/api/partner/entries`, { params: month ? { month } : {}, ...opts })).data,
		staleTime: 60 * 1000,
		retry: false,
	})
}
