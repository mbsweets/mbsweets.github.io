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
