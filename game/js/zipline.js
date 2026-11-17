// 🌳 जंगल की रस्सी (zipline) — जंगल में नदी के ऊपर तीन रस्सियाँ; गोलू कुंडा पकड़कर ऊपर, नदी के ऊपर फिसलता:
// बाएँ/दाएँ = झूलकर दूसरी रस्सी, ऊपर = पैर उठाओ (रस्सी से लटका लट्ठा), मधुमक्खी का छत्ता = रस्सी बदलो. आख़िर में कूदकर नीचे.
// रुकावटें खेल की "ज़मीन" के हिसाब से (टक्कर का हिसाब वही), दिखती ZIP_H ऊपर हैं — पोखर (WATER_Y) जैसा तरीका.
import * as THREE from './three.module.min.js';
import { C, mat4, Merge } from './art.js';
import { ROAD_HALF } from './models.js';
import { rand } from './util.js';

const PI = Math.PI;
export const ZIP_LEN = 180, ZIP_H = 3.2, ROPE_Y = 2.5; // ROPE_Y = गोलू के पैरों से रस्सी की ऊँचाई
const G = {
  sph: (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 8) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 14) => new THREE.TorusGeometry(r, t, s, n),
};
const LX = [-2.5, 0, 2.5];

// रस्सियाँ + दोनों ओर बाँस के मचान (z=0 शुरू, z=-ZIP_LEN अंत)
export function makeZipRig() {
  const g = new THREE.Group(), mg = new Merge(), y = ZIP_H + ROPE_Y;
  // रस्सियाँ अलग (हर फ़्रेम गोलू के ठीक पीछे तक काटी जाती हैं — कैमरे के पास मोटी कील जैसी न दिखें)
  const rg = G.cyl(0.035, 0.035, 1, 6); rg.rotateX(PI / 2); const rm = new THREE.MeshStandardMaterial({ color: 0xd9c08a, roughness: 0.8 });
  const ropes = LX.map((x) => { const r = new THREE.Mesh(rg, rm); r.position.set(x, y, -ZIP_LEN / 2); r.scale.z = ZIP_LEN + 6; g.add(r); return r; });
  for (const z of [3, -ZIP_LEN - 3]) { // मचान
    for (const s of [-1, 1]) {
      const x = s * (ROAD_HALF + 0.6);
      mg.add(G.cyl(0.14, 0.18, y + 1.6, 8), mat4(x, (y + 1.6) / 2, z), C.bamboo);
      mg.add(G.cyl(0.14, 0.18, y + 1.6, 8), mat4(x, (y + 1.6) / 2, z - 1.4), C.bamboo);
      for (let k = 0; k < 4; k++) mg.add(G.cyl(0.05, 0.05, 1.4, 6), mat4(x, 0.8 + k * 1.3, z - 0.7, PI / 2, 0, 0), 0x9c7a3c); // सीढ़ी
      mg.add(G.box(1.4, 0.15, 1.8), mat4(x, ZIP_H - 0.1, z - 0.7), 0x8a5a34); // चबूतरा
    }
    mg.add(G.cyl(0.13, 0.13, (ROAD_HALF + 0.6) * 2 + 0.4, 8), mat4(0, y + 0.35, z - 0.7, 0, 0, PI / 2), C.bamboo); // ऊपर का बाँस
    for (let i = 0; i < 9; i++) mg.add(G.cone(0.12, 0.4, 5), mat4(-3.2 + i * 0.8, y + 0.05, z - 0.7, PI, 0, 0), i % 2 ? 0xf5c542 : 0xf08a1c); // गेंदे-आम के पत्ते
  }
  const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
  // झंडियाँ (शुरू में)
  const fl = new Merge();
  for (let i = 0; i < 11; i++) fl.add(G.cone(0.16, 0.3, 3), mat4(-4 + i * 0.8, y + 0.15 - Math.sin(PI * i / 10) * 0.35, 2.3, PI, 0, 0), [0xd1261c, 0xf2a91b, 0x2e7b47, 0xd8457f][i % 4]);
  g.add(fl.mesh(0));
  g.visible = false; g.userData.ropes = ropes;
  return g;
}
// रस्सी का पास वाला सिरा गोलू (z≈0) के ठीक पीछे तक
export function trimRopes(rig) {
  const a = rig.position.z, near = Math.min(3, 0.6 - a), far = -ZIP_LEN - 3; // स्थानीय z
  for (const r of rig.userData.ropes) { const L = Math.max(0.01, near - far); r.scale.z = L; r.position.z = (near + far) / 2; r.visible = near > far; }
}
// गोलू के हाथ का कुंडा (रस्सी पर चलती घिरनी)
export function makeTrolley() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.tor(0.13, 0.04, 6, 14), mat4(0, 0, 0, 0, PI / 2, 0), 0x8a8f96);
  mg.add(G.box(0.08, 0.5, 0.08), mat4(0, -0.3, 0), 0x6b4a2c);
  mg.add(G.cyl(0.035, 0.035, 0.7, 6), mat4(0, -0.55, 0, 0, 0, PI / 2), 0xb3121c); // पकड़ने का डंडा
  g.add(mg.mesh(0.015)); g.visible = false;
  return g;
}
// रुकावटें (मूल = "ज़मीन" जैसा; world इन्हें ZIP_H ऊपर रखता है)
export const ZIP_OBST = {
  lattha() { // रस्सी से लटका लट्ठा, पैर की ऊँचाई पर — ऊपर खिसकाओ (पैर उठाओ)
    const g = new THREE.Group(), sw = new THREE.Group(); g.add(sw); sw.position.y = ROPE_Y + 0.1;
    const mg = new Merge();
    mg.add(G.cyl(0.2, 0.24, 2.2, 10), mat4(0, -ROPE_Y + 0.45, 0, 0, 0, PI / 2), 0x6b4a2c);
    for (const x of [-0.85, 0.85]) mg.add(G.cyl(0.02, 0.02, ROPE_Y - 0.45, 5), mat4(x, -(ROPE_Y - 0.45) / 2, 0), 0xd9c08a);
    for (let i = 0; i < 6; i++) mg.add(G.sph(0.16, 8, 6), mat4(-0.9 + i * 0.36, -ROPE_Y + 0.68, rand(-0.1, 0.1)), i % 2 ? 0x3c7f33 : 0x4d8f3d);
    const m = mg.mesh(0.02); m.castShadow = true; sw.add(m);
    g.userData = { kind: 'trip', halfW: 1.05, halfL: 0.3, yMin: 0, yMax: 0.9, dance: (t) => { sw.rotation.x = Math.sin(t * 2.4) * 0.18; } };
    return g;
  },
  chhatta() { // मधुमक्खी का बड़ा छत्ता — दूसरी रस्सी पर झूलो
    const g = new THREE.Group(), sw = new THREE.Group(); g.add(sw); sw.position.y = ROPE_Y + 0.4;
    const mg = new Merge();
    mg.add(G.cyl(0.03, 0.03, 0.9, 5), mat4(0, -0.45, 0), 0x6b4a2c);
    for (let i = 0; i < 6; i++) mg.add(G.sph(0.55 - i * 0.06, 12, 8), mat4(0, -1.0 - i * 0.3, 0, 0, 0, 0, 1, 0.55, 1), i % 2 ? 0xc98a3c : 0xe0a84a);
    mg.add(G.sph(0.12, 8, 6), mat4(0.1, -2.75, 0.3), 0x2a1a10);
    const m = mg.mesh(0.025); m.castShadow = true; sw.add(m);
    const bees = []; const bg = G.sph(0.05, 6, 4), bm = new THREE.MeshBasicMaterial({ color: 0x1d1210 });
    for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(bg, bm); sw.add(b); bees.push(b); }
    g.userData = { kind: 'trip', halfW: 0.75, halfL: 0.6, yMin: -3, yMax: 3, dance: (t) => { sw.rotation.z = Math.sin(t * 1.7) * 0.1; bees.forEach((b, i) => { const a = t * (3 + i * 0.4) + i; b.position.set(Math.cos(a) * 0.8, -1.8 + Math.sin(a * 1.3) * 0.6, Math.sin(a) * 0.8); }); } };
    return g;
  },
};
