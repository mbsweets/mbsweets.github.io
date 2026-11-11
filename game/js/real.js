// असली जैसा लुक: कोड से बनी असली-जैसी सतहें (ईंट, मिट्टी, पुरानी दीवार), मिठाई की बनावट, आसमान, रोशनी का प्रतिबिंब
import * as THREE from './three.module.min.js';
import { TEX } from './art.js';

const rnd = (() => { let s = 12345; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();

// टाइल होने वाला शोर (कई परतें) — 0..1 वाली canvas
function noiseCanvas(size, octaves = 5, seedScale = 4) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = '#808080'; x.fillRect(0, 0, size, size);
  let amp = 0.55;
  for (let o = 0; o < octaves; o++) {
    const n = seedScale << o;
    const t = document.createElement('canvas');
    t.width = t.height = n;
    const tx = t.getContext('2d');
    const id = tx.createImageData(n, n);
    for (let i = 0; i < n * n; i++) { const v = rnd() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
    tx.putImageData(id, 0, 0);
    x.globalAlpha = amp;
    x.imageSmoothingEnabled = true;
    // 3×3 बार बनाकर किनारे जुड़े (tileable)
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) x.drawImage(t, i * size, j * size, size, size);
    amp *= 0.55;
  }
  x.globalAlpha = 1;
  return c;
}

// ऊँचाई (grey canvas) से normal map
function normalFrom(hc, strength = 2.5) {
  const w = hc.width, h = hc.height;
  const src = hc.getContext('2d').getImageData(0, 0, w, h).data;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  const out = x.createImageData(w, h);
  const H = (i, j) => src[(((j + h) % h) * w + ((i + w) % w)) * 4] / 255;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const dx = (H(i - 1, j) - H(i + 1, j)) * strength, dy = (H(i, j - 1) - H(i, j + 1)) * strength;
    const l = Math.hypot(dx, dy, 1);
    const k = (j * w + i) * 4;
    out.data[k] = (dx / l * 0.5 + 0.5) * 255; out.data[k + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[k + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[k + 3] = 255;
  }
  x.putImageData(out, 0, 0);
  return c;
}
function tex(canvas, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export const RT = {};

// ---------- ईंट की सड़क (खड़ंजा) — रंग + उभार ----------
function brickRoad() {
  const S = 1024, bw = 128, bh = 64, gap = 7;
  const col = document.createElement('canvas'); col.width = col.height = S;
  const hgt = document.createElement('canvas'); hgt.width = hgt.height = S;
  const c = col.getContext('2d'), h = hgt.getContext('2d');
  const nz = noiseCanvas(S, 6, 8);
  // गारा (बीच की मिट्टी)
  c.fillStyle = '#8a7462'; c.fillRect(0, 0, S, S);
  h.fillStyle = '#2a2a2a'; h.fillRect(0, 0, S, S);
  const pal = [[196, 98, 62], [184, 88, 56], [206, 112, 70], [172, 82, 54], [192, 104, 70], [214, 128, 84], [160, 80, 56]];
  for (let r = 0; r < S / bh; r++) {
    const off = r % 2 ? bw / 2 : 0;
    for (let k = -1; k < S / bw + 1; k++) {
      const x0 = k * bw + off + gap / 2, y0 = r * bh + gap / 2, w = bw - gap, hh = bh - gap;
      const p = pal[Math.floor(rnd() * pal.length)], v = 0.86 + rnd() * 0.22;
      const rr = 4 + rnd() * 6;
      const shape = (ctx) => { ctx.beginPath(); ctx.roundRect(x0 + rnd() * 2, y0 + rnd() * 2, w - rnd() * 3, hh - rnd() * 3, rr); };
      for (const dx of [0, S, -S]) {
        c.save(); c.translate(dx, 0);
        shape(c); c.fillStyle = `rgb(${p[0] * v | 0},${p[1] * v | 0},${p[2] * v | 0})`; c.fill();
        // किनारे घिसे और गहरे
        c.strokeStyle = 'rgba(60,30,20,0.35)'; c.lineWidth = 3; c.stroke();
        c.restore();
        h.save(); h.translate(dx, 0);
        shape(h);
        const g = h.createLinearGradient(x0, y0, x0, y0 + hh);
        g.addColorStop(0, '#b8b8b8'); g.addColorStop(0.15, '#e0e0e0'); g.addColorStop(0.85, '#d8d8d8'); g.addColorStop(1, '#a8a8a8');
        h.fillStyle = g; h.fill();
        h.restore();
      }
      // छोटे गड्ढे/टूटे कोने
      if (rnd() < 0.35) { c.fillStyle = 'rgba(70,40,30,0.5)'; c.beginPath(); c.arc(x0 + rnd() * w, y0 + rnd() * hh, 2 + rnd() * 5, 0, Math.PI * 2); c.fill(); }
    }
  }
  // धूल, दाग, घिसाव
  c.globalCompositeOperation = 'multiply'; c.globalAlpha = 0.35; c.drawImage(nz, 0, 0); c.globalAlpha = 1;
  c.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 90; i++) {
    const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    const x = rnd() * S, y = rnd() * S, r = 20 + rnd() * 90;
    c.save(); c.translate(x, y); c.scale(r, r * (0.4 + rnd()));
    g.addColorStop(0, rnd() < 0.5 ? 'rgba(80,55,40,0.22)' : 'rgba(210,180,140,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
  }
  h.globalCompositeOperation = 'overlay'; h.globalAlpha = 0.5; h.drawImage(nz, 0, 0); h.globalAlpha = 1;
  const small = document.createElement('canvas'); small.width = small.height = 512;
  small.getContext('2d').drawImage(hgt, 0, 0, 512, 512);
  RT.road = tex(col);
  RT.roadN = tex(normalFrom(small, 3.5), false);
}

// ---------- फ़ुटपाथ/ज़मीन (सूखी मिट्टी, कंकड़, घास) ----------
function dirt() {
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d');
  x.fillStyle = '#c8a77e'; x.fillRect(0, 0, S, S);
  const nz = noiseCanvas(S, 6, 4);
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.7; x.drawImage(nz, 0, 0);
  x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1;
  for (let i = 0; i < 900; i++) {
    const v = rnd();
    x.fillStyle = v < 0.5 ? `rgba(110,85,60,${0.25 + rnd() * 0.3})` : `rgba(235,215,185,${0.2 + rnd() * 0.3})`;
    x.beginPath(); x.arc(rnd() * S, rnd() * S, 0.8 + rnd() * 2.5, 0, Math.PI * 2); x.fill();
  }
  for (let i = 0; i < 140; i++) {
    x.strokeStyle = `rgba(${70 + rnd() * 40 | 0},${110 + rnd() * 40 | 0},${50 + rnd() * 20 | 0},0.55)`; x.lineWidth = 1.5;
    const px = rnd() * S, py = rnd() * S;
    for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(px, py); x.lineTo(px + (rnd() - 0.5) * 10, py - 6 - rnd() * 8); x.stroke(); }
  }
  RT.dirt = tex(c);
  RT.dirtN = tex(normalFrom(nz, 1.5), false);
}

// ---------- पुरानी पलस्तर वाली दीवार: मधुबनी चित्र पर मौसम की मार (धूल, सीलन, दरार) ----------
function weatherWalls() {
  const img = TEX.walls.image;
  const W = img.width, H = img.height;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  const nz = noiseCanvas(512, 6, 6);
  // पलस्तर की बनावट
  x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.42;
  for (let i = 0; i < W; i += 512) for (let j = 0; j < H; j += 512) x.drawImage(nz, i, j);
  x.globalAlpha = 1;
  // नीचे सीलन (हर टाइल 512)
  for (let i = 0; i < W; i += 512) for (let j = 0; j < H; j += 512) {
    const g = x.createLinearGradient(0, j + 330, 0, j + 512);
    g.addColorStop(0, 'rgba(120,100,80,0)'); g.addColorStop(1, 'rgba(95,75,55,0.55)');
    x.fillStyle = g; x.fillRect(i, j + 330, 512, 182);
    // ऊपर से बहे पानी के निशान
    for (let k = 0; k < 6; k++) {
      const sx = i + rnd() * 512, sw = 6 + rnd() * 18, sl = 60 + rnd() * 200;
      const g2 = x.createLinearGradient(0, j + 22, 0, j + 22 + sl);
      g2.addColorStop(0, 'rgba(90,75,60,0.28)'); g2.addColorStop(1, 'rgba(90,75,60,0)');
      x.fillStyle = g2; x.fillRect(sx, j + 22, sw, sl);
    }
  }
  x.globalCompositeOperation = 'source-over';
  // दरारें
  x.strokeStyle = 'rgba(60,45,35,0.45)'; x.lineWidth = 1.4;
  for (let k = 0; k < 40; k++) {
    let px = rnd() * W, py = rnd() * H;
    x.beginPath(); x.moveTo(px, py);
    for (let s = 0; s < 6; s++) { px += (rnd() - 0.5) * 30; py += rnd() * 22; x.lineTo(px, py); }
    x.stroke();
  }
  // उखड़ा पलस्तर (ईंट झाँकती)
  for (let k = 0; k < 18; k++) {
    const px = rnd() * W, py = rnd() * H, r = 10 + rnd() * 26;
    x.fillStyle = 'rgba(176,96,66,0.85)';
    x.beginPath(); x.ellipse(px, py, r, r * 0.6, rnd(), 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(230,220,200,0.8)'; x.lineWidth = 2; x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  TEX.walls = t; // आगे के सारे tile() इसी से
  RT.wallN = tex(normalFrom(nz, 2.2), false);
}

// ---------- मिठाई की बनावट ----------
function sweetsTex() {
  // रसगुल्ला/छेना: स्पंज जैसे छोटे छेद
  const S = 256;
  const h = document.createElement('canvas'); h.width = h.height = S;
  const x = h.getContext('2d');
  x.fillStyle = '#b0b0b0'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 1400; i++) {
    const r = 0.6 + rnd() * 2.6, px = rnd() * S, py = rnd() * S;
    x.fillStyle = `rgba(40,40,40,${0.25 + rnd() * 0.5})`;
    x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  x.globalAlpha = 0.5; x.drawImage(noiseCanvas(S, 4, 8), 0, 0); x.globalAlpha = 1;
  RT.spongeN = tex(normalFrom(h, 2.2), false);
  // बालूशाही: परतदार, फटी सतह
  const b = document.createElement('canvas'); b.width = b.height = S;
  const y = b.getContext('2d');
  y.fillStyle = '#909090'; y.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    y.strokeStyle = `rgba(${rnd() < 0.5 ? 30 : 230},${rnd() < 0.5 ? 30 : 230},${rnd() < 0.5 ? 30 : 230},0.5)`;
    y.lineWidth = 1 + rnd() * 3;
    const px = rnd() * S, py = rnd() * S;
    y.beginPath(); y.moveTo(px, py); y.quadraticCurveTo(px + (rnd() - 0.5) * 40, py + (rnd() - 0.5) * 40, px + (rnd() - 0.5) * 60, py + (rnd() - 0.5) * 60); y.stroke();
  }
  RT.flakyN = tex(normalFrom(b, 3), false);
  // नारियल का बुरादा (चमचम)
  const k = document.createElement('canvas'); k.width = k.height = S;
  const z = k.getContext('2d');
  z.fillStyle = '#707070'; z.fillRect(0, 0, S, S);
  for (let i = 0; i < 2400; i++) { z.fillStyle = `rgba(255,255,255,${0.4 + rnd() * 0.6})`; z.fillRect(rnd() * S, rnd() * S, 1 + rnd() * 4, 1 + rnd() * 1.5); }
  RT.coconutN = tex(normalFrom(k, 2.5), false);
  RT.coconut = tex(k, false);
}

export function buildRealTextures() {
  brickRoad();
  dirt();
  weatherWalls();
  sweetsTex();
}

// ---------- आसमान: नीला से सुनहरा क्षितिज, सूरज, धीरे चलते बादल ----------
// सूरज पीछे-बाएँ (कैमरे की ओर से) — सामने की हर चीज़ पर धूप, परछाईं आगे की ओर
export const SUN = new THREE.Vector3(-0.45, 0.62, 0.64).normalize();
export const HORIZON = new THREE.Color().setRGB(0.93, 0.82, 0.66, THREE.LinearSRGBColorSpace);
const SKY_FRAG = `
uniform vec3 uSun; uniform float uTime; uniform float uClouds;
varying vec3 vDir;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; } return v; }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0.0, 1.0);
  vec3 zen = vec3(0.16, 0.38, 0.78), mid = vec3(0.42, 0.62, 0.88), hor = vec3(0.93, 0.82, 0.66);
  vec3 col = mix(hor, mid, smoothstep(0.0, 0.18, h));
  col = mix(col, zen, smoothstep(0.18, 0.75, h));
  float s = max(dot(d, uSun), 0.0);
  col += vec3(1.0, 0.86, 0.62) * (pow(s, 6.0) * 0.28 + pow(s, 60.0) * 0.6) + vec3(1.0, 0.95, 0.85) * smoothstep(0.9993, 0.9997, s) * 6.0;
  if (d.y > 0.0 && uClouds > 0.5) {
    vec2 uv = d.xz / (d.y + 0.12) * 1.25 + vec2(uTime * 0.006, uTime * 0.002);
    float c = fbm(uv * 1.6);
    float m = smoothstep(0.52, 0.78, c) * smoothstep(0.0, 0.16, d.y);
    vec3 cc = mix(vec3(0.82, 0.8, 0.82), vec3(1.0, 0.98, 0.95), smoothstep(0.55, 0.85, c)) + vec3(1.0, 0.8, 0.55) * pow(s, 4.0) * 0.25;
    col = mix(col, cc, m * 0.9);
  }
  if (d.y < 0.0) col = hor;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;
const SKY_VERT = `varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`;
export function makeSky(radius = 300, clouds = true) {
  const m = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: SUN }, uTime: { value: 0 }, uClouds: { value: clouds ? 1 : 0 } },
    vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), m);
  s.frustumCulled = false;
  s.renderOrder = -10;
  return s;
}
// आसमान से रोशनी/चमक (environment map) — मिठाई और पीतल पर असली प्रतिबिंब
export function makeEnv(renderer) {
  const pm = new THREE.PMREMGenerator(renderer);
  const sc = new THREE.Scene();
  sc.add(makeSky(50, false));
  const g = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshBasicMaterial({ color: 0x8a6a50 }));
  g.rotation.x = -Math.PI / 2; g.position.y = -2;
  sc.add(g);
  const rt = pm.fromScene(sc, 0.03);
  pm.dispose();
  return rt.texture;
}

// परछाईं: cast/receive
export function shadows(obj, cast = true, receive = true) {
  obj.traverse((o) => {
    if (o.isMesh || o.isInstancedMesh) {
      if (o.material && (o.material.visible === false || o.material.isMeshBasicMaterial || o.material.isShaderMaterial)) return;
      o.castShadow = cast; o.receiveShadow = receive;
    }
  });
}
