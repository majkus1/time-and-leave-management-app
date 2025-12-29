import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config'

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
			// Remove the task from cache
			queryClient.removeQueries({ queryKey: ['task', taskId] })
		}
	})
}

// Get task comments
export const useTaskComments = (taskId) => {
	return useQuery({
		queryKey: ['taskComments', taskId],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/tasks/${taskId}/comments`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!taskId
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

