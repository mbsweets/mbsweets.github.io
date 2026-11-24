// 🧒 बचपन वाले नज़ारे (24 नवंबर 2026, मालिक: "बचपन याद आ जाएगी… छोटा-बड़ा, बूढ़ा सब खेलें")
//   🛞 टायर-डंडा वाला बच्चा — पीछे से आकर गोलू से रेस लगाता है, थककर पीछे छूटता है (आगे निकलो = इनाम)
//   🚰 चापाकल — बच्चा हत्था चलाता, पानी की धार और छींटे
//   🍧 बर्फ़ के गोले का ठेला — "टन-टन" घंटी; सड़क पर रखा गोला पकड़ो = थोड़ी देर ठंडी-ठंडी तेज़ दौड़
//   🏏 गिल्ली-डंडा — एक बच्चा डंडा मारता, गिल्ली उछलती, दूसरा लपकने दौड़ता
// सब सड़क किनारे फ़ुटपाथ पर (|x| ≈ 5–6), लेनों से बाहर — रास्ता नहीं रोकते.
import * as THREE from './three.module.min.js';
import { Merge, mat4 } from './art.js';
import { makeVillager } from './haat.js';

const PI = Math.PI;
const G = {
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  sph: (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h),
};
const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.85, metalness: 0 }, o));

// ---------- 🛞 टायर वाला बच्चा ----------
export function makeTyreKid() {
  const g = new THREE.Group();
  const kid = makeVillager({ kind: 'kid', mode: 'walk', cloth: 0xe8742a }); kid.scale.setScalar(1.06); g.add(kid); // केसरिया गंजी — फ़ुटपाथ की भीड़ में भी अलग दिखे
  const tyre = new THREE.Group(); tyre.position.set(0, 0.5, -0.95); g.add(tyre);
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.1, 10, 24), std({ color: 0x1d1d1d, roughness: 0.75 })); t.rotation.y = PI / 2; t.castShadow = true; tyre.add(t);
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(G.box(0.2, 0.02, 0.02), std({ color: 0x333333 })); b.position.set(0.1, Math.cos(i / 6 * PI * 2) * 0.4, Math.sin(i / 6 * PI * 2) * 0.4); tyre.add(b); } // टायर की धारियाँ (घूमता दिखे)
  const stick = new THREE.Mesh(G.cyl(0.018, 0.022, 0.95, 6), std({ color: 0x7a5a2c })); stick.position.set(0.18, 0.75, -0.5); stick.rotation.x = 0.95; g.add(stick);
  g.userData.anim = (t2, sp) => {
    if (kid.userData.anim) kid.userData.anim(t2 * 1.6);
    kid.position.y = Math.abs(Math.sin(t2 * 11)) * 0.09;
    tyre.rotation.x -= (sp || 0) * 0.016 / 0.5; tyre.position.x = Math.sin(t2 * 3) * 0.05;
    stick.rotation.x = 0.95 + Math.sin(t2 * 11) * 0.08;
  };
  return g;
}

// ---------- 🚰 चापाकल + पानी भरता बच्चा ----------
export function makeHandpump() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.box(1.6, 0.12, 1.4), mat4(0, 0.06, 0), 0x9a9a92); // पक्का चबूतरा
  mg.add(G.box(1.6, 0.2, 0.12), mat4(0, 0.16, 0.64), 0x8a8a82);
  mg.add(G.cyl(0.07, 0.09, 1.1, 10), mat4(0, 0.6, 0), 0x2f5d3a); // हरा रंगा पाइप
  mg.add(G.cyl(0.11, 0.11, 0.32, 10), mat4(0, 1.2, 0), 0x2f5d3a);
  mg.add(G.cyl(0.035, 0.035, 0.36, 6), mat4(0, 1.18, 0.2, PI / 2 - 0.3, 0, 0), 0x2f5d3a); // टोंटी
  mg.add(G.cyl(0.18, 0.15, 0.3, 14), mat4(0, 0.27, 0.42), 0xb87333); // पीतल की बाल्टी
  const m = mg.mesh(0); m.castShadow = true; g.add(m);
  const handle = new THREE.Group(); handle.position.set(0, 1.3, -0.08); g.add(handle);
  const hm = new THREE.Mesh(G.cyl(0.03, 0.03, 0.9, 6), std({ color: 0x2f5d3a })); hm.rotation.x = PI / 2; hm.position.z = -0.4; handle.add(hm);
  const kid = makeVillager({ kind: 'kid', mode: 'walk' }); kid.scale.setScalar(0.8); kid.position.set(0, 0.12, -0.95); g.add(kid);
  const water = new THREE.Mesh(G.cyl(0.03, 0.05, 0.75, 8), std({ color: 0xbfe6f5, transparent: true, opacity: 0.55, roughness: 0.1 })); water.position.set(0, 0.68, 0.36); g.add(water);
  g.userData.anim = (t) => { const a = Math.sin(t * 4.2); handle.rotation.x = a * 0.35; kid.position.y = 0.12 + Math.max(0, -a) * 0.06; water.scale.set(1, 0.7 + Math.max(0, a) * 0.4, 1); water.visible = a > -0.3; };
  g.userData.splash = true;
  return g;
}

// ---------- 🍧 बर्फ़ के गोले का ठेला ----------
function golaTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 96; const x = c.getContext('2d');
  x.fillStyle = '#1565c0'; x.fillRect(0, 0, 256, 96); x.fillStyle = '#ffd21a'; x.fillRect(0, 70, 256, 26);
  x.fillStyle = '#fff'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center'; x.fillText('बर्फ़ गोला', 128, 52);
  x.fillStyle = '#c62828'; x.font = 'bold 18px sans-serif'; x.fillText('₹10  ₹20', 128, 89);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function makeGolaCart() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.box(1.5, 0.75, 0.85), mat4(0, 0.95, 0), 0xdedede); // डिब्बा (स्टील)
  mg.add(G.box(1.55, 0.06, 0.9), mat4(0, 1.34, 0), 0x9a9a9a);
  for (const s of [-1, 1]) { mg.add(G.cyl(0.32, 0.32, 0.06, 18), mat4(s * 0.55, 0.32, 0.47, PI / 2, 0, 0), 0x2a2a2a); mg.add(G.cyl(0.32, 0.32, 0.06, 18), mat4(s * 0.55, 0.32, -0.47, PI / 2, 0, 0), 0x2a2a2a); }
  mg.add(G.box(0.12, 0.6, 0.6), mat4(-0.25, 1.65, 0), 0xe8f4fa); // बर्फ़ की सिल्ली
  for (let i = 0; i < 6; i++) mg.add(G.cyl(0.05, 0.06, 0.24, 8), mat4(0.25 + (i % 3) * 0.16, 1.48, -0.2 + Math.floor(i / 3) * 0.3), [0xd32f2f, 0xff9800, 0x7b1fa2, 0x2e7d32, 0xe91e63, 0x1565c0][i]); // शरबत की बोतलें
  for (const s of [-1, 1]) mg.add(G.cyl(0.025, 0.025, 1.3, 6), mat4(s * 0.7, 2.0, 0.38), 0x888888);
  mg.add(G.box(1.6, 0.04, 1.0), mat4(0, 2.65, 0.1), 0xd32f2f); // छतरी
  const m = mg.mesh(0); m.castShadow = true; g.add(m);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.52), std({ map: golaTex(), roughness: 0.7 })); board.position.set(0, 0.95, 0.43); g.add(board);
  const man = makeVillager({ kind: 'man', mode: 'serve', cloth: 0xffffff }); man.position.set(0, 0, -0.85); g.add(man);
  const bell = new THREE.Mesh(G.sph(0.07, 8, 6), std({ color: 0xd4a43a, metalness: 0.8, roughness: 0.3 })); bell.position.set(0.7, 1.6, 0.5); g.add(bell);
  g.userData.anim = (t) => { bell.rotation.z = Math.sin(t * 14) * 0.5 * (Math.sin(t * 1.3) > 0.4 ? 1 : 0); if (man.userData.anim) man.userData.anim(t); };
  g.userData.bell = true;
  return g;
}
// सड़क पर रखा गोला (पकड़ो)
export function makeGolaPu() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const mg = new Merge();
  mg.add(G.cyl(0.03, 0.03, 0.45, 6), mat4(0, 0.0, 0), 0xd9c08a); // डंडी
  mg.add(G.sph(0.28, 14, 10), mat4(0, 0.4, 0, 0, 0, 0, 1, 1.25, 1), 0xf3fbff);
  mg.add(new THREE.SphereGeometry(0.29, 14, 10, 0, PI * 2, 0, PI * 0.45), mat4(0, 0.42, 0, 0, 0, 0, 1, 1.25, 1), 0xd32f2f); // ऊपर लाल शरबत
  mg.add(new THREE.SphereGeometry(0.292, 14, 10, PI * 0.2, PI * 0.7, PI * 0.3, PI * 0.3), mat4(0, 0.42, 0, 0, 0, 0, 1, 1.25, 1), 0xff9800);
  inner.add(mg.mesh(0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 8, 28), new THREE.MeshBasicMaterial({ color: 0xbfe6f5, transparent: true, opacity: 0.8 }));
  g.add(ring);
  g.userData = { inner, ring };
  return g;
}

// ---------- 🏏 गिल्ली-डंडा ----------
export function makeGilliKids() {
  const g = new THREE.Group();
  const a = makeVillager({ kind: 'kid', mode: 'walk' }), b = makeVillager({ kind: 'kid', mode: 'walk' });
  a.scale.setScalar(0.8); b.scale.setScalar(0.8); a.position.set(0, 0, 0); b.position.set(0, 0, -5); b.rotation.y = PI; g.add(a, b);
  const danda = new THREE.Mesh(G.cyl(0.025, 0.03, 0.75, 6), std({ color: 0x8a6a36 })); g.add(danda);
  const gilli = new THREE.Mesh(G.cyl(0.02, 0.02, 0.18, 6), std({ color: 0xa07a40 })); gilli.rotation.z = PI / 2; g.add(gilli);
  g.userData.anim = (t) => {
    const T = 2.4, k = (t % T) / T; // एक चक्कर: मारो → उड़ती गिल्ली → लपको
    danda.position.set(0.25, 0.7, -0.3); danda.rotation.set(-1.0 + (k < 0.12 ? Math.sin(k / 0.12 * PI) * 1.6 : 0), 0, 0.3);
    const f = Math.max(0, (k - 0.1) / 0.75);
    gilli.position.set(0.2 + Math.sin(f * PI) * 0.3, 0.15 + Math.sin(Math.min(1, f) * PI) * 2.6, -0.4 - Math.min(1, f) * 4.4); gilli.rotation.x = t * 14;
    b.position.x = Math.sin(t * 2) * 0.4; if (b.userData.anim) b.userData.anim(t * 1.3);
  };
  return g;
}

export const DECO_MAKERS = { pump: makeHandpump, gola: makeGolaCart, gilli: makeGilliKids };
