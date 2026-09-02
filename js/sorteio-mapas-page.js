(function () {
  "use strict";

  var IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp"];
  var CHAMPION_MS = 800;
  var ARENA_EXIT_MS = 420;
  var MARK_MS = 320;
  var VOID_MS = 480;
  var VOID_GAP_BASE = 280;

  var PROGRESS_PHASES = [
    { at: 0, line: "Eliminação em curso", detail: "Todos os mapas entram na arena", status: "Sorteio em andamento." },
    { at: 0.35, line: "Eliminação em curso", detail: "Mapas saem aleatoriamente do pool", status: "Aguarde — não interrompa o sorteio." },
    { at: 0.72, line: "Último mapa em pé", detail: "Só resta um candidato", status: "Quase concluído." },
    { at: 0.92, line: "Mapa definido", detail: "", status: "Sorteio finalizado." },
  ];

  var stage = document.getElementById("mapas-stage");
  if (!stage) return;

  var tabSorteio = document.getElementById("mapas-tab-sorteio");
  var tabVeto = document.getElementById("mapas-tab-veto");
  var statPool = document.getElementById("mapas-stat-pool");
  var statVeto = document.getElementById("mapas-stat-veto");
  var statusEl = document.getElementById("mapas-status");
  var drawWrap = document.getElementById("mapas-draw-wrap");
  var vetoWrap = document.getElementById("mapas-veto-wrap");
  var drawGrid = document.getElementById("mapas-draw-grid");
  var drawLabel = document.getElementById("mapas-draw-label");
  var liveCountEl = document.getElementById("mapas-live-count");
  var vetoLabel = document.getElementById("mapas-veto-label");
  var vetoCountEl = document.getElementById("mapas-veto-count");
  var poolEl = document.getElementById("mapas-pool");
  var resultEl = document.getElementById("mapas-result");
  var resultImg = document.getElementById("mapas-result-img");
  var resultName = document.getElementById("mapas-result-name");
  var resultId = document.getElementById("mapas-result-id");
  var btnAction = document.getElementById("mapas-action");
  var btnActionText = document.getElementById("mapas-action-text");
  var btnReset = document.getElementById("mapas-reset");
  var oracleEl = document.getElementById("mapas-oracle");
  var oracleLine = document.getElementById("mapas-oracle-line");
  var oracleSub = document.getElementById("mapas-oracle-sub");
  var oracleBar = document.getElementById("mapas-oracle-bar");
  var resultOracle = document.getElementById("mapas-result-oracle");

  var oracleRaf = null;
  var drawTimer = null;
  var drawCards = {};
  var drawDurationMs = 9000;

  var maps = [];
  var mode = "sorteio";
  var eliminated = {};
  var winner = null;
  var spinning = false;
  var vetoBusy = false;
  var imageCache = {};

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

  function imageCandidates(map) {
    var id = map.id || "";
    var list = [];
    if (map.image) list.push(map.image);
    IMAGE_EXTS.forEach(function (ext) {
      list.push("/assets/maps/" + id + ext);
    });
    var seen = {};
    return list.filter(function (url) {
      if (!url || seen[url]) return false;
      seen[url] = true;
      return true;
    });
  }

  function resolveImageUrl(map) {
    var key = map.id;
    if (Object.prototype.hasOwnProperty.call(imageCache, key)) {
      return Promise.resolve(imageCache[key]);
    }
    var urls = imageCandidates(map);
    return new Promise(function (resolve) {
      var i = 0;
      function tryNext() {
        if (i >= urls.length) {
          imageCache[key] = null;
          resolve(null);
          return;
        }
        var img = new Image();
        img.onload = function () {
          imageCache[key] = urls[i];
          resolve(urls[i]);
        };
        img.onerror = function () {
          i += 1;
          tryNext();
        };
        img.src = urls[i];
      }
      tryNext();
    });
  }

  function preloadAll() {
    return Promise.all(
      maps.map(function (m) {
        return resolveImageUrl(m);
      })
    );
  }

  function createMedia(map, className) {
    var wrap = document.createElement("div");
    wrap.className = "mapas-media" + (className ? " " + className : "");
    wrap.setAttribute("data-map-name", map.name);

    var img = document.createElement("img");
    img.className = "mapas-media__img";
    img.alt = map.name;
    img.width = 640;
    img.height = 360;
    img.decoding = "async";

    var shine = document.createElement("span");
    shine.className = "mapas-media__shine";
    shine.setAttribute("aria-hidden", "true");

    wrap.appendChild(img);
    wrap.appendChild(shine);

    resolveImageUrl(map).then(function (url) {
      if (url) {
        img.src = url;
        wrap.classList.remove("is-placeholder");
      } else {
        wrap.classList.add("is-placeholder");
      }
    });

    return wrap;
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text || "";
  }

  function setActionLabel(text) {
    if (btnActionText) btnActionText.textContent = text;
    else if (btnAction) btnAction.textContent = text;
  }

  function syncControls() {
    if (btnAction) btnAction.hidden = mode !== "sorteio";
    if (btnReset) btnReset.hidden = mode !== "veto";
  }

  function setProgressLine(title, detail) {
    if (oracleLine) oracleLine.textContent = title || "";
    if (oracleSub) {
      oracleSub.textContent = detail || "";
      oracleSub.hidden = !detail;
    }
  }

  function setProgressPhase(phase) {
    setProgressLine(phase.line, phase.detail);
    if (phase.status) setStatus(phase.status);
  }

  function stopOracleProgress() {
    if (oracleRaf) {
      cancelAnimationFrame(oracleRaf);
      oracleRaf = null;
    }
  }

  function stopDrawAnim() {
    if (drawTimer) {
      clearTimeout(drawTimer);
      drawTimer = null;
    }
  }

  function setArenaCount(el, n) {
    if (el) el.textContent = String(n);
  }

  function setLiveCount(n) {
    setArenaCount(liveCountEl, n);
  }

  function setVetoCount(n) {
    setArenaCount(vetoCountEl, n);
  }

  function startOracleProgress(durationMs) {
    stopOracleProgress();
    var start = performance.now();
    var phaseIdx = 0;
    setProgressPhase(PROGRESS_PHASES[0]);
    if (oracleBar) oracleBar.style.width = "0%";

    function tick(now) {
      if (!spinning) return;
      var p = Math.min(1, (now - start) / durationMs);
      if (oracleBar) oracleBar.style.width = p * 100 + "%";

      while (phaseIdx < PROGRESS_PHASES.length - 1 && p >= PROGRESS_PHASES[phaseIdx + 1].at) {
        phaseIdx += 1;
        setProgressPhase(PROGRESS_PHASES[phaseIdx]);
      }

      if (p < 1) oracleRaf = requestAnimationFrame(tick);
    }

    oracleRaf = requestAnimationFrame(tick);
  }

  function resetProgressUi() {
    stopOracleProgress();
    stopDrawAnim();
    if (oracleEl) oracleEl.classList.remove("is-active", "is-reveal", "is-done");
    if (oracleBar) oracleBar.style.width = "0%";
    setProgressLine("Pronto para sortear", "");
    stage.classList.remove(
      "is-drawing",
      "is-draw-done",
      "is-revealing",
      "is-revealed",
      "mapas-stage--sorteio-result"
    );
    if (drawGrid) drawGrid.classList.remove("is-eliminating", "is-champion-mode");
    if (drawWrap) drawWrap.classList.remove("is-exiting");
  }

  function clearDrawStates() {
    Object.keys(drawCards).forEach(function (id) {
      var card = drawCards[id];
      if (!card) return;
      card.classList.remove(
        "is-marked",
        "is-void",
        "is-champion",
        "is-folded",
        "is-live",
        "is-enter",
        "is-draw-start"
      );
    });
  }

  function updateStats() {
    var left = maps.filter(function (m) {
      return !eliminated[m.id];
    }).length;
    if (statPool) statPool.textContent = String(mode === "veto" ? left : maps.length);
    if (statVeto) {
      statVeto.textContent = String(mode === "veto" ? Object.keys(eliminated).length : 0);
    }
  }

  function getModeFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var m = (params.get("mode") || "").toLowerCase();
    if (m === "veto" || m === "random" || m === "sorteio") return m === "random" ? "sorteio" : m;
    return null;
  }

  function setMode(next) {
    mode = next;
    winner = null;
    eliminated = {};
    spinning = false;
    vetoBusy = false;
    stopDrawAnim();

    if (tabSorteio) {
      tabSorteio.classList.toggle("is-active", mode === "sorteio");
      tabSorteio.setAttribute("aria-selected", mode === "sorteio" ? "true" : "false");
    }
    if (tabVeto) {
      tabVeto.classList.toggle("is-active", mode === "veto");
      tabVeto.setAttribute("aria-selected", mode === "veto" ? "true" : "false");
    }

    stage.classList.remove(
      "mapas-stage--sorteio",
      "mapas-stage--veto",
      "mapas-stage--veto-done",
      "is-drawing",
      "is-draw-done",
      "is-revealing",
      "is-revealed"
    );
    stage.classList.add(mode === "veto" ? "mapas-stage--veto" : "mapas-stage--sorteio");

    if (drawWrap) drawWrap.hidden = mode !== "sorteio";
    if (vetoWrap) vetoWrap.hidden = mode !== "veto";
    if (resultEl) resultEl.hidden = true;

    if (btnAction) {
      btnAction.disabled = !maps.length;
      btnAction.classList.remove("is-busy");
      setActionLabel("Sortear mapa");
    }
    resetProgressUi();
    syncControls();

    if (mode === "sorteio") {
      setStatus(
        maps.length
          ? "Clique em Sortear mapa — eliminação aleatória até sobrar um."
          : "Nenhum mapa no pool."
      );
      renderDrawGrid();
    } else {
      renderPool();
      if (maps.length === 1) {
        showResult(maps[0], "Só há um mapa no pool: " + maps[0].name + ".");
      } else {
        setStatus(maps.length ? "Clique num mapa para vetar. Repete até sobrar um." : "Nenhum mapa no pool.");
      }
    }
    updateStats();
  }

  function hideResult() {
    if (resultEl) {
      resultEl.hidden = true;
      resultEl.classList.remove("is-unveiled");
    }
    if (resultOracle) resultOracle.textContent = "";
    stage.classList.remove("mapas-stage--veto-done", "mapas-stage--sorteio-result");
    if (mode === "sorteio" && drawWrap) {
      drawWrap.classList.remove("is-exiting");
      drawWrap.hidden = false;
    }
    if (mode === "veto" && vetoWrap) vetoWrap.hidden = false;
    syncControls();
  }

  function applyResultImage(map, url) {
    if (!resultImg) return;
    if (url) {
      resultImg.src = url;
      resultImg.alt = map.name;
    } else {
      resultImg.removeAttribute("src");
      resultImg.alt = map.name;
    }
  }

  function unveilResult() {
    if (!resultEl) return;
    resultEl.hidden = false;
    resultEl.classList.remove("is-unveiled");
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        resultEl.classList.add("is-unveiled");
      });
    });
  }

  function showResult(map, message, imageUrl) {
    winner = map;
    if (mode === "sorteio") {
      if (drawWrap) {
        drawWrap.classList.remove("is-exiting");
        drawWrap.hidden = true;
      }
      if (drawGrid) drawGrid.classList.remove("is-champion-mode");
      clearDrawStates();
      stage.classList.add("mapas-stage--sorteio-result");
    }
    if (mode === "veto" && vetoWrap) vetoWrap.hidden = true;

    if (resultName) resultName.textContent = map.name;
    if (resultId) resultId.textContent = map.id;
    if (resultOracle) {
      resultOracle.textContent = mode === "sorteio" ? "Último mapa em pé — definido para o mix." : "";
    }

    if (imageUrl !== undefined) {
      applyResultImage(map, imageUrl);
      unveilResult();
    } else {
      resolveImageUrl(map).then(function (url) {
        applyResultImage(map, url);
        unveilResult();
      });
    }
    if (btnAction && mode === "sorteio") {
      setActionLabel("Sortear de novo");
      btnAction.disabled = false;
      btnAction.classList.remove("is-busy");
    }
    syncControls();
    setStatus(message || "Mapa definido: " + map.name);
  }

  function appendMapCardMeta(card, map) {
    var visual = document.createElement("div");
    visual.className = "mapas-map-card__visual";
    visual.appendChild(createMedia(map, "mapas-media--contain mapas-media--card"));
    card.appendChild(visual);

    var body = document.createElement("div");
    body.className = "mapas-map-card__body";
    var name = document.createElement("span");
    name.className = "mapas-map-card__name";
    name.textContent = map.name;
    var id = document.createElement("span");
    id.className = "mapas-map-card__id";
    id.textContent = map.id;
    body.appendChild(name);
    body.appendChild(id);
    card.appendChild(body);
  }

  function buildDrawCard(map) {
    var card = document.createElement("div");
    card.className = "mapas-map-card mapas-draw-card is-live";
    card.setAttribute("data-map-id", map.id);
    card.setAttribute("role", "listitem");

    appendMapCardMeta(card, map);

    var voidFx = document.createElement("span");
    voidFx.className = "mapas-map-card__overlay mapas-map-card__overlay--danger";
    voidFx.setAttribute("aria-hidden", "true");
    voidFx.textContent = "Eliminado";
    card.appendChild(voidFx);

    return card;
  }

  function renderDrawGrid() {
    if (!drawGrid) return;
    drawGrid.innerHTML = "";
    drawCards = {};
    maps.forEach(function (m, idx) {
      var card = buildDrawCard(m);
      card.style.setProperty("--i", String(idx));
      drawCards[m.id] = card;
      drawGrid.appendChild(card);
    });
    if (drawLabel) drawLabel.textContent = "Pool completo";
    setLiveCount(maps.length);
    clearDrawStates();
  }

  function animateGridEntrance() {
    Object.keys(drawCards).forEach(function (id) {
      drawCards[id].classList.add("is-draw-start");
    });
    requestAnimationFrame(function () {
      Object.keys(drawCards).forEach(function (id) {
        var card = drawCards[id];
        card.classList.remove("is-draw-start");
        card.classList.add("is-enter");
      });
    });
  }

  function estimateDrawDuration(elimCount) {
    var total = 400;
    var i;
    for (i = 0; i < elimCount; i++) {
      total += MARK_MS + VOID_MS + VOID_GAP_BASE + i * 35;
    }
    total += 900;
    return total;
  }

  function lockChampion(pick) {
    if (!spinning) return;
    spinning = false;
    stopOracleProgress();
    stopDrawAnim();

    Object.keys(drawCards).forEach(function (id) {
      var card = drawCards[id];
      if (id === pick.id) {
        card.classList.remove("is-marked", "is-void");
        card.classList.add("is-champion");
      } else {
        card.classList.add("is-folded");
      }
    });

    if (drawGrid) {
      drawGrid.classList.remove("is-eliminating");
      drawGrid.classList.add("is-champion-mode");
    }

    setLiveCount(1);
    stage.classList.remove("is-drawing");
    stage.classList.add("is-draw-done", "is-revealing");
    if (oracleEl) oracleEl.classList.add("is-active", "is-reveal");
    if (oracleBar) oracleBar.style.width = "100%";
    setProgressLine("Último em pé", pick.name);
    setStatus("Revelando o mapa sorteado…");
    if (drawLabel) drawLabel.textContent = "Mapa sorteado";

    drawTimer = setTimeout(function () {
      presentSorteioResult(pick);
    }, CHAMPION_MS);
  }

  function presentSorteioResult(pick) {
    resolveImageUrl(pick).then(function (url) {
      if (drawWrap) drawWrap.classList.add("is-exiting");

      drawTimer = setTimeout(function () {
        if (oracleEl) oracleEl.classList.remove("is-active", "is-reveal", "is-done");
        stage.classList.remove("is-revealing");
        stage.classList.add("is-revealed");
        showResult(pick, "Mapa sorteado: " + pick.name + " — último em pé.", url);
      }, ARENA_EXIT_MS);
    });
  }

  function runEliminationDraw() {
    if (!maps.length || spinning) return;

    if (maps.length === 1) {
      renderDrawGrid();
      showResult(maps[0], "Mapa sorteado: " + maps[0].name + ".");
      return;
    }

    var pick = maps[Math.floor(Math.random() * maps.length)];
    var losers = maps.filter(function (m) {
      return m.id !== pick.id;
    });
    var elimOrder = shuffle(
      losers.map(function (m) {
        return m.id;
      })
    );

    hideResult();
    spinning = true;
    winner = null;

    renderDrawGrid();
    animateGridEntrance();
    drawDurationMs = estimateDrawDuration(elimOrder.length);

    stage.classList.add("is-drawing");
    if (drawGrid) drawGrid.classList.add("is-eliminating");
    if (oracleEl) oracleEl.classList.add("is-active");
    if (drawLabel) drawLabel.textContent = "Eliminando mapas…";
    if (btnAction) {
      btnAction.disabled = true;
      btnAction.classList.add("is-busy");
    }
    setActionLabel("Sorteando…");
    setStatus("Eliminação aleatória — mapas saem até restar um.");
    setLiveCount(maps.length);
    startOracleProgress(drawDurationMs);

    var step = 0;
    var live = maps.length;

    function eliminateNext() {
      if (!spinning) return;

      if (step >= elimOrder.length) {
        lockChampion(pick);
        return;
      }

      var id = elimOrder[step];
      var card = drawCards[id];
      if (!card) {
        step += 1;
        eliminateNext();
        return;
      }

      card.classList.add("is-marked");
      setProgressLine("Eliminação em curso", "Saindo: " + (maps.find(function (m) { return m.id === id; }) || {}).name);

      drawTimer = setTimeout(function () {
        if (!spinning) return;
        card.classList.remove("is-marked");
        card.classList.add("is-void");
        card.classList.remove("is-live");
        live -= 1;
        setLiveCount(live);
        step += 1;

        var gap = VOID_GAP_BASE + step * 35;
        drawTimer = setTimeout(eliminateNext, VOID_MS + gap);
      }, MARK_MS);
    }

    drawTimer = setTimeout(eliminateNext, 500);
  }

  function buildPoolCard(map) {
    var card = document.createElement("button");
    card.type = "button";
    card.className = "mapas-map-card mapas-pool-card";
    card.setAttribute("data-map-id", map.id);
    card.setAttribute("role", "listitem");

    appendMapCardMeta(card, map);

    var ban = document.createElement("span");
    ban.className = "mapas-map-card__overlay mapas-map-card__overlay--danger";
    ban.setAttribute("aria-hidden", "true");
    ban.textContent = "Vetado";
    card.appendChild(ban);

    card.addEventListener("click", function () {
      onVetoClick(map.id, card);
    });

    return card;
  }

  function renderPool() {
    if (!poolEl) return;
    poolEl.innerHTML = "";
    maps.forEach(function (m) {
      poolEl.appendChild(buildPoolCard(m));
    });
    if (vetoLabel) vetoLabel.textContent = "Pool para veto";
    setVetoCount(maps.length);
    syncPool();
  }

  function syncPool() {
    if (!poolEl) return;
    var left = remainingMaps().length;
    setVetoCount(left);
    if (vetoLabel && left <= 1 && !winner) {
      vetoLabel.textContent = left === 1 ? "Último mapa" : "Pool para veto";
    } else if (vetoLabel && !winner) {
      vetoLabel.textContent = "Pool para veto";
    }
    poolEl.querySelectorAll(".mapas-pool-card").forEach(function (card) {
      var id = card.getAttribute("data-map-id");
      var out = !!eliminated[id];
      var blockClick = out || !!winner || vetoBusy || left <= 1;

      card.classList.toggle("is-banned", out);
      card.classList.toggle("is-last", left === 1 && !out && !winner);
      card.disabled = blockClick;
      card.setAttribute("aria-disabled", blockClick ? "true" : "false");
    });
    updateStats();
  }

  function remainingMaps() {
    return maps.filter(function (m) {
      return !eliminated[m.id];
    });
  }

  function onVetoClick(mapId, card) {
    if (mode !== "veto" || eliminated[mapId] || winner || spinning || vetoBusy) return;
    if (remainingMaps().length <= 1) return;

    vetoBusy = true;
    eliminated[mapId] = true;
    card.classList.add("is-banning");
    syncPool();

    var after = remainingMaps();
    var vetoCount = Object.keys(eliminated).length;

    setTimeout(function () {
      card.classList.remove("is-banning");
      card.classList.add("is-banned");

      if (after.length === 1) {
        vetoBusy = false;
        stage.classList.add("mapas-stage--veto-done");
        syncPool();
        showResult(after[0], "Último mapa no pool: " + after[0].name + ".");
        return;
      }

      vetoBusy = false;
      syncPool();
      setStatus("Vetados: " + vetoCount + " · Restam " + after.length + " mapas.");
    }, 580);
  }

  function resetCurrentMode() {
    hideResult();
    eliminated = {};
    winner = null;
    spinning = false;
    vetoBusy = false;
    if (btnAction) {
      btnAction.disabled = !maps.length;
      btnAction.classList.remove("is-busy");
    }
    if (mode === "sorteio") {
      resetProgressUi();
      stage.classList.remove("mapas-stage--sorteio-result");
      setActionLabel("Sortear mapa");
      renderDrawGrid();
      setStatus("Pronto para um novo sorteio.");
    } else {
      stage.classList.remove("mapas-stage--veto-done");
      if (btnReset) btnReset.hidden = false;
      if (vetoWrap) vetoWrap.hidden = false;
      renderPool();
      setStatus(
        maps.length === 1 ? "Só há um mapa no pool." : "Veto reiniciado — clique num mapa para vetar."
      );
    }
    syncControls();
    updateStats();
  }

  function onActionClick() {
    if (!maps.length || mode !== "sorteio") return;
    if (winner) {
      resetCurrentMode();
      return;
    }
    preloadAll().then(runEliminationDraw);
  }

  if (tabSorteio) {
    tabSorteio.addEventListener("click", function () {
      if (mode !== "sorteio") setMode("sorteio");
    });
  }
  if (tabVeto) {
    tabVeto.addEventListener("click", function () {
      if (mode !== "veto") setMode("veto");
    });
  }
  if (btnAction) btnAction.addEventListener("click", onActionClick);
  if (btnReset) btnReset.addEventListener("click", resetCurrentMode);

  fetch("/api/mapas", { cache: "no-store" })
    .then(function (res) {
      if (res.ok) return res.json();
      return fetch("/data/maps.json", { cache: "no-store" }).then(function (res2) {
        if (!res2.ok) throw new Error("maps");
        return res2.json();
      });
    })
    .then(function (data) {
      maps = (data && data.maps) || [];
      preloadAll();
      var urlMode = getModeFromUrl();
      setMode(urlMode || "sorteio");
      if (urlMode === "veto" && maps.length) {
        setStatus("Clique num mapa para vetar. Repete até sobrar um.");
      }
    })
    .catch(function () {
      maps = [];
      setStatus("Não foi possível carregar a lista de mapas. Tenta atualizar a página.");
      if (btnAction) btnAction.disabled = true;
    });
})();
