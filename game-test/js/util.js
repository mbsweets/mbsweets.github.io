// छोटे काम के फ़ंक्शन
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;

// सेव: अपनी वेबसाइट पर फ़ोन का localStorage; पोर्टल पर उनका data module (वही getItem/setItem)
export const STORE = { b: null };
export function store(key, val) {
  try {
    const b = STORE.b || localStorage;
    if (val === undefined) return b.getItem('rr-' + key);
    b.setItem('rr-' + key, String(val));
  } catch (e) { /* प्राइवेट विंडो वगैरह — बिना सेव के चलो */ }
  return null;
}
export const storeNum = (key, def = 0) => {
  const v = parseFloat(store(key));
  return Number.isFinite(v) ? v : def;
};

export function weighted(list) {
  // list: [[value, weight], ...]
  let t = 0;
  for (const [, w] of list) t += w;
  let r = Math.random() * t;
  for (const [v, w] of list) { if ((r -= w) <= 0) return v; }
  return list[list.length - 1][0];
}

export const VIB = { on: true };
export function vibrate(ms) {
  if (!VIB.on) return;
  try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* ठीक है */ }
}
