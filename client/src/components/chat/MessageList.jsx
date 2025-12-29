import React from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Loader from '../Loader'
import './Chat.css'

function MessageList({ messages, isLoading, messagesEndRef }) {
	const { t, i18n } = useTranslation()
	const { username } = useAuth()

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
					const isOwnMessage = message.userId?.username === username

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
									<div className="message-text">{message.content}</div>
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







