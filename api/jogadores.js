import { configured, getElenco, getEstatisticas } from "../lib/cloud.js";
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
    const [elenco, stats] = await Promise.all([getElenco(), getEstatisticas()]);
    const byNick = new Map((stats.players || []).map((p) => [p.nick, p]));
    const members = elenco.members.map((m) => {
      const dash = byNick.get(m.nick);
      return {
        ...m,
        photo: m.photo || dash?.avatar || "",
        color: dash?.color || "#3ec7ff"
      };
    });
    res.status(200).json({ ...elenco, members });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
