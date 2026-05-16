// Service Worker for Planopia PWA
// This file will be used with injectManifest strategy

const SW_DEV =
	typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV === true
self.__WB_DISABLE_DEV_LOGS = !SW_DEV

function swLog(...args) {
	if (SW_DEV) console.log(...args)
}

// Import workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js')

// Automatyczna aktywacja nowego service workera - użytkownicy zawsze otrzymają najnowszą wersję
self.skipWaiting()

if (workbox) {
	swLog('[SW] Workbox loaded')
	
	// Precache files
	workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || [])

	// API: zawsze sieć — bez cache (sesja, CSRF, dane tenantów)
	workbox.routing.registerRoute(
		({ url }) => {
			if (!url.pathname.startsWith('/api/')) return false
			return (
				url.hostname === 'api.planopia.pl' ||
				url.hostname === 'localhost' ||
				url.hostname === '127.0.0.1'
			)
		},
		new workbox.strategies.NetworkOnly()
	)

	workbox.routing.registerRoute(
		/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
		new workbox.strategies.CacheFirst({
			cacheName: 'images-cache',
			plugins: [
				{
					expiration: {
						maxEntries: 100,
						maxAgeSeconds: 30 * 24 * 60 * 60
					}
				}
			]
		})
	)
	
	workbox.routing.registerRoute(
		/\.(?:woff|woff2|ttf|eot)$/i,
		new workbox.strategies.CacheFirst({
			cacheName: 'fonts-cache',
			plugins: [
				{
					expiration: {
						maxEntries: 20,
						maxAgeSeconds: 365 * 24 * 60 * 60
					}
				}
			]
		})
	)
} else {
	console.warn('[SW] Workbox could not be loaded')
}

// ============================================
// PUSH NOTIFICATIONS HANDLERS
// ============================================
importScripts('/timer-notification-sw.js')

self.addEventListener('message', function (event) {
	if (!event.data) return
	event.waitUntil(planopiaHandleTimerClientMessage(event.data))
})

// Listen for push events
self.addEventListener('push', function(event) {
	swLog('[SW] Push notification received:', event)
	
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
	let parsedPush = null
	if (event.data) {
		try {
			const data = event.data.json()
			parsedPush = data
			swLog('[SW] Parsed push data:', data)
			if (data.type === 'timer') {
				event.waitUntil(planopiaApplyTimerPushData(data))
				return
			}
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

	swLog('[SW] Showing notification:', notificationData.title, notificationData.body)

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
	swLog('[SW] Notification clicked:', event)
	
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
	swLog('[SW] Notification closed:', event)
})

// ============================================
// AUTOMATYCZNE CZYSZCZENIE STARYCH CACHE
// ============================================

// Czyszczenie starych cache przy instalacji nowego service workera
self.addEventListener('activate', function(event) {
	swLog('[SW] Activating new service worker, cleaning old caches...')
	
	event.waitUntil(
		caches.keys().then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName) {
					if (cacheName.startsWith('workbox-')) {
						return Promise.resolve()
					}
					// Stare cache API (przed NetworkOnly) — zawsze usuń przy aktualizacji SW
					if (cacheName === 'api-cache' || cacheName === 'api-requests-cache') {
						swLog('[SW] Deleting legacy API cache:', cacheName)
						return caches.delete(cacheName)
					}
					// Usuń inne stare cache (jeśli są)
					swLog('[SW] Deleting old cache:', cacheName)
					return caches.delete(cacheName)
				})
			).then(function() {
				// Natychmiast przejmij kontrolę nad wszystkimi klientami
				return self.clients.claim()
			})
		})
	)
})

// Sprawdzaj aktualizacje service workera przy każdym uruchomieniu
self.addEventListener('install', function(event) {
	swLog('[SW] Installing new service worker version')
	// skipWaiting() już wywołane na początku, więc nowy SW aktywuje się natychmiast
	event.waitUntil(self.skipWaiting())
})
