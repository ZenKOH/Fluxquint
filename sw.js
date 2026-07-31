const CACHE = 'fluxquint-trademark-v1.1.0';
const ASSETS = [
  './', './index.html', './src/styles.css', './src/main.js', './src/ui/app.js', './src/ui/sound.js',
  './src/ui/storage.js', './src/engine/constants.js', './src/engine/prng.js', './src/engine/quints.js',
  './src/engine/gravity.js', './src/engine/campaign.js', './src/engine/game.js', './src/engine/replay.js',
  './public/manifest.webmanifest', './public/icon.svg', './public/icon-192.png', './public/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
    }
    return response;
  })));
});
