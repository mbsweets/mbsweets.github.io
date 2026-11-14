// शुरुआत: पहले पोर्टल (अगर है) तैयार, फिर खेल — ताकि सेव सही जगह से पढ़ा जाए
import { P, PORTAL } from './platform.js';
import { store } from './util.js';

P.init().then(() => {
  if (PORTAL && store('lang3') == null) { // पोर्टल पर: खिलाड़ी की भाषा (हिंदी / मैथिली), नहीं तो English — भाषा-स्क्रीन नहीं (1 क्लिक नियम)
    const loc = (P.info && P.info.locale) || '';
    const l = /^mai/i.test(loc) ? 'mai' : /^(hi|bh)/i.test(loc) ? 'hi' : 'en';
    store('lang', l); store('lang3', l);
  }
  return import('./game.js');
}).catch((e) => { const m = document.getElementById('loadmsg'); if (m) m.textContent = 'Error: ' + e; });
