"use strict";

(function () {
  if (!document.querySelector("[data-partidas-page]")) return;

  /* ── utilidades ─────────────────────────────────────────── */
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDate(iso) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }

  function hltvClass(v) {
    if (v >= 1.2) return "pm-hltv--high";
    if (v >= 1.0) return "pm-hltv--mid";
    if (v >= 0.85) return "pm-hltv--low";
    return "pm-hltv--red";
  }

  function kastClass(v) {
    if (v >= 75) return "pm-kast--high";
    if (v >= 60) return "pm-kast--mid";
    return "pm-kast--low";
  }

  function adrDiffHtml(diff) {
    const cls =
      diff > 0 ? "pm-adr-diff--pos" : diff < 0 ? "pm-adr-diff--neg" : "pm-adr-diff--zero";
    const prefix = diff > 0 ? "+" : "";
    return `<span class="pm-adr-diff ${cls}">${prefix}${diff}</span>`;
  }

  /* ── mvp por time ───────────────────────────────────────── */
  function mvpNick(players) {
    return players.reduce((best, p) => (p.hltv > best.hltv ? p : best), players[0]).nick;
  }

  /* ── renderiza tabela de jogadores ─────────────────────── */
  function renderTable(players, teamResult) {
    const mvp = mvpNick(players);
    const rows = players
      .slice()
      .sort((a, b) => b.hltv - a.hltv)
      .map((p) => {
        const isMvp = p.nick === mvp;
        const nickHtml = p.playerId
          ? `<a class="pm-nick-link" href="/jogadores.html?player=${encodeURIComponent(p.playerId)}" title="Ver perfil de ${esc(p.nick)}">${esc(p.nick)}</a>`
          : esc(p.nick);
        return `
          <tr class="${isMvp ? "pm-table__mvp" : ""}">
            <td>
              <span class="pm-nick">
                ${isMvp ? '<span class="pm-mvp-crown" title="MVP da partida">★</span>' : ""}
                ${nickHtml}
              </span>
            </td>
            <td>${p.kills}</td>
            <td>${p.deaths}</td>
            <td>${p.assists}</td>
            <td>${p.damage.toLocaleString("pt-BR")}</td>
            <td>${p.adr}</td>
            <td>${adrDiffHtml(p.adrDiff)}</td>
            <td><span class="pm-hltv ${hltvClass(p.hltv)}">${p.hltv.toFixed(2)}</span></td>
            <td><span class="pm-kast ${kastClass(p.kast)}">${p.kast}%</span></td>
            <td>${p.openKills}</td>
            <td>${p.tradeKills}</td>
          </tr>`;
      })
      .join("");

    return `
      <div class="pm-table-wrap">
        <table class="pm-table" aria-label="Estatísticas do time">
          <thead>
            <tr>
              <th>Jogador</th>
              <th>K</th>
              <th>D</th>
              <th>A</th>
              <th>Dano</th>
              <th>ADR</th>
              <th>ADR ±</th>
              <th>HLTV</th>
              <th>KAST</th>
              <th>Aberturas</th>
              <th>Trades</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  /* ── renderiza scorecard expandido ─────────────────────── */
  function renderScorecard(match) {
    const { teamA, teamB } = match;

    const roundInfo = `
      <div class="pm-scorecard__round-info">
        <div class="pm-round-chip">
          <span class="pm-round-chip__label">T side</span>
          <span class="pm-round-chip__value">${teamA.scoreT} : ${teamB.scoreT}</span>
        </div>
        <div class="pm-round-chip">
          <span class="pm-round-chip__label">CT side</span>
          <span class="pm-round-chip__value">${teamA.scoreCT} : ${teamB.scoreCT}</span>
        </div>
        <div class="pm-round-chip">
          <span class="pm-round-chip__label">Total de rounds</span>
          <span class="pm-round-chip__value">${teamA.score + teamB.score}</span>
        </div>
        ${match.internal ? '<div class="pm-round-chip"><span class="pm-round-chip__label">Tipo</span><span class="pm-round-chip__value" style="color:var(--pm-tie)">Mix interno</span></div>' : ""}
      </div>`;

    const teamBlock = (team) => `
      <div class="pm-team">
        <div class="pm-team__head">
          <span class="pm-team__name">${esc(team.name)}</span>
          <span class="pm-team__result pm-team__result--${team.result}">
            ${team.result === "win" ? "Vitória" : "Derrota"}
          </span>
        </div>
        ${renderTable(team.players, team.result)}
      </div>`;

    return `
      <div class="pm-scorecard">
        ${roundInfo}
        ${teamBlock(teamA)}
        ${teamBlock(teamB)}
      </div>`;
  }

  /* ── renderiza card de partida ──────────────────────────── */
  function renderCard(match, idx) {
    const { teamA, teamB } = match;

    const resultText = (r) => (r === "win" ? "VITÓRIA" : "DERROTA");

    return `
      <article class="pm-card" data-match-idx="${idx}">
        <div class="pm-card__header" role="button" tabindex="0" aria-expanded="false"
             aria-label="Ver detalhes de ${esc(match.map)} — ${fmtDate(match.date)}">

          <span class="pm-card__map-badge">${esc(match.map)}</span>

          <div class="pm-card__match">
            <div class="pm-card__team pm-card__team--a">
              <span class="pm-card__team-name">${esc(teamA.name)}</span>
              <span class="pm-card__result-badge pm-card__result-badge--${teamA.result}">${resultText(teamA.result)}</span>
            </div>

            <div class="pm-card__score">
              <span class="pm-card__score-n pm-card__score-n--${teamA.result}">${teamA.score}</span>
              <span class="pm-card__score-sep">:</span>
              <span class="pm-card__score-n pm-card__score-n--${teamB.result}">${teamB.score}</span>
            </div>

            <div class="pm-card__team pm-card__team--b">
              <span class="pm-card__result-badge pm-card__result-badge--${teamB.result}">${resultText(teamB.result)}</span>
              <span class="pm-card__team-name">${esc(teamB.name)}</span>
            </div>
          </div>

          <div class="pm-card__meta">${fmtDate(match.date)}${match.time ? " · " + match.time : ""}</div>

          <svg class="pm-card__toggle-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <polyline points="5 8 10 13 15 8"/>
          </svg>
        </div>
        ${renderScorecard(match)}
      </article>`;
  }

  /* ── summary ────────────────────────────────────────────── */
  function renderSummary(matches) {
    const total = matches.length;
    const wins = matches.filter((m) => !m.internal && m.teamA.result === "win").length;
    const losses = matches.filter((m) => !m.internal && m.teamA.result === "loss").length;
    const mixes = matches.filter((m) => m.internal).length;

    const allPlayers = {};
    matches.forEach((m) => {
      [...m.teamA.players, ...m.teamB.players].forEach((p) => {
        if (!allPlayers[p.nick]) allPlayers[p.nick] = { kills: 0, games: 0, hltv: 0 };
        allPlayers[p.nick].kills += p.kills;
        allPlayers[p.nick].hltv += p.hltv;
        allPlayers[p.nick].games++;
      });
    });

    let topFrag = { nick: "—", kills: 0 };
    let topRating = { nick: "—", hltv: 0 };
    Object.entries(allPlayers).forEach(([nick, s]) => {
      if (s.kills > topFrag.kills) topFrag = { nick, kills: s.kills };
      const avg = s.hltv / s.games;
      if (avg > topRating.hltv) topRating = { nick, hltv: avg };
    });

    const stats = [
      { value: total, label: "Partidas" },
      { value: wins, label: "Vitórias" },
      { value: losses, label: "Derrotas" },
      { value: mixes, label: "Mix interno" },
      { value: topFrag.nick, label: "Mais kills" },
      { value: topRating.hltv.toFixed(2), label: "Melhor HLTV (" + topRating.nick + ")" },
    ];

    return stats
      .map(
        (s) => `
      <div class="pm-summary__stat">
        <span class="pm-summary__value">${esc(String(s.value))}</span>
        <span class="pm-summary__label">${esc(s.label)}</span>
      </div>`
      )
      .join("");
  }

  /* ── filtros ────────────────────────────────────────────── */
  function buildFilters(matches) {
    const maps = [...new Set(matches.map((m) => m.map))];
    const filters = [
      { key: "all", label: "Todas" },
      { key: "win", label: "Vitórias" },
      { key: "loss", label: "Derrotas" },
      { key: "mix", label: "Mix interno" },
      ...maps.map((m) => ({ key: "map:" + m, label: m })),
    ];
    return filters;
  }

  function matchesFilter(match, key) {
    if (key === "all") return true;
    if (key === "win") return !match.internal && match.teamA.result === "win";
    if (key === "loss") return !match.internal && match.teamA.result === "loss";
    if (key === "mix") return match.internal;
    if (key.startsWith("map:")) return match.map === key.slice(4);
    return true;
  }

  /* ── toggle de card ─────────────────────────────────────── */
  function bindToggle(container) {
    container.querySelectorAll(".pm-card__header").forEach((header) => {
      function toggle() {
        const card = header.closest(".pm-card");
        const open = card.classList.toggle("open");
        header.setAttribute("aria-expanded", open);
      }
      header.addEventListener("click", toggle);
      header.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  /* ── main ───────────────────────────────────────────────── */
  async function init() {
    const listEl = document.getElementById("pm-list");
    const summaryEl = document.getElementById("pm-summary");
    const filtersEl = document.getElementById("pm-filters");

    let data;
    try {
      const res = await fetch("/api/partidas", { cache: "no-store" });
      if (!res.ok) throw new Error("fetch error");
      data = await res.json();
    } catch {
      listEl.innerHTML =
        '<p class="pm-empty"><span class="pm-empty__icon">⚠️</span><br>Erro ao carregar partidas.</p>';
      return;
    }

    const matches = data.matches || [];

    if (!matches.length) {
      listEl.innerHTML =
        '<div class="pm-empty"><div class="pm-empty__icon">🎮</div><p>Nenhuma partida registrada ainda.</p></div>';
      return;
    }

    summaryEl.innerHTML = renderSummary(matches);

    const filters = buildFilters(matches);
    filtersEl.innerHTML = filters
      .map(
        (f) =>
          `<button class="pm-filter-btn${f.key === "all" ? " active" : ""}" data-filter="${esc(f.key)}">${esc(f.label)}</button>`
      )
      .join("");

    let activeFilter = "all";

    function renderList() {
      const visible = matches.filter((m) => matchesFilter(m, activeFilter));
      if (!visible.length) {
        listEl.innerHTML =
          '<div class="pm-empty"><div class="pm-empty__icon">🔍</div><p>Nenhuma partida neste filtro.</p></div>';
        return;
      }
      listEl.innerHTML = visible.map((m, i) => renderCard(m, i)).join("");
      bindToggle(listEl);
    }

    filtersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".pm-filter-btn");
      if (!btn) return;
      activeFilter = btn.dataset.filter;
      filtersEl.querySelectorAll(".pm-filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderList();
    });

    renderList();
  }

  init();
})();
