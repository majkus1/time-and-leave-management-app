import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'
import { useSocket } from '../context/SocketContext'

const ANNOUNCEMENTS_UPDATED_EVENT = 'announcements-updated'
const ANNOUNCEMENTS_UNREAD_COUNT_QUERY_KEY = ['announcementsUnreadCount']

export const useAnnouncements = () => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket) return

		const handleAnnouncementsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ['announcements'] })
			queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_UNREAD_COUNT_QUERY_KEY })
		}

		socket.on(ANNOUNCEMENTS_UPDATED_EVENT, handleAnnouncementsUpdated)
		return () => {
			socket.off(ANNOUNCEMENTS_UPDATED_EVENT, handleAnnouncementsUpdated)
		}
	}, [socket, queryClient])

	return useQuery({
		queryKey: ['announcements'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/announcements`, {
				withCredentials: true,
			})
			return response.data
		},
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000,
	})
}

export const useAnnouncementsUnreadCount = ({ enabled = true } = {}) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	useEffect(() => {
		if (!socket || !enabled) return

		const handleAnnouncementsUpdated = () => {
			queryClient.invalidateQueries({ queryKey: ANNOUNCEMENTS_UNREAD_COUNT_QUERY_KEY })
		}

		socket.on(ANNOUNCEMENTS_UPDATED_EVENT, handleAnnouncementsUpdated)
		return () => {
			socket.off(ANNOUNCEMENTS_UPDATED_EVENT, handleAnnouncementsUpdated)
		}
	}, [socket, queryClient, enabled])

	return useQuery({
		queryKey: ANNOUNCEMENTS_UNREAD_COUNT_QUERY_KEY,
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/announcements/unread-count`, {
				withCredentials: true,
			})
			return response.data?.unreadCount || 0
		},
		enabled,
		staleTime: 10 * 1000,
		refetchInterval: 30 * 1000,
	})
}

export const useCreateAnnouncement = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async ({ title, content, targetScope, targetDepartment, targetUsers, attachments }) => {
			const formData = new FormData()
			formData.append('title', title)
			formData.append('content', content)
			formData.append('targetScope', targetScope)
			if (targetDepartment) {
				formData.append('targetDepartment', targetDepartment)
			}
			if (Array.isArray(targetUsers) && targetUsers.length > 0) {
				formData.append('targetUsers', JSON.stringify(targetUsers))
			}
			if (Array.isArray(attachments)) {
				attachments.forEach((file) => {
					formData.append('attachments', file)
				})
			}

			const response = await axios.post(`${API_URL}/api/announcements`, formData, {
				withCredentials: true,
				headers: { 'Content-Type': 'multipart/form-data' },
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['announcements'] })
		},
	})
}

export const useDeleteAnnouncement = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async (announcementId) => {
			const response = await axios.delete(`${API_URL}/api/announcements/${announcementId}`, {
				withCredentials: true,
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['announcements'] })
		},
	})
}

export const useMarkAnnouncementsSeen = () => {
	const queryClient = useQueryClient()

	return useMutation({
		mutationFn: async () => {
			const response = await axios.post(
				`${API_URL}/api/announcements/mark-seen`,
				{},
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.setQueryData(ANNOUNCEMENTS_UNREAD_COUNT_QUERY_KEY, 0)
		},
	})
}
