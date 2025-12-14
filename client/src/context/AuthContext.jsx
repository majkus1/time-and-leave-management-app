// context/AuthContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { API_URL } from '../config.js'

const AuthContext = createContext()

// Helper function: sleep for retry delay
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function: check if error is a network error (retryable)
const isNetworkError = (error) => {
	return !error.response && (
		error.code === 'ECONNABORTED' ||
		error.code === 'ETIMEDOUT' ||
		error.code === 'ENOTFOUND' ||
		error.code === 'ECONNRESET' ||
		error.message === 'Network Error'
	)
}

export const AuthProvider = ({ children }) => {
	const [loggedIn, setLoggedIn] = useState(null)
	const [role, setRole] = useState([])
	const [username, setUsername] = useState(null)
	const [teamId, setTeamId] = useState(null)
	const [isTeamAdmin, setIsTeamAdmin] = useState(false)
	const [isCheckingAuth, setIsCheckingAuth] = useState(true)
	
	// Ref to track if component is mounted (prevent state updates after unmount)
	const isMountedRef = useRef(true)
	const abortControllerRef = useRef(null)

	// Helper function to update auth state safely
	const updateAuthState = (data) => {
		if (!isMountedRef.current) return
		setLoggedIn(true)
		setRole(data.roles || [])
		setUsername(data.username || null)
		setTeamId(data.teamId || null)
		setIsTeamAdmin(data.isTeamAdmin || false)
	}

	const clearAuthState = () => {
		if (!isMountedRef.current) return
		setLoggedIn(false)
		setRole([])
		setUsername(null)
		setTeamId(null)
		setIsTeamAdmin(false)
	}

	// Function to attempt refresh token
	const attemptRefreshToken = async () => {
		try {
			await axios.post(`${API_URL}/api/users/refresh-token`, {}, { 
				withCredentials: true,
				timeout: 10000 // 10 second timeout for refresh
			})
			return true
		} catch (error) {
			return false
		}
	}

	// Function to check authentication with retry logic
	const checkAuth = async (retryCount = 0, maxRetries = 3) => {
		// Cancel previous request if exists
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
		}

		// Create new AbortController for this request
		const abortController = new AbortController()
		abortControllerRef.current = abortController

		try {
			const response = await axios.get(`${API_URL}/api/users/me`, {
				withCredentials: true,
				timeout: 30000, // 30 second timeout
				signal: abortController.signal
			})

			// Request was successful
			if (!abortController.signal.aborted) {
				updateAuthState(response.data)
				setIsCheckingAuth(false)
			}
		} catch (error) {
			// Don't process if request was aborted or component unmounted
			if (abortController.signal.aborted || !isMountedRef.current) {
				return
			}

			const status = error.response?.status
			const isNetworkErr = isNetworkError(error)

			// Handle 401 Unauthorized - try to refresh token
			if (status === 401) {
				const refreshSuccess = await attemptRefreshToken()
				
				if (refreshSuccess) {
					// Token refreshed, retry the original request
					if (retryCount < maxRetries) {
						await sleep(500) // Small delay before retry
						return checkAuth(retryCount + 1, maxRetries)
					}
				}
				
				// Refresh failed or max retries reached - user is not authenticated
				clearAuthState()
				setIsCheckingAuth(false)
				return
			}

			// Handle network errors with exponential backoff retry
			if (isNetworkErr && retryCount < maxRetries) {
				const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s
				await sleep(delay)
				return checkAuth(retryCount + 1, maxRetries)
			}

			// Other errors or max retries reached - user is not authenticated
			clearAuthState()
			setIsCheckingAuth(false)
		}
	}

	// Check authentication on mount only (not on every pathname change)
	useEffect(() => {
		isMountedRef.current = true
		setIsCheckingAuth(true)
		checkAuth()

		// Cleanup function
		return () => {
			isMountedRef.current = false
			if (abortControllerRef.current) {
				abortControllerRef.current.abort()
			}
		}
	}, []) // Empty dependency array - only run on mount

	const logout = async () => {
		try {
			await axios.post(`${API_URL}/api/users/logout`, {}, { 
				withCredentials: true,
				timeout: 10000
			})
			clearAuthState()
		} catch (err) {
			console.error('Błąd wylogowania:', err)
			// Even if logout fails, clear local state
			clearAuthState()
		}
	}

	const refreshUserData = async () => {
		try {
			const res = await axios.get(`${API_URL}/api/users/me`, { 
				withCredentials: true,
				timeout: 30000
			})
			updateAuthState(res.data)
		} catch (error) {
			console.error('Błąd odświeżania danych użytkownika:', error)
			// If refresh fails with 401, try to refresh token first
			if (error.response?.status === 401) {
				const refreshSuccess = await attemptRefreshToken()
				if (refreshSuccess) {
					// Retry after token refresh
					try {
						const res = await axios.get(`${API_URL}/api/users/me`, { 
							withCredentials: true,
							timeout: 30000
						})
						updateAuthState(res.data)
					} catch (retryError) {
						console.error('Błąd po odświeżeniu tokenu:', retryError)
					}
				}
			}
		}
	}

	return (
		<AuthContext.Provider
			value={{
				loggedIn,
				role,
				username,
				teamId,
				isTeamAdmin,
				isCheckingAuth,
				setLoggedIn,
				setRole,
				setUsername,
				setTeamId,
				setIsTeamAdmin,
				logout,
				refreshUserData,
			}}>
			{children}
		</AuthContext.Provider>
	)
}
export const useAuth = () => useContext(AuthContext)

