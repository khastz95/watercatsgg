import { rest, uploadOrgPhoto } from "./cloud.js";
import { orgTablesOk } from "./sessao.js";

const SLOT_DEFAULTS = [
  { id: "t1", papel: "titular", ordem: 1, posicao: "IGL" },
  { id: "t2", papel: "titular", ordem: 2, posicao: "Entry" },
  { id: "t3", papel: "titular", ordem: 3, posicao: "AWPer" },
  { id: "t4", papel: "titular", ordem: 4, posicao: "Lurker" },
  { id: "t5", papel: "titular", ordem: 5, posicao: "Support" },
  { id: "r1", papel: "reserva", ordem: 6, posicao: "Rifler" },
  { id: "r2", papel: "reserva", ordem: 7, posicao: "Rifler" },
  { id: "coach", papel: "coach", ordem: 8, posicao: "Coach" }
];

function emptyPlayer(slot) {
  return {
    id: slot.id,
    papel: slot.papel,
    ordem: slot.ordem,
    nick: "",
    nome: "",
    idade: null,
    foto_url: "",
    posicao: slot.posicao,
    pais: "Brasil",
    nivel_gc: null,
    nivel_faceit: null,
    rating_premier: null,
    steam64: "",
    bio: "",
    rating: null,
    kd: null,
    kast: null,
    taxa_hs: null,
    adr: null,
    kpr: null,
    dpr: null,
    partidas: 0,
    vitorias: 0,
    derrotas: 0,
    abates: 0,
    mortes: 0,
    assistencias: 0,
    conexoes: []
  };
}

function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function intOrZero(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function sanitizeConexao(c) {
  if (!c || typeof c !== "object") return null;
  const tipo = String(c.tipo || "").trim().toLowerCase();
  const url = String(c.url || "").trim();
  if (!tipo || !url) return null;
  return {
    tipo,
    url,
    rotulo: String(c.rotulo || "").trim()
  };
}

function sanitizePlayer(raw, fallback) {
  const base = emptyPlayer(fallback || SLOT_DEFAULTS[0]);
  const p = raw && typeof raw === "object" ? raw : {};
  const conexoes = Array.isArray(p.conexoes)
    ? p.conexoes.map(sanitizeConexao).filter(Boolean)
    : [];
  return {
    ...base,
    id: String(p.id || base.id),
    papel: ["titular", "reserva", "coach"].includes(p.papel) ? p.papel : base.papel,
    ordem: intOrZero(p.ordem) || base.ordem,
    nick: String(p.nick || "").trim(),
    nome: String(p.nome || "").trim(),
    idade: numOrNull(p.idade),
    foto_url: String(p.foto_url || p.foto || "").trim(),
    posicao: String(p.posicao || base.posicao).trim(),
    pais: String(p.pais || "Brasil").trim() || "Brasil",
    nivel_gc: numOrNull(p.nivel_gc),
    nivel_faceit: numOrNull(p.nivel_faceit),
    rating_premier: numOrNull(p.rating_premier),
    steam64: String(p.steam64 || "").trim(),
    bio: String(p.bio || "").trim(),
    rating: numOrNull(p.rating),
    kd: numOrNull(p.kd),
    kast: numOrNull(p.kast),
    taxa_hs: numOrNull(p.taxa_hs),
    adr: numOrNull(p.adr),
    kpr: numOrNull(p.kpr),
    dpr: numOrNull(p.dpr),
    partidas: intOrZero(p.partidas),
    vitorias: intOrZero(p.vitorias),
    derrotas: intOrZero(p.derrotas),
    abates: intOrZero(p.abates),
    mortes: intOrZero(p.mortes),
    assistencias: intOrZero(p.assistencias),
    conexoes
  };
}

function sanitizeJogo(raw) {
  const j = raw && typeof raw === "object" ? raw : {};
  const id = String(j.id || "").trim() || `jogo-${Date.now()}`;
  const escalacao = Array.isArray(j.escalacao)
    ? j.escalacao
        .map((e) => {
          if (!e) return null;
          const elenco_id = String(e.elenco_id || e.id || "").trim();
          if (!elenco_id) return null;
          return {
            elenco_id,
            papel: ["titular", "reserva", "coach"].includes(e.papel) ? e.papel : "titular",
            ordem: intOrZero(e.ordem)
          };
        })
        .filter(Boolean)
    : [];
  return {
    id,
    data: j.data || null,
    hora: String(j.hora || "").trim(),
    adversario: String(j.adversario || "").trim(),
    adversario_logo: String(j.adversario_logo || "").trim(),
    campeonato: String(j.campeonato || "").trim(),
    formato: String(j.formato || "MD3").trim() || "MD3",
    mapas: String(j.mapas || "").trim(),
    status: ["agendado", "ao_vivo", "encerrado"].includes(j.status) ? j.status : "agendado",
    placar_casa: numOrNull(j.placar_casa),
    placar_fora: numOrNull(j.placar_fora),
    streaming_url: String(j.streaming_url || "").trim(),
    notas: String(j.notas || "").trim(),
    ordem: intOrZero(j.ordem),
    escalacao
  };
}

function mergeSlots(rows) {
  const byId = new Map((rows || []).map((p) => [p.id, p]));
  return SLOT_DEFAULTS.map((slot) => sanitizePlayer(byId.get(slot.id), slot));
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

function playerColumns(p) {
  return {
    id: p.id,
    papel: p.papel,
    ordem: p.ordem,
    nick: p.nick,
    nome: p.nome,
    idade: p.idade,
    foto_url: p.foto_url,
    posicao: p.posicao,
    pais: p.pais,
    nivel_gc: p.nivel_gc,
    nivel_faceit: p.nivel_faceit,
    rating_premier: p.rating_premier,
    steam64: p.steam64,
    bio: p.bio,
    rating: p.rating,
    kd: p.kd,
    kast: p.kast,
    taxa_hs: p.taxa_hs,
    adr: p.adr,
    kpr: p.kpr,
    dpr: p.dpr,
    partidas: p.partidas,
    vitorias: p.vitorias,
    derrotas: p.derrotas,
    abates: p.abates,
    mortes: p.mortes,
    assistencias: p.assistencias,
    atualizado_em: new Date().toISOString()
  };
}

async function loadFromTables() {
  const [elencoRows, conexoes, jogos, escalacao] = await Promise.all([
    rest("org_elenco?select=*&order=ordem.asc"),
    rest("org_conexoes?select=*"),
    rest("org_jogos?select=*&order=data.asc,hora.asc"),
    rest("org_escalacao?select=*")
  ]);
  const links = {};
  (Array.isArray(conexoes) ? conexoes : []).forEach((c) => {
    if (!links[c.elenco_id]) links[c.elenco_id] = [];
    links[c.elenco_id].push({ tipo: c.tipo, url: c.url, rotulo: c.rotulo || "" });
  });
  const byJogo = {};
  (Array.isArray(escalacao) ? escalacao : []).forEach((e) => {
    if (!byJogo[e.jogo_id]) byJogo[e.jogo_id] = [];
    byJogo[e.jogo_id].push({
      elenco_id: e.elenco_id,
      papel: e.papel,
      ordem: e.ordem || 0
    });
  });
  const players = mergeSlots(
    (Array.isArray(elencoRows) ? elencoRows : []).map((p) => ({
      ...p,
      conexoes: links[p.id] || []
    }))
  );
  const games = (Array.isArray(jogos) ? jogos : []).map((j) =>
    sanitizeJogo({ ...j, escalacao: byJogo[j.id] || [] })
  );
  return { elenco: players, jogos: games };
}

async function saveToTables(elenco, jogos) {
  for (const p of elenco) {
    await rest("org_elenco", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(playerColumns(p))
    });
    await rest(`org_conexoes?elenco_id=eq.${encodeURIComponent(p.id)}`, { method: "DELETE" });
    if (p.conexoes.length) {
      await rest("org_conexoes", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(
          p.conexoes.map((c) => ({
            elenco_id: p.id,
            tipo: c.tipo,
            url: c.url,
            rotulo: c.rotulo || ""
          }))
        )
      });
    }
  }

  const keep = new Set(jogos.map((j) => j.id));
  const existing = await rest("org_jogos?select=id");
  for (const row of Array.isArray(existing) ? existing : []) {
    if (!keep.has(row.id)) {
      await rest(`org_jogos?id=eq.${encodeURIComponent(row.id)}`, { method: "DELETE" });
    }
  }

  for (const j of jogos) {
    const { escalacao, ...restJogo } = j;
    await rest("org_jogos", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        ...restJogo,
        atualizado_em: new Date().toISOString()
      })
    });
    await rest(`org_escalacao?jogo_id=eq.${encodeURIComponent(j.id)}`, { method: "DELETE" });
    if (escalacao.length) {
      await rest("org_escalacao", {
        method: "POST",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(
          escalacao.map((e) => ({
            jogo_id: j.id,
            elenco_id: e.elenco_id,
            papel: e.papel,
            ordem: e.ordem
          }))
        )
      });
    }
  }
}

export async function getOrg() {
  if (await orgTablesOk()) {
    const data = await loadFromTables();
    await ensureSlots(data.elenco);
    const hasNick = data.elenco.some((p) => p.nick);
    if (!hasNick) {
      const doc = await loadDoc();
      if ((doc.elenco || []).some((p) => p.nick) || (doc.jogos || []).length) {
        return putOrg({ elenco: mergeSlots(doc.elenco), jogos: (doc.jogos || []).map(sanitizeJogo) });
      }
    }
    return data;
  }
  const doc = await loadDoc();
  const elenco = mergeSlots(doc.elenco);
  const jogos = (doc.jogos || []).map(sanitizeJogo);
  if (!doc.elenco || !doc.elenco.length) {
    await saveDoc({ ...doc, elenco, jogos });
  }
  return { elenco, jogos };
}

async function ensureSlots(elenco) {
  const have = new Set(elenco.map((p) => p.id));
  for (const slot of SLOT_DEFAULTS) {
    if (have.has(slot.id)) continue;
    const p = emptyPlayer(slot);
    await rest("org_elenco", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(playerColumns(p))
    });
    elenco.push(p);
  }
  elenco.sort((a, b) => a.ordem - b.ordem);
}

export async function putOrg({ elenco, jogos }) {
  const players = mergeSlots(elenco);
  const games = Array.isArray(jogos) ? jogos.map(sanitizeJogo) : [];
  if (await orgTablesOk()) {
    await saveToTables(players, games);
    return { elenco: players, jogos: games };
  }
  const doc = await loadDoc();
  await saveDoc({ ...doc, elenco: players, jogos: games });
  return { elenco: players, jogos: games };
}

export function findPlayer(elenco, key) {
  const k = String(key || "").trim().toLowerCase();
  if (!k) return null;
  return (
    elenco.find((p) => p.id === k) ||
    elenco.find((p) => String(p.nick).toLowerCase() === k) ||
    null
  );
}

export async function setOrgPhoto(playerId, buffer, mime) {
  const url = await uploadOrgPhoto(playerId, buffer, mime);
  const org = await getOrg();
  const elenco = org.elenco.map((p) =>
    p.id === playerId ? { ...p, foto_url: url } : p
  );
  await putOrg({ elenco, jogos: org.jogos });
  return url;
}

export { SLOT_DEFAULTS };
