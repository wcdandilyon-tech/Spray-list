/* Chrono Command — 8-bit art: pixel portraits, unit sprites, era backdrops, bitmap font, icons. */
(function (G) {
  'use strict';
  const CW = G.CW;
  const W = 384;
  const H = 216;
  CW.FIELD = { W, H, ground: 122 };

  // ------------------------------------------------------------ colour helpers
  function hex2rgb(h) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  function shade(h, a) {
    const c = hex2rgb(h);
    const f = (v) => Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a)));
    return '#' + c.map((v) => f(v).toString(16).padStart(2, '0')).join('');
  }
  function mix(a, b, t) {
    const x = hex2rgb(a);
    const y = hex2rgb(b);
    return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
  }
  CW.shade = shade;
  CW.mix = mix;

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function rnd(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  // ------------------------------------------------------------ portraits (24x24)
  const pcache = {};
  CW.portrait = function (id, variant) {
    const key = id + (variant || '');
    if (pcache[key]) return pcache[key];
    const L = CW.LEADER[id];
    const c = canvas(24, 24);
    drawPortrait(c.getContext('2d'), L.pt, variant);
    pcache[key] = c;
    return c;
  };
  const urlCache = {};
  CW.portraitURL = function (id, variant) {
    const key = id + (variant || '');
    if (!urlCache[key]) urlCache[key] = CW.portrait(id, variant).toDataURL();
    return urlCache[key];
  };

  function drawPortrait(g, p, variant) {
    const R = (x, y, w, h, col) => {
      g.fillStyle = col;
      g.fillRect(x, y, w, h);
    };
    const P = (x, y, col) => R(x, y, 1, 1, col);
    const echo = variant === 'echo';
    const sk = echo ? '#aeb8cc' : p.sk;
    const skD = shade(sk, -0.18);
    const skDD = shade(sk, -0.35);
    const hr = echo ? '#5a6478' : p.hr;
    const hrL = shade(hr, 0.25);
    const fc = echo ? '#5a6478' : p.fc || p.hr;
    const oc = p.oc;
    const ocD = shade(oc, -0.25);
    const ocL = shade(oc, 0.2);
    const ac = p.ac || '#d9b45a';
    const hc = p.hc || '#333';
    const hcD = shade(hc, -0.25);
    const hcL = shade(hc, 0.25);
    const ha = p.ha || '#d9b45a';
    const white = '#f4f0e8';
    const dark = '#1a1418';

    // background
    const bg = echo ? '#141a2e' : p.bg;
    R(0, 0, 24, 24, bg);
    R(0, 14, 24, 10, shade(bg, -0.25));
    for (let i = 0; i < 24; i += 2) P(i, 13, shade(bg, -0.12));
    if (echo) {
      for (let i = 0; i < 24; i += 4) {
        P(i, 2 + ((i * 3) % 9), '#2ee6ff');
        P(i + 1, 2 + ((i * 3) % 9), '#2ee6ff');
      }
    }

    // ---- back hair
    const hs = p.hs;
    if (hs === 'long') R(6, 5, 12, 14, hr);
    if (hs === 'longwavy') {
      R(6, 5, 12, 12, hr);
      P(5, 12, hr);
      P(18, 12, hr);
      P(5, 15, hr);
      P(18, 15, hr);
    }
    if (hs === 'bob') R(6, 4, 12, 11, hr);
    if (hs === 'curly') {
      R(5, 3, 14, 9, hr);
      for (let x = 5; x < 19; x += 2) P(x, 2, hr);
      for (let y = 4; y < 12; y += 2) {
        P(4, y, hr);
        P(19, y, hr);
      }
    }
    if (hs === 'bouffant') R(5, 2, 14, 10, hr);
    if (hs === 'updo') {
      R(7, 0, 10, 6, hr);
      R(6, 4, 12, 5, hr);
    }
    if (hs === 'powdered') {
      R(7, 3, 10, 7, hr);
      R(5, 8, 2, 4, hr);
      R(17, 8, 2, 4, hr);
      P(5, 9, shade(hr, -0.15));
      P(18, 9, shade(hr, -0.15));
    }
    if (hs === 'bun') {
      R(7, 3, 10, 4, hr);
      R(10, 0, 4, 3, hr);
      P(11, 0, hrL);
    }

    // ---- shoulders / outfit (y 17..23)
    drawOutfit();

    // ---- neck
    R(10, 16, 4, 3, skD);
    // ---- head
    const jaw = p.jaw ? 1 : 0;
    R(7, 5, 10, 11, sk);
    R(8, 15, 8, 2, sk);
    if (jaw) R(7, 14, 10, 2, sk);
    P(7, 5, bg);
    P(16, 5, bg);
    // left-side shading
    R(7, 8, 1, 7, skD);
    R(8, 16, 8, 1, skD);
    // ears
    R(6, 10, 1, 3, skD);
    R(17, 10, 1, 3, skD);
    // bald dome
    if (hs === 'bald' || hs === 'balding' || hs === 'none') {
      R(8, 3, 8, 2, sk);
      P(9, 3, shade(sk, 0.15));
      P(10, 3, shade(sk, 0.15));
    }
    // eyes & brows
    const brow = shade(hr === '#e9e6df' || hr === '#9c9c9c' ? '#7a7a7a' : hr, -0.1);
    R(9, 9, 2, 1, brow);
    R(13, 9, 2, 1, brow);
    P(9, 10, white);
    P(10, 10, dark);
    P(13, 10, dark);
    P(14, 10, white);
    // nose
    R(11, 12, 2, 1, skDD);
    P(12, 11, skD);
    if (p.nose) {
      R(11, 11, 2, 3, skD);
      R(11, 13, 2, 1, skDD);
    }
    // mouth
    if (p.grin) {
      R(9, 14, 6, 1, white);
      R(10, 15, 4, 1, skDD);
      P(9, 14, skDD);
      P(14, 14, skDD);
    } else R(10, 14, 4, 1, p.fem ? '#b0505a' : shade(sk, -0.42));
    if (p.fem) {
      P(9, 11, '#e8a0a0');
      P(14, 11, '#e8a0a0');
      P(8, 9, dark);
      P(15, 9, dark);
    }

    // ---- top hair
    if (hs === 'short' || hs === 'powdered') {
      R(7, 3, 10, 3, hr);
      R(7, 6, 1, 3, hr);
      R(16, 6, 1, 3, hr);
      P(9, 3, hrL);
      P(10, 3, hrL);
    }
    if (hs === 'neat') {
      R(7, 3, 10, 3, hr);
      R(7, 6, 1, 2, hr);
      R(16, 6, 1, 2, hr);
      R(10, 3, 1, 2, shade(hr, -0.35));
      R(11, 3, 4, 1, hrL);
    }
    if (hs === 'side') {
      R(7, 3, 10, 3, hr);
      R(7, 6, 1, 2, hr);
      R(16, 6, 1, 2, hr);
      R(8, 6, 6, 1, hr);
      R(8, 7, 4, 1, hr);
      P(8, 8, hr);
      R(13, 3, 1, 2, shade(hr, -0.4));
    }
    if (hs === 'slick') {
      R(7, 2, 10, 3, hr);
      R(7, 5, 1, 3, hr);
      R(16, 5, 1, 3, hr);
      R(9, 2, 6, 1, hrL);
    }
    if (hs === 'wavy') {
      R(6, 2, 12, 4, hr);
      R(6, 6, 2, 3, hr);
      R(16, 6, 2, 3, hr);
      P(8, 6, hr);
      P(12, 6, hr);
      R(8, 2, 3, 1, hrL);
      P(13, 3, hrL);
    }
    if (hs === 'curly') {
      for (let x = 7; x < 17; x += 2) P(x, 3, hrL);
      R(7, 5, 10, 1, hr);
    }
    if (hs === 'bald') {
      R(7, 7, 1, 3, hr);
      R(16, 7, 1, 3, hr);
    }
    if (hs === 'balding') {
      R(7, 6, 1, 4, hr);
      R(16, 6, 1, 4, hr);
      R(9, 4, 6, 1, hr);
      P(8, 5, hr);
      P(15, 5, hr);
    }
    if (hs === 'long' || hs === 'longwavy') {
      R(7, 3, 10, 3, hr);
      R(7, 6, 1, 6, hr);
      R(16, 6, 1, 6, hr);
      P(9, 3, hrL);
      P(14, 4, hrL);
    }
    if (hs === 'bob') {
      R(7, 3, 10, 3, hr);
      R(7, 6, 10, 1, hr);
      R(6, 6, 1, 8, hr);
      R(17, 6, 1, 8, hr);
      P(10, 3, hrL);
    }
    if (hs === 'bouffant') {
      R(6, 3, 12, 3, hr);
      R(6, 6, 2, 6, hr);
      R(16, 6, 2, 6, hr);
      R(8, 3, 5, 1, hrL);
    }
    if (hs === 'updo') {
      R(7, 4, 10, 2, hr);
      R(9, 1, 5, 1, hrL);
    }
    if (hs === 'bun') {
      R(7, 6, 1, 2, hr);
      R(16, 6, 1, 2, hr);
    }

    // ---- facial hair
    const fh = p.fh;
    const fcD = shade(fc, -0.2);
    if (fh === 'mustache') R(10, 13, 4, 1, fc);
    if (fh === 'toothbrush') R(11, 13, 2, 1, fc);
    if (fh === 'walrus') {
      R(9, 13, 6, 1, fc);
      P(9, 14, fc);
      P(14, 14, fc);
      P(10, 12, fc);
      P(13, 12, fc);
    }
    if (fh === 'kaiser') {
      R(10, 13, 4, 1, fc);
      P(9, 12, fc);
      P(14, 12, fc);
      P(8, 11, fc);
      P(15, 11, fc);
    }
    if (fh === 'longmustache') {
      R(10, 13, 4, 1, fc);
      R(9, 14, 1, 3, fc);
      R(14, 14, 1, 3, fc);
      R(11, 16, 2, 1, fc);
    }
    if (fh === 'goatee') {
      R(10, 13, 4, 1, fc);
      R(11, 15, 2, 3, fc);
    }
    if (fh === 'beard' || fh === 'fullbeard' || fh === 'scruff') {
      const c1 = fh === 'scruff' ? fcD : fc;
      R(7, 11, 1, 5, c1);
      R(16, 11, 1, 5, c1);
      R(8, 13, 8, 4, c1);
      R(10, 14, 4, 1, shade(sk, -0.42));
      if (fh === 'fullbeard') {
        R(8, 17, 8, 2, fc);
        R(9, 19, 6, 1, fc);
      }
      if (fh === 'scruff') {
        P(8, 13, sk);
        P(15, 13, sk);
        P(9, 16, sk);
        P(14, 16, sk);
        R(10, 13, 4, 1, fc);
      }
      P(10, 16, fcD);
      P(13, 15, fcD);
    }
    if (fh === 'longbeard') {
      R(7, 11, 1, 5, fc);
      R(16, 11, 1, 5, fc);
      R(8, 13, 8, 8, fc);
      R(9, 21, 6, 1, fc);
      R(10, 14, 4, 1, shade(sk, -0.42));
      for (let y = 16; y < 21; y += 2) R(8, y, 8, 1, fcD);
      R(10, 13, 4, 1, fcD);
    }
    if (fh === 'chinstrap') {
      R(7, 10, 1, 6, fc);
      R(16, 10, 1, 6, fc);
      R(8, 15, 8, 3, fc);
      R(10, 18, 4, 1, fc);
    }
    if (fh === 'sideburns') {
      R(7, 7, 1, 7, fc);
      R(16, 7, 1, 7, fc);
    }
    if (fh === 'stubble') {
      for (let x = 8; x < 16; x += 2) P(x, 15, skDD);
      P(9, 16, skDD);
      P(13, 16, skDD);
    }
    if (fh === 'pharaoh') {
      R(11, 16, 2, 4, '#2a3a8a');
      P(11, 17, '#d9b45a');
      P(12, 19, '#d9b45a');
    }

    // ---- glasses & accessories
    if (p.gl === 1) {
      const fr = '#2a2a2a';
      R(8, 9, 4, 1, fr);
      R(12, 9, 4, 1, fr);
      R(8, 11, 4, 1, fr);
      R(12, 11, 4, 1, fr);
      P(8, 10, fr);
      P(11, 10, fr);
      P(12, 10, fr);
      P(15, 10, fr);
      P(9, 10, '#c8e0f0');
      P(14, 10, '#c8e0f0');
    }
    if (p.gl === 2) {
      R(8, 9, 8, 3, '#141414');
      P(9, 9, '#5a5a6a');
      P(13, 9, '#5a5a6a');
    }
    if (p.mark) {
      R(12, 3, 2, 1, '#a0505a');
      R(13, 4, 2, 1, '#a0505a');
    }
    if (p.acc === 'eyepatch') {
      R(9, 9, 3, 3, dark);
      P(8, 8, dark);
      P(7, 7, dark);
      R(12, 8, 5, 1, dark);
    }

    // ---- hats
    drawHat(p.hat);

    if (p.acc === 'cigar') {
      R(14, 14, 4, 1, '#7a4a22');
      P(18, 14, '#ff7a3a');
      P(19, 12, '#bdbdbd');
      P(20, 11, '#9d9d9d');
    }
    if (p.acc === 'holder') {
      R(14, 14, 2, 1, dark);
      P(16, 13, dark);
      P(17, 12, dark);
      P(18, 11, white);
      P(19, 10, white);
      P(20, 9, '#bdbdbd');
    }
    if (p.acc === 'mic') {
      R(17, 18, 2, 6, '#2a2a2a');
      R(16, 15, 4, 3, '#9a9aa2');
      P(17, 15, '#c8c8d0');
    }
    if (p.pearls) for (let x = 9; x < 15; x += 2) P(x, 19, white);

    if (echo) {
      P(13, 10, '#ff2a2a');
      P(14, 10, '#ff8a8a');
      R(15, 7, 1, 1, '#2ee6ff');
      R(15, 8, 2, 1, '#2ee6ff');
      R(16, 9, 1, 3, '#2ee6ff');
      R(7, 12, 1, 2, '#2ee6ff');
    }
    // frame
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.fillRect(0, 23, 24, 1);
    g.fillRect(23, 0, 1, 24);

    function drawOutfit() {
      const o = p.out;
      // base shoulders
      R(3, 19, 18, 5, oc);
      R(5, 18, 14, 1, oc);
      R(3, 19, 1, 5, ocD);
      R(4, 19, 16, 1, ocL);
      if (o === 'robe' || o === 'fur') {
        R(10, 18, 4, 2, skD);
        R(9, 18, 1, 6, ac);
        R(14, 18, 1, 6, ac);
        if (o === 'fur') for (let x = 4; x < 20; x += 2) P(x, 18 + (x % 4 ? 1 : 0), shade(oc, 0.3));
      } else if (o === 'armor' || o === 'plate') {
        R(4, 19, 16, 1, shade(oc, 0.35));
        R(11, 20, 2, 4, ocD);
        R(6, 21, 3, 1, ocL);
        R(15, 21, 3, 1, ocL);
        R(3, 19, 2, 5, ac);
        R(19, 19, 2, 5, ac);
        if (o === 'plate') {
          R(11, 21, 2, 2, ac);
          P(10, 22, ac);
          P(13, 22, ac);
        }
      } else if (o === 'leather') {
        for (let i = 0; i < 6; i++) R(6 + i * 2, 18 + i, 2, 1, ac);
        R(10, 18, 4, 1, skD);
      } else if (o === 'toga') {
        for (let i = 0; i < 6; i++) R(14 - i * 2, 18 + i, 2, 1, ac);
        R(5, 19, 2, 1, shade(oc, -0.1));
      } else if (o === 'dress') {
        R(9, 18, 6, 2, sk);
        R(10, 20, 4, 1, sk);
        R(8, 20, 1, 1, ac);
        R(15, 20, 1, 1, ac);
        R(9, 21, 6, 1, ac);
      } else if (o === 'collar') {
        R(3, 19, 18, 5, sk);
        R(3, 19, 1, 5, skD);
        R(6, 18, 12, 4, '#d9b45a');
        R(6, 19, 12, 1, ac);
        R(7, 21, 10, 1, ac);
        R(9, 22, 6, 1, '#d9b45a');
      } else if (o === 'uniform') {
        R(9, 18, 6, 2, ocD);
        P(11, 20, ac);
        P(12, 22, ac);
        R(3, 19, 4, 1, ac);
        R(17, 19, 4, 1, ac);
        P(6, 21, '#b3261e');
        P(7, 21, ac);
        P(6, 22, ac);
      } else if (o === 'suit') {
        R(9, 18, 6, 1, white);
        R(10, 19, 4, 2, white);
        R(11, 21, 2, 1, white);
        R(11, 19, 2, 5, ac);
        P(9, 19, ocD);
        P(14, 19, ocD);
        R(8, 20, 2, 1, ocD);
        R(14, 20, 2, 1, ocD);
      } else if (o === 'maosuit') {
        R(9, 18, 6, 2, ocD);
        R(11, 20, 1, 4, ocD);
        P(12, 21, ocL);
        P(12, 23, ocL);
        R(5, 21, 3, 1, ocD);
        R(16, 21, 3, 1, ocD);
      } else if (o === 'fatigues') {
        R(10, 18, 4, 2, skD);
        R(11, 20, 2, 1, skD);
        R(5, 21, 3, 2, ocD);
        R(16, 21, 3, 2, ocD);
        P(8, 19, ocD);
        P(15, 19, ocD);
      } else if (o === 'coat') {
        R(10, 18, 4, 2, white);
        P(11, 20, white);
        P(12, 20, white);
        R(8, 19, 2, 5, ac);
        R(14, 19, 2, 5, ac);
        P(9, 21, '#d9b45a');
        P(14, 22, '#d9b45a');
      } else if (o === 'tabard') {
        R(3, 19, 4, 5, '#8a8f98');
        R(17, 19, 4, 5, '#8a8f98');
        R(10, 20, 4, 3, ac);
        P(9, 21, ac);
        P(14, 21, ac);
      } else if (o === 'mail') {
        for (let y = 19; y < 24; y++) for (let x = 3 + (y % 2); x < 21; x += 2) P(x, y, ocL);
        R(10, 18, 4, 1, ocD);
      } else if (o === 'samurai') {
        for (let y = 19; y < 24; y += 2) R(4, y, 16, 1, ocL);
        R(3, 19, 4, 4, shade(oc, -0.4));
        R(17, 19, 4, 4, shade(oc, -0.4));
        R(10, 18, 4, 2, ac);
      } else if (o === 'ruff') {
        R(6, 17, 12, 2, white);
        for (let x = 6; x < 18; x += 2) P(x, 18, '#c8c4bc');
        for (let x = 8; x < 16; x += 2) P(x, 21, white);
        R(11, 20, 2, 4, ac);
      } else if (o === 'pelt') {
        R(3, 19, 18, 5, sk);
        R(3, 19, 1, 5, skD);
        R(3, 19, 9, 5, oc);
        R(12, 20, 3, 4, oc);
        P(5, 20, ac);
        P(8, 21, ac);
        P(6, 22, ac);
        P(10, 20, ac);
        P(13, 22, ac);
      } else if (o === 'shawl') {
        R(3, 19, 18, 5, sk);
        R(3, 19, 1, 5, skD);
        for (let i = 0; i < 6; i++) R(3, 18 + i, 9 - i, 1, oc);
        R(12, 21, 9, 3, oc);
        R(10, 22, 2, 2, oc);
        R(4, 20, 4, 1, ac);
      } else if (o === 'madiba') {
        R(10, 18, 4, 1, ocD);
        for (let y = 19; y < 24; y += 2) for (let x = 4 + (y % 4); x < 20; x += 4) P(x, y, ac);
      }
    }

    function drawHat(h) {
      if (!h) return;
      if (h === 'crown') {
        R(7, 3, 10, 2, hc);
        P(7, 2, hc);
        P(7, 1, hc);
        P(9, 2, hc);
        R(11, 0, 2, 3, hc);
        P(14, 2, hc);
        P(16, 1, hc);
        P(16, 2, hc);
        P(9, 3, '#b3261e');
        P(12, 3, '#2a8a4a');
        P(14, 3, '#2a5ab3');
        R(7, 4, 10, 1, hcD);
      } else if (h === 'circlet') {
        R(7, 4, 10, 1, hc);
        P(11, 3, hc);
        P(12, 3, '#b3261e');
      } else if (h === 'tiara') {
        R(9, 2, 6, 2, hc);
        R(11, 1, 2, 1, hc);
        P(12, 2, '#b3261e');
        P(10, 3, '#2a5ab3');
      } else if (h === 'laurel') {
        for (let x = 7; x < 17; x += 2) P(x, 4, hc);
        for (let x = 8; x < 17; x += 2) P(x, 3, shade(hc, 0.25));
        P(6, 5, hc);
        P(17, 5, hc);
        P(6, 7, hc);
        P(17, 7, hc);
      } else if (h === 'greek') {
        R(6, 1, 12, 6, hc);
        R(6, 7, 2, 7, hc);
        R(16, 7, 2, 7, hc);
        R(11, 7, 2, 4, hc);
        R(6, 1, 1, 13, hcD);
        R(8, 2, 3, 1, hcL);
        R(5, 0, 14, 2, ha);
        for (let x = 6; x < 19; x += 2) P(x, 0, shade(ha, 0.25));
      } else if (h === 'nasal') {
        R(8, 1, 8, 2, hc);
        R(7, 3, 10, 3, hc);
        R(11, 0, 2, 1, hc);
        R(11, 6, 2, 5, hc);
        R(9, 1, 2, 1, hcL);
        R(7, 5, 10, 1, hcD);
      } else if (h === 'spike') {
        R(7, 2, 10, 4, hc);
        R(11, 0, 2, 2, ha);
        R(7, 5, 10, 1, ha);
        R(6, 6, 1, 8, hcD);
        R(17, 6, 1, 8, hcD);
        R(9, 2, 2, 1, hcL);
      } else if (h === 'nemes') {
        R(6, 2, 12, 5, hc);
        R(4, 7, 3, 11, hc);
        R(17, 7, 3, 11, hc);
        for (let y = 3; y < 18; y += 2) {
          R(4, y, 3, 1, ha);
          R(17, y, 3, 1, ha);
          if (y < 7) R(6, y, 12, 1, ha);
        }
        R(7, 6, 10, 1, '#d9b45a');
        R(11, 3, 2, 3, '#e8c84a');
        P(11, 3, '#b3261e');
      } else if (h === 'uraeus') {
        R(7, 4, 10, 1, hc);
        R(11, 1, 2, 3, hc);
        P(12, 1, '#b3261e');
        P(8, 4, '#2a9a9a');
        P(15, 4, '#2a9a9a');
      } else if (h === 'bicorne') {
        R(3, 3, 18, 2, hc);
        R(5, 1, 14, 2, hc);
        R(8, 0, 8, 1, hc);
        R(3, 4, 18, 1, hcD);
        P(2, 4, hc);
        P(21, 4, hc);
        R(16, 1, 2, 2, ha);
        P(16, 1, '#ece8dc');
        P(17, 2, '#2a3f9a');
      } else if (h === 'tricorne') {
        R(5, 3, 14, 2, hc);
        R(7, 1, 10, 2, hc);
        P(5, 2, hc);
        P(18, 2, hc);
        R(5, 4, 14, 1, '#d9c08a');
      } else if (h === 'tophat') {
        R(8, 0, 8, 4, hc);
        R(8, 3, 8, 1, '#3a3a3a');
        R(6, 4, 12, 1, hc);
        P(9, 0, shade(hc, 0.2));
      } else if (h === 'peaked') {
        R(6, 2, 12, 3, hc);
        R(7, 5, 10, 1, hcD);
        R(7, 6, 10, 1, '#1d1d1d');
        R(11, 3, 2, 1, ha);
        R(7, 2, 3, 1, hcL);
      } else if (h === 'patrol') {
        R(7, 2, 10, 4, hc);
        R(7, 6, 10, 1, hcD);
        R(8, 2, 3, 1, hcL);
      } else if (h === 'kepi') {
        R(8, 0, 8, 5, hc);
        R(8, 1, 8, 1, ha);
        R(8, 4, 8, 1, ha);
        R(7, 5, 10, 1, '#1d1d1d');
      } else if (h === 'beret') {
        R(7, 2, 10, 3, hc);
        R(6, 3, 12, 2, hc);
        P(17, 2, hc);
        R(7, 5, 10, 1, hcD);
        P(13, 3, ha);
        P(12, 3, ha);
      } else if (h === 'helmet') {
        R(7, 1, 10, 2, hc);
        R(6, 3, 12, 3, hc);
        R(5, 6, 14, 1, hcD);
        R(8, 1, 3, 1, hcL);
        P(9, 4, ha);
        P(12, 4, ha);
        P(15, 4, ha);
      } else if (h === 'pickel') {
        R(7, 2, 10, 4, hc);
        R(11, 0, 2, 2, ha);
        R(10, 3, 4, 2, ha);
        R(7, 6, 10, 1, '#1d1d1d');
        R(8, 2, 2, 1, hcL);
      } else if (h === 'campaign') {
        R(8, 1, 8, 3, hc);
        P(11, 1, hcD);
        P(12, 1, hcD);
        R(8, 3, 8, 1, hcD);
        R(4, 4, 16, 1, hc);
        R(4, 5, 16, 1, hcD);
      } else if (h === 'flatcap') {
        R(7, 3, 10, 2, hc);
        R(7, 5, 11, 1, hcD);
        R(8, 3, 3, 1, hcL);
      } else if (h === 'fur') {
        R(6, 3, 12, 3, hc);
        R(8, 0, 8, 3, ha);
        for (let x = 6; x < 18; x += 2) P(x, 4, shade(hc, 0.3));
      } else if (h === 'mongol') {
        R(8, 1, 8, 3, hc);
        R(10, 0, 4, 1, hc);
        R(6, 4, 12, 2, ha);
        P(11, 0, '#d9b45a');
        for (let x = 6; x < 18; x += 2) P(x, 5, shade(ha, 0.3));
      } else if (h === 'turban') {
        R(6, 1, 12, 5, hc);
        for (let i = 0; i < 5; i++) R(7 + i * 2, 1 + i, 3, 1, shade(hc, -0.12));
        R(11, 3, 2, 2, ha);
      } else if (h === 'bigturban') {
        R(5, 0, 14, 6, hc);
        R(4, 2, 16, 3, hc);
        for (let i = 0; i < 6; i++) R(5 + i * 2, i, 3, 1, shade(hc, -0.12));
        R(11, 2, 2, 2, ha);
        P(12, 0, ha);
      } else if (h === 'tallcap') {
        R(7, 0, 10, 5, hc);
        R(7, 4, 10, 1, shade(hc, 0.3));
        P(7, 0, 'transparent');
        R(8, 1, 2, 2, hcL);
      } else if (h === 'mian') {
        R(4, 1, 16, 1, hc);
        R(8, 2, 8, 3, hc);
        R(4, 0, 16, 1, ha);
        for (const x of [5, 7, 16, 18]) for (let y = 2; y < 7; y++) P(x, y, y % 2 ? ha : '#b3261e');
      } else if (h === 'kabuto') {
        R(6, 2, 12, 4, hc);
        R(4, 5, 4, 3, hc);
        R(16, 5, 4, 3, hc);
        R(6, 6, 12, 1, hcD);
        P(7, 0, ha);
        P(8, 1, ha);
        P(9, 2, ha);
        P(16, 0, ha);
        P(15, 1, ha);
        P(14, 2, ha);
        R(11, 2, 2, 2, ha);
      } else if (h === 'princecap') {
        R(7, 1, 10, 4, hc);
        R(6, 4, 12, 2, ha);
        for (let x = 6; x < 18; x += 2) P(x, 5, '#d9b45a');
        R(15, 0, 2, 3, '#ece8dc');
        P(12, 2, '#d9b45a');
      } else if (h === 'band') {
        R(7, 5, 10, 1, hc);
        P(17, 6, hc);
        P(18, 7, hc);
      } else if (h === 'plume') {
        R(7, 5, 10, 1, ha);
        R(10, 0, 4, 5, hc);
        P(9, 2, hc);
        P(14, 1, hc);
        P(11, 0, shade(hc, -0.1));
      } else if (h === 'scarf') {
        R(6, 2, 12, 5, hc);
        R(16, 2, 3, 2, hcD);
        R(7, 3, 4, 1, hcL);
      }
    }
  }

  // ------------------------------------------------------------ unit sprites
  const T = {
    soldier: [
      '..........',
      '...HHHH...',
      '..HHHHHH..',
      '...SSSE...',
      '...SSSS...',
      '....SS....',
      '..BBBBBB..',
      '..BTTTBS..',
      '..BBBBB...',
      '...LLLL...',
      '...L..L...',
      '..FF..FF..',
    ],
    rider: [
      '.......HHH......',
      '......HHHH......',
      '.......SSE...NN.',
      '.......SSS..NNNN',
      '......BBBBSNNNNE',
      '......BTTBNNN.NN',
      '...NNCCCCCNN....',
      '..NNNNNNNNNN....',
      '.N.NNNNNNNNN....',
      '...NN....NN.....',
      '...N.N...N.N....',
      '...N.N...N.N....',
      '..FF.FF.FF.FF...',
    ],
    chariot: [
      '...HHH..........',
      '..HHHH..........',
      '...SSE.......NN.',
      '...SSS......NNNN',
      '..BBBBW....NNNNE',
      '..BTTB.W..NNN.NN',
      '.CCCCCCWNNNN....',
      '.CCCCCCNNNNNN...',
      '..XOX..NNNNNN...',
      '.XOOOX.N.N.N.N..',
      '..XOX..N.N.N.N..',
      '...X..FF.F.F.FF.',
    ],
    elephant: [
      '......HHH.........',
      '.....HSSE.........',
      '....TTTTTT........',
      '....CCCCCC........',
      '...BBBBBBBBBB.....',
      '..BBBBBBBBBBBBB...',
      '.BBBBBBBBBBBBBBB..',
      '.BBBBBBBBBBBBBEBB.',
      '.BBBBBBBBBBBBBBBBB',
      'XBBBBBBBBBBBBBWWBB',
      '.BBBBBBBBBBBB...BB',
      '..BBB.BBB.BBB...B.',
      '..BBB.BBB.BBB.....',
      '..XXX.XXX.XXX.....',
    ],
    cannon: [
      '..HHH...........',
      '.HHHH...........',
      '..SSE...........',
      '..SSS...........',
      '.BTTBS..........',
      '.BBBB...MMMMMMMM',
      '..LL..MMMMMMMMM.',
      '..LL.MMMMWWW....',
      '..LL.WXOOXW.....',
      '.FF.FFXOOX......',
    ],
    landship: [
      '........TT..........',
      '....XXXXXXXXXXX.....',
      '..XXBBBBBBBBBBBXX...',
      '.XBBBBBBBBBBBBBBBX..',
      'XBBBBBBBBBBBBBBBBBX.',
      'XBBWWBBBBBBBBBBBBBBX',
      'XBBWWBBBBBBBBBBBBBBX',
      '.XBBBBBBBBBBBBBBBBX.',
      '..XOXOXOXOXOXOXOXX..',
      '...XXXXXXXXXXXXXX...',
    ],
    tank: [
      '........TT............',
      '.......XBBBX..........',
      '......XBBBBBXMMMMMMM..',
      '......XBBBBBX.........',
      '...XXXXXXXXXXXXX......',
      '..XBBBBBBBBBBBBBBX....',
      '.XBBBBBBBBBBBBBBBBX...',
      'XXXXXXXXXXXXXXXXXXXX..',
      'XOXOXOXOXOXOXOXOXOX...',
      '.XXXXXXXXXXXXXXXXXX...',
    ],
    heli: [
      'MMMMMMMMMMMMMMMMMMM.',
      '........X...........',
      '.......XBBBBBX......',
      'B.....XBBBBBBBGG....',
      'BB...XBBBBBBBBGGG...',
      'BBBBBBBBBBBTTBBBBB..',
      'B.....XBBBBBBBBBBW..',
      '.......XBBBBBBBX..W.',
      '........X....X......',
      '.......XXXXXXXXX....',
    ],
    drone: [
      'MMM........MMM',
      '.X..........X.',
      '.XXXBBBBBBXXX.',
      '...BBBBBBBB...',
      '...BBGGBBBBW..',
      '....BTTBBB....',
      '....X....X....',
    ],
    bomber: [
      '........XXXX............',
      '....XXXXBBBBXXXX........',
      'XXXXBBBBBBBBBBBBXXXXX...',
      'XBBBBBBBGGBBBBTTBBBBBXXX',
      '.XXXXXXXXXXXXXXXXXXXXX..',
    ],
    mech: [
      '....XXXXX.....',
      '....XGGGX.....',
      '...XBBBBBX....',
      '.WWXBBBBBXWW..',
      '.WWBBBTBBBWWWW',
      '.WWBBBBBBBWW..',
      '..XBBBBBBBX...',
      '...BBB.BBB....',
      '...BB...BB....',
      '..XBB...BBX...',
      '..BB.....BB...',
      '.XXXX...XXXX..',
    ],
  };
  const AIR = { heli: 1, drone: 1, bomber: 1 };

  function weaponPixels(w) {
    // [x, y, key] relative to soldier template, facing right
    const P = [];
    const add = (x, y, k) => P.push([x, y, k]);
    if (w === 'spear') {
      for (let y = 1; y < 11; y++) add(8, y, 'W');
      add(8, 0, 'M');
    } else if (w === 'sling') {
      add(8, 6, 'W');
      add(9, 5, 'W');
      add(9, 4, 'M');
    } else if (w === 'sword') {
      add(8, 3, 'M');
      add(8, 4, 'M');
      add(8, 5, 'M');
      add(8, 6, 'W');
    } else if (w === 'katana') {
      add(9, 2, 'M');
      add(9, 3, 'M');
      add(8, 4, 'M');
      add(8, 5, 'M');
      add(8, 6, 'W');
    } else if (w === 'bow') {
      add(8, 3, 'W');
      for (let y = 4; y < 10; y++) add(9, y, 'W');
      add(8, 10, 'W');
      for (let y = 4; y < 10; y++) add(8, y, 'M');
    } else if (w === 'musket' || w === 'rifle') {
      add(7, 7, 'W');
      add(8, 7, 'W');
      add(9, 7, 'M');
      add(6, 8, 'W');
    } else if (w === 'longrifle') {
      add(7, 7, 'W');
      add(8, 7, 'W');
      add(9, 7, 'W');
      add(7, 6, 'M');
      add(8, 6, 'M');
      add(6, 8, 'W');
    } else if (w === 'mg' || w === 'smg') {
      add(7, 7, 'W');
      add(8, 7, 'W');
      add(9, 7, 'W');
      add(8, 8, 'W');
      if (w === 'mg') add(9, 8, 'W');
    } else if (w === 'grenade') {
      add(8, 4, 'G');
      add(8, 5, 'W');
      add(7, 6, 'S');
    } else if (w === 'laser') {
      add(7, 7, 'M');
      add(8, 7, 'M');
      add(9, 7, 'G');
    } else if (w === 'plasma') {
      add(7, 7, 'W');
      add(8, 7, 'W');
      add(9, 6, 'G');
      add(9, 7, 'G');
      add(9, 8, 'G');
    }
    return P;
  }

  const scache = {};
  CW.unitSprite = function (uid, side) {
    const key = uid + side;
    if (scache[key]) return scache[key];
    const u = CW.UNIT[uid];
    const sp = u.sp;
    const team = side === 'a' ? '#5ad1ff' : '#ff5a4a';
    let rows = T[sp.k].slice();
    const pal = {
      H: sp.helm || '#555',
      S: '#e2ad80',
      E: '#1a1418',
      B: sp.body,
      T: team,
      L: sp.legs || shade(sp.body, -0.3),
      F: '#2a1e14',
      W: ['musket', 'rifle', 'longrifle', 'mg', 'smg', 'plasma', 'laser'].includes(sp.w) ? '#34343c' : '#6a4a2a',
      M: '#d8dce4',
      G: sp.w === 'plasma' ? '#d08aff' : '#7dffb0',
      X: shade(sp.body, -0.45),
      O: '#3a342e',
      N: sp.horse || '#6a4426',
      C: sp.cloth || sp.howdah || shade(sp.body, -0.1),
      K: sp.shield || '#8a6a3a',
      R: sp.crest || team,
      Y: sp.horn || '#e8c84a',
    };
    if (sp.k === 'cannon' || sp.k === 'tank' || sp.k === 'landship' || sp.k === 'heli' || sp.k === 'drone' || sp.k === 'bomber' || sp.k === 'mech') {
      pal.M = sp.k === 'cannon' ? sp.body : sp.k === 'heli' || sp.k === 'drone' ? '#9aa0a8' : shade(sp.body, -0.2);
      pal.G = sp.k === 'mech' ? '#ff4a4a' : '#9ad8ff';
      if (sp.k === 'cannon') {
        pal.B = '#3a4a7a';
        pal.H = '#2a2a2a';
        pal.L = '#e8e4dc';
      }
    }
    if (sp.k === 'elephant') pal.B = sp.body;
    if (sp.k === 'tank' && sp.long) rows = rows.map((r, i) => (i === 2 ? r.replace('MMMMMMM..', 'MMMMMMMMM') : r));
    const h = rows.length;
    const w = rows[0].length;
    const grid = rows.map((r) => r.split(''));
    if (sp.k === 'soldier') {
      // headgear variants
      const set = (x, y, k) => {
        if (y >= 0 && y < h && x >= 0 && x < w) grid[y][x] = k;
      };
      if (sp.cap) {
        grid[2] = '...HHHH...'.split('');
      }
      if (sp.hat === 'wide' || sp.hat === 'brodie') grid[2] = '.HHHHHHHH.'.split('');
      if (sp.hat === 'tall') {
        grid[0] = '...HHHH...'.split('');
        grid[2] = '...HHHH...'.split('');
        set(6, 0, 'T');
      }
      if (sp.hat === 'round') {
        grid[1] = '..HHHHH...'.split('');
        grid[2] = '..HHHHHH..'.split('');
      }
      if (sp.hat === 'beret') {
        grid[1] = '...HHH....'.split('');
        grid[2] = '..HHHHH...'.split('');
      }
      if (sp.hat === 'ops') {
        grid[1] = '..HHHHH...'.split('');
        set(5, 3, 'G');
        set(6, 3, 'G');
      }
      if (sp.hat === 'visor') {
        grid[1] = '..HHHHH...'.split('');
        grid[3] = '...HGGG...'.split('');
        grid[4] = '...HHHH...'.split('');
        grid[5] = '....HH....'.split('');
      }
      if (sp.crest) grid[0] = '..RRRR....'.split('');
      if (sp.horn) {
        set(4, 0, 'Y');
        set(5, 0, 'Y');
        grid[2] = '.HHHHHHHH.'.split('');
      }
      weaponPixels(sp.w).forEach(([x, y, k]) => set(x, y, k));
      if (sp.shield) for (let y = 6; y < 10; y++) for (let x = 1; x < 3; x++) set(x, y, 'K');
    }
    if (sp.k === 'rider') {
      if (sp.w === 'lance') {
        [[10, 3], [11, 2], [12, 1], [13, 0]].forEach(([x, y]) => (grid[y][x] = 'W'));
        grid[0][14] = 'M';
      } else {
        grid[1][11] = 'M';
        grid[2][11] = 'M';
        grid[3][11] = 'M';
      }
    }
    const c = canvas(w, h);
    const g = c.getContext('2d');
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const k = grid[y][x];
        if (k === '.' || !pal[k]) continue;
        g.fillStyle = pal[k];
        const xx = side === 'a' ? x : w - 1 - x;
        g.fillRect(xx, y, 1, 1);
      }
    const out = { c, w, h, air: !!AIR[sp.k], multi: sp.k === 'soldier' };
    // white silhouette for hit flashes
    const f = canvas(w, h);
    const fg = f.getContext('2d');
    fg.drawImage(c, 0, 0);
    fg.globalCompositeOperation = 'source-in';
    fg.fillStyle = '#fff';
    fg.fillRect(0, 0, w, h);
    out.flash = f;
    scache[key] = out;
    return out;
  };
  const uurl = {};
  CW.unitURL = function (uid) {
    if (!uurl[uid]) {
      const s = CW.unitSprite(uid, 'a');
      const c = canvas(24, 18);
      const g = c.getContext('2d');
      if (s.multi) {
        g.drawImage(s.c, 2, 4);
        g.drawImage(s.c, 12, 6);
      } else g.drawImage(s.c, Math.floor((24 - s.w) / 2), Math.floor((18 - s.h) / 2));
      uurl[uid] = c.toDataURL();
    }
    return uurl[uid];
  };

  // ------------------------------------------------------------ bitmap font (3x5)
  const GL = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
    '.': '000000000000010', '!': '010010010000010', '+': '000010111010000', '-': '000000111000000', ':': '000010000010000',
    '/': '001001010100100', ' ': '000000000000000', '%': '101001010100101',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111',
  };
  CW.bitText = function (g, str, x, y, col, scale, outline) {
    scale = scale || 1;
    str = String(str).toUpperCase();
    const draw = (ox, oy, c) => {
      g.fillStyle = c;
      let cx = x + ox;
      for (const ch of str) {
        const gl = GL[ch] || GL[' '];
        for (let i = 0; i < 15; i++) if (gl[i] === '1') g.fillRect(cx + (i % 3) * scale, y + oy + Math.floor(i / 3) * scale, scale, scale);
        cx += 4 * scale;
      }
    };
    if (outline) {
      draw(-1, 0, outline);
      draw(1, 0, outline);
      draw(0, -1, outline);
      draw(0, 1, outline);
    }
    draw(0, 0, col);
    return str.length * 4 * scale;
  };
  CW.bitWidth = (str, scale) => String(str).length * 4 * (scale || 1) - (scale || 1);

  // ------------------------------------------------------------ number formatting
  // K, M, B, T, then aa, ab ... zz (pixel fonts make Oc/0c ambiguous)
  CW.fmt = function (n) {
    if (!isFinite(n)) return 'inf';
    if (n < 0) return '-' + CW.fmt(-n);
    if (n < 1000) return n < 10 && n % 1 ? n.toFixed(1) : String(Math.floor(n));
    const e = Math.floor(Math.log10(n) / 3);
    let suf;
    if (e < 5) suf = ['', 'K', 'M', 'B', 'T'][e];
    else {
      const i = e - 5;
      if (i >= 676) return n.toExponential(2).replace('+', '');
      suf = String.fromCharCode(97 + Math.floor(i / 26)) + String.fromCharCode(97 + (i % 26));
    }
    const v = n / Math.pow(1000, e);
    return (v >= 100 ? v.toFixed(0) : v >= 10 ? v.toFixed(1) : v.toFixed(2)) + suf;
  };

  // ------------------------------------------------------------ icons (8x8)
  const ICONS = {
    coin: ['..YYYY..', '.YyyyyY.', 'YyYYYYyY', 'YyYyyYyY', 'YyYyyYyY', 'YyYYYYyY', '.YyyyyY.', '..YYYY..'],
    shard: ['...CC...', '..CcCC..', '..CccC..', '.CcccCC.', '.CccccC.', '..CccC..', '..CCC...', '...C....'],
    sword: ['......MM', '.....MM.', '....MM..', '.W.MM...', '..WM....', '..WW....', '.W..W...', 'W.......'],
    clock: ['..XXXX..', '.XwwwwX.', 'XwwXwwwX', 'XwwXwwwX', 'XwwXXXwX', 'XwwwwwwX', '.XwwwwX.', '..XXXX..'],
    star: ['...Y....', '...Y....', '..YYY...', 'YYYYYYY.', '.YYYYY..', '..YYY...', '.YY.YY..', '.Y...Y..'],
  };
  const ICOL = { Y: '#ffd23f', y: '#c8901e', C: '#8ae8ff', c: '#2ea8e0', M: '#e8ecf4', W: '#8a5a2a', X: '#2a2a2a', w: '#f4f0e8' };
  const icache = {};
  CW.icon = function (name) {
    if (icache[name]) return icache[name];
    const rows = ICONS[name];
    const c = canvas(8, 8);
    const g = c.getContext('2d');
    rows.forEach((r, y) =>
      r.split('').forEach((k, x) => {
        if (ICOL[k]) {
          g.fillStyle = ICOL[k];
          g.fillRect(x, y, 1, 1);
        }
      })
    );
    icache[name] = c.toDataURL();
    return icache[name];
  };

  // ------------------------------------------------------------ era backdrops (384x216)
  const bcache = {};
  CW.backdrop = function (era) {
    if (bcache[era]) return bcache[era];
    const c = canvas(W, H);
    const g = c.getContext('2d');
    SCENES[era](g, rnd(era * 977 + 13));
    bcache[era] = c;
    return c;
  };
  const GY = 122;
  function R(g, x, y, w, h, col) {
    g.fillStyle = col;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }
  function sky(g, cols, top, bottom) {
    top = top || 0;
    bottom = bottom || GY;
    const n = cols.length;
    const bh = (bottom - top) / n;
    for (let i = 0; i < n; i++) {
      const y0 = Math.round(top + i * bh);
      R(g, 0, y0, W, Math.ceil(bh) + 1, cols[i]);
      if (i > 0) for (let x = 0; x < W; x += 2) R(g, x + ((y0 / 2) % 2), y0 - 1, 1, 1, cols[i]);
      if (i > 0) for (let x = 1; x < W; x += 2) R(g, x, y0, 1, 1, cols[i - 1]);
    }
  }
  function disc(g, cx, cy, r, col) {
    for (let y = -r; y <= r; y++) {
      const w = Math.round(Math.sqrt(r * r - y * y));
      R(g, cx - w, cy + y, w * 2, 1, col);
    }
  }
  function ridge(g, base, amp, col, rand, step) {
    step = step || 4;
    let h = amp * rand();
    for (let x = 0; x < W; x += step) {
      h += (rand() - 0.5) * amp * 0.5;
      h = Math.max(amp * 0.2, Math.min(amp, h));
      R(g, x, base - h, step, h + 2, col);
    }
  }
  function ground(g, a, b, rand, stripes) {
    R(g, 0, GY, W, H - GY, a);
    for (let y = GY + 4; y < H; y += stripes || 9) R(g, 0, y, W, 2, b);
    for (let i = 0; i < 140; i++) R(g, rand() * W, GY + 2 + rand() * (H - GY), 2, 1, b);
    R(g, 0, GY, W, 2, shade(a, 0.12));
  }
  function stars(g, rand, n, maxY) {
    for (let i = 0; i < n; i++) R(g, rand() * W, rand() * maxY, 1, 1, rand() > 0.7 ? '#ffffff' : '#9ab0d0');
  }
  function cloud(g, x, y, s, col) {
    R(g, x, y, 16 * s, 4 * s, col);
    R(g, x + 3 * s, y - 3 * s, 8 * s, 3 * s, col);
    R(g, x + 9 * s, y - 2 * s, 5 * s, 2 * s, col);
  }
  function pyramid(g, cx, base, hw, col, lit) {
    for (let y = 0; y < hw; y++) {
      R(g, cx - (hw - y), base - y, (hw - y) * 2, 1, col);
      R(g, cx, base - y, hw - y, 1, lit);
    }
  }
  const SCENES = [
    // 0 Bronze Age — desert dusk with pyramids and a ziggurat
    (g, r) => {
      sky(g, ['#f7d79a', '#f6c27a', '#f1a160', '#e0804a', '#c96a44']);
      disc(g, 290, 84, 18, '#fff1c0');
      disc(g, 290, 84, 14, '#ffe08a');
      ridge(g, GY, 16, '#c88a5a', r, 6);
      pyramid(g, 90, GY, 44, '#b86a44', '#d48a5a');
      pyramid(g, 160, GY, 28, '#a85e3c', '#c87c50');
      // ziggurat
      [[260, 70], [268, 54], [276, 38], [284, 22]].forEach(([x, w], i) => R(g, x - w / 2 + 30, GY - 10 - i * 10, w, 10, i % 2 ? '#9a5638' : '#8a4c32'));
      ground(g, '#e2b468', '#cf9c52', r);
    },
    // 1 Classical — bright sky, temple and cypress trees
    (g, r) => {
      sky(g, ['#4aa8e8', '#6ab8ee', '#8ccaf2', '#b4dcf6']);
      cloud(g, 40, 30, 2, '#eaf6ff');
      cloud(g, 250, 22, 1.5, '#eaf6ff');
      ridge(g, GY, 26, '#7aa868', r, 6);
      // temple
      const tx = 210;
      R(g, tx, GY - 46, 120, 6, '#e8e0c8');
      for (let i = 0; i < 12; i++) R(g, tx + 2 + i * 10, GY - 40, 5, 34, i % 2 ? '#e0d8bc' : '#eee6d0');
      R(g, tx - 4, GY - 6, 128, 6, '#cfc6aa');
      for (let y = 0; y < 14; y++) R(g, tx + y * 4, GY - 46 - y, 120 - y * 8, 1, y % 3 ? '#e8e0c8' : '#d0c8ae');
      // cypress
      [30, 52, 150, 360].forEach((x) => {
        for (let y = 0; y < 34; y++) R(g, x - Math.round(Math.sin((y / 34) * Math.PI) * 5), GY - 40 + y, Math.round(Math.sin((y / 34) * Math.PI) * 10) + 1, 1, '#2a5a3a');
      });
      ground(g, '#a8c060', '#8aa84a', r);
    },
    // 2 Medieval — overcast, castle on hills
    (g, r) => {
      sky(g, ['#5a7aa8', '#6e8cb6', '#88a2c4', '#a8bcd4']);
      cloud(g, 10, 40, 2.5, '#c8d4e2');
      cloud(g, 200, 30, 2, '#c8d4e2');
      ridge(g, GY, 30, '#4a7050', r, 5);
      const cx = 230;
      R(g, cx, GY - 44, 100, 44, '#6a6a78');
      for (let x = cx; x < cx + 100; x += 8) R(g, x, GY - 48, 5, 4, '#6a6a78');
      [cx - 12, cx + 40, cx + 100].forEach((x, i) => {
        R(g, x, GY - 70 + (i === 1 ? -12 : 0), 18, 70 + (i === 1 ? 12 : 0), '#5a5a68');
        for (let k = 0; k < 18; k += 6) R(g, x + k, GY - 74 + (i === 1 ? -12 : 0), 4, 4, '#5a5a68');
        R(g, x + 7, GY - 50, 4, 8, '#2a2a34');
      });
      R(g, cx + 48, GY - 100, 1, 18, '#3a3a3a');
      R(g, cx + 49, GY - 100, 10, 6, '#b3261e');
      R(g, cx + 42, GY - 18, 16, 18, '#3a2a1a');
      ground(g, '#5e8e3c', '#4c7a30', r);
    },
    // 3 Gunpowder — dusk sea, galleon and pagoda
    (g, r) => {
      sky(g, ['#2a2a5a', '#5a3a6a', '#9a4a6a', '#d8705a', '#f0a060']);
      disc(g, 120, 100, 16, '#ffd08a');
      R(g, 0, GY - 22, W, 22, '#2a4a7a');
      for (let i = 0; i < 40; i++) R(g, r() * W, GY - 20 + r() * 18, 6, 1, '#4a6a9a');
      // galleon
      R(g, 40, GY - 30, 60, 8, '#1a1424');
      R(g, 36, GY - 34, 10, 4, '#1a1424');
      R(g, 92, GY - 36, 10, 6, '#1a1424');
      [52, 68, 84].forEach((x, i) => {
        R(g, x, GY - 72 + i * 4, 2, 42 - i * 4, '#1a1424');
        R(g, x - 8, GY - 66 + i * 4, 18, 12, '#e8dcc8');
        R(g, x - 7, GY - 50 + i * 4, 16, 10, '#d8ccb8');
      });
      // pagoda
      const px = 290;
      for (let i = 0; i < 5; i++) {
        const w = 60 - i * 10;
        R(g, px - w / 2, GY - 22 - i * 16, w, 4, '#3a1a2a');
        R(g, px - w / 2 - 4, GY - 22 - i * 16, 4, 2, '#3a1a2a');
        R(g, px + w / 2, GY - 22 - i * 16, 4, 2, '#3a1a2a');
        R(g, px - w / 2 + 6, GY - 18 - i * 16, w - 12, 12, '#5a2a3a');
      }
      R(g, px - 1, GY - 108, 2, 24, '#3a1a2a');
      ground(g, '#7a8a4a', '#64743a', r);
    },
    // 4 Revolution — misty morning, star fort with flag and cannon smoke
    (g, r) => {
      sky(g, ['#9ab0c4', '#b0c0cc', '#c8d0d0', '#dcdcd0']);
      ridge(g, GY, 22, '#7a8a78', r, 4);
      for (let i = 0; i < 30; i++) {
        const x = r() * W;
        R(g, x, GY - 20 - r() * 12, 3, 20, '#5a6a5a');
        disc(g, x + 1, GY - 26 - r() * 10, 5, '#5a6a5a');
      }
      R(g, 220, GY - 30, 120, 30, '#8a7a62');
      R(g, 210, GY - 22, 14, 22, '#7a6a54');
      R(g, 336, GY - 22, 14, 22, '#7a6a54');
      for (let x = 220; x < 340; x += 10) R(g, x, GY - 34, 6, 4, '#8a7a62');
      R(g, 280, GY - 70, 1, 40, '#3a3a3a');
      R(g, 281, GY - 70, 16, 10, '#2a3f7a');
      R(g, 286, GY - 70, 6, 10, '#ece8dc');
      R(g, 292, GY - 70, 5, 10, '#b3261e');
      [60, 120, 170].forEach((x) => {
        disc(g, x, GY - 14, 9, '#eeeeea');
        disc(g, x + 10, GY - 20, 7, '#f6f6f2');
      });
      ground(g, '#7a9a4a', '#668a3a', r);
    },
    // 5 Industrial — smoggy sky, factories, smokestacks, barbed wire
    (g, r) => {
      sky(g, ['#4a3e34', '#62523e', '#7a6a4e', '#948260']);
      for (let i = 0; i < 6; i++) {
        const x = 20 + i * 64;
        const h = 30 + ((i * 37) % 30);
        R(g, x, GY - h, 50, h, '#3a3028');
        R(g, x + 6, GY - h - 40, 8, 40, '#2e2620');
        R(g, x + 30, GY - h - 28, 6, 28, '#2e2620');
        for (let k = 0; k < 4; k++) disc(g, x + 10 + k * 6, GY - h - 46 - k * 8, 5 + k, '#5a4e44');
        for (let k = 0; k < 4; k++) R(g, x + 6 + k * 10, GY - h + 8, 4, 4, '#d8a040');
      }
      ground(g, '#5a4a32', '#4a3c28', r, 7);
      for (let x = 10; x < W; x += 30) {
        R(g, x, GY + 6, 2, 12, '#2a2018');
        for (let k = 0; k < 30; k += 3) R(g, x + k, GY + 9 + (k % 6 ? 1 : 0), 2, 1, '#6a6a6a');
      }
      for (let i = 0; i < 8; i++) {
        const x = r() * W;
        R(g, x, GY + 30 + r() * 50, 18, 4, '#3a2e20');
      }
    },
    // 6 World War — burning sky, ruined city, searchlights
    (g, r) => {
      sky(g, ['#24181c', '#3a2224', '#5e2e26', '#8e4430', '#b8603a']);
      g.globalAlpha = 0.18;
      for (let i = 0; i < 70; i++) R(g, 60 + i * 1.2, 120 - i * 1.6, 6, 2, '#fff6c8');
      for (let i = 0; i < 70; i++) R(g, 320 - i * 0.8, 120 - i * 1.6, 6, 2, '#fff6c8');
      g.globalAlpha = 1;
      let x = 0;
      while (x < W) {
        const w = 14 + r() * 22;
        const h = 18 + r() * 46;
        R(g, x, GY - h, w, h, '#2a1e1e');
        for (let k = 0; k < 4; k++) R(g, x + r() * (w - 4), GY - h + r() * 4 - 4, 4, 4, '#2a1e1e');
        for (let k = 0; k < 3; k++) if (r() > 0.5) R(g, x + 3 + r() * (w - 8), GY - h + 8 + r() * (h - 14), 3, 3, '#e8803a');
        x += w + 2;
      }
      ground(g, '#4a4438', '#3a352c', r, 8);
      for (let i = 0; i < 40; i++) R(g, r() * W, r() * 80, 1, 1, '#ffb060');
    },
    // 7 Cold War — night, radar dish, missile, the Wall, snow
    (g, r) => {
      sky(g, ['#0a1424', '#0e1a2e', '#14263e', '#1e3650', '#2a4a62']);
      stars(g, r, 90, 90);
      disc(g, 70, 36, 10, '#e8eef4');
      disc(g, 74, 34, 9, '#0e1a2e');
      R(g, 250, GY - 30, 4, 30, '#0a121c');
      disc(g, 252, GY - 40, 14, '#0a121c');
      disc(g, 256, GY - 44, 11, '#14263e');
      R(g, 320, GY - 90, 10, 90, '#0a121c');
      R(g, 318, GY - 90, 14, 6, '#0a121c');
      R(g, 322, GY - 100, 6, 10, '#0a121c');
      R(g, 314, GY - 20, 22, 20, '#0a121c');
      for (let x2 = 0; x2 < 220; x2 += 22) {
        R(g, x2, GY - 26, 20, 26, '#5a5c66');
        R(g, x2, GY - 28, 20, 3, '#6a6c76');
        R(g, x2 + 19, GY - 26, 1, 26, '#3a3c46');
      }
      ground(g, '#c8d2dc', '#aeb8c6', r, 10);
      for (let i = 0; i < 60; i++) R(g, r() * W, r() * GY, 1, 1, '#d8e4f0');
    },
    // 8 Modern — day skyline with glass towers
    (g, r) => {
      sky(g, ['#3a82c8', '#5296d2', '#72acdc', '#98c4e8', '#bcdaf0']);
      cloud(g, 60, 26, 2, '#f0f8ff');
      let x = 0;
      while (x < W) {
        const w = 18 + r() * 24;
        const h = 30 + r() * 72;
        const col = r() > 0.5 ? '#4e6078' : '#5c7090';
        R(g, x, GY - h, w, h, col);
        for (let yy = GY - h + 4; yy < GY - 4; yy += 6) for (let xx = x + 3; xx < x + w - 3; xx += 5) R(g, xx, yy, 3, 3, r() > 0.3 ? '#9cc4e8' : '#e8f0a0');
        if (r() > 0.7) R(g, x + w / 2, GY - h - 12, 1, 12, '#2a2a2a');
        x += w + 3;
      }
      ground(g, '#8a8478', '#76706a', r, 11);
      for (let k = 0; k < W; k += 24) R(g, k, GY + 40, 12, 2, '#e8e4dc');
    },
    // 9 Future — neon night, towers, rings and a glowing grid
    (g, r) => {
      sky(g, ['#0c0620', '#160a34', '#24104a', '#3a1660', '#5a1a72']);
      stars(g, r, 70, 80);
      disc(g, 300, 50, 22, '#ff3cac');
      for (let y = 0; y < 44; y += 4) R(g, 276, 28 + y, 48, 2, '#3a1660');
      let x = 0;
      while (x < W) {
        const w = 14 + r() * 20;
        const h = 36 + r() * 76;
        R(g, x, GY - h, w, h, '#120a28');
        for (let yy = GY - h + 4; yy < GY - 4; yy += 7) if (r() > 0.3) R(g, x + 2, yy, w - 4, 1, r() > 0.5 ? '#2ee6ff' : '#ff3cac');
        x += w + 4;
      }
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        R(g, 110 + Math.cos(a) * 34, 46 + Math.sin(a) * 8, 2, 1, '#2ee6ff');
      }
      R(g, 0, GY, W, H - GY, '#1a0a30');
      for (let y = GY; y < H; y += 6 + (y - GY) / 6) R(g, 0, y, W, 1, '#7a2aa8');
      for (let k = -20; k <= 20; k++) {
        const x0 = W / 2 + k * 10;
        const x1 = W / 2 + k * 40;
        for (let t = 0; t < 1; t += 0.02) R(g, x0 + (x1 - x0) * t, GY + (H - GY) * t, 1, 1, '#7a2aa8');
      }
      R(g, 0, GY, W, 2, '#2ee6ff');
    },
  ];
})(typeof window !== 'undefined' ? window : globalThis);
