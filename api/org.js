import { configured } from "../lib/cloud.js";
import { cors, readBody } from "../lib/http.js";
import { getOrg, putOrg } from "../lib/org.js";
import { requireAdmin } from "../lib/sessao.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    if (!configured()) {
      res.status(500).json({ error: "Supabase não configurado" });
      return;
    }

    if (req.method === "GET") {
      const data = await getOrg();
      res.status(200).json({ ok: true, ...data });
      return;
    }

    if (req.method === "PUT") {
      await requireAdmin(req);
      const body = readBody(req);
      const data = await putOrg({
        elenco: body.elenco,
        jogos: body.jogos
      });
      res.status(200).json({ ok: true, ...data });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
