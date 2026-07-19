import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useSocket } from '../../context/SocketContext'
import { useTaskComments, useCreateComment, useDeleteComment, useUploadTaskAttachment, useDeleteTaskAttachment, useUploadCommentAttachment, useDeleteCommentAttachment, useTask } from '../../hooks/useBoards'
import { useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '../../hooks/useBoards'
import { useBoardUsers } from '../../hooks/useBoards'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { API_URL } from '../../config.js'
import { buildSchedulePayload, scheduleSummaryFromTask } from '../../utils/taskScheduleTime'
import TaskScheduleTimeInput from './TaskScheduleTimeInput'
import './TaskCard.css'

const STATUSES = [
	{ id: 'todo', color: '#e74c3c' },
	{ id: 'in-progress', color: '#f39c12' },
	{ id: 'review', color: '#3498db' },
	{ id: 'done', color: '#27ae60' }
]
const PRIORITY_META = {
	low: { bg: '#e8f5e9', color: '#2e7d32' },
	medium: { bg: '#fff8e1', color: '#ef6c00' },
	high: { bg: '#ffe8e8', color: '#c62828' },
	urgent: { bg: '#f3e5f5', color: '#6a1b9a' },
}
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent']

function formatDateInputFromTask(value) {
	if (!value) return ''
	const d = new Date(value)
	if (isNaN(d.getTime())) return ''
	const y = d.getFullYear()
	const m = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	return `${y}-${m}-${day}`
}

const ATTACH_ICON_SRC = '/img/attach-file.png'
const ATTACH_ICON_STYLE = {
	width: '16px',
	height: '16px',
	objectFit: 'contain',
	flexShrink: 0
}

function TaskCard({ task, onClick, onDelete, isModal = false, onClose, onUpdate, unreadCount = 0, onSeen }) {
	const { t, i18n } = useTranslation()
	const { userId, role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const { socket } = useSocket()
	
	// Use useTask hook to get fresh task data when in modal mode
	const { data: freshTask, refetch: refetchTask } = useTask(isModal ? task?._id : null)
	
	// Use fresh task data in modal, fallback to prop task
	const currentTask = (isModal && freshTask) ? freshTask : task
	const taskBoardId = currentTask?.boardId?._id || currentTask?.boardId || null
	const { data: boardUsers = [] } = useBoardUsers(isModal ? taskBoardId : null, !!isModal && !!taskBoardId)
	
	const { data: comments = [], refetch: refetchComments } = useTaskComments(isModal ? task?._id : null, {
		enabled: isModal,
		isModalOpen: isModal,
	})
	const createCommentMutation = useCreateComment()
	const deleteCommentMutation = useDeleteComment()
	const updateTaskMutation = useUpdateTask()
	const updateTaskStatusMutation = useUpdateTaskStatus()
	const deleteTaskMutation = useDeleteTask()
	const uploadTaskAttachmentMutation = useUploadTaskAttachment()
	const deleteTaskAttachmentMutation = useDeleteTaskAttachment()
	const uploadCommentAttachmentMutation = useUploadCommentAttachment()
	const deleteCommentAttachmentMutation = useDeleteCommentAttachment()
	
	const [commentText, setCommentText] = useState('')
	const [selectedCommentFile, setSelectedCommentFile] = useState(null)
	const [uploadingCommentFile, setUploadingCommentFile] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [editTitle, setEditTitle] = useState(currentTask?.title || '')
	const [editDescription, setEditDescription] = useState(currentTask?.description || '')
	const [editPriority, setEditPriority] = useState(currentTask?.priority || 'medium')
	const [editAssignToAll, setEditAssignToAll] = useState(currentTask?.assignedScope === 'all-members')
	const [editAssignees, setEditAssignees] = useState([])
	const [editScheduleMode, setEditScheduleMode] = useState('none')
	const [editDueDate, setEditDueDate] = useState('')
	const [editDueTime, setEditDueTime] = useState('')
	const [editPeriodStart, setEditPeriodStart] = useState('')
	const [editPeriodEnd, setEditPeriodEnd] = useState('')
	const [editPeriodStartTime, setEditPeriodStartTime] = useState('')
	const [editPeriodEndTime, setEditPeriodEndTime] = useState('')
	const [uploadingFile, setUploadingFile] = useState(false)
	
	// Update edit fields when task data changes
	useEffect(() => {
		if (currentTask) {
			setEditTitle(currentTask.title || '')
			setEditDescription(currentTask.description || '')
			setEditPriority(currentTask.priority || 'medium')
			setEditAssignToAll(currentTask.assignedScope === 'all-members')
			setEditAssignees((currentTask.assignedTo || []).map((u) => (u?._id ? u._id : u)).filter(Boolean))
			if (currentTask.dueDate) {
				setEditScheduleMode('deadline')
				setEditDueDate(formatDateInputFromTask(currentTask.dueDate))
				setEditDueTime(currentTask.dueTime || '')
				setEditPeriodStart('')
				setEditPeriodEnd('')
				setEditPeriodStartTime('')
				setEditPeriodEndTime('')
			} else if (currentTask.workPeriodStart && currentTask.workPeriodEnd) {
				setEditScheduleMode('period')
				setEditDueDate('')
				setEditDueTime('')
				setEditPeriodStart(formatDateInputFromTask(currentTask.workPeriodStart))
				setEditPeriodEnd(formatDateInputFromTask(currentTask.workPeriodEnd))
				setEditPeriodStartTime(currentTask.workPeriodStartTime || '')
				setEditPeriodEndTime(currentTask.workPeriodEndTime || '')
			} else {
				setEditScheduleMode('none')
				setEditDueDate('')
				setEditDueTime('')
				setEditPeriodStart('')
				setEditPeriodEnd('')
				setEditPeriodStartTime('')
				setEditPeriodEndTime('')
			}
		}
	}, [currentTask])

	useEffect(() => {
		if (!socket || !isModal || !currentTask?._id) return

		const handleCommentRealtimeUpdate = (payload) => {
			if (!payload?.taskId) return
			if (String(payload.taskId) !== String(currentTask._id)) return
			refetchComments()
			if (isModal && typeof onSeen === 'function') {
				onSeen(currentTask._id)
			}
		}

		socket.on('task-comment-updated', handleCommentRealtimeUpdate)
		socket.on('task-notification-updated', handleCommentRealtimeUpdate)
		return () => {
			socket.off('task-comment-updated', handleCommentRealtimeUpdate)
			socket.off('task-notification-updated', handleCommentRealtimeUpdate)
		}
	}, [socket, isModal, currentTask?._id, refetchComments])

	useEffect(() => {
		if (!isModal || !currentTask?._id) return
		// Ensure freshest comments every time modal is opened/switched to a task.
		refetchComments()
	}, [isModal, currentTask?._id, refetchComments])

	const sortable = useSortable({
		id: task?._id,
		disabled: isModal
	})

	const { attributes, listeners, setNodeRef, transform, transition, isDragging, setActivatorNodeRef } = isModal ? {
		attributes: {},
		listeners: {},
		setNodeRef: () => {},
		setActivatorNodeRef: () => {},
		transform: null,
		transition: null,
		isDragging: false
	} : sortable

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.4 : 1,
	}

	const isAdmin = role && role.includes('Admin')
	const canEdit = currentTask && (isAdmin || (currentTask.createdBy && currentTask.createdBy._id === userId))
	const priorityKey = currentTask?.priority || 'medium'
	const priorityStyle = PRIORITY_META[priorityKey] || PRIORITY_META.medium
	const priorityLabel = t(`boards.priority.${priorityKey}`)
	const scheduleLine = currentTask
		? scheduleSummaryFromTask(currentTask, t, i18n.resolvedLanguage || i18n.language)
		: null
	const assignedText = currentTask?.assignedScope === 'all-members'
		? (t('boards.assignToAllMembers') || t('boards.assignToAll') || 'Wszyscy członkowie tablicy')
		: (currentTask?.assignedTo || []).map(u => u.username).join(', ')

	const handleCommentSubmit = async (e) => {
		e.preventDefault()
		if (!commentText.trim()) return

		try {
			const createdComment = await createCommentMutation.mutateAsync({
				taskId: currentTask._id,
				content: commentText.trim()
			})

			if (selectedCommentFile && createdComment?._id) {
				setUploadingCommentFile(true)
				try {
					await uploadCommentAttachmentMutation.mutateAsync({
						commentId: createdComment._id,
						file: selectedCommentFile,
					})
				} finally {
					setUploadingCommentFile(false)
				}
			}
			setCommentText('')
			setSelectedCommentFile(null)
			refetchComments()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.commentError') || 'Błąd podczas dodawania komentarza')
		}
	}

	const handleDeleteComment = async (commentId) => {
		const confirmed = await showConfirm(
			t('boards.deleteCommentConfirm') || 'Czy na pewno chcesz usunąć ten komentarz?'
		)
		if (!confirmed) return

		try {
			await deleteCommentMutation.mutateAsync(commentId)
			refetchComments()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.deleteCommentError') || 'Błąd podczas usuwania komentarza')
		}
	}

	const handleDeleteCommentAttachment = async (commentId, attachmentIndex) => {
		const confirmed = await showConfirm(
			t('boards.deleteAttachmentConfirm') || 'Czy na pewno chcesz usunąć ten załącznik?'
		)
		if (!confirmed) return

		try {
			await deleteCommentAttachmentMutation.mutateAsync({ commentId, attachmentIndex })
			refetchComments()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.attachmentDeleteError') || 'Błąd podczas usuwania załącznika')
		}
	}

	const handleSaveEdit = async () => {
		if (!editAssignToAll && editAssignees.length === 0) {
			await showAlert(t('boards.assigneeRequired') || 'Wybierz przynajmniej jedną osobę lub przypisz do wszystkich')
			return
		}
		if (editScheduleMode === 'deadline' && !editDueDate) {
			await showAlert(t('boards.deadlineRequired') || 'Wybierz datę deadline')
			return
		}
		if (editScheduleMode === 'period' && (!editPeriodStart || !editPeriodEnd)) {
			await showAlert(t('boards.periodRequired') || 'Podaj pełny okres (od–do)')
			return
		}
		try {
			const schedulePayload = buildSchedulePayload(editScheduleMode, {
				dueDate: editDueDate,
				dueTime: editDueTime,
				periodStart: editPeriodStart,
				periodEnd: editPeriodEnd,
				periodStartTime: editPeriodStartTime,
				periodEndTime: editPeriodEndTime,
			})

			await updateTaskMutation.mutateAsync({
				taskId: currentTask._id,
				data: {
					title: editTitle.trim(),
					description: editDescription.trim(),
					priority: editPriority,
					assignToAllMembers: editAssignToAll,
					assignedTo: editAssignToAll ? [] : editAssignees,
					...schedulePayload,
				}
			})
			setIsEditing(false)
			// Refetch task data and board tasks
			if (isModal) {
				await refetchTask()
			}
			if (onUpdate) onUpdate()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.updateError') || 'Błąd podczas aktualizacji zadania')
		}
	}

	const handleStatusChange = async (newStatus) => {
		try {
			await updateTaskStatusMutation.mutateAsync({
				taskId: currentTask._id,
				status: newStatus,
				order: currentTask.order || 0
			})
			// Refetch task data and board tasks
			if (isModal) {
				await refetchTask()
			}
			if (onUpdate) onUpdate()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.updateError') || 'Błąd podczas zmiany statusu zadania')
		}
	}
	
	const handleDeleteTask = async () => {
		const confirmed = await showConfirm(
			t('boards.deleteTaskConfirm') || 'Czy na pewno chcesz usunąć to zadanie?'
		)
		if (!confirmed) return

		try {
			await deleteTaskMutation.mutateAsync(currentTask._id)
			await showAlert(t('boards.deleteTaskSuccess') || 'Zadanie zostało usunięte pomyślnie')
			// Close modal after deletion
			if (isModal && onClose) {
				onClose()
			}
			if (onUpdate) onUpdate()
		} catch (error) {
			await showAlert(error.response?.data?.message || t('boards.deleteTaskError') || 'Błąd podczas usuwania zadania')
		}
	}

	if (isModal) {
		// If task was deleted, don't show modal
		if (!currentTask) {
			if (onClose) onClose()
			return null
		}

		const sectionCardStyle = {
			marginBottom: '16px',
			padding: '16px',
			backgroundColor: '#ffffff',
			border: '1px solid #e5e7eb',
			borderRadius: '10px',
			boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
		}
		
		return (
			<Modal
			isOpen={true}
			onRequestClose={onClose}
			overlayClassName="board-modal-overlay"
			className="board-modal board-task-detail-modal"
			style={{
					overlay: {
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: 'rgba(0, 0, 0, 0.5)',
						backdropFilter: 'blur(2px)',
					},
					content: {
						position: 'relative',
						inset: 'unset',
						margin: '0',
						maxWidth: '800px',
						width: '90%',
						maxHeight: '90vh',
						overflowY: 'auto',
						borderRadius: '12px',
						padding: '20px',
						backgroundColor: '#f8fafc',
					},
				}}>
				<div className="board-modal__section-card" style={{ ...sectionCardStyle, marginBottom: '16px' }}>
					{isEditing ? (
						<>
							<input
								type="text"
								value={editTitle}
								onChange={(e) => setEditTitle(e.target.value)}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '20px',
									fontWeight: '600',
									marginBottom: '10px'
								}}
							/>
							<textarea
								value={editDescription}
								onChange={(e) => setEditDescription(e.target.value)}
								style={{
									width: '100%',
									padding: '12px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px',
									minHeight: '100px',
									marginBottom: '10px'
								}}
							/>
							<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50' }}>
								{t('boards.priority') || 'Priorytet'}
							</label>
							<select
								value={editPriority}
								onChange={(e) => setEditPriority(e.target.value)}
								style={{
									width: '100%',
									padding: '10px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px',
									marginBottom: '10px'
								}}
							>
								{PRIORITY_OPTIONS.map((priorityOption) => (
									<option key={priorityOption} value={priorityOption}>
										{t(`boards.priority.${priorityOption}`)}
									</option>
								))}
							</select>
							<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
								<input
									type="checkbox"
									checked={editAssignToAll}
									onChange={(e) => {
										setEditAssignToAll(e.target.checked)
										if (e.target.checked) setEditAssignees([])
									}}
								/>
								<span>{t('boards.assignToAllMembers') || t('boards.assignToAll') || 'Wszyscy członkowie tablicy'}</span>
							</label>
							{!editAssignToAll && (
								<div
									className="board-modal__members-list"
									style={{
									border: '1px solid #e1e8ed',
									borderRadius: '6px',
									maxHeight: '150px',
									overflowY: 'auto',
									padding: '10px',
									backgroundColor: '#fafbfd',
									marginBottom: '10px'
								}}>
									{boardUsers.length === 0 ? (
										<p style={{ margin: 0, color: '#7f8c8d' }}>{t('boards.noMembersToAssign') || 'Brak członków tablicy do przypisania'}</p>
									) : (
										boardUsers.map((user) => (
											<label key={user._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
												<input
													type="checkbox"
													checked={editAssignees.includes(user._id)}
													onChange={() => {
														setEditAssignees((prev) =>
															prev.includes(user._id)
																? prev.filter((id) => id !== user._id)
																: [...prev, user._id]
														)
													}}
												/>
												<span>{user.firstName} {user.lastName} ({user.username})</span>
											</label>
										))
									)}
								</div>
							)}
							<div style={{ marginTop: '14px', marginBottom: '10px' }}>
								<label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
									{t('boards.scheduleType') || 'Termin / okres'}
								</label>
								<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
									<input
										type="radio"
										name="editSched"
										checked={editScheduleMode === 'none'}
										onChange={() => setEditScheduleMode('none')}
									/>
									<span>{t('boards.noSchedule') || 'Brak'}</span>
								</label>
								<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
									<input
										type="radio"
										name="editSched"
										checked={editScheduleMode === 'deadline'}
										onChange={() => setEditScheduleMode('deadline')}
									/>
									<span>{t('boards.deadline') || 'Deadline'}</span>
								</label>
								<label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
									<input
										type="radio"
										name="editSched"
										checked={editScheduleMode === 'period'}
										onChange={() => setEditScheduleMode('period')}
									/>
									<span>{t('boards.workPeriod') || 'Okres realizacji'}</span>
								</label>
								{editScheduleMode === 'deadline' && (
									<div>
										<input
											type="date"
											value={editDueDate}
											onChange={(e) => setEditDueDate(e.target.value)}
											style={{
												display: 'block',
												width: '100%',
												maxWidth: '250px',
												boxSizing: 'border-box',
												padding: '10px',
												border: '1px solid #bdc3c7',
												borderRadius: '6px',
												fontSize: '16px',
											}}
										/>
										<TaskScheduleTimeInput
											id="edit-task-due-time"
											value={editDueTime}
											onChange={setEditDueTime}
											t={t}
										/>
									</div>
								)}
								{editScheduleMode === 'period' && (
									<div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
										<div>
											<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50' }}>
												{t('boards.periodFrom') || 'Od'}
											</label>
											<input
												type="date"
												value={editPeriodStart}
												onChange={(e) => setEditPeriodStart(e.target.value)}
												style={{
													display: 'block',
													width: '100%',
													maxWidth: '250px',
													boxSizing: 'border-box',
													padding: '10px',
													border: '1px solid #bdc3c7',
													borderRadius: '6px',
													fontSize: '16px',
												}}
											/>
											<TaskScheduleTimeInput
												id="edit-task-period-start-time"
												value={editPeriodStartTime}
												onChange={setEditPeriodStartTime}
												label={t('boards.scheduleTimeFrom') || 'Godzina rozpoczęcia (opcjonalnie)'}
												t={t}
											/>
										</div>
										<div>
											<label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#2c3e50' }}>
												{t('boards.periodTo') || 'Do'}
											</label>
											<input
												type="date"
												value={editPeriodEnd}
												onChange={(e) => setEditPeriodEnd(e.target.value)}
												style={{
													display: 'block',
													width: '100%',
													maxWidth: '250px',
													boxSizing: 'border-box',
													padding: '10px',
													border: '1px solid #bdc3c7',
													borderRadius: '6px',
													fontSize: '16px',
												}}
											/>
											<TaskScheduleTimeInput
												id="edit-task-period-end-time"
												value={editPeriodEndTime}
												onChange={setEditPeriodEndTime}
												label={t('boards.scheduleTimeTo') || 'Godzina zakończenia (opcjonalnie)'}
												t={t}
											/>
										</div>
									</div>
								)}
							</div>
							<div style={{ display: 'flex', gap: '10px' }}>
								<button
									className="board-modal__btn board-modal__btn--primary"
									onClick={handleSaveEdit}
									style={{
										padding: '8px 16px',
										backgroundColor: '#27ae60',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer'
									}}>
									{t('boards.save') || 'Zapisz'}
								</button>
								<button
									className="board-modal__btn board-modal__btn--secondary"
									onClick={() => {
										setIsEditing(false)
										setEditTitle(currentTask.title)
										setEditDescription(currentTask.description)
										setEditPriority(currentTask.priority || 'medium')
										setEditAssignToAll(currentTask.assignedScope === 'all-members')
										setEditAssignees((currentTask.assignedTo || []).map((u) => (u?._id ? u._id : u)).filter(Boolean))
										if (currentTask.dueDate) {
											setEditScheduleMode('deadline')
											setEditDueDate(formatDateInputFromTask(currentTask.dueDate))
											setEditPeriodStart('')
											setEditPeriodEnd('')
										} else if (currentTask.workPeriodStart && currentTask.workPeriodEnd) {
											setEditScheduleMode('period')
											setEditDueDate('')
											setEditPeriodStart(formatDateInputFromTask(currentTask.workPeriodStart))
											setEditPeriodEnd(formatDateInputFromTask(currentTask.workPeriodEnd))
										} else {
											setEditScheduleMode('none')
											setEditDueDate('')
											setEditPeriodStart('')
											setEditPeriodEnd('')
										}
									}}
									style={{
										padding: '8px 16px',
										backgroundColor: '#95a5a6',
										color: 'white',
										border: 'none',
										borderRadius: '6px',
										cursor: 'pointer'
									}}>
									{t('boards.cancel') || 'Anuluj'}
								</button>
							</div>
						</>
					) : (
						<>
							<div className="task-detail-header">
								<h3 className="task-detail-title">
									{currentTask.title}
								</h3>
								<div className="task-detail-actions">
									{canEdit && (
										<>
											<button
												type="button"
												className="task-detail-action task-detail-action--edit"
												onClick={() => setIsEditing(true)}
												title={t('boards.edit') || 'Edytuj'}
												aria-label={t('boards.edit') || 'Edytuj'}>
												<span className="task-detail-action__label">{t('boards.edit') || 'Edytuj'}</span>
											</button>
											<button
												type="button"
												className="task-detail-action task-detail-action--delete"
												onClick={handleDeleteTask}
												title={t('boards.delete') || 'Usuń'}
												aria-label={t('boards.delete') || 'Usuń'}>
												<span className="task-detail-action__label">{t('boards.delete') || 'Usuń'}</span>
											</button>
										</>
									)}
									<button
										type="button"
										onClick={onClose}
										className="task-detail-close"
										aria-label={t('boards.close') || 'Zamknij'}
										title={t('boards.close') || 'Zamknij'}>
										×
									</button>
								</div>
							</div>
							{currentTask.description && (
								<p className="task-detail-description">
									{currentTask.description}
								</p>
							)}
							<div className="task-detail-meta">
								{scheduleLine && (
									<div className="task-detail-meta__item task-card__schedule">
										<span aria-hidden="true">📅</span>
										<span>{scheduleLine}</span>
									</div>
								)}
								{currentTask.calendarOnly && (
									<span className="task-card__calendar-only-badge">
										{t('boards.calendarOnlyBadge') || 'Szybkie zadanie'}
									</span>
								)}
								<span
									className={`board-priority-badge board-priority-badge--${priorityKey}`}
									style={{
									display: 'inline-block',
									padding: '4px 10px',
									borderRadius: '999px',
									backgroundColor: priorityStyle.bg,
									color: priorityStyle.color,
									fontSize: '12px',
									fontWeight: '600',
								}}>
									{t('boards.priority') || 'Priorytet'}: {priorityLabel}
								</span>
								<div className="task-detail-meta__item task-detail-meta__assignee">
									<span><strong>{t('boards.assignedTo') || 'Przypisane do'}:</strong> {assignedText || (t('boards.unassigned') || 'Nieprzypisane')}</span>
								</div>
							</div>
						</>
					)}
				</div>

				{/* Status selector */}
				<div className="board-modal__section-card" style={sectionCardStyle}>
					<label style={{ 
						display: 'block',
						marginBottom: '8px',
						fontWeight: '600',
						color: '#2c3e50'
					}}>
						{t('boards.status') || 'Status'}
					</label>
					<select
						value={currentTask.status || 'todo'}
						onChange={(e) => handleStatusChange(e.target.value)}
						style={{
							width: '100%',
							padding: '10px',
							border: '1px solid #bdc3c7',
							borderRadius: '6px',
							fontSize: '16px',
							backgroundColor: 'white',
							cursor: 'pointer'
						}}>
						{STATUSES.map(status => (
							<option key={status.id} value={status.id}>
								{t(`boards.status.${status.id}`)}
							</option>
						))}
					</select>
				</div>

				{/* Attachments */}
				<div className="board-modal__section-card" style={sectionCardStyle}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
						<h4 style={{ margin: 0, color: '#2c3e50' }}>
							{t('boards.attachments') || 'Załączniki'}
						</h4>
						{canEdit && (
							<label style={{
								padding: '6px 12px',
								backgroundColor: '#00a846',
								color: 'white',
								border: 'none',
								borderRadius: '6px',
								cursor: uploadingFile ? 'not-allowed' : 'pointer',
								fontSize: '12px',
								opacity: uploadingFile ? 0.6 : 1
							}}>
								{uploadingFile ? t('boards.uploading') || 'Przesyłanie...' : '+ ' + (t('boards.addAttachment') || 'Dodaj załącznik')}
								<input
									type="file"
									style={{ display: 'none' }}
									onChange={async (e) => {
										const file = e.target.files[0]
										if (!file) return
										setUploadingFile(true)
										try {
											await uploadTaskAttachmentMutation.mutateAsync({ taskId: currentTask._id, file })
											await showAlert(t('boards.attachmentUploaded') || 'Załącznik został dodany pomyślnie')
											// Refetch task data to get updated attachments
											if (isModal) {
												await refetchTask()
											}
											if (onUpdate) {
												onUpdate()
											}
										} catch (error) {
											console.error('Error uploading attachment:', error)
											await showAlert(error.response?.data?.message || t('boards.attachmentError') || 'Błąd podczas dodawania załącznika')
										} finally {
											setUploadingFile(false)
											e.target.value = ''
										}
									}}
									disabled={uploadingFile}
								/>
							</label>
						)}
					</div>
					{currentTask.attachments && currentTask.attachments.length > 0 ? (
						currentTask.attachments.map((attachment, index) => (
							<div
								key={index}
								className="board-modal__attachment-row"
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									padding: '8px 12px',
									backgroundColor: '#f8f9fa',
									borderRadius: '6px',
									marginBottom: '8px'
								}}>
								<a
									href={`${API_URL.replace('/api', '')}/uploads/${attachment.path}`}
									target="_blank"
									rel="noopener noreferrer"
									style={{
										textDecoration: 'none',
										color: '#00a846',
										flex: 1,
										display: 'inline-flex',
										alignItems: 'center',
										gap: '6px'
									}}>
									<img src={ATTACH_ICON_SRC} alt="" aria-hidden="true" style={ATTACH_ICON_STYLE} />
									<span>{attachment.filename}</span>
								</a>
								{canEdit && (
									<button
										onClick={async () => {
											const confirmed = await showConfirm(t('boards.deleteAttachmentConfirm') || 'Czy na pewno chcesz usunąć ten załącznik?')
											if (!confirmed) return
											try {
												await deleteTaskAttachmentMutation.mutateAsync({ taskId: currentTask._id, attachmentIndex: index })
												await showAlert(t('boards.attachmentDeleted') || 'Załącznik został usunięty pomyślnie')
												// Refetch task data to get updated attachments
												if (isModal) {
													await refetchTask()
												}
												if (onUpdate) onUpdate()
											} catch (error) {
												await showAlert(error.response?.data?.message || t('boards.attachmentDeleteError') || 'Błąd podczas usuwania załącznika')
											}
										}}
										style={{
											background: 'transparent',
											border: 'none',
											color: '#dc3545',
											cursor: 'pointer',
											fontSize: '16px',
											padding: '4px 8px',
											marginLeft: '10px'
										}}>
										×
									</button>
								)}
							</div>
						))
					) : (
						<p style={{ color: '#95a5a6', fontSize: '16px', fontStyle: 'italic' }}>
							{t('boards.noAttachments') || 'Brak załączników'}
						</p>
					)}
				</div>

				{/* Comments */}
				<div className="board-modal__section-card" style={{ ...sectionCardStyle, marginTop: '8px', marginBottom: 0 }}>
					<h4 style={{ marginBottom: '15px', color: '#2c3e50', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' }}>
						{t('boards.comments') || 'Komentarze'}
					</h4>
					
					<div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
						{comments.map((comment) => (
							<div
								key={comment._id}
								className="board-modal__comment-item"
								style={{
									padding: '12px',
									backgroundColor: '#ffffff',
									border: '1px solid #e5e7eb',
									borderRadius: '8px',
									marginBottom: '10px'
								}}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
									<div style={{ flex: 1 }}>
										<div style={{ 
											fontWeight: '600', 
											color: '#2c3e50',
											marginBottom: '5px'
										}}>
											{comment.createdBy?.username || 'Unknown'}
										</div>
										<div style={{ color: '#7f8c8d', fontSize: '16px' }}>
											{comment.content}
										</div>
										<div style={{ 
											fontSize: '12px', 
											color: '#95a5a6',
											marginTop: '5px'
										}}>
											{new Date(comment.createdAt).toLocaleString()}
										</div>
										{Array.isArray(comment.attachments) && comment.attachments.length > 0 && (
											<div style={{ marginTop: '8px' }}>
												{comment.attachments.map((attachment, attachmentIndex) => (
													<div key={`${comment._id}-${attachmentIndex}`} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
														<a
															href={`${API_URL.replace('/api', '')}/uploads/${attachment.path}`}
															target="_blank"
															rel="noopener noreferrer"
															style={{
																color: '#00a846',
																textDecoration: 'none',
																fontSize: '13px',
																display: 'inline-flex',
																alignItems: 'center',
																gap: '6px'
															}}
														>
															<img src={ATTACH_ICON_SRC} alt="" aria-hidden="true" style={ATTACH_ICON_STYLE} />
															<span>{attachment.filename}</span>
														</a>
														{comment.createdBy && comment.createdBy._id === userId && (
															<button
																type="button"
																onClick={() => handleDeleteCommentAttachment(comment._id, attachmentIndex)}
																style={{
																	background: 'transparent',
																	border: 'none',
																	color: '#dc3545',
																	cursor: 'pointer',
																	fontSize: '14px',
																	padding: '0 4px'
																}}
															>
																×
															</button>
														)}
													</div>
												))}
											</div>
										)}
									</div>
									{(isAdmin || (comment.createdBy && comment.createdBy._id === userId)) && (
										<button
											onClick={() => handleDeleteComment(comment._id)}
											style={{
												background: 'transparent',
												border: 'none',
												color: '#dc3545',
												cursor: 'pointer',
												fontSize: '18px',
												padding: '4px 8px'
											}}>
											×
										</button>
									)}
								</div>
							</div>
						))}
					</div>

					<form onSubmit={handleCommentSubmit}>
						<div className="task-comment-form-row" style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
							<input
								className="task-comment-input"
								type="text"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder={t('boards.addComment') || 'Dodaj komentarz...'}
								style={{
									flex: 1,
									padding: '10px',
									border: '1px solid #cbd5e1',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							/>
							<label
								className="task-comment-attach-btn"
								style={{
									padding: '10px 12px',
									backgroundColor: '#ecf0f1',
									color: '#2c3e50',
									borderRadius: '6px',
									cursor: uploadingCommentFile ? 'not-allowed' : 'pointer',
									fontSize: '14px',
									opacity: uploadingCommentFile ? 0.6 : 1,
									whiteSpace: 'nowrap',
									display: 'inline-flex',
									alignItems: 'center',
									justifyContent: 'center',
									minWidth: '44px'
								}}
								title={t('boards.attachFile') || 'Załącz plik'}
							>
								<img
									src={ATTACH_ICON_SRC}
									alt={t('boards.attachFile') || 'Załącz plik'}
									style={{ width: '20px', height: '20px', objectFit: 'contain' }}
								/>
								<input
									type="file"
									style={{ display: 'none' }}
									disabled={uploadingCommentFile}
									onChange={(e) => setSelectedCommentFile(e.target.files?.[0] || null)}
								/>
							</label>
							<button
								className="task-comment-send-btn"
								type="submit"
								disabled={!commentText.trim() || uploadingCommentFile}
								style={{
									padding: '10px 20px',
									backgroundColor: '#00a846',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: commentText.trim() && !uploadingCommentFile ? 'pointer' : 'not-allowed',
									opacity: commentText.trim() && !uploadingCommentFile ? 1 : 0.5
								}}>
								{t('boards.send') || 'Wyślij'}
							</button>
						</div>
						{selectedCommentFile && (
							<div style={{
								padding: '8px 10px',
								borderRadius: '6px',
								backgroundColor: '#f8f9fa',
								fontSize: '13px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between'
							}}>
								<span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
									<img src={ATTACH_ICON_SRC} alt="" aria-hidden="true" style={ATTACH_ICON_STYLE} />
									<span>{selectedCommentFile.name}</span>
								</span>
								<button
									type="button"
									onClick={() => setSelectedCommentFile(null)}
									style={{
										background: 'transparent',
										border: 'none',
										color: '#dc3545',
										cursor: 'pointer',
										fontSize: '16px'
									}}
								>
									×
								</button>
							</div>
						)}
					</form>
				</div>
			</Modal>
		)
	}

	return (
		<div
			ref={setNodeRef}
			className="task-card"
			style={{
				...style,
				backgroundColor: 'white',
				borderRadius: '8px',
				padding: '16px',
				marginBottom: '12px',
				boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
				transition: isDragging ? 'none' : 'transform 0.2s',
				position: 'relative'
			}}
			{...attributes}
			onMouseEnter={(e) => !isDragging && (e.currentTarget.style.transform = 'translateY(-2px)')}
			onMouseLeave={(e) => !isDragging && (e.currentTarget.style.transform = 'translateY(0)')}>
			{!isModal && unreadCount > 0 && (
				<span
					className="sidebar-notification-badge"
					style={{
						right: '8px',
						top: '8px',
						transform: 'none',
						zIndex: 2,
					}}
					title={t('boards.comments') || 'Komentarze'}
				>
					<span className="sidebar-notification-badge-count">
						{unreadCount > 99 ? '99+' : unreadCount}
					</span>
				</span>
			)}
			{/* Drag handle */}
			<div
				ref={setActivatorNodeRef}
				{...listeners}
				style={{
					position: 'absolute',
					left: '8px',
					top: '8px',
					cursor: isDragging ? 'grabbing' : 'grab',
					padding: '4px',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					color: '#95a5a6',
					fontSize: '16px'
				}}
				title="Przeciągnij aby zmienić status">
				⋮⋮
			</div>
			<div 
				onClick={(e) => {
					// Prevent modal opening when clicking on drag handle
					if (!isDragging && onClick) {
						onClick()
					}
				}}
				style={{ cursor: 'pointer', paddingLeft: '28px' }}>
				<h4 style={{ 
					color: '#2c3e50', 
					marginBottom: '8px',
					fontSize: '16px',
					fontWeight: '600',
					overflowWrap: 'anywhere',
					wordBreak: 'break-word',
					maxWidth: '100%'
				}}>
					{currentTask.title}
				</h4>
				{currentTask.description && (
					<p style={{ 
						color: '#7f8c8d', 
						fontSize: '16px',
						marginBottom: '8px',
						overflow: 'hidden',
						textOverflow: 'ellipsis',
						display: '-webkit-box',
						WebkitLineClamp: 2,
						WebkitBoxOrient: 'vertical'
					}}>
						{currentTask.description}
					</p>
				)}
				{scheduleLine && (
					<div className="task-card__schedule" style={{ fontSize: '12px', color: '#2980b9', marginBottom: '6px', fontWeight: 600 }}>
						📅 {scheduleLine}
					</div>
				)}
				{(currentTask.assignedScope === 'all-members' || (currentTask.assignedTo && currentTask.assignedTo.length > 0)) && (
					<div style={{ 
						fontSize: '12px', 
						color: '#95a5a6',
						marginTop: '8px'
					}}>
						👤 {assignedText || (t('boards.unassigned') || 'Nieprzypisane')}
					</div>
				)}
				<div style={{ marginTop: '8px' }}>
					<span
						className={`board-priority-badge board-priority-badge--${priorityKey}`}
						style={{
						display: 'inline-block',
						padding: '3px 8px',
						borderRadius: '999px',
						backgroundColor: priorityStyle.bg,
						color: priorityStyle.color,
						fontSize: '11px',
						fontWeight: '600',
					}}>
						{t('boards.priority') || 'Priorytet'}: {priorityLabel}
					</span>
				</div>
			</div>
		</div>
	)
}

export default TaskCard
