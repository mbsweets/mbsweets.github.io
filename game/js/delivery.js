// 🛵 गोलू की डिलीवरी — दौड़ के बीच ग्राहक का ऑर्डर: सही मिठाई सही गिनती में उठाओ, फिर ग्राहक के दरवाज़े वाली लेन से निकलो.
// ग़लत मिठाई = ⭐ कम (हर 6 पर एक, कम से कम 1). समय ख़त्म या दरवाज़ा छूटा = ऑर्डर गया (कोई और सज़ा नहीं).
// सब 3D: दरवाज़ा (बाँस + गेंदे की माला + आम के पत्ते), सड़क पर मिथिला का अरिपन, दूर से दिखती रोशनी, सड़क किनारे हाथ हिलाता ग्राहक, उड़ता डिब्बा.
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge } from './art.js';
import { ROAD_HALF } from './models.js';
import { LANES, zoneAt } from './world.js';
import { T, LANG } from './i18n.js';
import { rand, randi, pick, weighted, clamp, damp, vibrate } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s),
  cap: (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s),
  cone: (r, h, s = 12) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 8, n = 24, arc = PI * 2) => new THREE.TorusGeometry(r, t, s, n, arc),
  half: (r) => new THREE.SphereGeometry(r, 16, 10, 0, PI * 2, 0, PI * 0.55),
};
export const ORDER_TYPES = ['rasgulla', 'gulabjamun', 'balushahi', 'chamcham'];
export const SW_CSS = { rasgulla: '#FFF8EA', gulabjamun: '#7A2A14', balushahi: '#E8A447', chamcham: '#F6A8C0' };
const SW_NAME = {
  en: { rasgulla: 'Rasgulla', gulabjamun: 'Gulab Jamun', balushahi: 'Balushahi', chamcham: 'Cham Cham' },
  hi: { rasgulla: 'रसगुल्ला', gulabjamun: 'गुलाब जामुन', balushahi: 'बालूशाही', chamcham: 'चमचम' },
};
export const swName = (t) => SW_NAME[LANG === 'en' ? 'en' : 'hi'][t];
// ग्राहक — मिथिला के गाँव के लोग
export const CUST = [
  { id: 'dadi', icon: '👵', en: 'Grandma', hi: 'दादी', mai: 'दादी' },
  { id: 'kakka', icon: '👨‍🦳', en: 'Uncle', hi: 'चाचा', mai: 'कक्का' },
  { id: 'munia', icon: '👧', en: 'Munia', hi: 'मुनिया', mai: 'मुनिया' },
  { id: 'master', icon: '👨‍🏫', en: 'Master ji', hi: 'मास्टर जी', mai: 'मास्टर साहेब' },
  { id: 'pandit', icon: '🧔', en: 'Pandit ji', hi: 'पंडित जी', mai: 'पंडित जी' },
  { id: 'bhauji', icon: '👩', en: 'Bhabhi', hi: 'भाभी', mai: 'भौजी' },
];
const cName = (c) => c[LANG] || c.hi;
const SKIN = 0xe8a77c, SKIN2 = 0xd99470;

// ---------------- ग्राहक (सरल 3D आकृति, हाथ अलग — हिलें) ----------------
function makeCustomer(id) {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mg = new Merge();
  const face = (y, skin = SKIN, s = 1) => {
    mg.add(G.sph(0.25 * s, 16, 12), mat4(0, y, 0), skin);
    for (const x of [-0.085, 0.085]) { mg.add(G.sph(0.045 * s, 8, 6), mat4(x * s, y + 0.03 * s, 0.215 * s), 0xffffff); mg.add(G.sph(0.028 * s, 6, 5), mat4(x * s, y + 0.03 * s, 0.25 * s), 0x1d1210); }
    mg.add(G.tor(0.07 * s, 0.018 * s, 6, 10, PI), mat4(0, y - 0.07 * s, 0.215 * s, 0, 0, PI), 0x8a2a1a); // मुस्कान
    mg.add(G.sph(0.035 * s, 6, 5), mat4(0, y - 0.01 * s, 0.25 * s), skin); // नाक
    for (const x of [-0.25, 0.25]) mg.add(G.sph(0.05 * s, 6, 5), mat4(x * s, y, 0), skin); // कान
  };
  let armCol = SKIN, armY = 1.22, armX = 0.3, sc = 1;
  if (id === 'dadi') { // सफ़ेद साड़ी लाल किनारी, सफ़ेद बाल, चश्मा, लाठी
    mg.add(G.cone(0.46, 1.25, 16), mat4(0, 0.62, 0), 0xf6f1e6); mg.add(G.tor(0.4, 0.035, 6, 24), mat4(0, 0.12, 0, PI / 2, 0, 0), C.sindoor);
    mg.add(G.cyl(0.24, 0.3, 0.55, 14), mat4(0, 1.12, 0), 0xf6f1e6);
    face(1.58, SKIN2); mg.add(G.half(0.29), mat4(0, 1.6, -0.03), 0xf6f1e6); mg.add(G.tor(0.27, 0.025, 6, 20, PI), mat4(0, 1.6, 0.02, 0, 0, 0), C.sindoor);
    mg.add(G.sph(0.17, 10, 8), mat4(0, 1.72, -0.12), 0xd8d4cc);
    for (const x of [-0.085, 0.085]) mg.add(G.tor(0.055, 0.01, 5, 12), mat4(x, 1.61, 0.25), 0x3a2a20);
    mg.add(G.cyl(0.025, 0.025, 1.2, 6), mat4(-0.42, 0.6, 0.15, 0, 0, 0.08), C.wood);
    armCol = 0xf6f1e6;
  } else if (id === 'kakka') { // कुर्ता-धोती, भूरी बंडी, मूँछ, सफ़ेद बाल
    for (const x of [-0.13, 0.13]) mg.add(G.cap(0.12, 0.5, 8), mat4(x, 0.38, 0), 0xf7f2e8);
    mg.add(G.cap(0.3, 0.5, 14), mat4(0, 1.02, 0), 0xf7f2e8); mg.add(G.cyl(0.31, 0.33, 0.5, 14), mat4(0, 1.12, 0), 0x6b3a22);
    face(1.6); mg.add(G.half(0.27), mat4(0, 1.62, -0.02), 0xcfcac2); mg.add(G.box(0.2, 0.05, 0.05), mat4(0, 1.53, 0.24), 0x2a2420);
    armCol = 0xf7f2e8;
  } else if (id === 'munia') { // गुलाबी फ़्रॉक, दो चोटी, लाल फ़ीता
    sc = 0.78;
    for (const x of [-0.1, 0.1]) mg.add(G.cap(0.08, 0.4, 8), mat4(x, 0.3, 0), SKIN);
    mg.add(G.cone(0.42, 0.75, 16), mat4(0, 0.85, 0), C.pink); mg.add(G.cyl(0.22, 0.26, 0.4, 14), mat4(0, 1.15, 0), C.pink);
    face(1.58); mg.add(G.half(0.27), mat4(0, 1.6, -0.02), 0x1d1210);
    for (const s of [-1, 1]) { mg.add(G.sph(0.11, 10, 8), mat4(s * 0.27, 1.52, -0.05), 0x1d1210); mg.add(G.sph(0.06, 8, 6), mat4(s * 0.27, 1.64, -0.05), C.sindoor); }
    armY = 1.22; armX = 0.25;
  } else if (id === 'master') { // हल्का नीला कुर्ता-पजामा, चश्मा, किताब
    for (const x of [-0.13, 0.13]) mg.add(G.cap(0.12, 0.55, 8), mat4(x, 0.4, 0), 0xe9e4d8);
    mg.add(G.cap(0.3, 0.55, 14), mat4(0, 1.05, 0), 0x9cc3e6);
    face(1.62); mg.add(G.half(0.27), mat4(0, 1.65, -0.03), 0x1d1210);
    for (const x of [-0.085, 0.085]) mg.add(G.tor(0.055, 0.012, 5, 12), mat4(x, 1.65, 0.25), 0x1d1210);
    mg.add(G.box(0.3, 0.38, 0.06), mat4(-0.36, 0.95, 0.18, 0, 0.3, 0), C.maroon);
    armCol = 0x9cc3e6;
  } else if (id === 'pandit') { // पीली धोती, केसरिया कुर्ता, तिलक, चोटी, माला
    for (const x of [-0.13, 0.13]) mg.add(G.cap(0.13, 0.5, 8), mat4(x, 0.38, 0), 0xf2c94c);
    mg.add(G.cap(0.31, 0.5, 14), mat4(0, 1.02, 0), 0xf08a24);
    face(1.6); mg.add(G.box(0.05, 0.1, 0.02), mat4(0, 1.7, 0.245), C.sindoor); mg.add(G.cone(0.05, 0.16, 6), mat4(0, 1.88, -0.12, -0.5, 0, 0), 0x1d1210);
    mg.add(G.tor(0.22, 0.025, 6, 18), mat4(0, 1.25, 0.08, 1.2, 0, 0), 0x6b3a22);
    armCol = 0xf08a24;
  } else { // भौजी — लाल साड़ी सुनहरी किनारी, घूँघट, बिंदी
    mg.add(G.cone(0.44, 1.25, 16), mat4(0, 0.62, 0), 0xc4161c); mg.add(G.tor(0.38, 0.035, 6, 24), mat4(0, 0.12, 0, PI / 2, 0, 0), C.gold);
    mg.add(G.cyl(0.23, 0.29, 0.55, 14), mat4(0, 1.12, 0), 0xc4161c);
    face(1.6); mg.add(G.half(0.3), mat4(0, 1.63, -0.04), 0xc4161c); mg.add(G.tor(0.28, 0.025, 6, 20, PI), mat4(0, 1.63, 0.02), C.gold);
    mg.add(G.sph(0.022, 6, 5), mat4(0, 1.7, 0.25), C.sindoor);
    armCol = 0xc4161c;
  }
  body.add(mg.mesh(0.02));
  const arms = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * armX, armY, 0);
    const am = new Merge(); am.add(G.cap(0.075, 0.42, 8), mat4(0, -0.27, 0), armCol); am.add(G.sph(0.08, 8, 6), mat4(0, -0.54, 0), SKIN);
    pv.add(am.mesh(0.015)); body.add(pv); arms.push(pv);
  }
  g.scale.setScalar(sc * 1.05);
  g.userData = { body, arms, sc: sc * 1.05 };
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ---------------- दरवाज़ा + अरिपन + रोशनी ----------------
function aripanTex() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.translate(128, 128); x.strokeStyle = '#fffaf0'; x.fillStyle = '#fffaf0'; x.lineCap = 'round';
  x.lineWidth = 7; x.beginPath(); x.arc(0, 0, 118, 0, PI * 2); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 100, 0, PI * 2); x.stroke();
  for (let i = 0; i < 12; i++) { x.save(); x.rotate(i * PI / 6); x.beginPath(); x.ellipse(0, -62, 14, 30, 0, 0, PI * 2); x.lineWidth = 5; x.stroke(); x.beginPath(); x.arc(0, -108, 5, 0, PI * 2); x.fill(); x.restore(); }
  x.lineWidth = 5; x.beginPath(); x.arc(0, 0, 30, 0, PI * 2); x.stroke();
  x.beginPath(); x.arc(0, 0, 12, 0, PI * 2); x.fillStyle = '#ffd24d'; x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function beamTex() {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128; const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(0.7, 'rgba(255,214,90,0.6)'); gr.addColorStop(1, 'rgba(255,240,180,0.95)');
  x.fillStyle = gr; x.fillRect(0, 0, 4, 128); return new THREE.CanvasTexture(c);
}
function makeDoor() {
  const g = new THREE.Group();
  const mg = new Merge();
  const W = 1.12, H = 2.9;
  for (const s of [-1, 1]) {
    mg.add(G.cyl(0.085, 0.095, H, 10), mat4(s * W, H / 2, 0), C.bamboo);
    for (let y = 0.5; y < H; y += 0.6) mg.add(G.cyl(0.1, 0.1, 0.05, 10), mat4(s * W, y, 0), 0x9c7a3c);
    mg.add(G.cyl(0.2, 0.24, 0.24, 12), mat4(s * W, 0.12, 0), C.terracotta); // मिट्टी का कलश जैसा आधार
    for (let y = 0.45; y < H - 0.1; y += 0.24) mg.add(G.sph(0.085, 8, 6), mat4(s * W, y, 0.09), (Math.round(y / 0.24) % 2) ? 0xf08a1c : 0xf5c542); // खंभे पर गेंदे
  }
  mg.add(G.tor(W, 0.1, 8, 28, PI), mat4(0, H, 0), 0xf08a1c); // ऊपर गेंदे का मेहराब
  for (let i = 0; i <= 14; i++) { const a = PI * i / 14; mg.add(G.sph(0.11, 8, 6), mat4(Math.cos(a) * W, H + Math.sin(a) * W, 0.06), i % 2 ? 0xf5c542 : 0xe0531c); }
  for (let i = 0; i < 7; i++) { const x0 = -W + 0.25 + i * (2 * W - 0.5) / 6; mg.add(G.cone(0.07, 0.32, 5), mat4(x0, H - 0.2, 0.05, PI, 0, 0), C.leaf); } // आम के पत्ते
  g.add(mg.mesh(0.025));
  // नाम-पट्टी (ग्राहक का चेहरा + नाम)
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 96;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.64), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  sign.position.set(0, H + W + 0.55, 0.05); g.add(sign);
  // सड़क पर अरिपन
  const ar = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), new THREE.MeshBasicMaterial({ map: aripanTex(), transparent: true, depthWrite: false, opacity: 0.92 }));
  ar.rotation.x = -PI / 2; ar.position.y = 0.025; ar.renderOrder = 1; g.add(ar);
  // दूर से दिखे — ऊपर जाती सुनहरी रोशनी
  const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 16, 20, 1, true), new THREE.MeshBasicMaterial({ map: beamTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.5, toneMapped: false }));
  bm.position.y = 8; g.add(bm);
  g.traverse((o) => { if (o.isMesh && o !== bm && o !== ar && o !== sign) o.castShadow = true; });
  g.userData = { sign, sc, beam: bm };
  return g;
}
function drawSign(door, c) {
  const { sc, sign } = door.userData, x = sc.getContext('2d');
  x.clearRect(0, 0, 256, 96);
  x.fillStyle = '#7a111a'; x.strokeStyle = '#ffd24d'; x.lineWidth = 6;
  x.beginPath(); if (x.roundRect) x.roundRect(4, 4, 248, 88, 18); else x.rect(4, 4, 248, 88); x.fill(); x.stroke();
  x.font = '48px "Noto Color Emoji",sans-serif'; x.textBaseline = 'middle'; x.fillText(c.icon, 14, 50);
  x.fillStyle = '#fff3c4'; x.font = '800 36px "Baloo 2",Mukta,sans-serif'; x.fillText(cName(c), 78, 52, 166);
  sign.material.map.needsUpdate = true;
}
function makeBox() {
  const mg = new Merge();
  mg.add(G.box(0.56, 0.34, 0.44), mat4(0, 0, 0), C.maroon);
  mg.add(G.box(0.58, 0.36, 0.08), mat4(0, 0, 0), C.gold); mg.add(G.box(0.08, 0.36, 0.46), mat4(0, 0, 0), C.gold);
  for (const s of [-1, 1]) mg.add(G.tor(0.08, 0.03, 6, 10), mat4(s * 0.08, 0.22, 0, 0, 0, s * 0.6), C.gold);
  const m = mg.mesh(0.015); m.castShadow = true; return m;
}

export class Delivery {
  constructor(game, scene) {
    this.g = game;
    this.door = makeDoor(); this.door.visible = false; scene.add(this.door);
    this.cust = {}; for (const c of CUST) { const m = makeCustomer(c.id); m.visible = false; scene.add(m); this.cust[c.id] = m; }
    this.box = makeBox(); this.box.visible = false; scene.add(this.box);
    this.el = document.querySelector('#order');
    this.reset();
  }
  reset() {
    this.st = 'off'; this.toNext = rand(380, 480); this.streak = 0; this.lastC = null;
    this.door.visible = false; this.box.visible = false; this.boxT = -1;
    for (const k in this.cust) this.cust[k].visible = false;
    if (this.g.world) this.g.world.boost = null;
    this.hide();
  }
  hide() { if (this.el) this.el.hidden = true; document.body.classList.remove('hasOrder'); }
  active() { return this.st === 'pack' || this.st === 'go'; }
  canStart() {
    const g = this.g, w = g.world, p = g.p;
    if (g.state !== 'play' || !g.tutDone || w.tut > 0 || p.fly > 0 || w.railObs > 0 || w.melaObs > 0 || w.baraatQ) return false;
    return zoneAt(w.dist) !== 'jungle' && zoneAt(w.dist + 650) !== 'jungle';
  }
  start() {
    const w = this.g.world, d = w.diff;
    let c; do { c = pick(CUST); } while (c.id === this.lastC);
    this.c = c; this.lastC = c.id;
    const t1 = weighted([['rasgulla', 5], ['gulabjamun', 4], ['balushahi', 3], ['chamcham', 1.3]]);
    const need = { [t1]: t1 === 'chamcham' ? randi(2, 3) : randi(4, 6) + (d > 0.5 ? 1 : 0) };
    if (Math.random() < 0.55) { const t2 = pick(ORDER_TYPES.filter((t) => t !== t1)); need[t2] = t2 === 'chamcham' ? 2 : randi(2, 4); }
    this.need = need; this.have = {}; this.wrong = 0; this.stars = 3;
    const n = Object.values(need).reduce((a, b) => a + b, 0);
    this.packT = this.packMax = 24 + 2 * n;
    w.boost = {}; let k = 0; for (const t in need) w.boost[t] = k++ ? 26 : 40;
    this.st = 'pack';
    const list = Object.entries(need).map(([t, q]) => `${q} ${swName(t)}`).join(' + ');
    this.g.cheer('order', 2200, -1, true, 'gold', T('ordSay', cName(c), list));
    this.g.say(T('ordSay', cName(c), list), false);
    this.g.sound.order(); vibrate(25);
    if (this.g.emo) this.g.emo.play('wow', 0.9);
    this.paint(true);
  }
  // मिठाई उठाई (game.collect से)
  onCollect(type) {
    if (this.st !== 'pack' || !ORDER_TYPES.includes(type)) return;
    if (this.need[type]) {
      if ((this.have[type] || 0) >= this.need[type]) return;
      this.have[type] = (this.have[type] || 0) + 1;
      this.justT = type;
      if (Object.keys(this.need).every((t) => (this.have[t] || 0) >= this.need[t])) { this.ready(); return; }
      this.paint();
    } else {
      this.wrong++;
      if (this.wrong % 6 === 0 && this.stars > 1) {
        this.stars--; this.g.sound.bump(); this.g.toast('⭐ ' + T('ordWrong'), 900, 'warn');
        if (this.el) { this.el.classList.remove('shake'); void this.el.offsetWidth; this.el.classList.add('shake'); }
      }
      this.paint();
    }
  }
  ready() {
    const w = this.g.world;
    w.boost = null;
    this.st = 'go';
    this.lane = randi(0, 2);
    this.side = this.lane === 0 ? -1 : this.lane === 2 ? 1 : pick([-1, 1]);
    const z = -118;
    this.door.position.set(LANES[this.lane], 0, z); this.door.visible = true; drawSign(this.door, this.c);
    const cu = this.cm = this.cust[this.c.id];
    cu.position.set(this.side * (ROAD_HALF - 0.2), 0, z - 9); // दरवाज़े से थोड़ा आगे — डिब्बा पकड़ते दिखें cu.rotation.y = -this.side * PI / 2 + this.side * 0.35; cu.visible = true;
    cu.userData.body.position.y = 0; cu.userData.arms.forEach((a) => a.rotation.set(0, 0, 0));
    // दरवाज़े वाली लेन में आगे-पीछे रुकावट नहीं (ट्रेन/बारात अभी नहीं आएँगे)
    for (let i = w.obs.length - 1; i >= 0; i--) {
      const e = w.obs[i];
      if (e.vz || e.dead) continue;
      if (Math.abs(e.x - LANES[this.lane]) < e.halfW + 0.6 && e.z > z - 12 && e.z < z + 20) { w.relObs(e); w.obs.splice(i, 1); }
    }
    w.toRail = Math.max(w.toRail, 260); w.toBaraat = Math.max(w.toBaraat, 260);
    this.g.cheer('ordReady', 1600, -1, true, 'gold', T('ordReady'));
    this.g.sound.power(); vibrate([20, 30, 20]);
    this.paint(true);
  }
  fail(why) {
    this.st = why === 'miss' ? 'miss' : 'off';
    this.g.world.boost = null; this.streak = 0;
    this.toNext = rand(500, 750);
    this.g.toast((why === 'miss' ? T('ordMiss') : T('ordLate', cName(this.c))) + ' 😤', 1500, 'warn');
    this.g.sound.fail();
    if (why !== 'miss') { this.door.visible = false; }
    this.hide();
  }
  success() {
    const g = this.g;
    this.st = 'done'; this.streak++;
    const sw = 15 * this.stars + 5 * Math.min(this.streak - 1, 4);
    g.got += sw; g.score += 400 * this.stars * g.mult;
    g.meter = Math.min(1, g.meter + 0.25);
    g.msBump('deliver'); g.msBump('sweets', g.got, true);
    g.cheer('deliver', 1800, -1, true, 'gold', `${'⭐'.repeat(this.stars)} ${T('ordGot', sw)}`);
    g.sound.deliver(); vibrate([30, 40, 30, 40, 60]);
    if (g.emo) g.emo.play('love', 1.4);
    g.shake = Math.max(g.shake, 0.15);
    if (g.mom) g.mom.want(500 + 50 * this.stars, T('momDeliver', '⭐'.repeat(this.stars)), 250);
    this.box.visible = true; this.boxT = 0; this.box0 = new THREE.Vector3(g.p.x, g.p.y + 1.6, -0.3);
    const cu = this.cm.position; g.world.parts.burst(cu.x, 2.2, cu.z, 0xff4d6d, 16, 2, 3, 1.0, -3);
    this.toNext = rand(600, 900);
    this.hide();
  }
  update(dt, dz) {
    const g = this.g, p = g.p;
    if (this.st === 'off') {
      if (this.toNext > 0) this.toNext -= dz;
      else if (this.canStart()) this.start();
    } else if (this.st === 'pack') {
      this.packT -= dt;
      if (this.packT <= 0) this.fail('late');
      else this.paintTimer();
    }
    if (this.cm && this.cm.visible && !this.door.visible) { this.cm.position.z += dz; if (this.cm.position.z > 16) { this.cm.visible = false; if (this.st === 'done' || this.st === 'miss') this.st = 'off'; } }
    if (this.door.visible) {
      this.door.position.z += dz;
      const bm = this.door.userData.beam; bm.material.opacity = 0.35 + Math.sin(performance.now() / 160) * 0.12;
      bm.visible = this.st === 'go';
      if (this.cm) this.cm.position.z += dz;
      if (this.st === 'go') {
        if (this.door.position.z > -0.15) { if (p.lane === this.lane) this.success(); else this.fail('miss'); this.popDoor(); }
        else this.paintLane();
      }
      if (this.door.position.z > 16) { this.door.visible = false; if (this.cm) this.cm.visible = false; if (this.st === 'done' || this.st === 'miss') this.st = 'off'; }
    }
    // ग्राहक की हरकत
    const cm = this.cm;
    if (cm && cm.visible) {
      const t = performance.now() / 1000, u = cm.userData, [aL, aR] = u.arms;
      if (this.st === 'done') { // ख़ुशी — उछलना, दोनों हाथ ऊपर
        u.body.position.y = Math.abs(Math.sin(t * 9)) * 0.35;
        aL.rotation.z = damp(aL.rotation.z, -2.6, 10, dt); aR.rotation.z = damp(aR.rotation.z, 2.6, 10, dt);
        if (Math.random() < 0.25) g.world.parts.burst(cm.position.x, 2.3, cm.position.z, Math.random() < 0.5 ? 0xff4d6d : 0xffd24d, 1, 1, 1.5, 0.9, -1);
      } else if (this.st === 'miss') { // नाराज़ — हाथ कमर पर, सिर हिलाना
        aL.rotation.z = damp(aL.rotation.z, -0.7, 8, dt); aR.rotation.z = damp(aR.rotation.z, 0.7, 8, dt); u.body.rotation.y = Math.sin(t * 10) * 0.15;
      } else { // हाथ हिलाकर बुलाना
        const near = this.door.position.z > -75;
        aR.rotation.z = damp(aR.rotation.z, near ? 2.5 + Math.sin(t * 10) * 0.45 : 0.1, 8, dt);
        aR.rotation.x = 0; aL.rotation.z = damp(aL.rotation.z, -0.15, 6, dt); u.body.rotation.y = 0;
        u.body.position.y = near ? Math.abs(Math.sin(t * 5)) * 0.06 : 0;
      }
    }
    // डिब्बा ग्राहक के हाथ में उड़कर
    if (this.boxT >= 0) {
      this.boxT += dt; const k = Math.min(1, this.boxT / 0.42), B = this.box;
      const tx = cm.position.x - this.side * 0.2, tz = cm.position.z + 0.3, ty = 1.35 * (cm.userData.sc || 1);
      B.position.set(this.box0.x + (tx - this.box0.x) * k, this.box0.y + (ty - this.box0.y) * k + Math.sin(k * PI) * 2.0, this.box0.z + (tz - this.box0.z) * k);
      B.rotation.set(k * 5, k * 3, 0);
      if (k >= 1) { this.boxT = -1; B.visible = false; g.world.parts.burst(tx, ty + 0.4, tz, 0xffd24d, 22, 3, 3, 0.8, -6); }
    }
  }
  // गोलू के निकलते ही दरवाज़ा गेंदे की पंखुड़ियों में बिखर जाए (कैमरा उसके बीच से न गुज़रे)
  popDoor() {
    const d = this.door, x = d.position.x, z = d.position.z, P = this.g.world.parts;
    for (let i = 0; i < 4; i++) P.burst(x + (i % 2 ? 1.1 : -1.1), 1 + i * 0.6, z - 0.4, i % 2 ? 0xf08a1c : 0xf5c542, 12, 3, 3, 0.9, -7);
    P.burst(x, 3.4, z - 0.4, 0xffd24d, 18, 4, 3, 0.8, -6);
    d.visible = false;
  }
  // ---------- HUD का छोटा कार्ड ----------
  paint(full = false) {
    const el = this.el; if (!el) return;
    el.hidden = false; document.body.classList.add('hasOrder');
    if (this.st === 'pack') {
      const chips = Object.entries(this.need).map(([t, q]) => { const h = this.have[t] || 0; return `<span class="${h >= q ? 'ok' : ''}${this.justT === t ? ' just' : ''}"><i style="background:${SW_CSS[t]}"></i>${swName(t)} <b>${h}/${q}</b></span>`; }).join('');
      el.innerHTML = `<div class="oh"><span class="oa">${this.c.icon}</span><span class="on">${cName(this.c)}</span><span class="os">${'⭐'.repeat(this.stars)}</span></div><div class="oc">${chips}</div><div class="ot"><b></b></div>`;
      this.justT = null; this.tb = el.querySelector('.ot b'); this.paintTimer();
    } else if (this.st === 'go') {
      el.innerHTML = `<div class="oh"><span class="oa">📦</span><span class="on">${T('ordGo')}</span><span class="os">${'⭐'.repeat(this.stars)}</span></div><div class="ol"><span></span><span></span><span></span></div>`;
      this.lanesEl = el.querySelectorAll('.ol span'); this.laneK = null; this.paintLane();
    }
    if (full) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  paintTimer() { if (this.tb) { const k = clamp(this.packT / this.packMax, 0, 1); this.tb.style.width = (k * 100).toFixed(1) + '%'; this.tb.classList.toggle('low', k < 0.25); } }
  paintLane() {
    if (!this.lanesEl) return;
    const key = this.lane + ':' + this.g.p.lane; if (key === this.laneK) return; this.laneK = key;
    this.lanesEl.forEach((s, i) => { s.className = (i === this.lane ? 't' : '') + (i === this.g.p.lane ? ' me' : ''); s.textContent = i === this.lane ? '🎁' : i === this.g.p.lane ? '🏃' : ''; });
  }
}
