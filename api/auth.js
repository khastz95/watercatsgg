import { pinOk, adminUserOk } from "../lib/cloud.js";
import { cors, readBody } from "../lib/http.js";

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  if (!process.env.EDIT_PIN && !process.env.ADMIN_PASSWORD) {
    res.status(500).json({ ok: false, error: "EDIT_PIN não definido na Vercel" });
    return;
  }

  const body = readBody(req);
  const pin = body.pin ?? body.password ?? "";
  const username = body.username;

  if (username != null && username !== "" && !adminUserOk(username)) {
    res.status(401).json({ ok: false });
    return;
  }
  if (!pinOk(pin)) {
    res.status(401).json({ ok: false });
    return;
  }
  res.status(200).json({ ok: true });
}
