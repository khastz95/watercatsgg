(function () {
  "use strict";
  var form = document.getElementById("login-form");
  var msg = document.getElementById("login-msg");
  if (!form) return;

  var next = new URLSearchParams(window.location.search).get("next") || "/";

  fetch("/api/sessao", { credentials: "include" })
    .then(function (r) {
      return r.json();
    })
    .then(function (j) {
      if (j && j.user) window.location.replace(next);
    })
    .catch(function () {});

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msg.textContent = "";
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    var usuario = document.getElementById("login-user").value.trim();
    var senha = document.getElementById("login-pass").value;
    fetch("/api/sessao", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario: usuario, senha: senha })
    })
      .then(function (res) {
        return res.json().then(function (json) {
          return { res: res, json: json };
        });
      })
      .then(function (out) {
        if (btn) btn.disabled = false;
        if (!out.res.ok) {
          msg.className = "ep-msg ep-msg--err";
          msg.textContent = out.json.error || "Não foi possível entrar.";
          return;
        }
        window.location.replace(next);
      })
      .catch(function () {
        if (btn) btn.disabled = false;
        msg.className = "ep-msg ep-msg--err";
        msg.textContent = "Falha de conexão.";
      });
  });
})();
