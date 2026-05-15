(function () {
  "use strict";

  var STATUS = {
    available: { label: "Disponível", className: "roster-card--available" },
    offline: { label: "Off-line", className: "roster-card--offline" },
    ingame: { label: "Em jogo", className: "roster-card--ingame" },
  };

  function escapeHtml(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function photoSrc(member, defaults) {
    return member.photo || defaults.defaultPhoto || "/assets/logo.png";
  }

  function renderMember(member, defaults) {
    var src = photoSrc(member, defaults);
    var statusKey = member.status && STATUS[member.status] ? member.status : null;
    var statusInfo = statusKey ? STATUS[statusKey] : null;
    var cardClass = "card roster-card reveal" + (statusInfo ? " " + statusInfo.className : "");

    var html =
      '<article class="' +
      cardClass +
      '" role="listitem">' +
      '<div class="roster-card__photo-wrap">' +
      '<img class="roster-card__photo" src="' +
      escapeHtml(src) +
      '" alt="Foto de ' +
      escapeHtml(member.nick) +
      '" width="80" height="80" loading="lazy" decoding="async" />' +
      (statusInfo
        ? '<span class="roster-card__dot" aria-hidden="true"></span>'
        : '<span class="roster-card__dot roster-card__dot--muted" aria-hidden="true"></span>') +
      "</div>" +
      '<div class="roster-card__body">' +
      '<div class="roster-card__head">' +
      "<h3 class=\"roster-card__name\">" +
      escapeHtml(member.nick) +
      "</h3>";

    if (member.tag) {
      html += '<span class="roster-card__tag">' + escapeHtml(member.tag) + "</span>";
    }

    html += "</div>";

    if (statusInfo) {
      html += '<p class="roster-card__status">' + escapeHtml(statusInfo.label) + "</p>";
      if (member.status === "ingame" && member.game) {
        html += '<p class="roster-card__game">' + escapeHtml(member.game) + "</p>";
      }
    }

    html += "</div></article>";
    return html;
  }

  function renderMembers(data) {
    var el = document.getElementById("roster-members");
    var countEl = document.getElementById("roster-count");
    if (!el) return;

    var members = data.members || [];
    if (!members.length) {
      el.innerHTML = '<p class="stats-empty reveal">Nenhum jogador na lista.</p>';
      if (countEl) countEl.textContent = "0 na comunidade";
      el.setAttribute("aria-busy", "false");
      return;
    }

    el.innerHTML = members
      .map(function (m) {
        return renderMember(m, data);
      })
      .join("");
    el.setAttribute("aria-busy", "false");

    if (countEl) {
      countEl.textContent =
        members.length === 1
          ? "1 pessoa na comunidade"
          : members.length + " pessoas na comunidade";
    }
  }

  function init() {
    fetch("/data/jogadores.json", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("fetch");
        return res.json();
      })
      .then(function (data) {
        renderMembers(data);
        if (window.refreshReveals) {
          window.refreshReveals(document.getElementById("roster-members"));
        }
      })
      .catch(function () {
        var el = document.getElementById("roster-members");
        if (el) {
          el.innerHTML =
            '<p class="stats-empty reveal">Não foi possível carregar a lista. Confira <code>data/jogadores.json</code>.</p>';
          el.setAttribute("aria-busy", "false");
        }
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
