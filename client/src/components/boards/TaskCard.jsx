import React, { useState, useEffect } from 'react'
import Modal from 'react-modal'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import { useTaskComments, useCreateComment, useDeleteComment, useUploadTaskAttachment, useDeleteTaskAttachment, useUploadCommentAttachment, useTask } from '../../hooks/useBoards'
import { useUpdateTask, useDeleteTask, useUpdateTaskStatus } from '../../hooks/useBoards'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { API_URL } from '../../config.js'

const STATUSES = [
	{ id: 'todo', color: '#e74c3c' },
	{ id: 'in-progress', color: '#f39c12' },
	{ id: 'review', color: '#3498db' },
	{ id: 'done', color: '#27ae60' }
]

Modal.setAppElement('#root')

function TaskCard({ task, onClick, onDelete, isModal = false, onClose, onUpdate }) {
	const { t } = useTranslation()
	const { userId, role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	
	// Use useTask hook to get fresh task data when in modal mode
	const { data: freshTask, refetch: refetchTask } = useTask(isModal ? task?._id : null)
	
	// Use fresh task data in modal, fallback to prop task
	const currentTask = (isModal && freshTask) ? freshTask : task
	
	const { data: comments = [], refetch: refetchComments } = useTaskComments(isModal ? task?._id : null)
	const createCommentMutation = useCreateComment()
	const deleteCommentMutation = useDeleteComment()
	const updateTaskMutation = useUpdateTask()
	const updateTaskStatusMutation = useUpdateTaskStatus()
	const deleteTaskMutation = useDeleteTask()
	const uploadTaskAttachmentMutation = useUploadTaskAttachment()
	const deleteTaskAttachmentMutation = useDeleteTaskAttachment()
	const uploadCommentAttachmentMutation = useUploadCommentAttachment()
	
	const [commentText, setCommentText] = useState('')
	const [isEditing, setIsEditing] = useState(false)
	const [editTitle, setEditTitle] = useState(currentTask?.title || '')
	const [editDescription, setEditDescription] = useState(currentTask?.description || '')
	const [uploadingFile, setUploadingFile] = useState(false)
	
	// Update edit fields when task data changes
	useEffect(() => {
		if (currentTask) {
			setEditTitle(currentTask.title || '')
			setEditDescription(currentTask.description || '')
		}
	}, [currentTask])

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

	const handleCommentSubmit = async (e) => {
		e.preventDefault()
		if (!commentText.trim()) return

		try {
			await createCommentMutation.mutateAsync({
				taskId: currentTask._id,
				content: commentText.trim()
			})
			setCommentText('')
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

	const handleSaveEdit = async () => {
		try {
			await updateTaskMutation.mutateAsync({
				taskId: currentTask._id,
				data: {
					title: editTitle.trim(),
					description: editDescription.trim()
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
		
		return (
			<Modal
				isOpen={true}
				onRequestClose={onClose}
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
						padding: '30px',
						backgroundColor: 'white',
					},
				}}>
				<div style={{ marginBottom: '20px' }}>
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
							<div style={{ display: 'flex', gap: '10px' }}>
								<button
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
									onClick={() => {
										setIsEditing(false)
										setEditTitle(currentTask.title)
										setEditDescription(currentTask.description)
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
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
								<h3 style={{ 
									color: '#2c3e50', 
									fontSize: '24px',
									fontWeight: '600',
									margin: 0,
									flex: 1
								}}>
									{currentTask.title}
								</h3>
								{canEdit && (
									<>
										<button
											onClick={() => setIsEditing(true)}
											style={{
												padding: '6px 12px',
												backgroundColor: '#3498db',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												cursor: 'pointer',
												fontSize: '12px',
												marginLeft: '10px'
											}}>
											{t('boards.edit') || 'Edytuj'}
										</button>
										<button
											onClick={handleDeleteTask}
											style={{
												padding: '6px 12px',
												backgroundColor: '#dc3545',
												color: 'white',
												border: 'none',
												borderRadius: '6px',
												cursor: 'pointer',
												fontSize: '12px',
												marginLeft: '10px'
											}}>
											{t('boards.delete') || 'Usuń'}
										</button>
									</>
								)}
								<button
									onClick={onClose}
									style={{
										background: 'transparent',
										border: 'none',
										fontSize: '24px',
										cursor: 'pointer',
										color: '#7f8c8d',
										marginLeft: '10px'
									}}>
									×
								</button>
							</div>
							{currentTask.description && (
								<p style={{ 
									color: '#7f8c8d', 
									fontSize: '16px',
									marginBottom: '20px',
									whiteSpace: 'pre-wrap'
								}}>
									{currentTask.description}
								</p>
							)}
						</>
					)}
				</div>

				{/* Status selector */}
				<div style={{ marginBottom: '20px' }}>
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
				<div style={{ marginBottom: '20px' }}>
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
						<h4 style={{ margin: 0, color: '#2c3e50' }}>
							{t('boards.attachments') || 'Załączniki'}
						</h4>
						{canEdit && (
							<label style={{
								padding: '6px 12px',
								backgroundColor: '#3498db',
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
										color: '#3498db',
										flex: 1
									}}>
									📎 {attachment.filename}
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
				<div style={{ marginTop: '30px', borderTop: '1px solid #e9ecef', paddingTop: '20px' }}>
					<h4 style={{ marginBottom: '15px', color: '#2c3e50' }}>
						{t('boards.comments') || 'Komentarze'}
					</h4>
					
					<div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
						{comments.map((comment) => (
							<div
								key={comment._id}
								style={{
									padding: '12px',
									backgroundColor: '#f8f9fa',
									borderRadius: '6px',
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
						<div style={{ display: 'flex', gap: '10px' }}>
							<input
								type="text"
								value={commentText}
								onChange={(e) => setCommentText(e.target.value)}
								placeholder={t('boards.addComment') || 'Dodaj komentarz...'}
								style={{
									flex: 1,
									padding: '10px',
									border: '1px solid #bdc3c7',
									borderRadius: '6px',
									fontSize: '16px'
								}}
							/>
							<button
								type="submit"
								disabled={!commentText.trim()}
								style={{
									padding: '10px 20px',
									backgroundColor: '#3498db',
									color: 'white',
									border: 'none',
									borderRadius: '6px',
									cursor: commentText.trim() ? 'pointer' : 'not-allowed',
									opacity: commentText.trim() ? 1 : 0.5
								}}>
								{t('boards.send') || 'Wyślij'}
							</button>
						</div>
					</form>
				</div>
			</Modal>
		)
	}

	return (
		<div
			ref={setNodeRef}
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
					fontWeight: '600'
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
				{currentTask.assignedTo && currentTask.assignedTo.length > 0 && (
					<div style={{ 
						fontSize: '12px', 
						color: '#95a5a6',
						marginTop: '8px'
					}}>
						👤 {currentTask.assignedTo.map(u => u.username).join(', ')}
					</div>
				)}
			</div>
		</div>
	)
}

export default TaskCard

