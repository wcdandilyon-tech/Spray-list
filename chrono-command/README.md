# Chrono Command

An idle war game and pixel-art battle simulator. History's commanders, conquerors, dictators and peacemakers are scattered across time.
Pick a commander, raise an army, and fight an endless campaign from the Stone Age to the far future, and beyond.

Open `index.html` in any browser to play. No build step, no installs, no server needed.

## How it plays

- **A battle simulator you watch from above.** Every stage is a real battle seen from a raised, angled camera:
  two armies of individual soldiers march in from opposite sides, pick targets, charge, shoot arrows, fire cannons
  and drop bombs. Fallen soldiers stay on the field until the battle ends. Tap or click anywhere on the field to call
  in a strike at that spot.
- **Buy your army with gold.** Soldiers are recruited with gold and stay yours until a Time Rift. Each unit type's price
  is set by its era, so a new era's units are expensive at first: the recruit button fills up as you save towards them.
  Each extra soldier of the same type costs 1% more. Gold also trains a unit type to higher levels.
- **Build your battle line.** Your army has a capacity (30 at the start, 10 more with every era you reach). Infantry and
  ranged soldiers take 1, cavalry 2 and heavy units 4. In the **Army** tab, choose how many of the soldiers you own march
  into battle (hold + or - to repeat) and mix eras freely. **Auto-build** sends your strongest soldiers instead.
- **Big battles.** Enemy armies grow through each era from 75% to 125% of your capacity, so late battles put 300 or more
  soldiers on the field at once.
- **Equip unit attributes.** Each unit type has attribute slots (a 2nd at level 10, a 3rd at level 30). Equip any of
  19 attributes you've unlocked, such as Sharpened, Shield Wall, Fire, Piercing, Blast, Lifesteal, Field Medic or
  Phase Shift, and every soldier of that type gets it. Each one says exactly what it does.
- **56 unit types across 14 eras,** four per era (infantry, ranged, cavalry, heavy), each with a built-in trait: club
  warriors and mammoth riders, chariots, legionaries and war elephants, Viking raiders and mangonels, knights and
  trebuchets, samurai and cannons, landships, tanks and fighter planes, attack helicopters, stealth bombers, power armor,
  battle mechs, space marines and titan mechs. New units arrive already trained close to your best unit's level.
- **Leader battles.** Every third stage you face a famous leader who fights as a giant on the field with a timer,
  and whose attributes power their army. Win and they join your roster. 137 in all, from a Stone Age caveman, Otzi,
  Gilgamesh and Hatshepsut to Alexander, Caesar, Nero, Ragnar, King Arthur, Kublai Khan, Mehmed II, Napoleon, Frederick the Great,
  Grant, Hitler, Stalin, Mussolini, Rommel, Zhukov, Mao, Khrushchev, Pol Pot, Idi Amin, Gandhi, Martin Luther King Jr.,
  Mandela, Obama, Putin, Kim Jong Un, Zelenskyy, Charlie Kirk and Donald Trump, plus original future rulers (a cyborg
  assassin, Robo Hitler, an android queen, a neon shogun, a space admiral, the Archon) and, once time shatters, the Devil, Santa Claus and God.
- **Commanders on the battlefield.** Your commander and two partners fight in the battle as full-body sprites. If one
  falls, their attributes switch off for the rest of that battle.
- **Front lines or behind the army.** Choose where each leader fights in the Team tab. Warriors, conquerors,
  revolutionaries and defenders excel at the front (+20% attribute strength and +50% damage there); strategists, tyrants,
  statesmen, peacemakers and orators excel commanding from behind (+20% attribute strength and a 30% faster special meter,
  out of the fighting). Each leader starts where they excel.
- **Special meters and special moves.** Each of your three leaders has a meter that fills when your army defeats an
  enemy, by that unit's share of the enemy army: a heavy unit (4 capacity) is worth four infantry, so beating weak units
  fills it slowly. The commander charges at the full rate, partners at 80%, and meters carry over between battles.
  Every leader has **three specials of their own** (411 in all) and equips one at a time; its kind sets the meter it
  needs, from 70% (stuns, tributes) to 100% (barrages, charges, infernos, executions). There are 15 kinds, from barrages,
  charges and snipes on the enemy leader to rallies, fortify, mass heals, revives, stuns, terror, infernos, war tributes,
  reinforcements, executions, life drain and shields. Tap a leader's chip to fire it or swap to another unlocked one.
  Auto specials fires a charged special after 4 seconds. Enemy leaders have a meter too; once time shatters they may use
  any of their three.
- **Leader prestige (after the main story).** Leaders start with only their first special. Prestige opens once the main
  story is over, when you finish the time pathway through the Galactic Age (right where a Time Rift would come next), and it
  stays open in every later run. From then on each leader has two prestige goals of their own, counted while they command,
  partner or fight in the ranks: the Devil prestiges after 666 and then 6,666 defeated enemies,
  Leonidas after 300 infantry and then 300 wins at the front, Sargon after his 34 victories, Napoleon after beating 7
  enemy leaders, God after 7 wins and then 777 flawless ones. Prestiging unlocks and equips the next special and adds +25%
  strength on the field and +20% attribute strength. Prestige is kept through Time Rifts.
- **Leader attributes.** Every leader also has three always-on attributes, each explained in plain words.
  Your commander brings all three plus a class bonus; each of your two partners brings one. The full list of leaders with
  every attribute and special is in [LEADERS.md](LEADERS.md).
- **War Council.** After every leader battle you draw a **random doctrine** (31 army-management bonuses such as
  Conscription for more army capacity, Supply Lines, Combined Arms, Cavalry School, Field Hospitals) and can
  reassign your commander and partners.
- **The time pathway.** Fourteen eras in order: Stone Age, Bronze Age, Classical, Viking Age, Medieval, Gunpowder,
  Revolution, Industrial, World War, Cold War, Modern, Future, Space Age and Galactic Age.
- **Shattered Time.** Once the pathway is finished, time breaks: every era after that is picked at random, enemy armies
  are bigger and stronger, and every fourth leader battle is a **mystery boss** whose identity stays hidden until
  the fight starts. It never ends. Beating a leader again earns stars (+10% attribute strength each).
- **Leaders in the ranks (post-endgame).** Once time shatters, the Army tab lets you swap soldiers for recruited leaders who
  aren't commanding, so every army can be built differently. Each leader takes 6 capacity and fights in the front rank with a
  bodyguard (half damage taken), cleaving the enemies around their target, and gives your whole army a share of their
  signature attribute while standing. Fighters (warriors, conquerors, revolutionaries, defenders) hit harder and last longer
  and share 35%; thinkers fight less well but share 55%. You start with 3 slots and gain one every 18 stages of Shattered Time,
  up to 8, and leaders can use at most half your capacity (the rest wait in reserve after a Time Rift until capacity grows).
- **Time Rift (prestige).** Once you reach stage 40, rift back to the start of time for Chrono Shards (+5% damage,
  health and gold each, forever). You keep your recruited leaders and their stars.

Older saves carry over. From the previous version, the soldiers you had marching become soldiers you own. From the squad
version, your stage moves to the matching era and you get a full army of that era's units.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page layout and all styling |
| `js/data.js` | Eras, unit roles, 56 unit types, traits, the 19 unit attributes, leader classes, all 137 leaders, their three specials each, their prestige goals and the 31 doctrines |
| `img/nibnub.png` | Nib Nub, the guide (artwork supplied by the game's owner) |
| `LEADERS.md` | Every leader with their class, best position, attributes, three special moves, prestige goals and what they bring in the ranks |
| `js/engine.js` | The battle simulator (movement, targeting, projectiles, splash, crowding), special meters and specials, leader prestige and its stats, leader positions, leaders in the ranks, recruiting and army building, economy, progression, War Council, Time Rift and saving. No DOM code, so it runs in Node too |
| `js/art.js` | Procedural pixel art: unit sprites, era backdrops, the angled battlefield and its projection, the full-screen era scene around it, the bitmap font, plus the Scale2x upscaler, edge lighting, outlines and image caches |
| `js/bodies.js` | The animated base figure (embedded sheet), body-part detection, the dressing of every leader and foot soldier, and the vehicles, animals and riders |
| `js/ui.js` | Battlefield rendering and its HUD overlay, the army builder, command deck, panels, dialogs, sound effects, autosave and offline progress |

Balance knobs live in `CW.CFG` at the top of `js/engine.js` (enemy growth, era power, army capacity, recruit and training
costs, boss strength, rift reward). They were tuned with a headless bot that plays the real simulation and spends its gold
on whichever soldier or upgrade adds the most strength. Even that bot starts losing battles within the first half hour,
hits walls every few eras where it has to save up and train, reaches its first Time Rift after about 2 to 2.5 hours,
and opens Shattered Time after about 10 to 11 hours.

**Nib Nub, your guide.** Nib Nub is a small alien from very far away who does his best to teach you the game as you go.
His lessons are little conversations in plain words (written so a kid can follow them), and each one plays once, the first
time something new matters: how to strike, what gold is for, room in your army, leader battles, losing, the War Council, special moves, front
or back, soldier skills, new eras, the Codex, Time Rifts, the end of the story, prestige and leaders in the ranks. His words
type out as he talks, the button or bar he means glows, and **Show me** opens the right menu. A lesson counts as heard the
moment he starts it, so he never repeats himself, and everything he has taught you is kept in **Nib Nub's Guide** (his face
in the top corner). Between lessons he chats during battles in little bubbles: when a leader joins you or earns a star, at
the start of leader battles and mystery fights, in each new era (with a joke for every era), after big specials on either
side, after a loss, on a prestige or a Time Rift, and now and then with a friendly hint. Each set of lines is used in turn,
so he doesn't say the same thing twice in a row. Lessons and chatter can each be turned off, or his lessons started again,
in Settings; saves from before the guide skip the basics.

The **Codex** only shows the leaders you have found so far, with a count of how many are still hidden in each era you have
reached. Later eras and the mystery leaders stay secret until you get there.

The battlefield fills the whole screen on every device. A slim bar on top shows the era, stage and resources; the dock at
the bottom holds your leaders (tap one for their special), the next-leader tracker and a six-button bar: **Army**, **Team**
(commanders, positions, specials and prestige), **Codex** (the leaders you have found, searchable, with their attributes,
specials and prestige goals), **Doctrines**, **Rift** and **Settings** (auto-advance, auto specials, sound, saves). Held upright, the
battle zooms in a little and the era's scene carries on above and below it; turned sideways, the console shrinks to one
slim row along the bottom and the menus open as a side drawer.

Saves are stored in the browser's `localStorage` on each device. Use **Settings → Export save** to move a game between devices.

## Art and performance

Every leader and every foot soldier is built from one animated base figure (`js/bodies.js`, a sheet of frames facing
right: idle, cheer, thrust, walk, throw, shoot and swing). Each frame is split into body parts (head, neck, torso,
arms, hands, legs, feet) and recoloured along its own shading ramp, so clothes keep the original pixel shading. Hair,
hats, beards, glasses, capes, shields and weapons are drawn on top, placed from the head and hands found in that frame,
so they move with the animation. Leaders are dressed from their recipe plus signature props that make famous figures
recognisable: Napoleon's bicorne and sash, Churchill's cigar, Stalin's pipe, Mao's red book, Gandhi's walking staff and
round glasses, Lincoln's top hat and axe, Thatcher's handbag, Teddy Roosevelt's big stick, Leonidas's lambda shield and
spear, Santa's sack, the Devil's tail. Soldiers wear their era's helmet or hat, their unit colours and a team-coloured
scarf (blue for you, red for the enemy). Soldiers walk, strike, shoot or throw and cheer when they win; commanders stand
on coloured rings and the enemy leader fights at double size. Vehicles, animals and riders are drawn in the same style
(banded shading, soft outlines, team-coloured trim): wolves, mammoths and war elephants with their riders, chariots,
horsemen carrying the era's rider, siege engines, cannons, landships, tanks, planes, helicopters, drones, hoverbikes and
mechs. Each has moving frames (legs, wheels, tracks or rotors) and a firing frame, and leaves a wreck where it falls.

The battlefield is a tilted top-down view: soldiers further away are drawn smaller and higher up. Sprites are prepared
at a handful of fixed sizes so they grow in clean pixel steps as they move toward the camera instead of shimmering, and
fallen soldiers are painted once onto the ground layer instead of being redrawn every frame. Shadows are pre-made at each
size, and the HUD is a light page overlay rather than canvas text. The field is drawn on a 768x432 pixel grid; the canvas takes
the shape of the screen at that scale, and the era scene is carried on around the field (`CW.scene` in `js/art.js`): the sky
climbs above the backdrop, its scenery repeats mirrored to the sides and the ground keeps coming towards the camera with
bigger props up close, all with a colour lift and gently darkened edges. A light ambient layer animates each era (clouds and
birds by day, twinkles and shooting stars at night, snow, embers, fireflies, desert dust, neon rain or crystal motes), faint
over the battle and fuller around it. In headless Chromium (software drawing, no GPU), a late-game battle with about 350
animated soldiers and vehicles runs at about 65 fps on a laptop-shaped screen and about 50 fps on an upright phone screen
with the CPU throttled 4x.

The menus around the battlefield use a quiet, modern style (Manrope, graphite panels, one brass accent); the pixel art
stays on the battlefield and the portraits.

## Publish it with GitHub Pages

Put these files at the root of a repository (or keep them in this folder), then in the repository's
**Settings → Pages**, deploy from the branch. The game will be at `https://<user>.github.io/<repo>/`
(add `chrono-command/` to the address if you keep the folder).

## A note on the historical figures

The real people in the game are historical and public figures shown as pixel caricatures in a work of fiction,
alongside mythical and invented characters. The Exterminator is an original cyborg, not a licensed movie character.
Inclusion is not endorsement. Several of these leaders were dictators responsible for wars of aggression, mass murder
and genocide, and their in-game bios say so plainly. Attributes are named for military history (Blitzkrieg, Winter Offensive,
D-Day), never for atrocities.
