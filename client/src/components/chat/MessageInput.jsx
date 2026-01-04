import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './Chat.css'

function MessageInput({ onSendMessage }) {
	const [message, setMessage] = useState('')
	const textareaRef = useRef(null)
	const { t } = useTranslation()

	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto'
			textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
		}
	}, [message])

	const handleSubmit = (e) => {
		e.preventDefault()
		if (message.trim()) {
			onSendMessage(message.trim())
			setMessage('')
			if (textareaRef.current) {
				textareaRef.current.style.height = 'auto'
			}
		}
	}

	const handleKeyDown = (e) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleSubmit(e)
		}
	}

	return (
		<div className="message-input-container">
			<form onSubmit={handleSubmit} className="message-input-form">
				<textarea
					ref={textareaRef}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={t('chat.messagePlaceholder')}
					className="message-input"
					rows={1}
					maxLength={2000}
				/>
				<button
					type="submit"
					disabled={!message.trim()}
					className="send-button"
					title={t('chat.sendMessage')}
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
						<line x1="22" y1="2" x2="11" y2="13"></line>
						<polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
					</svg>
				</button>
			</form>
		</div>
	)
}

export default MessageInput

















