import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { API_URL } from '../config.js'
import { useBoards } from './useBoards'
import { useBoardTasks } from './useBoards'

// Get all tasks assigned to user from all boards
export const useUserTasks = () => {
	const { data: boards = [] } = useBoards()

	// Get tasks for all boards
	const boardQueries = boards.map(board => ({
		queryKey: ['boardTasks', board._id],
		queryFn: async () => {
			const response = await axios.get(`${API_URL}/api/boards/${board._id}/tasks`, {
				withCredentials: true
			})
			return response.data
		},
		enabled: !!board._id
	}))

	// Combine all board tasks and filter by assignedTo
	return useQuery({
		queryKey: ['userTasks'],
		queryFn: async () => {
			// Fetch tasks from all boards
			const allTasksPromises = boards.map(board =>
				axios.get(`${API_URL}/api/boards/${board._id}/tasks`, {
					withCredentials: true
				})
			)

			const allTasksResponses = await Promise.all(allTasksPromises)
			const allTasks = allTasksResponses.flatMap(response => response.data)

			// Get current user ID from auth context (we'll need to pass it or get it from API)
			// For now, we'll filter on the client side
			return allTasks
		},
		enabled: boards.length > 0,
		staleTime: 2 * 60 * 1000, // 2 minutes
	})
}

// Simplified version - get tasks from user's boards and filter client-side
export const useUserTasksSimple = (userId) => {
	const { data: boards = [], isLoading: boardsLoading } = useBoards()

	// Get tasks for all boards
	const tasksQueries = boards.map(board => useBoardTasks(board._id))

	const allTasks = tasksQueries
		.map(query => query.data || [])
		.flat()
		.filter(task => {
			if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false
			return task.assignedTo.some(assignedUser => {
				const assignedId = typeof assignedUser === 'object' ? assignedUser._id : assignedUser
				return assignedId === userId
			})
		})

	return {
		data: allTasks,
		isLoading: boardsLoading || tasksQueries.some(q => q.isLoading),
		refetch: () => {
			tasksQueries.forEach(q => q.refetch())
		}
	}
}
