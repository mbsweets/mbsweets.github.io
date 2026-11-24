// लेवल 5 के बाद नई दुनिया: रात का जंगल (पेड़, बाँस, उल्लू, लालटेन, जुगनू) और भोर के खेत (सरसों, धान, आम, बिजूका, मड़ई)
// हर टुकड़ा 2 ड्रॉ (पास वाला किनारी के साथ, दूर वाला बिना) — फ़ोन पर हल्का
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge, dotTexture } from './art.js';
import { CHUNK, ROAD_HALF } from './models.js';
import { rand, pick, chance } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  ico: (r, d = 1) => new THREE.IcosahedronGeometry(r, d),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
  dod: (r) => new THREE.DodecahedronGeometry(r, 0),
};
const LEAF = [0x2f6b3a, 0x3c7d3f, 0x285c33, 0x4a8c46, 0x356f2e];
const BARK = [0x5a3a22, 0x6b4426, 0x4a3020];

// ---------------- पेड़-पौधे ----------------
export function treeRound(mg, x, z, s) { // बरगद/आम जैसा गोल
  mg.add(G.cyl(0.3 * s, 0.45 * s, 3.2 * s, 7), mat4(x, 1.6 * s, z), pick(BARK));
  const c = pick(LEAF);
  for (let i = 0; i < 4; i++) mg.add(G.ico(1.25 * s * rand(0.8, 1.15), 1), mat4(x + rand(-1, 1) * s, (3.6 + rand(0, 1.1)) * s, z + rand(-1, 1) * s, 0, rand(0, 3), 0, 1, rand(0.75, 0.95), 1), i % 2 ? c : pick(LEAF));
  if (chance(0.5)) for (let i = 0; i < 4; i++) { const h = rand(1.6, 2.6) * s; mg.add(G.cyl(0.035, 0.035, h, 4), mat4(x + rand(-1.2, 1.2) * s, 3.3 * s - h / 2, z + rand(-1.2, 1.2) * s), 0x6b5030); } // लटकती जड़ें
}
function treeTall(mg, x, z, s) { // ऊँचा साल
  mg.add(G.cyl(0.22 * s, 0.34 * s, 5.6 * s, 7), mat4(x, 2.8 * s, z), pick(BARK));
  const c = pick(LEAF);
  for (let i = 0; i < 3; i++) { const g = G.ico((1.5 - i * 0.35) * s, 1); g.scale(1, 0.55, 1); mg.add(g, mat4(x, (4.2 + i * 1.25) * s, z, 0, rand(0, 3), 0), i === 1 ? pick(LEAF) : c); }
}
export function treePalm(mg, x, z, s) { // ताड़
  const lean = rand(-0.12, 0.12);
  for (let i = 0; i < 6; i++) mg.add(G.cyl(0.15 * s, 0.18 * s, 0.85 * s, 6), mat4(x + i * lean * s, (0.42 + i * 0.82) * s, z, 0, 0, -lean), 0x7a5a36);
  const tx = x + 6 * lean * s, ty = 5.1 * s;
  for (let i = 0; i < 7; i++) {
    const a = i * PI * 2 / 7 + rand(0, 0.3), lg = G.sph(0.5, 6, 4); lg.scale(0.22, 0.08, 1.9 * s);
    mg.add(lg, mat4(tx + Math.sin(a) * 0.9 * s, ty - 0.2, z + Math.cos(a) * 0.9 * s, 0.5 * Math.cos(a) - 0.1, a, 0), i % 2 ? 0x2e7b47 : 0x3a8a3f);
  }
}
function bush(mg, x, z, s) {
  const c = pick(LEAF);
  for (let i = 0; i < 3; i++) mg.add(G.ico(0.6 * s * rand(0.8, 1.2), 0), mat4(x + rand(-0.5, 0.5) * s, 0.45 * s, z + rand(-0.6, 0.6) * s, 0, rand(0, 3), 0, 1, 0.75, 1), i ? pick(LEAF) : c);
  if (chance(0.35)) for (let i = 0; i < 3; i++) mg.add(G.sph(0.09, 5, 4), mat4(x + rand(-0.5, 0.5) * s, 0.8 * s, z + rand(-0.5, 0.5) * s), pick([0xd8457f, 0xf2a91b, 0xffffff])); // जंगली फूल
}
function bamboo(mg, x, z) {
  for (let i = 0; i < 7; i++) {
    const h = rand(5, 8), bx = x + rand(-0.8, 0.8), bz = z + rand(-0.8, 0.8), t = rand(-0.1, 0.1);
    mg.add(G.cyl(0.07, 0.09, h, 6), mat4(bx, h / 2, bz, t, 0, t), i % 2 ? 0x7da24a : 0x6b8f3a);
    for (let k = 0; k < 3; k++) { const lg = G.sph(0.4, 5, 3); lg.scale(0.25, 0.06, 1.2); mg.add(lg, mat4(bx + Math.sin(k * 2.1) * 0.4, h - k * 0.7, bz + Math.cos(k * 2.1) * 0.4, 0.4, k * 2.1, 0), 0x5c8f3a); }
  }
}
function rock(mg, x, z, s) {
  mg.add(G.dod(0.6 * s), mat4(x, 0.35 * s, z, rand(0, 3), rand(0, 3), 0, 1, 0.7, 1), pick([0x8a8a80, 0x77776e, 0x9a958a]));
  if (chance(0.5)) mg.add(G.dod(0.3 * s), mat4(x + 0.6 * s, 0.18 * s, z + 0.3 * s, 1, 2, 0), 0x6f7f5a);
}
function mushroom(mg, x, z) {
  mg.add(G.cyl(0.05, 0.07, 0.3, 5), mat4(x, 0.15, z), 0xf5ead0);
  const cap = G.sph(0.16, 7, 4); cap.scale(1, 0.6, 1); mg.add(cap, mat4(x, 0.32, z), C.sindoor);
}
// ठूँठ पर बैठा उल्लू (सड़क की ओर देखता)
function owlStump(mg, x, z, side) {
  mg.add(G.cyl(0.38, 0.45, 1.6, 8), mat4(x, 0.8, z), 0x6b4426);
  mg.add(G.cyl(0.39, 0.39, 0.03, 8), mat4(x, 1.61, z), 0xc9a06a);
  const y = 1.95, f = -side; // चेहरा सड़क की तरफ़
  const b = G.sph(0.28, 8, 6); b.scale(0.9, 1.2, 1); mg.add(b, mat4(x, y, z), 0x8a6a45);
  mg.add(G.sph(0.2, 8, 6), mat4(x + f * 0.1, y - 0.05, z), 0xd9c39a); // पेट
  for (const e of [-1, 1]) {
    mg.add(G.sph(0.085, 8, 6), mat4(x + f * 0.2, y + 0.1, z + e * 0.1), 0xffffff);
    mg.add(G.sph(0.045, 6, 4), mat4(x + f * 0.27, y + 0.1, z + e * 0.1), 0x111111);
    mg.add(G.cone(0.06, 0.16, 4), mat4(x, y + 0.36, z + e * 0.12), 0x6b5030);
  }
  mg.add(G.cone(0.045, 0.1, 4), mat4(x + f * 0.28, y, z, 0, 0, f * PI / 2), C.haldi);
}
// बाँस का खंभा + लालटेन (रात में चमकती — glows में दर्ज)
function lantern(mg, glows, x, z, side) {
  mg.add(G.cyl(0.06, 0.08, 3.0, 6), mat4(x, 1.5, z), 0x8a6a3c);
  mg.add(G.box(0.7, 0.06, 0.06), mat4(x - side * 0.3, 2.95, z), 0x8a6a3c);
  const lx = x - side * 0.6;
  mg.add(G.cyl(0.02, 0.02, 0.2, 4), mat4(lx, 2.85, z), 0x3d3d3d);
  mg.add(G.cyl(0.13, 0.16, 0.3, 6), mat4(lx, 2.58, z), 0xffd27a);
  mg.add(G.cone(0.19, 0.14, 6), mat4(lx, 2.8, z), 0x3d3d3d);
  glows.push([lx, 2.58, z, 1]);
}
function groundPlane(grp, side, col) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(40, CHUNK + 0.2), toon(col));
  g.rotation.x = -PI / 2; g.position.set(side * (ROAD_HALF + 20), 0.006, 0);
  grp.add(g);
}

// ---------------- जंगल का टुकड़ा ----------------
export function makeJungle(side, v = 0) {
  const grp = new THREE.Group(), glows = [];
  groundPlane(grp, side, 0x4a7a33);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.5, CHUNK + 0.2), toon(0x7a5a3a)); // सड़क किनारे कच्ची मिट्टी
  strip.rotation.x = -PI / 2; strip.position.set(side * (ROAD_HALF + 0.75), 0.008, 0); grp.add(strip);
  const near = new Merge(), far = new Merge();
  for (let z = -CHUNK / 2 + 0.8; z < CHUNK / 2; z += rand(1.8, 3.2)) bush(near, side * (ROAD_HALF + 1.7 + rand(0, 1.4)), z, rand(0.6, 1.0));
  const n = 2 + (v % 2);
  for (let i = 0; i < n; i++) {
    const z = -CHUNK / 2 + (i + 0.5) * CHUNK / n + rand(-1.5, 1.5);
    (v % 4 === 3 && i === 0 ? treePalm : pick([treeRound, treeTall, treeRound]))(near, side * rand(8.5, 11.5), z, rand(1.0, 1.35));
  }
  if (v % 3 !== 2) bamboo(near, side * rand(6.8, 8.2), rand(-7, 7));
  for (let i = 0; i < 6; i++) pick([treeRound, treeTall, treePalm, treeTall])(far, side * rand(14, 30), rand(-CHUNK / 2, CHUNK / 2), rand(1.4, 2.2));
  for (let i = 0; i < 2; i++) rock(near, side * rand(5.6, 9), rand(-9, 9), rand(0.6, 1.2));
  for (let i = 0; i < 3; i++) mushroom(near, side * rand(5.4, 7), rand(-9, 9));
  if (v % 3 === 0) owlStump(near, side * 6.4, rand(-6, 6), side);
  if (v % 2 === 0) lantern(near, glows, side * (ROAD_HALF + 0.95), rand(-8, 8), side);
  grp.add(near.mesh(0.03)); grp.add(far.mesh(0));
  grp.userData = { type: 'jungle', len: CHUNK, glows };
  return grp;
}

// ---------------- खेत का टुकड़ा (सरसों / धान) ----------------
function scarecrow(mg, x, z) {
  mg.add(G.cyl(0.05, 0.05, 2.2, 5), mat4(x, 1.1, z), 0x6b4426);
  mg.add(G.cyl(0.04, 0.04, 1.4, 5), mat4(x, 1.55, z, PI / 2, 0, 0), 0x6b4426);
  mg.add(G.box(0.5, 0.6, 0.3), mat4(x, 1.45, z), C.sindoor); // कुर्ता
  mg.add(G.sph(0.22, 8, 6), mat4(x, 2.0, z), C.terracotta); // मटकी वाला सिर
  for (const e of [-1, 1]) mg.add(G.sph(0.04, 5, 4), mat4(x + 0.18, 2.05, z + e * 0.08), 0x111111);
  mg.add(G.cone(0.32, 0.25, 8), mat4(x, 2.25, z), 0xe9c46a); // पुआल की टोपी
}
function hut(mg, x, z, side) { // मड़ई
  mg.add(G.box(2.6, 1.7, 2.4), mat4(x, 0.85, z), 0xc9925a);
  mg.add(G.box(0.05, 1.1, 0.8), mat4(x - side * 1.31, 0.55, z), 0x5a3a22); // दरवाज़ा
  mg.add(G.cone(2.3, 1.6, 4), mat4(x, 2.5, z, 0, PI / 4, 0), 0xd9b25a);
}
function hay(mg, x, z) {
  mg.add(G.cyl(0.9, 1.1, 1.0, 10), mat4(x, 0.5, z), 0xe9c46a);
  mg.add(G.cone(1.0, 1.4, 10), mat4(x, 1.7, z), 0xf2d27e);
}
export function makeFields(side, v = 0) {
  const grp = new THREE.Group(), glows = [];
  const kind = v % 3; // 0 सरसों, 1 धान, 2 मिला-जुला
  groundPlane(grp, side, kind === 1 ? 0x6aa83c : 0x88ab45);
  const mg = new Merge(), far = new Merge();
  mg.add(G.box(0.7, 0.28, CHUNK), mat4(side * (ROAD_HALF + 1.0), 0.14, 0), 0x8a6a45); // मेड़
  for (let x = 6.2; x < 32; x += 1.3) {
    const mustard = kind === 0 || (kind === 2 && Math.floor(x / 6.5) % 2 === 0), m = x < 13 ? mg : far;
    m.add(G.box(0.72, mustard ? 0.72 : 0.5, CHUNK - 0.3), mat4(side * x, mustard ? 0.36 : 0.25, 0), mustard ? 0x6f9a35 : 0x7cc04a);
    if (mustard) m.add(G.box(0.8, 0.22, CHUNK - 0.3), mat4(side * x, 0.82, 0), 0xffd21a);
  }
  if (v % 2 === 0) treeRound(mg, side * rand(9.5, 12), rand(-6, 6), rand(1.1, 1.4)); // आम का पेड़
  if (v % 3 === 1) hay(mg, side * rand(7.5, 9.5), rand(-7, 7));
  if (v % 4 === 2) scarecrow(mg, side * rand(8, 11), rand(-6, 6));
  if (v % 5 === 4) hut(far, side * 17, rand(-5, 5), side);
  for (let i = 0; i < 3; i++) (chance(0.6) ? treePalm : treeRound)(far, side * rand(22, 34), rand(-CHUNK / 2, CHUNK / 2), rand(1.2, 1.8));
  if (v % 3 === 0) lantern(mg, glows, side * (ROAD_HALF + 0.95), rand(-8, 8), side);
  grp.add(mg.mesh(0.03)); grp.add(far.mesh(0));
  grp.userData = { type: 'fields', len: CHUNK, glows };
  return grp;
}

// ---------------- जंगल / खेत की रुकावटें ----------------
export const JUNGLE_OBST = {
  log() { // गिरा हुआ पेड़ का तना — कूदो
    const g = new THREE.Group(), mg = new Merge();
    mg.add(G.cyl(0.36, 0.4, 2.3, 10), mat4(0, 0.38, 0, 0, 0, PI / 2), 0x6b4426);
    for (const s of [-1, 1]) mg.add(G.cyl(0.37, 0.37, 0.03, 10), mat4(s * 1.16, 0.38, 0, 0, 0, PI / 2), 0xc9a06a);
    mg.add(G.cyl(0.06, 0.09, 0.7, 5), mat4(0.4, 0.82, 0.05, 0.3, 0, -0.5), 0x6b4426);
    for (let i = 0; i < 5; i++) mg.add(G.ico(0.15, 0), mat4(rand(-0.9, 0.9), 0.72, rand(-0.12, 0.12)), 0x4f8f3a); // काई
    g.add(mg.mesh(0.03));
    g.userData = { kind: 'low', halfW: 1.05, halfL: 0.38, yMin: 0, yMax: 0.8 };
    return g;
  },
  vine() { // लटकती डाल और बेलें — लुढ़को
    const g = new THREE.Group(), mg = new Merge();
    for (const s of [-1, 1]) mg.add(G.cyl(0.13, 0.17, 3.4, 7), mat4(s * 1.12, 1.7, 0), 0x5a3a22);
    mg.add(G.cyl(0.13, 0.13, 2.5, 7), mat4(0, 3.05, 0, 0, 0, PI / 2), 0x5a3a22);
    for (let i = 0; i < 7; i++) {
      const x = -0.9 + i * 0.3, h = rand(1.1, 1.65);
      mg.add(G.cyl(0.025, 0.025, h, 4), mat4(x, 3.0 - h / 2, rand(-0.06, 0.06)), 0x3f7a33);
      mg.add(G.ico(0.13, 0), mat4(x, 3.0 - h, 0), 0x4f8f3a);
    }
    for (let i = 0; i < 4; i++) mg.add(G.ico(0.42, 0), mat4(rand(-1, 1), 3.25, rand(-0.2, 0.2)), pick(LEAF));
    g.add(mg.mesh(0.03));
    g.userData = { kind: 'high', halfW: 1.05, halfL: 0.25, yMin: 1.15, yMax: 3.3 };
    return g;
  },
  boulder() { // बड़ा पत्थर — रास्ता बदलो
    const g = new THREE.Group(), mg = new Merge();
    mg.add(G.dod(1.0), mat4(0, 0.85, 0, 0.4, 0.7, 0, 0.95, 0.9, 1.05), 0x8a8a80);
    mg.add(G.dod(0.55), mat4(0.55, 0.4, 0.6, 1, 2, 0), 0x77776e);
    mg.add(G.dod(0.45), mat4(-0.6, 0.32, -0.5, 2, 1, 0), 0x9a958a);
    for (let i = 0; i < 4; i++) mg.add(G.ico(0.2, 0), mat4(rand(-0.6, 0.6), 1.55, rand(-0.5, 0.5)), 0x5f8f3f); // ऊपर काई
    g.add(mg.mesh(0.03));
    g.userData = { kind: 'block', halfW: 0.92, halfL: 1.0, yMin: 0, yMax: 2.0 };
    return g;
  },
  haybale() { // पुआल के गट्ठर — रास्ता बदलो
    const g = new THREE.Group(), mg = new Merge();
    mg.add(G.cyl(0.85, 0.85, 1.8, 12), mat4(0, 0.85, 0, 0, 0, PI / 2), 0xe9c46a);
    for (const s of [-1, 1]) mg.add(G.cyl(0.86, 0.86, 0.03, 12), mat4(s * 0.91, 0.85, 0, 0, 0, PI / 2), 0xd9a84a);
    mg.add(G.cyl(0.55, 0.55, 1.2, 10), mat4(0.1, 2.1, 0, 0, 0.3, PI / 2), 0xf2d27e);
    g.add(mg.mesh(0.03));
    g.userData = { kind: 'block', halfW: 0.92, halfL: 0.9, yMin: 0, yMax: 2.6 };
    return g;
  },
  fence() { // लकड़ी की बाड़ — कूदो
    const g = new THREE.Group(), mg = new Merge();
    for (const x of [-1.0, 0, 1.0]) mg.add(G.box(0.14, 1.0, 0.14), mat4(x, 0.5, 0), 0x7a5a36);
    for (const y of [0.35, 0.78]) mg.add(G.box(2.2, 0.12, 0.08), mat4(0, y, 0, 0, 0, rand(-0.05, 0.05)), 0x9a7448);
    g.add(mg.mesh(0.03));
    g.userData = { kind: 'low', halfW: 1.05, halfL: 0.2, yMin: 0, yMax: 1.0 };
    return g;
  },
};
// गाँव की रुकावट → जंगल / खेत वाली (भौतिकी वही: कूदो / लुढ़को / बचो)
export const ZONE_SUB = {
  jungle: { barrier: 'log', cans: 'log', toran: 'vine', kapda: 'vine', taar: 'vine', thela: 'boulder', rickshaw: 'boulder' },
  fields: { barrier: 'fence', thela: 'haybale', rickshaw: 'haybale', cans: 'tokri', kapda: 'toran', taar: 'toran' },
};

// ---------------- रात की चमक: लालटेन/खंभों की रोशनी (1 ड्रॉ) + जुगनू (1 ड्रॉ) ----------------
export class NightFX {
  constructor(scene, max = 40) {
    const dot = dotTexture();
    this.max = max;
    this.mat = new THREE.MeshBasicMaterial({ map: dot, color: 0xffbf66, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.glow = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), this.mat, max);
    this.glow.count = 0; this.glow.frustumCulled = false; this.glow.renderOrder = 3; this.glow.visible = false;
    scene.add(this.glow);
    const n = 60, pos = new Float32Array(n * 3);
    this.ff = [];
    for (let i = 0; i < n; i++) this.ff.push({ x: rand(-13, 13), y: rand(0.4, 4.2), z: rand(-72, 6), p: rand(0, 6), s: rand(0.6, 1.4) });
    this.fgeo = new THREE.BufferGeometry(); this.fgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.fmat = new THREE.PointsMaterial({ map: dot, color: 0xd8ff6a, size: 0.34, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true, fog: false });
    this.flies = new THREE.Points(this.fgeo, this.fmat); this.flies.frustumCulled = false; this.flies.visible = false;
    scene.add(this.flies);
    this.t = 0; this.m = new THREE.Matrix4(); this.v = new THREE.Vector3(); this.sc = new THREE.Vector3();
  }
  // night 0–1, wild 0–1 (जंगल/खेत में जुगनू), chunks = world.chunks, q = कैमरे का quaternion
  update(dt, dz, night, wild, chunks, q) {
    this.t += dt;
    const on = night > 0.05;
    this.glow.visible = on;
    if (on) {
      this.mat.opacity = Math.min(1, night * 1.3);
      let k = 0;
      for (const s of ['-1', '1']) for (const c of chunks[s]) {
        const gl = c.userData.glows;
        if (!c.visible || !gl || !gl.length) continue;
        for (const g of gl) {
          if (k >= this.max) break;
          const z = c.position.z + g[2];
          if (z < -125 || z > 10) continue;
          const f = (g[3] || 1) * (2.1 + 0.18 * Math.sin(this.t * 9 + z * 3));
          this.v.set(g[0], g[1], z); this.sc.set(f, f, f);
          this.m.compose(this.v, q, this.sc); this.glow.setMatrixAt(k++, this.m);
        }
      }
      this.glow.count = k; this.glow.instanceMatrix.needsUpdate = true;
    }
    const fOn = wild > 0.01 && night > 0.25;
    this.flies.visible = fOn;
    if (fOn) {
      this.fmat.opacity = Math.min(1, (night - 0.25) * 2.5) * wild;
      const a = this.fgeo.attributes.position.array;
      this.ff.forEach((f, i) => {
        f.z += dz; if (f.z > 8) { f.z -= 80; f.x = rand(-13, 13); f.y = rand(0.4, 4.2); }
        const b = 0.5 + 0.5 * Math.sin(this.t * 3.1 * f.s + f.p); // टिमटिमाना
        a[i * 3] = f.x + Math.sin(this.t * 0.7 * f.s + f.p) * 0.6;
        a[i * 3 + 1] = b < 0.15 ? -50 : f.y + Math.sin(this.t * 1.3 + f.p) * 0.3; // बुझा = नीचे छिपा
        a[i * 3 + 2] = f.z;
      });
      this.fgeo.attributes.position.needsUpdate = true;
    }
  }
}
