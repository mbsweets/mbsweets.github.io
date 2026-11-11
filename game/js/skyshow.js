// उड़न समोसे की उड़ान का आसमान — बादल, पतंगें, पक्षियों के झुंड, उड़ते कंदील (आकाशदीप), इंद्रधनुष,
// सुनहरे छल्ले (बीच से निकलो = बोनस) और रफ़्तार की लकीरें। सब कम ड्रॉ-कॉल (InstancedMesh/Merge) में।
import * as THREE from './three.module.min.js';
import { mat4, Merge } from './art.js';
import { rand, pick } from './util.js';

const PI = Math.PI;
const LANES = [-2.5, 0, 2.5];
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _v = new THREE.Vector3(), _s = new THREE.Vector3();

function cloudGeo(seed) {
  const mg = new Merge();
  const n = 7 + (seed % 3);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * PI * 2 + seed;
    const r = 1.1 + Math.sin(i * 2.3 + seed) * 0.5;
    const x = Math.cos(a) * 1.6 * (i % 2 ? 1 : 0.6), z = Math.sin(a) * 0.9;
    mg.add(new THREE.SphereGeometry(r, 12, 9), mat4(x, Math.abs(Math.sin(a)) * 0.5 + (i === 0 ? 0.6 : 0), z, 0, 0, 0, 1, 0.78, 1), 0xffffff);
  }
  mg.add(new THREE.SphereGeometry(1.6, 14, 10), mat4(0, 0.55, 0, 0, 0, 0, 1.3, 0.85, 1), 0xffffff);
  return mg.build();
}

function kiteGeo(c1, c2) {
  const mg = new Merge();
  // पतंग: दो तिकोने (ऊपर बड़ा), बीच में पट्टी, नीचे पूँछ
  const tri = (a, b, cc, col) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...cc], 3)); g.computeVertexNormals(); mg.add(g, mat4(), col); };
  const T = [0, 1.1, 0], L = [-0.8, 0.2, 0], R = [0.8, 0.2, 0], B = [0, -0.7, 0];
  tri(T, L, R, c1); tri(R, L, T, c1); tri(L, B, R, c2); tri(R, B, L, c2);
  mg.add(new THREE.BoxGeometry(0.05, 1.8, 0.03), mat4(0, 0.2, 0.01), 0x5a3a1a);
  for (let i = 0; i < 4; i++) {
    const y = -0.85 - i * 0.32;
    tri([-0.12, y + 0.12, 0], [0.12, y + 0.12, 0], [0, y - 0.12, 0], i % 2 ? c1 : c2);
    tri([0.12, y + 0.12, 0], [-0.12, y + 0.12, 0], [0, y - 0.12, 0], i % 2 ? c1 : c2);
  }
  // डोर — नीचे ज़मीन की ओर
  mg.add(new THREE.CylinderGeometry(0.012, 0.012, 14, 3), mat4(0.9, -6.6, 0.4, 0.06, 0, -0.14), 0xfafafa);
  return mg.build();
}

export class SkyShow {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    scene.add(this.group);
    this.on = false; this.k = 0; this.t = 0; this.y = 10;
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, emissive: 0xfff4e6, emissiveIntensity: 0.35, vertexColors: true, transparent: true, opacity: 0.96 });
    // बादल — 2 तरह, 16 टुकड़े
    this.clouds = [];
    this.cloudIM = [0, 1].map((v) => { const im = new THREE.InstancedMesh(cloudGeo(v * 3 + 1), cloudMat, 8); im.frustumCulled = false; im.count = 0; this.group.add(im); return im; });
    for (let i = 0; i < 16; i++) this.clouds.push({ im: i % 2, slot: i >> 1, x: 0, y: 0, z: 999, s: 1, live: false });
    // पतंगें
    const kc = [[0xe53935, 0xffd54f], [0x1e88e5, 0xffffff], [0x43a047, 0xffeb3b], [0x8e24aa, 0xff8a65], [0xff6f00, 0x1565c0], [0xd81b60, 0x00acc1]];
    const kmat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide });
    this.kites = kc.map(([a, b]) => { const m = new THREE.Mesh(kiteGeo(a, b), kmat); m.visible = false; this.group.add(m); return { m, z: 999, live: false, ph: rand(0, 6) }; });
    // पक्षी — पंख और शरीर (instanced)
    const wing = new THREE.BufferGeometry();
    wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.12, 0, 0, 0.14, 0.62, 0.02, 0.02], 3)); wing.computeVertexNormals();
    const bmat = new THREE.MeshStandardMaterial({ color: 0x3b3b46, roughness: 0.9, side: THREE.DoubleSide });
    this.wingIM = new THREE.InstancedMesh(wing, bmat, 24); this.wingIM.frustumCulled = false; this.group.add(this.wingIM);
    this.bodyIM = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.07, 0.3, 3, 6).rotateX(PI / 2), bmat, 12); this.bodyIM.frustumCulled = false; this.group.add(this.bodyIM);
    this.flocks = [0, 1].map(() => ({ x: 0, y: 0, z: 999, vx: 0, live: false, ph: rand(0, 6) }));
    // उड़ते कंदील (आकाशदीप) — गर्म रोशनी
    const lan = new THREE.CylinderGeometry(0.32, 0.24, 0.62, 8, 1, true);
    this.lanIM = new THREE.InstancedMesh(lan, new THREE.MeshBasicMaterial({ color: 0xffa83a, toneMapped: false, side: THREE.DoubleSide, transparent: true, opacity: 0.92 }), 14);
    this.lanIM.frustumCulled = false; this.group.add(this.lanIM);
    const gc = document.createElement('canvas'); gc.width = gc.height = 64;
    const gx = gc.getContext('2d'); const gr = gx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,220,140,1)'); gr.addColorStop(0.35, 'rgba(255,170,60,.5)'); gr.addColorStop(1, 'rgba(255,140,40,0)');
    gx.fillStyle = gr; gx.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(gc);
    this.glowIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.9, 1.9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 14);
    this.glowIM.frustumCulled = false; this.group.add(this.glowIM);
    this.lanterns = []; for (let i = 0; i < 14; i++) this.lanterns.push({ x: 0, y: 0, z: 999, live: false, ph: rand(0, 6), vy: rand(0.4, 0.9) });
    // सुनहरे छल्ले
    const ringMat = new THREE.MeshStandardMaterial({ color: 0xffc83d, metalness: 0.9, roughness: 0.25, emissive: 0xff9d00, emissiveIntensity: 0.55 });
    this.ringG = new THREE.TorusGeometry(1.35, 0.13, 10, 40);
    this.rings = [];
    for (let i = 0; i < 8; i++) {
      const m = new THREE.Mesh(this.ringG, ringMat);
      const halo = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.75, 40), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
      m.add(halo); m.visible = false; this.group.add(m);
      this.rings.push({ m, halo, lane: 1, z: 999, live: false, done: false });
    }
    // इंद्रधनुष — दूर, सामने
    const rb = new THREE.TorusGeometry(95, 2.6, 7, 60, PI);
    const cols = [0x9c27b0, 0x3f51b5, 0x2196f3, 0x4caf50, 0xffeb3b, 0xff9800, 0xf44336], col = [], c = new THREE.Color();
    const P = rb.attributes.position;
    for (let i = 0; i < P.count; i++) {
      const r = Math.hypot(P.getX(i), P.getY(i));
      const band = Math.min(6, Math.max(0, Math.floor((r - 92.4) / 5.2 * 7)));
      c.setHex(cols[band]); col.push(c.r, c.g, c.b);
    }
    rb.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    this.rainbow = new THREE.Mesh(rb, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, depthWrite: false, fog: false, toneMapped: false }));
    this.rainbow.position.set(0, -38, -175);
    this.rainbow.scale.set(1.3, 1, 1);
    this.group.add(this.rainbow);
    // रफ़्तार की लकीरें
    const n = 40, sp = new Float32Array(n * 6);
    this.streakPos = sp; this.streaks = [];
    for (let i = 0; i < n; i++) this.streaks.push({ x: 0, y: 0, z: 999, l: 1 });
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3).setUsage(THREE.DynamicDrawUsage));
    this.streakMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.streakLines = new THREE.LineSegments(sg, this.streakMat); this.streakLines.frustumCulled = false; this.group.add(this.streakLines);
    this.group.visible = false;
  }

  // उड़ान शुरू
  start(y, rings) {
    this.on = true; this.y = y; this.group.visible = true;
    this.spawnCd = { c: 0, k: 0.5, b: 2, l: 0 };
    // छल्ले
    let i = 0;
    for (const r of this.rings) { r.live = false; r.m.visible = false; }
    for (const rr of rings) {
      if (i >= this.rings.length) break;
      const r = this.rings[i++];
      Object.assign(r, { lane: rr.lane, z: rr.z, live: true, done: false });
      r.m.visible = true; r.m.scale.setScalar(1);
    }
    // शुरू में ही कुछ बादल/पतंगें/कंदील दिखें
    for (let z = -20; z > -150; z -= 22) { this.addCloud(z); if (Math.random() < 0.5) this.addLantern(z); }
    for (let z = -30; z > -150; z -= 45) this.addKite(z);
    this.addFlock(-90);
  }
  stop() { this.on = false; }
  reset() { this.on = false; this.k = 0; this.group.visible = true; this.update(0.016, 0, 0, 0, null); this.group.visible = false; }

  addCloud(z) {
    const c = this.clouds.find((o) => !o.live); if (!c) return;
    const side = pick([-1, 1]);
    const low = Math.random() < 0.35;
    Object.assign(c, { live: true, z, x: side * rand(low ? 5.5 : 7, low ? 9 : 22), y: this.y + (low ? rand(-4.5, -2.2) : rand(-1, 7)), s: rand(0.8, 1.7), ry: rand(0, 6) });
  }
  addKite(z) {
    const k = this.kites.find((o) => !o.live); if (!k) return;
    const side = pick([-1, 1]);
    Object.assign(k, { live: true, z, x: side * rand(6, 13), y: this.y + rand(1.5, 6), side });
    k.m.visible = true;
  }
  addLantern(z) {
    const l = this.lanterns.find((o) => !o.live); if (!l) return;
    Object.assign(l, { live: true, z, x: pick([-1, 1]) * rand(4.5, 12), y: this.y + rand(-3, 2.5) });
  }
  addFlock(z) {
    const f = this.flocks.find((o) => !o.live); if (!f) return;
    const side = pick([-1, 1]);
    Object.assign(f, { live: true, z, x: side * 16, vx: -side * rand(2.5, 4), y: this.y + rand(2.5, 6) });
  }

  // लौटाता है: इस फ़्रेम में कितने छल्लों के बीच से निकले
  update(dt, dz, px, py, camPos) {
    this.t += dt;
    const target = this.on ? 1 : 0;
    this.k += (target - this.k) * (1 - Math.exp(-2.5 * dt));
    if (!this.on && this.k < 0.01 && this.group.visible) { this.group.visible = false; for (const a of [this.clouds, this.lanterns, this.flocks]) for (const o of a) o.live = false; for (const k of this.kites) { k.live = false; k.m.visible = false; } }
    if (!this.group.visible) return 0;
    const t = this.t;
    // नए
    if (this.on) {
      const cd = this.spawnCd;
      cd.c -= dz; cd.k -= dz; cd.b -= dz; cd.l -= dz;
      if (cd.c <= 0) { this.addCloud(-160); cd.c = rand(10, 20); }
      if (cd.k <= 0) { this.addKite(-160); cd.k = rand(28, 45); }
      if (cd.l <= 0) { this.addLantern(-160); cd.l = rand(12, 22); }
      if (cd.b <= 0) { this.addFlock(-150); cd.b = rand(70, 110); }
    }
    // बादल
    const ct = [0, 0];
    for (const c of this.clouds) {
      if (!c.live) continue;
      c.z += dz * 0.9;
      if (c.z > 12) { c.live = false; continue; }
      _e.set(0, c.ry + t * 0.02, 0); _q.setFromEuler(_e); _v.set(c.x, c.y + Math.sin(t * 0.4 + c.ry) * 0.2, c.z); _s.set(c.s * 1.25, c.s, c.s);
      _m.compose(_v, _q, _s);
      const im = this.cloudIM[c.im]; im.setMatrixAt(ct[c.im]++, _m);
    }
    this.cloudIM.forEach((im, i) => { im.count = ct[i]; im.instanceMatrix.needsUpdate = true; im.material.opacity = 0.96 * this.k; });
    // पतंगें — हवा में डोलें, फड़फड़ाएँ
    for (const k of this.kites) {
      if (!k.live) continue;
      k.z += dz * 0.75;
      if (k.z > 10) { k.live = false; k.m.visible = false; continue; }
      k.m.position.set(k.x + Math.sin(t * 0.9 + k.ph) * 0.8, k.y + Math.sin(t * 1.3 + k.ph) * 0.5, k.z);
      k.m.rotation.set(-0.25 + Math.sin(t * 7 + k.ph) * 0.05, Math.sin(t * 1.1 + k.ph) * 0.35, Math.sin(t * 1.7 + k.ph) * 0.3 + k.side * 0.15);
    }
    // पक्षी
    let w = 0, b = 0;
    for (const f of this.flocks) {
      if (!f.live) continue;
      f.z += dz * 0.6; f.x += f.vx * dt;
      if (f.z > 10 || Math.abs(f.x) > 30) { f.live = false; continue; }
      for (let i = 0; i < 5; i++) {
        const o = i === 0 ? 0 : Math.ceil(i / 2) * (i % 2 ? 1 : -1);
        const bx = f.x - Math.sign(f.vx) * Math.abs(o) * 0.9, by = f.y + Math.sin(t * 2 + i) * 0.1, bz = f.z + o * 0.9;
        const yaw = Math.atan2(f.vx, 0) ;
        const flap = Math.sin(t * 13 + f.ph + i) * 0.7;
        _e.set(0, yaw, 0); _q.setFromEuler(_e); _v.set(bx, by, bz); _s.setScalar(1.6); _m.compose(_v, _q, _s); if (b < 12) this.bodyIM.setMatrixAt(b++, _m);
        for (const sd of [-1, 1]) {
          _e.set(0, yaw + (sd < 0 ? PI : 0), sd * flap); _q.setFromEuler(_e); _m.compose(_v, _q, _s);
          if (w < 24) this.wingIM.setMatrixAt(w++, _m);
        }
      }
    }
    this.wingIM.count = w; this.bodyIM.count = b; this.wingIM.instanceMatrix.needsUpdate = true; this.bodyIM.instanceMatrix.needsUpdate = true;
    // कंदील — धीरे ऊपर उठें, लौ टिमटिमाए; चमक कैमरे की ओर
    let li = 0;
    for (const l of this.lanterns) {
      if (!l.live) continue;
      l.z += dz * 0.85; l.y += l.vy * dt * 0.4;
      if (l.z > 10) { l.live = false; continue; }
      const fl = 1 + Math.sin(t * 9 + l.ph) * 0.06;
      _e.set(Math.sin(t + l.ph) * 0.12, t * 0.3, 0); _q.setFromEuler(_e); _v.set(l.x + Math.sin(t * 0.7 + l.ph) * 0.3, l.y, l.z); _s.setScalar(fl);
      _m.compose(_v, _q, _s); this.lanIM.setMatrixAt(li, _m);
      if (camPos) { _m.lookAt(camPos, _v, THREE.Object3D.DEFAULT_UP); _q.setFromRotationMatrix(_m); }
      _s.setScalar(fl * 1.15); _m.compose(_v, _q, _s); this.glowIM.setMatrixAt(li, _m);
      li++;
    }
    this.lanIM.count = li; this.glowIM.count = li; this.lanIM.instanceMatrix.needsUpdate = true; this.glowIM.instanceMatrix.needsUpdate = true;
    // छल्ले
    let hits = 0;
    for (const r of this.rings) {
      if (!r.live) continue;
      r.z += dz;
      const x = LANES[r.lane], y = this.y + 0.95;
      const pulse = r.done ? 1 + Math.min(1, (r.z) * 0.15) : 1 + Math.sin(t * 5 + r.lane) * 0.05;
      r.m.position.set(x, y, r.z);
      r.m.rotation.set(0, 0, t * 1.5);
      r.m.scale.setScalar(pulse);
      r.halo.material.opacity = (r.done ? 0.1 : 0.3 + Math.sin(t * 6) * 0.1) * this.k;
      if (!r.done && r.z > -0.4 && r.z < 1.2) {
        if (Math.abs(px - x) < 1.1 && Math.abs(py + 0.95 - y) < 1.4) { r.done = true; hits++; }
      }
      if (r.z > 8) { r.live = false; r.m.visible = false; }
    }
    // इंद्रधनुष
    this.rainbow.material.opacity = 0.42 * this.k;
    this.rainbow.position.x = px * 0.3;
    // रफ़्तार की लकीरें
    const S = this.streakPos;
    for (let i = 0; i < this.streaks.length; i++) {
      const s = this.streaks[i];
      s.z += dz * 2.4;
      if (s.z > 6 && this.on) { s.x = px + rand(-7, 7); s.y = py + rand(-2, 5); s.z = rand(-60, -20); s.l = rand(1.5, 4); if (Math.abs(s.x - px) < 1.2) s.x += 2.5; }
      S[i * 6] = s.x; S[i * 6 + 1] = s.y; S[i * 6 + 2] = s.z; S[i * 6 + 3] = s.x; S[i * 6 + 4] = s.y; S[i * 6 + 5] = s.z - s.l;
    }
    this.streakLines.geometry.attributes.position.needsUpdate = true;
    this.streakMat.opacity = 0.45 * this.k;
    return hits;
  }
}
