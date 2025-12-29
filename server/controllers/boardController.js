const { firmDb } = require('../db/db')
const Board = require('../models/Board')(firmDb)
const Task = require('../models/Task')(firmDb)
const User = require('../models/user')(firmDb)
const Team = require('../models/Team')(firmDb)
const Department = require('../models/Department')(firmDb)

// Helper function to create board for department
exports.createBoardForDepartment = async (teamId, departmentName) => {
	try {
		const boardName = `${departmentName} - Tablica zadań`
		// Find board regardless of isActive status - we'll reactivate if needed
		const existingBoard = await Board.findOne({ 
			teamId, 
			name: boardName,
			type: 'department'
		})
		
		if (!existingBoard) {
			// Get all users in the department
			const users = await User.find({ 
				teamId,
				$or: [
					{ department: departmentName },
					{ department: { $in: [departmentName] } }
				]
			}).select('_id')
			const memberIds = users.map(user => user._id)
			
			const newBoard = new Board({
				name: boardName,
				teamId,
				type: 'department',
				departmentName,
				description: `Tablica zadań dla działu ${departmentName}`,
				members: memberIds
			})
			await newBoard.save()
			return newBoard
		}
		
		// Get current users in the department to update members list
		const users = await User.find({ 
			teamId,
			$or: [
				{ department: departmentName },
				{ department: { $in: [departmentName] } }
			]
		}).select('_id')
		const memberIds = users.map(user => user._id)
		
		// If board exists but is inactive, reactivate it
		if (!existingBoard.isActive) {
			existingBoard.isActive = true
			existingBoard.members = memberIds
			await existingBoard.save()
		} else {
			// Even if board is active, update members list in case users were added/removed
			existingBoard.members = memberIds
			await existingBoard.save()
		}
		
		return existingBoard
	} catch (error) {
		console.error('Error creating board for department:', error)
		throw error
	}
}

// Helper function to create team board
exports.createTeamBoard = async (teamId) => {
	try {
		const team = await Team.findById(teamId)
		if (!team) {
			throw new Error('Team not found')
		}
		
		const boardName = `${team.name} - Tablica zadań`
		const existingBoard = await Board.findOne({ 
			teamId, 
			type: 'team',
			isActive: true
		})
		
		// Get all users in the team
		const allUsers = await User.find({ teamId }).select('_id')
		const memberIds = allUsers.map(user => user._id)
		
		if (!existingBoard) {
			const newBoard = new Board({
				name: boardName,
				teamId,
				type: 'team',
				description: `Tablica zadań dla całego zespołu ${team.name}`,
				members: memberIds,
				isActive: true,
				isTeamBoard: true
			})
			await newBoard.save()
			return newBoard
		} else {
			// Update existing board: sync members
			const existingMemberIds = existingBoard.members.map(m => m.toString())
			const newMembers = memberIds.filter(id => !existingMemberIds.includes(id.toString()))
			if (newMembers.length > 0) {
				existingBoard.members.push(...newMembers)
			}
			// Remove users who are no longer in the team
			existingBoard.members = existingBoard.members.filter(m => 
				memberIds.some(id => id.toString() === m.toString())
			)
			existingBoard.name = boardName
			existingBoard.description = `Tablica zadań dla całego zespołu ${team.name}`
			existingBoard.isTeamBoard = true
			await existingBoard.save()
			return existingBoard
		}
	} catch (error) {
		console.error('Error creating team board:', error)
		throw error
	}
}

// Get user's boards
exports.getUserBoards = async (req, res) => {
	try {
		const userId = req.user.userId
		const user = await User.findById(userId)
		if (!user) {
			return res.status(404).json({ message: 'User not found' })
		}

		const teamId = user.teamId
		if (!teamId) {
			return res.json([])
		}

		// Get user's departments to filter department boards
		const userDepartments = Array.isArray(user.department) ? user.department : (user.department ? [user.department] : [])
		
		// Build $or conditions - always include: user is member OR is team board
		const orConditions = [
			{ members: userId },
			{ isTeamBoard: true }
		]
		
		// Only include department boards where user belongs to that department
		if (userDepartments.length > 0) {
			orConditions.push({
				type: 'department',
				departmentName: { $in: userDepartments }
			})
		}
		
		// Get all boards where user is a member OR is team board OR is department board for user's departments
		const boards = await Board.find({
			teamId,
			isActive: true,
			$or: orConditions
		}).populate('members', 'username firstName lastName').sort({ createdAt: -1 })

		// Filter department boards - only show boards for departments that exist, have users, and user belongs to
		const filteredBoards = await Promise.all(
			boards.map(async (board) => {
				if (board.type === 'department' && board.departmentName) {
					// Check if user belongs to this department
					if (!userDepartments.includes(board.departmentName)) {
						return null
					}
					
					const departmentExists = await Department.findOne({ 
						name: board.departmentName, 
						teamId, 
						isActive: true 
					}).lean()
					
					if (!departmentExists) return null
					
					const userCount = await User.countDocuments({
						teamId,
						$or: [
							{ department: board.departmentName },
							{ department: { $in: [board.departmentName] } }
						]
					})
					
					return userCount > 0 ? board : null
				}
				return board
			})
		)

		res.json(filteredBoards.filter(Boolean))
	} catch (error) {
		console.error('Error getting user boards:', error)
		res.status(500).json({ message: 'Error getting boards' })
	}
}

// Get board by ID
exports.getBoard = async (req, res) => {
	try {
		const { boardId } = req.params
		const userId = req.user.userId

		const board = await Board.findById(boardId).populate('members', 'username firstName lastName')
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		// Check if user has access
		const isMember = board.members.some(m => m._id.toString() === userId)
		const isTeamBoard = board.isTeamBoard
		const isDepartmentBoard = board.type === 'department'

		if (!isMember && !isTeamBoard && !isDepartmentBoard) {
			return res.status(403).json({ message: 'Access denied' })
		}

		res.json(board)
	} catch (error) {
		console.error('Error getting board:', error)
		res.status(500).json({ message: 'Error getting board' })
	}
}

// Get board members
exports.getBoardUsers = async (req, res) => {
	try {
		const { boardId } = req.params
		const userId = req.user.userId

		const board = await Board.findById(boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		// Check if user has access
		const isMember = board.members.some(m => m.toString() === userId)
		const isTeamBoard = board.isTeamBoard
		const isDepartmentBoard = board.type === 'department'

		if (!isMember && !isTeamBoard && !isDepartmentBoard) {
			return res.status(403).json({ message: 'Access denied' })
		}

		// For team boards, get all team users
		if (isTeamBoard) {
			const users = await User.find({ teamId: board.teamId })
				.select('firstName lastName username position')
				.sort({ firstName: 1, lastName: 1 })
			return res.json(users)
		}

		// For department boards, get users from that department
		if (isDepartmentBoard && board.departmentName) {
			const users = await User.find({
				teamId: board.teamId,
				$or: [
					{ department: board.departmentName },
					{ department: { $in: [board.departmentName] } }
				]
			}).select('firstName lastName username position').sort({ firstName: 1, lastName: 1 })
			return res.json(users)
		}

		// For custom boards, get members
		const users = await User.find({ _id: { $in: board.members } })
			.select('firstName lastName username position')
			.sort({ firstName: 1, lastName: 1 })

		res.json(users)
	} catch (error) {
		console.error('Error getting board users:', error)
		res.status(500).json({ message: 'Error getting board users' })
	}
}

// Create custom board
exports.createBoard = async (req, res) => {
	try {
		const { name, description, memberIds } = req.body
		const userId = req.user.userId
		const user = await User.findById(userId)
		
		if (!user || !user.teamId) {
			return res.status(400).json({ message: 'User team not found' })
		}

		if (!name || !name.trim()) {
			return res.status(400).json({ message: 'Board name is required' })
		}

		// Ensure creator is included in members
		const members = memberIds && Array.isArray(memberIds) ? [...memberIds] : []
		if (!members.includes(userId)) {
			members.push(userId)
		}

		// Verify all members are from the same team
		const membersUsers = await User.find({ 
			_id: { $in: members },
			teamId: user.teamId 
		})
		
		if (membersUsers.length !== members.length) {
			return res.status(400).json({ message: 'All members must be from the same team' })
		}

		const newBoard = new Board({
			name: name.trim(),
			description: description || '',
			teamId: user.teamId,
			type: 'custom',
			members: members,
			createdBy: userId,
			isTeamBoard: false
		})

		await newBoard.save()
		const populatedBoard = await Board.findById(newBoard._id).populate('members', 'username firstName lastName')

		res.status(201).json(populatedBoard)
	} catch (error) {
		console.error('Error creating board:', error)
		res.status(500).json({ message: 'Error creating board' })
	}
}

// Update board
exports.updateBoard = async (req, res) => {
	try {
		const { boardId } = req.params
		const { name, description, memberIds } = req.body
		const userId = req.user.userId

		const board = await Board.findById(boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		// Check permissions: only Admin or creator can update
		const isAdmin = req.user.roles && req.user.roles.includes('Admin')
		const isCreator = board.createdBy && board.createdBy.toString() === userId

		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or board creator can update board' })
		}

		// Don't allow updating team boards
		if (board.isTeamBoard) {
			return res.status(403).json({ message: 'Team board cannot be modified' })
		}

		// Don't allow updating department boards
		if (board.type === 'department') {
			return res.status(403).json({ message: 'Department board cannot be modified' })
		}

		if (name && name.trim()) {
			board.name = name.trim()
		}
		if (description !== undefined) {
			board.description = description
		}
		if (memberIds && Array.isArray(memberIds)) {
			const user = await User.findById(userId)
			// Verify all members are from the same team
			const membersUsers = await User.find({ 
				_id: { $in: memberIds },
				teamId: user.teamId 
			})
			
			if (membersUsers.length !== memberIds.length) {
				return res.status(400).json({ message: 'All members must be from the same team' })
			}
			board.members = memberIds
		}

		await board.save()
		const populatedBoard = await Board.findById(board._id).populate('members', 'username firstName lastName')

		res.json(populatedBoard)
	} catch (error) {
		console.error('Error updating board:', error)
		res.status(500).json({ message: 'Error updating board' })
	}
}

// Delete board
exports.deleteBoard = async (req, res) => {
	try {
		const { boardId } = req.params
		const userId = req.user.userId

		const board = await Board.findById(boardId)
		if (!board) {
			return res.status(404).json({ message: 'Board not found' })
		}

		// Check permissions: only Admin or creator can delete
		const isAdmin = req.user.roles && req.user.roles.includes('Admin')
		const isCreator = board.createdBy && board.createdBy.toString() === userId

		if (!isAdmin && !isCreator) {
			return res.status(403).json({ message: 'Only Admin or board creator can delete board' })
		}

		// Don't allow deleting team boards
		if (board.isTeamBoard) {
			return res.status(403).json({ message: 'Team board cannot be deleted' })
		}

		// Don't allow deleting department boards
		if (board.type === 'department') {
			return res.status(403).json({ message: 'Department board cannot be deleted' })
		}

		// Soft delete: mark as inactive and delete all tasks
		board.isActive = false
		await board.save()

		// Delete all tasks in this board
		await Task.updateMany({ boardId }, { isActive: false })

		res.json({ message: 'Board deleted successfully' })
	} catch (error) {
		console.error('Error deleting board:', error)
		res.status(500).json({ message: 'Error deleting board' })
	}
}



