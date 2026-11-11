// लीडरबोर्ड — दरभंगा (अपना शहर) / भारत / दुनिया, इस हफ़्ते / सब दिन
// सर्वर: _src/leaderboard/worker.js (Cloudflare Worker + D1)। LB_URL खाली = लीडरबोर्ड छिपा।
import { T, LANG } from './i18n.js';
import { store } from './util.js';

export const LB_URL = ''; // मालिक का Cloudflare Worker पता यहाँ (जैसे https://rasgulla-lb.xxxx.workers.dev)

export const CITIES = [
  ['darbhanga', 'दरभंगा', 'Darbhanga'], ['madhubani', 'मधुबनी', 'Madhubani'], ['samastipur', 'समस्तीपुर', 'Samastipur'],
  ['sitamarhi', 'सीतामढ़ी', 'Sitamarhi'], ['muzaffarpur', 'मुज़फ़्फ़रपुर', 'Muzaffarpur'], ['saharsa', 'सहरसा', 'Saharsa'],
  ['supaul', 'सुपौल', 'Supaul'], ['patna', 'पटना', 'Patna'], ['bihar', 'बिहार (दोसर शहर)', 'Bihar (other)'],
  ['india', 'भारत (दोसर राज्य)', 'India (other)'], ['abroad', 'विदेश', 'Outside India'],
];
const cityName = (k) => { const c = CITIES.find((x) => x[0] === k) || CITIES[CITIES.length - 1]; return LANG === 'hi' ? c[1] : c[2]; };
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
  async submit(score, dist, secs) {
    if (!this.on || !this.name || score <= 0) return null;
    try {
      const r = await fetch(this.url + '/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: this.pid, name: this.name, city: this.city, score: Math.floor(score), dist: Math.floor(dist), secs: +secs.toFixed(1) }) });
      return await r.json();
    } catch (e) { return null; }
  }
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
    for (const t of document.querySelectorAll('#lbPer button')) t.addEventListener('click', () => { this.period = t.dataset.p; this.load(); });
    $('#lbSave').addEventListener('click', () => this.saveProfile());
    $('#lbEdit').addEventListener('click', () => this.showForm());
    const sel = $('#lbCity');
    sel.innerHTML = CITIES.map((c) => `<option value="${c[0]}">${LANG === 'hi' ? c[1] : c[2]}</option>`).join('');
  }
  open() {
    $('#lbS').hidden = false;
    $('#lbTabs button[data-s="city"]').textContent = cityName(this.city);
    if (!this.name) this.showForm(); else { $('#lbForm').hidden = true; this.load(); }
  }
  close() { $('#lbS').hidden = true; if (this.onClose) this.onClose(); }
  showForm() {
    $('#lbForm').hidden = false; $('#lbList').innerHTML = ''; $('#lbMe').textContent = '';
    $('#lbName').value = this.name; $('#lbCity').value = this.city;
  }
  saveProfile() {
    const n = $('#lbName').value.replace(/\s+/g, ' ').trim().slice(0, 16);
    if (n.length < 2 || /\d{6,}/.test(n.replace(/\s/g, ''))) { $('#lbName').focus(); $('#lbMsg').textContent = T('lbNameErr'); return; }
    store('lbname', n); store('lbcity', $('#lbCity').value);
    $('#lbMsg').textContent = '';
    $('#lbForm').hidden = true;
    if (this.pending) { const p = this.pending; this.pending = null; this.submit(p.score, p.dist, p.secs).then(() => this.load()); } else this.load();
  }
  async load() {
    for (const t of document.querySelectorAll('#lbTabs button')) t.classList.toggle('on', t.dataset.s === this.scope);
    for (const t of document.querySelectorAll('#lbPer button')) t.classList.toggle('on', t.dataset.p === this.period);
    $('#lbTabs button[data-s="city"]').textContent = cityName(this.city);
    const list = $('#lbList'); list.innerHTML = `<p class="lbnote">${T('loading')}</p>`;
    try {
      const d = await this.top(this.scope, this.period);
      if (!d.ok) throw new Error('x');
      list.innerHTML = d.rows.length ? d.rows.map((r, i) => `<li class="${r.me ? 'me' : ''}"><b>${i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}</b><span>${esc(r.name)}<small>${esc(cityName(r.city))}${r.country && r.country !== 'IN' ? ' · ' + esc(r.country) : ''}</small></span><em>${r.score.toLocaleString('en-IN')}</em></li>`).join('') : `<p class="lbnote">${T('lbEmpty')}</p>`;
      $('#lbMe').textContent = d.me ? `${T('lbMyRank')}: #${d.me.rank}  (${d.me.score.toLocaleString('en-IN')})` : '';
    } catch (e) { list.innerHTML = `<p class="lbnote">${T('lbErr')}</p>`; }
  }
  // गेम ख़त्म: स्कोर भेजो (नाम हो तो), नहीं तो बाद में भेजने के लिए रखो
  async afterGame(score, dist, secs) {
    if (!this.on || score <= 0) return;
    const el = $('#overLb');
    if (!this.name) { this.pending = { score, dist, secs }; el.textContent = T('lbJoin'); el.hidden = false; return; }
    el.textContent = '…'; el.hidden = false;
    const r = await this.submit(score, dist, secs);
    if (!r || !r.ok) { el.textContent = ''; el.hidden = true; return; }
    try {
      const d = await this.top('city', 'week');
      el.textContent = d.me ? `🏆 ${cityName(this.city)} — ${T('lbMyRank')} #${d.me.rank} (${T('lbWeek')})` : '';
    } catch (e) { el.hidden = true; }
  }
}
