// गेम की सारी चीज़ें — गोलू, मिठाइयाँ, रुकावटें, मकान, MB Sweets की दुकान, स्वागत द्वार, मधुमक्खियाँ
import * as THREE from './three.module.min.js';
import { TEX, C, GRAD, tile, repeatTex, toon, basic, addOutline, outlineMat, mat4, Merge, MergeUV, OUTLINES, signMat, SIGN_EDGE } from './art.js';
import { RT } from './real.js';
import { makeVillager, HAAT_OBST } from './haat.js';
import { EVENT_OBST } from './events.js';
import { RAIL_OBST } from './rail.js';
import { EXTRA_OBST } from './extra.js';
import { rand, pick, chance } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 16, h = 12) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s),
  cap: (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s),
  cone: (r, h, s = 12) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 8, n = 20, arc = PI * 2) => new THREE.TorusGeometry(r, t, s, n, arc),
};
function part(geo, mat, th, parent, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (th) addOutline(m, th);
  if (parent) parent.add(m);
  return m;
}
function boxOutline(mesh, w, h, d, t = 0.05) {
  const o = new THREE.Mesh(mesh.geometry, outlineBack);
  o.scale.set((w + 2 * t) / w, (h + 2 * t) / h, (d + 2 * t) / d);
  mesh.add(o);
  return mesh;
}
const outlineBack = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide, visible: OUTLINES });

// ======================= गोलू =======================
export class Golu {
  constructor() {
    const m = this.m = {
      kurta: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tile('props', 4, 4, 2), roughness: 0.82 }),
      paag: new THREE.MeshStandardMaterial({ color: 0xffffff, map: tile('props', 4, 4, 10), roughness: 0.82 }),
      vc: new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.82 }),
      cheek: toon(0xf08a8a), mouth: toon(0x7a1a1a), maroon: toon(C.maroon),
      box: toon(0xffffff, { map: tile('props', 4, 4, 5) }),
    };
    this.glowMats = [m.kurta, m.paag, m.vc];
    const SKIN = C.skin, HAIR = 0x231815, BLACK = 0x1d1210, WHITE = 0xffffff, SLEEVE = 0xf7b733, PYJ = 0xf6f0e4, SHOE = 0xc0392b, GOLD = C.gold, RED = 0xd1261c;
    const vcMesh = (mg, th) => { const me = new THREE.Mesh(mg.build(), m.vc); if (th) addOutline(me, th); return me; };
    const root = this.root = new THREE.Group();
    const body = this.body = new THREE.Group();
    body.position.y = 0.86;
    root.add(body);
    // धड़ (मोटा पेट) — kurta
    const tp = [[0.001, -0.46], [0.34, -0.45], [0.45, -0.35], [0.51, -0.15], [0.54, 0.05], [0.51, 0.25], [0.41, 0.43], [0.23, 0.55], [0.001, 0.58]]
      .map((a) => new THREE.Vector2(a[0], a[1]));
    this.torso = part(new THREE.LatheGeometry(tp, 30), m.kurta, 0.03, body);
    // पैर (पैजामा + लाल जूती) — हर पैर एक ड्रॉ
    this.legs = [];
    const footG = G.sph(0.13, 12, 8); footG.scale(0.95, 0.62, 1.4);
    for (const s of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0.2 * s, -0.36, 0);
      body.add(hip);
      const mg = new Merge();
      mg.add(G.cap(0.135, 0.18), mat4(0, -0.2, 0), PYJ);
      mg.add(footG, mat4(0, -0.42, -0.07), SHOE);
      hip.add(vcMesh(mg, 0.022));
      this.legs.push(hip);
    }
    // हाथ
    this.arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(0.47 * s, 0.24, 0);
      sh.rotation.z = 0.35 * s;
      body.add(sh);
      const mg = new Merge();
      mg.add(G.cap(0.105, 0.2), mat4(0, -0.18, 0), SLEEVE);
      mg.add(G.sph(0.115, 12, 10), mat4(0, -0.38, 0), SKIN);
      sh.add(vcMesh(mg, 0.02));
      this.arms.push(sh);
    }
    // पीठ पर MB Sweets का डिब्बा (पीछे वाले हिस्से पर असली डिब्बे का डिज़ाइन)
    const bg = G.box(0.56, 0.44, 0.22);
    bg.clearGroups(); bg.addGroup(0, 24, 0); bg.addGroup(24, 6, 1); bg.addGroup(30, 6, 0);
    const bx = new THREE.Mesh(bg, [m.maroon, m.box]);
    bx.position.set(0, 0.1, 0.56);
    bx.rotation.x = -0.12;
    boxOutline(bx, 0.56, 0.44, 0.22, 0.025);
    body.add(bx);
    const st = new Merge();
    for (const s of [-1, 1]) st.add(G.box(0.07, 0.5, 0.05), mat4(0.17 * s, 0.32, 0.43, -0.45, 0, 0), RED);
    body.add(new THREE.Mesh(st.build(), m.vc));
    // सिर — एक ड्रॉ में (आँख, भौं, नाक, कान, बाल, टीका)
    const head = this.head = new THREE.Group();
    head.position.set(0, 0.86, 0);
    body.add(head);
    const hm = new Merge(), ho = new Merge();
    const headG = G.sph(0.37, 24, 18);
    hm.add(headG, mat4(), SKIN); ho.add(headG, mat4(), 0);
    hm.add(new THREE.SphereGeometry(0.378, 20, 10, 0, PI, 0.3 * PI, 0.42 * PI), mat4(), HAIR);
    const earG = G.sph(0.075, 10, 8), ewG = G.sph(0.095, 12, 10), noseG = G.sph(0.062, 10, 8);
    for (const s of [-1, 1]) {
      hm.add(earG, mat4(0.36 * s, -0.01, 0.02), SKIN); ho.add(earG, mat4(0.36 * s, -0.01, 0.02), 0);
      const ew = mat4(0.135 * s, 0.05, -0.31, 0, 0, 0, 1, 1.18, 0.6);
      hm.add(ewG, ew, WHITE); ho.add(ewG, ew, 0);
      hm.add(G.sph(0.052, 10, 8), mat4(0.128 * s, 0.035, -0.365), BLACK);
      hm.add(G.sph(0.017, 6, 6), mat4(0.112 * s, 0.065, -0.405), WHITE);
      hm.add(G.cap(0.018, 0.09, 6), mat4(0.14 * s, 0.175, -0.33, 0, 0, PI / 2 - 0.25 * s), BLACK);
    }
    hm.add(noseG, mat4(0, -0.025, -0.37), SKIN); ho.add(noseG, mat4(0, -0.025, -0.37), 0);
    hm.add(G.cap(0.017, 0.05, 6), mat4(0, 0.2, -0.352), RED);
    head.add(new THREE.Mesh(hm.build(), m.vc));
    head.add(new THREE.Mesh(ho.build(), outlineMat(0.024)));
    for (const s of [-1, 1]) {
      const ch = part(G.sph(0.09, 10, 8), m.cheek, 0, head, 0.22 * s, -0.08, -0.265);
      ch.scale.set(1, 0.8, 0.55);
      this['cheek' + s] = ch;
    }
    const smile = this.smile = part(G.tor(0.075, 0.022, 6, 14, PI), m.mouth, 0, head, 0, -0.13, -0.34);
    smile.rotation.z = PI;
    const mo = this.mouthOpen = part(G.sph(0.075, 12, 10), m.mouth, 0, head, 0, -0.15, -0.33);
    mo.scale.set(1.2, 0.01, 0.5);
    // मिथिला पाग
    const paag = this.paag = new THREE.Group();
    paag.position.set(0, 0.07, 0);
    head.add(paag);
    const cap = part(new THREE.SphereGeometry(0.405, 26, 12, 0, PI * 2, 0, 0.5 * PI), m.paag, 0.022, paag);
    cap.scale.set(1, 0.72, 1.05);
    const pm = new Merge();
    pm.add(G.tor(0.405, 0.04, 8, 30), mat4(0, 0, 0, PI / 2), GOLD);
    const crestM = mat4(0, 0.12, -0.17, -0.45, 0, 0);
    pm.add(G.tor(0.27, 0.08, 10, 26, PI), crestM, RED);
    pm.add(G.tor(0.27, 0.03, 6, 26, PI), crestM.clone().multiply(mat4(0, 0, 0.06)), GOLD);
    pm.add(G.sph(0.065, 10, 8), mat4(0, 0.4, -0.27), GOLD);
    paag.add(vcMesh(pm, 0.018));
    // छाया
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), basic(0x000000, { op: 0.28 }));
    this.shadow.rotation.x = -PI / 2;
    this.shadow.position.y = 0.02;
    root.add(this.shadow);
    // लड्डू कवच (आभा)
    this.aura = new THREE.Mesh(G.sph(1.25, 24, 18), basic(0xffb23c, { op: 0.22, add: true }));
    this.aura.position.y = 0.95;
    this.aura.visible = false;
    root.add(this.aura);
    this.phase = 0; this.spin = 0; this.eatT = 0; this.scale = 1; this.glow = 0;
  }
  setGlow(v) {
    if (Math.abs(v - this.glow) < 0.01) return;
    this.glow = v;
    for (const mt of this.glowMats) mt.emissive.setRGB(0.55 * v, 0.28 * v, 0.02 * v);
  }
  eat() { this.eatT = 0.16; }
  // mode: idle | dance | run | jump | roll | stumble | dead
  update(dt, mode, o = {}) {
    const D = (cur, tgt, k = 14) => cur + (tgt - cur) * (1 - Math.exp(-k * dt));
    const sp = o.speed || 14;
    this.phase += dt * (mode === 'run' || mode === 'stumble' ? 8.5 + sp * 0.3 : mode === 'dance' ? 7 : 4);
    const ph = this.phase, s = Math.sin(ph), c = Math.cos(ph);
    const L = this.legs, A = this.arms, b = this.body, h = this.head;
    let lx0 = 0, lx1 = 0, ax0 = 0, ax1 = 0, az0 = -0.35, az1 = 0.35, by = 0.86, brx = 0, brz = 0, hz = 0, hx = 0, tsy = 1;
    if (mode === 'run' || mode === 'stumble') {
      lx0 = s * 1.0; lx1 = -s * 1.0; ax0 = -s * 0.95; ax1 = s * 0.95;
      by = 0.86 + Math.abs(c) * 0.1; brx = -0.14; hz = s * 0.05; tsy = 1 - 0.05 * Math.abs(s);
      if (mode === 'stumble') { brz = Math.sin(ph * 2.2) * 0.35; az0 = -1.6; az1 = 1.6; hz = Math.sin(ph * 3) * 0.3; }
    } else if (mode === 'jump') {
      lx0 = -1.0; lx1 = 0.5; ax0 = -0.4; ax1 = -0.4; az0 = -2.5; az1 = 2.5; brx = -0.2; by = 0.86;
    } else if (mode === 'roll') {
      lx0 = -1.7; lx1 = -1.7; ax0 = -1.3; ax1 = -1.3; az0 = -0.6; az1 = 0.6; by = 0.62; tsy = 0.92;
    } else if (mode === 'dead') {
      lx0 = -1.3; lx1 = -0.6; ax0 = -2.6; ax1 = -2.2; az0 = -1.0; az1 = 1.0; brx = 1.35; by = 0.6;
    } else if (mode === 'dance') {
      az0 = -2.3 - 0.35 * s; az1 = 2.3 - 0.35 * s; ax0 = 0.3 * c; ax1 = -0.3 * c;
      brz = 0.14 * s; by = 0.86 + Math.abs(s) * 0.12; lx0 = Math.max(0, s) * 0.6; lx1 = Math.max(0, -s) * 0.6; hz = -0.12 * s;
    } else { // idle
      by = 0.86 + Math.sin(ph) * 0.02; ax0 = 0.1 * s; ax1 = -0.1 * s;
    }
    L[0].rotation.x = D(L[0].rotation.x, lx0, 20); L[1].rotation.x = D(L[1].rotation.x, lx1, 20);
    A[0].rotation.x = D(A[0].rotation.x, ax0, 18); A[1].rotation.x = D(A[1].rotation.x, ax1, 18);
    A[0].rotation.z = D(A[0].rotation.z, az0, 12); A[1].rotation.z = D(A[1].rotation.z, az1, 12);
    b.position.y = D(b.position.y, by, 18);
    if (mode === 'roll') {
      this.spin -= dt * 15;
      b.rotation.x = this.spin;
    } else if (o.flip != null) {
      b.rotation.x = -o.flip * PI * 2 + brx;
      this.spin = 0;
    } else {
      this.spin = 0;
      b.rotation.x = D(((b.rotation.x % (PI * 2)) + PI * 3) % (PI * 2) - PI, brx, 12);
    }
    b.rotation.z = D(b.rotation.z, brz, 12);
    h.rotation.z = D(h.rotation.z, hz, 12);
    h.rotation.x = D(h.rotation.x, hx, 12);
    this.torso.scale.set(1 + (1 - tsy) * 0.6, tsy, 1 + (1 - tsy) * 0.6);
    // मिठाई खाते समय मुँह खुला, गाल फूले
    this.eatT = Math.max(0, this.eatT - dt);
    const op = this.eatT > 0 ? 1 : 0;
    this.mouthOpen.scale.y = D(this.mouthOpen.scale.y, op ? 0.9 : 0.01, 30);
    this.smile.visible = this.mouthOpen.scale.y < 0.3;
    const cs = 1 + this.mouthOpen.scale.y * 0.35;
    this['cheek-1'].scale.set(cs, 0.8 * cs, 0.55 * cs); this['cheek1'].scale.set(cs, 0.8 * cs, 0.55 * cs);
    // शुगर रश में बड़ा
    const tScale = o.big ? 1.55 : 1;
    this.scale = D(this.scale, tScale, 6);
    this.root.scale.setScalar(this.scale);
    // छाया
    const hy = o.y || 0;
    const ss = Math.max(0.35, 1 - hy * 0.18);
    this.shadow.scale.setScalar(ss);
    this.shadow.position.y = 0.02 - hy / this.scale;
    this.aura.visible = !!o.shield;
    if (o.shield) { this.aura.rotation.y += dt * 2; this.aura.scale.setScalar(1 + Math.sin(ph * 0.7) * 0.04); }
  }
}

// ======================= मिठाइयाँ (instanced) =======================
// हर मिठाई: [{geo, color, outline}] हिस्से; pts = पॉइंट
export const SWEETS = {
  rasgulla: { pts: 1, meter: 0.03, color: '#FFF8EA' },
  gulabjamun: { pts: 2, meter: 0.04, color: '#7A2A14' },
  balushahi: { pts: 3, meter: 0.05, color: '#E8A447' },
  chamcham: { pts: 5, meter: 0.065, color: '#F6A8C0' },
  rasmalai: { pts: 10, meter: 0.12, color: '#FFE08A' },
  // सिर्फ़ आसमान में (उड़न समोसे पर) — नीचे नहीं मिलतीं
  jalebi: { pts: 2, meter: 0.03, color: '#F39A1E', sky: true },
  laddoo: { pts: 3, meter: 0.035, color: '#F7A21B', sky: true },
  peda: { pts: 3, meter: 0.035, color: '#D9B07A', sky: true },
  kalakand: { pts: 4, meter: 0.04, color: '#F3E2B0', sky: true },
  milkcake: { pts: 6, meter: 0.06, color: '#B9772E', sky: true },
};
export const SKY_SWEETS = Object.keys(SWEETS).filter((k) => SWEETS[k].sky);
// हाथ से बनी जैसी हल्की ऊबड़-खाबड़ सतह (हर बिंदु normal की दिशा में थोड़ा)
function bumpy(g, amt = 0.02, f = 9) {
  const P = g.attributes.position, N = g.attributes.normal;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
    const n = Math.sin(x * f + 1.3) * Math.sin(y * f * 1.3 + 0.7) * Math.sin(z * f * 0.9 + 2.1) + 0.5 * Math.sin((x + y + z) * f * 2.1);
    P.setXYZ(i, x + N.getX(i) * n * amt, y + N.getY(i) * n * amt, z + N.getZ(i) * n * amt);
  }
  g.computeVertexNormals();
  return g;
}
// हर मिठाई के हिस्से: g ज्योमेट्री, c रंग, r खुरदुरापन (कम = चाशनी वाली चमक), m धातु, nm उभार
// दुकान की असली फोटो से कटी मिठाइयाँ (img/mithai.webp) — [x, y, w, h] (0–1, ऊपर-बाएँ से)
export const PHOTO = {"rasgulla": [0.00635, 0.03223, 0.18262, 0.32617], "gulabjamun": [0.2041, 0.0127, 0.17773, 0.36523], "balushahi": [0.39697, 0.02832, 0.18262, 0.33301], "chamcham": [0.6416, 0.0127, 0.0835, 0.36523], "rasmalai": [0.7876, 0.04004, 0.18262, 0.31055], "laddoo": [0.01318, 0.40332, 0.16846, 0.36523], "peda": [0.20166, 0.44727, 0.18213, 0.27637], "kalakand": [0.39697, 0.40918, 0.18262, 0.35352], "milkcake": [0.60449, 0.40332, 0.1582, 0.36523]};
const PH_H = { rasgulla: 0.66, gulabjamun: 0.62, balushahi: 0.64, chamcham: 0.74, rasmalai: 0.68, laddoo: 0.64, peda: 0.52, kalakand: 0.6, milkcake: 0.66 };
function photoPart(type) {
  const [x, y, w, h] = PHOTO[type], H = PH_H[type], W = H * (w * 2048) / (h * 1024); // atlas 2048×1024
  const g = new THREE.PlaneGeometry(W, H);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, x + uv.getX(i) * w, 1 - (y + (1 - uv.getY(i)) * h));
  return [{ g, photo: true }];
}
export function sweetParts(type) {
  if (PHOTO[type]) return photoPart(type); // असली फोटो वाली मिठाई (नीचे 3D वाले पुराने आकार अब सिर्फ़ जलेबी के लिए)
  if (type === 'rasgulla') {
    // छेने का नरम गोला, चाशनी से भीगा — हल्की चमक, स्पंज जैसे छेद
    const g = bumpy(G.sph(0.3, 28, 20), 0.012, 11); g.scale(1, 0.94, 1);
    return [{ g, c: 0xffffff, map: RT.rasgullaC, r: 0.42, nm: RT.spongeN, ns: 0.5, cc: 0.65, ccr: 0.22, ol: 0.035 }];
  }
  if (type === 'gulabjamun') {
    const g = bumpy(G.sph(0.28, 28, 20), 0.01, 8); g.scale(1.2, 0.92, 0.92);
    const pis = new Merge();
    for (let i = 0; i < 4; i++) pis.add(G.box(0.07, 0.015, 0.025), mat4(-0.1 + i * 0.065, 0.255 - Math.abs(i - 1.5) * 0.012, (i % 2 - 0.5) * 0.06, 0, i * 0.8, 0.2), i % 2 ? 0x8bc34a : 0x6fa63a);
    return [{ g, c: 0xffffff, map: RT.jamunC, r: 0.3, nm: RT.spongeN, ns: 0.25, cc: 1.0, ccr: 0.12, ol: 0.035 }, { g: pis.build(), c: 0xffffff, vc: true, r: 0.6 }];
  }
  if (type === 'balushahi') {
    const pts = [[0.001, -0.11], [0.24, -0.115], [0.32, -0.07], [0.355, 0.0], [0.33, 0.07], [0.25, 0.12], [0.13, 0.13], [0.06, 0.085], [0.001, 0.09]].map((a) => new THREE.Vector2(a[0], a[1]));
    const g = bumpy(new THREE.LatheGeometry(pts, 40), 0.012, 14);
    const gar = new Merge();
    for (let i = 0; i < 6; i++) gar.add(G.box(0.045, 0.012, 0.02), mat4(Math.cos(i * 1.05) * 0.05, 0.1, Math.sin(i * 1.05) * 0.05, 0, i * 0.9, 0), i % 2 ? 0x8bc34a : 0xd7b56d);
    return [{ g, c: 0xffffff, map: RT.balushahiC, r: 0.5, nm: RT.flakyN, ns: 1.3, cc: 0.45, ccr: 0.35, ol: 0.035 }, { g: gar.build(), c: 0xffffff, vc: true, r: 0.6 }];
  }
  if (type === 'chamcham') {
    const g = bumpy(G.cap(0.16, 0.32, 20), 0.008, 10); g.rotateZ(PI / 2); g.scale(1, 0.95, 1.05);
    const k = G.cap(0.06, 0.3, 10); k.rotateZ(PI / 2); k.scale(1, 0.6, 1); k.translate(0, 0.155, 0);
    return [{ g, c: 0xffffff, map: RT.chamchamC, r: 0.7, nm: RT.coconutN, ns: 1.5, ol: 0.035 }, { g: k, c: 0xfff1d6, map: RT.kalakandC, r: 0.6 }];
  }
  if (type === 'jalebi') { // चमकदार केसरिया कुंडली
    class Spiral extends THREE.Curve {
      getPoint(t, v = new THREE.Vector3()) { const a = t * PI * 5.2; const r = 0.04 + a * 0.0175; return v.set(Math.cos(a) * r, Math.sin(a * 3) * 0.012, Math.sin(a) * r); }
    }
    const g = new THREE.TubeGeometry(new Spiral(), 140, 0.045, 8, false);
    g.rotateX(PI / 2.4);
    return [{ g, c: 0xffffff, map: RT.jalebiC, r: 0.25, cc: 1.0, ccr: 0.1 }];
  }
  if (type === 'laddoo') { // मोतीचूर — दानेदार
    const g = bumpy(G.sph(0.27, 32, 24), 0.008, 9);
    const gar = new Merge();
    for (let i = 0; i < 3; i++) gar.add(G.box(0.07, 0.014, 0.025), mat4(-0.05 + i * 0.05, 0.262, (i % 2 - 0.5) * 0.04, 0, i, 0.2), 0x7cb342);
    return [{ g, c: 0xffffff, map: RT.laddooC, nm: RT.laddooN, ns: 1.6, r: 0.45, cc: 0.35, ccr: 0.4, ol: 0.03 }, { g: gar.build(), c: 0xffffff, vc: true, r: 0.6 }];
  }
  if (type === 'peda') { // बीच में अंगूठे का निशान + पिस्ता
    const pts = [[0.001, -0.07], [0.2, -0.07], [0.26, -0.03], [0.27, 0.02], [0.23, 0.065], [0.12, 0.075], [0.07, 0.045], [0.001, 0.04]].map((a) => new THREE.Vector2(a[0], a[1]));
    const g = bumpy(new THREE.LatheGeometry(pts, 36), 0.006, 16);
    const gar = new Merge();
    for (let i = 0; i < 3; i++) gar.add(G.box(0.06, 0.012, 0.022), mat4(-0.03 + i * 0.03, 0.055, (i % 2 - 0.5) * 0.03, 0, i * 1.2, 0), 0x8bc34a);
    return [{ g, c: 0xffffff, map: RT.pedaC, nm: RT.grainN, ns: 0.6, r: 0.75, ol: 0.03 }, { g: gar.build(), c: 0xffffff, vc: true, r: 0.6 }];
  }
  if (type === 'kalakand') { // दानेदार चौकोर टुकड़ा, ऊपर पिस्ता + चाँदी का वर्क
    const g = bumpy(new THREE.BoxGeometry(0.46, 0.2, 0.46, 6, 3, 6), 0.012, 30);
    const top = new Merge();
    for (let i = 0; i < 7; i++) top.add(G.box(0.07, 0.012, 0.024), mat4(-0.15 + (i % 4) * 0.1, 0.105, -0.1 + Math.floor(i / 4) * 0.18, 0, i * 0.9, 0), 0x7cb342);
    return [{ g, c: 0xffffff, map: RT.kalakandC, nm: RT.grainN, ns: 1.2, r: 0.7, ol: 0.03 }, { g: top.build(), c: 0xffffff, vc: true, r: 0.5 }];
  }
  if (type === 'milkcake') { // नीचे गहरा कैरामल, ऊपर हल्की परत
    const b = bumpy(new THREE.BoxGeometry(0.5, 0.16, 0.4, 6, 2, 5), 0.01, 26); b.translate(0, -0.04, 0);
    const t = bumpy(new THREE.BoxGeometry(0.5, 0.09, 0.4, 6, 2, 5), 0.008, 30); t.translate(0, 0.085, 0);
    return [{ g: b, c: 0xffffff, map: RT.milkcakeC, nm: RT.grainN, ns: 1.0, r: 0.7, ol: 0.03 }, { g: t, c: 0xffffff, map: RT.milkcakeTopC, nm: RT.grainN, ns: 1.0, r: 0.75 }];
  }
  // rasmalai — पीतल की कटोरी में केसर वाला दूध
  const bp = [[0.001, -0.15], [0.2, -0.15], [0.3, -0.06], [0.355, 0.1], [0.335, 0.115], [0.28, -0.02], [0.001, -0.07]].map((a) => new THREE.Vector2(a[0], a[1]));
  const bowl = new THREE.LatheGeometry(bp, 40);
  const milk = new THREE.CylinderGeometry(0.295, 0.295, 0.02, 36); milk.translate(0, 0.07, 0);
  const pat = bumpy(G.sph(0.17, 22, 16), 0.008, 12); pat.scale(1, 0.42, 1); pat.translate(0, 0.1, 0);
  const gar = new Merge();
  for (let i = 0; i < 5; i++) gar.add(G.box(0.05, 0.012, 0.022), mat4(-0.08 + i * 0.04, 0.17, (i % 2 - 0.5) * 0.05, 0, i, 0), 0x7cb342);
  for (let i = 0; i < 4; i++) gar.add(G.box(0.08, 0.006, 0.006), mat4(0.06 - i * 0.04, 0.165, 0.04 - i * 0.025, 0, i * 1.3, 0), 0xe65100);
  return [{ g: bowl, c: 0xc9963a, r: 0.28, m: 0.9, ol: 0.03 }, { g: milk, c: 0xf3d58a, r: 0.18 }, { g: pat, c: 0xfff6e6, map: RT.rasgullaC, r: 0.45, nm: RT.spongeN, ns: 0.4, cc: 0.5, ccr: 0.25, ol: 0.02 }, { g: gar.build(), c: 0xffffff, vc: true, r: 0.6 }];
}

// ======================= पावर-अप =======================
const ringG = G.tor(0.62, 0.045, 8, 32);
export function makePowerup(kind) {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  if (kind === 'magnet') {
    const mm = toon(C.maroon), top = toon(0xffffff, { map: tile('props', 4, 4, 5) });
    const b = new THREE.Mesh(G.box(0.9, 0.5, 0.68), [mm, mm, top, mm, mm, mm]);
    boxOutline(b, 0.9, 0.5, 0.68, 0.035);
    inner.add(b);
    part(G.box(0.12, 0.52, 0.7), toon(C.gold), 0, inner);
    const bow = part(G.tor(0.12, 0.04, 6, 12), toon(C.gold), 0.015, inner, 0, 0.32, 0);
    bow.rotation.y = PI / 2;
  } else if (kind === 'shoes') {
    class Spiral extends THREE.Curve {
      getPoint(t, v = new THREE.Vector3()) { const a = t * PI * 4.2; const r = 0.05 + a * 0.037; return v.set(Math.cos(a) * r, Math.sin(a) * r, 0); }
    }
    const j = part(new THREE.TubeGeometry(new Spiral(), 90, 0.055, 8, false), toon(0xf0811a), 0.02, inner);
    j.rotation.y = 0;
    const wingS = new THREE.Shape();
    wingS.moveTo(0, 0); wingS.quadraticCurveTo(0.25, 0.32, 0.55, 0.22); wingS.quadraticCurveTo(0.42, 0.1, 0.5, 0.0); wingS.quadraticCurveTo(0.3, -0.06, 0, 0);
    const wg = new THREE.ShapeGeometry(wingS);
    for (const s of [-1, 1]) {
      const w = part(wg, toon(0xffffff, { ds: true }), 0, inner, 0.38 * s, 0.05, 0);
      w.scale.x = s;
      w.userData.wing = s;
    }
  } else if (kind === 'samosa') {
    const m = new THREE.Mesh(samosaGeo(0.75), samosaMat());
    m.rotation.set(-0.25, 0.5, 0);
    m.position.y = -0.2;
    inner.add(m);
    // भाप
    for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(G.sph(0.11 - i * 0.02, 8, 6), basic(0xffffff, { op: 0.55 - i * 0.12 })); st.position.set(0.08 * (i - 1), 0.55 + i * 0.22, 0); st.userData.steam = i; inner.add(st); }
  } else if (kind === 'thali') {
    const brass = toon(0xd9a441, { r: 0.28, m: 0.85 });
    const plate = new THREE.Mesh(G.cyl(0.62, 0.55, 0.08, 28), brass);
    inner.add(plate);
    const rim = new THREE.Mesh(G.tor(0.6, 0.04, 6, 28), brass); rim.rotation.x = PI / 2; rim.position.y = 0.05; inner.add(rim);
    const mg = new Merge();
    const cols = [0xf6eedc, 0x4e1a0c, 0xcf8f3e, 0xf2b2c2, 0xf6eedc, 0x4e1a0c];
    for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; mg.add(G.sph(0.15, 10, 8), mat4(Math.cos(a) * 0.36, 0.16, Math.sin(a) * 0.36), cols[i]); }
    mg.add(G.sph(0.17, 10, 8), mat4(0, 0.2, 0), 0xf39a1e);
    inner.add(mg.mesh(0));
    inner.rotation.x = 0.5;
    // ×2 का बिल्ला
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d'); x.fillStyle = '#d3121f'; x.beginPath(); x.arc(64, 64, 60, 0, PI * 2); x.fill();
    x.lineWidth = 8; x.strokeStyle = '#ffd23a'; x.stroke();
    x.fillStyle = '#fff'; x.font = '900 64px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('×2', 64, 68);
    const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, toneMapped: false }));
    badge.scale.set(0.55, 0.55, 1); badge.position.set(0.5, 0.6, 0);
    g.add(badge);
  } else { // shield
    part(G.sph(0.42, 20, 16), toon(0xffffff, { map: tile('props', 4, 4, 7) }), 0.03, inner);
  }
  const ring = new THREE.Mesh(ringG, basic(0xffd24d, { add: true, op: 0.85 }));
  g.add(ring);
  g.userData = { kind, inner, ring };
  return g;
}

// समोसा — गोल किनारों वाला तिकोना "तकिया", सुनहरी-भूरी फफोलेदार परत, ऊपर सिलाई (vertex colors)
const TET = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map((v) => new THREE.Vector3(...v).normalize());
export function samosaGeo(s = 1) {
  const g = new THREE.SphereGeometry(s * 0.6, 40, 28);
  const P = g.attributes.position, d = new THREE.Vector3();
  const col = new Float32Array(P.count * 3), c = new THREE.Color();
  // एक फलक नीचे रहे: टेट्राहेड्रॉन को घुमाओ ताकि [-1,-1,-1] वाली दिशा (फलक) नीचे
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(-1, -1, -1).normalize(), new THREE.Vector3(0, -1, 0));
  const N = TET.map((n) => n.clone().multiplyScalar(-1).applyQuaternion(q));
  for (let i = 0; i < P.count; i++) {
    d.set(P.getX(i), P.getY(i), P.getZ(i)).normalize();
    let m = 0;
    for (const n of N) m = Math.max(m, d.dot(n));
    const rt = 1 / (3 * m); // टेट्राहेड्रॉन की सतह
    const r = s * 0.6 * (0.42 + 0.58 * rt) * 1.25;
    const n1 = Math.sin(d.x * 23 + 1) * Math.sin(d.y * 19 + 2) * Math.sin(d.z * 21 + 3);
    const n2 = Math.sin(d.x * 61) * Math.sin(d.y * 53 + 1) * Math.sin(d.z * 57 + 2);
    const rr = r * (1 + 0.025 * n1 + 0.012 * n2);
    P.setXYZ(i, d.x * rr, d.y * rr, d.z * rr);
    // रंग: किनारे गहरे सुनहरे, फफोले हल्के
    const edge = Math.min(1, Math.max(0, (rt - 1.1) / 1.4));
    c.setHSL(0.08 + 0.012 * n1, 0.78, 0.47 - 0.16 * edge + 0.07 * n2 + 0.04 * n1, THREE.SRGBColorSpace);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  g.translate(0, s * 0.18, 0);
  return g;
}
const samosaMat = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0 });
// उड़न समोसा — गोलू इस पर बैठकर उड़ता है (नोक आगे)
export function makeSamosaMount() {
  const g = new THREE.Group();
  const geo = samosaGeo(1.55);
  geo.computeBoundingBox();
  const m = new THREE.Mesh(geo, samosaMat());
  m.rotation.y = PI / 3 + PI; // एक नोक आगे (-z)
  m.scale.set(1.2, 0.6, 1.3);
  m.position.set(0, 0.18 - geo.boundingBox.max.y * 0.6, 0.15); // ऊपरी सतह पर गोलू बैठे
  m.castShadow = true;
  g.add(m);
  // पीछे से भाप + मसाले की चमक
  const puffs = [];
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(G.sph(0.14, 8, 6), basic(i % 2 ? 0xffc14d : 0xffffff, { op: 0.5 }));
    p.position.set(0, 0.0, 1.4 + i * 0.3);
    g.add(p); puffs.push(p);
  }
  g.userData = { puffs };
  g.visible = false;
  return g;
}

// ======================= रुकावटें =======================
function bambooPost(mg, x, h, z = 0) { mg.add(G.cyl(0.075, 0.085, h, 8), mat4(x, h / 2, z), C.bamboo); for (let y = 0.4; y < h; y += 0.55) mg.add(G.cyl(0.09, 0.09, 0.05, 8), mat4(x, y, z), 0x9c7a3c); }
function garland(mg, x0, x1, y, dip, z = 0, n = 13) {
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x0 + (x1 - x0) * t, yy = y - dip * 4 * t * (1 - t);
    mg.add(G.sph(0.085, 8, 6), mat4(x, yy, z), i % 2 ? 0xf08a1c : 0xf5c542);
  }
  for (let i = 0; i <= 4; i++) {
    const x = x0 + (x1 - x0) * i / 4;
    mg.add(G.cone(0.07, 0.32, 6), mat4(x, y - 0.16 - dip * 4 * (i / 4) * (1 - i / 4), z, PI, 0, 0), C.leaf);
  }
}
export const OBST = {
  // नीचा बैरियर — कूदो
  barrier() {
    const g = new THREE.Group();
    const mg = new Merge();
    for (const s of [-1, 1]) bambooPost(mg, 0.98 * s, 1.05);
    g.add(mg.mesh(0.025));
    const mu = new MergeUV();
    for (const y of [0.85, 0.45]) mu.add(G.box(2.1, 0.3, 0.14), mat4(0, y, 0));
    g.add(mu.mesh(tile('props', 4, 4, 6), 0.03));
    g.userData = { kind: 'low', halfW: 1.05, halfL: 0.22, yMin: 0, yMax: 1.0 };
    return g;
  },
  // ऊँचा तोरण — लुढ़को
  toran() {
    const g = new THREE.Group();
    const mg = new Merge();
    for (const s of [-1, 1]) bambooPost(mg, 1.05 * s, 3.1);
    mg.add(G.cyl(0.07, 0.07, 2.25, 8), mat4(0, 3.0, 0, 0, 0, PI / 2), C.bamboo);
    mg.add(G.cyl(0.06, 0.06, 2.25, 8), mat4(0, 1.62, 0, 0, 0, PI / 2), C.bamboo);
    garland(mg, -1.05, 1.05, 1.56, 0.32);
    garland(mg, -1.05, 1.05, 2.94, 0.5, 0, 15);
    // बीच में लटकती पट्टी
    mg.add(G.box(1.5, 0.75, 0.06), mat4(0, 2.35, 0), C.sindoor);
    g.add(mg.mesh(0.022));
    const flag = new THREE.Mesh(G.box(1.36, 0.6, 0.07), toon(0xffffff, { map: tile('props', 4, 4, 11) }));
    flag.position.set(0, 2.35, 0.01);
    g.add(flag);
    g.userData = { kind: 'high', halfW: 1.05, halfL: 0.2, yMin: 1.15, yMax: 3.3 };
    return g;
  },
  // ई-रिक्शा — लेन बदलो
  rickshaw() {
    const g = new THREE.Group();
    const mu = new MergeUV();
    for (const s of [-1, 1]) mu.add(new THREE.PlaneGeometry(2.36, 1.1), mat4(s * 0.832, 1.0, 0, 0, s * PI / 2, 0));
    g.add(mu.mesh(tile('props', 4, 4, 0)));
    const mg = new Merge();
    mg.add(G.box(1.65, 1.15, 2.4), mat4(0, 1.0, 0), 0x2fa36b);
    mg.add(G.box(1.8, 0.12, 2.75), mat4(0, 2.28, 0.05), 0x1f7a4c);
    mg.add(G.box(1.9, 0.08, 2.8), mat4(0, 2.36, 0.05), C.haldi);
    for (const [x, z] of [[-0.8, -1.15], [0.8, -1.15], [-0.8, 1.15], [0.8, 1.15]]) mg.add(G.cyl(0.05, 0.05, 0.75, 6), mat4(x, 1.9, z), 0x333333);
    mg.add(G.box(1.5, 0.7, 0.06), mat4(0, 1.95, 1.2), 0x9fd8f0);
    for (const [x, z] of [[-0.82, -0.75], [0.82, -0.75], [0, 1.0]]) mg.add(G.cyl(0.36, 0.36, 0.22, 14), mat4(x, 0.36, z, 0, 0, PI / 2), 0x222222);
    for (const [x, z] of [[-0.82, -0.75], [0.82, -0.75], [0, 1.0]]) mg.add(G.cyl(0.16, 0.16, 0.24, 10), mat4(x, 0.36, z, 0, 0, PI / 2), 0xc9d2da);
    mg.add(G.sph(0.13, 10, 8), mat4(0, 1.15, 1.22), 0xfff3b0);
    mg.add(G.box(1.0, 0.3, 0.05), mat4(0, 1.55, 1.21), C.sindoor);
    g.add(mg.mesh(0.035));
    g.userData = { kind: 'block', halfW: 0.92, halfL: 1.35, yMin: 0, yMax: 2.4 };
    return g;
  },
  // ठेला — लेन बदलो
  thela() {
    const g = new THREE.Group();
    const wood = toon(0xffffff, { map: tile('props', 4, 4, 1) });
    const cart = new THREE.Mesh(G.box(1.6, 0.42, 2.3), wood);
    cart.position.y = 0.95;
    boxOutline(cart, 1.6, 0.42, 2.3, 0.035);
    g.add(cart);
    const mg = new Merge();
    for (const s of [-1, 1]) { mg.add(G.cyl(0.5, 0.5, 0.1, 18), mat4(0.86 * s, 0.5, 0.2, 0, 0, PI / 2), 0x6b3f1f); mg.add(G.cyl(0.12, 0.12, 0.14, 8), mat4(0.86 * s, 0.5, 0.2, 0, 0, PI / 2), C.haldi); }
    mg.add(G.cyl(0.05, 0.05, 1.7, 6), mat4(0, 2.0, 0), 0x6b3f1f);
    const fr = [0xe53935, 0xf5c542, 0x43a047, 0xfb8c00, 0x8e24aa];
    for (let i = 0; i < 26; i++) mg.add(G.sph(0.13, 8, 6), mat4(rand(-0.65, 0.65), 1.25 + rand(0, 0.18), rand(-1.0, 1.0)), fr[i % 5]);
    g.add(mg.mesh(0.025));
    // छाता (रंगीन)
    const um = new Merge();
    const cols = [C.sindoor, C.haldi, 0x2fa36b, C.pink, 0x2f6fb6, 0xf08a1c];
    for (let i = 0; i < 6; i++) {
      const cg = new THREE.ConeGeometry(1.25, 0.55, 6, 1, true, i * PI / 3, PI / 3);
      um.add(cg, mat4(0, 2.95, 0), cols[i]);
    }
    const u = um.mesh(0.03);
    u.material = toon(0xffffff, { vc: true, ds: true });
    g.add(u);
    g.userData = { kind: 'block', halfW: 0.9, halfL: 1.2, yMin: 0, yMax: 2.6 };
    return g;
  },
  // गाय — लेन बदलो (कभी-कभी चलती)
  cow() {
    const g = new THREE.Group();
    const inner = new THREE.Group();
    g.add(inner);
    const mg = new Merge();
    const W = 0xf4f1ea;
    mg.add(G.cap(0.46, 1.1, 14), mat4(0, 1.15, 0, PI / 2, 0, 0), W);
    for (const [x, z] of [[-0.25, -0.55], [0.25, -0.55], [-0.25, 0.55], [0.25, 0.55]]) { mg.add(G.cyl(0.11, 0.09, 0.85, 8), mat4(x, 0.45, z), W); mg.add(G.cyl(0.1, 0.1, 0.1, 8), mat4(x, 0.05, z), 0x333333); }
    mg.add(G.box(0.42, 0.45, 0.55), mat4(0, 1.45, -1.05, -0.3, 0, 0), W);
    mg.add(G.box(0.36, 0.22, 0.2), mat4(0, 1.32, -1.33, -0.3, 0, 0), 0xf3a9c0);
    for (const s of [-1, 1]) {
      mg.add(G.cone(0.07, 0.42, 8), mat4(0.2 * s, 1.85, -1.0, 0, 0, -0.5 * s), C.sindoor);
      mg.add(G.cone(0.075, 0.12, 8), mat4(0.3 * s, 2.03, -1.0, 0, 0, -0.5 * s), C.haldi);
      mg.add(G.sph(0.06, 8, 6), mat4(0.18 * s, 1.55, -1.3), 0x1d1210);
      mg.add(G.box(0.22, 0.08, 0.12), mat4(0.3 * s, 1.58, -0.95, 0, 0, -0.4 * s), W);
    }
    mg.add(G.cyl(0.03, 0.03, 0.8, 5), mat4(0, 1.0, 0.95, 0.4, 0, 0), W);
    mg.add(G.box(0.95, 0.06, 0.9), mat4(0, 1.62, 0.05), C.sindoor);
    for (const s of [-1, 1]) mg.add(G.box(0.06, 0.4, 0.9), mat4(0.48 * s, 1.43, 0.05), C.sindoor);
    for (let i = 0; i < 6; i++) mg.add(G.sph(0.05, 6, 4), mat4(-0.48, 1.25, -0.35 + i * 0.16), C.gold);
    for (let i = 0; i < 6; i++) mg.add(G.sph(0.05, 6, 4), mat4(0.48, 1.25, -0.35 + i * 0.16), C.gold);
    mg.add(G.sph(0.09, 8, 6), mat4(0, 1.18, -1.2), C.gold);
    inner.add(mg.mesh(0.03));
    g.userData = { kind: 'block', halfW: 0.95, halfL: 1.25, yMin: 0, yMax: 2.0, inner };
    return g;
  },
  // दूध के कैन — कूदो
  cans() {
    const mg = new Merge();
    for (const [x, z] of [[-0.55, 0.1], [0, -0.1], [0.55, 0.12]]) {
      mg.add(G.cyl(0.24, 0.27, 0.72, 14), mat4(x, 0.36, z), 0xc9d2da);
      mg.add(G.cyl(0.14, 0.2, 0.14, 12), mat4(x, 0.79, z), 0xb0bac4);
      mg.add(G.cyl(0.17, 0.17, 0.06, 12), mat4(x, 0.88, z), 0x8e99a6);
      mg.add(G.tor(0.245, 0.02, 6, 16), mat4(x, 0.5, z, PI / 2), 0x8e99a6);
    }
    const g = new THREE.Group();
    g.add(mg.mesh(0.025));
    g.userData = { kind: 'low', halfW: 0.95, halfL: 0.35, yMin: 0, yMax: 0.92 };
    return g;
  },
  // ईंट का ढेर — ठोकर (मधुमक्खियाँ आती हैं)
  bricks() {
    const mg = new Merge();
    for (let i = 0; i < 9; i++) {
      const row = i < 5 ? 0 : 1;
      mg.add(G.box(0.42, 0.18, 0.22), mat4(-0.75 + (i % 5) * 0.37 + row * 0.18, 0.09 + row * 0.18, rand(-0.08, 0.08), 0, rand(-0.3, 0.3), 0), pick([0xc4643f, 0xb85e3c, 0xcf7650]));
    }
    const g = new THREE.Group();
    g.add(mg.mesh(0.02));
    g.userData = { kind: 'trip', halfW: 0.95, halfL: 0.22, yMin: 0, yMax: 0.42 };
    return g;
  },
  // कीचड़ — धीमा
  mud() {
    const g = new THREE.Group();
    const mg = new Merge();
    mg.add(new THREE.CircleGeometry(1, 24), mat4(0, 0.03, 0, -PI / 2, 0, 0, 0.95, 1.5, 1), 0x6b4a2b);
    for (let i = 0; i < 4; i++) mg.add(new THREE.CircleGeometry(0.16, 12), mat4(rand(-0.5, 0.5), 0.04, rand(-1, 1), -PI / 2, 0, 0), 0x8a6a45);
    g.add(mg.mesh(0));
    g.userData = { kind: 'mud', halfW: 0.9, halfL: 1.3, yMin: 0, yMax: 0.3 };
    return g;
  },
};

// ======================= मकान / किनारे की चीज़ें =======================
// side: -1 बायाँ, +1 दायाँ. सड़क का किनारा x=±4.3, फ़ुटपाथ 4.3–7.8, मकान 8.0 से
Object.assign(OBST, HAAT_OBST, EVENT_OBST, RAIL_OBST, EXTRA_OBST);
export const ROAD_HALF = 4.3, FACADE_X = 8.0, CHUNK = 20;

function facadeMats(texture, wallColor, side) {
  const w = toon(wallColor), f = toon(0xffffff, { map: texture });
  // BoxGeometry: +x, -x, +y, -y, +z, -z
  return side < 0 ? [f, w, w, w, w, w] : [w, f, w, w, w, w];
}
function roofSloped(mg, side, cx, w, h, len, col) {
  // ढलान वाली खपरैल छत (prism)
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 - 0.4, 0); shape.lineTo(0, 1.9); shape.lineTo(w / 2 + 0.4, 0); shape.lineTo(-w / 2 - 0.4, 0);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: len + 0.6, bevelEnabled: false });
  geo.translate(0, 0, -(len + 0.6) / 2);
  mg.add(geo, mat4(cx, h, 0), col);
  for (let z = -len / 2; z <= len / 2; z += 0.9) mg.add(G.box(0.08, 0.06, 0.08), mat4(cx, h + 1.92, z), 0x7a2f1a);
}
function propLamp(mg, x, z) {
  mg.add(G.cyl(0.07, 0.09, 3.6, 8), mat4(x, 1.8, z), 0x3d3d3d);
  mg.add(G.box(0.9, 0.08, 0.08), mat4(x - 0.35 * Math.sign(x), 3.55, z), 0x3d3d3d);
  mg.add(G.cyl(0.18, 0.12, 0.35, 8), mat4(x - 0.75 * Math.sign(x), 3.35, z), C.haldi);
}
function propBanana(mg, x, z) {
  mg.add(G.cyl(0.14, 0.2, 2.4, 8), mat4(x, 1.2, z), 0x7d9b4a);
  for (let i = 0; i < 6; i++) {
    const a = i * PI / 3 + rand(0, 0.4);
    const lg = G.sph(0.5, 8, 6); lg.scale(0.35, 0.12, 1.4);
    mg.add(lg, mat4(x + Math.sin(a) * 0.55, 2.55 + rand(-0.1, 0.2), z + Math.cos(a) * 0.55, -0.5 * Math.cos(a), a, 0), i % 2 ? 0x3e9b4f : 0x2e7b47);
  }
}
function propTree(mg, x, z, s = 1) {
  mg.add(G.cyl(0.22 * s, 0.32 * s, 2.6 * s, 8), mat4(x, 1.3 * s, z), 0x7a4a24);
  const cols = [0x3f8f5a, 0x4fa06a, 0x2e7b47];
  for (let i = 0; i < 5; i++) mg.add(G.sph(1.0 * s, 10, 8), mat4(x + rand(-0.8, 0.8) * s, (3.3 + rand(0, 0.9)) * s, z + rand(-0.8, 0.8) * s), cols[i % 3]);
}
function propTulsi(mg, x, z) {
  mg.add(G.box(0.8, 0.5, 0.8), mat4(x, 0.25, z), 0xe9a07a);
  mg.add(G.box(0.6, 0.5, 0.6), mat4(x, 0.75, z), C.sindoor);
  mg.add(G.box(0.62, 0.06, 0.62), mat4(x, 1.02, z), C.haldi);
  for (let i = 0; i < 6; i++) mg.add(G.sph(0.16, 6, 5), mat4(x + rand(-0.2, 0.2), 1.2 + rand(0, 0.35), z + rand(-0.2, 0.2)), 0x3a8a3f);
}
function propMatka(mg, x, z) {
  mg.add(G.cyl(0.35, 0.4, 0.6, 8), mat4(x, 0.3, z), 0x6b3f1f);
  mg.add(G.sph(0.34, 12, 10), mat4(x, 0.88, z), C.terracotta);
  mg.add(G.cyl(0.13, 0.16, 0.16, 10), mat4(x, 1.22, z), C.terracotta);
  mg.add(G.tor(0.3, 0.025, 6, 16), mat4(x, 0.9, z, PI / 2), C.haldi);
}
function propCharpai(mg, x, z) {
  for (const [a, b] of [[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]]) mg.add(G.cyl(0.06, 0.05, 0.55, 6), mat4(x + a, 0.27, z + b), 0x6b3f1f);
  mg.add(G.box(1.0, 0.08, 2.0), mat4(x, 0.55, z), 0x8a5a34);
  mg.add(G.box(0.86, 0.05, 1.84), mat4(x, 0.6, z), 0xe8d3a3);
}
function propHay(mg, x, z) {
  mg.add(G.cyl(0.9, 1.1, 1.0, 12), mat4(x, 0.5, z), 0xe9c46a);
  mg.add(G.cone(1.0, 1.4, 12), mat4(x, 1.7, z), 0xf2d27e);
  mg.add(G.cyl(0.04, 0.04, 0.5, 5), mat4(x, 2.6, z), 0x6b3f1f);
}
function propPalm(mg, x, z) {
  for (let i = 0; i < 7; i++) mg.add(G.cyl(0.16, 0.18, 0.7, 8), mat4(x + i * 0.04, 0.35 + i * 0.68, z, 0, 0, -0.03), 0x8a5a34);
  for (let i = 0; i < 7; i++) {
    const a = i * PI * 2 / 7;
    const lg = G.sph(0.5, 8, 6); lg.scale(0.25, 0.1, 1.8);
    mg.add(lg, mat4(x + 0.3 + Math.sin(a) * 0.8, 4.9, z + Math.cos(a) * 0.8, 0.45 * Math.cos(a) - 0.1, a, 0), 0x2e7b47);
  }
}
const PROPS = [propLamp, propBanana, propTulsi, propMatka, propCharpai, propHay];

function ground(group, side, len, col = 0xd9b48a) {
  const g = new THREE.Mesh(new THREE.PlaneGeometry(40, len), toon(col));
  g.rotation.x = -PI / 2;
  g.position.set(side * (ROAD_HALF + 20), 0.005, 0);
  group.add(g);
}

// खड़ा बोर्ड (तस्वीर + फ़्रेम) — 2 ड्रॉ
function signBoard(side, x, y, z, tex, ry) {
  const g = new THREE.Group();
  const mg = new Merge();
  mg.add(G.box(0.12, 1.75, 1.75), mat4(0, 0, 0), 0x6b3f1f);
  mg.add(G.cyl(0.05, 0.05, y, 5), mat4(0, -y / 2, 0), 0x6b3f1f);
  g.add(mg.mesh(0.03));
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), toon(0xffffff, { map: tex }));
  pl.rotation.y = side < 0 ? PI / 2 : -PI / 2;
  pl.position.x = -side * 0.065;
  g.add(pl);
  g.position.set(x, y, z);
  g.rotation.y = ry;
  return g;
}

// इमारत: डिब्बा merge में (1 ड्रॉ), सामने चित्र वाली दीवार अलग, मोटी काली किनारी
const hullBox = new THREE.BoxGeometry(1, 1, 1);
function building(grp, mg, side, cx, d, h, len, color, tex) {
  mg.add(G.box(d, h, len), mat4(cx, h / 2, 0), color);
  const hull = new THREE.Mesh(hullBox, outlineBack);
  hull.scale.set(d + 0.12, h + 0.12, len + 0.12);
  hull.position.set(cx, h / 2, 0);
  grp.add(hull);
  const fp = new THREE.Mesh(new THREE.PlaneGeometry(len, h), toon(0xffffff, { map: tex, nm: RT.wallN, ns: 0.7, r: 0.92 }));
  fp.rotation.y = side < 0 ? PI / 2 : -PI / 2;
  fp.position.set(side * FACADE_X - side * 0.02, h / 2, 0);
  grp.add(fp);
}

// साधारण मकान
export function makeHouse(side, variant) {
  const grp = new THREE.Group();
  const h = 5.5 + (variant % 3) * 1.2 + rand(0, 0.8), d = 6.5, len = 17.5;
  const cx = side * (FACADE_X + d / 2);
  const tiles = [0, 1, 2, 3, 4, 5, 6];
  const ti = tiles[variant % tiles.length];
  const walls = [0xf6c453, 0xf3a6bd, 0x9fd3a8, 0x8fb4e8, 0xffe7b8, 0xe98e68, 0xc7a3e0];
  const mg = new Merge();
  building(grp, mg, side, cx, d, h, len, walls[ti], tile('walls', 4, 2, ti));
  if (variant % 2) roofSloped(mg, side, cx, d, h, len, chance(0.5) ? 0xb5502e : 0x9c3d22);
  else {
    // छत पर मुंडेर
    mg.add(G.box(d + 0.3, 0.5, 0.3), mat4(cx, h + 0.25, len / 2), C.cream);
    mg.add(G.box(d + 0.3, 0.5, 0.3), mat4(cx, h + 0.25, -len / 2), C.cream);
    mg.add(G.box(0.3, 0.5, len), mat4(side * FACADE_X, h + 0.25, 0), C.cream);
    if (chance(0.6)) { mg.add(G.cyl(0.03, 0.03, 2.2, 5), mat4(cx, h + 1.1, 0), 0x555555); mg.add(G.box(0.05, 0.6, 0.9), mat4(cx, h + 1.9, 0.45), pick([C.sindoor, C.haldi, 0xf08a1c])); }
  }
  // फ़ुटपाथ की चीज़ें
  const pz = [-6, 0.5, 6.5];
  for (const z of pz) if (chance(0.75)) pick(PROPS)(mg, side * rand(5.4, 7.0), z + rand(-1, 1));
  if (chance(0.5)) propTree(mg, side * (FACADE_X + d + 2.5), rand(-6, 6), rand(0.9, 1.3));
  grp.add(mg.mesh(0.03));
  grp.userData = { type: 'house', len: CHUNK };
  return grp;
}

// दीवार पर MB Sweets का बड़ा फ्लेक्स बोर्ड (छत पर, दौड़ने वाले की ओर मुड़ा) + दीवार पर बैनर
export function makeAdWall(side, i = 0) {
  const grp = new THREE.Group();
  const h = 7, d = 6.5, len = 17.5, cx = side * (FACADE_X + d / 2);
  const mg = new Merge();
  building(grp, mg, side, cx, d, h, len, 0xfff1d6, tile('walls', 4, 2, [0, 2, 4, 5][i % 4]));
  mg.add(G.box(d + 0.3, 0.45, len + 0.3), mat4(cx, h + 0.22, 0), C.sindoor);
  propLamp(mg, side * 5.6, -7); propBanana(mg, side * 6.4, 6.5);
  grp.add(mg.mesh(0.03));
  // छत पर होर्डिंग
  const hd = new THREE.Group();
  const fm = signMat(tile('flex', 1, 4, (i + 1) % 4));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(12.4, 3.1), fm);
  hd.add(face);
  const back = new THREE.Mesh(G.box(12.7, 3.4, 0.16), toon(SIGN_EDGE));
  back.position.z = -0.1;
  hd.add(back);
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(G.cyl(0.11, 0.11, 2.2, 6), toon(0x4a4a4a)); pl.position.set(s * 4.8, -2.7, -0.15); hd.add(pl); }
  hd.position.set(cx - side * 0.8, h + 3.1, 1.5);
  hd.rotation.y = side < 0 ? 0.62 : -0.62;
  grp.add(hd);
  // दीवार पर टँगा बैनर
  const wb = new THREE.Mesh(new THREE.PlaneGeometry(11, 2.75), signMat(tile('flex', 1, 4, i % 4)));
  wb.rotation.y = side < 0 ? PI / 2 : -PI / 2;
  wb.position.set(side * FACADE_X - side * 0.05, 4.6, -1.5);
  grp.add(wb);
  grp.userData = { type: 'adwall', len: CHUNK };
  return grp;
}

// सड़क के ऊपर टँगा कपड़े/फ्लेक्स का बैनर (बाँस के खंभों पर) — सामने से सीधा पढ़ा जाए
export function makeFlex(i) {
  const g = new THREE.Group();
  const mg = new Merge();
  for (const s of [-1, 1]) {
    mg.add(G.cyl(0.13, 0.16, 9.2, 7), mat4(s * 4.85, 4.6, 0), C.bamboo);
    for (let y = 1; y < 9; y += 1.3) mg.add(G.cyl(0.165, 0.165, 0.08, 7), mat4(s * 4.85, y, 0), 0x9a7a3c);
    mg.add(G.sph(0.2, 8, 6), mat4(s * 4.85, 9.25, 0), C.sindoor);
  }
  // रस्सी
  for (let k = 0; k <= 12; k++) { const t = k / 12; mg.add(G.sph(0.035, 4, 3), mat4(-4.85 + t * 9.7, 8.9 - Math.sin(t * PI) * 0.25, 0), 0x3a2a1a); }
  g.add(mg.mesh(0.03));
  const cloth = new THREE.Group();
  const b = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 2.3, 8, 1), signMat(tile('flex', 1, 4, i % 4), { side: THREE.DoubleSide }));
  const pa = b.geometry.attributes.position;
  for (let k = 0; k < pa.count; k++) pa.setZ(k, Math.sin((pa.getX(k) / 9.2 + 0.5) * PI) * 0.12); // हल्का फूला कपड़ा
  b.geometry.computeVertexNormals();
  cloth.add(b);
  cloth.position.set(0, 7.45, 0);
  g.add(cloth);
  g.userData = { type: 'flex', cloth };
  return g;
}

// पोखर + मखाना + कमल
export function makePond(side) {
  const grp = new THREE.Group();
  ground(grp, side, CHUNK + 0.2, 0x9cc96b);
  const w = new THREE.Mesh(new THREE.CircleGeometry(1, 40), toon(0x3f9fc9));
  w.rotation.x = -PI / 2; w.scale.set(5.2, 8.6, 1); w.position.set(side * 12, 0.03, 0);
  grp.add(w);
  const rim = new THREE.Mesh(new THREE.RingGeometry(0.97, 1.06, 40), toon(0x7a4a24));
  rim.rotation.x = -PI / 2; rim.scale.copy(w.scale); rim.position.set(side * 12, 0.035, 0);
  grp.add(rim);
  const mg = new Merge();
  for (let i = 0; i < 16; i++) {
    const a = rand(0, PI * 2), r = Math.sqrt(Math.random()) * 0.85;
    const x = side * 12 + Math.cos(a) * r * 5.0, z = Math.sin(a) * r * 8.2;
    const big = chance(0.35);
    const lg = G.cyl(big ? 0.9 : 0.45, big ? 0.9 : 0.45, 0.05, 16);
    mg.add(lg, mat4(x, 0.06, z), big ? 0x3a8a3f : 0x4fa35a);
    if (big) mg.add(G.tor(0.9, 0.06, 6, 20), mat4(x, 0.09, z, PI / 2), 0x2e6b33);
    if (chance(0.4)) {
      for (let k = 0; k < 6; k++) mg.add(G.cone(0.12, 0.35, 5), mat4(x + Math.cos(k) * 0.08, 0.3, z + Math.sin(k) * 0.08, Math.cos(k * 1.1) * 0.5, 0, Math.sin(k * 1.1) * 0.5), k % 2 ? C.pink : 0xf6b3cb);
      mg.add(G.sph(0.08, 6, 5), mat4(x, 0.3, z), C.haldi);
    }
  }
  propPalm(mg, side * 6.5, -7); propPalm(mg, side * 18.5, 5); propTree(mg, side * 19, -6, 1.3);
  mg.add(G.box(0.6, 0.15, 3.5), mat4(side * 7.5, 0.25, 4), 0x8a5a34);
  // मछुआरे की नाव
  const boat = new THREE.CylinderGeometry(0.5, 0.5, 2.6, 10); boat.scale(1, 0.5, 1);
  mg.add(boat, mat4(side * 13, 0.18, -2, 0, 0.4, PI / 2), 0x6b3f1f);
  grp.add(mg.mesh(0.03));
  grp.userData = { type: 'pond', len: CHUNK };
  return grp;
}

// मंदिर (छोटा) + पीपल
export function makeTemple(side) {
  const grp = new THREE.Group();
  const mg = new Merge();
  const x = side * 11;
  mg.add(G.box(5, 0.6, 5), mat4(x, 0.3, 0), 0xe9d8b8);
  mg.add(G.box(3.6, 3.2, 3.6), mat4(x, 2.2, 0), 0xfff1d6);
  mg.add(G.box(1.4, 2.0, 0.2), mat4(x - side * 1.82, 1.6, 0, 0, PI / 2), C.sindoor);
  const sh = G.cyl(0.25, 2.0, 4.2, 8);
  mg.add(sh, mat4(x, 5.9, 0), 0xfff1d6);
  for (let i = 0; i < 4; i++) mg.add(G.tor(1.9 - i * 0.42, 0.08, 6, 8), mat4(x, 4.3 + i * 0.95, 0, PI / 2), C.sindoor);
  mg.add(G.sph(0.3, 10, 8), mat4(x, 8.1, 0), C.haldi);
  mg.add(G.cyl(0.04, 0.04, 2.2, 5), mat4(x, 9.2, 0), 0x6b3f1f);
  const fl = G.box(0.05, 0.7, 1.1); fl.translate(0, 0, 0.55);
  mg.add(fl, mat4(x, 9.9, 0), C.sindoor);
  propTree(mg, side * 6.4, 6, 1.4);
  for (let i = 0; i < 10; i++) mg.add(G.tor(0.36, 0.035, 5, 12), mat4(side * 6.4, 0.8 + i * 0.12, 6, PI / 2), i % 2 ? C.sindoor : C.haldi);
  propLamp(mg, side * 5.4, -6);
  grp.add(mg.mesh(0.03));
  grp.userData = { type: 'temple', len: CHUNK };
  return grp;
}

// बाज़ार के ठेले/दुकानें
export function makeStalls(side) {
  const grp = new THREE.Group();
  const mg = new Merge();
  const cols = [[C.sindoor, C.haldi], [0x2fa36b, 0xfff1d6], [C.pink, C.haldi], [0x2f6fb6, 0xfff1d6]];
  for (let i = 0; i < 3; i++) {
    const z = -6 + i * 6, x = side * 9.5;
    const [a, b] = pick(cols);
    mg.add(G.box(3.2, 0.9, 3.0), mat4(x, 0.45, z), 0x8a5a34);
    for (const [dx, dz] of [[-1.4, -1.3], [1.4, -1.3], [-1.4, 1.3], [1.4, 1.3]]) mg.add(G.cyl(0.05, 0.05, 2.6, 5), mat4(x + dx, 1.9, z + dz), 0x6b3f1f);
    for (let k = 0; k < 5; k++) mg.add(G.box(3.6 / 5, 0.1, 3.4), mat4(x - 1.44 + k * 0.72, 3.15, z, 0, 0, side * 0.12), k % 2 ? a : b);
    const fr = [0xe53935, 0xf5c542, 0x43a047, 0xfb8c00];
    for (let k = 0; k < 14; k++) mg.add(G.sph(0.17, 8, 6), mat4(x + rand(-1.3, 1.3), 1.05 + rand(0, 0.15), z + rand(-1.2, 1.2)), pick(fr));
  }
  propBanana(mg, side * 6.5, 8.5); propTree(mg, side * 15, 0, 1.2);
  grp.add(mg.mesh(0.03));
  // मेन्यू/पोस्टर बोर्ड
  grp.add(signBoard(side, side * 6.6, 1.6, -9.0, tile('props', 4, 4, 9), 0));
  grp.userData = { type: 'stalls', len: CHUNK };
  return grp;
}

// ======================= MB Sweets — पूरी दुकान =======================
export function makeShop(side) {
  const grp = new THREE.Group();
  ground(grp, side, CHUNK + 0.2, 0xe2c08e);
  const d = 7, h = 8.4, len = 18.5, fx = side * FACADE_X, cx = side * (FACADE_X + d / 2);
  const wall = toon(0xffd36b), dark = toon(0x3a1a12);
  const b = new THREE.Mesh(G.box(d, h, len), wall);
  b.position.set(cx, h / 2, 0);
  boxOutline(b, d, h, len, 0.06);
  grp.add(b);
  const face = (side < 0 ? PI / 2 : -PI / 2);
  // ऊपर की किनारी (मधुबनी पट्टी)
  const band = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.7), toon(0xffffff, { map: repeatTex('band', 6, 1) }));
  band.position.set(fx - side * 0.02 + side * 0, h - 0.4, 0); band.rotation.y = face; band.position.x = fx - side * 0.03;
  grp.add(band);
  // दुकान का खुला हिस्सा (अंदर रैक)
  const inside = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.4), toon(0xffffff, { map: tile('props', 4, 4, 3) }));
  inside.rotation.y = face; inside.position.set(fx - side * 0.03, 1.9, 0);
  grp.add(inside);
  // बोर्ड (बैनर वाला नाम) — दीवार पर
  const signM = signMat(TEX.sign);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, 3.8), signM);
  sign.rotation.y = face; sign.position.set(fx - side * 0.06, 5.85, 0);
  grp.add(sign);
  const sb = new THREE.Mesh(G.box(0.15, 4.1, 13.3), toon(SIGN_EDGE));
  sb.position.set(fx + side * 0.02, 5.85, 0);
  grp.add(sb);
  // छत पर बड़ा बोर्ड — दौड़ते हुए सामने दिखे
  const roofSign = new THREE.Group();
  const rs = new THREE.Mesh(new THREE.PlaneGeometry(12, 3.52), signM);
  roofSign.add(rs);
  const rsb = new THREE.Mesh(G.box(12.3, 3.8, 0.14), toon(SIGN_EDGE));
  rsb.position.z = -0.08;
  boxOutline(rsb, 12.3, 3.8, 0.14, 0.05);
  roofSign.add(rsb);
  for (const s of [-1, 1]) { const pl = new THREE.Mesh(G.cyl(0.1, 0.1, 1.5, 6), toon(0x3d3d3d)); pl.position.set(s * 4.6, -2.45, -0.12); roofSign.add(pl); }
  roofSign.position.set(cx - side * 1.2, h + 2.75, len / 2 - 2.5);
  roofSign.rotation.y = side < 0 ? 0.7 : -0.7;
  grp.add(roofSign);
  const mg = new Merge();
  // छज्जा (लाल-सफ़ेद धारी)
  for (let i = 0; i < 12; i++) {
    const z = -6.6 + i * 1.2;
    mg.add(G.box(2.4, 0.08, 1.2), mat4(fx - side * 1.15, 3.85, z, 0, 0, side * -0.28), i % 2 ? 0xffffff : 0xd1261c);
    mg.add(new THREE.CylinderGeometry(0.3, 0.3, 0.07, 12, 1, false, 0, PI), mat4(fx - side * 2.3, 3.5, z, PI / 2, 0, side * PI / 2), i % 2 ? 0xffffff : 0xd1261c);
  }
  // बत्तियों की लड़ी + दीये — अपनी रोशनी से (रात में जगमग)
  const glow = new Merge();
  for (let i = 0; i < 20; i++) glow.add(G.sph(0.09, 6, 5), mat4(fx - side * 2.33, 3.35 - Math.sin(i / 19 * PI) * 0.2, -7 + i * 0.74), pick([0xffe066, 0xff6b6b, 0x7bd389, 0x74b9ff]));
  for (let i = 0; i < 9; i++) {
    const z = -7.2 + i * 1.8, x = fx - side * 2.25;
    mg.add(G.cyl(0.13, 0.08, 0.09, 8), mat4(x, 0.05, z), 0xb5541f); // माटिक दीया
    glow.add(G.cone(0.055, 0.17, 6), mat4(x, 0.18, z), 0xffb23c);
    glow.add(G.sph(0.035, 5, 4), mat4(x, 0.12, z), 0xfff3c0);
  }
  { const gm = new THREE.Mesh(glow.build(), new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); grp.add(gm); }
  // गेंदे की माला बोर्ड के नीचे
  for (let k = 0; k < 4; k++) {
    const z0 = -6.4 + k * 3.2;
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      mg.add(G.sph(0.11, 7, 5), mat4(fx - side * 0.25, 3.95 - 0.5 * 4 * t * (1 - t), z0 + t * 3.2), i % 2 ? 0xf08a1c : 0xf5c542);
    }
  }
  // काउंटर
  const cu = new MergeUV();
  for (let i = 0; i < 4; i++) {
    const z = -4.2 + i * 2.8;
    mg.add(G.box(1.2, 1.15, 2.7), mat4(fx - side * 1.6, 0.58, z), C.maroon);
    mg.add(G.box(1.24, 0.08, 2.74), mat4(fx - side * 1.6, 1.18, z), C.gold);
    cu.add(new THREE.PlaneGeometry(2.6, 1.05), mat4(fx - side * 2.205, 0.58, z, 0, side < 0 ? PI / 2 : -PI / 2, 0));
  }
  grp.add(cu.mesh(tile('props', 4, 4, 4)));
  // काँच की पेटी
  const glass = new THREE.Mesh(G.box(1.1, 0.7, 11), basic(0xbfe9ff, { op: 0.28 }));
  glass.position.set(fx - side * 1.6, 1.52, 0);
  grp.add(glass);
  // थालियों में मिठाई
  const sw = [[0xfff8ea, 0.17], [0x6b2412, 0.16], [0xe2a14a, 0.17], [0xf6a8c0, 0.15], [0xf39a1e, 0.16], [0xfff6de, 0.15]];
  for (let t = 0; t < 6; t++) {
    const z = -4.6 + t * 1.85;
    mg.add(G.cyl(0.7, 0.7, 0.05, 18), mat4(fx - side * 1.6, 1.2, z), 0xc9d2da);
    const [col, r] = sw[t];
    for (let k = 0; k < 9; k++) {
      const a = k * 2.4, rr = 0.15 + (k % 3) * 0.17;
      mg.add(G.sph(r, 10, 8), mat4(fx - side * 1.6 + Math.cos(a) * rr * 0.75, 1.32 + (k > 6 ? 0.2 : 0), z + Math.sin(a) * rr), col);
    }
  }
  // हलवाई (जलेबी बनाते हुए)
  const hx = fx - side * 3.0, hz = 5.6;
  mg.add(G.cyl(0.5, 0.6, 0.9, 12), mat4(hx - side * 0.2, 0.45, hz + 1.6), 0x555555);
  mg.add(new THREE.SphereGeometry(0.62, 16, 8, 0, PI * 2, PI / 2, PI / 2), mat4(hx - side * 0.2, 1.25, hz + 1.6), 0x222222);
  for (let i = 0; i < 5; i++) mg.add(G.tor(0.12, 0.035, 6, 14), mat4(hx - side * 0.2 + rand(-0.3, 0.3), 1.2, hz + 1.6 + rand(-0.3, 0.3), PI / 2), 0xf0811a);
  grp.add(mg.mesh(0.03));
  const halwai = makePerson(0xffffff, 0xf2b58c, true);
  halwai.position.set(hx, 0, hz);
  halwai.rotation.y = side < 0 ? PI / 2 + 0.6 : -PI / 2 - 0.6;
  grp.add(halwai);
  // मेन्यू बोर्ड
  grp.add(signBoard(side, side * 6.2, 1.6, -8.2, tile('props', 4, 4, 8), side * -0.5));
  const mg2 = new Merge();
  mg2.add(G.cyl(0.05, 0.05, 1.2, 5), mat4(side * 6.2, 0.6, -8.2), 0x6b3f1f);
  propTulsi(mg2, side * 6.4, 8.2);
  grp.add(mg2.mesh(0.03));
  // दुकानदार डिब्बा थमाता, ग्राहक लेते — मिठाई बिक रही है
  const pf = side < 0 ? -PI / 2 : PI / 2;
  const seller = makeVillager({ kind: 'man', mode: 'serve', cloth: 0xffffff });
  seller.position.set(fx - side * 0.75, 0, -1.2); seller.rotation.y = pf;
  const c1 = makeVillager({ mode: 'buy', kind: 'kid' }), c2 = makeVillager({ mode: 'buy', kind: 'woman' }), c3 = makeVillager({ mode: 'walk', kind: 'man' });
  c1.position.set(fx - side * 2.7, 0, -1.4); c1.rotation.y = -pf;
  c2.position.set(fx - side * 2.8, 0, 1.4); c2.rotation.y = -pf + side * 0.3;
  c3.position.set(fx - side * 3.6, 0, 4.0); c3.rotation.y = 0;
  const people = [seller, c1, c2, c3];
  for (const p of people) grp.add(p);
  // हाथ से हाथ जाता मिठाई का डिब्बा
  const box = new THREE.Mesh(G.box(0.36, 0.2, 0.28), toon(0xd3121f));
  const bow = new THREE.Mesh(G.box(0.38, 0.05, 0.06), toon(C.gold)); box.add(bow);
  grp.add(box);
  const anim = (t, near) => {
    for (const p of people) { p.visible = near; if (near) p.userData.anim(t); }
    const k = (t * 0.45) % 1, e = k < 0.5 ? k * 2 : 1;
    box.visible = k < 0.75;
    box.position.set(fx - side * (0.9 + e * 1.55), 1.35 + Math.sin(e * PI) * 0.35, -1.3);
    c3.position.z = 4.0 - ((t * 0.6) % 8); // सामने से गुज़रता आदमी
  };
  grp.userData = { type: 'shop', len: CHUNK, halwai, anim };
  return grp;
}

// आसान इंसान (दुकान के लोग)
export function makePerson(cloth, skin, cap = false, s = 1) {
  const g = new THREE.Group();
  const mg = new Merge();
  mg.add(G.cap(0.32, 0.55, 12), mat4(0, 1.0, 0), cloth);
  for (const x of [-0.14, 0.14]) mg.add(G.cap(0.11, 0.45, 8), mat4(x, 0.33, 0), 0xf4efe6);
  for (const x of [-0.38, 0.38]) mg.add(G.cap(0.09, 0.4, 8), mat4(x, 1.05, -0.05, 0.3, 0, x > 0 ? 0.25 : -0.25), cloth);
  mg.add(G.sph(0.27, 14, 12), mat4(0, 1.65, 0), skin);
  mg.add(G.sph(0.05, 6, 5), mat4(-0.09, 1.7, -0.24), 0x1d1210);
  mg.add(G.sph(0.05, 6, 5), mat4(0.09, 1.7, -0.24), 0x1d1210);
  if (cap) mg.add(G.cyl(0.24, 0.27, 0.22, 14), mat4(0, 1.88, 0), 0xffffff);
  else mg.add(new THREE.SphereGeometry(0.28, 14, 8, 0, PI * 2, 0, 0.45 * PI), mat4(0, 1.66, 0.02), 0x231815);
  const m = mg.mesh(0.022);
  g.add(m);
  g.scale.setScalar(s);
  return g;
}

// ======================= स्वागत द्वार (सड़क के ऊपर) =======================
export function makeGate() {
  const g = new THREE.Group();
  const mg = new Merge();
  for (const s of [-1, 1]) {
    mg.add(G.box(0.9, 7.4, 0.9), mat4(s * 4.95, 3.7, 0), 0xfff1d6);
    mg.add(G.box(1.2, 0.5, 1.2), mat4(s * 4.95, 0.25, 0), C.sindoor);
    mg.add(G.box(1.1, 0.3, 1.1), mat4(s * 4.95, 7.55, 0), C.sindoor);
    mg.add(G.sph(0.45, 12, 10), mat4(s * 4.95, 8.05, 0), C.gold);
    mg.add(G.cone(0.2, 0.6, 8), mat4(s * 4.95, 8.65, 0), C.gold);
    for (let y = 1.2; y < 7; y += 1.15) mg.add(G.tor(0.47, 0.06, 6, 4), mat4(s * 4.95, y, 0, PI / 2, PI / 4), C.sindoor);
    for (let y = 0.9; y < 7; y += 1.15) mg.add(G.sph(0.14, 8, 6), mat4(s * 4.95, y, -0.46), C.haldi);
  }
  // नीचे लटकती गेंदे की लड़ियाँ
  for (let i = 0; i < 9; i++) {
    const x = -4.0 + i;
    for (let k = 0; k < 6; k++) mg.add(G.sph(0.12, 7, 5), mat4(x, 5.45 - k * 0.24, 0.02), k % 2 ? 0xf08a1c : 0xf5c542);
    mg.add(G.cone(0.08, 0.3, 5), mat4(x, 3.95, 0.02, PI, 0, 0), C.leaf);
  }
  g.add(mg.mesh(0.03));
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 2.55), signMat(TEX.gate, { alpha: true }));
  banner.position.set(0, 6.9, 0.05);
  g.add(banner);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 2.0), toon(SIGN_EDGE));
  back.position.set(0, 7.15, -0.02); back.rotation.y = PI;
  g.add(back);
  g.userData = { type: 'gate' };
  return g;
}

// ======================= मधुमक्खियाँ =======================
export function makeBees(n = 9) {
  const group = new THREE.Group();
  const mg = new Merge(), ol = new Merge();
  const bg = G.sph(0.13, 10, 8); bg.scale(1, 1, 1.35);
  mg.add(bg, mat4(), 0xf5c542); ol.add(bg, mat4(), 0);
  for (const z of [-0.05, 0.06]) mg.add(G.tor(0.122, 0.035, 6, 14), mat4(0, 0, z), 0x1d1210);
  mg.add(G.sph(0.075, 8, 6), mat4(0, 0.02, -0.19), 0x1d1210);
  const wr = new THREE.CircleGeometry(0.13, 10); wr.scale(1.5, 0.6, 1); wr.rotateX(-PI / 2); wr.translate(0.17, 0, 0);
  const wl = wr.clone(); wl.scale(-1, 1, 1);
  const mk = (geo, mat, cnt) => { const im = new THREE.InstancedMesh(geo, mat, cnt); im.frustumCulled = false; im.instanceMatrix.setUsage(THREE.DynamicDrawUsage); group.add(im); return im; };
  const IB = mk(mg.build(), toon(0xffffff, { vc: true }), n), IO = mk(ol.build(), outlineMat(0.02), n);
  const wm = basic(0xffffff, { op: 0.75, ds: true });
  const IR = mk(wr, wm, n), IL = mk(wl, wm, n);
  const Z = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const im of [IB, IO, IR, IL]) for (let i = 0; i < n; i++) im.setMatrixAt(i, Z);
  group.visible = false;
  const bees = [];
  for (let i = 0; i < n; i++) bees.push({ ph: Math.random() * 10, r: rand(0.35, 1.0), h: rand(-0.4, 0.5), sp: rand(2, 4) });
  const M = new THREE.Matrix4(), W = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), S = new THREE.Vector3(1, 1, 1);
  function place(i, x, y, z, ry, flap) {
    E.set(0, ry, 0); Q.setFromEuler(E); P.set(x, y, z); M.compose(P, Q, S);
    IB.setMatrixAt(i, M); IO.setMatrixAt(i, M);
    W.copy(M).multiply(mat4(0.05, 0.11, 0, 0, 0, flap)); IR.setMatrixAt(i, W);
    W.copy(M).multiply(mat4(-0.05, 0.11, 0, 0, 0, -flap)); IL.setMatrixAt(i, W);
  }
  function commit() { for (const im of [IB, IO, IR, IL]) im.instanceMatrix.needsUpdate = true; }
  return { group, bees, place, commit };
}

// ======================= दूर का नज़ारा =======================
export function makeSkyline() {
  const g = new THREE.Group();
  // दूर के महल-मंदिर: धुंध में हल्के नीले-भूरे (असली दूरी जैसा)
  const m = new THREE.MeshBasicMaterial({ map: TEX.skyline, color: 0xb9c3cf, transparent: true, fog: false, depthWrite: false, opacity: 0.6 });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(420, 79), m);
  p.position.set(0, 26, -205);
  g.add(p);
  // दूर के खेत
  const f = new THREE.Mesh(new THREE.PlaneGeometry(600, 200), basic(0xa9b98a, { fog: true }));
  f.rotation.x = -PI / 2; f.position.set(0, -0.05, -160);
  g.add(f);
  return g;
}
export { G };
