/* Chrono Command — UI: canvas rendering, command deck, panels, War Council, audio, saving. */
(function () {
  'use strict';
  const CW = window.CW;
  const { LEADER, LEADERS, UNIT, UNITS, ERAS, ROLES, TRAITS, CLASSES, DOC, DOCTRINES, RARITY } = CW;
  const $ = (s, el) => (el || document).querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = CW.fmt;
  const S = () => CW.state();
  const FW = CW.FIELD.W;
  const FH = CW.FIELD.H;

  let started = false;
  let tab = 'army';
  let modalKind = null;
  let picker = null;
  let lastSig = '';
  let deckSig = '';

  // ------------------------------------------------------------ names
  const NICK = {
    fdr: 'FDR', jfk: 'JFK', mlk: 'MLK', troosevelt: 'Teddy Roosevelt', mansa_musa: 'Mansa Musa', ho_chi_minh: 'Ho Chi Minh',
    kim_il_sung: 'Kim Il Sung', elizabeth2: 'Elizabeth II', elizabeth1: 'Elizabeth I', wilhelm: 'Kaiser Wilhelm', sun_tzu: 'Sun Tzu',
    vlad: 'Vlad Dracula', qin: 'Qin Shi Huang', genghis: 'Genghis Khan', che: 'Che Guevara', degaulle: 'De Gaulle', kirk: 'Charlie Kirk',
  };
  function short(id) {
    if (NICK[id]) return NICK[id];
    const n = LEADER[id].name;
    if (n.includes(' the ')) return n.split(' the ')[0];
    return n.length <= 14 ? n : n.split(' ').slice(-1)[0];
  }
  CW.short = short;
  const fmtYear = CW.fmtYear;
  const stars = (n) => (n ? '<span class="stars">' + '*'.repeat(n) + '</span>' : '');

  // ------------------------------------------------------------ skill text
  const TGT = { front: 'the front enemy', all: 'every enemy', boss: 'the enemy leader' };
  const BUFF = { atk: 'attack', spd: 'attack speed', crit: 'crit chance', def: 'damage reduction' };
  const pct = (v) => Math.round(v * 100) + '%';
  function fxText(f) {
    const [k, a, b, c] = f;
    switch (k) {
      case 'strike':
        return a === 'random' ? `4 strikes of ${pct(b / 2.5)} army damage at random enemies` : `${pct(b)} army damage to ${TGT[a]}`;
      case 'buff':
        return `+${pct(b)} ${BUFF[a]} for ${c}s`;
      case 'heal':
        return `heals the army ${pct(a)}`;
      case 'revive':
        return a >= 9 ? `revives every fallen squad at ${pct(b)} HP` : `revives ${a} fallen squads at ${pct(b)} HP`;
      case 'stun':
        return `stuns all enemies for ${a}s`;
      case 'weaken':
        return `enemies deal ${pct(a)} less damage for ${b}s`;
      case 'expose':
        return `enemies take ${pct(a)} more damage for ${b}s`;
      case 'burn':
        return `burns every enemy for ${pct(a)} army damage over ${b}s`;
      case 'gold':
        return `seizes ${a}x the kill bounty in gold`;
      case 'cdr':
        return `other skills recharge ${a}s sooner`;
    }
    return '';
  }
  const skillDesc = (sk) => {
    const t = sk.fx.map(fxText).join(', ');
    return t.charAt(0).toUpperCase() + t.slice(1) + '. Recharge ' + sk.cd + 's.';
  };
  const skillShort = (sk) => {
    const t = fxText(sk.fx[0]);
    return t.charAt(0).toUpperCase() + t.slice(1) + (sk.fx.length > 1 ? ' +' : '');
  };

  // ------------------------------------------------------------ audio
  const SFX = (() => {
    let ctx = null;
    const last = {};
    function ensure() {
      if (!ctx) {
        try {
          ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
          ctx = null;
        }
      }
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    }
    function tone(f, d, type, v, slide, delay) {
      const st = S();
      if (!ctx || !st || !st.sound) return;
      try {
        const t = ctx.currentTime + (delay || 0);
        const o = ctx.createOscillator();
        const gn = ctx.createGain();
        o.type = type || 'square';
        o.frequency.setValueAtTime(f, t);
        if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
        gn.gain.setValueAtTime(v || 0.04, t);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(gn);
        gn.connect(ctx.destination);
        o.start(t);
        o.stop(t + d + 0.03);
      } catch (e) {}
    }
    function noise(d, v) {
      const st = S();
      if (!ctx || !st || !st.sound) return;
      try {
        const n = Math.floor(ctx.sampleRate * d);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
        const src = ctx.createBufferSource();
        const gn = ctx.createGain();
        src.buffer = buf;
        gn.gain.value = v;
        src.connect(gn);
        gn.connect(ctx.destination);
        src.start();
      } catch (e) {}
    }
    function play(name) {
      if (!ctx) return;
      const now = performance.now();
      const gap = { hit: 90, coin: 110, crit: 140, tap: 45, boom: 120 }[name] || 0;
      if (gap && now - (last[name] || 0) < gap) return;
      last[name] = now;
      switch (name) {
        case 'hit': tone(160 + Math.random() * 60, 0.05, 'square', 0.012, 0.6); break;
        case 'crit': tone(520, 0.08, 'square', 0.025, 0.5); break;
        case 'boom': noise(0.25, 0.05); tone(90, 0.25, 'triangle', 0.05, 0.5); break;
        case 'coin': tone(988, 0.05, 'square', 0.015); tone(1319, 0.08, 'square', 0.015, 1, 0.05); break;
        case 'tap': tone(320, 0.05, 'square', 0.025, 0.5); break;
        case 'cast': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.09, 'square', 0.03, 1, i * 0.05)); break;
        case 'bosscast': [220, 185, 147].forEach((f, i) => tone(f, 0.14, 'sawtooth', 0.035, 1, i * 0.08)); break;
        case 'win': [523, 659, 784, 659, 784, 1047].forEach((f, i) => tone(f, 0.13, 'square', 0.04, 1, i * 0.1)); break;
        case 'lose': [392, 330, 262, 196].forEach((f, i) => tone(f, 0.18, 'triangle', 0.05, 1, i * 0.13)); break;
        case 'buy': tone(660, 0.05, 'square', 0.025); tone(880, 0.07, 'square', 0.025, 1, 0.04); break;
        case 'era': [392, 523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.12, 'square', 0.035, 1, i * 0.09)); break;
      }
    }
    return { ensure, play };
  })();

  // ------------------------------------------------------------ canvas
  const cv = $('#cv');
  const screenEl = $('#screen');
  const g = cv.getContext('2d');
  let K = 2;
  function resize() {
    const r = screenEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    K = Math.max(1, Math.min(8, Math.ceil((r.width * dpr) / FW)));
    if (cv.width !== FW * K) {
      cv.width = FW * K;
      cv.height = FH * K;
    }
  }
  const ro = new ResizeObserver(resize);
  ro.observe(screenEl);

  const pos = new Map();
  const COLX = [150, 106, 62];
  function place(list, side) {
    const front = [];
    const back = [];
    for (const q of list) {
      if (q.isBoss) continue;
      (q.role === 'rng' ? back : front).push(q);
    }
    const cols = [[], [], []];
    front.forEach((q, i) => (i < 6 ? cols[0] : cols[2]).push(q));
    back.forEach((q, i) => (i < 6 ? cols[1] : cols[2]).push(q));
    cols.forEach((col, ci) => {
      const n = col.length;
      col.forEach((q, ri) => {
        const sp = CW.unitSprite(q.uid, side);
        const gy = n === 1 ? 172 : Math.round(140 + ri * (62 / (n - 1)));
        const w = sp.multi ? 18 : sp.w;
        let x = COLX[ci] + (ri % 2 ? -5 : 0) - (sp.multi ? 0 : Math.max(0, sp.w - 18));
        if (side === 'e') x = FW - x - w;
        pos.set(q.sid, { x, y: sp.air ? gy - 34 : gy, gy, w, sp, side, air: sp.air });
      });
    });
    const boss = list.find((q) => q.isBoss);
    if (boss) pos.set(boss.sid, { x: 322, y: 150, gy: 150, w: 48, side, boss: true });
  }

  const proj = [];
  const booms = [];
  const parts = [];
  const nums = [];
  let shake = 0;
  let flashT = 0;
  let flashCol = '#fff';
  const center = (p) => ({ x: p.x + p.w / 2, y: p.boss ? p.y - 26 : p.y - (p.sp ? p.sp.h / 2 + 2 : 8) });

  function num(x, y, txt, col, scale) {
    if (nums.length > 36) nums.shift();
    nums.push({ x, y, txt, col, scale: scale || 1, t: 0 });
  }
  function boom(x, y, r, col) {
    if (booms.length > 40) booms.shift();
    booms.push({ x, y, r: r || 6, t: 0, col: col || '#ffd23f' });
  }
  function burst(x, y, n, col, kind) {
    for (let i = 0; i < n; i++) {
      if (parts.length > 220) parts.shift();
      const a = Math.random() * Math.PI * 2;
      const s = 20 + Math.random() * 40;
      parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (kind === 'coin' ? 50 : 20), t: 0, life: 0.6 + Math.random() * 0.5, col, kind });
    }
  }

  function consumeFx() {
    const B = CW.battle();
    if (!B || !B.fx.length) return;
    for (const e of B.fx) {
      const tp = pos.get(e.to);
      if (e.k === 'hit') {
        if (!tp) continue;
        const fp = pos.get(e.from);
        const c = center(tp);
        if (fp && e.role !== 'inf') {
          const f = center(fp);
          const kind = e.role === 'rng' ? 'bullet' : e.role === 'boss' ? 'orb' : 'shell';
          if (proj.length < 90 && !(e.sec && kind === 'bullet')) proj.push({ x0: f.x, y0: f.y, x1: c.x, y1: c.y, t: 0, d: kind === 'bullet' ? 0.16 : 0.34, kind, side: e.side });
        }
        if (!e.sec) {
          num(c.x + (Math.random() * 8 - 4), c.y - 6, fmt(e.dmg), e.side === 'a' ? (e.crit ? '#ffd23f' : '#ffffff') : '#ff7a6a', e.crit ? 2 : 1);
          SFX.play(e.crit ? 'crit' : 'hit');
        }
        const t = findSquad(e.to);
        if (t && !t.alive) burst(c.x, c.y, 8, t.side === 'e' ? '#c8c0b0' : '#ff7a6a');
      } else if (e.k === 'skillhit' || e.k === 'tap') {
        if (!tp) continue;
        const c = center(tp);
        boom(c.x, c.y, e.k === 'tap' ? 5 : 9, e.k === 'tap' ? '#ffffff' : '#ffb040');
        num(c.x, c.y - 10, fmt(e.dmg), e.k === 'tap' ? '#bff4ff' : '#ffb040', 2);
        if (e.k === 'skillhit') SFX.play('boom');
      } else if (e.k === 'gold') {
        if (!tp) continue;
        const c = center(tp);
        burst(c.x, c.y, 4, '#ffd23f', 'coin');
        num(c.x, c.y + 4, '+' + fmt(e.v), '#ffd23f', 1);
        SFX.play('coin');
      } else if (e.k === 'goldburst') {
        for (let i = 0; i < 6; i++) burst(40 + Math.random() * 300, 30 + Math.random() * 30, 4, '#ffd23f', 'coin');
        toast('+' + fmt(e.v) + ' gold', '');
        SFX.play('coin');
      } else if (e.k === 'cast') {
        const L = LEADER[e.lid];
        toast(short(e.lid) + ': ' + e.name, 'blue');
        flashT = 1;
        flashCol = e.kinds.includes('strike') || e.kinds.includes('burn') ? '#ffb040' : e.kinds.includes('heal') || e.kinds.includes('revive') ? '#7ddc6a' : e.kinds.includes('stun') ? '#9ad8ff' : e.kinds.includes('gold') ? '#ffd23f' : '#ffffff';
        if (e.kinds.includes('strike')) shake = 0.25;
        if (e.kinds.includes('buff')) for (const q of CW.battle().allies) {
          const p = pos.get(q.sid);
          if (p && q.alive) burst(center(p).x, center(p).y, 3, '#ffd23f', 'up');
        }
        if (e.kinds.includes('heal') || e.kinds.includes('revive')) for (const q of CW.battle().allies) {
          const p = pos.get(q.sid);
          if (p && q.alive) burst(center(p).x, center(p).y, 4, '#7ddc6a', 'up');
        }
        SFX.play('cast');
        if (L) void 0;
      } else if (e.k === 'bosscast') {
        toast(short(e.lid) + ' uses ' + e.name + '!', 'red');
        shake = 0.4;
        flashT = 0.8;
        flashCol = '#ff3a2a';
        SFX.play('bosscast');
      } else if (e.k === 'bossblast') {
        for (const q of CW.battle().allies) {
          const p = pos.get(q.sid);
          if (p) boom(center(p).x, center(p).y, 7, '#ff5a3a');
        }
      } else if (e.k === 'heal') {
        // handled by cast
      }
    }
    B.fx.length = 0;
  }
  function findSquad(sid) {
    const B = CW.battle();
    for (const q of B.allies) if (q.sid === sid) return q;
    for (const q of B.enemies) if (q.sid === sid) return q;
    return null;
  }

  function R(x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawSquad(q, p, t, B) {
    const sp = p.sp;
    let ox = 0;
    if (q.side === 'e' && B.phase === 'march') ox = Math.round((B.pt / 0.8) * 150);
    if (q.lunge > 0) ox += (q.side === 'a' ? 1 : -1) * Math.round(q.lunge * (q.role === 'rng' ? 1 : 4));
    if (!q.alive) {
      if (q.side === 'a') {
        R(p.x + 6, p.gy - 7, 3, 7, '#8a8a80');
        R(p.x + 4, p.gy - 5, 7, 2, '#8a8a80');
        R(p.x + 2, p.gy, 11, 1, 'rgba(0,0,0,.35)');
      }
      return;
    }
    const step = ((t * 2.4 + q.sid * 0.37) % 1) < 0.5 ? 0 : 1;
    const img = q.flash > 0.45 ? sp.flash : sp.c;
    if (sp.multi) {
      const n = Math.max(1, Math.ceil((3 * q.hp) / q.maxHp - 0.001));
      const offs = [[6, -5], [0, -2], [9, 0]];
      for (let i = 0; i < n; i++) {
        const [dx, dy] = offs[i];
        R(p.x + ox + dx + 1, p.gy + dy, 8, 1, 'rgba(0,0,0,.3)');
        g.drawImage(img, p.x + ox + dx, p.gy - sp.h + dy - (i === 1 ? step : 0));
      }
    } else {
      R(p.x + ox + 2, p.gy, sp.w - 4, 2, 'rgba(0,0,0,.3)');
      g.drawImage(img, p.x + ox, p.y - sp.h - (p.air ? step : 0));
    }
    // health bar
    const bw = 16;
    const bx = Math.round(p.x + ox + (p.w - bw) / 2);
    const by = p.gy + 3;
    R(bx - 1, by - 1, bw + 2, 4, '#0b0d08');
    R(bx, by, Math.max(1, Math.round((bw * q.hp) / q.maxHp)), 2, q.side === 'a' ? '#5ad1ff' : '#ff5a4a');
    if (q.stun > 0) {
      const a = t * 8;
      const c = center(p);
      R(c.x + Math.cos(a) * 6 + ox, p.y - (sp.h || 12) - 4 + Math.sin(a) * 2, 2, 2, '#ffe86a');
      R(c.x + Math.cos(a + 3) * 6 + ox, p.y - (sp.h || 12) - 4 + Math.sin(a + 3) * 2, 2, 2, '#ffe86a');
    }
  }

  function drawBoss(q, p, t, B) {
    if (!q.alive) return;
    const echo = B.info.echo;
    const img = CW.portrait(q.lid, echo ? 'echo' : '');
    let ox = B.phase === 'march' ? Math.round((B.pt / 0.8) * 150) : 0;
    if (q.lunge > 0) ox -= Math.round(q.lunge * 6);
    const bob = Math.round(Math.sin(t * 3));
    const x = p.x + ox;
    const y = p.y - 52 + bob;
    R(x - 2, p.gy + 1, 52, 3, 'rgba(0,0,0,.35)');
    R(x - 4, y - 4, 56, 56, '#0b0d08');
    R(x - 3, y - 3, 54, 54, echo ? '#2ee6ff' : '#ff5a4a');
    g.drawImage(img, x, y, 48, 48);
    if (q.flash > 0.45) {
      g.globalAlpha = 0.55;
      R(x, y, 48, 48, '#ffffff');
      g.globalAlpha = 1;
    }
    if (q.stun > 0) CW.bitText(g, 'STUN', x + 9, y - 12, '#ffe86a', 2, '#000');
  }

  function drawCommander(st, t) {
    const x = 6;
    const y = 6;
    R(x - 2, y - 2, 32, 32, '#0b0d08');
    R(x - 1, y - 1, 30, 30, '#5ad1ff');
    g.drawImage(CW.portrait(st.main), x, y, 28, 28);
    st.partners.forEach((pid, i) => {
      const px = x + 34;
      const py = y + i * 15;
      R(px - 1, py - 1, 15, 15, '#0b0d08');
      g.drawImage(CW.portrait(pid), px, py, 13, 13);
    });
  }

  function drawHud(B, st, t) {
    const info = B.info;
    // wave / battle label, top centre
    const label = info.isBoss ? (info.echo ? 'ECHO BATTLE' : 'LEADER BATTLE') : 'WAVE ' + B.wave + '/' + CW.CFG.waves;
    CW.bitText(g, label, Math.round(FW / 2 - CW.bitWidth(label, 2) / 2), 6, info.isBoss ? '#ff8a7a' : '#ffffff', 2, '#0b0d08');
    if (st.farming) CW.bitText(g, 'REGROUPING', Math.round(FW / 2 - CW.bitWidth('REGROUPING', 1) / 2), 19, '#ffd23f', 1, '#0b0d08');
    if (B.boss) {
      const nm = short(B.boss.lid).toUpperCase();
      const w = CW.bitWidth(nm, 2);
      CW.bitText(g, nm, FW - 8 - w, 6, '#ffffff', 2, '#0b0d08');
      const bw = 130;
      const bx = FW - 8 - bw;
      R(bx - 1, 18, bw + 2, 7, '#0b0d08');
      R(bx, 19, Math.max(0, Math.round((bw * B.boss.hp) / B.boss.maxHp)), 5, '#ff5a4a');
      R(bx, 19, Math.max(0, Math.round((bw * B.boss.hp) / B.boss.maxHp)), 1, '#ff9a8a');
      const tt = Math.max(0, Math.ceil(B.bossT)) + 'S';
      CW.bitText(g, tt, FW - 8 - CW.bitWidth(tt, 2), 28, B.bossT < 10 ? '#ff5a4a' : '#ffd23f', 2, '#0b0d08');
      R(bx, 30, Math.round((bw - 22) * (B.bossT / B.bossTMax)), 3, B.bossT < 10 ? '#ff5a4a' : '#ffd23f');
    }
    // big centre messages
    const mid = (txt, col, sc, y) => CW.bitText(g, txt, Math.round(FW / 2 - CW.bitWidth(txt, sc) / 2), y, col, sc, '#0b0d08');
    if (B.phase === 'march' && B.wave === 1) {
      g.globalAlpha = Math.min(1, B.pt * 2);
      if (info.isBoss) {
        mid('VS ' + short(info.bossId).toUpperCase(), '#ff8a7a', 3, 60);
        mid(fmtYear(info.yr), '#ffffff', 2, 82);
      } else mid('STAGE ' + st.stage, '#ffffff', 3, 64);
      g.globalAlpha = 1;
    }
    if (B.phase === 'victory') {
      mid('VICTORY!', '#ffd23f', 4, 56);
      if (B.reward) mid(B.reward.res === 'recruit' ? short(B.reward.lid).toUpperCase() + ' JOINS YOU' : B.reward.res === 'star' ? short(B.reward.lid).toUpperCase() + ' +1 STAR' : '+1 CHRONO SHARD', '#ffffff', 2, 84);
    }
    if (B.phase === 'defeat') {
      mid(B.loseWhy === 'time' ? 'OUT OF TIME!' : 'RETREAT!', '#ff5a4a', 4, 56);
      mid('REGROUP AND GROW STRONGER', '#ffffff', 1, 86);
    }
  }

  function render(dt, t) {
    const B = CW.battle();
    const st = S();
    if (!B || !st) return;
    g.setTransform(K, 0, 0, K, 0, 0);
    g.imageSmoothingEnabled = false;
    let sx = 0;
    let sy = 0;
    if (shake > 0) {
      shake -= dt;
      sx = Math.round((Math.random() - 0.5) * 4);
      sy = Math.round((Math.random() - 0.5) * 3);
    }
    g.save();
    g.translate(sx, sy);
    g.drawImage(CW.backdrop(B.info.era), 0, 0);
    // ambient embers / neon motes
    if (B.info.era === 6 || B.info.era === 9) {
      for (let i = 0; i < 14; i++) {
        const x = (i * 53 + t * (B.info.era === 6 ? 9 : 14)) % FW;
        const y = (i * 37 + t * (B.info.era === 6 ? -12 : 6)) % 110;
        R(x, (y + 110) % 110, 1, 1, B.info.era === 6 ? '#ffb060' : '#2ee6ff');
      }
    }
    drawCommander(st, t);
    const all = B.allies.concat(B.enemies).filter((q) => pos.has(q.sid));
    all.sort((a, b) => pos.get(a.sid).gy - pos.get(b.sid).gy);
    for (const q of all) {
      const p = pos.get(q.sid);
      if (q.isBoss) drawBoss(q, p, t, B);
      else drawSquad(q, p, t, B);
      q.flash = Math.max(0, q.flash - dt * 6);
      q.lunge = Math.max(0, q.lunge - dt * 7);
    }
    // projectiles
    for (let i = proj.length - 1; i >= 0; i--) {
      const p = proj[i];
      p.t += dt;
      const k = Math.min(1, p.t / p.d);
      const x = p.x0 + (p.x1 - p.x0) * k;
      const y = p.y0 + (p.y1 - p.y0) * k - (p.kind === 'shell' ? Math.sin(k * Math.PI) * 18 : 0);
      if (p.kind === 'bullet') R(x, y, 2, 1, p.side === 'a' ? '#fff6a0' : '#ffb0a0');
      else if (p.kind === 'shell') R(x - 1, y - 1, 2, 2, '#2a2a2a');
      else {
        R(x - 2, y - 2, 4, 4, '#ff5a3a');
        R(x - 1, y - 1, 2, 2, '#ffe0a0');
      }
      if (k >= 1) {
        if (p.kind !== 'bullet') boom(p.x1, p.y1, p.kind === 'orb' ? 6 : 5, p.kind === 'orb' ? '#ff5a3a' : '#ffd23f');
        proj.splice(i, 1);
      }
    }
    // explosions
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i];
      b.t += dt;
      const k = b.t / 0.35;
      if (k >= 1) {
        booms.splice(i, 1);
        continue;
      }
      const r = Math.max(1, Math.round(b.r * (0.4 + k)));
      const col = k < 0.3 ? '#ffffff' : k < 0.6 ? b.col : '#6a6a6a';
      for (let yy = -r; yy <= r; yy++) {
        const w = Math.round(Math.sqrt(r * r - yy * yy));
        R(b.x - w, b.y + yy, w * 2, 1, col);
      }
    }
    // particles
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.t += dt;
      if (p.t > p.life) {
        parts.splice(i, 1);
        continue;
      }
      if (p.kind === 'up') {
        p.y -= 26 * dt;
        p.x += p.vx * 0.05 * dt;
      } else {
        p.vy += 160 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      R(p.x, p.y, 2, 2, p.col);
    }
    // damage numbers
    for (let i = nums.length - 1; i >= 0; i--) {
      const n = nums[i];
      n.t += dt;
      if (n.t > 0.9) {
        nums.splice(i, 1);
        continue;
      }
      const w = CW.bitWidth(n.txt, n.scale);
      CW.bitText(g, n.txt, Math.round(n.x - w / 2), Math.round(n.y - n.t * 22), n.col, n.scale, '#0b0d08');
    }
    g.restore();
    drawHud(B, st, t);
    if (flashT > 0) {
      g.globalAlpha = Math.min(0.3, flashT * 0.3);
      R(0, 0, FW, FH, flashCol);
      g.globalAlpha = 1;
      flashT -= dt * 3;
    }
  }

  // tap to strike
  let lastTap = 0;
  screenEl.addEventListener('pointerdown', (e) => {
    SFX.ensure();
    const now = performance.now();
    if (now - lastTap < 60) return;
    lastTap = now;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * FW;
    const y = ((e.clientY - r.top) / r.height) * FH;
    let target = null;
    for (const [sid, p] of pos) {
      if (p.side !== 'e') continue;
      const top = p.boss ? p.y - 52 : p.y - (p.sp ? p.sp.h : 12) - 6;
      if (x >= p.x - 3 && x <= p.x + p.w + 3 && y >= top && y <= p.gy + 4) target = sid;
    }
    const dmg = CW.tap(target);
    if (dmg) {
      boom(x, y, 4, '#ffffff');
      SFX.play('tap');
    }
  });

  // ------------------------------------------------------------ toasts
  const toastEl = $('#toast');
  function toast(txt, cls) {
    while (toastEl.children.length > 2) toastEl.firstChild.remove();
    const d = document.createElement('div');
    d.className = cls || '';
    d.textContent = txt;
    toastEl.appendChild(d);
    setTimeout(() => d.remove(), 3300);
  }

  // ------------------------------------------------------------ HUD + deck
  const el = {
    gold: $('#gold'), gps: $('#gps'), shards: $('#shards'), dps: $('#dps'), era: $('#eraName'), year: $('#year'), stage: $('#stage'),
    nextImg: $('#nextImg'), nextBar: $('#nextBar'), nextTxt: $('#nextTxt'), challenge: $('#btnChallenge'), council: $('#btnCouncil'),
    deck: $('#deck'), panel: $('#panel'), autoPush: $('#autoPush'), autoCast: $('#autoCast'), modal: $('#modal'), dlg: $('#dlg'),
  };
  $('#icoGold').src = CW.icon('coin');
  $('#icoShard').src = CW.icon('shard');
  $('#icoSword').src = CW.icon('sword');
  $('#icoClock').src = CW.icon('clock');

  let nextImgId = '';
  function updateHUD() {
    const st = S();
    const B = CW.battle();
    if (!st || !B) return;
    el.gold.textContent = fmt(st.gold);
    el.gps.textContent = fmt(st.gps || 0);
    el.shards.textContent = fmt(st.shards);
    el.dps.textContent = fmt(CW.armyDPS());
    const info = B.info;
    const era = ERAS[info.era];
    el.era.textContent = 'Era ' + era.roman + ' · ' + era.name + (info.loop ? ' · Loop ' + (info.loop + 1) : '');
    el.year.textContent = fmtYear(info.yr);
    el.stage.textContent = 'Stage ' + st.stage + (st.farming ? ' · regrouping' : '');
    const bossStage = st.stage + (2 - info.sub);
    const bi = CW.stageInfo(bossStage);
    const bid = bi.bossId + (bi.echo ? 'e' : '');
    if (nextImgId !== bid) {
      nextImgId = bid;
      el.nextImg.src = CW.portraitURL(bi.bossId, bi.echo ? 'echo' : '');
    }
    const prog = info.isBoss ? 1 : (info.sub + (B.wave - 1) / CW.CFG.waves) / 2;
    el.nextBar.style.width = 'calc((100% - 4px) * ' + prog.toFixed(3) + ')';
    el.nextTxt.textContent = info.isBoss ? 'VS ' + short(bi.bossId) : short(bi.bossId) + ' in ' + (2 - info.sub) + (2 - info.sub === 1 ? ' stage' : ' stages');
    el.challenge.hidden = !st.farming;
    if (st.farming) el.challenge.textContent = 'Challenge ' + short(bi.bossId);
    el.council.hidden = !st.council;
    if (st.council) el.council.textContent = st.council.picks ? 'War Council (' + st.council.picks + ')' : 'War Council';
    const sig = [st.main, st.partners.join(','), [st.main].concat(st.partners).map((id) => st.roster[id].lv + ':' + st.roster[id].stars).join(',')].join('|');
    if (sig !== deckSig) renderDeck();
  }

  function skillBtn(e) {
    const label = e.key === 'ult' ? 'Main skill' : e.main ? 'Skill' : 'Partner skill';
    const kk = { ult: 1, s1: 2, s2: 3, p0: 4, p1: 5 }[e.key];
    return `<button class="skill ${e.key === 'ult' ? 'ult' : ''}" data-skill="${e.key}" title="${esc(skillDesc(e.sk))}"><span class="t"></span><em>${label}<span class="kbd">${kk}</span></em><b>${esc(e.sk.n)}</b><small>${esc(skillShort(e.sk))}</small></button>`;
  }
  function renderDeck() {
    const st = S();
    const L = LEADER[st.main];
    const r = st.roster[st.main];
    const cl = CLASSES[L.cls];
    const list = CW.skillList();
    deckSig = [st.main, st.partners.join(','), [st.main].concat(st.partners).map((id) => st.roster[id].lv + ':' + st.roster[id].stars).join(',')].join('|');
    const partner = (i) => {
      const e = list.find((x) => x.key === 'p' + i);
      if (!e) return `<div class="partner box notch"><div class="who"><b>Open partner slot</b><small>Recruit leaders, then assign them at the War Council</small></div></div>`;
      const pr = st.roster[e.lid];
      return `<div class="partner box notch"><img class="px" src="${CW.portraitURL(e.lid)}" alt=""><div class="who"><b>${esc(LEADER[e.lid].name)}</b><small>Partner · <span class="nw">Lv ${pr.lv}</span> ${stars(pr.stars)}</small></div>${skillBtn(e)}</div>`;
    };
    el.deck.innerHTML = `<div class="lead box notch"><img class="px" src="${CW.portraitURL(st.main)}" alt=""><div class="who"><b>${esc(L.name)}</b><small>Commander · <span class="nw">Lv ${r.lv}</span> ${stars(r.stars)} · ${esc(L.title)}</small><small>${esc(cl.name)}: ${esc(cl.d)}</small></div><div class="skills">${list.filter((e) => e.main).map(skillBtn).join('')}</div></div>${partner(0)}${partner(1)}`;
  }
  function updateDeck() {
    const B = CW.battle();
    if (!B) return;
    el.deck.querySelectorAll('[data-skill]').forEach((b) => {
      const k = b.dataset.skill;
      const cd = B.cd[k] || 0;
      const mx = B.cdMax[k] || 1;
      b.style.setProperty('--cd', (cd / mx).toFixed(3));
      b.querySelector('.t').textContent = cd > 0 ? Math.ceil(cd) + 's' : '';
      b.classList.toggle('ready', cd <= 0);
    });
  }
  el.deck.addEventListener('click', (e) => {
    const b = e.target.closest('[data-skill]');
    if (!b) return;
    SFX.ensure();
    CW.cast(b.dataset.skill);
  });

  el.autoPush.addEventListener('change', () => CW.setAuto('push', el.autoPush.checked));
  el.autoCast.addEventListener('change', () => CW.setAuto('cast', el.autoCast.checked));
  el.challenge.addEventListener('click', () => {
    SFX.ensure();
    CW.challenge();
  });
  el.council.addEventListener('click', () => openCouncil());
  function syncControls() {
    el.autoPush.checked = S().auto.push;
    el.autoCast.checked = S().auto.cast;
  }

  // ------------------------------------------------------------ panels
  document.getElementById('tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    tab = b.dataset.tab;
    document.querySelectorAll('.tab').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === tab)));
    renderPanel();
  });

  function panelSig() {
    const st = S();
    const base = [tab, st.main, st.partners.join(',')];
    if (tab === 'army') base.push(st.formation.join(','), st.eraReached, !!st.council, st.buyMode);
    if (tab === 'leaders') base.push(Object.entries(st.roster).map(([k, r]) => k + r.stars).join(','));
    if (tab === 'doctrines') base.push(JSON.stringify(st.doctrines), !!st.council);
    if (tab === 'rift') base.push(st.runMax, Math.floor(Math.log10(st.shards + 1) * 20));
    if (tab === 'options') base.push(st.sound);
    return base.join('|');
  }

  function renderPanel() {
    lastSig = panelSig();
    const f = { army: renderArmy, leaders: renderLeaders, doctrines: renderDoctrines, rift: renderRift, options: renderOptions }[tab];
    el.panel.innerHTML = f();
    updatePanel();
  }
  function updatePanel() {
    if (panelSig() !== lastSig) return renderPanel();
    const st = S();
    if (tab === 'army') {
      el.panel.querySelectorAll('[data-act="buy"]').forEach((b) => {
        const id = b.dataset.id;
        let n = st.buyMode === 'max' ? CW.maxBuy(id) : st.buyMode;
        const showN = Math.max(1, n);
        const cost = CW.unitCost(id, showN);
        b.textContent = '+' + showN + ' · ' + fmt(cost);
        b.disabled = cost > st.gold;
      });
      el.panel.querySelectorAll('[data-stat]').forEach((s) => {
        const id = s.dataset.stat;
        const sst = CW.squadStats(id);
        s.textContent = 'Lv ' + CW.unitLevel(id) + ' · ATK ' + fmt(sst.atk) + ' · HP ' + fmt(sst.hp);
      });
      el.panel.querySelectorAll('[data-slotlv]').forEach((s) => (s.textContent = 'Lv ' + CW.unitLevel(s.dataset.slotlv)));
    }
    if (tab === 'leaders') {
      el.panel.querySelectorAll('[data-lvl]').forEach((s) => {
        const r = st.roster[s.dataset.lvl];
        if (r) s.textContent = 'Lv ' + r.lv + ' · train ' + fmt(CW.trainCost(s.dataset.lvl));
      });
    }
    if (tab === 'rift') {
      const b = el.panel.querySelector('[data-rift]');
      if (b) b.textContent = fmt(CW.riftShards());
    }
  }

  function bossStageOf(id) {
    const l = LEADER[id];
    if (l.starter) return 0;
    const i = CW.BOSSES[l.era].indexOf(id);
    return CW.ERA_START[l.era] + i * CW.CFG.stagesPerBoss + CW.CFG.stagesPerBoss;
  }

  function renderArmy() {
    const st = S();
    const counts = {};
    st.formation.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
    const order = { inf: 0, rng: 1, hvy: 2 };
    const units = CW.unlockedUnits().slice().sort((a, b) => (counts[b.id] ? 1 : 0) - (counts[a.id] ? 1 : 0) || b.era - a.era || order[a.role] - order[b.role]);
    const council = !!st.council;
    const next = UNITS.filter((u) => u.era === st.eraReached + 1);
    return `<div class="phead"><h2>Your army · ${st.formation.length} squads</h2><div class="seg" role="group" aria-label="Upgrade amount">${[1, 10, 'max']
      .map((m) => `<button data-act="mode" data-m="${m}" aria-pressed="${st.buyMode === m}">${m === 'max' ? 'Max' : 'x' + m}</button>`)
      .join('')}</div></div>
      <p class="note">${council ? 'The War Council is in session, so you can mix and match your army right now.' : 'Your formation is locked until you defeat the next leader. Then the War Council lets you mix and match. Upgrades work any time and apply instantly.'}</p>
      ${council ? '<p><button class="btn blue" data-act="council">Open War Council</button></p>' : ''}
      <div class="formation">${st.formation.map((id) => `<div class="slot" title="${esc(UNIT[id].name)}"><img class="px" src="${CW.unitURL(id)}" alt="${esc(UNIT[id].name)}"><span data-slotlv="${id}">Lv ${CW.unitLevel(id)}</span></div>`).join('')}</div>
      <h3>Unit types · ${units.length} of ${UNITS.length} unlocked</h3>
      <div class="ugrid">${units
        .map((u) => {
          const n = counts[u.id] || 0;
          return `<div class="ucard ${n ? 'on' : ''}"><img class="px" src="${CW.unitURL(u.id)}" alt=""><div class="nm">${esc(u.name)}</div><div class="meta"><span class="tag ${u.role}">${ROLES[u.role].name}</span> ${ERAS[u.era].name}${n ? ' · in army x' + n : ' · reserve'}</div><div class="tr">${esc(TRAITS[u.trait])}</div><div class="row"><span class="st" data-stat="${u.id}"></span><button class="btn" data-act="buy" data-id="${u.id}">+1</button></div></div>`;
        })
        .join('')}</div>
      ${next.length ? `<p class="note">Reaching Era ${ERAS[st.eraReached + 1].roman} (${ERAS[st.eraReached + 1].name}) unlocks ${next.map((u) => u.name).join(', ')}, plus one more army slot. New units arrive already trained to 40% of your best unit's level.</p>` : ''}`;
  }

  function renderLeaders() {
    const st = S();
    let h = `<div class="phead"><h2>Leaders · ${Object.keys(st.roster).length} of ${LEADERS.length} recruited</h2></div><p class="note">Defeat a leader to recruit them. Beat them again in a later loop or after a Time Rift to earn stars (+15% skill power and faster recharge each). Tap a leader for their story, skills and training.</p>`;
    for (let e = 0; e < 9; e++) {
      const ls = LEADERS.filter((l) => l.era === e);
      h += `<div class="erahead"><span>Era ${ERAS[e].roman} · ${ERAS[e].name}</span><span>${fmtYear(ERAS[e].span[0])} to ${fmtYear(ERAS[e].span[1])}</span></div><div class="lgrid">${ls
        .map((l) => {
          const r = st.roster[l.id];
          const cls = !r ? 'locked' : l.id === st.main ? 'main' : st.partners.includes(l.id) ? 'mine' : '';
          const where = l.starter ? 'Starter' : 'Stage ' + bossStageOf(l.id);
          return `<button class="lcard ${cls}" data-act="leader" data-id="${l.id}"><img class="px" src="${CW.portraitURL(l.id)}" alt=""><span class="nm">${esc(l.name)}</span><small>${esc(l.yrs)}</small><small ${r ? `data-lvl="${l.id}"` : ''}>${r ? '' : esc(where)}</small>${r ? stars(r.stars) : ''}</button>`;
        })
        .join('')}</div>`;
    }
    h += `<div class="erahead"><span>Era X · Future</span><span>2030 onward</span></div><p class="note">No one from history has been born here yet. The future era pits you against echoes: machine-rebuilt versions of history's most feared commanders, different on every loop. Beating them earns stars.</p>`;
    return h;
  }

  const MODS = [
    ['atk', 'ATK', 1], ['hp', 'HP', 1], ['spd', 'Attack speed', 1], ['crit', 'Crit chance', 1], ['critDmg', 'Crit damage', 1], ['def', 'Damage reduction', 1],
    ['gold', 'Gold', 1], ['regen', 'Regen per second', 1], ['enemyAtk', 'Enemy damage cut', 1], ['bossDmg', 'Damage to leaders', 1], ['cdr', 'Commander recharge', 1],
    ['pcdr', 'Partner recharge', 1], ['skill', 'Commander skill power', 1], ['waveHeal', 'Between-wave healing', 1], ['inf', 'Infantry', 1], ['rng', 'Ranged', 1], ['hvy', 'Heavy', 1],
    ['bossTime', 'Leader clock', 0], ['slots', 'Extra army slots', 0], ['shardDrop', 'Shards per leader', 0],
  ];
  function renderDoctrines() {
    const st = S();
    const owned = DOCTRINES.filter((d) => st.doctrines[d.id]);
    const m = CW.mods();
    const sums = MODS.filter(([k]) => m[k] && !(k === 'crit' && m[k] === 0.05))
      .map(([k, n, p]) => `<div class="sum"><span>${n}</span><b>+${p ? Math.round((k === 'crit' ? m[k] - 0.05 : m[k]) * 100) + '%' : m[k] + (k === 'bossTime' ? 's' : '')}</b></div>`)
      .join('');
    return `<div class="phead"><h2>Doctrines · ${owned.length} of ${DOCTRINES.length}</h2>${st.council && st.council.picks ? '<button class="btn blue" data-act="council">Choose a doctrine</button>' : ''}</div>
      <p class="note">Doctrines are random army-management skills. After every leader battle the War Council offers three; pick one. Most can stack. A Time Rift clears them.</p>
      ${owned.length ? `<div class="dgrid">${owned.map((d) => `<div class="doc r${d.r}"><span class="rar">${RARITY[d.r]} · ${st.doctrines[d.id]}/${d.max}</span><span class="nm">${esc(d.name)}</span><small>${esc(d.d)}</small></div>`).join('')}</div>` : '<p class="note">None yet. Win your first leader battle to hold a War Council.</p>'}
      <h3>Your bonuses right now</h3><p class="note">From doctrines, your commander's class passive and commander level.</p>
      <div class="sumgrid">${sums || '<p class="note">No bonuses yet.</p>'}</div>`;
  }

  function renderRift() {
    const st = S();
    const n = CW.riftShards();
    return `<div class="phead"><h2>Time Rift</h2></div>
      <div class="two"><div><div class="big">${fmt(st.shards)}</div><p class="note">Chrono Shards. Each adds +5% ATK, HP and gold, for a total of +${fmt(st.shards * 5)}% right now. They are never lost.</p>
      <p class="note">Deepest stage this run: ${st.runMax}. Best ever: ${st.best}. Rifts opened: ${st.stats.rifts}.</p></div>
      <div><p class="bio">Tear open a rift to send your campaign back to the Bronze Age, carrying shards forward.</p>
      <ul class="plain"><li>You keep: shards, every recruited leader and their stars.</li><li>You lose: gold, unit levels, doctrines, leader levels and stage progress.</li></ul>
      <p class="bio">Reward now: <b data-rift>${fmt(n)}</b> shards</p>
      <button class="btn blue" data-act="rift" ${n ? '' : 'disabled'}>${n ? 'Open the rift' : 'Reach stage 40 to open'}</button></div></div>
      <p class="note">The reward grows 4% for every stage you push deeper, so rift when progress stalls for a while.</p>`;
  }

  function renderOptions() {
    const st = S();
    const s = st.stats;
    const h = Math.floor(s.time / 3600);
    const mm = Math.floor((s.time % 3600) / 60);
    return `<div class="phead"><h2>Options</h2></div>
      <div class="two"><div>
        <label class="tog"><input type="checkbox" data-act="sound" ${st.sound ? 'checked' : ''}> Sound effects</label>
        <p class="note">The game saves on this device every 15 seconds and when you leave. Your army keeps earning while you're away (up to 8 hours).</p>
        <p><button class="btn ghost" data-act="save">Save now</button> <button class="btn ghost" data-act="export">Export save</button> <button class="btn ghost" data-act="import">Import save</button></p>
        <div id="saveBox"></div>
        <h3>Stats</h3>
        <ul class="plain"><li>Time in command: ${h}h ${mm}m</li><li>Enemy squads destroyed: ${fmt(s.kills)}</li><li>Leader battles won: ${fmt(s.bosses)}</li><li>Gold earned: ${fmt(s.gold)}</li><li>Commander strikes: ${fmt(s.taps)}</li></ul>
      </div><div>
        <h3>How it works</h3>
        <ul class="plain"><li>Your army fights by itself. Tap the battlefield to add commander strikes.</li><li>Each era has a line of leader battles. Every third stage is one.</li><li>Lose a fight and you fall back a stage to regroup; with Auto-advance on, you try again after two stages.</li><li>Keys 1 to 5 cast skills; Space strikes.</li></ul>
        <h3>Start over</h3><p class="note">Wipes this save completely, shards and leaders included.</p>
        <button class="btn red" data-act="reset">Reset game</button>
      </div></div>`;
  }

  el.panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    SFX.ensure();
    const st = S();
    const act = b.dataset.act;
    if (act === 'mode') {
      st.buyMode = b.dataset.m === 'max' ? 'max' : +b.dataset.m;
      renderPanel();
    } else if (act === 'buy') {
      const n = st.buyMode === 'max' ? 'max' : st.buyMode;
      if (CW.buyUnit(b.dataset.id, n)) SFX.play('buy');
      updatePanel();
    } else if (act === 'council') openCouncil();
    else if (act === 'leader') openLeader(b.dataset.id);
    else if (act === 'rift') openRiftConfirm();
    else if (act === 'save') {
      save();
      toast('Game saved', '');
    } else if (act === 'export') {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(CW.serialize()))));
      $('#saveBox').innerHTML = `<p class="note">Copy this code and keep it somewhere safe.</p><textarea id="saveCode" readonly></textarea><p><button class="btn ghost" data-act="copy">Copy code</button></p>`;
      $('#saveCode').value = code;
    } else if (act === 'copy') {
      const t = $('#saveCode');
      t.select();
      try {
        navigator.clipboard.writeText(t.value).then(() => toast('Save code copied', ''), () => toast('Select the code and copy it', ''));
      } catch (err) {
        toast('Select the code and copy it', '');
      }
    } else if (act === 'import') {
      $('#saveBox').innerHTML = `<p class="note">Paste a save code, then load it. This replaces your current game.</p><textarea id="importCode"></textarea><p><button class="btn" data-act="doimport">Load save</button></p>`;
    } else if (act === 'doimport') {
      try {
        const obj = JSON.parse(decodeURIComponent(escape(atob($('#importCode').value.trim()))));
        if (CW.load(obj)) {
          started = true;
          save();
          syncControls();
          renderDeck();
          renderPanel();
          toast('Save loaded', '');
        } else throw new Error('bad');
      } catch (err) {
        toast("That code didn't work", 'red');
      }
    } else if (act === 'reset') openResetConfirm();
  });
  el.panel.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'sound') {
      S().sound = e.target.checked;
      SFX.ensure();
    }
  });

  // ------------------------------------------------------------ modals
  function showModal(kind, html) {
    modalKind = kind;
    el.dlg.innerHTML = html;
    el.modal.hidden = false;
    const f = el.dlg.querySelector('button');
    if (f && kind !== 'council') f.focus({ preventScroll: true });
  }
  function closeModal() {
    if (modalKind === 'start') return;
    if (modalKind === 'council') {
      CW.councilClose();
      picker = null;
    }
    modalKind = null;
    el.modal.hidden = true;
    el.dlg.innerHTML = '';
  }
  el.modal.addEventListener('click', (e) => {
    if (e.target === el.modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.target.matches && e.target.matches('input,textarea,select')) return;
    if (modalKind) {
      if (e.key === 'Escape') closeModal();
      return;
    }
    const map = { 1: 'ult', 2: 's1', 3: 's2', 4: 'p0', 5: 'p1' };
    if (map[e.key]) {
      SFX.ensure();
      CW.cast(map[e.key]);
    }
    if (e.key === ' ' && !e.target.closest('button')) {
      e.preventDefault();
      SFX.ensure();
      if (CW.tap()) SFX.play('tap');
    }
  });

  function openStart() {
    const starters = LEADERS.filter((l) => l.starter);
    showModal(
      'start',
      `<h2>Chrono Command</h2>
      <p class="bio">History's commanders, conquerors, dictators and dreamers are scattered across time. Pick your first commander, raise an army and fight your way from the Bronze Age to the far future, one leader at a time.</p>
      <ul class="plain">
        <li>Your army fights on its own, even while you're away. Tap the battlefield to strike.</li>
        <li>Every third stage is a leader battle. Win it and that leader joins your roster. ${LEADERS.length} leaders in all, from Sargon to Hitler, Gandhi and Martin Luther King Jr.</li>
        <li>After each leader battle the War Council meets: draw a random army doctrine, mix and match troops from the Bronze Age to the future, and pick your commander and two partners.</li>
        <li>Your commander brings a main skill, two skills and a passive. Each partner adds one skill.</li>
      </ul>
      <h3>Choose your first commander</h3>
      <div class="starters">${starters
        .map((l) => `<button class="starter" data-start="${l.id}"><img class="px" src="${CW.portraitURL(l.id)}" alt=""><b>${esc(l.name)}</b><small>${esc(CLASSES[l.cls].name)}: ${esc(CLASSES[l.cls].d)}</small><small>Main skill: ${esc(l.skills[0].n)}</small></button>`)
        .join('')}</div>
      <p class="note">The other two join you as partners.</p>`
    );
  }
  el.dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    SFX.ensure();
    if (b.dataset.start) {
      CW.newGame(b.dataset.start);
      started = true;
      modalKind = null;
      el.modal.hidden = true;
      syncControls();
      renderDeck();
      renderPanel();
      save();
      toast('Campaign begins: ' + fmtYear(-3000), 'blue');
      return;
    }
    const act = b.dataset.act;
    if (act === 'close') closeModal();
    else if (act === 'doc') {
      if (CW.councilPick(b.dataset.id)) {
        SFX.play('buy');
        toast(DOC[b.dataset.id].name + ' adopted', 'blue');
      }
      renderCouncil();
    } else if (act === 'reroll') {
      CW.councilReroll();
      renderCouncil();
    } else if (act === 'pickslot') {
      picker = picker && picker.type === 'slot' && picker.i === +b.dataset.i ? null : { type: 'slot', i: +b.dataset.i };
      renderCouncil();
    } else if (act === 'pickcmd') {
      picker = picker && picker.type === 'cmd' && picker.w === +b.dataset.w ? null : { type: 'cmd', w: +b.dataset.w };
      renderCouncil();
    } else if (act === 'setunit') {
      CW.setSlot(picker.i, b.dataset.id);
      picker = null;
      renderCouncil();
    } else if (act === 'setlead') {
      const st = S();
      const arr = [st.main, st.partners[0] || null, st.partners[1] || null];
      const id = b.dataset.id;
      const at = arr.indexOf(id);
      if (at >= 0) arr[at] = arr[picker.w];
      arr[picker.w] = id;
      if (!arr[0]) arr[0] = id;
      CW.setCommand(arr[0], arr[1], arr[2]);
      picker = null;
      renderDeck();
      renderCouncil();
    } else if (act === 'autofill') {
      autoFill();
      renderCouncil();
    } else if (act === 'later') {
      modalKind = null;
      picker = null;
      el.modal.hidden = true;
    } else if (act === 'train') {
      if (CW.train(b.dataset.id)) SFX.play('buy');
      openLeader(b.dataset.id);
    } else if (act === 'dorift') {
      const n = CW.rift();
      closeModal();
      if (n) {
        toast('+' + fmt(n) + ' Chrono Shards. Back to ' + fmtYear(-3000), 'blue');
        SFX.play('era');
        renderDeck();
        renderPanel();
        save();
      }
    } else if (act === 'doreset') {
      try {
        localStorage.removeItem(CW.SAVE_KEY);
      } catch (err) {}
      started = false;
      modalKind = null;
      CW.newGame('sun_tzu');
      renderDeck();
      renderPanel();
      openStart();
    }
  });

  function autoFill() {
    const pat = ['inf', 'rng', 'hvy', 'inf', 'rng', 'inf', 'hvy', 'rng', 'inf', 'rng', 'hvy', 'inf'];
    const n = CW.slotCount();
    for (let i = 0; i < n; i++) {
      const pool = CW.unlockedUnits().filter((u) => u.role === pat[i]);
      pool.sort((a, b) => {
        const x = CW.squadStats(a.id);
        const y = CW.squadStats(b.id);
        return (y.atk / y.int) * y.hp - (x.atk / x.int) * x.hp;
      });
      CW.setSlot(i, pool[0].id);
    }
  }

  function openCouncil() {
    if (!S().council) return;
    picker = null;
    modalKind = 'council';
    el.modal.hidden = false;
    renderCouncil();
  }
  function renderCouncil() {
    const st = S();
    const c = st.council;
    if (!c) return closeModal();
    const L = LEADER[c.lid];
    const r = st.roster[c.lid];
    const lead = r.stars ? `${L.name} is beaten again and earns a star (${r.stars}/5).` : `${L.name} is defeated and joins your cause.`;
    const docs = c.picks
      ? `<div class="dgrid">${c.offers
          .map((id) => {
            const d = DOC[id];
            return `<button class="doc r${d.r}" data-act="doc" data-id="${id}"><span class="rar">${RARITY[d.r]} · owned ${st.doctrines[id] || 0}/${d.max}</span><span class="nm">${esc(d.name)}</span><small>${esc(d.d)}</small></button>`;
          })
          .join('')}</div><p><button class="btn ghost" data-act="reroll" ${CW.rerollCost() > st.gold ? 'disabled' : ''}>Redraw · ${fmt(CW.rerollCost())} gold</button></p>`
      : '<p class="note">Doctrine adopted. Remix your army below, then head back to the front.</p>';
    const cmd = [st.main, st.partners[0], st.partners[1]];
    const cmdLabel = ['Commander', 'Partner 1', 'Partner 2'];
    const cmdRow = cmd
      .map((id, w) => {
        const sel = picker && picker.type === 'cmd' && picker.w === w;
        if (!id) return `<button class="pick ${sel ? 'sel' : ''}" data-act="pickcmd" data-w="${w}"><span></span><span><em>${cmdLabel[w]}</em><b>Empty</b></span></button>`;
        const l = LEADER[id];
        const sk = w === 0 ? 'Main: ' + l.skills[0].n : 'Skill: ' + l.skills[1].n;
        return `<button class="pick ${sel ? 'sel' : ''}" data-act="pickcmd" data-w="${w}"><img class="px" src="${CW.portraitURL(id)}" alt=""><span><em>${cmdLabel[w]}</em><b>${esc(l.name)}</b><small class="hint">${esc(sk)}</small></span></button>`;
      })
      .join('');
    const slots = st.formation
      .map((id, i) => {
        const u = UNIT[id];
        const sel = picker && picker.type === 'slot' && picker.i === i;
        return `<button class="pick ${sel ? 'sel' : ''}" data-act="pickslot" data-i="${i}"><img class="px" src="${CW.unitURL(id)}" alt=""><span><em>Slot ${i + 1}</em><b>${esc(u.name)}</b><small class="hint">Lv ${CW.unitLevel(id)}</small></span></button>`;
      })
      .join('');
    let chooser = '';
    if (picker && picker.type === 'slot') {
      const order = { inf: 0, rng: 1, hvy: 2 };
      chooser = `<div class="chooser">${CW.unlockedUnits()
        .slice()
        .sort((a, b) => b.era - a.era || order[a.role] - order[b.role])
        .map((u) => {
          const s2 = CW.squadStats(u.id);
          return `<button class="pick" data-act="setunit" data-id="${u.id}" title="${esc(TRAITS[u.trait])}"><img class="px" src="${CW.unitURL(u.id)}" alt=""><span><em>${ROLES[u.role].name} · Lv ${CW.unitLevel(u.id)}</em><b>${esc(u.name)}</b><small class="hint">ATK ${fmt(s2.atk)} · HP ${fmt(s2.hp)}</small></span></button>`;
        })
        .join('')}</div>`;
    }
    if (picker && picker.type === 'cmd') {
      chooser = `<div class="chooser">${Object.keys(st.roster)
        .map((id) => {
          const l = LEADER[id];
          const rr = st.roster[id];
          return `<button class="pick" data-act="setlead" data-id="${id}" title="${esc(CLASSES[l.cls].name + ': ' + CLASSES[l.cls].d)}"><img class="px" src="${CW.portraitURL(id)}" alt=""><span><em>${esc(CLASSES[l.cls].name)} · Lv ${rr.lv}</em><b>${esc(l.name)}</b></span></button>`;
        })
        .join('')}</div>`;
    }
    const cmdChooser = picker && picker.type === 'cmd' ? chooser : '';
    const slotChooser = picker && picker.type === 'slot' ? chooser : '';
    el.dlg.innerHTML = `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(c.lid)}" alt=""><div class="who"><h2>War Council</h2><small>${esc(lead)}</small></div></div>
      <h3>${c.picks ? 'Draw a doctrine' + (c.picks > 1 ? ' · ' + c.picks + ' picks waiting' : '') : 'Doctrine'}</h3>${docs}
      <h3>Command · your commander has a main skill and two skills, each partner adds one</h3><div class="cmdrow">${cmdRow}</div>${cmdChooser}
      <h3>Army · ${st.formation.length} slots · tap a slot to swap its unit</h3><div class="slots">${slots}</div>${slotChooser}
      <div class="acts"><button class="btn ghost" data-act="autofill">Auto-fill strongest</button>${c.picks ? '<button class="btn ghost" data-act="later">Decide later</button>' : '<button class="btn" data-act="close">Back to battle</button>'}</div>`;
  }

  function openLeader(id) {
    const st = S();
    const l = LEADER[id];
    const r = st.roster[id];
    const cl = CLASSES[l.cls];
    const role = id === st.main ? 'Your commander' : st.partners.includes(id) ? 'Your partner' : r ? 'In reserve' : l.starter ? 'Starter' : 'Not yet defeated · Stage ' + bossStageOf(id);
    const labels = ['Main skill', 'Skill 1 · also their partner skill', 'Skill 2'];
    showModal(
      'leader',
      `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(id)}" alt="" style="width:96px;height:96px"><div class="who"><h2>${esc(l.name)}</h2><small>${esc(l.title)} · ${esc(l.yrs)}</small><small>Era ${ERAS[l.era].roman} · ${ERAS[l.era].name} · ${esc(role)}</small>${r ? `<small>Level ${r.lv} ${stars(r.stars)}</small>` : ''}</div></div>
      <p class="bio">${esc(l.bio)}</p>
      <div class="sk"><em>As commander · ${esc(cl.name)}</em>${esc(cl.d)}</div>
      <h3>Skills</h3><div class="sklist">${l.skills.map((s, i) => `<div class="sk"><em>${labels[i]} · recharge ${s.cd}s</em><b>${esc(s.n)}</b>: ${esc(skillDesc(s).replace(/ Recharge.*$/, ''))}</div>`).join('')}</div>
      ${r ? `<p class="note">Each level adds +8% skill power, and +3% army ATK and HP while this leader commands.</p>` : ''}
      <div class="acts">${r ? `<button class="btn" data-act="train" data-id="${id}" ${CW.trainCost(id) > st.gold ? 'disabled' : ''}>Train to Lv ${r.lv + 1} · ${fmt(CW.trainCost(id))}</button>` : ''}<button class="btn ghost" data-act="close">Close</button></div>`
    );
  }

  function openRiftConfirm() {
    const n = CW.riftShards();
    if (!n) return;
    showModal('confirm', `<h2>Open a Time Rift?</h2><p class="bio">You return to the Bronze Age with <b>${fmt(n)}</b> new Chrono Shards (+${fmt(n * 5)}% ATK, HP and gold). Gold, unit levels, doctrines, leader levels and stage progress reset. Leaders and stars stay.</p><div class="acts"><button class="btn ghost" data-act="close">Not yet</button><button class="btn blue" data-act="dorift">Open the rift</button></div>`);
  }
  function openResetConfirm() {
    showModal('confirm', `<h2>Reset everything?</h2><p class="bio">This deletes your save on this device: shards, leaders, all of it. It can't be undone.</p><div class="acts"><button class="btn ghost" data-act="close">Keep my game</button><button class="btn red" data-act="doreset">Reset game</button></div>`);
  }
  function openAway(sec, gold) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    showModal('away', `<h2>While you were away</h2><p class="bio">Your army fought on for ${h ? h + 'h ' : ''}${m}m and brought back <b>${fmt(gold)}</b> gold.</p>${sec >= 8 * 3600 ? '<p class="note">Offline earnings cap at 8 hours. The Quartermaster doctrine raises the rate.</p>' : ''}<div class="acts"><button class="btn" data-act="close">Collect</button></div>`);
  }

  // ------------------------------------------------------------ events
  CW.on('victory', (r) => {
    SFX.play('win');
    toast(r.res === 'recruit' ? LEADER[r.lid].name + ' joins your cause!' : r.res === 'star' ? short(r.lid) + ' earns a star!' : '+1 Chrono Shard', '');
  });
  CW.on('council', () => {
    if (started && !modalKind) setTimeout(() => {
      if (!modalKind && S().council) openCouncil();
    }, 200);
  });
  CW.on('era', (info) => {
    SFX.play('era');
    const e = ERAS[info.era];
    toast('Era ' + e.roman + ': ' + e.name + '. New units unlocked', 'blue');
  });
  CW.on('defeat', (d) => {
    SFX.play('lose');
  });

  // ------------------------------------------------------------ saving + time
  function save() {
    if (!started) return;
    try {
      localStorage.setItem(CW.SAVE_KEY, JSON.stringify(CW.serialize()));
    } catch (e) {}
  }
  function catchUp(sec) {
    if (sec < 1) return;
    const sim = Math.min(sec, 120);
    for (let t = sim; t > 0; t -= 60) CW.advance(Math.min(60, t));
    const rest = sec - sim;
    if (rest > 0) {
      const o = CW.offlineGain(rest);
      CW.addGold(o.gold);
      if (rest > 300 && started && !modalKind) openAway(o.seconds, o.gold);
    }
  }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      save();
    } else if (hiddenAt) {
      catchUp((Date.now() - hiddenAt) / 1000);
      hiddenAt = 0;
      lastT = performance.now();
    }
  });
  window.addEventListener('pagehide', save);

  let lastT = performance.now();
  let hudT = 0;
  let panelT = 0;
  let saveT = 0;
  function frame(now) {
    const dt = Math.min(0.25, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    try {
      CW.advance(dt);
      const B = CW.battle();
      pos.clear();
      place(B.allies, 'a');
      place(B.enemies, 'e');
      consumeFx();
      render(dt, now / 1000);
      updateDeck();
      hudT += dt;
      if (hudT > 0.12) {
        hudT = 0;
        updateHUD();
      }
      panelT += dt;
      if (panelT > 0.4) {
        panelT = 0;
        updatePanel();
      }
      saveT += dt;
      if (saveT > 15) {
        saveT = 0;
        save();
      }
    } catch (err) {
      console.error(err);
    }
    requestAnimationFrame(frame);
  }

  function boot(data) {
    let saved = data && data.save;
    if (!saved) {
      try {
        const t = localStorage.getItem(CW.SAVE_KEY);
        if (t) saved = JSON.parse(t);
      } catch (e) {}
    }
    if (saved && CW.load(saved)) {
      started = true;
      const away = (Date.now() - (saved.savedAt || Date.now())) / 1000;
      if (away > 60) {
        const o = CW.offlineGain(away);
        CW.addGold(o.gold);
        if (away > 300 && o.gold > 0) openAway(o.seconds, o.gold);
      }
    } else {
      CW.newGame('sun_tzu');
      started = false;
      openStart();
    }
    syncControls();
    renderDeck();
    renderPanel();
    resize();
    updateHUD();
    lastT = performance.now();
    requestAnimationFrame(frame);
  }
  CW.ui = { save, toast, openCouncil };
  const hot = window.claude && window.claude.hot;
  try {
    if (hot && hot.snapshot) hot.snapshot(() => (started ? { save: CW.serialize() } : {}));
  } catch (e) {}
  if (hot && hot.ready) hot.ready(boot);
  else boot((hot && hot.data) || {});
})();
