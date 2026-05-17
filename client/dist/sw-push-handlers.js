// Push notification handlers for dev mode (generateSW)
// This file is imported by the generated service worker

// Listen for push events
self.addEventListener('push', function(event) {
	console.log('[SW] Push notification received:', event)
	
	let notificationData = {
		title: 'Planopia',
		body: 'Masz nowe powiadomienie',
		icon: '/icon-192x192.png',
		badge: '/icon-96x96.png',
		tag: 'default',
		data: {
			url: '/dashboard'
		}
	}

	// Parse push data if available
	if (event.data) {
		try {
			const data = event.data.json()
			console.log('[SW] Parsed push data:', data)
			notificationData = {
				title: data.title || notificationData.title,
				body: data.body || notificationData.body,
				icon: data.icon || notificationData.icon,
				badge: data.badge || notificationData.badge,
				tag: data.tag || notificationData.tag,
				data: data.data || notificationData.data,
				requireInteraction: data.requireInteraction || false,
				silent: data.silent || false
			}
		} catch (error) {
			console.error('[SW] Error parsing push data:', error)
			// Try to get text if JSON fails
			if (event.data.text) {
				try {
					const data = JSON.parse(event.data.text())
					notificationData = {
						title: data.title || notificationData.title,
						body: data.body || notificationData.body,
						icon: data.icon || notificationData.icon,
						badge: data.badge || notificationData.badge,
						tag: data.tag || notificationData.tag,
						data: data.data || notificationData.data,
						requireInteraction: data.requireInteraction || false,
						silent: data.silent || false
					}
				} catch (e) {
					console.error('[SW] Error parsing push data as text:', e)
				}
			}
		}
	}

	console.log('[SW] Showing notification:', notificationData.title, notificationData.body)

	const promiseChain = self.registration.showNotification(notificationData.title, {
		body: notificationData.body,
		icon: notificationData.icon,
		badge: notificationData.badge,
		tag: notificationData.tag,
		data: notificationData.data,
		requireInteraction: notificationData.requireInteraction,
		silent: notificationData.silent,
		vibrate: [200, 100, 200],
		timestamp: Date.now(),
		actions: [
			{
				action: 'open',
				title: 'Otwórz'
			},
			{
				action: 'close',
				title: 'Zamknij'
			}
		]
	})

	event.waitUntil(promiseChain)
})

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
	console.log('[SW] Notification clicked:', event)
	
	event.notification.close()

	if (event.action === 'close') {
		return
	}

	// Default action or 'open' action - navigate to the URL
	const urlToOpen = event.notification.data?.url || '/dashboard'

	event.waitUntil(
		clients.matchAll({
			type: 'window',
			includeUncontrolled: true
		}).then(function(clientList) {
			// Check if there's already a window/tab open with the target URL
			for (let i = 0; i < clientList.length; i++) {
				const client = clientList[i]
				if (client.url.includes(urlToOpen) && 'focus' in client) {
					return client.focus()
				}
			}
			// If no window is open, open a new one
			if (clients.openWindow) {
				return clients.openWindow(urlToOpen)
			}
		})
	)
})

// Handle notification close
self.addEventListener('notificationclose', function(event) {
	console.log('[SW] Notification closed:', event)
})
