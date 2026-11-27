/* Chrono Command — engine: state, battle simulation, economy, progression, saving. No DOM here. */
(function (G) {
  'use strict';
  const CW = G.CW;
  const { UNIT, UNITS, LEADER, LEADERS, ERAS, ROLES, CLASSES, DOC, DOCTRINES } = CW;

  // ------------------------------------------------------------ tuning
  const CFG = (CW.CFG = {
    growth: 1.1, // enemy power per stage
    eraPow: 2.6, // unit power per era
    lvlStep: 0.15, // +15% base per level
    lvlMilestone: 25, // x2 every 25 levels
    costGrowth: 1.115,
    costBase: 6,
    eraCost: 2.9,
    enemyHp: 0.6,
    enemyAtk: 0.55,
    bossHp: 15,
    bossAtk: 1.6,
    bounty: 1.25,
    bossBounty: 30,
    waves: 3,
    stagesPerBoss: 3,
    bossTime: 40,
    trainBase: 40,
    trainGrowth: 1.3,
    riftBase: 5,
    riftGrowth: 1.04,
    vet: 0.4, // new-era units start at this share of your best unit level
    chaos: 1.6, // extra enemy strength once time shatters
    mysteryHp: 2.2,
    mysteryAtk: 1.3,
    heroAtk: 1.0, // commanders on the field, relative to an average squad
    heroHp: 3.0,
  });
  CW.SAVE_KEY = 'chronoCommand.v1';

  // ------------------------------------------------------------ campaign map
  // The time pathway runs every era in order, from the Stone Age to the Future.
  // After it ends, time shatters: random eras, stronger foes and mystery bosses, forever.
  const BOSSES = [];
  for (let e = 0; e < 9; e++) BOSSES.push(LEADERS.filter((l) => l.era === e && !l.starter).map((l) => l.id));
  BOSSES.push(['exterminator', null, null, null, null, 'alien']); // nulls: echoes of the past, picked per run
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
  function echoFor(i) {
    const p = CW.ECHO_POOL;
    return p[(hash(seed(), 99) + i * 5) % p.length];
  }
  let infoCache = new Map();
  CW.stageInfo = function (stage) {
    let r = infoCache.get(stage);
    if (r) return r;
    if (stage <= PATH_LEN) {
      const s0 = stage - 1;
      let era = 0;
      while (era < 9 && s0 >= ERA_START[era + 1]) era++;
      const k = s0 - ERA_START[era];
      const bi = Math.floor(k / SPB);
      const sub = k % SPB;
      const bossId = BOSSES[era][bi] || echoFor(bi);
      const isBoss = sub === SPB - 1;
      const L = LEADER[bossId];
      const span = ERAS[era].span;
      const variant = era === 9 && L.era !== 9 ? 'echo' : '';
      const yr = isBoss && !variant ? L.yr : Math.round(span[0] + ((span[1] - span[0]) * (k + 1)) / ERA_LEN[era]);
      r = { stage, chaos: false, era, k, bi, sub, isBoss, bossId, yr, variant, echo: era === 9, mystery: false, eraStage: k + 1, eraLen: ERA_LEN[era] };
    } else {
      const c = stage - PATH_LEN - 1;
      const seg = Math.floor(c / SPB);
      const sub = c % SPB;
      const era = hash(seed(), seg * 3 + 1) % 10;
      const mystery = seg % 4 === 0;
      let bossId;
      if (mystery) bossId = CW.MYSTERY[hash(seed(), seg * 3 + 2) % CW.MYSTERY.length];
      else {
        const pool = era < 9 ? BOSSES[era] : CW.FUTURE_POOL;
        bossId = pool[hash(seed(), seg * 3 + 2) % pool.length];
      }
      const L = LEADER[bossId];
      const span = ERAS[era].span;
      const variant = !mystery && era === 9 && L.era !== 9 ? 'echo' : '';
      const isBoss = sub === SPB - 1;
      const yr = isBoss && L.yr != null && L.era === era ? L.yr : Math.round(span[0] + ((span[1] - span[0]) * (hash(seed(), c + 7) % 1000)) / 1000);
      r = { stage, chaos: true, era, k: sub, bi: seg, sub, isBoss, bossId, yr, variant, echo: true, mystery, depth: seg + 1, eraStage: sub + 1, eraLen: SPB };
    }
    infoCache.set(stage, r);
    return r;
  };
  CW.bossStageOf = function (id) {
    for (let e = 0; e < 10; e++) {
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
  let B = null; // battle (runtime)
  let M = null; // cached modifiers
  CW.state = () => S;
  CW.battle = () => B;

  function freshState(starter) {
    const starters = LEADERS.filter((l) => l.starter).map((l) => l.id);
    if (!starters.includes(starter)) starter = starters[0];
    const roster = {};
    starters.forEach((id) => (roster[id] = { lv: 1, stars: 0 }));
    return {
      v: 1,
      seed: (Math.random() * 1e9) | 0,
      gold: 0,
      shards: 0,
      stage: 1,
      runMax: 1,
      best: 1,
      farming: false,
      farmCount: 0,
      auto: { cast: true, push: true },
      formation: ['spearman', 'spearman', 'slinger', 'chariot'],
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
    startStage(true);
    emit('reset');
    return S;
  };

  CW.load = function (obj) {
    if (!obj || typeof obj !== 'object' || !obj.roster || !obj.main) return false;
    const base = freshState(obj.main);
    S = Object.assign(base, obj);
    S.auto = Object.assign({ cast: true, push: true }, obj.auto || {});
    if (!S.seed) S.seed = (Math.random() * 1e9) | 0;
    infoCache = new Map();
    S.stats = Object.assign(base.stats, obj.stats || {});
    // sanitize references
    Object.keys(S.roster).forEach((id) => {
      if (!LEADER[id]) delete S.roster[id];
    });
    if (!S.roster[S.main]) S.main = Object.keys(S.roster)[0];
    S.partners = (S.partners || []).filter((p) => S.roster[p] && p !== S.main).slice(0, 2);
    S.formation = (S.formation || []).map((u) => (UNIT[u] && UNIT[u].era <= S.eraReached ? u : null));
    Object.keys(S.doctrines).forEach((d) => {
      if (!DOC[d]) delete S.doctrines[d];
    });
    if (S.council && !Array.isArray(S.council.offers)) S.council = null;
    M = null;
    B = null;
    startStage(true);
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
      atk: 0, hp: 0, spd: 0, crit: 0.05, critDmg: 0, def: 0, gold: 0, regen: 0, waveHeal: 0, bossGold: 0, cost: 0,
      cdr: 0, pcdr: 0, skill: 0, attrMain: 0, attrPartner: 0, heroHp: 0, combined: 0, pride: 0, enemyAtk: 0, enemyHp: 0, bossDmg: 0, bossTime: 0, shardDrop: 0,
      offline: 0, blitz: 0, lastStand: 0, firstStrike: 0, reviveHp: 0, slots: 0, inf: 0, rng: 0, hvy: 0,
    };
    for (const id in S.doctrines) {
      const d = DOC[id];
      const n = S.doctrines[id];
      for (const k in d.fx) m[k] += d.fx[k] * n;
    }
    const cl = CLASSES[LEADER[S.main].cls];
    for (const k in cl.fx) m[k] += cl.fx[k];
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

  // ------------------------------------------------------------ army
  CW.slotCount = () => Math.min(12, 4 + Math.min(6, S.eraReached) + mods().slots);
  CW.unlockedUnits = () => UNITS.filter((u) => u.era <= S.eraReached);
  CW.unitLevel = (id) => S.unitLv[id] || 1;

  function fixFormation() {
    const n = CW.slotCount();
    const f = S.formation.slice(0, n);
    while (f.length < n) f.push(null);
    for (let i = 0; i < n; i++) if (!f[i]) f[i] = bestUnitFor(i);
    S.formation = f;
  }
  function bestUnitFor(i) {
    const roles = ['inf', 'rng', 'inf', 'hvy', 'rng', 'inf'];
    const role = roles[i % roles.length];
    const pool = CW.unlockedUnits().filter((u) => u.role === role);
    pool.sort((a, b) => unitPower(b.id) - unitPower(a.id));
    return pool[0].id;
  }
  function unitPower(id) {
    const u = UNIT[id];
    return eraPow(u.era) * lvlMult(CW.unitLevel(id));
  }
  CW.unitPower = unitPower;

  function armyContext() {
    const roles = new Set();
    let pride = 0;
    let rally = 0;
    const me = LEADER[S.main].era;
    S.formation.forEach((id) => {
      if (!id) return;
      const u = UNIT[id];
      roles.add(u.role);
      if (u.era === me) pride++;
      if (u.trait === 'rally') rally++;
    });
    return { combo: roles.size === 3, pride, rally };
  }

  function squadStats(id, ctx) {
    const m = mods();
    const u = UNIT[id];
    const r = ROLES[u.role];
    const base = eraPow(u.era) * lvlMult(CW.unitLevel(id)) * m.shard;
    let a = 1 + m.atk + m[u.role] + m.lead + m.pride * ctx.pride + 0.06 * ctx.rally;
    let h = 1 + m.hp + m[u.role] + m.lead;
    if (ctx.combo) {
      a += m.combined;
      h += m.combined;
    }
    let hp = r.hp * base * h;
    if (u.trait === 'guard') hp *= 1.3;
    let int = r.int;
    if (u.trait === 'swift') int /= 1.35;
    return { hp, atk: r.atk * base * a, int };
  }
  CW.squadStats = (id) => squadStats(id, armyContext());

  let sid = 1;
  function mkSquad(side, id, st, slot) {
    const u = UNIT[id];
    return {
      sid: sid++, side, uid: id, role: u.role, trait: u.trait, era: u.era,
      hp: st.hp, maxHp: st.hp, atk: st.atk, int: st.int, t: Math.random() * st.int * 0.8,
      alive: true, stun: 0, struck: false, isBoss: false, slot, flash: 0, lunge: 0,
    };
  }

  // ---- commanders fight on the front line next to their troops
  function heroStats(lid, isMain, ctx) {
    let a = 0;
    let h = 0;
    S.formation.forEach((id) => {
      const st = squadStats(id, ctx);
      a += st.atk / st.int;
      h += st.hp;
    });
    a /= S.formation.length;
    h /= S.formation.length;
    const r = S.roster[lid] || { lv: 1, stars: 0 };
    const b = (1 + 0.05 * (r.lv - 1)) * (1 + 0.1 * r.stars);
    const m = isMain ? 1.4 : 1;
    return { hp: h * CFG.heroHp * m * b * (1 + mods().heroHp), atk: a * 1.4 * CFG.heroAtk * m * b, int: 1.4 };
  }
  CW.heroStats = (lid, isMain) => heroStats(lid, isMain, armyContext());
  function mkHero(lid, i, st) {
    return {
      sid: sid++, side: 'a', uid: null, lid, role: 'hero', isHero: true, main: i === 0, trait: null, era: LEADER[lid].era,
      hp: st.hp, maxHp: st.hp, atk: st.atk, int: st.int, t: Math.random() * 0.8, alive: true, stun: 0, struck: false,
      isBoss: false, slot: 100 + i, flash: 0, lunge: 0,
    };
  }
  const commandIds = () => [S.main].concat(S.partners).filter(Boolean);

  function buildAllies() {
    fixFormation();
    const ctx = armyContext();
    B.allies = S.formation.map((id, i) => mkSquad('a', id, squadStats(id, ctx), i));
    commandIds().forEach((lid, i) => B.allies.push(mkHero(lid, i, heroStats(lid, i === 0, ctx))));
  }
  function refreshAllies() {
    if (!B) return;
    fixFormation();
    const ctx = armyContext();
    const oldSq = B.allies.filter((q) => !q.isHero);
    const oldH = B.allies.filter((q) => q.isHero);
    let squads;
    const same = oldSq.length === S.formation.length && oldSq.every((q, i) => q.uid === S.formation[i]);
    if (!same) {
      squads = S.formation.map((id, i) => mkSquad('a', id, squadStats(id, ctx), i));
      squads.forEach((q, i) => {
        const o = oldSq[i];
        if (o && o.uid === q.uid) {
          q.hp = o.alive ? q.maxHp * (o.hp / o.maxHp) : 0;
          q.alive = o.alive;
        }
      });
    } else {
      squads = oldSq;
      squads.forEach((q) => {
        const st = squadStats(q.uid, ctx);
        const ratio = q.maxHp > 0 ? q.hp / q.maxHp : 1;
        q.maxHp = st.hp;
        q.hp = q.alive ? st.hp * ratio : 0;
        q.atk = st.atk;
        q.int = st.int;
      });
    }
    const heroes = commandIds().map((lid, i) => {
      const st = heroStats(lid, i === 0, ctx);
      const h = oldH.find((q) => q.lid === lid);
      if (!h) return mkHero(lid, i, st);
      const ratio = h.maxHp > 0 ? h.hp / h.maxHp : 1;
      h.main = i === 0;
      h.slot = 100 + i;
      h.maxHp = st.hp;
      h.hp = h.alive ? st.hp * ratio : 0;
      h.atk = st.atk;
      h.int = st.int;
      return h;
    });
    B.allies = squads.concat(heroes);
  }
  function heroAlive(lid) {
    if (!B) return true;
    for (const q of B.allies) if (q.isHero && q.lid === lid) return q.alive;
    return true;
  }
  CW.heroAlive = heroAlive;

  // ------------------------------------------------------------ battle flow
  function startStage(rebuild) {
    const info = CW.stageInfo(S.stage);
    if (!B || rebuild) {
      B = {
        allies: [], enemies: [], boss: null, phase: 'march', pt: 0.8, wave: 1, info,
        fx: [], waveT: 0, bossT: 0, goldAcc: 0, gpsT: 0, time: 0, sa: zeroSide(), se: zeroSide(),
      };
      buildAllies();
    }
    B.info = info;
    B.wave = 1;
    spawnWave();
    sides();
    emit('stage', info);
  }

  function enemySquad(u, g, i) {
    const m = mods();
    const r = ROLES[u.role];
    const st = { hp: r.hp * g * CFG.enemyHp * (1 - Math.min(0.5, m.enemyHp)), atk: r.atk * g * CFG.enemyAtk, int: r.int };
    if (u.trait === 'guard') st.hp *= 1.3;
    if (u.trait === 'swift') st.int /= 1.35;
    return mkSquad('e', u.id, st, i);
  }

  function spawnWave() {
    const info = B.info;
    let g = growth(S.stage);
    if (info.chaos) g *= CFG.chaos;
    const pool = UNITS.filter((u) => u.era === info.era);
    const pick = (role) => pool.find((u) => u.role === role);
    const roll = () => {
      const x = Math.random();
      return x < 0.45 ? 'inf' : x < 0.8 ? 'rng' : 'hvy';
    };
    const list = [];
    B.boss = null;
    if (info.isBoss) {
      const n = 2 + Math.floor(info.era / 3);
      for (let i = 0; i < n; i++) list.push(enemySquad(pick(i % 2 ? 'rng' : 'inf'), g, i));
      const lid = info.bossId;
      let treasury = 0;
      for (let j = 0; j < 3; j++) treasury += CW.attr(lid, j).stats.gold || 0;
      const hp = ROLES.hvy.hp * g * CFG.enemyHp * CFG.bossHp * (info.echo ? 1.25 : 1) * (info.mystery ? CFG.mysteryHp : 1) * Math.min(1, 0.55 + 0.03 * S.stage) * (1 + treasury * 0.5);
      const boss = {
        sid: sid++, side: 'e', uid: null, lid, role: 'boss', trait: null, era: info.era,
        hp, maxHp: hp, atk: ROLES.hvy.atk * g * CFG.enemyAtk * CFG.bossAtk * (info.mystery ? CFG.mysteryAtk : 1), int: 1.6, t: 0,
        alive: true, stun: 0, struck: false, isBoss: true, slot: 99, flash: 0, lunge: 0,
      };
      list.push(boss);
      B.boss = boss;
      B.bossT = CFG.bossTime + mods().bossTime + (info.mystery ? 15 : 0);
      B.bossTMax = B.bossT;
    } else {
      const n = Math.min(9, 3 + Math.floor(info.era / 2) + (info.sub === 1 ? 1 : 0) + (B.wave === CFG.waves ? 1 : 0) + (info.chaos ? 1 : 0));
      for (let i = 0; i < n; i++) list.push(enemySquad(pick(roll()), g, i));
    }
    // front units first, ranged behind, boss at the very back
    const order = { inf: 0, hvy: 1, rng: 2, boss: 3 };
    list.sort((a, b) => order[a.role] - order[b.role]);
    list.forEach((q, i) => (q.slot = i));
    B.enemies = list;
    B.phase = 'march';
    B.pt = 0.8;
    B.waveT = 0;
    B.allies.forEach((q) => {
      q.struck = false;
    });
    emit('wave', { wave: B.wave, info });
  }

  // ---- combat multipliers from both sides' attributes (B.sa = yours, B.se = the enemy leader's)
  const allyAtkMult = () => Math.max(0.2, 1 + Math.min(2, B.sa.atk) - Math.min(0.7, B.se.weak));
  const allySpd = () => 1 + mods().spd + Math.min(1.5, B.sa.spd) + (B.waveT < 6 ? mods().blitz : 0);
  const allyTaken = () => (1 - Math.min(0.8, mods().def + B.sa.def)) * (1 + Math.min(1.5, B.se.expose));
  const enemyAtkMult = () => Math.max(0.2, 1 + B.se.atk - Math.min(0.7, B.sa.weak + mods().enemyAtk));
  const enemyTaken = () => (1 + Math.min(1.5, B.sa.expose)) * (1 - Math.min(0.7, B.se.def));
  const enemySpd = () => 1 + Math.min(1.5, B.se.spd);

  function armyDPS(includeDead) {
    let s = 0;
    for (const q of B.allies) if (q.alive || includeDead) s += q.atk / q.int;
    if (s === 0 && !includeDead) return armyDPS(true) * 0.5;
    return s * allyAtkMult() * allySpd();
  }
  CW.armyDPS = () => (B ? armyDPS() : 0);

  const aliveOf = (arr) => arr.filter((q) => q.alive);
  function frontOf(arr) {
    let best = null;
    for (const q of arr) if (q.alive && !q.isBoss && (!best || q.slot < best.slot)) best = q;
    if (best) return best;
    for (const q of arr) if (q.alive) return q;
    return null;
  }

  function pickTarget(att, foes) {
    const alive = aliveOf(foes);
    if (!alive.length) return null;
    if (att.trait === 'snipe') {
      let w = alive[0];
      for (const q of alive) if (q.hp < w.hp) w = q;
      return w;
    }
    const guards = alive.filter((q) => q.trait === 'guard');
    if (att.role === 'rng') {
      if (guards.length && Math.random() < 0.5) return guards[0];
      return alive[(Math.random() * alive.length) | 0];
    }
    if (guards.length) return guards[0];
    return frontOf(foes);
  }

  function attack(a) {
    const ally = a.side === 'a';
    const foes = ally ? B.enemies : B.allies;
    const t = pickTarget(a, foes);
    if (!t) return;
    const m = mods();
    const sd = ally ? B.sa : B.se;
    let dmg = a.atk * (ally ? allyAtkMult() : enemyAtkMult());
    if (a.role === 'rng') dmg *= 1 + sd.ranged;
    if (!a.struck) {
      a.struck = true;
      if (a.trait === 'charge') dmg *= 4;
      if (ally && m.firstStrike) dmg *= 1 + m.firstStrike;
    }
    if (ally && m.lastStand && a.hp < a.maxHp * 0.35) dmg *= 1 + m.lastStand;
    if (a.trait === 'snipe') dmg *= 1.3;
    const cc = (ally ? m.crit : 0.05) + sd.crit + (a.trait === 'crit' ? 0.25 : 0);
    const crit = Math.random() < cc;
    if (crit) dmg *= ally ? 2 + m.critDmg : 2;
    a.lunge = 1;
    hit(a, t, dmg, crit, false);
    if (a.trait === 'pierce') {
      const o = aliveOf(foes).filter((q) => q !== t);
      if (o.length) hit(a, o[(Math.random() * o.length) | 0], dmg * 0.6, false, true);
    }
    const sp = sd.splash + (a.trait === 'splash' ? 0.35 : 0) + (a.isBoss ? 0.3 : 0);
    if (sp > 0) for (const q of foes) if (q.alive && q !== t) hit(a, q, dmg * sp, false, true);
    const stn = sd.stun + (a.trait === 'stun' ? 0.15 : 0);
    if (stn && t.alive && Math.random() < stn) t.stun = Math.max(t.stun, t.isBoss ? 0.6 : 1.1);
  }

  function dealTo(t, dmg, fromAlly, bossbane, quiet) {
    const m = mods();
    if (fromAlly) {
      dmg *= enemyTaken();
      if (t.isBoss) dmg *= 1 + m.bossDmg + B.sa.boss + (bossbane ? 0.6 : 0);
    } else {
      dmg *= allyTaken();
      if (t.isHero) dmg *= 1 + B.se.boss;
    }
    if (t.trait === 'armor') dmg *= 0.7;
    t.hp -= dmg;
    if (!quiet) t.flash = 1;
    if (t.hp <= 0 && t.alive) {
      t.hp = 0;
      t.alive = false;
      onDeath(t);
    }
    return dmg;
  }

  function hit(a, t, dmg, crit, secondary) {
    const ally = a.side === 'a';
    const done = dealTo(t, dmg, ally, a.trait === 'bossbane');
    if (a.trait === 'drain' && a.alive) a.hp = Math.min(a.maxHp, a.hp + done * 0.3);
    if (!secondary || B.fx.length < 120) B.fx.push({ k: 'hit', from: a.sid, to: t.sid, dmg: done, crit, role: a.isBoss ? 'boss' : a.role, side: a.side, sec: secondary });
  }

  function addGold(g) {
    S.gold += g;
    S.stats.gold += g;
    B.goldAcc += g;
  }
  CW.addGold = addGold;

  function onDeath(q) {
    if (q.isHero) {
      B.fx.push({ k: 'herofall', lid: q.lid });
      emit('heroFall', q.lid);
    }
    if (q.side === 'e') {
      S.stats.kills++;
      if (!q.isBoss) {
        const g = bounty();
        addGold(g);
        B.fx.push({ k: 'gold', to: q.sid, v: g });
      }
    }
  }

  // ---- main simulation step
  function step(dt) {
    S.stats.time += dt;
    B.time += dt;
    B.gpsT += dt;
    if (B.gpsT >= 10) {
      const cur = B.goldAcc / B.gpsT;
      S.gps = S.gps ? S.gps * 0.6 + cur * 0.4 : cur;
      B.goldAcc = 0;
      B.gpsT = 0;
    }
    switch (B.phase) {
      case 'march':
        B.pt -= dt;
        if (B.pt <= 0) B.phase = 'fight';
        break;
      case 'fight':
        fight(dt);
        break;
      case 'clear':
        B.pt -= dt;
        if (B.pt <= 0) afterClear();
        break;
      case 'defeat':
        B.pt -= dt;
        if (B.pt <= 0) afterDefeat();
        break;
      case 'victory':
        B.pt -= dt;
        if (B.pt <= 0) afterVictory();
        break;
    }
  }

  function fight(dt) {
    const m = mods();
    B.waveT += dt;
    sides();
    const sa = B.sa;
    const se = B.se;
    const aSpd = allySpd();
    const eSpd = enemySpd();
    const regen = m.regen + sa.regen;
    for (const q of B.allies) {
      if (!q.alive) {
        // attribute: fallen squads get back up on their own
        if (sa.revive) {
          q.down = (q.down || 0) + dt;
          if (q.down >= sa.revive) {
            q.alive = true;
            q.hp = q.maxHp * 0.35;
            q.stun = 0;
            q.down = 0;
          }
        }
        continue;
      }
      const r = regen + (q.trait === 'regen' ? 0.03 : 0);
      if (r) q.hp = Math.min(q.maxHp, q.hp + q.maxHp * r * dt);
      if (q.stun > 0) {
        q.stun -= dt;
        continue;
      }
      q.t += dt * aSpd;
      let n = 0;
      while (q.t >= q.int && n++ < 4) {
        q.t -= q.int;
        attack(q);
      }
    }
    for (const q of B.enemies) {
      if (!q.alive) {
        if (se.revive && !q.isBoss) {
          q.down = (q.down || 0) + dt;
          if (q.down >= se.revive) {
            q.alive = true;
            q.hp = q.maxHp * 0.35;
            q.down = 0;
          }
        }
        continue;
      }
      const r = se.regen + (q.trait === 'regen' ? 0.03 : 0);
      if (r) q.hp = Math.min(q.maxHp, q.hp + q.maxHp * r * dt);
      if (q.stun > 0) {
        q.stun -= dt;
        continue;
      }
      q.t += dt * eSpd;
      let n = 0;
      while (q.t >= q.int && n++ < 4) {
        q.t -= q.int;
        attack(q);
      }
    }
    // attribute: burning
    if (sa.burn) {
      const d = sa.burn * armyDPS() * dt;
      for (const q of B.enemies) if (q.alive) dealTo(q, d, true, false, true);
    }
    if (se.burn) {
      let eDps = 0;
      for (const q of B.enemies) if (q.alive) eDps += q.atk / q.int;
      const d = se.burn * eDps * enemyAtkMult() * dt;
      for (const q of B.allies) if (q.alive) dealTo(q, d, false, false, true);
    }
    // leader battle clock
    if (B.boss && B.boss.alive) {
      B.bossT -= dt;
      if (B.bossT <= 0) {
        lose('time');
        return;
      }
    }
    if (!B.enemies.some((q) => q.alive)) {
      if (B.info.isBoss) win();
      else {
        B.phase = 'clear';
        B.pt = 0.6;
      }
      return;
    }
    if (!B.allies.some((q) => q.alive)) lose('wiped');
  }

  function healBetweenWaves() {
    const m = mods();
    const heal = 0.3 * (1 + m.waveHeal);
    const rev = Math.min(1, 0.4 + m.reviveHp);
    for (const q of B.allies) {
      if (q.alive) q.hp = Math.min(q.maxHp, q.hp + q.maxHp * heal);
      else {
        q.alive = true;
        q.hp = q.maxHp * rev;
        q.stun = 0;
      }
      q.down = 0;
    }
  }

  function afterClear() {
    healBetweenWaves();
    if (B.wave < CFG.waves) {
      B.wave++;
      spawnWave();
    } else stageCleared();
  }

  function stageCleared() {
    if (S.farming) {
      S.farmCount++;
      if (S.auto.push && S.farmCount >= 2) S.farming = false;
    }
    if (S.farming) startStage();
    else advanceStage();
  }

  function advanceStage() {
    S.stage++;
    // skip boss stages already won in this run
    while (S.stage < S.runMax && CW.stageInfo(S.stage).isBoss) S.stage++;
    if (S.stage > S.runMax) S.runMax = S.stage;
    if (S.stage > S.best) S.best = S.stage;
    const info = CW.stageInfo(S.stage);
    const reach = info.chaos ? 9 : info.era;
    if (reach > S.eraReached) {
      // veterans train the new recruits: fresh units start partway to your best unit level
      const top = Math.max(1, ...Object.values(S.unitLv));
      UNITS.forEach((u) => {
        if (u.era > S.eraReached && u.era <= reach && !S.unitLv[u.id]) S.unitLv[u.id] = Math.max(1, Math.floor(top * CFG.vet));
      });
      S.eraReached = reach;
      dirty();
      fixFormation();
      emit('era', info);
    }
    if (S.stage === PATH_LEN + 1) emit('chaos', info);
    startStage();
  }

  function lose(why) {
    B.phase = 'defeat';
    B.pt = 1.4;
    B.loseWhy = why;
    emit('defeat', { why, info: B.info });
  }
  function afterDefeat() {
    S.farming = true;
    S.farmCount = 0;
    let t = S.stage - 1;
    while (t > 1 && CW.stageInfo(t).isBoss) t--;
    S.stage = Math.max(1, t);
    startStage(true);
  }

  function win() {
    const m = mods();
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
    B.phase = 'victory';
    B.pt = 1.6;
    if (m.shardDrop || res === 'shard') dirty();
    emit('victory', B.reward);
  }
  function afterVictory() {
    const lid = B.reward.lid;
    if (!S.council) S.council = { lid, picks: 1, offers: rollOffers(), rerolls: 0 };
    else {
      S.council.picks++;
      S.council.lid = lid;
      if (!S.council.offers.length) S.council.offers = rollOffers();
    }
    advanceStage();
    emit('council', S.council);
  }

  // ------------------------------------------------------------ leader attributes
  // Leaders don't cast moves. Each has three always-on attributes: the commander brings all three,
  // each partner brings their first attribute, and an enemy leader's three power the enemy army while they stand.
  // A fallen leader's attributes switch off until they get back up.
  const AV = { atk: 0.3, spd: 0.25, crit: 0.15, def: 0.25, regen: 0.02, revive: 6, stun: 0.12, weak: 0.2, expose: 0.2, burn: 0.12, gold: 0.4, splash: 0.2, ranged: 0.35, boss: 0.5 };
  function zeroSide() {
    return { atk: 0, spd: 0, crit: 0, def: 0, regen: 0, revive: 0, stun: 0, weak: 0, expose: 0, burn: 0, gold: 0, splash: 0, ranged: 0, boss: 0 };
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
        return f[0]; // revive, stun, expose, burn, gold
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
  // how strong a leader's attributes are in a given role: stars add 10% each, doctrines and classes add more
  CW.attrStrength = function (lid, role) {
    const m = mods();
    const r = S.roster[lid] || { stars: 0 };
    return (1 + 0.1 * r.stars) * (role === 'main' ? 1 + m.attrMain : role === 'partner' ? 1 + m.attrPartner : 1);
  };
  function sides() {
    const a = zeroSide();
    const e = zeroSide();
    commandIds().forEach((lid, i) => {
      if (!heroAlive(lid)) return;
      const k = CW.attrStrength(lid, i === 0 ? 'main' : 'partner');
      (i === 0 ? [0, 1, 2] : [1]).forEach((j) => addStats(a, CW.attr(lid, j).stats, k));
    });
    if (B.boss && B.boss.alive) {
      const k = B.info.mystery ? 1.3 : B.info.echo ? 1.15 : 1;
      for (let j = 0; j < 3; j++) addStats(e, CW.attr(B.boss.lid, j).stats, k);
    }
    B.sa = a;
    B.se = e;
  }
  // plain-language description of an attribute at strength k
  const pc = (v) => Math.round(v * 100) + '%';
  const ATXT = {
    atk: (v) => `+${pc(v)} army damage`,
    spd: (v) => `+${pc(v)} attack speed`,
    crit: (v) => `+${pc(v)} chance of critical hits`,
    def: (v) => `your army takes ${pc(v)} less damage`,
    regen: (v) => `your army heals ${+(v * 100).toFixed(1)}% health every second`,
    revive: (v) => `fallen squads get back up after ${Math.round(v)} seconds`,
    stun: (v) => `${pc(v)} chance to stun on every hit`,
    weak: (v) => `enemies deal ${pc(v)} less damage`,
    expose: (v) => `enemies take ${pc(v)} more damage`,
    burn: (v) => `every enemy burns for ${pc(v)} of your army's damage each second`,
    gold: (v) => `+${pc(v)} gold`,
    splash: (v) => `every hit also strikes all other enemies for ${pc(v)} damage`,
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

  // tap / click: a commander strike on the front enemy (or the one clicked)
  CW.tap = function (targetSid) {
    if (!B || B.phase !== 'fight') return 0;
    let t = targetSid ? B.enemies.find((q) => q.sid === targetSid && q.alive) : null;
    if (!t) t = frontOf(B.enemies);
    if (!t) return 0;
    const r = S.roster[S.main];
    const dmg = 0.25 * armyDPS() * (1 + 0.08 * (r.lv - 1));
    const done = dealTo(t, dmg, true, false);
    S.stats.taps++;
    B.fx.push({ k: 'tap', to: t.sid, dmg: done });
    return done;
  };

  // ------------------------------------------------------------ economy actions
  CW.unitCost = function (id, n) {
    n = n || 1;
    const u = UNIT[id];
    const L = CW.unitLevel(id);
    const base = CFG.costBase * Math.pow(CFG.eraCost, u.era) * (1 - mods().cost);
    const r = CFG.costGrowth;
    // geometric series from level L to L+n-1
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
  CW.canReorganize = () => !!S.council;
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
    S.doctrines[id] = (S.doctrines[id] || 0) + 1;
    c.picks--;
    c.offers = c.picks ? rollOffers() : [];
    dirty();
    emit('doctrine', id);
    return true;
  };
  CW.councilClose = function () {
    if (S.council && S.council.picks === 0) S.council = null;
  };
  CW.setSlot = function (i, uid) {
    if (!S.council || !UNIT[uid] || UNIT[uid].era > S.eraReached || i < 0 || i >= CW.slotCount()) return false;
    S.formation[i] = uid;
    dirty();
    return true;
  };
  CW.setCommand = function (main, p0, p1) {
    if (!S.council) return false;
    const ids = [main, p0, p1].filter(Boolean);
    if (!ids.every((id) => S.roster[id]) || new Set(ids).size !== ids.length) return false;
    S.main = main;
    S.partners = [p0, p1].filter(Boolean);
    M = null;
    dirty();
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
      formation: ['spearman', 'spearman', 'slinger', 'chariot'],
    });
    Object.values(S.roster).forEach((r) => (r.lv = 1));
    M = null;
    B = null;
    startStage(true);
    emit('rift', n);
    return n;
  };

  // ------------------------------------------------------------ time
  CW.advance = function (sec) {
    if (!S) return;
    if (!B) startStage(true);
    let t = Math.min(sec, 60);
    const h = 0.05;
    while (t > 0) {
      const d = Math.min(h, t);
      step(d);
      t -= d;
    }
    if (B.fx.length > 400) B.fx.splice(0, B.fx.length - 400);
  };
  CW.offlineGain = function (seconds) {
    const m = mods();
    const s = Math.min(seconds, 8 * 3600);
    return { seconds: s, gold: (S.gps || 0) * s * (0.5 + m.offline) };
  };
})(typeof window !== 'undefined' ? window : globalThis);
