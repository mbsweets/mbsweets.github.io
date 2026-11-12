// मिशन, रोज़ का इनाम, अपग्रेड, सेटिंग्स — सब फ़ोन में (localStorage, rr-*)
import { LANG } from './i18n.js';
import { store, storeNum } from './util.js';

const J = (k, d) => { try { const v = store(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const S = (k, v) => store(k, JSON.stringify(v));

// ---------------- सेटिंग्स ----------------
export const SETTINGS = { music: true, voice: true, vib: true, gfx: 'auto' };
export function loadSettings() { Object.assign(SETTINGS, J('settings', {})); }
export function saveSettings() { S('settings', SETTINGS); }

// ---------------- बटुआ (ख़र्च करने लायक मिठाई) ----------------
export const wallet = {
  get v() { if (store('wallet') == null) store('wallet', Math.floor(storeNum('total'))); return storeNum('wallet'); }, // पुराने खिलाड़ियों को उनकी कुल मिठाई
  add(n) { store('wallet', Math.max(0, Math.floor(this.v + n))); },
};

// ---------------- अपग्रेड ----------------
export const UPG = [
  { k: 'magnet', icon: '🎁', hi: 'मिठाइक डिब्बा', en: 'Sweet Box', base: 10, step: 2 },
  { k: 'shoes', icon: '🌀', hi: 'जलेबी जूता', en: 'Jalebi Shoes', base: 10, step: 2 },
  { k: 'thali', icon: '✖️2', hi: 'डबल थारी', en: 'Double Thali', base: 15, step: 2 },
  { k: 'samosa', icon: '🔺', hi: 'उड़न समोसा', en: 'Flying Samosa', base: 8.5, step: 1 },
];
export const UPG_COST = [200, 500, 1000, 2000, 4000];
export const upLevel = (k) => Math.min(5, storeNum('up_' + k));
export const upTime = (k) => { const u = UPG.find((x) => x.k === k); return u.base + u.step * upLevel(k); };
export function buyUp(k) {
  const lv = upLevel(k); if (lv >= 5) return false;
  const c = UPG_COST[lv]; if (wallet.v < c) return false;
  wallet.add(-c); store('up_' + k, lv + 1); return true;
}

// ---------------- मिशन ----------------
// run = एक दौड़ में; total = कई दौड़ में जोड़कर
const MT = [
  { id: 'sweets', run: 1, n: [60, 120, 220, 350, 500], hi: 'एक दौड़ मे {n} मिठाइ जमा करू', en: 'Collect {n} sweets in one run' },
  { id: 'dist', run: 1, n: [600, 1200, 2200, 3500, 5000], hi: 'एक दौड़ मे {n} मीटर दौड़ू', en: 'Run {n} m in one run' },
  { id: 'jumps', n: [30, 70, 150, 300], hi: '{n} बेर कूदू', en: 'Jump {n} times' },
  { id: 'rolls', n: [20, 50, 100, 200], hi: '{n} बेर लुढ़कू', en: 'Roll {n} times' },
  { id: 'roof', n: [100, 300, 700, 1500], hi: 'रेलगाड़ीक छत पर {n} मीटर दौड़ू', en: 'Run {n} m on train roofs' },
  { id: 'samosa', n: [1, 3, 6, 10], hi: 'उड़न समोसा {n} बेर पकड़ू', en: 'Grab {n} flying samosas' },
  { id: 'rasmalai', n: [3, 8, 15, 30], hi: '{n} रसमलाई जमा करू', en: 'Collect {n} rasmalai' },
  { id: 'near', n: [5, 12, 25, 50], hi: '{n} बेर बाल-बाल बचू', en: 'Have {n} close calls' },
  { id: 'rings', n: [2, 6, 12, 25], hi: '{n} सोनाक छल्ला पार करू', en: 'Fly through {n} golden rings' },
  { id: 'haat', n: [1, 3, 6, 10], hi: 'मिथिलाक हाट {n} बेर पहुँचू', en: 'Reach the Mithila Haat {n} times' },
];
const REWARD = [50, 100, 175, 275, 400];
export class Missions {
  constructor() {
    this.st = J('missions', null);
    if (!this.st || !Array.isArray(this.st.act)) { // नया खिलाड़ी — पहले आसान वाले
      this.st = { act: [], tier: {}, done: 0 };
      for (const id of ['sweets', 'jumps', 'dist']) { const t = MT.find((x) => x.id === id); this.st.act.push({ id, n: t.n[0], p: 0, tier: 0 }); }
    }
    while (this.st.act.length < 3) this.next();
    this.save();
    this.run = {}; this.justDone = [];
  }
  save() { S('missions', this.st); }
  next() {
    const used = new Set(this.st.act.map((m) => m.id));
    const pool = MT.filter((t) => !used.has(t.id));
    const t = pool[Math.floor(Math.random() * pool.length)];
    const tier = Math.min(this.st.tier[t.id] || 0, t.n.length - 1);
    this.st.act.push({ id: t.id, n: t.n[tier], p: 0, tier });
  }
  text(m) { const t = MT.find((x) => x.id === m.id); return (LANG === 'hi' ? t.hi : t.en).replace('{n}', m.n.toLocaleString('en-IN')); }
  reward(m) { return REWARD[Math.min(m.tier, REWARD.length - 1)]; }
  startRun() { this.run = {}; this.justDone = []; for (const m of this.st.act) delete m.claimed; }
  // घटना: id, कितना (run वाले में मान सीधे)
  bump(id, v = 1, absolute = false) {
    const out = [];
    for (const m of this.st.act) {
      if (m.id !== id || m.p >= m.n) continue;
      const t = MT.find((x) => x.id === id);
      if (t.run) { this.run[id] = absolute ? v : (this.run[id] || 0) + v; m.p = Math.max(m.p, Math.min(m.n, this.run[id])); }
      else m.p = Math.min(m.n, m.p + v);
      if (m.p >= m.n) out.push(m);
    }
    if (out.length) { this.justDone.push(...out); this.save(); }
    return out;
  }
  // दौड़ के बाद: पूरे मिशन बदलो, इनाम जोड़ो
  settle() {
    let gain = 0; const done = [];
    this.st.act = this.st.act.filter((m) => {
      if (m.p >= m.n) { gain += this.reward(m); done.push(m); this.st.tier[m.id] = (this.st.tier[m.id] || 0) + 1; this.st.done++; return false; }
      return true;
    });
    while (this.st.act.length < 3) this.next();
    this.save();
    if (gain) wallet.add(gain);
    return { gain, done };
  }
}

// ---------------- रोज़ का इनाम (7 दिन) ----------------
export const DAILY = [50, 75, 100, 150, 200, 300, 500];
const today = () => { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); };
const dayNum = (k) => Math.floor(new Date(Math.floor(k / 10000), Math.floor(k / 100) % 100 - 1, k % 100).getTime() / 864e5);
export function dailyState() {
  const st = J('daily', { last: 0, streak: 0 });
  const t = today();
  if (st.last === t) return { can: false, day: st.streak, st };
  const gap = st.last ? dayNum(t) - dayNum(st.last) : 99;
  const day = gap === 1 ? (st.streak % 7) + 1 : 1;
  return { can: true, day, st };
}
export function claimDaily() {
  const d = dailyState(); if (!d.can) return 0;
  const amt = DAILY[d.day - 1];
  wallet.add(amt); S('daily', { last: today(), streak: d.day });
  return amt;
}
