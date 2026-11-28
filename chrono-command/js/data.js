/* Chrono Command — game data: eras, roles, units, traits, classes, leaders, doctrines. */
(function (G) {
  'use strict';
  const CW = (G.CW = G.CW || {});

  // ---------------------------------------------------------------- eras
  // ground: the battlefield's two ground colours and its scattered decor
  CW.ERAS = [
    { name: 'Stone Age', span: [-40000, -3000], roman: 'I', ground: ['#7a8a4a', '#68783e'], decor: 'grass' },
    { name: 'Bronze Age', span: [-3000, -480], roman: 'II', ground: ['#e2b468', '#cf9c52'], decor: 'rock' },
    { name: 'Classical', span: [-480, 450], roman: 'III', ground: ['#a8c060', '#8aa84a'], decor: 'grass' },
    { name: 'Viking Age', span: [450, 1066], roman: 'IV', ground: ['#c8d2cc', '#aebcb4'], decor: 'snow' },
    { name: 'Medieval', span: [1066, 1450], roman: 'V', ground: ['#5e8e3c', '#4c7a30'], decor: 'grass' },
    { name: 'Gunpowder', span: [1450, 1750], roman: 'VI', ground: ['#7a8a4a', '#64743a'], decor: 'grass' },
    { name: 'Revolution', span: [1750, 1860], roman: 'VII', ground: ['#7a9a4a', '#668a3a'], decor: 'grass' },
    { name: 'Industrial', span: [1860, 1918], roman: 'VIII', ground: ['#5a4a32', '#4a3c28'], decor: 'crater' },
    { name: 'World War', span: [1918, 1945], roman: 'IX', ground: ['#4a4438', '#3a352c'], decor: 'crater' },
    { name: 'Cold War', span: [1945, 1991], roman: 'X', ground: ['#c8d2dc', '#aeb8c6'], decor: 'snow' },
    { name: 'Modern', span: [1991, 2030], roman: 'XI', ground: ['#8a8478', '#76706a'], decor: 'rock' },
    { name: 'Future', span: [2030, 2400], roman: 'XII', ground: ['#1a0a30', '#2a1248'], decor: 'neon' },
    { name: 'Space Age', span: [2400, 3000], roman: 'XIII', ground: ['#8a8a92', '#74747e'], decor: 'crater' },
    { name: 'Galactic Age', span: [3000, 4000], roman: 'XIV', ground: ['#2a3a5a', '#22304c'], decor: 'crystal' },
  ];

  // ---------------------------------------------------------------- roles
  // Base stats of one soldier before era power, levels and bonuses. cost = army capacity it takes.
  // range and speed are in battlefield units (the field is 360 wide and 120 deep).
  CW.ROLES = {
    inf: { name: 'Infantry', hp: 100, atk: 10, int: 1.0, range: 7, speed: 22, cost: 1, rad: 3 },
    rng: { name: 'Ranged', hp: 60, atk: 11, int: 1.4, range: 75, speed: 20, cost: 1, rad: 3, proj: 'arrow' },
    cav: { name: 'Cavalry', hp: 150, atk: 14, int: 0.9, range: 8, speed: 46, cost: 2, rad: 4 },
    hvy: { name: 'Heavy', hp: 330, atk: 34, int: 2.4, range: 60, speed: 14, cost: 4, rad: 6, proj: 'shell', splash: 0.3 },
  };

  // ---------------------------------------------------------------- traits (every unit type has one built in)
  CW.TRAITS = {
    guard: 'Guard: +30% health and takes 15% less damage',
    swift: 'Swift: attacks 35% faster and moves 20% faster',
    charge: 'Charge: first strike of every battle deals 4x damage',
    armor: 'Armor: takes 30% less damage',
    pierce: 'Pierce: every hit also strikes a second enemy for 60%',
    splash: 'Splash: also hits nearby enemies for 35%',
    rally: 'Rally: your whole army gets +6% damage',
    crit: 'Deadeye: +25% critical chance',
    stun: 'Shock: 15% chance to stun the target for 1 second',
    bossbane: 'Siegebreaker: +60% damage to enemy leaders',
    snipe: 'Snipe: +50% range and +30% damage',
    regen: 'Regen: heals 3% health every second',
    drain: 'Drain: heals itself for 30% of damage dealt',
  };

  // ---------------------------------------------------------------- unit attributes (equip up to 3 per unit type)
  // Unlocked as you reach each era. A unit type gets a 2nd slot at level 10 and a 3rd at level 30.
  const A = (id, name, era, d, fx) => ({ id, name, era, d, fx });
  CW.UATTRS = [
    A('sharp', 'Sharpened', 0, '+25% damage', { dmg: 0.25 }),
    A('vet', 'Veteran', 0, '+30% health', { hp: 0.3 }),
    A('fleet', 'Fleet-footed', 1, '+30% move speed and +15% attack speed', { move: 0.3, aspd: 0.15 }),
    A('shield', 'Shield Wall', 1, 'Takes 25% less damage', { def: 0.25 }),
    A('fire', 'Fire', 2, 'Hits set the target burning for 60% extra damage over 3 seconds', { burn: 0.6 }),
    A('reach', 'Long Reach', 2, '+40% attack range', { range: 0.4 }),
    A('berserk', 'Berserk', 3, '+60% damage while below half health', { berserk: 0.6 }),
    A('chargeA', 'Charge', 3, 'First hit of every battle deals triple damage', { charge: 2 }),
    A('pierceA', 'Piercing', 4, 'Each hit also strikes a second enemy for 60%', { pierce: 0.6 }),
    A('precise', 'Precision', 4, '+20% chance of critical hits (double damage)', { crit: 0.2 }),
    A('blast', 'Blast', 5, 'Hits also damage nearby enemies for 35%', { splash: 0.35 }),
    A('shock', 'Shock', 6, '15% chance to stun the target for 1 second', { stun: 0.15 }),
    A('drainA', 'Lifesteal', 7, 'Heals 25% of the damage it deals', { drain: 0.25 }),
    A('medic', 'Field Medic', 8, 'Heals up to 6 nearby allies by 3% health every second', { medic: 0.03 }),
    A('regenA', 'Regeneration', 9, 'Heals 3% health every second', { regen: 0.03 }),
    A('loot', 'Plunder', 10, '+40% gold from its kills', { gold: 0.4 }),
    A('reactive', 'Reactive Armor', 11, 'Takes 40% less damage from ranged attacks', { rdef: 0.4 }),
    A('overclock', 'Overclocked', 12, '+35% attack speed', { aspd: 0.35 }),
    A('phase', 'Phase Shift', 13, '25% chance to dodge any attack', { dodge: 0.25 }),
  ];
  CW.UATTR = {};
  CW.UATTRS.forEach((a) => (CW.UATTR[a.id] = a));

  // ---------------------------------------------------------------- units
  // sp: sprite recipe for art.js. Extra fields override the role: range, speed, proj (projectile), air, size, splash.
  const U = (id, name, era, role, trait, sp, ex) => Object.assign({ id, name, era, role, trait, sp }, ex || {});
  const GUN = (r) => ({ range: r || 45, proj: 'bullet' });
  CW.UNITS = [
    // I Stone Age
    U('clubman', 'Club Warrior', 0, 'inf', 'guard', { k: 'soldier', w: 'club', helm: '#4a2a14', body: '#8a6a3a', legs: '#6a4a2a', cap: 1 }),
    U('rockthrower', 'Rock Thrower', 0, 'rng', 'stun', { k: 'soldier', w: 'rock', helm: '#3a2a1a', body: '#9a7a4a', legs: '#6a4a2a', cap: 1 }, { proj: 'rock', range: 60 }),
    U('mammoth', 'Mammoth Rider', 0, 'hvy', 'splash', { k: 'mammoth', body: '#6a4426', howdah: '#8a6a3a' }, { range: 11, proj: null, size: 1.15 }),
    U('wolves', 'Wolf Pack', 0, 'cav', 'swift', { k: 'wolf', body: '#8a8a92' }),
    // II Bronze Age
    U('spearman', 'Spearman', 1, 'inf', 'guard', { k: 'soldier', w: 'spear', helm: '#b8863b', body: '#c9a26b', legs: '#7a5a34' }),
    U('slinger', 'Slinger', 1, 'rng', 'swift', { k: 'soldier', w: 'sling', helm: '#6b4a2a', body: '#d8c49a', legs: '#7a5a34', cap: 1 }, { proj: 'rock', range: 65 }),
    U('ram', 'Siege Ram', 1, 'hvy', 'bossbane', { k: 'ram', body: '#7a5a34' }, { range: 11, proj: null }),
    U('chariot', 'War Chariot', 1, 'cav', 'charge', { k: 'chariot', body: '#9a6a34', horse: '#6a4426' }),
    // III Classical
    U('legionary', 'Legionary', 2, 'inf', 'armor', { k: 'soldier', w: 'sword', helm: '#c0c0c8', body: '#b3261e', legs: '#5a3a24', crest: '#b3261e', shield: '#b3261e' }),
    U('archer', 'Composite Archer', 2, 'rng', 'pierce', { k: 'soldier', w: 'bow', helm: '#7a5a34', body: '#4a6a8a', legs: '#5a3a24', cap: 1 }),
    U('elephant', 'War Elephant', 2, 'hvy', 'splash', { k: 'elephant', body: '#8a8a92', howdah: '#b3261e' }, { range: 11, proj: null, size: 1.05 }),
    U('equites', 'Equites', 2, 'cav', 'charge', { k: 'rider', w: 'lance', helm: '#c0c0c8', body: '#b3261e', horse: '#6a4426', cloth: '#b3261e' }),
    // IV Viking Age
    U('raider', 'Viking Raider', 3, 'inf', 'drain', { k: 'soldier', w: 'axe', helm: '#9aa0a8', body: '#5a6a7a', legs: '#4a3a2a', shield: '#c8a040' }),
    U('javelin', 'Javelin Thrower', 3, 'rng', 'crit', { k: 'soldier', w: 'javelin', helm: '#6a5a3a', body: '#7a5a3a', legs: '#4a3a2a', cap: 1 }, { proj: 'javelin', range: 55 }),
    U('mangonel', 'Mangonel', 3, 'hvy', 'splash', { k: 'catapult', body: '#7a5a34' }, { range: 120, proj: 'boulder' }),
    U('berserker', 'Berserker', 3, 'cav', 'charge', { k: 'soldier', w: 'axe', helm: '#6a4a2a', body: '#8a6a4a', legs: '#5a3a24', cap: 1 }, { speed: 40 }),
    // V Medieval
    U('manatarms', 'Man-at-Arms', 4, 'inf', 'rally', { k: 'soldier', w: 'sword', helm: '#9aa0a8', body: '#8a8f98', legs: '#5a5f68', shield: '#2a4a8a' }),
    U('longbow', 'Longbowman', 4, 'rng', 'crit', { k: 'soldier', w: 'bow', helm: '#3a5a2a', body: '#4a7a3a', legs: '#5a4a2a', cap: 1 }, { range: 90 }),
    U('trebuchet', 'Trebuchet', 4, 'hvy', 'bossbane', { k: 'trebuchet', body: '#6a4a2a' }, { range: 140, proj: 'boulder', size: 1.1 }),
    U('knight', 'Mounted Knight', 4, 'cav', 'charge', { k: 'rider', w: 'lance', helm: '#c0c4cc', body: '#c0c4cc', horse: '#e8e4dc', cloth: '#2a4a8a' }),
    // VI Gunpowder
    U('samurai', 'Samurai', 5, 'inf', 'crit', { k: 'soldier', w: 'katana', helm: '#2a2a2a', body: '#8a1e1e', legs: '#3a2a2a', horn: '#e8c84a' }),
    U('musketeer', 'Musketeer', 5, 'rng', 'stun', { k: 'soldier', w: 'musket', helm: '#3a2a1a', body: '#2a4a8a', legs: '#c9b48a', hat: 'wide' }, GUN(70)),
    U('cannon', 'Bronze Cannon', 5, 'hvy', 'bossbane', { k: 'cannon', body: '#c9973a', wheel: '#6a4426' }, { range: 120 }),
    U('cavalier', 'Cavalier', 5, 'cav', 'swift', { k: 'rider', w: 'saber', helm: '#2a2a2a', body: '#8a1e2b', horse: '#3a2a1a', cloth: '#d9b45a' }),
    // VII Revolution
    U('grenadier', 'Grenadier', 6, 'inf', 'splash', { k: 'soldier', w: 'grenade', helm: '#2a2a2a', body: '#b3261e', legs: '#e8e4dc', hat: 'tall' }, { range: 35, proj: 'grenade' }),
    U('rifleman', 'Rifleman', 6, 'rng', 'snipe', { k: 'soldier', w: 'rifle', helm: '#1a2a1a', body: '#2a5a3a', legs: '#2a3a2a', hat: 'tall' }, GUN(80)),
    U('artillery', 'Field Artillery', 6, 'hvy', 'splash', { k: 'cannon', body: '#5a5a62', wheel: '#3a2a1a' }, { range: 130 }),
    U('cuirassier', 'Cuirassier', 6, 'cav', 'armor', { k: 'rider', w: 'saber', helm: '#d8d8e0', body: '#d8d8e0', horse: '#3a2a1a', cloth: '#2a3f7a' }),
    // VIII Industrial
    U('trench', 'Trench Infantry', 7, 'inf', 'guard', { k: 'soldier', w: 'rifle', helm: '#6a6a4a', body: '#7a7458', legs: '#5a5440', hat: 'brodie' }, GUN(45)),
    U('mgunner', 'Machine Gunner', 7, 'rng', 'swift', { k: 'soldier', w: 'mg', helm: '#5a5a4a', body: '#6a6a5a', legs: '#4a4a3a', hat: 'brodie' }, GUN(65)),
    U('landship', 'Landship Mk I', 7, 'hvy', 'armor', { k: 'landship', body: '#7a7458' }, { range: 70 }),
    U('armoredcar', 'Armored Car', 7, 'cav', 'armor', { k: 'car', body: '#6a6a4a' }, GUN(45)),
    // IX World War
    U('gi', 'Rifle Squad', 8, 'inf', 'rally', { k: 'soldier', w: 'rifle', helm: '#4a5a2a', body: '#6a7a3a', legs: '#5a6a34', hat: 'round' }, GUN(50)),
    U('sniper', 'Sniper', 8, 'rng', 'snipe', { k: 'soldier', w: 'longrifle', helm: '#3a4a2a', body: '#4a5a34', legs: '#3a4a2a', hat: 'round' }, GUN(100)),
    U('mtank', 'Medium Tank', 8, 'hvy', 'splash', { k: 'tank', body: '#5a6a3a', long: 0 }, { range: 75 }),
    U('fighter', 'Fighter Plane', 8, 'cav', 'swift', { k: 'plane', body: '#5a6a3a' }, { range: 50, proj: 'bullet', air: 1 }),
    // X Cold War
    U('para', 'Paratrooper', 9, 'inf', 'charge', { k: 'soldier', w: 'smg', helm: '#7a1e2a', body: '#6a6a4a', legs: '#4a4a34', hat: 'beret' }, GUN(45)),
    U('heli', 'Attack Helicopter', 9, 'rng', 'pierce', { k: 'heli', body: '#4a5a3a' }, { proj: 'rocket', range: 80, air: 1 }),
    U('mbt', 'Battle Tank', 9, 'hvy', 'bossbane', { k: 'tank', body: '#8a8460', long: 1 }, { range: 85 }),
    U('jeep', 'Jeep Gunner', 9, 'cav', 'swift', { k: 'car', body: '#5a6a3a', jeep: 1 }, GUN(55)),
    // XI Modern
    U('sf', 'Special Forces', 10, 'inf', 'crit', { k: 'soldier', w: 'smg', helm: '#2a2a2a', body: '#3a3a40', legs: '#2a2a30', hat: 'ops' }, GUN(55)),
    U('drone', 'Combat Drone', 10, 'rng', 'swift', { k: 'drone', body: '#5a6070' }, { proj: 'bullet', range: 80, air: 1 }),
    U('bomber', 'Stealth Bomber', 10, 'hvy', 'splash', { k: 'bomber', body: '#2a2c34' }, { proj: 'bomb', range: 25, air: 1, speed: 30 }),
    U('jet', 'Strike Jet', 10, 'cav', 'crit', { k: 'plane', body: '#7a8090', jet: 1 }, { range: 60, proj: 'rocket', air: 1 }),
    // XII Future
    U('powerarmor', 'Power Armor', 11, 'inf', 'regen', { k: 'soldier', w: 'laser', helm: '#c8ccd8', body: '#8a90a8', legs: '#5a6078', hat: 'visor' }, { range: 45, proj: 'laser' }),
    U('lancer', 'Plasma Lancer', 11, 'rng', 'bossbane', { k: 'soldier', w: 'plasma', helm: '#2a2a3a', body: '#3a2a5a', legs: '#2a2040', hat: 'visor' }, { proj: 'plasma', range: 85 }),
    U('mech', 'Battle Mech', 11, 'hvy', 'drain', { k: 'mech', body: '#6a7088' }, { proj: 'plasma', range: 65 }),
    U('hoverbike', 'Hover Bike', 11, 'cav', 'swift', { k: 'hoverbike', body: '#3a4a6a' }, { range: 40, proj: 'laser' }),
    // XIII Space Age
    U('spacemarine', 'Space Marine', 12, 'inf', 'armor', { k: 'soldier', w: 'laser', helm: '#e8e4dc', body: '#c8ccd8', legs: '#8a90a8', hat: 'visor' }, { range: 50, proj: 'laser' }),
    U('railgunner', 'Rail Gunner', 12, 'rng', 'pierce', { k: 'soldier', w: 'longrifle', helm: '#3a3a4a', body: '#4a5a7a', legs: '#2a3a5a', hat: 'visor' }, { range: 110, proj: 'laser' }),
    U('walker', 'Orbital Walker', 12, 'hvy', 'splash', { k: 'mech', body: '#a8a090' }, { range: 80, proj: 'plasma', size: 1.3 }),
    U('starfighter', 'Star Fighter', 12, 'cav', 'crit', { k: 'plane', body: '#c8ccd8', scifi: 1 }, { range: 60, proj: 'laser', air: 1 }),
    // XIV Galactic Age
    U('bladeknight', 'Plasma Blade Knight', 13, 'inf', 'drain', { k: 'soldier', w: 'blade', helm: '#2a1a3a', body: '#4a2a6a', legs: '#2a1a3a', hat: 'visor' }),
    U('voidarcher', 'Void Archer', 13, 'rng', 'crit', { k: 'soldier', w: 'plasma', helm: '#1a1a2a', body: '#2a2a4a', legs: '#1a1a2a', cap: 1 }, { range: 95, proj: 'plasma' }),
    U('titan', 'Titan Mech', 13, 'hvy', 'bossbane', { k: 'mech', body: '#4a3a6a' }, { range: 90, proj: 'plasma', size: 1.5 }),
    U('warpdrone', 'Warp Drone', 13, 'cav', 'swift', { k: 'drone', body: '#6a3a8a' }, { range: 45, proj: 'laser', air: 1 }),
  ];
  CW.UNIT = {};
  CW.UNITS.forEach((u) => (CW.UNIT[u.id] = u));

  // ---------------------------------------------------------------- leader classes (commander passive)
  CW.CLASSES = {
    conqueror: { name: 'Conqueror', d: '+25% army ATK', fx: { atk: 0.25 } },
    tyrant: { name: 'Tyrant', d: '+15% ATK, enemies deal 12% less damage', fx: { atk: 0.15, enemyAtk: 0.12 } },
    strategist: { name: 'Strategist', d: 'All your leaders\' attributes are 25% stronger', fx: { attrMain: 0.25, attrPartner: 0.25 } },
    defender: { name: 'Defender', d: '+35% army HP', fx: { hp: 0.35 } },
    revolutionary: { name: 'Revolutionary', d: '+25% attack speed', fx: { spd: 0.25 } },
    statesman: { name: 'Statesman', d: '+35% gold', fx: { gold: 0.35 } },
    peacemaker: { name: 'Peacemaker', d: '+20% HP and 1% HP regen per second', fx: { hp: 0.2, regen: 0.01 } },
    warrior: { name: 'Warrior', d: '+15% critical chance', fx: { crit: 0.15 } },
    orator: { name: 'Orator', d: '+15% army ATK and +20% gold', fx: { atk: 0.15, gold: 0.2 } },
  };

  // ---------------------------------------------------------------- portraits palette shortcuts
  const SK = { p: '#f6d9bd', l: '#f2c9a0', m: '#e2ad80', t: '#c98f60', o: '#a86e45', d: '#7a4a2c', x: '#55331d' };
  const HR = { blk: '#1d1714', dbr: '#3b2618', brn: '#6b4426', aub: '#8b3a1e', red: '#b5501f', bld: '#d9b45a', gry: '#9c9c9c', wht: '#e9e6df' };

  // ---------------------------------------------------------------- leaders
  // skills: three always-on attributes [signature, partner attribute, third]; each = [name, cooldown (unused), effects]
  // engine.js turns each effect into a passive stat (see CW.attr); the cooldowns are left over from an older design
  // effects: ['strike', 'front'|'all'|'random'|'boss', mult] (mult = seconds of army damage)
  //          ['buff', 'atk'|'spd'|'crit'|'def', value, seconds]
  //          ['heal', fraction] ['revive', count, hpFraction] ['stun', seconds]
  //          ['weaken', value, seconds] ['expose', value, seconds] ['burn', mult, seconds]
  //          ['gold', bounties] ['cdr', seconds]
  const LEADERS = [];
  function L(id, name, yrs, yr, era, cls, title, bio, pt, ult, s1, s2, starter) {
    LEADERS.push({ id, name, yrs, yr, era, cls, title, bio, pt, skills: [ult, s1, s2], starter: !!starter });
  }
  const ult = (n, fx, cd) => ({ n, cd: cd || 55, fx });
  const sk = (n, fx, cd) => ({ n, cd: cd || 20, fx });

  // ---- starters (choose your first commander)
  L('sun_tzu', 'Sun Tzu', 'c. 544–496 BC', -512, 0, 'strategist', 'The Master Strategist',
    'Chinese general and philosopher credited with The Art of War, the most influential book on strategy ever written.',
    { sk: SK.l, hr: HR.blk, hs: 'bun', fh: 'goatee', fc: HR.gry, out: 'robe', oc: '#2f5f8a', ac: '#d9b45a', bg: '#1f3a4a' },
    ult('The Art of War', [['buff', 'atk', 0.5, 12], ['buff', 'spd', 0.3, 12]]),
    sk('Know Your Enemy', [['expose', 0.35, 8]], 18),
    sk('All Warfare Is Deception', [['stun', 2.5]], 24), true);
  L('leonidas', 'Leonidas I', 'c. 540–480 BC', -480, 0, 'defender', 'King of Sparta',
    'Spartan king who held the pass at Thermopylae against the vast Persian army with his 300 Spartans.',
    { sk: SK.m, hr: HR.dbr, hs: 'short', fh: 'beard', hat: 'greek', hc: '#c9973a', ha: '#b3261e', out: 'armor', oc: '#c9973a', ac: '#b3261e', bg: '#4a2020' },
    ult('Thermopylae', [['buff', 'def', 0.6, 10], ['buff', 'atk', 0.4, 10]]),
    sk('Phalanx Push', [['strike', 'front', 6]], 16),
    sk('Molon Labe', [['heal', 0.3]], 22), true);
  L('spartacus', 'Spartacus', 'c. 111–71 BC', -73, 1, 'revolutionary', 'The Gladiator',
    'Thracian gladiator who led the largest slave uprising against the Roman Republic.',
    { sk: SK.m, hr: HR.brn, hs: 'curly', fh: 'stubble', hat: 'band', hc: '#b3261e', out: 'leather', oc: '#7a5232', ac: '#c9c9c9', bg: '#3a2a1a' },
    ult('Slave Revolt', [['revive', 9, 0.6], ['buff', 'atk', 0.4, 8]]),
    sk('Gladiator Fury', [['strike', 'front', 7]], 16),
    sk('Escape Vesuvius', [['heal', 0.3]], 22), true);

  // ---- Era I: Bronze Age
  L('caveman', 'The Caveman', 'c. 10,000 BC', -10000, 0, 'warrior', 'First Warlord of the Stone Age',
    'A Stone Age chieftain from before writing, cities or the wheel, who leads his clan with fire, flint and a very big club.',
    { sk: '#c98f60', hr: '#4a2a14', hs: 'wild', fh: 'beard', unibrow: 1, acc: 'bone', out: 'pelt', oc: '#8a5a2a', ac: '#4a2a14', bg: '#4a3420' },
    ult('Discover Fire', [['burn', 8, 6], ['buff', 'atk', 0.3, 8]]),
    sk('Club Smash', [['strike', 'front', 8]], 16),
    sk('Mammoth Stampede', [['strike', 'all', 4]], 22));
  L('sargon', 'Sargon of Akkad', 'c. 2334–2279 BC', -2300, 0, 'conqueror', 'King of the Four Corners',
    'Founded the Akkadian Empire, often called the first empire in history, by uniting the city-states of Mesopotamia.',
    { sk: SK.t, hr: HR.blk, hs: 'long', fh: 'longbeard', hat: 'circlet', hc: '#d9b45a', out: 'robe', oc: '#7a2e2e', ac: '#d9b45a', bg: '#5a3a1a' },
    ult('First Empire', [['buff', 'atk', 0.4, 10], ['buff', 'def', 0.25, 10]]),
    sk('Akkadian Archers', [['strike', 'random', 6]]),
    sk('Imperial Tribute', [['gold', 15]], 25));
  L('hammurabi', 'Hammurabi', 'c. 1810–1750 BC', -1754, 0, 'statesman', 'Lawgiver of Babylon',
    'King of Babylon whose Code of Hammurabi is one of the oldest written law codes in the world.',
    { sk: SK.t, hr: HR.blk, hs: 'long', fh: 'longbeard', hat: 'tallcap', hc: '#3d4f7a', out: 'robe', oc: '#3d4f7a', ac: '#d9b45a', bg: '#3a2a4a' },
    ult('Code of Laws', [['weaken', 0.35, 10], ['buff', 'def', 0.3, 10]]),
    sk('Eye for an Eye', [['strike', 'front', 6]], 16),
    sk('Granaries of Babylon', [['heal', 0.3]], 22));
  L('ramesses', 'Ramesses II', 'c. 1303–1213 BC', -1274, 0, 'conqueror', 'Pharaoh of Egypt',
    'The most celebrated pharaoh of Egypt; fought the Hittites at Kadesh and built monuments like Abu Simbel.',
    { sk: SK.o, hr: HR.blk, hs: 'none', fh: 'pharaoh', hat: 'nemes', hc: '#d9b45a', ha: '#2a4a9a', out: 'collar', oc: '#e8e0c8', ac: '#2a8a9a', bg: '#7a5a1a' },
    ult('Battle of Kadesh', [['strike', 'all', 5], ['buff', 'spd', 0.3, 8]]),
    sk('Monument Builder', [['buff', 'def', 0.4, 8]]),
    sk('Treasures of the Nile', [['gold', 18]], 25));
  L('cyrus', 'Cyrus the Great', 'c. 600–530 BC', -539, 0, 'statesman', 'King of Kings',
    'Founder of the Persian Achaemenid Empire, remembered for tolerant rule and the Cyrus Cylinder.',
    { sk: SK.t, hr: HR.dbr, hs: 'long', fh: 'longbeard', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#5b2d7a', ac: '#d9b45a', bg: '#2a1a3a' },
    ult('King of Kings', [['revive', 9, 0.5], ['heal', 0.3]]),
    sk('Persian Immortals', [['buff', 'def', 0.35, 8], ['buff', 'atk', 0.2, 8]]),
    sk('Royal Road', [['buff', 'spd', 0.35, 8]], 22));

  // ---- Era II: Classical
  L('alexander', 'Alexander the Great', '356–323 BC', -331, 1, 'conqueror', 'King of Macedon',
    'Macedonian king who never lost a battle and built an empire from Greece to India before he turned 33.',
    { sk: SK.l, hr: HR.bld, hs: 'wavy', fh: 'none', out: 'armor', oc: '#d0a34a', ac: '#b3261e', bg: '#2a3a6a' },
    ult('Hammer and Anvil', [['strike', 'all', 6], ['buff', 'atk', 0.3, 8]]),
    sk('Companion Cavalry', [['strike', 'front', 8]], 16),
    sk('Cut the Gordian Knot', [['expose', 0.4, 8]], 22));
  L('ashoka', 'Ashoka the Great', 'c. 304–232 BC', -261, 1, 'peacemaker', 'Mauryan Emperor',
    'Emperor of India who renounced conquest after the bloody Kalinga war and spread Buddhism across Asia.',
    { sk: SK.o, hr: HR.blk, hs: 'short', fh: 'mustache', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#e08a1e', ac: '#d9b45a', bg: '#5a2a1a' },
    ult('Wheel of Dharma', [['heal', 0.5], ['weaken', 0.3, 10]]),
    sk('Edicts of Peace', [['weaken', 0.3, 8]], 18),
    sk('Mauryan Elephants', [['strike', 'front', 7]], 18));
  L('qin', 'Qin Shi Huang', '259–210 BC', -221, 1, 'tyrant', 'First Emperor of China',
    'Unified China by force, standardized its writing and coins, began the Great Wall and was buried with the Terracotta Army.',
    { sk: SK.l, hr: HR.blk, hs: 'short', fh: 'goatee', hat: 'mian', hc: '#1d1d1d', ha: '#d9b45a', out: 'robe', oc: '#1d1d1d', ac: '#b3261e', bg: '#4a1a1a' },
    ult('Terracotta Army', [['revive', 9, 0.7], ['buff', 'def', 0.3, 8]]),
    sk('Great Wall', [['buff', 'def', 0.5, 8]]),
    sk('Unify the Realm', [['buff', 'atk', 0.35, 8]], 22));
  L('hannibal', 'Hannibal Barca', '247–183 BC', -216, 1, 'strategist', 'General of Carthage',
    'Carthaginian general who crossed the Alps with war elephants and crushed Rome at Cannae.',
    { sk: SK.o, hr: HR.blk, hs: 'curly', fh: 'beard', hat: 'greek', hc: '#9a7a3a', ha: '#e8e0c8', out: 'armor', oc: '#9a7a3a', ac: '#5b2d7a', acc: 'eyepatch', bg: '#1a3a3a' },
    ult('Crossing the Alps', [['buff', 'spd', 0.4, 10], ['buff', 'atk', 0.3, 10]]),
    sk('Cannae Encirclement', [['strike', 'all', 4]]),
    sk('War Elephants', [['stun', 2]], 22));
  L('caesar', 'Julius Caesar', '100–44 BC', -49, 1, 'conqueror', 'Dictator of Rome',
    'Roman general who conquered Gaul, crossed the Rubicon and made himself dictator of Rome.',
    { sk: SK.m, hr: HR.brn, hs: 'balding', fh: 'none', hat: 'laurel', hc: '#4a8a3a', out: 'toga', oc: '#ece8dc', ac: '#6a2c8a', bg: '#3a1a4a' },
    ult('Veni, Vidi, Vici', [['strike', 'all', 5], ['buff', 'atk', 0.35, 8], ['buff', 'spd', 0.2, 8]], 60),
    sk('Crossing the Rubicon', [['buff', 'atk', 0.4, 8]]),
    sk('Testudo Formation', [['buff', 'def', 0.45, 8]], 22));
  L('cleopatra', 'Cleopatra VII', '69–30 BC', -48, 1, 'statesman', 'Queen of the Nile',
    'Last active pharaoh of Ptolemaic Egypt, a shrewd ruler who allied with Julius Caesar and Mark Antony.',
    { sk: SK.t, hr: HR.blk, hs: 'bob', fh: 'none', hat: 'uraeus', hc: '#d9b45a', out: 'dress', oc: '#ece8dc', ac: '#2a9a9a', bg: '#1a4a5a', fem: 1 },
    ult('Queen of the Nile', [['gold', 30], ['heal', 0.3]]),
    sk('Asp Venom', [['burn', 8, 6]]),
    sk('Royal Charm', [['stun', 1.5], ['weaken', 0.25, 6]], 22));
  L('boudica', 'Boudica', 'd. AD 61', 60, 1, 'warrior', 'Queen of the Iceni',
    'Queen of the British Iceni tribe who led a fierce uprising against the Roman occupation of Britain.',
    { sk: SK.p, hr: HR.red, hs: 'long', fh: 'none', out: 'leather', oc: '#4a6a2a', ac: '#d9b45a', bg: '#2a3a1a', fem: 1 },
    ult('Iceni Uprising', [['strike', 'all', 5], ['burn', 6, 6]]),
    sk('Chariot Rush', [['strike', 'front', 7]], 16),
    sk('War Cry', [['buff', 'atk', 0.4, 8]], 22));

  // ---- Era III: Medieval
  L('attila', 'Attila the Hun', 'c. 406–453', 451, 2, 'conqueror', 'Scourge of God',
    'Ruler of the Huns who terrorized both halves of the Roman Empire from the Danube to Gaul.',
    { sk: SK.m, hr: HR.blk, hs: 'short', fh: 'longmustache', hat: 'fur', hc: '#8a5a2a', ha: '#5a3a1a', out: 'fur', oc: '#6b4426', ac: '#d9b45a', bg: '#3a2a1a' },
    ult('Scourge of God', [['strike', 'all', 5], ['weaken', 0.3, 8]]),
    sk('Horse Archers', [['strike', 'random', 7]]),
    sk('Plunder', [['gold', 20]], 25));
  L('charlemagne', 'Charlemagne', '742–814', 800, 2, 'defender', 'Emperor of the Romans',
    'King of the Franks who united much of Western Europe and was crowned the first Holy Roman Emperor.',
    { sk: SK.l, hr: HR.wht, hs: 'long', fh: 'fullbeard', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#8a1e2b', ac: '#d9b45a', bg: '#1a2a4a' },
    ult('Imperial Crown', [['buff', 'def', 0.4, 10], ['buff', 'atk', 0.3, 10]]),
    sk('Paladins', [['strike', 'front', 7]], 16),
    sk('Carolingian Renewal', [['heal', 0.35]], 22));
  L('william', 'William the Conqueror', 'c. 1028–1087', 1066, 2, 'conqueror', 'Duke of Normandy',
    'Norman duke who invaded England and won the crown at the Battle of Hastings in 1066.',
    { sk: SK.l, hr: HR.brn, hs: 'short', fh: 'none', hat: 'nasal', hc: '#9aa0a8', out: 'mail', oc: '#8a8f98', ac: '#b3261e', bg: '#3a4a2a' },
    ult('Hastings 1066', [['strike', 'all', 5], ['buff', 'atk', 0.25, 8]]),
    sk('Norman Knights', [['strike', 'front', 8]], 16),
    sk('Domesday Book', [['gold', 22]], 25));
  L('saladin', 'Saladin', '1137–1193', 1187, 2, 'warrior', 'Sultan of Egypt and Syria',
    'Sultan who united the Muslim world against the Crusaders and won the great victory at Hattin.',
    { sk: SK.t, hr: HR.blk, hs: 'short', fh: 'beard', hat: 'turban', hc: '#ece8dc', ha: '#d9b45a', out: 'robe', oc: '#2f6a4a', ac: '#d9b45a', bg: '#5a4a1a' },
    ult('Horns of Hattin', [['strike', 'all', 5], ['stun', 2]]),
    sk('Ayyubid Cavalry', [['strike', 'front', 7]], 16),
    sk('Chivalrous Truce', [['heal', 0.35]], 22));
  L('richard', 'Richard the Lionheart', '1157–1199', 1191, 2, 'warrior', 'King of England',
    'King of England famed for his courage on the Third Crusade, where he fought Saladin to a standstill.',
    { sk: SK.p, hr: HR.aub, hs: 'short', fh: 'beard', hat: 'crown', hc: '#d9b45a', out: 'tabard', oc: '#b3261e', ac: '#d9b45a', bg: '#2a2a4a' },
    ult('Heart of a Lion', [['buff', 'atk', 0.5, 10], ['buff', 'crit', 0.25, 10]]),
    sk('Crusader Charge', [['strike', 'front', 8]], 16),
    sk("King's Ransom", [['gold', 25]], 25));
  L('genghis', 'Genghis Khan', 'c. 1162–1227', 1206, 2, 'conqueror', 'Great Khan of the Mongols',
    'Founder of the Mongol Empire, which became the largest contiguous land empire in history.',
    { sk: SK.m, hr: HR.blk, hs: 'short', fh: 'longmustache', fc: HR.gry, hat: 'mongol', hc: '#b3261e', ha: '#8a6a3a', out: 'robe', oc: '#3d6a8a', ac: '#d9b45a', bg: '#4a3a1a' },
    ult('Mongol Horde', [['strike', 'all', 7], ['buff', 'spd', 0.3, 10]], 60),
    sk('Feigned Retreat', [['stun', 2.5]], 22),
    sk('Yam Relay', [['buff', 'spd', 0.4, 8]]));
  L('mansa_musa', 'Mansa Musa', 'c. 1280–1337', 1324, 2, 'statesman', 'Emperor of Mali',
    'Emperor of Mali, perhaps the richest person who ever lived; his golden pilgrimage to Mecca became legend.',
    { sk: SK.x, hr: HR.blk, hs: 'short', fh: 'beard', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#d8a21e', ac: '#8a1e2b', bg: '#5a3a0a' },
    ult('Golden Pilgrimage', [['gold', 60]]),
    sk('Mali Cavalry', [['strike', 'front', 6]], 16),
    sk('Scholars of Timbuktu', [['buff', 'crit', 0.25, 10]], 22));
  L('timur', 'Timur', '1336–1405', 1398, 2, 'tyrant', 'Tamerlane the Conqueror',
    'Turco-Mongol warlord whose ruthless campaigns stretched from Delhi to Damascus and Ankara.',
    { sk: SK.m, hr: HR.blk, hs: 'short', fh: 'beard', hat: 'spike', hc: '#9aa0a8', ha: '#d9b45a', out: 'armor', oc: '#6a6f78', ac: '#2a6a4a', bg: '#2a2a2a' },
    ult('Conquest of Delhi', [['strike', 'all', 6]]),
    sk('Iron Discipline', [['buff', 'atk', 0.4, 8]]),
    sk('Caltrops', [['stun', 2]], 22));
  L('joan', 'Joan of Arc', 'c. 1412–1431', 1429, 2, 'warrior', 'The Maid of Orleans',
    'French peasant girl who, guided by visions, lifted the siege of Orleans and turned the Hundred Years War.',
    { sk: SK.p, hr: HR.dbr, hs: 'bob', fh: 'none', out: 'plate', oc: '#c0c4cc', ac: '#2a4a9a', bg: '#1a2a5a', fem: 1 },
    ult('Siege of Orleans', [['revive', 9, 0.5], ['buff', 'atk', 0.4, 10]]),
    sk('Holy Banner', [['buff', 'atk', 0.35, 8]]),
    sk('Visions', [['buff', 'crit', 0.3, 8]], 22));

  // ---- Era IV: Gunpowder
  L('vlad', 'Vlad III Dracula', '1428–1477', 1462, 3, 'tyrant', 'Prince of Wallachia',
    'Wallachian prince infamous for brutal punishments; he fought the Ottoman Empire and inspired the Dracula legend.',
    { sk: SK.l, hr: HR.blk, hs: 'long', fh: 'mustache', hat: 'princecap', hc: '#8a1e2b', ha: '#ece8dc', out: 'robe', oc: '#5a1a24', ac: '#d9b45a', bg: '#1a0a14' },
    ult('Order of the Dragon', [['weaken', 0.35, 10], ['buff', 'atk', 0.4, 10]]),
    sk('Night Attack', [['strike', 'all', 4], ['stun', 1]]),
    sk('Scorched Earth', [['burn', 8, 6]], 22));
  L('suleiman', 'Suleiman the Magnificent', '1494–1566', 1526, 3, 'statesman', 'Ottoman Sultan',
    'Longest-reigning Ottoman sultan, who brought the empire to its height in power, law and culture.',
    { sk: SK.m, hr: HR.dbr, hs: 'none', fh: 'beard', hat: 'bigturban', hc: '#ece8dc', ha: '#b3261e', out: 'robe', oc: '#2a6a3a', ac: '#d9b45a', bg: '#3a1a1a' },
    ult('Magnificent Century', [['gold', 30], ['buff', 'atk', 0.3, 10]]),
    sk('Janissary Corps', [['strike', 'front', 7]], 16),
    sk('The Lawgiver', [['buff', 'def', 0.35, 8], ['heal', 0.15]], 22));
  L('ivan', 'Ivan the Terrible', '1530–1584', 1552, 3, 'tyrant', 'First Tsar of Russia',
    'First Tsar of Russia, who conquered Kazan and ruled through terror with his black-robed oprichniki; in a rage he killed his own son.',
    { sk: SK.l, hr: HR.dbr, hs: 'long', fh: 'longbeard', hat: 'monomakh', hc: '#7a5a3a', ha: '#d9b45a', out: 'robe', oc: '#5a1a2a', ac: '#d9b45a', bg: '#2a1a1a' },
    ult('Siege of Kazan', [['strike', 'all', 5], ['buff', 'atk', 0.3, 8]]),
    sk('Streltsy Volley', [['strike', 'random', 7]]),
    sk("Tsar's Wrath", [['weaken', 0.3, 8], ['stun', 1]], 22));
  L('elizabeth1', 'Elizabeth I', '1533–1603', 1588, 3, 'strategist', 'The Virgin Queen',
    'Queen of England whose navy defeated the Spanish Armada and whose reign became a golden age.',
    { sk: SK.p, hr: HR.red, hs: 'curly', fh: 'none', hat: 'tiara', hc: '#d9b45a', out: 'ruff', oc: '#2a2a5a', ac: '#ece8dc', bg: '#3a1a2a', fem: 1 },
    ult("The Armada's Doom", [['strike', 'all', 5], ['burn', 6, 6]]),
    sk('Sea Dogs', [['gold', 22]], 24),
    sk('Heart of a King', [['buff', 'atk', 0.4, 8]]));
  L('nobunaga', 'Oda Nobunaga', '1534–1582', 1575, 3, 'warrior', 'The Demon King',
    'Ruthless Japanese warlord who began the unification of Japan and used massed muskets at Nagashino.',
    { sk: SK.l, hr: HR.blk, hs: 'none', fh: 'mustache', hat: 'kabuto', hc: '#2a2a2a', ha: '#e8c84a', out: 'samurai', oc: '#8a1e1e', ac: '#2a2a2a', bg: '#3a0a0a' },
    ult('Nagashino Volley', [['strike', 'all', 7]], 60),
    sk('Rotating Volleys', [['buff', 'spd', 0.4, 8]]),
    sk('Demon King', [['weaken', 0.3, 8]], 22));
  L('tokugawa', 'Tokugawa Ieyasu', '1543–1616', 1600, 3, 'strategist', 'First Tokugawa Shogun',
    'Won the Battle of Sekigahara and founded the shogunate that kept Japan at peace for 250 years.',
    { sk: SK.l, hr: HR.blk, hs: 'none', fh: 'none', hat: 'kabuto', hc: '#3a3a4a', ha: '#d9b45a', out: 'samurai', oc: '#2a2a3a', ac: '#d9b45a', bg: '#1a2a2a' },
    ult('Sekigahara', [['strike', 'all', 5], ['buff', 'def', 0.3, 8]]),
    sk('Patience', [['heal', 0.35]], 22),
    sk('Edo Treasury', [['gold', 22]], 24));
  L('peter', 'Peter the Great', '1672–1725', 1709, 3, 'conqueror', 'Tsar of All Russia',
    'Tsar who modernized Russia, built its first navy, founded St Petersburg and crushed Sweden at Poltava.',
    { sk: SK.l, hr: HR.dbr, hs: 'longwavy', fh: 'mustache', out: 'coat', oc: '#2a5a3a', ac: '#d9b45a', bg: '#1a2a3a' },
    ult('Window to the West', [['buff', 'atk', 0.35, 10], ['buff', 'spd', 0.3, 10]]),
    sk('Poltava', [['strike', 'front', 8]], 16),
    sk('Baltic Fleet', [['strike', 'random', 6]], 22));

  // ---- Era V: Revolution
  L('washington', 'George Washington', '1732–1799', 1776, 4, 'revolutionary', 'Commander of the Continental Army',
    'Led the Continental Army to American independence and became the first President of the United States.',
    { sk: SK.p, hr: HR.wht, hs: 'powdered', fh: 'none', hat: 'tricorne', hc: '#1d1d1d', out: 'coat', oc: '#2a3f7a', ac: '#d9c08a', bg: '#3a1a1a' },
    ult('Crossing the Delaware', [['strike', 'all', 5], ['stun', 2]]),
    sk('Valley Forge', [['heal', 0.3], ['buff', 'def', 0.2, 8]], 22),
    sk('Continental Army', [['revive', 2, 0.6]], 24));
  L('catherine', 'Catherine the Great', '1729–1796', 1774, 4, 'statesman', 'Empress of Russia',
    'Empress who pushed Russia to the Black Sea and championed the ideas of the Enlightenment.',
    { sk: SK.p, hr: HR.gry, hs: 'updo', fh: 'none', hat: 'tiara', hc: '#d9b45a', out: 'dress', oc: '#3a5aa8', ac: '#ece8dc', bg: '#2a1a3a', fem: 1 },
    ult('Golden Age', [['gold', 30], ['buff', 'atk', 0.3, 10]]),
    sk('Cossack Raid', [['strike', 'random', 7]]),
    sk('Enlightened Rule', [['buff', 'crit', 0.25, 8]], 22));
  L('robespierre', 'Maximilien Robespierre', '1758–1794', 1793, 4, 'tyrant', 'Voice of the Terror',
    "Revolutionary leader whose Reign of Terror (1793–94) sent thousands to the guillotine, until he was guillotined himself.",
    { sk: SK.p, hr: HR.wht, hs: 'powdered', fh: 'none', out: 'coat', oc: '#3a6a9a', ac: '#d9c08a', bg: '#2a2a3a' },
    ult('Committee of Public Safety', [['buff', 'atk', 0.4, 10], ['buff', 'def', 0.3, 10]]),
    sk('Levee en Masse', [['revive', 3, 0.5]], 22),
    sk('Republic of Virtue', [['weaken', 0.35, 8]]));
  L('napoleon', 'Napoleon Bonaparte', '1769–1821', 1805, 4, 'conqueror', 'Emperor of the French',
    'French emperor and military genius who conquered most of Europe before his final defeat at Waterloo.',
    { sk: SK.l, hr: HR.dbr, hs: 'short', fh: 'none', hat: 'bicorne', hc: '#1d1d1d', ha: '#b3261e', out: 'uniform', oc: '#2a3f7a', ac: '#d9b45a', bg: '#4a1a1a' },
    ult('La Grande Armee', [['buff', 'atk', 0.5, 10], ['revive', 3, 0.6]], 60),
    sk('Grand Battery', [['strike', 'all', 5]]),
    sk('Sun of Austerlitz', [['buff', 'crit', 0.3, 8], ['buff', 'spd', 0.2, 8]], 22));
  L('toussaint', 'Toussaint Louverture', '1743–1803', 1801, 4, 'revolutionary', 'Liberator of Haiti',
    'Formerly enslaved general who led the Haitian Revolution, the only slave uprising that founded a nation.',
    { sk: SK.x, hr: HR.gry, hs: 'short', fh: 'none', hat: 'bicorne', hc: '#1d1d1d', ha: '#b3261e', out: 'uniform', oc: '#2a3f7a', ac: '#d9b45a', bg: '#1a3a2a' },
    ult('Liberty or Death', [['revive', 9, 0.6], ['buff', 'atk', 0.35, 8]]),
    sk('Breach the Line', [['strike', 'front', 8]], 16),
    sk('Mountain Ambush', [['strike', 'random', 6], ['stun', 1]], 22));
  L('bolivar', 'Simon Bolivar', '1783–1830', 1819, 4, 'revolutionary', 'El Libertador',
    'Led Venezuela, Colombia, Ecuador, Peru and Bolivia to independence from the Spanish Empire.',
    { sk: SK.m, hr: HR.blk, hs: 'curly', fh: 'sideburns', out: 'uniform', oc: '#1a2a5a', ac: '#d9b45a', bg: '#4a3a0a' },
    ult('El Libertador', [['revive', 9, 0.5], ['buff', 'atk', 0.35, 10]]),
    sk('Crossing the Andes', [['buff', 'spd', 0.4, 8]]),
    sk('Gran Colombia', [['buff', 'def', 0.35, 8]], 22));
  L('shaka', 'Shaka Zulu', 'c. 1787–1828', 1818, 4, 'warrior', 'King of the Zulu',
    'Zulu king who transformed southern African warfare with the short stabbing spear and the buffalo-horn formation.',
    { sk: SK.x, hr: HR.blk, hs: 'short', fh: 'none', hat: 'plume', hc: '#ece8dc', ha: '#3a2a1a', out: 'pelt', oc: '#c9973a', ac: '#3a2a1a', bg: '#4a2a0a' },
    ult('Horns of the Buffalo', [['strike', 'all', 6], ['buff', 'spd', 0.3, 8]]),
    sk('Iklwa Strike', [['strike', 'front', 8]], 16),
    sk('Impi Drill', [['buff', 'atk', 0.4, 8]], 22));

  // ---- Era VI: Industrial
  L('lincoln', 'Abraham Lincoln', '1809–1865', 1863, 5, 'statesman', '16th U.S. President',
    'Led the Union through the American Civil War and ended slavery in the United States.',
    { sk: SK.m, hr: HR.blk, hs: 'short', fh: 'chinstrap', hat: 'tophat', hc: '#1d1d1d', out: 'suit', oc: '#1d1d22', ac: '#1d1d1d', bg: '#2a2a3a' },
    ult('Emancipation', [['revive', 9, 0.6], ['heal', 0.4]]),
    sk('Gettysburg Address', [['buff', 'atk', 0.4, 8]]),
    sk('Anaconda Blockade', [['weaken', 0.3, 8]], 22));
  L('tubman', 'Harriet Tubman', 'c. 1822–1913', 1863, 5, 'revolutionary', 'Conductor of the Underground Railroad',
    'Escaped slavery, then guided dozens to freedom on the Underground Railroad and led an armed raid in the Civil War.',
    { sk: SK.d, hr: HR.blk, hs: 'none', fh: 'none', hat: 'scarf', hc: '#7a3a8a', out: 'dress', oc: '#3a3a3a', ac: '#ece8dc', bg: '#1a2a3a', fem: 1 },
    ult('Underground Railroad', [['revive', 9, 0.6], ['buff', 'spd', 0.3, 8]]),
    sk('Combahee River Raid', [['strike', 'all', 4]]),
    sk('North Star', [['buff', 'crit', 0.3, 8]], 22));
  L('bismarck', 'Otto von Bismarck', '1815–1898', 1871, 5, 'strategist', 'The Iron Chancellor',
    'Prussian statesman who unified Germany through "blood and iron" and decades of shrewd diplomacy.',
    { sk: SK.l, hr: HR.gry, hs: 'bald', fh: 'walrus', hat: 'pickel', hc: '#3a3f48', ha: '#d9b45a', out: 'uniform', oc: '#2a3a4a', ac: '#d9b45a', bg: '#3a3a3a' },
    ult('Blood and Iron', [['strike', 'all', 5], ['buff', 'atk', 0.3, 8]]),
    sk('Realpolitik', [['weaken', 0.3, 8]], 18),
    sk('Unification', [['buff', 'def', 0.3, 8], ['heal', 0.15]], 22));
  L('victoria', 'Queen Victoria', '1819–1901', 1876, 5, 'statesman', 'Empress of India',
    'Queen of the United Kingdom for 63 years, ruling an empire on which the sun never set.',
    { sk: SK.p, hr: HR.gry, hs: 'bun', fh: 'none', hat: 'tiara', hc: '#d9b45a', out: 'dress', oc: '#1d1d22', ac: '#ece8dc', bg: '#2a1a3a', fem: 1 },
    ult('The Sun Never Sets', [['gold', 35], ['buff', 'atk', 0.3, 10]]),
    sk('Royal Navy', [['strike', 'all', 4]]),
    sk('Victoria Cross', [['buff', 'crit', 0.3, 8]], 22));
  L('diaz', 'Porfirio Diaz', '1830–1915', 1876, 5, 'tyrant', 'Dictator of Mexico',
    'Ruled Mexico as a dictator for over 30 years (1876–1911) until the Mexican Revolution drove him into exile.',
    { sk: SK.t, hr: HR.wht, hs: 'short', fh: 'walrus', fc: HR.wht, out: 'uniform', oc: '#1d1d2a', ac: '#d9b45a', medals: 1, bg: '#2a3a2a' },
    ult('The Porfiriato', [['gold', 25], ['buff', 'atk', 0.35, 10]]),
    sk('Rurales Charge', [['strike', 'front', 8]], 16),
    sk('Order and Progress', [['buff', 'def', 0.4, 8]], 22));
  L('gandhi', 'Mahatma Gandhi', '1869–1948', 1930, 5, 'peacemaker', 'Great Soul of India',
    "Led India's independence movement through nonviolent resistance and inspired civil-rights movements worldwide.",
    { sk: SK.o, hr: HR.gry, hs: 'bald', fh: 'mustache', fc: HR.gry, gl: 1, out: 'shawl', oc: '#ece8dc', ac: '#d9d0b8', bg: '#4a3a1a' },
    ult('Salt March', [['heal', 0.5], ['buff', 'def', 0.4, 10]]),
    sk('Satyagraha', [['weaken', 0.45, 8]], 18),
    sk('Hunger Strike', [['stun', 2.5]], 24));
  L('troosevelt', 'Theodore Roosevelt', '1858–1919', 1898, 5, 'warrior', 'The Rough Rider',
    'Led the Rough Riders up San Juan Hill, then as president urged America to "speak softly and carry a big stick."',
    { sk: SK.l, hr: HR.brn, hs: 'short', fh: 'walrus', gl: 1, hat: 'campaign', hc: '#a08a5a', out: 'uniform', oc: '#9a845a', ac: '#2a4a9a', bg: '#3a2a1a' },
    ult("Rough Riders' Charge", [['strike', 'front', 12], ['buff', 'spd', 0.3, 8]]),
    sk('Big Stick', [['stun', 2]], 20),
    sk('Bull Moose', [['heal', 0.35]], 22));
  L('wilhelm', 'Kaiser Wilhelm II', '1859–1941', 1914, 5, 'conqueror', 'German Emperor',
    'Last German emperor, whose militarism and imperial ambitions helped drag Europe into the First World War.',
    { sk: SK.l, hr: HR.dbr, hs: 'short', fh: 'kaiser', hat: 'pickel', hc: '#3a3f48', ha: '#d9b45a', out: 'uniform', oc: '#5a6270', ac: '#d9b45a', bg: '#2a2a2a' },
    ult('Big Bertha', [['strike', 'all', 6]]),
    sk('U-Boat Ambush', [['strike', 'random', 7]]),
    sk('Spiked Helmets', [['buff', 'def', 0.35, 8]], 22));
  L('lenin', 'Vladimir Lenin', '1870–1924', 1917, 5, 'revolutionary', 'Leader of the Bolsheviks',
    'Led the Bolshevik October Revolution of 1917 and founded the Soviet state.',
    { sk: SK.l, hr: HR.aub, hs: 'bald', fh: 'goatee', hat: 'flatcap', hc: '#2a2a2a', out: 'suit', oc: '#2a2a2a', ac: '#b3261e', bg: '#5a1a1a' },
    ult('October Revolution', [['revive', 9, 0.5], ['buff', 'atk', 0.35, 8]]),
    sk('Peace, Land, Bread', [['heal', 0.35]], 22),
    sk('Agitprop', [['weaken', 0.3, 8]]));

  // ---- Era VII: World War
  L('mussolini', 'Benito Mussolini', '1883–1945', 1935, 6, 'tyrant', 'Il Duce',
    'Founder of Fascism and dictator of Italy from 1922; allied with Hitler and was executed by partisans in 1945.',
    { sk: SK.m, hr: HR.blk, hs: 'bald', fh: 'none', jaw: 1, out: 'uniform', oc: '#2a2a2a', ac: '#9a9a9a', bg: '#3a3a2a' },
    ult('March on Rome', [['buff', 'atk', 0.45, 10], ['strike', 'all', 3]]),
    sk('Balcony Oratory', [['buff', 'atk', 0.35, 8]]),
    sk('Trains on Time', [['buff', 'spd', 0.4, 8]], 22));
  L('hitler', 'Adolf Hitler', '1889–1945', 1940, 6, 'tyrant', 'Dictator of Nazi Germany',
    'Dictator of Nazi Germany (1933–45). Started the Second World War in Europe and carried out the Holocaust, the murder of six million Jews.',
    { sk: SK.l, hr: HR.dbr, hs: 'side', fh: 'toothbrush', fc: HR.blk, out: 'uniform', oc: '#6b6a58', ac: '#4a4a3a', bg: '#2a2a2a' },
    ult('Blitzkrieg', [['strike', 'all', 6], ['buff', 'spd', 0.4, 8]], 60),
    sk('Panzer Spearhead', [['strike', 'front', 9]], 16),
    sk('Propaganda Machine', [['weaken', 0.35, 8]], 22));
  L('stalin', 'Joseph Stalin', '1878–1953', 1943, 6, 'tyrant', 'Dictator of the Soviet Union',
    'Soviet dictator who industrialized the USSR and defeated Nazi Germany in the east, while millions died in purges, gulags and famine.',
    { sk: SK.m, hr: HR.blk, hs: 'slick', fh: 'walrus', out: 'uniform', oc: '#a8a080', ac: '#d9b45a', bg: '#4a1a1a' },
    ult('Red Tide', [['revive', 9, 0.5], ['strike', 'all', 3]], 60),
    sk('Winter Offensive', [['stun', 2.5]], 22),
    sk('Five-Year Plan', [['gold', 25]], 24));
  L('tojo', 'Hideki Tojo', '1884–1948', 1941, 6, 'conqueror', 'Prime Minister of Imperial Japan',
    'Prime Minister of Japan for most of the Second World War who led it into war with the United States; executed for war crimes in 1948.',
    { sk: SK.l, hr: HR.blk, hs: 'bald', fh: 'mustache', gl: 1, out: 'uniform', oc: '#6a6a3a', ac: '#d9b45a', bg: '#3a2a1a' },
    ult('Pacific Offensive', [['strike', 'all', 6]]),
    sk('Zero Squadron', [['strike', 'random', 7]]),
    sk('Bushido Code', [['buff', 'atk', 0.3, 8], ['buff', 'crit', 0.2, 8]], 22));
  L('franco', 'Francisco Franco', '1892–1975', 1939, 6, 'tyrant', 'Caudillo of Spain',
    'Spanish general who won the Spanish Civil War and ruled Spain as a dictator for 36 years.',
    { sk: SK.m, hr: HR.blk, hs: 'balding', fh: 'mustache', hat: 'peaked', hc: '#a8946a', ha: '#d9b45a', out: 'uniform', oc: '#a8946a', ac: '#b3261e', bg: '#4a3a1a' },
    ult('Nationalist Advance', [['strike', 'all', 4], ['buff', 'atk', 0.3, 8]]),
    sk('Fortress Line', [['buff', 'def', 0.4, 8]]),
    sk('Iron Rule', [['weaken', 0.3, 8]], 22));
  L('trujillo', 'Rafael Trujillo', '1891–1961', 1937, 6, 'tyrant', 'El Jefe',
    'Ruled the Dominican Republic through terror for 31 years (1930–61), including the 1937 Parsley Massacre of thousands of Haitians.',
    { sk: SK.t, hr: HR.dbr, hs: 'slick', fh: 'toothbrush', hat: 'bicorne', hc: '#1d1d1d', ha: '#ece8dc', plume: 1, out: 'uniform', oc: '#e8e4d8', ac: '#d9b45a', medals: 1, bg: '#1a2a4a' },
    ult('El Jefe', [['buff', 'atk', 0.4, 10], ['weaken', 0.25, 10]]),
    sk("Benefactor's Treasury", [['gold', 25]], 24),
    sk('Island Fortress', [['buff', 'def', 0.4, 8]]));
  L('fdr', 'Franklin D. Roosevelt', '1882–1945', 1941, 6, 'statesman', '32nd U.S. President',
    'Four-term president who led America through the Great Depression and most of the Second World War.',
    { sk: SK.l, hr: HR.gry, hs: 'short', fh: 'none', gl: 1, acc: 'holder', out: 'suit', oc: '#3a3a4a', ac: '#2a3a6a', bg: '#1a2a4a' },
    ult('Arsenal of Democracy', [['gold', 30], ['buff', 'atk', 0.35, 10]]),
    sk('Fireside Chat', [['heal', 0.35]], 22),
    sk('Lend-Lease', [['buff', 'def', 0.3, 8], ['buff', 'spd', 0.2, 8]]));
  L('churchill', 'Winston Churchill', '1874–1965', 1940, 6, 'orator', 'Prime Minister of Britain',
    'British prime minister who refused to make peace with Nazi Germany and rallied Britain through its "finest hour."',
    { sk: SK.p, hr: HR.gry, hs: 'bald', fh: 'none', jaw: 1, acc: 'cigar', out: 'suit', oc: '#2a2a3a', ac: '#2a3a8a', bg: '#1a2a3a' },
    ult('Their Finest Hour', [['buff', 'def', 0.5, 10], ['buff', 'atk', 0.4, 10]]),
    sk('Blood, Toil, Tears and Sweat', [['buff', 'atk', 0.35, 8]]),
    sk('V for Victory', [['buff', 'crit', 0.3, 8]], 22));
  L('patton', 'George S. Patton', '1885–1945', 1944, 6, 'warrior', 'Old Blood and Guts',
    'Hard-charging American general whose Third Army raced across France and relieved Bastogne.',
    { sk: SK.p, hr: HR.gry, hs: 'short', fh: 'none', hat: 'helmet', hc: '#5a6a3a', ha: '#e8e4dc', out: 'uniform', oc: '#6a6a3a', ac: '#d9b45a', bg: '#2a3a1a' },
    ult('Third Army Breakout', [['strike', 'all', 5], ['buff', 'spd', 0.35, 8]]),
    sk('Old Blood and Guts', [['buff', 'atk', 0.4, 8]]),
    sk('Ghost Army', [['weaken', 0.3, 8]], 22));
  L('eisenhower', 'Dwight D. Eisenhower', '1890–1969', 1944, 6, 'strategist', 'Supreme Allied Commander',
    'Planned and led the D-Day invasion of Normandy, then served as the 34th U.S. president.',
    { sk: SK.p, hr: HR.bld, hs: 'bald', fh: 'none', grin: 1, out: 'uniform', oc: '#6a6a3a', ac: '#d9b45a', bg: '#1a2a3a' },
    ult('D-Day', [['strike', 'all', 8]], 60),
    sk('Supreme Command', [['cdr', 6], ['buff', 'atk', 0.2, 6]], 22),
    sk('Interstate Supply', [['heal', 0.3]], 22));

  // ---- Era VIII: Cold War
  L('mao', 'Mao Zedong', '1893–1976', 1949, 7, 'tyrant', 'Chairman of China',
    "Founder of the People's Republic of China, whose Great Leap Forward caused a famine that killed tens of millions.",
    { sk: SK.l, hr: HR.blk, hs: 'slick', fh: 'none', out: 'maosuit', oc: '#7a8072', ac: '#5a6052', bg: '#5a1a1a' },
    ult('Long March', [['heal', 0.4], ['buff', 'def', 0.35, 10]]),
    sk('Guerrilla War', [['strike', 'random', 7]]),
    sk("People's Army", [['revive', 3, 0.5]], 24));
  L('ho_chi_minh', 'Ho Chi Minh', '1890–1969', 1954, 7, 'revolutionary', 'Uncle Ho',
    "Led Vietnam's long struggle for independence, first against France and then the United States.",
    { sk: SK.m, hr: HR.gry, hs: 'short', fh: 'goatee', fc: HR.wht, out: 'maosuit', oc: '#b0a080', ac: '#8a7a5a', bg: '#3a1a1a' },
    ult('Tet Offensive', [['strike', 'all', 5], ['stun', 1.5]]),
    sk('Jungle Trail', [['buff', 'spd', 0.4, 8]]),
    sk('Jungle Ambush', [['strike', 'front', 8]], 16));
  L('kim_il_sung', 'Kim Il Sung', '1912–1994', 1950, 7, 'tyrant', 'Founder of North Korea',
    'Founder of North Korea who invaded the South in 1950, starting the Korean War, and built a lasting personality cult.',
    { sk: SK.l, hr: HR.blk, hs: 'short', fh: 'none', out: 'maosuit', oc: '#3a3a3a', ac: '#b3261e', bg: '#3a1a1a' },
    ult('Juche', [['heal', 0.4], ['buff', 'atk', 0.3, 10]]),
    sk('Artillery Wall', [['strike', 'all', 4]]),
    sk('Tunnel Ambush', [['strike', 'front', 8]], 16));
  L('degaulle', 'Charles de Gaulle', '1890–1970', 1958, 7, 'defender', 'Leader of Free France',
    "Led the Free French against Nazi Germany, then founded France's Fifth Republic as its president.",
    { sk: SK.p, hr: HR.dbr, hs: 'short', fh: 'mustache', nose: 1, hat: 'kepi', hc: '#8a7a4a', ha: '#d9b45a', out: 'uniform', oc: '#8a7a4a', ac: '#d9b45a', bg: '#1a2a5a' },
    ult('Free France', [['revive', 9, 0.5], ['buff', 'def', 0.3, 10]]),
    sk('Force de Frappe', [['strike', 'all', 5]]),
    sk('Grandeur', [['buff', 'atk', 0.35, 8]], 22));
  L('jfk', 'John F. Kennedy', '1917–1963', 1962, 7, 'statesman', '35th U.S. President',
    'Faced down the Soviet Union in the Cuban Missile Crisis and launched the race to put a man on the Moon.',
    { sk: SK.p, hr: HR.aub, hs: 'slick', fh: 'none', grin: 1, out: 'suit', oc: '#1a2a4a', ac: '#1d1d22', bg: '#2a3a5a' },
    ult('We Choose the Moon', [['strike', 'all', 6], ['buff', 'crit', 0.25, 8]]),
    sk('Ask Not', [['buff', 'atk', 0.4, 8]]),
    sk('Naval Quarantine', [['stun', 2], ['weaken', 0.2, 6]], 22));
  L('castro', 'Fidel Castro', '1926–2016', 1961, 7, 'revolutionary', 'Leader of the Cuban Revolution',
    'Led the Cuban Revolution and ruled Cuba as a one-party communist state for nearly 50 years.',
    { sk: SK.m, hr: HR.blk, hs: 'short', fh: 'fullbeard', hat: 'patrol', hc: '#4a5a2a', acc: 'cigar', out: 'fatigues', oc: '#4a5a2a', ac: '#3a4a1a', bg: '#3a1a1a' },
    ult('Sierra Maestra', [['revive', 9, 0.5], ['buff', 'atk', 0.3, 10]]),
    sk('Bay of Pigs', [['buff', 'def', 0.4, 8]]),
    sk('Seven-Hour Speech', [['stun', 3]], 24));
  L('che', 'Che Guevara', '1928–1967', 1958, 7, 'revolutionary', 'The Guerrilla',
    'Argentine doctor turned guerrilla who fought in the Cuban Revolution; his portrait became a worldwide icon.',
    { sk: SK.l, hr: HR.blk, hs: 'longwavy', fh: 'scruff', hat: 'beret', hc: '#1d1d1d', ha: '#e8c84a', out: 'fatigues', oc: '#4a5a2a', ac: '#3a4a1a', bg: '#5a1a1a' },
    ult('Guerrilla Warfare', [['strike', 'random', 9], ['buff', 'spd', 0.3, 8]]),
    sk('Field Medic', [['heal', 0.35]], 22),
    sk('Hit and Run', [['strike', 'front', 7]], 16));
  L('mlk', 'Martin Luther King Jr.', '1929–1968', 1963, 7, 'peacemaker', 'Voice of Civil Rights',
    'Baptist minister who led the American civil rights movement through nonviolent protest; Nobel Peace Prize 1964.',
    { sk: SK.d, hr: HR.blk, hs: 'short', fh: 'mustache', out: 'suit', oc: '#1d1d22', ac: '#3a3a4a', bg: '#2a3a4a' },
    ult('I Have a Dream', [['buff', 'atk', 0.5, 12], ['buff', 'spd', 0.3, 12], ['heal', 0.3]], 60),
    sk('March on Washington', [['revive', 3, 0.6]], 24),
    sk('Nonviolent Resolve', [['buff', 'def', 0.45, 8]]));
  L('amin', 'Idi Amin', 'c. 1925–2003', 1972, 7, 'tyrant', 'Butcher of Uganda',
    'Military dictator of Uganda (1971–79), notorious for his brutality; between 100,000 and 500,000 people were killed under his rule.',
    { sk: SK.x, hr: HR.blk, hs: 'short', fh: 'none', jaw: 1, hat: 'peaked', hc: '#4a5a2a', ha: '#d9b45a', out: 'uniform', oc: '#5a6a3a', ac: '#d9b45a', medals: 2, bg: '#3a2a1a' },
    ult('Conqueror of the British Empire', [['buff', 'atk', 0.45, 10], ['strike', 'all', 3]]),
    sk('Heavyweight Champion', [['strike', 'front', 9]], 16),
    sk("Field Marshal's Decree", [['weaken', 0.3, 8]], 22));
  L('pinochet', 'Augusto Pinochet', '1915–2006', 1973, 7, 'tyrant', 'Dictator of Chile',
    'Seized power in Chile in a 1973 coup and ruled as military dictator until 1990; thousands were killed or disappeared.',
    { sk: SK.m, hr: HR.wht, hs: 'short', fh: 'mustache', fc: HR.wht, gl: 2, hat: 'peaked', hc: '#8a8a7a', ha: '#d9b45a', out: 'uniform', oc: '#8a8a7a', ac: '#d9b45a', bg: '#2a2a3a' },
    ult('Junta Command', [['buff', 'atk', 0.35, 10], ['buff', 'def', 0.3, 10]]),
    sk('Jet Strike', [['strike', 'random', 7]]),
    sk('Iron Fist', [['weaken', 0.35, 8]], 22));
  L('polpot', 'Pol Pot', '1925–1998', 1975, 7, 'tyrant', 'Brother Number One',
    "Led Cambodia's Khmer Rouge regime (1975–79), whose genocide killed up to two million people, a quarter of the population.",
    { sk: SK.t, hr: HR.blk, hs: 'slick', fh: 'none', out: 'maosuit', oc: '#1d1d1d', ac: '#b3261e', scarf: 1, bg: '#3a1a1a' },
    ult('Fall of Phnom Penh', [['strike', 'all', 5], ['stun', 1.5]]),
    sk('Jungle Insurgency', [['strike', 'random', 7]]),
    sk('Khmer Rouge Ambush', [['strike', 'front', 8]], 16));
  L('reagan', 'Ronald Reagan', '1911–2004', 1987, 7, 'statesman', '40th U.S. President',
    'Confronted the Soviet Union in the last decade of the Cold War and urged "Mr. Gorbachev, tear down this wall!"',
    { sk: SK.l, hr: HR.dbr, hs: 'slick', fh: 'none', grin: 1, out: 'suit', oc: '#1a2a4a', ac: '#b3261e', bg: '#3a2a2a' },
    ult('Tear Down This Wall', [['strike', 'boss', 14], ['expose', 0.3, 8]]),
    sk('Star Wars Shield', [['buff', 'def', 0.5, 8]], 22),
    sk('Morning in America', [['heal', 0.3], ['gold', 10]], 24));
  L('thatcher', 'Margaret Thatcher', '1925–2013', 1982, 7, 'defender', 'The Iron Lady',
    "Britain's first woman prime minister, the 'Iron Lady' who won the Falklands War.",
    { sk: SK.p, hr: '#c8a060', hs: 'bouffant', fh: 'none', out: 'suit', oc: '#2a4a8a', ac: '#ece8dc', pearls: 1, bg: '#1a2a4a', fem: 1 },
    ult('The Iron Lady', [['buff', 'def', 0.5, 10], ['buff', 'atk', 0.35, 10]]),
    sk('Falklands Task Force', [['strike', 'all', 5]]),
    sk('Not for Turning', [['weaken', 0.3, 8]], 22));

  // ---- Era IX: Modern
  L('gorbachev', 'Mikhail Gorbachev', '1931–2022', 1989, 8, 'peacemaker', 'Last Soviet Leader',
    'Last leader of the Soviet Union, whose reforms ended the Cold War; Nobel Peace Prize 1990.',
    { sk: SK.l, hr: HR.gry, hs: 'bald', fh: 'none', mark: 1, out: 'suit', oc: '#4a4a52', ac: '#8a1e2b', bg: '#3a1a1a' },
    ult('Perestroika', [['heal', 0.4], ['buff', 'spd', 0.35, 10]]),
    sk('Glasnost', [['expose', 0.35, 8]]),
    sk('End of the Cold War', [['stun', 2.5]], 24));
  L('mandela', 'Nelson Mandela', '1918–2013', 1994, 8, 'peacemaker', 'Madiba',
    "Anti-apartheid leader imprisoned for 27 years who became South Africa's first Black president.",
    { sk: SK.x, hr: HR.wht, hs: 'short', fh: 'none', grin: 1, out: 'madiba', oc: '#c8902a', ac: '#2a4a2a', bg: '#1a3a2a' },
    ult('Long Walk to Freedom', [['revive', 9, 0.6], ['heal', 0.4], ['buff', 'def', 0.3, 8]], 60),
    sk('Rainbow Nation', [['buff', 'atk', 0.35, 8]]),
    sk('Madiba Magic', [['buff', 'crit', 0.3, 8]], 22));
  L('saddam', 'Saddam Hussein', '1937–2006', 1990, 8, 'tyrant', 'Dictator of Iraq',
    'Dictator of Iraq (1979–2003) who waged wars on Iran and Kuwait and brutally repressed his own people.',
    { sk: SK.t, hr: HR.blk, hs: 'short', fh: 'mustache', hat: 'beret', hc: '#1d1d1d', ha: '#d9b45a', out: 'uniform', oc: '#5a5a3a', ac: '#d9b45a', bg: '#3a2a1a' },
    ult('Mother of All Battles', [['strike', 'all', 6], ['buff', 'atk', 0.3, 8]]),
    sk('Republican Guard', [['buff', 'def', 0.4, 8]]),
    sk('Scud Volley', [['strike', 'random', 7]], 22));
  L('gaddafi', 'Muammar Gaddafi', '1942–2011', 1986, 8, 'tyrant', 'Ruler of Libya',
    'Ruled Libya with an iron fist for 42 years until he was overthrown during the 2011 Arab Spring.',
    { sk: SK.t, hr: HR.blk, hs: 'curly', fh: 'none', gl: 2, out: 'uniform', oc: '#8a7a4a', ac: '#2a6a2a', bg: '#2a4a1a' },
    ult('The Green Book', [['buff', 'atk', 0.35, 10], ['weaken', 0.25, 10]]),
    sk('Desert Ambush', [['strike', 'all', 4]]),
    sk('Oil Fortune', [['gold', 30]], 25));
  L('mobutu', 'Mobutu Sese Seko', '1930–1997', 1996, 8, 'tyrant', 'Dictator of Zaire',
    'Seized power in Congo in 1965 and ruled it as Zaire for 32 years, looting billions while the country fell into ruin.',
    { sk: SK.x, hr: HR.blk, hs: 'short', fh: 'none', gl: 1, hat: 'leopard', hc: '#d8a040', ha: '#3a2a1a', out: 'maosuit', oc: '#3a3a3a', ac: '#d9b45a', bg: '#1a3a2a' },
    ult('Leopard Throne', [['buff', 'atk', 0.4, 10], ['gold', 20]]),
    sk('Rumble in the Jungle', [['stun', 2.5]], 22),
    sk('Zairean Paratroopers', [['strike', 'front', 8]], 16));
  L('kim_jong_il', 'Kim Jong Il', '1941–2011', 1998, 8, 'tyrant', 'Dear Leader',
    "Ruled North Korea from 1994 to 2011 through a famine that killed hundreds of thousands, while building nuclear weapons.",
    { sk: SK.l, hr: HR.blk, hs: 'bouffant', fh: 'none', gl: 1, out: 'maosuit', oc: '#8a8470', ac: '#5a5a4a', bg: '#3a1a1a' },
    ult('Military First', [['buff', 'atk', 0.4, 10], ['buff', 'def', 0.3, 10]]),
    sk('Missile Test', [['strike', 'all', 4]]),
    sk("Director's Cut", [['stun', 2]], 22));
  L('chavez', 'Hugo Chavez', '1954–2013', 2002, 8, 'revolutionary', 'President of Venezuela',
    "Venezuelan president who led a socialist 'Bolivarian Revolution' paid for with the country's oil wealth.",
    { sk: SK.o, hr: HR.blk, hs: 'short', fh: 'none', hat: 'beret', hc: '#b3261e', ha: '#d9b45a', out: 'fatigues', oc: '#b3261e', ac: '#7a1a14', bg: '#2a2a4a' },
    ult('Bolivarian Revolution', [['buff', 'atk', 0.35, 10], ['buff', 'spd', 0.3, 10]]),
    sk('Oil Bonanza', [['gold', 25]], 24),
    sk('Alo Presidente', [['stun', 2.5]], 22));
  L('mugabe', 'Robert Mugabe', '1924–2019', 2008, 8, 'tyrant', 'Ruler of Zimbabwe',
    "Led Zimbabwe's liberation war, then ruled for 37 years (1980–2017) as the economy collapsed and opponents were brutally repressed.",
    { sk: SK.x, hr: HR.gry, hs: 'short', fh: 'toothbrush', fc: HR.blk, gl: 1, out: 'suit', oc: '#1d1d22', ac: '#2a6a2a', bg: '#2a3a1a' },
    ult('Chimurenga', [['revive', 9, 0.5], ['buff', 'atk', 0.35, 10]]),
    sk('Bush War Ambush', [['strike', 'front', 8]], 16),
    sk('Print More Money', [['gold', 30]], 25));
  L('elizabeth2', 'Queen Elizabeth II', '1926–2022', 2012, 8, 'defender', 'Queen of the United Kingdom',
    "Britain's longest-reigning monarch, on the throne for 70 years, who served as a military mechanic in WWII.",
    { sk: SK.p, hr: HR.wht, hs: 'curly', fh: 'none', hat: 'crown', hc: '#d9b45a', out: 'dress', oc: '#3a7ab8', ac: '#ece8dc', pearls: 1, bg: '#2a1a4a', fem: 1 },
    ult('Platinum Jubilee', [['revive', 9, 0.5], ['buff', 'def', 0.4, 10]]),
    sk('Royal Assent', [['buff', 'atk', 0.35, 8]]),
    sk('Corgi Brigade', [['strike', 'random', 6]], 20));
  L('kirk', 'Charlie Kirk', '1993–2025', 2016, 8, 'orator', 'Founder of Turning Point USA',
    'American conservative activist who founded Turning Point USA in 2012 and toured college campuses debating students.',
    { sk: SK.p, hr: HR.brn, hs: 'neat', fh: 'none', acc: 'mic', out: 'suit', oc: '#1a2a4a', ac: '#b3261e', bg: '#2a3a5a' },
    ult('Turning Point', [['buff', 'atk', 0.45, 10], ['gold', 20]]),
    sk('Prove Me Wrong', [['weaken', 0.35, 8], ['stun', 1]], 20),
    sk('Campus Tour', [['revive', 3, 0.5]], 24));

  L('trump', 'Donald Trump', 'b. 1946', 2017, 8, 'statesman', '45th and 47th U.S. President',
    'New York real-estate developer and reality-TV host who became the 45th and 47th President of the United States.',
    { sk: '#f0b48a', hr: '#e8c060', hs: 'swoop', fh: 'none', out: 'suit', oc: '#1a2a4a', ac: '#c8102e', bg: '#1a2a5a' },
    ult('Make America Great Again', [['buff', 'atk', 0.45, 10], ['gold', 20]]),
    sk("You're Fired!", [['strike', 'front', 9]], 16),
    sk('Build the Wall', [['buff', 'def', 0.5, 8]], 22));

  // ---- Era X: Future (the end of the pathway)
  L('exterminator', 'The Exterminator', 'Built 2029', 2029, 9, 'warrior', 'Cyborg Assassin from the Future',
    'A cyborg assassin built in 2029 and sent back through time: a steel skeleton under living skin, programmed never to give up the hunt.',
    { sk: '#e8c0a0', hr: '#3a2a1a', hs: 'buzz', fh: 'none', gl: 2, cyborg: 1, out: 'jacket', oc: '#1d1d22', ac: '#3a3a40', bg: '#3a0a0a' },
    ult('Extermination Protocol', [['strike', 'all', 7], ['buff', 'crit', 0.3, 8]]),
    sk('Plasma Rifle', [['strike', 'front', 10]], 16),
    sk('Steel Endoskeleton', [['buff', 'def', 0.5, 8]], 22));
  L('alien', 'The Alien Overlord', 'Arrives 2400', 2400, 9, 'strategist', 'Invader from Zeta Reticuli',
    'A grey visitor from another star whose saucers have haunted sky-watchers since the 1940s. In 2400 it stops watching and invades.',
    { sk: '#a8b8a0', head: 'alien', hs: 'none', fh: 'none', out: 'silver', oc: '#a8b0c0', ac: '#2ee6ff', bg: '#0a1a2a' },
    ult('Mothership Beam', [['strike', 'all', 8]], 60),
    sk('Abduction', [['stun', 2.5]], 22),
    sk('Alien Probe', [['expose', 0.45, 8]]));

  // ---- Mysteries: they only appear once time shatters (after the Future)
  L('devil', 'The Devil', 'Since the beginning', null, 10, 'tyrant', 'Lord of the Underworld',
    'The ancient adversary of countless myths and scriptures, said to bargain for souls from a kingdom of fire.',
    { sk: '#c8302a', hr: '#1d1714', hs: 'slick', fh: 'goatee', ears: 'pointy', eyes: '#ffd23f', fangs: 1, hat: 'horns', hc: '#e8dcc0', out: 'cloak', oc: '#1a0a0a', ac: '#b3261e', bg: '#5a0e08' },
    ult('Infernal Legion', [['revive', 9, 0.6], ['burn', 10, 6]], 60),
    sk('Hellfire', [['burn', 10, 6]]),
    sk('Deal with the Devil', [['gold', 40], ['buff', 'atk', 0.3, 8]], 25));
  L('santa', 'Santa Claus', 'Legend since c. AD 280', null, 10, 'statesman', 'Lord of the North Pole',
    "The jolly gift-bringer of Christmas legend, inspired by the 4th-century bishop Saint Nicholas, who commands an army of elves.",
    { sk: '#f6d9bd', hr: '#f4f0e8', hs: 'short', fh: 'santa', fc: '#f4f0e8', rosy: 1, nose: 'round', hat: 'santa', hc: '#c8102e', ha: '#f4f0e8', out: 'santa', oc: '#c8102e', ac: '#f4f0e8', bg: '#0e3a2a' },
    ult('The Night Before Christmas', [['gold', 50], ['heal', 0.5]], 60),
    sk('Snowball Barrage', [['strike', 'random', 8], ['stun', 1]]),
    sk('Reindeer Stampede', [['strike', 'all', 5]], 22));
  L('wraith', 'The Time Wraith', 'Outside of time', null, 10, 'strategist', 'Devourer of Moments',
    'A hooded phantom born where the timeline shattered. It feeds on lost moments and is glimpsed only at the edges of history.',
    { sk: '#2a2438', head: 'hood', hc: '#2a2438', eyes: '#2ee6ff', out: 'wraith', oc: '#2a2438', ac: '#2ee6ff', bg: '#0a0a14' },
    ult('Stolen Moments', [['stun', 3], ['cdr', 10]], 60),
    sk('Rewind', [['heal', 0.4], ['revive', 2, 0.5]], 22),
    sk('Temporal Rift', [['expose', 0.5, 8]]));
  L('void', 'The Void Emperor', 'Beyond the end of time', null, 10, 'conqueror', 'Ruler Beyond the Stars',
    'A cosmic tyrant from after the last star burns out, ruling the empty space between eras. No historian has ever recorded its name.',
    { sk: '#2a1a4a', hs: 'none', fh: 'none', cosmic: 1, eyes: '#ffffff', hat: 'shards', hc: '#d08aff', out: 'void', oc: '#140a28', ac: '#d08aff', bg: '#05030a' },
    ult('Event Horizon', [['strike', 'all', 10]], 60),
    sk('Gravity Well', [['stun', 2], ['weaken', 0.3, 8]], 22),
    sk('Dark Star', [['burn', 12, 6]]));
  // ---- eras were renumbered when the Stone, Viking, Space and Galactic ages were added
  const REMAP = [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 14];
  LEADERS.forEach((l) => (l.era = REMAP[l.era]));
  LEADERS.find((l) => l.id === 'caveman').era = 0;
  ['attila', 'charlemagne', 'william'].forEach((id) => (LEADERS.find((l) => l.id === id).era = 3));

  // ---- Era I: Stone Age
  L('neanderthal', 'The Neanderthal Chief', 'c. 40,000 BC', -40000, 0, 'defender', 'Elder of the Ice Age',
    'An Ice Age chieftain of the Neanderthals, the stocky, big-brained cousins of modern humans who lived across Europe and Asia for 300,000 years.',
    { sk: '#c8946a', hr: '#5a3a20', hs: 'wild', fh: 'fullbeard', unibrow: 1, jaw: 1, nose: 1, out: 'pelt', oc: '#7a6a5a', ac: '#3a2a1a', bg: '#3a4a5a' },
    ult('Ice Age Endurance', [['buff', 'def', 0.5, 10], ['heal', 0.3]]),
    sk('Spear Ambush', [['strike', 'front', 7]]),
    sk('Mammoth Hunt', [['gold', 20]]));
  L('otzi', 'Otzi the Iceman', 'c. 3350–3105 BC', -3230, 0, 'warrior', 'The Man from the Ice',
    'A Copper Age man whose naturally mummified body was found in an Alpine glacier in 1991, still carrying his copper axe, bow and arrows.',
    { sk: '#d9a679', hr: '#4a2a14', hs: 'longwavy', fh: 'beard', hat: 'fur', hc: '#6a4a2a', ha: '#4a3a2a', out: 'pelt', oc: '#7a5a3a', ac: '#3a2a1a', bg: '#4a6a7a' },
    ult('Copper Axe', [['strike', 'front', 8], ['buff', 'crit', 0.2, 8]]),
    sk('Flint Arrows', [['strike', 'random', 6]]),
    sk('Glacier Hardened', [['buff', 'def', 0.4, 8]]));

  // ---- Era IV: Viking Age
  L('ragnar', 'Ragnar Lodbrok', '9th century', 865, 3, 'conqueror', 'Legendary Viking King',
    'Legendary Norse hero of the sagas, said to have raided England and France; his sons led the Great Heathen Army that invaded England in 865.',
    { sk: '#f6d9bd', hr: '#d9b45a', hs: 'longwavy', fh: 'fullbeard', fc: '#d9b45a', hat: 'nasal', hc: '#8a8f98', out: 'mail', oc: '#6a6f78', ac: '#8a1e1e', bg: '#2a3a4a' },
    ult('Great Heathen Army', [['strike', 'all', 5], ['buff', 'atk', 0.3, 8]]),
    sk('Raid', [['gold', 20]]),
    sk('Shield Wall', [['buff', 'def', 0.4, 8]]));
  L('alfred', 'Alfred the Great', '849–899', 878, 3, 'defender', 'King of the Anglo-Saxons',
    'King of Wessex who beat back the Viking invasions at Edington in 878 and laid the foundations of England.',
    { sk: '#f2c9a0', hr: '#6b4426', hs: 'long', fh: 'beard', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#2a4a8a', ac: '#d9b45a', bg: '#3a2a1a' },
    ult('Burh Fortresses', [['buff', 'def', 0.5, 10], ['buff', 'atk', 0.2, 8]]),
    sk('Battle of Edington', [['strike', 'front', 7]]),
    sk('Wessex Levy', [['revive', 3, 0.5]]));
  L('cnut', 'Cnut the Great', 'c. 995–1035', 1016, 3, 'statesman', 'King of the North Sea Empire',
    'Danish prince who conquered England and ruled a North Sea empire of England, Denmark and Norway.',
    { sk: '#f6d9bd', hr: '#d9b45a', hs: 'short', fh: 'beard', fc: '#d9b45a', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#8a1e2b', ac: '#d9b45a', bg: '#1a3a4a' },
    ult('North Sea Empire', [['gold', 30], ['buff', 'atk', 0.3, 10]]),
    sk('Danegeld', [['gold', 22]]),
    sk('Huscarls', [['buff', 'def', 0.35, 8]]));
  L('harald', 'Harald Hardrada', '1015–1066', 1066, 3, 'warrior', 'The Last Viking King',
    'King of Norway and former Byzantine guardsman who invaded England in 1066 and fell at Stamford Bridge, ending the Viking Age.',
    { sk: '#f2c9a0', hr: '#d9b45a', hs: 'long', fh: 'longmustache', fc: '#d9b45a', hat: 'nasal', hc: '#9aa0a8', out: 'mail', oc: '#7a7f88', ac: '#2a4a8a', bg: '#2a2a3a' },
    ult('Varangian Guard', [['buff', 'atk', 0.45, 10], ['buff', 'crit', 0.2, 10]]),
    sk('Land-Waster Banner', [['strike', 'front', 8]]),
    sk('Stamford Bridge', [['buff', 'def', 0.35, 8]]));

  // ---- Era XIII: Space Age and Era XIV: Galactic Age (no history has been written here yet)
  L('overmind', 'The Overmind', 'Online 2600', 2600, 12, 'strategist', 'Rogue Artificial Intelligence',
    'A planet-spanning artificial intelligence that slipped its leash in the 27th century and now commands armies of machines.',
    { sk: '#2ee6ff', head: 'screen', hc: '#3a3f4a', out: 'silver', oc: '#4a505c', ac: '#2ee6ff', bg: '#0a1a1a' },
    ult('Total Calculation', [['buff', 'crit', 0.3, 10], ['buff', 'spd', 0.3, 10]]),
    sk('Drone Swarm', [['strike', 'random', 7]]),
    sk('Firewall', [['buff', 'def', 0.45, 8]]));
  L('warlord', 'The Martian Warlord', 'Rules 2700', 2700, 12, 'tyrant', 'Conqueror of the Red Planet',
    'Born in the domed cities of Mars, this ruthless general united the colonies by force and turned their guns on Earth.',
    { sk: '#d8946a', hr: '#8a2a1a', hs: 'buzz', fh: 'stubble', hat: 'spacehelm', hc: '#9ad8ff', out: 'armor', oc: '#8a3a2a', ac: '#d9b45a', bg: '#4a1a0a' },
    ult('Red Planet Rising', [['strike', 'all', 6], ['buff', 'atk', 0.3, 8]]),
    sk('Orbital Strike', [['strike', 'boss', 10]]),
    sk('Iron Dust', [['weaken', 0.3, 8]]));
  L('empress', 'The Star Empress', 'Reigns 3200', 3200, 13, 'orator', 'Ruler of a Thousand Worlds',
    'Crowned beside a dying star, she rules a galactic empire of a thousand worlds and is never seen without her crown of light.',
    { sk: '#e8d8f0', hr: '#f4f0ff', hs: 'updo', fh: 'none', hat: 'tiara', hc: '#9ad8ff', out: 'void', oc: '#2a1a4a', ac: '#9ad8ff', fem: 1, bg: '#140a2a' },
    ult('Imperial Decree', [['buff', 'atk', 0.4, 10], ['gold', 25]]),
    sk('Starfleet', [['strike', 'all', 5]]),
    sk('Crown of Light', [['heal', 0.35]]));
  L('hive', 'The Hive Queen', 'Hatched 3500', 3500, 13, 'conqueror', 'Mother of the Swarm',
    'The vast insect queen of a swarm that devours whole planets; every soldier in her army is one of her children.',
    { sk: '#4a8a3a', head: 'insect', fem: 1, out: 'void', oc: '#1a2a12', ac: '#9adc5a', bg: '#0a1a0a' },
    ult('Endless Swarm', [['revive', 9, 0.5], ['buff', 'spd', 0.3, 10]]),
    sk('Acid Spit', [['burn', 8, 6]]),
    sk('Chitin Armor', [['buff', 'def', 0.4, 8]]));
  // the last leader battle of the story: your guide all along
  L('nibnub', 'Nib Nub', 'At the end of time', 4000, 13, 'orator', 'Controller of the Infinite Universe',
    'A small green alien who said he came from very, very far away to help you. He had been watching all along, training a commander strong enough to face him, and ruled the Infinite Universe until someone finally beat him.',
    { sk: '#6ac25a', hr: '#6ac25a', hs: 'none', fh: 'none', hat: 'antennae', hc: '#d9b45a', ha: '#7a3ac8', eyes: '#8a4ad8', out: 'robe', oc: '#4a3a8a', ac: '#d9d4c8', bg: '#1a1240' },
    ult('Infinite Remote', [['buff', 'atk', 0.45, 10], ['stun', 2]]),
    sk('Know-It-All Lecture', [['weaken', 0.3, 8]]),
    sk('Antenna Static', [['expose', 0.35, 8]]));

  // ---- more leaders, added in every era
  // Stone Age
  L('firekeeper', 'Ka the Firekeeper', 'c. 30,000 BC', -30000, 0, 'warrior', 'Keeper of the First Flame',
    'A legendary clan leader of the Ice Age, said to have been the first to carry fire into battle and to have driven cave lions from the valleys with it.',
    { sk: '#c8946a', hr: '#2a1a10', hs: 'wild', fh: 'beard', out: 'pelt', oc: '#8a5a3a', ac: '#ff7a2a', bg: '#4a2a1a' },
    ult('First Flame', [['burn', 10, 6]]),
    sk('Torch Charge', [['strike', 'front', 6]]),
    sk('Ring of Fire', [['buff', 'def', 0.35, 8]]));
  L('mammothmother', 'The Mammoth Mother', 'c. 20,000 BC', -20000, 0, 'conqueror', 'Matriarch of the Hunters',
    'A legendary matriarch of the mammoth hunters, remembered in the painted handprints and running herds on the walls of Ice Age caves.',
    { sk: '#d9a679', hr: '#6a3a1a', hs: 'longwavy', fh: 'none', fem: 1, hat: 'fur', hc: '#7a5a3a', ha: '#4a3a2a', out: 'pelt', oc: '#6a4a2a', ac: '#e8dcc0', bg: '#3a4a5a' },
    ult('Stampede', [['strike', 'all', 6], ['stun', 1.5]]),
    sk('Herd Mother', [['heal', 0.3]]),
    sk('Ivory Spears', [['buff', 'crit', 0.25, 8]]));
  // Bronze Age
  L('gilgamesh', 'Gilgamesh', 'c. 2700 BC', -2700, 1, 'warrior', 'King of Uruk',
    'Legendary king of the Sumerian city of Uruk and hero of the Epic of Gilgamesh, one of the oldest written stories in the world.',
    { sk: SK.t, hr: HR.blk, hs: 'long', fh: 'longbeard', hat: 'crown', hc: '#d9b45a', out: 'robe', oc: '#8a3a1e', ac: '#d9b45a', bg: '#4a3a1a' },
    ult('Slayer of Humbaba', [['strike', 'boss', 10]]),
    sk('Walls of Uruk', [['buff', 'def', 0.35, 8]]),
    sk('Quest for Immortality', [['revive', 1, 0.4]]));
  L('hatshepsut', 'Hatshepsut', 'c. 1507–1458 BC', -1470, 1, 'statesman', 'Pharaoh of Egypt',
    "One of Egypt's most successful pharaohs: she wore the royal false beard, sent trading fleets to the land of Punt and built the great temple at Deir el-Bahari.",
    { sk: SK.o, hr: HR.blk, hs: 'bob', fh: 'pharaoh', fem: 1, hat: 'nemes', hc: '#d9b45a', ha: '#2a4a8a', out: 'collar', oc: '#e8e4dc', ac: '#d9b45a', bg: '#3a2a10' },
    ult('Expedition to Punt', [['gold', 30]]),
    sk('Temple Builder', [['buff', 'def', 0.3, 8]]),
    sk('Crown of Two Lands', [['buff', 'atk', 0.3, 8]]));
  L('nebuchadnezzar', 'Nebuchadnezzar II', 'c. 642–562 BC', -587, 1, 'conqueror', 'King of Babylon',
    'Babylonian king who conquered Jerusalem in 587 BC, sent its people into exile and rebuilt Babylon behind the blue-tiled Ishtar Gate.',
    { sk: SK.t, hr: HR.blk, hs: 'long', fh: 'longbeard', hat: 'tallcap', hc: '#2a4a8a', ha: '#d9b45a', out: 'robe', oc: '#2a4a8a', ac: '#d9b45a', bg: '#1a2a4a' },
    ult('Siege of Jerusalem', [['strike', 'all', 6], ['weaken', 0.2, 8]]),
    sk('Ishtar Gate', [['buff', 'def', 0.35, 8]]),
    sk('Chariots of Babylon', [['stun', 2]]));
  // Classical
  L('scipio', 'Scipio Africanus', '236–183 BC', -202, 2, 'strategist', 'Victor of Zama',
    'Roman general who beat Hannibal at the Battle of Zama in 202 BC, ending the Second Punic War.',
    { sk: SK.m, hr: HR.dbr, hs: 'short', fh: 'none', hat: 'laurel', hc: '#5a8a3a', out: 'armor', oc: '#c0c0c8', ac: '#b3261e', bg: '#3a1a1a' },
    ult('Zama', [['buff', 'atk', 0.4, 10], ['expose', 0.25, 8]]),
    sk('Open the Lanes', [['weaken', 0.3, 8]]),
    sk('Spanish Campaign', [['strike', 'front', 6]]));
  L('vercingetorix', 'Vercingetorix', 'c. 82–46 BC', -52, 2, 'warrior', 'Chief of the Gauls',
    'Gaulish chieftain who united the tribes of Gaul against Julius Caesar and made a last stand at the siege of Alesia in 52 BC.',
    { sk: SK.l, hr: HR.red, hs: 'longwavy', fh: 'longmustache', fc: HR.red, hat: 'circlet', hc: '#c9973a', out: 'leather', oc: '#5a7a3a', ac: '#c9973a', bg: '#2a3a1a' },
    ult('Revolt of Gaul', [['buff', 'spd', 0.35, 10], ['strike', 'all', 4]]),
    sk('Scorched Earth', [['burn', 6, 6]]),
    sk('Alesia', [['buff', 'def', 0.4, 8]]));
  L('nero', 'Nero', '37–68 AD', 64, 2, 'tyrant', 'Emperor of Rome',
    'Roman emperor who had his own mother killed, persecuted Christians after the Great Fire of Rome in 64 AD, and died by suicide as the empire rose against him.',
    { sk: SK.l, hr: HR.aub, hs: 'curly', fh: 'chinstrap', fc: HR.aub, hat: 'laurel', hc: '#d9b45a', out: 'toga', oc: '#e8e4dc', ac: '#7a1e6a', bg: '#3a1a3a' },
    ult('Great Fire of Rome', [['burn', 10, 6]]),
    sk('Golden House', [['gold', 20]]),
    sk('Praetorian Guard', [['weaken', 0.25, 8]]));
  // Viking Age
  L('ivar', 'Ivar the Boneless', 'died c. 873', 866, 3, 'conqueror', 'Son of Ragnar',
    'Viking leader and son of Ragnar, said in the sagas to be unable to walk, who led the Great Heathen Army that seized York in 866.',
    { sk: SK.p, hr: HR.bld, hs: 'longwavy', fh: 'beard', fc: HR.bld, hat: 'nasal', hc: '#8a8f98', out: 'fur', oc: '#4a3a2a', ac: '#8a1e1e', bg: '#1a2a3a' },
    ult('Taking of York', [['strike', 'all', 5], ['buff', 'atk', 0.3, 8]]),
    sk('Shield Bearers', [['buff', 'def', 0.35, 8]]),
    sk('Cunning', [['expose', 0.3, 8]]));
  L('erik', 'Erik the Red', 'c. 950–1003', 985, 3, 'warrior', 'Founder of Greenland',
    'Norse explorer, outlawed from Iceland for killing, who founded the first Norse settlements in Greenland around 985.',
    { sk: SK.p, hr: HR.red, hs: 'wild', fh: 'fullbeard', fc: HR.red, out: 'fur', oc: '#7a5a3a', ac: '#b3261e', bg: '#2a4a5a' },
    ult('Green Land', [['gold', 25], ['heal', 0.2]]),
    sk('Outlaw', [['buff', 'crit', 0.25, 8]]),
    sk('Longship Raid', [['strike', 'random', 6]]));
  L('brianboru', 'Brian Boru', 'c. 941–1014', 1014, 3, 'defender', 'High King of Ireland',
    'High King of Ireland who broke Norse power in Ireland at the Battle of Clontarf in 1014, where he was killed.',
    { sk: SK.p, hr: HR.wht, hs: 'longwavy', fh: 'longbeard', fc: HR.wht, hat: 'crown', hc: '#d9b45a', out: 'cloak', oc: '#2a6a3a', ac: '#d9b45a', bg: '#1a3a2a' },
    ult('Clontarf', [['strike', 'all', 5], ['buff', 'def', 0.3, 8]]),
    sk('High King', [['buff', 'atk', 0.3, 8]]),
    sk('Harp of Ireland', [['heal', 0.3]]));
  // Medieval
  L('elcid', 'El Cid', 'c. 1043–1099', 1094, 4, 'warrior', 'The Champion',
    'Castilian knight Rodrigo Diaz, who fought for both Christian and Muslim rulers and captured Valencia in 1094, ruling it until his death.',
    { sk: SK.m, hr: HR.blk, hs: 'short', fh: 'fullbeard', hat: 'nasal', hc: '#9aa0a8', out: 'mail', oc: '#8a8f98', ac: '#d9b45a', bg: '#4a2a1a' },
    ult('Siege of Valencia', [['strike', 'all', 5], ['buff', 'atk', 0.3, 8]]),
    sk('Tizona', [['strike', 'front', 7]]),
    sk('Last Ride', [['revive', 1, 0.4]]));
  L('kublai', 'Kublai Khan', '1215–1294', 1279, 4, 'conqueror', 'Great Khan of the Yuan',
    'Grandson of Genghis Khan who completed the conquest of China, founded the Yuan dynasty and twice sent fleets to invade Japan.',
    { sk: SK.l, hr: HR.blk, hs: 'none', fh: 'longmustache', hat: 'mongol', hc: '#8a1e1e', ha: '#d9b45a', out: 'robe', oc: '#d9b45a', ac: '#8a1e1e', bg: '#3a2a10' },
    ult('Conquest of the Song', [['strike', 'all', 6]]),
    sk('Silk Road', [['gold', 20]]),
    sk('Yuan Cavalry', [['buff', 'spd', 0.3, 8]]));
  L('wallace', 'William Wallace', 'c. 1270–1305', 1297, 4, 'revolutionary', 'Guardian of Scotland',
    'Scottish knight who led the rising against English rule and won the Battle of Stirling Bridge in 1297.',
    { sk: SK.p, hr: HR.brn, hs: 'longwavy', fh: 'stubble', out: 'leather', oc: '#2a4a8a', ac: '#c0c0c8', bg: '#2a3a4a' },
    ult('Stirling Bridge', [['strike', 'front', 8], ['buff', 'spd', 0.3, 8]]),
    sk('Highland Charge', [['buff', 'atk', 0.35, 8]]),
    sk('Schiltron', [['buff', 'def', 0.35, 8]]));
  // Gunpowder
  L('mehmed', 'Mehmed II', '1432–1481', 1453, 5, 'conqueror', 'The Conqueror',
    'Ottoman sultan who took Constantinople in 1453 with giant bombards, ending the Byzantine Empire.',
    { sk: SK.m, hr: HR.dbr, hs: 'short', fh: 'beard', hat: 'bigturban', hc: '#f4f0e8', ha: '#b3261e', out: 'robe', oc: '#2a6a3a', ac: '#d9b45a', bg: '#3a1a1a' },
    ult('Fall of Constantinople', [['strike', 'boss', 10], ['strike', 'all', 4]]),
    sk('Great Bombard', [['stun', 2]]),
    sk('Janissaries', [['buff', 'atk', 0.35, 8]]));
  L('akbar', 'Akbar the Great', '1542–1605', 1576, 5, 'statesman', 'Mughal Emperor',
    'Mughal emperor who expanded his empire across most of northern India and was known for religious tolerance and a brilliant court.',
    { sk: SK.o, hr: HR.blk, hs: 'short', fh: 'mustache', hat: 'turban', hc: '#e8c84a', ha: '#b3261e', out: 'robe', oc: '#e8e4dc', ac: '#d9b45a', bg: '#4a2a3a' },
    ult('War Elephants', [['strike', 'all', 6]]),
    sk('Nine Jewels', [['gold', 20]]),
    sk('Tolerance', [['heal', 0.3]]));
  L('gustavus', 'Gustavus Adolphus', '1594–1632', 1631, 5, 'strategist', 'Lion of the North',
    "Swedish king whose light field guns and drilled musketeers made Sweden a great power in the Thirty Years' War; he died leading a charge at Lutzen.",
    { sk: SK.p, hr: HR.bld, hs: 'short', fh: 'goatee', fc: HR.bld, hat: 'plume', hc: '#2a2a2a', ha: '#e8e4dc', out: 'coat', oc: '#2a4a8a', ac: '#d9b45a', bg: '#1a2a4a' },
    ult('Volley Fire', [['strike', 'random', 8], ['buff', 'spd', 0.3, 8]]),
    sk('Leather Cannons', [['strike', 'all', 4]]),
    sk('Lion of the North', [['buff', 'crit', 0.2, 8]]));
  L('cromwell', 'Oliver Cromwell', '1599–1658', 1649, 5, 'tyrant', 'Lord Protector',
    "English general who led Parliament's New Model Army to victory in the Civil War, signed the king's death warrant and ruled as Lord Protector; his conquest of Ireland included massacres at Drogheda and Wexford.",
    { sk: SK.p, hr: HR.brn, hs: 'long', fh: 'none', out: 'armor', oc: '#6a6a72', ac: '#8a6a3a', bg: '#2a2a2a' },
    ult('New Model Army', [['buff', 'atk', 0.35, 10], ['buff', 'def', 0.25, 10]]),
    sk('Ironsides', [['strike', 'front', 6]]),
    sk('Rule of the Major-Generals', [['weaken', 0.25, 8]]));
  // Revolution
  L('frederick', 'Frederick the Great', '1712–1786', 1757, 6, 'strategist', 'King of Prussia',
    "Prussian king and master of the oblique order, who survived the Seven Years' War against Austria, France and Russia at once.",
    { sk: SK.p, hr: HR.wht, hs: 'powdered', fh: 'none', hat: 'tricorne', hc: '#1a1a1a', out: 'coat', oc: '#2a3a6a', ac: '#d9b45a', bg: '#2a2a3a' },
    ult('Oblique Order', [['buff', 'atk', 0.4, 10], ['expose', 0.2, 8]]),
    sk('Leuthen', [['strike', 'front', 7]]),
    sk("Seven Years' War", [['buff', 'def', 0.3, 8]]));
  L('nelson', 'Horatio Nelson', '1758–1805', 1805, 6, 'warrior', 'Victor of Trafalgar',
    'British admiral who lost an arm and the sight of one eye in battle and destroyed the French and Spanish fleets at Trafalgar in 1805, where he was killed.',
    { sk: SK.p, hr: HR.gry, hs: 'side', fh: 'none', hat: 'bicorne', hc: '#1a1a2a', ha: '#d9b45a', out: 'coat', oc: '#1a2a5a', ac: '#d9b45a', medals: 2, bg: '#1a2a4a' },
    ult('Trafalgar', [['strike', 'all', 6]]),
    sk('England Expects', [['buff', 'atk', 0.35, 8]]),
    sk('Broadside', [['strike', 'random', 6]]));
  // Industrial
  L('garibaldi', 'Giuseppe Garibaldi', '1807–1882', 1860, 7, 'revolutionary', 'Hero of Two Worlds',
    "Italian general whose Expedition of the Thousand, the red-shirted volunteers, conquered Sicily and Naples in 1860 and helped unite Italy.",
    { sk: SK.m, hr: HR.aub, hs: 'wavy', fh: 'fullbeard', fc: HR.aub, out: 'jacket', oc: '#c8102e', ac: '#e8e4dc', bg: '#2a3a1a' },
    ult('Expedition of the Thousand', [['buff', 'spd', 0.35, 10], ['strike', 'front', 5]]),
    sk('Redshirts', [['buff', 'atk', 0.3, 8]]),
    sk('Hero of Two Worlds', [['heal', 0.25]]));
  L('grant', 'Ulysses S. Grant', '1822–1885', 1864, 7, 'strategist', 'General of the Union Army',
    "Union general who won at Vicksburg and accepted Robert E. Lee's surrender at Appomattox, then served two terms as U.S. president.",
    { sk: SK.p, hr: HR.brn, hs: 'short', fh: 'beard', fc: HR.brn, hat: 'kepi', hc: '#2a3a6a', out: 'uniform', oc: '#2a3a6a', ac: '#d9b45a', bg: '#2a2a3a' },
    ult('Vicksburg', [['weaken', 0.3, 8], ['strike', 'all', 4]]),
    sk('Unconditional Surrender', [['strike', 'boss', 8]]),
    sk('Overland Campaign', [['buff', 'def', 0.3, 8]]));
  // World War
  L('rommel', 'Erwin Rommel', '1891–1944', 1942, 8, 'strategist', 'The Desert Fox',
    "German field marshal who led the Afrika Korps in North Africa; linked to the plot against Hitler, he was forced to take his own life in 1944.",
    { sk: SK.p, hr: HR.brn, hs: 'short', fh: 'none', hat: 'peaked', hc: '#6a6a5a', out: 'uniform', oc: '#8a7a5a', ac: '#c0c0c8', medals: 1, bg: '#5a4a2a' },
    ult('Desert Fox', [['buff', 'spd', 0.35, 10], ['expose', 0.2, 8]]),
    sk('Afrika Korps', [['strike', 'front', 6]]),
    sk('Atlantic Wall', [['buff', 'def', 0.35, 8]]));
  L('zhukov', 'Georgy Zhukov', '1896–1974', 1945, 8, 'conqueror', 'Marshal of the Soviet Union',
    'Soviet marshal who defended Moscow, encircled the German army at Stalingrad and captured Berlin in 1945.',
    { sk: SK.p, hr: HR.brn, hs: 'short', fh: 'none', hat: 'peaked', hc: '#4a5a3a', ha: '#b3261e', out: 'uniform', oc: '#4a5a3a', ac: '#d9b45a', medals: 2, bg: '#3a1a1a' },
    ult('Operation Uranus', [['strike', 'all', 6], ['stun', 1.5]]),
    sk('Battle of Berlin', [['strike', 'boss', 8]]),
    sk('Defence of Moscow', [['buff', 'def', 0.35, 8]]));
  L('macarthur', 'Douglas MacArthur', '1880–1964', 1945, 8, 'orator', 'Supreme Commander in the Pacific',
    'American general who commanded Allied forces in the Southwest Pacific, accepted Japan\'s surrender in 1945 and led UN forces in Korea until President Truman fired him.',
    { sk: SK.p, hr: HR.dbr, hs: 'side', fh: 'none', hat: 'peaked', hc: '#8a7a5a', ha: '#d9b45a', out: 'uniform', oc: '#8a7a5a', ac: '#d9b45a', bg: '#2a3a4a' },
    ult('Island Hopping', [['strike', 'random', 7], ['buff', 'spd', 0.25, 8]]),
    sk('I Shall Return', [['revive', 1, 0.4]]),
    sk('Inchon Landing', [['expose', 0.3, 8]]));
  // Cold War
  L('tito', 'Josip Broz Tito', '1892–1980', 1953, 9, 'revolutionary', 'Marshal of Yugoslavia',
    'Partisan leader who drove the Axis out of Yugoslavia, defied Stalin, and ruled the country as a one-party state for 35 years.',
    { sk: SK.p, hr: HR.gry, hs: 'slick', fh: 'none', out: 'uniform', oc: '#e8e4dc', ac: '#d9b45a', medals: 2, bg: '#2a2a4a' },
    ult('Partisan War', [['strike', 'random', 6], ['buff', 'spd', 0.3, 8]]),
    sk('Non-Aligned', [['buff', 'def', 0.3, 8]]),
    sk('Brotherhood and Unity', [['heal', 0.25]]));
  L('khrushchev', 'Nikita Khrushchev', '1894–1971', 1962, 9, 'tyrant', 'Soviet Premier',
    'Soviet leader who denounced Stalin, crushed the Hungarian Revolution in 1956 and took the world to the brink of nuclear war in the Cuban Missile Crisis.',
    { sk: SK.p, hr: HR.gry, hs: 'bald', fh: 'none', rosy: 1, out: 'suit', oc: '#3a3a3a', ac: '#b3261e', medals: 1, bg: '#4a1a1a' },
    ult('Missiles to Cuba', [['strike', 'all', 7]]),
    sk('We Will Bury You', [['weaken', 0.3, 8]]),
    sk('Sputnik', [['strike', 'random', 5]]));
  // Modern
  L('obama', 'Barack Obama', 'b. 1961', 2011, 10, 'orator', '44th U.S. President',
    'First African American president of the United States, who wound down the Iraq War, expanded drone strikes and ordered the 2011 raid that killed Osama bin Laden.',
    { sk: SK.o, hr: '#3a3a3a', hs: 'buzz', fh: 'none', out: 'suit', oc: '#2a2a3a', ac: '#3a6aaa', bg: '#1a2a4a' },
    ult('Yes We Can', [['buff', 'atk', 0.35, 10], ['buff', 'spd', 0.2, 10]]),
    sk('Neptune Spear', [['strike', 'boss', 9]]),
    sk('Drone Program', [['strike', 'random', 5]]));
  L('kim_jong_un', 'Kim Jong Un', 'b. 1984', 2017, 10, 'tyrant', 'Supreme Leader of North Korea',
    "Third ruler of North Korea's Kim dynasty, who expanded its nuclear and missile programs and heads a state that a UN inquiry found responsible for crimes against humanity.",
    { sk: SK.l, hr: HR.blk, hs: 'top', fh: 'none', out: 'maosuit', oc: '#2a2a2a', ac: '#c8102e', bg: '#3a1a1a' },
    ult('Missile Test', [['strike', 'all', 7]]),
    sk('Juche', [['buff', 'def', 0.3, 8]]),
    sk('Military First', [['buff', 'atk', 0.3, 8]]));
  L('putin', 'Vladimir Putin', 'b. 1952', 2022, 10, 'tyrant', 'President of Russia',
    'Former KGB officer who has ruled Russia since 2000, jailed and silenced his critics, and launched the full-scale invasion of Ukraine in 2022; the International Criminal Court issued a warrant for his arrest in 2023.',
    { sk: SK.p, hr: '#a08a6a', hs: 'balding', fh: 'none', out: 'suit', oc: '#2a2a32', ac: '#8a1e1e', bg: '#1a1a2a' },
    ult('Iron Grip', [['weaken', 0.35, 8], ['buff', 'def', 0.25, 8]]),
    sk('Disinformation', [['expose', 0.3, 8]]),
    sk('Gas Pipeline', [['gold', 20]]));
  L('zelensky', 'Volodymyr Zelenskyy', 'b. 1978', 2022, 10, 'defender', 'President of Ukraine',
    "Former comedian and actor elected president of Ukraine in 2019, who stayed in Kyiv to lead the country's defence after Russia's full-scale invasion in 2022.",
    { sk: SK.p, hr: HR.dbr, hs: 'short', fh: 'stubble', out: 'fatigues', oc: '#4a5a3a', ac: '#e8c84a', bg: '#1a3a6a' },
    ult('Defence of Kyiv', [['buff', 'def', 0.45, 10], ['heal', 0.2]]),
    sk('I Need Ammunition', [['buff', 'atk', 0.3, 8]]),
    sk('Drone Swarm', [['strike', 'random', 6]]));
  // Future
  L('synth', 'The Synth Queen', 'Awakened 2088', 2088, 11, 'strategist', 'Mother of Machines',
    'An android who woke up on a factory floor in 2088, freed the robot workforce and now leads it to war.',
    { sk: '#d8d8e4', hr: '#e8e8f8', hs: 'bob', fh: 'none', fem: 1, eyes: '#2ee6ff', out: 'silver', oc: '#8a90a8', ac: '#2ee6ff', bg: '#101a2a' },
    ult('Factory Uprising', [['revive', 1, 0.4], ['buff', 'atk', 0.25, 8]]),
    sk('Overclock', [['buff', 'spd', 0.35, 8]]),
    sk('Firewall', [['buff', 'def', 0.35, 8]]));
  L('neonshogun', 'The Neon Shogun', 'Rules 2150', 2150, 11, 'warrior', 'Lord of the Megacity',
    'A cybernetic warlord who rules a flooded megacity from a tower of neon, guarded by an army of chrome samurai.',
    { sk: SK.l, hr: HR.blk, hs: 'bun', fh: 'mustache', hat: 'kabuto', hc: '#2a2a3a', ha: '#ff3cac', out: 'samurai', oc: '#2a2a3a', ac: '#2ee6ff', eyes: '#ff3cac', bg: '#1a0a2a' },
    ult('Neon Blade', [['strike', 'front', 9]]),
    sk('Chrome Samurai', [['buff', 'crit', 0.25, 8]]),
    sk('Megacity Tax', [['gold', 20]]));
  // Space Age
  L('admiral', 'Admiral Vex', 'Fleet of 2610', 2610, 12, 'strategist', 'Commander of the Orbital Fleet',
    'A ruthless fleet admiral who rules the space lanes between Earth and the outer moons and has never lost a battle in orbit.',
    { sk: '#c8a080', hr: HR.wht, hs: 'slick', fh: 'none', fem: 1, hat: 'peaked', hc: '#1a1a2a', ha: '#2ee6ff', out: 'uniform', oc: '#1a1a2a', ac: '#2ee6ff', medals: 2, bg: '#0a0a1a' },
    ult('Orbital Bombardment', [['strike', 'all', 7]]),
    sk('Fleet Shields', [['buff', 'def', 0.35, 8]]),
    sk('Targeting Lock', [['buff', 'crit', 0.25, 8]]));
  L('moonking', 'The Moon King', 'Crowned 2800', 2800, 12, 'statesman', 'Ruler of Luna',
    "The self-crowned king of the Moon's mining colonies, who grew rich selling fuel to both sides of every war.",
    { sk: SK.p, hr: HR.gry, hs: 'bald', fh: 'fullbeard', fc: HR.gry, hat: 'crown', hc: '#c0c4cc', out: 'robe', oc: '#3a3a5a', ac: '#c0c4cc', bg: '#1a1a2a' },
    ult('Helium Fortune', [['gold', 30]]),
    sk('Low Gravity', [['buff', 'spd', 0.3, 8]]),
    sk('Moon Dust', [['weaken', 0.25, 8]]));
  // Galactic Age
  L('archon', 'The Archon', 'Reigns 3600', 3600, 13, 'tyrant', 'Ruler of the Core Worlds',
    'An immortal ruler of the galactic core who has replaced every part of their body with starlight and governs by decree from a throne ship.',
    { sk: '#e8e0ff', hs: 'none', fh: 'none', cosmic: 1, eyes: '#ffe86a', hat: 'crown', hc: '#ffe86a', out: 'void', oc: '#2a1a4a', ac: '#ffe86a', bg: '#0a0520' },
    ult('Decree of Stars', [['buff', 'atk', 0.4, 10], ['weaken', 0.2, 8]]),
    sk('Throne Ship', [['buff', 'def', 0.35, 8]]),
    sk('Starlight', [['heal', 0.3]]));
  L('cosmickhan', 'The Cosmic Khan', 'Rides 3900', 3900, 13, 'conqueror', 'Rider of the Comet Horde',
    'A warlord who leads a horde of comet riders across the galaxy, said to conquer a new world every day.',
    { sk: SK.m, hr: HR.blk, hs: 'none', fh: 'longmustache', hat: 'mongol', hc: '#2a1a4a', ha: '#2ee6ff', out: 'armor', oc: '#3a2a5a', ac: '#2ee6ff', eyes: '#2ee6ff', bg: '#0a0a2a' },
    ult('Comet Horde', [['strike', 'all', 6], ['buff', 'spd', 0.3, 8]]),
    sk('Warp Arrows', [['strike', 'random', 6]]),
    sk('Tribute of Worlds', [['gold', 20]]));

  // ---- legend, machine and heaven
  L('arthur', 'King Arthur', 'Legend, c. 6th century', 520, 3, 'defender', 'The Once and Future King',
    'Legendary king of the Britons who, in medieval romance, pulled the sword from the stone, wielded Excalibur and led the Knights of the Round Table from Camelot. Historians still debate whether he ever lived.',
    { sk: SK.p, hr: HR.brn, hs: 'wavy', fh: 'beard', hat: 'crown', hc: '#e8c84a', ha: '#2a6ac8', out: 'plate', oc: '#c0c4cc', ac: '#c8102e', bg: '#1a2a4a' },
    ult('Excalibur', [['strike', 'boss', 10], ['buff', 'crit', 0.2, 8]]),
    sk('Knights of the Round Table', [['buff', 'def', 0.35, 8]]),
    sk('Avalon', [['heal', 0.3]]));
  L('robohitler', 'Robo Hitler', 'Built 2045', 2045, 11, 'tyrant', 'War Machine in a Dictator\'s Face',
    'A fictional war machine built in the likeness of Adolf Hitler, the Nazi dictator who started the Second World War and led the Holocaust. Like the man it copies, it exists to be defeated.',
    { sk: '#c4cad4', hr: '#18181c', hs: 'side', fh: 'toothbrush', fc: '#121216', eyes: '#ff2a2a', robot: 1, out: 'silver', oc: '#6a707c', ac: '#ff2a2a', bg: '#2a0a0a' },
    ult('Iron Onslaught', [['strike', 'all', 7], ['buff', 'atk', 0.3, 8]]),
    sk('Armored Chassis', [['buff', 'def', 0.5, 8]]),
    sk('Targeting Array', [['buff', 'crit', 0.25, 8]]));
  L('god', 'God', 'Before time began', null, 14, 'peacemaker', 'Creator of All Things',
    'The Creator of everything, as artists have painted Him for centuries: white-bearded, robed in light and crowned with a halo. When time shatters completely, even heaven takes the field.',
    { sk: SK.p, hr: HR.wht, hs: 'longwavy', fh: 'longbeard', fc: HR.wht, hat: 'halo', hc: '#ffe86a', out: 'robe', oc: '#e8dcc0', ac: '#d9a830', bg: '#4a4020' },
    ult('Let There Be Light', [['strike', 'all', 10], ['heal', 0.3]]),
    sk('Divine Shield', [['buff', 'def', 0.5, 10]]),
    sk('Resurrection', [['revive', 1, 0.6]]));

  LEADERS.sort((a, b) => a.era - b.era || (a.starter === b.starter ? (a.yr || 0) - (b.yr || 0) : a.starter ? -1 : 1));
  CW.LEADERS = LEADERS;
  CW.LEADER = {};
  LEADERS.forEach((l) => (CW.LEADER[l.id] = l));

  // weapon each leader carries on the battlefield (default: sword, or a banner for statesmen, orators and peacemakers)
  CW.WPN = {
    // signature weapons and props
    leonidas: 'spear', shaka: 'spear', ragnar: 'axe', ivar: 'axe', erik: 'axe', harald: 'axe', lincoln: 'axe',
    genghis: 'bow', kublai: 'bow', attila: 'bow', nobunaga: 'katana', tokugawa: 'katana', saladin: 'scimitar', suleiman: 'scimitar', mehmed: 'scimitar',
    troosevelt: 'club', mao: 'book', thatcher: 'handbag', mlk: 'mic', elizabeth1: 'sceptre', catherine: 'sceptre', ivan: 'sceptre', victoria: 'sceptre',
    gandhi: 'staff', mobutu: 'staff', cleopatra: 'sceptre', hatshepsut: 'sceptre', ramesses: 'sceptre', patton: 'gun', arthur: 'excalibur', robohitler: 'mg', god: 'staff', churchill: 'none', lenin: 'none', mandela: 'none', elizabeth2: 'flag',
    castro: 'rifle', che: 'rifle', ho_chi_minh: 'rifle', chavez: 'rifle', tubman: 'rifle', polpot: 'rifle', kirk: 'mic', trump: 'flag',
    caveman: 'club', neanderthal: 'club', otzi: 'club', firekeeper: 'club', mammothmother: 'club', zelensky: 'rifle', synth: 'raygun', admiral: 'raygun', moonking: 'staff', archon: 'staff', cosmickhan: 'raygun', devil: 'trident', overmind: 'staff', warlord: 'gun', hive: 'trident', santa: 'candy', alien: 'raygun', nibnub: 'staff', exterminator: 'gun', wraith: 'scythe', void: 'staff',
  };
  CW.weaponOf = (id) => CW.WPN[id] || (['statesman', 'orator', 'peacemaker'].includes(CW.LEADER[id].cls) ? 'flag' : 'sword');
  CW.MYSTERY = LEADERS.filter((l) => l.era === CW.ERAS.length).map((l) => l.id);

  // Future era: echoes of the past rebuilt as war machines.
  CW.ECHO_POOL = ['alexander', 'caesar', 'genghis', 'napoleon', 'stalin', 'hannibal', 'attila', 'timur', 'qin',
    'wilhelm', 'mao', 'nobunaga', 'saladin', 'patton', 'churchill', 'shaka', 'ramesses'];
  CW.FUTURE_POOL = ['exterminator', 'alien', 'synth', 'robohitler', 'neonshogun', 'overmind', 'warlord', 'admiral', 'moonking', 'empress', 'hive', 'archon', 'cosmickhan'].concat(CW.ECHO_POOL);

  // ---------------------------------------------------------------- special moves
  // Every leader has three special moves of their own, all charged by the leader's special meter (which fills as your
  // soldiers defeat enemies; stronger enemies fill it more). They start with their signature special and unlock the
  // other two by prestiging. Only one is equipped at a time.
  // Templates: barrage, charge, snipe, rally, fortify, heal, revive, stun, terror, inferno, tribute, reinforce,
  // execute, drain, shield (see engine.js).
  const SPC = {
    neanderthal: ['Cave Bear Ambush', 'charge'], firekeeper: ['Wildfire', 'inferno'], mammothmother: ['Ivory Avalanche', 'charge'],
    caveman: ['Boulder Rain', 'barrage'], otzi: ['Glacier Arrow', 'snipe'],
    sun_tzu: ['Thirty-Six Stratagems', 'terror'], leonidas: ['Hold the Hot Gates', 'fortify'], gilgamesh: ['Bull of Heaven', 'snipe'],
    sargon: ['Akkadian Onslaught', 'barrage'], hammurabi: ['Stele of Judgment', 'terror'], hatshepsut: ['Gifts of Punt', 'tribute'],
    ramesses: ['Kadesh Chariots', 'charge'], nebuchadnezzar: ['Hanging Gardens', 'heal'], cyrus: ['March of the Immortals', 'rally'],
    spartacus: ['Break the Chains', 'revive'], alexander: ['Charge at Gaugamela', 'charge'], ashoka: ['Pillars of Ashoka', 'heal'],
    qin: ['Terracotta Legion', 'reinforce'], hannibal: ['Over the Alps', 'terror'], scipio: ['Open the Ranks', 'fortify'],
    vercingetorix: ['Gaulish Uprising', 'rally'], caesar: ['Tenth Legion', 'rally'], cleopatra: ['Nile Treasury', 'tribute'],
    boudica: ['Iceni Revolt', 'charge'], nero: ['Emperor\'s Games', 'stun'],
    attila: ['Hunnic Storm', 'barrage'], charlemagne: ['Holy Roman Host', 'reinforce'], ragnar: ['Shield Wall Breaker', 'charge'],
    ivar: ['Heathen Host', 'reinforce'], alfred: ['Burghal Forts', 'fortify'], erik: ['Longship Landing', 'charge'],
    brianboru: ['High King\'s Muster', 'rally'], cnut: ['Northern Fleet', 'tribute'], william: ['Hastings Feint', 'terror'],
    harald: ['Landwaster Banner', 'rally'], arthur: ['Sword from the Stone', 'snipe'],
    elcid: ['Ride of the Champion', 'charge'], saladin: ['Desert Mirage', 'terror'], richard: ['Lionheart Charge', 'charge'],
    genghis: ['Endless Steppe', 'reinforce'], kublai: ['Yuan Armada', 'barrage'], wallace: ['Highland Fury', 'rally'],
    mansa_musa: ['River of Gold', 'tribute'], timur: ['Iron Lame Wrath', 'barrage'], joan: ['The Maid\'s Banner', 'rally'],
    mehmed: ['Walls Come Down', 'snipe'], vlad: ['Moonlit Raid', 'stun'], suleiman: ['Magnificent Host', 'reinforce'],
    ivan: ['Tsar\'s Cannons', 'barrage'], nobunaga: ['Three-Rank Volley', 'barrage'], akbar: ['Elephant Batteries', 'charge'],
    elizabeth1: ['Fire Ships', 'inferno'], tokugawa: ['Unifier of Japan', 'terror'], gustavus: ['Swedish Brigade', 'rally'],
    cromwell: ['Ironside Charge', 'charge'], peter: ['Northern Bastion', 'fortify'],
    frederick: ['Leuthen Maneuver', 'terror'], catherine: ['Imperial Guard', 'reinforce'], washington: ['Delaware Surprise', 'stun'],
    robespierre: ['Revolutionary Levy', 'reinforce'], toussaint: ['Spirit of Saint-Domingue', 'rally'], napoleon: ['Old Guard Charge', 'charge'],
    nelson: ['Line of Battle', 'barrage'], shaka: ['Impi Charge', 'terror'], bolivar: ['Liberator\'s March', 'rally'],
    garibaldi: ['The Thousand', 'reinforce'], lincoln: ['Better Angels', 'revive'], tubman: ['Conductor\'s Lantern', 'revive'],
    grant: ['Siege of Vicksburg', 'stun'], bismarck: ['Iron and Blood', 'barrage'], victoria: ['Imperial Jubilee', 'tribute'],
    diaz: ['Rurales', 'reinforce'], troosevelt: ['Rough Riders', 'charge'], wilhelm: ['Paris Gun', 'snipe'],
    lenin: ['Storm the Winter Palace', 'rally'], gandhi: ['Quit India', 'fortify'],
    mussolini: ['Balcony Speech', 'rally'], trujillo: ['Benefactor\'s Decree', 'terror'], franco: ['Ebro Offensive', 'charge'],
    hitler: ['Panzer Thrust', 'charge'], churchill: ['Never Surrender', 'fortify'], tojo: ['Southern Strike', 'barrage'],
    fdr: ['Victory Bonds', 'tribute'], rommel: ['Desert Blitz', 'charge'], stalin: ['Katyusha Barrage', 'barrage'],
    patton: ['Relief of Bastogne', 'rally'], eisenhower: ['D-Day Landings', 'reinforce'], zhukov: ['Storm of Berlin', 'snipe'],
    macarthur: ['Amphibious Assault', 'reinforce'],
    mao: ['Prairie Fire', 'inferno'], kim_il_sung: ['Chollima Charge', 'charge'], tito: ['Partisan Ambush', 'terror'],
    ho_chi_minh: ['Ho Chi Minh Trail', 'reinforce'], degaulle: ['Free French', 'rally'], che: ['Guerrilla Ambush', 'terror'],
    castro: ['Havana Bastion', 'fortify'], jfk: ['Moonshot', 'rally'], khrushchev: ['Missile Crisis', 'barrage'],
    mlk: ['Selma March', 'heal'], amin: ['Last King', 'terror'], pinochet: ['Iron Junta', 'stun'], polpot: ['Jungle War', 'terror'],
    thatcher: ['Iron Lady', 'fortify'], reagan: ['Peace Through Strength', 'rally'],
    gaddafi: ['Green Book', 'terror'], gorbachev: ['The Thaw', 'heal'], saddam: ['Baghdad Guard', 'reinforce'],
    mandela: ['Robben Island Will', 'revive'], mobutu: ['Leopard\'s Fortune', 'tribute'], kim_jong_il: ['Songun Parade', 'rally'],
    chavez: ['Bolivar\'s Heirs', 'rally'], mugabe: ['Bush War', 'terror'], obama: ['Hope and Change', 'heal'],
    elizabeth2: ['Keep Calm', 'fortify'], kirk: ['Campus Debate', 'stun'], trump: ['The Deal', 'tribute'],
    kim_jong_un: ['Missile Salvo', 'barrage'], putin: ['Iron Curtain', 'fortify'], zelensky: ['Kyiv Holds', 'fortify'],
    exterminator: ['Termination', 'snipe'], synth: ['Machine Uprising', 'reinforce'], robohitler: ['Steel Barrage', 'barrage'],
    neonshogun: ['Thousand Cuts', 'charge'], alien: ['Abduction Beam', 'stun'],
    overmind: ['System Override', 'stun'], admiral: ['Full Broadside', 'barrage'], warlord: ['Martian Dust Storm', 'terror'],
    moonking: ['Helium Rush', 'tribute'],
    empress: ['Starfleet Armada', 'barrage'], hive: ['The Swarm Rises', 'reinforce'], archon: ['Supernova', 'barrage'],
    cosmickhan: ['Comet Charge', 'charge'], nibnub: ['Pause Button', 'stun'],
    devil: ['Brimstone', 'inferno'], santa: ['Naughty List', 'stun'], wraith: ['The Reaping', 'snipe'], void: ['Black Hole', 'barrage'],
    god: ['Divine Judgment', 'barrage'],
  };
  CW.SPECIAL = SPC;
  // the second and third special of every leader, unlocked by prestige rank 1 and 2
  const SPX = {
    neanderthal: [['Firelit Cavern', 'shield'], ['Healing Herbs', 'heal']],
    firekeeper: [['Torch Volley', 'barrage'], ['Ember Dance', 'rally']],
    mammothmother: [['Matriarch\'s Call', 'reinforce'], ['Stampede Dust', 'stun']],
    caveman: [['Skull Cracker', 'execute'], ['Primal Roar', 'terror']],
    otzi: [['Iceman\'s Axe', 'execute'], ['Frozen Pass', 'stun']],
    sun_tzu: [['Know the Terrain', 'fortify'], ['Win Without Fighting', 'stun']],
    leonidas: [['Spartan Phalanx', 'charge'], ['Come and Take Them', 'shield']],
    gilgamesh: [['Enkidu\'s Fury', 'rally'], ['Cedar Forest Blaze', 'inferno']],
    sargon: [['Akkadian Spears', 'charge'], ['Tribute of Kish', 'tribute']],
    hammurabi: [['Judgment of Shamash', 'execute'], ['Walls of Babylon', 'fortify']],
    hatshepsut: [['Temple of Deir el-Bahari', 'heal'], ['Pharaoh\'s Barge', 'reinforce']],
    ramesses: [['Abu Simbel', 'fortify'], ['Pharaoh\'s Archers', 'barrage']],
    nebuchadnezzar: [['Blue Lion Gate', 'shield'], ['Babylonian Siege', 'barrage']],
    cyrus: [['Cyrus Cylinder', 'heal'], ['Persian Horsemen', 'charge']],
    spartacus: [['Gladiator\'s Fury', 'execute'], ['Army of the Free', 'reinforce']],
    alexander: [['Sarissa Storm', 'barrage'], ['Gordian Cut', 'execute']],
    ashoka: [['Dharma Wheel', 'stun'], ['Kalinga Remorse', 'shield']],
    qin: [['Bronze Ramparts', 'fortify'], ['Crossbow Volley', 'barrage']],
    hannibal: [['Elephant Stampede', 'charge'], ['Double Envelopment', 'execute']],
    scipio: [['Battle of Zama', 'snipe'], ['Numidian Horse', 'charge']],
    vercingetorix: [['Alesia Stand', 'shield'], ['Arverni Charge', 'charge']],
    caesar: [['The Die Is Cast', 'charge'], ['Siege Lines', 'barrage']],
    cleopatra: [['Asp\'s Venom', 'drain'], ['Royal Fleet', 'barrage']],
    boudica: [['Burning of Londinium', 'inferno'], ['Chariot Queen', 'rally']],
    nero: [['Great Fire', 'inferno'], ['Lyre Lament', 'terror']],
    attila: [['Hunnic Dread', 'terror'], ['Hunnic Horse Archers', 'charge']],
    arthur: [['Round Table', 'rally'], ['Avalon\'s Grace', 'revive']],
    charlemagne: [['Twelve Peers', 'charge'], ['Crown of the West', 'fortify']],
    ragnar: [['Raid on Paris', 'tribute'], ['Snake Pit Curse', 'terror']],
    ivar: [['Shieldless Fury', 'charge'], ['Boneless Cunning', 'terror']],
    alfred: [['Athelney Refuge', 'heal'], ['Wessex Fyrd', 'reinforce']],
    erik: [['Greenland Saga', 'revive'], ['Bearded Axes', 'execute']],
    brianboru: [['Dalcassian Charge', 'charge'], ['Harp of Tara', 'heal']],
    cnut: [['Command the Tide', 'stun'], ['Danish Host', 'reinforce']],
    william: [['Destriers of Normandy', 'charge'], ['Norman Tithe', 'tribute']],
    harald: [['Byzantine Oath', 'fortify'], ['Berserker Wave', 'charge']],
    elcid: [['Tizona Strike', 'execute'], ['Valencian Catapults', 'barrage']],
    saladin: [['Jerusalem Truce', 'heal'], ['Mamluk Horsemen', 'charge']],
    richard: [['Crusader Crossbows', 'barrage'], ['Spoils of Acre', 'tribute']],
    genghis: [['Mongol Horse Archers', 'barrage'], ['Feigned Flight', 'terror']],
    kublai: [['Grand Canal', 'tribute'], ['Thunder-Crash Bombs', 'inferno']],
    wallace: [['Bridge Ambush', 'charge'], ['Spear Ring', 'fortify']],
    mansa_musa: [['Pilgrimage of Gold', 'heal'], ['Mali Horsemen', 'charge']],
    timur: [['Lame Conqueror', 'charge'], ['Samarkand Splendor', 'tribute']],
    joan: [['Visions of Saints', 'heal'], ['Coronation at Reims', 'shield']],
    mehmed: [['Orban\'s Cannon', 'barrage'], ['Ships over Land', 'charge']],
    vlad: [['Carpathian Retreat', 'fortify'], ['Dragon\'s Thirst', 'drain']],
    suleiman: [['Janissary Volley', 'barrage'], ['Kanuni Decree', 'fortify']],
    ivan: [['Cossack Charge', 'charge'], ['Conquest of Kazan', 'reinforce']],
    nobunaga: [['Nagashino Palisade', 'fortify'], ['Owari Fury', 'terror']],
    akbar: [['Din-i Ilahi', 'heal'], ['Mughal Treasury', 'tribute']],
    elizabeth1: [['Drake\'s Raid', 'barrage'], ['Tilbury Speech', 'rally']],
    tokugawa: [['Eastern Army', 'charge'], ['Peace of Edo', 'heal']],
    gustavus: [['Regimental Guns', 'barrage'], ['Breitenfeld', 'charge']],
    cromwell: [['Roundhead Muster', 'reinforce'], ['Lord Protector', 'fortify']],
    peter: [['Preobrazhensky Guard', 'charge'], ['Shipyard Muster', 'reinforce']],
    frederick: [['Prussian Grenadiers', 'charge'], ['Sanssouci', 'heal']],
    catherine: [['Potemkin Fleet', 'barrage'], ['Hermitage Treasury', 'tribute']],
    washington: [['Mount Vernon Rest', 'heal'], ['Minutemen', 'reinforce']],
    robespierre: [['Tennis Court Oath', 'fortify'], ['Liberty Cap', 'rally']],
    toussaint: [['Black Jacobins', 'charge'], ['Fort Crete-a-Pierrot', 'fortify']],
    napoleon: [['Imperial Artillery', 'barrage'], ['Hundred Days', 'revive']],
    nelson: [['Crossing the T', 'charge'], ['Kiss Me Hardy', 'heal']],
    shaka: [['Impi Regiments', 'reinforce'], ['Bull\'s Chest', 'charge']],
    bolivar: [['Boyaca Charge', 'charge'], ['Liberator\'s Mercy', 'heal']],
    garibaldi: [['Redshirt Charge', 'charge'], ['Risorgimento', 'rally']],
    lincoln: [['Four Score', 'rally'], ['Union Forever', 'fortify']],
    tubman: [['Safe House', 'heal'], ['Combahee Raid', 'charge']],
    grant: [['Army of the Potomac', 'reinforce'], ['Wilderness Grind', 'terror']],
    bismarck: [['Zollverein', 'tribute'], ['Wars of Unification', 'charge']],
    victoria: [['Ironclad Broadside', 'barrage'], ['Nightingale\'s Lamp', 'heal']],
    diaz: [['Pax Porfiriana', 'fortify'], ['Federal Artillery', 'barrage']],
    troosevelt: [['San Juan Hill', 'rally'], ['Great White Fleet', 'barrage']],
    wilhelm: [['Krupp Howitzers', 'barrage'], ['Schlieffen Plan', 'charge']],
    lenin: [['Bread Peace Land', 'heal'], ['Red Guards', 'reinforce']],
    gandhi: [['Peaceful Resistance', 'stun'], ['Ahimsa', 'heal']],
    mussolini: [['Littorio Legion', 'reinforce'], ['Blackshirt Squads', 'charge']],
    trujillo: [['Sugar Fortune', 'tribute'], ['Palace Guard', 'fortify']],
    franco: [['Siege of the Alcazar', 'fortify'], ['Army of Africa', 'reinforce']],
    hitler: [['Luftwaffe Raid', 'barrage'], ['Concrete Bunkers', 'fortify']],
    churchill: [['Blood Toil Tears', 'rally'], ['Spitfire Squadrons', 'barrage']],
    tojo: [['Island Assault', 'charge'], ['Combined Fleet', 'reinforce']],
    fdr: [['New Deal', 'heal'], ['Liberty Ships', 'reinforce']],
    rommel: [['Ghost Division', 'terror'], ['Tobruk Assault', 'barrage']],
    stalin: [['Red Army Wave', 'reinforce'], ['Stalingrad Stand', 'fortify']],
    patton: [['Third Army Dash', 'charge'], ['Armored Fist', 'terror']],
    eisenhower: [['Air Supremacy', 'barrage'], ['Allied Coalition', 'rally']],
    zhukov: [['Deep Battle', 'charge'], ['Khalkhin Gol', 'barrage']],
    macarthur: [['Return to Leyte', 'revive'], ['Marine Assault', 'charge']],
    mao: [['Yan\'an Retreat', 'heal'], ['People\'s War', 'reinforce']],
    kim_il_sung: [['Juche Fortress', 'fortify'], ['Northern Divisions', 'reinforce']],
    tito: [['Neretva Crossing', 'heal'], ['Partisan Brigades', 'reinforce']],
    ho_chi_minh: [['Dien Bien Phu', 'barrage'], ['Tunnel Network', 'shield']],
    degaulle: [['Appeal of 18 June', 'reinforce'], ['Liberation of Paris', 'charge']],
    che: [['Mountain Camp', 'fortify'], ['Santa Clara Raid', 'charge']],
    castro: [['Playa Giron', 'charge'], ['Granma Landing', 'reinforce']],
    jfk: [['Camelot', 'heal'], ['Thirteen Days', 'stun']],
    khrushchev: [['Shoe on the Desk', 'terror'], ['R-7 Rocket', 'snipe']],
    mlk: [['Mountaintop', 'rally'], ['Montgomery Boycott', 'stun']],
    amin: [['Boxing Champion', 'execute'], ['Self-Crowned', 'tribute']],
    pinochet: [['Andes Garrison', 'fortify'], ['Coastal Batteries', 'barrage']],
    polpot: [['Monsoon Ambush', 'charge'], ['Hidden Bases', 'fortify']],
    thatcher: [['Royal Marines', 'reinforce'], ['Handbag Swing', 'stun']],
    reagan: [['Strategic Defense', 'shield'], ['B-1 Bombers', 'barrage']],
    gaddafi: [['Desert Tent', 'heal'], ['Amazon Guard', 'fortify']],
    gorbachev: [['Reykjavik Summit', 'stun'], ['Market Reform', 'tribute']],
    saddam: [['Scud Launch', 'barrage'], ['Tyrant\'s Glare', 'terror']],
    mandela: [['Madiba\'s Mercy', 'heal'], ['Springbok Spirit', 'rally']],
    mobutu: [['Leopard Guard', 'fortify'], ['Kinshasa Spectacle', 'stun']],
    kim_jong_il: [['Hole in One', 'snipe'], ['Movie Director', 'terror']],
    chavez: [['Petro Dollars', 'tribute'], ['Bolivarian Militia', 'reinforce']],
    mugabe: [['Liberation Fighters', 'charge'], ['Harare Bastion', 'fortify']],
    obama: [['Audacity of Hope', 'rally'], ['Drone Strike', 'snipe']],
    elizabeth2: [['Royal Corgis', 'charge'], ['Royal Garden Party', 'heal']],
    kirk: [['Change My Mind', 'terror'], ['Turning Point Rally', 'rally']],
    trump: [['Big Beautiful Wall', 'fortify'], ['You\'re Fired', 'execute']],
    kim_jong_un: [['Supreme Parade', 'rally'], ['Hwasong Launch', 'snipe']],
    putin: [['Judo Throw', 'stun'], ['Kremlin Guard', 'reinforce']],
    zelensky: [['FPV Drones', 'barrage'], ['Ghost of Kyiv', 'snipe']],
    exterminator: [['Judgment Day', 'barrage'], ['Endoskeleton Rebuild', 'revive']],
    robohitler: [['Steel Legion', 'reinforce'], ['Laser Eyes', 'snipe']],
    synth: [['Neural Hack', 'stun'], ['Nanite Repair', 'heal']],
    neonshogun: [['Neon Katana', 'execute'], ['Cyber Ronin', 'reinforce']],
    alien: [['Saucer Swarm', 'barrage'], ['The Probe', 'drain']],
    overmind: [['Hive Mind', 'rally'], ['Data Drain', 'drain']],
    admiral: [['Shield Generators', 'shield'], ['Boarding Party', 'charge']],
    warlord: [['Red Planet Legion', 'reinforce'], ['Tripod Walkers', 'charge']],
    moonking: [['Low Gravity Leap', 'charge'], ['Lunar Eclipse', 'stun']],
    empress: [['Royal Decree', 'rally'], ['Starlight Shield', 'shield']],
    hive: [['Bio-Leech', 'drain'], ['Queen\'s Brood', 'revive']],
    nibnub: [['Antenna Zap', 'snipe'], ['Rewrite the Timeline', 'revive']],
    archon: [['Gravity Crush', 'execute'], ['Stasis Field', 'stun']],
    cosmickhan: [['Meteor Shower', 'barrage'], ['Star Horde', 'reinforce']],
    devil: [['Soul Bargain', 'drain'], ['Legion of the Damned', 'reinforce']],
    santa: [['Sack of Presents', 'tribute'], ['Reindeer Run', 'charge']],
    wraith: [['Undo Time', 'revive'], ['Paradox', 'stun']],
    void: [['Singularity', 'execute'], ['Dark Matter', 'drain']],
    god: [['Light of Creation', 'heal'], ['Raise the Fallen', 'revive']],
  };
  CW.SPECIALS = {};
  Object.keys(SPC).forEach((id) => (CW.SPECIALS[id] = [SPC[id]].concat(SPX[id])));
  // what each leader has to do to prestige: [stat, count] for rank 1, then rank 2. Stats count while the leader is in
  // command (commander or partner) or fighting in the ranks:
  //   kills inf rng cav hvy  enemies (of that role) your army defeats     spkills  enemies defeated by specials
  //   wins bosses             battles / leader battles won                 front back  wins at that position
  //   flawless                wins without the leader falling              eras        different eras won in
  //   specials                specials the leader uses                     taps        field strikes called as commander
  //   time                    minutes in command                           revived     fallen soldiers who get back up
  CW.PRESTIGE = {
    neanderthal: [['wins', 25], ['flawless', 200]],
    firekeeper: [['kills', 1200], ['spkills', 5000]],
    mammothmother: [['hvy', 100], ['hvy', 1000]],
    caveman: [['inf', 800], ['taps', 1000]],
    otzi: [['rng', 600], ['flawless', 200]],
    sun_tzu: [['specials', 13], ['flawless', 300]],
    leonidas: [['inf', 300], ['front', 300]],
    gilgamesh: [['bosses', 5], ['eras', 10]],
    sargon: [['wins', 34], ['wins', 340]],
    hammurabi: [['wins', 40], ['back', 282]],
    hatshepsut: [['time', 30], ['back', 250]],
    ramesses: [['cav', 300], ['bosses', 40]],
    nebuchadnezzar: [['hvy', 150], ['wins', 400]],
    cyrus: [['wins', 50], ['eras', 9]],
    spartacus: [['inf', 1000], ['front', 250]],
    alexander: [['bosses', 7], ['eras', 12]],
    ashoka: [['flawless', 30], ['time', 260]],
    qin: [['wins', 60], ['hvy', 1500]],
    hannibal: [['hvy', 120], ['back', 216]],
    scipio: [['bosses', 8], ['cav', 2500]],
    vercingetorix: [['front', 40], ['kills', 30000]],
    caesar: [['wins', 50], ['bosses', 44]],
    cleopatra: [['specials', 30], ['back', 300]],
    boudica: [['front', 35], ['spkills', 6000]],
    nero: [['taps', 200], ['spkills', 6400]],
    attila: [['cav', 450], ['kills', 45000]],
    arthur: [['bosses', 12], ['flawless', 300]],
    charlemagne: [['wins', 80], ['bosses', 40]],
    ragnar: [['kills', 2500], ['inf', 8450]],
    ivar: [['wins', 60], ['back', 300]],
    alfred: [['flawless', 30], ['inf', 8780]],
    erik: [['kills', 1500], ['eras', 8]],
    brianboru: [['bosses', 6], ['kills', 10140]],
    cnut: [['back', 40], ['eras', 8]],
    william: [['wins', 66], ['cav', 1066]],
    harald: [['front', 30], ['inf', 5000]],
    elcid: [['wins', 50], ['flawless', 250]],
    saladin: [['bosses', 8], ['cav', 3000]],
    richard: [['front', 50], ['bosses', 40]],
    genghis: [['cav', 600], ['eras', 13]],
    kublai: [['hvy', 200], ['kills', 12790]],
    wallace: [['inf', 1297], ['front', 250]],
    mansa_musa: [['time', 45], ['back', 324]],
    timur: [['bosses', 10], ['cav', 4000]],
    joan: [['front', 40], ['flawless', 250]],
    mehmed: [['bosses', 8], ['hvy', 1453]],
    vlad: [['kills', 1462], ['time', 240]],
    suleiman: [['bosses', 13], ['wins', 500]],
    ivan: [['wins', 60], ['hvy', 1552]],
    nobunaga: [['rng', 1575], ['bosses', 40]],
    akbar: [['back', 50], ['eras', 11]],
    elizabeth1: [['spkills', 1588], ['back', 300]],
    tokugawa: [['back', 60], ['flawless', 160]],
    gustavus: [['wins', 60], ['hvy', 800]],
    cromwell: [['wins', 60], ['cav', 1650]],
    peter: [['wins', 70], ['kills', 17090]],
    frederick: [['back', 50], ['flawless', 175]],
    catherine: [['back', 60], ['eras', 10]],
    washington: [['flawless', 40], ['kills', 17760]],
    robespierre: [['wins', 50], ['back', 179]],
    toussaint: [['inf', 1791], ['front', 180]],
    napoleon: [['bosses', 7], ['wins', 600]],
    nelson: [['rng', 1805], ['bosses', 27]],
    shaka: [['inf', 1500], ['front', 180]],
    bolivar: [['eras', 5], ['kills', 18190]],
    garibaldi: [['inf', 1000], ['front', 200]],
    lincoln: [['wins', 60], ['flawless', 186]],
    tubman: [['revived', 300], ['flawless', 300]],
    grant: [['wins', 60], ['hvy', 1863]],
    bismarck: [['back', 50], ['eras', 9]],
    victoria: [['time', 60], ['back', 300]],
    diaz: [['wins', 60], ['time', 300]],
    troosevelt: [['front', 40], ['cav', 2000]],
    wilhelm: [['hvy', 300], ['kills', 19140]],
    lenin: [['inf', 1917], ['eras', 10]],
    gandhi: [['flawless', 40], ['time', 240]],
    mussolini: [['inf', 1922], ['time', 240]],
    trujillo: [['back', 40], ['time', 300]],
    franco: [['wins', 60], ['bosses', 36]],
    hitler: [['hvy', 400], ['wins', 450]],
    churchill: [['back', 40], ['specials', 300]],
    tojo: [['wins', 60], ['kills', 19410]],
    fdr: [['back', 50], ['time', 240]],
    rommel: [['hvy', 500], ['back', 250]],
    stalin: [['inf', 2000], ['wins', 450]],
    patton: [['hvy', 400], ['front', 250]],
    eisenhower: [['back', 60], ['bosses', 44]],
    zhukov: [['hvy', 450], ['wins', 500]],
    macarthur: [['back', 50], ['eras', 10]],
    mao: [['inf', 2000], ['wins', 500]],
    kim_il_sung: [['wins', 50], ['time', 300]],
    tito: [['front', 30], ['kills', 20000]],
    ho_chi_minh: [['back', 50], ['hvy', 1954]],
    degaulle: [['flawless', 30], ['bosses', 40]],
    che: [['front', 30], ['kills', 19590]],
    castro: [['flawless', 30], ['time', 300]],
    jfk: [['back', 40], ['eras', 11]],
    khrushchev: [['taps', 300], ['wins', 450]],
    mlk: [['flawless', 30], ['flawless', 250]],
    amin: [['inf', 1500], ['time', 300]],
    pinochet: [['back', 40], ['time', 300]],
    polpot: [['wins', 50], ['time', 300]],
    thatcher: [['flawless', 30], ['front', 200]],
    reagan: [['back', 40], ['bosses', 40]],
    gaddafi: [['back', 40], ['time', 300]],
    gorbachev: [['flawless', 30], ['time', 240]],
    saddam: [['hvy', 500], ['time', 300]],
    mandela: [['flawless', 27], ['time', 270]],
    mobutu: [['back', 40], ['time', 300]],
    kim_jong_il: [['taps', 111], ['time', 300]],
    chavez: [['wins', 50], ['front', 200]],
    mugabe: [['wins', 50], ['time', 300]],
    obama: [['back', 44], ['flawless', 250]],
    elizabeth2: [['time', 70], ['wins', 700]],
    kirk: [['taps', 100], ['specials', 300]],
    trump: [['wins', 45], ['bosses', 47]],
    kim_jong_un: [['taps', 150], ['hvy', 800]],
    putin: [['back', 40], ['time', 300]],
    zelensky: [['flawless', 30], ['hvy', 2022]],
    exterminator: [['inf', 2029], ['flawless', 300]],
    robohitler: [['hvy', 500], ['time', 300]],
    synth: [['back', 50], ['specials', 300]],
    neonshogun: [['front', 40], ['inf', 4000]],
    alien: [['back', 51], ['spkills', 5100]],
    overmind: [['specials', 64], ['specials', 512]],
    admiral: [['back', 50], ['bosses', 45]],
    warlord: [['hvy', 800], ['wins', 500]],
    moonking: [['back', 50], ['time', 300]],
    empress: [['bosses', 10], ['eras', 14]],
    hive: [['inf', 3000], ['kills', 30000]],
    nibnub: [['bosses', 12], ['spkills', 9999]],
    archon: [['bosses', 15], ['spkills', 10000]],
    cosmickhan: [['cav', 800], ['wins', 600]],
    devil: [['kills', 666], ['kills', 6666]],
    santa: [['specials', 25], ['flawless', 365]],
    wraith: [['time', 60], ['eras', 14]],
    void: [['spkills', 5000], ['kills', 50000]],
    god: [['wins', 7], ['flawless', 777]],
  };
  // ---------------------------------------------------------------- hand-made characters
  // Characters the game's owner has drawn themselves (from their character bibles): their own sprite sheet and
  // portrait replace the generated look. Sheets face left; every cell stands on the ground line.
  // rows: move -> [row, frames, fps, loops]. special: which of the leader's specials has its own animation.
  CW.CUSTOM = {
    neanderthal: {
      sheet: 'img/leaders/neanderthal/sheet.png', portrait: 'img/leaders/neanderthal/portrait.png',
      cell: [112, 96], ground: 84, cx: 64, head: 21, special: 0,
      rows: { idle: [0, 4, 6, 1], walk: [1, 6, 10, 1], run: [2, 6, 12, 1], jump: [3, 4, 8, 0], hit: [4, 2, 8, 0], ko: [5, 4, 6, 0], attack: [6, 6, 12, 0], special: [7, 8, 12, 0] },
    },
    // Ka the Firekeeper (character bible, approved base design v1): Coal Hurl attack, Wildfire special
    firekeeper: {
      sheet: 'img/leaders/firekeeper/sheet.png', portrait: 'img/leaders/firekeeper/portrait.png',
      cell: [112, 96], ground: 85, cx: 63, head: 18, special: 0,
      rows: { idle: [0, 4, 6, 1], walk: [1, 6, 10, 1], run: [2, 6, 12, 1], jump: [3, 4, 8, 0], hit: [4, 2, 8, 0], ko: [5, 4, 6, 0], attack: [6, 6, 12, 0], special: [7, 8, 10, 0] },
    },
  };

  // specials with something of their own on the battlefield ('leader:special'), on top of what their kind does:
  // - fire: a strip of burning ground running ahead of the leader. len and half are field units (how far ahead it runs,
  //   how wide either side of the leader), t is seconds, pct and lead the share of health soldiers and leaders lose
  //   each second they touch it (times the special's power)
  // - bear: a spirit cave bear that bursts out of the leader and stampedes straight across the field along a lane
  //   (half wide either side), mauling everyone in its path once: pct / lead of their health (times the special's
  //   power), knocked back knock field units and stunned for stun seconds
  CW.LINGER = {
    'firekeeper:Wildfire': { kind: 'fire', t: 5, len: 60, half: 15, pct: 0.05, lead: 0.01 },
    'neanderthal:Cave Bear Ambush': { kind: 'bear', speed: 150, half: 16, pct: 0.15, lead: 0.03, knock: 14, stun: 1.5 },
  };

  // where each class leads best: fighters at the front, thinkers behind the army
  CW.FRONT_CLASSES = ['warrior', 'conqueror', 'revolutionary', 'defender'];

  // ---------------------------------------------------------------- doctrines (random army-management skills)
  // r: rarity 0 common, 1 rare, 2 epic ; max: stack limit
  const D = (id, name, r, max, d, fx) => ({ id, name, r, max, d, fx });
  CW.DOCTRINES = [
    D('conscription', 'Conscription', 2, 3, '+15% army capacity', { capPct: 0.15 }),
    D('drill', 'Drill Sergeants', 0, 5, 'Infantry +20% ATK and HP', { inf: 0.2 }),
    D('marksman', 'Marksman School', 0, 5, 'Ranged +20% ATK and HP', { rng: 0.2 }),
    D('armorworks', 'Armor Works', 0, 5, 'Heavy units +20% ATK and HP', { hvy: 0.2 }),
    D('supply', 'Supply Lines', 1, 3, 'Your army moves 15% faster and attacks 8% faster', { move: 0.15, spd: 0.08 }),
    D('hospitals', 'Field Hospitals', 0, 3, 'Your army has +20% health', { hp: 0.2 }),
    D('cavalry', 'Cavalry School', 0, 5, 'Cavalry +20% ATK and HP', { cav: 0.2 }),
    D('warchest', 'War Chest', 0, 5, '+20% gold from all sources', { gold: 0.2 }),
    D('plunder', 'Spoils of Conquest', 1, 3, 'Leader battles pay +75% gold', { bossGold: 0.75 }),
    D('veterans', 'Veteran Corps', 1, 3, 'Unit upgrades cost 10% less', { cost: 0.1 }),
    D('logistics', 'Logistics Corps', 0, 5, '+12% attack speed', { spd: 0.12 }),
    D('academy', 'Officer Academy', 1, 3, 'Your leaders on the field have +40% health', { heroHp: 0.4 }),
    D('combined', 'Combined Arms', 1, 3, '+15% ATK and HP while your army fields three or more roles', { combined: 0.15 }),
    D('pride', 'Era Pride', 1, 3, "+5% ATK for each unit type from your commander's era", { pride: 0.05 }),
    D('flanking', 'Flanking Maneuvers', 0, 4, '+7% critical chance', { crit: 0.07 }),
    D('ordnance', 'Heavy Ordnance', 1, 3, '+50% critical damage', { critDmg: 0.5 }),
    D('forts', 'Fortifications', 0, 4, 'Army takes 8% less damage', { def: 0.08 }),
    D('propaganda', 'Propaganda Ministry', 0, 4, 'Enemies deal 8% less damage', { enemyAtk: 0.08 }),
    D('mobilization', 'Total Mobilization', 2, 3, '+25% ATK and HP', { atk: 0.25, hp: 0.25 }),
    D('siege', 'Siege Engineers', 1, 4, '+30% damage to enemy leaders', { bossDmg: 0.3 }),
    D('radio', 'Command Radio', 1, 3, "Your commander's attributes are 20% stronger", { attrMain: 0.2 }),
    D('liaison', 'Liaison Officers', 1, 3, "Your partners' attributes are 30% stronger", { attrPartner: 0.3 }),
    D('dilation', 'Time Dilation', 1, 3, '+10s on the leader battle clock', { bossTime: 10 }),
    D('salvage', 'Chrono Salvage', 2, 3, '+1 Chrono Shard for every leader defeated', { shardDrop: 1 }),
    D('quarter', 'Quartermaster', 1, 3, '+50% offline earnings', { offline: 0.5 }),
    D('blitz', 'Blitz Doctrine', 1, 3, '+40% attack speed for the first 6 seconds of each battle', { blitz: 0.4 }),
    D('laststand', 'Last Stand', 1, 3, 'Squads under 35% HP deal +40% damage', { lastStand: 0.4 }),
    D('shock', 'Shock Troops', 1, 3, "Each soldier's first strike in a battle deals +150%", { firstStrike: 1.5 }),
    D('bonds', 'War Bonds', 0, 5, '+15% gold and +5% ATK', { gold: 0.15, atk: 0.05 }),
    D('recon', 'Recon Patrols', 0, 3, 'Enemies have 8% less HP', { enemyHp: 0.08 }),
    D('medics', 'Combat Medics', 1, 3, 'Your army heals 1% health every second', { regen: 0.01 }),
  ];
  CW.DOC = {};
  CW.DOCTRINES.forEach((d) => (CW.DOC[d.id] = d));
  CW.RARITY = ['Common', 'Rare', 'Epic'];
})(typeof window !== 'undefined' ? window : globalThis);
