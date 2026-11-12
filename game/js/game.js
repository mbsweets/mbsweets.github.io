// रसगुल्ला रन — मुख्य खेल (MB Sweets, दरभंगा)
import * as THREE from './three.module.min.js';
import { loadTextures } from './art.js';
import { buildRealTextures, makeSky, makeEnv, shadows, SUN, HORIZON } from './real.js';
import { makeBees, makeSkyline, makeSamosaMount, SWEETS } from './models.js';
import { Golu as GoluCode } from './golu.js';
import { Golu as Golu3D, loadGolu } from './golu3d.js';
import { World, LANES } from './world.js';
import { SkyShow } from './skyshow.js';
import { Leaderboard } from './lb.js';
import { Sound } from './audio.js';
import { T, LANG, setLang, applyLang } from './i18n.js';
import { clamp, lerp, damp, rand, store, storeNum, vibrate } from './util.js';

const $ = (s) => document.querySelector(s);
const GRAV = -36, JUMP_V = 11.6, SHOE_V = 16.2, ROLL_T = 0.62, H_STAND = 1.75, H_ROLL = 0.9, HALF_W = 0.38;
const LOCAL = /mbsweets\.github\.io$|^127\.0\.0\.1$|^localhost$/.test(location.hostname) || /[?&]shop=1/.test(location.search);
const GAME_URL = 'https://mbsweets.github.io/game/';
const ORDER_URL = 'https://mbsweets.github.io/mb-sweets/order/';
const PU_TIME = { magnet: 10, shoes: 10, thali: 15 };
const FLY_T = 8.5, FLY_Y = 10.5;
// लेवल — दूरी (मीटर) से; रफ़्तार हर लेवल में बढ़े
const LEVELS = [0, 350, 1100, 2200, 3600];
const SPEED_PTS = [[0, 13.5], [350, 16.5], [1100, 21.5], [2200, 26.5], [3600, 31], [6000, 35], [9000, 37.5]];
// दिन → शाम → रात → भोर (दूरी से, 7600 मीटर का चक्र)
function timeOfDay(d) {
  const x = d % 7600, r = (a, b) => clamp((x - a) / (b - a), 0, 1);
  if (x < 6600) return { eve: r(2400, 3000), night: r(3600, 4200) };
  const k = 1 - r(6600, 7600); return { eve: k, night: k };
}
const TOD = {
  hor: [new THREE.Color(0.93, 0.82, 0.66), new THREE.Color(0.82, 0.48, 0.26), new THREE.Color(0.13, 0.1, 0.2)],
  sun: [new THREE.Color(0xfff0d8), new THREE.Color(0xffad6a), new THREE.Color(0x8fa6ff)], sunI: [3.0, 2.2, 0.7],
  sky: [new THREE.Color(0xcfe3ff), new THREE.Color(0xffc9a0), new THREE.Color(0x6a7ac0)], gnd: [new THREE.Color(0x9a7a5a), new THREE.Color(0x8a5a40), new THREE.Color(0x30283a)], hemiI: [0.6, 0.42, 0.7],
  exp: [1.45, 1.22, 1.5],
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
// शाबाशी: बड़ा अंग्रेज़ी शब्द (सब समझें) + हिंदी मोड में नीचे छोटा मैथिली
const CHEER = {
  near: [['Nice!', 'बाह!'], ['Wow!', 'गज़ब!'], ['Close one!', 'बाल-बाल बचलहुँ!'], ['Smart!', 'की बात!']],
  combo: [['Good!', 'नीक!'], ['Great!', 'बड़ नीक!'], ['Excellent!', 'गज़ब!'], ['Awesome!', 'जबरदस्त!'], ['Superb!', 'धुआँधार!'], ['Unstoppable!', 'जय मिथिला!']],
  level: [['Well Done!', 'बाह रे गोलू!'], ['Fantastic!', 'की बात!'], ['Brilliant!', 'जय मिथिला!']],
  ring: [['Perfect!', 'सोनाक छल्ला!']],
};
const SW_COL = { rasgulla: 0xffffff, gulabjamun: 0x9a3b1c, balushahi: 0xf2b84b, chamcham: 0xff8fb1, rasmalai: 0xffd24d, jalebi: 0xf39a1e, laddoo: 0xf7a21b, peda: 0xd9b07a, kalakand: 0xf3e2b0, milkcake: 0xc58a3e };
const SKY_NAME = { hi: { jalebi: 'जलेबी', laddoo: 'लड्डू', peda: 'पेड़ा', kalakand: 'कलाकंद', milkcake: 'मिल्क केक' }, en: { jalebi: 'Jalebi', laddoo: 'Laddoo', peda: 'Peda', kalakand: 'Kalakand', milkcake: 'Milk Cake' } };

class Game {
  constructor() {
    this.sound = new Sound();
    this.state = 'loading';
    this.best = storeNum('best');
    this.total = storeNum('total');
    this.tutDone = store('tut') === '1';
  }

  async boot() {
    applyLang();
    const bar = $('#loadbar i');
    try {
      await Promise.all([loadTextures((p) => { bar.style.width = (p * 80) + '%'; }), document.fonts ? document.fonts.ready : null,
        loadGolu().then(() => { this.has3d = true; }, (e) => { console.warn('golu3d', e); })]);
      buildRealTextures();
    } catch (e) {
      $('#loadmsg').textContent = 'Error: ' + e;
      return;
    }
    this.setup();
    bar.style.width = '100%';
    this.toMenu();
    $('#loading').hidden = true;
    this.clock = new THREE.Clock();
    this.frame();
  }

  setup() {
    const canvas = $('#c');
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
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
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.bindInput();
    this.bindUI();
    this.camX = 0; this.shake = 0;
    this.world.reset(false);
    // पहला फ़्रेम पहले से (shader compile) — शुरू में अटके नहीं
    r.compile(sc, this.cam);
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
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'play') this.pause(); });
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
        this.sound.jump(big);
      } else if (p.roll > 0) p.roll = 0;
    } else if (a === 'down') {
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
    const click = (sel, fn) => $(sel).addEventListener('click', (e) => { e.preventDefault(); this.sound.init(); this.sound.click(); fn(); });
    click('#btnPlay', () => this.start());
    click('#btnAgain', () => this.start());
    click('#btnHome', () => this.toMenu());
    click('#btnHome2', () => this.toMenu());
    click('#btnPause', () => this.pause());
    click('#btnResume', () => this.resume());
    click('#btnRush', () => this.startRush());
    click('#btnLang', () => { setLang(LANG === 'hi' ? 'en' : 'hi'); this.refreshMenu(); });
    click('#btnSound', () => { this.sound.setMuted(!this.sound.muted); this.refreshMenu(); });
    click('#btnShare', () => this.share());
    this.lb = new Leaderboard();
    this.lb.bind(() => {});
    click('#btnLb', () => this.lb.open());
    click('#btnLb2', () => this.lb.open());
    $('#overLb').addEventListener('click', () => this.lb.open());
    for (const el of document.querySelectorAll('.local')) el.hidden = !LOCAL;
    $('#orderLink').href = ORDER_URL;
  }
  refreshMenu() {
    $('#ttl').dataset.text = T('title');
    $('#bestV').textContent = Math.floor(this.best).toLocaleString('en-IN');
    $('#totalV').textContent = Math.floor(this.total).toLocaleString('en-IN');
    $('#btnSound').textContent = '🔊 ' + T('sound') + ': ' + (this.sound.muted ? T('off') : T('on'));
    $('#btnLang').textContent = '🌐 ' + T('lang');
    $('#keysTip').hidden = matchMedia('(pointer: coarse)').matches;
  }
  show(id) {
    for (const s of ['#menu', '#over', '#pauseS', '#hud']) $(s).hidden = true;
    for (const s of id) $(s).hidden = false;
  }

  toMenu() {
    this.state = 'menu';
    this.show(['#menu']);
    this.refreshMenu();
    this.world.reset(false);
    this.golu.root.position.set(0, 0, 0);
    this.golu.root.rotation.y = Math.PI;
    this.golu.setGlow(0);
    this.samosa.visible = false;
    this.sound.bees(false);
    this.beeC.set(0, 2, 18);
    if (this.sound.ctx && !this.sound.playing) this.sound.startMusic();
  }

  start() {
    this.sound.init();
    if (!this.sound.playing) this.sound.startMusic();
    this.world.reset(!this.tutDone);
    this.p = { lane: 1, prevLane: 1, x: 0, tx: 0, y: 0, vy: 0, ground: true, roll: 0, rollQ: false, laneT: 9, big: false, stumT: 0, beesT: 0, invT: 0, slowT: 0, air: 0, fly: 0 };
    this.pu = { magnet: 0, shoes: 0, shield: false, thali: 0 };
    this.level = 0; this.samosa.visible = false; this.skyShow.reset();
    this.rushT = 0; this.meter = 0;
    this.score = 0; this.got = 0; this.combo = 0; this.comboT = 0; this.timeScale = 1; this.slowmo = 0;
    this.speed = 14; this.runT = 0; this.perf = { t: 0, n: 0, sum: 0 };
    this.golu.root.rotation.y = 0;
    this.golu.setGlow(0);
    this.show(['#hud']);
    $('#hint').hidden = true;
    this.hud = {};
    this.state = 'play';
    this.toast(T('gotIt'), 700);
  }

  pause() {
    if (this.state !== 'play') return;
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
  }

  toast(txt, ms = 900, cls = '') {
    const t = $('#toast');
    t.textContent = txt;
    t.className = 'show ' + cls;
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { t.className = ''; }, ms);
  }

  share() {
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
    this.score += s.pts * 10 * mul * (this.rushT > 0 ? 2 : 1);
    if (this.combo > 0 && this.combo % 15 === 0) this.cheer('combo', 1000, this.combo / 15 - 1);
    this.golu.eat();
    this.sound.collect(this.combo - 1, it.type);
    this.world.parts.burst(it.x, it.y, it.z, SW_COL[it.type], it.type === 'rasmalai' ? 18 : 6, 2.5, 2, 0.5);
    if (it.type === 'rasmalai') this.toast('+10 ' + (LANG === 'hi' ? 'रसमलाई!' : 'Rasmalai!'), 700, 'gold');
    else if (it.type === 'milkcake') this.toast('+' + s.pts * mul + ' ' + SKY_NAME[LANG === 'hi' ? 'hi' : 'en'][it.type] + '!', 600, 'gold');
  }

  takePu(p) {
    p.taken = true;
    this.sound.power();
    vibrate(25);
    this.world.parts.burst(p.x, p.y, p.z, 0xffd24d, 22, 3.5, 3, 0.7);
    if (p.kind === 'samosa') { this.startFly(); return; }
    if (p.kind === 'shield') this.pu.shield = true; else this.pu[p.kind] = PU_TIME[p.kind];
    this.toast(T(p.kind), 900, 'gold');
  }

  // उड़न समोसा: 8 सेकंड आसमान में, ऊपर मिठाइयाँ; उतरते समय कवच
  startFly() {
    const p = this.p;
    p.fly = FLY_T; p.ground = false; p.vy = 0; p.roll = 0; p.rollQ = false; p.big = false;
    this.samosa.visible = true;
    this.sound.fly(true);
    vibrate([30, 40, 60]);
    this.toast(T('samosa'), 1400, 'rush');
    this.shake = 0.2;
    this.skyShow.start(FLY_Y, this.world.skyTrail(FLY_T, this.speed, FLY_Y, p.lane));
  }
  endFly() {
    const p = this.p;
    p.fly = 0; p.vy = 2; p.invT = 2.2;
    this.sound.fly(false);
    this.skyShow.stop();
    this.world.clearNear(-34, 4);
  }

  cheer(kind = 'near', ms = 900, tier = -1) {
    const L = CHEER[kind] || CHEER.near;
    const [en, mai] = tier >= 0 ? L[Math.min(tier, L.length - 1)] : L[Math.floor(Math.random() * L.length)];
    const t = $('#toast');
    t.innerHTML = en + (LANG === 'hi' ? `<small>${mai}</small>` : '');
    t.className = 'show cheer';
    clearTimeout(this.toastT);
    this.toastT = setTimeout(() => { t.className = ''; }, ms);
  }

  levelUp(n) {
    this.level = n;
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
    this.sound.rush();
    vibrate(60);
    this.toast(T('rush'), 1200, 'rush');
    this.shake = 0.25;
  }

  stumble() {
    const p = this.p;
    vibrate(45);
    this.sound.bump();
    this.shake = Math.max(this.shake, 0.3);
    this.meter = Math.max(0, this.meter - 0.25);
    p.stumT = 0.55;
    if (p.beesT > 0) { this.die('caught'); return; }
    p.beesT = 6;
    this.sound.bees(true);
    this.toast(T('bees'), 1100, 'warn');
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
    if (this.rushT > 0) { this.smash(e); this.score += 50; return; }
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
      this.toast(T('shieldUsed'), 1200, 'gold');
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
    this.sound.bees(false);
    const sc = Math.floor(this.score);
    const nb = sc > this.best;
    if (nb) { this.best = sc; store('best', sc); }
    this.total += this.got;
    store('total', this.total);
    store('plays', storeNum('plays') + 1);
    $('#overTitle').textContent = this.cause === 'caught' ? T('caught') : T('crashed');
    $('#overScore').textContent = sc.toLocaleString('en-IN');
    $('#overSweets').textContent = this.got.toLocaleString('en-IN');
    $('#overBest').textContent = Math.floor(this.best).toLocaleString('en-IN');
    $('#newBest').hidden = !nb;
    $('#overLb').hidden = true;
    this.show(['#over']);
    this.lb.afterGame(sc, this.world.dist, this.runT);
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
      const wide = this.cam.aspect > 1.33 ? 1.6 : 0;
      this.cam.position.set(Math.sin(t * 0.35) * 1.2 + wide, 2.4, 5.4);
      this.cam.lookAt(wide, 1.45, -1);
      return;
    }
    if (this.state !== 'play' && this.state !== 'paused') this.skyShow.update(rdt, 0, 0, 0, this.cam.position);
    if (this.state === 'paused' || this.state === 'over') {
      if (this.state === 'over') g.update(rdt, 'dead', {});
      this.updateBees(rdt);
      return;
    }
    if (this.state === 'dying') {
      this.deathT += rdt;
      g.update(rdt, 'dead', { y: this.p.y });
      this.p.y = Math.max(0, this.p.y + this.p.vy * rdt); this.p.vy += GRAV * rdt;
      g.root.position.y = this.p.y;
      this.world.update(rdt, 0, 0, this.ctx());
      this.updateBees(rdt);
      this.updateCam(rdt);
      if (this.deathT > 1.5) this.gameOver();
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
    while (this.world.events.length) { const ev = this.world.events.shift(); if (ev === 'haat') { this.toast(T('haat'), 1500, 'cheer'); this.sound.levelUp(); } else if (ev === 'mela') { this.toast(T('mela'), 1800, 'cheer'); this.sound.levelUp(); } else if (ev === 'baraat') { this.toast(T('baraat'), 1600, 'cheer'); this.sound.baraat(); } else if (ev === 'rail') { this.toast(T('rail'), 1600, 'cheer'); this.sound.train(); } }
    this.collide();
    this.score += dz * (this.rushT > 0 ? 2 : 1);
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
      const ft = FLY_T - p.fly, e = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
      roll = ft < 1.1 ? e(ft / 1.1) * Math.PI * 2 : 0;
      for (const t0 of [3.3, 6.2]) if (ft > t0 && ft < t0 + 0.8) twirl = e((ft - t0) / 0.8) * Math.PI * 2;
    }
    g.root.rotation.z += roll; g.root.rotation.y = twirl;
    const hits = this.skyShow.update(dt, dz, p.x, p.y, this.cam.position);
    if (hits) {
      this.score += 100 * hits; this.got += 3 * hits;
      this.sound.ring(); vibrate(20);
      this.world.parts.burst(p.x, p.y + 1, -0.5, 0xffd24d, 26, 5, 4, 0.8, 0);
      this.cheer('ring', 800);
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
      if (e.kind === 'ramp') { e.px = ox; e.pz = oz; continue; }
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
          this.score += 25;
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
        if (e.need === 'roll') { this.tutDone = true; store('tut', 1); setTimeout(() => { if (this.state === 'play') this.toast(T('tip'), 2800); }, 900); }
        e.need = null;
        continue;
      }
      need = e.need;
    }
    const h = $('#hint');
    if (need) {
      if (this.hud.hint !== need) { h.textContent = T(need); h.dataset.k = need; this.hud.hint = need; }
      h.hidden = false;
    } else if (!h.hidden) { h.hidden = true; this.hud.hint = null; }
    return need;
  }

  updateBees(dt) {
    const p = this.p || { x: 0, y: 0, beesT: 0 };
    let tx = p.x, ty = 2.2, tz = 18;
    if (this.state === 'dying' || this.state === 'over') { ty = 1.7; tz = 0.4; }
    else if (p.beesT > 0) { ty = p.y + 1.7; tz = 2.4; }
    this.beeC.x = damp(this.beeC.x, tx, 6, dt); this.beeC.y = damp(this.beeC.y, ty, 6, dt); this.beeC.z = damp(this.beeC.z, tz, 4, dt);
    const t = performance.now() / 1000;
    const close = this.state === 'dying' || this.state === 'over';
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
    const cb = this.comboT > 0 && this.combo >= 5 ? this.combo : 0;
    if (h.cb !== cb) { h.cb = cb; const el = $('#combo'); el.hidden = !cb; el.textContent = '×' + cb + ' ' + T('combo'); }
    const m = Math.round(this.meter * 100);
    if (h.m !== m) { h.m = m; $('#meter i').style.width = m + '%'; }
    const ready = this.meter >= 1 && this.rushT <= 0;
    if (h.ready !== ready) { h.ready = ready; $('#btnRush').hidden = !ready; $('#meter').classList.toggle('full', ready); }
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
    if (q.t > 4) {
      const avg = q.sum / q.n;
      if (avg > 1 / 40 && this.pr > 1) {
        this.pr = Math.max(1, this.pr * 0.72);
        this.renderer.setPixelRatio(this.pr);
        this.resize();
        q.t = 0; q.n = 0; q.sum = 0;
      } else if (avg > 1 / 40 && this.renderer.shadowMap.enabled) {
        // फिर भी धीमा — परछाईं बंद (कमज़ोर फ़ोन)
        this.renderer.shadowMap.enabled = false;
        this.sun.castShadow = false;
        this.golu.shadow.material.opacity = 0.28;
        this.scene.traverse((o) => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; });
        q.t = 0; q.n = 0; q.sum = 0;
      } else q.done = true;
    }
  }
}

const game = new Game();
window.__game = game;
// टेस्ट: तय समय-कदमों में आगे बढ़ाओ (धीमे कंप्यूटर पर भी एक जैसा)
game.sim = (sec, fn) => { const n = Math.round(sec * 60); for (let i = 0; i < n; i++) { if (fn) fn(game); game.update(1 / 60); } game.renderer.render(game.scene, game.cam); };
game.boot();
