// Excaliban Service Worker - Simplified for desktop

const CACHE_VERSION = new Date().toISOString().split('T')[0].replace(/-/g, '');
const CACHE_NAME = `excaliban-cache-${CACHE_VERSION}`; // Auto-updates daily
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/js/app.js',
  '/js/board-manager.js',
  '/js/drag-drop.js',
  '/js/pwa.js',
  '/js/storage.js',
  '/js/task-manager.js',
  '/js/utils.js',
  '/manifest.json',
  '/icons/192x192.png',
  '/icons/512x512.png'
];

// Install event - cache assets
self.addEventListener('install', event => {
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            // Delete old cache versions
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients/tabs immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});