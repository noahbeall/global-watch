(() => {
  const DOM = {
    war: ['#ff6b5e', 'Conflict'], nuclear: ['#f6b93b', 'Nuclear'], cyber: ['#35d0e0', 'Cyber'], ai: ['#a78bfa', 'AI'],
    diplo: ['#6ea8ff', 'Diplomacy'], energy: ['#5fd38d', 'Energy'],
  };
  const VIEWS = { world: [[25, 20], 2], ukraine: [[49.5, 36], 5], gulf: [[28.5, 50], 5], redsea: [[17.5, 44], 5], levant: [[32.6, 35.6], 7], eastasia: [[30, 124], 4], europe: [[52, 14], 4], usa: [[39, -97], 4] };
  const S = { live: null, assessed: null, tab: 'headlines', hf: 'all', quakes: null, aircraft: null, marks: new Map(), adsbDirect: true };
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const link = (url, text) => { const ok = /^https?:\/\//.test(String(url)); const a = el(ok ? 'a' : 'span', '', text); if (ok) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; };
  const ago = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' hr ago' : Math.round(m / 1440) + ' d ago'; };
  const num = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const days = (iso) => Math.floor((Date.now() - Date.parse(iso + 'T00:00:00Z')) / 864e5);

  // ---------- map ----------
  const map = L.map('map', { preferCanvas: true, zoomControl: false, minZoom: 2, maxZoom: 12, zoomSnap: 0.5, maxBounds: [[-85, -200], [85, 200]], maxBoundsViscosity: 0.9 }).setView(VIEWS.world[0], VIEWS.world[1]);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  // Built-in basemap drawn from bundled country outlines, so the map needs no tile service or API key.
  map.createPane('base').style.zIndex = 210; map.createPane('labels').style.zIndex = 220; map.getPane('labels').style.pointerEvents = 'none';
  const base = L.layerGroup().addTo(map); const labels = L.layerGroup().addTo(map); let countries = [];
  const CITIES = [['Kyiv', 50.45, 30.52], ['Moscow', 55.75, 37.62], ['Kharkiv', 49.99, 36.23], ['Odesa', 46.48, 30.73], ['Sevastopol', 44.6, 33.5], ['Warsaw', 52.23, 21.01], ['Tehran', 35.69, 51.39], ['Baghdad', 33.31, 44.37], ['Riyadh', 24.71, 46.68], ['Dubai', 25.2, 55.27], ['Manama', 26.22, 50.58], ['Doha', 25.29, 51.53], ['Sanaa', 15.37, 44.19], ['Aden', 12.79, 45.02], ['Jerusalem', 31.78, 35.22], ['Gaza', 31.5, 34.47], ['Beirut', 33.89, 35.5], ['Damascus', 33.51, 36.29], ['Cairo', 30.04, 31.24], ['Ankara', 39.93, 32.86], ['Taipei', 25.03, 121.57], ['Beijing', 39.9, 116.4], ['Pyongyang', 39.03, 125.75], ['Seoul', 37.57, 126.98], ['Tokyo', 35.68, 139.69], ['Manila', 14.6, 120.98], ['Khartoum', 15.5, 32.56], ['Kabul', 34.53, 69.17], ['Islamabad', 33.69, 73.05], ['New Delhi', 28.61, 77.21], ['London', 51.51, -0.13], ['Paris', 48.86, 2.35], ['Berlin', 52.52, 13.4], ['Washington', 38.9, -77.04], ['Oklahoma City', 35.47, -97.52]];
  function drawLabels() {
    labels.clearLayers(); if (!map.hasLayer(base)) return;
    const z = map.getZoom(); const n = z < 3 ? 0 : z < 4 ? 22 : z < 5 ? 60 : z < 6 ? 120 : 999; const bounds = map.getBounds().pad(0.2);
    const put = (name, lat, lon, cls) => { if (!bounds.contains([lat, lon])) return; const d = document.createElement('span'); d.textContent = name; L.marker([lat, lon], { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'lab ' + cls, html: d, iconSize: [0, 0] }) }).addTo(labels); };
    countries.slice(0, n).forEach((c) => put(c.name, c.c[0], c.c[1], 'country'));
    if (z >= 5) CITIES.forEach((c) => put(c[0], c[1], c[2], 'city'));
  }
  map.on('zoomend moveend', drawLabels);
  fetch('data/world.json').then((r) => r.json()).then((w) => {
    countries = w;
    L.geoJSON({ type: 'FeatureCollection', features: w.map((c) => ({ type: 'Feature', properties: {}, geometry: c.g })) }, { pane: 'base', interactive: false, style: { color: '#55555a', weight: 0.8, fillColor: '#262628', fillOpacity: 1 } }).addTo(base);
    drawLabels();
  }).catch(() => {});
  const street = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 12 });
  map.attributionControl.addAttribution('Outlines: Natural Earth');
  const cluster = L.markerClusterGroup({
    maxClusterRadius: 38, showCoverageOnHover: false, spiderfyOnMaxZoom: true,
    iconCreateFunction: (c) => {
      const kids = c.getAllChildMarkers(); const tally = {};
      kids.forEach((k) => { tally[k.options.dom] = (tally[k.options.dom] || 0) + 1; });
      const top = Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
      const size = kids.length < 6 ? 28 : kids.length < 20 ? 34 : 42;
      return L.divIcon({ html: '<div class="cl" style="width:' + size + 'px;height:' + size + 'px;background:' + (DOM[top] || DOM.war)[0] + '">' + kids.length + '</div>', className: '', iconSize: [size, size] });
    },
  });
  const LAYERS = [
    { id: 'assessed', name: 'Key events', c: '#ffffff', group: L.layerGroup(), on: true },
    { id: 'headlines', name: 'Headlines', c: DOM.war[0], group: cluster, on: true },
    { id: 'aircraft', name: 'Military aircraft', c: '#cfe6ff', group: L.layerGroup(), on: true },
    { id: 'ransomware', name: 'Ransomware victims', c: DOM.cyber[0], group: L.layerGroup(), on: true },
    { id: 'quakes', name: 'Earthquakes', c: '#ffa94d', group: L.layerGroup(), on: false },
    { id: 'hazards', name: 'Fires, storms, volcanoes', c: '#5fd38d', group: L.layerGroup(), on: false },
  ];
  const layer = (id) => LAYERS.find((l) => l.id === id);
  LAYERS.forEach((l) => {
    if (l.on) l.group.addTo(map);
    const b = el('button'); b.type = 'button'; b.style.setProperty('--c', l.c); b.setAttribute('aria-pressed', String(l.on));
    b.append(el('i'), l.name + ' ', l.count = el('span', '', ''));
    b.addEventListener('click', () => { l.on = !l.on; b.setAttribute('aria-pressed', String(l.on)); if (l.on) l.group.addTo(map); else map.removeLayer(l.group); });
    $('layers').append(b);
  });
  $('theater').addEventListener('change', (e) => { const v = VIEWS[e.target.value]; if (v) map.flyTo(v[0], v[1], { duration: 1.1 }); });
  $('basemap').addEventListener('click', (e) => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', String(on));
    if (on) { street.addTo(map); map.removeLayer(base); } else { map.removeLayer(street); base.addTo(map); }
    drawLabels();
  });

  function pop(kind, color, title, lines, url, urlText) {
    const d = el('div', 'pop'); const k = el('div', 'kind'); const i = el('i'); i.style.setProperty('--c', color); k.append(i, kind);
    d.append(k, el('b', '', title)); lines.filter(Boolean).forEach((t) => d.append(el('p', '', t)));
    if (url) d.append(link(url, urlText || 'Open source'));
    return d;
  }
  function focus(key) {
    const m = S.marks.get(key); if (!m) return;
    const go = () => { map.flyTo(m.getLatLng(), Math.max(map.getZoom(), 6), { duration: 0.9 }); m.openPopup(); };
    if (cluster.hasLayer(m)) { if (!map.hasLayer(cluster)) return; cluster.zoomToShowLayer(m, () => m.openPopup()); } else go();
  }

  // ---------- draw: map layers ----------
  function drawAssessed() {
    const a = S.assessed; if (!a) return; const g = layer('assessed').group; g.clearLayers();
    const last = Math.max(...a.events.map((e) => Date.parse(e.date)));
    a.events.slice().sort((x, y) => x.severity - y.severity).forEach((e) => {
      const c = (DOM[e.domain] || DOM.war)[0];
      if (e.severity >= 5 && last - Date.parse(e.date) < 3 * 864e5) L.marker([e.lat, e.lon], { interactive: false, icon: L.divIcon({ className: '', html: '<div class="pulse" style="width:26px;height:26px;border-color:' + c + '"></div>', iconSize: [26, 26] }) }).addTo(g);
      const m = L.circleMarker([e.lat, e.lon], { radius: 4 + e.severity * 1.6, color: '#fff', weight: 1.5, fillColor: c, fillOpacity: 0.95 }).addTo(g);
      m.bindPopup(() => pop((DOM[e.domain] || DOM.war)[1] + ', ' + e.date + ', ' + e.status, c, e.title, [e.detail, e.place], e.url, e.source));
      S.marks.set('a:' + e.id, m);
    });
    layer('assessed').count.textContent = a.events.length;
  }
  function drawLive() {
    const v = S.live; if (!v) return;
    cluster.clearLayers();
    const hs = (v.headlines || []).filter((h) => typeof h.lat === 'number');
    hs.forEach((h, i) => {
      const c = (DOM[h.domain] || DOM.war)[0]; const j = (i % 7) * 0.9;
      const m = L.circleMarker([h.lat + 0.12 * Math.sin(j), h.lon + 0.16 * Math.cos(j)], { radius: 6, color: '#141414', weight: 1, fillColor: c, fillOpacity: 0.9, dom: h.domain });
      m.bindPopup(() => pop((DOM[h.domain] || DOM.war)[1] + ' headline, ' + ago(h.t), c, h.title, ['Placed at ' + h.place + ' from the headline text'], h.url, h.source || 'Read story'));
      cluster.addLayer(m); S.marks.set('h:' + h.id, m);
    });
    layer('headlines').count.textContent = hs.length;
    const rg = layer('ransomware').group; rg.clearLayers();
    const rc = (v.ransomware && v.ransomware.countries) || [];
    rc.forEach((r) => L.circleMarker([r.lat, r.lon], { radius: 5 + Math.sqrt(r.n) * 3, color: DOM.cyber[0], weight: 1.5, fillColor: DOM.cyber[0], fillOpacity: 0.25 }).bindPopup(() => pop('Ransomware victims, ' + r.country, DOM.cyber[0], r.n + ' recently posted', [r.names.join(', ')], 'https://www.ransomware.live', 'Ransomware.live')).addTo(rg));
    layer('ransomware').count.textContent = rc.reduce((s, r) => s + r.n, 0) || '';
    const hg = layer('hazards').group; hg.clearLayers();
    (v.hazards || []).forEach((h) => L.circleMarker([h.lat, h.lon], { radius: 5, color: '#5fd38d', weight: 1.5, fillColor: '#5fd38d', fillOpacity: 0.5 }).bindPopup(() => pop(h.kind + ', ' + ago(h.t), '#5fd38d', h.title, [], h.url, 'NASA EONET source')).addTo(hg));
    layer('hazards').count.textContent = (v.hazards || []).length || '';
    drawQuakes(); drawAircraft();
  }
  function drawQuakes() {
    const q = S.quakes || (S.live && S.live.quakes) || []; const g = layer('quakes').group; g.clearLayers();
    q.forEach((e) => L.circleMarker([e.lat, e.lon], { radius: 2 + (e.mag - 4) * 4, color: '#ffa94d', weight: 2, fillOpacity: 0.08, fillColor: '#ffa94d' }).bindPopup(() => pop('Earthquake, ' + ago(e.t), '#ffa94d', 'M' + e.mag.toFixed(1) + ' ' + e.place, ['Depth ' + Math.round(e.depth) + ' km' + (e.depth < 5 ? ', unusually shallow' : '')], e.url, 'USGS event page')).addTo(g));
    layer('quakes').count.textContent = q.length || '';
  }
  function drawAircraft() {
    const a = S.aircraft || (S.live && S.live.aircraft) || []; const g = layer('aircraft').group; g.clearLayers();
    a.forEach((p) => {
      const m = L.circleMarker([p.lat, p.lon], p.notable ? { radius: 5, color: '#fff', weight: 1.5, fillColor: '#cfe6ff', fillOpacity: 1 } : { radius: 2.5, stroke: false, fillColor: '#cfe6ff', fillOpacity: 0.65 }).addTo(g);
      m.bindPopup(() => pop('Military aircraft', '#cfe6ff', (p.call || p.reg || p.hex) + (p.type ? ' (' + p.type + ')' : ''), [typeof p.alt === 'number' ? num(p.alt) + ' ft' + (p.gs ? ', ' + Math.round(p.gs) + ' kt' : '') : 'On the ground', p.reg ? 'Registration ' + p.reg : ''], 'https://globe.adsbexchange.com/?icao=' + encodeURIComponent(p.hex), 'Track on ADS-B Exchange'));
      S.marks.set('p:' + p.hex, m);
    });
    layer('aircraft').count.textContent = a.length || '';
  }

  // ---------- draw: left rail ----------
  function drawLevels() {
    const a = S.assessed; if (!a) return;
    $('levels-sub').textContent = 'Analyst ratings from 1 to 5, set ' + new Date(a.asof + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    $('levels').replaceChildren(...a.levels.map((l) => {
      const d = el('details', 'lvl'); d.style.setProperty('--c', (DOM[l.domain] || DOM.war)[0]);
      const s = el('summary'); const meter = el('div', 'meter');
      for (let i = 0; i < 5; i++) meter.append(el('i', i < l.level ? 'on' : ''));
      s.append(el('span', 'name', (DOM[l.domain] || [0, l.domain])[1]), meter, el('b', '', l.level), el('span', 'tr ' + l.trend, l.trend === 'rising' ? '▲' : l.trend === 'easing' ? '▼' : '■'));
      s.title = 'Trend: ' + l.trend + '. Select for the reasoning.';
      d.append(s, el('p', '', l.basis)); return d;
    }));
  }
  function drawTempo() {
    const hs = (S.live && S.live.headlines) || []; const cut = Date.now() - 864e5; const n = {};
    hs.forEach((h) => { if (h.t > cut) n[h.domain] = (n[h.domain] || 0) + 1; });
    const max = Math.max(1, ...Object.values(n));
    $('tempo').replaceChildren(...['war', 'nuclear', 'cyber', 'ai'].map((k) => {
      const r = el('div', 'tempo-row'); r.style.setProperty('--c', DOM[k][0]);
      const t = el('div', 'track'); const f = el('div', 'fill'); f.style.width = ((n[k] || 0) / max) * 100 + '%'; t.append(f);
      r.append(el('span', '', DOM[k][1]), t, el('span', '', hs.length ? n[k] || 0 : '–')); return r;
    }));
  }
  function drawReadings() {
    const v = S.live || {}; const m = v.markets || {}; const rows = [];
    const add = (label, small, value, cls) => rows.push([label, small, value, cls]);
    const q = (k, d, pre = '') => (m[k] ? pre + num(m[k].value, d) : null);
    add('Brent crude', 'USD per barrel', q('brent', 2, '$'));
    add('Natural gas', 'USD per MMBtu', q('natgas', 2, '$'));
    add('Gold', 'USD per ounce', q('gold', 0, '$'));
    add('VIX', 'market fear gauge', q('vix', 1), m.vix && m.vix.value >= 30 ? 'hot' : '');
    add('Geomagnetic Kp', '5 or more is a storm', v.space ? num(v.space.kp, 1) : null, v.space && v.space.kp >= 5 ? 'hot' : '');
    const quakes = S.quakes || v.quakes;
    add('Earthquakes M4.5+', 'past 24 hours', quakes ? quakes.length : null);
    const ac = S.aircraft || v.aircraft;
    add('Military aircraft', 'broadcasting now', ac ? num(ac.length) : null);
    add('Exploited flaws added', 'CISA list, past 7 days', v.kev ? v.kev.week : null, v.kev && v.kev.week >= 8 ? 'hot' : '');
    add('Doomsday Clock', 'seconds to midnight, set Jan 2026', '85');
    add('Iran war', 'day, since Feb 28, 2026', num(days('2026-02-28') + 1));
    add('Ukraine war', 'day, since Feb 24, 2022', num(days('2022-02-24')));
    $('readings').replaceChildren(...rows.flatMap(([label, small, value, cls]) => {
      const dt = el('dt', '', label); dt.append(el('small', '', small));
      return [dt, el('dd', value == null ? 'na' : cls || '', value == null ? 'no data' : value)];
    }));
  }

  // ---------- draw: right rail ----------
  function item(color, key) { const d = el('article', 'item' + (key ? ' can' : '')); d.style.setProperty('--c', color); if (key) d.addEventListener('click', (e) => { if (!e.target.closest('a')) focus(key); }); return d; }
  function drawList() {
    const box = $('list'); const chips = $('hfilter'); const v = S.live || {};
    $('sources').hidden = S.tab !== 'sources'; box.hidden = S.tab === 'sources'; chips.replaceChildren();
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === S.tab)));
    if (S.tab === 'sources') return;
    const out = [];
    if (S.tab === 'headlines') {
      [['all', 'All', '#ececec'], ...['war', 'nuclear', 'cyber', 'ai'].map((k) => [k, DOM[k][1], DOM[k][0]])].forEach(([k, name, c]) => {
        const b = el('button', '', name); b.type = 'button'; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', String(S.hf === k));
        b.addEventListener('click', () => { S.hf = k; drawList(); }); chips.append(b);
      });
      const hs = (v.headlines || []).filter((h) => S.hf === 'all' || h.domain === S.hf);
      hs.slice(0, 120).forEach((h) => {
        const located = typeof h.lat === 'number'; const d = item((DOM[h.domain] || DOM.war)[0], located ? 'h:' + h.id : null);
        const t = el('h4'); t.append(link(h.url, h.title)); const meta = el('div', 'meta');
        meta.append(el('span', '', ago(h.t)), el('span', '', h.source || ''));
        if (located) meta.append(el('span', 'where', h.place));
        d.append(t, meta); out.push(d);
      });
      if (!hs.length) out.push(el('p', 'empty', v.generated ? 'No headlines in this category right now.' : 'Waiting for the first feed update. This page checks again every minute.'));
    } else if (S.tab === 'assessed') {
      const a = S.assessed;
      if (a) {
        out.push(el('p', 'note', 'Hand-checked events with sources, last reviewed ' + a.asof + '. Headlines update on their own; this list updates when it is re-researched.'));
        a.events.slice().sort((x, y) => (x.date < y.date ? 1 : x.date > y.date ? -1 : y.severity - x.severity)).forEach((e) => {
          const d = item((DOM[e.domain] || DOM.war)[0], 'a:' + e.id); const meta = el('div', 'meta');
          meta.append(el('span', '', e.date.slice(5).replace('-', '/')), el('span', 'tag ' + e.status, e.status), el('span', 'tag' + (e.severity >= 5 ? ' hot' : ''), 'severity ' + e.severity), el('span', 'where', e.place), link(e.url, e.source));
          d.append(el('h4', '', e.title), el('p', '', e.detail), meta); out.push(d);
        });
      }
    } else if (S.tab === 'cyber') {
      const k = v.kev; const r = v.ransomware;
      out.push(el('h3', '', 'Flaws under active attack'));
      if (k) k.items.forEach((x) => {
        const d = item(DOM.cyber[0]); const t = el('h4'); t.append(link('https://nvd.nist.gov/vuln/detail/' + encodeURIComponent(x.cve), x.vendor + ' ' + x.product));
        const meta = el('div', 'meta'); meta.append(el('span', '', x.cve), el('span', '', 'added ' + x.added)); if (x.ransomware) meta.append(el('span', 'tag hot', 'used by ransomware'));
        d.append(t, el('p', '', x.name), meta); out.push(d);
      }); else out.push(el('p', 'empty', 'The CISA list has not loaded yet.'));
      out.push(el('h3', '', 'Ransomware victims posted'));
      if (r && r.items.length) r.items.forEach((x) => {
        const d = item(DOM.war[0]); const meta = el('div', 'meta'); meta.append(el('span', '', ago(x.t)), el('span', '', 'group: ' + x.group)); if (x.country) meta.append(el('span', '', x.country)); if (x.sector) meta.append(el('span', '', x.sector));
        d.append(el('h4', '', x.victim), meta); out.push(d);
      }); else out.push(el('p', 'empty', 'No ransomware posts loaded yet.'));
    } else if (S.tab === 'air') {
      const a = S.aircraft || v.aircraft || []; const n = a.filter((p) => p.notable);
      out.push(el('p', 'note', num(a.length) + ' military aircraft are broadcasting a position. Listed here are tankers, bombers, surveillance and command aircraft, which tend to move before events do.'));
      n.sort((x, y) => (x.type < y.type ? -1 : 1)).forEach((p) => {
        const d = item('#cfe6ff', 'p:' + p.hex); const meta = el('div', 'meta');
        meta.append(el('span', '', typeof p.alt === 'number' ? num(p.alt) + ' ft' : 'on ground'), el('span', '', p.reg || p.hex), el('span', '', p.lat.toFixed(1) + ', ' + p.lon.toFixed(1)));
        d.append(el('h4', '', (p.type || 'Unknown type') + '  ' + (p.call || '')), meta); out.push(d);
      });
      if (!n.length) out.push(el('p', 'empty', a.length ? 'None of the tracked types are airborne and broadcasting.' : 'Aircraft positions have not loaded yet.'));
    }
    box.replaceChildren(...out); box.scrollTop = 0;
  }
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { S.tab = b.dataset.tab; drawList(); }));

  // ---------- status ----------
  const NAMES = { headlines: 'News headlines', aircraft: 'Military aircraft', quakes: 'Earthquakes', hazards: 'Natural hazards', kev: 'Exploited flaws', ransomware: 'Ransomware posts', space: 'Space weather', markets: 'Market quotes' };
  function drawStatus() {
    const v = S.live; const dot = $('status-dot'); const txt = $('status-text');
    if (!v || !v.generated) { dot.className = 'dot warn'; txt.textContent = 'Waiting for the first feed update'; return; }
    const st = v.status || {}; const bad = Object.keys(NAMES).filter((k) => st[k] && !st[k].ok); const age = (Date.now() - v.generated) / 60000;
    dot.className = 'dot ' + (age > 50 ? 'bad' : bad.length || age > 30 ? 'warn' : 'ok');
    txt.textContent = (age > 50 ? 'Feeds are stale, last updated ' : 'Feeds updated ') + ago(v.generated) + (bad.length ? ', ' + bad.length + ' not responding' : '');
    $('status-list').replaceChildren(...Object.keys(NAMES).map((k) => {
      const s = st[k] || {}; const li = el('li'); li.append(el('span', 'dot ' + (s.ok ? 'ok' : 'bad')), el('span', '', NAMES[k]), el('span', '', s.ok ? (k === 'quakes' && S.quakes ? 'live from USGS' : k === 'aircraft' && S.aircraft ? 'live from adsb.lol' : ago(s.at || v.generated)) : s.error ? 'failed: ' + s.error : 'no data yet')); return li;
    }));
  }
  function tick() { $('utc').textContent = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC'; }

  // ---------- loading ----------
  const getJson = (url) => fetch(url, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  async function loadLive() {
    try {
      const v = await getJson('data/live.json?t=' + Math.floor(Date.now() / 30000));
      if (!S.live || v.generated !== S.live.generated) { S.live = v; drawLive(); drawTempo(); drawList(); }
    } catch (e) { /* keep showing the last good copy */ }
    drawReadings(); drawStatus();
  }
  async function loadQuakes() {
    try {
      const g = await getJson('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson');
      S.quakes = g.features.map((f) => ({ id: f.id, t: f.properties.time, mag: f.properties.mag, place: f.properties.place, depth: f.geometry.coordinates[2], lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], url: f.properties.url }));
      drawQuakes(); drawReadings();
    } catch (e) { /* snapshot stays */ }
  }
  async function loadAircraft() {
    if (!S.adsbDirect) return;
    try {
      const g = await getJson('https://api.adsb.lol/v2/mil');
      const re = /^(E4|E6|RC135|R135|K35R|KC135|K46|KC46|KC10|B52|B1|B2|U2|RQ4|Q4|P8|E3|E8|C17|C5M|A332|MQ9|Q9|WC135)/i;
      S.aircraft = (g.ac || []).filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number').map((a) => ({ hex: a.hex, call: (a.flight || '').trim(), type: a.t || '', reg: a.r || '', alt: a.alt_baro, gs: a.gs, lat: a.lat, lon: a.lon, notable: re.test(a.t || '') }));
      drawAircraft(); drawReadings(); if (S.tab === 'air') drawList();
    } catch (e) { S.adsbDirect = false; }
  }
  getJson('data/assessed.json').then((a) => { S.assessed = a; drawAssessed(); drawLevels(); if (S.tab === 'assessed') drawList(); }).catch(() => { $('levels-sub').textContent = 'Ratings failed to load. Reload the page to try again.'; });
  tick(); setInterval(tick, 1000);
  drawTempo(); drawReadings(); drawList(); drawStatus();
  loadLive(); setInterval(loadLive, 60000);
  loadQuakes(); setInterval(loadQuakes, 120000);
  loadAircraft(); setInterval(loadAircraft, 45000);
  setInterval(drawStatus, 30000);
})();
