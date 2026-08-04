// Service worker minimo para que el panel sea instalable como app de escritorio.
// Estrategia: siempre desde la red (el panel necesita datos frescos de Supabase);
// si no hay internet, cae al cache del propio panel.
const CACHE = 'vc-panel-v1';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Nunca cachear las llamadas a Supabase / CDN: siempre a la red.
  if (req.url.indexOf('supabase.co') !== -1 || req.url.indexOf('jsdelivr') !== -1) return;
  e.respondWith(
    fetch(req).then((res) => {
      if (req.method === 'GET' && res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
  );
});
