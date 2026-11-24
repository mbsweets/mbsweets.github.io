// 🐞 गड़बड़ी की डायरी (19 नवंबर): फ़ोन पर कोई JS गलती हो तो आख़िरी 5 याद रहें — सेटिंग्स में सबसे नीचे दिखती हैं,
// ताकि मालिक/खिलाड़ी उसका screenshot भेज सकें। साथ में गेम का संस्करण (index.html की rr-ver मुहर, _src/game_stamp.py)
const K = 'rr-errs', seen = new Set();
export const VER = (() => { try { const m = document.querySelector('meta[name="rr-ver"]'); return (m && m.content) || 'dev'; } catch (e) { return 'dev'; } })();
export function errs() { try { return JSON.parse(localStorage.getItem(K) || '[]'); } catch (e) { return []; } }
export function logErr(e, where = '') {
  try {
    const m = String((e && (e.stack || e.message)) || e).replace(/https?:\/\/[^\s)]*\/js\//g, '').replace(/\?v=[0-9a-f]+/g, '').split('\n').slice(0, 3).map((s) => s.trim()).join(' | ').slice(0, 260);
    if (seen.has(m)) return; seen.add(m); // एक ही गलती हर फ़्रेम पर — सिर्फ़ पहली बार लिखो
    const L = errs().filter((x) => x.m !== m);
    L.unshift({ m, w: String(where).slice(0, 60), t: Date.now(), v: VER });
    localStorage.setItem(K, JSON.stringify(L.slice(0, 5)));
  } catch (_) { /* */ }
}
export function clearErrs() { seen.clear(); try { localStorage.removeItem(K); } catch (e) { /* */ } }
window.addEventListener('error', (ev) => logErr(ev.error || ev.message, 'win'));
window.addEventListener('unhandledrejection', (ev) => logErr(ev.reason, 'promise'));
