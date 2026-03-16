const CACHE_NAME = 'trac-cache-v1';
const ASSETS_TO_CACHE = [
  '/dashboard',
  '/manifest-icon-192.maskable.png',
  '/manifest-icon-512.maskable.png',
  '/favicon-196.png',
  '/apple-icon-180.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// --- PUSH NOTIFICATION LISTENER ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const { title, body, icon, badge, data: extraData } = data;

    const options = {
      body: body || 'You have a new update.',
      // Use PNG icons as fallbacks for better OS compatibility
      icon: icon || '/manifest-icon-192.maskable.png',
      badge: badge || '/favicon-196.png',
      data: extraData || {},
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(title || 'TRAC Notification', options)
    );
  } catch (err) {
    console.error('Error parsing push data:', err);
    event.waitUntil(
      self.registration.showNotification('TRAC Notification', {
        body: event.data.text(),
        icon: '/manifest-icon-192.maskable.png'
      })
    );
  }
});

// --- NOTIFICATION CLICK LISTENER ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/dashboard');
    })
  );
});
