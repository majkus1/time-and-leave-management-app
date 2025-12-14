import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie ticketów użytkownika
export const useTickets = () => {
	return useQuery({
		queryKey: ['tickets', 'my'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/tickets/my-tickets`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 1 * 60 * 1000, // 1 minuta - tickety mogą się często zmieniać
		cacheTime: 5 * 60 * 1000,
	})
}

// Query hook - pobieranie konkretnego ticketu
export const useTicket = (ticketId) => {
	return useQuery({
		queryKey: ['tickets', ticketId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/tickets/${ticketId}`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled: !!ticketId,
		staleTime: 1 * 60 * 1000,
		cacheTime: 5 * 60 * 1000,
	})
}

// Mutation - tworzenie ticketu
export const useCreateTicket = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (formData) => {
			const response = await axios.post(`${API_URL}/api/tickets/create`, formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['tickets'] })
		},
	})
}

// Mutation - odpowiedź na ticket
export const useReplyToTicket = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ ticketId, formData }) => {
			const response = await axios.post(
				`${API_URL}/api/tickets/${ticketId}/reply`,
				formData,
				{
					headers: { 'Content-Type': 'multipart/form-data' },
					withCredentials: true,
				}
			)
			return response.data
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['tickets'] })
			queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId] })
		},
	})
}

// Mutation - aktualizacja statusu ticketu
export const useUpdateTicketStatus = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ ticketId, status }) => {
			const response = await axios.patch(
				`${API_URL}/api/tickets/${ticketId}/status`,
				{ status },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['tickets'] })
			queryClient.invalidateQueries({ queryKey: ['tickets', variables.ticketId] })
		},
	})
}

