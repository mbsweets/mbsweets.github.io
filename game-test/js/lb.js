// लीडरबोर्ड — दरभंगा (अपना शहर) / भारत / दुनिया, इस हफ़्ते / सब दिन
// सर्वर: _src/leaderboard/worker.js (Cloudflare Worker + D1)। LB_URL खाली = लीडरबोर्ड छिपा।
import { T, LANG } from './i18n.js';
import { store } from './util.js';

export const LB_URL = 'https://rasgulla-lb.pankajgupta800201.workers.dev'; // मालिक का Cloudflare Worker (14 नवंबर 2026, repo mbsweets/rasgulla-lb से अपने-आप deploy)

export const CITIES = [
  ['darbhanga', 'दरभंगा', 'Darbhanga'], ['madhubani', 'मधुबनी', 'Madhubani'], ['samastipur', 'समस्तीपुर', 'Samastipur'],
  ['sitamarhi', 'सीतामढ़ी', 'Sitamarhi'], ['muzaffarpur', 'मुज़फ़्फ़रपुर', 'Muzaffarpur'], ['saharsa', 'सहरसा', 'Saharsa'],
  ['supaul', 'सुपौल', 'Supaul'], ['patna', 'पटना', 'Patna'], ['bihar', 'बिहार (दोसर शहर)', 'Bihar (other)'],
  ['india', 'भारत (दोसर राज्य)', 'India (other)'], ['abroad', 'विदेश', 'Outside India'],
];
const hiCity = (t) => (LANG === 'hi' ? t.replace('दोसर शहर', 'दूसरा शहर').replace('दोसर राज्य', 'दूसरा राज्य') : t);
const cityName = (k) => { const c = CITIES.find((x) => x[0] === k) || CITIES[CITIES.length - 1]; return LANG === 'en' ? c[2] : hiCity(c[1]); };
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export class Leaderboard {
  constructor() {
    let url = LB_URL;
    const q = new URLSearchParams(location.search).get('lb'); // सिर्फ़ लोकल जाँच के लिए
    if (q && /^(127\.0\.0\.1|localhost)$/.test(location.hostname)) url = q;
    this.url = url.replace(/\/$/, '');
    this.on = !!this.url;
    this.pid = store('pid');
    if (!this.pid || !/^[a-z0-9]{12,40}$/.test(this.pid)) {
      const a = new Uint8Array(12); (crypto || window.crypto).getRandomValues(a);
      this.pid = Array.from(a, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36);
      store('pid', this.pid);
    }
    this.scope = 'city'; this.period = 'week';
  }
  get name() { return store('lbname') || ''; }
  get city() { return store('lbcity') || 'darbhanga'; }
  get vil() { return store('lbvil') || ''; }
  // 🏘️ गाँव/मोहल्ला (जरूरी नहीं): 2–24 अक्षर, अंक नहीं — '' = हटाओ; false = गलत नाम
  static cleanVil(v) { if (/[\d\u0966-\u096F]/.test(String(v || ''))) return false; v = String(v || '').replace(/[^\p{L}\p{M}\s.-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 24); return !v ? '' : v.length < 2 ? false : v; }
  async setVil(v) {
    store('lbvil', v);
    if (!this.on) return;
    try { await fetch(this.url + '/village', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: this.pid, vil: v }) }); } catch (e) { /* अगले स्कोर के साथ चला जाएगा */ }
  }
  async league() { const r = await fetch(`${this.url}/league?pid=${this.pid}`); return r.json(); }
  // गाँवों के नाम सुझाव (datalist) — एक ही गाँव अलग-अलग लिखा न जाए
  async fillVilList() {
    const dl = $('#vilList'); if (!dl || !this.on || this._vl) return;
    try { const d = await this.league(); if (d.ok) { this._vl = 1; dl.innerHTML = d.rows.map((r) => `<option value="${esc(r.name)}">`).join(''); } } catch (e) { /* */ }
  }
  async submit(score, dist, secs) {
    if (!this.on || !this.name || score <= 0) return null;
    try {
      const r = await fetch(this.url + '/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: this.pid, name: this.name, city: this.city, score: Math.floor(score), dist: Math.floor(dist), secs: +secs.toFixed(1), mult: this.mult || 1, daily: this.daily ? 1 : 0, vil: this.vil || undefined }) });
      return await r.json();
    } catch (e) { return null; }
  }
  // 👻 परछाईं: भेजो / लाओ
  async putGhost(o) {
    if (!this.on || !this.name) return null;
    try {
      const r = await fetch(this.url + '/ghost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: this.pid, name: this.name, city: this.city, mult: this.mult || 1, ...o }) });
      const d = await r.json(); return d.ok ? d.id : null;
    } catch (e) { return null; }
  }
  async getGhost(id) { if (!this.on) return null; try { const d = await (await fetch(`${this.url}/ghost?id=${encodeURIComponent(id)}`)).json(); return d.ok ? d : null; } catch (e) { return null; } }
  async topGhost() { if (!this.on) return null; try { const d = await (await fetch(`${this.url}/ghost/top`)).json(); return d.ok ? d : null; } catch (e) { return null; } }
  async top(scope, period) {
    const u = `${this.url}/top?scope=${scope}&city=${this.city}&period=${period}&pid=${this.pid}`;
    const r = await fetch(u); return r.json();
  }
  // ---------------- UI ----------------
  bind(onClose) {
    this.onClose = onClose;
    for (const b of document.querySelectorAll('.lbbtn')) b.hidden = !this.on;
    $('#lbClose').addEventListener('click', () => this.close());
    for (const t of document.querySelectorAll('#lbTabs button')) t.addEventListener('click', () => { this.scope = t.dataset.s; this.load(); });
    if ($('#lbVilAdd')) $('#lbVilAdd').addEventListener('click', () => this.showForm());
    for (const t of document.querySelectorAll('#lbPer button')) t.addEventListener('click', () => { this.period = t.dataset.p; this.load(); });
    $('#lbSave').addEventListener('click', () => this.saveProfile());
    $('#lbEdit').addEventListener('click', () => this.showForm());
    const sel = $('#lbCity');
    sel.innerHTML = CITIES.map((c) => `<option value="${c[0]}">${LANG === 'en' ? c[2] : hiCity(c[1])}</option>`).join('');
  }
  open() {
    $('#lbS').hidden = false;
    $('#lbCity').innerHTML = CITIES.map((c) => `<option value="${c[0]}">${LANG === 'en' ? c[2] : hiCity(c[1])}</option>`).join('');
    $('#lbTabs button[data-s="city"]').textContent = cityName(this.city);
    if (!this.name) this.showForm(); else { $('#lbForm').hidden = true; this.load(); }
  }
  close() { $('#lbS').hidden = true; if (this.onClose) this.onClose(); }
  // पहली बार खुलते ही नाम और ज़िला (लीडरबोर्ड + दुकान के इनाम के लिए) — "बाद में" भी चुन सकते हैं
  askProfile(done) {
    const s = $('#profS'); if (!s) { if (done) done(); return; }
    store('profAsk', 1);
    $('#pfName').value = this.name; $('#pfMsg').textContent = '';
    $('#pfCity').innerHTML = CITIES.map((c) => `<option value="${c[0]}">${LANG === 'en' ? c[2] : hiCity(c[1])}</option>`).join('');
    $('#pfCity').value = this.city;
    if ($('#pfVil')) $('#pfVil').value = this.vil;
    this.fillVilList();
    s.hidden = false;
    const fin = () => { s.hidden = true; if (done) done(); };
    $('#pfGo').onclick = (e) => {
      e.preventDefault();
      const n = $('#pfName').value.replace(/\s+/g, ' ').trim().slice(0, 16);
      if (n.length < 2 || /\d{6,}/.test(n.replace(/\s/g, ''))) { $('#pfName').focus(); $('#pfMsg').textContent = T('lbNameErr'); return; }
      const v = $('#pfVil') ? Leaderboard.cleanVil($('#pfVil').value) : '';
      if (v === false) { $('#pfVil').focus(); $('#pfMsg').textContent = T('vilErr'); return; }
      store('lbname', n); store('lbcity', $('#pfCity').value);
      if (v !== this.vil) this.setVil(v);
      fin();
    };
    $('#pfLater').onclick = (e) => { e.preventDefault(); fin(); };
  }
  showForm() {
    $('#lbForm').hidden = false; $('#lbList').innerHTML = ''; $('#lbMe').textContent = '';
    $('#lbName').value = this.name; $('#lbCity').value = this.city;
    if ($('#lbVil')) $('#lbVil').value = this.vil;
    if ($('#lbLeague')) $('#lbLeague').hidden = true;
    this.fillVilList();
  }
  saveProfile() {
    const n = $('#lbName').value.replace(/\s+/g, ' ').trim().slice(0, 16);
    if (n.length < 2 || /\d{6,}/.test(n.replace(/\s/g, ''))) { $('#lbName').focus(); $('#lbMsg').textContent = T('lbNameErr'); return; }
    const v = $('#lbVil') ? Leaderboard.cleanVil($('#lbVil').value) : '';
    if (v === false) { $('#lbVil').focus(); $('#lbMsg').textContent = T('vilErr'); return; }
    store('lbname', n); store('lbcity', $('#lbCity').value);
    if (v !== this.vil) this.setVil(v);
    $('#lbMsg').textContent = '';
    $('#lbForm').hidden = true;
    if (this.pending) { const p = this.pending; this.pending = null; this.submit(p.score, p.dist, p.secs).then(() => this.load()); } else this.load();
  }
  async load() {
    for (const t of document.querySelectorAll('#lbTabs button')) t.classList.toggle('on', t.dataset.s === this.scope);
    for (const t of document.querySelectorAll('#lbPer button')) t.classList.toggle('on', t.dataset.p === this.period);
    $('#lbTabs button[data-s="city"]').textContent = cityName(this.city);
    const list = $('#lbList'); list.innerHTML = `<p class="lbnote">${T('loading')}</p>`;
    $('#lbPer').hidden = this.scope === 'vil';
    if ($('#lbLeague')) $('#lbLeague').hidden = this.scope !== 'vil';
    if (this.scope === 'vil') return this.loadLeague();
    try {
      const d = await this.top(this.scope, this.period);
      if (!d.ok) throw new Error('x');
      list.innerHTML = d.rows.length ? d.rows.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span>${esc(r.name)}<small>${esc(cityName(r.city))}${r.country && r.country !== 'IN' ? ' · ' + esc(r.country) : ''}</small></span><em>${r.score.toLocaleString('en-IN')}</em></li>`).join('') : `<p class="lbnote">${T('lbEmpty')}</p>`;
      $('#lbMe').textContent = d.me ? `${T('lbMyRank')}: #${d.me.rank}  (${d.me.score.toLocaleString('en-IN')})` : '';
    } catch (e) { list.innerHTML = `<p class="lbnote">${T('lbErr')}</p>`; }
  }
  // 🏘️ गाँव बनाम गाँव — हफ़्ते का कुल (हर खिलाड़ी का सबसे अच्छा). इनाम सिर्फ़ 50+ खिलाड़ी वाले विजेता गाँव को
  async loadLeague() {
    const list = $('#lbList'), me = $('#lbMe'), info = $('#lbLeague');
    try {
      const d = await this.league();
      if (!d.ok) throw new Error('x');
      $('#vlRule').textContent = T('vilRule', d.min, d.top);
      $('#vlLast').textContent = d.last ? T('vilLast', d.last.name, d.last.ok) : '';
      $('#vlLast').hidden = !d.last;
      $('#lbVilAdd').hidden = !!this.vil;
      list.innerHTML = d.rows.length ? d.rows.map((r, i) => {
        const k = Math.min(1, r.players / d.min), mine = d.me && d.me.rank === i + 1;
        return `<li class="vl${mine ? ' me' : ''}"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span>${esc(r.name)}<small>${T('vilPlayers', r.players, d.min)}</small><i class="vbar"><i style="width:${(k * 100).toFixed(0)}%"></i></i></span><em>${r.total.toLocaleString('en-IN')}</em></li>`;
      }).join('') : `<p class="lbnote">${T('vilEmpty')}</p>`;
      me.textContent = d.me ? T('vilMe', d.me.village, d.me.rank, d.me.players, d.min) : '';
      info.hidden = false;
    } catch (e) { list.innerHTML = `<p class="lbnote">${T('lbErr')}</p>`; me.textContent = ''; }
  }
  // गेम ख़त्म: स्कोर भेजो (नाम हो तो), नहीं तो बाद में भेजने के लिए रखो
  async afterGame(score, dist, secs, mult = 1) {
    this.mult = mult;
    if (!this.on || score <= 0) return;
    const el = $('#overLb');
    if (!this.name) { this.pending = { score, dist, secs }; el.textContent = T('lbJoin'); el.hidden = false; return; }
    el.textContent = '…'; el.hidden = false;
    const r = await this.submit(score, dist, secs);
    if (!r || !r.ok) { el.textContent = ''; el.hidden = true; return; }
    try {
      if (this.daily) { const d = await this.top('world', 'day'); el.textContent = d.me ? `📅 ${T('dailyOn')} — ${T('lbMyRank')} #${d.me.rank}` : ''; return; }
      const d = await this.top('city', 'week');
      el.textContent = d.me ? `🏆 ${cityName(this.city)} — ${T('lbMyRank')} #${d.me.rank} (${T('lbWeek')})` : '';
    } catch (e) { el.hidden = true; }
  }
}
