(function () {
  "use strict";

  var nav = document.querySelector(".site-nav");
  var toggle = document.querySelector(".nav-toggle");
  var yearEl = document.getElementById("year");

  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var header = document.querySelector(".site-header");
  if (header) {
    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 16);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
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

  var seg = window.location.pathname.split("/").filter(function (s) {
    return s.length > 0;
  });
  var path = seg.length ? seg[seg.length - 1] : "index.html";
  var pathJoined = "/" + seg.join("/");
  var on1v1 = pathJoined === "/1v1" || pathJoined.indexOf("/1v1/") === 0;
  if (!path || (!/\.html?$/.test(path) && !on1v1)) path = "index.html";
  document.querySelectorAll(".site-nav a, .footer__links a, .footer__navlist a").forEach(function (a) {
    var href = a.getAttribute("href") || "";
    var hrefFile = href.split("/").filter(function (s) {
      return s.length > 0;
    }).pop();
    var is1v1Link = href === "/1v1" || href === "/1v1/" || href.indexOf("/1v1") === 0;
    var isCurrent = on1v1 ? is1v1Link : hrefFile === path;
    a.classList.toggle("is-active", isCurrent);
    if (isCurrent) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });

  var revealObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
  );

  function refreshReveals(root) {
    var scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll(".reveal:not(.is-visible)").forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  window.refreshReveals = refreshReveals;
  refreshReveals(document);

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

})();
