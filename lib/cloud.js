import crypto from "node:crypto";

const ROW_ID = "main";

function expectedPins() {
  return [process.env.EDIT_PIN, process.env.ADMIN_PASSWORD]
    .map((v) => String(v || ""))
    .filter(Boolean);
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function pinOk(pin) {
  if (pin == null || pin === "") return false;
  return expectedPins().some((expected) => safeEqual(pin, expected));
}

export function adminUserOk(username) {
  const expected = String(process.env.ADMIN_USERNAME || "admin");
  if (!username) return false;
  return safeEqual(String(username).trim(), expected);
}

export function configured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function rest(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const err = new Error("Supabase não configurado");
    err.status = 500;
    throw err;
  }
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(options.headers || {})
    }
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || "Erro no Supabase");
    err.status = res.status;
    throw err;
  }
  const body = await res.text();
  return body ? JSON.parse(body) : null;
}

function asState(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { id: ROW_ID, data: {}, updated_at: null };
  }
  const { updatedAt, ...rest } = data;
  return { id: ROW_ID, data: rest, updated_at: updatedAt || null };
}

export async function getState() {
  const loaded = await rest("rpc/carregar_campeonato", {
    method: "POST",
    body: "{}"
  });
  return asState(loaded);
}

export async function putState(data) {
  const loaded = await rest("rpc/salvar_campeonato", {
    method: "POST",
    body: JSON.stringify({ payload: data })
  });
  return asState(loaded);
}

async function setPlayerPhoto(playerId, photoUrl) {
  const rows = await rest(`campeonato_elenco?id=eq.${encodeURIComponent(playerId)}`, {
    method: "PATCH",
    body: JSON.stringify({ foto_url: photoUrl, atualizado_em: new Date().toISOString() })
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function uploadPublicPhoto(path, buffer, contentType) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const res = await fetch(`${url}/storage/v1/object/${path}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": contentType,
      "x-upsert": "true"
    },
    body: buffer
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(text || "Falha no upload da foto");
    err.status = res.status;
    throw err;
  }
  return `${url}/storage/v1/object/public/${path}?v=${Date.now()}`;
}

export async function uploadPlayerPhoto(playerId, buffer, contentType) {
  const publicUrl = await uploadPublicPhoto(`fotos-jogadores/${playerId}`, buffer, contentType);
  await setPlayerPhoto(playerId, publicUrl);
  return publicUrl;
}

export async function uploadOrgPhoto(playerId, buffer, contentType) {
  return uploadPublicPhoto(`fotos-jogadores/elenco-${playerId}`, buffer, contentType);
}

function slugNick(nick) {
  return String(nick || "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "jogador";
}

function playerFromRow(row) {
  const painel = row.painel && typeof row.painel === "object" ? { ...row.painel } : {};
  return {
    ...painel,
    nick: row.nick || painel.nick,
    firstName: painel.firstName || "",
    lastName: painel.lastName || "",
    avatar: row.foto_url || painel.avatar || "",
    role: painel.role || "",
    color: row.cor || painel.color || "#2f86ff",
    steam64: row.steam64 || painel.steam64 || "",
    tag: row.tag || painel.tag || "",
    status: row.status || painel.status || "",
    game: row.jogo || painel.game || ""
  };
}

export async function getEstatisticas() {
  const [temporadaRows, jogadorRows] = await Promise.all([
    rest("temporada?id=eq.main&select=*"),
    rest("jogadores?select=*&order=ordem.asc")
  ]);
  const t = Array.isArray(temporadaRows) ? temporadaRows[0] : null;
  const players = (Array.isArray(jogadorRows) ? jogadorRows : []).map(playerFromRow);
  const summary = t
    ? {
        matches: t.partidas || 0,
        wins: t.vitorias || 0,
        losses: t.derrotas || 0,
        roundsPlayed: t.rounds || 0,
        avgRating: t.rating_medio != null ? Number(t.rating_medio) : 0
      }
    : { matches: 0, wins: 0, losses: 0, roundsPlayed: 0, avgRating: 0 };
  return {
    updated: t?.atualizado || new Date().toISOString().slice(0, 10),
    season: t?.nome || "Mix 2026",
    summary,
    matches: Array.isArray(t?.resumo_partidas) ? t.resumo_partidas : [],
    players
  };
}

export async function putEstatisticas(data) {
  const players = Array.isArray(data.players) ? data.players : [];
  const summary = data.summary || {};
  await rest("temporada", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      id: ROW_ID,
      atualizado: data.updated || new Date().toISOString().slice(0, 10),
      nome: data.season || "Mix 2026",
      partidas: summary.matches || 0,
      vitorias: summary.wins || 0,
      derrotas: summary.losses || 0,
      rounds: summary.roundsPlayed || 0,
      rating_medio: summary.avgRating || 0,
      resumo_partidas: Array.isArray(data.matches) ? data.matches : []
    })
  });

  const kept = [];
  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const id = slugNick(p.nick || p.id);
    kept.push(id);
    const nome = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    await rest("jogadores", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        id,
        nick: p.nick || id,
        nome,
        foto_url: p.avatar || "",
        cor: p.color || "#2f86ff",
        steam64: p.steam64 || "",
        tag: p.tag || "",
        status: p.status || "",
        jogo: p.game || "",
        ordem: i,
        painel: p
      })
    });
  }

  const existing = await rest("jogadores?select=id");
  const keepSet = new Set(kept);
  for (const row of existing || []) {
    if (!keepSet.has(row.id)) {
      await rest(`jogadores?id=eq.${encodeURIComponent(row.id)}`, { method: "DELETE" });
    }
  }

  return getEstatisticas();
}

export async function getElenco() {
  const rows = await rest("jogadores?select=nick,foto_url,tag,status,jogo,ordem&order=ordem.asc");
  return {
    updated: new Date().toISOString().slice(0, 10),
    defaultPhoto: "/assets/logo.png",
    members: (rows || []).map((r) => ({
      nick: r.nick,
      photo: r.foto_url || "",
      tag: r.tag || "",
      status: r.status || "",
      game: r.jogo || ""
    }))
  };
}

function sideFromRow(rows, lado, name, score, scoreT, scoreCT, result) {
  return {
    name: name || (lado === "a" ? "Time A" : "Time B"),
    score: score ?? 0,
    scoreT: scoreT ?? 0,
    scoreCT: scoreCT ?? 0,
    result: result || "",
    players: rows
      .filter((r) => r.lado === lado)
      .map((r) => ({
        nick: r.nick_na_partida,
        playerId: r.jogador_id || r.nick_na_partida,
        kills: r.abates,
        deaths: r.mortes,
        assists: r.assistencias,
        damage: r.dano,
        adr: r.adr,
        adrDiff: r.adr_diff,
        hltv: r.hltv,
        kast: r.kast,
        openKills: r.abates_abertura,
        tradeKills: r.abates_troca
      }))
  };
}

export async function getPartidas() {
  const [partidas, jogadores] = await Promise.all([
    rest("partidas?select=*&order=data.desc,hora.desc"),
    rest("partida_jogadores?select=*")
  ]);
  const byMatch = new Map();
  for (const row of jogadores || []) {
    if (!byMatch.has(row.partida_id)) byMatch.set(row.partida_id, []);
    byMatch.get(row.partida_id).push(row);
  }
  const matches = (partidas || []).map((p) => {
    const rows = byMatch.get(p.id) || [];
    return {
      id: p.id,
      date: p.data,
      time: p.hora || "",
      map: p.mapa_nome || "",
      mapCode: p.mapa_id || "",
      internal: Boolean(p.interna),
      teamA: sideFromRow(rows, "a", p.time_a, p.placar_a, p.placar_a_tr, p.placar_a_ct, p.resultado_a),
      teamB: sideFromRow(rows, "b", p.time_b, p.placar_b, p.placar_b_tr, p.placar_b_ct, p.resultado_b)
    };
  });
  const latest = matches[0]?.date || new Date().toISOString().slice(0, 10);
  return { updated: latest, matches };
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function putPartidas(data) {
  const matches = Array.isArray(data.matches) ? data.matches : [];
  const existing = await rest("partidas?select=id");
  for (const row of existing || []) {
    await rest(`partidas?id=eq.${encodeURIComponent(row.id)}`, { method: "DELETE" });
  }

  for (const m of matches) {
    const id = String(m.id || `${m.mapCode || m.map || "mapa"}-${m.date || "data"}`);
    const mapaId = m.mapCode || null;
    if (mapaId) {
      await rest("mapas", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          id: mapaId,
          nome: m.map || mapaId,
          imagem_url: `/assets/maps/${mapaId}.png`
        })
      });
    }
    await rest("partidas", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        id,
        data: m.date || null,
        hora: m.time || "",
        mapa_id: mapaId,
        mapa_nome: m.map || "",
        interna: Boolean(m.internal),
        time_a: m.teamA?.name || "",
        time_b: m.teamB?.name || "",
        placar_a: num(m.teamA?.score) ?? 0,
        placar_b: num(m.teamB?.score) ?? 0,
        placar_a_tr: num(m.teamA?.scoreT),
        placar_a_ct: num(m.teamA?.scoreCT),
        placar_b_tr: num(m.teamB?.scoreT),
        placar_b_ct: num(m.teamB?.scoreCT),
        resultado_a: m.teamA?.result || "",
        resultado_b: m.teamB?.result || ""
      })
    });

    const sides = [
      ["a", m.teamA?.players || []],
      ["b", m.teamB?.players || []]
    ];
    for (const [lado, list] of sides) {
      for (const p of list) {
        await rest("partida_jogadores", {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            partida_id: id,
            jogador_id: null,
            lado,
            nick_na_partida: p.nick || "",
            abates: num(p.kills),
            mortes: num(p.deaths),
            assistencias: num(p.assists),
            dano: num(p.damage),
            adr: num(p.adr),
            adr_diff: num(p.adrDiff),
            hltv: num(p.hltv),
            kast: num(p.kast),
            abates_abertura: num(p.openKills),
            abates_troca: num(p.tradeKills)
          })
        });
      }
    }
  }

  return getPartidas();
}

export async function getMapas() {
  const rows = await rest("mapas?select=*&order=nome.asc");
  return {
    poolSize: 7,
    maps: (rows || []).map((m) => ({
      id: m.id,
      name: m.nome,
      image: m.imagem_url
    }))
  };
}
