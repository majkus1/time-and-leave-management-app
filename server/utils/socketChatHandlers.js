const { userCanAccessChannelById } = require('./chatChannelAccess')

/**
 * Bezpieczne handlery Socket.IO dla czatu — join tylko po tej samej walidacji co REST.
 */
function registerChatSocketHandlers(io) {
	io.on('connection', (socket) => {
		console.log(`User connected: ${socket.userId}`)

		socket.join(`user:${socket.userId}`)
		socket.join(`team:${socket.teamId}`)

		socket.on('join-channel', async (channelId) => {
			try {
				const allowed = await userCanAccessChannelById(socket.userId, channelId)
				if (!allowed) {
					return
				}
				socket.join(`channel:${channelId}`)
			} catch (error) {
				console.error('Socket join-channel error:', error.message)
			}
		})

		socket.on('leave-channel', (channelId) => {
			if (channelId) {
				socket.leave(`channel:${channelId}`)
			}
		})

		socket.on('new-message', async (data) => {
			try {
				const channelId = data?.channelId
				const message = data?.message
				if (!channelId || !message) return

				const allowed = await userCanAccessChannelById(socket.userId, channelId)
				if (!allowed) return

				io.to(`channel:${channelId}`).emit('message-received', message)
				io.to(`team:${socket.teamId}`).emit('new-message-notification', {
					channelId,
					message,
				})
			} catch (error) {
				console.error('Socket new-message error:', error.message)
			}
		})

		socket.on('disconnect', () => {
			console.log(`User disconnected: ${socket.userId}`)
		})
	})
}

module.exports = { registerChatSocketHandlers }
