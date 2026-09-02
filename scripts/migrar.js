import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function slugNick(nick) {
  return String(nick || "")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "jogador";
}

function readJson(rel) {
  return JSON.parse(fs.readFileSync(path.join(root, rel), "utf8"));
}

function pngMapImage(image, id) {
  if (!image) return `/assets/maps/${id}.png`;
  return String(image).replace(/\.jpe?g$/i, ".png");
}

const url =
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.CAMPX1_POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL;

if (!url) {
  console.error("Defina POSTGRES_URL_NON_POOLING (ou DATABASE_URL) para migrar.");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

async function main() {
  const schema = fs.readFileSync(path.join(root, "supabase.sql"), "utf8");
  console.log("Aplicando schema…");
  await sql.unsafe(schema);

  const maps = readJson("data/maps.json");
  const stats = readJson("data/estatisticas.json");
  const roster = readJson("data/jogadores.json");
  const partidas = readJson("data/partidas.json");

  console.log("Importando mapas…");
  for (const m of maps.maps || []) {
    await sql`
      insert into mapas (id, nome, imagem_url)
      values (${m.id}, ${m.name}, ${pngMapImage(m.image, m.id)})
      on conflict (id) do update set
        nome = excluded.nome,
        imagem_url = excluded.imagem_url
    `;
  }

  console.log("Importando jogadores / painéis…");
  const byNick = new Map();
  (roster.members || []).forEach((m, i) => {
    byNick.set(m.nick, { ...m, ordem: i });
  });
  const players = Array.isArray(stats.players) ? stats.players : [];
  const seen = new Set();

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const extra = byNick.get(p.nick) || {};
    const id = slugNick(p.nick);
    seen.add(p.nick);
    const nome = [p.firstName, p.lastName].filter(Boolean).join(" ").trim();
    await sql`
      insert into jogadores (id, nick, nome, foto_url, cor, steam64, tag, status, jogo, ordem, painel)
      values (
        ${id},
        ${p.nick},
        ${nome},
        ${p.avatar || ""},
        ${p.color || "#3ec7ff"},
        ${p.steam64 || ""},
        ${extra.tag || p.tag || ""},
        ${extra.status || p.status || ""},
        ${extra.game || p.game || ""},
        ${i},
        ${sql.json(p)}
      )
      on conflict (id) do update set
        nick = excluded.nick,
        nome = excluded.nome,
        foto_url = excluded.foto_url,
        cor = excluded.cor,
        steam64 = excluded.steam64,
        tag = excluded.tag,
        status = excluded.status,
        jogo = excluded.jogo,
        ordem = excluded.ordem,
        painel = excluded.painel
    `;
  }

  let ordem = players.length;
  for (const m of roster.members || []) {
    if (seen.has(m.nick)) continue;
    const id = slugNick(m.nick);
    await sql`
      insert into jogadores (id, nick, nome, foto_url, cor, tag, status, jogo, ordem, painel)
      values (
        ${id},
        ${m.nick},
        ${""},
        ${m.photo || ""},
        ${"#3ec7ff"},
        ${m.tag || ""},
        ${m.status || ""},
        ${m.game || ""},
        ${ordem},
        ${sql.json({ nick: m.nick })}
      )
      on conflict (id) do nothing
    `;
    ordem += 1;
  }

  const summary = stats.summary || {};
  await sql`
    insert into temporada (id, atualizado, nome, partidas, vitorias, derrotas, rounds, rating_medio, resumo_partidas)
    values (
      ${"main"},
      ${stats.updated || null},
      ${stats.season || "Mix 2026"},
      ${summary.matches || 0},
      ${summary.wins || 0},
      ${summary.losses || 0},
      ${summary.roundsPlayed || 0},
      ${summary.avgRating || 0},
      ${sql.json(stats.matches || [])}
    )
    on conflict (id) do update set
      atualizado = excluded.atualizado,
      nome = excluded.nome,
      partidas = excluded.partidas,
      vitorias = excluded.vitorias,
      derrotas = excluded.derrotas,
      rounds = excluded.rounds,
      rating_medio = excluded.rating_medio,
      resumo_partidas = excluded.resumo_partidas
  `;

  console.log("Importando partidas…");
  await sql`delete from partida_jogadores`;
  await sql`delete from partidas`;

  for (const m of partidas.matches || []) {
    const id = String(m.id);
    if (m.mapCode) {
      await sql`
        insert into mapas (id, nome, imagem_url)
        values (${m.mapCode}, ${m.map || m.mapCode}, ${`/assets/maps/${m.mapCode}.png`})
        on conflict (id) do nothing
      `;
    }
    await sql`
      insert into partidas (
        id, data, hora, mapa_id, mapa_nome, interna,
        time_a, time_b, placar_a, placar_b,
        placar_a_tr, placar_a_ct, placar_b_tr, placar_b_ct,
        resultado_a, resultado_b
      ) values (
        ${id},
        ${m.date || null},
        ${m.time || ""},
        ${m.mapCode || null},
        ${m.map || ""},
        ${Boolean(m.internal)},
        ${m.teamA?.name || ""},
        ${m.teamB?.name || ""},
        ${m.teamA?.score ?? 0},
        ${m.teamB?.score ?? 0},
        ${m.teamA?.scoreT ?? null},
        ${m.teamA?.scoreCT ?? null},
        ${m.teamB?.scoreT ?? null},
        ${m.teamB?.scoreCT ?? null},
        ${m.teamA?.result || ""},
        ${m.teamB?.result || ""}
      )
    `;

    for (const [lado, team] of [["a", m.teamA], ["b", m.teamB]]) {
      for (const p of team?.players || []) {
        await sql`
          insert into partida_jogadores (
            partida_id, jogador_id, lado, nick_na_partida,
            abates, mortes, assistencias, dano, adr, adr_diff, hltv, kast,
            abates_abertura, abates_troca
          ) values (
            ${id},
            ${null},
            ${lado},
            ${p.nick || ""},
            ${p.kills ?? null},
            ${p.deaths ?? null},
            ${p.assists ?? null},
            ${p.damage ?? null},
            ${p.adr ?? null},
            ${p.adrDiff ?? null},
            ${p.hltv ?? null},
            ${p.kast ?? null},
            ${p.openKills ?? null},
            ${p.tradeKills ?? null}
          )
        `;
      }
    }
  }

  const nJog = await sql`select count(*)::int as n from jogadores`;
  const nPar = await sql`select count(*)::int as n from partidas`;
  const nElenco = await sql`select count(*)::int as n from campeonato_elenco`;
  console.log(`OK — ${nJog[0].n} jogadores, ${nPar[0].n} partidas, ${nElenco[0].n} no elenco 1v1.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => sql.end({ timeout: 5 }));
