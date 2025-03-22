const CACHE_NAME = 'flight-booking-v1';
const RUNTIME_CACHE = 'runtime-cache';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png'
];

// Install event - precache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle offline functionality
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful API responses
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline data from IndexedDB if available
            return handleOfflineApiRequest(event.request);
          });
        })
    );
    return;
  }

  // Handle static assets and pages
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        // Cache successful responses for static assets
        if (response.ok && (
          event.request.url.includes('/static/') ||
          event.request.url.includes('/icons/') ||
          event.request.destination === 'style' ||
          event.request.destination === 'script' ||
          event.request.destination === 'image'
        )) {
          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      }).catch(() => {
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline content not available');
      });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Handle offline API requests using IndexedDB
async function handleOfflineApiRequest(request) {
  // Implementation will use the existing IndexedDB service
  // to fetch cached flight search results and bookings
  if (request.url.includes('/api/flights/search')) {
    return new Response(JSON.stringify({
      offline: true,
      message: 'Using cached flight data',
      data: await getCachedFlightData(request.url)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.url.includes('/api/bookings')) {
    return new Response(JSON.stringify({
      offline: true,
      message: 'Using cached booking data',
      data: await getCachedBookingData(request.url)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({
    offline: true,
    message: 'No cached data available'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Sync offline bookings when back online
async function syncBookings() {
  const offlineBookings = await getOfflineBookings();
  for (const booking of offlineBookings) {
    try {
      await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      await removeOfflineBooking(booking.id);
    } catch (error) {
      console.error('Error syncing booking:', error);
    }
  }
}
