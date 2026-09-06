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

    const opciones = {
      body: lista.join("\n"),
      icon: "icon-192.png",
      badge: "icon-192.png",
      tag: "conv-" + conversacionId,
      renotify: true,
      silent: true,
      data: {
        url: datos.url || "/Mensajería/",
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
      if(cliente.url.includes("/Mensajería/") && "focus" in cliente){
        await cliente.focus();
        cliente.postMessage({ tipo: "abrir_conversacion", conversacionId, enfocarRespuesta });
        return;
      }
    }
    if(clients.openWindow){
      const nuevaVentana = await clients.openWindow(url || "/Mensajería/");
      // Da tiempo a que la página cargue y registre su listener de mensajes.
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
