// 🤸 हवा में करतब — कूदते समय स्क्रीन पर टैप = करतब (चक्कर → कलाबाज़ी → पहिया → मरोड़). एक कूद में कई करतब हो सकते हैं.
// सीधा उतरे (करतब पूरा) = अंक बैंक में; बीच करतब में ज़मीन छू ली = "उफ़!" — उस कूद के अंक गए और थोड़ा धीमा (मधुमक्खी नहीं).
import { T } from './i18n.js';
import { store, vibrate } from './util.js';

const PI2 = Math.PI * 2;
const KINDS = ['spin', 'flip', 'cart', 'twist'];
const DUR = { spin: 0.34, flip: 0.4, cart: 0.38, twist: 0.46 };
const PTS = [60, 120, 200, 320];
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

export class Tricks {
  constructor(game) { this.g = game; this.reset(); }
  reset() { this.cur = null; this.q = 0; this.n = 0; this.bank = 0; this.rx = 0; this.ry = 0; this.rz = 0; this.busy = false; }
  // टैप — हवा में हो तो करतब (true लौटाओ)
  tap() {
    const p = this.g.p;
    if (!p || p.ground || p.fly > 0 || p.rollQ || p.y < 0.25) return false;
    if (this.cur) { if (this.cur.t > DUR[this.cur.k] * 0.4 && this.q < 1 && this.left() > DUR[this.cur.k] - this.cur.t + this.need()) this.q = 1; return true; }
    if (this.left() < this.need()) return true; // ज़मीन पास — करतब नहीं (टैप बेकार, पर गोलू नहीं गिरेगा)
    this.begin(); return true;
  }
  // ज़मीन छूने में कितना समय बचा (सेकंड)
  left() { const p = this.g.p, G = 36, h = Math.max(0, p.y - (p.gy || 0)); return (p.vy + Math.sqrt(p.vy * p.vy + 2 * G * h)) / G; }
  need() { return DUR[KINDS[Math.min(this.n, KINDS.length - 1)]] * 0.85; }
  begin() {
    const k = KINDS[Math.min(this.n, KINDS.length - 1)];
    this.cur = { k, t: 0 }; this.busy = true;
    this.g.sound.trick(this.n); vibrate(12);
    if (store('tutTrick') !== '1') store('tutTrick', 1);
  }
  update(dt) {
    const c = this.cur;
    if (!c) { this.rx = this.ry = this.rz = 0; return; }
    c.t += dt;
    const u = Math.min(1, c.t / DUR[c.k]), e = ease(u) * PI2;
    this.rx = c.k === 'flip' || c.k === 'twist' ? -e : 0;
    this.ry = c.k === 'spin' || c.k === 'twist' ? e : 0;
    this.rz = c.k === 'cart' ? e : 0;
    if (u >= 1) {
      this.n++; const pts = PTS[Math.min(this.n - 1, PTS.length - 1)];
      this.bank += pts;
      this.g.floatText(`+${pts * this.g.mult}`, 'tp');
      this.cur = null; this.rx = this.ry = this.rz = 0;
      if (this.q) { this.q = 0; if (this.left() >= this.need()) this.begin(); }
    }
  }
  // ज़मीन छुई
  land() {
    const g = this.g;
    if (!this.busy && !this.n) return;
    // ज़मीन पर अधूरा करतब: बस वही नहीं गिना जाता — कोई सज़ा/धीमापन नहीं (पहले "उफ़" से कूद ख़राब लगती थी)
    if (this.cur) { const u = this.cur.t / DUR[this.cur.k]; if (u >= 0.75) { this.n++; this.bank += PTS[Math.min(this.n - 1, PTS.length - 1)]; } }
    if (this.n > 0) {
      const mult = this.n >= 3 ? 2 : this.n === 2 ? 1.5 : 1, pts = Math.round(this.bank * mult) * g.mult;
      g.score += pts;
      g.meter = Math.min(1, g.meter + 0.05 * this.n);
      g.msBump('tricks', this.n);
      g.cheer('trick', 1100, Math.min(this.n - 1, 3), false, 'gold', `🤸 ×${this.n} +${pts.toLocaleString('en-IN')}`);
      g.sound.trickLand(this.n); vibrate(20);
      if (g.emo) g.emo.play('cool', 0.7);
      if (g.mom) g.mom.want(200 + 100 * this.n, T('momTrick', this.n), 60);
      g.camKick = 0.5;
    }
    this.reset();
  }
}
