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
  const KIND = { barrage: 'Barrage', charge: 'Charge', snipe: 'Snipe', rally: 'Rally', fortify: 'Fortify', heal: 'Heal', revive: 'Revive', stun: 'Stun', terror: 'Terror', inferno: 'Inferno', tribute: 'Tribute', reinforce: 'Reinforce', execute: 'Execute', drain: 'Drain', shield: 'Shield' };
  const nfmt = (n) => Math.floor(n).toLocaleString('en-US');
  // each kind of special move has its own little pixel icon
  const kicon = (t, cls) => `<img class="ki${cls ? ' ' + cls : ''}" src="img/kinds/${t}.png" alt="">`;
  const pips = (lid) => '<span class="pips" title="Prestige ' + CW.prestige(lid) + ' of 2">' + [1, 2].map((i) => `<i class="${CW.prestige(lid) >= i ? 'on' : ''}"></i>`).join('') + '</span>';
  // a leader's three specials: the equipped one, the others they've unlocked, and what it takes to unlock the rest
  function specialRows(lid, mine) {
    const rank = CW.prestige(lid);
    const goals = CW.PRESTIGE[lid];
    return CW.specials(lid)
      .map((sp, i) => {
        const head = `<b>${kicon(sp.t)}${esc(sp.name)}</b><em>${KIND[sp.t]} · ${sp.cost}% meter</em><span>${esc(CW.specialText(sp))}</span>`;
        if (sp.unlocked) {
          const act = !mine ? '' : sp.equipped ? '<span class="eqd">Equipped</span>' : `<button class="btn ghost sm" data-act="eqsp" data-id="${lid}" data-i="${i}">Equip</button>`;
          return `<li class="${sp.equipped && mine ? 'on' : ''}"><div>${head}</div>${act}</li>`;
        }
        const g = goals[i - 1];
        const open = CW.prestigeUnlocked();
        const next = i - 1 === rank && open;
        const have = next ? Math.min(g[1], CW.statVal(lid, g[0])) : 0;
        const ready = next && mine && have >= g[1];
        const when = !open ? ' (opens after the main story)' : i - 1 === rank ? '' : ' (after prestige ' + (i - 1) + ')';
        const goal = `<small class="goal">Prestige ${i}: ${esc(CW.goalTextFor(g[0], g[1]))}${when}</small>` +
          (next ? `<span class="gbar"><i data-gbar="${lid}" style="width:${((100 * have) / g[1]).toFixed(1)}%"></i></span><small class="gnum" data-gnum="${lid}">${nfmt(have)} / ${nfmt(g[1])}</small>` : '');
        return `<li class="lock"><div>${head}${goal}</div>${ready ? `<button class="btn sm" data-act="prestige" data-id="${lid}">Prestige</button>` : '<span class="lk">Locked</span>'}</li>`;
      })
      .join('');
  }
  // live progress numbers for prestige goals already on screen
  function updateGoals(root) {
    root.querySelectorAll('[data-gnum]').forEach((n) => {
      const gl = CW.prestigeGoal(n.dataset.gnum);
      if (gl) setText(n, nfmt(gl.have) + ' / ' + nfmt(gl.n));
    });
    root.querySelectorAll('[data-gbar]').forEach((n) => {
      const gl = CW.prestigeGoal(n.dataset.gbar);
      if (gl) setW(n, gl.have / gl.n);
    });
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
        case 'blip': tone(700 + Math.random() * 260, 0.035, 'triangle', 0.012, 1.15); break;
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
  // The field is drawn on a 768x432 grid (2 device pixels per field unit), which matches the 2x-detail art.
  // The canvas takes the shape of the screen: the field sits at (OX, OY) inside it and the era scene carries on around it
  // (CW.scene in art.js), so the battle fills the screen upright or sideways. Upright, it zooms in a little.
  // The battle is seen from a raised, angled camera: far rows are smaller and higher up (CW.proj in art.js).
  const cv = $('#cv');
  const screenEl = $('#screen');
  const K = 2;
  let VW = FW * K;
  let VH = FH * K;
  let OX = 0;
  let OY = 0;
  cv.width = VW;
  cv.height = VH;
  const g = cv.getContext('2d', { alpha: false });
  function resize() {
    const r = screenEl.getBoundingClientRect();
    if (r.width < 10 || r.height < 10) return;
    // fit the 768x432 field into the screen above the dock (upright screens zoom in a little and crop the far sides),
    // then let the canvas cover the rest of the screen at the same scale
    const dock = document.getElementById('dock');
    const d = dock ? dock.getBoundingClientRect().height : 0;
    const z = r.width < r.height ? 1.18 : 1;
    const sc = Math.min((r.width * z) / (FW * K), Math.max(0.2, r.height - d * 0.8) / (FH * K));
    let vw = Math.min(Math.round(r.width / sc), FW * K * 2.4);
    let vh = Math.min(Math.round(r.height / sc), vw * 3);
    const ox = Math.round((vw - FW * K) / 2);
    const oy = Math.round((vh - (d / sc) * 0.8 - FH * K) / 2);
    vw -= vw % 2;
    vh -= vh % 2;
    if (vw !== VW || vh !== VH || ox !== OX || oy !== OY) {
      VW = cv.width = vw;
      VH = cv.height = vh;
      OX = ox;
      OY = oy;
      ground.width = VW;
      ground.height = VH;
      groundOf = null; // repaint the ground at the new size
      ambient.length = 0;
    }
    cv.style.imageRendering = r.width * (window.devicePixelRatio || 1) >= cv.width ? 'pixelated' : 'auto';
    // banners sit over the battle wherever it is on screen
    screenEl.style.setProperty('--bannerY', (((OY + 150) / VH) * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--dockH', Math.round(d) + 'px');
    placeHud();
  }
  // the battle panels sit just under the top bar, however many lines the era name takes
  function placeHud() {
    const tl = document.querySelector('.top .tl');
    const rs = document.querySelector('.top .res');
    if (!tl || !rs) return;
    const h = Math.max(tl.getBoundingClientRect().bottom, rs.getBoundingClientRect().bottom);
    const v = Math.round(h + 8) + 'px';
    if (placeHud._v !== v) document.documentElement.style.setProperty('--topH', (placeHud._v = v));
  }
  addEventListener('resize', () => resize());
  const ro = new ResizeObserver(() => resize());
  ro.observe(screenEl);
  ro.observe(document.getElementById('dock'));
  ro.observe(document.querySelector('.top .tl'));
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
  // a hand-made character plays its own moves at their own speeds: the special, its attack, a hit, walking, idling
  function customPose(q, B, t, C) {
    const R = C.rows;
    const fr = (name, time, loop) => {
      const r = R[name];
      const k = Math.floor(time * r[2]);
      return [name, loop ? k % r[1] : Math.min(r[1] - 1, k)];
    };
    if (q._sp !== undefined && q._sp < R.special[1] / R.special[2]) return fr('special', q._sp, false);
    if (B.phase === 'victory' && q.side === 'a') return fr('jump', t + q.id * 0.3, true);
    if (q._atk !== undefined && q._atk < R.attack[1] / R.attack[2]) return fr('attack', q._atk, false);
    if (q.flash > 0.45) return ['hit', 1];
    if (stepping(B, q)) return fr(q.speed > 26 ? 'run' : 'walk', t + q.id * 0.37, true);
    return fr('idle', t + q.id * 0.21, true);
  }
  function pose(q, B, t, kind, who) {
    if (kind === 'L' && CW.hasCustom(who)) return customPose(q, B, t, CW.CUSTOM[who]);
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
  const vehOf = (q) => q._vh === undefined ? (q._vh = q.kind === 'unit' && !bodyOf(q) && CW.hasVehicle(q.uid)) : q._vh;
  const vehK = (q) => 1 + ((UNIT[q.uid].size || 1) - 1) * 0.6;
  // a vehicle, animal or rider's current frame: moving, firing or standing
  function vehFrame(q, B, t) {
    let an = 'idle';
    let i = 0;
    if (q._atk !== undefined && q._atk < ATK_T * 0.6) an = 'fire';
    else if (stepping(B, q) || q.air) {
      an = 'move';
      i = Math.floor(t * 9 + q.id) % 4;
    }
    return CW.vehicleFrame(q.uid, q.side, an, i, q.face < 0);
  }

  // ---- per-battle ground: the field plus everything that has fallen on it (bodies, wrecks, scorch marks)
  const ground = document.createElement('canvas');
  ground.width = VW;
  ground.height = VH;
  const gg = ground.getContext('2d');
  let groundOf = null;
  let sceneEra = -1;
  let sceneNight = false;
  const ents = new Map();
  function newBattle(B) {
    groundOf = B;
    gg.setTransform(1, 0, 0, 1, 0, 0);
    gg.imageSmoothingEnabled = false;
    gg.globalAlpha = 1;
    gg.drawImage(CW.scene(B.info.era, VW, VH, OX, OY), 0, 0);
    gg.setTransform(1, 0, 0, 1, OX, OY); // bodies and scorch marks are baked in field pixels
    sceneEra = B.info.era;
    sceneNight = CW.sceneInfo(B.info.era).night;
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
    } else if (q.kind === 'unit' && vehOf(q)) {
      const f = CW.vehicleFrame(q.uid, q.side, 'idle', 0, q.face < 0);
      if (!f) return;
      const v = sizedBody(f, P.s * BODY_K * vehK(q));
      // vehicles leave a dark wreck where they stood (fliers crash where they fell)
      const wreck = v._wreck || (v._wreck = CW.tinted(v, '#2a221e'));
      gg.globalAlpha = 0.55;
      gg.drawImage(wreck, Math.round(P.x * K - v.width / 2), Math.round(P.y * K - v.height + 2));
      gg.globalAlpha = 1;
      return;
    } else if (q.kind === 'unit') img = sized(unitImg(q).c, unitScale(q, P.s));
    else if (CW.hasCustom(q.lid)) {
      const C = CW.CUSTOM[q.lid];
      const ds = q.isBoss ? 2 : 1;
      const f = CW.leaderFrame(q.lid, q.side, '', 'ko', C.rows.ko[1] - 1, q.side === 'e');
      if (!f) return;
      const v = sized(f, ds);
      gg.globalAlpha = 0.8;
      gg.drawImage(v, Math.round(P.x * K - (q.side === 'e' ? C.cx : C.cell[0] - C.cx) * ds), Math.round(P.y * K - C.ground * ds));
      gg.globalAlpha = 1;
      return;
    } else {
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
    if (vehOf(q)) return { x: P.x, y: P.y - (q.air ? 30 : 12) * P.s, s: P.s };
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
        if (!e.champ) toast(short(e.lid) + ' is down', 'red');
      } else if (e.k === 'special') {
        showSpecial(e, B);
        const C = CW.CUSTOM[e.lid];
        if (C && CW.SPECIALS[e.lid][C.special || 0][0] === e.name) {
          const who = (e.side === 'a' ? B.a : B.e).find((q) => (q.isHero || q.isBoss) && q.lid === e.lid);
          if (who) who._sp = 0;
        }
      }
    }
    B.fx.length = 0;
  }

  // a special move: its name across the field, a flash in its colour, and effects on whoever it touches
  const SP_COL = { barrage: '#ffd23f', charge: '#ffb060', snipe: '#ff5a4a', rally: '#ffd23f', fortify: '#9ad8ff', heal: '#7dffb0', revive: '#7dffb0', stun: '#fff6a0', terror: '#b070ff', inferno: '#ff7a3a', tribute: '#ffd23f', reinforce: '#ffffff', execute: '#ff5a4a', drain: '#c070ff', shield: '#9ad8ff' };
  const ON_FOES = new Set(['barrage', 'charge', 'snipe', 'stun', 'inferno', 'terror', 'execute', 'drain']);
  let sbT = 0;
  function showSpecial(e, B) {
    const ally = e.side === 'a';
    setText(hud.sbT, e.name);
    setText(hud.sbS, ally ? LEADER[e.lid].name : 'Enemy ' + short(e.lid));
    setClass(hud.sb, 'sbanner on' + (ally ? '' : ' foe'));
    sbT = 1.8;
    flashT = 0.9;
    flashCol = SP_COL[e.t] || '#ffffff';
    SFX.play(ally ? 'cast' : 'bosscast');
    const targets = (ON_FOES.has(e.t) ? (ally ? B.e : B.a) : ally ? B.a : B.e).filter((q) => q.alive);
    for (let i = 0; i < Math.min(28, targets.length); i++) {
      const q = targets[Math.floor(Math.random() * targets.length)];
      const c = chest(q);
      if (ON_FOES.has(e.t)) boom(c.x, c.y, (e.t === 'snipe' ? 14 : 7) * c.s, SP_COL[e.t]);
      else burst(c.x, c.y, 3, SP_COL[e.t], 'up');
    }
    if (e.t === 'barrage' || e.t === 'charge' || e.t === 'snipe') shake = Math.max(shake, 0.35);
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
    if (q._sp !== undefined) q._sp += dt;
    if (!q.alive) q._ko = (q._ko || 0) + dt;
    else if (q._ko) q._ko = 0;
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
      const ring = ringOf(Math.round(w * K), q.isBoss ? '#e0675a' : q.main ? '#e0be6a' : q.champ ? '#b9a0d6' : '#86b4d3');
      g.globalAlpha = 0.75;
      blit(ring, P.x - ring.width / (2 * K), P.y - ring.height / (2 * K));
      g.globalAlpha = 1;
    } else if (bodyOf(q)) w = 13 * P.s;
    else if (vehOf(q)) w = (CW.VSIZE[UNIT[q.uid].sp.k] || [40])[0] * 0.36 * vehK(q) * P.s;
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
    if (vehOf(q)) {
      const f = vehFrame(q, B, t);
      if (f) {
        const img = sizedBody(f, P.s * BODY_K * vehK(q));
        const k = img.width / f.width;
        const bob = q.air ? -24 * P.s + Math.sin(t * 3 + q.id) * 1.2 : 0;
        const lx = q.lunge > 0 ? Math.sin(Math.min(1, q.lunge) * Math.PI) * (q.proj ? -0.8 : 2.5) * P.s * q.face : 0;
        const x = P.x - (f.width / 2 / K) * k + lx;
        const y = P.y - ((f.height - 2) / K) * k + bob + 0.5;
        blit(img, x, y);
        if (q.flash > 0.05) {
          g.globalAlpha = q.flash * 0.8;
          blit(whiteOf(img), x, y);
          g.globalAlpha = 1;
        }
        if (q.stun > 0) stunStars(P.x, y + 2, t, 6 * P.s);
        if (q.burn && (q.id + Math.floor(t * 10)) % 3 === 0) R(P.x - 2 + Math.random() * 4, y + (img.height / K) * 0.4 - Math.random() * 3, 1, 1, '#ff9a3a');
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
    const C = CW.hasCustom(q.lid) ? CW.CUSTOM[q.lid] : null;
    let [an, fi] = q.alive ? pose(q, B, t, 'L', q.lid) : C ? ['ko', Math.min(C.rows.ko[1] - 1, Math.floor((q._ko || 0) * C.rows.ko[2]))] : ['idle', 0];
    const f = CW.leaderFrame(q.lid, q.side, variant, an, fi, flip);
    if (!f) return;
    const img = sized(f, ds);
    const W = img.width / K;
    const H = img.height / K;
    const x0 = C ? P.x - ((flip ? C.cx : C.cell[0] - C.cx) / K) * ds : P.x - W / 2;
    const y0 = C ? P.y - (C.ground / K) * ds : P.y - (H * (f.height - 2)) / f.height;
    if (!q.alive && C) {
      // hand-made characters fall with their own KO animation
      g.globalAlpha = 0.9;
      blit(img, x0, y0 + 0.5);
      g.globalAlpha = 1;
      if (q.side === 'a') text('DOWN', P.x, y0 + ((C.head - 6) / K) * ds, '#ff8a7a', 1, 'c');
      return;
    }
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
    if (!isBoss) hpBar(q, P.x - 9, P.y + 1.5, 18, q.main ? '#ffd23f' : q.champ ? '#c9a8ff' : '#5ad1ff');
    if (q.stun > 0) stunStars(P.x, C ? y + ((C.head - 2) / K) * ds : y + 2, t, 7);
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
    bossSp: $('#hudBossSp'), sb: $('#sbanner'), sbT: $('#sbT'), sbS: $('#sbS'),
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
      setText(hud.bossName, hidden ? '???' : (info.twist ? CW.TWIST_NAME[info.twist] + ' ' : '') + short(B.boss.lid));
      setW(hud.bossHp, B.boss.hpS === undefined ? 1 : B.boss.hpS);
      setText(hud.time, Math.max(0, Math.ceil(B.bossT)) + 's');
      setClass(hud.time, B.bossT < 10 ? 'low' : '');
      setW(hud.bossT, B.bossT / B.bossTMax);
      setW(hud.bossSp, (B.bossMeter || 0) / 100);
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

  // ---- the living scene: clouds and birds by day, stars by night, snow, embers, fireflies, dust or neon rain by era.
  // Most of it lives in the sky, the foreground and out to the sides; over the battle itself it is faint and sparse.
  const ambient = [];
  function ambientKind() {
    const d = ERAS[sceneEra] ? ERAS[sceneEra].decor : 'grass';
    if (d === 'snow') return 'snow';
    if (d === 'crater') return 'ember';
    if (d === 'neon') return 'rain';
    if (d === 'crystal') return 'mote';
    if (d === 'rock') return sceneNight ? 'firefly' : 'dust';
    return sceneNight ? 'firefly' : 'pollen';
  }
  function drawAmbient(dt, t, back) {
    if (sceneEra < 0) return;
    const x0 = -OX / K;
    const x1 = (VW - OX) / K;
    const y0 = -OY / K;
    const y1 = (VH - OY) / K;
    const w = x1 - x0;
    const h = y1 - y0;
    const kind = ambientKind();
    if (back) {
      // sky life behind everything: drifting clouds or birds by day, twinkles and the odd shooting star at night
      const skyB = 96;
      if (sceneNight) {
        for (let i = 0; i < 14; i++) {
          const x = x0 + ((i * 97.3) % w);
          const y = y0 + ((i * 53.7) % Math.max(10, skyB - y0 - 10));
          if (Math.sin(t * 2.2 + i * 1.7) > 0.6) R(x, y, 1, 1, '#ffffff');
        }
        const sp = (t * 0.12) % 1;
        if (sp < 0.12) {
          const k = sp / 0.12;
          const sx = x0 + w * (0.15 + 0.6 * ((Math.floor(t * 0.12) * 0.37) % 1)) + k * 60;
          const sy = y0 + 10 + k * 22;
          g.globalAlpha = 1 - k;
          R(sx, sy, 3, 1, '#ffffff');
          R(sx - 4, sy - 1, 4, 1, 'rgba(255,255,255,.5)');
          g.globalAlpha = 1;
        }
      } else if (kind !== 'rain') {
        for (let i = 0; i < 3; i++) {
          // a small flock crossing the sky, wings flapping
          const span = w + 80;
          const x = x0 - 40 + ((t * (7 + i * 2) + i * 157) % span);
          const y = y0 + Math.max(8, (skyB - y0) * (0.25 + i * 0.18)) + Math.sin(t * 0.8 + i) * 3;
          const up = Math.floor(t * 6 + i) % 2;
          for (let b = 0; b < 3; b++) {
            const bx = x - b * 6;
            const by = y + (b % 2) * 3;
            R(bx - 2, by - up, 2, 1, '#2a2a33');
            R(bx, by, 1, 1, '#2a2a33');
            R(bx + 1, by - up, 2, 1, '#2a2a33');
          }
        }
      }
      return;
    }
    // particles over everything: few over the battle band, more around it
    const want = Math.round(Math.min(70, 18 + (w * h) / 900));
    while (ambient.length < want) ambient.push({ x: x0 + Math.random() * w, y: y0 + Math.random() * h, s: Math.random(), p: Math.random() * 6 });
    for (const a of ambient) {
      if (kind === 'snow') {
        a.y += (8 + a.s * 10) * dt;
        a.x += Math.sin(t + a.p) * 4 * dt;
      } else if (kind === 'ember') {
        a.y -= (6 + a.s * 8) * dt;
        a.x += (2 + Math.sin(t * 1.3 + a.p) * 3) * dt;
      } else if (kind === 'rain') {
        a.y += (70 + a.s * 50) * dt;
        a.x -= 10 * dt;
      } else if (kind === 'dust') {
        a.x += (8 + a.s * 8) * dt;
        a.y += Math.sin(t + a.p) * 2 * dt;
      } else {
        a.x += Math.sin(t * 0.7 + a.p) * 5 * dt;
        a.y += Math.cos(t * 0.6 + a.p) * 3 * dt - 1.5 * dt;
      }
      if (a.y > y1 + 4) a.y = y0 - 2;
      if (a.y < y0 - 4) a.y = y1 + 2;
      if (a.x > x1 + 4) a.x = x0 - 2;
      if (a.x < x0 - 4) a.x = x1 + 2;
      const inBand = a.y > 92 && a.y < 212 && a.x > 0 && a.x < FW;
      let al = inBand ? 0.3 : 0.85;
      let col = '#ffffff';
      let sz = 1;
      if (kind === 'snow') col = '#f4f8ff';
      else if (kind === 'ember') col = a.s > 0.5 ? '#ffb060' : '#ff7a3a';
      else if (kind === 'rain') col = a.s > 0.5 ? '#2ee6ff' : '#ff3cac';
      else if (kind === 'dust') col = '#f0dcae';
      else if (kind === 'mote') col = a.s > 0.5 ? '#9ff0ff' : '#d0a8ff';
      else if (kind === 'firefly') {
        col = '#f4ff8a';
        al *= 0.5 + 0.5 * Math.sin(t * 3 + a.p * 5);
      } else col = '#fff6c8';
      if (!inBand && a.s > 0.7 && kind !== 'rain') sz = 2;
      g.globalAlpha = al;
      if (kind === 'rain') R(a.x, a.y, 1, 4, col);
      else R(a.x, a.y, sz, sz, col);
    }
    g.globalAlpha = 1;
  }

  const order = [];
  const byDepth = (a, b) => (a.air ? 1000 : 0) + a.z - ((b.air ? 1000 : 0) + b.z);
  function render(dt, t) {
    const B = CW.battle();
    const st = S();
    if (!B || !st) return;
    if (B !== groundOf) newBattle(B);
    if (ents.size < B.ents.length) for (const q of B.ents) ents.set(q.id, q);
    if (sbT > 0) {
      sbT -= dt;
      if (sbT <= 0) setClass(hud.sb, 'sbanner');
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    g.drawImage(ground, 0, 0);
    g.setTransform(K, 0, 0, K, OX, OY);
    drawAmbient(dt, t, true);
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
    drawAmbient(dt, t, false);
    drawHud(B, st);
    if (flashT > 0) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = Math.min(0.3, flashT * 0.3);
      g.fillStyle = flashCol;
      g.fillRect(0, 0, VW, VH);
      g.globalAlpha = 1;
      g.setTransform(K, 0, 0, K, OX, OY);
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
    const x = (((e.clientX - r.left) / r.width) * VW - OX) / K;
    const y = (((e.clientY - r.top) / r.height) * VH - OY) / K;
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
    deck: $('#deck'), panel: $('#panel'), sheet: $('#sheet'), sheetTitle: $('#sheetTitle'), shortcuts: $('#shortcuts'), modal: $('#modal'), dlg: $('#dlg'),
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
    setText(el.era, info.chaos ? 'Broken timeline · ' + info.timeline.map((e) => ERAS[e].name.replace(' Age', '')).join(' × ') : 'Era ' + era.roman + ' · ' + era.name);
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
    const sig = [st.main, st.partners.join(','), [st.main].concat(st.partners).map((id) => st.roster[id].lv + ':' + st.roster[id].stars + ':' + CW.equippedIndex(id)).join(',')].join('|');
    if (sig !== deckSig) renderDeck();
  }

  function renderDeck() {
    const st = S();
    deckSig = [st.main, st.partners.join(','), [st.main].concat(st.partners).map((id) => st.roster[id].lv + ':' + st.roster[id].stars + ':' + CW.equippedIndex(id)).join(',')].join('|');
    deckEls = null;
    el.deck.innerHTML = [st.main, st.partners[0], st.partners[1]]
      .filter(Boolean)
      .map((lid, i) => `<button class="chip ${i === 0 ? 'main' : ''}" data-card="${lid}" title="${esc(LEADER[lid].name)}: tap for their special"><img class="px" src="${CW.headURL(lid)}" alt="">${kicon(CW.special(lid).t, 'cki').replace('class="ki cki"', 'class="cki"')}<span><span class="cn">${esc(short(lid))}</span><span class="hp${i === 0 ? ' main' : ''}"><i data-hp="${lid}"></i></span><span class="spm"><i data-sp="${lid}"></i></span></span></button>`)
      .join('');
    if (!el.sheet.hidden && tab === 'command') renderPanel();
  }
  // the Commanders sheet: full cards with each leader's attributes
  function renderCommand() {
    const st = S();
    const spare = Object.keys(st.roster).length > [st.main].concat(st.partners).filter(Boolean).length;
    const card = (lid, i) => {
      if (!lid) return `<div class="partner box"><div class="who"><b>Open slot</b><small>${spare ? 'Pick one of your leaders as a partner' : 'Win leader battles to recruit partners'}</small>${spare ? `<button class="swapb" data-act="swap" data-w="${i}">Choose a partner</button>` : ''}</div></div>`;
      const L = LEADER[lid];
      const r = st.roster[lid];
      const main = i === 0;
      const cl = CLASSES[L.cls];
      const pos = CW.leaderPos(lid);
      const pref = CW.prefPos(lid);
      const pb = (v, label) => `<button data-act="pos" data-id="${lid}" data-pos="${v}" aria-pressed="${pos === v}">${label}${pref === v ? '<span class="fit">★</span>' : ''}</button>`;
      return `<div class="${main ? 'lead' : 'partner'} box" data-card="${lid}"><img class="px" src="${CW.portraitURL(lid)}" alt=""><div class="who"><b>${esc(L.name)} ${pips(lid)}</b><small>${main ? `<span title="${esc(cl.d)}">${esc(cl.name)}</span>` : 'Partner'} · <span class="nw">Lv ${r.lv}</span> ${stars(r.stars)}</small>${spare ? `<button class="swapb" data-act="swap" data-w="${i}">Swap ${main ? 'commander' : 'partner'}</button>` : ''}</div>
        <div class="pos" role="group" aria-label="Where ${esc(short(lid))} fights">${pb('front', 'Front lines')}${pb('back', 'Behind the army')}</div>
        <p class="excel">${esc(CW.posText(lid))}</p>
        <ul class="attrs">${attrRows(lid, main ? [0, 1, 2] : [1], CW.attrStrength(lid, main ? 'main' : 'partner'))}</ul>
        <ul class="sps2">${specialRows(lid, true)}</ul></div>`;
    };
    return `<div class="phead"><h2>Team</h2></div>
      <div class="cards">${card(st.main, 0)}${card(st.partners[0], 1)}${card(st.partners[1], 2)}</div>
      <p class="note">Your commander brings all three attributes and a class bonus; each partner brings one. Swap in any leader you have recruited: they step onto the battlefield right away. ★ marks where a leader excels; positions apply from the next battle. Each leader equips one special at a time; their meter fills as your soldiers defeat enemies. ${CW.prestigeUnlocked() ? 'Prestige a leader by meeting their goal to unlock their next special (+25% strength on the field and +20% attributes each time).' : 'Leader prestige opens once the main story is over (finish the Galactic Age): then each leader can unlock two more specials by meeting their own goals.'}</p>`;
  }
  let deckEls = null;
  function updateDeck() {
    const B = CW.battle();
    if (!B) return;
    if (!deckEls) {
      deckEls = {
        cards: Array.from(el.deck.querySelectorAll('[data-card]')).map((c) => ({ c, lid: c.dataset.card })),
        hps: Array.from(el.deck.querySelectorAll('[data-hp]')).map((i) => ({ i, lid: i.dataset.hp })),
        sps: Array.from(el.deck.querySelectorAll('[data-sp]')).map((i) => ({ i, lid: i.dataset.sp })),
      };
    }
    for (const m of deckEls.sps) {
      const v = CW.meter(m.lid);
      const cost = CW.special(m.lid).cost;
      setW(m.i, Math.min(1, v / cost));
      const c = m.i.closest('.chip');
      const gl = CW.prestigeGoal(m.lid);
      const st = (v >= cost ? 'ready' : v >= cost * 0.6 ? 'half' : '') + (gl && gl.done ? ' pre' : '');
      if (c._st !== st) {
        c.classList.remove('ready', 'half', 'pre');
        st.split(' ').filter(Boolean).forEach((k) => c.classList.add(k));
        c._st = st;
      }
    }
    if (spLid && !el.spop.hidden) updateSpecials();
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
    if (!c) return;
    SFX.ensure();
    if (spLid === c.dataset.card && !el.spop.hidden) closeSpecials();
    else openSpecials(c.dataset.card, c);
  });
  // ---- a leader's special: use the equipped one, swap to another unlocked one, or see what unlocks the rest
  el.spop = $('#spop');
  let spLid = null;
  let spChip = null;
  function openSpecials(lid, chip) {
    // the chips are rebuilt when a leader prestiges, so find this leader's current chip
    if (!chip || !chip.isConnected) chip = el.deck.querySelector(`[data-card="${lid}"]`) || el.deck;
    spLid = lid;
    spChip = chip;
    const sp = CW.special(lid);
    const all = CW.specials(lid);
    const gl = CW.prestigeGoal(lid);
    const others = all.filter((x) => x.unlocked && !x.equipped);
    const locked = all.filter((x) => !x.unlocked);
    el.spop.innerHTML = `<h4><span>${esc(LEADER[lid].name)} ${pips(lid)}</span><span data-spv></span></h4><div class="m"><i data-spm></i></div>
      <button class="spb" data-use><b><i class="kn">${kicon(sp.t)}${esc(sp.name)}</i><span>${KIND[sp.t]} · ${sp.cost}%</span></b><small>${esc(CW.specialText(sp))}</small></button>
      ${others.map((x) => `<button class="spe" data-eq="${x.i}"><span>${kicon(x.t)}Equip <b>${esc(x.name)}</b></span><em>${KIND[x.t]} · ${x.cost}%</em></button>`).join('')}
      ${locked.length ? (gl && gl.locked ? `<div class="splock"><span>Prestige opens after the main story: finish the Galactic Age. Then <b>${esc(locked[0].name)}</b> unlocks when ${esc(LEADER[lid].name)} meets their goal: ${esc(CW.goalText(gl).charAt(0).toLowerCase() + CW.goalText(gl).slice(1))}.</span></div>` : `<div class="splock">${gl ? `<span>Prestige ${gl.rank} unlocks ${kicon(locked[0].t)}<b>${esc(locked[0].name)}</b>: ${esc(CW.goalText(gl))}</span><span class="gbar"><i data-gbar="${lid}" style="width:${((100 * gl.have) / gl.n).toFixed(1)}%"></i></span><small class="gnum" data-gnum="${lid}">${nfmt(gl.have)} / ${nfmt(gl.n)}</small>` : ''}${gl && gl.done ? `<button class="btn sm" data-pre>Prestige now</button>` : ''}</div>`) : '<p class="splock done">All three specials unlocked</p>'}
      <button class="more" data-more>Leader details</button>`;
    el.spop.hidden = false;
    if (gCur) {
      guideEl.hidden = true;
      unlight();
    }
    const r = chip.getBoundingClientRect();
    const w = el.spop.offsetWidth;
    el.spop.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left)) + 'px';
    el.spop.style.bottom = Math.max(12, innerHeight - r.top + 8) + 'px';
    el.spop.style.top = 'auto';
    updateSpecials();
  }
  function updateSpecials() {
    const v = CW.meter(spLid);
    const B = CW.battle();
    const live = B && B.phase === 'fight' && CW.heroAlive(spLid);
    const sp = CW.special(spLid);
    setText(el.spop.querySelector('[data-spv]'), Math.floor(v) + '%');
    setW(el.spop.querySelector('[data-spm]'), v / 100);
    const b = el.spop.querySelector('[data-use]');
    const dis = !live || v < sp.cost;
    if (b && b.disabled !== dis) b.disabled = dis;
    updateGoals(el.spop);
  }
  function closeSpecials() {
    el.spop.hidden = true;
    spLid = null;
  }
  el.spop.addEventListener('click', (e) => {
    const lid = spLid;
    if (!lid) return;
    if (e.target.closest('[data-use]')) {
      if (CW.useSpecial(lid)) closeSpecials();
      return;
    }
    const eq = e.target.closest('[data-eq]');
    if (eq) {
      CW.equipSpecial(lid, +eq.dataset.eq);
      SFX.play('buy');
      openSpecials(lid, spChip);
      return;
    }
    if (e.target.closest('[data-pre]')) {
      CW.doPrestige(lid);
      openSpecials(lid, spChip);
      return;
    }
    if (e.target.closest('[data-more]')) {
      closeSpecials();
      openLeader(lid);
    }
  });
  document.addEventListener('pointerdown', (e) => {
    if (!el.spop.hidden && !e.target.closest('#spop') && !e.target.closest('.chip')) closeSpecials();
  });

  el.challenge.addEventListener('click', () => {
    SFX.ensure();
    CW.challenge();
  });
  el.council.addEventListener('click', () => openCouncil());
  function syncControls() {
    if (!el.sheet.hidden && tab === 'options') renderPanel();
  }

  // ------------------------------------------------------------ panels
  const TITLES = { army: 'Army', command: 'Team', leaders: 'Codex', doctrines: 'Doctrines', rift: 'Time Rift', options: 'Settings', guide: 'Guide' };
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
  $('#btnGuide').addEventListener('click', () => {
    SFX.ensure();
    if (!el.sheet.hidden && tab === 'guide') closeSheet();
    else openSheet('guide');
  });
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
    setText(scEls.options, st.sound ? 'Sound on' : 'Sound off');
    const alertD = !!(st.council && st.council.picks);
    const b = el.shortcuts.querySelector('[data-sc="doctrines"]');
    if (b._a !== alertD) b.classList.toggle('alert', (b._a = alertD));
    // a dot on Team or Codex when a leader can prestige
    const cmd = [st.main].concat(st.partners);
    let teamP = false;
    let anyP = false;
    for (const id in st.roster) {
      const gl = CW.prestigeGoal(id);
      if (gl && gl.done) {
        anyP = true;
        if (cmd.includes(id)) teamP = true;
      }
    }
    const bt = el.shortcuts.querySelector('[data-sc="command"]');
    if (bt._a !== teamP) bt.classList.toggle('alert', (bt._a = teamP));
    const bc = el.shortcuts.querySelector('[data-sc="leaders"]');
    if (bc._a !== anyP) bc.classList.toggle('alert', (bc._a = anyP));
  }

  function panelSig() {
    const st = S();
    const base = [tab, st.main, st.partners.join(',')];
    if (tab === 'army') {
      const ids = ownedList();
      base.push(ids.join(','), st.eraReached, st.buyMode, JSON.stringify(st.uattr), ids.map((id) => CW.uslots(id)).join(''));
      base.push((st.champs || []).join(','), CW.champSlots(), CW.champMax(), st.best > CW.PATH_LEN);
    }
    const presSig = () => JSON.stringify(st.prest) + JSON.stringify(st.spEq) + CW.prestigeUnlocked();
    if (tab === 'leaders') base.push(Object.entries(st.roster).map(([k, r]) => k + r.stars).join(','), presSig());
    if (tab === 'command') base.push(deckSig, !!st.council, JSON.stringify(st.pos), presSig(), [st.main].concat(st.partners).map((id) => { const gl = CW.prestigeGoal(id); return gl && gl.done ? 1 : 0; }).join(''));
    if (tab === 'doctrines') base.push(JSON.stringify(st.doctrines), !!st.council);
    if (tab === 'rift') base.push(st.runMax, Math.floor(Math.log10(st.shards + 1) * 20));
    if (tab === 'options') base.push(st.sound, st.auto.push, st.auto.special, st.guide && st.guide.on, st.guide && st.guide.chat);
    if (tab === 'guide') base.push(Object.keys(st.guide.seen).length, st.guide.on);
    return base.join('|');
  }

  function renderPanel() {
    lastSig = panelSig();
    const f = { army: renderArmy, command: renderCommand, leaders: renderLeaders, doctrines: renderDoctrines, rift: renderRift, options: renderOptions, guide: renderGuide }[tab];
    el.panel.innerHTML = f();
    if (tab === 'leaders' && cxQuery) filterCodex();
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
      el.panel.querySelectorAll('[data-champ]').forEach((s) => {
        const c = CW.champStats(s.dataset.champ);
        setText(s, 'Lv ' + st.roster[s.dataset.champ].lv + ' · DMG ' + fmt(c.atk) + ' · HP ' + fmt(c.hp));
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
    if (tab === 'command') updateGoals(el.panel);
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
      ${renderRanks()}
      <div class="ugrid">${own.map(card).join('')}</div>
      ${fresh.length ? `<div class="sub">Recruit from the ${esc(ERAS[topEra].name)}</div><div class="ugrid">${fresh.map(card).join('')}</div>` : ''}
      ${older.length ? `<details class="reserve" ${reserveOpen ? 'open' : ''}><summary>Older units · ${older.length}</summary><div class="ugrid">${older.map(card).join('')}</div></details>` : ''}`;
  }

  // leaders in the ranks: after the endgame, recruited leaders can take soldiers' places on the front line
  function champLine(id) {
    const at = CW.attr(id, 0);
    return `${esc(at.name)}: ${esc(CW.attrText(id, 0, CW.champAttrK(id)))}`;
  }
  function champRole(id) {
    return CW.champFighter(id) ? 'Fighter · hits hard, lasts long' : 'Thinker · brings more of their attribute';
  }
  function renderRanks() {
    const st = S();
    if (!CW.champUnlocked()) {
      return `<div class="ranks locked"><div class="rk-h"><h3>Leaders in the ranks</h3><span class="tag">Shattered Time</span></div><p class="note">Finish the time pathway (through the Galactic Age) to swap soldiers for your recruited leaders on the front line.</p></div>`;
    }
    const slots = CW.champSlots();
    const max = CW.champMax();
    const on = CW.champs();
    const cost = CW.champCost();
    const next = CW.champNextSlot();
    let cells = '';
    for (let i = 0; i < slots; i++) {
      const id = on[i];
      if (id) {
        const l = LEADER[id];
        const r = st.roster[id];
        cells += `<div class="rk"><img class="px" src="${CW.headURL(id)}" alt=""><div class="rk-b"><b>${esc(l.name)} ${stars(r.stars)}</b><small>${esc(CLASSES[l.cls].name)} · ${champRole(id)}</small><small class="at">${champLine(id)}</small><small class="st" data-champ="${id}"></small></div><button class="sq rm" data-act="rmchamp" data-id="${id}" aria-label="Send ${esc(l.name)} back to reserve">×</button></div>`;
      } else if (i < max) cells += `<button class="rk add" data-act="champ"><b>+ Add a leader</b><small>Takes ${cost} capacity from your soldiers</small></button>`;
      else cells += `<div class="rk lock"><b>Slot ${i + 1}</b><small>Needs ${(i + 1) * cost * 2} army capacity</small></div>`;
    }
    const waiting = (st.champs || []).length - on.length;
    return `<div class="ranks"><div class="rk-h"><h3>Leaders in the ranks</h3><span>${on.length} of ${slots} · ${cost} capacity each</span></div>
      <p class="note">Swap soldiers for recruited leaders. They fight on the front line and each one gives your army a share of their signature attribute while standing.${next ? ` Next slot at stage ${next}.` : ''}${waiting > 0 ? ` ${waiting} more wait${waiting === 1 ? 's' : ''} for capacity.` : ''}</p>
      <div class="rkgrid">${cells}</div></div>`;
  }
  function openRanks() {
    const st = S();
    const cmd = [st.main].concat(st.partners);
    const on = CW.champs();
    const list = Object.keys(st.roster)
      .filter((id) => !cmd.includes(id) && !on.includes(id))
      .sort((a, b) => st.roster[b].stars - st.roster[a].stars || LEADER[b].era - LEADER[a].era);
    showModal(
      'ranks',
      `<div class="who"><h2>Add a leader to the ranks</h2><small>They take ${CW.champCost()} capacity and fight on the front line. Fighters (warriors, conquerors, revolutionaries, defenders) hit harder and last longer; thinkers bring 50% more of their signature attribute.</small></div>
      ${list.length ? `<div class="chooser rkchooser">${list
        .map((id) => {
          const l = LEADER[id];
          return `<button class="pick" data-act="addchamp" data-id="${id}"><img class="px por" src="${CW.headURL(id)}" alt=""><span><em>${esc(CLASSES[l.cls].name)} · ${CW.champFighter(id) ? 'Fighter' : 'Thinker'}${st.roster[id].stars ? ' · ' + '★'.repeat(st.roster[id].stars) : ''}</em><b>${esc(l.name)}</b><small class="hint">${champLine(id)}</small></span></button>`;
        })
        .join('')}</div>` : '<p class="note">Every leader you have is already commanding or in the ranks. Beat more leaders to recruit them.</p>'}
      <div class="acts"><button class="btn ghost" data-act="close">Close</button></div>`
    );
  }

  // the Codex: every leader in the game, searchable, with their specials and prestige
  let cxQuery = '';
  function renderLeaders() {
    const st = S();
    const own = Object.keys(st.roster).length;
    const reach = st.best > CW.PATH_LEN ? NERA : st.eraReached;
    let h = `<div class="phead"><h2>Codex</h2></div>
      <div class="cxtop"><input type="search" data-cx placeholder="Search your leaders" aria-label="Search the codex" value="${esc(cxQuery)}"><span>${own} of ${LEADERS.length} found</span></div>
      <p class="note">Every leader you have beaten is here. Tap one to see their skills, their special moves and what it takes to prestige them${CW.prestigeUnlocked() ? '' : ' (prestige opens once the main story is over)'}. Win leader battles to find the rest.</p>`;
    for (let e = 0; e <= NERA; e++) {
      const ls = LEADERS.filter((l) => l.era === e);
      if (!ls.length) continue;
      const got = ls.filter((l) => st.roster[l.id]);
      // eras you haven't reached stay a secret
      if (e > reach && !got.length) continue;
      const left = ls.length - got.length;
      h += `<div class="cxera"><div class="erahead">${e < NERA ? esc(ERAS[e].roman + ' · ' + ERAS[e].name) : 'Mysteries · Shattered Time'}<span>${got.length} / ${ls.length}</span></div><div class="cxlist">${got
        .map((l) => {
          const r = st.roster[l.id];
          const sp = CW.special(l.id);
          const gl = CW.prestigeGoal(l.id);
          const cls = l.id === st.main ? 'main' : st.partners.includes(l.id) ? 'mine' : '';
          const hay = [l.name, l.title, CLASSES[l.cls].name, ERAS[Math.min(l.era, NERA - 1)].name].concat([0, 1, 2].map((i) => CW.attr(l.id, i).name), CW.SPECIALS[l.id].map((x) => x[0])).join(' ').toLowerCase();
          const sub = esc(CLASSES[l.cls].name) + ' · ' + (CW.prefPos(l.id) === 'front' ? 'front' : 'behind');
          return `<button class="cx ${cls}${gl && gl.done ? ' pre' : ''}" data-act="leader" data-id="${l.id}" data-hay="${esc(hay)}"><img class="px" src="${CW.portraitURL(l.id)}" alt=""><span class="cx-b"><b>${esc(l.name)}</b><small>${sub}</small><small class="cx-sp">${kicon(sp.t)}${esc(sp.name)}</small></span><span class="cx-r">${pips(l.id)}${stars(r.stars)}</span></button>`;
        })
        .join('')}${left ? `<div class="cx locked hidden-left" data-hay=""><span class="cx-q">?</span><span class="cx-b"><b>${left} still to find</b><small>${e === NERA ? 'They wait beyond the end of time' : 'Beat this era\'s leader battles'}</small></span></div>` : ''}</div></div>`;
    }
    if (reach < NERA - 1) h += `<p class="note">More eras are waiting further along the time pathway.</p>`;
    return h + '<p class="foot">Real people appear here as pixel caricatures in a work of fiction. Inclusion is not endorsement; the dictators\' bios note their crimes.</p>';
  }
  function filterCodex() {
    const q = cxQuery.trim().toLowerCase();
    el.panel.querySelectorAll('.cxera').forEach((grp) => {
      let n = 0;
      grp.querySelectorAll('.cx').forEach((c) => {
        const ok = !q ? true : !c.classList.contains('hidden-left') && c.dataset.hay.includes(q);
        c.hidden = !ok;
        if (ok) n++;
      });
      grp.hidden = n === 0;
    });
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
    return `<div class="phead"><h2>Settings</h2></div>
      <div class="sets">
        <label class="tog"><input type="checkbox" data-act="autopush" ${st.auto.push ? 'checked' : ''}><span>Auto-advance<small>Push on to the next stage after each win; off keeps you farming this one</small></span></label>
        <label class="tog"><input type="checkbox" data-act="autospecial" ${st.auto.special !== false ? 'checked' : ''}><span>Auto specials<small>A charged special fires by itself after a few seconds</small></span></label>
        <label class="tog"><input type="checkbox" data-act="sound" ${st.sound ? 'checked' : ''}> Sound</label>
        <label class="tog"><input type="checkbox" data-act="tips" ${st.guide.on !== false ? 'checked' : ''}><span>Nib Nub teaches new things<small>He explains each new thing the first time it happens, and writes it all down in his Guide (his face in the top corner).</small></span></label>
        <label class="tog"><input type="checkbox" data-act="chat" ${st.guide.chat !== false ? 'checked' : ''}><span>Nib Nub chats during battles<small>He reacts when leaders join you, new eras, big specials and more.</small></span></label>
      </div>
      <p><button class="btn ghost" data-act="guidereset">Start the guide again</button></p>
      <p><button class="btn ghost" data-act="save">Save now</button> <button class="btn ghost" data-act="export">Export save</button> <button class="btn ghost" data-act="import">Import save</button></p>
      <div id="saveBox"></div>
      <p class="note">${Math.floor(s.time / 3600)}h ${Math.floor((s.time % 3600) / 60)}m played · ${fmt(s.bosses)} leaders beaten · ${fmt(s.kills)} enemy soldiers defeated</p>
      <p><button class="btn red" data-act="reset">Reset game</button></p>
      <p class="foot">Real people appear here as pixel caricatures in a work of fiction. Inclusion is not endorsement; the dictators' bios note their crimes.</p>`;
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
    } else if (act === 'pos') {
      CW.setPos(b.dataset.id, b.dataset.pos);
      renderPanel();
    } else if (act === 'recruit') {
      if (CW.recruit(b.dataset.id, st.buyMode === 'max' ? 'max' : st.buyMode)) SFX.play('buy');
      updatePanel();
    } else if (act === 'uaslot') openUAttr(b.dataset.id, +b.dataset.i);
    else if (act === 'champ') openRanks();
    else if (act === 'guidereset') {
      st.guide = { seen: {}, on: true, chat: st.guide.chat };
      toast('Nib Nub will explain everything again', 'blue');
      renderPanel();
    }
    else if (act === 'eqsp') {
      if (CW.equipSpecial(b.dataset.id, +b.dataset.i)) SFX.play('buy');
      renderPanel();
    } else if (act === 'prestige') {
      CW.doPrestige(b.dataset.id);
      renderPanel();
    }
    else if (act === 'rmchamp') {
      CW.setChamp(b.dataset.id, false);
      renderPanel();
    } else if (act === 'council') openCouncil();
    else if (act === 'swap') openSwap(+b.dataset.w);
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
  el.panel.addEventListener('input', (e) => {
    if (e.target.matches('[data-cx]')) {
      cxQuery = e.target.value;
      filterCodex();
    }
  });
  el.panel.addEventListener('change', (e) => {
    if (e.target.dataset.act === 'autopush') {
      CW.setAuto('push', e.target.checked);
      return;
    }
    if (e.target.dataset.act === 'autospecial') {
      CW.setAuto('special', e.target.checked);
      return;
    }
    if (e.target.dataset.act === 'tips') {
      S().guide.on = e.target.checked;
      react(e.target.checked);
      return;
    }
    if (e.target.dataset.act === 'chat') {
      S().guide.chat = e.target.checked;
      react(e.target.checked);
      return;
    }
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
    if (e.target.matches && e.target.matches('input,textarea,select') && (e.key !== 'Escape' || e.target.matches('textarea'))) return;
    if (modalKind) {
      if (e.key === 'Escape' && modalKind !== 'story') closeModal();
      return;
    }
    if (!el.spop.hidden && e.key === 'Escape') return closeSpecials();
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
      <div class="nibhead"><img class="nib" src="img/nibnub.png" alt=""><div><b>Hello! I am Nib Nub.</b><p>I will be your guide. Pick a commander and Nib Nub will explain everything as you play.</p></div></div>
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
    } else if (act === 'addchamp') {
      if (CW.setChamp(b.dataset.id, true)) SFX.play('buy');
      closeModal();
      renderPanel();
    } else if (act === 'setlead') {
      placeLeader(b.dataset.id, picker.w);
      picker = null;
      renderCouncil();
    } else if (act === 'place') {
      const id = b.dataset.id;
      if (placeLeader(id, +b.dataset.w)) SFX.play('buy');
      if (modalKind === 'leader') openLeader(id);
      else closeModal();
    } else if (act === 'later') {
      modalKind = null;
      picker = null;
      el.modal.hidden = true;
    } else if (act === 'train') {
      if (CW.train(b.dataset.id)) SFX.play('buy');
      openLeader(b.dataset.id);
    } else if (act === 'eqsp') {
      if (CW.equipSpecial(b.dataset.id, +b.dataset.i)) SFX.play('buy');
      openLeader(b.dataset.id);
    } else if (act === 'prestige') {
      CW.doPrestige(b.dataset.id);
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

  // a recruited leader's page offers their team slots: commander, or partner in place of someone
  function teamButtons(id) {
    const st = S();
    const team = [st.main, st.partners[0] || null, st.partners[1] || null];
    let h = id === st.main ? '' : `<button class="btn blue" data-act="place" data-id="${id}" data-w="0">Make commander</button>`;
    for (const w of [1, 2]) {
      if (team[w] === id || (w === 2 && !team[1] && !team[2])) continue;
      h += `<button class="btn ghost" data-act="place" data-id="${id}" data-w="${w}">${team[w] ? 'Partner instead of ' + esc(short(team[w])) : 'Make partner'}</button>`;
    }
    return h;
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
    const role = id === st.main ? 'Your commander' : st.partners.includes(id) ? 'Your partner' : CW.champs().includes(id) ? 'In the ranks' : r ? 'In reserve' : l.starter ? 'Starter' : 'Not yet defeated · Stage ' + CW.bossStageOf(id);
    const labels = ['Signature · as commander', 'As commander or partner', 'As commander'];
    showModal(
      'leader',
      `<div class="lead" style="grid-template-columns:auto minmax(0,1fr)"><img class="px" src="${CW.portraitURL(id)}" alt="" style="width:128px;height:128px"><div class="who"><h2>${esc(l.name)}</h2><small>${esc(l.title)} · ${esc(l.yrs)}</small><small>${l.era === NERA ? 'Mystery · Shattered Time' : 'Era ' + ERAS[l.era].roman + ' · ' + ERAS[l.era].name} · ${esc(role)}</small>${r ? `<small>Level ${r.lv} ${stars(r.stars)}</small>` : ''}</div></div>
      ${r && id !== st.main ? `<div class="acts tm">${teamButtons(id)}</div>` : ''}
      <p class="bio">${esc(l.bio)}</p>
      <h3>Attributes · always on</h3><div class="sklist">${[0, 1, 2].map((i) => `<div class="sk"><em>${labels[i]}</em><b>${esc(CW.attr(id, i).name)}</b>: ${esc(CW.attrText(id, i, r ? CW.attrStrength(id, i === 1 && st.main !== id ? 'partner' : 'main') : 1))}</div>`).join('')}<div class="sk"><em>Commander bonus · ${esc(cl.name)}</em>${esc(cl.d)}</div></div>
      <h3>Specials · one equipped at a time ${pips(id)}</h3>${CW.prestigeUnlocked() ? '' : '<p class="note">Prestige opens once the main story is over (finish the Galactic Age). Goals count from then on.</p>'}<ul class="sps2">${specialRows(id, !!r)}</ul>
      <div class="sklist" style="margin-top:6px"><div class="sk"><em>Best position · ${CW.prefPos(id) === 'front' ? 'front lines' : 'behind the army'}</em>${esc(CW.posText(id))}</div>${CW.prestige(id) ? `<div class="sk"><em>Prestige ${CW.prestige(id)}</em>+${25 * CW.prestige(id)}% strength on the field, +${20 * CW.prestige(id)}% attribute strength, stronger specials</div>` : ''}</div>
      <p class="note">They work while this leader is standing. When you fight them, they power the enemy army instead.</p>
      <div class="acts">${r ? `<button class="btn" data-act="train" data-id="${id}" ${CW.trainCost(id) > st.gold ? 'disabled' : ''}>Train to Lv ${r.lv + 1} · ${fmt(CW.trainCost(id))}</button>` : ''}<button class="btn ghost" data-act="close">Close</button></div>`
    );
  }

  // put a recruited leader in a team slot (0 = commander, 1-2 = partners); someone already on the team trades places
  function placeLeader(id, w) {
    const st = S();
    const arr = [st.main, st.partners[0] || null, st.partners[1] || null];
    const at = arr.indexOf(id);
    if (at >= 0) arr[at] = arr[w];
    arr[w] = id;
    if (!arr[0]) arr[0] = id;
    const ok = CW.setCommand(arr[0], arr[1], arr[2]);
    if (ok) renderDeck();
    return ok;
  }
  function openSwap(w) {
    const st = S();
    const team = [st.main, st.partners[0], st.partners[1]];
    const ids = LEADERS.filter((l) => st.roster[l.id]).map((l) => l.id);
    const role = (id) => (id === st.main ? 'Commander' : st.partners.includes(id) ? 'Partner' : CW.champs().includes(id) ? 'In the ranks' : '');
    const rows = ids
      .map((id) => {
        const l = LEADER[id];
        const r = st.roster[id];
        const here = team[w] === id;
        const tag = role(id);
        const hay = (l.name + ' ' + CLASSES[l.cls].name + ' ' + (l.era === NERA ? 'mystery' : ERAS[l.era].name)).toLowerCase();
        return `<button class="pick${here ? ' sel' : ''}" data-act="place" data-id="${id}" data-w="${w}" data-hay="${esc(hay)}" ${here ? 'disabled' : ''}><img class="px" src="${CW.headURL(id)}" alt=""><span><em>${tag ? esc(tag) + ' · ' : ''}Lv ${r.lv} · ${esc(CLASSES[l.cls].name)}</em><b>${esc(l.name)}</b><small class="hint">${esc(w === 0 ? CW.attr(id, 0).name + ' +2 more' : CW.attr(id, 1).name)}</small></span></button>`;
      })
      .join('');
    showModal(
      'swap',
      `<h2>Choose your ${w === 0 ? 'commander' : 'partner'}</h2>
      <p class="note">${w === 0 ? 'Your commander brings all three attributes and their class bonus.' : 'A partner brings their middle attribute.'} The leader you pick steps onto the battlefield right away${team[w] ? ', taking ' + esc(short(team[w])) + "'s place" : ''}. Picking someone already on your team swaps their places.</p>
      ${ids.length > 12 ? '<input class="swq" id="swq" type="search" placeholder="Find a leader" autocomplete="off">' : ''}
      <div class="chooser swl">${rows}</div>
      <div class="acts"><button class="btn ghost" data-act="close">Close</button></div>`
    );
  }
  el.dlg.addEventListener('input', (e) => {
    if (e.target.id !== 'swq') return;
    const q = e.target.value.trim().toLowerCase();
    for (const b of el.dlg.querySelectorAll('.swl .pick')) b.hidden = !!q && !b.dataset.hay.includes(q);
  });

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
    toast('The timeline is broken: eras are mixed together', 'red');
    setTimeout(() => toast('The story is over: leader prestige is open · Team', 'blue'), 1600);
    setTimeout(() => toast('Leaders can now join the ranks · Army', 'blue'), 3400);
  });
  CW.on('prestige', (e) => {
    SFX.play('era');
    toast(short(e.lid) + ' reached prestige ' + e.rank + ': ' + CW.SPECIALS[e.lid][e.rank][0] + ' unlocked', 'blue');
    renderDeck();
  });
  CW.on('champSlot', (n) => toast('New slot for a leader in the ranks (' + n + ')', 'blue'));
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
  let guideT = 0;
  let saveT = 0;
  function frame(now) {
    const dt = Math.min(0.25, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    try {
      if (modalKind !== 'story') CW.advance(dt);
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
      guideT += dt;
      if (guideT > 0.25) {
        guideTick(guideT);
        guideT = 0;
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


  // ------------------------------------------------------------ Nib Nub, the guide
  // A small alien who teaches the game in plain words as you play (lessons) and talks about what happens (chatter).
  const B_ = () => CW.battle();
  const cheapestRecruit = () => Math.min(...CW.unlockedUnits().map((u) => CW.recruitCost(u.id, 1)));
  const anyReady = () => [S().main].concat(S().partners).some((id) => CW.heroAlive(id) && CW.meter(id) >= CW.special(id).cost);
  const prestigeReady = () => Object.keys(S().roster).find((id) => { const gl = CW.prestigeGoal(id); return gl && gl.done; });
  // Nib Nub's lessons. Each one is a little conversation that plays once, the first time it matters; it counts as heard
  // the moment he starts, so it never repeats (it stays in his Guide). d() gives the lines he says, one page at a time.
  const TIPS = [
    { id: 'welcome', sec: 'Basics', t: 'Hello, Commander!', d: () => ['Greetings, Commander! I am Nib Nub. I come from a planet very, very far away.', 'My spaceship got lost in time, so now Nib Nub travels with you. I will do my best to help!', 'Here is the big secret: your army fights all by itself. Your job is to make it stronger.'], when: () => true },
    { id: 'tap', sec: 'Basics', t: 'Bonk them from the sky!', d: () => ['Want to help in the fight? Tap anywhere on the battlefield and a strike falls on the enemy.', 'Go on, tap! Nib Nub loves this part.'], target: '#screen', when: () => B_().phase === 'fight', done: (st) => st.stats.taps > 0 },
    { id: 'bars', sec: 'Basics', t: 'Who is winning?', d: () => ['See the bar at the top? Blue is your army. Red is the enemy.', 'Beat all the red ones to win the stage. Easy peasy!'], target: '.ov-l', when: (st) => st.stage >= 2 },
    { id: 'gold', sec: 'Army', t: 'Shiny gold!', d: () => ['Shiny! Every enemy you beat drops gold.', 'Nib Nub says: spend it! Open Army and tap Recruit to get more soldiers.'], target: '[data-sc="army"]', tab: 'army', when: (st) => (st.stage >= 2 || st.stats.kills >= 12) && st.gold >= cheapestRecruit() },
    { id: 'room', sec: 'Army', t: 'Only so much room', d: () => ['Your army can only fit so many soldiers.', 'Foot soldiers take 1 space, riders take 2 and big machines take 4. Every new era gives you more room.'], target: '.capline', when: () => !el.sheet.hidden && tab === 'army' },
    { id: 'train', sec: 'Army', t: 'Recruit or train?', d: () => ['Recruit buys one more soldier. Train +1 makes every soldier of that kind stronger.', 'Both are good! And Auto-build always sends your best soldiers into battle.'], target: '.buys', when: (st) => !el.sheet.hidden && tab === 'army' && st.guide.seen.room },
    { id: 'boss', sec: 'Leaders', t: 'A famous leader!', d: () => ['Ooh, a famous leader from history!', 'Beat them before the timer runs out, and they will join your side. Nib Nub is hiding behind you, just in case.'], target: '#hudBoss', when: () => B_().info.isBoss && !B_().info.mystery },
    { id: 'lose', sec: 'Basics', t: 'Oops! That is okay', d: () => ['Oops! That is okay. Nib Nub loses all the time!', 'Your army steps back to an easier stage to earn more gold. Make it stronger, and it will try again by itself.'], ev: 'defeat' },
    { id: 'council', sec: 'Leaders', t: 'War Council', d: () => ['You won! Welcome to the War Council.', 'Pick one doctrine. It is a bonus for your whole army, and it lasts until your next Time Rift.'], modal: 'council', when: (st) => !!st.council && modalKind === 'council' },
    { id: 'special', sec: 'Leaders', t: 'Special move ready!', d: () => ["Look! When a leader's picture glows, their special move is ready.", 'Tap the picture, then tap the special. Kaboom!'], target: '#deck .chip.ready', when: anyReady, ev2: 'special' },
    { id: 'team', sec: 'Leaders', t: 'Your team', d: () => ['You lead with one commander and two helpers called partners.', 'Open Team to swap them. The commander gives the biggest bonus.'], target: '[data-sc="command"]', tab: 'command', when: (st) => Object.keys(st.roster).length > 3 },
    { id: 'position', sec: 'Leaders', t: 'Front or back?', d: () => ['Some leaders are fighters. They love the front!', "Some are thinkers. They like to stay behind the army. In Team, a star shows each leader's best place."], target: '[data-sc="command"]', tab: 'command', when: (st) => st.guide.seen.team && st.stage >= 12 },
    { id: 'skills', sec: 'Army', t: 'Soldier skills', d: () => ['Soldiers can learn skills, like Sharpened or Shield Wall!', 'Open Army and tap + Equip. More slots open at level 10 and level 30.'], target: '[data-sc="army"]', tab: 'army', when: (st) => st.stage >= 9 },
    { id: 'era', sec: 'Army', t: 'Whoosh! A new era!', d: () => ['Whoosh! We travelled forward in time!', 'New soldiers are ready to recruit. They cost more, so save up your gold.'], target: '[data-sc="army"]', tab: 'army', ev: 'era' },
    { id: 'codex', sec: 'Leaders', t: 'The Codex', d: () => ['Every leader you beat goes into the Codex. It is like a sticker book!', 'Can you find them all? Nib Nub believes in you.'], target: '[data-sc="leaders"]', tab: 'leaders', when: (st) => Object.keys(st.roster).length >= 5 },
    { id: 'auto', sec: 'Basics', t: 'Auto buttons', d: () => ['Psst! In Settings you can turn off Auto-advance to stay on one stage and collect gold.', 'You can also turn off Auto specials and fire them yourself.'], target: '[data-sc="options"]', tab: 'options', when: (st) => st.stage >= 20 },
    { id: 'rift', sec: 'Later', t: 'Time Rift', d: () => ['Stuck? Try a Time Rift!', 'It sends you back to the start, but gives you Chrono Shards. Each shard makes everything 5% stronger, forever. And you keep your leaders!'], target: '[data-sc="rift"]', tab: 'rift', when: (st) => CW.riftShards() > 0 && (st.farming || st.stage >= 80) },
    { id: 'afterrift', sec: 'Later', t: 'Back to the start!', d: () => ['Wheee! That tickled.', 'Your shards make you stronger now, so you will go further and faster this time.'], ev: 'rift' },
    { id: 'mystery', sec: 'Later', t: 'Mystery boss!', d: () => ['A mystery boss! Nib Nub does not know who this is either.', 'Mystery bosses are extra tough. Good luck!'], target: '#hudBoss', when: () => B_().info.mystery },
    { id: 'story', sec: 'Later', t: 'The broken timeline', d: () => ['You beat Nib Nub and became Controller of the Infinite Universe. Then you pressed the red button.', 'Now every timeline mixes different eras together, and the leaders keep coming back stronger, every time different. Fix them, one by one!'], when: (st) => st.best > CW.PATH_LEN && !!st.roster.nibnub },
    { id: 'prestige', sec: 'Later', t: 'Leader prestige', d: () => ['Listen up, Controller. Nib Nub has a gift. Leaders can learn new special moves now.', 'Each leader has a goal, like beating 666 enemies. Meet it, then tap Prestige. Yes, even Nib Nub has goals.'], target: '[data-sc="command"]', tab: 'command', when: () => CW.prestigeUnlocked() },
    { id: 'ranks', sec: 'Later', t: 'Leaders in the ranks', d: () => ['And another thing! Leaders can fight as soldiers too.', 'Open Army and add a leader to the front line. Nib Nub volunteers. Nib Nub looks great at the front.'], target: '[data-sc="army"]', tab: 'army', when: () => CW.champUnlocked() },
    { id: 'ready', sec: 'Later', t: 'Ready to prestige!', d: () => { const id = prestigeReady(); return [(id ? LEADER[id].name : 'A leader') + ' met their goal!', 'Open Team or the Codex and tap Prestige to unlock a new special.']; }, target: '[data-sc="command"]', tab: 'command', when: () => !!prestigeReady() },
  ];
  const SECS = ['Basics', 'Army', 'Leaders', 'Later'];
  const lines = (tip, st) => [].concat(tip.d(st));

  // Nib Nub's chatter: things he says during battles. Each set is used in turn, so he doesn't repeat himself.
  const CHAT = {
    joins: ['{name} joins your side! Nib Nub is a little bit starstruck.', 'Wow, {name} is on our team now! Can Nib Nub get an autograph?', '{name} was tough! Now they fight for you.', 'Welcome to the team, {name}! Nib Nub made snacks.', 'Another one for the Codex! Hello, {name}.', '{name} says hello. Well, Nib Nub thinks that was a hello.'],
    star: ['{name} again? They earned a shiny star!', 'Ding! {name} gets another star.', 'You beat {name} twice? You are getting really good at this!', 'Another star for {name}. They are going to need a bigger hat.'],
    boss: ['Here comes {name}! Nib Nub is hiding behind you.', 'It is {name}, {title}! Be careful, Commander.', '{name} wants a fight. Let us give them one!', 'Watch the timer, Commander. {name} will not wait around!', 'Nib Nub read about {name} in a book once. Now they are right here!'],
    mystery: ['Who is that?! Nib Nub cannot see!', 'Something strange is coming out of the broken time...', 'Nib Nub has a funny feeling about this one.'],
    defeat: ['Ouch! Shake it off, Commander.', 'Nib Nub covered his eyes for that one.', 'Even the greatest leaders lose sometimes. Train up and try again!', 'Do not worry. More gold, more soldiers, more fun. We will get them next time!', 'Hmm. Maybe recruit a few more soldiers? Just an idea from Nib Nub.', 'That enemy was strong. But you will be stronger!'],
    special: ['Kaboom! That was {sp}!', 'Nice {sp}, {name}!', '{sp}! Nib Nub did not see that coming.', "Ooh, sparkly. That was {name}'s {sp}.", 'Did you see that? {sp}! Again, again!'],
    foeSpecial: ['Uh oh! {name} used {sp}!', 'Watch out, Commander! That was {sp}.', 'Hey, no fair, {name}!', '{sp}?! Nib Nub felt that one in his antennae.'],
    prestige: ['{name} learned {sp}! Nib Nub is so proud.', 'New special for {name}: {sp}! Try it out!', '{name} is stronger than ever. And has a new trick: {sp}!'],
    rift: ['Whoa, the Time Rift tickles!', 'Back to the beginning, but stronger. Nib Nub likes this plan.', 'Here we go again! Nib Nub packed a lunch this time.'],
    eraAny: ['Welcome to the {era}! Nib Nub likes the view.', 'The {era}! Everything looks so different here.', 'Whoosh! We landed in the {era}. Mind the new enemies!'],
    era: [
      'Nib Nub saw a mammoth! It was bigger than his spaceship.',
      'Pyramids! Nib Nub\'s people did not build them. Probably.',
      'So many columns! Nib Nub counted to 47 and gave up.',
      'Brrr! Nib Nub\'s antennae are freezing.',
      'Castles! Nib Nub would like one with a moat, please.',
      'Those cannons are LOUD. Nib Nub\'s ears are ringing. Wait, does Nib Nub have ears?',
      'Everyone wants freedom in this era. Nib Nub approves!',
      'Steam, smoke and machines! Nib Nub sneezed twice.',
      'This era is very serious. Nib Nub will be brave for you.',
      'Shh. Everyone is spying on everyone here. Nib Nub is spying too. On you! Just kidding.',
      'Phones! Nib Nub tried to call home. Wrong number.',
      'Neon lights everywhere! This looks a little bit like Nib Nub\'s home.',
      'Space! Nib Nub feels right at home up here.',
      'The Galactic Age! Somewhere out there is Nib Nub\'s planet. Wave hello!',
    ],
    // as the story goes on he gets smug (S), then pompous and mocking (P); once beaten he is your cheeky ally (A)
    hintS: ['Nib Nub would have won that battle faster. Just saying.', 'You are doing okay. For a human.', 'Nib Nub knows a secret about the end of time. But he is not telling you. Yet.', 'Have you noticed Nib Nub is always right? Nib Nub has noticed.', 'Keep going, Commander. Nib Nub needs you strong. For... reasons.'],
    hintP: ['Soon you will see who Nib Nub really is. Heh heh.', "The Galactic Age is Nib Nub's home. Nib Nub's KINGDOM. Er... never mind.", 'Tiny humans with tiny armies. How adorable.', 'Do keep fighting, Commander. Nib Nub is enjoying the show.', 'Nib Nub could end this war with one button. But where would be the fun?', 'Bow before... I mean, good job, Commander! Heh.'],
    hintA: ['You are the Controller now. Act like it! ...Please.', 'Nib Nub is helping. Nib Nub is a very helpful former ruler of the universe.', 'Every timeline we fix makes Nib Nub feel a little less guilty. About the button. Which YOU pressed.', 'Vikings with tanks! Pharaohs in space! Nib Nub secretly loves this mess.', 'Watch out for Titan leaders. They are big. Bigger than Nib Nub. Rude.'],
    defeatS: ['Lost again? Nib Nub is not surprised. Just a little.', 'Hmm. Nib Nub would have done better. But okay.'],
    defeatP: ['Ha! Did you even try that time?', "Nib Nub's grandma fights better than that. And she is a cloud.", 'Lost again? Nib Nub is shocked. Not really.', 'Maybe let Nib Nub drive next time. Oh wait, you cannot. Heh.'],
    defeatA: ['Ouch. Even Controllers lose sometimes. Nib Nub lost to YOU, remember?', 'Shake it off, Controller. The timeline will not fix itself!'],
    joinsP: ['{name} joins you? Cute. Collect them all, little Commander.', '{name}! Nib Nub remembers when they were his favourite toy.'],
    eraP: ['Ah, the {era}. Nib Nub planned this one himself.', 'Welcome to the {era}. Try not to embarrass yourself.'],
    off: ['Oh. Okay. Nib Nub will be quiet now... *sniff*', 'Nib Nub understands. Too much talking. Bye for now...', 'That is fine. Nib Nub will just sit here. All alone. In silence.'],
    offS: ['Fine. Nib Nub will just stand here. Silently. Being amazing.', "Hmph! Nib Nub's wisdom is wasted on you anyway."],
    offP: ['You dare silence the great Nib Nub?! ...Fine. You will be sorry!', "Ha! You cannot handle Nib Nub's genius. Off I go."],
    offA: ['Silencing the former Controller of the Universe? Rude. But fine.', 'Okay, okay. Nib Nub will be quiet. Sort of.'],
    on: ['Nib Nub is back! Sorry if I talked too much before. I will try to be extra helpful!', 'You missed me? Nib Nub is so happy! And a little bit sorry. Mostly happy.', 'Thank you for letting Nib Nub talk again. He was very lonely.'],
    onS: ['Oh, you need Nib Nub again? Of course you do.', 'Back to Nib Nub, are we? Nib Nub knew you would be.'],
    onP: ['Crawling back to Nib Nub, are we? I knew you could not win without my genius!', 'Ha! Turned me back on? Admit it, you are lost without the great Nib Nub.'],
    onA: ['Back again? Even the new Controller needs advice, I see.', 'Nib Nub is back on duty, Controller. Try not to press any more red buttons.'],
    hint: ['If you get stuck, train your best soldiers. It helps a lot!', 'Tap the battlefield where the enemies bunch up. More enemies, more bonk!', 'Nib Nub counted all the leaders in history. There are ' + LEADERS.length + '! Can you find them all?', 'Thinkers like to stay behind the army. Fighters love the front!', 'Soldiers far away look smaller. Nib Nub thinks that is magic.', "Nib Nub's favourite leader is... everyone! Shh, do not tell them.", 'Check the Army menu now and then. New soldiers might be waiting!', 'Do you hear that? That is the sound of winning.', 'Nib Nub once tried to ride a war elephant. It did not go well.', "A leader's picture glows when their special is ready. Tap it!", 'Forgot something? Tap Nib Nub in the top corner. He wrote everything down.', 'Big machines take 4 spaces in your army, but they hit really hard!', 'Every new era gives your army more room. Fill it up!'],
  };
  const chatUsed = {};
  function pick(set) {
    const list = CHAT[set];
    const used = chatUsed[set] || (chatUsed[set] = []);
    if (used.length >= list.length) used.length = 0;
    const free = list.map((_, i) => i).filter((i) => !used.includes(i));
    const i = free[Math.floor(Math.random() * free.length)];
    used.push(i);
    return list[i];
  }
  const fill = (txt, o) => txt.replace(/\{(\w+)\}/g, (_, k) => (o[k] !== undefined ? o[k] : ''));

  const guideEl = $('#guide');
  const gEvents = new Set();
  let gCur = null; // { tip, lines, i } for a lesson, { chat: true } for chatter
  let gWait = 1.2;
  let gHide = 0;
  let gLit = [];
  let chatQ = null;
  let chatCool = 20;
  let hintT = 150;
  const lessonsOn = () => { const st = S(); return st && st.guide && st.guide.on !== false; };
  const chatOn = () => { const st = S(); return st && st.guide && st.guide.chat !== false; };
  function unlight() {
    gLit.forEach((n) => n.classList.remove('glow'));
    gLit = [];
  }
  function light() {
    unlight();
    if (!gCur || !gCur.tip || !gCur.tip.target) return;
    gLit = Array.from(document.querySelectorAll(gCur.tip.target)).slice(0, 3);
    gLit.forEach((n) => n.classList.add('glow'));
  }
  // Nib Nub talks: the words appear a few letters at a time with a soft blip (all at once if motion is reduced)
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // each place he talks (the guide card, a story scene) types on its own
  const saying = new Map();
  function say(node, text, host) {
    host = host || guideEl;
    finishSay(host);
    if (calm) {
      node.textContent = text;
      return;
    }
    let i = 0;
    node.textContent = '';
    host.classList.add('talk');
    const job = { node, text, host, t: 0 };
    job.t = setInterval(() => {
      i = Math.min(text.length, i + 2);
      node.textContent = text.slice(0, i);
      if (i % 8 === 0) SFX.play('blip');
      if (i >= text.length) finishSay(host);
    }, 28);
    saying.set(host, job);
  }
  // a tap while he is still talking shows the whole line at once; the next tap moves on
  function finishSay(host) {
    const job = saying.get(host);
    if (!job) return false;
    clearInterval(job.t);
    job.node.textContent = job.text;
    job.host.classList.remove('talk');
    saying.delete(host);
    return true;
  }
  function drawLesson() {
    const { tip, lines: ls, i } = gCur;
    const last = i >= ls.length - 1;
    guideEl.className = 'guide';
    guideEl._mode = '';
    guideEl.innerHTML = `<img class="nib" src="img/nibnub.png" alt="Nib Nub"><div class="g-b"><small>Nib Nub</small><b>${esc(tip.t)}</b><p data-say></p><div class="g-acts">${last ? `<button class="btn sm" data-g="ok">Got it</button>${tip.tab ? '<button class="btn ghost sm" data-g="show">Show me</button>' : ''}` : '<button class="btn sm" data-g="next">Next</button>'}</div></div>`;
    guideEl.hidden = false;
    placeGuide();
    say(guideEl.querySelector('[data-say]'), ls[i]);
  }
  function showTip(tip) {
    const st = S();
    // heard as soon as he starts talking: an interrupted lesson never starts over
    st.guide.seen[tip.id] = 1;
    if (tip.ev) gEvents.delete(tip.ev);
    gCur = { tip, lines: lines(tip, st), i: 0 };
    gHide = 0;
    drawLesson();
  }
  function react(on) {
    const m = mood();
    const set = (on ? 'on' : 'off') + m;
    stopTalking();
    showChat(fill(pick(CHAT[set] ? set : on ? 'on' : 'off'), {}), true);
  }
  function showChat(text, force) {
    gCur = { chat: true, force: !!force };
    guideEl.className = 'guide chat';
    guideEl._mode = '';
    guideEl.innerHTML = `<img class="nib" src="img/nibnub.png" alt="Nib Nub"><div class="g-b"><small>Nib Nub</small><p data-say></p></div>`;
    guideEl.hidden = false;
    placeGuide();
    say(guideEl.querySelector('[data-say]'), text);
    gHide = Math.max(5, text.length / 14 + 3);
  }
  function stopTalking() {
    finishSay(guideEl);
    const was = gCur;
    gCur = null;
    guideEl.hidden = true;
    guideEl.classList.remove('talk');
    unlight();
    if (was && was.chat) chatCool = 35;
    else {
      gWait = 2.5;
      chatCool = Math.max(chatCool, 10);
    }
    if (!el.sheet.hidden && tab === 'guide') renderPanel();
  }
  function placeGuide() {
    // over the battle above the dock; inside an open menu, or just above the War Council, so it never covers them
    let host = document.body;
    let mode = '';
    const tip = gCur && gCur.tip;
    if (tip && tip.modal && modalKind === tip.modal) {
      host = el.modal;
      mode = 'inm';
    } else if (!el.sheet.hidden) {
      host = el.sheet.querySelector('.sheet-in');
      mode = 'ins';
    }
    if (guideEl.parentNode !== host) {
      if (mode === 'ins') host.insertBefore(guideEl, el.panel);
      else if (mode === 'inm') host.insertBefore(guideEl, el.dlg);
      else document.body.appendChild(guideEl);
    }
    if (guideEl._mode !== mode) {
      guideEl.classList.remove('ins', 'inm');
      if (mode) guideEl.classList.add(mode);
      guideEl._mode = mode;
    }
    light();
  }
  // how Nib Nub feels about you: sweet at first, smug in the middle, pompous near the end, a cheeky ally once beaten
  function mood() {
    const st = S();
    if (st.roster.nibnub) return 'A';
    const f = st.best / CW.PATH_LEN;
    return f < 0.4 ? '' : f < 0.75 ? 'S' : 'P';
  }
  function moodSet(set) {
    const m = mood();
    const chance = { '': 0, S: 0.25, P: 0.6, A: 0.5 }[m];
    if (m && CHAT[set + m] && Math.random() < chance) return set + m;
    if (m === 'P' && CHAT[set + 'S'] && Math.random() < 0.3) return set + 'S';
    return set;
  }
  function chat(set, o, important) {
    if (!chatOn()) return;
    if (set !== 'era' || mood() !== 'P' || Math.random() > 0.4) set = set === 'era' ? set : moodSet(set);
    else set = 'eraP';
    const text = fill(set === 'era' ? (o.i !== undefined && CHAT.era[o.i] && Math.random() < 0.75 ? CHAT.era[o.i] : pick('eraAny')) : pick(set), o || {});
    // the newest thing wins; important news (a leader joining, a prestige) skips the wait
    chatQ = { text, important };
  }
  function guideTick(dt) {
    const st = S();
    if (!st || !started || !st.guide) return;
    const busy = !el.spop.hidden;
    if (gCur) {
      const tip = gCur.tip;
      if (tip && !lessonsOn()) return stopTalking();
      if (gCur.chat && !chatOn() && !gCur.force) return stopTalking();
      // a dialog that isn't his moves him out of the way (lessons are already heard, so nothing repeats)
      if ((tip && tip.modal && modalKind !== tip.modal) || (!(tip && tip.modal) && modalKind)) return stopTalking();
      if (tip && tip.done && tip.done(st)) return stopTalking();
      if (gCur.chat && !gCur.force && (!el.sheet.hidden || busy)) return stopTalking();
      if (guideEl.hidden !== busy) {
        guideEl.hidden = busy;
        if (busy) unlight();
      }
      if (gHide > 0) {
        gHide -= dt;
        if (gHide <= 0) return stopTalking();
      }
      if (!busy) placeGuide();
      return;
    }
    gWait -= dt;
    chatCool -= dt;
    if (busy) return;
    // lessons first
    if (lessonsOn() && gWait <= 0) {
      for (const tip of TIPS) {
        if (st.guide.seen[tip.id]) continue;
        if (modalKind && tip.modal !== modalKind) continue;
        if (!modalKind && tip.modal) continue;
        let ok = false;
        try {
          ok = tip.ev ? gEvents.has(tip.ev) : tip.when(st);
        } catch (e) {
          ok = false;
        }
        if (ok) return showTip(tip);
      }
    }
    // then chatter, only over the battle itself
    if (!chatOn() || modalKind || !el.sheet.hidden) return;
    hintT -= dt;
    if (!chatQ && hintT <= 0 && chatCool <= 0) {
      hintT = 120 + Math.random() * 90;
      chat('hint', {});
    }
    if (chatQ && (chatCool <= 0 || (chatQ.important && chatCool <= 15))) {
      const q = chatQ;
      chatQ = null;
      showChat(q.text);
    }
  }
  guideEl.addEventListener('click', (e) => {
    if (!gCur) return;
    SFX.ensure();
    if (gCur.chat) return stopTalking();
    const b = e.target.closest('[data-g]');
    if (!b) return;
    if (b.dataset.g === 'next' && finishSay(guideEl)) return;
    if (b.dataset.g === 'next') {
      gCur.i++;
      drawLesson();
      return;
    }
    const tip = gCur.tip;
    stopTalking();
    if (b.dataset.g === 'show' && tip && tip.tab) openSheet(tip.tab);
  });
  // lessons that wait for a moment in the game, and the things Nib Nub says about what just happened
  CW.on('defeat', () => {
    if (S().guide.seen.lose) chat('defeat', {});
    gEvents.add('defeat');
  });
  CW.on('era', (info) => {
    gEvents.add('era');
    if (S().guide.seen.era) chat('era', { era: ERAS[info.era].name, i: info.era });
  });
  CW.on('rift', () => {
    gEvents.add('rift');
    if (S().guide.seen.afterrift) chat('rift', {});
  });
  CW.on('victory', (r) => {
    if (!r || !r.lid) return;
    const name = short(r.lid);
    if (r.lid === 'nibnub') {
      if (r.res === 'recruit' && !S().guide.seen.finale) setTimeout(storyFinale, 1100);
      return;
    }
    if (r.res === 'recruit') chat('joins', { name: LEADER[r.lid].name }, true);
    else if (r.res === 'star') chat('star', { name });
  });
  CW.on('stage', (info) => {
    if (info.isBoss && info.bossId === 'nibnub' && !S().roster.nibnub && !S().guide.seen.reveal && started) return setTimeout(storyReveal, 350);
    if (!info.isBoss || !S().guide.seen.boss) return;
    if (info.mystery) chat('mystery', {});
    else if (Math.random() < 0.7) chat('boss', { name: LEADER[info.bossId].name, title: LEADER[info.bossId].title.replace(/^The /, 'the ') });
  });
  CW.on('command', () => {
    const B = CW.battle();
    if (B) for (const q of B.ents) if (!ents.has(q.id)) ents.set(q.id, q);
  });
  CW.on('special', (e) => {
    if (e.side === 'a' && gCur && gCur.tip && gCur.tip.ev2 === 'special') return stopTalking();
    if (Math.random() > (e.side === 'a' ? 0.12 : 0.35)) return;
    chat(e.side === 'a' ? 'special' : 'foeSpecial', { name: short(e.lid), sp: e.name });
  });
  CW.on('prestige', (e) => chat('prestige', { name: LEADER[e.lid].name, sp: CW.SPECIALS[e.lid][e.rank][0] }, true));
  // the Guide page: every lesson heard so far, by topic
  function renderGuide() {
    const st = S();
    const seen = TIPS.filter((x) => st.guide.seen[x.id]);
    let h = `<div class="phead"><h2>Guide</h2></div><div class="nibhead"><img class="nib" src="img/nibnub.png" alt=""><div><b>Nib Nub's Guide</b><p>Hello again! Nib Nub writes down everything he teaches you, right here. A new page appears every time something new happens in your game. You have ${seen.length} of ${TIPS.length} pages.</p></div></div>`;
    for (const sec of SECS) {
      const all = TIPS.filter((x) => x.sec === sec);
      const got = all.filter((x) => st.guide.seen[x.id]);
      h += `<div class="gsec"><div class="erahead">${sec}<span>${got.length} / ${all.length}</span></div><div class="glist">${got
        .map((x) => `<div class="gpage"><b>${esc(x.t)}</b><p>${esc(lines(x, st).join(' '))}</p></div>`)
        .join('')}${got.length < all.length ? `<div class="gpage locked"><b>${all.length - got.length} more ${all.length - got.length === 1 ? 'page' : 'pages'}</b><p>Keep playing to unlock ${all.length - got.length === 1 ? 'it' : 'them'}.</p></div>` : ''}</div></div>`;
    }
    return h + `<p class="note">You can turn Nib Nub's lessons and chatter on or off, or have him start over, in Settings.</p>`;
  }

  // ------------------------------------------------------------ the end of the story
  // Before the last leader battle Nib Nub reveals who he really is; when you beat him he hands you the Infinite
  // Universe, shows you the Time Rift controls... and you press the wrong button. The battle waits while he talks.
  let storyQ = null;
  const REVEAL = [
    'Well, well, well. Look who made it all the way to the end of time.',
    'Did you really think a little alien was here just to help you? Nib Nub has been watching you. Training you.',
    'Every era, every leader, every battle... Nib Nub set them all up, just to find someone worth fighting.',
    'I am Nib Nub, Controller of the Infinite Universe! Now, Commander... FIGHT ME!',
  ];
  const FINALE = [
    'No... no, no, NO! You beat the great Nib Nub?!',
    '...Fine. A deal is a deal. Whoever beats Nib Nub becomes the Controller of the Infinite Universe. That is you now.',
    'And Nib Nub will join your team. Every Controller needs a genius. You can make Nib Nub your leader in Team.',
    'Now, let Nib Nub show you the controls. This is the Time Rift. The green button rewinds time, nice and safe. The red button... do NOT press the red button.',
  ];
  const AFTER = [
    'The timeline is broken! Every era is mixed up. Vikings with tanks! Pharaohs in space!',
    'Now we have to rebuild everything, one timeline at a time. And the leaders out there keep coming back stronger, and different every time.',
    'Do not worry, Controller. Nib Nub will help. Probably. Let us fix this mess!',
  ];
  function storyPage() {
    const q = storyQ;
    const line = q.lines[q.i];
    const last = q.i >= q.lines.length - 1;
    let acts;
    if (q.choice && last) acts = '<button class="btn sm green" data-st="green">Press the green button</button><button class="btn red sm" data-st="red">Press the red button</button>';
    else acts = `<button class="btn sm" data-st="next">${last ? esc(q.end) : 'Next'}</button>`;
    el.dlg.innerHTML = `<div class="story ${q.evil ? 'evil' : ''}"><img class="nib" src="img/nibnub.png" alt="Nib Nub"><div class="st-b"><small>${q.evil ? 'Nib Nub · Controller of the Infinite Universe' : 'Nib Nub'}</small><p data-say></p><div class="acts">${acts}</div></div></div>`;
    say(el.dlg.querySelector('[data-say]'), line, el.dlg.querySelector('.story'));
  }
  function openStory(q) {
    if (closeSheet) closeSheet();
    closeSpecials();
    storyQ = Object.assign({ i: 0 }, q);
    modalKind = 'story';
    el.modal.hidden = false;
    el.modal.classList.add('cine');
    storyPage();
    SFX.play(q.evil ? 'bosscast' : 'cast');
  }
  function storyReveal() {
    const B = CW.battle();
    if (!B || !B.boss || B.boss.lid !== 'nibnub' || S().guide.seen.reveal) return;
    if (modalKind) return setTimeout(storyReveal, 500);
    S().guide.seen.reveal = 1;
    openStory({ lines: REVEAL, evil: true, end: 'Fight!' });
  }
  function storyFinale() {
    if (S().guide.seen.finale) return;
    if (modalKind && modalKind !== 'council') return setTimeout(storyFinale, 500);
    if (modalKind === 'council') {
      modalKind = null;
      el.modal.hidden = true;
    }
    S().guide.seen.finale = 1;
    S().guide.seen.story = 1;
    openStory({ lines: FINALE, choice: true, end: '' });
  }
  function storyEnd() {
    const q = storyQ;
    storyQ = null;
    modalKind = null;
    el.modal.hidden = true;
    el.modal.classList.remove('cine');
    el.dlg.innerHTML = '';
    save();
    if (q && q.then) q.then();
    else if (S().council) openCouncil();
  }
  el.dlg.addEventListener('click', (e) => {
    if (modalKind !== 'story' || !storyQ) return;
    const b = e.target.closest('[data-st]');
    if (!b) return;
    e.stopPropagation();
    SFX.ensure();
    const act = b.dataset.st;
    if (act === 'next' && finishSay(el.dlg.querySelector('.story'))) return;
    if (act === 'next') {
      if (storyQ.i < storyQ.lines.length - 1) {
        storyQ.i++;
        storyPage();
      } else storyEnd();
      return;
    }
    // either button breaks time: the green one was the red one all along
    const red = act === 'red';
    storyQ = { i: 0, lines: [red ? 'YOU PRESSED THE RED ONE!' : 'That... was the red one. Nib Nub painted the buttons the wrong colours. Oops.'].concat(AFTER), end: 'Fix the timeline' };
    flashT = 1.4;
    flashCol = '#ff4a3a';
    shake = 1.2;
    SFX.play('boom');
    SFX.play('bosscast');
    storyPage();
  }, true);

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
      // a save from before the guide: skip what this player has clearly already learned
      if (!saved.guide && CW.state().best > 6) TIPS.forEach((x) => { if (['Basics', 'Army'].includes(x.sec) || ['boss', 'council', 'special', 'team', 'position', 'codex'].includes(x.id)) CW.state().guide.seen[x.id] = 1; });
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
  const start = (d) => Promise.all([CW.bodiesReady, CW.customReady]).then(() => boot(d));
  if (hot && hot.ready) hot.ready(start);
  else start((hot && hot.data) || {});
})();
