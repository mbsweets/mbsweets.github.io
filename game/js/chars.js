// 🎭 नए किरदार (24 नवंबर 2026, मालिक: "करेक्टर टाइप का कुछ… ओरिजिनल टाइप का, कार्टून जैसा नहीं")
//   🐒 बंटी बंदर — असली रीसस बंदर जैसा (रोएँदार खाल, गुलाबी चेहरा, लंबी पूँछ), गले में गमछा · ख़ासियत: ऊँची छलांग
//   💪 पहलवान चाचा — अखाड़े वाले पहलवान (तेल लगा बदन, ताव वाली मूँछ, लाल लंगोट, पीठ पर गदा) · ख़ासियत: एक टक्कर झेल लें
//   🍮 रसगुल्ला राजा — असली रसगुल्ले जैसा स्पंजी, चाशनी से चमकता, सोने का मुकुट और मैरून केप · ख़ासियत: पास की मिठाई खींचे
// सब कोड से बने (कोई बाहरी फ़ाइल नहीं), हड्डियों वाले. इंटरफ़ेस गोलू (golu3d.js) जैसा:
//   root, body, shadow, aura, B.head (हेलमेट के लिए), handR (झोला), atts, wear(), setGlow(), eat(), land(), update(dt, mode, o)
// चाल-ढाल गोलू वाली ही (उसका pose() उधार) — ऊपर से हर किरदार का अपना अंदाज़ (झुकाव, कंधे, लुढ़कना).
import * as THREE from './three.module.min.js';
import { Golu } from './golu3d.js';
import { RT, RTU } from './real.js';

const PI = Math.PI, D2R = PI / 180;
let seed = 4242;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const V2 = (r, y) => new THREE.Vector2(Math.max(r, 1e-4), y);

// ---------- आकार ----------
// नीचे से ऊपर [त्रिज्या, ऊँचाई] — दोनों सिरे गोल (मांसपेशियों जैसी चिकनी नली)
function organ(spec, seg = 18) {
  const pts = [], [r0, y0] = spec[0], [r1, y1] = spec[spec.length - 1];
  for (let i = 0; i <= 5; i++) { const a = -PI / 2 + (i / 5) * PI / 2; pts.push(V2(Math.cos(a) * r0, y0 + Math.sin(a) * r0)); }
  for (let i = 1; i < spec.length - 1; i++) pts.push(V2(spec[i][0], spec[i][1]));
  for (let i = 0; i <= 5; i++) { const a = (i / 5) * PI / 2; pts.push(V2(Math.cos(a) * r1, y1 + Math.sin(a) * r1)); }
  return new THREE.LatheGeometry(pts, seg);
}
// हड्डी से नीचे लटकता अंग (0 से -len तक), r = [ऊपर, बीच, नीचे]
const limb = (len, r, seg = 16) => organ([[r[2], -len], [r[1], -len * 0.55], [r[0], 0]], seg);
const sph = (r, ws = 20, hs = 14, ...a) => new THREE.SphereGeometry(r, ws, hs, ...a);
function mesh(geo, mat, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.rotation.set(rx, ry, rz);
  m.castShadow = shadow;
  return m;
}
function tube(pts, r, seg = 20, rs = 8) { return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), seg, r, rs, false); }

// ---------- बनावट (canvas से) ----------
function cv(n) { const c = document.createElement('canvas'); c.width = c.height = n; return [c, c.getContext('2d')]; }
// टाइल होने वाला: किनारे पार करने वाली चीज़ दूसरी ओर भी
function wrapDraw(n, px, py, pad, fn) {
  for (const ox of [0, n, -n]) for (const oy of [0, n, -n]) {
    const X = px + ox, Y = py + oy;
    if (X < -pad || X > n + pad || Y < -pad || Y > n + pad) continue;
    fn(X, Y);
  }
}
// रोएँ: छोटे-छोटे बाल ऊपर से नीचे (v दिशा) बहते — रंग + उभार
function furTex(base, light, dark, n = 256, len = 7, dens = 22) {
  const [c, x] = cv(n), [h, y] = cv(n);
  x.fillStyle = base; x.fillRect(0, 0, n, n);
  y.fillStyle = '#707070'; y.fillRect(0, 0, n, n);
  const cols = [light, dark, base, light];
  x.lineCap = y.lineCap = 'round';
  for (let i = 0; i < (n * n) / dens; i++) {
    const px = rnd() * n, py = rnd() * n, L = len * (0.6 + rnd() * 0.9), a = PI / 2 + (rnd() - 0.5) * 0.55;
    const dx = Math.cos(a) * L, dy = Math.sin(a) * L, col = cols[i % 4], al = 0.18 + rnd() * 0.3, w = 0.5 + rnd() * 0.9, hv = 140 + rnd() * 110 | 0;
    wrapDraw(n, px, py, L, (X, Y) => {
      x.globalAlpha = al; x.strokeStyle = col; x.lineWidth = w; x.beginPath(); x.moveTo(X, Y); x.lineTo(X + dx, Y + dy); x.stroke();
      y.globalAlpha = 0.5; y.strokeStyle = `rgb(${hv},${hv},${hv})`; y.lineWidth = w; y.beginPath(); y.moveTo(X, Y); y.lineTo(X + dx, Y + dy); y.stroke();
    });
  }
  x.globalAlpha = y.globalAlpha = 1;
  // हल्का धुँधला — लकड़ी के रेशे नहीं, मुलायम रोएँ
  const [c2, x2] = cv(n); x2.filter = 'blur(0.6px)'; x2.drawImage(c, 0, 0); x2.filter = 'none';
  x2.globalCompositeOperation = 'soft-light'; x2.globalAlpha = 0.5; x2.drawImage(RTU.noiseCanvas(n, 4, 6), 0, 0); x2.globalAlpha = 1; x2.globalCompositeOperation = 'source-over';
  const map = RTU.tex(c2), nrm = RTU.tex(RTU.normalFrom(h, 1.6), false);
  return { map, nrm };
}
// त्वचा: हल्के धब्बे/रंगत + बारीक रोमछिद्र (उभार)
function skinTex(base, tint, n = 256) {
  const [c, x] = cv(n), [h, y] = cv(n);
  x.fillStyle = base; x.fillRect(0, 0, n, n);
  const nz = RTU.noiseCanvas(n, 5, 4);
  x.globalCompositeOperation = 'soft-light'; x.globalAlpha = 0.55; x.drawImage(nz, 0, 0); x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 60; i++) {
    const px = rnd() * n, py = rnd() * n, r = 6 + rnd() * 22;
    wrapDraw(n, px, py, r, (X, Y) => { const g = x.createRadialGradient(X, Y, 0, X, Y, r); g.addColorStop(0, tint); g.addColorStop(1, 'rgba(0,0,0,0)'); x.globalAlpha = 0.12 + rnd() * 0.12; x.fillStyle = g; x.fillRect(X - r, Y - r, r * 2, r * 2); });
  }
  x.globalAlpha = 1;
  y.fillStyle = '#808080'; y.fillRect(0, 0, n, n);
  y.globalAlpha = 0.35; y.drawImage(nz, 0, 0); y.globalAlpha = 1;
  for (let i = 0; i < 2600; i++) { const v = 90 + rnd() * 40 | 0; y.fillStyle = `rgb(${v},${v},${v})`; y.fillRect(rnd() * n, rnd() * n, 1, 1); }
  return { map: RTU.tex(c), nrm: RTU.tex(RTU.normalFrom(h, 1.1), false) };
}
// सूती कपड़ा: बुनाई की बारीक लकीरें; check = गमछे के लाल-सफ़ेद चेक
function clothTex(base, check = null, n = 256) {
  const [c, x] = cv(n), [h, y] = cv(n);
  x.fillStyle = base; x.fillRect(0, 0, n, n);
  if (check) {
    const s = n / 8;
    x.fillStyle = check[0]; x.fillRect(0, 0, n, n);
    x.globalAlpha = 0.85; x.fillStyle = check[1];
    for (let i = 0; i < 8; i += 2) { x.fillRect(i * s, 0, s * 0.8, n); x.fillRect(0, i * s, n, s * 0.8); }
    x.globalAlpha = 0.5; x.fillStyle = check[2] || check[0];
    for (let i = 0; i < 8; i++) { x.fillRect(i * s + s * 0.85, 0, s * 0.08, n); x.fillRect(0, i * s + s * 0.85, n, s * 0.08); }
    x.globalAlpha = 1;
  }
  y.fillStyle = '#808080'; y.fillRect(0, 0, n, n);
  for (let i = 0; i < n; i += 2) { y.fillStyle = i % 4 ? '#8e8e8e' : '#727272'; y.fillRect(i, 0, 1, n); y.fillRect(0, i, n, 1); }
  const nz = RTU.noiseCanvas(n, 4, 8);
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.25; x.drawImage(nz, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  return { map: RTU.tex(c), nrm: RTU.tex(RTU.normalFrom(h, 0.9), false) };
}

// ---------- मटेरियल ----------
const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.8, metalness: 0 }, o));
function eye(irisCol, r = 0.035) {
  const g = new THREE.Group();
  const white = std({ color: 0xf3ece2, roughness: 0.18 });
  g.add(mesh(sph(r, 16, 12), white, 0, 0, 0, 1, 1, 1, 0, 0, 0, false));
  // पुतली सफ़ेदी से थोड़ा बाहर (कॉर्निया जैसा उभार) — वरना अंदर छिप जाती है
  g.add(mesh(sph(r * 0.6, 18, 12), std({ color: irisCol, roughness: 0.2 }), 0, 0, r * 0.84, 1, 1, 0.34, 0, 0, 0, false));
  g.add(mesh(sph(r * 0.3, 14, 10), std({ color: 0x050302, roughness: 0.08 }), 0, 0, r * 0.95, 1, 1, 0.3, 0, 0, 0, false));
  g.add(mesh(sph(r * 0.11, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), r * 0.2, r * 0.22, r * 1.04, 1, 1, 0.4, 0, 0, 0, false));
  return g;
}

// ======================= ढाँचा (हड्डियाँ) =======================
// मॉडल +z देखता है (गोलू की तरह फिर 180° घूमता है); दायाँ = -x. हड्डियाँ बिना घुमाव — कोण सीधे pose() से.
class Rig {
  constructor(o) {
    this.o = o;
    const root = this.root = new THREE.Group();
    const body = this.body = new THREE.Group();
    root.add(body);
    this.model = new THREE.Group(); this.model.rotation.y = PI; this.model.scale.setScalar(o.scale || 1);
    body.add(this.model);
    const J = this.J = {};
    const G = (name, par, x, y, z) => { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); (par || this.model).add(g); J[name] = g; return g; };
    G('hips', null, 0, 0, 0);
    G('thighR', J.hips, -o.hipW, 0, 0); G('thighL', J.hips, o.hipW, 0, 0);
    G('shinR', J.thighR, 0, -o.thigh, 0); G('shinL', J.thighL, 0, -o.thigh, 0);
    G('spine', J.hips, 0, o.spineY || 0, 0);
    G('head', J.spine, 0, o.headY, o.headZ || 0);
    G('armR', J.spine, -o.shW, o.shY, o.shZ || 0); G('armL', J.spine, o.shW, o.shY, o.shZ || 0);
    G('foreR', J.armR, 0, -o.upper, 0); G('foreL', J.armL, 0, -o.upper, 0);
    this.hipH = (o.thigh + o.shin + (o.foot || 0.05)) * (o.scale || 1);
    // झोला दाहिने हाथ में (गोलू के हाथ जैसा) — झोला अपना पैमाना ख़ुद ठीक कर लेता है
    this.handR = new THREE.Object3D(); this.handR.position.set(0, -o.fore - 0.04, 0.02); J.foreR.add(this.handR);
    // हेलमेट (डिलीवरी) — गोलू के सिर की हड्डी जैसी जगह/पैमाना
    const ha = new THREE.Object3D(); ha.position.set(0, o.helmY, o.helmZ || 0); ha.scale.setScalar(2.25 * (o.helmK || 0.6)); J.head.add(ha);
    this.B = { head: ha, spine: J.spine };
    // छाया + लड्डू कवच
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62 * (o.shadowK || 1), 24), new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -PI / 2; this.shadow.position.y = 0.02; root.add(this.shadow);
    this.aura = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 18), new THREE.MeshBasicMaterial({ color: 0xffb23c, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.aura.position.y = 1.1; this.aura.visible = false; root.add(this.aura);
    this.phase = 0; this.spin = 0; this.eatT = 0; this.scale = 1; this.glow = 0; this.cur = null;
    this.atts = []; this.wa = null; this.fx = null; this.glowMats = [];
  }
  wear() { } // कपड़े सिर्फ़ गोलू के — ये अपने रूप में ही
  setGlow(v) {
    if (Math.abs(v - this.glow) < 0.01) return;
    this.glow = v;
    for (const mt of this.glowMats) mt.emissive.setRGB(0.5 * v, 0.26 * v, 0.02 * v);
  }
  eat() { this.eatT = 0.16; }
  land(k) { this.landT = 0.2; this.landK = k; }
  update(dt, mode, o = {}) {
    const S = this.o, k = (cur, tgt, spd = 16) => cur + (tgt - cur) * (1 - Math.exp(-spd * dt));
    const sp = o.speed || 14, run = mode === 'run' || mode === 'stumble';
    this.phase += dt * (run || mode === 'carry' || mode === 'runPhone' ? (o.walk ? 6.5 : (8 + sp * 0.34) * (S.cadence || 1)) : mode === 'dance' ? 6.5 : mode === 'fly' ? 4 : mode === 'boat' ? 5 : 3);
    const P = Golu.prototype.pose.call(this, mode, this.phase, sp, o);
    // अपना अंदाज़
    P.spX += S.lean || 0;
    P.oR += S.armOut || 0; P.oL += S.armOut || 0;
    if (S.crouch && mode !== 'roll' && mode !== 'dead' && mode !== 'jump') { P.tR += S.crouch[0]; P.tL += S.crouch[0]; P.kR += S.crouch[1]; P.kL += S.crouch[1]; P.by -= 0.06; }
    if (S.armSwing && run) { P.aR = -4 + (P.aR + 4) * S.armSwing; P.aL = -4 + (P.aL + 4) * S.armSwing; }
    if (S.ballRoll && mode === 'roll') { P.tR = P.tL = 95; P.kR = P.kL = 120; P.aR = P.aL = 40; P.eR = P.eL = 90; P.oR = P.oL = 10; P.by = -0.12; P.bx = 0; P.spX = 0; P.hdX = 0; P.sq = 0.95; }
    if (!this.cur) this.cur = { ...P };
    const C = this.cur, spd = run ? (this.prevMode === 'roll' || this.prevMode === 'jump' ? 26 : 40) : mode === 'roll' ? 30 : mode === 'jump' ? 22 : 18;
    for (const key in P) C[key] = k(C[key], P[key], key === 'by' || key === 'bx' || key === 'bz' ? 14 : spd);
    const J = this.J;
    J.thighR.rotation.x = -C.tR * D2R; J.thighL.rotation.x = -C.tL * D2R;
    J.shinR.rotation.x = C.kR * D2R; J.shinL.rotation.x = C.kL * D2R;
    J.armR.rotation.set(-C.aR * D2R, 0, -(C.oR - 6) * D2R);
    J.armL.rotation.set(-C.aL * D2R, 0, (C.oL - 6) * D2R);
    J.foreR.rotation.x = -C.eR * D2R; J.foreL.rotation.x = -C.eL * D2R;
    J.hips.rotation.y = C.hipY * D2R;
    J.spine.rotation.set((C.spX - 6) * D2R, C.spY * D2R, 0);
    this.look = k(this.look || 0, o.look || 0, 9);
    J.spine.rotation.y += this.look * 0.35;
    J.head.rotation.set(C.hdX * D2R - (S.lean || 0) * 0.6 * D2R, -C.spY * 0.5 * D2R + this.look * 1.15, C.hdZ * D2R);
    this.eatT = Math.max(0, this.eatT - dt);
    J.head.scale.setScalar(k(J.head.scale.x, this.eatT > 0 ? 1.07 : 1, 30));
    const b = this.body;
    b.position.y = this.hipH * 0.97 + C.by * (S.byK || 1);
    // रसगुल्ला राजा फिसलते समय गेंद बनकर आगे लुढ़कता है
    if (S.ballRoll && mode === 'roll') this.ballSpin = (this.ballSpin || 0) + dt * sp / 0.75; else this.ballSpin = 0;
    if (o.flip != null && !o.tx && !o.tz) { this.rx0 = -o.flip * PI * 2 - C.bx; }
    else { const r = this.rx0 == null ? b.rotation.x : this.rx0; this.rx0 = k(((r % (PI * 2)) + PI * 3) % (PI * 2) - PI, -C.bx, mode === 'roll' ? 22 : this.prevMode === 'roll' ? 16 : 12); }
    this.rz0 = k(this.rz0 || 0, C.bz, 12);
    b.rotation.x = this.rx0 + (o.tx || 0) - this.ballSpin;
    b.rotation.z = this.rz0 + (o.tz || 0);
    this.landT = Math.max(0, (this.landT || 0) - dt); const lq = this.landT > 0 ? Math.sin((1 - this.landT / 0.2) * PI) * (this.landK || 0) : 0;
    b.scale.set(C.sq * (1 + lq * 0.07), C.sq * (1 - lq * 0.13), C.sq * (1 + lq * 0.07)); this.prevMode = mode;
    this.scale = k(this.scale, o.big ? 1.45 : 1, 6);
    this.root.scale.setScalar(this.scale);
    const hy = (o.y || 0) - (o.gy || 0);
    this.shadow.scale.setScalar(Math.max(0.35, 1 - hy * 0.18));
    this.shadow.position.y = 0.02 - hy / this.scale;
    this.wt = (this.wt || 0) + dt;
    if (this.anim) this.anim(this.wt, run ? sp : mode === 'fly' ? 22 : 0, mode, dt);
    this.aura.visible = !!o.shield;
    if (o.shield) { this.aura.rotation.y += dt * 2; this.aura.scale.setScalar(1 + Math.sin(this.phase * 0.7) * 0.04); }
  }
}

// जोड़ों पर गोले (घुटना/कोहनी/कलाई/टखना/कंधा) — अंगों के बीच दरार न दिखे, शरीर एक-सा लगे
function joints(J, mat, k) {
  for (const s of ['R', 'L']) {
    J['thigh' + s].add(mesh(sph(k.hip, 14, 10), mat, 0, 0, 0));
    J['shin' + s].add(mesh(sph(k.knee, 14, 10), mat, 0, 0, 0));
    J['arm' + s].add(mesh(sph(k.sh, 14, 10), mat, 0, 0, 0));
    J['fore' + s].add(mesh(sph(k.elb, 14, 10), mat, 0, 0, 0));
  }
}
// आँख को सतह की दिशा (normal) में घुमाओ — पुतली बाहर देखे
const _z = new THREE.Vector3(0, 0, 1);
function faceOut(o, nx, ny, nz) { o.quaternion.setFromUnitVectors(_z, new THREE.Vector3(nx, ny, nz).normalize()); }

// ======================= 🐒 बंटी बंदर =======================
function buildBunty() {
  const r = new Rig({ scale: 1.15, hipW: 0.12, thigh: 0.36, shin: 0.36, foot: 0.06, spineY: 0.02, headY: 0.72, headZ: 0.08, shW: 0.2, shY: 0.56, upper: 0.42, fore: 0.44,
    lean: 26, armOut: 5, cadence: 1.08, crouch: [22, 40], helmY: -0.06, helmZ: 0.02, helmK: 0.7, shadowK: 0.85 });
  const J = r.J;
  // रीसस बंदर: ऊपर भूरा-जैतूनी, कमर-कूल्हे पर नारंगी झलक, पेट हल्का
  const furBack = furTex('#7a5e40', '#a8875a', '#45331f', 256, 8, 14), furRump = furTex('#93643a', '#b9854f', '#5e3f22', 256, 8, 14), furBelly = furTex('#b39a76', '#d2bd98', '#857052', 256, 6, 16);
  const fur = std({ map: furBack.map, normalMap: furBack.nrm, roughness: 0.95, normalScale: new THREE.Vector2(1.4, 1.4) });
  const furR = std({ map: furRump.map, normalMap: furRump.nrm, roughness: 0.95, normalScale: new THREE.Vector2(1.4, 1.4) });
  const furL = std({ map: furBelly.map, normalMap: furBelly.nrm, roughness: 0.95 });
  for (const m of [fur, furR]) { m.map.repeat.set(3, 2); m.normalMap.repeat.set(3, 2); }
  const face = skinTex('#c98472', 'rgba(150,55,50,1)');
  const faceM = std({ map: face.map, normalMap: face.nrm, roughness: 0.5 });
  const palm = std({ color: 0x3a2a20, roughness: 0.65 });
  r.glowMats.push(fur, furR, furL, faceM);
  joints(J, fur, { hip: 0.1, knee: 0.075, sh: 0.085, elb: 0.06 });
  for (const s of ['R', 'L']) {
    J['thigh' + s].add(mesh(limb(0.36, [0.105, 0.098, 0.075]), furR));
    J['shin' + s].add(mesh(limb(0.36, [0.074, 0.066, 0.05]), fur));
    // लंबा पंजा, उँगलियाँ
    const foot = new THREE.Group(); foot.position.set(0, -0.38, 0.05); J['shin' + s].add(foot);
    foot.add(mesh(organ([[0.04, -0.1], [0.058, 0.0], [0.05, 0.1]], 12), palm, 0, 0, 0, 1, 1, 0.7, PI / 2, 0, 0));
    for (let f = 0; f < 4; f++) foot.add(mesh(organ([[0.012, -0.05], [0.014, 0.0]], 6), palm, -0.03 + f * 0.02, -0.005, 0.13, 1, 1, 1, PI / 2, 0, 0, false));
  }
  // धड़: नाशपाती जैसा; पीठ गहरी, पेट हल्का
  J.spine.add(mesh(organ([[0.18, 0.0], [0.25, 0.15], [0.245, 0.34], [0.215, 0.5], [0.12, 0.64]], 22), fur, 0, 0, 0, 1, 1, 0.85));
  J.spine.add(mesh(sph(0.2, 18, 14), furL, 0, 0.27, 0.1, 0.95, 1.3, 0.62));
  J.hips.add(mesh(sph(0.2, 18, 14), furR, 0, 0.02, -0.04, 1.15, 0.85, 1)); // कूल्हे
  // पूँछ — पीछे से ऊपर मुड़ी, चलते हुए झूलती
  const tail = new THREE.Group(); tail.position.set(0, 0.06, -0.18); J.hips.add(tail);
  tail.add(mesh(tube([[0, 0, 0], [0, -0.08, -0.25], [0, 0.02, -0.52], [0, 0.26, -0.68], [0, 0.46, -0.66]], 0.036, 28, 8), furR));
  // गले में लाल-सफ़ेद गमछा
  const gam = clothTex('#c61f22', ['#c61f22', '#f4eee2', '#7a0d10']);
  const gamM = std({ map: gam.map, normalMap: gam.nrm, roughness: 0.9 });
  J.spine.add(mesh(new THREE.TorusGeometry(0.135, 0.045, 10, 22), gamM, 0, 0.6, 0.02, 1, 1, 1, PI / 2 - 0.25, 0, 0));
  J.spine.add(mesh(organ([[0.03, -0.16], [0.045, 0.0]], 8), gamM, 0.1, 0.55, -0.12, 1, 1, 0.35, 0.5, 0, -0.3)); // गमछे का सिरा पीछे
  // सिर: रोएँदार खोपड़ी, चपटा गुलाबी चेहरा, आगे निकला थूथन, भौंह की उभरी हड्डी
  const H = J.head;
  H.add(mesh(sph(0.21, 24, 18), fur, 0, 0.05, -0.03, 1, 0.95, 1));
  H.add(mesh(sph(0.165, 22, 16), faceM, 0, 0.02, 0.07, 0.92, 0.98, 0.75));
  H.add(mesh(sph(0.11, 18, 12), faceM, 0, -0.065, 0.165, 1.05, 0.78, 0.95)); // थूथन
  H.add(mesh(sph(0.12, 16, 10), fur, 0, 0.12, 0.1, 1.25, 0.36, 0.62)); // भौंह की हड्डी
  H.add(mesh(sph(0.15, 16, 10), fur, 0, -0.02, 0.0, 1.3, 1.0, 0.8)); // गाल के रोएँ
  for (const s of [-1, 1]) {
    const e = eye(0x7a4314, 0.03); e.position.set(0.062 * s, 0.055, 0.175); faceOut(e, 0.15 * s, 0.05, 1); H.add(e);
    H.add(mesh(sph(0.055, 14, 10), faceM, 0.062 * s, 0.085, 0.172, 1.1, 0.45, 0.6, 0, 0, 0, false)); // ऊपरी पलक
    H.add(mesh(sph(0.065, 14, 10), faceM, 0.2 * s, 0.04, -0.02, 0.42, 1, 0.9)); // कान
    H.add(mesh(sph(0.012, 8, 6), palm, 0.022 * s, -0.045, 0.26, 1, 0.7, 0.6, 0, 0, 0, false)); // नथुने
  }
  H.add(mesh(tube([[-0.045, -0.12, 0.225], [0, -0.132, 0.236], [0.045, -0.12, 0.225]], 0.008, 10, 5), palm)); // मुँह
  for (const s of ['R', 'L']) {
    J['arm' + s].add(mesh(limb(0.42, [0.08, 0.072, 0.058]), fur));
    J['fore' + s].add(mesh(limb(0.44, [0.06, 0.054, 0.044]), fur));
    const hand = new THREE.Group(); hand.position.set(0, -0.47, 0.01); J['fore' + s].add(hand);
    hand.add(mesh(organ([[0.035, -0.07], [0.045, 0], [0.04, 0.04]], 12), palm, 0, 0, 0, 1, 1, 0.6));
    for (let f = 0; f < 4; f++) hand.add(mesh(organ([[0.011, -0.06], [0.013, 0.0]], 6), palm, -0.027 + f * 0.018, -0.07, 0.01, 1, 1, 1, 0.3, 0, 0, false));
  }
  r.anim = (t, sp) => { tail.rotation.x = 0.15 + Math.sin(t * 7) * 0.12 * (sp ? 1 : 0.4); tail.rotation.z = Math.sin(t * 3.5) * 0.25; };
  return r;
}

// ======================= 💪 पहलवान चाचा =======================
function buildPahalwan() {
  const r = new Rig({ scale: 1.08, hipW: 0.16, thigh: 0.52, shin: 0.5, foot: 0.07, spineY: 0.05, headY: 0.93, headZ: 0.03, shW: 0.4, shY: 0.6, upper: 0.42, fore: 0.38,
    lean: 6, armOut: 12, armSwing: 0.8, cadence: 0.92, helmY: -0.06, helmZ: 0.0, helmK: 0.62, shadowK: 1.15 });
  const J = r.J;
  const sk = skinTex('#7e4a2e', 'rgba(95,40,22,1)');
  const skin = std({ map: sk.map, normalMap: sk.nrm, roughness: 0.46, metalness: 0.02 }); // तेल लगा बदन — हल्की चमक
  const hair = std({ color: 0x120d0a, roughness: 0.55 });
  const lang = clothTex('#9c1119');
  const langM = std({ map: lang.map, normalMap: lang.nrm, roughness: 0.85 });
  const gamT = clothTex('#d8700f', ['#d8700f', '#efb441', '#9a4606']);
  const gamM = std({ map: gamT.map, normalMap: gamT.nrm, roughness: 0.88, side: THREE.DoubleSide });
  const gold = std({ color: 0xc9962e, roughness: 0.3, metalness: 0.85 });
  const wood = std({ color: 0x5e3b1f, roughness: 0.7 });
  r.glowMats.push(skin, langM);
  joints(J, skin, { hip: 0.16, knee: 0.115, sh: 0.13, elb: 0.1 });
  for (const s of ['R', 'L']) {
    J['thigh' + s].add(mesh(organ([[0.115, -0.52], [0.15, -0.32], [0.175, -0.12], [0.165, 0]], 18), skin));
    J['shin' + s].add(mesh(organ([[0.075, -0.5], [0.1, -0.33], [0.125, -0.16], [0.105, 0]], 18), skin));
    J['shin' + s].add(mesh(sph(0.075, 12, 8), skin, 0, -0.5, 0)); // टखना
    J['shin' + s].add(mesh(organ([[0.06, -0.13], [0.085, 0], [0.07, 0.12]], 12), skin, 0, -0.55, 0.07, 1, 0.65, 1, PI / 2, 0, 0)); // नंगे पाँव
  }
  // लाल लंगोट + कमर पर केसरिया गमछा
  J.hips.add(mesh(organ([[0.27, -0.17], [0.3, -0.04], [0.3, 0.1]], 22), langM, 0, 0, 0, 1, 1, 0.78));
  J.hips.add(mesh(organ([[0.07, -0.34], [0.11, -0.12], [0.1, 0.0]], 12), langM, 0, -0.02, 0.2, 1, 1, 0.3, 0.1, 0, 0));
  J.hips.add(mesh(new THREE.TorusGeometry(0.29, 0.042, 10, 26), gamM, 0, 0.1, 0, 1, 0.78, 1, PI / 2, 0, 0));
  // धड़: चौड़ी छाती, कंधे, हल्का पेट
  const sp = J.spine;
  sp.add(mesh(organ([[0.26, 0.0], [0.29, 0.14], [0.31, 0.28], [0.37, 0.45], [0.38, 0.58], [0.28, 0.7], [0.13, 0.77]], 24), skin, 0, 0, 0, 1, 1, 0.72));
  sp.add(mesh(sph(0.22, 20, 14), skin, 0, 0.18, 0.1, 1.05, 0.85, 0.62)); // पेट
  for (const s of [-1, 1]) {
    sp.add(mesh(sph(0.15, 18, 12), skin, 0.135 * s, 0.5, 0.17, 1.05, 0.75, 0.55)); // छाती
    sp.add(mesh(sph(0.145, 18, 12), skin, 0.36 * s, 0.6, 0, 1, 0.95, 1)); // कंधे की मांसपेशी
    sp.add(mesh(sph(0.12, 14, 10), skin, 0.18 * s, 0.7, -0.02, 1.2, 0.6, 0.9)); // गर्दन से कंधे
    sp.add(mesh(sph(0.03, 8, 6), std({ color: 0x5a2e1c, roughness: 0.6 }), 0.14 * s, 0.47, 0.25, 1, 1, 0.5, 0, 0, 0, false));
  }
  sp.add(mesh(organ([[0.115, 0.7], [0.12, 0.86]], 16), skin)); // गर्दन
  // पीठ पर गदा (तिरछी)
  const gada = new THREE.Group(); gada.position.set(0.05, 0.45, -0.3); gada.rotation.set(0, 0, 0.55); sp.add(gada);
  gada.add(mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.9, 10), wood, 0, 0, 0));
  gada.add(mesh(sph(0.17, 20, 14), gold, 0, 0.55, 0));
  for (let i = 0; i < 4; i++) gada.add(mesh(new THREE.TorusGeometry(0.168, 0.012, 6, 24), gold, 0, 0.55, 0, 1, 1, 1, 0, i * PI / 4, 0));
  gada.add(mesh(new THREE.ConeGeometry(0.05, 0.12, 10), gold, 0, 0.75, 0));
  // कंधे से कमर तक तिरछा केसरिया गमछा
  sp.add(mesh(new THREE.TorusGeometry(0.42, 0.045, 8, 30, PI * 1.05), gamM, 0.02, 0.4, 0.0, 1, 1.05, 0.78, 0, 0, 2.0));
  // सिर: मुंडा सिर, चुटिया, ताव वाली मूँछ, तिलक
  const H = J.head;
  H.add(mesh(sph(0.172, 24, 18), skin, 0, 0.06, -0.01, 0.92, 1.05, 1));
  H.add(mesh(sph(0.135, 20, 14), skin, 0, -0.03, 0.035, 1, 0.82, 1)); // जबड़ा
  H.add(mesh(sph(0.034, 14, 10), skin, 0, 0.0, 0.158, 0.85, 1.15, 0.9)); H.add(mesh(sph(0.026, 10, 8), skin, 0, -0.03, 0.172, 1.5, 0.8, 0.9)); // नाक
  H.add(mesh(new THREE.ConeGeometry(0.03, 0.1, 8), hair, 0, 0.25, -0.09, 1, 1, 1, -0.6, 0, 0)); // चुटिया
  H.add(mesh(new THREE.BoxGeometry(0.014, 0.06, 0.01), std({ color: 0xc0151c, roughness: 0.6 }), 0, 0.13, 0.162, 1, 1, 1, -0.2, 0, 0, false)); // तिलक
  for (const s of [-1, 1]) {
    const e = eye(0x2b1a0e, 0.023); e.position.set(0.06 * s, 0.065, 0.138); faceOut(e, 0.15 * s, 0, 1); H.add(e);
    H.add(mesh(sph(0.04, 12, 8), skin, 0.06 * s, 0.088, 0.14, 1.2, 0.45, 0.6, 0, 0, 0, false)); // पलक
    H.add(mesh(new THREE.BoxGeometry(0.075, 0.02, 0.02), hair, 0.06 * s, 0.108, 0.15, 1, 1, 1, 0, 0, -0.12 * s, false)); // घनी भौंह
    H.add(mesh(sph(0.042, 12, 8), skin, 0.165 * s, 0.04, 0, 0.45, 1, 0.8)); // कान
    H.add(mesh(tube([[0.008 * s, -0.038, 0.165], [0.06 * s, -0.052, 0.155], [0.11 * s, -0.038, 0.125], [0.14 * s, 0.0, 0.1]], 0.017, 14, 7), hair)); // मूँछ
  }
  for (const s of ['R', 'L']) {
    J['arm' + s].add(mesh(organ([[0.1, -0.42], [0.125, -0.25], [0.142, -0.12], [0.13, 0]], 18), skin));
    J['fore' + s].add(mesh(organ([[0.075, -0.38], [0.1, -0.22], [0.112, -0.08], [0.1, 0]], 18), skin));
    J['fore' + s].add(mesh(sph(0.088, 14, 10), skin, 0, -0.44, 0.01, 0.95, 1.1, 0.85)); // मुट्ठी
  }
  return r;
}

// ======================= 🍮 रसगुल्ला राजा =======================
function buildRaja() {
  const R = 0.6;
  const r = new Rig({ hipW: 0.16, thigh: 0.28, shin: 0.28, foot: 0.06, spineY: 0.02, headY: 0.5, headZ: 0, shW: 0.55, shY: 0.47, upper: 0.3, fore: 0.28,
    lean: 0, armOut: 18, cadence: 1.15, byK: 0.6, ballRoll: true, helmY: R - 0.53 * 1.4 - 0.05, helmZ: 0, helmK: 1.4, shadowK: 1.05 });
  const J = r.J;
  // असली रसगुल्ला: दूधिया-सफ़ेद, स्पंज के छेद, चाशनी की हल्की चमक
  const ras = std({ color: 0xfdf8ee, map: RT.rasgullaC || null, normalMap: RT.spongeN || null, roughness: 0.32, normalScale: new THREE.Vector2(1.3, 1.3) });
  const chhena = std({ color: 0xf4ecdb, map: RT.rasgullaC || null, normalMap: RT.spongeN || null, roughness: 0.45, normalScale: new THREE.Vector2(1.1, 1.1) });
  const syrup = std({ color: 0xf7e7b0, roughness: 0.04, transparent: true, opacity: 0.55 });
  const gold = std({ color: 0xd4a43a, roughness: 0.28, metalness: 0.9 });
  const brow = std({ color: 0x6a4a2c, roughness: 0.6 });
  r.glowMats.push(ras, chhena);
  joints(J, chhena, { hip: 0.09, knee: 0.08, sh: 0.085, elb: 0.072 });
  for (const s of ['R', 'L']) {
    J['thigh' + s].add(mesh(limb(0.28, [0.09, 0.085, 0.075]), chhena));
    J['shin' + s].add(mesh(limb(0.28, [0.075, 0.07, 0.062]), chhena));
    // सुनहरी नागरा जूती, आगे मुड़ी नोक
    J['shin' + s].add(mesh(organ([[0.05, -0.11], [0.072, 0.0], [0.045, 0.13]], 12), gold, 0, -0.31, 0.05, 1, 0.6, 1, PI / 2, 0, 0));
    J['shin' + s].add(mesh(new THREE.ConeGeometry(0.022, 0.08, 8), gold, 0, -0.28, 0.21, 1, 1, 1, -0.9, 0, 0));
  }
  // गोल शरीर (रीढ़ पर) — कुछ चाशनी की बूँदें
  J.spine.add(mesh(sph(R, 44, 32), ras, 0, 0.5, 0));
  for (let i = 0; i < 10; i++) {
    const a = rnd() * PI * 2, el = -0.1 - rnd() * 0.75, n = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
    const d = mesh(sph(0.024 + rnd() * 0.018, 10, 8), syrup, n[0] * R, 0.5 + n[1] * R, n[2] * R, 1, 1, 1, 0, 0, 0, false);
    faceOut(d, n[0], n[1], n[2]); d.scale.set(1, 1.9 + rnd(), 0.5); J.spine.add(d);
  }
  // चेहरा (सिर की हड्डी गोले के बीच में — घूमे तो लगे पूरा रसगुल्ला मुड़ा)
  const H = J.head;
  for (const s of [-1, 1]) {
    const n = new THREE.Vector3(0.28 * s, 0.2, 0.94).normalize();
    const e = eye(0x4a2810, 0.072); e.position.copy(n).multiplyScalar(R - 0.035); faceOut(e, n.x, n.y, n.z); H.add(e);
    // ऊपरी पलकों की गहरी रेखा (सफ़ेद पर सफ़ेद आँख अलग दिखे) + हल्का गड्ढा
    const lash = mesh(new THREE.TorusGeometry(0.076, 0.0075, 6, 18, PI * 0.9), std({ color: 0x3a2414, roughness: 0.5 }), 0, 0, 0, 1, 1, 1, 0, 0, 0, false);
    lash.position.copy(e.position); lash.quaternion.copy(e.quaternion); lash.rotateZ(PI * 0.05); lash.translateZ(0.012); H.add(lash);
    const sock = mesh(sph(0.088, 16, 10), std({ color: 0xe6d6bc, roughness: 0.5 }), 0, 0, 0, 1, 1, 0.25, 0, 0, 0, false);
    sock.position.copy(n).multiplyScalar(R - 0.012); sock.quaternion.copy(e.quaternion); H.add(sock);
    H.add(mesh(tube([[0.1 * s, 0.27, R * 0.9], [0.17 * s, 0.3, R * 0.87], [0.25 * s, 0.27, R * 0.8]], 0.013, 10, 6), brow));
  }
  H.add(mesh(tube([[-0.11, -0.05, R * 0.97], [-0.05, -0.1, R * 0.99], [0.05, -0.1, R * 0.99], [0.11, -0.05, R * 0.97]], 0.014, 16, 6), std({ color: 0x7a2a22, roughness: 0.4 }))); // मुस्कान
  // सोने का मुकुट (लाल-हरे नग)
  const crown = new THREE.Group(); crown.position.set(0.04, R - 0.03, -0.02); crown.rotation.set(-0.12, 0, -0.1); H.add(crown);
  crown.add(mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 28, 1, true), std({ color: 0xd4a43a, roughness: 0.28, metalness: 0.9, side: THREE.DoubleSide }), 0, 0.06, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * PI * 2;
    crown.add(mesh(new THREE.ConeGeometry(0.035, 0.12, 8), gold, Math.cos(a) * 0.205, 0.17, Math.sin(a) * 0.205));
    crown.add(mesh(sph(0.018, 8, 6), gold, Math.cos(a) * 0.205, 0.24, Math.sin(a) * 0.205, 1, 1, 1, 0, 0, 0, false));
    if (i % 2 === 0) { const gm = mesh(sph(0.024, 10, 8), std({ color: [0xb3121c, 0x1f7a44][i / 2 % 2], roughness: 0.12 }), Math.cos(a) * 0.222, 0.06, Math.sin(a) * 0.222, 1, 1, 0.55, 0, 0, 0, false); faceOut(gm, Math.cos(a), 0, Math.sin(a)); crown.add(gm); }
  }
  // हाथ (छेने के), मुट्ठी छोटा रसगुल्ला
  for (const s of ['R', 'L']) {
    J['arm' + s].add(mesh(limb(0.3, [0.078, 0.072, 0.064]), chhena));
    J['fore' + s].add(mesh(limb(0.28, [0.064, 0.06, 0.056]), chhena));
    J['fore' + s].add(mesh(sph(0.082, 16, 12), chhena, 0, -0.32, 0.01));
  }
  // मैरून मख़मली केप, सुनहरी किनारी — गोले की पीठ से लिपटी, दौड़ में पीछे लहराती
  const W = 12, Hh = 10, cw = 0.62, ch = 0.72; // छोटा केप — पीछे से भी रसगुल्ला दिखे
  const geo = new THREE.PlaneGeometry(cw, ch, W, Hh); geo.translate(0, -ch / 2, 0);
  const pos = geo.attributes.position, colors = [], cM = new THREE.Color(0x6e0b16), cG = new THREE.Color(0xd9a93a);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), kk = -y / ch;
    pos.setX(i, x * (0.7 + 0.45 * kk));
    const edge = y < -ch + 0.07 || Math.abs(pos.getX(i)) > (cw / 2) * (0.7 + 0.45 * kk) - 0.05;
    const c = edge ? cG : cM; colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const base = Float32Array.from(pos.array);
  const capeM = std({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 });
  const top = 0.5 + R * 0.78;
  const cape = mesh(geo, capeM, 0, top, 0); J.spine.add(cape);
  r.anim = (t, spd) => {
    const f = 0.5 + Math.min(1.5, spd / 16);
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], yy = top + y - 0.5; // गोले के केंद्र के सापेक्ष
      const kk = -y / ch, hug = -Math.sqrt(Math.max(0, R * R * 1.1 - yy * yy)) - 0.035;
      pos.setZ(i, hug - kk * kk * 0.25 * f - Math.sin(t * 8 + kk * 5 + x * 5) * 0.04 * kk * f);
    }
    pos.needsUpdate = true; geo.computeVertexNormals();
  };
  r.anim(0, 0);
  return r;
}

export const CHARS = {
  c_bunty: { build: buildBunty, power: 'jump' },
  c_pahal: { build: buildPahalwan, power: 'smash' },
  c_raja: { build: buildRaja, power: 'magnet' },
};
export function makeChar(id) { const c = CHARS[id]; return c ? c.build() : null; }
