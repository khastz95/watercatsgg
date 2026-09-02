(function () {
  "use strict";
  var U = window.OrgUI;
  if (!U) return;

  function playerKey() {
    var q = new URLSearchParams(window.location.search).get("id");
    if (q) return q;
    var parts = (window.location.pathname || "").replace(/\/+$/, "").split("/");
    return parts[parts.length - 1] || "";
  }

  function stat(label, value) {
    return (
      '<div class="ep-stat"><small>' +
      U.esc(label) +
      "</small><strong>" +
      U.esc(value) +
      "</strong></div>"
    );
  }

  function rank(label, value) {
    if (value == null || value === "") return "";
    return (
      '<div class="ep-rank"><small>' +
      U.esc(label) +
      "</small><strong>" +
      U.esc(value) +
      "</strong></div>"
    );
  }

  var root = document.getElementById("player-root");
  if (!root) return;
  var key = playerKey();

  U.fetchOrg()
    .then(function (data) {
      var p = (data.elenco || []).find(function (row) {
        return row.id === key || String(row.nick).toLowerCase() === String(key).toLowerCase();
      });
      if (!p) {
        root.innerHTML = '<p class="ep-empty">Jogador não encontrado.</p>';
        return;
      }
      document.title = U.displayNick(p) + " | Eternal Pratas";
      var kd =
        p.kd != null
          ? U.fmt(p.kd, 2)
          : p.mortes
            ? U.fmt((p.abates || 0) / p.mortes, 2)
            : "—";
      var win = U.wr(p);
      var links = (p.conexoes || [])
        .map(function (c) {
          var label = c.rotulo || c.tipo;
          return (
            '<a href="' +
            U.esc(c.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            U.esc(label) +
            "</a>"
          );
        })
        .join("");
      if (p.steam64 && !(p.conexoes || []).some(function (c) { return c.tipo === "steam"; })) {
        links =
          '<a href="https://steamcommunity.com/profiles/' +
          U.esc(p.steam64) +
          '" target="_blank" rel="noopener noreferrer">Steam</a>' +
          links;
      }

      var who = [p.nome, p.idade ? p.idade + " anos" : "", p.posicao, U.papelLabel(p.papel)]
        .filter(Boolean)
        .join(" · ");

      root.innerHTML =
        '<div class="ep-profile">' +
        '<div class="ep-profile__photo">' +
        (p.foto_url
          ? '<img src="' + U.esc(p.foto_url) + '" alt="' + U.esc(U.displayNick(p)) + '" onerror="this.remove()">'
          : "") +
        '<span class="ph">' +
        U.esc(U.initials(U.displayNick(p))) +
        "</span></div>" +
        "<div>" +
        '<p class="ep-kicker">' +
        U.esc(U.papelLabel(p.papel)) +
        " · Eternal Pratas</p>" +
        '<span class="ep-profile__badge">' +
        U.esc(p.posicao || U.papelLabel(p.papel)) +
        "</span>" +
        "<h1>" +
        U.esc(U.displayNick(p)) +
        "</h1>" +
        '<p class="ep-profile__who">' +
        U.esc(who) +
        "</p>" +
        '<div class="ep-ranks">' +
        rank("GamersClub", p.nivel_gc != null ? "Nível " + p.nivel_gc : "") +
        rank("Faceit", p.nivel_faceit != null ? "Nível " + p.nivel_faceit : "") +
        rank("Premier", p.rating_premier != null ? p.rating_premier : "") +
        "</div>" +
        (links ? '<div class="ep-links">' + links + "</div>" : "") +
        '<div class="ep-stats">' +
        stat("Rating", U.fmt(p.rating, 2)) +
        stat("K/D", kd) +
        stat("KAST", U.pct(p.kast)) +
        stat("HS%", U.pct(p.taxa_hs)) +
        stat("ADR", U.fmt(p.adr, 1)) +
        stat("KPR", U.fmt(p.kpr, 2)) +
        stat("DPR", U.fmt(p.dpr, 2)) +
        stat("Win rate", win != null ? win + "%" : "—") +
        stat("Partidas", p.partidas || "—") +
        stat("Abates", p.abates || "—") +
        stat("Mortes", p.mortes || "—") +
        stat("Assistências", p.assistencias || "—") +
        "</div>" +
        (p.bio ? '<p class="ep-bio">' + U.esc(p.bio) + "</p>" : "") +
        "</div></div>";
    })
    .catch(function () {
      root.innerHTML = '<p class="ep-empty">Não foi possível carregar o perfil.</p>';
    });
})();
