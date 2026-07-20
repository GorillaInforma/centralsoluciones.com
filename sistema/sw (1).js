// Service worker mínimo — solo existe para que el navegador considere la
// app "instalable". No cachea nada todavía (la app siempre carga fresca
// desde el servidor), así que no hay riesgo de que quede una versión vieja
// pegada en el teléfono de nadie.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
