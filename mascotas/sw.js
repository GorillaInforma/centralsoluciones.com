const CACHE_NAME = "gdm-cache-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Fetch handler mínimo: requerido por Chrome/Android para considerar
// la app "instalable". Deja pasar todas las peticiones normalmente.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});

// Permite mostrar notificaciones reales en la barra del sistema
// aunque la pestaña esté en segundo plano.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: "Gobierno de Mascotas", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Gobierno de Mascotas";
  const options = {
    body: data.body || "",
    icon: "icon-192.png",
    badge: "icon-192.png",
    vibrate: [100, 50, 100],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow("./gobierno-mascotas-final-notif.html");
    })
  );
});
