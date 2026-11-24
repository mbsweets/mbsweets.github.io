// नया हीरो — Subway Surfers जैसे ढंग का (अपना बनाया): कूल लड़का, उल्टी टोपी, मरून हुडी (पीठ पर MB Sweets), जीन्स, बड़े स्नीकर्स
// घुटने-कोहनी वाला पूरा ढाँचा (rig) — दौड़, कूद, लुढ़कना, ठोकर, नाच
import * as THREE from './three.module.min.js';
import { TEX, C, GRAD, toon, basic, addOutline, outlineMat, mat4, Merge } from './art.js';

const PI = Math.PI;
const SKIN = 0xc98a5e, SKIN_D = 0xb2764d, HAIR = 0x1b1210, BLACK = 0x150d0b, WHITE = 0xffffff, IRIS = 0x3b2414;
const HOOD = 0x8e1420, HOOD_D = 0x6a0e18, GOLD = 0xe2b14a, JEANS = 0x35579c, JEANS_D = 0x2a4680, SHOE = 0xfdfdfb, SOLE = 0xd1261c, CAP = 0xd1261c;

// हुडी का कपड़ा: मरून, नीचे मधुबनी पट्टी, पीठ पर MB Sweets लोगो
function hoodieTexture() {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 512;
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#9A1822'); g.addColorStop(1, '#7A111A');
  x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
  // नीचे की किनारी (सुनहरी + लाल त्रिकोण)
  x.fillStyle = '#E2B14A'; x.fillRect(0, 440, 1024, 72);
  x.fillStyle = '#2A1511'; x.fillRect(0, 436, 1024, 6); x.fillRect(0, 506, 1024, 6);
  x.fillStyle = '#D1261C';
  for (let i = 0; i < 1024; i += 32) { x.beginPath(); x.moveTo(i, 506); x.lineTo(i + 16, 450); x.lineTo(i + 32, 506); x.fill(); }
  x.strokeStyle = '#2A1511'; x.lineWidth = 2;
  for (let i = 0; i < 1024; i += 32) { x.beginPath(); x.moveTo(i, 506); x.lineTo(i + 16, 450); x.lineTo(i + 32, 506); x.stroke(); }
  // सामने की ज़िप (u=0/1)
  x.fillStyle = '#3A0508'; x.fillRect(0, 60, 8, 380); x.fillRect(1016, 60, 8, 380);
  x.fillStyle = '#E2B14A'; for (let y = 70; y < 430; y += 14) { x.fillRect(0, y, 5, 6); x.fillRect(1019, y, 5, 6); }
  // पीठ पर लोगो (u=0.5)
  const img = TEX.logo && TEX.logo.image;
  if (img) {
    const w = 210, h = w * img.height / img.width;
    x.save(); x.beginPath(); x.arc(512, 150 + h / 2 - 10, w / 2 + 10, 0, PI * 2); x.fillStyle = '#FFE7A8'; x.fill(); x.lineWidth = 6; x.strokeStyle = '#2A1511'; x.stroke(); x.restore();
    x.drawImage(img, 512 - w / 2, 150 - 10, w, h);
  }
  x.font = '800 54px "Baloo 2", sans-serif'; x.textAlign = 'center';
  x.lineWidth = 10; x.strokeStyle = '#2A1511'; x.strokeText('MB SWEETS', 512, 410);
  x.fillStyle = '#FFD24D'; x.fillText('MB SWEETS', 512, 410);
  // बाँह पर छोटी मछली (सामने)
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export class Hero {
  constructor() {
    const vc = this.vc = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.82 });
    const hoodM = this.hoodM = new THREE.MeshStandardMaterial({ color: 0xffffff, map: hoodieTexture(), roughness: 0.82 });
    this.glowMats = [vc, hoodM];
    const mesh = (mg, th = 0.02) => { const m = new THREE.Mesh(mg.build(), vc); if (th) addOutline(m, th); return m; };
    const root = this.root = new THREE.Group();
    const body = this.body = new THREE.Group();      // कूल्हा (pelvis) — यहीं से घूमता/लुढ़कता
    body.position.y = 0.98;
    root.add(body);
    // कमर (जीन्स)
    const pv = new Merge();
    const pg = new THREE.SphereGeometry(0.27, 18, 12); pg.scale(1.1, 0.75, 0.85);
    pv.add(pg, mat4(0, -0.04, 0), JEANS);
    pv.add(new THREE.TorusGeometry(0.255, 0.035, 8, 28), mat4(0, 0.04, 0, PI / 2, 0, 0, 1.08, 0.86, 1), 0x3a2414);
    body.add(mesh(pv, 0.022));
    // धड़ — हुडी (lathe, पीछे लोगो)
    const torso = this.torso = new THREE.Group();
    body.add(torso);
    const tp = [[0.001, -0.1], [0.3, -0.09], [0.33, 0.0], [0.31, 0.14], [0.33, 0.3], [0.36, 0.46], [0.34, 0.57], [0.24, 0.65], [0.12, 0.69], [0.001, 0.7]]
      .map((a) => new THREE.Vector2(a[0], a[1]));
    const tg = new THREE.LatheGeometry(tp, 32, PI, PI * 2);
    const tm = new THREE.Mesh(tg, hoodM);
    addOutline(tm, 0.025);
    torso.add(tm);
    const tx = new Merge();
    // हुड (गर्दन के पीछे) + डोरी
    tx.add(new THREE.TorusGeometry(0.2, 0.085, 10, 18, PI), mat4(0, 0.63, 0.04, PI / 2 + 0.3, 0, 0), HOOD_D);
    for (const s of [-1, 1]) tx.add(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 5), mat4(0.06 * s, 0.5, -0.33, -0.15, 0, 0), WHITE);
    torso.add(mesh(tx, 0.02));
    // सिर
    const head = this.head = new THREE.Group();
    head.position.set(0, 1.03, 0);
    torso.add(head);
    const hm = new Merge(), ho = new Merge();
    const hg = new THREE.SphereGeometry(0.34, 26, 20); hg.scale(1, 1.07, 1);
    hm.add(hg, mat4(), SKIN); ho.add(hg, mat4(), 0);
    hm.add(new THREE.CylinderGeometry(0.11, 0.12, 0.2, 12), mat4(0, -0.36, 0.02), SKIN);
    const earG = new THREE.SphereGeometry(0.07, 10, 8);
    const ewG = new THREE.SphereGeometry(0.1, 16, 12);
    for (const s of [-1, 1]) {
      hm.add(earG, mat4(0.335 * s, -0.02, 0.03, 0, 0, 0, 0.6, 1, 0.9), SKIN); ho.add(earG, mat4(0.335 * s, -0.02, 0.03, 0, 0, 0, 0.6, 1, 0.9), 0);
      const ew = mat4(0.128 * s, 0.035, -0.272, 0, 0.25 * s, 0, 0.82, 1.2, 0.5);
      hm.add(ewG, ew, WHITE); ho.add(ewG, ew, 0);
      hm.add(new THREE.SphereGeometry(0.062, 14, 10), mat4(0.122 * s, 0.025, -0.316, 0, 0.25 * s, 0, 0.95, 1.15, 0.55), IRIS);
      hm.add(new THREE.SphereGeometry(0.034, 10, 8), mat4(0.121 * s, 0.025, -0.341), BLACK);
      hm.add(new THREE.SphereGeometry(0.02, 6, 5), mat4(0.104 * s, 0.06, -0.352), WHITE);
      hm.add(new THREE.CapsuleGeometry(0.03, 0.11, 4, 6), mat4(0.13 * s, 0.175, -0.29, 0.25, 0, PI / 2 - 0.2 * s), BLACK);
    }
    const nose = new THREE.SphereGeometry(0.045, 10, 8);
    hm.add(nose, mat4(0, -0.05, -0.335, 0, 0, 0, 1, 0.9, 1.1), SKIN_D); ho.add(nose, mat4(0, -0.05, -0.335, 0, 0, 0, 1, 0.9, 1.1), 0);
    // बाल (टोपी के नीचे से निकले, नुकीले)
    for (let i = 0; i < 12; i++) {
      const a = PI * 0.62 - i / 11 * PI * 1.24; // कान से कान, पीछे की ओर
      const x = Math.sin(a) * 0.315, z = Math.cos(a) * 0.315;
      hm.add(new THREE.ConeGeometry(0.07, 0.15, 6), mat4(x, 0.04 - (i % 2) * 0.03, z, Math.cos(a) * 1.9, 0, -Math.sin(a) * 1.9), HAIR);
    }
    hm.add(new THREE.SphereGeometry(0.352, 22, 12, 0.03 * PI, 0.94 * PI, 0.12 * PI, 0.6 * PI), mat4(0, 0.0, 0.004), HAIR);
    for (const s of [-1, 1]) hm.add(new THREE.BoxGeometry(0.05, 0.14, 0.09), mat4(0.315 * s, 0.02, -0.06, 0, 0, 0.1 * s), HAIR);
    for (let i = 0; i < 5; i++) hm.add(new THREE.ConeGeometry(0.06, 0.15, 6), mat4(-0.16 + i * 0.08, 0.17, -0.26, -1.35, 0, (i - 2) * 0.18), HAIR);
    head.add(new THREE.Mesh(hm.build(), vc));
    head.add(new THREE.Mesh(ho.build(), outlineMat(0.022)));
    // मुँह
    const mouthM = toon(0x7a1a1a);
    const smile = this.smile = new THREE.Group();
    smile.add(new THREE.Mesh(new THREE.CircleGeometry(0.085, 18, PI, PI), mouthM));
    const teeth = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.028), basic(0xffffff));
    teeth.position.set(0, -0.015, 0.002);
    smile.add(teeth);
    smile.position.set(0, -0.135, -0.318); smile.rotation.x = 0.28; smile.rotation.y = PI;
    smile.scale.set(1, 0.8, 1);
    head.add(smile);
    const mo = this.mouthOpen = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mouthM);
    mo.position.set(0, -0.165, -0.305); mo.scale.set(1.15, 0.01, 0.5);
    head.add(mo);
    // उल्टी टोपी (लाल, पीछे MB का गोल बिल्ला) — दौड़ते समय कैमरा यही देखता है
    const cap = new Merge();
    const dome = new THREE.SphereGeometry(0.372, 24, 12, 0, PI * 2, 0, 0.5 * PI); dome.scale(1, 0.8, 1.05);
    cap.add(dome, mat4(0, 0.1, 0), CAP);
    const brim = new THREE.CylinderGeometry(0.27, 0.27, 0.03, 24, 1, false, -PI / 2, PI); brim.scale(1, 1, 1.25);
    cap.add(brim, mat4(0, 0.12, 0.26, -0.12, 0, 0), CAP);
    cap.add(new THREE.SphereGeometry(0.035, 8, 6), mat4(0, 0.4, 0), GOLD);
    cap.add(new THREE.TorusGeometry(0.355, 0.022, 6, 32), mat4(0, 0.1, 0, PI / 2, 0, 0, 1, 1.04, 1), 0xa61b1b);
    head.add(mesh(cap, 0.02));
    const badge = new THREE.Mesh(new THREE.CircleGeometry(0.09, 20), toon(0xffffff, { map: TEX.logo }));
    badge.position.set(0, 0.26, 0.335); badge.rotation.x = 0.6;
    head.add(badge);
    // हाथ (कंधा → कोहनी → हाथ)
    this.arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group();
      sh.position.set(0.37 * s, 0.56, 0);
      torso.add(sh);
      const up = new Merge();
      up.add(new THREE.CapsuleGeometry(0.105, 0.19, 4, 10), mat4(0, -0.15, 0), HOOD);
      up.add(new THREE.SphereGeometry(0.115, 12, 10), mat4(0, -0.02, 0), HOOD);
      sh.add(mesh(up, 0.02));
      const el = new THREE.Group();
      el.position.y = -0.3;
      sh.add(el);
      const lo = new Merge();
      lo.add(new THREE.CapsuleGeometry(0.095, 0.16, 4, 10), mat4(0, -0.12, 0), HOOD);
      lo.add(new THREE.TorusGeometry(0.075, 0.03, 6, 14), mat4(0, -0.24, 0, PI / 2, 0, 0), GOLD);
      lo.add(new THREE.SphereGeometry(0.095, 12, 10), mat4(0, -0.31, -0.01, 0, 0, 0, 0.9, 1.05, 0.8), SKIN);
      lo.add(new THREE.CapsuleGeometry(0.03, 0.05, 4, 6), mat4(0.06 * -s, -0.29, -0.06, 0.6, 0, 0), SKIN);
      el.add(mesh(lo, 0.018));
      this.arms.push({ sh, el, s });
    }
    // पैर (कूल्हा → घुटना → टखना/जूता)
    this.legs = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group();
      hip.position.set(0.15 * s, -0.05, 0);
      body.add(hip);
      const th = new Merge();
      th.add(new THREE.CapsuleGeometry(0.14, 0.22, 4, 10), mat4(0, -0.21, 0), JEANS);
      hip.add(mesh(th, 0.02));
      const kn = new THREE.Group();
      kn.position.y = -0.44;
      hip.add(kn);
      const sh = new Merge();
      sh.add(new THREE.CapsuleGeometry(0.125, 0.22, 4, 10), mat4(0, -0.19, 0), JEANS);
      sh.add(new THREE.CylinderGeometry(0.14, 0.135, 0.08, 12), mat4(0, -0.33, 0), JEANS_D);
      // स्नीकर
      const shoe = new THREE.CapsuleGeometry(0.13, 0.24, 4, 12); shoe.rotateX(PI / 2); shoe.scale(1.05, 0.92, 1);
      sh.add(shoe, mat4(0, -0.45, -0.08), SHOE);
      const sole = new THREE.CapsuleGeometry(0.14, 0.27, 4, 12); sole.rotateX(PI / 2); sole.scale(1.02, 0.3, 1);
      sh.add(sole, mat4(0, -0.535, -0.08), SOLE);
      sh.add(new THREE.BoxGeometry(0.02, 0.06, 0.2), mat4(0.115 * s, -0.43, -0.06, 0.3, 0, 0), SOLE);
      sh.add(new THREE.TorusGeometry(0.06, 0.015, 5, 10), mat4(0, -0.36, -0.12, PI / 2, 0, 0), WHITE);
      kn.add(mesh(sh, 0.02));
      this.legs.push({ hip, kn, s });
    }
    // छाया + लड्डू कवच
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 24), basic(0x000000, { op: 0.28 }));
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
    for (const mt of this.glowMats) mt.emissive.setRGB(0.55 * v, 0.28 * v, 0.02 * v);
  }
  eat() { this.eatT = 0.16; }
  // mode: idle | dance | run | jump | roll | stumble | dead
  update(dt, mode, o = {}) {
    const k = (cur, tgt, sp = 16) => cur + (tgt - cur) * (1 - Math.exp(-sp * dt));
    const sp = o.speed || 14;
    const run = mode === 'run' || mode === 'stumble';
    this.phase += dt * (run ? 7.5 + sp * 0.32 : mode === 'dance' ? 6.5 : 3);
    const ph = this.phase, s = Math.sin(ph), c = Math.cos(ph);
    // लक्ष्य मुद्रा
    const P = { hip: [0, 0], knee: [-0.05, -0.05], sh: [0, 0], shz: [0.12, 0.12], el: [0.25, 0.25], by: 0.98, bx: 0, bz: 0, ty: 0, hx: 0, hz: 0 };
    if (run) {
      P.hip = [0.95 * s, -0.95 * s];
      P.knee = [-(0.15 + 1.35 * Math.max(0, c)), -(0.15 + 1.35 * Math.max(0, -c))];
      P.sh = [-0.85 * s, 0.85 * s];
      P.el = [1.25 + 0.25 * s, 1.25 - 0.25 * s];
      P.by = 0.98 + Math.abs(c) * 0.09 - 0.03;
      P.bx = -0.16; P.ty = 0.18 * s; P.hz = 0.04 * s;
      if (mode === 'stumble') { P.shz = [1.3 + Math.sin(ph * 3) * 0.5, 1.3 - Math.sin(ph * 3) * 0.5]; P.el = [0.4, 0.4]; P.bz = Math.sin(ph * 2.3) * 0.3; P.hz = Math.sin(ph * 3) * 0.25; }
    } else if (mode === 'jump') {
      P.hip = [1.25, 0.25]; P.knee = [-1.7, -0.5]; P.sh = [2.5, 2.2]; P.shz = [0.35, 0.35]; P.el = [0.4, 0.5]; P.bx = -0.1;
    } else if (mode === 'roll') {
      P.hip = [2.1, 2.1]; P.knee = [-2.4, -2.4]; P.sh = [1.3, 1.3]; P.shz = [0.15, 0.15]; P.el = [1.9, 1.9]; P.by = 0.62; P.hx = 0.5;
    } else if (mode === 'dead') {
      P.hip = [0.9, 0.4]; P.knee = [-0.3, -0.6]; P.sh = [2.6, 2.2]; P.shz = [1.2, 1.2]; P.el = [0.3, 0.3]; P.bx = 1.4; P.by = 0.55;
    } else if (mode === 'dance') {
      // मस्त झूमना (भोजपुरी/मैथिली स्टेप जैसा)
      P.sh = [0.4 + 0.3 * c, 0.4 - 0.3 * c]; P.shz = [2.3 + 0.35 * s, 2.3 - 0.35 * s]; P.el = [0.6, 0.6];
      P.hip = [Math.max(0, s) * 0.5, Math.max(0, -s) * 0.5]; P.knee = [-Math.max(0, s) * 0.8 - 0.1, -Math.max(0, -s) * 0.8 - 0.1];
      P.by = 0.96 + Math.abs(s) * 0.08; P.bz = 0.12 * s; P.ty = -0.25 * s; P.hz = -0.1 * s;
    } else { // idle
      P.by = 0.98 + Math.sin(ph) * 0.015; P.sh = [0.05 * s, -0.05 * s];
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
    // खाते समय मुँह
    this.eatT = Math.max(0, this.eatT - dt);
    this.mouthOpen.scale.y = k(this.mouthOpen.scale.y, this.eatT > 0 ? 0.9 : 0.01, 30);
    this.smile.visible = this.mouthOpen.scale.y < 0.3;
    // शुगर रश में बड़ा
    this.scale = k(this.scale, o.big ? 1.45 : 1, 6);
    this.root.scale.setScalar(this.scale * 1.1);
    const hy = o.y || 0;
    this.shadow.scale.setScalar(Math.max(0.35, 1 - hy * 0.18));
    this.shadow.position.y = 0.02 - hy / this.scale;
    this.aura.visible = !!o.shield;
    if (o.shield) { this.aura.rotation.y += dt * 2; this.aura.scale.setScalar(1 + Math.sin(ph * 0.7) * 0.04); }
  }
}
