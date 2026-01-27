import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Get all QR codes for team
export const useTeamQRCodes = () => {
	return useQuery({
		queryKey: ['qrCodes'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/qr/team-codes`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	})
}

// Generate QR code
export const useGenerateQRCode = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (name) => {
			const response = await axios.post(
				`${API_URL}/api/qr/generate`,
				{ name },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['qrCodes'] })
		},
	})
}

// Delete QR code
export const useDeleteQRCode = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (id) => {
			const response = await axios.delete(`${API_URL}/api/qr/${id}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['qrCodes'] })
		},
	})
}

// Verify QR code (public)
export const useVerifyQRCode = (code) => {
	return useQuery({
		queryKey: ['qrCode', 'verify', code],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/qr/verify/${code}`)
			return response.data
		},
		enabled: !!code,
		retry: false,
	})
}

// Register time entry
export const useRegisterTimeEntry = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (code) => {
			const response = await axios.post(
				`${API_URL}/api/time-entry/register`,
				{ code },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['timeEntries'] })
			queryClient.invalidateQueries({ queryKey: ['workdays'] })
		},
	})
}

// Get today's time entries
export const useTodayTimeEntries = () => {
	return useQuery({
		queryKey: ['timeEntries', 'today'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/time-entry/today`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 30 * 1000, // 30 seconds
	})
}
