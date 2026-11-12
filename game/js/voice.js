// बोलकर शाबाशी — हिंदी मोड में मैथिली, English मोड में अंग्रेज़ी।
// 1) अगर voice/<lang>/<फ़ाइल>.mp3 रिकॉर्ड की हुई है (VOICE_FILES में) तो वही (असली आवाज़ — सबसे अच्छी)
// 2) नहीं तो फ़ोन/ब्राउज़र की अपनी बोलने वाली आवाज़ (speechSynthesis) — hi-IN / en-IN
export const VOICE_FILES = { hi: {}, en: {} }; // जैसे hi: { 'बड़ नीक!': 'badd-neek.mp3' }

export class Voice {
  constructor(sound) {
    this.sound = sound; this.last = 0; this.bufs = {}; this.voices = [];
    this.tts = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (this.tts) {
      const load = () => { this.voices = window.speechSynthesis.getVoices() || []; };
      load(); window.speechSynthesis.onvoiceschanged = load;
    }
  }
  pick(lang) {
    const v = this.voices;
    if (lang === 'hi') return v.find((x) => /^hi(-|_)IN/i.test(x.lang) && /google/i.test(x.name)) || v.find((x) => /^hi/i.test(x.lang)) || null;
    return v.find((x) => /^en(-|_)IN/i.test(x.lang)) || v.find((x) => /^en(-|_)(GB|US)/i.test(x.lang) && /google/i.test(x.name)) || v.find((x) => /^en/i.test(x.lang)) || null;
  }
  // text: बोलने वाली लाइन; prio: true = ज़रूरी (लेवल/ज़ोन), छोटी शाबाशी को दबा दे
  say(text, lang, prio = false) {
    const s = this.sound;
    if (!s || s.silent || !text) return;
    const now = performance.now() / 1000;
    if (!prio && now - this.last < 1.4) return;
    this.last = now;
    const file = (VOICE_FILES[lang] || {})[text];
    if (file && s.ctx) { this.play(`voice/${lang}/${file}`); return; }
    if (!this.tts) return;
    try {
      const sy = window.speechSynthesis;
      if (prio || sy.speaking) sy.cancel();
      const u = new SpeechSynthesisUtterance(text.replace(/[!•]/g, ' ').trim());
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      const v = this.pick(lang); if (v) u.voice = v;
      u.rate = lang === 'hi' ? 1.05 : 1.08; u.pitch = 1.25; u.volume = 1;
      sy.speak(u);
    } catch (e) { /* कुछ ब्राउज़र में नहीं — चुप रहो */ }
  }
  async play(url) {
    const c = this.sound.ctx;
    try {
      if (!this.bufs[url]) this.bufs[url] = await c.decodeAudioData(await (await fetch(url)).arrayBuffer());
      const src = c.createBufferSource(); src.buffer = this.bufs[url];
      const g = c.createGain(); g.gain.value = 1.0;
      src.connect(g); g.connect(c.destination); src.start();
    } catch (e) { /* फ़ाइल नहीं मिली */ }
  }
  stop() { try { if (this.tts) window.speechSynthesis.cancel(); } catch (e) { /* */ } }
}
