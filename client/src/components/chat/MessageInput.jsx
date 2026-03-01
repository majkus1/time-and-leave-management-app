import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './Chat.css'

const MAX_ATTACHMENTS = 5
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024

function MessageInput({ onSendMessage, isSending = false, onValidationError = null }) {
	const [message, setMessage] = useState('')
	const [attachments, setAttachments] = useState([])
	const textareaRef = useRef(null)
	const fileInputRef = useRef(null)
	const { t } = useTranslation()

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [message])

	const handleSubmit = (e) => {
		e.preventDefault()
		const trimmedMessage = message.trim()
		if (!trimmedMessage && attachments.length === 0) return

		onSendMessage({
			content: trimmedMessage,
			attachments
		})
		setMessage('')
		setAttachments([])
		if (fileInputRef.current) {
			fileInputRef.current.value = ''
		}
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
		}
	}

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	const handlePickAttachments = (event) => {
		const pickedFiles = Array.from(event.target.files || [])
		if (pickedFiles.length === 0) return

		setAttachments((prev) => {
			const next = [...prev]
			let skippedForLimit = 0
			let skippedForSize = 0
			for (const file of pickedFiles) {
				if (next.length >= MAX_ATTACHMENTS) {
					skippedForLimit += 1
					continue
				}
				if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
					skippedForSize += 1
					continue
				}
				const duplicate = next.some((existing) =>
					existing.name === file.name &&
					existing.size === file.size &&
					existing.lastModified === file.lastModified
				)
				if (!duplicate) {
					next.push(file)
				}
			}

			if (typeof onValidationError === 'function') {
				if (skippedForSize > 0) {
					onValidationError(t('chat.attachmentTooLarge') || 'Maksymalny rozmiar jednego pliku to 10 MB.')
				}
				if (skippedForLimit > 0) {
					onValidationError(t('chat.attachmentLimitReached') || 'Możesz dodać maksymalnie 5 załączników do wiadomości.')
				}
			}

			return next
		})

		event.target.value = ''
	}

	const handleRemoveAttachment = (attachmentIndex) => {
		setAttachments((prev) => prev.filter((_, index) => index !== attachmentIndex))
	}

	const formatFileSize = (sizeBytes) => {
		if (sizeBytes < 1024 * 1024) {
			return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`
		}
		return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`
	}

	return (
		<div className="message-input-container">
			<form onSubmit={handleSubmit} className="message-input-form">
				<input
					ref={fileInputRef}
					type="file"
					multiple
					className="message-attachment-input"
					onChange={handlePickAttachments}
					accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
				/>
				<button
					type="button"
					className="attachment-button"
					onClick={() => fileInputRef.current?.click()}
					title={t('chat.addAttachment') || 'Dodaj załącznik'}
					disabled={attachments.length >= MAX_ATTACHMENTS || isSending}
				>
					<img
						src="/img/attach-file.png"
						alt={t('chat.addAttachment') || 'Dodaj załącznik'}
						className="attachment-button-icon"
					/>
				</button>
				<textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={t('chat.messagePlaceholder')}
					className="message-input"
					rows={1}
					maxLength={2000}
					disabled={isSending}
				/>
				<button
					type="submit"
					disabled={(!message.trim() && attachments.length === 0) || isSending}
					className="send-button"
					title={t('chat.sendMessage')}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="22" y1="2" x2="11" y2="13"></line>
						<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
					</svg>
				</button>
			</form>
			{attachments.length > 0 && (
				<div className="message-attachments-preview">
					{attachments.map((file, index) => (
						<div className="message-attachment-chip" key={`${file.name}-${file.lastModified}-${index}`}>
							<span className="message-attachment-chip-name">{file.name}</span>
							<span className="message-attachment-chip-size">{formatFileSize(file.size)}</span>
							<button
								type="button"
								className="message-attachment-chip-remove"
								onClick={() => handleRemoveAttachment(index)}
								disabled={isSending}
								aria-label={t('chat.removeAttachment') || 'Usuń załącznik'}
							>
								×
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

export default MessageInput
























