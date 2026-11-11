// दुनिया: सड़क, दोनों ओर के मकान, बीच-बीच में MB Sweets की दुकान + स्वागत द्वार, रुकावटें, मिठाइयाँ, पावर-अप, कण
import * as THREE from './three.module.min.js';
import {
  OBST, makePowerup, makeHouse, makeAdWall, makeFlex, makePond, makeTemple, makeStalls, makeShop, makeGate,
  sweetParts, SWEETS, SKY_SWEETS, CHUNK, ROAD_HALF,
} from './models.js';
import { toon, outlineMat, basic, dotTexture, repeatTex, C, OUTLINES } from './art.js';
import { RT, shadows } from './real.js';
import { makeHaat, makeHaatGate } from './haat.js';
import { makeMela, makeMelaGate } from './events.js';
import { rand, randi, pick, chance, weighted, clamp, lerp } from './util.js';

export const LANE_W = 2.5;
export const LANES = [-LANE_W, 0, LANE_W];
export const SPAWN_Z = -150;
const DESPAWN_Z = 14;
const SHOP_EVERY = 430; // इतनी दूरी पर फिर दुकान (≈ 20–28 सेकंड)

// ---------------- मिठाइयाँ (instanced — तेज़) ----------------
class SweetSet {
  constructor(scene, cap = 90) {
    this.cap = cap;
    this.meshes = {};
    this.free = {};
    this.items = [];
    this.m = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();
    this.v = new THREE.Vector3();
    this.s = new THREE.Vector3();
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const t of Object.keys(SWEETS)) {
      const arr = [];
      for (const p of sweetParts(t)) {
        const add = (mat) => {
          const im = new THREE.InstancedMesh(p.g, mat, cap);
          im.frustumCulled = false;
          im.castShadow = !mat.isMeshBasicMaterial;
          im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          for (let i = 0; i < cap; i++) im.setMatrixAt(i, zero);
          scene.add(im);
          arr.push(im);
        };
        const m = toon(p.c, { r: p.r, m: p.m, nm: p.nm, ns: p.ns, vc: p.vc });
        add(m);
        if (p.ol && OUTLINES) add(outlineMat(p.ol));
      }
      this.meshes[t] = arr;
      this.free[t] = [];
      for (let i = cap - 1; i >= 0; i--) this.free[t].push(i);
    }
    this.zero = zero;
    this.t = 0;
  }
  spawn(type, x, y, z) {
    const fr = this.free[type];
    if (fr.dirty) { fr.sort((a, b) => b - a); fr.dirty = false; }
    const slot = fr.pop();
    if (slot == null) return null;
    const it = { type, slot, x, y, z, ph: Math.random() * 6, mag: false, col: 0 };
    this.items.push(it);
    return it;
  }
  release(it) {
    for (const im of this.meshes[it.type]) { im.setMatrixAt(it.slot, this.zero); }
    this.free[it.type].push(it.slot);
    this.free[it.type].dirty = true;
  }
  clear() {
    for (const it of this.items) this.release(it);
    this.items.length = 0;
    this.flush();
  }
  flush() {
    const top = {};
    for (const t in this.meshes) top[t] = 0;
    for (const it of this.items) top[it.type] = Math.max(top[it.type], it.slot + 1);
    for (const t in this.meshes) for (const im of this.meshes[t]) { im.count = top[t]; im.visible = top[t] > 0; im.instanceMatrix.needsUpdate = true; }
  }
  // ctx: {px, py, ph, magnet, collect(it)}
  update(dt, dz, ctx) {
    this.t += dt;
    const keep = [];
    for (const it of this.items) {
      let sc = 1;
      if (it.col > 0) {
        // खाते हुए गोलू के मुँह की ओर
        it.col -= dt;
        const k = 1 - Math.exp(-22 * dt);
        it.x += (ctx.px - it.x) * k; it.y += (ctx.py + ctx.mouth - it.y) * k; it.z += (-0.4 - it.z) * k;
        sc = Math.max(0, it.col / 0.16);
        if (it.col <= 0) { this.release(it); continue; }
      } else {
        it.z += dz;
        if (ctx.magnet && !it.mag && it.z > -16 && it.z < 3 && Math.abs(it.x - ctx.px) < 9) it.mag = true;
        if (it.mag) {
          const k = 1 - Math.exp(-9 * dt);
          it.x += (ctx.px - it.x) * k; it.y += (ctx.py + 0.9 - it.y) * k; it.z += (0 - it.z) * k * 1.1;
        }
        const dx = Math.abs(it.x - ctx.px);
        const hit = it.mag ? (dx < 0.9 && Math.abs(it.z) < 1.0 && Math.abs(it.y - ctx.py - 0.9) < 1.4)
          : (dx < 0.85 && it.z > -0.75 && it.z < 0.75 && it.y > ctx.py - 0.35 && it.y < ctx.py + ctx.ph + 0.25);
        if (hit) { it.col = 0.16; ctx.collect(it); }
        else if (it.z > 2.6) { this.release(it); continue; } // छूटी मिठाई कैमरे के सामने न आए
      }
      keep.push(it);
      const bob = it.col > 0 ? 0 : Math.sin(this.t * 3 + it.ph) * 0.08;
      this.e.set(0.25, this.t * 2.2 + it.ph, 0);
      this.q.setFromEuler(this.e);
      this.v.set(it.x, it.y + bob, it.z);
      this.s.setScalar(sc * (it.type === 'rasmalai' ? 1.15 : SWEETS[it.type].sky ? 1.45 : 1));
      this.m.compose(this.v, this.q, this.s);
      for (const im of this.meshes[it.type]) im.setMatrixAt(it.slot, this.m);
    }
    this.items = keep;
    this.flush();
  }
}

// ---------------- चमकते कण ----------------
class Particles {
  constructor(scene, n = 320) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.ps = [];
    for (let i = 0; i < n; i++) { this.ps.push({ life: 0 }); this.pos[i * 3 + 1] = -1000; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    this.geo = g;
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.42, map: dotTexture(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true }));
    this.pts.frustumCulled = false;
    scene.add(this.pts);
    this.i = 0;
    this.c = new THREE.Color();
  }
  burst(x, y, z, color, count = 8, sp = 4, up = 2, life = 0.6, grav = -9) {
    this.c.set(color);
    for (let k = 0; k < count; k++) {
      const p = this.ps[this.i];
      const idx = this.i;
      this.i = (this.i + 1) % this.n;
      const a = Math.random() * Math.PI * 2, r = Math.random() * sp;
      Object.assign(p, { x, y, z, vx: Math.cos(a) * r, vy: up + Math.random() * up, vz: Math.sin(a) * r, life: life * (0.6 + Math.random() * 0.6), g: grav });
      this.col[idx * 3] = this.c.r; this.col[idx * 3 + 1] = this.c.g; this.col[idx * 3 + 2] = this.c.b;
    }
  }
  update(dt, dz) {
    for (let i = 0; i < this.n; i++) {
      const p = this.ps[i];
      if (p.life <= 0) { if (this.pos[i * 3 + 1] > -999) this.pos[i * 3 + 1] = -1000; continue; }
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt + dz;
      this.pos[i * 3] = p.x; this.pos[i * 3 + 1] = p.life > 0 ? p.y : -1000; this.pos[i * 3 + 2] = p.z;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
  clear() { for (const p of this.ps) p.life = 0; }
}

// ---------------- दुनिया ----------------
export class World {
  constructor(scene) {
    this.scene = scene;
    this.sweets = new SweetSet(scene);
    this.parts = new Particles(scene);
    this.obs = []; this.pups = []; this.gates = []; this.flexes = []; this.events = [];
    this.oPool = {}; this.pPool = {};
    this.chunks = { '-1': [], '1': [] };
    this.cPool = {};
    this.buildRoad();
    this.prebuild();
  }

  buildRoad() {
    const len = 210, z0 = -len / 2 + 22;
    // असली जैसी ईंट की सड़क (उभार के साथ)
    const rep = (t, rx, ry) => { const c = t.clone(); c.needsUpdate = true; c.wrapS = c.wrapT = THREE.RepeatWrapping; c.repeat.set(rx, ry); return c; };
    this.roadTile = ROAD_HALF * 2 / 3;
    this.roadTex = rep(RT.road, 3, len / this.roadTile);
    this.roadN = rep(RT.roadN, 3, len / this.roadTile);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF * 2, len), new THREE.MeshStandardMaterial({ map: this.roadTex, normalMap: this.roadN, normalScale: new THREE.Vector2(1.2, 1.2), roughness: 0.93 }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, z0);
    road.receiveShadow = true;
    this.scene.add(road);
    // पत्थर का किनारा
    this.curbTile = 3;
    this.curbN = rep(RT.dirtN, 1, len / this.curbTile);
    for (const s of [-1, 1]) {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.26, len), new THREE.MeshStandardMaterial({ color: 0xcfc2a8, roughness: 0.9, normalMap: this.curbN }));
      curb.position.set(s * (ROAD_HALF + 0.12), 0.13, z0);
      curb.receiveShadow = true; curb.castShadow = true;
      this.scene.add(curb);
    }
    // लेन की हल्की चूने की धारियाँ (घिसी हुई)
    const c = document.createElement('canvas'); c.width = 16; c.height = 128;
    const x = c.getContext('2d'); x.fillStyle = 'rgba(245,238,222,0.55)'; x.fillRect(4, 0, 8, 70);
    this.dashTex = new THREE.CanvasTexture(c);
    this.dashTex.wrapS = this.dashTex.wrapT = THREE.RepeatWrapping;
    this.dashTex.repeat.set(1, len / 6);
    for (const lx of [-LANE_W / 2, LANE_W / 2]) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(0.13, len), new THREE.MeshBasicMaterial({ map: this.dashTex, transparent: true, depthWrite: false, opacity: 0.55 }));
      d.rotation.x = -Math.PI / 2;
      d.position.set(lx, 0.012, z0);
      this.scene.add(d);
    }
    this.roadLen = len;
    // मिट्टी वाली ज़मीन (फ़ुटपाथ)
    this.groundTile = 5;
    this.groundTex = rep(RT.dirt, 130 / this.groundTile, (len + 20) / this.groundTile);
    this.groundN = rep(RT.dirtN, 130 / this.groundTile, (len + 20) / this.groundTile);
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(130, len + 20), new THREE.MeshStandardMaterial({ map: this.groundTex, normalMap: this.groundN, roughness: 0.97 }));
    gr.rotation.x = -Math.PI / 2;
    gr.position.set(0, -0.02, z0);
    gr.receiveShadow = true;
    this.scene.add(gr);
  }

  prebuild() {
    const mk = (key, fn, n) => {
      this.cPool[key] = [];
      for (let i = 0; i < n; i++) { const o = fn(i); o.visible = false; o.userData.key = key; if (!o.userData.noShadow) shadows(o, true, true); this.scene.add(o); this.cPool[key].push(o); }
    };
    for (const s of [-1, 1]) {
      mk('house' + s, (i) => makeHouse(s, i), 14);
      mk('adwall' + s, (i) => makeAdWall(s, i + (s > 0 ? 2 : 0)), 2);
      mk('pond' + s, () => makePond(s), 2);
      mk('temple' + s, () => makeTemple(s), 2);
      mk('stalls' + s, () => makeStalls(s), 2);
      mk('shop' + s, () => makeShop(s), 2);
      mk('haat' + s, (i) => makeHaat(s, i), 7);
      mk('mela' + s, (i) => makeMela(s, i), 4);
    }
    mk('gate', () => makeGate(), 2);
    mk('flex', (i) => makeFlex(i), 4);
    mk('haatgate', () => makeHaatGate(), 1);
    mk('melagate', () => makeMelaGate(), 1);
    // पावर-अप और रुकावटें पहले से (पहली बार अटके नहीं)
    for (const k of ['magnet', 'shoes', 'shield', 'samosa', 'thali']) { this.pPool[k] = [this.newPu(k)]; }
    for (const t of Object.keys(OBST)) { this.oPool[t] = []; for (let i = 0; i < 3; i++) { const o = this.newObs(t); o.visible = false; this.oPool[t].push(o); } }
  }
  newObs(t) { const o = OBST[t](); o.userData.type = t; shadows(o, true, true); this.scene.add(o); return o; }
  newPu(k) { const o = makePowerup(k); o.visible = false; shadows(o, true, false); this.scene.add(o); return o; }

  // ---------- नया खेल ----------
  reset(tutorial) {
    for (const o of this.obs) this.relObs(o);
    for (const p of this.pups) { p.obj.visible = false; this.pPool[p.kind].push(p.obj); }
    for (const g of this.gates) { g.visible = false; this.cPool[g.userData.key].push(g); }
    for (const f of this.flexes) { f.visible = false; this.cPool.flex.push(f); }
    this.flexes = []; this.toFlex = 120;
    this.toHaat = rand(600, 760); this.haatN = { '-1': 0, '1': 0 }; this.haatObs = 0; this.events = [];
    this.toMela = rand(1700, 2000); this.melaN = { '-1': 0, '1': 0 }; this.melaObs = 0; this.toBaraat = rand(1250, 1450); this.baraatQ = false;
    for (const s of ['-1', '1']) { for (const c of this.chunks[s]) this.relChunk(c); this.chunks[s] = []; }
    this.obs = []; this.pups = []; this.gates = [];
    this.sweets.clear(); this.parts.clear();
    this.dist = 0; this.diff = 0; this.speed = 14;
    this.toNext = 60;
    this.toPu = rand(260, 380);
    this.toSam = rand(800, 1100);
    this.shopDist = SHOP_EVERY - 120; // पहली दुकान जल्दी
    this.shopSide = -1;
    this.lastType = { '-1': '', '1': '' };
    this.tut = tutorial ? 3 : 0;
    this.tutRows = [];
    this.farZ = { '-1': 22, '1': 22 };
    for (const s of [-1, 1]) while (this.farZ[s] > SPAWN_Z - 20) this.spawnChunk(s);
  }

  // ---------- किनारे के मकान ----------
  getChunk(key) {
    const p = this.cPool[key];
    if (!p || !p.length) return null;
    const o = p.pop();
    o.visible = true;
    return o;
  }
  relChunk(o) { o.visible = false; this.cPool[o.userData.key].push(o); }
  spawnChunk(side) {
    const zc = this.farZ[side] - CHUNK / 2;
    let type;
    if (side === this.shopSide && this.shopDist >= SHOP_EVERY && this.cPool['shop' + side].length) {
      type = 'shop';
      this.shopDist = 0;
      this.shopSide = -side;
      const g = this.getChunk('gate');
      if (g) { g.position.set(0, 0, zc + CHUNK / 2 - 1); this.gates.push(g); }
    } else if (this.melaN[side] > 0 && this.cPool['mela' + side].length) {
      type = 'mela';
      this.melaN[side]--;
    } else if (this.haatN[side] > 0 && this.cPool['haat' + side].length) {
      type = 'haat';
      this.haatN[side]--;
    } else {
      const last = this.lastType[side];
      type = weighted([['house', 6], ['adwall', last === 'adwall' ? 0 : 1.1], ['pond', last === 'pond' ? 0 : 1.0], ['temple', last === 'temple' ? 0 : 0.6], ['stalls', last === 'stalls' ? 0 : 1.0]]);
      if (!this.cPool[type + side].length) type = 'house';
      if (!this.cPool['house' + side].length) type = pick(['adwall', 'pond', 'temple', 'stalls'].filter((t) => this.cPool[t + side].length));
    }
    const o = this.getChunk(type + side);
    this.lastType[side] = type;
    if (o) { o.position.z = zc; this.chunks[side].push(o); }
    this.farZ[side] -= CHUNK;
  }

  // ---------- रुकावटें / पावर-अप ----------
  getObs(t) {
    const p = this.oPool[t];
    const o = p && p.length ? p.pop() : this.newObs(t);
    o.visible = true;
    o.rotation.set(0, 0, 0);
    return o;
  }
  relObs(e) { e.obj.visible = false; this.oPool[e.type].push(e.obj); }
  addObs(t, lane, z, extra = {}) {
    const obj = this.getObs(t);
    const u = obj.userData;
    const e = { obj, type: t, kind: u.kind, lane, x: LANES[lane], z, vz: 0, halfW: u.halfW, halfL: u.halfL, yMin: u.yMin, yMax: u.yMax, px: false, pz: false, dead: false, ...extra };
    if (t === 'rickshaw' && e.vz > 0) obj.rotation.y = 0; // सामने से आता (मुँह +z)
    else if (t === 'rickshaw') obj.rotation.y = chance(0.5) ? Math.PI : 0;
    if (t === 'thela' || t === 'cans' || t === 'bricks' || t === 'tokri') obj.rotation.y = chance(0.5) ? Math.PI : 0;
    if (t === 'bail') obj.rotation.y = e.vz > 0 ? Math.PI : (chance(0.5) ? Math.PI : 0);
    if (t === 'bhains') obj.rotation.y = chance(0.5) ? 0 : Math.PI;
    if (t === 'band' || t === 'ghodi') obj.rotation.y = Math.PI;
    if (t === 'cow') { obj.rotation.y = e.cross ? 0 : (chance(0.5) ? 0 : Math.PI); }
    obj.position.set(e.x, 0, z);
    this.obs.push(e);
    return e;
  }
  addPu(kind, lane, z) {
    const p = this.pPool[kind];
    const obj = p.length ? p.pop() : this.newPu(kind);
    obj.visible = true;
    const e = { obj, kind, x: LANES[lane], y: 1.05, z, t: Math.random() * 5 };
    obj.position.set(e.x, e.y, z);
    this.pups.push(e);
    return e;
  }

  // ---------- मिठाई के पैटर्न ----------
  sweetType() { return weighted([['rasgulla', 60], ['gulabjamun', 22], ['balushahi', 12], ['chamcham', 6]]); }
  line(lane, z, n, type = this.sweetType(), y = 0.7, gap = 2.0) {
    for (let i = 0; i < n; i++) this.sweets.spawn(type, LANES[lane], y, z - i * gap);
  }
  arc(lane, zc, type = this.sweetType(), top = 2.5) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const z = zc + 5.2 - t * 10.4;
      const y = 0.7 + top * 4 * t * (1 - t);
      const tp = i === 3 && chance(0.28) ? 'rasmalai' : type;
      this.sweets.spawn(tp, LANES[lane], y, z);
    }
  }

  blockType() {
    if (this.haatObs > 0) return weighted([['bail', 2.2], ['bhains', 2.4], ['thela', 1.6], ['cow', 1]]);
    return weighted([['rickshaw', 3], ['thela', 3], ['cow', this.diff > 0.1 ? 1.4 : 0.6], ['bhains', this.diff > 0.2 ? 0.6 : 0]]);
  }
  oneType() {
    if (this.haatObs > 0) return weighted([['tokri', 3.2], ['bhains', 1.6], ['bail', 1.2], ['thela', 1.2], ['cans', 0.8], ['toran', 1.2], ['mud', 0.6]]);
    return weighted([['rickshaw', 2.4], ['thela', 2.4], ['cow', 1.0], ['cans', 1.6], ['barrier', 1.8], ['toran', this.diff > 0.05 ? 1.4 : 0.5], ['bricks', 1.2], ['mud', 0.8]]);
  }

  // एक "पंक्ति" — हमेशा कोई न कोई रास्ता खुला
  spawnRow(z) {
    const d = this.diff;
    const lanes = [0, 1, 2];
    const others = (l) => lanes.filter((x) => x !== l);
    // ट्यूटोरियल
    if (this.tut > 0) {
      const step = 4 - this.tut; // 1,2,3
      this.tut--;
      if (step === 1) { this.addObs('rickshaw', 1, z, { need: 'lane' }); this.line(0, z + 6, 5, 'rasgulla'); this.line(2, z + 6, 5, 'rasgulla'); return 1.6; }
      if (step === 2) { for (const l of lanes) this.addObs('barrier', l, z, { need: 'jump' }); this.arc(1, z, 'gulabjamun'); return 1.6; }
      this.addObs('toran', 0, z, { need: 'roll' }); this.addObs('toran', 1, z); this.addObs('toran', 2, z);
      this.line(1, z + 4, 6, 'balushahi', 0.5);
      return 1.6;
    }
    if (this.melaObs > 0) { // मेला: तीनों लेन में मिठाई की बारिश
      for (let q = 0; q < 3; q++) { if ((q + Math.floor(z)) % 2) this.arc(q, z, this.sweetType(), 2.2); else this.line(q, z + 5, 6, pick(['gulabjamun', 'balushahi', 'chamcham'])); }
      if (chance(0.3)) this.sweets.spawn('rasmalai', LANES[randi(0, 2)], 0.9, z - 6);
      return 0.1;
    }
    if (this.baraatQ) { // बारात सामने से आती — एक लेन खुली
      this.baraatQ = false;
      const vz = 2.2, sc = (zz) => zz * (this.speed + vz) / this.speed;
      const a = randi(0, 2), others2 = lanes.filter((x) => x !== a);
      this.addObs('ghodi', others2[0], sc(z), { vz }); this.addObs('band', others2[1], sc(z - 1), { vz });
      this.line(a, z + 4, 6, 'chamcham');
      const b = a === 1 ? pick([0, 2]) : 1, o3 = lanes.filter((x) => x !== b);
      const z2 = z - Math.max(14, this.speed * 0.95);
      for (const l of o3) this.addObs('band', l, sc(z2), { vz });
      this.line(b, z2 + 4, 6, 'balushahi');
      this.events.push('baraat');
      return 1.0;
    }
    const kind = weighted([
      ['single', lerp(4, 2.2, d)], ['double', lerp(0.9, 2.8, d)], ['jumpAll', 1.1], ['rollAll', lerp(0.6, 1.2, d)],
      ['mixed', lerp(0.3, 1.8, d)], ['moving', d > 0.2 ? lerp(0.5, 1.4, d) : 0], ['cow', d > 0.12 ? 0.8 : 0], ['breather', lerp(1.3, 0.5, d)],
      ['jumpLane', d > 0.28 ? lerp(0.6, 1.5, d) : 0], ['zigzag', d > 0.42 ? lerp(0.5, 1.4, d) : 0], ['rollJump', d > 0.35 ? lerp(0.5, 1.2, d) : 0],
    ]);
    const gap2 = Math.max(9, this.speed * 0.62); // दूसरी पंक्ति कितनी पीछे (समय के हिसाब से — हर रफ़्तार पर संभव)
    let extra = 0;
    let freeLane = randi(0, 2);
    if (kind === 'single') {
      const l = randi(0, 2), t = this.oneType();
      this.addObs(t, l, z);
      freeLane = pick(others(l));
      if (t === 'barrier' || t === 'cans' || t === 'bricks') { if (chance(0.5)) { this.arc(l, z); freeLane = -1; } else this.line(freeLane, z + 5, 5); }
      else if (t === 'toran') this.line(l, z + 4, 5, this.sweetType(), 0.45);
      else this.line(freeLane, z + 5, 5);
    } else if (kind === 'double') {
      freeLane = randi(0, 2);
      for (const l of others(freeLane)) this.addObs(chance(0.25) ? 'cans' : this.blockType(), l, z, {});
      this.line(freeLane, z + 6, 6);
      extra = 0.18;
    } else if (kind === 'jumpAll') {
      for (const l of lanes) this.addObs(this.haatObs > 0 ? (chance(0.7) ? 'tokri' : 'cans') : chance(0.7) ? 'barrier' : 'cans', l, z);
      freeLane = randi(0, 2);
      this.arc(freeLane, z);
    } else if (kind === 'rollAll') {
      for (const l of lanes) this.addObs('toran', l, z);
      freeLane = randi(0, 2);
      this.line(freeLane, z + 4, 6, this.sweetType(), 0.45);
    } else if (kind === 'mixed') {
      const perm = [...lanes].sort(() => Math.random() - 0.5);
      this.addObs(this.blockType(), perm[0], z);
      this.addObs(chance(0.5) ? 'barrier' : 'cans', perm[1], z);
      this.addObs(chance(0.7) ? 'toran' : 'bricks', perm[2], z);
      this.arc(perm[1], z);
      freeLane = -1;
      extra = 0.2;
    } else if (kind === 'moving') {
      const l = randi(0, 2);
      // सामने से आता रिक्शा: इतनी दूर से छोड़ो कि अपनी पंक्ति के साथ ही पहुँचे (दूसरी पंक्ति पर न चढ़े)
      const vz = rand(5, 8);
      this.addObs(this.haatObs > 0 ? 'bail' : 'rickshaw', l, z * (this.speed + vz) / this.speed, { vz: this.haatObs > 0 ? vz * 0.45 : vz });
      freeLane = pick(others(l));
      this.line(freeLane, z + 4, 7);
      extra = 0.35;
    } else if (kind === 'cow') {
      const from = pick([0, 2]), to = 1;
      this.addObs('cow', from, z, { cross: { from, to, t: 0, dur: 1.5 } });
      freeLane = from === 0 ? 2 : 0;
      this.line(freeLane, z + 5, 6);
      extra = 0.15;
    } else if (kind === 'jumpLane') { // पहले सब पर कूदो, फिर तुरंत लेन बदलो
      for (const l of lanes) this.addObs(chance(0.6) ? 'barrier' : 'cans', l, z);
      this.arc(randi(0, 2), z);
      freeLane = randi(0, 2);
      for (const l of others(freeLane)) this.addObs(this.blockType(), l, z - gap2 - 3, {});
      this.line(freeLane, z - gap2 + 2, 5);
      extra = 0.75;
    } else if (kind === 'zigzag') { // बाएँ-दाएँ दो बार
      const a = pick([0, 2]), b = 2 - a;
      for (const l of others(a)) this.addObs(this.blockType(), l, z, {});
      this.line(a, z + 5, 4);
      for (const l of others(b)) this.addObs(chance(0.3) ? 'cans' : this.blockType(), l, z - gap2 - 4, {});
      this.line(b, z - gap2 + 1, 4);
      freeLane = b;
      extra = 0.8;
    } else if (kind === 'rollJump') { // लुढ़को, फिर कूदो
      for (const l of lanes) this.addObs('toran', l, z);
      this.line(randi(0, 2), z + 4, 5, this.sweetType(), 0.45);
      for (const l of lanes) this.addObs(chance(0.65) ? 'barrier' : 'bricks', l, z - gap2 - 2);
      freeLane = randi(0, 2);
      this.arc(freeLane, z - gap2 - 2);
      extra = 0.75;
    } else { // breather — टेढ़ी-मेढ़ी मिठाई
      let l = randi(0, 2);
      const tp = this.sweetType();
      for (let i = 0; i < 12; i++) {
        if (i % 4 === 3) l = clamp(l + pick([-1, 1]), 0, 2);
        this.sweets.spawn(tp, LANES[l], 0.7, z + 8 - i * 2.0);
      }
      freeLane = l;
      if (chance(0.35)) this.addObs('bricks', pick(others(l)), z - 6);
    }
    // पावर-अप
    if (this.toSam <= 0 && freeLane >= 0) { // उड़न समोसा — कम मिलता है
      this.addPu('samosa', freeLane, z - 7);
      this.toSam = rand(1800, 2400);
      this.toPu = Math.max(this.toPu, 200);
    } else if (this.toPu <= 0 && freeLane >= 0) {
      this.addPu(weighted([['magnet', 4], ['shoes', 3], ['shield', 2.6], ['thali', this.dist > 300 ? 2.4 : 0]]), freeLane, z - 7);
      this.toPu = rand(420, 700);
    }
    return extra;
  }

  // उड़ते समय आसमान में ख़ास मिठाइयों के डिज़ाइन (सिर्फ़ ऊपर वाली: जलेबी, लड्डू, पेड़ा, कलाकंद, मिल्क केक)
  // लौटाता है: सुनहरे छल्लों की जगहें [{lane, z}]
  skyTrail(sec, speed, y, lane = 1) {
    const len = Math.min(240, sec * Math.max(speed, 18) * 0.92);
    const rings = [];
    const S = SKY_SWEETS, sp = (t, l, yy, z) => this.sweets.spawn(t, LANES[l], yy, z);
    let z = -16, l = lane, k = 0;
    // उड़ान शुरू: नीचे से ऊपर चढ़ती लड़ी
    for (let i = 0; i < 6; i++) sp(i % 2 ? 'jalebi' : 'laddoo', l, 1.4 + (y - 0.5) * (i / 5), -6 - i * 2.2);
    while (z > -16 - len) {
      const pat = ['line', 'zig', 'ring', 'wave', 'shower', 'ring'][k++ % 6];
      if (pat === 'line') { const t = pick(S); for (let i = 0; i < 8; i++) sp(i === 7 ? 'milkcake' : t, l, y + 0.9, z - i * 2.2); z -= 8 * 2.2; }
      else if (pat === 'zig') { for (let i = 0; i < 9; i++) { if (i % 3 === 0 && i) l = clamp(l + (l === 0 ? 1 : l === 2 ? -1 : pick([-1, 1])), 0, 2); sp(i % 2 ? 'peda' : 'jalebi', l, y + 0.9, z - i * 2.3); } z -= 9 * 2.3; }
      else if (pat === 'ring') { // छल्ले के बीच से: आगे-पीछे मिठाई, बीच में मिल्क केक
        l = clamp(l + pick([-1, 0, 1]), 0, 2);
        const zc = z - 8;
        rings.push({ lane: l, z: zc });
        for (let i = -3; i <= 3; i++) sp(i === 0 ? 'milkcake' : 'kalakand', l, y + 0.95, zc + i * 1.6);
        z -= 18;
      } else if (pat === 'wave') { const t = pick(['laddoo', 'jalebi']); for (let i = 0; i < 10; i++) sp(t, l, y + 0.9 + Math.sin(i * 0.9) * 0.5, z - i * 2.1); z -= 21; }
      else { // तीनों लेन में बारिश — जो लेन चुनो, मिठाई ही मिठाई
        for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) sp(S[(r + q) % S.length], q, y + 0.9, z - r * 2.6);
        z -= 4 * 2.6;
      }
      z -= 5;
      if (k % 4 === 0) sp('rasmalai', l, y + 0.9, z + 2.5);
    }
    return rings;
  }
  // उतरने की जगह साफ़ करो (ठीक नीचे पड़ी रुकावट से मरना अन्याय होगा)
  clearNear(z0, z1) {
    for (const e of this.obs) if (!e.dead && e.z > z0 && e.z < z1) { e.dead = true; e.flyX = rand(-6, 6); }
  }

  // ---------- हर फ़्रेम ----------
  update(dt, dz, speed, ctx) {
    this.speed = Math.max(8, speed);
    this.dist += dz;
    this.diff = clamp(this.dist / 3600, 0, 1);
    this.shopDist += dz;
    this.toPu -= dz;
    this.toSam -= dz;
    // सड़क खिसकाओ
    this.roadTex.offset.y += dz / this.roadTile; this.roadN.offset.y = this.roadTex.offset.y;
    this.groundTex.offset.y += dz / this.groundTile; this.groundN.offset.y = this.groundTex.offset.y;
    this.curbN.offset.y += dz / this.curbTile;
    this.dashTex.offset.y += dz / 6;
    // मकान
    for (const s of [-1, 1]) {
      const arr = this.chunks[s];
      for (const c of arr) c.position.z += dz;
      while (arr.length && arr[0].position.z - CHUNK / 2 > DESPAWN_Z) this.relChunk(arr.shift());
      this.farZ[s] += dz;
      while (this.farZ[s] > SPAWN_Z - 20) this.spawnChunk(s);
      for (const c of arr) { if (c.userData.halwai) c.userData.halwai.rotation.z = Math.sin(this.dist * 0.15) * 0.06; if (c.userData.anim) c.userData.anim(this.time, c.position.z > -70); }
    }
    for (let i = this.gates.length - 1; i >= 0; i--) {
      const g = this.gates[i];
      g.position.z += dz;
      if ((g.userData.type === 'haatgate' || g.userData.type === 'melagate') && !g.userData.said && g.position.z > -6) { g.userData.said = true; this.events.push(g.userData.type === 'haatgate' ? 'haat' : 'mela'); }
      if (g.position.z > DESPAWN_Z + 6) { g.visible = false; this.cPool[g.userData.key].push(g); this.gates.splice(i, 1); }
    }
    // सड़क के ऊपर बैनर
    // मिथिला हाट (हर ~1.1–1.5 किमी)
    this.toHaat -= dz;
    if (this.toHaat <= 0 && this.cPool.haatgate.length && this.shopDist > 60 && this.shopDist < SHOP_EVERY - 150) {
      this.haatN = { '-1': 6, '1': 6 };
      this.haatObs = 6 * CHUNK + 170;
      const hg = this.getChunk('haatgate');
      hg.userData.said = false;
      hg.position.set(0, 0, Math.min(this.farZ['-1'], this.farZ['1']) - 2);
      this.gates.push(hg);
      this.toHaat = rand(1100, 1500);
    }
    this.haatObs = Math.max(0, this.haatObs - dz);
    // मेला (बोनस: रुकावट नहीं, मिठाई ही मिठाई)
    this.toMela -= dz;
    if (this.toMela <= 0 && this.haatObs <= 0 && this.cPool.melagate.length && this.shopDist > 60 && this.shopDist < SHOP_EVERY - 130) {
      this.melaN = { '-1': 4, '1': 4 };
      this.melaObs = 4 * CHUNK + 150;
      const mgate = this.getChunk('melagate');
      mgate.userData.said = false;
      mgate.position.set(0, 0, Math.min(this.farZ['-1'], this.farZ['1']) - 2);
      this.gates.push(mgate);
      this.toMela = rand(2200, 2800);
    }
    this.melaObs = Math.max(0, this.melaObs - dz);
    // बारात
    this.toBaraat -= dz;
    if (this.toBaraat <= 0 && this.haatObs <= 0 && this.melaObs <= 0) { this.baraatQ = true; this.toBaraat = rand(1500, 2000); }
    this.time = (this.time || 0) + dt;
    this.toFlex -= dz;
    if (this.toFlex <= 0) {
      const z = SPAWN_Z - 6;
      const nearGate = this.gates.some((g) => Math.abs(g.position.z - z) < 45);
      if (!nearGate && this.cPool.flex.length) {
        const pool = this.cPool.flex, f = pool.splice(randi(0, pool.length - 1), 1)[0];
        f.visible = true; f.position.set(0, 0, z); this.flexes.push(f);
        this.toFlex = rand(170, 260);
      } else this.toFlex = 30;
    }
    for (let i = this.flexes.length - 1; i >= 0; i--) {
      const f = this.flexes[i];
      f.position.z += dz;
      f.userData.cloth.rotation.x = Math.sin(this.dist * 0.05 + i) * 0.06;
      if (f.position.z > DESPAWN_Z + 6) { f.visible = false; this.cPool.flex.push(f); this.flexes.splice(i, 1); }
    }
    // नई पंक्तियाँ
    this.toNext -= dz;
    while (this.toNext <= 0) {
      const z = SPAWN_Z - this.toNext;
      const extra = this.spawnRow(z);
      const gapT = lerp(1.5, 0.82, this.diff) + extra;
      this.toNext += Math.max(16, speed * gapT);
    }
    // रुकावटें
    for (let i = this.obs.length - 1; i >= 0; i--) {
      const e = this.obs[i];
      e.z += dz + e.vz * dt;
      if (e.obj.userData.dance) e.obj.userData.dance(this.time || 0);
      if (e.cross && e.z > -38 && e.cross.t < 1) {
        e.cross.t = Math.min(1, e.cross.t + dt / e.cross.dur);
        const t = e.cross.t, k = t * t * (3 - 2 * t);
        e.x = lerp(LANES[e.cross.from], LANES[e.cross.to], k);
        e.lane = k < 0.5 ? e.cross.from : e.cross.to;
        e.obj.rotation.y = (e.cross.to > e.cross.from ? -1 : 1) * Math.PI / 2 * (t < 1 ? 1 : 0.4);
        if (e.obj.userData.inner) e.obj.userData.inner.position.y = Math.abs(Math.sin(t * 18)) * 0.05;
      }
      if (e.dead) {
        e.fly = (e.fly || 0) + dt;
        e.obj.position.y += (8 - e.fly * 22) * dt;
        e.obj.rotation.x += dt * 9; e.obj.rotation.z += dt * 6;
        e.obj.position.x += e.flyX * dt;
      }
      e.obj.position.x = e.dead ? e.obj.position.x : e.x;
      e.obj.position.z = e.z;
      if (e.z - e.halfL > DESPAWN_Z || (e.dead && e.fly > 1.2)) { this.relObs(e); this.obs.splice(i, 1); }
    }
    // पावर-अप
    for (let i = this.pups.length - 1; i >= 0; i--) {
      const p = this.pups[i];
      p.t += dt;
      p.z += dz;
      p.obj.position.set(p.x, p.y + Math.sin(p.t * 3) * 0.15, p.z);
      p.obj.userData.inner.rotation.y += dt * 2.2;
      p.obj.userData.ring.rotation.set(Math.PI / 2, 0, p.t * 2);
      p.obj.userData.ring.scale.setScalar(1 + Math.sin(p.t * 5) * 0.06);
      for (const ch of p.obj.userData.inner.children) if (ch.userData.wing) ch.rotation.y = ch.userData.wing * Math.sin(p.t * 14) * 0.5;
      if (p.z > DESPAWN_Z || p.taken) { p.obj.visible = false; this.pPool[p.kind].push(p.obj); this.pups.splice(i, 1); }
    }
    this.sweets.update(dt, dz, ctx);
    this.parts.update(dt, dz);
  }
}
