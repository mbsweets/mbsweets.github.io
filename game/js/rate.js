// ⭐ खिलाड़ियों की राय — सिर्फ़ अपनी वेबसाइट वाले गेम में (CrazyGames पर उनके अपने 👍👎 हैं)
// कब: तीसरी दौड़ के बाद गेम-ओवर पर एक छोटी पंक्ति "कैसा लगा? ☆☆☆☆☆" (पॉप-अप नहीं); "✕" या अनदेखा = 5 दौड़ बाद फिर, कुल 3 बार;
// राय दे दी तो फिर कभी अपने-आप नहीं (सेटिंग्स → "⭐ राय दो" से कभी भी). नेट न हो तो फ़ोन में रखो, अगली बार भेजो.
// जाता है: ⭐, छोटे बटन, एक लाइन, भाषा, फ़ोन/कंप्यूटर, ग्राफ़िक्स दर्जा, दौड़ें, सबसे लंबी दूरी — नाम/फ़ोन नहीं.
import { T, LANG } from './i18n.js';
import { store, storeNum, vibrate } from './util.js';

const $ = (s) => document.querySelector(s);
const GOOD = ['fun', 'gfx', 'world', 'rewards', 'voice'], BAD = ['lag', 'hard', 'confusing', 'boring', 'bugs'];
const TAG_IC = { fun: '😄', gfx: '🎨', world: '🌳', rewards: '🍬', voice: '🗣️', lag: '🐢', hard: '😣', confusing: '❓', boring: '😴', bugs: '🐞' };
const VER = '2026-11-17';
const ASK_AFTER = 3, ASK_GAP = 5, ASK_MAX = 3;

export class Rate {
  constructor(game, url, on) {
    this.g = game; this.url = url; this.on = !!(on && url);
    this.stars = 0; this.tags = new Set();
  }
  bind() {
    const sheet = $('#rateS');
    if (!this.on) { $('#overRate').hidden = true; return; }
    const mk = (box, cls) => { box.innerHTML = [1, 2, 3, 4, 5].map((k) => `<button class="${cls}" data-s="${k}" aria-label="${k}">★</button>`).join(''); };
    mk($('#overStars'), 'ost'); mk($('#rStars'), 'rst');
    $('#overStars').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) this.open(+b.dataset.s); });
    $('#overRateX').addEventListener('click', () => { $('#overRate').hidden = true; });
    $('#rStars').addEventListener('click', (e) => { const b = e.target.closest('[data-s]'); if (b) this.pick(+b.dataset.s); });
    $('#rTags').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tag]'); if (!b) return;
      const t = b.dataset.tag; if (this.tags.has(t)) this.tags.delete(t); else this.tags.add(t);
      b.classList.toggle('on', this.tags.has(t)); this.g.sound.click();
    });
    $('#rSend').addEventListener('click', () => this.send());
    $('#rateX').addEventListener('click', () => this.close());
    $('#rShare').addEventListener('click', () => { this.close(); this.g.share(); });
    sheet.addEventListener('click', (e) => { if (e.target === sheet) this.close(); });
    this.flush();
  }
  // गेम-ओवर पर: पूछना है? (कुछ दौड़ों के बाद, बार-बार नहीं)
  maybeAsk() {
    const row = $('#overRate');
    if (!this.on || store('rated')) { row.hidden = true; return; }
    const plays = storeNum('plays'), asks = storeNum('rateAsk'), next = storeNum('rateNext', ASK_AFTER);
    if (plays < ASK_AFTER || plays < next || asks >= ASK_MAX) { row.hidden = true; return; }
    store('rateAsk', asks + 1); store('rateNext', plays + ASK_GAP);
    for (const b of row.querySelectorAll('.ost')) b.classList.remove('on');
    row.hidden = false;
  }
  open(stars = 0) {
    if (!this.on) return;
    this.tags = new Set(); this.stars = 0;
    $('#rText').value = '';
    $('#rMore').hidden = true; $('#rDone').hidden = true; $('#rForm').hidden = false;
    $('#rLbl').textContent = '';
    $('#rateS').hidden = false;
    if (stars) this.pick(stars); else this.paintStars();
  }
  close() { $('#rateS').hidden = true; clearTimeout(this.closeT); }
  paintStars() { for (const b of document.querySelectorAll('#rStars .rst')) b.classList.toggle('on', +b.dataset.s <= this.stars); }
  pick(k) {
    const was = this.stars >= 4, now = k >= 4;
    this.stars = k; this.paintStars();
    const pop = $(`#rStars .rst[data-s="${k}"]`); if (pop) { pop.classList.remove('pop'); void pop.offsetWidth; pop.classList.add('pop'); }
    $('#rLbl').textContent = T('r' + k);
    vibrate(15); this.g.sound.click();
    if ($('#rMore').hidden || was !== now) { // अच्छा/ख़राब बदला → बटन बदलो
      this.tags = new Set();
      const list = now ? GOOD : BAD;
      $('#rTagQ').textContent = T(now ? 'rateGoodQ' : 'rateBadQ');
      $('#rTags').innerHTML = list.map((t) => `<button class="rtag" data-tag="${t}">${TAG_IC[t]} ${T('t_' + t)}</button>`).join('');
      $('#rText').placeholder = T(now ? 'ratePhG' : 'ratePhB');
      $('#rMore').hidden = false;
    }
  }
  body() {
    const st = this.g;
    let best = 0; try { best = Math.floor((JSON.parse(localStorage.getItem('rr-stats') || '{}').bestDist) || 0); } catch (e) { /* */ }
    return {
      pid: st.lb.pid, stars: this.stars, tags: [...this.tags],
      text: $('#rText').value.replace(/(\+?\d[\d\s-]{6,}\d)/g, '***').slice(0, 200), // फ़ोन नंबर यहीं से कटे
      lang: LANG, src: 'web', dev: matchMedia('(pointer: coarse)').matches ? 'phone' : 'pc',
      tier: st.tier ?? -1, runs: storeNum('plays'), best, ver: VER,
    };
  }
  async post(b) {
    const r = await fetch(this.url + '/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b) });
    const d = await r.json(); if (!d.ok) throw new Error('fail');
  }
  async send() {
    if (!this.stars) return;
    const b = this.body(), good = this.stars >= 4;
    store('rated', new Date().toISOString().slice(0, 10)); store('rateStars', this.stars);
    $('#overRate').hidden = true;
    $('#rSend').disabled = true;
    let ok = true;
    try { await this.post(b); } catch (e) { ok = false; store('ratePend', JSON.stringify(b)); }
    $('#rSend').disabled = false;
    $('#rForm').hidden = true; $('#rDone').hidden = false;
    $('#rThanksT').textContent = T('rateThanks');
    $('#rThanksP').textContent = (good ? T('rateThanksG') : T('rateThanksB')) + (ok ? '' : ' (' + T('rateOffline') + ')');
    $('#rShare').hidden = !good;
    this.g.sound.power(); vibrate([20, 40, 20]);
    this.closeT = setTimeout(() => this.close(), good ? 6000 : 3500);
  }
  // पिछली बार नेट नहीं था — अब भेजो
  async flush() {
    const p = store('ratePend'); if (!p || p === 'null') return;
    try { await this.post(JSON.parse(p)); store('ratePend', ''); } catch (e) { /* अगली बार */ }
  }
}
