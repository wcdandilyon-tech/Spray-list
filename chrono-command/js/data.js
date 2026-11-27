/* Chrono Command — game data: eras, roles, units, traits, classes, leaders, doctrines. */
(function (G) {
  'use strict';
  const CW = (G.CW = G.CW || {});

  // ---------------------------------------------------------------- eras
  CW.ERAS = [
    { name: 'Bronze Age', span: [-3000, -480], roman: 'I' },
    { name: 'Classical', span: [-480, 450], roman: 'II' },
    { name: 'Medieval', span: [450, 1450], roman: 'III' },
    { name: 'Gunpowder', span: [1450, 1750], roman: 'IV' },
    { name: 'Revolution', span: [1750, 1860], roman: 'V' },
    { name: 'Industrial', span: [1860, 1918], roman: 'VI' },
    { name: 'World War', span: [1918, 1945], roman: 'VII' },
    { name: 'Cold War', span: [1945, 1991], roman: 'VIII' },
    { name: 'Modern', span: [1991, 2030], roman: 'IX' },
    { name: 'Future', span: [2030, 2400], roman: 'X' },
  ];

  // ---------------------------------------------------------------- roles
  // Base stats before era power, levels and bonuses.
  CW.ROLES = {
    inf: { name: 'Infantry', hp: 120, atk: 10, int: 1.0 },
    rng: { name: 'Ranged', hp: 70, atk: 13, int: 1.2 },
    hvy: { name: 'Heavy', hp: 230, atk: 30, int: 2.2 },
  };

  // ---------------------------------------------------------------- traits
  CW.TRAITS = {
    guard: 'Guard: +30% HP and enemies must attack it first',
    swift: 'Swift: attacks 35% faster',
    charge: 'Charge: first strike of every wave deals 4x damage',
    armor: 'Armor: takes 30% less damage',
    pierce: 'Pierce: every shot also hits a second enemy for 60%',
    splash: 'Splash: also hits every other enemy for 35%',
    rally: 'Rally: the whole army gets +6% ATK',
    crit: 'Deadeye: +25% critical chance',
    stun: 'Shock: 15% chance to stun the target for 1.2s',
    bossbane: 'Siegebreaker: +60% damage to enemy leaders',
    snipe: 'Snipe: picks off the weakest enemy for +30% damage',
    regen: 'Regen: heals 3% HP every second',
    drain: 'Drain: heals itself for 30% of damage dealt',
  };

  // ---------------------------------------------------------------- units
  // sprite: kind + palette keys used by art.js
  const U = (id, name, era, role, trait, sp) => ({ id, name, era, role, trait, sp });
  CW.UNITS = [
    U('spearman', 'Spearman', 0, 'inf', 'guard', { k: 'soldier', w: 'spear', helm: '#b8863b', body: '#c9a26b', legs: '#7a5a34' }),
    U('slinger', 'Slinger', 0, 'rng', 'swift', { k: 'soldier', w: 'sling', helm: '#6b4a2a', body: '#d8c49a', legs: '#7a5a34', cap: 1 }),
    U('chariot', 'War Chariot', 0, 'hvy', 'charge', { k: 'chariot', body: '#9a6a34', horse: '#6a4426' }),
    U('legionary', 'Legionary', 1, 'inf', 'armor', { k: 'soldier', w: 'sword', helm: '#c0c0c8', body: '#b3261e', legs: '#5a3a24', crest: '#b3261e', shield: '#b3261e' }),
    U('archer', 'Composite Archer', 1, 'rng', 'pierce', { k: 'soldier', w: 'bow', helm: '#7a5a34', body: '#4a6a8a', legs: '#5a3a24', cap: 1 }),
    U('elephant', 'War Elephant', 1, 'hvy', 'splash', { k: 'elephant', body: '#8a8a92', howdah: '#b3261e' }),
    U('manatarms', 'Man-at-Arms', 2, 'inf', 'rally', { k: 'soldier', w: 'sword', helm: '#9aa0a8', body: '#8a8f98', legs: '#5a5f68', shield: '#2a4a8a' }),
    U('longbow', 'Longbowman', 2, 'rng', 'crit', { k: 'soldier', w: 'bow', helm: '#3a5a2a', body: '#4a7a3a', legs: '#5a4a2a', cap: 1 }),
    U('knight', 'Mounted Knight', 2, 'hvy', 'charge', { k: 'rider', w: 'lance', helm: '#c0c4cc', body: '#c0c4cc', horse: '#e8e4dc', cloth: '#2a4a8a' }),
    U('samurai', 'Samurai', 3, 'inf', 'crit', { k: 'soldier', w: 'katana', helm: '#2a2a2a', body: '#8a1e1e', legs: '#3a2a2a', horn: '#e8c84a' }),
    U('musketeer', 'Musketeer', 3, 'rng', 'stun', { k: 'soldier', w: 'musket', helm: '#3a2a1a', body: '#2a4a8a', legs: '#c9b48a', hat: 'wide' }),
    U('cannon', 'Bronze Cannon', 3, 'hvy', 'bossbane', { k: 'cannon', body: '#c9973a', wheel: '#6a4426' }),
    U('grenadier', 'Grenadier', 4, 'inf', 'splash', { k: 'soldier', w: 'grenade', helm: '#2a2a2a', body: '#b3261e', legs: '#e8e4dc', hat: 'tall' }),
    U('rifleman', 'Rifleman', 4, 'rng', 'snipe', { k: 'soldier', w: 'rifle', helm: '#1a2a1a', body: '#2a5a3a', legs: '#2a3a2a', hat: 'tall' }),
    U('cuirassier', 'Cuirassier', 4, 'hvy', 'armor', { k: 'rider', w: 'saber', helm: '#d8d8e0', body: '#d8d8e0', horse: '#3a2a1a', cloth: '#2a3f7a' }),
    U('trench', 'Trench Infantry', 5, 'inf', 'guard', { k: 'soldier', w: 'rifle', helm: '#6a6a4a', body: '#7a7458', legs: '#5a5440', hat: 'brodie' }),
    U('mgunner', 'Machine Gunner', 5, 'rng', 'swift', { k: 'soldier', w: 'mg', helm: '#5a5a4a', body: '#6a6a5a', legs: '#4a4a3a', hat: 'brodie' }),
    U('landship', 'Landship Mk I', 5, 'hvy', 'armor', { k: 'landship', body: '#7a7458' }),
    U('gi', 'Rifle Squad', 6, 'inf', 'rally', { k: 'soldier', w: 'rifle', helm: '#4a5a2a', body: '#6a7a3a', legs: '#5a6a34', hat: 'round' }),
    U('sniper', 'Sniper', 6, 'rng', 'snipe', { k: 'soldier', w: 'longrifle', helm: '#3a4a2a', body: '#4a5a34', legs: '#3a4a2a', hat: 'round' }),
    U('mtank', 'Medium Tank', 6, 'hvy', 'splash', { k: 'tank', body: '#5a6a3a', long: 0 }),
    U('para', 'Paratrooper', 7, 'inf', 'charge', { k: 'soldier', w: 'smg', helm: '#7a1e2a', body: '#6a6a4a', legs: '#4a4a34', hat: 'beret' }),
    U('heli', 'Attack Helicopter', 7, 'rng', 'pierce', { k: 'heli', body: '#4a5a3a' }),
    U('mbt', 'Battle Tank', 7, 'hvy', 'bossbane', { k: 'tank', body: '#8a8460', long: 1 }),
    U('sf', 'Special Forces', 8, 'inf', 'crit', { k: 'soldier', w: 'smg', helm: '#2a2a2a', body: '#3a3a40', legs: '#2a2a30', hat: 'ops' }),
    U('drone', 'Combat Drone', 8, 'rng', 'swift', { k: 'drone', body: '#5a6070' }),
    U('bomber', 'Stealth Bomber', 8, 'hvy', 'splash', { k: 'bomber', body: '#2a2c34' }),
    U('powerarmor', 'Power Armor', 9, 'inf', 'regen', { k: 'soldier', w: 'laser', helm: '#c8ccd8', body: '#8a90a8', legs: '#5a6078', hat: 'visor' }),
    U('lancer', 'Plasma Lancer', 9, 'rng', 'bossbane', { k: 'soldier', w: 'plasma', helm: '#2a2a3a', body: '#3a2a5a', legs: '#2a2040', hat: 'visor' }),
    U('mech', 'Battle Mech', 9, 'hvy', 'drain', { k: 'mech', body: '#6a7088' }),
  ];
  CW.UNIT = {};
  CW.UNITS.forEach((u) => (CW.UNIT[u.id] = u));

  // ---------------------------------------------------------------- leader classes (commander passive)
  CW.CLASSES = {
    conqueror: { name: 'Conqueror', d: '+25% army ATK', fx: { atk: 0.25 } },
    tyrant: { name: 'Tyrant', d: '+15% ATK, enemies deal 12% less damage', fx: { atk: 0.15, enemyAtk: 0.12 } },
    strategist: { name: 'Strategist', d: 'Skills recharge 20% faster', fx: { cdr: 0.2 } },
    defender: { name: 'Defender', d: '+35% army HP', fx: { hp: 0.35 } },
    revolutionary: { name: 'Revolutionary', d: '+25% attack speed', fx: { spd: 0.25 } },
    statesman: { name: 'Statesman', d: '+35% gold', fx: { gold: 0.35 } },
    peacemaker: { name: 'Peacemaker', d: '+20% HP and 1% HP regen per second', fx: { hp: 0.2, regen: 0.01 } },
    warrior: { name: 'Warrior', d: '+15% critical chance', fx: { crit: 0.15 } },
    orator: { name: 'Orator', d: 'Skills +35% power', fx: { skill: 0.35 } },
  };

  // ---------------------------------------------------------------- portraits palette shortcuts
  const SK = { p: '#f6d9bd', l: '#f2c9a0', m: '#e2ad80', t: '#c98f60', o: '#a86e45', d: '#7a4a2c', x: '#55331d' };
  const HR = { blk: '#1d1714', dbr: '#3b2618', brn: '#6b4426', aub: '#8b3a1e', red: '#b5501f', bld: '#d9b45a', gry: '#9c9c9c', wht: '#e9e6df' };

  // ---------------------------------------------------------------- leaders
  // skills: [ult, s1, s2]; each = [name, cooldown, effects]
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
  L('chavez', 'Hugo Chavez', '1954–2013', 2002, 8, 'revolutionary', 'President of Venezuela',
    "Venezuelan president who led a socialist 'Bolivarian Revolution' paid for with the country's oil wealth.",
    { sk: SK.o, hr: HR.blk, hs: 'short', fh: 'none', hat: 'beret', hc: '#b3261e', ha: '#d9b45a', out: 'fatigues', oc: '#b3261e', ac: '#7a1a14', bg: '#2a2a4a' },
    ult('Bolivarian Revolution', [['buff', 'atk', 0.35, 10], ['buff', 'spd', 0.3, 10]]),
    sk('Oil Bonanza', [['gold', 25]], 24),
    sk('Alo Presidente', [['stun', 2.5]], 22));
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

  CW.LEADERS = LEADERS;
  CW.LEADER = {};
  LEADERS.forEach((l) => (CW.LEADER[l.id] = l));

  // Future era: echoes of the past rebuilt as war machines. Rotates every time loop.
  CW.ECHO_POOL = ['alexander', 'caesar', 'genghis', 'napoleon', 'hitler', 'stalin', 'hannibal', 'attila', 'timur', 'qin',
    'wilhelm', 'mao', 'nobunaga', 'saladin', 'patton', 'churchill', 'shaka', 'ramesses'];

  // ---------------------------------------------------------------- doctrines (random army-management skills)
  // r: rarity 0 common, 1 rare, 2 epic ; max: stack limit
  const D = (id, name, r, max, d, fx) => ({ id, name, r, max, d, fx });
  CW.DOCTRINES = [
    D('conscription', 'Conscription', 2, 2, '+1 army slot', { slots: 1 }),
    D('drill', 'Drill Sergeants', 0, 5, 'Infantry +20% ATK and HP', { inf: 0.2 }),
    D('marksman', 'Marksman School', 0, 5, 'Ranged +20% ATK and HP', { rng: 0.2 }),
    D('armorworks', 'Armor Works', 0, 5, 'Heavy units +20% ATK and HP', { hvy: 0.2 }),
    D('supply', 'Supply Lines', 1, 3, 'Army regenerates 1% HP every second', { regen: 0.01 }),
    D('hospitals', 'Field Hospitals', 0, 3, '+25% healing between waves', { waveHeal: 0.25 }),
    D('warchest', 'War Chest', 0, 5, '+20% gold from all sources', { gold: 0.2 }),
    D('plunder', 'Spoils of Conquest', 1, 3, 'Leader battles pay +75% gold', { bossGold: 0.75 }),
    D('veterans', 'Veteran Corps', 1, 3, 'Unit upgrades cost 10% less', { cost: 0.1 }),
    D('logistics', 'Logistics Corps', 0, 5, '+12% attack speed', { spd: 0.12 }),
    D('academy', 'Officer Academy', 1, 3, 'Commander skills recharge 10% faster', { cdr: 0.1 }),
    D('combined', 'Combined Arms', 1, 3, '+15% ATK and HP while you field all three roles', { combined: 0.15 }),
    D('pride', 'Era Pride', 1, 3, "+5% ATK for each squad from your commander's era", { pride: 0.05 }),
    D('flanking', 'Flanking Maneuvers', 0, 4, '+7% critical chance', { crit: 0.07 }),
    D('ordnance', 'Heavy Ordnance', 1, 3, '+50% critical damage', { critDmg: 0.5 }),
    D('forts', 'Fortifications', 0, 4, 'Army takes 8% less damage', { def: 0.08 }),
    D('propaganda', 'Propaganda Ministry', 0, 4, 'Enemies deal 8% less damage', { enemyAtk: 0.08 }),
    D('mobilization', 'Total Mobilization', 2, 3, '+25% ATK and HP', { atk: 0.25, hp: 0.25 }),
    D('siege', 'Siege Engineers', 1, 4, '+30% damage to enemy leaders', { bossDmg: 0.3 }),
    D('radio', 'Command Radio', 1, 3, 'Commander skills +25% power', { skill: 0.25 }),
    D('liaison', 'Liaison Officers', 1, 3, 'Partner skills recharge 15% faster', { pcdr: 0.15 }),
    D('dilation', 'Time Dilation', 1, 3, '+10s on the leader battle clock', { bossTime: 10 }),
    D('salvage', 'Chrono Salvage', 2, 3, '+1 Chrono Shard for every leader defeated', { shardDrop: 1 }),
    D('quarter', 'Quartermaster', 1, 3, '+50% offline earnings', { offline: 0.5 }),
    D('blitz', 'Blitz Doctrine', 1, 3, '+40% attack speed for the first 6s of each wave', { blitz: 0.4 }),
    D('laststand', 'Last Stand', 1, 3, 'Squads under 35% HP deal +40% damage', { lastStand: 0.4 }),
    D('shock', 'Shock Troops', 1, 3, "Each squad's first strike in a wave deals +150%", { firstStrike: 1.5 }),
    D('bonds', 'War Bonds', 0, 5, '+15% gold and +5% ATK', { gold: 0.15, atk: 0.05 }),
    D('recon', 'Recon Patrols', 0, 3, 'Enemies have 8% less HP', { enemyHp: 0.08 }),
    D('medics', 'Combat Medics', 1, 3, 'Fallen squads return with +25% more HP between waves', { reviveHp: 0.25 }),
  ];
  CW.DOC = {};
  CW.DOCTRINES.forEach((d) => (CW.DOC[d.id] = d));
  CW.RARITY = ['Common', 'Rare', 'Epic'];
})(typeof window !== 'undefined' ? window : globalThis);
