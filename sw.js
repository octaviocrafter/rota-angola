const CACHE = 'rota-v4';
const OLD_CACHES = ['rota-v1', 'rota-v2', 'rota-v3'];
const CORE = ['./', './index.html', './css/style.css', './js/app.js', './js/map.js', './js/auth.js', './js/install.js', './js/sos.js', './db/firebase.js', './manifest.json', './assets/img/logo-aplicacao.jpg', './assets/img/logo-site.jpg', './assets/img/rota-mapa-luanda.jpg', './assets/img/rota-seguranca.jpg', './assets/img/icon-192.png', './assets/img/icon-512.png'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(Promise.all(OLD_CACHES.map((name) => caches.delete(name))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => { if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match('./index.html')))); });
