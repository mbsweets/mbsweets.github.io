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
// 🚡 असली रोपवे (18 नवंबर 2026, मालिक: "रस्सी जैसी लगनी चाहिए, प्रॉपर रोपिंग सिस्टम"):
// मोटी बटी हुई जूट की रस्सी, बीच में बाँस के खंभे, हर खंभे के बीच रस्सी हल्की झुकी (sag) — गोलू भी उसी झोल के साथ नीचे-ऊपर;
// घिरनी (दो पहिये) रस्सी पर घूमती, बीच-बीच में चिंगारी. रुकावटें/मिठाई भी उसी झोल पर (world.zipSag).
export const ZIP_TOW = [3, -43.5, -90, -136.5, -ZIP_LEN - 3]; // खंभे (स्थानीय z)
const SAG = 0.55;
export function zipSag(zl) {
  for (let i = 0; i < ZIP_TOW.length - 1; i++) {
    const a = ZIP_TOW[i], b = ZIP_TOW[i + 1];
    if (zl <= a && zl >= b) { const u = (a - zl) / (a - b); return -SAG * 4 * u * (1 - u); }
  }
  return 0;
}
function ropeTex() { // बटी हुई रस्सी: तिरछी धारियाँ
  const c = document.createElement('canvas'); c.width = 64; c.height = 32; const x = c.getContext('2d');
  x.fillStyle = '#c9a25e'; x.fillRect(0, 0, 64, 32);
  for (let k = -64; k < 128; k += 16) {
    x.fillStyle = '#8a6630'; x.beginPath(); x.moveTo(k, 0); x.lineTo(k + 6, 0); x.lineTo(k + 6 + 32, 32); x.lineTo(k + 32, 32); x.fill();
    x.fillStyle = 'rgba(255,240,200,0.55)'; x.beginPath(); x.moveTo(k + 9, 0); x.lineTo(k + 11, 0); x.lineTo(k + 43, 32); x.lineTo(k + 41, 32); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; return t;
}
const ROPE_N = 150, ROPE_RAD = 8;
export function makeZipRig() {
  const g = new THREE.Group(), mg = new Merge(), y = ZIP_H + ROPE_Y;
  // रस्सियाँ: झोल वाली नली (tube) — पास वाला हिस्सा हर फ़्रेम drawRange से काटा जाता है (कैमरे के पास मोटी कील न दिखे)
  const tex = ropeTex(); tex.repeat.set((ZIP_LEN + 6) / 0.3, 1);
  const rm = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, color: 0xffffff });
  const ropes = LX.map((x) => {
    const pts = []; for (let i = 0; i <= 124; i++) { const z = 3 - (ZIP_LEN + 6) * i / 124; pts.push(new THREE.Vector3(x, y + zipSag(z), z)); }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), ROPE_N, 0.072, ROPE_RAD, false);
    const r = new THREE.Mesh(geo, rm); r.castShadow = true; g.add(r); return r;
  });
  // बाँस के खंभे: दोनों किनारों पर दोहरे बाँस + ऊपर आड़ा बाँस, उससे लटकी "काठी" (रस्सी उस पर टिकी)
  ZIP_TOW.forEach((z, ti) => {
    const end = ti === 0 || ti === ZIP_TOW.length - 1, H = y + (end ? 1.6 : 1.1);
    for (const s of [-1, 1]) {
      const x = s * (ROAD_HALF + 0.6);
      for (const dz of end ? [0, -1.4] : [0.35, -0.35]) mg.add(G.cyl(0.14, 0.19, H, 8), mat4(x, H / 2, z + dz), C.bamboo);
      for (let k = 1; k < H / 0.9; k++) mg.add(G.cyl(0.155, 0.155, 0.06, 8), mat4(x, k * 0.9, z), 0x9c7a3c); // गाँठें
      mg.add(G.cyl(0.04, 0.04, H * 1.15, 5), mat4(x + s * 0.9, H * 0.48, z, 0, 0, -s * 0.42), 0x9c7a3c); // तिरछा सहारा
      if (end) { for (let k = 0; k < 4; k++) mg.add(G.cyl(0.05, 0.05, 1.4, 6), mat4(x, 0.8 + k * 1.3, z - 0.7, PI / 2, 0, 0), 0x9c7a3c); mg.add(G.box(1.4, 0.15, 1.8), mat4(x, ZIP_H - 0.1, z - 0.7), 0x8a5a34); }
      // रस्सी का खिंचाव: किनारे से ज़मीन तक तिरछी बँधी रस्सी (गाड़ा खूँटा)
      if (end) { mg.add(G.cyl(0.03, 0.03, 6.2, 5), mat4(x + s * 1.6, H * 0.55, z + (ti === 0 ? 2.2 : -2.2), (ti === 0 ? -1 : 1) * 0.55, 0, -s * 0.25), 0xb08a4a); mg.add(G.cyl(0.07, 0.07, 0.5, 6), mat4(x + s * 2.6, 0.2, z + (ti === 0 ? 4.4 : -4.4)), C.wood); }
    }
    const bz = end ? z - 0.7 : z;
    mg.add(G.cyl(0.13, 0.13, (ROAD_HALF + 0.6) * 2 + 0.5, 8), mat4(0, H - 0.2, bz, 0, 0, PI / 2), C.bamboo); // ऊपर का आड़ा बाँस
    for (const x of LX) { // काठी: छोटा लटकता डंडा + लकड़ी की गुटकी जिस पर रस्सी टिके
      mg.add(G.cyl(0.025, 0.025, H - 0.2 - y - 0.12, 5), mat4(x, (H - 0.2 + y + 0.12) / 2, bz), 0xb08a4a);
      mg.add(G.box(0.22, 0.12, 0.42), mat4(x, y + 0.11, bz), 0x6b4a2c);
    }
    if (!end) for (let i = 0; i < 7; i++) mg.add(G.cone(0.1, 0.32, 5), mat4(-3.2 + i * 1.07, H - 0.35, bz, PI, 0, 0), i % 2 ? 0xf5c542 : 0xf08a1c); // गेंदे की लड़ी
    else for (let i = 0; i < 9; i++) mg.add(G.cone(0.12, 0.4, 5), mat4(-3.2 + i * 0.8, H - 0.35, bz, PI, 0, 0), i % 2 ? 0xf5c542 : 0xf08a1c);
  });
  const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
  // झंडियाँ (शुरू में)
  const fl = new Merge();
  for (let i = 0; i < 11; i++) fl.add(G.cone(0.16, 0.3, 3), mat4(-4 + i * 0.8, y + 1.25 - Math.sin(PI * i / 10) * 0.35, 2.3, PI, 0, 0), [0xd1261c, 0xf2a91b, 0x2e7b47, 0xd8457f][i % 4]);
  g.add(fl.mesh(0));
  g.visible = false; g.userData.ropes = ropes;
  return g;
}
// रस्सी का पास वाला सिरा गोलू (z≈0) के ठीक पीछे तक — नली के शुरू वाले टुकड़े न बनाओ
export function trimRopes(rig) {
  const a = rig.position.z, near = Math.min(3, 0.6 - a), L = ZIP_LEN + 6; // स्थानीय z
  const j0 = Math.max(0, Math.min(ROPE_N, Math.floor((3 - near) / L * ROPE_N))), per = ROPE_RAD * 6;
  for (const r of rig.userData.ropes) { r.geometry.setDrawRange(j0 * per, (ROPE_N - j0) * per); r.visible = j0 < ROPE_N; }
}
// गोलू की घिरनी: रस्सी पर दो खाँचे वाले पहिये + दोनों ओर पट्टी; नीचे पट्टे से लटका लाल हत्था (हाथों तक, लंबाई बदलती)
export function makeTrolley() {
  const g = new THREE.Group(), top = new THREE.Group(); g.add(top);
  const mg = new Merge(), STEEL = 0x8a8f96, DARK = 0x4a4f56;
  for (const s of [-1, 1]) { mg.add(G.box(0.03, 0.26, 0.5), mat4(s * 0.075, 0.05, 0), 0xb3121c); mg.add(G.cyl(0.02, 0.02, 0.18, 6), mat4(0, 0.06, s * 0.13, 0, 0, PI / 2), DARK); } // पट्टियाँ + धुरी
  mg.add(G.box(0.18, 0.05, 0.12), mat4(0, -0.1, 0), DARK); // नीचे का जोड़
  top.add(mg.mesh(0.012));
  const wheels = [];
  for (const s of [-1, 1]) { // पहिये (रस्सी के ऊपर)
    const w = new THREE.Group(), wm = new Merge();
    wm.add(G.cyl(0.085, 0.085, 0.07, 14), mat4(0, 0, 0, 0, 0, PI / 2), STEEL); wm.add(G.tor(0.085, 0.022, 6, 16), mat4(-0.03, 0, 0, 0, PI / 2, 0), DARK); wm.add(G.tor(0.085, 0.022, 6, 16), mat4(0.03, 0, 0, 0, PI / 2, 0), DARK);
    wm.add(G.box(0.072, 0.03, 0.16), mat4(0, 0, 0), 0xc0c4c8); // तीली (घूमती दिखे)
    w.add(wm.mesh(0.01)); w.position.set(0, 0.06 + 0.06, s * 0.13); top.add(w); wheels.push(w);
  }
  const strap = new THREE.Mesh(G.cyl(0.022, 0.022, 1, 5), new THREE.MeshStandardMaterial({ color: 0x6b4a2c, roughness: 0.9 })); g.add(strap);
  const hm = new Merge(); hm.add(G.cyl(0.035, 0.035, 0.66, 8), mat4(0, 0, 0, 0, 0, PI / 2), 0xb3121c); for (const s of [-1, 1]) hm.add(G.cyl(0.045, 0.045, 0.16, 8), mat4(s * 0.24, 0, 0, 0, 0, PI / 2), 0x1d1210);
  const handle = hm.mesh(0.01); g.add(handle);
  g.userData = { top, wheels, strap, handle }; g.visible = false;
  return g;
}
// घिरनी को रस्सी (ry) और हाथ (hx, hy) के बीच रखो; roll = पहियों का घुमाव
const _v = new THREE.Vector3();
export function placeTrolley(t, x, ry, hx, hy, roll, tilt) {
  const u = t.userData; t.position.set(0, 0, 0.02);
  u.top.position.set(x, ry, 0); u.top.rotation.z = tilt * 0.4;
  for (const w of u.wheels) w.rotation.x = roll;
  u.handle.position.set(hx, hy, 0); u.handle.rotation.z = tilt;
  const top = _v.set(x, ry - 0.12, 0), dx = hx - top.x, dy = hy - top.y, L = Math.max(0.05, Math.hypot(dx, dy));
  u.strap.position.set((hx + top.x) / 2, (hy + top.y) / 2, 0); u.strap.scale.set(1, L, 1); u.strap.rotation.z = -Math.atan2(dx, dy);
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
