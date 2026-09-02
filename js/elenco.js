(function () {
  "use strict";

  var root = document.getElementById("team-roster");
  if (!root) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(name) {
    var n = String(name || "?").trim();
    return n.slice(0, 2).toUpperCase();
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function card(p, i) {
    var color = p.color || "#3ec7ff";
    var name = p.name || p.id || "jogador";
    var photo = p.photo || "";

    return (
      '<article class="roster-card" style="--accent:' +
      esc(color) +
      '">' +
      '<span class="roster-card__idx">' +
      pad(i + 1) +
      "</span>" +
      '<div class="roster-card__photo">' +
      (photo
        ? '<img src="' + esc(photo) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.remove()">'
        : "") +
      '<span class="ph">' +
      esc(initials(name)) +
      "</span></div>" +
      '<div class="roster-card__meta">' +
      "<h3>" +
      esc(name) +
      "</h3>" +
      '<p class="roster-card__role">Player</p>' +
      '<p class="roster-card__org">Eternal Pratas</p>' +
      "</div></article>"
    );
  }

  fetch("/api/campeonato", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("fail");
      return res.json();
    })
    .then(function (payload) {
      var data = (payload && payload.data) || {};
      var players = data.players || [];
      var countEl = document.getElementById("org-roster-count");
      if (countEl) countEl.textContent = String(players.length);
      if (!players.length) {
        root.innerHTML = '<p class="team-empty">Elenco em atualização.</p>';
        return;
      }
      root.innerHTML = players.map(card).join("");
    })
    .catch(function () {
      root.innerHTML = '<p class="team-empty">Não foi possível carregar o elenco.</p>';
    });
})();
