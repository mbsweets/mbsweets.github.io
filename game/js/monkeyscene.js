// 🐒 बंदर का पूरा सीन — गोलू के हाथ में समोसे का झोला; बंदर पेड़ की डाल पर बैठा ताक रहा, फिर धीमी गति में झपट्टा,
// झोला छीनकर आगे सड़क पर भागता (रास्ते में समोसे गिराता), पकड़ो तो झोला वापस; नहीं तो पेड़ पर बैठकर समोसा खाता दिखे.
// झपट्टे के समय नीचे खिसकाया (झुके) = बंदर ऊपर से निकल गया (बच गए).
import * as THREE from './three.module.min.js';
import { C, mat4, Merge, toon, addOutline } from './art.js';
import { samosaGeo } from './models.js';
import { ROAD_HALF } from './models.js';
import { rand } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 16, arc = PI * 2) => new THREE.TorusGeometry(r, t, s, n, arc),
};
const SAM_MAT = () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0 });

// कपड़े का झोला (सफ़ेद, लाल-सुनहरी पट्टी) — ऊपर से समोसे झाँकते; ऊँचाई ~0.42 मी. (खेल की इकाई)
export function makeJhola() {
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const mg = new Merge();
  const sack = G.cyl(0.17, 0.2, 0.34, 14); mg.add(sack, mat4(0, -0.26, 0, 0, 0, 0, 1, 1, 0.62), 0xf6efe0);
  mg.add(G.sph(0.2, 14, 8), mat4(0, -0.43, 0, 0, 0, 0, 1, 0.32, 0.62), 0xf6efe0); // गोल तली
  mg.add(G.cyl(0.176, 0.186, 0.06, 14), mat4(0, -0.2, 0, 0, 0, 0, 1, 1, 0.64), C.sindoor); // लाल पट्टी
  mg.add(G.cyl(0.18, 0.19, 0.022, 14), mat4(0, -0.24, 0, 0, 0, 0, 1, 1, 0.65), C.gold);
  for (const s of [-1, 1]) mg.add(G.tor(0.1, 0.018, 5, 12, PI), mat4(s * 0.03, -0.1, 0, 0, s * 0.25, 0), 0xe8dcc0); // हैंडल
  const m = mg.mesh(0.012); m.castShadow = true; body.add(m);
  // समोसे (झाँकते) — भरे झोले में ज़्यादा
  const sams = [];
  const sg = samosaGeo(0.16), sm = SAM_MAT();
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(sg, sm); s.position.set(-0.07 + i * 0.07, -0.1 + (i === 1 ? 0.03 : 0), 0); s.rotation.set(0.3, i * 0.9, (i - 1) * 0.4); s.castShadow = true; body.add(s); sams.push(s); }
  g.userData = { body, sams, sw: 0 };
  return g;
}
// भरा-खाली: n = 0..3 समोसे दिखें
export function jholaFill(j, n) { j.userData.sams.forEach((s, i) => { s.visible = i < n; }); }

// बंदर वाला पेड़ (सड़क किनारे) — मोटा तना, सड़क की ओर एक डाल जिस पर बंदर बैठता; पत्ते सड़क से दूर (कैमरा न ढके)
export function makeMonkeyTree() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.cyl(0.22, 0.34, 4.6, 10), mat4(0, 2.3, 0, 0, 0, 0.04), C.wood);
  mg.add(G.cyl(0.36, 0.5, 0.4, 10), mat4(0, 0.15, 0), 0x6b4a2c); // जड़
  mg.add(G.cyl(0.07, 0.13, 2.3, 7), mat4(-1.0, 3.55, 0, 0, 0, 1.25), C.wood); // सड़क की ओर डाल (x− = सड़क)
  mg.add(G.cyl(0.05, 0.08, 1.2, 6), mat4(0.6, 4.3, 0.3, 0.3, 0, -0.8), C.wood);
  const leaf = [0x2f6b2a, 0x3c7f33, 0x4d8f3d, 0x2a5f26];
  const blobs = [[0.6, 5.2, 0, 1.5], [1.4, 4.7, 0.6, 1.1], [-0.2, 5.6, -0.5, 1.2], [0.9, 5.9, -0.3, 1.0], [1.6, 5.3, -0.8, 0.9], [-1.6, 3.95, 0.1, 0.55], [0.2, 4.6, 0.9, 0.9]];
  blobs.forEach(([x, y, z, r], i) => mg.add(G.sph(r, 10, 8), mat4(x, y, z, 0, 0, 0, 1, 0.82, 1), leaf[i % leaf.length]));
  for (let i = 0; i < 9; i++) mg.add(G.sph(0.09, 6, 5), mat4(rand(-0.4, 1.8), rand(4.2, 5.8), rand(-1, 1)), 0xf2b84b); // आम/फल
  const m = mg.mesh(0.03); m.castShadow = true; g.add(m);
  g.visible = false;
  g.userData = { branch: new THREE.Vector3(-1.75, 3.95, 0) }; // बंदर की जगह (पेड़ के हिसाब से, side=+1 पर)
  return g;
}
// पेड़ को सड़क के किसी किनारे रखो: side=+1 → दाएँ (डाल बाएँ, सड़क की ओर)
export function placeTree(t, side, z) {
  t.visible = true; t.scale.set(side, 1, 1); t.position.set(side * (ROAD_HALF + 2.3), 0, z);
}
export function branchPos(t, out) { const b = t.userData.branch; return out.set(t.position.x + b.x * t.scale.x, b.y, t.position.z + b.z); }

// बंदर के झोले से गिरे समोसे — उठाओ तो कुछ मिठाई वापस (छोटा pool)
export class SamosaDrops {
  constructor(scene) {
    this.pool = []; this.live = [];
    const geo = samosaGeo(0.42), mat = SAM_MAT();
    for (let i = 0; i < 10; i++) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.visible = false; scene.add(m); this.pool.push(m); }
    const rg = new THREE.TorusGeometry(0.42, 0.04, 6, 24); this.ringMat = new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.7, depthWrite: false });
    this.rings = this.pool.map((m) => { const r = new THREE.Mesh(rg, this.ringMat); r.rotation.x = PI / 2; r.position.y = -0.3; m.add(r); return r; });
  }
  drop(x, y, z) {
    const m = this.pool.pop(); if (!m) return;
    m.visible = true; m.position.set(x, y, z);
    this.live.push({ m, vy: 3.5, t: 0, y0: 0.45 });
  }
  // लौटाओ: उठाए गए समोसों की संख्या
  update(dt, dz, px, py) {
    let got = 0;
    for (let i = this.live.length - 1; i >= 0; i--) {
      const d = this.live[i], m = d.m;
      d.t += dt; m.position.z += dz;
      if (m.position.y > d.y0 || d.vy > 0) { d.vy -= 16 * dt; m.position.y = Math.max(d.y0, m.position.y + d.vy * dt); if (m.position.y <= d.y0) d.vy = 0; }
      m.rotation.y += dt * 2.2; m.position.y += Math.sin(d.t * 5) * 0.004;
      const near = Math.abs(m.position.x - px) < 0.9 && Math.abs(m.position.z) < 0.9 && py < 1.6;
      if (near || m.position.z > 6) { if (near) got++; m.visible = false; this.pool.push(m); this.live.splice(i, 1); }
    }
    return got;
  }
  clear() { for (const d of this.live) { d.m.visible = false; this.pool.push(d.m); } this.live.length = 0; }
}
void toon; void addOutline;
