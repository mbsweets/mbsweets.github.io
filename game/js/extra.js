// नई रुकावटें (बकरी, गड्ढा, सूखते कपड़े, बिजली का तार) + पीछा करने वाला बंदर
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge, addOutline } from './art.js';
import { rand, pick } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  cap: (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s),
  cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 16, arc = PI * 2) => new THREE.TorusGeometry(r, t, s, n, arc),
};
function bamboo(mg, x, h, z = 0) {
  mg.add(G.cyl(0.075, 0.085, h, 8), mat4(x, h / 2, z), C.bamboo);
  for (let y = 0.4; y < h; y += 0.55) mg.add(G.cyl(0.09, 0.09, 0.05, 8), mat4(x, y, z), 0x9c7a3c);
}

// एक बकरी (अलग पैर — चलते समय हिलें)
function goat(color) {
  const g = new THREE.Group();
  const body = new Merge();
  body.add(G.cap(0.24, 0.55, 12), mat4(0, 0.62, 0, PI / 2, 0, 0), color);
  body.add(G.box(0.2, 0.24, 0.3), mat4(0, 0.86, -0.5, -0.4, 0, 0), color); // गर्दन-सिर
  body.add(G.box(0.17, 0.17, 0.22), mat4(0, 0.82, -0.68, 0.2, 0, 0), color);
  for (const s of [-1, 1]) {
    body.add(G.cone(0.035, 0.2, 6), mat4(0.06 * s, 1.03, -0.55, -0.6, 0, 0.3 * s), 0x8a7a66); // सींग
    body.add(G.box(0.16, 0.05, 0.08), mat4(0.14 * s, 0.9, -0.55, 0, 0, -0.6 * s), color); // कान
    body.add(G.sph(0.03, 6, 4), mat4(0.075 * s, 0.9, -0.76), 0x1d1210);
  }
  body.add(G.cone(0.04, 0.12, 6), mat4(0, 0.7, -0.78, PI, 0, 0), 0xf4f1ea); // दाढ़ी
  body.add(G.cone(0.05, 0.14, 6), mat4(0, 0.8, 0.42, -2.2, 0, 0), color); // पूँछ
  const bm = body.mesh(0.022);
  g.add(bm);
  const legs = [];
  for (const [x, z] of [[-0.12, -0.25], [0.12, -0.25], [-0.12, 0.25], [0.12, 0.25]]) {
    const pivot = new THREE.Group(); pivot.position.set(x, 0.48, z);
    const lg = new Merge(); lg.add(G.cyl(0.04, 0.035, 0.46, 6), mat4(0, -0.23, 0), color); lg.add(G.cyl(0.04, 0.04, 0.06, 6), mat4(0, -0.46, 0), 0x2a1d14);
    pivot.add(lg.mesh(0.015)); g.add(pivot); legs.push(pivot);
  }
  g.userData.legs = legs;
  return g;
}

export const EXTRA_OBST = {
  // सड़क पार करती बकरियाँ — कूदो (कोई भी लेन)
  goats() {
    const g = new THREE.Group();
    const inner = new THREE.Group(); g.add(inner);
    const cols = [0xf2efe8, 0x3a2a20, 0xb98a5a];
    const gs = [];
    [[-0.55, 0.15], [0.35, -0.25], [0.95, 0.3]].forEach(([x, z], i) => { const a = goat(cols[i % 3]); a.position.set(x, 0, z); a.rotation.y = PI / 2; a.scale.setScalar(1.15 + i * 0.06); inner.add(a); gs.push(a); });
    g.userData = { kind: 'low', halfW: 1.15, halfL: 0.5, yMin: 0, yMax: 1.0, inner,
      dance: (t) => { gs.forEach((a, i) => a.userData.legs.forEach((l, k) => { l.rotation.x = Math.sin(t * 13 + i + (k % 2 ? PI : 0) + (k > 1 ? PI : 0)) * 0.55; })); } };
    return g;
  },
  // सड़क का गड्ढा (पानी भरा) — कूदो, नहीं तो ठोकर
  pothole() {
    const g = new THREE.Group();
    const mg = new Merge();
    mg.add(new THREE.CircleGeometry(1, 22), mat4(0, 0.025, 0, -PI / 2, 0, 0, 0.92, 0.62, 1), 0x3b2a1e);
    mg.add(new THREE.CircleGeometry(1, 22), mat4(0.05, 0.03, 0.02, -PI / 2, 0, 0, 0.7, 0.42, 1), 0x6f8fa6);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * PI * 2; mg.add(G.box(0.22, 0.09, 0.14), mat4(Math.cos(a) * 0.9, 0.05, Math.sin(a) * 0.62, 0, -a + rand(-0.3, 0.3), 0), pick([0xc4643f, 0xa65537, 0x8c7a6a])); }
    g.add(mg.mesh(0.015));
    g.userData = { kind: 'trip', halfW: 0.9, halfL: 0.55, yMin: 0, yMax: 0.35 };
    return g;
  },
  // बाँस पर सूखते कपड़े — लुढ़को
  kapda() {
    const g = new THREE.Group();
    const mg = new Merge();
    for (const s of [-1, 1]) bamboo(mg, 1.05 * s, 3.0);
    mg.add(G.cyl(0.02, 0.02, 2.2, 5), mat4(0, 2.55, 0, 0, 0, PI / 2), 0xd9cdb0);
    const cl = [[C.sindoor, 0.62, 0.9], [0x2f6fb6, 0.48, 0.75], [C.haldi, 0.55, 1.0], [0xffffff, 0.42, 0.7], [C.pink, 0.5, 0.85]];
    let x = -0.92;
    for (const [col, w, h] of cl) {
      if (x + w > 0.95) break;
      mg.add(G.box(w, h, 0.03), mat4(x + w / 2, 2.55 - h / 2, 0), col);
      mg.add(G.box(w * 0.98, 0.06, 0.035), mat4(x + w / 2, 2.55 - h + 0.06, 0), 0xffe08a);
      mg.add(G.box(0.05, 0.1, 0.05), mat4(x + 0.06, 2.56, 0), 0x8a5a34); // चिमटी
      x += w + 0.05;
    }
    g.add(mg.mesh(0.022));
    const cloth = g.children[0];
    g.userData = { kind: 'high', halfW: 1.05, halfL: 0.2, yMin: 1.2, yMax: 3.3, dance: (t) => { cloth.rotation.x = Math.sin(t * 2.4) * 0.05; } };
    return g;
  },
  // झुका बिजली का तार (गौरैया बैठी) — लुढ़को
  taar() {
    const g = new THREE.Group();
    const mg = new Merge();
    for (const s of [-1, 1]) { mg.add(G.cyl(0.08, 0.1, 3.4, 8), mat4(1.05 * s, 1.7, 0), 0x8f8f8f); mg.add(G.box(0.5, 0.06, 0.06), mat4(1.05 * s, 3.25, 0), 0x6e6e6e); }
    // झूलता तार: कई छोटे टुकड़े
    for (const yy of [0, 0.32]) {
      const N = 12;
      for (let i = 0; i < N; i++) {
        const t0 = i / N, t1 = (i + 1) / N;
        const xa = -1.05 + 2.1 * t0, xb = -1.05 + 2.1 * t1;
        const ya = 2.0 + yy - 0.55 * 4 * t0 * (1 - t0), yb = 2.0 + yy - 0.55 * 4 * t1 * (1 - t1);
        const len = Math.hypot(xb - xa, yb - ya);
        mg.add(G.cyl(0.025, 0.025, len, 5), mat4((xa + xb) / 2, (ya + yb) / 2, 0, 0, 0, PI / 2 + Math.atan2(yb - ya, xb - xa)), 0x1d1d1d);
      }
    }
    // गौरैया
    for (const bx of [-0.45, 0.2, 0.55]) {
      const t = (bx + 1.05) / 2.1, by = 2.32 - 0.55 * 4 * t * (1 - t) + 0.08;
      mg.add(G.sph(0.08, 8, 6), mat4(bx, by, 0, 0, 0, 0, 1, 0.9, 1.3), 0x8a6a4a);
      mg.add(G.sph(0.05, 8, 6), mat4(bx, by + 0.08, -0.08), 0x6a4a32);
      mg.add(G.cone(0.02, 0.05, 5), mat4(bx, by + 0.08, -0.14, -PI / 2, 0, 0), C.haldi);
    }
    // "ख़तरा" पीली पट्टी
    mg.add(G.box(1.2, 0.18, 0.04), mat4(0, 1.62, 0), C.haldi);
    for (let i = 0; i < 6; i++) mg.add(G.box(0.08, 0.2, 0.045), mat4(-0.5 + i * 0.2, 1.62, 0, 0, 0, 0.6), 0x1d1d1d);
    g.add(mg.mesh(0.018));
    g.userData = { kind: 'high', halfW: 1.05, halfL: 0.2, yMin: 1.2, yMax: 3.3 };
    return g;
  },
};

// ======================= बंदर =======================
// हड्डियों वाली गुड़िया जैसा: सिर, धड़, हाथ-पैर, लंबी पूँछ; दौड़ना, उछलना, मिठाई की पोटली
export function makeMonkey() {
  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const FUR = 0x9a6a3c, FACE = 0xe8b48a, DARK = 0x2a1a10;
  const m = toon(0xffffff, { vc: true });
  const piece = (mg, th = 0.02) => { const me = new THREE.Mesh(mg.build(), m); addOutline(me, th); return me; };
  const torso = new Merge();
  torso.add(G.cap(0.26, 0.32, 12), mat4(0, 0, 0), FUR);
  torso.add(G.sph(0.2, 12, 10), mat4(0, -0.02, 0.12, 0, 0, 0, 0.9, 1.1, 0.6), 0xd9a878); // पेट
  const tor = piece(torso); tor.position.y = 0.95; body.add(tor);
  // सिर
  const head = new THREE.Group(); head.position.set(0, 1.42, 0.02); body.add(head);
  const hm = new Merge();
  hm.add(G.sph(0.27, 16, 12), mat4(0, 0, 0), FUR);
  hm.add(G.sph(0.2, 14, 10), mat4(0, -0.03, 0.12, 0, 0, 0, 1.05, 0.95, 0.85), FACE); // चेहरा
  hm.add(G.sph(0.11, 12, 8), mat4(0, -0.1, 0.24, 0, 0, 0, 1.25, 0.8, 0.9), FACE); // थूथन
  for (const s of [-1, 1]) {
    hm.add(G.sph(0.1, 12, 8), mat4(0.27 * s, 0.03, -0.02, 0, 0, 0, 0.5, 1, 1), FACE); // कान
    hm.add(G.sph(0.055, 10, 8), mat4(0.075 * s, 0.04, 0.27), 0xffffff);
    hm.add(G.sph(0.032, 8, 6), mat4(0.075 * s, 0.04, 0.315), DARK);
    hm.add(G.box(0.1, 0.025, 0.02), mat4(0.08 * s, 0.13, 0.25, 0, 0, -0.35 * s), DARK); // भौंह (शरारती)
  }
  hm.add(G.sph(0.018, 6, 4), mat4(-0.025, -0.07, 0.34), DARK); hm.add(G.sph(0.018, 6, 4), mat4(0.025, -0.07, 0.34), DARK);
  hm.add(G.tor(0.06, 0.014, 6, 12, PI), mat4(0, -0.14, 0.31, PI, 0, 0), 0x8a2a1a); // मुस्कान
  head.add(piece(hm, 0.022));
  // हाथ-पैर (कंधे/कूल्हे पर घूमें)
  const limb = (x, y, len, col, paw) => {
    const p = new THREE.Group(); p.position.set(x, y, 0);
    const lm = new Merge(); lm.add(G.cap(0.075, len, 8), mat4(0, -len / 2 - 0.04, 0), col); lm.add(G.sph(0.085, 8, 6), mat4(0, -len - 0.1, 0.02), paw);
    p.add(piece(lm, 0.016)); body.add(p); return p;
  };
  const armR = limb(-0.27, 1.12, 0.42, FUR, FACE), armL = limb(0.27, 1.12, 0.42, FUR, FACE);
  const legR = limb(-0.15, 0.72, 0.36, FUR, FACE), legL = limb(0.15, 0.72, 0.36, FUR, FACE);
  // पूँछ — कई टुकड़े, लहराए
  const tail = []; let par = body;
  for (let i = 0; i < 8; i++) {
    const s = new THREE.Group(); s.position.set(0, i ? 0.13 : 0.82, i ? 0 : -0.22);
    const tm = new Merge(); tm.add(G.cyl(0.04 - i * 0.003, 0.045 - i * 0.003, 0.15, 6), mat4(0, 0.065, 0), FUR);
    s.add(piece(tm, 0.012)); par.add(s); tail.push(s); par = s;
  }
  // चुराई मिठाई की पोटली (लाल गमछा)
  const bag = new THREE.Group();
  const bm = new Merge(); bm.add(G.sph(0.2, 12, 10), mat4(0, 0, 0, 0, 0, 0, 1, 0.85, 1), C.sindoor);
  bm.add(G.cone(0.08, 0.14, 8), mat4(0, 0.2, 0), C.sindoor); bm.add(G.tor(0.05, 0.015, 6, 10), mat4(0, 0.14, 0, PI / 2), 0xffffff);
  for (let i = 0; i < 4; i++) bm.add(G.sph(0.06, 8, 6), mat4(rand(-0.1, 0.1), 0.12, rand(-0.1, 0.1)), 0xfff6e8);
  bag.add(piece(bm, 0.015)); bag.position.set(0, -0.55, 0.05); armL.add(bag); bag.visible = false;
  root.userData = { body, head, armR, armL, legR, legL, tail, bag, ph: 0 };
  root.scale.setScalar(0.95);
  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return root;
}
// mode: 'run' | 'leap' | 'grab' | 'flee' | 'sit'
export function animMonkey(mk, dt, mode, speed = 16) {
  const u = mk.userData;
  u.ph += dt * (mode === 'run' || mode === 'flee' ? 9 + speed * 0.25 : 5);
  const s = Math.sin(u.ph), c = Math.cos(u.ph);
  if (mode === 'run' || mode === 'flee') { // चारों पैरों से उछलकर दौड़ (बंदर जैसा)
    u.body.rotation.x = 0.5 + 0.12 * s; u.body.position.y = Math.abs(s) * 0.25 - 0.3;
    u.armR.rotation.x = -1.1 + 0.9 * s; u.armL.rotation.x = -1.1 + 0.9 * s;
    u.legR.rotation.x = 0.4 - 0.9 * s; u.legL.rotation.x = 0.4 - 0.9 * s;
    u.head.rotation.x = -0.45 + 0.06 * c; u.head.rotation.z = 0.08 * s;
  } else if (mode === 'leap') {
    u.body.rotation.x = 0.2; u.body.position.y = 0; u.armR.rotation.x = -2.6; u.armL.rotation.x = -2.6; u.legR.rotation.x = 0.9; u.legL.rotation.x = 0.9; u.head.rotation.x = -0.2;
  } else if (mode === 'grab') {
    u.body.rotation.x = 0.1; u.armR.rotation.x = -1.6 + 0.6 * s; u.armL.rotation.x = -1.6 - 0.6 * s; u.head.rotation.z = 0.25 * s;
  } else { // sit / हँसना
    u.body.rotation.x = 0; u.body.position.y = -0.35; u.armR.rotation.x = -0.3 + 0.5 * Math.abs(s); u.armL.rotation.x = -0.3; u.legR.rotation.x = -1.3; u.legL.rotation.x = -1.3; u.head.rotation.z = 0.2 * s;
  }
  u.tail.forEach((t, i) => { t.rotation.x = (i ? 0.28 : -0.9) + Math.sin(u.ph * 0.8 + i * 0.7) * 0.18; t.rotation.z = Math.sin(u.ph * 0.6 + i * 0.5) * 0.12; });
}
