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
    lbYourName: 'Your name', lbCityL: 'Your district', lbSave: 'Save', lbEdit: 'Change name', lbClose: 'Close',
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
    rwBtn: '🎫 Shop rewards', rwT: '🎫 MB Sweets rewards', rwSoon: '🎫 Play daily — free rasgulla at our shop!',
    rwCard: '10 stamps = 1 FREE rasgulla at MB Sweets (no purchase needed)', rwLeft: (n) => `${n} more stamps`, rwWeek: (a, b) => `this week ${a}/${b} free`,
    rwToday: "Today's stamps (up to 3 a day)", rwGold: 'Catch the ✨ golden rasgulla in a run', rwMission: 'Complete any 🎯 mission', rwDist: 'Run 1000 m in one go',
    rwCoupons: 'Your coupons', rwShow: 'Show this code at the MB Sweets counter, Nanaura Chowk', rwNone: 'No coupon yet — fill your card!',
    rwUntil: (d) => `valid till ${d}`, rwUsed: 'used ✔', rwMore: 'More rewards',
    rwOff: (s, amt, min) => `Score ${s}+ in one run → ₹${amt} off on ₹${min}+ sweets/namkeen (once a week)`, rwTop: 'Darbhanga weekly top 3 → 250 g sweets free',
    rwRulesT: 'Rules', rwRules: ['Free game — no money is ever needed to play.', 'One phone = one card. Up to 2 free rasgullas a week per phone.', 'Coupons are valid for 7 days, only at MB Sweets, Nanaura Chowk, Darbhanga.', 'The shop gives a fixed number of free rasgullas a day — if today’s are over, your coupon still works the next day.', 'The ₹20 discount is not for milk, curd, paneer or packed items.', 'Coupons cannot be exchanged for cash.'],
    rwStamp: (a, n, need) => `🍬 +${a} stamp${a > 1 ? 's' : ''}! Card ${n}/${need}`, rwGot: 'Coupon won:', rwOpen: 'Tap to see your coupons', rwFull: 'Card full — this week’s 2 free rasgullas are done. New coupon on Monday!',
    rwLater: 'No internet — stamps will be added later today', rwGoldT: '✨ Golden rasgulla! +1 stamp',
    leaveT: 'Leave the game?', leaveP: 'Your sweets and records are saved.', leaveNo: 'Keep playing', leaveYes: 'Yes, leave',
    tutRush: 'Meter full! Tap SUGAR RUSH', tutPause: 'Tap to pause', howTo: '📖 How to play', fullHint: 'Full screen — swipe from the edge to see the phone buttons',
    lv6: 'Jungle Night', lv7: 'Golden Fields', lv8: 'Rocket Speed', lv9: 'Mithila Legend',
    zNight: 'Night falls!', zJungle: 'Into the jungle!', zFields: 'Mustard fields!', zDawn: 'Good morning!', zVillage: 'Back to the village!',
    rateQ: 'How do you like Rasgulla Run?', rateShort: 'Enjoying it?', r1: 'Bad', r2: 'Not good', r3: 'Okay', r4: 'Good', r5: 'Awesome!',
    rateGoodQ: 'What did you like?', rateBadQ: 'What went wrong?', t_fun: 'Fun', t_gfx: 'Great graphics', t_world: 'Love the jungle & night', t_rewards: 'Nice rewards', t_voice: 'Love the voice',
    t_lag: 'Lag / slow', t_hard: 'Too hard', t_confusing: "Didn't understand", t_boring: 'Boring', t_bugs: 'Glitch / stuck',
    ratePhG: 'Anything else you want? (optional)', ratePhB: 'What should we fix? (optional)', ratePriv: 'No name or phone number is sent.', rateSend: 'Send',
    rateThanks: 'Thank you!', rateThanksG: 'So happy you like it! Invite your friends too.', rateThanksB: "We'll fix it soon. Thanks for telling us!", rateOffline: 'will be sent when you are online', rateBtn: '⭐ Rate the game',
    ordSay: (who, list) => `${who} wants ${list}!`, ordReady: 'Packed! Run through the door 🎁', ordGo: 'Door is in this lane:', ordMiss: 'Missed the door!',
    ordLate: (who) => `Too late — ${who} is upset!`, ordGot: (n) => `Delivered! +${n} sweets`, ordWrong: 'Wrong sweet!',
    tutTrick: 'Tap in the air = trick!', trickFail: 'Oops! Land straight!',
    profT: 'Your name & district', profP: 'For the leaderboard and shop prizes. Only name and district are shown — no phone number.', profGo: "Let's play!", profLater: 'Later',
    thiefChip: 'Catch him!', festSama: 'Sama-Chakeva!', festTag: '🪔 Sama-Chakeva special: collect 5 clay Chakeva birds in a run!', festDone: 'All 5 Chakeva! +100 sweets', festChip: 'Chakeva', chuglaBurn: 'Chugla burned! 🔥 +15', madhubani: 'Madhubani Magic!', madhuS: 'Madhubani', pondZ: 'Makhana pond! Boat ride!', makhanaT: '+5 Makhana!', dailyBtn: "📅 Today's Route", dailySub: (n, sc) => `Top today: ${n} · ${sc}`, dailyFirst: 'Same route for all — be first!', dailyOn: "Today's Route",
    chalT: (n) => `${n} challenged you!`, chalP: (d, sc) => `Beat ${d} m · ${sc} points — race the ghost!`, chalGo: "Let's beat it!",
    ghostWin: (n, d) => `👻 You beat ${n} by ${d} m!`, ghostLose: (n, d) => `👻 ${n} was ${d} m ahead`,
    ghostShare: (d, sc) => `I ran ${d} m (${sc} points) in Rasgulla Run — race my ghost and beat me!`, lbDay: 'Today', ghostAhead: 'ahead', ghostBehind: 'behind', wBill: 'Shop bill code', storyBtn: "📖 Golu's Story", storyBtnS: '📖 Story', storyCh: (a, n) => `Chapter ${a}/${n}`, storyAll: 'All chapters done ⭐', storyN: (i) => `Chapter ${i}`, storyGo: 'Start', storyNext: 'Next', storySkip: 'Skip ›', storyDone: (i) => `Chapter ${i} complete!`, storyNextOpen: 'next chapter unlocked', storyAgain: 'try again!', storyChip: 'Story', sWx: 'Real weather', wxCredit: 'Darbhanga weather: based on data from MET Norway (CC BY 4.0)', wxTag: (i, n, t) => `${i} Darbhanga now: ${n}${t != null ? ` · ${t}°` : ''}`, wx_clear: 'clear', wx_cloud: 'cloudy', wx_rain: 'rain', wx_storm: 'storm', wx_fog: 'fog', beatHint: 'Jump on the beat!', beatOk: (n) => `🥁 On beat! ×${n}`, momTrick: (n) => `🤸 ${n}x tricks!`, momDeliver: (s) => `🛵 Delivery ${s}`, momMonkey: '🐒 Caught the thief!', momChapter: (i) => `📖 Chapter ${i} done!`, momFest: '🕊️ All 5 Chakeva!', momMadhu: '🎨 Madhubani Magic!', momFly: '🔺 Flying Samosa!', momPond: '🚣 Makhana Pond!', momRecord: '🏆 New record!', momNear: '😅 Close call!', shotBtn: '📸 Best moment — share to Status', cardPlay: 'Play free — scan the QR', cardShop: 'Maa Bhagwati Mishthan Bhandar · Nanaura, Darbhanga', cardShare: 'My best moment in Rasgulla Run! Play free: https://mbsweets.github.io/game/', cardSaved: 'Saved to your phone 📸', distU: 'm', gsBtn: '🏪 My Shop', gsLv: (a, n) => `Level ${a}/${n}`, gsDay: (d) => `Daily earning: ${d} sweets`, gsGet: (d) => `Collect today's earning (+${d})`, gsGot: "Today's earning collected — come back tomorrow", gsBuild: 'build', gsMax: 'Sweet Palace complete! Golu is the king of sweets.', gsNote: 'Every level earns more each day. Collect sweets, grow the shop!', bcT: '🧾 Code from your MB Sweets bill', bcPh: 'e.g. R23-NHT', bcGo: 'Add', bcOk: (n) => `+2 stamps! Card ${n}/10 · +300 game sweets`, bcPag: 'New: MB Sweets Paag! 🧾', bcErr: { nf: 'Code not found — check the bill', used: 'This code is already used', mine: 'You already added this code', expired: 'Code expired (7 days)', many: 'Max 2 bill codes a day — try tomorrow', net: 'No internet — try again' }, bcNote: 'Buy at MB Sweets → game code on your bill → +2 stamps + special paag',
  },
  hi: { // हिंदी
    title: 'रसगुल्ला रन', sub: 'मिथिला की मीठी दौड़', play: 'खेलो', best: 'सबसे अच्छा', sweets: 'मिठाई', score: 'स्कोर',
    paused: 'रुका हुआ है', resume: 'आगे खेलो', home: 'घर', again: 'फिर खेलो', newBest: 'नया रिकॉर्ड!',
    caught: 'मधुमक्खियों ने गोलू को पकड़ लिया!', crashed: 'धड़ाम! गोलू टकरा गया!', lane: '← → उँगली खिसकाओ — लेन बदलो', jump: '↑ खिसकाओ — कूदो',
    roll: '↓ खिसकाओ — लुढ़को', keys: 'कीबोर्ड: तीर / WASD, Space = कूदो', rush: 'शुगर रश!', rushBtn: 'शुगर रश',
    magnet: 'मिठाई का डिब्बा', shoes: 'जलेबी जूते', shield: 'लड्डू कवच', near: 'बाल-बाल बचे!', bees: 'मधुमक्खियाँ पीछे पड़ी हैं!',
    shopT: 'माँ भगवती मिष्ठान भंडार', shopS: 'ननौरा चौक, दरभंगा · सन् 2000 से', order: 'मिठाई ऑर्डर करें', share: 'दोस्तों को चुनौती दो',
    soon: 'जल्द ही: यहाँ खेलो और दुकान पर इनाम पाओ!', loading: 'लोड हो रहा है…', by: 'MB Sweets, दरभंगा की ओर से',
    sound: 'आवाज़', on: 'चालू', off: 'बंद', lang: 'भाषा', combo: 'कॉम्बो', shieldUsed: 'लड्डू कवच ने बचा लिया!', smash: 'धमाका!',
    shareText: (s) => `मैंने रसगुल्ला रन (मिथिला की मीठी दौड़) में ${s} स्कोर बनाया! क्या तुम मुझे हरा सकते हो?`,
    tip: 'मिठाई जमा करो, मीटर भरने पर शुगर रश दबाओ!', gotIt: 'चलो!',
    samosa: 'उड़न समोसा!', samosaS: 'उड़न समोसा', thali: 'डबल थाली ×2', level: 'लेवल',
    lv1: 'आसान गली', lv2: 'बाज़ार की भीड़', lv3: 'तेज़ रफ़्तार', lv4: 'मुश्किल मोड़', lv5: 'उस्ताद',
    rail: 'रेल आ रही है! ढलान पर चढ़ो!', haat: 'मिथिला हाट!', baraat: 'आगे बारात है!', mela: 'मेला! मिठाई ही मिठाई!',
    lb: '🏆 लीडरबोर्ड', lbShort: '🏆 रैंक', lbIndia: 'भारत', lbWorld: 'दुनिया', lbWeek: 'इस हफ़्ते', lbAll: 'अब तक',
    lbYourName: 'तुम्हारा नाम', lbCityL: 'तुम्हारा ज़िला', lbSave: 'सेव करो', lbEdit: 'नाम बदलो', lbClose: 'बंद करो',
    lbPrivacy: 'सिर्फ़ नाम और शहर दिखेगा — फ़ोन नंबर नहीं।', lbNameErr: 'नाम: 2–16 अक्षर, फ़ोन नंबर नहीं।',
    lbEmpty: 'अभी कोई नहीं — पहले बनो!', lbErr: 'नेटवर्क नहीं मिला, फिर कोशिश करो।', lbMyRank: 'तुम्हारी रैंक', lbJoin: '🏆 नाम लिखो और लीडरबोर्ड पर आओ',
    btnMs: '🎯 मिशन', btnUp: '⬆️ अपग्रेड', btnSet: '⚙️ सेटिंग्स', msT: 'मिशन', upT: 'अपग्रेड', setT: 'सेटिंग्स',
    daily: 'रोज़ का इनाम', day: 'दिन', claim: 'लो', dailyDone: 'कल फिर आना — इनाम बढ़ता जाएगा!', dailySub: 'रोज़ खेलो, इनाम बढ़ता जाएगा!',
    msDone: 'मिशन पूरा हुआ!', msReward: 'इनाम', msNote: 'इनाम दौड़ ख़त्म होने पर मिलेगा। तीनों पूरे = सेट पूरा: नए कपड़े या मिठाई + स्कोर गुणक +1!', msGain: (n) => `🎯 मिशन इनाम: +${n} मिठाई`,
    upNote: 'मिठाई ख़र्च करो — बूस्टर ज़्यादा देर चलेंगे।', sec: 'सेकंड', max: 'पूरा', noSweets: 'मिठाई कम है', upDone: 'अपग्रेड हो गया!',
    monkey: 'बंदर! मिठाई बचाओ!', monkeyGrab: (n) => `बंदर ${n} मिठाई लेकर भाग गया!`, monkeyGrabS: 'हाय, बंदर लेकर भाग गया!', monkeyGone: 'बंदर हार गया! +25 मिठाई', monkeyGoneS: 'हा हा, बंदर हार गया!',
    revT: 'आगे खेलोगे?', revAd: '▶ विज्ञापन देखकर आगे खेलो', revPay: (n) => `${n} मिठाई देकर आगे खेलो`, revNo: 'नहीं, बस', revived: 'फिर दौड़ो!', adNo: 'अभी विज्ञापन नहीं है',
    btnWard: '👕 अलमारी', msSet: 'मिशन सेट', msMult: 'स्कोर गुणक', msNext: 'सेट का इनाम', bdT: 'बैज', bdNote: 'हर नए बैज पर +100 मिठाई।',
    daily7: 'पूरे 7 दिन लो — मिठाई की चमक खुलेगी!', wHead: 'पगड़ी', wBody: 'कपड़े', wFeet: 'जूते', wExtra: 'और',
    wWorn: 'पहना है', wWear: 'पहनो', wSet: (n) => `सेट ${n}`, wDaily7: '7 दिन का इनाम', wTry: 'पहनकर देख रहे हो! रखने के लिए मिशन पूरे करो या ख़रीदो।', wNote: 'छूकर पहनो। बंद चीज़ें भी पहनकर देखो!',
    unTitle: 'नए कपड़े खुले!', unWear: 'अभी पहनो!', unLater: 'बाद में', hs: (c) => `🚀 उड़ान से शुरू (${c} मिठाई)`, hsOn: (c) => `🚀 उड़ान से शुरू: चालू (${c})`,
    badgeNew: 'नया बैज!',
    sMusic: 'संगीत', sVoice: 'बोली', sVib: 'कंपन', sGfx: 'ग्राफ़िक्स', g_low: 'कम', g_auto: 'ऑटो', g_high: 'ज़्यादा', sLang: 'भाषा',
    rwBtn: '🎫 दुकान के इनाम', rwT: '🎫 MB Sweets इनाम', rwSoon: '🎫 रोज़ खेलो — दुकान पर मुफ़्त रसगुल्ला!',
    rwCard: '10 स्टैम्प = MB Sweets पर 1 रसगुल्ला मुफ़्त (कुछ ख़रीदना ज़रूरी नहीं)', rwLeft: (n) => `और ${n} स्टैम्प`, rwWeek: (a, b) => `इस हफ़्ते ${a}/${b} मुफ़्त`,
    rwToday: 'आज के स्टैम्प (रोज़ 3 तक)', rwGold: 'दौड़ में ✨ सोने का रसगुल्ला पकड़ो', rwMission: 'कोई भी 🎯 मिशन पूरा करो', rwDist: 'एक दौड़ में 1000 मी.',
    rwCoupons: 'तुम्हारे कूपन', rwShow: 'यह कोड MB Sweets (ननौरा चौक) के काउंटर पर दिखाओ', rwNone: 'अभी कूपन नहीं — कार्ड भरो!',
    rwUntil: (d) => `${d} तक`, rwUsed: 'मिल गया ✔', rwMore: 'और इनाम',
    rwOff: (s, amt, min) => `एक दौड़ में ${s}+ स्कोर → ₹${min}+ की मिठाई/नमकीन पर ₹${amt} छूट (हफ़्ते में 1 बार)`, rwTop: 'हर हफ़्ते दरभंगा के टॉप 3 → 250 ग्राम मिठाई मुफ़्त',
    rwRulesT: 'नियम', rwRules: ['गेम मुफ़्त है — खेलने के लिए कभी पैसे नहीं लगेंगे।', 'एक मोबाइल = एक कार्ड। एक मोबाइल को हफ़्ते में 2 मुफ़्त रसगुल्ले तक।', 'कूपन 7 दिन तक चलेगा, सिर्फ़ MB Sweets, ननौरा चौक, दरभंगा में।', 'दुकान रोज़ गिने हुए मुफ़्त रसगुल्ले देती है — आज के पूरे हो गए तो तुम्हारा कूपन कल चलेगा।', '₹20 की छूट दूध, दही, पनीर और पैकेट वाले सामान पर नहीं।', 'कूपन के बदले नकद पैसे नहीं।'],
    rwStamp: (a, n, need) => `🍬 +${a} स्टैम्प! कार्ड ${n}/${need}`, rwGot: 'कूपन मिला:', rwOpen: 'कूपन देखने के लिए छुओ', rwFull: 'कार्ड भर गया — इस हफ़्ते के 2 रसगुल्ले हो गए। सोमवार को नया कूपन!',
    rwLater: 'नेट नहीं — स्टैम्प आज बाद में जुड़ेंगे', rwGoldT: '✨ सोने का रसगुल्ला! +1 स्टैम्प',
    leaveT: 'खेल छोड़ें?', leaveP: 'तुम्हारी मिठाई और रिकॉर्ड सेव हैं।', leaveNo: 'खेलते रहो', leaveYes: 'हाँ, बाहर जाओ',
    tutRush: 'मीटर भर गया! शुगर रश दबाओ', tutPause: 'रोकने के लिए दबाओ', howTo: '📖 कैसे खेलें', fullHint: 'पूरी स्क्रीन — फ़ोन के बटन देखने के लिए किनारे से खिसकाओ',
    lv6: 'जंगल की रात', lv7: 'सुनहरे खेत', lv8: 'रॉकेट रफ़्तार', lv9: 'मिथिला का महारथी',
    zNight: 'रात हो गई!', zJungle: 'जंगल शुरू!', zFields: 'सरसों के खेत!', zDawn: 'सुबह हो गई!', zVillage: 'फिर गाँव में!',
    rateQ: 'रसगुल्ला रन कैसा लगा?', rateShort: 'कैसा लगा?', r1: 'बेकार', r2: 'ठीक नहीं', r3: 'ठीक-ठाक', r4: 'अच्छा', r5: 'ज़बरदस्त!',
    rateGoodQ: 'क्या अच्छा लगा?', rateBadQ: 'क्या गड़बड़ लगा?', t_fun: 'मज़ेदार', t_gfx: 'ग्राफ़िक्स बढ़िया', t_world: 'जंगल और रात पसंद', t_rewards: 'इनाम अच्छे', t_voice: 'बोली/आवाज़ अच्छी',
    t_lag: 'लैग / धीमा', t_hard: 'बहुत कठिन', t_confusing: 'समझ नहीं आया', t_boring: 'बोरिंग', t_bugs: 'गड़बड़ / अटकता है',
    ratePhG: 'और क्या चाहिए? (मर्ज़ी से)', ratePhB: 'क्या ठीक करें? (मर्ज़ी से)', ratePriv: 'नाम या फ़ोन नंबर नहीं जाता।', rateSend: 'भेजो',
    rateThanks: 'धन्यवाद!', rateThanksG: 'बहुत ख़ुशी हुई! दोस्तों को भी खिलाओ।', rateThanksB: 'हम जल्दी ठीक करेंगे। बताने के लिए शुक्रिया!', rateOffline: 'नेट आते ही भेज देंगे', rateBtn: '⭐ राय दो',
    ordSay: (who, list) => `${who} को चाहिए: ${list}!`, ordReady: 'पैक हो गया! दरवाज़े से निकलो 🎁', ordGo: 'दरवाज़ा इस लेन में:', ordMiss: 'दरवाज़ा छूट गया!',
    ordLate: (who) => `देर हो गई — ${who} नाराज़!`, ordGot: (n) => `डिलीवरी! +${n} मिठाई`, ordWrong: 'ग़लत मिठाई!',
    tutTrick: 'हवा में टैप = करतब!', trickFail: 'उफ़! सीधा उतरो!',
    profT: 'आपका नाम और ज़िला', profP: 'लीडरबोर्ड और दुकान के इनाम के लिए। सिर्फ़ नाम और ज़िला दिखेगा — फ़ोन नंबर नहीं।', profGo: 'चलो खेलें!', profLater: 'बाद में',
    thiefChip: 'पकड़ो!', festSama: 'सामा-चकेवा!', festTag: '🪔 सामा-चकेवा ख़ास: एक दौड़ में 5 चकेवा पंछी जमा करो!', festDone: 'पाँचों चकेवा! +100 मिठाई', festChip: 'चकेवा', chuglaBurn: 'चुगला दहन! 🔥 +15', madhubani: 'मधुबनी शक्ति!', madhuS: 'मधुबनी', pondZ: 'मखाना पोखर! नाव की सवारी!', makhanaT: '+5 मखाना!', dailyBtn: '📅 आज का रास्ता', dailySub: (n, sc) => `आज के टॉपर: ${n} · ${sc}`, dailyFirst: 'सबका एक ही रास्ता — पहले बनो!', dailyOn: 'आज का रास्ता',
    chalT: (n) => `${n} ने चुनौती दी!`, chalP: (d, sc) => `${d} मी. · ${sc} अंक — परछाईं से रेस करो, हराओ!`, chalGo: 'चलो हराएँ!',
    ghostWin: (n, d) => `👻 ${n} को ${d} मी. से हराया!`, ghostLose: (n, d) => `👻 ${n} ${d} मी. आगे रहे`,
    ghostShare: (d, sc) => `रसगुल्ला रन में मैंने ${d} मीटर दौड़ा (${sc} अंक) — मेरी परछाईं से रेस करो और हराओ!`, lbDay: 'आज', ghostAhead: 'आगे', ghostBehind: 'पीछे', wBill: 'दुकान के बिल का कोड', storyBtn: '📖 गोलू की कहानी', storyBtnS: '📖 कहानी', storyCh: (a, n) => `अध्याय ${a}/${n}`, storyAll: 'सारे अध्याय पूरे ⭐', storyN: (i) => `अध्याय ${i}`, storyGo: 'शुरू करो', storyNext: 'आगे', storySkip: 'छोड़ो ›', storyDone: (i) => `अध्याय ${i} पूरा!`, storyNextOpen: 'अगला अध्याय खुला', storyAgain: 'फिर कोशिश करो!', storyChip: 'कहानी', sWx: 'असली मौसम', wxCredit: 'दरभंगा का मौसम: MET Norway के डेटा पर आधारित (CC BY 4.0)', wxTag: (i, n, t) => `${i} दरभंगा में अभी: ${n}${t != null ? ` · ${t}°` : ''}`, wx_clear: 'साफ़ मौसम', wx_cloud: 'बादल', wx_rain: 'बारिश', wx_storm: 'आँधी-पानी', wx_fog: 'कोहरा', beatHint: 'ढोल की ताल पर कूदो!', beatOk: (n) => `🥁 ताल पर! ×${n}`, momTrick: (n) => `🤸 ×${n} करतब!`, momDeliver: (s) => `🛵 डिलीवरी ${s}`, momMonkey: '🐒 चोर बंदर पकड़ा!', momChapter: (i) => `📖 अध्याय ${i} पूरा!`, momFest: '🕊️ पाँचों चकेवा!', momMadhu: '🎨 मधुबनी शक्ति!', momFly: '🔺 उड़न समोसा!', momPond: '🚣 मखाना पोखर!', momRecord: '🏆 नया रिकॉर्ड!', momNear: '😅 बाल-बाल बचे!', shotBtn: '📸 बेस्ट पल — स्टेटस पर लगाओ', cardPlay: 'मुफ़्त खेलो — QR स्कैन करो', cardShop: 'माँ भगवती मिष्ठान भंडार · ननौरा, दरभंगा', cardShare: 'रसगुल्ला रन में मेरा बेस्ट पल! तुम भी मुफ़्त खेलो: https://mbsweets.github.io/game/', cardSaved: 'फ़ोन में सेव हो गया 📸', distU: 'मी.', gsBtn: '🏪 मेरी दुकान', gsLv: (a, n) => `स्तर ${a}/${n}`, gsDay: (d) => `रोज़ की कमाई: ${d} मिठाई`, gsGet: (d) => `आज की कमाई लो (+${d})`, gsGot: 'आज की कमाई ले ली — कल फिर आओ', gsBuild: 'बनाओ', gsMax: 'मिठाई महल बन गया! गोलू मिठाई का राजा।', gsNote: 'हर स्तर पर रोज़ की कमाई बढ़ती है। मिठाई जमा करो, दुकान बड़ी करो!', bcT: '🧾 MB Sweets के बिल वाला कोड', bcPh: 'जैसे R23-NHT', bcGo: 'डालो', bcOk: (n) => `+2 स्टैम्प! कार्ड ${n}/10 · +300 गेम-मिठाई`, bcPag: 'नई: MB Sweets पाग! 🧾', bcErr: { nf: 'कोड नहीं मिला — बिल पर फिर से देखो', used: 'यह कोड पहले ही इस्तेमाल हो चुका', mine: 'यह कोड तुम पहले ही डाल चुके', expired: 'कोड का समय निकल गया (7 दिन)', many: 'दिन में 2 बिल-कोड तक — कल डालो', net: 'इंटरनेट नहीं मिला — फिर दबाओ' }, bcNote: 'MB Sweets से ख़रीदो → बिल पर गेम कोड → +2 स्टैम्प + ख़ास पाग',
  },
  mai: { // मैथिली (मिथिलाक बोली)
    title: 'रसगुल्ला रन', sub: 'मिथिलाक मीठ दौड़', play: 'खेलू', best: 'सबसँ नीक', sweets: 'मिठाइ', score: 'स्कोर',
    paused: 'रुकल अछि', resume: 'आगू खेलू', home: 'घर', again: 'फेर खेलू', newBest: 'नव रिकॉर्ड!',
    caught: 'मधुमाछी गोलू केँ पकड़ि लेलक!', crashed: 'धड़ाम! गोलू टकरा गेल!', lane: '← → आँगुर घुसकाउ — लेन बदलू', jump: '↑ घुसकाउ — कूदू',
    roll: '↓ घुसकाउ — लुढ़कू', keys: 'कीबोर्ड: तीर / WASD, Space = कूदू', rush: 'शुगर रश!', rushBtn: 'शुगर रश',
    magnet: 'मिठाइक डिब्बा', shoes: 'जलेबी जूता', shield: 'लड्डू कवच', near: 'बाल-बाल बचलहुँ!', bees: 'मधुमाछी पाछाँ लागल अछि!',
    shopT: 'माँ भगवती मिष्ठान भंडार', shopS: 'ननौरा चौक, दरभंगा · सन् 2000 सँ', order: 'मिठाइ ऑर्डर करू', share: 'चुनौती दियौ',
    soon: 'जल्दिए: एतय खेलू आ दोकान पर इनाम पाउ!', loading: 'लोड भ रहल अछि…', by: 'MB Sweets, दरभंगा दिस सँ',
    sound: 'आवाज़', on: 'चालू', off: 'बंद', lang: 'भाषा', combo: 'कॉम्बो', shieldUsed: 'लड्डू कवच बचा लेलक!', smash: 'धमाका!',
    shareText: (s) => `हम रसगुल्ला रन (मिथिलाक मीठ दौड़) मे ${s} स्कोर केलहुँ! अहाँ हमरा हरा सकैत छी?`,
    tip: 'मिठाइ जमा करू, मीटर भरत तँ शुगर रश दबाउ!', gotIt: 'चलू!',
    samosa: 'उड़न समोसा!', samosaS: 'उड़न समोसा', thali: 'डबल थारी ×2', level: 'लेवल',
    lv1: 'सहज गली', lv2: 'हाटक भीड़', lv3: 'तेज़ रफ़्तार', lv4: 'कठिन मोड़', lv5: 'उस्ताद',
    rail: 'रेल आबि रहल अछि! ढलान पर चढ़ू!', haat: 'मिथिलाक हाट!', baraat: 'आगू बरियाती!', mela: 'मेला! मिठाइए मिठाइ!',
    lb: '🏆 लीडरबोर्ड', lbShort: '🏆 रैंक', lbIndia: 'भारत', lbWorld: 'दुनिया', lbWeek: 'एहि हफ़्ता', lbAll: 'सब दिन',
    lbYourName: 'अहाँक नाम', lbCityL: 'अहाँक जिला', lbSave: 'सेव करू', lbEdit: 'नाम बदलू', lbClose: 'बंद करू',
    lbPrivacy: 'मात्र नाम आ शहर देखाओल जाएत — फ़ोन नंबर नहि।', lbNameErr: 'नाम: 2–16 अक्षर, फ़ोन नंबर नहि।',
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
    rwBtn: '🎫 दोकानक इनाम', rwT: '🎫 MB Sweets इनाम', rwSoon: '🎫 रोज़ खेलू — दोकान पर मुफ़्त रसगुल्ला!',
    rwCard: '10 स्टैम्प = MB Sweets पर 1 रसगुल्ला मुफ़्त (किछु किनब ज़रूरी नहि)', rwLeft: (n) => `आर ${n} स्टैम्प`, rwWeek: (a, b) => `एहि हफ़्ता ${a}/${b} मुफ़्त`,
    rwToday: 'आजुक स्टैम्प (रोज़ 3 धरि)', rwGold: 'दौड़ मे ✨ सोनाक रसगुल्ला पकड़ू', rwMission: 'कोनो 🎯 मिशन पूरा करू', rwDist: 'एक दौड़ मे 1000 मी.',
    rwCoupons: 'अहाँक कूपन', rwShow: 'ई कोड MB Sweets (ननौरा चौक) क काउंटर पर देखाउ', rwNone: 'एखन कूपन नहि — कार्ड भरू!',
    rwUntil: (d) => `${d} धरि`, rwUsed: 'भेटि गेल ✔', rwMore: 'आर इनाम',
    rwOff: (s, amt, min) => `एक दौड़ मे ${s}+ स्कोर → ₹${min}+ मिठाइ/नमकीन पर ₹${amt} छूट (हफ़्ता मे 1 बेर)`, rwTop: 'हर हफ़्ता दरभंगाक टॉप 3 → 250 ग्राम मिठाइ मुफ़्त',
    rwRulesT: 'नियम', rwRules: ['गेम मुफ़्त अछि — खेलबाक लेल कहियो पाइ नहि लागत।', 'एक मोबाइल = एक कार्ड। एक मोबाइल केँ हफ़्ता मे 2 टा मुफ़्त रसगुल्ला धरि।', 'कूपन 7 दिन धरि चलत, मात्र MB Sweets, ननौरा चौक, दरभंगा मे।', 'दोकान रोज़ गिनल मुफ़्त रसगुल्ला दैत अछि — आजुक पूरा भ गेल त’ अहाँक कूपन काल्हि चलत।', '₹20 छूट दूध, दही, पनीर आ पैकेट वाला सामान पर नहि।', 'कूपनक बदला नकद पाइ नहि।'],
    rwStamp: (a, n, need) => `🍬 +${a} स्टैम्प! कार्ड ${n}/${need}`, rwGot: 'कूपन भेटल:', rwOpen: 'कूपन देखबाक लेल छूबू', rwFull: 'कार्ड भरल — एहि हफ़्ताक 2 टा रसगुल्ला भ गेल। सोम दिन नव कूपन!',
    rwLater: 'नेट नहि — स्टैम्प आइ बाद मे जुड़त', rwGoldT: '✨ सोनाक रसगुल्ला! +1 स्टैम्प',
    leaveT: 'खेल छोड़ब?', leaveP: 'अहाँक मिठाइ आ रिकॉर्ड सेव अछि।', leaveNo: 'खेलैत रहू', leaveYes: 'हँ, बाहर जाउ',
    tutRush: 'मीटर भरि गेल! शुगर रश दबाउ', tutPause: 'रोकबाक लेल दबाउ', howTo: '📖 कोना खेलब', fullHint: 'पूरा स्क्रीन — फ़ोनक बटन देखबाक लेल किनार सँ घुसकाउ',
    lv6: 'जंगलक राति', lv7: 'सोनहुला खेत', lv8: 'रॉकेट रफ़्तार', lv9: 'मिथिलाक महारथी',
    zNight: 'राति भ गेल!', zJungle: 'जंगल शुरू!', zFields: 'सरिसोक खेत!', zDawn: 'भोर भ गेल!', zVillage: 'फेर गाम मे!',
    rateQ: 'रसगुल्ला रन केहन लागल?', rateShort: 'केहन लागल?', r1: 'बेकार', r2: 'नीक नहि', r3: 'ठीक-ठाक', r4: 'नीक', r5: 'बड़ नीक!',
    rateGoodQ: 'की नीक लागल?', rateBadQ: 'की गड़बड़ लागल?', t_fun: 'मज़ेदार', t_gfx: 'ग्राफ़िक्स नीक', t_world: 'जंगल आ राति पसंद', t_rewards: 'इनाम नीक', t_voice: 'बोली नीक',
    t_lag: 'लैग / धीमा', t_hard: 'बड़ कठिन', t_confusing: 'बुझबा मे नहि आएल', t_boring: 'बोरिंग', t_bugs: 'गड़बड़ / अटकैत अछि',
    ratePhG: 'आर की चाही? (मर्ज़ी सँ)', ratePhB: 'की ठीक करी? (मर्ज़ी सँ)', ratePriv: 'नाम वा फ़ोन नंबर नहि जाइत अछि।', rateSend: 'पठाउ',
    rateThanks: 'धन्यवाद!', rateThanksG: 'बड़ खुशी भेल! संगी सब केँ सेहो खेलाउ।', rateThanksB: 'हम जल्दी ठीक करब। कहबाक लेल धन्यवाद!', rateOffline: 'नेट अबिते पठा देब', rateBtn: '⭐ राय दिअ',
    ordSay: (who, list) => `${who} केँ चाही: ${list}!`, ordReady: 'पैक भ गेल! दरबज्जा सँ निकलू 🎁', ordGo: 'दरबज्जा एहि लेन मे:', ordMiss: 'दरबज्जा छूटि गेल!',
    ordLate: (who) => `देरी भ गेल — ${who} रूसि गेलाह!`, ordGot: (n) => `डिलीवरी! +${n} मिठाइ`, ordWrong: 'गलत मिठाइ!',
    tutTrick: 'हवा मे टैप = करतब!', trickFail: 'उफ़! सोझ उतरू!',
    profT: 'अहाँक नाम आ जिला', profP: 'लीडरबोर्ड आ दोकानक इनामक लेल। खाली नाम आ जिला देखाएत — फ़ोन नंबर नहि।', profGo: 'चलू खेली!', profLater: 'बाद मे',
    thiefChip: 'पकड़ू!', festSama: 'सामा-चकेवा!', festTag: '🪔 सामा-चकेवा विशेष: एक दौड़ मे 5 टा चकेवा चिड़ै जमा करू!', festDone: 'पाँचो चकेवा! +100 मिठाइ', festChip: 'चकेवा', chuglaBurn: 'चुगला दहन! 🔥 +15', madhubani: 'मधुबनी शक्ति!', madhuS: 'मधुबनी', pondZ: 'मखाना पोखरि! नावक सवारी!', makhanaT: '+5 मखान!', dailyBtn: '📅 आजुक रस्ता', dailySub: (n, sc) => `आजुक टॉपर: ${n} · ${sc}`, dailyFirst: 'सबहक एक्के रस्ता — पहिल बनू!', dailyOn: 'आजुक रस्ता',
    chalT: (n) => `${n} चुनौती देलनि!`, chalP: (d, sc) => `${d} मी. · ${sc} अंक — परछाईं सँ रेस करू, हराउ!`, chalGo: 'चलू हराबी!',
    ghostWin: (n, d) => `👻 ${n} केँ ${d} मी. सँ हरा देलहुँ!`, ghostLose: (n, d) => `👻 ${n} ${d} मी. आगू रहलाह`,
    ghostShare: (d, sc) => `रसगुल्ला रन मे हम ${d} मीटर दौड़लहुँ (${sc} अंक) — हमर परछाईं सँ रेस करू आ हराउ!`, lbDay: 'आइ', ghostAhead: 'आगू', ghostBehind: 'पाछू', wBill: 'दोकानक बिलक कोड', storyBtn: '📖 गोलूक कथा', storyBtnS: '📖 कथा', storyCh: (a, n) => `अध्याय ${a}/${n}`, storyAll: 'सब अध्याय पूरा ⭐', storyN: (i) => `अध्याय ${i}`, storyGo: 'शुरू करू', storyNext: 'आगू', storySkip: 'छोड़ू ›', storyDone: (i) => `अध्याय ${i} पूरा!`, storyNextOpen: 'अगिला अध्याय खुजल', storyAgain: 'फेर कोशिश करू!', storyChip: 'कथा', sWx: 'असली मौसम', wxCredit: 'दरभंगाक मौसम: MET Norway क डेटा पर आधारित (CC BY 4.0)', wxTag: (i, n, t) => `${i} दरभंगा मे एखन: ${n}${t != null ? ` · ${t}°` : ''}`, wx_clear: 'साफ़ मौसम', wx_cloud: 'मेघ', wx_rain: 'बरखा', wx_storm: 'आँधी-पानि', wx_fog: 'कुहेस', beatHint: 'ढोलक ताल पर कूदू!', beatOk: (n) => `🥁 ताल पर! ×${n}`, momTrick: (n) => `🤸 ×${n} करतब!`, momDeliver: (s) => `🛵 डिलीवरी ${s}`, momMonkey: '🐒 चोर बंदर पकड़लहुँ!', momChapter: (i) => `📖 अध्याय ${i} पूरा!`, momFest: '🕊️ पाँचो चकेवा!', momMadhu: '🎨 मधुबनी शक्ति!', momFly: '🔺 उड़न समोसा!', momPond: '🚣 मखाना पोखरि!', momRecord: '🏆 नव रिकॉर्ड!', momNear: '😅 बाल-बाल बचलहुँ!', shotBtn: '📸 बेस्ट पल — स्टेटस पर लगाउ', cardPlay: 'मुफ़्त खेलू — QR स्कैन करू', cardShop: 'माँ भगवती मिष्ठान भंडार · ननौरा, दरभंगा', cardShare: 'रसगुल्ला रन मे हमर बेस्ट पल! अहूँ मुफ़्त खेलू: https://mbsweets.github.io/game/', cardSaved: 'फ़ोन मे सेव भ गेल 📸', distU: 'मी.', gsBtn: '🏪 हमर दोकान', gsLv: (a, n) => `स्तर ${a}/${n}`, gsDay: (d) => `रोज़क कमाइ: ${d} मिठाइ`, gsGet: (d) => `आजुक कमाइ लिअ (+${d})`, gsGot: 'आजुक कमाइ लेलहुँ — काल्हि फेर आउ', gsBuild: 'बनाउ', gsMax: 'मिठाइक महल बनि गेल! गोलू मिठाइक राजा।', gsNote: 'हर स्तर पर रोज़क कमाइ बढ़ैत अछि। मिठाइ जमा करू, दोकान पैघ करू!', bcT: '🧾 MB Sweets बिल वला कोड', bcPh: 'जेना R23-NHT', bcGo: 'डालू', bcOk: (n) => `+2 स्टैम्प! कार्ड ${n}/10 · +300 गेम-मिठाइ`, bcPag: 'नव: MB Sweets पाग! 🧾', bcErr: { nf: 'कोड नहि भेटल — बिल पर फेर देखू', used: 'ई कोड पहिने इस्तेमाल भ चुकल', mine: 'ई कोड अहाँ पहिने डालि चुकल छी', expired: 'कोडक समय निकलि गेल (7 दिन)', many: 'दिन मे 2 बिल-कोड धरि — काल्हि डालू', net: 'इंटरनेट नहि भेटल — फेर दबाउ' }, bcNote: 'MB Sweets सँ किनू → बिल पर गेम कोड → +2 स्टैम्प + विशेष पाग',
  },
};

export const LANGS = ['en', 'hi', 'mai'];
function detect() {
  const saved = store('lang');
  // पुराना 'hi' = मैथिली था (नई भाषा-स्क्रीन से पहले) — जब तक खिलाड़ी ख़ुद न चुने, मैथिली ही
  if (saved === 'hi' && store('lang3') == null) return 'mai';
  if (LANGS.includes(saved)) return saved;
  return 'mai'; // अपनी वेबसाइट पर पहले से मैथिली; पहली बार खुलते ही भाषा-स्क्रीन आती है. पोर्टल पर main.js भाषा तय करता है
}
export let LANG = detect();
export function T(k, ...a) {
  let v = S[LANG][k];
  if (v === undefined) v = S.en[k];
  return typeof v === 'function' ? v(...a) : v;
}
export function setLang(l) {
  LANG = l;
  store('lang', l); store('lang3', l);
  applyLang();
}
export function applyLang() {
  document.documentElement.lang = LANG === 'mai' ? 'mai' : LANG;
  document.documentElement.dataset.lang = LANG;
  for (const el of document.querySelectorAll('[data-t]')) el.textContent = T(el.dataset.t);
}

// डेटा वाली चीज़ें (मिशन, कपड़े, बैज…) में {en, hi} — वहाँ hi = मैथिली. हिंदी इस नक्शे से
const HIN = {
  'मिठाइक डिब्बा': 'मिठाई का डिब्बा', 'जलेबी जूता': 'जलेबी जूते', 'डबल थारी': 'डबल थाली', 'उड़न समोसा': 'उड़न समोसा',
  'गमछा पगड़ी': 'गमछा पगड़ी', 'पीयर पगड़ी': 'पीली पगड़ी', 'केसरिया साफ़ा': 'केसरिया साफ़ा', 'मिथिला पाग': 'मिथिला पाग', 'मोर पंख': 'मोर पंख',
  'होली पगड़ी': 'होली पगड़ी', 'राजा मुकुट': 'राजा मुकुट', 'उज्जर कुर्ता': 'सफ़ेद कुर्ता', 'पीयर कुर्ता': 'पीला कुर्ता', 'हरियर कुर्ता': 'हरा कुर्ता',
  'क्रिकेट जर्सी': 'क्रिकेट जर्सी', 'दूल्हा शेरवानी': 'दूल्हा शेरवानी', 'सुपरहीरो केप': 'सुपरहीरो केप', 'चप्पल': 'चप्पल', 'खड़ाऊँ': 'खड़ाऊँ',
  'स्पोर्ट्स जूता': 'स्पोर्ट्स जूते', 'सोनाक जूता': 'सोने के जूते', 'किछु नहि': 'कुछ नहीं', 'करिया चश्मा': 'काला चश्मा', 'गुब्बारा': 'गुब्बारा', 'मिठाइक चमक': 'मिठाई की चमक',
  'एक दौड़ मे {n} मिठाइ जमा करू': 'एक दौड़ में {n} मिठाई जमा करो', 'एक दौड़ मे {n} मीटर दौड़ू': 'एक दौड़ में {n} मीटर दौड़ो',
  'एक दौड़ मे {n} स्कोर बनाउ': 'एक दौड़ में {n} स्कोर बनाओ', 'एक दौड़ मे लेवल {n} धरि पहुँचू': 'एक दौड़ में लेवल {n} तक पहुँचो',
  '{n} बेर कूदू': '{n} बार कूदो', '{n} बेर लुढ़कू': '{n} बार लुढ़को', '{n} बेर बाल-बाल बचू': '{n} बार बाल-बाल बचो', '{n} रसमलाई जमा करू': '{n} रसमलाई जमा करो',
  '{n} बूस्टर पकड़ू': '{n} बूस्टर पकड़ो', '{n} बेर शुगर रश चलाउ': '{n} बार शुगर रश चलाओ', 'मिथिलाक हाट {n} बेर पहुँचू': 'मिथिला हाट {n} बार पहुँचो',
  'बंदर सँ {n} बेर बचू': 'बंदर से {n} बार बचो', 'उड़न समोसा {n} बेर पकड़ू': 'उड़न समोसा {n} बार पकड़ो', '{n} सोनाक छल्ला पार करू': '{n} सोने के छल्ले पार करो',
  'रेलगाड़ीक छत पर {n} मीटर दौड़ू': 'रेलगाड़ी की छत पर {n} मीटर दौड़ो', 'जंगल मे {n} मीटर दौड़ू': 'जंगल में {n} मीटर दौड़ो',
  'पहिल दौड़': 'पहली दौड़', 'एक किलोमीटर': 'एक किलोमीटर', 'तीन किलोमीटर': 'तीन किलोमीटर', 'मिठाइ प्रेमी': 'मिठाई प्रेमी', 'मिठाइक राजा': 'मिठाई का राजा',
  'रेलक राजा': 'रेल का राजा', 'हाटक उस्ताद': 'हाट का उस्ताद', 'उड़ाका': 'उड़ाका', 'बाल-बाल 100': 'बाल-बाल 100', 'बंदर-बाज़': 'बंदर-बाज़',
  'सोनाक छल्ला': 'सोने का छल्ला', 'सुपर स्टार': 'सुपर स्टार', 'जंगलक राजा': 'जंगल का राजा',
  '{n} डिलीवरी पूरा करू': '{n} डिलीवरी पूरी करो', 'एक दौड़ मे {n} करतब करू': 'एक दौड़ में {n} करतब करो', '{n} करतब करू': '{n} करतब करो', 'डिलीवरी स्टार': 'डिलीवरी स्टार', 'करतबबाज़': 'करतबबाज़', 'चोर बंदर केँ {n} बेर पकड़ू': 'चोर बंदर को {n} बार पकड़ो', 'बंदर-पकड़': 'बंदर-पकड़', 'सामा-चकेवा 2026': 'सामा-चकेवा 2026', 'नाव सँ {n} मीटर चलू': 'नाव से {n} मीटर चलो', 'नाविक': 'नाविक', 'मधुबनी कलाकार': 'मधुबनी कलाकार', 'MB Sweets पाग': 'MB Sweets पाग', '{n} बेर मधुबनी शक्ति पकड़ू': '{n} बार मधुबनी शक्ति पकड़ो',
  'जलेबी': 'जलेबी', 'लड्डू': 'लड्डू', 'पेड़ा': 'पेड़ा', 'कलाकंद': 'कलाकंद', 'मिल्क केक': 'मिल्क केक', 'रसमलाई!': 'रसमलाई!',
};
// {en, hi(=मैथिली)} वाली चीज़ से चुनी भाषा का लिखा
export function L(o) {
  if (!o) return '';
  if (LANG === 'en') return o.en;
  if (LANG === 'hi') return o.hin || HIN[o.hi] || o.hi;
  return o.hi;
}
export const isEn = () => LANG === 'en';
