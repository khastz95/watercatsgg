(function () {
  "use strict";

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("ep-theme", theme);
    } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#eef3f8" : "#071018");
  }

  function bootTheme() {
    var t = document.documentElement.getAttribute("data-theme");
    if (t !== "light" && t !== "dark") {
      try {
        t = localStorage.getItem("ep-theme");
      } catch (e) {
        t = "";
      }
      if (t !== "light" && t !== "dark") {
        t =
          window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark";
      }
    }
    applyTheme(t);
  }

  bootTheme();

  function themeButton() {
    return (
      '<button class="theme-toggle" type="button" aria-label="Alternar tema claro e escuro">' +
      '<svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18"/></svg>' +
      '<svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z"/></svg>' +
      "</button>"
    );
  }

  function headerHtml() {
    return (
      '<div class="container header-inner">' +
      '<a class="brand" href="/">' +
      '<img class="brand__logo" src="/assets/logo.png" alt="Eternal Pratas" width="44" height="44" />' +
      '<span class="brand__text"><span class="brand__name"><span>ETERNAL</span> <span>PRATAS</span></span></span>' +
      "</a>" +
      '<button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="main-nav">' +
      "<span></span><span></span><span></span></button>" +
      '<nav class="site-nav" id="main-nav" aria-label="Principal"><ul id="site-nav-list">' +
      '<li><a href="/" data-nav="home">Início</a></li>' +
      '<li><a href="/elenco" data-nav="elenco">Elenco</a></li>' +
      '<li><a href="/jogos" data-nav="jogos">Jogos</a></li>' +
      '<li><a href="/sobre" data-nav="sobre">Organização</a></li>' +
      '<li data-auth="login"><a href="/entrar" data-nav="entrar">Entrar</a></li>' +
      "</ul></nav>" +
      '<div class="header-tools">' +
      themeButton() +
      "</div></div>"
    );
  }

  function footerHtml() {
    var y = new Date().getFullYear();
    return (
      '<div class="footer__glow" aria-hidden="true"></div>' +
      '<div class="container">' +
      '<div class="footer__main">' +
      '<div class="footer__col footer__col--brand">' +
      '<a href="/" class="footer__brandmark">' +
      '<img src="/assets/logo.png" alt="Eternal Pratas" width="48" height="48" class="footer__logo" />' +
      '<span class="footer__brandtext"><span class="footer__brandname"><span class="footer__brand-light">ETERNAL</span> <span class="footer__brand-dark">PRATAS</span></span>' +
      '<span class="footer__brandsub">Counter-Strike 2</span></span></a>' +
      '<p class="footer__desc">Organização brasileira de CS2. Elenco, jogos e a casa do time.</p>' +
      '<div class="footer__social">' +
      '<a class="footer__social-link" href="https://discord.gg/et6N2Y3pJj" target="_blank" rel="noopener noreferrer">Discord</a>' +
      '<a class="footer__social-link" href="https://steamcommunity.com/groups/eternalpratas" target="_blank" rel="noopener noreferrer">Steam</a>' +
      "</div></div>" +
      '<div class="footer__col"><h2 class="footer__col-title">Navegação</h2><ul class="footer__navlist">' +
      '<li><a href="/">Início</a></li><li><a href="/elenco">Elenco</a></li>' +
      '<li><a href="/jogos">Jogos</a></li><li><a href="/sobre">Organização</a></li>' +
      "</ul></div>" +
      '<div class="footer__col"><h2 class="footer__col-title">Time</h2><ul class="footer__navlist">' +
      '<li><a href="/elenco">Lineup</a></li><li><a href="/jogos">Agenda</a></li>' +
      '<li><a href="/sobre">A marca</a></li></ul></div>' +
      '<div class="footer__col"><h2 class="footer__col-title">Comunidade</h2><ul class="footer__navlist">' +
      '<li><a href="https://discord.gg/et6N2Y3pJj" target="_blank" rel="noopener noreferrer">Discord oficial</a></li>' +
      '<li><a href="https://steamcommunity.com/groups/eternalpratas" target="_blank" rel="noopener noreferrer">Grupo Steam</a></li>' +
      '<li><a href="/entrar">Entrar</a></li></ul></div>' +
      "</div>" +
      '<div class="footer__bar">' +
      '<p class="footer__copy">© ' +
      y +
      " Eternal Pratas</p>" +
      '<p class="footer__legal">Não afiliado à Valve Corporation. Counter-Strike é marca da Valve Corporation.</p>' +
      "</div></div>"
    );
  }

  var headerEl = document.querySelector("[data-header]");
  if (headerEl) {
    headerEl.className = "site-header";
    headerEl.innerHTML = headerHtml();
  }

  var footerEl = document.querySelector("[data-footer]");
  if (footerEl) {
    footerEl.className = "site-footer";
    footerEl.innerHTML = footerHtml();
  }

  if (!document.querySelector(".ep-grain")) {
    var grain = document.createElement("div");
    grain.className = "ep-grain";
    grain.setAttribute("aria-hidden", "true");
    document.body.appendChild(grain);
  }

  if (headerEl && !document.querySelector(".ep-ticker")) {
    var ticker = document.createElement("div");
    ticker.className = "ep-ticker";
    ticker.setAttribute("aria-hidden", "true");
    var unit = "Eternal Pratas  ·  Counter-Strike 2  ·  Brasil  ·  Elenco  ·  Jogos  ·  Organização  ·  ";
    ticker.innerHTML = '<div class="ep-ticker__track"><span>' + unit + unit + "</span><span>" + unit + unit + "</span></div>";
    headerEl.insertAdjacentElement("afterend", ticker);
  }

  if (!document.querySelector(".ep-gutter")) {
    var left = document.createElement("aside");
    left.className = "ep-gutter ep-gutter--left";
    left.setAttribute("aria-label", "Atalhos");
    left.innerHTML =
      '<a href="/" data-nav="home">Início</a>' +
      '<a href="/elenco" data-nav="elenco">Elenco</a>' +
      '<a href="/jogos" data-nav="jogos">Jogos</a>' +
      '<a href="/sobre" data-nav="sobre">Org</a>' +
      '<a href="https://discord.gg/et6N2Y3pJj" target="_blank" rel="noopener noreferrer">Discord</a>';
    var right = document.createElement("aside");
    right.className = "ep-gutter ep-gutter--right";
    right.setAttribute("aria-hidden", "true");
    right.innerHTML = "<span>CS2</span><span>Brasil</span><span>Eternal</span><span>Pratas</span>";
    document.body.appendChild(left);
    document.body.appendChild(right);
  }

  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      applyTheme(currentTheme() === "light" ? "dark" : "light");
    });
  }

  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function setNavOpen(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setNavOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 900px)").matches) setNavOpen(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setNavOpen(false);
        toggle.focus();
      }
    });
  }

  function pageKey() {
    var p = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
    if (p === "/" || p === "/index" || p === "/index.html") return "home";
    if (p.indexOf("/1v1") === 0) return "1v1";
    if (p.indexOf("/jogadores") === 0 || p.indexOf("/elenco") === 0 || p.indexOf("/jogador") === 0) return "elenco";
    if (p.indexOf("/jogos") === 0) return "jogos";
    if (p.indexOf("/sobre") === 0) return "sobre";
    if (p.indexOf("/entrar") === 0) return "entrar";
    if (p.indexOf("/admin") === 0) return "admin";
    return "";
  }

  function markActive() {
    var current = pageKey();
    document.querySelectorAll(".site-nav a, .ep-gutter a").forEach(function (a) {
      var key = a.getAttribute("data-nav") || "";
      var on = key && key === current;
      a.classList.toggle("is-active", on);
      if (on && a.closest(".site-nav")) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  markActive();

  window.EP = window.EP || {};
  window.EP.user = null;
  window.EP.pageKey = pageKey;

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  window.EP.observeReveal = function (root) {
    (root || document).querySelectorAll(".reveal").forEach(function (el) {
      revealObserver.observe(el);
    });
  };
  window.EP.observeReveal(document);

  fetch("/api/sessao", { credentials: "include", cache: "no-store" })
    .then(function (res) {
      return res.json();
    })
    .then(function (json) {
      var user = json && json.user;
      window.EP.user = user || null;
      document.dispatchEvent(new CustomEvent("ep-session", { detail: user || null }));
      var list = document.getElementById("site-nav-list");
      if (!list || !user) return;

      if (!list.querySelector('[data-nav="1v1"]')) {
        var li1 = document.createElement("li");
        li1.innerHTML = '<a href="/1v1" data-nav="1v1">1v1</a>';
        list.insertBefore(li1, list.querySelector('[data-auth="login"]'));
      }
      if (user.papel === "admin" && !list.querySelector('[data-nav="admin"]')) {
        var liA = document.createElement("li");
        liA.innerHTML = '<a href="/admin" data-nav="admin">Painel</a>';
        list.insertBefore(liA, list.querySelector('[data-auth="login"]'));
      }
      var loginLi = list.querySelector('[data-auth="login"]');
      if (loginLi) {
        loginLi.innerHTML = '<a href="#" data-nav="sair">Sair</a>';
        loginLi.querySelector("a").addEventListener("click", function (e) {
          e.preventDefault();
          fetch("/api/sessao", { method: "DELETE", credentials: "include" }).then(function () {
            window.location.href = "/";
          });
        });
      }
      markActive();
    })
    .catch(function () {});
})();
