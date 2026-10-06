"""Builds mbsweets.github.io — MB Sweets website (Hindi first, English toggle).
Prices come from the shop's shared list (mb-sweets/catalog.js); the pages also refresh them live."""
import json, subprocess, html, os, re, hashlib, datetime, urllib.parse
import art

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = '/home/claude/mbsweets.github.io'
CAT = json.loads(subprocess.check_output(['node', '-e', "global.window={};require('/home/claude/mb-sweets/catalog.js');process.stdout.write(JSON.stringify(window.MB_CATALOG))"]))
ITEMS = {r[0]: {'id': r[0], 'name': r[1], 'cat': r[2], 'unit': r[3], 'price': r[4]} for r in CAT['items']}
IMG = json.load(open(os.path.join(HERE, 'img-meta.json')))
SHOP = CAT['shop']

SITE = 'https://mbsweets.github.io'
ORDER = '/mb-sweets/order/'
WA_NUM = '918002010218'
PHONE1, PHONE2 = '8002010218', '8507844049'
MAPS = 'https://maps.app.goo.gl/FhQMpwFatymkrWct9'
REVIEW = 'https://g.page/r/CZ_aeVeX-ilKEBE/review'
IG = 'https://www.instagram.com/maabhagwatimisthanbhandar/'
FB = 'https://www.facebook.com/share/1CdTxjHLrT/'
MAP_EMBED = 'https://maps.google.com/maps?q=26.2379445,85.904298&z=16&output=embed'
RATING = '5.0'   # Google रेटिंग बदले तो यहाँ बदलें
REVIEW_COUNT = 15   # Google पर कुल रिव्यू — बढ़ें तो यहाँ बदलें
TODAY = datetime.date.today().isoformat()
PREVIEW = os.environ.get('PREVIEW') == '1'   # preview: hidden from Google until the owner approves

UNIT_EN = {'किलो': 'kg', 'पीस': 'piece', 'प्लेट': 'plate', 'लीटर': 'litre', 'पैक': 'pack', 'पैकेट': 'packet'}


def e(s):
    return html.escape(str(s), quote=True)


def T(hi, en):
    """Hindi text with its English version for the language switch."""
    return f'<span data-en="{e(en)}">{hi}</span>'


def wa(text):
    return 'https://api.whatsapp.com/send?phone=' + WA_NUM + '&text=' + urllib.parse.quote(text)


def olink(item=None, tab=None, cake=None):
    if item:
        return f'{ORDER}#item={item}'
    if tab:
        return f'{ORDER}#tab={tab}'
    if cake:
        return f'{ORDER}#cake={cake}'
    return ORDER


def price(iid):
    return ITEMS[iid]['price']


def pid_b(iid):
    """A price that the page keeps up to date from the shop's list."""
    return f'<b data-pid="{iid}">₹{price(iid)}</b>'


def tag(iid, label_hi=None, label_en=None):
    it = ITEMS[iid]
    if label_hi:
        return f'<span class="tag">{T(label_hi, label_en)}&nbsp;<b data-pid="{iid}">₹{it["price"]}</b></span>'
    u = it['unit']
    return f'<span class="tag"><b data-pid="{iid}">₹{it["price"]}</b>/{T(u, UNIT_EN.get(u, u))}</span>'


def pic(name, alt, sizes='(min-width:900px) 360px, 50vw', eager=False, cls='', lazy=True):
    meta = IMG[name]
    src = f'/assets/img/{name}-{meta[0][0]}.webp'
    srcset = ', '.join(f'/assets/img/{name}-{w}.webp {w}w' for w, h, kb in meta)
    w, h = meta[0][0], meta[0][1]
    load = 'fetchpriority="high"' if eager else ('loading="lazy" decoding="async"' if lazy else 'decoding="async"')
    c = f' class="{cls}"' if cls else ''
    return f'<img{c} src="{src}" srcset="{srcset}" sizes="{sizes}" width="{w}" height="{h}" alt="{e(alt)}" {load}>'


def simg(file, alt, w=480, h=480, lazy=True):
    ld = ' loading="lazy"' if lazy else ''
    return f'<img src="/assets/img/{file}" width="{w}" height="{h}" alt="{e(alt)}"{ld} decoding="async">'


# ---------- icons ----------
def icon(name):
    paths = {
        'bag': '<path d="M6 8h12l1 12H5L6 8z"/><path d="M9 8V7a3 3 0 0 1 6 0v1"/>',
        'wa': '<path d="M4 20l1.2-3.9A8.2 8.2 0 1 1 8.3 19z"/><path d="M9.2 8.6c.2-.5.5-.6.9-.6h.5l.9 2.1-.7.9c.5 1.1 1.4 2 2.5 2.5l.9-.7 2.1.9v.5c0 .4-.1.7-.6.9-2.5 1-6.6-3.1-5.5-6.5z"/>',
        'phone': '<path d="M5 3.5h3.5l1.7 4.4-2.2 1.4a11 11 0 0 0 5.7 5.7l1.4-2.2 4.4 1.7V18a2.5 2.5 0 0 1-2.5 2.5A15.5 15.5 0 0 1 2.5 6 2.5 2.5 0 0 1 5 3.5z"/>',
        'pin': '<path d="M12 21s-7-6.3-7-11.2a7 7 0 0 1 14 0C19 14.7 12 21 12 21z"/><circle cx="12" cy="9.8" r="2.6"/>',
        'ig': '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".9"/>',
        'fb': '<path d="M14.5 8.5H17V5h-2.5A4 4 0 0 0 10.5 9v2H8v3.5h2.5V21H14v-6.5h2.6l.6-3.5H14V9.1c0-.3.2-.6.5-.6z"/>',
        'star': '<path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z"/>',
    }
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths[name]}</svg>'


NAV = [('/', 'होम', 'Home'), ('/sweets/', 'मिठाइयाँ', 'Sweets'), ('/cakes/', 'केक', 'Cakes'),
       ('/products/', 'दूध-दही व सामान', 'Dairy & more'), ('/bulk-dairy/', 'थोक दूध-दही', 'Bulk dairy'),
       ('/wedding/', 'शादी व गिफ्ट', 'Weddings & gifts'),
       ('/contact/', 'संपर्क', 'Contact')]

WA_HELLO = 'नमस्ते MB Sweets 🙏 '


def header(active):
    links = ''.join(f'<a href="{u}"{" aria-current=page" if u == active else ""}>{T(hi, en)}</a>' for u, hi, en in NAV)
    return f'''<a class="skip" href="#main">{T("सीधे सामग्री पर जाएँ", "Skip to content")}</a>
<div class="notice" id="notice" role="status"></div>
<header class="hdr">
 <div class="wrap bar">
  <a class="brand" href="/" aria-label="MB Sweets — होम">
   <img src="/assets/img/logo.webp" width="217" height="200" alt="MB Sweets का लोगो">
   <span><b>MB Sweets</b><small>{T("माँ भगवती मिष्ठान भंडार · ननौरा", "Maa Bhagwati Misthan Bhandar · Nanaura")}</small></span>
  </a>
  <nav class="nav" aria-label="मुख्य">{links}</nav>
  <button class="lang" id="lang" type="button" aria-label="Switch language / भाषा बदलें">English</button>
  <a class="btn btn-main btn-sm order-top" href="{ORDER}" data-order>{icon("bag")}{T("ऑर्डर करें", "Order now")}</a>
 </div>
 <nav class="pills" aria-label="पेज">{links}</nav>
 <div class="mb-border" aria-hidden="true"></div>
</header>'''


def footer():
    links = ''.join(f'<li><a href="{u}">{T(hi, en)}</a></li>' for u, hi, en in NAV)
    return f'''<footer class="foot">
 <div class="wrap cols">
  <div>
   <div class="fbrand"><img src="/assets/img/logo.webp" width="217" height="200" alt="" loading="lazy"><div><b>MB Sweets</b>{T("माँ भगवती मिष्ठान भंडार", "Maa Bhagwati Misthan Bhandar")}</div></div>
   <p class="mt">{T("मिठास जो जोड़ दे हर रिश्ता ❤️<br>मिथिला की मिठास — ननौरा से, 2000 से।", "Sweetness that binds every bond ❤️<br>The sweetness of Mithila — from Nanaura, since 2000.")}</p>
   <div class="social">
    <a href="{IG}" target="_blank" rel="noopener" aria-label="Instagram">{icon("ig")}</a>
    <a href="{FB}" target="_blank" rel="noopener" aria-label="Facebook">{icon("fb")}</a>
    <a href="{wa(WA_HELLO)}" target="_blank" rel="noopener" aria-label="WhatsApp">{icon("wa")}</a>
   </div>
  </div>
  <div><h3>{T("पेज", "Pages")}</h3><ul>{links}</ul></div>
  <div><h3>{T("पता और समय", "Address & hours")}</h3>
   <p>{T("ननौरा मेन रोड (NH 527B), दरभंगा एयरपोर्ट के पास<br>दरभंगा, बिहार 846005 · एयरपोर्ट से ~5 km", "Nanaura Main Rd (NH 527B), near Darbhanga Airport<br>Darbhanga, Bihar 846005 · ~5 km from the airport")}</p>
   <p>{T("रोज़ सुबह 7 से रात 9 बजे तक", "Daily 7 am – 9 pm")}</p>
   <p><a href="tel:+91{PHONE1}">📞 {PHONE1}</a><br><a href="tel:+91{PHONE2}">📞 {PHONE2}</a></p>
  </div>
  <div><h3>{T("ऑनलाइन ऑर्डर", "Order online")}</h3><ul>
   <li><a href="{ORDER}" data-order>{T("🛍️ मेन्यू खोलें और ऑर्डर करें", "🛍️ Open the menu & order")}</a></li>
   <li><a href="{ORDER}?app=1" data-order>{T("📲 मेन्यू ऐप फ़ोन में रखें", "📲 Add the menu app to your phone")}</a></li>
   <li><a href="{REVIEW}" target="_blank" rel="noopener">{T("⭐ Google पर रिव्यू लिखें", "⭐ Review us on Google")}</a></li>
   <li><a href="{MAPS}" target="_blank" rel="noopener">{T("📍 Google Maps पर रास्ता", "📍 Directions on Google Maps")}</a></li>
  </ul></div>
 </div>
 <div class="wrap fine">{T("घर तक डिलीवरी 6 km तक — ऑर्डर कम से कम ₹499 का, डिलीवरी का कोई चार्ज नहीं। डिलीवरी की उपलब्धता देखकर ही डिलीवरी कन्फर्म की जाएगी। पेमेंट: ऑर्डर कन्फर्म होने के बाद UPI से। दाम वही जो दुकान में।", "Home delivery within 6 km — minimum order ₹499, no delivery charge. Delivery is confirmed only after checking availability. Payment: by UPI after your order is confirmed. Same prices as in the shop.")}<br>© <span id="yr">2026</span> MB Sweets · {T("माँ भगवती मिष्ठान भंडार, ननौरा, दरभंगा", "Maa Bhagwati Misthan Bhandar, Nanaura, Darbhanga")}</div>
</footer>
<nav class="dock" aria-label="जल्दी संपर्क">
 <a class="o" href="{ORDER}" data-order>{icon("bag")}{T("ऑर्डर करें", "Order")}</a>
 <a class="w" href="{wa(WA_HELLO)}" target="_blank" rel="noopener">{icon("wa")}WhatsApp</a>
 <a href="tel:+91{PHONE1}">{icon("phone")}{T("कॉल", "Call")}</a>
 <a href="{MAPS}" target="_blank" rel="noopener">{icon("pin")}{T("रास्ता", "Directions")}</a>
</nav>'''


def business_ld():
    return {
        '@context': 'https://schema.org', '@type': 'FoodEstablishment', '@id': SITE + '/#shop',
        'name': 'MB Sweets — Maa Bhagwati Misthan Bhandar', 'alternateName': ['माँ भगवती मिष्ठान भंडार', 'MB Sweets Nanaura'],
        'description': 'Sweet shop in Nanaura, Darbhanga since 2000 — handmade sweets: balushahi, chhena sweets (rasgulla, cham cham, rasmalai) and khoa sweets (gulab jamun, peda); eggless cakes, milk, curd and paneer. Home delivery within 6 km.',
        'url': SITE + '/', 'telephone': '+91-' + PHONE1, 'image': [SITE + '/assets/img/og-site.jpg', SITE + '/assets/img/shop-front-wide-1600.webp'],
        'logo': SITE + '/assets/img/icon-512.png', 'priceRange': '₹', 'servesCuisine': ['Indian sweets', 'Mithai', 'Cakes'],
        'address': {'@type': 'PostalAddress', 'streetAddress': 'Nanaura Main Rd (NH 527B), Near Darbhanga Airport', 'addressLocality': 'Darbhanga',
                    'addressRegion': 'Bihar', 'postalCode': '846005', 'addressCountry': 'IN'},
        'geo': {'@type': 'GeoCoordinates', 'latitude': SHOP['lat'], 'longitude': SHOP['lng']},
        'hasMap': MAPS,
        'openingHoursSpecification': [{'@type': 'OpeningHoursSpecification',
                                       'dayOfWeek': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                                       'opens': '07:00', 'closes': '21:00'}],
        'hasMenu': SITE + '/sweets/', 'acceptsReservations': False, 'foundingDate': '2000',
        'founder': {'@type': 'Person', 'name': 'Dinesh Kumar Sahu'},
        'areaServed': 'Nanaura, Darbhanga (6 km)', 'sameAs': [IG, FB],
        'potentialAction': {'@type': 'OrderAction', 'target': SITE + ORDER},
    }


def crumbs_ld(name, path):
    return {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'MB Sweets', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': name, 'item': SITE + path}]}


def page(path, title, desc, body, active=None, ld=(), extra_head=''):
    lds = ''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld)
    return f'''<!doctype html>
<html lang="hi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(title)}</title>
<meta name="description" content="{e(desc)}">
{'' if path == '/404.html' else f'<link rel="canonical" href="{SITE}{path}">'}
<meta property="og:type" content="website">
<meta property="og:site_name" content="MB Sweets">
<meta property="og:title" content="{e(title)}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:image" content="{SITE}/assets/img/og-site.jpg">
<meta property="og:image:alt" content="MB Sweets — मिथिला की मिठास, ननौरा, दरभंगा">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="hi_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="google-site-verification" content="Vm67PoSV5XHzENlAlZc9Rm4jAQmM6H2biQfGY-9qMtw">
<meta name="theme-color" content="#6A1222">
<meta name="format-detection" content="telephone=no">
<link rel="icon" href="/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/img/icon-192.png">
<link rel="preload" href="/assets/fonts/baloo2-800.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/mukta-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/site.css?v=CSSV">
{'<meta name="robots" content="noindex">' if PREVIEW and 'noindex' not in extra_head else ''}{extra_head}{lds}
</head>
<body>
{header(active or path)}
<main id="main">
{body}
</main>
{footer()}
<script src="/mb-sweets/catalog.js" defer></script>
<script src="/assets/site.js?v=JSV" defer></script>
</body>
</html>
'''


def shead(eyebrow_hi, eyebrow_en, h_hi, h_en, p_hi=None, p_en=None, center=False, tagname='h2'):
    p = f'<p>{T(p_hi, p_en)}</p>' if p_hi else ''
    return f'<div class="shead{" c" if center else ""}"><div class="eyebrow">{T(eyebrow_hi, eyebrow_en)}</div><{tagname}>{T(h_hi, h_en)}</{tagname}>{p}</div>'


# ---------- sweets data ----------
SWEETS = [
    dict(key='balushahi', hi='बालूशाही', en='Balushahi', img='real-balushahi', real=True, ids=['i3', 'i4'],
         d_hi='हमारी ख़ास — ऊपर से नरम, अंदर से खस्ता। दुकान में अपने हाथ से बनती है।',
         d_en='Our special — soft outside, crisp inside. Made by hand in our shop.', badge=('⭐ हमारी ख़ास', '⭐ Our special')),
    dict(key='rasgulla', hi='रसगुल्ला', en='Rasgulla', img='real-rasgulla-bowl', real=True, ids=['i1', 'i2'],
         d_hi='सिर्फ़ छेना — न मैदा, न सूजी। हल्की इलायची, जो हम ख़ुद पीसकर डालते हैं।',
         d_en='Only chhena — no maida, no suji. A light touch of cardamom we grind ourselves.', badge=('❤️ ग्राहकों की पसंद', '❤️ Customer favourite')),
    dict(key='gulabjamun', hi='गुलाब जामुन', en='Gulab Jamun', img='gulabjamun', ids=['i5', 'i6'],
         d_hi='खोआ से बना, नरम और रसीला — हर मौके की शान।', d_en='Made with khoa — soft, juicy and perfect for every occasion.'),
    dict(key='chamcham', hi='चमचम', en='Cham Cham', img='chamcham', ids=['i7', 'i8'],
         d_hi='छेना की मिठाई, नारियल बुरादे के साथ — दुकान में कई किस्में।', d_en='Chhena sweet with grated coconut — several varieties in the shop.'),
    dict(key='rasmalai', hi='रसमलाई', en='Rasmalai', img='rasmalai', ids=['i22'],
         d_hi='मलाईदार दूध में छेना — 1 प्लेट में 1 बड़ा पीस।', d_en='Chhena in creamy milk — 1 big piece per plate.'),
    dict(key='peda', hi='पेड़ा', en='Peda', img='peda', ids=['i9'],
         d_hi='खोआ का पारंपरिक पेड़ा — पूजा और खुशी के मौकों के लिए।', d_en='Traditional khoa peda — for pujas and happy occasions.'),
    dict(key='laddoo', hi='लड्डू', en='Laddoo', img='laddoo', ids=['i11'],
         d_hi='पूजा, प्रसाद और हर शुभ काम के लिए।', d_en='For pujas, prasad and every auspicious start.'),
    dict(key='milkcake', hi='मिल्क केक', en='Milk Cake', img='real-milkcake', real=True, ids=['i10'],
         d_hi='दूध से बनी दानेदार, हल्की मीठी मिठाई।', d_en='Grainy, mildly sweet milk fudge.'),
    dict(key='jalebi', hi='जलेबी', en='Jalebi', img=None, ids=['i12'],
         d_hi='कुरकुरी और रसीली जलेबी।', d_en='Crisp, syrupy jalebi.'),
    dict(key='boondi', hi='बूंदी', en='Boondi', img='real-boondi', real=True, ids=['i13'],
         d_hi='मीठी बूंदी — प्रसाद और भोज के लिए।', d_en='Sweet boondi — for prasad and feasts.'),
]
SW = {s['key']: s for s in SWEETS}


def sweet_card(s, sizes='(min-width:900px) 340px, 50vw'):
    ids = ','.join(s['ids'])
    first = ITEMS[s['ids'][0]]
    ptag = f'<span class="ptag"><b data-pid="{first["id"]}">₹{first["price"]}</b>/{T(first["unit"], UNIT_EN.get(first["unit"], first["unit"]))}</span>'
    if s['img'] and s.get('real'):
        top = f'<div class="pic">{pic(s["img"], s["hi"] + " — हमारी दुकान की असली फोटो", sizes)}<span class="realtag">📸 {T("असली फोटो", "Real photo")}</span>{ptag}</div>'
    elif s['img']:
        top = f'<div class="pic">{pic(s["img"], s["hi"] + " (नमूना फोटो)", sizes)}<span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span>{ptag}</div>'
    else:
        top = f'<div class="pic"><div class="art-tile"><span>{T(s["hi"], s["en"])}</span></div>{ptag}</div>'
    tags = ''.join(tag(i) for i in s['ids'])
    badge = f'<div class="bestline">{T(*s["badge"])}</div>' if s.get('badge') else ''
    return f'''<article class="pcard" id="{s["key"]}" data-ids="{ids}">
 {top}
 <div class="body">
  {badge}<h3>{T(s["hi"], s["en"])}<span class="off-badge">{T("आज खत्म", "Sold out today")}</span><small>{T(s["en"], s["hi"])}</small></h3>
  <p>{T(s["d_hi"], s["d_en"])}</p>
  <div class="prices">{tags}</div>
  <div class="acts"><a class="btn btn-main" href="{olink(item=s["key"])}" data-order>{icon("bag")}{T("ऑर्डर करें", "Order")}</a></div>
 </div>
</article>'''


# ---------- English versions of the ready-made WhatsApp messages ----------
WA_EN = {
    WA_HELLO: 'Hello MB Sweets 🙏 ',
    'नमस्ते MB Sweets 🙏 मुझे शादी/पूजा के लिए मिठाई का बड़ा ऑर्डर देना है।': "Hello MB Sweets 🙏 I'd like to place a bulk sweets order for a wedding / puja.",
    'नमस्ते MB Sweets 🙏 मैं दरभंगा एयरपोर्ट जा रहा/रही हूँ। मुझे मिठाई पैक करवानी है:\n• \nमैं लगभग ___ बजे दुकान पर पहुँचूँगा/पहुँचूँगी।':
        "Hello MB Sweets 🙏 I'm heading to Darbhanga airport and would like sweets packed:\n• \nI'll reach the shop at about ___.",
    'नमस्ते MB Sweets 🙏 आज कौन-कौन सी मिठाई मिलेगी?': 'Hello MB Sweets 🙏 Which sweets are available today?',
    'नमस्ते MB Sweets 🙏 केक के साथ कैंडल/टॉपर/गुब्बारे चाहिए। क्या-क्या मिलेगा?': "Hello MB Sweets 🙏 I need candles / toppers / balloons with a cake. What's available?",
    'नमस्ते MB Sweets 🙏 क्या यह सामान मिलेगा: ': 'Hello MB Sweets 🙏 Do you have: ',
    'नमस्ते MB Sweets 🙏 मुझे मिठाई गिफ्ट पैकिंग में चाहिए। कौन-कौन से डिब्बे हैं और दाम क्या है?': "Hello MB Sweets 🙏 I'd like sweets gift-packed. Which boxes do you have and what do they cost?",
    'नमस्ते MB Sweets 🙏 मुझे थोक में दूध/दही/पनीर चाहिए। बड़ी मात्रा का रेट बताइए।': 'Hello MB Sweets 🙏 I need milk / curd / paneer in bulk. Please tell me the bulk rate.',
}


def cake_msg_en(name):
    return f"Hello MB Sweets 🙏 I'd like a {name} cake.\nWeight: ½ kg / 1 kg\nDate and time:\nMessage on the cake:\n(from the website)"


def add_wa_english(h):
    """Give every WhatsApp link an English message for the language switch."""
    def fix(m):
        url = html.unescape(m.group(1))
        q = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)
        hi = q.get('text', [''])[0]
        en = WA_EN.get(hi)
        if en is None:
            raise SystemExit('WhatsApp message without English version: ' + hi[:60])
        return f'href="{m.group(1)}" data-en-href="{e(wa(en))}"'
    return re.sub(r'href="(https://api\.whatsapp\.com/send\?[^"]+)"', fix, h)


# ---------- home: hero cards and Google reviews ----------
def hero_card(key, label_hi, label_en, line_hi, line_en):
    s = SW[key]
    a, b = s['ids']
    ia, ib = ITEMS[a], ITEMS[b]
    unit = lambda it: T(it['unit'], UNIT_EN.get(it['unit'], it['unit']))
    return f'''<article class="hcard" data-ids="{a},{b}">
     <a class="hpic" href="{olink(item=key)}" data-order tabindex="-1" aria-hidden="true">{pic(s["img"], s["hi"] + " — हमारी दुकान की असली फोटो", "(min-width:900px) 270px, 46vw", eager=True)}<span class="hlabel">{T(label_hi, label_en)}</span><span class="realtag">📸 {T("असली फोटो", "Real photo")}</span></a>
     <div class="hbody">
      <h2>{T(s["hi"], s["en"])}<span class="off-badge">{T("आज खत्म", "Sold out today")}</span></h2>
      <p class="hline">{T(line_hi, line_en)}</p>
      <p class="hprice"><span class="nw"><b data-pid="{a}">₹{ia["price"]}</b>/{unit(ia)} ·</span> <span class="nw"><b data-pid="{b}">₹{ib["price"]}</b>/{unit(ib)}</span></p>
      <a class="btn btn-main" href="{olink(item=key)}" data-order>{icon("bag")}{T("ऑर्डर करें", "Order")}</a>
     </div>
    </article>'''


# Customers' own words from Google, copied exactly ("…" = part left out). Never edit the words.
REVIEWS = [
    ('Abhishek Kumar', 'en', 'Their Balushahi is incredibly delicious and definitely a crowd-pleaser! … The shop is also highly hygienic and well-maintained.'),
    ('Mohammad Adnan', 'en', 'Mere hisaab se poore Darbhanga District mein itna soft, fresh aur delicious Rasgulla … kahin aur nahi mili, Yahan ka taste waqai lajawab hai aur quality hamesha consistent rehti hai'),
    ('Kuldeep Mahto', 'hi', 'बेहतरीन क्वालिटी और स्वाद ! यहा की मिठाइया बेहद स्वादिष्ट और हमेशा फ्रेश मिलती हैं।'),
    ('Irafn Alam', 'hi', 'हर मिठाई में शुद्धता, स्वच्छता और शानदार स्वाद!😋😋'),
]


def reviews_section():
    cards = ''.join(f'''<figure class="rv"><div class="st" role="img" aria-label="5 में से 5 स्टार">★★★★★</div><blockquote lang="{lang}">“{e(text)}”</blockquote><figcaption><b>{e(name)}</b><span>{T("Google रिव्यू", "Google review")}</span></figcaption></figure>''' for name, lang, text in REVIEWS)
    return f'''<section id="reviews">
 <div class="wrap">
  <div class="rtop">
   {shead("Google रिव्यू", "Google reviews", "ग्राहक क्या कहते हैं", "What our customers say", f"Google पर {REVIEW_COUNT} रिव्यू — यहाँ उनमें से कुछ, ग्राहकों के अपने शब्दों में, बिना बदले।", f"{REVIEW_COUNT} reviews on Google — here are a few, in our customers' own words, unchanged.")}
   <a class="rscore" href="{MAPS}" target="_blank" rel="noopener"><b>{RATING}</b><span class="stars" role="img" aria-label="5 में से 5 स्टार">★★★★★</span><small>{T(f"Google पर {REVIEW_COUNT} रिव्यू", f"{REVIEW_COUNT} reviews on Google")}</small></a>
  </div>
  <div class="rlist">{cards}</div>
  <p class="rnote">{T("“…” = रिव्यू का बाकी हिस्सा छोड़ा गया है। पूरे रिव्यू Google पर पढ़ें।", "“…” = part of the review is left out. Read the full reviews on Google.")}</p>
  <div class="row">
   <a class="btn btn-line btn-sm" href="{MAPS}" target="_blank" rel="noopener">{T(f"सारे {REVIEW_COUNT} रिव्यू पढ़ें", f"Read all {REVIEW_COUNT} reviews")}</a>
   <a class="btn btn-main btn-sm" href="{REVIEW}" target="_blank" rel="noopener">{icon("star")}{T("रिव्यू लिखें", "Write a review")}</a>
  </div>
 </div>
</section>'''


# ================= HOME =================
def home():
    fav = ''.join(sweet_card(SW[k], '(min-width:900px) 220px, 72vw') for k in ['gulabjamun', 'chamcham', 'rasmalai', 'peda', 'laddoo'])
    airport_msg = 'नमस्ते MB Sweets 🙏 मैं दरभंगा एयरपोर्ट जा रहा/रही हूँ। मुझे मिठाई पैक करवानी है:\n• \nमैं लगभग ___ बजे दुकान पर पहुँचूँगा/पहुँचूँगी।'
    body = f'''
<section class="hero" style="--lotus:url('/assets/img/lotus.svg')">
 <div class="wrap grid">
  <div>
   <div class="hwel"><div class="welcome">🙏 {T("अहाँक स्वागत अछि", "Welcome — अहाँक स्वागत अछि")}</div>
   <span class="status" id="status"><i></i><span>{T("रोज़ सुबह 7 से रात 9 बजे तक", "Open daily 7 am – 9 pm")}</span></span></div>
   <h1><small>{T("ननौरा, दरभंगा · 2000 से", "Nanaura, Darbhanga · since 2000")}</small><span class="ink">{T("मिथिला की मिठास", "The sweetness of Mithila")}</span></h1>
   <div class="hpair">
    {hero_card("balushahi", "⭐ हमारी ख़ास", "⭐ Our special", "ऊपर से नरम, अंदर से खस्ता", "Soft outside, crisp inside")}
    {hero_card("rasgulla", "❤️ ग्राहकों की पसंद", "❤️ Most loved", "सिर्फ़ छेना + हाथ से पिसी इलायची", "Only chhena + hand-ground cardamom")}
   </div>
   <p class="dline">🛵 {T('<span class="nw">6 km तक घर पर डिलीवरी</span> · <span class="nw">कम से कम ₹499, कोई चार्ज नहीं</span> · <span class="nw">"जल्दी" वाला ऑर्डर आम तौर पर 30–60 मिनट में</span>', '<span class="nw">Home delivery within 6 km</span> · <span class="nw">minimum ₹499, no charge</span> · <span class="nw">"ASAP" orders usually in 30–60 minutes</span>')}</p>
   <div class="row hcta">
    <a class="btn btn-main btn-big" href="{ORDER}" data-order>{icon("bag")}{T("अभी ऑर्डर करें", "Order now")}</a>
    <a class="btn btn-wa" href="{wa(WA_HELLO)}" target="_blank" rel="noopener">{icon("wa")}WhatsApp</a>
   </div>
   <div class="trust">
    <a href="#reviews"><span class="star">★★★★★</span> {RATING} · {T(f"Google पर {REVIEW_COUNT} रिव्यू", f"{REVIEW_COUNT} Google reviews")}</a>
    <span>🟢 {T("100% अंडा-रहित केक", "100% eggless cakes")}</span>
   </div>
  </div>
  <figure class="frame">
   {art.fish_pair(300, "fish")}
   {pic("shop-front-43", "माँ भगवती मिष्ठान भंडार — ननौरा में हमारी दुकान", "(min-width:900px) 520px, 92vw", lazy=False)}
   <figcaption>{T("📍 हमारी असली दुकान · NH किनारे", "📍 Our real shop · on the NH")}</figcaption>
  </figure>
 </div>
</section>

<section class="soft" id="khas">
 <div class="wrap">
  {shead("हमारी पहचान", "What we are known for", "क्या ख़ास है?", "What makes them special?")}
  <div class="why2">
   <article class="why" data-ids="i3,i4">
    <div class="pic">{pic("real-balushahi-cut", "बीच से तोड़ी हुई बालूशाही — अंदर से खस्ता", "(min-width:900px) 240px, 40vw")}<span class="realtag">📸 {T("असली फोटो", "Real photo")}</span></div>
    <div class="txt">
     <h3>{T("बालूशाही — तोड़कर देखिए", "Balushahi — break one open")}<span class="off-badge">{T("आज खत्म", "Sold out today")}</span></h3>
     <p>{T("ऊपर से नरम, अंदर से खस्ता — फोटो में देखिए। दुकान में अपने हाथ से बनती है।", "Soft outside, crisp inside — see for yourself. Made by hand in our shop.")}</p>
     <a class="more" href="{olink(item="balushahi")}" data-order>{T("बालूशाही ऑर्डर करें", "Order balushahi")}</a>
    </div>
   </article>
   <article class="why" data-ids="i1,i2">
    <div class="pic">{pic("real-rasgulla-tray", "दुकान में ताज़े रसगुल्ले की ट्रे", "(min-width:900px) 240px, 40vw")}<span class="realtag">📸 {T("असली फोटो", "Real photo")}</span></div>
    <div class="txt">
     <h3>{T("रसगुल्ला — सिर्फ़ छेना", "Rasgulla — only chhena")}<span class="off-badge">{T("आज खत्म", "Sold out today")}</span></h3>
     <p>{T("हमारे रसगुल्ले में सिर्फ़ छेना है — न मैदा, न सूजी। बस हल्की इलायची, जो हम ख़ुद पीसकर डालते हैं।", "Our rasgulla is only chhena — no maida, no suji. Just a light touch of cardamom that we grind ourselves.")}</p>
     <a class="more" href="{olink(item="rasgulla")}" data-order>{T("रसगुल्ला ऑर्डर करें", "Order rasgulla")}</a>
    </div>
   </article>
  </div>
 </div>
</section>

{reviews_section()}

<section>
 <div class="wrap">
  {shead("हाथ की बनी मिठाई", "Handmade sweets", "और भी मिठाइयाँ", "More sweets", "दाम वही जो दुकान में। कम से कम 250 ग्राम, या पीस में।", "Same prices as the shop. Minimum 250 g, or by the piece.")}
  <div class="scroller s5">{fav}</div>
  <a class="more" href="/sweets/">{T("सारी मिठाइयाँ और दाम देखें", "See all sweets & prices")}</a>
 </div>
</section>

<section class="howto">
 <div class="wrap">
  {shead("आसान तरीका", "Simple steps", "घर बैठे ऑर्डर कैसे करें", "How to order from home", center=True)}
  <ol class="steps3">
   <li><span class="n">1</span><h3>{T("मेन्यू से चुनें", "Pick from the menu")}</h3><p>{T("मिठाई, दूध-दही, केक चुनें, समय बताएँ और “ऑर्डर भेजें” दबाएँ।", "Choose sweets, dairy or cakes, pick a time and tap “Send order”.")}</p></li>
   <li><span class="n">2</span><h3>{T("दुकान कन्फर्म करेगी", "We confirm")}</h3><p>{T("उपलब्धता देखकर दुकान WhatsApp पर ऑर्डर पक्का करेगी।", "We check availability and confirm on WhatsApp.")}</p></li>
   <li><span class="n">3</span><h3>{T("पेमेंट और डिलीवरी", "Pay & receive")}</h3><p>{T("UPI से पेमेंट करें — फिर ऑर्डर घर पहुँचेगा। दुकान से ले जाने पर वहीं पेमेंट।", "Pay by UPI and your order is delivered. For pickup, pay at the shop.")}</p></li>
  </ol>
  <div class="center"><a class="btn btn-main" href="{ORDER}" data-order>{icon("bag")}{T("मेन्यू खोलें", "Open the menu")}</a></div>
 </div>
</section>

<section class="soft">
 <div class="wrap">
  {shead("असली दुकान, असली मिठाई", "Real shop, real sweets", "दुकान के शोकेस से", "Straight from our showcase", "ये फोटो हमारी दुकान की हैं — जैसी मिठाई दिखती है, वैसी ही मिलती है।", "These photos are from our shop — what you see is what you get.")}
  <div class="mosaic">
   <figure class="w">{pic("real-chamcham", "दुकान में चमचम की ट्रे", "(min-width:900px) 560px, 100vw")}<figcaption>{T("चमचम की ट्रे", "A tray of cham cham")}</figcaption></figure>
   <figure>{pic("real-showcase", "मिठाई का शोकेस", "(min-width:900px) 280px, 50vw")}<figcaption>{T("मिठाई का शोकेस", "Our showcase")}</figcaption></figure>
   <figure>{pic("real-rasgulla", "रसगुल्ला", "(min-width:900px) 280px, 50vw")}<figcaption>{T("रसगुल्ला", "Rasgulla")}</figcaption></figure>
   <figure>{pic("real-trays", "बालूशाही और चमचम की ट्रे", "(min-width:900px) 280px, 50vw")}<figcaption>{T("बालूशाही और चमचम", "Balushahi & cham cham")}</figcaption></figure>
   <figure>{pic("real-mix-tray", "छेना की मिठाइयाँ", "(min-width:900px) 280px, 50vw")}<figcaption>{T("छेना की मिठाइयाँ", "Chhena sweets")}</figcaption></figure>
   <figure class="w">{pic("real-white", "सफ़ेद चमचम", "(min-width:900px) 560px, 100vw")}<figcaption>{T("सफ़ेद चमचम", "White cham cham")}</figcaption></figure>
  </div>
  <div class="realnote">📸 {T("इस हिस्से की सारी फोटो हमारी दुकान की असली फोटो हैं।", "Every photo in this section is from our own shop.")}</div>
 </div>
</section>

<section>
 <div class="wrap">
  {shead("क्यों MB Sweets", "Why MB Sweets", "भरोसा जो 2000 से चला आ रहा है", "Trusted since 2000", center=True)}
  <div class="feats">
   <div class="feat">{art.kadhai(62)}<h3>{T("अपने हाथ से बनी", "Made by hand")}</h3><p>{T("छेना और खोआ दुकान में ही बनता है — बाहर से नहीं आता।", "Our chhena and khoa are made right here, not bought in.")}</p></div>
   <div class="feat">{art.diya(62)}<h3>{T("2000 से", "Since 2000")}</h3><p>{T("पापा श्री दिनेश कुमार साहू ने शुरू की — आज भी वही स्वाद और भरोसा।", "Started by our father Shri Dinesh Kumar Sahu — the same taste and trust today.")}</p></div>
   <div class="feat">{art.vegmark(62)}<h3>{T("100% अंडा-रहित केक", "100% eggless cakes")}</h3><p>{T("जन्मदिन, सालगिरह, फोटो और थीम केक।", "Birthday, anniversary, photo and theme cakes.")}</p></div>
   <div class="feat">{art.scooter(62)}<h3>{T("घर तक डिलीवरी", "Home delivery")}</h3><p>{T("6 km तक, ₹499 या ज़्यादा के ऑर्डर पर — कोई डिलीवरी चार्ज नहीं।", "Within 6 km on orders of ₹499 or more — no delivery charge.")}</p></div>
  </div>
 </div>
</section>

<section class="band">
 <div class="wrap occ">
  <div>
   <div class="eyebrow">{T("शादी · तिलक · मुंडन · पूजा", "Weddings · Tilak · Mundan · Puja")}</div>
   <h2>{T("हर शुभ अवसर की मिठास", "Sweetness for every auspicious day")}</h2>
   <div class="chips"><span>{T("शादी-ब्याह", "Weddings")}</span><span>{T("तिलक", "Tilak")}</span><span>{T("मुंडन", "Mundan")}</span><span>{T("जनेऊ", "Janeu")}</span><span>{T("गृह प्रवेश", "Housewarming")}</span><span>{T("पूजा-पाठ", "Puja")}</span><span>{T("जन्मदिन", "Birthdays")}</span></div>
   <p>{T("शादी-भोज का बड़ा ऑर्डर भी — बस <b>कम से कम 2 दिन पहले</b> बता दें, ताज़ी बनाकर देंगे; मात्रा और समय WhatsApp पर पक्का। (रोज़ का छोटा ऑर्डर उसी दिन भी मिलता है।)", "Big orders for weddings and feasts too — just tell us <b>at least 2 days ahead</b> and we'll make it fresh; quantity and time confirmed on WhatsApp. (Everyday small orders come the same day.)")}</p>
   <div class="row mt"><a class="btn btn-main" href="/wedding/">{T("बड़ा ऑर्डर बुक करें", "Book a bulk order")}</a><a class="btn btn-wa" href="{wa("नमस्ते MB Sweets 🙏 मुझे शादी/पूजा के लिए मिठाई का बड़ा ऑर्डर देना है।")}" target="_blank" rel="noopener">{icon("wa")}WhatsApp</a></div>
  </div>
  <div class="fishbox">{art.fish_pair(380)}<p class="center" style="margin-top:10px;font-size:15px">{T("मिथिला में मछली का जोड़ा शुभ माना जाता है", "In Mithila, a pair of fish is a symbol of good fortune")}</p></div>
 </div>
</section>

<section class="soft">
 <div class="wrap">
  <div class="dcard">
   <div class="dart" aria-hidden="true">{art.milkcan(84)}{art.matka(80)}</div>
   <div>
    <div class="eyebrow">{T("भोज · भंडारा · हर आयोजन", "Feasts · bhandara · every gathering")}</div>
    <h2>{T("थोक में दूध, दही और पनीर", "Milk, curd & paneer in bulk")}</h2>
    <p>{T("शादी-ब्याह, श्राद्ध-ब्रह्मभोज, भंडारा — सुधा, राज फ्रेश, अमृत, अमूल; 15 किलो दही पैक ₹1300 से। बड़ी मात्रा पर कम रेट।", "Weddings, shraddh and brahmbhoj, bhandara — Sudha, Raj Fresh, Amrit, Amul; 15 kg curd packs from ₹1300. Lower rates in bulk.")}</p>
    <a class="btn btn-main" href="/bulk-dairy/">{T("थोक ऑर्डर दें", "Order in bulk")}</a>
   </div>
  </div>
 </div>
</section>

<section>
 <div class="wrap">
  {shead("केक", "Cakes", "हर जश्न के लिए केक", "Cakes for every celebration", "वनीला ½ किलो " + pid_b("i26") + " से। रेड वेलवेट, बटरस्कॉच, पाइनएप्पल, रसमलाई, फोटो और थीम केक भी।", "Vanilla from " + pid_b("i26") + " for ½ kg. Red velvet, butterscotch, pineapple, rasmalai, photo and theme cakes too.")}
  <span class="egg">{T("100% अंडा-रहित (Eggless)", "100% eggless")}</span>
  <div class="cakerow mt">
   <figure><span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span>{pic("cake-chocolate", "चॉकलेट केक (नमूना फोटो)", "(min-width:900px) 270px, 50vw")}<figcaption>{T("चॉकलेट", "Chocolate")}</figcaption></figure>
   <figure><span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span>{pic("cake-redvelvet", "रेड वेलवेट केक (नमूना फोटो)", "(min-width:900px) 270px, 50vw")}<figcaption>{T("रेड वेलवेट", "Red velvet")}</figcaption></figure>
   <figure><span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span>{pic("cake-photo", "फोटो केक (नमूना फोटो)", "(min-width:900px) 270px, 50vw")}<figcaption>{T("फोटो केक", "Photo cake")}</figcaption></figure>
   <figure><span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span>{pic("cake-princess", "थीम केक (नमूना फोटो)", "(min-width:900px) 270px, 50vw")}<figcaption>{T("थीम केक", "Theme cake")}</figcaption></figure>
  </div>
  <a class="more" href="/cakes/">{T("सारे केक और दाम", "All cakes & prices")}</a>
 </div>
</section>

<section class="soft">
 <div class="wrap">
  <div class="fly">
   <div class="plane" aria-hidden="true">✈️</div>
   <div>
    <div class="eyebrow">{T("दरभंगा एयरपोर्ट से सिर्फ ~5 km", "Only ~5 km from Darbhanga airport")}</div>
    <h2>{T("सफ़र पर मिथिला की मिठाई साथ ले जाइए", "Take the taste of Mithila on your journey")}</h2>
    <p>{T("NH किनारे दुकान है। पहले WhatsApp कर दें — मिठाई पैक करके तैयार रखेंगे, आकर ले जाइए।", "We're right on the NH. WhatsApp us first — we'll keep your sweets packed and ready to pick up.")}</p>
   </div>
   <a class="btn btn-wa" href="{wa(airport_msg)}" target="_blank" rel="noopener">{icon("wa")}{T("पैक करवाएँ", "Get it packed")}</a>
  </div>
 </div>
</section>

<section class="band" id="story">
 <div class="wrap story">
  <div>
   <div class="eyebrow">{T("हमारी कहानी", "Our story")}</div>
   <h2>{T("मिथिला की मिठास का सफ़र", "A journey of Mithila's sweetness")}</h2>
   <p class="mt">{T("एक छोटी सी दुकान, एक परिवार और एक ही वादा — जो मिठाई अपने घर में खिलाएँ, वही ग्राहक को दें।", "A small shop, one family and one promise — serve our customers the sweets we'd serve at home.")}</p>
   {art.sun(110)}
  </div>
  <ol class="tl">
   <li><span class="yr">2000</span><h3>{T("शुरुआत", "The beginning")}</h3><p>{T("पापा <b>श्री दिनेश कुमार साहू</b> ने ननौरा में यह दुकान खोली — अपने हाथ से बने छेना-खोआ की मिठाई के साथ।", "Our father <b>Shri Dinesh Kumar Sahu</b> opened this shop in Nanaura — with sweets made by hand from chhena and khoa.")}</p></li>
   <li class="fire"><span class="yr">2006</span><h3>{T("आग", "The fire")}</h3><p>{T("दुकान में आग लग गई और दुकान बंद करनी पड़ी।", "A fire broke out in the shop and it had to close.")}</p></li>
   <li><span class="yr">2017</span><h3>{T("फिर से शुरुआत", "A new start")}</h3><p>{T("हिम्मत नहीं हारी — दुकान फिर से खुली। वही हाथ का बना स्वाद, वही भरोसा।", "We didn't give up — the shop reopened. The same handmade taste, the same trust.")}</p></li>
   <li class="now"><span class="yr">{T("आज", "Now")}</span><h3>{T("आपके घर तक", "To your door")}</h3><p>{T("मिठाई, केक, दूध-दही — और अब ऑनलाइन ऑर्डर व घर तक डिलीवरी।", "Sweets, cakes, milk and curd — now with online orders and home delivery.")}</p></li>
  </ol>
 </div>
</section>

{visit_section()}
'''
    return page('/', 'MB Sweets, ननौरा दरभंगा — मिथिला की मिठास | Sweet Shop near Darbhanga Airport',
                'माँ भगवती मिष्ठान भंडार (MB Sweets), ननौरा, दरभंगा — 2000 से। हाथ से बनी बालूशाही, रसगुल्ला, गुलाब जामुन, अंडा-रहित केक, दूध-दही। घर बैठे ऑनलाइन ऑर्डर, 6 km तक डिलीवरी।',
                body, ld=[business_ld()])


def visit_section(title=True):
    head = shead("आइए दुकान पर", "Visit us", "पता, समय और रास्ता", "Address, hours & directions") if title else ''
    return f'''<section class="soft" id="visit">
 <div class="wrap">
  {head}
  <div class="visit">
   <div class="map" data-map="{MAP_EMBED}">
    <div class="mapface">
     <div class="mappin" aria-hidden="true">{icon("pin")}</div>
     <b>{T("ननौरा, दरभंगा", "Nanaura, Darbhanga")}</b>
     <span>{T("NH किनारे · दरभंगा एयरपोर्ट से ~5 km", "On the NH · ~5 km from Darbhanga airport")}</span>
     <div class="row" style="justify-content:center">
      <button class="btn btn-line btn-sm" type="button" data-loadmap>{T("🗺️ यहीं नक्शा दिखाएँ", "🗺️ Show map here")}</button>
      <a class="btn btn-main btn-sm" href="{MAPS}" target="_blank" rel="noopener">{icon("pin")}{T("Google Maps में खोलें", "Open in Google Maps")}</a>
     </div>
    </div>
   </div>
   <div class="info">
    <dl>
     <div><dt>{T("पता", "Address")}</dt><dd>{T("माँ भगवती मिष्ठान भंडार, ननौरा मेन रोड (NH 527B), दरभंगा एयरपोर्ट के पास, दरभंगा, बिहार 846005 — एयरपोर्ट से ~5 km", "Maa Bhagwati Misthan Bhandar, Nanaura Main Rd (NH 527B), near Darbhanga Airport, Darbhanga, Bihar 846005 — ~5 km from the airport")}</dd></div>
     <div><dt>{T("समय", "Hours")}</dt><dd>{T("रोज़ सुबह 7 से रात 9 बजे तक · ऑनलाइन ऑर्डर सुबह 7 से शाम 7 बजे तक (उसके बाद अगले दिन के लिए)", "Daily 7 am – 9 pm · online orders 7 am – 7 pm (later ones for the next day)")}</dd></div>
     <div><dt>{T("फ़ोन", "Phone")}</dt><dd class="tels"><a href="tel:+91{PHONE1}">📞 {PHONE1}</a><a href="tel:+91{PHONE2}">📞 {PHONE2}</a></dd></div>
     <div><dt>{T("डिलीवरी", "Delivery")}</dt><dd>{T("6 km तक · ऑर्डर कम से कम ₹499, डिलीवरी चार्ज नहीं · दुकान से खुद ले जाने पर कोई न्यूनतम रकम नहीं", "Within 6 km · minimum order ₹499, no delivery charge · no minimum for pickup")}</dd></div>
    </dl>
    <div class="row mt">
     <a class="btn btn-main btn-sm" href="{MAPS}" target="_blank" rel="noopener">{icon("pin")}{T("रास्ता देखें", "Get directions")}</a>
     <a class="btn btn-line btn-sm" href="tel:+91{PHONE1}">{icon("phone")}{T("कॉल करें", "Call")}</a>
    </div>
   </div>
  </div>
 </div>
</section>'''


# ================= SWEETS =================
def sweets_page():
    cards = ''.join(sweet_card(s) for s in SWEETS)
    UNIT_CODE = {'किलो': ('KGM', 'per kg'), 'पीस': ('C62', 'per piece'), 'प्लेट': ('C62', 'per plate')}
    menu_items = []
    for s in SWEETS:
        offers = []
        for iid in s['ids']:
            it = ITEMS[iid]
            code, label = UNIT_CODE.get(it['unit'], ('C62', ''))
            offers.append({'@type': 'Offer', 'price': it['price'], 'priceCurrency': 'INR', 'description': label,
                           'priceSpecification': {'@type': 'UnitPriceSpecification', 'price': it['price'], 'priceCurrency': 'INR',
                                                  'referenceQuantity': {'@type': 'QuantitativeValue', 'value': 1, 'unitCode': code}}})
        menu_items.append({'@type': 'MenuItem', 'name': f"{s['en']} ({s['hi']})", 'description': s['d_en'], 'offers': offers})
    items_ld = {'@context': 'https://schema.org', '@type': 'Menu', '@id': SITE + '/sweets/#menu', 'name': 'MB Sweets — sweets menu',
                'inLanguage': 'hi', 'hasMenuSection': [{'@type': 'MenuSection', 'name': 'Sweets (मिठाइयाँ)', 'hasMenuItem': menu_items}]}
    body = f'''
<section class="phead">
 <div class="wrap">
  <div class="crumb"><a href="/">{T("होम", "Home")}</a> › {T("मिठाइयाँ", "Sweets")}</div>
  <div class="eyebrow">{T("दुकान में अपने हाथ से बनी", "Made by hand in our shop")}</div>
  <h1>{T("मिठाइयाँ और दाम", "Sweets & prices")}</h1>
  <p class="lead">{T("दुकान में अपने हाथ से छेना और खोआ से बनी मिठाई — वही दाम जो दुकान में। किसी भी मिठाई पर “ऑर्डर करें” दबाइए, मेन्यू सीधे वहीं खुलेगा।", "Sweets made by hand in our shop from chhena and khoa — the same prices as in the shop. Tap “Order” on any sweet and the menu opens right there.")}</p>
  <div class="infochips"><span>⚖️ {T("कम से कम 250 ग्राम या पीस में", "Min. 250 g or by the piece")}</span><span>🚚 {T("6 km तक डिलीवरी — कम से कम ₹499, कोई चार्ज नहीं", "Delivery within 6 km — minimum ₹499, no charge")}</span><span>🏪 {T("दुकान से ले जाने पर कोई न्यूनतम नहीं", "No minimum for pickup")}</span></div>
  <div class="realstrip">
   <figure>{pic("real-trays", "दुकान की ट्रे में बालूशाही और चमचम", "(min-width:900px) 360px, 33vw", lazy=False)}</figure>
   <figure>{pic("real-mix-tray", "दुकान की ट्रे में छेना की मिठाइयाँ", "(min-width:900px) 360px, 33vw", lazy=False)}</figure>
   <figure>{pic("real-rasgulla-tray", "दुकान की ट्रे में रसगुल्ला", "(min-width:900px) 360px, 33vw", lazy=False)}</figure>
   <figcaption>📸 {T("हमारी दुकान के शोकेस की असली फोटो", "Real photos from our showcase")}</figcaption>
  </div>
 </div>
</section>
<section style="padding-top:26px">
 <div class="wrap"><div class="grid-cards">{cards}</div></div>
</section>
<section class="soft">
 <div class="wrap">
  {shead("असली फोटो", "Real photos", "चमचम की किस्में", "Cham cham varieties", "दुकान में आम तौर पर कई तरह के चमचम मिलते हैं — आज कौन-से हैं, WhatsApp पर पूछ लें।", "We usually have several kinds of cham cham — ask on WhatsApp which ones are in today.")}
  <div class="mosaic">
   <figure class="w">{pic("real-chamcham", "चमचम", "(min-width:900px) 560px, 100vw")}<figcaption>{T("चमचम", "Cham cham")}</figcaption></figure>
   <figure class="w">{pic("real-orange", "नारियल वाला चमचम", "(min-width:900px) 560px, 100vw")}<figcaption>{T("नारियल वाला", "With coconut")}</figcaption></figure>
   <figure class="w">{pic("real-white", "सफ़ेद चमचम", "(min-width:900px) 560px, 100vw")}<figcaption>{T("सफ़ेद चमचम", "White cham cham")}</figcaption></figure>
   <figure class="w">{pic("real-rasmalai-trays", "रसमलाई", "(min-width:900px) 560px, 100vw")}<figcaption>{T("रसमलाई", "Rasmalai")}</figcaption></figure>
  </div>
  <div class="row mt"><a class="btn btn-wa" href="{wa("नमस्ते MB Sweets 🙏 आज कौन-कौन सी मिठाई मिलेगी?")}" target="_blank" rel="noopener">{icon("wa")}{T("आज क्या-क्या है? पूछें", "Ask what's in today")}</a></div>
 </div>
</section>
<section>
 <div class="wrap">
  <div class="fly">
   <div class="plane" aria-hidden="true">🎉</div>
   <div><div class="eyebrow">{T("शादी · पूजा · भोज", "Weddings · Puja · Feasts")}</div><h2>{T("शादी-भोज का ऑर्डर? 2 दिन पहले बताइए", "Wedding or feast order? Tell us 2 days ahead")}</h2><p>{T("बालूशाही, रसगुल्ला, गुलाब जामुन, बूंदी, लड्डू — बड़ी मात्रा में भी।", "Balushahi, rasgulla, gulab jamun, boondi, laddoo — in large quantities too.")}</p></div>
   <a class="btn btn-main" href="/wedding/">{T("बड़ा ऑर्डर बुक करें", "Book a bulk order")}</a>
  </div>
 </div>
</section>'''
    return page('/sweets/', 'मिठाइयाँ और दाम — बालूशाही, रसगुल्ला, गुलाब जामुन | MB Sweets ननौरा, दरभंगा',
                'MB Sweets ननौरा की सारी मिठाइयाँ और आज के दाम: बालूशाही ₹' + str(price('i3')) + '/किलो, रसगुल्ला ₹' + str(price('i1')) + '/किलो, गुलाब जामुन, चमचम, रसमलाई, पेड़ा, लड्डू, जलेबी। घर बैठे ऑर्डर करें।',
                body, ld=[crumbs_ld('Sweets', '/sweets/'), items_ld])


# ================= CAKES =================
FLAVORS = [
    # only the flavours the shop has confirmed (same as the order menu); others are asked on WhatsApp
    ('redvelvet', 'रेड वेलवेट', 'Red Velvet', 'redvelvet'), ('butterscotch', 'बटरस्कॉच', 'Butterscotch', 'butterscotch'),
    ('pineapple', 'पाइनएप्पल', 'Pineapple', 'pineapple'), ('rasmalai', 'रसमलाई केक', 'Rasmalai Cake', 'rasmalai'),
]
OCCASIONS = [
    ('birthday', 'जन्मदिन केक', 'Birthday cake', 'नाम और उम्र के साथ', 'With name and age', None),
    ('anniversary', 'सालगिरह केक', 'Anniversary cake', 'दिल वाला और गुलाब', 'Heart-shaped with roses', 'anniversary'),
    ('photo', 'फोटो केक', 'Photo cake', 'आपकी फोटो केक पर', 'Your photo on the cake', 'photo'),
    ('princess', 'थीम / डिज़ाइनर केक', 'Theme / designer cake', 'प्रिंसेस, कार्टून-थीम वगैरह', 'Princess and other themes', 'theme'),
]


def cake_msg(name):
    return f'नमस्ते MB Sweets 🙏 मुझे {name} केक चाहिए।\nवज़न: ½ किलो / 1 किलो\nतारीख और समय:\nकेक पर लिखना है:\n(वेबसाइट से)'


def cakes_page():
    for key, hi, en, custom in FLAVORS:
        WA_EN[cake_msg(hi)] = cake_msg_en(en)
    for key, hi, en, s_hi, s_en, custom in OCCASIONS:
        WA_EN[cake_msg(hi.replace(" केक", ""))] = cake_msg_en(en.replace(' cake', ''))
    fixed = ''
    for key, hi, en, half, full, img, alt in [('cake-vanilla', 'वनीला केक', 'Vanilla cake', 'i26', 'i27', 'cake-vanilla', 'वनीला केक (नमूना फोटो)'),
                                              ('cake-choco', 'चॉकलेट केक', 'Chocolate cake', 'i29', 'i28', 'cake-chocolate', 'चॉकलेट केक (नमूना फोटो)')]:
        fixed += f'''<article class="fcard" data-ids="{half},{full}">
 <div style="position:relative">{pic(img, alt, "(min-width:760px) 170px, 120px")}<span class="note-sample">{T("नमूना", "Sample")}</span></div>
 <div><h3>{T(hi, en)}<span class="off-badge">{T("आज खत्म", "Sold out today")}</span></h3>
  <div class="prices">{tag(half, "½ किलो", "½ kg")}{tag(full, "1 किलो", "1 kg")}</div>
  <a class="btn btn-main btn-sm" href="{olink(item=key)}" data-order>{icon("bag")}{T("ऑर्डर करें", "Order")}</a></div>
</article>'''
    flav = ''
    for key, hi, en, custom in FLAVORS:
        btn = (f'<a class="btn btn-main" href="{olink(cake=custom)}" data-order>{icon("bag")}{T("ऑर्डर करें", "Order")}</a>' if custom else
               f'<a class="btn btn-wa" href="{wa(cake_msg(hi))}" target="_blank" rel="noopener">{icon("wa")}{T("दाम पूछें", "Ask the price")}</a>')
        flav += f'''<article class="pcard"><div class="pic">{pic("cake-" + key, (hi if "केक" in hi else hi + " केक") + " (नमूना फोटो)", "(min-width:1040px) 260px, (min-width:720px) 30vw, 50vw")}<span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span></div>
 <div class="body"><h3>{T(hi, en)}</h3><p>{T("दाम साइज़ और डिज़ाइन के हिसाब से", "Price depends on size & design")}</p><div class="acts">{btn}</div></div></article>'''
    occ = ''
    for key, hi, en, s_hi, s_en, custom in OCCASIONS:
        btn = (f'<a class="btn btn-main" href="{olink(cake=custom)}" data-order>{icon("bag")}{T("डिज़ाइन बताएँ", "Describe design")}</a>' if custom else
               f'<a class="btn btn-wa" href="{wa(cake_msg(hi.replace(" केक", "")))}" target="_blank" rel="noopener">{icon("wa")}{T("ऑर्डर करें", "Order")}</a>')
        occ += f'''<article class="pcard"><div class="pic">{pic("cake-" + key, hi + " (नमूना फोटो)", "(min-width:1040px) 260px, (min-width:720px) 30vw, 50vw")}<span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span></div>
 <div class="body"><h3>{T(hi, en)}</h3><p>{T(s_hi, s_en)}</p><div class="acts">{btn}</div></div></article>'''
    addons = ''
    for img, hi, en in [('addon-candles', 'बर्थडे कैंडल', 'Birthday candles'), ('addon-toppers', 'केक टॉपर', 'Cake toppers'),
                        ('addon-balloons', 'गुब्बारे और सजावट', 'Balloons & party decor'), ('addon-decor', 'केक सजाने का सामान', 'Cake decoration items')]:
        addons += f'<figure><span class="note-sample">{T("नमूना फोटो", "Sample photo")}</span>{pic(img, hi + " (नमूना फोटो)", "(min-width:900px) 270px, 50vw")}<figcaption>{T(hi, en)}</figcaption></figure>'
    body = f'''
<section class="phead">
 <div class="wrap">
  <div class="crumb"><a href="/">{T("होम", "Home")}</a> › {T("केक", "Cakes")}</div>
  <div class="eyebrow">{T("जन्मदिन · सालगिरह · हर जश्न", "Birthdays · anniversaries · every celebration")}</div>
  <h1>{T("केक — हर जश्न के लिए", "Cakes for every celebration")}</h1>
  <p class="lead">{T("वनीला और चॉकलेट केक तय दाम पर। बाकी फ्लेवर और डिज़ाइनर केक का दाम साइज़ व डिज़ाइन देखकर WhatsApp पर बताया जाता है।", "Vanilla and chocolate cakes at fixed prices. Other flavours and designer cakes are priced on WhatsApp by size and design.")}</p>
  <div class="infochips"><span class="egg">{T("100% अंडा-रहित", "100% eggless")}</span><span>📅 {T("केक पहले से ऑर्डर करें — समय दुकान बताएगी", "Order ahead — the shop will confirm timing")}</span><span>📸 {T("फोटो नमूने के लिए हैं", "Photos are samples")}</span></div>
 </div>
</section>
<section style="padding-top:22px">
 <div class="wrap">
  {shead("तय दाम", "Fixed prices", "वनीला और चॉकलेट", "Vanilla & chocolate")}
  <div class="fixed">{fixed}</div>
 </div>
</section>
<section class="soft">
 <div class="wrap">
  {shead("और भी फ्लेवर", "More flavours", "आपका पसंदीदा फ्लेवर", "Pick your flavour", "ये फ्लेवर मिलते हैं — कोई और फ्लेवर चाहिए तो WhatsApp पर पूछ लीजिए। दाम साइज़ और डिज़ाइन देखकर।", "These flavours are available — for any other flavour, just ask on WhatsApp. Price by size and design.")}
  <div class="grid-cards g4">{flav}</div>
 </div>
</section>
<section>
 <div class="wrap">
  {shead("मौके के हिसाब से", "By occasion", "खास मौके, खास केक", "Special cakes for special days")}
  <div class="grid-cards g4">{occ}</div>
 </div>
</section>
<section class="soft">
 <div class="wrap">
  {shead("केक के साथ", "Add-ons", "जश्न का पूरा सामान", "Everything for the party", "कैंडल, टॉपर, गुब्बारे और सजावट — केक के साथ ले जाइए।", "Candles, toppers, balloons and decorations — pick them up with your cake.")}
  <div class="addons">{addons}</div>
  <div class="row mt"><a class="btn btn-wa" href="{wa("नमस्ते MB Sweets 🙏 केक के साथ कैंडल/टॉपर/गुब्बारे चाहिए। क्या-क्या मिलेगा?")}" target="_blank" rel="noopener">{icon("wa")}{T("क्या-क्या मिलेगा, पूछें", "Ask what's available")}</a></div>
 </div>
</section>'''
    return page('/cakes/', 'अंडा-रहित केक — जन्मदिन, सालगिरह, फोटो केक | MB Sweets ननौरा, दरभंगा',
                f'100% अंडा-रहित केक ननौरा, दरभंगा में: वनीला ½ किलो ₹{price("i26")}, चॉकलेट ½ किलो ₹{price("i29")}। रेड वेलवेट, बटरस्कॉच, पाइनएप्पल, रसमलाई, फोटो केक, थीम केक। कैंडल, टॉपर, गुब्बारे भी।',
                body, ld=[crumbs_ld('Cakes', '/cakes/')])


# ================= PRODUCTS =================
def products_page():
    def row(iid, hi, en):
        it = ITEMS[iid]
        return f'<li data-ids="{iid}"><span>{T(hi, en)}<span class="off-badge">{T("खत्म", "Out")}</span></span><b data-pid="{iid}">₹{it["price"]}</b></li>'
    dairy = ''.join([
        row('i14', 'सुधा दूध फुल क्रीम — 1 लीटर', 'Sudha full-cream milk — 1 L'),
        row('i15', 'सुधा दूध टोंड (हाफ क्रीम) — 1 लीटर', 'Sudha toned milk — 1 L'),
        row('i25', 'अमूल दही — 200 ग्राम', 'Amul curd — 200 g'), row('i30', 'अमृत दही — 200 ग्राम', 'Amrit curd — 200 g'),
        row('i24', 'अमूल दही — 400 ग्राम', 'Amul curd — 400 g'), row('i31', 'अमृत दही — 400 ग्राम', 'Amrit curd — 400 g'),
        row('i23', 'अमूल दही — 1 किलो', 'Amul curd — 1 kg'), row('i32', 'अमृत दही — 1 किलो', 'Amrit curd — 1 kg'),
        row('i18', 'अमृत दही — 2 किलो पैक', 'Amrit curd — 2 kg pack'),
        row('i19', 'अमूल दही — 5 किलो पैक', 'Amul curd — 5 kg pack'), row('i20', 'दही — 15 किलो पैक', 'Curd — 15 kg pack'),
        row('i16', 'पनीर पैकेट — 200 ग्राम', 'Paneer packet — 200 g'), row('i17', 'खुला पनीर — 1 किलो', 'Loose paneer — 1 kg'),
    ])
    pack_btn = f'<a class="btn btn-main" href="{olink(tab="pack")}" data-order>{icon("bag")}{T("मेन्यू में लिखकर ऑर्डर करें", "Order via the menu")}</a>'

    def cat(pics, eyebrow, h, p, extra=''):
        cls = 'pics one' if len(pics) == 1 else 'pics'
        return f'''<article class="cat"><div class="{cls}">{''.join(pics)}</div><div>
 <div class="eyebrow">{T(*eyebrow)}</div><h2>{T(*h)}</h2><p class="mt">{T(*p)}</p>{extra}
 <div class="row">{pack_btn}<a class="btn btn-wa" href="{wa("नमस्ते MB Sweets 🙏 क्या यह सामान मिलेगा: ")}" target="_blank" rel="noopener">{icon("wa")}{T("पूछें", "Ask")}</a></div>
</div></article>'''
    body = f'''
<section class="phead">
 <div class="wrap">
  <div class="crumb"><a href="/">{T("होम", "Home")}</a> › {T("दूध-दही व सामान", "Dairy & more")}</div>
  <div class="eyebrow">{T("मिठाई के साथ रोज़ की ज़रूरत", "Everyday needs, along with sweets")}</div>
  <h1>{T("दूध-दही, नमकीन और पैकेट सामान", "Dairy, namkeen & packaged goods")}</h1>
  <p class="lead">{T("सुधा दूध, अमूल और अमृत दही, पनीर, नमकीन-भुजिया, बिस्किट-चॉकलेट और ठंडी कोल्ड ड्रिंक — मिठाई के ऑर्डर के साथ घर मँगवाइए। पैकेट सामान MRP पर।", "Sudha milk, Amul and Amrit curd, paneer, namkeen, biscuits, chocolates and chilled drinks — add them to your sweets order. Packaged goods at MRP.")}</p>
 </div>
</section>
<section style="padding-top:22px">
 <div class="wrap">
  <article class="cat"><div class="pics four">{simg("menu-milk.webp", "सुधा दूध", lazy=False)}{simg("menu-dahi-amul.webp", "अमूल दही — दुकान की असली फोटो", lazy=False)}{simg("menu-dahi-amrit.webp", "अमृत दही — दुकान की असली फोटो", lazy=False)}{simg("menu-paneer.webp", "पनीर", lazy=False)}</div><div>
   <div class="eyebrow">{T("रोज़ ताज़ा", "Fresh every day")}</div><h2>{T("दूध, दही और पनीर", "Milk, curd & paneer")}</h2>
   <ul class="plist">{dairy}</ul>
   <div class="row"><a class="btn btn-main" href="{olink(tab="dairy")}" data-order>{icon("bag")}{T("दूध-दही ऑर्डर करें", "Order dairy")}</a><a class="btn btn-line" href="/bulk-dairy/">{T("थोक में चाहिए?", "Need it in bulk?")}</a></div>
  </div></article>
  {cat([pic("real-chips", "नमकीन और चिप्स का रैक", "(min-width:880px) 500px, 92vw")],
       ("नमकीन · भुजिया · चिप्स", "Namkeen · bhujia · chips"), ("नमकीन और स्नैक्स", "Namkeen & snacks"),
       ("खुला नमकीन " + pid_b("i21") + "/किलो, और पैकेट वाले नमकीन-भुजिया-चिप्स MRP पर। मेन्यू के “पैकेट सामान” बॉक्स में लिख दीजिए क्या चाहिए।", "Loose namkeen at " + pid_b("i21") + "/kg, and packaged namkeen, bhujia and chips at MRP. Write what you need in the menu's “Packaged items” box."))}
  {cat([pic("real-biscuits", "बिस्किट", "(min-width:880px) 250px, 45vw"), pic("real-chocolates", "चॉकलेट का काउंटर", "(min-width:880px) 250px, 45vw")],
       ("बिस्किट · चॉकलेट", "Biscuits · chocolates"), ("बिस्किट और चॉकलेट", "Biscuits & chocolates"),
       ("चाय के साथ बिस्किट से लेकर तोहफ़े वाली चॉकलेट तक — सब MRP पर।", "From tea-time biscuits to chocolates for gifting — all at MRP."))}
  {cat([pic("real-fridge", "कोल्ड ड्रिंक का फ्रिज", "(min-width:880px) 500px, 92vw")],
       ("ठंडा-ठंडा", "Chilled"), ("कोल्ड ड्रिंक और पानी", "Cold drinks & water"),
       ("कोल्ड ड्रिंक, जूस और पानी की बोतल — पार्टी और सफ़र के लिए।", "Soft drinks, juices and bottled water — for parties and journeys."))}
 </div>
</section>'''
    return page('/products/', 'सुधा दूध, अमूल-अमृत दही, पनीर, नमकीन | MB Sweets ननौरा, दरभंगा',
                f'MB Sweets ननौरा में सुधा दूध ₹{price("i14")}/लीटर, अमूल और अमृत दही, पनीर, नमकीन-भुजिया, बिस्किट, चॉकलेट और कोल्ड ड्रिंक। मिठाई के साथ घर मँगवाइए।',
                body, ld=[crumbs_ld('Dairy & more', '/products/')])


# ================= WEDDING & GIFTS =================
def wedding_page():
    sweets_opts = ['बालूशाही|Balushahi', 'रसगुल्ला|Rasgulla', 'गुलाब जामुन|Gulab jamun', 'चमचम|Cham cham', 'रसमलाई|Rasmalai',
                   'पेड़ा|Peda', 'लड्डू|Laddoo', 'बूंदी|Boondi', 'जलेबी|Jalebi', 'मिल्क केक|Milk cake']
    checks = ''.join(f'<label><input type="checkbox" name="sw" value="{v.split("|")[0]}">{T(*v.split("|"))}</label>' for v in sweets_opts)
    occ = ['शादी|Wedding', 'तिलक|Tilak', 'मुंडन|Mundan', 'जनेऊ|Janeu', 'गृह प्रवेश|Housewarming', 'पूजा / भोज|Puja / feast', 'जन्मदिन / पार्टी|Birthday / party', 'कुछ और|Other']
    occ_opts = ''.join(f'<option value="{o.split("|")[0]}" data-en="{o.split("|")[1]}">{o.split("|")[0]}</option>' for o in occ)
    bulk_prices = ''.join(tag(i, hi + ' /किलो', en + ' /kg') for i, hi, en in [('i3', 'बालूशाही', 'Balushahi'), ('i1', 'रसगुल्ला', 'Rasgulla'), ('i5', 'गुलाब जामुन', 'Gulab jamun'), ('i7', 'चमचम', 'Cham cham'), ('i11', 'लड्डू', 'Laddoo'), ('i13', 'बूंदी', 'Boondi')])
    body = f'''
<section class="phead">
 <div class="wrap">
  <div class="crumb"><a href="/">{T("होम", "Home")}</a> › {T("शादी व गिफ्ट", "Weddings & gifts")}</div>
  <div class="center" style="margin:6px 0 4px">{art.fish_pair(280)}</div>
  <div class="eyebrow">{T("मिथिला की हर रस्म में मिठास", "Sweetness in every Mithila ritual")}</div>
  <h1>{T("शादी-ब्याह और शुभ अवसर", "Weddings & auspicious occasions")}</h1>
  <p class="lead">{T("तिलक से विदाई तक, मुंडन से गृह प्रवेश तक — मिठाई का बड़ा ऑर्डर अब आसान। फ़ॉर्म भरिए, सीधे WhatsApp पर हमारे पास पहुँचेगा।", "From tilak to vidaai, mundan to housewarming — bulk sweet orders made easy. Fill the form and it reaches us directly on WhatsApp.")}</p>
 </div>
</section>
<section class="band">
 <div class="wrap wed">
  <div>
   <div class="eyebrow">{T("कैसे होता है", "How it works")}</div>
   <h2>{T("बड़ा ऑर्डर — बिना झंझट", "Bulk orders, hassle-free")}</h2>
   <ul class="points mt">
    <li>📅 <span>{T("<b>कम से कम 2 दिन पहले</b> बताइए — ताज़ी बनाकर देंगे।", "Tell us <b>at least 2 days ahead</b> — we make it fresh.")}</span></li>
    <li>⚖️ <span>{T("<b>बड़ी मात्रा भी</b> — कितना चाहिए बताइए, दुकान WhatsApp पर पक्का करेगी।", "<b>Large quantities too</b> — tell us how much and we'll confirm on WhatsApp.")}</span></li>
    <li>🤝 <span>{T("दाम और डिलीवरी <b>WhatsApp पर पक्की</b> करेंगे। 6 km तक डिलीवरी, या दुकान से ले जाइए।", "We <b>confirm price and delivery on WhatsApp</b>. Delivery within 6 km, or pick up from the shop.")}</span></li>
    <li>💰 <span>{T("दाम वही जो दुकान में — नीचे आज के दाम देख लीजिए।", "Same prices as in the shop — see today's prices below.")}</span></li>
   </ul>
   <div class="prices">{bulk_prices}</div>
  </div>
  <form class="form" id="bulkform" novalidate>
   <h3 style="margin-bottom:12px">{T("बड़े ऑर्डर का फ़ॉर्म", "Bulk order form")}</h3>
   <div class="f"><label for="b-occ">{T("मौका", "Occasion")}</label><select id="b-occ">{occ_opts}</select></div>
   <div class="two">
    <div class="f"><label for="b-date">{T("तारीख", "Date")}</label><input id="b-date" type="date"></div>
    <div class="f"><label for="b-qty">{T("कुल कितना", "Total quantity")}</label><input id="b-qty" type="text" placeholder="जैसे 10 किलो" data-en-ph="e.g. 10 kg"></div>
   </div>
   <div class="f"><label>{T("कौन-सी मिठाई", "Which sweets")}</label><div class="checks">{checks}</div></div>
   <div class="two">
    <div class="f"><label for="b-name">{T("आपका नाम", "Your name")}</label><input id="b-name" type="text" autocomplete="name"></div>
    <div class="f"><label for="b-phone">{T("मोबाइल", "Mobile")}</label><input id="b-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10 अंक" data-en-ph="10 digits"></div>
   </div>
   <div class="two">
    <div class="f"><label for="b-place">{T("गाँव / जगह", "Village / place")}</label><input id="b-place" type="text"></div>
    <div class="f"><label for="b-mode">{T("कैसे लेंगे", "Delivery or pickup")}</label><select id="b-mode"><option value="डिलीवरी चाहिए" data-en="Delivery">डिलीवरी चाहिए</option><option value="दुकान से ले जाएँगे" data-en="Pickup">दुकान से ले जाएँगे</option></select></div>
   </div>
   <div class="f"><label for="b-note">{T("और कुछ", "Anything else")}</label><textarea id="b-note" placeholder="जैसे डिब्बे में पैकिंग, समय" data-en-ph="e.g. box packing, time"></textarea></div>
   <div class="err" id="b-err" role="alert"></div>
   <button class="btn btn-wa" type="submit" style="width:100%">{icon("wa")}{T("WhatsApp पर भेजें", "Send on WhatsApp")}</button>
  </form>
 </div>
</section>
<section>
 <div class="wrap">
  <div class="gift">
   <div class="center">{art.giftbox(170)}</div>
   <div>
    <div class="eyebrow">{T("तोहफ़े के लिए", "For gifting")}</div>
    <h2>{T("गिफ्ट पैकिंग", "Gift packing")}</h2>
    <p class="mt">{T("त्योहार, शादी का बायना, मेहमानों को तोहफ़ा या एयरपोर्ट से सफ़र — मिठाई सुंदर डिब्बे में पैक करवाइए। डिब्बे और दाम WhatsApp पर पूछें।", "Festivals, wedding bayna, gifts for guests or a flight home — get sweets packed in a nice box. Ask on WhatsApp for boxes and prices.")}</p>
    <a class="btn btn-wa" href="{wa("नमस्ते MB Sweets 🙏 मुझे मिठाई गिफ्ट पैकिंग में चाहिए। कौन-कौन से डिब्बे हैं और दाम क्या है?")}" target="_blank" rel="noopener">{icon("wa")}{T("गिफ्ट पैकिंग पूछें", "Ask about gift packing")}</a>
   </div>
  </div>
  <p class="center mt">🥛 {T("भोज के लिए दूध-दही-पनीर भी चाहिए?", "Need milk, curd and paneer for the feast?")} <a href="/bulk-dairy/">{T("थोक दूध-दही का ऑर्डर", "Bulk dairy order")}</a></p>
 </div>
</section>'''
    return page('/wedding/', 'शादी, तिलक, मुंडन के लिए मिठाई का बड़ा ऑर्डर | MB Sweets ननौरा, दरभंगा',
                'शादी-ब्याह, तिलक, मुंडन, पूजा और भोज के लिए मिठाई का थोक ऑर्डर — बालूशाही, रसगुल्ला, गुलाब जामुन, बूंदी, लड्डू। कम से कम 2 दिन पहले। गिफ्ट पैकिंग भी। MB Sweets, ननौरा, दरभंगा।',
                body, ld=[crumbs_ld('Weddings & gifts', '/wedding/')])


# ================= CONTACT =================
FAQ = [
    ('डिलीवरी कहाँ तक होती है?', 'Where do you deliver?',
     'दुकान से 6 km तक (जैसे खिरमा, एयरपोर्ट, केवटी रनवे, पिंडारुच की तरफ)। डिलीवरी की उपलब्धता देखकर ही डिलीवरी कन्फर्म की जाती है।',
     'Within 6 km of the shop (towards Khirma, the airport, Kewti runway, Pindaruch and so on). Delivery is confirmed only after checking availability.'),
    ('कम से कम कितने का ऑर्डर देना होगा?', 'Is there a minimum order?',
     'घर पर डिलीवरी के लिए ऑर्डर कम से कम ₹499 का होना चाहिए — इस पर कोई डिलीवरी चार्ज नहीं लगता। दुकान से खुद ले जाने पर कोई न्यूनतम रकम नहीं।',
     'Home delivery needs an order of at least ₹499 — with no delivery charge. There is no minimum for pickup.'),
    ('पेमेंट कैसे करें?', 'How do I pay?',
     'पहले दुकान WhatsApp पर ऑर्डर कन्फर्म करती है, उसके बाद UPI से पूरा पेमेंट करके स्क्रीनशॉट भेजें। पेमेंट के बाद डिलीवरी निकलती है। दुकान से खुद ले जाने पर सामान लेते समय दुकान पर पेमेंट करें।',
     'The shop first confirms your order on WhatsApp; then pay the full amount by UPI and send the screenshot. Delivery leaves after payment. For pickup, pay at the shop.'),
    ('ऑर्डर कब तक दे सकते हैं?', 'Until when can I order?',
     'ऑनलाइन ऑर्डर सुबह 7 से शाम 7 बजे तक। शाम 7 के बाद अगले दिन या आगे की तारीख के लिए ऑर्डर दे सकते हैं। "जल्दी" वाले ऑर्डर आम तौर पर 30–60 मिनट में।',
     'Online orders from 7 am to 7 pm. After 7 pm you can order for the next day or a later date. "As soon as possible" orders usually take 30–60 minutes.'),
    ('बड़ा ऑर्डर कितने पहले देना होगा?', 'How early should I place a big order?',
     'शादी-भोज जैसे बड़े मिठाई ऑर्डर: कम से कम 2 दिन पहले। थोक दूध-दही-पनीर: कल के लिए आज दोपहर 2 बजे तक। रोज़ का छोटा ऑर्डर उसी दिन भी मिल जाता है।',
     'Big sweets orders for weddings and feasts: at least 2 days ahead. Bulk milk, curd and paneer: by 2 pm for the next day. Everyday small orders can be delivered the same day.'),
    ('ऑर्डर कैंसिल हो सकता है?', 'Can I cancel?',
     'पेमेंट के बाद ग्राहक खुद कैंसिल करे तो पैसा वापस नहीं होता। अगर दुकान ने कन्फर्म करके भी समय पर डिलीवरी नहीं की, तो आप कैंसिल कर सकते हैं और पूरा पैसा वापस मिलेगा।',
     'If you cancel after paying, the money is not refunded. If we confirmed but could not deliver on time, you can cancel and get a full refund.'),
    ('केक में अंडा होता है?', 'Do the cakes contain egg?',
     'नहीं, सारे केक 100% अंडा-रहित (Eggless) हैं। वेबसाइट पर केक की फोटो नमूने के लिए हैं।',
     'No, all cakes are 100% eggless. Cake photos on the website are samples.'),
]


def contact_page():
    faq_html = ''.join(f'<details><summary>{T(q, qe)}</summary><p>{T(a, ae)}</p></details>' for q, qe, a, ae in FAQ)
    faq_ld = {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, qe, a, ae in FAQ]}
    body = f'''
<section class="phead">
 <div class="wrap">
  <div class="crumb"><a href="/">{T("होम", "Home")}</a> › {T("संपर्क", "Contact")}</div>
  <div class="eyebrow">{T("हम यहीं हैं", "We're right here")}</div>
  <h1>{T("संपर्क और पता", "Contact & address")}</h1>
  <p class="lead">{T("कॉल करें, WhatsApp करें या सीधे दुकान पर आइए — NH किनारे, दरभंगा एयरपोर्ट से करीब 5 km।", "Call, WhatsApp or drop by — we're on the NH, about 5 km from Darbhanga airport.")}</p>
  <div class="row mt">
   <a class="btn btn-main" href="tel:+91{PHONE1}">{icon("phone")}{PHONE1}</a>
   <a class="btn btn-line" href="tel:+91{PHONE2}">{icon("phone")}{PHONE2}</a>
   <a class="btn btn-wa" href="{wa(WA_HELLO)}" target="_blank" rel="noopener">{icon("wa")}WhatsApp</a>
  </div>
  <div class="row" style="margin-top:12px">
   <a class="btn btn-line btn-sm" href="{IG}" target="_blank" rel="noopener">{icon("ig")}Instagram</a>
   <a class="btn btn-line btn-sm" href="{FB}" target="_blank" rel="noopener">{icon("fb")}Facebook</a>
  </div>
 </div>
</section>
{visit_section(False)}
<section>
 <div class="wrap faq">
  {shead("आम सवाल", "FAQ", "ऑर्डर, डिलीवरी और पेमेंट", "Orders, delivery & payment")}
  {faq_html}
 </div>
</section>
<section class="band">
 <div class="wrap story">
  <div><div class="eyebrow">{T("हमारी कहानी", "Our story")}</div><h2>{T("2000 से, आपके साथ", "With you since 2000")}</h2>{art.lotus(120)}</div>
  <div><p>{T("पापा श्री दिनेश कुमार साहू ने सन् 2000 में ननौरा में यह दुकान शुरू की। 2006 में दुकान में आग लगी और दुकान बंद करनी पड़ी। 2017 में दुकान फिर से खुली — और तब से वही हाथ का बना छेना-खोआ, वही भरोसा। आज हम मिठाई के साथ केक, दूध-दही और घर तक डिलीवरी भी देते हैं।", "Our father, Shri Dinesh Kumar Sahu, started this shop in Nanaura in 2000. In 2006 a fire forced it to close. It reopened in 2017 — with the same handmade chhena and khoa and the same trust. Today we also offer cakes, dairy and home delivery.")}</p>
  <p>{T("— पंकज कुमार गुप्ता, माँ भगवती मिष्ठान भंडार", "— Pankaj Kumar Gupta, Maa Bhagwati Misthan Bhandar")}</p></div>
 </div>
</section>'''
    return page('/contact/', 'संपर्क, पता और रास्ता — MB Sweets, ननौरा, दरभंगा (एयरपोर्ट से 5 km)',
                f'MB Sweets (माँ भगवती मिष्ठान भंडार) ननौरा, दरभंगा — फ़ोन {PHONE1}, {PHONE2}। रोज़ सुबह 7 से रात 9 बजे। NH किनारे, दरभंगा एयरपोर्ट से ~5 km। डिलीवरी, पेमेंट और ऑर्डर के सवाल।',
                body, ld=[crumbs_ld('Contact', '/contact/'), business_ld(), faq_ld])


# ================= BULK DAIRY =================
def bulk_dairy_page():
    occ = ['शादी-ब्याह|Wedding', 'श्राद्ध / ब्रह्मभोज|Shraddh / Brahmbhoj', 'भंडारा|Bhandara', 'पूजा-यज्ञ|Puja / yagya',
           'तिलक / मुंडन / जनेऊ|Tilak / mundan / janeu', 'भोज / पार्टी|Feast / party', 'होटल / दुकान|Hotel / shop', 'कुछ और|Other']
    occ_opts = ''.join(f'<option value="{o.split("|")[0]}" data-en="{o.split("|")[1]}">{o.split("|")[0]}</option>' for o in occ)

    def row(iid, hi, en):
        return f'<li><span>{T(hi, en)}</span><b data-pid="{iid}">₹{ITEMS[iid]["price"]}</b></li>'
    prices = ''.join([
        row('i14', 'सुधा दूध फुल क्रीम — 1 लीटर', 'Sudha full-cream milk — 1 L'),
        row('i15', 'सुधा दूध टोंड — 1 लीटर', 'Sudha toned milk — 1 L'),
        f'<li><span>{T("दही — 15 किलो पैक (कंपनी के हिसाब से)", "Curd — 15 kg pack (by brand)")}</span><b>₹1300–1600</b></li>',
        row('i19', 'दही — 5 किलो पैक', 'Curd — 5 kg pack'),
        row('i18', 'दही — 2 किलो पैक', 'Curd — 2 kg pack'),
        row('i17', 'खुला पनीर — 1 किलो', 'Loose paneer — 1 kg'),
    ])
    wa_bulk = wa('नमस्ते MB Sweets 🙏 मुझे थोक में दूध/दही/पनीर चाहिए। बड़ी मात्रा का रेट बताइए।')
    body = f'''
<section class="phead calm">
 <div class="wrap">
  <div class="crumb"><a href="/">{T("होम", "Home")}</a> › {T("थोक दूध-दही", "Bulk dairy")}</div>
  <div class="dhero">
   <div>
    <div class="eyebrow">{T("भोज · भंडारा · हर आयोजन", "Feasts · bhandara · every gathering")}</div>
    <h1>{T("थोक में दूध, दही और पनीर", "Milk, curd & paneer in bulk")}</h1>
    <p class="lead">{T("शादी-ब्याह हो, श्राद्ध-ब्रह्मभोज हो या भंडारा — जितना दूध-दही-पनीर चाहिए, समय पर तैयार मिलेगा।", "Weddings, shraddh and brahmbhoj, bhandara — whatever milk, curd and paneer you need, ready on time.")}</p>
    <div class="row">
     <a class="btn btn-main" href="#dairyform">{T("थोक ऑर्डर दें", "Place a bulk order")}</a>
     <a class="btn btn-wa" href="{wa_bulk}" target="_blank" rel="noopener">{icon("wa")}{T("रेट पूछें", "Ask the rate")}</a>
    </div>
   </div>
   <div class="dart" aria-hidden="true">{art.milkcan(118)}{art.matka(112)}</div>
  </div>
 </div>
</section>

<section style="padding-top:12px">
 <div class="wrap">
  <div class="dnote">
   <b>⏰ {T("कल सुबह के लिए — आज दोपहर 2 बजे तक बताइए।", "For tomorrow morning — tell us by 2 pm today.")}</b>
   <span>{T("2 बजे के बाद दिया गया ऑर्डर परसों के लिए होगा। बड़ी मात्रा हो तो जितना पहले बताएँ, उतना अच्छा।", "Orders after 2 pm are for the day after tomorrow. For large quantities, the earlier the better.")}</span>
  </div>
  <div class="feats dfeats">
   <div class="feat"><div class="dico">✓</div><h3>{T("तय तारीख पर सप्लाई", "On the agreed date")}</h3><p>{T("मात्रा और समय WhatsApp पर पक्का करके।", "Quantity and time confirmed on WhatsApp.")}</p></div>
   <div class="feat"><div class="dico">🥛</div><h3>{T("चार कंपनियाँ", "Four brands")}</h3><p>{T("सुधा, राज फ्रेश, अमृत, अमूल — जो चाहिए।", "Sudha, Raj Fresh, Amrit, Amul — your choice.")}</p></div>
   <div class="feat"><div class="dico">🚚</div><h3>{T("6 km तक पहुँचाएँगे", "Delivered within 6 km")}</h3><p>{T("या दुकान से खुद ले जाइए।", "Or pick up from the shop.")}</p></div>
   <div class="feat"><div class="dico">₹</div><h3>{T("बड़ी मात्रा पर कम रेट", "Lower rate in bulk")}</h3><p>{T("मात्रा बताइए, रेट WhatsApp पर तय।", "Tell us the quantity — we fix the rate on WhatsApp.")}</p></div>
  </div>
 </div>
</section>

<section class="soft">
 <div class="wrap brandgrid">
  <div class="info">
   <div class="eyebrow">{T("क्या-क्या मिलेगा", "What we supply")}</div>
   <h2>{T("दूध, दही, पनीर", "Milk, curd, paneer")}</h2>
   <dl class="mt">
    <div><dt>🥛 {T("दूध", "Milk")}</dt><dd>{T("सुधा, राज फ्रेश, अमृत और अमूल — फुल क्रीम और टोंड।", "Sudha, Raj Fresh, Amrit and Amul — full cream and toned.")}</dd></div>
    <div><dt>🍶 {T("दही", "Curd")}</dt><dd>{T("सुधा, अमृत, अमूल वगैरह का दही। <b>15 किलो के पैक ₹1300 से ₹1600 तक</b> — कंपनी के हिसाब से। 2 और 5 किलो के पैक भी।", "Sudha, Amrit, Amul and more. <b>15 kg packs from ₹1300 to ₹1600</b> depending on brand. 2 kg and 5 kg packs too.")}</dd></div>
    <div><dt>🧀 {T("पनीर", "Paneer")}</dt><dd>{T("खुला पनीर किलो में, और 200 ग्राम के पैकेट।", "Loose paneer by the kg, and 200 g packets.")}</dd></div>
   </dl>
   <p class="mt">{T("कौन-सी कंपनी का चाहिए, फ़ॉर्म में लिख दीजिए या पूछ लीजिए।", "Tell us the brand you want in the form, or just ask.")}</p>
  </div>
  <div class="info">
   <div class="eyebrow">{T("आज के दाम", "Today's prices")}</div>
   <h2>{T("दुकान वाले दाम", "Shop prices")}</h2>
   <ul class="plist">{prices}</ul>
   <div class="discount">💰 {T("<b>बड़ी मात्रा में ऑर्डर देने पर रेट कम कर दिया जाएगा।</b> मात्रा बताइए — सही रेट WhatsApp पर बताएँगे।", "<b>Bulk orders get a lower rate.</b> Tell us the quantity and we'll quote the right rate on WhatsApp.")}</div>
  </div>
 </div>
</section>

<section id="order-form">
 <div class="wrap narrow">
  {shead("फ़ॉर्म भरें, WhatsApp पर भेजें", "Fill in, send on WhatsApp", "थोक ऑर्डर फ़ॉर्म", "Bulk order form", "भरते ही पूरा ऑर्डर हमारे WhatsApp पर पहुँचेगा। हम रेट और समय पक्का करके जवाब देंगे।", "Your whole order reaches our WhatsApp. We'll reply to confirm the rate and time.")}
  <form class="form" id="dairyform" novalidate>
   <div class="two">
    <div class="f"><label for="d-occ">{T("अवसर", "Occasion")}</label><select id="d-occ">{occ_opts}</select></div>
    <div class="f"><label for="d-date">{T("किस दिन चाहिए", "Date needed")}</label><input id="d-date" type="date"></div>
   </div>
   <div class="f"><label for="d-time">{T("किस समय तक", "By what time")}</label><select id="d-time"><option value="सुबह" data-en="Morning">सुबह</option><option value="दोपहर" data-en="Afternoon">दोपहर</option><option value="शाम" data-en="Evening">शाम</option></select></div>
   <fieldset class="qty">
    <legend>{T("कितना चाहिए", "Quantities")}</legend>
    <div class="qrow"><label for="d-fc">{T("दूध फुल क्रीम", "Full-cream milk")}</label><input id="d-fc" type="number" inputmode="decimal" min="0" step="any" placeholder="0"><span>{T("लीटर", "L")}</span></div>
    <div class="qrow"><label for="d-tm">{T("दूध टोंड", "Toned milk")}</label><input id="d-tm" type="number" inputmode="decimal" min="0" step="any" placeholder="0"><span>{T("लीटर", "L")}</span></div>
    <div class="qrow"><label for="d-dahi">{T("दही", "Curd")}</label><input id="d-dahi" type="number" inputmode="decimal" min="0" step="any" placeholder="0"><span>{T("किलो", "kg")}</span></div>
    <div class="qrow"><label for="d-paneer">{T("पनीर", "Paneer")}</label><input id="d-paneer" type="number" inputmode="decimal" min="0" step="any" placeholder="0"><span>{T("किलो", "kg")}</span></div>
   </fieldset>
   <div class="f"><label for="d-brand">{T("पसंद की कंपनी (अगर हो)", "Preferred brand (if any)")}</label><input id="d-brand" type="text" placeholder="जैसे सुधा / अमूल / कोई भी" data-en-ph="e.g. Sudha / Amul / any"></div>
   <div class="two">
    <div class="f"><label for="d-name">{T("आपका नाम", "Your name")}</label><input id="d-name" type="text" autocomplete="name"></div>
    <div class="f"><label for="d-phone">{T("मोबाइल", "Mobile")}</label><input id="d-phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="10 अंक" data-en-ph="10 digits"></div>
   </div>
   <div class="two">
    <div class="f"><label for="d-place">{T("गाँव / जगह", "Village / place")}</label><input id="d-place" type="text"></div>
    <div class="f"><label for="d-mode">{T("कैसे लेंगे", "Delivery or pickup")}</label><select id="d-mode"><option value="डिलीवरी चाहिए" data-en="Delivery">डिलीवरी चाहिए</option><option value="दुकान से ले जाएँगे" data-en="Pickup">दुकान से ले जाएँगे</option></select></div>
   </div>
   <div class="f"><label for="d-note">{T("और कुछ", "Anything else")}</label><textarea id="d-note"></textarea></div>
   <p class="hint" id="d-rule"></p>
   <div class="err" id="d-err" role="alert"></div>
   <button class="btn btn-wa" type="submit" style="width:100%">{icon("wa")}{T("WhatsApp पर भेजें", "Send on WhatsApp")}</button>
  </form>
  <p class="center mt">{T("मिठाई भी चाहिए?", "Need sweets too?")} <a href="/wedding/">{T("शादी व गिफ्ट — मिठाई का बड़ा ऑर्डर", "Weddings & gifts — bulk sweets")}</a></p>
 </div>
</section>'''
    return page('/bulk-dairy/', 'थोक दूध, दही, पनीर — शादी, श्राद्ध-भोज, भंडारा | MB Sweets ननौरा, दरभंगा',
                'शादी-ब्याह, श्राद्ध-ब्रह्मभोज, भंडारा और हर आयोजन के लिए थोक में दूध, दही, पनीर — सुधा, राज फ्रेश, अमृत, अमूल। 15 किलो दही पैक ₹1300–1600। कल के लिए आज 2 बजे तक ऑर्डर। ननौरा, दरभंगा।',
                body, ld=[crumbs_ld('Bulk dairy', '/bulk-dairy/')])


def notfound_page():
    body = f'''<section class="phead center"><div class="wrap">{art.fish_pair(260)}<h1>{T("यह पेज नहीं मिला", "Page not found")}</h1>
<p class="lead" style="margin:0 auto 18px">{T("शायद लिंक पुराना है। नीचे से आगे बढ़िए।", "The link may be old. Carry on from here.")}</p>
<div class="row" style="justify-content:center"><a class="btn btn-main" href="/">{T("होम पेज", "Home page")}</a><a class="btn btn-line" href="{ORDER}" data-order>{T("ऑर्डर करें", "Order")}</a></div></div></section>'''
    return page('/404.html', 'पेज नहीं मिला — MB Sweets', 'MB Sweets, ननौरा, दरभंगा', body, active='-', extra_head='<meta name="robots" content="noindex">')


# ================= write =================
def main():
    css = open(os.path.join(HERE, 'site.css'), encoding='utf-8').read()
    css = css.replace('BORDER_URI', art.border_uri()).replace('SCALES_URI', art.scales_uri()).replace('VINE_URI', art.vine_uri())
    css = css.replace('.social svg{width:22px;height:22px;fill:#FFE7B3}', '.social svg{width:22px;height:22px;stroke:#FFE7B3}')
    js = open(os.path.join(HERE, 'site.js'), encoding='utf-8').read()
    os.makedirs(OUT + '/assets', exist_ok=True)
    open(OUT + '/assets/site.css', 'w', encoding='utf-8').write(css)
    open(OUT + '/assets/site.js', 'w', encoding='utf-8').write(js)
    open(OUT + '/assets/img/lotus.svg', 'w', encoding='utf-8').write(art.lotus(140).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ', 1))
    cssv = hashlib.md5(css.encode()).hexdigest()[:8]
    jsv = hashlib.md5(js.encode()).hexdigest()[:8]
    pages = {'index.html': home(), 'sweets/index.html': sweets_page(), 'cakes/index.html': cakes_page(),
             'products/index.html': products_page(), 'wedding/index.html': wedding_page(),
             'contact/index.html': contact_page(), 'bulk-dairy/index.html': bulk_dairy_page(), '404.html': notfound_page()}
    for p, h in pages.items():
        h = add_wa_english(h.replace('CSSV', cssv).replace('JSV', jsv))
        os.makedirs(os.path.dirname(os.path.join(OUT, p)) or OUT, exist_ok=True)
        open(os.path.join(OUT, p), 'w', encoding='utf-8').write(h)
    urls = ['/', '/sweets/', '/cakes/', '/products/', '/bulk-dairy/', '/wedding/', '/contact/']
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        f'  <url><loc>{SITE}{u}</loc><lastmod>{TODAY}</lastmod></url>\n' for u in urls) + '</urlset>\n'
    open(OUT + '/sitemap.xml', 'w').write(sm)
    open(OUT + '/robots.txt', 'w').write('User-agent: *\nAllow: /\n' if PREVIEW else f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')
    open(OUT + '/.nojekyll', 'w').write('')
    print('built', list(pages))


if __name__ == '__main__':
    main()
