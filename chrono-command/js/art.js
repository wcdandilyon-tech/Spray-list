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
  // work canvases that get read back pixel by pixel are flagged for fast reads;
  // finished sprites are copied onto plain canvases so they stay fast to draw every frame
  function rcanvas(w, h) {
    const c = canvas(w, h);
    c.getContext('2d', { willReadFrequently: true });
    return c;
  }
  CW.rcanvas = rcanvas;
  CW.plain = function (src) {
    const c = canvas(src.width, src.height);
    c.getContext('2d').drawImage(src, 0, 0);
    return c;
  };
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
    const c = rcanvas(w, h);
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
    return CW.plain(c);
  };
  // ---- Scale2x (EPX): doubles a pixel-art image, rounding off diagonal stair-steps without any blur
  CW.scale2x = function (src) {
    const w = src.width;
    const h = src.height;
    const s = new Uint32Array(src.getContext('2d').getImageData(0, 0, w, h).data.buffer);
    for (let i = 0; i < s.length; i++) if (s[i] >>> 24 === 0) s[i] = 0;
    const out = rcanvas(w * 2, h * 2);
    const og = out.getContext('2d');
    const od = og.createImageData(w * 2, h * 2);
    const o = new Uint32Array(od.data.buffer);
    const W2 = w * 2;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const P = s[y * w + x];
        const A = y > 0 ? s[(y - 1) * w + x] : P;
        const D = y < h - 1 ? s[(y + 1) * w + x] : P;
        const C = x > 0 ? s[y * w + x - 1] : P;
        const B = x < w - 1 ? s[y * w + x + 1] : P;
        const i = y * 2 * W2 + x * 2;
        o[i] = C === A && C !== D && A !== B ? A : P;
        o[i + 1] = A === B && A !== C && B !== D ? B : P;
        o[i + W2] = D === C && D !== B && C !== A ? C : P;
        o[i + W2 + 1] = B === D && B !== A && D !== C ? D : P;
      }
    og.putImageData(od, 0, 0);
    return out;
  };
  CW.u32 = (hex) => {
    const [r, g, b] = hex2rgb(hex);
    return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
  };
  function adj(v, a) {
    const f = (c) => Math.max(0, Math.min(255, Math.round(a < 0 ? c * (1 + a) : c + (255 - c) * a)));
    return ((v & 0xff000000) | (f((v >>> 16) & 255) << 16) | (f((v >>> 8) & 255) << 8) | f(v & 255)) >>> 0;
  }
  // light from the top left: a bright rim on upper and left edges, shade on lower and right edges,
  // and a faint weave texture inside large flat areas (cloth, hair, armour), skipping the colours in opts.skip
  CW.edgeLight = function (c, opts) {
    opts = opts || {};
    const w = c.width;
    const h = c.height;
    const g = c.getContext('2d');
    const img = g.getImageData(0, 0, w, h);
    const d = new Uint32Array(img.data.buffer);
    const src = d.slice();
    const solid = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? !!opts.edgeSolid : src[y * w + x] >>> 24 > 40);
    const rim = opts.rim === undefined ? 0.16 : opts.rim;
    const sh = opts.shade === undefined ? -0.16 : opts.shade;
    const tex = opts.tex || 0;
    const skip = opts.skip;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const v = src[i];
        if (v >>> 24 <= 40) continue;
        if (!solid(x, y - 1) || !solid(x - 1, y)) d[i] = adj(v, rim);
        else if (!solid(x, y + 1) || !solid(x + 1, y)) d[i] = adj(v, sh);
        else if (tex && !(skip && skip.has(v)) && x > 0 && y > 0 && x < w - 1 && y < h - 1 && src[i - 1] === v && src[i + 1] === v && src[i - w] === v && src[i + w] === v) {
          const k = ((x * 73856093) ^ (y * 19349663)) >>> 0;
          if (k % 7 === 0) d[i] = adj(v, -tex);
          else if (k % 11 === 0) d[i] = adj(v, tex * 0.7);
        }
      }
    g.putImageData(img, 0, 0);
    return c;
  };
  // cached renders of the pixel font, so damage numbers and labels cost one drawImage each
  const tcache = new Map();
  CW.textImg = function (str, col, scale, outline) {
    scale = scale || 1;
    const key = str + '|' + col + '|' + scale + '|' + (outline || '');
    let c = tcache.get(key);
    if (c) return c;
    if (tcache.size > 600) tcache.clear();
    const t = String(str).toUpperCase();
    c = canvas(Math.max(1, t.length * 4 * scale + 2), 5 * scale + 2);
    CW.bitText(c.getContext('2d'), t, 1, 1, col, scale, outline);
    tcache.set(key, c);
    return c;
  };
  // cached filled circles at 2x resolution for explosions
  const dcache = new Map();
  CW.disc = function (r, col) {
    const R2 = Math.max(1, Math.round(r * 2));
    const key = R2 + col;
    let c = dcache.get(key);
    if (c) return c;
    c = canvas(R2 * 2 + 1, R2 * 2 + 1);
    const g = c.getContext('2d');
    g.fillStyle = col;
    for (let y = -R2; y <= R2; y++) {
      const w = Math.round(Math.sqrt(R2 * R2 - y * y));
      g.fillRect(R2 - w, R2 + y, w * 2 + 1, 1);
    }
    dcache.set(key, c);
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
    mammoth: [
      '......HHH...........',
      '.....HSSE...........',
      '....TTTTTT..........',
      '....CCCCCC..........',
      '..BBBBBBBBBBBB......',
      '.BBBDBBBBBDBBBBB....',
      'BBBBBBBBBBBBBBBBB...',
      'BBBDBBBBBDBBBBBBBB..',
      'BBBBBBBBBBBBBBBEBBB.',
      'BBBBBBBBBBBBBBBBBBBB',
      'BBDBBBBBBDBBBBBBWWBB',
      '.BBBBBBBBBBBBBBW..WB',
      '..BBB.BBB.BBB.W...B.',
      '..BBB.BBB.BBB.....B.',
      '..XXX.XXX.XXX.......',
    ],
    wolf: [
      '..........B.',
      '.........BB.',
      'B.......BBEB',
      'BBBBBBBBBBBX',
      '.BBBBBBBBB..',
      '.BBTBBBBBB..',
      '..B.B..B.B..',
      '..F.F..F.F..',
    ],
    ram: [
      '....XXXXXXXXXX....',
      '...XTTTTTTTTTTX...',
      '..XBBBBBBBBBBBBX..',
      '..XBDDDDDDDDDDBX..',
      '..XB..........BX..',
      'WWWWWWWWWWWWWWWWMM',
      '..XB..........BX..',
      '..XBBBBBBBBBBBBX..',
      '..XOX........XOX..',
      '...X..........X...',
    ],
    catapult: [
      '............QQ..',
      '...........WQQ..',
      '..........W.....',
      '.........W......',
      '........W.......',
      '.......W........',
      '..BBBBBWBBBBBB..',
      '..BDDBBBBBBDDB..',
      '..BTTBBBBBBTTB..',
      '.XOX........XOX.',
      '..X..........X..',
    ],
    trebuchet: [
      '.............QQ.',
      '............W.Q.',
      '...........W....',
      '..........W.....',
      '.........W......',
      '....B...W...B...',
      '....B..W....B...',
      '...BB.W.B...BB..',
      '...B.W..B....B..',
      '...BW...B....B..',
      '..QQQ...B.....B.',
      '..QQQ..BB.....BB',
      '..BBBBBBBBBBBBBB',
      '..BTTBBBBBBBTTBB',
      '.XOX.........XOX',
      '..X...........X.',
    ],
    car: [
      '......XXXX......',
      '.....XGGBBX.....',
      '..XXXBBBBBBXXX..',
      '.XBBBBBBBBBBBBBX',
      'XBBBTBBBBBBBTBBX',
      'XBBBBBBBBBBBBBBX',
      '.XXOOXXXXXXOOXX.',
      '..XOOX....XOOX..',
      '...XX......XX...',
    ],
    plane: [
      '..B.................',
      '..BB................',
      '..BBB.......GG......',
      'BBBBBBBBBBBBBBBBBBM.',
      '.BBBBTTBBBBBBBBBBBMM',
      '....BBBBBBBB....M...',
      '......BBB...........',
    ],
    hoverbike: [
      '......HHH.......',
      '.....HSSE.......',
      '......BBBS......',
      '.....BTTBB......',
      '..XBBBBBBBBBBGG.',
      '.XBBBBBBBBBBBBBG',
      '..XXXXXXXXXXXX..',
      '...GGGGGGGGGG...',
    ],
  };
  const AIR = { heli: 1, drone: 1, bomber: 1, plane: 1 };

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
    } else if (w === 'club') {
      [[8, 2], [9, 2], [8, 3], [9, 3], [8, 4], [8, 5], [8, 6]].forEach(([x, y]) => add(x, y, 'W'));
    } else if (w === 'rock') {
      add(7, 5, 'S');
      add(8, 4, 'Q');
      add(9, 4, 'Q');
      add(8, 3, 'Q');
    } else if (w === 'axe') {
      for (let y = 3; y < 8; y++) add(8, y, 'W');
      add(8, 2, 'M');
      add(9, 2, 'M');
      add(9, 3, 'M');
      add(9, 4, 'M');
    } else if (w === 'javelin') {
      [[5, 8], [6, 7], [7, 6], [8, 5], [9, 4]].forEach(([x, y]) => add(x, y, 'W'));
      add(9, 3, 'M');
    } else if (w === 'blade') {
      for (let y = 1; y < 6; y++) add(8, y, 'G');
      add(8, 6, 'W');
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
  // a unit's sprite in its team colours; allies face right and enemies left unless flip is set
  CW.unitSprite = function (uid, side, flip) {
    const key = uid + side + (flip ? 'f' : '');
    if (scache[key]) return scache[key];
    const right = (side === 'a') !== !!flip;
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
      G: sp.w === 'plasma' || sp.w === 'blade' ? '#d08aff' : '#7dffb0',
      Q: '#8a8a8a',
      D: shade(sp.body, -0.22),
      X: shade(sp.body, -0.45),
      O: '#3a342e',
      N: sp.horse || '#6a4426',
      C: sp.cloth || sp.howdah || shade(sp.body, -0.1),
      K: sp.shield || '#8a6a3a',
      R: sp.crest || team,
      Y: sp.horn || '#e8c84a',
    };
    if (['cannon', 'tank', 'landship', 'heli', 'drone', 'bomber', 'mech', 'car', 'plane', 'hoverbike'].includes(sp.k)) {
      pal.M = sp.k === 'cannon' ? sp.body : sp.k === 'heli' || sp.k === 'drone' ? '#9aa0a8' : shade(sp.body, -0.2);
      pal.G = sp.k === 'mech' ? '#ff4a4a' : '#9ad8ff';
      if (sp.k === 'cannon') {
        pal.B = '#3a4a7a';
        pal.H = '#2a2a2a';
        pal.L = '#e8e4dc';
      }
    }
    if (sp.k === 'elephant') pal.B = sp.body;
    if (sp.k === 'mammoth') pal.W = '#ece4d0';
    if (sp.k === 'hoverbike' || sp.scifi) pal.G = '#2ee6ff';
    if (sp.k === 'hoverbike') pal.M = '#2ee6ff';
    if (sp.jet) pal.M = shade(sp.body, -0.3);
    if (sp.scifi) pal.M = '#2ee6ff';
    if (sp.k === 'mech' && sp.body === '#4a3a6a') pal.G = '#d08aff';
    if (sp.k === 'tank' && sp.long) rows = rows.map((r, i) => (i === 2 ? r.replace('MMMMMMM..', 'MMMMMMMMM') : r));
    const h = rows.length;
    const w = rows[0].length;
    const grid = rows.map((r) => r.split(''));
    if (sp.jeep) {
      grid[0] = '......HH........'.split('');
      grid[1] = '.....XSSWWWW....'.split('');
    }
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
        const xx = right ? x : w - 1 - x;
        g.fillRect(xx, y, 1, 1);
      }
    // 2x detail: upscale, light the edges, then a thin outline at the new resolution
    const oc2 = CW.outlined(CW.edgeLight(CW.scale2x(c), { rim: 0.2, shade: -0.18 }), '#120e12', 1);
    const out = { c: oc2, w: oc2.width / 2, h: oc2.height / 2, air: !!AIR[sp.k], multi: sp.k === 'soldier' };
    out.flash = CW.tinted(oc2, '#ffffff');
    scache[key] = out;
    return out;
  };
  const uurl = {};
  CW.unitURL = function (uid) {
    if (!uurl[uid]) {
      const s = CW.unitSprite(uid, 'a');
      const c = canvas(56, 44);
      const g = c.getContext('2d');
      if (s.multi) {
        g.drawImage(s.c, 6, 2);
        g.drawImage(s.c, 24, 14);
      } else {
        const k = Math.min(1, 54 / s.c.width, 42 / s.c.height);
        g.drawImage(s.c, Math.floor((56 - s.c.width * k) / 2), Math.floor((44 - s.c.height * k) / 2), Math.round(s.c.width * k), Math.round(s.c.height * k));
      }
      uurl[uid] = c.toDataURL();
    }
    return uurl[uid];
  };

  // a fallen version of any sprite: lying on its side and darkened
  CW.corpse = function (img) {
    if (img._corpse) return img._corpse;
    const c = canvas(img.height, img.width);
    const g = c.getContext('2d');
    g.translate(img.height, 0);
    g.rotate(Math.PI / 2);
    g.drawImage(img, 0, 0);
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(20,14,18,.45)';
    g.fillRect(0, 0, c.width, c.height);
    img._corpse = c;
    return c;
  };
  CW.shadowImg = (() => {
    const c = canvas(32, 10);
    const g = c.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,.32)';
    for (let y = 0; y < 10; y++) {
      const k = (y + 0.5 - 5) / 5;
      const w = Math.round(16 * Math.sqrt(Math.max(0, 1 - k * k)));
      g.fillRect(16 - w, y, w * 2, 1);
    }
    return c;
  })();

  // ------------------------------------------------------------ the battlefield: a tilted top-down view
  // World: x 0..360 left to right, z 0..120 from the far edge to the near edge.
  // proj() turns a world point into a screen point (field units) and a scale; far rows are smaller and higher up.
  const HZ = 96;
  CW.HZ = HZ;
  CW.proj = function (x, z) {
    const t = Math.max(0, Math.min(1, z / 120));
    const s = 0.6 + 0.45 * t;
    return { x: 192 + (x - 180) * s, y: 104 + 104 * t * (0.5 + 0.5 * t), s };
  };
  CW.unproj = function (sx, sy) {
    const u = Math.max(0, (sy - 104) / 104);
    const t = Math.min(1, -0.5 + Math.sqrt(0.25 + 2 * u));
    const s = 0.6 + 0.45 * t;
    return { x: 180 + (sx - 192) / s, z: 120 * t };
  };
  // ------------------------------------------------------------ the whole scene around the battlefield
  // The battle canvas follows the shape of the screen. The 768x432 field sits at (OX, OY) inside it and the scene
  // carries on around it: the era's sky climbs above, its scenery repeats (mirrored) to the sides and the ground
  // keeps coming towards the camera below, with bigger props up close. Colours get a lift so the eras read vivid,
  // and the far edges darken a little so the eye stays on the battle.
  const projU = (x, z) => {
    const t = z / 120;
    const s = 0.6 + 0.45 * t;
    return { x: 192 + (x - 180) * s, y: 104 + 104 * t * (0.5 + 0.5 * t), s };
  };
  const sceneCache = new Map();
  const luma = (c) => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  // a few colours read once per era from its backdrop: the top of the sky and the haze at the horizon
  const infoCache = {};
  CW.sceneInfo = function (era) {
    if (infoCache[era]) return infoCache[era];
    const bd = CW.backdrop(era);
    const c = rcanvas(1, 3);
    const x = c.getContext('2d');
    x.drawImage(bd, 4, 2, 1, 1, 0, 0, 1, 1);
    x.drawImage(bd, 384, 236, 1, 1, 0, 1, 1, 1);
    const d = x.getImageData(0, 0, 1, 2).data;
    const top = [d[0], d[1], d[2]];
    return (infoCache[era] = { night: luma(top) < 0.3, top, haze: [d[4], d[5], d[6]] });
  };
  // ------------------------------------------------------------ scenery props: trees, rocks, ruins and machines, by era
  // Each prop is drawn at its final size (k = scene pixels per field unit at its depth) on a grid of pixels, shaded
  // from the top left like the soldiers, given a dark outline, and cached. The scene places them where soldiers never
  // walk: a treeline just behind the far edge, groves in the corners beside the battle, low props in the foreground.
  function Grid(w, h) {
    this.w = Math.max(1, w);
    this.h = Math.max(1, h);
    this.c = new Array(this.w * this.h).fill(null);
    this.glow = [];
    this.ax = this.w / 2;
  }
  Grid.prototype.set = function (x, y, col) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.c[y * this.w + x] = col;
  };
  Grid.prototype.get = function (x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.c[y * this.w + x] : null;
  };
  const SZ = (k, v) => Math.max(1, Math.round(k * v));
  const tone = (pal, l) => pal[l > 0.45 ? 0 : l > -0.1 ? 1 : l > -0.55 ? 2 : 3];
  // a shaded ball: canopies, boulders, domes, caps
  function ball(G, cx, cy, rx, ry, pal, rough, rand) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++)
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        let d = dx * dx + dy * dy;
        if (rough) d += (rand() - 0.5) * rough;
        if (d > 1) continue;
        G.set(x, y, tone(pal, -(dx * 0.62 + dy * 0.78) + ((x + y) & 1 ? 0.07 : -0.07)));
      }
  }
  function box(G, x, y, w, h, col) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) G.set(x + i, y + j, col);
  }
  // an upright shaded post: trunks, poles, pillars (light on the left, shadow on the right)
  function post(G, cx, y0, y1, w, pal) {
    const x0 = Math.round(cx - w / 2);
    for (let y = Math.floor(y0); y < y1; y++)
      for (let i = 0; i < w; i++) G.set(x0 + i, y, pal[w < 3 ? (i ? 2 : 1) : i / w < 0.3 ? 0 : i / w < 0.7 ? 1 : 2]);
  }
  // a thick line from (x0,y0) to (x1,y1)
  function line(G, x0, y0, x1, y1, w, col) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * i) / n;
      const ww = typeof w === 'function' ? w(i / n) : w;
      for (let a = 0; a < ww; a++) for (let b = 0; b < ww; b++) G.set(x - ww / 2 + a, y - ww / 2 + b, col);
    }
  }
  // a triangle tier (pines, crystals, tents): lighter on the left
  function tier(G, cx, top, bot, half, pal, jag) {
    for (let y = Math.floor(top); y < bot; y++) {
      const hw = (half * (y - top + 1)) / (bot - top);
      for (let x = Math.floor(cx - hw); x <= Math.ceil(cx + hw); x++) {
        const u = (x - (cx - hw)) / Math.max(1, 2 * hw);
        G.set(x, y, pal[u < 0.3 ? 0 : u < 0.65 ? 1 : 2]);
      }
    }
    if (jag) for (let x = Math.floor(cx - half); x <= cx + half; x += 2) G.set(x, bot, pal[2]);
  }
  // snow settles on every upward-facing edge
  function snowCaps(G, col, depth) {
    for (let x = 0; x < G.w; x++)
      for (let y = 0; y < G.h; y++)
        if (G.c[y * G.w + x] && !G.get(x, y - 1)) for (let d = 0; d < depth; d++) if (G.get(x, y + d)) G.set(x, y + d, d ? '#dfe9ee' : col);
  }
  // grid -> canvas, with a dark edge around everything and any glows on top
  function gridCanvas(G) {
    const pad = 1 + Math.max(0, ...G.glow.map((o) => Math.ceil(o.r)));
    const c = canvas(G.w + pad * 2, G.h + pad);
    const g = c.getContext('2d');
    for (let y = -1; y <= G.h; y++)
      for (let x = -1; x <= G.w; x++) {
        if (G.get(x, y)) continue;
        let nb = null;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) nb = nb || G.get(x + dx, y + dy);
        if (!nb || y === G.h) continue;
        g.fillStyle = nb.startsWith('#') ? shade(nb, -0.62) : 'rgba(20,14,24,.8)';
        g.fillRect(x + pad, y + pad, 1, 1);
      }
    for (let y = 0; y < G.h; y++)
      for (let x = 0; x < G.w; x++) {
        const col = G.c[y * G.w + x];
        if (!col) continue;
        g.fillStyle = col;
        g.fillRect(x + pad, y + pad, 1, 1);
      }
    for (const o of G.glow) {
      for (let r = Math.ceil(o.r); r > 0; r--) {
        g.fillStyle = o.col;
        g.globalAlpha = 0.07;
        g.beginPath();
        g.arc(o.x + pad, o.y + pad, r, 0, Math.PI * 2);
        g.fill();
      }
      g.globalAlpha = 1;
    }
    c.ax = G.ax + pad;
    c.ay = G.h + pad;
    return c;
  }

  const P_BARK = ['#a8784a', '#80563a', '#5a3c26', '#3a2618'];
  const P_STONE = ['#c8c4bc', '#a09a90', '#78726a', '#544e48'];
  const P_WOOD = ['#c89a5a', '#a07440', '#7a542e', '#523620'];
  const P_STEEL = ['#9aa2ac', '#747c88', '#545a64', '#3a3e46'];
  const P_LEAF = {
    green: ['#9ae05a', '#62b83e', '#3e8a30', '#265a26'],
    lush: ['#7ae06a', '#3eb84a', '#24883a', '#16582c'],
    olive: ['#c4d49a', '#98aa74', '#6e8058', '#4a5a40'],
    dry: ['#d8d06a', '#aaa448', '#7a7a34', '#525224'],
    pine: ['#5aa070', '#3a7a56', '#265a42', '#18402e'],
    cypress: ['#4e8a4a', '#326a38', '#224e2a', '#16361e'],
    palm: ['#8ad05a', '#5aa83e', '#3a7e30', '#245622'],
    autumn: ['#f0b040', '#d07a2a', '#a04e22', '#6a3018'],
  };
  const PROPS = {
    tree(k, rand, o) {
      const G = new Grid(SZ(k, 30), SZ(k, 44));
      const W = G.w;
      const H = G.h;
      const cx = W / 2 + (rand() - 0.5) * 2;
      const leaf = P_LEAF[o.leaf || 'green'];
      post(G, cx, H * 0.4, H, Math.max(2, SZ(k, 3.4)), P_BARK);
      line(G, cx, H * 0.62, cx - W * 0.2, H * 0.46, Math.max(1, SZ(k, 1.4)), P_BARK[2]);
      line(G, cx, H * 0.58, cx + W * 0.22, H * 0.42, Math.max(1, SZ(k, 1.4)), P_BARK[2]);
      const lumps = [[-0.2, 0.42, 0.24], [0.22, 0.4, 0.24], [0, 0.3, 0.3], [-0.14, 0.2, 0.22], [0.16, 0.18, 0.2], [0, 0.12, 0.2]];
      for (const [dx, dy, r] of lumps) ball(G, cx + dx * W, dy * H + (rand() - 0.5) * 2, r * W * (0.9 + rand() * 0.2), r * W * 0.82, leaf, 0.35, rand);
      if (o.fruit) for (let i = 0; i < 5; i++) {
        const x = cx + (rand() - 0.5) * W * 0.6;
        const y = H * (0.1 + rand() * 0.35);
        if (G.get(x, y)) box(G, x, y, Math.max(1, SZ(k, 1)), Math.max(1, SZ(k, 1)), o.fruit);
      }
      if (o.snow) snowCaps(G, '#ffffff', Math.max(1, SZ(k, 1.2)));
      G.ax = cx;
      return G;
    },
    pine(k, rand, o) {
      const G = new Grid(SZ(k, 22), SZ(k, 50));
      const W = G.w;
      const H = G.h;
      const cx = W / 2;
      post(G, cx, H * 0.8, H, Math.max(2, SZ(k, 2.6)), P_BARK);
      const pal = P_LEAF.pine;
      for (let i = 3; i >= 0; i--) {
        const top = H * (0.02 + i * 0.17);
        tier(G, cx, top, top + H * 0.3, W * (0.2 + i * 0.09), pal, true);
      }
      if (o.snow) snowCaps(G, '#ffffff', Math.max(1, SZ(k, 1.6)));
      return G;
    },
    palm(k, rand) {
      const G = new Grid(SZ(k, 34), SZ(k, 46));
      const W = G.w;
      const H = G.h;
      const lean = (rand() - 0.5) * W * 0.35;
      const tw = Math.max(2, SZ(k, 2.6));
      let tx = W / 2;
      const top = H * 0.24;
      for (let y = H - 1; y >= top; y--) {
        const t = (H - 1 - y) / (H - 1 - top);
        tx = W / 2 + lean * t * t;
        for (let i = 0; i < tw; i++) G.set(tx - tw / 2 + i, y, (Math.floor(y / Math.max(2, SZ(k, 2.2))) % 2 ? P_BARK[1] : P_BARK[0 + (i ? 1 : 0)]));
      }
      const leaf = P_LEAF.palm;
      for (let f = 0; f < 7; f++) {
        const a = -Math.PI + (f / 6) * Math.PI + (rand() - 0.5) * 0.3;
        const L = W * (0.38 + rand() * 0.1);
        let px = tx;
        let py = top;
        for (let s = 0; s <= 1; s += 1 / (L * 1.5)) {
          const x = tx + Math.cos(a) * L * s;
          const y = top + Math.sin(a) * L * s * 0.55 + s * s * L * 0.45;
          line(G, px, py, x, y, s < 0.5 ? Math.max(1, SZ(k, 1.6)) : 1, leaf[s < 0.3 ? 1 : f % 2 ? 2 : 1]);
          if (((s * L) | 0) % 3 === 0) G.set(x, y + 1, leaf[2]);
          px = x;
          py = y;
        }
      }
      ball(G, tx, top + SZ(k, 1.5), SZ(k, 2.2), SZ(k, 1.8), ['#8a6a3a', '#6a4a26', '#4a321a', '#2a1c10'], 0, rand);
      G.ax = W / 2;
      return G;
    },
    cypress(k, rand) {
      const G = new Grid(SZ(k, 11), SZ(k, 46));
      post(G, G.w / 2, G.h * 0.9, G.h, Math.max(2, SZ(k, 1.8)), P_BARK);
      ball(G, G.w / 2, G.h * 0.46, G.w * 0.46, G.h * 0.46, P_LEAF.cypress, 0.25, rand);
      return G;
    },
    olive(k, rand) {
      const G = new Grid(SZ(k, 32), SZ(k, 28));
      const W = G.w;
      const H = G.h;
      line(G, W / 2, H, W / 2 - W * 0.08, H * 0.55, Math.max(2, SZ(k, 2.8)), P_BARK[1]);
      line(G, W / 2 - W * 0.06, H * 0.7, W / 2 + W * 0.14, H * 0.46, Math.max(1, SZ(k, 2)), P_BARK[2]);
      for (const [dx, dy, r] of [[-0.22, 0.4, 0.2], [0.2, 0.38, 0.22], [0, 0.28, 0.26], [-0.08, 0.18, 0.2], [0.14, 0.2, 0.18]])
        ball(G, W / 2 + dx * W, dy * H, r * W, r * W * 0.62, P_LEAF.olive, 0.4, rand);
      return G;
    },
    bush(k, rand, o) {
      const G = new Grid(SZ(k, 20), SZ(k, 12));
      const leaf = P_LEAF[o.leaf || 'green'];
      for (const [dx, r] of [[-0.24, 0.24], [0.22, 0.26], [0, 0.34]]) ball(G, G.w / 2 + dx * G.w, G.h - r * G.w * 0.7, r * G.w, r * G.w * 0.7, leaf, 0.35, rand);
      if (o.flower) for (let i = 0; i < 4; i++) {
        const x = G.w * (0.2 + rand() * 0.6);
        const y = G.h * (0.2 + rand() * 0.5);
        if (G.get(x, y)) G.set(x, y, o.flower);
      }
      if (o.snow) snowCaps(G, '#ffffff', Math.max(1, SZ(k, 1.2)));
      return G;
    },
    fern(k, rand) {
      const G = new Grid(SZ(k, 18), SZ(k, 12));
      for (let f = 0; f < 7; f++) {
        const a = -Math.PI * (0.12 + (f / 6) * 0.76);
        line(G, G.w / 2, G.h, G.w / 2 + Math.cos(a) * G.w * 0.48, G.h + Math.sin(a) * G.h * 0.95, 1, P_LEAF.lush[f % 2 ? 1 : 2]);
      }
      return G;
    },
    boulder(k, rand, o) {
      const G = new Grid(SZ(k, 18 + rand() * 10), SZ(k, 11 + rand() * 5));
      const pal = o.stone || P_STONE;
      ball(G, G.w / 2, G.h * 0.58, G.w / 2 - 0.5, G.h * 0.58, pal, 0.25, rand);
      ball(G, G.w * 0.3, G.h * 0.72, G.w * 0.22, G.h * 0.3, pal, 0.25, rand);
      line(G, G.w * 0.55, G.h * 0.3, G.w * 0.62, G.h * 0.62, 1, pal[3]);
      if (o.moss) for (let x = 0; x < G.w; x++) for (let y = 0; y < G.h; y++) if (G.get(x, y) && !G.get(x, y - 1) && rand() < 0.7) G.set(x, y, o.moss);
      if (o.snow) snowCaps(G, '#ffffff', Math.max(1, SZ(k, 1.6)));
      return G;
    },
    column(k, rand) {
      const G = new Grid(SZ(k, 10), SZ(k, 24 + rand() * 16));
      const pal = ['#fbf6ea', '#e2d8c2', '#bcb096', '#948870'];
      const W = G.w;
      const H = G.h;
      box(G, 0, H - SZ(k, 2), W, SZ(k, 2), pal[1]);
      const sw = Math.max(3, Math.round(W * 0.72));
      const broken = rand() < 0.65;
      for (let x = 0; x < sw; x++) {
        const top = broken ? Math.round(H * 0.08 + rand() * H * 0.12) : SZ(k, 2);
        for (let y = top; y < H - SZ(k, 2); y++) G.set((W - sw) / 2 + x, y, pal[x % 3 === 2 ? 2 : x / sw < 0.35 ? 0 : x / sw < 0.75 ? 1 : 2]);
      }
      if (!broken) box(G, 0, 0, W, SZ(k, 2), pal[0]);
      return G;
    },
    obelisk(k, rand) {
      const G = new Grid(SZ(k, 10), SZ(k, 42));
      const W = G.w;
      const H = G.h;
      const pal = ['#f4dca8', '#dcbc80', '#b08e58', '#806440'];
      const tip = H * 0.1;
      for (let y = Math.floor(tip); y < H; y++) {
        const hw = (W / 2) * (0.62 + 0.38 * ((y - tip) / (H - tip)));
        for (let x = Math.floor(W / 2 - hw); x < W / 2 + hw; x++) G.set(x, y, pal[x < W / 2 - hw * 0.3 ? 0 : x < W / 2 + hw * 0.4 ? 1 : 2]);
      }
      tier(G, W / 2, 0, tip + 1, W * 0.31, ['#fff0a0', '#ffd23f', '#c8901e'], false);
      for (let y = Math.floor(tip + 4); y < H - 4; y += 3) G.set(W / 2 - 1, y, pal[3]);
      return G;
    },
    runestone(k, rand, o) {
      const G = new Grid(SZ(k, 13), SZ(k, 22));
      const W = G.w;
      const H = G.h;
      ball(G, W / 2, H * 0.3, W / 2 - 0.5, H * 0.3, P_STONE, 0.1, rand);
      box(G, 0, Math.floor(H * 0.3), W, Math.ceil(H * 0.7), P_STONE[1]);
      for (let y = Math.floor(H * 0.3); y < H; y++) G.set(W - 1, y, P_STONE[2]);
      // a carved serpent band
      for (let a = 0; a < Math.PI * 2; a += 0.08) G.set(W / 2 + Math.cos(a) * W * 0.3, H * 0.45 + Math.sin(a) * H * 0.28, '#b83a2a');
      if (o.snow) snowCaps(G, '#ffffff', Math.max(1, SZ(k, 1.4)));
      return G;
    },
    haystack(k, rand) {
      const G = new Grid(SZ(k, 18), SZ(k, 15));
      ball(G, G.w / 2, G.h * 0.62, G.w / 2 - 0.5, G.h * 0.62, ['#fff0a0', '#e8c860', '#c49a3a', '#8a6a2a'], 0.3, rand);
      for (let x = 1; x < G.w; x += 3) for (let y = 2; y < G.h; y += 4) if (G.get(x, y)) G.set(x, y, '#a07a2a');
      return G;
    },
    fence(k, rand) {
      const G = new Grid(SZ(k, 34), SZ(k, 10));
      const step = SZ(k, 7);
      for (let x = 1; x < G.w; x += step) post(G, x, 0, G.h, Math.max(1, SZ(k, 1.4)), P_WOOD);
      box(G, 0, SZ(k, 2.5), G.w, Math.max(1, SZ(k, 1.2)), P_WOOD[1]);
      box(G, 0, SZ(k, 6), G.w, Math.max(1, SZ(k, 1.2)), P_WOOD[2]);
      return G;
    },
    tent(k, rand, o) {
      const G = new Grid(SZ(k, 26), SZ(k, 24));
      const W = G.w;
      const H = G.h;
      const a = o.stripe || '#c8282a';
      for (let y = SZ(k, 3); y < H; y++) {
        const hw = (W / 2) * ((y - SZ(k, 3)) / (H - SZ(k, 3)));
        for (let x = Math.floor(W / 2 - hw); x <= W / 2 + hw; x++) {
          const band = Math.floor((x - (W / 2 - hw)) / Math.max(2, SZ(k, 3))) % 2;
          G.set(x, y, band ? (x < W / 2 ? '#f6f0e2' : '#d8d0c0') : x < W / 2 ? a : shade(a, -0.25));
        }
      }
      for (let y = Math.floor(H * 0.55); y < H; y++) for (let x = W / 2 - (y - H * 0.55) * 0.35; x < W / 2 + (y - H * 0.55) * 0.35; x++) G.set(x, y, '#3a2a22');
      post(G, W / 2, 0, SZ(k, 4), 1, P_WOOD);
      box(G, W / 2 + 1, 0, SZ(k, 4), SZ(k, 1.6), a);
      return G;
    },
    banner(k, rand, o) {
      const G = new Grid(SZ(k, 14), SZ(k, 36));
      post(G, SZ(k, 2), 0, G.h, Math.max(1, SZ(k, 1.2)), P_WOOD);
      const col = o.stripe || ['#c8282a', '#2a5ac8', '#e8b830', '#2a8a4a'][Math.floor(rand() * 4)];
      for (let x = SZ(k, 3); x < G.w; x++) {
        const off = Math.round(Math.sin(x * 0.6) * 1);
        for (let y = SZ(k, 2) + off; y < SZ(k, 13) + off; y++) G.set(x, y, x < G.w * 0.5 ? col : shade(col, -0.2));
      }
      G.ax = SZ(k, 2);
      return G;
    },
    barrel(k, rand, o) {
      const G = new Grid(SZ(k, 9), SZ(k, 11));
      const pal = o.drum ? [shade(o.drum, 0.3), o.drum, shade(o.drum, -0.25), shade(o.drum, -0.45)] : P_WOOD;
      for (let x = 0; x < G.w; x++) for (let y = 0; y < G.h; y++) G.set(x, y, pal[x / G.w < 0.3 ? 0 : x / G.w < 0.7 ? 1 : 2]);
      box(G, 0, SZ(k, 2), G.w, 1, pal[3]);
      box(G, 0, G.h - SZ(k, 3), G.w, 1, pal[3]);
      return G;
    },
    crates(k, rand, o) {
      const G = new Grid(SZ(k, 20), SZ(k, 16));
      const pal = o.metal ? P_STEEL : P_WOOD;
      const s = SZ(k, 8);
      const draw = (x0, y0) => {
        for (let x = 0; x < s; x++) for (let y = 0; y < s; y++) G.set(x0 + x, y0 + y, x === 0 || y === 0 ? pal[0] : x === s - 1 || y === s - 1 ? pal[2] : pal[1]);
        line(G, x0, y0, x0 + s - 1, y0 + s - 1, 1, pal[2]);
        if (o.metal) box(G, x0 + 2, y0 + 2, Math.max(1, s - 4), 1, o.glow || '#2ee6ff');
      };
      draw(0, G.h - s);
      draw(s + 1, G.h - s);
      draw(Math.round(s / 2), G.h - s * 2);
      return G;
    },
    deadtree(k, rand) {
      const G = new Grid(SZ(k, 28), SZ(k, 40));
      const col = ['#8a7a6a', '#6a5a4c', '#4a3e34', '#2e2620'];
      const br = (x, y, a, len, w, d) => {
        const x1 = x + Math.cos(a) * len;
        const y1 = y + Math.sin(a) * len;
        line(G, x, y, x1, y1, Math.max(1, Math.round(w)), col[d ? 2 : 1]);
        if (d < 3) {
          br(x1, y1, a - 0.45 - rand() * 0.3, len * 0.62, w * 0.6, d + 1);
          br(x1, y1, a + 0.4 + rand() * 0.3, len * 0.58, w * 0.6, d + 1);
        }
      };
      br(G.w / 2, G.h, -Math.PI / 2 + (rand() - 0.5) * 0.2, G.h * 0.42, SZ(k, 3.2), 0);
      return G;
    },
    sandbags(k, rand) {
      const G = new Grid(SZ(k, 28), SZ(k, 10));
      const bw = SZ(k, 6);
      const bh = SZ(k, 3.4);
      for (let row = 0; row < 3; row++)
        for (let x = (row % 2) * (bw / 2); x < G.w - bw * 0.5; x += bw)
          ball(G, x + bw / 2, G.h - bh / 2 - row * (bh - 1), bw / 2, bh / 2, ['#e0cc96', '#c4ac74', '#9a8456', '#6e5e3c'], 0.15, rand);
      return G;
    },
    hedgehog(k, rand) {
      const G = new Grid(SZ(k, 16), SZ(k, 13));
      const w = Math.max(1, SZ(k, 1.6));
      line(G, 1, G.h - 1, G.w - 2, 1, w, P_STEEL[1]);
      line(G, 1, 1, G.w - 2, G.h - 1, w, P_STEEL[2]);
      line(G, G.w / 2, 0, G.w / 2, G.h - 1, w, P_STEEL[0]);
      return G;
    },
    wire(k, rand) {
      const G = new Grid(SZ(k, 34), SZ(k, 9));
      for (let x = 1; x < G.w; x += SZ(k, 11)) post(G, x, 0, G.h, Math.max(1, SZ(k, 1.2)), P_WOOD);
      for (let x = 0; x < G.w; x++) G.set(x, G.h * 0.45 + Math.sin(x * 0.9) * G.h * 0.3, '#8a8a8a');
      return G;
    },
    ruinwall(k, rand) {
      const G = new Grid(SZ(k, 34), SZ(k, 22));
      const bw = SZ(k, 4);
      const bh = SZ(k, 2);
      for (let x = 0; x < G.w; x++) {
        const top = Math.round(G.h * (0.1 + Math.abs(Math.sin(x * 0.21 + rand())) * 0.5));
        for (let y = top; y < G.h; y++) {
          const row = Math.floor(y / bh);
          const edge = y % bh === 0 || (x + (row % 2) * (bw / 2)) % bw === 0;
          const win = x > G.w * 0.55 && x < G.w * 0.7 && y > G.h * 0.35 && y < G.h * 0.65;
          if (!win) G.set(x, y, edge ? P_STONE[2] : x < G.w * 0.4 ? P_STONE[0] : P_STONE[1]);
        }
      }
      return G;
    },
    smokestack(k, rand) {
      const G = new Grid(SZ(k, 22), SZ(k, 54));
      const pal = ['#c87a5a', '#a05a40', '#7a402e', '#52281e'];
      const W = G.w;
      const H = G.h;
      for (let y = Math.floor(H * 0.3); y < H; y++) {
        const hw = SZ(k, 3) + ((y - H * 0.3) / (H * 0.7)) * SZ(k, 1.5);
        for (let x = Math.floor(W / 2 - hw); x < W / 2 + hw; x++) G.set(x, y, (y % SZ(k, 6) === 0 ? pal[3] : pal[x < W / 2 - hw * 0.3 ? 0 : x < W / 2 + hw * 0.4 ? 1 : 2]));
      }
      for (let i = 0; i < 4; i++) ball(G, W / 2 + i * W * 0.12, H * 0.24 - i * H * 0.07, SZ(k, 3 + i), SZ(k, 2.5 + i * 0.6), ['#d8d4d0', '#b0aca8', '#8a8682', '#66625e'], 0.3, rand);
      return G;
    },
    barrier(k, rand) {
      const G = new Grid(SZ(k, 22), SZ(k, 9));
      for (let y = 0; y < G.h; y++) {
        const ins = Math.round((1 - y / G.h) * SZ(k, 2.5));
        for (let x = ins; x < G.w - ins; x++) G.set(x, y, y < 2 ? '#d8d6d0' : x < G.w * 0.3 ? '#c4c2bc' : '#a6a49e');
      }
      for (let x = 0; x < G.w; x++) if (Math.floor(x / SZ(k, 2.5)) % 2) G.set(x, G.h - SZ(k, 2), '#e8c030');
      return G;
    },
    mast(k, rand) {
      const G = new Grid(SZ(k, 14), SZ(k, 56));
      const W = G.w;
      const H = G.h;
      const col = '#9aa2ac';
      line(G, 1, H - 1, W / 2 - 0.5, 1, 1, col);
      line(G, W - 2, H - 1, W / 2 + 0.5, 1, 1, '#747c88');
      for (let y = 4; y < H; y += SZ(k, 5)) {
        const hw = (W / 2 - 1) * (y / H);
        line(G, W / 2 - hw, y, W / 2 + hw, y + SZ(k, 5), 1, '#747c88');
      }
      G.set(W / 2, 0, '#ff3a3a');
      G.glow.push({ x: W / 2, y: 0, r: SZ(k, 2.5), col: '#ff3a3a' });
      return G;
    },
    lamp(k, rand, o) {
      const G = new Grid(SZ(k, 12), SZ(k, 40));
      const col = o.glow || (rand() < 0.5 ? '#2ee6ff' : '#ff3cac');
      post(G, SZ(k, 3), SZ(k, 3), G.h, Math.max(2, SZ(k, 1.8)), ['#4a4a6a', '#34344e', '#22223a', '#14142a']);
      box(G, SZ(k, 3), SZ(k, 2), SZ(k, 7), Math.max(1, SZ(k, 1.4)), '#34344e');
      box(G, SZ(k, 7), SZ(k, 3), SZ(k, 4), Math.max(1, SZ(k, 1.4)), col);
      G.glow.push({ x: SZ(k, 9), y: SZ(k, 4), r: SZ(k, 5), col });
      G.ax = SZ(k, 3);
      return G;
    },
    holo(k, rand, o) {
      const G = new Grid(SZ(k, 12), SZ(k, 34));
      const col = o.glow || (rand() < 0.5 ? '#2ee6ff' : '#ff3cac');
      post(G, G.w / 2, 0, G.h, G.w - 2, ['#3a3a5a', '#2a2a46', '#1c1c34', '#101024']);
      for (let y = SZ(k, 3); y < G.h - 2; y += SZ(k, 6)) box(G, 2, y, G.w - 4, Math.max(1, SZ(k, 1)), col);
      G.glow.push({ x: G.w / 2, y: G.h * 0.4, r: SZ(k, 6), col });
      return G;
    },
    dish(k, rand) {
      const G = new Grid(SZ(k, 26), SZ(k, 28));
      const W = G.w;
      const H = G.h;
      post(G, W / 2, H * 0.55, H, Math.max(2, SZ(k, 2.4)), P_STEEL);
      box(G, W / 2 - SZ(k, 5), H - SZ(k, 2), SZ(k, 10), SZ(k, 2), P_STEEL[2]);
      for (let a = -Math.PI * 0.95; a <= -Math.PI * 0.05; a += 0.02)
        for (let r = 0; r < W * 0.46; r += 0.5) {
          const x = W / 2 + Math.cos(a) * r - r * 0.15;
          const y = H * 0.42 + Math.sin(a) * r * 0.55 + r * 0.25;
          G.set(x, y, r > W * 0.42 ? '#8a929c' : a < -Math.PI * 0.6 ? '#f0f2f6' : '#c8ced6');
        }
      line(G, W / 2, H * 0.4, W / 2 + W * 0.1, H * 0.12, 1, P_STEEL[2]);
      G.set(W / 2 + W * 0.1, H * 0.12, '#ff3a3a');
      G.glow.push({ x: W / 2 + W * 0.1, y: H * 0.12, r: SZ(k, 2), col: '#ff3a3a' });
      return G;
    },
    dome(k, rand) {
      const G = new Grid(SZ(k, 32), SZ(k, 17));
      const W = G.w;
      const H = G.h;
      ball(G, W / 2, H - 2, W / 2 - 1, H - 2, ['#e8fcff', '#9adcf0', '#5aa8c8', '#3a7a9a'], 0, rand);
      for (let x = 0; x < W; x++) for (let y = H - SZ(k, 2.5); y < H; y++) G.set(x, y, x < W * 0.3 ? '#c8ccd4' : '#9aa0aa');
      for (let y = 2; y < H - 3; y += SZ(k, 4)) for (let x = 0; x < W; x++) if (G.get(x, y) && G.get(x, y).startsWith('#9a') === false) G.set(x, y, '#5aa8c8');
      return G;
    },
    crystal(k, rand, o) {
      const G = new Grid(SZ(k, 18), SZ(k, 36));
      const cols = o.cool ? [['#e8ffff', '#8ae8ff', '#3aa8d0'], ['#f4e0ff', '#c88aff', '#8a4ad0']] : [['#e8ffff', '#8ae8ff', '#3aa8d0']];
      const spires = [[0.5, 0, 0.22], [0.25, 0.3, 0.16], [0.76, 0.22, 0.15], [0.38, 0.5, 0.12]];
      for (const [fx, fy, hw] of spires) {
        const pal = cols[Math.floor(rand() * cols.length)];
        tier(G, G.w * fx, G.h * fy, G.h, G.w * hw, pal, false);
      }
      G.glow.push({ x: G.w / 2, y: G.h * 0.4, r: SZ(k, 6), col: '#8ae8ff' });
      return G;
    },
    shroom(k, rand) {
      const G = new Grid(SZ(k, 28), SZ(k, 36));
      const W = G.w;
      const H = G.h;
      const lean = (rand() - 0.5) * W * 0.2;
      const sw = Math.max(2, SZ(k, 3));
      for (let y = Math.floor(H * 0.3); y < H; y++) {
        const t = (H - y) / (H * 0.7);
        const x = W / 2 + lean * t * t;
        for (let i = 0; i < sw; i++) G.set(x - sw / 2 + i, y, i ? '#c8c0e0' : '#f0e8ff');
      }
      const cap = rand() < 0.5 ? ['#ff9ad8', '#e040a8', '#a02078', '#601048'] : ['#9affe8', '#3ad8c0', '#1a9a8a', '#0a5a52'];
      ball(G, W / 2 + lean, H * 0.24, W * 0.46, H * 0.2, cap, 0.15, rand);
      for (let x = 0; x < W; x++) for (let y = Math.floor(H * 0.32); y < H * 0.46; y++) if (G.get(x, y) && G.get(x, y) !== '#f0e8ff' && G.get(x, y) !== '#c8c0e0') G.set(x, y, cap[3]);
      for (let i = 0; i < 6; i++) {
        const x = W / 2 + lean + (rand() - 0.5) * W * 0.7;
        const y = H * (0.12 + rand() * 0.16);
        if (G.get(x, y)) box(G, x, y, Math.max(1, SZ(k, 1.5)), Math.max(1, SZ(k, 1.2)), '#fff6ff');
      }
      G.glow.push({ x: W / 2 + lean, y: H * 0.36, r: SZ(k, 7), col: cap[1] });
      return G;
    },
  };
  // which props grow in each era: [type, weight, options]. back = the treeline behind the battle, side = the
  // corners beside it, low = things short enough to stand in the foreground in front of the soldiers
  const ERA_PROPS = [
    { back: [['tree', 3, { leaf: 'lush' }], ['pine', 1], ['bush', 1, { leaf: 'lush' }]], side: [['tree', 3, { leaf: 'lush' }], ['boulder', 2, { moss: '#5a8a3a' }], ['fern', 2], ['bush', 1, { leaf: 'lush', flower: '#ff7a9a' }]], low: [['bush', 2, { leaf: 'lush', flower: '#ffd84a' }], ['fern', 2], ['boulder', 1, { moss: '#5a8a3a' }]] },
    { back: [['palm', 4], ['bush', 1, { leaf: 'dry' }], ['obelisk', 1]], side: [['palm', 3], ['boulder', 2, { stone: ['#f0d8a8', '#d0b07a', '#a8885a', '#7a6040'] }], ['obelisk', 1], ['bush', 1, { leaf: 'dry' }]], low: [['boulder', 2, { stone: ['#f0d8a8', '#d0b07a', '#a8885a', '#7a6040'] }], ['bush', 1, { leaf: 'dry' }]] },
    { back: [['cypress', 3], ['olive', 2]], side: [['column', 3], ['cypress', 2], ['olive', 2], ['boulder', 1]], low: [['bush', 2, { flower: '#ffffff' }], ['boulder', 1]] },
    { back: [['pine', 4, { snow: true }], ['boulder', 1, { snow: true }]], side: [['pine', 3, { snow: true }], ['boulder', 2, { snow: true }], ['runestone', 1, { snow: true }]], low: [['boulder', 2, { snow: true }], ['bush', 1, { leaf: 'pine', snow: true }]] },
    { back: [['tree', 3], ['pine', 2]], side: [['tree', 2], ['tent', 2, { stripe: '#c8282a' }], ['banner', 1], ['haystack', 1], ['fence', 1]], low: [['fence', 2], ['haystack', 1], ['bush', 2, { flower: '#ff7a9a' }]] },
    { back: [['tree', 3, { leaf: 'autumn' }], ['tree', 2], ['pine', 1]], side: [['tree', 2, { leaf: 'autumn' }], ['tent', 1, { stripe: '#2a5ac8' }], ['barrel', 1], ['haystack', 1], ['fence', 1]], low: [['fence', 2], ['barrel', 1], ['bush', 2]] },
    { back: [['tree', 4], ['pine', 1]], side: [['tree', 2], ['fence', 2], ['barrel', 1], ['haystack', 1], ['tent', 1, { stripe: '#2a5ac8' }]], low: [['fence', 2], ['barrel', 1], ['bush', 2, { flower: '#ffffff' }]] },
    { back: [['deadtree', 3], ['smokestack', 1], ['tree', 1, { leaf: 'dry' }]], side: [['deadtree', 2], ['sandbags', 2], ['wire', 1], ['crates', 1]], low: [['sandbags', 2], ['wire', 2]] },
    { back: [['deadtree', 3], ['ruinwall', 1]], side: [['hedgehog', 2], ['sandbags', 2], ['deadtree', 2], ['ruinwall', 1]], low: [['hedgehog', 2], ['sandbags', 2], ['wire', 1]] },
    { back: [['pine', 4, { snow: true }], ['mast', 1]], side: [['pine', 2, { snow: true }], ['barrier', 2], ['mast', 1], ['crates', 1, { metal: true, glow: '#e8c030' }]], low: [['barrier', 2], ['crates', 1, { metal: true, glow: '#e8c030' }]] },
    { back: [['mast', 1], ['tree', 2, { leaf: 'dry' }], ['palm', 1]], side: [['barrier', 2], ['crates', 2, { metal: true, glow: '#e8c030' }], ['barrel', 1, { drum: '#3a6aa8' }], ['mast', 1]], low: [['barrier', 2], ['crates', 1, { metal: true, glow: '#e8c030' }], ['barrel', 1, { drum: '#c8482a' }]] },
    { back: [['lamp', 2], ['holo', 2]], side: [['lamp', 2], ['holo', 2], ['crates', 1, { metal: true }]], low: [['crates', 2, { metal: true }]] },
    { back: [['dish', 1], ['dome', 1], ['mast', 1], ['boulder', 1]], side: [['dish', 2], ['dome', 1], ['boulder', 2], ['crates', 1, { metal: true }]], low: [['boulder', 2], ['crates', 1, { metal: true }]] },
    { back: [['crystal', 2, { cool: true }], ['shroom', 2]], side: [['crystal', 2, { cool: true }], ['shroom', 2], ['boulder', 1, { stone: ['#8a8ab0', '#6a6a90', '#4a4a70', '#30304e'] }]], low: [['crystal', 1, { cool: true }], ['boulder', 2, { stone: ['#8a8ab0', '#6a6a90', '#4a4a70', '#30304e'] }]] },
  ];
  CW.ERA_PROPS = ERA_PROPS;
  const propCache = new Map();
  function propCanvas(type, opts, k, variant, era) {
    const kk = Math.max(0.5, Math.round(k * 4) / 4);
    const key = type + '|' + JSON.stringify(opts || {}) + '|' + kk + '|' + variant;
    let c = propCache.get(key);
    if (!c) {
      c = gridCanvas(PROPS[type](kk, rnd(variant * 7919 + era * 31 + kk * 97 + 1), opts || {}));
      propCache.set(key, c);
    }
    return c;
  }
  CW.propCanvas = propCanvas;
  // the Neanderthal Chief's spirit cave bear: icy blue and glowing, mid-gallop (4 frames), jaws open, facing right.
  // Drawn at 2 pixels per field unit, like the backdrops.
  const bearCache = new Map();
  CW.spiritBear = function (f, flip) {
    const key = f + (flip ? 'f' : '');
    let c = bearCache.get(key);
    if (c) return c;
    const G = new Grid(66, 46);
    const pal = ['#f2fdff', '#aee6fb', '#64b6ea', '#2e6aac'];
    const rand = rnd(17 + f);
    const bob = f === 1 || f === 3 ? -1 : 0;
    // legs first, so the body overlaps their tops: front pair and back pair, swinging through the gallop
    const swing = [[7, -8], [1, 1], [-6, 8], [1, 1]][f];
    const leg = (x, dx, near) => {
      line(G, x, 30 + bob, x + dx, 41, near ? 4 : 3, near ? pal[2] : pal[3]);
      box(G, x + dx - 2, 41, 5, 2, near ? pal[1] : pal[2]);
      for (let i = 0; i < 3; i++) G.set(x + dx - 1 + i + (dx >= 0 ? 2 : -1), 43, '#ffffff');
    };
    leg(45, swing[0] - 2, false);
    leg(18, swing[1] + 2, false);
    leg(47, swing[0], true);
    leg(16, swing[1], true);
    ball(G, 15, 23 + bob, 11, 10, pal, 0.18, rand);
    ball(G, 29, 24 + bob, 19, 11, pal, 0.18, rand);
    ball(G, 39, 17 + bob, 11, 9, pal, 0.18, rand);
    ball(G, 53, 18 + bob, 9, 8, pal, 0.1, rand);
    ball(G, 61, 21 + bob, 5, 4, pal, 0, rand);
    ball(G, 48, 10 + bob, 3, 3, pal, 0, rand);
    ball(G, 55, 9 + bob, 3, 3, pal, 0, rand);
    G.set(48, 10 + bob, pal[3]);
    G.set(55, 9 + bob, pal[3]);
    // open jaws with white teeth, a dark eye with a bright glint, a few fur strokes
    line(G, 55, 24 + bob, 64, 23 + bob, 2, '#1a2e5a');
    for (const x of [57, 59, 61, 63]) G.set(x, 23 + bob, '#ffffff');
    G.set(56, 16 + bob, '#1a2e5a');
    G.set(57, 16 + bob, '#1a2e5a');
    G.set(56, 15 + bob, '#ffffff');
    for (let i = 0; i < 7; i++) G.set(14 + i * 5, 16 + bob + (i % 2), pal[0]);
    G.glow.push({ x: 33, y: 22, r: 9, col: '#9adcff' });
    c = gridCanvas(G);
    if (flip) {
      const m = canvas(c.width, c.height);
      const mg = m.getContext('2d');
      mg.translate(c.width, 0);
      mg.scale(-1, 1);
      mg.drawImage(c, 0, 0);
      m.ax = c.width - c.ax;
      m.ay = c.ay;
      c = m;
    }
    bearCache.set(key, c);
    return c;
  };
  // the props of one scene: what stands where (field units), back to front
  function sceneProps(era, VW, OX, zMax) {
    const P = ERA_PROPS[era] || ERA_PROPS[0];
    const rand = rnd(era * 389 + 11);
    const pick = (list) => {
      let tot = 0;
      for (const e of list) tot += e[1];
      let v = rand() * tot;
      for (const e of list) if ((v -= e[1]) <= 0) return e;
      return list[0];
    };
    // the field x at each screen edge for a given depth
    const edge = (z, sx) => {
      const s = 0.6 + 0.45 * (z / 120);
      return 180 + (sx / 2 - 192) / s;
    };
    const items = [];
    // the treeline just behind the far edge
    const bl = edge(-6, -OX) - 30;
    const br = edge(-6, VW - OX) + 30;
    for (let x = bl; x < br; x += 14 + rand() * 22) {
      if (rand() < 0.22) continue;
      const e = pick(P.back);
      items.push({ e, x: x + rand() * 6, z: -2 - rand() * 10, sc: 0.6 + rand() * 0.25 });
    }
    // groves in the corners beside the battle (soldiers stay between x -20 and 380)
    for (let z = 0; z < zMax; z += 7 + rand() * 9) {
      const L = edge(z, -OX) - 20;
      const R = edge(z, VW - OX) + 20;
      for (const [a, b] of [[L, -44 - z * 0.15], [404 + z * 0.15, R]]) {
        const span = b - a;
        if (span < 6) continue;
        const n = Math.max(1, Math.round(span / 70));
        for (let i = 0; i < n; i++) if (rand() < 0.75) items.push({ e: pick(P.side), x: a + rand() * span, z: z + rand() * 6, sc: 0.8 + rand() * 0.35 });
      }
    }
    // the near ground in front of the battle: only low props in front of the soldiers, anything off to the sides
    if (zMax > 126) for (let z = 126; z < zMax; z += 8 + rand() * 10) {
      const L = edge(z, -OX) - 20;
      const R = edge(z, VW - OX) + 20;
      const n = Math.max(1, Math.round((R - L) / 90));
      for (let i = 0; i < n; i++) {
        if (rand() < 0.35) continue;
        const x = L + rand() * (R - L);
        const lane = x > -60 && x < 420;
        items.push({ e: pick(lane ? P.low : P.side), x, z, sc: lane ? 0.75 + rand() * 0.3 : 0.9 + rand() * 0.3, low: lane });
      }
    }
    items.sort((a, b) => a.z - b.z);
    return items;
  }
  CW.sceneProps = sceneProps;
  // draw the props: g is translated to the field's origin; projU gives field-unit positions
  function drawProps(g, era, VW, OX, zMax) {
    const fieldBottom = 416; // the near edge of the battle, in scene pixels from the field's top
    for (const it of sceneProps(era, VW, OX, zMax)) {
      const p = projU(it.x, it.z);
      const near = it.z > 120 ? 1 + (it.z - 120) / 110 : 1;
      const k = p.s * 2 * it.sc * near;
      const c = propCanvas(it.e[0], it.e[2], k, Math.floor(Math.abs(it.x * 13 + it.z * 7)) % 4, era);
      const X = Math.round(p.x * 2);
      const Y = Math.round(p.y * 2);
      // props standing in front of the battle must not reach up over the soldiers at its near edge
      if (it.low && Y - c.ay < fieldBottom + 4) continue;
      g.fillStyle = 'rgba(0,0,0,.22)';
      const sw = Math.round(c.width * 0.36);
      g.fillRect(X - sw, Y - 1, sw * 2, Math.max(2, Math.round(k * 1.4)));
      g.drawImage(c, Math.round(X - c.ax), Math.round(Y - c.ay));
    }
  }

  CW.scene = function (era, VW, VH, OX, OY) {
    const key = [era, VW, VH, OX, OY].join(',');
    if (sceneCache.has(key)) return sceneCache.get(key);
    if (sceneCache.size > 4) sceneCache.delete(sceneCache.keys().next().value);
    const E = CW.ERAS[era];
    const bd = CW.backdrop(era);
    const c = rcanvas(VW, VH);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const info = CW.sceneInfo(era);
    // sky above the backdrop: its top colour, deepening towards the top of the screen, in dithered bands
    const skyTop = OY - 52; // the backdrop's own top rows show above the field
    if (skyTop > 0) {
      const top = '#' + info.top.map((v) => v.toString(16).padStart(2, '0')).join('');
      const deep = info.night ? shade(top, -0.45) : mix(shade(top, -0.18), '#3a6ad0', 0.25);
      const bands = 6;
      for (let i = 0; i < bands; i++) {
        const y0 = Math.round((skyTop * i) / bands);
        const y1 = Math.round((skyTop * (i + 1)) / bands);
        const col = mix(deep, top, i / (bands - 1));
        g.fillStyle = col;
        g.fillRect(0, y0, VW, y1 - y0 + 1);
        if (i > 0) {
          g.fillStyle = mix(deep, top, (i - 1) / (bands - 1));
          for (let x = (y0 >> 1) % 4; x < VW; x += 4) g.fillRect(x, y0, 2, 2);
        }
      }
      const rand = rnd(era * 71 + 5);
      if (info.night) {
        for (let i = 0; i < (VW * skyTop) / 2600; i++) {
          g.fillStyle = rand() > 0.75 ? '#ffffff' : rand() > 0.5 ? '#c8d8ff' : '#8aa0c8';
          const sz = rand() > 0.9 ? 4 : 2;
          g.fillRect(Math.floor(rand() * VW / 2) * 2, Math.floor(rand() * skyTop / 2) * 2, sz, sz);
        }
      } else {
        for (let i = 0; i < Math.max(2, VW / 220); i++) {
          const x = rand() * VW;
          const y = 20 + rand() * Math.max(10, skyTop - 80);
          const k = 2 + Math.floor(rand() * 3);
          g.fillStyle = 'rgba(255,255,255,.75)';
          g.fillRect(x, y, 16 * k * 2, 4 * k);
          g.fillRect(x + 3 * k * 2, y - 3 * k, 8 * k * 2, 3 * k);
          g.fillRect(x + 9 * k * 2, y - 2 * k, 5 * k * 2, 2 * k);
          g.fillStyle = 'rgba(200,215,235,.6)';
          g.fillRect(x + 2 * k, y + 4 * k - 2, 14 * k * 2, 2);
        }
      }
    }
    // the backdrop band, mirrored copies to either side
    const srcY = Math.max(0, 52 - OY);
    const bandH = 244 - srcY;
    for (let k = -3; k <= 3; k++) {
      const x0 = OX + k * 768;
      if (x0 + 768 <= 0 || x0 >= VW) continue;
      if (k % 2 === 0) g.drawImage(bd, 0, srcY, 768, bandH, x0, OY - 52 + srcY, 768, bandH);
      else {
        g.save();
        g.translate(x0 + 768, 0);
        g.scale(-1, 1);
        g.drawImage(bd, 0, srcY, 768, bandH, 0, OY - 52 + srcY, 768, bandH);
        g.restore();
      }
    }
    // the ground: dithered from the haze at the horizon to rich near colours, continuing towards the camera
    const haze = '#' + info.haze.map((v) => v.toString(16).padStart(2, '0')).join('');
    const ga = E.ground[0];
    const gb = E.ground[1];
    const pal = [mix(ga, haze, 0.5), mix(ga, haze, 0.28), mix(ga, haze, 0.1), ga, mix(ga, gb, 0.5), gb, shade(gb, -0.1), shade(gb, -0.18), shade(gb, -0.26)].map(hex2rgb);
    const y0 = OY + HZ * 2;
    const hh = 240;
    const gh = VH - y0;
    if (gh > 0) {
      const img = g.createImageData(VW, gh);
      const d = img.data;
      const BY = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
      for (let y = 0; y < gh; y++) {
        const lv = y < hh ? Math.pow(y / (hh - 1), 0.7) * 6 : 6 + Math.min(2, ((y - hh) / Math.max(120, gh - hh)) * 2);
        const fl = Math.floor(lv);
        const by = BY[y % 4];
        for (let x = 0; x < VW; x++) {
          const idx = Math.min(pal.length - 1, lv - fl > (by[(x - OX) & 3] + 0.5) / 16 ? fl + 1 : fl);
          const col = pal[idx];
          const i = (y * VW + x) * 4;
          d[i] = col[0];
          d[i + 1] = col[1];
          d[i + 2] = col[2];
          d[i + 3] = 255;
        }
      }
      g.putImageData(img, 0, y0);
    }
    // perspective grid, carried on into the foreground
    const neon = E.decor === 'neon';
    const zMax = 120 + Math.max(0, (VH - OY - 432) / 2.4);
    g.save();
    g.translate(OX, OY);
    g.fillStyle = neon ? '#b03aff' : shade(gb, -0.45);
    g.globalAlpha = neon ? 0.55 : 0.12;
    const xL = -400;
    const xR = 760;
    for (let z = 0; z <= zMax; z += 10) {
      const a = projU(xL, z);
      const b = projU(xR, z);
      g.fillRect(Math.round(a.x * 2), Math.round(a.y * 2), Math.round((b.x - a.x) * 2), z > 120 ? 2 : 1);
    }
    for (let x = -390; x <= 750; x += 30)
      for (let t = 0; t <= zMax / 120; t += 0.003) {
        const p = projU(x, t * 120);
        g.fillRect(Math.round(p.x * 2), Math.round(p.y * 2), t > 1 ? 2 : 1, 1);
      }
    g.globalAlpha = 1;
    // scattered decor, smaller with distance; bigger props in the foreground and out to the sides
    const rand = rnd(era * 131 + 7);
    const kind = E.decor;
    const xs = -OX / 2 / 0.6 + 180 - 200;
    const xe = (VW - OX) / 2 / 0.6 + 180 + 200;
    const fore = (zMax - 120) / 120;
    const n = 70 + Math.round(fore * 90) + Math.round(Math.max(0, VW - 768) / 6);
    for (let i = 0; i < n; i++) {
      const inField = i < 70;
      const z = inField ? rand() * 120 : 112 + rand() * Math.max(8, zMax - 112);
      const x = inField ? -30 + rand() * 420 : xs + rand() * (xe - xs);
      const p = projU(x, z);
      const X = Math.round(p.x * 2);
      const Y = Math.round(p.y * 2);
      const k = p.s * 2 * (inField ? 1 : 1.2 + Math.max(0, z - 120) / 70);
      decor(g, kind, X, Y, k, ga, gb, rand, inField);
    }
    drawProps(g, era, VW, OX, zMax);
    g.restore();
    vivid(g, VW, VH, 1.22);
    // gentle darkening towards the far edges, in steps
    const steps = 5;
    if (skyTop > 24) for (let i = 0; i < steps; i++) {
      g.fillStyle = 'rgba(0,0,0,' + (0.045 * (steps - i)).toFixed(3) + ')';
      g.fillRect(0, Math.round((skyTop * 0.6 * i) / steps), VW, Math.round((skyTop * 0.6) / steps));
    }
    const fb = OY + 432;
    if (VH - fb > 24) for (let i = 0; i < steps; i++) {
      const h = Math.round(((VH - fb) * 0.7) / steps);
      g.fillStyle = 'rgba(0,0,0,' + (0.05 * (i + 1)).toFixed(3) + ')';
      g.fillRect(0, VH - (steps - i) * h, VW, h);
    }
    if (OX > 24) for (let i = 0; i < steps; i++) {
      const w = Math.round((OX * 0.8) / steps);
      g.fillStyle = 'rgba(0,0,0,' + (0.04 * (steps - i)).toFixed(3) + ')';
      g.fillRect(i * w, 0, w, VH);
      g.fillRect(VW - (i + 1) * w, 0, w, VH);
    }
    const out = CW.plain(c);
    sceneCache.set(key, out);
    return out;
  };
  // lift colour saturation a little (the scene only, never the soldiers)
  function vivid(g, w, h, amt) {
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const gg = d[i + 1];
      const b = d[i + 2];
      const l = 0.299 * r + 0.587 * gg + 0.114 * b;
      d[i] = Math.max(0, Math.min(255, l + (r - l) * amt));
      d[i + 1] = Math.max(0, Math.min(255, l + (gg - l) * amt));
      d[i + 2] = Math.max(0, Math.min(255, l + (b - l) * amt));
    }
    g.putImageData(img, 0, 0);
  }
  function decor(g, kind, X, Y, k, ga, gb, rand, small) {
    const r = (v) => Math.max(1, Math.round(v));
    if (kind === 'grass') {
      g.fillStyle = shade(gb, -0.3);
      for (let j = -1; j <= 1; j++) g.fillRect(X + j * Math.ceil(k * 1.5), Y - r(k * (3 + (j === 0 ? 2 : 0))), r(k * 0.6), r(k * (3 + (j === 0 ? 2 : 0))));
      if (!small && rand() > 0.55) {
        // wildflowers up close
        const fc = ['#ffd84a', '#ff7a9a', '#ffffff', '#b48cff', '#ff9a3a'][Math.floor(rand() * 5)];
        g.fillStyle = fc;
        g.fillRect(X + r(k * 2), Y - r(k * 5), r(k * 1.2), r(k * 1.2));
        g.fillRect(X - r(k * 2.5), Y - r(k * 4), r(k), r(k));
      }
    } else if (kind === 'rock') {
      g.fillStyle = shade(gb, -0.35);
      g.fillRect(X - r(k * 3), Y - r(k * 2), r(k * 6), r(k * 2));
      g.fillStyle = shade(ga, 0.2);
      g.fillRect(X - r(k * 2), Y - r(k * 2), r(k * 3), r(k * 0.6));
      if (!small && rand() > 0.7) {
        // desert scrub
        g.fillStyle = '#8a9a4a';
        g.fillRect(X + r(k * 4), Y - r(k * 3), r(k * 0.8), r(k * 3));
        g.fillRect(X + r(k * 3), Y - r(k * 2), r(k * 2.8), r(k * 0.8));
      }
    } else if (kind === 'snow') {
      g.fillStyle = '#f4f8fa';
      g.fillRect(X - r(k * 4), Y - r(k), r(k * 8), r(k * 1.5));
      g.fillRect(X - r(k * 2), Y - r(k * 2), r(k * 4), r(k));
      if (!small && rand() > 0.7) {
        // small pines dusted with snow
        g.fillStyle = '#2f5a48';
        for (let yy = 0; yy < 6; yy++) g.fillRect(X - r(k * (3 - yy * 0.45)), Y - r(k * (4 + yy * 1.4)), r(k * (6 - yy * 0.9)), r(k * 1.4));
        g.fillStyle = '#eaf4f6';
        g.fillRect(X - r(k * 1.5), Y - r(k * 11), r(k * 3), r(k * 0.8));
      }
    } else if (kind === 'crater') {
      g.fillStyle = shade(gb, -0.35);
      g.fillRect(X - r(k * 5), Y - r(k), r(k * 10), r(k * 2));
      g.fillStyle = shade(ga, 0.15);
      g.fillRect(X - r(k * 5), Y + r(k), r(k * 10), r(k * 0.6));
      if (!small && rand() > 0.6) {
        // sandbags and wire
        g.fillStyle = '#a8946a';
        for (let j = 0; j < 3; j++) g.fillRect(X + r(k * (6 + j * 2.4)), Y - r(k * 1.6), r(k * 2.2), r(k * 1.4));
        g.fillStyle = '#5a5248';
        g.fillRect(X - r(k * 9), Y - r(k * 3), r(k * 7), Math.max(1, r(k * 0.3)));
      }
    } else if (kind === 'neon') {
      g.fillStyle = rand() > 0.5 ? '#2ee6ff' : '#ff3cac';
      g.fillRect(X, Y, r(k), r(k));
      if (!small && rand() > 0.75) {
        g.fillRect(X - r(k * 3), Y - r(k * 0.5), r(k * 6), r(k * 0.5));
      }
    } else if (kind === 'crystal') {
      g.fillStyle = rand() > 0.5 ? '#6ae0ff' : '#b070ff';
      const hgt = Math.round(k * (4 + rand() * (small ? 4 : 8)));
      for (let yy = 0; yy < hgt; yy++) {
        const ww = Math.max(1, Math.round(((hgt - yy) / hgt) * k * 2));
        g.fillRect(X - (ww >> 1), Y - yy, ww, 1);
      }
    }
  }
  CW.field = (era) => CW.scene(era, 768, 432, 0, 0);

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

  // ------------------------------------------------------------ era backdrops (designed at 384x216, stored at 768x432)
  const bcache = {};
  CW.backdrop = function (era) {
    if (bcache[era]) return bcache[era];
    const c = canvas(W, H);
    const g = c.getContext('2d');
    ERA_SCENES[era](g, rnd(era * 977 + 13));
    bcache[era] = CW.plain(CW.scale2x(c));
    return bcache[era];
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
  // four eras added later: Stone Age, Viking Age, Space Age and Galactic Age
  const STONE = (g, r) => {
    sky(g, ['#3a3a5a', '#6a4a6a', '#a8606a', '#e08a6a', '#f4b07a']);
    disc(g, 80, 92, 12, '#fff0c0');
    ridge(g, GY, 34, '#5a6a5a', r, 6);
    for (let y = 0; y < 62; y++) {
      const w = 10 + y * 1.7;
      R(g, 285 - w / 2, GY - 62 + y, w, 1, y < 4 ? '#ff7a3a' : '#4a3a3a');
      R(g, 285, GY - 62 + y, w / 2, 1, y < 4 ? '#ffb060' : '#5a4642');
    }
    [[0, 6], [6, 8], [14, 10], [24, 12]].forEach(([dy, r2]) => disc(g, 285 + dy / 3, GY - 70 - dy * 1.5, r2, '#6a5a5a'));
    [[60, 1], [104, 0.8]].forEach(([x, k]) => {
      disc(g, x, GY - 12 * k, Math.round(9 * k), '#2a2a24');
      R(g, x - 7 * k, GY - 8 * k, 3, 8 * k, '#2a2a24');
      R(g, x + 5 * k, GY - 8 * k, 3, 8 * k, '#2a2a24');
      R(g, x + 8 * k, GY - 14 * k, 5 * k, 3, '#2a2a24');
      R(g, x + 12 * k, GY - 12 * k, 2, 4, '#e8e4d0');
    });
    ground(g, '#7a8a4a', '#68783e', r);
  };
  const VIKING = (g, r) => {
    sky(g, ['#4a5a72', '#5a6a82', '#7a8aa0', '#9aaabc', '#bccad4']);
    [[40, 70], [120, 52], [200, 80], [300, 60], [370, 72]].forEach(([x, hgt]) => {
      for (let y = 0; y < hgt; y++) {
        const w = (y / hgt) * hgt * 1.6;
        R(g, x - w / 2, GY - 16 - hgt + y, w, 1, y < hgt * 0.3 ? '#f4f8fa' : '#6a7684');
        R(g, x, GY - 16 - hgt + y, w / 2, 1, y < hgt * 0.3 ? '#d8e2ea' : '#5a6672');
      }
    });
    R(g, 0, GY - 18, W, 18, '#3a5a7a');
    for (let i = 0; i < 40; i++) R(g, r() * W, GY - 16 + r() * 14, 6, 1, '#5a7a9a');
    R(g, 140, GY - 24, 70, 6, '#3a2a1a');
    R(g, 136, GY - 30, 6, 8, '#3a2a1a');
    R(g, 208, GY - 32, 5, 10, '#3a2a1a');
    R(g, 134, GY - 33, 4, 4, '#3a2a1a');
    R(g, 174, GY - 66, 2, 42, '#2a1a10');
    for (let k = 0; k < 6; k++) R(g, 160, GY - 62 + k * 6, 30, 6, k % 2 ? '#b3261e' : '#ece8dc');
    for (let x = 0; x < W; x += 9) {
      const h2 = 10 + ((x * 7) % 9);
      for (let y = 0; y < h2; y++) R(g, x + 4 - (y / h2) * 4, GY - 18 - h2 + y + h2 * 0, Math.max(1, (y / h2) * 8), 1, '#2a4a3a');
    }
    ground(g, '#c8d2cc', '#aebcb4', r, 10);
  };
  const SPACE = (g, r) => {
    R(g, 0, 0, W, GY, '#04040c');
    stars(g, r, 180, GY);
    disc(g, 300, 42, 22, '#2a5ab8');
    [[292, 36, 7], [308, 48, 6], [296, 52, 4]].forEach(([x, y, r2]) => disc(g, x, y, r2, '#3a9a4a'));
    [[288, 28, 5], [312, 34, 4]].forEach(([x, y, r2]) => disc(g, x, y, r2, '#e8f0f8'));
    for (let y = -22; y <= 22; y++) R(g, 300 + Math.round(Math.sqrt(484 - y * y)) - 5, 42 + y, 5, 1, 'rgba(0,0,20,.45)');
    ridge(g, GY, 16, '#7a7a84', r, 5);
    for (let y = 0; y < 18; y++) {
      const w = Math.round(Math.sqrt(324 - y * y)) * 2;
      R(g, 110 - w / 2, GY - 6 - (18 - y), w, 1, y < 4 ? '#c8f0ff' : '#8ad0f0');
    }
    R(g, 88, GY - 8, 44, 8, '#5a5a66');
    R(g, 150, GY - 34, 2, 30, '#8a8a96');
    R(g, 146, GY - 38, 10, 4, '#8a8a96');
    for (let i = 0; i < 10; i++) {
      const x = r() * W;
      R(g, x, GY - 2, 10, 2, '#5a5a62');
    }
    ground(g, '#8a8a92', '#74747e', r, 12);
  };
  const GALACTIC = (g, r) => {
    sky(g, ['#0a0620', '#1a0a3a', '#3a1060', '#6a1a7a', '#a03a8a']);
    stars(g, r, 120, 90);
    disc(g, 90, 46, 24, '#d8a060');
    disc(g, 84, 40, 9, '#e8c088');
    for (let x = -46; x <= 46; x++) {
      const y = Math.round(Math.sqrt(Math.max(0, 1 - (x / 46) ** 2)) * 5);
      R(g, 90 + x, 46 + y, 1, 1, '#f0d0a0');
      if (Math.abs(x) > 24) R(g, 90 + x, 46 - y, 1, 1, '#f0d0a0');
    }
    disc(g, 320, 30, 9, '#5ad1ff');
    [[220, 64, 34], [270, 44, 22]].forEach(([x, y, w]) => {
      for (let k = 0; k < 6; k++) R(g, x + k * 2, y + k, w - k * 4, 1, '#140a24');
      R(g, x + w - 6, y + 2, 3, 2, '#2ee6ff');
    });
    for (let i = 0; i < 12; i++) {
      const x = 10 + i * 33;
      const h2 = 14 + ((i * 17) % 30);
      for (let y = 0; y < h2; y++) {
        const w = Math.max(1, Math.round((y / h2) * 10));
        R(g, x - w / 2, GY - h2 + y, w, 1, i % 2 ? '#3a2a6a' : '#2a4a6a');
      }
      R(g, x, GY - h2, 1, h2, i % 2 ? '#b070ff' : '#6ae0ff');
    }
    ground(g, '#2a3a5a', '#22304c', r, 9);
  };
  // era order after the expansion: Stone, Bronze, Classical, Viking, Medieval ... Future, Space, Galactic
  const ERA_SCENES = [STONE, SCENES[0], SCENES[1], VIKING, SCENES[2], SCENES[3], SCENES[4], SCENES[5], SCENES[6], SCENES[7], SCENES[8], SCENES[9], SPACE, GALACTIC];
})(typeof window !== 'undefined' ? window : globalThis);
