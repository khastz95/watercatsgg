(function () {
  "use strict";

  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

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
        if (window.matchMedia("(max-width: 900px)").matches) {
          setNavOpen(false);
        }
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
    if (p.indexOf("/jogadores") === 0 || p.indexOf("/elenco") === 0) return "elenco";
    if (p.indexOf("/sobre") === 0) return "sobre";
    if (p.indexOf("/admin") === 0) return "admin";
    return "";
  }

  var current = pageKey();
  document.querySelectorAll(".site-nav a").forEach(function (a) {
    var key = a.getAttribute("data-nav") || "";
    var on = key && key === current;
    a.classList.toggle("is-active", on);
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) e.target.classList.add("is-visible");
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    revealObserver.observe(el);
  });
})();
