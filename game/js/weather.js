// 🌧️ दरभंगा का असली मौसम — अपने सर्वर (/weather, MET Norway का डेटा, 30 मिनट cache) से. बारिश = बूँदें + गीली सड़क की चमक,
// आँधी-पानी = बीच-बीच में बिजली की चमक, कोहरा = हल्का धुंध (देखने लायक), बादल = थोड़ी कम धूप. सेटिंग्स से बंद हो सकता है.
// श्रेय: "Based on data from MET Norway" (CC BY 4.0)
import * as THREE from './three.module.min.js';
import { store } from './util.js';

export function kindOf(sym) {
  const s = String(sym || '');
  if (/thunder/.test(s)) return 'storm';
  if (/rain|sleet|drizzle|snow/.test(s)) return 'rain';
  if (/fog/.test(s)) return 'fog';
  if (/^cloudy/.test(s)) return 'cloud';
  return 'clear';
}
export const WX_ICON = { clear: '☀️', cloud: '☁️', rain: '🌧️', storm: '⛈️', fog: '🌫️' };

export class Weather {
  constructor(scene, url, on) {
    this.url = url; this.on = !!(on && url); this.kind = 'clear'; this.temp = null; this.flash = 0; this.nextFlash = 6;
    // बारिश की बूँदें — एक ही Points, हर बूँद लंबी धार वाली छोटी तस्वीर (फ़ोन पर भी साफ़ दिखे)
    const N = this.N = 900, pos = this.pos = new Float32Array(N * 3);
    this.drops = [];
    for (let i = 0; i < N; i++) this.drops.push({ x: (Math.random() - 0.5) * 22, y: Math.random() * 14, z: -28 + Math.random() * 29, v: 20 + Math.random() * 8 });
    const c = document.createElement('canvas'); c.width = 16; c.height = 64; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, 'rgba(220,235,255,0)'); gr.addColorStop(0.6, 'rgba(220,235,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0.95)');
    x.fillStyle = gr; x.fillRect(6, 0, 4, 64);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    this.rain = new THREE.Points(g, new THREE.PointsMaterial({ map: new THREE.CanvasTexture(c), size: 0.6, transparent: true, depthWrite: false, opacity: 0.85, sizeAttenuation: true, toneMapped: false }));
    this.rain.frustumCulled = false; this.rain.visible = false; this.rain.renderOrder = 4; scene.add(this.rain);
  }
  async load() {
    if (!this.on) return;
    try {
      const c = JSON.parse(store('wx') || 'null');
      if (c && Date.now() - c.at < 20 * 60e3) { this.set(c.sym, c.temp); return; }
    } catch (e) { /* */ }
    try {
      const d = await (await fetch(this.url + '/weather')).json();
      if (d && d.ok && typeof d.sym === 'string' && d.sym) { store('wx', JSON.stringify({ at: Date.now(), sym: d.sym, temp: d.temp })); this.set(d.sym, d.temp); }
    } catch (e) { /* नेट नहीं — साफ़ मौसम */ }
  }
  set(sym, temp) { this.kind = kindOf(sym); this.temp = temp; if (this.onChange) this.onChange(); }
  get active() { return this.on && store('wxOff') !== '1' ? this.kind : 'clear'; }
  // applyTod के बाद: रोशनी/कोहरे में बदलाव
  mods() {
    const k = this.active;
    if (k === 'rain') return { sun: 0.5, hemi: 0.86, exp: 0.9, fogFar: 0.8, rough: 0.42, tint: 0x9fb0c2 };
    if (k === 'storm') return { sun: 0.38, hemi: 0.8, exp: 0.86, fogFar: 0.72, rough: 0.38, tint: 0x8a96a8 };
    if (k === 'fog') return { sun: 0.7, hemi: 1.0, exp: 1.0, fogFar: 0.62, fogNear: 0.45, rough: 0.85 };
    if (k === 'cloud') return { sun: 0.72, hemi: 0.95, exp: 0.98, fogFar: 1, rough: 0.9 };
    return null;
  }
  update(dt, dz, game) {
    const k = this.active, wet = k === 'rain' || k === 'storm';
    this.rain.visible = wet;
    if (wet) {
      const p = this.pos;
      for (let i = 0; i < this.N; i++) {
        const d = this.drops[i];
        d.y -= d.v * dt; d.z += dz;
        if (d.y < 0 || d.z > 1) { d.y = 11 + Math.random() * 4; d.z = -28 + Math.random() * 29; d.x = (Math.random() - 0.5) * 22; }
        const j = i * 3; p[j] = d.x; p[j + 1] = d.y; p[j + 2] = d.z;
      }
      this.rain.geometry.attributes.position.needsUpdate = true;
      if (game && game.p && game.state === 'play' && game.p.ground && Math.random() < 0.25) game.world.parts.burst(game.p.x + (Math.random() - 0.5) * 0.6, 0.1, 0.3, 0xdfefff, 2, 1.2, 1.2, 0.35, -6); // पैरों के छींटे
    }
    // ⛈️ बिजली
    this.flash = Math.max(0, this.flash - dt * 3.5);
    if (k === 'storm') { this.nextFlash -= dt; if (this.nextFlash <= 0) { this.flash = 1; this.nextFlash = 7 + Math.random() * 9; if (game && game.sound.thunder) game.sound.thunder(); } }
  }
}
