/* Chrono Command — UI: canvas rendering, command deck, panels, War Council, audio, saving. */
(function () {
  'use strict';
  const CW = window.CW;
  const { LEADER, LEADERS, UNIT, UNITS, ERAS, ROLES, TRAITS, CLASSES, DOC, DOCTRINES, RARITY } = CW;
  const NERA = ERAS.length;
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
  // The battle is seen from a raised, angled camera: far rows are smaller and higher up (CW.proj in art.js).
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
  const proj = CW.proj;

  // sprites at a few fixed sizes, so a soldier walking towards the camera grows in clean steps instead of shimmering
  const BK = 0.04;
  function sized(img, ds) {
    const b = Math.max(2, Math.round(ds / BK));
    const arr = img._sz || (img._sz = []);
    let c = arr[b];
    if (!c) {
      const k = b * BK;
      c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * k));
      c.height = Math.max(1, Math.round(img.height * k));
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = false;
      x.drawImage(img, 0, 0, c.width, c.height);
      arr[b] = c;
    }
    return c;
  }
  const whiteOf = (c) => c._wh || (c._wh = CW.tinted(c, '#ffffff'));
  function unitImg(q) {
    const flip = (q.side === 'a') !== (q.face > 0);
    const k = flip ? '_s1' : '_s0';
    return q[k] || (q[k] = CW.unitSprite(q.uid, q.side, flip));
  }
  const unitScale = (q, s) => s * 0.9 * (UNIT[q.uid].size || 1);
  const BODY_K = 0.72; // soldiers built from the base body are drawn at this share of its size, times the depth scale
  // base-body frames shrink by keeping the most common colour in each block (outlines win ties), so faces stay readable
  const BBK = 0.06;
  function sizedBody(img, ds) {
    const b = Math.max(4, Math.round(ds / BBK));
    const arr = img._sb || (img._sb = []);
    let c = arr[b];
    if (c) return c;
    const k = b * BBK;
    if (k >= 0.97) return (arr[b] = k > 1.03 ? sized(img, k) : img);
    const sw = img.width;
    const sh = img.height;
    const src = img.getContext('2d').getImageData(0, 0, sw, sh).data;
    const ow = Math.max(1, Math.round(sw * k));
    const oh = Math.max(1, Math.round(sh * k));
    c = document.createElement('canvas');
    c.width = ow;
    c.height = oh;
    const cx = c.getContext('2d');
    const od = cx.createImageData(ow, oh);
    const cnt = new Map();
    for (let oy = 0; oy < oh; oy++)
      for (let ox = 0; ox < ow; ox++) {
        const x0 = Math.floor(ox / k);
        const x1 = Math.max(x0 + 1, Math.floor((ox + 1) / k));
        const y0 = Math.floor(oy / k);
        const y1 = Math.max(y0 + 1, Math.floor((oy + 1) / k));
        cnt.clear();
        let empty = 0;
        let tot = 0;
        for (let y = y0; y < Math.min(sh, y1); y++)
          for (let x = x0; x < Math.min(sw, x1); x++) {
            const i = (y * sw + x) * 4;
            tot++;
            if (src[i + 3] < 128) {
              empty++;
              continue;
            }
            const key = (src[i] << 16) | (src[i + 1] << 8) | src[i + 2];
            const wgt = src[i] + src[i + 1] + src[i + 2] < 150 ? 1.6 : 1;
            cnt.set(key, (cnt.get(key) || 0) + wgt);
          }
        if (empty > tot * 0.55 || !cnt.size) continue;
        let best = 0;
        let bw = -1;
        for (const [key, wgt] of cnt)
          if (wgt > bw) {
            bw = wgt;
            best = key;
          }
        const o = (oy * ow + ox) * 4;
        od.data[o] = best >> 16;
        od.data[o + 1] = (best >> 8) & 255;
        od.data[o + 2] = best & 255;
        od.data[o + 3] = 255;
      }
    cx.putImageData(od, 0, 0);
    return (arr[b] = c);
  }
  // which frame of the base-body animation a fighter shows right now
  const ATK_T = 0.42;
  function pose(q, B, t, kind, who) {
    if (B.phase === 'victory' && q.side === 'a') return ['cheer', Math.floor(t * 7 + q.id) % 4];
    if (q._atk !== undefined && q._atk < ATK_T) {
      const a = q._aa || (q._aa = CW.attackAnim(kind, who));
      const n = CW.ANIM[a].f.length;
      return [a, Math.min(n - 1, Math.floor((q._atk / ATK_T) * n))];
    }
    if (stepping(B, q)) return ['walk', Math.floor(t * 11 + q.id * 0.37) % 9];
    return ['idle', 0];
  }
  const bodyOf = (q) => q._bd === undefined ? (q._bd = q.kind === 'unit' && CW.usesBody(q.uid)) : q._bd;

  // ---- per-battle ground: the field plus everything that has fallen on it (bodies, wrecks, scorch marks)
  const ground = document.createElement('canvas');
  ground.width = FW * K;
  ground.height = FH * K;
  const gg = ground.getContext('2d');
  let groundOf = null;
  const ents = new Map();
  function newBattle(B) {
    groundOf = B;
    gg.imageSmoothingEnabled = false;
    gg.globalAlpha = 1;
    gg.drawImage(CW.field(B.info.era), 0, 0);
    ents.clear();
    for (const q of B.ents) ents.set(q.id, q);
    booms.length = 0;
    parts.length = 0;
    nums.length = 0;
  }
  function bakeBody(q) {
    const P = proj(q.x, q.z);
    let img;
    if (q.kind === 'unit' && bodyOf(q)) {
      const f = CW.unitFrame(q.uid, q.side, 'idle', 0, q.face < 0);
      img = f ? sizedBody(f, P.s * BODY_K) : null;
    } else if (q.kind === 'unit') img = sized(unitImg(q).c, unitScale(q, P.s));
    else {
      const f = CW.leaderFrame(q.lid, q.side, q.isBoss ? groundOf.info.variant : '', 'idle', 0);
      img = f ? sized(f, q.isBoss ? 2 : 1) : null;
    }
    if (!img) return;
    const body = CW.corpse(img);
    gg.globalAlpha = 0.7;
    gg.drawImage(body, Math.round(P.x * K - body.width / 2), Math.round(P.y * K - body.height * 0.75));
    gg.globalAlpha = 1;
  }
  function scorch(x, z, r) {
    const P = proj(x, z);
    const w = r * 2.4 * P.s * K;
    gg.globalAlpha = 0.4;
    gg.drawImage(CW.shadowImg, Math.round(P.x * K - w / 2), Math.round(P.y * K - w * 0.18), Math.round(w), Math.round(w * 0.36));
    gg.globalAlpha = 1;
  }

  // ---- effects in screen space
  const booms = [];
  const parts = [];
  const nums = [];
  let shake = 0;
  let flashT = 0;
  let flashCol = '#fff';
  let numT = 0;
  function num(x, y, txt, col, scale) {
    if (nums.length > 14) nums.shift();
    nums.push({ x, y, txt, col, scale: scale || 1, t: 0 });
  }
  function boom(x, y, r, col) {
    if (booms.length > 60) booms.shift();
    booms.push({ x, y, r: r || 6, t: 0, col: col || '#ffd23f' });
  }
  function burst(x, y, n, col, kind) {
    for (let i = 0; i < n; i++) {
      if (parts.length > 260) parts.shift();
      const a = Math.random() * Math.PI * 2;
      const sp = 14 + Math.random() * 30;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.6 - (kind === 'coin' ? 46 : 22), t: 0, life: 0.45 + Math.random() * 0.4, col, kind });
    }
  }
  // the point a projectile or spark should aim at: roughly the chest of the sprite
  function chest(q) {
    const P = proj(q.x, q.z);
    if (q.isBoss || q.isHero) return { x: P.x, y: P.y - (q.isBoss ? 26 : 13), s: P.s };
    if (bodyOf(q)) return { x: P.x, y: P.y - 11 * P.s, s: P.s };
    const h = q.air ? 30 : 7;
    return { x: P.x, y: P.y - h * P.s, s: P.s };
  }

  function consumeFx() {
    const B = CW.battle();
    if (!B || !B.fx.length) return;
    for (const e of B.fx) {
      if (e.k === 'hit') {
        const q = ents.get(e.to);
        if (!q) continue;
        if (e.crit && e.side === 'a' && numT <= 0) {
          const c = chest(q);
          num(c.x + (Math.random() * 6 - 3), c.y - 8, fmt(e.dmg), '#ffd23f', 1);
          numT = 0.14;
        }
        if (Math.random() < 0.25) {
          const c = chest(q);
          burst(c.x, c.y, 2, e.side === 'a' ? '#fff0b0' : '#ffb0a0');
        }
        SFX.play(e.crit ? 'crit' : 'hit');
      } else if (e.k === 'death') {
        const q = ents.get(e.id);
        if (!q) continue;
        const c = chest(q);
        if (q.isBoss) {
          boom(c.x, c.y, 18, '#ff5a3a');
          shake = 0.4;
          SFX.play('boom');
        } else if (q.air || q.role === 'hvy') {
          boom(c.x, c.y, 8 * c.s, '#ffb030');
          scorch(q.x, q.z, 8);
          SFX.play('boom');
        }
        burst(c.x, c.y, q.isBoss ? 18 : 4, q.side === 'e' ? '#c8c0b0' : '#9ad8ff');
        if (!q.isHero) bakeBody(q);
      } else if (e.k === 'blast') {
        const P = proj(e.x, e.z);
        boom(P.x, P.y - 3 * P.s, e.r * P.s, e.side === 'a' ? '#ffd23f' : '#ff7a3a');
        if (Math.random() < 0.2) scorch(e.x, e.z, e.r);
        SFX.play('boom');
      } else if (e.k === 'tap') {
        const P = proj(e.x, e.z);
        boom(P.x, P.y - 4, 12 * P.s, '#ffffff');
        boom(P.x, P.y - 4, 7 * P.s, '#bff4ff');
        scorch(e.x, e.z, 10);
        if (e.dmg > 0) num(P.x, P.y - 18, fmt(e.dmg), '#bff4ff', 2);
        shake = Math.max(shake, 0.12);
      } else if (e.k === 'gold') {
        const P = proj(e.x, e.z);
        burst(P.x, P.y - 6, 3, '#ffd23f', 'coin');
        SFX.play('coin');
      } else if (e.k === 'revive') {
        const q = ents.get(e.id);
        if (q) {
          const c = chest(q);
          burst(c.x, c.y, 6, '#7dffb0', 'up');
        }
      } else if (e.k === 'herofall') {
        toast(short(e.lid) + ' is down', 'red');
      }
    }
    B.fx.length = 0;
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
  // draw a canvas made at 2x so each of its pixels lands on one device pixel
  function blit(img, x, y) {
    g.drawImage(img, q2(x), q2(y), img.width / K, img.height / K);
  }

  function animate(q, dt) {
    const f = q.maxHp > 0 ? Math.max(0, q.hp / q.maxHp) : 0;
    if (q.hpS === undefined) {
      q.hpS = f;
      q.hpT = f;
    }
    q.hpS += (f - q.hpS) * Math.min(1, dt * 14);
    if (q.hpS >= q.hpT) q.hpT = q.hpS;
    else q.hpT += (q.hpS - q.hpT) * Math.min(1, dt * 2.5);
    q.flash = Math.max(0, q.flash - dt * 6);
    if (q.lunge > (q._pl || 0) + 0.01) q._atk = 0;
    if (q._atk !== undefined) q._atk += dt;
    q.lunge = Math.max(0, q.lunge - dt * 5);
    q._pl = q.lunge;
  }
  function hpBar(q, x, y, w, col) {
    R(x - 0.5, y - 0.5, w + 1, 2.5, '#0b0d08');
    if (q.hpT > q.hpS + 0.005) R(x + w * q.hpS, y, w * (q.hpT - q.hpS), 1.5, '#f4e8c8');
    if (q.hpS > 0.002) R(x, y, Math.max(0.5, w * q.hpS), 1.5, col);
  }
  function stunStars(c, y, t, r) {
    const a = t * 8;
    R(c + Math.cos(a) * r, y + Math.sin(a) * 1.5, 1.5, 1.5, '#ffe86a');
    R(c + Math.cos(a + 3) * r, y + Math.sin(a + 3) * 1.5, 1.5, 1.5, '#ffe86a');
  }

  // armies march onto the field from both sides while the battle is being set up
  function marchOff(B, q) {
    if (B.phase !== 'deploy') return 0;
    return (q.side === 'a' ? -1 : 1) * 60 * Math.pow(Math.max(0, B.pt) / 1.2, 2);
  }
  function stepping(B, q) {
    return B.phase === 'deploy' ? B.pt > 0.05 : B.phase === 'fight' && q.moving;
  }

  // where each fighter stands on screen this frame: computed once, reused by its shadow and sprite
  function place(q, B) {
    const P = q._P || (q._P = { x: 0, y: 0, s: 1 });
    const x = q.x + marchOff(B, q);
    const t = Math.max(0, Math.min(1, q.z / 120));
    P.s = 0.6 + 0.45 * t;
    P.x = 192 + (x - 180) * P.s;
    P.y = 104 + 104 * t * (0.5 + 0.5 * t);
  }
  // soft ground shadows, pre-made at each width so they're copied, never scaled
  const shadows = new Map();
  function shadowOf(wpx) {
    let c = shadows.get(wpx);
    if (!c) {
      c = document.createElement('canvas');
      c.width = wpx;
      c.height = Math.max(4, Math.round(wpx * 0.3));
      const x = c.getContext('2d');
      x.imageSmoothingEnabled = true;
      x.drawImage(CW.shadowImg, 0, 0, c.width, c.height);
      shadows.set(wpx, c);
    }
    return c;
  }
  const rings = new Map();
  function ringOf(wpx, col) {
    const key = wpx + col;
    let c = rings.get(key);
    if (!c) {
      c = document.createElement('canvas');
      c.width = wpx + 4;
      c.height = Math.round(wpx * 0.36) + 4;
      const x = c.getContext('2d');
      const rx = wpx / 2;
      const ry = c.height / 2 - 2;
      x.fillStyle = col;
      for (let y = 0; y < c.height; y++)
        for (let i = 0; i < c.width; i++) {
          const dx = (i + 0.5 - c.width / 2) / rx;
          const dy = (y + 0.5 - c.height / 2) / ry;
          const d = dx * dx + dy * dy;
          if (d <= 1 && d >= 0.62) x.fillRect(i, y, 1, 1);
        }
      rings.set(key, c);
    }
    return c;
  }
  function drawShadow(q, B) {
    const P = q._P;
    let w;
    if (q.isBoss || q.isHero) {
      // leaders stand on a ring: gold for your commander, blue for partners, red for the enemy leader
      w = q.isBoss ? 40 : 20;
      const ring = ringOf(Math.round(w * K), q.isBoss ? '#e0675a' : q.main ? '#e0be6a' : '#86b4d3');
      g.globalAlpha = 0.75;
      blit(ring, P.x - ring.width / (2 * K), P.y - ring.height / (2 * K));
      g.globalAlpha = 1;
    } else if (bodyOf(q)) w = 13 * P.s;
    else w = (unitImg(q).w || 10) * 0.85 * (UNIT[q.uid].size || 1) * P.s;
    const c = shadowOf(Math.max(4, Math.round(w * K)));
    if (q.air) g.globalAlpha = 0.6;
    blit(c, P.x - c.width / (2 * K), P.y - c.height / (2 * K));
    if (q.air) g.globalAlpha = 1;
  }

  function drawUnit(q, t, B) {
    const P = q._P;
    if (bodyOf(q)) {
      const [an, fi] = pose(q, B, t, 'U', q.uid);
      const f = CW.unitFrame(q.uid, q.side, an, fi, q.face < 0);
      if (f) {
        const img = sizedBody(f, P.s * BODY_K);
        const k = img.width / f.width;
        const lx = q.lunge > 0 ? Math.sin(Math.min(1, q.lunge) * Math.PI) * (q.proj ? -0.6 : 2) * P.s * q.face : 0;
        const x = P.x - (f.width / 2 / K) * k + lx;
        const y = P.y - ((f.height - 2) / K) * k + 0.5;
        blit(img, x, y);
        if (q.flash > 0.05) {
          g.globalAlpha = q.flash * 0.85;
          blit(whiteOf(img), x, y);
          g.globalAlpha = 1;
        }
        if (q.stun > 0) stunStars(P.x, y + 2, t, 4 * P.s);
        if (q.burn && (q.id + Math.floor(t * 10)) % 3 === 0) R(P.x - 1 + Math.random() * 2, y + (img.height / K) * 0.4 - Math.random() * 3, 1, 1, '#ff9a3a');
        return;
      }
    }
    const sp = unitImg(q);
    const img = sized(sp.c, unitScale(q, P.s));
    const w = img.width / K;
    const h = img.height / K;
    let bob = 0;
    if (q.air) bob = -24 * P.s + Math.sin(t * 3 + q.id) * 1.2;
    else if (stepping(B, q)) bob = -Math.abs(Math.sin(t * 11 + q.id * 1.7)) * 1.3 * P.s;
    else if (B.phase === 'victory' && q.side === 'a') bob = -Math.abs(Math.sin(t * 7 + q.id)) * 2.5 * P.s;
    const lx = q.lunge > 0 ? Math.sin(Math.min(1, q.lunge) * Math.PI) * (q.proj ? -1 : 3) * P.s * q.face : 0;
    const x = P.x - w / 2 + lx;
    const y = P.y - h + bob + 0.5;
    blit(img, x, y);
    if (q.flash > 0.05) {
      g.globalAlpha = q.flash * 0.85;
      blit(whiteOf(img), x, y);
      g.globalAlpha = 1;
    }
    if (q.stun > 0) stunStars(P.x, y - 2, t, 4 * P.s);
    if (q.burn && (q.id + Math.floor(t * 10)) % 3 === 0) R(P.x - 1 + Math.random() * 2, y + h * 0.3 - Math.random() * 3, 1, 1, '#ff9a3a');
  }

  // commanders and enemy leaders: full-body sprites in the battle (the enemy leader is a giant)
  function drawHero(q, t, B) {
    const isBoss = q.isBoss;
    const info = B.info;
    const P = q._P;
    const variant = isBoss ? info.variant : '';
    // leaders are drawn pixel for pixel (the enemy leader at double size), never squashed by distance
    const ds = isBoss ? 2 : 1;
    const flip = q.side === 'e';
    let [an, fi] = q.alive ? pose(q, B, t, 'L', q.lid) : ['idle', 0];
    const f = CW.leaderFrame(q.lid, q.side, variant, an, fi, flip);
    if (!f) return;
    const img = sized(f, ds);
    const W = img.width / K;
    const H = img.height / K;
    const x0 = P.x - W / 2;
    const y0 = P.y - (H * (f.height - 2)) / f.height;
    if (!q.alive) {
      if (q.side === 'a') {
        g.globalAlpha = 0.35;
        blit(CW.tinted(img, '#0a0710'), x0, y0);
        g.globalAlpha = 1;
        text('DOWN', P.x, y0 - 4, '#ff8a7a', 1, 'c');
      }
      return;
    }
    const lx = q.lunge > 0 ? Math.sin(Math.min(1, q.lunge) * Math.PI) * 2.5 * (q.side === 'a' ? 1 : -1) * ds : 0;
    const x = x0 + lx;
    const y = y0 + 0.5;
    const hidden = isBoss && info.mystery && B.phase === 'deploy';
    if (isBoss || q.main) {
      const aura = !isBoss ? '#ffd23f' : info.mystery ? '#d08aff' : info.chaos ? '#b070ff' : info.variant === 'echo' ? '#2ee6ff' : '#ff5a4a';
      const au = CW.tinted(img, aura);
      g.globalAlpha = (isBoss ? 0.5 : 0.35) + 0.2 * Math.sin(t * 4.5);
      const d = isBoss ? 1 : 0.5;
      blit(au, x - d, y);
      blit(au, x + d, y);
      blit(au, x, y - d);
      g.globalAlpha = 1;
    }
    blit(hidden ? CW.tinted(img, '#0a0710') : img, x, y);
    if (q.flash > 0.05 && !hidden) {
      g.globalAlpha = q.flash * 0.8;
      blit(whiteOf(img), x, y);
      g.globalAlpha = 1;
    }
    if (hidden) text('?', P.x, y + H * 0.3, '#e8d0ff', 4, 'c');
    if (!isBoss) hpBar(q, P.x - 9, P.y + 1.5, 18, q.main ? '#ffd23f' : '#5ad1ff');
    if (q.stun > 0) stunStars(P.x, y + 2, t, 7);
  }

  // ---- projectiles straight from the simulation: arrows and shells arc, bullets and lasers fly flat
  const ARC = { arrow: 0.16, rock: 0.2, javelin: 0.14, boulder: 0.32, shell: 0.22, grenade: 0.38, bomb: 0, bullet: 0, laser: 0, plasma: 0.03, rocket: 0.05 };
  function projPos(p, k) {
    const x = p.x0 + (p.x1 - p.x0) * k;
    const z = p.z0 + (p.z1 - p.z0) * k;
    const dist = Math.abs(p.x1 - p.x0) + Math.abs(p.z1 - p.z0) * 0.5;
    const h = p.h0 + (p.h1 - p.h0) * k + (ARC[p.kind] || 0) * dist * Math.sin(k * Math.PI);
    const P = proj(x, z);
    return { x: P.x, y: P.y - h * P.s, s: P.s };
  }
  const FLASHY = { bullet: '#fff2a0', laser: '#9afcff', plasma: '#e0b0ff', rocket: '#ffb060', shell: '#ffd080' };
  function drawProj(B) {
    for (const p of B.proj) {
      // a muzzle flash for the first moments of a shot
      if (p.t < 0.07 && FLASHY[p.kind]) {
        const m = projPos(p, 0);
        const d = CW.disc(Math.max(1, 2.2 * m.s), FLASHY[p.kind]);
        g.globalAlpha = 1 - p.t / 0.07;
        g.drawImage(d, q2(m.x - d.width / 4), q2(m.y - d.height / 4), d.width / 2, d.height / 2);
        g.globalAlpha = 1;
      }
      const k = Math.min(1, p.t / p.dur);
      const a = projPos(p, k);
      const b = projPos(p, Math.max(0, k - 0.08));
      let dx = a.x - b.x;
      let dy = a.y - b.y;
      const dl = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dl;
      dy /= dl;
      const ally = p.side === 'a';
      switch (p.kind) {
        case 'arrow':
        case 'javelin': {
          const n = p.kind === 'javelin' ? 4 : 3;
          for (let i = 1; i < n; i++) R(a.x - dx * i, a.y - dy * i, 0.5, 0.5, '#c8a878');
          R(a.x, a.y, 0.5, 0.5, '#e8e8f0');
          break;
        }
        case 'bullet': {
          const col = ally ? '#fff6a0' : '#ffc0a0';
          g.globalAlpha = 0.5;
          R(a.x - dx * 3, a.y - dy * 3, 1, 0.5, col);
          g.globalAlpha = 1;
          R(a.x - dx, a.y - dy, 1, 0.5, col);
          R(a.x, a.y, 0.5, 0.5, '#ffffff');
          break;
        }
        case 'laser': {
          const col = ally ? '#7dfbff' : '#ff6ad0';
          for (let i = 0; i < 6; i++) R(a.x - dx * i, a.y - dy * i, 1, 0.5, i < 2 ? '#ffffff' : col);
          break;
        }
        case 'plasma': {
          const d = CW.disc(1.5 * a.s, ally ? '#7dffb0' : '#d08aff');
          g.globalAlpha = 0.7;
          g.drawImage(d, q2(a.x - d.width / 4), q2(a.y - d.height / 4), d.width / 2, d.height / 2);
          g.globalAlpha = 1;
          R(a.x - 0.5, a.y - 0.5, 1, 1, '#ffffff');
          break;
        }
        case 'rocket': {
          g.globalAlpha = 0.4;
          R(b.x - 0.5, b.y - 0.5, 1.5, 1.5, '#bdbdbd');
          g.globalAlpha = 1;
          R(a.x - dx - 0.5, a.y - dy - 0.5, 1, 1, '#ff9a3a');
          R(a.x - 0.5, a.y - 0.5, 1.5, 1, '#e8e8e8');
          break;
        }
        case 'bomb':
          R(a.x - 0.5, a.y - 1, 1.5, 2, '#2a2a2a');
          break;
        default: {
          // rock, boulder, shell, grenade
          const r = p.kind === 'boulder' ? 2.2 : p.kind === 'rock' ? 1 : 1.4;
          const sz = r * a.s;
          R(a.x - sz / 2, a.y - sz / 2, sz, sz, p.kind === 'boulder' || p.kind === 'rock' ? '#7a6a5a' : '#2a2a2a');
          R(a.x - sz / 2, a.y - sz / 2, sz / 2, sz / 3, '#bcb0a0');
        }
      }
    }
  }

  // the HUD is a light DOM overlay on top of the canvas: stage, who's winning, the enemy leader and big banners
  const hud = {
    label: $('#hudLabel'), sub: $('#hudSub'), tug: $('#hudTug'), a: $('#hudA'), e: $('#hudE'), boss: $('#hudBoss'), bossName: $('#hudBossName'),
    time: $('#hudTime'), bossHp: $('#hudBossHp'), bossT: $('#hudBossT'), banner: $('#banner'), bt: $('#bannerT'), bs: $('#bannerS'),
  };
  function setW(node, f) {
    const w = (Math.max(0, Math.min(1, f || 0)) * 100).toFixed(1) + '%';
    if (node._w !== w) node.style.width = node._w = w;
  }
  function setClass(node, c) {
    if (node._c !== c) node.className = node._c = c;
  }
  function drawHud(B, st) {
    const info = B.info;
    setText(hud.label, info.isBoss ? (info.mystery ? 'Mystery boss' : info.variant === 'echo' ? 'Echo battle' : 'Leader battle') : 'Stage ' + st.stage);
    setHidden(hud.sub, !st.farming);
    const a = B.aliveA;
    const e = B.aliveE;
    setW(hud.tug, a + e ? a / (a + e) : 0.5);
    setText(hud.a, a + ' yours');
    setText(hud.e, e + ' enemy');
    setHidden(hud.boss, !B.boss);
    if (B.boss) {
      const hidden = info.mystery && B.phase === 'deploy';
      setText(hud.bossName, hidden ? '???' : short(B.boss.lid));
      setW(hud.bossHp, B.boss.hpS === undefined ? 1 : B.boss.hpS);
      setText(hud.time, Math.max(0, Math.ceil(B.bossT)) + 's');
      setClass(hud.time, B.bossT < 10 ? 'low' : '');
      setW(hud.bossT, B.bossT / B.bossTMax);
    }
    let t = '';
    let sub = '';
    let c = 'banner';
    if (B.phase === 'deploy') {
      if (info.isBoss) {
        t = 'vs ' + (info.mystery ? '???' : LEADER[info.bossId].name);
        sub = fmtYear(info.yr);
        c += ' boss';
      } else {
        t = 'Stage ' + st.stage;
        sub = ERAS[info.era].name + ', ' + fmtYear(info.yr);
      }
    } else if (B.phase === 'victory') {
      t = 'Victory';
      c += ' win';
      if (B.reward) sub = B.reward.res === 'recruit' ? LEADER[B.reward.lid].name + ' joins you' : B.reward.res === 'star' ? short(B.reward.lid) + ' earns a star' : '+1 Chrono Shard';
    } else if (B.phase === 'defeat') {
      t = B.loseWhy === 'time' ? 'Out of time' : 'Retreat';
      sub = 'Regroup and grow stronger';
      c += ' lose';
    }
    if (t) {
      setText(hud.bt, t);
      setText(hud.bs, sub);
    }
    setClass(hud.banner, c + (t ? ' on' : ''));
  }

  const order = [];
  const byDepth = (a, b) => (a.air ? 1000 : 0) + a.z - ((b.air ? 1000 : 0) + b.z);
  function render(dt, t) {
    const B = CW.battle();
    const st = S();
    if (!B || !st) return;
    if (B !== groundOf) newBattle(B);
    g.setTransform(K, 0, 0, K, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    g.drawImage(ground, 0, 0, FW, FH);
    const era = B.info.era;
    // drifting embers, neon motes or star dust in a few eras
    if (era === 8 || era === 11 || era === 13) {
      const c = era === 8 ? '#ffb060' : era === 11 ? '#2ee6ff' : '#d0b0ff';
      for (let i = 0; i < 16; i++) {
        const x = (((i * 53 + t * (era === 8 ? 9 : 12)) % FW) + FW) % FW;
        const y = (((i * 37 + t * (era === 8 ? -12 : 5)) % 120) + 120) % 120;
        R(x, y, 1, 1, c);
      }
    }
    let sx = 0;
    let sy = 0;
    if (shake > 0) {
      const k = Math.min(1, shake / 0.25);
      sx = (Math.random() - 0.5) * 4 * k;
      sy = (Math.random() - 0.5) * 3 * k;
      shake -= dt;
    }
    numT -= dt;
    g.save();
    g.translate(q2(sx), q2(sy));
    order.length = 0;
    for (const q of B.ents) {
      animate(q, dt);
      if (q.alive || (q.isHero && q.side === 'a')) {
        place(q, B);
        order.push(q);
      }
    }
    for (const q of order) if (q.alive) drawShadow(q, B);
    if (B.phase === 'deploy' || B.ft < 3) {
      for (const q of order)
        if (q.alive && !q.air && stepping(B, q) && Math.random() < dt * 1.6 && parts.length < 200)
          parts.push({ x: q._P.x + (Math.random() - 0.5) * 6, y: q._P.y - 1, vx: -q.face * 6, vy: -6, t: 0, life: 0.5, col: 'rgba(200,190,170,.7)', kind: 'up' });
    }
    order.sort(byDepth);
    for (const q of order) {
      if (q.kind === 'unit') drawUnit(q, t, B);
      else drawHero(q, t, B);
    }
    drawProj(B);
    // explosions: cached discs that grow, change colour and fade
    for (let i = booms.length - 1; i >= 0; i--) {
      const b = booms[i];
      b.t += dt;
      const k = b.t / 0.38;
      if (k >= 1) {
        booms.splice(i, 1);
        continue;
      }
      const r = Math.max(1, Math.round(b.r * (0.4 + easeOut(k) * 0.9) * 2) / 2);
      const d = CW.disc(r, k < 0.25 ? '#ffffff' : k < 0.6 ? b.col : '#6a6a6a');
      g.globalAlpha = k > 0.6 ? (1 - k) / 0.4 : 1;
      g.drawImage(d, q2(b.x - d.width / 4), q2(b.y - d.height / 4), d.width / 2, d.height / 2);
      g.globalAlpha = 1;
    }
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
        p.vy += 150 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      const f = p.t / p.life;
      g.globalAlpha = f > 0.6 ? (1 - f) / 0.4 : 1;
      R(p.x, p.y, 1, 1, p.col);
    }
    g.globalAlpha = 1;
    for (let i = nums.length - 1; i >= 0; i--) {
      const n = nums[i];
      n.t += dt;
      if (n.t > 0.95) {
        nums.splice(i, 1);
        continue;
      }
      g.globalAlpha = n.t > 0.6 ? (0.95 - n.t) / 0.35 : 1;
      text(n.txt, n.x, n.y - easeOut(Math.min(1, n.t / 0.6)) * 14, n.col, n.scale, 'c');
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

  // tap to strike: an explosion where you tap, hurting every enemy close to it
  let lastTap = 0;
  screenEl.addEventListener('pointerdown', (e) => {
    SFX.ensure();
    const now = performance.now();
    if (now - lastTap < 60) return;
    lastTap = now;
    const r = cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * FW;
    const y = ((e.clientY - r.top) / r.height) * FH;
    let dmg;
    if (y > proj(0, 0).y) {
      const w = CW.unproj(x, y);
      dmg = CW.tap(w.x, w.z);
    } else dmg = CW.tap();
    if (dmg) SFX.play('tap');
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
    deck: $('#deck'), panel: $('#panel'), sheet: $('#sheet'), sheetTitle: $('#sheetTitle'), shortcuts: $('#shortcuts'), autoPush: $('#autoPush'), modal: $('#modal'), dlg: $('#dlg'),
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
    if (info.mystery && B.boss && B.phase === 'fight' && revealed !== B.boss.id) {
      revealed = B.boss.id;
      toast("It's " + LEADER[B.boss.lid].name + '!', 'red');
      SFX.play('bosscast');
    }
    const SPB = CW.CFG.stagesPerBoss;
    const left = SPB - 1 - info.sub;
    const bossStage = st.stage + left;
    const bi = CW.stageInfo(bossStage);
    const shown = bi.mystery && !(info.isBoss && B.phase !== 'deploy');
    const nv = shown ? 'mystery' : bi.variant;
    const bid = bi.bossId + nv;
    if (nextImgId !== bid) {
      nextImgId = bid;
      el.nextImg.src = CW.headURL(bi.bossId, nv);
    }
    const bname = shown ? '???' : short(bi.bossId);
    const killed = B.e.length ? 1 - B.aliveE / B.e.length : 0;
    const prog = info.isBoss ? 1 : (info.sub + killed) / (SPB - 1);
    const pw = 'calc((100% - 4px) * ' + prog.toFixed(3) + ')';
    if (el.nextBar._w !== pw) el.nextBar.style.width = el.nextBar._w = pw;
    setText(el.nextTxt, info.isBoss ? 'VS ' + bname : bname + ' in ' + left + (left === 1 ? ' stage' : ' stages'));
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
    el.deck.innerHTML = [st.main, st.partners[0], st.partners[1]]
      .filter(Boolean)
      .map((lid, i) => `<button class="chip ${i === 0 ? 'main' : ''}" data-card="${lid}" title="${esc(LEADER[lid].name)}"><img class="px" src="${CW.headURL(lid)}" alt=""><span>${esc(short(lid))}<span class="hp${i === 0 ? ' main' : ''}"><i data-hp="${lid}"></i></span></span></button>`)
      .join('');
    if (!el.sheet.hidden && tab === 'command') renderPanel();
  }
  // the Commanders sheet: full cards with each leader's attributes
  function renderCommand() {
    const st = S();
    const card = (lid, i) => {
      if (!lid) return '<div class="partner box"><div class="who"><b>Open slot</b><small>Win leader battles to recruit partners</small></div></div>';
      const L = LEADER[lid];
      const r = st.roster[lid];
      const main = i === 0;
      const cl = CLASSES[L.cls];
      return `<div class="${main ? 'lead' : 'partner'} box" data-card="${lid}" title="Tap for details"><img class="px" src="${CW.portraitURL(lid)}" alt=""><div class="who"><b>${esc(L.name)}</b><small>${main ? `<span title="${esc(cl.d)}">${esc(cl.name)}</span>` : 'Partner'} · <span class="nw">Lv ${r.lv}</span> ${stars(r.stars)}</small></div><ul class="attrs">${attrRows(lid, main ? [0, 1, 2] : [1], CW.attrStrength(lid, main ? 'main' : 'partner'))}</ul></div>`;
    };
    return `<div class="phead"><h2>Commanders</h2>${st.council ? '<button class="btn blue" data-act="council">Change at the War Council</button>' : ''}</div>
      <div class="cards">${card(st.main, 0)}${card(st.partners[0], 1)}${card(st.partners[1], 2)}</div>
      <p class="note">Your commander brings all three attributes and a class bonus; each partner brings one. Swap them after any leader battle.</p>`;
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
      for (const q of B.a) if (q.isHero && q.lid === h.lid) hero = q;
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
  const TITLES = { army: 'Army', command: 'Commanders', leaders: 'Leaders', doctrines: 'Doctrines', rift: 'Time Rift', options: 'Options' };
  function openSheet(t) {
    tab = t;
    setText(el.sheetTitle, TITLES[t]);
    el.sheet.hidden = false;
    document.querySelectorAll('[data-sc]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sc === t)));
    renderPanel();
    el.panel.scrollTop = 0;
  }
  function closeSheet() {
    el.sheet.hidden = true;
    el.shortcuts.querySelectorAll('[data-sc]').forEach((b) => b.setAttribute('aria-pressed', 'false'));
  }
  el.shortcuts.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sc]');
    if (!b) return;
    SFX.ensure();
    if (!el.sheet.hidden && tab === b.dataset.sc) closeSheet();
    else openSheet(b.dataset.sc);
  });
  $('#sheetClose').addEventListener('click', closeSheet);
  el.sheet.addEventListener('click', (e) => {
    if (e.target === el.sheet) return closeSheet();
    const b = e.target.closest('.stabs [data-sc]');
    if (b) openSheet(b.dataset.sc);
  });
  // what each shortcut shows at a glance
  const scEls = {};
  document.querySelectorAll('[data-scs]').forEach((n) => (scEls[n.dataset.scs] = n));
  function updateShortcuts() {
    const st = S();
    setText(scEls.army, CW.armyUsed() + ' / ' + CW.capacity());
    setText(scEls.command, short(st.main));
    setText(scEls.leaders, Object.keys(st.roster).length + ' / ' + LEADERS.length);
    setText(scEls.doctrines, st.council && st.council.picks ? 'Pick one' : String(Object.keys(st.doctrines).length));
    const n = CW.riftShards();
    setText(scEls.rift, n ? '+' + fmt(n) : 'Stage 40');
    setText(scEls.options, fmt(st.shards) + ' shards');
    const alertD = !!(st.council && st.council.picks);
    const b = el.shortcuts.querySelector('[data-sc="doctrines"]');
    if (b._a !== alertD) b.classList.toggle('alert', (b._a = alertD));
  }

  function panelSig() {
    const st = S();
    const base = [tab, st.main, st.partners.join(',')];
    if (tab === 'army') {
      const ids = ownedList();
      base.push(ids.join(','), st.eraReached, st.buyMode, JSON.stringify(st.uattr), ids.map((id) => CW.uslots(id)).join(''));
    }
    if (tab === 'leaders') base.push(Object.entries(st.roster).map(([k, r]) => k + r.stars).join(','));
    if (tab === 'command') base.push(deckSig, !!st.council);
    if (tab === 'doctrines') base.push(JSON.stringify(st.doctrines), !!st.council);
    if (tab === 'rift') base.push(st.runMax, Math.floor(Math.log10(st.shards + 1) * 20));
    if (tab === 'options') base.push(st.sound);
    return base.join('|');
  }

  function renderPanel() {
    lastSig = panelSig();
    const f = { army: renderArmy, command: renderCommand, leaders: renderLeaders, doctrines: renderDoctrines, rift: renderRift, options: renderOptions }[tab];
    el.panel.innerHTML = f();
    updatePanel();
  }
  function updatePanel() {
    if (panelSig() !== lastSig) return renderPanel();
    const st = S();
    if (tab === 'army') {
      // recruit and train buttons fill up as you save towards them
      const money = (b, cost, label) => {
        const ok = cost <= st.gold;
        setClass(b, 'buy ' + (ok ? 'ok' : 'save'));
        if (b.disabled === ok) b.disabled = !ok;
        if (!ok) {
          const p = Math.floor((100 * st.gold) / cost) + '%';
          if (b._p !== p) b.style.setProperty('--p', (b._p = p));
        }
        setText(b.firstChild, ok ? label : label + ' · ' + Math.floor((100 * st.gold) / cost) + '%');
        setText(b.lastChild, fmt(cost));
      };
      el.panel.querySelectorAll('[data-act="recruit"]').forEach((b) => {
        const id = b.dataset.id;
        const n = st.buyMode === 'max' ? Math.max(1, CW.maxRecruit(id)) : st.buyMode;
        money(b, CW.recruitCost(id, n), 'Recruit ' + n);
      });
      el.panel.querySelectorAll('[data-act="buy"]').forEach((b) => {
        const id = b.dataset.id;
        const n = st.buyMode === 'max' ? Math.max(1, CW.maxBuy(id)) : st.buyMode;
        money(b, CW.unitCost(id, n), 'Train +' + n);
      });
      el.panel.querySelectorAll('[data-stat]').forEach((s) => {
        const id = s.dataset.stat;
        const u = CW.unitStats(id);
        setText(s, 'Lv ' + CW.unitLevel(id) + ' · DMG ' + fmt(u.atk) + ' · HP ' + fmt(u.hp));
      });
      el.panel.querySelectorAll('[data-n]').forEach((s) => setText(s, String(st.army[s.dataset.n] || 0)));
      el.panel.querySelectorAll('[data-own]').forEach((s) => setText(s, 'of ' + CW.owned(s.dataset.own) + ' owned'));
      const used = CW.armyUsed();
      const cap = CW.capacity();
      const capEl = el.panel.querySelector('[data-cap]');
      if (capEl) setText(capEl, used + ' / ' + cap);
      const ownEl = el.panel.querySelector('[data-owned]');
      if (ownEl) setText(ownEl, 'You own ' + CW.ownedSize() + ' soldiers');
      const bar = el.panel.querySelector('[data-capbar]');
      if (bar) setW(bar, used / Math.max(1, cap));
      const ab = el.panel.querySelector('[data-act="autobuild"]');
      if (ab && ab.checked !== st.auto.build) ab.checked = st.auto.build;
      el.panel.querySelectorAll('[data-act="inc"]').forEach((b) => {
        const id = b.dataset.id;
        const dis = cap - used < CW.cpCost(id) || (st.army[id] || 0) >= CW.owned(id);
        if (b.disabled !== dis) b.disabled = dis;
      });
      el.panel.querySelectorAll('[data-act="dec"]').forEach((b) => {
        const dis = !st.army[b.dataset.id];
        if (b.disabled !== dis) b.disabled = dis;
      });
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
  const ROLE_ORDER = { inf: 0, rng: 1, cav: 2, hvy: 3 };
  // unit types you own soldiers of
  function ownedList() {
    const st = S();
    return Object.keys(st.owned)
      .filter((id) => st.owned[id] > 0 && UNIT[id] && UNIT[id].era <= st.eraReached)
      .sort();
  }
  // the army: soldiers you own (bought with gold), how many of each march into battle, their training and attributes
  function renderArmy() {
    const st = S();
    const units = CW.unlockedUnits().slice().sort((a, b) => b.era - a.era || ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);
    const mine = ownedList();
    const own = units.filter((u) => mine.includes(u.id)).sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || b.era - a.era);
    const rest = units.filter((u) => !mine.includes(u.id));
    const topEra = rest.length ? rest[0].era : -1;
    const fresh = rest.filter((u) => u.era === topEra);
    const older = rest.filter((u) => u.era !== topEra);
    const card = (u) => {
      const on = mine.includes(u.id);
      const slots = CW.uslots(u.id);
      const eq = st.uattr[u.id] || [];
      const ua = on
        ? `<div class="uas">${[0, 1, 2]
            .map((i) => {
              if (i >= slots) return `<button class="ua lock" disabled><b>Slot ${i + 1}</b><span>Unlocks at </span>Lv ${i === 1 ? 10 : 30}</button>`;
              const a = CW.UATTR[eq[i]];
              return a
                ? `<button class="ua" data-act="uaslot" data-id="${u.id}" data-i="${i}" title="${esc(a.d)}"><b>${esc(a.name)}</b><span>${esc(a.d)}</span></button>`
                : `<button class="ua empty" data-act="uaslot" data-id="${u.id}" data-i="${i}"><b>+ Equip</b><span>Empty slot</span></button>`;
            })
            .join('')}</div>`
        : '';
      const ctl = on
        ? `<div class="row"><div class="cnt" aria-label="Soldiers marching into battle"><button class="sq" data-act="dec" data-id="${u.id}" data-hold aria-label="One fewer in battle">−</button><b data-n="${u.id}">${st.army[u.id] || 0}</b><button class="sq" data-act="inc" data-id="${u.id}" data-hold aria-label="One more in battle">+</button><span class="of" data-own="${u.id}"></span></div><span class="st" data-stat="${u.id}"></span></div>`
        : '';
      return `<div class="ucard ${on ? 'on' : ''}"><img class="px" src="${CW.unitURL(u.id)}" alt=""><div class="nm">${esc(u.name)} <span class="tag ${u.role}">${ROLES[u.role].name}</span></div><div class="meta">${esc(ERAS[u.era].name)} · ${CW.cpCost(u.id)} capacity each</div><div class="tr">${esc(TRAITS[u.trait])}</div>${ctl}
        <div class="buys ${on ? '' : 'one'}"><button class="buy" data-act="recruit" data-id="${u.id}"><span></span><b></b></button>${on ? `<button class="buy" data-act="buy" data-id="${u.id}"><span></span><b></b></button>` : ''}</div>${ua}</div>`;
    };
    return `<div class="phead"><h2>Army</h2><div class="seg" role="group" aria-label="How many to buy">${[1, 10, 'max']
      .map((m) => `<button data-act="mode" data-m="${m}" aria-pressed="${st.buyMode === m}">${m === 'max' ? 'Max' : '×' + m}</button>`)
      .join('')}</div></div>
      <div class="capline"><span>In battle</span><div class="capbar"><i data-capbar></i></div><b data-cap></b><span data-owned></span></div>
      <div class="armyopts"><label class="tog"><input type="checkbox" data-act="autobuild" ${st.auto.build ? 'checked' : ''}> Auto-build</label><span class="note">Sends your strongest soldiers into each battle and fills empty attribute slots.</span></div>
      <p class="note">Soldiers cost gold and stay yours until a Time Rift. Newer eras cost more, so save up for them.</p>
      <div class="ugrid">${own.map(card).join('')}</div>
      ${fresh.length ? `<div class="sub">Recruit from the ${esc(ERAS[topEra].name)}</div><div class="ugrid">${fresh.map(card).join('')}</div>` : ''}
      ${older.length ? `<details class="reserve" ${reserveOpen ? 'open' : ''}><summary>Older units · ${older.length}</summary><div class="ugrid">${older.map(card).join('')}</div></details>` : ''}`;
  }

  function renderLeaders() {
    const st = S();
    let h = `<div class="phead"><h2>Leaders · ${Object.keys(st.roster).length}/${LEADERS.length}</h2></div>`;
    for (let e = 0; e <= NERA; e++) {
      const ls = LEADERS.filter((l) => l.era === e);
      if (!ls.length) continue;
      if (e === NERA) {
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
      <p class="note">${Math.floor(s.time / 3600)}h ${Math.floor((s.time % 3600) / 60)}m played · ${fmt(s.bosses)} leaders beaten · ${fmt(s.kills)} enemy soldiers defeated</p>
      <p><button class="btn red" data-act="reset">Reset game</button></p>`;
  }

  el.panel.addEventListener('click', (e) => {
    const card = e.target.closest('[data-card]');
    if (card && !e.target.closest('[data-act]')) return openLeader(card.dataset.card);
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
    } else if (act === 'inc' || act === 'dec') {
      if (!b.hasAttribute('data-hold') || e.detail === 0) armyStep(b);
    } else if (act === 'recruit') {
      if (CW.recruit(b.dataset.id, st.buyMode === 'max' ? 'max' : st.buyMode)) SFX.play('buy');
      updatePanel();
    } else if (act === 'uaslot') openUAttr(b.dataset.id, +b.dataset.i);
    else if (act === 'council') openCouncil();
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
  // +/- buttons repeat while held, so a big army builds quickly
  function armyStep(b) {
    const id = b.dataset.id;
    const n = S().army[id] || 0;
    CW.setCount(id, n + (b.dataset.act === 'inc' ? 1 : -1));
    updatePanel();
  }
  let holdT = null;
  const stopHold = () => {
    clearTimeout(holdT);
    holdT = null;
  };
  el.panel.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-hold]');
    if (!b || b.disabled) return;
    SFX.ensure();
    armyStep(b);
    let gap = 320;
    const rep = () => {
      if (!b.isConnected || b.disabled) return stopHold();
      armyStep(b);
      gap = Math.max(45, gap * 0.8);
      holdT = setTimeout(rep, gap);
    };
    stopHold();
    holdT = setTimeout(rep, gap);
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => el.panel.addEventListener(ev, stopHold));
  el.panel.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'autobuild') {
      CW.setAuto('build', e.target.checked);
      renderPanel();
      return;
    }
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
    if (!el.sheet.hidden && e.key === 'Escape') return closeSheet();
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
      <p class="bio">Lead history's commanders through an endless war across time. Build an army from 56 unit types across 14 eras, equip their attributes, and watch every soldier fight it out. Beat each era's leaders to recruit them.</p>
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
    } else if (act === 'pickcmd') {
      picker = picker && picker.type === 'cmd' && picker.w === +b.dataset.w ? null : { type: 'cmd', w: +b.dataset.w };
      renderCouncil();
    } else if (act === 'equip') {
      if (CW.equip(b.dataset.id, +b.dataset.i, b.dataset.a || null)) SFX.play('buy');
      closeModal();
      renderPanel();
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

  // pick an attribute for one slot of a unit type; every soldier of that type gets it
  function openUAttr(id, slot) {
    const st = S();
    const u = UNIT[id];
    const eq = st.uattr[id] || [];
    const list = CW.unlockedUAttrs();
    const locked = CW.UATTRS.filter((a) => a.era > st.eraReached);
    showModal(
      'uattr',
      `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.unitURL(id)}" alt="" style="width:52px;height:52px"><div class="who"><h2>${esc(u.name)}</h2><small>Attribute slot ${slot + 1} of ${CW.uslots(id)} · every ${esc(u.name)} in your army gets it</small></div></div>
      <div class="chooser uachooser">${list
        .map((a) => {
          const at = eq.indexOf(a.id);
          const note = at === slot ? 'Equipped' : at >= 0 ? 'In slot ' + (at + 1) + ' (swaps)' : ERAS[a.era].name;
          return `<button class="pick ${at === slot ? 'sel' : ''}" data-act="equip" data-id="${id}" data-i="${slot}" data-a="${a.id}"><span><em>${esc(note)}</em><b>${esc(a.name)}</b><small class="hint">${esc(a.d)}</small></span></button>`;
        })
        .join('')}${eq[slot] ? `<button class="pick" data-act="equip" data-id="${id}" data-i="${slot}" data-a=""><span><em>Clear</em><b>Empty slot</b></span></button>` : ''}</div>
      ${locked.length ? `<p class="note">${locked.length} more unlock in later eras.</p>` : ''}
      <div class="acts"><button class="btn ghost" data-act="close">Close</button></div>`
    );
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
        return `<button class="pick ${sel ? 'sel' : ''}" data-act="pickcmd" data-w="${w}"><img class="px" src="${CW.headURL(id)}" alt=""><span><em>${cmdLabel[w]}</em><b>${esc(l.name)}</b><small class="hint">${esc(sk)}</small></span></button>`;
      })
      .join('');
    let chooser = '';
    if (picker && picker.type === 'cmd') {
      chooser = `<div class="chooser">${Object.keys(st.roster)
        .map((id) => {
          const l = LEADER[id];
          const rr = st.roster[id];
          return `<button class="pick" data-act="setlead" data-id="${id}" title="${esc(l.skills[0].n + ': ' + CW.attrText(id, 0))}"><img class="px por" src="${CW.headURL(id)}" alt=""><span><em>${picker.w === 0 ? esc(l.skills[0].n) : esc(l.skills[1].n)}</em><b>${esc(l.name)}</b></span></button>`;
        })
        .join('')}</div>`;
    }
    const cmdChooser = picker && picker.type === 'cmd' ? chooser : '';
    el.dlg.innerHTML = `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(c.lid)}" alt=""><div class="who"><h2>War Council</h2><small>${esc(lead)}</small></div></div>
      ${c.picks ? `<h3>Pick a doctrine${c.picks > 1 ? ' · ' + c.picks + ' left' : ''}</h3>${docs}` : ''}
      <h3>Leaders</h3><div class="cmdrow">${cmdRow}</div>${cmdChooser}
      <p class="note">Build your army any time in the Army tab.</p>
      <div class="acts">${c.picks ? '<button class="btn ghost" data-act="later">Decide later</button>' : '<button class="btn" data-act="close">Back to battle</button>'}</div>`;
  }

  function openLeader(id) {
    const st = S();
    const l = LEADER[id];
    const r = st.roster[id];
    const cl = CLASSES[l.cls];
    if (l.era === NERA && !r) {
      showModal('leader', `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(id, 'mystery')}" alt="" style="width:128px;height:128px"><div class="who"><h2>???</h2><small>A mystery from beyond the end of time</small></div></div><p class="bio">Someone, or something, waits where the timeline breaks. Finish the pathway all the way to the Future and keep going to find out who.</p><div class="acts"><button class="btn ghost" data-act="close">Close</button></div>`);
      return;
    }
    const role = id === st.main ? 'Your commander' : st.partners.includes(id) ? 'Your partner' : r ? 'In reserve' : l.starter ? 'Starter' : 'Not yet defeated · Stage ' + CW.bossStageOf(id);
    const labels = ['Signature · as commander', 'As commander or partner', 'As commander'];
    showModal(
      'leader',
      `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(id)}" alt="" style="width:128px;height:128px"><div class="who"><h2>${esc(l.name)}</h2><small>${esc(l.title)} · ${esc(l.yrs)}</small><small>${l.era === NERA ? 'Mystery · Shattered Time' : 'Era ' + ERAS[l.era].roman + ' · ' + ERAS[l.era].name} · ${esc(role)}</small>${r ? `<small>Level ${r.lv} ${stars(r.stars)}</small>` : ''}</div></div>
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
    toast(e.name + ': new units and attributes', 'blue');
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
        updateShortcuts();
        if (!el.sheet.hidden) updatePanel();
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
  // the base bodies load first, so every leader and soldier can be dressed before the first frame
  const start = (d) => CW.bodiesReady.then(() => boot(d));
  if (hot && hot.ready) hot.ready(start);
  else start((hot && hot.data) || {});
})();
