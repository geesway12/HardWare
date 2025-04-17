
const CACHE_NAME = 'hardware-cache-v1';
const urlsToCache = [
  'index.html',
  'products.html',
  'sales.html',
  'inventory.html',
  'settings.html',
  'utils.js',
  'index.js',
  'products.js',
  'sales.js',
  'inventory.js',
  'settings.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
