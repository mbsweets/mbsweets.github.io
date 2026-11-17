// 📸 दौड़ का "बेस्ट पल" — सबसे बड़े पल (करतब, डिलीवरी, चोर बंदर, नया रिकॉर्ड…) पर स्क्रीन की तस्वीर अपने-आप;
// दौड़ के बाद MB Sweets फ़्रेम में 1080×1920 कार्ड (लोगो, तस्वीर, स्कोर, QR) — सीधे WhatsApp स्टेटस पर.
import { T } from './i18n.js';

const PI = Math.PI;
const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });

export class Moments {
  constructor() { this.reset(); }
  reset() { this.best = null; this.req = null; }
  // pri बड़ा = ज़्यादा ख़ास; delay ms बाद तस्वीर (ताकि असर दिखे)
  want(pri, label, delay = 140) {
    if ((this.best && pri <= this.best.pri) || (this.req && pri <= this.req.pri)) return;
    this.req = { pri, label, at: performance.now() + delay };
  }
  // frame() में render के ठीक बाद (WebGL की तस्वीर तभी पढ़ी जा सकती है)
  afterRender(cv) {
    const r = this.req; if (!r || performance.now() < r.at) return;
    this.req = null;
    if (this.best && r.pri <= this.best.pri) return;
    const W = cv.width, H = cv.height, cw = Math.min(W, H * 0.8), ch = cw / 0.8;
    const sx = (W - cw) / 2, sy = Math.max(0, Math.min(H - ch, H * 0.93 - ch));
    const c = document.createElement('canvas'); c.width = 720; c.height = 900;
    try { c.getContext('2d').drawImage(cv, sx, sy, cw, ch, 0, 0, 720, 900); } catch (e) { return; }
    this.best = { pri: r.pri, label: r.label, img: c };
  }
  thumb() { try { return this.best ? this.best.img.toDataURL('image/jpeg', 0.7) : null; } catch (e) { return null; } }
  // 1080×1920 कार्ड
  async card(info) {
    const b = this.best; if (!b) return null;
    const [logo, qr] = await Promise.all([load('img/logo.webp'), load('img/qr_game.png')]);
    try { await document.fonts.load('800 60px "Baloo 2"', 'रसगुल्ला'); await document.fonts.load('700 40px Mukta', 'रसगुल्ला'); } catch (e) { /* */ }
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1920; const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 1920); g.addColorStop(0, '#8e1420'); g.addColorStop(1, '#4a0a10'); x.fillStyle = g; x.fillRect(0, 0, 1080, 1920);
    // मधुबनी किनारी: दोहरी रेखा + तिकोने
    x.strokeStyle = '#f2a91b'; x.lineWidth = 10; x.strokeRect(26, 26, 1028, 1868); x.lineWidth = 4; x.strokeRect(46, 46, 988, 1828);
    for (let i = 0; i < 40; i++) { const px = 60 + i * 24.5; x.fillStyle = i % 2 ? '#f2a91b' : '#2e7b47'; tri(x, px, 60, 1); tri(x, px, 1860, -1); }
    for (let i = 0; i < 74; i++) { const py = 84 + i * 24.5; x.fillStyle = i % 2 ? '#f2a91b' : '#2e7b47'; triV(x, 60, py, 1); triV(x, 1020, py, -1); }
    if (logo) { const w = 190, h = logo.height * w / logo.width; x.drawImage(logo, 540 - w / 2, 92, w, h); }
    text(x, 'रसगुल्ला रन', 540, 380, 'center', '800 112px "Baloo 2"', '#ffd24d', '#2a1511', 14);
    // तस्वीर
    const PX = 90, PY = 430, PW = 900, PH = 1125;
    x.save(); rr(x, PX, PY, PW, PH, 36); x.clip(); x.drawImage(b.img, PX, PY, PW, PH); x.restore();
    x.lineWidth = 12; x.strokeStyle = '#ffd24d'; rr(x, PX, PY, PW, PH, 36); x.stroke();
    // पल का नाम
    x.font = '800 60px "Baloo 2"'; const lw = Math.min(820, x.measureText(b.label).width + 80);
    x.fillStyle = '#d1261c'; rr(x, 540 - lw / 2, PY + PH - 70, lw, 104, 52); x.fill(); x.lineWidth = 6; x.strokeStyle = '#2a1511'; x.stroke();
    text(x, b.label, 540, PY + PH + 2, 'center', '800 60px "Baloo 2"', '#fff', '#2a1511', 8, 760);
    // स्कोर
    text(x, info.line, 540, 1665, 'center', '700 48px Mukta', '#fff3c4', null, 0, 940);
    // QR + पता
    if (qr) { x.fillStyle = '#fff'; rr(x, 96, 1700, 150, 150, 14); x.fill(); x.drawImage(qr, 104, 1708, 134, 134); }
    text(x, T('cardPlay'), 276, 1748, 'left', '800 40px "Baloo 2"', '#ffd24d', null, 0, 740);
    text(x, 'mbsweets.github.io/game', 276, 1798, 'left', '700 38px Mukta', '#fff', null, 0, 740);
    text(x, T('cardShop'), 276, 1842, 'left', '600 30px Mukta', '#f3d9b0', null, 0, 740);
    return new Promise((res) => c.toBlob((bl) => res(bl), 'image/jpeg', 0.9));
  }
}
function tri(x, px, py, d) { x.beginPath(); x.moveTo(px - 10, py); x.lineTo(px + 10, py); x.lineTo(px, py + 14 * d); x.closePath(); x.fill(); }
function triV(x, px, py, d) { x.beginPath(); x.moveTo(px, py - 10); x.lineTo(px, py + 10); x.lineTo(px + 14 * d, py); x.closePath(); x.fill(); }
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
function text(x, s, px, py, al, font, fill, stroke, sw, maxW) {
  x.font = font; x.textAlign = al; x.textBaseline = 'alphabetic';
  if (stroke) { x.lineJoin = 'round'; x.lineWidth = sw; x.strokeStyle = stroke; x.strokeText(s, px, py, maxW); }
  x.fillStyle = fill; x.fillText(s, px, py, maxW);
}
void PI;
