// 👻 परछाईं — दौड़ में गोलू कहाँ था (हर 0.2 से.: कितना आगे बढ़ा, किस लेन में, कितना ऊँचा, लुढ़का/नाव/समोसा) छोटे कोड में;
// दोस्त की परछाईं साथ में पारदर्शी गोलू बनकर दौड़ती है. 📅 आज का रास्ता: तारीख़ से बीज (seed) — सबके लिए एक जैसा क्रम.
import * as THREE from './three.module.min.js';
import { Golu as Golu3D } from './golu3d.js';

export const STEP = 0.2, MAX_N = 1500; // 5 बार प्रति सेकंड, 5 मिनट तक
const F_ROLL = 1, F_FLY = 2, F_BOAT = 4, F_AIR = 8;
const b64 = (u8) => { let s = ''; for (let i = 0; i < u8.length; i++) s += String.fromCharCode(u8[i]); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
const unb64 = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; const t = atob(s), u = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) u[i] = t.charCodeAt(i); return u; };

export class Recorder {
  start() { this.d = []; this.next = 0; this.last = 0; }
  push(t, dist, x, y, f) {
    if (t < this.next || this.d.length >= MAX_N * 4) return;
    this.next += STEP;
    const dd = Math.max(0, Math.min(255, Math.round((dist - this.last) / 0.04))); this.last += dd * 0.04;
    this.d.push(dd, Math.max(0, Math.min(255, Math.round((x + 3.4) / 6.8 * 255))), Math.max(0, Math.min(255, Math.round(y / 12 * 255))), f);
  }
  get n() { return this.d ? this.d.length / 4 : 0; }
  encode() { return b64(Uint8Array.from([1, ...this.d])); }
}
export function decode(s) {
  try {
    const u = unb64(s); if (u[0] !== 1) return null;
    const n = Math.floor((u.length - 1) / 4), out = { n, dist: new Float32Array(n), x: new Float32Array(n), y: new Float32Array(n), f: new Uint8Array(n) };
    let d = 0;
    for (let i = 0; i < n; i++) { const k = 1 + i * 4; d += u[k] * 0.04; out.dist[i] = d; out.x[i] = u[k + 1] / 255 * 6.8 - 3.4; out.y[i] = u[k + 2] / 255 * 12; out.f[i] = u[k + 3]; }
    return out;
  } catch (e) { return null; }
}
export const flagsOf = (p) => (p.roll > 0 ? F_ROLL : 0) | (p.fly > 0 ? F_FLY : 0) | (p.boat ? F_BOAT : 0) | (!p.ground ? F_AIR : 0);

// 📅 तारीख़ से बीज वाला random (mulberry32)
export function seeded(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = h >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);

// पारदर्शी नीला-सफ़ेद गोलू + नाम की पट्टी
export class GhostRunner {
  constructor(scene, ok) {
    this.on = false; this.ok = !!ok;
    if (!this.ok) return;
    const g = this.g = new Golu3D();
    g.mat.transparent = true; g.mat.opacity = 0.42; g.mat.depthWrite = false; g.mat.emissive = new THREE.Color(0x3a6dff); g.mat.emissiveIntensity = 0.55;
    g.shadow.visible = false; g.aura.visible = false;
    g.root.visible = false; g.root.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.renderOrder = 3; } });
    scene.add(g.root);
    const c = this.cv = document.createElement('canvas'); c.width = 256; c.height = 64;
    this.tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, toneMapped: false }));
    this.tag.scale.set(1.9, 0.48, 1); this.tag.renderOrder = 6; this.tag.visible = false; scene.add(this.tag);
  }
  set(data, name) {
    if (!this.ok) return;
    this.d = data; this.name = name || '';
    this.on = !!data && data.n > 2;
    const x = this.cv.getContext('2d'); x.clearRect(0, 0, 256, 64);
    x.fillStyle = 'rgba(30,50,120,0.78)'; x.beginPath(); if (x.roundRect) x.roundRect(4, 6, 248, 52, 26); else x.rect(4, 6, 248, 52); x.fill();
    x.fillStyle = '#fff'; x.font = '800 30px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('👻 ' + this.name, 128, 34, 236);
    this.tag.material.map.needsUpdate = true;
    this.done = false;
  }
  off() { this.on = false; if (this.ok) { this.g.root.visible = false; this.tag.visible = false; } }
  // t = दौड़ का समय; लौटाता है: परछाईं कितनी आगे (मी., + = आगे) या null
  update(dt, t, pd, waterY) {
    if (!this.on) return null;
    const d = this.d, i = Math.min(d.n - 1, Math.floor(t / STEP)), j = Math.min(d.n - 1, i + 1), k = Math.min(1, t / STEP - i);
    const gd = d.dist[i] + (d.dist[j] - d.dist[i]) * k, x = d.x[i] + (d.x[j] - d.x[i]) * k, y = d.y[i] + (d.y[j] - d.y[i]) * k, f = d.f[i];
    this.finished = t / STEP >= d.n - 1;
    const z = -(gd - pd);
    const vis = !this.finished && z > -75 && z < 3; // पीछे ज़्यादा पास हो तो कैमरे के सामने न आए
    this.g.root.visible = vis; this.tag.visible = vis && Math.abs(z) > 2.5;
    if (vis) {
      const boat = f & F_BOAT && !(f & F_FLY);
      this.g.update(dt, f & F_FLY ? 'fly' : f & F_ROLL ? 'roll' : boat ? 'boat' : f & F_AIR ? 'jump' : 'run', { speed: 20, y, gy: 0 });
      this.g.root.position.set(x, y + (boat ? waterY + 0.12 : 0), z);
      this.tag.position.set(x, y + (boat ? waterY : 0) + 2.9, z);
    }
    return gd - pd;
  }
  get endDist() { return this.d ? this.d.dist[this.d.n - 1] : 0; }
}
