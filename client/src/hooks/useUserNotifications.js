import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

export const USER_NOTIFICATIONS_QUERY_KEY = ['userNotifications']

export function useUserNotifications({ enabled = true } = {}) {
	const queryClient = useQueryClient()

	const query = useQuery({
		queryKey: USER_NOTIFICATIONS_QUERY_KEY,
		queryFn: async () => {
			const { data } = await axios.get(`${API_URL}/api/notifications`, {
				params: { limit: 50 },
				withCredentials: true,
			})
			return data
		},
		enabled,
		staleTime: 20 * 1000,
		refetchInterval: 45 * 1000,
	})

	const markOneRead = useMutation({
		mutationFn: async (id) => {
			const { data } = await axios.patch(
				`${API_URL}/api/notifications/${encodeURIComponent(id)}/read`,
				{},
				{ withCredentials: true }
			)
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USER_NOTIFICATIONS_QUERY_KEY })
		},
	})

	const markAllRead = useMutation({
		mutationFn: async () => {
			const { data } = await axios.post(`${API_URL}/api/notifications/read-all`, {}, { withCredentials: true })
			return data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: USER_NOTIFICATIONS_QUERY_KEY })
		},
	})

	const items = query.data?.items ?? []
	const unread = query.data?.unread ?? 0

	return {
		items,
		unread,
		isLoading: query.isLoading,
		isError: query.isError,
		refetch: query.refetch,
		markOneRead: markOneRead.mutateAsync,
		markAllRead: markAllRead.mutateAsync,
		isMarking: markOneRead.isPending || markAllRead.isPending,
	}
}
