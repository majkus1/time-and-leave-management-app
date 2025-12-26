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
			const response = await axios.post(`${API_URL}/api/users/refresh-token`, {}, { 
				withCredentials: true,
				timeout: 10000, // 10 second timeout for refresh
				skipAuthRefresh: true // Prevent interceptor from trying refresh on refresh-token endpoint
			})
			// Small delay to ensure cookie is set before next request
			await sleep(100)
			return { success: true, response }
		} catch (error) {
			// Check if it's a 401/403 (no refresh token or invalid) vs network error
			const status = error.response?.status
			if (status === 401 || status === 403) {
				return { success: false, noRefreshToken: true }
			}
			return { success: false, noRefreshToken: false }
		}
	}

	// Function to check authentication with retry logic
	// Strategy: First try to refresh token (if exists), then check /me endpoint
	const checkAuth = async (retryCount = 0, maxRetries = 3, hasAttemptedRefresh = false) => {
		// Cancel previous request if exists
		if (abortControllerRef.current) {
			abortControllerRef.current.abort()
		}

		// Create new AbortController for this request
		const abortController = new AbortController()
		abortControllerRef.current = abortController

		// Track if we've attempted refresh in this execution
		let refreshAttempted = hasAttemptedRefresh

		// On first attempt, try to refresh token first (proactive refresh)
		// This ensures we have a valid access token before checking /me
		if (!refreshAttempted && retryCount === 0) {
			const refreshResult = await attemptRefreshToken()
			
			// If component was unmounted during refresh, abort
			if (!isMountedRef.current || abortController.signal.aborted) {
				return
			}

			// If refresh succeeded, proceed to check /me
			// If refresh failed because no refresh token exists, still try /me (user might have valid access token)
			// If refresh failed due to network error, retry
			if (!refreshResult.success && !refreshResult.noRefreshToken) {
				// Network error during refresh - retry with exponential backoff
				if (retryCount < maxRetries) {
					const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
					await sleep(delay)
					return checkAuth(retryCount + 1, maxRetries, false)
				}
			}
			
			// Mark that we've attempted refresh and continue to /me check
			// (whether refresh succeeded or failed due to no refresh token)
			refreshAttempted = true
		}

		try {
			const response = await axios.get(`${API_URL}/api/users/me`, {
				withCredentials: true,
				timeout: 30000, // 30 second timeout
				signal: abortController.signal,
				skipAuthRefresh: true // Flag to prevent axios interceptor from trying refresh (AuthContext handles it)
			})

			// Request was successful
			if (!abortController.signal.aborted && isMountedRef.current) {
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

			// Handle 401 Unauthorized - try to refresh token if we haven't already
			if (status === 401) {
				if (!refreshAttempted) {
					const refreshResult = await attemptRefreshToken()
					
					if (!isMountedRef.current || abortController.signal.aborted) {
						return
					}

					if (refreshResult.success) {
						// Token refreshed successfully, retry /me
						if (retryCount < maxRetries) {
							await sleep(200) // Small delay to ensure cookie propagation
							return checkAuth(retryCount + 1, maxRetries, true)
						}
					}
				}
				
				// Refresh failed or already attempted - user is not authenticated
				clearAuthState()
				setIsCheckingAuth(false)
				return
			}

			// Handle network errors with exponential backoff retry
			if (isNetworkErr && retryCount < maxRetries) {
				const delay = Math.min(1000 * Math.pow(2, retryCount), 10000) // Exponential backoff, max 10s
				await sleep(delay)
				return checkAuth(retryCount + 1, maxRetries, refreshAttempted)
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
				timeout: 30000,
				skipAuthRefresh: true // Flag to prevent axios interceptor from trying refresh (AuthContext handles it)
			})
			updateAuthState(res.data)
		} catch (error) {
			console.error('Błąd odświeżania danych użytkownika:', error)
			// If refresh fails with 401, try to refresh token first
			if (error.response?.status === 401) {
				const refreshResult = await attemptRefreshToken()
				if (refreshResult.success) {
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

