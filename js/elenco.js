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
      root.innerHTML = U.rosterHtml(
        elenco.filter(function (p) {
          return p.papel === "titular";
        }),
        "Lineup titular ainda não publicada."
      );
      if (staff) {
        staff.innerHTML = U.rosterHtml(
          elenco.filter(function (p) {
            return p.papel !== "titular";
          }),
          "Comissão técnica ainda não publicada."
        );
      }
      if (window.EP && window.EP.observeReveal) {
        window.EP.observeReveal(root);
        if (staff) window.EP.observeReveal(staff);
      }
    })
    .catch(function () {
      root.innerHTML = '<p class="ep-empty">Não foi possível carregar o elenco.</p>';
      if (staff) staff.innerHTML = "";
    });
})();
