import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Query hook - pobieranie wszystkich użytkowników
export const useUsers = () => {
	return useQuery({
		queryKey: ['users'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/users/all-users`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // 5 minut - użytkownicy nie zmieniają się często
		cacheTime: 10 * 60 * 1000, // 10 minut
	})
}

// Query hook - pobieranie konkretnego użytkownika
export const useUser = (userId) => {
	return useQuery({
		queryKey: ['users', userId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/users/${userId}`, {
				withCredentials: true,
			})
			return response.data
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000,
		cacheTime: 10 * 60 * 1000,
	})
}

// Mutation - tworzenie użytkownika
export const useCreateUser = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (userData) => {
			const response = await axios.post(`${API_URL}/api/users/register`, userData, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: (data, variables) => {
			// Invaliduj listę użytkowników
			queryClient.invalidateQueries({ queryKey: ['users'] })
			// Invaliduj informacje o zespole jeśli teamId jest dostępne
			if (variables.teamId) {
				queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'info'] })
			} else {
				// Fallback: invaliduj wszystkie query team jeśli teamId nie jest dostępne
				queryClient.invalidateQueries({ queryKey: ['team'] })
			}
		},
	})
}

// Mutation - aktualizacja ról użytkownika
export const useUpdateUserRoles = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ userId, roles, department }) => {
			const response = await axios.patch(
				`${API_URL}/api/users/${userId}/roles`,
				{ roles, department },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (data, variables) => {
			// Invaliduj listę użytkowników, konkretnego użytkownika i profil użytkownika
			queryClient.invalidateQueries({ queryKey: ['users'] })
			queryClient.invalidateQueries({ queryKey: ['users', variables.userId] })
			queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
			// Invaliduj tablice zadań - mogą się zmienić po zmianie działu użytkownika
			queryClient.invalidateQueries({ queryKey: ['boards'] })
		},
	})
}

// Mutation - usuwanie użytkownika
export const useDeleteUser = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ userId, teamId }) => {
			const response = await axios.delete(`${API_URL}/api/users/${userId}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: (data, variables) => {
			// Invaliduj listę użytkowników
			queryClient.invalidateQueries({ queryKey: ['users'] })
			// Invaliduj informacje o zespole jeśli teamId jest dostępne
			if (variables.teamId) {
				queryClient.invalidateQueries({ queryKey: ['team', variables.teamId, 'info'] })
			} else {
				// Fallback: invaliduj wszystkie query team jeśli teamId nie jest dostępne
				queryClient.invalidateQueries({ queryKey: ['team'] })
			}
		},
	})
}

// Query hook - pobieranie profilu użytkownika (current user)
export const useUserProfile = () => {
	return useQuery({
		queryKey: ['user', 'profile'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/users/profile`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000,
		cacheTime: 10 * 60 * 1000,
	})
}

// Mutation - wysyłanie linku do ustawienia hasła
export const useResendPasswordLink = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (userId) => {
			const response = await axios.post(`${API_URL}/api/users/${userId}/resend-password-link`, {}, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})
}

// Mutation - wysyłanie emaila z przeprosinami
export const useSendApologyEmail = () => {
	return useMutation({
		mutationFn: async (userId) => {
			const response = await axios.post(`${API_URL}/api/users/${userId}/send-apology-email`, {}, {
				withCredentials: true,
			})
			return response.data
		},
	})
}

// Mutation - zmiana hasła
export const useChangePassword = () => {
	return useMutation({
		mutationFn: async ({ currentPassword, newPassword }) => {
			const response = await axios.post(`${API_URL}/api/users/change-password`, {
				currentPassword,
				newPassword,
			}, {
				withCredentials: true,
			})
			return response.data
		},
	})
}

// Mutation - aktualizacja pozycji użytkownika
export const useUpdatePosition = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (position) => {
			const response = await axios.put(`${API_URL}/api/users/update-position`, { position }, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			// Invaliduj profil użytkownika i całą listę użytkowników
			queryClient.invalidateQueries({ queryKey: ['user', 'profile'] })
			queryClient.invalidateQueries({ queryKey: ['users'] })
		},
	})
}

