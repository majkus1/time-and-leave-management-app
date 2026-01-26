import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import Sidebar from '../dashboard/Sidebar'
import Loader from '../Loader'
import { useChannels, useChannelMessages, useSendMessage, useUnreadCount, useDeleteChannel, useChannelUsers } from '../../hooks/useChat'
import { useSocket } from '../../context/SocketContext'
import { useAuth } from '../../context/AuthContext'
import { useAlert } from '../../context/AlertContext'
import ChannelList from './ChannelList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import CreateChannelModal from './CreateChannelModal'
import AddMembersModal from './AddMembersModal'
import CreatePrivateChatModal from './CreatePrivateChatModal'
import UsersInfoModal from '../shared/UsersInfoModal'
import './Chat.css'

function Chat() {
	const [selectedChannel, setSelectedChannel] = useState(null)
	const [messages, setMessages] = useState([])
	const messagesEndRef = useRef(null)
	const [showCreateChannelModal, setShowCreateChannelModal] = useState(false)
	const [showAddMembersModal, setShowAddMembersModal] = useState(false)
	const [showPrivateChatModal, setShowPrivateChatModal] = useState(false)
	const [selectedChannelForMembers, setSelectedChannelForMembers] = useState(null)
	const [usersInfoModal, setUsersInfoModal] = useState({ isOpen: false, channelId: null })
	const { t } = useTranslation()
	const { socket, isConnected } = useSocket()
	const { userId, role } = useAuth()
	const { showAlert, showConfirm } = useAlert()
	const queryClient = useQueryClient()
	
	const { data: channels = [], isLoading: channelsLoading, refetch: refetchChannels } = useChannels()
	const { data: channelMessages = [], isLoading: messagesLoading, refetch: refetchMessages } = useChannelMessages(
		selectedChannel?._id,
		!!selectedChannel
	)
	const { mutate: sendMessage } = useSendMessage()
	const { data: unreadCount = 0 } = useUnreadCount()
	const { mutate: deleteChannel } = useDeleteChannel()
	// Hook dla użytkowników czatu w modalu
	const { data: channelUsers = [], isLoading: loadingChannelUsers } = useChannelUsers(
		usersInfoModal.channelId,
		usersInfoModal.isOpen
	)
	
	// Use refs to avoid including refetch functions in dependencies (prevents infinite loops)
	// Refs are mutable, so we can update them without causing re-renders
	const refetchChannelsRef = useRef(refetchChannels)
	const refetchMessagesRef = useRef(refetchMessages)
	
	// Update refs without useEffect to avoid infinite loops
	// This runs on every render but doesn't cause re-renders because refs are mutable
	refetchChannelsRef.current = refetchChannels
	refetchMessagesRef.current = refetchMessages

	// Track if we've already set the first channel to avoid infinite loops
	const hasSetFirstChannel = useRef(false)
	
	// Set first channel as selected when channels load
	useEffect(() => {
		if (channels.length > 0 && !selectedChannel && !hasSetFirstChannel.current) {
			setSelectedChannel(channels[0])
			hasSetFirstChannel.current = true
		}
		// Reset flag if selectedChannel is cleared
		if (!selectedChannel) {
			hasSetFirstChannel.current = false
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channels.length, selectedChannel?._id])

	// Update messages when channel messages change
	useEffect(() => {
		if (channelMessages) {
			setMessages(channelMessages)
			// After messages are loaded and marked as read, invalidate queries to update unread counts
			// This happens when messages are fetched - they are automatically marked as read on the server
			if (channelMessages.length > 0 && selectedChannel) {
				const timer = setTimeout(() => {
					// Invalidate channels to update unread counts for each channel
					queryClient.invalidateQueries({ queryKey: ['channels'] })
					// Invalidate unread count for sidebar
					queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
				}, 300) // Small delay to ensure server has marked messages as read
				
				return () => clearTimeout(timer)
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [channelMessages, selectedChannel?._id])

	// Join channel room when channel is selected
	useEffect(() => {
		if (socket && selectedChannel) {
			socket.emit('join-channel', selectedChannel._id)
			// Refetch messages after joining channel - this will mark them as read on server
			setTimeout(() => {
				refetchMessagesRef.current()
			}, 100)
		}
		return () => {
			if (socket && selectedChannel) {
				socket.emit('leave-channel', selectedChannel._id)
			}
		}
	}, [socket, selectedChannel?._id])
	
	// Invalidate queries when channel is selected to update unread counts immediately
	useEffect(() => {
		if (selectedChannel) {
			// After a short delay (to allow messages to be marked as read on server)
			const timer = setTimeout(() => {
				queryClient.invalidateQueries({ queryKey: ['channels'] })
				queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
			}, 500)
			
			return () => clearTimeout(timer)
		}
	}, [selectedChannel?._id, queryClient])

	// Listen for new messages via socket
	useEffect(() => {
		if (!socket) return

		const handleNewMessage = (message) => {
			if (message.channelId === selectedChannel?._id) {
				setMessages(prev => [...prev, message])
				// Play notification sound
				playNotificationSound()
			}
			// Refetch channels to update unread counts
			// Use ref to avoid infinite loop
			setTimeout(() => {
				refetchChannelsRef.current()
			}, 100)
		}

		const handleNotification = (data) => {
			// Play sound for any new message notification
			playNotificationSound()
			// Refetch channels to update unread counts
			// Use ref to avoid infinite loop
			setTimeout(() => {
				refetchChannelsRef.current()
			}, 100)
		}

		socket.on('message-received', handleNewMessage)
		socket.on('new-message-notification', handleNotification)

		return () => {
			socket.off('message-received', handleNewMessage)
			socket.off('new-message-notification', handleNotification)
		}
	}, [socket, selectedChannel?._id])

	// Scroll to bottom when new messages arrive
	useEffect(() => {
		scrollToBottom()
	}, [messages])

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}

	const handleSendMessage = (content) => {
		if (!selectedChannel || !content.trim()) return

		sendMessage(
			{ channelId: selectedChannel._id, content },
			{
				onSuccess: (newMessage) => {
					// Message will be added via socket event
					refetchMessagesRef.current()
				},
				onError: (error) => {
					console.error('Error sending message:', error)
				}
			}
		)
	}

	const playNotificationSound = () => {
		try {
			const audio = new Audio('/sounds/notification.mp3')
			audio.volume = 0.5
			audio.play().catch(err => {
				// Fallback: use Web Audio API beep if file doesn't exist
				const audioContext = new (window.AudioContext || window.webkitAudioContext)()
				const oscillator = audioContext.createOscillator()
				const gainNode = audioContext.createGain()
				
				oscillator.connect(gainNode)
				gainNode.connect(audioContext.destination)
				
				oscillator.frequency.value = 800
				oscillator.type = 'sine'
				
				gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
				gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
				
				oscillator.start(audioContext.currentTime)
				oscillator.stop(audioContext.currentTime + 0.2)
			})
		} catch (error) {
			console.error('Error playing notification sound:', error)
		}
	}

	if (channelsLoading) {
		return (
			<>
				<Sidebar />
				<div className="content-with-loader">
					<Loader />
				</div>
			</>
		)
	}

	return (
		<>
			<Sidebar />
			<div className="chat-container">
				<div className="chat-sidebar">
					<div className="chat-header">
						<img src="/img/chat-white.png" alt="chat icon" style={{ marginRight: '10px', width: '24px', height: '24px' }} />
						<h3>{t('chat.title')}</h3>
						{!isConnected && (
							<span className="connection-status disconnected" title={t('chat.disconnected')}>
								●
							</span>
						)}
						{isConnected && (
							<span className="connection-status connected" title={t('chat.connected')}>
								●
							</span>
						)}
					</div>
					<div className="chat-actions">
						<button
							className="btn-create-channel"
							onClick={() => setShowCreateChannelModal(true)}
							title={t('chat.createChannel')}
						>
							<img src="/img/chat-create.png" alt="Create channel" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
							
						</button>
						<button
							className="btn-private-chat"
							onClick={() => setShowPrivateChatModal(true)}
							title={t('chat.createPrivateChat')}
						>
							<img src="/img/chatting.png" alt="Private chat" style={{ width: '20px', height: '20px', marginRight: '8px' }} />
							
						</button>
					</div>
					<ChannelList
						channels={channels}
						selectedChannel={selectedChannel}
						currentUserId={userId}
						currentUserRole={role}
						onSelectChannel={setSelectedChannel}
						onViewUsers={(channel) => {
							setUsersInfoModal({ isOpen: true, channelId: channel._id })
						}}
						onAddMembers={(channel) => {
							setSelectedChannelForMembers(channel)
							setShowAddMembersModal(true)
						}}
						onDeleteChannel={async (channel) => {
							const confirmed = await showConfirm(t('chat.deleteChannelConfirm'))
							if (!confirmed) {
								return
							}
							
							deleteChannel(
								{ channelId: channel._id },
								{
									onSuccess: async () => {
										if (selectedChannel?._id === channel._id) {
											setSelectedChannel(null)
										}
										refetchChannelsRef.current()
										await showAlert(t('chat.deleteChannelSuccess'))
									},
									onError: async (error) => {
										await showAlert(error.response?.data?.message || t('chat.deleteChannelError'))
									}
								}
							)
						}}
					/>
				</div>
				<div className="chat-main">
					{selectedChannel ? (
						<>
							<div className="chat-messages-header">
								<h4>{selectedChannel.name}</h4>
								{selectedChannel.description && (
									<p className="channel-description">{selectedChannel.description}</p>
								)}
							</div>
							<MessageList
								messages={messages}
								isLoading={messagesLoading}
								messagesEndRef={messagesEndRef}
							/>
							<MessageInput onSendMessage={handleSendMessage} />
						</>
					) : (
						<div className="chat-empty">
							<p>{t('chat.selectChannel')}</p>
						</div>
					)}
				</div>
			</div>
			
			<CreateChannelModal
				isOpen={showCreateChannelModal}
				onClose={() => setShowCreateChannelModal(false)}
				onSuccess={() => {
					refetchChannelsRef.current()
				}}
			/>
			
			<AddMembersModal
				isOpen={showAddMembersModal}
				onClose={() => {
					setShowAddMembersModal(false)
					setSelectedChannelForMembers(null)
				}}
				channel={selectedChannelForMembers || selectedChannel}
				onSuccess={() => {
					refetchChannelsRef.current()
				}}
			/>
			
			<CreatePrivateChatModal
				isOpen={showPrivateChatModal}
				onClose={() => setShowPrivateChatModal(false)}
				onSuccess={(channel) => {
					setSelectedChannel(channel)
					refetchChannelsRef.current()
				}}
			/>

			{/* Modal z użytkownikami czatu */}
			<UsersInfoModal
				isOpen={usersInfoModal.isOpen}
				onClose={() => setUsersInfoModal({ isOpen: false, channelId: null })}
				users={channelUsers}
				isLoading={loadingChannelUsers}
				title={t('usersInfo.channelUsers') || 'Użytkownicy czatu'}
			/>
		</>
	)
}

export default Chat

