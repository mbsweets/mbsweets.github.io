// गोलू — मालिक की दी हुई तस्वीर जैसा: मोटा-प्यारा मिथिला का बच्चा
// लाल-सफ़ेद चेक गमछे की पगड़ी, कंधे पर गमछा, क्रीम कुर्ता (बटन), लाल किनारी वाली सफ़ेद धोती, भूरी चप्पल, लाल टीका, कलाई पर लाल धागा
import * as THREE from './three.module.min.js';
import { GRAD, toon, basic, addOutline, outlineMat, mat4, Merge } from './art.js';

const PI = Math.PI;
const SKIN = 0xf3c39b, SKIN_D = 0xe5a982, HAIR = 0x1f1410, WHITE = 0xffffff, IRIS = 0x5a3216, BLACK = 0x140c0a;
const KURTA = 0xf4ecdc, DHOTI = 0xfbfaf6, RED = 0xe0263a, SANDAL = 0x5b3523, SANDAL_D = 0x3f2418, CHEEK = 0xf29c93;

function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.anisotropy = 4;
  return t;
}
// गमछे का चेक (लाल-सफ़ेद)
function gingham(x, w, h, n = 8) {
  x.fillStyle = '#fbf6f2'; x.fillRect(0, 0, w, h);
  const s = w / n;
  x.fillStyle = 'rgba(214,28,52,0.55)';
  for (let i = 0; i < n; i++) { x.fillRect(i * s, 0, s * 0.5, h); x.fillRect(0, i * s, w, s * 0.5); }
  x.fillStyle = 'rgba(190,20,40,0.35)';
  for (let i = 0; i < n; i++) { x.fillRect(i * s + s * 0.62, 0, s * 0.08, h); x.fillRect(0, i * s + s * 0.62, w, s * 0.08); }
}
const gamTex = (rx, ry) => canvasTex(256, 256, (x, w, h) => gingham(x, w, h), rx, ry);
// कंधे वाला गमछा: लंबाई में चेक + दोनों सिरों पर झालर
const scarfTex = () => canvasTex(1024, 128, (x, w, h) => {
  for (let i = 0; i < w; i += 128) { x.save(); x.translate(i, 0); gingham(x, 128, 128, 6); x.restore(); }
  x.fillStyle = '#fbf6f2';
  for (const e of [0, w - 46]) { x.fillRect(e, 0, 46, h); }
  x.strokeStyle = 'rgba(214,28,52,0.8)'; x.lineWidth = 3;
  for (let y = 4; y < h; y += 9) { x.beginPath(); x.moveTo(0, y); x.lineTo(46, y + 2); x.moveTo(w, y); x.lineTo(w - 46, y + 2); x.stroke(); }
});
// कुर्ता: क्रीम कपड़ा, सामने बटन-पट्टी (u=0/1), बगल की कटिंग
const kurtaTex = () => canvasTex(1024, 512, (x, w, h) => {
  x.fillStyle = '#f4ecdc'; x.fillRect(0, 0, w, h);
  x.globalAlpha = 0.07; x.fillStyle = '#7a6a50';
  for (let i = 0; i < 1600; i++) x.fillRect(Math.random() * w, Math.random() * h, 2, 2);
  x.globalAlpha = 1;
  x.strokeStyle = '#d9cdb5'; x.lineWidth = 5;
  for (const e of [0, w]) { x.beginPath(); x.moveTo(e, 40); x.lineTo(e, 230); x.stroke(); }
  x.strokeStyle = '#cbbd9f'; x.lineWidth = 3;
  for (const e of [w * 0.25, w * 0.75]) { x.beginPath(); x.moveTo(e, h); x.lineTo(e, h - 110); x.stroke(); }
  x.fillStyle = '#d8c7a5'; x.strokeStyle = '#a8916a'; x.lineWidth = 3;
  for (const y of [70, 120, 170]) for (const e of [0, w]) { x.beginPath(); x.arc(e, y, 13, 0, PI * 2); x.fill(); x.stroke(); }
});

// रिबन (गमछा) — बिंदुओं से होकर, चौड़ाई x-दिशा में
function ribbon(points, width, segs = 40, side = new THREE.Vector3(1, 0, 0)) {
  const curve = new THREE.CatmullRomCurve3(points);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, p = curve.getPoint(t);
    const tan = curve.getTangent(t);
    const nrm = new THREE.Vector3().crossVectors(tan, side).normalize();
    const sd = new THREE.Vector3().crossVectors(nrm, tan).normalize().multiplyScalar(width / 2);
    pos.push(p.x - sd.x, p.y - sd.y, p.z - sd.z, p.x + sd.x, p.y + sd.y, p.z + sd.z);
    uv.push(t, 0, t, 1);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export class Golu {
  constructor() {
    const vc = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.82 });
    const kurM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: kurtaTex(), roughness: 0.82 });
    const turM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: gamTex(3, 1.5), roughness: 0.82 });
    const turM2 = new THREE.MeshStandardMaterial({ color: 0xffffff, map: gamTex(1.2, 1.2), roughness: 0.82 });
    const scM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: scarfTex(), roughness: 0.82, side: THREE.DoubleSide });
    this.glowMats = [vc, kurM, turM, turM2, scM];
    const mesh = (mg, th = 0.02) => { const m = new THREE.Mesh(mg.build(), vc); if (th) addOutline(m, th); return m; };
    const root = this.root = new THREE.Group();
    const body = this.body = new THREE.Group();
    body.position.y = 0.8;
    root.add(body);
    // धोती का ऊपरी (फूला) हिस्सा
    const dp = [[0.001, -0.3], [0.2, -0.3], [0.34, -0.22], [0.4, -0.08], [0.4, 0.06], [0.36, 0.12], [0.001, 0.13]].map((a) => new THREE.Vector2(a[0], a[1]));
    const dm = new Merge();
    dm.add(new THREE.LatheGeometry(dp, 24), mat4(), DHOTI);
    dm.add(new THREE.ConeGeometry(0.08, 0.24, 10), mat4(0, -0.3, -0.31, -0.2, 0, 0), DHOTI); // सामने की चुन्नट
    body.add(mesh(dm, 0.022));
    // धड़ — कुर्ता (गोल-मटोल पेट)
    const torso = this.torso = new THREE.Group();
    body.add(torso);
    const tp = [[0.001, -0.2], [0.38, -0.19], [0.41, -0.05], [0.43, 0.12], [0.41, 0.3], [0.36, 0.44], [0.29, 0.53], [0.16, 0.58], [0.001, 0.6]].map((a) => new THREE.Vector2(a[0], a[1]));
    const tm = new THREE.Mesh(new THREE.LatheGeometry(tp, 32, PI, PI * 2), kurM);
    addOutline(tm, 0.025);
    torso.add(tm);
    const cm = new Merge();
    cm.add(new THREE.TorusGeometry(0.155, 0.028, 8, 22), mat4(0, 0.58, 0, PI / 2 + 0.1, 0, 0), KURTA); // गोल गला
    torso.add(mesh(cm, 0.015));
    // कंधे पर गमछा (बाएँ कंधे पर — सामने और पीछे लटकता)
    const sc = new THREE.Mesh(ribbon([
      new THREE.Vector3(0.24, -0.12, -0.44), new THREE.Vector3(0.24, 0.2, -0.43), new THREE.Vector3(0.25, 0.48, -0.3),
      new THREE.Vector3(0.28, 0.62, 0.0), new THREE.Vector3(0.25, 0.48, 0.32), new THREE.Vector3(0.22, 0.15, 0.45), new THREE.Vector3(0.2, -0.18, 0.44),
    ], 0.22, 48), scM);
    addOutline(sc, 0.012);
    torso.add(sc);
    // सिर
    const head = this.head = new THREE.Group();
    head.position.set(0, 0.97, 0);
    torso.add(head);
    const hm = new Merge(), ho = new Merge();
    const hg = new THREE.SphereGeometry(0.4, 28, 22); hg.scale(1.04, 1, 0.98);
    hm.add(hg, mat4(), SKIN); ho.add(hg, mat4(), 0);
    hm.add(new THREE.CylinderGeometry(0.13, 0.15, 0.2, 12), mat4(0, -0.42, 0.02), SKIN);
    // गोल-मटोल गाल
    for (const s of [-1, 1]) {
      const ch = new THREE.SphereGeometry(0.17, 14, 12);
      hm.add(ch, mat4(0.2 * s, -0.12, -0.2), SKIN); ho.add(ch, mat4(0.2 * s, -0.12, -0.2), 0);
      hm.add(new THREE.SphereGeometry(0.07, 10, 8), mat4(0.25 * s, -0.1, -0.345, 0, 0, 0, 1, 0.75, 0.3), CHEEK);
      const ear = new THREE.SphereGeometry(0.09, 10, 8);
      hm.add(ear, mat4(0.4 * s, -0.04, 0.02, 0, 0, 0, 0.55, 1, 0.85), SKIN); ho.add(ear, mat4(0.4 * s, -0.04, 0.02, 0, 0, 0, 0.55, 1, 0.85), 0);
      hm.add(new THREE.SphereGeometry(0.045, 8, 6), mat4(0.415 * s, -0.04, 0.0, 0, 0, 0, 0.4, 0.8, 0.7), SKIN_D);
      // बड़ी आँखें
      const ew = mat4(0.145 * s, 0.04, -0.325, 0, 0.26 * s, 0, 0.9, 1.12, 0.48);
      const ewG = new THREE.SphereGeometry(0.115, 18, 14);
      hm.add(ewG, ew, WHITE); ho.add(ewG, ew, 0);
      hm.add(new THREE.SphereGeometry(0.078, 16, 12), mat4(0.14 * s, 0.03, -0.37, 0, 0.26 * s, 0, 0.95, 1.05, 0.5), IRIS);
      hm.add(new THREE.SphereGeometry(0.043, 12, 10), mat4(0.139 * s, 0.03, -0.395), BLACK);
      hm.add(new THREE.SphereGeometry(0.024, 8, 6), mat4(0.12 * s, 0.065, -0.405), WHITE);
      hm.add(new THREE.SphereGeometry(0.011, 6, 5), mat4(0.158 * s, 0.0, -0.405), WHITE);
      // मोटी भौंहें
      hm.add(new THREE.TorusGeometry(0.085, 0.022, 6, 14, PI * 0.75), mat4(0.15 * s, 0.13, -0.355, 0.25, 0, PI * 0.125 + 0.06 * s), HAIR);
    }
    const nose = new THREE.SphereGeometry(0.05, 10, 8);
    hm.add(nose, mat4(0, -0.06, -0.39, 0, 0, 0, 1.1, 0.85, 0.9), SKIN_D); ho.add(nose, mat4(0, -0.06, -0.39, 0, 0, 0, 1.1, 0.85, 0.9), 0);
    // लाल टीका
    const tk = new THREE.SphereGeometry(0.03, 8, 8); tk.scale(0.8, 1.8, 0.5);
    hm.add(tk, mat4(0, 0.17, -0.383, -0.3, 0, 0), RED);
    // बाल (सामने झब्बा, बगल, पीछे गर्दन पर)
    for (let i = 0; i < 6; i++) hm.add(new THREE.ConeGeometry(0.07, 0.17, 6), mat4(-0.22 + i * 0.088, 0.23 - Math.abs(i - 2.5) * 0.015, -0.3, -1.25, 0, (i - 2.5) * 0.12), HAIR);
    for (const s of [-1, 1]) hm.add(new THREE.SphereGeometry(0.12, 10, 8), mat4(0.33 * s, 0.1, 0.02, 0, 0, 0, 0.45, 1, 0.9), HAIR);
    hm.add(new THREE.SphereGeometry(0.405, 22, 14, 0.06 * PI, 0.88 * PI, 0.16 * PI, 0.5 * PI), mat4(0, 0.0, 0.0), 0x2b1c17);
    for (let i = 0; i < 9; i++) { // गर्दन पर नुकीले बाल
      const a = PI * 0.12 + i / 8 * PI * 0.76, r = 0.36;
      hm.add(new THREE.ConeGeometry(0.06, 0.14, 6), mat4(-Math.cos(a) * r, -0.17, Math.sin(a) * r, PI - 0.5 * Math.sin(a), 0, 0.5 * Math.cos(a)), 0x2b1c17);
    }
    head.add(new THREE.Mesh(hm.build(), vc));
    head.add(new THREE.Mesh(ho.build(), outlineMat(0.024)));
    // खुला हँसता मुँह (दाँत + जीभ)
    const mouth = this.smile = new THREE.Group();
    const mIn = new THREE.Mesh(new THREE.CircleGeometry(0.105, 20, PI, PI), toon(0x7a1a24));
    mouth.add(mIn);
    const teeth = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.035), basic(0xffffff));
    teeth.position.set(0, -0.018, 0.002);
    mouth.add(teeth);
    const tongue = new THREE.Mesh(new THREE.CircleGeometry(0.055, 14, PI, PI), toon(0xe56a72));
    tongue.position.set(0, -0.05, 0.003); tongue.scale.set(1.2, 0.8, 1);
    mouth.add(tongue);
    mouth.position.set(0, -0.19, -0.372); mouth.rotation.set(0.38, PI, 0);
    head.add(mouth);
    this.mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), toon(0x7a1a24));
    this.mouthOpen.position.set(0, -0.2, -0.365); this.mouthOpen.scale.set(1.1, 0.01, 0.5);
    head.add(this.mouthOpen);
    // गमछे की पगड़ी (फूली हुई, कई लपेट + लटकता सिरा)
    const tur = this.turban = new THREE.Group();
    tur.position.set(0, 0.15, 0.0);
    head.add(tur);
    const add = (g, m, mat, th = 0.018) => { const x = new THREE.Mesh(g, mat); x.applyMatrix4(m); if (th) addOutline(x, th); tur.add(x); return x; };
    add(new THREE.SphereGeometry(0.45, 26, 16, 0, PI * 2, 0, 0.56 * PI), mat4(0, 0.02, 0.02, -0.1, 0, 0, 1.06, 0.78, 1.05), turM2);
    add(new THREE.TorusGeometry(0.41, 0.135, 14, 34), mat4(0, 0.0, 0.0, PI / 2 + 0.12, 0, 0, 1.03, 1.0, 1), turM);
    add(new THREE.TorusGeometry(0.36, 0.125, 14, 30), mat4(0.03, 0.14, 0.03, PI / 2 + 0.28, 0.12, 0.08, 1.04, 1.02, 1), turM);
    add(new THREE.SphereGeometry(0.15, 14, 12), mat4(0.07, 0.28, 0.05, 0, 0, 0, 1.25, 0.7, 1.05), turM2);
    // पगड़ी का लटकता सिरा (दाईं ओर, कान के पीछे)
    const tail = new THREE.Mesh(ribbon([
      new THREE.Vector3(-0.34, 0.06, 0.24), new THREE.Vector3(-0.44, -0.12, 0.3), new THREE.Vector3(-0.44, -0.36, 0.3), new THREE.Vector3(-0.4, -0.56, 0.26),
    ], 0.2, 24, new THREE.Vector3(0, 0, 1)), scM);
    addOutline(tail, 0.01);
    tur.add(tail);
    this.tail = tail;
    // हाथ (आधी बाँह कुर्ता, मुट्ठी)
    this.arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(0.37 * s, 0.44, 0);
      torso.add(sh);
      const up = new Merge();
      up.add(new THREE.CapsuleGeometry(0.125, 0.12, 4, 12), mat4(0, -0.1, 0), KURTA);
      up.add(new THREE.SphereGeometry(0.14, 12, 10), mat4(0, 0.0, 0), KURTA);
      sh.add(mesh(up, 0.02));
      const el = new THREE.Group();
      el.position.y = -0.24;
      sh.add(el);
      const lo = new Merge();
      lo.add(new THREE.CapsuleGeometry(0.088, 0.11, 4, 10), mat4(0, -0.08, 0), SKIN);
      lo.add(new THREE.SphereGeometry(0.105, 12, 10), mat4(0, -0.22, -0.01, 0, 0, 0, 1, 0.95, 1), SKIN);
      if (s < 0) lo.add(new THREE.TorusGeometry(0.085, 0.017, 6, 16), mat4(0, -0.14, 0, PI / 2, 0, 0), RED); // कलाई पर लाल धागा
      el.add(mesh(lo, 0.018));
      this.arms.push({ sh, el, s });
    }
    // पैर (धोती → नंगी पिंडली → चप्पल)
    this.legs = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0.15 * s, -0.08, 0);
      body.add(hip);
      const th = new Merge();
      th.add(new THREE.CapsuleGeometry(0.17, 0.12, 4, 12), mat4(0, -0.13, 0), DHOTI);
      th.add(new THREE.TorusGeometry(0.155, 0.035, 6, 18), mat4(0, -0.26, 0, PI / 2, 0, 0), RED); // लाल किनारी
      th.add(new THREE.TorusGeometry(0.15, 0.015, 6, 18), mat4(0, -0.21, 0, PI / 2, 0, 0), RED);
      hip.add(mesh(th, 0.02));
      const kn = new THREE.Group();
      kn.position.y = -0.3;
      hip.add(kn);
      const lg = new Merge();
      lg.add(new THREE.CapsuleGeometry(0.085, 0.14, 4, 10), mat4(0, -0.1, 0), SKIN);
      const foot = new THREE.CapsuleGeometry(0.075, 0.12, 4, 10); foot.rotateX(PI / 2);
      lg.add(foot, mat4(0, -0.27, -0.06), SKIN);
      for (let t = 0; t < 4; t++) lg.add(new THREE.SphereGeometry(0.028, 6, 5), mat4(-0.045 + t * 0.03, -0.27, -0.2), SKIN);
      const sole = new THREE.CapsuleGeometry(0.1, 0.18, 4, 10); sole.rotateX(PI / 2); sole.scale(1, 0.32, 1);
      lg.add(sole, mat4(0, -0.33, -0.05), SANDAL_D);
      lg.add(new THREE.TorusGeometry(0.075, 0.025, 6, 14, PI), mat4(0, -0.29, -0.09, 0, 0, 0, 1, 0.9, 1), SANDAL);
      lg.add(new THREE.TorusGeometry(0.07, 0.022, 6, 14, PI), mat4(0, -0.29, 0.04, 0, 0, 0, 1, 0.8, 1), SANDAL);
      kn.add(mesh(lg, 0.018));
      this.legs.push({ hip, kn, s });
    }
    // छाया + लड्डू कवच
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24), basic(0x000000, { op: 0.28 }));
    this.shadow.rotation.x = -PI / 2;
    this.shadow.position.y = 0.02;
    root.add(this.shadow);
    this.aura = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 18), basic(0xffb23c, { op: 0.22, add: true }));
    this.aura.position.y = 1.1;
    this.aura.visible = false;
    root.add(this.aura);
    this.phase = 0; this.spin = 0; this.eatT = 0; this.scale = 1; this.glow = 0;
  }
  setGlow(v) {
    if (Math.abs(v - this.glow) < 0.01) return;
    this.glow = v;
    for (const mt of this.glowMats) mt.emissive.setRGB(0.5 * v, 0.26 * v, 0.02 * v);
  }
  eat() { this.eatT = 0.16; }
  update(dt, mode, o = {}) {
    if (mode === 'fly') mode = 'jump';
    const k = (cur, tgt, sp = 16) => cur + (tgt - cur) * (1 - Math.exp(-sp * dt));
    const sp = o.speed || 14;
    const run = mode === 'run' || mode === 'stumble';
    this.phase += dt * (run ? 8 + sp * 0.34 : mode === 'dance' ? 6.5 : 3);
    const ph = this.phase, s = Math.sin(ph), c = Math.cos(ph);
    const P = { hip: [0, 0], knee: [-0.05, -0.05], sh: [0, 0], shz: [0.25, 0.25], el: [0.3, 0.3], by: 0.8, bx: 0, bz: 0, ty: 0, hx: 0, hz: 0 };
    if (run) {
      P.hip = [0.9 * s, -0.9 * s];
      P.knee = [-(0.15 + 1.3 * Math.max(0, c)), -(0.15 + 1.3 * Math.max(0, -c))];
      P.sh = [-0.9 * s, 0.9 * s]; P.shz = [0.3, 0.3];
      P.el = [1.35 + 0.2 * s, 1.35 - 0.2 * s];
      P.by = 0.8 + Math.abs(c) * 0.09 - 0.03; P.bx = -0.12; P.ty = 0.16 * s; P.hz = 0.05 * s;
      if (mode === 'stumble') { P.shz = [1.4 + Math.sin(ph * 3) * 0.5, 1.4 - Math.sin(ph * 3) * 0.5]; P.el = [0.4, 0.4]; P.bz = Math.sin(ph * 2.3) * 0.3; P.hz = Math.sin(ph * 3) * 0.25; }
    } else if (mode === 'jump') {
      P.hip = [1.2, 0.3]; P.knee = [-1.6, -0.5]; P.sh = [2.5, 2.2]; P.shz = [0.5, 0.5]; P.el = [0.4, 0.5]; P.bx = -0.08;
    } else if (mode === 'roll') {
      P.hip = [2.0, 2.0]; P.knee = [-2.3, -2.3]; P.sh = [1.3, 1.3]; P.shz = [0.2, 0.2]; P.el = [1.9, 1.9]; P.by = 0.6; P.hx = 0.45;
    } else if (mode === 'dead') {
      P.hip = [0.9, 0.4]; P.knee = [-0.3, -0.6]; P.sh = [2.6, 2.2]; P.shz = [1.2, 1.2]; P.el = [0.3, 0.3]; P.bx = 1.35; P.by = 0.55;
    } else if (mode === 'dance') {
      P.sh = [0.4 + 0.3 * c, 0.4 - 0.3 * c]; P.shz = [2.3 + 0.35 * s, 2.3 - 0.35 * s]; P.el = [0.6, 0.6];
      P.hip = [Math.max(0, s) * 0.5, Math.max(0, -s) * 0.5]; P.knee = [-Math.max(0, s) * 0.8 - 0.1, -Math.max(0, -s) * 0.8 - 0.1];
      P.by = 0.78 + Math.abs(s) * 0.08; P.bz = 0.12 * s; P.ty = -0.25 * s; P.hz = -0.1 * s;
    } else {
      P.by = 0.8 + Math.sin(ph) * 0.015; P.sh = [0.05 * s, -0.05 * s];
    }
    const L = this.legs, A = this.arms, b = this.body;
    for (let i = 0; i < 2; i++) {
      L[i].hip.rotation.x = k(L[i].hip.rotation.x, P.hip[i], 22);
      L[i].kn.rotation.x = k(L[i].kn.rotation.x, P.knee[i], 22);
      A[i].sh.rotation.x = k(A[i].sh.rotation.x, P.sh[i], 18);
      A[i].sh.rotation.z = k(A[i].sh.rotation.z, P.shz[i] * A[i].s, 14);
      A[i].el.rotation.x = k(A[i].el.rotation.x, P.el[i], 18);
    }
    b.position.y = k(b.position.y, P.by, 18);
    if (mode === 'roll') { this.spin -= dt * 15; b.rotation.x = this.spin; }
    else if (o.flip != null) { b.rotation.x = -o.flip * PI * 2 + P.bx; this.spin = 0; }
    else { this.spin = 0; b.rotation.x = k(((b.rotation.x % (PI * 2)) + PI * 3) % (PI * 2) - PI, P.bx, 12); }
    b.rotation.z = k(b.rotation.z, P.bz, 12);
    this.torso.rotation.y = k(this.torso.rotation.y, P.ty, 14);
    this.head.rotation.x = k(this.head.rotation.x, P.hx, 12);
    this.head.rotation.z = k(this.head.rotation.z, P.hz, 12);
    this.head.rotation.y = k(this.head.rotation.y, -P.ty * 0.7, 12);
    // पगड़ी का सिरा हवा में लहराए
    this.tail.rotation.x = k(this.tail.rotation.x, run ? 0.35 + 0.12 * Math.sin(ph * 2) : mode === 'jump' ? -0.3 : 0.05, 10);
    this.eatT = Math.max(0, this.eatT - dt);
    this.mouthOpen.scale.y = k(this.mouthOpen.scale.y, this.eatT > 0 ? 1 : 0.01, 30);
    this.smile.visible = this.mouthOpen.scale.y < 0.3;
    this.scale = k(this.scale, o.big ? 1.45 : 1, 6);
    this.root.scale.setScalar(this.scale * 1.02);
    const hy = o.y || 0;
    this.shadow.scale.setScalar(Math.max(0.35, 1 - hy * 0.18));
    this.shadow.position.y = 0.02 - hy / this.scale;
    this.aura.visible = !!o.shield;
    if (o.shield) { this.aura.rotation.y += dt * 2; this.aura.scale.setScalar(1 + Math.sin(ph * 0.7) * 0.04); }
  }
}
