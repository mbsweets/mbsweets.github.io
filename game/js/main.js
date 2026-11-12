// शुरुआत: पहले पोर्टल (अगर है) तैयार, फिर खेल — ताकि सेव सही जगह से पढ़ा जाए
import { P, PORTAL } from './platform.js';
import { store } from './util.js';

P.init().then(() => {
  if (PORTAL && store('lang') == null) { // पोर्टल पर: खिलाड़ी की भाषा, नहीं तो English
    const loc = (P.info && P.info.locale) || '';
    store('lang', /^(hi|mai|bh)/i.test(loc) ? 'hi' : 'en');
  }
  return import('./game.js');
}).catch((e) => { const m = document.getElementById('loadmsg'); if (m) m.textContent = 'Error: ' + e; });
