// मिथिला हाट — सब्ज़ी, फल, फूल, मछली, मखाना की दुकानें, तिरपाल, तराज़ू, बोलते-बुलाते दुकानदार, ख़रीदार।
// हाट वाली रुकावटें: टोकरियाँ (कूदो), भैंस, बैलगाड़ी। गाँव के लोग (हाथ हिलाते/चलते)।
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge } from './art.js';
import { rand, pick, chance } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s),
  cap: (r, l, s = 8) => new THREE.CapsuleGeometry(r, l, 3, s),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, a = 6, b = 14, arc = PI * 2) => new THREE.TorusGeometry(r, t, a, b, arc),
};
const SKINS = [0xc98a5e, 0xb5754d, 0xd9a07a, 0xa86a45, 0xe0b08a];
const SARI = [0xd81b60, 0xff8f00, 0x2e7d32, 0x6a1b9a, 0xc62828, 0x1565c0, 0xf9a825, 0x00897b];
const KURTA = [0xf4efe6, 0xfff3d6, 0x9ec9e8, 0xf6b26b, 0xd6e8c8, 0xe8d0f0];

// ---------------- गाँव के लोग ----------------
// mode: call (हाथ हिलाकर बुलाना), weigh (तराज़ू), buy (इशारा/मोलभाव), walk, sit (बैठा दुकानदार), serve (मिठाई का डिब्बा देना)
export function makeVillager(o = {}) {
  const kind = o.kind || pick(['man', 'woman', 'man', 'woman', 'kid']);
  const skin = pick(SKINS);
  const g = new THREE.Group();
  const body = new THREE.Group();
  g.add(body);
  const mg = new Merge();
  let sleeve = skin;
  const sit = o.mode === 'sit' || o.sit;
  if (kind === 'woman') {
    const sari = o.cloth || pick(SARI), bord = pick([0xffd54f, 0xffffff, 0xd32f2f]);
    if (!sit) mg.add(G.cyl(0.2, 0.42, 1.0, 10), mat4(0, 0.5, 0), sari);
    else mg.add(G.cyl(0.42, 0.55, 0.42, 10), mat4(0, 0.21, 0), sari);
    if (!sit) mg.add(G.tor(0.415, 0.03, 4, 14), mat4(0, 0.04, 0, PI / 2), bord);
    sleeve = pick([0xffd54f, 0xd32f2f, 0x1565c0, 0x6d4c41]);
    mg.add(G.cap(0.2, 0.32), mat4(0, 1.18, 0), sleeve);
    mg.add(G.box(0.1, 0.75, 0.42), mat4(-0.06, 1.18, 0.02, 0, 0, 0.42), sari); // पल्लू
    mg.add(G.sph(0.19, 12, 10), mat4(0, 1.6, 0), skin);
    mg.add(G.sph(0.025, 4, 3), mat4(0, 1.66, -0.185), 0xd50000); // बिंदी
    if (chance(0.55)) mg.add(new THREE.SphereGeometry(0.215, 12, 8, 0, PI * 2, 0, 0.62 * PI), mat4(0, 1.62, 0.03), sari); // घूँघट
    else { mg.add(new THREE.SphereGeometry(0.2, 12, 8, 0, PI * 2, 0, 0.5 * PI), mat4(0, 1.62, 0.02), 0x1b1210); mg.add(G.sph(0.09, 6, 5), mat4(0, 1.6, 0.2), 0x1b1210); }
  } else {
    const kid = kind === 'kid';
    const lower = pick([0xf4efe6, 0xf4efe6, 0x8d6e63, 0x37474f, 0x2e7d32]);
    const kur = o.cloth || pick(KURTA);
    sleeve = kur;
    if (!sit) for (const x of [-0.12, 0.12]) mg.add(G.cap(0.1, 0.42), mat4(x, 0.36, 0), lower);
    else mg.add(G.box(0.62, 0.3, 0.55), mat4(0, 0.15, -0.12), lower);
    if (!sit) for (const x of [-0.12, 0.12]) mg.add(G.box(0.12, 0.05, 0.24), mat4(x, 0.03, -0.04), 0x4e342e);
    mg.add(G.cap(0.27, 0.42, 10), mat4(0, 1.0, 0), kur);
    if (chance(0.6)) mg.add(G.box(0.12, 0.62, 0.06), mat4(0.17, 1.12, -0.2, 0.15, 0, 0.35), pick([0xd32f2f, 0xc62828, 0xffffff])); // गमछा
    mg.add(G.sph(0.21, 12, 10), mat4(0, 1.56, 0), skin);
    if (!kid && chance(0.6)) mg.add(G.box(0.2, 0.035, 0.05), mat4(0, 1.5, -0.2), 0x1b1210); // मूँछ
    const hat = kid ? 0 : Math.random();
    if (hat < 0.25) { mg.add(G.cyl(0.24, 0.23, 0.16, 12), mat4(0, 1.72, 0), 0xd1261c); mg.add(G.sph(0.06, 6, 5), mat4(0, 1.82, -0.12), C.gold); } // मिथिला पाग
    else if (hat < 0.45) mg.add(G.cyl(0.2, 0.21, 0.12, 12), mat4(0, 1.74, 0), 0xffffff); // टोपी
    else mg.add(new THREE.SphereGeometry(0.22, 12, 8, 0, PI * 2, 0, 0.45 * PI), mat4(0, 1.58, 0.02), 0x1b1210);
  }
  // बायाँ हाथ धड़ के साथ
  mg.add(G.cap(0.065, 0.42), mat4(0.3, 1.04, 0, 0, 0, 0.12), sleeve);
  mg.add(G.sph(0.07, 6, 5), mat4(0.33, 0.78, 0), skin);
  const still = o.mode === 'buy' || o.mode === 'walk' || !o.mode;
  if (still) { // ड्रॉ-कॉल बचाओ: हाथ धड़ के साथ, पूरा शरीर हिले
    mg.add(G.cap(0.065, 0.42), mat4(-0.32, 1.06, -0.08, 0.35, 0, -0.15), sleeve);
    mg.add(G.sph(0.07, 6, 5), mat4(-0.36, 0.82, -0.2), skin);
  }
  const m = mg.mesh(0);
  body.add(m);
  // दायाँ हाथ (हिलने वाला)
  const arm = new THREE.Group();
  arm.position.set(-0.3, 1.32, 0);
  const am = new Merge();
  am.add(G.cap(0.065, 0.42), mat4(0, -0.27, 0), sleeve);
  am.add(G.sph(0.07, 6, 5), mat4(0, -0.53, 0), skin);
  if (o.mode === 'weigh') { // हाथ में तराज़ू
    am.add(G.cyl(0.012, 0.012, 0.5, 4), mat4(0, -0.6, -0.25, PI / 2, 0, 0), 0x5d4037);
    for (const z of [-0.5, 0]) { am.add(G.cyl(0.005, 0.005, 0.3, 3), mat4(0, -0.75, z - 0.0), 0x999999); am.add(G.cyl(0.14, 0.1, 0.04, 10), mat4(0, -0.9, z), 0xb0b6bb); }
  }
  if (o.mode === 'serve') am.add(G.box(0.3, 0.16, 0.22), mat4(0, -0.6, -0.1), 0xd3121f); // मिठाई का डिब्बा
  if (!still) { arm.add(am.mesh(0)); body.add(arm); }
  const s = o.s || (kind === 'kid' ? 0.72 : rand(0.95, 1.05));
  g.scale.setScalar(s);
  const ph = rand(0, 6), mode = o.mode || 'buy';
  if (sit) body.position.y = -0.45;
  g.userData.anim = (t) => {
    const a = t * 1.0 + ph;
    if (mode === 'call' || mode === 'sit') { arm.rotation.set(-0.3, 0, -2.3 - Math.sin(a * 6) * 0.35); body.rotation.z = Math.sin(a * 1.5) * 0.04; body.rotation.y = Math.sin(a * 0.7) * 0.25; }
    else if (mode === 'weigh') { arm.rotation.set(-1.1 + Math.sin(a * 2.5) * 0.12, 0, -0.2); body.rotation.y = Math.sin(a * 0.5) * 0.1; }
    else if (mode === 'serve') { const k = (Math.sin(a * 1.6) + 1) / 2; arm.rotation.set(-0.6 - k * 0.9, 0, -0.15); body.rotation.x = -k * 0.08; }
    else if (mode === 'walk') { arm.rotation.set(Math.sin(a * 6) * 0.6, 0, -0.08); body.position.y = Math.abs(Math.sin(a * 6)) * 0.05; body.rotation.z = Math.sin(a * 6) * 0.03; }
    else { arm.rotation.set(-0.9 + Math.sin(a * 2.2) * 0.35, 0, -0.25); body.rotation.x = Math.sin(a * 1.3) * 0.05; body.rotation.y = Math.sin(a * 0.6) * 0.3; } // buy
  };
  return g;
}

// ---------------- सामान के ढेर ----------------
function heap(mg, x, z, col, r, rows, sx = 1, sy = 1, sz = 1, jit = 0.15, y0 = 0.08) {
  for (let L = 0; L < rows; L++) {
    const n = rows - L;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const px = x + (i - (n - 1) / 2) * r * 1.8 + rand(-jit, jit) * r, pz = z + (j - (n - 1) / 2) * r * 1.8 + rand(-jit, jit) * r;
      mg.add(G.sph(r, 6, 4), mat4(px, y0 + r + L * r * 1.45, pz, rand(0, 3), rand(0, 3), 0, sx, sy, sz), Array.isArray(col) ? pick(col) : col);
    }
  }
}
function basket(mg, x, z, r = 0.38, h = 0.32) {
  mg.add(G.cyl(r, r * 0.75, h, 12), mat4(x, h / 2, z), 0xb5894a);
  mg.add(G.tor(r, 0.03, 4, 14), mat4(x, h, z, PI / 2), 0x8d6234);
}
function dari(mg, x, z, w, l) {
  const c = pick([[0xc62828, 0x1565c0], [0x2e7d32, 0xf9a825], [0x6a1b9a, 0xff8f00], [0x00897b, 0xd81b60]]);
  mg.add(G.box(w, 0.04, l), mat4(x, 0.02, z), c[0]);
  for (let k = -2; k <= 2; k++) mg.add(G.box(w + 0.01, 0.045, 0.12), mat4(x, 0.022, z + k * l / 5.5), c[1]);
}
function canopy(mg, side, z, col, col2) {
  const x0 = side * 5.5, x1 = side * 10.6, zs = [-2.7, 2.7];
  for (const zz of zs) {
    mg.add(G.cyl(0.07, 0.08, 3.0, 6), mat4(x0, 1.5, z + zz), C.bamboo);
    mg.add(G.cyl(0.07, 0.08, 3.6, 6), mat4(x1, 1.8, z + zz), C.bamboo);
  }
  const dx = x1 - x0, ang = Math.atan2(0.6, Math.abs(dx));
  for (let k = 0; k < 4; k++) {
    const zz = z - 2.85 + k * 1.425 + 0.71;
    mg.add(G.box(Math.hypot(dx, 0.6) + 0.5, 0.05, 1.43), mat4((x0 + x1) / 2, 3.3, zz, 0, 0, side * ang), k % 2 ? col : col2);
  }
  // झालर
  for (let k = 0; k < 9; k++) mg.add(G.box(0.05, 0.28, 0.5), mat4(x0 - side * 0.25, 2.92, z - 2.6 + k * 0.65, 0, 0, 0), k % 2 ? col : col2);
}

const STALLS = {
  sabzi(mg, side, z, people) {
    dari(mg, side * 7.6, z, 3.4, 4.6);
    heap(mg, side * 6.4, z - 1.5, 0xd62828, 0.1, 4); // टमाटर
    heap(mg, side * 6.4, z, [0x4a148c, 0x5e1f8c], 0.09, 3, 1, 1, 1.9); // बैंगन
    for (let i = 0; i < 4; i++) { mg.add(G.sph(0.19, 9, 7), mat4(side * 6.3 + rand(-0.2, 0.2), 0.25, z + 1.2 + i * 0.32), 0xf5f1e3); mg.add(G.cone(0.2, 0.2, 5), mat4(side * 6.3, 0.15, z + 1.2 + i * 0.32, PI, 0, 0), 0x558b2f); } // गोभी
    heap(mg, side * 7.4, z - 1.4, [0xb08850, 0xa0784a], 0.1, 3, 1, 0.8, 1); // आलू
    heap(mg, side * 7.4, z + 0.2, [0xa8456b, 0xb85c7a], 0.085, 3); // प्याज़
    for (let i = 0; i < 5; i++) mg.add(G.cap(0.07, 0.55, 6), mat4(side * 7.5, 0.12, z + 1.3 + i * 0.16, 0, 0, PI / 2), 0x7cb342); // लौकी
    for (let i = 0; i < 4; i++) mg.add(G.cyl(0.1, 0.13, 0.3, 6), mat4(side * 8.2, 0.17, z - 1.6 + i * 0.3), 0x2e7d32); // साग
    basket(mg, side * 8.4, z + 1.2); heap(mg, side * 8.4, z + 1.2, 0x9ccc65, 0.07, 2); // मिर्च/भिंडी
    people.push(makeVillager({ mode: 'weigh', sit: true }), makeVillager({ mode: 'buy' }));
  },
  phal(mg, side, z, people) {
    dari(mg, side * 7.6, z, 3.4, 4.6);
    for (let b = 0; b < 3; b++) for (let i = 0; i < 6; i++) mg.add(G.cap(0.05, 0.22, 5), mat4(side * 6.4 + (i % 3) * 0.12 * side, 0.18 + Math.floor(i / 3) * 0.09, z - 1.6 + b * 0.55 + (i % 2) * 0.08, 0.4, 0, 0.6), 0xf4d03f); // केले
    heap(mg, side * 6.5, z + 0.4, [0xf5b041, 0xf39c12, 0x9acd32], 0.11, 3, 1, 1, 1.25); // आम
    for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) mg.add(G.sph(0.05, 5, 4), mat4(side * 7.3 + rand(-0.15, 0.15), 0.12 + rand(0, 0.12), z - 1.4 + k * 0.4 + rand(-0.12, 0.12)), pick([0xb03a2e, 0xc0392b, 0x922b21])); // लीची
    mg.add(G.sph(0.32, 12, 9), mat4(side * 7.4, 0.36, z + 1.4, 0, 0, 0, 1, 0.9, 1.25), 0x2e7d32); // तरबूज़
    mg.add(new THREE.SphereGeometry(0.3, 12, 8, 0, PI), mat4(side * 6.6, 0.25, z + 1.6, 0, side * PI / 2, 0), 0xe53935);
    basket(mg, side * 8.3, z - 0.6); heap(mg, side * 8.3, z - 0.6, [0xc0392b, 0xe74c3c], 0.1, 2); // सेब
    basket(mg, side * 8.3, z + 0.8); heap(mg, side * 8.3, z + 0.8, 0x7dcea0, 0.09, 2); // अमरूद
    people.push(makeVillager({ mode: 'sit', kind: 'woman' }), makeVillager({ mode: 'buy', kind: chance(0.5) ? 'kid' : 'man' }));
  },
  phool(mg, side, z, people) {
    dari(mg, side * 7.6, z, 3.4, 4.6);
    heap(mg, side * 6.5, z - 1.0, [0xff8f00, 0xffb300, 0xff6f00], 0.075, 5); // गेंदा
    heap(mg, side * 6.5, z + 1.0, [0xd81b60, 0xc2185b, 0xff4081], 0.07, 4); // गुलाब
    // माला टँगी
    for (let k = 0; k < 6; k++) for (let i = 0; i < 9; i++) mg.add(G.sph(0.07, 5, 4), mat4(side * 5.7, 2.75 - i * 0.2, z - 2.0 + k * 0.8), i % 2 ? 0xff8f00 : 0xffd54f);
    for (let i = 0; i < 3; i++) basket(mg, side * 8.0, z - 1.4 + i * 1.4, 0.3, 0.25);
    people.push(makeVillager({ mode: 'call', sit: true, kind: 'woman' }), makeVillager({ mode: 'buy', kind: 'woman' }));
  },
  machh(mg, side, z, people) {
    for (const dz of [-1.1, 1.1]) {
      mg.add(G.cyl(0.75, 0.7, 0.08, 18), mat4(side * 6.6, 0.32, z + dz), 0xb0bec5);
      mg.add(G.cyl(0.12, 0.2, 0.3, 8), mat4(side * 6.6, 0.15, z + dz), 0x6d4c41);
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * PI * 2, fx = side * 6.6 + Math.cos(a) * 0.38, fz = z + dz + Math.sin(a) * 0.38;
        mg.add(G.sph(0.09, 8, 6), mat4(fx, 0.42, fz, 0, a, 0, 3.4, 0.8, 1.1), pick([0x9aa5ad, 0xb0bec5, 0x8d9aa3])); // मछली
        mg.add(G.cone(0.08, 0.15, 4), mat4(fx + Math.cos(a) * 0.36, 0.42, fz + Math.sin(a) * 0.36, 0, 0, PI / 2), 0x78909c);
      }
    }
    mg.add(G.box(0.8, 0.5, 1.2), mat4(side * 8.0, 0.25, z), 0x1976d2); // बर्फ़ का डिब्बा
    people.push(makeVillager({ mode: 'call', sit: true }), makeVillager({ mode: 'buy' }));
  },
  makhana(mg, side, z, people) {
    dari(mg, side * 7.6, z, 3.4, 4.6);
    for (let i = 0; i < 4; i++) {
      const sx = side * (6.4 + (i % 2) * 0.9), sz = z - 1.5 + Math.floor(i / 2) * 2.2 + (i % 2) * 0.5;
      mg.add(G.cyl(0.42, 0.46, 0.7, 10), mat4(sx, 0.35, sz), 0xa0784a); // बोरी
      mg.add(G.tor(0.42, 0.06, 4, 12), mat4(sx, 0.7, sz, PI / 2), 0x8d6234);
      for (let k = 0; k < 14; k++) mg.add(G.sph(0.07, 5, 4), mat4(sx + rand(-0.3, 0.3), 0.72 + rand(0, 0.12), sz + rand(-0.3, 0.3)), 0xf8f3e6); // मखाना
    }
    heap(mg, side * 8.2, z + 1.2, 0xf8f3e6, 0.07, 4);
    people.push(makeVillager({ mode: 'weigh', sit: true }), makeVillager({ mode: 'buy', kind: 'woman' }));
  },
  chai(mg, side, z, people) {
    mg.add(G.box(1.6, 0.9, 1.0), mat4(side * 6.6, 0.45, z), 0x8d6e63);
    mg.add(G.cyl(0.25, 0.3, 0.25, 10), mat4(side * 6.6, 1.05, z - 0.2), 0x37474f); // चूल्हा
    mg.add(G.cyl(0.18, 0.2, 0.28, 10), mat4(side * 6.6, 1.32, z - 0.2), 0xb0bec5); // केतली
    for (let i = 0; i < 6; i++) mg.add(G.cyl(0.04, 0.035, 0.1, 6), mat4(side * 6.5 + (i % 3) * 0.12, 0.96, z + 0.25 + Math.floor(i / 3) * 0.12), 0xc68642); // कुल्हड़
    for (const dz of [-1.6, 1.6]) mg.add(G.box(1.6, 0.4, 0.45), mat4(side * 8.2, 0.2, z + dz), 0x6d4c41); // बेंच
    people.push(makeVillager({ mode: 'serve', cloth: 0xf4efe6 }), makeVillager({ mode: 'sit', kind: 'man' }));
  },
};
const ORDER = ['sabzi', 'phal', 'phool', 'machh', 'makhana', 'chai', 'sabzi', 'phal'];
const TARP = [[0x1e5aa8, 0x2a72c9], [0xe67e22, 0xf39c12], [0xc62828, 0xe53935], [0x2e7d32, 0x43a047], [0xf9a825, 0xfdd835]];

export function makeHaat(side, i) {
  const grp = new THREE.Group();
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(40, 20.2), toon(0xc9a77a));
  gnd.rotation.x = -PI / 2; gnd.position.set(side * 24.3, 0.006, 0); gnd.receiveShadow = true;
  grp.add(gnd);
  const mg = new Merge(), cg = new Merge();
  const people = [];
  [-5, 5].forEach((z, k) => {
    const type = ORDER[(i * 2 + k) % ORDER.length];
    const [a, b] = TARP[(i * 2 + k) % TARP.length];
    canopy(cg, side, z, a, b);
    const before = people.length;
    STALLS[type](mg, side, z, people);
    // दुकानदार पीछे बैठा, ख़रीदार सड़क की ओर
    const face = side < 0 ? -PI / 2 : PI / 2;
    people[before].position.set(side * 9.2, 0, z + rand(-0.6, 0.6)); people[before].rotation.y = face;
    if (people[before + 1]) { people[before + 1].position.set(side * 5.6, 0, z + rand(-1.8, 1.8)); people[before + 1].rotation.y = -face + rand(-0.4, 0.4); }
  });
  // पीछे: साइकिल / बैठी गाय / पेड़
  if (i % 3 === 0) { // साइकिल
    for (const dz of [-0.55, 0.55]) mg.add(G.tor(0.33, 0.03, 4, 16), mat4(side * 11.5, 0.36, dz, 0, PI / 2, 0), 0x263238);
    mg.add(G.box(0.05, 0.05, 1.0), mat4(side * 11.5, 0.6, 0, 0.4, 0, 0), 0x1565c0);
    mg.add(G.box(0.05, 0.4, 0.05), mat4(side * 11.5, 0.6, 0.45), 0x1565c0);
    mg.add(G.box(0.5, 0.04, 0.05), mat4(side * 11.5, 0.86, -0.5), 0x263238);
  }
  if (i % 3 === 1) { mg.add(G.cap(0.42, 0.9, 8), mat4(side * 12, 0.42, 1, PI / 2, 0, 0), 0xf4f1ea); mg.add(G.box(0.35, 0.38, 0.45), mat4(side * 12, 0.7, -0.2), 0xf4f1ea); } // बैठी गाय
  mg.add(G.cyl(0.18, 0.24, 2.4, 6), mat4(side * 14.5, 1.2, rand(-6, 6)), 0x6d4c41);
  mg.add(G.sph(1.6, 9, 7), mat4(side * 14.5, 3.2, rand(-6, 6)), pick([0x4f8a3c, 0x5e9a46]));
  grp.add(mg.mesh(0));
  const cm = cg.mesh(0); cm.castShadow = true; grp.add(cm);
  for (const p of people) grp.add(p);
  grp.userData = { type: 'haat', len: 20, noShadow: true, anim: (t, near) => { for (const p of people) { p.visible = near; if (near) p.userData.anim(t); } } };
  return grp;
}

// हाट का स्वागत बैनर (कैनवास पर लिखा)
export function makeHaatGate() {
  const g = new THREE.Group();
  const mg = new Merge();
  for (const s of [-1, 1]) {
    mg.add(G.cyl(0.14, 0.17, 9.4, 7), mat4(s * 4.9, 4.7, 0), C.bamboo);
    for (let i = 0; i < 10; i++) mg.add(G.sph(0.11, 6, 5), mat4(s * (4.9 - 0.75 - i * 0.4), 6.0 - Math.sin(i / 9 * PI) * 0.3, 0.1), i % 2 ? 0xff8f00 : 0xffd54f);
  }
  g.add(mg.mesh(0));
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#2e9b57'); gr.addColorStop(1, '#1b6b3a');
  x.fillStyle = gr; x.fillRect(0, 0, 1024, 256);
  x.strokeStyle = '#ffd23a'; x.lineWidth = 12; x.strokeRect(8, 8, 1008, 240);
  for (let i = 0; i < 34; i++) { x.fillStyle = i % 2 ? '#ffd23a' : '#d3121f'; x.beginPath(); x.moveTo(20 + i * 29.5, 22); x.lineTo(34 + i * 29.5, 40); x.lineTo(49 + i * 29.5, 22); x.fill(); }
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '800 104px "Baloo 2", Mukta, sans-serif'; x.fillText('॥ मिथिला हाट ॥', 512, 122);
  x.fillStyle = '#ffe45c'; x.font = '800 40px "Baloo 2", Mukta, sans-serif'; x.fillText('पग पग पोखरि माछ मखान  •  MITHILA HAAT', 512, 206);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const b = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 2.35), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xf2f2f2, side: THREE.DoubleSide }));
  b.position.set(0, 7.6, 0);
  g.add(b);
  g.userData = { type: 'haatgate' };
  return g;
}

// ---------------- हाट वाली रुकावटें ----------------
export const HAAT_OBST = {
  // सब्ज़ी की टोकरियाँ — कूदो
  tokri() {
    const mg = new Merge();
    for (const x of [-0.62, 0, 0.62]) {
      basket(mg, x, 0, 0.32, 0.5);
      heap(mg, x, 0, pick([0xd62828, 0x7cb342, 0xf5b041, 0xa8456b]), 0.08, 3, 1, 1, 1, 0.1, 0.36);
    }
    const g = new THREE.Group();
    g.add(mg.mesh(0));
    g.userData = { kind: 'low', halfW: 0.95, halfL: 0.38, yMin: 0, yMax: 0.92 };
    return g;
  },
  // भैंस — काली, मुड़े सींग
  bhains() {
    const g = new THREE.Group();
    const inner = new THREE.Group(); g.add(inner);
    const mg = new Merge(), B = 0x2b2a2e;
    mg.add(G.cap(0.52, 1.15, 12), mat4(0, 1.12, 0, PI / 2, 0, 0), B);
    for (const [x, z] of [[-0.28, -0.6], [0.28, -0.6], [-0.28, 0.6], [0.28, 0.6]]) mg.add(G.cyl(0.13, 0.1, 0.85, 8), mat4(x, 0.43, z), B);
    mg.add(G.box(0.46, 0.48, 0.6), mat4(0, 1.32, -1.1, -0.45, 0, 0), B);
    mg.add(G.box(0.38, 0.24, 0.24), mat4(0, 1.12, -1.38, -0.45, 0, 0), 0x4a4548);
    for (const s of [-1, 1]) {
      mg.add(G.tor(0.22, 0.05, 6, 10, PI * 1.1), mat4(0.26 * s, 1.62, -1.0, 0, s > 0 ? 0 : PI, 0.3), 0x8d8478); // मुड़े सींग
      mg.add(G.sph(0.05, 6, 4), mat4(0.17 * s, 1.42, -1.33), 0x111111);
    }
    mg.add(G.cyl(0.03, 0.02, 0.85, 4), mat4(0, 1.0, 1.0, 0.35, 0, 0), B);
    inner.add(mg.mesh(0));
    g.userData = { kind: 'block', halfW: 0.95, halfL: 1.3, yMin: 0, yMax: 1.9, inner };
    return g;
  },
  // बैलगाड़ी — दो बैल, लकड़ी के बड़े पहिए, ऊपर पुआल
  bail() {
    const g = new THREE.Group();
    const mg = new Merge(), OX = 0xeeeae2, W = 0x8a5a34;
    for (const s of [-1, 1]) {
      const x = s * 0.5;
      mg.add(G.cap(0.36, 0.85, 10), mat4(x, 1.0, -1.9, PI / 2, 0, 0), OX);
      mg.add(G.sph(0.24, 8, 6), mat4(x, 1.4, -1.65), OX); // कूबड़
      for (const [dx, dz] of [[-0.15, -2.3], [0.15, -2.3], [-0.15, -1.5], [0.15, -1.5]]) mg.add(G.cyl(0.08, 0.07, 0.75, 6), mat4(x + dx, 0.38, dz), OX);
      mg.add(G.box(0.3, 0.34, 0.45), mat4(x, 1.12, -2.65, -0.4, 0, 0), OX);
      mg.add(G.cone(0.05, 0.35, 5), mat4(x + 0.12 * s, 1.45, -2.55, 0, 0, -0.4 * s), C.sindoor);
      mg.add(G.box(0.36, 0.5, 0.06), mat4(x, 1.05, -1.75), C.sindoor); // झूल
    }
    mg.add(G.box(1.5, 0.1, 0.1), mat4(0, 1.35, -1.55), W); // जुआ
    mg.add(G.box(0.12, 0.1, 1.6), mat4(0, 0.95, -0.9, 0.1, 0, 0), W);
    mg.add(G.box(1.5, 0.12, 2.2), mat4(0, 1.0, 0.8), W); // गाड़ी
    for (const s of [-1, 1]) {
      mg.add(G.tor(0.7, 0.07, 5, 18), mat4(0.82 * s, 0.72, 0.8, 0, PI / 2, 0), 0x5d3b1e);
      for (let k = 0; k < 6; k++) mg.add(G.box(0.05, 1.3, 0.06), mat4(0.82 * s, 0.72, 0.8, k / 6 * PI, 0, 0), 0x6d4626);
    }
    mg.add(G.box(1.5, 0.75, 2.0), mat4(0, 1.45, 0.8, 0, 0, 0), 0xe0c56e); // पुआल
    for (let k = 0; k < 6; k++) mg.add(G.box(1.55, 0.1, 0.12), mat4(0, 1.5 + rand(-0.3, 0.3), 0.0 + k * 0.32, rand(-0.2, 0.2), 0, 0), 0xc9a94e);
    g.add(mg.mesh(0));
    g.userData = { kind: 'block', halfW: 1.0, halfL: 2.9, yMin: 0, yMax: 2.4 };
    return g;
  },
};
