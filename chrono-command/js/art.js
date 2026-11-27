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

  // ------------------------------------------------------------ outline + tint helpers
  // a 1px dark outline around every opaque shape: the classic 8-bit sprite edge
  CW.outlined = function (src, col, pad) {
    pad = pad || 0;
    const w = src.width + pad * 2;
    const h = src.height + pad * 2;
    const c = canvas(w, h);
    const g = c.getContext('2d');
    g.drawImage(src, pad, pad);
    const img = g.getImageData(0, 0, w, h);
    const a = img.data;
    const [r, gg, b] = hex2rgb(col);
    const solid = (x, y) => x >= 0 && y >= 0 && x < w && y < h && a[(y * w + x) * 4 + 3] > 40;
    const mark = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) mark.push((y * w + x) * 4);
      }
    for (const i of mark) {
      a[i] = r;
      a[i + 1] = gg;
      a[i + 2] = b;
      a[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return c;
  };
  CW.tinted = function (src, col) {
    src._tint = src._tint || {};
    if (!src._tint[col]) {
      const c = canvas(src.width, src.height);
      const g = c.getContext('2d');
      g.drawImage(src, 0, 0);
      g.globalCompositeOperation = 'source-in';
      g.fillStyle = col;
      g.fillRect(0, 0, c.width, c.height);
      src._tint[col] = c;
    }
    return src._tint[col];
  };

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
    const oc2 = CW.outlined(c, '#120e12', 1);
    const out = { c: oc2, w: w + 2, h: h + 2, air: !!AIR[sp.k], multi: sp.k === 'soldier' };
    out.flash = CW.tinted(oc2, '#ffffff');
    scache[key] = out;
    return out;
  };
  const uurl = {};
  CW.unitURL = function (uid) {
    if (!uurl[uid]) {
      const s = CW.unitSprite(uid, 'a');
      const c = canvas(28, 22);
      const g = c.getContext('2d');
      if (s.multi) {
        g.drawImage(s.c, 1, 2);
        g.drawImage(s.c, 12, 6);
      } else g.drawImage(s.c, Math.floor((28 - s.w) / 2), Math.floor((22 - s.h) / 2));
      uurl[uid] = c.toDataURL();
    }
    return uurl[uid];
  };

  // ------------------------------------------------------------ bitmap font (3x5)
  const GL = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
    '.': '000000000000010', '!': '010010010000010', '+': '000010111010000', '-': '000000111000000', ':': '000010000010000',
    '/': '001001010100100', ' ': '000000000000000', '%': '101001010100101', '?': '111001011000010', "'": '010010000000000', ',': '000000000010100',
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
