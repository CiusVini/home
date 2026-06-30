const CACHE_NAME = 'app-diretoria-vimacom-v2';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './financeiro/',
  './vendas/',
  './compras/'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS).catch(() => null))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isGoogleAppsScriptApi(url) {
  return (
    url.hostname.includes('script.google.com') ||
    url.hostname.includes('script.googleusercontent.com') ||
    url.pathname.includes('/macros/s/')
  );
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // APIs do Apps Script não podem ser cacheadas, senão a Home pode mostrar dados antigos
  // mesmo depois de a planilha RADAR já ter sido atualizada.
  if (isGoogleAppsScriptApi(url)) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  event.respondWith(
    fetch(req, { cache: 'no-cache' }).then(resp => {
      const copy = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(() => null);
      return resp;
    }).catch(() => caches.match(req))
  );
});
