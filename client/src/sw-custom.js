// Custom Service Worker code for Push Notifications
// This will be injected into the generated service worker by vite-plugin-pwa

// Listen for push events
self.addEventListener('push', function(event) {
	console.log('Push notification received:', event)
	
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
			console.error('Error parsing push data:', error)
			// Use default notification
		}
	}

	const promiseChain = self.registration.showNotification(notificationData.title, {
		body: notificationData.body,
		icon: notificationData.icon,
		badge: notificationData.badge,
		tag: notificationData.tag,
		data: notificationData.data,
		requireInteraction: notificationData.requireInteraction,
		silent: notificationData.silent,
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
	console.log('Notification clicked:', event)
	
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
	console.log('Notification closed:', event)
})
