import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'

// Get user channels
export const useChannels = () => {
	return useQuery({
		queryKey: ['channels'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/chat/channels`, {
				withCredentials: true
			})
			return response.data
		},
		staleTime: 30 * 1000, // 30 seconds
		refetchInterval: 60 * 1000 // Refetch every minute
	})
}

// Get messages for a channel
export const useChannelMessages = (channelId, enabled = true) => {
	return useQuery({
		queryKey: ['messages', channelId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/chat/channels/${channelId}/messages`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: enabled && !!channelId,
		staleTime: 10 * 1000, // 10 seconds
		refetchInterval: 30 * 1000 // Refetch every 30 seconds
	})
}

// Send message mutation
export const useSendMessage = () => {
	const queryClient = useQueryClient()
	
	return useMutation({
		mutationFn: async ({ channelId, content }) => {
			const response = await axios.post(
				`${API_URL}/api/chat/messages`,
				{ channelId, content },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: (data, variables) => {
			// Invalidate messages query to refetch
			queryClient.invalidateQueries({ queryKey: ['messages', variables.channelId] })
			// Also invalidate channels to update unread counts
			queryClient.invalidateQueries({ queryKey: ['channels'] })
			queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
		}
	})
}

// Get unread count
export const useUnreadCount = ({ enabled = true } = {}) => {
	return useQuery({
		queryKey: ['unreadCount'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/chat/unread-count`, {
				withCredentials: true
			})
			return response.data.unreadCount || 0
		},
		enabled,
		staleTime: 10 * 1000, // 10 seconds
		refetchInterval: 30 * 1000 // Refetch every 30 seconds
	})
}

// Get team members
export const useTeamMembers = () => {
	return useQuery({
		queryKey: ['teamMembers'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/chat/team-members`, {
				withCredentials: true
			})
			return response.data
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
		cacheTime: 10 * 60 * 1000
	})
}

// Create channel mutation
export const useCreateChannel = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ name, type, description, memberIds }) => {
			const response = await axios.post(
				`${API_URL}/api/chat/channels`,
				{ name, type, description, memberIds },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			// Invalidate and refetch channels immediately
			queryClient.invalidateQueries({ queryKey: ['channels'] })
			queryClient.refetchQueries({ queryKey: ['channels'] })
		}
	})
}

// Add members to channel mutation
export const useAddMembersToChannel = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ channelId, memberIds }) => {
			const response = await axios.post(
				`${API_URL}/api/chat/channels/${channelId}/members`,
				{ memberIds },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['channels'] })
		}
	})
}

// Create private chat mutation
export const useCreatePrivateChat = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ userId }) => {
			const response = await axios.post(
				`${API_URL}/api/chat/private-chat`,
				{ userId },
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['channels'] })
		}
	})
}

// Remove members from channel mutation
export const useRemoveMembersFromChannel = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ channelId, memberIds }) => {
			const response = await axios.delete(
				`${API_URL}/api/chat/channels/${channelId}/members`,
				{ 
					data: { memberIds },
					withCredentials: true 
				}
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['channels'] })
		}
	})
}

// Delete channel mutation
export const useDeleteChannel = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ channelId }) => {
			const response = await axios.delete(
				`${API_URL}/api/chat/channels/${channelId}`,
				{ withCredentials: true }
			)
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['channels'] })
			queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
		}
	})
}

