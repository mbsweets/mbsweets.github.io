// गोलू — मालिक का दिया 3D मॉडल (गमछे की पाग, कुर्ता, लाल किनारी धोती, चप्पल)।
// मॉडल में हड्डियाँ नहीं थीं — कोड से 11 हड्डियाँ लगाई (skin weights पहले से गणना करके models/golu.bin में)।
// इंटरफ़ेस पुराने Golu जैसा: root, shadow, aura, setGlow(), eat(), update(dt, mode, o)
import * as THREE from './three.module.min.js';
import { LOOKS, makeTexture, makeAttachment, makeBackItem, animWear } from './wardrobe.js';

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
    // दाहिना हाथ (कलाई) — झोला/डिब्बा पकड़ने की जगह (त्वचा के भार से नापा: कोहनी से (-0.02,-0.106,-0.11))
    this.handR = new THREE.Object3D(); this.handR.position.set(-0.02, -0.106, -0.11); B.foreR.add(this.handR);
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
  // अलमारी: { head, body, feet, extra }
  wear(outfit) {
    const key = JSON.stringify(outfit || {});
    if (key === this.wornKey) return;
    this.wornKey = key;
    const o = outfit || {};
    const tex = makeTexture(o, DATA.tex);
    if (this.customTex && this.customTex !== tex) this.customTex.dispose();
    this.customTex = tex;
    this.mat.map = tex || DATA.tex; this.mat.needsUpdate = true;
    for (const a of this.atts || []) a.parent && a.parent.remove(a);
    this.atts = []; this.wa = {};
    const add = (bone, g) => { bone.add(g); this.atts.push(g); Object.assign(this.wa, g.userData); };
    const headAtt = (LOOKS[o.head] || {}).att, xAtt = (LOOKS[o.extra] || {}).att, bodyAtt = (LOOKS[o.body] || {}).att;
    if (headAtt) add(this.B.head, makeAttachment(headAtt));
    if (xAtt === 'chashma') add(this.B.head, makeAttachment('chashma'));
    if (xAtt === 'gubbara') add(this.B.spine, makeBackItem('gubbara'));
    if (bodyAtt === 'cape') add(this.B.spine, makeBackItem('cape'));
    this.fx = (LOOKS[o.feet] || {}).fx || (LOOKS[o.extra] || {}).fx || null;
  }
  setGlow(v) {
    if (Math.abs(v - this.glow) < 0.01) return;
    this.glow = v;
    for (const mt of this.glowMats) mt.emissive.setRGB(0.5 * v, 0.26 * v, 0.02 * v);
  }
  eat() { this.eatT = 0.16; }
  land(k) { this.landT = 0.2; this.landK = k; } // ज़मीन छूते ही हल्का दबना-उठना
  pose(mode, ph, sp, o = {}) {
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
    } else if (mode === 'jump') { // ऊपर जाते समय घुटने मुड़े, नीचे आते समय पैर सीधे (उतरने को तैयार), हाथ संतुलन में
      const f = Math.min(1, Math.max(0, (3 - (o.vy == null ? 5 : o.vy)) / 12)), m = (a, b) => a + (b - a) * f;
      P.tR = m(66, 30); P.tL = m(28, 12); P.kR = m(92, 34); P.kL = m(100, 26); P.aR = m(78, 108); P.aL = m(66, 96); P.oR = m(26, 44); P.oL = m(26, 44); P.eR = m(-10, 18); P.eL = m(-10, 18); P.spX = m(2, 8); P.bx = m(0.04, 0.1); P.hdX = m(-6, 4);
    } else if (mode === 'fly') { // समोसे पर बैठा — हाथ फैलाकर संतुलन, मज़े में
      P.tR = 80; P.tL = 80; P.kR = 100; P.kL = 100; P.aR = 20 + 18 * s; P.aL = 20 - 18 * s; P.oR = 70 + 12 * c; P.oL = 70 - 12 * c; P.eR = 20; P.eL = 20;
      P.spX = 4; P.hdZ = 5 * s; P.spY = 6 * s; P.by = -0.55; P.bx = 0.05; P.bz = 0.06 * s;
    } else if (mode === 'boat') { // नाव में बैठा, पतवार चलाता
      P.tR = 82; P.tL = 82; P.kR = 98; P.kL = 98; P.aR = 45 + 30 * s; P.aL = 45 + 30 * s; P.oR = 22; P.oL = 22; P.eR = 35 - 20 * s; P.eL = 35 - 20 * s;
      P.spX = 10 + 9 * s; P.hdX = -4 * s; P.by = -0.52; P.bx = 0.05;
    } else if (mode === 'duck') { // नाव में झुका (जाल के नीचे)
      P.tR = 88; P.tL = 88; P.kR = 105; P.kL = 105; P.aR = 70; P.aL = 70; P.oR = 30; P.oL = 30; P.eR = 70; P.eL = 70; P.spX = 42; P.hdX = 25; P.by = -0.78; P.sq = 0.9;
    } else if (mode === 'ride' || mode === 'rideDuck') { // स्कूटी पर — हैंडल पकड़े
      P.tR = 78; P.tL = 78; P.kR = 82; P.kL = 82; P.aR = 52; P.aL = 52; P.oR = 16; P.oL = 16; P.eR = 38; P.eL = 38;
      P.spX = 12; P.hdX = -6; P.by = -0.5 + Math.sin(ph * 2) * 0.008; P.bx = 0.06; P.hdZ = 2 * s;
      if (mode === 'rideDuck') { P.spX = 42; P.hdX = 22; P.by = -0.66; P.aR = 40; P.aL = 40; P.eR = 60; P.eL = 60; }
    } else if (mode === 'carry') { // डिब्बा दोनों हाथ में, दौड़ते हुए
      P.tR = 18.7 + 34 * s; P.tL = 18.7 - 34 * s; P.kR = 15 + 70 * Math.max(0, c); P.kL = 15 + 70 * Math.max(0, -c);
      P.aR = 168; P.oR = 34; P.eR = 70; P.aL = -4 + 41 * s; P.oL = 8; P.hipY = 6 * s; P.by = Math.abs(c) * 0.06 - 0.03; P.bx = 0.1; // दाहिना हाथ ऊपर — कंधे पर डिब्बा
    } else if (mode === 'wave') { // रुककर टाटा — बायाँ हाथ ऊपर हिलता
      P.aR = -6; P.aL = 150; P.oL = 30 + 22 * Math.sin(ph * 3); P.eL = 25; P.tR = 2; P.tL = 2; P.kR = 4; P.kL = 4; P.hdZ = 6 * Math.sin(ph * 1.5);
    } else if (mode === 'runPhone') { // 📞 दौड़ते हुए फ़ोन कान पर (दाहिना हाथ)
      P.tR = 18.7 + 34 * s; P.tL = 18.7 - 34 * s; P.kR = 15 + 72 * Math.max(0, c); P.kL = 15 + 72 * Math.max(0, -c);
      P.aR = 128; P.oR = 58; P.eR = 128; P.aL = -4 + 38 * s; P.hipY = 7 * s; P.by = Math.abs(c) * 0.06 - 0.03; P.bx = 0.1; P.hdZ = -10;
    } else if (mode === 'carryStand') { // डिब्बा कंधे पर, खड़ा
      P.aR = 168; P.oR = 34; P.eR = 70; P.aL = -8; P.oL = 8; P.tR = 2; P.tL = 2; P.kR = 4; P.kL = 4; P.by = Math.sin(ph) * 0.01;
    } else if (mode === 'rideHelmet') { // स्कूटी पर बैठकर हेलमेट पहनना — दोनों हाथ सिर पर
      P.tR = 78; P.tL = 78; P.kR = 82; P.kL = 82; P.aR = 150; P.aL = 150; P.oR = 38; P.oL = 38; P.eR = 105; P.eL = 105; P.spX = 4; P.hdX = 6; P.by = -0.5; P.bx = 0.06;
    } else if (mode === 'rideKick') { // किक मारकर चालू — दाहिना पैर नीचे-ऊपर, हाथ हैंडल पर
      const kk = Math.abs(Math.sin(ph * 2.2));
      P.tR = 78 - 52 * kk; P.kR = 82 - 60 * kk; P.tL = 78; P.kL = 82; P.aR = 52; P.aL = 52; P.oR = 16; P.oL = 16; P.eR = 38; P.eL = 38;
      P.spX = 12 + 8 * kk; P.hdX = -6; P.by = -0.5 + kk * 0.12; P.bx = 0.06; P.bz = -0.04 * kk;
    } else if (mode === 'knock') { // दरवाज़ा खटखटाना — डिब्बा दाएँ कंधे पर, बायाँ हाथ ठक-ठक
      P.aR = 168; P.oR = 34; P.eR = 70; P.aL = 82; P.oL = 14; P.eL = 30 + 55 * Math.abs(Math.sin(ph * 3)); P.tR = 4; P.tL = 4; P.kR = 6; P.kL = 6; P.spX = 6; P.hdX = -4;
    } else if (mode === 'give') { // दोनों हाथ आगे — डिब्बा देना
      P.aR = 78; P.aL = 78; P.oR = 12; P.oL = 12; P.eR = 28; P.eL = 28; P.tR = 6; P.tL = -4; P.kR = 10; P.kL = 6; P.spX = 14; P.hdX = 4;
    } else if (mode === 'namaste') { // 🙏 हाथ जोड़कर, सिर थोड़ा झुका
      P.aR = 42; P.aL = 42; P.oR = -14; P.oL = -14; P.eR = 112; P.eL = 112; P.tR = 2; P.tL = 2; P.kR = 4; P.kL = 4; P.spX = 12 + 6 * Math.max(0, Math.sin(ph * 1.5)); P.hdX = 14;
    } else if (mode === 'hang' || mode === 'hangUp') { // रस्सी के कुंडे से लटका — दोनों हाथ ऊपर
      P.aR = 172; P.aL = 172; P.oR = 10; P.oL = 10; P.eR = 8; P.eL = 8; P.spX = 0; P.hdX = -8; P.bx = 0; P.by = 0;
      P.tR = 12 + 10 * s; P.tL = 12 - 10 * s; P.kR = 18 + 8 * Math.max(0, s); P.kL = 18 + 8 * Math.max(0, -s); P.hdZ = 3 * s;
      if (mode === 'hangUp') { P.tR = 98; P.tL = 98; P.kR = 115; P.kL = 115; P.spX = -6; }
    } else if (mode === 'lunge') { // बंदर पर झपट्टा — दोनों हाथ आगे, झुककर लपका
      P.tR = 55; P.tL = -10; P.kR = 40; P.kL = 20; P.aR = 100; P.aL = 95; P.oR = 18; P.oL = 18; P.eR = 5; P.eL = 5; P.spX = 28; P.hdX = -12; P.bx = 0.45; P.by = -0.05;
    } else if (mode === 'roll') { // 🛝 फिसलना: पीठ के बल सड़क पर सरकना — पैर आगे, एक हाथ पीछे ज़मीन पर, सिर उठा (पहले गेंद की तरह घूमता था)
      P.tR = 52; P.tL = 40; P.kR = 10; P.kL = 34; P.aR = -38; P.aL = 34; P.oR = 30; P.oL = 40; P.eR = 8; P.eL = 30; P.spX = 0; P.hdX = 22; P.hdZ = 4; P.bx = -0.95; P.by = -0.5; P.sq = 0.92;
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
    this.phase += dt * (run || mode === 'carry' || mode === 'runPhone' ? (o.walk ? 6.5 : 8 + sp * 0.34) : mode === 'dance' ? 6.5 : mode === 'fly' ? 4 : mode === 'boat' ? 5 : 3);
    const P = this.pose(mode, this.phase, sp, o);
    if (!this.cur) this.cur = { ...P };
    const C = this.cur, spd = run ? (this.prevMode === 'roll' || this.prevMode === 'jump' ? 26 : 40) : mode === 'roll' ? 30 : mode === 'jump' ? 22 : 18; // फिसलने/कूदने से दौड़ में नरमी से
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
    this.look = k(this.look || 0, o.look || 0, 9); // पीछे मुड़कर देखना (मधुमक्खी/बंदर)
    B.spine.rotation.y += this.look * 0.35;
    B.head.rotation.set(C.hdX * D2R, -C.spY * 0.5 * D2R + this.look * 1.15, C.hdZ * D2R);
    // खाते समय सिर हल्का फूले
    this.eatT = Math.max(0, this.eatT - dt);
    const hs = this.eatT > 0 ? 1.07 : 1;
    B.head.scale.setScalar(k(B.head.scale.x, hs, 30));
    const b = this.body;
    b.position.y = 0.5 * SCALE * 0.95 + C.by;
    // ध्यान: model 180° घूमा है, इसलिए आगे झुकना = body.rotation.x ऋणात्मक नहीं, धनात्मक कोण x पर (खेल की -z दिशा)
    // rx0/rz0 = अपना झुकाव; ऊपर से करतब (o.tx/o.tz) जोड़ते हैं — ताकि अगले फ़्रेम में झुकाव करतब से न बिगड़े
    if (o.flip != null && !o.tx && !o.tz) { this.rx0 = -o.flip * PI * 2 - C.bx; this.spin = 0; }
    else { this.spin = 0; const r = this.rx0 == null ? b.rotation.x : this.rx0; this.rx0 = k(((r % (PI * 2)) + PI * 3) % (PI * 2) - PI, -C.bx, mode === 'roll' ? 22 : this.prevMode === 'roll' ? 16 : 12); }
    this.rz0 = k(this.rz0 || 0, C.bz, 12);
    b.rotation.x = this.rx0 + (o.tx || 0);
    b.rotation.z = this.rz0 + (o.tz || 0);
    this.landT = Math.max(0, (this.landT || 0) - dt); const lq = this.landT > 0 ? Math.sin((1 - this.landT / 0.2) * Math.PI) * (this.landK || 0) : 0; // उतरने की लचक
    b.scale.set(C.sq * (1 + lq * 0.07), C.sq * (1 - lq * 0.13), C.sq * (1 + lq * 0.07)); this.prevMode = mode;
    this.scale = k(this.scale, o.big ? 1.45 : 1, 6);
    this.root.scale.setScalar(this.scale);
    const hy = (o.y || 0) - (o.gy || 0); // परछाईं ज़मीन/छत पर
    this.shadow.scale.setScalar(Math.max(0.35, 1 - hy * 0.18));
    this.shadow.position.y = 0.02 - hy / this.scale;
    this.wt = (this.wt || 0) + dt;
    if (this.wa) animWear(this.wa, this.wt, run ? sp : mode === 'fly' ? 22 : 0);
    this.aura.visible = !!o.shield;
    if (o.shield) { this.aura.rotation.y += dt * 2; this.aura.scale.setScalar(1 + Math.sin(this.phase * 0.7) * 0.04); }
  }
}
