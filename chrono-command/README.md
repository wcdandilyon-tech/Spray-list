# Chrono Command

An 8-bit idle war game. History's commanders, conquerors, dictators and peacemakers are scattered across time.
Pick a commander, raise an army, and fight an endless campaign from the Bronze Age to the far future.

Open `index.html` in any browser to play. No build step, no installs, no server needed.

## How it plays

- **Idle battles.** Your army fights wave after wave by itself and keeps earning gold while you're away (up to 8 hours).
  Tap or click the battlefield to add commander strikes.
- **Leader battles.** Every third stage you face a famous leader (a boss with a timer and their own signature skill).
  Win and they join your roster. 69 leaders in all, from Sargon of Akkad and Alexander to Napoleon, Hitler, Stalin,
  Mussolini, Gandhi, Martin Luther King Jr., Mandela and Charlie Kirk.
- **Your command team.** One commander with a **main skill**, **two skills** and a class passive (Conqueror, Tyrant,
  Strategist, Defender, Revolutionary, Statesman, Peacemaker, Warrior, Orator), plus **two partners** with one skill each.
  Skills cast automatically, or by hand with the buttons or keys 1–5.
- **War Council.** After every leader battle you draw a **random doctrine** (30 army-management skills such as
  Conscription, Supply Lines, Combined Arms, Blitz Doctrine, Field Hospitals), then **mix and match your army** and
  reassign your commander and partners. Your formation is locked between councils.
- **30 unit types across 10 eras,** three per era (infantry, ranged, heavy), each with a trait: spearmen and chariots,
  legionaries and war elephants, knights, samurai, musketeers, cannons, landships, tanks, helicopters, drones,
  stealth bombers, power armor and battle mechs. New units arrive already trained to 40% of your best unit's level.
- **Endless journey.** The tenth era is the Future, where you fight machine "echoes" of history's most feared commanders.
  Then time loops and everyone returns stronger. Beating a leader again earns stars (+15% skill power each).
- **Time Rift (prestige).** Once you reach stage 40, rift back to the Bronze Age for Chrono Shards (+5% ATK, HP and gold
  each, forever). You keep your recruited leaders and their stars.

## Files

| File | What's in it |
| --- | --- |
| `index.html` | Page layout and all styling |
| `js/data.js` | Eras, unit types, traits, leader classes, all 69 leaders (bios, portraits, skills) and the 30 doctrines |
| `js/engine.js` | Battle simulation, economy, progression, War Council, Time Rift and saving. No DOM code, so it runs in Node too |
| `js/art.js` | Procedural pixel art: 24x24 leader portraits, unit sprites, era backdrops, the bitmap damage font |
| `js/ui.js` | Battlefield rendering and animation, command deck, panels, dialogs, sound effects, autosave and offline progress |

Balance knobs live in `CW.CFG` at the top of `js/engine.js` (enemy growth, era power, costs, boss strength, rift reward).
They were tuned with a headless bot: a first trip through all ten eras takes roughly 8 to 12 hours of idling,
and Time Rifts keep progress moving after that.

Saves are stored in the browser's `localStorage` on each device. Use **Options → Export save** to move a game between devices.

## Publish it with GitHub Pages

Put these files at the root of a repository (or keep them in this folder), then in the repository's
**Settings → Pages**, deploy from the branch. The game will be at `https://<user>.github.io/<repo>/`
(add `chrono-command/` to the address if you keep the folder).

## A note on the historical figures

Everyone in the game is a real historical figure shown as a pixel caricature in a work of fiction.
Inclusion is not endorsement. Several of these leaders were dictators responsible for wars of aggression, mass murder
and genocide, and their in-game bios say so plainly. Skills are named for military history (Blitzkrieg, Winter Offensive,
D-Day), never for atrocities.
