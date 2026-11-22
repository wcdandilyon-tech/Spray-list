"""Build index.html (GitHub Pages version) from artifact/spray-log.html (claude.ai version).

The claude.ai page saves to the claude.ai account and can't use GPS.
This standalone build saves on the device, adds the GPS switch, shares the PDF
straight to Mail, and works offline.  Run:  python3 tools/build_standalone.py
"""
import pathlib, re
root = pathlib.Path(__file__).resolve().parent.parent
h = (root / 'artifact' / 'spray-log.html').read_text()

def R(old, new):
    global h
    assert h.count(old) == 1, ('not found once:', old[:100])
    h = h.replace(old, new)

def cut(start, end, new):
    """Replace from `start` up to (not including) `end`."""
    global h
    a = h.index(start); b = h.index(end, a)
    h = h[:a] + new + h[b:]

# ---- head
R('<title>Weed Spray Log</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n', '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#2f6b3a">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Spray Log">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="icon-192.png">
<title>Weed Spray Log</title>
''')
R('</style>\n', '''  header { padding-top: calc(14px + env(safe-area-inset-top, 0px)); }
  body { padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px)); }
  .switch { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; }
  .gps-status { font-size: .82rem; color: var(--muted); margin-top: 6px; }
</style>
</head>
<body>
''')
h = h.rstrip() + '\n</body>\n</html>\n'

# ---- GPS switch
R('''    <p class="hint">GPS isn't available on claude.ai. Type a location name; it remembers names you've used.</p>''',
'''    <div class="switch">
      <span>Use GPS location</span>
      <input type="checkbox" id="gpsToggle" aria-label="Use GPS location">
    </div>
    <div class="gps-status" id="gpsStatus">GPS is off. Only the location name will be saved.</div>''')

# ---- email section
cut('    <div class="btns" style="margin-top:10px">\n      <button type="button" class="primary" id="pdfBtn">', '  </section>', '''    <div class="btns" style="margin-top:10px">
      <button type="button" class="primary" id="emailBtn">Email PDF</button>
    </div>
    <div class="btns" style="margin-top:8px">
      <button type="button" id="pdfBtn">Download PDF</button>
    </div>
    <p class="hint">On a phone, “Email PDF” opens the share sheet with the PDF attached. Pick Mail or Gmail. On a computer it downloads the PDF and opens a new email; attach the downloaded file.</p>
''')

# ---- local libraries
R('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'lib/jspdf.umd.min.js')
R('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js', 'lib/jspdf.plugin.autotable.min.js')

# ---- storage: this device only
R("chemicals: [], otherUnits: {} };", "chemicals: [], otherUnits: {}, gps: false };")
cut('  async function connect() {', '  // ---------- Helpers', '''  async function connect() {
    const local = lsLoad();
    if (local) { entries = local.entries; settings = Object.assign(settings, local.settings || {}); }
    settings.units = Object.assign({ ...DEFAULT_UNITS }, settings.units);
    applySettings(); resetForm(); render();
    setSync('Saved on this device. Use Backup & restore now and then so you never lose it.');
  }

''')

# ---- files: plain browser download
cut('  async function offerFile(', "  $('pdfBtn')", '''  function offerFile(filename, data, okMsg) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (okMsg) toast(okMsg);
    return true;
  }
''')
R("'PDF saved. Now start an email and attach it.'", "'PDF downloaded'")
cut("  $('mailBtn').addEventListener", '  // ---------- Backup', '''  $('emailBtn').addEventListener('click', async () => {
    if (!window.jspdf) return toast('The PDF maker didn’t load. Reload the page.');
    const blob = buildPdf().output('blob');
    const name = `weed-spray-log-${selectedYear}.pdf`, subject = `Weed Spray Log ${selectedYear}`;
    const file = new File([blob], name, { type: 'application/pdf' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: subject, text: summaryText() }); return; }
      catch (err) { if (err.name === 'AbortError') return; }
    }
    offerFile(name, blob, 'PDF downloaded. Attach it to the email.');
    const to = encodeURIComponent($('email').value.trim());
    setTimeout(() => { location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(summaryText())}`; }, 400);
  });

''')

# ---- GPS logic
R('  // ---------- Form ----------', '''  // ---------- GPS ----------
  let currentGps = null;
  function setGpsOff() { currentGps = null; $('gpsStatus').textContent = 'GPS is off. Only the location name will be saved.'; }
  function getGps() {
    if (!('geolocation' in navigator)) { $('gpsStatus').textContent = 'GPS isn’t available on this device.'; return; }
    $('gpsStatus').textContent = 'Getting your location…';
    navigator.geolocation.getCurrentPosition(p => {
      if (!$('gpsToggle').checked) return;
      currentGps = { lat: +p.coords.latitude.toFixed(6), lon: +p.coords.longitude.toFixed(6), acc: Math.round(p.coords.accuracy) };
      $('gpsStatus').textContent = `📍 ${currentGps.lat}, ${currentGps.lon} (±${currentGps.acc} m)`;
    }, err => {
      currentGps = null;
      $('gpsStatus').textContent = err.code === 1
        ? 'Location permission was denied. Allow it in your browser settings, or turn GPS off.'
        : 'Couldn’t get your location. Turn the switch off and on to try again.';
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
  }
  $('gpsToggle').addEventListener('change', e => {
    settings.gps = e.target.checked; putSettings();
    if (e.target.checked) getGps(); else setGpsOff();
  });

  // ---------- Form ----------''')
R("    setNow(); $('formTitle').textContent = 'New spray';",
  "    $('gpsToggle').checked = !!settings.gps; if (settings.gps) getGps(); else setGpsOff();\n    setNow(); $('formTitle').textContent = 'New spray';")
R("place: $('place').value.trim(), notes:", "place: $('place').value.trim(), gps: $('gpsToggle').checked ? (currentGps || (entries.find(x => x.id === editingId) || {}).gps || null) : null, notes:")
R("      $('formTitle').textContent = 'Edit spray';",
  "      $('gpsToggle').checked = !!e.gps; currentGps = e.gps || null;\n      $('gpsStatus').textContent = e.gps ? `📍 ${e.gps.lat}, ${e.gps.lon} (saved)` : 'GPS is off. Only the location name will be saved.';\n      $('formTitle').textContent = 'Edit spray';")
R("<div class=\"meta\">${esc(e.place || 'No location')}</div>",
  "<div class=\"meta\">${esc(e.place || (e.gps ? 'GPS location' : 'No location'))}${e.gps ? ` · <a href=\"https://maps.google.com/?q=${e.gps.lat},${e.gps.lon}\" target=\"_blank\" rel=\"noopener\">map</a>` : ''}</div>")
R("e.place || '-', a(e, 'total')", "[e.place, e.gps ? `${e.gps.lat}, ${e.gps.lon}` : ''].filter(Boolean).join('\\n') || '-', a(e, 'total')")

# ---- start: no account connection, register offline cache
R("  resetForm();\n  connect();", """  resetForm();
  connect();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});""")

(root / 'index.html').write_text(h)
print('wrote index.html')
