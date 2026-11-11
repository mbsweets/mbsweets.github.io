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
    lb: '🏆 Leaderboard', lbShort: '🏆 Ranks', lbIndia: 'India', lbWorld: 'World', lbWeek: 'This week', lbAll: 'All time',
    lbYourName: 'Your name', lbCityL: 'Your city', lbSave: 'Save', lbEdit: 'Change name', lbClose: 'Close',
    lbPrivacy: 'Only your name and city are shown. No phone number.', lbNameErr: 'Name: 2–16 letters, no phone numbers.',
    lbEmpty: 'Nobody yet — be the first!', lbErr: 'Could not connect. Try again.', lbMyRank: 'Your rank', lbJoin: '🏆 Add your name to join the leaderboard',
  },
  hi: { // हिंदी + बीच-बीच में मैथिली (मिथिलाक बोली)
    title: 'रसगुल्ला रन', sub: 'मिथिलाक मीठ दौड़', play: 'खेलू', best: 'सबसँ नीक', sweets: 'मिठाइ', score: 'स्कोर',
    paused: 'रुकल अछि', resume: 'आगू खेलू', home: 'घर', again: 'फेर खेलू', newBest: 'नव रिकॉर्ड!',
    caught: 'मधुमाछी गोलू केँ पकड़ि लेलक!', crashed: 'धड़ाम! गोलू टकरा गेल!', lane: '← → सरकाउ — लेन बदलू', jump: '↑ सरकाउ — कूदू',
    roll: '↓ सरकाउ — लुढ़कू', keys: 'कीबोर्ड: तीर / WASD, Space = कूदू', rush: 'शुगर रश!', rushBtn: 'शुगर रश',
    magnet: 'मिठाइक डिब्बा', shoes: 'जलेबी जूता', shield: 'लड्डू कवच', near: 'बाल-बाल बचलहुँ!', bees: 'मधुमाछी पाछू पड़ल!',
    shopT: 'माँ भगवती मिष्ठान भंडार', shopS: 'ननौरा चौक, दरभंगा · 2000 ईस्वी से', order: 'मिठाइ ऑर्डर करू', share: 'चुनौती दियौ',
    soon: 'जल्दिए: एतय खेलू आ दोकान पर इनाम पाउ!', loading: 'लोड भ रहल अछि…', by: 'MB Sweets, दरभंगा दिस सँ',
    sound: 'आवाज़', on: 'चालू', off: 'बंद', lang: 'English', combo: 'कॉम्बो', shieldUsed: 'लड्डू कवच बचा लेलक!', smash: 'धमाका!',
    shareText: (s) => `हम रसगुल्ला रन (मिथिलाक मीठ दौड़) मे ${s} स्कोर केलहुँ! अहाँ हमरा हरा सकैत छी?`,
    tip: 'मिठाइ जमा करू, मीटर भरत तँ शुगर रश दबाउ!', gotIt: 'चलू!',
    samosa: 'उड़न समोसा!', samosaS: 'उड़न समोसा', thali: 'डबल थारी ×2', level: 'लेवल',
    lv1: 'सहज गली', lv2: 'हाटक भीड़', lv3: 'तेज़ रफ़्तार', lv4: 'कठिन मोड़', lv5: 'उस्ताद',
    haat: 'मिथिलाक हाट!', baraat: 'आगू बरियाती!', mela: 'मेला! मिठाइए मिठाइ!',
    lb: '🏆 लीडरबोर्ड', lbShort: '🏆 रैंक', lbIndia: 'भारत', lbWorld: 'दुनिया', lbWeek: 'एहि हफ़्ता', lbAll: 'सब दिन',
    lbYourName: 'अहाँक नाम', lbCityL: 'अहाँक शहर', lbSave: 'सेव करू', lbEdit: 'नाम बदलू', lbClose: 'बंद करू',
    lbPrivacy: 'सिर्फ़ नाम आ शहर देखाओल जाएत — फ़ोन नंबर नहि।', lbNameErr: 'नाम: 2–16 अक्षर, फ़ोन नंबर नहि।',
    lbEmpty: 'एखन कियो नहि — पहिल बनू!', lbErr: 'नेटवर्क नहि भेटल, फेर कोशिश करू।', lbMyRank: 'अहाँक रैंक', lbJoin: '🏆 नाम लिखू आ लीडरबोर्ड पर आउ',
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
