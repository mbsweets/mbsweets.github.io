// बीच-बीच की अनोखी चीज़ें: बिहारी बारात (बैंड-बाजा, पेट्रोमैक्स, घोड़ी पर दूल्हा) और मेला (बड़ा झूला, तंबू, गुब्बारे)
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge } from './art.js';
import { rand, pick } from './util.js';
import { makeVillager } from './haat.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s),
  cap: (r, l, s = 8) => new THREE.CapsuleGeometry(r, l, 3, s),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, a = 6, b = 14, arc = PI * 2) => new THREE.TorusGeometry(r, t, a, b, arc),
};
const glowMat = () => new THREE.MeshBasicMaterial({ color: 0xfff1b8, toneMapped: false });

// बैंड वाला (लाल कोट, सुनहरी पट्टी) — instr: trumpet | dhol | lamp
function bandsman(instr) {
  const g = new THREE.Group();
  const mg = new Merge(), RED = 0xc62828, GOLD = 0xf2c14e, skin = pick([0xc98a5e, 0xb5754d, 0xd9a07a]);
  for (const x of [-0.12, 0.12]) { mg.add(G.cap(0.1, 0.45, 6), mat4(x, 0.37, 0), 0xf4efe6); mg.add(G.box(0.12, 0.06, 0.25), mat4(x, 0.03, -0.05), 0x1b1210); }
  mg.add(G.cap(0.26, 0.45, 8), mat4(0, 1.0, 0), RED);
  mg.add(G.box(0.08, 0.7, 0.04), mat4(0.05, 1.05, -0.25, 0, 0, 0.6), GOLD);
  for (let i = 0; i < 4; i++) mg.add(G.sph(0.025, 4, 3), mat4(-0.04, 0.82 + i * 0.13, -0.26), GOLD);
  mg.add(G.sph(0.2, 10, 8), mat4(0, 1.55, 0), skin);
  mg.add(G.cyl(0.2, 0.22, 0.24, 10), mat4(0, 1.78, 0), RED); mg.add(G.cyl(0.215, 0.215, 0.06, 10), mat4(0, 1.7, 0), GOLD);
  mg.add(G.box(0.18, 0.03, 0.05), mat4(0, 1.5, -0.19), 0x1b1210);
  if (instr === 'trumpet') {
    for (const s of [-1, 1]) mg.add(G.cap(0.06, 0.32, 6), mat4(0.17 * s, 1.25, -0.2, 1.2, 0, -0.3 * s), RED);
    mg.add(G.cyl(0.03, 0.03, 0.5, 6), mat4(0, 1.42, -0.45, PI / 2 - 0.25, 0, 0), GOLD);
    mg.add(G.cone(0.13, 0.22, 10, ), mat4(0, 1.36, -0.75, -PI / 2 - 0.25, 0, 0), GOLD);
  } else if (instr === 'dhol') {
    mg.add(G.cyl(0.26, 0.26, 0.55, 12), mat4(0, 0.98, -0.32, 0, 0, PI / 2), 0x8d3b1f);
    for (const s of [-1, 1]) mg.add(G.cyl(0.27, 0.27, 0.03, 12), mat4(0.28 * s, 0.98, -0.32, 0, 0, PI / 2), 0xf4e6c8);
    for (const s of [-1, 1]) mg.add(G.cap(0.06, 0.3, 6), mat4(0.3 * s, 1.1, -0.15, 0.8, 0, -0.6 * s), RED);
  } else {
    for (const s of [-1, 1]) mg.add(G.cap(0.06, 0.4, 6), mat4(0.2 * s, 1.75, 0, 0, 0, 2.8 * s), RED);
    mg.add(G.cyl(0.12, 0.16, 0.12, 8), mat4(0, 2.0, 0), 0x9e9e9e);
  }
  g.add(mg.mesh(0));
  if (instr === 'lamp') { // पेट्रोमैक्स — रात में चमके
    const l = new THREE.Mesh(G.sph(0.17, 10, 8), glowMat()); l.position.set(0, 2.2, 0); l.scale.y = 1.25; g.add(l);
    const cap = new THREE.Mesh(G.cone(0.16, 0.14, 8), toon(0x9e9e9e)); cap.position.set(0, 2.47, 0); g.add(cap);
  }
  return g;
}

export const EVENT_OBST = {
  // बैंड-बाजा: 2×3 लोग, नाचते-बजाते (एक लेन)
  band() {
    const g = new THREE.Group();
    const inner = new THREE.Group(); g.add(inner);
    const ms = [];
    const lay = [['trumpet', -0.48, -1.5], ['trumpet', 0.48, -1.5], ['dhol', -0.48, 0], ['dhol', 0.48, 0], ['lamp', -0.48, 1.5], ['lamp', 0.48, 1.5]];
    for (const [ins, x, z] of lay) { const b = bandsman(ins); b.position.set(x, 0, z); inner.add(b); ms.push({ b, ph: rand(0, 6) }); }
    g.userData = {
      kind: 'block', halfW: 0.95, halfL: 2.0, yMin: 0, yMax: 2.4, inner,
      dance: (t) => { for (const m of ms) { m.b.position.y = Math.abs(Math.sin(t * 7 + m.ph)) * 0.16; m.b.rotation.y = Math.sin(t * 3.5 + m.ph) * 0.35; m.b.rotation.z = Math.sin(t * 7 + m.ph) * 0.06; } },
    };
    return g;
  },
  // घोड़ी पर दूल्हा (सेहरा, साफ़ा, शेरवानी)
  ghodi() {
    const g = new THREE.Group();
    const inner = new THREE.Group(); g.add(inner);
    const mg = new Merge(), W = 0xf5f2ec, RED = 0xb71c1c, GOLD = 0xf2c14e;
    mg.add(G.cap(0.42, 1.1, 10), mat4(0, 1.25, 0, PI / 2, 0, 0), W);
    for (const [x, z] of [[-0.2, -0.6], [0.2, -0.6], [-0.2, 0.6], [0.2, 0.6]]) { mg.add(G.cyl(0.08, 0.07, 1.0, 6), mat4(x, 0.5, z), W); mg.add(G.cyl(0.085, 0.085, 0.1, 6), mat4(x, 0.05, z), 0x3e2723); }
    mg.add(G.cap(0.2, 0.55, 8), mat4(0, 1.75, -0.9, -0.7, 0, 0), W);
    mg.add(G.box(0.24, 0.26, 0.55), mat4(0, 2.05, -1.25, -0.25, 0, 0), W);
    for (const s of [-1, 1]) mg.add(G.cone(0.05, 0.16, 5), mat4(0.08 * s, 2.25, -1.08), W);
    mg.add(G.cone(0.08, 0.4, 6), mat4(0, 2.45, -1.0), 0xd81b60); // कलगी
    mg.add(G.box(0.95, 0.75, 1.35), mat4(0, 1.3, 0.05), RED); // झूल
    for (let i = 0; i < 9; i++) mg.add(G.sph(0.05, 4, 3), mat4(-0.48, 0.95, -0.6 + i * 0.15), GOLD), mg.add(G.sph(0.05, 4, 3), mat4(0.48, 0.95, -0.6 + i * 0.15), GOLD);
    mg.add(G.cyl(0.04, 0.03, 0.9, 5), mat4(0, 1.1, 0.95, 0.5, 0, 0), 0xe0dcd4);
    // दूल्हा
    mg.add(G.cap(0.25, 0.45, 8), mat4(0, 2.15, 0.1), 0xf3e5c0);
    for (const s of [-1, 1]) mg.add(G.cap(0.09, 0.4, 6), mat4(0.26 * s, 1.75, -0.05, 0.3, 0, 0.5 * s), 0xf3e5c0);
    mg.add(G.box(0.05, 0.6, 0.04), mat4(0, 2.2, -0.24, 0, 0, 0.5), GOLD);
    mg.add(G.sph(0.2, 10, 8), mat4(0, 2.68, 0.1), 0xd9a07a);
    mg.add(G.cyl(0.22, 0.24, 0.26, 12), mat4(0, 2.92, 0.1), RED); mg.add(G.cone(0.08, 0.25, 6), mat4(0.1, 3.12, 0.12), GOLD);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; mg.add(G.box(0.02, 0.36, 0.02), mat4(Math.cos(a) * 0.22, 2.64, 0.1 + Math.sin(a) * 0.22), GOLD); } // सेहरा
    inner.add(mg.mesh(0));
    g.userData = { kind: 'block', halfW: 0.9, halfL: 1.45, yMin: 0, yMax: 3.0, inner, dance: (t) => { inner.position.y = Math.abs(Math.sin(t * 4)) * 0.08; inner.rotation.x = Math.sin(t * 4) * 0.03; } };
    return g;
  },
};

// ---------------- मेला ----------------
export function makeMela(side, i) {
  const grp = new THREE.Group();
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(40, 20.2), toon(0xcfb07e));
  gnd.rotation.x = -PI / 2; gnd.position.set(side * 24.3, 0.006, 0); gnd.receiveShadow = true;
  grp.add(gnd);
  const mg = new Merge();
  const anims = [];
  if (i % 2 === 0) { // बड़ा झूला
    const R = 6.2, cx = side * 15, cy = R + 1.4;
    for (const dz of [-1.2, 1.2]) for (const s of [-1, 1]) mg.add(G.box(0.25, cy + 0.6, 0.25), mat4(cx, cy / 2, dz + s * 2.6, s * -0.38 * (dz > 0 ? 1 : 1), 0, 0), 0x455a64);
    const wheel = new THREE.Group(); wheel.position.set(cx, cy, 0);
    const wm = new Merge();
    for (const dx of [-0.6, 0.6]) {
      wm.add(G.tor(R, 0.09, 6, 48), mat4(dx, 0, 0, 0, PI / 2, 0), 0xe53935);
      for (let k = 0; k < 12; k++) wm.add(G.box(0.06, R * 2, 0.06), mat4(dx, 0, 0, k / 12 * PI, 0, 0), 0xeceff1);
      for (let k = 0; k < 24; k++) { const a = k / 24 * PI * 2; wm.add(G.sph(0.11, 5, 4), mat4(dx, Math.cos(a) * R, Math.sin(a) * R), [0xffeb3b, 0xff5252, 0x69f0ae, 0x40c4ff][k % 4]); }
    }
    wheel.add(new THREE.Mesh(wm.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
    const cabs = new THREE.InstancedMesh(G.box(1.0, 0.9, 1.0), toon(0xffffff), 12);
    const cc = [0xe53935, 0x1e88e5, 0xfdd835, 0x43a047, 0x8e24aa, 0xfb8c00], col = new THREE.Color();
    for (let k = 0; k < 12; k++) cabs.setColorAt(k, col.setHex(cc[k % cc.length]));
    grp.add(wheel); grp.add(cabs);
    const m4 = new THREE.Matrix4();
    anims.push((t) => {
      const a0 = t * 0.35;
      wheel.rotation.x = a0;
      for (let k = 0; k < 12; k++) { const a = a0 + k / 12 * PI * 2; m4.makeTranslation(cx, cy + Math.cos(a) * R - 0.55, Math.sin(a) * R); cabs.setMatrixAt(k, m4); }
      cabs.instanceMatrix.needsUpdate = true;
    });
  } else { // तंबू + गुब्बारे वाला + झूला
    for (const [z, c1, c2] of [[-5, 0xe53935, 0xffffff], [4, 0x1e88e5, 0xfdd835]]) {
      for (let k = 0; k < 8; k++) mg.add(new THREE.ConeGeometry(2.6, 2.4, 8, 1, true, k / 8 * PI * 2, PI / 4), mat4(side * 11, 4.0, z), k % 2 ? c1 : c2);
      mg.add(G.cyl(2.5, 2.5, 2.8, 16, ), mat4(side * 11, 1.4, z), c2);
      mg.add(G.cone(0.1, 0.8, 4), mat4(side * 11, 5.6, z), 0xffd54f);
    }
    const bal = new Merge();
    for (let k = 0; k < 14; k++) { const a = k * 2.4, r = 0.3 + (k % 3) * 0.2; bal.add(G.sph(0.24, 8, 6), mat4(Math.cos(a) * r, 2.6 + (k % 4) * 0.3, Math.sin(a) * r, 0, 0, 0, 1, 1.2, 1), pick([0xff5252, 0xffeb3b, 0x69f0ae, 0x40c4ff, 0xe040fb, 0xff9100])); bal.add(G.cyl(0.006, 0.006, 1.4, 3), mat4(Math.cos(a) * r * 0.5, 1.8, Math.sin(a) * r * 0.5), 0xdddddd); }
    const bm = new THREE.Mesh(bal.build(), toon(0xffffff, { vc: true, r: 0.35 }));
    bm.position.set(side * 6.3, 0, -0.5); grp.add(bm);
    const seller = makeVillager({ mode: 'call', kind: 'man' });
    seller.position.set(side * 6.6, 0, 0.3); seller.rotation.y = side < 0 ? -PI / 2 : PI / 2; grp.add(seller);
    const kid = makeVillager({ mode: 'buy', kind: 'kid' }); kid.position.set(side * 5.6, 0, 0.8); kid.rotation.y = side < 0 ? PI / 2 : -PI / 2; grp.add(kid);
    anims.push((t) => { bm.rotation.y = Math.sin(t * 0.8) * 0.15; bm.position.y = Math.sin(t * 1.3) * 0.08; seller.userData.anim(t); kid.userData.anim(t); });
  }
  // झंडियाँ
  for (let k = 0; k < 14; k++) mg.add(G.cone(0.18, 0.35, 3), mat4(side * 5.4, 5.2 - Math.sin(k / 13 * PI) * 0.5, -9 + k * 1.4, PI, 0, 0), [0xe53935, 0xfdd835, 0x43a047, 0x1e88e5][k % 4]);
  mg.add(G.cyl(0.07, 0.07, 5.6, 5), mat4(side * 5.4, 2.8, -9.5), C.bamboo); mg.add(G.cyl(0.07, 0.07, 5.6, 5), mat4(side * 5.4, 2.8, 9.5), C.bamboo);
  if (!mg.empty) { const m = mg.mesh(0); m.castShadow = true; grp.add(m); }
  grp.userData = { type: 'mela', len: 20, noShadow: true, anim: (t) => { for (const a of anims) a(t); } };
  return grp;
}

export function makeMelaGate() {
  const g = new THREE.Group();
  const mg = new Merge();
  for (const s of [-1, 1]) {
    mg.add(G.cyl(0.16, 0.2, 9.6, 8), mat4(s * 4.9, 4.8, 0), 0xe53935);
    for (let y = 0.6; y < 9; y += 0.8) mg.add(G.tor(0.21, 0.05, 4, 10), mat4(s * 4.9, y, 0, PI / 2), 0xfdd835);
    mg.add(G.sph(0.35, 10, 8), mat4(s * 4.9, 9.8, 0), 0xfdd835);
  }
  g.add(mg.mesh(0));
  const c = document.createElement('canvas'); c.width = 1024; c.height = 256;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 1024, 0); gr.addColorStop(0, '#8e24aa'); gr.addColorStop(0.5, '#d81b60'); gr.addColorStop(1, '#ff6f00');
  x.fillStyle = gr; x.fillRect(0, 0, 1024, 256);
  x.strokeStyle = '#ffeb3b'; x.lineWidth = 12; x.strokeRect(8, 8, 1008, 240);
  for (let i = 0; i < 40; i++) { x.fillStyle = ['#ffeb3b', '#69f0ae', '#40c4ff', '#ffffff'][i % 4]; x.beginPath(); x.arc(28 + i * 25.4, 28, 6, 0, PI * 2); x.fill(); x.beginPath(); x.arc(28 + i * 25.4, 228, 6, 0, PI * 2); x.fill(); }
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = '800 100px "Baloo 2", Mukta, sans-serif'; x.fillText('॥ मेला ॥  MELA', 512, 118);
  x.fillStyle = '#ffeb3b'; x.font = '800 38px "Baloo 2", Mukta, sans-serif'; x.fillText('मिठाई ही मिठाई  •  SWEETS BONUS!', 512, 195);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const b = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 2.35), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: 0xf2f2f2, side: THREE.DoubleSide }));
  b.position.set(0, 8.0, 0);
  g.add(b);
  g.userData = { type: 'melagate' };
  return g;
}
