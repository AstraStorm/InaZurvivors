// Keeps the hashed resources (a/<hash>.ext): a new content has a new name, so a stored file is never stale.
const STORE = 'inazurvivors-recursos-v1';
const HASHED = /\/a\/[0-9a-f]{16}\.(webp|png|jpg|json)$/;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || !HASHED.test(url.pathname)) return;
  e.respondWith(caches.open(STORE).then(async (store) => {
    const hit = await store.match(url.pathname);
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res.ok) await store.put(url.pathname, res.clone());
    return res;
  }));
});
