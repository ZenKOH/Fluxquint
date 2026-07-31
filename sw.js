const CACHE = 'fluxquint-trademark-v1';
const ASSETS = [
  './', './index.html', './src/styles.css', './src/main.js', './src/ui/app.js', './src/ui/sound.js',
  './src/ui/storage.js', './src/engine/constants.js', './src/engine/prng.js', './src/engine/quints.js',
  './src/engine/gravity.js', './src/engine/campaign.js', './src/engine/game.js', './src/engine/replay.js',
  './public/manifest.webmanifest', './public/icon.svg', './public/icon-192.png', './public/icon-512.png'
];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS))));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match('./index.html'))));
});
