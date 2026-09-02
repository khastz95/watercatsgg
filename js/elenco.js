(function () {
  "use strict";
  var U = window.OrgUI;
  if (!U) return;
  var root = document.getElementById("team-roster");
  var staff = document.getElementById("team-staff");
  if (!root) return;

  U.fetchOrg()
    .then(function (data) {
      var elenco = data.elenco || [];
      root.innerHTML = elenco
        .filter(function (p) {
          return p.papel === "titular";
        })
        .map(U.playerCard)
        .join("");
      if (staff) {
        staff.innerHTML = elenco
          .filter(function (p) {
            return p.papel !== "titular";
          })
          .map(U.playerCard)
          .join("");
      }
    })
    .catch(function () {
      root.innerHTML = '<p class="ep-empty">Não foi possível carregar o elenco.</p>';
    });
})();
