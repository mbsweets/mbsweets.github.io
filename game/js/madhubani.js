// 🎨 मधुबनी शक्ति — 9 सेकंड पूरी दुनिया मधुबनी पेंटिंग जैसी: गिने-चुने चटक रंग (सिंदूरी, हल्दी, पत्ता-हरा, नील, गुलाबी, कागज़ी),
// काली स्याही की दोहरी रेखाएँ, बीच के रंगों में बारीक "कचनी" धारियाँ, हाथ-बने कागज़ का दाना; किनारे पर मधुबनी बॉर्डर (मछली, सूरज).
// एक ही अतिरिक्त पास (सिर्फ़ इन 9 सेकंड में) — बाकी समय कुछ ख़र्च नहीं.
import * as THREE from './three.module.min.js';
import { basic } from './art.js';

const VS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS = `
precision highp float;
uniform sampler2D tDiffuse; uniform vec2 res; uniform float k; uniform float expo; uniform float time;
varying vec2 vUv;
vec3 mbFit(vec3 v){ vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 mbAces(vec3 c){
  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  c *= expo / 0.6; c = I * c; c = mbFit(c); c = O * c; return clamp(c, 0.0, 1.0);
}
vec3 mbSRGB(vec3 c){ return mix(c * 12.92, pow(c, vec3(1.0/2.4)) * 1.055 - 0.055, step(0.0031308, c)); }
vec3 look(vec2 uv){ return mbSRGB(mbAces(texture2D(tDiffuse, uv).rgb)); }
float lum(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
vec3 pal(vec3 c){
  vec3 P0 = vec3(0.84,0.16,0.11), P1 = vec3(0.96,0.70,0.13), P2 = vec3(0.20,0.52,0.30), P3 = vec3(0.17,0.30,0.62),
       P4 = vec3(0.88,0.36,0.55), P5 = vec3(0.98,0.93,0.80), P6 = vec3(0.16,0.09,0.06), P7 = vec3(0.55,0.32,0.18);
  vec3 r = P0; float b = distance(c, P0), d;
  d = distance(c, P1); if (d < b) { b = d; r = P1; }
  d = distance(c, P2); if (d < b) { b = d; r = P2; }
  d = distance(c, P3); if (d < b) { b = d; r = P3; }
  d = distance(c, P4); if (d < b) { b = d; r = P4; }
  d = distance(c, P5); if (d < b) { b = d; r = P5; }
  d = distance(c, P6); if (d < b) { b = d; r = P6; }
  d = distance(c, P7); if (d < b) { b = d; r = P7; }
  return r;
}
void main(){
  vec2 px = 1.5 / res;
  vec3 c = look(vUv);
  float tl = lum(look(vUv + px * vec2(-1.0, 1.0))), tr = lum(look(vUv + px * vec2(1.0, 1.0)));
  float bl = lum(look(vUv + px * vec2(-1.0, -1.0))), br = lum(look(vUv + px * vec2(1.0, -1.0)));
  float gx = (tr + br) - (tl + bl), gy = (tl + tr) - (bl + br);
  float e = length(vec2(gx, gy));
  vec3 sat = mix(vec3(lum(c)), c, 1.6);
  vec3 p = pal(clamp(sat * 1.08, 0.0, 1.0));
  vec3 col = mix(c, p, 0.72);
  // कचनी — बीच के रंगों में तिरछी बारीक रेखाएँ
  float L = lum(col);
  float h = step(0.72, fract((gl_FragCoord.x - gl_FragCoord.y) / 7.0));
  col = mix(col, col * 0.55, h * smoothstep(0.25, 0.45, L) * (1.0 - smoothstep(0.62, 0.8, L)) * 0.8);
  // स्याही की दोहरी रेखा
  float ink = smoothstep(0.12, 0.26, e);
  col = mix(col, vec3(0.12, 0.06, 0.04), ink);
  // कागज़ का दाना
  col *= 0.93 + 0.07 * hash(floor(gl_FragCoord.xy / 2.0) + floor(time * 3.0));
  gl_FragColor = vec4(mix(c, col, k), 1.0);
}`;

export class MadhubaniFX {
  constructor(renderer) {
    this.r = renderer;
    const ext = renderer.extensions;
    const half = renderer.capabilities.isWebGL2 && (ext.has('EXT_color_buffer_half_float') || ext.has('EXT_color_buffer_float'));
    this.rt = new THREE.WebGLRenderTarget(4, 4, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, depthBuffer: true });
    this.mat = new THREE.ShaderMaterial({ vertexShader: VS, fragmentShader: FS, depthTest: false, depthWrite: false,
      uniforms: { tDiffuse: { value: this.rt.texture }, res: { value: new THREE.Vector2(4, 4) }, k: { value: 0 }, expo: { value: 1.45 }, time: { value: 0 } } });
    this.quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat); this.quad.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.quad);
    this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.v = new THREE.Vector2();
    this.frame = document.querySelector('#mbFrame');
  }
  render(scene, cam, k, scale = 1) {
    const r = this.r; r.getDrawingBufferSize(this.v);
    const w = Math.max(4, Math.floor(this.v.x * scale)), h = Math.max(4, Math.floor(this.v.y * scale));
    if (this.rt.width !== w || this.rt.height !== h) { this.rt.setSize(w, h); this.mat.uniforms.res.value.set(w, h); }
    this.mat.uniforms.k.value = k; this.mat.uniforms.expo.value = r.toneMappingExposure; this.mat.uniforms.time.value = performance.now() / 1000;
    r.setRenderTarget(this.rt); r.render(scene, cam);
    r.setRenderTarget(null); r.render(this.scene, this.cam);
  }
  showFrame(on) { if (this.frame) this.frame.classList.toggle('on', on); }
}

// पावर-अप: मधुबनी की मछली-जोड़ी (शुभ निशान) वाली गोल तख़्ती
function fishDisc() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.translate(128, 128);
  x.fillStyle = '#fbf0d6'; x.beginPath(); x.arc(0, 0, 124, 0, Math.PI * 2); x.fill();
  x.lineWidth = 10; x.strokeStyle = '#c4161c'; x.stroke();
  x.lineWidth = 4; x.strokeStyle = '#2a1511'; x.beginPath(); x.arc(0, 0, 108, 0, Math.PI * 2); x.stroke();
  for (let i = 0; i < 24; i++) { x.save(); x.rotate(i * Math.PI / 12); x.fillStyle = i % 2 ? '#f2a91b' : '#2e7b47'; x.beginPath(); x.moveTo(0, -118); x.lineTo(-7, -106); x.lineTo(7, -106); x.closePath(); x.fill(); x.restore(); }
  const fish = (rot, col) => {
    x.save(); x.rotate(rot);
    x.beginPath(); x.moveTo(-62, 0); x.quadraticCurveTo(-10, -46, 50, -6); x.lineTo(72, -26); x.lineTo(66, 0); x.lineTo(72, 26); x.lineTo(50, 6); x.quadraticCurveTo(-10, 46, -62, 0); x.closePath();
    x.fillStyle = col; x.fill(); x.lineWidth = 4; x.strokeStyle = '#2a1511'; x.stroke();
    x.strokeStyle = '#2a1511'; x.lineWidth = 2; for (let k = -30; k < 40; k += 9) { x.beginPath(); x.arc(k, 0, 9, -1.1, 1.1); x.stroke(); }
    x.fillStyle = '#fff'; x.beginPath(); x.arc(-42, -6, 7, 0, Math.PI * 2); x.fill(); x.fillStyle = '#2a1511'; x.beginPath(); x.arc(-42, -6, 3.5, 0, Math.PI * 2); x.fill();
    x.restore();
  };
  x.translate(0, -30); fish(0, '#d8457f'); x.translate(0, 60); fish(Math.PI, '#2f4f9a');
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
export function makeMadhubaniPu() {
  const g = new THREE.Group(), inner = new THREE.Group(); g.add(inner);
  const tex = fishDisc();
  const face = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
  const edge = new THREE.MeshStandardMaterial({ color: 0xc4161c, roughness: 0.5 });
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.08, 40), [edge, face, face]);
  disc.rotation.x = Math.PI / 2; inner.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 8, 36), basic(0xff7ab0, { add: true, op: 0.85 }));
  g.add(ring);
  g.userData = { kind: 'madhubani', inner, ring };
  return g;
}
