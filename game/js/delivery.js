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
// ---------------- दुकान की छाप (19 नवंबर 2026, मालिक: "स्कूटी पर MB Sweets का लोगो, डिब्बा भी MB Sweets का — दुकान का नाम ज़्यादा हाईलाइट हो") ----------------
// असली फ़ाइनल D3 डिब्बे की छपाई (ढक्कन + बगल) और दुकान के बैनर/बिल्ले — img/ में पहले से बनी तस्वीरें
const TL = new THREE.TextureLoader(), TX = {};
function tex(n) { if (!TX[n]) { const t = TL.load('img/' + n); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; TX[n] = t; } return TX[n]; }
const flat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75 });
const printed = (n) => new THREE.MeshStandardMaterial({ map: tex(n), roughness: 0.55 });
// गोल MB Sweets बिल्ला (स्कूटी, हेलमेट, हलवाई की बनियान)
function badge(sz) { const m = new THREE.Mesh(new THREE.PlaneGeometry(sz, sz), new THREE.MeshStandardMaterial({ map: tex('dl_badge.webp'), transparent: true, alphaTest: 0.4, roughness: 0.5 })); m.renderOrder = 2; return m; }
// लाल-सफ़ेद बटी सुतली (मिठाई के डिब्बे पर दुकान वाली)
let threadMat = null;
function threadM() {
  if (threadMat) return threadMat;
  const c = document.createElement('canvas'); c.width = 32; c.height = 8; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, 32, 8);
  x.fillStyle = '#d1261c'; for (let k = -8; k < 40; k += 8) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 4, 0); x.lineTo(k + 8, 8); x.lineTo(k + 4, 8); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 30); t.colorSpace = THREE.SRGBColorSpace;
  return (threadMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }));
}
// ---------------- मिठाई का डिब्बा = MB Sweets का असली डिब्बा (D3): सादा मरून डिब्बा + छपा ढक्कन (ढक्कन की बगल पर नाम की तख़्ती) ----------------
const BW = 0.64, BH = 0.13, BD = 0.48, SK = 0.072, BS = 1.35; // 8×6 इंच वाला अनुपात; BS = खेल में बड़ा (साफ़ दिखे)
function makeBox() {
  const g = new THREE.Group(), t = 0.012, MR = flat(0x7a111a), CR = flat(0xfff1d6), GD = flat(0xe2b14a);
  const base = new THREE.Group(); g.add(base);
  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [MR, MR, MR, MR, MR, MR]); m.position.set(x, y, z); m.castShadow = true; base.add(m); return m; };
  wall(BW, t, BD, 0, -BH / 2 + t / 2, 0);
  for (const s of [-1, 1]) { wall(BW, BH, t, 0, 0, s * (BD / 2 - t / 2)); wall(t, BH, BD, s * (BW / 2 - t / 2), 0, 0); }
  const liner = new THREE.Mesh(new THREE.BoxGeometry(BW - 0.03, 0.006, BD - 0.03), CR); liner.position.y = -BH / 2 + 0.016; base.add(liner); // अंदर का काग़ज़
  for (const s of [-1, 1]) { const gl = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.004, 0.012, 0.004), GD); gl.position.set(0, -BH / 2 + 0.025, s * (BD / 2 + 0.001)); base.add(gl); }
  const bm = new THREE.MeshStandardMaterial({ color: 0xfff8ea, roughness: 0.45 });
  const balls = [];
  for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(G.sph(0.058, 14, 10), bm); b.position.set(i % 2 ? 0.13 : -0.13, -BH / 2 + 0.078, i < 2 ? -0.1 : 0.1); b.visible = false; g.add(b); balls.push(b); }
  // ढक्कन: पीछे के किनारे पर कब्ज़ा; ऊपर D3 की पूरी छपाई, चारों बगल D3 की पट्टियाँ
  const lidP = new THREE.Group(); lidP.position.set(0, BH / 2, -BD / 2); g.add(lidP);
  const L = new THREE.Group(); L.position.z = BD / 2; lidP.add(L);
  const top = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.02, 0.016, BD + 0.02), [MR, MR, printed('box_top.webp'), MR, MR, MR]); top.position.y = 0.008; top.castShadow = true; L.add(top);
  const lg = printed('box_long.webp'), sh = printed('box_short.webp');
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.BoxGeometry(BW + 0.02, SK, 0.006), s > 0 ? [MR, MR, MR, MR, lg, MR] : [MR, MR, MR, MR, MR, lg]); f.position.set(0, 0.016 - SK / 2, s * (BD / 2 + 0.013)); L.add(f);
    const e = new THREE.Mesh(new THREE.BoxGeometry(0.006, SK, BD + 0.02), s > 0 ? [sh, MR, MR, MR, MR, MR] : [MR, sh, MR, MR, MR, MR]); e.position.set(s * (BW / 2 + 0.013), 0.016 - SK / 2, 0); L.add(e);
  }
  // सुतली: ढक्कन के ऊपर + और चारों ओर नीचे तक, बीच में गाँठ
  const rib = new THREE.Group(), TM = threadM(), r = 0.0065, H2 = BH + 0.03;
  const seg = (len, x, y, z, rx, rz) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 5), TM); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); rib.add(m); };
  seg(BW + 0.05, 0, BH / 2 + 0.03, 0, 0, PI / 2); seg(BD + 0.05, 0, BH / 2 + 0.03, 0, PI / 2, 0);
  for (const s of [-1, 1]) { seg(H2, s * (BW / 2 + 0.024), 0.012, 0, 0, 0); seg(H2, 0, 0.012, s * (BD / 2 + 0.024), 0, 0); }
  for (const s of [-1, 1]) { const lp = new THREE.Mesh(G.tor(0.035, 0.007, 5, 12), TM); lp.position.set(s * 0.035, BH / 2 + 0.06, 0); lp.rotation.set(PI / 2 - 0.4, 0, s * 0.5); rib.add(lp); }
  const kn = new THREE.Mesh(G.sph(0.014, 8, 6), TM); kn.position.y = BH / 2 + 0.035; rib.add(kn);
  g.add(rib);
  g.userData = { base, balls, bm, lidP, rib };
  g.scale.setScalar(BS);
  boxLook(g, 0, 4, 1);
  return g;
}
// open: 0 बंद … 1 खुला; fill: कितनी मिठाई दिखे; rib: सुतली (0 = नहीं)
function boxLook(b, open, fill, rib) {
  const u = b.userData; u.lidP.rotation.x = -1.95 * open;
  u.balls.forEach((m, i) => { m.visible = i < fill; });
  u.rib.visible = rib > 0.02; u.rib.scale.set(1, Math.max(0.02, rib), 1);
}
// दुकान के आगे काउंटर: लकड़ी की चौकी, सफ़ेद कपड़ा, हाँडी (रसगुल्ले), थाल
function makeCounter() {
  const g = new THREE.Group(), mg = new Merge();
  for (const [x, z] of [[-0.6, -0.34], [0.6, -0.34], [-0.6, 0.34], [0.6, 0.34]]) mg.add(G.cyl(0.045, 0.045, 0.9, 6), mat4(x, 0.45, z), 0x6b4a2c);
  mg.add(G.box(1.34, 0.08, 0.84), mat4(0, 0.92, 0), 0x8a5a34); mg.add(G.box(1.36, 0.03, 0.86), mat4(0, 0.97, 0), 0xf6efe0);
  mg.add(G.sph(0.24, 14, 10), mat4(0.4, 1.17, -0.12, 0, 0, 0, 1, 0.8, 1), C.terracotta); mg.add(G.cyl(0.17, 0.19, 0.08, 14), mat4(0.4, 1.34, -0.12), 0x9a4a2c);
  mg.add(G.cyl(0.16, 0.16, 0.02, 14), mat4(0.4, 1.36, -0.12), 0xe8a23a); // चाशनी
  for (let i = 0; i < 5; i++) mg.add(G.sph(0.06, 10, 8), mat4(0.4 + Math.cos(i * 1.3) * 0.08, 1.39, -0.12 + Math.sin(i * 1.3) * 0.08), 0xfff8ea);
  mg.add(G.cyl(0.3, 0.3, 0.03, 18), mat4(-0.4, 1.0, -0.1), 0xc0c4c8); // थाल
  for (let i = 0; i < 7; i++) mg.add(G.sph(0.055, 8, 6), mat4(-0.4 + Math.cos(i * 0.9) * 0.16, 1.05, -0.1 + Math.sin(i * 0.9) * 0.16), i % 2 ? 0x7a2a14 : 0xe8a447);
  const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
  // आगे लटका बैनर: MB Sweets लोगो + "माँ भगवती मिष्ठान भंडार" (दोनों ओर — जो सड़क की ओर हो वही दिखे)
  for (const s of [-1, 1]) { const bn = new THREE.Mesh(new THREE.PlaneGeometry(1.32, 0.22), new THREE.MeshStandardMaterial({ map: tex('dl_banner.webp'), roughness: 0.6 })); bn.position.set(0, 0.8, s * 0.432); bn.rotation.y = s > 0 ? 0 : PI; g.add(bn); }
  g.visible = false;
  return g;
}
// 🔥 मिठाई बनाने की भट्ठी (19 नवंबर, मालिक: "मिठाई बनाने वाला सीन"): मिट्टी का चूल्हा + आग + लोहे की बड़ी कड़ाही —
// ऑर्डर के हिसाब से अंदर चाशनी में रसगुल्ला/चमचम या घी में गुलाब जामुन/बालूशाही, बुलबुले-भाप; झरनी से निकालकर डिब्बे में
const KAD_Y = 0.93, KAD_R = 0.57;
const KAD = { rasgulla: [0xe8b04a, 0xfff8ea, 'ball'], chamcham: [0xe8b04a, 0xf6a8c0, 'oval'], gulabjamun: [0xf3d98a, 0x7a2a14, 'ball'], balushahi: [0xf3d98a, 0xe8a447, 'disc'] };
function makeKitchen() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.cyl(0.62, 0.72, 0.64, 16), mat4(0, 0.32, 0), 0xb5653c); mg.add(G.cyl(0.66, 0.66, 0.06, 16), mat4(0, 0.66, 0), 0x8a4a2a); // मिट्टी का चूल्हा
  mg.add(G.box(0.4, 0.3, 0.14), mat4(0, 0.2, 0.64), 0x1d1210); // आग का मुँह (सड़क की ओर)
  for (let i = 0; i < 4; i++) mg.add(G.cyl(0.05, 0.05, 0.55, 6), mat4(-0.18 + i * 0.12, 0.12, 0.85, PI / 2 - 0.15, 0, 0), C.wood); // लकड़ी
  mg.add(new THREE.SphereGeometry(0.62, 22, 10, 0, PI * 2, PI * 0.56, PI * 0.44), mat4(0, KAD_Y + 0.06, 0), 0x2a2622); // कड़ाही
  mg.add(G.tor(0.6, 0.025, 6, 28), mat4(0, KAD_Y + 0.02, 0, PI / 2, 0, 0), 0x3a3632);
  for (const s of [-1, 1]) mg.add(G.tor(0.09, 0.022, 6, 12), mat4(s * 0.66, KAD_Y + 0.01, 0, 0, PI / 2, 0), 0x3a3632); // कुंडे
  const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
  const liq = new THREE.Mesh(new THREE.CircleGeometry(KAD_R, 28), new THREE.MeshStandardMaterial({ color: 0xe8b04a, roughness: 0.12, metalness: 0.1 })); liq.rotation.x = -PI / 2; liq.position.y = KAD_Y; g.add(liq);
  const sm = new THREE.MeshStandardMaterial({ color: 0xfff8ea, roughness: 0.45 }), sweets = [];
  for (let i = 0; i < 8; i++) { const sw = new THREE.Mesh(G.sph(0.075, 12, 9), sm); const a = i * 2.4, r = 0.12 + (i % 3) * 0.13; sw.userData = { x: Math.cos(a) * r, z: Math.sin(a) * r, ph: i * 1.3 }; sw.position.set(sw.userData.x, KAD_Y, sw.userData.z); g.add(sw); sweets.push(sw); }
  const bub = []; const bm = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, roughness: 0.1 });
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(G.sph(0.025, 8, 6), bm); b.userData = { x: (Math.random() - 0.5) * 0.8, z: (Math.random() - 0.5) * 0.8, t: Math.random() }; g.add(b); bub.push(b); }
  const fl = []; const fm1 = new THREE.MeshBasicMaterial({ color: 0xff7a1a, toneMapped: false }), fm2 = new THREE.MeshBasicMaterial({ color: 0xffd24d, toneMapped: false });
  for (let i = 0; i < 5; i++) { const f = new THREE.Mesh(G.cone(0.07 - (i % 2) * 0.02, 0.28, 6), i % 2 ? fm2 : fm1); f.position.set(-0.14 + i * 0.07, 0.3, 0.7); g.add(f); fl.push(f); }
  g.userData = { liq, sm, sweets, bub, fl };
  g.visible = false;
  return g;
}
function kitchenFor(K, sw) { const [lq, col, shape] = KAD[sw] || KAD.rasgulla, u = K.userData; u.liq.material.color.set(lq); u.sm.color.set(col); for (const s of u.sweets) { s.visible = true; s.scale.set(shape === 'oval' ? 1.35 : 1, shape === 'disc' ? 0.5 : 1, shape === 'disc' ? 1.25 : 1); } }
function kitchenAnim(K, t, dt = 1 / 60) {
  const u = K.userData;
  u.sweets.forEach((s) => { const d = s.userData; s.position.set(d.x + Math.sin(t * 0.7 + d.ph) * 0.04, KAD_Y + 0.02 + Math.sin(t * 3 + d.ph) * 0.015, d.z + Math.cos(t * 0.6 + d.ph) * 0.04); s.rotation.y = t * 0.4 + d.ph; });
  u.bub.forEach((b) => { const d = b.userData; d.t += dt * 2.1; if (d.t > 1) { d.t = 0; d.x = (Math.random() - 0.5) * 0.85; d.z = (Math.random() - 0.5) * 0.85; } b.position.set(d.x, KAD_Y + 0.01, d.z); b.scale.setScalar(0.4 + d.t * 1.2); b.material.opacity = 0.75 * (1 - d.t); });
  u.fl.forEach((f, i) => { f.scale.set(1, 0.7 + 0.5 * Math.abs(Math.sin(t * 13 + i * 1.7)), 1); });
}
// 🥄 झरनी: छेद वाली गोल कलछी + लंबा डंडा (हलवाई के हाथ तक)
function makeJharni() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.cyl(0.15, 0.13, 0.03, 18), mat4(0, 0, 0), 0x9aa0a8);
  for (let i = 0; i < 9; i++) { const a = i * 0.7, r = (i % 3) * 0.05 + 0.02; mg.add(G.cyl(0.012, 0.012, 0.032, 5), mat4(Math.cos(a) * r, 0.002, Math.sin(a) * r), 0x3a3e44); }
  const bowl = mg.mesh(0.01); g.add(bowl);
  const h = new THREE.Mesh(G.cyl(0.018, 0.018, 1, 6), new THREE.MeshStandardMaterial({ color: 0x6b6f76, metalness: 0.5, roughness: 0.4 })); g.add(h);
  const carry = []; for (let i = 0; i < 2; i++) { const c = new THREE.Mesh(G.sph(0.075, 12, 9)); c.position.set(-0.05 + i * 0.1, 0.07, 0); g.add(c); carry.push(c); }
  g.userData = { h, carry }; g.visible = false;
  return g;
}
// हेलमेट (लाल, सफ़ेद धारी, काला शीशा) — r = नाप
function makeHelmet(r) {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(new THREE.SphereGeometry(r, 18, 12, 0, PI * 2, 0, PI * 0.56), mat4(0, 0, 0), 0xc4161c);
  mg.add(G.tor(r * 0.98, r * 0.07, 6, 24), mat4(0, r * 0.06, 0, PI / 2, 0, 0), 0x2a2420);
  mg.add(G.tor(r * 1.005, r * 0.06, 6, 20, PI), mat4(0, 0, 0, 0, PI / 2, 0), 0xffffff); // बीच की धारी
  mg.add(new THREE.SphereGeometry(r * 1.02, 16, 8, PI * 0.2, PI * 0.6, PI * 0.28, PI * 0.22), mat4(0, 0, 0, 0, 0, 0), 0x2a3440); // शीशा (आगे)
  const m = mg.mesh(0.006); m.castShadow = true; g.add(m);
  for (const s of [-1, 1]) { const b = badge(r * 0.85); b.position.set(s * r * 0.9, r * 0.38, -r * 0.05); b.rotation.set(0, s * PI / 2, -s * 0.38); g.add(b); } // दोनों ओर MB Sweets का बिल्ला
  return g;
}

// ---------------- स्कूटी (मुँह -z की ओर) ----------------
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
  // दुकान की छाप: दोनों बगल लोगो + "माँ भगवती मिष्ठान भंडार" + MB Sweets डिलीवरी, आगे बड़ा बिल्ला, पीछे "MB SWEETS 8002010218"
  const sm = new THREE.MeshBasicMaterial({ map: tex('dl_side.webp'), transparent: true, alphaTest: 0.4, toneMapped: false });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.235), sm); p.position.set(s * 0.278, 0.6, 0.42); p.rotation.y = s * PI / 2; body.add(p); }
  const fb = badge(0.34); fb.position.set(0, 0.74, -0.535); fb.rotation.set(-0.18, PI, 0); body.add(fb);
  const rp = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.128), new THREE.MeshBasicMaterial({ map: tex('dl_rear.webp'), transparent: true, alphaTest: 0.4, toneMapped: false })); rp.position.set(0, 0.47, 0.985); body.add(rp);
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
const smooth = (k) => k * k * (3 - 2 * k), UP = new THREE.Vector3(0, 1, 0);
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
    { const hb = badge(0.2); hb.position.set(-0.11, 1.14, 0.335); this.halwai.userData.body.add(hb); } // बनियान पर MB Sweets बिल्ला
    this.counter = makeCounter(); scene.add(this.counter);
    this.kitchen = makeKitchen(); scene.add(this.kitchen); // 🔥 चूल्हा + कड़ाही
    this.jharni = makeJharni(); scene.add(this.jharni);
    this.karigar = makeCustomer('halwai'); this.karigar.visible = false; scene.add(this.karigar); // 👐 कारीगर — छेना गूँधता, गोले बनाता
    { const pm = new Merge(); for (const [x, z] of [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]]) pm.add(G.cyl(0.04, 0.04, 0.7, 6), mat4(x, 0.35, z), 0x6b4a2c); pm.add(G.box(1.05, 0.06, 0.72), mat4(0, 0.72, 0), 0x8a5a34);
      pm.add(G.cyl(0.32, 0.26, 0.07, 20), mat4(-0.15, 0.79, 0), C.gold); pm.add(G.sph(0.17, 12, 8), mat4(-0.15, 0.86, 0, 0, 0, 0, 1.3, 0.55, 1), 0xfff6e2); // परात में छेना
      for (let i = 0; i < 6; i++) pm.add(G.sph(0.045, 8, 6), mat4(0.25 + (i % 2) * 0.1, 0.8, -0.2 + Math.floor(i / 2) * 0.16), 0xfff8ea); // बने गोले
      this.parat = pm.mesh(0.015); this.parat.visible = false; scene.add(this.parat); }
    this.home = makeHome(); scene.add(this.home);
    this.door = this.home.userData.gate; // पुराने कोड/कहानी के लिए
    this.box = makeBox(); this.box.visible = false; scene.add(this.box);
    this.fly = new THREE.Mesh(G.sph(0.088, 14, 10), this.box.userData.bm); this.fly.visible = false; scene.add(this.fly);
    for (const c of this.jharni.userData.carry) c.material = this.box.userData.bm;
    this.v3 = new THREE.Vector3(); this.v4 = new THREE.Vector3(); this.q0 = new THREE.Quaternion(); this.q1 = new THREE.Quaternion(); this.m4 = new THREE.Matrix4();
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
    this.kitchen.visible = false; this.jharni.visible = false; this.karigar.visible = false; this.parat.visible = false; this.hero = -1;
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
    const KT = this.kitchen; KT.visible = true; KT.position.set(this.side * (ROAD_HALF + 0.2), 0, z + 1.4 + 1.5); KT.rotation.y = -this.side * PI / 2; kitchenFor(KT, this.sw); // काउंटर के पीछे वाली ओर चूल्हा-कड़ाही
    const KG = this.karigar; KG.visible = true; KG.position.set(this.side * (ROAD_HALF + 1.45), 0, z + 1.4 + 3.3); KG.rotation.y = -this.side * PI / 2;
    this.parat.visible = true; this.parat.position.set(this.side * (ROAD_HALF + 0.75), 0, z + 1.4 + 3.3); this.parat.rotation.y = -this.side * PI / 2;
    this.hero = -1;
    const B = this.box; B.visible = true; boxLook(B, 1, 0, 0); B.rotation.set(0, 0, 0); this.boxOn = 'counter';
    const S = this.scooty; S.visible = true; S.position.set(this.side * (ROAD_HALF - 0.9), 0, z + 1.4 - 2.7); S.rotation.set(0, 0, 0); S.userData.body.rotation.set(0, 0, 0); this.helmS.visible = true; // काउंटर से आगे, किनारे खड़ी
    this.mark.visible = true; this.mark.position.set(LANES[this.pLane], 0, z + 3.5);
    this.boxT = -1; this.clearZone(z - 28, z + 34); this.quiet(1000);
    this.st = 'toShop'; this.callT = 1.7; this.fast = 1;
    const sw = swName(this.sw);
    g.cheer('order', 2200, -1, true, 'gold', T('ordCallShop', cName(c), sw));
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
  go(st) { this.st = st; this.t = 0; if (st === 'pack') this.hero = -1; }
  packEnd() { return 2.18 + 1.1 + 0.42 + 0.12; } // पैकिंग + कैमरे के सामने डिब्बा + कंधे पर
  finish() {
    const g = this.g;
    this.streak++;
    this.tip = randi(5, 15); let sw = 15 * this.stars + this.tip + 5 * Math.min(this.streak - 1, 4);
    if (store('freshStock') === '1') { sw *= 2; store('freshStock', 0); setTimeout(() => { if (g.state === 'play') g.toast('🔥 ' + T('freshUsed'), 1500, 'gold'); }, 900); } // 🍮 ताज़ा माल
    g.got += sw; g.score += 400 * this.stars * g.mult;
    g.meter = Math.min(1, g.meter + 0.25);
    g.msBump('deliver'); g.msBump('sweets', g.got, true);
    g.runDeliv = (g.runDeliv || 0) + 1;
    g.cheer('deliver', 2100, -1, true, 'gold', T('ordDoneShop', '⭐'.repeat(this.stars), sw));
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
    if (st === 'pack') return { pos: [s * 0.5, 3.0, -3.5], look: [s * 3.8, 0.95, 0.3] }; // थोड़ा ऊपर से — कड़ाही के अंदर की मिठाई दिखे
    if (st === 'brake' && this.halwai.position.z > -12) return { pos: [s * 0.35, 2.35, -4.5], look: [s * 3.55, 1.3, -0.5] };
    if (['walk', 'mount', 'helmet', 'kick'].includes(st)) return { pos: [s * 0.9, 2.2, -4.3], look: [s * 3.5, 1.35, -0.2] }; // स्कूटी की ओर
    if (['off2', 'knock', 'open', 'hand'].includes(st) || (st === 'thank' && this.t < 1.35) || (st === 'arrive' && this.home.position.z > -8)) return { pos: [s2 * 2.3, 2.15, -4.9], look: [s2 * 4.7, 1.3, -0.5] };
    return null;
  }
  // गोलू का मुँह किधर (रुककर दुकान/दरवाज़े की ओर)
  turn() { return this.turnY; }
  // डिब्बा कंधे पर
  shoulder(out) { const p = this.g.p; return out.set(p.x + 0.42, p.y + 2.0, 0.05); }
  carrier(out) { const S = this.scooty; return out.set(0, 1.0 + BH * BS / 2, 0.8).applyEuler(S.rotation).add(S.position); }
  update(dtReal, dz) {
    const g = this.g, p = g.p, B = this.box, S = this.scooty, H = this.halwai, U = B.userData;
    const dt = dtReal * (this.inScene() ? this.fast : 1); // रुके पलों में स्वाइप = जल्दी
    if (this.st === 'off' || this.st === 'done') {
      if (this.st === 'off') { if (this.toNext > 0) this.toNext -= dz; else if (this.canStart()) this.start(); }
    }
    this.t = (this.t || 0) + dt;
    if (this.callT > 0) this.callT -= dtReal;
    // दुनिया के साथ चलती चीज़ें
    if (H.visible) {
      for (const o of [H, this.counter, this.kitchen, this.karigar, this.parat, this.mark]) o.position.z += dz;
      if (this.shop) this.shop.position.z += dz;
      kitchenAnim(this.kitchen, performance.now() / 1000, dtReal);
      if (Math.random() < dtReal * 11 && this.kitchen.position.z < 6) g.world.parts.burst(this.kitchen.position.x + rand(-0.3, 0.3), KAD_Y + 0.15, this.kitchen.position.z + rand(-0.3, 0.3), 0xf4f1ea, 1, 0.3, 1.2, 0.9, 0); // भाप
      const ku = this.karigar.userData, kt = performance.now() / 1000; ku.arms[0].rotation.x = -0.9 + Math.sin(kt * 8) * 0.35; ku.arms[1].rotation.x = -0.9 + Math.sin(kt * 8 + 1.6) * 0.35; ku.body.position.y = Math.abs(Math.sin(kt * 8)) * 0.03; // गूँधना
      if (H.position.z > 22) { for (const o of [H, this.counter, this.kitchen, this.karigar, this.parat]) o.visible = false; if (this.shop) this.shop.visible = false; }
    }
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
    if (this.boxOn === 'counter') { this.counter.updateMatrixWorld(); B.position.copy(this.v.set(0.12, 0.985 + BH * BS / 2, -this.side * 0.12).applyMatrix4(this.counter.matrixWorld)); B.rotation.set(0, PI, 0); } // छपाई सामने वाले कैमरे की ओर
    if (this.st === 'pack') { // 🔥 झरनी से कड़ाही की गरम मिठाई डिब्बे में (2 बार × 2) → ढक्कन → सुतली → ✨ डिब्बा कैमरे के सामने → गोलू के कंधे पर
      this.cap = 0; this.turnTo = -this.side * 0.95;
      const t = this.t, KT = this.kitchen, J = this.jharni, JU = J.userData, KS = KT.userData.sweets;
      const R = this.v.set(KT.position.x - this.side * 0.1, KAD_Y + 0.5, KT.position.z - 0.25), SC = 0.12, SD = 0.66;
      let jp = null, tilt = 0;
      for (let j = 0; j < 2; j++) {
        const a = (t - SC - j * SD) / SD; if (a < 0 || a >= 1) continue;
        const sw = KS[j * 2], dp = this.v2.set(KT.position.x, KAD_Y + 0.02, KT.position.z); if (sw) { sw.getWorldPosition(this.v2); this.v2.y = KAD_Y + 0.01; }
        const bx = this.v3.copy(B.position); bx.y += 0.42;
        const e1 = smooth(clamp(a / 0.3, 0, 1)), e2 = smooth(clamp((a - 0.3) / 0.5, 0, 1)), e3 = clamp((a - 0.8) / 0.2, 0, 1);
        jp = this.v4.copy(R).lerp(dp, e1); if (a > 0.3) { jp.copy(dp).lerp(bx, e2); jp.y += Math.sin(e2 * PI) * 0.35; }
        const got = a > 0.27 && e3 < 0.5; JU.carry.forEach((c) => { c.visible = got; });
        if (a > 0.27) { if (KS[j * 2]) KS[j * 2].visible = false; if (KS[j * 2 + 1]) KS[j * 2 + 1].visible = false; }
        tilt = e3 * 1.1;
        if (e3 >= 0.5 && !U.balls[j * 2].visible) { U.balls[j * 2].visible = U.balls[j * 2 + 1].visible = true; g.sound.plop && g.sound.plop(); g.world.parts.burst(B.position.x, B.position.y + 0.2, B.position.z, 0xffe9a8, 6, 1, 1.2, 0.4, 0); }
      }
      J.visible = !!jp;
      if (jp) { // झरनी: कटोरा jp पर, डंडा हलवाई के हाथ तक
        J.position.copy(jp); J.rotation.set(0, 0, 0); J.rotateZ(this.side * tilt);
        const hand = this.v2.set(H.position.x - this.side * 0.3, 1.45, H.position.z - 0.1).sub(jp), L = hand.length();
        JU.h.position.copy(hand).multiplyScalar(0.5); JU.h.scale.set(1, L, 1); JU.h.quaternion.setFromUnitVectors(UP, hand.normalize());
      }
      const lid = clamp((t - 1.5) / 0.3, 0, 1), rib = clamp((t - 1.82) / 0.28, 0, 1);
      if (this.hero < 0) boxLook(B, 1 - lid * lid, U.balls.filter((b) => b.visible).length, rib < 1 ? rib * (1 + Math.sin(rib * PI) * 0.3) : 1);
      if (rib >= 1 && !this.tied) { this.tied = true; g.world.parts.burst(B.position.x, B.position.y + 0.3, B.position.z, 0xffd24d, 14, 2, 2.5, 0.6); g.sound.ring(); }
      // ✨ डिब्बा कैमरे के ठीक सामने (ढक्कन — दुकान का नाम — पूरा दिखे), फिर गोलू के कंधे पर
      if (t > 2.18 && this.hero < 0) { this.hero = 0; this.boxOn = null; this.b0 = B.position.clone(); this.q0.copy(B.quaternion); g.sound.power && g.sound.power(); }
      if (this.hero >= 0 && this.boxT < 0) {
        this.hero += dt; const h = this.hero, cam = g.cam;
        const fw = cam.getWorldDirection(this.v2), up = this.v3.set(0, 1, 0).applyQuaternion(cam.quaternion);
        const HP = this.v4.copy(cam.position).addScaledVector(fw, 2.15).addScaledVector(up, -0.12);
        const yA = fw.clone().negate(), zA = up.clone().negate(), xA = new THREE.Vector3().crossVectors(yA, zA);
        this.q1.setFromRotationMatrix(this.m4.makeBasis(xA, yA, zA));
        if (h < 0.35) { const e = smooth(h / 0.35); B.position.copy(this.b0).lerp(HP, e); B.quaternion.copy(this.q0).slerp(this.q1, e); }
        else if (h < 1.1) { B.position.copy(HP); B.position.y += Math.sin((h - 0.35) * 5) * 0.025; B.quaternion.copy(this.q1); B.rotateY(Math.sin((h - 0.35) * 3) * 0.06);
          if (!this.heroSaid) { this.heroSaid = true; g.toast('✨ ' + T('boxReady'), 1300, 'gold'); vibrate(15); for (const c of [0xffd24d, 0xffffff]) g.world.parts.burst(HP.x, HP.y + 0.3, HP.z, c, 10, 1.6, 1.2, 0.6, 0); } }
        else { this.boxT = 0; this.b0 = B.position.clone(); this.q0.copy(B.quaternion); this.heroSaid = false; }
      }
      if (this.boxT >= 0 && this.boxT < 1) {
        this.boxT = Math.min(1, this.boxT + dt / 0.42); const e = this.boxT, to = this.shoulder(this.v);
        B.position.set(lerp(this.b0.x, to.x, e), lerp(this.b0.y, to.y, e) + Math.sin(e * PI) * 0.5, lerp(this.b0.z, to.z, e)); B.quaternion.copy(this.q0).slerp(this.q1.identity(), smooth(e));
        if (e >= 1) { vibrate(20); if (g.emo) g.emo.play('cool', 0.8); this.turnTo = 0; }
      }
      if (this.boxT >= 1) { B.position.copy(this.shoulder(this.v)); B.rotation.set(0, 0, 0); if (this.t > this.packEnd()) { this.go('walk'); this.tied = false; } }
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
      if (this.st === 'mount') { const e = clamp(this.t / 0.32, 0, 1), to = this.carrier(this.v); B.position.set(lerp(this.b0.x, to.x, e), lerp(this.b0.y, to.y, e) + Math.sin(e * PI) * 0.3, lerp(this.b0.z, to.z, e)); B.rotation.set(S.rotation.x + 0.34 * e, S.rotation.y, S.rotation.z); if (e >= 1 && p.ground) this.go('helmet'); }
      else { B.position.copy(this.carrier(this.v)); B.rotation.set(S.rotation.x + 0.34, S.rotation.y, S.rotation.z); } // ढक्कन थोड़ा पीछे वाले कैमरे की ओर झुका — दुकान की छपाई दिखे
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
        const tx = cm.position.x - this.side2 * 0.3, tz = cm.position.z - 0.1, ty = 1.0 * (cm.userData.sc || 1); // बड़ा डिब्बा सीने के आगे — चेहरा न ढके
        B.position.set(lerp(this.box0.x, tx, k), lerp(this.box0.y, ty, k) + Math.sin(k * PI) * 0.4, lerp(this.box0.z, tz, k)); B.rotation.set(-0.95 * k, PI + this.side2 * 0.5 * k, 0); // ढक्कन (दुकान का नाम) सामने वाले कैमरे की ओर
        if (k >= 1) { this.boxT = -2; g.world.parts.burst(tx, ty + 0.3, tz, 0xffd24d, 22, 3, 3, 0.8); this.finish(); this.go('thank'); this.coinsGo(); }
      }
    }
    if (this.st === 'thank') { // ख़ुशी + टिप के सिक्के + 🙏 → फिर दौड़
      const cm = this.cm; if (cm) { B.position.set(cm.position.x - this.side2 * 0.3, 1.02 * (cm.userData.sc || 1) + Math.abs(Math.sin(this.t * 9)) * 0.16, cm.position.z - 0.1); B.rotation.set(-0.95, PI + this.side2 * 0.5, 0); } // ख़ुशी से डिब्बा ऊपर — नाम दिखे
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
      const packing = this.st === 'pack' && this.t > 1.4 && this.t < 2.15, tossing = this.st === 'pack' && (this.hero >= 0 || (this.boxT >= 0 && this.boxT < 1)), scoop = this.st === 'pack' && this.t < 1.45; // झरनी चलाना / ढक्कन-सुतली / डिब्बा दिखाना
      aR.rotation.z = damp(aR.rotation.z, tossing ? 2.4 : packing ? 1.0 + Math.sin(this.t * 16) * 0.5 : this.st === 'toShop' || this.st === 'brake' ? 1.2 + Math.sin(t * 9) * 0.5 : 2.3 + Math.sin(t * 10) * 0.4, 10, dt); // बुलाना / पैक / उछालना / टाटा
      aL.rotation.z = damp(aL.rotation.z, packing ? -1.0 - Math.sin(this.t * 16 + 1.5) * 0.4 : -0.2, 8, dt);
      aR.rotation.x = damp(aR.rotation.x, scoop ? -1.25 + Math.sin(this.t * 9.5) * 0.25 : packing ? -0.7 : 0, 8, dt); aL.rotation.x = damp(aL.rotation.x, scoop ? -0.9 : packing ? -0.7 : 0, 8, dt);
      if (scoop) { aR.rotation.z = damp(aR.rotation.z, 0.35, 10, dt); aL.rotation.z = damp(aL.rotation.z, -0.3, 10, dt); }
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
    const item = `<div class="oc"><img class="obox" src="img/box_top.webp" alt=""><span><i style="background:${SW_CSS[this.sw]}"></i>📦 ${swName(this.sw)}</span><span>${this.c.icon} ${cName(this.c)}</span></div>`; // असली डिब्बे की तस्वीर
    if (['toShop', 'brake', 'pack', 'walk'].includes(this.st)) el.innerHTML = `<div class="oh"><img class="ologo" src="img/logo.webp" alt=""><span class="on">${SHOP_NAME}</span>${stars}</div>${item}<div class="od"><b>🏪 ${T('ordToShop')}</b><em></em></div>`;
    else el.innerHTML = `<div class="oh"><span class="oa">🛵</span><span class="on">${T('ordRide', cName(this.c))}</span>${stars}</div>${item}<div class="od"><b>🏠</b><em></em></div>`;
    this.dEl = el.querySelector('.od em'); this.dK = null;
    if (full) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
  }
  paintDist(m) { const v = Math.round(m / 5) * 5; if (!this.dEl || v === this.dK) return; this.dK = v; this.dEl.textContent = T('ordM', v); }
  // पुराना (मिठाई जमा करने वाला) तरीका अब नहीं — game.collect अब भी बुलाता है
  onCollect() {}
}
