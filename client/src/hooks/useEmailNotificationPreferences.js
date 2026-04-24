import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { API_URL } from '../config'
import { useAuth } from '../context/AuthContext'

const DEFAULT_EMAIL_PREFERENCES = {
	chat: true,
	tasks: true,
	taskStatusChanges: true,
	taskComments: true,
	leaves: true,
	announcements: true,
	schedulePublished: true,
}

export function useEmailNotificationPreferences() {
	const { loggedIn } = useAuth()
	const [preferences, setPreferences] = useState(DEFAULT_EMAIL_PREFERENCES)
	const [isLoading, setIsLoading] = useState(false)

	useEffect(() => {
		if (!loggedIn) return
		let isMounted = true
		setIsLoading(true)
		axios
			.get(`${API_URL}/api/email-notifications/preferences`, { withCredentials: true })
			.then((response) => {
				if (!isMounted) return
				setPreferences({
					...DEFAULT_EMAIL_PREFERENCES,
					...(response.data?.preferences || {}),
				})
			})
			.catch((error) => {
				console.error('Error loading email notification preferences:', error)
			})
			.finally(() => {
				if (isMounted) setIsLoading(false)
			})
		return () => {
			isMounted = false
		}
	}, [loggedIn])

	const updatePreferences = useCallback(
		async (nextPreferences) => {
			if (!loggedIn) return { success: false, error: 'Not logged in' }
			try {
				const payload = { ...DEFAULT_EMAIL_PREFERENCES, ...nextPreferences }
				await axios.put(
					`${API_URL}/api/email-notifications/preferences`,
					{ preferences: payload },
					{ withCredentials: true }
				)
				setPreferences(payload)
				return { success: true }
			} catch (error) {
				console.error('Error updating email notification preferences:', error)
				return { success: false, error: error.message || 'Failed to update email preferences' }
			}
		},
		[loggedIn]
	)

	return {
		preferences,
		isLoading,
		updatePreferences,
	}
}
