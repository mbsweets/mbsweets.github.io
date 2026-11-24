// 😅 गोलू के भाव — सिर के पास छोटे कार्टून निशान (मॉडल का चेहरा बदला नहीं जा सकता, इसलिए ये):
// sweat = पसीने की बूँदें (मधुमक्खी/बंदर पीछे), dizzy = सिर पर घूमते तारे (ठोकर), love = उड़ते दिल (डिलीवरी),
// angry = 💢 (बंदर ने मिठाई छीनी), wow = ❗ (नया ऑर्डर/बंदर आया), cool = ✦ चमक (करतब सही उतरा)
import * as THREE from './three.module.min.js';

const PI = Math.PI;
function tex(draw) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  x.lineJoin = 'round'; x.lineCap = 'round'; draw(x);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const INK = '#2a1511';
const DRAW = {
  drop: (x) => { x.beginPath(); x.moveTo(64, 10); x.bezierCurveTo(98, 56, 104, 76, 100, 88); x.arc(64, 86, 36, 0.05, PI - 0.05); x.bezierCurveTo(24, 76, 30, 56, 64, 10); x.closePath();
    x.fillStyle = '#7fd3ff'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.ellipse(52, 84, 8, 14, -0.4, 0, PI * 2); x.fillStyle = '#fff'; x.fill(); },
  star: (x) => { x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 24 : 54, a = -PI / 2 + i * PI / 5; x.lineTo(64 + Math.cos(a) * r, 66 + Math.sin(a) * r); } x.closePath();
    x.fillStyle = '#ffd24d'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); },
  heart: (x) => { x.beginPath(); x.moveTo(64, 112); x.bezierCurveTo(8, 72, 14, 18, 64, 40); x.bezierCurveTo(114, 18, 120, 72, 64, 112); x.closePath();
    x.fillStyle = '#ff4d6d'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); x.beginPath(); x.ellipse(42, 50, 9, 14, -0.6, 0, PI * 2); x.fillStyle = '#ffd0da'; x.fill(); },
  angry: (x) => { x.strokeStyle = '#e0201b'; x.lineWidth = 13; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const a = Math.atan2(-sy, -sx); x.beginPath(); x.arc(64 + sx * 38, 64 + sy * 38, 30, a - 0.75, a + 0.75); x.stroke(); } },
  wow: (x) => { x.beginPath(); x.arc(64, 64, 52, 0, PI * 2); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke();
    x.fillStyle = '#d1261c'; x.fillRect(56, 26, 16, 50); x.beginPath(); x.arc(64, 94, 9, 0, PI * 2); x.fill(); },
  phone: (x) => { x.beginPath(); x.arc(64, 64, 54, 0, PI * 2); x.fillStyle = '#fff'; x.fill(); x.lineWidth = 8; x.strokeStyle = INK; x.stroke(); // 📞 बजता फ़ोन
    x.save(); x.translate(64, 66); x.rotate(-0.6); x.fillStyle = '#2e9b4a'; x.beginPath(); x.ellipse(-22, 0, 12, 17, 0, 0, PI * 2); x.ellipse(22, 0, 12, 17, 0, 0, PI * 2); x.fill(); x.fillRect(-22, -9, 44, 13); x.restore();
    x.strokeStyle = '#d1261c'; x.lineWidth = 6; for (const r of [18, 30]) { x.beginPath(); x.arc(64, 64, r + 12, -1.25, -0.55); x.stroke(); x.beginPath(); x.arc(64, 64, r + 12, PI + 0.55, PI + 1.25); x.stroke(); } },
  spark: (x) => { const g = x.createRadialGradient(64, 64, 0, 64, 64, 60); g.addColorStop(0, 'rgba(255,255,230,1)'); g.addColorStop(0.25, 'rgba(255,220,110,0.9)'); g.addColorStop(1, 'rgba(255,200,60,0)');
    x.fillStyle = g; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 14 : 62, a = i * PI / 4; x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); } x.closePath(); x.fill(); },
};
const SPEC = { sweat: ['drop', 2], dizzy: ['star', 3], love: ['heart', 3], angry: ['angry', 1], wow: ['wow', 1], cool: ['spark', 2], phone: ['phone', 1] };

export class Emotes {
  constructor(scene) {
    this.grp = new THREE.Group(); scene.add(this.grp);
    this.s = {}; this.t = {}; this.on = {};
    const texs = {};
    for (const k in SPEC) {
      const [d, n] = SPEC[k];
      texs[d] = texs[d] || tex(DRAW[d]);
      this.s[k] = [];
      for (let i = 0; i < n; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: texs[d], transparent: true, depthWrite: false, toneMapped: false, fog: false }));
        sp.visible = false; sp.renderOrder = 5; this.grp.add(sp); this.s[k].push(sp);
      }
      this.t[k] = 0;
    }
    this.clock = 0;
  }
  play(k, dur) { this.t[k] = Math.max(this.t[k], dur); this.t0 = this.t0 || {}; this.t0[k] = dur; }
  set(k, on) { this.on[k] = on; }
  clear() { for (const k in this.t) { this.t[k] = 0; this.on[k] = false; } for (const k in this.s) for (const sp of this.s[k]) sp.visible = false; }
  // x,y,z = सिर के ऊपर की जगह; sc = गोलू का आकार
  update(dt, x, y, z, sc = 1) {
    this.clock += dt; const c = this.clock;
    for (const k in this.s) {
      if (this.t[k] > 0) this.t[k] -= dt;
      const act = this.t[k] > 0 || this.on[k];
      const arr = this.s[k];
      if (!act) { for (const sp of arr) sp.visible = false; continue; }
      const life = this.t0 && this.t0[k] ? clamp01(1 - this.t[k] / this.t0[k]) : 0.5;
      arr.forEach((sp, i) => {
        sp.visible = true; let px = x, py = y, pz = z, s = 0.42 * sc, op = 1;
        if (k === 'sweat') { const ph = (c * 1.6 + i * 0.5) % 1; px += (i ? 0.42 : -0.42) * sc; py += (-0.1 - ph * 0.5) * sc; s = 0.3 * sc; op = 1 - ph * 0.6; }
        else if (k === 'dizzy') { const a = c * 7 + i * 2 * PI / 3; px += Math.cos(a) * 0.45 * sc; pz += Math.sin(a) * 0.3 * sc; py += 0.15 * sc; s = 0.3 * sc; }
        else if (k === 'love') { const ph = (life + i * 0.3) % 1; px += (i - 1) * 0.45 * sc + Math.sin(c * 5 + i) * 0.1; py += (0.2 + ph * 1.1) * sc; s = (0.28 + 0.1 * Math.sin(c * 12 + i)) * sc; op = 1 - ph; }
        else if (k === 'angry') { px += 0.4 * sc; py += 0.1 * sc; s = (0.36 + 0.08 * Math.abs(Math.sin(c * 14))) * sc; }
        else if (k === 'phone') { px += 0.55 * sc; py += (0.1 + Math.sin(c * 30) * 0.03) * sc; s = 0.5 * sc * Math.min(1, life * 8 + 0.2); sp.material.rotation = Math.sin(c * 40) * 0.15; }
        else if (k === 'wow') { py += (0.35 + Math.min(1, life * 6) * 0.15) * sc; s = 0.5 * sc * Math.min(1, life * 8 + 0.2); }
        else if (k === 'cool') { px += (i ? 0.5 : -0.35) * sc; py += (i ? 0.05 : 0.3) * sc; s = (0.55 * Math.sin(Math.min(1, life + i * 0.2) * PI)) * sc + 0.01; }
        sp.position.set(px, py, pz); sp.scale.setScalar(s); sp.material.opacity = op;
      });
    }
  }
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
