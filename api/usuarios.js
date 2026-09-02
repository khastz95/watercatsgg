import { configured } from "../lib/cloud.js";
import { cors, readBody } from "../lib/http.js";
import { criarUsuario, listarUsuarios, requireAdmin } from "../lib/sessao.js";

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
    await requireAdmin(req);

    if (req.method === "GET") {
      const usuarios = await listarUsuarios();
      res.status(200).json({ ok: true, usuarios });
      return;
    }

    if (req.method === "POST") {
      const body = readBody(req);
      const user = await criarUsuario({
        usuario: body.usuario,
        senha: body.senha,
        nome: body.nome,
        papel: body.papel
      });
      res.status(200).json({ ok: true, user });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
