(function () {
  "use strict";

  var state = { players: [], lastFocus: null };

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatDate(iso) {
    if (!iso) return "";
    var parts = iso.split("-");
    if (parts.length !== 3) return iso;
    return parts[2] + "/" + parts[1] + "/" + parts[0];
  }

  function playerId(p, index) {
    if (p.id) return String(p.id);
    return "p-" + index;
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

    if (/\.mp4(\?|$)/i.test(raw) || raw.indexOf("media2.allstar.gg") !== -1) {
      return raw;
    }

    if (/^https?:\/\//i.test(raw) && /\.(webm|mov)(\?|$)/i.test(raw)) {
      return raw;
    }

    return null;
  }

  function normalizeData(data) {
    var players = (data.players || []).map(function (p) {
      var copy = Object.assign({}, p);
      copy.highlights = (copy.highlights || []).slice();
      return copy;
    });

    if (data.highlights && data.highlights.length) {
      data.highlights.forEach(function (h) {
        var nick = h.player;
        var target = players.find(function (p) {
          return p.nick === nick;
        });
        if (target) {
          target.highlights.push({
            title: h.title,
            map: h.map,
            date: h.date,
            url: h.url,
          });
        }
      });
    }

    players.forEach(function (p, i) {
      if (!p.id) p.id = playerId(p, i);
      p.highlights = (p.highlights || []).filter(function (h) {
        return resolveVideoUrl(h.url);
      });
    });

    return data;
  }

  function kdRatio(p) {
    if (!p.deaths) return p.kills != null ? String(p.kills) : "—";
    return (p.kills / p.deaths).toFixed(2);
  }

  function winRate(summary) {
    var total = (summary.wins || 0) + (summary.losses || 0);
    if (!total) return "—";
    return Math.round((summary.wins / total) * 100) + "%";
  }

  function renderSummary(summary, meta) {
    var el = document.getElementById("stats-summary");
    if (!el || !summary) return;

    var season = meta && meta.season ? meta.season : "";
    var updated = meta && meta.updated ? formatDate(meta.updated) : "";

    var html =
      '<div class="stat-kpi-grid">' +
      '<article class="stat-kpi card reveal"><span class="stat-kpi__value">' +
      escapeHtml(summary.matches) +
      '</span><span class="stat-kpi__label">Partidas</span></article>' +
      '<article class="stat-kpi card reveal stat-kpi--win"><span class="stat-kpi__value">' +
      escapeHtml(summary.wins) +
      '</span><span class="stat-kpi__label">Vitórias</span></article>' +
      '<article class="stat-kpi card reveal stat-kpi--loss"><span class="stat-kpi__value">' +
      escapeHtml(summary.losses) +
      '</span><span class="stat-kpi__label">Derrotas</span></article>' +
      '<article class="stat-kpi card reveal"><span class="stat-kpi__value">' +
      escapeHtml(winRate(summary)) +
      '</span><span class="stat-kpi__label">Win rate</span></article>' +
      '<article class="stat-kpi card reveal stat-kpi--accent"><span class="stat-kpi__value">' +
      (summary.avgRating != null ? escapeHtml(Number(summary.avgRating).toFixed(2)) : "—") +
      '</span><span class="stat-kpi__label">Rating médio</span></article>' +
      '<article class="stat-kpi card reveal"><span class="stat-kpi__value">' +
      escapeHtml(summary.roundsPlayed != null ? summary.roundsPlayed : "—") +
      '</span><span class="stat-kpi__label">Rounds</span></article>' +
      "</div>";

    if (season || updated) {
      html +=
        '<p class="stats-meta-bar reveal">' +
        (season ? '<span class="map-pill map-pill--strong">' + escapeHtml(season) + "</span>" : "") +
        (updated ? '<span class="stats-meta-bar__date">Atualizado em ' + escapeHtml(updated) + "</span>" : "") +
        "</p>";
    }

    el.innerHTML = html;
  }

  function renderMatches(matches) {
    var el = document.getElementById("stats-matches");
    if (!el) return;

    if (!matches || !matches.length) {
      el.innerHTML = '<p class="stats-empty reveal">Ainda não há partidas registradas.</p>';
      return;
    }

    var html = '<div class="match-grid">';
    matches.forEach(function (m) {
      var result = m.result === "win" ? "win" : m.result === "loss" ? "loss" : "";
      var cardClass = "match-card card reveal" + (result ? " match-card--" + result : "");
      var resultLabel = result === "win" ? "Vitória" : result === "loss" ? "Derrota" : "Mix";
      html +=
        '<article class="' +
        cardClass +
        '">' +
        '<div class="match-card__head">' +
        "<time datetime=\"" +
        escapeHtml(m.date) +
        '">' +
        escapeHtml(formatDate(m.date)) +
        "</time>" +
        '<span class="map-pill">' +
        escapeHtml(m.map) +
        "</span>" +
        '<span class="match-card__result">' +
        escapeHtml(resultLabel) +
        "</span></div>" +
        '<div class="match-card__body">' +
        '<div class="match-card__team"><span class="match-card__team-name">' +
        escapeHtml(m.teamA) +
        '</span><span class="match-card__score-num">' +
        escapeHtml(m.scoreA) +
        "</span></div>" +
        '<span class="match-card__vs" aria-hidden="true">vs</span>' +
        '<div class="match-card__team match-card__team--right"><span class="match-card__team-name">' +
        escapeHtml(m.teamB) +
        '</span><span class="match-card__score-num">' +
        escapeHtml(m.scoreB) +
        "</span></div></div></article>";
    });
    html += "</div>";
    el.innerHTML = html;
  }

  function renderPlayerPanel(players) {
    var el = document.getElementById("stats-player-panel");
    if (!el) return;

    state.players = players;

    if (!players.length) {
      el.innerHTML = '<p class="stats-empty reveal">Nenhum jogador no JSON.</p>';
      return;
    }

    var ranked = players
      .map(function (p, index) {
        return { player: p, index: index };
      })
      .sort(function (a, b) {
        return (b.player.rating || 0) - (a.player.rating || 0);
      });

    var html = "";
    ranked.forEach(function (item, rank) {
      var p = item.player;
      var idx = item.index;
      var clipCount = (p.highlights || []).length;
      var clipLabel = clipCount === 1 ? "1 clip" : clipCount + " clips";

      html +=
        '<article class="card player-panel-card reveal" role="listitem" tabindex="0" data-player-index="' +
        idx +
        '">' +
        '<span class="player-panel-card__rank" aria-hidden="true">#' +
        (rank + 1) +
        "</span>" +
        '<div class="player-panel-card__avatar" aria-hidden="true">' +
        escapeHtml(initials(p.nick)) +
        "</div>" +
        '<div class="player-panel-card__body">' +
        '<div class="player-panel-card__top">' +
        "<h3 class=\"mt-0\">" +
        escapeHtml(p.nick) +
        "</h3>" +
        (p.role ? '<span class="player-panel-card__role">' + escapeHtml(p.role) + "</span>" : "") +
        "</div>" +
        '<dl class="player-panel-card__stats">' +
        "<div><dt>Rating</dt><dd>" +
        (p.rating != null ? escapeHtml(Number(p.rating).toFixed(2)) : "—") +
        "</dd></div>" +
        "<div><dt>K/D</dt><dd>" +
        escapeHtml(kdRatio(p)) +
        "</dd></div>" +
        "<div><dt>Partidas</dt><dd>" +
        escapeHtml(p.matches != null ? p.matches : "—") +
        "</dd></div>" +
        "<div><dt>ADR</dt><dd>" +
        (p.adr != null ? escapeHtml(Number(p.adr).toFixed(1)) : "—") +
        "</dd></div>" +
        "</dl>" +
        '<div class="player-panel-card__footer">' +
        (clipCount
          ? '<span class="map-pill map-pill--strong">' + escapeHtml(clipLabel) + "</span>"
          : '<span class="map-pill">Sem vídeos</span>') +
        '<span class="player-panel-card__cta">Ver perfil →</span>' +
        "</div></div></article>";
    });

    el.innerHTML = html;

    el.querySelectorAll(".player-panel-card[data-player-index]").forEach(function (card) {
      function open() {
        openModal(parseInt(card.getAttribute("data-player-index"), 10));
      }
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });
  }

  function statCell(label, value) {
    return (
      '<div class="player-modal__stat">' +
      "<span class=\"player-modal__stat-label\">" +
      escapeHtml(label) +
      "</span>" +
      '<span class="player-modal__stat-value">' +
      escapeHtml(value) +
      "</span></div>"
    );
  }

  function buildModalContent(p) {
    var highlights = p.highlights || [];
    var html =
      '<header class="player-modal__header">' +
      '<div class="player-modal__avatar" aria-hidden="true">' +
      escapeHtml(initials(p.nick)) +
      "</div>" +
      "<div>" +
      '<h2 id="player-modal-title" class="player-modal__title">' +
      escapeHtml(p.nick) +
      "</h2>" +
      (p.role ? '<p class="player-modal__role">' + escapeHtml(p.role) + "</p>" : "") +
      "</div></header>" +
      '<section class="player-modal__section" aria-labelledby="modal-stats-heading">' +
      '<h3 id="modal-stats-heading" class="player-modal__section-title">Estatísticas</h3>' +
      '<div class="player-modal__stat-grid">' +
      statCell("Partidas", p.matches != null ? p.matches : "—") +
      statCell("Kills", p.kills != null ? p.kills : "—") +
      statCell("Deaths", p.deaths != null ? p.deaths : "—") +
      statCell("Assists", p.assists != null ? p.assists : "—") +
      statCell("K/D", kdRatio(p)) +
      statCell("ADR", p.adr != null ? Number(p.adr).toFixed(1) : "—") +
      statCell("HS%", p.hsPercent != null ? p.hsPercent + "%" : "—") +
      statCell("Rating", p.rating != null ? Number(p.rating).toFixed(2) : "—") +
      "</div></section>" +
      '<section class="player-modal__section" aria-labelledby="modal-videos-heading">' +
      '<h3 id="modal-videos-heading" class="player-modal__section-title">Highlights (' +
      highlights.length +
      ")</h3>";

    if (!highlights.length) {
      html +=
        '<p class="stats-empty">Nenhum vídeo para este jogador. Adicione um objeto em <code>highlights</code> com <code>url</code> do MP4 (media2.allstar.gg).</p>';
    } else {
      html += '<div class="player-modal__videos">';
      highlights.forEach(function (h, i) {
        var src = resolveVideoUrl(h.url);
        if (!src) return;
        var title = h.title || "Highlight " + (i + 1);
        var meta = [];
        if (h.map) meta.push(escapeHtml(h.map));
        if (h.date) meta.push(escapeHtml(formatDate(h.date)));

        html +=
          '<article class="player-modal__video-card">' +
          "<h4 class=\"player-modal__video-title\">" +
          escapeHtml(title) +
          "</h4>" +
          (meta.length ? '<p class="player-modal__video-meta">' + meta.join(" · ") + "</p>" : "") +
          '<div class="player-modal__video-wrap">' +
          '<video controls playsinline preload="metadata" src="' +
          escapeHtml(src) +
          '" title="' +
          escapeHtml(title) +
          '">Seu navegador não suporta vídeo.</video>' +
          "</div></article>";
      });
      html += "</div>";
    }

    html += "</section>";
    return html;
  }

  function pauseModalVideos() {
    var modal = document.getElementById("player-modal");
    if (!modal) return;
    modal.querySelectorAll("video").forEach(function (v) {
      v.pause();
    });
  }

  function openModal(index) {
    var p = state.players[index];
    if (!p) return;

    var modal = document.getElementById("player-modal");
    var content = document.getElementById("player-modal-content");
    var dialog = modal && modal.querySelector(".player-modal__dialog");
    if (!modal || !content || !dialog) return;

    state.lastFocus = document.activeElement;
    content.innerHTML = buildModalContent(p);
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    dialog.focus();
  }

  function closeModal() {
    var modal = document.getElementById("player-modal");
    if (!modal || modal.hidden) return;

    pauseModalVideos();
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    document.getElementById("player-modal-content").innerHTML = "";

    if (state.lastFocus && typeof state.lastFocus.focus === "function") {
      state.lastFocus.focus();
    }
  }

  var TAB_IDS = { resumo: "resumo", partidas: "partidas", jogadores: "jogadores" };

  function activateTab(tabId, pushHash) {
    var id = TAB_IDS[tabId] || "resumo";
    var tabs = document.querySelectorAll(".stats-tab");
    var panels = document.querySelectorAll(".stats-panel");

    tabs.forEach(function (tab) {
      var on = tab.getAttribute("data-tab") === id;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
    });

    panels.forEach(function (panel) {
      var on = panel.getAttribute("data-panel") === id;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });

    if (pushHash !== false) {
      var hash = id === "resumo" ? "" : id;
      if (window.location.hash.replace("#", "") !== hash) {
        history.replaceState(null, "", hash ? "#" + hash : window.location.pathname + window.location.search);
      }
    }

    var active = document.querySelector('.stats-panel[data-panel="' + id + '"]');
    if (active) {
      active.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  function setupTabs() {
    var nav = document.querySelector(".stats-hub__nav");
    if (!nav) return;

    nav.querySelectorAll(".stats-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        activateTab(tab.getAttribute("data-tab"), true);
      });
    });

    var hash = (window.location.hash || "").replace("#", "");
    if (hash && TAB_IDS[hash]) activateTab(hash, false);
    else activateTab("resumo", false);

    window.addEventListener("hashchange", function () {
      var h = (window.location.hash || "").replace("#", "");
      if (h && TAB_IDS[h]) activateTab(h, false);
    });
  }

  function setupModal() {
    var modal = document.getElementById("player-modal");
    if (!modal) return;

    modal.querySelectorAll("[data-modal-close]").forEach(function (el) {
      el.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }

  function observeReveals() {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".reveal").forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.classList.add("is-visible");
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach(function (el) {
      observer.observe(el);
    });
  }

  function showError(message) {
    var main = document.querySelector("[data-stats-page]");
    if (!main) return;
    main.insertAdjacentHTML(
      "afterbegin",
      '<p class="form-msg form-msg--error is-visible reveal" role="alert">' + escapeHtml(message) + "</p>"
    );
  }

  function init(raw) {
    var data = normalizeData(raw);
    renderSummary(data.summary, { season: data.season, updated: data.updated });
    renderMatches(data.matches);
    renderPlayerPanel(data.players);
    setupTabs();
    observeReveals();
  }

  function load() {
    var loader =
      typeof StatsData !== "undefined"
        ? StatsData.load()
        : fetch("/data/estatisticas.json", { cache: "no-store" }).then(function (res) {
            if (!res.ok) throw new Error("load_failed");
            return res.json();
          });

    loader
      .then(init)
      .catch(function () {
        showError(
          "Não foi possível carregar os dados. Use o site via HTTP (Vercel ou vercel dev) e confira /api/stats ou data/estatisticas.json."
        );
      });
  }

  setupModal();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", load);
  } else {
    load();
  }
})();
