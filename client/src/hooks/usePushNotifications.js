import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'

export const usePushNotifications = () => {
	const [isSupported, setIsSupported] = useState(false)
	const [isSubscribed, setIsSubscribed] = useState(false)
	const [subscription, setSubscription] = useState(null)
	const [vapidPublicKey, setVapidPublicKey] = useState(null)
	const [preferences, setPreferences] = useState({
		chat: true,
		tasks: true,
		taskStatusChanges: true,
		leaves: true
	})
	const { loggedIn } = useAuth()

	// Check if push notifications are supported
	useEffect(() => {
		if (typeof window === 'undefined') return

		const checkSupport = async () => {
			// Check for Service Worker support
			if (!('serviceWorker' in navigator)) {
				console.log('[Push] Service Worker not supported')
				setIsSupported(false)
				return
			}

			// Check for Push Manager support
			if (!('PushManager' in window)) {
				console.log('[Push] PushManager not supported')
				setIsSupported(false)
				return
			}

			// Check for Notification API support
			if (!('Notification' in window)) {
				console.log('[Push] Notification API not supported')
				setIsSupported(false)
				return
			}

			console.log('[Push] Push notifications are supported')
			
			// Check notification permission
			if (Notification.permission === 'denied') {
				console.log('[Push] Notification permission denied')
				setIsSupported(false)
				return
			}

			setIsSupported(true)

			// Get VAPID public key
			try {
				const response = await axios.get(`${API_URL}/api/push/vapid-public-key`)
				setVapidPublicKey(response.data.publicKey)
				console.log('[Push] VAPID public key received')
			} catch (error) {
				console.error('[Push] Error getting VAPID public key:', error)
				setIsSupported(false)
				return
			}

			// Wait for service worker to be ready
			try {
				const registration = await navigator.serviceWorker.ready
				console.log('[Push] Service Worker ready, checking for existing subscription')
				
				// Check if push manager is available
				if (!registration.pushManager) {
					console.log('[Push] PushManager not available in service worker')
					setIsSupported(false)
					return
				}
				
				const existingSubscription = await registration.pushManager.getSubscription()
				
				if (existingSubscription) {
					console.log('[Push] Found existing subscription:', existingSubscription.endpoint.substring(0, 50))
					setSubscription(existingSubscription)
					setIsSubscribed(true)
				} else {
					console.log('[Push] No existing subscription found')
				}
			} catch (error) {
				console.error('[Push] Error checking existing subscription:', error)
				// Don't disable support if there's an error, just log it
			}

			// Load preferences
			if (loggedIn) {
				try {
					const response = await axios.get(`${API_URL}/api/push/preferences`, {
						withCredentials: true
					})
					setPreferences(response.data.preferences || preferences)
				} catch (error) {
					console.error('Error loading push preferences:', error)
				}
			}
		}

		checkSupport()
	}, [loggedIn])

	// Subscribe to push notifications
	const subscribe = useCallback(async () => {
		if (!isSupported || !vapidPublicKey || !loggedIn) {
			return { success: false, error: 'Push notifications not supported or not logged in' }
		}

		try {
			// Request notification permission first
			if (Notification.permission === 'default') {
				console.log('[Push] Requesting notification permission...')
				const permission = await Notification.requestPermission()
				console.log('[Push] Notification permission:', permission)
				if (permission !== 'granted') {
					return { success: false, error: 'Notification permission denied' }
				}
			} else if (Notification.permission === 'denied') {
				return { success: false, error: 'Notification permission was denied. Please enable it in browser settings.' }
			}

			const registration = await navigator.serviceWorker.ready
			console.log('[Push] Subscribing to push notifications...')
			
			// Check if push manager is available
			if (!registration.pushManager) {
				return { success: false, error: 'PushManager not available in service worker' }
			}
			
			// Convert VAPID key to Uint8Array
			const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

			const newSubscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey
			})

			console.log('[Push] Subscription created:', newSubscription.endpoint.substring(0, 50))

			// Send subscription to server
			const subscriptionData = {
				endpoint: newSubscription.endpoint,
				keys: {
					p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')),
					auth: arrayBufferToBase64(newSubscription.getKey('auth'))
				},
				userAgent: navigator.userAgent
			}

			console.log('[Push] Registering subscription on server...')
			await axios.post(`${API_URL}/api/push/register`, subscriptionData, {
				withCredentials: true
			})

			console.log('[Push] Subscription registered successfully')
			setSubscription(newSubscription)
			setIsSubscribed(true)

			return { success: true }
		} catch (error) {
			console.error('Error subscribing to push notifications:', error)
			if (error.response?.status === 403) {
				return { success: false, error: 'Permission denied. Please allow notifications in your browser settings.' }
			}
			return { success: false, error: error.message || 'Failed to subscribe to push notifications' }
		}
	}, [isSupported, vapidPublicKey, loggedIn])

	// Unsubscribe from push notifications
	const unsubscribe = useCallback(async () => {
		if (!subscription || !loggedIn) {
			return { success: false, error: 'No active subscription' }
		}

		try {
			await subscription.unsubscribe()

			await axios.post(`${API_URL}/api/push/unregister`, {
				endpoint: subscription.endpoint
			}, {
				withCredentials: true
			})

			setSubscription(null)
			setIsSubscribed(false)

			return { success: true }
		} catch (error) {
			console.error('Error unsubscribing from push notifications:', error)
			return { success: false, error: error.message || 'Failed to unsubscribe from push notifications' }
		}
	}, [subscription, loggedIn])

	// Update preferences
	const updatePreferences = useCallback(async (newPreferences) => {
		if (!loggedIn) {
			return { success: false, error: 'Not logged in' }
		}

		try {
			await axios.put(`${API_URL}/api/push/preferences`, {
				preferences: newPreferences
			}, {
				withCredentials: true
			})

			setPreferences(newPreferences)
			return { success: true }
		} catch (error) {
			console.error('Error updating push preferences:', error)
			return { success: false, error: error.message || 'Failed to update preferences' }
		}
	}, [loggedIn])

	// Helper function to convert VAPID key
	const urlBase64ToUint8Array = (base64String) => {
		const padding = '='.repeat((4 - base64String.length % 4) % 4)
		const base64 = (base64String + padding)
			.replace(/\-/g, '+')
			.replace(/_/g, '/')

		const rawData = window.atob(base64)
		const outputArray = new Uint8Array(rawData.length)

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i)
		}
		return outputArray
	}

	// Helper function to convert ArrayBuffer to Base64
	const arrayBufferToBase64 = (buffer) => {
		const bytes = new Uint8Array(buffer)
		let binary = ''
		for (let i = 0; i < bytes.byteLength; i++) {
			binary += String.fromCharCode(bytes[i])
		}
		return window.btoa(binary)
	}

	return {
		isSupported,
		isSubscribed,
		subscription,
		preferences,
		subscribe,
		unsubscribe,
		updatePreferences
	}
}
