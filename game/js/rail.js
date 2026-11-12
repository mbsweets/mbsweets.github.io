// मधुबनी रेलगाड़ी ज़ोन — पटरी, मधुबनी चित्रों वाले डिब्बे (छत पर दौड़ो), लकड़ी की ढलान (रैंप), दरभंगा जंक्शन प्लेटफ़ॉर्म
import * as THREE from './three.module.min.js';
import { C, toon, mat4, Merge, tile } from './art.js';
import { rand, pick } from './util.js';
import { makeVillager } from './haat.js';

const PI = Math.PI;
export const ROOF = 3.25, COACH = 13, GAP = 0.7, RAMP_L = 9;
const G = {
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 8) => new THREE.CylinderGeometry(a, b, h, s),
  sph: (r, w = 8, h = 6) => new THREE.SphereGeometry(r, w, h),
};

// डिब्बे की बगल: मरून-लाल, पीली पट्टी, खिड़कियाँ, बीच में मधुबनी मछली/मोर/फूल + "मिथिला एक्सप्रेस"
let SIDE = null, END = null, ENGINE = null;
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function fish(x, cx, cy, s, col) {
  x.save(); x.translate(cx, cy); x.scale(s, s);
  x.fillStyle = col; x.strokeStyle = '#2a1511'; x.lineWidth = 2.2 / s;
  x.beginPath(); x.moveTo(-30, 0); x.quadraticCurveTo(0, -22, 26, 0); x.quadraticCurveTo(0, 22, -30, 0); x.fill(); x.stroke();
  x.beginPath(); x.moveTo(-30, 0); x.lineTo(-44, -12); x.lineTo(-44, 12); x.closePath(); x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(14, -3, 4, 0, PI * 2); x.fill(); x.fillStyle = '#2a1511'; x.beginPath(); x.arc(15, -3, 2, 0, PI * 2); x.fill();
  x.strokeStyle = '#2a1511'; for (let i = -18; i < 10; i += 7) { x.beginPath(); x.arc(i, 0, 8, -0.9, 0.9); x.stroke(); }
  x.restore();
}
function flower(x, cx, cy, r, c1, c2) {
  x.fillStyle = c1; for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; x.beginPath(); x.ellipse(cx + Math.cos(a) * r, cy + Math.sin(a) * r, r * 0.6, r * 0.32, a, 0, PI * 2); x.fill(); }
  x.fillStyle = c2; x.beginPath(); x.arc(cx, cy, r * 0.5, 0, PI * 2); x.fill();
}
function textures() {
  if (SIDE) return;
  SIDE = canvasTex(1024, 256, (x, w, h) => {
    x.fillStyle = '#9c1b1f'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f2b21b'; x.fillRect(0, 26, w, 10); x.fillRect(0, h - 40, w, 10);
    // त्रिकोण वाली मधुबनी पट्टी
    for (let i = 0; i < w / 22; i++) { x.fillStyle = i % 2 ? '#f2b21b' : '#1e7a4c'; x.beginPath(); x.moveTo(i * 22, 36); x.lineTo(i * 22 + 11, 50); x.lineTo(i * 22 + 22, 36); x.fill(); }
    // खिड़कियाँ
    for (let i = 0; i < 8; i++) {
      const wx = 40 + i * 122;
      x.fillStyle = '#f7e7c4'; x.fillRect(wx - 5, 62, 76, 70);
      x.fillStyle = '#26324a'; x.fillRect(wx, 67, 66, 60);
      x.strokeStyle = '#8a8f99'; x.lineWidth = 3; for (let k = 1; k < 4; k++) { x.beginPath(); x.moveTo(wx, 67 + k * 15); x.lineTo(wx + 66, 67 + k * 15); x.stroke(); }
    }
    // नीचे मधुबनी चित्र
    for (let i = 0; i < 5; i++) {
      const cx = 100 + i * 205;
      if (i % 2) fish(x, cx, 172, 0.9, i % 4 === 1 ? '#f2b21b' : '#2f6fb6'); else flower(x, cx, 172, 14, '#f7d046', '#d1261c');
    }
    x.fillStyle = '#ffe9a8'; x.font = '800 30px "Baloo 2", Mukta, sans-serif'; x.textAlign = 'center';
    x.fillText('मिथिला एक्सप्रेस  •  MITHILA EXPRESS', w / 2, h - 50 + 0);
  });
  END = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#9c1b1f'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f2b21b'; x.fillRect(0, 20, w, 8); x.fillRect(0, h - 30, w, 8);
    x.fillStyle = '#5a1012'; x.fillRect(88, 40, 80, 180); x.fillStyle = '#26324a'; x.fillRect(100, 56, 56, 50);
    flower(x, 44, 130, 12, '#f7d046', '#1e7a4c'); flower(x, 212, 130, 12, '#f7d046', '#1e7a4c');
  });
  ENGINE = canvasTex(256, 256, (x, w, h) => {
    x.fillStyle = '#1f5f9c'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#f2b21b'; x.fillRect(0, 150, w, 26);
    x.fillStyle = '#26324a'; x.fillRect(30, 30, 88, 70); x.fillRect(138, 30, 88, 70);
    x.fillStyle = '#fff'; x.font = '800 30px "Baloo 2", sans-serif'; x.textAlign = 'center'; x.fillText('MB 2000', w / 2, 140);
    fish(x, 64, 214, 0.7, '#f2b21b'); fish(x, 192, 214, 0.7, '#f2b21b');
  });
}

// n डिब्बे वाली गाड़ी (z में लंबी, सामने = +z, खिलाड़ी की ओर); engine=true तो सामने इंजन जैसा चेहरा + बत्ती
export function makeTrain(n, engine = false) {
  textures();
  const g = new THREE.Group();
  const len = n * COACH + (n - 1) * GAP;
  const sideM = new THREE.MeshStandardMaterial({ map: SIDE, roughness: 0.6, metalness: 0.15 });
  const endM = new THREE.MeshStandardMaterial({ map: engine ? ENGINE : END, roughness: 0.6, metalness: 0.15 });
  const bodyM = new THREE.MeshStandardMaterial({ color: 0x9c1b1f, roughness: 0.6, metalness: 0.15 });
  const mg = new Merge();
  // सारे डिब्बों के ढाँचे एक geometry में, मटीरियल के हिसाब से 3 हिस्से (ड्रॉ-कॉल कम)
  const P = [], N = [], U = [], B = [[], [], []]; // 0 बगल, 1 सादा, 2 सामने
  let vOff = 0;
  for (let i = 0; i < n; i++) {
    const zc = len / 2 - COACH / 2 - i * (COACH + GAP);
    const bg = G.box(2.3, 2.8, COACH); bg.translate(0, 0.4 + 1.4, zc);
    P.push(...bg.attributes.position.array); N.push(...bg.attributes.normal.array); U.push(...bg.attributes.uv.array);
    const idx = bg.index.array;
    bg.groups.forEach((gr, gi) => { const tgt = gi < 2 ? 0 : gi === 4 && i === 0 ? 2 : 1; for (let k = gr.start; k < gr.start + gr.count; k++) B[tgt].push(idx[k] + vOff); });
    vOff += bg.attributes.position.count;
    // छत (समतल — इस पर दौड़ना है) + हवा वाले ढक्कन
    mg.add(G.box(2.34, 0.1, COACH), mat4(0, ROOF - 0.03, zc), 0xc9c4bc);
    for (const dz of [-4, 0, 4]) mg.add(G.box(0.7, 0.1, 0.9), mat4(0.62, ROOF + 0.04, zc + dz), 0x9e9a93);
    // पहिए/नीचे
    for (const dz of [-4.5, -3.3, 3.3, 4.5]) for (const s of [-1, 1]) mg.add(G.cyl(0.42, 0.42, 0.18, 14).rotateZ(PI / 2), mat4(s * 0.92, 0.42, zc + dz), 0x2b2b2e);
    mg.add(G.box(2.0, 0.3, COACH - 1), mat4(0, 0.35, zc), 0x2e2e33);
    if (i < n - 1) mg.add(G.box(1.2, 2.2, GAP + 0.2), mat4(0, 1.6, zc - COACH / 2 - GAP / 2), 0x3a3a3f);
  }
  const cg = new THREE.BufferGeometry();
  cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  cg.setIndex([...B[0], ...B[1], ...B[2]]);
  cg.addGroup(0, B[0].length, 0); cg.addGroup(B[0].length, B[1].length, 1); if (B[2].length) cg.addGroup(B[0].length + B[1].length, B[2].length, 2);
  const body = new THREE.Mesh(cg, [sideM, bodyM, endM]);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  // सामने के बफ़र
  for (const s of [-1, 1]) mg.add(G.cyl(0.14, 0.14, 0.4, 10).rotateX(PI / 2), mat4(s * 0.75, 0.9, len / 2 + 0.2), 0x555555);
  const m = mg.mesh(0); m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  if (engine) {
    const lamp = new THREE.Mesh(G.sph(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff3c0, toneMapped: false }));
    lamp.position.set(0, ROOF - 0.35, len / 2 + 0.05); g.add(lamp);
  }
  g.userData = { kind: 'train', halfW: 1.12, halfL: len / 2, yMin: 0, yMax: ROOF, roof: ROOF };
  return g;
}

// लकड़ी की ढलान — नीचे का सिरा खिलाड़ी की ओर (+z), ऊपर का सिरा डिब्बे की छत तक
export function makeRamp() {
  const g = new THREE.Group();
  const mg = new Merge();
  const ang = Math.atan2(ROOF, RAMP_L), L = Math.hypot(ROOF, RAMP_L);
  const hAt = (z) => ROOF * (0.5 - z / RAMP_L); // ऊँचा सिरा -z (डिब्बे की ओर), नीचा +z
  for (let k = 0; k < 9; k++) { const z = -RAMP_L / 2 + (k + 0.5) * RAMP_L / 9; mg.add(G.box(2.1, 0.08, L / 9 - 0.04), mat4(0, hAt(z), z, ang, 0, 0), k % 2 ? 0x9a6a3c : 0x8a5a30); }
  for (const s of [-1, 1]) mg.add(G.box(0.12, 0.2, L), mat4(s * 1.02, ROOF / 2 + 0.1, 0, ang, 0, 0), 0x6d4626);
  for (const z of [-RAMP_L / 2 + 0.4, -RAMP_L / 6, RAMP_L / 6]) { const hh = hAt(z); for (const s of [-1, 1]) mg.add(G.box(0.14, hh, 0.14), mat4(s * 0.95, hh / 2, z), 0x5d3b1e); }
  for (const s of [-1, 1]) mg.add(G.box(0.1, 0.1, 0.1), mat4(s * 1.02, ROOF + 0.1, -RAMP_L / 2), 0xf2b21b);
  const m = mg.mesh(0); m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  g.userData = { kind: 'ramp', halfW: 1.05, halfL: RAMP_L / 2, yMin: 0, yMax: 0, ramp: ROOF };
  return g;
}

// पटरी (तीनों लेन) — 20 लंबा टुकड़ा
export function makeTrack() {
  const mg = new Merge();
  for (const lx of [-2.5, 0, 2.5]) {
    mg.add(G.box(2.3, 0.06, 20), mat4(lx, 0.03, 0), 0x7d7368);
    for (let z = -9.6; z < 10; z += 0.8) mg.add(G.box(1.9, 0.09, 0.26), mat4(lx, 0.075, z), 0x5d4630);
    for (const s of [-1, 1]) mg.add(G.box(0.08, 0.13, 20), mat4(lx + s * 0.72, 0.17, 0), 0xa9adb3);
  }
  const m = mg.mesh(0); m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  g.userData = { type: 'track' };
  return g;
}

// दरभंगा जंक्शन — प्लेटफ़ॉर्म, पीला स्टेशन बोर्ड, छत, बेंच, यात्री
export function makeStation(side, i) {
  const grp = new THREE.Group();
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(40, 20.2), toon(0xb9b2a5));
  gnd.rotation.x = -PI / 2; gnd.position.set(side * 24.3, 0.006, 0); gnd.receiveShadow = true;
  grp.add(gnd);
  const mg = new Merge();
  mg.add(G.box(5.5, 0.9, 20.1), mat4(side * 8.0, 0.45, 0), 0xd6cfc2); // प्लेटफ़ॉर्म
  mg.add(G.box(0.25, 0.92, 20.1), mat4(side * 5.35, 0.46, 0), 0xf2d02e); // पीली किनारी
  for (const z of [-7, 0, 7]) { mg.add(G.cyl(0.12, 0.12, 4, 8), mat4(side * 7.0, 2.9, z), 0x3d5a80); mg.add(G.cyl(0.12, 0.12, 4.6, 8), mat4(side * 9.8, 3.2, z), 0x3d5a80); }
  mg.add(G.box(4.2, 0.12, 20), mat4(side * 8.4, 5.1, 0, 0, 0, side * 0.12), 0xb03a2e); // छत
  for (const z of [-4, 4]) { mg.add(G.box(0.5, 0.45, 2.0), mat4(side * 9.2, 1.15, z), 0x2e7d32); mg.add(G.box(0.12, 0.45, 2.0), mat4(side * 9.45, 1.45, z), 0x2e7d32); } // बेंच
  mg.add(G.box(1.0, 2.2, 1.2), mat4(side * 10.0, 2.0, -9), 0xc62828); // चाय की गुमटी
  grp.add(mg.mesh(0));
  if (i % 2 === 0) { // पीला स्टेशन बोर्ड
    const t = canvasTex(512, 160, (x, w, h) => {
      x.fillStyle = '#f7d21a'; x.fillRect(0, 0, w, h); x.strokeStyle = '#111'; x.lineWidth = 8; x.strokeRect(4, 4, w - 8, h - 8);
      x.fillStyle = '#111'; x.textAlign = 'center'; x.font = '800 54px "Baloo 2", Mukta, sans-serif'; x.fillText('दरभंगा जं.', w / 2, 70);
      x.font = '800 40px "Baloo 2", sans-serif'; x.fillText('DARBHANGA JN.', w / 2, 130);
    });
    const b = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.3), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, color: 0xf0f0f0, side: THREE.DoubleSide }));
    b.position.set(side * 7.4, 3.6, 2.5); b.rotation.y = side < 0 ? 0.9 : -0.9;
    grp.add(b);
    const pm = new Merge(); for (const s of [-1, 1]) pm.add(G.cyl(0.06, 0.06, 3.0, 6), mat4(side * 7.4 + s * 1.5 * Math.cos(0.9), 1.5, 2.5 - s * side * 1.5 * Math.sin(0.9)), 0x333333);
    grp.add(pm.mesh(0));
  }
  const people = [makeVillager({ mode: 'buy' }), makeVillager({ mode: 'walk', kind: 'woman' }), makeVillager({ mode: 'call', kind: 'man' })];
  people.forEach((p, k) => { p.position.set(side * (7.2 + k * 0.8), 0.9, -5 + k * 5); p.rotation.y = side < 0 ? -PI / 2 : PI / 2; grp.add(p); });
  grp.userData = { type: 'station', len: 20, noShadow: false, anim: (t, near) => { for (const p of people) { p.visible = near; if (near) p.userData.anim(t); } } };
  return grp;
}

export const RAIL_OBST = {
  train1: () => makeTrain(1),
  train2: () => makeTrain(2),
  train3: () => makeTrain(3),
  engine1: () => makeTrain(1, true),
  ramp: () => makeRamp(),
};
