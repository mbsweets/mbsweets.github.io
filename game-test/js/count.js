// कुल खिलाड़ी गिनती — हर जगह (अपनी वेबसाइट, CrazyGames, आगे Play Store) एक ही गिनती में।
// कोई नाम, फ़ोन, IP या पहचान नहीं भेजते — सिर्फ़: कहाँ से खेला, आज पहली बार खोला या नहीं, कभी पहले खेला या नहीं।
// सर्वर: _src/leaderboard/worker.js (/ping)। पता खाली = गिनती बंद।
import { LB_URL } from './lb.js';
import { PORTAL } from './platform.js';
import { store } from './util.js';

const q = new URLSearchParams(location.search).get('lb'); // सिर्फ़ लोकल जाँच के लिए
export const COUNT_URL = q && /^(127\.0\.0\.1|localhost)$/.test(location.hostname) ? q : LB_URL; // वही Cloudflare Worker
const SRC = PORTAL || 'web';
const today = () => new Date(Date.now() + 5.5 * 3600e3).toISOString().slice(0, 10); // भारत का दिन

function send(body) {
  if (!COUNT_URL) return;
  const url = COUNT_URL.replace(/\/$/, '') + '/ping', data = JSON.stringify(body);
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(url, data)) return;
    fetch(url, { method: 'POST', body: data, keepalive: true, mode: 'no-cors' }).catch(() => {});
  } catch (e) { /* गिनती छूट जाए तो कोई बात नहीं */ }
}
export function countOpen() {
  const d = today(), nd = store('cday') !== d ? 1 : 0, nf = store('cfirst') == null ? 1 : 0;
  if (nd) store('cday', d);
  if (nf) store('cfirst', d);
  send({ src: SRC, ev: 'open', nd, nf });
}
export function countGame() { send({ src: SRC, ev: 'game' }); }
