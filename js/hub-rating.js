(function (global) {
  "use strict";

  var MAX_LEVEL = 30000;

  function clampLevel(n) {
    var v = Math.round(Number(n));
    if (Number.isNaN(v) || v < 0) return 0;
    if (v > MAX_LEVEL) return MAX_LEVEL;
    return v;
  }

  function getRatingTier(level) {
    var l = clampLevel(level);
    if (l >= 30000) return "gold";
    if (l >= 25000) return "red";
    if (l >= 20000) return "pink";
    if (l >= 15000) return "purple";
    if (l >= 10000) return "blue";
    if (l >= 5000) return "lightblue";
    return "gray";
  }

  function ratingClass(level) {
    return "hub-rating hub-rating--" + getRatingTier(level);
  }

  function formatLevel(n) {
    return clampLevel(n).toLocaleString("pt-BR");
  }

  global.HubRating = {
    MAX_LEVEL: MAX_LEVEL,
    clampLevel: clampLevel,
    getRatingTier: getRatingTier,
    ratingClass: ratingClass,
    formatLevel: formatLevel,
  };
})(typeof window !== "undefined" ? window : this);
