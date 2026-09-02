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

  U.fetchOrg()
    .then(function (data) {
      var jogos = data.jogos || [];
      var map = byId(data.elenco);
      if (!jogos.length) {
        root.innerHTML = '<p class="ep-empty">Nenhum jogo cadastrado ainda.</p>';
        return;
      }
      var upcoming = jogos.filter(function (j) {
        return j.status !== "encerrado";
      });
      var done = jogos.filter(function (j) {
        return j.status === "encerrado";
      });

      function card(j) {
        var score =
          j.status === "encerrado" && (j.placar_casa != null || j.placar_fora != null)
            ? " · " + (j.placar_casa != null ? j.placar_casa : "–") + " × " + (j.placar_fora != null ? j.placar_fora : "–")
            : "";
        return (
          '<article class="ep-match">' +
          '<div class="ep-match__top">' +
          "<div>" +
          U.esc(U.formatData(j.data, j.hora)) +
          (j.campeonato ? " · " + U.esc(j.campeonato) : "") +
          "</div>" +
          '<span class="ep-status ep-status--' +
          U.esc(j.status) +
          '">' +
          U.esc(j.status.replace("_", " ")) +
          "</span></div>" +
          '<div class="ep-match__vs">Eternal Pratas <span>vs</span> ' +
          U.esc(j.adversario || "A definir") +
          score +
          "</div>" +
          "<p>" +
          U.esc([j.formato, j.mapas].filter(Boolean).join(" · ")) +
          "</p>" +
          lineupHtml(j, map) +
          "</article>"
        );
      }

      var html = "";
      if (upcoming.length) {
        html += '<section class="ep-block"><div class="ep-block__head"><div><p class="section__label">Agenda</p><h2>Próximos jogos</h2></div></div>';
        html += upcoming.map(card).join("");
        html += "</section>";
      }
      if (done.length) {
        html += '<section class="ep-block"><div class="ep-block__head"><div><p class="section__label">Arquivo</p><h2>Resultados</h2></div></div>';
        html += done.map(card).join("");
        html += "</section>";
      }
      root.innerHTML = html || '<p class="ep-empty">Nenhum jogo cadastrado ainda.</p>';
    })
    .catch(function () {
      root.innerHTML = '<p class="ep-empty">Não foi possível carregar os jogos.</p>';
    });
})();
