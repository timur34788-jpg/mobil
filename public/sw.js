const CACHE = 'nature-v8';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Firebase ve API isteklerini cache'leme
  const url = e.request.url;
  if (url.includes('firebasedatabase') || url.includes('googleapis') ||
      url.includes('identitytoolkit') || url.includes('firebaseio')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// Push bildirimleri
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Nature.co', {
      body: data.body || 'Yeni bildirim',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: data.url || '/',
      vibrate: [100, 50, 100],
      actions: [
        { action: 'open', title: 'Aç' },
        { action: 'close', title: 'Kapat' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'close') return;
  e.waitUntil(clients.openWindow(e.notification.data || '/'));
});
