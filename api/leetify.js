const LEETIFY_API = "https://api-public.cs-prod.leetify.com";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function isSteam64(id) {
  return typeof id === "string" && /^\d{17}$/.test(id);
}

function roundRating(value) {
  if (value == null || Number.isNaN(Number(value))) return null;
  return Math.round(Number(value));
}

function pickProfile(raw) {
  if (!raw || typeof raw !== "object") return null;
  var ranks = raw.ranks || {};
  var rating = raw.rating || {};
  var recent = Array.isArray(raw.recent_matches) ? raw.recent_matches.slice(0, 12) : [];

  return {
    name: raw.name || null,
    steam64_id: raw.steam64_id || null,
    winrate: raw.winrate != null ? Math.round(Number(raw.winrate) * 1000) / 10 : null,
    total_matches: raw.total_matches != null ? Number(raw.total_matches) : null,
    ranks: {
      leetify: ranks.leetify != null ? Number(ranks.leetify) : null,
      premier: ranks.premier != null ? Number(ranks.premier) : null,
      faceit_elo: ranks.faceit_elo != null ? Number(ranks.faceit_elo) : null,
    },
    rating: {
      aim: roundRating(rating.aim),
      positioning: roundRating(rating.positioning),
      utility: roundRating(rating.utility),
    },
    stats: {
      reaction_time_ms:
        raw.stats && raw.stats.reaction_time_ms != null
          ? Math.round(Number(raw.stats.reaction_time_ms))
          : null,
      accuracy_head:
        raw.stats && raw.stats.accuracy_head != null
          ? Math.round(Number(raw.stats.accuracy_head) * 10) / 10
          : null,
      spray_accuracy:
        raw.stats && raw.stats.spray_accuracy != null
          ? Math.round(Number(raw.stats.spray_accuracy) * 10) / 10
          : null,
    },
    recent_matches: recent.map(function (m) {
      return {
        map_name: m.map_name || null,
        outcome: m.outcome || null,
        finished_at: m.finished_at || null,
        leetify_rating: m.leetify_rating != null ? Number(m.leetify_rating) : null,
        score: Array.isArray(m.score) ? m.score : null,
      };
    }),
  };
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const steamId = req.query.steamId || req.query.steam64_id;
  if (!isSteam64(steamId)) {
    return res.status(400).json({ error: "invalid_steam_id", message: "steamId inválido." });
  }

  const headers = { Accept: "application/json" };
  if (process.env.LEETIFY_API_KEY) {
    headers.Authorization = "Bearer " + process.env.LEETIFY_API_KEY;
  }

  try {
    const upstream = await fetch(
      LEETIFY_API + "/v3/profile?steam64_id=" + encodeURIComponent(steamId),
      { headers, cache: "no-store" }
    );

    if (upstream.status === 404) {
      return res.status(404).json({
        error: "not_found",
        message: "Perfil não encontrado no Leetify.",
        profileUrl: "https://leetify.com/app/profile/" + steamId,
      });
    }

    if (!upstream.ok) {
      return res.status(502).json({ error: "leetify_error", message: "Erro ao contactar Leetify." });
    }

    const raw = await upstream.json();
    if (raw.error) {
      return res.status(502).json({ error: "leetify_error", message: String(raw.error) });
    }

    const profile = pickProfile(raw);
    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
    return res.status(200).json({
      ok: true,
      profileUrl: "https://leetify.com/app/profile/" + steamId,
      profile: profile,
    });
  } catch {
    return res.status(502).json({ error: "leetify_unreachable", message: "Leetify indisponível." });
  }
}
