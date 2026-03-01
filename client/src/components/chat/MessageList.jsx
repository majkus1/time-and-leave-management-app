import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { API_URL } from '../../config.js'
import Loader from '../Loader'
import './Chat.css'

function MessageList({ messages, isLoading, messagesEndRef, onEditMessage, onDeleteMessage }) {
	const { t, i18n } = useTranslation()
	const { userId } = useAuth()
	const [editingMessageId, setEditingMessageId] = useState(null)
	const [editValue, setEditValue] = useState('')
	const [isEditSubmitting, setIsEditSubmitting] = useState(false)
	const [deletingMessageId, setDeletingMessageId] = useState(null)

	const formatTime = (dateString) => {
		const date = new Date(dateString)
		return date.toLocaleTimeString(i18n.resolvedLanguage, {
			hour: '2-digit',
			minute: '2-digit'
		})
	}

	const formatDate = (dateString) => {
		const date = new Date(dateString)
		const today = new Date()
		const yesterday = new Date(today)
		yesterday.setDate(yesterday.getDate() - 1)

		if (date.toDateString() === today.toDateString()) {
			return t('chat.today')
		} else if (date.toDateString() === yesterday.toDateString()) {
			return t('chat.yesterday')
		} else {
			return date.toLocaleDateString(i18n.resolvedLanguage, {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			})
		}
	}

	const shouldShowDateSeparator = (currentMessage, previousMessage) => {
		if (!previousMessage) return true
		const currentDate = new Date(currentMessage.createdAt).toDateString()
		const previousDate = new Date(previousMessage.createdAt).toDateString()
		return currentDate !== previousDate
	}

	const formatAttachmentSize = (sizeBytes) => {
		if (typeof sizeBytes !== 'number' || Number.isNaN(sizeBytes)) return ''
		if (sizeBytes < 1024 * 1024) {
			return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
		}
		return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
	}

	const startEditing = (message) => {
		setEditingMessageId(message._id)
		setEditValue(message.content || '')
	}

	const cancelEditing = () => {
		setEditingMessageId(null)
		setEditValue('')
	}

	const saveEdit = async (message) => {
		if (!onEditMessage || isEditSubmitting) return
		const nextContent = editValue.trim()
		const hasAttachments = Array.isArray(message.attachments) && message.attachments.length > 0
		if (!nextContent && !hasAttachments) return

		setIsEditSubmitting(true)
		const success = await onEditMessage(message._id, nextContent)
		setIsEditSubmitting(false)
		if (success) {
			cancelEditing()
		}
	}

	const handleDelete = async (messageId) => {
		if (!onDeleteMessage || deletingMessageId) return
		setDeletingMessageId(messageId)
		try {
			await onDeleteMessage(messageId)
		} finally {
			setDeletingMessageId(null)
		}
	}

	if (isLoading) {
		return (
			<div className="messages-loading">
				<Loader />
			</div>
		)
	}

	return (
		<div className="message-list">
			{messages.length === 0 ? (
				<div className="no-messages">
					<p>{t('chat.noMessages')}</p>
				</div>
			) : (
				messages.map((message, index) => {
					const previousMessage = index > 0 ? messages[index - 1] : null
					const showDateSeparator = shouldShowDateSeparator(message, previousMessage)
					const messageUserId = typeof message.userId === 'string' ? message.userId : message.userId?._id
					const isOwnMessage = messageUserId?.toString() === userId?.toString()
					const isEditingThisMessage = editingMessageId === message._id
					const isDeleted = Boolean(message.isDeleted)

					return (
						<React.Fragment key={message._id}>
							{showDateSeparator && (
								<div className="date-separator">
									<span>{formatDate(message.createdAt)}</span>
								</div>
							)}
							<div className={`message ${isOwnMessage ? 'own-message' : ''}`}>
								<div className="message-avatar">
									{message.userId?.firstName?.[0]?.toUpperCase() || 'U'}
								</div>
								<div className="message-content">
									<div className="message-header">
										<span className="message-author">
											{message.userId?.firstName} {message.userId?.lastName}
										</span>
										<span className="message-time">{formatTime(message.createdAt)}</span>
									</div>
									{isDeleted ? (
										<div className="message-deleted-text">{t('chat.messageDeleted') || 'Wiadomość została usunięta'}</div>
									) : null}
									{!isDeleted && isEditingThisMessage ? (
										<div className="message-edit-form">
											<textarea
												className="message-edit-textarea"
												value={editValue}
												onChange={(e) => setEditValue(e.target.value)}
												maxLength={2000}
												rows={2}
											/>
											<div className="message-edit-actions">
												<button
													type="button"
													className="message-action-btn save"
													onClick={() => saveEdit(message)}
													disabled={isEditSubmitting}
												>
													{t('chat.saveEdit') || t('chat.create') || 'Zapisz'}
												</button>
												<button
													type="button"
													className="message-action-btn cancel"
													onClick={cancelEditing}
													disabled={isEditSubmitting}
												>
													{t('chat.cancelEdit') || t('chat.cancel') || 'Anuluj'}
												</button>
											</div>
										</div>
									) : null}
									{!isDeleted && !isEditingThisMessage && message.content ? <div className="message-text">{message.content}</div> : null}
									{!isDeleted && Array.isArray(message.attachments) && message.attachments.length > 0 && (
										<div className="message-attachments">
											{message.attachments.map((attachment, attachmentIndex) => (
												<a
													key={`${attachment.path || attachment.filename}-${attachmentIndex}`}
													href={`${API_URL}/uploads/${attachment.path}`}
													target="_blank"
													rel="noopener noreferrer"
													className="message-attachment-link"
													title={attachment.filename}
												>
													<span className="message-attachment-link-icon">📎</span>
													<span className="message-attachment-link-name">{attachment.filename}</span>
													{attachment.size ? (
														<span className="message-attachment-link-size">
															{formatAttachmentSize(attachment.size)}
														</span>
													) : null}
												</a>
											))}
										</div>
									)}
									{isOwnMessage && !isDeleted && !isEditingThisMessage ? (
										<div className="message-actions">
											<button
												type="button"
												className="message-action-btn"
												onClick={() => startEditing(message)}
												title={t('chat.editMessage') || 'Edytuj wiadomość'}
											>
												{t('chat.editMessageShort') || 'Edytuj'}
											</button>
											<button
												type="button"
												className="message-action-btn danger"
												onClick={() => handleDelete(message._id)}
												disabled={deletingMessageId === message._id}
												title={t('chat.deleteMessage') || 'Usuń wiadomość'}
											>
												{deletingMessageId === message._id
													? (t('chat.deletingMessage') || 'Usuwanie...')
													: (t('chat.deleteMessageShort') || 'Usuń')}
											</button>
										</div>
									) : null}
								</div>
							</div>
						</React.Fragment>
					)
				})
			)}
			<div ref={messagesEndRef} />
		</div>
	)
}

export default MessageList
























