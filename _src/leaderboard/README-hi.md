# रसगुल्ला रन — लीडरबोर्ड चालू करने के कदम (मुफ़्त, Cloudflare)

## ✅ आसान तरीका — सिर्फ़ मोबाइल से, एक बटन (14 नवंबर 2026)
पहले से: फ़ोन के Chrome में github.com पर अपने GitHub अकाउंट (mbsweets) से लॉग-इन रहिए।

1. यह लिंक खोलिए: https://deploy.workers.cloudflare.com/?url=https://github.com/mbsweets/mbsweets.github.io/tree/main/_src/leaderboard
2. Cloudflare का अकाउंट नहीं है तो **Sign up** (ईमेल + पासवर्ड) → ईमेल में आया लिंक दबाकर पक्का कीजिए → फिर से ऊपर वाला लिंक खोलिए।
3. **GitHub जोड़िए** (Connect GitHub) → अपना अकाउंट चुनिए → अनुमति दीजिए। Cloudflare आपके GitHub में `rasgulla-lb` नाम का नया repo बनाएगा।
4. नाम जैसे हैं वैसे रहने दीजिए (Worker `rasgulla-lb`, डेटाबेस `rasgulla_lb`)।
5. **ADMIN_KEY** वाले डिब्बे में अपना लंबा पासवर्ड लिखिए (कम-से-कम 8 अक्षर, पहले से लिखा उदाहरण हटाकर) — यह फ़ोन में सेव रखिए, किसी को मत भेजिए।
6. **Create and deploy** दबाइए → 1–2 मिनट रुकिए।
7. बनने के बाद Worker का पता दिखेगा (जैसे `https://rasgulla-lb.कुछ-नाम.workers.dev`) — वही पता Claude को भेज दीजिए। (टेबल अपने-आप बन जाती हैं, SQL नहीं चलाना।)

स्क्रीन छोटी लगे तो Chrome के ⋮ मेन्यू में **Desktop site** टिक कर लीजिए।

---

## पुराना तरीका (बटन न चले तो — डैशबोर्ड से हाथ से)

1. **अकाउंट:** cloudflare.com पर मुफ़्त अकाउंट बनाइए (ईमेल + पासवर्ड)।
2. **Worker बनाइए:** डैशबोर्ड → **Workers & Pages** → **Create application** → **Start with Hello World!** → **Get started** → नाम `rasgulla-lb` → **Deploy**।
3. **डेटाबेस बनाइए:** **D1 SQL database** → **Create Database** → नाम `rasgulla_lb` → **Create**।
4. **टेबल:** अब ज़रूरी नहीं — Worker पहली बार चलते ही टेबल ख़ुद बना लेता है (चाहें तो **Console** में `schema.sql` चला सकते हैं)।
5. **जोड़िए:** **Workers & Pages** → `rasgulla-lb` → **Bindings** → **Add binding** → **D1 database** → **Variable name** में ठीक `DB` लिखिए → डेटाबेस `rasgulla_lb` चुनिए → **Add binding**।
6. **मालिक वाली चाबी (गलत नाम हटाने के लिए):** `rasgulla-lb` → **Settings** → **Variables and Secrets** → **Add** → प्रकार **Secret**, नाम `ADMIN_KEY`, कोई लंबा पासवर्ड (सिर्फ़ अपने फ़ोन में रखिए, किसी को न भेजें)।
7. **कोड डालिए:** `rasgulla-lb` → **Edit code** (</>) → `worker.js` में इस फ़ोल्डर की `worker.js` का पूरा कोड चिपकाइए → **Save** → **Deploy**।
8. **पता भेजिए:** Worker का पता (जैसे `https://rasgulla-lb.आपका-नाम.workers.dev`) Claude को भेजिए — वह गेम की `js/lb.js` में `LB_URL` में डालकर लीडरबोर्ड चालू कर देगा।

9. **कुल खिलाड़ी देखना (सिर्फ़ आपके लिए):** फ़ोन में यह पता बुकमार्क कर लीजिए — `https://rasgulla-lb.आपका-नाम.workers.dev/stats?key=आपकी-ADMIN_KEY` — इसमें आज / 7 दिन / 30 दिन / अब तक के खिलाड़ी, नए खिलाड़ी, कुल गेम, और कहाँ से (वेबसाइट / CrazyGames / आगे Play Store) और किस देश से — सब एक पन्ने पर। यह पता किसी को मत भेजिए।
   * गिनती में किसी का नाम, फ़ोन, IP या पहचान नहीं जाती — सिर्फ़ गिनती।
   * अगर टेबल पहले बन चुकी है तो `schema.sql` फिर से Execute कर दीजिए (नई `daily` टेबल जुड़ जाएगी, पुराना डेटा नहीं मिटेगा)।

मुफ़्त सीमा: रोज़ 1 लाख रिक्वेस्ट; D1 में रोज़ 50 लाख पंक्ति पढ़ना, 1 लाख लिखना, 5GB।
