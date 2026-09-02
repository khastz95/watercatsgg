import { pinOk, configured, getState, putState } from "../lib/cloud.js";
import { cors, readBody, pinFrom } from "../lib/http.js";
import { requireSession } from "../lib/sessao.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (!configured()) {
      res.status(500).json({
        error: "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel."
      });
      return;
    }

    if (req.method === "GET") {
      await requireSession(req);
      const row = await getState();
      res.status(200).json({ data: row?.data || null, updatedAt: row?.updated_at || null });
      return;
    }

    if (req.method === "PUT") {
      const body = readBody(req);
      if (!pinOk(pinFrom(req, body))) {
        res.status(401).json({ error: "PIN inválido" });
        return;
      }
      const data = body.data;
      if (!data || typeof data !== "object") {
        res.status(400).json({ error: "Dados inválidos" });
        return;
      }
      const row = await putState(data);
      res.status(200).json({ ok: true, updatedAt: row?.updated_at || null });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
