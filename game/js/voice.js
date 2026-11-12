// बोलकर शाबाशी — हिंदी मोड में मैथिली, English मोड में अंग्रेज़ी।
// 1) अगर voice/<lang>/<फ़ाइल>.mp3 रिकॉर्ड की हुई है (VOICE_FILES में) तो वही (असली आवाज़ — सबसे अच्छी)
// 2) नहीं तो फ़ोन/ब्राउज़र की अपनी बोलने वाली आवाज़ (speechSynthesis) — hi-IN / en-IN
export const VOICE_FILES = { hi: {}, en: {} }; // जैसे hi: { 'बड़ नीक!': 'badd-neek.mp3' }

// धीमा और साफ़: बच्चों को हर शब्द समझ आए
const RATE = { hi: 0.8, en: 0.92 };
const PITCH = 1.05; // ज़्यादा ऊँची आवाज़ (पहले 1.25) शब्द बिगाड़ती थी

// हिंदी आवाज़ मैथिली की कुछ वर्तनी गलत पढ़ती है — सिर्फ़ बोलने के लिए आसान वर्तनी (स्क्रीन पर असली मैथिली ही रहती है)
const SPEAK_FIX = [
  [/[’']/g, ''], [/[!•]/g, ','], [/…/g, ','],
  [/मिठाइ/g, 'मिठाई'],
  [/,\s*,+/g, ','], [/,\s*$/g, ''],
];
export function speakText(text, lang) {
  let s = String(text);
  if (lang === 'hi') for (const [a, b] of SPEAK_FIX) s = s.replace(a, b);
  else s = s.replace(/[!•…]/g, ',').replace(/,\s*$/g, '');
  return s.replace(/\s+/g, ' ').trim();
}

export class Voice {
  constructor(sound) {
    this.sound = sound; this.last = 0; this.bufs = {}; this.voices = []; this.busy = false;
    this.tts = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (this.tts) {
      const load = () => { this.voices = window.speechSynthesis.getVoices() || []; };
      load(); window.speechSynthesis.onvoiceschanged = load;
    }
  }
  // फ़ोन/कंप्यूटर में हिंदी आवाज़ है? (नहीं तो English बोलो — मैथिली को अंग्रेज़ी आवाज़ बिगाड़ देगी)
  canHi() {
    if (VOICE_FILES.hi && Object.keys(VOICE_FILES.hi).length) return true;
    if (!this.tts) return false;
    if (!this.voices.length) return true; // अभी सूची नहीं आई — मान लो है
    return this.voices.some((x) => /^hi/i.test(x.lang));
  }
  // सबसे साफ़ आवाज़ चुनो: Google / Natural / Online (नेट वाली) पहले, फिर कोई भी
  pick(lang) {
    const v = this.voices;
    const good = (x) => /google|natural|online|enhanced|premium|neural/i.test(x.name);
    if (lang === 'hi') {
      const hi = v.filter((x) => /^hi(-|_|$)/i.test(x.lang));
      return hi.find(good) || hi.find((x) => /lekha|swara|kalpana|hemant|madhur/i.test(x.name)) || hi[0] || null;
    }
    const inn = v.filter((x) => /^en(-|_)IN/i.test(x.lang));
    return inn.find(good) || inn[0] || v.find((x) => /^en(-|_)(GB|US)/i.test(x.lang) && good(x)) || v.find((x) => /^en/i.test(x.lang)) || null;
  }
  // text: बोलने वाली लाइन; prio: true = ज़रूरी (लेवल/ज़ोन/गेम ख़त्म) — चल रही लाइन रोककर बोलो
  say(text, lang, prio = false) {
    const s = this.sound;
    if (!s || s.silent || !text) return;
    const now = performance.now() / 1000;
    if (!prio && (this.busy || now - this.last < 3.5)) return; // बोलते में बीच से मत काटो; 3.5 सेकंड में एक बार
    this.last = now;
    const file = (VOICE_FILES[lang] || {})[text];
    if (file && s.ctx) { this.play(`voice/${lang}/${file}`); return; }
    if (!this.tts) return;
    try {
      const sy = window.speechSynthesis;
      if (sy.speaking || sy.pending) sy.cancel();
      const u = new SpeechSynthesisUtterance(speakText(text, lang));
      u.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      const v = this.pick(lang); if (v) u.voice = v;
      u.rate = RATE[lang] || 0.9; u.pitch = PITCH; u.volume = 1;
      const id = (this.uid = (this.uid || 0) + 1);
      const done = () => { if (this.uid !== id) return; this.busy = false; clearTimeout(this.safeT); s.duck && s.duck(false); };
      u.onend = done; u.onerror = done;
      this.busy = true; s.duck && s.duck(true);
      // कुछ फ़ोन onend नहीं भेजते — लंबाई के हिसाब से अपने-आप धुन वापस
      clearTimeout(this.safeT);
      this.safeT = setTimeout(done, 1500 + u.text.length * 140);
      sy.speak(u);
    } catch (e) { this.busy = false; s.duck && s.duck(false); }
  }
  async play(url) {
    const c = this.sound.ctx, s = this.sound;
    try {
      if (!this.bufs[url]) this.bufs[url] = await c.decodeAudioData(await (await fetch(url)).arrayBuffer());
      const src = c.createBufferSource(); src.buffer = this.bufs[url];
      const g = c.createGain(); g.gain.value = 1.0;
      src.connect(g); g.connect(c.destination);
      this.busy = true; s.duck && s.duck(true);
      src.onended = () => { this.busy = false; s.duck && s.duck(false); };
      src.start();
    } catch (e) { this.busy = false; s.duck && s.duck(false); }
  }
  stop() {
    this.busy = false; clearTimeout(this.safeT);
    try { if (this.tts) window.speechSynthesis.cancel(); } catch (e) { /* */ }
    if (this.sound && this.sound.duck) this.sound.duck(false);
  }
}
