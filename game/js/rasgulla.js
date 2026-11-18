// 🍮 रसगुल्ला बनाओ — "मेरी दुकान" का छोटा खेल (~30 सेकंड, सिर्फ़ टैप):
// 1) गोले बनाओ: गोला बड़ा-छोटा होता रहता है, बिंदी वाले घेरे के नाप पर आए तब टैप (6 गोले)
// 2) चाशनी में पकाओ: कड़ाही में गोले फूलते हैं; हरा चमके तब टैप करके निकालो (जल्दी = कच्चा, देर = फट गया)
// 3) हाँडी में रसगुल्ले + तारे. इनाम सिर्फ़ गेम-मिठाई (दिन में 3 बार), सब बढ़िया = "ताज़ा माल" (अगली दौड़ की पहली डिलीवरी डबल).
import { T } from './i18n.js';
import { store, vibrate } from './util.js';
import { wallet } from './meta.js';

const PI = Math.PI;
const istDay = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10);
const N = 6, W = 360, H = 640;

export class RasgullaGame {
  constructor(game) {
    this.g = game;
    this.S = document.querySelector('#rgS'); this.cv = document.querySelector('#rgC'); this.x = this.cv && this.cv.getContext('2d');
    if (!this.S) return;
    this.cv.addEventListener('pointerdown', (e) => { e.preventDefault(); this.tap(e); });
    document.querySelector('#rgClose').addEventListener('click', () => { this.g.sound.click(); this.close(); });
    this.loop = this.loop.bind(this);
  }
  left() { const d = JSON.parse(store('rgDay') || '{}'); return d.day === istDay() ? Math.max(0, 3 - (d.n || 0)) : 3; }
  open() {
    if (!this.S) return;
    this.S.hidden = false; this.fit(); this.reset(); this.on = true; this.t0 = performance.now(); this.last = this.t0; this.openedAt = this.t0;
    requestAnimationFrame(this.loop);
  }
  close() { this.on = false; this.S.hidden = true; if (this.g.gshop && this.g.gshop.open) this.g.gshop.paint(); }
  fit() {
    const r = this.cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    this.cv.width = Math.round(r.width * dpr); this.cv.height = Math.round(r.height * dpr);
    this.k = Math.min(this.cv.width / W, this.cv.height / H); this.ox = (this.cv.width - W * this.k) / 2; this.oy = (this.cv.height - H * this.k) / 2;
  }
  reset() {
    this.st = 'intro1'; this.t = 0; this.balls = []; this.cur = { ph: 0 }; this.msgs = []; this.parts = []; this.res = null;
    this.target = 30; // गोले का सही नाप (px)
  }
  say(txt, col, x = W / 2, y = 300) { this.msgs.push({ txt, col, x, y, t: 0 }); }
  // ---------- टैप ----------
  tap(e) {
    const r = this.cv.getBoundingClientRect(), px = ((e.clientX - r.left) * (this.cv.width / r.width) - this.ox) / this.k, py = ((e.clientY - r.top) * (this.cv.height / r.height) - this.oy) / this.k;
    const s = this.g.sound;
    if (performance.now() - (this.openedAt || 0) < 400) return; // बटन वाला टैप यहाँ न गिने
    if (this.st === 'intro1') { this.st = 'shape'; this.t = 0; this.cur = { ph: 0, sp: 2.4 }; s.click(); return; }
    if (this.st === 'shape') {
      const rad = this.radius(), err = Math.abs(rad - this.target) / this.target;
      const q = err < 0.08 ? 2 : err < 0.2 ? 1 : 0;
      this.balls.push({ q, r: rad, cook: -1, grow: 1, t: 0, st: 'tray' });
      this.say(q === 2 ? '✨ ' + T('rgPerfect') : q === 1 ? T('rgGood') : T('rgBad'), q === 2 ? '#2e7b47' : q === 1 ? '#8a5a34' : '#c62828', W / 2, 250);
      if (q === 2) { s.ring(); vibrate(15); } else s.click();
      this.cur = { ph: Math.random() * PI, sp: 2.4 + this.balls.length * 0.35 };
      if (this.balls.length >= N) { this.st = 'intro2'; this.t = 0; }
      return;
    }
    if (this.st === 'intro2') { this.st = 'cook'; this.t = 0; this.balls.forEach((b, i) => { b.st = 'wait'; b.drop = 0.25 + i * 0.55; }); s.click(); return; }
    if (this.st === 'cook') {
      let best = null, bd = 1e9;
      for (const b of this.balls) { if (b.st !== 'cook') continue; const d = Math.hypot(b.x - px, b.y - py); if (d < b.r * b.grow + 22 && d < bd) { best = b; bd = d; } }
      if (best) this.scoop(best);
      return;
    }
    if (this.st === 'done' && this.res && py > 520) { // नीचे के बटन: फिर बनाओ / बंद
      if (px < W / 2) { s.click(); this.reset(); this.st = 'intro1'; } else { s.click(); this.close(); }
    }
  }
  radius() { return this.target * (0.62 + 0.55 * (0.5 + 0.5 * Math.sin(this.cur.ph))); }
  scoop(b) {
    const s = this.g.sound, g = b.grow;
    b.cq = g < 1.32 ? 0 : g <= 1.55 ? 2 : 1; b.st = 'out'; b.t = 0;
    this.say(b.cq === 2 ? '✨ ' + T('rgPerfect') : b.cq === 1 ? T('rgGood') : T('rgRaw'), b.cq === 2 ? '#2e7b47' : b.cq === 1 ? '#8a5a34' : '#c62828', b.x, b.y - 40);
    if (b.cq === 2) { s.ring(); vibrate(15); } else s.click();
    for (let i = 0; i < 8; i++) this.parts.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 80, vy: -40 - Math.random() * 60, t: 0, c: '#f5c542' });
  }
  // ---------- हर फ़्रेम ----------
  loop(now) {
    if (!this.on) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.t += dt;
    this.step(dt); this.draw();
    requestAnimationFrame(this.loop);
  }
  step(dt) {
    if (this.st === 'shape') this.cur.ph += dt * this.cur.sp;
    if (this.st === 'cook') {
      const pos = [[120, 360], [240, 360], [180, 320], [180, 405], [105, 410], [255, 410]];
      for (const [i, b] of this.balls.entries()) {
        b.t += dt;
        if (b.st === 'wait' && this.t >= b.drop) { b.st = 'cook'; b.t = 0; b.x = pos[i][0]; b.y = pos[i][1]; b.grow = 1; this.g.sound.plop && this.g.sound.plop(); }
        if (b.st === 'cook') {
          b.grow = 1 + b.t * 0.16 + b.t * b.t * 0.012; // धीरे-धीरे फूले
          if (b.grow > 1.68) { b.st = 'out'; b.cq = 0; b.burst = true; b.t = 0; this.say('💥 ' + T('rgBurst'), '#c62828', b.x, b.y - 40); this.g.sound.bump(); for (let k = 0; k < 14; k++) this.parts.push({ x: b.x, y: b.y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 120, t: 0, c: '#fffaf0' }); }
        }
      }
      if (this.balls.every((b) => b.st === 'out') && this.balls.some((b) => b.t > 0.6)) this.finish();
    }
    for (const m of this.msgs) m.t += dt; this.msgs = this.msgs.filter((m) => m.t < 1.1);
    for (const p of this.parts) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 220 * dt; } this.parts = this.parts.filter((p) => p.t < 0.9);
  }
  finish() {
    if (this.st === 'done') return;
    this.st = 'done'; this.t = 0;
    const q = this.balls.map((b) => (b.burst ? 0 : Math.min(b.q, b.cq))), pts = q.reduce((a, b) => a + b, 0), perfect = q.filter((v) => v === 2).length, ok = q.filter((v) => v > 0).length;
    const stars = perfect >= 5 ? 3 : pts >= 7 ? 2 : 1;
    const left = this.left(); let reward = 0, fresh = false;
    if (left > 0) {
      reward = 10 * pts; wallet.add(reward);
      const d = JSON.parse(store('rgDay') || '{}'); store('rgDay', JSON.stringify({ day: istDay(), n: (d.day === istDay() ? d.n || 0 : 0) + 1 }));
      if (ok === N && perfect >= 4) { fresh = true; store('freshStock', 1); }
    }
    this.res = { q, pts, stars, reward, fresh, ok, left };
    this.g.sound.power(); vibrate([20, 30, 40]);
  }
  // ---------- चित्र ----------
  draw() {
    const x = this.x, k = this.k; if (!x) return;
    x.setTransform(1, 0, 0, 1, 0, 0); const fg = x.createLinearGradient(0, 0, 0, this.cv.height); fg.addColorStop(0, '#f6e3c0'); fg.addColorStop(1, '#e8c99a'); x.fillStyle = fg; x.fillRect(0, 0, this.cv.width, this.cv.height); // पूरी स्क्रीन रसोई
    x.setTransform(k, 0, 0, k, this.ox, this.oy);
    // रसोई की दीवार + मधुबनी किनारी
    const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#f6e3c0'); bg.addColorStop(1, '#e8c99a'); x.fillStyle = bg; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 18; i++) { x.fillStyle = i % 2 ? '#d1261c' : '#2e7b47'; x.beginPath(); x.moveTo(i * 20 + 2, 0); x.lineTo(i * 20 + 18, 0); x.lineTo(i * 20 + 10, 12); x.fill(); }
    x.fillStyle = '#7a111a'; x.font = '800 26px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'alphabetic'; x.fillText('🍮 ' + T('rgT'), W / 2, 50);
    x.fillStyle = '#8a5a34'; x.font = '700 14px Mukta,sans-serif'; x.fillText(T('rgLeft', this.left()), W / 2, 72);
    // ऊपर ट्रे में बने गोले
    x.fillStyle = '#d9a441'; x.beginPath(); x.ellipse(W / 2, 128, 150, 30, 0, 0, PI * 2); x.fill(); x.strokeStyle = '#a8742a'; x.lineWidth = 3; x.stroke();
    this.balls.forEach((b, i) => { if (this.st === 'shape' || this.st === 'intro2' || b.st === 'wait') this.ball(W / 2 - 112 + i * 45, 122, 15, b.q, 1); });
    if (this.st === 'intro1' || this.st === 'shape') this.drawShape();
    if (this.st === 'intro2' || this.st === 'cook') this.drawCook();
    if (this.st === 'done') this.drawDone();
    for (const p of this.parts) { x.globalAlpha = 1 - p.t / 0.9; x.fillStyle = p.c; x.beginPath(); x.arc(p.x, p.y, 4, 0, PI * 2); x.fill(); } x.globalAlpha = 1;
    for (const m of this.msgs) { x.globalAlpha = 1 - Math.max(0, m.t - 0.6) / 0.5; x.fillStyle = m.col; x.font = '800 24px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.lineWidth = 5; x.strokeStyle = '#fff'; x.strokeText(m.txt, m.x, m.y - m.t * 30); x.fillText(m.txt, m.x, m.y - m.t * 30); } x.globalAlpha = 1;
  }
  ball(cx, cy, r, q, a = 1, glow = 0) {
    const x = this.x; x.save(); x.globalAlpha = a;
    if (glow) { x.shadowColor = glow; x.shadowBlur = 18; }
    const g = x.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#fff6e2'); g.addColorStop(1, '#ead6b0');
    x.fillStyle = g; x.beginPath();
    if (q === 0) { for (let i = 0; i <= 10; i++) { const an = i / 10 * PI * 2, rr = r * (0.82 + 0.22 * Math.sin(an * 3 + 1)); x.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr); } } else x.arc(cx, cy, r, 0, PI * 2);
    x.fill(); x.restore();
  }
  drawShape() {
    const x = this.x, cy = 400;
    x.fillStyle = '#b07a46'; x.beginPath(); x.ellipse(W / 2, cy + 40, 140, 46, 0, 0, PI * 2); x.fill(); x.fillStyle = '#c99158'; x.beginPath(); x.ellipse(W / 2, cy + 34, 130, 40, 0, 0, PI * 2); x.fill(); // लकड़ी का पट्टा
    x.setLineDash([6, 6]); x.strokeStyle = '#2e7b47'; x.lineWidth = 3; x.beginPath(); x.arc(W / 2, cy, this.target, 0, PI * 2); x.stroke(); x.setLineDash([]);
    const rad = this.st === 'shape' ? this.radius() : this.target, near = Math.abs(rad - this.target) / this.target < 0.08;
    this.ball(W / 2, cy, rad, 1, 1, near ? '#3ad35a' : 0);
    // दोनों हथेलियाँ (गोल करती)
    for (const s of [-1, 1]) { x.fillStyle = '#e8a77c'; x.beginPath(); x.ellipse(W / 2 + s * (rad + 26), cy + 6, 22, 30, s * 0.4, 0, PI * 2); x.fill(); }
    this.panel(this.st === 'intro1' ? T('rgS1') : `${this.balls.length}/${N}`, this.st === 'intro1');
  }
  drawCook() {
    const x = this.x, cx = W / 2, cy = 370;
    x.fillStyle = '#5a3a20'; x.fillRect(40, 470, W - 80, 30); x.fillStyle = '#ff7a1a'; for (let i = 0; i < 9; i++) { const f = 10 + Math.sin(this.t * 12 + i) * 4; x.beginPath(); x.moveTo(70 + i * 28, 470); x.quadraticCurveTo(80 + i * 28, 470 - f * 2, 90 + i * 28, 470); x.fill(); } // चूल्हे की आग
    for (const s of [-1, 1]) { x.strokeStyle = '#2a2420'; x.lineWidth = 10; x.beginPath(); x.arc(cx + s * 158, cy - 6, 18, s < 0 ? PI * 0.5 : -PI * 0.5, s < 0 ? PI * 1.5 : PI * 0.5); x.stroke(); }
    x.fillStyle = '#2a2420'; x.beginPath(); x.ellipse(cx, cy, 160, 92, 0, 0, PI * 2); x.fill(); // कड़ाही
    const sy = x.createRadialGradient(cx, cy - 10, 10, cx, cy, 150); sy.addColorStop(0, '#ffd98a'); sy.addColorStop(1, '#e8a23a'); x.fillStyle = sy; x.beginPath(); x.ellipse(cx, cy, 146, 80, 0, 0, PI * 2); x.fill(); // चाशनी
    for (let i = 0; i < 14; i++) { const a = i * 2.4 + this.t * 0.8, r = (i % 5) * 26, bx = cx + Math.cos(a) * r, by = cy + Math.sin(a) * r * 0.5, br = 3 + ((this.t * 2 + i) % 1) * 5; x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 1.5; x.beginPath(); x.arc(bx, by, br, 0, PI * 2); x.stroke(); }
    for (let i = 0; i < 5; i++) { const sx = cx - 100 + i * 50, st = (this.t * 0.6 + i * 0.27) % 1; x.fillStyle = `rgba(255,255,255,${0.35 * (1 - st)})`; x.beginPath(); x.arc(sx + Math.sin(st * 6 + i) * 8, cy - 70 - st * 110, 12 + st * 14, 0, PI * 2); x.fill(); } // भाप
    for (const b of this.balls) {
      if (b.st === 'cook') {
        const g = b.grow, win = g >= 1.32 && g <= 1.55, r = b.r * 0.85 * g;
        x.strokeStyle = win ? '#2ecc40' : g > 1.55 ? '#e74c3c' : 'rgba(0,0,0,0.25)'; x.lineWidth = 4; x.beginPath(); x.arc(b.x, b.y, r + 8, -PI / 2, -PI / 2 + PI * 2 * Math.min(1, (g - 1) / 0.68)); x.stroke();
        this.ball(b.x, b.y + Math.sin(this.t * 4 + b.x) * 2, r, b.q, 1, win ? '#3ad35a' : 0);
      } else if (b.st === 'out' && !b.burst && b.t < 0.6) { const e = b.t / 0.6; this.ball(b.x + (W - 40 - b.x) * e, b.y - Math.sin(e * PI) * 120 + (130 - b.y) * e, b.r * 0.85 * b.grow * (1 - e * 0.5), b.q, 1 - e * 0.6); }
    }
    this.panel(this.st === 'intro2' ? T('rgS2') : '', this.st === 'intro2');
  }
  drawDone() {
    const x = this.x, r = this.res, cx = W / 2;
    x.fillStyle = '#a4552c'; x.beginPath(); x.ellipse(cx, 380, 120, 100, 0, 0, PI * 2); x.fill(); x.fillStyle = '#7a3a1c'; x.beginPath(); x.ellipse(cx, 300, 96, 26, 0, 0, PI * 2); x.fill(); // हाँडी
    x.fillStyle = '#e8a23a'; x.beginPath(); x.ellipse(cx, 300, 88, 20, 0, 0, PI * 2); x.fill();
    r.q.forEach((q, i) => { if (q > 0) this.ball(cx - 60 + (i % 3) * 60, 292 + Math.floor(i / 3) * 12 - (i % 2) * 4, 17, q, 1); });
    for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#f2a91b' : '#2e7b47'; x.beginPath(); x.arc(cx - 90 + i * 36, 400, 8, 0, PI * 2); x.fill(); } // हाँडी पर चित्रकारी
    x.textAlign = 'center'; x.fillStyle = '#7a111a'; x.font = '800 30px "Baloo 2",Mukta,sans-serif'; x.fillText('⭐'.repeat(r.stars) + '☆'.repeat(3 - r.stars), cx, 175);
    x.font = '800 24px "Baloo 2",Mukta,sans-serif'; x.fillText(T('rgDone', r.ok), cx, 215);
    x.fillStyle = '#3a2416'; x.font = '700 17px Mukta,sans-serif';
    x.fillText(r.left > 0 ? T('rgReward', r.reward) : T('rgPractice'), cx, 505);
    if (r.fresh) { x.fillStyle = '#c62828'; x.font = '800 16px Mukta,sans-serif'; x.fillText(T('rgFresh'), cx, 485); }
    for (const [i, lbl] of [[0, T('rgAgain')], [1, T('rgClose')]]) { const bx = 30 + i * 160, by = 540; x.fillStyle = i ? '#fff8ea' : '#d1261c'; x.strokeStyle = '#2a1511'; x.lineWidth = 3; x.beginPath(); x.roundRect ? x.roundRect(bx, by, 140, 52, 14) : x.rect(bx, by, 140, 52); x.fill(); x.stroke(); x.fillStyle = i ? '#2a1511' : '#fff'; x.font = '800 20px "Baloo 2",Mukta,sans-serif'; x.fillText(lbl, bx + 70, by + 34); }
  }
  panel(txt, big) {
    if (!txt) return; const x = this.x;
    x.fillStyle = big ? 'rgba(122,17,26,0.92)' : 'rgba(255,248,234,0.9)'; x.beginPath(); x.roundRect ? x.roundRect(24, 530, W - 48, big ? 84 : 40, 14) : x.rect(24, 530, W - 48, 84); x.fill();
    x.fillStyle = big ? '#fff3c4' : '#7a111a'; x.textAlign = 'center'; x.font = `800 ${big ? 17 : 18}px "Baloo 2",Mukta,sans-serif`;
    if (big) { const words = txt.split(' '); let l1 = '', l2 = ''; for (const w of words) { if ((l1 + ' ' + w).length < 30 && !l2) l1 = l1 ? l1 + ' ' + w : w; else l2 = l2 ? l2 + ' ' + w : w; } x.fillText(l1, W / 2, 562); x.fillText(l2, W / 2, 586); x.font = '700 13px Mukta,sans-serif'; x.fillStyle = '#ffd24d'; x.fillText('👆 ' + T('rgStart'), W / 2, 606); }
    else x.fillText(txt, W / 2, 556);
  }
}
