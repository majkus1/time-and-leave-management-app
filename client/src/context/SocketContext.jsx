import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_URL } from '../config.js'
import { useAuth } from './AuthContext'

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
	const [socket, setSocket] = useState(null)
	const [isConnected, setIsConnected] = useState(false)
	const { loggedIn } = useAuth()
	const socketRef = useRef(null)

	useEffect(() => {
		if (!loggedIn) {
			// Disconnect if user logs out
			if (socketRef.current) {
				socketRef.current.disconnect()
				socketRef.current = null
				setSocket(null)
				setIsConnected(false)
			}
			return
		}

		// Create socket connection
		// Socket.io will use cookies automatically with withCredentials: true
		// Since cookies are httpOnly, they are NOT accessible via document.cookie
		// But they ARE sent automatically with the socket connection
		// Server will read the token from socket.handshake.headers.cookie
		const socketUrl = API_URL.replace('/api', '')
		const newSocket = io(socketUrl, {
			transports: ['websocket', 'polling'],
			withCredentials: true,
			// Don't try to read httpOnly cookies from document.cookie
			// Server will read from headers.cookie automatically
			auth: (cb) => {
				// Pass empty object - server will read token from cookies
				cb({})
			}
		})

		socketRef.current = newSocket

		newSocket.on('connect', () => {
			console.log('Socket connected')
			setIsConnected(true)
		})

		newSocket.on('disconnect', () => {
			console.log('Socket disconnected')
			setIsConnected(false)
		})

		newSocket.on('connect_error', (error) => {
			console.error('Socket connection error:', error)
			setIsConnected(false)
		})

		setSocket(newSocket)

		return () => {
			if (socketRef.current) {
				socketRef.current.disconnect()
				socketRef.current = null
			}
		}
	}, [loggedIn])

	return (
		<SocketContext.Provider value={{ socket, isConnected }}>
			{children}
		</SocketContext.Provider>
	)
}

export const useSocket = () => {
	const context = useContext(SocketContext)
	if (!context) {
		throw new Error('useSocket must be used within SocketProvider')
	}
	return context
}

