import crypto from "node:crypto";
import { promisify } from "node:util";
import { adminUserOk, pinOk, rest } from "./cloud.js";

const scryptAsync = promisify(crypto.scrypt);
const COOKIE = "ep_sid";
const TTL_MS = 14 * 24 * 60 * 60 * 1000;

function cookies(req) {
  const out = {};
  String(req.headers.cookie || "")
    .split(";")
    .forEach((part) => {
      const i = part.indexOf("=");
      if (i < 1) return;
      const k = part.slice(0, i).trim();
      try {
        out[k] = decodeURIComponent(part.slice(i + 1).trim());
      } catch {
        out[k] = part.slice(i + 1).trim();
      }
    });
  return out;
}

function cookieHeader(token, maxAgeSec) {
  const parts = [
    `${COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSec}`
  ];
  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function setSessionCookie(res, token) {
  res.setHeader("Set-Cookie", cookieHeader(token, Math.floor(TTL_MS / 1000)));
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", cookieHeader("", 0));
}

export async function hashSenha(senha) {
  const salt = crypto.randomBytes(16);
  const buf = await scryptAsync(String(senha), salt, 32);
  return `scrypt$${salt.toString("hex")}$${Buffer.from(buf).toString("hex")}`;
}

export async function senhaConfere(senha, stored) {
  if (!stored || !String(stored).startsWith("scrypt$")) return false;
  const parts = String(stored).split("$");
  if (parts.length !== 3) return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  const buf = Buffer.from(await scryptAsync(String(senha), salt, 32));
  if (buf.length !== expected.length) return false;
  return crypto.timingSafeEqual(buf, expected);
}

let tableMode;

export async function orgTablesOk() {
  if (tableMode != null) return tableMode;
  try {
    await rest("org_elenco?select=id&limit=1");
    tableMode = true;
  } catch {
    tableMode = false;
  }
  return tableMode;
}

async function loadDoc() {
  const rows = await rest("campeonato_estado?id=eq.org&select=dados");
  const row = Array.isArray(rows) ? rows[0] : null;
  const dados = row?.dados && typeof row.dados === "object" ? row.dados : {};
  return {
    elenco: Array.isArray(dados.elenco) ? dados.elenco : [],
    jogos: Array.isArray(dados.jogos) ? dados.jogos : [],
    usuarios: Array.isArray(dados.usuarios) ? dados.usuarios : [],
    sessoes: Array.isArray(dados.sessoes) ? dados.sessoes : []
  };
}

async function saveDoc(doc) {
  await rest("campeonato_estado", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      id: "org",
      dados: doc,
      atualizado_em: new Date().toISOString()
    })
  });
}

function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    usuario: row.usuario,
    nome: row.nome || row.usuario,
    papel: row.papel || "membro"
  };
}

async function findUser(usuario) {
  const login = String(usuario || "").trim().toLowerCase();
  if (!login) return null;
  if (await orgTablesOk()) {
    const rows = await rest(
      `org_usuarios?usuario=eq.${encodeURIComponent(login)}&select=*&limit=1`
    );
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }
  const doc = await loadDoc();
  return doc.usuarios.find((u) => String(u.usuario).toLowerCase() === login) || null;
}

async function upsertUser(user) {
  if (await orgTablesOk()) {
    await rest("org_usuarios", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(user)
    });
    return;
  }
  const doc = await loadDoc();
  const i = doc.usuarios.findIndex((u) => u.id === user.id || u.usuario === user.usuario);
  if (i >= 0) doc.usuarios[i] = { ...doc.usuarios[i], ...user };
  else doc.usuarios.push(user);
  await saveDoc(doc);
}

export async function criarUsuario({ usuario, senha, nome, papel }) {
  const login = String(usuario || "").trim().toLowerCase();
  if (!login || !senha) {
    const err = new Error("Usuário e senha obrigatórios");
    err.status = 400;
    throw err;
  }
  const existing = await findUser(login);
  const id = existing?.id || login.replace(/[^\w.-]+/g, "-");
  await upsertUser({
    id,
    usuario: login,
    senha_hash: await hashSenha(senha),
    nome: String(nome || login),
    papel: papel === "admin" ? "admin" : "membro",
    criado_em: existing?.criado_em || new Date().toISOString()
  });
  return { id, usuario: login, nome: nome || login, papel: papel === "admin" ? "admin" : "membro" };
}

export async function listarUsuarios() {
  if (await orgTablesOk()) {
    const rows = await rest("org_usuarios?select=id,usuario,nome,papel,criado_em&order=criado_em.asc");
    return Array.isArray(rows) ? rows : [];
  }
  const doc = await loadDoc();
  return doc.usuarios.map((u) => ({
    id: u.id,
    usuario: u.usuario,
    nome: u.nome,
    papel: u.papel,
    criado_em: u.criado_em
  }));
}

async function saveSession(token, usuarioId) {
  const expira = new Date(Date.now() + TTL_MS).toISOString();
  if (await orgTablesOk()) {
    await rest("org_sessoes", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ token, usuario_id: usuarioId, expira_em: expira })
    });
    return;
  }
  const doc = await loadDoc();
  const now = Date.now();
  doc.sessoes = (doc.sessoes || []).filter((s) => new Date(s.expira_em).getTime() > now);
  doc.sessoes.push({ token, usuario_id: usuarioId, expira_em: expira });
  await saveDoc(doc);
}

async function dropSession(token) {
  if (!token) return;
  if (await orgTablesOk()) {
    await rest(`org_sessoes?token=eq.${encodeURIComponent(token)}`, { method: "DELETE" });
    return;
  }
  const doc = await loadDoc();
  doc.sessoes = (doc.sessoes || []).filter((s) => s.token !== token);
  await saveDoc(doc);
}

async function userById(id) {
  if (await orgTablesOk()) {
    const rows = await rest(`org_usuarios?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }
  const doc = await loadDoc();
  return doc.usuarios.find((u) => u.id === id) || null;
}

export async function getSession(req) {
  const token = cookies(req)[COOKIE];
  if (!token) return null;
  let row = null;
  if (await orgTablesOk()) {
    const rows = await rest(
      `org_sessoes?token=eq.${encodeURIComponent(token)}&select=token,usuario_id,expira_em&limit=1`
    );
    row = Array.isArray(rows) && rows[0] ? rows[0] : null;
  } else {
    const doc = await loadDoc();
    row = (doc.sessoes || []).find((s) => s.token === token) || null;
  }
  if (!row || new Date(row.expira_em).getTime() < Date.now()) {
    await dropSession(token);
    return null;
  }
  const user = await userById(row.usuario_id);
  if (!user) return null;
  return { token, user: publicUser(user) };
}

export async function requireSession(req) {
  const session = await getSession(req);
  if (!session) {
    const err = new Error("Faça login para continuar");
    err.status = 401;
    throw err;
  }
  return session;
}

export async function requireAdmin(req) {
  const session = await requireSession(req);
  if (session.user.papel !== "admin") {
    const envAdmin = adminUserOk(session.user.usuario);
    if (!envAdmin) {
      const err = new Error("Sem permissão");
      err.status = 403;
      throw err;
    }
  }
  return session;
}

export async function login(usuario, senha) {
  const loginName = String(usuario || "").trim();
  const pass = String(senha || "");
  if (!loginName || !pass) {
    const err = new Error("Informe usuário e senha");
    err.status = 400;
    throw err;
  }

  let user = await findUser(loginName);
  if (user && (await senhaConfere(pass, user.senha_hash))) {
    const token = crypto.randomBytes(24).toString("hex");
    await saveSession(token, user.id);
    return { token, user: publicUser(user) };
  }

  if (adminUserOk(loginName) && pinOk(pass)) {
    const id = String(loginName).trim().toLowerCase() || "admin";
    await upsertUser({
      id,
      usuario: id,
      senha_hash: await hashSenha(pass),
      nome: "Admin",
      papel: "admin",
      criado_em: new Date().toISOString()
    });
    const token = crypto.randomBytes(24).toString("hex");
    await saveSession(token, id);
    return { token, user: { id, usuario: id, nome: "Admin", papel: "admin" } };
  }

  const err = new Error("Usuário ou senha inválidos");
  err.status = 401;
  throw err;
}

export async function logout(req) {
  const token = cookies(req)[COOKIE];
  await dropSession(token);
}
