(function () {
  "use strict";

  if (!document.querySelector("[data-home-page]")) return;

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(nick) {
    var parts = String(nick || "?")
      .trim()
      .split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (nick || "?").slice(0, 2).toUpperCase();
  }

  function mapLabel(name) {
    if (!name) return "—";
    return String(name)
      .replace(/^de_/i, "")
      .replace(/_/g, " ")
      .replace(/\b\w/g, function (c) {
        return c.toUpperCase();
      });
  }

  function mapColor(name) {
    var colors = {
      de_mirage: "#5a9e4a",
      de_dust2: "#c4a35a",
      de_inferno: "#c45a3a",
      de_nuke: "#4a7a9e",
      de_ancient: "#6a8a5a",
      de_anubis: "#9a7a4a",
      de_overpass: "#5a6a8a",
      de_vertigo: "#7a5a8a",
    };
    return colors[name] || "#5b8def";
  }

  function num(v, digits) {
    var n = Number(v);
    if (Number.isNaN(n)) return "—";
    return digits != null ? n.toFixed(digits) : String(Math.round(n));
  }

  function collectHighlights(players) {
    var list = [];
    (players || []).forEach(function (p) {
      (p.highlights || []).forEach(function (h) {
        if (h && h.url) list.push({ player: p.nick, highlight: h });
      });
    });
    return list;
  }

  function collectRecentMatches(players, limit) {
    var all = [];
    (players || []).forEach(function (p) {
      (p.dashboard && p.dashboard.recentMatches || []).forEach(function (m) {
        all.push({ nick: p.nick, match: m });
      });
    });
    return all.slice(0, limit || 14);
  }

  function topPlayers(players, n) {
    return (players || [])
      .slice()
      .sort(function (a, b) {
        var ra = a.dashboard && a.dashboard.hltvRating != null ? Number(a.dashboard.hltvRating) : 0;
        var rb = b.dashboard && b.dashboard.hltvRating != null ? Number(b.dashboard.hltvRating) : 0;
        return rb - ra;
      })
      .slice(0, n || 6);
  }

  function renderPulse(data) {
    var el = document.getElementById("home-pulse");
    if (!el) return;
    var players = data.players || [];
    var clips = collectHighlights(players).length;
    var recent = collectRecentMatches(players, 99).length;
    var top = topPlayers(players, 1)[0];
    var topRating = top && top.dashboard ? top.dashboard.hltvRating : null;

    el.innerHTML =
      '<article class="home-pulse__card reveal is-visible">' +
      '<span class="home-pulse__value">' +
      esc(players.length) +
      "</span>" +
      '<span class="home-pulse__label">Jogadores</span></article>' +
      '<article class="home-pulse__card reveal is-visible">' +
      '<span class="home-pulse__value">' +
      esc(data.season || "—") +
      "</span>" +
      '<span class="home-pulse__label">Temporada</span></article>' +
      '<article class="home-pulse__card reveal is-visible">' +
      '<span class="home-pulse__value">' +
      esc(recent) +
      "</span>" +
      '<span class="home-pulse__label">Partidas no radar</span></article>' +
      '<article class="home-pulse__card reveal is-visible">' +
      '<span class="home-pulse__value">' +
      esc(clips) +
      "</span>" +
      '<span class="home-pulse__label">Clipes</span></article>' +
      (topRating != null
        ? '<article class="home-pulse__card home-pulse__card--accent reveal is-visible">' +
          '<span class="home-pulse__value">' +
          esc(num(topRating, 2)) +
          "</span>" +
          '<span class="home-pulse__label">HLTV destaque</span>' +
          '<span class="home-pulse__sublabel">' +
          esc(top.nick) +
          "</span></article>"
        : "");
  }

  function renderTicker(players) {
    var el = document.getElementById("home-ticker");
    if (!el || !players.length) return;
    var items = players
      .map(function (p) {
        return (
          '<span class="home-ticker__item">' +
          '<span class="home-ticker__dot" aria-hidden="true"></span>' +
          esc(p.nick) +
          (p.role ? "<em>" + esc(p.role) + "</em>" : "") +
          "</span>"
        );
      })
      .join("");
    el.innerHTML =
      '<div class="home-ticker__track" aria-hidden="true">' + items + items + "</div>";
  }

  function renderSpotlight(players) {
    var el = document.getElementById("home-spotlight");
    if (!el) return;
    var top = topPlayers(players, 8);
    if (!top.length) {
      el.innerHTML = '<p class="home-empty">Em breve mais perfis na turma.</p>';
      return;
    }
    el.innerHTML = top
      .map(function (p, i) {
        var d = p.dashboard || {};
        var kd = d.kd != null ? num(d.kd, 2) : "—";
        var hltv = d.hltvRating != null ? num(d.hltvRating, 2) : "—";
        var wr = d.winRate && d.winRate.percent != null ? d.winRate.percent + "%" : "—";
        return (
          '<a class="home-player-card reveal" href="/jogadores.html" style="--home-delay:' +
          i * 0.06 +
          's">' +
          '<span class="home-player-card__avatar" aria-hidden="true" style="--accent:' +
          esc(p.color || "#3ec7ff") +
          '">' +
          (p.avatar
            ? '<img src="' + esc(p.avatar) + '" alt="">'
            : esc(initials(p.nick))) +
          "</span>" +
          '<span class="home-player-card__body">' +
          "<strong>" +
          esc(p.nick) +
          "</strong>" +
          (p.role ? '<span class="home-player-card__role">' + esc(p.role) + "</span>" : "") +
          '<span class="home-player-card__stats">' +
          "<span>K/D " +
          esc(kd) +
          "</span><span>HLTV " +
          esc(hltv) +
          "</span><span>WR " +
          esc(wr) +
          "</span></span></span></a>"
        );
      })
      .join("");
    if (window.refreshReveals) window.refreshReveals(el);
  }

  function renderClips(highlights) {
    var el = document.getElementById("home-clips");
    if (!el) return;
    if (!highlights.length) {
      el.innerHTML =
        '<div class="home-clips__empty card card--glow reveal">' +
        "<p>Os melhores momentos da call aparecem aqui quando alguém subir um clipe.</p>" +
        '<a class="btn btn--ghost btn--compact" href="/jogadores.html">Ver jogadores</a></div>';
      return;
    }
    el.innerHTML = highlights
      .map(function (item, i) {
        var h = item.highlight;
        var featured = i === 0 ? " home-clip-card--featured" : "";
        return (
          '<figure class="home-clip-card reveal' +
          featured +
          '" style="--home-delay:' +
          i * 0.08 +
          's">' +
          '<video controls playsinline preload="metadata" src="' +
          esc(h.url) +
          '"></video>' +
          "<figcaption>" +
          "<strong>" +
          esc(h.title || "Clipe") +
          "</strong>" +
          "<span>" +
          esc(item.player) +
          (h.map ? " · " + esc(h.map) : "") +
          "</span></figcaption></figure>"
        );
      })
      .join("");
    if (window.refreshReveals) window.refreshReveals(el);
  }

  function renderActivity(matches) {
    var el = document.getElementById("home-activity");
    if (!el) return;
    if (!matches.length) {
      el.innerHTML = '<p class="home-empty">Partidas recentes da turma em breve.</p>';
      return;
    }
    var chips = matches
      .map(function (item) {
        var m = item.match;
        var res = m.result === "win" ? "win" : m.result === "loss" ? "loss" : "tie";
        var score = m.scoreA != null && m.scoreB != null ? m.scoreA + ":" + m.scoreB : "—";
        return (
          '<div class="home-activity__chip home-activity__chip--' +
          res +
          '">' +
          '<span class="home-activity__map" style="background:' +
          esc(mapColor(m.map)) +
          '"></span>' +
          '<span class="home-activity__nick">' +
          esc(item.nick) +
          "</span>" +
          '<span class="home-activity__mapname">' +
          esc(mapLabel(m.map)) +
          "</span>" +
          '<span class="home-activity__score">' +
          esc(score) +
          "</span></div>"
        );
      })
      .join("");
    el.innerHTML = '<div class="home-activity__scroll">' + chips + chips + "</div>";
  }

  function renderSeasonBadge(data) {
    var el = document.getElementById("home-season-badge");
    if (!el) return;
    var parts = [];
    if (data.season) parts.push(data.season);
    if (data.updated) parts.push("atualizado " + data.updated);
    el.textContent = parts.join(" · ") || "Eternal Pratas";
  }

  function init(data) {
    var players = data.players || [];
    renderSeasonBadge(data);
    renderPulse(data);
    renderTicker(players);
    renderSpotlight(players);
    renderClips(collectHighlights(players));
    renderActivity(collectRecentMatches(players, 12));
  }

  function load() {
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
        var pulse = document.getElementById("home-pulse");
        if (pulse) {
          pulse.innerHTML =
            '<p class="home-empty">Não foi possível carregar o resumo da turma. Explore as páginas abaixo.</p>';
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
