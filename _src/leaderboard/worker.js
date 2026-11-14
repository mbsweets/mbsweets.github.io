// रसगुल्ला रन — लीडरबोर्ड सर्वर (Cloudflare Worker + D1). Binding: DB (D1), Secret: ADMIN_KEY
// POST /submit  {pid, name, city, score, dist, secs, mult}
// GET  /top?scope=city|india|world&city=darbhanga&period=week|all&pid=...
// POST /admin/remove {key, pid}   (सिर्फ़ मालिक — ADMIN_KEY से)
// POST /ping  {src, ev:'open'|'game', nd:0|1, nf:0|1}  — कुल खिलाड़ी गिनती (कोई पहचान नहीं, सिर्फ़ गिनती)
// GET  /count                     — कुल खिलाड़ी (सबके लिए, जैसे मेन्यू में दिखाने को)
// GET  /stats?key=ADMIN_KEY       — मालिक के लिए पूरा हिसाब (हिंदी पन्ना; &json=1 से JSON)
const ORIGINS = ['https://mbsweets.github.io', 'http://127.0.0.1:8766', 'http://localhost:8766'];
const CITIES = ['darbhanga', 'madhubani', 'samastipur', 'sitamarhi', 'muzaffarpur', 'saharsa', 'supaul', 'patna', 'bihar', 'india', 'abroad'];
const BAD = ['madarchod', 'bhenchod', 'behenchod', 'chutiya', 'bhosdi', 'gandu', 'randi', 'fuck', 'shit', 'bitch', 'मादर', 'बहनचो', 'भेनचो', 'चुतिया', 'भोसड़', 'गांडू', 'रंडी'];

function cors(req) {
  const o = req.headers.get('Origin') || '';
  if (new URL(req.url).pathname === '/count') return { 'Access-Control-Allow-Origin': '*', 'Vary': 'Origin' }; // कुल गिनती: कहीं से भी पढ़ सकें
  return { 'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : ORIGINS[0], 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Vary': 'Origin' };
}
const json = (req, data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req) } });

// भारत के समय (IST) से हफ़्ता — सोमवार से शुरू
function weekKey(now = Date.now()) {
  const d = new Date(now + 5.5 * 3600e3);
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dn = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - dn); // ISO हफ़्ता (सोमवार से)
  const w = Math.ceil(((t - Date.UTC(t.getUTCFullYear(), 0, 1)) / 864e5 + 1) / 7);
  return t.getUTCFullYear() + '-W' + String(w).padStart(2, '0');
}
const SRCS = ['web', 'crazygames', 'playstore', 'poki', 'other'];
const SRC_HI = { web: 'अपनी वेबसाइट', crazygames: 'CrazyGames', playstore: 'Play Store', poki: 'Poki', other: 'दूसरी जगह' };
const istDay = (now = Date.now()) => new Date(now + 5.5 * 3600e3).toISOString().slice(0, 10);

// मालिक का हिसाब: आज / 7 दिन / 30 दिन / अब तक — कहाँ से, किस देश से
async function stats(req, env, asJson) {
  const today = istDay(), d7 = istDay(Date.now() - 6 * 864e5), d30 = istDay(Date.now() - 29 * 864e5);
  const sum = (where, args) => env.DB.prepare(`SELECT COALESCE(SUM(users),0) AS users, COALESCE(SUM(newp),0) AS newp, COALESCE(SUM(games),0) AS games FROM daily WHERE ${where}`).bind(...args).first();
  const out = {
    today: await sum('day=?', [today]), last7: await sum('day>=?', [d7]), last30: await sum('day>=?', [d30]), all: await sum('1=1', []),
    bySrc: (await env.DB.prepare('SELECT src, SUM(newp) AS players, SUM(games) AS games, SUM(CASE WHEN day>=? THEN users ELSE 0 END) AS users7 FROM daily GROUP BY src ORDER BY players DESC').bind(d7).all()).results,
    byCountry: (await env.DB.prepare('SELECT country, SUM(users) AS users FROM daily WHERE day>=? GROUP BY country ORDER BY users DESC LIMIT 12').bind(d30).all()).results,
    days: (await env.DB.prepare('SELECT day, SUM(users) AS users, SUM(newp) AS newp, SUM(games) AS games FROM daily WHERE day>=? GROUP BY day ORDER BY day DESC').bind(istDay(Date.now() - 13 * 864e5)).all()).results,
  };
  if (asJson) return json(req, { ok: true, ...out });
  const n = (v) => Number(v || 0).toLocaleString('en-IN');
  const row = (a) => `<tr>${a.map((x) => `<td>${x}</td>`).join('')}</tr>`;
  const card = (t, o) => `<div class="c"><small>${t}</small><b>${n(o.users)}</b><span>खिलाड़ी (उस दौरान)</span><em>${n(o.newp)} नए · ${n(o.games)} गेम</em></div>`;
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>रसगुल्ला रन — हिसाब</title>
<style>body{font:16px system-ui,sans-serif;margin:0;padding:16px;background:#fff6e3;color:#2a1511}h1{font-size:22px;color:#7a111a;margin:0 0 4px}p{margin:0 0 14px;color:#6b4a3a}
.g{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.c{background:#fff;border:2px solid #2a1511;border-radius:14px;padding:10px}.c small{display:block;font-weight:700;color:#7a111a}
.c b{display:block;font-size:28px}.c span{font-size:13px}.c em{display:block;font-style:normal;font-size:13px;color:#2e7b47;font-weight:700}
table{width:100%;border-collapse:collapse;background:#fff;border:2px solid #2a1511;border-radius:12px;margin-top:14px}td,th{padding:7px 8px;border-bottom:1px solid #eee;text-align:left}th{background:#7a111a;color:#fff}</style>
<h1>🍬 रसगुल्ला रन — खिलाड़ी हिसाब</h1><p>सब जगह मिलाकर (वेबसाइट + गेम पोर्टल + आगे ऐप)। आज: ${today} (भारत समय)</p>
<div class="g">${card('आज', out.today)}${card('पिछले 7 दिन', out.last7)}${card('पिछले 30 दिन', out.last30)}<div class="c"><small>अब तक कुल</small><b>${n(out.all.newp)}</b><span>अलग-अलग खिलाड़ी</span><em>${n(out.all.games)} गेम खेले गए</em></div></div>
<table><tr><th>कहाँ से</th><th>कुल खिलाड़ी</th><th>7 दिन में</th><th>गेम</th></tr>${out.bySrc.map((r) => row([SRC_HI[r.src] || r.src, n(r.players), n(r.users7), n(r.games)])).join('')}</table>
<table><tr><th>देश (30 दिन)</th><th>खिलाड़ी</th></tr>${out.byCountry.map((r) => row([r.country === 'IN' ? '🇮🇳 भारत' : (r.country || '?'), n(r.users)])).join('')}</table>
<table><tr><th>दिन</th><th>खिलाड़ी</th><th>नए</th><th>गेम</th></tr>${out.days.map((r) => row([r.day, n(r.users), n(r.newp), n(r.games)])).join('')}</table>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function cleanName(n) {
  n = String(n || '').normalize('NFC').replace(/[<>"'`\\\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  const low = n.toLowerCase().replace(/\s/g, '');
  if (n.length < 2 || BAD.some((b) => low.includes(b))) return null;
  if (/\d{6,}/.test(n.replace(/\s/g, ''))) return null; // फ़ोन नंबर जैसा नाम नहीं
  return n;
}

// पहली बार चलते ही टेबल अपने-आप बनती हैं (schema.sql जैसी) — "Deploy to Cloudflare" बटन से लगाने पर अलग से SQL नहीं चलाना पड़ता
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS best ( pid TEXT NOT NULL, period TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL DEFAULT '', score INTEGER NOT NULL, dist INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL, PRIMARY KEY (pid, period) )`,
  `CREATE INDEX IF NOT EXISTS best_period_score ON best (period, score DESC)`,
  `CREATE INDEX IF NOT EXISTS best_city ON best (period, city, score DESC)`,
  `CREATE INDEX IF NOT EXISTS best_country ON best (period, country, score DESC)`,
  `CREATE TABLE IF NOT EXISTS daily ( day TEXT NOT NULL, src TEXT NOT NULL, country TEXT NOT NULL DEFAULT '', users INTEGER NOT NULL DEFAULT 0, newp INTEGER NOT NULL DEFAULT 0, games INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, src, country) )`
];
let ready = null;
function ensureSchema(env) {
  if (!ready) ready = env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s))).catch((e) => { ready = null; throw e; });
  return ready;
}
const adminOk = (env, k) => !!env.ADMIN_KEY && String(env.ADMIN_KEY).length >= 8 && k === env.ADMIN_KEY;

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    const url = new URL(req.url);
    try {
      await ensureSchema(env);
      if (url.pathname === '/submit' && req.method === 'POST') {
        const b = await req.json();
        const pid = String(b.pid || '');
        if (!/^[a-z0-9]{12,40}$/.test(pid)) return json(req, { ok: false, err: 'pid' }, 400);
        const name = cleanName(b.name);
        if (!name) return json(req, { ok: false, err: 'name' }, 400);
        const city = CITIES.includes(b.city) ? b.city : 'abroad';
        const score = Math.floor(+b.score || 0), dist = Math.floor(+b.dist || 0), secs = +b.secs || 0;
        // सीधी जाँच: इतने समय में इतना स्कोर/दूरी संभव है या नहीं
        const mult = Math.max(1, Math.min(31, Math.floor(+b.mult || 1))); // मिशन-सेट वाला स्कोर गुणक
        if (score <= 0 || secs < 3 || dist > secs * 46 + 60 || score > (secs * 560 + 2500) * mult) return json(req, { ok: false, err: 'check' }, 400);
        const now = Date.now();
        const last = await env.DB.prepare('SELECT ts FROM best WHERE pid=? AND period=?').bind(pid, 'all').first();
        if (last && now - last.ts < 8000) return json(req, { ok: false, err: 'slow' }, 429);
        const country = (req.cf && req.cf.country) || '';
        const up = 'INSERT INTO best (pid,period,name,city,country,score,dist,ts) VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(pid,period) DO UPDATE SET name=excluded.name, city=excluded.city, country=excluded.country, ts=excluded.ts, score=MAX(best.score, excluded.score), dist=CASE WHEN excluded.score>best.score THEN excluded.dist ELSE best.dist END';
        const wk = weekKey(now);
        await env.DB.batch([env.DB.prepare(up).bind(pid, wk, name, city, country, score, dist, now), env.DB.prepare(up).bind(pid, 'all', name, city, country, score, dist, now)]);
        return json(req, { ok: true, week: wk });
      }
      if (url.pathname === '/top' && req.method === 'GET') {
        const period = url.searchParams.get('period') === 'all' ? 'all' : weekKey();
        const scope = url.searchParams.get('scope') || 'world';
        const city = CITIES.includes(url.searchParams.get('city')) ? url.searchParams.get('city') : 'darbhanga';
        let where = 'period=?', args = [period];
        if (scope === 'city') { where += ' AND city=?'; args.push(city); }
        if (scope === 'india') { where += " AND country='IN'"; }
        const rows = (await env.DB.prepare(`SELECT pid,name,city,country,score FROM best WHERE ${where} ORDER BY score DESC, ts ASC LIMIT 50`).bind(...args).all()).results;
        const pid = url.searchParams.get('pid') || '';
        let me = null;
        if (pid) {
          const mine = await env.DB.prepare(`SELECT score FROM best WHERE ${where} AND pid=?`).bind(...args, pid).first();
          if (mine) { const r = await env.DB.prepare(`SELECT COUNT(*) AS n FROM best WHERE ${where} AND score>?`).bind(...args, mine.score).first(); me = { rank: r.n + 1, score: mine.score }; }
        }
        return json(req, { ok: true, period, rows: rows.map((r) => ({ name: r.name, city: r.city, country: r.country, score: r.score, me: r.pid === pid })), me });
      }
      if (url.pathname === '/ping' && req.method === 'POST') { // sendBeacon: text/plain
        const txt = (await req.text()).slice(0, 300);
        let b = {}; try { b = JSON.parse(txt); } catch (e) { return json(req, { ok: false }, 400); }
        const src = SRCS.includes(b.src) ? b.src : 'web';
        const country = String((req.cf && req.cf.country) || '').slice(0, 2);
        const day = istDay();
        const open = b.ev === 'open', game = b.ev === 'game';
        if (!open && !game) return json(req, { ok: false }, 400);
        const users = open && b.nd ? 1 : 0, newp = open && b.nf ? 1 : 0, games = game ? 1 : 0;
        if (users || newp || games) {
          await env.DB.prepare('INSERT INTO daily (day,src,country,users,newp,games) VALUES (?,?,?,?,?,?) ON CONFLICT(day,src,country) DO UPDATE SET users=users+excluded.users, newp=newp+excluded.newp, games=games+excluded.games')
            .bind(day, src, country, users, newp, games).run();
        }
        return json(req, { ok: true });
      }
      if (url.pathname === '/count' && req.method === 'GET') {
        const r = await env.DB.prepare('SELECT COALESCE(SUM(newp),0) AS players, COALESCE(SUM(games),0) AS games FROM daily').first();
        const res = json(req, { ok: true, players: r.players, games: r.games });
        res.headers.set('Cache-Control', 'public, max-age=300');
        return res;
      }
      if (url.pathname === '/stats' && req.method === 'GET') {
        if (!adminOk(env, url.searchParams.get('key'))) return json(req, { ok: false }, 403);
        return stats(req, env, url.searchParams.get('json') === '1');
      }
      if (url.pathname === '/admin/remove' && req.method === 'POST') {
        const b = await req.json();
        if (!adminOk(env, b.key)) return json(req, { ok: false }, 403);
        await env.DB.prepare('DELETE FROM best WHERE pid=?').bind(String(b.pid || '')).run();
        return json(req, { ok: true });
      }
      return json(req, { ok: true, app: 'rasgulla-run-leaderboard' });
    } catch (e) {
      return json(req, { ok: false, err: 'server' }, 500);
    }
  },
};
