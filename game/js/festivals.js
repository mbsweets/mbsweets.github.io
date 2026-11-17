// 🪔 त्योहार — असली तारीख़ (भारत का समय) के हिसाब से गेम अपने-आप बदले. अभी: सामा-चकेवा (मिथिला, छठ के बाद से कार्तिक पूर्णिमा तक).
// 2026: कार्तिक पूर्णिमा 24 नवंबर (नवभारत लाइव पंचांग) → 16–24 नवंबर.
// सामा-चकेवा में: रास्ते में मिट्टी की रंगी "चकेवा" चिड़ियाँ (एक दौड़ में 5 = बोनस), और सड़क पर "चुगला" का पुतला —
// ऊपर से कूदो = अंक, शुगर रश से तोड़ो = "चुगला दहन!" (त्योहार की परंपरा: अंत में चुगला जलाया जाता है).
// जाँच के लिए: ?fest=sama
import * as THREE from './three.module.min.js';
import { C, mat4, Merge, basic } from './art.js';
import { OBST } from './models.js';
import { T } from './i18n.js';
import { rand, chance, vibrate } from './util.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 14, h = 10) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 10) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 10) => new THREE.ConeGeometry(r, h, s),
  tor: (r, t, s = 6, n = 16) => new THREE.TorusGeometry(r, t, s, n),
};
export const FESTS = [
  { id: 'sama', from: '2026-11-16', to: '2026-11-24', icon: '🕊️', need: 5 },
];
const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
export function festNow() {
  const q = new URLSearchParams(location.search).get('fest');
  if (q) return FESTS.find((f) => f.id === q) || null;
  const d = istDay();
  return FESTS.find((f) => d >= f.from && d <= f.to) || null;
}

// मिट्टी की रंगी चकेवा चिड़िया (सामा-चकेवा की मूर्तियों जैसी: सफ़ेद-पीली देह, लाल-हरी बिंदियाँ)
function makeChakeva() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const mg = new Merge();
  mg.add(G.sph(0.34, 16, 12), mat4(0, 0, 0, 0, 0, 0, 1.25, 0.85, 0.85), 0xfff4d6); // देह
  mg.add(G.sph(0.2, 14, 10), mat4(0.4, 0.26, 0), 0xfff4d6); // सिर
  mg.add(G.cone(0.07, 0.22, 8), mat4(0.62, 0.24, 0, 0, 0, -PI / 2), 0xf08a1c); // चोंच
  mg.add(G.cone(0.2, 0.42, 10), mat4(-0.5, 0.12, 0, 0, 0, PI / 2 + 0.5), 0xf2a91b); // पूँछ
  for (const s of [-1, 1]) {
    mg.add(G.sph(0.045, 8, 6), mat4(0.5, 0.31, 0.15 * s), 0x1d1210); // आँख
    mg.add(G.sph(0.2, 12, 8), mat4(-0.02, 0.08, 0.26 * s, 0, 0, 0, 1.3, 0.5, 0.35), s > 0 ? 0xd1261c : 0x2e7b47); // पंख
    for (let i = 0; i < 4; i++) mg.add(G.sph(0.045, 6, 5), mat4(-0.25 + i * 0.16, -0.05 + (i % 2) * 0.12, 0.27 * s), [0xd1261c, 0x2e7b47, 0x2f4f9a, 0xd8457f][i]); // बिंदियाँ
  }
  mg.add(G.cyl(0.26, 0.3, 0.12, 14), mat4(0, -0.36, 0), C.terracotta); // मिट्टी का आधार
  inner.add(mg.mesh(0.02));
  inner.scale.setScalar(1.7); inner.position.y = 0.2;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.06, 8, 36), basic(0xffd24d, { add: true, op: 0.85 }));
  g.add(ring);
  g.userData = { kind: 'chakeva', inner, ring };
  return g;
}
// चुगला — भूसे का पुतला (बड़ी मूँछ, काला चेहरा), नीचा — कूदो
function makeChugla() {
  const g = new THREE.Group(), mg = new Merge();
  mg.add(G.cyl(0.05, 0.05, 1.3, 6), mat4(0, 0.55, 0), C.wood); // डंडा
  mg.add(G.cone(0.42, 0.75, 12), mat4(0, 0.42, 0), 0xd9b25a); // भूसे की धोती
  for (let i = 0; i < 10; i++) { const a = i / 10 * PI * 2; mg.add(G.cone(0.04, 0.22, 4), mat4(Math.cos(a) * 0.36, 0.08, Math.sin(a) * 0.36, PI, 0, 0), 0xc9a24a); }
  mg.add(G.cyl(0.2, 0.26, 0.38, 10), mat4(0, 0.92, 0), 0x6b3a22); // कुर्ता
  mg.add(G.cyl(0.04, 0.04, 0.95, 6), mat4(0, 0.98, 0, 0, 0, PI / 2), C.wood); // बाँह का डंडा
  mg.add(G.sph(0.2, 12, 10), mat4(0, 1.25, 0), 0x3a2a20); // मिट्टी का काला चेहरा
  for (const s of [-1, 1]) { mg.add(G.sph(0.04, 6, 5), mat4(0.07 * s, 1.3, -0.18), 0xffffff); mg.add(G.cyl(0.035, 0.02, 0.24, 6), mat4(0.12 * s, 1.19, -0.17, 0, 0, s * 1.25), 0x111111); } // आँखें + मूँछ
  mg.add(G.cone(0.13, 0.18, 8), mat4(0, 1.43, 0), 0xd9b25a); // भूसे के बाल
  const m = mg.mesh(0.025); m.scale.set(1.7, 0.82, 1.7); g.add(m); // चौड़ा और नीचा — दूर से दिखे, कूदकर पार हो
  g.userData = { kind: 'low', halfW: 0.95, halfL: 0.45, yMin: 0, yMax: 1.1 };
  return g;
}

export class Festival {
  constructor(game, world) {
    this.g = game; this.w = world; this.f = festNow();
    this.on = !!this.f;
    if (!this.on) return;
    world.fest = this;
    OBST.chugla = makeChugla;
    world.pPool.chakeva = [];
    for (let i = 0; i < 4; i++) { const o = makeChakeva(); o.visible = false; game.scene.add(o); world.pPool.chakeva.push(o); }
    world.oPool.chugla = [];
    for (let i = 0; i < 3; i++) { const o = world.newObs('chugla'); o.visible = false; world.oPool.chugla.push(o); }
    this.reset();
  }
  reset() { this.n = 0; this.done = false; this.nextBird = rand(160, 240); this.said = false; }
  // World.spawnRow के अंत में
  row(z, freeLane) {
    if (!this.on || this.done || this.w.tut > 0 || freeLane < 0) return;
    if (this.w.dist >= this.nextBird && this.w.railObs <= 0) { this.w.addPu('chakeva', freeLane, z - 12); this.nextBird = this.w.dist + rand(150, 230); }
  }
  swapObs(t, extra) { return this.on && t === 'barrier' && !extra.need && chance(0.35) ? 'chugla' : t; }
  start() {
    this.reset();
    if (!this.on) return;
    setTimeout(() => { if (this.g.state === 'play') { this.g.zoneBanner('🪔', T('festSama')); this.g.cheer('fest', 1600, -1, true); } }, 1800);
  }
  got() {
    const g = this.g;
    this.n++; g.msBump('sama');
    g.sound.ring(); vibrate(20);
    if (this.n >= this.f.need && !this.done) {
      this.done = true;
      g.got += 100; g.score += 1000 * g.mult; g.msBump('sweets', g.got, true);
      g.cheer('festDone', 1900, -1, true, 'gold', T('festDone'));
      g.sound.levelUp(); if (g.emo) g.emo.play('love', 1.2);
    } else g.toast(`🕊️ ${this.n}/${this.f.need}`, 700, 'gold');
  }
  // चुगला: ऊपर से कूदे या शुगर रश से तोड़ा
  jumped(e) { const g = this.g; g.score += 50 * g.mult; g.floatText(`🕊️ +${50 * g.mult}`, 'tp'); }
  burned(e) {
    const g = this.g, P = g.world.parts;
    for (let i = 0; i < 3; i++) P.burst(e.x, 0.6 + i * 0.4, e.z, [0xff5a1f, 0xffb21e, 0xffe08a][i], 14, 3, 4, 0.9, 1.5);
    g.got += 15; g.msBump('chugla');
    g.toast(T('chuglaBurn'), 1000, 'gold');
  }
  chip() { return this.on ? `${this.f.icon} ${Math.min(this.n, this.f.need)}/${this.f.need}` : ''; }
}
