(() => {
  const DOM = {
    war: ['#ff6b5e', 'Conflict'], nuclear: ['#f6b93b', 'Nuclear'], cyber: ['#35d0e0', 'Cyber'], ai: ['#a78bfa', 'AI'],
    diplo: ['#6ea8ff', 'Diplomacy'], energy: ['#5fd38d', 'Energy'],
  };
  const VIEWS = { world: [[25, 20], 2], ukraine: [[49.5, 36], 5], gulf: [[28.5, 50], 5], redsea: [[17.5, 44], 5], levant: [[32.6, 35.6], 7], eastasia: [[30, 124], 4], europe: [[52, 14], 4], usa: [[39, -97], 4] };
  const S = { live: null, assessed: null, tab: 'start', hf: 'all', quakes: null, aircraft: null, marks: new Map(), adsbDirect: false };
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const link = (url, text) => { const ok = /^https?:\/\//.test(String(url)); const a = el(ok ? 'a' : 'span', '', text); if (ok) { a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; } return a; };
  const ago = (t) => { const m = Math.max(0, Math.round((Date.now() - t) / 60000)); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : m < 1440 ? Math.round(m / 60) + ' hr ago' : Math.round(m / 1440) + ' d ago'; };
  const num = (v, d = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const days = (iso) => Math.floor((Date.now() - Date.parse(iso + 'T00:00:00Z')) / 864e5);
  const Q = new URLSearchParams(location.search);
  const store = { get(k, d) { try { const v = localStorage.getItem('wf.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem('wf.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } } };
  {
    const t0 = Date.now(); const lastSeen = store.get('lastSeen', 0); let since = store.get('since', 0);
    if (lastSeen && t0 - lastSeen > 30 * 60000) { since = lastSeen; store.set('since', since); store.set('seenEv', store.get('seenEvLatest', null)); }
    S.since = since || 0; S.seenEv = store.get('seenEv', null); S.states = store.get('states', null); S.of = 'all';
    const touch = () => store.set('lastSeen', Date.now()); touch(); setInterval(touch, 60000); addEventListener('visibilitychange', touch);
  }
  const isNew = (t) => S.since > 0 && t > S.since;
  const newEvent = (id) => Array.isArray(S.seenEv) && !S.seenEv.includes(id);
  const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const flash = (btn, text) => { const old = btn.textContent; btn.textContent = text; setTimeout(() => { btn.textContent = old; }, 1800); };
  async function share(params, btn) {
    const u = new URL(location.href); u.search = ''; u.hash = ''; Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); const url = u.toString();
    try {
      if (navigator.share && matchMedia('(max-width: 1100px)').matches) { await navigator.share({ title: 'Watchfloor', url }); return; }
      await navigator.clipboard.writeText(url); flash(btn, 'Link copied');
    } catch (e) { if (!e || e.name !== 'AbortError') flash(btn, 'Could not copy'); }
  }
  const shareBtn = (params) => { const b = el('button', 'share', 'Share'); b.type = 'button'; b.addEventListener('click', (e) => { e.stopPropagation(); share(params, b); }); return b; };
  const GL = {};
  const addTerms = (pairs) => pairs.forEach(([k, v]) => { GL[k.toLowerCase()] = v; });
  addTerms([
    ['IRGC', "Iran's Revolutionary Guard, the most powerful branch of its military."], ['IAEA', "The UN's nuclear inspectors. They check that countries are not secretly building bombs."],
    ['Houthis', 'An armed group that controls much of Yemen and is backed by Iran.'], ['Houthi', 'An armed group that controls much of Yemen and is backed by Iran.'],
    ['Hezbollah', 'An armed group and political party in Lebanon, backed by Iran.'], ['Hamas', 'The armed group that has governed Gaza.'],
    ['Strait of Hormuz', 'The narrow sea channel next to Iran that Gulf oil tankers must pass through.'], ['Hormuz', 'The narrow sea channel next to Iran that Gulf oil tankers must pass through.'],
    ['Kerch Bridge', 'The road and rail bridge linking Russia to occupied Crimea, a key Russian supply route.'], ['Crimea', 'A peninsula of Ukraine that Russia seized in 2014.'],
    ['NATO', 'The military alliance of the US, Canada and most of Europe. An attack on one member is treated as an attack on all.'], ['CENTCOM', 'The US military command responsible for the Middle East.'],
    ['ISW', 'The Institute for the Study of War, a US think tank that publishes daily front-line assessments.'], ['DTEK', "Ukraine's largest private power company."],
    ['Kp index', "A 0 to 9 scale of disturbance in Earth's magnetic field. 5 and up is a storm; 7 and up can stress power grids."], ['geomagnetic', "Relating to disturbances in Earth's magnetic field caused by the Sun."],
    ['KEV', 'Known Exploited Vulnerabilities: the US government list of software flaws that attackers are actively using.'], ['CISA', 'The US Cybersecurity and Infrastructure Security Agency.'],
    ['ransomware', "Malicious software that locks an organization's files until it pays."], ['zero-day', 'A software flaw attackers use before the maker has a fix.'],
    ['supply-chain', 'An attack that compromises one supplier in order to reach all of its customers.'], ['enriched', 'Uranium processed to raise the share that can sustain a chain reaction. Low levels fuel reactors; high levels can make a bomb.'],
    ['ICBM', 'Intercontinental ballistic missile: a long-range missile that can carry a nuclear warhead between continents.'], ['Brent', 'The main international benchmark price for crude oil.'],
    ['VIX', 'A measure of how much swing stock traders expect. Higher means more fear.'], ['PLA', "China's military, the People's Liberation Army."], ['DPRK', "North Korea's official name."],
    ['RSF', 'The Rapid Support Forces, a paramilitary army fighting Sudan\'s military.'], ['APEC', 'A yearly summit of Pacific-rim economies, including the US and China.'], ['UNIFIL', 'The UN peacekeeping force in southern Lebanon.'],
    ['Entity List', 'A US government blacklist of foreign organizations that American firms need a license to sell to.'], ['Polymarket', 'A website where people bet real money on future events. Prices work as crowd odds.'],
    ['E-6B', 'A US Navy aircraft that can relay launch orders to nuclear submarines and missiles.'], ['E-4B', "The US 'doomsday plane', an airborne command post for the president and defense secretary."],
    ['frontier AI', 'The most capable AI systems being built at any given time.'], ['Doomsday Clock', 'A yearly symbolic rating by scientists of how close the world is to catastrophe.'],
  ]);
  let glRe = null; const buildRe = () => { glRe = new RegExp('\\b(' + Object.keys(GL).sort((x, y) => y.length - x.length).map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'gi'); }; buildRe();
  function gloss(text) {
    const frag = document.createDocumentFragment(); const seen = new Set(); let last = 0; text = String(text == null ? '' : text); let m; glRe.lastIndex = 0;
    while ((m = glRe.exec(text))) { const key = m[0].toLowerCase(); if (seen.has(GL[key])) continue; seen.add(GL[key]); frag.append(text.slice(last, m.index)); const b = el('button', 'term', m[0]); b.type = 'button'; b.dataset.def = GL[key]; frag.append(b); last = m.index + m[0].length; }
    frag.append(text.slice(last)); return frag;
  }
  const defpop = el('div', 'defpop'); defpop.hidden = true; document.body.append(defpop);
  document.addEventListener('click', (e) => {
    const t = e.target.closest && e.target.closest('.term');
    if (!t) { defpop.hidden = true; return; }
    e.stopPropagation(); e.preventDefault(); defpop.replaceChildren(el('b', '', t.textContent), el('span', '', t.dataset.def)); defpop.hidden = false;
    const r = t.getBoundingClientRect(); const w = Math.min(300, innerWidth - 16); defpop.style.width = w + 'px'; defpop.style.left = Math.max(8, Math.min(r.left, innerWidth - w - 8)) + 'px';
    const below = r.bottom + 8 + defpop.offsetHeight < innerHeight; defpop.style.top = (below ? r.bottom + 6 : Math.max(8, r.top - defpop.offsetHeight - 6)) + 'px';
  }, true);
  addEventListener('scroll', () => { defpop.hidden = true; }, true);
  { const want = Q.get('e') ? 'assessed' : Q.get('tab'); if (['start', 'overview', 'headlines', 'assessed', 'cyber', 'air', 'odds', 'home', 'readiness', 'sources'].includes(want)) S.tab = want; }

  // ---------- map ----------
  const map = L.map('map', { preferCanvas: true, zoomControl: false, minZoom: 2, maxZoom: 12, zoomSnap: 0.5, maxBounds: [[-85, -200], [85, 200]], maxBoundsViscosity: 0.9 }).setView(VIEWS.world[0], VIEWS.world[1]);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  const startView = VIEWS[Q.get('view')]; if (startView) { map.setView(startView[0], startView[1]); document.getElementById('theater').value = Q.get('view'); }
  { const ll = (Q.get('ll') || '').split(',').map(Number); if (ll.length === 3 && ll.every(Number.isFinite)) map.setView([ll[0], ll[1]], ll[2]); }
  // Built-in basemap drawn from bundled country outlines, so the map needs no tile service or API key.
  map.createPane('base').style.zIndex = 210; map.createPane('labels').style.zIndex = 220; map.getPane('labels').style.pointerEvents = 'none';
  const base = L.layerGroup().addTo(map); const labels = L.layerGroup().addTo(map); let countries = [];
  let cities = []; let regions = []; let admin = null; let adminAsked = false; let citiesAsked = false;
  function needDetail() {
    const z = map.getZoom();
    if (z >= 4 && !adminAsked) {
      adminAsked = true;
      fetch('data/admin1.json?v=1').then((r) => r.json()).then((d) => {
        regions = d.filter((x) => x.n && typeof x.c[0] === 'number');
        admin = L.geoJSON({ type: 'FeatureCollection', features: d.map((x) => ({ type: 'Feature', properties: {}, geometry: x.g })) }, { pane: 'base', interactive: false, style: { color: '#5c5c63', weight: 0.7, dashArray: '3 3', fill: false } });
        drawLabels();
      }).catch(() => { adminAsked = false; });
    }
    if (z >= 4 && !citiesAsked) { citiesAsked = true; fetch('data/cities.json?v=1').then((r) => r.json()).then((d) => { cities = d; drawLabels(); }).catch(() => { citiesAsked = false; }); }
    if (admin) { const show = z >= 4 && map.hasLayer(base); if (show && !base.hasLayer(admin)) base.addLayer(admin); if (!show && base.hasLayer(admin)) base.removeLayer(admin); }
  }
  function drawLabels() {
    needDetail(); labels.clearLayers(); if (!map.hasLayer(base)) return;
    const z = map.getZoom(); const n = z < 3 ? 0 : z < 4 ? 22 : z < 5 ? 60 : z < 6 ? 120 : 999; const bounds = map.getBounds().pad(0.1);
    const put = (name, lat, lon, cls) => { const d = document.createElement('span'); d.textContent = name; L.marker([lat, lon], { pane: 'labels', interactive: false, keyboard: false, icon: L.divIcon({ className: 'lab ' + cls, html: d, iconSize: [0, 0] }) }).addTo(labels); };
    countries.slice(0, n).forEach((c) => { if (bounds.contains(c.c)) put(c.name, c.c[0], c.c[1], 'country'); });
    if (z >= 4) { let k = 0; const cap = z < 5 ? 55 : 80; for (const r of regions) { if (k >= cap) break; if (bounds.contains(r.c)) { put(r.n, r.c[0], r.c[1], 'region'); k++; } } }
    if (z >= 4) {
      const maxRank = z < 5 ? 1 : z < 6 ? 3 : z < 7 ? 5 : z < 8 ? 7 : 10; let k = 0;
      for (const c of cities) { if (c[3] > maxRank || k >= 90) break; if (bounds.contains([c[1], c[2]])) { put(c[0], c[1], c[2], c[4] ? 'city cap' : 'city'); k++; } }
    }
  }
  map.on('zoomend moveend', drawLabels);
  fetch('data/world.json?v=4').then((r) => r.json()).then((w) => {
    countries = w; drawOutages();
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
    { id: 'front', name: 'Ukraine front line', c: '#ff3b30', group: L.layerGroup(), on: true },
    { id: 'outages', name: 'Internet outages', c: '#ff5fd2', group: L.layerGroup(), on: false },
    { id: 'heat', name: 'Heat detections', c: '#ff7a1a', group: L.layerGroup(), on: false },
    { id: 'radar', name: 'Weather radar', c: '#4dabf7', group: L.layerGroup(), on: false },
    { id: 'wx', name: 'US severe weather', c: '#ffd43b', group: L.layerGroup(), on: false },
    { id: 'quakes', name: 'Earthquakes', c: '#ffa94d', group: L.layerGroup(), on: false },
    { id: 'hazards', name: 'Fires, storms, volcanoes', c: '#5fd38d', group: L.layerGroup(), on: false },
  ];
  const layer = (id) => LAYERS.find((l) => l.id === id);
  { const want = Q.get('layers'); if (want) { const set = new Set(want.split(',')); LAYERS.forEach((l) => { l.on = set.has(l.id); }); } }
  LAYERS.forEach((l) => {
    if (l.on) l.group.addTo(map);
    const b = el('button'); b.type = 'button'; b.style.setProperty('--c', l.c); b.setAttribute('aria-pressed', String(l.on));
    b.append(el('i'), l.name + ' ', l.count = el('span', '', ''));
    b.addEventListener('click', () => { l.on = !l.on; b.setAttribute('aria-pressed', String(l.on)); if (l.on) l.group.addTo(map); else map.removeLayer(l.group); });
    $('layers').append(b);
  });
  const lt = $('layers-toggle'); const setLayers = (open) => { lt.setAttribute('aria-expanded', String(open)); $('layers').hidden = !open; };
  lt.addEventListener('click', () => setLayers(lt.getAttribute('aria-expanded') !== 'true')); setLayers(!matchMedia('(max-width: 1100px)').matches);
  addEventListener('resize', () => { if (S.tab === 'overview') drawList(); map.invalidateSize(); });
  $('sharemap').addEventListener('click', (e) => { const c = map.getCenter(); share({ ll: c.lat.toFixed(2) + ',' + c.lng.toFixed(2) + ',' + map.getZoom(), layers: LAYERS.filter((l) => l.on).map((l) => l.id).join(','), tab: S.tab }, e.currentTarget); });
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
    const tg = layer('heat').group; tg.clearLayers();
    (v.heat || []).forEach((h) => L.circleMarker([h.lat, h.lon], { radius: Math.min(6, 2 + Math.sqrt(h.frp || 1) / 3), stroke: false, fillColor: '#ff7a1a', fillOpacity: 0.7 }).bindPopup(() => pop('Satellite heat detection, ' + h.region, '#ff7a1a', 'Fire radiative power ' + Math.round(h.frp) + ' MW', ['Seen ' + h.d + ' ' + String(h.tm).padStart(4, '0') + ' UTC. A fire, a strike or an industrial flare can all look like this.'], 'https://firms.modaps.eosdis.nasa.gov/map/', 'NASA FIRMS')).addTo(tg));
    layer('heat').count.textContent = (v.heat || []).length || '';
    const wg = layer('wx').group; wg.clearLayers(); const hp = (v.home && v.home.polys) || [];
    hp.forEach((w) => L.polygon(w.poly, { color: '#ffd43b', weight: 1.5, fillColor: '#ffd43b', fillOpacity: 0.18 }).bindPopup(() => pop('US weather warning', '#ffd43b', w.event, [w.area, w.expires ? 'Expires ' + new Date(w.expires).toLocaleString() : ''], 'https://www.weather.gov/', 'National Weather Service')).addTo(wg));
    layer('wx').count.textContent = hp.length || '';
    drawOutages(); drawQuakes(); drawAircraft();
  }
  function drawOutages() {
    const g = layer('outages').group; g.clearLayers(); let n = 0;
    const find = (r) => { const nm = r.name.toLowerCase(); return countries.find((x) => x.name.toLowerCase() === nm) || countries.find((x) => x.name.toLowerCase().startsWith(nm) || nm.startsWith(x.name.toLowerCase())); };
    const rows = ((S.live && S.live.outages) || []).map((r) => ({ ...r, c: find(r) })).filter((r) => r.c && r.c.a > 0.0008).slice(0, 12);
    rows.forEach((r, i) => {
      const c = r.c; n++;
      L.circleMarker(c.c, { radius: Math.max(7, 18 - i), color: '#ff5fd2', weight: 2, dashArray: '4 3', fillColor: '#ff5fd2', fillOpacity: 0.12 }).bindPopup(() => pop('Internet disruption signal', '#ff5fd2', r.name, ['Ranked ' + (i + 1) + ' of ' + rows.length + ' for outage signals in the past 24 hours.'], 'https://ioda.live/country/' + encodeURIComponent(r.code), 'IODA detail')).addTo(g);
    });
    layer('outages').count.textContent = n || '';
  }
  map.createPane('radar').style.zIndex = 215; map.getPane('radar').style.pointerEvents = 'none';
  async function loadRadar() {
    const g = layer('radar').group;
    try {
      const j = await getJson('https://api.rainviewer.com/public/weather-maps.json');
      const f = j.radar.past[j.radar.past.length - 1]; const url = j.host + f.path + '/256/{z}/{x}/{y}/2/1_1.png';
      if (S.radarUrl !== url) { S.radarUrl = url; g.clearLayers(); L.tileLayer(url, { pane: 'radar', opacity: 0.7, maxNativeZoom: 7, attribution: 'Radar: <a href="https://www.rainviewer.com">RainViewer</a>' }).addTo(g); }
    } catch (e) {
      if (!S.radarUrl) { S.radarUrl = 'iem'; g.clearLayers(); L.tileLayer('https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png', { pane: 'radar', opacity: 0.7, attribution: 'Radar: Iowa Environmental Mesonet (US only)' }).addTo(g); }
    }
  }
  function loadFront() {
    getJson('data/frontline.json?t=' + Math.floor(Date.now() / 900000)).then((f) => {
      const g = layer('front').group; g.clearLayers();
      L.geoJSON({ type: 'FeatureCollection', features: f.features.map((x) => ({ type: 'Feature', properties: { name: x.name }, geometry: x.geometry })) }, { interactive: false, style: { color: '#ff3b30', weight: 1.2, fillColor: '#ff3b30', fillOpacity: 0.16 } }).addTo(g);
      layer('front').count.textContent = '';
    }).catch(() => { layer('front').count.textContent = ''; });
  }
  function drawQuakes() {
    const q = S.quakes || (S.live && S.live.quakes) || []; const g = layer('quakes').group; g.clearLayers();
    q.forEach((e) => L.circleMarker([e.lat, e.lon], { radius: 2 + (e.mag - 4) * 4, color: '#ffa94d', weight: 2, fillOpacity: 0.08, fillColor: '#ffa94d' }).bindPopup(() => pop('Earthquake, ' + ago(e.t), '#ffa94d', 'M' + e.mag.toFixed(1) + ' ' + e.place, ['Depth ' + Math.round(e.depth) + ' km' + (e.depth < 5 ? ', unusually shallow' : '')], e.url, 'USGS event page')).addTo(g));
    layer('quakes').count.textContent = q.length || '';
  }
  function drawAircraft() {
    const a = S.aircraft || (S.live && S.live.aircraft) || []; const g = layer('aircraft').group; g.clearLayers();
    a.forEach((p) => {
      const hasTrack = typeof p.track === 'number'; const size = p.notable ? 22 : 15; const ground = typeof p.alt !== 'number';
      const shape = hasTrack ? '<path d="M12 1.5l2 7.5 8.5 4.5v2.2L14 13.4l-.5 5.8 2.7 2v1.3L12 21.3l-4.2 1.2v-1.3l2.7-2-.5-5.8-8.5 2.3v-2.2L10 9z"/>' : '<circle cx="12" cy="12" r="5"/>';
      const m = L.marker([p.lat, p.lon], { keyboard: false, icon: L.divIcon({ className: 'plane' + (p.notable ? ' notable' : '') + (ground ? ' ground' : ''), iconSize: [size, size], html: '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" style="transform:rotate(' + (hasTrack ? Math.round(p.track) : 0) + 'deg)">' + shape + '</svg>' }) }).addTo(g);
      m.bindPopup(() => pop('Military aircraft', '#cfe6ff', (p.call || p.reg || p.hex) + (p.type ? ' (' + p.type + ')' : ''), [typeof p.alt === 'number' ? num(p.alt) + ' ft' + (p.gs ? ', ' + Math.round(p.gs) + ' kt' : '') + (typeof p.track === 'number' ? ', heading ' + String(Math.round(p.track)).padStart(3, '0') + '°' : '') : 'On the ground', p.reg ? 'Registration ' + p.reg : ''], 'https://globe.adsbexchange.com/?icao=' + encodeURIComponent(p.hex), 'Track on ADS-B Exchange'));
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
      const bp = el('p'); bp.append(gloss(l.basis)); d.append(s, bp); return d;
    }));
  }
  function spark(vals, color) {
    const v = vals.filter((x) => typeof x === 'number'); if (v.length < 3) return el('span', 'spark-na', '');
    const min = Math.min(...v), max = Math.max(...v), w = 96, h = 22; const pts = v.map((y, i) => (i / (v.length - 1) * w).toFixed(1) + ',' + (h - 2 - (max === min ? 0.5 : (y - min) / (max - min)) * (h - 4)).toFixed(1)).join(' ');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h); svg.setAttribute('class', 'spark'); svg.setAttribute('aria-hidden', 'true');
    const pl = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); pl.setAttribute('points', pts); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', color); pl.setAttribute('stroke-width', '1.6'); svg.append(pl); return svg;
  }
  function drawDigest() {
    const v = S.live || {}; const hist = v.history || []; const box = $('digest'); const sub = $('digest-sub');
    if (hist.length < 2) { sub.textContent = 'Trends appear after a few updates'; box.replaceChildren(); return; }
    const nowP = hist[hist.length - 1]; const target = nowP.t - 864e5; const base = hist.reduce((b, p) => (Math.abs(p.t - target) < Math.abs(b.t - target) ? p : b), hist[0]);
    const hrs = Math.round((nowP.t - base.t) / 36e5); sub.textContent = 'Change over the past ' + (hrs >= 23 ? '24 hours' : hrs < 1 ? 'hour' : hrs + ' hours');
    const recent = hist.filter((p) => p.t >= nowP.t - 2 * 864e5);
    const row = (label, key, color, fmt) => {
      const a = nowP[key], b = base[key]; const r = el('div', 'dg-row'); const d = typeof a === 'number' && typeof b === 'number' ? a - b : null;
      const delta = el('span', 'dg-d' + (d > 0 ? ' up' : d < 0 ? ' down' : ''), d == null ? '' : d === 0 ? 'no change' : (d > 0 ? '+' : '−') + fmt(Math.abs(d)));
      r.append(el('span', '', label), spark(recent.map((p) => p[key]), color), el('b', '', typeof a === 'number' ? fmt(a) : '–'), delta); return r;
    };
    const f0 = (x) => num(x), f2 = (x) => num(x, 2);
    box.replaceChildren(row('Conflict news', 'war', DOM.war[0], f0), row('Cyber news', 'cyber', DOM.cyber[0], f0), row('Aircraft', 'ac', '#cfe6ff', f0), row('Brent crude', 'br', DOM.energy[0], f2), row('Kp index', 'kp', DOM.nuclear[0], (x) => num(x, 1)));
  }
  function drawAlerts() {
    const v = S.live || {}; const log = (v.alerts && v.alerts.log) || []; const bar = $('alerts');
    bar.hidden = !log.length; if (!log.length) return;
    bar.replaceChildren(el('strong', '', log.length === 1 ? 'Alert' : log.length + ' alerts'), ...log.slice(0, 4).map((a) => { const s = el('span', 'al'); s.append(el('b', '', a.title), ' ' + ago(a.t)); s.title = a.body || ''; return s; }));
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
  function item(color, key) { const d = el('article', 'item' + (key ? ' can' : '')); d.style.setProperty('--c', color); if (key) d.addEventListener('click', (e) => { if (!e.target.closest('a, button')) focus(key); }); return d; }
  function drawList() {
    const box = $('list'); const chips = $('hfilter'); const v = S.live || {};
    if (S.tab === 'overview' && !matchMedia('(max-width: 1100px)').matches) S.tab = 'start';
    const fixed = ['sources', 'readiness']; fixed.forEach((k) => { $(k).hidden = S.tab !== k; }); box.hidden = fixed.includes(S.tab) || S.tab === 'overview'; chips.replaceChildren(); document.body.dataset.tab = S.tab;
    document.querySelectorAll('.tabs button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === S.tab)));
    if (fixed.includes(S.tab) || S.tab === 'overview') return;
    const out = [];
    const sinceLine = () => {
      if (!S.since) return null; const nh = (v.headlines || []).filter((h) => isNew(h.t)).length; const ne = S.assessed ? S.assessed.events.filter((e) => newEvent(e.id)).length : 0; const na = ((v.alerts && v.alerts.log) || []).filter((x) => isNew(x.t)).length;
      const parts = []; if (na) parts.push(na + (na === 1 ? ' alert' : ' alerts')); if (ne) parts.push(ne + ' new key ' + (ne === 1 ? 'event' : 'events')); if (nh) parts.push(nh + ' new headlines');
      const p = el('p', 'since'); p.append(el('b', '', 'Since your last visit ' + ago(S.since) + ': '), parts.length ? parts.join(', ') + '.' : 'nothing new yet.'); return p;
    };
    if (S.tab === 'start') {
      const b = S.assessed && S.assessed.brief;
      if (!b) out.push(el('p', 'empty', S.assessed ? 'The plain-language briefing has not been written yet.' : 'Loading the briefing…'));
      else {
        { const sl = sinceLine(); if (sl) out.push(sl); }
        out.push(el('p', 'kicker', 'The big picture, in plain English. Updated ' + new Date(b.updated + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) + '.'), el('p', 'bottom', b.bottom_line));
        b.items.forEach((it) => {
          const d = el('article', 'story'); d.style.setProperty('--c', (DOM[it.domain] || DOM.war)[0]); d.dataset.slug = slug(it.title);
          d.append(el('h4', '', it.title));
          [['What is happening', it.what], ['Why it matters', it.why], ['What to watch', it.watch]].forEach(([k, v]) => { if (!v) return; const p = el('p'); p.append(el('b', '', k + '. '), gloss(v)); d.append(p); });
          const acts = el('div', 'acts');
          if (VIEWS[it.view] && it.view !== 'world') { const btn = el('button', 'showmap', 'Show on the map'); btn.type = 'button'; btn.addEventListener('click', () => { map.flyTo(VIEWS[it.view][0], VIEWS[it.view][1], { duration: 1.1 }); $('theater').value = it.view; document.querySelector('.stage').scrollIntoView({ block: 'nearest' }); }); acts.append(btn); }
          acts.append(shareBtn({ tab: 'start', story: slug(it.title), ...(VIEWS[it.view] ? { view: it.view } : {}) })); d.append(acts);
          if (it.sources && it.sources.length) { const sp = el('p', 'srcs', 'Sources: '); it.sources.forEach((x, i) => { if (i) sp.append(', '); sp.append(link(x.url, x.name)); }); d.append(sp); }
          out.push(d);
        });
        if (b.worry) { out.push(el('h3', '', 'Should I be worried?'), el('p', 'bottom', b.worry)); }
        if (b.words && b.words.length) { out.push(el('h3', '', 'Words you will see')); const dl = el('dl', 'words'); b.words.forEach(([w, m]) => dl.append(el('dt', '', w), el('dd', '', m))); out.push(dl); }
        out.push(el('p', 'note', 'Written and re-checked daily by Claude from the sourced events in the Events tab. Tap an underlined word for a definition.'));
      }
    } else if (S.tab === 'headlines') {
      [['all', 'All', '#ececec'], ...['war', 'nuclear', 'cyber', 'ai'].map((k) => [k, DOM[k][1], DOM[k][0]])].forEach(([k, name, c]) => {
        const b = el('button', '', name); b.type = 'button'; b.style.setProperty('--c', c); b.setAttribute('aria-pressed', String(S.hf === k));
        b.addEventListener('click', () => { S.hf = k; drawList(); }); chips.append(b);
      });
      { const sl = sinceLine(); if (sl) out.push(sl); }
      const tops = (v.top || []).filter((x) => S.hf === 'all' || x.domain === S.hf);
      if (tops.length) {
        out.push(el('h3', '', 'Top stories right now'));
        tops.forEach((x) => { const d = item((DOM[x.domain] || DOM.war)[0], x.located ? 'h:' + x.id : null); const t = el('h4'); t.append(link(x.url, x.title)); const meta = el('div', 'meta'); meta.append(el('span', 'tag hot', x.n + ' outlets'), el('span', '', x.sources.join(', ')), el('span', '', ago(x.t))); if (x.place) meta.append(el('span', 'where', x.place)); d.append(t, meta); out.push(d); });
        out.push(el('h3', '', 'Latest'));
      }
      const hs = (v.headlines || []).filter((h) => S.hf === 'all' || h.domain === S.hf);
      hs.slice(0, 120).forEach((h) => {
        const located = typeof h.lat === 'number'; const d = item((DOM[h.domain] || DOM.war)[0], located ? 'h:' + h.id : null);
        const t = el('h4'); t.append(link(h.url, h.title)); const meta = el('div', 'meta');
        if (isNew(h.t)) meta.append(el('span', 'tag new', 'new'));
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
          const d = item((DOM[e.domain] || DOM.war)[0], 'a:' + e.id); d.dataset.ev = e.id; const meta = el('div', 'meta');
          if (newEvent(e.id)) meta.append(el('span', 'tag new', 'new'));
          meta.append(el('span', '', e.date.slice(5).replace('-', '/')), el('span', 'tag ' + e.status, e.status), el('span', 'tag' + (e.severity >= 5 ? ' hot' : ''), 'severity ' + e.severity), el('span', 'where', e.place), link(e.url, e.source));
          meta.append(shareBtn({ e: e.id })); const dp = el('p'); dp.append(gloss(e.detail)); d.append(el('h4', '', e.title), dp, meta); out.push(d);
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
    } else if (S.tab === 'odds') {
      const raw = v.odds || []; const items = Array.isArray(raw) ? raw : raw.items || []; const cats = Array.isArray(raw) ? [] : raw.cats || [];
      [['all', 'All'], ...cats.filter(([k]) => items.some((m) => m.cat === k))].forEach(([k, name]) => { const b = el('button', '', name); b.type = 'button'; b.setAttribute('aria-pressed', String(S.of === k)); b.addEventListener('click', () => { S.of = k; drawList(); }); chips.append(b); });
      out.push(el('p', 'note', 'What bettors on Polymarket currently pay for "yes", with the change over the past day. A price is a crowd estimate, not a forecast to rely on, and thinly traded markets can be badly off.'));
      const card = (m) => {
        const d = item(m.yes >= 0.5 ? DOM.war[0] : m.yes >= 0.2 ? DOM.nuclear[0] : '#6b6b70'); const t = el('h4'); t.append(link(m.url, m.q));
        const bar = el('div', 'odds'); const fill = el('i'); fill.style.width = Math.round(m.yes * 100) + '%'; bar.append(fill);
        const meta = el('div', 'meta'); meta.append(el('b', 'pct', (m.yes < 0.01 ? '<1' : m.yes > 0.99 ? '>99' : Math.round(m.yes * 100)) + '% yes'));
        if (typeof m.d === 'number') { const pts = Math.round(m.d * 100); meta.append(el('span', 'mv' + (pts > 0 ? ' up' : pts < 0 ? ' down' : ''), pts === 0 ? 'unchanged today' : (pts > 0 ? '▲ ' : '▼ ') + Math.abs(pts) + (Math.abs(pts) === 1 ? ' pt' : ' pts') + ' today')); }
        meta.append(el('span', '', '$' + num(m.vol) + ' traded today')); if (m.end) meta.append(el('span', '', 'closes ' + String(m.end).slice(0, 10)));
        d.append(t, bar, meta); return d;
      };
      if (S.of === 'all' && cats.length) {
        const movers = items.filter((m) => typeof m.d === 'number' && Math.abs(m.d) >= 0.03).sort((x, y) => Math.abs(y.d) - Math.abs(x.d)).slice(0, 4);
        if (movers.length) { out.push(el('h3', '', 'Biggest moves today')); movers.forEach((m) => out.push(card(m))); }
        cats.forEach(([k, name]) => { const list = items.filter((m) => m.cat === k); if (!list.length) return; out.push(el('h3', '', name)); list.slice(0, 3).forEach((m) => out.push(card(m))); if (list.length > 3) { const more = el('button', 'showmap', 'See all ' + list.length + ' in ' + name); more.type = 'button'; more.addEventListener('click', () => { S.of = k; drawList(); }); out.push(more); } });
      } else items.filter((m) => S.of === 'all' || m.cat === S.of).forEach((m) => out.push(card(m)));
      if (!items.length) out.push(el('p', 'empty', 'No prediction-market data has loaded yet.'));
    } else if (S.tab === 'home') {
      const h = v.home;
      if (!h) out.push(el('p', 'empty', 'US weather and outage data has not loaded yet.'));
      else {
        out.push(el('p', 'note', h.total + ' severe or extreme weather alerts are active across the US. Turn on the "US severe weather" map layer to see the warning areas.'));
        const mine = S.states || h.states; const pick = el('div', 'states');
        mine.forEach((st) => { const c = el('button', 'st', st + ' ×'); c.type = 'button'; c.title = 'Remove ' + st; c.addEventListener('click', () => { S.states = mine.filter((x) => x !== st); store.set('states', S.states); drawList(); }); pick.append(c); });
        const sel = el('select'); sel.setAttribute('aria-label', 'Add a state'); sel.append(new Option('Add a state', ''));
        'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ').filter((x) => !mine.includes(x)).forEach((x) => sel.append(new Option(x, x)));
        sel.addEventListener('change', () => { if (!sel.value) return; S.states = [...mine, sel.value]; store.set('states', S.states); drawList(); }); pick.append(sel);
        out.push(el('h3', '', 'Your states'), el('p', 'note', 'Pick the states you care about. The choice is saved on this device only.'), pick);
        const list = (h.all || h.mine || []).filter((x) => x.states.some((st) => mine.includes(st)));
        list.slice(0, 40).forEach((a) => { const d = item('#ffd43b'); const meta = el('div', 'meta'); meta.append(el('span', 'tag' + (a.severity === 'Extreme' ? ' hot' : ''), a.severity), el('span', '', a.states.join(', '))); if (a.expires) meta.append(el('span', '', 'until ' + new Date(a.expires).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit' }))); d.append(el('h4', '', a.event), el('p', '', a.area), meta); out.push(d); });
        if (!list.length) out.push(el('p', 'empty', mine.length ? 'No severe weather alerts in your states right now.' : 'Add a state to see its alerts.'));
        out.push(el('h3', '', 'Most common alerts nationwide'));
        const ul = el('ul'); h.counts.forEach(([name, n]) => ul.append(el('li', '', n + ' × ' + name))); out.push(ul);
        if (h.outages && h.outages.length) { out.push(el('h3', '', 'Power outages reported, by state'), el('p', 'note', 'Customers out, from utilities that report to the DOE outage network. Many utilities do not, so treat these as a floor.')); const ul2 = el('ul'); h.outages.slice(0, 12).forEach((o) => { const li = el('li', '', ''); li.append(el('a', '', o.state), ' ' + num(o.n) + ((S.states || h.states).includes(o.state) ? ' (yours)' : '')); ul2.append(li); }); out.push(ul2); }
      }
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
  document.querySelectorAll('.tabs button').forEach((b) => b.addEventListener('click', () => { S.tab = b.dataset.tab; drawList(); b.scrollIntoView({ inline: 'center', block: 'nearest' }); }));
  { const cur = document.querySelector('.tabs button[data-tab="' + S.tab + '"]'); if (cur && S.tab !== 'start') setTimeout(() => cur.scrollIntoView({ inline: 'center', block: 'nearest' }), 0); }

  // ---------- status ----------
  const NAMES = { headlines: 'News headlines', aircraft: 'Military aircraft', quakes: 'Earthquakes', hazards: 'Natural hazards', kev: 'Exploited flaws', ransomware: 'Ransomware posts', space: 'Space weather', markets: 'Market quotes', front: 'Ukraine front line', outages: 'Internet outages', odds: 'Prediction markets', home: 'US weather and outages', heat: 'Heat detections' };
  function drawStatus() {
    const v = S.live; const dot = $('status-dot'); const txt = $('status-text');
    if (!v || !v.generated) { dot.className = 'dot warn'; txt.textContent = 'Waiting for the first feed update'; return; }
    const st = v.status || {}; const bad = Object.keys(NAMES).filter((k) => st[k] && !st[k].ok && !st[k].needsKey); const age = (Date.now() - v.generated) / 60000;
    dot.className = 'dot ' + (age > 50 ? 'bad' : bad.length || age > 30 ? 'warn' : 'ok');
    txt.textContent = (age > 50 ? 'Feeds are stale, last updated ' : 'Feeds updated ') + ago(v.generated) + (bad.length ? ', ' + bad.length + ' not responding' : '');
    $('status-list').replaceChildren(...Object.keys(NAMES).map((k) => {
      const s = st[k] || {}; const li = el('li'); li.append(el('span', 'dot ' + (s.ok ? 'ok' : s.needsKey ? 'warn' : 'bad')), el('span', '', NAMES[k]), el('span', '', s.ok ? (k === 'quakes' && S.quakes ? 'live from USGS' : k === 'aircraft' && S.aircraft ? 'live from adsb.lol' : ago(s.at || v.generated)) : s.needsKey ? s.error : s.error ? 'failed: ' + s.error : 'no data yet')); return li;
    }));
  }
  function tick() { $('utc').textContent = new Date().toISOString().slice(0, 19).replace('T', ' ') + ' UTC'; }

  // ---------- loading ----------
  const getJson = (url) => fetch(url, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });
  async function loadLive() {
    try {
      const v = await getJson('data/live.json?t=' + Math.floor(Date.now() / 30000));
      if (!S.live || v.generated !== S.live.generated) { S.live = v; drawLive(); drawTempo(); drawDigest(); drawAlerts(); drawList(); loadFront(); }
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
  getJson('data/assessed.json?t=' + Math.floor(Date.now() / 600000)).then((a) => {
    S.assessed = a; if (a.brief && a.brief.words) { addTerms(a.brief.words); buildRe(); }
    store.set('seenEvLatest', a.events.map((e) => e.id)); drawAssessed(); drawLevels(); drawList();
    const ev = Q.get('e'); if (ev) setTimeout(() => { focus('a:' + ev); const n = document.querySelector('[data-ev="' + ev.replace(/[^\w-]/g, '') + '"]'); if (n) { n.classList.add('picked'); n.scrollIntoView({ block: 'center' }); } }, 600);
    const st = Q.get('story'); if (st) setTimeout(() => { const n = document.querySelector('[data-slug="' + st.replace(/[^\w-]/g, '') + '"]'); if (n) { n.classList.add('picked'); n.scrollIntoView({ block: 'start' }); } }, 300);
  }).catch(() => { $('levels-sub').textContent = 'Ratings failed to load. Reload the page to try again.'; });
  (function clockChart() {
    const pts = [[1947, 420], [1949, 180], [1953, 120], [1960, 420], [1963, 720], [1968, 420], [1969, 600], [1972, 720], [1974, 540], [1980, 420], [1981, 240], [1984, 180], [1988, 360], [1990, 600], [1991, 1020], [1995, 840], [1998, 540], [2002, 420], [2007, 300], [2010, 360], [2012, 300], [2015, 180], [2017, 150], [2018, 120], [2020, 100], [2023, 90], [2025, 89], [2026, 85]];
    const svg = $('clock-chart'); const W = 340, H = 170, L = 42, R = 8, T = 10, B = 22; svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    const x = (yr) => L + (yr - 1947) / (2027 - 1947) * (W - L - R); const y = (sec) => T + (Math.log(sec) - Math.log(60)) / (Math.log(1100) - Math.log(60)) * (H - T - B);
    const mk = (tag, attrs, text) => { const n = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text != null) n.textContent = text; svg.append(n); return n; };
    [[60, 'midnight +1 min'], [120, '2 min'], [300, '5 min'], [600, '10 min'], [1020, '17 min']].forEach(([s2, label]) => { mk('line', { x1: L, x2: W - R, y1: y(s2), y2: y(s2), class: 'cg' }); mk('text', { x: L - 5, y: y(s2) + 3, class: 'ct', 'text-anchor': 'end' }, label.replace('midnight +', '')); });
    [1950, 1970, 1990, 2010, 2026].forEach((yr) => mk('text', { x: x(yr), y: H - 6, class: 'ct', 'text-anchor': 'middle' }, yr));
    let d = ''; pts.forEach(([yr, sec], i) => { d += (i ? ' H' + x(yr).toFixed(1) + ' V' : 'M' + x(yr).toFixed(1) + ' ') + y(sec).toFixed(1); }); d += ' H' + x(2027).toFixed(1);
    mk('path', { d, class: 'cl2' }); mk('circle', { cx: x(2026.5), cy: y(85), r: 3.5, class: 'cd' }); mk('text', { x: x(2026) - 6, y: y(85) - 6, class: 'ct hot', 'text-anchor': 'end' }, '85 sec');
    mk('text', { x: x(1991) + 4, y: y(1020) - 3, class: 'ct' }, '1991: 17 min');
  })();
  tick(); setInterval(tick, 1000);
  drawTempo(); drawReadings(); drawList(); drawStatus();
  loadLive(); setInterval(loadLive, 60000);
  loadQuakes(); setInterval(loadQuakes, 120000);
  loadRadar(); setInterval(loadRadar, 300000);
  loadAircraft(); setInterval(loadAircraft, 45000);
  setInterval(drawStatus, 30000);
})();
