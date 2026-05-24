/* AdminPartidasFields — editor completo de partidas */
var AdminPartidasFields = (function () {
  "use strict";

  /* ── Utilidades ──────────────────────────────── */
  function esc(s) {
    if (s == null) return "";
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function fld(label, id, value, type, attrs) {
    type  = type  || "text";
    attrs = attrs || "";
    return (
      '<div class="adm-field">' +
      '<label for="' + id + '">' + esc(label) + '</label>' +
      '<input id="' + id + '" type="' + type + '" value="' + esc(value != null ? value : "") + '" ' + attrs + ' /></div>'
    );
  }
  function selFld(label, id, options, current) {
    var opts = options.map(function (o) {
      return '<option value="' + esc(o[0]) + '"' + (String(current) === o[0] ? " selected" : "") + '>' + esc(o[1]) + '</option>';
    }).join("");
    return '<div class="adm-field"><label for="' + id + '">' + esc(label) + '</label><select id="' + id + '">' + opts + '</select></div>';
  }
  function elVal(id, fb) {
    var el = document.getElementById(id);
    if (!el) return fb != null ? fb : "";
    return el.value.trim();
  }
  function elNum(id, fb) {
    var v = elVal(id, null);
    if (v === null || v === "") return fb != null ? fb : 0;
    var n = parseFloat(v); return isNaN(n) ? (fb != null ? fb : 0) : n;
  }
  function elInt(id, fb) {
    var v = elVal(id, null);
    if (v === null || v === "") return fb != null ? fb : 0;
    var n = parseInt(v, 10); return isNaN(n) ? (fb != null ? fb : 0) : n;
  }
  /* prefixos de ID para evitar colisões */
  function mPfx(idx)           { return "pm" + idx + "_"; }
  function tPfx(idx, side)     { return "pm" + idx + side + "_"; }
  function pPfx(idx, side, pi) { return "pm" + idx + side + "p" + pi + "_"; }

  /* ── Seletor de partidas (topo da view) ──────── */
  function renderPicker(matches, selIdx) {
    if (!matches.length) {
      return '<p class="adm-picker-empty">Nenhuma partida cadastrada. Clique em <strong>+ Nova partida</strong> para começar.</p>';
    }
    var btns = matches.map(function (m, i) {
      var active = i === selIdx ? " is-active" : "";
      var scoreA = m.teamA ? m.teamA.score : "?";
      var scoreB = m.teamB ? m.teamB.score : "?";
      var nameA  = m.teamA ? (m.teamA.name || "Time A") : "Time A";
      var nameB  = m.teamB ? (m.teamB.name || "Time B") : "Time B";
      var date   = (m.date || "").slice(5).split("-").reverse().join("/");
      return (
        '<button class="adm-match-btn' + active + '" data-pm-pick="' + i + '">' +
        '<span class="adm-match-btn__map">' + esc(m.map || "?") + '</span>' +
        '<span class="adm-match-btn__score">' +
          esc(nameA) + ' <strong>' + scoreA + '–' + scoreB + '</strong> ' + esc(nameB) +
        '</span>' +
        '<span class="adm-match-btn__date">' + esc(date) + '</span>' +
        '</button>'
      );
    }).join("");
    return '<div class="adm-match-picker">' + btns + '</div>';
  }

  /* ── Aba Info ─────────────────────────────────── */
  function renderInfoTab(idx, m) {
    var id = mPfx(idx);
    var mapOptions = [
      ["de_ancient","Ancient"],["de_anubis","Anubis"],["de_cache","Cache"],
      ["de_dust2","Dust II"],["de_inferno","Inferno"],["de_mirage","Mirage"],
      ["de_nuke","Nuke"],["de_overpass","Overpass"],["de_train","Train"],
      ["de_vertigo","Vertigo"],["de_cobblestone","Cobblestone"],
    ];
    return (
      '<div class="adm-section">' +
      '<p class="adm-section-title">Informações da partida</p>' +
      '<div class="adm-grid-3">' +
      fld("Data", id + "date", m.date || "", "date") +
      fld("Horário", id + "time", m.time || "", "time") +
      selFld("Mapa", id + "mapCode", mapOptions, m.mapCode || "") +
      fld("Nome exibido do mapa", id + "map", m.map || "", "text", 'placeholder="Ancient"') +
      selFld("Tipo de partida", id + "internal",
        [["false","Mix com externos"],["true","Mix interno (só membros)"]],
        String(!!m.internal)
      ) +
      '</div></div>'
    );
  }

  /* ── Card de jogador ─────────────────────────── */
  function renderPlayerCard(idx, side, pi, p) {
    var pid = pPfx(idx, side, pi);
    var label = p.nick ? esc(p.nick) : ("Jogador " + (pi + 1));
    return (
      '<div class="adm-dyn-item adm-pm-player">' +
      '<div class="adm-dyn-item__head">' +
      '<span class="adm-pm-player__label">' + label + '</span>' +
      '<button type="button" class="adm-dyn-remove" data-rm-pl="' + pi + '" data-pm-idx="' + idx + '" data-pm-side="' + side + '">Remover</button>' +
      '</div>' +

      '<div class="adm-grid-2" style="margin-bottom:0.65rem">' +
      fld("Nick (in-game)", pid + "nick", p.nick || "", "text", 'placeholder="khastz95 =(^-^)="') +
      fld("PlayerID (perfil)", pid + "playerId", p.playerId || "", "text", 'placeholder="khastz95"') +
      '</div>' +

      '<div class="adm-pm-stats-row">' +
      '<div class="adm-pm-stats-row__group">' +
      '<p class="adm-pm-stats-row__title">Básicos</p>' +
      '<div class="adm-grid-6">' +
      fld("K", pid + "k", p.kills, "number", 'min="0" step="1"') +
      fld("D", pid + "d", p.deaths, "number", 'min="0" step="1"') +
      fld("A", pid + "a", p.assists, "number", 'min="0" step="1"') +
      fld("Dmg", pid + "dmg", p.damage, "number", 'min="0" step="1"') +
      fld("ADR", pid + "adr", p.adr, "number", 'min="0" step="0.1"') +
      fld("ADR ±", pid + "adrDiff", p.adrDiff, "number", 'step="1"') +
      '</div></div>' +

      '<div class="adm-pm-stats-row__group">' +
      '<p class="adm-pm-stats-row__title">Avançados</p>' +
      '<div class="adm-grid-4">' +
      fld("HLTV", pid + "hltv", p.hltv, "number", 'min="0" step="0.01"') +
      fld("KAST %", pid + "kast", p.kast, "number", 'min="0" max="100" step="1"') +
      fld("Open K", pid + "openK", p.openKills, "number", 'min="0" step="1"') +
      fld("Trade K", pid + "tradeK", p.tradeKills, "number", 'min="0" step="1"') +
      '</div></div>' +
      '</div>' +

      '</div>'
    );
  }

  /* ── Aba Time ─────────────────────────────────── */
  function renderTeamTab(idx, m, side) {
    var team  = (side === "A" ? m.teamA : m.teamB) || {};
    var players = team.players || [];
    var tid   = tPfx(idx, side);
    var color = side === "A" ? "#5b8def" : "#f07178";
    var sideLabel = side === "A" ? "Time A" : "Time B";

    var playersHtml = players.map(function (p, pi) {
      return renderPlayerCard(idx, side, pi, p);
    }).join("");

    return (
      '<div class="adm-section">' +
      '<p class="adm-section-title" style="color:' + color + '">' + sideLabel + ' — Placar</p>' +
      '<div class="adm-grid-4">' +
      fld("Nome do time", tid + "name", team.name || "") +
      fld("Placar total", tid + "score",  team.score,  "number", 'min="0" step="1"') +
      fld("Rounds como T",  tid + "scoreT", team.scoreT, "number", 'min="0" step="1"') +
      fld("Rounds como CT", tid + "scoreCT",team.scoreCT,"number", 'min="0" step="1"') +
      '</div></div>' +

      '<div class="adm-section">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.75rem">' +
      '<p class="adm-section-title" style="margin:0">' + sideLabel + ' — Jogadores (' + players.length + ')</p>' +
      '<button type="button" class="btn btn--ghost btn--compact" data-add-pl="' + idx + '" data-pm-side="' + side + '">+ Jogador</button>' +
      '</div>' +
      '<div class="adm-dyn-list" id="' + tid + 'plist">' +
      (playersHtml || '<p style="color:var(--text-muted);font-size:0.85rem">Nenhum jogador ainda. Clique em + Jogador.</p>') +
      '</div></div>'
    );
  }

  /* ── Formulário da partida com abas ──────────── */
  function renderMatchForm(idx, match, tab) {
    var nameA = (match.teamA && match.teamA.name) ? match.teamA.name : "Time A";
    var nameB = (match.teamB && match.teamB.name) ? match.teamB.name : "Time B";
    var countA = match.teamA && match.teamA.players ? match.teamA.players.length : 0;
    var countB = match.teamB && match.teamB.players ? match.teamB.players.length : 0;

    var tabs = [
      { id: "info",  icon: "📄", label: "Info" },
      { id: "teamA", icon: "🔵", label: esc(nameA) + " (" + countA + ")" },
      { id: "teamB", icon: "🔴", label: esc(nameB) + " (" + countB + ")" },
    ];

    var tabNav = tabs.map(function (t) {
      return (
        '<button class="adm-tab-btn' + (tab === t.id ? " is-active" : "") + '" data-pm-tab="' + t.id + '">' +
        '<span class="adm-tab-icon">' + t.icon + '</span>' + t.label +
        '</button>'
      );
    }).join("");

    var panelHtml = tab === "info"  ? renderInfoTab(idx, match) :
                    tab === "teamA" ? renderTeamTab(idx, match, "A") :
                    tab === "teamB" ? renderTeamTab(idx, match, "B") : "";

    return (
      '<div class="adm-tabs">' +
      '<div class="adm-match-form-header">' +
      '<nav class="adm-tab-nav" style="flex:1">' + tabNav + '</nav>' +
      '<button type="button" class="btn btn--ghost btn--compact adm-dyn-remove" style="margin-left:0.5rem;flex-shrink:0" data-pm-rm="' + idx + '">✕ Excluir</button>' +
      '</div>' +
      '<div class="adm-tab-panel is-active" id="pm-active-panel">' + panelHtml + '</div>' +
      '</div>'
    );
  }

  /* ── View completa de partidas ───────────────── */
  function renderView(data, app) {
    var matches = (data && data.matches) || [];
    var selIdx  = typeof app.partidasMatch === "number" ? app.partidasMatch : -1;
    var selMatch = selIdx >= 0 ? matches[selIdx] : null;
    var tab = app.partidasTab || "info";

    return (
      '<div class="adm-general-header">' +
      '<div style="display:flex;align-items:center;justify-content:space-between">' +
      '<h2>📋 Partidas</h2>' +
      '<button type="button" class="btn btn--ghost btn--compact" id="btn-add-match-pm">+ Nova partida</button>' +
      '</div></div>' +
      '<div style="padding:1.25rem 0">' +
      renderPicker(matches, selIdx) +
      (selMatch
        ? renderMatchForm(selIdx, selMatch, tab)
        : '<div class="adm-empty">Selecione uma partida acima ou clique em + Nova partida.</div>'
      ) +
      '</div>'
    );
  }

  /* ── Collect Info ────────────────────────────── */
  function collectInfo(idx, m) {
    var id = mPfx(idx);
    if (!document.getElementById(id + "date")) return;
    m.date    = elVal(id + "date",    m.date    || "");
    m.time    = elVal(id + "time",    m.time    || "");
    m.mapCode = elVal(id + "mapCode", m.mapCode || "");
    m.map     = elVal(id + "map",     m.map     || "");
    m.internal = elVal(id + "internal", "false") === "true";
    if (!m.map && m.mapCode) m.map = m.mapCode.replace("de_", "").replace(/^\w/, function(c){ return c.toUpperCase(); });
    if (m.mapCode && m.date) m.id = m.mapCode.replace("de_","") + "-" + m.date.replace(/-/g,"");
  }

  /* ── Collect Team ────────────────────────────── */
  function collectTeam(idx, side, team) {
    var tid = tPfx(idx, side);
    if (!document.getElementById(tid + "name")) return;
    team.name    = elVal(tid + "name",    team.name    || "");
    team.score   = elInt(tid + "score",   0);
    team.scoreT  = elInt(tid + "scoreT",  0);
    team.scoreCT = elInt(tid + "scoreCT", 0);

    var players = [];
    var pi = 0;
    while (true) {
      var pid = pPfx(idx, side, pi);
      var nickEl = document.getElementById(pid + "nick");
      if (!nickEl) break;
      players.push({
        nick:       nickEl.value.trim(),
        playerId:   elVal(pid + "playerId", ""),
        kills:      elInt(pid + "k",      0),
        deaths:     elInt(pid + "d",      0),
        assists:    elInt(pid + "a",      0),
        damage:     elInt(pid + "dmg",    0),
        adr:        elNum(pid + "adr",    0),
        adrDiff:    elInt(pid + "adrDiff",0),
        hltv:       elNum(pid + "hltv",   0),
        kast:       elInt(pid + "kast",   0),
        openKills:  elInt(pid + "openK",  0),
        tradeKills: elInt(pid + "tradeK", 0),
      });
      pi++;
    }
    if (pi > 0) team.players = players;
  }

  /* ── Collect match ───────────────────────────── */
  function collect(idx, match) {
    if (!match) return;
    collectInfo(idx, match);
    match.teamA = match.teamA || {};
    match.teamB = match.teamB || {};
    collectTeam(idx, "A", match.teamA);
    collectTeam(idx, "B", match.teamB);
  }

  /* ── Eventos dinâmicos ───────────────────────── */
  function bindDynamic(root, app) {
    var data    = app.partidas || { matches: [] };
    var matches = data.matches || [];

    function refresh() {
      var el = document.getElementById("adm-main");
      if (!el) return;
      el.innerHTML = renderView(data, app);
      bindDynamic(root, app);
    }

    /* Seletor de partida */
    root.querySelectorAll("[data-pm-pick]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var next = parseInt(btn.getAttribute("data-pm-pick"), 10);
        if (typeof app.partidasMatch === "number" && matches[app.partidasMatch]) {
          collect(app.partidasMatch, matches[app.partidasMatch]);
        }
        app.partidasMatch = next;
        app.partidasTab   = "info";
        refresh();
      });
    });

    /* + Nova partida */
    var addBtn = document.getElementById("btn-add-match-pm");
    if (addBtn) addBtn.addEventListener("click", function () {
      if (typeof app.partidasMatch === "number" && matches[app.partidasMatch]) {
        collect(app.partidasMatch, matches[app.partidasMatch]);
      }
      matches.push({
        id: "nova-" + Date.now(),
        date: new Date().toISOString().slice(0, 10),
        time: "00:00:00",
        map: "Mirage",
        mapCode: "de_mirage",
        internal: true,
        teamA: { name: "Time A", score: 0, scoreT: 0, scoreCT: 0, result: "win",  players: [] },
        teamB: { name: "Time B", score: 0, scoreT: 0, scoreCT: 0, result: "loss", players: [] },
      });
      app.partidasMatch = matches.length - 1;
      app.partidasTab   = "info";
      refresh();
    });

    /* Troca de aba da partida */
    root.querySelectorAll("[data-pm-tab]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (typeof app.partidasMatch === "number" && matches[app.partidasMatch]) {
          collect(app.partidasMatch, matches[app.partidasMatch]);
        }
        app.partidasTab = btn.getAttribute("data-pm-tab");
        var panel = document.getElementById("pm-active-panel");
        if (!panel) return;
        var m = matches[app.partidasMatch];
        var html = app.partidasTab === "info"  ? renderInfoTab(app.partidasMatch, m) :
                   app.partidasTab === "teamA" ? renderTeamTab(app.partidasMatch, m, "A") :
                   app.partidasTab === "teamB" ? renderTeamTab(app.partidasMatch, m, "B") : "";
        panel.innerHTML = html;
        root.querySelectorAll(".adm-tab-btn[data-pm-tab]").forEach(function (b) {
          b.classList.toggle("is-active", b.getAttribute("data-pm-tab") === app.partidasTab);
        });
        /* re-bind apenas os eventos do painel */
        bindPanelEvents(root, app, data, matches, refresh);
      });
    });

    /* Excluir partida */
    root.querySelectorAll("[data-pm-rm]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx = parseInt(btn.getAttribute("data-pm-rm"), 10);
        if (!confirm("Excluir esta partida permanentemente?")) return;
        matches.splice(idx, 1);
        app.partidasMatch = matches.length ? Math.min(idx, matches.length - 1) : null;
        app.partidasTab   = "info";
        refresh();
      });
    });

    bindPanelEvents(root, app, data, matches, refresh);
  }

  function bindPanelEvents(root, app, data, matches, refresh) {
    /* + Jogador */
    root.querySelectorAll("[data-add-pl]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var idx  = parseInt(btn.getAttribute("data-add-pl"), 10);
        var side = btn.getAttribute("data-pm-side");
        if (!matches[idx]) return;
        collect(idx, matches[idx]);
        var team = side === "A" ? matches[idx].teamA : matches[idx].teamB;
        team.players = team.players || [];
        team.players.push({ nick:"", playerId:"", kills:0, deaths:0, assists:0, damage:0, adr:0, adrDiff:0, hltv:0, kast:0, openKills:0, tradeKills:0 });
        app.partidasTab = "team" + side;
        refresh();
      });
    });

    /* Remover jogador */
    root.querySelectorAll("[data-rm-pl]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pi   = parseInt(btn.getAttribute("data-rm-pl"), 10);
        var idx  = parseInt(btn.getAttribute("data-pm-idx"), 10);
        var side = btn.getAttribute("data-pm-side");
        if (!matches[idx]) return;
        collect(idx, matches[idx]);
        var team = side === "A" ? matches[idx].teamA : matches[idx].teamB;
        if (team.players) team.players.splice(pi, 1);
        app.partidasTab = "team" + side;
        refresh();
      });
    });
  }

  /* ── API pública ─────────────────────────────── */
  return {
    renderView:   renderView,
    collect:      collect,
    bindDynamic:  bindDynamic,
  };
})();
