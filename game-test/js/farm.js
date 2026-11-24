// 🌾 खेत-खलिहान (24 नवंबर 2026, मालिक: "खेत खलिहान वाला सीन, बैल खेत जोत रहा है… ओरिजिनल टाइप का, कार्टून जैसा नहीं")
// किनारे के खेत: जुती मिट्टी की कतारें (उभार वाली), सरसों/धान की असली बनावट, मेड़ पर घास,
// हल जोतते दो बैल (सफ़ेद-भूरे, कूबड़ वाले, सींग) + पीछे हल पकड़े किसान, पुआल के ढेर, बिजूका (मटके का सिर), आम/ताड़.
// सड़क पर: सामने से धीरे आती बैलगाड़ी (भूसे से लदी, गाड़ीवान), 🎋 गन्ना (बोनस मिठाई).
import * as THREE from './three.module.min.js';
import { Merge, MergeUV, mat4, toon } from './art.js';
import { RTU } from './real.js';
import { CHUNK, ROAD_HALF } from './models.js';
import { makeVillager } from './haat.js';
import { treeRound, treePalm } from './jungle.js';
import { rand, pick, chance } from './util.js';

const PI = Math.PI;
const G = {
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  sph: (r, w = 12, h = 9, ...a) => new THREE.SphereGeometry(r, w, h, ...a),
  cap: (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s),
};
let seed = 99;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.92, metalness: 0 }, o));

// ---------- बनावट ----------
let TX = null;
function textures() {
  if (TX) return TX;
  TX = {};
  // जुती मिट्टी: कतारें (z दिशा में), ढेले, नमी के धब्बे
  { const n = 512, [c, x] = cv(n), [h, y] = cv(n);
    x.fillStyle = '#6e4a2e'; x.fillRect(0, 0, n, n); y.fillStyle = '#808080'; y.fillRect(0, 0, n, n);
    for (let i = 0; i < n; i += 32) {
      const g = x.createLinearGradient(i, 0, i + 32, 0); g.addColorStop(0, '#4f3420'); g.addColorStop(0.45, '#8a603c'); g.addColorStop(0.6, '#7a5434'); g.addColorStop(1, '#4a301c');
      x.fillStyle = g; x.fillRect(i, 0, 32, n);
      const gh = y.createLinearGradient(i, 0, i + 32, 0); gh.addColorStop(0, '#303030'); gh.addColorStop(0.5, '#d0d0d0'); gh.addColorStop(1, '#303030');
      y.fillStyle = gh; y.fillRect(i, 0, 32, n);
    }
    for (let k = 0; k < 2400; k++) { const px = rnd() * n, py = rnd() * n, r = 0.6 + rnd() * 1.6; x.fillStyle = rnd() < 0.5 ? 'rgba(40,26,14,0.28)' : 'rgba(150,110,72,0.25)'; x.beginPath(); x.arc(px, py, r, 0, PI * 2); x.fill(); y.fillStyle = 'rgba(230,230,230,0.6)'; y.beginPath(); y.arc(px, py, r, 0, PI * 2); y.fill(); }
    x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.4; x.drawImage(RTU.noiseCanvas(n, 6, 4), 0, 0); x.globalAlpha = 1;
    TX.soil = RTU.tex(c); TX.soilN = RTU.tex(RTU.normalFrom(h, 3.0), false); TX.soil.repeat.set(6, 2); TX.soilN.repeat.set(6, 2); // कतारें ~0.4 मी. पर
  }
  // फ़सल की कतार की बनावट: सरसों (हरे डंठल + पीले फूल) / धान (हरी पत्तियाँ)
  const crop = (flower) => {
    const n = 256, [c, x] = cv(n);
    x.fillStyle = flower ? '#4e7a2a' : '#4f8a2e'; x.fillRect(0, 0, n, n);
    for (let k = 0; k < 2600; k++) { const px = rnd() * n, py = rnd() * n, l = 6 + rnd() * 14; x.strokeStyle = pick(flower ? ['#3d6a22', '#5f8f33', '#6fa03a'] : ['#3f7a26', '#5ea33a', '#7cbf4a', '#8fcc55']); x.lineWidth = 1 + rnd(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 5, py - l); x.stroke(); }
    if (flower) for (let k = 0; k < 2200; k++) { const px = rnd() * n, py = rnd() * n * 0.75; x.fillStyle = pick(['#ffd21a', '#ffc400', '#ffe066', '#f2b705']); x.beginPath(); x.arc(px, py, 1.2 + rnd() * 2.2, 0, PI * 2); x.fill(); }
    return RTU.tex(c);
  };
  TX.mustard = crop(true); TX.paddy = crop(false);
  // पुआल
  { const n = 256, [c, x] = cv(n); x.fillStyle = '#c9a55a'; x.fillRect(0, 0, n, n);
    for (let k = 0; k < 3000; k++) { const px = rnd() * n, py = rnd() * n, a = (rnd() - 0.5) * 1.2 + PI / 2, l = 8 + rnd() * 18; x.strokeStyle = pick(['#e2c27a', '#a8843c', '#d8b464', '#8a6a2e', '#f0d48a']); x.lineWidth = 0.8 + rnd(); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
    TX.straw = RTU.tex(c); }
  // मेड़ की घास
  { const n = 256, [c, x] = cv(n); x.fillStyle = '#6d8a3a'; x.fillRect(0, 0, n, n);
    for (let k = 0; k < 2500; k++) { const px = rnd() * n, py = rnd() * n; x.strokeStyle = pick(['#56742c', '#7f9e44', '#8b7a4a', '#9ab456']); x.lineWidth = 1; x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 4, py - 4 - rnd() * 7); x.stroke(); }
    TX.grass = RTU.tex(c); }
  // लकड़ी
  { const n = 256, [c, x] = cv(n); x.fillStyle = '#7a5532'; x.fillRect(0, 0, n, n);
    for (let k = 0; k < 90; k++) { const py = rnd() * n; x.strokeStyle = pick(['#5e3f22', '#8e6a42', '#6b4a2a']); x.lineWidth = 1 + rnd() * 2; x.beginPath(); x.moveTo(0, py); for (let px = 0; px <= n; px += 16) x.lineTo(px, py + Math.sin(px * 0.05 + k) * 2); x.stroke(); }
    TX.wood = RTU.tex(c); }
  TX.mats = {
    soil: std({ map: TX.soil, normalMap: TX.soilN, roughness: 0.98 }),
    straw: std({ map: TX.straw, roughness: 0.95 }),
    grass: std({ map: TX.grass, roughness: 0.95 }),
    wood: std({ map: TX.wood, roughness: 0.8 }),
  };
  return TX;
}

// ---------- 🐂 बैल (ज़ेबू: कूबड़, लटकती गलकंबल, सींग) — पैर अलग (चाल के लिए) ----------
const BULL_COL = [[0xdcd6cb, 0xa9a196], [0xe6e0d6, 0xb8aea0], [0xc9bba8, 0x8e8170], [0xd8cfc2, 0x9a8f80]];
export function makeBullock(ci = 0) {
  const [body, dark] = BULL_COL[ci % BULL_COL.length];
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.cap(0.42, 1.05, 14), mat4(0, 1.08, 0, PI / 2, 0, 0, 0.82, 1, 1.05), body); // धड़
  mg.add(G.sph(0.4, 14, 10), mat4(0, 1.12, -0.55, 0, 0, 0, 0.85, 0.95, 0.9), body); // पुट्ठा
  mg.add(G.sph(0.3, 14, 10), mat4(0, 1.55, 0.42, 0, 0, 0, 0.75, 1, 1.05), dark); // कूबड़
  mg.add(G.cap(0.22, 0.45, 10), mat4(0, 1.22, 0.85, -0.9, 0, 0), body); // गर्दन
  mg.add(G.sph(0.24, 12, 9), mat4(0, 0.86, 0.72, 0, 0, 0, 0.35, 1, 1.1), body); // गलकंबल
  const head = new THREE.Group(); head.position.set(0, 1.18, 1.12); g.add(head);
  const hg = new Merge();
  hg.add(G.cap(0.16, 0.36, 10), mat4(0, -0.05, 0.12, 1.1, 0, 0, 1, 1, 0.95), body); // लंबा चेहरा
  hg.add(G.sph(0.15, 12, 9), mat4(0, -0.24, 0.33, 0, 0, 0, 1, 0.8, 1), 0x4a4038); // थूथन
  for (const s of [-1, 1]) {
    hg.add(G.sph(0.11, 10, 8), mat4(s * 0.2, 0.06, 0.0, 0, 0, s * 0.6, 1.1, 0.4, 0.7), body); // लटके कान
    const horn = new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.08, 0.14, -0.04), new THREE.Vector3(s * 0.17, 0.32, -0.08), new THREE.Vector3(s * 0.15, 0.5, -0.18)]), 8, 0.035, 6);
    hg.add(horn, mat4(), 0x3a2f26);
    hg.add(G.sph(0.03, 6, 5), mat4(s * 0.1, 0.03, 0.18), 0x111111); // आँख
  }
  const hm = hg.mesh(0); hm.castShadow = true; head.add(hm);
  // पूँछ
  mg.add(G.cyl(0.025, 0.02, 0.8, 5), mat4(0, 0.82, -1.0, 0.15, 0, 0), body);
  mg.add(G.sph(0.06, 6, 5), mat4(0, 0.42, -1.05, 0, 0, 0, 1, 1.8, 1), 0x2a221c);
  const m = mg.mesh(0); m.castShadow = true; g.add(m);
  // पैर: कंधे/कूल्हे से लटकते, खुर गहरे
  const legs = [];
  for (const [x, z] of [[-0.22, 0.6], [0.22, 0.6], [-0.22, -0.62], [0.22, -0.62]]) {
    const L = new THREE.Group(); L.position.set(x, 0.95, z); g.add(L);
    const lm = new Merge();
    lm.add(G.cap(0.075, 0.55, 8), mat4(0, -0.38, 0), body);
    lm.add(G.cap(0.05, 0.25, 6), mat4(0, -0.78, 0.02), dark);
    lm.add(G.cyl(0.06, 0.07, 0.08, 8), mat4(0, -0.92, 0.03), 0x2a221c);
    const lmm = lm.mesh(0); lmm.castShadow = true; L.add(lmm); legs.push(L);
  }
  g.userData.walk = (t, k = 1) => {
    legs.forEach((L, i) => { L.rotation.x = Math.sin(t * 5 + (i === 0 || i === 3 ? 0 : PI)) * 0.32 * k; });
    head.rotation.x = Math.sin(t * 5) * 0.05 * k; head.rotation.y = Math.sin(t * 1.3) * 0.08;
  };
  return g;
}

// ---------- हल जोतती जोड़ी + किसान ----------
function ploughTeam() {
  const T = textures(), g = new THREE.Group();
  const b1 = makeBullock(0), b2 = makeBullock(1); b1.position.x = -0.62; b2.position.x = 0.62; g.add(b1, b2);
  const mg = new Merge();
  mg.add(G.cyl(0.05, 0.05, 1.9, 6), mat4(0, 1.32, 0.95, 0, 0, PI / 2), 0x6b4a2a); // जुआ
  const w = new MergeUV();
  w.add(G.box(0.08, 0.08, 2.8), mat4(0, 0.85, -0.55, -0.18, 0, 0)); // हल की लंबी लकड़ी
  w.add(G.box(0.1, 0.5, 0.1), mat4(0, 0.25, -1.9, 0.5, 0, 0)); // फाल
  w.add(G.box(0.06, 0.9, 0.06), mat4(0, 0.7, -2.05, -0.5, 0, 0)); // मूठ
  const wm = w.mesh(T.mats.wood.map); wm.material = T.mats.wood; wm.castShadow = true; g.add(wm);
  g.add(mg.mesh(0));
  const f = makeVillager({ kind: 'man', mode: 'walk', cloth: 0xf2ede2 }); f.position.set(0.1, 0, -2.6); g.add(f);
  g.userData.anim = (t) => { b1.userData.walk(t * 0.8); b2.userData.walk(t * 0.8 + 0.4); if (f.userData.anim) f.userData.anim(t * 0.8); };
  return g;
}

// ---------- पुआल का ढेर (असली जैसा — गोल ढेर, ऊपर नुकीला, बीच में बाँस) ----------
function haystack(x, z, s = 1) {
  const T = textures(), w = new MergeUV();
  w.add(G.sph(1.25 * s, 16, 10, 0, PI * 2, 0, PI / 2), mat4(x, 0, z, 0, 0, 0, 1, 0.95, 1));
  w.add(new THREE.ConeGeometry(1.0 * s, 1.5 * s, 16), mat4(x, 1.6 * s, z));
  const m = w.mesh(T.straw); m.material = T.mats.straw; m.castShadow = true;
  return m;
}
// बिजूका: बाँस का क्रॉस, पुरानी कमीज़, मटके का सिर
function scarecrow(mg, x, z) {
  mg.add(G.cyl(0.04, 0.05, 2.3, 6), mat4(x, 1.15, z), 0x7a5a2c);
  mg.add(G.cyl(0.03, 0.03, 1.5, 6), mat4(x, 1.6, z, 0, 0, PI / 2), 0x7a5a2c);
  mg.add(G.box(0.55, 0.7, 0.28), mat4(x, 1.35, z), 0x3d5a8a);
  for (const s of [-1, 1]) mg.add(G.box(0.4, 0.14, 0.14), mat4(x + s * 0.45, 1.6, z), 0x3d5a8a);
  mg.add(G.sph(0.22, 12, 9), mat4(x, 2.05, z), 0x9c4f2e);
  mg.add(G.sph(0.03, 5, 4), mat4(x - 0.07, 2.08, z + 0.2), 0xf5f0e6); mg.add(G.sph(0.03, 5, 4), mat4(x + 0.07, 2.08, z + 0.2), 0xf5f0e6);
  mg.add(new THREE.ConeGeometry(0.34, 0.22, 12), mat4(x, 2.3, z), 0xb08a46);
}

// ---------- किनारे का खेत (20 मी. टुकड़ा) ----------
// v % 4: 0 सरसों + बिजूका · 1 जुताई (बैल-हल-किसान) · 2 धान + पुआल · 3 जुती मिट्टी + पुआल के ढेर
export function makeFarmField(side, v = 0) {
  const T = textures(), grp = new THREE.Group(), kind = v % 4;
  const soil = new THREE.Mesh(new THREE.PlaneGeometry(40, CHUNK + 0.2), T.mats.soil);
  soil.rotation.x = -PI / 2; soil.position.set(side * (ROAD_HALF + 20.6), 0.006, 0); soil.receiveShadow = true;
  grp.add(soil);
  // मेड़ (सड़क किनारे घास वाली)
  const bund = new THREE.Mesh(G.box(1.1, 0.32, CHUNK), T.mats.grass); bund.position.set(side * (ROAD_HALF + 0.75), 0.16, 0); bund.receiveShadow = true; grp.add(bund);
  // फ़सल की कतारें
  if (kind === 0 || kind === 2) {
    const w = new MergeUV(), hh = kind === 0 ? 0.85 : 0.55;
    for (let x = 6.4; x < 30; x += 1.25) w.add(G.box(0.85, hh, CHUNK - 0.4), mat4(side * x, hh / 2, 0));
    const m = w.mesh(kind === 0 ? T.mustard : T.paddy); m.material = std({ map: kind === 0 ? T.mustard : T.paddy, roughness: 0.9 }); m.receiveShadow = true; grp.add(m);
  }
  const mg = new Merge();
  if (kind === 0) scarecrow(mg, side * rand(8, 11), rand(-6, 6));
  if (kind === 2 || kind === 3) { grp.add(haystack(side * rand(8, 10), rand(-6, -1), rand(0.9, 1.15))); if (kind === 3) grp.add(haystack(side * rand(12, 15), rand(2, 7), rand(0.8, 1.1))); }
  if (v % 2 === 0) treeRound(mg, side * rand(16, 20), rand(-6, 6), rand(1.1, 1.4));
  for (let i = 0; i < 2; i++) (chance(0.6) ? treePalm : treeRound)(mg, side * rand(26, 36), rand(-CHUNK / 2, CHUNK / 2), rand(1.2, 1.7));
  if (!mg.empty) { const m = mg.mesh(0); m.castShadow = true; grp.add(m); }
  let team = null;
  if (kind === 1) { team = ploughTeam(); team.position.set(side * rand(8.5, 11), 0, 0); team.rotation.y = PI; grp.add(team); }
  const ph = rnd() * 10;
  grp.userData = { type: 'fields', len: CHUNK, glows: [],
    anim: team ? (t, near) => { team.visible = near; if (!near) return; team.userData.anim(t + ph); team.position.z = ((t * 1.1 + ph * 3) % (CHUNK - 6)) - (CHUNK - 6) / 2; } : null };
  return grp;
}

// ---------- 🐂 बैलगाड़ी (सड़क पर, सामने से धीरे आती — लेन बदलो) ----------
export function makeBailgadi() {
  const T = textures(), g = new THREE.Group();
  const b1 = makeBullock(2), b2 = makeBullock(3); b1.position.set(-0.55, 0, 1.6); b2.position.set(0.55, 0, 1.6); g.add(b1, b2);
  const w = new MergeUV();
  w.add(G.box(1.7, 0.12, 2.4), mat4(0, 1.05, -1.0)); // चौकी
  for (const s of [-1, 1]) w.add(G.box(0.08, 0.35, 2.4), mat4(s * 0.85, 1.25, -1.0));
  w.add(G.box(0.1, 0.1, 2.6), mat4(0, 1.0, 1.15)); // धुरा-बल्ली (जुए तक)
  w.add(G.cyl(0.05, 0.05, 1.9, 6), mat4(0, 1.32, 2.55, 0, 0, PI / 2)); // जुआ
  const wm = w.mesh(T.wood); wm.material = T.mats.wood; wm.castShadow = true; g.add(wm);
  // पहिये (लकड़ी, लोहे की पट्टी, आरे) — घूमते
  const wheels = [];
  for (const s of [-1, 1]) {
    const wh = new THREE.Group(); wh.position.set(s * 1.0, 0.72, -1.0); g.add(wh);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.68, 0.06, 6, 24), std({ color: 0x3a3430, roughness: 0.5, metalness: 0.4 })); rim.rotation.y = PI / 2; wh.add(rim);
    const sp = new Merge();
    for (let k = 0; k < 10; k++) sp.add(G.box(0.05, 1.3, 0.05), mat4(0, 0, 0, k * PI / 10, 0, 0), 0x6b4a2a);
    sp.add(G.cyl(0.12, 0.12, 0.2, 10), mat4(0, 0, 0, 0, 0, PI / 2), 0x4a3020);
    const spm = sp.mesh(0); wh.add(spm); wheels.push(wh);
  }
  // भूसे का बोझ + गाड़ीवान
  const load = new MergeUV(); load.add(G.sph(1.0, 14, 9, 0, PI * 2, 0, PI / 2), mat4(0, 1.12, -1.25, 0, 0, 0, 0.85, 0.75, 1.25));
  const lm = load.mesh(T.straw); lm.material = T.mats.straw; lm.castShadow = true; g.add(lm);
  const dr = makeVillager({ kind: 'man', mode: 'sit', cloth: 0xf2ede2 }); dr.position.set(0, 1.1, 0.0); dr.scale.setScalar(0.9); g.add(dr);
  g.userData = { kind: 'block', halfW: 0.95, halfL: 2.4, yMin: 0, yMax: 2.6,
    dance: (t) => { b1.userData.walk(t * 1.4); b2.userData.walk(t * 1.4 + 0.5); for (const wh of wheels) wh.rotation.x = t * 2.2; } };
  return g;
}

// ---------- 🎋 गन्ना (बोनस) ----------
export function makeGanna() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const mg = new Merge();
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * 0.12, rz = (i - 1) * 0.12;
    for (let k = 0; k < 5; k++) { mg.add(G.cyl(0.055, 0.055, 0.3, 8), mat4(x + Math.sin(rz) * k * 0.3, 0.15 + k * 0.31, 0, 0, 0, -rz), k % 2 ? 0x7a2e4a : 0x8e3a58); mg.add(G.cyl(0.062, 0.062, 0.025, 8), mat4(x + Math.sin(rz) * k * 0.3, 0.3 + k * 0.31, 0, 0, 0, -rz), 0xc9b37a); }
    const lf = G.sph(0.3, 6, 4); lf.scale(0.15, 0.05, 1.3); mg.add(lf, mat4(x, 1.65, 0.1, 0.9, i, 0), 0x6fa03a);
  }
  const m = mg.mesh(0); m.position.y = -0.2; inner.add(m);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.05, 8, 28), new THREE.MeshBasicMaterial({ color: 0x9fe07a, transparent: true, opacity: 0.75 }));
  g.add(ring);
  g.userData = { inner, ring };
  return g;
}

export const FARM_OBST = { bailgadi: makeBailgadi };
export const FARM_POOL = { bailgadi: 4 };
