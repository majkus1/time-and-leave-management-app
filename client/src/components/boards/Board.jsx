import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Sidebar from '../dashboard/Sidebar'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import Loader from '../Loader'
import { useBoard, useBoardTasks, useCreateTask, useUpdateTaskStatus, useDeleteTask } from '../../hooks/useBoards'
import { useQueryClient } from '@tanstack/react-query'
import TaskCard from './TaskCard'
import CreateTaskModal from './CreateTaskModal'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, useDroppable, DragOverlay } from '@dnd-kit/core'
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'

const STATUSES = [
	{ id: 'todo', label: 'Do zrobienia', color: '#e74c3c' },
	{ id: 'in-progress', label: 'W trakcie', color: '#f39c12' },
	{ id: 'review', label: 'Do sprawdzenia', color: '#3498db' },
	{ id: 'done', label: 'Gotowe', color: '#27ae60' }
]

function Column({ status, tasks, onTaskClick, onDeleteTask }) {
	const { t } = useTranslation()
	const { setNodeRef } = useDroppable({
		id: status.id
	})
	
	const statusLabel = t(`boards.status.${status.id}`) || status.label

	return (
		<div
			ref={setNodeRef}
			style={{
				width: '100%',
				backgroundColor: '#f8f9fa',
				borderRadius: '8px',
				padding: '16px',
				margin: '0 0px'
			}} className='card-list-box-task'>
			<div style={{
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'space-between',
				marginBottom: '16px',
				paddingBottom: '12px',
				borderBottom: `3px solid ${status.color}`
			}}>
				<h3 style={{
					color: '#2c3e50',
					fontSize: '18px',
					fontWeight: '600',
					margin: 0
				}}>
					{statusLabel}
				</h3>
				<span style={{
					backgroundColor: status.color,
					color: 'white',
					borderRadius: '12px',
					padding: '4px 10px',
					fontSize: '12px',
					fontWeight: '600'
				}}>
					{tasks.length}
				</span>
			</div>
			<SortableContext items={tasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
				<div style={{ minHeight: '100px', width: '100%' }}>
					{tasks.length === 0 ? (
						<div style={{
							padding: '20px',
							textAlign: 'center',
							color: '#95a5a6',
							fontSize: '14px'
						}}>
							{t('boards.noTasks') || 'Brak zadań'}
						</div>
					) : (
						tasks.map((task) => (
							<TaskCard
								key={task._id}
								task={task}
								onClick={() => onTaskClick(task)}
								onDelete={() => onDeleteTask(task._id)}
							/>
						))
					)}
				</div>
			</SortableContext>
		</div>
	)
}

function Board() {
	const { boardId } = useParams()
	const navigate = useNavigate()
	const { t } = useTranslation()
	const { userId, role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const { data: board, isLoading: loadingBoard } = useBoard(boardId)
	const { data: tasks = [], isLoading: loadingTasks, refetch: refetchTasks } = useBoardTasks(boardId)
	const createTaskMutation = useCreateTask()
	const updateTaskStatusMutation = useUpdateTaskStatus()
	const deleteTaskMutation = useDeleteTask()
	const queryClient = useQueryClient()
	
	const [selectedTask, setSelectedTask] = useState(null)
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
	const [createTaskStatus, setCreateTaskStatus] = useState('todo')
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
	const [activeId, setActiveId] = useState(null)

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 768)
		}
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [])

	const isAdmin = role && role.includes('Admin')
	const canEdit = board && (isAdmin || (board.createdBy && board.createdBy._id === userId))

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		})
	)

	const handleDragStart = (event) => {
		setActiveId(event.active.id)
	}

	const handleDragEnd = async (event) => {
		const { active, over } = event
		
		setActiveId(null)

		if (!over) return

		const activeTask = tasks.find(t => t._id === active.id)
		if (!activeTask) return

		// Check if dropped on another task
		const overTask = tasks.find(t => t._id === over.id)
		
		let newStatus = activeTask.status
		let newOrder = activeTask.order || 0

		if (overTask) {
			// Dropped on another task - use that task's status and insert before it
			newStatus = overTask.status
			newOrder = overTask.order || 0
		} else {
			// Dropped on column - check if over.id is a status ID
			if (STATUSES.some(s => s.id === over.id)) {
				newStatus = over.id
			} else {
				// Try to find column by checking parent elements
				const dropElement = document.elementFromPoint(
					event.activatorEvent?.clientX || window.innerWidth / 2,
					event.activatorEvent?.clientY || window.innerHeight / 2
				)
				const columnElement = dropElement?.closest('[data-column-id]')
				if (columnElement) {
					newStatus = columnElement.getAttribute('data-column-id')
				}
			}

			if (newStatus && newStatus !== activeTask.status) {
				// Get tasks in the new status column (excluding the dragged task)
				const newStatusTasks = tasks.filter(t => t.status === newStatus && t._id !== activeTask._id)
				newOrder = newStatusTasks.length > 0 
					? Math.max(...newStatusTasks.map(t => t.order || 0)) + 1 
					: 0
			}
		}

		if (newStatus === activeTask.status && newOrder === activeTask.order) return

		// Optimistic update - immediately update the cache
		queryClient.setQueryData(['boardTasks', boardId], (oldTasks = []) => {
			return oldTasks.map(task => 
				task._id === activeTask._id 
					? { ...task, status: newStatus, order: newOrder }
					: task
			)
		})

		try {
			await updateTaskStatusMutation.mutateAsync({
				taskId: activeTask._id,
				status: newStatus,
				order: newOrder
			})
			// Refetch to ensure data is in sync with server
			refetchTasks()
		} catch (error) {
			// Revert optimistic update on error
			refetchTasks()
			await showAlert(error.response?.data?.message || t('boards.updateError') || 'Błąd podczas aktualizacji zadania')
		}
	}

	const handleDeleteTask = async (taskId) => {
		const confirmed = await showConfirm(
			t('boards.deleteTaskConfirm') || 'Czy na pewno chcesz usunąć to zadanie?'
		)
		if (!confirmed) return

		try {
			await deleteTaskMutation.mutateAsync(taskId)
			await showAlert(t('boards.deleteTaskSuccess') || 'Zadanie zostało usunięte pomyślnie')
			refetchTasks()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.deleteTaskError') || 'Błąd podczas usuwania zadania')
		}
	}

	if (loadingBoard || loadingTasks) {
		return (
			<>
				<Sidebar />
				<div className="content-with-loader">
					<Loader />
				</div>
			</>
		)
	}

	if (!board) {
		return (
			<>
				<Sidebar />
				<div style={{ padding: '20px', textAlign: 'center' }}>
					<p>{t('boards.notFound') || 'Tablica nie została znaleziona'}</p>
					<button onClick={() => navigate('/boards')}>
						{t('boards.backToList') || 'Wróć do listy tablic'}
					</button>
				</div>
			</>
		)
	}

	// Group tasks by status
	const tasksByStatus = STATUSES.reduce((acc, status) => {
		acc[status.id] = tasks
			.filter(task => task.status === status.id)
			.sort((a, b) => (a.order || 0) - (b.order || 0))
		return acc
	}, {})

	return (
		<>
			<Sidebar />
			<div style={{ padding: '15px', maxWidth: '100%', overflowX: 'auto' }} className='board-list'>
				<div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
					<div>
						<button
							onClick={() => navigate('/boards')}
							style={{
								padding: '8px 16px',
								backgroundColor: '#95a5a6',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: 'pointer',
								marginBottom: '10px'
							}}>
							← {t('boards.backToList') || 'Wróć do listy'}
						</button>
						<h2 style={{ 
							color: '#2c3e50', 
							margin: '10px 0',
							fontSize: '24px',
							fontWeight: '600'
						}}>
							{board.name}
						</h2>
						{board.description && (
							<p style={{ color: '#7f8c8d', fontSize: '14px' }}>
								{board.description}
							</p>
						)}
					</div>
					<button
						onClick={() => {
							setCreateTaskStatus('todo')
							setIsCreateModalOpen(true)
						}}
						style={{
							padding: '12px 24px',
							backgroundColor: '#3498db',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							fontSize: '16px',
							fontWeight: '500',
							cursor: 'pointer',
							boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
						}}>
						+ {t('boards.addTask') || 'Dodaj zadanie'}
					</button>
				</div>

				<DndContext
					sensors={sensors}
					collisionDetection={closestCenter}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}>
					<div style={{
						display: 'flex',
						flexDirection: isMobile ? 'column' : 'row',
						gap: '20px',
						overflowX: isMobile ? 'visible' : 'auto',
						paddingBottom: '20px',
						minHeight: '400px'
					}} className='board-list-content-task'>
						{STATUSES.map((status) => (
							<div 
								key={status.id} 
								id={`column-${status.id}`}
								data-column-id={status.id} 
								style={{ 
									flexShrink: 0,
									minWidth: isMobile ? '100%' : '280px',
									width: isMobile ? '100%' : 'auto'
								}}>
								<Column
									status={status}
									tasks={tasksByStatus[status.id] || []}
									onTaskClick={setSelectedTask}
									onDeleteTask={handleDeleteTask}
								/>
							</div>
						))}
					</div>
					<DragOverlay dropAnimation={null}>
						{activeId ? (() => {
							const draggedTask = tasks.find(t => t._id === activeId)
							if (!draggedTask) return null
							
							return (
								<div style={{
									backgroundColor: 'white',
									borderRadius: '8px',
									padding: '16px',
									boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
									opacity: 0.95,
									width: '280px',
									transform: 'rotate(3deg)',
									cursor: 'grabbing'
								}}>
									<div style={{ paddingLeft: '28px' }}>
										<h4 style={{ 
											color: '#2c3e50', 
											marginBottom: '8px',
											fontSize: '16px',
											fontWeight: '600'
										}}>
											{draggedTask.title}
										</h4>
										{draggedTask.description && (
											<p style={{ 
												color: '#7f8c8d', 
												fontSize: '14px',
												marginBottom: '8px',
												overflow: 'hidden',
												textOverflow: 'ellipsis',
												display: '-webkit-box',
												WebkitLineClamp: 2,
												WebkitBoxOrient: 'vertical'
											}}>
												{draggedTask.description}
											</p>
										)}
										{draggedTask.assignedTo && draggedTask.assignedTo.length > 0 && (
											<div style={{ 
												fontSize: '12px', 
												color: '#95a5a6',
												marginTop: '8px'
											}}>
												👤 {draggedTask.assignedTo.map(u => u.username).join(', ')}
											</div>
										)}
									</div>
								</div>
							)
						})() : null}
					</DragOverlay>
				</DndContext>
			</div>

			{isCreateModalOpen && (
				<CreateTaskModal
					boardId={boardId}
					initialStatus={createTaskStatus}
					onClose={() => setIsCreateModalOpen(false)}
					onSuccess={() => {
						setIsCreateModalOpen(false)
						refetchTasks()
					}}
				/>
			)}

			{selectedTask && (
				<TaskCard
					task={selectedTask}
					isModal={true}
					onClose={() => setSelectedTask(null)}
					onUpdate={async () => {
						// Refetch tasks to update the board
						await refetchTasks()
						// TaskCard will handle its own refetch via useTask hook in modal mode
						// So we don't need to update selectedTask here - the hook will provide fresh data
					}}
				/>
			)}
		</>
	)
}

export default Board

