/* Service worker de Web Push nativo para Mensajería.
   Reemplaza a OneSignalSDKWorker.js: no depende de ningún SDK externo,
   solo usa las APIs estándar PushEvent / notificationclick del navegador. */

self.addEventListener("push", (evento) => {
  // El push llega "silencioso" (sin cuerpo cifrado) porque el envío se
  // firma con VAPID directo desde el Worker, sin librería de cifrado.
  // Por eso siempre mostramos un aviso genérico; el contenido real del
  // mensaje se ve al abrir la app (ya se sincroniza solo por Firestore).
  let datos = {};
  try{ datos = evento.data ? evento.data.json() : {}; }catch(e){ datos = {}; }

  const titulo = datos.titulo || "Mensajería";
  const opciones = {
    body: datos.cuerpo || "Tienes un mensaje nuevo",
    icon: "icon-192.png",
    badge: "icon-192.png",
    data: { url: datos.url || "/Mensajería/" }
  };

  evento.waitUntil(self.registration.showNotification(titulo, opciones));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const url = (evento.notification.data && evento.notification.data.url) || "/Mensajería/";

  evento.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((listaClientes) => {
      for(const cliente of listaClientes){
        if(cliente.url.includes("/Mensajería/") && "focus" in cliente) return cliente.focus();
      }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
