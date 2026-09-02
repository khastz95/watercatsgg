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

      var next = U.nextJogo(data.jogos);
      var box = document.getElementById("home-next");
      if (!box) return;
      if (!next) {
        box.innerHTML = '<p class="ep-empty">Nenhum jogo agendado no momento.</p>';
        return;
      }
      box.innerHTML =
        '<div class="ep-next">' +
        '<div class="ep-next__when">' +
        U.esc(U.formatData(next.data, next.hora)) +
        "</div><div><h3>Eternal Pratas <span>vs</span> " +
        U.esc(next.adversario || "A definir") +
        "</h3><p>" +
        U.esc([next.campeonato, next.formato, next.mapas].filter(Boolean).join(" · ")) +
        '</p></div><a class="btn btn--ghost" href="/jogos">Ver jogos</a></div>';
    })
    .catch(function () {
      var s = document.getElementById("home-starters");
      if (s) s.innerHTML = '<p class="ep-empty">Não foi possível carregar o elenco.</p>';
    });
})();
