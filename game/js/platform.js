// गेम पोर्टल (CrazyGames) से जुड़ाव — अपनी वेबसाइट पर यह सब बंद रहता है।
// पोर्टल वाली zip में index.html के अंदर window.RR_PORTAL = 'crazygames' और उनकी SDK स्क्रिप्ट जोड़ी जाती है।
import { STORE } from './util.js';

export const PORTAL = (typeof window !== 'undefined' && window.RR_PORTAL) || '';
const sdk = () => (window.CrazyGames && window.CrazyGames.SDK) || null;

export const P = {
  on: false, // SDK चालू
  ads: false, // विज्ञापन मिल सकते हैं
  info: null, // { countryCode, locale?, device: { type } }
  playing: false,
  async init() {
    if (PORTAL !== 'crazygames' || !sdk()) return;
    const S = sdk();
    try { await S.init(); } catch (e) { console.warn('CrazyGames SDK', e); return; }
    if (S.environment === 'disabled') return;
    this.on = true; this.ads = true;
    try { this.info = S.user && S.user.systemInfo; } catch (e) { /* */ }
    // प्रोग्रेस सेव: CrazyGames का data module (लॉग-इन खिलाड़ी का हर डिवाइस पर)
    try {
      const d = S.data;
      if (d && d.getItem) {
        if (d.getItem('rr-mig') == null) { // पहली बार: इसी ब्राउज़र का पुराना सेव ले जाओ
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.startsWith('rr-') && d.getItem(k) == null) d.setItem(k, localStorage.getItem(k));
          }
          d.setItem('rr-mig', '1');
        }
        STORE.b = d;
      }
    } catch (e) { console.warn('data module', e); }
  },
  call(mod, fn, ...a) { try { const S = sdk(); if (this.on && S[mod] && S[mod][fn]) return S[mod][fn](...a); } catch (e) { /* */ } return undefined; },
  loadingStart() { this.call('game', 'loadingStart'); },
  loadingStop() { this.call('game', 'loadingStop'); },
  gameplayStart() { if (!this.playing) { this.playing = true; this.call('game', 'gameplayStart'); } },
  gameplayStop() { if (this.playing) { this.playing = false; this.call('game', 'gameplayStop'); } },
  happytime() { this.call('game', 'happytime'); },
  isDesktop() { const t = this.info && this.info.device && this.info.device.type; return t ? t === 'desktop' : null; },
  // muteAudio: पोर्टल की आवाज़-बंद सेटिंग हमारी सेटिंग से ऊपर
  watchMute(fn) {
    if (!this.on) return;
    const S = sdk();
    const read = () => { try { fn(!!(S.game.settings && S.game.settings.muteAudio)); } catch (e) { /* */ } };
    read();
    try { S.game.addSettingsChangeListener(read); } catch (e) { /* */ }
  },
  // विज्ञापन: true = पूरा देखा (rewarded में इनाम दो), false = नहीं मिला / रुक गया
  ad(type, onStart) {
    return new Promise((res) => {
      if (!this.ads) { res(false); return; }
      let done = false;
      const end = (ok) => { if (!done) { done = true; res(ok); } };
      try {
        sdk().ad.requestAd(type, {
          adStarted: () => { if (onStart) onStart(); },
          adFinished: () => end(true),
          adError: (e) => { console.warn('ad', type, e && (e.code || e)); end(false); },
        });
      } catch (e) { end(false); }
    });
  },
};
