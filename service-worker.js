// Excaliban Service Worker - Simplified for desktop

const CACHE_VERSION = "0.3.6";
const CACHE_NAME = `excaliban-cache-${CACHE_VERSION}`; // Auto-updates daily
const urlsToCache = [
    "/",
    "/index.html",
    "/styles.css",
    "/js/app.js",
    "/js/board-manager.js",
    "/js/drag-drop.js",
    "/js/pwa.js",
    "/js/storage.js",
    "/js/task-manager.js",
    "/js/utils.js",
    "/js/feedback.js",
    "/js/font-manager.js",
    "/manifest.json",
    "/meta/192x192.png",
    "/meta/512x512.png",
    "/fonts/Virgil-Regular.woff2",
    "/fonts/ComicShanns-Regular.woff2",
    "/fonts/nunito-sans-latin-400-normal.woff2",
];

// Install event - cache assets
self.addEventListener("install", (event) => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(urlsToCache);
        })
    );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            // Delete old cache versions
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Take control of all clients/tabs immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - network first with cache update, fall back to cache
self.addEventListener("fetch", (event) => {
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Check if we received a valid response, and only cache GET requests
                if (
                    !response ||
                    response.status !== 200 ||
                    response.type !== "basic" ||
                    event.request.method !== "GET"
                ) {
                    return response;
                }

                // Clone the response since it can only be consumed once
                const responseToCache = response.clone();

                // Update the cache with the new response
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Fall back to cache if network fails
                return caches.match(event.request);
            })
    );
});
