(function (global) {
  "use strict";

  var CLUTCH_IDS = ["1v1", "1v2", "1v3", "1v4", "1v5"];

  function defaultClutchSituations() {
    return CLUTCH_IDS.map(function (id) {
      return { id: id, success: 0, wins: 0, losses: 0 };
    });
  }

  function defaultDashboard() {
    return {
      kd: 1,
      hltvRating: 1,
      clutch: {
        overall: 0,
        situations: defaultClutchSituations(),
      },
      recentMatches: [],
      winRate: {
        percent: 0,
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
      },
      combat: {
        hsPercent: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        headshots: 0,
        adr: 0,
        damage: 0,
        rounds: 0,
      },
      entry: {
        perRound: 0,
        combined: { success: 0, attempts: 0 },
        t: { success: 0, attempts: 0 },
        ct: { success: 0, attempts: 0 },
      },
      maps: {
        mostPlayed: [],
        mostSuccess: [],
      },
      weapons: {
        mostKills: [],
        headshotRate: [],
      },
      ranks: {
        premier: [],
        wingman: { rankLabel: "", wins: 0 },
        competitive: [],
      },
    };
  }

  function mergeDashboard(raw) {
    var base = defaultDashboard();
    if (!raw || typeof raw !== "object") return base;

    var d = Object.assign({}, base, raw);
    d.clutch = Object.assign({}, base.clutch, raw.clutch || {});
    var situations = Array.isArray(raw.clutch && raw.clutch.situations) ? raw.clutch.situations : [];
    d.clutch.situations = CLUTCH_IDS.map(function (id, i) {
      var found = situations.find(function (s) {
        return s && (s.id === id || s.id === id.replace("v", "V"));
      });
      var slot = found || situations[i] || {};
      return {
        id: id,
        success: num(slot.success, 0),
        wins: num(slot.wins, 0),
        losses: num(slot.losses, 0),
      };
    });

    d.winRate = Object.assign({}, base.winRate, raw.winRate || {});
    d.combat = Object.assign({}, base.combat, raw.combat || {});
    d.entry = Object.assign({}, base.entry, raw.entry || {});
    d.entry.combined = Object.assign({}, base.entry.combined, (raw.entry && raw.entry.combined) || {});
    d.entry.t = Object.assign({}, base.entry.t, (raw.entry && raw.entry.t) || {});
    d.entry.ct = Object.assign({}, base.entry.ct, (raw.entry && raw.entry.ct) || {});
    d.maps = {
      mostPlayed: Array.isArray(raw.maps && raw.maps.mostPlayed) ? raw.maps.mostPlayed.slice() : [],
      mostSuccess: Array.isArray(raw.maps && raw.maps.mostSuccess) ? raw.maps.mostSuccess.slice() : [],
    };
    d.weapons = {
      mostKills: Array.isArray(raw.weapons && raw.weapons.mostKills) ? raw.weapons.mostKills.slice() : [],
      headshotRate: Array.isArray(raw.weapons && raw.weapons.headshotRate)
        ? raw.weapons.headshotRate.slice()
        : [],
    };
    d.recentMatches = Array.isArray(raw.recentMatches) ? raw.recentMatches.slice() : [];
    var ranks = raw.ranks || {};
    d.ranks = {
      premier: Array.isArray(ranks.premier) ? ranks.premier.slice() : [],
      wingman: Object.assign({}, base.ranks.wingman, ranks.wingman || {}),
      competitive: Array.isArray(ranks.competitive) ? ranks.competitive.slice() : [],
    };
    d.kd = num(raw.kd, base.kd);
    d.hltvRating = num(raw.hltvRating, base.hltvRating);
    return d;
  }

  function num(val, fallback) {
    var n = parseFloat(val);
    return Number.isNaN(n) ? (fallback != null ? fallback : 0) : n;
  }

  function migratePlayer(player) {
    if (!player || typeof player !== "object") return player;
    var p = Object.assign({}, player);
    if (!p.highlights) p.highlights = [];

    if (p.dashboard) {
      p.dashboard = mergeDashboard(p.dashboard);
      return p;
    }

    var d = defaultDashboard();
    var kills = num(p.kills, 0);
    var deaths = num(p.deaths, 0);
    d.kd = deaths ? Math.round((kills / deaths) * 100) / 100 : kills || 1;
    d.hltvRating = num(p.rating, 1);
    d.combat = {
      hsPercent: num(p.hsPercent, 0),
      kills: kills,
      deaths: deaths,
      assists: num(p.assists, 0),
      headshots: p.headshots != null ? num(p.headshots, 0) : Math.round((kills * num(p.hsPercent, 0)) / 100),
      adr: num(p.adr, 0),
      damage: num(p.damage, 0),
      rounds: num(p.rounds, 0),
    };
    d.winRate.played = num(p.matches, 0);
    p.dashboard = d;
    return p;
  }

  function normalizeStatsData(data) {
    if (!data || typeof data !== "object") return data;
    data.players = (data.players || []).map(migratePlayer);
    return data;
  }

  global.StatsSchema = {
    CLUTCH_IDS: CLUTCH_IDS,
    defaultDashboard: defaultDashboard,
    mergeDashboard: mergeDashboard,
    migratePlayer: migratePlayer,
    normalizeStatsData: normalizeStatsData,
  };
})(typeof window !== "undefined" ? window : globalThis);
