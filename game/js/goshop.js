// 🏪 गोलू की दुकान "माँ भगवती मिष्ठान भंडार" — गेम की मिठाई से ठेले से मिठाई महल तक (MB Sweets की "सन 2000 से" वाली कहानी जैसी).
// यही दुकान दौड़ में डिलीवरी के समय सड़क किनारे आती है (delivery.js) — जितनी बड़ी बनाओ, उतनी बड़ी दिखे.
// हर स्तर: रोज़ की कमाई (मेन्यू में एक बार लो). मेन्यू के 3D दृश्य में गोलू के बगल में दुकान बनती दिखती है.
import * as THREE from './three.module.min.js';
import { C, mat4, Merge } from './art.js';
import { T, LANG } from './i18n.js';
import { store, vibrate } from './util.js';
import { wallet } from './meta.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 12) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 16) => new THREE.TorusGeometry(r, t, s, n),
  dome: (r) => new THREE.SphereGeometry(r, 18, 10, 0, PI * 2, 0, PI / 2),
};
export const LEVELS = [
  { icon: '🛒', cost: 0, day: 40, t: { en: 'Sweet Cart', hi: 'मिठाई का ठेला', mai: 'मिठाइक ठेला' } },
  { icon: '⛺', cost: 2500, day: 100, t: { en: 'Little Kiosk', hi: 'छोटी गुमटी', mai: 'छोट गुमटी' } },
  { icon: '🏠', cost: 7000, day: 220, t: { en: 'Small Shop', hi: 'छोटी दुकान', mai: 'छोट दोकान' } },
  { icon: '🏪', cost: 16000, day: 400, t: { en: 'Big Shop', hi: 'बड़ी दुकान', mai: 'पैघ दोकान' } },
  { icon: '🏯', cost: 35000, day: 700, t: { en: 'Sweet Palace', hi: 'मिठाई महल', mai: 'मिठाइक महल' } },
];
const tx = (o) => (LANG === 'en' ? o.en : LANG === 'hi' ? o.hi : o.mai);
const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const SWC = [0xfff8ea, 0x7a2a14, 0xe8a447, 0xf6a8c0, 0xf39a1e, 0xf7a21b];

function signTex(lv) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#7a111a'; x.fillRect(0, 0, 512, 128); x.strokeStyle = '#f2a91b'; x.lineWidth = 10; x.strokeRect(6, 6, 500, 116);
  x.fillStyle = '#ffd24d'; x.font = '800 54px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('माँ भगवती मिष्ठान भंडार', 256, 58, 480);
  x.fillStyle = '#fff3c4'; x.font = '700 24px Mukta,sans-serif'; x.fillText('★'.repeat(lv + 1) + '  ननौरा · मिथिला', 256, 104);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function sign(w, h, lv) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: signTex(lv), toneMapped: false })); return m; }
const tray = (mg, x, y, z, w = 0.9) => { mg.add(G.box(w, 0.05, 0.4), mat4(x, y, z), 0xd9a441); for (let i = 0; i < 6; i++) mg.add(G.sph(0.07, 8, 6), mat4(x - w / 2 + 0.1 + (i % 6) * (w - 0.2) / 5, y + 0.07, z + (i % 2 ? 0.08 : -0.08)), SWC[i % SWC.length]); };
const lights = (mg, x0, x1, y, z, n) => { for (let i = 0; i <= n; i++) mg.add(G.sph(0.06, 6, 5), mat4(x0 + (x1 - x0) * i / n, y - Math.sin(PI * i / n) * 0.18, z), [0xffd24d, 0xff5a5a, 0x7fd3ff, 0x9cff7a][i % 4]); };

function build(lv) {
  const g = new THREE.Group(), mg = new Merge();
  if (lv === 0) { // ठेला
    mg.add(G.box(1.8, 0.5, 0.9), mat4(0, 0.85, 0), 0x8a5a34);
    for (const s of [-1, 1]) { mg.add(G.cyl(0.38, 0.38, 0.08, 18), mat4(s * 0.6, 0.38, 0.5, PI / 2, 0, 0), 0x3a2a20); mg.add(G.cyl(0.38, 0.38, 0.08, 18), mat4(s * 0.6, 0.38, -0.5, PI / 2, 0, 0), 0x3a2a20); }
    mg.add(G.box(1.6, 0.55, 0.75), mat4(0, 1.38, 0), 0xcfe8f0); tray(mg, 0, 1.16, 0, 1.4);
    mg.add(G.cyl(0.03, 0.03, 1.6, 6), mat4(0.7, 2.1, 0), C.wood); mg.add(G.cone(1.0, 0.45, 12), mat4(0.7, 2.95, 0), C.sindoor);
    mg.add(G.cyl(0.04, 0.04, 1.2, 6), mat4(-1.25, 0.95, 0, 0, 0, PI / 2 - 0.3), C.wood);
    const sg = sign(1.3, 0.32, lv); sg.position.set(0, 1.86, 0.39); g.add(sg);
  } else if (lv === 1) { // गुमटी
    mg.add(G.box(2.2, 2.0, 1.6), mat4(0, 1.0, -0.2), 0xf2c94c); mg.add(G.box(2.5, 0.12, 2.0), mat4(0, 2.15, 0), 0x2f6fb6);
    mg.add(G.box(2.4, 0.9, 0.5), mat4(0, 0.45, 0.75), 0xa8743e); tray(mg, -0.5, 0.95, 0.75); tray(mg, 0.5, 0.95, 0.75);
    for (let i = 0; i < 4; i++) mg.add(G.cyl(0.13, 0.13, 0.3, 10), mat4(-0.75 + i * 0.5, 1.45, 0.45), [0xffd24d, 0xf6a8c0, 0xfff8ea, 0xe8a447][i]);
    for (let i = 0; i < 9; i++) mg.add(G.sph(0.08, 6, 5), mat4(-1.1 + i * 0.275, 2.0 - Math.sin(PI * i / 8) * 0.15, 0.85), i % 2 ? 0xf08a1c : 0xf5c542);
    const sg = sign(2.1, 0.5, lv); sg.position.set(0, 2.5, 0.62); g.add(sg); mg.add(G.box(2.2, 0.6, 0.08), mat4(0, 2.5, 0.56), C.gold);
  } else if (lv === 2) { // छोटी दुकान
    mg.add(G.box(3.6, 3.0, 2.4), mat4(0, 1.5, -0.6), 0xf6b3cb); mg.add(G.box(3.8, 0.2, 2.8), mat4(0, 3.05, -0.4), C.maroon);
    mg.add(G.box(3.0, 0.95, 0.6), mat4(0, 0.48, 0.8), 0xf7f2e8); tray(mg, -0.9, 1.0, 0.8); tray(mg, 0, 1.0, 0.8); tray(mg, 0.9, 1.0, 0.8);
    for (let i = 0; i < 8; i++) mg.add(G.box(0.46, 0.06, 0.9), mat4(-1.6 + i * 0.46, 2.45, 1.05, 0.35, 0, 0), i % 2 ? 0xffffff : C.sindoor); // धारीदार छज्जा
    mg.add(G.sph(0.12, 8, 6), mat4(1.2, 2.25, 0.9), 0xffe08a);
    const sg = sign(3.2, 0.75, lv); sg.position.set(0, 2.85, 0.62); g.add(sg);
  } else if (lv === 3) { // बड़ी दुकान — दो मंज़िल
    mg.add(G.box(5.0, 2.8, 2.6), mat4(0, 1.4, -0.7), 0xfff1d6); mg.add(G.box(5.0, 2.2, 2.4), mat4(0, 3.9, -0.8), 0xf2a91b);
    mg.add(G.box(5.2, 0.2, 2.9), mat4(0, 2.85, -0.5), C.maroon); mg.add(G.box(5.4, 0.25, 2.8), mat4(0, 5.05, -0.7), C.maroon);
    mg.add(G.box(4.6, 0.6, 0.15), mat4(0, 3.1, 0.62), 0x8a5a34); // बालकनी
    for (let i = 0; i < 3; i++) mg.add(G.box(0.9, 1.2, 0.08), mat4(-1.5 + i * 1.5, 4.0, 0.42), 0x6fb7d8);
    mg.add(G.box(4.4, 0.95, 0.6), mat4(0, 0.48, 0.8), 0xf7f2e8); for (let i = 0; i < 4; i++) tray(mg, -1.6 + i * 1.07, 1.0, 0.8);
    lights(mg, -2.5, 2.5, 2.7, 0.75, 14); lights(mg, -2.5, 2.5, 5.0, 0.6, 14);
    for (const s of [-1, 1]) { mg.add(G.cyl(0.3, 0.25, 0.5, 10), mat4(s * 2.7, 0.25, 0.9), C.terracotta); mg.add(G.sph(0.45, 10, 8), mat4(s * 2.7, 0.8, 0.9), C.leaf); }
    const sg = sign(4.2, 1.0, lv); sg.position.set(0, 2.35, 0.64); g.add(sg);
  } else { // मिठाई महल
    mg.add(G.box(6.2, 3.4, 3.0), mat4(0, 1.7, -0.9), 0xfff1d6); mg.add(G.box(5.0, 2.0, 2.6), mat4(0, 4.4, -1.0), 0xf6b3cb);
    for (let i = 0; i < 4; i++) { const x = -2.25 + i * 1.5; mg.add(G.box(1.1, 2.2, 0.1), mat4(x, 1.3, 0.62), 0x7a111a); mg.add(G.cyl(0.55, 0.55, 0.1, 16, 1), mat4(x, 2.4, 0.62, PI / 2, 0, 0), 0x7a111a); }
    for (const [x, r] of [[0, 1.1], [-2.0, 0.6], [2.0, 0.6]]) { mg.add(G.dome(r), mat4(x, 5.4, -1.0), C.gold); mg.add(G.cone(0.1, 0.6, 8), mat4(x, 5.4 + r + 0.25, -1.0), C.gold); }
    for (const s of [-1, 1]) { mg.add(G.cyl(0.35, 0.4, 5.6, 12), mat4(s * 3.2, 2.8, 0.2), 0xfff1d6); mg.add(G.dome(0.5), mat4(s * 3.2, 5.6, 0.2), C.gold); mg.add(G.box(0.05, 0.6, 0.4), mat4(s * 3.2, 6.6, 0.4), C.sindoor); mg.add(G.cyl(0.02, 0.02, 1.2, 5), mat4(s * 3.2, 6.4, 0.2), C.wood); }
    lights(mg, -3.0, 3.0, 3.4, 0.7, 18); lights(mg, -2.5, 2.5, 5.4, -0.2, 14);
    mg.add(G.box(5.0, 0.95, 0.6), mat4(0, 0.48, 1.0), 0xf7f2e8); for (let i = 0; i < 5; i++) tray(mg, -2.0 + i * 1.0, 1.0, 1.0, 0.8);
    const sg = sign(5.0, 1.2, lv); sg.position.set(0, 3.1, 0.66); g.add(sg);
  }
  const m = mg.mesh(0.03); m.castShadow = true; m.receiveShadow = true; g.add(m);
  return g;
}

export class GoluShop {
  constructor(game) { this.g = game; this.models = []; this.open = false; this.anim = 0; }
  get lv() { return Math.max(0, Math.min(LEVELS.length - 1, parseInt(store('gshop') || '0', 10) || 0)); }
  canCollect() { return store('gshopDay') !== istDay(); }
  model(lv) {
    if (!this.models[lv]) { const m = build(lv); m.visible = false; this.g.scene.add(m); this.models[lv] = m; }
    return this.models[lv];
  }
  show(on) {
    this.open = on; this.g.goShopOpen = on;
    for (const m of this.models) if (m) m.visible = false;
    if (on) { const m = this.model(this.lv); m.visible = true; m.position.set(-2.6, 0, -5.2); m.rotation.y = 0.32; m.scale.setScalar(1); } // सड़क पर गोलू के आगे-बाएँ
    document.querySelector('#gshopS').hidden = !on;
    if (this.g.state === 'menu') document.querySelector('#menu').hidden = on; // ऊपर का आधा 3D दुकान के लिए ख़ाली
    if (on) this.paint();
  }
  paint() {
    const lv = this.lv, L = LEVELS[lv], nx = LEVELS[lv + 1];
    const box = document.querySelector('#gshopBody');
    box.innerHTML = `<div class="gsh"><b>${L.icon}</b><span><em>${T('gsLv', lv + 1, LEVELS.length)}</em>${tx(L.t)}<small>${T('gsDay', L.day)}</small></span></div>`
      + (this.canCollect() ? `<button class="big mini" data-gs="get">🍬 ${T('gsGet', L.day)}</button>` : `<p class="lbnote">✅ ${T('gsGot')}</p>`)
      + (nx ? `<button class="sm wide gsup${wallet.v < nx.cost ? ' poor' : ''}" data-gs="up">${nx.icon} ${tx(nx.t)} — ${T('gsBuild')} <i class="rg"></i> ${nx.cost.toLocaleString('en-IN')}<small>${T('gsDay', nx.day)}</small></button>` : `<p class="lbnote">🏯 ${T('gsMax')}</p>`)
      + `<button class="sm wide gsrg" data-gs="rg">🍮 ${T('rgBtn', this.g.rg ? this.g.rg.left() : 3)}</button>`
      + `<p class="lbnote">${T('gsNote')}</p>`;
  }
  click(k) {
    const g = this.g;
    if (k === 'get' && this.canCollect()) { const d = LEVELS[this.lv].day; wallet.add(d); store('gshopDay', istDay()); g.sound.power(); g.toast(`+${d} 🍬`, 900, 'gold'); vibrate(20); }
    else if (k === 'rg') { if (g.rg) g.rg.open(); return; } // 🍮 रसगुल्ला बनाओ
    else if (k === 'up') {
      const nx = LEVELS[this.lv + 1]; if (!nx) return;
      if (wallet.v < nx.cost) { g.toast(T('noSweets'), 900, 'warn'); return; }
      wallet.add(-nx.cost); store('gshop', this.lv + 1);
      this.show(true); this.anim = 0.001; g.sound.levelUp(); g.sayKind('unlock'); vibrate([30, 40, 60]);
    }
    this.paint(); g.refreshMenu();
  }
  // मेन्यू में हर फ़्रेम: नया स्तर उछलकर बने + चमक
  update(dt) {
    if (!this.open || !this.anim) return;
    const m = this.models[this.lv]; this.anim = Math.min(1, this.anim + dt * 1.4);
    const k = this.anim, e = 1 + 2.7 * Math.pow(k - 1, 3) + 1.7 * Math.pow(k - 1, 2);
    m.scale.setScalar(Math.max(0.01, e));
    if (Math.random() < 0.7) this.g.world.parts.burst(-2.6 + (Math.random() - 0.5) * 4, Math.random() * 4, -5.2 + (Math.random() - 0.5) * 2, [0xffd24d, 0xd1261c, 0x2e7b47, 0xd8457f][Math.floor(Math.random() * 4)], 3, 2, 2.5, 0.8, -2);
    if (k >= 1) { this.anim = 0; m.scale.setScalar(1); }
  }
}
