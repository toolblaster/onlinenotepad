const CACHE_NAME = 'online-notepad-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './js-css/style.css',
    './js-css/script.js',
    './favicon/favicon.ico',
    './favicon/favicon.svg',
    './favicon/favicon-96x96.png',
    './favicon/apple-touch-icon.png',
    './favicon/web-app-manifest-192x192.png',
    './favicon/web-app-manifest-512x512.png',
    './favicon/site.webmanifest'
];

// Install Event: Cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Fetch Event: Serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached response if found
                if (response) {
                    return response;
                }
                // Otherwise fetch from network
                return fetch(event.request);
            })
    );
});