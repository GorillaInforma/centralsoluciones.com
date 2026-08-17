// api/github.js
// Esta función corre en el servidor de Vercel, NUNCA en el navegador.
// El token vive en las Environment Variables de Vercel, no aquí en el código.

export default async function handler(req, res) {
  const { GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_FILE_PATH, GITHUB_BRANCH } = process.env;

  if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO || !GITHUB_FILE_PATH) {
    return res.status(500).json({
      error: "Faltan variables de entorno en Vercel: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_FILE_PATH, GITHUB_BRANCH"
    });
  }

  const branch = GITHUB_BRANCH || "main";
  const API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${encodeURIComponent(GITHUB_FILE_PATH)}`;
  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json"
  };

  try {
    if (req.method === "GET") {
      const action = req.query.action;

      if (action === "history") {
        const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${encodeURIComponent(GITHUB_FILE_PATH)}&sha=${branch}&per_page=50`;
        const r = await fetch(url, { headers });
        const data = await r.json();
        return res.status(r.status).json(data);
      }

      // Acción por defecto: traer el archivo actual
      const r = await fetch(`${API_BASE}?ref=${branch}`, { headers });
      if (r.status === 404) return res.status(404).json({ notFound: true });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    if (req.method === "PUT") {
      const { message, content, sha } = req.body;
      const payload = { message, content, branch };
      if (sha) payload.sha = sha;

      const r = await fetch(API_BASE, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await r.json();
      return res.status(r.status).json(data);
    }

    return res.status(405).json({ error: "Método no permitido" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

