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
      cdr: 0, pcdr: 0, skill: 0, combined: 0, pride: 0, enemyAtk: 0, enemyHp: 0, bossDmg: 0, bossTime: 0, shardDrop: 0,
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
    return CFG.bounty * growth(S.stage) * (1 + m.gold) * m.shard;
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
    return { hp: h * CFG.heroHp * m * b, atk: a * 1.4 * CFG.heroAtk * m * b, int: 1.4 };
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
        buffs: [], burns: [], cd: {}, cdMax: {}, fx: [], waveT: 0, bossT: 0, bossSkillT: 0,
        goldAcc: 0, gpsT: 0, time: 0,
      };
      buildAllies();
      initCooldowns();
    }
    B.info = info;
    B.wave = 1;
    B.buffs = B.buffs.filter((b) => b.side === 'a');
    B.burns = [];
    spawnWave();
    emit('stage', info);
  }

  function initCooldowns() {
    skillList().forEach((e) => {
      const c = skillCd(e);
      B.cd[e.key] = c * 0.35;
      B.cdMax[e.key] = c;
    });
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
      const hp = ROLES.hvy.hp * g * CFG.enemyHp * CFG.bossHp * (info.echo ? 1.25 : 1) * (info.mystery ? CFG.mysteryHp : 1) * Math.min(1, 0.55 + 0.03 * S.stage);
      const boss = {
        sid: sid++, side: 'e', uid: null, lid, role: 'boss', trait: null, era: info.era,
        hp, maxHp: hp, atk: ROLES.hvy.atk * g * CFG.enemyAtk * CFG.bossAtk * (info.mystery ? CFG.mysteryAtk : 1), int: 1.6, t: 0,
        alive: true, stun: 0, struck: false, isBoss: true, slot: 99, flash: 0, lunge: 0,
      };
      list.push(boss);
      B.boss = boss;
      B.bossT = CFG.bossTime + mods().bossTime + (info.mystery ? 15 : 0);
      B.bossTMax = B.bossT;
      B.bossSkillT = 6;
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

  // ---- buffs
  function addBuff(side, stat, v, t) {
    B.buffs.push({ side, stat, v, t, max: t });
  }
  function buff(side, stat) {
    let s = 0;
    for (const b of B.buffs) if (b.side === side && b.stat === stat) s += b.v;
    return s;
  }
  CW.buffValue = (side, stat) => (B ? buff(side, stat) : 0);
  const allyAtkMult = () => Math.max(0.2, 1 + Math.min(2, buff('a', 'atk')) - buff('a', 'weak'));
  const allySpd = () => 1 + mods().spd + Math.min(1.5, buff('a', 'spd')) + (B.waveT < 6 ? mods().blitz : 0);
  const allyTaken = () => (1 - Math.min(0.8, mods().def + buff('a', 'def'))) * (1 + buff('a', 'exposed'));
  const enemyAtkMult = () => Math.max(0.2, 1 + buff('e', 'atk') - Math.min(0.7, buff('e', 'weak')) - mods().enemyAtk);
  const enemyTaken = () => (1 + Math.min(1.5, buff('e', 'exposed'))) * (1 - Math.min(0.7, buff('e', 'def')));

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
    let dmg = a.atk * (ally ? allyAtkMult() : enemyAtkMult());
    if (!a.struck) {
      a.struck = true;
      if (a.trait === 'charge') dmg *= 4;
      if (ally && m.firstStrike) dmg *= 1 + m.firstStrike;
    }
    if (ally && m.lastStand && a.hp < a.maxHp * 0.35) dmg *= 1 + m.lastStand;
    if (a.trait === 'snipe') dmg *= 1.3;
    const cc = (ally ? m.crit + buff('a', 'crit') : 0.05) + (a.trait === 'crit' ? 0.25 : 0);
    const crit = Math.random() < cc;
    if (crit) dmg *= ally ? 2 + m.critDmg : 2;
    a.lunge = 1;
    hit(a, t, dmg, crit, false);
    if (a.trait === 'pierce') {
      const o = aliveOf(foes).filter((q) => q !== t);
      if (o.length) hit(a, o[(Math.random() * o.length) | 0], dmg * 0.6, false, true);
    }
    if (a.trait === 'splash' || a.isBoss) {
      const f = a.isBoss ? 0.3 : 0.35;
      for (const q of foes) if (q.alive && q !== t) hit(a, q, dmg * f, false, true);
    }
    if (a.trait === 'stun' && Math.random() < 0.15 && t.alive) t.stun = Math.max(t.stun, t.isBoss ? 0.6 : 1.2);
  }

  function dealTo(t, dmg, fromAlly, bossbane) {
    const m = mods();
    if (fromAlly) {
      dmg *= enemyTaken();
      if (t.isBoss) dmg *= 1 + m.bossDmg + (bossbane ? 0.6 : 0);
    } else dmg *= allyTaken();
    if (t.trait === 'armor') dmg *= 0.7;
    t.hp -= dmg;
    t.flash = 1;
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

  function skillHit(t, dmg) {
    if (!t) return;
    const done = dealTo(t, dmg, true, false);
    B.fx.push({ k: 'skillhit', to: t.sid, dmg: done });
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
    for (const k in B.cd) B.cd[k] = Math.max(0, B.cd[k] - dt);
    for (const b of B.buffs) b.t -= dt;
    B.buffs = B.buffs.filter((b) => b.t > 0);
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
    if (S.auto.cast && B.phase === 'fight') autoCast();
  }

  function fight(dt) {
    const m = mods();
    B.waveT += dt;
    const aSpd = allySpd();
    const eSpd = 1 + Math.min(1.5, buff('e', 'spd'));
    const regen = m.regen;
    for (const q of B.allies) {
      if (!q.alive) continue;
      let r = regen + (q.trait === 'regen' ? 0.03 : 0);
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
      if (!q.alive) continue;
      if (q.trait === 'regen') q.hp = Math.min(q.maxHp, q.hp + q.maxHp * 0.03 * dt);
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
    // burns
    for (const b of B.burns) {
      const d = b.dps * Math.min(dt, b.t);
      b.t -= dt;
      const arr = b.side === 'e' ? B.enemies : B.allies;
      for (const q of arr) if (q.alive) dealTo(q, d, b.side === 'e', false);
    }
    B.burns = B.burns.filter((b) => b.t > 0);
    // boss clock & boss skill
    if (B.boss && B.boss.alive) {
      B.bossT -= dt;
      if (B.boss.stun <= 0) {
        B.bossSkillT -= dt;
        if (B.bossSkillT <= 0) {
          B.bossSkillT = 10;
          bossCast();
        }
      }
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
    B.buffs = [];
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

  // ------------------------------------------------------------ skills
  function skillList() {
    const out = [];
    const ml = LEADER[S.main];
    ['ult', 's1', 's2'].forEach((k, i) => out.push({ key: k, lid: S.main, sk: ml.skills[i], main: true }));
    S.partners.forEach((p, i) => {
      if (p && LEADER[p]) out.push({ key: 'p' + i, lid: p, sk: LEADER[p].skills[1], main: false });
    });
    return out;
  }
  CW.skillList = skillList;
  function skillCd(e) {
    const m = mods();
    const r = S.roster[e.lid] || { stars: 0 };
    const red = Math.min(0.6, (e.main ? m.cdr : m.pcdr) + 0.04 * r.stars);
    return e.sk.cd * (1 - red);
  }
  CW.skillCd = skillCd;
  function skillPow(e) {
    const m = mods();
    const r = S.roster[e.lid] || { lv: 1, stars: 0 };
    return (1 + 0.08 * (r.lv - 1)) * (1 + 0.15 * r.stars) * (e.main ? 1 + m.skill : 1);
  }
  CW.skillPow = skillPow;

  CW.cast = function (key) {
    if (!B || B.phase !== 'fight') return false;
    const e = skillList().find((x) => x.key === key);
    if (!e || (B.cd[key] || 0) > 0 || !heroAlive(e.lid)) return false;
    const hero = B.allies.find((q) => q.isHero && q.lid === e.lid);
    if (hero) hero.lunge = 1.5;
    applyFx(e.sk.fx, skillPow(e));
    const c = skillCd(e);
    B.cd[key] = c;
    B.cdMax[key] = c;
    B.fx.push({ k: 'cast', key, lid: e.lid, name: e.sk.n, kinds: e.sk.fx.map((f) => f[0]) });
    emit('cast', e);
    return true;
  };

  function needsHeal() {
    let hp = 0;
    let max = 0;
    let dead = 0;
    for (const q of B.allies) {
      hp += q.hp;
      max += q.maxHp;
      if (!q.alive) dead++;
    }
    return dead > 0 || hp / max < 0.7;
  }
  function autoCast() {
    if (B.waveT < 0.4) return;
    for (const e of skillList()) {
      if ((B.cd[e.key] || 0) > 0) continue;
      const kinds = e.sk.fx.map((f) => f[0]);
      const support = kinds.every((k) => k === 'heal' || k === 'revive');
      if (support && !needsHeal()) continue;
      if (kinds.every((k) => k === 'gold') && aliveOf(B.enemies).length === 0) continue;
      CW.cast(e.key);
    }
  }

  function applyFx(fx, P) {
    const dps = armyDPS();
    for (const f of fx) {
      const [type, a, b, c] = f;
      if (type === 'strike') {
        const dmg = b * dps * P;
        const alive = aliveOf(B.enemies);
        if (!alive.length) continue;
        if (a === 'all') alive.forEach((t) => skillHit(t, dmg));
        else if (a === 'random') {
          for (let i = 0; i < 4; i++) {
            const al = aliveOf(B.enemies);
            if (!al.length) break;
            skillHit(al[(Math.random() * al.length) | 0], dmg / 2.5);
          }
        } else if (a === 'boss') skillHit(B.boss && B.boss.alive ? B.boss : frontOf(B.enemies), dmg);
        else skillHit(frontOf(B.enemies), dmg);
      } else if (type === 'buff') addBuff('a', a, b, c);
      else if (type === 'heal') {
        for (const q of B.allies) if (q.alive) q.hp = Math.min(q.maxHp, q.hp + q.maxHp * a);
        B.fx.push({ k: 'heal' });
      } else if (type === 'revive') {
        let n = a;
        const order = B.allies.slice().sort((x, y) => (y.isHero ? 1 : 0) - (x.isHero ? 1 : 0));
        for (const q of order)
          if (!q.alive && n > 0) {
            q.alive = true;
            q.hp = q.maxHp * b;
            q.stun = 0;
            n--;
          }
        B.fx.push({ k: 'heal' });
      } else if (type === 'stun') {
        for (const q of B.enemies) if (q.alive) q.stun = Math.max(q.stun, q.isBoss ? a * 0.5 : a);
      } else if (type === 'weaken') addBuff('e', 'weak', a, b);
      else if (type === 'expose') addBuff('e', 'exposed', a, b);
      else if (type === 'burn') B.burns.push({ side: 'e', dps: (a * dps * P) / b, t: b });
      else if (type === 'gold') {
        const g = a * bounty() * P;
        addGold(g);
        B.fx.push({ k: 'goldburst', v: g });
      } else if (type === 'cdr') {
        for (const k in B.cd) B.cd[k] = Math.max(0, B.cd[k] - a);
      }
    }
  }

  function bossCast() {
    const boss = B.boss;
    const l = LEADER[boss.lid];
    const sk = l.skills[0];
    for (const f of sk.fx) {
      const [type, a, b, c] = f;
      if (type === 'strike') {
        const mult = a === 'front' || a === 'boss' ? 3 : a === 'random' ? 1.4 : 1.1;
        if (a === 'front' || a === 'boss') {
          const t = frontOf(B.allies);
          if (t) dealTo(t, boss.atk * mult * enemyAtkMult(), false);
        } else for (const q of B.allies) if (q.alive) dealTo(q, boss.atk * mult * enemyAtkMult(), false);
        B.fx.push({ k: 'bossblast' });
      } else if (type === 'buff') addBuff('e', a, b * 0.7, c);
      else if (type === 'heal' || type === 'gold') boss.hp = Math.min(boss.maxHp, boss.hp + boss.maxHp * (type === 'heal' ? 0.06 : 0.04));
      else if (type === 'revive') {
        let n = a;
        for (const q of B.enemies)
          if (!q.alive && !q.isBoss && n > 0) {
            q.alive = true;
            q.hp = q.maxHp * 0.5;
            n--;
          }
      } else if (type === 'stun') {
        for (const q of B.allies) if (q.alive) q.stun = Math.max(q.stun, Math.min(2, a) * 0.6);
      } else if (type === 'weaken') addBuff('a', 'weak', a * 0.7, b);
      else if (type === 'expose') addBuff('a', 'exposed', a * 0.7, b);
      else if (type === 'burn') B.burns.push({ side: 'a', dps: boss.atk * 0.35, t: b });
      else if (type === 'cdr') addBuff('e', 'spd', 0.3, 6);
    }
    B.fx.push({ k: 'bosscast', lid: boss.lid, name: sk.n });
    emit('bossCast', { lid: boss.lid, name: sk.n });
  }

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
    B.cd = {};
    B.cdMax = {};
    initCooldowns();
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
