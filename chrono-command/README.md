# Chrono Command

An 8-bit idle war game. History's commanders, conquerors, dictators and peacemakers are scattered across time.
Pick a commander, raise an army, and fight an endless campaign from the Stone Age to the far future, and beyond.

Open `index.html` in any browser to play. No build step, no installs, no server needed.

## How it plays

- **Idle battles.** Your army fights wave after wave by itself and keeps earning gold while you're away (up to 8 hours).
  Tap or click the battlefield to add commander strikes.
- **Leader battles.** Every third stage you face a famous leader (a giant boss with a timer whose attributes power the enemy army).
  Win and they join your roster. 87 in all: a Stone Age caveman, Alexander, Caesar, Genghis Khan, Napoleon, Hitler, Stalin,
  Mussolini, Mao, Pol Pot, Idi Amin, Pinochet, Kim Jong Il, Gandhi, Martin Luther King Jr., Mandela, Charlie Kirk,
  Donald Trump, a cyborg assassin, an alien overlord, the Devil and Santa Claus.
- **Commanders on the front line.** Your commander and two partners fight in the battle as full-body sprites next to
  their troops. If one falls, their attributes switch off until they get back up.
- **Leader attributes, not moves.** Every leader has three always-on attributes, each explained in plain words
  (for example Blitzkrieg: *every hit also strikes all other enemies for 20% damage, and +15% attack speed*).
  Your commander brings all three plus a class bonus (Conqueror, Tyrant, Strategist, Defender, Revolutionary,
  Statesman, Peacemaker, Warrior, Orator); each of your two partners brings one. Nothing to press: the only active
  action is tapping the battlefield to strike.
- **War Council.** After every leader battle you draw a **random doctrine** (30 army-management bonuses such as
  Conscription, Supply Lines, Combined Arms, Blitz Doctrine, Field Hospitals), then **mix and match your army** and
  reassign your commander and partners. Your formation is locked between councils.
- **30 unit types across 10 eras,** three per era (infantry, ranged, heavy), each with a trait: spearmen and chariots,
  legionaries and war elephants, knights, samurai, musketeers, cannons, landships, tanks, helicopters, drones,
  stealth bombers, power armor and battle mechs. New units arrive already trained to 40% of your best unit's level.
- **The time pathway.** Ten eras in order, from 10,000 BC to the Future, which ends with the Exterminator
  (a cyborg assassin), four machine "echoes" of history's most feared commanders, and the Alien Overlord.
- **Shattered Time.** Once the pathway is finished, time breaks: every era after that is picked at random, enemies hit
  harder and come in bigger waves, and every fourth leader battle is a **mystery boss** (the Devil, Santa Claus,
  the Time Wraith or the Void Emperor) whose identity stays hidden until the fight starts. It never ends.
  Beating a leader again earns stars (+10% attribute strength each).
- **Time Rift (prestige).** Once you reach stage 40, rift back to the start of time for Chrono Shards (+5% ATK, HP and gold
  each, forever). You keep your recruited leaders and their stars.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page layout and all styling |
| `js/data.js` | Eras, unit types, traits, leader classes, all 87 leaders (bios, portrait recipes, attributes, weapons) and the 30 doctrines |
| `js/engine.js` | Battle simulation, economy, progression, War Council, Time Rift and saving. No DOM code, so it runs in Node too |
| `js/art.js` | Procedural pixel art: unit sprites, era backdrops, the bitmap font, plus the Scale2x upscaler, edge lighting, outlines and image caches |
| `js/portraits.js` | 64x64 leader portraits and full-body battlefield sprites for every leader |
| `js/ui.js` | Battlefield rendering and animation, command deck, panels, dialogs, sound effects, autosave and offline progress |

Balance knobs live in `CW.CFG` at the top of `js/engine.js` (enemy growth, era power, costs, boss strength, rift reward).
They were tuned with a headless bot: the first Time Rift usually comes after about 2 hours, Shattered Time
opens after about 3 to 4 hours with rifts, and progress keeps moving deeper from there.

Saves are stored in the browser's `localStorage` on each device. Use **Options → Export save** to move a game between devices.

## Art and performance

Every leader is designed on a 32x32 grid, upscaled to 64x64 with Scale2x (a pixel-art upscaler that rounds off
stair-steps without blurring), then finished with edge lighting, cloth and hair texture, eye highlights and a thin outline.
Units, battlefield leaders and era backdrops get the same 2x treatment.

The battlefield is drawn on a fixed 768x432 pixel grid that the browser scales up, so the work per frame stays the same
on any screen size. Text and explosions are cached as images, the page is only touched when a value changes, drawing
pauses while the battlefield is scrolled out of view, and portraits are built in the background during idle time.
Movement is sub-pixel with eased lunges, march-ins, fades and health bars. Measured in Chromium with the CPU
throttled 4x and the frame-rate cap off, a busy late-game battle went from about 35 fps to over 200 fps
(95th-percentile frame time from 47 ms to about 8 ms).

## Publish it with GitHub Pages

Put these files at the root of a repository (or keep them in this folder), then in the repository's
**Settings → Pages**, deploy from the branch. The game will be at `https://<user>.github.io/<repo>/`
(add `chrono-command/` to the address if you keep the folder).

## A note on the historical figures

The real people in the game are historical and public figures shown as pixel caricatures in a work of fiction,
alongside mythical and invented characters. The Exterminator is an original cyborg, not a licensed movie character.
Inclusion is not endorsement. Several of these leaders were dictators responsible for wars of aggression, mass murder
and genocide, and their in-game bios say so plainly. Skills are named for military history (Blitzkrieg, Winter Offensive,
D-Day), never for atrocities.
