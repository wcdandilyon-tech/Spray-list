# Weed Spray Log

A simple phone-friendly form for logging weed spraying (50% vinegar, salt, dish soap).

- **Date & time** fill in automatically (tap **Now** to refresh).
- **Location**: type a name (e.g. "Front driveway"). Turn the **GPS switch** on to also save coordinates, or leave it off.
- **Amounts**: vinegar, salt, dish soap and water, each with its own unit (gal, qt, cup, tbsp, L…).
  An optional **Other chemical** dropdown remembers any other product you use (pick "+ Add a new chemical…" the first time).
  **Total this spray adds itself up** from everything above. Save your usual recipe once with **Save as usual mix**.
- **Running total** at the top adds up the whole year as you go. Switch years in the header.
- **Email PDF** builds a PDF of the year (totals + every entry). On a phone it opens the share sheet with the PDF
  attached — pick Mail or Gmail. On a computer it downloads the PDF and opens an email for you to attach it to.
- Entries are saved on your device. Use **Backup & restore** to save a backup file now and then.
- Works with no signal once opened, and can be added to your home screen.

## Use it on your phone

Turn on GitHub Pages for this repo (Settings → Pages → deploy from branch, root folder), open the link on your phone,
then use "Add to Home Screen". GPS needs the page to be served over https, which GitHub Pages does.

## Two versions

- `index.html` – this standalone version (GPS, saved on the device, works offline).
- `artifact/spray-log.html` – the claude.ai version (saved to your claude.ai account, no GPS).

Make changes in `artifact/spray-log.html`, then run `python3 tools/build_standalone.py` to rebuild `index.html`.
