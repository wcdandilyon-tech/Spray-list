/* Chrono Command — engine: state, battle simulator, army building, economy, progression, saving. No DOM here.
   Each stage is one battle between two armies of individual soldiers on a 360 x 120 field. */
(function (G) {
  'use strict';
  const CW = G.CW;
  const { UNIT, UNITS, LEADER, LEADERS, ERAS, ROLES, CLASSES, DOC, DOCTRINES, UATTR, UATTRS } = CW;
  const NERA = ERAS.length;

  // ------------------------------------------------------------ tuning
  const CFG = (CW.CFG = {
    growth: 1.11, // enemy power per stage
    eraPow: 2.6, // unit power per era
    lvlStep: 0.15, // +15% base per level
    lvlMilestone: 25, // x2 every 25 levels
    costGrowth: 1.125,
    costBase: 15,
    eraCost: 2.9,
    enemyHp: 1.5,
    enemyAtk: 1.25,
    bossHp: 25,
    bossAtk: 2,
    bounty: 0.7, // gold per capacity point of enemy killed
    winBonus: 3, // extra bounties for each won battle
    bossBounty: 30,
    stagesPerBoss: 3,
    bossTime: 60,
    battleTime: 90,
    trainBase: 40,
    trainGrowth: 1.3,
    riftBase: 5,
    riftGrowth: 1.04,
    vet: 12, // new-era units start this many levels below your best unit
    chaos: 1.6, // extra enemy strength once time shatters
    mysteryHp: 2.2,
    mysteryAtk: 1.3,
    heroAtk: 4, // commanders on the field, relative to an average soldier
    heroHp: 6,
    champCost: 6, // army capacity one leader in the ranks takes
    champSlots: 3, // leaders in the ranks once time shatters
    champSlotEvery: 18, // one more slot every this many stages of Shattered Time
    champSlotMax: 8,
    capBase: 30, // army capacity at the start
    capPerEra: 10, // more capacity for every era reached
    enemyCap: 1,
    recruitBase: 20, // price of one soldier, in enemy bounties at the start of its era
    recruitGrowth: 1.01, // each extra soldier of the same type costs 1% more
    dt: 0.05,
  });
  CW.SAVE_KEY = 'chronoCommand.v1';
  const FX = 360;
  const FZ = 120;
  CW.FX = FX;
  CW.FZ = FZ;
  const PSPEED = { arrow: 170, rock: 150, javelin: 160, bullet: 420, shell: 140, boulder: 110, grenade: 130, rocket: 220, laser: 900, plasma: 300, bomb: 120 };
  CW.PSPEED = PSPEED;

  // ------------------------------------------------------------ campaign map
  // The time pathway runs every era in order, from the Stone Age to the Galactic Age.
  // After it ends, time shatters: random eras, stronger foes and mystery bosses, forever.
  const BOSSES = [];
  for (let e = 0; e < 11; e++) BOSSES.push(LEADERS.filter((l) => l.era === e && !l.starter).map((l) => l.id));
  BOSSES.push(['exterminator', null, 'synth', 'robohitler', 'neonshogun', null, 'alien']); // Future: nulls are echoes of the past
  BOSSES.push(['overmind', null, 'admiral', 'warlord', null, 'moonking']); // Space Age
  BOSSES.push(['empress', null, 'archon', null, 'cosmickhan', 'hive']); // Galactic Age
  const SPB = CFG.stagesPerBoss;
  const ERA_LEN = BOSSES.map((b) => b.length * SPB);
  const ERA_START = [];
  let acc = 0;
  ERA_LEN.forEach((n) => {
    ERA_START.push(acc);
    acc += n;
  });
  const PATH_LEN = acc;
  CW.PATH_LEN = PATH_LEN;
  CW.ERA_START = ERA_START;
  CW.BOSSES = BOSSES;

  function hash(a, b) {
    let h = (a ^ 0x9e3779b9) + Math.imul(b + 0x7f4a7c15, 0x85ebca6b);
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39);
    h ^= h >>> 15;
    return h >>> 0;
  }
  const seed = () => (S && S.seed) || 1;
  function echoFor(era, i) {
    const p = CW.ECHO_POOL;
    return p[(hash(seed(), 99 + era) + i * 5) % p.length];
  }
  let infoCache = new Map();
  CW.stageInfo = function (stage) {
    let r = infoCache.get(stage);
    if (r) return r;
    if (stage <= PATH_LEN) {
      const s0 = stage - 1;
      let era = 0;
      while (era < NERA - 1 && s0 >= ERA_START[era + 1]) era++;
      const k = s0 - ERA_START[era];
      const bi = Math.floor(k / SPB);
      const sub = k % SPB;
      const bossId = BOSSES[era][bi] || echoFor(era, bi);
      const isBoss = sub === SPB - 1;
      const L = LEADER[bossId];
      const span = ERAS[era].span;
      const variant = era >= 11 && L.era < 11 ? 'echo' : '';
      const yr = isBoss && !variant ? L.yr : Math.round(span[0] + ((span[1] - span[0]) * (k + 1)) / ERA_LEN[era]);
      r = { stage, chaos: false, era, k, bi, sub, isBoss, bossId, yr, variant, echo: era >= 11, mystery: false };
    } else {
      const c = stage - PATH_LEN - 1;
      const seg = Math.floor(c / SPB);
      const sub = c % SPB;
      const era = hash(seed(), seg * 3 + 1) % NERA;
      const mystery = seg % 4 === 0;
      let bossId;
      if (mystery) bossId = CW.MYSTERY[hash(seed(), seg * 3 + 2) % CW.MYSTERY.length];
      else {
        const pool = era < 11 ? BOSSES[era] : CW.FUTURE_POOL;
        bossId = pool[hash(seed(), seg * 3 + 2) % pool.length];
      }
      const L = LEADER[bossId];
      const span = ERAS[era].span;
      const variant = !mystery && era >= 11 && L.era < 11 ? 'echo' : '';
      const isBoss = sub === SPB - 1;
      const yr = isBoss && L.yr != null && L.era === era ? L.yr : Math.round(span[0] + ((span[1] - span[0]) * (hash(seed(), c + 7) % 1000)) / 1000);
      r = { stage, chaos: true, era, k: sub, bi: seg, sub, isBoss, bossId, yr, variant, echo: true, mystery, depth: seg + 1 };
    }
    infoCache.set(stage, r);
    return r;
  };
  CW.bossStageOf = function (id) {
    for (let e = 0; e < NERA; e++) {
      const i = BOSSES[e].indexOf(id);
      if (i >= 0) return ERA_START[e] + i * SPB + SPB;
    }
    return 0;
  };
  CW.fmtYear = (y) => (y < 0 ? Math.abs(y) + ' BC' : y < 1000 ? 'AD ' + y : String(y));

  // ------------------------------------------------------------ events
  const handlers = {};
  CW.on = (ev, fn) => (handlers[ev] = handlers[ev] || []).push(fn);
  function emit(ev, data) {
    (handlers[ev] || []).forEach((fn) => {
      try {
        fn(data);
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ------------------------------------------------------------ state
  let S = null; // persistent
  let B = null; // the current battle
  let M = null; // cached modifiers
  CW.state = () => S;
  CW.battle = () => B;
  const START_ARMY = () => ({ clubman: 8, rockthrower: 4, wolves: 1 });

  function freshState(starter) {
    const starters = LEADERS.filter((l) => l.starter).map((l) => l.id);
    if (!starters.includes(starter)) starter = starters[0];
    const roster = {};
    starters.forEach((id) => (roster[id] = { lv: 1, stars: 0 }));
    return {
      v: 3,
      seed: (Math.random() * 1e9) | 0,
      gold: 0,
      shards: 0,
      stage: 1,
      runMax: 1,
      best: 1,
      farming: false,
      farmCount: 0,
      auto: { push: true, build: true, special: true },
      army: START_ARMY(),
      meter: {}, // each leader's special meter, 0-100
      pos: {}, // where each leader fights: 'front' or 'back'
      champs: [], // leaders fighting in the ranks (unlocked once time shatters)
      prest: {}, // each leader's prestige rank, 0-2 (kept through Time Rifts)
      spEq: {}, // which of their unlocked specials each leader has equipped
      lstats: {}, // what each leader has done, counted towards prestige
      guide: { seen: {}, on: true }, // the how-to-play tips already shown (ui.js)
      owned: START_ARMY(),
      uattr: {},
      unitLv: {},
      eraReached: 0,
      roster,
      main: starter,
      partners: starters.filter((id) => id !== starter),
      doctrines: {},
      council: null,
      stats: { kills: 0, bosses: 0, rifts: 0, time: 0, gold: 0, taps: 0 },
      gps: 0,
      savedAt: Date.now(),
      sound: true,
      buyMode: 1,
    };
  }

  CW.newGame = function (starter) {
    S = freshState(starter);
    infoCache = new Map();
    M = null;
    B = null;
    startBattle();
    emit('reset');
    return S;
  };

  // older saves: v1 had squads and 10 eras; v2 had free soldiers (every unlocked unit type, limited only by capacity)
  function migrate(o) {
    if ((o.v || 1) === 2) {
      // keep the soldiers that were marching; they become owned
      o.owned = Object.assign({}, o.army || {});
      if (!Object.keys(o.owned).length) o.grant = true;
      o.v = 3;
      return;
    }
    if ((o.v || 1) >= 3) return;
    const lens = [5, 7, 9, 7, 7, 9, 10, 13, 11, 6].map((n) => n * 3);
    const oldEra = (st) => {
      if (st > 252) return 99;
      let a = 0;
      for (let e = 0; e < 10; e++) {
        if (st <= a + lens[e]) return e;
        a += lens[e];
      }
      return 9;
    };
    const REMAP = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11];
    const conv = (st) => {
      const e = oldEra(st || 1);
      return e === 99 ? PATH_LEN + 1 : ERA_START[REMAP[e]] + 1;
    };
    const chaos = oldEra(o.runMax || 1) === 99;
    o.stage = conv(o.stage);
    o.runMax = Math.max(o.stage, conv(o.runMax));
    o.best = Math.max(o.runMax, conv(o.best));
    o.eraReached = chaos ? NERA - 1 : REMAP[Math.min(9, o.eraReached || 0)];
    o.army = {}; // rebuilt by auto-build on load: the old squad formation doesn't map onto capacity
    delete o.formation;
    o.uattr = {};
    o.farming = false;
    o.auto = { push: o.auto ? o.auto.push !== false : true, build: true };
    o.owned = {};
    o.grant = true; // given a full army of their era's best units on load
    o.v = 3;
  }

  CW.load = function (obj) {
    if (!obj || typeof obj !== 'object' || !obj.roster || !obj.main) return false;
    obj = JSON.parse(JSON.stringify(obj));
    migrate(obj);
    const base = freshState(obj.main);
    S = Object.assign(base, obj);
    S.auto = Object.assign({ push: true, build: true, special: true }, obj.auto || {});
    S.meter = S.meter || {};
    S.pos = S.pos || {};
    S.champs = Array.isArray(S.champs) ? S.champs : [];
    S.prest = S.prest || {};
    S.spEq = S.spEq || {};
    S.lstats = S.lstats || {};
    S.guide = S.guide && S.guide.seen ? S.guide : { seen: {}, on: true };
    if (!S.seed) S.seed = (Math.random() * 1e9) | 0;
    infoCache = new Map();
    S.stats = Object.assign(base.stats, obj.stats || {});
    Object.keys(S.roster).forEach((id) => {
      if (!LEADER[id]) delete S.roster[id];
    });
    if (!S.roster[S.main]) S.main = Object.keys(S.roster)[0];
    S.partners = (S.partners || []).filter((p) => S.roster[p] && p !== S.main).slice(0, 2);
    S.champs = S.champs.filter((id, i, a) => S.roster[id] && id !== S.main && !S.partners.includes(id) && a.indexOf(id) === i);
    Object.keys(S.doctrines).forEach((d) => {
      if (!DOC[d]) delete S.doctrines[d];
    });
    S.army = S.army || {};
    S.owned = S.owned || {};
    S.uattr = S.uattr || {};
    if (S.council && !Array.isArray(S.council.offers)) S.council = null;
    M = null;
    B = null;
    if (S.grant) {
      grantArmy();
      delete S.grant;
    }
    fixArmy();
    startBattle();
    return true;
  };

  CW.serialize = function () {
    S.savedAt = Date.now();
    return JSON.parse(JSON.stringify(S));
  };

  // ------------------------------------------------------------ modifiers
  function mods() {
    if (M) return M;
    const m = {
      atk: 0, hp: 0, spd: 0, crit: 0.05, critDmg: 0, def: 0, gold: 0, regen: 0, bossGold: 0, cost: 0, attrMain: 0, attrPartner: 0,
      heroHp: 0, combined: 0, pride: 0, enemyAtk: 0, enemyHp: 0, bossDmg: 0, bossTime: 0, shardDrop: 0, offline: 0, blitz: 0,
      lastStand: 0, firstStrike: 0, capPct: 0, move: 0, inf: 0, rng: 0, hvy: 0, cav: 0,
    };
    for (const id in S.doctrines) {
      const d = DOC[id];
      const n = S.doctrines[id];
      for (const k in d.fx) if (k in m) m[k] += d.fx[k] * n;
    }
    const cl = CLASSES[LEADER[S.main].cls];
    for (const k in cl.fx) if (k in m) m[k] += cl.fx[k];
    m.lead = 0.03 * (S.roster[S.main].lv - 1);
    m.shard = 1 + 0.05 * S.shards;
    m.cost = Math.min(0.5, m.cost);
    M = m;
    return m;
  }
  CW.mods = () => mods();
  function dirty() {
    M = null;
    if (B) refreshAllies();
  }
  CW.dirty = dirty;

  // ------------------------------------------------------------ math
  const growth = (s) => Math.pow(CFG.growth, s - 1);
  const eraPow = (e) => Math.pow(CFG.eraPow, e);
  const lvlMult = (L) => (1 + CFG.lvlStep * (L - 1)) * Math.pow(2, Math.floor(L / CFG.lvlMilestone));
  CW.lvlMult = lvlMult;
  function bounty() {
    const m = mods();
    return CFG.bounty * growth(S.stage) * (1 + m.gold + (B && B.sa ? B.sa.gold : 0)) * m.shard;
  }
  CW.bounty = bounty;

  // ------------------------------------------------------------ army building
  CW.unitLevel = (id) => S.unitLv[id] || 1;
  CW.unlockedUnits = () => UNITS.filter((u) => u.era <= S.eraReached);
  CW.capacity = () => Math.floor((CFG.capBase + CFG.capPerEra * S.eraReached) * (1 + mods().capPct));
  const cpCost = (id) => ROLES[UNIT[id].role].cost;
  CW.cpCost = cpCost;
  CW.armyUsed = function () {
    let n = CW.champCap();
    for (const id in S.army) n += S.army[id] * cpCost(id);
    return n;
  };

  // ---- leaders in the ranks: once time shatters, recruited leaders can take soldiers' places on the front line.
  // Each takes 6 capacity and fights as a front-line unit. Fighters (front-line classes) hit harder and last longer;
  // thinkers fight less well but bring more of their signature attribute to the whole army.
  // At most half of your capacity can go to leaders; any beyond that wait in reserve until capacity grows.
  CW.champUnlocked = () => !!S && S.best > PATH_LEN;
  CW.champSlots = function () {
    if (!CW.champUnlocked()) return 0;
    return Math.min(CFG.champSlotMax, CFG.champSlots + Math.floor((S.best - PATH_LEN - 1) / CFG.champSlotEvery));
  };
  CW.champNextSlot = function () {
    const n = CW.champSlots();
    if (!n || n >= CFG.champSlotMax) return 0;
    return PATH_LEN + 1 + (n - CFG.champSlots + 1) * CFG.champSlotEvery;
  };
  CW.champMax = () => Math.min(CW.champSlots(), Math.floor(CW.capacity() / 2 / CFG.champCost));
  CW.champs = () => (S && S.champs ? S.champs.slice(0, CW.champMax()) : []);
  CW.champCap = () => CW.champs().length * CFG.champCost;
  CW.champCost = () => CFG.champCost;
  const champFighter = (lid) => CW.FRONT_CLASSES.includes(LEADER[lid].cls);
  CW.champFighter = champFighter;
  // the share of their signature attribute a leader in the ranks gives your army
  CW.champAttrK = function (lid) {
    const r = S.roster[lid] || { stars: 0 };
    return (champFighter(lid) ? 0.35 : 0.55) * (1 + 0.1 * r.stars) * (1 + 0.2 * CW.prestige(lid));
  };
  const CHAMP_SHAPE = {
    warrior: [1.5, 1.6], conqueror: [1.6, 1.5], revolutionary: [1.45, 1.5], defender: [2.1, 1.15],
    tyrant: [1.25, 1.1], strategist: [1.15, 1.05], statesman: [1.2, 1], peacemaker: [1.35, 0.9], orator: [1.15, 1.05],
  };
  CW.setChamp = function (lid, on) {
    if (!CW.champUnlocked() || !S.roster[lid]) return false;
    const at = S.champs.indexOf(lid);
    if (!on) {
      if (at < 0) return false;
      S.champs.splice(at, 1);
    } else {
      if (at >= 0 || lid === S.main || S.partners.includes(lid) || CW.champs().length >= CW.champMax()) return false;
      // a leader waiting in reserve beyond the limit makes room for the new pick
      S.champs = CW.champs().concat([lid]);
    }
    M = null;
    fitArmy();
    if (S.auto.build) CW.autoBuild();
    emit('army');
    return true;
  };
  CW.armySize = function () {
    let n = 0;
    for (const id in S.army) n += S.army[id];
    return n;
  };
  CW.owned = (id) => S.owned[id] || 0;
  CW.ownedSize = function () {
    let n = 0;
    for (const id in S.owned) n += S.owned[id];
    return n;
  };
  function fixArmy() {
    for (const id in S.owned) if (!UNIT[id] || !(S.owned[id] > 0)) delete S.owned[id];
    for (const id in S.army) {
      if (!UNIT[id] || UNIT[id].era > S.eraReached || !(S.army[id] > 0)) delete S.army[id];
      else if (S.army[id] > CW.owned(id)) S.army[id] = CW.owned(id);
      if (!S.army[id]) delete S.army[id];
    }
    S.champs = (S.champs || []).filter((id) => S.roster[id] && id !== S.main && !S.partners.includes(id));
    fitArmy();
    if (!Object.keys(S.army).length || S.auto.build) CW.autoBuild();
  }
  // send soldiers home (biggest first) until the army fits its capacity
  function fitArmy() {
    let over = CW.armyUsed() - CW.capacity();
    const ids = Object.keys(S.army).sort((a, b) => cpCost(b) - cpCost(a));
    for (const id of ids) {
      while (over > 0 && S.army[id] > 0) {
        S.army[id]--;
        over -= cpCost(id);
      }
      if (!S.army[id]) delete S.army[id];
    }
  }
  // set how many of your soldiers of a unit type march into battle (limited by how many you own and by army capacity)
  CW.setCount = function (id, n, keepAuto) {
    if (!UNIT[id] || UNIT[id].era > S.eraReached) return false;
    n = Math.max(0, Math.min(CW.owned(id), Math.floor(n)));
    const cur = S.army[id] || 0;
    const room = CW.capacity() - CW.armyUsed() + cur * cpCost(id);
    n = Math.min(n, Math.floor(room / cpCost(id)));
    if (n) S.army[id] = n;
    else delete S.army[id];
    if (!keepAuto) S.auto.build = false;
    M = null;
    emit('army');
    return true;
  };
  // value of one soldier per point of capacity, used to pick the strongest army
  function unitValue(id, ctx) {
    const st = unitStats(id, ctx);
    return ((st.atk / st.int) * st.hp) / cpCost(id);
  }
  // fill the capacity with your strongest soldiers: about 40% infantry, 25% ranged, 15% cavalry, 20% heavy, then the best of the rest
  CW.autoBuild = function () {
    const cap = CW.capacity();
    const ctx = { combo: true, pride: 0, rally: 0 };
    const ids = Object.keys(S.owned).filter((id) => UNIT[id] && UNIT[id].era <= S.eraReached && S.owned[id] > 0);
    const val = {};
    ids.forEach((id) => (val[id] = unitValue(id, ctx)));
    ids.sort((a, b) => val[b] - val[a]);
    S.army = {};
    let used = CW.champCap();
    const take = (id, budget) => {
      const cp = cpCost(id);
      const n = Math.min(S.owned[id] - (S.army[id] || 0), Math.floor(Math.min(budget, cap - used) / cp));
      if (n > 0) {
        S.army[id] = (S.army[id] || 0) + n;
        used += n * cp;
      }
      return n * cp;
    };
    const share = { hvy: 0.2, cav: 0.15, rng: 0.25, inf: 0.4 };
    const room = cap - used;
    for (const role in share) {
      let budget = Math.floor(room * share[role]);
      for (const id of ids) if (UNIT[id].role === role && budget > 0) budget -= take(id, budget);
    }
    for (const id of ids) if (used < cap) take(id, cap - used);
    S.auto.build = true;
    for (const id in S.army) autoEquip(id);
    M = null;
    emit('army');
  };
  // old saves get a full army of their era's best units, so nobody loses what they had
  function grantArmy() {
    const cap = CW.capacity();
    const best = {};
    for (const u of CW.unlockedUnits()) if (!best[u.role] || u.era > best[u.role].era) best[u.role] = u;
    S.owned = {};
    let used = 0;
    const share = { hvy: 0.2, cav: 0.15, rng: 0.25 };
    for (const role in share) {
      if (!best[role]) continue;
      const n = Math.floor((cap * share[role]) / ROLES[role].cost);
      if (n > 0) S.owned[best[role].id] = n;
      used += n * ROLES[role].cost;
    }
    if (best.inf) S.owned[best.inf.id] = Math.max(1, cap - used);
    S.army = {};
  }

  // ---- recruiting: soldiers are bought with gold and stay yours until a Time Rift.
  // A unit type's price is set by its era (later eras cost much more), and each extra soldier of the same type costs a bit more.
  function recruitBase(id) {
    const u = UNIT[id];
    return CFG.recruitBase * growth(ERA_START[u.era] + 1) * cpCost(id) * (1 - mods().cost) * Math.pow(CFG.recruitGrowth, CW.owned(id));
  }
  CW.recruitCost = function (id, n) {
    n = n || 1;
    const r = CFG.recruitGrowth;
    return (recruitBase(id) * (Math.pow(r, n) - 1)) / (r - 1);
  };
  CW.maxRecruit = function (id) {
    const r = CFG.recruitGrowth;
    const n = Math.floor(Math.log((S.gold * (r - 1)) / recruitBase(id) + 1) / Math.log(r));
    return Math.max(0, Math.min(n, 500));
  };
  CW.recruit = function (id, n) {
    if (!UNIT[id] || UNIT[id].era > S.eraReached) return false;
    if (n === 'max') n = CW.maxRecruit(id);
    n = Math.floor(n || 0);
    if (n < 1) return false;
    const c = CW.recruitCost(id, n);
    if (c > S.gold) return false;
    S.gold -= c;
    S.owned[id] = CW.owned(id) + n;
    if (S.auto.build) CW.autoBuild();
    else {
      // new recruits march with the army if there's room
      const room = Math.floor((CW.capacity() - CW.armyUsed()) / cpCost(id));
      if (room > 0) S.army[id] = (S.army[id] || 0) + Math.min(n, room);
    }
    M = null;
    emit('recruit', id);
    return true;
  };

  // auto-build also fills empty attribute slots with a sensible pick for the unit's role (it never replaces your choices)
  const UA_PREF = {
    inf: ['sharp', 'shield', 'vet', 'berserk', 'drainA', 'regenA'],
    rng: ['sharp', 'precise', 'reach', 'pierceA', 'overclock'],
    cav: ['chargeA', 'sharp', 'fleet', 'vet'],
    hvy: ['blast', 'sharp', 'vet', 'overclock'],
  };
  function autoEquip(id) {
    const arr = (S.uattr[id] || []).slice();
    const n = CW.uslots(id);
    let changed = false;
    for (let i = 0; i < n; i++) {
      if (arr[i] && UATTR[arr[i]] && UATTR[arr[i]].era <= S.eraReached) continue;
      const pick = UA_PREF[UNIT[id].role].find((a) => UATTR[a].era <= S.eraReached && !arr.includes(a));
      if (pick) {
        arr[i] = pick;
        changed = true;
      }
    }
    if (changed) S.uattr[id] = arr;
  }

  // ---- unit attributes: equipped per unit type
  CW.uslots = (id) => 1 + (CW.unitLevel(id) >= 10 ? 1 : 0) + (CW.unitLevel(id) >= 30 ? 1 : 0);
  CW.unlockedUAttrs = () => UATTRS.filter((a) => a.era <= S.eraReached);
  CW.equip = function (id, slot, aid) {
    if (!UNIT[id] || slot < 0 || slot >= CW.uslots(id)) return false;
    if (aid && (!UATTR[aid] || UATTR[aid].era > S.eraReached)) return false;
    const arr = (S.uattr[id] || []).slice();
    if (aid) {
      const at = arr.indexOf(aid);
      if (at >= 0 && at !== slot) arr[at] = arr[slot] || null;
    }
    arr[slot] = aid || null;
    S.uattr[id] = arr;
    dirty();
    return true;
  };
  function uaStats(id) {
    const out = {};
    const arr = S.uattr[id] || [];
    const n = CW.uslots(id);
    for (let i = 0; i < n; i++) {
      const a = UATTR[arr[i]];
      if (a && a.era <= S.eraReached) for (const k in a.fx) out[k] = (out[k] || 0) + a.fx[k];
    }
    return out;
  }

  function armyContext() {
    const roles = new Set();
    let pride = 0;
    let rally = 0;
    const me = LEADER[S.main].era;
    for (const id in S.army) {
      const u = UNIT[id];
      roles.add(u.role);
      if (u.era === me) pride++;
      if (u.trait === 'rally') rally++;
    }
    return { combo: roles.size >= 3, pride, rally };
  }

  // stats of one soldier of a unit type, with levels, era power, doctrines, leader bonuses and equipped attributes
  function unitStats(id, ctx) {
    const m = mods();
    const u = UNIT[id];
    const r = ROLES[u.role];
    const ua = uaStats(id);
    const base = eraPow(u.era) * lvlMult(CW.unitLevel(id)) * m.shard;
    const a = 1 + m.atk + m[u.role] + m.lead + m.pride * ctx.pride + 0.06 * ctx.rally + (ctx.combo ? m.combined : 0) + (ua.dmg || 0);
    const h = 1 + m.hp + m[u.role] + m.lead + (ctx.combo ? m.combined : 0) + (ua.hp || 0);
    let hp = r.hp * base * h;
    if (u.trait === 'guard') hp *= 1.3;
    let int = r.int / (1 + (ua.aspd || 0));
    if (u.trait === 'swift') int /= 1.35;
    const range = (u.range !== undefined ? u.range : r.range) * (1 + (ua.range || 0)) * (u.trait === 'snipe' ? 1.5 : 1);
    const speed = (u.speed || r.speed) * (1 + (ua.move || 0) + m.move) * (u.trait === 'swift' ? 1.2 : 1);
    return { hp, atk: r.atk * base * a, int, range, speed, ua };
  }
  CW.unitStats = (id) => unitStats(id, armyContext());
  function enemyStats(u, g) {
    const r = ROLES[u.role];
    let hp = r.hp * g * CFG.enemyHp * (1 - Math.min(0.5, mods().enemyHp));
    if (u.trait === 'guard') hp *= 1.3;
    let int = r.int;
    if (u.trait === 'swift') int /= 1.35;
    return {
      hp, atk: r.atk * g * CFG.enemyAtk, int,
      range: (u.range !== undefined ? u.range : r.range) * (u.trait === 'snipe' ? 1.5 : 1),
      speed: (u.speed || r.speed) * (u.trait === 'swift' ? 1.2 : 1), ua: {},
    };
  }

  // ------------------------------------------------------------ battle entities
  let eid = 1;
  function mkUnit(side, id, st) {
    const u = UNIT[id];
    const r = ROLES[u.role];
    return {
      id: eid++, side, uid: id, lid: null, kind: 'unit', role: u.role, trait: u.trait, era: u.era, x: 0, z: 0,
      hp: st.hp, maxHp: st.hp, atk: st.atk, int: st.int, range: st.range, speed: st.speed, ua: st.ua,
      rad: r.rad * (u.size || 1), proj: u.proj !== undefined ? u.proj : r.proj || null, splash: u.splash !== undefined ? u.splash : r.splash || 0,
      air: !!u.air, cost: r.cost, t: Math.random() * st.int, rt: 0, target: null, alive: true, stun: 0, struck: false,
      face: side === 'a' ? 1 : -1, moving: false, flash: 0, lunge: 0, burn: null, revived: false, down: 0, isHero: false, isBoss: false,
    };
  }
  const RANGED_W = { gun: 'bullet', rifle: 'bullet', mg: 'bullet', raygun: 'laser', staff: 'plasma', bow: 'arrow' };
  const commandIds = () => [S.main].concat(S.partners).filter(Boolean);
  // ---- where a leader fights: at the front of the army, or commanding from behind it.
  // Fighters (warriors, conquerors, revolutionaries, defenders) excel at the front; thinkers excel behind.
  CW.prefPos = (lid) => (CW.FRONT_CLASSES.includes(LEADER[lid].cls) ? 'front' : 'back');
  CW.leaderPos = (lid) => (S && S.pos && S.pos[lid]) || CW.prefPos(lid);
  CW.posFits = (lid) => CW.leaderPos(lid) === CW.prefPos(lid);
  CW.setPos = function (lid, pos) {
    if (!S.roster[lid]) return false;
    S.pos[lid] = pos === 'back' ? 'back' : 'front';
    M = null;
    emit('command');
    return true;
  };
  function heroStats(lid, isMain, ctx) {
    let dps = 0;
    let hp = 0;
    let n = 0;
    for (const id in S.army) {
      const st = unitStats(id, ctx);
      const c = S.army[id];
      dps += (st.atk / st.int) * c;
      hp += st.hp * c;
      n += c;
    }
    n = Math.max(1, n);
    const r = S.roster[lid] || { lv: 1, stars: 0 };
    const b = (1 + 0.05 * (r.lv - 1)) * (1 + 0.1 * r.stars) * (1 + 0.25 * CW.prestige(lid));
    const k = isMain ? 1.4 : 1;
    const lead = CW.leaderPos(lid) === 'front' && CW.posFits(lid) ? 1.5 : 1;
    return { hp: (hp / n) * CFG.heroHp * k * b * (1 + mods().heroHp), atk: (dps / n) * 1.2 * CFG.heroAtk * k * b * lead, int: 1.2 };
  }
  function mkHero(lid, i, st) {
    const w = CW.weaponOf(lid);
    return {
      id: eid++, side: 'a', uid: null, lid, kind: 'hero', role: 'hero', trait: null, era: LEADER[lid].era,
      x: CW.leaderPos(lid) === 'back' ? 30 : 144, z: [60, 32, 88][i], hold: CW.leaderPos(lid) === 'back',
      hp: st.hp, maxHp: st.hp, atk: st.atk, int: st.int, range: RANGED_W[w] ? 55 : 9, speed: 24, ua: {}, rad: 5,
      proj: RANGED_W[w] || null, splash: 0, air: false, cost: 0, t: Math.random() * 0.8, rt: 0, target: null, alive: true, stun: 0,
      struck: false, face: 1, moving: false, flash: 0, lunge: 0, burn: null, revived: false, down: 0, isHero: true, isBoss: false, main: i === 0,
    };
  }
  // a leader in the ranks: worth their 6 capacity of your army's soldiers, shaped by their class, plus level and stars
  function champStats(lid, ctx) {
    let dps = 0;
    let hp = 0;
    let cp = 0;
    for (const id in S.army) {
      const st = unitStats(id, ctx);
      const c = S.army[id];
      dps += (st.atk / st.int) * c;
      hp += st.hp * c;
      cp += c * cpCost(id);
    }
    if (!cp) {
      const best = CW.unlockedUnits().filter((u) => u.role === 'inf').pop() || UNITS[0];
      const st = unitStats(best.id, ctx);
      dps = st.atk / st.int;
      hp = st.hp;
      cp = cpCost(best.id);
    }
    const r = S.roster[lid] || { lv: 1, stars: 0 };
    const b = (1 + 0.05 * (r.lv - 1)) * (1 + 0.1 * r.stars) * (1 + 0.25 * CW.prestige(lid));
    const sh = CHAMP_SHAPE[LEADER[lid].cls] || [1.2, 1];
    const n = CFG.champCost;
    // quick strikes that cleave the enemies around their target, so no damage is wasted on weak soldiers
    return { hp: (hp / cp) * n * sh[0] * b * (1 + mods().heroHp), atk: (dps / cp) * n * sh[1] * b * 0.6, int: 0.6 };
  }
  CW.champStats = (lid) => champStats(lid, armyContext());
  function mkChamp(lid, i, n, st) {
    const q = mkHero(lid, 1, st);
    q.main = false;
    q.champ = true;
    q.cost = CFG.champCost;
    q.x = 131 - (i % 2) * 4;
    q.z = 16 + (88 * (i + 0.5)) / n;
    q.hold = false;
    q.speed = 22;
    q.splash = champFighter(lid) ? 0.45 : 0.3;
    return q;
  }
  function heroAlive(lid) {
    if (!B) return true;
    for (const q of B.a) if (q.isHero && !q.champ && q.lid === lid) return q.alive;
    return true;
  }
  CW.heroAlive = heroAlive;

  // upgrades bought mid-battle reach the soldiers already fighting
  function refreshAllies() {
    if (!B) return;
    const ctx = armyContext();
    const cache = {};
    for (const q of B.a) {
      if (q.kind !== 'unit') continue;
      const st = cache[q.uid] || (cache[q.uid] = unitStats(q.uid, ctx));
      const ratio = q.maxHp > 0 ? q.hp / q.maxHp : 1;
      q.maxHp = st.hp;
      q.hp = q.alive ? st.hp * ratio : 0;
      q.atk = st.atk;
      q.int = st.int;
      q.range = st.range;
      q.speed = st.speed;
      q.ua = st.ua;
    }
    for (const h of B.a) {
      if (!h.champ) continue;
      const st = champStats(h.lid, ctx);
      const ratio = h.maxHp > 0 ? h.hp / h.maxHp : 1;
      h.maxHp = st.hp;
      h.hp = h.alive ? st.hp * ratio : 0;
      h.atk = st.atk;
      h.int = st.int;
    }
    commandIds().forEach((lid, i) => {
      const h = B.a.find((q) => q.isHero && !q.champ && q.lid === lid);
      if (!h) return;
      const st = heroStats(lid, i === 0, ctx);
      const ratio = h.maxHp > 0 ? h.hp / h.maxHp : 1;
      h.maxHp = st.hp;
      h.hp = h.alive ? st.hp * ratio : 0;
      h.atk = st.atk;
    });
  }

  // battle lines: infantry in front, heavy behind them, ranged at the back, cavalry on both flanks.
  // Big armies stack into more ranks instead of overlapping.
  function deploy(list, side) {
    const groups = { inf: [], rng: [], cav: [], hvy: [] };
    for (const q of list) groups[q.role].push(q);
    let front = 132;
    const band = (arr, zMin, zMax, gap, colStep) => {
      if (!arr.length) return front;
      const span = zMax - zMin;
      const per = Math.max(1, Math.min(arr.length, Math.floor(span / gap) + 1));
      let x0 = front;
      arr.forEach((q, i) => {
        const col = Math.floor(i / per);
        const row = i % per;
        const n = Math.min(per, arr.length - col * per);
        const z = n === 1 ? (zMin + zMax) / 2 : zMin + (span * row) / (n - 1);
        x0 = front - col * colStep;
        let x = x0 + (row % 2) * 2;
        if (side === 'e') x = FX - x;
        q.x = x + (Math.random() - 0.5) * 2;
        q.z = z + (Math.random() - 0.5) * 2;
        q.face = side === 'a' ? 1 : -1;
      });
      return x0;
    };
    const after = (x, step) => (front = x - step);
    after(band(groups.inf, 20, 100, 6, 7), 11);
    after(band(groups.hvy, 24, 96, 10, 13), 11);
    band(groups.rng, 16, 104, 6, 7);
    front = 136;
    const half = Math.ceil(groups.cav.length / 2);
    band(groups.cav.slice(0, half), 2, 15, 6, 9);
    front = 136;
    band(groups.cav.slice(half), 105, 118, 6, 9);
    for (const q of list) if (side === 'a' ? q.x < -15 : q.x > FX + 15) q.x = side === 'a' ? -15 : FX + 15;
  }

  // enemy armies grow through each era, from 75% to 125% of the capacity for that era (and bigger still once time shatters)
  function enemyCap(info) {
    if (info.chaos) return Math.floor((CFG.capBase + CFG.capPerEra * (NERA - 1)) * CFG.enemyCap * 1.3);
    const prog = info.k / Math.max(1, ERA_LEN[info.era] - 1);
    return Math.floor((CFG.capBase + CFG.capPerEra * info.era) * CFG.enemyCap * (0.75 + 0.5 * prog));
  }
  function enemyArmy(info, g) {
    let cap = enemyCap(info);
    if (info.isBoss) cap = Math.floor(cap * 0.6);
    const byRole = {};
    UNITS.forEach((u) => {
      if (u.era === info.era) byRole[u.role] = u;
    });
    const share = { hvy: 0.18, cav: 0.14, rng: 0.28 };
    const list = [];
    let used = 0;
    const add = (u, n) => {
      const st = enemyStats(u, g);
      for (let i = 0; i < n; i++) list.push(mkUnit('e', u.id, st));
      used += n * ROLES[u.role].cost;
    };
    for (const role in share) {
      const u = byRole[role];
      if (!u) continue;
      const n = Math.max(0, Math.round((cap * share[role] * (0.7 + Math.random() * 0.6)) / ROLES[role].cost));
      add(u, Math.min(n, Math.floor((cap - used) / ROLES[role].cost)));
    }
    if (byRole.inf) add(byRole.inf, Math.max(1, cap - used));
    return list;
  }

  let goldAcc = 0;
  let gpsT = 0;
  function startBattle() {
    const info = CW.stageInfo(S.stage);
    fixArmy();
    const ctx = armyContext();
    const allies = [];
    for (const id in S.army) {
      const st = unitStats(id, ctx);
      for (let i = 0; i < S.army[id]; i++) allies.push(mkUnit('a', id, st));
    }
    deploy(allies, 'a');
    commandIds().forEach((lid, i) => allies.push(mkHero(lid, i, heroStats(lid, i === 0, ctx))));
    const ch = CW.champs();
    ch.forEach((lid, i) => allies.push(mkChamp(lid, i, ch.length, champStats(lid, ctx))));
    let g = growth(S.stage);
    if (info.chaos) g *= CFG.chaos;
    const foes = enemyArmy(info, g);
    deploy(foes, 'e');
    let boss = null;
    let bossT = 0;
    if (info.isBoss) {
      const lid = info.bossId;
      let treasury = 0;
      for (let j = 0; j < 3; j++) treasury += CW.attr(lid, j).stats.gold || 0;
      const hp = ROLES.hvy.hp * g * CFG.enemyHp * CFG.bossHp * (info.echo ? 1.25 : 1) * (info.mystery ? CFG.mysteryHp : 1) * Math.min(1, 0.55 + 0.03 * S.stage) * (1 + treasury * 0.5);
      const w = CW.weaponOf(lid);
      boss = {
        id: eid++, side: 'e', uid: null, lid, kind: 'boss', role: 'boss', trait: null, era: info.era, x: FX - 70, z: 60,
        hp, maxHp: hp, atk: ROLES.hvy.atk * g * CFG.enemyAtk * CFG.bossAtk * (info.mystery ? CFG.mysteryAtk : 1), int: 1.6,
        range: RANGED_W[w] ? 60 : 13, speed: 16, ua: {}, rad: 10, proj: RANGED_W[w] || null, splash: 0.4, air: false, cost: 0,
        t: 0, rt: 0, target: null, alive: true, stun: 0, struck: false, face: -1, moving: false, flash: 0, lunge: 0, burn: null,
        revived: false, down: 0, isHero: false, isBoss: true,
      };
      foes.push(boss);
      bossT = CFG.bossTime + mods().bossTime + (info.mystery ? 15 : 0);
    }
    let aCap = 0;
    let eCap = 0;
    for (const q of allies) aCap += q.cost;
    for (const q of foes) eCap += q.cost;
    B = {
      info, phase: 'deploy', pt: 1.2, time: 0, ft: 0, a: allies, e: foes, ents: allies.concat(foes), boss, bossT, bossTMax: bossT,
      proj: [], fx: [], sa: zeroSide(), se: zeroSide(), medT: 1, aliveA: allies.length, aliveE: foes.length,
      g, aCap: Math.max(1, aCap), eCap: Math.max(1, eCap), buffs: [], bossMeter: boss ? 25 : 0, fullT: {},
      lids: commandIds().concat(CW.champs()),
    };
    sides();
    emit('stage', info);
  }

  // ---- combat multipliers from both sides' leader attributes (B.sa = yours, B.se = the enemy leader's)
  const allyAtkMult = () => Math.max(0.2, 1 + Math.min(2, B.sa.atk) - Math.min(0.7, B.se.weak));
  const allySpd = () => 1 + mods().spd + Math.min(1.5, B.sa.spd) + (B.ft < 6 ? mods().blitz : 0);
  const allyTaken = () => (1 - Math.min(0.8, mods().def + B.sa.def)) * (1 + Math.min(1.5, B.se.expose));
  const enemyAtkMult = () => Math.max(0.2, 1 + B.se.atk - Math.min(0.7, B.sa.weak + mods().enemyAtk));
  const enemyTaken = () => (1 + Math.min(1.5, B.sa.expose)) * (1 - Math.min(0.7, B.se.def));
  const enemySpd = () => 1 + Math.min(1.5, B.se.spd);

  function armyDPS() {
    let s = 0;
    for (const q of B.a) if (q.alive) s += q.atk / q.int;
    if (s === 0) for (const q of B.a) s += (q.atk / q.int) * 0.5;
    return s * allyAtkMult() * allySpd();
  }
  CW.armyDPS = () => (B ? armyDPS() : 0);

  // ---- spatial grid for crowding
  const CELL = 16;
  const GC = Math.ceil((FX + 80) / CELL);
  const GR = Math.ceil((FZ + 40) / CELL);
  const grid = [];
  for (let i = 0; i < GC * GR; i++) grid.push([]);
  const cellX = (x) => Math.max(0, Math.min(GC - 1, Math.floor((x + 40) / CELL)));
  const cellZ = (z) => Math.max(0, Math.min(GR - 1, Math.floor((z + 20) / CELL)));
  function buildGrid() {
    for (const c of grid) c.length = 0;
    for (const q of B.ents) if (q.alive && !q.air) grid[cellX(q.x) + cellZ(q.z) * GC].push(q);
  }
  // soldiers don't stand inside each other: overlapping neighbours push apart
  function separate() {
    for (const q of B.ents) {
      if (!q.alive || q.air) continue;
      const cx = cellX(q.x);
      const cz = cellZ(q.z);
      for (let gz = cz - 1; gz <= cz + 1; gz++) {
        if (gz < 0 || gz >= GR) continue;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= GC) continue;
          for (const p of grid[gx + gz * GC]) {
            if (p.id <= q.id || !p.alive) continue;
            const dx = p.x - q.x;
            const dz = p.z - q.z;
            const min = (q.rad + p.rad) * 0.8;
            const d2 = dx * dx + dz * dz;
            if (d2 >= min * min) continue;
            const d = Math.sqrt(d2) || 0.01;
            const push = (min - d) / 2;
            const nx = d2 ? dx / d : Math.random() - 0.5;
            const nz = d2 ? dz / d : Math.random() - 0.5;
            const wq = q.isBoss ? 0.1 : 1;
            const wp = p.isBoss ? 0.1 : 1;
            q.x -= nx * push * wq;
            q.z -= nz * push * wq;
            p.x += nx * push * wp;
            p.z += nz * push * wp;
          }
        }
      }
      q.z = Math.max(2, Math.min(FZ - 2, q.z));
      q.x = Math.max(-20, Math.min(FX + 20, q.x));
    }
  }
  function nearestFoe(q) {
    const foes = q.side === 'a' ? B.e : B.a;
    let best = null;
    let bd = Infinity;
    for (const f of foes) {
      if (!f.alive) continue;
      const dx = f.x - q.x;
      const dz = (f.z - q.z) * 1.3;
      const d = dx * dx + dz * dz;
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    return best;
  }
  function nearestTo(list, x, z, r, not) {
    let best = null;
    let bd = r * r;
    for (const f of list) {
      if (!f.alive || f === not) continue;
      const d = (f.x - x) ** 2 + (f.z - z) ** 2;
      if (d < bd) {
        bd = d;
        best = f;
      }
    }
    return best;
  }

  // ---- one soldier's turn: pick the nearest enemy, march into range, attack
  function think(q, dt, spd) {
    q.rt -= dt;
    let t = q.target;
    if (!t || !t.alive || q.rt <= 0) {
      t = q.target = nearestFoe(q);
      q.rt = 0.3 + Math.random() * 0.25;
    }
    if (!t) {
      q.moving = false;
      return;
    }
    const dx = t.x - q.x;
    const dz = t.z - q.z;
    const d = Math.sqrt(dx * dx + dz * dz) || 0.001;
    q.face = dx >= 0 ? 1 : -1;
    if (q.hold && d > q.range + 45) {
      q.moving = false;
      return;
    }
    const reach = q.range + t.rad + q.rad * 0.5;
    if (d > reach) {
      const k = Math.min(q.speed * dt, d - reach * 0.9) / d;
      q.x += dx * k;
      q.z += dz * k;
      q.moving = true;
    } else {
      q.moving = false;
      q.t += dt * spd;
      if (q.t >= q.int) {
        q.t -= q.int;
        attack(q, t, d);
      }
    }
  }

  function attack(a, t, d) {
    const ally = a.side === 'a';
    const m = mods();
    const sd = ally ? B.sa : B.se;
    const ua = a.ua;
    let dmg = a.atk * (ally ? allyAtkMult() : enemyAtkMult());
    if (!a.struck) {
      a.struck = true;
      if (a.trait === 'charge') dmg *= 4;
      if (ua.charge) dmg *= 1 + ua.charge;
      if (ally && m.firstStrike) dmg *= 1 + m.firstStrike;
    }
    if (ua.berserk && a.hp < a.maxHp / 2) dmg *= 1 + ua.berserk;
    if (ally && m.lastStand && a.hp < a.maxHp * 0.35) dmg *= 1 + m.lastStand;
    if (a.trait === 'snipe') dmg *= 1.3;
    if (a.role === 'rng') dmg *= 1 + sd.ranged;
    const cc = (ally ? m.crit : 0.05) + sd.crit + (a.trait === 'crit' ? 0.25 : 0) + (ua.crit || 0);
    const crit = Math.random() < cc;
    if (crit) dmg *= ally ? 2 + m.critDmg : 2;
    a.lunge = 1;
    if (a.proj && d > 14) {
      B.proj.push({
        kind: a.proj, side: a.side, src: a, tgt: t, x0: a.x, z0: a.z, h0: a.air ? 24 : a.isBoss ? 30 : 7,
        x1: t.x, z1: t.z, h1: t.air ? 24 : 5, t: 0, dur: Math.max(0.05, d / (PSPEED[a.proj] || 200)), dmg, crit,
      });
    } else land({ src: a, tgt: t, dmg, crit, x1: t.x, z1: t.z, side: a.side, melee: true });
  }

  function land(p) {
    const a = p.src;
    const ally = p.side === 'a';
    const foes = ally ? B.e : B.a;
    let t = p.tgt;
    if (!t || !t.alive || (t.x - p.x1) ** 2 + (t.z - p.z1) ** 2 > 100) t = nearestTo(foes, p.x1, p.z1, 8);
    const splash = (a.splash || 0) + (a.trait === 'splash' ? 0.35 : 0) + (a.ua.splash || 0) + (ally ? B.sa.splash : B.se.splash);
    if (t) hit(a, t, p.dmg, p.crit, false);
    if (splash > 0) {
      const r = 11 + (a.role === 'hvy' ? 6 : 0) + (a.isBoss ? 8 : 0);
      for (const f of foes) if (f.alive && f !== t && (f.x - p.x1) ** 2 + (f.z - p.z1) ** 2 < r * r) hit(a, f, p.dmg * splash, false, true);
      if (a.role === 'hvy' || a.isBoss || (splash >= 0.3 && !a.champ)) B.fx.push({ k: 'blast', x: p.x1, z: p.z1, r: r * 0.55, side: p.side });
    }
  }

  function hit(a, t, dmg, crit, sec) {
    const ally = a.side === 'a';
    const done = dealTo(t, dmg, ally, a, false);
    if (done <= 0) return;
    const ua = a.ua;
    if (a.alive) {
      const dr = (a.trait === 'drain' ? 0.3 : 0) + (ua.drain || 0);
      if (dr) a.hp = Math.min(a.maxHp, a.hp + done * dr);
    }
    if (!sec) {
      const pr = (a.trait === 'pierce' ? 0.6 : 0) + (ua.pierce || 0);
      if (pr) {
        const o = nearestTo(ally ? B.e : B.a, t.x, t.z, 22, t);
        if (o) hit(a, o, dmg * pr, false, true);
      }
      const stn = (ally ? B.sa.stun : B.se.stun) + (a.trait === 'stun' ? 0.15 : 0) + (ua.stun || 0);
      if (stn && t.alive && Math.random() < stn) t.stun = Math.max(t.stun, t.isBoss ? 0.5 : 1);
      if (ua.burn && t.alive) t.burn = { dps: (dmg * ua.burn) / 3, t: 3 };
      if (B.fx.length < 400) B.fx.push({ k: 'hit', to: t.id, crit, dmg: done, side: a.side });
    }
  }

  function dealTo(t, dmg, fromAlly, src, quiet) {
    const m = mods();
    if (t.ua.dodge && Math.random() < t.ua.dodge) return 0;
    if ((fromAlly ? B.se : B.sa).shield > 0) return 0;
    if (fromAlly) {
      dmg *= enemyTaken();
      if (t.isBoss) dmg *= 1 + m.bossDmg + B.sa.boss + (src && src.trait === 'bossbane' ? 0.6 : 0);
    } else {
      dmg *= allyTaken();
      if (t.isHero) dmg *= 1 + B.se.boss;
    }
    if (t.trait === 'armor') dmg *= 0.7;
    if (t.trait === 'guard') dmg *= 0.85;
    if (t.champ) dmg *= 0.5; // leaders in the ranks fight with a bodyguard
    if (t.ua.def) dmg *= 1 - Math.min(0.7, t.ua.def);
    if (t.ua.rdef && src && src.proj) dmg *= 1 - t.ua.rdef;
    t.hp -= dmg;
    if (!quiet) t.flash = 1;
    if (t.hp <= 0 && t.alive) {
      t.hp = 0;
      t.alive = false;
      onDeath(t, src);
    }
    return dmg;
  }

  function addGold(g) {
    S.gold += g;
    S.stats.gold += g;
    goldAcc += g;
  }
  CW.addGold = addGold;

  function onDeath(q, src, bySpecial) {
    B.fx.push({ k: 'death', id: q.id, x: q.x, z: q.z, uid: q.uid, lid: q.lid, side: q.side, kind: q.kind, air: q.air, face: q.face });
    if (!bySpecial) {
      if (q.side === 'e' && !q.isBoss) gainMeter(q);
      if (q.side === 'a' && B.boss && B.boss.alive) B.bossMeter = Math.min(100, B.bossMeter + (q.champ ? 12 : q.isHero ? 25 : (110 * q.cost) / B.aCap));
    }
    if (q.isHero) {
      B.fx.push({ k: 'herofall', lid: q.lid, champ: !!q.champ });
      emit('heroFall', q.lid);
    }
    if (q.side === 'e' && !q.isBoss && B.lids && prestigeOn()) {
      for (const lid of B.lids) {
        const o = lst(lid);
        o.kills++;
        o[q.role === 'boss' ? 'hvy' : q.role]++;
        if (bySpecial) o.spkills++;
      }
    }
    if (q.side === 'e') {
      S.stats.kills++;
      if (!q.isBoss) {
        addGold(bounty() * q.cost * (1 + ((src && src.ua && src.ua.gold) || 0)));
        if (Math.random() < 0.35) B.fx.push({ k: 'gold', x: q.x, z: q.z });
      }
    }
  }

  // ------------------------------------------------------------ special meters and special moves
  // Every enemy your army defeats fills your leaders' meters by its share of the enemy army's strength: a heavy unit
  // (4 capacity) is worth four times an infantryman, so beating weak units fills the meter slowly.
  // The commander gets the full share, partners 80%, and a leader commanding from behind (where they excel) 30% more.
  function gainMeter(q) {
    const base = (95 * q.cost) / B.eCap;
    commandIds().forEach((lid, i) => {
      if (!heroAlive(lid)) return;
      const k = (i === 0 ? 1 : 0.8) * (CW.leaderPos(lid) === 'back' && CW.posFits(lid) ? 1.3 : 1);
      S.meter[lid] = Math.min(100, (S.meter[lid] || 0) + base * k);
    });
  }
  CW.meter = (lid) => (S.meter && S.meter[lid]) || 0;
  // the enemy leader's special: their signature on the pathway; once time shatters, any of their three
  CW.bossSpecial = function () {
    if (!B || !B.boss) return null;
    const list = CW.SPECIALS[B.boss.lid];
    return B.info.chaos ? list[hash(S.seed, B.info.stage * 7 + 3) % 3] : list[0];
  };
  CW.bossMeter = () => (B ? B.bossMeter : 0);
  // ---- each leader has three specials of their own: the signature one to start, then one more per prestige rank.
  // Only one is equipped at a time; its kind sets how much of the meter it costs.
  const SP_COST = { barrage: 100, charge: 100, execute: 100, inferno: 100, snipe: 90, terror: 90, revive: 90, reinforce: 90, drain: 90, rally: 80, fortify: 80, heal: 80, shield: 80, stun: 70, tribute: 70 };
  CW.SP_COST = SP_COST;
  CW.prestige = (lid) => (S && S.prest && S.prest[lid]) || 0;
  CW.specials = function (lid) {
    const r = (S && S.roster[lid]) || { stars: 0 };
    const rank = CW.prestige(lid);
    const k = 1.25 * (1 + 0.05 * r.stars) * (1 + 0.2 * rank);
    const eq = CW.equippedIndex(lid);
    return CW.SPECIALS[lid].map((sp, i) => ({ name: sp[0], t: sp[1], cost: SP_COST[sp[1]], k, i, sig: i === 0, unlocked: i <= rank, equipped: i === eq }));
  };
  CW.equippedIndex = function (lid) {
    const i = (S && S.spEq && S.spEq[lid]) || 0;
    return i <= CW.prestige(lid) ? i : 0;
  };
  CW.special = (lid) => CW.specials(lid)[CW.equippedIndex(lid)];
  CW.equipSpecial = function (lid, i) {
    if (!S.roster[lid] || i < 0 || i > 2 || i > CW.prestige(lid)) return false;
    S.spEq[lid] = i;
    if (B) B.fullT[lid] = 0;
    emit('command');
    return true;
  };

  // ---- prestige: every leader has two goals of their own (the Devil needs 666 defeated enemies, Leonidas 300 infantry...).
  // Meeting one lets you prestige the leader: +25% strength on the field, +20% attribute strength and a new special.
  // Prestige opens once the main story is over (the time pathway finished, right where a Time Rift would come next);
  // goals only count from then on, and it stays open through later Time Rifts.
  const prestigeOn = () => !!S && S.best > PATH_LEN;
  CW.prestigeUnlocked = prestigeOn;
  const PSTAT = { kills: 1, inf: 1, rng: 1, cav: 1, hvy: 1, wins: 1, bosses: 1, front: 1, back: 1, specials: 1, flawless: 1, taps: 1, time: 1, spkills: 1, revived: 1 };
  function lst(lid) {
    let o = S.lstats[lid];
    if (!o) {
      o = S.lstats[lid] = { eras: [] };
      for (const k in PSTAT) o[k] = 0;
    }
    return o;
  }
  CW.leaderStats = lst;
  function statVal(lid, key) {
    const o = S.lstats[lid];
    if (!o) return 0;
    if (key === 'eras') return (o.eras || []).length;
    if (key === 'time') return Math.floor((o.time || 0) / 60);
    return Math.floor(o[key] || 0);
  }
  CW.statVal = statVal;
  // the goal for a leader's next prestige rank (null once they have all three specials)
  CW.prestigeGoal = function (lid) {
    const rank = CW.prestige(lid);
    const g = CW.PRESTIGE[lid] && CW.PRESTIGE[lid][rank];
    if (!g) return null;
    const have = Math.min(g[1], statVal(lid, g[0]));
    const locked = !prestigeOn();
    return { rank: rank + 1, stat: g[0], n: g[1], have: locked ? 0 : have, locked, done: !locked && have >= g[1] && !!S.roster[lid] };
  };
  CW.doPrestige = function (lid) {
    const g = CW.prestigeGoal(lid);
    if (!g || !g.done) return false;
    S.prest[lid] = g.rank;
    S.spEq[lid] = g.rank; // the new special is equipped straight away
    M = null;
    dirty();
    emit('prestige', { lid, rank: g.rank });
    return true;
  };
  const GOAL_TXT = {
    kills: 'Defeat {n} enemies', inf: 'Defeat {n} enemy infantry', rng: 'Defeat {n} enemy ranged units', cav: 'Defeat {n} enemy cavalry',
    hvy: 'Defeat {n} heavy units (siege, tanks, mechs)', wins: 'Win {n} battles', bosses: 'Beat {n} enemy leaders', front: 'Win {n} battles at the front',
    back: 'Win {n} battles commanding from behind', specials: 'Use {n} specials', flawless: 'Win {n} battles without falling', eras: 'Win battles in {n} different eras',
    taps: 'Call {n} field strikes as commander', time: 'Command for {n} minutes', spkills: 'Defeat {n} enemies with specials', revived: 'Get {n} fallen soldiers back up',
  };
  CW.goalText = (g) => GOAL_TXT[g.stat].replace('{n}', g.n.toLocaleString('en-US'));
  CW.goalTextFor = (stat, n) => GOAL_TXT[stat].replace('{n}', n.toLocaleString('en-US'));
  // leaders whose stats count in this battle: your commander, partners and leaders in the ranks
  function track(key, n, only) {
    if (!B || !B.lids || !prestigeOn()) return;
    for (const lid of only || B.lids) lst(lid)[key] += n;
  }
  const big = (q) => q.isBoss || q.isHero;
  CW.trackFor = track;
  // lose a share of maximum health directly
  function hurtPct(t, frac, side) {
    if (!t.alive) return;
    t.hp -= t.maxHp * frac;
    t.flash = 1;
    if (t.hp <= 0) {
      t.hp = 0;
      t.alive = false;
      onDeath(t, null, true);
    }
  }
  function reinforce(side, k) {
    const list = side === 'a' ? B.a : B.e;
    let n = 0;
    for (const q of list) if (q.kind === 'unit') n++;
    n = Math.max(2, Math.round(n * 0.15 * k));
    let uid = null;
    let st = null;
    if (side === 'a') {
      const ctx = armyContext();
      let bv = -1;
      for (const id in S.army) {
        const u = UNIT[id];
        const v = unitStats(id, ctx);
        const val = ((v.atk / v.int) * v.hp) / ROLES[u.role].cost;
        if ((u.role === 'inf' ? 2 : 1) * val > bv) {
          bv = (u.role === 'inf' ? 2 : 1) * val;
          uid = id;
          st = v;
        }
      }
    } else {
      const u = UNITS.find((x) => x.era === B.info.era && x.role === 'inf') || UNITS[0];
      uid = u.id;
      st = enemyStats(u, B.g);
    }
    if (!uid) return;
    for (let i = 0; i < n; i++) {
      const q = mkUnit(side, uid, st);
      q.x = side === 'a' ? -8 - Math.random() * 14 : FX + 8 + Math.random() * 14;
      q.z = 10 + Math.random() * 100;
      q.face = side === 'a' ? 1 : -1;
      list.push(q);
      B.ents.push(q);
    }
  }
  function runSpecial(sp, side, lid) {
    const k = sp.k;
    const mine = side === 'a' ? B.a : B.e;
    const foes = side === 'a' ? B.e : B.a;
    const live = foes.filter((q) => q.alive);
    switch (sp.t) {
      case 'barrage':
        live.forEach((q) => hurtPct(q, (big(q) ? 0.06 : 0.3) * k, side));
        break;
      case 'charge': {
        const s2 = live.slice().sort((a, b) => (side === 'a' ? a.x - b.x : b.x - a.x));
        s2.slice(0, Math.max(1, Math.ceil(s2.length * 0.4))).forEach((q) => {
          hurtPct(q, (big(q) ? 0.08 : 0.55) * k, side);
          if (q.alive) q.stun = Math.max(q.stun, big(q) ? 0.6 : 1.5);
        });
        break;
      }
      case 'snipe': {
        const lead = side === 'a' ? (B.boss && B.boss.alive ? B.boss : null) : foes.find((q) => q.isHero && q.main && q.alive) || foes.find((q) => q.isHero && q.alive);
        if (lead) hurtPct(lead, (side === 'a' ? 0.22 : 0.45) * k, side);
        else live.filter((q) => !big(q)).sort((a, b) => b.maxHp - a.maxHp).slice(0, 3).forEach((q) => hurtPct(q, 1, side));
        break;
      }
      case 'rally':
        B.buffs.push({ side, t: 8, s: { atk: 0.4 * k, spd: 0.25 * k } });
        break;
      case 'fortify':
        B.buffs.push({ side, t: 8, s: { def: 0.5 } });
        mine.forEach((q) => q.alive && (q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.2 * k)));
        break;
      case 'heal':
        mine.forEach((q) => q.alive && (q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.45 * k)));
        break;
      case 'revive': {
        const dead = mine.filter((q) => !q.alive && !q.isBoss);
        dead.slice(0, Math.ceil(dead.length * Math.min(1, 0.35 * k))).forEach((q) => {
          q.alive = true;
          q.hp = q.maxHp * 0.5;
          q.stun = 0;
          q.burn = null;
          B.fx.push({ k: 'revive', id: q.id });
          if (side === 'a') track('revived', 1);
        });
        break;
      }
      case 'stun':
        live.forEach((q) => (q.stun = Math.max(q.stun, big(q) ? 1 : 3)));
        break;
      case 'terror':
        B.buffs.push({ side, t: 8, s: { weak: 0.35 * k, expose: 0.35 * k } });
        break;
      case 'inferno':
        live.forEach((q) => (q.burn = { dps: q.maxHp * (big(q) ? 0.015 : 0.06) * k, t: 6 }));
        break;
      case 'tribute':
        if (side === 'a') addGold(bounty() * 40 * k);
        else mine.forEach((q) => q.alive && (q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.25)));
        B.buffs.push({ side, t: 6, s: { atk: 0.2 } });
        break;
      case 'reinforce':
        reinforce(side, k);
        break;
      case 'execute': {
        const cut = Math.min(0.5, 0.25 * k);
        live.forEach((q) => {
          if (!big(q) && q.hp < q.maxHp * cut) hurtPct(q, 1, side);
          else hurtPct(q, (big(q) ? 0.05 : 0.1) * k, side);
        });
        break;
      }
      case 'drain':
        live.forEach((q) => hurtPct(q, (big(q) ? 0.03 : 0.15) * k, side));
        mine.forEach((q) => q.alive && (q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.25 * k)));
        break;
      case 'shield':
        B.buffs.push({ side, t: Math.min(6, 3.2 * k), s: { shield: 1 } });
        break;
    }
    B.fx.push({ k: 'special', side, lid, name: sp.name, t: sp.t });
    emit('special', { side, lid, name: sp.name, t: sp.t });
    if (side === 'a' && lid) track('specials', 1, [lid]);
  }
  // use a leader's equipped special
  CW.useSpecial = function (lid) {
    if (!B || B.phase !== 'fight' || !commandIds().includes(lid) || !heroAlive(lid)) return false;
    const sp = CW.special(lid);
    if (CW.meter(lid) < sp.cost) return false;
    S.meter[lid] = CW.meter(lid) - sp.cost;
    B.fullT[lid] = 0;
    runSpecial(sp, 'a', lid);
    return true;
  };
  const pcS = (v) => Math.round(v * 100) + '%';
  const STXT = {
    barrage: (k) => `Every enemy loses ${pcS(0.3 * k)} of their health (leaders ${pcS(0.06 * k)})`,
    charge: (k) => `The nearest 40% of the enemy army loses ${pcS(Math.min(1, 0.55 * k))} health and is stunned`,
    snipe: (k) => `The enemy leader loses ${pcS(0.22 * k)} of their health; with no leader there, the 3 toughest enemies fall`,
    rally: (k) => `+${pcS(0.4 * k)} army damage and +${pcS(0.25 * k)} attack speed for 8 seconds`,
    fortify: (k) => `Your army takes half damage for 8 seconds and heals ${pcS(0.2 * k)}`,
    heal: (k) => `Your whole army heals ${pcS(Math.min(1, 0.45 * k))} of its health`,
    revive: (k) => `${pcS(Math.min(1, 0.35 * k))} of your fallen soldiers get back up`,
    stun: () => 'Every enemy is stunned for 3 seconds (leaders for 1)',
    terror: (k) => `For 8 seconds enemies deal ${pcS(0.35 * k)} less damage and take ${pcS(0.35 * k)} more`,
    inferno: (k) => `Every enemy burns away ${pcS(0.36 * k)} of their health over 6 seconds`,
    tribute: (k) => `Gold worth ${Math.round(40 * k)} enemies, and +20% army damage for 6 seconds`,
    reinforce: (k) => `Reinforcements: ${pcS(0.15 * k)} more soldiers of your best infantry join the battle`,
    execute: (k) => `Enemies below ${pcS(Math.min(0.5, 0.25 * k))} health fall at once; the rest lose ${pcS(0.1 * k)} (leaders ${pcS(0.05 * k)})`,
    drain: (k) => `Every enemy loses ${pcS(0.15 * k)} of their health (leaders ${pcS(0.03 * k)}) and your army heals ${pcS(0.25 * k)}`,
    shield: (k) => `Your army can't be hurt for ${(Math.min(6, 3.2 * k)).toFixed(1)} seconds`,
  };
  CW.specialText = (sp) => STXT[sp.t](sp.k);
  CW.posText = (lid) =>
    CW.prefPos(lid) === 'front'
      ? 'Excels leading from the front: +20% attribute strength and +50% damage when placed at the front'
      : 'Excels commanding from behind the army: +20% attribute strength and a 30% faster special meter when placed behind';

  // field medics patch up the most wounded soldiers near them once a second
  function medics() {
    for (const q of B.ents) {
      if (!q.alive || !q.ua.medic) continue;
      const list = q.side === 'a' ? B.a : B.e;
      const near = [];
      for (const p of list) if (p.alive && p !== q && p.hp < p.maxHp && (p.x - q.x) ** 2 + (p.z - q.z) ** 2 < 900) near.push(p);
      near.sort((x, y) => x.hp / x.maxHp - y.hp / y.maxHp);
      for (let i = 0; i < Math.min(6, near.length); i++) near[i].hp = Math.min(near[i].maxHp, near[i].hp + near[i].maxHp * q.ua.medic);
    }
  }

  // ---- main simulation step
  function step(dt) {
    S.stats.time += dt;
    B.time += dt;
    gpsT += dt;
    if (gpsT >= 10) {
      const cur = goldAcc / gpsT;
      S.gps = S.gps ? S.gps * 0.6 + cur * 0.4 : cur;
      goldAcc = 0;
      gpsT = 0;
    }
    if (B.phase === 'deploy') {
      B.pt -= dt;
      if (B.pt <= 0) B.phase = 'fight';
    } else if (B.phase === 'fight') fight(dt);
    else {
      B.pt -= dt;
      for (const p of B.proj) p.t += dt;
      B.proj = B.proj.filter((p) => p.t < p.dur);
      if (B.pt <= 0) {
        if (B.phase === 'victory') afterVictory();
        else afterDefeat();
      }
    }
  }

  function fight(dt) {
    const m = mods();
    B.ft += dt;
    if (B.buffs.length) B.buffs = B.buffs.filter((b) => (b.t -= dt) > 0);
    // a charged special left alone for a few seconds fires by itself (if auto-use is on)
    for (const lid of commandIds()) {
      if (CW.meter(lid) >= CW.special(lid).cost && heroAlive(lid)) {
        B.fullT[lid] = (B.fullT[lid] || 0) + dt;
        if (S.auto.special && B.fullT[lid] >= 4) CW.useSpecial(lid);
      } else B.fullT[lid] = 0;
    }
    if (B.boss && B.boss.alive && B.bossMeter >= 100) {
      B.bossMeter = 0;
      const sp = CW.bossSpecial();
      runSpecial({ name: sp[0], t: sp[1], k: B.info.mystery ? 1.15 : 1 }, 'e', B.boss.lid);
    }
    if (prestigeOn()) for (const lid of B.lids) lst(lid).time += dt;
    sides();
    const sa = B.sa;
    const se = B.se;
    buildGrid();
    const aSpd = allySpd();
    const eSpd = enemySpd();
    for (const q of B.ents) {
      const ally = q.side === 'a';
      if (!q.alive) {
        const rv = ally ? sa.revive : se.revive;
        if (rv && !q.revived && !q.isBoss) {
          q.down += dt;
          if (q.down >= rv) {
            q.alive = true;
            q.revived = true;
            q.hp = q.maxHp * 0.35;
            q.stun = 0;
            q.burn = null;
            B.fx.push({ k: 'revive', id: q.id });
            if (ally) track('revived', 1);
          }
        }
        continue;
      }
      const rg = (ally ? m.regen + sa.regen : se.regen) + (q.trait === 'regen' ? 0.03 : 0) + (q.ua.regen || 0);
      if (rg) q.hp = Math.min(q.maxHp, q.hp + q.maxHp * rg * dt);
      if (q.burn) {
        q.burn.t -= dt;
        dealTo(q, q.burn.dps * dt, !ally, null, true);
        if (q.burn.t <= 0) q.burn = null;
        if (!q.alive) continue;
      }
      if (q.stun > 0) {
        q.stun -= dt;
        q.moving = false;
      } else think(q, dt, ally ? aSpd : eSpd);
    }
    separate();
    B.medT -= dt;
    if (B.medT <= 0) {
      B.medT = 1;
      medics();
    }
    for (let i = B.proj.length - 1; i >= 0; i--) {
      const p = B.proj[i];
      p.t += dt;
      if (p.t >= p.dur) {
        B.proj.splice(i, 1);
        land(p);
      }
    }
    let aliveA = 0;
    let aliveE = 0;
    for (const q of B.a) if (q.alive) aliveA++;
    for (const q of B.e) if (q.alive) aliveE++;
    // leader attribute: burning, spread across the enemy army
    if (sa.burn && aliveE) {
      const d = (sa.burn * armyDPS() * dt) / aliveE;
      for (const q of B.e) if (q.alive) dealTo(q, d, true, null, true);
    }
    if (se.burn && aliveA) {
      let eDps = 0;
      for (const q of B.e) if (q.alive) eDps += q.atk / q.int;
      const d = (se.burn * eDps * enemyAtkMult() * dt) / aliveA;
      for (const q of B.a) if (q.alive) dealTo(q, d, false, null, true);
    }
    if (B.boss && B.boss.alive) {
      B.bossT -= dt;
      if (B.bossT <= 0) return lose('time');
    }
    aliveA = 0;
    aliveE = 0;
    for (const q of B.a) if (q.alive) aliveA++;
    for (const q of B.e) if (q.alive) aliveE++;
    B.aliveA = aliveA;
    B.aliveE = aliveE;
    if (!aliveE) return win();
    if (!aliveA) return lose('wiped');
    if (!B.boss && B.ft > CFG.battleTime) return aliveA >= aliveE ? win() : lose('time');
  }

  function lose(why) {
    B.phase = 'defeat';
    B.pt = 1.6;
    B.loseWhy = why;
    emit('defeat', { why, info: B.info });
  }
  function afterDefeat() {
    S.farming = true;
    S.farmCount = 0;
    let t = S.stage - 1;
    while (t > 1 && CW.stageInfo(t).isBoss) t--;
    S.stage = Math.max(1, t);
    startBattle();
  }

  // prestige progress from a won battle
  function trackWin() {
    if (!prestigeOn()) return;
    for (const lid of B.lids) {
      const o = lst(lid);
      o.wins++;
      if (B.info.isBoss) o.bosses++;
      const champ = B.a.find((q) => q.isHero && q.lid === lid);
      const atFront = !champ || champ.champ || CW.leaderPos(lid) === 'front';
      if (atFront) o.front++;
      else o.back++;
      if (!champ || champ.alive) o.flawless++;
      if (!o.eras.includes(B.info.era)) o.eras.push(B.info.era);
    }
  }
  function win() {
    const m = mods();
    B.phase = 'victory';
    trackWin();
    if (!B.info.isBoss) {
      addGold(bounty() * CFG.winBonus);
      B.pt = 1.1;
      B.reward = null;
      return;
    }
    const lid = B.info.bossId;
    const g = bounty() * CFG.bossBounty * (1 + m.bossGold);
    addGold(g);
    let res;
    const r = S.roster[lid];
    if (!r) {
      S.roster[lid] = { lv: 1, stars: 0 };
      res = 'recruit';
    } else if (r.stars < 5) {
      r.stars++;
      res = 'star';
    } else {
      S.shards += 1;
      res = 'shard';
    }
    if (m.shardDrop) S.shards += m.shardDrop;
    S.stats.bosses++;
    B.reward = { lid, gold: g, res, echo: B.info.echo, mystery: B.info.mystery };
    B.pt = 1.8;
    if (m.shardDrop || res === 'shard') M = null;
    emit('victory', B.reward);
  }
  function afterVictory() {
    if (!B.info.isBoss) return stageCleared();
    const lid = B.reward.lid;
    if (!S.council) S.council = { lid, picks: 1, offers: rollOffers(), rerolls: 0 };
    else {
      S.council.picks++;
      S.council.lid = lid;
      if (!S.council.offers.length) S.council.offers = rollOffers();
    }
    if (!S.council.offers.length) S.council.picks = 0; // every doctrine is maxed out
    advanceStage();
    emit('council', S.council);
  }
  function stageCleared() {
    if (S.farming) {
      S.farmCount++;
      if (S.auto.push && S.farmCount >= 2) S.farming = false;
    }
    if (S.farming) startBattle();
    else advanceStage();
  }
  function advanceStage() {
    S.stage++;
    while (S.stage < S.runMax && CW.stageInfo(S.stage).isBoss) S.stage++;
    if (S.stage > S.runMax) S.runMax = S.stage;
    const slots = CW.champSlots();
    if (S.stage > S.best) S.best = S.stage;
    if (CW.champSlots() > slots) emit('champSlot', CW.champSlots());
    const info = CW.stageInfo(S.stage);
    const reach = info.chaos ? NERA - 1 : info.era;
    if (reach > S.eraReached) {
      // veterans train the new recruits: fresh units start a few levels below your best unit
      const top = Math.max(1, ...Object.values(S.unitLv));
      UNITS.forEach((u) => {
        if (u.era > S.eraReached && u.era <= reach && !S.unitLv[u.id]) S.unitLv[u.id] = Math.max(1, top - CFG.vet);
      });
      S.eraReached = reach;
      M = null;
      if (S.auto.build) CW.autoBuild();
      emit('era', info);
    }
    if (S.stage === PATH_LEN + 1) emit('chaos', info);
    startBattle();
  }

  // ------------------------------------------------------------ leader attributes
  // Leaders don't cast moves. Each has three always-on attributes: the commander brings all three,
  // each partner brings their first attribute, and an enemy leader's three power the enemy army while they stand.
  // A fallen leader's attributes switch off until they get back up.
  const AV = { atk: 0.3, spd: 0.25, crit: 0.15, def: 0.25, regen: 0.02, revive: 6, stun: 0.12, weak: 0.2, expose: 0.2, burn: 0.12, gold: 0.4, splash: 0.2, ranged: 0.35, boss: 0.5 };
  function zeroSide() {
    return { atk: 0, spd: 0, crit: 0, def: 0, regen: 0, revive: 0, stun: 0, weak: 0, expose: 0, burn: 0, gold: 0, splash: 0, ranged: 0, boss: 0, shield: 0 };
  }
  function effStat(f) {
    switch (f[0]) {
      case 'strike':
        return f[1] === 'all' ? 'splash' : f[1] === 'random' ? 'ranged' : f[1] === 'boss' ? 'boss' : 'atk';
      case 'buff':
        return f[1] === 'crit' ? 'crit' : f[1] === 'def' ? 'def' : f[1] === 'spd' ? 'spd' : 'atk';
      case 'heal':
        return 'regen';
      case 'weaken':
        return 'weak';
      case 'cdr':
        return 'spd';
      default:
        return f[0];
    }
  }
  const attrCache = {};
  // attribute i of a leader: 0 is their signature, 1 is what they bring as a partner, 2 is their third
  CW.attr = function (lid, i) {
    const key = lid + '|' + i;
    if (attrCache[key]) return attrCache[key];
    const sk = LEADER[lid].skills[i];
    const stats = {};
    sk.fx.forEach((f, j) => {
      const st = effStat(f);
      const k = (i === 0 ? 1 : 0.6) * (j === 0 ? 1 : 0.6);
      if (st === 'revive') {
        const v = AV.revive / k;
        stats.revive = stats.revive ? Math.min(stats.revive, v) : v;
      } else stats[st] = (stats[st] || 0) + AV[st] * k;
    });
    return (attrCache[key] = { name: sk.n, stats });
  };
  function addStats(o, stats, k) {
    for (const st in stats) {
      if (st === 'revive') {
        const v = stats.revive / k;
        o.revive = o.revive ? Math.min(o.revive, v) : v;
      } else o[st] += stats[st] * k;
    }
  }
  CW.attrStrength = function (lid, role) {
    const m = mods();
    const r = S.roster[lid] || { stars: 0 };
    const fit = S.roster[lid] && CW.posFits(lid) ? 1.2 : 1;
    return (1 + 0.1 * r.stars) * (1 + 0.2 * CW.prestige(lid)) * fit * (role === 'main' ? 1 + m.attrMain : role === 'partner' ? 1 + m.attrPartner : 1);
  };
  function sides() {
    const a = zeroSide();
    const e = zeroSide();
    commandIds().forEach((lid, i) => {
      if (!heroAlive(lid)) return;
      const k = CW.attrStrength(lid, i === 0 ? 'main' : 'partner');
      (i === 0 ? [0, 1, 2] : [1]).forEach((j) => addStats(a, CW.attr(lid, j).stats, k));
    });
    for (const q of B.a) if (q.champ && q.alive) addStats(a, CW.attr(q.lid, 0).stats, CW.champAttrK(q.lid));
    if (B.boss && B.boss.alive) {
      const k = B.info.mystery ? 1.3 : B.info.echo ? 1.15 : 1;
      for (let j = 0; j < 3; j++) addStats(e, CW.attr(B.boss.lid, j).stats, k);
    }
    for (const b of B.buffs || []) {
      const o = b.side === 'a' ? a : e;
      for (const k in b.s) o[k] += b.s[k];
    }
    B.sa = a;
    B.se = e;
  }
  const pc = (v) => Math.round(v * 100) + '%';
  const ATXT = {
    atk: (v) => `+${pc(v)} army damage`,
    spd: (v) => `+${pc(v)} attack speed`,
    crit: (v) => `+${pc(v)} chance of critical hits`,
    def: (v) => `your army takes ${pc(v)} less damage`,
    regen: (v) => `your army heals ${+(v * 100).toFixed(1)}% health every second`,
    revive: (v) => `fallen soldiers get back up once, after ${Math.round(v)} seconds`,
    stun: (v) => `${pc(v)} chance to stun on every hit`,
    weak: (v) => `enemies deal ${pc(v)} less damage`,
    expose: (v) => `enemies take ${pc(v)} more damage`,
    burn: (v) => `the enemy army burns for ${pc(v)} of your army's damage each second`,
    gold: (v) => `+${pc(v)} gold`,
    splash: (v) => `every hit also splashes nearby enemies for ${pc(v)} damage`,
    ranged: (v) => `+${pc(v)} damage from ranged units`,
    boss: (v) => `+${pc(v)} damage to enemy leaders`,
  };
  CW.attrText = function (lid, i, k) {
    k = k || 1;
    const st = CW.attr(lid, i).stats;
    const t = Object.keys(st)
      .map((x) => ATXT[x](x === 'revive' ? st[x] / k : st[x] * k))
      .join(', and ');
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  // ------------------------------------------------------------ the commander's own strike
  // tap the battlefield: an explosion at that spot hurts every enemy within reach
  CW.tap = function (wx, wz) {
    if (!B || B.phase !== 'fight') return 0;
    if (wx === undefined) {
      const f = nearestTo(B.e, 180, 60, 999);
      if (!f) return 0;
      wx = f.x;
      wz = f.z;
    }
    const r = S.roster[S.main];
    const dmg = 0.12 * armyDPS() * (1 + 0.08 * (r.lv - 1));
    let total = 0;
    for (const q of B.e) if (q.alive && (q.x - wx) ** 2 + (q.z - wz) ** 2 < 196) total += dealTo(q, dmg, true, null, false);
    S.stats.taps++;
    track('taps', 1, [S.main]);
    B.fx.push({ k: 'tap', x: wx, z: wz, dmg: total });
    return total || 1;
  };

  // ------------------------------------------------------------ economy actions
  CW.unitCost = function (id, n) {
    n = n || 1;
    const u = UNIT[id];
    const L = CW.unitLevel(id);
    const base = CFG.costBase * Math.pow(CFG.eraCost, u.era) * (1 - mods().cost);
    const r = CFG.costGrowth;
    return (base * Math.pow(r, L - 1) * (Math.pow(r, n) - 1)) / (r - 1);
  };
  CW.maxBuy = function (id) {
    const u = UNIT[id];
    const L = CW.unitLevel(id);
    const base = CFG.costBase * Math.pow(CFG.eraCost, u.era) * (1 - mods().cost) * Math.pow(CFG.costGrowth, L - 1);
    const r = CFG.costGrowth;
    const n = Math.floor(Math.log((S.gold * (r - 1)) / base + 1) / Math.log(r));
    return Math.max(0, Math.min(n, 1000));
  };
  CW.buyUnit = function (id, n) {
    if (!UNIT[id] || UNIT[id].era > S.eraReached) return false;
    if (n === 'max') n = CW.maxBuy(id);
    if (!n) return false;
    const c = CW.unitCost(id, n);
    if (c > S.gold) return false;
    S.gold -= c;
    S.unitLv[id] = CW.unitLevel(id) + n;
    if (S.auto.build && S.army[id]) autoEquip(id);
    dirty();
    emit('buy', id);
    return true;
  };
  CW.trainCost = (lid) => CFG.trainBase * Math.pow(CFG.trainGrowth, ((S.roster[lid] || {}).lv || 1) - 1);
  CW.train = function (lid) {
    const r = S.roster[lid];
    if (!r) return false;
    const c = CW.trainCost(lid);
    if (c > S.gold) return false;
    S.gold -= c;
    r.lv++;
    dirty();
    emit('train', lid);
    return true;
  };

  // ------------------------------------------------------------ war council
  function rollOffers() {
    const avail = DOCTRINES.filter((d) => (S.doctrines[d.id] || 0) < d.max);
    const w = [60, 30, 10];
    const out = [];
    while (out.length < 3 && avail.length) {
      let tot = 0;
      avail.forEach((d) => (tot += w[d.r]));
      let x = Math.random() * tot;
      let i = 0;
      for (; i < avail.length; i++) {
        x -= w[avail[i].r];
        if (x <= 0) break;
      }
      out.push(avail.splice(Math.min(i, avail.length - 1), 1)[0].id);
    }
    return out;
  }
  CW.rerollCost = () => bounty() * 15 * Math.pow(2, S.council ? S.council.rerolls : 0);
  CW.councilReroll = function () {
    if (!S.council || !S.council.picks) return false;
    const c = CW.rerollCost();
    if (S.gold < c) return false;
    S.gold -= c;
    S.council.rerolls++;
    S.council.offers = rollOffers();
    return true;
  };
  CW.councilPick = function (id) {
    const c = S.council;
    if (!c || !c.picks || !c.offers.includes(id)) return false;
    const capBefore = CW.capacity();
    S.doctrines[id] = (S.doctrines[id] || 0) + 1;
    c.picks--;
    c.offers = c.picks ? rollOffers() : [];
    if (!c.offers.length) c.picks = 0;
    dirty();
    if (CW.capacity() > capBefore && S.auto.build) CW.autoBuild();
    emit('doctrine', id);
    return true;
  };
  CW.councilClose = function () {
    if (S.council && S.council.picks === 0) S.council = null;
  };
  // pick your commander and partners; takes effect from the next battle
  CW.setCommand = function (main, p0, p1) {
    const ids = [main, p0, p1].filter(Boolean);
    if (!ids.every((id) => S.roster[id]) || new Set(ids).size !== ids.length) return false;
    S.main = main;
    S.partners = [p0, p1].filter(Boolean);
    if (S.champs) S.champs = S.champs.filter((id) => !ids.includes(id));
    M = null;
    emit('command');
    return true;
  };

  // ------------------------------------------------------------ battle controls
  CW.challenge = function () {
    if (!S.farming) return false;
    S.farming = false;
    advanceStage();
    return true;
  };
  CW.setAuto = function (k, v) {
    S.auto[k] = !!v;
    if (k === 'build' && v) CW.autoBuild();
  };

  // ------------------------------------------------------------ time rift (prestige)
  CW.riftShards = () => (S.runMax >= 40 ? Math.floor(CFG.riftBase * Math.pow(CFG.riftGrowth, S.runMax - 40)) : 0);
  CW.rift = function () {
    const n = CW.riftShards();
    if (!n) return false;
    S.shards += n;
    S.stats.rifts++;
    S.seed = (Math.random() * 1e9) | 0;
    infoCache = new Map();
    Object.assign(S, {
      gold: 0, stage: 1, runMax: 1, farming: false, farmCount: 0, unitLv: {}, eraReached: 0, doctrines: {}, council: null,
      army: START_ARMY(), owned: START_ARMY(), uattr: {},
    });
    S.auto.build = true;
    Object.values(S.roster).forEach((r) => (r.lv = 1));
    M = null;
    B = null;
    startBattle();
    emit('rift', n);
    return n;
  };

  // ------------------------------------------------------------ time
  CW.advance = function (sec) {
    if (!S) return;
    if (!B) startBattle();
    let t = Math.min(sec, 60);
    const h = CFG.dt;
    while (t > 0) {
      const d = Math.min(h, t);
      step(d);
      t -= d;
    }
    if (B.fx.length > 600) B.fx.splice(0, B.fx.length - 600);
  };
  CW.offlineGain = function (seconds) {
    const m = mods();
    const s = Math.min(seconds, 8 * 3600);
    return { seconds: s, gold: (S.gps || 0) * s * (0.5 + m.offline) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
