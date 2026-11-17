// रसगुल्ला रन — मुख्य खेल (MB Sweets, दरभंगा)
import * as THREE from './three.module.min.js';
import { loadTextures } from './art.js';
import { buildRealTextures, makeSky, makeEnv, shadows, SUN, HORIZON } from './real.js';
import { makeBees, makeSkyline, makeSamosaMount, SWEETS } from './models.js';
import { Golu as GoluCode } from './golu.js';
import { Golu as Golu3D, loadGolu } from './golu3d.js';
import { World, LANES } from './world.js';
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
import { clamp, lerp, damp, rand, store, storeNum, vibrate, VIB } from './util.js';
import { SETTINGS, loadSettings, Missions, wallet, upTime, wardrobe, stats, checkBadges, buyHeadstart, HEADSTART_COST } from './meta.js';
import { P, PORTAL } from './platform.js';
import { MetaUI } from './metaui.js';
import { countOpen, countGame } from './count.js';

const $ = (s) => document.querySelector(s);
// ग्राफ़िक्स के दर्जे (0 = सबसे बढ़िया). ऑटो: पूरी दौड़ में हर 2 सेकंड रफ़्तार देखो, धीमा हो तो एक दर्जा नीचे; फ़ोन याद रखे
const DPR = Math.min(window.devicePixelRatio || 1, 2);
const TIERS = [
  { pr: DPR, sh: true, fog: [70, 155], view: -175 },
  { pr: Math.min(DPR, 1.5), sh: true, fog: [70, 155], view: -175 },
  { pr: Math.min(DPR, 1.25), sh: false, fog: [66, 150], view: -165 },
  { pr: 1, sh: false, fog: [52, 128], view: -132 },
  { pr: Math.min(DPR, 1) * 0.8, sh: false, fog: [44, 112], view: -116 },
];
// कम RAM वाले फ़ोन पहले से हल्के दर्जे से (navigator.deviceMemory: 0.5/1/2/4/8 GB)
function startTier() {
  const saved = parseInt(store('gfxTier'), 10);
  if (saved >= 0 && saved < TIERS.length) return saved;
  const m = navigator.deviceMemory || 8, c = navigator.hardwareConcurrency || 8;
  return m <= 2 ? 3 : m <= 3 ? 2 : (m <= 4 || c <= 4) ? 1 : 0;
}
const GRAV = -36, JUMP_V = 11.6, SHOE_V = 16.2, ROLL_T = 0.62, H_STAND = 1.75, H_ROLL = 0.9, HALF_W = 0.38;
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
  hor: [new THREE.Color(0.93, 0.82, 0.66), new THREE.Color(0.82, 0.48, 0.26), new THREE.Color(0.13, 0.1, 0.2)],
  sun: [new THREE.Color(0xfff0d8), new THREE.Color(0xffad6a), new THREE.Color(0x8fa6ff)], sunI: [3.0, 2.2, 0.5],
  sky: [new THREE.Color(0xcfe3ff), new THREE.Color(0xffc9a0), new THREE.Color(0x6a7ac0)], gnd: [new THREE.Color(0x9a7a5a), new THREE.Color(0x8a5a40), new THREE.Color(0x30283a)], hemiI: [0.6, 0.42, 0.55],
  exp: [1.45, 1.22, 1.38],
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
  setTier(n) {
    const T0 = TIERS[n], r = this.renderer;
    this.tier = n;
    this.pr = T0.pr;
    r.setPixelRatio(this.pr); this.resize();
    this.fogBase = T0.fog; this.tod = null; // कोहरा applyTod में (रात में थोड़ा पास)
    this.scene.fog.near = T0.fog[0]; this.scene.fog.far = T0.fog[1];
    if (this.lamp) this.lamp.visible = n <= 2;
    this.world.viewZ = T0.view;
    if (r.shadowMap.enabled !== T0.sh) {
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
    const big = Math.min(window.innerWidth, window.innerHeight) > 700;
    dl.shadow.mapSize.set(big ? 2048 : 1024, big ? 2048 : 1024);
    const sc2 = dl.shadow.camera;
    sc2.left = -16; sc2.right = 16; sc2.top = 32; sc2.bottom = -32; sc2.near = 5; sc2.far = 110;
    dl.shadow.bias = -0.0006; dl.shadow.normalBias = 0.03;
    sc.add(dl); sc.add(dl.target);
    sc.add(makeSkyline());
    this.world = new World(sc);
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
    // रात: लालटेन/खंभों की चमक + जुगनू; गोलू के आगे गरम रोशनी (भारी दर्जों में बंद)
    this.nfx = new NightFX(sc);
    this.lamp = new THREE.PointLight(0xffc27a, 0, 22, 1.3); this.lamp.position.set(0, 3.2, -3); sc.add(this.lamp);
    this.wild = 0;
    this.mk = { st: 'off', t: 0, x: 0, y: 0, z: 4 };
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    this.bindUI();
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
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    window.addEventListener('keydown', (e) => {
      if (e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return; // नाम लिखते समय खेल के बटन नहीं
      const k = e.key;
      if (['ArrowLeft', 'a', 'A'].includes(k)) this.act('left');
      else if (['ArrowRight', 'd', 'D'].includes(k)) this.act('right');
      else if (['ArrowUp', 'w', 'W', ' '].includes(k)) this.act('up');
      else if (['ArrowDown', 's', 'S'].includes(k)) this.act('down');
      else if (['e', 'E', 'Shift', 'Enter'].includes(k)) this.act('rush');
      else if (['p', 'P', 'Escape'].includes(k)) { if (this.state === 'play') this.pause(); else if (this.state === 'paused') this.resume(); }
      else return;
      e.preventDefault();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(true); });
  }

  act(a) {
    if (this.state !== 'play') return;
    const p = this.p;
    if (a === 'left' || a === 'right') {
      const nl = clamp(p.lane + (a === 'left' ? -1 : 1), 0, 2);
      if (nl === p.lane) { this.edgeBump(); return; }
      p.prevLane = p.lane; p.lane = nl; p.tx = LANES[nl]; p.laneT = 0;
      this.sound.lane();
    } else if ((a === 'up' || a === 'down') && p.fly > 0) {
      return;
    } else if (a === 'up') {
      if (p.ground) {
        const big = this.pu.shoes > 0;
        p.vy = big ? SHOE_V : JUMP_V; p.ground = false; p.roll = 0; p.big = big;
        this.sound.jump(big); this.msBump('jumps');
      } else if (p.roll > 0) p.roll = 0;
    } else if (a === 'down') {
      this.msBump('rolls');
      if (p.ground) { p.roll = ROLL_T; this.sound.roll(); }
      else { p.vy = Math.min(p.vy, -24); p.rollQ = true; }
    } else if (a === 'rush') this.startRush();
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
    click('#btnAgain', () => this.afterAd(() => this.start()));
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
      setLang(b.dataset.lang3); $('#langS').hidden = true; this.refreshMenu(); this.meta.maybeDaily();
    });
    // सिखाने वाली चमक — दबाते ही हटे और याद रहे
    $('#btnRush').addEventListener('click', () => { if (store('tutRush') !== '1') { store('tutRush', 1); $('#btnRush').classList.remove('teach'); this.bubble(null); } });
    $('#btnPause').addEventListener('click', () => { store('tutPause', 1); $('#btnPause').classList.remove('teach'); this.bubble(null); });
    this.backGuard();
    click('#btnRush', () => this.startRush());
    click('#hsChip', () => { this.headstart = !this.headstart; this.refreshMenu(); });
    click('#btnWard', () => this.meta.openWard());
    this.meta = new MetaUI(this);
    click('#btnMs', () => this.meta.open('ms'));
    click('#btnUp', () => this.meta.open('up'));
    click('#btnSet', () => this.meta.open('set'));
    click('#btnSet2', () => this.meta.open('set'));
    click('#btnShare', () => this.share());
    this.lb = new Leaderboard();
    if (PORTAL) this.lb.on = false; // पोर्टल पर अपना लीडरबोर्ड नहीं (उनके नियम)
    this.lb.bind(() => {});
    click('#btnLb', () => this.lb.open());
    click('#btnLb2', () => this.lb.open());
    $('#overLb').addEventListener('click', () => this.lb.open());
    this.rw = new Rewards(this.lb, LOCAL && !PORTAL && this.lb.on); // 🎫 दुकान के इनाम — सिर्फ़ अपनी वेबसाइट पर
    this.rw.bind();
    this.rate = new Rate(this, this.lb.url, !PORTAL && this.lb.on); // ⭐ राय — सिर्फ़ अपनी वेबसाइट
    this.rate.bind();
    for (const el of document.querySelectorAll('.local')) el.hidden = !LOCAL;
    const ol = $('#orderLink'); if (ol) ol.href = ORDER_URL;
  }
  refreshMenu() {
    $('#ttl').dataset.text = T('title');
    $('#bestV').textContent = Math.floor(this.best).toLocaleString('en-IN');
    $('#totalV').textContent = Math.floor(wallet.v).toLocaleString('en-IN');
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
      const open = [['#rateS', '#rateX'], ['#wardS', '#wardClose'], ['#metaS', '#metaClose'], ['#lbS', '#lbClose'], ['#rwS', '#rwClose']].find(([w]) => $(w) && !$(w).hidden);
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
    if (this.sound.ctx && !this.sound.playing) this.sound.startMusic();
    if (!PORTAL && store('lang3') == null) $('#langS').hidden = false; // पहली बार: भाषा चुनो (फिर रोज़ का इनाम)
    else if (!skipDaily && (!PORTAL || this.runs > 0)) this.meta.maybeDaily(); // पोर्टल पर पहली बार सीधे खेल (एक क्लिक)
  }

  // अलमारी: जो पहना है (या ट्राय वाला) गोलू पर
  wearNow(of) { if (this.golu && this.golu.wear) this.golu.wear(of || wardrobe.outfit); }
  celebrate(id) {
    this.golu.dance = 2.5; this.celebT = 2.2;
    this.sound.levelUp(); this.sayKind('unlock');
    void id;
  }
  sayKind(kind) { this.sayPair(pickCheer(kind), true); }

  start() {
    $('#wardS').hidden = true; this.wardOpen = false; this.wearNow();
    $('#metaS').hidden = true; $('#dailyS').hidden = true;
    this.ms.startRun(); this.flyT = upTime('samosa');
    this.revived = false; this.runs++;
    this.mk = { st: 'off', t: 0, x: 0, y: 0, z: 4 }; this.monkey.visible = false; this.toMonkey = rand(550, 800);
    this.sound.init();
    if (!this.sound.playing) this.sound.startMusic();
    this.world.reset(!this.tutDone);
    this.p = { lane: 1, prevLane: 1, x: 0, tx: 0, y: 0, vy: 0, ground: true, roll: 0, rollQ: false, laneT: 9, big: false, stumT: 0, beesT: 0, invT: 0, slowT: 0, air: 0, fly: 0 };
    this.pu = { magnet: 0, shoes: 0, shield: false, thali: 0 };
    this.level = 0; this.samosa.visible = false; this.skyShow.reset();
    this.nightSaid = false; this.wild = 0; this.nfx.update(0, 0, 0, 0, this.world.chunks, this.cam.quaternion);
    this.rushT = 0; this.meter = 0;
    this.score = 0; this.got = 0; this.combo = 0; this.comboT = 0; this.timeScale = 1; this.slowmo = 0;
    this.speed = 14; this.runT = 0; this.perf = { t: 0, n: 0, sum: 0, done: SETTINGS.gfx !== 'auto' || this.tier >= TIERS.length - 1, prev: 0, miss: 0 };
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

  share() {
    if (!LOCAL) return;
    const s = Math.floor(this.score).toLocaleString('en-IN');
    const text = T('shareText', s);
    if (navigator.share) { navigator.share({ title: T('title'), text, url: GAME_URL }).catch(() => {}); return; }
    window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + GAME_URL), '_blank', 'noopener');
  }

  // ------------------------------------------------ खेल की घटनाएँ
  collect(it) {
    const s = SWEETS[it.type];
    const mul = this.pu.thali > 0 ? 2 : 1;
    this.got += s.pts * mul;
    this.combo = this.comboT > 0 ? this.combo + 1 : 1;
    this.comboT = 1.1;
    if (this.rushT <= 0) this.meter = Math.min(1, this.meter + s.meter);
    this.score += s.pts * 10 * mul * (this.rushT > 0 ? 2 : 1) * this.mult;
    if (this.combo > 0 && this.combo % 15 === 0) this.cheer('combo', 1000, this.combo / 15 - 1);
    this.golu.eat();
    this.msBump('sweets', this.got, true);
    if (it.type === 'rasmalai') this.msBump('rasmalai');
    this.sound.collect(this.combo - 1, it.type);
    this.world.parts.burst(it.x, it.y, it.z, SW_COL[it.type], it.type === 'rasmalai' ? 18 : 6, 2.5, 2, 0.5);
    if (it.type === 'rasmalai') this.toast('+10 ' + (LANG === 'en' ? 'Rasmalai!' : 'रसमलाई!'), 700, 'gold');
    else if (it.type === 'milkcake') this.toast('+' + s.pts * mul + ' ' + SKY_NAME[LANG === 'en' ? 'en' : 'hi'][it.type] + '!', 600, 'gold');
  }

  takePu(p) {
    p.taken = true;
    this.sound.power();
    vibrate(25);
    this.world.parts.burst(p.x, p.y, p.z, 0xffd24d, 22, 3.5, 3, 0.7);
    this.msBump('power');
    if (p.kind === 'samosa') { this.startFly(); return; }
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
    if (this.mk.st === 'chase' || this.mk.st === 'enter') this.monkeyGrab();
    if (p.beesT > 0) { this.die('caught'); return; }
    p.beesT = lerp(6, 9, this.world.diff); // आगे चलकर मधुमक्खियाँ ज़्यादा देर
    this.sound.bees(true);
    this.clean = 0;
    this.cheer('bees', 1300, -1, true, 'warn');
  }

  // ---------- बंदर ----------
  monkeyStart() {
    const p = this.p, side = Math.random() < 0.5 ? -1 : 1;
    this.mk = { st: 'enter', t: 0, side, x0: side * 6.8, y0: 5.2, z0: -3, x: side * 6.8, y: 5.2, z: -3 };
    this.monkey.visible = true; this.monkey.userData.bag.visible = false;
    this.toMonkey = rand(1000, 1500);
    this.sound.monkey();
    this.cheer('monkey', 1700, -1, true, 'warn');
  }
  monkeyGrab() {
    const n = Math.floor(this.got / 2);
    this.mk.st = 'grab'; this.mk.t = 0;
    this.monkey.userData.bag.visible = n > 0;
    if (n > 0) {
      this.got -= n;
      for (let i = 0; i < 3; i++) this.world.parts.burst(this.p.x, this.p.y + 1.2, 0.5, [0xffffff, 0x9a3b1c, 0xf2b84b][i], 10, 4, 3, 0.7, 0);
    }
    this.sound.monkey(true);
    setTimeout(() => { if (this.state === 'play') this.cheer('monkeyGrab', 1600, -1, true, 'warn', n > 0 ? `−${n} 🍬` : null); }, 350);

  }
  updateMonkey(dt) {
    const m = this.mk, M = this.monkey, p = this.p || { x: 0, y: 0 };
    if (m.st === 'off') { M.visible = false; return; }
    m.t += dt;
    const sp = this.speed || 16;
    if (this.state === 'dying' || this.state === 'over' || this.state === 'revive') { // गोलू गिरा — बंदर बैठकर हँसे
      m.x = damp(m.x, p.x + 1.1, 5, dt); m.z = damp(m.z, 1.6, 5, dt); m.y = damp(m.y, 0, 8, dt);
      animMonkey(M, dt, 'sit'); M.rotation.y = Math.PI * 0.85;
    } else if (m.st === 'enter') { // छत से कूदकर पीछे
      const k = Math.min(1, m.t / 0.9), e = k * k * (3 - 2 * k);
      m.x = lerp(m.x0, p.x + (m.side || 1) * 0.95, e); m.z = lerp(m.z0, 1.9, e); m.y = lerp(m.y0, p.gy || 0, e) + Math.sin(k * Math.PI) * 1.6;
      animMonkey(M, dt, 'leap'); M.rotation.y = 0;
      if (k >= 1) { m.st = 'chase'; m.t = 0; }
    } else if (m.st === 'chase') { // 12 सेकंड पीछे-पीछे; बचे तो इनाम
      const off = p.x > 0.5 ? -1 : p.x < -0.5 ? 1 : (m.side || 1); // गोलू के बगल में, पीछे — कैमरे में साफ़ दिखे
      m.x = damp(m.x, p.x + off * 0.95, 6, dt); m.z = 1.9 + Math.sin(m.t * 3.1) * 0.25; m.y = damp(m.y, Math.max(p.gy || 0, p.y * 0.55), 8, dt);
      animMonkey(M, dt, 'run', sp); M.rotation.y = Math.sin(m.t * 6) * 0.1;
      if (m.t > 12 || p.fly > 0 || this.rushT > 0) {
        m.st = 'flee'; m.t = 0; m.fx = m.x; m.fy = m.y; m.fz = m.z;
        if (this.state === 'play') {
          this.got += 25; this.score += 250 * this.mult;
          this.cheer('monkeyGone', 1600, -1, true, 'gold', '+25 🍬');
          this.msBump('monkeyEsc');
        }
        this.sound.monkey();
      }
    } else if (m.st === 'grab') { // गोलू पर झपट्टा
      const k = Math.min(1, m.t / 0.45);
      m.x = damp(m.x, p.x, 12, dt); m.z = lerp(1.9, 0.5, Math.sin(k * Math.PI)); m.y = (p.y || 0) + Math.sin(k * Math.PI) * 1.4;
      animMonkey(M, dt, 'grab');
      if (m.t > 0.55) { m.st = 'flee'; m.t = 0; m.fx = m.x; m.fy = m.y; m.fz = m.z; }
    } else if (m.st === 'flee') { // पोटली लेकर छत पर भागा
      const k = Math.min(1, m.t / 1.1), side = m.side || 1;
      m.x = lerp(m.fx, side * 7.2, k); m.z = m.fz + k * 4; m.y = lerp(m.fy, 5.2, k) + Math.sin(k * Math.PI) * 1.2;
      animMonkey(M, dt, k < 0.2 ? 'leap' : 'flee', sp); M.rotation.y = -side * 1.2;
      if (k >= 1) { m.st = 'off'; M.visible = false; }
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
    if (this.rushT > 0) { this.smash(e); this.score += 50 * this.mult; return; }
    if (p.invT > 0) return;
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
      roof: Math.floor(rs.roof || 0), haat: rs.haat || 0, samosa: rs.samosa || 0, near: rs.near || 0, monkeyEsc: rs.monkeyEsc || 0, rings: rs.rings || 0, jungle: Math.floor(rs.jungle || 0) });
    const bd = checkBadges();
    const parts = [];
    if (ms.setDone) parts.push(`🎉 ${T('msSet')} ${ms.setDone.set} ✔ → ×${this.ms.mult}`);
    if (ms.gain) parts.push(T('msGain', ms.gain));
    for (const b of bd) parts.push(`${b.icon} ${T('badgeNew')} ${L(b)} (+100)`);
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
    $('#overLb').hidden = true; $('#overRw').hidden = true;
    this.rate.maybeAsk();
    if (this.goldMesh) this.goldMesh.visible = false; this.goldObj = null;
    this.show(['#over']);
    this.lb.afterGame(sc, this.world.dist, this.runT, this.mult);
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
    const rdt = Math.min(this.clock.getDelta(), 1 / 20);
    this.update(rdt);
    this.sky.position.copy(this.cam.position);
    this.sky.material.uniforms.uTime.value += rdt;
    this.renderer.render(this.scene, this.cam);
  }

  // शाम/रात — आसमान, धूप, कोहरा, चमक
  applyTod(eve, night) {
    if (this.tod && Math.abs(this.tod.eve - eve) < 0.004 && Math.abs(this.tod.night - night) < 0.004) return;
    this.tod = { eve, night };
    const u = this.sky.material.uniforms; u.uEve.value = eve; u.uNight.value = night;
    tri(TOD.hor, eve, night, this.scene.fog.color);
    tri(TOD.sun, eve, night, this.sun.color); this.sun.intensity = trin(TOD.sunI, eve, night);
    tri(TOD.sky, eve, night, this.hemi.color); tri(TOD.gnd, eve, night, this.hemi.groundColor); this.hemi.intensity = trin(TOD.hemiI, eve, night);
    this.renderer.toneMappingExposure = trin(TOD.exp, eve, night);
    const fb = this.fogBase || [70, 155];
    this.scene.fog.near = fb[0] * (1 - 0.3 * night); this.scene.fog.far = fb[1] * (1 - 0.18 * night);
    if (this.lamp) this.lamp.intensity = 22 * night;
    this.scene.environment = this.envs[night > 0.5 ? 2 : eve > 0.5 ? 1 : 0];
    this.world.sweets.setTint(1 - 0.12 * eve * (1 - night) - 0.42 * night);
  }

  update(rdt) {
    const g = this.golu;
    if (this.state === 'menu' || this.state === 'loading') this.applyTod(0, 0);
    else if (this.world) { const td = timeOfDay(this.world.dist); this.applyTod(td.eve, td.night); }
    if (this.state === 'menu' || this.state === 'loading') {
      g.update(rdt, 'dance', {});
      this.world.update(rdt, 0, 14, { px: 0, py: 0, ph: H_STAND, mouth: 1.7, magnet: false, collect: () => {} });
      const t = performance.now() / 1000;
      // चौड़ी स्क्रीन पर गोलू बीच में, बटन दाईं ओर
      const wide = this.cam.aspect > 1.33 && !this.wardOpen ? 1.6 : 0;
      const wk = this.wardK = damp(this.wardK || 0, this.wardOpen ? 1 : 0, 6, rdt);
      this.cam.position.set(Math.sin(t * 0.35) * 1.2 * (1 - wk) + wide, lerp(2.4, 1.9, wk), lerp(5.4, 4.3, wk));
      this.cam.lookAt(wide, lerp(1.45, 0.35, wk), -1);
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
      if (this.state !== 'paused') { g.update(rdt, 'dead', {}); this.updateMonkey(rdt); }
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
      if (this.deathT > 1.5) this.afterDeath();
      return;
    }
    // ---------- खेल चालू ----------
    // धीमी गति (ट्यूटोरियल / बाल-बाल बचे)
    let ts = 1;
    if (this.slowmo > 0) { this.slowmo -= rdt; ts = 0.45; }
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
    this.speed = damp(this.speed, sp, 3, dt);
    this.sound.setTempo(112 + (this.speed - 14) * 1.1);
    const dz = this.speed * dt;
    // खिलाड़ी
    p.laneT += dt;
    p.x = damp(p.x, p.tx, 16, dt);
    const gy = this.world.groundAt(p.x, 0); // डिब्बे की छत / ढलान
    p.gy = gy;
    if (p.fly > 0) {
      p.fly -= dt;
      p.y = damp(p.y, FLY_Y, 2.6, dt);
      p.air = 0;
      if (Math.random() < 0.3) this.world.parts.burst(p.x + rand(-0.4, 0.4), p.y - 0.2, 1.6, Math.random() < 0.5 ? 0xffe08a : 0xff9a3d, 1, 0.5, 0.5, 0.45, 0);
      if (p.fly <= 0) this.endFly();
    } else if (p.ground && gy < p.y - 0.06) { // छत ख़त्म — नीचे गिरो
      p.ground = false; p.vy = 0;
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
        p.y = floor; p.vy = 0; p.ground = true; p.air = 0;
        if (p.rollQ) { p.roll = ROLL_T; p.rollQ = false; this.sound.roll(); }
      }
    }
    if (p.roll > 0) p.roll -= dt;
    p.stumT = Math.max(0, p.stumT - dt);
    p.invT = Math.max(0, p.invT - dt);
    if (p.beesT > 0) { p.beesT -= dt; if (p.beesT <= 0) this.sound.bees(false); }
    for (const k of ['magnet', 'shoes', 'thali']) this.pu[k] = Math.max(0, this.pu[k] - dt);
    if (this.rushT > 0) {
      this.rushT -= dt;
      this.meter = Math.max(0, this.rushT / 6);
      if (this.rushT <= 0) { this.meter = 0; p.invT = 1.0; }
    }
    this.comboT -= dt;
    // दुनिया
    this.world.update(dt, dz, this.speed, this.ctx());
    {
      const td = this.tod || { eve: 0, night: 0 }, zn = this.world.zone;
      this.wild = damp(this.wild, zn === 'jungle' ? 1 : zn === 'fields' ? 0.7 : 0, 1.5, dt);
      this.nfx.update(rdt, dz, td.night, this.wild, this.world.chunks, this.cam.quaternion);
      this.lamp.position.set(this.p.x, 3.2 + this.p.y, -3);
      if (td.night > 0.6 && !this.nightSaid) { this.nightSaid = true; this.zoneBanner('🌙', T('zNight')); this.cheer('night', 1700, -1, true); }
      else if (td.night < 0.2 && this.nightSaid) { this.nightSaid = false; this.zoneBanner('🌅', T('zDawn')); this.cheer('dawn', 1700, -1, true); }
      if (zn === 'jungle') this.msBump('jungle', dz);
    }
    while (this.world.events.length) { const ev = this.world.events.shift(); if (ev === 'haat' || ev === 'mela') this.sound.levelUp(); else if (ev === 'baraat') this.sound.baraat(); else if (ev === 'rail') this.sound.train(); this.cheer(ev, 1800, -1, true); if (ev === 'haat') this.msBump('haat'); const ZB = { jungle: ['🌳', 'zJungle'], fields: ['🌼', 'zFields'], village: ['🏡', 'zVillage'] }; if (ZB[ev]) this.zoneBanner(ZB[ev][0], T(ZB[ev][1])); }
    this.collide();
    this.updateGold(dz);
    this.score += dz * (this.rushT > 0 ? 2 : 1) * this.mult;
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
    const flip = !p.ground && p.big ? clamp(p.air / (2 * SHOE_V / -GRAV), 0, 1) : null;
    g.update(dt, mode, { speed: this.speed, y: p.y, gy, big: this.rushT > 0, shield: this.pu.shield, flip });
    g.root.position.set(p.x, p.y, 0);
    g.root.rotation.z = (p.tx - p.x) * -0.06;
    // उड़ान का अंदाज़: उठते समय पूरी कलाबाज़ी, बीच-बीच में घूमकर मुस्कान दिखाए
    let roll = 0, twirl = 0;
    if (p.fly > 0) {
      const ft = this.flyT - p.fly, e = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
      roll = ft < 1.1 ? e(ft / 1.1) * Math.PI * 2 : 0;
      for (const t0 of [3.3, 6.2]) if (ft > t0 && ft < t0 + 0.8) twirl = e((ft - t0) / 0.8) * Math.PI * 2;
    }
    g.root.rotation.z += roll; g.root.rotation.y = twirl;
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
    g.setGlow(this.rushT > 0 ? 0.6 + Math.sin(this.runT * 14) * 0.25 : p.invT > 0 ? (Math.sin(this.runT * 30) > 0 ? 0.5 : 0) : 0);
    if (this.rushT > 0 && Math.random() < 0.5) this.world.parts.burst(p.x + rand(-0.6, 0.6), rand(0.4, 2.2), 0.6, Math.random() < 0.5 ? 0xffd24d : 0xff8a3d, 1, 1, 1, 0.4, 0);
    if (this.hsT > 0) { this.hsT -= dt; if (this.hsT <= 0 && p.fly <= 0) this.startFly(); }
    const fx = g.fx;
    if (fx && p.fly <= 0) {
      if (fx === 'dust' && p.ground && Math.random() < 0.35) this.world.parts.burst(p.x + rand(-0.2, 0.2), p.y + 0.12, 0.5, 0xd9c7a8, 2, 0.8, 0.8, 0.45, 0);
      else if (fx === 'sparkle' && p.ground && Math.random() < 0.4) this.world.parts.burst(p.x + rand(-0.25, 0.25), p.y + 0.15, 0.4, Math.random() < 0.5 ? 0xffd24d : 0xfff2b0, 2, 1.2, 1.5, 0.5, 0);
      else if (fx === 'trail' && Math.random() < 0.55) this.world.parts.burst(p.x + rand(-0.3, 0.3), p.y + rand(0.6, 1.6), 0.9, [0xffd24d, 0xd8457f, 0x7fd3ff, 0xffffff][Math.floor(Math.random() * 4)], 1, 0.4, 0.6, 0.7, 0);
    }
    this.toMonkey -= dz;
    if (this.toMonkey <= 0 && this.mk.st === 'off' && p.fly <= 0 && this.world.railObs <= 0 && this.world.melaObs <= 0 && this.rushT <= 0 && p.invT <= 0) this.monkeyStart();
    this.updateMonkey(dt);
    this.updateBees(dt);
    this.updateCam(rdt);
    this.updateHud();
    this.autoQuality(rdt);
  }

  ctx() {
    const p = this.p || { x: 0, y: 0, roll: 0 };
    return {
      px: p.x, py: p.y, ph: p.roll > 0 ? H_ROLL : H_STAND, mouth: 1.75,
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
    const fov = v.fov + (this.speed - 14) * 0.28 + (this.rushT > 0 ? 6 : 0);
    if (Math.abs(this.cam.fov - fov) > 0.05) { this.cam.fov = damp(this.cam.fov, fov, 4, dt); this.cam.updateProjectionMatrix(); }
    this.shake = Math.max(0, this.shake - dt * 1.6);
    const sh = this.shake * this.shake;
    const fk = clamp(p.y / FLY_Y, 0, 1) * (p.fly > 0 || p.y > 3 ? 1 : 0);
    this.flyK = damp(this.flyK || 0, fk, 3, dt);
    const cy = p.y * (0.35 + 0.55 * this.flyK), ly = p.y * (0.3 + 0.62 * this.flyK);
    this.cam.position.set(this.camX + rand(-sh, sh), v.y + cy + this.flyK * 0.6 + rand(-sh, sh), v.z + this.flyK * 1.2);
    this.cam.lookAt(this.camX * 1.2, v.ly + ly, v.lz);
    if (this.flyK > 0.01) this.cam.rotateZ((p.tx - p.x) * 0.035 * this.flyK);
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
      const teach = ready && store('tutRush') !== '1';
      $('#btnRush').classList.toggle('teach', teach);
      if (teach) requestAnimationFrame(() => this.bubble($('#btnRush'), '👇 ' + T('tutRush'), 6000)); else if (!ready) this.bubble(null);
    }
    const rush = this.rushT > 0;
    if (h.rush !== rush) { h.rush = rush; document.body.classList.toggle('rushing', rush); }
    const pu = (this.pu.magnet > 0 ? 'm' + Math.ceil(this.pu.magnet) : '') + (this.pu.shoes > 0 ? 's' + Math.ceil(this.pu.shoes) : '') + (this.pu.shield ? 'L' : '') + (this.pu.thali > 0 ? 't' + Math.ceil(this.pu.thali) : '') + (this.p.fly > 0 ? 'f' + Math.ceil(this.p.fly) : '');
    if (h.pu !== pu) {
      h.pu = pu;
      const box = $('#pu');
      box.innerHTML = '';
      const chip = (icon, name, sec) => { const d = document.createElement('div'); d.className = 'chip'; d.innerHTML = `<b>${icon}</b><span>${name}</span>${sec ? `<em>${sec}</em>` : ''}`; box.appendChild(d); };
      if (this.pu.magnet > 0) chip('🎁', T('magnet'), Math.ceil(this.pu.magnet));
      if (this.pu.shoes > 0) chip('🌀', T('shoes'), Math.ceil(this.pu.shoes));
      if (this.pu.shield) chip('🟠', T('shield'), '');
      if (this.pu.thali > 0) chip('✖️2', T('thali'), Math.ceil(this.pu.thali));
      if (this.p.fly > 0) chip('🔺', T('samosaS'), Math.ceil(this.p.fly));
    }
  }

  autoQuality(dt) {
    const q = this.perf;
    if (q.done) return;
    q.t += dt; q.n++; q.sum += dt;
    if (q.t < 2) return;
    const avg = q.sum / q.n;
    q.t = 0; q.n = 0; q.sum = 0;
    if (avg <= 1 / 45) { q.prev = 0; return; } // ठीक चल रहा — देखते रहो (आगे भारी जगह आ सकती है)
    // पिछली बार घटाने से फ़ायदा नहीं हुआ (जैसे फ़ोन ख़ुद 30fps पर बँधा हो) — दो बार ऐसा हो तो रुक जाओ
    if (q.prev && avg > q.prev * 0.93) { if (++q.miss >= 2) { q.done = true; return; } } else q.miss = 0;
    q.prev = avg;
    if (this.tier >= TIERS.length - 1) { q.done = true; return; }
    this.setTier(this.tier + 1);
    store('gfxTier', this.tier);
  }

}

const game = new Game();
window.__game = game;
// टेस्ट: तय समय-कदमों में आगे बढ़ाओ (धीमे कंप्यूटर पर भी एक जैसा)
game.sim = (sec, fn) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { if (fn) fn(game); game.update(1 / 60); } game.renderer.render(game.scene, game.cam); };
game.boot();
