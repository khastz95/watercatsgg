(function () {
  "use strict";

  var HR = window.HubRating;
  var MIN_PLAYERS = 2;
  var DRAW_MS = 2600;
  var BALANCE_ATTEMPTS = 400;

  var ta = document.getElementById("sorteio-nomes");
  var balanceCb = document.getElementById("sorteio-balance");
  var btn = document.getElementById("sorteio-btn");
  var feedback = document.getElementById("sorteio-feedback");
  var counterEl = document.getElementById("sorteio-counter");
  var countNum = document.getElementById("sorteio-count-num");
  var chipsWrap = document.getElementById("sorteio-chips");
  var loadTurmaBtn = document.getElementById("sorteio-load-turma");
  var clearBtn = document.getElementById("sorteio-clear");
  var arena = document.getElementById("sorteio-arena");
  var emptyEl = document.getElementById("sorteio-empty");
  var drawingEl = document.getElementById("sorteio-drawing");
  var drawingLabel = document.getElementById("sorteio-drawing-label");
  var drawingName = document.getElementById("sorteio-drawing-name");
  var drawingBar = document.getElementById("sorteio-drawing-bar");
  var wrap = document.getElementById("sorteio-resultados");
  var scoreEl = document.getElementById("sorteio-score");
  var scoreLevelsEl = document.getElementById("sorteio-score-levels");
  var countA = document.getElementById("sorteio-count-a");
  var countB = document.getElementById("sorteio-count-b");
  var avgAEl = document.getElementById("sorteio-avg-a");
  var avgBEl = document.getElementById("sorteio-avg-b");
  var list1 = document.getElementById("sorteio-time1");
  var list2 = document.getElementById("sorteio-time2");
  var againBtn = document.getElementById("sorteio-again");
  var copyBtn = document.getElementById("sorteio-copy");

  if (!ta || !btn || !feedback || !wrap || !list1 || !list2) return;

  var lastTeams = null;
  var drawing = false;
  var rafId = null;
  var premierByNick = {};

  var PHASES = [
    { until: 0.55, label: "Misturando nicks…", tickMin: 45, tickMax: 95 },
    { until: 0.88, label: "Balanceando levels…", tickMin: 90, tickMax: 180 },
    { until: 1, label: "Fechando o sorteio…", tickMin: 140, tickMax: 220 },
  ];

  function shuffle(arr) {
    var a = arr.slice();
    var i = a.length;
    var j;
    var t;
    while (i > 1) {
      j = Math.floor(Math.random() * i);
      i -= 1;
      t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function clampLevel(n) {
    return HR ? HR.clampLevel(n) : Math.max(0, Math.round(Number(n)) || 0);
  }

  function formatLevel(n) {
    return HR ? HR.formatLevel(n) : clampLevel(n).toLocaleString("pt-BR");
  }

  function ratingClass(level) {
    return HR ? HR.ratingClass(level) : "sorteio-rating";
  }

  function avgLevel(players) {
    if (!players.length) return 0;
    return Math.round(sumLevels(players) / players.length);
  }

  function parseLine(line) {
    var raw = line.trim();
    if (!raw) return null;

    var nick = raw;
    var level = 0;
    var sep = raw.search(/[;,|\t]/);

    if (sep !== -1) {
      nick = raw.slice(0, sep).trim();
      var levelStr = raw.slice(sep + 1).trim().replace(/\./g, "").replace(/\s/g, "");
      if (levelStr !== "") level = clampLevel(levelStr);
    }

    if (!nick) return null;
    return { nick: nick, level: level, key: nick.toLowerCase() };
  }

  function parsePlayers(text) {
    var players = [];
    text.split(/\r?\n/).forEach(function (line) {
      var p = parseLine(line);
      if (p) players.push(p);
    });
    return players;
  }

  function findDuplicates(players) {
    var seen = {};
    var dup = false;
    players.forEach(function (p) {
      if (seen[p.key]) dup = true;
      seen[p.key] = true;
    });
    return dup;
  }

  function sumLevels(players) {
    return players.reduce(function (acc, p) {
      return acc + p.level;
    }, 0);
  }

  function isBalanceOn() {
    return !balanceCb || balanceCb.checked;
  }

  function randomSplit(players) {
    var shuffled = shuffle(players);
    var cut = Math.ceil(shuffled.length / 2);
    var teamA = shuffled.slice(0, cut);
    var teamB = shuffled.slice(cut);
    return {
      teamA: teamA,
      teamB: teamB,
      sumA: sumLevels(teamA),
      sumB: sumLevels(teamB),
      balanced: false,
    };
  }

  function assignGreedy(order, players) {
    var targetA = Math.ceil(players.length / 2);
    var teamA = [];
    var teamB = [];
    var sumA = 0;
    var sumB = 0;

    order.forEach(function (p) {
      if (teamA.length >= targetA) {
        teamB.push(p);
        sumB += p.level;
        return;
      }
      if (teamB.length >= players.length - targetA) {
        teamA.push(p);
        sumA += p.level;
        return;
      }
      if (sumA <= sumB) {
        teamA.push(p);
        sumA += p.level;
      } else {
        teamB.push(p);
        sumB += p.level;
      }
    });

    return { teamA: teamA, teamB: teamB, sumA: sumA, sumB: sumB };
  }

  function balancedSplit(players) {
    var hasLevels = players.some(function (p) {
      return p.level > 0;
    });

    if (!isBalanceOn() || !hasLevels) {
      var rnd = randomSplit(players);
      rnd.balanced = false;
      return rnd;
    }

    var best = null;
    var attempts = Math.max(BALANCE_ATTEMPTS, players.length * 40);

    for (var i = 0; i < attempts; i++) {
      var order = shuffle(players);
      var result = assignGreedy(order, players);
      var diff = Math.abs(result.sumA - result.sumB);

      if (!best || diff < best.diff) {
        best = {
          teamA: result.teamA,
          teamB: result.teamB,
          sumA: result.sumA,
          sumB: result.sumB,
          diff: diff,
        };
      }
      if (best.diff === 0) break;
    }

    best.balanced = true;
    return best;
  }

  function setFeedback(text, kind) {
    feedback.textContent = text;
    feedback.classList.remove("sorteio-feedback--erro", "sorteio-feedback--ok");
    if (kind === "erro") feedback.classList.add("sorteio-feedback--erro");
    if (kind === "ok") feedback.classList.add("sorteio-feedback--ok");
  }

  function resetDrawingUI() {
    if (drawingName) {
      drawingName.textContent = "";
      drawingName.classList.remove("is-tick");
    }
    if (drawingLabel) {
      drawingLabel.textContent = "Misturando nicks…";
      drawingLabel.classList.remove("is-fade");
    }
    if (drawingBar) drawingBar.style.width = "0%";
  }

  function setArenaState(state) {
    if (!arena) return;
    arena.classList.remove("is-drawing", "is-result");

    if (state === "drawing") {
      arena.classList.add("is-drawing");
      if (emptyEl) emptyEl.hidden = true;
      if (drawingEl) drawingEl.hidden = false;
      if (wrap) wrap.hidden = true;
      return;
    }

    if (state === "result") {
      resetDrawingUI();
      arena.classList.add("is-result");
      if (emptyEl) emptyEl.hidden = true;
      if (drawingEl) drawingEl.hidden = true;
      if (wrap) wrap.hidden = false;
      return;
    }

    if (emptyEl) emptyEl.hidden = false;
    if (drawingEl) drawingEl.hidden = true;
    if (wrap) wrap.hidden = true;
    resetDrawingUI();
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function updateUI() {
    var players = parsePlayers(ta.value);
    var n = players.length;
    var dup = findDuplicates(players);
    if (countNum) {
      countNum.textContent = String(n);
      countNum.classList.remove("is-bump");
      void countNum.offsetWidth;
      countNum.classList.add("is-bump");
    }

    if (counterEl) {
      counterEl.classList.remove("sorteio-counter--ready", "sorteio-counter--warn", "hub-stat--ok");
      if (n >= MIN_PLAYERS && !dup) {
        counterEl.classList.add("sorteio-counter--ready", "hub-stat--ok");
      } else if (n > 0) {
        counterEl.classList.add("sorteio-counter--warn");
      }
    }

    if (chipsWrap) {
      if (n === 0) {
        chipsWrap.hidden = true;
        chipsWrap.innerHTML = "";
      } else {
        chipsWrap.hidden = false;
        chipsWrap.innerHTML = players
          .slice(0, 24)
          .map(function (p, i) {
            var lvl =
              p.level > 0
                ? ' <span class="sorteio-chip__lvl ' +
                  ratingClass(p.level) +
                  '">' +
                  formatLevel(p.level) +
                  "</span>"
                : "";
            return (
              '<span class="sorteio-chip hub-chip" style="animation-delay:' +
              i * 0.03 +
              's">' +
              escapeHtml(p.nick) +
              lvl +
              "</span>"
            );
          })
          .join("");
        if (n > 24) {
          chipsWrap.innerHTML +=
            '<span class="sorteio-chip hub-chip">+' + (n - 24) + " mais</span>";
        }
      }
    }

    var canDraw = n >= MIN_PLAYERS && !dup && !drawing;
    btn.disabled = !canDraw;

    if (dup && n > 0) {
      setFeedback("Tem nick repetido — cada um só uma vez.", "erro");
    } else if (n > 0 && n < MIN_PLAYERS) {
      setFeedback("Faltam " + (MIN_PLAYERS - n) + " — precisa de pelo menos " + MIN_PLAYERS + ".", "erro");
    } else if (n >= MIN_PLAYERS && !dup && !lastTeams) {
      var hasLevels = players.some(function (p) {
        return p.level > 0;
      });
      var hint = isBalanceOn() && hasLevels ? " com balanceamento por rating." : ".";
      setFeedback("Pronto para sortear " + n + " jogadores" + hint, "");
    } else if (n >= MIN_PLAYERS && !dup && lastTeams) {
      setFeedback("", "");
    } else if (n === 0) {
      setFeedback("", "");
      lastTeams = null;
      setArenaState("empty");
    }
  }

  function renderList(ol, players) {
    ol.innerHTML = "";
    players.forEach(function (p, i) {
      var li = document.createElement("li");
      li.style.animationDelay = 0.08 + i * 0.07 + "s";

      var nickSpan = document.createElement("span");
      nickSpan.className = "sorteio-player__nick";
      nickSpan.textContent = p.nick;

      li.appendChild(nickSpan);

      if (p.level > 0) {
        var lvlSpan = document.createElement("span");
        lvlSpan.className = "sorteio-player__level " + ratingClass(p.level);
        lvlSpan.textContent = formatLevel(p.level);
        li.appendChild(lvlSpan);
      }

      ol.appendChild(li);
    });
  }

  function showResult(teams) {
    lastTeams = teams;
    var a = teams.teamA;
    var b = teams.teamB;

    if (scoreEl) {
      scoreEl.innerHTML =
        '<span class="sorteio-score__a">' +
        a.length +
        '</span><span class="sorteio-score__sep">×</span><span class="sorteio-score__b">' +
        b.length +
        "</span>";
    }

    var avgA = avgLevel(a);
    var avgB = avgLevel(b);
    var hasRatings = teams.sumA > 0 || teams.sumB > 0;

    if (scoreLevelsEl) {
      if (hasRatings) {
        scoreLevelsEl.hidden = false;
        var diffAvg = Math.abs(avgA - avgB);
        scoreLevelsEl.innerHTML =
          '<span class="sorteio-score__levels-label">Média geral de pontos</span>' +
          '<span class="sorteio-score__avg-row">' +
          '<span class="' +
          ratingClass(avgA) +
          '" title="Time A">A: ' +
          formatLevel(avgA) +
          '</span><span class="sorteio-score__levels-sep">·</span><span class="' +
          ratingClass(avgB) +
          '" title="Time B">B: ' +
          formatLevel(avgB) +
          "</span></span>" +
          (diffAvg > 0
            ? ' <span class="sorteio-score__levels-diff">(Δ média ' + formatLevel(diffAvg) + ")</span>"
            : "");
      } else {
        scoreLevelsEl.hidden = true;
        scoreLevelsEl.textContent = "";
      }
    }

    if (countA) countA.textContent = String(a.length);
    if (countB) countB.textContent = String(b.length);

    function setTeamAvg(el, avg) {
      if (!el) return;
      if (avg > 0) {
        el.hidden = false;
        el.className = "sorteio-team__avg " + ratingClass(avg);
        el.textContent = "méd. " + formatLevel(avg);
      } else {
        el.hidden = true;
        el.textContent = "";
        el.className = "sorteio-team__avg";
      }
    }
    setTeamAvg(avgAEl, avgA);
    setTeamAvg(avgBEl, avgB);

    renderList(list1, a);
    renderList(list2, b);

    setArenaState("result");

    var parts = [];
    if (Math.abs(a.length - b.length) <= 1) parts.push("Quantidade equilibrada");
    if (teams.balanced && (teams.sumA > 0 || teams.sumB > 0)) {
      parts.push("levels balanceados");
    }
    var msg = parts.length ? parts.join(" · ") + "." : "Sorteio feito.";
    setFeedback(msg + " Time A: " + a.length + " · Time B: " + b.length + ".", "ok");

    if (wrap) wrap.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function getPhase(progress) {
    for (var i = 0; i < PHASES.length; i++) {
      if (progress <= PHASES[i].until) return PHASES[i];
    }
    return PHASES[PHASES.length - 1];
  }

  function tickName(pool, lastShown) {
    if (!pool.length) return lastShown;
    var next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      var guard = 0;
      while (next === lastShown && guard < 8) {
        next = pool[Math.floor(Math.random() * pool.length)];
        guard += 1;
      }
    }
    return next;
  }

  function flashName(text) {
    if (!drawingName) return;
    drawingName.textContent = text;
    drawingName.classList.remove("is-tick");
    void drawingName.offsetWidth;
    drawingName.classList.add("is-tick");
  }

  function stopDrawingAnim() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    drawing = false;
    btn.classList.remove("is-busy");
    resetDrawingUI();
  }

  function validatePlayers(players) {
    if (players.length < MIN_PLAYERS) {
      setFeedback("Precisa de pelo menos " + MIN_PLAYERS + " jogadores. Contei " + players.length + ".", "erro");
      return false;
    }
    if (findDuplicates(players)) {
      setFeedback("Tem nick repetido na lista.", "erro");
      return false;
    }
    return true;
  }

  function runDraw() {
    var players = parsePlayers(ta.value);
    setFeedback("", "");

    if (!validatePlayers(players)) return;

    stopDrawingAnim();
    drawing = true;
    btn.disabled = true;
    btn.classList.add("is-busy");

    var pool = players.map(function (p) {
      return p.nick;
    });
    var lastShown = "";
    var drawStart = performance.now();
    var lastTickAt = 0;

    resetDrawingUI();
    setArenaState("drawing");
    flashName(pool[0] || "");

    function frame(now) {
      if (!drawing) return;

      var elapsed = now - drawStart;
      var progress = Math.min(1, elapsed / DRAW_MS);

      if (drawingBar) drawingBar.style.width = progress * 100 + "%";

      var phase = getPhase(progress);
      if (drawingLabel && drawingLabel.textContent !== phase.label) {
        drawingLabel.textContent = phase.label;
        drawingLabel.classList.add("is-fade");
        requestAnimationFrame(function () {
          if (drawingLabel) drawingLabel.classList.remove("is-fade");
        });
      }

      var tickGap = phase.tickMin + (phase.tickMax - phase.tickMin) * progress;
      if (now - lastTickAt >= tickGap) {
        lastShown = tickName(pool, lastShown);
        flashName(lastShown);
        lastTickAt = now;
      }

      if (progress < 1) {
        rafId = requestAnimationFrame(frame);
        return;
      }

      drawing = false;
      rafId = null;
      resetDrawingUI();

      var teams = balancedSplit(players);
      showResult(teams);
      updateUI();
    }

    rafId = requestAnimationFrame(frame);
  }

  function copyTeams() {
    if (!lastTeams) return;
    var avgTa = avgLevel(lastTeams.teamA);
    var avgTb = avgLevel(lastTeams.teamB);
    var lines = [
      "Time A (" +
        lastTeams.teamA.length +
        " jogadores" +
        (avgTa > 0 ? " · média " + formatLevel(avgTa) : "") +
        (lastTeams.sumA > 0 ? " · total " + formatLevel(lastTeams.sumA) : "") +
        ")",
      lastTeams.teamA.map(function (p, i) {
        return i + 1 + ". " + p.nick + (p.level > 0 ? " — " + formatLevel(p.level) : "");
      }).join("\n"),
      "",
      "Time B (" +
        lastTeams.teamB.length +
        " jogadores" +
        (avgTb > 0 ? " · média " + formatLevel(avgTb) : "") +
        (lastTeams.sumB > 0 ? " · total " + formatLevel(lastTeams.sumB) : "") +
        ")",
      lastTeams.teamB.map(function (p, i) {
        return i + 1 + ". " + p.nick + (p.level > 0 ? " — " + formatLevel(p.level) : "");
      }).join("\n"),
    ];
    var text = lines.join("\n");

    function done(ok) {
      setFeedback(ok ? "Lista copiada." : "Não deu para copiar — seleciona e copia manual.", ok ? "ok" : "erro");
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        done(true);
      }).catch(function () {
        fallbackCopy(text, done);
      });
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, done) {
    var el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    try {
      done(document.execCommand("copy"));
    } catch (e) {
      done(false);
    }
    document.body.removeChild(el);
  }

  function buildPremierMap(statsData) {
    premierByNick = {};
    var list = (statsData && statsData.players) || [];
    list.forEach(function (pl) {
      var nick = (pl.nick || "").trim();
      if (!nick) return;
      var prem = pl.dashboard && pl.dashboard.ranks && pl.dashboard.ranks.premier;
      if (!prem || !prem.length) return;
      var rating = prem[0].rating;
      if (rating == null) return;
      premierByNick[nick.toLowerCase()] = clampLevel(rating);
    });
  }

  function loadTurma() {
    if (loadTurmaBtn) loadTurmaBtn.disabled = true;
    setFeedback("Carregando turma e levels…", "");

    Promise.all([
      fetch("/data/jogadores.json", { cache: "no-store" }),
      fetch("/data/estatisticas.json", { cache: "no-store" }),
    ])
      .then(function (responses) {
        if (!responses[0].ok) throw new Error("jogadores");
        return Promise.all([responses[0].json(), responses[1].ok ? responses[1].json() : {}]);
      })
      .then(function (payload) {
        var jogadores = payload[0];
        var stats = payload[1];
        var members = (jogadores && jogadores.members) || [];
        buildPremierMap(stats);

        var lines = members
          .map(function (m) {
            var nick = (m.nick || "").trim();
            if (!nick) return "";
            var lvl = premierByNick[nick.toLowerCase()];
            if (lvl != null && lvl > 0) return nick + ";" + lvl;
            return nick;
          })
          .filter(Boolean);

        if (!lines.length) throw new Error("empty");
        ta.value = lines.join("\n");
        updateUI();
        var withLevel = lines.filter(function (l) {
          return l.indexOf(";") !== -1;
        }).length;
        setFeedback(
          lines.length + " jogadores na lista" +
            (withLevel ? " (" + withLevel + " com level Premier)." : "."),
          "ok"
        );
      })
      .catch(function () {
        setFeedback("Não consegui carregar a turma. Cola nick;level manualmente.", "erro");
      })
      .finally(function () {
        if (loadTurmaBtn) loadTurmaBtn.disabled = false;
      });
  }

  function clearList() {
    stopDrawingAnim();
    ta.value = "";
    lastTeams = null;
    setArenaState("empty");
    updateUI();
    setFeedback("Lista limpa.", "");
    ta.focus();
  }

  ta.addEventListener("input", updateUI);
  if (balanceCb) balanceCb.addEventListener("change", updateUI);
  btn.addEventListener("click", runDraw);
  if (againBtn) againBtn.addEventListener("click", runDraw);
  if (copyBtn) copyBtn.addEventListener("click", copyTeams);
  if (loadTurmaBtn) loadTurmaBtn.addEventListener("click", loadTurma);
  if (clearBtn) clearBtn.addEventListener("click", clearList);

  setArenaState("empty");
  updateUI();
})();
