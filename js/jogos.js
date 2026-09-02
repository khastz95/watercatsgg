(function () {
  "use strict";
  var U = window.OrgUI;
  if (!U) return;
  var root = document.getElementById("jogos-root");
  if (!root) return;

  function byId(elenco) {
    var map = {};
    (elenco || []).forEach(function (p) {
      map[p.id] = p;
    });
    return map;
  }

  function lineupHtml(jogo, map) {
    var rows = (jogo.escalacao || []).slice().sort(function (a, b) {
      return (a.ordem || 0) - (b.ordem || 0);
    });
    if (!rows.length) {
      return '<p class="ep-empty">Escalação ainda não publicada.</p>';
    }
    return (
      '<div class="ep-lineup">' +
      rows
        .map(function (e) {
          var p = map[e.elenco_id] || { id: e.elenco_id, nick: e.elenco_id, papel: e.papel };
          return (
            '<a class="ep-chip" href="' +
            U.playerHref(p) +
            '">' +
            (p.foto_url
              ? '<img src="' + U.esc(p.foto_url) + '" alt="">'
              : '<span class="ph">' + U.esc(U.initials(U.displayNick(p))) + "</span>") +
            U.esc(U.displayNick(p)) +
            "</a>"
          );
        })
        .join("") +
      "</div>"
    );
  }

  function card(j, map) {
    var score =
      j.status === "encerrado" && (j.placar_casa != null || j.placar_fora != null)
        ? (j.placar_casa != null ? j.placar_casa : "–") + " × " + (j.placar_fora != null ? j.placar_fora : "–")
        : "";
    var day = j.data ? new Date(j.data + "T12:00:00").getDate() : "—";
    var mon = j.data
      ? new Date(j.data + "T12:00:00").toLocaleDateString("pt-BR", { month: "short" })
      : U.formatData(j.data, j.hora);
    var maps = String(j.mapas || "")
      .split(/[,/|]+/)
      .map(function (m) {
        return m.trim();
      })
      .filter(Boolean);
    var mapHtml = maps.length
      ? '<div class="ep-maps">' +
        maps
          .map(function (m) {
            return '<span class="ep-mini">' + U.esc(m) + "</span>";
          })
          .join("") +
        "</div>"
      : "";
    var statusLabel = { agendado: "Agendado", ao_vivo: "Ao vivo", encerrado: "Encerrado" };
    return (
      '<article class="ep-match reveal">' +
      '<div class="ep-match__top">' +
      '<div class="ep-date"><strong>' +
      U.esc(String(day)) +
      "</strong><small>" +
      U.esc(mon) +
      (j.hora ? " · " + U.esc(j.hora) : "") +
      "</small></div>" +
      '<span class="ep-status ep-status--' +
      U.esc(j.status) +
      '">' +
      U.esc(statusLabel[j.status] || j.status.replace("_", " ")) +
      "</span></div>" +
      '<div class="ep-match__vs">' +
      U.esc(U.teamTag()) +
      ' <span class="ep-vs">VS</span> ' +
      U.esc(j.adversario || "A definir") +
      (score ? " · " + U.esc(score) : "") +
      "</div>" +
      "<p>" +
      U.esc([j.campeonato, j.formato].filter(Boolean).join(" · ")) +
      "</p>" +
      mapHtml +
      lineupHtml(j, map) +
      "</article>"
    );
  }

  U.fetchOrg()
    .then(function (data) {
      var jogos = data.jogos || [];
      var map = byId(data.elenco);
      if (!jogos.length) {
        root.innerHTML = '<p class="ep-empty">O calendário ainda não possui partidas publicadas.</p>';
        return;
      }

      var filter = "all";

      function render() {
        var list = jogos.filter(function (j) {
          if (filter === "next") return j.status !== "encerrado";
          if (filter === "done") return j.status === "encerrado";
          return true;
        });
        var upcoming = list.filter(function (j) {
          return j.status !== "encerrado";
        });
        var done = list.filter(function (j) {
          return j.status === "encerrado";
        });
        var html =
          '<div class="ep-tabs" role="tablist" aria-label="Filtro do calendário">' +
          '<button type="button" role="tab" aria-selected="' +
          (filter === "all" ? "true" : "false") +
          '" data-filter="all"' +
          (filter === "all" ? ' class="is-on"' : "") +
          ">Todos (" +
          jogos.length +
          ")</button>" +
          '<button type="button" role="tab" aria-selected="' +
          (filter === "next" ? "true" : "false") +
          '" data-filter="next"' +
          (filter === "next" ? ' class="is-on"' : "") +
          ">Próximos</button>" +
          '<button type="button" role="tab" aria-selected="' +
          (filter === "done" ? "true" : "false") +
          '" data-filter="done"' +
          (filter === "done" ? ' class="is-on"' : "") +
          ">Resultados</button></div>";
        if (upcoming.length) {
          html +=
            '<section class="ep-block" style="padding-top:0"><div class="ep-block__head"><div><p class="section__label">Calendário</p><h2>Próximos compromissos</h2></div></div>';
          html += upcoming.map(function (j) {
            return card(j, map);
          }).join("");
          html += "</section>";
        }
        if (done.length) {
          html +=
            '<section class="ep-block"><div class="ep-block__head"><div><p class="section__label">Arquivo</p><h2>Resultados</h2></div></div>';
          html += done.map(function (j) {
            return card(j, map);
          }).join("");
          html += "</section>";
        }
        if (!upcoming.length && !done.length) {
          html += '<p class="ep-empty">Nenhum compromisso nesta visualização.</p>';
        }
        root.innerHTML = html;
        root.querySelectorAll("[data-filter]").forEach(function (btn) {
          btn.addEventListener("click", function () {
            filter = btn.getAttribute("data-filter") || "all";
            render();
          });
        });
        if (window.EP && window.EP.observeReveal) window.EP.observeReveal(root);
      }

      render();
    })
    .catch(function () {
      root.innerHTML = '<p class="ep-empty">Não foi possível carregar o calendário.</p>';
    });
})();
