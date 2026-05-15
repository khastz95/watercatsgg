import { head, put } from "@vercel/blob";

const BLOB_PATH = "eternal-pratas/estatisticas.json";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Admin-Password");
}

async function readFromBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const meta = await head(BLOB_PATH);
    if (!meta || !meta.url) return null;
    const response = await fetch(meta.url, { cache: "no-store" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function readStatic(req) {
  const host = req.headers.host;
  if (!host) return null;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = `${proto}://${host}/data/estatisticas.json`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) return null;
  return response.json();
}

export default async function handler(req, res) {
  cors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    const blobData = await readFromBlob();
    if (blobData) {
      res.setHeader("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
      res.setHeader("X-Stats-Source", "blob");
      return res.status(200).json(blobData);
    }

    const staticData = await readStatic(req);
    if (staticData) {
      res.setHeader("Cache-Control", "public, s-maxage=300");
      res.setHeader("X-Stats-Source", "static");
      return res.status(200).json(staticData);
    }

    return res.status(404).json({ error: "Dados não encontrados." });
  }

  if (req.method === "PUT") {
    const adminPassword = process.env.ADMIN_PASSWORD;
    const sent = req.headers["x-admin-password"] || "";

    if (!adminPassword) {
      return res.status(503).json({
        error: "admin_not_configured",
        message: "Área de edição não configurada.",
      });
    }

    if (sent !== adminPassword) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(503).json({
        error: "blob_not_configured",
        message:
          "Armazenamento online indisponível. Use Exportar backup na área de edição.",
      });
    }

    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({ error: "invalid_payload", message: "Dados inválidos." });
      }
    }

    if (!body || typeof body !== "object" || !Array.isArray(body.players)) {
      return res.status(400).json({ error: "invalid_format", message: "Dados incompletos." });
    }

    body.updated = new Date().toISOString().slice(0, 10);

    if (body.summary && Array.isArray(body.players) && body.players.length) {
      const ratings = body.players.map((p) => Number(p.rating)).filter((n) => !Number.isNaN(n));
      if (ratings.length) {
        const sum = ratings.reduce((a, b) => a + b, 0);
        body.summary.avgRating = Math.round((sum / ratings.length) * 100) / 100;
      }
    }

    await put(BLOB_PATH, JSON.stringify(body, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return res.status(200).json({ ok: true, updated: body.updated });
  }

  res.setHeader("Allow", "GET, PUT, OPTIONS");
  return res.status(405).json({ error: "Método não permitido." });
}
