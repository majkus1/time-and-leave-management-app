import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'
import { useSocket } from '../context/SocketContext'

// Get user's boards
export const useBoards = () => {
	return useQuery({
		queryKey: ['boards'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards`, {
				withCredentials: true
			})
			return response.data
		}
	})
}

// Get board by ID
export const useBoard = (boardId) => {
	return useQuery({
		queryKey: ['board', boardId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/${boardId}`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!boardId
	})
}

// Get tasks for a board
export const useBoardTasks = (boardId) => {
	return useQuery({
		queryKey: ['boardTasks', boardId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/${boardId}/tasks`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!boardId
	})
}

/** Zadania z terminami na kalendarz (wszystkie dostępne tablice lub jedna). */
export const useCalendarTasks = (year, month, boardId, { enabled = true } = {}) => {
	return useQuery({
		queryKey: ['boardCalendarTasks', year, month, boardId ?? 'all'],
		queryFn: async () => {
			const params = { year, month }
			if (boardId) params.boardId = boardId
			const response = await axios.get(`${API_URL}/api/boards/calendar/tasks`, {
				withCredentials: true,
				params,
			})
			return response.data?.tasks ?? []
		},
		enabled: enabled && typeof year === 'number' && typeof month === 'number' && month >= 1 && month <= 12,
		staleTime: 30 * 1000,
	})
}

// Get task by ID
export const useTask = (taskId) => {
	return useQuery({
		queryKey: ['task', taskId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/tasks/${taskId}`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!taskId
	})
}

// Get board users
export const useBoardUsers = (boardId, enabled = true) => {
	return useQuery({
		queryKey: ['boardUsers', boardId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/${boardId}/users`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: enabled && !!boardId,
		staleTime: 5 * 1000, // 5 seconds - users can change frequently
		refetchInterval: 30 * 1000 // Refetch every 30 seconds for real-time updates
	})
}

// Create board
export const useCreateBoard = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (data) => {
			const response = await axios.post(`${API_URL}/api/boards`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['boards'] })
		}
	})
}

// Update board
export const useUpdateBoard = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ boardId, data }) => {
			const response = await axios.put(`${API_URL}/api/boards/${boardId}`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['boards'] })
			queryClient.invalidateQueries({ queryKey: ['board', variables.boardId] })
		}
	})
}

// Delete board
export const useDeleteBoard = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (boardId) => {
			const response = await axios.delete(`${API_URL}/api/boards/${boardId}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['boards'] })
		}
	})
}

// Create task
export const useCreateTask = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ boardId, data }) => {
			const response = await axios.post(`${API_URL}/api/boards/${boardId}/tasks`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['boardTasks', variables.boardId] })
			queryClient.invalidateQueries({ queryKey: ['boardCalendarTasks'] })
		}
	})
}

// Update task
export const useUpdateTask = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ taskId, data }) => {
			const response = await axios.put(`${API_URL}/api/boards/tasks/${taskId}`, data, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['boardTasks', data.boardId] })
			queryClient.invalidateQueries({ queryKey: ['task', data._id] })
			queryClient.invalidateQueries({ queryKey: ['boardCalendarTasks'] })
			// Refetch the specific task to get updated data
			queryClient.refetchQueries({ queryKey: ['task', data._id] })
		}
	})
}

// Update task status (for drag and drop)
export const useUpdateTaskStatus = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ taskId, status, order }) => {
			const response = await axios.patch(`${API_URL}/api/boards/tasks/${taskId}/status`, {
				status,
				order
			}, {
				withCredentials: true
			})
			return { ...response.data, taskId }
		},
		onSuccess: (data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['boardTasks', data.boardId] })
			queryClient.invalidateQueries({ queryKey: ['boardCalendarTasks'] })
			// Invalidate single task cache so modal shows updated status
			const taskIdToInvalidate = data._id || variables.taskId
			queryClient.invalidateQueries({ queryKey: ['task', taskIdToInvalidate] })
		}
	})
}

// Delete task
export const useDeleteTask = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (taskId) => {
			const response = await axios.delete(`${API_URL}/api/boards/tasks/${taskId}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, taskId) => {
			queryClient.invalidateQueries({ queryKey: ['boardTasks'] })
			queryClient.invalidateQueries({ queryKey: ['boardCalendarTasks'] })
			// Remove the task from cache
			queryClient.removeQueries({ queryKey: ['task', taskId] })
		}
	})
}

// Get task comments
export const useTaskComments = (taskId, options = {}) => {
	const { enabled = true, isModalOpen = false } = options
	return useQuery({
		queryKey: ['taskComments', taskId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/tasks/${taskId}/comments`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: enabled && !!taskId,
		refetchOnMount: 'always',
		refetchOnWindowFocus: isModalOpen,
		// Safety net: if a socket event is missed, modal still self-heals quickly.
		refetchInterval: isModalOpen ? 5000 : false
	})
}

// Create comment
export const useCreateComment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ taskId, content }) => {
			const response = await axios.post(`${API_URL}/api/boards/tasks/${taskId}/comments`, {
				content
			}, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: ['taskComments', variables.taskId] })
		}
	})
}

// Delete comment
export const useDeleteComment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (commentId) => {
			const response = await axios.delete(`${API_URL}/api/boards/comments/${commentId}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['taskComments'] })
		}
	})
}

// Upload task attachment
export const useUploadTaskAttachment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ taskId, file }) => {
			const formData = new FormData()
			formData.append('file', file)
			const response = await axios.post(`${API_URL}/api/boards/tasks/${taskId}/attachments`, formData, {
				withCredentials: true,
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			return response.data
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['task', data._id] })
			queryClient.invalidateQueries({ queryKey: ['boardTasks'] })
			// Refetch the specific task to get updated data
			queryClient.refetchQueries({ queryKey: ['task', data._id] })
		}
	})
}

// Delete task attachment
export const useDeleteTaskAttachment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ taskId, attachmentIndex }) => {
			const response = await axios.delete(`${API_URL}/api/boards/tasks/${taskId}/attachments/${attachmentIndex}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ['task', data._id] })
			queryClient.invalidateQueries({ queryKey: ['boardTasks'] })
			// Refetch the specific task to get updated data
			queryClient.refetchQueries({ queryKey: ['task', data._id] })
		}
	})
}

// Upload comment attachment
export const useUploadCommentAttachment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ commentId, file }) => {
			const formData = new FormData()
			formData.append('file', file)
			const response = await axios.post(`${API_URL}/api/boards/comments/${commentId}/attachments`, formData, {
				withCredentials: true,
				headers: {
					'Content-Type': 'multipart/form-data'
				}
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['taskComments'] })
		}
	})
}

// Delete comment attachment
export const useDeleteCommentAttachment = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async ({ commentId, attachmentIndex }) => {
			const response = await axios.delete(`${API_URL}/api/boards/comments/${commentId}/attachments/${attachmentIndex}`, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['taskComments'] })
		}
	})
}

// Board/task notifications (unread)
export const useBoardsUnreadSummary = ({ enabled = true } = {}) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	const query = useQuery({
		queryKey: ['boardsUnreadSummary'],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/unread-summary`, {
				withCredentials: true
			})
			return response.data || { totalUnread: 0, unreadBoardsCount: 0, byBoard: {} }
		},
		enabled,
		staleTime: 10 * 1000,
		refetchInterval: enabled ? 30 * 1000 : false,
	})

	useEffect(() => {
		if (!socket || !enabled) return
		const handleRealtimeUpdate = () => {
			queryClient.invalidateQueries({ queryKey: ['boardsUnreadSummary'] })
			queryClient.invalidateQueries({ queryKey: ['boardUnreadSummary'] })
		}
		socket.on('task-notification-updated', handleRealtimeUpdate)
		return () => {
			socket.off('task-notification-updated', handleRealtimeUpdate)
		}
	}, [socket, enabled, queryClient])

	return query
}

export const useBoardUnreadSummary = (boardId, { enabled = true } = {}) => {
	const queryClient = useQueryClient()
	const { socket } = useSocket()

	const query = useQuery({
		queryKey: ['boardUnreadSummary', boardId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/${boardId}/unread-summary`, {
				withCredentials: true
			})
			return response.data || { boardId, unreadCount: 0, unreadByTask: {} }
		},
		enabled: enabled && !!boardId,
		staleTime: 5 * 1000,
		refetchInterval: 20 * 1000,
	})

	useEffect(() => {
		if (!socket || !enabled || !boardId) return
		const handleRealtimeUpdate = (payload) => {
			if (payload?.boardId && payload.boardId !== boardId) return
			queryClient.invalidateQueries({ queryKey: ['boardUnreadSummary', boardId] })
			queryClient.invalidateQueries({ queryKey: ['boardsUnreadSummary'] })
		}
		socket.on('task-notification-updated', handleRealtimeUpdate)
		return () => {
			socket.off('task-notification-updated', handleRealtimeUpdate)
		}
	}, [socket, enabled, boardId, queryClient])

	return query
}

export const useMarkBoardViewed = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (boardId) => {
			const response = await axios.post(`${API_URL}/api/boards/${boardId}/mark-viewed`, {}, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: (_, boardId) => {
			queryClient.invalidateQueries({ queryKey: ['boardsUnreadSummary'] })
			queryClient.invalidateQueries({ queryKey: ['boardUnreadSummary', boardId] })
		}
	})
}

export const useMarkTaskViewed = () => {
	const queryClient = useQueryClient()
	return useMutation({
		mutationFn: async (taskId) => {
			const response = await axios.post(`${API_URL}/api/boards/tasks/${taskId}/mark-viewed`, {}, {
				withCredentials: true
			})
			return response.data
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['boardsUnreadSummary'] })
			queryClient.invalidateQueries({ queryKey: ['boardUnreadSummary'] })
		}
	})
}
