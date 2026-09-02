import { pinOk, configured, getEstatisticas, putEstatisticas } from "../lib/cloud.js";
import { cors, readBody, pinFrom } from "../lib/http.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (!configured()) {
      res.status(500).json({ error: "Supabase não configurado." });
      return;
    }

    if (req.method === "GET") {
      const data = await getEstatisticas();
      res.setHeader("Cache-Control", "public, s-maxage=15, stale-while-revalidate=60");
      res.status(200).json(data);
      return;
    }

    if (req.method === "PUT") {
      if (!pinOk(pinFrom(req, readBody(req)))) {
        res.status(401).json({ error: "Senha incorreta." });
        return;
      }
      const body = readBody(req);
      if (!body || typeof body !== "object" || !Array.isArray(body.players)) {
        res.status(400).json({ error: "invalid_format", message: "Dados incompletos." });
        return;
      }
      body.updated = new Date().toISOString().slice(0, 10);
      if (body.summary && body.players.length) {
        const ratings = body.players.map((p) => Number(p.rating)).filter((n) => !Number.isNaN(n));
        if (ratings.length) {
          const sum = ratings.reduce((a, b) => a + b, 0);
          body.summary.avgRating = Math.round((sum / ratings.length) * 100) / 100;
        }
      }
      const saved = await putEstatisticas(body);
      res.status(200).json({ ok: true, updated: saved.updated });
      return;
    }

    res.setHeader("Allow", "GET, PUT, OPTIONS");
    res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
