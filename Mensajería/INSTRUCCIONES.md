# Notificaciones push con OneSignal (sin tarjeta, sin computadora)

## Qué cambió respecto a la versión anterior

- Se reemplazó **Firebase Cloud Messaging + Cloud Function** por **OneSignal**.
- Ya no hace falta: plan Blaze, clave VAPID, Node.js, ni desplegar nada desde una terminal.
- Los archivos `firebase.json`, `index.js` y `package.json` (la Cloud Function) **ya no se usan** — podés ignorarlos o borrarlos, no forman parte de lo que se sube al hosting.
- `firebase-messaging-sw.js` fue reemplazado por `OneSignalSDKWorker.js`.
- El push ahora se dispara directamente desde el navegador con la REST API de OneSignal (ver la nota de seguridad más abajo).

## Pasos

### 1. Crear la cuenta y la app en OneSignal
1. Andá a [onesignal.com](https://onesignal.com/) y creá una cuenta gratis (no pide tarjeta).
2. Creá una nueva app/organización. Cuando te pregunte la plataforma, elegí **Web Push**.
3. Completá la URL de tu sitio (el mismo dominio donde está alojado tu `index.html`) y el resto de los pasos del asistente.

### 2. Copiar App ID y REST API Key
1. Dentro de tu app en OneSignal, andá a **Settings → Keys & IDs**.
2. Copiá el **OneSignal App ID** y la **REST API Key**.
3. Pegalos en `index.html`, reemplazando:
   ```js
   const ONESIGNAL_APP_ID = "PEGA_AQUI_TU_ONESIGNAL_APP_ID";
   const ONESIGNAL_REST_API_KEY = "PEGA_AQUI_TU_ONESIGNAL_REST_API_KEY";
   ```

### 3. Subir los archivos
Subí **todos** estos archivos juntos, en la raíz de tu hosting (reemplazando lo que ya está ahí):
`index.html`, `manifest.json`, `OneSignalSDKWorker.js`, `icon-192.png`, `icon-512.png`, `icon-apple-touch.png`, `favicon-32.png`, `sonido-notificacion.wav`.

Si el viejo `firebase-messaging-sw.js` sigue en el hosting, borralo para que no quede un service worker huérfano.

Tiene que servirse por **HTTPS** (los service workers no funcionan por HTTP simple, salvo en localhost).

### 4. Instalar la app en el teléfono
- **Android (Chrome)**: al entrar va a aparecer un banner o el menú ⋮ → "Instalar app". Instalala así, no la dejes solo como pestaña del navegador.
- **iPhone (Safari)**: compartir (ícono de flecha hacia arriba) → **"Agregar a pantalla de inicio"**. Obligatorio en iOS (requiere iOS 16.4+).

Una vez instalada, abrila desde el ícono de la pantalla de inicio y aceptá el permiso de notificaciones cuando lo pida.

## Nota de seguridad importante

La REST API Key de OneSignal queda escrita en el código fuente de `index.html`, visible para cualquiera que abra las herramientas de desarrollador del navegador. Con esa clave se pueden mandar notificaciones a los dispositivos de tu app, pero **no** da acceso a los mensajes del chat (eso sigue protegido por tus reglas de Firestore).

Para un chat de dos personas el riesgo es bajo, pero si querés reducirlo:
- En OneSignal, andá a **Settings → Keys & IDs → "New Restricted Key"** y creá una clave que solo tenga permiso de **"Create/Send Messages"**, y usá esa en vez de la REST API Key general.

## Limitaciones a tener en cuenta

- **El sonido personalizado solo se escucha con la app abierta o en segundo plano reciente.** Cuando el teléfono está bloqueado o la app lleva rato cerrada, la notificación la muestra el sistema operativo con su sonido por defecto — ninguna plataforma permite hoy un sonido personalizado para push del sistema. Es una limitación de la plataforma, no del código.
- En iOS, todo esto (push + sonido del sistema) depende de tenerla instalada como PWA; desde Safari normal no vas a recibir nada si la app está cerrada.
- Si en algún momento cambian de dispositivo o borran datos del navegador, hay que volver a conceder el permiso de notificaciones.
