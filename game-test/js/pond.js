// 🚣 मखाना पोखर — "पग-पग पोखर, माछ, मखान" वाली मिथिला. सड़क ~220 मी. के लिए पोखर बन जाती है, गोलू नाव पर:
// कूद = नाव समेत उछाल, नीचे = नाव में झुकना. रुकावट: मछुआरों का जाल (झुको), तैरता लट्ठा (कूदो), मछुआरे की नाव (लेन बदलो),
// तैरती बत्तखें (कूदो). मिठाई पानी पर तैरती; पत्ते के दोने में मखाना = +5.
import * as THREE from './three.module.min.js';
import { C, mat4, Merge, basic } from './art.js';
import { ROAD_HALF } from './models.js';
import { rand, chance } from './util.js';

const PI = Math.PI;
export const POND_LEN = 230, WATER_Y = 0.3, TILE = 20;
const BANK = ROAD_HALF + 2.4;
const G = {
  sph: (r, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 16) => new THREE.TorusGeometry(r, t, s, n),
  cap: (r, l, s = 8) => new THREE.CapsuleGeometry(r, l, 4, s),
};

// पानी की लहरें (normal map) — एक ही सामग्री, हर फ़्रेम खिसके
function rippleNormal() {
  const N = 128, c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
  const h = (u, v) => Math.sin(u * 0.29 + Math.sin(v * 0.13) * 2) * 0.5 + Math.sin(v * 0.41 + u * 0.07) * 0.35 + Math.sin((u + v) * 0.19) * 0.25;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const dx = h(i + 1, j) - h(i - 1, j), dy = h(i, j + 1) - h(i, j - 1), k = (j * N + i) * 4;
    im.data[k] = 128 + dx * 60; im.data[k + 1] = 128 + dy * 60; im.data[k + 2] = 255; im.data[k + 3] = 255;
  }
  x.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 5); return t;
}
export const WATER = { mat: null, nm: null };
function waterMat() {
  if (WATER.mat) return WATER.mat;
  WATER.nm = rippleNormal();
  WATER.mat = new THREE.MeshStandardMaterial({ color: 0x2d8c96, roughness: 0.14, metalness: 0.05, normalMap: WATER.nm, normalScale: new THREE.Vector2(0.55, 0.55) });
  return WATER.mat;
}
// 20 मी. का पानी का टुकड़ा + दोनों ओर घास वाला किनारा, सरकंडे, किनारे के पास कमल के पत्ते
export function makeWaterTile(i) {
  const g = new THREE.Group();
  const w = new THREE.Mesh(new THREE.PlaneGeometry(BANK * 2, TILE + 0.05), waterMat());
  w.rotation.x = -PI / 2; w.position.y = WATER_Y; w.receiveShadow = true; g.add(w);
  const mg = new Merge();
  for (const s of [-1, 1]) {
    mg.add(G.box(1.6, 0.55, TILE + 0.05), mat4(s * (BANK + 0.6), 0.27, 0), 0x6a8f3a); // घास वाला किनारा
    mg.add(G.box(0.25, 0.5, TILE + 0.05), mat4(s * (BANK - 0.12), 0.2, 0), 0x7a5a36); // मिट्टी की धार
    for (let k = 0; k < 7; k++) { const z = -TILE / 2 + rand(0, TILE), x = s * rand(BANK - 0.2, BANK + 0.9); for (let r = 0; r < 4; r++) mg.add(G.cone(0.04, rand(0.8, 1.4), 4), mat4(x + rand(-0.15, 0.15), 0.9, z + rand(-0.15, 0.15), rand(-0.2, 0.2), 0, rand(-0.25, 0.25)), 0x5b7f2a); } // सरकंडे
    for (let k = 0; k < 5; k++) { // कमल के पत्ते (सड़क की लेनों से बाहर)
      const x = s * rand(ROAD_HALF + 0.3, BANK - 0.5), z = -TILE / 2 + rand(0, TILE), r = rand(0.35, 0.7);
      mg.add(G.cyl(r, r, 0.03, 14), mat4(x, WATER_Y + 0.02, z), chance(0.5) ? 0x3a8a3f : 0x4fa35a);
      if (chance(0.35)) { for (let q = 0; q < 6; q++) mg.add(G.cone(0.09, 0.28, 5), mat4(x + Math.cos(q) * 0.06, WATER_Y + 0.2, z + Math.sin(q) * 0.06, Math.cos(q * 1.1) * 0.5, 0, Math.sin(q * 1.1) * 0.5), q % 2 ? C.pink : 0xf6b3cb); mg.add(G.sph(0.06, 6, 5), mat4(x, WATER_Y + 0.2, z), C.haldi); }
    }
  }
  if (i % 3 === 0) { // कभी-कभी किनारे पर मछली पकड़ने का बाँस
    const s = i % 2 ? 1 : -1;
    mg.add(G.cyl(0.03, 0.04, 3.2, 5), mat4(s * (BANK + 0.3), 1.4, 2, 0, 0, -s * 0.9), C.bamboo);
  }
  g.add(mg.mesh(0.02));
  g.userData = { noShadow: true };
  return g;
}
// घाट — सड़क से पानी तक पत्थर की सीढ़ियाँ (शुरू) / पानी से सड़क (अंत)
export function makeGhat() {
  const g = new THREE.Group(), mg = new Merge(), W = BANK * 2 + 3.2;
  mg.add(G.box(W, 0.5, 0.7), mat4(0, 0.25, 0), 0xd9cdb4);
  mg.add(G.box(W, 0.32, 0.8), mat4(0, 0.16, 0.7), 0xcfc2a8);
  mg.add(G.box(W, 0.14, 0.8), mat4(0, 0.07, 1.45), 0xc4b79c);
  for (const s of [-1, 1]) { // दोनों ओर छोटे दीये वाले खंभे
    mg.add(G.box(0.5, 1.4, 0.5), mat4(s * (BANK + 1.1), 0.7, 0), 0xfff1d6); mg.add(G.box(0.62, 0.15, 0.62), mat4(s * (BANK + 1.1), 1.45, 0), C.sindoor);
    mg.add(G.sph(0.12, 8, 6), mat4(s * (BANK + 1.1), 1.62, 0), 0xffb23c);
  }
  g.add(mg.mesh(0.025));
  return g;
}
// गोलू की नाव
export function makeBoat() {
  const g = new THREE.Group(), mg = new Merge();
  const hull = new THREE.CylinderGeometry(0.62, 0.62, 2.6, 14, 1, false, PI / 2, PI); hull.scale(1, 0.55, 1);
  mg.add(hull, mat4(0, 0.36, 0, PI / 2, 0, 0), 0x7a4a26);
  mg.add(G.cone(0.34, 0.6, 10), mat4(0, 0.38, -1.55, -PI / 2, 0, 0, 1, 1, 0.55), 0x7a4a26); // आगे की नोक
  mg.add(G.box(1.1, 0.06, 2.4), mat4(0, 0.42, 0), 0xa8743e);
  mg.add(G.box(1.18, 0.08, 0.22), mat4(0, 0.5, 0.25), 0x5a3a20); // बैठने की पटरी
  for (const z of [-0.8, 0.8]) mg.add(G.tor(0.6, 0.035, 6, 14), mat4(0, 0.36, z, 0, 0, 0, 1, 0.55, 1), C.sindoor); // लाल धारी
  mg.add(G.cyl(0.035, 0.035, 2.0, 6), mat4(0.75, 0.75, 0.2, 0.5, 0, -0.5), C.wood); // पतवार
  mg.add(G.box(0.22, 0.04, 0.5), mat4(1.25, 0.32, 0.62, 0.5, 0, -0.5), C.wood);
  const m = mg.mesh(0.025); m.castShadow = true; g.add(m);
  return g;
}
// पत्ते के दोने में मखाना (पावर-अप जैसा पकड़ो)
export function makeMakhana() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const mg = new Merge();
  const bowl = new THREE.SphereGeometry(0.5, 16, 8, 0, PI * 2, PI * 0.55, PI * 0.45);
  mg.add(bowl, mat4(0, 0.28, 0), 0x4f8f3a);
  for (let i = 0; i < 14; i++) { const a = i * 2.4, r = 0.12 + (i % 4) * 0.08; mg.add(G.sph(0.11, 10, 8), mat4(Math.cos(a) * r, 0.0 + (i > 8 ? 0.12 : 0), Math.sin(a) * r), i % 3 ? 0xfaf6ea : 0xf1e6cc); }
  inner.add(mg.mesh(0.015)); inner.scale.setScalar(1.25);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 8, 32), basic(0xffffff, { add: true, op: 0.8 }));
  g.add(ring);
  g.userData = { kind: 'makhana', inner, ring };
  return g;
}
// उछलती मछली (रोहू) — सिर्फ़ सजावट, टक्कर नहीं
export function makeFish() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.sph(0.16, 12, 8), mat4(0, 0, 0, 0, 0, 0, 0.75, 0.62, 2.1), 0xb9c9cf); // शरीर
  mg.add(G.sph(0.12, 10, 6), mat4(0, -0.03, 0.02, 0, 0, 0, 0.62, 0.42, 1.7), 0xeef3f2); // पेट
  mg.add(G.cone(0.15, 0.26, 4), mat4(0, 0, 0.42, PI / 2, PI / 4, 0, 1, 1, 0.25), 0xd08a52); // पूँछ
  mg.add(G.cone(0.06, 0.16, 4), mat4(0, 0.1, 0.02, 0, 0, 0, 0.3, 1, 1.4), 0xd08a52); // पंख
  for (const s of [-1, 1]) mg.add(G.sph(0.025, 6, 5), mat4(s * 0.07, 0.03, -0.24), 0x1a1a1a);
  g.add(mg.mesh(0.02)); g.visible = false;
  return g;
}
// ---------------- पोखर की रुकावटें ----------------
export const POND_OBST = {
  jaal() { // मछली का जाल दो बाँसों पर — झुको (नीचे स्वाइप)
    const g = new THREE.Group(), mg = new Merge();
    for (const s of [-1, 1]) mg.add(G.cyl(0.07, 0.08, 3.4, 8), mat4(s * 1.12, 1.7, 0), C.bamboo);
    mg.add(G.cyl(0.04, 0.04, 2.3, 6), mat4(0, 2.9, 0, 0, 0, PI / 2), 0xe8dcc0);
    mg.add(G.cyl(0.03, 0.03, 2.3, 6), mat4(0, 1.32, 0, 0, 0, PI / 2), 0xe8dcc0);
    for (let i = 0; i < 6; i++) mg.add(G.sph(0.07, 6, 5), mat4(-0.95 + i * 0.38, 1.28, 0), 0xf2a91b); // जाल के पीले तैरते गोले
    g.add(mg.mesh(0.02));
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.strokeStyle = 'rgba(245,238,222,0.95)'; x.lineWidth = 3; for (let k = 0; k <= 64; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k - 32, 64); x.stroke(); x.beginPath(); x.moveTo(k - 32, 0); x.lineTo(k, 64); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 3);
    const net = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 1.6), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, color: 0xf2ead8 }));
    net.position.set(0, 2.1, 0); g.add(net);
    g.userData = { kind: 'high', halfW: 1.05, halfL: 0.2, yMin: 1.15, yMax: 3.3 };
    return g;
  },
  naav() { // मछुआरे की नाव — लेन बदलो
    const g = new THREE.Group(), mg = new Merge();
    const hull = new THREE.CylinderGeometry(0.75, 0.75, 3.2, 14, 1, false, PI / 2, PI); hull.scale(1, 0.6, 1);
    mg.add(hull, mat4(0, 0.48, 0, PI / 2, 0, 0), 0x5e3a1e);
    mg.add(G.box(1.3, 0.06, 3.0), mat4(0, 0.5, 0), 0x8a5a34);
    mg.add(G.cap(0.26, 0.4, 8), mat4(0, 0.95, 0.4), 0xf2ead8); mg.add(G.sph(0.2, 10, 8), mat4(0, 1.45, 0.4), 0xd99470); // मछुआरा
    mg.add(G.cone(0.42, 0.25, 12), mat4(0, 1.66, 0.4), 0xc9a35c); // टोपी (गमछे/बाँस की)
    mg.add(G.cyl(0.03, 0.03, 3.0, 5), mat4(0.4, 1.3, 0.2, 0.3, 0, -0.6), C.bamboo);
    mg.add(G.cyl(0.4, 0.45, 0.35, 12), mat4(0, 0.7, -0.8), 0x4a6b8a); // टोकरी
    g.add(mg.mesh(0.025));
    g.userData = { kind: 'block', halfW: 0.82, halfL: 1.6, yMin: 0, yMax: 1.6 };
    return g;
  },
  batak() { // तैरती बत्तखें — कूदो
    const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
    const ds = [];
    for (const [x, z] of [[-0.6, 0], [0.15, -0.3], [0.85, 0.15]]) {
      const d = new Merge();
      d.add(G.sph(0.28, 12, 9), mat4(0, 0.25, 0, 0, 0, 0, 1, 0.75, 1.35), 0xfaf6ea);
      d.add(G.sph(0.16, 10, 8), mat4(0, 0.55, -0.3), 0xfaf6ea);
      d.add(G.cone(0.07, 0.2, 6), mat4(0, 0.53, -0.48, -PI / 2, 0, 0, 1.3, 1, 0.6), 0xf08a1c);
      for (const s of [-1, 1]) d.add(G.sph(0.03, 6, 5), mat4(0.1 * s, 0.6, -0.4), 0x1d1210);
      const m = d.mesh(0.018); m.position.set(x, 0, z); inner.add(m); ds.push(m);
    }
    g.userData = { kind: 'low', halfW: 1.15, halfL: 0.5, yMin: 0, yMax: 0.85, inner,
      dance: (t) => ds.forEach((m, i) => { m.position.y = Math.sin(t * 4 + i) * 0.05; m.rotation.z = Math.sin(t * 3 + i * 2) * 0.08; }) };
    return g;
  },
};

// ---------------- पोखर की तीन किस्में (18 नवंबर 2026, मालिक: "बीच में किसी दूसरे टाइप का पोखर आना चाहिए") ----------------
// पानी-घाट वही; किनारे और पानी की सजावट अलग. समूह का z=0 = शुरू वाला घाट, z=-POND_LEN = आख़िरी घाट. लेनें (±3.2 तक) ख़ाली.
export const POND_TYPES = ['makhana', 'machh', 'deep'];
export const POND_INFO = {
  makhana: { icon: '🪷', hi: 'मखाना पोखर', en: 'MAKHANA POND' },
  machh: { icon: '🐟', hi: 'मछुआरों का घाट', en: 'FISHING GHAT' },
  deep: { icon: '🪔', hi: 'दीयों वाला घाट', en: 'GHAT OF LAMPS' },
};
function pondBoard(t) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#7a111a'; x.fillRect(0, 0, 512, 160); x.strokeStyle = '#f2a91b'; x.lineWidth = 10; x.strokeRect(6, 6, 500, 148);
  x.fillStyle = '#ffd24d'; x.font = '800 54px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t.hi, 256, 66, 480);
  x.fillStyle = '#fff3c4'; x.font = '700 28px Mukta,sans-serif'; x.fillText(t.en, 256, 122, 480);
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
}
function glowTex() {
  const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(0.25, 'rgba(255,190,80,0.75)'); g.addColorStop(1, 'rgba(255,140,30,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}
// बैठा/खड़ा आदमी (सादा): धोती-गमछा
function person(mg, x, y, z, ry, o = {}) {
  const sit = o.sit, col = o.col || 0xf2ead8, top = o.top || 0xe9e2d0, skin = o.skin || 0xc98a5e, M = (a, b, c, rx = 0, ry2 = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = mat4(a, b, c, rx, ry2, rz, sx, sy, sz); return new THREE.Matrix4().makeTranslation(x, y, z).multiply(new THREE.Matrix4().makeRotationY(ry)).multiply(m); };
  if (sit) { mg.add(G.box(0.5, 0.22, 0.5), M(0, 0.12, 0), col); for (const s of [-1, 1]) mg.add(G.cap(0.08, 0.3, 6), M(s * 0.12, 0.18, -0.3, PI / 2, 0, 0), skin); }
  else for (const s of [-1, 1]) mg.add(G.cap(0.09, 0.5, 6), M(s * 0.12, 0.35, 0), col);
  const by = sit ? 0.55 : 0.95;
  mg.add(G.cap(0.2, 0.3, 8), M(0, by, 0), top); mg.add(G.sph(0.16, 10, 8), M(0, by + 0.42, 0), skin);
  mg.add(G.cyl(0.17, 0.17, 0.08, 10), M(0, by + 0.55, 0), o.cap || C.sindoor); // गमछे की पगड़ी
  if (o.arms !== false) for (const s of [-1, 1]) mg.add(G.cap(0.06, 0.32, 6), M(s * 0.24, by + 0.05, -0.12, -0.9, 0, 0), skin);
}
export function makePondDeco(type) {
  const g = new THREE.Group(), mg = new Merge(), L = POND_LEN, W0 = ROAD_HALF + 0.4, W1 = BANK - 0.5, BK = BANK + 0.55;
  const along = (n, f) => { for (let i = 0; i < n; i++) f(-8 - (L - 16) * (i + rand(0.15, 0.85)) / n, i); };
  const ud = { anim: null };
  if (type === 'makhana') {
    along(14, (z, i) => { const s = i % 2 ? 1 : -1, x = s * rand(W0, W1); // बड़े कमल + कलियाँ
      mg.add(G.cyl(0.6, 0.6, 0.03, 16), mat4(x, WATER_Y + 0.02, z), 0x3f8f40);
      for (let q = 0; q < 8; q++) mg.add(G.cone(0.14, 0.42, 5), mat4(x + Math.cos(q * 0.8) * 0.1, WATER_Y + 0.28, z + Math.sin(q * 0.8) * 0.1, Math.cos(q * 0.8) * 0.55, 0, Math.sin(q * 0.8) * 0.55), q % 2 ? C.pink : 0xf6b3cb);
      mg.add(G.sph(0.08, 8, 6), mat4(x, WATER_Y + 0.3, z), C.haldi);
      mg.add(G.cyl(0.02, 0.02, 0.7, 4), mat4(x + 0.5 * s, WATER_Y + 0.35, z + 0.4), 0x4f8f3a); mg.add(G.sph(0.1, 8, 6), mat4(x + 0.5 * s, WATER_Y + 0.75, z + 0.4, 0, 0, 0, 0.8, 1.4, 0.8), 0xe77fa5); });
    along(3, (z, i) => { const s = i % 2 ? -1 : 1; // पानी में मखाना निकालते लोग (कमर तक पानी) + टोकरी
      person(mg, s * rand(5.0, 5.8), WATER_Y - 0.75, z, s * PI / 2, { col: 0x2f6fb6, top: 0xf6efe0 });
      mg.add(G.cyl(0.3, 0.22, 0.24, 10), mat4(s * 4.6, WATER_Y + 0.1, z + 0.6), 0xb08a4a); });
    along(4, (z, i) => { const s = i % 2 ? 1 : -1; // किनारे पर सूखता मखाना (चटाई पर सफ़ेद दाने)
      mg.add(G.box(1.1, 0.04, 1.8), mat4(s * BK, 0.57, z), 0xb08a4a);
      for (let q = 0; q < 22; q++) mg.add(G.sph(0.06, 6, 5), mat4(s * BK + rand(-0.45, 0.45), 0.62, z + rand(-0.8, 0.8)), 0xfaf6ea);
      if (i % 2 === 0) person(mg, s * (BK + 0.2), 0.55, z + 1.4, -s * PI / 2, { sit: true, col: 0xf2ead8, top: 0xd1261c }); });
  } else if (type === 'machh') {
    along(6, (z, i) => { const s = i % 2 ? 1 : -1; // बंसी लिए बैठे मछुआरे
      person(mg, s * (BK + 0.2), 0.55, z, -s * PI / 2, { sit: true, top: [0xf6efe0, 0x9cc3e6, 0xf2c94c][i % 3] });
      mg.add(G.cyl(0.02, 0.03, 3.4, 5), mat4(s * (BK - 1.2), 1.55, z - 0.2, 0, 0, s * 1.05), C.bamboo); // बंसी
      mg.add(G.cyl(0.004, 0.004, 1.6, 3), mat4(s * (BK - 2.65), 1.25, z - 0.2), 0xf2ead8); mg.add(G.sph(0.05, 6, 5), mat4(s * (BK - 2.65), WATER_Y + 0.05, z - 0.2), C.sindoor); // डोरी + फ़्लोट
      mg.add(G.cyl(0.24, 0.18, 0.26, 10), mat4(s * (BK + 0.75), 0.68, z + 0.5), 0x9a7a3c); }); // मछली की टोकरी
    along(3, (z, i) => { const s = i % 2 ? -1 : 1; // बाँस पर सूखता जाल
      for (const d of [-1.2, 1.2]) mg.add(G.cyl(0.05, 0.06, 2.4, 6), mat4(s * (BK + 0.5), 1.2, z + d), C.bamboo);
      mg.add(G.cyl(0.03, 0.03, 2.5, 5), mat4(s * (BK + 0.5), 2.35, z, PI / 2, 0, 0), C.bamboo); });
    along(2, (z, i) => { const s = i ? 1 : -1; // पानी पर किनारे बँधी नावें
      const hull = new THREE.CylinderGeometry(0.6, 0.6, 2.8, 12, 1, false, PI / 2, PI); hull.scale(1, 0.55, 1);
      mg.add(hull, mat4(s * 5.3, WATER_Y + 0.33, z, PI / 2, 0, 0), 0x5e3a1e); mg.add(G.box(1.05, 0.05, 2.6), mat4(s * 5.3, WATER_Y + 0.35, z), 0x8a5a34);
      mg.add(G.cyl(0.25, 0.3, 0.3, 10), mat4(s * 5.3, WATER_Y + 0.5, z + 0.6), 0x4a6b8a); });
    along(5, (z, i) => { const s = i % 2 ? 1 : -1, x = s * rand(5.4, 6.2); // उथले पानी में बगुले
      mg.add(G.cap(0.13, 0.26, 8), mat4(x, WATER_Y + 0.75, z, PI / 2 - 0.3, 0, 0), 0xf6f6f2); mg.add(G.cyl(0.025, 0.025, 0.45, 5), mat4(x, WATER_Y + 1.05, z - 0.16, 0.25, 0, 0), 0xf6f6f2);
      mg.add(G.sph(0.06, 8, 6), mat4(x, WATER_Y + 1.3, z - 0.22), 0xf6f6f2); mg.add(G.cone(0.02, 0.2, 5), mat4(x, WATER_Y + 1.28, z - 0.36, -PI / 2, 0, 0), 0xe0a020);
      for (const d of [-0.05, 0.05]) mg.add(G.cyl(0.012, 0.012, 0.7, 4), mat4(x + d, WATER_Y + 0.3, z), 0xd88a3a); });
    { const z = -L * 0.55, s = -1; // खंभों पर मचान वाली झोंपड़ी (पानी के किनारे)
      for (const [dx, dz] of [[-0.9, -1], [0.9, -1], [-0.9, 1], [0.9, 1]]) mg.add(G.cyl(0.07, 0.08, 2.0, 6), mat4(s * 6.2 + dx, 1.0, z + dz), C.bamboo);
      mg.add(G.box(2.2, 0.12, 2.4), mat4(s * 6.2, 1.9, z), 0x8a5a34); mg.add(G.box(1.8, 1.2, 1.8), mat4(s * 6.2, 2.55, z), 0xd8c49a);
      mg.add(G.cone(1.7, 1.1, 4), mat4(s * 6.2, 3.7, z, 0, PI / 4, 0), 0xc9a54a); }
    // जाल की बुनावट वाले परदे (सूखते जाल)
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); x.strokeStyle = 'rgba(70,60,50,0.9)'; x.lineWidth = 2.5;
    for (let k = 0; k <= 64; k += 12) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k - 32, 64); x.stroke(); x.beginPath(); x.moveTo(k - 32, 0); x.lineTo(k, 64); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 3);
    const nm = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, color: 0xb8a888 });
    along(3, (z, i) => { const s = i % 2 ? -1 : 1, n = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.7), nm); n.position.set(s * (BK + 0.5), 1.45, z); n.rotation.y = PI / 2; g.add(n); });
  } else { // 🪔 दीयों वाला घाट: तैरते दीये, गन्ने की कोसी, गेंदे की लड़ी
    const pos = [];
    along(42, (z, i) => { const s = i % 2 ? 1 : -1, x = s * rand(3.7, W1); pos.push(x, WATER_Y + 0.2, z);
      mg.add(G.cyl(0.2, 0.16, 0.04, 8), mat4(x, WATER_Y + 0.03, z), 0x3f8f40); mg.add(G.cyl(0.11, 0.07, 0.09, 8), mat4(x, WATER_Y + 0.09, z), C.terracotta); });
    along(4, (z, i) => { const s = i % 2 ? 1 : -1; // गन्ने की कोसी (छठ जैसी) + सूप में फल + दीये
      for (let q = 0; q < 5; q++) { const a = q / 5 * PI * 2; mg.add(G.cyl(0.035, 0.04, 2.6, 5), mat4(s * BK + Math.cos(a) * 0.45, 1.75, z + Math.sin(a) * 0.45, Math.sin(a) * 0.16, 0, -Math.cos(a) * 0.16), 0x6f9a3a); }
      for (let q = 0; q < 6; q++) mg.add(G.cone(0.08, 0.6, 4), mat4(s * BK + rand(-0.3, 0.3), 3.1, z + rand(-0.3, 0.3), rand(-0.6, 0.6), 0, rand(-0.6, 0.6)), 0x4f8f3a);
      mg.add(G.cyl(0.42, 0.3, 0.1, 12), mat4(s * BK, 0.62, z), 0xc9a35c); // सूप
      for (const [dx, dz, col] of [[-0.12, 0, 0xf2a91b], [0.12, 0.1, 0xd1261c], [0, -0.15, 0x6f9a3a], [0.1, -0.12, 0xf5c542]]) mg.add(G.sph(0.09, 8, 6), mat4(s * BK + dx, 0.72, z + dz), col);
      for (const d of [-0.7, 0.7]) { mg.add(G.cyl(0.08, 0.06, 0.08, 8), mat4(s * (BK - 0.45), 0.6, z + d), C.terracotta); pos.push(s * (BK - 0.45), 0.72, z + d); } });
    along(8, (z, i) => { const s = i % 2 ? 1 : -1; // गेंदे की लड़ी बाँसों के बीच
      mg.add(G.cyl(0.04, 0.05, 2.2, 6), mat4(s * (BK + 0.6), 1.1, z), C.bamboo);
      for (let q = 0; q < 9; q++) { const u = q / 8; mg.add(G.sph(0.08, 6, 5), mat4(s * (BK + 0.6), 2.1 - Math.sin(u * PI) * 0.45, z + u * 6), q % 2 ? 0xf5c542 : 0xf08a1c); } });
    // दीयों की लौ (एक ही चीज़ में सब) + रोशनी के गोले
    const fl = new Merge(); for (let i = 0; i < pos.length; i += 3) fl.add(G.cone(0.04, 0.13, 6), mat4(pos[i], pos[i + 1], pos[i + 2]), 0xffc23a);
    const flame = new THREE.Mesh(fl.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); g.add(flame);
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? v + 0.02 : v)), 3));
    const pm = new THREE.PointsMaterial({ map: glowTex(), size: 1.1, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, color: 0xffb040 });
    const pts = new THREE.Points(pg, pm); g.add(pts);
    ud.anim = (t) => { pm.size = 1.0 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1) * 0.05; flame.scale.y = 1 + Math.sin(t * 11) * 0.05; };
  }
  const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
  // घाट पर नाम-पट्टी (शुरू में, किनारे पर)
  const inf = POND_INFO[type], bd = new THREE.Group(), pm2 = new Merge();
  for (const d of [-1.1, 1.1]) pm2.add(G.cyl(0.06, 0.06, 2.4, 6), mat4(0, 1.2, d), C.wood);
  bd.add(pm2.mesh(0.01));
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.81), new THREE.MeshBasicMaterial({ map: pondBoard(inf), toneMapped: false, side: THREE.DoubleSide }));
  pl.position.y = 2.7; pl.rotation.y = PI / 2 - 0.55; bd.add(pl); bd.position.set(BANK + 1.2, 0.5, -3); g.add(bd);
  ud.board = pl;
  g.userData = ud; g.visible = false;
  return g;
}
