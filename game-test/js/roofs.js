// 🏠 छत-दौड़ (24 नवंबर 2026, मालिक: "घर में सीढ़ी से घुसे, छत पे जाए, एक छत से दूसरी छत, फिर उड़ाए")
// गाँव के पक्के घर (चूने की पुताई, उखड़ा पलस्तर, सामने मधुबनी पट्टी, लकड़ी का दरवाज़ा, नीली जाली वाली खिड़की),
// छत पर: काली पानी की टंकी (बचो), सूखते कपड़ों की रस्सी (फिसलो), तुलसी चौरा (कूदो), पापड़-बड़ी, डिश, मटके,
// पतंग उड़ाते बच्चे. घरों के बीच गली: बाँस की चचरी पर दौड़ो या कूदो; गिरे तो गली की चचरी-ढलान से फिर ऊपर (खेल ख़त्म नहीं).
// आख़िरी छत पर बड़ी पतंग 🪁 — पकड़ो तो आसमान में उड़ान.
import * as THREE from './three.module.min.js';
import { Merge, mat4, toon } from './art.js';
import { RT, RTU } from './real.js';
import { ROOF, RAMP_L } from './rail.js';
import { makeVillager } from './haat.js';
import { rand, pick, chance } from './util.js';

const PI = Math.PI;
export const RW = 8.4;          // घर की चौड़ाई — तीनों लेन ढके (±2.5 + किनारा)
export const GAP_RAMP = 4.6;  // कम ढलान — कम फ़्रेम वाले फ़ोन पर भी चढ़ जाए    // गली में चचरी-ढलान की लंबाई
const G = {
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  sph: (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h),
};
let seed = 777;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function cv(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function srgb(c, rx = 1, ry = 1) { const t = RTU.tex(c); t.repeat.set(rx, ry); return t; }

// ---------- बनावट ----------
const PAL = [['#efe6d2', '#d9c9a8'], ['#f1dca2', '#d8bd74'], ['#e9c9c0', '#c99a8e'], ['#dfe8e0', '#b9c8bd'], ['#f3eadb', '#cdb894']];
let TX = null;
function plasterCanvas(base, dark, n = 512) {
  const [c, x] = cv(n);
  x.fillStyle = base; x.fillRect(0, 0, n, n);
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.35; x.drawImage(RTU.noiseCanvas(n, 6, 4), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  // बरसात की धारियाँ (ऊपर से नीचे)
  for (let i = 0; i < 26; i++) {
    const sx = rnd() * n, w = 6 + rnd() * 26, l = 60 + rnd() * 260, g = x.createLinearGradient(0, 0, 0, l);
    g.addColorStop(0, 'rgba(90,80,64,0.32)'); g.addColorStop(1, 'rgba(90,80,64,0)');
    x.fillStyle = g; x.fillRect(sx, 0, w, l);
  }
  // नीचे सीलन / काई
  const gb = x.createLinearGradient(0, n * 0.72, 0, n); gb.addColorStop(0, 'rgba(70,72,50,0)'); gb.addColorStop(1, 'rgba(70,72,50,0.45)');
  x.fillStyle = gb; x.fillRect(0, n * 0.72, n, n * 0.28);
  // उखड़ा पलस्तर — ईंट झाँकती
  for (let k = 0; k < 3; k++) { // अनियमित आकार (गोल धब्बे नहीं)
    const px = rnd() * n, py = n * (0.35 + rnd() * 0.45), w = 40 + rnd() * 60, h = 18 + rnd() * 26;
    x.save(); x.beginPath(); for (let a = 0; a < 12; a++) { const t = a / 12 * PI * 2, rr = 0.6 + rnd() * 0.5; x[a ? 'lineTo' : 'moveTo'](px + Math.cos(t) * w / 2 * rr, py + Math.sin(t) * h / 2 * rr); } x.closePath(); x.clip();
    x.fillStyle = '#8f7a66'; x.fillRect(px - w, py - h, w * 2, h * 2);
    for (let yy = py - h; yy < py + h; yy += 11) for (let xx = px - w + ((yy / 11) % 2) * 12; xx < px + w; xx += 24) { x.fillStyle = ['#a8573a', '#b5633f', '#9b4d33'][(xx + yy) % 3 | 0]; x.fillRect(xx, yy, 21, 8); }
    x.restore();
  }
  // बारीक दरारें
  x.strokeStyle = 'rgba(60,50,40,0.4)'; x.lineWidth = 1;
  for (let k = 0; k < 18; k++) { let px = rnd() * n, py = rnd() * n; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 5; s++) { px += (rnd() - 0.5) * 26; py += rnd() * 20; x.lineTo(px, py); } x.stroke(); }
  return c;
}
// सामने की दीवार: दरवाज़ा, खिड़कियाँ, ऊपर मधुबनी पट्टी, नीचे लाल पट्टी (प्लिंथ)
function facadeCanvas(base, dark) {
  const W = 1024, H = 400, [c, x] = cv(W, H);
  x.drawImage(plasterCanvas(base, dark, 512), 0, 0, W, H);
  x.fillStyle = '#8c2f22'; x.fillRect(0, H - 44, W, 44); x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(0, H - 44, W, 4);
  // मधुबनी पट्टी — दोहरी लकीरें, मछली-फूल
  const by = 26, bh = 54;
  x.fillStyle = '#f5e6c0'; x.fillRect(0, by, W, bh);
  x.strokeStyle = '#2a1511'; x.lineWidth = 3; for (const yy of [by + 4, by + bh - 4]) { x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
  for (let i = 0; i < 14; i++) {
    const cx = 36 + i * 72, cy = by + bh / 2, col = ['#c4161c', '#2e7b47', '#f2a91b', '#2f4f9a'][i % 4];
    if (i % 2) { // मछली
      x.fillStyle = col; x.beginPath(); x.moveTo(cx - 24, cy); x.quadraticCurveTo(cx, cy - 15, cx + 20, cy); x.quadraticCurveTo(cx, cy + 15, cx - 24, cy); x.fill(); x.stroke();
      x.beginPath(); x.moveTo(cx - 24, cy); x.lineTo(cx - 34, cy - 9); x.lineTo(cx - 34, cy + 9); x.closePath(); x.fill(); x.stroke();
    } else { for (let k = 0; k < 6; k++) { const a = k / 6 * PI * 2; x.fillStyle = col; x.beginPath(); x.ellipse(cx + Math.cos(a) * 9, cy + Math.sin(a) * 9, 7, 4, a, 0, PI * 2); x.fill(); } x.fillStyle = '#f2a91b'; x.beginPath(); x.arc(cx, cy, 5, 0, PI * 2); x.fill(); }
  }
  // लकड़ी का दरवाज़ा (बीच से थोड़ा हटकर), ऊपर स्वस्तिक
  const dx = 470 + (rnd() - 0.5) * 120, dw = 130, dt = 150;
  x.fillStyle = '#4a2c18'; x.fillRect(dx - 8, dt - 8, dw + 16, H - 44 - dt + 8);
  for (let k = 0; k < 2; k++) {
    const g = x.createLinearGradient(dx + k * dw / 2, 0, dx + (k + 1) * dw / 2, 0); g.addColorStop(0, '#7a4a28'); g.addColorStop(1, '#5e3820');
    x.fillStyle = g; x.fillRect(dx + k * dw / 2 + 2, dt, dw / 2 - 4, H - 44 - dt);
    x.strokeStyle = '#3a2212'; x.lineWidth = 3; for (let r = 0; r < 3; r++) x.strokeRect(dx + k * dw / 2 + 10, dt + 12 + r * 58, dw / 2 - 20, 46);
  }
  x.fillStyle = '#c4161c'; x.font = 'bold 30px serif'; x.textAlign = 'center'; x.fillText('卐', dx + dw / 2, dt - 16);
  // नीली जाली वाली खिड़कियाँ
  for (const wx of [130, 820]) {
    x.fillStyle = '#2b3d52'; x.fillRect(wx, 140, 110, 120);
    x.strokeStyle = '#3f86b8'; x.lineWidth = 5; x.strokeRect(wx, 140, 110, 120);
    x.lineWidth = 3; for (let k = 1; k < 5; k++) { x.beginPath(); x.moveTo(wx + k * 22, 140); x.lineTo(wx + k * 22, 260); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(wx - 6, 262, 122, 8); // छज्जा की छाया
  }
  return c;
}
function terraceCanvas(n = 512) {
  const [c, x] = cv(n);
  x.fillStyle = '#9c968a'; x.fillRect(0, 0, n, n);
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.drawImage(RTU.noiseCanvas(n, 6, 4), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 40; i++) { const px = rnd() * n, py = rnd() * n, r = 10 + rnd() * 50, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, rnd() < 0.5 ? 'rgba(60,58,50,0.3)' : 'rgba(80,90,60,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2); }
  x.strokeStyle = 'rgba(50,45,40,0.45)'; x.lineWidth = 1.2;
  for (let k = 0; k < 14; k++) { let px = rnd() * n, py = rnd() * n; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 6; s++) { px += (rnd() - 0.5) * 40; py += (rnd() - 0.5) * 40; x.lineTo(px, py); } x.stroke(); }
  return c;
}
function bambooCanvas(n = 256) {
  const [c, x] = cv(n);
  x.fillStyle = '#b08a4e'; x.fillRect(0, 0, n, n);
  for (let i = 0; i < n; i += 16) {
    const g = x.createLinearGradient(i, 0, i + 16, 0); g.addColorStop(0, '#8a6a36'); g.addColorStop(0.3, '#d2b06a'); g.addColorStop(0.7, '#c29c58'); g.addColorStop(1, '#7a5a2c');
    x.fillStyle = g; x.fillRect(i, 0, 15, n);
    for (let k = 0; k < 3; k++) { const yy = rnd() * n; x.fillStyle = 'rgba(70,50,20,0.55)'; x.fillRect(i, yy, 15, 3); } // गाँठ
  }
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.3; x.drawImage(RTU.noiseCanvas(n, 4, 6), 0, 0); x.globalAlpha = 1;
  return c;
}
function textures() {
  if (TX) return TX;
  TX = { plaster: PAL.map(([b, d]) => plasterCanvas(b, d)), facade: PAL.map(([b, d]) => facadeCanvas(b, d)), terrace: terraceCanvas(), bamboo: bambooCanvas() };
  TX.plasterN = RTU.normalFrom(RTU.noiseCanvas(256, 5, 6), 1.6);
  TX.terraceN = RTU.normalFrom(RTU.noiseCanvas(256, 6, 8), 2.2);
  return TX;
}
const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.9, metalness: 0 }, o));

// ---------- पक्का घर (छत पर दौड़ो) ----------
function clothes(mg, x, z0, len, h, y0 = ROOF) {
  // दो बाँस के खंभे + रस्सी + सूखती साड़ी/धोती/गमछे (छत पर)
  for (const z of [z0, z0 - len]) mg.add(G.cyl(0.04, 0.05, h, 6), mat4(x, y0 + h / 2, z), 0x7a5a2c);
  mg.add(G.box(0.02, 0.02, len), mat4(x, y0 + h - 0.08, z0 - len / 2), 0xdedede);
  let z = z0 - 0.3;
  while (z > z0 - len + 0.4) {
    const w = 0.5 + rnd() * 0.9, d = 0.5 + rnd() * 0.7, col = pick([0xc62828, 0xf2a91b, 0x1565c0, 0xffffff, 0x2e7d32, 0xd8457f, 0xf4efe6]);
    mg.add(G.box(0.025, d, w), mat4(x, y0 + h - 0.08 - d / 2, z - w / 2, 0, 0, (rnd() - 0.5) * 0.08), col);
    z -= w + 0.15;
  }
}
function kidWithKite() {
  const g = new THREE.Group();
  const kid = makeVillager({ kind: 'kid', mode: 'walk' }); kid.scale.setScalar(0.8); g.add(kid);
  const kite = new THREE.Group(); kite.position.set(0, 9, -4); g.add(kite);
  const col = pick([0xd32f2f, 0xf2a91b, 0x2e7d32, 0x7b1fa2, 0x1565c0]);
  const k = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), std({ color: col, side: THREE.DoubleSide, roughness: 0.7 })); k.rotation.z = PI / 4; kite.add(k);
  const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.9), std({ color: 0xffffff, side: THREE.DoubleSide })); tail.position.y = -0.85; kite.add(tail);
  const str = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 4), new THREE.MeshBasicMaterial({ color: 0xeeeeee })); g.add(str);
  g.userData.kite = kite; g.userData.str = str;
  return g;
}
const _d = new THREE.Vector3(), _Y = new THREE.Vector3(0, 1, 0);
export function makeRoofHouse(L) {
  const T = textures(), v = Math.floor(rnd() * PAL.length);
  const g = new THREE.Group();
  const side = std({ map: srgb(T.plaster[v], L / 5, 1), normalMap: (() => { const t = RTU.tex(T.plasterN, false); t.repeat.set(L / 5, 1); return t; })() });
  const front = std({ map: srgb(T.facade[v], 1, 1) });
  const top = std({ map: srgb(T.terrace, 2, L / 4), normalMap: (() => { const t = RTU.tex(T.terraceN, false); t.repeat.set(2, L / 4); return t; })(), roughness: 0.95 });
  const box = new THREE.Mesh(G.box(RW, ROOF, L), [side, side, top, side, front, side]);
  box.position.y = ROOF / 2; box.castShadow = true; box.receiveShadow = true; g.add(box);
  const mg = new Merge();
  const par = [0xe6dcc8, 0xd9c69a, 0xe2c4b8, 0xd3ddd4, 0xe8dcc8][v];
  // किनारे की मुंडेर (दोनों बगल), बीच-बीच में जाली के खाने
  for (const s of [-1, 1]) {
    mg.add(G.box(0.22, 0.55, L), mat4(s * (RW / 2 - 0.11), ROOF + 0.275, 0), par);
    mg.add(G.box(0.28, 0.06, L), mat4(s * (RW / 2 - 0.11), ROOF + 0.58, 0), 0xb8ab90);
    for (let z = -L / 2 + 1; z < L / 2 - 0.6; z += 1.6) mg.add(G.box(0.24, 0.24, 0.5), mat4(s * (RW / 2 - 0.11), ROOF + 0.3, z), 0x7a6a58);
  }
  // छज्जा (दरवाज़े के ऊपर) — सामने
  mg.add(G.box(RW * 0.92, 0.08, 0.45), mat4(0, ROOF - 0.55, L / 2 + 0.2), 0xbdb3a0);
  // छत की सजावट — लेनों से बाहर (|x| > 3.2) ताकि रास्ते में न आए
  const sx = chance(0.5) ? -1 : 1;
  clothes(mg, sx * 3.55, L / 2 - 1.5, Math.min(L - 3, 6 + rnd() * 3), 1.9);
  for (let i = 0; i < 3; i++) mg.add(G.cyl(0.42, 0.42, 0.02, 16), mat4(-sx * 3.55, ROOF + 0.02, -L / 2 + 2 + i * 1.1), 0xd9c08a); // सूखते पापड़/बड़ी की चटाई
  for (let i = 0; i < 2; i++) { mg.add(G.sph(0.24, 12, 9), mat4(-sx * 3.6, ROOF + 0.22, L / 2 - 1.5 - i * 0.6), 0xa0522d); mg.add(G.cyl(0.1, 0.12, 0.08, 10), mat4(-sx * 3.6, ROOF + 0.45, L / 2 - 1.5 - i * 0.6), 0x8a4523); } // मटके
  if (chance(0.6)) { mg.add(G.cyl(0.03, 0.03, 1.2, 6), mat4(-sx * 3.75, ROOF + 0.6, -L / 2 + 0.8), 0x888888); mg.add(new THREE.SphereGeometry(0.38, 14, 8, 0, PI * 2, 0, PI * 0.35), mat4(-sx * 3.62, ROOF + 1.15, -L / 2 + 0.8, -PI / 2.6, -sx * 0.6, 0), 0xdcdcdc); } // TV डिश
  const m = mg.mesh(0); m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  // पतंग उड़ाता बच्चा (कुछ घरों पर)
  let kid = null;
  if (chance(0.55)) { kid = kidWithKite(); kid.position.set(sx * 3.5, ROOF, -L / 2 + 2.2); kid.rotation.y = PI + sx * 0.4; g.add(kid); }
  const ph = rnd() * 10;
  g.userData = { kind: 'train', halfW: 3.85, halfL: L / 2, yMin: 0, yMax: ROOF, roof: ROOF, house: 1,
    dance: kid ? (t) => { const K = kid.userData.kite; K.position.x = Math.sin(t * 0.7 + ph) * 1.6; K.position.y = 9 + Math.sin(t * 1.3 + ph) * 0.6; K.rotation.z = Math.sin(t * 1.1 + ph) * 0.25;
      const s = kid.userData.str, b = K.position; _d.set(b.x - 0.25, b.y - 1.1, b.z); const len = _d.length();
      s.position.set(0.25 + _d.x / 2, 1.1 + _d.y / 2, _d.z / 2); s.scale.y = len; s.quaternion.setFromUnitVectors(_Y, _d.normalize()); } : null };
  return g;
}

// ---------- चौड़ी ईंट की सीढ़ी (घर के आगे, तीनों लेन) ----------
export function makeRoofStairs() {
  const g = new THREE.Group(), n = 13, mg = new Merge();
  const brick = std({ map: (() => { const t = RT.road ? RT.road.clone() : null; if (t) { t.needsUpdate = true; t.repeat.set(3, 0.35); } return t; })(), color: 0xffffff, roughness: 0.85 });
  for (let k = 0; k < n; k++) {
    const h = ROOF * (k + 1) / n, d = RAMP_L / n, z = RAMP_L / 2 - (k + 0.5) * d;
    const s = new THREE.Mesh(G.box(RW - 0.6, h, d + 0.01), brick); s.position.set(0, h / 2, z); s.castShadow = true; s.receiveShadow = true; g.add(s);
  }
  // दोनों ओर ढलवाँ दीवार + ऊपर लोहे की रेलिंग
  const ang = Math.atan2(ROOF, RAMP_L), Ls = Math.hypot(ROOF, RAMP_L);
  for (const s of [-1, 1]) {
    mg.add(G.box(0.3, 0.5, Ls), mat4(s * (RW / 2 - 0.15), ROOF / 2 + 0.15, 0, ang, 0, 0), 0xd9cdb4);
    mg.add(G.box(0.05, 0.05, Ls), mat4(s * (RW / 2 - 0.15), ROOF / 2 + 1.05, 0, ang, 0, 0), 0x3a3a3a);
    for (let k = 0; k < 6; k++) { const z = RAMP_L / 2 - (k + 0.5) * RAMP_L / 6, hh = ROOF * (0.5 - z / RAMP_L); mg.add(G.box(0.04, 0.75, 0.04), mat4(s * (RW / 2 - 0.15), hh + 0.6, z), 0x3a3a3a); }
  }
  const m = mg.mesh(0); m.castShadow = true; g.add(m);
  g.userData = { kind: 'ramp', halfW: 3.85, halfL: RAMP_L / 2, yMin: 0, yMax: 0, ramp: ROOF };
  return g;
}

// ---------- गली की चचरी-ढलान (गिरे तो इससे फिर छत पर) ----------
export function makeGapRamp() {
  const g = new THREE.Group(), T = textures();
  const bam = std({ map: srgb(T.bamboo, 6, 1), roughness: 0.8 });
  const ang = Math.atan2(ROOF, GAP_RAMP), Ls = Math.hypot(ROOF, GAP_RAMP);
  const deck = new THREE.Mesh(G.box(RW - 0.4, 0.1, Ls), bam); deck.position.set(0, ROOF / 2, 0); deck.rotation.x = ang; deck.castShadow = true; deck.receiveShadow = true; g.add(deck);
  const mg = new Merge();
  for (const x of [-3.5, -1.2, 1.2, 3.5]) mg.add(G.cyl(0.06, 0.07, ROOF, 6), mat4(x, ROOF / 2, -GAP_RAMP / 2 + 0.2), 0x7a5a2c);
  for (const s of [-1, 1]) mg.add(G.cyl(0.05, 0.05, Ls, 6), mat4(s * (RW / 2 - 0.3), ROOF / 2 + 0.12, 0, ang + PI / 2, 0, 0), 0x6b4a22);
  g.add(mg.mesh(0));
  g.userData = { kind: 'ramp', halfW: 3.85, halfL: GAP_RAMP / 2, yMin: 0, yMax: 0, ramp: ROOF, rl: GAP_RAMP };
  return g;
}
// ---------- बाँस का पुल (एक लेन, छत की ऊँचाई पर) ----------
export function makeBridge(len = 6) {
  const g = new THREE.Group(), T = textures();
  const bam = std({ map: srgb(T.bamboo, 2, 1), roughness: 0.8 });
  const deck = new THREE.Mesh(G.box(1.9, 0.12, len + 0.6), bam); deck.position.y = ROOF - 0.06; deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
  const mg = new Merge();
  for (const s of [-1, 1]) {
    mg.add(G.cyl(0.035, 0.035, len + 0.6, 6), mat4(s * 0.95, ROOF + 0.85, 0, PI / 2, 0, 0), 0x8a6a36);
    for (let z = -len / 2; z <= len / 2; z += 1.5) mg.add(G.cyl(0.03, 0.03, 0.9, 5), mat4(s * 0.95, ROOF + 0.4, z), 0x7a5a2c);
  }
  g.add(mg.mesh(0));
  g.userData = { kind: 'train', halfW: 1.12, halfL: len / 2 + 0.3, yMin: ROOF - 0.15, yMax: ROOF, roof: ROOF, bridge: 1 };
  return g;
}

// ---------- छत की रुकावटें (y = ROOF पर रखी जाती हैं) ----------
export function makeTank() { // काली पानी की टंकी, ईंट के चबूतरे पर — बचो (लेन बदलो)
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.box(1.5, 0.5, 1.5), mat4(0, 0.25, 0), 0xa0583c);
  const tank = new THREE.Mesh(G.cyl(0.68, 0.72, 1.35, 22), std({ color: 0x1c1c1c, roughness: 0.45 })); tank.position.y = 1.18; tank.castShadow = true; g.add(tank);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.705, 0.025, 6, 24), std({ color: 0x111111, roughness: 0.4 })); r.rotation.x = PI / 2; r.position.y = 0.65 + i * 0.32; g.add(r); }
  mg.add(G.cyl(0.32, 0.36, 0.12, 16), mat4(0, 1.92, 0), 0x222222);
  mg.add(G.cyl(0.04, 0.04, 1.1, 6), mat4(0.6, 0.55, 0.3), 0xdddddd); // पाइप
  const m = mg.mesh(0); m.castShadow = true; g.add(m);
  g.userData = { kind: 'block', halfW: 0.92, halfL: 0.85, yMin: 0, yMax: 2.1 };
  return g;
}
export function makeClothLine() { // लेन के आर-पार रस्सी पर साड़ी — नीचे से फिसलो
  const g = new THREE.Group(), mg = new Merge();
  for (const s of [-1, 1]) mg.add(G.cyl(0.04, 0.05, 2.9, 6), mat4(s * 1.15, 1.45, 0), 0x7a5a2c);
  mg.add(G.box(2.3, 0.02, 0.02), mat4(0, 2.82, 0), 0xdedede);
  const cloth = new THREE.Group(); cloth.position.y = 2.82; g.add(cloth);
  let x = -1.05;
  while (x < 1.0) {
    const w = 0.45 + rnd() * 0.5, d = 1.1 + rnd() * 0.5;
    const c = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std({ color: pick([0xc62828, 0xf2a91b, 0x1565c0, 0xd8457f, 0x2e7d32, 0x7b1fa2]), side: THREE.DoubleSide, roughness: 0.85 }));
    c.position.set(x + w / 2, -d / 2, 0); c.castShadow = true; cloth.add(c); x += w + 0.06;
  }
  g.add(mg.mesh(0));
  g.userData = { kind: 'high', halfW: 1.05, halfL: 0.22, yMin: 1.2, yMax: 3.3, dance: (t) => { cloth.rotation.x = Math.sin(t * 2.6) * 0.09; } };
  return g;
}
export function makeTulsi() { // तुलसी चौरा — कूदो
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.box(0.95, 0.75, 0.95), mat4(0, 0.375, 0), 0xe8d8b8);
  mg.add(G.box(1.05, 0.08, 1.05), mat4(0, 0.78, 0), 0xc4161c);
  for (let i = 0; i < 4; i++) mg.add(G.box(0.2, 0.2, 0.02), mat4(0, 0.4, 0.48, 0, i * PI / 2, PI / 4), 0xf2a91b);
  for (let i = 0; i < 14; i++) mg.add(G.sph(0.11 + rnd() * 0.06, 7, 5), mat4((rnd() - 0.5) * 0.4, 0.95 + rnd() * 0.25, (rnd() - 0.5) * 0.4), rnd() < 0.5 ? 0x2e6b2e : 0x3e8a3a);
  const m = mg.mesh(0); m.castShadow = true; g.add(m);
  g.userData = { kind: 'low', halfW: 0.9, halfL: 0.36, yMin: 0, yMax: 0.85 }; // बैरियर जितना कूदने लायक
  return g;
}

// ---------- 🪁 बड़ी पतंग (आख़िरी छत पर) — पकड़ो = उड़ान ----------
export function kiteMesh(s = 1) {
  const g = new THREE.Group();
  const [c, x] = cv(256);
  x.fillStyle = '#d1261c'; x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#f2a91b'; x.beginPath(); x.moveTo(128, 0); x.lineTo(256, 128); x.lineTo(128, 256); x.closePath(); x.fill();
  x.fillStyle = '#2e7b47'; x.beginPath(); x.arc(128, 128, 34, 0, PI * 2); x.fill();
  x.strokeStyle = '#2a1511'; x.lineWidth = 6; x.beginPath(); x.moveTo(0, 128); x.lineTo(256, 128); x.moveTo(128, 0); x.lineTo(128, 256); x.stroke();
  const t = RTU.tex(c);
  const k = new THREE.Mesh(new THREE.PlaneGeometry(1.5 * s, 1.5 * s), std({ map: t, side: THREE.DoubleSide, roughness: 0.75 })); k.rotation.z = PI / 4; g.add(k);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.75 * s, 0.02 * s, 4, 16, PI * 0.9), std({ color: 0x6b4a22 })); bow.rotation.z = PI * 0.05; bow.position.y = 0.2 * s; g.add(bow);
  for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.18 * s, 0.32 * s), std({ color: [0xffffff, 0xf2a91b, 0xd1261c, 0x2e7b47][i], side: THREE.DoubleSide })); r.position.y = -(1.15 + i * 0.36) * s; r.rotation.z = (i % 2 ? 0.3 : -0.3); g.add(r); }
  return g;
}
export function makeKitePu() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const k = kiteMesh(1); k.position.y = 0.6; inner.add(k);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 8, 32), new THREE.MeshBasicMaterial({ color: 0xffd24d, transparent: true, opacity: 0.8 }));
  g.add(ring);
  g.userData = { inner, ring };
  return g;
}

export const ROOF_OBST = {
  rhouse12: () => makeRoofHouse(12), rhouse16: () => makeRoofHouse(16),
  rstair: makeRoofStairs, rgap: makeGapRamp, rbridge: () => makeBridge(6),
  rtank: makeTank, rcloth: makeClothLine, rtulsi: makeTulsi,
};
export const ROOF_POOL = { rhouse12: 7, rhouse16: 7, rstair: 2, rgap: 8, rbridge: 5, rtank: 9, rcloth: 7, rtulsi: 6 };
