// 🎫 दुकान के इनाम — सिर्फ़ अपनी वेबसाइट वाले गेम में (पोर्टल पर नहीं)
// स्टैम्प कार्ड: 10 = दुकान पर 1 रसगुल्ला मुफ़्त (शुरू में 2 मुफ़्त; दिन में 3 तक: सोनाक रसगुल्ला / कोनो मिशन / 1000 मी.)
// एक मोबाइल को हफ़्ते में 2 मुफ़्त रसगुल्ले तक; एक दौड़ में 20,000+ → ₹200+ मिठाई/नमकीन पर ₹20 छूट (हफ़्ते में 1);
// दरभंगा हफ़्ते के टॉप 3 → 250 ग्राम। सर्वर: Cloudflare Worker (repo mbsweets/rasgulla-lb), गिनती/सीमा वहीं।
import { T, LANG } from './i18n.js';
import { store } from './util.js';

const $ = (s) => document.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const fmtDate = (ms) => { const d = new Date(ms + 5.5 * 3600e3); return d.getUTCDate() + ' ' + (LANG === 'hi' ? ['जन', 'फ़र', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अग', 'सित', 'अक्टू', 'नव', 'दिस'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])[d.getUTCMonth()]; };

export class Rewards {
  constructor(lb, on) {
    this.lb = lb; this.on = !!(on && lb && lb.url);
    this.st = null; // सर्वर से आख़िरी हाल
    this.busy = false;
  }
  get url() { return this.lb.url; }
  get pid() { return this.lb.pid; }
  async post(path, body) {
    const r = await fetch(this.url + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pid: this.pid, ...body }) });
    return r.json();
  }
  // आज सोनाक रसगुल्ला अभी बाकी है? (गेम उसी हिसाब से दौड़ में रखता है)
  goldWanted() { return this.on && !(this.st && this.st.today && this.st.today.gold) && store('rwGold') !== istDay(); }
  async refresh() {
    if (!this.on) return null;
    try {
      await this.flushPending();
      const d = await this.post('/mine', {});
      if (d && d.ok) { this.st = d; if (d.today && d.today.gold) store('rwGold', istDay()); this.paintBadge(); }
      return d;
    } catch (e) { return null; }
  }
  // नेट न हो तो उसी दिन बाद में भेजो
  async flushPending() {
    const p = store('rwPend');
    if (!p) return;
    store('rwPend', null);
    try { const o = JSON.parse(p); if (o.day === istDay()) await this.send(o.runs, o.score, true); } catch (e) { /* छोड़ो */ }
  }
  // दौड़ ख़त्म: {gold, mission, dist, score, distM, secs, mult}
  async afterGame(run) {
    if (!this.on) return;
    const el = $('#overRw');
    const why = [];
    if (run.gold) why.push('gold');
    if (run.mission) why.push('mission');
    if (run.distM >= 1000) why.push('dist');
    const wantOff = run.score >= ((this.st && this.st.off && this.st.off.score) || 20000) && !(this.st && this.st.offWeek);
    if (!why.length && !wantOff) { el.hidden = true; return; }
    el.hidden = false; el.textContent = '…';
    const body = { score: Math.floor(run.score), dist: Math.floor(run.distM), secs: +run.secs.toFixed(1), mult: run.mult || 1 };
    const res = await this.send(why.map((w) => ({ why: w, ...body })), wantOff ? body : null);
    if (!res) { el.textContent = T('rwLater'); return; }
    const parts = [];
    if (res.added) parts.push(T('rwStamp', res.added, res.n, res.need));
    for (const c of res.coupons) parts.push(`🎉 ${T('rwGot')} <b>${esc(c.code)}</b>`);
    if (res.full) parts.push(T('rwFull'));
    if (!parts.length) { el.hidden = true; return; }
    el.innerHTML = parts.join('<br>') + `<br><u>${T('rwOpen')}</u>`;
    await this.refresh();
  }
  async send(runs, offBody, quiet) {
    let added = 0, n = this.st ? this.st.n : 0, need = 10, full = false; const coupons = [];
    try {
      for (const r of runs) {
        const d = await this.post('/stamp', r);
        if (!d || !d.ok) continue;
        if (d.added) added++;
        n = d.n; need = d.need || 10;
        if (d.coupon) coupons.push(d.coupon);
        if (d.full) full = true;
        if (r.why === 'gold') store('rwGold', istDay());
      }
      if (offBody) { const d = await this.post('/reward', offBody); if (d && d.coupon) coupons.push(d.coupon); }
      return { added, n, need, coupons, full };
    } catch (e) {
      if (!quiet) store('rwPend', JSON.stringify({ day: istDay(), runs, score: offBody }));
      return null;
    }
  }
  paintBadge() {
    const b = $('#btnRw'); if (!b) return;
    const st = this.st, live = st ? st.coupons.filter((c) => !c.used && c.expires > Date.now()).length : 0;
    b.innerHTML = `${T('rwBtn')}${st ? ` <small>${st.n}/${st.need}</small>` : ''}${live ? ` <i>${live}</i>` : ''}`;
  }
  // ---------------- स्क्रीन ----------------
  bind() {
    $('#btnRw').hidden = !this.on; $('#overRw').hidden = true;
    if (!this.on) return;
    $('#btnRw').addEventListener('click', () => this.open());
    $('#overRw').addEventListener('click', () => this.open());
    $('#rwClose').addEventListener('click', () => { $('#rwS').hidden = true; });
    const soon = document.querySelector('[data-t="soon"]'); if (soon) { soon.dataset.t = 'rwSoon'; soon.textContent = T('rwSoon'); }
    this.paintBadge();
    this.refresh();
  }
  async open() {
    $('#rwS').hidden = false;
    this.paint();
    await this.refresh();
    this.paint();
  }
  paint() {
    const st = this.st;
    const box = $('#rwBody');
    if (!st) { box.innerHTML = `<p class="lbnote">${T('loading')}</p>`; return; }
    const dots = Array.from({ length: st.need }, (_, i) => `<span class="${i < st.n ? 'on' : ''}">${i < st.n ? '🍬' : i + 1}</span>`).join('');
    const task = (k, txt) => `<li class="${st.today[k] ? 'ok' : ''}">${st.today[k] ? '✅' : '⬜'} ${txt}</li>`;
    const live = st.coupons.filter((c) => !c.used && c.expires > Date.now()), used = st.coupons.filter((c) => c.used);
    const cp = (c, u) => `<div class="rwcp${u ? ' used' : ''}"><small>${esc(c.label)}</small><b>${esc(c.code)}</b><em>${u ? T('rwUsed') : T('rwUntil', fmtDate(c.expires))}</em></div>`;
    box.innerHTML = `
      <p class="rwhead">${T('rwCard')}</p>
      <div class="rwst">${dots}</div>
      <p class="lbnote">${st.n >= st.need ? T('rwFull') : T('rwLeft', st.need - st.n)} · ${T('rwWeek', st.rasWeek, st.rasWeekMax)}</p>
      <div class="rwtoday"><b>${T('rwToday')}</b><ul>${task('gold', T('rwGold'))}${task('mission', T('rwMission'))}${task('dist', T('rwDist'))}</ul></div>
      <div class="rwbox"><b>${T('rwCoupons')}</b>${live.length ? `<p class="lbnote">${T('rwShow')}</p>` + live.map((c) => cp(c, false)).join('') : `<p class="lbnote">${T('rwNone')}</p>`}${used.map((c) => cp(c, true)).join('')}</div>
      <div class="rwbox"><b>${T('rwMore')}</b><ul class="rwlist"><li>${T('rwOff', st.off.score.toLocaleString('en-IN'), st.off.amt, st.off.min)}${st.offWeek ? ' ✅' : ''}</li><li>${T('rwTop')}</li></ul></div>
      <details class="rwrules"><summary>${T('rwRulesT')}</summary><ul>${T('rwRules').map((x) => `<li>${x}</li>`).join('')}</ul></details>`;
  }
}
