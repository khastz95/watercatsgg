export function cors(res, extra = "X-Admin-Password, X-Edit-Pin") {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", `Content-Type, ${extra}`);
}

export function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export function pinFrom(req, body = {}) {
  return (
    req.headers["x-edit-pin"] ||
    req.headers["x-admin-password"] ||
    body.pin ||
    body.password ||
    ""
  );
}
