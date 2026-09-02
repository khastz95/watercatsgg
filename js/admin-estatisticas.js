(function () {
  "use strict";

  var root = document.getElementById("admin-root");
  if (!root || typeof StatsData === "undefined") return;

  var app = {
    data: null,
    partidas: null,
    username: StatsData.getStoredUsername(),
    password: StatsData.getStoredPassword(),
    view: null,          // 'general' | 'partidas' | number (índice do jogador)
    tab: "identity",
    partidasMatch: null, // índice da partida selecionada
    partidasTab: "info",
  };

  /* ── Utilitários ──────────────────────────────────────── */
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function num(id, fb) {
    var el = document.getElementById(id);
    if (!el) return fb != null ? fb : 0;
    var n = parseFloat(el.value);
    return isNaN(n) ? (fb != null ? fb : 0) : n;
  }
  function int(id, fb) {
    var el = document.getElementById(id);
    if (!el) return fb != null ? fb : 0;
    var n = parseInt(el.value, 10);
    return isNaN(n) ? (fb != null ? fb : 0) : n;
  }
  function val(id, fb) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : (fb != null ? fb : "");
  }
  function showMsg(text, type) {
    var el = document.getElementById("admin-msg");
    if (!el) return;
    el.innerHTML =
      '<p class="form-msg form-msg--' + (type === "ok" ? "ok" : "error") + ' is-visible" role="status">' +
      esc(text) + "</p>";
  }
  function initials(nick) {
    var clean = String(nick || "?").replace(/[^\w\u00C0-\u024f]/g, "");
    return (clean.length >= 2 ? clean.slice(0, 2) : String(nick || "?").slice(0, 2)).toUpperCase();
  }
  function sidebarAvatarHtml(p) {
    var ini = initials(p.nick);
    if (p.avatar) {
      return '<img src="' + esc(p.avatar) + '" alt="" onerror="this.style.display=\'none\'" />' +
             '<span style="display:none">' + esc(ini) + '</span>';
    }
    return esc(ini);
  }

  /* ── LOGIN ────────────────────────────────────────────── */
  function renderLogin() {
    root.innerHTML =
      '<section class="adm-login-card">' +
      '<div class="adm-login-logo" aria-hidden="true">🎮</div>' +
      '<h2 class="adm-login-title">Área administrativa</h2>' +
      '<p class="adm-login-sub">Eternal Pratas — edição de jogadores</p>' +
      '<div class="adm-login-form">' +
      '<div class="adm-field"><label for="admin-username">Usuário</label>' +
      '<input id="admin-username" type="text" value="' + esc(app.username) + '" autocomplete="username" placeholder="seu usuário" /></div>' +
      '<div class="adm-field"><label for="admin-password">Senha</label>' +
      '<input id="admin-password" type="password" autocomplete="current-password" placeholder="••••••••" /></div>' +
      '<button type="button" class="btn btn--primary" id="btn-login" style="width:100%;margin-top:0.5rem">Entrar</button>' +
      '</div>' +
      '<div id="admin-msg" style="margin-top:0.75rem"></div>' +
      '</section>';

    var userEl = document.getElementById("admin-username");
    var passEl = document.getElementById("admin-password");

    function onEnter(e) { if (e.key === "Enter") tryLogin(); }
    userEl.addEventListener("keydown", onEnter);
    passEl.addEventListener("keydown", onEnter);
    document.getElementById("btn-login").addEventListener("click", tryLogin);
  }

  function tryLogin() {
    var enteredUser = (document.getElementById("admin-username").value || "").trim();
    var enteredPass = (document.getElementById("admin-password").value || "");

    if (!enteredUser || !enteredPass) {
      showMsg("Preencha usuário e senha.", "error");
      return;
    }

    var btn = document.getElementById("btn-login");
    if (btn) { btn.disabled = true; btn.textContent = "Verificando…"; }

    StatsData.login(enteredUser, enteredPass)
      .then(function (result) {
        if (!result.ok) {
          showMsg("Usuário ou senha incorretos.", "error");
          if (btn) { btn.disabled = false; btn.textContent = "Entrar"; }
          return;
        }
        app.username = enteredUser;
        app.password = enteredPass;
        StatsData.setStoredUsername(enteredUser);
        StatsData.setStoredPassword(enteredPass);
        showMsg("Carregando dados…", "info");
        Promise.all([StatsData.load(), StatsData.loadPartidas()])
          .then(function (results) {
            var data = results[0];
            if (typeof StatsSchema !== "undefined") data = StatsSchema.normalizeStatsData(data);
            app.data     = data;
            app.partidas = results[1] || { updated: "", matches: [] };
            renderEditor();
          })
          .catch(function () {
            app.data     = StatsData.defaultData();
            app.partidas = { updated: "", matches: [] };
            renderEditor();
          });
      })
      .catch(function () {
        showMsg("Não foi possível verificar o acesso.", "error");
        if (btn) { btn.disabled = false; btn.textContent = "Entrar"; }
      });
  }

  /* ── EDITOR PRINCIPAL ─────────────────────────────────── */
  function renderEditor() {
    if (!app.data.summary) app.data.summary = { matches: 0, wins: 0, losses: 0, roundsPlayed: 0, avgRating: 0 };
    if (!app.data.matches) app.data.matches = [];
    if (!app.data.players) app.data.players = [];

    root.innerHTML =
      '<div class="adm-toolbar">' +
      '<button type="button" class="btn btn--primary" id="btn-save">Salvar alterações</button>' +
      '<button type="button" class="btn btn--ghost" id="btn-export">Exportar backup</button>' +
      '<label class="btn btn--ghost" style="cursor:pointer">Importar backup<input type="file" id="import-file" accept=".json" hidden /></label>' +
      '<a class="btn btn--ghost" href="/jogadores.html" target="_blank">Ver página pública</a>' +
      '<button type="button" class="btn btn--ghost adm-btn-logout" id="btn-logout" style="margin-left:auto">Sair ⏻</button>' +
      '</div>' +
      '<div id="admin-msg"></div>' +
      '<div class="adm-layout">' +
      '<aside class="adm-sidebar">' +
      '<button class="adm-sidebar__item adm-sidebar__item--special" id="adm-btn-general">⚙ Configurações gerais</button>' +
      '<button class="adm-sidebar__item adm-sidebar__item--special" id="adm-btn-partidas">📋 Partidas</button>' +
      '<span class="adm-sidebar__label">Jogadores</span>' +
      '<div id="adm-player-list" class="adm-sidebar__list"></div>' +
      '<button class="adm-sidebar__add" id="btn-add-player">+ Novo jogador</button>' +
      '</aside>' +
      '<main class="adm-main" id="adm-main">' +
      '<div class="adm-empty">👈 Selecione um jogador ou as configurações gerais para começar a editar.</div>' +
      '</main>' +
      '</div>';

    renderSidebar();
    bindToolbar();
    bindSidebarEvents();

    if (app.view === "general") renderGeneral();
    else if (app.view === "partidas") renderPartidas();
    else if (typeof app.view === "number" && app.data.players[app.view]) renderPlayerEditor(app.view);
    else selectGeneral();
  }

  /* ── SIDEBAR ──────────────────────────────────────────── */
  function renderSidebar() {
    var list = document.getElementById("adm-player-list");
    if (!list) return;
    var players = app.data.players || [];

    list.innerHTML = players.map(function (p, i) {
      var active = app.view === i ? " is-active" : "";
      var subname = [(p.firstName || "").trim(), (p.lastName || "").trim()].filter(Boolean).join(" ");
      return (
        '<button class="adm-sidebar__item' + active + '" data-pi="' + i + '">' +
        '<span class="adm-sidebar__avatar">' + sidebarAvatarHtml(p) + '</span>' +
        '<span class="adm-sidebar__names">' +
        '<span class="adm-sidebar__nick">' + esc(p.nick) + '</span>' +
        (subname ? '<span class="adm-sidebar__realname">' + esc(subname) + '</span>' : '') +
        '</span></button>'
      );
    }).join("");

    var genBtn = document.getElementById("adm-btn-general");
    if (genBtn) genBtn.classList.toggle("is-active", app.view === "general");
    var pmBtn = document.getElementById("adm-btn-partidas");
    if (pmBtn) pmBtn.classList.toggle("is-active", app.view === "partidas");

    list.querySelectorAll("[data-pi]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-pi"), 10);
        collectCurrentView();
        app.view = idx;
        app.tab = "identity";
        renderPlayerEditor(idx);
        renderSidebar();
      });
    });
  }

  /* ── NAVEGAÇÃO ────────────────────────────────────────── */
  function selectGeneral() {
    collectCurrentView();
    app.view = "general";
    renderGeneral();
    renderSidebar();
  }

  function collectCurrentView() {
    if (app.view === "general") collectGeneral();
    else if (app.view === "partidas") {
      if (typeof app.partidasMatch === "number" && app.partidas && app.partidas.matches[app.partidasMatch]) {
        AdminPartidasFields.collect(app.partidasMatch, app.partidas.matches[app.partidasMatch]);
      }
    }
    else if (typeof app.view === "number") AdminPlayerFields.collect(app.view, app.data.players[app.view]);
  }

  /* ── PARTIDAS VIEW ────────────────────────────────────── */
  function renderPartidas() {
    app.view = "partidas";
    if (!app.partidas) app.partidas = { updated: "", matches: [] };
    document.getElementById("adm-main").innerHTML = AdminPartidasFields.renderView(app.partidas, app);
    AdminPartidasFields.bindDynamic(root, app);
    renderSidebar();
  }

  /* ── GERAL ────────────────────────────────────────────── */
  function renderGeneral() {
    var d = app.data;
    var matchRows = (d.matches || []).map(function (m, i) {
      return (
        '<div class="adm-dyn-item">' +
        '<div class="adm-dyn-item__head"><span>Partida ' + (i + 1) + ' — ' + esc(m.map || "?") + '</span>' +
        '<button class="adm-dyn-remove" data-rm-match="' + i + '">Remover</button></div>' +
        '<div class="adm-grid-3">' +
        fld("Data", "gm-date-" + i, m.date, "date") +
        fld("Mapa", "gm-map-" + i, m.map) +
        fld("Time A", "gm-ta-" + i, m.teamA) +
        fld("Time B", "gm-tb-" + i, m.teamB) +
        fld("Placar A", "gm-sa-" + i, m.scoreA, "number", 'min="0"') +
        fld("Placar B", "gm-sb-" + i, m.scoreB, "number", 'min="0"') +
        '</div></div>'
      );
    }).join("");

    document.getElementById("adm-main").innerHTML =
      '<div class="adm-general-header"><h2>⚙ Configurações gerais</h2></div>' +
      '<div style="padding:1.25rem 0;">' +

      '<div class="adm-section">' +
      '<p class="adm-section-title">Temporada</p>' +
      '<div class="adm-grid-2">' +
      fld("Nome da temporada", "meta-season", d.season) +
      fld("Última atualização", "meta-updated", d.updated, "date") +
      '</div></div>' +

      '<div class="adm-section">' +
      '<p class="adm-section-title">Resumo geral</p>' +
      '<div class="adm-grid-4">' +
      fld("Partidas", "sum-matches", d.summary.matches, "number", 'min="0" step="1"') +
      fld("Vitórias", "sum-wins", d.summary.wins, "number", 'min="0" step="1"') +
      fld("Derrotas", "sum-losses", d.summary.losses, "number", 'min="0" step="1"') +
      fld("Rounds jogados", "sum-rounds", d.summary.roundsPlayed, "number", 'min="0" step="1"') +
      fld("Rating médio", "sum-avg", d.summary.avgRating, "number", 'min="0" step="0.01" readonly') +
      '</div></div>' +

      '<div class="adm-section">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">' +
      '<p class="adm-section-title" style="margin:0">Histórico de partidas</p>' +
      '<button type="button" class="btn btn--ghost btn--compact" id="btn-add-match">+ Partida</button>' +
      '</div>' +
      '<div class="adm-dyn-list" id="gm-list">' +
      (matchRows || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhuma partida. Clique em + Partida.</p>') +
      '</div></div>' +

      '</div>';

    bindGeneralEvents();
  }

  function collectGeneral() {
    var d = app.data;
    d.season  = val("meta-season", d.season);
    d.updated = val("meta-updated") || new Date().toISOString().slice(0,10);
    d.summary = {
      matches:     parseInt(val("sum-matches") || 0, 10),
      wins:        parseInt(val("sum-wins") || 0, 10),
      losses:      parseInt(val("sum-losses") || 0, 10),
      roundsPlayed:parseInt(val("sum-rounds") || 0, 10),
      avgRating:   parseFloat(val("sum-avg") || 0),
    };
    var newMatches = [];
    (d.matches || []).forEach(function (_, i) {
      var dateEl = document.getElementById("gm-date-" + i);
      if (!dateEl) return;
      newMatches.push({
        date: dateEl.value,
        map: val("gm-map-" + i),
        teamA: val("gm-ta-" + i),
        teamB: val("gm-tb-" + i),
        scoreA: parseInt(val("gm-sa-" + i) || 0, 10),
        scoreB: parseInt(val("gm-sb-" + i) || 0, 10),
      });
    });
    d.matches = newMatches;
  }

  function bindGeneralEvents() {
    var addBtn = document.getElementById("btn-add-match");
    if (addBtn) addBtn.addEventListener("click", function () {
      collectGeneral();
      app.data.matches.push({ date: new Date().toISOString().slice(0,10), map: "Mirage", teamA: "Time A", teamB: "Time B", scoreA: 13, scoreB: 10 });
      renderGeneral();
    });
    root.querySelectorAll("[data-rm-match]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        collectGeneral();
        app.data.matches.splice(parseInt(btn.getAttribute("data-rm-match"), 10), 1);
        renderGeneral();
      });
    });
  }

  /* ── EDITOR DE JOGADOR ────────────────────────────────── */
  function renderPlayerEditor(idx) {
    var p = app.data.players[idx];
    if (!p) return;
    var subname = [(p.firstName || "").trim(), (p.lastName || "").trim()].filter(Boolean).join(" ");
    var avatarHtml = p.avatar
      ? '<img src="' + esc(p.avatar) + '" alt="" onerror="this.style.display=\'none\'" />' + esc(initials(p.nick))
      : esc(initials(p.nick));

    var tabs = [
      { id: "identity", icon: "👤", label: "Identidade" },
      { id: "stats",    icon: "📊", label: "Stats" },
      { id: "matches",  icon: "🎮", label: "Partidas" },
      { id: "clutch",   icon: "⚡", label: "Clutch & Entry" },
      { id: "maps",     icon: "🗺️", label: "Mapas" },
      { id: "weapons",  icon: "🔫", label: "Armas" },
      { id: "ranks",    icon: "🏆", label: "Ranks" },
      { id: "videos",   icon: "🎬", label: "Vídeos" },
    ];

    var tabNav = tabs.map(function (t) {
      return '<button class="adm-tab-btn' + (app.tab === t.id ? " is-active" : "") +
             '" data-tab="' + t.id + '"><span class="adm-tab-icon">' + t.icon + '</span>' + t.label + '</button>';
    }).join("");

    var tabPanels = tabs.map(function (t) {
      return '<div class="adm-tab-panel' + (app.tab === t.id ? " is-active" : "") +
             '" data-panel="' + t.id + '">' +
             AdminPlayerFields.renderTab(t.id, idx, p) +
             '</div>';
    }).join("");

    document.getElementById("adm-main").innerHTML =
      '<div class="adm-player-header">' +
      '<span class="adm-player-header__avatar">' + avatarHtml + '</span>' +
      '<div class="adm-player-header__info">' +
      '<h2 class="adm-player-header__nick">' + esc(p.nick) + '</h2>' +
      (subname ? '<p class="adm-player-header__sub">' + esc(subname) + (p.role ? ' · ' + esc(p.role) : '') + '</p>' : (p.role ? '<p class="adm-player-header__sub">' + esc(p.role) + '</p>' : '')) +
      '</div>' +
      '<div class="adm-player-header__actions">' +
      '<button type="button" class="btn btn--ghost btn--compact" id="btn-refresh-header">↺ Atualizar</button>' +
      '<button type="button" class="btn btn--ghost btn--compact adm-dyn-remove" id="btn-del-player">Remover jogador</button>' +
      '</div>' +
      '</div>' +
      '<div class="adm-tabs">' +
      '<nav class="adm-tab-nav">' + tabNav + '</nav>' +
      tabPanels +
      '</div>';

    bindPlayerEditorEvents(idx);
  }

  function bindPlayerEditorEvents(idx) {
    root.querySelectorAll(".adm-tab-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        AdminPlayerFields.collect(idx, app.data.players[idx]);
        app.tab = btn.getAttribute("data-tab");
        root.querySelectorAll(".adm-tab-btn").forEach(function (b) { b.classList.remove("is-active"); });
        root.querySelectorAll(".adm-tab-panel").forEach(function (p) { p.classList.remove("is-active"); });
        btn.classList.add("is-active");
        var panel = root.querySelector('[data-panel="' + app.tab + '"]');
        if (panel) {
          panel.innerHTML = AdminPlayerFields.renderTab(app.tab, idx, app.data.players[idx]);
          panel.classList.add("is-active");
        }
        AdminPlayerFields.bindDynamic(root, idx, app);
      });
    });

    var refreshBtn = document.getElementById("btn-refresh-header");
    if (refreshBtn) refreshBtn.addEventListener("click", function () {
      AdminPlayerFields.collect(idx, app.data.players[idx]);
      renderPlayerEditor(idx);
      renderSidebar();
    });

    var delBtn = document.getElementById("btn-del-player");
    if (delBtn) delBtn.addEventListener("click", function () {
      if (!confirm('Remover "' + (app.data.players[idx].nick || "jogador") + '"?')) return;
      AdminPlayerFields.collect(idx, app.data.players[idx]);
      app.data.players.splice(idx, 1);
      app.view = app.data.players.length ? 0 : "general";
      app.tab = "identity";
      renderEditor();
    });

    AdminPlayerFields.bindDynamic(root, idx, app);
  }

  /* ── TOOLBAR ──────────────────────────────────────────── */
  function bindToolbar() {
    document.getElementById("btn-save").addEventListener("click", saveToVercel);
    document.getElementById("btn-export").addEventListener("click", exportJson);
    document.getElementById("import-file").addEventListener("change", importJson);
    document.getElementById("adm-btn-general").addEventListener("click", selectGeneral);
    document.getElementById("btn-logout").addEventListener("click", function () {
      StatsData.setStoredUsername("");
      StatsData.setStoredPassword("");
      app.data     = null;
      app.partidas = null;
      app.username = "";
      app.password = "";
      app.view     = null;
      renderLogin();
    });
    document.getElementById("adm-btn-partidas").addEventListener("click", function () {
      collectCurrentView();
      renderPartidas();
    });
    document.getElementById("btn-add-player").addEventListener("click", function () {
      collectCurrentView();
      var newIdx = app.data.players.length;
      app.data.players.push({
        nick: "NovoJogador",
        firstName: "",
        lastName: "",
        avatar: "",
        role: "",
        dashboard: typeof StatsSchema !== "undefined" ? StatsSchema.defaultDashboard() : {},
        highlights: [],
      });
      app.view = newIdx;
      app.tab = "identity";
      renderPlayerEditor(newIdx);
      renderSidebar();
    });
  }

  function bindSidebarEvents() {}

  /* ── COLLECT DATA (full) ──────────────────────────────── */
  function collectAllData() {
    collectCurrentView();
    var d = app.data;
    var total = 0, rating = 0;
    (d.players || []).forEach(function (p) {
      if (p.dashboard && p.dashboard.hltvRating) { rating += p.dashboard.hltvRating; total++; }
    });
    if (d.summary) d.summary.avgRating = total ? Math.round((rating / total) * 100) / 100 : 0;
    return d;
  }

  /* ── SAVE / EXPORT / IMPORT ───────────────────────────── */
  function saveToVercel() {
    var data    = collectAllData();
    var partidas = app.partidas || { updated: "", matches: [] };
    showMsg("Salvando…", "info");
    Promise.all([
      StatsData.save(data, app.password),
      StatsData.savePartidas(partidas, app.password),
    ]).then(function (results) {
      var statsRes   = results[0];
      var partidasRes = results[1];
      if (statsRes.ok && partidasRes.ok) {
        showMsg("Salvo com sucesso! Jogadores e partidas atualizados.", "ok");
        renderSidebar();
        return;
      }
      if (statsRes.ok && !partidasRes.ok) {
        var body = (partidasRes && partidasRes.body) || {};
        var msg = body.error === "blob_not_configured"
          ? "Jogadores salvos. Partidas: Blob não configurado (exporte o backup)."
          : "Jogadores salvos. Partidas com erro — tente exportar o backup.";
        showMsg(msg, "error");
        return;
      }
      var body = (statsRes && statsRes.body) || {};
      var msg = body.error === "blob_not_configured"
        ? "Blob não configurado. Exporte um backup e envie ao responsável."
        : statsRes.status === 401 ? "Senha incorreta."
        : "Não foi possível salvar. Tente exportar um backup.";
      showMsg(msg, "error");
    });
  }

  function exportJson() {
    var date   = new Date().toISOString().slice(0, 10);
    var data   = collectAllData();
    var partidas = app.partidas || { updated: "", matches: [] };

    function download(obj, name) {
      var blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
      var a    = document.createElement("a");
      a.href   = URL.createObjectURL(blob);
      a.download = name;
      a.click();
      URL.revokeObjectURL(a.href);
    }

    download(data,    "jogadores-backup-" + date + ".json");
    setTimeout(function () {
      download(partidas, "partidas-backup-" + date + ".json");
    }, 300);
    showMsg("Backups exportados (jogadores + partidas).", "ok");
  }

  function importJson(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        app.data = JSON.parse(reader.result);
        if (typeof StatsSchema !== "undefined") app.data = StatsSchema.normalizeStatsData(app.data);
        app.view = "general";
        renderEditor();
        showMsg("Dados importados com sucesso.", "ok");
      } catch (err) {
        showMsg("Arquivo inválido.", "error");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  /* ── Helpers de campo (usados em Geral) ──────────────── */
  function fld(label, id, value, type, attrs) {
    type = type || "text";
    attrs = attrs || "";
    return (
      '<div class="adm-field">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" type="' + type + '" value="' + esc(value != null ? value : "") + '" ' + attrs + ' /></div>'
    );
  }
  function selFld(label, id, options, current) {
    var opts = options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (current === o[0] ? " selected" : "") + '>' + esc(o[1]) + '</option>';
    }).join("");
    return '<div class="adm-field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts + '</select></div>';
  }

  /* ── INIT ─────────────────────────────────────────────── */
  if (app.username && app.password) {
    showMsg("Carregando…", "info");
    StatsData.login(app.username, app.password)
      .then(function (result) {
        if (!result.ok) {
          StatsData.setStoredUsername("");
          StatsData.setStoredPassword("");
          renderLogin();
          return;
        }
        Promise.all([StatsData.load(), StatsData.loadPartidas()])
          .then(function (results) {
            var data = results[0];
            if (typeof StatsSchema !== "undefined") data = StatsSchema.normalizeStatsData(data);
            app.data     = data;
            app.partidas = results[1] || { updated: "", matches: [] };
            renderEditor();
          })
          .catch(function () {
            app.data     = StatsData.defaultData();
            app.partidas = { updated: "", matches: [] };
            renderEditor();
          });
      })
      .catch(function () {
        renderLogin();
      });
  } else {
    renderLogin();
  }
})();
