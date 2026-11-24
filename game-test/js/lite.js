// 🪶 हल्का रूप (24 नवंबर, मालिक: "लो क्वालिटी से अच्छे तक सभी मोबाइल पर बिना लैग"):
// कमज़ोर फ़ोन पर हर चीज़ की "असली चमक" वाली रंगाई (MeshStandardMaterial: धातु/खुरदरापन + आसमान का परावर्तन) सबसे महँगी है।
// यहाँ वही चीज़ें MeshLambertMaterial (सादी, सस्ती रोशनी) से बदलती हैं — रंग, तस्वीर, चमक (emissive), पारदर्शिता वही रहती है।
// रंग (Color) की वस्तु दोनों में एक ही है, और opacity/map/transparent… पुराने पर ही पढ़ी-लिखी जाती हैं —
// इसलिए खेल का कोई भी कोड (रंग बदलना, धुँधला करना, चमकाना) बिना बदले दोनों रूपों में काम करता है।
import * as THREE from './three.module.min.js';

const S2L = new WeakMap(), L2S = new WeakMap();
const FWD = ['opacity', 'transparent', 'emissiveIntensity', 'map', 'emissiveMap', 'alphaMap', 'alphaTest', 'visible', 'side',
  'depthWrite', 'depthTest', 'vertexColors', 'fog', 'toneMapped', 'flatShading', 'wireframe', 'blending', 'colorWrite',
  'polygonOffset', 'polygonOffsetFactor', 'polygonOffsetUnits', 'normalMap', 'normalScale', 'aoMap', 'aoMapIntensity'];

export function lambertOf(m) {
  let L = S2L.get(m);
  if (L) return L;
  L = new THREE.MeshLambertMaterial();
  L.name = m.name;
  L.color = m.color; L.emissive = m.emissive; // वही वस्तु — रंग बदलो तो दोनों में
  for (const k of FWD) if (k in m) Object.defineProperty(L, k, { get: () => m[k], set: (v) => { m[k] = v; }, configurable: true });
  // पुराने का needsUpdate (जैसे बाद में तस्वीर लगी) → यह भी दोबारा बने
  let own = 0;
  Object.defineProperty(L, 'version', { get: () => m.version + own, set: (v) => { own = v - m.version; }, configurable: true });
  S2L.set(m, L); L2S.set(L, m);
  return L;
}

// on = true: सारे Standard → Lambert; false: वापस
export function setLite(root, on) {
  const sw = on ? (m) => (m && m.isMeshStandardMaterial ? lambertOf(m) : m) : (m) => (m && L2S.get(m)) || m;
  root.traverse((o) => {
    if (!o.isMesh || !o.material) return;
    o.material = Array.isArray(o.material) ? o.material.map(sw) : sw(o.material);
  });
}
