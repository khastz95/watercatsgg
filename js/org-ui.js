(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function initials(name) {
    var n = String(name || "?").trim();
    return n.slice(0, 2).toUpperCase();
  }

  function fmt(v, digits) {
    if (v == null || v === "") return "—";
    var n = Number(v);
    if (!Number.isFinite(n)) return String(v);
    if (digits == null) return String(n);
    return n.toFixed(digits);
  }

  function pct(v) {
    if (v == null || v === "") return "—";
    return fmt(v, Number(v) % 1 === 0 ? 0 : 1) + "%";
  }

  function papelLabel(papel) {
    if (papel === "titular") return "Titular";
    if (papel === "reserva") return "Reserva";
    if (papel === "coach") return "Coach";
    return papel || "";
  }

  function displayNick(p) {
    return (p && (p.nick || p.nome)) || "A definir";
  }

  function playerHref(p) {
    return "/jogador?id=" + encodeURIComponent(p.id);
  }

  function photoBlock(p, extraClass) {
    var color = "#3ec7ff";
    var name = displayNick(p);
    return (
      '<div class="' +
      (extraClass || "ep-card__photo") +
      '" style="--accent:' +
      color +
      '">' +
      (p && p.foto_url
        ? '<img src="' + esc(p.foto_url) + '" alt="' + esc(name) + '" loading="lazy" onerror="this.remove()">'
        : "") +
      '<span class="ph">' +
      esc(initials(name === "A definir" ? "?" : name)) +
      "</span></div>"
    );
  }

  function playerCard(p) {
    var ranks = [];
    if (p.nivel_gc != null && p.nivel_gc !== "") ranks.push("GC " + p.nivel_gc);
    if (p.nivel_faceit != null && p.nivel_faceit !== "") ranks.push("Faceit " + p.nivel_faceit);
    if (p.rating_premier != null && p.rating_premier !== "") ranks.push("Premier " + p.rating_premier);
    var extra = "";
    if (ranks.length) {
      extra +=
        '<div class="ep-card__ranks">' +
        ranks
          .map(function (r) {
            return '<span class="ep-mini">' + esc(r) + "</span>";
          })
          .join("") +
        "</div>";
    }
    var nums = [];
    if (p.rating != null && p.rating !== "") nums.push("<span><small>Rating</small>" + esc(fmt(p.rating, 2)) + "</span>");
    if (p.kd != null && p.kd !== "") nums.push("<span><small>K/D</small>" + esc(fmt(p.kd, 2)) + "</span>");
    else if (p.mortes) nums.push("<span><small>K/D</small>" + esc(fmt((p.abates || 0) / p.mortes, 2)) + "</span>");
    if (p.adr != null && p.adr !== "") nums.push("<span><small>ADR</small>" + esc(fmt(p.adr, 0)) + "</span>");
    if (nums.length) extra += '<div class="ep-card__stats">' + nums.join("") + "</div>";
    var who = [p.posicao || "", p.idade ? p.idade + " anos" : "", p.pais || ""]
      .filter(Boolean)
      .join(" · ");
    return (
      '<a class="ep-card ep-card--player reveal" href="' +
      playerHref(p) +
      '">' +
      '<span class="ep-card__badge">' +
      esc(papelLabel(p.papel)) +
      "</span>" +
      photoBlock(p) +
      '<div class="ep-card__meta"><h3>' +
      esc(displayNick(p)) +
      "</h3><p>" +
      esc(who || (p.nome && p.nick ? p.nome : "")) +
      "</p>" +
      extra +
      "</div></a>"
    );
  }

  function wr(p) {
    var t = (p.vitorias || 0) + (p.derrotas || 0);
    if (!t) return null;
    return Math.round(((p.vitorias || 0) / t) * 1000) / 10;
  }

  function fetchOrg() {
    return fetch("/api/org", { cache: "no-store" }).then(function (res) {
      if (!res.ok) throw new Error("org");
      return res.json();
    });
  }

  function nextJogo(jogos) {
    var list = (jogos || []).filter(function (j) {
      return j.status !== "encerrado";
    });
    list.sort(function (a, b) {
      return String(a.data || "").localeCompare(String(b.data || ""));
    });
    return list[0] || null;
  }

  function formatData(d, h) {
    if (!d) return h || "";
    var dt = new Date(d + "T12:00:00");
    var txt = dt.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
    return h ? txt + " · " + h : txt;
  }

  global.OrgUI = {
    esc: esc,
    initials: initials,
    fmt: fmt,
    pct: pct,
    papelLabel: papelLabel,
    displayNick: displayNick,
    playerHref: playerHref,
    photoBlock: photoBlock,
    playerCard: playerCard,
    wr: wr,
    fetchOrg: fetchOrg,
    nextJogo: nextJogo,
    formatData: formatData
  };
})(window);
