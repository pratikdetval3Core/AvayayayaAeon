/**
 * Service Worker
 * Handles offline functionality, caching, and background sync
 */

const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `payroll-app-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/pages/offline.html';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/pages/login.html',
  '/pages/signup.html',
  '/pages/dashboard.html',
  '/pages/attendance.html',
  '/pages/invoice.html',
  '/pages/leave.html',
  '/pages/kpi.html',
  '/pages/profile.html',
  '/pages/reports.html',
  OFFLINE_PAGE,
  '/css/variables.css',
  '/css/base.css',
  '/css/components.css',
  '/css/utilities.css',
  '/css/auth.css',
  '/css/dashboard.css',
  '/css/attendance.css',
  '/css/invoice.css',
  '/css/leave.css',
  '/css/kpi.css',
  '/css/profile.css',
  '/css/reports.css',
  '/js/app.js',
  '/js/services/auth.js',
  '/js/services/database.js',
  '/js/services/storage.js',
  '/js/utils/router.js',
  '/js/utils/validation.js',
  '/js/utils/date-utils.js',
  '/js/utils/feedback.js',
  '/js/utils/error-handler.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached response and update cache in background
          updateCache(request);
          return cachedResponse;
        }

        // Fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Cache the response
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed:', error);
            
            // Return offline page for navigation requests
            if (request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            
            // Return cached response if available
            return caches.match(request);
          });
      })
  );
});

// Background sync event - sync pending data
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendance());
  } else if (event.tag === 'sync-invoices') {
    event.waitUntil(syncInvoices());
  } else if (event.tag === 'sync-leave') {
    event.waitUntil(syncLeave());
  } else if (event.tag === 'sync-kpi') {
    event.waitUntil(syncKPI());
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/assets/images/icon-192x192.png',
    badge: '/assets/images/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/assets/images/icon-view.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/images/icon-close.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Payroll App', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message event - handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME)
        .then(() => {
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        })
    );
  } else if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

/**
 * Update cache in background
 * @param {Request} request - Request to update
 */
function updateCache(request) {
  fetch(request)
    .then((response) => {
      if (response && response.status === 200) {
        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(request, response);
          });
      }
    })
    .catch((error) => {
      console.error('[Service Worker] Cache update failed:', error);
    });
}

/**
 * Sync pending attendance records
 */
async function syncAttendance() {
  try {
    console.log('[Service Worker] Syncing attendance...');
    // Implementation would sync pending attendance records
    // This is a placeholder for the actual sync logic
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Attendance sync failed:', error);
    throw error;
  }
}

/**
 * Sync pending invoices
 */
async function syncInvoices() {
  try {
    console.log('[Service Worker] Syncing invoices...');
    // Implementation would sync pending invoices
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Invoice sync failed:', error);
    throw error;
  }
}

/**
 * Sync pending leave applications
 */
async function syncLeave() {
  try {
    console.log('[Service Worker] Syncing leave applications...');
    // Implementation would sync pending leave applications
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Leave sync failed:', error);
    throw error;
  }
}

/**
 * Sync pending KPI entries
 */
async function syncKPI() {
  try {
    console.log('[Service Worker] Syncing KPI entries...');
    // Implementation would sync pending KPI entries
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] KPI sync failed:', error);
    throw error;
  }
}
