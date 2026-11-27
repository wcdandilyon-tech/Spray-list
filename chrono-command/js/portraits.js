/* Chrono Command — 64x64 pixel portraits and full-body battlefield sprites for every leader.
   Each figure is designed on a 32x32 grid, then upscaled with Scale2x and finished at 64x64
   (edge lighting, cloth and hair texture, eye highlights, thin outlines). */
(function (G) {
  'use strict';
  const CW = G.CW;
  const shade = CW.shade;
  const mix = CW.mix;
  const N = 32;
  const OUT = '#120e12';
  const GOLD = '#d9b45a';
  const GOLDL = '#f2d27a';
  const WHITE = '#f4f0e8';
  const DARK = '#1a1418';
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

  // dithered gradient background with a soft halo behind the head, drawn natively at 64x64
  const S64 = 64;
  function drawBg(g, bg, variant) {
    const img = g.createImageData(S64, S64);
    const d = img.data;
    const pal = [shade(bg, 0.22), shade(bg, 0.12), shade(bg, 0.04), bg, shade(bg, -0.1), shade(bg, -0.2), shade(bg, -0.32), shade(bg, -0.45)].map(rgb);
    const n = pal.length - 1;
    for (let y = 0; y < S64; y++)
      for (let x = 0; x < S64; x++) {
        const dx = x - 31.5;
        const dy = (y - 24) * 1.1;
        let lv = (y / (S64 - 1)) * n - Math.max(0, (27 - Math.sqrt(dx * dx + dy * dy)) / 27) * 2.6;
        lv = Math.max(0, Math.min(n, lv));
        const fl = Math.floor(lv);
        const idx = Math.min(n, lv - fl > (BAYER[y % 4][x % 4] + 0.5) / 16 ? fl + 1 : fl);
        const c = pal[idx];
        const i = (y * S64 + x) * 4;
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        d[i + 3] = 255;
      }
    g.putImageData(img, 0, 0);
    if (variant === 'echo') {
      g.fillStyle = '#2ee6ff';
      [[2, 8, 12], [48, 6, 14], [4, 38, 10], [52, 34, 10]].forEach(([x, y, w]) => g.fillRect(x, y, w, 1));
      [[13, 8, 10], [48, 6, 12], [13, 38, 8], [52, 34, 12]].forEach(([x, y, h]) => g.fillRect(x, y, 1, h));
      g.fillStyle = '#aef8ff';
      [[12, 17], [47, 17], [12, 45], [51, 45]].forEach(([x, y]) => g.fillRect(x, y, 3, 3));
    }
    if (variant === 'mystery')
      [[6, 6], [54, 10], [10, 44], [56, 40], [18, 2], [44, 4], [4, 26], [58, 22]].forEach(([x, y], i) => {
        g.fillStyle = i % 2 ? '#d08aff' : '#ffffff';
        g.fillRect(x, y, 1, 1);
        g.fillStyle = 'rgba(208,138,255,.5)';
        g.fillRect(x - 1, y, 1, 1);
        g.fillRect(x + 1, y, 1, 1);
        g.fillRect(x, y - 1, 1, 1);
        g.fillRect(x, y + 1, 1, 1);
      });
    g.fillStyle = 'rgba(0,0,0,.3)';
    for (const [cx, cy, sx, sy] of [[0, 0, 1, 1], [63, 0, -1, 1], [0, 63, 1, -1], [63, 63, -1, -1]])
      for (let k = 0; k < 4; k++) g.fillRect(sx > 0 ? cx : cx - (3 - k), cy + sy * k, 4 - k, 1);
  }

  // ------------------------------------------------------------ the figure (transparent layer)
  function drawFigure(g, p, variant, headOnly) {
    const R = (x, y, w, h, c) => {
      if (w <= 0 || h <= 0) return;
      g.fillStyle = c;
      g.fillRect(x, y, w, h);
    };
    const P = (x, y, c) => R(x, y, 1, 1, c);
    const Hl = (x0, x1, y, c) => R(x0, y, x1 - x0 + 1, 1, c);
    const Vl = (x, y0, y1, c) => R(x, y0, 1, y1 - y0 + 1, c);
    const echo = variant === 'echo';
    const sk = echo ? '#aeb8cc' : p.sk;
    const skL = shade(sk, 0.14);
    const skD = shade(sk, -0.16);
    const skDD = shade(sk, -0.34);
    const hr = echo ? '#5a6478' : p.hr || '#1d1714';
    const hrL = shade(hr, 0.22);
    const hrD = shade(hr, -0.32);
    const fc = echo ? '#5a6478' : p.fc || hr;
    const fcD = shade(fc, -0.22);
    const fcL = shade(fc, 0.18);
    const oc = p.oc || '#444';
    const ocD = shade(oc, -0.25);
    const ocDD = shade(oc, -0.42);
    const ocL = shade(oc, 0.18);
    const ac = p.ac || GOLD;
    const acD = shade(ac, -0.25);
    const hc = p.hc || '#333';
    const hcD = shade(hc, -0.25);
    const hcL = shade(hc, 0.22);
    const ha = p.ha || GOLD;
    const head = p.head || 'human';
    const hs = p.hs || 'short';
    const mouthC = p.fem ? '#b0505a' : mix(skDD, '#7a2a2a', 0.35);
    const lightHair = ['#e9e6df', '#f4f0e8', '#9c9c9c'].includes(p.hr);
    const brow = echo ? '#3a4458' : lightHair ? shade(p.hr, -0.35) : hrD;

    if (head === 'human') backHair();
    if (head === 'human') {
      R(13, 20, 6, headOnly ? 4 : 6, skD);
      Hl(13, 18, 22, skDD);
    }
    if (head === 'alien') R(14, 20, 4, headOnly ? 4 : 6, skD);
    if (!headOnly) outfit();
    if (head === 'human') humanHead();
    else if (head === 'alien') alienHead();
    else if (head === 'hood') hoodHead();
    if (head === 'human') {
      topHair();
      facialHair();
    }
    if (p.cyborg) cyborg();
    if (p.cosmic) cosmic();
    glasses();
    hat();
    accessories();
    if (echo) {
      R(18, 13, 2, 2, '#ff2a2a');
      P(17, 13, '#ff8a8a');
      Vl(21, 9, 13, '#2ee6ff');
      Hl(19, 21, 16, '#2ee6ff');
      Vl(10, 15, 18, '#2ee6ff');
    }

    function humanHead() {
      const jaw = !!p.jaw;
      Hl(12, 19, 7, sk);
      Hl(11, 20, 8, sk);
      R(10, 9, 12, 10, sk);
      if (jaw) {
        Hl(10, 21, 19, sk);
        Hl(11, 20, 20, sk);
        Hl(12, 19, 21, sk);
      } else {
        Hl(11, 20, 19, sk);
        Hl(12, 19, 20, sk);
        Hl(13, 18, 21, sk);
      }
      if (p.ears === 'pointy') {
        Vl(9, 11, 16, sk);
        P(8, 10, sk);
        P(8, 11, sk);
        P(7, 9, sk);
        Vl(22, 11, 16, skD);
        P(23, 10, skD);
        P(23, 11, skD);
        P(24, 9, skD);
        P(9, 13, skD);
        P(22, 13, skDD);
      } else {
        Vl(9, 12, 16, sk);
        P(9, 13, skD);
        P(9, 14, skD);
        Vl(22, 12, 16, skD);
        P(22, 13, skDD);
        P(22, 14, skDD);
      }
      // light from the top left
      Vl(21, 10, 18, skD);
      P(20, jaw ? 20 : 19, skD);
      P(19, jaw ? 21 : 20, skD);
      Hl(jaw ? 12 : 13, jaw ? 19 : 18, 21, skD);
      Vl(11, 9, 11, skL);
      Hl(13, 15, 8, skL);
      P(12, 9, skL);
      P(12, 17, skD);
      P(19, 17, skD);
      // brows
      if (p.unibrow) {
        Hl(11, 20, 11, brow);
        Hl(12, 19, 12, skDD);
      } else if (p.ears === 'pointy') {
        P(11, 10, brow);
        P(12, 11, brow);
        P(13, 11, brow);
        P(14, 12, brow);
        P(20, 10, brow);
        P(19, 11, brow);
        P(18, 11, brow);
        P(17, 12, brow);
      } else {
        Hl(12, 14, 11, brow);
        Hl(17, 19, 11, brow);
        Hl(12, 13, 12, skD);
        Hl(18, 19, 12, skD);
      }
      // eyes
      const pupil = p.eyes || '#1a1418';
      const glow = !!p.eyes;
      P(12, 13, glow ? shade(pupil, 0.5) : WHITE);
      P(13, 13, pupil);
      P(12, 14, skD);
      P(13, 14, glow ? pupil : shade(pupil, 0.15));
      P(18, 13, pupil);
      P(19, 13, glow ? shade(pupil, 0.5) : WHITE);
      P(18, 14, glow ? pupil : shade(pupil, 0.15));
      P(19, 14, skD);
      if (p.fem) {
        P(11, 13, DARK);
        P(20, 13, DARK);
        P(11, 12, DARK);
        P(20, 12, DARK);
      }
      // nose
      if (p.nose === 'round') {
        R(15, 15, 2, 2, '#e07a6a');
        P(16, 15, '#f4a090');
        P(14, 16, skD);
        P(17, 16, skD);
      } else {
        Vl(16, 13, 15, skL);
        Vl(15, 14, 15, skD);
        P(15, 16, skDD);
        P(16, 16, skD);
        if (p.nose) {
          P(14, 15, skD);
          P(14, 16, skDD);
          P(17, 16, skD);
          Vl(16, 12, 15, skL);
        }
      }
      // mouth
      if (p.grin) {
        Hl(14, 17, 18, skDD);
        Hl(13, 18, 19, WHITE);
        Hl(14, 17, 20, skDD);
        P(13, 18, skDD);
        P(18, 18, skDD);
      } else {
        Hl(14, 17, 19, mouthC);
        Hl(15, 16, 20, p.fem ? '#d07a80' : skD);
      }
      if (p.fangs) {
        P(14, 20, WHITE);
        P(17, 20, WHITE);
      }
      if (p.rosy || p.fem) {
        const bl = p.rosy ? '#ec8a80' : '#eaa0a0';
        Hl(12, 13, 16, bl);
        Hl(18, 19, 16, bl);
      }
    }

    function alienHead() {
      const rows = [[3, 12, 19], [4, 10, 21], [5, 9, 22], [6, 8, 23], [7, 8, 23], [8, 8, 23], [9, 8, 23], [10, 8, 23], [11, 8, 23], [12, 8, 23], [13, 9, 22], [14, 9, 22], [15, 10, 21], [16, 11, 20], [17, 12, 19], [18, 12, 19], [19, 13, 18], [20, 14, 17], [21, 14, 17]];
      rows.forEach(([y, a, b]) => Hl(a, b, y, sk));
      rows.forEach(([y, a, b]) => {
        P(b, y, skD);
        if (y > 13) P(b - 1, y, skD);
      });
      Hl(12, 15, 4, skL);
      Hl(10, 12, 5, skL);
      P(9, 7, skL);
      P(9, 8, skL);
      P(14, 6, skD);
      P(17, 6, skD);
      P(15, 7, skD);
      const E = '#08080c';
      Hl(10, 12, 11, E);
      Hl(10, 14, 12, E);
      Hl(11, 14, 13, E);
      Hl(12, 14, 14, E);
      Hl(19, 21, 11, E);
      Hl(17, 21, 12, E);
      Hl(17, 20, 13, E);
      Hl(17, 19, 14, E);
      P(11, 12, '#4a5a7a');
      P(20, 12, '#4a5a7a');
      P(12, 12, '#9ab4dc');
      P(19, 12, '#9ab4dc');
      P(15, 17, skDD);
      P(16, 17, skDD);
      Hl(15, 16, 19, skDD);
    }

    function hoodHead() {
      const d = shade(hc, -0.3);
      const l = shade(hc, 0.2);
      Hl(14, 17, 1, hc);
      Hl(12, 19, 2, hc);
      Hl(10, 21, 3, hc);
      Hl(9, 22, 4, hc);
      R(8, 5, 16, 8, hc);
      R(7, 13, 18, 13, hc);
      Hl(12, 19, 8, '#050308');
      R(11, 9, 10, 12, '#050308');
      Hl(12, 19, 21, '#050308');
      Vl(9, 6, 24, l);
      Vl(22, 6, 24, d);
      Vl(10, 14, 24, d);
      Vl(21, 14, 24, d);
      Hl(12, 19, 3, l);
      const e = p.eyes || '#2ee6ff';
      P(13, 14, e);
      P(18, 14, e);
      P(12, 14, shade(e, -0.4));
      P(19, 14, shade(e, -0.4));
      P(13, 13, shade(e, -0.55));
      P(18, 13, shade(e, -0.55));
    }

    function backHair() {
      switch (hs) {
        case 'long':
          R(8, 6, 16, 20, hr);
          Vl(9, 10, 24, hrL);
          Vl(22, 10, 24, hrD);
          Hl(9, 22, 25, hrD);
          break;
        case 'longwavy':
          R(8, 6, 16, 17, hr);
          [[7, 13], [7, 18], [24, 13], [24, 18], [8, 23], [23, 23], [9, 23], [22, 23]].forEach(([x, y]) => P(x, y, hr));
          Vl(9, 10, 20, hrL);
          break;
        case 'bob':
          R(8, 5, 16, 15, hr);
          break;
        case 'curly':
          R(7, 3, 18, 14, hr);
          for (let x = 7; x <= 24; x += 2) P(x, 2, hr);
          for (let y = 4; y <= 16; y += 2) {
            P(6, y, hr);
            P(25, y, hr);
          }
          for (let y = 5; y < 16; y += 3) {
            P(8, y, hrL);
            P(23, y + 1, hrD);
          }
          break;
        case 'bouffant':
          R(7, 3, 18, 13, hr);
          Hl(9, 22, 2, hr);
          break;
        case 'updo':
          R(10, 0, 12, 7, hr);
          R(9, 4, 14, 6, hr);
          Hl(12, 16, 1, hrL);
          P(11, 3, hrL);
          break;
        case 'powdered':
          R(10, 4, 12, 8, hr);
          R(7, 11, 3, 5, hr);
          R(22, 11, 3, 5, hr);
          P(8, 12, hrD);
          P(8, 14, hrD);
          P(23, 12, hrD);
          P(23, 14, hrD);
          P(7, 11, hrL);
          P(22, 11, hrL);
          break;
        case 'bun':
          R(13, 0, 6, 5, hr);
          Hl(14, 16, 1, hrL);
          R(10, 4, 12, 5, hr);
          break;
        case 'wild':
          R(6, 4, 20, 20, hr);
          for (let y = 6; y <= 22; y += 3) {
            P(5, y, hr);
            P(26, y, hr);
          }
          for (let x = 7; x < 25; x += 3) P(x, 24, hr);
          break;
      }
    }

    function topHair() {
      const dome = () => {
        Hl(13, 18, 5, sk);
        Hl(12, 19, 6, sk);
        P(14, 5, skL);
        Hl(13, 15, 6, skL);
      };
      switch (hs) {
        case 'none':
          dome();
          break;
        case 'short':
        case 'powdered':
        case 'neat':
          Hl(12, 19, 3, hr);
          Hl(11, 20, 4, hr);
          R(10, 5, 12, 3, hr);
          Hl(10, 12, 8, hr);
          Hl(19, 21, 8, hr);
          Vl(10, 9, 12, hr);
          Vl(21, 9, 12, hr);
          Hl(13, 16, 4, hrL);
          P(12, 5, hrL);
          P(17, 6, hrD);
          P(18, 5, hrD);
          P(14, 7, hrD);
          if (hs === 'neat') {
            Vl(13, 4, 7, hrD);
            Hl(14, 19, 5, hrL);
          }
          break;
        case 'side':
          Hl(12, 19, 3, hr);
          Hl(11, 20, 4, hr);
          R(10, 5, 12, 3, hr);
          Vl(10, 8, 12, hr);
          Vl(21, 8, 12, hr);
          Hl(19, 21, 8, hr);
          Hl(11, 17, 8, hr);
          Hl(11, 15, 9, hr);
          Hl(11, 13, 10, hr);
          P(11, 11, hr);
          Vl(18, 3, 6, hrD);
          Hl(12, 16, 5, hrL);
          P(13, 4, hrL);
          break;
        case 'slick':
          Hl(12, 19, 2, hr);
          R(10, 3, 12, 5, hr);
          Hl(10, 11, 8, hr);
          Hl(20, 21, 8, hr);
          Vl(10, 9, 11, hr);
          Vl(21, 9, 11, hr);
          Hl(12, 18, 3, hrL);
          P(13, 5, hrD);
          P(16, 5, hrD);
          P(19, 5, hrD);
          Hl(11, 13, 6, hrL);
          break;
        case 'wavy':
          R(9, 2, 14, 6, hr);
          Hl(9, 13, 8, hr);
          Hl(17, 22, 8, hr);
          R(9, 9, 2, 5, hr);
          R(21, 9, 2, 5, hr);
          Hl(11, 14, 3, hrL);
          Hl(17, 19, 4, hrL);
          P(13, 6, hrD);
          P(18, 6, hrD);
          P(9, 1, hr);
          P(14, 1, hr);
          P(20, 1, hr);
          P(10, 9, hrL);
          break;
        case 'curly':
          for (let x = 10; x <= 21; x += 2) {
            P(x, 4, hrL);
            P(x + 1, 6, hrL);
          }
          Hl(10, 21, 8, hr);
          for (let x = 10; x <= 21; x += 2) P(x, 9, hr);
          break;
        case 'bald':
          dome();
          Vl(10, 10, 13, hr);
          Vl(21, 10, 13, hr);
          P(11, 10, hr);
          P(20, 10, hr);
          break;
        case 'balding':
          dome();
          Vl(10, 8, 13, hr);
          Vl(21, 8, 13, hr);
          for (let x = 12; x <= 19; x += 2) {
            P(x, 6, hr);
            P(x + 1, 7, hr);
          }
          break;
        case 'long':
        case 'longwavy':
          Hl(11, 20, 3, hr);
          R(10, 4, 12, 4, hr);
          Vl(10, 8, 19, hr);
          Vl(21, 8, 19, hr);
          P(11, 8, hr);
          P(20, 8, hr);
          Hl(13, 16, 4, hrL);
          Vl(12, 5, 7, hrL);
          P(19, 5, hrD);
          P(17, 6, hrD);
          break;
        case 'bob':
          Hl(11, 20, 3, hr);
          R(10, 4, 12, 5, hr);
          Hl(10, 21, 9, hr);
          R(8, 9, 2, 11, hr);
          R(22, 9, 2, 11, hr);
          for (let x = 11; x <= 20; x += 2) P(x, 9, hrD);
          Hl(12, 15, 4, hrL);
          P(9, 11, hrL);
          break;
        case 'bouffant':
          R(9, 3, 14, 6, hr);
          R(8, 9, 3, 8, hr);
          R(21, 9, 3, 8, hr);
          Hl(11, 16, 4, hrL);
          P(10, 5, hrL);
          P(9, 10, hrL);
          P(15, 8, hrD);
          P(18, 7, hrD);
          break;
        case 'updo':
          R(10, 5, 12, 3, hr);
          Hl(12, 18, 6, hrL);
          break;
        case 'bun':
          Hl(11, 20, 3, hr);
          R(10, 4, 12, 4, hr);
          Vl(10, 8, 9, hr);
          Vl(21, 8, 9, hr);
          Hl(12, 15, 4, hrL);
          break;
        case 'swoop':
          Hl(11, 19, 2, hr);
          Hl(10, 21, 3, hr);
          R(9, 4, 14, 4, hr);
          Hl(9, 19, 8, hr);
          Hl(9, 15, 9, hr);
          Hl(9, 11, 10, hr);
          Vl(9, 11, 12, hr);
          Vl(22, 8, 11, hr);
          Hl(11, 17, 4, hrL);
          Hl(12, 15, 5, hrL);
          Hl(14, 18, 7, hrL);
          P(20, 5, hrD);
          P(21, 6, hrD);
          P(16, 9, hrD);
          break;
        case 'buzz':
          Hl(12, 19, 4, hr);
          R(10, 5, 12, 3, hr);
          Vl(10, 8, 11, hr);
          Vl(21, 8, 11, hr);
          for (let y = 4; y <= 7; y++) for (let x = 10 + (y % 2); x <= 21; x += 2) P(x, y, hrD);
          break;
        case 'wild':
          R(8, 2, 16, 7, hr);
          [[8, 1], [11, 0], [11, 1], [14, 1], [17, 0], [17, 1], [20, 1], [23, 1], [7, 3], [24, 3]].forEach(([x, y]) => P(x, y, hr));
          for (let x = 10; x <= 21; x++) if (x % 3 !== 0) P(x, 9, hr);
          [11, 14, 17, 20].forEach((x) => P(x, 10, hr));
          R(7, 9, 3, 10, hr);
          R(22, 9, 3, 10, hr);
          P(6, 12, hr);
          P(25, 12, hr);
          P(6, 16, hr);
          P(25, 16, hr);
          for (let i = 0; i < 12; i++) P(9 + ((i * 7) % 14), 3 + ((i * 5) % 6), hrL);
          break;
      }
    }

    function facialHair() {
      const fh = p.fh;
      if (!fh || fh === 'none') return;
      const mus = () => {
        Hl(13, 18, 17, fc);
        P(12, 18, fc);
        P(19, 18, fc);
        P(15, 17, fcL);
      };
      switch (fh) {
        case 'mustache':
          mus();
          break;
        case 'toothbrush':
          R(15, 17, 2, 2, fc);
          break;
        case 'walrus':
          Hl(12, 19, 17, fc);
          Hl(12, 19, 18, fc);
          P(12, 19, fc);
          P(19, 19, fc);
          P(13, 16, fc);
          P(18, 16, fc);
          P(14, 18, fcD);
          P(17, 18, fcD);
          P(15, 17, fcL);
          break;
        case 'kaiser':
          Hl(13, 18, 17, fc);
          P(12, 16, fc);
          P(19, 16, fc);
          P(11, 15, fc);
          P(20, 15, fc);
          P(11, 14, fc);
          P(20, 14, fc);
          break;
        case 'longmustache':
          Hl(13, 18, 17, fc);
          Vl(12, 18, 23, fc);
          Vl(19, 18, 23, fc);
          break;
        case 'goatee':
          mus();
          R(14, 20, 4, 3, fc);
          Hl(15, 16, 23, fc);
          P(15, 21, fcD);
          break;
        case 'beard':
        case 'fullbeard':
        case 'scruff': {
          const cells = [];
          const add = (x0, x1, y) => {
            for (let x = x0; x <= x1; x++) cells.push([x, y]);
          };
          for (let y = 12; y <= 18; y++) {
            cells.push([10, y]);
            cells.push([21, y]);
          }
          for (let y = 17; y <= 21; y++) add(11, 20, y);
          add(12, 19, 22);
          add(13, 18, 23);
          if (fh === 'fullbeard') {
            for (let y = 22; y <= 25; y++) add(11, 20, y);
            add(12, 19, 26);
            add(13, 18, 27);
          }
          cells.forEach(([x, y]) => {
            if (fh === 'scruff' && (x + y) % 2) return;
            P(x, y, (x * 3 + y) % 5 === 0 ? fcD : fc);
          });
          Hl(14, 17, 19, mouthC);
          Hl(15, 16, 20, fh === 'scruff' ? skD : fcD);
          Hl(13, 18, 17, fcL);
          P(12, 18, fc);
          P(19, 18, fc);
          break;
        }
        case 'longbeard':
          Vl(10, 12, 18, fc);
          Vl(21, 12, 18, fc);
          R(11, 17, 10, 13, fc);
          Hl(12, 19, 30, fc);
          Hl(14, 17, 19, mouthC);
          for (let y = 21; y <= 29; y += 2) Hl(11, 20, y, fcD);
          Hl(13, 18, 17, fcL);
          break;
        case 'chinstrap':
          Vl(10, 13, 19, fc);
          Vl(21, 13, 19, fc);
          R(11, 20, 10, 3, fc);
          Hl(12, 19, 23, fc);
          Hl(13, 18, 24, fc);
          Hl(14, 17, 20, fcD);
          break;
        case 'sideburns':
          Vl(10, 9, 18, fc);
          Vl(21, 9, 18, fc);
          P(11, 18, fc);
          P(20, 18, fc);
          break;
        case 'stubble':
          for (let y = 18; y <= 21; y++) for (let x = 11 + (y % 2); x <= 20; x += 2) if (!(y === 19 && x >= 14 && x <= 17)) P(x, y, skDD);
          break;
        case 'pharaoh':
          R(15, 22, 2, 7, '#2a3a8a');
          P(15, 23, GOLD);
          P(16, 25, GOLD);
          P(15, 27, GOLD);
          break;
        case 'santa':
          R(9, 16, 14, 12, fc);
          Hl(10, 21, 28, fc);
          Hl(12, 19, 29, fc);
          Hl(14, 17, 30, fc);
          Vl(9, 11, 15, fc);
          Vl(22, 11, 15, fc);
          P(8, 16, fc);
          P(23, 16, fc);
          for (let i = 0; i < 16; i++) P(10 + ((i * 5) % 12), 19 + ((i * 3) % 10), fcD);
          Hl(11, 20, 17, '#ffffff');
          P(10, 18, fc);
          P(21, 18, fc);
          P(9, 17, '#ffffff');
          P(22, 17, '#ffffff');
          Hl(15, 16, 19, '#9a3a3a');
          break;
      }
    }

    function cyborg() {
      const M = '#9aa0ac';
      const MD = '#5a606c';
      for (let y = 8; y <= 20; y++) {
        const x0 = 16 + ((y * 7) % 3);
        Hl(x0, 21, y, M);
        P(x0, y, '#b04a4a');
      }
      Vl(21, 9, 19, MD);
      Hl(17, 21, 11, MD);
      Hl(17, 21, 17, MD);
      P(18, 9, '#d0d4dc');
      P(19, 15, '#d0d4dc');
      R(18, 13, 2, 2, '#ff2a2a');
      P(17, 13, '#ff8a8a');
      P(19, 13, '#ffd0d0');
      R(11, 12, 4, 3, '#0e0e12');
      P(12, 12, '#5a5a6e');
      Hl(15, 16, 13, '#0e0e12');
    }

    function cosmic() {
      [[12, 9, '#ffffff'], [19, 10, '#d08aff'], [14, 18, '#ffffff'], [20, 16, '#ffffff'], [11, 15, '#d08aff'], [17, 8, '#ffffff'], [13, 20, '#d08aff']].forEach(([x, y, c]) => P(x, y, c));
      R(12, 13, 2, 2, '#ffffff');
      R(18, 13, 2, 2, '#ffffff');
      P(11, 13, '#d08aff');
      P(20, 13, '#d08aff');
    }

    function glasses() {
      if (p.gl === 1) {
        const fr = '#2a2a2a';
        Hl(12, 13, 12, fr);
        Hl(12, 13, 15, fr);
        Vl(11, 13, 14, fr);
        Vl(14, 13, 14, fr);
        Hl(18, 19, 12, fr);
        Hl(18, 19, 15, fr);
        Vl(17, 13, 14, fr);
        Vl(20, 13, 14, fr);
        Hl(15, 16, 13, fr);
        P(10, 13, fr);
        P(21, 13, fr);
        P(12, 13, '#cfe4f4');
        P(19, 13, '#cfe4f4');
      }
      if (p.gl === 2 && !p.cyborg) {
        const b = '#0e0e12';
        R(11, 12, 4, 3, b);
        R(17, 12, 4, 3, b);
        Hl(15, 16, 13, b);
        P(10, 12, b);
        P(21, 12, b);
        P(12, 12, '#5a5a6e');
        P(18, 12, '#5a5a6e');
      }
    }

    function hat() {
      switch (p.hat) {
        case 'crown':
          R(10, 4, 12, 3, hc);
          Hl(10, 21, 4, hcL);
          Hl(10, 21, 6, hcD);
          [[10, 1], [10, 2], [10, 3], [13, 2], [13, 3], [15, 0], [16, 0], [15, 1], [16, 1], [15, 2], [16, 2], [15, 3], [16, 3], [18, 2], [18, 3], [21, 1], [21, 2], [21, 3]].forEach(([x, y]) => P(x, y, hc));
          P(10, 1, hcL);
          P(15, 0, hcL);
          P(21, 1, hcL);
          P(12, 5, '#d0303a');
          R(15, 5, 2, 1, '#2a9a5a');
          P(19, 5, '#3a6ad0');
          break;
        case 'circlet':
          Hl(10, 21, 6, hc);
          Hl(10, 21, 7, hcD);
          R(15, 5, 2, 2, '#d0303a');
          break;
        case 'tiara':
          R(12, 3, 8, 3, hc);
          R(15, 1, 2, 2, hc);
          Hl(12, 19, 5, hcD);
          P(15, 3, '#d0303a');
          P(13, 4, '#3a6ad0');
          P(18, 4, '#3a6ad0');
          P(15, 1, hcL);
          break;
        case 'laurel': {
          const ll = shade(hc, 0.25);
          for (let x = 11; x <= 20; x++) P(x, 5 + (x % 2), x % 2 ? hc : ll);
          [[10, 7], [9, 8], [10, 9], [9, 10], [21, 7], [22, 8], [21, 9], [22, 10]].forEach(([x, y], i) => P(x, y, i % 2 ? ll : hc));
          P(10, 6, hc);
          P(21, 6, hc);
          break;
        }
        case 'greek':
          R(8, 2, 16, 8, hc);
          Hl(10, 21, 1, hc);
          R(8, 10, 3, 10, hc);
          R(21, 10, 3, 10, hc);
          R(15, 10, 2, 6, hc);
          Vl(8, 2, 19, hcD);
          Vl(23, 2, 19, hcD);
          Hl(10, 14, 3, hcL);
          Hl(11, 13, 4, hcL);
          Hl(8, 23, 9, hcD);
          R(6, 0, 20, 2, ha);
          for (let x = 6; x <= 25; x += 2) P(x, 0, shade(ha, 0.3));
          P(5, 1, ha);
          P(26, 1, ha);
          break;
        case 'nasal':
          R(15, 1, 2, 1, hc);
          Hl(13, 18, 2, hc);
          Hl(12, 19, 3, hc);
          R(10, 4, 12, 5, hc);
          R(15, 9, 2, 7, hc);
          Hl(12, 14, 4, hcL);
          Hl(10, 21, 8, hcD);
          P(11, 6, hcD);
          P(20, 6, hcD);
          break;
        case 'spike':
          R(10, 3, 12, 6, hc);
          Hl(11, 20, 2, hc);
          R(15, 0, 2, 2, ha);
          Hl(10, 21, 8, ha);
          Vl(9, 9, 20, hcD);
          Vl(22, 9, 20, hcD);
          for (let y = 10; y <= 20; y += 2) {
            P(9, y, hcL);
            P(22, y, hcL);
          }
          Hl(12, 14, 4, hcL);
          break;
        case 'nemes':
          R(8, 3, 16, 7, hc);
          Hl(10, 21, 2, hc);
          R(5, 10, 4, 16, hc);
          R(23, 10, 4, 16, hc);
          for (let y = 3; y <= 25; y += 2) {
            if (y < 10) Hl(8, 23, y, ha);
            else {
              Hl(5, 8, y, ha);
              Hl(23, 26, y, ha);
            }
          }
          Hl(9, 22, 9, GOLD);
          Hl(9, 22, 10, GOLD);
          R(15, 3, 2, 6, GOLDL);
          P(15, 3, '#d0303a');
          P(16, 4, '#d0303a');
          break;
        case 'uraeus':
          Hl(10, 21, 7, hc);
          Hl(10, 21, 8, hcD);
          R(15, 2, 2, 5, hc);
          P(16, 2, '#d0303a');
          P(11, 7, '#2a9a9a');
          P(20, 7, '#2a9a9a');
          break;
        case 'bicorne':
          Hl(3, 28, 6, hc);
          Hl(4, 27, 5, hc);
          R(6, 3, 20, 2, hc);
          Hl(9, 22, 2, hc);
          Hl(12, 19, 1, hc);
          Hl(3, 28, 7, hcD);
          Hl(8, 14, 3, hcL);
          R(21, 2, 3, 3, ha);
          P(21, 2, WHITE);
          P(23, 4, '#2a3f9a');
          P(22, 3, '#ece8dc');
          if (p.plume) {
            Hl(9, 22, 0, ha);
            Hl(8, 23, 1, ha);
            P(10, 0, shade(ha, -0.15));
          }
          break;
        case 'tricorne':
          R(7, 3, 18, 4, hc);
          Hl(9, 22, 2, hc);
          R(6, 2, 1, 3, hc);
          R(25, 2, 1, 3, hc);
          Hl(6, 25, 6, '#d9c08a');
          Hl(9, 13, 3, hcL);
          break;
        case 'tophat':
          R(11, 0, 10, 6, hc);
          Hl(11, 20, 5, '#3a3a3a');
          Hl(8, 23, 6, hc);
          Hl(8, 23, 7, hcD);
          Vl(12, 0, 4, hcL);
          break;
        case 'peaked':
          Hl(10, 21, 2, hc);
          R(9, 3, 14, 4, hc);
          Hl(10, 21, 7, hcD);
          Hl(10, 21, 8, '#141414');
          Hl(11, 17, 8, '#3a3a3a');
          R(15, 4, 2, 2, ha);
          Hl(10, 13, 3, hcL);
          break;
        case 'patrol':
          R(10, 3, 12, 5, hc);
          Hl(10, 21, 8, hcD);
          Hl(11, 14, 4, hcL);
          Hl(10, 21, 3, hcL);
          break;
        case 'kepi':
          R(11, 0, 10, 8, hc);
          Hl(11, 20, 1, ha);
          Hl(11, 20, 6, ha);
          Hl(10, 21, 8, '#141414');
          Vl(12, 2, 5, hcL);
          break;
        case 'beret':
          Hl(10, 21, 3, hc);
          R(9, 4, 14, 3, hc);
          P(23, 4, hc);
          P(24, 5, hc);
          P(23, 5, hc);
          Hl(10, 21, 7, hcD);
          Hl(11, 15, 4, hcL);
          R(13, 4, 2, 2, ha);
          break;
        case 'helmet':
          Hl(11, 20, 2, hc);
          R(9, 3, 14, 6, hc);
          Hl(8, 23, 9, hcD);
          Hl(11, 14, 3, hcL);
          P(10, 5, hcL);
          P(12, 6, ha);
          P(15, 6, ha);
          P(18, 6, ha);
          break;
        case 'pickel':
          R(10, 3, 12, 6, hc);
          Hl(11, 20, 2, hc);
          R(15, 0, 2, 2, ha);
          R(14, 4, 4, 3, ha);
          Hl(10, 21, 9, '#141414');
          Hl(11, 13, 3, hcL);
          break;
        case 'campaign':
          R(11, 1, 10, 5, hc);
          Vl(15, 1, 3, hcD);
          Vl(16, 1, 2, hcD);
          Hl(11, 20, 5, hcD);
          Hl(5, 26, 6, hc);
          Hl(5, 26, 7, hcD);
          Hl(12, 14, 2, hcL);
          break;
        case 'flatcap':
          R(10, 4, 12, 4, hc);
          Hl(10, 23, 8, hcD);
          Hl(11, 14, 4, hcL);
          P(15, 5, hcD);
          break;
        case 'fur':
          R(8, 4, 16, 5, hc);
          R(11, 0, 10, 4, ha);
          for (let x = 8; x <= 23; x += 2) {
            P(x, 4, shade(hc, 0.3));
            P(x + 1, 7, shade(hc, -0.2));
          }
          Hl(12, 14, 1, shade(ha, 0.25));
          break;
        case 'mongol':
          R(11, 1, 10, 5, hc);
          Hl(13, 18, 0, hc);
          P(15, 0, GOLD);
          P(16, 0, GOLD);
          R(9, 5, 14, 4, ha);
          for (let x = 9; x <= 22; x += 2) P(x, 6, shade(ha, 0.3));
          Hl(12, 14, 2, hcL);
          break;
        case 'turban':
          R(8, 1, 16, 9, hc);
          Hl(10, 21, 0, hc);
          for (let i = 0; i < 7; i++) Hl(8 + i * 2, 10 + i * 2, 2 + i, shade(hc, -0.12));
          R(15, 4, 2, 3, ha);
          P(15, 3, '#3a6ad0');
          break;
        case 'bigturban':
          R(6, 1, 20, 9, hc);
          Hl(9, 22, 0, hc);
          R(5, 3, 22, 5, hc);
          for (let i = 0; i < 8; i++) Hl(6 + i * 2, 9 + i * 2, 1 + i, shade(hc, -0.12));
          R(15, 3, 2, 3, ha);
          Vl(16, 0, 2, ha);
          P(17, 0, WHITE);
          break;
        case 'tallcap':
          R(10, 1, 12, 6, hc);
          Hl(11, 20, 0, hc);
          Hl(10, 21, 6, shade(hc, 0.3));
          Vl(11, 1, 5, hcL);
          break;
        case 'mian':
          R(5, 1, 22, 2, hc);
          Hl(5, 26, 1, ha);
          R(11, 3, 10, 5, hc);
          Hl(11, 20, 4, hcL);
          for (const x of [6, 8, 23, 25]) for (let y = 3; y <= 10; y++) P(x, y, y % 2 ? ha : '#d0303a');
          break;
        case 'kabuto':
          R(8, 3, 16, 6, hc);
          Hl(10, 21, 2, hc);
          R(4, 7, 5, 5, hc);
          R(23, 7, 5, 5, hc);
          Hl(4, 8, 11, hcD);
          Hl(23, 27, 11, hcD);
          Hl(8, 23, 8, hcD);
          [[9, 0], [10, 1], [11, 2], [12, 3], [22, 0], [21, 1], [20, 2], [19, 3]].forEach(([x, y]) => P(x, y, ha));
          R(15, 3, 2, 3, ha);
          Hl(10, 13, 4, hcL);
          break;
        case 'princecap':
          R(10, 1, 12, 6, hc);
          Hl(9, 22, 6, ha);
          Hl(9, 22, 7, ha);
          for (let x = 9; x <= 22; x += 2) P(x, 7, GOLD);
          R(20, 0, 2, 5, WHITE);
          P(22, 0, WHITE);
          P(21, 0, '#d8d4cc');
          R(15, 4, 2, 2, GOLD);
          Hl(11, 13, 2, hcL);
          break;
        case 'band':
          Hl(10, 21, 8, hc);
          P(22, 9, hc);
          P(23, 10, hc);
          P(23, 11, hc);
          break;
        case 'plume':
          Hl(10, 21, 8, ha);
          Hl(10, 21, 9, shade(ha, -0.2));
          R(13, 0, 6, 8, hc);
          P(12, 2, hc);
          P(19, 1, hc);
          Vl(15, 1, 6, shade(hc, -0.12));
          P(17, 0, shade(hc, -0.1));
          break;
        case 'scarf':
          R(9, 3, 14, 7, hc);
          Hl(11, 20, 2, hc);
          R(21, 3, 4, 3, hcD);
          P(24, 6, hcD);
          Hl(10, 14, 4, hcL);
          Hl(11, 19, 8, hcD);
          break;
        case 'monomakh':
          R(9, 5, 14, 4, hc);
          for (let x = 9; x <= 22; x += 2) P(x, 5, shade(hc, 0.3));
          R(11, 1, 10, 4, ha);
          Hl(13, 18, 0, ha);
          P(12, 3, '#d0303a');
          P(19, 3, '#2a9a5a');
          P(15, 2, '#3a6ad0');
          P(16, 2, '#3a6ad0');
          Hl(12, 14, 1, shade(ha, 0.3));
          break;
        case 'leopard':
          R(10, 0, 12, 8, hc);
          Hl(10, 21, 7, shade(hc, -0.2));
          [[11, 1], [14, 2], [18, 1], [12, 4], [16, 5], [19, 4], [13, 6], [20, 6], [17, 3]].forEach(([x, y]) => P(x, y, ha));
          break;
        case 'santa':
          R(10, 2, 12, 6, hc);
          Hl(12, 19, 1, hc);
          R(20, 2, 4, 3, hc);
          R(22, 4, 3, 3, hc);
          Hl(11, 15, 3, shade(hc, 0.2));
          Vl(21, 2, 4, shade(hc, -0.2));
          R(23, 6, 3, 3, ha);
          P(24, 6, '#ffffff');
          R(9, 7, 14, 3, ha);
          for (let x = 9; x <= 22; x += 2) P(x, 9, '#d8d4cc');
          break;
        case 'horns': {
          const h2 = shade(hc, -0.18);
          [[10, 5], [9, 4], [9, 3], [8, 2], [8, 1], [9, 0]].forEach(([x, y]) => P(x, y, hc));
          [[11, 5], [10, 4], [10, 3], [9, 2]].forEach(([x, y]) => P(x, y, h2));
          [[21, 5], [22, 4], [22, 3], [23, 2], [23, 1], [22, 0]].forEach(([x, y]) => P(x, y, hc));
          [[20, 5], [21, 4], [21, 3], [22, 2]].forEach(([x, y]) => P(x, y, h2));
          break;
        }
        case 'shards':
          [[10, 3, 3], [14, 0, 5], [18, 1, 4], [21, 4, 3], [7, 5, 2], [24, 6, 2]].forEach(([x, y, h]) => {
            Vl(x, y, y + h - 1, hc);
            P(x, y, '#ffffff');
            P(x + 1, y + 1, shade(hc, -0.3));
          });
          break;
      }
    }

    function accessories() {
      if (p.acc === 'cigar') {
        Hl(18, 22, 19, '#7a4a22');
        P(19, 19, '#9a6a32');
        P(23, 19, '#ff7a3a');
        P(24, 17, '#bdbdbd');
        P(25, 16, '#9d9d9d');
        P(24, 15, '#8d8d8d');
      }
      if (p.acc === 'holder') {
        P(18, 19, DARK);
        P(19, 18, DARK);
        P(20, 17, DARK);
        P(21, 16, DARK);
        P(22, 15, WHITE);
        P(23, 14, WHITE);
        P(24, 13, '#ff7a3a');
        P(25, 11, '#bdbdbd');
      }
      if (p.acc === 'eyepatch') {
        R(11, 12, 4, 4, DARK);
        P(10, 11, DARK);
        P(9, 10, DARK);
        Hl(15, 22, 11, DARK);
      }
      if (p.acc === 'bone') {
        Hl(12, 19, 4, '#ece4d0');
        R(11, 3, 2, 3, '#ece4d0');
        R(19, 3, 2, 3, '#ece4d0');
        P(11, 3, '#fffaf0');
        Hl(13, 18, 5, '#c8c0a8');
      }
      if (p.mark) {
        Hl(16, 18, 5, '#a0505a');
        Hl(17, 19, 6, '#a0505a');
        P(18, 7, '#a0505a');
      }
      if (headOnly) return;
      if (p.acc === 'mic') {
        R(25, 25, 2, 7, '#2a2a2a');
        R(24, 21, 4, 4, '#8a8a92');
        P(25, 22, '#c8c8d0');
        P(26, 23, '#5a5a62');
        Hl(24, 27, 25, '#3a3a40');
      }
      if (p.pearls) for (let x = 11; x <= 20; x += 2) P(x, 26, WHITE);
      if (p.scarf) {
        Hl(12, 19, 24, '#b3261e');
        for (let x = 12; x <= 19; x += 2) P(x, 24, WHITE);
        Hl(13, 18, 25, '#b3261e');
      }
    }

    function outfit() {
      const o = p.out;
      const bare = o === 'collar' || o === 'pelt' || o === 'shawl';
      const base = bare ? sk : oc;
      Hl(8, 23, 24, base);
      Hl(6, 25, 25, base);
      R(3, 26, 26, 6, base);
      if (!bare) {
        R(3, 26, 3, 6, ocD);
        Hl(7, 12, 25, ocL);
        Hl(19, 24, 25, ocL);
        P(6, 26, ocD);
        Vl(28, 26, 31, ocD);
      } else R(3, 26, 2, 6, skD);
      const pts = (arr, c) => arr.forEach(([x, y]) => P(x, y, c));
      switch (o) {
        case 'robe':
        case 'fur':
          Hl(13, 18, 24, skD);
          Hl(14, 17, 25, skD);
          Hl(15, 16, 26, skD);
          pts([[12, 24], [13, 25], [14, 26], [15, 27], [16, 27], [17, 26], [18, 25], [19, 24]], ac);
          Vl(15, 28, 31, ac);
          Vl(16, 28, 31, acD);
          Vl(9, 27, 31, ocD);
          Vl(22, 27, 31, ocD);
          if (o === 'fur')
            for (let x = 6; x <= 25; x++) {
              P(x, 24 + (x % 2), shade(oc, 0.35));
              if (x % 3 === 0) P(x, 26, shade(oc, 0.2));
            }
          break;
        case 'armor':
        case 'plate':
          Hl(6, 25, 25, shade(oc, 0.4));
          Hl(8, 23, 24, shade(oc, 0.3));
          Vl(15, 26, 31, ocD);
          Vl(16, 26, 31, ocL);
          Hl(9, 22, 28, ocD);
          R(3, 25, 6, 4, shade(oc, 0.12));
          R(23, 25, 6, 4, shade(oc, 0.12));
          Hl(3, 8, 29, ocDD);
          Hl(23, 28, 29, ocDD);
          P(4, 26, shade(oc, 0.45));
          P(24, 26, shade(oc, 0.45));
          Vl(3, 29, 31, ac);
          Vl(28, 29, 31, ac);
          Vl(4, 30, 31, ac);
          Vl(27, 30, 31, ac);
          if (o === 'plate') {
            R(14, 29, 4, 2, ac);
            Hl(15, 16, 28, ac);
          }
          break;
        case 'leather':
          Hl(13, 18, 24, skD);
          for (let i = 0; i < 8; i++) {
            P(9 + i, 24 + i, ac);
            P(10 + i, 24 + i, ac);
          }
          Hl(13, 14, 28, GOLD);
          P(6, 28, ocL);
          P(24, 29, ocL);
          break;
        case 'toga':
          for (let i = 0; i < 8; i++) {
            P(21 - i, 24 + i, ac);
            P(20 - i, 24 + i, ac);
          }
          pts([[8, 28], [10, 30], [23, 27], [25, 29], [6, 30]], shade(oc, -0.12));
          break;
        case 'dress':
          R(12, 24, 8, 2, sk);
          Hl(13, 18, 26, sk);
          Hl(11, 20, 27, ac);
          P(11, 26, ac);
          P(20, 26, ac);
          P(15, 26, GOLD);
          P(16, 26, GOLD);
          break;
        case 'collar':
          R(8, 24, 16, 5, GOLD);
          Hl(8, 23, 25, ac);
          Hl(9, 22, 27, ac);
          Hl(10, 21, 29, GOLD);
          for (let x = 9; x <= 22; x += 2) P(x, 26, shade(GOLD, -0.2));
          break;
        case 'uniform':
          R(12, 24, 8, 2, ocD);
          Vl(16, 26, 31, ocD);
          P(15, 27, GOLD);
          P(15, 29, GOLD);
          P(15, 31, GOLD);
          R(3, 25, 5, 2, ac);
          R(24, 25, 5, 2, ac);
          [3, 5, 7, 24, 26, 28].forEach((x) => P(x, 27, ac));
          pts([[9, 28], [11, 29]], '#c8302a');
          pts([[10, 28], [9, 29]], ac);
          pts([[11, 28]], '#3a6ad0');
          pts([[10, 29]], '#e8e4dc');
          if (p.medals >= 1) {
            pts([[20, 28], [21, 29]], '#c8302a');
            pts([[21, 28], [20, 29]], ac);
          }
          if (p.medals >= 2) {
            Hl(8, 12, 30, ac);
            Hl(19, 23, 30, '#c8302a');
            P(9, 31, '#3a6ad0');
            P(20, 31, ac);
            P(11, 31, '#c8302a');
          }
          break;
        case 'suit':
          Hl(13, 18, 24, WHITE);
          Hl(14, 17, 25, WHITE);
          Hl(14, 17, 26, WHITE);
          Hl(15, 16, 27, WHITE);
          Hl(15, 16, 25, acD);
          Vl(15, 26, 31, ac);
          Vl(16, 26, 31, ac);
          P(16, 27, shade(ac, 0.2));
          pts([[12, 25], [13, 26], [13, 27], [14, 28], [19, 25], [18, 26], [18, 27], [17, 28]], ocD);
          Hl(21, 23, 28, ocL);
          break;
        case 'maosuit':
          R(12, 24, 8, 2, ocD);
          Vl(15, 26, 31, ocD);
          pts([[16, 27], [16, 29], [16, 31]], ocL);
          R(7, 28, 4, 1, ocD);
          R(21, 28, 4, 1, ocD);
          P(8, 29, ocD);
          P(22, 29, ocD);
          break;
        case 'fatigues':
          Hl(14, 17, 24, skD);
          Hl(15, 16, 25, skD);
          pts([[13, 24], [18, 24], [13, 25], [18, 25]], ocD);
          R(7, 27, 4, 3, ocD);
          R(21, 27, 4, 3, ocD);
          Hl(7, 10, 27, ocL);
          Hl(21, 24, 27, ocL);
          pts([[5, 29], [12, 30], [19, 29], [26, 30]], ocDD);
          break;
        case 'coat':
          R(13, 24, 6, 3, WHITE);
          Hl(15, 16, 27, WHITE);
          Hl(13, 18, 26, '#d8d4cc');
          Vl(11, 25, 31, ac);
          Vl(12, 25, 31, ac);
          Vl(19, 25, 31, ac);
          Vl(20, 25, 31, ac);
          pts([[14, 29], [17, 29], [14, 31], [17, 31]], GOLD);
          break;
        case 'tabard':
          R(3, 25, 6, 7, '#8a8f98');
          R(23, 25, 6, 7, '#8a8f98');
          for (let y = 25; y <= 31; y++) for (let x = 3 + (y % 2); x <= 28; x += 2) if (x < 9 || x > 22) P(x, y, '#a8adb6');
          R(13, 27, 6, 3, ac);
          pts([[12, 28], [19, 27], [14, 26], [18, 30], [13, 30]], ac);
          P(17, 27, DARK);
          break;
        case 'mail':
          for (let y = 25; y <= 31; y++) for (let x = 3 + (y % 2); x <= 28; x += 2) P(x, y, ocL);
          Hl(13, 18, 24, ocD);
          break;
        case 'samurai':
          for (let y = 26; y <= 31; y += 2) Hl(6, 25, y, ocL);
          R(3, 25, 6, 5, shade(oc, -0.4));
          R(23, 25, 6, 5, shade(oc, -0.4));
          for (let y = 26; y <= 29; y += 2) {
            Hl(3, 8, y, ac);
            Hl(23, 28, y, ac);
          }
          R(12, 24, 8, 2, ac);
          break;
        case 'ruff':
          R(9, 22, 14, 4, WHITE);
          for (let x = 9; x <= 22; x += 2) {
            P(x, 25, '#c8c4bc');
            P(x + 1, 22, '#e0dcd4');
          }
          for (let x = 11; x <= 20; x += 2) P(x, 28, WHITE);
          Vl(15, 27, 31, ac);
          Vl(16, 27, 31, ac);
          break;
        case 'pelt':
          R(3, 24, 12, 8, oc);
          for (let i = 0; i < 6; i++) Hl(15, 20 - i, 24 + i, oc);
          pts([[5, 26], [8, 28], [6, 30], [11, 27], [13, 30], [9, 25], [16, 25], [12, 29]], ac);
          Vl(3, 25, 31, ocD);
          break;
        case 'shawl':
          for (let y = 24; y <= 31; y++) Hl(3, 12 + (y - 24), y, oc);
          Hl(3, 11, 25, ocL);
          pts([[6, 27], [9, 29], [12, 31], [15, 30]], shade(oc, -0.15));
          Hl(4, 8, 28, ac);
          break;
        case 'madiba':
          for (let y = 26; y <= 31; y += 2)
            for (let x = 5 + (y % 4); x <= 26; x += 4) {
              P(x, y, ac);
              P(x + 1, y + 1, shade(ac, 0.35));
            }
          Hl(13, 18, 24, ocD);
          break;
        case 'jacket':
          R(13, 24, 6, 6, '#3a3a40');
          Hl(13, 18, 24, '#4a4a52');
          pts([[12, 25], [11, 26], [11, 27], [12, 28], [19, 25], [20, 26], [20, 27], [19, 28]], ocL);
          pts([[7, 27], [24, 27]], '#5a5a66');
          P(6, 28, '#4a4a56');
          break;
        case 'santa':
          R(8, 24, 16, 2, ac);
          Hl(6, 25, 25, ac);
          R(15, 26, 2, 6, ac);
          for (let x = 8; x <= 23; x += 2) P(x, 25, '#d8d4cc');
          Hl(3, 28, 29, DARK);
          Hl(3, 28, 30, DARK);
          R(13, 29, 5, 2, GOLD);
          Hl(14, 16, 29, DARK);
          break;
        case 'cloak':
          pts([[8, 19], [8, 20], [9, 21], [9, 22], [10, 23], [23, 19], [23, 20], [22, 21], [22, 22], [21, 23]], ac);
          Hl(13, 18, 24, shade(sk, -0.45));
          Hl(14, 17, 25, shade(sk, -0.45));
          R(15, 26, 2, 2, GOLD);
          Vl(13, 26, 31, ac);
          Vl(18, 26, 31, ac);
          break;
        case 'silver':
          Hl(11, 20, 24, ac);
          Hl(10, 21, 25, shade(ac, -0.3));
          R(14, 27, 4, 3, ac);
          Hl(15, 16, 28, '#0a1a2a');
          Vl(9, 26, 31, ocD);
          Vl(22, 26, 31, ocD);
          Hl(4, 8, 28, ocL);
          Hl(23, 27, 28, ocL);
          break;
        case 'wraith':
          Hl(8, 23, 26, ocD);
          P(15, 27, ac);
          P(16, 28, ac);
          P(15, 29, ac);
          P(16, 27, shade(ac, -0.4));
          for (let x = 3; x <= 28; x += 3) g.clearRect(x, 31, 1, 1);
          break;
        case 'void':
          for (let i = 0; i < 14; i++) P(4 + ((i * 7) % 24), 26 + ((i * 3) % 6), i % 3 ? WHITE : ac);
          Hl(10, 21, 24, ac);
          Hl(12, 19, 25, shade(ac, -0.3));
          break;
      }
    }
  }

  // ------------------------------------------------------------ caches + public API
  const figCache = {};
  function figure(id, variant, mode) {
    const key = id + '|' + (variant || '') + '|' + (mode || '');
    if (!figCache[key]) {
      const c = canvas(N, N);
      drawFigure(c.getContext('2d'), CW.LEADER[id].pt, variant, mode === 'head');
      figCache[key] = c;
    }
    return figCache[key];
  }
  CW.figure = figure;

  // 64x64 version of a figure: Scale2x upscale, edge lighting, cloth and hair texture, eye highlights
  function skinSet(p, variant) {
    const sk = variant === 'echo' ? '#aeb8cc' : p.sk;
    return new Set([sk, shade(sk, 0.14), shade(sk, -0.16), shade(sk, -0.34), WHITE].map(CW.u32));
  }
  function catchlights(c, pts) {
    const g = c.getContext('2d');
    for (const [x, y] of pts) {
      const px = g.getImageData(x, y, 1, 1).data;
      if (px[3] > 200 && px[0] + px[1] + px[2] < 200) {
        g.fillStyle = 'rgba(255,255,255,.92)';
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  const hiCache = {};
  function hiFigure(id, variant) {
    const key = id + '|' + (variant || '');
    if (!hiCache[key]) {
      const p = CW.LEADER[id].pt;
      const hi = CW.edgeLight(CW.scale2x(figure(id, variant)), { skip: skinSet(p, variant), tex: 0.07, edgeSolid: true });
      if ((p.head || 'human') === 'human' && !p.eyes) catchlights(hi, [[26, 26], [36, 26]]);
      hiCache[key] = hi;
    }
    return hiCache[key];
  }

  const QMARK = ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'];
  const pcache = {};
  CW.portrait = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (pcache[key]) return pcache[key];
    const L = CW.LEADER[id];
    const c = canvas(64, 64);
    const g = c.getContext('2d');
    if (variant === 'mystery') {
      drawBg(g, '#2a1240', 'mystery');
      g.drawImage(CW.outlined(CW.tinted(hiFigure(id, ''), '#0a0710'), '#b070ff'), 0, 0);
      g.fillStyle = '#e8d0ff';
      QMARK.forEach((r, y) => r.split('').forEach((k, x) => k === '#' && g.fillRect(26 + x * 2, 18 + y * 2, 2, 2)));
    } else {
      drawBg(g, variant === 'echo' ? '#141a2e' : L.pt.bg, variant);
      g.drawImage(CW.outlined(hiFigure(id, variant), OUT), 0, 0);
    }
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(0, 63, 64, 1);
    g.fillRect(63, 0, 1, 64);
    pcache[key] = c;
    return c;
  };
  const urlCache = {};
  CW.portraitURL = function (id, variant) {
    const key = id + '|' + (variant || '');
    if (!urlCache[key]) urlCache[key] = CW.portrait(id, variant).toDataURL();
    return urlCache[key];
  };

  // ------------------------------------------------------------ full-body battlefield sprite (30x42 on the field, 2x detail)
  const hcache = {};
  CW.heroSprite = function (id, side, variant) {
    const key = id + '|' + side + '|' + (variant || '');
    if (hcache[key]) return hcache[key];
    const L = CW.LEADER[id];
    const p = L.pt;
    const c = canvas(30, 42);
    const g = c.getContext('2d');
    g.translate(1, 1);
    const R = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    const P = (x, y, col) => R(x, y, 1, 1, col);
    const Hl = (x0, x1, y, col) => R(x0, y, x1 - x0 + 1, 1, col);
    const Vl = (x, y0, y1, col) => R(x, y0, 1, y1 - y0 + 1, col);
    const team = side === 'a' ? '#5ad1ff' : '#ff5a4a';
    const echo = variant === 'echo';
    const sk = echo ? '#aeb8cc' : p.sk;
    const skD = shade(sk, -0.16);
    const oc = p.oc || '#444';
    const ocD = shade(oc, -0.25);
    const ocL = shade(oc, 0.2);
    const ac = p.ac || GOLD;
    const o = p.out;
    const bare = o === 'collar' || o === 'pelt' || o === 'shawl';
    const long = ['robe', 'toga', 'dress', 'shawl', 'ruff', 'cloak', 'wraith', 'void', 'fur', 'collar', 'silver'].includes(o);
    // cape in team colours, so every commander reads as friend or foe
    R(6, 25, 16, 12, shade(team, -0.3));
    Vl(6, 27, 36, shade(team, -0.5));
    Vl(21, 27, 36, shade(team, -0.5));
    Hl(6, 21, 36, shade(team, -0.5));
    // legs
    if (long) {
      const sc = o === 'collar' || o === 'toga' ? WHITE : oc;
      R(8, 32, 12, 5, sc);
      Vl(8, 32, 36, shade(sc, -0.25));
      Hl(9, 19, 36, shade(sc, -0.2));
    } else {
      const pants = bare ? sk : o === 'santa' ? '#c8102e' : ['suit', 'jacket', 'maosuit'].includes(o) ? shade(oc, -0.15) : shade(oc, -0.45);
      R(10, 32, 3, 5, pants);
      R(15, 32, 3, 5, pants);
      Vl(10, 32, 36, shade(pants, -0.2));
    }
    R(9, 37, 4, 2, DARK);
    R(15, 37, 4, 2, DARK);
    P(12, 37, '#3a3236');
    P(18, 37, '#3a3236');
    // torso + arms
    const tb = bare ? sk : oc;
    R(8, 24, 12, 8, tb);
    Vl(8, 24, 31, bare ? skD : ocD);
    Vl(19, 25, 31, bare ? shade(sk, 0.1) : ocL);
    R(6, 25, 2, 6, bare ? sk : ocD);
    R(20, 25, 2, 6, bare ? skD : ocD);
    switch (o) {
      case 'suit':
        Hl(12, 15, 24, WHITE);
        Hl(13, 14, 25, WHITE);
        Vl(13, 25, 30, ac);
        Vl(14, 25, 30, ac);
        P(11, 25, ocD);
        P(16, 25, ocD);
        break;
      case 'jacket':
        R(12, 24, 4, 5, '#3a3a40');
        P(11, 25, ocL);
        P(16, 25, ocL);
        break;
      case 'uniform':
        R(6, 24, 3, 1, ac);
        R(19, 24, 3, 1, ac);
        Vl(13, 25, 31, ocD);
        P(14, 26, GOLD);
        P(14, 28, GOLD);
        P(10, 27, '#c8302a');
        P(11, 27, ac);
        break;
      case 'coat':
        Vl(11, 25, 31, ac);
        Vl(16, 25, 31, ac);
        R(12, 24, 4, 2, WHITE);
        P(12, 28, GOLD);
        P(15, 28, GOLD);
        break;
      case 'maosuit':
        Hl(11, 16, 24, ocD);
        Vl(13, 25, 31, ocD);
        P(14, 27, ocL);
        P(14, 29, ocL);
        break;
      case 'fatigues':
        Hl(12, 15, 24, skD);
        R(9, 27, 3, 2, ocD);
        R(16, 27, 3, 2, ocD);
        break;
      case 'armor':
      case 'plate':
      case 'mail':
        Hl(9, 18, 25, shade(oc, 0.35));
        Vl(13, 26, 30, ocD);
        Vl(14, 26, 30, ocL);
        R(5, 24, 3, 3, shade(oc, 0.15));
        R(20, 24, 3, 3, shade(oc, 0.15));
        if (o === 'plate') R(12, 27, 4, 2, ac);
        break;
      case 'samurai':
        for (let y = 25; y <= 31; y += 2) Hl(9, 18, y, ocL);
        R(5, 24, 3, 4, shade(oc, -0.4));
        R(20, 24, 3, 4, shade(oc, -0.4));
        break;
      case 'tabard':
        R(6, 25, 2, 6, '#8a8f98');
        R(20, 25, 2, 6, '#8a8f98');
        R(11, 26, 6, 3, ac);
        break;
      case 'leather':
        for (let i = 0; i < 8; i++) P(9 + i, 24 + i, ac);
        break;
      case 'santa':
        Hl(8, 19, 24, ac);
        R(13, 25, 2, 7, ac);
        break;
      case 'madiba':
        for (let y = 25; y <= 31; y += 2) for (let x = 9 + (y % 4); x <= 18; x += 4) P(x, y, ac);
        break;
      case 'pelt':
        R(8, 24, 7, 8, oc);
        [[10, 26], [12, 29], [9, 30], [13, 25]].forEach(([x, y]) => P(x, y, ac));
        break;
      case 'collar':
        R(9, 24, 10, 3, GOLD);
        Hl(9, 18, 25, ac);
        break;
      case 'shawl':
        for (let y = 24; y <= 31; y++) Hl(8, Math.min(19, 10 + (y - 24)), y, oc);
        break;
      case 'toga':
        for (let i = 0; i < 8; i++) {
          P(18 - i, 24 + i, ac);
          P(17 - i, 24 + i, ac);
        }
        break;
      case 'dress':
        R(11, 24, 6, 2, sk);
        Hl(10, 17, 26, ac);
        break;
      case 'robe':
      case 'fur':
        Hl(12, 15, 24, skD);
        Hl(13, 14, 25, skD);
        Vl(12, 26, 36, ac);
        Vl(15, 26, 36, ac);
        break;
      case 'ruff':
        R(9, 23, 10, 2, WHITE);
        Vl(13, 25, 31, ac);
        Vl(14, 25, 31, ac);
        break;
      case 'cloak':
        P(7, 22, ac);
        P(7, 23, ac);
        P(20, 22, ac);
        P(20, 23, ac);
        R(13, 26, 2, 2, GOLD);
        Vl(11, 26, 36, ac);
        Vl(16, 26, 36, ac);
        break;
      case 'silver':
        Hl(10, 17, 24, ac);
        R(12, 27, 4, 2, ac);
        break;
      case 'wraith':
        R(13, 27, 2, 2, ac);
        break;
      case 'void':
        [[10, 26], [16, 28], [12, 30], [18, 25], [9, 33], [15, 34]].forEach(([x, y], i) => P(x, y, i % 2 ? WHITE : ac));
        break;
    }
    if (!long || o === 'santa') {
      Hl(8, 19, 31, o === 'santa' ? DARK : shade(oc, -0.5));
      Hl(13, 14, 31, GOLD);
    }
    // weapon in the leading hand
    const w = CW.weaponOf(id);
    const met = '#e8ecf4';
    switch (w) {
      case 'sword':
        Vl(22, 17, 29, met);
        Vl(23, 18, 29, '#9aa2b0');
        P(22, 16, '#ffffff');
        Hl(20, 24, 30, GOLD);
        Vl(22, 31, 33, '#5a3a24');
        break;
      case 'flag':
        Vl(22, 6, 38, '#6a4a2a');
        P(22, 5, GOLD);
        R(23, 6, 5, 6, team);
        Hl(23, 27, 8, shade(team, 0.45));
        Hl(23, 27, 11, shade(team, -0.3));
        break;
      case 'club':
        R(21, 19, 4, 5, '#8a5a2a');
        R(22, 24, 3, 4, '#7a4a22');
        R(22, 28, 2, 4, '#5a3a1a');
        P(20, 20, '#a87a4a');
        P(25, 21, '#a87a4a');
        P(23, 18, '#a87a4a');
        break;
      case 'trident':
        Vl(22, 9, 38, '#7a1a1a');
        Vl(20, 4, 9, '#d0d0d8');
        Vl(22, 3, 9, '#d0d0d8');
        Vl(24, 4, 9, '#d0d0d8');
        Hl(20, 24, 9, '#d0d0d8');
        P(22, 2, '#ffffff');
        break;
      case 'candy':
        for (let y = 14; y <= 38; y++) P(22, y, (y >> 1) % 2 ? '#e8302a' : WHITE);
        [[22, 13], [23, 12], [24, 12], [25, 13], [25, 14], [25, 15]].forEach(([x, y], i) => P(x, y, i % 2 ? '#e8302a' : WHITE));
        break;
      case 'raygun':
        R(20, 28, 6, 2, '#c8ccd8');
        P(26, 28, '#2ee6ff');
        P(27, 28, '#aef8ff');
        Vl(21, 30, 32, '#5a6070');
        P(22, 27, '#2ee6ff');
        break;
      case 'gun':
        R(13, 28, 15, 2, '#2a2a30');
        R(15, 30, 3, 3, '#2a2a30');
        Hl(13, 27, 27, '#4a4a56');
        break;
      case 'rifle':
        Hl(14, 27, 28, '#5a3a24');
        Hl(17, 23, 29, '#5a3a24');
        Hl(22, 27, 27, '#3a3a40');
        P(27, 26, '#3a3a40');
        break;
      case 'scythe':
        Vl(22, 3, 38, '#3a2a2a');
        Hl(13, 22, 3, '#d0d4dc');
        Hl(12, 17, 4, '#d0d4dc');
        P(12, 5, '#d0d4dc');
        P(11, 6, '#d0d4dc');
        Hl(14, 21, 2, '#ffffff');
        break;
      case 'staff':
        Vl(22, 8, 38, '#5a2a7a');
        R(21, 4, 3, 3, '#d08aff');
        P(22, 5, '#ffffff');
        P(20, 5, '#d08aff');
        P(24, 5, '#d08aff');
        P(22, 3, '#d08aff');
        break;
      case 'mic':
        R(21, 26, 2, 5, '#2a2a2a');
        R(20, 23, 4, 3, '#9a9aa2');
        P(21, 23, '#d0d0d8');
        break;
    }
    R(20, 31, 2, 2, sk);
    R(6, 31, 2, 2, sk);
    // the head, cut from the portrait figure (without its shoulders)
    g.drawImage(figure(id, variant, 'head'), 4, 0, 24, 32, 2, 0, 24, 32);
    g.setTransform(1, 0, 0, 1, 0, 0);
    // 2x detail (60x84 pixels shown at 30x42 on the field)
    let fin = CW.edgeLight(CW.scale2x(c), { skip: skinSet(p, variant), tex: 0.05 });
    if ((p.head || 'human') === 'human' && !p.eyes) catchlights(fin, [[24, 28], [34, 28]]);
    if (side === 'e') {
      const m = canvas(60, 84);
      const mg = m.getContext('2d');
      mg.translate(60, 0);
      mg.scale(-1, 1);
      mg.drawImage(fin, 0, 0);
      fin = m;
    }
    const out = CW.outlined(fin, OUT);
    const res = { c: out, w: 30, h: 42, flash: CW.tinted(out, '#ffffff'), shadow: CW.tinted(out, '#0a0710') };
    hcache[key] = res;
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
