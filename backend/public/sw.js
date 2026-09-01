/* Kadi service worker — Web Push only. No offline caching (pages must stay live). */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = { title: 'Kadi', body: '', url: '/', tag: 'kadi' };
  try {
    data = Object.assign(data, event.data ? event.data.json() : {});
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      data: { url: data.url },
      icon: '/icon',
      badge: '/icon',
      renotify: true,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c && new URL(c.url).pathname === new URL(url, self.location.origin).pathname) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
