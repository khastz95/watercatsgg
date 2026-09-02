import { configured, getMapas } from "../lib/cloud.js";
import { cors } from "../lib/http.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }
  try {
    if (!configured()) {
      res.status(500).json({ error: "Supabase não configurado." });
      return;
    }
    res.status(200).json(await getMapas());
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
