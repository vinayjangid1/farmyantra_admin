/*
 * FarmYantra admin service worker: shows desktop alerts pushed by the API
 * through Firebase Cloud Messaging. Messages are data-only { title, body, link }
 * where link is a path inside the admin panel, e.g. /enquiries/<id>.
 * Registered with the panel's base path as scope (see services/push.service.js).
 */
const BASE = new URL('./', self.registration.scope).pathname.replace(/\/$/, '');

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = {};
  }
  const data = message.data || message.notification || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'FarmYantra Admin', {
      body: data.body || '',
      icon: `${BASE}/logo.svg`,
      data: { link: data.link || '/dashboard' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(`${BASE}${event.notification.data?.link || '/dashboard'}`, self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((w) => new URL(w.url).pathname.startsWith(`${BASE}/`));
      if (open) return open.focus().then((w) => (w && 'navigate' in w ? w.navigate(target) : w));
      return self.clients.openWindow(target);
    }),
  );
});
