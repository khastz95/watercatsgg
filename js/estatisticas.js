(function () {
  "use strict";

  var state = {
    players: [],
    season: "",
    updated: "",
    activeIndex: 0,
  };

  var MAP_COLORS = {
    mirage: "#4a9eff",
    inferno: "#e85d04",
    ancient: "#2dd4bf",
    nuke: "#fbbf24",
    anubis: "#a78bfa",
    dust2: "#d4a574",
    overpass: "#6ee7b7",
    vertigo: "#94a3b8",
    cache: "#64748b",
    train: "#c4a574",
  };

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function mapKey(name) {
    if (!name) return "";
    return String(name)
      .replace(/^de_/i, "")
      .toLowerCase()
      .trim();
  }

  function mapColor(name) {
    return MAP_COLORS[mapKey(name)] || "#5b8def";
  }

  function mapLabel(name) {
    var k = mapKey(name);
    if (!k) return "—";
    return k.charAt(0).toUpperCase() + k.slice(1);
  }

  function initials(nick) {
    var clean = String(nick || "?").replace(/[^\w\u00C0-\u024f]/g, "");
    if (clean.length >= 2) return clean.slice(0, 2).toUpperCase();
    return String(nick || "?").slice(0, 2).toUpperCase();
  }

  function resolveVideoUrl(input) {
    if (!input) return null;
    var raw = String(input).trim();
    if (!raw) return null;
    if (/\.mp4(\?|$)/i.test(raw) || raw.indexOf("media2.allstar.gg") !== -1) return raw;
    if (/^https?:\/\//i.test(raw) && /\.(webm|mov)(\?|$)/i.test(raw)) return raw;
    return null;
  }

  function normalizeData(data) {
    if (typeof StatsSchema !== "undefined") {
      data = StatsSchema.normalizeStatsData(data);
    }
    (data.players || []).forEach(function (p, i) {
      if (!p.id) p.id = "p-" + i;
      p.highlights = (p.highlights || []).filter(function (h) {
        return resolveVideoUrl(h.url);
      });
    });
    return data;
  }

  function ringDual(greenPct, valueText) {
    var r = 38;
    var c = 2 * Math.PI * r;
    var g = Math.min(1, Math.max(0, greenPct)) * c;
    var gap = c - g;
    return (
      '<div class="lf-big-ring">' +
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle class="lf-big-ring__track" cx="50" cy="50" r="' +
      r +
      '" />' +
      '<circle class="lf-big-ring__loss" cx="50" cy="50" r="' +
      r +
      '" stroke-dasharray="' +
      gap +
      " " +
      g +
      '" transform="rotate(-90 50 50)" />' +
      '<circle class="lf-big-ring__win" cx="50" cy="50" r="' +
      r +
      '" stroke-dasharray="' +
      g +
      " " +
      gap +
      '" transform="rotate(-90 50 50)" />' +
      "</svg>" +
      '<span class="lf-big-ring__val">' +
      escapeHtml(valueText) +
      "</span></div>"
    );
  }

  function miniPie(pct, variant) {
    var p = Math.min(100, Math.max(0, Number(pct) || 0));
    var r = 14;
    var c = 2 * Math.PI * r;
    var dash = (p / 100) * c;
    return (
      '<svg class="lf-mini-pie' +
      (variant ? " lf-mini-pie--" + variant : "") +
      '" viewBox="0 0 36 36" aria-hidden="true">' +
      '<circle class="lf-mini-pie__track" cx="18" cy="18" r="' +
      r +
      '" />' +
      '<circle class="lf-mini-pie__fill" cx="18" cy="18" r="' +
      r +
      '" stroke-dasharray="' +
      dash +
      " " +
      (c - dash) +
      '" transform="rotate(-90 18 18)" />' +
      "</svg>"
    );
  }

  function progressBar(pct) {
    var p = Math.min(100, Math.max(0, Number(pct) || 0));
    return (
      '<span class="lf-bar"><span class="lf-bar__fill" style="width:' + p + '%"></span></span>'
    );
  }

  function renderPlayerList() {
    var el = document.getElementById("jogadores-player-list");
    if (!el) return;

    el.innerHTML = state.players
      .map(function (p, i) {
        var active = i === state.activeIndex ? " is-active" : "";
        return (
          '<button type="button" class="lf-sidebar__item' +
          active +
          '" role="tab" aria-selected="' +
          (i === state.activeIndex ? "true" : "false") +
          '" data-index="' +
          i +
          '">' +
          '<span class="lf-sidebar__avatar" aria-hidden="true">' +
          escapeHtml(initials(p.nick)) +
          "</span>" +
          '<span class="lf-sidebar__name">' +
          escapeHtml(p.nick) +
          "</span></button>"
        );
      })
      .join("");

    el.querySelectorAll(".lf-sidebar__item").forEach(function (btn) {
      btn.addEventListener("click", function () {
        selectPlayer(parseInt(btn.getAttribute("data-index"), 10));
      });
    });
  }

  function renderRanksPanel(ranks) {
    if (!ranks) return "";
    var html = '<aside class="lf-ranks-panel" aria-label="Ranks CS2">';
    html += '<h2 class="lf-ranks-panel__title">Rankings</h2>';

    if (ranks.premier && ranks.premier.length) {
      html += '<section class="lf-ranks-block"><h3>Premier</h3><ul class="lf-premier-list">';
      ranks.premier.forEach(function (s) {
        html +=
          "<li><span class=\"lf-premier-list__season\">" +
          escapeHtml(s.season || s.label) +
          "</span><span class=\"lf-premier-list__rating\">" +
          escapeHtml(s.rating != null ? Number(s.rating).toLocaleString("pt-BR") : "—") +
          "</span>";
        if (s.best != null) {
          html +=
            '<span class="lf-premier-list__meta">Best ' +
            escapeHtml(Number(s.best).toLocaleString("pt-BR")) +
            "</span>";
        }
        if (s.wins != null) {
          html += '<span class="lf-premier-list__meta">' + escapeHtml(s.wins) + " wins</span>";
        }
        if (s.date) {
          html += '<span class="lf-premier-list__date">' + escapeHtml(s.date) + "</span>";
        }
        html += "</li>";
      });
      html += "</ul></section>";
    }

    if (ranks.wingman && (ranks.wingman.rankLabel || ranks.wingman.wins)) {
      html +=
        '<section class="lf-ranks-block"><h3>Wingman</h3><p class="lf-rank-line">' +
        escapeHtml(ranks.wingman.rankLabel || "—") +
        (ranks.wingman.wins != null ? " · " + escapeHtml(ranks.wingman.wins) + " wins" : "") +
        "</p></section>";
    }

    if (ranks.competitive && ranks.competitive.length) {
      html += '<section class="lf-ranks-block"><h3>Competitive</h3><ul class="lf-comp-list">';
      ranks.competitive.forEach(function (c) {
        html +=
          "<li><span class=\"lf-comp-list__map\" style=\"background:" +
          escapeHtml(mapColor(c.map)) +
          '"></span><span>' +
          escapeHtml(mapLabel(c.map)) +
          "</span><strong>" +
          escapeHtml(c.rankLabel || "—") +
          "</strong><span>" +
          escapeHtml(c.wins != null ? c.wins + " W" : "") +
          "</span></li>";
      });
      html += "</ul></section>";
    }

    html += "</aside>";
    return html;
  }

  function renderDashboard(p) {
    var d = p.dashboard;
    var hasRanks =
      d.ranks &&
      ((d.ranks.premier && d.ranks.premier.length) ||
        (d.ranks.competitive && d.ranks.competitive.length) ||
        (d.ranks.wingman && (d.ranks.wingman.rankLabel || d.ranks.wingman.wins)));

    var html =
      '<div class="lf-dash-wrap' + (hasRanks ? " lf-dash-wrap--with-ranks" : "") + '">';
    if (hasRanks) html += renderRanksPanel(d.ranks);
    html += '<div class="lf-dash">';

    html +=
      '<header class="lf-dash__head">' +
      '<span class="lf-dash__avatar">' +
      escapeHtml(initials(p.nick)) +
      "</span>" +
      "<div><h1>" +
      escapeHtml(p.nick) +
      "</h1>" +
      (p.role ? "<p>" + escapeHtml(p.role) + "</p>" : "") +
      "</div></header>";

    var kd = d.kd != null ? Number(d.kd).toFixed(2) : "—";
    var kdFill = d.combat.kills + d.combat.deaths ? d.combat.kills / (d.combat.kills + d.combat.deaths) : 0.5;
    var hltv = d.hltvRating != null ? Number(d.hltvRating).toFixed(2) : "—";
    var hltvFill = Math.min(1, Math.max(0, Number(d.hltvRating) / 2));

    html += '<div class="lf-dash__row lf-dash__row--top">';
    html +=
      '<article class="lf-card lf-card--ring"><h2>K/D</h2>' +
      ringDual(kdFill, kd) +
      "</article>";
    html +=
      '<article class="lf-card lf-card--ring"><h2>HLTV RATING</h2>' +
      ringDual(hltvFill, hltv) +
      "</article>";

    html += '<article class="lf-card lf-card--clutch"><h2>CLUTCH SUCCESS</h2>';
    html +=
      '<p class="lf-clutch__overall"><span>1vX</span> <strong>' +
      escapeHtml(d.clutch.overall) +
      '%</strong></p>';
    html += '<div class="lf-clutch__grid">';
    (d.clutch.situations || []).forEach(function (s) {
      html +=
        '<div class="lf-clutch__cell">' +
        "<span>" +
        escapeHtml(s.id) +
        "</span>" +
        miniPie(s.success) +
        "<strong>" +
        escapeHtml(s.success) +
        '%</strong><span class="lf-clutch__wl">W:' +
        escapeHtml(s.wins) +
        " / L:" +
        escapeHtml(s.losses) +
        "</span></div>";
    });
    html += "</div></article>";

    html += '<article class="lf-card lf-card--matches"><h2>MATCHES</h2><div class="lf-matches-scroll"><div class="lf-matches-strip">';
    var recent = d.recentMatches || [];
    if (!recent.length) {
      html += '<p class="lf-empty">Sem partidas. Edite no admin.</p>';
    } else {
      recent.forEach(function (m) {
        var res = m.result === "win" ? "win" : m.result === "loss" ? "loss" : "tie";
        var score =
          m.scoreA != null && m.scoreB != null ? m.scoreA + ":" + m.scoreB : "—";
        html +=
          '<div class="lf-match-chip lf-match-chip--' +
          res +
          '">' +
          '<span class="lf-match-chip__dot" aria-hidden="true"></span>' +
          '<span class="lf-match-chip__map" style="background:' +
          escapeHtml(mapColor(m.map)) +
          '"></span>' +
          "<span>" +
          escapeHtml(mapLabel(m.map)) +
          "</span>" +
          '<span class="lf-match-chip__score">' +
          escapeHtml(score) +
          "</span></div>";
      });
    }
    html += "</div></div></article></div>";

    var wr = d.winRate;
    var cb = d.combat;
    var en = d.entry;

    html += '<div class="lf-dash__row lf-dash__row--bottom">';

    html += '<div class="lf-dash__metrics">';

    html +=
      '<article class="lf-card lf-card--stat">' +
      "<h2>WIN RATE</h2>" +
      '<p class="lf-stat-big">' +
      escapeHtml(wr.percent) +
      '%</p><ul class="lf-stat-list">' +
      "<li><span>Played</span><strong>" +
      escapeHtml(wr.played) +
      "</strong></li>" +
      "<li><span>Won</span><strong>" +
      escapeHtml(wr.won) +
      "</strong></li>" +
      "<li><span>Lost</span><strong>" +
      escapeHtml(wr.lost) +
      "</strong></li>" +
      "<li><span>Tied</span><strong>" +
      escapeHtml(wr.tied) +
      "</strong></li></ul></article>";

    html +=
      '<article class="lf-card lf-card--stat">' +
      "<h2>HS%</h2>" +
      '<p class="lf-stat-big">' +
      escapeHtml(cb.hsPercent) +
      '%</p><ul class="lf-stat-list">' +
      "<li><span>Kills</span><strong>" +
      escapeHtml(cb.kills) +
      "</strong></li>" +
      "<li><span>Deaths</span><strong>" +
      escapeHtml(cb.deaths) +
      "</strong></li>" +
      "<li><span>Assists</span><strong>" +
      escapeHtml(cb.assists) +
      "</strong></li>" +
      "<li><span>Headshots</span><strong>" +
      escapeHtml(cb.headshots) +
      "</strong></li></ul></article>";

    html +=
      '<article class="lf-card lf-card--stat">' +
      "<h2>ADR</h2>" +
      '<p class="lf-stat-big">' +
      escapeHtml(cb.adr) +
      '</p><ul class="lf-stat-list">' +
      "<li><span>Damage</span><strong>" +
      escapeHtml(cb.damage) +
      "</strong></li>" +
      "<li><span>Rounds</span><strong>" +
      escapeHtml(cb.rounds) +
      "</strong></li></ul></article>";

    html += "</div>";

    html += '<article class="lf-card lf-card--entry"><h2>ENTRY SUCCESS</h2>';
    html +=
      '<p class="lf-entry__top">per Round <strong>' +
      escapeHtml(en.perRound) +
      '%</strong></p>';
    html += '<div class="lf-entry-scroll"><table class="lf-entry-table"><thead><tr><th></th><th>Combined</th><th>T</th><th>CT</th></tr></thead><tbody>';
    html +=
      "<tr><td>Entry Success</td>" +
      "<td>" +
      miniPie(en.combined.success, "entry") +
      " " +
      escapeHtml(en.combined.success) +
      "%</td>" +
      "<td>" +
      miniPie(en.t.success, "entry") +
      " " +
      escapeHtml(en.t.success) +
      "%</td>" +
      "<td>" +
      miniPie(en.ct.success, "entry") +
      " " +
      escapeHtml(en.ct.success) +
      "%</td></tr>";
    html +=
      "<tr><td>Entry Attempts</td>" +
      "<td>" +
      miniPie(en.combined.attempts, "attempt") +
      " " +
      escapeHtml(en.combined.attempts) +
      "%</td>" +
      "<td>" +
      miniPie(en.t.attempts, "attempt") +
      " " +
      escapeHtml(en.t.attempts) +
      "%</td>" +
      "<td>" +
      miniPie(en.ct.attempts, "attempt") +
      " " +
      escapeHtml(en.ct.attempts) +
      "%</td></tr>";
    html += "</tbody></table></div></article>";

    html += '<article class="lf-card lf-card--side"><div class="lf-side-grid">';
    html += '<section class="lf-side-block"><h3>Most Played</h3><ul class="lf-map-list">';
    (d.maps.mostPlayed || []).forEach(function (m) {
      html +=
        "<li><span class=\"lf-map-list__icon\" style=\"background:" +
        escapeHtml(mapColor(m.name)) +
        '"></span><span>' +
        escapeHtml(mapLabel(m.name)) +
        '</span><strong>' +
        escapeHtml(m.count) +
        "</strong></li>";
    });
    if (!(d.maps.mostPlayed || []).length) html += '<li class="lf-empty">—</li>';
    html += "</ul></section>";

    html += '<section class="lf-side-block"><h3>Most Success</h3><ul class="lf-map-list lf-map-list--bars">';
    (d.maps.mostSuccess || []).forEach(function (m) {
      html +=
        "<li><span class=\"lf-map-list__icon\" style=\"background:" +
        escapeHtml(mapColor(m.name)) +
        '"></span><span>' +
        escapeHtml(mapLabel(m.name)) +
        "</span>" +
        progressBar(m.winPercent) +
        "<strong>" +
        escapeHtml(m.winPercent) +
        "%</strong></li>";
    });
    if (!(d.maps.mostSuccess || []).length) html += '<li class="lf-empty">—</li>';
    html += "</ul></section>";

    html += '<section class="lf-side-block"><h3>Most Kills</h3><ul class="lf-weapon-list">';
    (d.weapons.mostKills || []).forEach(function (w) {
      html +=
        "<li><span>" +
        escapeHtml(w.name) +
        "</span>" +
        progressBar(w.bar != null ? w.bar : 100) +
        "<strong>" +
        escapeHtml(w.value) +
        "</strong></li>";
    });
    if (!(d.weapons.mostKills || []).length) html += '<li class="lf-empty">—</li>';
    html += "</ul></section>";

    html += '<section class="lf-side-block"><h3>HS%</h3><ul class="lf-weapon-list">';
    (d.weapons.headshotRate || []).forEach(function (w) {
      html +=
        "<li><span>" +
        escapeHtml(w.name) +
        "</span>" +
        progressBar(w.bar != null ? w.bar : w.value) +
        "<strong>" +
        escapeHtml(w.value) +
        "%</strong></li>";
    });
    if (!(d.weapons.headshotRate || []).length) html += '<li class="lf-empty">—</li>';
    html += "</ul></section></div></article>";

    html += "</div>";

    var highlights = p.highlights || [];
    if (highlights.length) {
      html += '<section class="lf-panel lf-panel--clips"><h2>Highlights (Allstar)</h2><div class="lf-clips">';
      highlights.forEach(function (h, i) {
        var src = resolveVideoUrl(h.url);
        if (!src) return;
        html +=
          '<figure class="lf-clip"><figcaption>' +
          escapeHtml(h.title || "Clip " + (i + 1)) +
          (h.map ? " · " + escapeHtml(h.map) : "") +
          "</figcaption>" +
          '<video controls playsinline preload="metadata" src="' +
          escapeHtml(src) +
          '"></video></figure>';
      });
      html += "</div></section>";
    }

    html += "</div></div>";

    return html;
  }

  function selectPlayer(index) {
    if (index < 0 || index >= state.players.length) return;
    state.activeIndex = index;
    renderPlayerList();
    var el = document.getElementById("jogadores-profile");
    if (!el) return;
    el.innerHTML = renderDashboard(state.players[index]);
  }

  function renderMeta() {
    var el = document.getElementById("jogadores-meta");
    if (!el) return;
    var parts = [];
    if (state.season) parts.push(state.season);
    if (state.updated) parts.push("atualizado " + state.updated);
    el.textContent = parts.join(" · ") || "Eternal Pratas";
  }

  function init(raw) {
    var data = normalizeData(raw);
    state.players = data.players || [];
    state.season = data.season || "";
    state.updated = data.updated || "";
    state.activeIndex = 0;
    renderMeta();
    renderPlayerList();
    if (state.players.length) selectPlayer(0);
    else {
      var el = document.getElementById("jogadores-profile");
      if (el) el.innerHTML = '<p class="lf-empty">Nenhum jogador. Use o admin para adicionar.</p>';
    }
  }

  function load() {
    if (!document.querySelector("[data-jogadores-page]")) return;

    var loader =
      typeof StatsData !== "undefined"
        ? StatsData.load()
        : fetch("/data/estatisticas.json", { cache: "no-store" }).then(function (res) {
            if (!res.ok) throw new Error("fail");
            return res.json();
          });

    loader
      .then(init)
      .catch(function () {
        var main = document.querySelector("[data-jogadores-page]");
        if (main) {
          main.insertAdjacentHTML(
            "afterbegin",
            '<p class="form-msg form-msg--error is-visible" role="alert">Não foi possível carregar os dados.</p>'
          );
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
