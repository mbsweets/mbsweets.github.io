// रसगुल्ला रन — लीडरबोर्ड सर्वर (Cloudflare Worker + D1). Binding: DB (D1), Secret: ADMIN_KEY
// POST /submit  {pid, name, city, score, dist, secs}
// GET  /top?scope=city|india|world&city=darbhanga&period=week|all&pid=...
// POST /admin/remove {key, pid}   (सिर्फ़ मालिक — ADMIN_KEY से)
const ORIGINS = ['https://mbsweets.github.io', 'http://127.0.0.1:8766', 'http://localhost:8766'];
const CITIES = ['darbhanga', 'madhubani', 'samastipur', 'sitamarhi', 'muzaffarpur', 'saharsa', 'supaul', 'patna', 'bihar', 'india', 'abroad'];
const BAD = ['madarchod', 'bhenchod', 'behenchod', 'chutiya', 'bhosdi', 'gandu', 'randi', 'fuck', 'shit', 'bitch', 'मादर', 'बहनचो', 'भेनचो', 'चुतिया', 'भोसड़', 'गांडू', 'रंडी'];

function cors(req) {
  const o = req.headers.get('Origin') || '';
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
function cleanName(n) {
  n = String(n || '').normalize('NFC').replace(/[<>"'`\\\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  const low = n.toLowerCase().replace(/\s/g, '');
  if (n.length < 2 || BAD.some((b) => low.includes(b))) return null;
  if (/\d{6,}/.test(n.replace(/\s/g, ''))) return null; // फ़ोन नंबर जैसा नाम नहीं
  return n;
}

export default {
  async fetch(req, env) {
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors(req) });
    const url = new URL(req.url);
    try {
      if (url.pathname === '/submit' && req.method === 'POST') {
        const b = await req.json();
        const pid = String(b.pid || '');
        if (!/^[a-z0-9]{12,40}$/.test(pid)) return json(req, { ok: false, err: 'pid' }, 400);
        const name = cleanName(b.name);
        if (!name) return json(req, { ok: false, err: 'name' }, 400);
        const city = CITIES.includes(b.city) ? b.city : 'abroad';
        const score = Math.floor(+b.score || 0), dist = Math.floor(+b.dist || 0), secs = +b.secs || 0;
        // सीधी जाँच: इतने समय में इतना स्कोर/दूरी संभव है या नहीं
        if (score <= 0 || secs < 3 || dist > secs * 42 + 60 || score > secs * 520 + 2500) return json(req, { ok: false, err: 'check' }, 400);
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
      if (url.pathname === '/admin/remove' && req.method === 'POST') {
        const b = await req.json();
        if (!env.ADMIN_KEY || b.key !== env.ADMIN_KEY) return json(req, { ok: false }, 403);
        await env.DB.prepare('DELETE FROM best WHERE pid=?').bind(String(b.pid || '')).run();
        return json(req, { ok: true });
      }
      return json(req, { ok: true, app: 'rasgulla-run-leaderboard' });
    } catch (e) {
      return json(req, { ok: false, err: 'server' }, 500);
    }
  },
};
