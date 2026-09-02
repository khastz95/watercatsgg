(function () {
  "use strict";

  document.documentElement.setAttribute("data-theme", "dark");
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", "#000000");

  function headerHtml() {
    return (
      '<div class="container header-inner">' +
      '<a class="brand" href="/">' +
      '<img class="brand__logo" src="/assets/logo.png" alt="WATERCATSGG" width="44" height="44" />' +
      '<span class="brand__text"><span class="brand__name"><span>WATER</span><span>CATS</span><span>GG</span></span></span>' +
      "</a>" +
      '<button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="main-nav">' +
      "<span></span><span></span><span></span></button>" +
      '<nav class="site-nav" id="main-nav" aria-label="Principal"><ul id="site-nav-list">' +
      '<li><a href="/" data-nav="home">Início</a></li>' +
      '<li><a href="/elenco" data-nav="elenco">Elenco</a></li>' +
      '<li><a href="/jogos" data-nav="jogos">Calendário</a></li>' +
      '<li><a href="/sobre" data-nav="sobre">Organização</a></li>' +
      '<li data-auth="login"><a href="/entrar" data-nav="entrar">Entrar</a></li>' +
      "</ul></nav></div>"
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
      '<img src="/assets/logo.png" alt="WATERCATSGG" width="48" height="48" class="footer__logo" />' +
      '<span class="footer__brandtext"><span class="footer__brandname"><span class="footer__brand-light">WATER</span><span class="footer__brand-dark">CATS</span><span class="footer__brand-gg">GG</span></span>' +
      '<span class="footer__brandsub">WATERCATSGG · CS2</span></span></a>' +
      '<p class="footer__desc">Organização brasileira de Counter-Strike 2. Lineup permanente, calendário público e canais oficiais.</p>' +
      '<div class="footer__social">' +
      '<a class="footer__social-link" href="https://discord.gg/et6N2Y3pJj" target="_blank" rel="noopener noreferrer">Discord</a>' +
      '<a class="footer__social-link" href="https://steamcommunity.com/groups/watercatsgg" target="_blank" rel="noopener noreferrer">Steam</a>' +
      "</div></div>" +
      '<div class="footer__col"><h2 class="footer__col-title">Organização</h2><ul class="footer__navlist">' +
      '<li><a href="/">Início</a></li><li><a href="/sobre">A marca</a></li>' +
      '<li><a href="/elenco">Elenco</a></li><li><a href="/jogos">Calendário</a></li>' +
      "</ul></div>" +
      '<div class="footer__col"><h2 class="footer__col-title">Competição</h2><ul class="footer__navlist">' +
      '<li><a href="/elenco">Lineup titular</a></li><li><a href="/jogos">Próximos jogos</a></li>' +
      '<li><a href="/elenco">Comissão técnica</a></li></ul></div>' +
      '<div class="footer__col"><h2 class="footer__col-title">Canais oficiais</h2><ul class="footer__navlist">' +
      '<li><a href="https://discord.gg/et6N2Y3pJj" target="_blank" rel="noopener noreferrer">Discord oficial</a></li>' +
      '<li><a href="https://steamcommunity.com/groups/watercatsgg" target="_blank" rel="noopener noreferrer">Grupo Steam</a></li>' +
      '<li><a href="/entrar">Entrar</a></li></ul></div>' +
      "</div>" +
      '<div class="footer__bar">' +
      '<p class="footer__copy">© ' +
      y +
      " WATERCATSGG</p>" +
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

  var themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) themeBtn.remove();

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
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      setNavOpen(false);
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
    document.querySelectorAll(".site-nav a").forEach(function (a) {
      var key = a.getAttribute("data-nav") || "";
      var on = key && key === current;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  markActive();

  window.EP = window.EP || {};
  window.EP.user = null;
  window.EP.pageKey = pageKey;

  window.EP.observeReveal = function (root) {
    var nodes = (root || document).querySelectorAll(".reveal:not(.is-visible)");
    if (!nodes.length) return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    nodes.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i * 70, 280) + "ms";
      io.observe(el);
    });
  };
  window.EP.observeReveal(document);

  if (headerEl) {
    var onScroll = function () {
      headerEl.classList.toggle("is-scrolled", window.scrollY > 10);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

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
