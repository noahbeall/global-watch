// Pulls every public feed, normalizes it, and writes site/data/live.json.
// Runs in GitHub Actions on a schedule. No dependencies; Node 20+.
import { writeFile, mkdir } from 'node:fs/promises';

const SITE = process.env.SITE_URL || '';
const UA = 'Mozilla/5.0 (compatible; global-watch/1.0; +https://github.com/noahbeall/global-watch)';
const now = Date.now();
const H = 3600e3;

async function get(url, as = 'text', ms = 25000) {
  const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return as === 'json' ? res.json() : res.text();
}

// ---------- gazetteer: specific places first, countries last ----------
const P = (n, lat, lon, th, re) => ({ n, lat, lon, th, re: new RegExp('\\b(' + (re || n) + ')\\b', 'i') });
const PLACES = [
  P('Kerch Bridge', 45.3, 36.51, 'ukraine', 'Kerch|Crimean Bridge'), P('Kyiv', 50.45, 30.52, 'ukraine', 'Kyiv|Kiev'), P('Kharkiv', 49.99, 36.23, 'ukraine'),
  P('Odesa', 46.48, 30.73, 'ukraine', 'Odesa|Odessa'), P('Zaporizhzhia', 47.84, 35.14, 'ukraine'), P('Dnipro', 48.46, 35.05, 'ukraine', 'Dnipro|Dnipropetrovsk'),
  P('Kherson', 46.64, 32.61, 'ukraine'), P('Lviv', 49.84, 24.03, 'ukraine'), P('Sumy', 50.91, 34.8, 'ukraine'), P('Donetsk', 48.0, 37.8, 'ukraine', 'Donetsk|Donbas|Pokrovsk|Kramatorsk|Kostiantynivka|Kostyantynivka'),
  P('Mykolaiv', 46.97, 32.0, 'ukraine'), P('Chernihiv', 51.5, 31.3, 'ukraine'), P('Crimea', 45.0, 34.1, 'ukraine', 'Crimea|Sevastopol'), P('Kursk', 51.73, 36.19, 'ukraine'),
  P('Belgorod', 50.6, 36.59, 'ukraine'), P('Moscow', 55.75, 37.62, 'ukraine', 'Moscow|Kremlin'), P('St Petersburg', 59.94, 30.31, 'ukraine', 'St\\.? Petersburg'), P('Rostov', 47.23, 39.72, 'ukraine'),
  P('Kaliningrad', 54.71, 20.51, 'ukraine'), P('Black Sea', 43.4, 34.0, 'ukraine'), P('Baltic Sea', 57.5, 19.5, 'other', 'Baltic'),
  P('Strait of Hormuz', 26.4, 56.4, 'gulf', 'Hormuz'), P('Tehran', 35.69, 51.39, 'gulf'), P('Isfahan', 32.65, 51.67, 'gulf'), P('Natanz', 33.72, 51.73, 'gulf'), P('Fordow', 34.88, 50.99, 'gulf'),
  P('Bushehr', 28.92, 50.83, 'gulf'), P('Bandar Abbas', 27.19, 56.27, 'gulf'), P('Bahrain', 26.13, 50.56, 'gulf', 'Bahrain|Manama'), P('Qatar', 25.29, 51.53, 'gulf', 'Qatar|Doha'),
  P('Kuwait', 29.37, 47.98, 'gulf'), P('UAE', 24.45, 54.38, 'gulf', 'UAE|Abu Dhabi|Dubai|Emirates'), P('Oman', 23.59, 58.38, 'gulf', 'Oman|Muscat'), P('Baghdad', 33.31, 44.37, 'gulf', 'Baghdad|Iraq|Iraqi|Erbil'),
  P('Gulf of Oman', 24.8, 58.8, 'gulf'), P('Persian Gulf', 27.0, 51.5, 'gulf', 'Persian Gulf|Arabian Gulf'),
  P('Red Sea', 19.5, 39.0, 'redsea'), P('Bab el-Mandeb', 12.6, 43.4, 'redsea', 'Bab[ -]el[ -]Mandeb'), P('Sanaa', 15.37, 44.19, 'redsea', "Sanaa|Sana'a"), P('Hodeidah', 14.8, 42.95, 'redsea', 'Hodeidah|Hodeida|Hudaydah'),
  P('Aden', 12.79, 45.02, 'redsea'), P('Riyadh', 24.71, 46.68, 'redsea', 'Riyadh|Saudi'), P('Yemen', 15.5, 47.5, 'redsea', 'Yemen|Houthi|Houthis'), P('Suez Canal', 30.5, 32.3, 'redsea', 'Suez'),
  P('Gaza', 31.42, 34.38, 'levant', 'Gaza|Rafah|Khan Younis|Hamas'), P('West Bank', 31.95, 35.25, 'levant', 'West Bank|Ramallah|Jenin|Nablus'), P('Jerusalem', 31.78, 35.22, 'levant'),
  P('Tel Aviv', 32.08, 34.78, 'levant'), P('Haifa', 32.79, 34.99, 'levant'), P('Beirut', 33.89, 35.5, 'levant', 'Beirut|Lebanon|Lebanese|Hezbollah'), P('Damascus', 33.51, 36.29, 'levant', 'Damascus|Syria|Syrian'),
  P('Golan Heights', 33.0, 35.75, 'levant', 'Golan'), P('Amman', 31.95, 35.93, 'levant', 'Amman|Jordan'), P('Cairo', 30.04, 31.24, 'levant', 'Cairo|Egypt|Sinai'),
  P('Taiwan Strait', 24.2, 119.5, 'eastasia'), P('Taipei', 25.03, 121.57, 'eastasia', 'Taipei|Taiwan|Taiwanese'), P('South China Sea', 13.0, 114.0, 'eastasia', 'South China Sea|Scarborough|Spratly'),
  P('Pyongyang', 39.03, 125.75, 'eastasia', 'Pyongyang|North Korea|North Korean|DPRK|Kim Jong'), P('Seoul', 37.57, 126.98, 'eastasia', 'Seoul|South Korea|South Korean'),
  P('Tokyo', 35.68, 139.69, 'eastasia', 'Tokyo|Japan|Japanese'), P('Beijing', 39.9, 116.4, 'eastasia', 'Beijing|PLA'), P('Shenzhen', 22.54, 114.06, 'eastasia'), P('Hong Kong', 22.32, 114.17, 'eastasia'),
  P('Manila', 14.6, 120.98, 'eastasia', 'Manila|Philippines|Philippine'), P('Okinawa', 26.33, 127.8, 'eastasia'),
  P('Khartoum', 15.5, 32.56, 'other', 'Khartoum|Sudan|Sudanese|Darfur|El Fasher|RSF'), P('Tripoli', 32.89, 13.19, 'other', 'Libya|Libyan'), P('Mogadishu', 2.05, 45.32, 'other', 'Somalia|Mogadishu|al-Shabab'),
  P('Goma', -1.68, 29.23, 'other', 'Goma|Congo|M23'), P('Sahel', 14.5, -1.5, 'other', 'Mali|Burkina Faso|Niger\\b'), P('Nigeria', 9.08, 7.4, 'other', 'Nigeria|Nigerian|Abuja'), P('Ethiopia', 9.03, 38.74, 'other', 'Ethiopia|Ethiopian|Tigray'),
  P('Kabul', 34.53, 69.17, 'other', 'Kabul|Afghanistan|Afghan|Taliban'), P('Islamabad', 33.69, 73.05, 'other', 'Islamabad|Pakistan|Pakistani'), P('Kashmir', 34.08, 74.8, 'other'), P('New Delhi', 28.61, 77.21, 'other', 'New Delhi|India\\b|Indian'),
  P('Myanmar', 19.76, 96.08, 'other', 'Myanmar|Burma'), P('Caracas', 10.48, -66.9, 'other', 'Caracas|Venezuela|Venezuelan'), P('Havana', 23.11, -82.37, 'other', 'Cuba|Havana'), P('Haiti', 18.59, -72.31, 'other', 'Haiti|Port-au-Prince'),
  P('Warsaw', 52.23, 21.01, 'other', 'Warsaw|Poland|Polish'), P('Vilnius', 54.69, 25.28, 'other', 'Lithuania|Vilnius'), P('Tallinn', 59.44, 24.75, 'other', 'Estonia|Tallinn'), P('Riga', 56.95, 24.11, 'other', 'Latvia'),
  P('Helsinki', 60.17, 24.94, 'other', 'Finland|Finnish'), P('Minsk', 53.9, 27.57, 'ukraine', 'Minsk|Belarus'), P('Chisinau', 47.01, 28.86, 'ukraine', 'Moldova|Transnistria'), P('Tbilisi', 41.72, 44.79, 'other', 'Tbilisi|Georgia\\b(?! (state|governor|senate|tech|bulldogs))'),
  P('Brussels', 50.85, 4.35, 'other', 'Brussels|NATO|European Union'), P('London', 51.51, -0.13, 'other', 'London|Britain|British|U\\.?K\\.?'), P('Paris', 48.86, 2.35, 'other', 'Paris|France|French'), P('Berlin', 52.52, 13.4, 'other', 'Berlin|Germany|German'),
  P('Ankara', 39.93, 32.86, 'other', 'Ankara|Turkey|Turkish|Türkiye'), P('Canberra', -35.28, 149.13, 'other', 'Australia|Australian'), P('Ottawa', 45.42, -75.7, 'other', 'Canada|Canadian'),
  P('Ukraine', 49.0, 32.0, 'ukraine', 'Ukraine|Ukrainian|Zelensky|Zelenskyy'), P('Russia', 56.5, 44.0, 'ukraine', 'Russia|Russian|Putin'), P('Iran', 32.4, 53.7, 'gulf', 'Iran|Iranian|IRGC'),
  P('Israel', 31.5, 34.9, 'levant', 'Israel|Israeli|IDF'), P('China', 34.5, 108.9, 'eastasia', 'China|Chinese|Xi Jinping'),
  P('Washington', 38.9, -77.04, 'other', 'Washington|Pentagon|White House|Congress|Trump'),
];
function locate(text) {
  for (const p of PLACES) if (p.re.test(text)) return { place: p.n, lat: p.lat, lon: p.lon, theater: p.th };
  return null;
}

// ---------- RSS ----------
const un = (s) => String(s || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pick = (block, tag) => { const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i')); return m ? un(m[1]) : ''; };
function parseRss(xml) {
  const out = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/gi)) {
    const b = m[0];
    let title = pick(b, 'title'); let source = pick(b, 'source');
    const link = pick(b, 'link'); const t = Date.parse(pick(b, 'pubDate') || pick(b, 'dc:date'));
    if (source && title.endsWith(' - ' + source)) title = title.slice(0, -(source.length + 3));
    if (title && /^https?:\/\//.test(link) && Number.isFinite(t)) out.push({ title, url: link, source, t });
  }
  return out;
}
const gnews = (q) => 'https://news.google.com/rss/search?q=' + encodeURIComponent(q + ' when:1d') + '&hl=en-US&gl=US&ceid=US:en';
const ACT = '(strike OR strikes OR attack OR missile OR drone OR offensive OR shelling OR troops OR ceasefire)';
const QUERIES = [
  ['war', 'ukraine', gnews('(Ukraine OR Russia OR Kyiv OR Crimea) ' + ACT)],
  ['war', 'gulf', gnews('(Iran OR Hormuz OR IRGC OR Bahrain) ' + ACT.replace(')', ' OR tanker OR mines)'))],
  ['war', 'redsea', gnews('(Houthi OR Yemen OR "Red Sea") ' + ACT)],
  ['war', 'levant', gnews('(Israel OR Gaza OR Lebanon OR Hezbollah OR Syria) ' + ACT)],
  ['war', 'eastasia', gnews('(Taiwan OR "South China Sea" OR "North Korea" OR PLA) (military OR drills OR missile OR warships OR incursion)')],
  ['war', 'other', gnews('(Sudan OR Sahel OR Congo OR Myanmar OR Pakistan OR Venezuela) (fighting OR offensive OR airstrike OR clashes OR coup)')],
  ['nuclear', null, gnews('(nuclear OR IAEA OR ICBM OR "missile test" OR "enriched uranium" OR "arms control")')],
  ['cyber', null, gnews('(cyberattack OR ransomware OR "data breach" OR hackers OR "zero-day" OR "supply chain attack")')],
  ['ai', null, gnews('("AI safety" OR "frontier AI" OR "AI model" OR "AI regulation" OR "export controls" OR OpenAI OR Anthropic OR DeepMind OR Nvidia)')],
];
const DIRECT = [
  ['BBC', 'https://feeds.bbci.co.uk/news/world/rss.xml'], ['Al Jazeera', 'https://www.aljazeera.com/xml/rss/all.xml'],
  ['BleepingComputer', 'https://www.bleepingcomputer.com/feed/'], ['The Hacker News', 'https://feeds.feedburner.com/TheHackersNews'],
];
const KW = {
  cyber: /cyber|ransomware|hack(ed|ers|ing)?\b|breach|malware|zero-day|phishing|vulnerabilit|exploit|botnet|CVE-/i,
  nuclear: /nuclear|IAEA|uranium|ICBM|warhead|missile test|ballistic missile launch/i,
  ai: /\bAI\b|artificial intelligence|OpenAI|Anthropic|DeepMind|chatbot|Nvidia/i,
  war: /strike|attack|missile|drone|troops|offensive|shelling|killed|airstrike|ceasefire|military|war\b|invasion|militia|rebels|navy|warship/i,
};
const classify = (t) => Object.keys(KW).find((k) => KW[k].test(t)) || null;

async function headlines(status) {
  const all = []; let okN = 0; const errs = [];
  const jobs = [
    ...QUERIES.map(([domain, theater, url]) => get(url).then((x) => parseRss(x).slice(0, 40).map((h) => ({ ...h, domain, hint: theater })))),
    ...DIRECT.map(([name, url]) => get(url).then((x) => parseRss(x).map((h) => ({ ...h, source: h.source || name, domain: classify(h.title) })).filter((h) => h.domain))),
  ];
  for (const r of await Promise.allSettled(jobs)) {
    if (r.status === 'fulfilled') { okN++; all.push(...r.value); } else errs.push(String(r.reason && r.reason.message));
  }
  const seen = new Set(); const out = [];
  for (const h of all.sort((a, b) => b.t - a.t)) {
    if (now - h.t > 36 * H || h.t > now + H) continue;
    const key = h.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().slice(0, 70);
    if (seen.has(key)) continue; seen.add(key);
    const loc = h.domain === 'cyber' || h.domain === 'ai' ? null : locate(h.title);
    out.push({ id: 'h' + out.length, t: h.t, title: h.title.slice(0, 220), url: h.url, source: (h.source || '').slice(0, 60), domain: h.domain, theater: (loc && loc.theater) || h.hint || 'other', ...(loc ? { place: loc.place, lat: loc.lat, lon: loc.lon } : {}) });
  }
  const per = {}; const kept = out.filter((h) => (per[h.domain] = (per[h.domain] || 0) + 1) <= 70);
  status.headlines = { ok: okN > 0, count: kept.length, note: okN + ' of ' + jobs.length + ' sources answered' + (errs.length ? ' (' + errs[0] + ')' : '') };
  if (!okN) throw new Error('no news source answered');
  return kept;
}

// ---------- other feeds ----------
async function quakes() {
  const g = await get('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson', 'json');
  return g.features.filter((f) => f.properties.mag >= 4.5).map((f) => ({ id: f.id, t: f.properties.time, mag: f.properties.mag, place: f.properties.place, depth: f.geometry.coordinates[2], lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], url: f.properties.url })).slice(0, 80);
}
async function hazards() {
  const g = await get('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=10&limit=120', 'json');
  return g.events.map((e) => {
    const geo = [...e.geometry].reverse().find((x) => x.type === 'Point'); if (!geo) return null;
    return { id: e.id, title: e.title, kind: (e.categories[0] || {}).title || 'Event', t: Date.parse(geo.date), lat: geo.coordinates[1], lon: geo.coordinates[0], url: (e.sources[0] || {}).url || e.link };
  }).filter(Boolean);
}
async function kev() {
  const g = await get('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', 'json');
  const v = g.vulnerabilities.sort((a, b) => (a.dateAdded < b.dateAdded ? 1 : -1));
  const week = new Date(now - 7 * 24 * H).toISOString().slice(0, 10);
  return { total: v.length, week: v.filter((x) => x.dateAdded >= week).length, items: v.slice(0, 15).map((x) => ({ cve: x.cveID, vendor: x.vendorProject, product: x.product, name: x.vulnerabilityName, added: x.dateAdded, due: x.dueDate, ransomware: x.knownRansomwareCampaignUse === 'Known' })) };
}
const NOTABLE = /^(E4|E6|RC135|R135|K35R|KC135|K46|KC46|KC10|B52|B1|B2|U2|RQ4|Q4|P8|E3|E3TF|E3CF|E8|C17|C5M|A332|MQ9|Q9|WC135)/i;
async function aircraft() {
  const g = await get('https://api.adsb.lol/v2/mil', 'json');
  return (g.ac || []).filter((a) => typeof a.lat === 'number' && typeof a.lon === 'number').map((a) => ({ hex: a.hex, call: (a.flight || '').trim(), type: a.t || '', reg: a.r || '', alt: a.alt_baro, gs: a.gs, track: a.track, lat: +a.lat.toFixed(3), lon: +a.lon.toFixed(3), notable: NOTABLE.test(a.t || '') })).slice(0, 600);
}
const CC = { US: [39.8, -98.6], CA: [56.1, -106.3], MX: [23.6, -102.5], BR: [-14.2, -51.9], AR: [-38.4, -63.6], CL: [-35.7, -71.5], CO: [4.6, -74.1], PE: [-9.2, -75], GB: [54, -2], IE: [53.4, -8.2], FR: [46.2, 2.2], DE: [51.2, 10.4], IT: [41.9, 12.6], ES: [40.5, -3.7], PT: [39.4, -8.2], NL: [52.1, 5.3], BE: [50.5, 4.5], CH: [46.8, 8.2], AT: [47.5, 14.6], SE: [60.1, 18.6], NO: [60.5, 8.5], DK: [56.3, 9.5], FI: [61.9, 25.7], PL: [51.9, 19.1], CZ: [49.8, 15.5], RO: [45.9, 25], GR: [39.1, 21.8], TR: [39, 35.2], UA: [48.4, 31.2], RU: [61.5, 105.3], IL: [31, 34.9], SA: [23.9, 45.1], AE: [23.4, 53.8], EG: [26.8, 30.8], ZA: [-30.6, 22.9], NG: [9.1, 8.7], KE: [-0.02, 37.9], IN: [20.6, 79], PK: [30.4, 69.3], CN: [35.9, 104.2], JP: [36.2, 138.3], KR: [35.9, 127.8], TW: [23.7, 121], HK: [22.3, 114.2], SG: [1.35, 103.8], MY: [4.2, 102], TH: [15.9, 101], VN: [14.1, 108.3], ID: [-0.8, 113.9], PH: [12.9, 121.8], AU: [-25.3, 133.8], NZ: [-40.9, 174.9] };
async function ransomware() {
  const g = await get('https://api.ransomware.live/v2/recentvictims', 'json');
  const rows = (Array.isArray(g) ? g : []).map((x) => ({ victim: String(x.victim || x.post_title || '').slice(0, 80), group: String(x.group || x.group_name || ''), country: String(x.country || '').toUpperCase().slice(0, 2), sector: String(x.activity || ''), t: Date.parse(x.discovered || x.attackdate || x.published || '') })).filter((x) => x.victim && Number.isFinite(x.t)).sort((a, b) => b.t - a.t).slice(0, 80);
  const by = {};
  for (const r of rows) if (CC[r.country]) (by[r.country] = by[r.country] || { country: r.country, lat: CC[r.country][0], lon: CC[r.country][1], n: 0, names: [] }, by[r.country].n++, by[r.country].names.length < 5 && by[r.country].names.push(r.victim));
  return { items: rows.slice(0, 40), countries: Object.values(by) };
}
async function space() {
  const g = await get('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json', 'json');
  const last = g[g.length - 1];
  const kp = Array.isArray(last) ? +last[1] : +(last.Kp ?? last.kp_index ?? last.kp);
  const at = Array.isArray(last) ? last[0] : last.time_tag;
  if (!Number.isFinite(kp)) throw new Error('unexpected Kp format');
  return { kp, at };
}
async function markets() {
  const syms = { brent: 'BZ=F', wti: 'CL=F', natgas: 'NG=F', gold: 'GC=F', vix: '^VIX' };
  const out = {};
  await Promise.all(Object.entries(syms).map(async ([k, sym]) => {
    try {
      const g = await get('https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&range=1d', 'json');
      const m = g.chart.result[0].meta;
      if (Number.isFinite(m.regularMarketPrice)) out[k] = { value: m.regularMarketPrice, prev: Number.isFinite(m.chartPreviousClose) ? m.chartPreviousClose : null, date: new Date(m.regularMarketTime * 1000).toISOString().slice(0, 10) };
    } catch (e) { console.error('quote failed:', sym, e.message); }
  }));
  if (!Object.keys(out).length) throw new Error('no quotes returned');
  return out;
}

// ---------- newer feeds ----------
async function outages() {
  const u = Math.floor(now / 1000);
  const g = await get('https://api.ioda.inetintel.cc.gatech.edu/v2/outages/summary?from=' + (u - 86400) + '&until=' + u + '&entityType=country&limit=60', 'json');
  let rows = g.data || g; if (Array.isArray(rows) && Array.isArray(rows[0])) rows = rows[0];
  if (!Array.isArray(rows)) throw new Error('unexpected shape: ' + Object.keys(g).join(','));
  if (rows[0]) console.log('DEBUG ioda sample', JSON.stringify(rows[0]).slice(0, 400));
  return rows.map((r) => ({ code: (r.entity && r.entity.code) || '', name: (r.entity && r.entity.name) || '', score: +((r.scores && (r.scores.overall ?? r.scores.total)) ?? r.score ?? 0), events: r.event_cnt ?? null }))
    .filter((r) => r.name && r.score > 0).sort((a, b) => b.score - a.score).slice(0, 15);
}
const FIRMS_BOXES = { Ukraine: '22,44,41,53', 'Iran and the Gulf': '44,24,62,38', Levant: '34,29.5,37,34', Yemen: '42,12,50,18' };
async function heat() {
  const key = process.env.FIRMS_KEY; if (!key) { const e = new Error('needs a free NASA key'); e.needsKey = true; throw e; }
  const out = [];
  for (const [region, box] of Object.entries(FIRMS_BOXES)) {
    const csv = await get('https://firms.modaps.eosdis.nasa.gov/api/area/csv/' + key + '/VIIRS_SNPP_NRT/' + box + '/1');
    const lines = csv.trim().split(/\r?\n/); const head = lines[0].split(','); const ix = (n) => head.indexOf(n);
    if (ix('latitude') < 0) throw new Error('FIRMS said: ' + lines[0].slice(0, 80));
    const rows = lines.slice(1).map((l) => l.split(',')).map((c) => ({ lat: +c[ix('latitude')], lon: +c[ix('longitude')], frp: +c[ix('frp')], conf: c[ix('confidence')], d: c[ix('acq_date')], tm: c[ix('acq_time')], region }))
      .filter((r) => Number.isFinite(r.lat) && r.conf !== 'l').sort((a, b) => b.frp - a.frp).slice(0, 350);
    out.push(...rows);
  }
  return out;
}
async function frontline() {
  const g = await get('https://deepstatemap.live/api/history/last', 'json', 40000);
  const fc = g.map || g; const feats = (fc.features || []).filter((f) => f.geometry && /Polygon/.test(f.geometry.type));
  if (!feats.length) throw new Error('no polygons: ' + Object.keys(g).join(','));
  console.log('DEBUG deepstate', feats.length, 'polygons;', [...new Set(feats.map((f) => String((f.properties || {}).name).slice(0, 60)))].slice(0, 25).join(' | '));
  const total = feats.reduce((n, f) => n + JSON.stringify(f.geometry.coordinates).length, 0); const step = Math.max(1, Math.ceil(total / 600000));
  const ring = (r) => { const o = r.filter((_, i) => i % step === 0 || i === r.length - 1).map((c) => [+c[0].toFixed(3), +c[1].toFixed(3)]); return o.length >= 4 ? o : null; };
  const geom = (g2) => g2.type === 'Polygon' ? { type: 'Polygon', coordinates: g2.coordinates.map(ring).filter(Boolean) } : { type: 'MultiPolygon', coordinates: g2.coordinates.map((p) => p.map(ring).filter(Boolean)).filter((p) => p.length) };
  const keep = feats.map((f) => ({ name: String((f.properties || {}).name || ''), geometry: geom(f.geometry) })).filter((f) => f.geometry.coordinates.length);
  await mkdir('site/data', { recursive: true });
  await writeFile('site/data/frontline.json', JSON.stringify({ updated: g.datetime || g.id || now, generated: now, features: keep }));
  return { count: keep.length, updated: g.datetime || null };
}
const ODDS_RE = /\b(Iran|Israel|Gaza|Hezbollah|Houthi|Hormuz|Russia|Ukraine|Putin|Zelensky|NATO|ceasefire|nuclear|Taiwan|China invade|North Korea|Kim Jong|airstrike|strike on|war\b|invade|invasion|troops|Khamenei|regime)/i;
async function odds() {
  const all = [];
  for (const off of [0, 100, 200, 300, 400]) {
    const page = await get('https://gamma-api.polymarket.com/markets?closed=false&active=true&limit=100&offset=' + off + '&order=volume24hr&ascending=false', 'json');
    if (!Array.isArray(page)) throw new Error('unexpected shape'); all.push(...page); if (page.length < 100) break;
  }
  const out = [];
  for (const m of all) {
    if (!ODDS_RE.test(m.question || '')) continue;
    let prices; let names; try { prices = JSON.parse(m.outcomePrices); names = JSON.parse(m.outcomes); } catch { continue; }
    const yi = names.findIndex((n) => /^yes$/i.test(n)); if (yi < 0 || !Number.isFinite(+prices[yi])) continue;
    const slug = (m.events && m.events[0] && m.events[0].slug) || m.slug;
    out.push({ q: String(m.question).slice(0, 160), yes: +(+prices[yi]).toFixed(3), vol: Math.round(+m.volume24hr || 0), end: m.endDate || null, url: 'https://polymarket.com/event/' + slug });
  }
  if (!out.length) throw new Error('no matching markets among ' + all.length);
  return out.sort((a, b) => b.vol - a.vol).slice(0, 25);
}
const HOME_STATES = ['OK', 'TX', 'KS', 'MO', 'AR', 'NM', 'CO'];
async function home() {
  const g = await get('https://api.weather.gov/alerts/active?status=actual&message_type=alert&severity=Extreme,Severe', 'json');
  const items = (g.features || []).map((f) => {
    const p = f.properties || {}; const ugc = (p.geocode && p.geocode.UGC) || [];
    const poly = f.geometry && f.geometry.type === 'Polygon' ? f.geometry.coordinates[0].map((c) => [+c[1].toFixed(2), +c[0].toFixed(2)]) : null;
    return { event: p.event, area: String(p.areaDesc || '').slice(0, 140), states: [...new Set(ugc.map((u) => u.slice(0, 2)))], severity: p.severity, expires: Date.parse(p.expires || p.ends || '') || null, url: p['@id'] || '', poly };
  }).filter((x) => x.event);
  const counts = {}; items.forEach((x) => { counts[x.event] = (counts[x.event] || 0) + 1; });
  const out = { total: items.length, counts: Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8), states: HOME_STATES, mine: items.filter((x) => x.states.some((st) => HOME_STATES.includes(st))).slice(0, 40).map(({ poly, ...r }) => r), polys: items.filter((x) => x.poly).slice(0, 200).map((x) => ({ event: x.event, area: x.area, expires: x.expires, poly: x.poly })), outages: null };
  try {
    const o = await get('https://ornl.opendatasoft.com/api/explore/v2.1/catalog/datasets/odin-real-time-outages-county/records?limit=100', 'json', 20000);
    const recs = o.results || [];
    if (recs[0]) console.log('DEBUG odin sample', JSON.stringify(recs[0]).slice(0, 500));
    const numKey = recs[0] && Object.keys(recs[0]).find((k) => /meters?_?affected|customers?_?(out|affected)/i.test(k));
    if (numKey) out.outages = recs.map((r) => ({ state: r.state || r.state_name || '', county: r.county || r.name || r.county_name || '', n: +r[numKey] || 0, lat: r.geo_point_2d && r.geo_point_2d.lat, lon: r.geo_point_2d && r.geo_point_2d.lon })).filter((r) => r.n > 0).sort((a, b) => b.n - a.n).slice(0, 60);
  } catch (e) { console.error('odin failed:', e.message); }
  return out;
}

// ---------- run ----------
let prev = {};
if (SITE) { try { prev = await get(SITE + '/data/live.json?x=' + now, 'json', 15000); } catch { prev = {}; } }
const status = {};
async function feed(name, fn, count) {
  try {
    const v = await fn(status);
    status[name] = { ok: true, at: now, count: count ? count(v) : undefined, ...(status[name] || {}) };
    return v;
  } catch (e) {
    const old = prev.status && prev.status[name];
    status[name] = { ok: false, at: (old && old.at) || null, error: String(e.message || e).slice(0, 120), ...(e.needsKey ? { needsKey: true } : {}), ...(status[name] && status[name].note ? { note: status[name].note } : {}) };
    console.error('feed failed:', name, '-', e.message);
    if (name === 'front') { try { const old2 = await get(SITE + '/data/frontline.json', 'text', 20000); await writeFile('site/data/frontline.json', old2); } catch { /* none yet */ } }
    return prev[name] ?? null;
  }
}
await mkdir('site/data', { recursive: true });
const [hl, q, hz, k, ac, rw, sw, mk, og, ht, fr, od, hm] = await Promise.all([
  feed('headlines', headlines), feed('quakes', quakes, (v) => v.length), feed('hazards', hazards, (v) => v.length), feed('kev', kev, (v) => v.week),
  feed('aircraft', aircraft, (v) => v.length), feed('ransomware', ransomware, (v) => v.items.length), feed('space', space), feed('markets', markets),
  feed('outages', outages, (v) => v.length), feed('heat', heat, (v) => v.length), feed('front', frontline, (v) => v.count), feed('odds', odds, (v) => v.length), feed('home', home, (v) => v.total),
]);

// ---------- history (for trends) ----------
const tempo = {}; (hl || []).forEach((h) => { if (now - h.t < 24 * H) tempo[h.domain] = (tempo[h.domain] || 0) + 1; });
const history = (prev.history || []).filter((p) => now - p.t < 7 * 24 * H);
if (!history.length || now - history[history.length - 1].t > 25 * 60000) history.push({ t: now, war: tempo.war || 0, nuclear: tempo.nuclear || 0, cyber: tempo.cyber || 0, ai: tempo.ai || 0, ac: ac ? ac.length : null, nt: ac ? ac.filter((a) => a.notable).length : null, kp: sw ? sw.kp : null, br: mk && mk.brent ? mk.brent.value : null, kev: k ? k.total : null });

// ---------- alerts ----------
const first = !prev.alerts; const sent = (prev.alerts && prev.alerts.sent) || {}; const fresh = [];
const alert = (key, title, body, pri) => { if (sent[key]) return; sent[key] = now; if (!first) fresh.push({ key, t: now, title, body, pri }); };
try {
  const { readFile } = await import('node:fs/promises');
  const a = JSON.parse(await readFile('site/data/assessed.json', 'utf8'));
  a.events.filter((e) => e.severity >= 5).forEach((e) => alert('ev:' + e.id, 'Severity 5: ' + e.title, e.detail, 5));
} catch (e) { console.error('alerts: assessed unreadable', e.message); }
(ac || []).filter((a) => /^(E4|E6)/i.test(a.type) && typeof a.alt === 'number').forEach((a) => alert('ac:' + a.hex + ':' + Math.floor(now / (8 * H)), 'Command aircraft airborne: ' + a.type + ' ' + (a.call || a.reg || a.hex), 'At ' + a.lat.toFixed(1) + ', ' + a.lon.toFixed(1) + ', ' + a.alt + ' ft.', 4));
if (sw && sw.kp >= 7) alert('kp:' + new Date(now).toISOString().slice(0, 10), 'Severe geomagnetic storm: Kp ' + sw.kp, 'Kp 7 or higher can stress grid transformers and disrupt HF radio and GPS.', 4);
(q || []).filter((e) => e.mag >= 6.5).forEach((e) => alert('eq:' + e.id, 'M' + e.mag.toFixed(1) + ' earthquake: ' + e.place, 'Depth ' + Math.round(e.depth) + ' km.', 3));
if (mk && mk.brent && mk.brent.prev) { const pct = (mk.brent.value / mk.brent.prev - 1) * 100; if (Math.abs(pct) >= 5) alert('brent:' + mk.brent.date, 'Brent crude ' + (pct > 0 ? 'up ' : 'down ') + Math.abs(pct).toFixed(1) + '% today', 'Now $' + mk.brent.value.toFixed(2) + ' a barrel.', 3); }
for (const key of Object.keys(sent)) if (now - sent[key] > 14 * 24 * H) delete sent[key];
const topic = process.env.NTFY_TOPIC;
if (topic) for (const f of fresh.slice(0, 6)) {
  try { await fetch('https://ntfy.sh/' + encodeURIComponent(topic), { method: 'POST', body: f.body || f.title, headers: { Title: f.title.replace(/[^\x20-\x7E]/g, ''), Priority: String(f.pri || 3), Tags: 'warning', Click: SITE || '' }, signal: AbortSignal.timeout(15000) }); } catch (e) { console.error('ntfy failed:', e.message); }
}
const alerts = { sent, push: Boolean(topic), log: [...fresh.map(({ key, t, title, body }) => ({ key, t, title, body })), ...((prev.alerts && prev.alerts.log) || [])].filter((x) => now - x.t < 48 * H).slice(0, 30) };
console.log('alerts: ' + fresh.length + ' new' + (topic ? ', pushed' : ', push not configured'));

const live = { generated: now, status, headlines: hl, quakes: q, hazards: hz, kev: k, aircraft: ac, ransomware: rw, space: sw, markets: mk, outages: og, heat: ht, front: fr, odds: od, home: hm, history, alerts };
await writeFile('site/data/live.json', JSON.stringify(live));
console.log(Object.entries(status).map(([n, s]) => n + ': ' + (s.ok ? 'ok' : 'FAILED ' + s.error) + (s.count != null ? ' (' + s.count + ')' : '') + (s.note ? ' ' + s.note : '')).join('\n'));
if (!Object.values(status).some((s) => s.ok)) process.exit(1);
