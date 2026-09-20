// Genera un token de instalación de GitHub App, válido ~1 hora, con acceso
// solo al repo donde está instalada la App. El navegador pide uno de estos
// cada vez que lo necesita (o reusa el que tiene mientras no expire) y con
// él sube/borra archivos DIRECTO en GitHub, sin pasar el archivo por acá
// (Vercel limita el cuerpo de las peticiones a 4.5MB, así que un proxy que
// reciba el archivo completo no funcionaría con adjuntos grandes).
//
// Variables de entorno necesarias en Vercel (Project Settings → Environment
// Variables), nunca en el código:
//   GITHUB_APP_ID              -> el "App ID" que muestra GitHub al crear la App
//   GITHUB_APP_INSTALLATION_ID -> el ID de la instalación de la App en tu repo
//   GITHUB_APP_PRIVATE_KEY     -> el contenido del .pem que descargas al crear
//                                 la App (con los saltos de línea como \n)
//   ALLOWED_ORIGIN (opcional)  -> el origen desde el que se permite llamar a
//                                 este endpoint, p.ej. https://tu-app.vercel.app

const crypto = require("crypto");

function base64url(buffer) {
  return buffer
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function crearJWTApp(appId, clavePrivadaPem) {
  const ahora = Math.floor(Date.now() / 1000);
  const encabezado = base64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const cuerpo = base64url(Buffer.from(JSON.stringify({
    iat: ahora - 60,      // margen por si el reloj del servidor va algo adelantado
    exp: ahora + 9 * 60,  // GitHub exige 10 minutos como máximo
    iss: appId
  })));
  const firmante = crypto.createSign("RSA-SHA256");
  firmante.update(`${encabezado}.${cuerpo}`);
  firmante.end();
  const firma = base64url(firmante.sign(clavePrivadaPem));
  return `${encabezado}.${cuerpo}.${firma}`;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");

  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "método no permitido" });
    return;
  }

  const appId = process.env.GITHUB_APP_ID;
  const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
  const clavePrivada = (process.env.GITHUB_APP_PRIVATE_KEY || "").replace(/\\n/g, "\n");

  if (!appId || !installationId || !clavePrivada) {
    res.status(500).json({ error: "faltan variables de entorno de la GitHub App en Vercel" });
    return;
  }

  try {
    const jwt = crearJWTApp(appId, clavePrivada);
    const resp = await fetch(
      `https://api.github.com/app/installations/${installationId}/access_tokens`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwt}`,
          "Accept": "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28"
        }
      }
    );
    const datos = await resp.json();
    if (!resp.ok) {
      res.status(resp.status).json({ error: datos.message || "GitHub rechazó la solicitud del token" });
      return;
    }
    // datos.token expira solo en datos.expires_at (~1 hora después)
    res.status(200).json({ token: datos.token, expira: datos.expires_at });
  } catch (err) {
    res.status(500).json({ error: "fallo interno generando el token" });
  }
};

