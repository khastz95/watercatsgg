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

  function card(p) {
    var color = p.color || "#3ec7ff";
    var name = p.name || p.id || "jogador";
    var photo = p.photo || "";
    var pic =
      '<span class="pic" style="--accent:' +
      esc(color) +
      '">' +
      (photo
        ? '<img src="' + esc(photo) + '" alt="' + esc(name) + '">'
        : "") +
      '<span class="ph">' +
      esc(initials(name)) +
      "</span></span>";

    return (
      '<a class="team-card" href="/1v1" style="--accent:' +
      esc(color) +
      '">' +
      pic +
      "<h3>" +
      esc(name) +
      "</h3></a>"
    );
  }

  fetch("/api/campeonato", { cache: "no-store" })
    .then(function (res) {
      if (!res.ok) throw new Error("fail");
      return res.json();
    })
    .then(function (payload) {
      var players = (payload && payload.data && payload.data.players) || [];
      if (!players.length) {
        root.innerHTML = '<p class="team-empty">Elenco ainda não cadastrado.</p>';
        return;
      }
      root.innerHTML = players.map(card).join("");
    })
    .catch(function () {
      root.innerHTML = '<p class="team-empty">Não foi possível carregar o elenco.</p>';
    });
})();
