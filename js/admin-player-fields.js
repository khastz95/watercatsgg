(function (global) {
  "use strict";

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function field(label, id, value, type, attrs) {
    type = type || "text";
    attrs = attrs || "";
    return (
      '<div class="field admin-field">' +
      '<label for="' +
      id +
      '">' +
      esc(label) +
      "</label>" +
      '<input id="' +
      id +
      '" type="' +
      type +
      '" value="' +
      esc(value != null ? value : "") +
      '" ' +
      attrs +
      " />"
    );
  }

  function renderRecentMatch(pi, i, m) {
    return (
      '<div class="admin-block admin-block--tight" data-rm="' +
      pi +
      "-" +
      i +
      '">' +
      '<div class="admin-block__head"><span>Partida ' +
      (i + 1) +
      '</span><button type="button" class="admin-remove" data-rm-remove="' +
      pi +
      "-" +
      i +
      '">Remover</button></div>' +
      '<div class="admin-grid-3">' +
      field("Mapa (ex: de_mirage)", "rm-map-" + pi + "-" + i, m.map) +
      field("Placar A", "rm-sa-" + pi + "-" + i, m.scoreA, "number", 'min="0"') +
      field("Placar B", "rm-sb-" + pi + "-" + i, m.scoreB, "number", 'min="0"') +
      '<div class="field admin-field"><label for="rm-res-' +
      pi +
      "-" +
      i +
      '">Resultado</label><select id="rm-res-' +
      pi +
      "-" +
      i +
      '"><option value="win"' +
      (m.result === "win" ? " selected" : "") +
      '>Vitória</option><option value="loss"' +
      (m.result === "loss" ? " selected" : "") +
      '>Derrota</option><option value="tie"' +
      (m.result === "tie" ? " selected" : "") +
      ">Empate</option></select></div></div></div>"
    ).replace(/<\/?motion[^>]*>/g, "");
  }

  function renderMapRow(pi, i, m, prefix, labelKey, valueKey, valueLabel) {
    return (
      '<div class="admin-block admin-block--tight">' +
      '<div class="admin-block__head"><span>' +
      esc(labelKey) +
      " " +
      (i + 1) +
      '</span><button type="button" class="admin-remove" data-' +
      prefix +
      '-remove="' +
      pi +
      "-" +
      i +
      '">Remover</button></div>' +
      '<div class="admin-grid-2">' +
      field("Mapa", prefix + "-name-" + pi + "-" + i, m.name) +
      field(valueLabel, prefix + "-val-" + pi + "-" + i, m[valueKey], "number", 'min="0"') +
      (m.bar != null
        ? field("Barra % (visual)", prefix + "-bar-" + pi + "-" + i, m.bar, "number", 'min="0" max="100"')
        : m.winPercent != null
          ? field("Win %", prefix + "-val-" + pi + "-" + i, m.winPercent, "number", 'min="0" max="100"')
          : "") +
      "</div></div>"
    ).replace(/<\/?motion[^>]*>/g, "");
  }

  function renderWeaponRow(pi, i, w, prefix, isHs) {
    return (
      '<div class="admin-block admin-block--tight">' +
      '<div class="admin-block__head"><span>Arma ' +
      (i + 1) +
      '</span><button type="button" class="admin-remove" data-' +
      prefix +
      '-remove="' +
      pi +
      "-" +
      i +
      '">Remover</button></div>' +
      '<div class="admin-grid-3">' +
      field("Nome", prefix + "-name-" + pi + "-" + i, w.name) +
      field(isHs ? "HS %" : "Kills", prefix + "-val-" + pi + "-" + i, w.value, "number", 'min="0"') +
      field("Barra %", prefix + "-bar-" + pi + "-" + i, w.bar != null ? w.bar : 100, "number", 'min="0" max="100"') +
      "</div></div>"
    ).replace(/<\/?motion[^>]*>/g, "");
  }

  function renderPlayer(pi, p) {
    var d = p.dashboard || StatsSchema.defaultDashboard();
    var clutchHtml = (d.clutch.situations || []).map(function (s, si) {
      return (
        '<div class="admin-grid-3 admin-grid-3--clutch">' +
        "<strong>" +
        esc(s.id) +
        "</strong>" +
        field("% sucesso", "cl-suc-" + pi + "-" + si, s.success, "number", 'min="0" max="100"') +
        field("Vitórias", "cl-w-" + pi + "-" + si, s.wins, "number", 'min="0"') +
        field("Derrotas", "cl-l-" + pi + "-" + si, s.losses, "number", 'min="0"') +
        "</div>"
      );
    }).join("");

    var rmHtml = (d.recentMatches || [])
      .map(function (m, i) {
        return renderRecentMatch(pi, i, m);
      })
      .join("");

    var mpHtml = (d.maps.mostPlayed || [])
      .map(function (m, i) {
        return (
          '<div class="admin-block admin-block--tight">' +
          '<div class="admin-block__head"><span>Mapa ' +
          (i + 1) +
          '</span><button type="button" class="admin-remove" data-mp-remove="' +
          pi +
          "-" +
          i +
          '">Remover</button></div>' +
          '<div class="admin-grid-2">' +
          field("Nome", "mp-name-" + pi + "-" + i, m.name) +
          field("Partidas", "mp-count-" + pi + "-" + i, m.count, "number", 'min="0"') +
          "</div></div>"
        );
      })
      .join("");

    var msHtml = (d.maps.mostSuccess || [])
      .map(function (m, i) {
        return (
          '<div class="admin-block admin-block--tight">' +
          '<div class="admin-block__head"><span>Mapa ' +
          (i + 1) +
          '</span><button type="button" class="admin-remove" data-ms-remove="' +
          pi +
          "-" +
          i +
          '">Remover</button></div>' +
          '<div class="admin-grid-2">' +
          field("Nome", "ms-name-" + pi + "-" + i, m.name) +
          field("Win %", "ms-win-" + pi + "-" + i, m.winPercent, "number", 'min="0" max="100"') +
          "</div></div>"
        );
      })
      .join("");
    msHtml = msHtml.replace(/<\/?motion[^>]*>/g, "");

    var wkHtml = (d.weapons.mostKills || [])
      .map(function (w, i) {
        return renderWeaponRow(pi, i, w, "wk", false);
      })
      .join("");

    var whHtml = (d.weapons.headshotRate || [])
      .map(function (w, i) {
        return renderWeaponRow(pi, i, w, "wh", true);
      })
      .join("");

    var highlights = p.highlights || [];
    var hlHtml = highlights
      .map(function (h, hi) {
        return (
          '<div class="admin-highlight">' +
          '<div class="admin-block__head"><span>Clip ' +
          (hi + 1) +
          '</span><button type="button" class="admin-remove" data-remove-highlight="' +
          pi +
          "-" +
          hi +
          '">Remover</button></div>' +
          field("Título", "hl-title-" + pi + "-" + hi, h.title) +
          field("Mapa", "hl-map-" + pi + "-" + hi, h.map) +
          field("Data", "hl-date-" + pi + "-" + hi, h.date, "date") +
          field("URL Allstar (MP4)", "hl-url-" + pi + "-" + hi, h.url, "url", 'placeholder="https://media2.allstar.gg/..."') +
          "</div>"
        );
      })
      .join("");

    return (
      '<article class="admin-player" data-player-index="' +
      pi +
      '">' +
      '<div class="admin-block__head"><h3 class="mt-0">' +
      esc(p.nick || "Jogador " + (pi + 1)) +
      '</h3><button type="button" class="admin-remove" data-remove-player="' +
      pi +
      '">Remover jogador</button></div>' +
      '<div class="admin-grid-2">' +
      field("Nick", "pl-nick-" + pi, p.nick) +
      field("Função", "pl-role-" + pi, p.role) +
      "</div>" +
      '<details class="admin-details"><summary>Ranks CS2 (Premier / Wingman / Competitive)</summary>' +
      (function () {
        var r = d.ranks || { premier: [], wingman: {}, competitive: [] };
        var prem = r.premier || [];
        var ph = "";
        for (var si = 0; si < 4; si++) {
          var pr = prem[si] || { season: "S" + (4 - si), date: "", rating: 0, best: 0, wins: 0 };
          ph +=
            '<div class="admin-grid-3">' +
            "<strong>" +
            esc(pr.season || "S" + (4 - si)) +
            "</strong>" +
            field("Data", "rk-date-" + pi + "-" + si, pr.date) +
            field("Rating", "rk-rat-" + pi + "-" + si, pr.rating, "number", 'min="0"') +
            field("Best", "rk-best-" + pi + "-" + si, pr.best, "number", 'min="0"') +
            field("Wins", "rk-win-" + pi + "-" + si, pr.wins, "number", 'min="0"') +
            field("Season", "rk-ses-" + pi + "-" + si, pr.season || "S" + (4 - si)) +
            "</div>";
        }
        var wing = r.wingman || {};
        ph +=
          '<div class="admin-grid-2">' +
          field("Wingman rank", "rk-wing-lbl-" + pi, wing.rankLabel) +
          field("Wingman wins", "rk-wing-w-" + pi, wing.wins, "number", 'min="0"') +
          "</motion>";
        ph = ph.replace(/<\/?motion[^>]*>/g, "");
        return ph;
      })() +
      '<p class="admin-intro">Competitive por mapa: use a secção Mapas ou importe JSON.</p></details>' +
      '<details class="admin-details" open><summary>Anéis (K/D e HLTV)</summary>' +
      '<div class="admin-grid-2">' +
      field("K/D", "pl-kd-" + pi, d.kd, "number", 'min="0" step="0.01"') +
      field("HLTV Rating", "pl-hltv-" + pi, d.hltvRating, "number", 'min="0" step="0.01"') +
      "</div></details>" +
      '<details class="admin-details"><summary>Clutch success</summary>' +
      field("1vX geral %", "pl-cl-overall-" + pi, d.clutch.overall, "number", 'min="0" max="100"') +
      clutchHtml +
      "</details>" +
      '<details class="admin-details"><summary>Partidas recentes (faixa MATCHES)</summary>' +
      '<div id="rm-list-' +
      pi +
      '">' +
      (rmHtml || '<p class="stats-empty">Nenhuma.</p>') +
      "</div>" +
      '<button type="button" class="btn btn--ghost btn--compact" data-rm-add="' +
      pi +
      '">+ Partida</button></details>' +
      '<details class="admin-details" open><summary>Win rate, HS%, ADR</summary>' +
      '<div class="admin-grid-3">' +
      field("Win rate %", "pl-wr-p-" + pi, d.winRate.percent, "number", 'min="0" max="100"') +
      field("Played", "pl-wr-played-" + pi, d.winRate.played, "number", 'min="0"') +
      field("Won", "pl-wr-won-" + pi, d.winRate.won, "number", 'min="0"') +
      field("Lost", "pl-wr-lost-" + pi, d.winRate.lost, "number", 'min="0"') +
      field("Tied", "pl-wr-tied-" + pi, d.winRate.tied, "number", 'min="0"') +
      field("HS %", "pl-hs-" + pi, d.combat.hsPercent, "number", 'min="0" max="100"') +
      field("Kills", "pl-kills-" + pi, d.combat.kills, "number", 'min="0"') +
      field("Deaths", "pl-deaths-" + pi, d.combat.deaths, "number", 'min="0"') +
      field("Assists", "pl-assists-" + pi, d.combat.assists, "number", 'min="0"') +
      field("Headshots", "pl-hs-k-" + pi, d.combat.headshots, "number", 'min="0"') +
      field("ADR", "pl-adr-" + pi, d.combat.adr, "number", 'min="0" step="0.1"') +
      field("Damage", "pl-dmg-" + pi, d.combat.damage, "number", 'min="0"') +
      field("Rounds", "pl-rounds-" + pi, d.combat.rounds, "number", 'min="0"') +
      "</div></details>" +
      '<details class="admin-details"><summary>Entry success</summary>' +
      field("Per round %", "pl-en-pr-" + pi, d.entry.perRound, "number", 'min="0" max="100"') +
      "<p><strong>Combined</strong></p>" +
      '<div class="admin-grid-2">' +
      field("Success %", "pl-en-cs-" + pi, d.entry.combined.success, "number", 'min="0" max="100"') +
      field("Attempts %", "pl-en-ca-" + pi, d.entry.combined.attempts, "number", 'min="0" max="100"') +
      "</div><p><strong>T</strong></p>" +
      '<div class="admin-grid-2">' +
      field("Success %", "pl-en-ts-" + pi, d.entry.t.success, "number", 'min="0" max="100"') +
      field("Attempts %", "pl-en-ta-" + pi, d.entry.t.attempts, "number", 'min="0" max="100"') +
      "</div><p><strong>CT</strong></p>" +
      '<div class="admin-grid-2">' +
      field("Success %", "pl-en-cts-" + pi, d.entry.ct.success, "number", 'min="0" max="100"') +
      field("Attempts %", "pl-en-cta-" + pi, d.entry.ct.attempts, "number", 'min="0" max="100"') +
      "</div></details>" +
      '<details class="admin-details"><summary>Mapas</summary>' +
      "<h4>Most played</h4><div id=\"mp-list-" +
      pi +
      '">' +
      (mpHtml || '<p class="stats-empty">Nenhum.</p>') +
      '</div><button type="button" class="btn btn--ghost btn--compact" data-mp-add="' +
      pi +
      '">+ Mapa</button>' +
      "<h4>Most success</h4><div id=\"ms-list-" +
      pi +
      '">' +
      (msHtml || '<p class="stats-empty">Nenhum.</p>') +
      '</div><button type="button" class="btn btn--ghost btn--compact" data-ms-add="' +
      pi +
      '">+ Mapa</button></details>' +
      '<details class="admin-details"><summary>Armas</summary>' +
      "<h4>Most kills</h4><div id=\"wk-list-" +
      pi +
      '">' +
      (wkHtml || '<p class="stats-empty">Nenhuma.</p>') +
      '</div><button type="button" class="btn btn--ghost btn--compact" data-wk-add="' +
      pi +
      '">+ Arma</button>' +
      "<h4>HS%</h4><div id=\"wh-list-" +
      pi +
      '">' +
      (whHtml || '<p class="stats-empty">Nenhuma.</p>') +
      '</div><button type="button" class="btn btn--ghost btn--compact" data-wh-add="' +
      pi +
      '">+ Arma</button></details>' +
      '<details class="admin-details" open><summary>Vídeos Allstar</summary>' +
      '<div class="admin-highlights">' +
      (hlHtml || '<p class="stats-empty">Sem vídeos.</p>') +
      '</div><button type="button" class="btn btn--ghost btn--compact" data-add-highlight="' +
      pi +
      '">+ Vídeo</button></details>' +
      "</article>"
    ).replace(/<\/?motion[^>]*>/g, "");
  }

  function num(id, fallback) {
    var el = document.getElementById(id);
    if (!el) return fallback != null ? fallback : 0;
    var n = parseFloat(el.value);
    return Number.isNaN(n) ? (fallback != null ? fallback : 0) : n;
  }

  function collectPlayer(pi, p) {
    if (!p.dashboard && typeof StatsSchema !== "undefined") {
      p.dashboard = StatsSchema.defaultDashboard();
    }
    var clutchSituations = (p.dashboard && p.dashboard.clutch && p.dashboard.clutch.situations) || [];
    var situations = clutchSituations.map(function (_, si) {
      return {
        id: StatsSchema.CLUTCH_IDS[si],
        success: num("cl-suc-" + pi + "-" + si, 0),
        wins: num("cl-w-" + pi + "-" + si, 0),
        losses: num("cl-l-" + pi + "-" + si, 0),
      };
    });

    var recentMatches = [];
    (p.dashboard.recentMatches || []).forEach(function (_, i) {
      var mapEl = document.getElementById("rm-map-" + pi + "-" + i);
      if (!mapEl) return;
      recentMatches.push({
        map: mapEl.value.trim(),
        scoreA: num("rm-sa-" + pi + "-" + i, 0),
        scoreB: num("rm-sb-" + pi + "-" + i, 0),
        result: document.getElementById("rm-res-" + pi + "-" + i).value,
      });
    });

    var mostPlayed = [];
    (p.dashboard.maps.mostPlayed || []).forEach(function (_, i) {
      var nameEl = document.getElementById("mp-name-" + pi + "-" + i);
      if (!nameEl) return;
      mostPlayed.push({
        name: nameEl.value.trim(),
        count: num("mp-count-" + pi + "-" + i, 0),
      });
    });

    var mostSuccess = [];
    (p.dashboard.maps.mostSuccess || []).forEach(function (_, i) {
      var nameEl = document.getElementById("ms-name-" + pi + "-" + i);
      if (!nameEl) return;
      mostSuccess.push({
        name: nameEl.value.trim(),
        winPercent: num("ms-win-" + pi + "-" + i, 0),
      });
    });

    var mostKills = [];
    (p.dashboard.weapons.mostKills || []).forEach(function (_, i) {
      var nameEl = document.getElementById("wk-name-" + pi + "-" + i);
      if (!nameEl) return;
      mostKills.push({
        name: nameEl.value.trim(),
        value: num("wk-val-" + pi + "-" + i, 0),
        bar: num("wk-bar-" + pi + "-" + i, 100),
      });
    });

    var headshotRate = [];
    (p.dashboard.weapons.headshotRate || []).forEach(function (_, i) {
      var nameEl = document.getElementById("wh-name-" + pi + "-" + i);
      if (!nameEl) return;
      headshotRate.push({
        name: nameEl.value.trim(),
        value: num("wh-val-" + pi + "-" + i, 0),
        bar: num("wh-bar-" + pi + "-" + i, 100),
      });
    });

    var highlights = [];
    (p.highlights || []).forEach(function (_, hi) {
      var urlEl = document.getElementById("hl-url-" + pi + "-" + hi);
      if (!urlEl || !urlEl.value.trim()) return;
      highlights.push({
        title: document.getElementById("hl-title-" + pi + "-" + hi).value.trim(),
        map: document.getElementById("hl-map-" + pi + "-" + hi).value.trim(),
        date: document.getElementById("hl-date-" + pi + "-" + hi).value,
        url: urlEl.value.trim(),
      });
    });

    var premier = [];
    for (var si = 0; si < 4; si++) {
      var sesEl = document.getElementById("rk-ses-" + pi + "-" + si);
      if (!sesEl) continue;
      premier.push({
        season: sesEl.value.trim() || "S" + (4 - si),
        date: document.getElementById("rk-date-" + pi + "-" + si).value.trim(),
        rating: num("rk-rat-" + pi + "-" + si, 0),
        best: num("rk-best-" + pi + "-" + si, 0),
        wins: num("rk-win-" + pi + "-" + si, 0),
      });
    }

    return {
      nick: document.getElementById("pl-nick-" + pi).value.trim(),
      role: document.getElementById("pl-role-" + pi).value.trim(),
      dashboard: {
        kd: num("pl-kd-" + pi, 1),
        hltvRating: num("pl-hltv-" + pi, 1),
        clutch: {
          overall: num("pl-cl-overall-" + pi, 0),
          situations: situations,
        },
        recentMatches: recentMatches,
        winRate: {
          percent: num("pl-wr-p-" + pi, 0),
          played: num("pl-wr-played-" + pi, 0),
          won: num("pl-wr-won-" + pi, 0),
          lost: num("pl-wr-lost-" + pi, 0),
          tied: num("pl-wr-tied-" + pi, 0),
        },
        combat: {
          hsPercent: num("pl-hs-" + pi, 0),
          kills: num("pl-kills-" + pi, 0),
          deaths: num("pl-deaths-" + pi, 0),
          assists: num("pl-assists-" + pi, 0),
          headshots: num("pl-hs-k-" + pi, 0),
          adr: num("pl-adr-" + pi, 0),
          damage: num("pl-dmg-" + pi, 0),
          rounds: num("pl-rounds-" + pi, 0),
        },
        entry: {
          perRound: num("pl-en-pr-" + pi, 0),
          combined: {
            success: num("pl-en-cs-" + pi, 0),
            attempts: num("pl-en-ca-" + pi, 0),
          },
          t: {
            success: num("pl-en-ts-" + pi, 0),
            attempts: num("pl-en-ta-" + pi, 0),
          },
          ct: {
            success: num("pl-en-cts-" + pi, 0),
            attempts: num("pl-en-cta-" + pi, 0),
          },
        },
        maps: { mostPlayed: mostPlayed, mostSuccess: mostSuccess },
        weapons: { mostKills: mostKills, headshotRate: headshotRate },
        ranks: {
          premier: premier,
          wingman: {
            rankLabel: document.getElementById("rk-wing-lbl-" + pi)
              ? document.getElementById("rk-wing-lbl-" + pi).value.trim()
              : "",
            wins: num("rk-wing-w-" + pi, 0),
          },
          competitive:
            p.dashboard && p.dashboard.ranks && p.dashboard.ranks.competitive
              ? p.dashboard.ranks.competitive.slice()
              : [],
        },
      },
      highlights: highlights,
    };
  }

  global.AdminPlayerFields = {
    render: renderPlayer,
    collect: collectPlayer,
  };
})(typeof window !== "undefined" ? window : globalThis);
