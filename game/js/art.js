// टेक्सचर, टून मटेरियल, काली (मधुबनी) किनारी, ज्योमेट्री जोड़ने वाला
import * as THREE from './three.module.min.js';

export const INK = 0x2a1511;
export const C = {
  ink: 0x2a1511, sindoor: 0xd1261c, haldi: 0xf2a91b, leaf: 0x2e7b47, pink: 0xd8457f, cream: 0xfff6e3,
  maroon: 0x7a111a, gold: 0xe2b14a, skin: 0xf2b58c, white: 0xf7f2e8, wood: 0x8a5a34, bamboo: 0xc9a35c,
  terracotta: 0xc4643f, sky: 0xffe3a6, grass: 0x7fb85a, blue: 0x2f4f9a,
};

export const TEX = {};
const loader = new THREE.TextureLoader();
export function loadTextures(onProgress) {
  const names = ['walls', 'props', 'road', 'band', 'sign', 'gate', 'skyline'];
  let n = 0;
  return Promise.all(names.map((nm) => new Promise((res, rej) => {
    loader.load('img/' + nm + '.webp', (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      TEX[nm] = t;
      n++;
      if (onProgress) onProgress(n / names.length);
      res(t);
    }, undefined, rej);
  })));
}

const tiles = {};
// atlas का एक हिस्सा (cols×rows में i-वाँ, ऊपर-बाएँ से)
export function tile(name, cols, rows, i, inset = 0.003) {
  const k = name + ':' + cols + 'x' + rows + ':' + i;
  if (tiles[k]) return tiles[k];
  const t = TEX[name].clone();
  t.needsUpdate = true;
  t.repeat.set(1 / cols - inset * 2, 1 / rows - inset * 2);
  t.offset.set((i % cols) / cols + inset, 1 - (Math.floor(i / cols) + 1) / rows + inset);
  tiles[k] = t;
  return t;
}
export function repeatTex(name, rx, ry) {
  const t = TEX[name].clone();
  t.needsUpdate = true;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  return t;
}

// 3 सीढ़ी वाली रोशनी — कार्टून/पेंटिंग जैसा
export const GRAD = (() => {
  const t = new THREE.DataTexture(new Uint8Array([95, 175, 255]), 3, 1, THREE.RedFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
})();

const mats = {};
export function toon(color, o = {}) {
  const k = [color, o.map ? o.map.uuid : '', o.vc ? 1 : 0, o.em || 0, o.op || 1, o.ds ? 1 : 0].join('|');
  if (!o.fresh && mats[k]) return mats[k];
  const m = new THREE.MeshToonMaterial({
    color, gradientMap: GRAD, map: o.map || null, vertexColors: !!o.vc,
    emissive: new THREE.Color(o.em || 0), transparent: (o.op || 1) < 1, opacity: o.op || 1,
    side: o.ds ? THREE.DoubleSide : THREE.FrontSide,
  });
  if (!o.fresh) mats[k] = m;
  return m;
}
const basics = {};
export function basic(color, o = {}) {
  const k = [color, o.op || 1, o.add ? 1 : 0, o.map ? o.map.uuid : '', o.ds ? 1 : 0, o.fog === false ? 0 : 1].join('|');
  if (basics[k]) return basics[k];
  const m = new THREE.MeshBasicMaterial({
    color, map: o.map || null, transparent: (o.op || 1) < 1 || !!o.map && o.alpha, opacity: o.op || 1,
    blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !o.add && !((o.op || 1) < 1),
    side: o.ds ? THREE.DoubleSide : THREE.FrontSide, fog: o.fog !== false,
  });
  basics[k] = m;
  return m;
}

// काली किनारी (inverted hull) — normal की दिशा में थोड़ा बाहर, पीछे का हिस्सा
const outlines = {};
export function outlineMat(th) {
  const k = th.toFixed(3);
  if (outlines[k]) return outlines[k];
  const m = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
  const u = { value: th };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTh = u;
    sh.vertexShader = 'uniform float uTh;\n' + sh.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normalize(normal) * uTh;');
  };
  m.customProgramCacheKey = () => 'inkOutline';
  outlines[k] = m;
  return m;
}
export function addOutline(mesh, th) {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(th));
  o.raycast = () => {};
  mesh.add(o);
  return mesh;
}

const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
export function mat4(x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _p.set(x, y, z); _s.set(sx, sy, sz);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

// कई छोटी चीज़ों को एक ज्योमेट्री में (रंग vertex में) — ड्रॉ-कॉल कम
export class Merge {
  constructor() { this.p = []; this.n = []; this.c = []; }
  add(geo, m, color) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes.position, N = g.attributes.normal;
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    const col = new THREE.Color(color);
    const v = new THREE.Vector3(), nn = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m);
      nn.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      this.p.push(v.x, v.y, v.z); this.n.push(nn.x, nn.y, nn.z); this.c.push(col.r, col.g, col.b);
    }
    if (g !== geo) g.dispose();
    return this;
  }
  get empty() { return this.p.length === 0; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return g;
  }
  // एक mesh (टून + किनारी)
  mesh(th = 0.03) {
    const m = new THREE.Mesh(this.build(), toon(0xffffff, { vc: true }));
    if (th) addOutline(m, th);
    return m;
  }
}

// टेक्सचर वाली चीज़ें एक साथ (uv रखो, रंग नहीं)
export class MergeUV {
  constructor() { this.p = []; this.n = []; this.u = []; }
  add(geo, m) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv;
    const nm = new THREE.Matrix3().getNormalMatrix(m);
    const v = new THREE.Vector3(), nn = new THREE.Vector3();
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(m);
      nn.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
      this.p.push(v.x, v.y, v.z); this.n.push(nn.x, nn.y, nn.z); this.u.push(U.getX(i), U.getY(i));
    }
    if (g !== geo) g.dispose();
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    g.computeBoundingSphere();
    return g;
  }
  mesh(map, th = 0) {
    const m = new THREE.Mesh(this.build(), toon(0xffffff, { map }));
    if (th) addOutline(m, th);
    return m;
  }
}

// छोटे गोल चमकीले कण का टेक्सचर
export function dotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.9)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
