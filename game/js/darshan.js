// 📮 मिथिला दर्शन — दौड़ते-दौड़ते मिथिला की असली जगहें (गेम की सादी 3D झलक) और उनका पोस्टकार्ड:
// उसी पल की तस्वीर + 1–2 सच्ची बातें (स्रोत: विकिपीडिया, दरभंगा ज़िला वेबसाइट, आज तक, दृष्टि IAS, बिहार भवन — 18 नवंबर 2026 को जाँचा).
// 8 पोस्टकार्ड: किला, श्यामा माई, अहिल्या स्थान, कुशेश्वर स्थान (पक्षी), एयरपोर्ट (ऊपर से हवाई जहाज़), मखाना (पोखर), मधुबनी चित्रकला (शक्ति), विद्यापति.
// इनाम सिर्फ़ गेम-मिठाई (हर नए पर +50, आठों पर +1000) — दुकान का कोई असली इनाम नहीं.
import * as THREE from './three.module.min.js';
import { C, mat4, Merge } from './art.js';
import { ROAD_HALF } from './models.js';
import { T, LANG } from './i18n.js';
import { store, rand, pick, vibrate } from './util.js';
import { wallet, stats } from './meta.js';

const PI = Math.PI;
const G = {
  sph: (r, w = 12, h = 9) => new THREE.SphereGeometry(r, w, h),
  box: (x, y, z) => new THREE.BoxGeometry(x, y, z),
  cyl: (a, b, h, s = 12) => new THREE.CylinderGeometry(a, b, h, s),
  cone: (r, h, s = 12) => new THREE.ConeGeometry(r, h, s),
  cap: (r, l, s = 10) => new THREE.CapsuleGeometry(r, l, 4, s),
  tor: (r, t, s = 6, n = 18, arc = PI * 2) => new THREE.TorusGeometry(r, t, s, n, arc),
  dome: (r) => new THREE.SphereGeometry(r, 16, 8, 0, PI * 2, 0, PI / 2),
};

// where: कहाँ मिलेगा (एल्बम का इशारा)
export const PLACES = [
  { id: 'kila', icon: '🏰', where: 'village',
    t: { en: 'Darbhanga Raj Fort', hi: 'दरभंगा राज किला', mai: 'दरभंगा राज किला' },
    f: { en: 'Tall red-brick walls of the Darbhanga Raj fort. Inside the complex are Ram Bagh Palace and the Kankali temple.',
      hi: 'दरभंगा राज के किले की लाल ईंटों वाली ऊँची दीवारें। परिसर में राम बाग पैलेस और कंकाली मंदिर हैं।',
      mai: 'दरभंगा राजक किलाक लाल ईंटाक ऊँच देबाल। परिसर मे राम बाग पैलेस आ कंकाली मंदिर अछि।' } },
  { id: 'shyama', icon: '🛕', where: 'village',
    t: { en: 'Shyama Mai Temple', hi: 'श्यामा माई मंदिर', mai: 'श्यामा माइ मंदिर' },
    f: { en: 'Built in 1933 by Maharaja Kameshwar Singh on the funeral pyre of Maharaja Rameshwar Singh. A temple of Mother Kali (Shyama).',
      hi: '1933 में महाराजा कामेश्वर सिंह ने महाराजा रामेश्वर सिंह की चिता पर बनवाया। माँ काली (श्यामा) का मंदिर।',
      mai: '1933 मे महाराजा कामेश्वर सिंह महाराजा रामेश्वर सिंहक चिता पर बनबौलनि। माँ काली (श्यामा) क मंदिर।' } },
  { id: 'ahilya', icon: '🙏', where: 'village',
    t: { en: 'Ahilya Asthan', hi: 'अहिल्या स्थान', mai: 'अहिल्या स्थान' },
    f: { en: 'Kamtaul, Darbhanga. Believed to be where Ahalya turned from stone back to life when Shri Ram came. Fairs on Ram Navami and Vivah Panchami.',
      hi: 'कमतौल, दरभंगा। मान्यता है कि श्रीराम के आने पर अहिल्या यहीं पत्थर से फिर मनुष्य बनीं। रामनवमी और विवाह पंचमी पर मेला लगता है।',
      mai: 'कमतौल, दरभंगा। मान्यता अछि जे श्रीरामक एला पर अहिल्या एतहि पाथर सँ फेर मनुक्ख बनलीह। रामनवमी आ विवाह पंचमी पर मेला लगैत अछि।' } },
  { id: 'kushe', icon: '🦢', where: 'fields',
    t: { en: 'Kusheshwar Asthan Bird Sanctuary', hi: 'कुशेश्वर स्थान पक्षी विहार', mai: 'कुशेश्वर स्थान पक्षी विहार' },
    f: { en: 'A bird sanctuary since 1994, spread over 14 villages. In winter, birds come from Siberia and Mongolia. Named after the nearby Kusheshwar Shiva temple.',
      hi: '1994 से पक्षी विहार, 14 गाँवों में फैला। सर्दियों में साइबेरिया और मंगोलिया से पक्षी आते हैं। नाम पास के कुशेश्वर शिव मंदिर से।',
      mai: '1994 सँ पक्षी विहार, 14 गाम मे पसरल। जाड़ मे साइबेरिया आ मंगोलिया सँ चिड़ै अबैत अछि। नाम लगक कुशेश्वर शिव मंदिर सँ।' } },
  { id: 'plane', icon: '✈️', where: 'sky',
    t: { en: 'Darbhanga Airport', hi: 'दरभंगा एयरपोर्ट', mai: 'दरभंगा एयरपोर्ट' },
    f: { en: 'Passenger flights since 8 November 2020 under the UDAN scheme. It is also an Indian Air Force station.',
      hi: '8 नवंबर 2020 से यहाँ से यात्री उड़ानें (उड़ान योजना)। यह भारतीय वायुसेना का स्टेशन भी है।',
      mai: '8 नवंबर 2020 सँ एतय सँ यात्री उड़ान (उड़ान योजना)। ई भारतीय वायुसेनाक स्टेशन सेहो अछि।' } },
  { id: 'makhana', icon: '🪷', where: 'pond',
    t: { en: 'Mithila Makhana', hi: 'मिथिला मखाना', mai: 'मिथिला मखान' },
    f: { en: 'Got a GI tag in 2022. More than 90% of India\'s makhana comes from Mithila.',
      hi: '2022 में GI टैग मिला। देश का 90% से ज़्यादा मखाना मिथिला से आता है।',
      mai: '2022 मे GI टैग भेटल। देशक 90% सँ बेसी मखान मिथिला सँ अबैत अछि।' } },
  { id: 'madhubani', icon: '🎨', where: 'power',
    t: { en: 'Madhubani Painting', hi: 'मधुबनी चित्रकला', mai: 'मधुबनी चित्रकला' },
    f: { en: 'Got a GI tag in 2007. Jitwarpur, Ranti and Rasidpur are its best-known villages.',
      hi: '2007 में GI टैग मिला। जितवारपुर, रांटी और रसीदपुर इसके मशहूर गाँव हैं।',
      mai: '2007 मे GI टैग भेटल। जितवारपुर, रांटी आ रसीदपुर एकर नामी गाम अछि।' } },
  { id: 'vidya', icon: '📜', where: 'village',
    t: { en: 'Mahakavi Vidyapati', hi: 'महाकवि विद्यापति', mai: 'महाकवि विद्यापति' },
    f: { en: '"Maithil Kavi Kokil" — born around 1352 in Bisfi (Madhubani). Wrote about 500 songs in Maithili.',
      hi: '"मैथिल कवि कोकिल" — जन्म लगभग 1352 में बिस्फी (मधुबनी)। मैथिली में लगभग 500 गीत लिखे।',
      mai: '"मैथिल कवि कोकिल" — जन्म करीब 1352 मे बिस्फी (मधुबनी)। मैथिली मे करीब 500 गीत लिखलनि।' } },
];
export const ptx = (o) => o[LANG] || o.hi;
const SET_PIECES = ['kila', 'shyama', 'ahilya', 'kushe', 'plane', 'vidya'];

// ---------------- सड़क किनारे का बोर्ड ----------------
function boardTex(title, sub) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 160; const x = c.getContext('2d');
  x.fillStyle = '#7a111a'; x.fillRect(0, 0, 512, 160); x.strokeStyle = '#f2a91b'; x.lineWidth = 10; x.strokeRect(6, 6, 500, 148);
  x.fillStyle = '#ffd24d'; x.font = '800 54px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(title, 256, 66, 480);
  x.fillStyle = '#fff3c4'; x.font = '700 28px Mukta,sans-serif'; x.fillText(sub, 256, 122, 480);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function board(g, p, x, z, h = 2.4, w = 2.6) {
  const B = new THREE.Group(); B.position.set(x, 0, z);
  const mg = new Merge(); for (const s of [-1, 1]) mg.add(G.cyl(0.06, 0.06, h, 6), mat4(0, h / 2, s * w * 0.42), C.wood);
  B.add(mg.mesh(0.01));
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.3125), new THREE.MeshBasicMaterial({ map: boardTex(p.t.hi, p.t.en), toneMapped: false, side: THREE.DoubleSide }));
  pl.position.y = h + 0.3; pl.rotation.y = -PI / 2 + 0.55; B.add(pl); // सड़क और पीछे के कैमरे की ओर
  g.add(B); g.userData.boards = (g.userData.boards || []).concat(pl);
}
const dome = (mg, x, y, z, r, col = 0xf2ead8) => { mg.add(G.dome(r), mat4(x, y, z), col); mg.add(G.cone(r * 0.18, r * 0.6, 8), mat4(x, y + r + 0.2, z), C.gold); };
const chhatri = (mg, x, y, z, r = 0.9) => { for (const [a, b] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) mg.add(G.cyl(0.07, 0.07, 1.0, 6), mat4(x + a * r * 0.6, y + 0.5, z + b * r * 0.6), 0xf2ead8); mg.add(G.box(r * 1.6, 0.12, r * 1.6), mat4(x, y + 1.05, z), 0xf2ead8); dome(mg, x, y + 1.1, z, r * 0.75); };

// ---------------- जगहें (मॉडल दाहिनी ओर के लिए; x=0 = सड़क के किनारे से 1 मी.) ----------------
const MAKERS = {
  kila() {
    const g = new THREE.Group(), mg = new Merge(), BR = 0xa8432c, BR2 = 0x8a3523, TR = 0xe0a070, L = 24;
    mg.add(G.box(1.5, 6.2, L), mat4(2.4, 3.1, 0), BR); mg.add(G.box(1.9, 0.9, L + 0.4), mat4(2.4, 0.45, 0), BR2);
    mg.add(G.box(1.56, 0.22, L), mat4(2.4, 5.5, 0), TR); mg.add(G.box(1.56, 0.16, L), mat4(2.4, 1.6, 0), TR);
    for (let z = -L / 2 + 0.5; z <= L / 2 - 0.4; z += 1.15) mg.add(G.box(1.5, 0.75, 0.62), mat4(2.4, 6.55, z), BR); // कंगूरे
    for (let z = -L / 2 + 2; z < L / 2 - 1; z += 2.2) if (Math.abs(z) > 2.4) mg.add(G.box(0.08, 0.7, 0.18), mat4(1.62, 4.2, z), 0x3a1a10); // मोखे
    for (const s of [-1, 1]) { // गोल बुर्ज + छतरी + झंडा
      const z = s * L / 2; mg.add(G.cyl(1.7, 1.9, 8, 16), mat4(2.4, 4, z), BR); mg.add(G.cyl(1.95, 1.95, 0.5, 16), mat4(2.4, 8.2, z), TR);
      chhatri(mg, 2.4, 8.4, z, 1.1); mg.add(G.cyl(0.03, 0.03, 2, 5), mat4(2.4, 11.2, z), C.wood); mg.add(G.box(0.04, 0.5, 0.8), mat4(2.4, 11.8, z + 0.4), C.sindoor);
    }
    mg.add(G.box(0.3, 4.4, 3.6), mat4(1.55, 2.2, 0), TR); mg.add(G.cyl(1.8, 1.8, 0.3, 16, 1), mat4(1.55, 4.4, 0, 0, 0, PI / 2), TR); // द्वार की चौखट
    mg.add(G.box(0.32, 3.8, 2.6), mat4(1.5, 1.9, 0), 0x2a1610); mg.add(G.cyl(1.3, 1.3, 0.34, 16, 1), mat4(1.5, 3.8, 0, 0, 0, PI / 2), 0x2a1610); // द्वार
    chhatri(mg, 1.9, 6.9, 0, 1.0);
    const m = mg.mesh(0.03); m.castShadow = true; m.receiveShadow = true; g.add(m);
    board(g, PLACES[0], -0.4, L / 2 + 2.5);
    g.userData.len = L + 6; g.userData.capZ = -32; return g;
  },
  shyama() {
    const g = new THREE.Group(), mg = new Merge(), RED = 0xb93a2a, WH = 0xf4efe4;
    mg.add(G.box(6.4, 0.9, 8), mat4(3.4, 0.45, 0), 0xe8e2d4);
    for (let i = 0; i < 3; i++) mg.add(G.box(0.5, 0.3 * (i + 1), 3), mat4(0.1 + i * 0.5, 0.15 * (i + 1), 0), 0xd8d2c4); // सीढ़ी
    mg.add(G.box(4, 3.4, 4), mat4(3.6, 2.6, 0), RED); mg.add(G.box(4.1, 0.25, 4.1), mat4(3.6, 4.35, 0), WH); mg.add(G.box(4.1, 0.25, 4.1), mat4(3.6, 1.0, 0), WH);
    mg.add(G.box(0.1, 2.2, 1.4), mat4(1.56, 2.0, 0), 0x2a1610); mg.add(G.cyl(0.7, 0.7, 0.12, 14, 1), mat4(1.56, 3.1, 0, 0, 0, PI / 2), 0x2a1610);
    for (let i = 0; i < 6; i++) { const w = 3.6 - i * 0.5; mg.add(G.box(w, 0.75, w), mat4(3.6, 4.85 + i * 0.75, 0), i % 2 ? WH : RED); } // शिखर
    mg.add(G.sph(0.65, 14, 8), mat4(3.6, 9.5, 0, 0, 0, 0, 1, 0.45, 1), WH); mg.add(G.cone(0.25, 0.8, 10), mat4(3.6, 10.0, 0), C.gold); // आमलक + कलश
    mg.add(G.cyl(0.03, 0.03, 2.2, 5), mat4(3.6, 11.4, 0), C.wood); mg.add(G.cone(0.5, 1.0, 3), mat4(3.6, 12.2, 0.45, PI / 2, 0, 0), 0xf08a1c); // ध्वजा
    for (const z of [-1.6, 1.6]) { mg.add(G.cyl(0.14, 0.14, 2.6, 8), mat4(1.2, 2.2, z), WH); } mg.add(G.box(1.6, 0.2, 4), mat4(1.3, 3.55, 0), RED); // मंडप
    for (let i = 0; i < 5; i++) mg.add(G.sph(0.08, 6, 5), mat4(0.5, 0.95, -1.2 + i * 0.6), 0xffb02e); // दीये
    mg.add(G.cyl(0.25, 0.32, 0.4, 10), mat4(1.1, 3.25, 0), C.gold); // घंटा
    const m = mg.mesh(0.03); m.castShadow = true; g.add(m);
    board(g, PLACES[1], -0.3, 5.6);
    g.userData.len = 12; g.userData.capZ = -28; return g;
  },
  ahilya() {
    const g = new THREE.Group(), mg = new Merge(), WH = 0xf6f1e6, SAF = 0xf08a1c;
    mg.add(G.box(5, 0.6, 6), mat4(3.4, 0.3, 0), 0xe0d8c6);
    mg.add(G.box(2.8, 2.8, 2.8), mat4(4.2, 2.0, -0.5), WH); for (let i = 0; i < 5; i++) { const w = 2.6 - i * 0.45; mg.add(G.box(w, 0.6, w), mat4(4.2, 3.7 + i * 0.6, -0.5), i % 2 ? SAF : WH); }
    mg.add(G.cone(0.22, 0.7, 10), mat4(4.2, 6.9, -0.5), C.gold); mg.add(G.cyl(0.03, 0.03, 1.8, 5), mat4(4.2, 7.9, -0.5), C.wood); mg.add(G.cone(0.4, 0.9, 3), mat4(4.2, 8.5, -0.1, PI / 2, 0, 0), SAF);
    mg.add(G.box(0.1, 1.8, 1.1), mat4(2.78, 1.5, -0.5), 0x3a2416);
    // पत्थर से उठती अहिल्या (प्रतिमा) — फूलों के घेरे में
    mg.add(G.cyl(0.9, 1.0, 0.4, 14), mat4(1.6, 0.8, 2.0), 0x9a958c);
    mg.add(G.cone(0.42, 1.3, 12), mat4(1.6, 1.65, 2.0), 0xb9b4aa); mg.add(G.sph(0.22, 12, 9), mat4(1.6, 2.5, 2.0), 0xb9b4aa); mg.add(G.dome(0.24), mat4(1.6, 2.53, 1.97), 0x8f8a80);
    for (const s of [-1, 1]) mg.add(G.cap(0.06, 0.45, 6), mat4(1.6 + s * 0.12, 2.45, 2.18, -1.2, 0, s * 0.3), 0xb9b4aa); // जुड़े हाथ
    for (let i = 0; i < 12; i++) { const a = i / 12 * PI * 2; mg.add(G.sph(0.09, 6, 5), mat4(1.6 + Math.cos(a) * 0.95, 1.05, 2.0 + Math.sin(a) * 0.95), i % 2 ? 0xf5c542 : 0xf08a1c); }
    mg.add(G.cyl(0.3, 0.45, 3.2, 8), mat4(5.6, 1.6, 3.2), C.wood); for (const [x, y, z, r] of [[5.6, 4.0, 3.2, 1.6], [4.6, 3.6, 3.6, 1.1], [6.4, 3.5, 2.6, 1.1]]) mg.add(G.sph(r, 10, 8), mat4(x, y, z, 0, 0, 0, 1, 0.85, 1), 0x3c7f33); // पीपल
    const m = mg.mesh(0.03); m.castShadow = true; g.add(m);
    board(g, PLACES[2], 0.2, -3.6);
    g.userData.len = 12; g.userData.capZ = -28; return g;
  },
  kushe() {
    const g = new THREE.Group(), mg = new Merge();
    const wet = new THREE.Mesh(new THREE.PlaneGeometry(9, 22), new THREE.MeshStandardMaterial({ color: 0x3f8fae, roughness: 0.15, metalness: 0.1 })); wet.rotation.x = -PI / 2; wet.position.set(4.6, 0.38, 0); wet.receiveShadow = true; g.add(wet);
    for (let i = 0; i < 26; i++) { const x = rand(0.3, 9), z = rand(-11, 11); if (x > 1.2 && x < 8 && Math.abs(z) < 9 && Math.random() < 0.6) continue; for (let r = 0; r < 3; r++) mg.add(G.cone(0.04, rand(0.7, 1.3), 4), mat4(x + rand(-0.15, 0.15), 0.5, z + rand(-0.15, 0.15), rand(-0.2, 0.2), 0, rand(-0.2, 0.2)), 0x6b8f3a); }
    for (let i = 0; i < 10; i++) { const x = rand(1.5, 7.5), z = rand(-9, 9), r = rand(0.3, 0.55); mg.add(G.cyl(r, r, 0.03, 12), mat4(x, 0.41, z), 0x3a8a3f); if (i % 3 === 0) mg.add(G.sph(0.12, 8, 6), mat4(x, 0.54, z), 0xf3a6c4); }
    // खड़े सारस/बगुले
    for (const [x, z, s] of [[2.6, -3, 1], [3.6, 1.5, 0.9], [5.2, -5.5, 1.1], [3.0, 5.5, 0.95], [6.0, 3.0, 1]]) {
      mg.add(G.cap(0.16 * s, 0.32 * s, 8), mat4(x, 1.0 * s, z, PI / 2 - 0.3, 0, 0), 0xf6f6f2); mg.add(G.cyl(0.03 * s, 0.03 * s, 0.55 * s, 5), mat4(x, 1.35 * s, z - 0.2 * s, 0.25, 0, 0), 0xf6f6f2);
      mg.add(G.sph(0.07 * s, 8, 6), mat4(x, 1.66 * s, z - 0.27 * s), 0xf6f6f2); mg.add(G.cone(0.025 * s, 0.22 * s, 5), mat4(x, 1.64 * s, z - 0.42 * s, -PI / 2, 0, 0), 0xe0a020);
      for (const d of [-0.06, 0.06]) mg.add(G.cyl(0.015, 0.015, 0.8 * s, 4), mat4(x + d, 0.42 * s, z), 0xd88a3a);
    }
    // पीछे छोटा शिव मंदिर
    mg.add(G.box(2, 2, 2), mat4(9.2, 1.0, -6), 0xf6f1e6); for (let i = 0; i < 4; i++) mg.add(G.box(1.8 - i * 0.4, 0.55, 1.8 - i * 0.4), mat4(9.2, 2.25 + i * 0.55, -6), i % 2 ? 0xf08a1c : 0xf6f1e6); mg.add(G.cone(0.15, 0.5, 8), mat4(9.2, 4.6, -6), C.gold);
    const m = mg.mesh(0.02); m.castShadow = true; g.add(m);
    // उड़ती चिड़ियों का झुंड (V आकार) — सड़क के ऊपर से पार
    const flock = new THREE.Group(), wg = new THREE.BoxGeometry(0.9, 0.04, 0.3), bm = new THREE.MeshStandardMaterial({ color: 0xfafaf6, roughness: 0.6 }), birds = [];
    for (let i = 0; i < 9; i++) { const b = new THREE.Group(); const k = Math.ceil(i / 2) * (i % 2 ? 1 : -1); b.position.set(k * 1.1, -Math.abs(k) * 0.25, Math.abs(k) * 1.0); const L = new THREE.Mesh(wg, bm), R = new THREE.Mesh(wg, bm); L.position.x = -0.45; R.position.x = 0.45; const bp = new THREE.Group(); bp.add(L); const rp = new THREE.Group(); rp.add(R); b.add(bp, rp); b.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.4, 4, 6), bm)).rotation.x = PI / 2; b.userData = { bp, rp, ph: i * 0.7 }; flock.add(b); birds.push(b); }
    g.add(flock); g.userData.flock = { o: flock, birds };
    board(g, PLACES[3], -0.3, 9);
    g.userData.len = 24; g.userData.capZ = -26; return g;
  },
  vidya() {
    const g = new THREE.Group(), mg = new Merge(), BZ = 0x9a7a3c, BZ2 = 0x7a5a2a;
    mg.add(G.cyl(2.4, 2.5, 0.5, 20), mat4(3.4, 0.25, 0), 0xf0ead8); mg.add(G.cyl(2.45, 2.45, 0.08, 20), mat4(3.4, 0.52, 0), C.sindoor);
    for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2; mg.add(G.cyl(0.05, 0.05, 0.7, 5), mat4(3.4 + Math.cos(a) * 2.3, 0.85, Math.sin(a) * 2.3), 0x2e7b47); }
    mg.add(G.box(1.6, 2.0, 1.6), mat4(3.4, 1.5, 0), 0xf6efdc); mg.add(G.box(1.8, 0.2, 1.8), mat4(3.4, 2.6, 0), 0xe0d2b0);
    // बैठी प्रतिमा: पाग, धोती, हाथ में ताड़पत्र की पोथी
    mg.add(G.box(1.3, 0.45, 1.0), mat4(3.4, 2.95, 0.05), BZ); mg.add(G.cap(0.36, 0.5, 12), mat4(3.4, 3.65, 0), BZ);
    mg.add(G.sph(0.27, 14, 10), mat4(3.4, 4.38, 0), BZ); mg.add(G.cyl(0.3, 0.26, 0.24, 14), mat4(3.4, 4.6, 0), C.maroon); mg.add(G.sph(0.17, 10, 8), mat4(3.4, 4.73, 0.06, 0, 0, 0, 1.2, 0.6, 1), C.maroon); // पाग
    for (const s of [-1, 1]) mg.add(G.cap(0.1, 0.42, 8), mat4(3.4 + s * 0.2, 3.5, -0.32, -1.0, 0, s * 0.25), BZ2);
    mg.add(G.box(0.7, 0.05, 0.22), mat4(3.4, 3.42, -0.55, -0.4, 0, 0), 0xd8b870); // पोथी
    for (let i = 0; i < 14; i++) { const a = PI * 0.15 + i / 13 * PI * 0.7; mg.add(G.sph(0.07, 6, 5), mat4(3.4 + Math.cos(a) * 0.34, 3.95 - Math.sin(a) * 0.25, -0.12 - Math.sin(a) * 0.22), i % 2 ? 0xf5c542 : 0xf08a1c); } // माला
    const m = mg.mesh(0.025); m.castShadow = true; g.add(m);
    board(g, PLACES[7], 0.2, -3.2);
    g.scale.setScalar(1); m.scale.setScalar(1);
    g.userData.len = 8; g.userData.capZ = -26; return g;
  },
  plane() { // सड़क किनारे बोर्ड + ऊपर से उतरता हवाई जहाज़ (कोई एयरलाइन का निशान नहीं)
    const g = new THREE.Group(), mg = new Merge();
    for (const s of [-1, 1]) mg.add(G.cyl(0.08, 0.08, 3.6, 6), mat4(0.4, 1.8, s * 1.6), 0x8a8f96);
    mg.add(G.box(0.1, 1.4, 3.8), mat4(0.4, 3.8, 0), 0x1f6f3f); mg.add(G.box(0.12, 1.5, 3.9), mat4(0.38, 3.8, 0), 0xffffff);
    for (let z = -8; z <= 8; z += 4) mg.add(G.cyl(0.05, 0.05, 1.6, 5), mat4(3.5, 0.8, z), 0x8a8f96); mg.add(G.box(0.04, 1.2, 16.2), mat4(3.5, 0.9, 0), 0xc0c4c8); // बाड़
    const m = mg.mesh(0.02); g.add(m);
    const c = document.createElement('canvas'); c.width = 512; c.height = 192; const x = c.getContext('2d');
    x.fillStyle = '#1f6f3f'; x.fillRect(0, 0, 512, 192); x.strokeStyle = '#fff'; x.lineWidth = 8; x.strokeRect(8, 8, 496, 176);
    x.fillStyle = '#fff'; x.font = '800 56px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'center'; x.fillText('✈ दरभंगा हवाई अड्डा', 256, 86, 480); x.font = '700 34px Mukta,sans-serif'; x.fillText('DARBHANGA AIRPORT →', 256, 150, 480);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.39), new THREE.MeshBasicMaterial({ map: t, toneMapped: false, side: THREE.DoubleSide })); pl.position.set(0.32, 3.8, 0); pl.rotation.y = -PI / 2 + 0.55; g.add(pl);
    g.userData.boards = [pl];
    // हवाई जहाज़
    const jet = new THREE.Group(), jm = new Merge(), W = 0xf4f6f8, BL = 0x2f6fb6;
    jm.add(G.cap(1.1, 9, 16), mat4(0, 0, 0, PI / 2, 0, 0), W); jm.add(G.box(0.1, 0.5, 9.5), mat4(1.05, 0.15, -0.3), BL); jm.add(G.box(0.1, 0.5, 9.5), mat4(-1.05, 0.15, -0.3), BL);
    jm.add(G.box(0.08, 0.25, 7), mat4(1.08, 0.55, -0.5), 0x2a3440); jm.add(G.box(0.08, 0.25, 7), mat4(-1.08, 0.55, -0.5), 0x2a3440); // खिड़कियाँ
    jm.add(G.box(1.6, 0.35, 0.6), mat4(0, 0.55, -5.4), 0x2a3440); // कॉकपिट
    jm.add(G.box(15, 0.22, 2.6), mat4(0, -0.3, 0.3, 0, 0, 0), W); jm.add(G.box(5.6, 0.16, 1.4), mat4(0, 0.4, 4.9), W); // पंख
    jm.add(G.box(0.2, 3.0, 2.0), mat4(0, 1.8, 5.0, 0.35, 0, 0), BL); // पूँछ
    for (const s of [-1, 1]) { jm.add(G.cyl(0.5, 0.45, 1.8, 12), mat4(s * 3.6, -0.75, -0.4, PI / 2, 0, 0), 0xd8dde2); jm.add(G.sph(0.12, 8, 6), mat4(s * 7.4, -0.2, 0.3), s < 0 ? 0xff3030 : 0x30ff60); }
    jm.add(G.sph(0.18, 8, 6), mat4(0, -0.9, -4.6), 0xfff6c0);
    for (const z of [-3.5, 1.2]) jm.add(G.cyl(0.05, 0.05, 1.0, 5), mat4(0, -1.4, z), 0x555555); // पहिये (उतरते समय)
    const jmesh = jm.mesh(0.03); jmesh.castShadow = true; jet.add(jmesh); jet.scale.setScalar(0.9);
    g.add(jet); g.userData.jet = jet;
    g.userData.len = 6; g.userData.capZ = 99; return g;
  },
};

// ---------------- पोस्टकार्ड (1080×1350, WhatsApp पर भेजने लायक) ----------------
const loadImg = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
function wrap(x, s, max) { const out = []; let line = ''; for (const w of s.split(' ')) { const t = line ? line + ' ' + w : w; if (x.measureText(t).width > max && line) { out.push(line); line = w; } else line = t; } if (line) out.push(line); return out; }
function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
export async function postcard(p, img) {
  const [photo, qr, logo] = await Promise.all([img ? loadImg(img) : null, loadImg('img/qr_game.png'), loadImg('img/logo.webp')]);
  try { await document.fonts.load('800 60px "Baloo 2"', 'मिथिला'); await document.fonts.load('700 40px Mukta', 'मिथिला'); } catch (e) { /* */ }
  const c = document.createElement('canvas'); c.width = 1080; c.height = 1350; const x = c.getContext('2d');
  x.fillStyle = '#fbf1dc'; x.fillRect(0, 0, 1080, 1350);
  x.strokeStyle = 'rgba(160,110,60,0.08)'; x.lineWidth = 2; for (let i = 0; i < 60; i++) { x.beginPath(); x.moveTo(0, i * 23 + 5); x.lineTo(1080, i * 23 + 9); x.stroke(); } // काग़ज़
  // मधुबनी किनारी
  x.strokeStyle = '#7a111a'; x.lineWidth = 10; x.strokeRect(22, 22, 1036, 1306); x.lineWidth = 4; x.strokeStyle = '#2e7b47'; x.strokeRect(42, 42, 996, 1266);
  for (let i = 0; i < 41; i++) { const px = 56 + i * 24.2; x.fillStyle = i % 2 ? '#f2a91b' : '#d1261c'; x.beginPath(); x.moveTo(px - 9, 52); x.lineTo(px + 9, 52); x.lineTo(px, 66); x.fill(); x.beginPath(); x.moveTo(px - 9, 1298); x.lineTo(px + 9, 1298); x.lineTo(px, 1284); x.fill(); }
  // शीर्षक पट्टी
  x.fillStyle = '#7a111a'; x.font = '800 62px "Baloo 2",Mukta,sans-serif'; x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillText('📮 ' + T('pcAlbum'), 80, 150);
  x.fillStyle = '#8a5a34'; x.font = '700 30px Mukta,sans-serif'; x.fillText(T('pcFrom'), 84, 194);
  if (logo) { const w = 130, h = logo.height * w / logo.width; x.drawImage(logo, 870, 88, w, h); }
  // तस्वीर
  const PX = 80, PY = 230, PW = 920, PH = 600;
  x.fillStyle = '#fff'; x.save(); x.shadowColor = 'rgba(0,0,0,0.25)'; x.shadowBlur = 18; x.shadowOffsetY = 6; x.fillRect(PX - 14, PY - 14, PW + 28, PH + 28); x.restore();
  if (photo) { const s = Math.max(PW / photo.width, PH / photo.height), sw = PW / s, sh = PH / s; x.drawImage(photo, (photo.width - sw) / 2, (photo.height - sh) / 2, sw, sh, PX, PY, PW, PH); }
  else { x.fillStyle = '#e9d7b4'; x.fillRect(PX, PY, PW, PH); x.font = '220px "Noto Color Emoji",sans-serif'; x.textAlign = 'center'; x.fillText(p.icon, PX + PW / 2, PY + PH / 2 + 80); x.textAlign = 'left'; }
  x.fillStyle = 'rgba(0,0,0,0.45)'; rr(x, PX + 12, PY + PH - 46, 210, 34, 10); x.fill(); x.fillStyle = '#fff'; x.font = '700 22px Mukta,sans-serif'; x.fillText(T('pcGameView'), PX + 24, PY + PH - 21);
  // डाक टिकट (MB Sweets)
  x.save(); x.translate(918, 236); x.rotate(0.08); x.fillStyle = '#fff'; x.fillRect(-70, -84, 140, 168);
  x.fillStyle = '#fbf1dc'; for (let i = 0; i < 8; i++) for (const [ax, ay] of [[-70, -84 + i * 24], [70, -84 + i * 24], [-70 + i * 20, -84], [-70 + i * 20, 84]]) { x.beginPath(); x.arc(ax, ay, 6, 0, PI * 2); x.fill(); }
  x.fillStyle = '#7a111a'; x.fillRect(-58, -72, 116, 144); x.fillStyle = '#ffd24d'; x.font = '800 30px "Baloo 2",sans-serif'; x.textAlign = 'center'; x.fillText('MB', 0, -22); x.font = '700 18px Mukta,sans-serif'; x.fillText('Sweets', 0, 2); x.fillStyle = '#fff3c4'; x.fillText('ननौरा', 0, 30); x.font = '40px "Noto Color Emoji",sans-serif'; x.fillText('🍬', 0, 66); x.restore();
  x.strokeStyle = 'rgba(122,17,26,0.55)'; x.lineWidth = 4; x.beginPath(); x.arc(820, 300, 58, 0, PI * 2); x.stroke(); for (let k = 0; k < 3; k++) { x.beginPath(); for (let i = 0; i <= 40; i++) { const xx = 700 + i * 6; x.lineTo(xx, 380 + k * 16 + Math.sin(i * 0.6) * 5); } x.stroke(); }
  // नाम + बातें
  x.textAlign = 'left'; x.fillStyle = '#7a111a'; x.font = '800 66px "Baloo 2",Mukta,sans-serif'; x.fillText(p.icon + ' ' + ptx(p.t), 80, 920, 920);
  x.fillStyle = '#3a2416'; x.font = '600 38px Mukta,sans-serif'; let y = 984;
  for (const l of wrap(x, ptx(p.f), 920).slice(0, 5)) { x.fillText(l, 80, y); y += 50; }
  if (LANG !== 'en') { x.fillStyle = '#8a6a50'; x.font = '500 26px Mukta,sans-serif'; for (const l of wrap(x, p.f.en, 920).slice(0, 3)) { x.fillText(l, 80, y + 4); y += 34; } }
  // QR + पता
  if (qr) { x.fillStyle = '#fff'; x.fillRect(80, 1150, 120, 120); x.drawImage(qr, 86, 1156, 108, 108); }
  x.fillStyle = '#7a111a'; x.font = '800 36px "Baloo 2",Mukta,sans-serif'; x.fillText(T('cardPlay'), 222, 1196, 780);
  x.fillStyle = '#3a2416'; x.font = '700 30px Mukta,sans-serif'; x.fillText('mbsweets.github.io/game', 222, 1236, 780);
  x.fillStyle = '#8a5a34'; x.font = '600 24px Mukta,sans-serif'; x.fillText(T('cardShop'), 222, 1270, 780);
  return new Promise((res) => c.toBlob((b) => res(b), 'image/jpeg', 0.9));
}

export class Darshan {
  constructor(game) {
    this.g = game; this.models = {}; this.act = null; this.want = null;
    this.el = document.querySelector('#pcard');
    const q = (s) => document.querySelector(s);
    if (q('#pcShare')) q('#pcShare').addEventListener('click', () => { game.sound.click(); this.share(); });
    if (q('#pcClose')) q('#pcClose').addEventListener('click', () => { game.sound.click(); q('#pcS').hidden = true; });
    this.reset();
  }
  get data() { try { return JSON.parse(store('darshan') || 'null') || { got: [], img: {} }; } catch (e) { return { got: [], img: {} }; } }
  save(d) { try { store('darshan', JSON.stringify(d)); } catch (e) { /* जगह कम: तस्वीर के बिना */ d.img = {}; store('darshan', JSON.stringify(d)); } }
  model(id) { if (!this.models[id]) { const m = MAKERS[id](); m.visible = false; this.g.scene.add(m); this.models[id] = m; } return this.models[id]; }
  reset() {
    if (this.act) this.act.m.visible = false;
    this.act = null; this.want = null; this.toNext = rand(300, 480);
    if (this.g.world) this.g.world.openSide = null;
    if (this.el) this.el.hidden = true;
  }
  // कौन-सी जगह दिखाऊँ: जो अभी नहीं मिली (इलाक़े के हिसाब से) — सब मिल गईं तो कभी-कभी सजावट के लिए
  choose(zone) {
    const got = this.data.got, fit = (id) => id === 'plane' ? zone !== 'jungle' : id === 'kushe' ? zone === 'fields' || zone === 'village' : zone === 'village';
    const fresh = SET_PIECES.filter((id) => !got.includes(id) && fit(id));
    if (fresh.length) return pick(fresh);
    const any = SET_PIECES.filter(fit);
    return any.length && Math.random() < 0.35 ? pick(any) : null;
  }
  can() {
    const g = this.g, w = g.world, p = g.p;
    return g.state === 'play' && g.tutDone && !w.tut && !w.pond && !w.zip && w.railObs <= 0 && w.haatObs <= 0 && w.melaObs <= 0 && !w.baraatQ && p.fly <= 0 && !g.dl.active() && (!g.mk || g.mk.st === 'off');
  }
  spawn(id) {
    const g = this.g, w = g.world, m = this.model(id), side = Math.random() < 0.5 ? -1 : 1;
    m.visible = true; m.scale.set(side, 1, 1);
    for (const b of m.userData.boards || []) b.scale.x = side; // नाम उल्टा न दिखे
    const far = Math.min(w.farZ['-1'], w.farZ['1']), len = m.userData.len || 12, z = far - len / 2 - 6;
    if (id === 'plane') { m.position.set(side * (ROAD_HALF + 1.2), 0, -150); const j = m.userData.jet; j.visible = false; }
    else { m.position.set(side * (ROAD_HALF + 1.0), 0, z); w.openSide = { side, z0: z - len / 2 - 8, z1: z + len / 2 + 8 }; }
    if (m.userData.flock) { const f = m.userData.flock.o; f.position.set(12, 5.5, 0); f.rotation.y = PI / 2; f.visible = false; }
    this.act = { id, m, side, cap: false, done: false, t: 0, fly: -1 };
  }
  update(dt, dz) {
    const g = this.g, w = g.world;
    if (w.openSide) { w.openSide.z0 += dz; w.openSide.z1 += dz; if (w.openSide.z0 > 20) w.openSide = null; }
    if (!this.act) { this.toNext -= dz; if (this.toNext <= 0) { this.toNext = rand(420, 640); if (this.can()) { const id = this.choose(w.zone); if (id) this.spawn(id); } } return; }
    const a = this.act, m = a.m; a.t += dt; m.position.z += dz;
    if (a.id === 'plane') { // बोर्ड पास आते ही पीछे से जहाज़ ऊपर से उतरता हुआ आगे
      const j = m.userData.jet;
      if (a.fly < 0 && m.position.z > -70) { a.fly = 0; j.visible = true; if (g.sound.plane) g.sound.plane(); }
      if (a.fly >= 0) {
        a.fly += dt; const k = a.fly / 4.2;
        j.position.set(-(ROAD_HALF + 1.2) + 1.8, lerp(15, 8.5, k), lerp(26, -170, k) - m.position.z); // (स्थानीय x: सड़क के ऊपर)
        j.rotation.set(0.06, 0, Math.sin(a.fly * 1.3) * 0.04);
        const wz = j.position.z + m.position.z;
        if (!a.cap && wz < -22 && wz > -60) { a.cap = true; this.want = { id: a.id, at: performance.now() + 30 }; }
        if (k >= 1) j.visible = false;
        if (a.cap && !a.done && wz < -50) { a.done = true; this.award(a.id); }
      }
    } else {
      if (!a.cap && m.position.z > (m.userData.capZ || -16)) { a.cap = true; this.want = { id: a.id, at: performance.now() + 30 }; }
      if (a.cap && !a.done && m.position.z > -3) { a.done = true; this.award(a.id); }
    }
    if (m.userData.flock) { // पक्षी: पास आते ही उड़ान
      const F = m.userData.flock, f = F.o;
      if (m.position.z > -45) { f.visible = true; f.position.x -= dt * 6.5; f.position.y = 5.5 + Math.sin(a.t) * 0.4; } // खेत से सड़क के ऊपर से पार
      for (const b of F.birds) { const u = b.userData, s = Math.sin(a.t * 9 + u.ph) * 0.6; u.bp.rotation.z = s; u.rp.rotation.z = -s; }
    }
    for (const b of m.userData.boards || []) b.visible = m.position.z < 3; // पास आकर कैमरे में बड़ा न दिखे
    if (m.position.z > 26 + (m.userData.len || 0) / 2 && (a.id !== 'plane' || a.fly > 4.3)) { m.visible = false; this.act = null; }
  }
  // पोखर/मधुबनी जैसे पल से (game.js)
  event(id) {
    if (this.data.got.includes(id)) return;
    if (this.want) { this.award(id); return; } // दूसरी तस्वीर बाकी — बिना तस्वीर के पोस्टकार्ड
    this.want = { id, at: performance.now() + 450, award: true };
  }
  // पोस्टकार्ड का कैमरा: सड़क पर खड़े होकर जगह की ओर (मॉडल के अपने हिसाब से — दाएँ/बाएँ दोनों में सही)
  shot(r) {
    const g = this.g, a = this.act, cam = this.pcCam || (this.pcCam = new THREE.PerspectiveCamera(60, 1, 0.3, 400)), v = new THREE.Vector3(), t = new THREE.Vector3();
    if (!a || a.id !== r.id) return false; // पोखर/मधुबनी: खेल वाला ही दृश्य
    const m = a.m; m.updateMatrixWorld(true);
    const P = { kila: [[-4.2, 2.6, 19], [2.4, 3.8, 0]], shyama: [[-4, 2.4, 15], [3.4, 4.2, 0]], ahilya: [[-4, 2.2, 14], [3.0, 2.8, 0.8]], vidya: [[-2.5, 2.6, 9], [3.4, 3.6, 0]], kushe: [[-3.5, 2.6, 15], [4.5, 2.6, 0]] }[a.id];
    if (a.id === 'plane') { const j = m.userData.jet; j.getWorldPosition(t); v.set(t.x * 0.3, 1.8, t.z + 24); }
    else if (P) { m.localToWorld(v.set(...P[0])); m.localToWorld(t.set(...P[1])); } else return false;
    const W = g.renderer.domElement.width, H = g.renderer.domElement.height, asp = W / H, hf = 58 * PI / 180; // 4:3 बीच का हिस्सा ~58° चौड़ा
    cam.aspect = asp; cam.fov = 2 * Math.atan(Math.tan(hf / 2) / asp) * 180 / PI; cam.updateProjectionMatrix();
    cam.position.copy(v); cam.lookAt(t);
    const vis = g.golu.root.visible; g.golu.root.visible = false;
    g.renderer.render(g.scene, cam); g.golu.root.visible = vis;
    return true;
  }
  // render के ठीक बाद: तस्वीर (4:3, बीच से) — true = फ़्रेम फिर से बनाना है
  afterRender(cv) {
    const r = this.want; if (!r || performance.now() < r.at) return false;
    this.want = null;
    let url = null, redo = false;
    try {
      redo = this.shot(r);
      const W = cv.width, H = cv.height, cw = Math.min(W, H * 4 / 3), ch = cw * 3 / 4, sx = (W - cw) / 2, sy = redo ? (H - ch) / 2 : Math.max(0, Math.min(H - ch, H * 0.18));
      const c = document.createElement('canvas'); c.width = 400; c.height = 300; c.getContext('2d').drawImage(cv, sx, sy, cw, ch, 0, 0, 400, 300);
      url = c.toDataURL('image/jpeg', 0.72);
    } catch (e) { /* */ }
    const d = this.data;
    if (url && (!d.img[r.id] || !d.got.includes(r.id))) { d.img[r.id] = url; this.save(d); }
    if (r.award) this.award(r.id);
    return redo;
  }
  award(id) {
    const g = this.g, d = this.data, p = PLACES.find((q) => q.id === id); if (!p) return;
    const fresh = !d.got.includes(id);
    if (fresh) { d.got.push(id); this.save(d); wallet.add(50); stats.merge({ darshanN: 1 }); }
    this.pop(p, fresh, d.got.length);
    if (fresh && d.got.length === PLACES.length && !d.all) { d.all = 1; this.save(d); wallet.add(1000); setTimeout(() => { if (g.state === 'play') g.cheer('darshanAll', 2000, -1, true, 'gold', '📮 8/8 +1000 🍬'); }, 1800); }
  }
  pop(p, fresh, n) {
    const g = this.g, el = this.el;
    g.sound.ring(); vibrate(25);
    if (g.mom && fresh) g.mom.want(330, `${p.icon} ${ptx(p.t)}`, 0);
    if (!el) return;
    el.innerHTML = `<small>📮 ${fresh ? T('pcNew') : T('pcAlbum')} · ${n}/${PLACES.length}</small><b>${p.icon} ${ptx(p.t)}</b><i>${ptx(p.f).split('।')[0].split('. ')[0]}</i>${fresh ? '<em>+50 🍬</em>' : ''}`;
    el.hidden = false; el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    clearTimeout(this.pt); this.pt = setTimeout(() => { el.hidden = true; }, 3600);
  }
  // ---------- एल्बम (बैज वाले पन्ने में) ----------
  html() {
    const d = this.data, H = { village: T('pcWhereVillage'), fields: T('pcWhereFields'), pond: T('pcWherePond'), power: T('pcWherePower'), sky: T('pcWhereSky') };
    return `<div class="pcal"><div class="pch"><b>📮 ${T('pcAlbum')}</b><span>${d.got.length}/${PLACES.length}</span></div><p class="lbnote">${T('pcNote')}</p><div class="pcg">${PLACES.map((p) => {
      const on = d.got.includes(p.id), im = d.img[p.id];
      return on ? `<button class="pci on" data-pc="${p.id}">${im ? `<img src="${im}" alt="">` : `<span class="pce">${p.icon}</span>`}<b>${p.icon} ${ptx(p.t)}</b></button>`
        : `<div class="pci"><span class="pce">❔</span><b>${H[p.where]}</b></div>`;
    }).join('')}</div></div>`;
  }
  async open(id) {
    const p = PLACES.find((q) => q.id === id); if (!p) return;
    const S = document.querySelector('#pcS'), img = document.querySelector('#pcImg');
    S.hidden = false; img.src = ''; img.alt = ptx(p.t);
    const bl = await postcard(p, this.data.img[id]); this.blob = bl; this.cur = p;
    if (bl) img.src = URL.createObjectURL(bl);
  }
  async share() {
    const g = this.g, bl = this.blob, p = this.cur; if (!bl || !p) return;
    const f = new File([bl], `mithila-darshan-${p.id}.jpg`, { type: 'image/jpeg' }), text = `${p.icon} ${ptx(p.t)} — ${T('cardShare')}`;
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], text }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); g.toast(T('cardSaved'), 1200, 'gold');
  }
}
const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));
