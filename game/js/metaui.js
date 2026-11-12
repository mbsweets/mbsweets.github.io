// मिशन / अपग्रेड / सेटिंग्स वाली खिड़की + रोज़ का इनाम
import { T, LANG, setLang } from './i18n.js';
import { SETTINGS, saveSettings, wallet, UPG, UPG_COST, upLevel, upTime, buyUp, DAILY, dailyState, claimDaily } from './meta.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.floor(n).toLocaleString('en-IN');
const RG = '<i class="rg"></i>';

export class MetaUI {
  constructor(game) {
    this.g = game; this.tab = 'ms';
    for (const b of document.querySelectorAll('#metaTabs button')) b.addEventListener('click', () => { this.g.sound.click(); this.show(b.dataset.m); });
    $('#metaClose').addEventListener('click', () => { this.g.sound.click(); this.close(); });
    $('#dailyGet').addEventListener('click', () => this.claim());
    $('#metaBody').addEventListener('click', (e) => this.onClick(e));
  }
  open(tab = 'ms') { $('#metaS').hidden = false; this.show(tab); }
  close() { $('#metaS').hidden = true; this.g.refreshMenu(); }
  show(tab) {
    this.tab = tab;
    for (const b of document.querySelectorAll('#metaTabs button')) b.classList.toggle('on', b.dataset.m === tab);
    $('#metaWallet').innerHTML = `${RG}<b>${fmt(wallet.v)}</b>`;
    const body = $('#metaBody');
    if (tab === 'ms') body.innerHTML = this.htmlMissions();
    else if (tab === 'up') body.innerHTML = this.htmlUpgrades();
    else body.innerHTML = this.htmlSettings();
  }
  // ---------- मिशन ----------
  htmlMissions() {
    const ms = this.g.ms;
    let h = '';
    for (const m of ms.st.act) {
      const pc = Math.min(100, (m.p / m.n) * 100), done = m.p >= m.n;
      h += `<div class="ms${done ? ' done' : ''}"><div class="mst">${done ? '✅ ' : '🎯 '}${ms.text(m)}</div>
        <div class="msb"><i style="width:${pc}%"></i></div>
        <div class="msr"><span>${fmt(m.p)} / ${fmt(m.n)}</span><em>${T('msReward')}: +${ms.reward(m)} ${RG}</em></div></div>`;
    }
    h += `<p class="lbnote">${T('msNote')}</p>`;
    // रोज़ का इनाम — 7 दिन
    const d = dailyState();
    h += `<h3>${T('daily')}</h3><div class="days">${this.htmlDays(d)}</div>`;
    h += d.can ? `<button class="big mini" data-act="daily">${T('claim')} +${DAILY[d.day - 1]}</button>` : `<p class="lbnote">${T('dailyDone')}</p>`;
    return h;
  }
  htmlDays(d) {
    const cur = d.can ? d.day : d.day; // आज वाला दिन
    return DAILY.map((a, i) => {
      const n = i + 1, got = d.can ? n < cur : n <= cur, today = n === cur;
      return `<div class="day${got ? ' got' : ''}${today && d.can ? ' now' : ''}"><small>${T('day')} ${n}</small><b>${got ? '✔' : '+' + a}</b></div>`;
    }).join('');
  }
  // ---------- अपग्रेड ----------
  htmlUpgrades() {
    let h = `<p class="lbnote">${T('upNote')}</p>`;
    const NAME = { magnet: T('magnet'), shoes: T('shoes'), thali: T('thali'), samosa: T('samosaS') };
    for (const u of UPG) {
      const lv = upLevel(u.k), max = lv >= 5, cost = UPG_COST[lv];
      const pips = Array.from({ length: 5 }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      const nx = max ? '' : ` → <b>${u.base + u.step * (lv + 1)}</b>`;
      h += `<div class="up"><b class="upi">${u.icon}</b><div class="upm"><div class="upn">${NAME[u.k]}</div><div class="pips">${pips}</div>
        <small>${upTime(u.k)}${nx} ${T('sec')}</small></div>
        <button class="upb${max ? ' max' : wallet.v < cost ? ' poor' : ''}" data-up="${u.k}"${max ? ' disabled' : ''}>${max ? T('max') : RG + fmt(cost)}</button></div>`;
    }
    return h;
  }
  // ---------- सेटिंग्स ----------
  htmlSettings() {
    const s = this.g.sound;
    const tog = (k, on) => `<button class="tg${on ? ' on' : ''}" data-set="${k}">${on ? T('on') : T('off')}</button>`;
    const row = (lbl, ctl) => `<div class="st"><span>${lbl}</span>${ctl}</div>`;
    const gfx = ['low', 'auto', 'high'].map((q) => `<button class="${SETTINGS.gfx === q ? 'on' : ''}" data-gfx="${q}">${T('g_' + q)}</button>`).join('');
    const lang = ['hi', 'en'].map((l) => `<button class="${LANG === l ? 'on' : ''}" data-lang="${l}">${l === 'hi' ? 'मैथिली/हिंदी' : 'English'}</button>`).join('');
    return row('🔊 ' + T('sound'), tog('sound', !s.muted)) + row('🎵 ' + T('sMusic'), tog('music', SETTINGS.music))
      + row('🗣️ ' + T('sVoice'), tog('voice', SETTINGS.voice)) + row('📳 ' + T('sVib'), tog('vib', SETTINGS.vib))
      + `<div class="st col"><span>🖼️ ${T('sGfx')}</span><div class="seg sm2">${gfx}</div></div>`
      + `<div class="st col"><span>🌐 ${T('sLang')}</span><div class="seg sm2">${lang}</div></div>`;
  }
  onClick(e) {
    const b = e.target.closest('button'); if (!b) return;
    const g = this.g; g.sound.init(); g.sound.click();
    if (b.dataset.act === 'daily') { this.claim(); return; }
    if (b.dataset.up) {
      if (buyUp(b.dataset.up)) { g.sound.power(); g.toast(T('upDone'), 900, 'gold'); } else if (upLevel(b.dataset.up) < 5) g.toast(T('noSweets'), 900, 'warn');
    } else if (b.dataset.set) {
      const k = b.dataset.set;
      if (k === 'sound') g.sound.setMuted(!g.sound.muted);
      else { SETTINGS[k] = !SETTINGS[k]; saveSettings(); g.applySettings(); }
    } else if (b.dataset.gfx) { SETTINGS.gfx = b.dataset.gfx; saveSettings(); g.applyGfx(); }
    else if (b.dataset.lang) { setLang(b.dataset.lang); }
    this.show(this.tab);
  }
  // ---------- रोज़ का इनाम ----------
  maybeDaily() {
    const d = dailyState();
    if (!d.can) return false;
    $('#dailyDays').innerHTML = this.htmlDays(d);
    $('#dailyGet').innerHTML = `${T('claim')} +${DAILY[d.day - 1]} ${RG}`;
    $('#dailyS').hidden = false;
    return true;
  }
  claim() {
    const amt = claimDaily();
    const g = this.g; g.sound.init();
    if (amt) { g.sound.power(); g.toast(`+${amt} ${T('sweets')}!`, 1100, 'gold'); g.say(`+${amt} ${T('sweets')}`, true); }
    $('#dailyS').hidden = true;
    if (!$('#metaS').hidden) this.show(this.tab);
    g.refreshMenu();
  }
}
