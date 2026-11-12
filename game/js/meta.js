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

// ---------------- अलमारी (गोलू के कपड़े) ----------------
// slot: head / body / feet / extra; set = किस मिशन-सेट पर खुले; cost = मिठाई देकर भी ले सकते
export const ITEMS = [
  { id: 'h_gamchha', slot: 'head', icon: '👳', hi: 'गमछा पगड़ी', en: 'Gamchha Turban', def: 1 },
  { id: 'h_peeli', slot: 'head', icon: '🟡', hi: 'पीयर पगड़ी', en: 'Yellow Turban', set: 1, cost: 1500 },
  { id: 'h_kesari', slot: 'head', icon: '🧡', hi: 'केसरिया साफ़ा', en: 'Saffron Safa', set: 7, cost: 3000 },
  { id: 'h_pag', slot: 'head', icon: '🔴', hi: 'मिथिला पाग', en: 'Mithila Paag', set: 10, cost: 4500 },
  { id: 'h_mor', slot: 'head', icon: '🦚', hi: 'मोर पंख', en: 'Peacock Feather', set: 15, cost: 6000 },
  { id: 'h_holi', slot: 'head', icon: '🌈', hi: 'होली पगड़ी', en: 'Holi Turban', set: 16, cost: 6500 },
  { id: 'h_mukut', slot: 'head', icon: '👑', hi: 'राजा मुकुट', en: 'Royal Crown', set: 30, cost: 15000 },
  { id: 'b_safed', slot: 'body', icon: '👕', hi: 'उज्जर कुर्ता', en: 'White Kurta', def: 1 },
  { id: 'b_peela', slot: 'body', icon: '💛', hi: 'पीयर कुर्ता', en: 'Yellow Kurta', set: 3, cost: 2000 },
  { id: 'b_hara', slot: 'body', icon: '💚', hi: 'हरियर कुर्ता', en: 'Green Kurta', set: 8, cost: 3500 },
  { id: 'b_jersey', slot: 'body', icon: '🏏', hi: 'क्रिकेट जर्सी', en: 'Cricket Jersey', set: 12, cost: 5000 },
  { id: 'b_dulha', slot: 'body', icon: '🤵', hi: 'दूल्हा शेरवानी', en: 'Groom Sherwani', set: 18, cost: 7500 },
  { id: 'b_cape', slot: 'body', icon: '🦸', hi: 'सुपरहीरो केप', en: 'Superhero Cape', set: 20, cost: 9000 },
  { id: 'f_chappal', slot: 'feet', icon: '🩴', hi: 'चप्पल', en: 'Chappal', def: 1 },
  { id: 'f_khadau', slot: 'feet', icon: '🪵', hi: 'खड़ाऊँ', en: 'Khadau', set: 4, cost: 2000 },
  { id: 'f_sports', slot: 'feet', icon: '👟', hi: 'स्पोर्ट्स जूता', en: 'Sports Shoes', set: 9, cost: 4000 },
  { id: 'f_sona', slot: 'feet', icon: '✨', hi: 'सोनाक जूता', en: 'Golden Shoes', set: 25, cost: 12000 },
  { id: 'x_none', slot: 'extra', icon: '➖', hi: 'किछु नहि', en: 'Nothing', def: 1 },
  { id: 'x_chashma', slot: 'extra', icon: '😎', hi: 'करिया चश्मा', en: 'Cool Shades', set: 5, cost: 2500 },
  { id: 'x_gubbara', slot: 'extra', icon: '🎈', hi: 'गुब्बारा', en: 'Balloon', set: 13, cost: 5500 },
  { id: 'x_chamak', slot: 'extra', icon: '🌟', hi: 'मिठाइक चमक', en: 'Sweet Sparkle Trail', daily7: 1, cost: 8000 },
];
export const SLOTS = ['head', 'body', 'feet', 'extra'];
export const itemById = (id) => ITEMS.find((x) => x.id === id);
const DEF_OUTFIT = { head: 'h_gamchha', body: 'b_safed', feet: 'f_chappal', extra: 'x_none' };
export const wardrobe = {
  get owned() { const o = J('owned', []); for (const it of ITEMS) if (it.def && !o.includes(it.id)) o.push(it.id); return o; },
  has(id) { return this.owned.includes(id); },
  give(id) { const o = this.owned; if (!o.includes(id)) { o.push(id); S('owned', o); return true; } return false; },
  get outfit() { return Object.assign({}, DEF_OUTFIT, J('outfit', {})); },
  equip(id) { const it = itemById(id); if (!it || !this.has(id)) return false; const o = this.outfit; o[it.slot] = id; S('outfit', o); return true; },
  buy(id) { const it = itemById(id); if (!it || this.has(id) || !it.cost || wallet.v < it.cost) return false; wallet.add(-it.cost); this.give(id); return true; },
};

// ---------------- मिशन सेट 1–30 (हर सेट में 3 मिशन; सेट पूरा = इनाम + स्कोर गुणक +1) ----------------
// run = एक दौड़ में; बाकी = कई दौड़ में जोड़कर
const r5 = (v) => (v >= 100 ? Math.round(v / 50) * 50 : v >= 20 ? Math.round(v / 5) * 5 : Math.max(1, Math.round(v)));
const MT = [
  { id: 'sweets', run: 1, f: (s) => Math.min(600, 50 + 25 * s), hi: 'एक दौड़ मे {n} मिठाइ जमा करू', en: 'Collect {n} sweets in one run' },
  { id: 'dist', run: 1, f: (s) => Math.min(3500, 450 + 110 * s), hi: 'एक दौड़ मे {n} मीटर दौड़ू', en: 'Run {n} m in one run' },
  { id: 'score', run: 1, f: (s) => 2500 + 1500 * s, hi: 'एक दौड़ मे {n} स्कोर बनाउ', en: 'Score {n} in one run' },
  { id: 'level', run: 1, min: 2, f: (s) => Math.min(5, 2 + Math.floor(s / 6)), hi: 'एक दौड़ मे लेवल {n} धरि पहुँचू', en: 'Reach level {n} in one run' },
  { id: 'jumps', f: (s) => 20 + 10 * s, hi: '{n} बेर कूदू', en: 'Jump {n} times' },
  { id: 'rolls', f: (s) => 15 + 8 * s, hi: '{n} बेर लुढ़कू', en: 'Roll {n} times' },
  { id: 'near', f: (s) => 5 + 2 * s, hi: '{n} बेर बाल-बाल बचू', en: 'Have {n} close calls' },
  { id: 'rasmalai', f: (s) => 3 + s, hi: '{n} रसमलाई जमा करू', en: 'Collect {n} rasmalai' },
  { id: 'power', f: (s) => 2 + s / 2, hi: '{n} बूस्टर पकड़ू', en: 'Pick up {n} power-ups' },
  { id: 'rush', min: 2, f: (s) => 1 + s / 4, hi: '{n} बेर शुगर रश चलाउ', en: 'Use Sugar Rush {n} times' },
  { id: 'haat', min: 3, f: (s) => 1 + s / 6, hi: 'मिथिलाक हाट {n} बेर पहुँचू', en: 'Reach the Mithila Haat {n} times' },
  { id: 'monkeyEsc', min: 3, f: (s) => 1 + s / 8, hi: 'बंदर सँ {n} बेर बचू', en: 'Escape the monkey {n} times' },
  { id: 'samosa', min: 4, f: (s) => 1 + s / 5, hi: 'उड़न समोसा {n} बेर पकड़ू', en: 'Grab {n} flying samosas' },
  { id: 'rings', min: 5, f: (s) => 2 + s / 2, hi: '{n} सोनाक छल्ला पार करू', en: 'Fly through {n} golden rings' },
  { id: 'roof', min: 6, f: (s) => 60 + 30 * s, hi: 'रेलगाड़ीक छत पर {n} मीटर दौड़ू', en: 'Run {n} m on train roofs' },
];
// सेट पूरा होने का इनाम: कपड़ा (id) या मिठाई (संख्या)
export const SET_REWARD = {};
for (const it of ITEMS) if (it.set) SET_REWARD[it.set] = it.id;
for (let s = 1; s <= 30; s++) if (!SET_REWARD[s]) SET_REWARD[s] = 200 + s * 60;
export const MAX_SET = 30;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function genSet(s) {
  if (s === 1) return ['sweets', 'jumps', 'dist'].map((id) => ({ id, n: r5(MT.find((t) => t.id === id).f(1)), p: 0 }));
  const R = rng(s * 7919 + 13), pool = MT.filter((t) => !t.min || s >= t.min), out = [];
  while (out.length < 3) { const t = pool[Math.floor(R() * pool.length)]; if (!out.some((m) => m.id === t.id) && !(t.run && out.filter((m) => MT.find((x) => x.id === m.id).run).length >= 2)) out.push({ id: t.id, n: t.id === 'level' ? t.f(s) : r5(t.f(s)), p: 0 }); }
  return out;
}
export class Missions {
  constructor() {
    this.st = J('mset', null);
    if (!this.st || !Array.isArray(this.st.act)) this.st = { set: 1, act: genSet(1), done: 0 };
    this.save();
    this.run = {}; this.justDone = [];
  }
  save() { S('mset', this.st); }
  get set() { return this.st.set; }
  get mult() { return 1 + Math.min(MAX_SET, this.st.done); }
  get reward() { return SET_REWARD[Math.min(this.st.set, MAX_SET)]; }
  text(m) { const t = MT.find((x) => x.id === m.id); return (LANG === 'hi' ? t.hi : t.en).replace('{n}', m.n.toLocaleString('en-IN')); }
  mReward() { return 40 + 10 * Math.min(this.st.set, 30); } // हर मिशन की मिठाई
  startRun() { this.run = {}; this.justDone = []; }
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
  // दौड़ के बाद: पूरे मिशन की मिठाई; तीनों पूरे = सेट का इनाम + अगला सेट
  settle() {
    let gain = 0; const done = [];
    for (const m of this.st.act) if (m.p >= m.n && !m.paid) { m.paid = 1; gain += this.mReward(); done.push(m); }
    let setDone = null;
    if (this.st.act.every((m) => m.p >= m.n)) {
      const s = this.st.set, rw = SET_REWARD[Math.min(s, MAX_SET)];
      setDone = { set: s, reward: rw, item: typeof rw === 'string' ? rw : null, sweets: typeof rw === 'number' ? rw : 0 };
      if (setDone.item) wardrobe.give(setDone.item); else gain += rw;
      this.st.done++; this.st.set = s + 1;
      this.st.act = genSet(Math.min(this.st.set, MAX_SET + 20));
    }
    this.save();
    if (gain) wallet.add(gain);
    return { gain, done, setDone };
  }
}

// ---------------- बैज (उपलब्धि) — पूरी ज़िंदगी के आँकड़े ----------------
export const stats = {
  get v() { return J('stats', {}); },
  merge(run) { const s = this.v; for (const k in run) { if (k.startsWith('best')) s[k] = Math.max(s[k] || 0, run[k]); else s[k] = (s[k] || 0) + run[k]; } S('stats', s); return s; },
};
export const BADGES = [
  { id: 'first', icon: '🏃', hi: 'पहिल दौड़', en: 'First Run', t: (s) => s.runs >= 1 },
  { id: 'km1', icon: '🛣️', hi: 'एक किलोमीटर', en: '1 km in a run', t: (s) => s.bestDist >= 1000 },
  { id: 'km3', icon: '🚀', hi: 'तीन किलोमीटर', en: '3 km in a run', t: (s) => s.bestDist >= 3000 },
  { id: 'sweet1k', icon: '🍬', hi: 'मिठाइ प्रेमी', en: 'Sweet Lover (1,000 sweets)', t: (s) => s.sweets >= 1000 },
  { id: 'sweet10k', icon: '🏆', hi: 'मिठाइक राजा', en: 'Sweet King (10,000 sweets)', t: (s) => s.sweets >= 10000 },
  { id: 'rail', icon: '🚂', hi: 'रेलक राजा', en: 'Rail King (500 m on roofs)', t: (s) => s.roof >= 500 },
  { id: 'haat', icon: '🛒', hi: 'हाटक उस्ताद', en: 'Haat Master (10 haats)', t: (s) => s.haat >= 10 },
  { id: 'fly', icon: '🔺', hi: 'उड़ाका', en: 'Flyer (10 samosa flights)', t: (s) => s.samosa >= 10 },
  { id: 'near', icon: '😅', hi: 'बाल-बाल 100', en: '100 close calls', t: (s) => s.near >= 100 },
  { id: 'monkey', icon: '🐒', hi: 'बंदर-बाज़', en: 'Monkey Dodger (10 escapes)', t: (s) => s.monkeyEsc >= 10 },
  { id: 'rings', icon: '💍', hi: 'सोनाक छल्ला', en: 'Ring Ace (50 rings)', t: (s) => s.rings >= 50 },
  { id: 'star', icon: '⭐', hi: 'सुपर स्टार', en: 'Superstar (50,000 score)', t: (s) => s.bestScore >= 50000 },
];
export function checkBadges() {
  const s = stats.v, got = J('badges', []), fresh = [];
  for (const b of BADGES) if (!got.includes(b.id) && b.t(s)) { got.push(b.id); fresh.push(b); }
  if (fresh.length) { S('badges', got); wallet.add(100 * fresh.length); }
  return fresh;
}
export const badgesGot = () => J('badges', []);

// ---------------- हेडस्टार्ट: उड़न समोसे से शुरुआत ----------------
export const HEADSTART_COST = 500;
export function buyHeadstart() { if (wallet.v < HEADSTART_COST) return false; wallet.add(-HEADSTART_COST); return true; }

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
  if (d.day === 7 && wardrobe.give('x_chamak')) store('unlockPending', 'x_chamak'); // पूरे 7 दिन = मिठाइक चमक
  return amt;
}
