(function () {
  "use strict";
  var U = window.OrgUI;
  if (!U) return;

  U.fetchOrg()
    .then(function (data) {
      var elenco = data.elenco || [];
      var titulares = elenco.filter(function (p) {
        return p.papel === "titular";
      });
      var resto = elenco.filter(function (p) {
        return p.papel !== "titular";
      });
      var starters = document.getElementById("home-starters");
      var staff = document.getElementById("home-staff");
      if (starters) starters.innerHTML = titulares.map(U.playerCard).join("");
      if (staff) staff.innerHTML = resto.map(U.playerCard).join("");
      if (window.EP && window.EP.observeReveal) {
        window.EP.observeReveal(starters);
        window.EP.observeReveal(staff);
      }

      var next = U.nextJogo(data.jogos);
      var box = document.getElementById("home-next");
      if (!box) return;
      if (!next) {
        box.innerHTML =
          '<p class="ep-empty">Nenhum jogo agendado no momento. A agenda pública aparece aqui assim que o próximo confronto for marcado.</p>';
        return;
      }
      var when = U.formatData(next.data, next.hora);
      var day = next.data ? new Date(next.data + "T12:00:00").getDate() : "—";
      var mon = next.data
        ? new Date(next.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })
        : "";
      var html =
        '<div class="ep-next">' +
        '<div class="ep-date"><strong>' +
        U.esc(String(day)) +
        "</strong><small>" +
        U.esc(mon || when) +
        '</small></div><div><div class="ep-match__vs">Eternal Pratas <span class="ep-vs">VS</span> ' +
        U.esc(next.adversario || "A definir") +
        "</div><p>" +
        U.esc([next.campeonato, next.formato, next.hora].filter(Boolean).join(" · ")) +
        "</p>";
      var maps = String(next.mapas || "")
        .split(/[,/|]+/)
        .map(function (m) {
          return m.trim();
        })
        .filter(Boolean);
      if (maps.length) {
        html +=
          '<div class="ep-maps">' +
          maps
            .map(function (m) {
              return '<span class="ep-mini">' + U.esc(m) + "</span>";
            })
            .join("") +
          "</div>";
      }
      html += '</div><a class="btn btn--ghost" href="/jogos">Ver agenda</a></div>';
      box.innerHTML = html;
    })
    .catch(function () {
      var s = document.getElementById("home-starters");
      if (s) s.innerHTML = '<p class="ep-empty">Não foi possível carregar o elenco.</p>';
    });
})();
