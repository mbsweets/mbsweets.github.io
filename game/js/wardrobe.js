// गोलू की अलमारी — कपड़ों का रंग बदलना (मालिक के 3D मॉडल के टेक्सचर पर) + पगड़ी/मुकुट/चश्मा/केप/गुब्बारा जोड़ना
// img/golu_mask.png: हर पिक्सेल किस कपड़े का — 1 पगड़ी, 2 कुर्ता, 3 गमछा, 4 धोती, 5 चप्पल, 6 धोती की किनारी
import * as THREE from './three.module.min.js';
import { mat4, Merge, toon, addOutline } from './art.js';

const PI = Math.PI;
// rgb: लाल धागा (r) और सफ़ेद धागा (w) किस रंग में; null = वैसा ही
export const LOOKS = {
  h_gamchha: {},
  h_peeli: { turban: { r: [236, 178, 22], w: [255, 240, 196] } },
  h_kesari: { turban: { r: [236, 106, 16], w: [255, 196, 110] } },
  h_pag: { turban: { r: [158, 14, 28], w: [232, 176, 58] }, att: 'pag' },
  h_holi: { turban: { holi: true } },
  h_mor: { att: 'mor' },
  h_mukut: { turban: { r: [150, 18, 40], w: [250, 225, 160] }, att: 'mukut' },
  b_safed: {},
  b_peela: { kurta: [250, 212, 64] },
  b_hara: { kurta: [92, 186, 106], gamchha: { r: [236, 160, 24], w: [255, 246, 214] } },
  b_jersey: { kurta: [36, 92, 204], gamchha: { r: [250, 128, 24], w: [255, 255, 255] }, dhoti: [245, 245, 250] },
  b_dulha: { kurta: [244, 214, 146], gamchha: { r: [146, 14, 38], w: [236, 182, 60] }, dhoti: [255, 242, 220], border: [222, 168, 40] },
  b_cape: { att: 'cape' },
  f_chappal: {},
  f_khadau: { sandal: [168, 112, 58] },
  f_sports: { sandal: [226, 38, 40], fx: 'dust' },
  f_sona: { sandal: [246, 196, 40], fx: 'sparkle' },
  x_none: {},
  x_chashma: { att: 'chashma' },
  x_gubbara: { att: 'gubbara' },
  x_chamak: { fx: 'trail' },
};

let MASK = null, BASE = null;
export async function loadWardrobe(baseTex) {
  const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'img/golu_mask.png'; });
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data;
  MASK = new Uint8Array(c.width * c.height);
  for (let i = 0; i < MASK.length; i++) MASK[i] = d[i * 4];
  const src = baseTex.image;
  const c2 = document.createElement('canvas'); c2.width = src.width; c2.height = src.height;
  const x2 = c2.getContext('2d', { willReadFrequently: true }); x2.drawImage(src, 0, 0);
  BASE = { w: c2.width, h: c2.height, data: x2.getImageData(0, 0, c2.width, c2.height).data };
}

// कपड़े के पिक्सेल का नया रंग — छाया/सिलवट बचाकर (मूल चमक के अनुपात से)
function tint(d, o, rgb, ref) {
  const lum = (0.3 * d[o] + 0.59 * d[o + 1] + 0.11 * d[o + 2]) / ref;
  const k = Math.min(1.25, lum);
  d[o] = Math.min(255, rgb[0] * k); d[o + 1] = Math.min(255, rgb[1] * k); d[o + 2] = Math.min(255, rgb[2] * k);
}
function hsl2rgb(h, s, l) {
  const f = (n) => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [f(0), f(8), f(4)];
}
// outfit: { head, body, feet, extra } → नया टेक्सचर (या null = मूल)
export function makeTexture(outfit, baseTex) {
  if (!MASK || !BASE) return null;
  const L = Object.assign({}, LOOKS[outfit.head] || {}, LOOKS[outfit.body] || {}, LOOKS[outfit.feet] || {});
  const tur = (LOOKS[outfit.head] || {}).turban, bodyL = LOOKS[outfit.body] || {}, feetL = LOOKS[outfit.feet] || {};
  if (!tur && !bodyL.kurta && !bodyL.gamchha && !bodyL.dhoti && !feetL.sandal) return null;
  const { w, h } = BASE, d = new Uint8ClampedArray(BASE.data);
  for (let p = 0, o = 0; p < MASK.length; p++, o += 4) {
    const m = MASK[p];
    if (!m) continue;
    const r = d[o], g = d[o + 1], b = d[o + 2];
    const isRed = r > 110 && r > g * 1.45 && r > b * 1.3;
    if (m === 1 && tur) {
      if (tur.holi) { const hue = ((p % w) * 0.9 + Math.floor(p / w) * 0.6) % 360; tint(d, o, hsl2rgb(hue, 0.85, isRed ? 0.5 : 0.72), isRed ? 120 : 225); }
      else if (isRed) tint(d, o, tur.r, 125); else tint(d, o, tur.w, 228);
    } else if (m === 2 && bodyL.kurta) tint(d, o, bodyL.kurta, 228);
    else if (m === 3 && bodyL.gamchha) { if (isRed) tint(d, o, bodyL.gamchha.r, 125); else tint(d, o, bodyL.gamchha.w, 228); }
    else if (m === 4 && bodyL.dhoti) tint(d, o, bodyL.dhoti, 228);
    else if (m === 6 && bodyL.border) tint(d, o, bodyL.border, 125);
    else if (m === 5 && feetL.sandal) tint(d, o, feetL.sandal, 95);
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').putImageData(new ImageData(d, w, h), 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  void L;
  return t;
}

// ---------------- जोड़ने वाली चीज़ें (मॉडल की इकाई में: सिर ~0.1–0.5, चेहरा +z) ----------------
const G = {
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 18, arc = PI * 2) => new THREE.TorusGeometry(r, t, s, n, arc),
};
const GOLD = 0xe8b730, GOLD2 = 0xc8901a;
function goldMat() { return new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.75, roughness: 0.28, color: 0xffffff }); }
function vcMesh(mg, metal = false, th = 0.004) {
  const m = new THREE.Mesh(mg.build(), metal ? goldMat() : toon(0xffffff, { vc: true }));
  if (th) addOutline(m, th);
  m.castShadow = true;
  return m;
}
// सिर की हड्डी के सापेक्ष (हड्डी का बिंदु मॉडल में ~ [0.02, 0.12, -0.03])
const HEAD = [0.02, 0.12, -0.03];
const hp = (x, y, z) => [x - HEAD[0], y - HEAD[1], z - HEAD[2]];
export function makeAttachment(kind) {
  const g = new THREE.Group();
  if (kind === 'mukut') { // राजा का मुकुट — पगड़ी के ऊपर
    const mg = new Merge();
    mg.add(G.cyl(0.14, 0.15, 0.06, 20), mat4(0, 0, 0), GOLD);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; mg.add(G.cone(0.035, 0.11, 6), mat4(Math.cos(a) * 0.13, 0.08, Math.sin(a) * 0.13), GOLD); mg.add(G.sph(0.018, 8, 6), mat4(Math.cos(a) * 0.13, 0.145, Math.sin(a) * 0.13), 0xfff2b0); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2; mg.add(G.sph(0.022, 8, 6), mat4(Math.cos(a) * 0.15, 0.0, Math.sin(a) * 0.15), [0xd1261c, 0x2e7b47, 0x2f6fb6][i % 3]); }
    const m = vcMesh(mg, true); const [x, y, z] = hp(0.02, 0.5, -0.12); m.position.set(x, y, z); m.rotation.x = -0.25; g.add(m);
  } else if (kind === 'pag') { // मिथिला पाग का सुनहरा अर्धचंद्र
    const mg = new Merge();
    mg.add(G.tor(0.07, 0.016, 6, 16, PI), mat4(0, 0, 0, 0, 0, 0), GOLD);
    mg.add(G.sph(0.025, 8, 6), mat4(0, 0.0, 0.01), 0xd1261c);
    for (let i = 0; i < 5; i++) mg.add(G.sph(0.012, 6, 4), mat4(-0.06 + i * 0.03, -0.035, 0.01), 0xfff2b0);
    const m = vcMesh(mg, true); const [x, y, z] = hp(0.02, 0.44, 0.06); m.position.set(x, y, z); m.rotation.x = -0.5; g.add(m);
  } else if (kind === 'mor') { // मोर पंख — पगड़ी में खोंसा
    const mg = new Merge();
    mg.add(G.cyl(0.006, 0.008, 0.32, 5), mat4(0, 0.16, 0), 0xcfc29a);
    for (let i = 0; i < 9; i++) { const y = 0.12 + i * 0.026; mg.add(G.box(0.12 - Math.abs(i - 5) * 0.012, 0.012, 0.004), mat4(0, y, 0), 0x2e8b57); }
    mg.add(G.sph(0.05, 12, 8), mat4(0, 0.31, 0.001, 0, 0, 0, 0.75, 1, 0.12), 0x1e7a6a);
    mg.add(G.sph(0.034, 12, 8), mat4(0, 0.31, 0.006, 0, 0, 0, 0.75, 1, 0.12), 0x2f6fb6);
    mg.add(G.sph(0.018, 10, 8), mat4(0, 0.31, 0.01, 0, 0, 0, 0.75, 1, 0.12), 0x1a1240);
    const m = vcMesh(mg, false, 0.003); const [x, y, z] = hp(0.12, 0.38, -0.08); m.position.set(x, y, z); m.rotation.set(-0.3, 0, -0.45); g.add(m);
    g.userData.sway = m;
  } else if (kind === 'chashma') { // काला चश्मा
    const mg = new Merge();
    for (const s of [-1, 1]) { mg.add(G.cyl(0.048, 0.048, 0.012, 18), mat4(0.058 * s, 0, 0, PI / 2, 0, 0), 0x111111); mg.add(G.tor(0.05, 0.007, 6, 18), mat4(0.058 * s, 0, 0.004), 0x222222); mg.add(G.box(0.012, 0.012, 0.16), mat4(0.11 * s, 0.01, -0.08), 0x222222); }
    mg.add(G.box(0.03, 0.01, 0.01), mat4(0, 0.015, 0.004), 0x222222);
    const m = vcMesh(mg, false, 0); const [x, y, z] = hp(0.035, 0.245, 0.115); m.position.set(x, y, z);
    // चमक की लकीर
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 0.06), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 }));
    sh.position.set(-0.045, 0.01, 0.008); sh.rotation.z = 0.6; m.add(sh);
    g.add(m);
  }
  return g;
}
// पीठ पर (spine हड्डी, बिंदु ~[0, -0.06, 0]) — केप और गुब्बारा
const SPINE = [0, -0.06, 0];
export function makeBackItem(kind) {
  const g = new THREE.Group();
  if (kind === 'cape') {
    const W = 14, Hh = 10;
    const geo = new THREE.PlaneGeometry(0.36, 0.44, W, Hh);
    geo.translate(0, -0.22, 0);
    const pos = geo.attributes.position, colors = [];
    const cRed = new THREE.Color(0x9a0a12), cGold = new THREE.Color(0xe8b730);
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i), k = -y / 0.44;
      pos.setX(i, pos.getX(i) * (0.62 + 0.55 * k)); // ऊपर पतला, नीचे चौड़ा
      const x = pos.getX(i), edge = y < -0.41 || Math.abs(x) > 0.18 * (0.62 + 0.55 * k) * 0.92;
      const c = edge ? cGold : cRed; colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.userData.base = Float32Array.from(pos.array);
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }));
    m.castShadow = true;
    m.position.set(0 - SPINE[0], 0.13 - SPINE[1], -0.19 - SPINE[2]);
    // सुनहरा "ग" बिल्ला
    const em = new THREE.Mesh(new THREE.CircleGeometry(0.06, 20), new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide }));
    em.position.set(0, -0.18, -0.004); em.rotation.y = PI; m.add(em);
    g.add(m); g.userData.cape = m;
  } else if (kind === 'gubbara') {
    const string = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.6, 4), new THREE.MeshBasicMaterial({ color: 0xeeeeee }));
    string.position.set(0.2, 0.33, -0.22); string.rotation.z = -0.15; g.add(string);
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 14), new THREE.MeshStandardMaterial({ color: 0xff3d6e, roughness: 0.25, metalness: 0.05 }));
    b.scale.set(1, 1.18, 1); b.position.set(0.24, 0.72, -0.22); b.castShadow = true;
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.035, 8), b.material); knot.position.y = -0.14; knot.rotation.x = PI; b.add(knot);
    const hl = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); hl.position.set(-0.04, 0.05, 0.09); b.add(hl);
    g.add(b); g.userData.balloon = b; g.userData.string = string;
  }
  return g;
}
// हर फ़्रेम: केप लहराए, गुब्बारा डोले, पंख हिले
export function animWear(w, t, speed = 0) {
  if (!w) return;
  if (w.cape) {
    const m = w.cape, pos = m.geometry.attributes.position, base = m.geometry.userData.base;
    const f = 0.6 + Math.min(1.4, speed / 18);
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3], y = base[i * 3 + 1], k = -y / 0.44;
      pos.setZ(i, base[i * 3 + 2] - k * 0.16 * f - Math.sin(t * 9 + k * 5 + x * 6) * 0.035 * k * f);
    }
    pos.needsUpdate = true; m.geometry.computeVertexNormals();
  }
  if (w.balloon) { w.balloon.position.x = 0.24 + Math.sin(t * 1.7) * 0.04; w.balloon.position.z = -0.22 - 0.05 * Math.min(1, speed / 20) + Math.cos(t * 1.3) * 0.03; w.string.rotation.z = -0.15 - Math.sin(t * 1.7) * 0.07; }
  if (w.sway) w.sway.rotation.z = -0.45 + Math.sin(t * 6) * 0.08;
}
