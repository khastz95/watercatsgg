import { configured } from "../lib/cloud.js";
import { cors, readBody } from "../lib/http.js";
import {
  clearSessionCookie,
  getSession,
  login,
  logout,
  setSessionCookie
} from "../lib/sessao.js";

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
      const session = await getSession(req);
      res.status(200).json({ ok: true, user: session?.user || null });
      return;
    }

    if (req.method === "POST") {
      const body = readBody(req);
      const result = await login(body.usuario || body.username, body.senha || body.password || body.pin);
      setSessionCookie(res, result.token);
      res.status(200).json({ ok: true, user: result.user });
      return;
    }

    if (req.method === "DELETE") {
      await logout(req);
      clearSessionCookie(res);
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: "Método não permitido" });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || "Erro interno" });
  }
}
