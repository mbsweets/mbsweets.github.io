// 📖 गोलू की कहानी — 8 अध्याय. हर अध्याय: छोटा 3D दृश्य (गोलू + गाँव का कोई, बोलते हुए) → दौड़ में एक लक्ष्य → पूरा = इनाम + अगला अध्याय.
// लक्ष्य दौड़ के आँकड़ों (game.rs) से: डिलीवरी, हाट, चोर बंदर, बारात, रेल की छत, पोखर, जंगल, दूरी.
import { T, LANG } from './i18n.js';
import { store, vibrate } from './util.js';
import { CUST } from './delivery.js';
import { wallet } from './meta.js';

const $ = (s) => document.querySelector(s);
const tx = (o) => (o ? (LANG === 'en' ? o.en : LANG === 'hi' ? o.hi : o.mai) : '');
const GOLU = { icon: '👦', en: 'Golu', hi: 'गोलू', mai: 'गोलू' };
const WHO = { golu: GOLU }; for (const c of CUST) WHO[c.id] = c;

export const CHAPTERS = [
  { who: 'dadi', k: 'deliver', n: 1, reward: 200, setup: (g) => { g.dl.toNext = 140; },
    t: { en: 'First Day', hi: 'पहला दिन', mai: 'पहिल दिन' }, goal: { en: 'Complete 1 delivery', hi: '1 डिलीवरी पूरी करो', mai: '1 टा डिलीवरी पूरा करू' },
    lines: [['dadi', 'Golu beta, the shop is busy today. Will you deliver sweets for us?', 'गोलू बेटा, आज दुकान पर भीड़ है। मिठाई पहुँचाने में मदद करोगे?', 'गोलू बउआ, आइ दोकान पर भीड़ अछि। मिठाइ पहुँचाबै मे मदद करबह?'],
      ['golu', 'Of course, Dadi! Just tell me where!', 'हाँ दादी! बस बताओ कहाँ पहुँचाना है!', 'हँ दादी! बस कहू कतय पहुँचाबय के अछि!'],
      ['dadi', 'Pick the right sweets and run through my door. Careful of the bees!', 'सही मिठाई उठाना और मेरे दरवाज़े से निकलना। मधुमक्खियों से बचना!', 'ठीक मिठाइ उठाउ आ हमर दरबज्जा सँ निकलू। मधुमाछी सँ बचब!']] },
  { who: 'kakka', k: 'haat', n: 1, k2: 'sweets', n2: 60, reward: 250, setup: (g) => { g.world.toHaat = 320; },
    t: { en: 'Haat Day', hi: 'हाट का दिन', mai: 'हाटक दिन' }, goal: { en: 'Reach the Haat + 60 sweets', hi: 'हाट पहुँचो + 60 मिठाई', mai: 'हाट पहुँचू + 60 मिठाइ' },
    lines: [['kakka', 'Golu! The Mithila Haat is today. Fish, makhana, everything!', 'गोलू! आज मिथिला हाट लगा है। मछली, मखाना, सब कुछ!', 'गोलू! आइ मिथिला हाट लागल अछि। माछ, मखान, सब किछु!'],
      ['golu', 'And sweets? I will grab plenty on the way!', 'और मिठाई? रास्ते में ख़ूब लूटूँगा!', 'आ मिठाइ? रस्ता मे खूब लूटब!'],
      ['kakka', 'Watch out for bullock carts in the market lanes.', 'हाट की गलियों में बैलगाड़ी से बचना।', 'हाटक गली मे बैलगाड़ी सँ बचिह।']] },
  { who: 'munia', k: 'monkeyCatch', n: 1, reward: 300, setup: (g) => { g.toMonkey = 260; g.forceThief = true; },
    t: { en: "Monkey's Mischief", hi: 'बंदर की शरारत', mai: 'बंदरक शरारत' }, goal: { en: 'Catch the thief monkey', hi: 'चोर बंदर को पकड़ो', mai: 'चोर बंदर केँ पकड़ू' },
    lines: [['munia', 'Golu bhaiya! A monkey ran off with my sweets box!', 'गोलू भैया! बंदर मेरा मिठाई का डिब्बा लेकर भाग गया!', 'गोलू भैया! बंदर हमर मिठाइक डिब्बा ल’ क’ भागि गेल!'],
      ['golu', "Don't cry Munia, I'll get it back!", 'रो मत मुनिया, अभी वापस लाता हूँ!', 'नहि कानह मुनिया, एखने आनि दैत छी!'],
      ['munia', 'Stay in his lane, he gets tired!', 'उसकी लेन में रहना, वो थक जाएगा!', 'ओकर लेन मे रहिह, ओ थाकि जेतै!']] },
  { who: 'bhauji', k: 'deliver', n: 2, reward: 350, setup: (g) => { g.dl.toNext = 140; g.world.toBaraat = 500; },
    t: { en: 'Wedding Sweets', hi: 'बारात की मिठाई', mai: 'बरियातीक मिठाइ' }, goal: { en: 'Complete 2 deliveries', hi: '2 डिलीवरी पूरी करो', mai: '2 टा डिलीवरी पूरा करू' },
    lines: [['bhauji', "Golu, my sister's wedding! The baraat is coming and sweets aren't home yet!", 'गोलू, मेरी बहन की शादी है! बारात आने वाली है और मिठाई अभी घर नहीं पहुँची!', 'गोलू, हमर बहिनक बियाह अछि! बरियाती आबि रहल अछि आ मिठाइ एखन धरि घर नहि पहुँचल!'],
      ['golu', "Don't worry Bhauji, MB Sweets is never late!", 'चिंता मत करो भौजी, MB Sweets कभी देर नहीं करता!', 'चिंता नहि करू भौजी, MB Sweets कहियो देरी नहि करैत अछि!']] },
  { who: 'master', k: 'roof', n: 150, reward: 400, setup: (g) => { g.world.toRail = 380; },
    t: { en: 'Train Roof', hi: 'रेल की छत', mai: 'रेलक छत' }, goal: { en: 'Run 150 m on train roofs', hi: 'रेल की छत पर 150 मी. दौड़ो', mai: 'रेलक छत पर 150 मी. दौड़ू' },
    lines: [['master', 'Golu, the Madhubani train is painted like a picture today!', 'गोलू, आज मधुबनी रेलगाड़ी तस्वीर जैसी सजी है!', 'गोलू, आइ मधुबनी रेलगाड़ी चित्र जकाँ सजल अछि!'],
      ['golu', 'Master Saheb, I will run on its roof!', 'मास्टर साहब, मैं उसकी छत पर दौड़ूँगा!', 'मास्टर साहेब, हम ओकर छत पर दौड़ब!'],
      ['master', 'Climb the ramp first. And mind the oncoming engine!', 'पहले ढलान पर चढ़ना। और सामने से आते इंजन से बचना!', 'पहिने ढलान पर चढ़ू। आ सोझाँ सँ अबैत इंजन सँ बचू!']] },
  { who: 'pandit', k: 'pond', n: 200, reward: 450, setup: (g) => { g.world.toPond = 420; },
    t: { en: 'Across the Pond', hi: 'पोखर पार', mai: 'पोखरि पार' }, goal: { en: 'Ride the boat across the makhana pond', hi: 'नाव से मखाना पोखर पार करो', mai: 'नाव सँ मखाना पोखरि पार करू' },
    lines: [['pandit', 'Golu, the puja needs makhana from across the pond.', 'गोलू, पूजा के लिए पोखर के उस पार से मखाना चाहिए।', 'गोलू, पूजाक लेल पोखरिक ओहि पार सँ मखान चाही।'],
      ['golu', 'I will row the boat, Pandit ji!', 'मैं नाव चलाकर लाऊँगा, पंडित जी!', 'हम नाव चला क’ आनब, पंडित जी!'],
      ['pandit', 'Duck under the fishing nets, jump over the logs.', 'जाल के नीचे झुकना, लट्ठे के ऊपर कूदना।', 'जालक नीचाँ झुकू, लट्ठा पर सँ कूदू।']] },
  { who: 'kakka', k: 'jungle', n: 500, reward: 550, setup: () => {},
    t: { en: 'Night Jungle', hi: 'रात का जंगल', mai: 'रातिक जंगल' }, goal: { en: 'Run 500 m in the jungle', hi: 'जंगल में 500 मी. दौड़ो', mai: 'जंगल मे 500 मी. दौड़ू' },
    lines: [['kakka', 'Beyond the village is the jungle. At night it glows with fireflies.', 'गाँव के आगे जंगल है। रात में जुगनू चमकते हैं।', 'गामक आगू जंगल अछि। राति मे भगजोगनी चमकैत अछि।'],
      ['golu', 'I am not scared, Kakka! I have my lantern!', 'मुझे डर नहीं लगता, कक्का! मेरे पास लालटेन है!', 'हमरा डर नहि लगैत अछि, कक्का! हमरा लग लालटेन अछि!']] },
  { who: 'dadi', k: 'dist', n: 5000, reward: 800, setup: () => {},
    t: { en: 'Mithila Legend', hi: 'मिथिला का महारथी', mai: 'मिथिलाक महारथी' }, goal: { en: 'Run 5,000 m in one run', hi: 'एक दौड़ में 5,000 मी.', mai: 'एक दौड़ मे 5,000 मी.' },
    lines: [['dadi', 'Golu, the whole village is proud of you.', 'गोलू, पूरा गाँव तुम पर गर्व करता है।', 'गोलू, पूरा गाम अहाँ पर गर्व करैत अछि।'],
      ['golu', 'One last run, Dadi — all the way to the end!', 'एक आख़िरी दौड़, दादी — आख़िर तक!', 'एक अंतिम दौड़, दादी — अंत धरि!'],
      ['dadi', 'Jai Mithila! Go, my legend!', 'जय मिथिला! जाओ मेरे महारथी!', 'जय मिथिला! जाउ हमर महारथी!']] },
];

export class Story {
  constructor(game) { this.g = game; this.load(); }
  load() { try { this.st = JSON.parse(store('story') || '{}'); } catch (e) { this.st = {}; } this.st.done = this.st.done || []; }
  save() { store('story', JSON.stringify(this.st)); }
  get next() { return Math.min(CHAPTERS.length - 1, this.st.done.length); }
  unlocked(i) { return i <= this.st.done.length; }
  // मेन्यू बटन
  paint() {
    const b = $('#btnStory'); if (!b) return;
    const d = this.st.done.length;
    $('#storySub').textContent = d >= CHAPTERS.length ? T('storyAll') : T('storyCh', d + 1, CHAPTERS.length);
  }
  open() {
    const box = $('#storyList');
    box.innerHTML = CHAPTERS.map((c, i) => {
      const done = this.st.done.includes(i), open = this.unlocked(i);
      return `<button class="stch${done ? ' done' : ''}${open ? '' : ' lock'}" data-ch="${i}" ${open ? '' : 'disabled'}><b>${done ? '✅' : open ? WHO[c.who].icon : '🔒'}</b><span><em>${T('storyN', i + 1)}</em>${tx(c.t)}<small>${tx(c.goal)}</small></span><i>${done ? '⭐' : '+' + c.reward}</i></button>`;
    }).join('');
    $('#storyS').hidden = false;
  }
  // 3D दृश्य + बातचीत
  cut(i) {
    const c = CHAPTERS[i], g = this.g;
    $('#storyS').hidden = true;
    this.ci = i; this.li = 0;
    g.state = 'cut'; g.show([]); $('#menu').hidden = true;
    const m = this.cm = g.dl.cust[c.who];
    if (m) { m.visible = true; m.position.set(1.55, 0, -0.9); m.rotation.y = Math.atan2(-1.55, 0.9) + 0.3; m.userData.body.position.y = 0; m.userData.body.rotation.set(0, 0, 0); } // गोलू की ओर, थोड़ा कैमरे की तरफ़
    $('#cutS').hidden = false; $('#cutT').textContent = `${T('storyN', i + 1)} · ${tx(c.t)}`;
    this.line();
  }
  line() {
    const c = CHAPTERS[this.ci], L = c.lines[this.li];
    if (!L) { this.go(); return; }
    const who = WHO[L[0]], text = LANG === 'en' ? L[1] : LANG === 'hi' ? L[2] : L[3];
    this.talker = L[0];
    $('#cutWho').textContent = `${who.icon} ${tx(who)}`; $('#cutSay').textContent = '';
    $('#cutNext').textContent = this.li === c.lines.length - 1 ? '▶ ' + T('storyGo') : T('storyNext') + ' ›';
    clearInterval(this.typ); let k = 0; const chars = Array.from(text);
    this.typ = setInterval(() => { k++; $('#cutSay').textContent = chars.slice(0, k).join(''); if (k >= chars.length) clearInterval(this.typ); }, 28);
    this.full = text;
    this.g.say(text, true); this.g.sound.click();
  }
  tap() {
    if ($('#cutSay').textContent !== this.full) { clearInterval(this.typ); $('#cutSay').textContent = this.full; return; }
    this.li++; this.line();
  }
  skip() { clearInterval(this.typ); this.go(); }
  go() {
    clearInterval(this.typ);
    $('#cutS').hidden = true;
    if (this.cm) this.cm.visible = false;
    this.g.state = 'menu';
    this.g.goFull(); this.g.start({ story: this.ci });
  }
  // 3D: कैमरा दोनों को देखे, गोलू ग्राहक की ओर, बोलने वाला हिले
  update(dt) {
    const g = this.g, t = performance.now() / 1000, m = this.cm;
    g.golu.update(dt, this.talker === 'golu' ? 'dance' : 'idle', {});
    g.golu.root.rotation.y = Math.PI * 0.62;
    g.cam.position.set(-1.0 + Math.sin(t * 0.25) * 0.4, 1.85, 4.3);
    g.cam.lookAt(0.75, 1.25, -0.5);
    if (m && m.visible) {
      const [aL, aR] = m.userData.arms, talk = this.talker !== 'golu';
      aR.rotation.z = talk ? 1.2 + Math.sin(t * 6) * 0.5 : 0.1; aL.rotation.z = talk ? -0.4 - Math.sin(t * 5) * 0.2 : -0.1;
      m.userData.body.rotation.z = talk ? Math.sin(t * 4) * 0.05 : 0;
    }
  }
  // दौड़ में लक्ष्य
  begin(i) {
    this.run = i == null ? null : { i, done: false };
    if (this.run) CHAPTERS[i].setup(this.g);
  }
  prog() {
    if (!this.run) return null;
    const c = CHAPTERS[this.run.i], rs = this.g.rs || {}, v = (k) => (k === 'dist' ? this.g.world.dist : k === 'sweets' ? this.g.got : rs[k] || 0);
    const a = Math.min(c.n, Math.floor(v(c.k))), b = c.k2 ? Math.min(c.n2, Math.floor(v(c.k2))) : null;
    return { a, n: c.n, b, n2: c.n2, ok: a >= c.n && (b == null || b >= c.n2) };
  }
  check() {
    const r = this.run; if (!r || r.done) return;
    const p = this.prog(); if (!p || !p.ok) return;
    r.done = true;
    const c = CHAPTERS[r.i], first = !this.st.done.includes(r.i);
    if (first) { this.st.done.push(r.i); this.save(); wallet.add(c.reward); }
    const g = this.g;
    g.zoneBanner('📖', T('storyDone', r.i + 1));
    g.cheer('chapter', 1800, -1, true, 'gold', first ? `+${c.reward} 🍬` : '⭐');
    g.sound.levelUp(); g.sound.power(); vibrate([40, 40, 80]);
    if (g.emo) g.emo.play('love', 1.4);
    for (let i = 0; i < 4; i++) g.world.parts.burst(g.p.x + (i - 1.5), 2 + i * 0.3, -1, [0xffd24d, 0xd1261c, 0x2e7b47, 0xd8457f][i], 14, 4, 4, 1.0, -4);
  }
  chip() {
    const p = this.prog(); if (!p) return null;
    const c = CHAPTERS[this.run.i];
    const f = (x) => (x >= 1000 ? (x / 1000).toFixed(1) + 'k' : String(x));
    return { done: this.run.done, txt: this.run.done ? '✔' : `${f(p.a)}/${f(p.n)}${c.k2 ? ` · ${f(p.b)}/${f(p.n2)}` : ''}` };
  }
  overLine() {
    if (!this.run) return null;
    const r = this.run, c = CHAPTERS[r.i];
    return r.done ? `📖 ${T('storyDone', r.i + 1)}${r.i + 1 < CHAPTERS.length ? ' · ' + T('storyNextOpen') : ''}` : `📖 ${tx(c.goal)} — ${T('storyAgain')}`;
  }
}
