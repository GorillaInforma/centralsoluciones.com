/* Service worker de Web Push nativo para Mensajería.
   - Agrupa mensajes seguidos de la misma conversación en una sola
     notificación (como WhatsApp), en vez de ir apilando avisos sueltos.
   - Agrega botones de acción: Responder, Marcar leído, Silenciar.
     "Marcar leído" y "Silenciar" funcionan sin necesidad de abrir la app,
     usando la API REST de Firestore (mismo proyecto/API key públicos que
     ya usa index.html; están protegidos por las reglas de Firestore, no
     por ser secretos). */

const PROJECT_ID = "mensajeria-8b60a";
const API_KEY = "AIzaSyAsmQ5ZjQUYatWzgxszvmEnHB5Tt9WLI34";
const HORAS_SILENCIO = 8; // duración del "Silenciar" por conversación

/* ===== Ciclo de vida del service worker + caché del "shell" de la app
   (para poder abrirla sin conexión, como una app instalada de verdad) ===== */

const CACHE_APP_SHELL = "gorilla-chat-shell-v1";
const ARCHIVOS_APP_SHELL = [
  "/chat/",
  "/chat/index.html",
  "/chat/manifest.json",
  "/chat/favicon-32.png",
  "/chat/icon-192.png",
  "/chat/icon-512.png",
  "/chat/icon-apple-touch.png",
  "/chat/sonido-notificacion.wav"
];

self.addEventListener("install", (evento) => {
  evento.waitUntil((async () => {
    try{
      const cache = await caches.open(CACHE_APP_SHELL);
      await cache.addAll(ARCHIVOS_APP_SHELL);
    }catch(e){ console.warn("No se pudo precargar el shell offline:", e); }
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil((async () => {
    // Borra cachés de versiones anteriores del shell (si algún día subes
    // otra con un nombre CACHE_APP_SHELL distinto).
    const nombres = await caches.keys();
    await Promise.all(
      nombres.filter(n => n.startsWith("gorilla-chat-shell-") && n !== CACHE_APP_SHELL)
        .map(n => caches.delete(n))
    );
    await self.clients.claim();
  })());
});

/* ===== Evitar que la app quede pegada a una versión vieja, y que
   funcione sin conexión =====
   Con conexión: siempre pide la página y los archivos de la app directo
   a la red (ignorando la caché HTTP normal), y guarda una copia fresca
   en la caché del service worker.
   Sin conexión: sirve esa última copia guardada, para que la app abra
   igual, muestre lo que ya tenía cargado, y puedas seguir escribiendo. */

self.addEventListener("fetch", (evento) => {
  const peticion = evento.request;
  if(peticion.method !== "GET") return;
  const esNavegacion = peticion.mode === "navigate";
  const esArchivoDeLaApp = new URL(peticion.url).origin === self.location.origin
    && peticion.url.includes("/chat/");
  if(!esNavegacion && !esArchivoDeLaApp) return;

  evento.respondWith((async () => {
    try{
      const respuestaRed = await fetch(peticion, { cache: "no-store" });
      const cache = await caches.open(CACHE_APP_SHELL);
      cache.put(peticion, respuestaRed.clone());
      return respuestaRed;
    }catch(e){
      const cache = await caches.open(CACHE_APP_SHELL);
      const enCache = await cache.match(peticion);
      if(enCache) return enCache;
      if(esNavegacion){
        const shell = await cache.match("/chat/index.html");
        if(shell) return shell;
      }
      throw e;
    }
  })());
});

/* ===== Mini almacén en IndexedDB (mensajes pendientes por conversación + silencios) ===== */

function abrirBD(){
  return new Promise((resolve, reject) => {
    const solicitud = indexedDB.open("mensajeria_push", 1);
    solicitud.onupgradeneeded = () => {
      const bd = solicitud.result;
      if(!bd.objectStoreNames.contains("pendientes")) bd.createObjectStore("pendientes");
      if(!bd.objectStoreNames.contains("silenciados")) bd.createObjectStore("silenciados");
    };
    solicitud.onsuccess = () => resolve(solicitud.result);
    solicitud.onerror = () => reject(solicitud.error);
  });
}

async function idbGet(almacen, clave){
  const bd = await abrirBD();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(almacen, "readonly");
    const req = tx.objectStore(almacen).get(clave);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(almacen, clave, valor){
  const bd = await abrirBD();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(almacen, "readwrite");
    tx.objectStore(almacen).put(valor, clave);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbDelete(almacen, clave){
  const bd = await abrirBD();
  return new Promise((resolve, reject) => {
    const tx = bd.transaction(almacen, "readwrite");
    tx.objectStore(almacen).delete(clave);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function estaSilenciada(conversacionId){
  const hasta = await idbGet("silenciados", conversacionId);
  if(!hasta) return false;
  if(Date.now() > hasta){ await idbDelete("silenciados", conversacionId); return false; }
  return true;
}

/* ===== Firestore REST (para actuar sin abrir la app) ===== */

async function marcarLeidoRemoto(conversacionId, campoContador, campoLeido, mensajeId){
  if(!conversacionId || !campoContador) return;
  const campos = { [campoContador]: { integerValue: "0" } };
  const mascara = ["updateMask.fieldPaths=" + encodeURIComponent(campoContador)];
  if(campoLeido && mensajeId){
    campos[campoLeido] = { stringValue: mensajeId };
    mascara.push("updateMask.fieldPaths=" + encodeURIComponent(campoLeido));
  }
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/conversaciones/${encodeURIComponent(conversacionId)}?${mascara.join("&")}&key=${API_KEY}`;
  try{
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields: campos })
    });
  }catch(e){ console.warn("No se pudo marcar leído en segundo plano:", e); }
}

/* ===== Foto de perfil real del remitente (si la tiene puesta) ===== */

async function obtenerFotoAutor(autor){
  if(!autor) return null;
  try{
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/cuentas/${encodeURIComponent(autor)}?key=${API_KEY}`;
    const resp = await fetch(url);
    if(!resp.ok) return null;
    const doc = await resp.json();
    return (doc && doc.fields && doc.fields.foto && doc.fields.foto.stringValue) || null;
  }catch(e){ return null; } // sin conexión o sin foto: seguimos con el avatar de inicial
}

/* ===== Avatar generado (inicial + color) para el ícono grande de la notificación,
   usado solo cuando el remitente no tiene foto de perfil puesta ===== */

function colorParaNombre(nombre){
  const colores = ["#16324F","#3A6EA5","#C0504D","#4F8A57","#8064A2","#D9822B","#2E8B8B"];
  let hash = 0;
  for(let i=0;i<(nombre||"").length;i++) hash = (hash*31 + nombre.charCodeAt(i)) >>> 0;
  return colores[hash % colores.length];
}

async function generarAvatarIniciales(nombre){
  try{
    if(typeof OffscreenCanvas === "undefined") return "icon-192.png";
    const letra = (nombre || "?").trim().charAt(0).toUpperCase() || "?";
    const tam = 192;
    const lienzo = new OffscreenCanvas(tam, tam);
    const ctx = lienzo.getContext("2d");
    ctx.fillStyle = colorParaNombre(nombre);
    ctx.beginPath();
    ctx.arc(tam/2, tam/2, tam/2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold " + Math.round(tam*0.5) + "px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(letra, tam/2, tam/2 + tam*0.05);
    const blob = await lienzo.convertToBlob({ type: "image/png" });
    return URL.createObjectURL(blob);
  }catch(e){
    return "icon-192.png"; // si el navegador no soporta OffscreenCanvas, usa el logo
  }
}

/* ===== Push entrante ===== */

self.addEventListener("push", (evento) => {
  evento.waitUntil((async () => {
    let datos = {};
    try{ datos = evento.data ? evento.data.json() : {}; }catch(e){ datos = {}; }

    const conversacionId = datos.conversacionId || "general";

    if(await estaSilenciada(conversacionId)) return; // conversación silenciada: no molestar

    const titulo = datos.titulo || "Mensajería";
    const nuevaLinea = datos.cuerpo || "Tienes un mensaje nuevo";

    // Acumula el mensaje junto con los recientes de la misma conversación
    // (así, si llegan varios seguidos, se ven juntos en una sola notificación).
    const previos = (await idbGet("pendientes", conversacionId)) || [];
    const lista = [...previos, nuevaLinea].slice(-5);
    await idbSet("pendientes", conversacionId, lista);

    const iconoAvatar = (await obtenerFotoAutor(datos.autor)) || (await generarAvatarIniciales(datos.autor));

    const opciones = {
      body: lista.join("\n"),
      icon: iconoAvatar,   // avatar con inicial del remitente (ícono grande)
      badge: "icon-192.png", // logo de la app (ícono pequeño, monocromo en la barra)
      tag: "conv-" + conversacionId,
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: datos.url || "/chat/",
        conversacionId,
        autor: datos.autor || "",
        mensajeId: datos.mensajeId || null,
        campoContador: datos.campoContador || null,
        campoLeido: datos.campoLeido || null
      },
      actions: [
        { action: "responder", title: "Responder" },
        { action: "marcar_leido", title: "Marcar leído" },
        { action: "silenciar", title: "Silenciar" }
      ]
    };

    await self.registration.showNotification(titulo, opciones);
  })());
});

/* ===== Clic en la notificación o en alguno de sus botones ===== */

self.addEventListener("notificationclick", (evento) => {
  const datos = evento.notification.data || {};
  const { conversacionId, campoContador, campoLeido, mensajeId, url } = datos;
  evento.notification.close();

  if(evento.action === "silenciar"){
    evento.waitUntil(idbSet("silenciados", conversacionId, Date.now() + HORAS_SILENCIO * 3600 * 1000));
    return;
  }

  if(evento.action === "marcar_leido"){
    evento.waitUntil((async () => {
      await marcarLeidoRemoto(conversacionId, campoContador, campoLeido, mensajeId);
      await idbDelete("pendientes", conversacionId);
    })());
    return;
  }

  // Clic en el cuerpo o en "Responder": abre/enfoca la app en esa conversación.
  const enfocarRespuesta = evento.action === "responder";
  evento.waitUntil((async () => {
    await idbDelete("pendientes", conversacionId);
    const listaClientes = await clients.matchAll({ type: "window", includeUncontrolled: true });
    for(const cliente of listaClientes){
      if(cliente.url.includes("/chat/") && "focus" in cliente){
        await cliente.focus();
        cliente.postMessage({ tipo: "abrir_conversacion", conversacionId, enfocarRespuesta });
        return;
      }
    }
    if(clients.openWindow){
      const base = url || "/chat/";
      const separador = base.includes("?") ? "&" : "?";
      const urlDestino = `${base}${separador}conv=${encodeURIComponent(conversacionId)}${enfocarRespuesta ? "&responder=1" : ""}`;
      const nuevaVentana = await clients.openWindow(urlDestino);
      // El postMessage queda como respaldo por si la página ya estaba
      // registrando su listener cuando abrió (no hace daño duplicarlo).
      if(nuevaVentana) setTimeout(() => {
        nuevaVentana.postMessage({ tipo: "abrir_conversacion", conversacionId, enfocarRespuesta });
      }, 1500);
    }
  })());
});

/* ===== Aviso desde la página: "ya estoy viendo esta conversación" ===== */

self.addEventListener("message", (evento) => {
  const datos = evento.data || {};
  if(datos.tipo === "conversacion_abierta" && datos.conversacionId){
    evento.waitUntil((async () => {
      await idbDelete("pendientes", datos.conversacionId);
      const notifs = await self.registration.getNotifications({ tag: "conv-" + datos.conversacionId });
      notifs.forEach(n => n.close());
    })());
  }
});
