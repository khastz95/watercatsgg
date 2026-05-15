(function () {
  "use strict";

  var root = document.getElementById("admin-root");
  if (!root || typeof StatsData === "undefined") return;

  var app = { data: null, password: StatsData.getStoredPassword() };

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function num(val, fallback) {
    var n = parseFloat(val);
    return Number.isNaN(n) ? (fallback != null ? fallback : 0) : n;
  }

  function int(val, fallback) {
    var n = parseInt(val, 10);
    return Number.isNaN(n) ? (fallback != null ? fallback : 0) : n;
  }

  function showMsg(el, text, type) {
    el.innerHTML =
      '<p class="form-msg form-msg--' +
      (type === "ok" ? "ok" : "error") +
      ' is-visible" role="status">' +
      esc(text) +
      "</p>";
  }

  function field(label, id, value, type, attrs) {
    type = type || "text";
    attrs = attrs || "";
    return (
      '<div class="field admin-field">' +
      '<label for="' +
      id +
      '">' +
      esc(label) +
      "</label>" +
      '<input id="' +
      id +
      '" type="' +
      type +
      '" value="' +
      esc(value != null ? value : "") +
      '" ' +
      attrs +
      " />"
    );
  }

  function renderLogin() {
    root.innerHTML =
      '<section class="card admin-card">' +
      "<h2 class=\"mt-0\">Entrar</h2>" +
      '<p class="admin-intro">Digite a senha de edição para continuar.</p>' +
      field("Senha", "admin-password", app.password, "password", 'autocomplete="current-password"') +
      '<div class="admin-actions">' +
      '<button type="button" class="btn btn--primary" id="btn-login">Continuar</button>' +
      "</div>" +
      '<div id="admin-msg"></div>' +
      "</section>";

    document.getElementById("btn-login").addEventListener("click", tryLogin);
    document.getElementById("admin-password").addEventListener("keydown", function (e) {
      if (e.key === "Enter") tryLogin();
    });
  }

  function tryLogin() {
    var pwd = document.getElementById("admin-password").value;
    var msg = document.getElementById("admin-msg");
    app.password = pwd;
    StatsData.setStoredPassword(pwd);
    msg.innerHTML = '<p class="form-msg is-visible">Carregando…</p>';

    StatsData.load()
      .then(function (data) {
        if (typeof StatsSchema !== "undefined") {
          data = StatsSchema.normalizeStatsData(data);
        }
        app.data = data;
        renderEditor();
      })
      .catch(function () {
        app.data = StatsData.defaultData();
        showMsg(msg, "Não foi possível carregar os dados. Um rascunho vazio foi criado.", "error");
        setTimeout(renderEditor, 800);
      });
  }

  function renderEditor() {
    var d = app.data;
    if (!d.summary) d.summary = { matches: 0, wins: 0, losses: 0, roundsPlayed: 0, avgRating: 0 };
    if (!d.matches) d.matches = [];
    if (!d.players) d.players = [];

    root.innerHTML =
      '<div class="admin-toolbar">' +
      '<button type="button" class="btn btn--primary" id="btn-save">Salvar alterações</button>' +
      '<button type="button" class="btn btn--ghost" id="btn-export">Exportar backup</button>' +
      '<label class="btn btn--ghost admin-file-btn">Importar backup<input type="file" id="import-file" accept="application/json,.json" hidden /></label>' +
      '<a class="btn btn--ghost" href="/jogadores.html">Ver página pública</a>' +
      "</div>" +
      '<div id="admin-msg"></div>' +
      '<section class="card admin-card">' +
      "<h2 class=\"mt-0\">Temporada</h2>" +
      '<div class="admin-grid-2">' +
      field("Nome da temporada", "meta-season", d.season) +
      field("Última atualização", "meta-updated", d.updated, "date") +
      "</div></section>" +
      '<section class="card admin-card">' +
      "<h2 class=\"mt-0\">Resumo geral</h2>" +
      '<div class="admin-grid-3">' +
      field("Partidas", "sum-matches", d.summary.matches, "number", 'min="0" step="1"') +
      field("VitÃ³rias", "sum-wins", d.summary.wins, "number", 'min="0" step="1"') +
      field("Derrotas", "sum-losses", d.summary.losses, "number", 'min="0" step="1"') +
      field("Rounds jogados", "sum-rounds", d.summary.roundsPlayed, "number", 'min="0" step="1"') +
      field("Rating mÃ©dio (auto ao salvar)", "sum-avg", d.summary.avgRating, "number", 'min="0" step="0.01" readonly') +
      "</div></section>" +
      '<section class="card admin-card">' +
      '<div class="admin-section-head"><h2 class="mt-0">Partidas</h2>' +
      '<button type="button" class="btn btn--ghost btn--compact" id="btn-add-match">+ Partida</button></div>' +
      '<div id="admin-matches"></div></section>' +
      '<section class="card admin-card">' +
      '<div class="admin-section-head"><h2 class="mt-0">Jogadores</h2>' +
      '<button type="button" class="btn btn--ghost btn--compact" id="btn-add-player">+ Jogador</button></div>' +
      '<div id="admin-players"></div></section>';

    root.innerHTML = root.innerHTML.replace(/<\/?motion[^>]*>/g, "");

    renderMatchesList();
    renderPlayersList();
    bindEditorEvents();
  }

  function renderMatchesList() {
    var wrap = document.getElementById("admin-matches");
    if (!wrap) return;
    var matches = app.data.matches || [];
    if (!matches.length) {
      wrap.innerHTML = '<p class="stats-empty">Nenhuma partida. Clique em + Partida.</p>';
      return;
    }
    wrap.innerHTML = matches
      .map(function (m, i) {
        return (
          '<article class="admin-block" data-match-index="' +
          i +
          '">' +
          '<div class="admin-block__head"><strong>Partida ' +
          (i + 1) +
          '</strong><button type="button" class="admin-remove" data-remove-match="' +
          i +
          '">Remover</button></div>' +
          '<div class="admin-grid-3">' +
          field("Data", "match-date-" + i, m.date, "date") +
          field("Mapa", "match-map-" + i, m.map) +
          '<div class="field admin-field"><label for="match-result-' +
          i +
          '">Resultado</label><select id="match-result-' +
          i +
          '"><option value="win"' +
          (m.result === "win" ? " selected" : "") +
          '>VitÃ³ria</option><option value="loss"' +
          (m.result === "loss" ? " selected" : "") +
          '>Derrota</option></select></div>' +
          field("Time A", "match-a-" + i, m.teamA) +
          field("Time B", "match-b-" + i, m.teamB) +
          field("Placar A", "match-sa-" + i, m.scoreA, "number", 'min="0"') +
          field("Placar B", "match-sb-" + i, m.scoreB, "number", 'min="0"') +
          "</div></article>"
        );
      })
      .join("");
    wrap.innerHTML = wrap.innerHTML.replace(/<\/?motion[^>]*>/g, "");
  }

  function renderPlayersList() {
    var wrap = document.getElementById("admin-players");
    if (!wrap) return;
    var players = app.data.players || [];
    if (!players.length) {
      wrap.innerHTML = '<p class="stats-empty">Nenhum jogador. Clique em + Jogador.</p>';
      return;
    }
    wrap.innerHTML = players
      .map(function (p, pi) {
        return AdminPlayerFields.render(pi, p);
      })
      .join("");
  }

  function collectData() {
    var d = app.data;
    d.season = document.getElementById("meta-season").value.trim();
    d.updated = document.getElementById("meta-updated").value || new Date().toISOString().slice(0, 10);
    d.summary = {
      matches: int(document.getElementById("sum-matches").value, 0),
      wins: int(document.getElementById("sum-wins").value, 0),
      losses: int(document.getElementById("sum-losses").value, 0),
      roundsPlayed: int(document.getElementById("sum-rounds").value, 0),
      avgRating: num(document.getElementById("sum-avg").value, 0),
    };

    d.matches = [];
    (app.data.matches || []).forEach(function (_, i) {
      var dateEl = document.getElementById("match-date-" + i);
      if (!dateEl) return;
      d.matches.push({
        date: dateEl.value,
        map: document.getElementById("match-map-" + i).value.trim(),
        teamA: document.getElementById("match-a-" + i).value.trim(),
        teamB: document.getElementById("match-b-" + i).value.trim(),
        scoreA: int(document.getElementById("match-sa-" + i).value, 0),
        scoreB: int(document.getElementById("match-sb-" + i).value, 0),
        result: document.getElementById("match-result-" + i).value,
      });
    });

    d.players = [];
    (app.data.players || []).forEach(function (p, pi) {
      if (!document.getElementById("pl-nick-" + pi)) return;
      var player = AdminPlayerFields.collect(pi, p);
      if (player.nick) d.players.push(player);
    });

    return d;
  }

  function bindEditorEvents() {
    document.getElementById("btn-save").addEventListener("click", saveToVercel);
    document.getElementById("btn-export").addEventListener("click", exportJson);
    document.getElementById("import-file").addEventListener("change", importJson);
    document.getElementById("btn-add-match").addEventListener("click", function () {
      collectData();
      app.data.matches.push({
        date: new Date().toISOString().slice(0, 10),
        map: "Mirage",
        teamA: "Time A",
        teamB: "Time B",
        scoreA: 13,
        scoreB: 10,
        result: "win",
      });
      renderMatchesList();
      bindMatchPlayerRemove();
    });
    document.getElementById("btn-add-player").addEventListener("click", function () {
      collectData();
      app.data.players.push({
        nick: "NovoJogador",
        role: "",
        dashboard: StatsSchema.defaultDashboard(),
        highlights: [],
      });
      renderPlayersList();
      bindMatchPlayerRemove();
    });
    bindMatchPlayerRemove();
  }

  function bindMatchPlayerRemove() {
    root.querySelectorAll("[data-remove-match]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var i = parseInt(btn.getAttribute("data-remove-match"), 10);
        app.data.matches.splice(i, 1);
        renderMatchesList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-remove-player]").forEach(function (btn) {
      btn.onclick = function () {
        if (!confirm("Remover este jogador?")) return;
        collectData();
        var i = parseInt(btn.getAttribute("data-remove-player"), 10);
        app.data.players.splice(i, 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-remove-highlight]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var parts = btn.getAttribute("data-remove-highlight").split("-");
        var pi = parseInt(parts[0], 10);
        var hi = parseInt(parts[1], 10);
        app.data.players[pi].highlights.splice(hi, 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-add-highlight]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var pi = parseInt(btn.getAttribute("data-add-highlight"), 10);
        if (!app.data.players[pi].highlights) app.data.players[pi].highlights = [];
        app.data.players[pi].highlights.push({
          title: "Highlight",
          map: "",
          date: new Date().toISOString().slice(0, 10),
          url: "",
        });
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });

    bindPlayerListAdds();
  }

  function bindPlayerListAdds() {
    root.querySelectorAll("[data-rm-add]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var pi = parseInt(btn.getAttribute("data-rm-add"), 10);
        var p = app.data.players[pi];
        if (!p.dashboard.recentMatches) p.dashboard.recentMatches = [];
        p.dashboard.recentMatches.push({ map: "de_mirage", scoreA: 13, scoreB: 10, result: "win" });
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-rm-remove]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var parts = btn.getAttribute("data-rm-remove").split("-");
        app.data.players[parseInt(parts[0], 10)].dashboard.recentMatches.splice(parseInt(parts[1], 10), 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-mp-add]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var pi = parseInt(btn.getAttribute("data-mp-add"), 10);
        app.data.players[pi].dashboard.maps.mostPlayed.push({ name: "de_mirage", count: 0 });
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-mp-remove]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var parts = btn.getAttribute("data-mp-remove").split("-");
        app.data.players[parseInt(parts[0], 10)].dashboard.maps.mostPlayed.splice(parseInt(parts[1], 10), 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-ms-add]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var pi = parseInt(btn.getAttribute("data-ms-add"), 10);
        app.data.players[pi].dashboard.maps.mostSuccess.push({ name: "de_mirage", winPercent: 50 });
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-ms-remove]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var parts = btn.getAttribute("data-ms-remove").split("-");
        app.data.players[parseInt(parts[0], 10)].dashboard.maps.mostSuccess.splice(parseInt(parts[1], 10), 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-wk-add]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var pi = parseInt(btn.getAttribute("data-wk-add"), 10);
        app.data.players[pi].dashboard.weapons.mostKills.push({ name: "AK-47", value: 0, bar: 100 });
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-wk-remove]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var parts = btn.getAttribute("data-wk-remove").split("-");
        app.data.players[parseInt(parts[0], 10)].dashboard.weapons.mostKills.splice(parseInt(parts[1], 10), 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-wh-add]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var pi = parseInt(btn.getAttribute("data-wh-add"), 10);
        app.data.players[pi].dashboard.weapons.headshotRate.push({ name: "AK-47", value: 0, bar: 100 });
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
    root.querySelectorAll("[data-wh-remove]").forEach(function (btn) {
      btn.onclick = function () {
        collectData();
        var parts = btn.getAttribute("data-wh-remove").split("-");
        app.data.players[parseInt(parts[0], 10)].dashboard.weapons.headshotRate.splice(parseInt(parts[1], 10), 1);
        renderPlayersList();
        bindMatchPlayerRemove();
      };
    });
  }

  function friendlySaveError(result) {
    var body = (result && result.body) || {};
    var code = body.error;
    if (code === "blob_not_configured") {
      return "Não foi possível salvar online. Exporte um backup e envie ao responsável do site.";
    }
    if (code === "admin_not_configured") {
      return "Área de edição ainda não está configurada.";
    }
    if (result.status === 401 || code === "Senha incorreta.") {
      return "Senha incorreta.";
    }
    if (body.message && !/json|vercel|blob|commit|reposit/i.test(body.message)) {
      return body.message;
    }
    return "Não foi possível salvar. Tente novamente ou exporte um backup.";
  }

  function saveToVercel() {
    var msg = document.getElementById("admin-msg");
    var data = collectData();
    app.data = data;
    msg.innerHTML = '<p class="form-msg is-visible">Salvando…</p>';

    StatsData.save(data, app.password).then(function (result) {
      if (result.ok) {
        showMsg(msg, "Alterações salvas. A página de Jogadores já está atualizada.", "ok");
        if (result.body && result.body.updated) {
          var el = document.getElementById("meta-updated");
          if (el) el.value = result.body.updated;
        }
        return;
      }
      var text = friendlySaveError(result);
      showMsg(msg, text, "error");
    });
  }

  function exportJson() {
    var data = collectData();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "jogadores-backup.json";
    a.click();
    URL.revokeObjectURL(a.href);
    showMsg(document.getElementById("admin-msg"), "Backup exportado com sucesso.", "ok");
  }

  function importJson(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        app.data = JSON.parse(reader.result);
        if (typeof StatsSchema !== "undefined") {
          app.data = StatsSchema.normalizeStatsData(app.data);
        }
        renderEditor();
        showMsg(document.getElementById("admin-msg"), "Dados importados com sucesso.", "ok");
      } catch (err) {
        showMsg(document.getElementById("admin-msg"), "O arquivo selecionado não é válido.", "error");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  if (app.password) {
    tryLogin();
  } else {
    renderLogin();
  }
})();
