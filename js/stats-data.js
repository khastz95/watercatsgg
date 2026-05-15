(function (global) {
  "use strict";

  var API_URL = "/api/stats";
  var STATIC_URL = "/data/estatisticas.json";
  var STORAGE_KEY = "ep_admin_password";

  function loadStats() {
    return fetch(API_URL, { cache: "no-store" })
      .then(function (res) {
        if (res.ok) return res.json();
        return fetch(STATIC_URL, { cache: "no-store" }).then(function (res2) {
          if (!res2.ok) throw new Error("load_failed");
          return res2.json();
        });
      });
  }

  function saveStats(data, password) {
    return fetch(API_URL, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Password": password || "",
      },
      body: JSON.stringify(data),
    }).then(function (res) {
      return res.json().then(function (body) {
        return { ok: res.ok, status: res.status, body: body };
      });
    });
  }

  function getStoredPassword() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || "";
    } catch (e) {
      return "";
    }
  }

  function setStoredPassword(value) {
    try {
      if (value) sessionStorage.setItem(STORAGE_KEY, value);
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  function defaultData() {
    return {
      updated: new Date().toISOString().slice(0, 10),
      season: "Mix 2026",
      summary: {
        matches: 0,
        wins: 0,
        losses: 0,
        roundsPlayed: 0,
        avgRating: 0,
      },
      matches: [],
      players: [],
    };
  }

  global.StatsData = {
    API_URL: API_URL,
    STATIC_URL: STATIC_URL,
    load: loadStats,
    save: saveStats,
    getStoredPassword: getStoredPassword,
    setStoredPassword: setStoredPassword,
    defaultData: defaultData,
  };
})(typeof window !== "undefined" ? window : globalThis);
