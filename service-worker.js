// Service Worker - Treinos Ricardo
const CACHE_NAME = 'treinos-ricardo-v2';

// Todos os recursos necessários para o app funcionar offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  // CDN do Tailwind (tenta cachear, mas app funciona sem ele pois tudo está inline)
  'https://cdn.tailwindcss.com',
  // Font Awesome
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/webfonts/fa-regular-400.woff2',
];

// --- INSTALL: Cacheia os assets essenciais ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cacheia recursos locais obrigatoriamente
      const localAssets = ['./', './index.html', './manifest.json'];
      return cache.addAll(localAssets).then(() => {
        // Tenta cachear recursos externos (falha silenciosa)
        const externalAssets = ASSETS_TO_CACHE.filter(url => url.startsWith('http'));
        return Promise.allSettled(
          externalAssets.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(response => cache.put(url, response))
              .catch(() => {}) // ignora falhas de CDN
          )
        );
      });
    }).then(() => self.skipWaiting())
  );
});

// --- ACTIVATE: Remove caches antigos ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// --- FETCH: Estratégia Cache-First com fallback para rede ---
self.addEventListener('fetch', (event) => {
  // Ignora requisições não-GET
  if (event.request.method !== 'GET') return;

  // Ignora extensões do Chrome e outras URLs internas
  if (event.request.url.startsWith('chrome-extension://')) return;

  // Firebase / Google Auth: sempre vai para a rede (nunca cacheia)
  const bypassDomains = ['firestore.googleapis.com', 'identitytoolkit.googleapis.com', 'securetoken.googleapis.com', 'firebaseapp.com', 'googleapis.com'];
  if (bypassDomains.some(d => event.request.url.includes(d))) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Recurso no cache: serve imediatamente e atualiza em background
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(() => {}); // Falha silenciosa: está offline, usa o cache

        return cachedResponse;
      }

      // Recurso não está no cache: busca na rede e cacheia
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() => {
          // Offline e sem cache: tenta retornar o index.html como fallback
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
