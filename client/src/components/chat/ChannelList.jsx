import React from 'react'
import { useTranslation } from 'react-i18next'
import './Chat.css'

function ChannelList({ channels, selectedChannel, currentUserId, currentUserRole, onSelectChannel, onAddMembers, onDeleteChannel, onViewUsers }) {
	const { t } = useTranslation()
	
	// Check if user is Admin
	const isAdmin = currentUserRole && currentUserRole.includes('Admin')
	
	// Helper function to check if user can edit/delete channel
	const canEditChannel = (channel) => {
		// Automatic team channel - no one can edit
		if (channel.isTeamChannel) {
			return false
		}
		// Department channels - no one can edit
		if (channel.type === 'department') {
			return false
		}
		// Private channels - can delete but not edit members
		if (channel.type === 'private') {
			return false // No editing members for private channels
		}
		// Custom general channels - only Admin or creator can edit
		if (channel.type === 'general') {
			const isCreator = channel.createdBy && channel.createdBy.toString() === currentUserId
			return isAdmin || isCreator
		}
		return false
	}
	
	// Helper function to check if user can delete channel
	const canDeleteChannel = (channel) => {
		// Automatic team channel - no one can delete
		if (channel.isTeamChannel) {
			return false
		}
		// Department channels - no one can delete
		if (channel.type === 'department') {
			return false
		}
		// Private channels - only Admin or creator can delete
		if (channel.type === 'private') {
			const isCreator = channel.createdBy && channel.createdBy.toString() === currentUserId
			return isAdmin || isCreator
		}
		// Custom general channels - only Admin or creator can delete
		if (channel.type === 'general') {
			const isCreator = channel.createdBy && channel.createdBy.toString() === currentUserId
			return isAdmin || isCreator
		}
		return false
	}

	return (
		<div className="channel-list">
			{channels.length === 0 ? (
				<div className="no-channels">
					<p>{t('chat.noChannels')}</p>
				</div>
			) : (
				channels.map(channel => (
					<div
						key={channel._id}
						className={`channel-item ${selectedChannel?._id === channel._id ? 'active' : ''}`}
					>
						<div className="channel-item-content" onClick={() => onSelectChannel(channel)}>
							<div className="channel-name">
								<span className="channel-icon">
									{channel.type === 'private' ? '🔒' : '#'}
								</span>
								{channel.name.replace('#', '')}
							</div>
							{channel.unreadCount > 0 && (
								<span className="unread-badge">{channel.unreadCount}</span>
							)}
						</div>
						<div className="channel-actions">
							{/* Show info button for all channels except private ones */}
							{channel.type !== 'private' && onViewUsers && (
								<button
									className="btn-info-channel"
									onClick={(e) => {
										e.stopPropagation()
										onViewUsers(channel)
									}}
									title={t('usersInfo.viewUsers') || 'Zobacz użytkowników'}
									type="button"
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
										<circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" fill="none"/>
										<path d="M8 12V8M8 4H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
									</svg>
								</button>
							)}
							{/* Show add members button only for custom general channels if user is Admin or creator */}
							{canEditChannel(channel) && onAddMembers && (
								<button
									className="btn-add-members"
									onClick={(e) => {
										e.stopPropagation()
										onAddMembers(channel)
									}}
									title={t('chat.addMembers')}
									type="button"
								>
									+
								</button>
							)}
							{/* Show delete button only if user is Admin or creator */}
							{canDeleteChannel(channel) && onDeleteChannel && (
								<button
									className="btn-delete-channel"
									onClick={(e) => {
										e.stopPropagation()
										onDeleteChannel(channel)
									}}
									title={t('chat.deleteChannel')}
									type="button"
								>
									×
								</button>
							)}
						</div>
					</div>
				))
			)}
		</div>
	)
}

export default ChannelList

