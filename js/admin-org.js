(function () {
  "use strict";
  var U = window.OrgUI;
  var root = document.getElementById("admin-root");
  if (!root || !U) return;

  var state = {
    user: null,
    elenco: [],
    jogos: [],
    usuarios: [],
    view: "elenco",
    slot: "t1",
    jogoId: null
  };

  function esc(s) {
    return U.esc(s);
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function num(id) {
    var v = val(id);
    if (v === "") return null;
    var n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function msg(text, ok) {
    var el = document.getElementById("adm-msg");
    if (!el) return;
    el.className = "ep-msg" + (ok ? "" : " ep-msg--err");
    el.textContent = text || "";
  }

  function currentPlayer() {
    return state.elenco.find(function (p) {
      return p.id === state.slot;
    }) || state.elenco[0];
  }

  function conexoesText(p) {
    return (p.conexoes || [])
      .map(function (c) {
        return c.tipo + " | " + c.url + (c.rotulo ? " | " + c.rotulo : "");
      })
      .join("\n");
  }

  function parseConexoes(text) {
    return String(text || "")
      .split(/\n+/)
      .map(function (line) {
        var parts = line.split("|").map(function (s) {
          return s.trim();
        });
        if (parts.length < 2 || !parts[0] || !parts[1]) return null;
        return { tipo: parts[0].toLowerCase(), url: parts[1], rotulo: parts[2] || "" };
      })
      .filter(Boolean);
  }

  function collectPlayer() {
    var p = currentPlayer();
    if (!p) return;
    p.nick = val("f-nick");
    p.nome = val("f-nome");
    p.idade = num("f-idade");
    p.posicao = val("f-posicao");
    p.pais = val("f-pais") || "Brasil";
    p.bio = val("f-bio");
    p.steam64 = val("f-steam64");
    p.nivel_gc = num("f-gc");
    p.nivel_faceit = num("f-faceit");
    p.rating_premier = num("f-premier");
    p.rating = num("f-rating");
    p.kd = num("f-kd");
    p.kast = num("f-kast");
    p.taxa_hs = num("f-hs");
    p.adr = num("f-adr");
    p.kpr = num("f-kpr");
    p.dpr = num("f-dpr");
    p.partidas = num("f-partidas") || 0;
    p.vitorias = num("f-vitorias") || 0;
    p.derrotas = num("f-derrotas") || 0;
    p.abates = num("f-abates") || 0;
    p.mortes = num("f-mortes") || 0;
    p.assistencias = num("f-assist") || 0;
    p.conexoes = parseConexoes(val("f-conexoes"));
  }

  function saveOrg() {
    collectPlayer();
    return fetch("/api/org", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ elenco: state.elenco, jogos: state.jogos })
    }).then(function (res) {
      return res.json().then(function (json) {
        if (!res.ok) throw new Error(json.error || "Falha ao salvar");
        state.elenco = json.elenco || state.elenco;
        state.jogos = json.jogos || state.jogos;
        msg("Salvo.", true);
      });
    });
  }

  function field(id, label, value, type) {
    return (
      "<label>" +
      esc(label) +
      '<input id="' +
      id +
      '" type="' +
      (type || "text") +
      '" value="' +
      esc(value == null ? "" : value) +
      '"></label>'
    );
  }

  function renderElenco() {
    var p = currentPlayer();
    if (!p) return "<p>Sem elenco.</p>";
    var slots = state.elenco
      .map(function (s) {
        return (
          '<button type="button" class="adm-slot' +
          (s.id === p.id ? " is-on" : "") +
          '" data-slot="' +
          esc(s.id) +
          '">' +
          esc(U.papelLabel(s.papel)) +
          " · " +
          esc(s.nick || s.id) +
          "</button>"
        );
      })
      .join("");

    return (
      '<div class="adm-org"><div>' +
      slots +
      "</div><div>" +
      "<p class=\"section__label\">" +
      esc(U.papelLabel(p.papel)) +
      "</p>" +
      '<div class="adm-fields">' +
      field("f-nick", "Nick", p.nick) +
      field("f-nome", "Nome", p.nome) +
      field("f-idade", "Idade", p.idade, "number") +
      field("f-posicao", "Posição", p.posicao) +
      field("f-pais", "País", p.pais) +
      field("f-steam64", "Steam64", p.steam64) +
      field("f-gc", "Nível GC", p.nivel_gc, "number") +
      field("f-faceit", "Nível Faceit", p.nivel_faceit, "number") +
      field("f-premier", "Premier", p.rating_premier, "number") +
      field("f-rating", "Rating", p.rating, "number") +
      field("f-kd", "K/D", p.kd, "number") +
      field("f-kast", "KAST %", p.kast, "number") +
      field("f-hs", "HS %", p.taxa_hs, "number") +
      field("f-adr", "ADR", p.adr, "number") +
      field("f-kpr", "KPR", p.kpr, "number") +
      field("f-dpr", "DPR", p.dpr, "number") +
      field("f-partidas", "Partidas", p.partidas, "number") +
      field("f-vitorias", "Vitórias", p.vitorias, "number") +
      field("f-derrotas", "Derrotas", p.derrotas, "number") +
      field("f-abates", "Abates", p.abates, "number") +
      field("f-mortes", "Mortes", p.mortes, "number") +
      field("f-assist", "Assistências", p.assistencias, "number") +
      '<label class="full">Bio<textarea id="f-bio">' +
      esc(p.bio) +
      "</textarea></label>" +
      '<label class="full">Conexões (uma por linha: tipo | url | rótulo)<textarea id="f-conexoes">' +
      esc(conexoesText(p)) +
      "</textarea></label>" +
      '<label class="full">Foto<input id="f-foto" type="file" accept="image/jpeg,image/png,image/webp,image/gif"></label>' +
      "</div>" +
      '<p style="margin-top:1rem"><button type="button" class="btn btn--primary" id="btn-save">Salvar elenco</button></p>' +
      "</div></div>"
    );
  }

  function renderJogos() {
    var list = state.jogos
      .map(function (j) {
        return (
          '<button type="button" class="adm-slot' +
          (state.jogoId === j.id ? " is-on" : "") +
          '" data-jogo="' +
          esc(j.id) +
          '">' +
          esc(j.data || "sem data") +
          " · " +
          esc(j.adversario || "adversário") +
          "</button>"
        );
      })
      .join("");

    var j = state.jogos.find(function (x) {
      return x.id === state.jogoId;
    }) || state.jogos[0];
    if (j) state.jogoId = j.id;

    var checks = state.elenco
      .map(function (p) {
        var on = j && (j.escalacao || []).some(function (e) {
          return e.elenco_id === p.id;
        });
        return (
          '<label style="flex-direction:row;align-items:center;gap:.4rem">' +
          '<input type="checkbox" data-esc="' +
          esc(p.id) +
          '"' +
          (on ? " checked" : "") +
          "> " +
          esc(p.nick || p.id) +
          " (" +
          esc(U.papelLabel(p.papel)) +
          ")</label>"
        );
      })
      .join("");

    var form = j
      ? '<div class="adm-fields">' +
        field("j-adversario", "Adversário", j.adversario) +
        field("j-data", "Data", j.data, "date") +
        field("j-hora", "Hora", j.hora) +
        field("j-campeonato", "Campeonato", j.campeonato) +
        field("j-formato", "Formato", j.formato) +
        field("j-mapas", "Mapas", j.mapas) +
        '<label>Status<select id="j-status">' +
        ["agendado", "ao_vivo", "encerrado"]
          .map(function (s) {
            return (
              '<option value="' +
              s +
              '"' +
              (j.status === s ? " selected" : "") +
              ">" +
              s +
              "</option>"
            );
          })
          .join("") +
        "</select></label>" +
        field("j-pcasa", "Placar EP", j.placar_casa, "number") +
        field("j-pfora", "Placar rival", j.placar_fora, "number") +
        field("j-stream", "Stream / URL", j.streaming_url) +
        '<label class="full">Notas<textarea id="j-notas">' +
        esc(j.notas) +
        "</textarea></label>" +
        '<div class="full"><p class="section__label">Escalação</p>' +
        checks +
        "</div></div>"
      : "<p class=\"ep-empty\">Crie o primeiro jogo.</p>";

    return (
      '<div class="adm-org"><div>' +
      list +
      '<button type="button" class="btn btn--ghost" id="btn-new-jogo" style="width:100%;margin-top:.6rem">Novo jogo</button>' +
      "</div><div>" +
      form +
      (j
        ? '<p style="margin-top:1rem;display:flex;gap:.5rem"><button type="button" class="btn btn--primary" id="btn-save-jogo">Salvar jogo</button>' +
          '<button type="button" class="btn btn--ghost" id="btn-del-jogo">Remover</button></p>'
        : "") +
      "</div></div>"
    );
  }

  function renderUsers() {
    var rows = (state.usuarios || [])
      .map(function (u) {
        return "<li><strong>" + esc(u.usuario) + "</strong> · " + esc(u.papel) + " · " + esc(u.nome || "") + "</li>";
      })
      .join("");
    return (
      "<div>" +
      "<ul>" +
      (rows || "<li>Nenhum usuário extra ainda. O admin do ambiente entra com o usuário padrão.</li>") +
      "</ul>" +
      '<div class="adm-fields" style="margin-top:1rem;max-width:32rem">' +
      field("u-user", "Usuário", "") +
      field("u-nome", "Nome", "") +
      field("u-pass", "Senha", "", "password") +
      '<label>Papel<select id="u-papel"><option value="membro">membro</option><option value="admin">admin</option></select></label>' +
      "</div>" +
      '<p style="margin-top:1rem"><button type="button" class="btn btn--primary" id="btn-add-user">Criar acesso</button></p>' +
      "</div>"
    );
  }

  function render() {
    root.innerHTML =
      '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:1rem 0 1.25rem">' +
      '<button type="button" class="btn ' +
      (state.view === "elenco" ? "btn--primary" : "btn--ghost") +
      '" data-view="elenco">Elenco</button>' +
      '<button type="button" class="btn ' +
      (state.view === "jogos" ? "btn--primary" : "btn--ghost") +
      '" data-view="jogos">Jogos</button>' +
      '<button type="button" class="btn ' +
      (state.view === "acessos" ? "btn--primary" : "btn--ghost") +
      '" data-view="acessos">Acessos</button>' +
      "</div>" +
      '<div id="adm-msg" class="ep-msg"></div>' +
      (state.view === "elenco" ? renderElenco() : state.view === "jogos" ? renderJogos() : renderUsers());
  }

  function collectJogo() {
    var j = state.jogos.find(function (x) {
      return x.id === state.jogoId;
    });
    if (!j) return;
    j.adversario = val("j-adversario");
    j.data = val("j-data") || null;
    j.hora = val("j-hora");
    j.campeonato = val("j-campeonato");
    j.formato = val("j-formato") || "MD3";
    j.mapas = val("j-mapas");
    j.status = val("j-status") || "agendado";
    j.placar_casa = num("j-pcasa");
    j.placar_fora = num("j-pfora");
    j.streaming_url = val("j-stream");
    j.notas = val("j-notas");
    j.escalacao = Array.prototype.map
      .call(document.querySelectorAll("[data-esc]:checked"), function (el, i) {
        var id = el.getAttribute("data-esc");
        var p = state.elenco.find(function (x) {
          return x.id === id;
        });
        return { elenco_id: id, papel: p ? p.papel : "titular", ordem: i };
      });
  }

  root.addEventListener("click", function (e) {
    var view = e.target.getAttribute("data-view");
    if (view) {
      if (state.view === "elenco") collectPlayer();
      if (state.view === "jogos") collectJogo();
      state.view = view;
      render();
      return;
    }
    var slot = e.target.getAttribute("data-slot");
    if (slot) {
      collectPlayer();
      state.slot = slot;
      render();
      return;
    }
    var jogo = e.target.getAttribute("data-jogo");
    if (jogo) {
      collectJogo();
      state.jogoId = jogo;
      render();
      return;
    }
    if (e.target.id === "btn-save") {
      saveOrg().catch(function (err) {
        msg(err.message);
      });
    }
    if (e.target.id === "btn-new-jogo") {
      collectJogo();
      var id = "jogo-" + Date.now();
      state.jogos.push({
        id: id,
        data: "",
        hora: "",
        adversario: "",
        campeonato: "",
        formato: "MD3",
        mapas: "",
        status: "agendado",
        escalacao: state.elenco
          .filter(function (p) {
            return p.papel === "titular" || p.papel === "coach";
          })
          .map(function (p, i) {
            return { elenco_id: p.id, papel: p.papel, ordem: i };
          })
      });
      state.jogoId = id;
      render();
    }
    if (e.target.id === "btn-save-jogo") {
      collectJogo();
      saveOrg().catch(function (err) {
        msg(err.message);
      });
    }
    if (e.target.id === "btn-del-jogo") {
      state.jogos = state.jogos.filter(function (j) {
        return j.id !== state.jogoId;
      });
      state.jogoId = state.jogos[0] ? state.jogos[0].id : null;
      saveOrg().then(render).catch(function (err) {
        msg(err.message);
      });
    }
    if (e.target.id === "btn-add-user") {
      fetch("/api/usuarios", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario: val("u-user"),
          senha: val("u-pass"),
          nome: val("u-nome"),
          papel: val("u-papel") || "membro"
        })
      })
        .then(function (res) {
          return res.json().then(function (json) {
            if (!res.ok) throw new Error(json.error || "Falha");
            return json;
          });
        })
        .then(function () {
          return fetch("/api/usuarios", { credentials: "include" });
        })
        .then(function (res) {
          return res.json();
        })
        .then(function (json) {
          state.usuarios = json.usuarios || [];
          msg("Acesso criado.", true);
          render();
        })
        .catch(function (err) {
          msg(err.message);
        });
    }
  });

  root.addEventListener("change", function (e) {
    if (e.target.id !== "f-foto" || !e.target.files || !e.target.files[0]) return;
    var file = e.target.files[0];
    var reader = new FileReader();
    reader.onload = function () {
      fetch("/api/foto", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alvo: "org",
          playerId: state.slot,
          mime: file.type,
          data: reader.result
        })
      })
        .then(function (res) {
          return res.json().then(function (json) {
            if (!res.ok) throw new Error(json.error || "Upload falhou");
            return json;
          });
        })
        .then(function (json) {
          var p = currentPlayer();
          if (p) p.foto_url = json.url;
          msg("Foto enviada.", true);
        })
        .catch(function (err) {
          msg(err.message);
        });
    };
    reader.readAsDataURL(file);
  });

  fetch("/api/sessao", { credentials: "include" })
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      if (!json.user || json.user.papel !== "admin") {
        window.location.replace("/entrar?next=/admin");
        return null;
      }
      state.user = json.user;
      return Promise.all([
        U.fetchOrg(),
        fetch("/api/usuarios", { credentials: "include" }).then(function (r) {
          return r.json();
        })
      ]);
    })
    .then(function (pack) {
      if (!pack) return;
      state.elenco = pack[0].elenco || [];
      state.jogos = pack[0].jogos || [];
      state.usuarios = pack[1].usuarios || [];
      if (state.elenco[0]) state.slot = state.elenco[0].id;
      render();
    })
    .catch(function () {
      root.innerHTML = '<p class="ep-empty">Não foi possível abrir o painel.</p>';
    });
})();
