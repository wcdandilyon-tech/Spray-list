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
  and whose attributes power their army. Win and they join your roster. 134 in all, from a Stone Age caveman, Otzi,
  Gilgamesh and Hatshepsut to Alexander, Caesar, Nero, Ragnar, Kublai Khan, Mehmed II, Napoleon, Frederick the Great,
  Grant, Hitler, Stalin, Mussolini, Rommel, Zhukov, Mao, Khrushchev, Pol Pot, Idi Amin, Gandhi, Martin Luther King Jr.,
  Mandela, Obama, Putin, Kim Jong Un, Zelenskyy, Charlie Kirk and Donald Trump, plus original future rulers (a cyborg
  assassin, an android queen, a neon shogun, a space admiral, the Archon) and the Devil and Santa Claus.
- **Commanders on the front line.** Your commander and two partners fight in the battle as full-body sprites next to
  their troops. If one falls, their attributes switch off for the rest of that battle.
- **Leader attributes, not moves.** Every leader has three always-on attributes, each explained in plain words.
  Your commander brings all three plus a class bonus; each of your two partners brings one.
- **War Council.** After every leader battle you draw a **random doctrine** (31 army-management bonuses such as
  Conscription for more army capacity, Supply Lines, Combined Arms, Cavalry School, Field Hospitals) and can
  reassign your commander and partners.
- **The time pathway.** Fourteen eras in order: Stone Age, Bronze Age, Classical, Viking Age, Medieval, Gunpowder,
  Revolution, Industrial, World War, Cold War, Modern, Future, Space Age and Galactic Age.
- **Shattered Time.** Once the pathway is finished, time breaks: every era after that is picked at random, enemy armies
  are bigger and stronger, and every fourth leader battle is a **mystery boss** whose identity stays hidden until
  the fight starts. It never ends. Beating a leader again earns stars (+10% attribute strength each).
- **Time Rift (prestige).** Once you reach stage 40, rift back to the start of time for Chrono Shards (+5% damage,
  health and gold each, forever). You keep your recruited leaders and their stars.

Older saves carry over. From the previous version, the soldiers you had marching become soldiers you own. From the squad
version, your stage moves to the matching era and you get a full army of that era's units.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page layout and all styling |
| `js/data.js` | Eras, unit roles, 56 unit types, traits, the 19 unit attributes, leader classes, all 134 leaders and the 31 doctrines |
| `js/engine.js` | The battle simulator (movement, targeting, projectiles, splash, crowding), recruiting and army building, economy, progression, War Council, Time Rift and saving. No DOM code, so it runs in Node too |
| `js/art.js` | Procedural pixel art: unit sprites, era backdrops, the angled battlefield and its projection, the bitmap font, plus the Scale2x upscaler, edge lighting, outlines and image caches |
| `js/sprites.js` | The leader sprite generator: every leader drawn as a 64x64 chibi battle sprite, with signature props |
| `js/ui.js` | Battlefield rendering and its HUD overlay, the army builder, command deck, panels, dialogs, sound effects, autosave and offline progress |

Balance knobs live in `CW.CFG` at the top of `js/engine.js` (enemy growth, era power, army capacity, recruit and training
costs, boss strength, rift reward). They were tuned with a headless bot that plays the real simulation and spends its gold
on whichever soldier or upgrade adds the most strength. Even that bot starts losing battles within the first half hour,
hits walls every few eras where it has to save up and train, reaches its first Time Rift after about 2 to 2.5 hours,
and opens Shattered Time after about 10 to 11 hours.

Saves are stored in the browser's `localStorage` on each device. Use **Options → Export save** to move a game between devices.

## Art and performance

Every leader is a chibi battle sprite on a 64x64 grid: a big head and hair, large anime eyes with a glint, a 3/4 action pose
with an oversized weapon, light-to-shadow shading in four bands and dark outlines. The sprites are drawn pixel by pixel
from each leader's recipe (skin, hair, beard, hat, outfit, colours) plus signature props that make famous figures
recognisable: Napoleon's hand in his waistcoat, Churchill's cigar and V sign, Stalin's pipe, Mao's red book, Gandhi's
walking staff and round glasses, Lincoln's top hat and axe, Thatcher's handbag, Teddy Roosevelt's big stick, Leonidas's
lambda shield and spear, Elizabeth II's corgi, Santa's sack, the Devil's tail. The same sprite is used on the cards and on
the battlefield, where your commanders stand on coloured rings and the enemy leader fights at double size.
Units and era backdrops use Scale2x (a pixel-art upscaler) with edge lighting and outlines.

The battlefield is a tilted top-down view: soldiers further away are drawn smaller and higher up. Sprites are prepared
at a handful of fixed sizes so they grow in clean pixel steps as they move toward the camera instead of shimmering, and
fallen soldiers are painted once onto the ground layer instead of being redrawn every frame. Shadows are pre-made at each
size, and the HUD is a light page overlay rather than canvas text. The field is drawn on a fixed 768x432 pixel grid that the
browser scales up, so the work per frame stays the same on any screen size. In headless Chromium (software drawing, no GPU),
a late-game battle with about 350 soldiers on the field runs at about 390 fps, or about 50 to 75 fps with the CPU throttled 4x (depending on the era).

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
