// रसगुल्ला रन — मुख्य खेल (MB Sweets, दरभंगा)
import * as THREE from './three.module.min.js';
import { loadTextures } from './art.js';
import { buildRealTextures, makeSky, makeEnv, shadows, SUN, HORIZON } from './real.js';
import { makeBees, makeSkyline, makeSamosaMount, SWEETS } from './models.js';
import { Golu as GoluCode } from './golu.js';
import { Golu as Golu3D, loadGolu } from './golu3d.js';
import { World, LANES, JUMP } from './world.js';
import { SkyShow } from './skyshow.js';
import { makeMonkey, animMonkey } from './extra.js';
import { NightFX } from './jungle.js';
import { pickCheer } from './cheers.js';
import { loadWardrobe } from './wardrobe.js';
import { Leaderboard } from './lb.js';
import { Rewards } from './rewards.js';
import { Rate } from './rate.js';
import { Voice } from './voice.js';
import { Sound } from './audio.js';
import { T, LANG, setLang, applyLang, L } from './i18n.js';
import { logErr } from './errlog.js';
import { clamp, lerp, damp, rand, randi, pick, store, storeNum, vibrate, VIB } from './util.js';
import { SETTINGS, loadSettings, Missions, wallet, upTime, wardrobe, stats, checkBadges, buyHeadstart, HEADSTART_COST } from './meta.js';
import { P, PORTAL } from './platform.js';
import { MetaUI } from './metaui.js';
import { countOpen, countGame } from './count.js';
import { Delivery } from './delivery.js';
import { Emotes } from './emote.js';
import { Tricks } from './tricks.js';
import { Festival } from './festivals.js';
import { makeBoat, WATER_Y } from './pond.js';
import { MadhubaniFX } from './madhubani.js';
import { Recorder, GhostRunner, decode, flagsOf, istDay } from './ghost.js';
import { Story } from './story.js';
import { Weather, WX_ICON } from './weather.js';
import { Moments } from './moment.js';
import { GoluShop } from './goshop.js';
import { makeJhola, makeMonkeyTree, placeTree, branchPos, SamosaDrops, addFamily } from './monkeyscene.js';
import { ZIP_H, ROPE_Y, makeTrolley, zipSag, placeTrolley } from './zipline.js';
import { Darshan } from './darshan.js';
import { RasgullaGame } from './rasgulla.js';

const $ = (s) => document.querySelector(s);
// बटन का लिखा कटे नहीं: जगह से बड़ा हो तो अक्षर छोटे करो (न्यूनतम min px)
function fitText(el, min = 11) { if (!el || !el.clientWidth) return; el.style.fontSize = ''; let f = parseFloat(getComputedStyle(el).fontSize); while (el.scrollWidth > el.clientWidth + 1 && f > min) { f -= 0.5; el.style.fontSize = f + 'px'; } }
// ग्राफ़िक्स के दर्जे (0 = सबसे बढ़िया). ऑटो: पूरी दौड़ में हर 2 सेकंड रफ़्तार देखो, धीमा हो तो एक दर्जा नीचे; फ़ोन याद रखे
// 🖥️ फ़ोन का ग्राफ़िक्स चिप (19 नवंबर): बढ़िया चिप (iQOO 13 = Adreno 830, नए Mali/Immortalis, कंप्यूटर) → ज़्यादा साफ़ तस्वीर; पुराने चिप → हल्के दर्जे से शुरू
export const GPU = (() => {
  try {
    const c = document.createElement('canvas'), gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return { name: '', cls: 'mid' };
    const ext = gl.getExtension('WEBGL_debug_renderer_info'), name = String((ext && gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) || gl.getParameter(gl.RENDERER) || '');
    const lose = gl.getExtension('WEBGL_lose_context'); if (lose) lose.loseContext();
    const top = /Adreno[^0-9]*(7[3-9]\d|8\d\d)|Mali-G(7[6-9]|7[1-9]\d|9\d\d)\b|Immortalis|Xclipse 9|NVIDIA|GeForce|Radeon RX|Apple M\d/i.test(name);
    const low = /SwiftShader|llvmpipe|Adreno[^0-9]*([1-5]\d\d|60\d|61[0-2])\b|Mali-(4\d\d|T\d+|G[35]\d|G52|G57|G68)\b|PowerVR|SGX|Vivante/i.test(name);
    return { name, cls: top ? 'top' : low ? 'low' : 'mid' };
  } catch (e) { return { name: '', cls: 'mid' }; }
})();
const DPR = Math.min(window.devicePixelRatio || 1, GPU.cls === 'top' ? 2.5 : 2); // बढ़िया चिप पर 2.5 (2K स्क्रीन पर किनारे साफ़)
const TIERS = [
  { pr: DPR, sh: true, fog: [70, 155], view: -175 },
  { pr: Math.min(DPR, 1.5), sh: true, fog: [70, 155], view: -175 },
  { pr: Math.min(DPR, 1.25), sh: false, fog: [66, 150], view: -165 },
  { pr: 1, sh: false, fog: [52, 128], view: -132 },
  { pr: Math.min(DPR, 1) * 0.8, sh: false, fog: [44, 112], view: -116 },
];
// फ़ोन के हिसाब से शुरुआती दर्जा: चिप + RAM (navigator.deviceMemory: 0.5/1/2/4/8 GB) + CPU कोर
function deviceTier() {
  const m = navigator.deviceMemory || 8, c = navigator.hardwareConcurrency || 8;
  if (GPU.cls === 'top' && m >= 4) return 0;
  const t = m <= 2 ? 3 : m <= 3 ? 2 : (m <= 4 || c <= 4) ? 1 : 0;
  return GPU.cls === 'low' ? Math.max(t, 3) : t;
}
const TIER_TOP = () => (GPU.cls === 'low' ? 2 : 0); // अपने-आप मोड इससे ऊपर नहीं चढ़ेगा
// पिछली बार सीखा दर्जा (gfxTier2 — पुराना gfxTier छोड़ा: पहले एक भारी पल पर घटा दर्जा हमेशा के लिए अटक जाता था)
function startTier() {
  const saved = parseInt(store('gfxTier2'), 10);
  return saved >= 0 && saved < TIERS.length ? saved : deviceTier();
}
const GRAV = -JUMP.g, JUMP_V = JUMP.v, SHOE_V = 17.1, ROLL_T = 0.62, H_STAND = 1.75, H_ROLL = 0.9, HALF_W = 0.38;
const REVIVE_COST = 300; // मिठाइ दय आगू खेलू
const LOCAL = !PORTAL && /mbsweets\.github\.io$|^127\.0\.0\.1$|^localhost$/.test(location.hostname) || /[?&]shop=1/.test(location.search);
const GAME_URL = 'https://mbsweets.github.io/game/';
const ORDER_URL = 'https://mbsweets.github.io/mb-sweets/order/';
const FLY_Y = 10.5; // बूस्टर का समय अब meta.js (अपग्रेड) से
// लेवल — दूरी (मीटर) से; रफ़्तार हर लेवल में बढ़े
const LEVELS = [0, 300, 800, 1500, 2400, 3300, 4700, 6200, 8000];
const SPEED_PTS = [[0, 13.5], [300, 17], [800, 22.5], [1500, 27.5], [2400, 32], [4000, 36], [6500, 39.5], [9000, 42]];
// दिन → शाम (1400) → रात (2000–2500, लेवल 5 से पहले पूरी) → जंगल रात में → भोर (3900) → दिन (खेत/गाँव) → फिर शाम… हर 6000 मी.
function timeOfDay(d) {
  const r = (x, a, b) => clamp((x - a) / (b - a), 0, 1);
  if (d < 3900) return { eve: r(d, 1400, 2000), night: r(d, 2000, 2500) };
  const x = (d - 3900) % 6000;
  if (x < 600) { const k = 1 - x / 600; return { eve: k, night: k }; } // भोर
  if (x < 2900) return { eve: 0, night: 0 };
  return { eve: r(x, 2900, 3500), night: r(x, 3500, 4000) };
}
const TOD = {
  hor: [new THREE.Color(0.93, 0.82, 0.66), new THREE.Color(0.82, 0.48, 0.26), new THREE.Color(0.2, 0.2, 0.34)],
  sun: [new THREE.Color(0xfff0d8), new THREE.Color(0xffad6a), new THREE.Color(0xa8bcff)], sunI: [3.0, 2.2, 1.15],
  sky: [new THREE.Color(0xcfe3ff), new THREE.Color(0xffc9a0), new THREE.Color(0x6a7ac0)], gnd: [new THREE.Color(0x9a7a5a), new THREE.Color(0x8a5a40), new THREE.Color(0x4a4560)], hemiI: [0.6, 0.42, 0.95],
  exp: [1.45, 1.22, 1.55],
};
const tri = (arr, e, n, out) => out.copy(arr[0]).lerp(arr[1], e).lerp(arr[2], n);
const trin = (arr, e, n) => (arr[0] + (arr[1] - arr[0]) * e) * (1 - n) + arr[2] * n;

function baseSpeed(d) {
  for (let i = 1; i < SPEED_PTS.length; i++) {
    const [d1, v1] = SPEED_PTS[i];
    if (d < d1) { const [d0, v0] = SPEED_PTS[i - 1]; return v0 + (v1 - v0) * (d - d0) / (d1 - d0); }
  }
  return Math.min(38.5, 37.5 + (d - 9000) / 3000);
}

const SW_COL = { rasgulla: 0xffffff, gulabjamun: 0x9a3b1c, balushahi: 0xf2b84b, chamcham: 0xff8fb1, rasmalai: 0xffd24d, jalebi: 0xf39a1e, laddoo: 0xf7a21b, peda: 0xd9b07a, kalakand: 0xf3e2b0, milkcake: 0xc58a3e };
const SKY_NAME = { hi: { jalebi: 'जलेबी', laddoo: 'लड्डू', peda: 'पेड़ा', kalakand: 'कलाकंद', milkcake: 'मिल्क केक' }, en: { jalebi: 'Jalebi', laddoo: 'Laddoo', peda: 'Peda', kalakand: 'Kalakand', milkcake: 'Milk Cake' } };

class Game {
  constructor() {
    this.sound = new Sound();
    this.voice = new Voice(this.sound);
    this.state = 'loading';
    this.best = storeNum('best');
    this.total = storeNum('total');
    this.tutDone = store('tut') === '1';
    this.ms = new Missions();
    this.flyT = upTime('samosa');
    this.runs = 0;
    loadSettings();
    this.applySettings();
    P.watchMute((m) => this.sound.setBlock('portal', m));
  }
  applySettings() { this.sound.setMusic(SETTINGS.music); VIB.on = SETTINGS.vib; if (!SETTINGS.voice && this.voice) this.voice.stop(); }
  // ग्राफ़िक्स: कम = हल्का दर्जा 3, बेसी = 0, ऑटो = फ़ोन देखकर (दौड़ते-दौड़ते घटता भी है)
  applyGfx() {
    const q = SETTINGS.gfx; if (!this.renderer) return;
    this.setTier(q === 'low' ? 3 : q === 'high' ? 0 : startTier());
    this.perf = { t: 0, n: 0, sum: 0, done: q !== 'auto', prev: 0, miss: 0 };
  }
  // live = दौड़ के बीच: सिर्फ़ रेज़ोल्यूशन/दूरी बदलो — परछाईं चालू/बंद से हर shader दोबारा बनता है (बड़ा झटका), वो अगली दौड़ की शुरुआत में
  setTier(n, live = false) {
    const T0 = TIERS[n], r = this.renderer;
    this.tier = n;
    this.pr = T0.pr;
    r.setPixelRatio(this.pr); this.resize();
    this.fogBase = T0.fog; this.tod = null; // कोहरा applyTod में (रात में थोड़ा पास)
    this.scene.fog.near = T0.fog[0]; this.scene.fog.far = T0.fog[1];
    if (this.lamp) this.lamp.visible = n <= 2;
    this.world.viewZ = T0.view;
    if (!live && r.shadowMap.enabled !== T0.sh) {
      r.shadowMap.enabled = T0.sh; this.sun.castShadow = T0.sh;
      this.golu.shadow.material.opacity = T0.sh ? 0.16 : 0.28;
      this.scene.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; });
    }
  }

  async boot() {
    applyLang();
    P.loadingStart();
    const bar = $('#loadbar i');
    try {
      await Promise.all([loadTextures((p) => { bar.style.width = (p * 80) + '%'; }), document.fonts ? document.fonts.ready : null,
        loadGolu().then(async (d) => { this.has3d = true; try { await loadWardrobe(d.tex); } catch (e) { console.warn('wardrobe', e); } }, (e) => { console.warn('golu3d', e); })]);
      buildRealTextures();
    } catch (e) {
      $('#loadmsg').textContent = 'Error: ' + e;
      return;
    }
    this.setup();
    bar.style.width = '100%';
    this.toMenu();
    $('#loading').hidden = true;
    P.loadingStop();
    countOpen();
    this.checkChallenge();
    this.clock = new THREE.Clock();
    this.frame();
  }

  setup() {
    const canvas = $('#c');
    // फ़ोन (घनी स्क्रीन) पर MSAA बहुत भारी और फ़ायदा कम — सिर्फ़ कंप्यूटर/कम-घनी स्क्रीन पर
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: 'high-performance' });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.45;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.pr = Math.min(window.devicePixelRatio || 1, 2);
    r.setPixelRatio(this.pr);
    const sc = this.scene = new THREE.Scene();
    sc.fog = new THREE.Fog(HORIZON.clone(), 70, 155);
    this.cam = new THREE.PerspectiveCamera(62, 1, 0.1, 420);
    // आसमान + उससे आने वाली रोशनी/चमक
    this.sky = makeSky(300, true);
    sc.add(this.sky);
    this.envs = [makeEnv(r), makeEnv(r, 1, 0), makeEnv(r, 1, 1)];
    sc.environment = this.envs[0];
    this.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x9a7a5a, 0.6);
    sc.add(this.hemi);
    // सूरज — असली परछाईं (सिर्फ़ खिलाड़ी के आस-पास, ताकि फ़ोन पर तेज़ चले)
    const dl = this.sun = new THREE.DirectionalLight(0xfff0d8, 3.0);
    dl.target.position.set(0, 0, -15);
    dl.position.copy(SUN).multiplyScalar(45).add(dl.target.position);
    dl.castShadow = true;
    const big = Math.min(window.innerWidth, window.innerHeight) > 700 || GPU.cls === 'top'; // बढ़िया चिप: तीखी परछाईं
    dl.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024);
    const sc2 = dl.shadow.camera;
    sc2.left = -16; sc2.right = 16; sc2.top = 32; sc2.bottom = -32; sc2.near = 5; sc2.far = 110;
    dl.shadow.bias = -0.0006; dl.shadow.normalBias = 0.03;
    sc.add(dl); sc.add(dl.target);
    sc.add(makeSkyline());
    this.world = new World(sc);
    this.world.speedAt = baseSpeed;
    this.world.sweets.camQ = this.cam.quaternion;
    this.golu = this.has3d ? new Golu3D() : new GoluCode();
    shadows(this.golu.root, true, false);
    this.golu.shadow.material = this.golu.shadow.material.clone();
    this.golu.shadow.material.opacity = 0.16;
    sc.add(this.golu.root);
    this.samosa = makeSamosaMount();
    sc.add(this.samosa);
    this.skyShow = new SkyShow(sc);
    this.beeKit = makeBees();
    this.bees = this.beeKit.bees;
    this.beeGroup = this.beeKit.group;
    sc.add(this.beeGroup);
    this.beeC = new THREE.Vector3(0, 2, 18);
    this.monkey = makeMonkey(); this.monkey.visible = false; sc.add(this.monkey);
    // 🐒 बंदर का सीन: पेड़, गोलू का समोसे वाला झोला, गिरे समोसे, बंदर के सिर पर तारे
    this.monkeyTree = makeMonkeyTree(); sc.add(this.monkeyTree); addFamily(this.monkeyTree, makeMonkey); // 🐒 माँ + बच्चा पेड़ पर
    { const R = this.mkRing = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.78, 28), new THREE.MeshBasicMaterial({ color: 0xff3b30, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false })); R.rotation.x = -Math.PI / 2; R.renderOrder = 2; R.visible = false; sc.add(R); } // चोर बंदर के नीचे लाल घेरा — किस लेन में है
    this.jhola = makeJhola(); this.samDrops = new SamosaDrops(sc); this.emoM = new Emotes(sc);
    { const sm = new THREE.Mesh(this.jhola.userData.sams[0].geometry, this.jhola.userData.sams[0].material); sm.scale.setScalar(1.5); sm.position.set(0, -0.6, 0.06); sm.visible = false; this.monkey.userData.armR.add(sm); this.monkey.userData.snack = sm; }
    this.jholaBack = 0; this.holdJhola();
    this.trolley = makeTrolley(); sc.add(this.trolley); this.zipOff = 0; // 🌳 रस्सी का कुंडा
    this.dl = new Delivery(this, sc); // 🛵 डिलीवरी
    this.emo = new Emotes(sc); // 😅 भाव
    this.tricks = new Tricks(this); // 🤸 करतब
    this.fest = new Festival(this, this.world); // 🪔 त्योहार (तारीख़ से)
    this.boat = makeBoat(); this.boat.visible = false; sc.add(this.boat); // 🚣 पोखर की नाव
    this.mfx = new MadhubaniFX(r); this.madK = 0; // 🎨 मधुबनी
    this.rec = new Recorder(); this.ghost = new GhostRunner(sc, this.has3d); // 👻 परछाईं
    this.story = new Story(this); // 📖 कहानी
    this.mom = new Moments(); // 📸 बेस्ट पल
    this.gshop = new GoluShop(this); // 🏪 गोलू की दुकान
    this.darshan = new Darshan(this); // 📮 मिथिला दर्शन
    this.rg = new RasgullaGame(this); // 🍮 रसगुल्ला बनाओ
    this.camKick = 0;
    // रात: लालटेन/खंभों की चमक + जुगनू; गोलू के आगे गरम रोशनी (भारी दर्जों में बंद)
    this.nfx = new NightFX(sc);
    this.lamp = new THREE.PointLight(0xffc27a, 0, 22, 1.3); this.lamp.position.set(0, 3.2, -3); sc.add(this.lamp);
    this.wild = 0;
    this.mk = { st: 'off', t: 0, x: 0, y: 0, z: 4 };
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitText($('#btnRg b'), 11)); // फ़ॉन्ट आने के बाद चौड़ाई बदलती है
    { const bt = $('#btnRg'); let lw = -1; if (bt && window.ResizeObserver) new ResizeObserver((es) => { const w = Math.round(es[0].contentRect.width); if (w !== lw && w > 0) { lw = w; requestAnimationFrame(() => fitText(bt.querySelector('b'), 11)); } }).observe(bt); } // मेन्यू दिखते ही / चौड़ाई बदलते ही नाप
    this.bindInput();
    this.bindUI();
    this.wx = new Weather(sc, this.lb.url, !PORTAL && this.lb.on); // 🌧️ दरभंगा का असली मौसम
    this.wx.onChange = () => { this.tod = null; this.refreshMenu(); };
    this.wx.load();
    this.camX = 0; this.shake = 0;
    this.world.reset(false);
    this.applyGfx();
    this.warmUp();
  }

  // छिपी चीज़ें (हाट, मेला, ट्रेन, रुकावटें…) के shader और तस्वीरें लोडिंग में ही GPU पर — पहली बार दिखने पर झटका नहीं
  warmUp() {
    const r = this.renderer, hid = [], texs = new Set();
    this.scene.traverse((o) => {
      if (!o.visible) { hid.push(o); o.visible = true; }
      if (o.material) for (const m of [].concat(o.material)) for (const k of ['map', 'normalMap', 'roughnessMap', 'emissiveMap', 'alphaMap', 'bumpMap']) if (m[k] && m[k].isTexture) texs.add(m[k]);
    });
    try { r.compile(this.scene, this.cam); for (const t of texs) r.initTexture(t); } catch (e) { console.warn('warmUp', e); }
    for (const o of hid) o.visible = false;
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    fitText($('#btnRg b'), 11);
    this.renderer.setSize(w, h, false);
    this.cam.aspect = w / h;
    const t = clamp((w / h - 0.45) / (1.35 - 0.45), 0, 1);
    this.view = { y: lerp(4.9, 4.3, t), z: lerp(8.3, 7.4, t), fov: lerp(72, 60, t), ly: lerp(0.9, 1.3, t), lz: lerp(-12, -9, t) };
    this.cam.fov = this.view.fov;
    this.cam.updateProjectionMatrix();
  }

  // ------------------------------------------------ इनपुट
  bindInput() {
    const c = $('#app');
    let sx = 0, sy = 0, st = 0, used = false, id = null;
    c.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button,a')) return;
      if (this.sound.ctx && this.sound.ctx.state === 'suspended' && this.state === 'play') this.sound.ctx.resume(); // iOS: आवाज़ छूने पर ही
      id = e.pointerId; sx = e.clientX; sy = e.clientY; st = performance.now(); used = false;
    });
    c.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id || used) return;
      const dx = e.clientX - sx, dy = e.clientY - sy, th = Math.max(22, Math.min(innerWidth, innerHeight) * 0.045);
      if (Math.abs(dx) < th && Math.abs(dy) < th) return;
      used = true;
      if (Math.abs(dx) > Math.abs(dy)) this.act(dx > 0 ? 'right' : 'left'); else this.act(dy < 0 ? 'up' : 'down');
    });
    const end = (e) => { if (e.pointerId === id) id = null; };
    // छोटा टैप (खिसकाया नहीं) = हवा में करतब
    c.addEventListener('pointerup', (e) => { if (e.pointerId === id && !used && performance.now() - st < 300) this.act('tap'); end(e); });
    c.addEventListener('pointercancel', end);
    window.addEventListener('keydown', (e) => {
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return; // नाम लिखते समय खेल के बटन नहीं
      const k = e.key;
      if (['ArrowLeft', 'a', 'A'].includes(k)) this.act('left');
      else if (['ArrowRight', 'd', 'D'].includes(k)) this.act('right');
      else if (['ArrowUp', 'w', 'W', ' '].includes(k)) this.act('up');
      else if (['ArrowDown', 's', 'S'].includes(k)) this.act('down');
      else if (['e', 'E', 'Shift', 'Enter'].includes(k)) this.act('rush');
      else if (['f', 'F', 'q', 'Q'].includes(k)) this.act('tap');
      else if (['p', 'P', 'Escape'].includes(k)) { if (this.state === 'play') this.pause(); else if (this.state === 'paused') this.resume(); }
      else return;
      e.preventDefault();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(true); });
  }

  act(a) {
    if (this.state !== 'play') return;
    const p = this.p;
    if (this.dl.inScene() && a !== 'rush') { this.dl.hurry(); return; } // 🛵 डिलीवरी का रुका पल — स्वाइप/टैप = जल्दी
    if (a === 'left' || a === 'right') {
      const nl = clamp(p.lane + (a === 'left' ? -1 : 1), 0, 2);
      if (nl === p.lane) { this.edgeBump(); return; }
      p.prevLane = p.lane; p.lane = nl; p.tx = LANES[nl]; p.laneT = 0;
      this.sound.lane();
    } else if ((a === 'up' || a === 'down') && p.fly > 0) {
      return;
    } else if (a === 'up') {
      if (p.ground || (p.coy > 0 && p.vy <= 0)) this.doJump();
      else p.jbuf = 0.22; // ज़मीन छूने से ठीक पहले खिसकाया — छूते ही कूदेगा (उँगली बेकार न जाए)
      if (p.roll > 0) p.roll = 0;
    } else if (a === 'down') {
      this.msBump('rolls');
      if (p.ground) { p.roll = ROLL_T; this.sound.roll(); }
      else { p.vy = Math.min(p.vy, -24); p.rollQ = true; }
    } else if (a === 'rush') this.startRush();
    else if (a === 'tap' && !p.scooty && !p.zip) this.tricks.tap();
  }

  doJump() {
    const p = this.p, big = this.pu.shoes > 0;
    p.vy = big ? SHOE_V : JUMP_V; p.ground = false; p.roll = 0; p.rollQ = false; p.big = big; p.jbuf = 0; p.coy = 0; p.air = 0;
    this.sound.jump(big); this.msBump('jumps');
    this.beatJump();
    // करतब सिखाना: पहली कुछ दौड़ों में एक बार
    if (this.tutDone && !this.trickHint && this.runT > 5 && store('tutTrick') !== '1' && storeNum('tutTrickN') < 4) { this.trickHint = true; store('tutTrickN', storeNum('tutTrickN') + 1); this.toast('👆 ' + T('tutTrick'), 1700, 'gold'); }
  }

  edgeBump() {
    // किनारे से बाहर जाने की कोशिश — हल्का झटका
    this.shake = Math.max(this.shake, 0.12);
    this.sound.bump();
  }

  // ------------------------------------------------ UI
  bindUI() {
    const click = (sel, fn) => { const el = $(sel); if (el) el.addEventListener('click', (e) => { e.preventDefault(); this.sound.init(); this.sound.click(); fn(); }); };
    click('#btnPlay', () => { this.goFull(); this.start(); });
    click('#btnAgain', () => this.afterAd(() => this.start(this.lastOpts && this.lastOpts.daily ? { daily: true, ghost: this.dayTop } : this.lastOpts || {})));
    click('#btnHome', () => this.afterAd(() => this.toMenu()));
    click('#revAd', () => this.reviveAd());
    click('#revPay', () => this.revivePay());
    click('#revNo', () => this.reviveNo());
    click('#btnHome2', () => this.toMenu());
    click('#btnPause', () => this.pause());
    click('#btnResume', () => { this.goFull(); this.resume(); });
    click('#leaveNo', () => { $('#leaveS').hidden = true; this.leaveOpen = false; if (this.state === 'paused') { this.goFull(); this.resume(); } });
    click('#leaveYes', () => this.leaveNow());
    for (const b of document.querySelectorAll('[data-lang3]')) b.addEventListener('click', (e) => {
      e.preventDefault(); this.sound.init(); this.sound.click();
      setLang(b.dataset.lang3); $('#langS').hidden = true; this.refreshMenu(); this.afterLang();
    });
    // सिखाने वाली चमक — दबाते ही हटे और याद रहे
    $('#btnRush').addEventListener('click', () => { if (store('tutRush') !== '1') { store('tutRush', 1); $('#btnRush').classList.remove('teach'); this.bubble(null); } });
    $('#btnPause').addEventListener('click', () => { store('tutPause', 1); $('#btnPause').classList.remove('teach'); this.bubble(null); });
    this.backGuard();
    // शुगर रश: उँगली लगते ही (pointerdown) — click उँगली उठने तक रुकता था, तब तक टक्कर हो जाती
    // बटन अचानक उँगली के नीचे आ जाए तो अपने-आप न चले: दिखने के 0.45 सेकंड बाद ही
    const rushTap = (e) => { e.preventDefault(); e.stopPropagation(); if (performance.now() - (this.rushShown || 0) < 450) return; this.startRush(); };
    $('#btnRush').addEventListener('pointerdown', rushTap, { passive: false });
    $('#btnRush').addEventListener('click', rushTap);
    click('#hsChip', () => { this.headstart = !this.headstart; this.refreshMenu(); });
    click('#btnWard', () => this.meta.openWard());
    this.meta = new MetaUI(this);
    click('#btnMs', () => this.meta.open('ms'));
    click('#btnUp', () => this.meta.open('up'));
    click('#btnSet', () => this.meta.open('set'));
    click('#btnSet2', () => this.meta.open('set'));
    click('#btnShare', () => this.share());
    click('#btnShot', () => this.shareShot());
    $('#overPc').addEventListener('click', (e) => { const b = e.target.closest('[data-pc]'); if (!b) return; this.sound.init(); this.sound.click(); this.darshan.open(b.dataset.pc); }); // 📮 पूरा पोस्टकार्ड
    this.lb = new Leaderboard();
    if (PORTAL) this.lb.on = false; // पोर्टल पर अपना लीडरबोर्ड नहीं (उनके नियम)
    this.lb.bind(() => {});
    click('#btnLb', () => this.lb.open());
    click('#btnLb2', () => this.lb.open());
    $('#overLb').addEventListener('click', () => this.lb.open());
    this.rw = new Rewards(this.lb, LOCAL && !PORTAL && this.lb.on); // 🎫 दुकान के इनाम — सिर्फ़ अपनी वेबसाइट पर
    this.rw.bind();
    this.rw.onUnlock = (id) => { this.meta.showUnlocks([id]); };
    this.rate = new Rate(this, this.lb.url, !PORTAL && this.lb.on); // ⭐ राय — सिर्फ़ अपनी वेबसाइट
    this.rate.bind();
    // 📅 आज का रास्ता + 👻 दोस्त की चुनौती (सिर्फ़ अपनी वेबसाइट)
    const db = $('#btnDaily');
    if (db) { db.hidden = !(this.lb.on && !PORTAL); db.addEventListener('click', (e) => { e.preventDefault(); this.sound.init(); this.sound.click(); this.goFull(); this.start({ daily: true, ghost: this.dayTop }); }); }
    $('#chalGo').addEventListener('click', (e) => { e.preventDefault(); this.sound.init(); this.sound.click(); $('#chalS').hidden = true; const c = this.chal; this.goFull(); this.start({ ghost: c, daily: !!(c && c.daily && c.today) }); });
    $('#chalNo').addEventListener('click', (e) => { e.preventDefault(); $('#chalS').hidden = true; });
    // 📖 कहानी
    click('#btnStory', () => this.story.open());
    click('#btnShop', () => this.gshop.show(true));
    click('#btnRg', () => { if (this.rg) this.rg.open(); }); // 🍮 मेन्यू से सीधे मिठाई बनाओ (मालिक: "मिठाई बनाने वाला कहाँ आया?")
    click('#overRg', () => { if (this.rg) this.rg.open(); });
    click('#gshopClose', () => this.gshop.show(false));
    $('#gshopBody').addEventListener('click', (e) => { const b = e.target.closest('[data-gs]'); if (!b) return; this.sound.init(); this.sound.click(); this.gshop.click(b.dataset.gs); });
    click('#storyClose', () => { $('#storyS').hidden = true; });
    $('#storyList').addEventListener('click', (e) => { const b = e.target.closest('[data-ch]'); if (!b || b.disabled) return; this.sound.init(); this.sound.click(); this.story.cut(+b.dataset.ch); });
    $('#cutSkip').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); this.story.skip(); });
    $('#cutS').addEventListener('click', (e) => { if (e.target.closest('#cutSkip')) return; e.preventDefault(); this.story.tap(); });
    const rb = $('#btnRate'); if (rb) { rb.hidden = !this.rate.on; rb.classList.toggle('nudge', this.rate.on && !store('rated') && storeNum('plays') >= 2); rb.addEventListener('click', (e) => { e.preventDefault(); this.sound.init(); this.sound.click(); this.rate.open(); }); } // ⭐ अभी तक राय नहीं दी — लाल बिंदी
    for (const el of document.querySelectorAll('.local')) el.hidden = !LOCAL;
    const ol = $('#orderLink'); if (ol) ol.href = ORDER_URL;
  }
  refreshMenu() {
    if (this.rw && this.rw.on) this.rw.paintBadge(); // भाषा बदली हो तो इनाम-बटन भी
    const gb = $('#btnShop'); if (gb && this.gshop) gb.innerHTML = T('gsBtn') + (this.gshop.canCollect() ? ' <i>1</i>' : '');
    const ft = $('#festTag'); if (ft) { ft.hidden = !(this.fest && this.fest.on); ft.textContent = T('festTag'); }
    const wt = $('#wxTag'); if (wt) { const k = this.wx && this.wx.on && this.wx.temp != null ? this.wx.kind : null; wt.hidden = !k; if (k) wt.textContent = T('wxTag', WX_ICON[k], T('wx_' + k), this.wx.temp); }
    $('#ttl').dataset.text = T('title');
    $('#bestV').textContent = Math.floor(this.best).toLocaleString('en-IN');
    $('#totalV').textContent = Math.floor(wallet.v).toLocaleString('en-IN');
    { const rs = $('#rgSub'); if (rs && this.rg) rs.textContent = T('rgLeft', this.rg.left()); } // 🍮 मिठाई बनाओ — आज कितने इनाम बाकी
    requestAnimationFrame(() => fitText($('#btnRg b'), 11)); // छोटे फ़ोन पर "मिठाई बनाओ" कटे नहीं
    const hs = $('#hsChip'); hs.textContent = this.headstart ? T('hsOn', HEADSTART_COST) : T('hs', HEADSTART_COST);
    hs.classList.toggle('on', !!this.headstart); hs.setAttribute('aria-pressed', this.headstart ? 'true' : 'false');
    hs.hidden = !this.headstart && wallet.v < HEADSTART_COST;
    const desk = P.isDesktop();
    $('#keysTip').hidden = desk === null ? matchMedia('(pointer: coarse)').matches : !desk;
  }
  // ---------- बैक बटन से खेल न कटे (अपनी वेबसाइट; पोर्टल अपना ख़ुद संभालता है) ----------
  // खुलते ही इतिहास में एक कदम जोड़ो: बैक दबे तो खेल रुके और पूछे "खेल छोड़ें?"; दोबारा बैक या "हाँ" = बाहर
  backGuard() {
    if (PORTAL || !window.history || !history.pushState) return;
    const arm = () => { try { history.pushState({ rr: 1 }, ''); } catch (e) { /* */ } };
    arm();
    window.addEventListener('popstate', () => {
      if (this.leaving) return;
      if (this.leaveOpen) { this.leaveNow(1); return; } // दूसरा बैक — हमारा कदम पहले ही हट चुका
      // कोई खिड़की खुली हो (सेटिंग, कपड़े, रैंक, इनाम) तो बैक = वही बंद करो
      const open = [['#gshopS', '#gshopClose'], ['#storyS', '#storyClose'], ['#chalS', '#chalNo'], ['#profS', '#pfLater'], ['#rateS', '#rateX'], ['#wardS', '#wardClose'], ['#metaS', '#metaClose'], ['#lbS', '#lbClose'], ['#rwS', '#rwClose']].find(([w]) => $(w) && !$(w).hidden);
      if (open) { $(open[1]).click(); arm(); return; }
      if (this.state === 'play') this.pause();
      this.leaveOpen = true; $('#leaveS').hidden = false;
      arm();
    });
    // पूरी स्क्रीन से निकलना (Android पर पहला बैक यही करता है) = खेल रोको
    document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && this.state === 'play') this.pause(); });
  }
  leaveNow(back = 2) {
    this.leaving = true; this.leaveOpen = false; $('#leaveS').hidden = true;
    if (this.state === 'play' || this.state === 'paused') this.toMenu();
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* */ }
    // जहाँ से आए थे वहाँ (हमारे जोड़े कदम के पीछे); पीछे कुछ न हो (सीधे लिंक से खुला) तो दुकान की वेबसाइट
    const here = location.href;
    try { history.go(-back); } catch (e) { /* */ }
    setTimeout(() => { if (location.href === here && document.visibilityState === 'visible') location.href = '../'; }, 600); // /game/ से दुकान की वेबसाइट
  }
  // खेलते समय पूरी स्क्रीन — फ़ोन की नीचे वाली पट्टी (बैक/होम) छिपे, गलती से न दबे. सिर्फ़ अपनी वेबसाइट + टच वाले फ़ोन पर
  goFull() {
    if (PORTAL || document.fullscreenElement || !matchMedia('(pointer: coarse)').matches) return;
    const el = document.documentElement, f = el.requestFullscreen || el.webkitRequestFullscreen;
    if (!f) return;
    try {
      const pr = f.call(el, { navigationUI: 'hide' });
      const ok = () => { if (store('fsHint') === '1') return; store('fsHint', 1); const h = $('#fsHint'); h.textContent = '⛶ ' + T('fullHint'); h.hidden = false; setTimeout(() => { h.hidden = true; }, 5000); };
      if (pr && pr.then) pr.then(ok, () => {}); else ok();
    } catch (e) { /* */ }
  }
  // ---------- सिखाना: छोटा बुलबुला किसी बटन के पास ----------
  bubble(el, text, ms = 0) {
    let b = $('#tBub');
    clearTimeout(this.bubT);
    if (!el) { if (b) b.remove(); return; }
    if (!b) { b = document.createElement('div'); b.id = 'tBub'; $('#app').appendChild(b); }
    b.textContent = text;
    const r = el.getBoundingClientRect(), bw = b.offsetWidth, top = r.top < innerHeight / 2;
    b.style.left = Math.max(8, Math.min(innerWidth - bw - 8, r.left + r.width / 2 - bw / 2)) + 'px';
    b.style.top = (top ? r.bottom + 10 : r.top - b.offsetHeight - 12) + 'px';
    if (ms) this.bubT = setTimeout(() => this.bubble(null), ms);
  }
  teachPause() {
    if (this.state !== 'play' || store('tutPause') === '1') return;
    store('tutPause', 1);
    const b = $('#btnPause'); b.classList.add('teach');
    this.bubble(b, '❚❚ ' + T('tutPause'), 3800);
    setTimeout(() => b.classList.remove('teach'), 3800);
  }
  // सेटिंग्स → "कैसे खेलें": सीखने वाली दौड़ फिर से
  replayTutorial() {
    store('tut', 0); store('tutRush', 0); store('tutPause', 0); this.tutDone = false;
    $('#metaS').hidden = true;
    this.goFull(); this.start();
  }
  show(id) {
    this.bubble(null);
    for (const s of ['#menu', '#over', '#pauseS', '#hud', '#reviveS']) $(s).hidden = true;
    for (const s of id) $(s).hidden = false;
  }

  toMenu(skipDaily = false) {
    if (this.state === 'paused') this.ms.settle(); // बीच में छोड़ा — पूरे मिशन का इनाम फिर भी
    P.gameplayStop();
    this.state = 'menu';
    this.show(['#menu']);
    this.refreshMenu();
    this.world.reset(false);
    this.golu.root.position.set(0, 0, 0);
    this.golu.root.rotation.y = Math.PI;
    this.golu.setGlow(0);
    this.wearNow();
    this.samosa.visible = false;
    this.sound.bees(false);
    this.beeC.set(0, 2, 18);
    this.nightSaid = false; this.wild = 0; this.nfx.update(0, 0, 0, 0, this.world.chunks, this.cam.quaternion);
    if (this.mk) { this.mk.st = 'off'; this.monkey.visible = false; }
    if (this.dl) { this.dl.reset(); this.tricks.reset(); this.emo.clear(); this.boat.visible = false; if (this.pu) this.pu.madhu = 0; this.ghost.off(); this.world.setSeed(null); }
    this.paintDaily(); if (this.story) this.story.paint();
    if (this.sound.ctx && !this.sound.playing) this.sound.startMusic();
    if (!PORTAL && store('lang3') == null) $('#langS').hidden = false; // पहली बार: भाषा चुनो (फिर रोज़ का इनाम)
    else if (this.needProfile()) this.lb.askProfile(() => { if (!skipDaily) this.meta.maybeDaily(); }); // पुराने खिलाड़ी: एक बार नाम-ज़िला
    else if (!skipDaily && (!PORTAL || this.runs > 0)) this.meta.maybeDaily(); // पोर्टल पर पहली बार सीधे खेल (एक क्लिक)
  }
  // 📅 मेन्यू का "आज का रास्ता" बटन — आज का टॉपर (दिन में एक बार सर्वर से)
  paintDaily() {
    const sub = $('#dailySub'); if (!sub || $('#btnDaily').hidden) return;
    const t = this.dayTop;
    sub.textContent = t && t.today ? T('dailyTop', t.name, (t.score || 0).toLocaleString('en-IN')) : T('dailyFirst');
    if (!this.dayTopAt || Date.now() - this.dayTopAt > 5 * 60e3) { this.dayTopAt = Date.now(); this.lb.topGhost().then((g) => { if (g) { this.dayTop = g; this.paintDaily(); } }); }
  }
  // 👻 ?g=ID वाला लिंक — दोस्त की चुनौती
  async checkChallenge() {
    // 🧾 बिल के WhatsApp संदेश वाला लिंक: ?bc=CODE → इनाम वाली स्क्रीन खुलकर कोड अपने-आप
    const bc = new URLSearchParams(location.search).get('bc');
    if (bc && !PORTAL && this.rw && this.rw.on) {
      try { history.replaceState(null, '', location.pathname); } catch (e) { /* */ }
      const busy = () => ['#langS', '#profS', '#dailyS', '#unlockS'].some((q) => $(q) && !$(q).hidden);
      while (busy()) await new Promise((r) => setTimeout(r, 400));
      await this.rw.open(); this.rw.redeem(bc);
      return;
    }
    const id = new URLSearchParams(location.search).get('g');
    if (!id || PORTAL || !this.lb.on) return;
    try { history.replaceState(null, '', location.pathname); } catch (e) { /* */ }
    const g = await this.lb.getGhost(id);
    if (!g || this.state !== 'menu') return;
    this.chal = g;
    // पहली बार आए दोस्त: पहले भाषा / नाम-ज़िला / रोज़ का इनाम, फिर चुनौती
    const busy = () => ['#langS', '#profS', '#dailyS', '#unlockS'].some((q) => $(q) && !$(q).hidden);
    while (busy()) await new Promise((r) => setTimeout(r, 400));
    if (this.state !== 'menu') return;
    $('#chalT').textContent = T('chalT', g.name);
    $('#chalP').textContent = T('chalP', g.dist.toLocaleString('en-IN'), g.score.toLocaleString('en-IN'));
    $('#chalS').hidden = false;
  }
  // पहली बार: भाषा → नाम और ज़िला (बाद में न पूछना पड़े) → रोज़ का इनाम
  needProfile() { return !PORTAL && this.lb && this.lb.on && !this.lb.name && store('profAsk') !== '1'; }
  afterLang() { if (this.needProfile()) this.lb.askProfile(() => this.meta.maybeDaily()); else this.meta.maybeDaily(); }

  // अलमारी: जो पहना है (या ट्राय वाला) गोलू पर
  wearNow(of) { if (this.golu && this.golu.wear) this.golu.wear(of || wardrobe.outfit); }
  celebrate(id) {
    this.golu.dance = 2.5; this.celebT = 2.2;
    this.sound.levelUp(); this.sayKind('unlock');
    void id;
  }
  sayKind(kind) { this.sayPair(pickCheer(kind), true); }

  start(opts = {}) {
    this.lastOpts = opts;
    this.daily = !!opts.daily && this.tutDone && this.lb.on && !PORTAL; // 📅 आज का रास्ता
    this.lb.daily = this.daily;
    this.world.setSeed(this.daily ? 'rr-' + istDay() : null);
    const gh = opts.ghost && opts.ghost.data ? decode(opts.ghost.data) : null; // 👻
    if (gh) { this.ghost.set(gh, opts.ghost.name); this.ghostOf = opts.ghost; } else { this.ghost.off(); this.ghostOf = null; }
    this.rec.start();
    $('#wardS').hidden = true; this.wardOpen = false; this.wearNow();
    $('#metaS').hidden = true; $('#dailyS').hidden = true; $('#profS').hidden = true; if (this.gshop.open) this.gshop.show(false);
    this.ms.startRun(); this.flyT = upTime('samosa');
    this.revived = false; this.runs++;
    this.mk = { st: 'off', t: 0, x: 0, y: 0, z: 4 }; this.monkey.visible = false; this.toMonkey = rand(700, 900);
    this.monkeyTree.visible = false; this.peels = []; this.samDrops.clear(); this.emoM.clear(); this.monkey.userData.snack.visible = false; this.jholaBack = 0; this.lungeT = 0; this.cineK = 0; this.cine = 0; this.slowTs = 0; this.holdJhola();
    this.dl.reset(); this.tricks.reset(); this.emo.clear(); this.trickHint = false; this.camKick = 0; this.darshan.reset(); this.pcPond = 0; this.pcPondDone = false; this.pcLook = 0; this.lookK = 0; this.dlK = 0; this.dlCam = null; this.runDeliv = 0;
    this.fest.start(); this.boat.visible = false; this.madK = 0;
    if (this.daily) setTimeout(() => { if (this.state === 'play') this.zoneBanner('📅', T('dailyOn')); }, 900);
    this.sound.init();
    if (!this.sound.playing) this.sound.startMusic();
    this.world.reset(!this.tutDone);
    this.p = { lane: 1, prevLane: 1, x: 0, tx: 0, vx: 0, y: 0, vy: 0, ground: true, roll: 0, rollQ: false, laneT: 9, big: false, stumT: 0, beesT: 0, invT: 0, slowT: 0, air: 0, fly: 0, boat: false, jbuf: 0, coy: 0, scooty: false, zip: false, zipK: 0 };
    this.pu = { magnet: 0, shoes: 0, shield: false, thali: 0, madhu: 0 };
    this.level = 0; this.samosa.visible = false; this.skyShow.reset();
    this.nightSaid = false; this.wild = 0; this.nfx.update(0, 0, 0, 0, this.world.chunks, this.cam.quaternion);
    this.rushT = 0; this.meter = 0;
    this.score = 0; this.got = 0; this.combo = 0; this.comboT = 0; this.timeScale = 1; this.slowmo = 0;
    this.speed = 14; this.runT = 0; this.perf = { t: 0, n: 0, sum: 0, done: SETTINGS.gfx !== 'auto', prev: 0, miss: 0, good: 0, moved: false };
    if (SETTINGS.gfx === 'auto' && this.renderer && this.renderer.shadowMap.enabled !== TIERS[this.tier].sh) this.setTier(this.tier); // पिछली दौड़ में बदला दर्जा — परछाईं अब (दौड़ शुरू होते ही)
    this.golu.root.rotation.y = 0;
    this.golu.setGlow(0);
    this.show(['#hud']);
    $('#hint').hidden = true;
    this.hud = {};
    this.state = 'play';
    this.cheer('go', 900, -1, true);
    this.clean = 0; this.sweetMark = 100;
    this.mult = this.ms.mult; this.rs = {}; this.hsT = 0;
    this.runGold = false; this.runMission = false; this.goldObj = null; if (this.goldMesh) this.goldMesh.visible = false;
    this.goldAt = this.rw && this.rw.goldWanted() ? rand(320, 620) : Infinity; // आज का सोनाक रसगुल्ला (एक दिन में एक बार)
    if (this.headstart) { // उड़न समोसे से शुरुआत
      this.headstart = false;
      if (buyHeadstart()) this.hsT = 0.8;
    }
    this.beat = null; $('#beat').hidden = true;
    this.mom.reset(); this.recordSaid = false;
    this.forceThief = false; this.story.begin(opts.story != null ? opts.story : null);
    P.gameplayStart();
  }

  pause(auto = false) {
    this.voice.stop();
    if (this.state !== 'play') return;
    if (!auto) P.gameplayStop(); // टैब बदलना पोर्टल ख़ुद संभालता है
    this.state = 'paused';
    this.show(['#pauseS', '#hud']);
    this.sound.bees(false);
    if (this.sound.ctx) this.sound.ctx.suspend();
  }
  resume() {
    if (this.state !== 'paused') return;
    if (this.sound.ctx) this.sound.ctx.resume();
    this.show(['#hud']);
    this.state = 'play';
    this.clock.getDelta();
    P.gameplayStart();
  }

  // ---------- विज्ञापन (सिर्फ़ पोर्टल पर) ----------
  // खेल ख़त्म होने के बाद "फेर खेलू"/"घर" पर — पोर्टल ख़ुद तय करता है कब (लगभग 3 मिनट में एक)
  afterAd(fn) {
    if (!P.ads || this.runT < 8) { fn(); return; }
    if (this.adBusy) return;
    this.adBusy = true;
    P.ad('midgame', () => { this.sound.setBlock('ad', true); this.voice.stop(); }).then(() => {
      this.sound.setBlock('ad', false); this.adBusy = false; fn();
    });
  }
  // मरने के बाद: एक बार "आगू खेलब?" — विज्ञापन देखकर या मिठाई देकर
  afterDeath() {
    const canAd = P.ads, canPay = wallet.v >= REVIVE_COST;
    if (this.revived || this.god || this.world.dist < 150 || (!canAd && !canPay)) { this.gameOver(); return; }
    this.state = 'revive';
    P.gameplayStop();
    this.show(['#reviveS', '#hud']);
    $('#revAd').hidden = !canAd;
    $('#revPay').hidden = !canPay;
    $('#revPay').innerHTML = `<i class="rg"></i> ${T('revPay', REVIVE_COST)}`;
    this.say(T('revT'), true);
    this.revCount(6);
  }
  revCount(n) {
    clearInterval(this.revTimer);
    const el = $('#revN'); el.textContent = n;
    el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
    this.revTimer = setInterval(() => {
      if (this.state !== 'revive') { clearInterval(this.revTimer); return; }
      n--; el.textContent = Math.max(0, n);
      el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
      if (n <= 0) { clearInterval(this.revTimer); this.gameOver(); }
    }, 1000);
  }
  reviveAd() {
    if (this.state !== 'revive' || this.adBusy) return;
    clearInterval(this.revTimer);
    this.adBusy = true;
    P.ad('rewarded', () => { this.sound.setBlock('ad', true); this.voice.stop(); }).then((ok) => {
      this.sound.setBlock('ad', false); this.adBusy = false;
      if (this.state !== 'revive') return;
      if (ok) { this.revive(); return; }
      this.toast(T('adNo'), 1400, 'warn');
      $('#revAd').hidden = true;
      if ($('#revPay').hidden) this.gameOver(); else this.revCount(5);
    });
  }
  revivePay() {
    if (this.state !== 'revive' || wallet.v < REVIVE_COST) return;
    clearInterval(this.revTimer);
    wallet.add(-REVIVE_COST);
    this.revive();
  }
  reviveNo() { if (this.state === 'revive') { clearInterval(this.revTimer); this.gameOver(); } }
  revive() {
    const p = this.p;
    this.revived = true;
    this.world.clearNear(-45, 25);
    p.y = this.world.groundAt(p.x, 0); p.vy = 0; p.ground = true; p.roll = 0; p.rollQ = false; p.fly = 0;
    p.beesT = 0; p.stumT = 0; p.slowT = 0; p.invT = 3;
    this.mk.st = 'off'; this.monkey.visible = false; this.toMonkey = Math.max(this.toMonkey, 400);
    this.emo.clear(); this.tricks.reset();
    this.sound.bees(false);
    this.state = 'play';
    this.show(['#hud']);
    this.clock.getDelta();
    this.cheer('revive', 1100, -1, true, 'gold');
    vibrate([30, 30, 30]);
    P.gameplayStart();
  }

  toast(txt, ms = 900, cls = '') {
    const t = $('#toast');
    t.textContent = txt;
    t.className = 'show ' + cls;
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { t.className = ''; }, ms);
  }

  // 📸 बेस्ट पल का कार्ड → WhatsApp स्टेटस (फ़ाइल शेयर), नहीं तो फ़ोन में सेव
  async shareShot() {
    const r = this.lastRun || {}, nm = this.lb && this.lb.name;
    const line = `${T('score')} ${(r.score || 0).toLocaleString('en-IN')} · ${(r.dist || 0).toLocaleString('en-IN')} ${T('distU')}${nm ? ' · ' + nm : ''}`;
    const blob = await this.mom.card({ line }); if (!blob) return;
    const file = new File([blob], 'rasgulla-run.jpg', { type: 'image/jpeg' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text: T('cardShare') }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'rasgulla-run.jpg'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    this.toast(T('cardSaved'), 1600, 'gold');
  }
  // 👻 चुनौती: इस दौड़ की परछाईं सर्वर पर → लिंक (?g=ID) WhatsApp पर. नाम न हो तो पहले नाम-ज़िला
  async shareGhost() {
    const r = this.lastRun;
    if (!r || !r.data || !this.lb.on) return false;
    if (!this.lb.name) { this.lb.askProfile(() => { if (this.lb.name) this.shareGhost(); }); return true; }
    const btn = $('#btnShare'); if (btn) btn.disabled = true;
    const id = r.id || await this.lb.putGhost(r);
    if (btn) btn.disabled = false;
    if (!id) return false;
    r.id = id;
    const url = GAME_URL + '?g=' + id, text = T('ghostShare', r.dist.toLocaleString('en-IN'), r.score.toLocaleString('en-IN'));
    if (navigator.share) { navigator.share({ title: T('title'), text, url }).catch(() => {}); return true; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
    return true;
  }
  share() {
    if (!LOCAL) return;
    if (this.state === 'over' && this.lastRun && this.lastRun.data && this.lb.on) { this.shareGhost().then((ok) => { if (!ok) this.shareText(); }); return; }
    this.shareText();
  }
  shareText() {
    const s = Math.floor(this.score).toLocaleString('en-IN');
    const text = T('shareText', s);
    if (navigator.share) { navigator.share({ title: T('title'), text, url: GAME_URL }).catch(() => {}); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + GAME_URL), '_blank', 'noopener');
  }

  // ------------------------------------------------ खेल की घटनाएँ
  collect(it) {
    const s = SWEETS[it.type];
    const mul = (this.pu.thali > 0 ? 2 : 1) * (this.pu.madhu > 0 ? 2 : 1);
    this.got += s.pts * mul;
    this.combo = this.comboT > 0 ? this.combo + 1 : 1;
    this.comboT = 1.1;
    if (this.rushT <= 0) this.meter = Math.min(1, this.meter + s.meter);
    this.score += s.pts * 10 * mul * (this.rushT > 0 ? 2 : 1) * this.mult;
    if (this.combo > 0 && this.combo % 15 === 0) this.cheer('combo', 1000, this.combo / 15 - 1);
    this.golu.eat();
    this.dl.onCollect(it.type);
    this.msBump('sweets', this.got, true);
    if (it.type === 'rasmalai') this.msBump('rasmalai');
    this.sound.collect(this.combo - 1, it.type);
    this.world.parts.burst(it.x, it.y, it.z, SW_COL[it.type], it.type === 'rasmalai' ? 18 : 6, 2.5, 2, 0.5);
    if (it.type === 'rasmalai') this.toast('+10 ' + (LANG === 'en' ? 'Rasmalai!' : 'रसमलाई!'), 700, 'gold');
    else if (it.type === 'milkcake') this.toast('+' + s.pts * mul + ' ' + SKY_NAME[LANG === 'en' ? 'en' : 'hi'][it.type] + '!', 600, 'gold');
  }

  takePu(p) {
    p.taken = true;
    if (p.kind === 'makhana') { this.got += 5; this.score += 50 * this.mult; this.world.parts.burst(p.x, p.y, p.z, 0xfaf6ea, 18, 3, 3, 0.7); this.sound.collect(3, 'rasgulla'); this.toast(T('makhanaT'), 700, 'gold'); this.msBump('sweets', this.got, true); return; }
    if (p.kind === 'madhubani') { this.mom.want(420, T('momMadhu'), 700); this.pu.madhu = 9; this.sound.power(); this.sound.levelUp(); vibrate([30, 40, 30]); this.cheer('madhubani', 1600, -1, true, 'gold'); this.msBump('power'); this.msBump('madhu'); this.camKick = 0.6; this.darshan.event('madhubani'); return; }
    if (p.kind === 'chakeva') { this.world.parts.burst(p.x, p.y, p.z, 0xfff4d6, 16, 3, 3, 0.7); this.world.parts.burst(p.x, p.y, p.z, 0xd1261c, 8, 3, 3, 0.7); this.fest.got(); return; }
    this.sound.power();
    vibrate(25);
    this.world.parts.burst(p.x, p.y, p.z, 0xffd24d, 22, 3.5, 3, 0.7);
    this.msBump('power');
    if (p.kind === 'samosa') { if (this.dl.active()) { this.got += 10; this.score += 100 * this.mult; this.floatText('+10 🥟', 'tp'); return; } this.startFly(); return; } // डिलीवरी में उड़ान नहीं
    if (p.kind === 'shield') this.pu.shield = true; else this.pu[p.kind] = upTime(p.kind);
    this.toast(T(p.kind), 900, 'gold');
  }

  // उड़न समोसा: 8 सेकंड आसमान में, ऊपर मिठाइयाँ; उतरते समय कवच
  startFly() {
    const p = this.p;
    p.fly = this.flyT; p.ground = false; p.vy = 0; p.roll = 0; p.rollQ = false; p.big = false;
    this.samosa.visible = true;
    this.sound.fly(true);
    vibrate([30, 40, 60]);
    this.cheer('fly', 1400, -1, true, 'rush');
    this.shake = 0.2;
    this.skyShow.start(FLY_Y, this.world.skyTrail(this.flyT, this.speed, FLY_Y, p.lane));
    this.mom.want(350, T('momFly'), 900);
    this.msBump('samosa');
  }
  endFly() {
    const p = this.p;
    p.fly = 0; p.vy = 2; p.invT = 2.2;
    this.sound.fly(false);
    this.skyShow.stop();
    this.world.clearNear(-34, 4);
    if (this.state === 'play') this.cheer('land', 900);
  }

  // शाबाशी: चुनी भाषा बड़ी + बोली; नीचे छोटी — हिंदी/मैथिली में English, English में मैथिली (मिथिला का स्वाद)
  cheer(kind = 'near', ms = 900, tier = -1, prio = false, cls = 'cheer', small = null) {
    const ln = pickCheer(kind, tier), [en, mai, hi] = ln;
    const big = LANG === 'en' ? en : LANG === 'hi' ? hi : mai;
    const t = $('#toast');
    const sm = small != null ? small : (LANG === 'en' ? mai : en);
    t.innerHTML = `${big}${sm ? `<small>${sm}</small>` : ''}`;
    t.className = 'show ' + cls;
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { t.className = ''; }, ms);
    this.sayPair(ln, prio || kind === 'level');
  }
  // [en, mai, hi] में से चुनी भाषा बोलो (मैथिली भी हिंदी आवाज़ से — फ़ोन में मैथिली आवाज़ नहीं होती); हिंदी आवाज़ न हो तो English
  sayPair(ln, prio = false) {
    if (!this.voice || !SETTINGS.voice) return;
    const [en, mai, hi] = ln;
    if (LANG !== 'en' && this.voice.canHi()) this.voice.say(LANG === 'hi' ? (hi || mai) : mai, 'hi', prio);
    else this.voice.say(en, 'en', prio);
  }
  // बोलो — चुनी भाषा में (हिंदी/मैथिली = हिंदी आवाज़)
  say(text, prio = false) { if (this.voice && SETTINGS.voice) this.voice.say(text, LANG === 'en' ? 'en' : 'hi', prio); }

  // मिशन — कुछ हुआ तो गिनो; पूरा हुआ तो खुशी
  msBump(id, v = 1, abs = false) {
    if (this.state !== 'play') return;
    if (!abs && this.rs) this.rs[id] = (this.rs[id] || 0) + v; // इस दौड़ के आँकड़े (बैज के लिए)
    for (const m of this.ms.bump(id, v, abs)) {
      this.runMission = true; // 🎫 आज का "मिशन" स्टैम्प
      setTimeout(() => {
        if (this.state !== 'play') return;
        this.cheer('mission', 1700, -1, true, 'gold', '🎯 ' + this.ms.text(m));
        this.sound.power(); vibrate(30);
      }, 250);
    }
  }

  // इलाक़ा / रात-भोर का बड़ा बैनर (लेवल वाले की जगह पर)
  zoneBanner(icon, text) {
    const el = $('#lvl');
    el.innerHTML = `<small>${icon}</small><b>${text}</b>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    this.sound.levelUp(); vibrate(30);
  }
  levelUp(n) {
    this.level = n;
    this.msBump('level', n + 1, true);
    this.say(`${T('level')} ${n + 1}, ${T('lv' + (n + 1))}`, true);
    const el = $('#lvl');
    el.innerHTML = `<small>${T('level')} ${n + 1}</small><b>${T('lv' + (n + 1))}</b>`;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    this.sound.levelUp();
    vibrate(40);
    setTimeout(() => { if (this.state === 'play') this.cheer('level', 1000); }, 1300);
  }

  startRush() {
    if (this.state !== 'play' || this.meter < 1 || this.rushT > 0) return;
    this.rushT = 6;
    this.meter = 1;
    this.msBump('rush');
    this.sound.rush();
    vibrate(60);
    this.cheer('rush', 1200, -1, true, 'rush');
    this.shake = 0.25;
  }

  stumble() {
    const p = this.p;
    vibrate(45);
    this.sound.bump();
    this.shake = Math.max(this.shake, 0.3);
    this.meter = Math.max(0, this.meter - 0.25);
    p.stumT = 0.55;
    this.emo.play('dizzy', 0.9); this.tricks.reset();
    if (p.beesT > 0) { this.die('caught'); return; }
    p.beesT = lerp(6, 9, this.world.diff); // आगे चलकर मधुमक्खियाँ ज़्यादा देर
    this.sound.bees(true);
    this.clean = 0;
    this.cheer('bees', 1300, -1, true, 'warn');
  }

  // ---------- बंदर ----------
  // पेड़ की डाल पर बैठा बंदर ताकता → पास आते ही धीमी गति में झपट्टा (नीचे खिसकाकर झुको = बच गए) →
  // झोला छीनकर आगे सड़क पर भागे, समोसे गिराता → उसकी लेन में रहकर पकड़ो = झोला वापस; 15 सेकंड में न पकड़ा तो पेड़ पर बैठकर समोसा खाए
  holdJhola(par) {
    const J = this.jhola, g = this.golu;
    if (!par) { if (!g || !g.handR) return; par = g.handR; J.position.set(0, 0, 0); } else J.position.set(0, -0.56, 0.04);
    par.add(J); J.visible = true;
  }
  fixJhola(dt) {
    const J = this.jhola; if (!J.parent) return;
    const onGolu = this.golu && J.parent === this.golu.handR, p = this.p;
    if (onGolu) J.visible = !(p && (p.boat || p.fly > 0 || p.zip || p.scooty)) && this.jholaBack <= 0 && !(this.dl.holding && this.dl.holding());
    if (!J.visible) return;
    const q = this._jq || (this._jq = new THREE.Quaternion()), v = this._jv || (this._jv = new THREE.Vector3()), e = this._je || (this._je = new THREE.Euler()), q2 = this._jq2 || (this._jq2 = new THREE.Quaternion());
    J.parent.updateWorldMatrix(true, false); J.parent.getWorldQuaternion(q); J.parent.getWorldScale(v);
    const ph = onGolu ? this.golu.phase : (this.mk.t || 0) * 9;
    q2.setFromEuler(e.set(Math.sin(ph) * 0.28, onGolu ? 0 : Math.PI, Math.cos(ph * 0.5) * 0.12));
    J.quaternion.copy(q.invert()).multiply(q2); J.scale.set(1 / Math.abs(v.x), 1 / Math.abs(v.y), 1 / Math.abs(v.z));
  }
  monkeyStart() {
    const side = Math.random() < 0.5 ? -1 : 1, Tr = this.monkeyTree, v = this._mv || (this._mv = new THREE.Vector3());
    placeTree(Tr, side, -50); branchPos(Tr, v);
    this.mk = { st: 'perch', t: 0, side, x: v.x, y: v.y, z: v.z, force: this.forceThief, said: false };
    this.forceThief = false;
    const M = this.monkey; M.visible = true; M.userData.bag.visible = false; M.userData.snack.visible = false; M.rotation.set(0, 0, 0);
    this.toMonkey = rand(1000, 1500);
  }
  // झपट्टा पूरा — झोला बंदर के हाथ में
  monkeySnatch() {
    const m = this.mk, n = Math.min(Math.floor(this.got / 3), 150);
    this.got -= n; m.loot = n;
    this.holdJhola(this.monkey.userData.armL);
    for (let i = 0; i < 3; i++) this.world.parts.burst(this.p.x + 0.3, this.p.y + 1.1, 0.3, [0xffffff, 0xc98a3c, 0xf2b84b][i], 10, 4, 3, 0.7, 0);
    this.sound.monkey(true); this.sound.bump(); vibrate([30, 20, 50]); this.shake = Math.max(this.shake, 0.25);
    this.emo.play('angry', 1.8);
    { const F = this.monkeyTree.userData.fam; if (F) { F.mood = 'cheer'; F.t = 3.5; } } // परिवार ताली बजाकर चिढ़ाए
    this.slowmo = Math.min(this.slowmo, 0.5);
    this.mom.want(420, T('momSnatch'), 30);
    setTimeout(() => { if (this.state === 'play') this.cheer('monkeyGrab', 1600, -1, true, 'warn', n > 0 ? `−${n} 🍬` : null); }, 250);
    this.thiefStart(n, m.z, m);
  }
  // झुक गए — बंदर ऊपर से निकल गया
  monkeyMiss() {
    const m = this.mk;
    m.st = 'miss'; m.t = 0; m.fx = m.x; m.fy = m.y; m.fz = m.z;
    this.got += 25; this.score += 250 * this.mult; this.msBump('monkeyEsc');
    this.cheer('monkeyGone', 1600, -1, true, 'gold', '+25 🍬'); this.sound.monkey(); this.emo.play('cool', 1);
    this.slowmo = Math.min(this.slowmo, 0.25); this.mom.want(380, T('momDodge'), 60);
  }
  // 🐒 चोर बंदर: झोला लेकर आगे सड़क पर; उसी लेन में रहो तो दूरी घटे; पास पहुँचे = पकड़ा
  thiefStart(loot, z0, from = null) {
    const side = from && from.side ? from.side : Math.random() < 0.5 ? -1 : 1, lane = randi(0, 2), M = this.monkey;
    this.mk = { st: 'thiefIn', t: 0, side, lane, loot, bonus: loot > 0 ? 25 : 40, gap: 10, T: 16, lt: rand(1.2, 1.8), drop: 0.7, dropN: Math.min(6, Math.max(3, Math.floor(loot / 5))), vy: 0, peelT: rand(1.1, 1.5), peelN: 0, wind: 0,
      x0: from ? from.x : side * 6.8, y0: from ? from.y : 5.2, z0, x: from ? from.x : side * 6.8, y: from ? from.y : 5.2, z: z0 };
    M.visible = true; M.userData.bag.visible = false;
    if (this.jhola.parent !== M.userData.armL) this.holdJhola(M.userData.armL);
    setTimeout(() => { if (this.state === 'play') this.cheer('thief', 2000, -1, true, 'warn', T('thiefHow')); }, 900);
  }
  thiefCaught() {
    const m = this.mk, rw = m.loot + m.bonus;
    m.st = 'caught'; m.t = 0; m.cx = m.x; m.cz = m.z;
    this.holdJhola(); // झोला वापस गोलू के हाथ
    this.got += rw; this.score += 500 * this.mult;
    this.msBump('monkeyCatch'); this.msBump('sweets', this.got, true);
    this.cheer('monkeyCaught', 1700, -1, true, 'gold', `+${rw} 🍬`);
    this.sound.ring(); this.sound.power(); vibrate([30, 30, 60]);
    this.emo.play('cool', 1); this.emoM.play('dizzy', 1.0); this.camKick = 0.5; this.mom.want(600, T('momMonkey'), 120);
    { const F = this.monkeyTree.userData.fam; if (F) { F.mood = 'shy'; F.t = 3; } }
    this.lungeT = 0.5; this.slowmo = 0.75; this.slowTs = 0.3; this.cine = 0.9; this.cineSide = m.side;
    for (const c of [0xffffff, 0xc98a3c, 0xf2b84b, 0xffd24d]) this.world.parts.burst(m.x, 1.2, m.z, c, 10, 4, 4, 0.8);
  }
  updateThief(dt, m, M, p) {
    if (m.st === 'thiefIn') { // झोला लेकर आगे सड़क पर कूदा
      const k = Math.min(1, m.t / 0.8), e = k * k * (3 - 2 * k);
      m.x = lerp(m.x0, LANES[m.lane], e); m.z = lerp(m.z0, -m.gap, e); m.y = lerp(m.y0, 0, e) + Math.sin(k * Math.PI) * 2.2;
      animMonkey(M, dt, 'leap'); M.rotation.y = lerp(0, Math.PI, e); M.rotation.z = 0;
      if (k >= 1) { m.st = 'thief'; m.t = 0; }
      return;
    }
    if (m.st === 'caught') { // लुढ़ककर किनारे बैठ गया, सिर पर तारे
      const k = Math.min(1, m.t / 0.9);
      if (k < 1) { m.x = lerp(m.cx, (m.side || 1) * 3.7, k); m.z = lerp(m.cz, -15, k); m.y = Math.abs(Math.sin(k * Math.PI * 2)) * 0.9 * (1 - k); } // आगे किनारे लुढ़का
      else m.z += this.lastDz || 0;
      M.rotation.z = k < 0.7 ? k * 9 : 0; M.rotation.y = k < 1 ? Math.PI : -(m.side || 1) * 0.55;
      // लुढ़का → 🙏 हाथ जोड़कर माफ़ी → गोलू ने एक समोसा दिया, ख़ुश होकर खाए
      if (k < 1) animMonkey(M, dt, k < 0.7 ? 'leap' : 'sit');
      else if (m.t < 1.55) { animMonkey(M, dt, 'namaste'); if (!m.sorry) { m.sorry = true; this.floatText(T('monkeySorry'), 'tp'); this.sound.monkey(); this.emoM.clear(); } }
      else { animMonkey(M, dt, 'sit'); const u = M.userData; u.snack.visible = true; u.armR.rotation.x = -2.3 + Math.abs(Math.sin(m.t * 5)) * 0.5; u.head.rotation.x = 0.15 * Math.sin(m.t * 10); if (!m.gift) { m.gift = true; this.emoM.play('love', 1.6); } }
      if (m.z > 7) { m.st = 'off'; M.visible = false; M.rotation.z = 0; this.emoM.clear(); }
      return;
    }
    // 'thief' — आगे भागता
    m.T -= dt; m.lt -= dt;
    if (m.lt <= 0) { m.lane = m.lane === 1 ? pick([0, 2]) : Math.random() < 0.7 ? 1 : 2 - m.lane; m.lt = rand(1.1, 2.0); if (m.y < 0.1) m.vy = 4.5; }
    m.x = damp(m.x, LANES[m.lane], 7, dt);
    // सामने रुकावट हो तो उछलकर पार
    const near = this.world.obs.some((e) => !e.dead && Math.abs(e.x - m.x) < e.halfW + 0.4 && e.z > m.z - 2.2 && e.z < m.z + 0.6);
    const fl = this.world.groundAt(m.x, m.z);
    if (near && m.y <= fl + 0.05) m.vy = 9;
    m.vy -= 26 * dt; m.y = Math.max(fl, m.y + m.vy * dt); if (m.y <= fl) m.vy = 0;
    // पीछा: उसी लेन में रहो तो दूरी घटे (~4–5 सेकंड), दूसरी लेन में रहो तो बंदर दूर भागे; 18.5 मी. = छूट गया
    const same = Math.abs(p.x - m.x) < 1.25;
    let rate = this.rushT > 0 ? 6 : same ? 1.9 : -0.9;
    if (p.stumT > 0) rate = -2.5; else if (p.slowT > 0) rate = Math.min(rate, 0.6);
    m.gap = clamp(m.gap - rate * dt, 1.2, 19); m.z = -m.gap;
    if (this.mkRing) { const R = this.mkRing; R.visible = true; R.position.set(m.x, 0.05, m.z); R.scale.setScalar(1 + Math.sin(m.t * 9) * 0.12); R.material.opacity = 0.55 + Math.sin(m.t * 9) * 0.25; }
    if (m.dropN > 0 && (m.drop -= dt) <= 0) { m.dropN--; m.drop = 0.8; this.samDrops.drop(m.x, m.y + 0.9, m.z + 0.6); } // झोले से गिरे समोसे — उठाओ
    // 🍌 केले का छिलका: मुड़कर हाथ उठाए (चेतावनी), सिर के ऊपर से आगे उछाले — सड़क पर गिरकर गोलू की ओर आए; बंदर ख़ुद कूदकर पार, गोलू भी कूदे
    m.peelT -= dt;
    if (m.peelT <= 0 && !m.wind && m.peelN < 3 && m.gap > 3 && m.y <= fl + 0.05 && this.rushT <= 0) { m.wind = 0.42; this.sound.monkey(true); }
    if (m.wind > 0) {
      m.wind -= dt; M.userData.thr = 1 - m.wind / 0.42;
      if (m.wind <= 0) { m.wind = 0; m.peelN++; m.peelT = rand(1.8, 2.6); const FT = 0.45, e = this.world.addObs('kela', m.lane, m.z - 4 - this.speed * FT); this.peels.push({ e, t: 0, ft: FT, x0: m.x, y0: m.y + 1.3 }); e.obj.position.y = m.y + 1.3; }
    }
    const tz = !m.wind && (m.t % 2.6) > 2.0 && m.t > 1.2; // हर 2.6 सेकंड: पीछे मुड़कर चिढ़ाए
    animMonkey(M, dt, m.wind > 0 ? 'throw' : m.y > fl + 0.2 ? 'leap' : tz ? 'tease' : 'run', this.speed); M.rotation.z = 0;
    M.rotation.y = damp(M.rotation.y, tz || m.wind > 0 ? 0.35 * (m.side || 1) : Math.PI + Math.sin(m.t * 5) * 0.08, 10, dt);
    if (tz && !m.tz) this.sound.monkey(true); m.tz = tz;
    if (m.gap <= 1.7 && same && p.y < 2.6 && p.fly <= 0) { this.thiefCaught(); return; }
    if (m.T <= 0 || p.fly > 0 || m.gap >= 18.5) { // छूट गया — आगे के पेड़ पर चढ़कर समोसा खाएगा
      const Tr = this.monkeyTree, v = this._mv || (this._mv = new THREE.Vector3());
      placeTree(Tr, m.side, m.z - 58); branchPos(Tr, v);
      m.st = 'escape'; m.t = 0; m.fx = m.x; m.fy = m.y; m.fz = m.z;
      this.cheer('monkeyAway', 1500, -1, true, 'warn', m.loot > 0 ? `−${m.loot} 🍬` : null);
      this.sound.monkey(true); this.emo.play('sweat', 1.6); this.jholaBack = 3;
    }
  }
  updateMonkey(dt) {
    const m = this.mk, M = this.monkey, p = this.p || { x: 0, y: 0 }, Tr = this.monkeyTree, dz = this.state === 'play' ? this.lastDz || 0 : 0;
    if (Tr.visible) { Tr.position.z += dz; if (Tr.position.z > 14) Tr.visible = false; }
    { const F = Tr.userData.fam; if (F && Tr.visible) { F.t -= dt; const md = F.t > 0 ? F.mood : 'sit'; animMonkey(F.mom, dt, md === 'cheer' ? 'tease' : md === 'shy' ? 'namaste' : 'sit'); animMonkey(F.baby, dt * 1.4, md === 'cheer' ? 'tease' : 'sit'); F.baby.position.y = 2.7 + (md === 'cheer' ? Math.abs(Math.sin(F.t * 9)) * 0.18 : 0); } }
    for (let i = (this.peels || []).length - 1; i >= 0; i--) { // उड़ता छिलका: बंदर के हाथ से सड़क पर
      const q = this.peels[i]; q.t += dt; const k = Math.min(1, q.t / (q.ft || 0.3)), e = q.e;
      if (e.dead || !e.obj.visible) { this.peels.splice(i, 1); continue; }
      e.obj.position.y = lerp(q.y0, 0, k) + Math.sin(k * Math.PI) * 1.7; e.obj.rotation.y = q.t * 9; e.obj.position.x = lerp(q.x0, e.x, k); e.obj.position.z = lerp(m.z || 0, e.z, k); // हाथ से उछलकर आगे गिरे
      if (k >= 1) { e.obj.position.y = 0; this.peels.splice(i, 1); }
    }
    if (this.state === 'play') { const n = this.samDrops.update(dt, dz, p.x, p.y); if (n) { this.got += 3 * n; this.score += 30 * n * this.mult; this.sound.collect(2, 'rasgulla'); this.floatText(`+${3 * n} 🥟`, 'tp'); } }
    if (this.jholaBack > 0) { this.jholaBack -= dt; if (this.jholaBack <= 0 && this.mk.st === 'off') this.holdJhola(); }
    this.fixJhola(dt);
    if (m.st === 'off') { M.visible = false; return; }
    m.t += dt;
    const th = m.st === 'thief' || m.st === 'thiefIn' || m.st === 'caught';
    M.scale.setScalar(damp(M.scale.x, th || m.st === 'perch' || m.st === 'escape' ? 1.4 : 1.15, 6, dt)); // चोर बंदर आगे दूर — थोड़ा बड़ा, साफ़ दिखे
    this.emoM.update(dt, m.x, m.y + 1.95 * M.scale.x, m.z, M.scale.x);
    if (this.mkRing && !(m.st === 'thief' && this.state === 'play')) this.mkRing.visible = false;
    if (th && this.state === 'play') { this.updateThief(dt, m, M, p); M.position.set(m.x, m.y, m.z); return; }
    const sp = this.speed || 16, v = this._mv || (this._mv = new THREE.Vector3());
    if (this.state === 'dying' || this.state === 'over' || this.state === 'revive') { // गोलू गिरा — बंदर बैठकर हँसे
      m.x = damp(m.x, p.x + 1.1, 5, dt); m.z = damp(m.z, 1.6, 5, dt); m.y = damp(m.y, 0, 8, dt);
      animMonkey(M, dt, 'sit'); M.rotation.set(0, -0.6, 0);
    } else if (m.st === 'perch') { // डाल पर बैठा ताक रहा
      branchPos(Tr, v); m.x = v.x; m.y = v.y - 0.05; m.z = v.z;
      animMonkey(M, dt, m.z > -24 ? 'grab' : m.z > -40 ? 'tease' : 'sit'); M.rotation.y = -(m.side || 1) * 0.5; // पास आते ही चिढ़ाए, फिर झपटने को तैयार
      if (m.z > -36 && !m.said) { m.said = true; this.sound.monkey(); this.emo.play('wow', 1.0); this.emoM.play('wow', 1.8); this.cheer('monkey', 1500, -1, true, 'warn'); }
      if (m.z > -10.5) { m.st = 'leap'; m.t = 0; m.sx = m.x; m.sy = m.y; m.sz = m.z; this.sound.monkey(true); }
    } else if (m.st === 'leap') { // धीमी गति में झपट्टा — गोलू के झोले वाले हाथ पर
      const k = Math.min(1, m.t / 0.62);
      const tx = p.x + 0.35, ty = (p.y || 0) + 1.0, tz = 0.3;
      m.x = lerp(m.sx, tx, k); m.z = lerp(m.sz, tz, k); m.y = lerp(m.sy, ty, k) + Math.sin(k * Math.PI) * 1.2;
      animMonkey(M, dt, k > 0.75 ? 'grab' : 'leap'); M.rotation.set(0, 0, 0);
      if (k > 0.22 && !m.slow) {
        m.slow = true; this.slowmo = 2.4; this.slowTs = 0.2; this.cine = 1.2; this.cineSide = m.side;
      }
      if (k >= 1) this.monkeySnatch(); // 19 नवंबर (मालिक): बंदर हर बार झोला छीने और भागे — झुककर बचना नहीं, असली पीछा-पकड़ना
    } else if (m.st === 'miss') { // ऊपर से निकलकर पीछे गिरा
      const k = Math.min(1, m.t / 0.8);
      m.x = m.fx; m.z = lerp(m.fz, 5, k); m.y = Math.max(0, lerp(m.fy, 0, k) + Math.sin(k * Math.PI) * 0.6);
      animMonkey(M, dt, 'leap'); M.rotation.set(-k * 5, 0, 0);
      if (k >= 1) { m.st = 'off'; M.visible = false; M.rotation.set(0, 0, 0); }
    } else if (m.st === 'escape') { // झोला लेकर आगे के पेड़ पर — बैठकर समोसा खाए
      branchPos(Tr, v);
      const k = Math.min(1, m.t / 1.6), e = k * k * (3 - 2 * k);
      m.x = lerp(m.fx, v.x, e); m.z = lerp(m.fz, v.z, e) + (k >= 1 ? 0 : 0); m.y = lerp(m.fy, v.y - 0.05, e) + Math.sin(k * Math.PI) * 1.4;
      if (k >= 1) { m.z = v.z; }
      M.userData.snack.visible = k >= 1;
      if (k < 1) { animMonkey(M, dt, k < 0.6 ? 'run' : 'leap', sp); M.rotation.set(0, Math.PI + (m.side || 1) * 0.6, 0); }
      else { animMonkey(M, dt, 'sit'); const u = M.userData; u.armR.rotation.x = -2.3 + Math.abs(Math.sin(m.t * 5)) * 0.5; u.head.rotation.x = 0.15 * Math.sin(m.t * 10); M.rotation.set(0, -(m.side || 1) * 0.6, 0); }
      if (!Tr.visible || m.z > 10) { m.st = 'off'; M.visible = false; M.userData.snack.visible = false; this.holdJhola(); this.jholaBack = Math.max(this.jholaBack, 0.6); }
    }
    M.position.set(m.x, m.y, m.z);
  }

  smash(e) {
    e.dead = true;
    e.flyX = (e.x >= this.p.x ? 1 : -1) * rand(5, 9);
    this.world.parts.burst(e.x, 1.2, e.z, 0xf5c542, 16, 6, 4, 0.8, -14);
    this.world.parts.burst(e.x, 1.2, e.z, 0xd1261c, 10, 5, 3, 0.7, -14);
    this.sound.smash();
    this.shake = Math.max(this.shake, 0.35);
  }

  hit(e, side) {
    const p = this.p;
    if (this.god) return;
    this.killer = e.type;
    if (this.rushT > 0) { this.smash(e); this.score += 50 * this.mult; if (e.type === 'chugla') this.fest.burned(e); return; }
    if (p.invT > 0) return;
    if (e.type === 'kela' && !p.scooty) { // 🍌 फिसले — धीमे हुए (बंदर दूर भागा), मधुमक्खी/मौत नहीं
      e.dead = true; e.flyX = rand(-4, 4); p.stumT = 0.6; p.invT = 0.5; this.shake = Math.max(this.shake, 0.25);
      if (this.sound.slip) this.sound.slip(); vibrate(40); this.emo.play('dizzy', 0.8); this.tricks.reset(); this.floatText(T('kelaSlip'), 'warn');
      return;
    }
    if (p.scooty) { this.dl.bump(e); if (e.kind === 'trip' || e.kind === 'low') { e.dead = true; e.flyX = rand(-3, 3); } return; } // स्कूटी पर: डिब्बा हिला, गिरना नहीं
    if (e.kind === 'trip') {
      e.dead = true; e.flyX = rand(-3, 3);
      this.world.parts.burst(e.x, 0.3, e.z, 0xc4643f, 12, 3, 2, 0.6);
      this.stumble();
      return;
    }
    if (side) {
      p.lane = p.prevLane; p.tx = LANES[p.lane]; p.laneT = 9;
      this.stumble();
      return;
    }
    if (this.pu.shield) {
      this.pu.shield = false;
      p.invT = 1.2;
      this.sound.shieldBreak();
      this.smash(e);
      this.cheer('shield', 1200, -1, true, 'gold');
      return;
    }
    this.die('crash');
  }

  die(cause) {
    this.state = 'dying';
    this.cause = cause;
    this.deathT = 0;
    this.sound.crash();
    vibrate([80, 40, 120]);
    this.shake = 0.6;
    this.p.roll = 0;
    this.tricks.reset(); this.emo.clear(); this.emo.play('dizzy', 30);
    if (this.p.fly > 0) { this.p.fly = 0; this.sound.fly(false); this.skyShow.stop(); }
  }

  gameOver() {
    this.state = 'over';
    clearInterval(this.revTimer);
    P.gameplayStop();
    this.sound.bees(false);
    const sc = Math.floor(this.score);
    const nb = sc > this.best;
    if (nb && this.best > 0) P.happytime(); // पुराना रिकॉर्ड टूटा — पोर्टल पर जश्न
    if (nb) { this.best = sc; store('best', sc); }
    this.total += this.got;
    store('total', this.total);
    wallet.add(this.got);
    const ms = this.ms.settle();
    const rs = this.rs || {};
    stats.merge({ runs: 1, dist: Math.floor(this.world.dist), bestDist: Math.floor(this.world.dist), sweets: this.got, bestScore: sc,
      roof: Math.floor(rs.roof || 0), haat: rs.haat || 0, samosa: rs.samosa || 0, near: rs.near || 0, monkeyEsc: rs.monkeyEsc || 0, rings: rs.rings || 0, jungle: Math.floor(rs.jungle || 0), deliv: rs.deliver || 0, tricks: rs.tricks || 0, sama: rs.sama || 0, monkeyCatch: rs.monkeyCatch || 0, pond: Math.floor(rs.pond || 0), madhu: rs.madhu || 0 });
    const bd = checkBadges();
    const parts = [];
    if (ms.setDone) parts.push(`🎉 ${T('msSet')} ${ms.setDone.set} ✔ → ×${this.ms.mult}`);
    if (ms.gain) parts.push(T('msGain', ms.gain));
    for (const b of bd) parts.push(`${b.icon} ${T('badgeNew')} ${L(b)} (+100)`);
    { const sl = this.story.overLine(); if (sl) parts.push(sl); }
    if (this.ghost.on) { const my = Math.floor(this.world.dist), gd = Math.floor(this.ghost.endDist); parts.push(my >= gd ? T('ghostWin', this.ghost.name, my - gd) : T('ghostLose', this.ghost.name, gd - my)); }
    $('#overMs').hidden = !parts.length;
    $('#overMs').innerHTML = parts.join('<br>');
    if (ms.setDone && ms.setDone.item) setTimeout(() => { if (this.state === 'over') this.meta.showUnlocks([ms.setDone.item]); }, 1100);
    store('plays', storeNum('plays') + 1);
    countGame();
    $('#overTitle').textContent = this.cause === 'caught' ? T('caught') : T('crashed');
    $('#overScore').textContent = sc.toLocaleString('en-IN');
    $('#overSweets').textContent = this.got.toLocaleString('en-IN');
    $('#overBest').textContent = Math.floor(this.best).toLocaleString('en-IN');
    $('#newBest').hidden = !nb;
    const ln = pickCheer(nb ? 'newBest' : 'over');
    setTimeout(() => { if (this.state === 'over') this.sayPair(ln, true); }, 500);
    $('#overLb').hidden = true; $('#overRw').hidden = true; this.dl.hide();
    { const op = $('#overPc'), hs = this.darshan.overHtml(); op.hidden = !hs; op.innerHTML = hs; } // 📮 इस दौड़ के नए पोस्टकार्ड — पूरा कार्ड यहीं
    { const ob = $('#overRg'), lf = this.rg ? this.rg.left() : 0; ob.hidden = !(this.runDeliv > 0 && lf > 0 && store('freshStock') !== '1'); if (!ob.hidden) $('#overRgSub').textContent = T('rgInviteSub', lf); } // डिलीवरी के बाद: ताज़ा रसगुल्ले बनाओ → अगली डिलीवरी डबल
    { const sh = $('#overShot'), th = LOCAL && this.mom.best ? this.mom.thumb() : null; sh.hidden = !th; if (th) { sh.querySelector('img').src = th; sh.querySelector('span').textContent = this.mom.best.label; } }
    this.rate.maybeAsk();
    if (this.goldMesh) this.goldMesh.visible = false; this.goldObj = null;
    this.show(['#over']);
    this.lb.afterGame(sc, this.world.dist, this.runT, this.mult);
    this.lastRun = { score: sc, dist: Math.floor(this.world.dist), secs: +this.runT.toFixed(1), data: this.rec.n > 10 ? this.rec.encode() : '', daily: this.daily };
    // 📅 आज के रास्ते की अपनी सबसे अच्छी दौड़ — परछाईं सर्वर पर (आज का टॉपर उसी से)
    if (this.daily && this.lastRun.data && this.lb.name) {
      let best = {}; try { best = JSON.parse(store('dayBest') || '{}'); } catch (e) { /* */ }
      if (best.day !== istDay() || sc > best.score) { store('dayBest', JSON.stringify({ day: istDay(), score: sc })); this.lb.putGhost({ ...this.lastRun, daily: 1 }); }
    }
    if (this.rw) this.rw.afterGame({ gold: this.runGold, mission: this.runMission, distM: this.world.dist, score: sc, secs: this.runT, mult: this.mult });
  }

  // ✨ सोनाक रसगुल्ला — दिन में एक बार, पकड़ने पर दुकान वाले कार्ड पर 1 स्टैम्प (दौड़ ख़त्म होने पर सर्वर को)
  makeGold() {
    const grp = new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 28, 18), new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xb07800, emissiveIntensity: 0.7, metalness: 0.8, roughness: 0.22 })));
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,232,150,0.95)'); gr.addColorStop(1, 'rgba(255,200,60,0)');
    x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.set(2.0, 2.0, 1); grp.add(sp);
    grp.visible = false; this.scene.add(grp);
    return grp;
  }
  updateGold(dz) {
    if (!this.rw || !this.rw.on || this.state !== 'play') return;
    const p = this.p;
    if (!this.goldObj && !this.runGold && this.world.dist >= this.goldAt && p.fly <= 0) {
      this.goldObj = { x: LANES[Math.floor(Math.random() * 3)], z: -75 };
      if (!this.goldMesh) this.goldMesh = this.makeGold();
      this.goldMesh.visible = true;
    }
    const g = this.goldObj; if (!g) return;
    g.z += dz;
    const t = performance.now() / 1000, gy = this.world.groundAt(g.x, g.z) + 0.85;
    this.goldMesh.position.set(g.x, gy + Math.sin(t * 3) * 0.12, g.z);
    this.goldMesh.rotation.y = t * 2.5;
    const ph = p.roll > 0 ? H_ROLL : H_STAND;
    if (Math.abs(g.x - p.x) < 0.95 && Math.abs(g.z) < 0.95 && gy > p.y - 0.4 && gy < p.y + ph + 0.4) {
      this.runGold = true; this.goldObj = null; this.goldMesh.visible = false;
      this.world.parts.burst(g.x, gy, 0, 0xffd24d, 28, 3.5, 3, 0.8);
      this.sound.power(); vibrate(40);
      this.toast(T('rwGoldT'), 1600, 'gold');
    } else if (g.z > 3) { // छूट गया — थोड़ी देर बाद फिर
      this.goldObj = null; this.goldMesh.visible = false; this.goldAt = this.world.dist + rand(300, 520);
    }
  }

  // ------------------------------------------------ हर फ़्रेम
  frame() {
    requestAnimationFrame(() => this.frame());
    const d0 = this.clock.getDelta(); this.rawDt = d0; const raw = Math.min(d0, 1 / 20); // 🎞️ फ़्रेम का समय बराबर: 120/144Hz फ़ोन पर 7–8 ms का उछलता अंतर चाल में झटका न दे; असली रुकावट (बड़ा अंतर) तुरंत माने
    this.sdt = this.sdt && Math.abs(raw - this.sdt) < this.sdt * 0.5 ? this.sdt + (raw - this.sdt) * 0.2 : raw;
    const rdt = this.sdt;
    if (this.rg && this.rg.on && this.state === 'menu') return; // 🍮 रसगुल्ला वाला खेल खुला — पीछे 3D नहीं बनाना (फ़ोन हल्का)
    try { this.update(rdt); } catch (e) { logErr(e, 'update ' + this.state + (this.dl ? ' dl=' + this.dl.st : '') + (this.mk ? ' mk=' + this.mk.st : '')); } // 🐞 गलती डायरी में, फ़्रेम फिर भी बने
    this.sky.position.copy(this.cam.position);
    this.sky.material.uniforms.uTime.value += rdt;
    if (this.wx) { this.wx.update(rdt, this.state === 'play' ? (this.lastDz || 0) : 0, this); if (this.baseExp) this.renderer.toneMappingExposure = this.baseExp * (1 + this.wx.flash * 0.9); }
    const mk = this.pu && this.state !== 'menu' && this.pu.madhu > 0 ? 1 : 0;
    this.madK = damp(this.madK || 0, mk, mk ? 5 : 3, rdt);
    if (this.madK > 0.01) this.mfx.render(this.scene, this.cam, this.madK, this.tier >= 2 ? 0.7 : 1);
    else this.renderer.render(this.scene, this.cam);
    if (this.state === 'play' && this.mom) this.mom.afterRender(this.renderer.domElement);
    if (this.state === 'play' && this.darshan && this.darshan.afterRender(this.renderer.domElement)) { // पोस्टकार्ड की तस्वीर अलग कैमरे से खिंची — असली फ़्रेम फिर से
      if (this.madK > 0.01) this.mfx.render(this.scene, this.cam, this.madK, this.tier >= 2 ? 0.7 : 1); else this.renderer.render(this.scene, this.cam);
    }
    const fr = this.madK > 0.3; if (fr !== this.frOn) { this.frOn = fr; this.mfx.showFrame(fr); }
  }

  // शाम/रात — आसमान, धूप, कोहरा, चमक
  applyTod(eve, night) {
    const wk = this.wx ? this.wx.active : 'clear';
    if (this.tod && this.tod.wk === wk && Math.abs(this.tod.eve - eve) < 0.004 && Math.abs(this.tod.night - night) < 0.004) return;
    this.tod = { eve, night, wk };
    const u = this.sky.material.uniforms; u.uEve.value = eve; u.uNight.value = night;
    tri(TOD.hor, eve, night, this.scene.fog.color);
    tri(TOD.sun, eve, night, this.sun.color); this.sun.intensity = trin(TOD.sunI, eve, night);
    tri(TOD.sky, eve, night, this.hemi.color); tri(TOD.gnd, eve, night, this.hemi.groundColor); this.hemi.intensity = trin(TOD.hemiI, eve, night);
    this.renderer.toneMappingExposure = trin(TOD.exp, eve, night);
    const fb = this.fogBase || [70, 155];
    this.scene.fog.near = fb[0]; this.scene.fog.far = fb[1]; // रात में भी उतनी ही दूर तक साफ़
    if (this.lamp) this.lamp.intensity = 34 * night;
    this.scene.environment = this.envs[night > 0.5 ? 2 : eve > 0.5 ? 1 : 0];
    this.world.sweets.setTint(1 - 0.12 * eve * (1 - night) - 0.15 * night);
    // 🌧️ मौसम: धूप/रोशनी/कोहरा/गीली सड़क
    const m = this.wx && this.wx.mods();
    if (m) {
      this.sun.intensity *= m.sun; this.hemi.intensity *= m.hemi; this.renderer.toneMappingExposure *= m.exp;
      this.scene.fog.far = fb[1] * m.fogFar; if (m.fogNear) this.scene.fog.near = fb[0] * m.fogNear;
      if (wk === 'fog') this.scene.fog.color.lerp(new THREE.Color(0xdfe3e6), 0.55 * (1 - night));
      if (m.tint) this.scene.fog.color.lerp(new THREE.Color(m.tint), 0.45 * (1 - night));
    }
    if (this.world.roadMat) this.world.roadMat.roughness = m ? m.rough : 0.93;
    this.baseExp = this.renderer.toneMappingExposure;
  }

  update(rdt) {
    const g = this.golu;
    if (this.state === 'cut') { this.applyTod(0, 0); this.world.update(rdt, 0, 14, { px: 0, py: 0, ph: H_STAND, mouth: 1.7, magnet: false, collect: () => {} }); this.story.update(rdt); return; }
    if (this.state === 'menu' || this.state === 'loading') this.applyTod(0, 0);
    else if (this.world) { const td = timeOfDay(this.world.dist); this.applyTod(td.eve, td.night); }
    if (this.state === 'menu' || this.state === 'loading') {
      g.update(rdt, 'dance', {});
      this.world.update(rdt, 0, 14, { px: 0, py: 0, ph: H_STAND, mouth: 1.7, magnet: false, collect: () => {} });
      const t = performance.now() / 1000;
      // चौड़ी स्क्रीन पर गोलू बीच में, बटन दाईं ओर
      const wide = this.cam.aspect > 1.33 && !this.wardOpen ? 1.6 : 0;
      const wk = this.wardK = damp(this.wardK || 0, this.wardOpen ? 1 : 0, 6, rdt);
      const sk = this.shopK = damp(this.shopK || 0, this.goShopOpen ? 1 : 0, 4, rdt); // 🏪 दुकान देखते समय कैमरा उधर
      this.cam.position.set(lerp(Math.sin(t * 0.35) * 1.2 * (1 - wk) + wide, 0.3 + Math.sin(t * 0.3) * 0.5, sk), lerp(lerp(2.4, 1.9, wk), 2.5, sk), lerp(lerp(5.4, 4.3, wk), 4.6, sk));
      this.cam.lookAt(lerp(wide, -0.7, sk), lerp(lerp(1.45, 0.35, wk), 1.2, sk), lerp(-1, -4.4, sk));
      if (sk > 0.002) g.root.position.set(1.3 * sk, 0, -3.4 * sk); // दुकान के बगल में खड़ा गोलू
      this.gshop.update(rdt); this.fixJhola(rdt);
      if (this.celebT > 0) { // नया कपड़ा — चमक और घूमना
        this.celebT -= rdt;
        g.root.rotation.y = Math.PI + Math.sin(this.celebT * 3) * 0.6;
        if (Math.random() < 0.6) this.world.parts.burst(rand(-1.2, 1.2), rand(0.5, 2.6), rand(-0.5, 0.8), [0xffd24d, 0xd1261c, 0x2e7b47, 0xd8457f, 0x2f6fb6][Math.floor(Math.random() * 5)], 3, 2.5, 2.5, 0.8, 0);
        if (this.celebT <= 0) g.root.rotation.y = Math.PI;
      }
      return;
    }
    if (this.state !== 'play' && this.state !== 'paused') this.skyShow.update(rdt, 0, 0, 0, this.cam.position);
    if (this.state === 'paused' || this.state === 'over' || this.state === 'revive') {
      if (this.state !== 'paused') { g.update(rdt, 'dead', {}); this.updateMonkey(rdt); this.updateEmo(rdt); }
      this.updateBees(rdt);
      return;
    }
    if (this.state === 'dying') {
      this.deathT += rdt;
      g.update(rdt, 'dead', { y: this.p.y });
      this.p.y = Math.max(0, this.p.y + this.p.vy * rdt); this.p.vy += GRAV * rdt;
      g.root.position.y = this.p.y;
      this.world.update(rdt, 0, 0, this.ctx());
      this.updateMonkey(rdt);
      this.updateBees(rdt);
      this.updateCam(rdt);
      this.updateEmo(rdt);
      if (this.deathT > 1.5) this.afterDeath();
      return;
    }
    // ---------- खेल चालू ----------
    // धीमी गति (ट्यूटोरियल / बाल-बाल बचे)
    let ts = 1;
    if (this.slowmo > 0) { this.slowmo -= rdt; ts = this.slowTs || 0.45; if (this.slowmo <= 0) this.slowTs = 0; }
    this.cine = Math.max(0, (this.cine || 0) - rdt);
    const need = this.tutorialNeed();
    if (need) ts = 0.06;
    this.timeScale = damp(this.timeScale, ts, 10, rdt);
    const dt = rdt * this.timeScale;
    const p = this.p;
    this.runT += dt;
    // रफ़्तार
    const base = baseSpeed(this.world.dist);
    let sp = base;
    // लेवल
    let lv = 0;
    for (let i = 0; i < LEVELS.length; i++) if (this.world.dist >= LEVELS[i]) lv = i;
    if (lv > this.level) this.levelUp(lv);
    if (this.rushT > 0) sp *= 1.3;
    if (p.slowT > 0) { sp *= 0.72; p.slowT -= dt; }
    if (p.stumT > 0) sp *= 0.85;
    sp *= this.dl.speedMul(); // 🛵 स्कूटी तेज़
    this.speed = damp(this.speed, sp, 3, dt);
    if (this.dl.cap < this.speed) this.speed = this.dl.cap; // घर के आगे ब्रेक / रुककर डिब्बा देना
    this.sound.setTempo(112 + (this.speed - 14) * 1.1);
    const dz = this.speed * dt;
    this.lastDz = dz;
    // खिलाड़ी
    p.laneT += dt;
    { const W = 26, e = Math.exp(-W * dt), d = p.x - p.tx, v0 = p.vx || 0, c = v0 + W * d; p.x = p.tx + (d + c * dt) * e; p.vx = (v0 - W * c * dt) * e; } // 🏃 लेन बदलना: स्प्रिंग जैसी नरम चाल — शुरू और रुकना दोनों नरम, फिर भी ~0.18 सेकंड में
    const gy = this.world.groundAt(p.x, 0); // डिब्बे की छत / ढलान
    p.gy = gy;
    if (p.fly > 0) {
      p.fly -= dt;
      p.y = damp(p.y, FLY_Y, 2.6, dt);
      p.air = 0;
      if (Math.random() < 0.3) this.world.parts.burst(p.x + rand(-0.4, 0.4), p.y - 0.2, 1.6, Math.random() < 0.5 ? 0xffe08a : 0xff9a3d, 1, 0.5, 0.5, 0.45, 0);
      if (p.fly <= 0) this.endFly();
    } else if (p.ground && gy < p.y - 0.06) { // छत ख़त्म — नीचे गिरो
      p.ground = false; p.vy = 0; p.coy = 0.12; // किनारे से गिरते ही ज़रा देर तक कूद चलेगा
    } else if (p.ground) {
      if (gy - p.y < 0.45) p.y = gy; // ढलान पर चढ़ो / छत पर दौड़ो (बगल से दीवार पर नहीं चढ़ना)
    }
    if (p.fly <= 0 && !p.ground) {
      const prevY = p.y;
      p.vy += GRAV * dt;
      p.y += p.vy * dt;
      p.air += dt;
      const floor = prevY >= gy - 0.3 ? gy : 0; // ऊपर से आए तो छत, बगल से तो ज़मीन
      if (p.y <= floor && p.vy <= 0) {
        const imp = -p.vy; // ज़मीन पर कितनी ज़ोर से
        p.y = floor; p.vy = 0; p.ground = true; p.air = 0;
        if (imp > 5 && !p.boat) { if (this.golu.land) this.golu.land(Math.min(1, imp / 16)); if (!p.rollQ) this.world.parts.burst(p.x, p.y + 0.08, 0.15, 0xd9c7a8, imp > 11 ? 7 : 4, 1.8, 0.7, 0.4, 0); } // उतरते ही हल्की लचक + धूल
        if (p.rollQ) { p.roll = ROLL_T; p.rollQ = false; this.sound.roll(); }
        this.tricks.land();
        if (p.jbuf > 0 && !p.roll && p.fly <= 0) this.doJump();
        if (this.zipLand) { this.zipLand = false; this.world.parts.burst(p.x, 0.15, 0.2, 0xd9c7a8, 18, 3.2, 1.6, 0.6); this.camKick = Math.max(this.camKick || 0, 0.35); if (this.sound.thud) this.sound.thud(); vibrate(25); } // रस्सी से उतरकर धप्प
      }
    }
    p.jbuf = Math.max(0, (p.jbuf || 0) - dt); p.coy = Math.max(0, (p.coy || 0) - dt);
    // 🚣 पोखर: घाट पार होते ही नाव पर (उछलकर), दूसरे घाट पर उतरो
    const pd = this.world.pond, inPond = !!pd && pd.a > 0.4 && pd.b < -0.4;
    if (inPond !== !!p.boat) {
      p.boat = inPond;
      if (p.fly <= 0 && p.ground) { p.vy = 7.5; p.ground = false; }
      this.world.parts.burst(p.x, WATER_Y + 0.1, -0.6, 0xe9fbff, 22, 3.5, 3, 0.7); this.world.parts.burst(p.x, WATER_Y + 0.1, -0.6, 0x5fb7c4, 12, 3, 2.5, 0.6);
      this.sound.splash();
      if (inPond) { const ty = this.world.pondType || 'makhana', PI2 = { makhana: '🪷', machh: '🐟', deep: '🪔' }; this.zoneBanner(PI2[ty] || '🚣', T(ty === 'machh' ? 'pondZ2' : ty === 'deep' ? 'pondZ3' : 'pondZ')); this.cheer('pond', 1700, -1, true); this.mom.want(380, T(ty === 'machh' ? 'momPond2' : ty === 'deep' ? 'momPond3' : 'momPond'), 1100); } else this.cheer('pondOut', 1000);
    }
    if (p.boat && p.fly <= 0) { this.msBump('pond', dz); this.pcPond = (this.pcPond || 0) + dz; if (this.pcPond > 45 && !this.pcPondDone && this.world.pondType === 'makhana') { this.pcPondDone = true; this.darshan.event('makhana'); } } // 📮 मखाने का पोस्टकार्ड: नाव पर थोड़ा चलकर
    // 🌳 जंगल की रस्सी: मचान पार होते ही कुंडा पकड़कर ऊपर (धीमी गति), नदी पार होते ही कूदकर नीचे
    const zp = this.world.zip, inZip = !!zp && zp.a > -10 && zp.b < -0.4; // नदी शुरू होने से पहले किनारे से ही उछलकर पकड़ो (पानी पर दौड़ना नहीं)
    if (inZip && !p.zip && p.fly <= 0 && !p.scooty) {
      p.zip = true; p.zipK = 0; p.roll = 0; p.rollQ = false; this.tricks.reset();
      this.slowmo = 0.9; this.slowTs = 0.35; this.cine = 1.1; this.cineSide = p.x >= 0 ? 1 : -1;
      if (this.sound.zip) this.sound.zip(); if (this.sound.clank) this.sound.clank(); vibrate([20, 30, 20]); this.zipHumT = 0.5; this.zipLand = false;
      this.zoneBanner('🌳', T('zipZ')); this.mom.want(360, T('momZip'), 900);
    }
    if (p.zip) {
      p.zipK = Math.min(1, p.zipK + dt / 0.55);
      this.msBump('zip', dz);
      if (!inZip || p.fly > 0) { // नदी पार — नीचे कूदो
        p.zip = false; p.y += this.zipOff; p.ground = false; p.vy = Math.max(p.vy, 2); this.zipOff = 0; this.zipLand = true; // उतरते ही "धप्प" (नीचे)
        this.sound.jump(false); this.cheer('zipOut', 1000);
      }
    }
    const zw = this.world.zip, zSag = zw ? zipSag(-zw.a) : 0; // 🚡 रस्सी का झोल: खंभों के बीच गोलू थोड़ा नीचे, खंभे पर फिर ऊपर
    this.zipOff = p.zip ? ZIP_H * (1 - Math.pow(1 - p.zipK, 3)) + zSag * p.zipK : 0;
    if (p.roll > 0) { p.roll -= dt; if (p.ground && !p.boat && p.fly <= 0 && Math.random() < dt * 40) this.world.parts.burst(p.x + rand(-0.25, 0.25), p.y + 0.06, -0.35, 0xd9c7a8, 1, 1.4, 0.7, 0.4, 0); } // फिसलते समय पीछे उड़ती धूल
    p.stumT = Math.max(0, p.stumT - dt);
    p.invT = Math.max(0, p.invT - dt);
    if (p.beesT > 0) { p.beesT -= dt; if (p.beesT <= 0) this.sound.bees(false); }
    for (const k of ['magnet', 'shoes', 'thali', 'madhu']) this.pu[k] = Math.max(0, this.pu[k] - dt);
    if (this.rushT > 0) {
      this.rushT -= dt;
      this.meter = Math.max(0, this.rushT / 6);
      if (this.rushT <= 0) { this.meter = 0; p.invT = 1.0; }
    }
    this.comboT -= dt;
    // दुनिया
    this.world.flying = p.fly > 0; // उड़ते समय पोखर/रस्सी शुरू नहीं (ऊपर से पार न हो)
    this.world.busy = this.dl.active() || (this.mk && this.mk.st !== 'off'); // डिलीवरी/बंदर के बीच पानी नहीं
    this.world.update(dt, dz, this.speed, this.ctx());
    this.dl.update(dt, dz);
    this.darshan.update(dt, dz);
    this.tricks.update(dt);
    {
      const td = this.tod || { eve: 0, night: 0 }, zn = this.world.zone;
      this.wild = damp(this.wild, zn === 'jungle' ? 1 : zn === 'fields' ? 0.7 : 0, 1.5, dt);
      this.nfx.update(rdt, dz, td.night, this.wild, this.world.chunks, this.cam.quaternion);
      this.lamp.position.set(this.p.x, 3.2 + this.p.y, -3);
      if (td.night > 0.6 && !this.nightSaid) { this.nightSaid = true; this.zoneBanner('🌙', T('zNight')); this.cheer('night', 1700, -1, true); }
      else if (td.night < 0.2 && this.nightSaid) { this.nightSaid = false; this.zoneBanner('🌅', T('zDawn')); this.cheer('dawn', 1700, -1, true); }
      if (zn === 'jungle') this.msBump('jungle', dz);
    }
    while (this.world.events.length) { const ev = this.world.events.shift(); if (ev === 'fish') { this.sound.plop(); continue; } if (ev === 'haat' || ev === 'mela') this.sound.levelUp(); else if (ev === 'baraat') { this.sound.baraat(); this.beatStart(); } else if (ev === 'rail') this.sound.train(); this.cheer(ev, 1800, -1, true); if (ev === 'haat') this.msBump('haat'); const ZB = { jungle: ['🌳', 'zJungle'], fields: ['🌼', 'zFields'], village: ['🏡', 'zVillage'] }; if (ZB[ev]) this.zoneBanner(ZB[ev][0], T(ZB[ev][1])); }
    this.collide();
    this.updateGold(dz);
    this.story.check();
    this.score += dz * (this.rushT > 0 ? 2 : 1) * this.mult;
    if (!this.recordSaid && this.best > 500 && this.score > this.best) { this.recordSaid = true; this.mom.want(650, T('momRecord'), 300); this.cheer('newBest', 1300, -1, false, 'gold'); }
    this.msBump('score', Math.floor(this.score), true);
    // बिना टकराए लंबी दौड़ / हर 100 मिठाई पर शाबाशी
    this.clean += dz;
    if (this.clean > 450 && p.fly <= 0) { this.clean = 0; this.cheer('streak', 1200); }
    if (this.got >= this.sweetMark) { this.cheer('sweets', 1000, Math.min(3, Math.floor(this.sweetMark / 100) - 1), false, 'gold'); this.sweetMark += 100; }
    this.msBump('dist', Math.floor(this.world.dist), true);
    if (p.ground && gy > 1) this.msBump('roof', dz);
    // गोलू
    let mode = 'run';
    if (p.fly > 0) mode = 'fly';
    else if (!p.ground) mode = 'jump';
    if (p.roll > 0) mode = 'roll';
    if (p.stumT > 0 && p.ground && p.roll <= 0) mode = 'stumble';
    const inBoat = !!p.boat && p.fly <= 0;
    if (inBoat) mode = p.roll > 0 ? 'duck' : 'boat';
    if (this.lungeT > 0) { this.lungeT -= dt; if (p.fly <= 0 && !inBoat) mode = 'lunge'; } // बंदर पर झपट्टा
    if (p.fly <= 0 && !inBoat) mode = this.dl.pose(mode); // डिब्बा पकड़े / स्कूटी पर / टाटा
    if (p.zip && p.fly <= 0) mode = !p.ground || p.roll > 0 ? 'hangUp' : 'hang'; // रस्सी से लटका
    const flip = !p.ground && p.big ? clamp(p.air / (2 * SHOE_V / -GRAV), 0, 1) : null;
    // पीछा हो रहा हो तो बीच-बीच में पीछे मुड़कर देखे + पसीना
    const chased = p.beesT > 0;
    this.lookC = chased ? (this.lookC || 0) + dt : 0;
    const look = chased && p.ground && p.roll <= 0 && p.fly <= 0 && this.lookC % 1.7 > 1.12 ? 1 : 0;
    this.emo.set('sweat', chased && p.fly <= 0);
    const tr = this.tricks;
    g.update(dt, mode, { speed: this.speed, vy: p.vy, y: p.y, gy, big: this.rushT > 0, shield: this.pu.shield, flip, tx: tr.rx, tz: tr.rz, look, walk: this.dl.st === 'walk' });
    g.root.position.set(p.x, p.y + (inBoat ? WATER_Y + 0.12 : p.scooty ? 0.36 : 0), inBoat ? 0.12 : p.scooty ? 0.18 : 0);
    g.root.rotation.z = clamp(-(p.vx || 0) * 0.009, -0.24, 0.24); // मोड़ की ओर हल्का झुकाव (रफ़्तार के हिसाब से)
    const tro = this.trolley; tro.visible = !!p.zip;
    if (p.zip) { // रस्सी से लटका: पैर उठाने पर थोड़ा ऊपर, रस्सी बदलते समय झूला
      g.root.position.y = this.zipOff + p.y * 0.3 - (1 - p.zipK) * 0.0; g.root.rotation.z = (p.tx - p.x) * -0.22 + Math.sin(this.runT * 2.2) * 0.04;
      // घिरनी रस्सी पर (पहिये घूमें), पट्टे से लटका हत्था गोलू के हाथों में
      const ry = ZIP_H + ROPE_Y + zSag, tv = this._tv || (this._tv = new THREE.Vector3());
      let hy = ry - 0.45; if (g.handR) { g.handR.getWorldPosition(tv); hy = Math.min(ry - 0.18, tv.y + 0.03); }
      this.zipRoll = (this.zipRoll || 0) - dz / 0.085;
      placeTrolley(tro, p.x, ry, p.x, hy, this.zipRoll, g.root.rotation.z);
      if (p.zipK >= 1 && Math.random() < 0.14) this.world.parts.burst(p.x + rand(-0.05, 0.05), ry + 0.12, 0.15, Math.random() < 0.6 ? 0xffd24d : 0xff8a3d, 2, 1.6, 2.2, 0.28, 0); // घिरनी की चिंगारी
      this.zipHumT = (this.zipHumT || 0) - dt; if (this.zipHumT <= 0 && p.zipK >= 1) { this.zipHumT = 0.75; if (this.sound.zipHum) this.sound.zipHum(); }
      if (g.shadow) g.shadow.position.y = -(this.zipOff + p.y * 0.3) + 0.32;
    } else if (g.shadow) g.shadow.position.y = 0.02;
    const bt = this.boat; bt.visible = inBoat;
    if (inBoat) {
      bt.position.set(p.x, p.y + WATER_Y - 0.22 + Math.sin(this.runT * 3.2) * 0.04, 0.05);
      bt.rotation.set(Math.sin(this.runT * 2.1) * 0.03 - (p.ground ? 0 : 0.08), 0, (p.tx - p.x) * -0.09 + Math.sin(this.runT * 2.6) * 0.03);
      if (p.ground && Math.random() < 0.5) this.world.parts.burst(p.x + rand(-0.55, 0.55), WATER_Y + 0.06, 1.5, Math.random() < 0.6 ? 0xffffff : 0xbfe9ee, 1, 0.7, 0.5, 0.6, -2);
    }
    // उड़ान का अंदाज़: उठते समय पूरी कलाबाज़ी, बीच-बीच में घूमकर मुस्कान दिखाए
    let roll = 0, twirl = 0;
    if (p.fly > 0) {
      const ft = this.flyT - p.fly, e = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
      roll = ft < 1.1 ? e(ft / 1.1) * Math.PI * 2 : 0;
      for (const t0 of [3.3, 6.2]) if (ft > t0 && ft < t0 + 0.8) twirl = e((ft - t0) / 0.8) * Math.PI * 2;
    }
    g.root.rotation.z += roll; g.root.rotation.y = twirl + tr.ry + this.dl.turn() + (p.fly > 0 || p.zip ? 0 : clamp(-(p.vx || 0) * 0.01, -0.26, 0.26)); // रुककर दुकान/दरवाज़े की ओर मुँह; लेन बदलते समय उधर मुड़कर
    const hits = this.skyShow.update(dt, dz, p.x, p.y, this.cam.position);
    if (hits) {
      this.score += 100 * hits * this.mult; this.got += 3 * hits;
      this.sound.ring(); vibrate(20);
      this.world.parts.burst(p.x, p.y + 1, -0.5, 0xffd24d, 26, 5, 4, 0.8, 0);
      this.cheer('ring', 800);
      this.msBump('rings', hits); this.msBump('sweets', this.got, true);
    }
    // उड़न समोसा गोलू के नीचे
    const sm = this.samosa;
    if (p.fly > 0 || (sm.visible && p.y > 0.3)) {
      sm.visible = true;
      sm.position.set(p.x, p.y + 0.05 + Math.sin(this.runT * 5) * 0.08, 0.1);
      sm.rotation.set(Math.sin(this.runT * 3) * 0.05, twirl, (p.tx - p.x) * -0.12 + Math.sin(this.runT * 2.2) * 0.04 + roll);
      sm.userData.puffs.forEach((u, i) => { const k = (this.runT * 3 + i / 6) % 1; u.position.set(Math.sin(i * 2.1 + this.runT) * 0.25, -0.1 + k * 0.4, 1.4 + k * 1.6); u.scale.setScalar(0.5 + k * 1.1); u.material.opacity = 0.5 * (1 - k); });
    } else sm.visible = false;
    g.setGlow(this.rushT > 0 ? 0.6 + Math.sin(this.runT * 14) * 0.25 : p.invT > 0 && !this.dl.inScene() && !this.dl.cam() ? (Math.sin(this.runT * 30) > 0 ? 0.5 : 0) : 0); // डिलीवरी के रुके पल में टिमटिमाना नहीं
    if (this.rushT > 0 && Math.random() < 0.5) this.world.parts.burst(p.x + rand(-0.6, 0.6), rand(0.4, 2.2), 0.6, Math.random() < 0.5 ? 0xffd24d : 0xff8a3d, 1, 1, 1, 0.4, 0);
    if (this.hsT > 0) { this.hsT -= dt; if (this.hsT <= 0 && p.fly <= 0) this.startFly(); }
    const fx = g.fx;
    if (fx && p.fly <= 0) {
      if (fx === 'dust' && p.ground && Math.random() < 0.35) this.world.parts.burst(p.x + rand(-0.2, 0.2), p.y + 0.12, 0.5, 0xd9c7a8, 2, 0.8, 0.8, 0.45, 0);
      else if (fx === 'sparkle' && p.ground && Math.random() < 0.4) this.world.parts.burst(p.x + rand(-0.25, 0.25), p.y + 0.15, 0.4, Math.random() < 0.5 ? 0xffd24d : 0xfff2b0, 2, 1.2, 1.5, 0.5, 0);
      else if (fx === 'trail' && Math.random() < 0.55) this.world.parts.burst(p.x + rand(-0.3, 0.3), p.y + rand(0.6, 1.6), 0.9, [0xffd24d, 0xd8457f, 0x7fd3ff, 0xffffff][Math.floor(Math.random() * 4)], 1, 0.4, 0.6, 0.7, 0);
    }
    this.toMonkey -= dz;
    if (this.toMonkey <= 0 && this.mk.st === 'off' && p.fly <= 0 && !p.boat && !p.zip && !this.world.zip && !this.world.pond && !this.dl.active() && this.world.railObs <= 0 && this.world.melaObs <= 0 && this.rushT <= 0 && p.invT <= 0) this.monkeyStart();
    this.updateMonkey(dt);
    this.updateBees(dt);
    this.updateCam(rdt);
    this.updateEmo(rdt);
    this.beatUpdate();
    this.rec.push(this.runT, this.world.dist, p.x, p.y, flagsOf(p));
    this.ghostGap = this.ghost.update(dt, this.runT, this.world.dist, WATER_Y);
    this.updateHud();
    this.autoQuality(this.rawDt || rdt);
  }

  ctx() {
    const p = this.p || { x: 0, y: 0, roll: 0 };
    return {
      px: p.x, py: p.y + (this.zipOff || 0), ph: p.roll > 0 ? H_ROLL : H_STAND, mouth: 1.75,
      magnet: this.state === 'play' && (this.pu.magnet > 0 || this.rushT > 0),
      collect: (it) => this.collect(it),
    };
  }

  collide() {
    const p = this.p;
    const ph = p.roll > 0 ? H_ROLL : H_STAND;
    for (const e of this.world.obs) {
      if (e.dead) continue;
      const ox = Math.abs(e.x - p.x) < e.halfW + HALF_W;
      const oz = Math.abs(e.z) < e.halfL + 0.35;
      if (e.kind === 'ramp') {
        // ढलान के बगल से घुसे (ऊँचाई पर) — दीवार जैसा झटका, अंदर से निकलकर डिब्बे से टकराना नहीं
        if (ox && oz && e.pz && !e.px && p.invT <= 0 && this.rushT <= 0 && this.world.groundAt(p.x, 0) - p.y > 0.45) {
          p.lane = p.prevLane; p.tx = LANES[p.lane]; p.laneT = 9; this.stumble();
          if (this.state !== 'play') return;
        }
        e.px = ox; e.pz = oz; continue;
      }
      if (e.kind === 'mud') {
        if (ox && oz && p.y < 0.25 && !e.used) {
          e.used = true; p.slowT = 0.9;
          this.sound.splash();
          this.world.parts.burst(p.x, 0.3, 0.2, 0x6b4a2b, 14, 3, 3, 0.6);
        }
      } else {
        const oy = (e.kind === 'train' ? p.y < e.yMax - 0.35 : p.y < e.yMax) && p.y + ph > e.yMin;
        if (e.type === 'chugla' && ox && oz && !oy && !e.cnt && !e.dead && p.y >= e.yMax - 0.05) { e.cnt = true; this.fest.jumped(e); }
        if (ox && oz && oy) {
          const side = e.pz && !e.px;
          this.hit(e, side);
          if (this.state !== 'play') return;
        } else if (oz && !ox && e.kind === 'block' && !e.nm && p.laneT < 0.3 && Math.abs(e.x - p.x) < e.halfW + HALF_W + 0.45) {
          e.nm = true;
          this.slowmo = 0.3;
          this.sound.near();
          this.cheer('near', 800);
          this.msBump('near');
          this.score += 25 * this.mult;
          this.mom.want(150, T('momNear'), 60);
        }
      }
      e.px = ox; e.pz = oz;
    }
    for (const u of this.world.pups) {
      if (!u.taken && Math.abs(u.x - p.x) < 1.0 && Math.abs(u.z) < 1.0 && p.y < 2.4) this.takePu(u);
    }
  }

  tutorialNeed() {
    if (this.tutDone) return null;
    // हर सबक़ के लिए "रुको और सिखाओ" वाला हिस्सा (z) — बहुत जल्दी कूदे तो गिरेंगे, इसलिए पास आने पर रोकते हैं
    const ZONE = { lane: [-14, -2], jump: [-6.5, -1.8], roll: [-6.5, -1.2] };
    let need = null;
    const p = this.p;
    for (const e of this.world.obs) {
      if (!e.need) continue;
      const [a, b] = ZONE[e.need];
      if (e.z < a || e.z > b) continue;
      const done = e.need === 'lane' ? p.lane !== e.lane : e.need === 'jump' ? !p.ground : p.roll > 0 || p.rollQ;
      if (done) {
        if (e.need === 'roll') {
          this.tutDone = true; store('tut', 1);
          setTimeout(() => { if (this.state === 'play') this.toast(T('tip'), 2800); }, 900);
          setTimeout(() => this.teachPause(), 4200);
        }
        e.need = null;
        continue;
      }
      need = e.need;
    }
    const h = $('#hint');
    if (need) {
      if (this.hud.hint !== need) {
        const trk = need === 'lane' ? '⟵ ⟶' : need === 'jump' ? '⟰' : '⟱';
        h.innerHTML = `<span class="hand ${need}">👆</span><span class="trk">${trk}</span><b>${T(need)}</b>`; h.dataset.k = need; this.hud.hint = need;
      }
      h.hidden = false;
    } else if (!h.hidden) { h.hidden = true; this.hud.hint = null; }
    return need;
  }

  updateBees(dt) {
    const p = this.p || { x: 0, y: 0, beesT: 0 };
    let tx = p.x, ty = 2.2, tz = 18;
    if (this.state === 'dying' || this.state === 'over' || this.state === 'revive') { ty = 1.7; tz = 0.4; }
    else if (p.beesT > 0) { ty = p.y + 1.7; tz = 2.4; }
    this.beeC.x = damp(this.beeC.x, tx, 6, dt); this.beeC.y = damp(this.beeC.y, ty, 6, dt); this.beeC.z = damp(this.beeC.z, tz, 4, dt);
    const t = performance.now() / 1000;
    const close = this.state === 'dying' || this.state === 'over' || this.state === 'revive';
    this.bees.forEach((b, i) => {
      const a = t * b.sp + b.ph;
      const r = close ? b.r * 0.9 : b.r * 1.3;
      this.beeKit.place(i, this.beeC.x + Math.cos(a) * r, this.beeC.y + b.h + Math.sin(a * 1.7) * 0.25, this.beeC.z + Math.sin(a) * r * 0.6, -a, Math.sin(t * 60 + b.ph) * 0.7);
    });
    this.beeKit.commit();
    this.beeGroup.visible = this.beeC.z < 15;
  }

  updateCam(dt) {
    const p = this.p, v = this.view;
    this.camX = damp(this.camX, p.x * 0.55, 7, dt);
    this.camKick = Math.max(0, (this.camKick || 0) - dt * 2.5);
    const fov = v.fov + (this.speed - 14) * 0.28 + (this.rushT > 0 ? 6 : 0) + Math.sin(Math.min(1, this.camKick * 2) * Math.PI) * 4;
    if (Math.abs(this.cam.fov - fov) > 0.05) { this.cam.fov = damp(this.cam.fov, fov, this.camKick > 0 ? 14 : 4, dt); this.cam.updateProjectionMatrix(); }
    this.shake = Math.max(0, this.shake - dt * 1.6);
    const sh = this.shake * this.shake;
    const fk = clamp(p.y / FLY_Y, 0, 1) * (p.fly > 0 || p.y > 3 ? 1 : 0);
    this.flyK = damp(this.flyK || 0, fk, 3, dt);
    const zo = this.zipOff || 0, cy = p.y * (0.35 + 0.55 * this.flyK) + zo * 0.3, ly = p.y * (0.3 + 0.62 * this.flyK) + zo * 0.9; // रस्सी पर: कैमरा रस्सी से थोड़ा नीचे — ऊपर रस्सी, नीचे नदी दिखे
    // 🎬 बंदर वाले पल: कैमरा गोलू के पास, थोड़ा बगल से (धीमी गति के साथ)
    this.cineK = damp(this.cineK || 0, this.cine > 0 && this.state === 'play' ? 1 : 0, this.cine > 0 ? 5 : 3, dt);
    const ck = this.cineK, cs = this.cineSide || (this.mk && this.mk.side) || 1;
    // 📮 मिथिला दर्शन: 1–2 सेकंड कैमरा जगह की ओर (जहाज़ हो तो ऊपर)
    this.pcLook = Math.max(0, (this.pcLook || 0) - dt);
    this.lookK = damp(this.lookK || 0, this.pcLook > 0 && this.state === 'play' ? 1 : 0, this.pcLook > 0 ? 2.6 : 2.2, dt);
    const lk = this.lookK * (1 - ck), ls = this.pcLookSide || 1, lu = this.pcLookUp ? 1 : 0;
    this.cam.position.set(this.camX + rand(-sh, sh) + ck * cs * 1.6 - ls * lk * (1 - lu) * 0.9, v.y + cy + this.flyK * 0.6 + rand(-sh, sh) - ck * (v.y - 2.3) * 0.55 - lk * lu * 0.6, v.z + this.flyK * 1.2 - ck * v.z * 0.38);
    const LT = this._lt || (this._lt = new THREE.Vector3());
    LT.set(this.camX * 1.2 * (1 - ck) + ck * (p.x + cs * 0.2) + ls * lk * (1 - lu) * 6.2, v.ly + ly + ck * (1.25 - v.ly) * 0.6 + lk * (1.4 + lu * 7), v.lz * (1 - ck * 0.75));
    // 🛵 डिलीवरी के रुके पल: कैमरा घूमकर सामने से (धीरे-धीरे आना-जाना)
    const dc = this.state === 'play' && this.dl.cam ? this.dl.cam() : null;
    this.dlK = damp(this.dlK || 0, dc ? 1 : 0, dc ? 2.8 : 2.4, dt);
    if (dc) { const C2 = this.dlCam || (this.dlCam = { pos: dc.pos.slice(), look: dc.look.slice() }); const kk = this.dlK < 0.05 ? 1 : 1 - Math.exp(-3 * dt); for (let i = 0; i < 3; i++) { C2.pos[i] += (dc.pos[i] - C2.pos[i]) * kk; C2.look[i] += (dc.look[i] - C2.look[i]) * kk; } } // अलग पलों के बीच कैमरा धीरे खिसके
    if (this.dlK > 0.002 && this.dlCam) { const e = this.dlK * this.dlK * (3 - 2 * this.dlK), c = this.dlCam, T2 = this._lt2 || (this._lt2 = new THREE.Vector3()); this.cam.position.lerp(T2.set(c.pos[0], c.pos[1], c.pos[2]), e); LT.lerp(T2.set(c.look[0], c.look[1], c.look[2]), e); }
    else this.dlCam = null;
    this.cam.lookAt(LT);
    if (this.flyK > 0.01) this.cam.rotateZ((p.tx - p.x) * 0.035 * this.flyK);
  }

  // 🥁 बारात: ढोल की ताल पर कूदो — सही थाप पर = बोनस, लगातार = और ज़्यादा
  beatNow() { const b = this.beat; if (!b) return null; const now = b.ctx ? this.sound.ctx.currentTime : performance.now() / 1000; return (now - b.t0) * b.bpm / 60; }
  beatStart() {
    const bpm = 120, n = 18, t0 = this.sound.dhol(bpm, n);
    this.beat = { t0: t0 != null ? t0 : performance.now() / 1000 + 0.3, ctx: t0 != null, bpm, n, streak: 0, best: 0 };
    const el = $('#beat'); el.hidden = false; el.querySelector('span').textContent = T('beatHint');
  }
  beatJump() {
    const b = this.beat, x = this.beatNow(); if (!b || x == null || x < -0.3 || x > b.n) return;
    if (Math.abs(x - Math.round(x)) < 0.17) {
      b.streak++; b.best = Math.max(b.best, b.streak);
      this.score += 75 * b.streak * this.mult; this.got += 2;
      this.floatText(T('beatOk', b.streak), 'tp'); this.sound.clap(); vibrate(15);
      if (b.streak >= 3) this.mom.want(300 + 20 * b.streak, T('beatOk', b.streak));
      this.world.parts.burst(this.p.x, 1.4, 0, [0xffd24d, 0xd1261c, 0xd8457f][b.streak % 3], 10, 3, 3, 0.6);
    } else b.streak = 0;
  }
  beatUpdate() {
    const b = this.beat; if (!b) return;
    const x = this.beatNow(), el = $('#beat');
    if (x == null || x > b.n + 0.5 || this.state !== 'play') {
      this.beat = null; el.hidden = true;
      if (b.best >= 3 && this.state === 'play') this.cheer('beat', 1400, -1, true, 'gold', `🥁 ×${b.best}`);
      return;
    }
    const d = Math.abs(x - Math.round(x)), k = Math.max(0, 1 - d / 0.22);
    el.style.setProperty('--k', k.toFixed(2)); el.querySelector('b').textContent = b.streak ? '×' + b.streak : '🥁';
  }
  // भाव सिर के ऊपर (लुढ़कते समय नीचे, गिरने पर ज़मीन के पास)
  updateEmo(dt) {
    const p = this.p; if (!p) return;
    const sc = this.golu.scale || 1;
    if (this.state === 'dying' || this.state === 'over' || this.state === 'revive') this.emo.update(dt, p.x, Math.max(0, p.y) + 0.85, 0.9, 1);
    else this.emo.update(dt, p.x, p.y + (p.boat && p.fly <= 0 ? WATER_Y - 0.4 : 0) + (p.roll > 0 ? 1.15 : 2.45) * sc, 0.05, sc);
  }
  // छोटा उड़ता लिखा (करतब के अंक)
  floatText(txt, cls = '') {
    const d = document.createElement('div'); d.className = 'ftxt ' + cls; d.textContent = txt;
    $('#app').appendChild(d); setTimeout(() => d.remove(), 900);
  }
  updateHud() {
    const h = this.hud;
    const s = Math.floor(this.score);
    if (h.s !== s) { h.s = s; $('#scoreV').textContent = s.toLocaleString('en-IN'); }
    if (h.g !== this.got) { h.g = this.got; $('#sweetsV').textContent = this.got.toLocaleString('en-IN'); }
    if (h.mu !== this.mult) { h.mu = this.mult; const mv = $('#multV'); mv.hidden = this.mult <= 1; mv.textContent = '×' + this.mult; }
    const cb = this.comboT > 0 && this.combo >= 5 ? this.combo : 0;
    if (h.cb !== cb) { h.cb = cb; const el = $('#combo'); el.hidden = !cb; el.textContent = '×' + cb + ' ' + T('combo'); }
    const m = Math.round(this.meter * 100);
    if (h.m !== m) { h.m = m; $('#meter i').style.width = m + '%'; }
    const ready = this.meter >= 1 && this.rushT <= 0;
    if (h.ready !== ready) {
      h.ready = ready; $('#btnRush').hidden = !ready; $('#meter').classList.toggle('full', ready);
      if (ready) this.rushShown = performance.now();
      const teach = ready && store('tutRush') !== '1';
      $('#btnRush').classList.toggle('teach', teach);
      if (teach) requestAnimationFrame(() => this.bubble($('#btnRush'), '👇 ' + T('tutRush'), 6000)); else if (!ready) this.bubble(null);
    }
    const rush = this.rushT > 0;
    if (h.rush !== rush) { h.rush = rush; document.body.classList.toggle('rushing', rush); }
    const gg = this.ghost.on && this.ghostGap != null && !this.ghost.finished ? Math.round(this.ghostGap / 5) * 5 : null;
    const thief = this.mk && this.mk.st === 'thief' ? Math.max(1, Math.round(this.mk.gap - 1.5)) : 0, fc = this.fest && this.fest.on && !this.fest.done ? this.fest.n : -1;
    const sc = this.story.chip(), pc = this.darshan.chipNow();
    const pu = (pc ? 'P' + pc.k : '') + (sc ? 's' + sc.txt : '') + (gg != null ? 'g' + gg : '') + (thief ? 'k' + thief : '') + (fc >= 0 ? 'c' + fc : '') + (this.pu.magnet > 0 ? 'm' + Math.ceil(this.pu.magnet) : '') + (this.pu.shoes > 0 ? 's' + Math.ceil(this.pu.shoes) : '') + (this.pu.shield ? 'L' : '') + (this.pu.thali > 0 ? 't' + Math.ceil(this.pu.thali) : '') + (this.pu.madhu > 0 ? 'b' + Math.ceil(this.pu.madhu) : '') + (this.p.fly > 0 ? 'f' + Math.ceil(this.p.fly) : '');
    if (h.pu !== pu) {
      h.pu = pu;
      const box = $('#pu');
      box.innerHTML = '';
      const chip = (icon, name, sec, cls) => { const d = document.createElement('div'); d.className = 'chip' + (cls ? ' ' + cls : ''); d.innerHTML = `<b>${icon}</b><span>${name}</span>${sec ? `<em>${sec}</em>` : ''}`; box.appendChild(d); return d; };
      if (pc) { const d = chip('📮', `${pc.icon} ${pc.name}`, pc.sub, 'pcchip'); if (h.pcK !== pc.k) { h.pcK = pc.k; d.classList.add('in'); } } // मिथिला दर्शन — ऊपर कोने में छोटी पट्टी
      if (sc) chip('📖', T('storyChip'), sc.txt);
      if (gg != null) chip('👻', this.ghost.name, (gg > 0 ? '+' : '') + gg + 'm');
      if (thief) chip('🐒', T('thiefChip'), thief + T('mUnit'));
      if (fc >= 0) chip(this.fest.f.icon, T('festChip'), `${fc}/${this.fest.f.need}`);
      if (this.pu.magnet > 0) chip('🎁', T('magnet'), Math.ceil(this.pu.magnet));
      if (this.pu.shoes > 0) chip('🌀', T('shoes'), Math.ceil(this.pu.shoes));
      if (this.pu.shield) chip('🟠', T('shield'), '');
      if (this.pu.thali > 0) chip('✖️2', T('thali'), Math.ceil(this.pu.thali));
      if (this.pu.madhu > 0) chip('🎨', T('madhuS'), Math.ceil(this.pu.madhu));
      if (this.p.fly > 0) chip('🔺', T('samosaS'), Math.ceil(this.p.fly));
    }
  }

  autoQuality(dt) {
    const q = this.perf;
    if (q.done) return;
    if (this.runT < 3 || this.cine > 0 || (this.dl.inScene && this.dl.inScene()) || dt > 0.25) { q.t = 0; q.n = 0; q.sum = 0; return; } // शुरू के 3 सेकंड (लोड), रुके सीन, ऐप से लौटना — गिनती में नहीं
    q.t += dt; q.n++; q.sum += dt;
    if (q.t < 2) return;
    const avg = q.sum / q.n;
    q.t = 0; q.n = 0; q.sum = 0;
    if (avg <= 1 / 54) { // आराम से चल रहा: 6 सेकंड लगातार ऐसा हो तो एक दर्जा ऊपर (दौड़ में एक ही बार, फ़ोन की हद तक)
      q.prev = 0; q.good++;
      if (q.good >= 3 && !q.moved && this.tier > TIER_TOP()) { q.moved = true; q.good = 0; this.setTier(this.tier - 1, true); store('gfxTier2', this.tier); }
      return;
    }
    q.good = 0;
    if (avg <= 1 / 45) { q.prev = 0; return; } // ठीक चल रहा — देखते रहो (आगे भारी जगह आ सकती है)
    // पिछली बार घटाने से फ़ायदा नहीं हुआ (जैसे फ़ोन ख़ुद 30fps पर बँधा हो) — दो बार ऐसा हो तो रुक जाओ
    if (q.prev && avg > q.prev * 0.93) { if (++q.miss >= 2) { q.done = true; return; } } else q.miss = 0;
    q.prev = avg;
    if (this.tier >= TIERS.length - 1) return;
    q.moved = true; this.setTier(this.tier + 1, true);
    store('gfxTier2', this.tier);
  }

}

const game = new Game();
window.__game = game;
// टेस्ट: तय समय-कदमों में आगे बढ़ाओ (धीमे कंप्यूटर पर भी एक जैसा)
game.sim = (sec, fn) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { if (fn) fn(game); game.update(1 / 60); } game.renderer.render(game.scene, game.cam); };
game.boot();
