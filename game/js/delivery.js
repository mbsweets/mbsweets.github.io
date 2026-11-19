// 🛵 डिलीवरी (17 नवंबर 2026 से नई): फ़ोन बजा → रास्ते में "माँ भगवती मिष्ठान भंडार" (गोलू जितनी बड़ी बनाए, उतनी बड़ी) →
// हलवाई काका डिब्बा उछालते हैं, गोलू लपककर दुकान के आगे खड़ी स्कूटी पर → स्कूटी से ग्राहक के घर (टक्कर = डिब्बा हिला, ⭐ कम) →
// घर के आगे ब्रेक, गोलू उतरकर डिब्बा देता है, ग्राहक ख़ुश होकर इनाम देता है → स्कूटी वहीं, गोलू फिर दौड़ने लगता है.
// तीनों पल (डिब्बा लेना, पहुँचना, देना) धीमी गति + पास के कैमरे में, ताकि खिलाड़ी साफ़ समझे कि डिलीवरी हो रही है.
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge } from './art.js';
import { ROAD_HALF } from './models.js';
import { LANES, zoneAt } from './world.js';
import { T, LANG } from './i18n.js';
import { rand, randi, pick, weighted, clamp, damp, lerp, vibrate, store } from './util.js';

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
export const SHOP_NAME = 'माँ भगवती मिष्ठान भंडार';
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
  } else if (id === 'halwai') { // हलवाई काका — सफ़ेद बनियान, कंधे पर लाल गमछा, गांधी टोपी, बड़ी मूँछ
    for (const x of [-0.13, 0.13]) mg.add(G.cap(0.13, 0.5, 8), mat4(x, 0.38, 0), 0xf7f2e8);
    mg.add(G.cap(0.33, 0.48, 14), mat4(0, 1.02, 0), 0xfbfaf6); mg.add(G.box(0.2, 0.7, 0.05), mat4(0.14, 1.1, 0.29, 0, 0, 0.5), C.sindoor);
    face(1.6); mg.add(G.box(0.3, 0.13, 0.42), mat4(0, 1.82, -0.02), 0xffffff); mg.add(G.box(0.26, 0.06, 0.06), mat4(0, 1.53, 0.24), 0x2a2420);
    armCol = SKIN;
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
  // दो पल्लों वाला मिथिला दरवाज़ा (खंभों पर कब्ज़ा) — गोलू खटखटाए तो अंदर की ओर खुले
  const leaves = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.position.set(s * W, 0, 0);
    const lm = new Merge(), w = W - 0.08, cx = -s * (w / 2 + 0.04);
    lm.add(G.box(w, 2.1, 0.07), mat4(cx, 1.08, 0), 0x7a3a1c);
    for (const y of [0.12, 2.06]) lm.add(G.box(w, 0.07, 0.09), mat4(cx, y, 0), C.gold);
    lm.add(G.box(0.06, 2.0, 0.09), mat4(cx - s * (w / 2 - 0.05), 1.08, 0), C.gold);
    lm.add(G.cyl(0.24, 0.24, 0.02, 18), mat4(cx, 1.3, 0.045, PI / 2, 0, 0), C.sindoor); lm.add(G.cyl(0.15, 0.15, 0.025, 14), mat4(cx, 1.3, 0.05, PI / 2, 0, 0), 0xf5c542); // गोल चित्रकारी
    for (let i = 0; i < 4; i++) lm.add(G.sph(0.035, 6, 5), mat4(cx, 0.45 + i * 0.17, 0.05), C.leaf);
    lm.add(G.tor(0.05, 0.012, 5, 10), mat4(-s * 0.1, 1.1, 0.07, 0, 0, 0), 0xc0c4c8); // कुंडी
    pv.add(lm.mesh(0.012)); g.add(pv); leaves.push(pv);
  }
  g.traverse((o) => { if (o.isMesh && o !== bm && o !== ar && o !== sign) o.castShadow = true; });
  g.userData = { sign, sc, beam: bm, ar, leaves };
  return g;
}
// पल्ले: 0 = बंद, 1 = पूरा खुला (अंदर की ओर)
function doorOpen(door, k) { const L = door.userData.leaves; if (!L) return; L[0].rotation.y = 1.75 * k; L[1].rotation.y = -1.75 * k; }
function drawSign(door, c) {
  const { sc, sign } = door.userData, x = sc.getContext('2d');
  x.clearRect(0, 0, 256, 96);
  x.fillStyle = '#7a111a'; x.strokeStyle = '#ffd24d'; x.lineWidth = 6;
  x.beginPath(); if (x.roundRect) x.roundRect(4, 4, 248, 88, 18); else x.rect(4, 4, 248, 88); x.fill(); x.stroke();
  x.font = '48px "Noto Color Emoji",sans-serif'; x.textBaseline = 'middle'; x.fillText(c.icon, 14, 50);
  x.fillStyle = '#fff3c4'; x.font = '800 36px "Baloo 2",Mukta,sans-serif'; x.fillText(cName(c), 78, 52, 166);
  sign.material.map.needsUpdate = true;
}
// ---------------- मिठाई का डिब्बा: खुला डिब्बा + 4 मिठाई + ढक्कन (कब्ज़े पर) + सुनहरा फ़ीता ----------------
const BW = 0.56, BH = 0.3, BD = 0.44;
function makeBox() {
  const g = new THREE.Group(), mg = new Merge(), t = 0.03;
  mg.add(G.box(BW, t, BD), mat4(0, -BH / 2 + t / 2, 0), C.maroon);
  for (const s of [-1, 1]) { mg.add(G.box(t, BH, BD), mat4(s * (BW / 2 - t / 2), 0, 0), C.maroon); mg.add(G.box(BW, BH, t), mat4(0, 0, s * (BD / 2 - t / 2)), C.maroon); }
  mg.add(G.box(BW + 0.012, 0.05, BD + 0.012), mat4(0, -BH / 2 + 0.07, 0), C.gold);
  mg.add(G.box(BW - 0.06, 0.01, BD - 0.06), mat4(0, -BH / 2 + 0.04, 0), 0xfff1d6); // अंदर का काग़ज़
  const base = mg.mesh(0.012); base.castShadow = true; g.add(base);
  const bm = new THREE.MeshStandardMaterial({ color: 0xfff8ea, roughness: 0.45 });
  const balls = [];
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(G.sph(0.088, 14, 10), bm); b.position.set(i % 2 ? 0.12 : -0.12, -BH / 2 + 0.12, i < 2 ? -0.09 : 0.09); b.visible = false; g.add(b); balls.push(b); }
  const lidP = new THREE.Group(); lidP.position.set(0, BH / 2, -BD / 2); g.add(lidP);
  const lm = new Merge(); lm.add(G.box(BW + 0.02, 0.04, BD + 0.02), mat4(0, 0.02, BD / 2), C.maroon); lm.add(G.box(BW - 0.12, 0.012, BD - 0.14), mat4(0, 0.045, BD / 2), 0xe8b730);
  const lid = lm.mesh(0.012); lid.castShadow = true; lidP.add(lid);
  const rib = new THREE.Group(), rm = new Merge(), RC = 0xf2c230;
  rm.add(G.box(BW + 0.035, 0.03, 0.05), mat4(0, BH / 2 + 0.05, 0), RC); rm.add(G.box(0.05, 0.03, BD + 0.035), mat4(0, BH / 2 + 0.05, 0), RC);
  for (const s of [-1, 1]) { rm.add(G.box(0.03, BH + 0.06, 0.05), mat4(s * (BW / 2 + 0.012), 0.02, 0), RC); rm.add(G.box(0.05, BH + 0.06, 0.03), mat4(0, 0.02, s * (BD / 2 + 0.012)), RC); }
  for (const s of [-1, 1]) rm.add(G.tor(0.075, 0.024, 6, 12), mat4(s * 0.075, BH / 2 + 0.13, 0, 0, 0, s * 0.55), RC);
  rm.add(G.sph(0.038, 8, 6), mat4(0, BH / 2 + 0.1, 0), C.sindoor);
  rib.add(rm.mesh(0.008)); g.add(rib);
  g.userData = { base, balls, bm, lidP, rib };
  boxLook(g, 0, 4, 1);
  return g;
}
// open: 0 बंद … 1 खुला; fill: कितनी मिठाई दिखे; rib: फ़ीते का नाप (0 = नहीं)
function boxLook(b, open, fill, rib) {
  const u = b.userData; u.lidP.rotation.x = -1.95 * open;
  u.balls.forEach((m, i) => { m.visible = i < fill; });
  u.rib.visible = rib > 0.02; u.rib.scale.setScalar(Math.max(0.02, rib));
}
// दुकान के आगे काउंटर: लकड़ी की चौकी, सफ़ेद कपड़ा, हाँडी (रसगुल्ले), थाल
function makeCounter() {
  const g = new THREE.Group(), mg = new Merge();
  for (const [x, z] of [[-0.6, -0.34], [0.6, -0.34], [-0.6, 0.34], [0.6, 0.34]]) mg.add(G.cyl(0.045, 0.045, 0.9, 6), mat4(x, 0.45, z), 0x6b4a2c);
  mg.add(G.box(1.34, 0.08, 0.84), mat4(0, 0.92, 0), 0x8a5a34); mg.add(G.box(1.36, 0.03, 0.86), mat4(0, 0.97, 0), 0xf6efe0);
  for (let i = 0; i < 10; i++) mg.add(G.box(0.12, 0.2, 0.02), mat4(-0.62 + i * 0.138, 0.82, 0.43), i % 2 ? C.sindoor : C.haldi); // झालर
  mg.add(G.sph(0.24, 14, 10), mat4(0.4, 1.17, -0.12, 0, 0, 0, 1, 0.8, 1), C.terracotta); mg.add(G.cyl(0.17, 0.19, 0.08, 14), mat4(0.4, 1.34, -0.12), 0x9a4a2c);
  mg.add(G.cyl(0.16, 0.16, 0.02, 14), mat4(0.4, 1.36, -0.12), 0xe8a23a); // चाशनी
  for (let i = 0; i < 5; i++) mg.add(G.sph(0.06, 10, 8), mat4(0.4 + Math.cos(i * 1.3) * 0.08, 1.39, -0.12 + Math.sin(i * 1.3) * 0.08), 0xfff8ea);
  mg.add(G.cyl(0.3, 0.3, 0.03, 18), mat4(-0.4, 1.0, -0.1), 0xc0c4c8); // थाल
  for (let i = 0; i < 7; i++) mg.add(G.sph(0.055, 8, 6), mat4(-0.4 + Math.cos(i * 0.9) * 0.16, 1.05, -0.1 + Math.sin(i * 0.9) * 0.16), i % 2 ? 0x7a2a14 : 0xe8a447);
  const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
  g.visible = false;
  return g;
}
// हेलमेट (लाल, सफ़ेद धारी, काला शीशा) — r = नाप
function makeHelmet(r) {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(new THREE.SphereGeometry(r, 18, 12, 0, PI * 2, 0, PI * 0.56), mat4(0, 0, 0), 0xc4161c);
  mg.add(G.tor(r * 0.98, r * 0.07, 6, 24), mat4(0, r * 0.06, 0, PI / 2, 0, 0), 0x2a2420);
  mg.add(G.tor(r * 1.005, r * 0.06, 6, 20, PI), mat4(0, 0, 0, 0, PI / 2, 0), 0xffffff); // बीच की धारी
  mg.add(new THREE.SphereGeometry(r * 1.02, 16, 8, PI * 0.2, PI * 0.6, PI * 0.28, PI * 0.22), mat4(0, 0, 0, 0, 0, 0), 0x2a3440); // शीशा (आगे)
  mg.add(G.box(r * 0.45, r * 0.3, r * 0.05), mat4(r * 0.82, r * 0.38, 0, 0, PI / 2, 0.5), C.haldi); // बगल में पीला ठप्पा
  const m = mg.mesh(0.006); m.castShadow = true; g.add(m);
  return g;
}

// ---------------- स्कूटी (मुँह -z की ओर) ----------------
function sideTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  x.fillStyle = '#7a111a'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#ffd24d'; x.font = '800 44px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText('MB Sweets', 128, 40, 236); x.fillStyle = '#fff3c4'; x.font = '700 22px Mukta,sans-serif'; x.fillText('डिलीवरी', 128, 76);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeScooty() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mg = new Merge(), RED = 0xb3121c, CREAM = 0xfff1d6;
  mg.add(G.box(0.44, 0.1, 1.0), mat4(0, 0.3, 0.02), 0x2a2420); // पायदान
  mg.add(G.cap(0.27, 0.55, 14), mat4(0, 0.55, 0.42, PI / 2, 0, 0, 1, 0.95, 1), RED); // पीछे का गोल हिस्सा
  mg.add(G.box(0.5, 0.06, 0.9), mat4(0, 0.47, 0.42), C.gold); // सुनहरी धारी
  mg.add(G.box(0.34, 0.11, 0.66), mat4(0, 0.85, 0.36), 0x2a1a14); // सीट
  mg.add(G.box(0.52, 0.8, 0.12), mat4(0, 0.68, -0.46, -0.18, 0, 0), RED); // आगे की ढाल
  mg.add(G.box(0.36, 0.5, 0.06), mat4(0, 0.7, -0.38, -0.18, 0, 0), CREAM);
  mg.add(G.cyl(0.05, 0.05, 0.62, 8), mat4(0, 1.02, -0.56, -0.3, 0, 0), 0x8a8f96); // हैंडल का डंडा
  mg.add(G.cyl(0.03, 0.03, 0.74, 8), mat4(0, 1.3, -0.62, 0, 0, PI / 2), 0x8a8f96); // हैंडल
  for (const s of [-1, 1]) { mg.add(G.cyl(0.042, 0.042, 0.14, 8), mat4(s * 0.38, 1.3, -0.62, 0, 0, PI / 2), 0x1d1210); mg.add(G.cyl(0.012, 0.012, 0.3, 5), mat4(s * 0.26, 1.45, -0.6, 0, 0, s * 0.4), 0x8a8f96); mg.add(G.sph(0.06, 8, 6), mat4(s * 0.33, 1.6, -0.6, 0, 0, 0, 1, 0.7, 0.4), 0x9fd4ec); }
  mg.add(G.box(0.36, 0.2, 0.2), mat4(0, 1.22, -0.66), RED); mg.add(G.sph(0.09, 12, 8), mat4(0, 1.2, -0.77), 0xfff6c0); // बत्ती
  mg.add(G.box(0.12, 0.38, 0.1), mat4(0, 0.48, -0.66), RED); // आगे का मडगार्ड
  mg.add(G.box(0.5, 0.05, 0.42), mat4(0, 0.93, 0.86), 0x3a3a3a); // पीछे का कैरियर
  for (const z of [-0.68, 0.62]) { // पहिये
    mg.add(G.tor(0.21, 0.075, 8, 20), mat4(0, 0.25, z, 0, PI / 2, 0), 0x1d1d1d);
    mg.add(G.cyl(0.11, 0.11, 0.1, 12), mat4(0, 0.25, z, 0, 0, PI / 2), 0xc0c4c8);
  }
  mg.add(G.sph(0.05, 6, 5), mat4(0.18, 0.6, 0.95), 0xff3030); mg.add(G.sph(0.05, 6, 5), mat4(-0.18, 0.6, 0.95), 0xff3030); // पीछे की बत्ती
  const m = mg.mesh(0.02); m.castShadow = true; body.add(m);
  const st = sideTex();
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.22), new THREE.MeshBasicMaterial({ map: st, toneMapped: false })); p.position.set(s * 0.272, 0.6, 0.42); p.rotation.y = s * PI / 2; body.add(p); }
  g.userData = { body, carrier: new THREE.Vector3(0, 1.12, 0.86) };
  g.visible = false;
  return g;
}

// ---------------- ग्राहक का घर (मिथिला का मिट्टी का घर + फूस की छत + कोहबर जैसी चित्रकारी) ----------------
function wallArt() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d');
  x.fillStyle = '#f1dcb5'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#b3121c'; x.lineWidth = 6; x.strokeRect(6, 6, 244, 116);
  x.fillStyle = '#2e7b47'; for (let i = 0; i < 14; i++) { x.beginPath(); x.moveTo(14 + i * 17, 12); x.lineTo(22 + i * 17, 12); x.lineTo(18 + i * 17, 22); x.fill(); }
  x.fillStyle = '#d1261c'; x.beginPath(); x.ellipse(70, 70, 30, 16, 0, 0, PI * 2); x.fill(); x.fillStyle = '#f2a91b'; x.beginPath(); x.ellipse(186, 70, 30, 16, 0, 0, PI * 2); x.fill(); // मछली जैसी आकृति
  x.fillStyle = '#1d1210'; x.beginPath(); x.arc(52, 66, 4, 0, PI * 2); x.arc(168, 66, 4, 0, PI * 2); x.fill();
  x.fillStyle = '#d1261c'; for (const cx of [100, 216]) { x.beginPath(); x.moveTo(cx, 70); x.lineTo(cx + 18, 56); x.lineTo(cx + 18, 84); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function makeHome() {
  const g = new THREE.Group();
  const gate = makeDoor(); gate.userData.ar.visible = false; g.add(gate); // सड़क किनारे गेंदे वाला दरवाज़ा
  const mg = new Merge();
  mg.add(G.box(3.4, 2.4, 2.2), mat4(0, 1.2, -2.4), 0xf1dcb5); mg.add(G.box(3.5, 0.35, 2.3), mat4(0, 0.17, -2.4), 0x9a5a34);
  mg.add(G.cone(2.6, 1.6, 4), mat4(0, 3.2, -2.4, 0, PI / 4, 0, 1, 1, 0.72), 0xc9a54a); // फूस की छत
  mg.add(G.box(0.9, 1.6, 0.06), mat4(0, 0.8, -1.28), 0x5a3a20); // दरवाज़ा
  for (const s of [-1, 1]) mg.add(G.box(0.5, 0.5, 0.06), mat4(s * 1.1, 1.45, -1.28), 0x6b4a2c);
  mg.add(G.cyl(0.25, 0.3, 0.5, 10), mat4(-1.25, 0.25, -0.9), C.terracotta); mg.add(G.sph(0.42, 10, 8), mat4(-1.25, 0.82, -0.9), C.leaf); // तुलसी चौरा
  const m = mg.mesh(0.03); m.castShadow = true; g.add(m);
  const art = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: wallArt(), toneMapped: false })); art.position.set(0, 1.8, -1.29); g.add(art);
  g.visible = false;
  g.userData = { gate };
  return g;
}

const SEAT = 0.36; // स्कूटी पर गोलू कितना ऊपर
const HR = 0.19; // सिर वाले हेलमेट का नाप (मॉडल की इकाई; खेल में ×2.25)
// 🛵 डिलीवरी के हिस्से (18 नवंबर 2026, मालिक: "मिठाई लेता सीधे चला जाता है — एनिमेशन बढ़ाओ"):
// 📞 फ़ोन (गोलू कान पर) → 🏪 दुकान के आगे ब्रेक → हलवाई काका डिब्बे में 4 मिठाई डालते, ढक्कन, फ़ीता बाँधते → डिब्बा गोलू को →
// स्कूटी तक चलकर डिब्बा कैरियर पर → ⛑️ हेलमेट → 🦵 किक मारकर चालू (धुआँ) → सवारी → 🏠 ब्रेक → उतरकर दरवाज़ा ठक-ठक →
// पल्ले खुले, ग्राहक बाहर → डिब्बा → ख़ुशी + 🪙 टिप के सिक्के → 🙏 नमस्ते → फिर दौड़.
// इन पलों में कोई भी स्वाइप/टैप = जल्दी (×2.4).
const SCENE = ['brake', 'pack', 'walk', 'mount', 'helmet', 'kick', 'arrive', 'off2', 'knock', 'open', 'hand', 'thank'];
export class Delivery {
  constructor(game, scene) {
    this.g = game; this.scene = scene;
    this.cust = {}; for (const c of CUST) { const m = makeCustomer(c.id); m.visible = false; scene.add(m); this.cust[c.id] = m; }
    this.halwai = makeCustomer('halwai'); this.halwai.visible = false; scene.add(this.halwai);
    this.counter = makeCounter(); scene.add(this.counter);
    this.home = makeHome(); scene.add(this.home);
    this.door = this.home.userData.gate; // पुराने कोड/कहानी के लिए
    this.box = makeBox(); this.box.visible = false; scene.add(this.box);
    this.fly = new THREE.Mesh(G.sph(0.088, 14, 10), this.box.userData.bm); this.fly.visible = false; scene.add(this.fly); // हलवाई के हाथ से डिब्बे में गिरती मिठाई
    this.scooty = makeScooty(); scene.add(this.scooty);
    this.helmS = makeHelmet(HR * 2.25); this.helmS.position.set(0, 0.92, 0.44); this.helmS.rotation.y = 0.4; this.scooty.userData.body.add(this.helmS); // सीट पर रखा हेलमेट
    this.coins = []; const cg = G.cyl(0.075, 0.075, 0.018, 14), cm = new THREE.MeshStandardMaterial({ color: 0xf2c230, metalness: 0.7, roughness: 0.3 });
    for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(cg, cm); c.visible = false; scene.add(c); this.coins.push({ m: c, t: -1 }); }
    // दुकान के आगे सड़क पर: अरिपन + रोशनी (कहाँ से डिब्बा मिलेगा)
    this.mark = new THREE.Group();
    const ar = new THREE.Mesh(new THREE.CircleGeometry(1.05, 32), new THREE.MeshBasicMaterial({ map: aripanTex(), transparent: true, depthWrite: false, opacity: 0.92 })); ar.rotation.x = -PI / 2; ar.position.y = 0.025; ar.renderOrder = 1; this.mark.add(ar);
    const bm = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 16, 20, 1, true), new THREE.MeshBasicMaterial({ map: beamTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0.5, toneMapped: false })); bm.position.y = 8; this.mark.add(bm);
    this.mark.userData.beam = bm; this.mark.visible = false; scene.add(this.mark);
    this.el = document.querySelector('#order');
    this.v = new THREE.Vector3(); this.v2 = new THREE.Vector3();
    this.reset();
  }
  reset() {
    this.st = 'off'; this.toNext = rand(1050, 1200); this.streak = 0; this.lastC = null; this.cap = Infinity; this.boxT = -1; this.turnY = 0; this.turnTo = 0; this.callT = 0; this.fast = 1; // पहले पोखर (~600 मी.), फिर पहली डिलीवरी
    this.home.visible = false; this.box.visible = false; this.scooty.visible = false; this.mark.visible = false; this.halwai.visible = false; this.counter.visible = false; this.fly.visible = false;
    for (const c of this.coins) { c.m.visible = false; c.t = -1; }
    if (this.shop) this.shop.visible = false; this.shop = null;
    for (const k in this.cust) this.cust[k].visible = false;
    if (this.g.p) this.g.p.scooty = false;
    if (this.g.world) this.g.world.boost = null;
    this.helmet(false);
    this.hide();
  }
  hide() { if (this.el) this.el.hidden = true; document.body.classList.remove('hasOrder'); }
  active() { return this.st !== 'off' && this.st !== 'done'; }
  inScene() { return SCENE.includes(this.st); } // रुका हुआ पल (स्वाइप = जल्दी)
  hurry() { this.fast = 2.4; }
  // गोलू के हाथ भरे (झोला छिपे)
  holding() { return this.inScene() || this.st === 'go' || this.st === 'ride'; }
  canStart() {
    const g = this.g, w = g.world, p = g.p;
    if (g.state !== 'play' || !g.tutDone || w.tut > 0 || p.fly > 0 || p.boat || w.pond || w.railObs > 0 || w.melaObs > 0 || w.haatObs > 0 || w.baraatQ || (g.mk && g.mk.st !== 'off')) return false;
    return zoneAt(w.dist) !== 'jungle' && zoneAt(w.dist + 750) !== 'jungle';
  }
  // रास्ते की एक लंबी पट्टी ख़ाली (दुकान/घर के आगे टक्कर न हो)
  clearZone(z0, z1) {
    const w = this.g.world;
    for (let i = w.obs.length - 1; i >= 0; i--) { const e = w.obs[i]; if (e.dead) continue; if (e.z > z0 && e.z < z1) { w.relObs(e); w.obs.splice(i, 1); } }
  }
  quiet(m) { const w = this.g.world; for (const k of ['toRail', 'toBaraat', 'toHaat', 'toMela']) w[k] = Math.max(w[k] || 0, m); w.toPond = Math.max(w.toPond || 0, Math.min(m, 300)); } // पोखर डिलीवरी के बीच वैसे भी नहीं (world.busy) — बस ज़्यादा दूर न खिसके
  // ⛑️ गोलू के सिर पर हेलमेट (पहली बार बनता है); on=false = उतारो. k = ऊपर से उतरता (0…1)
  helmet(on, k = 1) {
    const B = this.g.golu && this.g.golu.B;
    if (on && !this.helmG && B && B.head) { this.helmG = makeHelmet(HR); B.head.add(this.helmG); }
    const h = this.helmG; if (!h) return;
    h.visible = !!on; h.position.set(0, 0.235 + (1 - k) * 0.5, -0.02); h.rotation.x = -0.12 - (1 - k) * 0.6;
    for (const a of this.g.golu.atts || []) if (a.parent === B.head) a.visible = !on; // मुकुट/पाग वगैरह हेलमेट के नीचे छिपे
  }
  // 📞 नया ऑर्डर
  start() {
    const g = this.g, w = g.world;
    let c; do { c = pick(CUST); } while (c.id === this.lastC);
    this.c = c; this.lastC = c.id;
    this.sw = weighted([['rasgulla', 5], ['gulabjamun', 4], ['balushahi', 3], ['chamcham', 2]]);
    this.box.userData.bm.color.set(SW_CSS[this.sw]);
    this.stars = 3; this.bumps = 0;
    this.side = pick([-1, 1]); this.pLane = this.side < 0 ? 0 : 2;
    const lv = g.gshop ? g.gshop.lv : 0, sh = this.shop = g.gshop ? g.gshop.model(lv) : null, z = -130;
    if (sh) { sh.visible = true; sh.scale.setScalar(lv >= 3 ? 0.85 : 1); sh.rotation.y = -this.side * (PI / 2 - 0.7); sh.position.set(this.side * (ROAD_HALF + 1.5 + (lv >= 3 ? 0.4 : 0)), 0, z); } // तिरछी — नाम-पट्टी पीछे से आते गोलू/कैमरे को दिखे
    this.shopZ = z;
    const H = this.halwai; H.visible = true; H.position.set(this.side * (ROAD_HALF + 0.65), 0, z + 1.4); H.rotation.y = -this.side * PI / 2; H.userData.arms.forEach((a) => a.rotation.set(0, 0, 0));
    const K = this.counter; K.visible = true; K.position.set(this.side * (ROAD_HALF - 0.12), 0, z + 1.4); K.rotation.y = PI / 2;
    const B = this.box; B.visible = true; boxLook(B, 1, 0, 0); B.rotation.set(0, 0, 0); this.boxOn = 'counter';
    const S = this.scooty; S.visible = true; S.position.set(this.side * (ROAD_HALF - 0.9), 0, z + 1.4 - 2.7); S.rotation.set(0, 0, 0); S.userData.body.rotation.set(0, 0, 0); this.helmS.visible = true; // काउंटर से आगे, किनारे खड़ी
    this.mark.visible = true; this.mark.position.set(LANES[this.pLane], 0, z + 3.5);
    this.boxT = -1; this.clearZone(z - 28, z + 34); this.quiet(1000);
    this.st = 'toShop'; this.callT = 1.7; this.fast = 1;
    const sw = swName(this.sw);
    g.cheer('order', 2200, -1, true, 'gold', T('ordCall', cName(c), sw));
    g.say(T('ordCall', cName(c), sw), false);
    g.sound.order(); if (g.sound.phone) g.sound.phone(); vibrate([25, 40, 25, 40, 25]);
    if (g.emo) g.emo.play('phone', 1.7);
    this.paint(true);
  }
  // स्कूटी पर टक्कर — डिब्बा हिला (मरना नहीं)
  bump() {
    const g = this.g, p = g.p;
    this.bumps++; if (this.stars > 1) this.stars--;
    p.invT = 1.1; g.shake = Math.max(g.shake, 0.35); g.sound.bump(); vibrate(50);
    this.wob = 0.7; g.toast('📦 ' + T('ordBump'), 900, 'warn');
    if (g.emo) g.emo.play('dizzy', 0.8);
    if (this.el) { this.el.classList.remove('shake'); void this.el.offsetWidth; this.el.classList.add('shake'); }
    this.paint();
  }
  steer(lane) { const p = this.g.p; if (p.lane !== lane) { p.prevLane = p.lane; p.lane = lane; p.tx = LANES[lane]; p.laneT = 0; } }
  go(st) { this.st = st; this.t = 0; }
  finish() {
    const g = this.g;
    this.streak++;
    this.tip = randi(5, 15); let sw = 15 * this.stars + this.tip + 5 * Math.min(this.streak - 1, 4);
    if (store('freshStock') === '1') { sw *= 2; store('freshStock', 0); setTimeout(() => { if (g.state === 'play') g.toast('🔥 ' + T('freshUsed'), 1500, 'gold'); }, 900); } // 🍮 ताज़ा माल
    g.got += sw; g.score += 400 * this.stars * g.mult;
    g.meter = Math.min(1, g.meter + 0.25);
    g.msBump('deliver'); g.msBump('sweets', g.got, true);
    g.runDeliv = (g.runDeliv || 0) + 1;
    g.cheer('deliver', 1900, -1, true, 'gold', `${'⭐'.repeat(this.stars)} ${T('ordGot', sw)}`);
    g.say(T('ordThanks', cName(this.c)), false);
    if (g.emo) g.emo.play('love', 1.4);
    if (g.mom) g.mom.want(500 + 50 * this.stars, T('momDeliver', '⭐'.repeat(this.stars)), 50);
    const cu = this.cm.position; for (const c of [0xffd24d, 0xff4d6d, 0xf5c542]) g.world.parts.burst(cu.x, 2.0, cu.z, c, 14, 3, 3.5, 1.0, -2);
    this.toNext = rand(700, 1000);
    this.hide();
  }
  // खेल की रफ़्तार पर असर (स्कूटी तेज़, ब्रेक/रुकना)
  speedMul() { return this.g.p && this.g.p.scooty ? 1.18 : 1; }
  // गोलू का अंदाज़
  pose(mode) {
    const p = this.g.p, st = this.st;
    if (st === 'helmet') return 'rideHelmet';
    if (st === 'kick') return 'rideKick';
    if (p.scooty) return p.roll > 0 ? 'rideDuck' : 'ride';
    if (st === 'brake' || (st === 'pack' && this.boxT < 1)) return mode === 'jump' ? mode : 'idle';
    if ((st === 'pack' && this.boxT >= 1) || st === 'off2') return 'carryStand';
    if (st === 'walk') return 'carry';
    if (st === 'knock' || st === 'open') return st === 'knock' ? 'knock' : 'carryStand';
    if (st === 'hand') return 'give';
    if (st === 'thank') return this.t < 1.0 ? 'namaste' : 'wave';
    if (this.callT > 0 && (mode === 'run' || mode === 'carry')) return 'runPhone';
    return mode;
  }
  // 🎬 रुके पलों का कैमरा: सामने से (सड़क के बीच से पीछे की ओर देखता) — गोलू का चेहरा, काउंटर/दरवाज़ा, हलवाई/ग्राहक सब एक साथ
  cam() {
    const st = this.st, s = this.side, s2 = this.side2;
    if ((st === 'brake' && this.halwai.position.z > -12) || st === 'pack') return { pos: [s * 0.35, 2.35, -4.5], look: [s * 3.55, 1.3, -0.5] };
    if (['walk', 'mount', 'helmet', 'kick'].includes(st)) return { pos: [s * 0.9, 2.2, -4.3], look: [s * 3.5, 1.35, -0.2] }; // स्कूटी की ओर
    if (['off2', 'knock', 'open', 'hand'].includes(st) || (st === 'thank' && this.t < 1.35) || (st === 'arrive' && this.home.position.z > -8)) return { pos: [s2 * 2.3, 2.15, -4.9], look: [s2 * 4.7, 1.3, -0.5] };
    return null;
  }
  // गोलू का मुँह किधर (रुककर दुकान/दरवाज़े की ओर)
  turn() { return this.turnY; }
  // डिब्बा कंधे पर
  shoulder(out) { const p = this.g.p; return out.set(p.x + 0.42, p.y + 2.0, 0.05); }
  carrier(out) { const S = this.scooty; return out.set(0, 1.12 + 0.17, 0.86).applyEuler(S.rotation).add(S.position); }
  update(dtReal, dz) {
    const g = this.g, p = g.p, B = this.box, S = this.scooty, H = this.halwai, U = B.userData;
    const dt = dtReal * (this.inScene() ? this.fast : 1); // रुके पलों में स्वाइप = जल्दी
    if (this.st === 'off' || this.st === 'done') {
      if (this.st === 'off') { if (this.toNext > 0) this.toNext -= dz; else if (this.canStart()) this.start(); }
    }
    this.t = (this.t || 0) + dt;
    if (this.callT > 0) this.callT -= dtReal;
    // दुनिया के साथ चलती चीज़ें
    if (H.visible) { H.position.z += dz; this.counter.position.z += dz; if (this.shop) this.shop.position.z += dz; this.mark.position.z += dz; if (H.position.z > 22) { H.visible = false; this.counter.visible = false; if (this.shop) this.shop.visible = false; } }
    if (this.mark.visible) { const bm = this.mark.userData.beam; bm.visible = this.st === 'toShop'; bm.material.opacity = 0.35 + Math.sin(performance.now() / 160) * 0.12; }
    if (this.home.visible) { this.home.position.z += dz; if (this.cm) this.cm.position.z += dz; if (this.home.position.z > 24) { this.home.visible = false; if (this.cm) this.cm.visible = false; if (this.st === 'done') this.st = 'off'; } }
    if (S.visible && !p.scooty) { S.position.z += dz; if (S.position.z > 20 && this.st !== 'toShop') S.visible = false; }
    if (this.st === 'done' && !this.home.visible) this.st = 'off';
    const scene = this.inScene();
    if (scene) { p.invT = Math.max(p.invT, 0.6); g.world.sweets.drop(-9, 3); }
    // ---- दुकान की ओर
    if (this.st === 'toShop') {
      const hz = H.position.z;
      if (hz > -32) { this.go('brake'); g.cineSide = this.side; this.steer(this.pLane); this.clearZone(-40, 8); }
      else this.paintDist(Math.max(0, -hz - 4));
    }
    // ---- ब्रेक: काउंटर ठीक बगल में आकर रुको
    if (this.st === 'brake') {
      this.steer(this.pLane);
      const d = Math.max(0, -0.6 - H.position.z);
      this.cap = Math.min(this.cap, Math.sqrt(2 * 26 * d));
      if (Math.random() < 0.5 && g.speed > 3) g.world.parts.burst(p.x, 0.12, 0.6, 0xd9cdb8, 1, 1, 0.6, 0.5, 0);
      if (d < 0.08 || this.cap < 0.3) { this.cap = 0; this.go('pack'); this.boxT = -1; this.mark.visible = false; g.sound.order(); }
    }
    // ---- पैकिंग: 4 मिठाई डिब्बे में → ढक्कन → फ़ीता → डिब्बा गोलू को
    if (this.boxOn === 'counter') { this.counter.updateMatrixWorld(); B.position.copy(this.v.set(0.15, 1.135, -this.side * 0.2).applyMatrix4(this.counter.matrixWorld)); B.rotation.set(0, 0, 0); }
    if (this.st === 'pack') {
      this.cap = 0; this.turnTo = -this.side * 0.95;
      const t = this.t, n = Math.min(4, Math.floor(Math.max(0, t - 0.15) / 0.26));
      const k = Math.max(0, t - 0.15) / 0.26 - n; // गिरती मिठाई
      if (n < 4 && t > 0.15) {
        const F = this.fly; F.visible = true; const bp = U.balls[n].getWorldPosition(this.v2);
        F.position.set(lerp(H.position.x - this.side * 0.35, bp.x, k), lerp(1.55, bp.y, k) + Math.sin(k * PI) * 0.35, lerp(H.position.z, bp.z, k));
        if (k > 0.93 && !U.balls[n].visible) { U.balls[n].visible = true; g.sound.plop && g.sound.plop(); }
      } else this.fly.visible = false;
      const lid = clamp((t - 1.2) / 0.3, 0, 1), rib = clamp((t - 1.5) / 0.28, 0, 1);
      boxLook(B, 1 - lid * lid, Math.min(4, n + (n < 4 && k > 0.93 ? 1 : 0)), rib < 1 ? rib * (1 + Math.sin(rib * PI) * 0.3) : 1);
      if (rib >= 1 && !this.tied) { this.tied = true; g.world.parts.burst(B.position.x, B.position.y + 0.3, B.position.z, 0xffd24d, 14, 2, 2.5, 0.6); g.sound.ring(); }
      if (t > 1.85 && this.boxT < 0) { this.boxT = 0; this.boxOn = null; this.b0 = B.position.clone(); }
      if (this.boxT >= 0 && this.boxT < 1) {
        this.boxT = Math.min(1, this.boxT + dt / 0.42); const e = this.boxT, to = this.shoulder(this.v);
        B.position.set(lerp(this.b0.x, to.x, e), lerp(this.b0.y, to.y, e) + Math.sin(e * PI) * 0.8, lerp(this.b0.z, to.z, e)); B.rotation.set(0, e * PI * 2, 0);
        if (e >= 1) { vibrate(20); if (g.emo) g.emo.play('cool', 0.8); this.turnTo = 0; }
      }
      if (this.boxT >= 1) { B.position.copy(this.shoulder(this.v)); B.rotation.set(0, 0, 0); if (this.t > 2.45) { this.go('walk'); this.tied = false; } }
    }
    // ---- स्कूटी तक चलना (धीरे)
    if (this.st === 'walk') {
      this.cap = 3.2; p.tx = S.position.x; this.turnTo = -this.side * 0.25; B.position.copy(this.shoulder(this.v)).y += Math.abs(Math.sin(this.t * 13)) * 0.04;
      if (S.position.z > -0.12 || this.t > 2.2) { this.go('mount'); this.turnTo = 0; this.cap = 0; this.b0 = B.position.clone(); p.scooty = true; p.roll = 0; if (p.ground) { p.vy = 4.2; p.ground = false; } }
    }
    // ---- चढ़ना + डिब्बा कैरियर पर
    if (['mount', 'helmet', 'kick', 'go', 'ride', 'arrive'].includes(this.st)) {
      S.position.set(p.x, p.y, 0.05);
      this.wob = Math.max(0, (this.wob || 0) - dt);
      const kick = this.st === 'kick' ? Math.sin(this.t * 40) * 0.025 * (this.t > 0.62 ? 1 : 0.4) : 0;
      S.rotation.set(!p.ground ? -0.22 : 0, 0, (p.tx - p.x) * -0.14 + Math.sin(this.wob * 30) * 0.12 * (this.wob > 0 ? 1 : 0) + kick);
      if (this.st === 'mount') { const e = clamp(this.t / 0.32, 0, 1), to = this.carrier(this.v); B.position.set(lerp(this.b0.x, to.x, e), lerp(this.b0.y, to.y, e) + Math.sin(e * PI) * 0.3, lerp(this.b0.z, to.z, e)); B.rotation.copy(S.rotation); if (e >= 1 && p.ground) this.go('helmet'); }
      else { B.position.copy(this.carrier(this.v)); B.rotation.copy(S.rotation); }
      B.visible = true;
      if (this.st === 'ride' || this.st === 'go') if (Math.random() < 0.35 && p.ground) g.world.parts.burst(p.x + rand(-0.15, 0.15), 0.25, 1.4, 0xd9cdb8, 1, 0.6, 0.8, 0.5, -3); // धुआँ/धूल
    }
    if (this.st === 'helmet') { // ⛑️ सीट से उठाकर सिर पर
      this.cap = 0; const e = clamp(this.t / 0.5, 0, 1);
      this.helmS.visible = e < 0.15; this.helmet(e >= 0.15, clamp((e - 0.15) / 0.85, 0, 1));
      if (e >= 1 && !this.hClick) { this.hClick = true; g.sound.click && g.sound.click(); }
      if (this.t > 0.62) { this.hClick = false; this.go('kick'); if (g.sound.kick) g.sound.kick(); }
    }
    if (this.st === 'kick') { // 🦵 किक — दो बार खट-खट, फिर भ्रूँ + धुआँ
      this.cap = 0;
      if (this.t > 0.62 && !this.started) { this.started = true; for (let i = 0; i < 3; i++) g.world.parts.burst(p.x + this.side * 0.12, 0.45, 1.2, i ? 0xbdb6aa : 0x8a8580, 10, 1.6, 1.2, 0.9, -1); vibrate([20, 30, 40]); }
      if (this.t > 0.95) { this.started = false; this.go('go'); this.rideLeft = rand(380, 470); this.homeOn = false; g.cheer('ordRideGo', 1500, -1, true, 'gold', T('ordRideGo', cName(this.c))); this.paint(true); }
    }
    if (this.st === 'go') { this.cap = this.t * 26; this.steer(this.pLane); p.tx = LANES[p.lane]; if (this.t > 1.3) { this.cap = Infinity; this.st = 'ride'; } }
    if (this.st === 'go' || this.st === 'ride') {
      this.rideLeft -= dz;
      if (this.rideLeft <= 125 && !this.homeOn) {
        this.homeOn = true;
        const s2 = this.side2 = pick([-1, 1]), z = -this.rideLeft, Hm = this.home;
        Hm.visible = true; Hm.rotation.y = -s2 * PI / 2; Hm.position.set(s2 * (ROAD_HALF + 1.15), 0, z); drawSign(this.door, this.c); this.door.userData.beam.visible = true; doorOpen(this.door, 0);
        const cu = this.cm = this.cust[this.c.id]; cu.visible = true; cu.position.set(s2 * (ROAD_HALF + 2.1), 0, z); cu.rotation.y = -s2 * PI / 2; // दरवाज़े के पीछे (अंदर)
        cu.userData.body.position.y = 0; cu.userData.arms.forEach((a) => a.rotation.set(0, 0, 0));
        this.clearZone(z - 30, z + 34); this.quiet(400);
      }
      if (this.homeOn) {
        const hz = this.home.position.z;
        if (hz > -26) { this.go('arrive'); this.door.userData.beam.visible = false; this.steer(this.side2 < 0 ? 0 : 2); g.cineSide = this.side2; this.clearZone(-40, 6); }
        this.paintDist(Math.max(0, -hz - 1));
      } else this.paintDist(this.rideLeft);
    }
    if (this.st === 'arrive') { // ब्रेक: दरवाज़ा ठीक बगल में
      this.steer(this.side2 < 0 ? 0 : 2);
      const d = Math.max(0, -0.9 - this.home.position.z); // दरवाज़ा गोलू से थोड़ा आगे — सामने वाले कैमरे में गोलू और ग्राहक दोनों दिखें
      this.cap = Math.min(this.cap, Math.sqrt(2 * 30 * d));
      if (Math.random() < 0.6 && g.speed > 3) g.world.parts.burst(p.x, 0.15, 0.9, 0xd9cdb8, 1, 1, 0.6, 0.5, 0); // टायर की धूल
      if (d < 0.08 || this.cap < 0.4) { this.cap = 0; this.go('off2'); p.scooty = false; this.parkX = S.position.x; this.b0 = B.position.clone(); g.sound.deliver(); vibrate([30, 40, 30]); if (p.ground) { p.vy = 3.2; p.ground = false; } }
    }
    if (['off2', 'knock', 'open', 'hand', 'thank'].includes(this.st)) { S.position.set(this.parkX, 0, 0.05); S.rotation.set(0, 0, 0); }
    if (this.st === 'off2') { // उतरना: हेलमेट सीट पर, डिब्बा कंधे पर, दरवाज़े की ओर
      this.cap = 0; const e = clamp(this.t / 0.42, 0, 1);
      if (e > 0.3) { this.helmet(false); this.helmS.visible = true; }
      p.tx = this.side2 * (ROAD_HALF + 0.15); this.turnTo = -this.side2 * 0.84;
      const to = this.shoulder(this.v); B.position.set(lerp(this.b0.x, to.x, e), lerp(this.b0.y, to.y, e) + Math.sin(e * PI) * 0.25, lerp(this.b0.z, to.z, e)); B.rotation.set(0, 0, 0);
      if (this.t > 0.62) this.go('knock');
    }
    if (this.st === 'knock') { // ठक-ठक
      this.cap = 0; p.tx = this.side2 * (ROAD_HALF + 0.15); B.position.copy(this.shoulder(this.v));
      for (const at of [0.12, 0.5]) if (this.t >= at && (this.kn || 0) < at) { g.sound.knock && g.sound.knock(); const gx = this.side2 * (ROAD_HALF + 1.15); g.world.parts.burst(gx - this.side2 * 0.1, 1.3, this.home.position.z, 0xffe9a8, 6, 1.4, 1.2, 0.35, 0); }
      if (this.t >= 0.12 && (this.kn || 0) < 0.12) g.floatText(T('ordKnock'), 'tp');
      this.kn = this.t;
      if (this.t > 0.85) { this.kn = 0; this.go('open'); }
    }
    if (this.st === 'open') { // पल्ले खुले, ग्राहक दरवाज़े पर
      this.cap = 0; B.position.copy(this.shoulder(this.v));
      const e = clamp(this.t / 0.55, 0, 1), ee = e * e * (3 - 2 * e); doorOpen(this.door, ee);
      const cu = this.cm, s2 = this.side2; cu.position.x = s2 * lerp(ROAD_HALF + 2.1, ROAD_HALF + 1.05, clamp((e - 0.35) / 0.65, 0, 1)); cu.userData.body.position.y = Math.abs(Math.sin(this.t * 14)) * 0.05;
      if (this.t > 0.7) { this.go('hand'); this.boxT = 0; this.box0 = B.position.clone(); }
    }
    if (this.st === 'hand') { // डिब्बा ग्राहक के हाथ में
      this.cap = 0; const cm = this.cm;
      if (this.boxT >= 0) {
        this.boxT = Math.min(1, this.boxT + dt / 0.5); const k = this.boxT;
        const tx = cm.position.x - this.side2 * 0.3, tz = cm.position.z + 0.05, ty = 1.25 * (cm.userData.sc || 1);
        B.position.set(lerp(this.box0.x, tx, k), lerp(this.box0.y, ty, k) + Math.sin(k * PI) * 0.4, lerp(this.box0.z, tz, k)); B.rotation.set(0, k * 1.5, 0);
        if (k >= 1) { this.boxT = -2; g.world.parts.burst(tx, ty + 0.3, tz, 0xffd24d, 22, 3, 3, 0.8); this.finish(); this.go('thank'); this.coinsGo(); }
      }
    }
    if (this.st === 'thank') { // ख़ुशी + टिप के सिक्के + 🙏 → फिर दौड़
      const cm = this.cm; if (cm) B.position.set(cm.position.x - this.side2 * 0.3, 1.25 * (cm.userData.sc || 1) + Math.abs(Math.sin(this.t * 9)) * 0.3, cm.position.z + 0.05);
      if (this.t > 1.35) { this.turnTo = 0; this.cap = (this.t - 1.35) * 28; p.tx = LANES[p.lane]; }
      else { this.cap = 0; p.tx = this.side2 * (ROAD_HALF + 0.15); }
      if (this.cap > 40) { this.cap = Infinity; this.st = 'done'; this.box.visible = false; }
    }
    if (this.st === 'done' && this.box.visible && this.cm) this.box.position.z = this.cm.position.z + 0.05;
    this.updCoins(dtReal, dz);
    this.turnY = damp(this.turnY, this.turnTo, 7, dtReal);
    if (!scene) this.fast = 1;
    // ---- लोगों की हरकत
    const t = performance.now() / 1000;
    if (H.visible) {
      const u = H.userData, [aL, aR] = u.arms;
      const packing = this.st === 'pack' && this.t < 1.8, tossing = this.st === 'pack' && this.boxT >= 0 && this.boxT < 1;
      aR.rotation.z = damp(aR.rotation.z, tossing ? 2.4 : packing ? 1.0 + Math.sin(this.t * 16) * 0.5 : this.st === 'toShop' || this.st === 'brake' ? 1.2 + Math.sin(t * 9) * 0.5 : 2.3 + Math.sin(t * 10) * 0.4, 10, dt); // बुलाना / पैक / उछालना / टाटा
      aL.rotation.z = damp(aL.rotation.z, packing ? -1.0 - Math.sin(this.t * 16 + 1.5) * 0.4 : -0.2, 8, dt);
      aR.rotation.x = damp(aR.rotation.x, packing ? -0.7 : 0, 8, dt); aL.rotation.x = damp(aL.rotation.x, packing ? -0.7 : 0, 8, dt);
    }
    const cm = this.cm;
    if (cm && cm.visible) {
      const u = cm.userData, [aL, aR] = u.arms;
      if (this.st === 'thank' || this.st === 'done') { // ख़ुशी — उछलना, दोनों हाथ ऊपर
        u.body.position.y = Math.abs(Math.sin(t * 9)) * 0.3;
        aL.rotation.z = damp(aL.rotation.z, -2.6, 10, dt); aR.rotation.z = damp(aR.rotation.z, 2.6, 10, dt);
        if (Math.random() < 0.25) g.world.parts.burst(cm.position.x, 2.3, cm.position.z, Math.random() < 0.5 ? 0xff4d6d : 0xffd24d, 1, 1, 1.5, 0.9, -1);
      } else if (this.st === 'hand' || this.st === 'open') { // डिब्बा लेने को दोनों हाथ आगे
        aL.rotation.z = damp(aL.rotation.z, -1.3, 10, dt); aR.rotation.z = damp(aR.rotation.z, 1.3, 10, dt);
      } else { aR.rotation.z = damp(aR.rotation.z, 0.1, 6, dt); aL.rotation.z = damp(aL.rotation.z, -0.1, 6, dt); u.body.position.y = 0; }
    }
  }
  // 🪙 टिप: ग्राहक के हाथ से गोलू की ओर उछलते सिक्के
  coinsGo() {
    const cm = this.cm; if (!cm) return; this.g.sound.coins && this.g.sound.coins(6);
    this.coins.forEach((c, i) => { c.t = -i * 0.08; c.a = cm.position.clone().setY(1.5); c.m.visible = false; });
    setTimeout(() => { const g = this.g; if (g.state === 'play') g.floatText(T('ordTip', this.tip), 'tp'); }, 450);
  }
  updCoins(dt, dz) {
    const p = this.g.p;
    for (const c of this.coins) {
      if (c.t === -1 || !c.a) continue;
      c.t += dt; c.a.z += dz;
      if (c.t < 0) continue;
      const k = Math.min(1, c.t / 0.5); c.m.visible = k < 1;
      c.m.position.set(lerp(c.a.x, p.x, k), lerp(c.a.y, p.y + 1.4, k) + Math.sin(k * PI) * 1.1, lerp(c.a.z, 0.1, k)); c.m.rotation.set(c.t * 14, 0, c.t * 9);
      if (k >= 1) { c.t = -1; c.m.visible = false; this.g.world.parts.burst(p.x, p.y + 1.4, 0.1, 0xffd24d, 4, 1.5, 1.5, 0.35, 0); }
    }
  }
  // ---------- HUD का छोटा कार्ड ----------
  paint(full = false) {
    const el = this.el; if (!el) return;
    if (this.st === 'off' || this.st === 'done' || this.st === 'thank') { this.hide(); return; }
    el.hidden = false; document.body.classList.add('hasOrder');
    const stars = `<span class="os">${'⭐'.repeat(this.stars)}</span>`;
    const item = `<div class="oc"><span><i style="background:${SW_CSS[this.sw]}"></i>📦 ${swName(this.sw)}</span><span>${this.c.icon} ${cName(this.c)}</span></div>`;
    if (['toShop', 'brake', 'pack', 'walk'].includes(this.st)) el.innerHTML = `<div class="oh"><span class="oa">📞</span><span class="on">${SHOP_NAME}</span>${stars}</div>${item}<div class="od"><b>🏪 ${T('ordToShop')}</b><em></em></div>`;
    else el.innerHTML = `<div class="oh"><span class="oa">🛵</span><span class="on">${T('ordRide', cName(this.c))}</span>${stars}</div>${item}<div class="od"><b>🏠</b><em></em></div>`;
    this.dEl = el.querySelector('.od em'); this.dK = null;
    if (full) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  paintDist(m) { const v = Math.round(m / 5) * 5; if (!this.dEl || v === this.dK) return; this.dK = v; this.dEl.textContent = T('ordM', v); }
  // पुराना (मिठाई जमा करने वाला) तरीका अब नहीं — game.collect अब भी बुलाता है
  onCollect() {}
}
