// मिशन सेट / बैज / अपग्रेड / सेटिंग्स वाली खिड़की + अलमारी + नई चीज़ खुलने का जश्न + रोज़ का इनाम
import { T, LANG, setLang } from './i18n.js';
import { SETTINGS, saveSettings, wallet, UPG, UPG_COST, upLevel, upTime, buyUp, DAILY, dailyState, claimDaily,
  ITEMS, SLOTS, itemById, wardrobe, MAX_SET, BADGES, badgesGot } from './meta.js';
import { store } from './util.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.floor(n).toLocaleString('en-IN');
const RG = '<i class="rg"></i>';
const nm = (it) => (LANG === 'hi' ? it.hi : it.en);
const rewardHtml = (rw) => (typeof rw === 'string' ? `${itemById(rw).icon} ${nm(itemById(rw))}` : `${RG} ${fmt(rw)}`);

export class MetaUI {
  constructor(game) {
    this.g = game; this.tab = 'ms'; this.slot = 'head'; this.preview = null;
    for (const b of document.querySelectorAll('#metaTabs button')) b.addEventListener('click', () => { this.g.sound.click(); this.show(b.dataset.m); });
    $('#metaClose').addEventListener('click', () => { this.g.sound.click(); this.close(); });
    $('#dailyGet').addEventListener('click', () => this.claim());
    $('#metaBody').addEventListener('click', (e) => this.onClick(e));
    for (const b of document.querySelectorAll('#wardTabs button')) b.addEventListener('click', () => { this.g.sound.click(); this.slot = b.dataset.w; this.drawWard(); });
    $('#wardGrid').addEventListener('click', (e) => this.onWard(e));
    $('#wardClose').addEventListener('click', () => { this.g.sound.click(); this.closeWard(); });
    $('#unWear').addEventListener('click', () => this.unlockWear());
    $('#unLater').addEventListener('click', () => { this.g.sound.click(); $('#unlockS').hidden = true; this.nextUnlock(); });
  }
  open(tab = 'ms') { $('#metaS').hidden = false; this.show(tab); }
  close() { $('#metaS').hidden = true; this.g.refreshMenu(); }
  show(tab) {
    this.tab = tab;
    for (const b of document.querySelectorAll('#metaTabs button')) b.classList.toggle('on', b.dataset.m === tab);
    $('#metaWallet').innerHTML = `${RG}<b>${fmt(wallet.v)}</b>`;
    const body = $('#metaBody');
    if (tab === 'ms') body.innerHTML = this.htmlMissions();
    else if (tab === 'bd') body.innerHTML = this.htmlBadges();
    else if (tab === 'up') body.innerHTML = this.htmlUpgrades();
    else body.innerHTML = this.htmlSettings();
  }
  // ---------- मिशन सेट ----------
  htmlMissions() {
    const ms = this.g.ms, s = Math.min(ms.set, MAX_SET);
    let h = `<div class="mshead"><div><small>${T('msSet')}</small><b>${ms.set > MAX_SET ? '★' : s} / ${MAX_SET}</b></div>
      <div class="mult"><small>${T('msMult')}</small><b>×${ms.mult}</b></div></div>
      <div class="msnext">🎁 ${T('msNext')}: <b>${rewardHtml(ms.reward)}</b></div>`;
    for (const m of ms.st.act) {
      const pc = Math.min(100, (m.p / m.n) * 100), done = m.p >= m.n;
      h += `<div class="ms${done ? ' done' : ''}"><div class="mst">${done ? '✅ ' : '🎯 '}${ms.text(m)}</div>
        <div class="msb"><i style="width:${pc}%"></i></div>
        <div class="msr"><span>${fmt(m.p)} / ${fmt(m.n)}</span><em>+${ms.mReward()} ${RG}</em></div></div>`;
    }
    h += `<p class="lbnote">${T('msNote')}</p>`;
    const d = dailyState();
    h += `<h3>${T('daily')}</h3><div class="days">${this.htmlDays(d)}</div><p class="lbnote">🌟 ${T('daily7')}</p>`;
    h += d.can ? `<button class="big mini" data-act="daily">${T('claim')} +${DAILY[d.day - 1]}</button>` : `<p class="lbnote">${T('dailyDone')}</p>`;
    return h;
  }
  htmlDays(d) {
    const cur = d.day;
    return DAILY.map((a, i) => {
      const n = i + 1, got = d.can ? n < cur : n <= cur, today = n === cur;
      return `<div class="day${got ? ' got' : ''}${today && d.can ? ' now' : ''}${n === 7 ? ' big7' : ''}"><small>${T('day')} ${n}</small><b>${got ? '✔' : '+' + a}</b></div>`;
    }).join('');
  }
  // ---------- बैज ----------
  htmlBadges() {
    const got = badgesGot();
    let h = `<p class="lbnote">${T('bdNote')}</p><div class="bgrid">`;
    for (const b of BADGES) { const on = got.includes(b.id); h += `<div class="bdg${on ? ' on' : ''}"><b>${on ? b.icon : '🔒'}</b><span>${nm(b)}</span></div>`; }
    return h + '</div>';
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
    const lang = ['hi', 'en'].map((l) => `<button class="${LANG === l ? 'on' : ''}" data-lang="${l}">${l === 'hi' ? 'मैथिली' : 'English'}</button>`).join('');
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
  // ---------- अलमारी (नीचे से खुलने वाली पट्टी — ऊपर गोलू नाचता दिखे) ----------
  openWard() { $('#wardS').hidden = false; this.g.wardOpen = true; this.preview = null; this.drawWard(); }
  closeWard() { $('#wardS').hidden = true; this.g.wardOpen = false; this.preview = null; this.g.wearNow(); this.g.refreshMenu(); }
  drawWard() {
    for (const b of document.querySelectorAll('#wardTabs button')) b.classList.toggle('on', b.dataset.w === this.slot);
    $('#wardWallet').innerHTML = `${RG}<b>${fmt(wallet.v)}</b>`;
    const of = wardrobe.outfit, owned = wardrobe.owned;
    $('#wardGrid').innerHTML = ITEMS.filter((it) => it.slot === this.slot).map((it) => {
      const own = owned.includes(it.id), on = of[it.slot] === it.id, prev = this.preview === it.id;
      let st;
      if (on) st = `<em class="on">✔ ${T('wWorn')}</em>`;
      else if (own) st = `<em>${T('wWear')}</em>`;
      else st = `<small>🔒 ${it.set ? T('wSet', it.set) : T('wDaily7')}</small>${it.cost ? `<button class="wbuy${wallet.v < it.cost ? ' poor' : ''}" data-buy="${it.id}">${RG}${fmt(it.cost)}</button>` : ''}`;
      return `<div class="witem${on ? ' on' : ''}${own ? '' : ' lock'}${prev ? ' prev' : ''}" data-it="${it.id}"><b>${it.icon}</b><span>${nm(it)}</span>${st}</div>`;
    }).join('');
    $('#wardNote').textContent = this.preview ? T('wTry') : T('wNote');
  }
  onWard(e) {
    const g = this.g; g.sound.init();
    const buy = e.target.closest('[data-buy]');
    if (buy) {
      const id = buy.dataset.buy;
      if (wardrobe.buy(id)) { wardrobe.equip(id); this.preview = null; g.wearNow(); g.celebrate(id); }
      else { g.sound.click(); g.toast(T('noSweets'), 900, 'warn'); }
      this.drawWard(); return;
    }
    const card = e.target.closest('[data-it]'); if (!card) return;
    const id = card.dataset.it, it = itemById(id);
    g.sound.click();
    if (wardrobe.has(id)) { wardrobe.equip(id); this.preview = null; g.wearNow(); g.golu.dance = 1.2; }
    else { this.preview = id; const of = wardrobe.outfit; of[it.slot] = id; g.wearNow(of); } // पहनकर देखो
    this.drawWard();
  }
  // ---------- नई चीज़ खुली — जश्न ----------
  showUnlocks(ids) { this.unq = [...(this.unq || []), ...ids]; if ($('#unlockS').hidden) this.nextUnlock(); }
  nextUnlock() {
    const id = (this.unq || []).shift(); if (!id) return;
    const it = itemById(id); this.unId = id;
    $('#unIcon').textContent = it.icon; $('#unName').textContent = nm(it);
    $('#unlockS').hidden = false;
    const c = $('#unConf'); c.innerHTML = '';
    for (let i = 0; i < 36; i++) { const s = document.createElement('i'); s.style.left = Math.random() * 100 + '%'; s.style.background = ['#D1261C', '#F2A91B', '#2E7B47', '#D8457F', '#2F6FB6', '#fff'][i % 6]; s.style.animationDelay = Math.random() * 0.8 + 's'; s.style.animationDuration = 1.6 + Math.random() * 1.2 + 's'; c.appendChild(s); }
    this.g.sound.levelUp(); this.g.sayKind('unlock');
  }
  unlockWear() {
    const g = this.g; g.sound.click();
    wardrobe.equip(this.unId); $('#unlockS').hidden = true;
    if (g.state !== 'menu') g.toMenu(true);
    g.wearNow(); g.celebrate(this.unId);
    this.nextUnlock();
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
    if (amt) { g.sound.power(); g.toast(`+${amt} ${T('sweets')}!`, 1100, 'gold'); }
    $('#dailyS').hidden = true;
    if (!$('#metaS').hidden) this.show(this.tab);
    const pend = store('unlockPending'); if (pend) { store('unlockPending', ''); if (pend) this.showUnlocks([pend]); }
    g.refreshMenu();
  }
}
export { SLOTS };
