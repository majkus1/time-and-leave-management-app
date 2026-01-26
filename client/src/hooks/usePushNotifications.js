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
		taskStatusChanges: true
	})
	const { loggedIn } = useAuth()

	// Check if push notifications are supported
	useEffect(() => {
		if (typeof window === 'undefined') return

		const checkSupport = async () => {
			if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
				setIsSupported(false)
				return
			}

			setIsSupported(true)

			// Get VAPID public key
			try {
				const response = await axios.get(`${API_URL}/api/push/vapid-public-key`)
				setVapidPublicKey(response.data.publicKey)
			} catch (error) {
				console.error('Error getting VAPID public key:', error)
			}

			// Check existing subscription
			try {
				const registration = await navigator.serviceWorker.ready
				const existingSubscription = await registration.pushManager.getSubscription()
				
				if (existingSubscription) {
					setSubscription(existingSubscription)
					setIsSubscribed(true)
				}
			} catch (error) {
				console.error('Error checking existing subscription:', error)
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
			const registration = await navigator.serviceWorker.ready
			
			// Convert VAPID key to Uint8Array
			const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey)

			const newSubscription = await registration.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: applicationServerKey
			})

			// Send subscription to server
			const subscriptionData = {
				endpoint: newSubscription.endpoint,
				keys: {
					p256dh: arrayBufferToBase64(newSubscription.getKey('p256dh')),
					auth: arrayBufferToBase64(newSubscription.getKey('auth'))
				},
				userAgent: navigator.userAgent
			}

			await axios.post(`${API_URL}/api/push/register`, subscriptionData, {
				withCredentials: true
			})

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
