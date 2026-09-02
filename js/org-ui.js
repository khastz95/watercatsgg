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
    return (
      '<a class="ep-card ep-card--player" href="' +
      playerHref(p) +
      '">' +
      '<span class="ep-card__badge">' +
      esc(papelLabel(p.papel)) +
      "</span>" +
      photoBlock(p) +
      '<div class="ep-card__meta"><h3>' +
      esc(displayNick(p)) +
      "</h3><p>" +
      esc(p.posicao || "") +
      (p.nome && p.nick ? " · " + esc(p.nome) : "") +
      "</p></div></a>"
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
