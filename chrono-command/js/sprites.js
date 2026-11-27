/* Chrono Command — leader sprites.
   Every leader is a chibi battle sprite: big head and hair, large eyes, a 3/4 action pose with an oversized weapon,
   banded light-to-shadow shading and dark outlines. Each is drawn pixel by pixel on a 64x64 grid from the leader's
   recipe in data.js, plus the signature props in SIG below that make each famous figure recognisable. */
(function (G) {
  'use strict';
  const CW = G.CW;
  const N = 64;
  const LX = 0.55; // light comes from the top left
  const LY = 0.83;

  // ---------------------------------------------------------------- colour
  function rgb(h) {
    h = h.replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const hex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  const lift = (c, k) => c.map((v, i) => v + ([255, 246, 228][i] - v) * k);
  const sink = (c, k) => c.map((v, i) => v * (1 - k) + [30, 18, 44][i] * k * 0.4);
  const shade = (h, k) => hex(k >= 0 ? lift(rgb(h), k) : sink(rgb(h), -k));
  const mats = new Map();
  // four tones per colour (light, base, shadow, deep shadow) plus a dark line colour for outlines
  function mat(h) {
    let m = mats.get(h);
    if (!m) {
      const b = rgb(h);
      m = { t: [lift(b, 0.3), b, sink(b, 0.24), sink(b, 0.45)], line: sink(b, 0.74) };
      mats.set(h, m);
    }
    return m;
  }

  // ---------------------------------------------------------------- a tiny rasteriser with per-part shading
  function Buf() {
    this.c = new Float32Array(N * N * 3);
    this.l = new Float32Array(N * N * 3);
    this.id = new Int16Array(N * N);
    this.ol = new Uint8Array(N * N);
    this.n = 1;
  }
  const part = (B) => B.n++;
  const lit = (nx, ny, o) => -(nx * LX + ny * LY) * (o.gain === undefined ? 1 : o.gain) + (o.bias === undefined ? 0.16 : o.bias);
  function put(B, x, y, m, lv, id, o) {
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    if (o.clip && !o.clip(x, y)) return;
    const i = y * N + x;
    const t = o.tone !== undefined ? o.tone : lv > 0.5 ? 0 : lv > -0.12 ? 1 : lv > -0.55 ? 2 : 3;
    const c = m.t[t];
    B.c[i * 3] = c[0];
    B.c[i * 3 + 1] = c[1];
    B.c[i * 3 + 2] = c[2];
    B.l[i * 3] = m.line[0];
    B.l[i * 3 + 1] = m.line[1];
    B.l[i * 3 + 2] = m.line[2];
    B.id[i] = id;
    B.ol[i] = o.noOL ? 0 : 1;
  }
  function ell(B, cx, cy, rx, ry, h, id, o) {
    o = o || {};
    const m = mat(h);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x + 0.5 - cx) / rx;
        const ny = (y + 0.5 - cy) / ry;
        if (nx * nx + ny * ny <= 1) put(B, x, y, m, lit(nx, ny, o), id, o);
      }
  }
  // a limb or pole: a segment with a radius that can taper
  function cap(B, x1, y1, x2, y2, r1, r2, h, id, o) {
    o = o || {};
    const m = mat(h);
    const dx = x2 - x1;
    const dy = y2 - y1;
    const L2 = dx * dx + dy * dy || 1;
    const R = Math.max(r1, r2);
    for (let y = Math.floor(Math.min(y1, y2) - R); y <= Math.ceil(Math.max(y1, y2) + R); y++)
      for (let x = Math.floor(Math.min(x1, x2) - R); x <= Math.ceil(Math.max(x1, x2) + R); x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        let t = ((px - x1) * dx + (py - y1) * dy) / L2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const vx = px - (x1 + dx * t);
        const vy = py - (y1 + dy * t);
        const r = r1 + (r2 - r1) * t;
        const d = Math.sqrt(vx * vx + vy * vy);
        if (d <= r) put(B, x, y, m, lit(vx / r, vy / r, o), id, o);
      }
  }
  function inside(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  function poly(B, pts, h, id, o) {
    o = o || {};
    const m = mat(h);
    let x0 = 99;
    let x1 = -99;
    let y0 = 99;
    let y1 = -99;
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const hw = Math.max(1, (x1 - x0) / 2);
    const hh = Math.max(1, (y1 - y0) / 2);
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++)
      for (let x = Math.floor(x0); x <= Math.ceil(x1); x++)
        if (inside(pts, x + 0.5, y + 0.5)) put(B, x, y, m, lit(((x + 0.5 - cx) / hw) * 0.85, ((y + 0.5 - cy) / hh) * 0.85, o), id, o);
  }
  // detail pixels: eyes, mouths, buttons, stripes. They never get outlined.
  function dot(B, x, y, h) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= N || y >= N) return;
    const i = y * N + x;
    const c = typeof h === 'string' ? rgb(h) : h;
    B.c[i * 3] = c[0];
    B.c[i * 3 + 1] = c[1];
    B.c[i * 3 + 2] = c[2];
    if (!B.id[i]) {
      B.id[i] = 9999;
      B.l[i * 3] = c[0] * 0.3;
      B.l[i * 3 + 1] = c[1] * 0.3;
      B.l[i * 3 + 2] = c[2] * 0.3;
    }
    B.ol[i] = 0;
  }
  const dots = (B, pts, h) => pts.forEach(([x, y]) => dot(B, x, y, h));
  const isSet = (B, x, y) => x >= 0 && y >= 0 && x < N && y < N && B.id[y * N + x] > 0;
  // darken a pixel already drawn (folds, seams)
  function deepen(B, x, y, k) {
    if (!isSet(B, x, y)) return;
    const i = y * N + x;
    for (let j = 0; j < 3; j++) B.c[i * 3 + j] = B.c[i * 3 + j] * (1 - k) + B.l[i * 3 + j] * k;
  }

  // edges: a part's border against something behind it gets a dark line, and the whole figure gets a dark outline
  function finish(B) {
    const out = new Uint8ClampedArray(N * N * 4);
    const nb = [-1, 1, -N, N];
    for (let i = 0; i < N * N; i++) {
      const id = B.id[i];
      if (!id) continue;
      let r = B.c[i * 3];
      let g = B.c[i * 3 + 1];
      let b = B.c[i * 3 + 2];
      if (B.ol[i]) {
        const x = i % N;
        let edge = false;
        for (const d of nb) {
          const j = i + d;
          if (j < 0 || j >= N * N || (d === -1 && x === 0) || (d === 1 && x === N - 1)) continue;
          const nid = B.id[j];
          if (nid > 0 && nid < id) edge = true;
        }
        if (edge) {
          r = r * 0.3 + B.l[i * 3] * 0.7;
          g = g * 0.3 + B.l[i * 3 + 1] * 0.7;
          b = b * 0.3 + B.l[i * 3 + 2] * 0.7;
        }
      }
      out[i * 4] = r;
      out[i * 4 + 1] = g;
      out[i * 4 + 2] = b;
      out[i * 4 + 3] = 255;
    }
    for (let i = 0; i < N * N; i++) {
      if (B.id[i]) continue;
      const x = i % N;
      let best = null;
      let bl = 1e9;
      for (const d of nb) {
        const j = i + d;
        if (j < 0 || j >= N * N || (d === -1 && x === 0) || (d === 1 && x === N - 1) || !B.id[j]) continue;
        const s = B.l[j * 3] + B.l[j * 3 + 1] + B.l[j * 3 + 2];
        if (s < bl) {
          bl = s;
          best = j;
        }
      }
      if (best === null) continue;
      out[i * 4] = B.l[best * 3] * 0.55 + 10;
      out[i * 4 + 1] = B.l[best * 3 + 1] * 0.55 + 6;
      out[i * 4 + 2] = B.l[best * 3 + 2] * 0.55 + 14;
      out[i * 4 + 3] = 255;
    }
    return out;
  }

  // ---------------------------------------------------------------- signature props: what makes each figure recognisable
  // cape, shield, pipe, book, sash, tie, tail, sack, orb, corgi, handcoat (Napoleon's hand in his waistcoat), fist, eyeliner...
  const SIG = {
    sun_tzu: { scroll: '#c8a868' },
    leonidas: { cape: '#a8241c', shield: { c: '#c9973a', e: '#a8241c', mark: 'lambda' } },
    spartacus: { shield: { c: '#8a5a2a', e: '#c9973a', shape: 'small' } },
    alexander: { cape: '#6a2a7a' },
    caesar: { cape: '#a8241c' },
    cleopatra: { kohl: 1, armband: '#d9b45a' },
    hannibal: { cape: '#3a2a6a' },
    qin: { cape: '#1a1a1a' },
    boudica: { cape: '#2a5a2a' },
    charlemagne: { cape: '#a8241c', orb: '#d9b45a' },
    ragnar: { shield: { c: '#7a5a34', e: '#c8a040', shape: 'round' } },
    harald: { shield: { c: '#2a4a8a', e: '#d9b45a', shape: 'round' } },
    william: { shield: { c: '#c8a040', e: '#a8241c', shape: 'kite' } },
    richard: { shield: { c: '#a8241c', e: '#d9b45a', shape: 'kite' }, cape: '#e8e4dc' },
    joan: { banner: '#e8e4dc' },
    genghis: { cape: '#5a3a1a' },
    vlad: { cape: '#5a0a12' },
    mansa_musa: { orb: '#ffd23f' },
    elizabeth1: { pearls: 1 },
    peter: { cape: '#1a3a2a' },
    catherine: { cape: '#f0ece4', ermine: 1, orb: '#d9b45a' },
    washington: { cape: '#1a2a5a' },
    robespierre: { sash: '#2a4a9a' },
    napoleon: { handcoat: 1, sash: '#e8e4dc' },
    bolivar: { sash: '#e8c84a' },
    shaka: { shield: { c: '#f0ece4', e: '#1a1a1a', shape: 'oval' } },
    lincoln: { tall: 1 },
    bismarck: { cape: '#1a1a1a' },
    wilhelm: { cape: '#1a1a1a' },
    lenin: { fist: 1 },
    gandhi: { glasses: 1 },
    churchill: { cigar: 1, vsign: 1 },
    stalin: { pipe: 1 },
    fdr: { cape: '#1a2a4a' },
    mao: { book: '#c8102e' },
    castro: { cigar: 1 },
    mlk: { tie: '#2a2a2a' },
    pinochet: { cape: '#4a4a52' },
    gaddafi: { sash: '#2a8a3a' },
    amin: { sash: '#c8102e' },
    mandela: { fist: 1 },
    elizabeth2: { corgi: 1, pearls: 1 },
    trump: { tie: '#c8102e', longtie: 1 },
    obama: { tie: '#2a4a8a' },
    jfk: { tie: '#2a2a3a' },
    putin: { tie: '#5a1a1a' },
    santa: { sack: '#8a5a2a' },
    devil: { tail: '#a8141c', cape: '#2a0808' },
    exterminator: { shades: 1 },
    saladin: { cape: '#e8e4dc' },
    suleiman: { cape: '#2a6a3a' },
    timur: { cape: '#3a2a5a' },
    mehmed: { cape: '#a8241c' },
    frederick: { cape: '#2a3a6a' },
    nelson: { sash: '#1a2a5a' },
    kim_jong_un: {},
    zelensky: {},
    archon: { cape: '#ffe86a' },
    cosmickhan: { cape: '#2ee6ff' },
    empress: { cape: '#9ad8ff' },
    admiral: { cape: '#1a1a2a' },
  };

  // ---------------------------------------------------------------- the figure
  const LONG = new Set(['robe', 'dress', 'ruff', 'cloak', 'wraith', 'void', 'toga']);
  const BARE_ARMS = new Set(['collar', 'pelt', 'shawl']);
  // the pose (facing right): the head is big, the body small, legs apart, the front arm thrust out with the weapon
  const P = {
    head: [30, 15],
    shL: [25.5, 31], elbL: [22.5, 36.5], hndL: [24, 42],
    shR: [37, 31], elbR: [41, 35.5], hndR: [46, 39.5],
    hipL: [28.5, 42.5], kneeL: [24.5, 50], ankL: [21.5, 57],
    hipR: [34.5, 42.5], kneeR: [38.5, 49.5], ankR: [40.5, 57],
  };

  function outfit(o, oc, ac, skin, era) {
    const d = { torso: oc, sleeve: oc, pants: shade(oc, -0.25), boots: '#2a2220', bootTop: 53, bareArms: false, bareLegs: false, skirt: null, skirtTo: 0, belt: null };
    switch (o) {
      case 'suit':
        Object.assign(d, { pants: shade(oc, -0.1), boots: '#16161a', bootTop: 56 });
        break;
      case 'jacket':
        Object.assign(d, { pants: '#2c3448', boots: '#2a2420', bootTop: 56 });
        break;
      case 'uniform':
        Object.assign(d, { pants: shade(oc, -0.18), boots: '#18141a', bootTop: 50, belt: '#2a1e14' });
        break;
      case 'maosuit':
        Object.assign(d, { pants: oc, boots: '#18181a', bootTop: 56 });
        break;
      case 'fatigues':
        Object.assign(d, { pants: shade(oc, -0.1), boots: '#2a2418', bootTop: 52, belt: '#3a2e1a' });
        break;
      case 'coat':
        Object.assign(d, { pants: '#e6e0d0', boots: '#141216', bootTop: 49 });
        break;
      case 'armor':
        if (era <= 2) Object.assign(d, { pants: skin, bareLegs: true, boots: '#6a4a2a', bootTop: 54, skirt: ac, skirtTo: 48, sleeve: skin, bareArms: true });
        else Object.assign(d, { pants: shade(oc, -0.2), boots: shade(oc, -0.3), bootTop: 51, belt: '#3a2a1a' });
        break;
      case 'plate':
      case 'tabard':
        Object.assign(d, { pants: oc, boots: shade(oc, -0.2), bootTop: 52 });
        break;
      case 'mail':
        Object.assign(d, { pants: '#4a3a2a', boots: '#3a2a1a', bootTop: 52, belt: '#3a2a1a' });
        break;
      case 'leather':
        Object.assign(d, { sleeve: '#d8ccb0', pants: '#4a3424', boots: '#3a2818', bootTop: 51, belt: '#2a1a10' });
        break;
      case 'samurai':
        Object.assign(d, { pants: '#2a2a3a', boots: '#3a2a1a', bootTop: 56, skirt: shade(oc, -0.1), skirtTo: 48 });
        break;
      case 'robe':
        Object.assign(d, { skirt: oc, skirtTo: 58.5, boots: '#2a1e14', bootTop: 58 });
        break;
      case 'cloak':
        Object.assign(d, { skirt: oc, skirtTo: 58.5, boots: '#2a1e14', bootTop: 58 });
        break;
      case 'dress':
      case 'ruff':
        Object.assign(d, { skirt: oc, skirtTo: 59.5, boots: '#2a1e14', bootTop: 59 });
        break;
      case 'toga':
        Object.assign(d, { torso: '#efebe0', sleeve: skin, bareArms: true, skirt: '#efebe0', skirtTo: 55, pants: skin, bareLegs: true, boots: '#7a5a34', bootTop: 56 });
        break;
      case 'collar':
        Object.assign(d, { torso: skin, sleeve: skin, bareArms: true, skirt: '#f2eee2', skirtTo: 48, pants: skin, bareLegs: true, boots: '#b08850', bootTop: 57 });
        break;
      case 'shawl':
        Object.assign(d, { torso: skin, sleeve: skin, bareArms: true, skirt: '#f2eee6', skirtTo: 53, pants: skin, bareLegs: true, boots: '#7a5a34', bootTop: 57 });
        break;
      case 'pelt':
        Object.assign(d, { torso: skin, sleeve: skin, bareArms: true, skirt: oc, skirtTo: 48.5, pants: skin, bareLegs: true, boots: shade(oc, -0.15), bootTop: 54 });
        break;
      case 'fur':
        Object.assign(d, { skirt: oc, skirtTo: 50, pants: '#3a2a1a', boots: '#3a2a1a', bootTop: 52 });
        break;
      case 'madiba':
        Object.assign(d, { pants: '#2a2a30', boots: '#18181a', bootTop: 56 });
        break;
      case 'santa':
        Object.assign(d, { torso: '#c8102e', sleeve: '#c8102e', pants: '#b80e28', boots: '#141214', bootTop: 51, belt: '#141214' });
        break;
      case 'silver':
        Object.assign(d, { pants: shade(oc, -0.15), boots: shade(oc, -0.3), bootTop: 51 });
        break;
      case 'wraith':
      case 'void':
        Object.assign(d, { skirt: oc, skirtTo: 60, boots: oc, bootTop: 60 });
        break;
    }
    return d;
  }

  function figure(id, variant) {
    const L = CW.LEADER[id];
    const p = L.pt;
    const sg = SIG[id] || {};
    const echo = variant === 'echo';
    const B = new Buf();
    const headKind = p.head || 'human';
    const skin = echo ? '#aeb8cc' : p.sk || '#e2ad80';
    const hair = p.hr || '#2a1a12';
    const oc = p.oc || '#555555';
    const ac = p.ac || '#d9b45a';
    const o = p.out || 'suit';
    const D = outfit(o, oc, ac, skin, L.era);
    const wpn = CW.weaponOf(id);
    const hs = p.hs || 'short';
    const hat = p.hat || '';
    const [HX, HY] = P.head;
    const eyeC = p.eyes || (echo ? '#2ee6ff' : ['#d9b45a', '#e9e6df', '#b5501f', '#8b3a1e', '#9c9c9c'].includes(hair) ? '#3f7fc4' : '#7a4624');
    const glow = !!(p.eyes || echo);

    // ---- behind the body: cape, long hair, sack, tail, flag poles
    if (sg.cape || o === 'cloak') {
      const cc = sg.cape || oc;
      const id1 = part(B);
      poly(B, [[26, 28], [36, 28], [33, 40], [28, 52], [20, 58], [12, 56], [8, 50], [14, 44], [20, 34]], cc, id1, { gain: 0.8 });
      if (sg.ermine) for (let i = 0; i < 6; i++) dot(B, 12 + i * 2.4, 54 - (i % 2), '#1a1a1a');
    }
    if (sg.tail) {
      const t = part(B);
      cap(B, 26, 44, 16, 52, 1, 0.8, sg.tail, t);
      cap(B, 16, 52, 11, 46, 0.8, 0.8, sg.tail, t);
      poly(B, [[9, 42], [14, 45], [9, 48]], sg.tail, t);
    }
    if (sg.sack) {
      const s = part(B);
      ell(B, 18, 34, 7, 8, sg.sack, s, { bias: 0.25 });
      cap(B, 22, 28, 26, 31, 1.2, 1.2, shade(sg.sack, -0.2), s);
      dot(B, 13, 32, '#d8102e');
      dot(B, 15, 30, '#2a8a3a');
    }
    const longHair = ['long', 'longwavy', 'bob', 'powdered', 'wild', 'updo', 'bouffant'].includes(hs) && headKind === 'human' && !['nemes', 'kabuto', 'greek', 'spacehelm'].includes(hat);
    if (longHair && hs !== 'updo') {
      const h = part(B);
      const to = hs === 'bob' ? 28 : hs === 'powdered' ? 30 : hs === 'wild' ? 32 : 38;
      poly(B, [[19, 14], [28, 10], [29, 24], [27, to], [22, to + 1], [18, to - 3], [17, 22]], hair, h, { gain: 0.9 });
      if (hs === 'longwavy' || hs === 'wild') {
        ell(B, 18.5, to - 5, 3, 4, hair, h);
        ell(B, 21, to - 1, 3, 3, hair, h);
      }
    }
    if (hat === 'nemes') {
      const n = part(B);
      poly(B, [[20, 14], [27, 14], [28, 34], [20, 32]], p.hc || '#d9b45a', n, { gain: 0.6 });
    }

    // ---- the far arm (holding a shield, a book, a sceptre, or tucked into the waistcoat)
    const sleeve = D.bareArms ? skin : D.sleeve;
    const armB = part(B);
    if (sg.handcoat) {
      cap(B, P.shL[0], P.shL[1], 26, 36, 2.6, 2.4, sleeve, armB);
      cap(B, 26, 36, 30, 35, 2.4, 2.2, sleeve, armB);
    } else {
      cap(B, P.shL[0], P.shL[1], P.elbL[0], P.elbL[1], 2.6, 2.3, sleeve, armB);
      cap(B, P.elbL[0], P.elbL[1], P.hndL[0], P.hndL[1] - 1, 2.3, 2.1, sleeve, armB);
      ell(B, P.hndL[0], P.hndL[1], 2.1, 2.1, skin, part(B));
    }
    if (sg.shield) {
      const s = part(B);
      const sc = sg.shield.c;
      const shape = sg.shield.shape || 'round';
      if (shape === 'kite') poly(B, [[14, 31], [26, 31], [26, 40], [20, 50], [14, 40]], sc, s, { gain: 0.9 });
      else if (shape === 'oval') ell(B, 20, 40, 5.5, 10, sc, s);
      else if (shape === 'small') ell(B, 21, 39, 5, 5, sc, s);
      else ell(B, 20, 38.5, 8, 8, sc, s, { bias: 0.25 });
      const e = sg.shield.e;
      if (sg.shield.mark === 'lambda') {
        for (let i = 0; i < 6; i++) {
          dot(B, 20 - i * 0.6, 35 + i, e);
          dot(B, 20 + i * 0.6, 35 + i, e);
        }
      } else if (shape === 'kite') {
        for (let y = 33; y < 46; y++) dot(B, 20, y, e);
        for (let x = 16; x < 25; x++) dot(B, x, 37, e);
      } else if (shape === 'oval') {
        for (let y = 32; y < 49; y++) if (y % 4 < 2) dot(B, 20, y, e);
        dots(B, [[18, 36], [22, 42], [17, 44], [22, 34]], e);
      } else {
        ell(B, shape === 'small' ? 21 : 20, shape === 'small' ? 39 : 38.5, 2, 2, e, part(B), { noOL: true });
      }
    }
    if (sg.scroll) {
      const s = part(B);
      cap(B, 21, 44, 28, 41, 1.6, 1.6, sg.scroll, s);
      dots(B, [[23, 43], [25, 42]], shade(sg.scroll, -0.4));
    }
    if (sg.orb) {
      ell(B, P.hndL[0] - 1, P.hndL[1] - 2.5, 2.6, 2.6, sg.orb, part(B), { bias: 0.3 });
      dot(B, P.hndL[0] - 1, P.hndL[1] - 6, sg.orb);
    }

    // ---- legs
    const legs = (hip, knee, ank, foot, fr) => {
      const lg = part(B);
      const pc = D.bareLegs ? skin : D.pants;
      cap(B, hip[0], hip[1], knee[0], knee[1], 3.4, 3, pc, lg);
      cap(B, knee[0], knee[1], ank[0], ank[1], 3, 2.4, pc, lg);
      const bt = part(B);
      if (D.bootTop < 57) {
        const k = (D.bootTop - knee[1]) / (ank[1] - knee[1]);
        const bx = knee[0] + (ank[0] - knee[0]) * Math.max(0, k);
        cap(B, bx, Math.max(knee[1], D.bootTop), ank[0], ank[1], 2.9, 2.6, D.boots, bt);
      }
      ell(B, foot[0], foot[1], fr, 2.3, D.boots, bt, { bias: 0.2 });
      if (D.bareLegs && D.bootTop >= 54) for (let y = D.bootTop; y < 58; y += 2) deepen(B, Math.round(ank[0]), y, 0.5);
    };
    if (o !== 'wraith' && o !== 'void') {
      legs(P.hipL, P.kneeL, P.ankL, [20.5, 59.4], 3.3);
      if (!LONG.has(o) || o === 'toga') legs(P.hipR, P.kneeR, P.ankR, [42.5, 59.4], 3.8);
    }

    // ---- torso
    const tor = part(B);
    poly(B, [[24.5, 29], [37.5, 29], [39.5, 32.5], [38, 40.5], [25.5, 40.5], [23.5, 33]], D.torso, tor, { gain: 0.75 });
    poly(B, [[25.5, 39], [37.5, 39], [38.5, 44.5], [24.5, 44.5]], D.skirt && D.skirtTo < 50 ? D.skirt : D.bareLegs ? D.torso : D.pants, tor, { gain: 0.6 });
    // skirts, robes and coat tails
    if (D.skirt) {
      const sk = part(B);
      const to = D.skirtTo;
      if (to > 52) {
        const flare = o === 'dress' || o === 'ruff' ? 4 : 2.5;
        poly(B, [[25, 38.5], [38, 38.5], [41 + flare, to], [36, to + 0.8], [26, to + 0.8], [19 - flare, to]], D.skirt, sk, { gain: 0.7 });
        for (let x = 24; x < 42; x += 5) for (let y = 46; y < to; y++) if ((y + x) % 7 < 1) deepen(B, x + (y - 46) * 0.15, y, 0.35);
        if (o !== 'wraith' && o !== 'void') {
          ell(B, 41.5, to + 0.2, 3.6, 1.9, D.boots, part(B), { bias: 0.25 });
        } else {
          // ragged hem, floating
          for (let x = 20; x < 44; x += 3) poly(B, [[x, to - 1], [x + 3, to - 1], [x + 1.5, to + 2.5]], D.skirt, sk);
        }
        if (o === 'robe' || o === 'cloak') {
          for (let y = 30; y < to; y++) dot(B, 32 + (y - 30) * 0.12, y, shade(ac, -0.05));
        }
      } else {
        poly(B, [[24.5, 39], [38.5, 39], [41, to], [22, to]], D.skirt, sk, { gain: 0.7 });
        if (o === 'armor' || o === 'samurai') for (let x = 24; x < 41; x += 3) for (let y = 41; y < to; y++) deepen(B, x, y, 0.45);
        if (o === 'pelt' || o === 'fur') for (let x = 22; x < 41; x += 3) poly(B, [[x, to - 1], [x + 3, to - 1], [x + 1.5, to + 2]], D.skirt, sk);
      }
    } else if (o === 'coat' || o === 'fur') {
      const ct = part(B);
      poly(B, [[24.5, 39], [27.5, 39], [24, 52], [20.5, 51]], D.torso, ct, { gain: 0.6 });
    }
    // chest details by outfit
    const T = (x, y, c) => dot(B, x, y, c);
    switch (o) {
      case 'suit':
      case 'jacket': {
        const shirt = o === 'jacket' ? ac : '#f2efe8';
        poly(B, [[30.5, 29], [35, 29], [33.2, 36.5]], shirt, part(B), { noOL: true, bias: 0.4 });
        if (sg.tie || o === 'suit') {
          const tc = sg.tie || ac;
          const len = sg.longtie ? 43 : 37;
          for (let y = 30; y < len; y++) {
            T(32.6, y, tc);
            if (y > 31) T(33.6, y, shade(tc, -0.2));
          }
        }
        for (let y = 30; y < 38; y++) {
          deepen(B, 30 - (y - 30) * 0.05, y, 0.4);
          deepen(B, 35.5 + (y - 30) * 0.1, y, 0.4);
        }
        break;
      }
      case 'uniform':
      case 'maosuit':
      case 'fatigues':
      case 'silver':
      case 'madiba': {
        for (let y = 30; y < 40; y += 2.5) T(33, y, o === 'silver' ? ac : shade(ac, 0.1));
        if (o === 'uniform') {
          ell(B, 25.5, 30.2, 3, 1.6, ac, part(B));
          ell(B, 37.2, 30.2, 3, 1.6, ac, part(B));
          for (let x = 30; x < 36; x++) T(x, 29, shade(oc, -0.35));
        }
        if (o === 'maosuit') {
          for (let x = 28; x < 31; x++) T(x, 33, shade(oc, -0.35));
          for (let x = 35; x < 38; x++) T(x, 33, shade(oc, -0.35));
          for (let x = 31; x < 35; x++) T(x, 29, shade(oc, -0.35));
        }
        if (o === 'fatigues')
          for (let i = 0; i < 14; i++) {
            const x = 25 + ((i * 7) % 13);
            const y = 30 + ((i * 5) % 10);
            if (isSet(B, x, y)) T(x, y, shade(oc, -0.3));
          }
        if (o === 'silver') for (let y = 30; y < 40; y++) T(29, y, ac);
        if (o === 'madiba')
          for (let i = 0; i < 18; i++) {
            const x = 25 + ((i * 5) % 13);
            const y = 30 + ((i * 3) % 11);
            if (isSet(B, x, y)) T(x, y, i % 2 ? ac : shade(ac, -0.3));
          }
        break;
      }
      case 'coat':
        for (let y = 30; y < 40; y++) {
          T(31.5 + (y > 34 ? 0 : 0), y, shade(ac, 0));
          T(34.5, y, shade(ac, -0.15));
        }
        poly(B, [[31.8, 30], [34.2, 30], [34.2, 40], [31.8, 40]], '#e6e0d0', part(B), { noOL: true, bias: 0.4 });
        for (let y = 31; y < 40; y += 2) T(31.2, y, '#d9b45a');
        break;
      case 'armor':
      case 'plate':
      case 'tabard':
      case 'mail': {
        if (o === 'mail') for (let y = 30; y < 44; y++) for (let x = 24; x < 39; x++) if ((x + y) % 2 === 0) deepen(B, x, y, 0.28);
        ell(B, 25, 31, 3.4, 2.6, o === 'armor' && L.era <= 2 ? ac : oc, part(B), { bias: 0.3 });
        if (o === 'tabard') {
          poly(B, [[27, 31], [36, 31], [37, 45], [26, 45]], ac, part(B), { gain: 0.5 });
          for (let y = 33; y < 44; y++) T(31.5, y, oc);
          for (let x = 28; x < 35; x++) T(x, 36, oc);
        }
        if (o === 'armor' || o === 'plate') {
          for (let y = 31; y < 39; y++) T(31.5, y, shade(oc, 0.35));
          for (let x = 26; x < 38; x++) deepen(B, x, 35, 0.3);
        }
        break;
      }
      case 'leather':
        poly(B, [[30.5, 29], [34, 29], [33, 39], [31, 39]], '#d8ccb0', part(B), { noOL: true, bias: 0.3 });
        for (let i = 0; i < 9; i++) T(26 + i, 30 + i, ac);
        break;
      case 'samurai':
        for (let y = 31; y < 40; y += 2) for (let x = 25; x < 39; x++) if (isSet(B, x, y)) T(x, y, x % 3 === 0 ? ac : shade(oc, -0.3));
        ell(B, 25, 31, 3.6, 2.6, oc, part(B), { bias: 0.25 });
        break;
      case 'toga':
        for (let i = 0; i < 14; i++) T(26 + i * 0.85, 30 + i, ac);
        break;
      case 'collar':
        for (let r = 0; r < 3; r++) for (let x = 26; x < 38; x++) T(x, 30 + r, r === 1 ? '#2a6aa8' : ac);
        for (let x = 25; x < 39; x++) T(x, 39.5, ac);
        break;
      case 'shawl':
        poly(B, [[24, 29], [30, 29], [38, 40], [33, 41], [24, 34]], '#f2eee6', part(B), { gain: 0.6 });
        break;
      case 'pelt':
        poly(B, [[24, 29], [31, 29], [38, 38], [34, 41], [24, 36]], oc, part(B), { gain: 0.6 });
        for (let i = 0; i < 6; i++) T(27 + i * 1.6, 32 + i * 1.3, shade(oc, -0.3));
        break;
      case 'dress':
      case 'ruff':
      case 'robe':
      case 'cloak':
        for (let y = 30; y < 40; y++) T(31.5, y, shade(ac, -0.05));
        break;
      case 'santa':
        for (let y = 30; y < 45; y++) T(32, y, '#f4f0ea');
        break;
      case 'void':
        for (let i = 0; i < 12; i++) {
          const x = 24 + ((i * 7) % 18);
          const y = 31 + ((i * 11) % 26);
          if (isSet(B, x, y)) T(x, y, i % 3 ? '#ffffff' : ac);
        }
        break;
    }
    if (D.belt) for (let x = 25; x < 39; x++) if (isSet(B, x, 40)) T(x, 40, D.belt);
    if (D.belt) T(31.5, 40, '#d9b45a');
    if (sg.sash) for (let i = 0; i < 12; i++) {
      T(26 + i, 30 + i * 0.85, sg.sash);
      T(27 + i, 30 + i * 0.85, shade(sg.sash, -0.2));
    }
    if (p.medals) {
      const mc = ['#d9b45a', '#c8102e', '#2a6aa8', '#e8e4dc'];
      const n = Math.min(8, p.medals * 3);
      for (let i = 0; i < n; i++) T(26 + (i % 4), 32 + Math.floor(i / 4) * 2, mc[i % 4]);
    }
    if (sg.pearls || p.pearls) for (let x = 29; x < 36; x++) T(x, 30 + (x === 32 ? 1 : 0), '#f4f0ea');
    if (o === 'ruff') {
      const r = part(B);
      ell(B, 31.5, 29.5, 8, 2.8, '#f6f3ee', r, { bias: 0.3 });
      for (let x = 24; x < 40; x += 2) dot(B, x, 30, '#d8d4cc');
    }
    if (o === 'fur' || o === 'santa' || sg.ermine) {
      const f = part(B);
      cap(B, 24.5, 30, 38.5, 30, 1.6, 1.6, o === 'santa' || sg.ermine ? '#f4f0ea' : ac, f, { bias: 0.3 });
      if (o === 'santa') cap(B, 32, 30, 32, 45, 1.2, 1.2, '#f4f0ea', f);
    }
    if (sg.armband) {
      ell(B, P.shL[0] - 1, 34, 2.4, 1.2, sg.armband, part(B));
    }

    // ---- neck and head
    const hd = part(B);
    if (headKind === 'human') cap(B, 32, 26, 32.5, 30, 2.2, 2.2, skin, hd, { bias: -0.3 });

    if (headKind === 'alien') {
      ell(B, HX + 1, HY + 1, 11, 11.5, skin, hd, { bias: 0.25 });
      ell(B, 33, 18, 3, 4.5, '#0a0a10', part(B), { noOL: true, tone: 1 });
      ell(B, 39, 18.5, 2, 4, '#0a0a10', part(B), { noOL: true, tone: 1 });
      dots(B, [[32, 16], [38, 16]], '#9affd0');
    } else if (headKind === 'screen') {
      poly(B, [[19, 5], [42, 5], [43, 27], [18, 27]], p.hc || '#3a3f4a', hd, { gain: 0.7 });
      poly(B, [[21, 7.5], [40, 7.5], [40.5, 24], [20.5, 24]], '#06181a', part(B), { tone: 1, noOL: true });
      const e = p.sk || '#2ee6ff';
      for (let x = 25; x < 29; x++) dot(B, x, 14, e);
      for (let x = 33; x < 37; x++) dot(B, x, 14, e);
      for (let x = 27; x < 35; x++) dot(B, x, 20, e);
      for (let y = 9; y < 24; y += 2) for (let x = 21; x < 40; x += 3) if (Math.random() < 0.15) dot(B, x, y, shade(e, -0.6));
    } else if (headKind === 'insect') {
      ell(B, HX + 1, HY + 1, 10, 11, skin, hd, { bias: 0.2 });
      ell(B, 25, 14, 4, 5, '#a8141c', part(B), { bias: 0.4 });
      ell(B, 37, 14, 4, 5, '#a8141c', part(B), { bias: 0.4 });
      cap(B, 30, 24, 27, 30, 1, 0.6, shade(skin, -0.3), part(B));
      cap(B, 34, 24, 37, 30, 1, 0.6, shade(skin, -0.3), part(B));
      cap(B, 26, 6, 21, -1, 0.7, 0.5, skin, part(B));
      cap(B, 35, 6, 40, -1, 0.7, 0.5, skin, part(B));
    } else if (headKind === 'hood') {
      poly(B, [[18, 26], [20, 8], [30, 2], [41, 8], [43, 26], [37, 29], [24, 29]], p.oc || '#1a1420', hd, { gain: 0.8 });
      ell(B, 31.5, 18, 7, 8, '#050308', part(B), { tone: 1, noOL: true });
      const e = p.eyes || '#7dffb0';
      dots(B, [[28, 17], [29, 17], [34, 17], [35, 17]], e);
    } else {
      // a human head: skull, hair, face, features
      const bald = ['bald', 'none', 'balding', 'buzz', 'top'].includes(hs);
      ell(B, HX, HY - 1, 11.2, 10.2, bald || hs === 'none' ? skin : hair, hd, { bias: bald ? 0.25 : 0.1 });
      ell(B, 32.3, 18.5, 8.2, 8.4, skin, hd, { bias: 0.3, gain: 0.8 });
      poly(B, [[26, 22], [40.6, 20], [39.4, 25.5], [35.5, 28.8], [30.5, 28], [27, 25.5]], skin, hd, { bias: 0.3, gain: 0.7 });
      if (p.jaw) poly(B, [[26, 23], [40, 23], [39, 28], [29, 29]], skin, hd, { bias: 0.15, gain: 0.6 });
      if (!longHair || hs === 'bob') ell(B, 24.2, 19.5, 1.9, 2.7, skin, part(B), { bias: 0.1 });
      if (p.ears === 'pointy') poly(B, [[22, 15], [25, 17], [25, 22], [23, 21]], skin, part(B));
      // hair on top of the head
      if (!bald && hs !== 'none') {
        const h = part(B);
        const top = hs === 'slick' || hs === 'neat' || hs === 'side' ? 11.5 : 12.5;
        ell(B, HX, HY - 2, 11.8, 9.6, hair, h, { clip: (x, y) => y < top || (x < 26 && y < 23) || (x < 28 && y < 15), bias: 0.08 });
        const spikes = (list, len) =>
          list.forEach(([x, y, tx, ty]) => poly(B, [[x, y], [x + 5, y - 0.5], [tx, ty]], hair, h, { gain: 0.7 }));
        if (hs === 'short' || hs === 'wild' || hs === 'curly' || hs === 'wavy' || hs === 'long' || hs === 'longwavy' || hs === 'bob' || hs === 'bun' || hs === 'updo' || hs === 'bouffant')
          spikes([[24.5, 10, 27.5, 14.5], [28.5, 10, 32, 14.5], [32.5, 10, 35.5, 14], [36, 10.5, 40.5, 13.5]]);
        if ((hs === 'short' || hs === 'wild') && !hat) spikes([[19, 11, 14.5, 13]]);
        if (hs === 'wild' && !hat) spikes([[19, 6, 14.5, 3.5], [23, 3.5, 21, -1], [29, 2.6, 30, -2], [35, 3.5, 39, 0]]);
        if (hs === 'wild' && !hat) spikes([[38, 7, 45, 6], [18, 12, 12, 15]]);
        if (hs === 'curly' || hs === 'wavy' || hs === 'bouffant')
          for (const [x, y] of [[21, 7], [26, 4.5], [32, 4], [37.5, 6], [40.5, 10], [19, 13]]) ell(B, x, y, 3.4, 3, hair, h);
        if (hs === 'side' || hs === 'neat' || hs === 'slick') {
          poly(B, [[21, 9], [41, 9], [41.5, 13], [36, 12], [28, 12.5], [22, 14]], hair, h, { gain: 0.6 });
          for (let x = 23; x < 40; x += 3) dot(B, x, 8, shade(hair, 0.35));
        }
        if (hs === 'swoop') {
          poly(B, [[19, 10], [26, 3], [36, 3], [43, 8], [44, 13], [38, 11], [32, 12.5], [26, 14], [20, 16]], hair, h, { gain: 0.7 });
          for (let x = 26; x < 40; x += 2) dot(B, x, 5, shade(hair, 0.35));
        }
        if (hs === 'powdered') {
          ell(B, 21.5, 19, 3.2, 2.4, hair, h);
          ell(B, 21.5, 23.5, 3.2, 2.4, hair, h);
          cap(B, 19, 22, 16, 28, 1.2, 1, '#1a1a1a', part(B));
        }
        if (hs === 'bun' || hs === 'updo') ell(B, 22, 5.5, 4, 3.6, hair, h);
        if (hs === 'bob') poly(B, [[38, 10], [42.5, 12], [42, 24], [39, 23]], hair, h, { gain: 0.7 });
        if (hs === 'long' || hs === 'longwavy') poly(B, [[24, 13], [27, 13], [27, 30], [23.5, 31]], hair, h, { gain: 0.7 });
        // a band of shine across the hair, broken into clumps
        const shine = shade(hair, hair === '#1d1714' || hair === '#3b2618' ? 0.42 : 0.36);
        for (let x = 21; x < 39; x++) {
          if ((x - 21) % 5 === 4) continue;
          const y = Math.round(6.6 + ((x - 29) * (x - 29)) / 34);
          for (const yy of [y, y + 1]) if (isSet(B, x, yy) && B.id[yy * N + x] === h) dot(B, x, yy, shine);
        }
        for (let x = 22; x < 38; x += 5) if (isSet(B, x, 11) && B.id[11 * N + x] === h) dot(B, x, 11, shade(hair, -0.3));
      } else if (hs === 'top') {
        const h = part(B);
        ell(B, HX + 1, 6.5, 10, 4.8, hair, h, { bias: 0.15 });
        poly(B, [[24, 8], [40.5, 7], [41.5, 11.5], [34, 10.5], [26, 11]], hair, h, { gain: 0.6 });
        for (let y = 11; y < 20; y++) for (let x = 19; x < 27; x++) if (isSet(B, x, y) && (x + y) % 2 === 0) dot(B, x, y, shade(skin, -0.18));
        for (let x = 27; x < 39; x += 3) dot(B, x, 5, shade(hair, 0.35));
      } else if (hs === 'balding') {
        const h = part(B);
        ell(B, 21, 15, 3, 5, hair, h);
        ell(B, 39.5, 13.5, 1.6, 3, hair, h);
      } else if (hs === 'buzz') {
        for (let y = 5; y < 13; y++) for (let x = 19; x < 42; x++) if (isSet(B, x, y) && (x + y) % 2 === 0) dot(B, x, y, shade(hair, 0.1));
        for (let y = 5; y < 12; y++) for (let x = 19; x < 42; x++) if (isSet(B, x, y) && (x + y) % 2 === 1) dot(B, x, y, shade(hair, 0.25));
      }
      if (p.mark) ell(B, 30, 7.5, 3, 1.6, typeof p.mark === 'string' ? p.mark : '#b8504a', part(B), { noOL: true, tone: 1 });
      // face
      const lash = glow ? shade(eyeC, -0.5) : '#1a1014';
      const brow = shade(p.fc || hair === '#e9e6df' ? '#9c9c9c' : hair, -0.35);
      // near eye (larger) and far eye (narrower): dark lash on top, iris, a bright glint
      const irisTop = shade(eyeC, -0.42);
      const irisLow = shade(eyeC, 0.3);
      // tall anime eyes: a heavy lash line, an iris shaded dark to light, a white glint
      const eye = (x, w) => {
        for (let i = -1; i <= w; i++) dot(B, x + i, 16, lash);
        dot(B, x + w, 15, lash);
        dot(B, x - 1, 17, lash);
        for (let i = 0; i < w; i++) {
          dot(B, x + i, 17, i === 0 ? '#ffffff' : irisTop);
          dot(B, x + i, 18, irisTop);
          dot(B, x + i, 19, eyeC);
          dot(B, x + i, 20, irisLow);
        }
        if (w === 3) dot(B, x + 1, 18, shade(eyeC, -0.6));
        if (sg.kohl) {
          dot(B, x + w + 1, 16, lash);
          dot(B, x + w + 1, 17, lash);
        }
      };
      eye(35, 3);
      eye(28.5, 2);
      if (glow) {
        for (const [x, w] of [[35, 3], [28.5, 2]]) for (let i = 0; i < w; i++) for (let y = 17; y < 21; y++) dot(B, x + i, y, y === 17 ? '#ffffff' : eyeC);
      }
      // brows: a determined slant
      dots(B, [[34, 14], [35, 14], [36, 13.6], [37, 13.6], [38, 13.6]], brow);
      dots(B, [[27.5, 13.6], [28.5, 13.6], [29.5, 14], [30.5, 14]], brow);
      if (p.unibrow) dots(B, [[31.5, 14], [32.5, 14], [33.5, 14]], brow);
      // nose, mouth, cheeks
      dot(B, 39.5, 22, shade(skin, -0.28));
      dot(B, 40, 21, shade(skin, -0.15));
      if (p.nose) ell(B, 39.6, 22, 1.4, 1.2, shade(skin, -0.05), part(B), { noOL: true, bias: 0.4 });
      const mouth = p.fem ? '#b8434a' : shade(skin, -0.45);
      if (p.grin) {
        dots(B, [[34, 25], [35, 25.6], [36, 25.6], [37, 25]], '#3a1418');
        dots(B, [[35, 25], [36, 25]], '#f4f0ea');
      } else dots(B, [[35, 25], [36, 25]], mouth);
      if (p.fangs) dots(B, [[35, 26], [37, 26]], '#f4f0ea');
      if (p.fem || p.rosy) dots(B, [[37, 23], [38, 23]], '#e88a86');
      if (p.cyborg) {
        poly(B, [[34, 15], [41, 14], [41, 24], [35, 24]], '#9aa0aa', part(B), { gain: 0.6 });
        dots(B, [[37, 18], [38, 18], [37, 19], [38, 19]], '#ff2a2a');
        dot(B, 39, 18, '#ffb0b0');
      }
      if (p.cosmic) for (let i = 0; i < 10; i++) {
        const x = 24 + ((i * 7) % 16);
        const y = 10 + ((i * 5) % 17);
        if (isSet(B, x, y) && !(y >= 17 && y <= 21)) dot(B, x, y, i % 2 ? '#ffffff' : '#d08aff');
      }
      if (echo) {
        for (let y = 13; y < 28; y++) dot(B, 31, y, shade(skin, -0.25));
        dot(B, 26, 24, '#2ee6ff');
      }
      // facial hair
      const fc = p.fc || hair;
      const fh = p.fh || 'none';
      const fp = part(B);
      switch (fh) {
        case 'mustache':
          poly(B, [[33.5, 22.8], [39.6, 22.6], [39.8, 23.9], [33.7, 24.1]], fc, fp, { gain: 0.5 });
          break;
        case 'toothbrush':
          poly(B, [[35, 23], [38, 23], [38, 24.6], [35, 24.6]], fc, fp, { tone: 2 });
          break;
        case 'walrus':
          poly(B, [[32, 22.5], [40.5, 22], [41, 25], [38, 26.5], [34, 26.5], [32, 25.5]], fc, fp, { gain: 0.5 });
          break;
        case 'kaiser':
          poly(B, [[31, 21], [33, 23], [40, 22.6], [42.5, 19.5], [42, 23], [39, 24.5], [33, 24.5]], fc, fp, { gain: 0.5 });
          break;
        case 'longmustache':
          poly(B, [[33, 23], [40, 22.5], [40.2, 24], [33.5, 24.5]], fc, fp, { gain: 0.5 });
          cap(B, 33.5, 24, 32.5, 30, 0.8, 0.6, fc, fp);
          cap(B, 39.5, 24, 40, 30, 0.8, 0.6, fc, fp);
          break;
        case 'goatee':
          poly(B, [[33.5, 26.2], [38, 26.2], [37, 30.5], [35, 31]], fc, fp, { gain: 0.5 });
          poly(B, [[34, 23], [39, 22.8], [39, 24], [34, 24.2]], fc, fp, { tone: 2 });
          break;
        case 'beard':
        case 'fullbeard':
        case 'longbeard':
        case 'santa': {
          const end = fh === 'beard' ? 30.5 : fh === 'fullbeard' ? 32.5 : fh === 'santa' ? 37 : 37;
          poly(B, [[25.6, 19], [27.5, 19], [30, 24], [34, 25.6], [37.5, 25.6], [40.6, 22.5], [41, 26], [38, end - 1], [34, end], [29.5, end - 1.5], [26, 27]], fc, fp, { gain: 0.75 });
          poly(B, [[32.5, 22.7], [40.4, 22.2], [40.6, 24.2], [32.8, 24.6]], fc, fp, { tone: 0 });
          dots(B, [[35, 25.2], [36, 25.2]], '#3a1418');
          for (let y = 27; y < end; y += 2) dot(B, 30 + ((y * 3) % 7), y, shade(fc, -0.3));
          break;
        }
        case 'chinstrap':
          poly(B, [[25.6, 19], [27.5, 19], [30, 26], [34, 28], [38, 27], [40.6, 24], [40.3, 27], [37.5, 31], [33, 31.5], [28.5, 29.5], [25.6, 25]], fc, fp, { gain: 0.7 });
          dot(B, 35, 25, mouth);
          dot(B, 36, 25, mouth);
          break;
        case 'sideburns':
          poly(B, [[25.5, 17], [27.5, 17], [28, 25], [26, 25]], fc, fp, { gain: 0.5 });
          break;
        case 'scruff':
        case 'stubble':
          for (let y = 22; y < 29; y++) for (let x = 27; x < 41; x++) if (isSet(B, x, y) && (x * 3 + y * 5) % 4 === 0 && !(y === 25 && (x === 35 || x === 36))) dot(B, x, y, shade(skin, -0.28));
          break;
        case 'pharaoh':
          poly(B, [[34.5, 27.5], [37, 27.5], [36.8, 33], [34.8, 33]], fc === hair ? '#2a1e14' : fc, fp, { gain: 0.5 });
          for (let y = 29; y < 33; y += 2) dot(B, 35.8, y, '#d9b45a');
          break;
      }
      // glasses
      const gl = p.gl || (sg.glasses ? 1 : sg.shades ? 2 : 0);
      if (gl === 1) {
        const gc = '#2a2a2a';
        for (const x0 of [34, 27.5]) {
          dots(B, [[x0, 16.5], [x0 + 1, 16.2], [x0 + 2, 16.2], [x0 + 3, 16.5], [x0 + 3.6, 18], [x0 + 3.6, 19.5], [x0, 18], [x0, 19.5], [x0 + 1, 21], [x0 + 2, 21], [x0 + 3, 20.8]], gc);
        }
        dots(B, [[31.5, 17.6], [32.5, 17.6]], gc);
      } else if (gl === 2) {
        const gp = part(B);
        poly(B, [[26.5, 16.5], [41, 16], [40.6, 20.4], [37, 21], [34, 20], [33, 18.5], [31, 20.2], [27.5, 20]], '#141418', gp, { gain: 0.4 });
        dots(B, [[35, 17], [36, 17], [28, 17.5]], '#7a8aa8');
      }
      // mouth props
      if (p.acc === 'cigar' || sg.cigar) {
        cap(B, 36.5, 25.5, 42, 26.5, 0.8, 0.8, '#6a3a1a', part(B));
        dot(B, 42.5, 26.5, '#ff7a2a');
        dots(B, [[43, 24], [44, 22], [43.5, 20]], '#c8c8c8');
      }
      if (sg.pipe) {
        cap(B, 36, 25.5, 40.5, 27, 0.6, 0.6, '#3a2418', part(B));
        ell(B, 41.5, 26.2, 1.4, 1.8, '#5a3420', part(B));
        dots(B, [[42, 23], [43, 21.5]], '#c8c8c8');
      }
      if (p.acc === 'holder') {
        cap(B, 36.5, 25.5, 44, 22.5, 0.4, 0.4, '#1a1a1a', part(B));
        cap(B, 44, 22.5, 46, 21.8, 0.6, 0.6, '#f4f0ea', part(B));
        dots(B, [[46.5, 20.5], [47, 19]], '#c8c8c8');
      }
      if (p.acc === 'eyepatch') {
        poly(B, [[34.5, 16.5], [38.5, 16.5], [38.5, 20.5], [34.5, 20.5]], '#141414', part(B), { tone: 1 });
        dots(B, [[24, 13], [26, 14], [28, 15], [30, 16], [32, 17], [33.5, 17.5], [39, 17], [40.5, 16]], '#141414');
      }
      if (p.acc === 'bone') cap(B, 24, 5, 35, 3, 0.9, 0.9, '#efe8d8', part(B));
    }

    // ---- hats
    const hc = p.hc || '#2a2a2a';
    const ha = p.ha || ac;
    const H = part(B);
    switch (hat) {
      case 'crown':
        poly(B, [[21, 8], [40, 8], [40, 2], [37.5, 5], [35, 0.5], [32.5, 4.5], [30, 0], [27.5, 4.5], [25, 0.5], [22.5, 5], [21, 2]], hc, H, { gain: 0.6, bias: 0.3 });
        dots(B, [[30, 5.5], [25, 6], [35.5, 6]], ha === hc ? '#c8102e' : ha);
        break;
      case 'circlet':
      case 'tiara':
        cap(B, 22, 10, 40, 9.5, 0.9, 0.9, hc, H, { bias: 0.4 });
        if (hat === 'tiara') poly(B, [[31, 9], [33, 5.5], [35, 9]], hc, H, { bias: 0.4 });
        dot(B, 33, 9, ha === hc ? '#9ad8ff' : ha);
        break;
      case 'laurel':
        for (let i = 0; i < 7; i++) {
          ell(B, 22 + i * 3, 8.5 - Math.sin((i / 6) * Math.PI) * 2.5, 1.8, 1.1, hc, H, { bias: 0.3 });
        }
        break;
      case 'greek':
        ell(B, HX, HY - 2, 12, 10.5, hc, H, { clip: (x, y) => !(x > 29 && x < 40 && y > 12 && y < 26), bias: 0.25 });
        poly(B, [[24, 1], [35, -1], [42, 6], [36, 4], [28, 3]], ha, part(B), { gain: 0.6 });
        for (let x = 24; x < 40; x += 2) dot(B, x, 1.5, shade(ha, -0.3));
        break;
      case 'nasal':
      case 'spike':
        poly(B, [[19, 13], [21, 6], [30, -1], [40, 6], [42, 13]], hc, H, { gain: 0.8, bias: 0.25 });
        if (hat === 'nasal') cap(B, 36.5, 12, 37, 21, 0.9, 0.9, hc, H);
        for (let x = 20; x < 42; x++) if (isSet(B, x, 12)) dot(B, x, 12, shade(hc, -0.3));
        break;
      case 'nemes':
        poly(B, [[19, 16], [21, 6], [30, 3], [40, 6], [42, 13], [38, 12], [26, 12.5], [24, 20]], hc, H, { gain: 0.6 });
        for (let y = 6; y < 30; y += 2) for (let x = 19; x < 42; x++) if (isSet(B, x, y) && B.id[y * N + x] === H) dot(B, x, y, ha);
        break;
      case 'uraeus':
        cap(B, 22, 10, 40, 9.5, 0.9, 0.9, '#d9b45a', H, { bias: 0.4 });
        cap(B, 34, 9, 35, 5, 0.9, 0.7, '#d9b45a', H, { bias: 0.4 });
        break;
      case 'bicorne':
        poly(B, [[14, 9], [22, 3], [32, 1], [42, 3], [48, 9], [40, 10], [24, 10.5]], hc, H, { gain: 0.6 });
        ell(B, 36, 5.5, 1.8, 1.8, ha === hc ? '#c8102e' : ha, part(B));
        for (let x = 16; x < 47; x++) if (isSet(B, x, 9) && B.id[9 * N + x] === H) dot(B, x, 9, '#d9b45a');
        break;
      case 'tricorne':
        poly(B, [[17, 10], [22, 2.5], [30, 4.5], [39, 2.5], [45, 10], [36, 9], [30, 11], [24, 9]], hc, H, { gain: 0.6 });
        for (let x = 18; x < 45; x++) if (isSet(B, x, 9)) dot(B, x, 9, '#d9b45a');
        break;
      case 'tophat':
        poly(B, [[23, 8], [38, 8], [37, -4], [24, -4]], hc, H, { gain: 0.7 });
        cap(B, 18.5, 8.5, 42.5, 8.5, 1.3, 1.3, hc, H);
        for (let x = 24; x < 38; x++) dot(B, x, 6, ha === hc ? '#5a5a5a' : ha);
        break;
      case 'peaked':
      case 'patrol':
      case 'kepi': {
        const tall = hat === 'kepi' ? -1 : hat === 'patrol' ? 2 : 0;
        poly(B, [[20, 10], [21, 4 + tall], [31, 1.5 + tall], [41, 3 + tall], [42, 10]], hc, H, { gain: 0.7 });
        if (hat === 'peaked') poly(B, [[18.5, 5], [31, 0], [43.5, 3], [42, 6], [31, 4], [20, 7]], hc, H, { gain: 0.6, bias: 0.3 });
        poly(B, [[32, 9.5], [44.5, 9], [45, 11], [33, 11.5]], '#141418', part(B), { gain: 0.5 });
        for (let x = 21; x < 42; x++) if (isSet(B, x, 8) && B.id[8 * N + x] === H) dot(B, x, 8, hat === 'peaked' ? ha : shade(hc, -0.3));
        dot(B, 33, 5, ha === hc ? '#d9b45a' : ha);
        dot(B, 34, 5, ha === hc ? '#d9b45a' : ha);
        break;
      }
      case 'beret':
        ell(B, HX + 1, 6.5, 12, 4.6, hc, H, { bias: 0.2 });
        dot(B, 35, 6, ha === hc ? '#e8c84a' : ha);
        break;
      case 'helmet':
        ell(B, HX, 8.5, 12.5, 7.5, hc, H, { clip: (x, y) => y < 12, bias: 0.25 });
        cap(B, 17, 11.5, 43, 11, 1, 1, hc, H);
        if (p.ha) cap(B, 21, 9, 40, 9, 0.6, 0.6, p.ha, part(B));
        break;
      case 'pickel':
        ell(B, HX, 8.5, 11.5, 7, hc, H, { clip: (x, y) => y < 12, bias: 0.25 });
        poly(B, [[29, 3], [32, 3], [30.5, -3]], ha === hc ? '#d9b45a' : ha, part(B), { bias: 0.4 });
        poly(B, [[32, 10], [44, 10], [44, 12], [33, 12.2]], '#141418', part(B));
        dot(B, 34, 7, '#d9b45a');
        break;
      case 'campaign':
        poly(B, [[14, 10], [21, 7], [24, 1], [31, -1], [37, 1], [40, 7], [48, 10], [40, 11.5], [22, 11.5]], hc, H, { gain: 0.6 });
        for (let x = 24; x < 38; x++) dot(B, x, 6.5, shade(hc, -0.35));
        break;
      case 'flatcap':
        poly(B, [[20, 10], [21, 4.5], [32, 2.5], [41, 5], [44, 9.5], [35, 10.5]], hc, H, { gain: 0.6 });
        break;
      case 'fur':
        ell(B, HX, 7, 12, 6.5, hc, H, { bias: 0.25 });
        for (let x = 19; x < 42; x += 2) dot(B, x, 4 + (x % 3), shade(hc, 0.3));
        if (p.ha) cap(B, 19.5, 11, 41, 11, 1.4, 1.4, p.ha, part(B));
        break;
      case 'mongol':
        poly(B, [[19, 11], [24, 3], [30, -2], [37, 3], [42, 11]], hc, H, { gain: 0.7 });
        cap(B, 18.5, 11, 42.5, 11, 1.8, 1.8, ha === hc ? '#7a5a3a' : ha, part(B), { bias: 0.3 });
        dot(B, 30, -1, '#d9b45a');
        break;
      case 'turban':
      case 'bigturban': {
        const big = hat === 'bigturban';
        ell(B, HX + 0.5, big ? 4.5 : 6, big ? 13 : 11.5, big ? 8 : 6.5, hc, H, { bias: 0.3 });
        for (let i = 0; i < 4; i++) cap(B, 20 + i * 2, 9 - i * 2.5, 38 - i, 3 + i * 1.5, 0.4, 0.4, shade(hc, -0.25), part(B), { noOL: true });
        ell(B, 34, big ? 5 : 6.5, 1.5, 1.8, ha === hc ? '#c8102e' : ha, part(B), { bias: 0.4 });
        break;
      }
      case 'tallcap':
        poly(B, [[21, 9], [40, 9], [39, -4], [22, -4]], hc, H, { gain: 0.6 });
        for (let x = 22; x < 40; x++) dot(B, x, 5, ha);
        for (let x = 22; x < 40; x++) dot(B, x, 0, ha);
        break;
      case 'mian':
        cap(B, 22, 8, 40, 8, 2, 2, hc, H);
        poly(B, [[17, 3], [45, 1], [45, 3], [17, 5]], hc, H, { gain: 0.5 });
        for (const x of [18, 20, 42, 44]) for (let y = 5; y < 14; y += 2) dot(B, x, y, ha === hc ? '#d9b45a' : ha);
        break;
      case 'kabuto':
        ell(B, HX, HY - 3, 12.2, 9.5, hc, H, { clip: (x, y) => y < 12 || x < 25, bias: 0.25 });
        poly(B, [[16, 12], [26, 11], [26, 18], [15, 17]], hc, H, { gain: 0.6 });
        poly(B, [[28, 4], [24, -4], [30, 1], [34, 1], [40, -4], [36, 4]], ha, part(B), { bias: 0.3 });
        for (let y = 13; y < 18; y += 2) for (let x = 16; x < 26; x++) if (isSet(B, x, y)) dot(B, x, y, shade(hc, -0.35));
        break;
      case 'princecap':
        ell(B, HX + 2, 5.5, 7, 3.5, hc, H, { bias: 0.3 });
        dot(B, 32, 4, ha);
        break;
      case 'band':
        cap(B, 19.5, 11, 41.5, 10.5, 1.2, 1.2, hc, H, { bias: 0.3 });
        cap(B, 19.5, 11, 13, 17, 0.9, 0.6, hc, H);
        cap(B, 19.5, 11.5, 14, 20, 0.9, 0.6, hc, H);
        break;
      case 'plume':
        poly(B, [[17, 10], [22, 4], [31, 2], [40, 4], [45, 10], [31, 11]], hc, H, { gain: 0.6 });
        cap(B, 24, 4, 14, -1, 1.6, 0.8, p.plume || ha, part(B), { bias: 0.3 });
        cap(B, 22, 5, 12, 3, 1.4, 0.7, p.plume || ha, part(B), { bias: 0.3 });
        break;
      case 'scarf':
        ell(B, HX, HY - 2, 12, 10.5, hc, H, { clip: (x, y) => !(x > 27 && y > 11), bias: 0.15 });
        poly(B, [[19, 18], [26, 22], [22, 32], [17, 30]], hc, H, { gain: 0.6 });
        break;
      case 'monomakh':
        ell(B, HX, 6, 11, 5, hc, H, { bias: 0.4 });
        cap(B, 19.5, 10.5, 41, 10.5, 1.8, 1.8, ha === hc ? '#4a3a2a' : ha, part(B), { bias: 0.2 });
        cap(B, 30, 1.5, 30, -3, 0.6, 0.6, '#d9b45a', part(B));
        cap(B, 28.5, -1.5, 31.5, -1.5, 0.5, 0.5, '#d9b45a', part(B));
        break;
      case 'leopard':
        poly(B, [[21, 10], [21, 2], [40, 2], [40, 10]], hc, H, { gain: 0.6 });
        for (let i = 0; i < 12; i++) dot(B, 22 + ((i * 7) % 18), 3 + ((i * 3) % 7), '#2a1a10');
        break;
      case 'santa':
        poly(B, [[20, 10], [28, 1], [36, 0], [42, 4], [46, 12], [43, 13], [40, 8], [41, 10]], '#c8102e', H, { gain: 0.7 });
        cap(B, 19, 10.5, 42, 10.5, 1.8, 1.8, '#f4f0ea', part(B), { bias: 0.3 });
        ell(B, 45.5, 13, 2.2, 2.2, '#f4f0ea', part(B), { bias: 0.3 });
        break;
      case 'horns':
        poly(B, [[23, 7], [26, 6], [21, -2], [18, 1]], hc, H, { bias: 0.3 });
        poly(B, [[34, 6], [37, 7], [42, 0], [40, -3]], hc, H, { bias: 0.3 });
        break;
      case 'spacehelm':
        ell(B, HX + 0.5, HY, 14, 13.5, hc, H, { clip: (x, y) => !(x > 26 && y > 10 && y < 27), bias: 0.2 });
        for (let y = 10; y < 27; y++) {
          if (isSet(B, 26, y)) dot(B, 26, y, shade(hc, 0.4));
          if (isSet(B, 26.5, y)) dot(B, 25, y, shade(hc, -0.3));
        }
        if (p.ha) dot(B, 22, 9, p.ha);
        break;
      case 'shards':
        for (let i = 0; i < 5; i++) poly(B, [[20 + i * 4.5, 9], [22 + i * 4.5, 9], [21 + i * 4.5 + (i - 2) * 0.6, i % 2 ? 1 : -3]], hc, H, { bias: 0.35 });
        break;
    }

    // ---- the near arm, holding the weapon (drawn last so it sits in front)
    const W = wpn;
    const handX = P.hndR[0];
    const handY = P.hndR[1];
    const wp = part(B);
    const steel = '#c8ccd8';
    const wood = '#7a4a24';
    const gold = '#d9b45a';
    const blade = (x1, y1, x2, y2, w, c) => {
      cap(B, x1, y1, x2, y2, w, 0.5, c, wp, { bias: 0.25 });
      const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1));
      for (let i = 2; i < n - 2; i++) dot(B, x1 + ((x2 - x1) * i) / n - 0.5, y1 + ((y2 - y1) * i) / n - 0.5, shade(c, 0.45));
    };
    switch (W) {
      case 'sword':
      case 'katana':
      case 'scimitar': {
        const c = W === 'katana' ? '#dfe4ea' : steel;
        if (W === 'scimitar') {
          cap(B, 48, 42, 55, 50, 1.6, 1.8, c, wp, { bias: 0.25 });
          cap(B, 55, 50, 61, 52, 1.8, 0.4, c, wp, { bias: 0.25 });
        } else blade(47.5, 41.5, 61, 57, W === 'katana' ? 1.2 : 1.6, c);
        cap(B, 43, 43, 49, 37.5, 0.9, 0.9, W === 'katana' ? '#1a1a1a' : gold, wp, { bias: 0.3 });
        cap(B, 44.5, 37.5, 42.5, 35, 0.9, 0.9, W === 'katana' ? '#2a2a3a' : '#5a3a1a', wp);
        break;
      }
      case 'axe':
        cap(B, 44, 45, 52, 24, 1, 1, wood, wp);
        poly(B, [[50, 22], [57, 18], [59, 25], [56, 31], [51, 28]], steel, wp, { bias: 0.25 });
        for (let y = 20; y < 30; y++) dot(B, 58 - Math.abs(y - 24.5) * 0.3, y, '#ffffff');
        break;
      case 'spear':
        cap(B, 38, 52, 58, 18, 0.8, 0.8, wood, wp);
        poly(B, [[56, 19], [62, 11], [59, 21]], steel, wp, { bias: 0.3 });
        break;
      case 'bow':
        cap(B, 47, 24, 50, 32, 1, 1, wood, wp);
        cap(B, 50, 32, 50, 47, 1, 1, wood, wp);
        cap(B, 50, 47, 47, 55, 1, 1, wood, wp);
        for (let y = 25; y < 55; y++) dot(B, 46, y, '#e8e4dc');
        break;
      case 'club':
        cap(B, 44, 43, 56, 22, 1.4, 3.6, id === 'troosevelt' ? '#6a4a2a' : '#8a5a2a', wp, { bias: 0.2 });
        if (id !== 'troosevelt') dots(B, [[53, 25], [56, 28], [52, 30]], '#e8e0c8');
        break;
      case 'flag': {
        cap(B, 47, 60, 47, 6, 0.8, 0.8, wood, wp);
        dot(B, 47, 4.5, gold);
        const fcol = sg.banner || ac;
        const fl = part(B);
        poly(B, [[48, 6], [61, 7.5], [59, 12], [61.5, 16.5], [48, 15.5]], fcol, fl, { gain: 0.6 });
        for (let x = 49; x < 60; x += 2) dot(B, x, 11 + (x % 3), shade(fcol, -0.25));
        break;
      }
      case 'staff':
      case 'sceptre': {
        const walk = id === 'gandhi' || id === 'mobutu';
        cap(B, 47, walk ? 59 : 60, 47.5, walk ? 26 : 10, 0.8, 0.8, walk ? '#a8844a' : W === 'sceptre' ? gold : '#5a3a2a', wp);
        if (!walk) ell(B, 47.5, 8, 2.8, 2.8, p.eyes || (id === 'void' ? '#d08aff' : id === 'moonking' ? '#9ad8ff' : '#7dffd0'), part(B), { bias: 0.4 });
        else cap(B, 47.5, 26, 45, 24, 1, 1, '#a8844a', wp);
        break;
      }
      case 'trident':
        cap(B, 44, 58, 52, 10, 0.8, 0.8, id === 'devil' ? '#2a2a2a' : '#5a6a3a', wp);
        for (const dx of [-3, 0, 3]) cap(B, 51.5 + dx, 10 + Math.abs(dx) * 0.2, 52 + dx * 1.1, 3, 0.7, 0.4, id === 'devil' ? '#c8102e' : '#9adc5a', wp);
        cap(B, 48.5, 10, 55.5, 10.5, 0.7, 0.7, id === 'devil' ? '#c8102e' : '#9adc5a', wp);
        break;
      case 'scythe':
        cap(B, 44, 58, 51, 6, 0.8, 0.8, '#3a3a40', wp);
        cap(B, 51, 6, 42, 4, 1.6, 0.4, '#c8ccd8', wp, { bias: 0.3 });
        cap(B, 42, 4, 36, 8, 1, 0.3, '#c8ccd8', wp, { bias: 0.3 });
        break;
      case 'candy':
        cap(B, 47, 59, 47, 26, 1.2, 1.2, '#f4f0ea', wp, { bias: 0.3 });
        cap(B, 47, 26, 50, 22, 1.2, 1.2, '#f4f0ea', wp, { bias: 0.3 });
        cap(B, 50, 22, 53, 25, 1.2, 1.2, '#f4f0ea', wp, { bias: 0.3 });
        for (let y = 27; y < 59; y += 3) {
          dot(B, 46, y, '#c8102e');
          dot(B, 47, y + 1, '#c8102e');
          dot(B, 48, y + 1, '#c8102e');
        }
        break;
      case 'raygun':
        poly(B, [[46, 36], [55, 36], [57, 37.5], [55, 39], [49, 39], [48, 42], [45.5, 42]], '#6a7a8a', wp, { gain: 0.6, bias: 0.3 });
        ell(B, 58, 37.5, 1.6, 1.6, '#7dffb0', part(B), { bias: 0.5 });
        dots(B, [[50, 37], [52, 37]], '#7dffb0');
        break;
      case 'gun':
        poly(B, [[46, 36.5], [54, 36.5], [54, 38.5], [49, 38.5], [48, 42], [45.5, 42]], '#2a2a30', wp, { gain: 0.6, bias: 0.3 });
        for (let x = 47; x < 54; x++) dot(B, x, 36.5, '#6a6a74');
        break;
      case 'rifle':
        poly(B, [[34, 44], [40, 40], [62, 35.5], [62, 37], [44, 41.5], [41, 45], [36, 46.5]], '#3a2a1a', wp, { gain: 0.6, bias: 0.25 });
        for (let x = 44; x < 62; x++) dot(B, x, 36.5 + (62 - x) * 0.2, '#5a5a62');
        break;
      case 'mic':
        cap(B, 46, 39, 44, 31, 0.8, 0.8, '#2a2a2a', wp);
        ell(B, 43.6, 29.4, 2, 2, '#9aa0a8', part(B), { bias: 0.3 });
        dots(B, [[43, 29], [44, 30]], '#5a5a62');
        break;
      case 'book':
        poly(B, [[44, 35], [51, 34], [52, 42], [45, 43]], sg.book || '#c8102e', wp, { gain: 0.5, bias: 0.25 });
        for (let y = 36; y < 42; y++) dot(B, 45.2 + (y - 36) * 0.1, y, '#f4f0ea');
        break;
      case 'handbag':
        cap(B, 46, 40, 48, 33, 0.5, 0.5, '#1a1a1a', wp);
        cap(B, 48, 33, 52, 39, 0.5, 0.5, '#1a1a1a', wp);
        poly(B, [[44.5, 40], [54, 39.5], [55, 47], [44, 47.5]], '#1c1c22', part(B), { gain: 0.6, bias: 0.3 });
        dot(B, 49.5, 42, '#d9b45a');
        break;
    }
    // the near arm: sleeve and hand; V-sign, raised fist or pointing hand for some
    const armF = part(B);
    if (sg.fist) {
      cap(B, P.shR[0], P.shR[1], 41, 27, 2.6, 2.3, sleeve, armF);
      cap(B, 41, 27, 43, 20, 2.3, 2.1, sleeve, armF);
      ell(B, 43.2, 18, 2.4, 2.4, skin, part(B), { bias: 0.2 });
    } else if (sg.vsign) {
      cap(B, P.shR[0], P.shR[1], 43.5, 29, 2.6, 2.3, sleeve, armF);
      cap(B, 43.5, 29, 47.5, 23, 2.3, 2.1, sleeve, armF);
      const hh = part(B);
      ell(B, 48, 21.5, 2.2, 2.2, skin, hh, { bias: 0.2 });
      cap(B, 47, 19.5, 46, 15.5, 0.7, 0.6, skin, hh);
      cap(B, 49.2, 19.5, 50.8, 15.5, 0.7, 0.6, skin, hh);
    } else {
      cap(B, P.shR[0], P.shR[1], P.elbR[0], P.elbR[1], 2.7, 2.4, sleeve, armF);
      cap(B, P.elbR[0], P.elbR[1], handX - 1, handY - 0.5, 2.4, 2.2, sleeve, armF);
      if (o === 'santa' || o === 'fur') cap(B, P.elbR[0] + 2.6, P.elbR[1] + 2, P.elbR[0] + 3.6, P.elbR[1] + 0.2, 1.5, 1.5, '#f4f0ea', part(B), { bias: 0.3 });
      ell(B, handX, handY, 2.4, 2.4, skin, part(B), { bias: 0.2 });
      if (W === 'rifle' || W === 'gun' || W === 'raygun') dots(B, [[handX + 1, handY - 2]], shade(skin, -0.3));
    }
    // the corgi at the Queen's feet
    if (sg.corgi) {
      const cg = part(B);
      ell(B, 52, 57.5, 5, 3, '#d8843a', cg, { bias: 0.2 });
      ell(B, 57, 54.5, 2.8, 2.6, '#d8843a', cg, { bias: 0.2 });
      poly(B, [[56, 52.5], [57, 49.5], [58.5, 52.5]], '#d8843a', cg);
      dots(B, [[58, 54], [59.5, 55.5], [51, 58.5], [53, 58.5]], '#141414');
      dots(B, [[55, 56], [56, 56.5]], '#f4f0ea');
    }
    return finish(B);
  }

  // ---------------------------------------------------------------- canvases
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  const fcache = {};
  function spriteCanvas(id, variant) {
    const key = id + '|' + (variant || '');
    if (fcache[key]) return fcache[key];
    const data = figure(id, variant === 'mystery' ? '' : variant);
    const c = canvas(N, N);
    const g = c.getContext('2d');
    const img = g.createImageData(N, N);
    img.data.set(data);
    g.putImageData(img, 0, 0);
    fcache[key] = CW.plain(c);
    return fcache[key];
  }
  CW.leaderSprite = spriteCanvas;

  const QMARK = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
  const pcache = {};
  // a 64x64 card: soft backdrop in the leader's colour, a floor shadow and the full-body sprite
  CW.portrait = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (pcache[key]) return pcache[key];
    const L = CW.LEADER[id];
    const c = canvas(N, N);
    const g = c.getContext('2d');
    const bg = variant === 'mystery' ? '#2a1240' : variant === 'echo' ? '#141a2e' : L.pt.bg || '#2a2a2a';
    const grd = g.createLinearGradient(0, 0, 0, N);
    grd.addColorStop(0, shade(bg, 0.12));
    grd.addColorStop(1, shade(bg, -0.35));
    g.fillStyle = grd;
    g.fillRect(0, 0, N, N);
    g.fillStyle = 'rgba(0,0,0,.28)';
    g.beginPath();
    g.ellipse(32, 61, 18, 3, 0, 0, Math.PI * 2);
    g.fill();
    if (variant === 'mystery') {
      g.drawImage(CW.tinted(spriteCanvas(id, ''), '#0a0710'), 0, 0);
      g.fillStyle = '#e8d0ff';
      QMARK.forEach((r, y) => r.split('').forEach((k, x) => k === '#' && g.fillRect(27 + x * 2, 18 + y * 2, 2, 2)));
    } else g.drawImage(spriteCanvas(id, variant), 0, 0);
    pcache[key] = c;
    return c;
  };
  const urlCache = {};
  CW.portraitURL = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (!urlCache[key]) urlCache[key] = CW.portrait(id, variant).toDataURL();
    return urlCache[key];
  };
  // head and shoulders, for small icons
  const headCache = {};
  CW.headURL = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (!headCache[key]) {
      const c = canvas(32, 32);
      c.getContext('2d').drawImage(CW.portrait(id, variant), 14, 0, 32, 32, 0, 0, 32, 32);
      headCache[key] = c.toDataURL();
    }
    return headCache[key];
  };

  // ------------------------------------------------------------ battlefield sprite (enemies face left)
  const hcache = {};
  CW.heroSprite = function (id, side, variant) {
    const key = id + '|' + side + '|' + (variant || '');
    if (hcache[key]) return hcache[key];
    let c = spriteCanvas(id, variant);
    if (side === 'e') {
      const m = canvas(N, N);
      const g = m.getContext('2d');
      g.translate(N, 0);
      g.scale(-1, 1);
      g.drawImage(c, 0, 0);
      c = m;
    }
    const res = { c, w: N / 2, h: N / 2, flash: CW.tinted(c, '#ffffff'), shadow: CW.tinted(c, '#0a0710') };
    hcache[key] = res;
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
