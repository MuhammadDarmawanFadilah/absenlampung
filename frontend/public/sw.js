// Service Worker for PWA - Auto-generated
// Generated at: 2025-08-24T00:49:16.974Z

// Dynamic cache name with timestamp for development
const VERSION = '0.1.0';
const BUILD_TIME = 1755996556974;
const isDev = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
const CACHE_NAME = isDev ? `absensi-lampung-dev-${BUILD_TIME}` : `absensi-lampung-v${VERSION}`;
const OFFLINE_URL = '/offline';

// Files to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/logo.png',
  '/logo.svg',
  '/favicon.ico'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Install event - Cache:', CACHE_NAME);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .catch((error) => {
        console.error('Service Worker: Error caching static files:', error);
      })
  );
  
  // Force the service worker to take control immediately
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cache);
              return caches.delete(cache);
            }
          })
        );
      })
      .then(() => {
        // Take control of all open clients
        return self.clients.claim();
      })
  );
});

// Fetch event - serve files from cache or network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API requests
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Skip Chrome extension requests
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Skip Next.js dev files
  if (event.request.url.includes('/_next/webpack-hmr') || 
      event.request.url.includes('/_next/static/webpack/') ||
      event.request.url.includes('/__nextjs_original-stack-frame')) {
    return;
  }
  
  event.respondWith(
    // In development, always try network first for better development experience
    isDev ? 
      fetch(event.request)
        .then((response) => {
          // Don't cache in development for most files except static assets
          if (event.request.url.includes('/logo.') || 
              event.request.url.includes('/favicon.') ||
              event.request.url.includes('/manifest.json')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request)
            .then((response) => {
              if (response) {
                return response;
              }
              // Network failed, try to serve offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              // For other requests, try to find any suitable cached response
              return caches.match('/');
            });
        })
    :
      // Production: Cache first strategy
      caches.match(event.request)
        .then((response) => {
          // Return cached version if available
          if (response) {
            return response;
          }
          
          // Fetch from network
          return fetch(event.request)
            .then((response) => {
              // Don't cache non-successful responses
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response before caching
              const responseToCache = response.clone();
              
              // Cache GET requests to same origin
              if (event.request.url.startsWith(self.location.origin)) {
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
              }
              
              return response;
            })
            .catch(() => {
              // Network failed, try to serve offline page for navigation requests
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              
              // For other requests, try to find any suitable cached response
              return caches.match('/');
            });
        })
  );
});

// Handle push notifications (optional)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push event received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from Absensi Lampung',
      icon: '/logo.png',
      badge: '/logo.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey || 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Open App',
          icon: '/logo.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/logo.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Absensi Lampung', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync (optional)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync event');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations
      console.log('Performing background sync')
    );
  }
});

console.log('Service Worker: Loaded successfully');
console.log('Environment:', isDev ? 'Development' : 'Production');
console.log('Cache Name:', CACHE_NAME);
console.log('Build Time:', new Date(BUILD_TIME).toLocaleString());
