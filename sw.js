// Service Worker ROTA: a instalação não falha se um asset opcional estiver indisponível.
const CACHE = 'rota-v5';
const OLD_CACHES = ['rota-v1', 'rota-v2', 'rota-v3', 'rota-v4'];
const CORE = ['./', './index.html', './css/style.css', './js/app.js', './js/map.js', './js/reservations.js', './js/passenger.js', './js/driver.js', './js/admin.js', './js/auth.js', './js/install.js', './js/sos.js', './db/firebase.js', './db/firebase-config.js', './manifest.json', './pages/painel-passageiro.html', './pages/painel-motorista.html', './pages/painel-admin.html', './assets/img/logo-aplicacao.jpg', './assets/img/logo-site.jpg', './assets/img/rota-mapa-luanda.jpg', './assets/img/rota-seguranca.jpg', './assets/img/icon-192.png', './assets/img/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(CORE.map(async (asset) => {
      try { await cache.add(asset); } catch (error) { console.warn('[ROTA] asset opcional não guardado:', asset); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await Promise.all(OLD_CACHES.map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok && new URL(event.request.url).origin === self.location.origin) {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
      }
      return response;
    } catch (error) {
      if (event.request.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
