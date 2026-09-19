const CACHE = 'ukweli-shell-v1';

self.addEventListener('install', e => e.waitUntil(
  caches.open(CACHE).then(c => c.addAll(['/', '/offline.html', '/manifest.webmanifest', '/icon.svg']))
));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
));

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.pathname.startsWith('/admin') || u.pathname.startsWith('/api')) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok && ['style', 'script', 'image', 'font'].includes(e.request.destination)) {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('/offline.html')))
  );
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data.json(); } catch (err) {}
  event.waitUntil(self.registration.showNotification(data.title || 'UKWELISASA.DRC.CD', {
    body: data.body || '',
    image: data.image || undefined,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: {url: data.url || '/'}
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const url = (event.notification.data && event.notification.data.url) || '/';
    const open = await clients.matchAll({type: 'window', includeUncontrolled: true});
    for (const client of open) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) { try { await client.navigate(url); } catch (err) {} }
        return;
      }
    }
    await clients.openWindow(url);
  })());
});
