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
    rail: 'Train zone! Climb the ramp!', haat: 'Mithila Haat!', baraat: 'Baraat ahead!', mela: 'Mela bonus! Sweets everywhere!',
    lb: '🏆 Leaderboard', lbShort: '🏆 Ranks', lbIndia: 'India', lbWorld: 'World', lbWeek: 'This week', lbAll: 'All time',
    lbYourName: 'Your name', lbCityL: 'Your city', lbSave: 'Save', lbEdit: 'Change name', lbClose: 'Close',
    lbPrivacy: 'Only your name and city are shown. No phone number.', lbNameErr: 'Name: 2–16 letters, no phone numbers.',
    lbEmpty: 'Nobody yet — be the first!', lbErr: 'Could not connect. Try again.', lbMyRank: 'Your rank', lbJoin: '🏆 Add your name to join the leaderboard',
    btnMs: '🎯 Missions', btnUp: '⬆️ Upgrades', btnSet: '⚙️ Settings', msT: 'Missions', upT: 'Upgrades', setT: 'Settings',
    daily: 'Daily reward', day: 'Day', claim: 'Collect', dailyDone: 'Come back tomorrow — the reward grows!', dailySub: 'Play every day, the reward grows!',
    msDone: 'Mission complete!', msReward: 'Reward', msNote: 'Rewards come when the run ends. Finish all 3 = set complete: a new outfit or sweets + score multiplier +1!', msGain: (n) => `🎯 Missions: +${n} sweets`,
    upNote: 'Spend sweets to make power-ups last longer.', sec: 'sec', max: 'MAX', noSweets: 'Not enough sweets', upDone: 'Upgraded!',
    monkey: 'Monkey! Save your sweets!', monkeyGrab: (n) => `The monkey stole ${n} sweets!`, monkeyGrabS: 'Oh no, the monkey ran off!', monkeyGone: 'The monkey gave up! +25 sweets', monkeyGoneS: 'Ha! The monkey gave up!',
    revT: 'Continue?', revAd: '▶ Watch ad & continue', revPay: (n) => `Continue for ${n} sweets`, revNo: 'No thanks', revived: 'Back in the race!', adNo: 'No ad right now',
    btnWard: '👕 Wardrobe', msSet: 'Mission set', msMult: 'Score multiplier', msNext: 'Set reward', bdT: 'Badges', bdNote: 'Each new badge gives +100 sweets.',
    daily7: 'Collect all 7 days to unlock the Sweet Sparkle Trail!', wHead: 'Turban', wBody: 'Clothes', wFeet: 'Shoes', wExtra: 'Extra',
    wWorn: 'Wearing', wWear: 'Wear', wSet: (n) => `Set ${n}`, wDaily7: '7-day reward', wTry: 'Trying it on! Finish missions or buy it to keep it.', wNote: 'Tap to wear. Locked items: try them on!',
    unTitle: 'NEW OUTFIT UNLOCKED!', unWear: 'Wear it now!', unLater: 'Later', hs: (c) => `🚀 Start flying (${c} sweets)`, hsOn: (c) => `🚀 Start flying: ON (${c})`,
    badgeNew: 'New badge!',
    sMusic: 'Music', sVoice: 'Voice', sVib: 'Vibration', sGfx: 'Graphics', g_low: 'Low', g_auto: 'Auto', g_high: 'High', sLang: 'Language',
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
    rail: 'रेल आबि रहल अछि! ढलान पर चढ़ू!', haat: 'मिथिलाक हाट!', baraat: 'आगू बरियाती!', mela: 'मेला! मिठाइए मिठाइ!',
    lb: '🏆 लीडरबोर्ड', lbShort: '🏆 रैंक', lbIndia: 'भारत', lbWorld: 'दुनिया', lbWeek: 'एहि हफ़्ता', lbAll: 'सब दिन',
    lbYourName: 'अहाँक नाम', lbCityL: 'अहाँक शहर', lbSave: 'सेव करू', lbEdit: 'नाम बदलू', lbClose: 'बंद करू',
    lbPrivacy: 'सिर्फ़ नाम आ शहर देखाओल जाएत — फ़ोन नंबर नहि।', lbNameErr: 'नाम: 2–16 अक्षर, फ़ोन नंबर नहि।',
    lbEmpty: 'एखन कियो नहि — पहिल बनू!', lbErr: 'नेटवर्क नहि भेटल, फेर कोशिश करू।', lbMyRank: 'अहाँक रैंक', lbJoin: '🏆 नाम लिखू आ लीडरबोर्ड पर आउ',
    btnMs: '🎯 मिशन', btnUp: '⬆️ अपग्रेड', btnSet: '⚙️ सेटिंग्स', msT: 'मिशन', upT: 'अपग्रेड', setT: 'सेटिंग्स',
    daily: 'रोज़क इनाम', day: 'दिन', claim: 'लिअ', dailyDone: 'काल्हि फेर आउ — इनाम बढ़ैत जाएत!', dailySub: 'रोज़ खेलू, इनाम बढ़ैत जाएत!',
    msDone: 'मिशन पूरा भेल!', msReward: 'इनाम', msNote: 'इनाम दौड़ ख़त्म भेला पर भेटत। तीनू पूरा = सेट पूरा: नव कपड़ा वा मिठाइ + स्कोर गुणक +1!', msGain: (n) => `🎯 मिशन इनाम: +${n} मिठाइ`,
    upNote: 'मिठाइ खर्च करू — बूस्टर बेसी देर चलत।', sec: 'सेकेंड', max: 'पूरा', noSweets: 'मिठाइ कम अछि', upDone: 'अपग्रेड भ गेल!',
    monkey: 'बंदर! मिठाइ बचाउ!', monkeyGrab: (n) => `बंदर ${n} मिठाइ ल’ क’ भागल!`, monkeyGrabS: 'हाय रे, बंदर ल’ क’ भागल!', monkeyGone: 'बंदर हारि गेल! +25 मिठाइ', monkeyGoneS: 'हा हा, बंदर हारि गेल!',
    revT: 'आगू खेलब?', revAd: '▶ विज्ञापन देखि आगू खेलू', revPay: (n) => `${n} मिठाइ दय आगू खेलू`, revNo: 'नहि, बस', revived: 'फेर दौड़ू!', adNo: 'एखन विज्ञापन नहि अछि',
    btnWard: '👕 अलमारी', msSet: 'मिशन सेट', msMult: 'स्कोर गुणक', msNext: 'सेटक इनाम', bdT: 'बैज', bdNote: 'हर नव बैज पर +100 मिठाइ।',
    daily7: 'पूरा 7 दिन लिअ — मिठाइक चमक खुलत!', wHead: 'पगड़ी', wBody: 'कपड़ा', wFeet: 'जूता', wExtra: 'आर',
    wWorn: 'पहिरल', wWear: 'पहिरू', wSet: (n) => `सेट ${n}`, wDaily7: '7 दिनक इनाम', wTry: 'पहिरि क’ देखि रहल छी! रखबाक लेल मिशन पूरा करू वा किनू।', wNote: 'छूबि क’ पहिरू। बंद चीज़ सेहो पहिरि क’ देखू!',
    unTitle: 'नव कपड़ा खुलल!', unWear: 'एखने पहिरू!', unLater: 'बाद मे', hs: (c) => `🚀 उड़ान सँ शुरू (${c} मिठाइ)`, hsOn: (c) => `🚀 उड़ान सँ शुरू: चालू (${c})`,
    badgeNew: 'नव बैज!',
    sMusic: 'संगीत', sVoice: 'बोली', sVib: 'कंपन', sGfx: 'ग्राफ़िक्स', g_low: 'कम', g_auto: 'ऑटो', g_high: 'बेसी', sLang: 'भाषा',
  },
};

function detect() {
  const saved = store('lang');
  if (saved === 'hi' || saved === 'en') return saved;
  return 'hi'; // अपनी वेबसाइट पर हमेशा मैथिली (फ़ोन English में हो तब भी); पोर्टल पर main.js पहले ही भाषा तय कर देता है
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
