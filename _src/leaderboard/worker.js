// रसगुल्ला रन — लीडरबोर्ड सर्वर (Cloudflare Worker + D1). Binding: DB (D1), Secret: ADMIN_KEY
// POST /submit  {pid, name, city, score, dist, secs, mult}
// GET  /top?scope=city|india|world&city=darbhanga&period=week|all&pid=...
// POST /admin/remove {key, pid}   (सिर्फ़ मालिक — ADMIN_KEY से)
// POST /ping  {src, ev:'open'|'game', nd:0|1, nf:0|1}  — कुल खिलाड़ी गिनती (कोई पहचान नहीं, सिर्फ़ गिनती)
// GET  /count                     — कुल खिलाड़ी (सबके लिए, जैसे मेन्यू में दिखाने को)
// GET  /stats?key=ADMIN_KEY       — मालिक के लिए पूरा हिसाब (हिंदी पन्ना; &json=1 से JSON)
// ---- दुकान के इनाम (सिर्फ़ अपनी वेबसाइट वाला गेम; 14 नवंबर 2026, मालिक: "नुकसान नहीं, कस्टमर का भी फ़ायदा") ----
// POST /mine   {pid}                         — स्टैम्प कार्ड + कूपन (पहली बार: 2 स्टैम्प मुफ़्त; पिछले हफ़्ते दरभंगा टॉप 3 → 250g कूपन)
// POST /stamp  {pid, why:'gold'|'mission'|'dist', score, dist, secs}  — दिन में हर काम का 1 स्टैम्प (कुल 3); 10 = 1 रसगुल्ला मुफ़्त (हफ़्ते में 2 तक)
// POST /reward {pid, score, dist, secs, mult} — एक दौड़ में 20,000+ → ₹200+ मिठाई/नमकीन पर ₹20 छूट (हफ़्ते में 1)
// POST /coupon/check {key, code} · /coupon/use {key, code} · /coupon/undo {key, code} · /admin/config {key, cap}  — सिर्फ़ बिलिंग ऐप (ADMIN_KEY)
// ---- 👻 परछाईं + 📅 आज का रास्ता (17 नवंबर 2026) ----
// POST /submit में daily:1 = आज के रास्ते वाली दौड़ → period 'D'+तारीख़ (IST) भी; GET /top?period=day = आज का
// POST /ghost {pid, name, score, dist, secs, mult, daily, data} — दौड़ की परछाईं (हर 0.2 से. गोलू की जगह; base64url, 9000 अक्षर तक) → {id}
//      आज के रास्ते वाली: एक खिलाड़ी की दिन में एक (बेहतर स्कोर हो तो बदले); बाकी: एक फ़ोन से दिन में 20 तक. 30 दिन बाद अपने-आप हटें
// GET  /ghost?id=ABC123  · GET /ghost/top — आज के रास्ते का सबसे अच्छा
// POST /feedback {pid, stars 1-5, tags[], text, lang, src, dev, tier, runs, best, ver} — खिलाड़ी की राय (एक फ़ोन की दिन में 1; नाम/फ़ोन नहीं; लिखे में फ़ोन नंबर/गाली कटती)
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
    coupons: (await env.DB.prepare('SELECT kind, COUNT(*) AS made, SUM(CASE WHEN used>0 THEN 1 ELSE 0 END) AS used FROM coupon WHERE week=? GROUP BY kind').bind(weekKey()).all()).results,
    rasToday: (await env.DB.prepare("SELECT COUNT(*) AS n FROM coupon WHERE kind='ras' AND used_day=?").bind(today).first()).n,
    cap: await getCap(env),
    cards: (await env.DB.prepare('SELECT COUNT(*) AS n FROM card').first()).n,
    fb: await env.DB.prepare('SELECT COUNT(*) AS n, AVG(stars) AS avg FROM feedback').first(),
    fb30: await env.DB.prepare('SELECT COUNT(*) AS n, AVG(stars) AS avg FROM feedback WHERE day>=?').bind(d30).first(),
    fbStars: (await env.DB.prepare('SELECT stars, COUNT(*) AS n FROM feedback GROUP BY stars').all()).results,
    fbTags: {}, fbList: [], fbBad: new URL(req.url).searchParams.get('bad') === '1',
  };
  for (const r of (await env.DB.prepare('SELECT tags FROM feedback WHERE day>=?').bind(d30).all()).results) for (const t of String(r.tags || '').split(',')) if (TAG_HI[t]) out.fbTags[t] = (out.fbTags[t] || 0) + 1;
  out.fbList = (await env.DB.prepare(`SELECT day, stars, tags, text, lang, src, dev, tier, runs, best, country FROM feedback ${out.fbBad ? 'WHERE stars<=3' : ''} ORDER BY ts DESC LIMIT 30`).all()).results;
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
${fbHtml(out, req)}
<table><tr><th>कहाँ से</th><th>कुल खिलाड़ी</th><th>7 दिन में</th><th>गेम</th></tr>${out.bySrc.map((r) => row([SRC_HI[r.src] || r.src, n(r.players), n(r.users7), n(r.games)])).join('')}</table>
<table><tr><th>देश (30 दिन)</th><th>खिलाड़ी</th></tr>${out.byCountry.map((r) => row([r.country === 'IN' ? '🇮🇳 भारत' : (r.country || '?'), n(r.users)])).join('')}</table>
<table><tr><th>दिन</th><th>खिलाड़ी</th><th>नए</th><th>गेम</th></tr>${out.days.map((r) => row([r.day, n(r.users), n(r.newp), n(r.games)])).join('')}</table>
<table><tr><th>🎮 दुकान इनाम (इस हफ़्ते)</th><th>बने</th><th>दुकान पर दिए</th></tr>${['ras', 'off', 'top3'].map((k) => { const r = out.coupons.find((x) => x.kind === k) || {}; return row([KIND_HI[k], n(r.made), n(r.used)]); }).join('')}
<tr><td>आज दिए मुफ़्त रसगुल्ले</td><td colspan="2"><b>${n(out.rasToday)}</b> / ${n(out.cap)} (रोज़ की सीमा)</td></tr><tr><td>स्टैम्प कार्ड वाले खिलाड़ी</td><td colspan="2">${n(out.cards)}</td></tr></table>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } });
}

// राय वाला हिस्सा (पन्ने पर)
function fbHtml(out, req) {
  const n = (v) => Number(v || 0).toLocaleString('en-IN'), st = (k) => '★'.repeat(k) + '☆'.repeat(5 - k);
  const tot = out.fb.n || 0, avg = out.fb.avg ? (+out.fb.avg).toFixed(1) : '–', avg30 = out.fb30.avg ? (+out.fb30.avg).toFixed(1) : '–';
  const by = {}; for (const r of out.fbStars) by[r.stars] = r.n;
  const bars = [5, 4, 3, 2, 1].map((k) => { const c = by[k] || 0, w = tot ? Math.round(c * 100 / tot) : 0; return `<div class="br"><span>${k}★</span><i><u style="width:${w}%"></u></i><b>${n(c)}</b></div>`; }).join('');
  const tags = Object.entries(out.fbTags).sort((a, b) => b[1] - a[1]).map(([t, c]) => `<span class="tg ${['lag', 'hard', 'confusing', 'boring', 'bugs'].includes(t) ? 'bad' : ''}">${TAG_HI[t]} <b>${n(c)}</b></span>`).join('') || '<em>अभी कोई नहीं</em>';
  const u = new URL(req.url), lnk = (bad) => { u.searchParams.set('bad', bad ? '1' : '0'); return esc(u.pathname + u.search); };
  const list = out.fbList.map((r) => `<div class="fb s${r.stars}"><div><b>${st(r.stars)}</b> <small>${esc(r.day)} · ${LANG_HI[r.lang] ? LANG_HI[r.lang] + ' · ' : ''}${r.dev === 'pc' ? '💻 कंप्यूटर' : '📱 फ़ोन'}${r.tier >= 0 ? ' · ग्राफ़िक्स दर्जा ' + r.tier : ''} · ${n(r.runs)} दौड़ · सबसे लंबी ${n(r.best)} मी.${r.src !== 'web' ? ' · ' + esc(SRC_HI[r.src] || r.src) : ''}</small></div>`
    + `${r.tags ? `<p>${r.tags.split(',').map((t) => TAG_HI[t] || '').filter(Boolean).join(' · ')}</p>` : ''}${r.text ? `<q>${esc(r.text)}</q>` : ''}</div>`).join('') || '<p><em>अभी कोई राय नहीं आई।</em></p>';
  return `<style>.fbw{margin-top:18px;background:#fff;border:2px solid #2a1511;border-radius:14px;padding:12px}.fbw h2{margin:0 0 8px;font-size:20px;color:#7a111a}
.avg{display:flex;gap:14px;align-items:center;margin-bottom:8px}.avg b{font-size:40px;color:#c98a00}.avg span{font-size:14px}
.br{display:flex;align-items:center;gap:8px;font-size:14px;margin:3px 0}.br span{width:28px}.br i{flex:1;height:12px;background:#f1e3c8;border-radius:6px;overflow:hidden}.br u{display:block;height:100%;background:#f2a91b}.br b{width:34px;text-align:right}
.tgs{margin:10px 0}.tg{display:inline-block;margin:3px;padding:4px 9px;border-radius:12px;background:#e6f4e9;border:1px solid #2e7b47;font-size:14px}.tg.bad{background:#fde8e6;border-color:#c0392b}
.tabs a{display:inline-block;margin:6px 6px 8px 0;padding:6px 12px;border:2px solid #2a1511;border-radius:12px;color:#2a1511;text-decoration:none;font-weight:700}.tabs a.on{background:#7a111a;color:#fff}
.fb{border-top:1px solid #eee;padding:8px 0}.fb b{color:#c98a00;font-size:18px}.fb.s1 b,.fb.s2 b{color:#c0392b}.fb small{color:#6b4a3a}.fb p{margin:4px 0;font-size:14px}.fb q{display:block;background:#fff6e3;border-left:4px solid #f2a91b;padding:6px 8px;margin-top:4px;quotes:none}</style>
<div class="fbw"><h2>⭐ खिलाड़ियों की राय</h2>
<div class="avg"><b>${avg}</b><span>औसत (5 में से) · कुल ${n(tot)} राय<br>पिछले 30 दिन: ${avg30} (${n(out.fb30.n)} राय)</span></div>${bars}
<div class="tgs"><b>30 दिन में क्या कहा:</b><br>${tags}</div>
<div class="tabs"><a class="${out.fbBad ? '' : 'on'}" href="${lnk(false)}">सब राय</a><a class="${out.fbBad ? 'on' : ''}" href="${lnk(true)}">सिर्फ़ 1–3★ (सुधार के लिए)</a></div>${list}</div>`;
}

function cleanName(n) {
  n = String(n || '').normalize('NFC').replace(/[<>"'`\\\u0000-\u001f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  const low = n.toLowerCase().replace(/\s/g, '');
  if (n.length < 2 || BAD.some((b) => low.includes(b))) return null;
  if (/\d{6,}/.test(n.replace(/\s/g, ''))) return null; // फ़ोन नंबर जैसा नाम नहीं
  return n;
}

// ---------------- खिलाड़ी की राय ----------------
const TAGS = ['fun', 'gfx', 'rewards', 'world', 'voice', 'lag', 'hard', 'confusing', 'boring', 'bugs'];
const TAG_HI = { fun: '😄 मज़ेदार', gfx: '🎨 ग्राफ़िक्स बढ़िया', rewards: '🍬 इनाम अच्छे', world: '🌳 जंगल/रात पसंद', voice: '🗣️ बोली/आवाज़ अच्छी',
  lag: '🐢 लैग / धीमा', hard: '😣 बहुत कठिन', confusing: '❓ समझ नहीं आया', boring: '😴 बोरिंग', bugs: '🐞 गड़बड़ / अटकता' };
const LANG_HI = { en: 'English', hi: 'हिंदी', mai: 'मैथिली' };
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function cleanText(t) {
  t = String(t || '').normalize('NFC').replace(/[\u0000-\u001f<>`\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
  t = t.replace(/(\+?\d[\d\s-]{6,}\d)/g, '***'); // फ़ोन नंबर नहीं
  t = t.replace(BAD_RE, '***'); // गाली छिपे
  return t;
}
const BAD_RE = new RegExp(BAD.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'gi');
const intIn = (v, a, b, d) => { const n = Math.floor(+v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : d; };

// पहली बार चलते ही टेबल अपने-आप बनती हैं (schema.sql जैसी) — "Deploy to Cloudflare" बटन से लगाने पर अलग से SQL नहीं चलाना पड़ता
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS best ( pid TEXT NOT NULL, period TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL, country TEXT NOT NULL DEFAULT '', score INTEGER NOT NULL, dist INTEGER NOT NULL DEFAULT 0, ts INTEGER NOT NULL, PRIMARY KEY (pid, period) )`,
  `CREATE INDEX IF NOT EXISTS best_period_score ON best (period, score DESC)`,
  `CREATE INDEX IF NOT EXISTS best_city ON best (period, city, score DESC)`,
  `CREATE INDEX IF NOT EXISTS best_country ON best (period, country, score DESC)`,
  `CREATE TABLE IF NOT EXISTS daily ( day TEXT NOT NULL, src TEXT NOT NULL, country TEXT NOT NULL DEFAULT '', users INTEGER NOT NULL DEFAULT 0, newp INTEGER NOT NULL DEFAULT 0, games INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, src, country) )`,
  `CREATE TABLE IF NOT EXISTS card ( pid TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0, day TEXT NOT NULL DEFAULT '', flags INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, ts INTEGER NOT NULL DEFAULT 0 )`,
  `CREATE TABLE IF NOT EXISTS coupon ( code TEXT PRIMARY KEY, pid TEXT NOT NULL, kind TEXT NOT NULL, week TEXT NOT NULL, created INTEGER NOT NULL, expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0, used_day TEXT NOT NULL DEFAULT '' )`,
  `CREATE INDEX IF NOT EXISTS coupon_pid ON coupon (pid, kind, week)`,
  `CREATE INDEX IF NOT EXISTS coupon_used ON coupon (used_day, kind)`,
  `CREATE TABLE IF NOT EXISTS cfg ( k TEXT PRIMARY KEY, v TEXT NOT NULL )`,
  `CREATE TABLE IF NOT EXISTS feedback ( pid TEXT NOT NULL, day TEXT NOT NULL, ts INTEGER NOT NULL, stars INTEGER NOT NULL, tags TEXT NOT NULL DEFAULT '', text TEXT NOT NULL DEFAULT '', lang TEXT NOT NULL DEFAULT '', src TEXT NOT NULL DEFAULT 'web', dev TEXT NOT NULL DEFAULT '', tier INTEGER NOT NULL DEFAULT -1, runs INTEGER NOT NULL DEFAULT 0, best INTEGER NOT NULL DEFAULT 0, country TEXT NOT NULL DEFAULT '', ver TEXT NOT NULL DEFAULT '', PRIMARY KEY (pid, day) )`,
  `CREATE INDEX IF NOT EXISTS feedback_ts ON feedback (ts DESC)`,
  `CREATE TABLE IF NOT EXISTS ghost ( id TEXT PRIMARY KEY, pid TEXT NOT NULL, name TEXT NOT NULL, city TEXT NOT NULL DEFAULT '', day TEXT NOT NULL, daily INTEGER NOT NULL DEFAULT 0, score INTEGER NOT NULL, dist INTEGER NOT NULL, secs REAL NOT NULL, data TEXT NOT NULL, ts INTEGER NOT NULL )`,
  `CREATE INDEX IF NOT EXISTS ghost_top ON ghost (daily, day, score DESC)`,
  `CREATE INDEX IF NOT EXISTS ghost_pid ON ghost (pid, day)`
];
let ready = null;
function ensureSchema(env) {
  if (!ready) ready = env.DB.batch(SCHEMA.map((s) => env.DB.prepare(s))).catch((e) => { ready = null; throw e; });
  return ready;
}
const adminOk = (env, k) => !!env.ADMIN_KEY && String(env.ADMIN_KEY).length >= 8 && k === env.ADMIN_KEY;

// ---------------- दुकान के इनाम ----------------
const RW = {
  need: 10, bonus: 2, perDay: 3,          // 10 स्टैम्प = 1 रसगुल्ला; शुरू में 2 मुफ़्त; दिन में 3 तक (सुनहरा रसगुल्ला + मिशन + 1000 मी.)
  rasWeek: 2,                              // एक मोबाइल को हफ़्ते में ज़्यादा से ज़्यादा 2 मुफ़्त रसगुल्ले (मालिक)
  capDefault: 20,                          // पूरी दुकान से दिन में ज़्यादा से ज़्यादा (बिलिंग ऐप से बदलें)
  offScore: 20000, offMin: 200, offAmt: 20, // एक दौड़ में 20,000+ → ₹200+ मिठाई/नमकीन पर ₹20 छूट, हफ़्ते में 1
  topGram: 250, days: 7,                   // दरभंगा हफ़्ते के टॉप 3 → 250 ग्राम; हर कूपन 7 दिन
};
const WHY = { gold: 1, mission: 2, dist: 4 };
const KIND_HI = { ras: '🍬 1 रसगुल्ला मुफ़्त', off: `💰 ₹${RW.offMin}+ मिठाई/नमकीन पर ₹${RW.offAmt} छूट`, top3: `🏆 ${RW.topGram} ग्राम मिठाई (दरभंगा टॉप 3)` };
const CODE_AB = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newCode() {
  const a = new Uint8Array(6); crypto.getRandomValues(a);
  const s = Array.from(a, (x) => CODE_AB[x % CODE_AB.length]).join('');
  return s.slice(0, 3) + '-' + s.slice(3);
}
const cleanCode = (c) => { const s = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/[IL]/g, '1'); return s.length === 6 ? s.slice(0, 3) + '-' + s.slice(3) : ''; };
const okPid = (p) => /^[a-z0-9]{12,40}$/.test(String(p || ''));
const plausible = (b) => { const score = Math.floor(+b.score || 0), dist = Math.floor(+b.dist || 0), secs = +b.secs || 0, mult = Math.max(1, Math.min(31, Math.floor(+b.mult || 1))); return secs >= 3 && dist <= secs * 46 + 60 && score <= (secs * 560 + 2500) * mult; };
async function getCap(env) { const r = await env.DB.prepare("SELECT v FROM cfg WHERE k='cap'").first(); const v = r ? parseInt(r.v, 10) : NaN; return Number.isFinite(v) ? v : RW.capDefault; }
async function issue(env, pid, kind, week, now) {
  for (let i = 0; i < 5; i++) {
    const code = newCode();
    try {
      await env.DB.prepare('INSERT INTO coupon (code,pid,kind,week,created,expires) VALUES (?,?,?,?,?,?)').bind(code, pid, kind, week, now, now + RW.days * 864e5).run();
      return { code, kind, label: KIND_HI[kind], expires: now + RW.days * 864e5, used: 0 };
    } catch (e) { /* कोड टकराया — फिर */ }
  }
  throw new Error('code');
}
const weekCount = async (env, pid, kind, wk) => (await env.DB.prepare('SELECT COUNT(*) AS n FROM coupon WHERE pid=? AND kind=? AND week=?').bind(pid, kind, wk).first()).n;
async function loadCard(env, pid, now) {
  let c = await env.DB.prepare('SELECT * FROM card WHERE pid=?').bind(pid).first();
  if (!c) {
    await env.DB.prepare('INSERT OR IGNORE INTO card (pid,n,day,flags,created,ts) VALUES (?,?,?,?,?,?)').bind(pid, RW.bonus, '', 0, now, 0).run();
    c = { pid, n: RW.bonus, day: '', flags: 0, created: now, ts: 0, fresh: true };
  }
  if (c.day !== istDay(now)) { c.day = istDay(now); c.flags = 0; }
  return c;
}
// भरा कार्ड → रसगुल्ला कूपन (हफ़्ते की सीमा बची हो तो)
async function maybeRas(env, c, now) {
  if (c.n < RW.need) return null;
  const wk = weekKey(now);
  if (await weekCount(env, c.pid, 'ras', wk) >= RW.rasWeek) return null;
  const cp = await issue(env, c.pid, 'ras', wk, now); c.n = 0; return cp;
}
async function saveCard(env, c, now) { await env.DB.prepare('UPDATE card SET n=?, day=?, flags=?, ts=? WHERE pid=?').bind(c.n, c.day, c.flags, now, c.pid).run(); }
async function mine(env, pid, now) {
  const wk = weekKey(now), out = { got: [] };
  const c = await loadCard(env, pid, now);
  const r = await maybeRas(env, c, now); if (r) out.got.push(r);
  await saveCard(env, c, c.ts || 0);
  // पिछले हफ़्ते दरभंगा के टॉप 3?
  const lastWk = weekKey(now - 7 * 864e5);
  const top = (await env.DB.prepare("SELECT pid FROM best WHERE period=? AND city='darbhanga' ORDER BY score DESC, ts ASC LIMIT 3").bind(lastWk).all()).results || [];
  if (top.some((x) => x.pid === pid) && !(await weekCount(env, pid, 'top3', lastWk))) out.got.push(await issue(env, pid, 'top3', lastWk, now));
  const coupons = ((await env.DB.prepare('SELECT code,kind,expires,used FROM coupon WHERE pid=? AND (used=0 AND expires>? OR used>?) ORDER BY created DESC LIMIT 12').bind(pid, now, now - 2 * 864e5).all()).results || [])
    .map((x) => ({ ...x, label: KIND_HI[x.kind] || x.kind }));
  return {
    ok: true, n: c.n, need: RW.need, perDay: RW.perDay, fresh: !!c.fresh,
    today: { gold: !!(c.flags & 1), mission: !!(c.flags & 2), dist: !!(c.flags & 4) },
    rasWeek: await weekCount(env, pid, 'ras', wk), rasWeekMax: RW.rasWeek,
    offWeek: (await weekCount(env, pid, 'off', wk)) > 0, off: { score: RW.offScore, min: RW.offMin, amt: RW.offAmt },
    coupons, got: out.got, week: wk,
  };
}
async function couponInfo(env, code, now) {
  const c = await env.DB.prepare('SELECT * FROM coupon WHERE code=?').bind(code).first();
  const today = istDay(now), cap = await getCap(env);
  const rasToday = (await env.DB.prepare("SELECT COUNT(*) AS n FROM coupon WHERE kind='ras' AND used_day=?").bind(today).first()).n;
  if (!c) return { ok: true, status: 'nf', rasToday, cap };
  const status = c.used ? 'used' : (c.expires < now ? 'expired' : 'ok');
  return { ok: true, status, code: c.code, kind: c.kind, label: KIND_HI[c.kind] || c.kind, expires: c.expires, used: c.used, created: c.created, rasToday, cap,
    off: c.kind === 'off' ? { min: RW.offMin, amt: RW.offAmt } : null, gram: c.kind === 'top3' ? RW.topGram : null };
}

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
        const ops = [env.DB.prepare(up).bind(pid, wk, name, city, country, score, dist, now), env.DB.prepare(up).bind(pid, 'all', name, city, country, score, dist, now)];
        if (b.daily) ops.push(env.DB.prepare(up).bind(pid, 'D' + istDay(now), name, city, country, score, dist, now)); // 📅 आज का रास्ता
        await env.DB.batch(ops);
        return json(req, { ok: true, week: wk });
      }
      if (url.pathname === '/top' && req.method === 'GET') {
        const pq = url.searchParams.get('period'), period = pq === 'all' ? 'all' : pq === 'day' ? 'D' + istDay() : weekKey();
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
      if (url.pathname === '/ghost' && req.method === 'POST') {
        const b = await req.json(), now = Date.now(), day = istDay(now);
        const pid = String(b.pid || '');
        if (!okPid(pid)) return json(req, { ok: false, err: 'pid' }, 400);
        const name = cleanName(b.name); if (!name) return json(req, { ok: false, err: 'name' }, 400);
        const data = String(b.data || '');
        if (data.length < 8 || data.length > 9000 || !/^[A-Za-z0-9_-]+$/.test(data)) return json(req, { ok: false, err: 'data' }, 400);
        if (!plausible(b)) return json(req, { ok: false, err: 'check' }, 400);
        const score = Math.floor(+b.score), dist = Math.floor(+b.dist || 0), secs = +b.secs || 0, daily = b.daily ? 1 : 0;
        const city = CITIES.includes(b.city) ? b.city : '';
        if (Math.random() < 0.02) await env.DB.prepare('DELETE FROM ghost WHERE ts<?').bind(now - 30 * 864e5).run(); // पुरानी परछाइयाँ हटें
        if (daily) { // आज के रास्ते की: एक खिलाड़ी की एक
          const old = await env.DB.prepare('SELECT id, score FROM ghost WHERE pid=? AND day=? AND daily=1').bind(pid, day).first();
          if (old) {
            if (score > old.score) await env.DB.prepare('UPDATE ghost SET name=?, city=?, score=?, dist=?, secs=?, data=?, ts=? WHERE id=?').bind(name, city, score, dist, secs, data, now, old.id).run();
            return json(req, { ok: true, id: old.id, kept: score <= old.score });
          }
        } else {
          const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM ghost WHERE pid=? AND day=?').bind(pid, day).first()).n;
          if (n >= 20) return json(req, { ok: false, err: 'many' }, 429);
        }
        for (let i = 0; i < 5; i++) {
          const id = newCode().replace('-', '');
          try {
            await env.DB.prepare('INSERT INTO ghost (id,pid,name,city,day,daily,score,dist,secs,data,ts) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(id, pid, name, city, day, daily, score, dist, secs, data, now).run();
            return json(req, { ok: true, id });
          } catch (e) { /* id टकराया — फिर */ }
        }
        return json(req, { ok: false, err: 'id' }, 500);
      }
      if ((url.pathname === '/ghost' || url.pathname === '/ghost/top') && req.method === 'GET') {
        const g = url.pathname === '/ghost/top'
          ? await env.DB.prepare('SELECT id,name,city,day,daily,score,dist,secs,data FROM ghost WHERE daily=1 AND day=? ORDER BY score DESC, ts ASC LIMIT 1').bind(istDay()).first()
          : await env.DB.prepare('SELECT id,name,city,day,daily,score,dist,secs,data FROM ghost WHERE id=?').bind(String(url.searchParams.get('id') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)).first();
        if (!g) return json(req, { ok: false, err: 'none' });
        return json(req, { ok: true, ...g, today: g.day === istDay() });
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
      if (url.pathname === '/feedback' && req.method === 'POST') {
        const b = await req.json();
        const stars = intIn(b.stars, 0, 5, 0);
        if (!okPid(b.pid) || stars < 1) return json(req, { ok: false }, 400);
        const day = istDay(), now = Date.now();
        const cnt = await env.DB.prepare('SELECT COUNT(*) AS n FROM feedback WHERE day=?').bind(day).first();
        if (cnt.n > 3000) return json(req, { ok: false, busy: 1 }, 429); // मुफ़्त सीमा की रक्षा
        const tags = [...new Set((Array.isArray(b.tags) ? b.tags : []).filter((t) => TAGS.includes(t)))].slice(0, 6).join(',');
        const lang = ['en', 'hi', 'mai'].includes(b.lang) ? b.lang : '', src = SRCS.includes(b.src) ? b.src : 'web', dev = b.dev === 'pc' ? 'pc' : 'phone';
        const country = String((req.cf && req.cf.country) || '').slice(0, 2);
        await env.DB.prepare('INSERT INTO feedback (pid,day,ts,stars,tags,text,lang,src,dev,tier,runs,best,country,ver) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(pid,day) DO UPDATE SET ts=excluded.ts, stars=excluded.stars, tags=excluded.tags, text=excluded.text, lang=excluded.lang, tier=excluded.tier, runs=excluded.runs, best=excluded.best')
          .bind(b.pid, day, now, stars, tags, cleanText(b.text), lang, src, dev, intIn(b.tier, -1, 9, -1), intIn(b.runs, 0, 1e7, 0), intIn(b.best, 0, 1e7, 0), country, String(b.ver || '').slice(0, 16)).run();
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
      // ---- इनाम: खिलाड़ी ----
      if (url.pathname === '/mine' && req.method === 'POST') {
        const b = await req.json();
        if (!okPid(b.pid)) return json(req, { ok: false, err: 'pid' }, 400);
        return json(req, await mine(env, b.pid, Date.now()));
      }
      if (url.pathname === '/stamp' && req.method === 'POST') {
        const b = await req.json(), now = Date.now();
        if (!okPid(b.pid) || !WHY[b.why]) return json(req, { ok: false, err: 'bad' }, 400);
        if (!plausible(b) || (b.why === 'dist' && Math.floor(+b.dist || 0) < 1000)) return json(req, { ok: false, err: 'check' }, 400);
        const c = await loadCard(env, b.pid, now);
        if (c.flags & WHY[b.why]) return json(req, { ok: true, dup: true, n: c.n, need: RW.need });
        c.flags |= WHY[b.why];
        const wkFull = c.n >= RW.need;
        if (!wkFull) c.n = Math.min(RW.need, c.n + 1);
        const cp = await maybeRas(env, c, now);
        await saveCard(env, c, now);
        return json(req, { ok: true, n: c.n, need: RW.need, added: !wkFull, coupon: cp, full: c.n >= RW.need && !cp });
      }
      if (url.pathname === '/reward' && req.method === 'POST') {
        const b = await req.json(), now = Date.now();
        if (!okPid(b.pid)) return json(req, { ok: false, err: 'pid' }, 400);
        if (Math.floor(+b.score || 0) < RW.offScore || !plausible(b)) return json(req, { ok: false, err: 'check' }, 400);
        const wk = weekKey(now);
        if (await weekCount(env, b.pid, 'off', wk)) return json(req, { ok: true, already: true });
        return json(req, { ok: true, coupon: await issue(env, b.pid, 'off', wk, now) });
      }
      // ---- इनाम: दुकान (बिलिंग ऐप, ADMIN_KEY) ----
      if (url.pathname.startsWith('/coupon/') && req.method === 'POST') {
        const b = await req.json(), now = Date.now();
        if (!adminOk(env, b.key)) return json(req, { ok: false, err: 'key' }, 403);
        const code = cleanCode(b.code);
        if (!code) return json(req, { ok: false, err: 'code' }, 400);
        const info = await couponInfo(env, code, now);
        if (url.pathname === '/coupon/check') return json(req, info);
        if (url.pathname === '/coupon/use') {
          if (info.status !== 'ok') return json(req, { ...info, ok: false, err: info.status });
          if (info.kind === 'ras' && info.rasToday >= info.cap) return json(req, { ...info, ok: false, err: 'cap' });
          const r = await env.DB.prepare('UPDATE coupon SET used=?, used_day=? WHERE code=? AND used=0').bind(now, istDay(now), code).run();
          if (r && r.meta && r.meta.changes === 0) return json(req, { ...info, ok: false, err: 'used' });
          return json(req, { ...(await couponInfo(env, code, now)), ok: true });
        }
        if (url.pathname === '/coupon/undo') { // गलती से दबा — उसी दिन वापस
          if (info.status !== 'used' || istDay(info.used) !== istDay(now)) return json(req, { ...info, ok: false, err: 'undo' });
          await env.DB.prepare("UPDATE coupon SET used=0, used_day='' WHERE code=?").bind(code).run();
          return json(req, { ...(await couponInfo(env, code, now)), ok: true });
        }
        return json(req, { ok: false }, 404);
      }
      if (url.pathname === '/admin/config' && req.method === 'POST') {
        const b = await req.json();
        if (!adminOk(env, b.key)) return json(req, { ok: false, err: 'key' }, 403);
        if (b.cap != null) { const cap = Math.max(0, Math.min(500, Math.floor(+b.cap || 0))); await env.DB.prepare("INSERT INTO cfg (k,v) VALUES ('cap',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v").bind(String(cap)).run(); }
        const today = istDay(), wk = weekKey();
        const rasToday = (await env.DB.prepare("SELECT COUNT(*) AS n FROM coupon WHERE kind='ras' AND used_day=?").bind(today).first()).n;
        const week = (await env.DB.prepare('SELECT kind, COUNT(*) AS made, SUM(CASE WHEN used>0 THEN 1 ELSE 0 END) AS used FROM coupon WHERE week=? GROUP BY kind').bind(wk).all()).results;
        return json(req, { ok: true, cap: await getCap(env), rasToday, week, rules: RW });
      }
      return json(req, { ok: true, app: 'rasgulla-run-leaderboard' });
    } catch (e) {
      return json(req, { ok: false, err: 'server' }, 500);
    }
  },
};
