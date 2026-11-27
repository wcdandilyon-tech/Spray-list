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
    mobutu: 'Mobutu', alien: 'Alien Overlord', wraith: 'Time Wraith', void: 'Void Emperor', exterminator: 'Exterminator', caveman: 'The Caveman',
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

  // ------------------------------------------------------------ attributes
  // a leader's always-on attributes as list rows: name, then what it does in plain words
  function attrRows(lid, idxs, k) {
    return idxs.map((i) => `<li><b>${esc(CW.attr(lid, i).name)}</b><span>${esc(CW.attrText(lid, i, k))}</span></li>`).join('');
  }

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
  // The field is drawn on a fixed 768x432 grid (2 device pixels per field unit), which matches the 2x-detail art.
  // The browser scales that up, so each frame fills a small fixed number of pixels whatever the screen size.
  const cv = $('#cv');
  const screenEl = $('#screen');
  const K = 2;
  cv.width = FW * K;
  cv.height = FH * K;
  const g = cv.getContext('2d', { alpha: false });
  function resize() {
    const r = screenEl.getBoundingClientRect();
    cv.style.imageRendering = r.width * (window.devicePixelRatio || 1) >= cv.width ? 'pixelated' : 'auto';
  }
  const ro = new ResizeObserver(resize);
  ro.observe(screenEl);
  let fieldVisible = true;
  try {
    const io = new IntersectionObserver((es) => (fieldVisible = es[es.length - 1].isIntersecting));
    io.observe(screenEl);
  } catch (e) {}
  const q2 = (v) => Math.round(v * K) / K; // snap to the device pixel grid: smooth motion, crisp pixels
  const easeOut = (k) => 1 - (1 - k) * (1 - k);
  const lungeOff = (q) => (q.lunge > 0 ? Math.sin(Math.min(1, q.lunge) * Math.PI) : 0);
  const marchOff = (B, dist) => (B.phase === 'march' ? dist * Math.pow(Math.max(0, B.pt) / 0.8, 2) : 0);

  // layout: positions are reused between frames instead of rebuilt
  const pos = new Map();
  let posFrame = 0;
  function setPos(sid, x, y, gy, w, side, sp, kind) {
    let p = pos.get(sid);
    if (!p) {
      p = {};
      pos.set(sid, p);
    }
    p.x = x;
    p.y = y;
    p.gy = gy;
    p.w = w;
    p.side = side;
    p.sp = sp || null;
    p.air = !!(sp && sp.air);
    p.hero = kind === 'hero';
    p.boss = kind === 'boss';
    p.f = posFrame;
  }
  const COLX = [126, 88, 50];
  const HERO_POS = [[162, 180], [154, 153], [154, 207]];
  const front = [];
  const back = [];
  const cols = [[], [], []];
  function place(list, side) {
    front.length = 0;
    back.length = 0;
    for (const q of list) {
      if (q.isBoss) {
        setPos(q.sid, 302, 184, 184, 60, side, null, 'boss');
        continue;
      }
      if (q.isHero) {
        const hp = HERO_POS[Math.min(2, q.slot - 100)];
        setPos(q.sid, hp[0], hp[1], hp[1], 30, side, null, 'hero');
        continue;
      }
      (q.role === 'rng' ? back : front).push(q);
    }
    cols[0].length = 0;
    cols[1].length = 0;
    cols[2].length = 0;
    for (let i = 0; i < front.length; i++) (i < 6 ? cols[0] : cols[2]).push(front[i]);
    for (let i = 0; i < back.length; i++) (i < 6 ? cols[1] : cols[2]).push(back[i]);
    for (let ci = 0; ci < 3; ci++) {
      const col = cols[ci];
      const n = col.length;
      for (let ri = 0; ri < n; ri++) {
        const q = col[ri];
        const sp = CW.unitSprite(q.uid, side);
        const gy = n === 1 ? 172 : Math.round(140 + ri * (64 / (n - 1)));
        const w = sp.multi ? 20 : sp.w;
        let x = COLX[ci] + (ri % 2 ? -5 : 0) - (sp.multi ? 0 : Math.max(0, sp.w - 20));
        if (side === 'e') x = FW - x - w;
        setPos(q.sid, x, sp.air ? gy - 34 : gy, gy, w, side, sp, 'unit');
      }
    }
  }
  function layout(B) {
    posFrame++;
    place(B.allies, 'a');
    place(B.enemies, 'e');
    for (const [sid, p] of pos) if (p.f !== posFrame) pos.delete(sid);
  }

  const proj = [];
  const booms = [];
  const parts = [];
  const nums = [];
  let shake = 0;
  let flashT = 0;
  let flashCol = '#fff';
  const center = (p) => ({ x: p.x + p.w / 2, y: p.boss ? p.gy - 46 : p.hero ? p.gy - 22 : p.y - (p.sp ? p.sp.h / 2 + 2 : 8) });

  function num(x, y, txt, col, scale) {
    if (nums.length > 40) nums.shift();
    nums.push({ x, y, txt, col, scale: scale || 1, t: 0 });
  }
  function boom(x, y, r, col) {
    if (booms.length > 48) booms.shift();
    booms.push({ x, y, r: r || 6, t: 0, col: col || '#ffd23f' });
  }
  function burst(x, y, n, col, kind) {
    for (let i = 0; i < n; i++) {
      if (parts.length > 240) parts.shift();
      const a = Math.random() * Math.PI * 2;
      const sp = 20 + Math.random() * 40;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (kind === 'coin' ? 50 : 20), t: 0, life: 0.6 + Math.random() * 0.5, col, kind });
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
        if (fp && e.role !== 'inf' && e.role !== 'hero') {
          const f = center(fp);
          const kind = e.role === 'rng' ? 'bullet' : e.role === 'boss' ? 'orb' : 'shell';
          if (proj.length < 90 && !(e.sec && kind === 'bullet')) proj.push({ x0: f.x, y0: f.y, x1: c.x, y1: c.y, t: 0, d: kind === 'bullet' ? 0.16 : 0.34, kind, side: e.side });
        }
        // only critical hits get a number, to keep the field readable
        if (!e.sec && e.crit && e.side === 'a') num(c.x + (Math.random() * 6 - 3), c.y - 6, fmt(e.dmg), '#ffd23f', 1);
        if (!e.sec) SFX.play(e.crit ? 'crit' : 'hit');
        const t = findSquad(e.to);
        if (t && !t.alive) burst(c.x, c.y, 8, t.side === 'e' ? '#c8c0b0' : '#ff7a6a');
      } else if (e.k === 'tap') {
        if (!tp) continue;
        const c = center(tp);
        boom(c.x, c.y, 5, '#ffffff');
        num(c.x, c.y - 10, fmt(e.dmg), '#bff4ff', 1);
      } else if (e.k === 'gold') {
        if (!tp) continue;
        burst(center(tp).x, center(tp).y, 3, '#ffd23f', 'coin');
        SFX.play('coin');
      } else if (e.k === 'herofall') {
        toast(short(e.lid) + ' is down', 'red');
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
    g.fillRect(q2(x), q2(y), q2(w), q2(h));
  }
  // pixel-font text from the cache: one drawImage per label or number
  function text(str, x, y, col, sc, align) {
    const img = CW.textImg(str, col, sc || 1, '#0b0d08');
    const w = img.width;
    const ax = align === 'c' ? x - w / 2 : align === 'r' ? x - w : x;
    g.drawImage(img, q2(ax - 1), q2(y - 1));
    return w;
  }
  function spr(img, x, y, w, h) {
    g.drawImage(img, q2(x), q2(y), w, h);
  }

  // per-squad animation state, owned by the renderer
  function animate(q, dt) {
    const f = q.maxHp > 0 ? Math.max(0, q.hp / q.maxHp) : 0;
    if (q.hpS === undefined) {
      q.hpS = f;
      q.hpT = f;
      q.vis = q.alive ? 1 : 0;
    }
    q.hpS += (f - q.hpS) * Math.min(1, dt * 14);
    if (q.hpS >= q.hpT) q.hpT = q.hpS;
    else q.hpT += (q.hpS - q.hpT) * Math.min(1, dt * 2.5);
    q.vis = q.alive ? Math.min(1, q.vis + dt * 5) : Math.max(0, q.vis - dt * 3.2);
    q.flash = Math.max(0, q.flash - dt * 5);
    q.lunge = Math.max(0, q.lunge - dt * 5);
  }
  function hpBar(q, x, y, w, col) {
    R(x - 0.5, y - 0.5, w + 1, 3, '#0b0d08');
    if (q.hpT > q.hpS + 0.005) R(x + w * q.hpS, y, w * (q.hpT - q.hpS), 2, '#f4e8c8');
    if (q.hpS > 0.002) {
      R(x, y, Math.max(0.5, w * q.hpS), 2, col);
      R(x, y, Math.max(0.5, w * q.hpS), 0.5, 'rgba(255,255,255,.35)');
    }
  }
  function stunStars(c, y, t, r) {
    const a = t * 8;
    R(c + Math.cos(a) * r, y + Math.sin(a) * 2, 2, 2, '#ffe86a');
    R(c + Math.cos(a + 3) * r, y + Math.sin(a + 3) * 2, 2, 2, '#ffe86a');
  }

  function drawSquad(q, p, t, B) {
    const sp = p.sp;
    const dir = q.side === 'a' ? 1 : -1;
    const marching = q.side === 'e' && B.phase === 'march';
    const ox = (q.side === 'e' ? marchOff(B, 150) : 0) + dir * lungeOff(q) * (q.role === 'rng' ? 1.5 : 5);
    if (!q.alive && q.side === 'a' && q.vis < 0.6) {
      g.globalAlpha = 1 - q.vis;
      R(p.x + 6, p.gy - 7, 3, 7, '#8a8a80');
      R(p.x + 4, p.gy - 5, 7, 2, '#8a8a80');
      R(p.x + 6.5, p.gy - 6.5, 1, 6, '#a8a89c');
      R(p.x + 2, p.gy, 11, 1, 'rgba(0,0,0,.35)');
      g.globalAlpha = 1;
    }
    if (q.vis <= 0.01) return;
    const sink = q.alive ? 0 : (1 - q.vis) * 4;
    g.globalAlpha = q.vis;
    if (sp.multi) {
      const n = Math.max(1, Math.ceil((3 * q.hp) / q.maxHp - 0.001));
      const offs = [[6, -5], [0, -2], [9, 0]];
      for (let i = 0; i < n; i++) {
        const dx = offs[i][0];
        const dy = offs[i][1];
        const bob = marching ? -Math.abs(Math.sin(t * 13 + i * 1.7)) * 1.5 : Math.sin(t * 3 + q.sid + i * 1.3) * 0.5;
        R(p.x + ox + dx + 1, p.gy + dy, 8, 1, 'rgba(0,0,0,.3)');
        const x = p.x + ox + dx;
        const y = p.gy - sp.h + dy + bob + sink + 0.5;
        spr(sp.c, x, y, sp.w, sp.h);
        if (q.flash > 0.05) {
          g.globalAlpha = q.vis * q.flash;
          spr(sp.flash, x, y, sp.w, sp.h);
          g.globalAlpha = q.vis;
        }
      }
    } else {
      const bob = p.air ? Math.sin(t * 3 + q.sid) * 1.5 : marching ? -Math.abs(Math.sin(t * 9 + q.sid)) : 0;
      R(p.x + ox + 2, p.gy, sp.w - 4, 2, 'rgba(0,0,0,.3)');
      const y = p.y - sp.h + bob + sink + 0.5;
      spr(sp.c, p.x + ox, y, sp.w, sp.h);
      if (q.flash > 0.05) {
        g.globalAlpha = q.vis * q.flash;
        spr(sp.flash, p.x + ox, y, sp.w, sp.h);
      }
    }
    g.globalAlpha = q.vis;
    hpBar(q, p.x + ox + (p.w - 16) / 2, p.gy + 3, 16, q.side === 'a' ? '#5ad1ff' : '#ff5a4a');
    g.globalAlpha = 1;
    if (q.stun > 0 && q.alive) stunStars(center(p).x + ox, p.y - (sp.h || 12) - 4, t, 6);
  }

  // commanders and enemy leaders: full-body sprites on the field (the enemy leader is drawn twice as big)
  function drawHero(q, p, t, B) {
    const isBoss = p.boss;
    const sc = isBoss ? 2 : 1;
    const info = B.info;
    const hs = CW.heroSprite(q.lid, q.side, isBoss ? info.variant : '');
    const dir = q.side === 'a' ? 1 : -1;
    const marching = q.side === 'e' && B.phase === 'march';
    const ox = (q.side === 'e' ? marchOff(B, isBoss ? 40 : 150) : 0) + dir * lungeOff(q) * 4 * sc;
    const bob = marching ? -Math.abs(Math.sin(t * 8)) * 2 * sc : Math.sin(t * 2.6 + q.sid) * 0.75 * sc;
    const x = p.x + ox;
    const y = p.gy - 41 * sc + bob;
    const W = 30 * sc;
    const H = 42 * sc;
    if (!q.alive) {
      if (q.side === 'a') {
        g.globalAlpha = 0.3;
        spr(hs.shadow, p.x, p.gy - 41, 30, 42);
        g.globalAlpha = 1;
        text('DOWN', p.x + 15, p.gy - 50, '#ff8a7a', 1, 'c');
      } else if (q.vis > 0.01) {
        g.globalAlpha = q.vis;
        spr(hs.c, x, y + (1 - q.vis) * 8, W, H);
        g.globalAlpha = 1;
      }
      return;
    }
    R(x + 4 * sc, p.gy, 22 * sc, 2, 'rgba(0,0,0,.35)');
    if (isBoss || q.main) {
      const aura = !isBoss ? '#ffd23f' : info.mystery ? '#d08aff' : info.chaos ? '#b070ff' : info.variant === 'echo' ? '#2ee6ff' : '#ff5a4a';
      const au = CW.tinted(hs.c, aura);
      g.globalAlpha = (isBoss ? 0.45 : 0.3) + 0.2 * Math.sin(t * 4.5);
      const d = isBoss ? 1 : 0.5;
      spr(au, x - d, y, W, H);
      spr(au, x + d, y, W, H);
      spr(au, x, y - d, W, H);
      if (isBoss) spr(au, x, y + d, W, H);
      g.globalAlpha = 1;
    }
    const hidden = isBoss && info.mystery && B.phase === 'march';
    spr(hidden ? hs.shadow : hs.c, x, y, W, H);
    if (q.flash > 0.05 && !hidden) {
      g.globalAlpha = q.flash;
      spr(hs.flash, x, y, W, H);
      g.globalAlpha = 1;
    }
    if (hidden) text('?', x + W / 2, y + 26, '#e8d0ff', 4, 'c');
    if (!isBoss) hpBar(q, x + 4, p.gy + 3, 22, q.main ? '#ffd23f' : '#5ad1ff');
    if (q.stun > 0) stunStars(x + W / 2, y - 4, t, 8 * sc);
  }

  function drawHud(B, st) {
    const info = B.info;
    const label = info.isBoss ? (info.mystery ? 'MYSTERY BOSS' : info.variant === 'echo' ? 'ECHO BATTLE' : 'LEADER BATTLE') : 'WAVE ' + B.wave + '/' + CW.CFG.waves;
    text(label, FW / 2, 6, info.isBoss ? '#ff8a7a' : '#ffffff', 2, 'c');
    if (st.farming) text('REGROUPING', FW / 2, 19, '#ffd23f', 1, 'c');
    if (B.boss) {
      const nm = info.mystery && B.phase === 'march' ? '???' : short(B.boss.lid).toUpperCase();
      text(nm, FW - 8, 6, '#ffffff', 2, 'r');
      const bw = 130;
      const bx = FW - 8 - bw;
      const bq = B.boss;
      R(bx - 1, 18, bw + 2, 7, '#0b0d08');
      if (bq.hpT > bq.hpS + 0.003) R(bx + bw * bq.hpS, 19, bw * (bq.hpT - bq.hpS), 5, '#f4e8c8');
      R(bx, 19, bw * Math.max(0, bq.hpS || 0), 5, '#ff5a4a');
      R(bx, 19, bw * Math.max(0, bq.hpS || 0), 1, '#ff9a8a');
      const low = B.bossT < 10;
      text(Math.max(0, Math.ceil(B.bossT)) + 'S', FW - 8, 28, low ? '#ff5a4a' : '#ffd23f', 2, 'r');
      R(bx, 30, (bw - 22) * Math.max(0, B.bossT / B.bossTMax), 3, low ? '#ff5a4a' : '#ffd23f');
    }
    if (B.phase === 'march' && B.wave === 1) {
      g.globalAlpha = Math.min(1, B.pt * 2);
      if (info.isBoss) {
        text('VS ' + (info.mystery ? '???' : short(info.bossId).toUpperCase()), FW / 2, 60, info.mystery ? '#e8d0ff' : '#ff8a7a', 3, 'c');
        text(fmtYear(info.yr), FW / 2, 82, '#ffffff', 2, 'c');
      } else text('STAGE ' + st.stage, FW / 2, 64, '#ffffff', 3, 'c');
      g.globalAlpha = 1;
    }
    if (B.phase === 'victory') {
      const k = Math.min(1, (1.6 - B.pt) * 4);
      g.globalAlpha = k;
      text('VICTORY!', FW / 2, 56 - (1 - k) * 6, '#ffd23f', 4, 'c');
      if (B.reward) text(B.reward.res === 'recruit' ? short(B.reward.lid).toUpperCase() + ' JOINS YOU' : B.reward.res === 'star' ? short(B.reward.lid).toUpperCase() + ' +1 STAR' : '+1 CHRONO SHARD', FW / 2, 84, '#ffffff', 2, 'c');
      g.globalAlpha = 1;
    }
    if (B.phase === 'defeat') {
      text(B.loseWhy === 'time' ? 'OUT OF TIME!' : 'RETREAT!', FW / 2, 56, '#ff5a4a', 4, 'c');
      text('REGROUP AND GROW STRONGER', FW / 2, 86, '#ffffff', 1, 'c');
    }
  }

  const order = [];
  function render(dt, t) {
    const B = CW.battle();
    const st = S();
    if (!B || !st) return;
    g.setTransform(K, 0, 0, K, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    g.drawImage(CW.backdrop(B.info.era), 0, 0, FW, FH);
    // ambient embers / neon motes drifting smoothly
    if (B.info.era === 6 || B.info.era === 9) {
      const c = B.info.era === 6 ? '#ffb060' : '#2ee6ff';
      for (let i = 0; i < 16; i++) {
        const x = (((i * 53 + t * (B.info.era === 6 ? 9 : 14)) % FW) + FW) % FW;
        const y = (((i * 37 + t * (B.info.era === 6 ? -12 : 6)) % 110) + 110) % 110;
        R(x, y, 1, 1, c);
      }
    }
    // a light screen shake moves the fighters, not the scenery
    let sx = 0;
    let sy = 0;
    if (shake > 0) {
      const k = Math.min(1, shake / 0.25);
      sx = (Math.random() - 0.5) * 4 * k;
      sy = (Math.random() - 0.5) * 3 * k;
      shake -= dt;
    }
    g.save();
    g.translate(q2(sx), q2(sy));
    order.length = 0;
    for (const q of B.allies) if (pos.has(q.sid)) order.push(q);
    for (const q of B.enemies) if (pos.has(q.sid)) order.push(q);
    order.sort((a, b) => pos.get(a.sid).gy - pos.get(b.sid).gy);
    for (const q of order) {
      animate(q, dt);
      const p = pos.get(q.sid);
      if (q.isBoss || q.isHero) drawHero(q, p, t, B);
      else drawSquad(q, p, t, B);
    }
    // projectiles with short trails
    for (let i = proj.length - 1; i >= 0; i--) {
      const p = proj[i];
      p.t += dt;
      const k = Math.min(1, p.t / p.d);
      const arc = p.kind === 'shell' ? Math.sin(k * Math.PI) * 18 : 0;
      const x = p.x0 + (p.x1 - p.x0) * k;
      const y = p.y0 + (p.y1 - p.y0) * k - arc;
      if (p.kind === 'bullet') {
        const dx = p.x1 > p.x0 ? -1 : 1;
        const col = p.side === 'a' ? '#fff6a0' : '#ffb0a0';
        g.globalAlpha = 0.45;
        R(x + dx * 3, y, 3, 0.5, col);
        g.globalAlpha = 1;
        R(x, y - 0.5, 2, 1, col);
      } else if (p.kind === 'shell') {
        const k0 = Math.max(0, k - 0.06);
        g.globalAlpha = 0.4;
        R(p.x0 + (p.x1 - p.x0) * k0 - 0.5, p.y0 + (p.y1 - p.y0) * k0 - Math.sin(k0 * Math.PI) * 18 - 0.5, 1, 1, '#bdbdbd');
        g.globalAlpha = 1;
        R(x - 1, y - 1, 2, 2, '#2a2a2a');
        R(x - 1, y - 1, 1, 0.5, '#8a8a8a');
      } else {
        const d = CW.disc(2.5, '#ff5a3a');
        spr(d, x - d.width / 4, y - d.height / 4, d.width / 2, d.height / 2);
        R(x - 1, y - 1, 2, 2, '#ffe0a0');
      }
      if (k >= 1) {
        if (p.kind !== 'bullet') boom(p.x1, p.y1, p.kind === 'orb' ? 6 : 5, p.kind === 'orb' ? '#ff5a3a' : '#ffd23f');
        proj.splice(i, 1);
      }
    }
    // explosions: cached discs that grow, change colour and fade
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i];
      b.t += dt;
      const k = b.t / 0.38;
      if (k >= 1) {
        booms.splice(i, 1);
        continue;
      }
      const r = Math.round(b.r * (0.4 + easeOut(k) * 0.9) * 2) / 2;
      const d = CW.disc(r, k < 0.25 ? '#ffffff' : k < 0.6 ? b.col : '#6a6a6a');
      g.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
      spr(d, b.x - d.width / 4, b.y - d.height / 4, d.width / 2, d.height / 2);
      g.globalAlpha = 1;
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
      const f = p.t / p.life;
      g.globalAlpha = f > 0.6 ? (1 - f) / 0.4 : 1;
      R(p.x, p.y, 1.5, 1.5, p.col);
    }
    g.globalAlpha = 1;
    // damage numbers: ease up, then fade
    for (let i = nums.length - 1; i >= 0; i--) {
      const n = nums[i];
      n.t += dt;
      if (n.t > 0.95) {
        nums.splice(i, 1);
        continue;
      }
      g.globalAlpha = n.t > 0.6 ? (0.95 - n.t) / 0.35 : 1;
      text(n.txt, n.x, n.y - easeOut(Math.min(1, n.t / 0.6)) * 16, n.col, n.scale, 'c');
    }
    g.globalAlpha = 1;
    g.restore();
    drawHud(B, st);
    if (flashT > 0) {
      g.globalAlpha = Math.min(0.3, flashT * 0.3);
      g.fillStyle = flashCol;
      g.fillRect(0, 0, FW, FH);
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
      const top = p.boss ? p.gy - 84 : p.hero ? p.gy - 42 : p.y - (p.sp ? p.sp.h : 12) - 6;
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
    while (toastEl.children.length > 1) toastEl.firstChild.remove();
    const d = document.createElement('div');
    d.className = cls || '';
    d.textContent = txt;
    toastEl.appendChild(d);
    setTimeout(() => d.remove(), 3300);
  }

  // ------------------------------------------------------------ HUD + deck
  const el = {
    gold: $('#gold'), gps: $('#gps'), shards: $('#shards'), era: $('#eraName'), year: $('#year'), stage: $('#stage'),
    nextImg: $('#nextImg'), nextBar: $('#nextBar'), nextTxt: $('#nextTxt'), challenge: $('#btnChallenge'), council: $('#btnCouncil'),
    deck: $('#deck'), panel: $('#panel'), autoPush: $('#autoPush'), modal: $('#modal'), dlg: $('#dlg'),
  };
  $('#icoGold').src = CW.icon('coin');
  $('#icoShard').src = CW.icon('shard');
  $('#icoClock').src = CW.icon('clock');

  // only touch the page when something actually changed
  function setText(node, v) {
    if (node._v !== v) {
      node._v = v;
      node.textContent = v;
    }
  }
  function setHidden(node, v) {
    if (node.hidden !== v) node.hidden = v;
  }
  let nextImgId = '';
  let revealed = 0;
  function updateHUD() {
    const st = S();
    const B = CW.battle();
    if (!st || !B) return;
    setText(el.gold, fmt(st.gold));
    setText(el.gps, fmt(st.gps || 0));
    setText(el.shards, fmt(st.shards));
    const info = B.info;
    const era = ERAS[info.era];
    setText(el.era, (info.chaos ? 'Shattered Time · ' : '') + 'Era ' + era.roman + ' · ' + era.name);
    setText(el.year, fmtYear(info.yr));
    setText(el.stage, 'Stage ' + st.stage + (info.chaos ? ' · depth ' + info.depth : '') + (st.farming ? ' · regrouping' : ''));
    if (info.mystery && B.boss && B.phase === 'fight' && revealed !== B.boss.sid) {
      revealed = B.boss.sid;
      toast("It's " + LEADER[B.boss.lid].name + '!', 'red');
      SFX.play('bosscast');
    }
    const bossStage = st.stage + (2 - info.sub);
    const bi = CW.stageInfo(bossStage);
    const shown = bi.mystery && !(info.isBoss && B.phase !== 'march');
    const nv = shown ? 'mystery' : bi.variant;
    const bid = bi.bossId + nv;
    if (nextImgId !== bid) {
      nextImgId = bid;
      el.nextImg.src = CW.portraitURL(bi.bossId, nv);
    }
    const bname = shown ? '???' : short(bi.bossId);
    const prog = info.isBoss ? 1 : (info.sub + (B.wave - 1) / CW.CFG.waves) / 2;
    const pw = 'calc((100% - 4px) * ' + prog.toFixed(3) + ')';
    if (el.nextBar._w !== pw) el.nextBar.style.width = el.nextBar._w = pw;
    setText(el.nextTxt, info.isBoss ? 'VS ' + bname : bname + ' in ' + (2 - info.sub) + (2 - info.sub === 1 ? ' stage' : ' stages'));
    setHidden(el.challenge, !st.farming);
    if (st.farming) setText(el.challenge, 'Challenge ' + bname);
    setHidden(el.council, !st.council);
    if (st.council) setText(el.council, st.council.picks ? 'War Council (' + st.council.picks + ')' : 'War Council');
    const sig = [st.main, st.partners.join(','), [st.main].concat(st.partners).map((id) => st.roster[id].lv + ':' + st.roster[id].stars).join(',')].join('|');
    if (sig !== deckSig) renderDeck();
  }

  function renderDeck() {
    const st = S();
    deckSig = [st.main, st.partners.join(','), [st.main].concat(st.partners).map((id) => st.roster[id].lv + ':' + st.roster[id].stars).join(',')].join('|');
    deckEls = null;
    const card = (lid, i) => {
      if (!lid) return '<div class="partner box notch"><div class="who"><b>Open slot</b></div></div>';
      const L = LEADER[lid];
      const r = st.roster[lid];
      const main = i === 0;
      const cl = CLASSES[L.cls];
      return `<div class="${main ? 'lead' : 'partner'} box notch" data-card="${lid}" title="Tap for details"><img class="px" src="${CW.portraitURL(lid)}" alt=""><div class="who"><b>${esc(L.name)}</b><small>${main ? `<span title="${esc(cl.d)}">${esc(cl.name)}</span>` : 'Partner'} · <span class="nw">Lv ${r.lv}</span> ${stars(r.stars)}</small><span class="hp${main ? ' main' : ''}"><i data-hp="${lid}"></i></span></div><ul class="attrs">${attrRows(lid, main ? [0, 1, 2] : [1], CW.attrStrength(lid, main ? 'main' : 'partner'))}</ul></div>`;
    };
    el.deck.innerHTML = card(st.main, 0) + card(st.partners[0], 1) + card(st.partners[1], 2);
  }
  let deckEls = null;
  function updateDeck() {
    const B = CW.battle();
    if (!B) return;
    if (!deckEls) {
      deckEls = {
        cards: Array.from(el.deck.querySelectorAll('[data-card]')).map((c) => ({ c, lid: c.dataset.card })),
        hps: Array.from(el.deck.querySelectorAll('[data-hp]')).map((i) => ({ i, lid: i.dataset.hp })),
      };
    }
    for (const c of deckEls.cards) {
      const down = !CW.heroAlive(c.lid);
      if (c.down !== down) {
        c.down = down;
        c.c.classList.toggle('down', down);
      }
    }
    for (const h of deckEls.hps) {
      let hero = null;
      for (const q of B.allies) if (q.isHero && q.lid === h.lid) hero = q;
      const w = hero ? (Math.round((1000 * Math.max(0, hero.hpS === undefined ? hero.hp / hero.maxHp : hero.hpS)) / 2) / 5).toFixed(1) + '%' : '0';
      if (h.w !== w) {
        h.w = w;
        h.i.style.width = w;
      }
    }
  }
  el.deck.addEventListener('click', (e) => {
    const c = e.target.closest('[data-card]');
    if (c) openLeader(c.dataset.card);
  });

  el.autoPush.addEventListener('change', () => CW.setAuto('push', el.autoPush.checked));
  el.challenge.addEventListener('click', () => {
    SFX.ensure();
    CW.challenge();
  });
  el.council.addEventListener('click', () => openCouncil());
  function syncControls() {
    el.autoPush.checked = S().auto.push;
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
        setText(b, '+' + showN + ' · ' + fmt(cost));
        const dis = cost > st.gold;
        if (b.disabled !== dis) b.disabled = dis;
      });
      el.panel.querySelectorAll('[data-stat]').forEach((s) => {
        const id = s.dataset.stat;
        const sst = CW.squadStats(id);
        setText(s, 'Lv ' + CW.unitLevel(id) + ' · ATK ' + fmt(sst.atk) + ' · HP ' + fmt(sst.hp));
      });
      el.panel.querySelectorAll('[data-slotlv]').forEach((s) => setText(s, 'Lv ' + CW.unitLevel(s.dataset.slotlv)));
    }
    if (tab === 'leaders') {
      el.panel.querySelectorAll('[data-lvl]').forEach((s) => {
        const r = st.roster[s.dataset.lvl];
        if (r) setText(s, 'Lv ' + r.lv);
      });
    }
    if (tab === 'rift') {
      const b = el.panel.querySelector('[data-rift]');
      if (b) setText(b, fmt(CW.riftShards()));
    }
  }

  let reserveOpen = false;
  el.panel.addEventListener('toggle', (e) => {
    if (e.target.matches && e.target.matches('details.reserve')) reserveOpen = e.target.open;
  }, true);
  function renderArmy() {
    const st = S();
    const counts = {};
    st.formation.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
    const order = { inf: 0, rng: 1, hvy: 2 };
    const units = CW.unlockedUnits().slice().sort((a, b) => b.era - a.era || order[a.role] - order[b.role]);
    const card = (u) => {
      const n = counts[u.id] || 0;
      return `<div class="ucard ${n ? 'on' : ''}"><img class="px" src="${CW.unitURL(u.id)}" alt=""><div class="nm">${esc(u.name)}${n > 1 ? ' x' + n : ''}</div><div class="meta"><span class="tag ${u.role}">${ROLES[u.role].name}</span></div><div class="tr">${esc(TRAITS[u.trait])}</div><div class="row"><span class="st" data-stat="${u.id}"></span><button class="btn" data-act="buy" data-id="${u.id}">+1</button></div></div>`;
    };
    const inArmy = units.filter((u) => counts[u.id]);
    const reserve = units.filter((u) => !counts[u.id]);
    return `<div class="phead"><h2>Army</h2><div class="seg" role="group" aria-label="Upgrade amount">${[1, 10, 'max']
      .map((m) => `<button data-act="mode" data-m="${m}" aria-pressed="${st.buyMode === m}">${m === 'max' ? 'Max' : 'x' + m}</button>`)
      .join('')}</div></div>
      ${st.council ? '<p><button class="btn blue" data-act="council">Swap units at the War Council</button></p>' : '<p class="note">Swap units after each leader battle.</p>'}
      <div class="formation">${st.formation.map((id) => `<div class="slot" title="${esc(UNIT[id].name)}"><img class="px" src="${CW.unitURL(id)}" alt="${esc(UNIT[id].name)}"><span data-slotlv="${id}">Lv ${CW.unitLevel(id)}</span></div>`).join('')}</div>
      <div class="ugrid">${inArmy.map(card).join('')}</div>
      ${reserve.length ? `<details class="reserve" ${reserveOpen ? 'open' : ''}><summary>Reserve units · ${reserve.length}</summary><div class="ugrid">${reserve.map(card).join('')}</div></details>` : ''}`;
  }

  function renderLeaders() {
    const st = S();
    let h = `<div class="phead"><h2>Leaders · ${Object.keys(st.roster).length}/${LEADERS.length}</h2></div>`;
    for (let e = 0; e < 11; e++) {
      const ls = LEADERS.filter((l) => l.era === e);
      if (e === 10) {
        h += `<div class="erahead"><span>Mysteries</span></div><div class="lgrid">${ls
          .map((l) => {
            const r = st.roster[l.id];
            return r
              ? `<button class="lcard ${l.id === st.main ? 'main' : st.partners.includes(l.id) ? 'mine' : ''}" data-act="leader" data-id="${l.id}"><img class="px" src="${CW.portraitURL(l.id)}" alt=""><span class="nm">${esc(l.name)}</span><small data-lvl="${l.id}"></small>${stars(r.stars)}</button>`
              : `<button class="lcard locked" data-act="leader" data-id="${l.id}"><img class="px" src="${CW.portraitURL(l.id, 'mystery')}" alt=""><span class="nm">???</span><small>Shattered Time</small></button>`;
          })
          .join('')}</div>`;
        continue;
      }
      h += `<div class="erahead"><span>${ERAS[e].name}</span></div><div class="lgrid">${ls
        .map((l) => {
          const r = st.roster[l.id];
          const cls = !r ? 'locked' : l.id === st.main ? 'main' : st.partners.includes(l.id) ? 'mine' : '';
          const where = l.starter ? 'Starter' : 'Stage ' + CW.bossStageOf(l.id);
          return `<button class="lcard ${cls}" data-act="leader" data-id="${l.id}"><img class="px" src="${CW.portraitURL(l.id)}" alt=""><span class="nm">${esc(l.name)}</span><small ${r ? `data-lvl="${l.id}"` : ''}>${r ? '' : esc(where)}</small>${r ? stars(r.stars) : ''}</button>`;
        })
        .join('')}</div>`;
    }
    return h;
  }

  function renderDoctrines() {
    const st = S();
    const owned = DOCTRINES.filter((d) => st.doctrines[d.id]);
    return `<div class="phead"><h2>Doctrines · ${owned.length}</h2>${st.council && st.council.picks ? '<button class="btn blue" data-act="council">Pick one</button>' : ''}</div>
      ${owned.length ? `<div class="dgrid">${owned.map((d) => `<div class="doc r${d.r}"><span class="rar">${RARITY[d.r]} · ${st.doctrines[d.id]}/${d.max}</span><span class="nm">${esc(d.name)}</span><small>${esc(d.d)}</small></div>`).join('')}</div>` : '<p class="note">Win a leader battle to pick your first one.</p>'}`;
  }

  function renderRift() {
    const st = S();
    const n = CW.riftShards();
    return `<div class="phead"><h2>Time Rift</h2></div>
      <div class="big">${fmt(st.shards)}</div><p class="note">Chrono Shards: +${fmt(st.shards * 5)}% ATK, HP and gold, forever.</p>
      <p class="bio">Restart from stage 1 for <b data-rift>${fmt(n)}</b> more shards. You keep your leaders.</p>
      <button class="btn blue" data-act="rift" ${n ? '' : 'disabled'}>${n ? 'Open the rift' : 'Reach stage 40 to open'}</button>`;
  }

  function renderOptions() {
    const st = S();
    const s = st.stats;
    return `<div class="phead"><h2>Options</h2></div>
      <label class="tog"><input type="checkbox" data-act="sound" ${st.sound ? 'checked' : ''}> Sound</label>
      <p><button class="btn ghost" data-act="save">Save now</button> <button class="btn ghost" data-act="export">Export save</button> <button class="btn ghost" data-act="import">Import save</button></p>
      <div id="saveBox"></div>
      <p class="note">${Math.floor(s.time / 3600)}h ${Math.floor((s.time % 3600) / 60)}m played · ${fmt(s.bosses)} leaders beaten · ${fmt(s.kills)} squads destroyed</p>
      <p><button class="btn red" data-act="reset">Reset game</button></p>`;
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
      <p class="bio">Lead history's commanders through an endless war across time. Your army fights on its own. Beat each era's leaders to recruit them.</p>
      <h3>Pick your commander</h3>
      <div class="starters">${starters
        .map((l) => `<button class="starter" data-start="${l.id}"><img class="px" src="${CW.portraitURL(l.id)}" alt=""><b>${esc(l.name)}</b><small><span class="an">${esc(l.skills[0].n)}</span> ${esc(CW.attrText(l.id, 0))}</small></button>`)
        .join('')}</div>`
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
      return;
    }
    const act = b.dataset.act;
    if (act === 'close') closeModal();
    else if (act === 'doc') {
      if (CW.councilPick(b.dataset.id)) SFX.play('buy');
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
        toast('+' + fmt(n) + ' Chrono Shards. Back to ' + fmtYear(-10000), 'blue');
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
    const lead = r.stars ? `${L.name} earns a star (${r.stars}/5).` : `${L.name} joins you.`;
    const docs = c.picks
      ? `<div class="dgrid">${c.offers
          .map((id) => {
            const d = DOC[id];
            return `<button class="doc r${d.r}" data-act="doc" data-id="${id}"><span class="rar">${RARITY[d.r]} · owned ${st.doctrines[id] || 0}/${d.max}</span><span class="nm">${esc(d.name)}</span><small>${esc(d.d)}</small></button>`;
          })
          .join('')}</div><p><button class="btn ghost" data-act="reroll" ${CW.rerollCost() > st.gold ? 'disabled' : ''}>Redraw · ${fmt(CW.rerollCost())} gold</button></p>`
      : '';
    const cmd = [st.main, st.partners[0], st.partners[1]];
    const cmdLabel = ['Commander', 'Partner 1', 'Partner 2'];
    const cmdRow = cmd
      .map((id, w) => {
        const sel = picker && picker.type === 'cmd' && picker.w === w;
        if (!id) return `<button class="pick ${sel ? 'sel' : ''}" data-act="pickcmd" data-w="${w}"><span></span><span><em>${cmdLabel[w]}</em><b>Empty</b></span></button>`;
        const l = LEADER[id];
        const sk = w === 0 ? l.skills[0].n + ' +2 more' : l.skills[1].n;
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
          return `<button class="pick" data-act="setlead" data-id="${id}" title="${esc(l.skills[0].n + ': ' + CW.attrText(id, 0))}"><img class="px por" src="${CW.portraitURL(id)}" alt=""><span><em>${picker.w === 0 ? esc(l.skills[0].n) : esc(l.skills[1].n)}</em><b>${esc(l.name)}</b></span></button>`;
        })
        .join('')}</div>`;
    }
    const cmdChooser = picker && picker.type === 'cmd' ? chooser : '';
    const slotChooser = picker && picker.type === 'slot' ? chooser : '';
    el.dlg.innerHTML = `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(c.lid)}" alt=""><div class="who"><h2>War Council</h2><small>${esc(lead)}</small></div></div>
      ${c.picks ? `<h3>Pick a doctrine${c.picks > 1 ? ' · ' + c.picks + ' left' : ''}</h3>${docs}` : ''}
      <h3>Leaders</h3><div class="cmdrow">${cmdRow}</div>${cmdChooser}
      <h3>Army · tap a slot to swap</h3><div class="slots">${slots}</div>${slotChooser}
      <div class="acts"><button class="btn ghost" data-act="autofill">Auto-fill strongest</button>${c.picks ? '<button class="btn ghost" data-act="later">Decide later</button>' : '<button class="btn" data-act="close">Back to battle</button>'}</div>`;
  }

  function openLeader(id) {
    const st = S();
    const l = LEADER[id];
    const r = st.roster[id];
    const cl = CLASSES[l.cls];
    if (l.era === 10 && !r) {
      showModal('leader', `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(id, 'mystery')}" alt="" style="width:128px;height:128px"><div class="who"><h2>???</h2><small>A mystery from beyond the end of time</small></div></div><p class="bio">Someone, or something, waits where the timeline breaks. Finish the pathway all the way to the Future and keep going to find out who.</p><div class="acts"><button class="btn ghost" data-act="close">Close</button></div>`);
      return;
    }
    const role = id === st.main ? 'Your commander' : st.partners.includes(id) ? 'Your partner' : r ? 'In reserve' : l.starter ? 'Starter' : 'Not yet defeated · Stage ' + CW.bossStageOf(id);
    const labels = ['Signature · as commander', 'As commander or partner', 'As commander'];
    showModal(
      'leader',
      `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(id)}" alt="" style="width:128px;height:128px"><div class="who"><h2>${esc(l.name)}</h2><small>${esc(l.title)} · ${esc(l.yrs)}</small><small>${l.era === 10 ? 'Mystery · Shattered Time' : 'Era ' + ERAS[l.era].roman + ' · ' + ERAS[l.era].name} · ${esc(role)}</small>${r ? `<small>Level ${r.lv} ${stars(r.stars)}</small>` : ''}</div></div>
      <p class="bio">${esc(l.bio)}</p>
      <h3>Attributes · always on</h3><div class="sklist">${[0, 1, 2].map((i) => `<div class="sk"><em>${labels[i]}</em><b>${esc(CW.attr(id, i).name)}</b>: ${esc(CW.attrText(id, i, r ? CW.attrStrength(id, i === 1 && st.main !== id ? 'partner' : 'main') : 1))}</div>`).join('')}<div class="sk"><em>Commander bonus · ${esc(cl.name)}</em>${esc(cl.d)}</div></div>
      <p class="note">They work while this leader is standing. When you fight them, they power the enemy army instead.</p>
      <div class="acts">${r ? `<button class="btn" data-act="train" data-id="${id}" ${CW.trainCost(id) > st.gold ? 'disabled' : ''}>Train to Lv ${r.lv + 1} · ${fmt(CW.trainCost(id))}</button>` : ''}<button class="btn ghost" data-act="close">Close</button></div>`
    );
  }

  function openRiftConfirm() {
    const n = CW.riftShards();
    if (!n) return;
    showModal('confirm', `<h2>Open a Time Rift?</h2><p class="bio">Back to stage 1 with <b>${fmt(n)}</b> more shards. Gold, upgrades and doctrines reset; your leaders stay.</p><div class="acts"><button class="btn ghost" data-act="close">Not yet</button><button class="btn blue" data-act="dorift">Open the rift</button></div>`);
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
  });
  CW.on('council', () => {
    if (started && !modalKind) setTimeout(() => {
      if (!modalKind && S().council) openCouncil();
    }, 200);
  });
  CW.on('era', (info) => {
    SFX.play('era');
    const e = ERAS[info.era];
    toast(e.name + ' era: new units', 'blue');
  });
  CW.on('chaos', () => {
    SFX.play('era');
    toast('Time shatters: random eras ahead', 'red');
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
      if (fieldVisible) {
        layout(B);
        consumeFx();
        render(dt, now / 1000);
      } else B.fx.length = 0;
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
    warmPortraits();
  }
  // build the 64x64 portraits a few at a time while the browser is idle, so opening Leaders never stalls
  function warmPortraits() {
    const queue = LEADERS.map((l) => l.id);
    const idle = window.requestIdleCallback || ((fn) => setTimeout(() => fn({ timeRemaining: () => 8 }), 60));
    const work = (dl) => {
      while (queue.length && dl.timeRemaining() > 4) CW.portraitURL(queue.shift());
      if (queue.length) idle(work);
    };
    idle(work);
  }
  CW.ui = { save, toast, openCouncil };
  const hot = window.claude && window.claude.hot;
  try {
    if (hot && hot.snapshot) hot.snapshot(() => (started ? { save: CW.serialize() } : {}));
  } catch (e) {}
  if (hot && hot.ready) hot.ready(boot);
  else boot((hot && hot.data) || {});
})();
