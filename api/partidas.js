import { pinOk, configured, getPartidas, putPartidas } from "../lib/cloud.js";
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
      const data = await getPartidas();
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
      if (!body || typeof body !== "object" || !Array.isArray(body.matches)) {
        res.status(400).json({ error: "invalid_format", message: "Dados incompletos." });
        return;
      }
      const saved = await putPartidas(body);
      res.status(200).json({ ok: true, updated: saved.updated });
      return;
    }

    res.setHeader("Allow", "GET, PUT, OPTIONS");
    res.status(405).json({ error: "Método não permitido." });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
