(function () {
  "use strict";
  fetch("/api/sessao", { credentials: "include", cache: "no-store" })
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      if (!json || !json.user) {
        window.location.replace("/entrar?next=/1v1");
        return;
      }
      document.body.classList.add("is-authed");
      var gate = document.getElementById("ep-gate");
      if (gate) gate.remove();
      var app = document.createElement("script");
      app.src = "/1v1/js/app.js";
      document.body.appendChild(app);
    })
    .catch(function () {
      window.location.replace("/entrar?next=/1v1");
    });
})();
