/* Offline support. Network first, so a new version shows up right away when online;
   falls back to the cached copy when offline. */
const CACHE = 'dep-dashboard-v32';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './assets/app.css',
  './timeoff/', './timeoff/index.html', './timeoff/app.js', './timeoff/leave.js',
  './icons/icon-v3.svg', './icons/icon-v3-192.png', './icons/icon-v3-512.png', './icons/apple-touch-icon-v3.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req, { cache: 'no-cache' });
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(req, { ignoreSearch: true })) || Response.error();
    }
  })());
});
