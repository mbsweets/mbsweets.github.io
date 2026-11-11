// गोलू — मालिक का दिया 3D मॉडल (गमछे की पाग, कुर्ता, लाल किनारी धोती, चप्पल)।
// मॉडल में हड्डियाँ नहीं थीं — कोड से 11 हड्डियाँ लगाई (skin weights पहले से गणना करके models/golu.bin में)।
// इंटरफ़ेस पुराने Golu जैसा: root, shadow, aura, setGlow(), eat(), update(dt, mode, o)
import * as THREE from './three.module.min.js';

const PI = Math.PI, D2R = PI / 180;
let DATA = null;

export async function loadGolu(base = '') {
  if (DATA) return DATA;
  const [meta, bin, tex] = await Promise.all([
    fetch(base + 'models/golu.json').then((r) => r.json()),
    fetch(base + 'models/golu.bin').then((r) => r.arrayBuffer()),
    new Promise((res, rej) => new THREE.TextureLoader().load(base + 'img/golu.webp', res, undefined, rej)),
  ]);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  DATA = { meta, bin, tex };
  return DATA;
}

function buildGeometry({ meta, bin }) {
  const n = meta.n, t = meta.t;
  let o = 0;
  const take = (Type, count) => { const a = new Type(bin, o, count); o += count * Type.BYTES_PER_ELEMENT; return a; };
  const q = take(Uint16Array, n * 3), uvq = take(Uint16Array, n * 2), idx = take(Uint16Array, t * 3);
  const nn = take(Int8Array, n * 3), si = take(Uint8Array, n * 4), sw = take(Uint8Array, n * 4);
  const lo = meta.lo, hi = meta.hi;
  const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2), w = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    for (let k = 0; k < 3; k++) {
      pos[i * 3 + k] = lo[k] + (q[i * 3 + k] / 65535) * (hi[k] - lo[k]);
      nor[i * 3 + k] = nn[i * 3 + k] / 127;
    }
    uv[i * 2] = uvq[i * 2] / 65535; uv[i * 2 + 1] = uvq[i * 2 + 1] / 65535;
    for (let k = 0; k < 4; k++) w[i * 4 + k] = sw[i * 4 + k] / 255;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(Array.from(si), 4));
  g.setAttribute('skinWeight', new THREE.BufferAttribute(w, 4));
  g.setIndex(new THREE.BufferAttribute(new Uint16Array(idx), 1));
  g.computeBoundingSphere();
  return g;
}

// बाँधते समय (मॉडल के पोज़ में) हड्डियों के कोण — डिग्री; आगे = +
const BIND = { thighR: 58, thighL: -20.6, kneeR: 24, kneeL: 8.7, armR: -45, armL: 37 };
const SCALE = 2.25; // मॉडल 1 इकाई ऊँचा → खेल में ~2.25

export class Golu {
  constructor() {
    const root = this.root = new THREE.Group();
    const body = this.body = new THREE.Group(); // बीच से घूमे (लुढ़कना/कलाबाज़ी)
    body.position.y = 0.5 * SCALE * 0.95;
    root.add(body);
    this.model = new THREE.Group();
    this.model.rotation.y = PI; // मॉडल +z देखता है; खेल में गोलू -z की ओर दौड़ता
    this.model.scale.setScalar(SCALE);
    this.model.position.y = -0.5 * SCALE * 0.95 + 0.5 * SCALE;
    body.add(this.model);
    const geo = buildGeometry(DATA);
    const mat = this.mat = new THREE.MeshStandardMaterial({ map: DATA.tex, roughness: 0.78, metalness: 0 });
    this.glowMats = [mat];
    const mesh = this.mesh = new THREE.SkinnedMesh(geo, mat);
    mesh.castShadow = true; mesh.frustumCulled = false;
    // हड्डियाँ
    const bones = [], B = {};
    for (const b of DATA.meta.bones) {
      const bone = new THREE.Bone();
      bone.name = b.n;
      const p = new THREE.Vector3(...b.p);
      if (b.parent != null) p.sub(new THREE.Vector3(...DATA.meta.bones[b.parent].p));
      bone.position.copy(p);
      if (b.parent != null) bones[b.parent].add(bone);
      bones.push(bone); B[b.n] = bone;
    }
    this.B = B;
    mesh.add(bones[0]);
    this.model.add(mesh);
    mesh.updateMatrixWorld(true);
    mesh.bind(new THREE.Skeleton(bones));
    this.headBase = B.head.scale.clone();
    // छाया + लड्डू कवच
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -PI / 2;
    this.shadow.position.y = 0.02;
    root.add(this.shadow);
    this.aura = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 18), new THREE.MeshBasicMaterial({ color: 0xffb23c, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.aura.position.y = 1.1;
    this.aura.visible = false;
    root.add(this.aura);
    this.phase = 0; this.spin = 0; this.eatT = 0; this.scale = 1; this.glow = 0;
    this.cur = null;
  }
  setGlow(v) {
    if (Math.abs(v - this.glow) < 0.01) return;
    this.glow = v;
    for (const mt of this.glowMats) mt.emissive.setRGB(0.5 * v, 0.26 * v, 0.02 * v);
  }
  eat() { this.eatT = 0.16; }
  pose(mode, ph, sp) {
    const s = Math.sin(ph), c = Math.cos(ph);
    // P: कोण डिग्री में (आगे +), out = बाँह बाहर, el = कोहनी और मुड़े, tw = कमर घुमाव
    const P = { tR: 18, tL: 18, kR: 12, kL: 12, aR: -4, aL: -4, oR: 6, oL: 6, eR: 0, eL: 0, hipY: 0, spX: 6, spY: 0, hdX: 0, hdZ: 0, by: 0, bz: 0, bx: 0.1, sq: 1 };
    if (mode === 'run' || mode === 'stumble') {
      P.tR = 18.7 + 39.3 * s; P.tL = 18.7 - 39.3 * s;
      P.kR = 15 + 80 * Math.max(0, c); P.kL = 15 + 80 * Math.max(0, -c);
      P.aR = -4 - 41 * s; P.aL = -4 + 41 * s;
      P.hipY = 9 * s; P.spY = -13 * s; P.hdZ = 2.5 * s;
      P.by = Math.abs(c) * 0.08 - 0.03; P.bx = 0.12;
      if (mode === 'stumble') { P.oR = 55 + 30 * Math.sin(ph * 3); P.oL = 55 - 30 * Math.sin(ph * 3); P.aR = 30; P.aL = 30; P.bz = Math.sin(ph * 2.3) * 0.25; P.hdZ = Math.sin(ph * 3) * 14; }
    } else if (mode === 'jump') {
      P.tR = 62; P.tL = 30; P.kR = 85; P.kL = 95; P.aR = 75; P.aL = 70; P.oR = 28; P.oL = 28; P.eR = -10; P.eL = -10; P.spX = 2; P.bx = 0.05;
    } else if (mode === 'fly') { // समोसे पर बैठा — हाथ फैलाकर संतुलन, मज़े में
      P.tR = 80; P.tL = 80; P.kR = 100; P.kL = 100; P.aR = 20 + 18 * s; P.aL = 20 - 18 * s; P.oR = 70 + 12 * c; P.oL = 70 - 12 * c; P.eR = 20; P.eL = 20;
      P.spX = 4; P.hdZ = 5 * s; P.spY = 6 * s; P.by = -0.55; P.bx = 0.05; P.bz = 0.06 * s;
    } else if (mode === 'roll') {
      P.tR = 70; P.tL = 70; P.kR = 95; P.kL = 95; P.aR = 50; P.aL = 50; P.oR = 12; P.oL = 12; P.spX = 20; P.hdX = 15; P.by = -0.38; P.sq = 0.74;
    } else if (mode === 'dead') {
      P.tR = 35; P.tL = -5; P.kR = 30; P.kL = 50; P.aR = 60; P.aL = 70; P.oR = 75; P.oL = 75; P.bx = -1.4; P.by = -0.52;
    } else if (mode === 'dance') {
      P.aR = 25 + 20 * c; P.aL = 25 - 20 * c; P.oR = 65 + 25 * s; P.oL = 65 - 25 * s; P.eR = 15; P.eL = 15;
      P.tR = 10 + Math.max(0, s) * 45; P.tL = 10 + Math.max(0, -s) * 45; P.kR = 10 + Math.max(0, s) * 70; P.kL = 10 + Math.max(0, -s) * 70;
      P.by = Math.abs(s) * 0.07; P.bz = 0.1 * s; P.spY = 14 * s; P.hdZ = -6 * s; P.spX = 2;
    } else {
      P.by = Math.sin(ph) * 0.012; P.aR = -8 + 3 * s; P.aL = -8 - 3 * s; P.tR = 2; P.tL = 2; P.kR = 4; P.kL = 4;
    }
    return P;
  }
  update(dt, mode, o = {}) {
    const k = (cur, tgt, spd = 16) => cur + (tgt - cur) * (1 - Math.exp(-spd * dt));
    const sp = o.speed || 14;
    const run = mode === 'run' || mode === 'stumble';
    this.phase += dt * (run ? 8 + sp * 0.34 : mode === 'dance' ? 6.5 : mode === 'fly' ? 4 : 3);
    const P = this.pose(mode, this.phase, sp);
    if (!this.cur) this.cur = { ...P };
    const C = this.cur, spd = run ? 40 : 18;
    for (const key in P) C[key] = k(C[key], P[key], key === 'by' || key === 'bx' || key === 'bz' ? 14 : spd);
    const B = this.B;
    B.thighR.rotation.x = -(C.tR - BIND.thighR) * D2R;
    B.thighL.rotation.x = -(C.tL - BIND.thighL) * D2R;
    B.shinR.rotation.x = (C.kR - BIND.kneeR) * D2R;
    B.shinL.rotation.x = (C.kL - BIND.kneeL) * D2R;
    B.armR.rotation.set(-(C.aR - BIND.armR) * D2R, 0, -(C.oR - 6) * D2R);
    B.armL.rotation.set(-(C.aL - BIND.armL) * D2R, 0, (C.oL - 6) * D2R);
    B.foreR.rotation.x = -C.eR * D2R; B.foreL.rotation.x = -C.eL * D2R;
    B.hips.rotation.y = C.hipY * D2R;
    B.spine.rotation.set(C.spX * D2R - 6 * D2R, C.spY * D2R, 0);
    B.head.rotation.set(C.hdX * D2R, -C.spY * 0.5 * D2R, C.hdZ * D2R);
    // खाते समय सिर हल्का फूले
    this.eatT = Math.max(0, this.eatT - dt);
    const hs = this.eatT > 0 ? 1.07 : 1;
    B.head.scale.setScalar(k(B.head.scale.x, hs, 30));
    const b = this.body;
    b.position.y = 0.5 * SCALE * 0.95 + C.by;
    // ध्यान: model 180° घूमा है, इसलिए आगे झुकना = body.rotation.x ऋणात्मक नहीं, धनात्मक कोण x पर (खेल की -z दिशा)
    if (mode === 'roll') { this.spin -= dt * 15; b.rotation.x = this.spin; }
    else if (o.flip != null) { b.rotation.x = -o.flip * PI * 2 - C.bx; this.spin = 0; }
    else { this.spin = 0; b.rotation.x = k(((b.rotation.x % (PI * 2)) + PI * 3) % (PI * 2) - PI, -C.bx, 12); }
    b.rotation.z = k(b.rotation.z, C.bz, 12);
    b.scale.setScalar(C.sq);
    this.scale = k(this.scale, o.big ? 1.45 : 1, 6);
    this.root.scale.setScalar(this.scale);
    const hy = o.y || 0;
    this.shadow.scale.setScalar(Math.max(0.35, 1 - hy * 0.18));
    this.shadow.position.y = 0.02 - hy / this.scale;
    this.aura.visible = !!o.shield;
    if (o.shield) { this.aura.rotation.y += dt * 2; this.aura.scale.setScalar(1 + Math.sin(this.phase * 0.7) * 0.04); }
  }
}
