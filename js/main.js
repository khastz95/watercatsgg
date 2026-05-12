(function () {
  "use strict";

  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      nav.classList.toggle("is-open", !open);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 900px)").matches) {
          toggle.setAttribute("aria-expanded", "false");
          nav.classList.remove("is-open");
        }
      });
    });
  }

  var seg = window.location.pathname.split("/").filter(function (s) {
    return s.length > 0;
  });
  var path = seg.length ? seg[seg.length - 1] : "index.html";
  if (!path || !/\.html?$/.test(path)) path = "index.html";
  document.querySelectorAll(".site-nav a, .footer__navlist a[href$='.html']").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === path) a.classList.add("is-active");
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  document.querySelectorAll(".reveal").forEach(function (el) {
    observer.observe(el);
  });

  var statBars = document.querySelectorAll(".stat-bar__fill[data-width]");
  function animateBars() {
    statBars.forEach(function (bar) {
      var w = bar.getAttribute("data-width");
      if (w) bar.style.width = w + "%";
    });
  }

  if (statBars.length) {
    var statsSection = document.querySelector("[data-stats-section]");
    if (statsSection && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              animateBars();
              io.disconnect();
            }
          });
        },
        { threshold: 0.2 }
      );
      io.observe(statsSection);
    } else {
      animateBars();
    }
  }

  var form = document.getElementById("join-form");
  var formMsg = document.getElementById("form-msg");
  if (form && formMsg) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      formMsg.textContent =
        "Recebemos sua mensagem. Entraremos em contato pelos canais oficiais quando houver vaga ou resposta.";
      formMsg.classList.add("is-visible", "form-msg--ok");
      form.reset();
    });
  }
})();
