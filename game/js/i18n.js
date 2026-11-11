// हिंदी / English
import { store } from './util.js';

const S = {
  en: {
    title: 'Rasgulla Run', sub: 'A sweet Mithila chase', play: 'PLAY', best: 'Best', sweets: 'Sweets', score: 'Score',
    paused: 'Paused', resume: 'Resume', home: 'Home', again: 'Play again', newBest: 'New best!',
    caught: 'The bees caught Golu!', crashed: 'Dhadaam! Golu bumped!', lane: 'Swipe ← → to change lane', jump: 'Swipe ↑ to jump',
    roll: 'Swipe ↓ to roll', keys: 'Keyboard: arrows / WASD, Space = jump', rush: 'SUGAR RUSH!', rushBtn: 'SUGAR RUSH',
    magnet: 'Sweet Box', shoes: 'Jalebi Shoes', shield: 'Laddoo Shield', near: 'Close one!', bees: 'Bees are after you!',
    shopT: 'Maa Bhagwati Mishthan Bhandar', shopS: 'Nanaura Chowk, Darbhanga · since 2000', order: 'Order sweets', share: 'Challenge friends',
    soon: 'Coming soon: play here and win treats at our shop!', loading: 'Loading…', by: 'by MB Sweets, Darbhanga',
    sound: 'Sound', on: 'On', off: 'Off', lang: 'हिंदी', combo: 'combo', shieldUsed: 'Laddoo shield saved you!', smash: 'SMASH!',
    shareText: (s) => `I scored ${s} in Rasgulla Run — a sweet Mithila chase! Can you beat me?`,
    tip: 'Collect sweets to fill the meter, then tap SUGAR RUSH!', gotIt: 'Go!',
    samosa: 'FLYING SAMOSA!', samosaS: 'Flying Samosa', thali: 'Double Thali ×2', level: 'Level',
    lv1: 'Easy Lane', lv2: 'Market Rush', lv3: 'Full Speed', lv4: 'Tough Turns', lv5: 'Ustad Mode',
    haat: 'Mithila Haat!', baraat: 'Baraat ahead!', mela: 'Mela bonus! Sweets everywhere!',
  },
  hi: {
    title: 'रसगुल्ला रन', sub: 'मिथिला की मीठी दौड़', play: 'खेलो', best: 'सबसे अच्छा', sweets: 'मिठाई', score: 'स्कोर',
    paused: 'रुका हुआ', resume: 'जारी रखो', home: 'होम', again: 'फिर खेलो', newBest: 'नया रिकॉर्ड!',
    caught: 'मधुमक्खियों ने गोलू को पकड़ लिया!', crashed: 'धड़ाम! गोलू टकरा गया!', lane: '← → सरकाओ — लेन बदलो', jump: '↑ सरकाओ — कूदो',
    roll: '↓ सरकाओ — लुढ़को', keys: 'कीबोर्ड: तीर / WASD, Space = कूदो', rush: 'शुगर रश!', rushBtn: 'शुगर रश',
    magnet: 'मिठाई का डिब्बा', shoes: 'जलेबी जूते', shield: 'लड्डू कवच', near: 'बाल-बाल बचे!', bees: 'मधुमक्खियाँ पीछे पड़ीं!',
    shopT: 'माँ भगवती मिष्ठान भंडार', shopS: 'ननौरा चौक, दरभंगा · 2000 ईस्वी से', order: 'मिठाई ऑर्डर करें', share: 'दोस्तों को चुनौती दो',
    soon: 'जल्द आ रहा है: यहाँ खेलो और दुकान पर इनाम पाओ!', loading: 'लोड हो रहा है…', by: 'MB Sweets, दरभंगा की ओर से',
    sound: 'आवाज़', on: 'चालू', off: 'बंद', lang: 'English', combo: 'कॉम्बो', shieldUsed: 'लड्डू कवच ने बचा लिया!', smash: 'धमाका!',
    shareText: (s) => `मैंने रसगुल्ला रन (मिथिला की मीठी दौड़) में ${s} स्कोर किया! क्या तुम मुझे हरा सकते हो?`,
    tip: 'मिठाई जमा करो, मीटर भरे तो शुगर रश दबाओ!', gotIt: 'चलो!',
    samosa: 'उड़न समोसा!', samosaS: 'उड़न समोसा', thali: 'डबल थाली ×2', level: 'लेवल',
    lv1: 'आसान गली', lv2: 'बाज़ार की भीड़', lv3: 'तेज़ रफ़्तार', lv4: 'मुश्किल मोड़', lv5: 'उस्ताद',
    haat: 'मिथिला हाट!', baraat: 'आगे बारात!', mela: 'मेला बोनस! मिठाई ही मिठाई!',
  },
};

function detect() {
  const saved = store('lang');
  if (saved === 'hi' || saved === 'en') return saved;
  const l = (navigator.language || 'en').toLowerCase();
  return l.startsWith('hi') || l.startsWith('mai') || l.startsWith('bh') ? 'hi' : 'en';
}
export let LANG = detect();
export function T(k, ...a) {
  const v = S[LANG][k];
  return typeof v === 'function' ? v(...a) : v;
}
export function setLang(l) {
  LANG = l;
  store('lang', l);
  applyLang();
}
export function applyLang() {
  document.documentElement.lang = LANG;
  document.documentElement.dataset.lang = LANG;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = T(el.dataset.t);
}
