// आवाज़ — सब कोड से बनी (अपनी धुन): ढोलक, मंजीरा, तानपुरा, बाँसुरी, शहनाई जैसी
import { store } from './util.js';

const BHUP = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24]; // भूपाली (सा रे ग प ध)
const f = (semi, base = 523.25) => base * Math.pow(2, semi / 12);

// धुन: [step(16वाँ), सुर(सेमीटोन, C5 से), लंबाई(steps)] — 4 बार = 64 steps
const MEL_A = [[0, 7, 2], [2, 9, 2], [4, 12, 4], [8, 9, 2], [10, 7, 2], [12, 4, 4], [16, 2, 2], [18, 4, 2], [20, 7, 2], [22, 9, 2], [24, 7, 8],
  [32, 12, 2], [34, 14, 2], [36, 16, 4], [40, 14, 2], [42, 12, 2], [44, 9, 4], [48, 7, 2], [50, 9, 2], [52, 12, 2], [54, 14, 2], [56, 12, 8]];
const MEL_B = [[0, 16, 2], [2, 14, 2], [4, 12, 2], [6, 14, 2], [8, 16, 4], [12, 19, 4], [16, 16, 2], [18, 14, 2], [20, 12, 4], [24, 9, 4], [28, 12, 4],
  [32, 7, 2], [34, 9, 2], [36, 12, 2], [38, 9, 2], [40, 7, 4], [44, 4, 4], [48, 2, 2], [50, 4, 2], [52, 7, 4], [56, 0, 8]];

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = store('mute') === '1';
    this.playing = false;
    this.bpm = 112;
    this.step = 0;
    this.bar = 0;
  }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = this.ctx = new AC();
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.85; this.master.connect(ctx.destination);
    this.mus = ctx.createGain(); this.mus.gain.value = 0.5; this.mus.connect(this.master);
    this.fx = ctx.createGain(); this.fx.gain.value = 0.75; this.fx.connect(this.master);
    const len = ctx.sampleRate;
    const b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = b;
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) this.ctx.suspend(); else if (this.playing || this.wantResume) this.ctx.resume();
    });
  }
  setMuted(m) {
    this.muted = m;
    store('mute', m ? 1 : 0);
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
  }
  // ---------- बुनियादी आवाज़ें ----------
  tone(freq, t, dur, { type = 'sine', vol = 0.3, att = 0.005, to = null, dest = this.fx, vib = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
    if (vib) {
      const l = c.createOscillator(), lg = c.createGain();
      l.frequency.value = 5.5; lg.gain.value = freq * 0.012 * vib;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.1);
    }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + att);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  }
  hiss(t, dur, { vol = 0.2, type = 'bandpass', fq = 1500, q = 1, to = null, dest = this.fx } = {}) {
    const c = this.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
    s.buffer = this.noise;
    fl.type = type; fl.frequency.setValueAtTime(fq, t); fl.Q.value = q;
    if (to) fl.frequency.exponentialRampToValueAtTime(to, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(fl); fl.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  // ---------- संगीत ----------
  startMusic() {
    if (!this.ctx || this.playing) return;
    this.playing = true;
    this.next = this.ctx.currentTime + 0.08;
    this.step = 0; this.bar = 0;
    const c = this.ctx;
    // तानपुरा (धीमी गूँज)
    this.drone = [];
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 650; lp.Q.value = 0.7;
    const dg = c.createGain(); dg.gain.value = 0.0001; dg.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 1.5);
    lp.connect(dg); dg.connect(this.mus);
    for (const fr of [130.81, 196.0, 261.63]) { const o = c.createOscillator(); o.type = 'sawtooth'; o.frequency.value = fr * (1 + (Math.random() - 0.5) * 0.004); o.connect(lp); o.start(); this.drone.push(o); }
    this.droneG = dg;
    this.timer = setInterval(() => this.schedule(), 25);
  }
  stopMusic() {
    if (!this.playing) return;
    this.playing = false;
    clearInterval(this.timer);
    const t = this.ctx.currentTime;
    this.droneG.gain.setTargetAtTime(0.0001, t, 0.15);
    for (const o of this.drone) o.stop(t + 0.6);
  }
  setTempo(bpm) { this.bpm = bpm; }
  schedule() {
    const c = this.ctx;
    while (this.next < c.currentTime + 0.12) {
      this.playStep(this.step, this.next);
      this.next += 60 / this.bpm / 4;
      this.step = (this.step + 1) % 64;
      if (this.step === 0) this.bar++;
    }
  }
  playStep(s, t) {
    const b = s % 16, m = this.mus;
    // ढोलक: धा (भारी) / ता (हल्का)
    if (b === 0 || b === 7 || b === 10) { this.tone(140, t, 0.28, { vol: 0.55, to: 52, dest: m }); this.hiss(t, 0.05, { vol: 0.08, fq: 900, dest: m }); }
    if (b === 4 || b === 12) this.hiss(t, 0.11, { vol: 0.28, fq: 2100, q: 3, dest: m });
    if (b === 2 || b === 6 || b === 14) this.hiss(t, 0.06, { vol: 0.09, fq: 2600, q: 3, dest: m });
    // मंजीरा
    if (b % 4 === 2) { this.tone(3150, t, 0.16, { type: 'triangle', vol: 0.035, dest: m }); this.hiss(t, 0.05, { vol: 0.05, type: 'highpass', fq: 7000, dest: m }); }
    // बाँसुरी
    const mel = this.bar % 4 < 2 ? MEL_A : MEL_B;
    for (const [st, n, len] of mel) {
      if (st === s) {
        const dur = len * 60 / this.bpm / 4;
        this.tone(f(n), t, dur * 0.95, { type: 'sine', vol: 0.13, att: 0.03, dest: m, vib: 1 });
        this.tone(f(n) * 2, t, dur * 0.6, { type: 'triangle', vol: 0.025, att: 0.03, dest: m });
      }
    }
  }
  // ---------- खेल की आवाज़ें ----------
  now() { return this.ctx ? this.ctx.currentTime : 0; }
  ok() { return this.ctx && !this.muted; }
  collect(combo, type) {
    if (!this.ok()) return;
    const t = this.now(), i = Math.min(combo, BHUP.length - 1);
    const fr = f(BHUP[i], 659.25);
    this.tone(fr, t, 0.12, { vol: 0.16, type: 'sine' });
    this.tone(fr * 1.5, t + 0.02, 0.1, { vol: 0.05, type: 'triangle' });
    if (type === 'rasmalai' || type === 'chamcham') { for (let k = 0; k < 4; k++) this.tone(f(BHUP[k + 3], 659.25), t + 0.05 + k * 0.045, 0.12, { vol: 0.08 }); }
  }
  jump(big) { if (!this.ok()) return; const t = this.now(); this.tone(big ? 260 : 320, t, big ? 0.35 : 0.2, { vol: 0.18, to: big ? 900 : 720, type: 'triangle' }); }
  roll() { if (!this.ok()) return; this.hiss(this.now(), 0.25, { vol: 0.18, fq: 1800, to: 300, q: 0.8 }); }
  lane() { if (!this.ok()) return; this.hiss(this.now(), 0.1, { vol: 0.12, fq: 900, to: 2600, q: 1.2 }); }
  bump() { if (!this.ok()) return; const t = this.now(); this.tone(180, t, 0.25, { vol: 0.3, to: 90, type: 'square' }); this.hiss(t, 0.12, { vol: 0.2, fq: 600 }); }
  crash() {
    if (!this.ok()) return;
    const t = this.now();
    this.hiss(t, 0.5, { vol: 0.45, type: 'lowpass', fq: 1600, to: 200 });
    this.tone(110, t, 0.5, { vol: 0.5, to: 40 });
    this.tone(520, t + 0.15, 0.7, { vol: 0.14, to: 130, type: 'sawtooth' });
  }
  power() { if (!this.ok()) return; const t = this.now(); [0, 4, 7, 12, 16].forEach((n, k) => this.tone(f(n, 523.25), t + k * 0.06, 0.18, { vol: 0.13, type: 'triangle' })); }
  shieldBreak() { if (!this.ok()) return; const t = this.now(); this.hiss(t, 0.35, { vol: 0.3, fq: 3000, to: 500 }); this.tone(880, t, 0.3, { vol: 0.12, to: 220, type: 'triangle' }); }
  rush() {
    if (!this.ok()) return;
    const t = this.now();
    // शहनाई जैसा
    [[0, 0.12], [4, 0.12], [7, 0.12], [12, 0.4], [9, 0.12], [12, 0.5]].reduce((tt, [n, d]) => {
      this.tone(f(n, 523.25), tt, d, { type: 'sawtooth', vol: 0.09, att: 0.02, vib: 2 });
      return tt + d;
    }, t);
  }
  // बारात — ढोल की थाप + शहनाई की धुन (~5 सेकंड)
  baraat() {
    if (!this.ok()) return;
    const t0 = this.now(), bt = 0.16;
    for (let i = 0; i < 30; i++) {
      const t = t0 + i * bt;
      if (i % 4 === 0 || i % 4 === 3) this.tone(i % 8 === 0 ? 85 : 110, t, 0.18, { vol: 0.34, to: 50 });
      if (i % 2 === 1) this.hiss(t, 0.05, { vol: 0.1, fq: 3200 });
    }
    const mel = [[7, 2], [9, 1], [11, 1], [12, 2], [11, 1], [9, 1], [7, 2], [4, 2], [7, 2], [9, 2], [7, 4]];
    mel.reduce((tt, [n, d]) => { this.tone(f(n, 440), tt, d * bt * 0.95, { type: 'sawtooth', vol: 0.065, att: 0.02, vib: 3 }); return tt + d * bt; }, t0 + 0.32);
  }
  // सुनहरा छल्ला — घंटी जैसी चमक
  ring() { if (!this.ok()) return; const t = this.now(); [0, 7, 12, 19].forEach((n, k) => this.tone(f(n, 783.99), t + k * 0.05, 0.4, { vol: 0.09, type: 'sine' })); this.hiss(t, 0.25, { vol: 0.08, fq: 5000, to: 9000 }); }
  // लेवल बढ़ा — ढोलक + ऊपर चढ़ती धुन
  levelUp() {
    if (!this.ok()) return;
    const t = this.now();
    [0, 0.09, 0.18].forEach((d, i) => { this.tone(i === 2 ? 95 : 140, t + d, 0.16, { vol: 0.35, to: 60 }); this.hiss(t + d, 0.06, { vol: 0.12, fq: 2500 }); });
    [[0, 0.1], [4, 0.1], [7, 0.1], [12, 0.18], [16, 0.35]].reduce((tt, [n, d]) => { this.tone(f(n, 587.33), tt, d, { type: 'sawtooth', vol: 0.075, att: 0.015, vib: 2 }); return tt + d; }, t + 0.27);
  }
  // उड़न समोसा — सर्र से ऊपर, उड़ते समय हवा की सरसराहट
  fly(on) {
    if (!this.ctx) return;
    const c = this.ctx;
    if (on) {
      if (this.ok()) { const t = this.now(); this.tone(220, t, 0.6, { vol: 0.16, to: 880, type: 'triangle' }); this.hiss(t, 0.7, { vol: 0.2, fq: 500, to: 2600, q: 0.7 }); }
      if (this.wind) return;
      const len = c.sampleRate * 2, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
      const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 0.6;
      const g = c.createGain(); g.gain.value = 0.0001;
      src.connect(bp); bp.connect(g); g.connect(this.fx); src.start();
      g.gain.setTargetAtTime(0.07, c.currentTime, 0.2);
      this.wind = { src, g };
    } else if (this.wind) {
      const w = this.wind; this.wind = null;
      w.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.15);
      setTimeout(() => { try { w.src.stop(); } catch (e) { /* */ } }, 800);
      if (this.ok()) this.tone(700, this.now(), 0.4, { vol: 0.12, to: 200, type: 'triangle' });
    }
  }
  smash() { if (!this.ok()) return; const t = this.now(); this.hiss(t, 0.3, { vol: 0.35, fq: 1200, to: 300 }); this.tone(200, t, 0.2, { vol: 0.25, to: 60, type: 'square' }); }
  near() { if (!this.ok()) return; const t = this.now(); this.hiss(t, 0.3, { vol: 0.2, fq: 400, to: 3000, q: 2 }); }
  splash() { if (!this.ok()) return; this.hiss(this.now(), 0.3, { vol: 0.25, type: 'lowpass', fq: 900, to: 300 }); }
  click() { if (!this.ok()) return; this.tone(880, this.now(), 0.06, { vol: 0.1, type: 'triangle' }); }
  bees(on) {
    if (!this.ctx) return;
    const c = this.ctx;
    if (on && !this.buzz) {
      const o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain(), l = c.createOscillator(), lg = c.createGain();
      o1.type = o2.type = 'sawtooth'; o1.frequency.value = 205; o2.frequency.value = 212;
      lp.type = 'lowpass'; lp.frequency.value = 1300;
      l.frequency.value = 24; lg.gain.value = 0.03;
      g.gain.value = 0.0001;
      l.connect(lg); lg.connect(g.gain);
      o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(this.fx);
      o1.start(); o2.start(); l.start();
      g.gain.setTargetAtTime(0.05, c.currentTime, 0.1);
      this.buzz = { o: [o1, o2, l], g };
    } else if (!on && this.buzz) {
      const b = this.buzz; this.buzz = null;
      b.g.gain.setTargetAtTime(0.0001, c.currentTime, 0.1);
      for (const o of b.o) o.stop(c.currentTime + 0.5);
    }
  }
}
