(function () {
  "use strict";

  var MIN_PLAYERS = 2;
  var DRAW_MS = 2600;

  var ta = document.getElementById("sorteio-nomes");
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
  var countA = document.getElementById("sorteio-count-a");
  var countB = document.getElementById("sorteio-count-b");
  var list1 = document.getElementById("sorteio-time1");
  var list2 = document.getElementById("sorteio-time2");
  var againBtn = document.getElementById("sorteio-again");
  var copyBtn = document.getElementById("sorteio-copy");

  if (!ta || !btn || !feedback || !wrap || !list1 || !list2) return;

  var lastTeams = null;
  var drawing = false;
  var rafId = null;
  var drawTimer = null;

  var PHASES = [
    { until: 0.55, label: "Misturando nicks…", tickMin: 45, tickMax: 95 },
    { until: 0.88, label: "Distribuindo nos times…", tickMin: 90, tickMax: 180 },
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

  function parseNames(text) {
    return text
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(function (s) {
        return s.length > 0;
      });
  }

  function findDuplicates(names) {
    var seen = {};
    var dup = false;
    names.forEach(function (n) {
      var k = n.toLowerCase();
      if (seen[k]) dup = true;
      seen[k] = true;
    });
    return dup;
  }

  function splitTeams(names) {
    var shuffled = shuffle(names);
    var cut = Math.ceil(shuffled.length / 2);
    return {
      teamA: shuffled.slice(0, cut),
      teamB: shuffled.slice(cut),
    };
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

  function updateUI() {
    var names = parseNames(ta.value);
    var n = names.length;
    var dup = findDuplicates(names);

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
        chipsWrap.innerHTML = names
          .slice(0, 24)
          .map(function (name, i) {
            return (
              '<span class="sorteio-chip hub-chip" style="animation-delay:' +
              i * 0.03 +
              's">' +
              escapeHtml(name) +
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
      setFeedback("Pronto para sortear " + n + " jogadores.", "");
    } else if (n >= MIN_PLAYERS && !dup && lastTeams) {
      setFeedback("", "");
    } else if (n === 0) {
      setFeedback("", "");
      lastTeams = null;
      setArenaState("empty");
    }
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderList(ol, names) {
    ol.innerHTML = "";
    names.forEach(function (n, i) {
      var li = document.createElement("li");
      li.textContent = n;
      li.style.animationDelay = 0.08 + i * 0.07 + "s";
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
    if (countA) countA.textContent = String(a.length);
    if (countB) countB.textContent = String(b.length);

    renderList(list1, a);
    renderList(list2, b);

    setArenaState("result");

    var balance =
      Math.abs(a.length - b.length) <= 1
        ? "Times equilibrados."
        : "Sorteio feito.";
    setFeedback(balance + " Time A: " + a.length + " · Time B: " + b.length + ".", "ok");

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
    if (drawTimer) {
      clearTimeout(drawTimer);
      drawTimer = null;
    }
    drawing = false;
    btn.classList.remove("is-busy");
    resetDrawingUI();
  }

  function runDraw() {
    var names = parseNames(ta.value);
    setFeedback("", "");

    if (names.length < MIN_PLAYERS) {
      setFeedback("Precisa de pelo menos " + MIN_PLAYERS + " nomes. Contei " + names.length + ".", "erro");
      return;
    }
    if (findDuplicates(names)) {
      setFeedback("Tem nick repetido na lista.", "erro");
      return;
    }

    stopDrawingAnim();
    drawing = true;
    btn.disabled = true;
    btn.classList.add("is-busy");

    var pool = names.slice();
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

      var tickGap =
        phase.tickMin + (phase.tickMax - phase.tickMin) * progress;
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

      var teams = splitTeams(names);
      showResult(teams);
      updateUI();
    }

    rafId = requestAnimationFrame(frame);
  }

  function copyTeams() {
    if (!lastTeams) return;
    var lines = [
      "Time A (" + lastTeams.teamA.length + ")",
      lastTeams.teamA.map(function (n, i) {
        return i + 1 + ". " + n;
      }).join("\n"),
      "",
      "Time B (" + lastTeams.teamB.length + ")",
      lastTeams.teamB.map(function (n, i) {
        return i + 1 + ". " + n;
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

  function loadTurma() {
    if (loadTurmaBtn) loadTurmaBtn.disabled = true;
    setFeedback("Carregando turma…", "");

    fetch("/data/jogadores.json", { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("fetch");
        return r.json();
      })
      .then(function (data) {
        var members = (data && data.members) || [];
        var nicks = members
          .map(function (m) {
            return (m.nick || "").trim();
          })
          .filter(Boolean);
        if (!nicks.length) throw new Error("empty");
        ta.value = nicks.join("\n");
        updateUI();
        setFeedback(nicks.length + " nicks da turma na lista.", "ok");
      })
      .catch(function () {
        setFeedback("Não consegui carregar a turma. Cola os nicks manualmente.", "erro");
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
  btn.addEventListener("click", runDraw);
  if (againBtn) againBtn.addEventListener("click", runDraw);
  if (copyBtn) copyBtn.addEventListener("click", copyTeams);
  if (loadTurmaBtn) loadTurmaBtn.addEventListener("click", loadTurma);
  if (clearBtn) clearBtn.addEventListener("click", clearList);

  setArenaState("empty");
  updateUI();
})();
