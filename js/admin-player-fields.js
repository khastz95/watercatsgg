/* AdminPlayerFields — abas por seção */
var AdminPlayerFields = (function () {
  "use strict";

  /* ── Utilitários ─────────────────────────────── */
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function fld(label, id, value, type, attrs) {
    type = type || "text";
    attrs = attrs || "";
    return (
      '<div class="adm-field">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" type="' + type + '" value="' + esc(value != null ? value : "") + '" ' + attrs + ' /></div>'
    );
  }
  function selFld(label, id, options, current) {
    var opts = options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (current === o[0] ? " selected" : "") + '>' + esc(o[1]) + '</option>';
    }).join("");
    return '<div class="adm-field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts + '</select></div>';
  }
  function elVal(id, fb) {
    var el = document.getElementById(id);
    if (!el) return fb != null ? fb : null;
    return el.value.trim();
  }
  function elNum(id, fb) {
    var v = elVal(id);
    if (v === null || v === "") return fb != null ? fb : 0;
    var n = parseFloat(v);
    return isNaN(n) ? (fb != null ? fb : 0) : n;
  }
  function elInt(id, fb) {
    var v = elVal(id);
    if (v === null || v === "") return fb != null ? fb : 0;
    var n = parseInt(v, 10);
    return isNaN(n) ? (fb != null ? fb : 0) : n;
  }
  function section(title, gridClass, content) {
    return '<div class="adm-section"><p class="adm-section-title">' + esc(title) + '</p>' +
           '<div class="' + gridClass + '">' + content + '</div></div>';
  }
  function sectionRaw(title, content) {
    return '<div class="adm-section"><p class="adm-section-title">' + esc(title) + '</p>' + content + '</div>';
  }
  function p_(pi) { return "p" + pi + "-"; }

  /* ── Aba Identidade ──────────────────────────── */
  function renderIdentity(pi, p) {
    var id = p_(pi);
    var d = p.dashboard || {};
    var ini = (p.nick || "?").slice(0, 2).toUpperCase();
    var avatarBig = p.avatar
      ? '<img src="' + esc(p.avatar) + '" alt="" id="' + id + 'avatar-preview" onerror="this.style.display=\'none\'" />' + esc(ini)
      : '<span id="' + id + 'avatar-ini">' + esc(ini) + '</span>';
    var roleOptions = [
      ["","— selecione —"],["Entry","Entry"],["Lurk","Lurk"],["AWPer","AWPer"],
      ["Support","Support"],["IGL","IGL"],["Rifler","Rifler"],["Hybrid","Hybrid"]
    ];
    return (
      '<div class="adm-section">' +
      '<p class="adm-section-title">Perfil no CS2</p>' +
      '<div class="adm-identity-top">' +
      '<span class="adm-avatar-big">' + avatarBig + '</span>' +
      '<div class="adm-grid-2" style="flex:1;min-width:200px">' +
      fld("Nick (CS2)", id + "nick", p.nick) +
      selFld("Função / Role", id + "role", roleOptions, p.role) +
      fld("Primeiro nome", id + "firstname", p.firstName) +
      fld("Sobrenome", id + "lastname", p.lastName) +
      '</div></div>' +
      '<div class="adm-grid-1" style="margin-top:0.85rem">' +
      fld("Foto — URL Steam ou link direto de imagem", id + "avatar", p.avatar, "url", 'placeholder="https://avatars.steamstatic.com/…_full.jpg"') +
      '<p class="adm-hint">Cole o link da foto Steam: clique com botão direito na foto do perfil → Abrir imagem em nova aba → copie a URL.</p>' +
      '</div></div>' +
      section("Stats principais", "adm-grid-2",
        fld("K/D Ratio", id + "kd", d.kd, "number", 'min="0" step="0.01"') +
        fld("HLTV Rating", id + "hltv", d.hltvRating, "number", 'min="0" step="0.01"')
      )
    );
  }

  /* ── Aba Stats ───────────────────────────────── */
  function renderStats(pi, p) {
    var id = p_(pi);
    var d = p.dashboard || {};
    var wr = d.winRate || {};
    var cb = d.combat || {};
    return (
      section("Vitórias & Derrotas", "adm-grid-4",
        fld("Jogadas", id + "wr-played", wr.played, "number", 'min="0" step="1"') +
        fld("Vitórias", id + "wr-won", wr.won, "number", 'min="0" step="1"') +
        fld("Derrotas", id + "wr-lost", wr.lost, "number", 'min="0" step="1"') +
        fld("Empates", id + "wr-tied", wr.tied, "number", 'min="0" step="1"') +
        fld("Win Rate %", id + "wr-pct", wr.percent, "number", 'min="0" max="100" step="0.1"')
      ) +
      section("Combate", "adm-grid-4",
        fld("HS %", id + "cb-hs", cb.hsPercent, "number", 'min="0" max="100" step="0.1"') +
        fld("ADR", id + "cb-adr", cb.adr, "number", 'min="0" step="0.1"') +
        fld("Kills", id + "cb-kills", cb.kills, "number", 'min="0" step="1"') +
        fld("Deaths", id + "cb-deaths", cb.deaths, "number", 'min="0" step="1"') +
        fld("Assists", id + "cb-assists", cb.assists, "number", 'min="0" step="1"') +
        fld("Headshots", id + "cb-headshots", cb.headshots, "number", 'min="0" step="1"') +
        fld("Dano total", id + "cb-damage", cb.damage, "number", 'min="0" step="1"') +
        fld("Rounds jogados", id + "cb-rounds", cb.rounds, "number", 'min="0" step="1"')
      )
    );
  }

  /* ── Aba Partidas recentes ───────────────────── */
  function renderMatches(pi, p) {
    var id = p_(pi);
    var rm = (p.dashboard && p.dashboard.recentMatches) || [];
    var mapOptions = [
      "de_mirage","de_dust2","de_inferno","de_nuke","de_ancient",
      "de_anubis","de_vertigo","de_overpass","de_cache","de_train","de_cobblestone"
    ].map(function(m){ return [m, m]; });
    var rows = rm.map(function (m, i) {
      return (
        '<div class="adm-dyn-item" id="' + id + 'rm-' + i + '">' +
        '<div class="adm-dyn-item__head">' +
        '<span>Partida ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-match="' + i + '" data-pi="' + pi + '">Remover</button>' +
        '</div>' +
        '<div class="adm-grid-3">' +
        selFld("Mapa", id + "rm-map-" + i, mapOptions, m.map) +
        fld("Placar A", id + "rm-sa-" + i, m.scoreA, "number", 'min="0" step="1"') +
        fld("Placar B", id + "rm-sb-" + i, m.scoreB, "number", 'min="0" step="1"') +
        '</div></div>'
      );
    }).join("");
    return (
      sectionRaw("Partidas recentes (últimas 10)",
        '<div class="adm-dyn-list" id="' + id + 'rm-list">' +
        (rows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma partida. Clique em + Partida.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-match="' + pi + '">+ Partida</button>'
      )
    );
  }

  /* ── Aba Clutch & Entry ──────────────────────── */
  function renderClutch(pi, p) {
    var id = p_(pi);
    var d = p.dashboard || {};
    var cl = d.clutch || {};
    var en = d.entry || {};
    var situations = cl.situations || [
      { id: "1v1", success: 0, wins: 0, losses: 0 },
      { id: "1v2", success: 0, wins: 0, losses: 0 },
      { id: "1v3", success: 0, wins: 0, losses: 0 },
      { id: "1v4", success: 0, wins: 0, losses: 0 },
      { id: "1v5", success: 0, wins: 0, losses: 0 },
    ];
    var sitRows = situations.map(function (s, i) {
      return (
        '<div class="adm-clutch-row">' +
        '<span class="adm-clutch-row__id">' + esc(s.id) + '</span>' +
        fld("Sucesso %", id + "cl-suc-" + i, s.success, "number", 'min="0" max="100" step="1"') +
        fld("Vitórias", id + "cl-wins-" + i, s.wins, "number", 'min="0" step="1"') +
        fld("Derrotas", id + "cl-losses-" + i, s.losses, "number", 'min="0" step="1"') +
        '</div>'
      );
    }).join("");
    var combined = en.combined || {};
    var enT = en.t || {};
    var enCT = en.ct || {};
    return (
      '<div class="adm-section">' +
      '<p class="adm-section-title">Clutch geral</p>' +
      '<div class="adm-grid-1" style="max-width:180px;margin-bottom:1rem">' +
      fld("Overall %", id + "cl-overall", cl.overall, "number", 'min="0" max="100" step="1"') +
      '</div>' +
      '<div class="adm-clutch-grid">' +
      '<div class="adm-clutch-row" style="align-items:center;font-size:0.68rem;font-weight:700;text-transform:uppercase;color:var(--text-muted);border-bottom:1px solid var(--border);padding-bottom:0.4rem;margin-bottom:0.2rem">' +
      '<span>Tipo</span><span>Sucesso %</span><span>Vitórias</span><span>Derrotas</span></div>' +
      sitRows +
      '</div></div>' +
      section("Entry frags", "adm-grid-4",
        fld("Entry por round %", id + "en-perround", en.perRound, "number", 'min="0" step="0.1"') +
        fld("Combinado sucesso %", id + "en-comb-suc", combined.success, "number", 'min="0" step="0.1"') +
        fld("Combinado tentativas", id + "en-comb-att", combined.attempts, "number", 'min="0" step="1"') +
        '<div></div>' +
        fld("CT sucesso %", id + "en-ct-suc", enCT.success, "number", 'min="0" step="0.1"') +
        fld("CT tentativas", id + "en-ct-att", enCT.attempts, "number", 'min="0" step="1"') +
        fld("T sucesso %", id + "en-t-suc", enT.success, "number", 'min="0" step="0.1"') +
        fld("T tentativas", id + "en-t-att", enT.attempts, "number", 'min="0" step="1"')
      )
    );
  }

  /* ── Aba Mapas ───────────────────────────────── */
  function renderMaps(pi, p) {
    var id = p_(pi);
    var maps = (p.dashboard && p.dashboard.maps) || {};
    var mp = maps.mostPlayed || [];
    var ms = maps.mostSuccess || [];
    var mpRows = mp.map(function (m, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Mapa ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-mp="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-2">' +
        fld("Mapa (código)", id + "mp-name-" + i, m.name, "text", 'placeholder="de_mirage"') +
        fld("Partidas jogadas", id + "mp-count-" + i, m.count, "number", 'min="0" step="1"') +
        '</div></div>'
      );
    }).join("");
    var msRows = ms.map(function (m, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Mapa ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-ms="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-2">' +
        fld("Mapa (código)", id + "ms-name-" + i, m.name, "text", 'placeholder="de_dust2"') +
        fld("Win rate %", id + "ms-wp-" + i, m.winPercent, "number", 'min="0" max="100" step="0.1"') +
        '</div></div>'
      );
    }).join("");
    return (
      sectionRaw("Mais jogados",
        '<div class="adm-dyn-list" id="' + id + 'mp-list">' +
        (mpRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhum mapa.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-mp="' + pi + '">+ Mapa</button>'
      ) +
      sectionRaw("Mais sucesso",
        '<div class="adm-dyn-list" id="' + id + 'ms-list">' +
        (msRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhum mapa.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-ms="' + pi + '">+ Mapa</button>'
      )
    );
  }

  /* ── Aba Armas ───────────────────────────────── */
  function renderWeapons(pi, p) {
    var id = p_(pi);
    var wp = (p.dashboard && p.dashboard.weapons) || {};
    var mk = wp.mostKills || [];
    var hr = wp.headshotRate || [];
    var mkRows = mk.map(function (w, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Arma ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-mk="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-3">' +
        fld("Nome da arma", id + "mk-name-" + i, w.name, "text", 'placeholder="AK-47"') +
        fld("Kills", id + "mk-val-" + i, w.value, "number", 'min="0" step="1"') +
        fld("Barra %", id + "mk-bar-" + i, w.bar, "number", 'min="0" max="100" step="1"') +
        '</div></div>'
      );
    }).join("");
    var hrRows = hr.map(function (w, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Arma ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-hr="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-3">' +
        fld("Nome da arma", id + "hr-name-" + i, w.name, "text", 'placeholder="AK-47"') +
        fld("HS Rate %", id + "hr-val-" + i, w.value, "number", 'min="0" max="100" step="0.1"') +
        fld("Barra %", id + "hr-bar-" + i, w.bar, "number", 'min="0" max="100" step="1"') +
        '</div></div>'
      );
    }).join("");
    return (
      sectionRaw("Mais kills por arma",
        '<div class="adm-dyn-list" id="' + id + 'mk-list">' +
        (mkRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma arma.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-mk="' + pi + '">+ Arma</button>'
      ) +
      sectionRaw("HS rate por arma",
        '<div class="adm-dyn-list" id="' + id + 'hr-list">' +
        (hrRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma arma.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-hr="' + pi + '">+ Arma</button>'
      )
    );
  }

  /* ── Aba Ranks ───────────────────────────────── */
  function renderRanks(pi, p) {
    var id = p_(pi);
    var ranks = (p.dashboard && p.dashboard.ranks) || {};
    var premier = ranks.premier || [];
    var wm = ranks.wingman || {};
    var comp = ranks.competitive || [];
    var premRows = premier.map(function (r, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Temporada ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-prem="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-4">' +
        fld("Season", id + "prem-season-" + i, r.season, "text", 'placeholder="S4"') +
        fld("Data", id + "prem-date-" + i, r.date, "text", 'placeholder="Nov 2025"') +
        fld("Rating atual", id + "prem-rating-" + i, r.rating, "number", 'min="0" step="1"') +
        fld("Melhor rating", id + "prem-best-" + i, r.best, "number", 'min="0" step="1"') +
        fld("Vitórias", id + "prem-wins-" + i, r.wins, "number", 'min="0" step="1"') +
        '</div></div>'
      );
    }).join("");
    var compRows = comp.map(function (r, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Mapa ' + (i + 1) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-comp="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-3">' +
        fld("Mapa (código)", id + "comp-map-" + i, r.map, "text", 'placeholder="de_mirage"') +
        fld("Rank", id + "comp-rank-" + i, r.rankLabel, "text", 'placeholder="MG I"') +
        fld("Vitórias", id + "comp-wins-" + i, r.wins, "number", 'min="0" step="1"') +
        '</div></div>'
      );
    }).join("");
    return (
      section("Wingman", "adm-grid-2",
        fld("Rank", id + "wm-rank", wm.rankLabel, "text", 'placeholder="DMG"') +
        fld("Vitórias", id + "wm-wins", wm.wins, "number", 'min="0" step="1"')
      ) +
      sectionRaw("Premier (histórico de temporadas)",
        '<div class="adm-dyn-list" id="' + id + 'prem-list">' +
        (premRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma temporada.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-prem="' + pi + '">+ Temporada</button>'
      ) +
      sectionRaw("Competitivo por mapa",
        '<div class="adm-dyn-list" id="' + id + 'comp-list">' +
        (compRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhum mapa.</p>') +
        '</div>' +
        '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-comp="' + pi + '">+ Mapa</button>'
      )
    );
  }

  /* ── Aba Vídeos ──────────────────────────────── */
  function renderVideos(pi, p) {
    var id = p_(pi);
    var hl = p.highlights || [];
    var rows = hl.map(function (h, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>' + esc(h.title || "Clipe " + (i + 1)) + '</span>' +
        '<button type="button" class="adm-dyn-remove" data-rm-hl="' + i + '" data-pi="' + pi + '">Remover</button></div>' +
        '<div class="adm-grid-2">' +
        fld("Título", id + "hl-title-" + i, h.title) +
        fld("Mapa", id + "hl-map-" + i, h.map, "text", 'placeholder="Mirage"') +
        fld("Data", id + "hl-date-" + i, h.date, "date") +
        '</div>' +
        '<div class="adm-grid-1" style="margin-top:0.5rem">' +
        fld("URL do vídeo (MP4, YouTube ou Twitch)", id + "hl-url-" + i, h.url, "url", 'placeholder="https://…"') +
        '</div></div>'
      );
    }).join("");
    return sectionRaw("Clipes e Highlights",
      '<div class="adm-dyn-list" id="' + id + 'hl-list">' +
      (rows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhum clipe. Clique em + Clipe.</p>') +
      '</div>' +
      '<button type="button" class="btn btn--ghost btn--compact" style="margin-top:0.5rem" data-add-hl="' + pi + '">+ Clipe</button>'
    );
  }

  /* ── Dispatcher de render ────────────────────── */
  function renderTab(tabId, pi, p) {
    switch (tabId) {
      case "identity": return renderIdentity(pi, p);
      case "stats":    return renderStats(pi, p);
      case "matches":  return renderMatches(pi, p);
      case "clutch":   return renderClutch(pi, p);
      case "maps":     return renderMaps(pi, p);
      case "weapons":  return renderWeapons(pi, p);
      case "ranks":    return renderRanks(pi, p);
      case "videos":   return renderVideos(pi, p);
      default:         return "<p>Aba desconhecida.</p>";
    }
  }

  /* ── Collect (lê todos os campos visíveis) ───── */
  function collect(pi, p) {
    if (!p) return;
    var id = p_(pi);

    /* Identidade */
    if (document.getElementById(id + "nick")) {
      p.nick      = elVal(id + "nick", p.nick);
      p.firstName = elVal(id + "firstname", p.firstName || "");
      p.lastName  = elVal(id + "lastname", p.lastName || "");
      p.avatar    = elVal(id + "avatar", p.avatar || "");
      p.role      = elVal(id + "role", p.role || "");
    }

    /* Stats principais (também na aba Identidade) */
    if (document.getElementById(id + "kd")) {
      p.dashboard = p.dashboard || {};
      p.dashboard.kd = elNum(id + "kd", p.dashboard.kd);
      p.dashboard.hltvRating = elNum(id + "hltv", p.dashboard.hltvRating);
    }

    /* Win Rate */
    if (document.getElementById(id + "wr-played")) {
      p.dashboard = p.dashboard || {};
      p.dashboard.winRate = {
        percent: elNum(id + "wr-pct", 0),
        played:  elInt(id + "wr-played", 0),
        won:     elInt(id + "wr-won", 0),
        lost:    elInt(id + "wr-lost", 0),
        tied:    elInt(id + "wr-tied", 0),
      };
    }

    /* Combat */
    if (document.getElementById(id + "cb-kills")) {
      p.dashboard = p.dashboard || {};
      p.dashboard.combat = {
        hsPercent:  elNum(id + "cb-hs", 0),
        adr:        elNum(id + "cb-adr", 0),
        kills:      elInt(id + "cb-kills", 0),
        deaths:     elInt(id + "cb-deaths", 0),
        assists:    elInt(id + "cb-assists", 0),
        headshots:  elInt(id + "cb-headshots", 0),
        damage:     elInt(id + "cb-damage", 0),
        rounds:     elInt(id + "cb-rounds", 0),
      };
    }

    /* Recent Matches */
    if (document.getElementById(id + "rm-list") || document.querySelector("[id^='" + id + "rm-map-']")) {
      var rm = [];
      var i = 0;
      while (document.getElementById(id + "rm-map-" + i)) {
        rm.push({
          map:    elVal(id + "rm-map-" + i, "de_mirage"),
          scoreA: elInt(id + "rm-sa-" + i, 0),
          scoreB: elInt(id + "rm-sb-" + i, 0),
        });
        i++;
      }
      if (i > 0) { p.dashboard = p.dashboard || {}; p.dashboard.recentMatches = rm; }
    }

    /* Clutch */
    if (document.getElementById(id + "cl-overall")) {
      p.dashboard = p.dashboard || {};
      p.dashboard.clutch = p.dashboard.clutch || {};
      p.dashboard.clutch.overall = elNum(id + "cl-overall", 0);
      var situations = [];
      var sIds = ["1v1","1v2","1v3","1v4","1v5"];
      sIds.forEach(function (sid, i) {
        if (!document.getElementById(id + "cl-suc-" + i)) return;
        situations.push({
          id:      sid,
          success: elNum(id + "cl-suc-" + i, 0),
          wins:    elInt(id + "cl-wins-" + i, 0),
          losses:  elInt(id + "cl-losses-" + i, 0),
        });
      });
      if (situations.length) p.dashboard.clutch.situations = situations;
    }

    /* Entry */
    if (document.getElementById(id + "en-perround")) {
      p.dashboard = p.dashboard || {};
      p.dashboard.entry = {
        perRound: elNum(id + "en-perround", 0),
        combined: { success: elNum(id + "en-comb-suc", 0), attempts: elInt(id + "en-comb-att", 0) },
        ct:       { success: elNum(id + "en-ct-suc", 0),   attempts: elInt(id + "en-ct-att", 0) },
        t:        { success: elNum(id + "en-t-suc", 0),    attempts: elInt(id + "en-t-att", 0) },
      };
    }

    /* Maps mostPlayed */
    if (document.querySelector("[id^='" + id + "mp-name-']")) {
      var mp = []; var i2 = 0;
      while (document.getElementById(id + "mp-name-" + i2)) {
        mp.push({ name: elVal(id + "mp-name-" + i2, ""), count: elInt(id + "mp-count-" + i2, 0) });
        i2++;
      }
      p.dashboard = p.dashboard || {};
      p.dashboard.maps = p.dashboard.maps || {};
      p.dashboard.maps.mostPlayed = mp;
    }

    /* Maps mostSuccess */
    if (document.querySelector("[id^='" + id + "ms-name-']")) {
      var ms = []; var i3 = 0;
      while (document.getElementById(id + "ms-name-" + i3)) {
        ms.push({ name: elVal(id + "ms-name-" + i3, ""), winPercent: elNum(id + "ms-wp-" + i3, 0) });
        i3++;
      }
      p.dashboard = p.dashboard || {};
      p.dashboard.maps = p.dashboard.maps || {};
      p.dashboard.maps.mostSuccess = ms;
    }

    /* Weapons mostKills */
    if (document.querySelector("[id^='" + id + "mk-name-']")) {
      var mk = []; var i4 = 0;
      while (document.getElementById(id + "mk-name-" + i4)) {
        mk.push({ name: elVal(id + "mk-name-" + i4, ""), value: elInt(id + "mk-val-" + i4, 0), bar: elInt(id + "mk-bar-" + i4, 0) });
        i4++;
      }
      p.dashboard = p.dashboard || {};
      p.dashboard.weapons = p.dashboard.weapons || {};
      p.dashboard.weapons.mostKills = mk;
    }

    /* Weapons headshotRate */
    if (document.querySelector("[id^='" + id + "hr-name-']")) {
      var hr = []; var i5 = 0;
      while (document.getElementById(id + "hr-name-" + i5)) {
        hr.push({ name: elVal(id + "hr-name-" + i5, ""), value: elNum(id + "hr-val-" + i5, 0), bar: elInt(id + "hr-bar-" + i5, 0) });
        i5++;
      }
      p.dashboard = p.dashboard || {};
      p.dashboard.weapons = p.dashboard.weapons || {};
      p.dashboard.weapons.headshotRate = hr;
    }

    /* Ranks premier */
    if (document.querySelector("[id^='" + id + "prem-season-']")) {
      var prem = []; var i6 = 0;
      while (document.getElementById(id + "prem-season-" + i6)) {
        prem.push({
          season: elVal(id + "prem-season-" + i6, ""),
          date:   elVal(id + "prem-date-" + i6, ""),
          rating: elInt(id + "prem-rating-" + i6, 0),
          best:   elInt(id + "prem-best-" + i6, 0),
          wins:   elInt(id + "prem-wins-" + i6, 0),
        });
        i6++;
      }
      p.dashboard = p.dashboard || {};
      p.dashboard.ranks = p.dashboard.ranks || {};
      p.dashboard.ranks.premier = prem;
    }

    /* Ranks wingman */
    if (document.getElementById(id + "wm-rank")) {
      p.dashboard = p.dashboard || {};
      p.dashboard.ranks = p.dashboard.ranks || {};
      p.dashboard.ranks.wingman = {
        rankLabel: elVal(id + "wm-rank", ""),
        wins:      elInt(id + "wm-wins", 0),
      };
    }

    /* Ranks competitive */
    if (document.querySelector("[id^='" + id + "comp-map-']")) {
      var comp = []; var i7 = 0;
      while (document.getElementById(id + "comp-map-" + i7)) {
        comp.push({
          map:       elVal(id + "comp-map-" + i7, ""),
          rankLabel: elVal(id + "comp-rank-" + i7, ""),
          wins:      elInt(id + "comp-wins-" + i7, 0),
        });
        i7++;
      }
      p.dashboard = p.dashboard || {};
      p.dashboard.ranks = p.dashboard.ranks || {};
      p.dashboard.ranks.competitive = comp;
    }

    /* Highlights */
    if (document.querySelector("[id^='" + id + "hl-title-']")) {
      var hl = []; var i8 = 0;
      while (document.getElementById(id + "hl-title-" + i8)) {
        hl.push({
          title: elVal(id + "hl-title-" + i8, ""),
          map:   elVal(id + "hl-map-" + i8, ""),
          date:  elVal(id + "hl-date-" + i8, ""),
          url:   elVal(id + "hl-url-" + i8, ""),
        });
        i8++;
      }
      p.highlights = hl;
    }
  }

  /* ── Eventos dinâmicos (add/remove) ──────────── */
  function bindDynamic(root, pi, app) {
    var p = app.data.players[pi];

    function refreshTab(tabId) {
      collect(pi, p);
      app.tab = tabId;
      var panel = root.querySelector('[data-panel="' + tabId + '"]');
      if (panel) {
        panel.innerHTML = renderTab(tabId, pi, p);
        bindDynamic(root, pi, app);
      }
    }

    /* Partidas recentes — add */
    root.querySelectorAll("[data-add-match]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.recentMatches = p.dashboard.recentMatches || [];
        p.dashboard.recentMatches.unshift({ map: "de_mirage", scoreA: 13, scoreB: 10 });
        refreshTab("matches");
      });
    });
    /* Partidas recentes — remove */
    root.querySelectorAll("[data-rm-match]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.recentMatches.splice(parseInt(btn.getAttribute("data-rm-match"), 10), 1);
        refreshTab("matches");
      });
    });

    /* Mapas mostPlayed — add */
    root.querySelectorAll("[data-add-mp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.maps = p.dashboard.maps || {};
        p.dashboard.maps.mostPlayed = p.dashboard.maps.mostPlayed || [];
        p.dashboard.maps.mostPlayed.push({ name: "de_mirage", count: 0 });
        refreshTab("maps");
      });
    });
    root.querySelectorAll("[data-rm-mp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.maps.mostPlayed.splice(parseInt(btn.getAttribute("data-rm-mp"), 10), 1);
        refreshTab("maps");
      });
    });

    /* Mapas mostSuccess — add */
    root.querySelectorAll("[data-add-ms]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.maps = p.dashboard.maps || {};
        p.dashboard.maps.mostSuccess = p.dashboard.maps.mostSuccess || [];
        p.dashboard.maps.mostSuccess.push({ name: "de_dust2", winPercent: 0 });
        refreshTab("maps");
      });
    });
    root.querySelectorAll("[data-rm-ms]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.maps.mostSuccess.splice(parseInt(btn.getAttribute("data-rm-ms"), 10), 1);
        refreshTab("maps");
      });
    });

    /* Armas mostKills — add */
    root.querySelectorAll("[data-add-mk]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.weapons = p.dashboard.weapons || {};
        p.dashboard.weapons.mostKills = p.dashboard.weapons.mostKills || [];
        p.dashboard.weapons.mostKills.push({ name: "AK-47", value: 0, bar: 0 });
        refreshTab("weapons");
      });
    });
    root.querySelectorAll("[data-rm-mk]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.weapons.mostKills.splice(parseInt(btn.getAttribute("data-rm-mk"), 10), 1);
        refreshTab("weapons");
      });
    });

    /* Armas headshotRate — add */
    root.querySelectorAll("[data-add-hr]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.weapons = p.dashboard.weapons || {};
        p.dashboard.weapons.headshotRate = p.dashboard.weapons.headshotRate || [];
        p.dashboard.weapons.headshotRate.push({ name: "AK-47", value: 0, bar: 0 });
        refreshTab("weapons");
      });
    });
    root.querySelectorAll("[data-rm-hr]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.weapons.headshotRate.splice(parseInt(btn.getAttribute("data-rm-hr"), 10), 1);
        refreshTab("weapons");
      });
    });

    /* Ranks premier — add */
    root.querySelectorAll("[data-add-prem]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.ranks = p.dashboard.ranks || {};
        p.dashboard.ranks.premier = p.dashboard.ranks.premier || [];
        p.dashboard.ranks.premier.unshift({ season: "S?", date: "", rating: 0, best: 0, wins: 0 });
        refreshTab("ranks");
      });
    });
    root.querySelectorAll("[data-rm-prem]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.ranks.premier.splice(parseInt(btn.getAttribute("data-rm-prem"), 10), 1);
        refreshTab("ranks");
      });
    });

    /* Ranks competitive — add */
    root.querySelectorAll("[data-add-comp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.dashboard = p.dashboard || {};
        p.dashboard.ranks = p.dashboard.ranks || {};
        p.dashboard.ranks.competitive = p.dashboard.ranks.competitive || [];
        p.dashboard.ranks.competitive.push({ map: "de_mirage", rankLabel: "MG I", wins: 0 });
        refreshTab("ranks");
      });
    });
    root.querySelectorAll("[data-rm-comp]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.dashboard.ranks.competitive.splice(parseInt(btn.getAttribute("data-rm-comp"), 10), 1);
        refreshTab("ranks");
      });
    });

    /* Highlights — add */
    root.querySelectorAll("[data-add-hl]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        p.highlights = p.highlights || [];
        p.highlights.push({ title: "Novo clipe", map: "", date: new Date().toISOString().slice(0, 10), url: "" });
        refreshTab("videos");
      });
    });
    root.querySelectorAll("[data-rm-hl]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collect(pi, p);
        p.highlights.splice(parseInt(btn.getAttribute("data-rm-hl"), 10), 1);
        refreshTab("videos");
      });
    });
  }

  /* ── API pública ─────────────────────────────── */
  return {
    renderTab: renderTab,
    collect: collect,
    bindDynamic: bindDynamic,
  };
})();
